-- XOWAAK Prompt 5: commerce requests pipeline (orders + job applications).
-- Additive only. No production records are inserted by this migration.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('product', 'service')),
  target_id uuid not null,
  message text check (char_length(message) <= 2000),
  price_snapshot numeric(14, 2),
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.orders drop constraint if exists orders_target_reference;
alter table public.orders add constraint orders_target_reference check (
  target_id is not null and target_type in ('product', 'service')
);

create unique index if not exists orders_unique_pending
  on public.orders (requester_user_id, target_type, target_id)
  where status = 'pending';

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  message text check (char_length(message) <= 2000),
  status text not null default 'pending'
    check (status in ('pending', 'shortlisted', 'rejected', 'hired', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists job_applications_unique_pending
  on public.job_applications (applicant_user_id, job_id)
  where status = 'pending';

-- Record ownership helpers (bypass RLS so callers can resolve targets safely).

create or replace function public.order_record_owner_id(target_type text, target_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when target_type = 'product' then (select owner_user_id from public.products where id = target_id)
    when target_type = 'service' then (select provider_user_id from public.services where id = target_id)
    else null
  end;
$$;

create or replace function public.order_target_available(target_type text, target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.products as p
    where target_type = 'product' and p.id = target_id
      and public.can_view_platform_record(p.owner_user_id, p.status, p.deleted_at)
  ) or exists (
    select 1 from public.services as s
    where target_type = 'service' and s.id = target_id
      and public.can_view_platform_record(s.provider_user_id, s.status, s.deleted_at)
  );
$$;

create or replace function public.job_record_owner_id(job_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select owner_user_id from public.jobs where id = job_id;
$$;

create or replace function public.job_target_available(job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.jobs as j
    where j.id = job_id
      and public.can_view_platform_record(j.owner_user_id, j.status, j.deleted_at)
  );
$$;

revoke all on function public.order_record_owner_id(text, uuid) from public;
grant execute on function public.order_record_owner_id(text, uuid) to authenticated;
revoke all on function public.order_target_available(text, uuid) from public;
grant execute on function public.order_target_available(text, uuid) to authenticated;
revoke all on function public.job_record_owner_id(uuid) from public;
grant execute on function public.job_record_owner_id(uuid) to authenticated;
revoke all on function public.job_target_available(uuid) from public;
grant execute on function public.job_target_available(uuid) to authenticated;

-- Row level security: owners and requesters select; requesters insert.

alter table public.orders enable row level security;
alter table public.job_applications enable row level security;

create policy orders_select_own
  on public.orders for select to authenticated
  using (
    requester_user_id = auth.uid()
    or public.order_record_owner_id(target_type, target_id) = auth.uid()
  );

create policy orders_insert_own
  on public.orders for insert to authenticated
  with check (
    requester_user_id = auth.uid()
    and public.order_record_owner_id(target_type, target_id) <> auth.uid()
    and public.order_target_available(target_type, target_id)
  );

create policy job_applications_select_own
  on public.job_applications for select to authenticated
  using (
    applicant_user_id = auth.uid()
    or public.job_record_owner_id(job_id) = auth.uid()
  );

create policy job_applications_insert_own
  on public.job_applications for insert to authenticated
  with check (
    applicant_user_id = auth.uid()
    and public.job_record_owner_id(job_id) <> auth.uid()
    and public.job_target_available(job_id)
  );

-- Status transitions are enforced inside security-definer functions.

create or replace function public.update_order_status(order_id uuid, new_status text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  order_row public.orders;
  record_title text;
begin
  select * into order_row from public.orders where id = order_id;
  if order_row.id is null then
    return false;
  end if;

  if auth.uid() = order_row.requester_user_id
     and order_row.status = 'pending'
     and new_status = 'cancelled' then
    update public.orders
    set status = 'cancelled', updated_at = now(), resolved_at = now()
    where id = order_id;
    return true;
  end if;

  if auth.uid() = public.order_record_owner_id(order_row.target_type, order_row.target_id) then
    if order_row.status = 'pending' and new_status in ('accepted', 'declined') then
      update public.orders
      set status = new_status, updated_at = now(), resolved_at = now()
      where id = order_id;
      select coalesce(title, '') into record_title
      from (
        select title from public.products where id = order_row.target_id
        union all
        select title from public.services where id = order_row.target_id
      ) as records
      limit 1;
      if public.is_notification_enabled(order_row.requester_user_id, 'order') then
        insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
        values (
          order_row.requester_user_id,
          auth.uid(),
          'order',
          case when new_status = 'accepted' then 'Order accepted' else 'Order declined' end,
          record_title,
          '/orders'
        );
      end if;
      return true;
    end if;
    if order_row.status = 'accepted' and new_status = 'completed' then
      update public.orders
      set status = 'completed', updated_at = now(), resolved_at = now()
      where id = order_id;
      return true;
    end if;
  end if;

  return false;
end;
$$;

create or replace function public.update_job_application_status(application_id uuid, new_status text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  application_row public.job_applications;
  job_title text;
begin
  select * into application_row from public.job_applications where id = application_id;
  if application_row.id is null then
    return false;
  end if;

  if auth.uid() = application_row.applicant_user_id
     and application_row.status = 'pending'
     and new_status = 'withdrawn' then
    update public.job_applications
    set status = 'withdrawn', updated_at = now(), resolved_at = now()
    where id = application_id;
    return true;
  end if;

  if auth.uid() = public.job_record_owner_id(application_row.job_id) then
    if application_row.status = 'pending' and new_status in ('shortlisted', 'rejected') then
      update public.job_applications
      set status = new_status, updated_at = now(), resolved_at = now()
      where id = application_id;
      select coalesce(title, '') into job_title from public.jobs where id = application_row.job_id;
      if public.is_notification_enabled(application_row.applicant_user_id, 'application') then
        insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
        values (
          application_row.applicant_user_id,
          auth.uid(),
          'application',
          case when new_status = 'shortlisted' then 'You were shortlisted' else 'Application rejected' end,
          job_title,
          '/orders'
        );
      end if;
      return true;
    end if;
    if application_row.status = 'shortlisted' and new_status = 'hired' then
      update public.job_applications
      set status = 'hired', updated_at = now(), resolved_at = now()
      where id = application_id;
      select coalesce(title, '') into job_title from public.jobs where id = application_row.job_id;
      if public.is_notification_enabled(application_row.applicant_user_id, 'application') then
        insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
        values (
          application_row.applicant_user_id,
          auth.uid(),
          'application',
          'You were hired',
          job_title,
          '/orders'
        );
      end if;
      return true;
    end if;
  end if;

  return false;
end;
$$;

revoke all on function public.update_order_status(uuid, text) from public;
grant execute on function public.update_order_status(uuid, text) to authenticated;
revoke all on function public.update_job_application_status(uuid, text) from public;
grant execute on function public.update_job_application_status(uuid, text) to authenticated;

-- Notify the record owner when an order or application arrives.

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  record_title text;
begin
  owner_id := public.order_record_owner_id(new.target_type, new.target_id);
  if owner_id is not null
     and owner_id <> new.requester_user_id
     and public.is_notification_enabled(owner_id, 'order') then
    select coalesce(title, '') into record_title
    from (
      select title from public.products where id = new.target_id
      union all
      select title from public.services where id = new.target_id
    ) as records
    limit 1;
    insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
    values (owner_id, new.requester_user_id, 'order', 'New order request', record_title, '/orders');
  end if;
  return new;
end;
$$;

create or replace function public.notify_job_application_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  job_title text;
begin
  owner_id := public.job_record_owner_id(new.job_id);
  if owner_id is not null
     and owner_id <> new.applicant_user_id
     and public.is_notification_enabled(owner_id, 'application') then
    select coalesce(title, '') into job_title from public.jobs where id = new.job_id;
    insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
    values (owner_id, new.applicant_user_id, 'application', 'New job application', job_title, '/orders');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify_owner on public.orders;
create trigger orders_notify_owner after insert on public.orders
for each row execute function public.notify_order_created();

drop trigger if exists job_applications_notify_owner on public.job_applications;
create trigger job_applications_notify_owner after insert on public.job_applications
for each row execute function public.notify_job_application_created();

-- Allow the new notification kinds.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('follow', 'like', 'comment', 'share', 'message', 'group', 'system', 'order', 'application')
);
-- XOWAAK Prompt 2: platform domain foundations.
-- Additive only. No production records are inserted by this migration.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text check (description is null or char_length(description) <= 5000),
  category text check (category is null or char_length(category) between 1 and 120),
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  location_label text check (location_label is null or char_length(location_label) <= 240),
  latitude double precision,
  longitude double precision,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint products_coordinates_pair check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text check (description is null or char_length(description) <= 5000),
  category text check (category is null or char_length(category) between 1 and 120),
  price numeric(12, 2) check (price is null or price >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  location_label text check (location_label is null or char_length(location_label) <= 240),
  latitude double precision,
  longitude double precision,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint services_coordinates_pair check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  employer_name text check (employer_name is null or char_length(employer_name) between 1 and 180),
  description text check (description is null or char_length(description) <= 10000),
  requirements text check (requirements is null or char_length(requirements) <= 10000),
  job_type text check (job_type is null or job_type in ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'other')),
  salary_min numeric(12, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(12, 2) check (salary_max is null or salary_max >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  location_label text check (location_label is null or char_length(location_label) <= 240),
  latitude double precision,
  longitude double precision,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint jobs_salary_range check (
    salary_min is null or salary_max is null or salary_min <= salary_max
  ),
  constraint jobs_coordinates_pair check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text check (description is null or char_length(description) <= 5000),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'left', 'removed')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'product', 'service', 'job', 'group')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists products_public_created_idx
  on public.products (status, created_at desc)
  where deleted_at is null;
create index if not exists products_owner_idx on public.products (owner_user_id, created_at desc);
create index if not exists products_location_idx on public.products (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists services_public_created_idx
  on public.services (status, created_at desc)
  where deleted_at is null;
create index if not exists services_owner_idx on public.services (provider_user_id, created_at desc);
create index if not exists services_location_idx on public.services (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists jobs_public_created_idx
  on public.jobs (status, created_at desc)
  where deleted_at is null;
create index if not exists jobs_owner_idx on public.jobs (owner_user_id, created_at desc);
create index if not exists jobs_location_idx on public.jobs (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists groups_public_created_idx
  on public.groups (status, created_at desc)
  where visibility = 'public';
create index if not exists group_members_user_idx on public.group_members (user_id, status, joined_at desc);
create index if not exists group_messages_group_created_idx on public.group_messages (group_id, created_at asc);
create index if not exists favorites_user_created_idx on public.favorites (user_id, created_at desc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists group_members_set_updated_at on public.group_members;
create trigger group_members_set_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

create or replace function public.can_view_platform_record(
  record_owner_id uuid,
  record_status text,
  record_deleted_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (auth.uid() = record_owner_id)
    or (
      record_status = 'published'
      and record_deleted_at is null
      and exists (
        select 1 from public.profiles
        where id = record_owner_id and deleted_at is null
      )
    );
$$;

create or replace function public.is_group_member(
  target_group_id uuid,
  subject_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = coalesce(subject_user_id, auth.uid())
      and status = 'active'
  );
$$;

revoke all on function public.can_view_platform_record(uuid, text, timestamptz) from public;
grant execute on function public.can_view_platform_record(uuid, text, timestamptz) to anon, authenticated;
revoke all on function public.is_group_member(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.jobs enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.favorites enable row level security;

create policy products_select_visible on public.products for select to anon, authenticated
using (public.can_view_platform_record(owner_user_id, status, deleted_at));
create policy products_insert_owner on public.products for insert to authenticated
with check (owner_user_id = auth.uid());
create policy products_update_owner on public.products for update to authenticated
using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy products_delete_owner on public.products for delete to authenticated
using (owner_user_id = auth.uid());

create policy services_select_visible on public.services for select to anon, authenticated
using (public.can_view_platform_record(provider_user_id, status, deleted_at));
create policy services_insert_owner on public.services for insert to authenticated
with check (provider_user_id = auth.uid());
create policy services_update_owner on public.services for update to authenticated
using (provider_user_id = auth.uid()) with check (provider_user_id = auth.uid());
create policy services_delete_owner on public.services for delete to authenticated
using (provider_user_id = auth.uid());

create policy jobs_select_visible on public.jobs for select to anon, authenticated
using (public.can_view_platform_record(owner_user_id, status, deleted_at));
create policy jobs_insert_owner on public.jobs for insert to authenticated
with check (owner_user_id = auth.uid());
create policy jobs_update_owner on public.jobs for update to authenticated
using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy jobs_delete_owner on public.jobs for delete to authenticated
using (owner_user_id = auth.uid());

create policy groups_select_visible on public.groups for select to anon, authenticated
using (
  status = 'active'
  and (
    visibility = 'public'
    or owner_user_id = auth.uid()
    or public.is_group_member(id)
  )
);
create policy groups_insert_owner on public.groups for insert to authenticated
with check (owner_user_id = auth.uid());
create policy groups_update_owner on public.groups for update to authenticated
using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy groups_delete_owner on public.groups for delete to authenticated
using (owner_user_id = auth.uid());

create policy group_members_select_allowed on public.group_members for select to authenticated
using (
  user_id = auth.uid()
  or public.is_group_member(group_id)
  or exists (
    select 1 from public.groups
    where groups.id = group_id and groups.visibility = 'public' and groups.status = 'active'
  )
);
create policy group_members_insert_owner_admin on public.group_members for insert to authenticated
with check (
  exists (
    select 1 from public.group_members existing
    where existing.group_id = group_members.group_id
      and existing.user_id = auth.uid()
      and existing.role in ('owner', 'admin')
      and existing.status = 'active'
  )
  or exists (
    select 1 from public.groups
    where groups.id = group_members.group_id and groups.owner_user_id = auth.uid()
  )
);
create policy group_members_update_owner_admin on public.group_members for update to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.groups
    where groups.id = group_members.group_id and groups.owner_user_id = auth.uid()
  )
)
with check (user_id = auth.uid() or public.is_group_member(group_id));
create policy group_members_delete_owner_or_self on public.group_members for delete to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.groups
    where groups.id = group_members.group_id and groups.owner_user_id = auth.uid()
  )
);

create policy group_messages_select_member on public.group_messages for select to authenticated
using (public.is_group_member(group_id));
create policy group_messages_insert_member on public.group_messages for insert to authenticated
with check (sender_id = auth.uid() and public.is_group_member(group_id));
create policy group_messages_update_sender on public.group_messages for update to authenticated
using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy group_messages_delete_sender on public.group_messages for delete to authenticated
using (sender_id = auth.uid());

create policy favorites_select_owner on public.favorites for select to authenticated
using (user_id = auth.uid());
create policy favorites_insert_owner on public.favorites for insert to authenticated
with check (user_id = auth.uid());
create policy favorites_delete_owner on public.favorites for delete to authenticated
using (user_id = auth.uid());

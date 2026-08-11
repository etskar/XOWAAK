-- XOWAAK Prompt 07: profile visibility, settings privacy, and account lifecycle foundation.
-- This migration is not applied remotely in the current workspace.

alter table public.profiles
  add column if not exists location_label text
    check (location_label is null or char_length(location_label) <= 160),
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

create index if not exists profiles_visibility_idx
  on public.profiles (visibility)
  where deleted_at is null;

alter table public.user_settings
  add column if not exists discoverability text not null default 'discoverable'
    check (discoverability in ('discoverable', 'not_discoverable')),
  add column if not exists contact_privacy text not null default 'authenticated'
    check (contact_privacy in ('anyone', 'authenticated', 'nobody'));

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'cancelled', 'completed')),
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_deletion_active_user_key
  on public.account_deletion_requests (user_id)
  where status = 'requested';

create index if not exists account_deletion_user_id_idx
  on public.account_deletion_requests (user_id, requested_at desc);

drop trigger if exists account_deletion_requests_set_updated_at on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_visible
on public.profiles for select
to anon, authenticated
using (
  deleted_at is null
  and (
    visibility = 'public'
    or (select auth.uid()) = id
  )
);

alter table public.account_deletion_requests enable row level security;

create policy account_deletion_select_own
on public.account_deletion_requests for select
to authenticated
using ((select auth.uid()) = user_id);

create policy account_deletion_insert_own
on public.account_deletion_requests for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy account_deletion_update_own
on public.account_deletion_requests for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.update_own_privacy_settings(
  new_visibility text,
  new_discoverability text,
  new_contact_privacy text
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new_visibility not in ('public', 'private') then
    raise exception using errcode = '22023', message = 'Invalid profile visibility';
  end if;

  if new_discoverability not in ('discoverable', 'not_discoverable') then
    raise exception using errcode = '22023', message = 'Invalid discoverability setting';
  end if;

  if new_contact_privacy not in ('anyone', 'authenticated', 'nobody') then
    raise exception using errcode = '22023', message = 'Invalid contact privacy setting';
  end if;

  update public.profiles
  set visibility = new_visibility
  where id = auth.uid();

  if not found then
    raise exception using errcode = '42501', message = 'Profile not found';
  end if;

  insert into public.user_settings (user_id, discoverability, contact_privacy)
  values (auth.uid(), new_discoverability, new_contact_privacy)
  on conflict (user_id) do update
  set discoverability = excluded.discoverability,
      contact_privacy = excluded.contact_privacy;
end;
$$;

revoke all on function public.update_own_privacy_settings(text, text, text) from public;
grant execute on function public.update_own_privacy_settings(text, text, text) to authenticated;

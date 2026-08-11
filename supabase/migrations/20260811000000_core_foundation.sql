-- XOWAAK Prompt 05: database foundation.
-- This migration is intended for a Supabase PostgreSQL project and is not applied remotely here.

create schema if not exists private;

revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check (bucket in (
    'avatars',
    'post-media',
    'message-media',
    'product-media',
    'service-documents',
    'private-documents'
  )),
  object_path text not null,
  mime_type text not null check (length(mime_type) between 1 and 255),
  size_bytes bigint not null check (size_bytes >= 0),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_owner_path check (object_path like (owner_user_id::text || '/%')),
  unique (bucket, object_path)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null default '' check (char_length(display_name) <= 120),
  bio text check (bio is null or char_length(bio) <= 2000),
  avatar_media_id uuid references public.media_assets(id) on delete set null,
  locale text not null default 'en' check (char_length(locale) between 2 and 16),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_username_format check (
    username = lower(username)
    and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
  )
);

create unique index if not exists profiles_username_active_key
  on public.profiles (lower(username))
  where deleted_at is null;

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  locale text not null default 'en' check (char_length(locale) between 2 and 16),
  notification_preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(notification_preferences) = 'object'),
  privacy_preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(privacy_preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text check (device_name is null or char_length(device_name) <= 120),
  platform text not null default 'other' check (platform in ('web', 'ios', 'android', 'desktop', 'other')),
  push_token text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_devices_user_id_idx on public.user_devices (user_id, created_at desc);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9._-]{1,63}$'),
  label text not null check (char_length(label) between 1 and 120),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9._-]{1,127}$'),
  label text not null check (char_length(label) between 1 and 120),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists user_roles_role_id_idx on public.user_roles (role_id, user_id);

create or replace function public.has_role(requested_role text, subject_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles as ur
    join public.roles as r on r.id = ur.role_id
    where ur.user_id = coalesce(subject_user_id, auth.uid())
      and r.key = requested_role
  );
$$;

revoke all on function public.has_role(text, uuid) from public;
grant execute on function public.has_role(text, uuid) to authenticated;

create or replace function public.validate_profile_avatar_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.avatar_media_id is not null and not exists (
    select 1
    from public.media_assets as ma
    where ma.id = new.avatar_media_id
      and ma.owner_user_id = new.id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A profile avatar must belong to the profile owner';
  end if;

  return new;
end;
$$;

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

drop trigger if exists profiles_validate_avatar_owner on public.profiles;
create trigger profiles_validate_avatar_owner
before insert or update of id, avatar_media_id on public.profiles
for each row execute function public.validate_profile_avatar_owner();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists user_devices_set_updated_at on public.user_devices;
create trigger user_devices_set_updated_at
before update on public.user_devices
for each row execute function public.set_updated_at();

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists permissions_set_updated_at on public.permissions;
create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_devices enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy media_assets_select_own
on public.media_assets for select
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy media_assets_insert_own
on public.media_assets for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

create policy media_assets_update_own
on public.media_assets for update
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

create policy user_settings_select_own
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_settings_insert_own
on public.user_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy user_settings_update_own
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_devices_select_own
on public.user_devices for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_devices_insert_own
on public.user_devices for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy user_devices_update_own
on public.user_devices for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_devices_delete_own
on public.user_devices for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy roles_select_authenticated
on public.roles for select
to authenticated
using (true);

create policy permissions_select_authenticated
on public.permissions for select
to authenticated
using (true);

create policy role_permissions_select_authenticated
on public.role_permissions for select
to authenticated
using (true);

create policy user_roles_select_own_or_admin
on public.user_roles for select
to authenticated
using (
  (select auth.uid()) = user_id
  or public.has_role('admin')
  or public.has_role('super-admin')
);

create policy user_roles_insert_admin
on public.user_roles for insert
to authenticated
with check (public.has_role('admin') or public.has_role('super-admin'));

create policy user_roles_update_admin
on public.user_roles for update
to authenticated
using (public.has_role('admin') or public.has_role('super-admin'))
with check (public.has_role('admin') or public.has_role('super-admin'));

create policy user_roles_delete_admin
on public.user_roles for delete
to authenticated
using (public.has_role('admin') or public.has_role('super-admin'));

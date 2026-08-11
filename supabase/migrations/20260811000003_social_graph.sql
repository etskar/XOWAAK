-- XOWAAK Prompt 09: follow relationships and blocking.
-- This migration is not applied remotely in the current workspace.

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follows_no_self_follow check (follower_id <> following_id),
  unique (follower_id, following_id)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_no_self_block check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

create index if not exists follows_follower_status_idx
  on public.follows (follower_id, status, created_at desc);

create index if not exists follows_following_status_idx
  on public.follows (following_id, status, created_at desc);

create index if not exists blocks_blocker_idx
  on public.blocks (blocker_id, created_at desc);

create index if not exists blocks_blocked_idx
  on public.blocks (blocked_id, created_at desc);

drop trigger if exists follows_set_updated_at on public.follows;
create trigger follows_set_updated_at
before update on public.follows
for each row execute function public.set_updated_at();

create or replace function public.validate_follow_target()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.follower_id = new.following_id then
    raise exception using errcode = '23514', message = 'A user cannot follow themselves';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = new.follower_id and deleted_at is null
  ) or not exists (
    select 1 from public.profiles
    where id = new.following_id and deleted_at is null
  ) then
    raise exception using errcode = '23503', message = 'Both follow users must have active profiles';
  end if;

  return new;
end;
$$;

create or replace function public.validate_block_target()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.blocker_id = new.blocked_id then
    raise exception using errcode = '23514', message = 'A user cannot block themselves';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = new.blocker_id and deleted_at is null
  ) or not exists (
    select 1 from public.profiles
    where id = new.blocked_id and deleted_at is null
  ) then
    raise exception using errcode = '23503', message = 'Both block users must have active profiles';
  end if;

  return new;
end;
$$;

create or replace function public.is_social_blocked(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = auth.uid() and blocked_id = other_user_id)
       or (blocker_id = other_user_id and blocked_id = auth.uid())
  );
$$;

revoke all on function public.is_social_blocked(uuid) from public;
grant execute on function public.is_social_blocked(uuid) to authenticated;

create or replace function public.expected_follow_status(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p.visibility = 'private' then 'pending'
    when p.visibility = 'public' then 'accepted'
    else null
  end
  from public.profiles as p
  where p.id = target_user_id
    and p.deleted_at is null;
$$;

revoke all on function public.expected_follow_status(uuid) from public;
grant execute on function public.expected_follow_status(uuid) to authenticated;

drop trigger if exists follows_validate_target on public.follows;
create trigger follows_validate_target
before insert or update on public.follows
for each row execute function public.validate_follow_target();

drop trigger if exists blocks_validate_target on public.blocks;
create trigger blocks_validate_target
before insert or update on public.blocks
for each row execute function public.validate_block_target();

alter table public.follows enable row level security;
alter table public.blocks enable row level security;

create policy follows_select_owner_or_public
on public.follows for select
to anon, authenticated
using (
  follower_id = (select auth.uid())
  or following_id = (select auth.uid())
  or (
    status = 'accepted'
    and exists (
      select 1 from public.profiles as target_profile
      where target_profile.id = following_id
        and target_profile.visibility = 'public'
        and target_profile.deleted_at is null
    )
  )
);

create policy follows_insert_self
on public.follows for insert
to authenticated
with check (
  follower_id = (select auth.uid())
  and not public.is_social_blocked(following_id)
  and status = public.expected_follow_status(following_id)
);

create policy follows_update_recipient
on public.follows for update
to authenticated
using (following_id = (select auth.uid()))
with check (
  following_id = (select auth.uid())
  and status = 'accepted'
  and not public.is_social_blocked(follower_id)
);

create policy follows_delete_participant
on public.follows for delete
to authenticated
using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

create policy blocks_select_participant
on public.blocks for select
to authenticated
using (blocker_id = (select auth.uid()) or blocked_id = (select auth.uid()));

create policy blocks_insert_owner
on public.blocks for insert
to authenticated
with check (false);

create policy blocks_delete_owner
on public.blocks for delete
to authenticated
using (blocker_id = (select auth.uid()));

create or replace function public.create_follow(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_visibility text;
  resulting_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;

  if auth.uid() = target_user_id then
    raise exception using errcode = '23514', message = 'A user cannot follow themselves';
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = target_user_id)
       or (blocker_id = target_user_id and blocked_id = auth.uid())
  ) then
    raise exception using errcode = '42501', message = 'This relationship is blocked';
  end if;

  select visibility into target_visibility
  from public.profiles
  where id = target_user_id and deleted_at is null;

  if target_visibility is null then
    raise exception using errcode = '23503', message = 'The target profile is not active';
  end if;

  resulting_status := case when target_visibility = 'private' then 'pending' else 'accepted' end;

  insert into public.follows (follower_id, following_id, status)
  values (auth.uid(), target_user_id, resulting_status)
  on conflict (follower_id, following_id) do update
  set updated_at = now();

  select status into resulting_status
  from public.follows
  where follower_id = auth.uid()
    and following_id = target_user_id;

  return resulting_status;
end;
$$;

create or replace function public.create_block(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;

  if auth.uid() = target_user_id then
    raise exception using errcode = '23514', message = 'A user cannot block themselves';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target_user_id and deleted_at is null
  ) then
    raise exception using errcode = '23503', message = 'The target profile is not active';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), target_user_id)
  on conflict (blocker_id, blocked_id) do nothing;

  delete from public.follows
  where (follower_id = auth.uid() and following_id = target_user_id)
     or (follower_id = target_user_id and following_id = auth.uid());
end;
$$;

revoke all on function public.create_follow(uuid) from public;
grant execute on function public.create_follow(uuid) to authenticated;

revoke all on function public.create_block(uuid) from public;
grant execute on function public.create_block(uuid) to authenticated;

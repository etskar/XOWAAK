-- XOWAAK Phase 4: follow notifications and open joining for public groups.
-- Additive only. No production records are inserted by this migration.

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  follower_username text;
begin
  if new.status <> 'accepted' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'accepted' then
    return new;
  end if;

  select username into follower_username
  from public.profiles
  where id = new.follower_id;

  if follower_username is not null
     and public.is_notification_enabled(new.following_id, 'follow') then
    insert into public.notifications (recipient_id, actor_id, kind, title, target_path)
    values (
      new.following_id,
      new.follower_id,
      'follow',
      'Someone followed you',
      '/u/' || follower_username
    );
  end if;
  return new;
end;
$$;

drop trigger if exists follows_notify_follow on public.follows;
create trigger follows_notify_follow
after insert or update of status on public.follows
for each row execute function public.notify_follow();

create or replace function public.join_group(target_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  group_owner uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;

  select owner_user_id into group_owner
  from public.groups
  where id = target_group_id
    and status = 'active'
    and visibility = 'public';

  if group_owner is null then
    raise exception using errcode = '42501', message = 'This group is not open for joining';
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and status in ('active', 'invited', 'removed')
  ) then
    raise exception using errcode = '23505', message = 'Membership already exists';
  end if;

  insert into public.group_members (group_id, user_id, role, status, joined_at)
  values (target_group_id, auth.uid(), 'member', 'active', now())
  on conflict (group_id, user_id) do update
    set status = 'active', role = 'member', joined_at = now(), updated_at = now();

  if group_owner <> auth.uid()
     and public.is_notification_enabled(group_owner, 'group') then
    insert into public.notifications (recipient_id, actor_id, kind, title, target_path)
    values (
      group_owner,
      auth.uid(),
      'group',
      'Someone joined your group',
      '/groups/' || target_group_id::text
    );
  end if;
end;
$$;

revoke all on function public.join_group(uuid) from public;
grant execute on function public.join_group(uuid) to authenticated;
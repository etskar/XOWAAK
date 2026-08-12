-- XOWAAK Prompt 3: message media, group invitations, and realtime notifications.
-- Additive only. No production records are inserted by this migration.

alter table public.messages
  add column if not exists media_asset_id uuid references public.media_assets(id) on delete set null;

create or replace function public.create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  conversation_id uuid;
begin
  if auth.uid() is null or target_user_id is null or target_user_id = auth.uid() then
    raise exception using errcode = '22023', message = 'A different user is required';
  end if;
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception using errcode = '23503', message = 'Target user does not exist';
  end if;

  select own.conversation_id into conversation_id
  from public.conversation_members own
  join public.conversation_members other on other.conversation_id = own.conversation_id
  where own.user_id = auth.uid() and other.user_id = target_user_id
  limit 1;
  if conversation_id is not null then return conversation_id; end if;

  insert into public.conversations default values returning id into conversation_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (conversation_id, auth.uid()), (conversation_id, target_user_id);
  return conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create or replace function public.validate_message_media_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.media_asset_id is not null and not exists (
    select 1
    from public.media_assets
    where id = new.media_asset_id
      and owner_user_id = new.sender_id
      and bucket = 'message-media'
      and mime_type like any (array['image/%', 'video/%'])
      and status in ('pending', 'ready')
  ) then
    raise exception using errcode = '42501', message = 'Message media must belong to the sender';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_validate_media_owner on public.messages;
create trigger messages_validate_media_owner before insert or update on public.messages
for each row execute function public.validate_message_media_owner();

create or replace function public.create_group_invitation(
  target_group_id uuid,
  invited_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if not exists (
    select 1
    from public.groups g
    left join public.group_members gm on gm.group_id = g.id and gm.user_id = auth.uid() and gm.status = 'active'
    where g.id = target_group_id
      and (g.owner_user_id = auth.uid() or gm.role in ('owner', 'admin'))
  ) then
    raise exception using errcode = '42501', message = 'Only group managers can invite members';
  end if;
  if not exists (select 1 from auth.users where id = invited_user_id) then
    raise exception using errcode = '23503', message = 'Invited user does not exist';
  end if;

  insert into public.group_members (group_id, user_id, role, status)
  values (target_group_id, invited_user_id, 'member', 'invited')
  on conflict (group_id, user_id) do update
    set status = 'invited', role = 'member', updated_at = now();

  insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
  values (
    invited_user_id,
    auth.uid(),
    'group',
    'You were invited to a group',
    'Open the group to accept the invitation.',
    '/groups/' || target_group_id::text
  );
end;
$$;

revoke all on function public.create_group_invitation(uuid, uuid) from public;
grant execute on function public.create_group_invitation(uuid, uuid) to authenticated;

create or replace function public.notify_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
  select cm.user_id, new.sender_id, 'message', 'New direct message', left(new.body, 160), '/messages/' || new.conversation_id::text
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient after insert on public.messages
for each row execute function public.notify_direct_message();

create or replace function public.notify_group_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind, title, body, target_path)
  select gm.user_id, new.sender_id, 'group', 'New group message', left(new.body, 160), '/groups/' || new.group_id::text
  from public.group_members gm
  where gm.group_id = new.group_id
    and gm.user_id <> new.sender_id
    and gm.status = 'active';
  return new;
end;
$$;

drop trigger if exists group_messages_notify_members on public.group_messages;
create trigger group_messages_notify_members after insert on public.group_messages
for each row execute function public.notify_group_message();

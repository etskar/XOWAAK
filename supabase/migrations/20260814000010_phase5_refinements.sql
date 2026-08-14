-- XOWAAK Phase 5: channels, group message media, conversation muting, and chat moderation.
-- Additive only. No production records are inserted by this migration.

-- 1. Group type: social groups vs announcement channels.
alter table public.groups
  add column if not exists type text not null default 'social'
  check (type in ('social', 'channel'));

-- 2. Group message media attachments.
alter table public.group_messages
  add column if not exists media_asset_id uuid references public.media_assets(id) on delete set null;

-- 3. Conversation muting (per member).
alter table public.conversation_members
  add column if not exists muted_at timestamptz;

-- 4. Channel posting: only the owner or group managers may post in channels.
create or replace function public.can_post_group_message(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id and gm.user_id = auth.uid() and gm.status = 'active'
    where g.id = target_group_id
      and g.status = 'active'
      and (
        g.type = 'social'
        or g.owner_user_id = auth.uid()
        or gm.role in ('owner', 'admin')
      )
  );
$$;

revoke all on function public.can_post_group_message(uuid) from public;
grant execute on function public.can_post_group_message(uuid) to authenticated;

drop policy if exists group_messages_insert_member on public.group_messages;
create policy group_messages_insert_member on public.group_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.is_group_member(group_id)
  and public.can_post_group_message(group_id)
);

-- 5. Group managers may delete any message in their group.
drop policy if exists group_messages_delete_moderator on public.group_messages;
create policy group_messages_delete_moderator on public.group_messages
for delete to authenticated
using (
  exists (
    select 1
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id and gm.user_id = auth.uid() and gm.status = 'active'
    where g.id = group_messages.group_id
      and (g.owner_user_id = auth.uid() or gm.role in ('owner', 'admin'))
  )
);

-- 6. Group message media must belong to the sender (mirrors direct messages).
create or replace function public.validate_group_message_media_owner()
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

drop trigger if exists group_messages_validate_media_owner on public.group_messages;
create trigger group_messages_validate_media_owner
before insert or update on public.group_messages
for each row execute function public.validate_group_message_media_owner();

-- 7. Soft delete for group messages (sender or group manager).
create or replace function public.delete_group_message(target_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_group_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;

  select group_id into target_group_id
  from public.group_messages
  where id = target_message_id;

  if target_group_id is null then
    return;
  end if;

  if not exists (
    select 1 from public.group_messages
    where id = target_message_id and sender_id = auth.uid()
  ) and not exists (
    select 1
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id and gm.user_id = auth.uid() and gm.status = 'active'
    where g.id = target_group_id
      and (g.owner_user_id = auth.uid() or gm.role in ('owner', 'admin'))
  ) then
    raise exception using errcode = '42501', message = 'Only the sender or a group manager can delete this message';
  end if;

  update public.group_messages
  set deleted_at = now()
  where id = target_message_id;
end;
$$;

revoke all on function public.delete_group_message(uuid) from public;
grant execute on function public.delete_group_message(uuid) to authenticated;

-- 8. Muted members stop receiving direct-message notifications.
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
    and cm.user_id <> new.sender_id
    and cm.muted_at is null;
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient after insert on public.messages
for each row execute function public.notify_direct_message();
-- XOWAAK Prompt 5: notification delivery preferences.
-- Additive only. No production records are inserted by this migration.

create or replace function public.is_notification_enabled(target_user_id uuid, notification_kind text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select (us.notification_preferences ->> notification_kind)::boolean
      from public.user_settings as us
      where us.user_id = target_user_id
    ),
    true
  );
$$;

revoke all on function public.is_notification_enabled(uuid, text) from public;
grant execute on function public.is_notification_enabled(uuid, text) to authenticated;

create or replace function public.notify_post_engagement()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_author_id uuid;
  actor_id uuid;
  notification_kind text;
  notification_title text;
  target_post_id uuid;
begin
  if tg_table_name = 'post_likes' then
    post_author_id := (select author_id from public.posts where id = new.post_id);
    actor_id := new.user_id;
    notification_kind := 'like';
    notification_title := 'Someone liked your post';
    target_post_id := new.post_id;
  elsif tg_table_name = 'post_comments' then
    post_author_id := (select author_id from public.posts where id = new.post_id);
    actor_id := new.author_id;
    notification_kind := 'comment';
    notification_title := 'Someone commented on your post';
    target_post_id := new.post_id;
  else
    post_author_id := (select author_id from public.posts where id = new.post_id);
    actor_id := new.user_id;
    notification_kind := 'share';
    notification_title := 'Someone shared your post';
    target_post_id := new.post_id;
  end if;

  if post_author_id is not null
     and post_author_id <> actor_id
     and public.is_notification_enabled(post_author_id, notification_kind) then
    insert into public.notifications (recipient_id, actor_id, kind, title, target_path)
    values (post_author_id, actor_id, notification_kind, notification_title, '/posts/' || target_post_id::text);
  end if;
  return new;
end;
$$;

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
    and public.is_notification_enabled(cm.user_id, 'message');
  return new;
end;
$$;

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
    and gm.status = 'active'
    and public.is_notification_enabled(gm.user_id, 'group');
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient on public.messages;
create trigger messages_notify_recipient after insert on public.messages
for each row execute function public.notify_direct_message();

drop trigger if exists group_messages_notify_members on public.group_messages;
create trigger group_messages_notify_members after insert on public.group_messages
for each row execute function public.notify_group_message();
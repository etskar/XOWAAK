-- XOWAAK Prompt 3: interaction notifications and public author cards.
-- Additive only. No production records are inserted by this migration.

create policy profiles_select_active_public
on public.profiles for select to anon, authenticated
using (deleted_at is null);

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('follow', 'like', 'comment', 'share', 'message', 'group', 'system')
);

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

  if post_author_id is not null and post_author_id <> actor_id then
    insert into public.notifications (recipient_id, actor_id, kind, title, target_path)
    values (post_author_id, actor_id, notification_kind, notification_title, '/posts/' || target_post_id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists post_likes_notify on public.post_likes;
create trigger post_likes_notify after insert on public.post_likes
for each row execute function public.notify_post_engagement();
drop trigger if exists post_comments_notify on public.post_comments;
create trigger post_comments_notify after insert on public.post_comments
for each row execute function public.notify_post_engagement();
drop trigger if exists post_shares_notify on public.post_shares;
create trigger post_shares_notify after insert on public.post_shares
for each row execute function public.notify_post_engagement();

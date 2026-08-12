-- XOWAAK Prompt 3: interactions, messaging, notifications, and secure media associations.
-- Additive only. No production records are inserted by this migration.

alter table public.media_assets drop constraint if exists media_assets_bucket_check;
alter table public.media_assets add constraint media_assets_bucket_check check (bucket in (
  'avatars', 'post-media', 'message-media', 'product-media', 'service-documents',
  'private-documents', 'platform-media'
));

insert into storage.buckets (id, name, public)
values ('platform-media', 'platform-media', false)
on conflict (id) do update set public = false;

create policy storage_platform_objects_select_owner
on storage.objects for select to authenticated
using (bucket_id = 'platform-media' and name like ((select auth.uid())::text || '/%'));
create policy storage_platform_objects_insert_owner
on storage.objects for insert to authenticated
with check (bucket_id = 'platform-media' and name like ((select auth.uid())::text || '/%'));
create policy storage_platform_objects_update_owner
on storage.objects for update to authenticated
using (bucket_id = 'platform-media' and name like ((select auth.uid())::text || '/%'))
with check (bucket_id = 'platform-media' and name like ((select auth.uid())::text || '/%'));
create policy storage_platform_objects_delete_owner
on storage.objects for delete to authenticated
using (bucket_id = 'platform-media' and name like ((select auth.uid())::text || '/%'));

alter table public.products add column if not exists image_media_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.services add column if not exists image_media_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.jobs add column if not exists image_media_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.groups add column if not exists image_media_asset_id uuid references public.media_assets(id) on delete set null;

create or replace function public.validate_platform_media_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subject_user_id uuid;
begin
  subject_user_id := (
    case
      when tg_table_name = 'services' then to_jsonb(new)->>'provider_user_id'
      else to_jsonb(new)->>'owner_user_id'
    end
  )::uuid;
  if new.image_media_asset_id is not null and not exists (
    select 1 from public.media_assets
    where id = new.image_media_asset_id
      and owner_user_id = subject_user_id
      and bucket = 'platform-media'
      and status in ('pending', 'ready')
  ) then
    raise exception using errcode = '42501', message = 'Platform media must belong to the owner';
  end if;
  return new;
end;
$$;

drop trigger if exists products_validate_media_owner on public.products;
create trigger products_validate_media_owner before insert or update on public.products
for each row execute function public.validate_platform_media_owner();
drop trigger if exists services_validate_media_owner on public.services;
create trigger services_validate_media_owner before insert or update on public.services
for each row execute function public.validate_platform_media_owner();
drop trigger if exists jobs_validate_media_owner on public.jobs;
create trigger jobs_validate_media_owner before insert or update on public.jobs
for each row execute function public.validate_platform_media_owner();
drop trigger if exists groups_validate_media_owner on public.groups;
create trigger groups_validate_media_owner before insert or update on public.groups
for each row execute function public.validate_platform_media_owner();

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.post_shares (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_idx on public.post_likes (post_id, created_at desc);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at asc);
create index if not exists post_shares_post_idx on public.post_shares (post_id, created_at desc);

drop trigger if exists post_comments_set_updated_at on public.post_comments;
create trigger post_comments_set_updated_at before update on public.post_comments
for each row execute function public.set_updated_at();

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_shares enable row level security;

create policy post_likes_select_visible on public.post_likes for select to anon, authenticated
using (exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_likes_insert_owner on public.post_likes for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_likes_delete_owner on public.post_likes for delete to authenticated
using (user_id = auth.uid());

create policy post_comments_select_visible on public.post_comments for select to anon, authenticated
using (deleted_at is null and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_comments_insert_owner on public.post_comments for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_comments_update_owner on public.post_comments for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy post_comments_delete_owner on public.post_comments for delete to authenticated
using (author_id = auth.uid());

create policy post_shares_select_visible on public.post_shares for select to anon, authenticated
using (exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_shares_insert_owner on public.post_shares for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p.author_id, p.visibility, p.status)));
create policy post_shares_delete_owner on public.post_shares for delete to authenticated
using (user_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('follow', 'like', 'comment', 'message', 'group', 'system')),
  title text not null check (char_length(title) between 1 and 240),
  body text check (body is null or char_length(body) <= 1000),
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select_owner on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy notifications_update_owner on public.notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists conversation_members_user_idx on public.conversation_members (user_id, joined_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at asc);
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(target_conversation_id uuid, subject_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.conversation_members where conversation_id = target_conversation_id and user_id = coalesce(subject_user_id, auth.uid()));
$$;
revoke all on function public.is_conversation_member(uuid, uuid) from public;

create policy conversations_select_member on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy conversations_insert_owner on public.conversations for insert to authenticated with check (auth.uid() is not null);
create policy conversations_update_member on public.conversations for update to authenticated using (public.is_conversation_member(id)) with check (public.is_conversation_member(id));
create policy conversation_members_select_member on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id) or user_id = auth.uid());
create policy conversation_members_insert_self on public.conversation_members for insert to authenticated with check (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy conversation_members_update_self on public.conversation_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conversation_members_delete_self on public.conversation_members for delete to authenticated using (user_id = auth.uid());
create policy messages_select_member on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy messages_insert_member on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));
create policy messages_update_sender on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy messages_delete_sender on public.messages for delete to authenticated using (sender_id = auth.uid());

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages') then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end;
$$;

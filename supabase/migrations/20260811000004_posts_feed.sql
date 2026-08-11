-- XOWAAK Prompt 10: posts, post media, visibility, and feed read policies.
-- This migration is not applied remotely in the current workspace.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text,
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  status text not null default 'published' check (status in ('draft', 'published', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint posts_content_length check (content is null or char_length(content) <= 5000)
);

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  media_type text not null check (media_type in ('image', 'video')),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (post_id, media_asset_id),
  unique (post_id, position)
);

create index if not exists posts_author_status_created_idx
  on public.posts (author_id, status, created_at desc, id desc);

create index if not exists posts_feed_order_idx
  on public.posts (status, visibility, created_at desc, id desc);

create index if not exists posts_author_visibility_idx
  on public.posts (author_id, visibility, status, created_at desc, id desc);

create index if not exists post_media_post_position_idx
  on public.post_media (post_id, position);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create or replace function public.can_view_post(
  post_author_id uuid,
  post_visibility text,
  post_status text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  author_visibility text;
begin
  if post_status = 'deleted' then
    return false;
  end if;

  select visibility into author_visibility
  from public.profiles
  where id = post_author_id and deleted_at is null;

  if author_visibility is null then
    return false;
  end if;

  if auth.uid() = post_author_id then
    return true;
  end if;

  if post_status <> 'published' then
    return false;
  end if;

  if author_visibility = 'private' then
    return false;
  end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = post_author_id)
       or (blocker_id = post_author_id and blocked_id = auth.uid())
  ) then
    return false;
  end if;

  if post_visibility = 'public' then
    return true;
  end if;

  if post_visibility = 'followers' then
    return exists (
      select 1 from public.follows
      where follower_id = auth.uid()
        and following_id = post_author_id
        and status = 'accepted'
    );
  end if;

  return false;
end;
$$;

create or replace function public.can_manage_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.posts
    where id = target_post_id and author_id = auth.uid()
  );
$$;

create or replace function public.validate_post_author()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.author_id and deleted_at is null
  ) then
    raise exception using errcode = '23503', message = 'Post author must have an active profile';
  end if;

  if new.status = 'published'
     and nullif(trim(coalesce(new.content, '')), '') is null
     and not exists (select 1 from public.post_media where post_id = new.id) then
    raise exception using errcode = '23514', message = 'A published post must contain text or media';
  end if;

  return new;
end;
$$;

create or replace function public.validate_post_media_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.posts as p
    join public.media_assets as ma on ma.owner_user_id = p.author_id
    where p.id = new.post_id
      and ma.id = new.media_asset_id
      and ma.bucket = 'post-media'
      and ma.mime_type like any (array['image/%', 'video/%'])
      and ma.status in ('pending', 'ready')
  ) then
    raise exception using errcode = '42501', message = 'Post media must belong to the post author';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_validate_author on public.posts;
create trigger posts_validate_author
before insert or update on public.posts
for each row execute function public.validate_post_author();

drop trigger if exists post_media_validate_owner on public.post_media;
create trigger post_media_validate_owner
before insert or update on public.post_media
for each row execute function public.validate_post_media_owner();

create or replace function public.create_post(
  new_content text,
  new_visibility text,
  new_status text default 'published',
  new_media_asset_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_post_id uuid;
  asset_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;

  if new_visibility not in ('public', 'followers', 'private') then
    raise exception using errcode = '22023', message = 'Invalid post visibility';
  end if;

  if new_status not in ('draft', 'published') then
    raise exception using errcode = '22023', message = 'Invalid post status';
  end if;

  if new_content is not null and char_length(new_content) > 5000 then
    raise exception using errcode = '22001', message = 'Post content is too long';
  end if;

  select count(*) into asset_count
  from unnest(coalesce(new_media_asset_ids, '{}'::uuid[])) as requested_asset_id
  join public.media_assets as ma on ma.id = requested_asset_id
  where ma.owner_user_id = auth.uid()
    and ma.bucket = 'post-media'
    and ma.mime_type like any (array['image/%', 'video/%'])
    and ma.status in ('pending', 'ready');

  if asset_count <> cardinality(coalesce(new_media_asset_ids, '{}'::uuid[])) then
    raise exception using errcode = '42501', message = 'One or more post media assets are not owned by the user';
  end if;

  if new_status = 'published'
     and nullif(trim(coalesce(new_content, '')), '') is null
     and cardinality(coalesce(new_media_asset_ids, '{}'::uuid[])) = 0 then
    raise exception using errcode = '23514', message = 'A published post must contain text or media';
  end if;

  insert into public.posts (author_id, content, visibility, status)
  values (
    auth.uid(),
    nullif(trim(new_content), ''),
    new_visibility,
    case
      when new_status = 'published'
       and nullif(trim(coalesce(new_content, '')), '') is null
       and cardinality(coalesce(new_media_asset_ids, '{}'::uuid[])) > 0
        then 'draft'
      else new_status
    end
  )
  returning id into new_post_id;

  insert into public.post_media (post_id, media_asset_id, media_type, position)
  select
    new_post_id,
    ma.id,
    case when ma.mime_type like 'image/%' then 'image' else 'video' end,
    row_number() over (order by ma.id) - 1
  from public.media_assets as ma
  where ma.id = any (coalesce(new_media_asset_ids, '{}'::uuid[]));

  if new_status = 'published' then
    update public.posts
    set status = 'published'
    where id = new_post_id;
  end if;

  return new_post_id;
end;
$$;

revoke all on function public.can_view_post(uuid, text, text) from public;
grant execute on function public.can_view_post(uuid, text, text) to anon, authenticated;

revoke all on function public.can_manage_post(uuid) from public;
grant execute on function public.can_manage_post(uuid) to authenticated;

revoke all on function public.create_post(text, text, text, uuid[]) from public;
grant execute on function public.create_post(text, text, text, uuid[]) to authenticated;

alter table public.posts enable row level security;
alter table public.post_media enable row level security;

create policy posts_select_visible
on public.posts for select
to anon, authenticated
using (public.can_view_post(author_id, visibility, status));

create policy posts_insert_self
on public.posts for insert
to authenticated
with check (author_id = (select auth.uid()));

create policy posts_update_self
on public.posts for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

create policy posts_delete_self
on public.posts for delete
to authenticated
using (author_id = (select auth.uid()));

create policy post_media_select_visible
on public.post_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.posts as p
    where p.id = post_id
      and public.can_view_post(p.author_id, p.visibility, p.status)
  )
);

create policy post_media_insert_owner
on public.post_media for insert
to authenticated
with check (public.can_manage_post(post_id));

create policy post_media_update_owner
on public.post_media for update
to authenticated
using (public.can_manage_post(post_id))
with check (public.can_manage_post(post_id));

create policy post_media_delete_owner
on public.post_media for delete
to authenticated
using (public.can_manage_post(post_id));

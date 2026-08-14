-- XOWAAK Prompt 5: profile cover media support.
-- Additive only. No production records are inserted by this migration.

alter table public.media_assets drop constraint if exists media_assets_bucket_check;
alter table public.media_assets add constraint media_assets_bucket_check check (bucket in (
  'avatars', 'post-media', 'message-media', 'product-media', 'service-documents',
  'private-documents', 'platform-media', 'covers'
));

insert into storage.buckets (id, name, public)
values ('covers', 'covers', false)
on conflict (id) do update set public = false;

create policy storage_covers_objects_select_owner
on storage.objects for select to authenticated
using (bucket_id = 'covers' and name like ((select auth.uid())::text || '/%'));

create policy storage_covers_objects_insert_owner
on storage.objects for insert to authenticated
with check (bucket_id = 'covers' and name like ((select auth.uid())::text || '/%'));

create policy storage_covers_objects_update_owner
on storage.objects for update to authenticated
using (bucket_id = 'covers' and name like ((select auth.uid())::text || '/%'))
with check (bucket_id = 'covers' and name like ((select auth.uid())::text || '/%'));

create policy storage_covers_objects_delete_owner
on storage.objects for delete to authenticated
using (bucket_id = 'covers' and name like ((select auth.uid())::text || '/%'));

alter table public.profiles
  add column if not exists cover_media_id uuid references public.media_assets(id) on delete set null;

create or replace function public.validate_profile_media_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subject_user_id uuid;
begin
  subject_user_id := coalesce(new.id, auth.uid());
  if new.avatar_media_id is not null and not exists (
    select 1
    from public.media_assets as ma
    where ma.id = new.avatar_media_id
      and ma.owner_user_id = subject_user_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A profile avatar must belong to the profile owner';
  end if;
  if new.cover_media_id is not null and not exists (
    select 1
    from public.media_assets as ma
    where ma.id = new.cover_media_id
      and ma.owner_user_id = subject_user_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'A profile cover must belong to the profile owner';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_avatar_owner on public.profiles;
drop trigger if exists profiles_validate_media_owner on public.profiles;
create trigger profiles_validate_media_owner
before insert or update of id, avatar_media_id, cover_media_id on public.profiles
for each row execute function public.validate_profile_media_owner();

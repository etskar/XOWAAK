-- XOWAAK Prompt 4: synchronize the cross-table platform media trigger.
-- The deployed function must not reference provider_user_id on product/job/group rows.

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

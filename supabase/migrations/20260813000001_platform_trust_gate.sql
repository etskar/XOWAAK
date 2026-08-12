-- XOWAAK Prompt 2: enforce profile completion for platform-owned records.

create or replace function public.validate_platform_owner_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  subject_user_id uuid;
begin
  subject_user_id := case
    when tg_table_name = 'services' then new.provider_user_id
    else new.owner_user_id
  end;

  if not exists (
    select 1
    from public.profiles
    where id = subject_user_id
      and deleted_at is null
      and char_length(trim(username)) >= 3
      and char_length(trim(display_name)) >= 1
  ) then
    raise exception using
      errcode = '42501',
      message = 'Complete your profile before creating platform content';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_platform_owner_profile() from public;

drop trigger if exists products_validate_owner_profile on public.products;
create trigger products_validate_owner_profile
before insert or update on public.products
for each row execute function public.validate_platform_owner_profile();

drop trigger if exists services_validate_owner_profile on public.services;
create trigger services_validate_owner_profile
before insert or update on public.services
for each row execute function public.validate_platform_owner_profile();

drop trigger if exists jobs_validate_owner_profile on public.jobs;
create trigger jobs_validate_owner_profile
before insert or update on public.jobs
for each row execute function public.validate_platform_owner_profile();

drop trigger if exists groups_validate_owner_profile on public.groups;
create trigger groups_validate_owner_profile
before insert or update on public.groups
for each row execute function public.validate_platform_owner_profile();

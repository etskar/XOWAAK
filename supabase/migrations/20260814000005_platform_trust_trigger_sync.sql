-- XOWAAK Prompt 4: synchronize the cross-table profile trust trigger.
-- The deployed function must not reference provider_user_id on product/job/group rows.

create or replace function public.validate_platform_owner_profile()
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

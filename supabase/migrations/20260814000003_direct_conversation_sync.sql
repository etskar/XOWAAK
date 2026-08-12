-- XOWAAK Prompt 4: synchronize the direct-conversation RPC with the deployed schema.
-- The original Prompt 3 migration was already recorded remotely before this function
-- was added locally, so this additive migration restores the code/database contract.

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

-- XOWAAK Prompt 4: fix infinite RLS recursion on group_members inserts.
-- The insert policy previously self-referenced public.group_members inside its
-- WITH CHECK, which Postgres rejects with error 42P17. The check now delegates
-- to a security-definer helper so the policy never queries its own table.

create or replace function public.is_group_owner_or_admin(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and status = 'active'
  );
$$;

revoke all on function public.is_group_owner_or_admin(uuid) from public;
grant execute on function public.is_group_owner_or_admin(uuid) to authenticated;

drop policy if exists group_members_insert_owner_admin on public.group_members;
create policy group_members_insert_owner_admin on public.group_members for insert to authenticated
with check (
  public.is_group_owner_or_admin(group_members.group_id)
  or exists (
    select 1 from public.groups
    where groups.id = group_members.group_id and groups.owner_user_id = auth.uid()
  )
);
-- Owner logic: orgs.owner_id — only owner can rename/delete org.
-- Non-owner admins keep invite/manage-team but lose edit/delete on org itself.

alter table orgs add column owner_id uuid references auth.users(id);

-- Backfill: earliest admin per org becomes owner (best guess for existing orgs).
update orgs o
set owner_id = sub.user_id
from (
  select distinct on (org_id) org_id, user_id
  from org_members
  where role = 'admin'
  order by org_id, created_at asc
) sub
where sub.org_id = o.id
and o.owner_id is null;

create or replace function public.is_org_owner(check_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from orgs o
    where o.id = check_org_id and o.owner_id = auth.uid()
  );
$$;

-- create_org: creator becomes owner, not just admin.
create or replace function public.create_org(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  existing_org_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('create_org:' || auth.uid()::text));

  select org_id into existing_org_id
  from org_members
  where user_id = auth.uid()
  limit 1;
  if existing_org_id is not null then
    return existing_org_id;
  end if;

  insert into orgs (name, owner_id) values (p_name, auth.uid()) returning id into new_org_id;
  insert into org_members (org_id, user_id, role) values (new_org_id, auth.uid(), 'admin');
  return new_org_id;
end;
$$;

-- orgs update/delete: owner-only (was admin-only).
drop policy if exists "orgs_update_admin" on orgs;
create policy "orgs_update_owner" on orgs
  for update using (is_org_owner(id));

create policy "orgs_delete_owner" on orgs
  for delete using (is_org_owner(id));

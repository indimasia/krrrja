-- Platform super admin can suspend an org. Suspended orgs keep their data but
-- staff are blocked from the app (enforced in getOrgContext consumers + admin
-- layout). Written only via service role (no RLS policy grants org members
-- UPDATE on this column beyond the existing orgs_update_admin policy — that
-- policy allows admins to update their own org row, so guard the column).

alter table orgs add column suspended_at timestamptz;

-- Prevent org admins from un-suspending themselves through the orgs UPDATE
-- policy: a trigger rejects changes to suspended_at unless made by service role.
create or replace function public.protect_suspended_at()
returns trigger
language plpgsql
as $$
begin
  if new.suspended_at is distinct from old.suspended_at
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'suspended_at can only be changed by the platform';
  end if;
  return new;
end;
$$;

create trigger orgs_protect_suspended_at
  before update on orgs
  for each row
  execute function public.protect_suspended_at();

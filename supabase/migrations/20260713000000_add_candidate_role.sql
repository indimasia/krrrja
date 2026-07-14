-- Add 'candidate' to the org_members role enum (was: admin, member).
-- Candidates are login users tied to an org via a membership row.
alter table org_members drop constraint org_members_role_check;

alter table org_members
  add constraint org_members_role_check
  check (role in ('admin', 'member', 'candidate'));

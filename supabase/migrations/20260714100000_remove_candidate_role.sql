-- Corrective migration: remove the 'candidate' org_members role.
--
-- Migration 20260713000000_add_candidate_role.sql widened the role check to
-- ('admin', 'member', 'candidate') on the mistaken assumption that candidates
-- are login users. Per product spec they are NOT platform users — candidates
-- exist only as data rows in the `candidates` table (scoped by job_opening_id
-- + org_id), with no relation to authentication or org membership.
--
-- 20260713000000 is already applied to remote, so we roll forward with this
-- corrective migration rather than editing/deleting the old file.

-- Any org_members row with role 'candidate' was never a valid membership under
-- the corrected model. Remove them so the tightened constraint can apply.
-- (No signup/invite path ever issued this role, so this is expected to be a
-- no-op in every environment; kept for safety on any env where it was set.)
delete from org_members where role = 'candidate';

alter table org_members drop constraint org_members_role_check;

alter table org_members
  add constraint org_members_role_check
  check (role in ('admin', 'member'));

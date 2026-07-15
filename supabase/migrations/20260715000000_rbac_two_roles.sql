-- RBAC tightening for the final two-role model (admin | member).
--
-- 1. job_openings UPDATE was member-wide; spec says only org admins may
--    edit/close openings. Recruiters keep SELECT only.
-- 2. candidates INSERT checked org membership but not that the target
--    job_opening belongs to the same org — a member could attach a candidate
--    row to another org's job id. Require the parent opening to be in the
--    same org as the row being inserted.

drop policy "job_openings_update_member" on job_openings;

create policy "job_openings_update_admin" on job_openings
  for update using (is_org_admin(org_id))
  with check (is_org_admin(org_id));

drop policy "candidates_insert_member" on candidates;

create policy "candidates_insert_member" on candidates
  for insert with check (
    is_org_member(org_id)
    and exists (
      select 1 from job_openings j
      where j.id = candidates.job_opening_id
        and j.org_id = candidates.org_id
    )
  );

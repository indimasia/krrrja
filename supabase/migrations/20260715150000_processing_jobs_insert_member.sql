-- processing_jobs: allow org members to queue a pending job for a candidate in
-- their org. The upload action (lib/actions/candidates.ts) inserts the initial
-- 'pending' row via the user-scoped client; only service_role had write access,
-- so the insert failed RLS ("new row violates row-level security policy").
-- Worker updates still run as service_role via processing_jobs_all_service.
create policy "processing_jobs_insert_member" on processing_jobs
  for insert with check (
    exists (
      select 1 from candidates c
      where c.id = processing_jobs.candidate_id and is_org_member(c.org_id)
    )
  );

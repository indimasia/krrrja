-- Private Storage bucket for original CV PDFs (PII — never public).
-- Object path convention: {org_id}/{candidate_id}.pdf
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Supersede prior policies from 20260713090000_cv_storage.sql: that file's
-- delete policy (is_org_admin) OR's with this file's (is_org_member) since
-- Postgres unions multiple permissive policies for the same command,
-- loosening delete to any member. Drop the old names so this file wins clean.
drop policy if exists "cvs_select_member" on storage.objects;
drop policy if exists "cvs_insert_member" on storage.objects;
drop policy if exists "cvs_delete_admin" on storage.objects;

-- Org-scoped access: a user may touch a CV object only if the first path
-- segment (the org_id) is an org they belong to. is_org_member is security
-- definer (see init schema). service_role bypasses RLS entirely (worker path).
create policy "cvs_select_org_member" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "cvs_insert_org_member" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "cvs_update_org_member" on storage.objects
  for update using (
    bucket_id = 'cvs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "cvs_delete_org_member" on storage.objects
  for delete using (
    bucket_id = 'cvs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

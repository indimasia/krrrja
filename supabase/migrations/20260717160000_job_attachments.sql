-- Optional file attachment on a job opening (e.g. full JD document).
alter table public.job_openings
  add column attachment_path text,
  add column attachment_name text;

-- Private bucket, org-scoped like 'cvs'. Path convention: {org_id}/{job_id}/{filename}
insert into storage.buckets (id, name, public)
values ('job-attachments', 'job-attachments', false)
on conflict (id) do nothing;

create policy "job_attachments_select_org_member" on storage.objects
  for select using (
    bucket_id = 'job-attachments'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

-- Writes are admin-only: attachments belong to job openings, which only
-- admins manage (canManageJobOpenings).
create policy "job_attachments_insert_org_admin" on storage.objects
  for insert with check (
    bucket_id = 'job-attachments'
    and is_org_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "job_attachments_update_org_admin" on storage.objects
  for update using (
    bucket_id = 'job-attachments'
    and is_org_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "job_attachments_delete_org_admin" on storage.objects
  for delete using (
    bucket_id = 'job-attachments'
    and is_org_admin(((storage.foldername(name))[1])::uuid)
  );

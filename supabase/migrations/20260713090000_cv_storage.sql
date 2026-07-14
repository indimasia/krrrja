-- Private bucket for original CV PDFs. Path convention: {org_id}/{candidate_id}.pdf
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- storage.objects has no org_id column — scope via first path segment (foldername).
create policy "cvs_select_member" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "cvs_insert_member" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "cvs_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'cvs'
    and is_org_admin((storage.foldername(name))[1]::uuid)
  );

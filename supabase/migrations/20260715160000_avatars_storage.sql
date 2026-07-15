-- Public Storage bucket for user profile photos.
-- Object path convention: {user_id}/avatar.{ext} — first path segment is the
-- owner's auth.uid(), enforced by the policies below.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone may read (bucket is public anyway — this covers authenticated reads
-- through the API path).
create policy "avatars_select_all" on storage.objects
  for select using (bucket_id = 'avatars');

-- Only the owner may write inside their own folder.
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

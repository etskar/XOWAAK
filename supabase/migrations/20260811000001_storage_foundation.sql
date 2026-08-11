-- XOWAAK Prompt 05: private storage buckets and owner-scoped object policies.
-- No upload flow is implemented by this migration.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('post-media', 'post-media', false),
  ('message-media', 'message-media', false),
  ('product-media', 'product-media', false),
  ('service-documents', 'service-documents', false),
  ('private-documents', 'private-documents', false)
on conflict (id) do update set public = false;

create policy storage_objects_select_owner
on storage.objects for select
to authenticated
using (
  bucket_id in ('avatars', 'post-media', 'message-media', 'product-media', 'service-documents', 'private-documents')
  and name like ((select auth.uid())::text || '/%')
);

create policy storage_objects_insert_owner
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'post-media', 'message-media', 'product-media', 'service-documents', 'private-documents')
  and name like ((select auth.uid())::text || '/%')
);

create policy storage_objects_update_owner
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'post-media', 'message-media', 'product-media', 'service-documents', 'private-documents')
  and name like ((select auth.uid())::text || '/%')
)
with check (
  bucket_id in ('avatars', 'post-media', 'message-media', 'product-media', 'service-documents', 'private-documents')
  and name like ((select auth.uid())::text || '/%')
);

create policy storage_objects_delete_owner
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'post-media', 'message-media', 'product-media', 'service-documents', 'private-documents')
  and name like ((select auth.uid())::text || '/%')
);

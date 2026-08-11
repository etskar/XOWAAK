# Migrations

Prompt 05 migrations are the PostgreSQL schema source of truth. Apply them through the Supabase
CLI or a reviewed CI migration workflow. Do not edit the remote database manually.

Current migrations:

- `20260811000000_core_foundation.sql` creates identity, media, roles, permissions, timestamps,
  and baseline RLS.
- `20260811000001_storage_foundation.sql` creates private storage buckets and owner-scoped object
  policies.
- `20260811000002_profile_settings_lifecycle.sql` adds profile visibility, location metadata,
  privacy settings, account deletion requests, and the privacy update function.
- `20260811000003_social_graph.sql` adds follows, blocks, social relationship policies, and
  transaction-safe follow/block functions.

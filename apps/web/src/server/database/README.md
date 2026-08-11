# Server Database Boundary

Prompt 05 keeps database access behind the Supabase adapters in `src/server/supabase/`. No route
currently queries the database. Future repositories should use the generated `Database` type and
must preserve RLS as a defense layer.

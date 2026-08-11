# Supabase Server Boundary

This boundary contains server-only Supabase adapters:

- `client.ts` creates a cookie-aware server client using the publishable key.
- `admin.ts` creates a service-role client only when explicitly called on the server.
- `types.ts` re-exports the generated database type contract.

No adapter is imported by a product route in Prompt 05. No authentication workflow is implemented.

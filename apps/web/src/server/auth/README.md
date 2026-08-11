# Server Authentication Boundary

Prompt 06 provides the server session and role guard utilities in `session.ts`. They use
Supabase Auth through the server Supabase client, return `null` when configuration is unavailable,
and never expose service-role credentials to browser code.

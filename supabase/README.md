# Supabase Foundation

Prompt 05 adds versioned PostgreSQL migrations, private storage conventions, RLS policies, and a
development-only role and permission seed. No remote Supabase project is linked or modified.

## Local Workflow

Install the Supabase CLI separately, then start a local project:

```bash
supabase start
supabase db reset
```

The migrations in `supabase/migrations/` are the schema source of truth. The seed file does not
create users or production data.

## Types

After a local Supabase project is running, generate database types with:

```bash
pnpm supabase:types
```

The command requires the Supabase CLI and writes the official generated output to
`apps/web/src/types/database.ts`. Prompt 05 does not claim generated types until that command is
run against a real local or remote schema.

## Environment

Copy `apps/web/.env.example` only when a real project is available. The publishable key may be
used by browser-safe code. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be committed
or imported by a client component.

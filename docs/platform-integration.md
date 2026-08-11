# Platform Integration

## Local Environment

Run the project from the repository root with Node.js 20.9 or newer and pnpm 11:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The web app starts at `http://localhost:3000` and redirects `/` to `/en`.

## Supabase

Copy `apps/web/.env.example` only after a real Supabase project is available. Required values are:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The service-role key is server-only and must never use the `NEXT_PUBLIC_` prefix. Migrations are
versioned under `supabase/migrations/`. Never run a destructive reset against production.

After installing the Supabase CLI and starting a safe local project:

```bash
supabase start
supabase db reset
pnpm supabase:types
```

## Vercel

Connect the existing GitHub repository to Vercel with the application root set to:

```text
apps/web
```

Configure the public Supabase variables for Development, Preview, and Production. Configure the
service-role variable only as a server-side Vercel environment variable. Do not add credentials to
Git or preview source files.

## GitHub

The repository currently has no configured remote. Add the approved GitHub remote only when the
repository URL is known. Do not rewrite history or commit unrelated work as part of integration.

# Platform Integration

## Status

- GitHub: connected — `https://github.com/etskar/XOWAAK.git`, default branch `main`.
- Vercel: connected — project `etskar1/xowaak` (ID `prj_J9mvfPn2R6yakoIoI1PwzEZsMvk4`), auto-deploy from `main`.
  Project settings: Root Directory `apps/web`, Framework Next.js, Build Command `next build`,
  Install Command `pnpm install --frozen-lockfile`.
- Supabase: project reference `jareawpuydpcudytcebl` is synchronized with the five repository
  migrations. Local app configuration contains the public URL, publishable key, and server-only
  service-role key; the same variables are configured in the existing Vercel project for its
  Development/Preview/Production environments. Values are never committed or printed.

## Local Environment

Run the project from the repository root with Node.js 20.9 or newer and pnpm 11:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The web app starts at `http://localhost:3000` and redirects `/` to `/en`.

## Supabase

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill the real values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The service-role key is server-only and must never use the `NEXT_PUBLIC_` prefix. Migrations are
versioned under `supabase/migrations/`. Never run a destructive reset against production.

After installing/authenticating the Supabase CLI and linking the project:

```bash
supabase link --project-ref jareawpuydpcudytcebl
supabase db push
pnpm supabase:types
```

Type generation requires Docker/Podman for the database-url fallback used by the local script, or
an authenticated linked-project CLI workflow. The application deliberately keeps the placeholder
types until official generation succeeds.

## Vercel

The GitHub repository is connected to Vercel with the application root set to `apps/web` and the
Next.js preset enabled. Configure the public Supabase variables for Development, Preview, and
Production. Configure the service-role variable only as a server-side Vercel environment variable.
Do not add credentials to Git or preview source files.

## GitHub

Remote: `https://github.com/etskar/XOWAAK.git`, default branch `main`. Do not rewrite history or
commit unrelated work as part of integration.

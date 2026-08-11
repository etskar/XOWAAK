# XOWAAK

XOWAAK is a mobile-first digital ecosystem being built with a modular, scalable architecture.

## Architecture Approach

The project starts as a modular monolith. Domain boundaries, typed application contracts, and
event-driven seams are established before individual product domains are implemented.

The current repository contains the foundation through Prompt 10. Supabase migrations and server
boundaries are present, but a real Supabase project, GitHub remote, and Vercel project must be
configured separately.

## Technology Stack

- Next.js App Router
- React and TypeScript with strict mode
- pnpm workspace
- Tailwind CSS foundation with CSS custom properties
- ESLint and Prettier
- Vitest and Testing Library
- Playwright
- Supabase PostgreSQL, Auth, Storage, and RLS foundation

## Requirements

- Node.js 20.9 or newer
- pnpm 11 or newer

If pnpm is managed by Corepack, run `corepack enable` once before installing dependencies.

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The web application is available at `http://localhost:3000`; `/` redirects to `/en`.

## Quality and Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm format:check
```

## Build

```bash
pnpm build
pnpm start
```

## Project Structure

```text
apps/web/       Next.js application
packages/       Shared package boundaries
  supabase/       Migrations, local configuration, and seed foundation
```

The detailed domain and delivery roadmap is defined by the approved Phase 01 architecture plan.

## Environment Configuration

`apps/web/.env.example` documents the public Supabase URL and publishable key plus the server-only
service-role key. No real values are stored in the repository. See `docs/platform-integration.md`
for local Supabase, GitHub, and Vercel setup guidance.

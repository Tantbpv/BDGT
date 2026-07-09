# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start Next.js dev server (Turbopack) for apps/web
pnpm build            # Build all packages via Turborepo
pnpm lint             # ESLint across all packages
pnpm type-check       # tsc --noEmit across all packages
pnpm format           # Prettier across .ts, .tsx, .md, .json

# Database
pnpm db:up            # Start PostgreSQL + pgAdmin via Docker Compose
pnpm db:down          # Stop Docker containers
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:push          # prisma db push (schema push without migration)
pnpm db:seed          # Run packages/database/prisma/seed.ts
pnpm db:ui            # Open Prisma Studio

# Tests (no test files exist yet — post-MVP milestone)
pnpm test
```

All commands run via Turborepo (`turbo.json`) and respect task dependencies. Run individual workspace commands with `pnpm --filter @repo/<name> <script>`.

## Architecture

BDGT is a personal finance budgeting app structured as a **pnpm + Turborepo monorepo**. The current MVP is a Next.js 15 (App Router) fullstack app. The architecture is explicitly designed to evolve toward NestJS microservices — stubs exist at `apps/api-gateway`, `apps/service-users`, `apps/service-ai`, `apps/service-transactions` (all empty `.gitkeep` files for now).

### Workspace layout

```
apps/web/           # Active: Next.js 15 App Router — frontend + MVP API gateway
packages/
  auth/             # JWT sign/verify via jose; exports REFRESH_TOKEN_COOKIE constant
  config/           # Zod-validated env parser (parseEnv()); throws on bad env
  contracts/        # Shared Zod schemas + TS types; the single source of truth for all DTOs
  database/         # Prisma client singleton (globalThis pattern) + schema + seed
  eslint-config/    # Shared ESLint 9 flat configs: base / next / library
  logger/           # Pino factory: createLogger() + default logger instance
  tsconfig/         # Shared TS configs: base / nextjs / library / nestjs
  utils/            # Pure helpers: date formatting + money (formatCurrency, toCents, fromCents)
  ui/               # Placeholder React component library (exports nothing yet)
```

### apps/web internals

- **`src/app/(auth)/`** — unauthenticated routes: `/login`, `/register`
- **`src/app/(private)/`** — authenticated routes: `/dashboard`, `/transactions`, `/transactions/[id]`, `/labels`, `/settings`
- **`src/app/api/v1/`** — Next.js Route Handlers acting as the MVP API gateway. Auth, transactions, categories, and users endpoints are scaffolded with Zod validation but **all return `501 NOT_IMPLEMENTED`** — business logic is the next implementation milestone.
- **`src/features/`** — thin domain modules that re-export from `@repo/contracts`; `dashboard/types.ts` has a local `DashboardStats` type not yet in contracts.
- **`src/shared/lib/api-client.ts`** — base fetch wrapper (`apiGet`, `apiPost`, etc.) with `ApiClientError`.

### Data model key points

Prisma schema is at `packages/database/prisma/schema.prisma`. Key relationships:

- `User ↔ Account` is **many-to-many** via `UserAccount` join table (shared accounts are modeled, though listed as post-MVP).
- `Transaction` and `Category` are scoped to `Account`, not directly to `User`.
- `TransactionType` enum: `INCOME | EXPENSE`.

### Contracts package (`@repo/contracts`)

This is the source of truth for all request/response shapes. It uses sub-path exports:

```ts
import { LoginRequestSchema } from '@repo/contracts/auth';
import { TransactionType } from '@repo/contracts/transactions';
import { ApiResponse } from '@repo/contracts/common';
```

### Environment

The root `.env` file is shared by all apps. `apps/web` loads it via `dotenv -e ../../.env` in its dev script. Required variables: `DATABASE_URL`, `JWT_ACCESS_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars), `JWT_ACCESS_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`), `NODE_ENV`, `LOG_LEVEL`. See `.env.example` for defaults.

### Code conventions

- ESLint enforces `max-params: 3`, `no-nested-ternary`, `no-else-return`, and strict import ordering via `simple-import-sort`.
- TypeScript strict mode with `noUncheckedIndexedAccess` — array/map accesses return `T | undefined`.
- The codebase uses `categories` throughout (routes, feature folders, contracts). `labels` appears only in documentation and UI nav text — treat them as the same thing.
- NestJS tsconfig (`nestjs.json`) uses `experimentalDecorators: true` and `emitDecoratorMetadata: true` for future service packages.

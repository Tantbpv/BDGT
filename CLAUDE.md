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

All commands run via Turborepo (`turbo.json`) and respect task dependencies.

## Architecture

BDGT is a personal finance budgeting app structured as a **pnpm + Turborepo monorepo**.

### Workspace layout

```
apps/web/           # Active: Next.js 16 App Router — frontend + MVP API gateway
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

### Contracts package (`@repo/contracts`)

This is the source of truth for all request/response shapes. It uses sub-path exports:

```ts
import { LoginRequestSchema } from '@repo/contracts/auth';
import { TransactionType } from '@repo/contracts/transactions';
import { ApiResponse } from '@repo/contracts/common';
```

### Environment

The root `.env` file is shared by all apps. `apps/web` loads it via `dotenv -e ../../.env` in its dev script. Required variables: `DATABASE_URL`, `JWT_ACCESS_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars), `JWT_ACCESS_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`), `NODE_ENV`, `LOG_LEVEL`. See `.env.example` for defaults.
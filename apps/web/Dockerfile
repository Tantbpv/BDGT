FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Stage: deps ───────────────────────────────────────────────────────────────
# Copy only package manifests first so this layer is invalidated only when
# dependencies change, not on every source edit.
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json                ./apps/web/
COPY packages/auth/package.json           ./packages/auth/
COPY packages/config/package.json         ./packages/config/
COPY packages/contracts/package.json      ./packages/contracts/
COPY packages/database/package.json       ./packages/database/
COPY packages/eslint-config/package.json  ./packages/eslint-config/
COPY packages/logger/package.json         ./packages/logger/
COPY packages/tsconfig/package.json       ./packages/tsconfig/
COPY packages/ui/package.json             ./packages/ui/
COPY packages/utils/package.json          ./packages/utils/

RUN pnpm install --frozen-lockfile

# ── Stage: builder ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Bring installed node_modules + manifests from deps, then overlay full source.
# .dockerignore excludes **/node_modules so the source overlay never clobbers deps.
COPY --from=deps /app ./
COPY . .

# Placeholder .env at monorepo root — satisfies `dotenv -e ../../.env` used in
# build scripts. These values are never baked into any output; real secrets are
# injected at runtime via env_file in docker-compose.
RUN printf '%s\n' \
  'NODE_ENV=production' \
  'DATABASE_URL=postgresql://build:build@build:5432/build' \
  'JWT_ACCESS_SECRET=build-time-placeholder-minimum-32-characters' \
  'JWT_REFRESH_SECRET=build-time-placeholder-minimum-32-characters' \
  'JWT_ACCESS_EXPIRES_IN=15m' \
  'JWT_REFRESH_EXPIRES_IN=7d' \
  'LOG_LEVEL=info' \
  > .env

RUN pnpm --filter @repo/database run db:generate
RUN pnpm --filter @repo/web run build

# ── Stage: migrator ───────────────────────────────────────────────────────────
# Lean image — only the Prisma CLI + schema + migrations directory.
# Used as a one-shot service in docker-compose.prod.yml (restart: "no").
FROM base AS migrator
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/database/prisma ./packages/database/prisma

CMD ["node_modules/.bin/prisma", "migrate", "deploy", "--schema", "packages/database/prisma/schema.prisma"]

# ── Stage: runner ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output mirrors the monorepo workspace layout so server.js lives at
# apps/web/server.js inside the copied tree.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public            ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]

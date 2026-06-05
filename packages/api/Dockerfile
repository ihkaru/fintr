# ── Stage 1: Install dependencies ─────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy monorepo root manifests (layer cache: only reinstall if these change)
COPY package.json bun.lock ./

# Bun workspaces: must have ALL workspace package.json files before install
COPY packages/api/package.json ./packages/api/
COPY apps/client/package.json ./apps/client/

# Install all workspace deps (frozen = reproducible builds)
RUN bun install --frozen-lockfile

# Copy API source after install (avoids reinstalling deps on every source change)
COPY packages/api/src ./packages/api/src
COPY packages/api/drizzle ./packages/api/drizzle
COPY packages/api/drizzle.config.ts ./packages/api/drizzle.config.ts
COPY packages/api/tsconfig.json ./packages/api/tsconfig.json

# ── Stage 2: Lean production image ────────────────────────────────
FROM oven/bun:1

WORKDIR /app

# Copy only the built output from builder (keeps image lean)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/api ./packages/api

# Create persistent asset directories (receipts & avatars)
# Mount a Coolify Persistent Volume to /app/packages/api/public to survive redeploys
RUN mkdir -p packages/api/public/receipts packages/api/public/avatars

WORKDIR /app/packages/api

EXPOSE 3001

# Default: run directly. Override in Coolify with "bun run start:prod" to also run migrations.
CMD ["bun", "run", "src/index.ts"]

# ── Stage 1: Install dependencies ─────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy monorepo root files
COPY package.json bun.lock ./

# Copy API package manifest first (layer cache optimization)
COPY packages/api/package.json ./packages/api/

# Install all workspace deps
RUN bun install --frozen-lockfile

# Copy API source files
COPY packages/api/src ./packages/api/src
COPY packages/api/drizzle ./packages/api/drizzle
COPY packages/api/drizzle.config.ts ./packages/api/drizzle.config.ts

# ── Stage 2: Production image ─────────────────────────────────────
FROM oven/bun:1

WORKDIR /app

# Copy installed deps + source from builder
COPY --from=builder /app ./

# Create persistent asset directories
RUN mkdir -p packages/api/public/receipts packages/api/public/avatars

WORKDIR /app/packages/api

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]

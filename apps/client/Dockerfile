# ── Stage 1: Build Vue app ────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy monorepo root manifests (layer cache optimization)
COPY package.json bun.lock ./

# Bun workspaces: must have ALL workspace package.json files before install
COPY apps/client/package.json ./apps/client/
COPY packages/api/package.json ./packages/api/

# Install all workspace deps
RUN bun install --frozen-lockfile

# Copy source files after install
COPY apps/client/ ./apps/client/
COPY packages/ ./packages/

# Inject production API URL at build time
# Set this as a Build Variable in Coolify: VITE_API_URL=https://fintr-api.dvlpid.my.id/api
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN cd apps/client && bun run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────
FROM nginx:alpine

# Copy built static files only (no node_modules, no source)
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# SPA routing + cache headers
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

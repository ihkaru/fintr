# ── Stage 1: Build Vue app ────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy monorepo root
COPY package.json bun.lock ./

# Copy package manifests for workspace resolution
COPY apps/client/package.json ./apps/client/
COPY packages/api/package.json ./packages/api/

# Install all workspace deps
RUN bun install --frozen-lockfile

# Copy source files
COPY apps/client/ ./apps/client/
COPY packages/ ./packages/

# Build Vite production bundle
# VITE_API_URL is injected as a build-time arg by Coolify
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN cd apps/client && bun run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Native modules (better-sqlite3, bcrypt) require build tools
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Enable pnpm (version pinned to match packageManager field)
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Install dependencies first (layer-cached unless lockfile changes)
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm build

# ─── Runtime stage ────────────────────────────────────────────────────────────
# Same Node.js major + OS as builder so better-sqlite3 native binary matches
FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# SQLite data directory (mounted as volume in production)
RUN mkdir -p /app/data

# Nitro server output
COPY --from=builder /app/.output ./.output

# Migration files are loaded at runtime via process.cwd() + "/migrations"
COPY --from=builder /app/migrations ./migrations

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:3000/api/health >/dev/null 2>&1 || \
      curl -sf http://localhost:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", ".output/server/index.mjs"]

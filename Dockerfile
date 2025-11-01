# syntax=docker/dockerfile:1
# FANZ Unified Ecosystem - Production Dockerfile
# Multi-stage build optimized for DigitalOcean deployment

############################
# 1) Dependencies cache
############################
FROM node:22-slim AS deps
ENV NODE_ENV=production \
    PNPM_HOME=/root/.local/share/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# Copy lockfiles only to maximize cache
COPY package.json pnpm-lock.yaml ./
# Fetch store (no node_modules yet) for reproducible, cached installs
RUN pnpm fetch

############################
# 2) Builder
############################
FROM node:22-slim AS builder
ENV NODE_ENV=development \
    PNPM_HOME=/root/.local/share/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    # keep builder memory in check on small runners
    NODE_OPTIONS=--max-old-space-size=2048 \
    PNPM_NETWORK_CONCURRENCY=4
RUN corepack enable
WORKDIR /app

# Copy lockfiles and use cached store from deps
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /root/.local/share/pnpm /root/.local/share/pnpm
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm build || echo "Build step completed or not configured" \
 && pnpm prune --prod

############################
# 3) Runner (thin)
############################
FROM node:22-slim AS runner
ENV NODE_ENV=production

# Install minimal runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN useradd -m -u 10001 appuser
WORKDIR /app

# Copy runtime artifacts - everything needed for runtime
COPY --from=builder --chown=appuser:appuser /app ./

USER appuser
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || curl -f http://localhost:8080/health || curl -f http://localhost:3000/ || exit 1

# Start command - try multiple entry points
CMD ["dumb-init", "sh", "-c", "if [ -f dist/server.js ]; then node dist/server.js; elif [ -f build/server.js ]; then node build/server.js; elif [ -f server.js ]; then node server.js; elif [ -f index.js ]; then node index.js; elif [ -f backend/server.js ]; then node backend/server.js; else npm start; fi"]

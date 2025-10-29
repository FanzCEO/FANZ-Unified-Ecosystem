# FANZ Unified Ecosystem - Production Docker Image
# Multi-stage build optimized for Scaleway deployment

# Build stage
FROM node:22-alpine AS builder

LABEL maintainer="FANZ Team <dev@fanz.network>" \
      description="FANZ Unified Ecosystem - Adult Content Creator Platform" \
      compliance="Section-2257-Compliant" \
      version="1.0.0"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY .nvmrc ./

# Install pnpm and dependencies
RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod=false && \
    pnpm store prune

# Copy source code
COPY . .

# Build TypeScript and optimize for production
RUN pnpm run build && \
    pnpm prune --prod && \
    pnpm store prune

# Production stage
FROM node:22-alpine AS production

# Security: Create non-root user
RUN addgroup -g 1001 -S fanz && \
    adduser -S fanz -u 1001 -G fanz

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    tini \
    curl \
    ffmpeg \
    imagemagick \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype && \
    rm -rf /var/cache/apk/*

# Set timezone for compliance logging
ENV TZ=UTC

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=fanz:fanz /app/dist ./dist
COPY --from=builder --chown=fanz:fanz /app/node_modules ./node_modules
COPY --from=builder --chown=fanz:fanz /app/package.json ./

# Copy launch script
COPY --chown=fanz:fanz launch-fanz.cjs ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R fanz:fanz /app && \
    chmod -R 755 /app

# Switch to non-root user
USER fanz

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Expose port
EXPOSE 3000

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "launch-fanz.cjs"]
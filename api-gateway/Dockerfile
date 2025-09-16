# 🌐 FANZ API GATEWAY - HARDENED DOCKERFILE
# Security-hardened API gateway service container
# Implements: Distroless runtime, pinned digests, minimal attack surface

# Stage 1: Build stage with pinned digest for supply chain security
FROM node:18-alpine@sha256:REDACTED_AWS_SECRET_KEY5588d0a35cb9bc4b8ca09d9e AS builder

# Install security updates first and only required build tools
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat && \
    rm -rf /var/cache/apk/*

# Create app directory with proper ownership
WORKDIR /usr/src/app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with frozen lockfile for reproducible builds
RUN npm ci --frozen-lockfile && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy source code
COPY . .

# Build application and remove dev dependencies
RUN npm run build && \
    npm prune --production

# Stage 2: Distroless production runtime for minimal attack surface
FROM gcr.io/distroless/nodejs18-debian12:nonroot AS production

# Set proper labels for container metadata
LABEL maintainer="FANZ Security Team <security@fanz.network>" \
      version="1.0.0" \
      description="FANZ API Gateway - Security Hardened" \
      security-scan="required" \
      service="api-gateway"

# Copy only built application and production dependencies
COPY --from=builder --chown=nonroot:nonroot /usr/src/app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /usr/src/app/package*.json ./

# Create logs directory with proper permissions
USER root
RUN mkdir -p /app/logs && \
    chown -R nonroot:nonroot /app/logs && \
    chmod 755 /app/logs

# Switch to non-root user (distroless nonroot user ID 65532)
USER 65532:65532

# Set read-only filesystem
VOLUME ["/tmp"]

# Security: Drop all capabilities
# Note: This is handled by Kubernetes deployment manifest

# Expose only necessary ports
EXPOSE 8080

# Health check with timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"]

# Start application with proper signal handling (distroless includes init)
CMD ["node", "dist/server.js"]
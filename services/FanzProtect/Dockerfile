# FanzProtect Legal Platform - Production Docker Container
# Multi-stage build for optimized production deployment

# =============================================
# STAGE 1: Build Dependencies & Frontend
# =============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
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

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY components.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build:frontend

# Build the backend TypeScript
RUN npm run build:backend

# Remove dev dependencies
RUN npm prune --production

# =============================================
# STAGE 2: Production Runtime
# =============================================
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S fanzprotect && \
    adduser -S fanzprotect -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    curl

# Copy built application from builder stage
COPY --from=builder --chown=fanzprotect:fanzprotect /app/dist ./dist
COPY --from=builder --chown=fanzprotect:fanzprotect /app/node_modules ./node_modules
COPY --from=builder --chown=fanzprotect:fanzprotect /app/package*.json ./

# Copy server configuration files
COPY --chown=fanzprotect:fanzprotect server/ ./server/
COPY --chown=fanzprotect:fanzprotect shared/ ./shared/

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R fanzprotect:fanzprotect /app

# Switch to app user
USER fanzprotect

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server/index.js"]

# =============================================
# LABELS & METADATA
# =============================================
LABEL maintainer="FANZ Legal Protection Team <legal@myfanz.network>"
LABEL version="1.0.0"
LABEL description="FanzProtect Legal Platform - Professional DMCA & Legal Services for Adult Content Creators"
LABEL org.opencontainers.image.title="FanzProtect Legal Platform"
LABEL org.opencontainers.image.description="Comprehensive legal protection platform for FANZ ecosystem creators"
LABEL org.opencontainers.image.vendor="FANZ Unified Network"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.url="https://protect.myfanz.network"
LABEL org.opencontainers.image.source="https://github.com/fanz-ecosystem/fanzprotect"
LABEL org.opencontainers.image.licenses="MIT"
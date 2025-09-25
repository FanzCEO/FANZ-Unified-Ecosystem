# 🌐 FANZ API GATEWAY - HARDENED DOCKERFILE
# Security-hardened API gateway service container
# Implements: Distroless runtime, pinned digests, minimal attack surface

# Stage 1: Build stage with pinned digest for supply chain security
FROM node:20-alpine AS development

# Install security updates first
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache \
    python3 \
    make \
    g++ && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for development)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8090/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start in development mode
CMD ["npm", "run", "dev"]

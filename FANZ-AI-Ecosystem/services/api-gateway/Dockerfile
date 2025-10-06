# Multi-stage build for API Gateway
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fanzai -u 1001

# Set working directory
WORKDIR /app

# Copy application from builder stage
COPY --from=builder --chown=fanzai:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fanzai:nodejs /app/src ./src
COPY --from=builder --chown=fanzai:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs && chown -R fanzai:nodejs /app/logs

# Switch to non-root user
USER fanzai

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
# FANZ Ad Service Docker Image
# Multi-stage build for production optimization

# Stage 1: Build dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../../pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production runtime
FROM node:18-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S fanz && \
    adduser -S fanz -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY src/ ./src/
COPY policy/ ./policy/
COPY package.json ./

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R fanz:fanz /app

# Switch to non-root user
USER fanz

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start the application
CMD ["node", "src/server.js"]
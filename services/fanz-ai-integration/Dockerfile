# FANZ AI Integration Service - Production Docker Image
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Runtime stage
FROM base AS runtime

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fanzai -u 1001 -G nodejs

# Set ownership
RUN chown -R fanzai:nodejs /app
USER fanzai

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
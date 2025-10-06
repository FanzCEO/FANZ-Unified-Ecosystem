#!/bin/bash
set -euo pipefail

# FANZ AI Ecosystem Docker Build Script
# Builds and pushes all service images

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${REGISTRY:-ghcr.io/joshuastone}"
VERSION="${VERSION:-latest}"
BUILD_ARGS="${BUILD_ARGS:-}"
PUSH="${PUSH:-true}"
SERVICES=(
    "ai-intelligence-hub"
    "ai-creator-assistant"
    "content-curation-engine"
    "content-distribution-network"
    "security-privacy-framework"
    "compliance-accessibility-excellence"
)

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

check_docker() {
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
    docker info >/dev/null 2>&1 || error "Docker daemon is not running"
    success "Docker is available and running"
}

create_dockerfile() {
    local service=$1
    local dockerfile_path="services/$service/Dockerfile"
    
    if [[ ! -f "$dockerfile_path" ]]; then
        log "Creating Dockerfile for $service..."
        cat > "$dockerfile_path" << 'EOF'
# Multi-stage build for FANZ AI Service
FROM node:18-alpine AS base

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci

# Build stage
FROM dev-deps AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: process.env.PORT || 3000, path: '/health', timeout: 2000 }; const request = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); request.on('error', () => { process.exit(1); }); request.end();"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
EOF
        success "Created Dockerfile for $service"
    fi
}

create_dockerignore() {
    local service=$1
    local dockerignore_path="services/$service/.dockerignore"
    
    if [[ ! -f "$dockerignore_path" ]]; then
        log "Creating .dockerignore for $service..."
        cat > "$dockerignore_path" << 'EOF'
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.development.local
.env.test.local
.env.production.local

# Parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log

# Git
.git
.gitignore

# Docker
Dockerfile
.dockerignore

# Documentation
README.md
*.md

# Test files
test/
tests/
spec/
__tests__/
*.test.js
*.spec.js
EOF
        success "Created .dockerignore for $service"
    fi
}

build_service() {
    local service=$1
    local service_path="services/$service"
    
    if [[ ! -d "$service_path" ]]; then
        warning "Service directory $service_path does not exist, skipping"
        return
    fi
    
    log "Building $service..."
    
    # Create Dockerfile if it doesn't exist
    create_dockerfile "$service"
    create_dockerignore "$service"
    
    # Build the image
    local image_tag="$REGISTRY/$service:$VERSION"
    local build_context="$service_path"
    
    # Add build arguments if specified
    local docker_build_args=""
    if [[ -n "$BUILD_ARGS" ]]; then
        docker_build_args="$BUILD_ARGS"
    fi
    
    log "Building image: $image_tag"
    
    if docker build \
        $docker_build_args \
        --tag "$image_tag" \
        --tag "$REGISTRY/$service:latest" \
        --file "$service_path/Dockerfile" \
        --platform linux/amd64,linux/arm64 \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        "$build_context"; then
        
        success "Successfully built $service"
        
        # Push if enabled
        if [[ "$PUSH" == "true" ]]; then
            log "Pushing $service to registry..."
            if docker push "$image_tag" && docker push "$REGISTRY/$service:latest"; then
                success "Successfully pushed $service"
            else
                error "Failed to push $service"
            fi
        fi
    else
        error "Failed to build $service"
    fi
}

build_all_services() {
    log "Building all FANZ AI services..."
    
    local failed_builds=()
    
    for service in "${SERVICES[@]}"; do
        if ! build_service "$service"; then
            failed_builds+=("$service")
        fi
    done
    
    if [[ ${#failed_builds[@]} -gt 0 ]]; then
        error "Failed to build services: ${failed_builds[*]}"
    fi
    
    success "All services built successfully"
}

prune_docker() {
    log "Cleaning up Docker resources..."
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove unused build cache (keep last 24h)
    docker builder prune -f --filter until=24h >/dev/null 2>&1 || true
    
    success "Docker cleanup completed"
}

show_images() {
    log "Built images:"
    echo ""
    for service in "${SERVICES[@]}"; do
        if docker images "$REGISTRY/$service" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -v REPOSITORY; then
            echo ""
        fi
    done
}

main() {
    log "🚀 Starting FANZ AI Ecosystem build process..."
    log "Registry: $REGISTRY"
    log "Version: $VERSION"
    log "Push enabled: $PUSH"
    
    check_docker
    build_all_services
    
    if [[ "$PUSH" == "false" ]]; then
        show_images
    fi
    
    prune_docker
    
    success "🎉 Build process completed successfully!"
    log "Build completed in $(($SECONDS / 60)) minutes"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-push)
            PUSH="false"
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --service)
            SERVICES=("$2")
            shift 2
            ;;
        --build-arg)
            BUILD_ARGS="$BUILD_ARGS --build-arg $2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --no-push          Don't push images to registry"
            echo "  --registry REPO    Docker registry (default: ghcr.io/joshuastone)"
            echo "  --version TAG      Image version tag (default: latest)"
            echo "  --service NAME     Build only specific service"
            echo "  --build-arg ARG    Add build argument"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Handle script interruption
trap 'error "Build interrupted"' INT TERM

# Run main function
main
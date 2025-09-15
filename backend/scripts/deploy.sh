#!/bin/bash

# FanzFinance OS - Automated Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: local, staging, production
# Options: --no-migration, --no-build, --force

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-local}"
SKIP_MIGRATION=false
SKIP_BUILD=false
FORCE_DEPLOY=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --no-migration)
      SKIP_MIGRATION=true
      shift
      ;;
    --no-build)
      SKIP_BUILD=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check if required files exist
    local required_files=("Dockerfile" "docker-compose.yml" "package.json")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    log_success "All requirements checked successfully"
}

setup_environment() {
    log_info "Setting up environment: $ENVIRONMENT"
    
    cd "$PROJECT_ROOT"
    
    # Create environment file if it doesn't exist
    local env_file=".env"
    local env_template=".env.${ENVIRONMENT}"
    
    if [[ -f "$env_template" ]]; then
        if [[ ! -f "$env_file" ]] || [[ "$FORCE_DEPLOY" == true ]]; then
            log_info "Copying environment template: $env_template -> $env_file"
            cp "$env_template" "$env_file"
        fi
    else
        log_warning "Environment template not found: $env_template"
        if [[ ! -f "$env_file" ]]; then
            log_error "No environment file found. Please create .env file."
            exit 1
        fi
    fi
    
    # Create required directories
    local directories=("logs" "database/init" "redis" "nginx" "monitoring")
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    log_success "Environment setup completed"
}

build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log_info "Skipping application build"
        return 0
    fi
    
    log_info "Building FanzFinance OS application..."
    
    cd "$PROJECT_ROOT"
    
    # Build Docker images
    if command -v docker-compose &> /dev/null; then
        docker-compose build --no-cache
    else
        docker compose build --no-cache
    fi
    
    log_success "Application build completed"
}

run_migrations() {
    if [[ "$SKIP_MIGRATION" == true ]]; then
        log_info "Skipping database migrations"
        return 0
    fi
    
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Start database services
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres redis
        docker-compose run --rm migrations
    else
        docker compose up -d postgres redis
        docker compose run --rm migrations
    fi
    
    log_success "Database migrations completed"
}

deploy_application() {
    log_info "Deploying FanzFinance OS to $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    case $ENVIRONMENT in
        local)
            deploy_local
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully"
}

deploy_local() {
    log_info "Starting local development environment..."
    
    # Start all services
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    # Wait for services to be healthy
    wait_for_health_check
    
    log_success "Local environment is ready!"
    log_info "API available at: http://localhost:3000"
    log_info "Health check: http://localhost:3000/health"
    log_info "API docs: http://localhost:3000/api/v1/payment/docs"
}

deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Pull latest images and deploy
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.yml pull
        docker-compose -f docker-compose.yml up -d --remove-orphans
    else
        docker compose -f docker-compose.yml pull
        docker compose -f docker-compose.yml up -d --remove-orphans
    fi
    
    wait_for_health_check
    
    log_success "Staging deployment completed!"
}

deploy_production() {
    log_info "Deploying to production environment..."
    
    # Additional production checks
    if [[ "$FORCE_DEPLOY" != true ]]; then
        log_warning "Production deployment requires --force flag for safety"
        read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Production deployment cancelled"
            exit 0
        fi
    fi
    
    # Deploy with production configuration
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.yml --profile monitoring pull
        docker-compose -f docker-compose.yml --profile monitoring up -d --remove-orphans
    else
        docker compose -f docker-compose.yml --profile monitoring pull
        docker compose -f docker-compose.yml --profile monitoring up -d --remove-orphans
    fi
    
    wait_for_health_check
    
    log_success "Production deployment completed!"
    log_info "Monitor the application health and logs carefully"
}

wait_for_health_check() {
    log_info "Waiting for application to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for health check..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Application failed to become healthy within the timeout period"
    show_logs
    exit 1
}

show_logs() {
    log_info "Showing application logs..."
    
    cd "$PROJECT_ROOT"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose logs --tail=50 fanz-api
    else
        docker compose logs --tail=50 fanz-api
    fi
}

run_tests() {
    log_info "Running system verification tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run our verification script
    if [[ -f "scripts/test-payment-system.js" ]]; then
        node scripts/test-payment-system.js
    else
        log_warning "Verification script not found"
    fi
    
    # Test API endpoints
    local endpoints=(
        "/health"
        "/api/v1/payment/health"
        "/api/v1/payment/docs"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:3000$endpoint" > /dev/null; then
            log_success "✓ $endpoint"
        else
            log_error "✗ $endpoint"
        fi
    done
}

cleanup() {
    log_info "Cleaning up deployment artifacts..."
    
    cd "$PROJECT_ROOT"
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes (be careful with this in production)
    if [[ "$ENVIRONMENT" == "local" ]]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed"
}

show_status() {
    log_info "FanzFinance OS Deployment Status:"
    
    cd "$PROJECT_ROOT"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
    
    echo ""
    log_info "Container Health Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main deployment flow
main() {
    echo "🚀 FanzFinance OS Deployment Script"
    echo "Environment: $ENVIRONMENT"
    echo "======================================="
    
    check_requirements
    setup_environment
    build_application
    run_migrations
    deploy_application
    run_tests
    show_status
    
    echo ""
    log_success "🎉 FanzFinance OS deployment completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  • Monitor application logs: docker-compose logs -f fanz-api"
    echo "  • Check health status: curl http://localhost:3000/health"
    echo "  • Access API documentation: http://localhost:3000/api/v1/payment/docs"
    echo "  • View system metrics: http://localhost:3001 (if monitoring enabled)"
    echo ""
    log_info "For support, check the documentation or run: ./scripts/deploy.sh --help"
}

# Handle script interruption
trap cleanup EXIT

# Show help
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "FanzFinance OS Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  local      Deploy to local development environment (default)"
    echo "  staging    Deploy to staging environment"
    echo "  production Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --no-migration  Skip database migrations"
    echo "  --no-build      Skip application build"
    echo "  --force         Force deployment without confirmations"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy to local environment"
    echo "  $0 staging                  # Deploy to staging"
    echo "  $0 production --force       # Deploy to production"
    echo "  $0 local --no-build         # Deploy locally without rebuilding"
    exit 0
fi

# Run main function
main "$@"
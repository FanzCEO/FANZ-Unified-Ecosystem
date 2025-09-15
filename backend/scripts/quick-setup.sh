#!/bin/bash

# FanzFinance OS - Quick Setup Script
# This script sets up the complete FanzFinance OS system for local development and testing

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default ports
APP_PORT=3000
DB_PORT=5432
REDIS_PORT=6379
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090

log_info "🚀 FanzFinance OS Quick Setup"
echo "=================================="
echo ""

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js 18+")
    else
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo "$node_version" | cut -d. -f1)
        if [[ $major_version -lt 18 ]]; then
            missing_deps+=("Node.js 18+ (current: $node_version)")
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        missing_deps+=("PostgreSQL")
    fi
    
    # Check Redis (optional, will use Docker if not available)
    if ! command -v redis-cli &> /dev/null; then
        log_warn "Redis not found locally - will use Docker container"
    fi
    
    # Check Docker (optional)
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found - some features may not be available"
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        log_info "Please install the missing dependencies and run this script again"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Install dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    cd "$PROJECT_ROOT"
    
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Make sure you're in the correct directory."
        exit 1
    fi
    
    npm install
    log_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment configuration..."
    
    local env_file="$PROJECT_ROOT/.env.local"
    
    if [[ -f "$env_file" ]]; then
        log_warn "Environment file already exists: $env_file"
        read -p "Overwrite existing environment file? [y/N]: " -r overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            log_info "Skipping environment setup"
            return 0
        fi
    fi
    
    cat > "$env_file" << EOF
# FanzFinance OS - Local Development Environment
NODE_ENV=development
PORT=$APP_PORT

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:$DB_PORT/fanz_ecosystem
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_NAME=fanz_ecosystem
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_URL=redis://localhost:$REDIS_PORT
REDIS_HOST=localhost
REDIS_PORT=$REDIS_PORT

# Authentication
JWT_SECRET=local-development-jwt-secret-key-not-for-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=local-development-refresh-secret-not-for-production
BCRYPT_ROUNDS=10

# Application Settings
API_VERSION=v1
APP_NAME=FanzFinance OS
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Payment Processing (Mock/Test Mode)
PAYMENT_PROCESSOR_MODE=test
PLATFORM_FEE_PERCENTAGE=5.0
SUBSCRIPTION_FEE_PERCENTAGE=7.5
TIP_FEE_PERCENTAGE=3.0
WITHDRAWAL_FEE_FIXED=250
MINIMUM_PAYOUT_AMOUNT=1000

# Square (Alternative to Stripe)
SQUARE_APPLICATION_ID=sandbox-sq0idb-your-app-id
SQUARE_ACCESS_TOKEN=sandbox-sq0atb-your-access-token
SQUARE_ENVIRONMENT=sandbox

# Braintree (Alternative to PayPal)
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=your-merchant-id
BRAINTREE_PUBLIC_KEY=your-public-key
BRAINTREE_PRIVATE_KEY=your-private-key

# Coinbase Commerce (Crypto payments)
COINBASE_COMMERCE_API_KEY=your-coinbase-api-key
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# Adult-Friendly Payment Processors

# CCBill (Primary adult payment processor)
CCBILL_CLIENT_ACCNUM=your-ccbill-client-account
CCBILL_CLIENT_SUBACC=your-ccbill-subaccount
CCBILL_FLEX_ID=your-ccbill-flex-id
CCBILL_SALT=your-ccbill-salt
CCBILL_API_USERNAME=your-ccbill-api-username
CCBILL_API_PASSWORD=your-ccbill-api-password
CCBILL_ENVIRONMENT=sandbox

# Paxum (Creator payouts)
PAXUM_API_KEY=your-paxum-api-key
PAXUM_API_SECRET=your-paxum-api-secret
PAXUM_COMPANY_ID=your-paxum-company-id
PAXUM_ENVIRONMENT=sandbox

# Segpay (Alternative adult processor)
SEGPAY_PACKAGE_ID=your-segpay-package-id
SEGPAY_BILLERID=your-segpay-biller-id
SEGPAY_USERNAME=your-segpay-username
SEGPAY_PASSWORD=your-segpay-password
SEGPAY_ENVIRONMENT=sandbox

# Monitoring and Health Checks
PROMETHEUS_ENABLED=true
METRICS_PORT=$PROMETHEUS_PORT
HEALTH_CHECK_TIMEOUT=10
ENABLE_REQUEST_LOGGING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
PAYMENT_RATE_LIMIT_MAX=20
REPORTS_RATE_LIMIT_MAX=10

# Development Features
ENABLE_API_DOCS=true
ENABLE_PLAYGROUND=true
DEBUG_SQL=false
EOF
    
    log_success "Environment file created: $env_file"
}

# Setup database
setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Check if database exists
    if psql -lqt | cut -d '|' -f 1 | grep -qw "fanz_ecosystem"; then
        log_warn "Database 'fanz_ecosystem' already exists"
        read -p "Reset database? [y/N]: " -r reset_db
        if [[ $reset_db =~ ^[Yy]$ ]]; then
            log_info "Resetting database..."
            dropdb fanz_ecosystem 2>/dev/null || true
            createdb fanz_ecosystem
        else
            log_info "Using existing database"
            return 0
        fi
    else
        log_info "Creating database 'fanz_ecosystem'..."
        createdb fanz_ecosystem
    fi
    
    # Make migration script executable
    chmod +x "$PROJECT_ROOT/scripts/migrate.sh"
    
    # Run migrations and seed data
    log_info "Running database migrations..."
    "$PROJECT_ROOT/scripts/migrate.sh" init --skip-seed
    
    log_info "Seeding sample data..."
    "$PROJECT_ROOT/scripts/migrate.sh" seed
    
    log_success "Database setup complete"
}

# Setup Redis (using Docker if local Redis not available)
setup_redis() {
    if command -v redis-cli &> /dev/null && redis-cli ping &>/dev/null; then
        log_success "Redis is already running locally"
        return 0
    fi
    
    if command -v docker &> /dev/null; then
        log_info "Starting Redis with Docker..."
        
        # Stop existing Redis container if running
        docker stop fanz-redis 2>/dev/null || true
        docker rm fanz-redis 2>/dev/null || true
        
        # Start new Redis container
        docker run -d \
            --name fanz-redis \
            -p $REDIS_PORT:6379 \
            redis:7-alpine \
            redis-server --appendonly yes
        
        # Wait for Redis to be ready
        local attempts=0
        while ! redis-cli ping &>/dev/null && [[ $attempts -lt 30 ]]; do
            sleep 1
            ((attempts++))
        done
        
        if redis-cli ping &>/dev/null; then
            log_success "Redis started with Docker"
        else
            log_error "Failed to start Redis"
            exit 1
        fi
    else
        log_error "Redis is not available and Docker is not installed"
        log_info "Please install Redis or Docker and run this script again"
        exit 1
    fi
}

# Build the application
build_application() {
    log_info "Building TypeScript application..."
    cd "$PROJECT_ROOT"
    
    npm run build
    log_success "Application built successfully"
}

# Start monitoring stack (optional)
setup_monitoring() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        log_info "Starting monitoring stack..."
        
        # Start Prometheus and Grafana
        docker-compose -f docker-compose.yml up -d prometheus grafana 2>/dev/null || {
            log_warn "Could not start monitoring stack - docker-compose.yml may not be configured"
            return 0
        }
        
        log_success "Monitoring stack started"
        log_info "Grafana: http://localhost:$GRAFANA_PORT (admin/admin)"
        log_info "Prometheus: http://localhost:$PROMETHEUS_PORT"
    else
        log_warn "Docker Compose not available - skipping monitoring setup"
    fi
}

# Run health checks
run_health_checks() {
    log_info "Running system health checks..."
    
    # Make health check script executable
    chmod +x "$PROJECT_ROOT/scripts/health-check.sh"
    
    # Run health checks
    "$PROJECT_ROOT/scripts/health-check.sh" --verbose || {
        log_warn "Some health checks failed - this may be normal for initial setup"
    }
}

# Show startup information
show_startup_info() {
    echo ""
    log_success "🎉 FanzFinance OS Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Start the development server:"
    echo "     npm run dev"
    echo ""
    echo "  2. Test the API:"
    echo "     curl http://localhost:$APP_PORT/api/health"
    echo ""
    echo "  3. Run health checks:"
    echo "     ./scripts/health-check.sh"
    echo ""
    echo "🌐 Available Services:"
    echo "  • API Server:      http://localhost:$APP_PORT"
    echo "  • API Health:      http://localhost:$APP_PORT/api/health"
    echo "  • API Docs:        http://localhost:$APP_PORT/api/docs (when implemented)"
    echo "  • Grafana:         http://localhost:$GRAFANA_PORT (admin/admin)"
    echo "  • Prometheus:      http://localhost:$PROMETHEUS_PORT"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • Database status: ./scripts/migrate.sh status"
    echo "  • Health checks:   ./scripts/health-check.sh"
    echo "  • Deploy:          ./scripts/deploy.sh --env local"
    echo ""
    echo "📖 Documentation:"
    echo "  • API Spec:        docs/api-spec.yaml"
    echo "  • Testing Guide:   docs/testing-guide.md"
    echo "  • Deployment:      DEPLOYMENT_COMPLETE.md"
    echo ""
    log_info "Happy coding! 🚀"
}

# Error handling
cleanup_on_error() {
    log_error "Setup failed. Cleaning up..."
    
    # Stop Docker containers if they were started
    docker stop fanz-redis 2>/dev/null || true
    docker rm fanz-redis 2>/dev/null || true
    
    exit 1
}

# Set error trap
trap cleanup_on_error ERR

# Main execution
main() {
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    setup_redis
    build_application
    setup_monitoring
    run_health_checks
    show_startup_info
}

# Check if running with --help
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    echo "FanzFinance OS Quick Setup Script"
    echo ""
    echo "This script automatically sets up the complete FanzFinance OS system"
    echo "for local development and testing."
    echo ""
    echo "Prerequisites:"
    echo "  - Node.js 18+"
    echo "  - PostgreSQL 14+"
    echo "  - Redis (optional, will use Docker if not available)"
    echo "  - Docker (optional, for Redis and monitoring)"
    echo ""
    echo "What this script does:"
    echo "  1. Checks prerequisites"
    echo "  2. Installs Node.js dependencies"
    echo "  3. Sets up environment configuration"
    echo "  4. Creates and initializes PostgreSQL database"
    echo "  5. Starts Redis (locally or with Docker)"
    echo "  6. Builds the TypeScript application"
    echo "  7. Sets up monitoring stack (optional)"
    echo "  8. Runs health checks"
    echo ""
    echo "Usage:"
    echo "  ./scripts/quick-setup.sh"
    echo ""
    exit 0
fi

# Run main function
main "$@"
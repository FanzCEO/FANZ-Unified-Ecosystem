#!/bin/bash

# FANZ Ecosystem - Advanced Developer Tools
# Comprehensive toolset for development, testing, and deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_header() { echo -e "${PURPLE}[FANZ]${NC} $1"; }

show_help() {
    log_header "FANZ Ecosystem - Developer Tools"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "🚀 DEVELOPMENT COMMANDS:"
    echo "  setup                 - Complete ecosystem setup"
    echo "  start                 - Start all services"
    echo "  stop                  - Stop all services"
    echo "  restart               - Restart all services"
    echo "  status                - Check service status"
    echo ""
    echo "🧪 TESTING COMMANDS:"
    echo "  test                  - Run all tests"
    echo "  test:unit             - Run unit tests"
    echo "  test:integration      - Run integration tests"
    echo "  test:payments         - Test payment processors"
    echo "  test:compliance       - Test compliance validation"
    echo "  test:performance      - Run performance tests"
    echo ""
    echo "💰 PAYMENT COMMANDS:"
    echo "  payments:demo         - Run payment processing demo"
    echo "  payments:health       - Check payment processor health"
    echo "  payments:config       - Validate payment configurations"
    echo "  payments:test-all     - Comprehensive payment testing"
    echo ""
    echo "🗄️  DATABASE COMMANDS:"
    echo "  db:setup              - Setup database"
    echo "  db:migrate            - Run migrations"
    echo "  db:seed               - Seed sample data"
    echo "  db:reset              - Reset database"
    echo "  db:backup             - Backup database"
    echo "  db:restore            - Restore database"
    echo ""
    echo "📊 MONITORING COMMANDS:"
    echo "  monitor:health        - System health check"
    echo "  monitor:performance   - Performance metrics"
    echo "  monitor:logs          - View aggregated logs"
    echo "  monitor:alerts        - Check active alerts"
    echo ""
    echo "🔧 UTILITY COMMANDS:"
    echo "  clean                 - Clean build artifacts"
    echo "  build                 - Build all services"
    echo "  deploy:dev            - Deploy to development"
    echo "  deploy:staging        - Deploy to staging"
    echo "  security:scan         - Run security scan"
    echo ""
    echo "🎨 PLATFORM COMMANDS:"
    echo "  platform:list         - List all platforms"
    echo "  platform:start <name> - Start specific platform"
    echo "  platform:logs <name>  - View platform logs"
    echo ""
}

# Development Commands
cmd_setup() {
    log_header "Setting up FANZ Ecosystem..."
    
    cd "$PROJECT_ROOT"
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    command -v node >/dev/null 2>&1 || { log_error "Node.js not found. Please install Node.js 18+"; exit 1; }
    command -v psql >/dev/null 2>&1 || { log_error "PostgreSQL not found. Please install PostgreSQL"; exit 1; }
    
    # Run quick setup
    if [[ -f "backend/scripts/quick-setup.sh" ]]; then
        chmod +x backend/scripts/quick-setup.sh
        ./backend/scripts/quick-setup.sh
    else
        log_error "Quick setup script not found"
        exit 1
    fi
    
    log_success "FANZ Ecosystem setup complete!"
}

cmd_start() {
    log_header "Starting FANZ Ecosystem services..."
    
    cd "$PROJECT_ROOT"
    
    # Start core services
    log_info "Starting backend services..."
    cd backend && npm run dev &
    
    log_info "Starting frontend..."
    cd ../frontend && npm start &
    
    # Start platform clusters
    if [[ -d "platform-clusters" ]]; then
        log_info "Starting platform clusters..."
        cd ../platform-clusters && npm run start:all &
    fi
    
    log_success "All services starting... Check status with: $0 status"
}

cmd_stop() {
    log_header "Stopping FANZ Ecosystem services..."
    
    # Kill Node.js processes
    pkill -f "npm.*dev" || true
    pkill -f "npm.*start" || true
    pkill -f "node.*server" || true
    
    # Stop Docker containers if running
    if command -v docker >/dev/null 2>&1; then
        docker stop $(docker ps -q) 2>/dev/null || true
    fi
    
    log_success "All services stopped"
}

cmd_status() {
    log_header "FANZ Ecosystem Service Status"
    echo ""
    
    # Check main API
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "✅ Main API (port 3000) - Running"
    else
        log_error "❌ Main API (port 3000) - Not responding"
    fi
    
    # Check database
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_success "✅ PostgreSQL - Running"
    else
        log_error "❌ PostgreSQL - Not running"
    fi
    
    # Check Redis
    if redis-cli ping >/dev/null 2>&1; then
        log_success "✅ Redis - Running"
    else
        log_warn "⚠️  Redis - Not running (will use memory cache)"
    fi
    
    # Check payment processors
    if curl -s -H "Authorization: Bearer REDACTED_DEMO_TOKEN" http://localhost:3000/api/payments/processors >/dev/null 2>&1; then
        log_success "✅ Payment Processors - Available"
    else
        log_warn "⚠️  Payment Processors - Not available"
    fi
    
    echo ""
    log_info "Process Information:"
    ps aux | grep -E "(node|npm)" | grep -v grep | awk '{print "  " $2 " - " $11 " " $12}' || log_info "  No Node.js processes running"
}

# Testing Commands
cmd_test() {
    log_header "Running all tests..."
    cd "$PROJECT_ROOT/backend"
    npm test
}

cmd_test_unit() {
    log_header "Running unit tests..."
    cd "$PROJECT_ROOT/backend"
    npm test -- --testPathPattern="unit"
}

cmd_test_integration() {
    log_header "Running integration tests..."
    cd "$PROJECT_ROOT/backend"
    npm test -- --testPathPattern="integration"
}

cmd_test_payments() {
    log_header "Testing payment processors..."
    cd "$PROJECT_ROOT/backend"
    npm test -- tests/services/payment/processors/
}

cmd_test_compliance() {
    log_header "Testing compliance validation..."
    cd "$PROJECT_ROOT/backend"
    npm test -- --testNamePattern="Compliance"
}

cmd_test_performance() {
    log_header "Running performance tests..."
    cd "$PROJECT_ROOT/backend"
    npm run test:performance || log_warn "Performance tests not configured"
}

# Payment Commands
cmd_payments_demo() {
    log_header "Running payment processing demo..."
    cd "$PROJECT_ROOT/backend"
    
    if [[ -f "scripts/demo-payment-processing.sh" ]]; then
        chmod +x scripts/demo-payment-processing.sh
        ./scripts/demo-payment-processing.sh
    else
        log_error "Payment demo script not found"
        exit 1
    fi
}

cmd_payments_health() {
    log_header "Checking payment processor health..."
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -H "Authorization: Bearer REDACTED_DEMO_TOKEN" http://localhost:3000/api/payments/processors 2>/dev/null || echo "ERROR")
        
        if [[ "$response" != "ERROR" ]]; then
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        else
            log_error "Could not connect to payment API"
        fi
    else
        log_error "curl not available"
    fi
}

cmd_payments_config() {
    log_header "Validating payment configurations..."
    cd "$PROJECT_ROOT"
    
    # Check environment variables
    source .env 2>/dev/null || log_warn "No .env file found"
    
    echo "Payment Processor Configuration:"
    echo "  CCBill: ${CCBILL_CLIENT_ACCNUM:+Configured}${CCBILL_CLIENT_ACCNUM:-Not configured}"
    echo "  Paxum:  ${PAXUM_API_KEY:+Configured}${PAXUM_API_KEY:-Not configured}"
    echo "  Segpay: ${SEGPAY_PACKAGE_ID:+Configured}${SEGPAY_PACKAGE_ID:-Not configured}"
}

# Database Commands
cmd_db_setup() {
    log_header "Setting up database..."
    
    # Create database if it doesn't exist
    createdb fanz_unified 2>/dev/null || log_info "Database already exists"
    
    # Run migrations
    cd "$PROJECT_ROOT/backend"
    npm run migrate || log_error "Migration failed"
    
    log_success "Database setup complete"
}

cmd_db_migrate() {
    log_header "Running database migrations..."
    cd "$PROJECT_ROOT/backend"
    npm run migrate
}

cmd_db_seed() {
    log_header "Seeding database with sample data..."
    cd "$PROJECT_ROOT/backend"
    npm run seed || log_warn "Seed script not configured"
}

cmd_db_reset() {
    log_header "Resetting database..."
    
    read -p "This will delete all data. Continue? [y/N]: " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dropdb fanz_unified 2>/dev/null || true
        createdb fanz_unified
        cmd_db_migrate
        log_success "Database reset complete"
    else
        log_info "Database reset cancelled"
    fi
}

# Monitoring Commands
cmd_monitor_health() {
    log_header "System Health Check"
    
    # API Health
    echo "🌐 API Health:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || log_error "API not responding"
    
    echo ""
    echo "💳 Payment Processors:"
    curl -s -H "Authorization: Bearer REDACTED_DEMO_TOKEN" http://localhost:3000/api/payments/processors | python3 -m json.tool 2>/dev/null || log_error "Payment API not responding"
    
    echo ""
    echo "💾 Database:"
    psql -d fanz_unified -c "SELECT current_database(), current_user, inet_server_addr(), inet_server_port();" 2>/dev/null || log_error "Database not accessible"
}

cmd_monitor_performance() {
    log_header "Performance Metrics"
    
    echo "🖥️  System Resources:"
    echo "  CPU Usage: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')"
    echo "  Memory: $(ps aux | grep node | awk '{sum += $6} END {print sum/1024 " MB"}')"
    echo "  Load: $(uptime | awk -F'load averages:' '{print $2}')"
    
    echo ""
    echo "🗄️  Database Performance:"
    psql -d fanz_unified -c "SELECT datname, numbackends, xact_commit, xact_rollback FROM pg_stat_database WHERE datname = 'fanz_unified';" 2>/dev/null || log_error "Database not accessible"
}

cmd_monitor_logs() {
    log_header "Viewing aggregated logs..."
    
    log_info "Recent application logs:"
    if [[ -d "$PROJECT_ROOT/backend/logs" ]]; then
        tail -n 50 "$PROJECT_ROOT/backend/logs"/*.log 2>/dev/null || log_warn "No log files found"
    else
        log_warn "Log directory not found"
    fi
}

# Utility Commands
cmd_clean() {
    log_header "Cleaning build artifacts..."
    
    cd "$PROJECT_ROOT"
    
    # Clean node_modules and build outputs
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.log" -type f -delete 2>/dev/null || true
    
    log_success "Clean complete"
}

cmd_build() {
    log_header "Building all services..."
    
    cd "$PROJECT_ROOT/backend"
    npm run build || log_error "Backend build failed"
    
    cd "$PROJECT_ROOT/frontend"
    npm run build || log_error "Frontend build failed"
    
    log_success "Build complete"
}

cmd_security_scan() {
    log_header "Running security scan..."
    
    # NPM audit
    log_info "Checking for vulnerable packages..."
    cd "$PROJECT_ROOT/backend"
    npm audit --audit-level=high
    
    cd "$PROJECT_ROOT/frontend"
    npm audit --audit-level=high
    
    # Check environment variables
    log_info "Checking for exposed secrets..."
    if grep -r "password\|secret\|key" "$PROJECT_ROOT/.env" 2>/dev/null | grep -v "your-" | grep -v "#"; then
        log_warn "Potential secrets found in .env file"
    fi
    
    log_success "Security scan complete"
}

# Platform Commands
cmd_platform_list() {
    log_header "Available Platforms"
    echo ""
    echo "🌈 Platform Clusters:"
    echo "  • FanzLab (Universal Portal)"
    echo "  • BoyFanz (Male Creators)"
    echo "  • GirlFanz (Female Creators)"
    echo "  • DaddyFanz (Dom/Sub Community)"
    echo "  • PupFanz (Pup Community)"
    echo "  • TabooFanz (Extreme Content)"
    echo "  • TransFanz (Trans Creators)"
    echo "  • CougarFanz (Mature Creators)"
    echo "  • FanzCock (Adult TikTok)"
    echo ""
    echo "🔧 Core Systems:"
    echo "  • CreatorCRM"
    echo "  • BioLinkHub"
    echo "  • ChatSphere"
    echo "  • MediaCore"
    echo "  • FanzSocial"
    echo "  • FanzGPT"
    echo "  • FanzShield"
}

# Main command dispatcher
case "${1:-help}" in
    setup) cmd_setup ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_stop; sleep 2; cmd_start ;;
    status) cmd_status ;;
    
    test) cmd_test ;;
    test:unit) cmd_test_unit ;;
    test:integration) cmd_test_integration ;;
    test:payments) cmd_test_payments ;;
    test:compliance) cmd_test_compliance ;;
    test:performance) cmd_test_performance ;;
    
    payments:demo) cmd_payments_demo ;;
    payments:health) cmd_payments_health ;;
    payments:config) cmd_payments_config ;;
    
    db:setup) cmd_db_setup ;;
    db:migrate) cmd_db_migrate ;;
    db:seed) cmd_db_seed ;;
    db:reset) cmd_db_reset ;;
    
    monitor:health) cmd_monitor_health ;;
    monitor:performance) cmd_monitor_performance ;;
    monitor:logs) cmd_monitor_logs ;;
    
    clean) cmd_clean ;;
    build) cmd_build ;;
    security:scan) cmd_security_scan ;;
    
    platform:list) cmd_platform_list ;;
    
    help|--help|-h) show_help ;;
    
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
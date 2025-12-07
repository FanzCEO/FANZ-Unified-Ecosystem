#!/bin/bash

# FANZ Money Dash - Development Script
# Provides easy commands for common development tasks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if MongoDB is running
check_mongodb() {
    if pgrep -q mongod; then
        log_success "MongoDB is running"
        return 0
    else
        log_warning "MongoDB is not running"
        return 1
    fi
}

# Start MongoDB (macOS)
start_mongodb() {
    if check_mongodb; then
        log_info "MongoDB is already running"
        return 0
    fi
    
    log_info "Starting MongoDB..."
    if command -v brew &> /dev/null && brew services list | grep -q mongodb-community; then
        brew services start mongodb-community
        log_success "MongoDB started via Homebrew"
    elif command -v mongod &> /dev/null; then
        mkdir -p "$HOME/data/db"
        nohup mongod --dbpath "$HOME/data/db" > /dev/null 2>&1 &
        log_success "MongoDB started manually"
    else
        log_error "MongoDB not found. Please install MongoDB first:"
        log_info "  brew install mongodb-community"
        exit 1
    fi
}

# Stop MongoDB
stop_mongodb() {
    if command -v brew &> /dev/null && brew services list | grep -q mongodb-community; then
        brew services stop mongodb-community
        log_success "MongoDB stopped via Homebrew"
    else
        pkill -f mongod || log_warning "No MongoDB processes found"
        log_success "MongoDB processes stopped"
    fi
}

# Kill any processes using port 3001
free_port() {
    local port=${1:-3001}
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        log_info "Killing processes using port $port: $pids"
        kill $pids
        sleep 1
        log_success "Port $port is now free"
    else
        log_info "Port $port is already free"
    fi
}

# Run security audit
audit() {
    log_info "Running security audit..."
    cd "$PROJECT_ROOT"
    npm audit
    log_success "Security audit complete"
}

# Fix security vulnerabilities
fix_security() {
    log_info "Fixing security vulnerabilities..."
    cd "$PROJECT_ROOT"
    npm audit fix
    log_success "Security issues fixed"
}

# Run tests
test() {
    log_info "Running tests..."
    cd "$PROJECT_ROOT"
    npm test
    log_success "Tests completed"
}

# Start development server
start_dev() {
    cd "$PROJECT_ROOT"
    
    log_info "🚀 Starting FANZ Money Dash Development Server"
    echo "=========================================="
    
    # Free the port
    free_port 3001
    
    # Start MongoDB if not running
    if ! check_mongodb; then
        start_mongodb
        sleep 2
    fi
    
    # Check if .env exists
    if [[ ! -f .env ]]; then
        log_warning ".env file not found. Creating from .env.example..."
        if [[ -f .env.example ]]; then
            cp .env.example .env
        else
            log_info "Creating basic .env file..."
            cat > .env << EOF
NODE_ENV=development
PORT=3001
HOST=localhost
MONGODB_URI=mongodb://localhost:27017/fanz-money-dash
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug
EOF
        fi
        log_success ".env file created"
    fi
    
    # Start the server
    log_info "Starting server on http://localhost:3001"
    npm run dev
}

# Stop development server
stop_dev() {
    log_info "Stopping FANZ Money Dash Development Server..."
    free_port 3001
    pkill -f "node.*src/server.js" || log_info "No server processes found"
    log_success "Development server stopped"
}

# Clean and reset
clean() {
    log_info "Cleaning project..."
    cd "$PROJECT_ROOT"
    
    # Remove node_modules and reinstall
    rm -rf node_modules package-lock.json
    npm install
    
    # Clear logs
    rm -rf logs/
    
    log_success "Project cleaned and dependencies reinstalled"
}

# Show help
show_help() {
    cat << EOF
FANZ Money Dash Development Script

Usage: $0 [COMMAND]

Commands:
  start       Start the development server
  stop        Stop the development server
  restart     Restart the development server
  test        Run tests
  audit       Run security audit
  fix         Fix security vulnerabilities
  clean       Clean and reinstall dependencies
  mongodb     MongoDB commands:
    start       Start MongoDB
    stop        Stop MongoDB
    status      Check MongoDB status
  port        Free port 3001
  help        Show this help message

Examples:
  $0 start                   # Start development server
  $0 mongodb start          # Start MongoDB
  $0 test                   # Run tests
  $0 audit                  # Check security

EOF
}

# Main command dispatcher
case "${1:-}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        stop_dev
        sleep 1
        start_dev
        ;;
    test)
        test
        ;;
    audit)
        audit
        ;;
    fix)
        fix_security
        ;;
    clean)
        clean
        ;;
    mongodb)
        case "${2:-}" in
            start)
                start_mongodb
                ;;
            stop)
                stop_mongodb
                ;;
            status)
                check_mongodb
                ;;
            *)
                log_error "MongoDB command required: start, stop, status"
                exit 1
                ;;
        esac
        ;;
    port)
        free_port "${2:-3001}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        show_help
        exit 1
        ;;
esac
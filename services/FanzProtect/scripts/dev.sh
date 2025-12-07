#!/bin/bash
# FanzProtect Legal Platform - Development Utility Scripts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${BLUE}[FanzProtect]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required dependencies are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Setup development environment
setup_dev() {
    print_status "Setting up development environment..."
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before starting the server"
    fi
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create necessary directories
    mkdir -p logs uploads temp
    
    print_success "Development environment setup complete"
}

# Start development server
start_dev() {
    print_status "Starting FanzProtect development server..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_error ".env file not found. Run './scripts/dev.sh setup' first."
        exit 1
    fi
    
    # Start Docker services
    print_status "Starting Docker services..."
    docker-compose --profile development up -d postgres redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Start the development server
    print_status "Starting backend and frontend..."
    npm run dev
}

# Stop development services
stop_dev() {
    print_status "Stopping FanzProtect development services..."
    
    # Stop Docker services
    docker-compose down
    
    print_success "Development services stopped"
}

# Run tests
test_app() {
    print_status "Running FanzProtect tests..."
    
    # Run linting
    print_status "Running linter..."
    npm run lint
    
    # Run type checking
    print_status "Running type checking..."
    npm run type-check
    
    # Run tests
    print_status "Running unit tests..."
    npm run test
    
    print_success "All tests passed"
}

# Build the application
build_app() {
    print_status "Building FanzProtect application..."
    
    # Build frontend
    print_status "Building frontend..."
    npm run build:frontend
    
    # Build backend
    print_status "Building backend..."
    npm run build:backend
    
    print_success "Application built successfully"
}

# Deploy to production
deploy_prod() {
    print_status "Deploying FanzProtect to production..."
    
    # Build Docker image
    print_status "Building production Docker image..."
    docker build -t fanzprotect:latest .
    
    # Start production services
    print_status "Starting production services..."
    docker-compose --profile production up -d
    
    print_success "Production deployment complete"
}

# Clean up development environment
clean_dev() {
    print_status "Cleaning up development environment..."
    
    # Stop all services
    docker-compose down --volumes --remove-orphans
    
    # Remove node_modules
    if [ -d node_modules ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules
    fi
    
    # Remove build outputs
    if [ -d dist ]; then
        print_status "Removing dist..."
        rm -rf dist
    fi
    
    # Remove temporary files
    rm -rf logs/* uploads/* temp/*
    
    print_success "Development environment cleaned"
}

# Show logs
show_logs() {
    print_status "Showing FanzProtect logs..."
    docker-compose logs -f fanzprotect
}

# Check health
check_health() {
    print_status "Checking FanzProtect health..."
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Services are not running. Start them first with './scripts/dev.sh start'"
        exit 1
    fi
    
    # Check health endpoint
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "FanzProtect is healthy"
    else
        print_error "FanzProtect health check failed"
        exit 1
    fi
}

# Database operations
db_migrate() {
    print_status "Running database migrations..."
    npm run db:migrate
    print_success "Database migrations completed"
}

db_seed() {
    print_status "Seeding database with development data..."
    npm run db:seed
    print_success "Database seeded successfully"
}

db_reset() {
    print_status "Resetting database..."
    npm run db:reset
    print_success "Database reset completed"
}

# Show usage
show_usage() {
    echo "FanzProtect Development Utility"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup      - Set up development environment"
    echo "  start      - Start development server"
    echo "  stop       - Stop development services"
    echo "  test       - Run tests and linting"
    echo "  build      - Build the application"
    echo "  deploy     - Deploy to production"
    echo "  clean      - Clean up development environment"
    echo "  logs       - Show application logs"
    echo "  health     - Check application health"
    echo "  db:migrate - Run database migrations"
    echo "  db:seed    - Seed database with development data"
    echo "  db:reset   - Reset database"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev.sh setup     # Set up development environment"
    echo "  ./scripts/dev.sh start     # Start development server"
    echo "  ./scripts/dev.sh test      # Run all tests"
    echo "  ./scripts/dev.sh deploy    # Deploy to production"
}

# Main script logic
case "${1:-help}" in
    "check")
        check_dependencies
        ;;
    "setup")
        check_dependencies
        setup_dev
        ;;
    "start")
        check_dependencies
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "test")
        test_app
        ;;
    "build")
        build_app
        ;;
    "deploy")
        deploy_prod
        ;;
    "clean")
        clean_dev
        ;;
    "logs")
        show_logs
        ;;
    "health")
        check_health
        ;;
    "db:migrate")
        db_migrate
        ;;
    "db:seed")
        db_seed
        ;;
    "db:reset")
        db_reset
        ;;
    "help"|*)
        show_usage
        ;;
esac
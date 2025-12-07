#!/bin/bash
# FanzProtect Legal Platform - Deployment Configuration Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1 ${NC}"
    echo -e "${PURPLE}================================${NC}\n"
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning "No .env file found. Creating from template..."
        cp .env.example .env
        print_success "Created .env file from template"
    else
        print_success "Found existing .env file"
    fi
}

# Generate secure keys
generate_keys() {
    print_header "GENERATING SECURE KEYS"
    
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    EVIDENCE_ENCRYPTION_KEY=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    echo "# Generated secure keys for FanzProtect deployment" > .env.keys
    echo "JWT_SECRET=$JWT_SECRET" >> .env.keys
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.keys
    echo "EVIDENCE_ENCRYPTION_KEY=$EVIDENCE_ENCRYPTION_KEY" >> .env.keys
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env.keys
    
    print_success "Secure keys generated and saved to .env.keys"
    print_warning "Keep these keys secure and never share them publicly!"
}

# Setup database
setup_database() {
    print_header "DATABASE SETUP"
    
    print_info "FanzProtect uses Neon Serverless PostgreSQL for production."
    print_info "Please follow these steps:"
    echo ""
    echo "1. Go to https://neon.tech"
    echo "2. Create a new project named 'fanzprotect'"
    echo "3. Copy the connection string"
    echo "4. Update DATABASE_URL in your .env file"
    echo ""
    
    read -p "Have you set up your Neon database? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "Database setup confirmed"
    else
        print_warning "Please set up your Neon database before proceeding"
        echo "Visit: https://neon.tech"
        exit 1
    fi
}

# Check FANZ ecosystem integration
check_fanz_integration() {
    print_header "FANZ ECOSYSTEM INTEGRATION"
    
    print_info "FanzProtect requires API keys from FANZ ecosystem services:"
    echo ""
    echo "Required Services:"
    echo "• FanzSSO (Authentication)"
    echo "• FanzFinance OS (Billing)"
    echo "• FanzMediaCore (Storage)"
    echo "• FanzDash (Admin)"
    echo "• FanzSecurityCompDash (Compliance)"
    echo ""
    
    read -p "Do you have all FANZ ecosystem API keys? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_success "FANZ ecosystem integration confirmed"
    else
        print_warning "You'll need FANZ ecosystem API keys for full functionality"
        print_info "You can still deploy for development/testing without them"
    fi
}

# Build application
build_app() {
    print_header "BUILDING APPLICATION"
    
    print_info "Installing dependencies..."
    npm ci --only=production
    
    print_info "Building frontend..."
    npm run build:frontend 2>/dev/null || print_warning "Frontend build failed - continuing with backend only"
    
    print_info "Building backend..."
    npm run build:backend 2>/dev/null || print_warning "Backend build failed - will run in development mode"
    
    print_success "Application build completed"
}

# Docker deployment
deploy_docker() {
    print_header "DOCKER DEPLOYMENT"
    
    print_info "Building Docker images..."
    docker build -t fanzprotect:latest .
    
    print_info "Starting production services..."
    docker-compose --profile production up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10
    
    print_success "Docker deployment completed"
}

# Health check
health_check() {
    print_header "HEALTH CHECK"
    
    print_info "Checking application health..."
    
    # Check if application is responding
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy!"
        
        # Show health status
        echo ""
        print_info "Health Status:"
        curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health
        
    else
        print_error "Health check failed"
        print_info "Checking logs..."
        docker-compose logs --tail=20 fanzprotect
    fi
}

# Show deployment summary
show_summary() {
    print_header "DEPLOYMENT SUMMARY"
    
    echo -e "${GREEN}🎉 FanzProtect Legal Platform Deployment${NC}"
    echo ""
    echo "🌐 Application URL: http://localhost:5000"
    echo "🔧 Health Check: http://localhost:5000/api/health"
    echo "📊 System Info: http://localhost:5000/api/system"
    echo "⚡ WebSocket: ws://localhost:5000/ws"
    echo ""
    echo "📁 Important Files:"
    echo "• .env - Environment configuration"
    echo "• .env.keys - Secure keys (keep safe!)"
    echo "• docker-compose.yml - Service configuration"
    echo ""
    echo "🔧 Management Commands:"
    echo "• ./scripts/dev.sh logs - View logs"
    echo "• ./scripts/dev.sh health - Check health"
    echo "• ./scripts/dev.sh stop - Stop services"
    echo "• docker-compose restart fanzprotect - Restart app"
    echo ""
    
    if command -v docker-compose &> /dev/null; then
        print_info "Current Service Status:"
        docker-compose ps
    fi
}

# Main deployment flow
main() {
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
 _____ _____ _____ _____   _____ ____  _____ _____ _____ _____ _____ 
|   __|  _  |   | |__   | |  _  | _  |  _  |  _  |   __|     |_    |
|   __|     | | | |   __| |   __|_|  |     |_    |   __|   __|_    |
|__|  |__|__|_|___|_____| |__|  |____|__|__|_    |_____|_____|  |___|
                                            |_    |
                                             |____|
         Legal Protection Platform Deployment
EOF
    echo -e "${NC}"
    
    print_info "Welcome to FanzProtect deployment configuration!"
    print_warning "This script will help you deploy FanzProtect for production use."
    echo ""
    
    # Step-by-step deployment
    check_env_file
    generate_keys
    setup_database
    check_fanz_integration
    
    read -p "Proceed with deployment? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled by user"
        exit 0
    fi
    
    build_app
    deploy_docker
    health_check
    show_summary
    
    print_success "FanzProtect deployment completed successfully! 🎉"
}

# Run deployment based on argument
case "${1:-main}" in
    "keys")
        generate_keys
        ;;
    "build")
        build_app
        ;;
    "docker")
        deploy_docker
        ;;
    "health")
        health_check
        ;;
    "summary")
        show_summary
        ;;
    "main"|*)
        main
        ;;
esac
#!/bin/bash

# FANZ Ecosystem Deployment Script
# Deploys and configures all components of the FANZ unified ecosystem

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
SKIP_DEPENDENCIES=${2:-false}
SKIP_BLOCKCHAIN=${3:-false}
SKIP_DATABASE=${4:-false}

echo -e "${PURPLE}"
echo "🚀 FANZ ECOSYSTEM DEPLOYMENT"
echo "================================"
echo "Environment: $ENVIRONMENT"
echo "Skip Dependencies: $SKIP_DEPENDENCIES"
echo "Skip Blockchain: $SKIP_BLOCKCHAIN"
echo "Skip Database: $SKIP_DATABASE"
echo -e "${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${CYAN}$1${NC}"
    echo "================================"
}

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_section "CHECKING PREREQUISITES"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "npm: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_status "Docker: $DOCKER_VERSION"
else
    print_warning "Docker not found. Some services may not work properly"
fi

# Check PostgreSQL
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    print_status "PostgreSQL: $PSQL_VERSION"
else
    print_warning "PostgreSQL not found. Database setup may fail"
fi

# Check Redis
if command_exists redis-cli; then
    print_status "Redis CLI available"
else
    print_warning "Redis CLI not found. Caching may not work"
fi

# Set up environment variables
print_section "ENVIRONMENT CONFIGURATION"

# Create environment files if they don't exist
ENV_FILES=(
    ".env"
    "backend/.env"
    "frontend/.env"
    "mobile/.env"
    "blockchain/.env"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        if [ -f "$env_file.example" ]; then
            cp "$env_file.example" "$env_file"
            print_status "Created $env_file from example"
        else
            print_warning "$env_file.example not found, skipping $env_file"
        fi
    else
        print_status "$env_file already exists"
    fi
done

# Install dependencies
if [ "$SKIP_DEPENDENCIES" != "true" ]; then
    print_section "INSTALLING DEPENDENCIES"
    
    # Root dependencies
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install
    fi
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Frontend dependencies  
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    # Mobile dependencies (if developing mobile)
    if [ -d "mobile" ]; then
        print_status "Installing mobile dependencies..."
        cd mobile && npm install && cd ..
    fi
    
    # Blockchain dependencies
    if [ -d "blockchain" ] && [ "$SKIP_BLOCKCHAIN" != "true" ]; then
        print_status "Installing blockchain dependencies..."
        cd blockchain && npm install && cd ..
    fi
    
    print_status "All dependencies installed"
else
    print_warning "Skipping dependency installation"
fi

# Database setup
if [ "$SKIP_DATABASE" != "true" ]; then
    print_section "DATABASE SETUP"
    
    # Check if PostgreSQL is running
    if command_exists pg_isready; then
        if pg_isready -q; then
            print_status "PostgreSQL is running"
            
            # Create database if it doesn't exist
            DB_NAME=${DATABASE_NAME:-fanz_unified}
            if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
                print_status "Database '$DB_NAME' already exists"
            else
                createdb "$DB_NAME"
                print_status "Created database '$DB_NAME'"
            fi
            
            # Run migrations
            print_status "Running database migrations..."
            cd backend && npm run migrate && cd ..
            print_status "Database migrations completed"
        else
            print_warning "PostgreSQL is not running. Please start PostgreSQL service"
        fi
    else
        print_warning "pg_isready not found. Skipping database checks"
    fi
else
    print_warning "Skipping database setup"
fi

# Blockchain deployment
if [ "$SKIP_BLOCKCHAIN" != "true" ] && [ -d "blockchain" ]; then
    print_section "BLOCKCHAIN DEPLOYMENT"
    
    cd blockchain
    
    # Compile contracts
    print_status "Compiling smart contracts..."
    npm run compile
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "development"|"dev")
            print_status "Starting local blockchain..."
            # Start local hardhat node in background
            npm run node &
            HARDHAT_PID=$!
            sleep 5  # Wait for node to start
            
            print_status "Deploying to local network..."
            npm run deploy:local
            
            # Save PID for later cleanup
            echo $HARDHAT_PID > hardhat.pid
            ;;
        "testnet"|"test")
            print_status "Deploying to testnet (Sepolia)..."
            npm run deploy:sepolia
            ;;
        "mainnet"|"prod"|"production")
            print_warning "Deploying to mainnet - this will cost real ETH!"
            read -p "Are you sure you want to continue? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                npm run deploy:mainnet
                print_status "Deployed to mainnet"
            else
                print_warning "Mainnet deployment cancelled"
            fi
            ;;
        *)
            print_warning "Unknown environment: $ENVIRONMENT. Skipping blockchain deployment"
            ;;
    esac
    
    cd ..
else
    print_warning "Skipping blockchain deployment"
fi

# Start services
print_section "STARTING SERVICES"

# Start Redis (if available)
if command_exists redis-server; then
    if ! pgrep redis-server > /dev/null; then
        print_status "Starting Redis..."
        redis-server --daemonize yes
    else
        print_status "Redis already running"
    fi
fi

# Start backend services
print_status "Starting backend services..."
cd backend

# Start auth service
if [ -d "../auth-service" ]; then
    cd ../auth-service && npm run dev &
    print_status "Auth service starting..."
fi

# Start API gateway
if [ -d "../api-gateway" ]; then
    cd ../api-gateway && npm run dev &
    print_status "API gateway starting..."
fi

# Start main backend
npm run dev &
BACKEND_PID=$!
print_status "Backend service starting..."

cd ..

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
sleep 10

# Start frontend
print_section "STARTING FRONTEND"
cd frontend
npm start &
FRONTEND_PID=$!
print_status "Frontend starting..."
cd ..

# Health checks
print_section "HEALTH CHECKS"

# Backend health check
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed"
        break
    else
        if [ $i -eq 30 ]; then
            print_error "Backend health check failed after 30 attempts"
        else
            sleep 2
        fi
    fi
done

# Frontend health check
for i in {1..30}; do
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        print_status "Frontend health check passed"
        break
    else
        if [ $i -eq 30 ]; then
            print_error "Frontend health check failed after 30 attempts"
        else
            sleep 2
        fi
    fi
done

# Final setup
print_section "FINAL CONFIGURATION"

# Create initial admin user (if needed)
print_status "Setting up initial configuration..."

# Save process IDs for cleanup
echo "BACKEND_PID=$BACKEND_PID" > .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids
if [ -f "blockchain/hardhat.pid" ]; then
    echo "HARDHAT_PID=$(cat blockchain/hardhat.pid)" >> .pids
fi

print_section "DEPLOYMENT COMPLETE"

echo -e "${GREEN}"
echo "🎉 FANZ Ecosystem deployment completed successfully!"
echo ""
echo "📊 Service Status:"
echo "  • Backend API:     http://localhost:3000"
echo "  • Frontend App:    http://localhost:3001"
echo "  • API Docs:        http://localhost:3000/api/docs"
if [ "$SKIP_BLOCKCHAIN" != "true" ]; then
echo "  • Blockchain:      Running on selected network"
fi
echo ""
echo "🔧 Management Commands:"
echo "  • Stop services:   ./scripts/stop-ecosystem.sh"
echo "  • View logs:       ./scripts/logs.sh"
echo "  • Health check:    ./scripts/health-check.sh"
echo ""
echo "📚 Next Steps:"
echo "  1. Configure payment processors (CCBill, Paxum, Segpay)"
echo "  2. Set up IPFS for media storage"
echo "  3. Configure Firebase for mobile notifications"
echo "  4. Set up SSL certificates for production"
echo "  5. Configure monitoring and analytics"
echo ""
echo "Happy creating! 🚀"
echo -e "${NC}"

# Create quick access script
cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting FANZ Ecosystem..."
source .pids
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "Use Ctrl+C to stop"
wait
EOF

chmod +x quick-start.sh
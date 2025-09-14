#!/bin/bash

# 🛠️ FANZ UNIFIED ECOSYSTEM - DEVELOPMENT SETUP SCRIPT
# Revolutionary local development environment setup

set -e

# 🎨 Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 📁 Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 🔧 Functions
print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 FANZ UNIFIED ECOSYSTEM SETUP 🚀                       ║"
    echo "║                Revolutionary Creator Economy Platform                         ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

# 🔍 Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is installed and running"
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check if Node.js is installed (for local development)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Some scripts may not work."
        echo "Visit: https://nodejs.org/"
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed (${NODE_VERSION})"
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_success "Git is available"
}

# 📂 Setup project directories
setup_directories() {
    print_step "Setting up project directories..."
    
    cd "$PROJECT_DIR"
    
    # Create necessary directories
    mkdir -p {api,frontend,mobile,blockchain,quantum,metaverse,infrastructure,monitoring,database,redis,uploads,logs,tests}
    mkdir -p {docker,helm,scripts,docs}
    mkdir -p database/{migrations,seeds,pgadmin}
    mkdir -p monitoring/{grafana-dev,dashboards,alerts}
    mkdir -p blockchain/{contracts,migrations,test}
    mkdir -p quantum/{circuits,algorithms,tests}
    mkdir -p metaverse/{scenes,assets,configs}
    mkdir -p tests/{unit,integration,e2e}
    mkdir -p docs/{api,deployment,development}
    
    print_success "Project directories created"
}

# 🔐 Setup environment files
setup_environment() {
    print_step "Setting up environment configuration..."
    
    cd "$PROJECT_DIR"
    
    # Create .env files if they don't exist
    if [ ! -f .env.development ]; then
        cat > .env.development << 'EOF'
# 🛠️ FANZ ECOSYSTEM - DEVELOPMENT ENVIRONMENT

# Database
DATABASE_URL=postgresql://fanz_dev:dev_password_123@postgres-dev:5432/fanz_ecosystem_dev
POSTGRES_DB=fanz_ecosystem_dev
POSTGRES_USER=fanz_dev
POSTGRES_PASSWORD=dev_password_123

# Redis
REDIS_URL=redis://:dev_redis_password@redis-dev:6379
REDIS_PASSWORD=dev_redis_password

# Blockchain
BLOCKCHAIN_URL=http://blockchain-dev:8545
BLOCKCHAIN_NETWORK_ID=1337
CREATOR_TOKEN_FACTORY_ADDRESS=0x1234567890123456789012345678901234567890

# Quantum Computing
QUANTUM_URL=http://quantum-dev:8000
QUANTUM_BACKEND=qasm_simulator
MAX_QUBITS=20

# Metaverse
METAVERSE_URL=http://metaverse-dev:9000
WEBXR_ENABLED=true
QUANTUM_AI_ENABLED=true

# API Configuration
API_PORT=3000
API_RATE_LIMIT=1000
JWT_SECRET=dev_jwt_secret_very_long_and_secure_change_in_production
CORS_ORIGIN=http://localhost:3001,http://localhost:3002

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_METAVERSE_URL=http://localhost:9000
NEXT_PUBLIC_BLOCKCHAIN_URL=http://localhost:8545

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_METAVERSE_URL=http://localhost:9000

# Monitoring
GRAFANA_PASSWORD=dev_grafana_password
PROMETHEUS_URL=http://prometheus-dev:9090

# Email
SMTP_HOST=mailhog-dev
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=

# Development Flags
NODE_ENV=development
LOG_LEVEL=debug
DEV_MODE=true
FAST_REFRESH=true
EOF
        print_success "Development environment file created"
    else
        print_warning "Development environment file already exists"
    fi
    
    # Create Docker environment file
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# Docker Compose Environment
COMPOSE_PROJECT_NAME=fanz-ecosystem
COMPOSE_FILE=docker-compose.dev.yml

# Image versions
POSTGRES_VERSION=15-alpine
REDIS_VERSION=7-alpine
NODE_VERSION=18-alpine

# Development settings
DEV_MODE=true
REBUILD_IMAGES=false
EOF
        print_success "Docker environment file created"
    fi
}

# 📦 Setup package.json for development scripts
setup_package_json() {
    print_step "Setting up package.json with development scripts..."
    
    cd "$PROJECT_DIR"
    
    if [ ! -f package.json ]; then
        cat > package.json << 'EOF'
{
  "name": "fanz-unified-ecosystem",
  "version": "1.0.0",
  "description": "Revolutionary Creator Economy Platform",
  "private": true,
  "scripts": {
    "dev:setup": "./scripts/dev-setup.sh",
    "dev:start": "docker-compose -f docker-compose.dev.yml up -d",
    "dev:stop": "docker-compose -f docker-compose.dev.yml down",
    "dev:restart": "docker-compose -f docker-compose.dev.yml restart",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "dev:clean": "docker-compose -f docker-compose.dev.yml down -v && docker system prune -f",
    "dev:rebuild": "docker-compose -f docker-compose.dev.yml build --no-cache",
    "dev:status": "docker-compose -f docker-compose.dev.yml ps",
    "db:migrate": "docker-compose -f docker-compose.dev.yml exec fanz-api-dev npm run migrate",
    "db:seed": "docker-compose -f docker-compose.dev.yml exec fanz-api-dev npm run seed",
    "db:reset": "docker-compose -f docker-compose.dev.yml exec fanz-api-dev npm run db:reset",
    "blockchain:deploy": "docker-compose -f docker-compose.dev.yml exec dev-tools npm run blockchain:deploy",
    "blockchain:compile": "docker-compose -f docker-compose.dev.yml exec dev-tools npm run blockchain:compile",
    "quantum:test": "docker-compose -f docker-compose.dev.yml exec quantum-dev python -m pytest",
    "test:unit": "docker-compose -f docker-compose.dev.yml exec test-runner npm run test:unit",
    "test:integration": "docker-compose -f docker-compose.dev.yml exec test-runner npm run test:integration",
    "test:e2e": "docker-compose -f docker-compose.dev.yml exec test-runner npm run test:e2e",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "lint": "docker-compose -f docker-compose.dev.yml exec dev-tools npm run lint",
    "lint:fix": "docker-compose -f docker-compose.dev.yml exec dev-tools npm run lint:fix",
    "format": "docker-compose -f docker-compose.dev.yml exec dev-tools npm run format",
    "shell:api": "docker-compose -f docker-compose.dev.yml exec fanz-api-dev sh",
    "shell:blockchain": "docker-compose -f docker-compose.dev.yml exec blockchain-dev sh",
    "shell:quantum": "docker-compose -f docker-compose.dev.yml exec quantum-dev bash",
    "shell:metaverse": "docker-compose -f docker-compose.dev.yml exec metaverse-dev sh",
    "shell:tools": "docker-compose -f docker-compose.dev.yml exec dev-tools bash",
    "monitor:logs": "docker-compose -f docker-compose.dev.yml logs -f --tail=100",
    "monitor:stats": "docker stats $(docker-compose -f docker-compose.dev.yml ps -q)",
    "backup:db": "./scripts/backup-dev-db.sh",
    "restore:db": "./scripts/restore-dev-db.sh",
    "update:deps": "./scripts/update-dependencies.sh"
  },
  "workspaces": [
    "api",
    "frontend", 
    "mobile",
    "metaverse"
  ],
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/fanz-unified-ecosystem.git"
  },
  "keywords": [
    "creator-economy",
    "blockchain",
    "metaverse",
    "quantum-ai",
    "adult-entertainment"
  ],
  "author": "FANZ Development Team",
  "license": "PROPRIETARY",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.0.0"
  }
}
EOF
        print_success "Package.json created with development scripts"
    else
        print_warning "Package.json already exists"
    fi
}

# 🐳 Create Docker development files
create_docker_files() {
    print_step "Creating Docker development files..."
    
    cd "$PROJECT_DIR"
    mkdir -p docker
    
    # API Development Dockerfile
    if [ ! -f docker/Dockerfile.api-dev ]; then
        cat > docker/Dockerfile.api-dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install development dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    && npm install -g nodemon typescript ts-node

# Copy package files
COPY api/package*.json ./
RUN npm ci

# Copy source code
COPY api/ .

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]
EOF
        print_success "API Dockerfile created"
    fi
    
    # Quantum Development Dockerfile
    if [ ! -f docker/Dockerfile.quantum-dev ]; then
        cat > docker/Dockerfile.quantum-dev << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY quantum/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install development tools
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    black \
    flake8 \
    mypy

# Copy source code
COPY quantum/ .

# Expose port
EXPOSE 8000

# Development command
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF
        print_success "Quantum Dockerfile created"
    fi
}

# 🔧 Setup development tools
setup_dev_tools() {
    print_step "Setting up development tools..."
    
    cd "$PROJECT_DIR"
    
    # Create VS Code settings
    mkdir -p .vscode
    if [ ! -f .vscode/settings.json ]; then
        cat > .vscode/settings.json << 'EOF'
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "typescript.preferences.importModuleSpecifier": "relative",
    "python.defaultInterpreterPath": "/usr/local/bin/python",
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "solidity.compileUsingRemoteVersion": "v0.8.19",
    "solidity.formatter": "prettier",
    "files.associations": {
        "*.sol": "solidity"
    },
    "docker.containers.groupBy": "compose",
    "git.ignoreLimitWarning": true
}
EOF
        print_success "VS Code settings created"
    fi
    
    # Create launch.json for debugging
    if [ ! -f .vscode/launch.json ]; then
        cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug API",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/api",
            "remoteRoot": "/app",
            "protocol": "inspector"
        },
        {
            "name": "Debug Frontend",
            "type": "node",
            "request": "attach",
            "port": 9230,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/frontend",
            "remoteRoot": "/app"
        },
        {
            "name": "Python: Remote Attach",
            "type": "python",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 5678
            },
            "pathMappings": [
                {
                    "localRoot": "${workspaceFolder}/quantum",
                    "remoteRoot": "/app"
                }
            ]
        }
    ]
}
EOF
        print_success "VS Code launch configuration created"
    fi
    
    # Create .gitignore
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt

# Build outputs
dist/
build/
*.tsbuildinfo
.next/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/settings.json
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Docker
.dockerignore
docker-compose.override.yml

# Blockchain
blockchain/build/
blockchain/contracts/*.json

# Uploads and temporary files
uploads/
temp/
tmp/

# Database backups
*.sql
*.dump

# SSL certificates
*.pem
*.crt
*.key

# Quantum circuit cache
quantum/cache/
*.qasm

# Metaverse assets cache
metaverse/cache/
*.glb
*.gltf

# Monitoring data
monitoring/data/
grafana/data/
prometheus/data/

# Test files
test-results/
playwright-report/
coverage/
EOF
        print_success ".gitignore created"
    fi
}

# 🚀 Start development environment
start_development() {
    print_step "Starting development environment..."
    
    cd "$PROJECT_DIR"
    
    print_step "Building Docker images..."
    docker-compose -f docker-compose.dev.yml build --parallel
    
    print_step "Starting services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    print_step "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    print_step "Checking service health..."
    docker-compose -f docker-compose.dev.yml ps
    
    print_success "Development environment is running!"
    
    # Display access URLs
    echo ""
    echo -e "${CYAN}🌟 ACCESS URLS:${NC}"
    echo -e "${GREEN}├─ API Server:          http://localhost:3000${NC}"
    echo -e "${GREEN}├─ Frontend:            http://localhost:3001${NC}"
    echo -e "${GREEN}├─ Mobile App:          http://localhost:3002${NC}"
    echo -e "${GREEN}├─ Metaverse Server:    http://localhost:9000${NC}"
    echo -e "${GREEN}├─ Quantum Processor:   http://localhost:8001${NC}"
    echo -e "${GREEN}├─ Blockchain RPC:      http://localhost:8545${NC}"
    echo -e "${GREEN}├─ pgAdmin:             http://localhost:5050${NC}"
    echo -e "${GREEN}├─ Redis Commander:     http://localhost:8081${NC}"
    echo -e "${GREEN}├─ Grafana:             http://localhost:3000${NC}"
    echo -e "${GREEN}├─ Prometheus:          http://localhost:9090${NC}"
    echo -e "${GREEN}└─ MailHog:             http://localhost:8025${NC}"
    echo ""
    
    # Display credentials
    echo -e "${CYAN}🔑 DEFAULT CREDENTIALS:${NC}"
    echo -e "${YELLOW}├─ Database: fanz_dev / dev_password_123${NC}"
    echo -e "${YELLOW}├─ Redis: dev_redis_password${NC}"
    echo -e "${YELLOW}├─ pgAdmin: dev@fanz.eco / dev_admin_password${NC}"
    echo -e "${YELLOW}└─ Grafana: admin / dev_grafana_password${NC}"
    echo ""
    
    # Display useful commands
    echo -e "${CYAN}🛠️  USEFUL COMMANDS:${NC}"
    echo -e "${BLUE}├─ npm run dev:logs     # View all logs${NC}"
    echo -e "${BLUE}├─ npm run dev:stop     # Stop services${NC}"
    echo -e "${BLUE}├─ npm run dev:restart  # Restart services${NC}"
    echo -e "${BLUE}├─ npm run dev:status   # Check status${NC}"
    echo -e "${BLUE}├─ npm run shell:api    # API shell${NC}"
    echo -e "${BLUE}├─ npm run db:migrate   # Run migrations${NC}"
    echo -e "${BLUE}└─ npm run test:all     # Run all tests${NC}"
    echo ""
}

# 🧹 Clean up function
cleanup() {
    print_step "Cleaning up development environment..."
    
    cd "$PROJECT_DIR"
    
    if [ "$1" = "--full" ]; then
        print_warning "Performing full cleanup (including volumes)..."
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_success "Full cleanup completed"
    else
        docker-compose -f docker-compose.dev.yml down --remove-orphans
        print_success "Basic cleanup completed"
    fi
}

# 📋 Main menu
show_menu() {
    clear
    print_banner
    echo -e "${CYAN}Please select an option:${NC}"
    echo ""
    echo "1) 🚀 Full setup and start development environment"
    echo "2) 📦 Setup project structure only"
    echo "3) 🔧 Setup development tools only"
    echo "4) 🐳 Start development environment"
    echo "5) 🛑 Stop development environment"
    echo "6) 🧹 Clean up environment"
    echo "7) 🔍 Show environment status"
    echo "8) ❌ Exit"
    echo ""
    read -p "Enter your choice (1-8): " choice
}

# 📊 Show status
show_status() {
    print_step "Development environment status:"
    echo ""
    
    cd "$PROJECT_DIR"
    
    if [ -f docker-compose.dev.yml ]; then
        docker-compose -f docker-compose.dev.yml ps
        echo ""
        print_step "Resource usage:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -f docker-compose.dev.yml ps -q) 2>/dev/null || echo "No containers running"
    else
        print_warning "Development environment not set up"
    fi
}

# 🎯 Main execution
main() {
    # Check if running in non-interactive mode
    if [ "$1" = "--auto" ]; then
        print_banner
        check_prerequisites
        setup_directories
        setup_environment
        setup_package_json
        create_docker_files
        setup_dev_tools
        start_development
        return
    fi
    
    while true; do
        show_menu
        case $choice in
            1)
                print_banner
                check_prerequisites
                setup_directories
                setup_environment
                setup_package_json
                create_docker_files
                setup_dev_tools
                start_development
                read -p "Press Enter to continue..."
                ;;
            2)
                setup_directories
                setup_environment
                setup_package_json
                setup_dev_tools
                print_success "Project structure setup completed!"
                read -p "Press Enter to continue..."
                ;;
            3)
                setup_dev_tools
                create_docker_files
                print_success "Development tools setup completed!"
                read -p "Press Enter to continue..."
                ;;
            4)
                check_prerequisites
                start_development
                read -p "Press Enter to continue..."
                ;;
            5)
                cleanup
                read -p "Press Enter to continue..."
                ;;
            6)
                echo "Select cleanup type:"
                echo "1) Basic cleanup (keep volumes)"
                echo "2) Full cleanup (remove volumes)"
                read -p "Enter choice (1-2): " cleanup_choice
                if [ "$cleanup_choice" = "2" ]; then
                    cleanup --full
                else
                    cleanup
                fi
                read -p "Press Enter to continue..."
                ;;
            7)
                show_status
                read -p "Press Enter to continue..."
                ;;
            8)
                print_success "Goodbye! 🚀"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                sleep 2
                ;;
        esac
    done
}

# 🚀 Run main function
main "$@"
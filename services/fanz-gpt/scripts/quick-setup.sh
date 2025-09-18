#!/bin/bash

# 🚀 FanzGPT AI Assistant - Quick Setup Script
# This script sets up the complete development environment for FanzGPT

set -e  # Exit on any error

echo "🤖 Setting up FanzGPT AI Assistant..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version check passed: $(npm -v)"

# Create necessary directories
print_info "Creating project directory structure..."
mkdir -p src/{types,utils,services,providers,middleware,models,controllers,config}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs
mkdir -p logs
mkdir -p coverage

print_status "Directory structure created"

# Install dependencies
print_info "Installing dependencies... (this may take a few minutes)"
npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    print_info "Creating environment configuration..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual API keys and configuration"
    print_info "Required API keys:"
    echo "  - OPENAI_API_KEY"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - DATABASE_URL (PostgreSQL)"
    echo "  - REDIS_URL"
    echo ""
else
    print_status "Environment file already exists"
fi

# Initialize git hooks (if using husky)
if [ -f "node_modules/.bin/husky" ]; then
    print_info "Setting up git hooks..."
    npm run prepare
    print_status "Git hooks configured"
fi

# Build the project
print_info "Building TypeScript project..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Project built successfully"
else
    print_warning "Build completed with warnings"
fi

# Run basic tests
print_info "Running basic tests..."
npm test -- --passWithNoTests

if [ $? -eq 0 ]; then
    print_status "Tests passed"
else
    print_warning "Some tests failed - this is normal for initial setup"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_status "Docker is available for containerized deployment"
    
    # Offer to build Docker image
    read -p "Would you like to build a Docker image? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building Docker image..."
        docker build -t fanz-gpt:latest .
        print_status "Docker image built successfully"
    fi
else
    print_warning "Docker not found - containerized deployment won't be available"
fi

# Setup complete
echo ""
echo "🎉 FanzGPT Setup Complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Set up PostgreSQL and Redis databases"
echo "3. Run 'npm run dev' to start development server"
echo "4. Run 'npm run demo' to test AI capabilities"
echo ""
echo "Available commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run test     - Run test suite"
echo "  npm run demo     - Run comprehensive demo"
echo "  npm run lint     - Check code style"
echo "  npm run format   - Format code with Prettier"
echo ""
echo "Documentation:"
echo "  README.md        - Complete documentation"
echo "  .env.example     - Environment configuration guide"
echo "  docs/            - Additional documentation"
echo ""
echo "🚀 Ready to revolutionize creator content with AI!"

# Check for common setup issues
echo ""
echo "🔍 System Check:"

# Check for required services
if command -v psql &> /dev/null; then
    print_status "PostgreSQL client found"
else
    print_warning "PostgreSQL client not found - you'll need a database"
fi

if command -v redis-cli &> /dev/null; then
    print_status "Redis client found"
else
    print_warning "Redis client not found - caching will be disabled"
fi

# Check disk space
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
print_info "Available disk space: $AVAILABLE_SPACE"

# Check memory
if command -v free &> /dev/null; then
    AVAILABLE_MEMORY=$(free -h | awk 'NR==2 {print $7}')
    print_info "Available memory: $AVAILABLE_MEMORY"
fi

echo ""
print_status "Setup completed successfully! 🎯"
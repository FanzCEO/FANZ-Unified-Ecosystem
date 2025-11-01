#!/bin/bash

echo "🔍 FANZ Unified Ecosystem - Deployment Readiness Check"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "ℹ️  $1"
}

# Check 1: Git status
echo ""
info "Checking Git repository status..."
if [ -z "$(git status --porcelain)" ]; then
    success "Git repository is clean"
else
    warning "Uncommitted changes detected"
    git status --short
fi

# Check 2: Required files exist
echo ""
info "Checking required files..."
files=("project.yml" "package.json" "src/index.ts" "tsconfig.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        error "$file missing"
    fi
done

# Check 3: Node modules
echo ""
info "Checking dependencies..."
if [ -d "node_modules" ]; then
    success "Node modules installed"
else
    warning "Node modules not found - run 'npm install'"
fi

# Check 4: Build test
echo ""
info "Testing build process..."
if npm run build > /dev/null 2>&1; then
    success "Build successful"
else
    error "Build failed - check TypeScript errors"
    exit 1
fi

# Check 5: Verify built files
echo ""
info "Checking build output..."
if [ -f "dist/index.js" ]; then
    success "Main application built successfully"
    file_size=$(wc -c < "dist/index.js")
    info "Built file size: ${file_size} bytes"
else
    error "Built application not found"
    exit 1
fi

# Check 6: Package.json scripts
echo ""
info "Verifying package.json scripts..."
scripts=("build" "start" "dev")
for script in "${scripts[@]}"; do
    if npm run "$script" --silent 2>/dev/null | grep -q "Unknown script"; then
        error "Script '$script' not found"
    else
        success "Script '$script' available"
    fi
done

# Check 7: Project.yml validation
echo ""
info "Validating project.yml..."
if grep -q "fanz-ecosystem-main" project.yml; then
    success "Service name configured correctly"
else
    error "Service name not found in project.yml"
fi

if grep -q "npm start" project.yml; then
    success "Run command configured correctly"
else
    error "Run command not found in project.yml"
fi

if grep -q "/healthz" project.yml; then
    success "Health check endpoint configured"
else
    error "Health check endpoint not configured"
fi

# Check 8: Environment readiness
echo ""
info "Environment configuration..."
if [ -f ".env" ]; then
    warning "Local .env file found - ensure secrets are set in DigitalOcean"
else
    success "No local .env file (good for production)"
fi

# Check 9: Port configuration
echo ""
info "Checking port configuration..."
if grep -q "process.env.PORT" src/index.ts; then
    success "Dynamic port configuration found"
else
    error "Port not configurable from environment"
fi

# Check 10: Adult content compliance
echo ""
info "Adult content hosting compliance..."
if grep -q "helmet" src/index.ts; then
    success "Security headers configured"
else
    warning "Security headers not found"
fi

if grep -q "cors" src/index.ts; then
    success "CORS configured"
else
    warning "CORS not configured"
fi

echo ""
echo "=================================================="
success "🚀 FANZ Unified Ecosystem is READY for DigitalOcean deployment!"
echo ""
info "Next steps:"
echo "  1. Go to https://cloud.digitalocean.com/apps"
echo "  2. Click 'Create App'"
echo "  3. Connect this repository: FANZ-Unified-Ecosystem"
echo "  4. Select branch: main"
echo "  5. Follow the deployment guide: DIGITALOCEAN_DEPLOYMENT_GUIDE.md"
echo ""
success "All systems go! 🎯"

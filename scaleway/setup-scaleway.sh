#!/bin/bash

# FANZ Unified Ecosystem - Scaleway Setup Script
# This script helps you set up Scaleway credentials and prepare for deployment

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Welcome message
echo -e "${PURPLE}"
cat << "EOF"
🌟 ====================================
   FANZ SCALEWAY SETUP
   Preparing for Deployment
🌟 ====================================
EOF
echo -e "${NC}"

log "Setting up FANZ ecosystem for Scaleway deployment..."

# Check if Scaleway CLI is configured
if scw config get access-key &>/dev/null; then
    success "Scaleway CLI already configured"
    ACCESS_KEY=$(scw config get access-key)
    info "Using access key: ${ACCESS_KEY:0:8}..."
else
    warning "Scaleway CLI not configured"
    
    echo
    info "To deploy FANZ to Scaleway, you need to:"
    echo "1. Create a Scaleway account at https://console.scaleway.com"
    echo "2. Generate API keys in the IAM section"
    echo "3. Configure the CLI with your credentials"
    echo
    
    read -p "Do you want to configure Scaleway CLI now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Starting Scaleway CLI configuration..."
        scw init
        success "Scaleway CLI configured successfully"
    else
        warning "Skipping Scaleway configuration"
        echo
        info "You can configure it later by running: scw init"
        echo "Then run this script again to continue with deployment"
        exit 0
    fi
fi

# Create secrets file if it doesn't exist
SECRETS_FILE="$(dirname "$0")/terraform/secrets.tfvars"
if [ ! -f "$SECRETS_FILE" ]; then
    log "Creating secrets file..."
    
    cat > "$SECRETS_FILE" << EOF
# FANZ Secrets Configuration
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

postgres_password = "$(openssl rand -base64 32)"
redis_password = "$(openssl rand -base64 32)" 
jwt_secret = "$(openssl rand -base64 64)"
openai_api_key = "${OPENAI_API_KEY:-sk-placeholder-openai-key-replace-me}"
EOF
    
    chmod 600 "$SECRETS_FILE"
    success "Secrets file created at $SECRETS_FILE"
    
    if [[ "${OPENAI_API_KEY:-}" == "" ]]; then
        warning "Please update the OpenAI API key in $SECRETS_FILE"
        info "You can get one from https://platform.openai.com/api-keys"
    fi
else
    success "Secrets file already exists"
fi

# Create .env file for convenience
ENV_FILE="$(dirname "$0")/.env"
if [ ! -f "$ENV_FILE" ]; then
    log "Creating environment file..."
    
    cat > "$ENV_FILE" << EOF
# Scaleway Configuration
export SCW_ACCESS_KEY="$(scw config get access-key 2>/dev/null || echo 'your-access-key-here')"
export SCW_SECRET_KEY="$(scw config get secret-key 2>/dev/null || echo 'your-secret-key-here')"
export SCW_DEFAULT_REGION="$(scw config get default-region 2>/dev/null || echo 'fr-par')"
export SCW_DEFAULT_ZONE="$(scw config get default-zone 2>/dev/null || echo 'fr-par-1')"

# FANZ Configuration
export ENVIRONMENT="production"
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-placeholder-openai-key}"

# Docker Configuration
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
EOF
    
    chmod 600 "$ENV_FILE"
    success "Environment file created at $ENV_FILE"
else
    success "Environment file already exists"
fi

# Test Scaleway connection
log "Testing Scaleway connection..."
if scw account ssh-key list &>/dev/null; then
    success "Scaleway connection successful"
else
    error "Failed to connect to Scaleway. Please check your credentials."
fi

# Check Docker
log "Checking Docker..."
if docker info &>/dev/null; then
    success "Docker is running"
else
    warning "Docker is not running. Please start Docker Desktop."
    info "You can start it from Applications or run: open -a Docker"
fi

# Display current configuration
echo
log "Current Scaleway Configuration:"
echo "  Region: $(scw config get default-region 2>/dev/null || echo 'not set')"
echo "  Zone: $(scw config get default-zone 2>/dev/null || echo 'not set')"
echo "  Organization: $(scw config get default-organization-id 2>/dev/null || echo 'not set')"
echo

success "Setup complete! Ready for deployment."
echo
info "To deploy FANZ to Scaleway, run:"
echo "  ./scaleway/deploy-to-scaleway.sh"
echo
info "To load environment variables:"
echo "  source ./scaleway/.env"
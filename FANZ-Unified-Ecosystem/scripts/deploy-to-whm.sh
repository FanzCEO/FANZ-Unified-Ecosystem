#!/bin/bash

###############################################################################
# WHM/cPanel Deployment Script for FANZ Unified Ecosystem
#
# This script automates deployment of all FANZ platforms to WHM/cPanel server
#
# Usage: ./deploy-to-whm.sh [SERVER_IP] [USERNAME] [OPTIONS]
#
# Example: ./deploy-to-whm.sh 192.168.1.100 fanzuser --platforms="boyfanz girlfanz"
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ALL_PLATFORMS=("boyfanz" "girlfanz" "gayfanz" "bearfanz" "cougarfanz" "pupfanz" "femmefanz" "transfanz" "southernfanz" "taboofanz" "guyz" "dlbroz" "fanzuncut" "fanzdash" "fanzmoneydash" "fanzsso")
DEPLOY_PLATFORMS=()
SERVER_IP=""
USERNAME=""
BASE_DIR="public_html"
GIT_REPO="https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git"
NODE_VERSION="18"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Parse Arguments
###############################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --server=*)
            SERVER_IP="${1#*=}"
            shift
            ;;
        --user=*)
            USERNAME="${1#*=}"
            shift
            ;;
        --platforms=*)
            IFS=' ' read -ra DEPLOY_PLATFORMS <<< "${1#*=}"
            shift
            ;;
        --base-dir=*)
            BASE_DIR="${1#*=}"
            shift
            ;;
        --all)
            DEPLOY_PLATFORMS=("${ALL_PLATFORMS[@]}")
            shift
            ;;
        --help)
            echo "Usage: $0 --server=IP --user=USERNAME [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --server=IP          Server IP address or hostname"
            echo "  --user=USERNAME      SSH/cPanel username"
            echo "  --platforms=\"p1 p2\"  Space-separated list of platforms to deploy"
            echo "  --all                Deploy all platforms"
            echo "  --base-dir=PATH      Base directory (default: public_html)"
            echo "  --help               Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --server=192.168.1.100 --user=fanzuser --platforms=\"boyfanz girlfanz\""
            exit 0
            ;;
        *)
            if [ -z "$SERVER_IP" ]; then
                SERVER_IP="$1"
            elif [ -z "$USERNAME" ]; then
                USERNAME="$1"
            fi
            shift
            ;;
    esac
done

# Validate required parameters
if [ -z "$SERVER_IP" ] || [ -z "$USERNAME" ]; then
    print_error "Server IP and username are required!"
    echo "Usage: $0 --server=IP --user=USERNAME [OPTIONS]"
    echo "Run '$0 --help' for more information"
    exit 1
fi

if [ ${#DEPLOY_PLATFORMS[@]} -eq 0 ]; then
    print_warning "No platforms specified. Use --platforms=\"platform1 platform2\" or --all"
    exit 1
fi

###############################################################################
# Pre-Flight Checks
###############################################################################

print_header "Pre-Flight Checks"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    print_warning "No SSH key found. Password authentication will be used."
    echo "To set up key-based authentication, run:"
    echo "  ssh-keygen -t ed25519"
    echo "  ssh-copy-id $USERNAME@$SERVER_IP"
else
    print_success "SSH key found"
fi

# Test SSH connection
print_info "Testing SSH connection to $USERNAME@$SERVER_IP..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes "$USERNAME@$SERVER_IP" "echo 'Connection successful'" 2>/dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to server. Please check:"
    echo "  - Server IP: $SERVER_IP"
    echo "  - Username: $USERNAME"
    echo "  - SSH access enabled"
    echo "  - Firewall allows SSH (port 22)"
    exit 1
fi

print_success "Pre-flight checks passed"
echo ""

###############################################################################
# Server Setup
###############################################################################

print_header "Server Setup"

# Check if Node.js is installed
print_info "Checking Node.js installation..."
NODE_CHECK=$(ssh "$USERNAME@$SERVER_IP" "command -v node" 2>/dev/null || echo "")

if [ -z "$NODE_CHECK" ]; then
    print_warning "Node.js not found on server"
    print_info "Installing Node.js $NODE_VERSION via NVM..."

    ssh "$USERNAME@$SERVER_IP" << 'EOF'
        # Install NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

        # Load NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

        # Install Node.js
        nvm install 18
        nvm use 18
        nvm alias default 18

        # Install pnpm and PM2
        npm install -g pnpm pm2
EOF

    print_success "Node.js installed"
else
    print_success "Node.js already installed"
fi

# Check if pnpm is installed
print_info "Checking pnpm installation..."
PNPM_CHECK=$(ssh "$USERNAME@$SERVER_IP" "command -v pnpm" 2>/dev/null || echo "")

if [ -z "$PNPM_CHECK" ]; then
    print_info "Installing pnpm..."
    ssh "$USERNAME@$SERVER_IP" "npm install -g pnpm"
    print_success "pnpm installed"
else
    print_success "pnpm already installed"
fi

# Check if PM2 is installed
print_info "Checking PM2 installation..."
PM2_CHECK=$(ssh "$USERNAME@$SERVER_IP" "command -v pm2" 2>/dev/null || echo "")

if [ -z "$PM2_CHECK" ]; then
    print_info "Installing PM2..."
    ssh "$USERNAME@$SERVER_IP" "npm install -g pm2"
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

echo ""

###############################################################################
# Deploy Repository
###############################################################################

print_header "Repository Deployment"

# Check if repository exists
REPO_EXISTS=$(ssh "$USERNAME@$SERVER_IP" "[ -d ~/$BASE_DIR/.git ] && echo 'yes' || echo 'no'")

if [ "$REPO_EXISTS" == "yes" ]; then
    print_info "Repository exists, pulling latest changes..."
    ssh "$USERNAME@$SERVER_IP" << EOF
        cd ~/$BASE_DIR
        git pull origin main
EOF
    print_success "Repository updated"
else
    print_info "Cloning repository..."
    ssh "$USERNAME@$SERVER_IP" << EOF
        # Backup existing files if any
        if [ -d ~/$BASE_DIR ] && [ "\$(ls -A ~/$BASE_DIR)" ]; then
            mv ~/$BASE_DIR ~/${BASE_DIR}_backup_\$(date +%Y%m%d_%H%M%S)
        fi

        # Create directory if it doesn't exist
        mkdir -p ~/$BASE_DIR

        # Clone repository
        git clone $GIT_REPO ~/$BASE_DIR
EOF
    print_success "Repository cloned"
fi

echo ""

###############################################################################
# Deploy Each Platform
###############################################################################

print_header "Platform Deployment"

for platform in "${DEPLOY_PLATFORMS[@]}"; do
    echo ""
    print_info "Deploying $platform..."

    # Check if platform exists
    PLATFORM_EXISTS=$(ssh "$USERNAME@$SERVER_IP" "[ -d ~/$BASE_DIR/$platform ] && echo 'yes' || echo 'no'")

    if [ "$PLATFORM_EXISTS" == "no" ]; then
        print_error "Platform directory not found: $platform"
        print_warning "Skipping $platform"
        continue
    fi

    # Deploy platform
    ssh "$USERNAME@$SERVER_IP" << EOF
        cd ~/$BASE_DIR/$platform

        # Install dependencies
        echo "Installing dependencies..."
        pnpm install --production

        # Check if .env exists
        if [ ! -f .env ]; then
            if [ -f .env.example ]; then
                echo "Creating .env from .env.example..."
                cp .env.example .env
                echo "⚠ WARNING: Please configure .env file manually!"
            else
                echo "⚠ WARNING: No .env or .env.example found!"
            fi
        fi

        # Build application
        if grep -q '"build"' package.json; then
            echo "Building application..."
            pnpm run build
        fi

        # Set up PM2
        PM2_APP_EXISTS=\$(pm2 list | grep -c "$platform" || echo "0")

        if [ "\$PM2_APP_EXISTS" -gt 0 ]; then
            echo "Restarting PM2 app..."
            pm2 restart $platform
        else
            echo "Starting PM2 app..."
            pm2 start npm --name "$platform" -- start
            pm2 save
        fi
EOF

    if [ $? -eq 0 ]; then
        print_success "$platform deployed successfully"
    else
        print_error "$platform deployment failed"
    fi
done

echo ""

###############################################################################
# Documentation Verification
###############################################################################

print_header "Documentation Verification"

for platform in "${DEPLOY_PLATFORMS[@]}"; do
    DOC_CHECK=$(ssh "$USERNAME@$SERVER_IP" "[ -d ~/$BASE_DIR/$platform/docs ] && echo 'yes' || echo 'no'")

    if [ "$DOC_CHECK" == "yes" ]; then
        print_success "$platform documentation deployed"
    else
        print_warning "$platform documentation not found"
    fi
done

echo ""

###############################################################################
# Final Status
###############################################################################

print_header "Deployment Summary"

# Get PM2 status
print_info "PM2 Application Status:"
ssh "$USERNAME@$SERVER_IP" "pm2 list" | grep -E "$(IFS="|"; echo "${DEPLOY_PLATFORMS[*]}")"

echo ""
print_success "Deployment completed!"

# Print next steps
echo ""
print_header "Next Steps"
echo "1. Configure .env files for each platform:"
for platform in "${DEPLOY_PLATFORMS[@]}"; do
    echo "   ssh $USERNAME@$SERVER_IP"
    echo "   nano ~/$BASE_DIR/$platform/.env"
done
echo ""
echo "2. Set up databases in WHM:"
echo "   - Go to WHM → SQL Services → Create Database"
echo "   - Create database for each platform"
echo "   - Update DATABASE_URL in .env files"
echo ""
echo "3. Configure Apache/Nginx reverse proxy:"
echo "   - Map domains to Node.js app ports"
echo "   - Set up SSL certificates"
echo ""
echo "4. Test applications:"
for platform in "${DEPLOY_PLATFORMS[@]}"; do
    echo "   http://$platform.yourdomain.com"
done
echo ""

print_info "For detailed setup instructions, see: WHM_CPANEL_DEPLOYMENT_GUIDE.md"

###############################################################################
# End of Script
###############################################################################

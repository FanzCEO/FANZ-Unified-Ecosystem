#!/bin/bash

# Warp Terminal Setup Script for FanzEcosystem
# This script configures Warp terminal for optimal FanzEcosystem development

set -e

echo "🎬 Setting up Warp Terminal for FanzEcosystem..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Warp is installed
check_warp() {
    if command -v warp &> /dev/null; then
        print_success "Warp terminal is installed"
        return 0
    else
        print_warning "Warp terminal not found"
        return 1
    fi
}

# Create Warp configuration directory
setup_warp_config() {
    local warp_config_dir="$HOME/.warp"
    
    print_status "Setting up Warp configuration..."
    
    # Create config directory if it doesn't exist
    mkdir -p "$warp_config_dir/themes"
    
    # Copy configuration files
    if [ -f ".warp/settings.yaml" ]; then
        cp ".warp/settings.yaml" "$warp_config_dir/"
        print_success "Copied Warp settings"
    fi
    
    if [ -f ".warp/themes/FanzDark.yaml" ]; then
        cp ".warp/themes/FanzDark.yaml" "$warp_config_dir/themes/"
        print_success "Copied FanzDark theme"
    fi
}

# Set up environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Check if .env already exists and has proper content
    if [ -f ".env" ] && grep -q "fanz-status" ".env"; then
        print_success ".env file already configured"
    else
        # Create or update .env file with basic variables only
        cat > .env << EOF
# FanzEcosystem Environment Configuration
FANZ_ENV=development
FANZ_DEBUG=true
FANZ_LOG_LEVEL=info
FANZ_WARP_ENABLED=true
EOF
        print_success "Created basic .env file"
        print_warning "For full functionality, source the enhanced .env file: source .env"
    fi
}

# Install Warp (macOS only)
install_warp_macos() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Installing Warp terminal on macOS..."
        if command -v brew &> /dev/null; then
            brew install --cask warp
            print_success "Warp installed via Homebrew"
        else
            print_warning "Homebrew not found. Please install Warp manually from https://www.warp.dev/"
        fi
    fi
}

# Main setup function
main() {
    echo "🚀 Starting FanzEcosystem Warp setup..."
    echo
    
    # Check OS
    print_status "Detected OS: $OSTYPE"
    
    # Check if Warp is installed
    if ! check_warp; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            read -p "Would you like to install Warp terminal? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_warp_macos
            fi
        else
            print_warning "Please install Warp terminal manually from https://www.warp.dev/"
        fi
    fi
    
    # Setup configuration
    setup_warp_config
    setup_environment
    
    echo
    print_success "🎉 Warp setup complete!"
    echo
    print_status "Next steps:"
    echo "  1. Open Warp terminal"
    echo "  2. Navigate to this project directory"
    echo "  3. Run 'source .env' to load environment variables"
    echo "  4. The FanzDark theme should be available in Warp settings"
    echo
    print_status "Enjoy developing with FanzEcosystem! 🎬"
}

# Run main function
main "$@"
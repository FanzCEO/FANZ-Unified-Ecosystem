#!/bin/bash
#
# NEW MAC DEVELOPER SETUP SCRIPT
# ==============================
# Run this on a brand new Mac to install all developer tools
#
# Usage:
#   1. Open Terminal
#   2. Run: curl -fsSL https://raw.githubusercontent.com/FanzCEO/FANZ-Unified-Ecosystem/main/new-mac-setup.sh | bash
#   OR
#   1. Copy this entire script
#   2. Open Terminal
#   3. Paste and press Enter
#

set -e

echo "=============================================="
echo "   NEW MAC DEVELOPER SETUP"
echo "   Setting up your development environment..."
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================
# STEP 1: Install Xcode Command Line Tools
# ============================================
print_step "Installing Xcode Command Line Tools..."
if ! xcode-select -p &>/dev/null; then
    xcode-select --install
    echo "Please complete the Xcode Command Line Tools installation popup, then press Enter to continue..."
    read -r
else
    print_success "Xcode Command Line Tools already installed"
fi

# ============================================
# STEP 2: Install Homebrew
# ============================================
print_step "Installing Homebrew..."
if ! command -v brew &>/dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    print_success "Homebrew already installed"
fi

# Update Homebrew
brew update

# ============================================
# STEP 3: Install Core CLI Tools
# ============================================
print_step "Installing core CLI tools..."

CORE_TOOLS=(
    git
    git-lfs
    git-secrets
    gitleaks
    gh              # GitHub CLI
    jq              # JSON processor
    yq              # YAML processor
    ripgrep         # Fast grep
    fd              # Fast find
    bat             # Better cat
    eza             # Better ls (successor to exa)
    lsd             # LSDeluxe
    htop            # Process viewer
    tree            # Directory tree
    watch           # Watch command
    wget
    curl
    tmux            # Terminal multiplexer
    starship        # Shell prompt
)

for tool in "${CORE_TOOLS[@]}"; do
    if brew list "$tool" &>/dev/null; then
        print_success "$tool already installed"
    else
        brew install "$tool" && print_success "Installed $tool"
    fi
done

# ============================================
# STEP 4: Install Programming Languages
# ============================================
print_step "Installing programming languages..."

# Node.js via NVM
print_step "Installing NVM and Node.js..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm install --lts
nvm use --lts
print_success "Node.js $(node --version) installed"

# pnpm
print_step "Installing pnpm..."
npm install -g pnpm
print_success "pnpm installed"

# Bun
print_step "Installing Bun..."
brew install bun
print_success "Bun installed"

# Go
print_step "Installing Go..."
brew install go
print_success "Go installed"

# Rust
print_step "Installing Rust..."
if ! command -v rustc &>/dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi
print_success "Rust installed"

# Python
print_step "Installing Python..."
brew install python@3.14 python@3.13 pipx
print_success "Python installed"

# Ruby
print_step "Installing Ruby..."
brew install ruby
print_success "Ruby installed"

# Elixir/Erlang
print_step "Installing Elixir..."
brew install elixir erlang
print_success "Elixir installed"

# ============================================
# STEP 5: Install Cloud & DevOps Tools
# ============================================
print_step "Installing Cloud & DevOps tools..."

CLOUD_TOOLS=(
    awscli          # AWS CLI
    doctl           # DigitalOcean CLI
    terraform       # Infrastructure as Code
    opentofu        # Terraform alternative
    kubernetes-cli  # kubectl
    helm            # Kubernetes package manager
    argocd          # GitOps
    eksctl          # EKS CLI
    supabase        # Supabase CLI
    render          # Render CLI
)

for tool in "${CLOUD_TOOLS[@]}"; do
    brew install "$tool" 2>/dev/null && print_success "Installed $tool" || print_warning "Skipped $tool"
done

# ============================================
# STEP 6: Install Security Tools
# ============================================
print_step "Installing security tools..."

SECURITY_TOOLS=(
    trivy           # Vulnerability scanner
    trufflehog      # Secrets scanner
    checkov         # IaC security
    hadolint        # Dockerfile linter
    tfsec           # Terraform security
    syft            # SBOM generator
)

for tool in "${SECURITY_TOOLS[@]}"; do
    brew install "$tool" 2>/dev/null && print_success "Installed $tool" || print_warning "Skipped $tool"
done

# ============================================
# STEP 7: Install Database Tools
# ============================================
print_step "Installing database tools..."

brew install postgresql@15 redis
print_success "Database tools installed"

# ============================================
# STEP 8: Install Media Tools
# ============================================
print_step "Installing media tools..."
brew install ffmpeg
print_success "FFmpeg installed"

# ============================================
# STEP 9: Install GUI Applications (Casks)
# ============================================
print_step "Installing GUI applications..."

CASKS=(
    visual-studio-code  # Code editor
    docker-desktop      # Docker
    iterm2              # Terminal
    warp                # Modern terminal
    postman             # API testing
    insomnia            # API testing alternative
    ngrok               # Tunneling
    1password-cli       # Password manager CLI
    lens                # Kubernetes IDE
)

for cask in "${CASKS[@]}"; do
    if brew list --cask "$cask" &>/dev/null; then
        print_success "$cask already installed"
    else
        brew install --cask "$cask" && print_success "Installed $cask" || print_warning "Skipped $cask"
    fi
done

# ============================================
# STEP 10: Install Global NPM Packages
# ============================================
print_step "Installing global NPM packages..."

npm install -g \
    @anthropic-ai/claude-code \
    netlify-cli \
    happy-coder

print_success "Global NPM packages installed"

# ============================================
# STEP 11: Configure Git
# ============================================
print_step "Configuring Git..."

echo "Enter your Git name (e.g., Joshua Stone):"
read -r GIT_NAME
echo "Enter your Git email:"
read -r GIT_EMAIL

git config --global user.name "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor "code --wait"

# Setup Git LFS
git lfs install

print_success "Git configured"

# ============================================
# STEP 12: Configure Shell (Zsh)
# ============================================
print_step "Configuring shell..."

# Add to .zshrc if not already present
ZSHRC="$HOME/.zshrc"

cat >> "$ZSHRC" << 'ZSHRC_CONTENT'

# ============================================
# Developer Environment Configuration
# ============================================

# Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null

# NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Go
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$PATH"

# Rust
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# Starship prompt
eval "$(starship init zsh)"

# Aliases
alias ll='eza -la --icons'
alias ls='eza --icons'
alias cat='bat'
alias grep='rg'
alias find='fd'
alias k='kubectl'
alias tf='terraform'
alias dc='docker-compose'
alias g='git'
alias gs='git status'
alias gp='git push'
alias gl='git pull'
alias gc='git commit'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gd='git diff'
alias ga='git add'
alias gaa='git add .'

# PATH additions
export PATH="$HOME/bin:$PATH"
export PATH="$HOME/.local/bin:$PATH"

ZSHRC_CONTENT

print_success "Shell configured"

# ============================================
# STEP 13: GitHub CLI Authentication
# ============================================
print_step "Setting up GitHub CLI..."
echo "Please authenticate with GitHub:"
gh auth login

print_success "GitHub CLI configured"

# ============================================
# STEP 14: SSH Key Setup
# ============================================
print_step "Setting up SSH key..."

if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
    ssh-keygen -t ed25519 -C "$GIT_EMAIL" -f "$HOME/.ssh/id_ed25519" -N ""
    eval "$(ssh-agent -s)"
    ssh-add "$HOME/.ssh/id_ed25519"

    echo ""
    echo "Your SSH public key (add this to GitHub):"
    echo "============================================"
    cat "$HOME/.ssh/id_ed25519.pub"
    echo "============================================"
    echo ""
    echo "Opening GitHub SSH keys page..."
    open "https://github.com/settings/ssh/new"
    echo "Press Enter after adding the key to GitHub..."
    read -r
fi

print_success "SSH key configured"

# ============================================
# STEP 15: Create Development Directory
# ============================================
print_step "Creating development directories..."

mkdir -p "$HOME/Development"
mkdir -p "$HOME/Projects"
mkdir -p "$HOME/bin"

print_success "Development directories created"

# ============================================
# STEP 16: Clone Your Repositories
# ============================================
print_step "Would you like to clone your FANZ repositories? (y/n)"
read -r CLONE_REPOS

if [[ "$CLONE_REPOS" =~ ^[Yy]$ ]]; then
    cd "$HOME/Development"
    gh repo clone FanzCEO/FANZ-Unified-Ecosystem
    print_success "Repositories cloned"
fi

# ============================================
# FINAL STEPS
# ============================================
echo ""
echo "=============================================="
echo -e "${GREEN}   SETUP COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: source ~/.zshrc"
echo "2. Open Docker Desktop and complete setup"
echo "3. Open VS Code and sign in to sync settings"
echo "4. Configure 1Password CLI: op signin"
echo ""
echo "Installed tools summary:"
echo "- Languages: Node.js, Go, Rust, Python, Ruby, Elixir"
echo "- Cloud: AWS CLI, Terraform, kubectl, Helm, Supabase"
echo "- Security: Trivy, Trufflehog, Checkov"
echo "- Apps: VS Code, Docker, iTerm2, Warp, Postman"
echo ""
echo "Happy coding!"

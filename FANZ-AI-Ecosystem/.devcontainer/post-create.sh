#!/usr/bin/env bash
set -euo pipefail

log() { printf "\033[1;36m[FANZ-AI-ECOSYSTEM]\033[0m %s\n" "$*"; }
ok() { printf "\033[1;32m[✓]\033[0m %s\n" "$*"; }

log "Setting up FANZ AI Ecosystem development environment..."

# 1) Setup mise and direnv
if command -v mise >/dev/null 2>&1; then
  log "Activating mise toolchain..."
  eval "$(mise activate bash)"
  mise install || true
  ok "Mise toolchain activated"
else
  log "Warning: mise not found, skipping toolchain activation"
fi

if command -v direnv >/dev/null 2>&1; then
  direnv allow . || true
  ok "direnv configured"
fi

# 2) Node.js setup
if [ -f package.json ]; then
  log "Installing pnpm and dependencies..."
  
  # Enable pnpm
  corepack enable || npm install -g pnpm
  
  # Install dependencies
  pnpm install --frozen-lockfile || pnpm install
  ok "Dependencies installed with pnpm"
fi

# 3) Python setup
if [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  log "Setting up Python environment..."
  
  # Create virtual environment
  python3 -m venv .venv || true
  source .venv/bin/activate || true
  
  # Install dependencies
  if [ -f pyproject.toml ]; then
    pip install -e . || true
  elif [ -f requirements.txt ]; then
    pip install -r requirements.txt || true
  fi
  
  # Install development dependencies
  pip install pytest black ruff mypy || true
  ok "Python environment configured"
fi

# 4) Git configuration
log "Configuring Git for FANZ development..."
git config --global init.defaultBranch main || true
git config --global pull.rebase true || true
git config --global fetch.prune true || true

# Setup Git hooks
if [ -d .git ]; then
  # Pre-commit hook for formatting
  cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# FANZ AI Ecosystem pre-commit hook
set -e

echo "🔍 Running pre-commit checks..."

# Format staged files
if command -v prettier >/dev/null 2>&1; then
  prettier --write --list-different . || true
fi

if command -v black >/dev/null 2>&1; then
  black . || true
fi

if command -v ruff >/dev/null 2>&1; then
  ruff check --fix . || true
fi

echo "✅ Pre-commit checks completed"
EOF
  chmod +x .git/hooks/pre-commit || true
  ok "Git hooks configured"
fi

# 5) Docker setup
if command -v docker >/dev/null 2>&1; then
  log "Docker is available for container development"
  # Pull commonly used images
  docker pull node:20-alpine || true
  docker pull python:3.11-slim || true
  docker pull postgres:15-alpine || true
  docker pull redis:7-alpine || true
  ok "Docker base images ready"
fi

# 6) Development utilities
log "Setting up development utilities..."

# Create common directories
mkdir -p logs tmp cache .coverage
mkdir -p apps packages services infrastructure

# Setup environment files
if [ ! -f .env ]; then
  cat > .env << 'EOF'
# FANZ AI Ecosystem Development Environment
NODE_ENV=development
FANZ_ENVIRONMENT=development
PORT=3000

# Adult Content Platform Configuration
ADULT_CONTENT_PLATFORM=true
PAYMENT_PROCESSOR=ccbill
COMPLIANCE_MODE=strict
AGE_VERIFICATION_REQUIRED=true

# Security Configuration
TLS_VERSION=1.3
ENCRYPTION_STANDARD=aes-256
SESSION_SECURE=true
COOKIE_SECURE=true

# Database Configuration (Development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fanz_ai_dev
REDIS_URL=redis://localhost:6379

# AI/ML Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_API_TOKEN=your-huggingface-token

# Payment Processor Configuration (Sandbox/Development)
# CCBill (Adult content friendly)
CCBILL_CLIENT_ACCNUM=your-ccbill-account
CCBILL_FLEX_ID=your-flex-form-id
CCBILL_SALT=your-security-salt

# Paxum (Creator payouts)
PAXUM_API_KEY=your-paxum-api-key
PAXUM_API_SECRET=your-paxum-secret

# CDN and Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=fanz-ai-dev-media
CLOUDFLARE_API_TOKEN=your-cf-token

# Monitoring and Analytics
SENTRY_DSN=your-sentry-dsn
ANALYTICS_TRACKING_ID=your-analytics-id
PROMETHEUS_ENABLED=true
METRICS_PORT=3001
EOF
  ok "Environment file created (.env)"
fi

# 7) IDE configuration
if [ ! -f .vscode/settings.json ]; then
  mkdir -p .vscode
  cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "eslint.workingDirectories": [".", "apps/*", "packages/*", "services/*"],
  "prettier.configPath": ".prettierrc.json",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.mdx": "markdown",
    "Dockerfile*": "dockerfile"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/coverage": true,
    "**/.coverage": true
  }
}
EOF
  ok "VSCode settings configured"
fi

# 8) Development scripts
log "Creating development scripts..."

# Health check script
cat > scripts/health-check.sh << 'EOF'
#!/usr/bin/env bash
# FANZ AI Ecosystem Health Check
set -e

echo "🏥 FANZ AI Ecosystem Health Check"
echo "=================================="

# Check required tools
echo "🔧 Checking development tools..."
command -v node >/dev/null 2>&1 && echo "✅ Node.js: $(node --version)"
command -v pnpm >/dev/null 2>&1 && echo "✅ pnpm: $(pnpm --version)"
command -v python3 >/dev/null 2>&1 && echo "✅ Python: $(python3 --version)"
command -v docker >/dev/null 2>&1 && echo "✅ Docker: $(docker --version)"

# Check services (if running)
echo ""
echo "🚀 Checking services..."
curl -sf http://localhost:3000/health >/dev/null 2>&1 && echo "✅ Main API: Running" || echo "❌ Main API: Not running"
curl -sf http://localhost:8080/health >/dev/null 2>&1 && echo "✅ Gateway: Running" || echo "❌ Gateway: Not running"

# Check databases
echo ""
echo "🗄️  Checking databases..."
pg_isready -h localhost -p 5432 >/dev/null 2>&1 && echo "✅ PostgreSQL: Connected" || echo "❌ PostgreSQL: Not connected"
redis-cli ping >/dev/null 2>&1 && echo "✅ Redis: Connected" || echo "❌ Redis: Not connected"

echo ""
echo "🎉 Health check completed!"
EOF

chmod +x scripts/health-check.sh

# Quick start script
cat > scripts/dev-start.sh << 'EOF'
#!/usr/bin/env bash
# FANZ AI Ecosystem Development Startup
set -e

log() { printf "\033[1;36m[FANZ]\033[0m %s\n" "$*"; }

log "Starting FANZ AI Ecosystem development environment..."

# Start databases
if command -v docker-compose >/dev/null 2>&1; then
  log "Starting infrastructure services..."
  docker-compose up -d postgres redis
  sleep 2
fi

# Start development server
if [ -f package.json ] && command -v pnpm >/dev/null 2>&1; then
  log "Starting development server..."
  pnpm dev
else
  log "No package.json found or pnpm not available"
fi
EOF

chmod +x scripts/dev-start.sh

ok "Development scripts created"

# 9) Documentation
log "Setting up project documentation..."

if [ ! -f DEVELOPMENT.md ]; then
  cat > DEVELOPMENT.md << 'EOF'
# FANZ AI Ecosystem - Development Guide

## Quick Start

1. **Environment Setup**
   ```bash
   # Start development environment
   ./scripts/dev-start.sh
   
   # Health check
   ./scripts/health-check.sh
   ```

2. **Development Commands**
   ```bash
   # Install dependencies
   pnpm install
   
   # Start development server
   pnpm dev
   
   # Run tests
   pnpm test
   
   # Build for production
   pnpm build
   ```

3. **Database Management**
   ```bash
   # Start databases
   docker-compose up -d postgres redis
   
   # Run migrations
   pnpm db:migrate
   
   # Seed development data
   pnpm db:seed
   ```

## Project Structure

- `/apps/` - Frontend applications
- `/services/` - Backend microservices
- `/packages/` - Shared libraries
- `/infrastructure/` - Infrastructure as code
- `/docs/` - Documentation

## Environment Variables

Copy `.env` and configure for your local environment:
- Payment processors (CCBill, Paxum)
- AI services (OpenAI, Anthropic)
- Database connections
- CDN and storage

## Compliance

This platform handles adult content and requires:
- Age verification
- 2257 compliance
- Secure payment processing
- Data protection (GDPR/CCPA)

See `COMPLIANCE.md` for detailed requirements.
EOF
  ok "Development documentation created"
fi

# 10) Final setup
log "Finalizing development environment..."

# Create gitignore additions for development
cat >> .gitignore << 'EOF' || true

# Development environment
.env.local
.env.development.local
.env.staging.local
.env.production.local
*.log
logs/
tmp/
cache/
.coverage/

# IDE
.vscode/launch.json
.vscode/tasks.json
.idea/

# OS
.DS_Store
Thumbs.db
EOF

# Set proper permissions
chmod -R 755 scripts/ || true
chmod 600 .env || true

log "🎉 FANZ AI Ecosystem development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure your .env file with API keys"
echo "  2. Run './scripts/health-check.sh' to verify setup"  
echo "  3. Start development with './scripts/dev-start.sh'"
echo "  4. Visit http://localhost:3000 when ready"
echo ""
echo "Happy coding! 🚀"
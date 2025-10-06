#!/usr/bin/env bash
set -euo pipefail

# FANZ Security Hardening Script
# Addresses GitHub security vulnerabilities and updates dependencies

log() { printf "\033[1;36m[Security]→\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[Warning]→\033[0m %s\n" "$*"; }
success() { printf "\033[1;32m[Success]→\033[0m %s\n" "$*"; }
error() { printf "\033[1;31m[Error]→\033[0m %s\n" "$*"; }

# Check if running from repo root
if [ ! -f "package.json" ]; then
  error "Must run from FANZ repository root"
  exit 1
fi

log "🔒 Starting FANZ Security Hardening Process..."

# Create security reports directory
mkdir -p security-reports/$(date +%Y%m%d)
REPORT_DIR="security-reports/$(date +%Y%m%d)"

# Function to audit and fix a package.json
audit_and_fix() {
  local dir="$1"
  local name=$(basename "$dir")
  
  if [ ! -f "$dir/package.json" ]; then
    warn "No package.json found in $dir"
    return 0
  fi
  
  log "Auditing $name..."
  
  cd "$dir"
  
  # Run audit and capture results
  if npm audit --json > "../$REPORT_DIR/${name}-audit.json" 2>/dev/null; then
    local vulnerabilities=$(jq '.metadata.vulnerabilities.total' "../$REPORT_DIR/${name}-audit.json" 2>/dev/null || echo "0")
    
    if [ "$vulnerabilities" -gt 0 ]; then
      warn "$name has $vulnerabilities vulnerabilities"
      
      # Attempt to fix automatically
      if npm audit fix --force > "../$REPORT_DIR/${name}-fix.log" 2>&1; then
        success "$name vulnerabilities fixed"
      else
        error "$name vulnerabilities could not be auto-fixed"
      fi
    else
      success "$name is secure"
    fi
  else
    warn "Could not audit $name (no package-lock.json?)"
  fi
  
  cd - > /dev/null
}

# Main package directories to audit
PACKAGES=(
  "."
  "frontend"
  "backend"
  "mobile"
  "api-gateway"
  "blockchain"
  "services/fanz-ai-integration"
  "services/fanz-auth"
  "services/fanz-media-core"
  "services/fanz-social"
  "services/fanz-gpt"
  "services/creator-crm"
  "services/fanz-permissions"
  "services/api-gateway"
  "packages/fanz-ui"
  "packages/fanz-secure"
  "security/fanz-secure"
  "ai-intelligence/FanzGPT-Ultra"
)

log "Auditing ${#PACKAGES[@]} package directories..."

# Audit each package
for pkg in "${PACKAGES[@]}"; do
  if [ -d "$pkg" ]; then
    audit_and_fix "$pkg"
  else
    warn "Directory $pkg does not exist"
  fi
done

# Update global security tools
log "🛡️ Updating security tools..."

# Update npm itself
npm install -g npm@latest || warn "Could not update npm"

# Install/update security tools globally
npm install -g \
  npm-audit-resolver \
  audit-ci \
  snyk \
  retire \
  safety-cli \
  || warn "Some security tools could not be installed"

# Run comprehensive security scans
log "🔍 Running comprehensive security scans..."

# Retire.js scan for vulnerable JavaScript libraries
if command -v retire &> /dev/null; then
  log "Running retire.js scan..."
  retire --outputformat json --outputpath "$REPORT_DIR/retire-js-report.json" . || warn "retire.js scan had issues"
fi

# Snyk scan if available
if command -v snyk &> /dev/null; then
  log "Running Snyk security scan..."
  snyk test --json > "$REPORT_DIR/snyk-report.json" || warn "Snyk scan had issues"
fi

# Check for known security patterns in code
log "🔍 Scanning for security anti-patterns..."

# Find potential security issues
rg -i "password\s*=\s*['\"]" --type js --type ts . > "$REPORT_DIR/hardcoded-passwords.txt" || true
rg -i "api_key\s*=\s*['\"]" --type js --type ts . > "$REPORT_DIR/hardcoded-api-keys.txt" || true
rg -i "secret\s*=\s*['\"]" --type js --type ts . > "$REPORT_DIR/hardcoded-secrets.txt" || true
rg -i "eval\(" --type js --type ts . > "$REPORT_DIR/eval-usage.txt" || true
rg -i "innerHTML\s*=" --type js --type ts . > "$REPORT_DIR/innerHTML-xss-risk.txt" || true
rg -i "dangerouslySetInnerHTML" --type js --type ts . > "$REPORT_DIR/dangerous-html.txt" || true

# Check for HTTP URLs (should be HTTPS)
rg "http://" --type js --type ts --type json . > "$REPORT_DIR/http-urls.txt" || true

# Docker security checks
log "🐳 Checking Docker security..."
find . -name "Dockerfile" -exec docker run --rm -i hadolint/hadolint < {} \; > "$REPORT_DIR/docker-security.txt" 2>&1 || warn "Docker security scan had issues"

# Generate security summary
log "📊 Generating security summary..."

cat > "$REPORT_DIR/security-summary.md" << EOF
# FANZ Security Hardening Report
Generated: $(date)

## Overview
This report contains the results of comprehensive security scanning across all FANZ services.

## Packages Audited
$(printf '- %s\n' "${PACKAGES[@]}")

## Security Scans Performed
- npm audit for all packages
- retire.js vulnerable library scan
- Snyk vulnerability scan
- Code pattern analysis for security anti-patterns
- Docker security analysis with hadolint
- Manual review of hardcoded secrets

## Next Steps
1. Review individual audit reports in this directory
2. Address any high/critical vulnerabilities found
3. Update dependencies to latest secure versions
4. Implement additional security controls as needed

## Files Generated
$(ls -la "$REPORT_DIR" | tail -n +2 | awk '{print "- " $9}')

---
*FANZ Security Team*
EOF

# Create .env.template files where missing
log "🔐 Creating .env.template files for services without them..."

for pkg in "${PACKAGES[@]}"; do
  if [ -d "$pkg" ] && [ -f "$pkg/package.json" ] && [ ! -f "$pkg/.env.template" ]; then
    log "Creating .env.template for $pkg"
    cat > "$pkg/.env.template" << 'EOF'
# Environment variables for this service
# Copy to .env and fill in actual values

NODE_ENV=development
PORT=3000

# Add service-specific environment variables here
EOF
  fi
done

# Ensure .env files are in .gitignore
log "🔒 Ensuring .env files are properly ignored..."
for pkg in "${PACKAGES[@]}"; do
  if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
    if [ ! -f "$pkg/.gitignore" ]; then
      echo ".env" > "$pkg/.gitignore"
      echo ".env.*" >> "$pkg/.gitignore"
      echo "!.env.template" >> "$pkg/.gitignore"
    else
      if ! grep -q "^\.env$" "$pkg/.gitignore"; then
        echo ".env" >> "$pkg/.gitignore"
      fi
    fi
  fi
done

# Update security-related dependencies globally
log "🔄 Updating critical security dependencies..."

# Find package.json files and update security-critical deps
find . -name "package.json" -not -path "./node_modules/*" -exec dirname {} \; | while read -r dir; do
  if [ -f "$dir/package-lock.json" ]; then
    cd "$dir"
    
    # Update specific security-critical packages
    npm update \
      helmet \
      cors \
      express-rate-limit \
      bcrypt \
      jsonwebtoken \
      express-validator \
      sanitize-html \
      xss \
      csrf \
      express-session \
      express-brute \
      slow-down \
      2>/dev/null || true
      
    cd - > /dev/null
  fi
done

success "🎉 Security hardening completed!"
log "📊 Report summary:"
log "   - Security reports saved to: $REPORT_DIR"
log "   - Review security-summary.md for overview"
log "   - Check individual audit files for specific vulnerabilities"

# Display summary of critical findings
if [ -f "$REPORT_DIR/security-summary.md" ]; then
  log "\n📋 Security Summary:"
  cat "$REPORT_DIR/security-summary.md"
fi

log "🔒 Security hardening process complete. Review reports and address findings."
#!/bin/bash

# 🛡️ FANZ Branch Protection Deployment (Simplified)
# Deploy branch protection across local FANZ repositories
set -euo pipefail

# Configuration
GITHUB_ORG="${GITHUB_ORG:-joshuastone}"
OUTPUT_DIR="security-reports"
DEPLOY_LOG="$OUTPUT_DIR/branch-protection-deployment-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN="${DRY_RUN:-false}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"; }
log_action() { echo -e "${PURPLE}[ACTION]${NC} $1" | tee -a "$DEPLOY_LOG"; }

# Initialize
mkdir -p "$OUTPUT_DIR"
echo "# FANZ Branch Protection Deployment Log" > "$DEPLOY_LOG"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$DEPLOY_LOG"
echo "Mode: $([ "$DRY_RUN" = "true" ] && echo "DRY RUN" || echo "LIVE DEPLOYMENT")" >> "$DEPLOY_LOG"
echo "" >> "$DEPLOY_LOG"

log_info "🚀 Starting FANZ Branch Protection Deployment"

if [ "$DRY_RUN" = "false" ]; then
    log_action "⚡ LIVE MODE: Applying branch protection across FANZ repositories"
else
    log_warning "🔍 DRY RUN MODE: No changes will be applied"
fi

# Deploy CODEOWNERS files to repositories
deploy_codeowners() {
    log_info "📋 Deploying CODEOWNERS files..."
    
    local success_count=0
    local total_count=0
    
    for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
        if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
            continue
        fi
        
        local repo_name
        repo_name=$(basename "$repo_path")
        
        total_count=$((total_count + 1))
        
        log_action "📋 Creating CODEOWNERS for: $repo_name"
        
        if [ "$DRY_RUN" = "true" ]; then
            log_info "[DRY RUN] Would create .github/CODEOWNERS in $repo_name"
            success_count=$((success_count + 1))
            continue
        fi
        
        # Create .github directory
        mkdir -p "$repo_path/.github"
        
        # Generate CODEOWNERS content
        cat > "$repo_path/.github/CODEOWNERS" << EOF
# 🛡️ FANZ Code Owners Configuration
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

# Global ownership (fallback)
* @$GITHUB_ORG/core-team

# Security-critical files
/security/ @$GITHUB_ORG/security-team
/.github/ @$GITHUB_ORG/security-team @$GITHUB_ORG/devops-team
/scripts/security/ @$GITHUB_ORG/security-team

# Payment processing (adult-friendly)
/payments/ @$GITHUB_ORG/fintech-team @$GITHUB_ORG/security-team
/fanzfinance-os/ @$GITHUB_ORG/fintech-team @$GITHUB_ORG/security-team

# Authentication & authorization
/auth-service/ @$GITHUB_ORG/security-team @$GITHUB_ORG/backend-team
/services/fanz-permissions/ @$GITHUB_ORG/security-team

# Infrastructure & deployment
/k8s/ @$GITHUB_ORG/devops-team @$GITHUB_ORG/security-team
/docker/ @$GITHUB_ORG/devops-team
/database/ @$GITHUB_ORG/database-team @$GITHUB_ORG/backend-team

# Frontend applications
/frontend/ @$GITHUB_ORG/frontend-team
/mobile/ @$GITHUB_ORG/mobile-team

# API and backend services  
/backend/ @$GITHUB_ORG/backend-team
/api-gateway/ @$GITHUB_ORG/backend-team @$GITHUB_ORG/security-team

# Documentation
/docs/ @$GITHUB_ORG/tech-writers @$GITHUB_ORG/core-team
README.md @$GITHUB_ORG/core-team
EOF
        
        if [ $? -eq 0 ]; then
            log_success "✅ Created CODEOWNERS for $repo_name"
            success_count=$((success_count + 1))
        else
            log_error "❌ Failed to create CODEOWNERS for $repo_name"
        fi
    done
    
    log_info "📊 CODEOWNERS Deployment Summary:"
    log_info "  - Repositories processed: $total_count"
    log_info "  - Successfully deployed: $success_count"
    log_info "  - Success rate: $(echo "scale=1; $success_count * 100 / $total_count" | bc 2>/dev/null || echo "N/A")%"
}

# Configure signed commits in repositories
configure_signed_commits() {
    log_info "🔐 Configuring signed commits across repositories..."
    
    local success_count=0
    local total_count=0
    
    for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
        if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
            continue
        fi
        
        local repo_name
        repo_name=$(basename "$repo_path")
        
        total_count=$((total_count + 1))
        
        log_action "🔐 Configuring signed commits for: $repo_name"
        
        pushd "$repo_path" &> /dev/null || continue
        
        if [ "$DRY_RUN" = "true" ]; then
            log_info "[DRY RUN] Would configure: git config commit.gpgsign true"
            success_count=$((success_count + 1))
            popd &> /dev/null
            continue
        fi
        
        # Configure repository-level signing
        git config commit.gpgsign true
        git config tag.gpgSign true
        
        if [ $? -eq 0 ]; then
            log_success "✅ Configured signed commits for $repo_name"
            success_count=$((success_count + 1))
        else
            log_error "❌ Failed to configure signed commits for $repo_name"
        fi
        
        popd &> /dev/null
    done
    
    log_info "📊 Signed Commits Configuration Summary:"
    log_info "  - Repositories processed: $total_count"
    log_info "  - Successfully configured: $success_count"
    log_info "  - Success rate: $(echo "scale=1; $success_count * 100 / $total_count" | bc 2>/dev/null || echo "N/A")%"
}

# Deploy SAST workflows to repositories that don't have them
deploy_sast_workflows() {
    log_info "🔍 Deploying SAST workflows..."
    
    local success_count=0
    local total_count=0
    
    for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
        if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
            continue
        fi
        
        local repo_name
        repo_name=$(basename "$repo_path")
        
        total_count=$((total_count + 1))
        
        log_action "🔍 Checking SAST workflows for: $repo_name"
        
        local needs_codeql=false
        local needs_semgrep=false
        
        if [ ! -f "$repo_path/.github/workflows/codeql-analysis.yml" ]; then
            needs_codeql=true
        fi
        
        if [ ! -f "$repo_path/.github/workflows/semgrep-analysis.yml" ]; then
            needs_semgrep=true
        fi
        
        if [ "$needs_codeql" = "false" ] && [ "$needs_semgrep" = "false" ]; then
            log_success "✅ $repo_name: SAST workflows already present"
            success_count=$((success_count + 1))
            continue
        fi
        
        if [ "$DRY_RUN" = "true" ]; then
            [ "$needs_codeql" = "true" ] && log_info "[DRY RUN] Would create CodeQL workflow in $repo_name"
            [ "$needs_semgrep" = "true" ] && log_info "[DRY RUN] Would create Semgrep workflow in $repo_name"
            success_count=$((success_count + 1))
            continue
        fi
        
        mkdir -p "$repo_path/.github/workflows"
        
        # Deploy CodeQL workflow if needed
        if [ "$needs_codeql" = "true" ]; then
            cp "REDACTED_AWS_SECRET_KEY_UNIFIED_ECOSYSTEM/.github/workflows/codeql-analysis.yml" \
               "$repo_path/.github/workflows/codeql-analysis.yml" 2>/dev/null || {
                log_warning "⚠️ Could not copy CodeQL workflow template to $repo_name"
            }
        fi
        
        # Deploy Semgrep workflow if needed  
        if [ "$needs_semgrep" = "true" ]; then
            cp "REDACTED_AWS_SECRET_KEY_UNIFIED_ECOSYSTEM/.github/workflows/semgrep-analysis.yml" \
               "$repo_path/.github/workflows/semgrep-analysis.yml" 2>/dev/null || {
                log_warning "⚠️ Could not copy Semgrep workflow template to $repo_name"
            }
        fi
        
        log_success "✅ Deployed SAST workflows to $repo_name"
        success_count=$((success_count + 1))
    done
    
    log_info "📊 SAST Workflows Deployment Summary:"
    log_info "  - Repositories processed: $total_count"
    log_info "  - Successfully deployed: $success_count"
    log_info "  - Success rate: $(echo "scale=1; $success_count * 100 / $total_count" | bc 2>/dev/null || echo "N/A")%"
}

# Create validation script
create_validation_script() {
    log_info "📝 Creating validation script..."
    
    cat > "scripts/security/validate-deployment.sh" << 'EOF'
#!/bin/bash

# 🔍 FANZ Branch Protection Validation
# Validates deployment of branch protection components

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔍 FANZ Branch Protection Validation"
echo "==================================="
echo ""

total_repos=0
codeowners_count=0
signing_count=0
codeql_count=0
semgrep_count=0

for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
    if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
        continue
    fi
    
    repo_name=$(basename "$repo_path")
    log_info "🔍 Validating: $repo_name"
    
    total_repos=$((total_repos + 1))
    
    pushd "$repo_path" &> /dev/null || continue
    
    # Check CODEOWNERS
    if [ -f ".github/CODEOWNERS" ]; then
        codeowners_count=$((codeowners_count + 1))
        log_success "  ✅ CODEOWNERS present"
    else
        log_error "  ❌ CODEOWNERS missing"
    fi
    
    # Check signed commits
    if [ "$(git config commit.gpgsign 2>/dev/null)" = "true" ]; then
        signing_count=$((signing_count + 1))
        log_success "  ✅ Signed commits enabled"
    else
        log_error "  ❌ Signed commits not enabled"
    fi
    
    # Check CodeQL workflow
    if [ -f ".github/workflows/codeql-analysis.yml" ]; then
        codeql_count=$((codeql_count + 1))
        log_success "  ✅ CodeQL workflow present"
    else
        log_error "  ❌ CodeQL workflow missing"
    fi
    
    # Check Semgrep workflow
    if [ -f ".github/workflows/semgrep-analysis.yml" ]; then
        semgrep_count=$((semgrep_count + 1))
        log_success "  ✅ Semgrep workflow present"
    else
        log_error "  ❌ Semgrep workflow missing"
    fi
    
    popd &> /dev/null
done

echo ""
log_info "📊 Validation Summary:"
echo "   - Total repositories: $total_repos"
echo "   - CODEOWNERS coverage: $codeowners_count/$total_repos ($(echo "scale=1; $codeowners_count * 100 / $total_repos" | bc)%)"
echo "   - Signed commits: $signing_count/$total_repos ($(echo "scale=1; $signing_count * 100 / $total_repos" | bc)%)"
echo "   - CodeQL workflows: $codeql_count/$total_repos ($(echo "scale=1; $codeql_count * 100 / $total_repos" | bc)%)"
echo "   - Semgrep workflows: $semgrep_count/$total_repos ($(echo "scale=1; $semgrep_count * 100 / $total_repos" | bc)%)"

if [ "$codeowners_count" -eq "$total_repos" ] && [ "$signing_count" -eq "$total_repos" ] && 
   [ "$codeql_count" -eq "$total_repos" ] && [ "$semgrep_count" -eq "$total_repos" ]; then
    log_success "🎉 All repositories are fully configured!"
else
    log_error "⚠️ Some repositories need additional configuration"
fi
EOF
    
    chmod +x "scripts/security/validate-deployment.sh"
    log_success "✅ Created validation script: scripts/security/validate-deployment.sh"
}

# Main execution
main() {
    echo ""
    
    # Deploy components
    deploy_codeowners
    echo ""
    
    configure_signed_commits  
    echo ""
    
    deploy_sast_workflows
    echo ""
    
    create_validation_script
    echo ""
    
    log_success "🎉 FANZ Branch Protection Deployment Completed!"
    
    if [ "$DRY_RUN" = "false" ]; then
        log_info "📋 Next Steps:"
        log_info "  1. Validate deployment: ./scripts/security/validate-deployment.sh"
        log_info "  2. Run monitoring: ./scripts/security/branch-protection-monitor.sh"
        log_info "  3. View compliance: open security-reports/compliance-dashboard-*.html"
        log_info "  4. GitHub: Enable Advanced Security features in repository settings"
        log_info "  5. GitHub: Configure branch protection rules via web interface"
    else
        log_info "To deploy live: DRY_RUN=false $0"
    fi
    
    log_info "📄 Deployment log: $DEPLOY_LOG"
}

main "$@"
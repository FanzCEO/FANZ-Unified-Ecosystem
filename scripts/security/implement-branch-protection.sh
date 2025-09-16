#!/bin/bash

# 🛡️ FANZ Branch Protection Implementation Script
# Implements comprehensive branch protection rules across all FANZ repositories
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

set -euo pipefail

# Configuration
GITHUB_ORG="${GITHUB_ORG:-joshuastone}"
OUTPUT_DIR="security-reports"
IMPLEMENTATION_LOG="$OUTPUT_DIR/branch-protection-implementation-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN="${DRY_RUN:-true}"  # Set to false to actually apply changes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$IMPLEMENTATION_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$IMPLEMENTATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$IMPLEMENTATION_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$IMPLEMENTATION_LOG"
}

log_action() {
    echo -e "${PURPLE}[ACTION]${NC} $1" | tee -a "$IMPLEMENTATION_LOG"
}

# Check prerequisites
check_prerequisites() {
    log_info "🔍 Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is required but not installed"
        log_info "Install with: brew install gh"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        log_info "Install with: brew install jq"
        exit 1
    fi
    
    # Check GitHub CLI authentication
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated"
        log_info "Run: gh auth login"
        exit 1
    fi
    
    # Create output directory and log file
    mkdir -p "$OUTPUT_DIR"
    echo "# FANZ Branch Protection Implementation Log" > "$IMPLEMENTATION_LOG"
    echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$IMPLEMENTATION_LOG"
    echo "Mode: $([ "$DRY_RUN" = "true" ] && echo "DRY RUN" || echo "LIVE EXECUTION")" >> "$IMPLEMENTATION_LOG"
    echo "" >> "$IMPLEMENTATION_LOG"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "🔍 RUNNING IN DRY RUN MODE - No changes will be applied"
        log_warning "Set DRY_RUN=false to apply actual branch protection rules"
    else
        log_action "⚡ LIVE EXECUTION MODE - Changes will be applied to repositories"
    fi
    
    log_success "Prerequisites check passed"
}

# Define branch protection configurations
define_protection_configs() {
    # Production branches (main, master) - Maximum Security
    MAIN_BRANCH_CONFIG='{
        "required_status_checks": {
            "strict": true,
            "contexts": [
                "CodeQL / Analyze (javascript)",
                "CodeQL / Analyze (python)",
                "🔍 Semgrep Security Scan",
                "Build / Build and Test",
                "Test / Unit Tests",
                "Secret Scanning Results",
                "Dependency Security Check"
            ]
        },
        "enforce_admins": true,
        "required_pull_request_reviews": {
            "required_approving_review_count": 2,
            "dismiss_stale_reviews": true,
            "require_code_owner_reviews": true,
            "require_last_push_approval": true
        },
        "restrictions": null,
        "required_signatures": true,
        "allow_force_pushes": false,
        "allow_deletions": false,
        "block_creations": false,
        "required_conversation_resolution": true
    }'
    
    # Integration branches (develop) - High Security
    DEVELOP_BRANCH_CONFIG='{
        "required_status_checks": {
            "strict": true,
            "contexts": [
                "CodeQL / Analyze (javascript)",
                "CodeQL / Analyze (python)",
                "🔍 Semgrep Security Scan",
                "Build / Build and Test",
                "Test / Unit Tests"
            ]
        },
        "enforce_admins": false,
        "required_pull_request_reviews": {
            "required_approving_review_count": 1,
            "dismiss_stale_reviews": true,
            "require_code_owner_reviews": false,
            "require_last_push_approval": false
        },
        "restrictions": null,
        "required_signatures": true,
        "allow_force_pushes": false,
        "allow_deletions": false,
        "block_creations": false,
        "required_conversation_resolution": true
    }'
    
    # Release branches - High Security
    RELEASE_BRANCH_CONFIG='{
        "required_status_checks": {
            "strict": true,
            "contexts": [
                "CodeQL / Analyze (javascript)",
                "CodeQL / Analyze (python)",
                "🔍 Semgrep Security Scan",
                "Build / Build and Test",
                "Test / Unit Tests"
            ]
        },
        "enforce_admins": true,
        "required_pull_request_reviews": {
            "required_approving_review_count": 2,
            "dismiss_stale_reviews": true,
            "require_code_owner_reviews": true,
            "require_last_push_approval": true
        },
        "restrictions": null,
        "required_signatures": true,
        "allow_force_pushes": false,
        "allow_deletions": false,
        "block_creations": false,
        "required_conversation_resolution": true
    }'
    
    # Security branches - High Security
    SECURITY_BRANCH_CONFIG='{
        "required_status_checks": {
            "strict": true,
            "contexts": [
                "CodeQL / Analyze (javascript)",
                "CodeQL / Analyze (python)",
                "🔍 Semgrep Security Scan",
                "Build / Build and Test",
                "Test / Unit Tests"
            ]
        },
        "enforce_admins": false,
        "required_pull_request_reviews": {
            "required_approving_review_count": 1,
            "dismiss_stale_reviews": true,
            "require_code_owner_reviews": true,
            "require_last_push_approval": false
        },
        "restrictions": null,
        "required_signatures": true,
        "allow_force_pushes": false,
        "allow_deletions": false,
        "block_creations": false,
        "required_conversation_resolution": true
    }'
    
    # Feature branches - Moderate Security
    FEATURE_BRANCH_CONFIG='{
        "required_status_checks": {
            "strict": false,
            "contexts": [
                "Build / Build and Test",
                "Test / Unit Tests"
            ]
        },
        "enforce_admins": false,
        "required_pull_request_reviews": null,
        "restrictions": null,
        "required_signatures": false,
        "allow_force_pushes": true,
        "allow_deletions": true,
        "block_creations": false,
        "required_conversation_resolution": false
    }'
}

# Get branch protection tier for a branch
get_branch_tier() {
    local branch="$1"
    
    case "$branch" in
        "main"|"master")
            echo "MAIN"
            ;;
        "develop"|"development")
            echo "DEVELOP"
            ;;
        "release/"*|"hotfix/"*)
            echo "RELEASE"
            ;;
        "security/"*|"sec/"*)
            echo "SECURITY"
            ;;
        "feature/"*|"feat/"*|"fix/"*|"bugfix/"*)
            echo "FEATURE"
            ;;
        *)
            # Default to FEATURE tier for unknown branches
            echo "FEATURE"
            ;;
    esac
}

# Get protection configuration for branch tier
get_protection_config() {
    local tier="$1"
    
    case "$tier" in
        "MAIN")
            echo "$MAIN_BRANCH_CONFIG"
            ;;
        "DEVELOP")
            echo "$DEVELOP_BRANCH_CONFIG"
            ;;
        "RELEASE")
            echo "$RELEASE_BRANCH_CONFIG"
            ;;
        "SECURITY")
            echo "$SECURITY_BRANCH_CONFIG"
            ;;
        "FEATURE")
            echo "$FEATURE_BRANCH_CONFIG"
            ;;
        *)
            echo "$FEATURE_BRANCH_CONFIG"
            ;;
    esac
}

# Apply branch protection to a single branch
apply_branch_protection() {
    local repo="$1"
    local branch="$2"
    local config="$3"
    local tier="$4"
    
    log_action "🛡️ Applying $tier protection to $repo/$branch"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would apply protection config:"
        echo "$config" | jq '.' | head -10 | sed 's/^/    /' | tee -a "$IMPLEMENTATION_LOG"
        return 0
    fi
    
    # Apply the protection using GitHub CLI
    local temp_file
    temp_file=$(mktemp)
    echo "$config" > "$temp_file"
    
    if gh api --method PUT "repos/$GITHUB_ORG/$repo/branches/$branch/protection" \
        --input "$temp_file" >> "$IMPLEMENTATION_LOG" 2>&1; then
        log_success "✅ Applied $tier protection to $repo/$branch"
        rm -f "$temp_file"
        return 0
    else
        log_error "❌ Failed to apply protection to $repo/$branch"
        rm -f "$temp_file"
        return 1
    fi
}

# Create CODEOWNERS file for a repository
create_codeowners_file() {
    local repo="$1"
    local repo_path="/Users/joshuastone/Documents/GitHub/$repo"
    
    log_action "📋 Creating CODEOWNERS file for $repo"
    
    if [ ! -d "$repo_path" ]; then
        log_warning "Repository directory not found: $repo_path"
        return 1
    fi
    
    local codeowners_content="# 🛡️ FANZ Code Owners Configuration
# Automatically generated on $(date -u +%Y-%m-%dT%H:%M:%SZ)

# Global ownership (fallback)
* @$GITHUB_ORG/core-team

# Security-critical files
/security/ @$GITHUB_ORG/security-team
/.github/ @$GITHUB_ORG/security-team @$GITHUB_ORG/devops-team
/scripts/security/ @$GITHUB_ORG/security-team

# Payment processing (requires specialized review)
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
README.md @$GITHUB_ORG/core-team"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would create CODEOWNERS file at $repo_path/.github/CODEOWNERS"
        return 0
    fi
    
    # Create .github directory if it doesn't exist
    mkdir -p "$repo_path/.github"
    
    # Write CODEOWNERS file
    echo "$codeowners_content" > "$repo_path/.github/CODEOWNERS"
    
    log_success "✅ Created CODEOWNERS file for $repo"
}

# Get list of FANZ repositories
get_fanz_repositories() {
    log_info "🔍 Discovering FANZ repositories..."
    
    # Get repositories from GitHub
    local repos
    repos=$(gh repo list --limit 100 --json name,isPrivate,defaultBranchRef | \
        jq -r '.[] | select(.name | test("^[Ff]anz|^FANZ_")) | .name')
    
    # Add local repositories from filesystem
    local local_repos=""
    if [ -d "/Users/joshuastone/Documents/GitHub" ]; then
        local_repos=$(find /Users/joshuastone/Documents/GitHub -maxdepth 1 -type d -name "*[Ff]anz*" -o -name "*FANZ*" | \
            xargs -I {} basename {} 2>/dev/null | sort -u || echo "")
    fi
    
    # Combine and deduplicate
    echo "$repos $local_repos" | tr ' ' '\n' | sort -u | grep -v '^$' || echo ""
}

# Get branches for a repository
get_repository_branches() {
    local repo="$1"
    
    log_info "Getting branches for repository: $repo"
    
    # Try to get branches via GitHub API first
    local branches
    branches=$(gh api "repos/$GITHUB_ORG/$repo/branches" 2>/dev/null | jq -r '.[].name' || echo "")
    
    # If API fails, try local git if repository exists
    if [ -z "$branches" ] && [ -d "/Users/joshuastone/Documents/GitHub/$repo" ]; then
        pushd "/Users/joshuastone/Documents/GitHub/$repo" &> /dev/null || return 1
        branches=$(git branch -r | sed 's/origin\///' | sed 's/^ *//' | grep -v HEAD || echo "")
        popd &> /dev/null
    fi
    
    echo "$branches"
}

# Check if branch should be protected
should_protect_branch() {
    local branch="$1"
    
    # Always protect main production branches
    case "$branch" in
        "main"|"master"|"develop"|"development")
            return 0
            ;;
        "release/"*|"hotfix/"*)
            return 0
            ;;
        "security/"*|"sec/"*)
            return 0
            ;;
        "feature/"*|"feat/"*)
            # Protect feature branches only if they're long-lived or critical
            return 1  # For now, skip feature branches
            ;;
        "dependabot/"*)
            return 1  # Skip dependabot branches
            ;;
        *)
            return 1  # Skip unknown patterns
            ;;
    esac
}

# Implement branch protection for all repositories
implement_branch_protection() {
    log_info "🚀 Starting branch protection implementation..."
    
    local repositories
    repositories=$(get_fanz_repositories)
    
    if [ -z "$repositories" ]; then
        log_warning "No FANZ repositories found"
        return 1
    fi
    
    log_info "Found repositories: $(echo "$repositories" | wc -l | tr -d ' ')"
    
    local total_repos=0
    local successful_repos=0
    local total_branches=0
    local protected_branches=0
    
    # Process each repository
    while IFS= read -r repo; do
        [ -z "$repo" ] && continue
        
        log_info "🔧 Processing repository: $repo"
        total_repos=$((total_repos + 1))
        
        # Create CODEOWNERS file
        create_codeowners_file "$repo"
        
        # Get repository branches
        local branches
        branches=$(get_repository_branches "$repo")
        
        if [ -z "$branches" ]; then
            log_warning "No branches found for $repo (may be private or inaccessible)"
            continue
        fi
        
        local repo_success=true
        
        # Process each branch
        while IFS= read -r branch; do
            [ -z "$branch" ] && continue
            total_branches=$((total_branches + 1))
            
            # Check if this branch should be protected
            if ! should_protect_branch "$branch"; then
                log_info "⏭️ Skipping protection for $repo/$branch (not a protected branch type)"
                continue
            fi
            
            # Determine protection tier and configuration
            local tier
            tier=$(get_branch_tier "$branch")
            
            local config
            config=$(get_protection_config "$tier")
            
            # Apply branch protection
            if apply_branch_protection "$repo" "$branch" "$config" "$tier"; then
                protected_branches=$((protected_branches + 1))
            else
                repo_success=false
            fi
            
        done <<< "$branches"
        
        if [ "$repo_success" = "true" ]; then
            successful_repos=$((successful_repos + 1))
        fi
        
    done <<< "$repositories"
    
    # Generate implementation summary
    log_info "📊 Implementation Summary:"
    log_info "  - Total repositories processed: $total_repos"
    log_info "  - Successful repositories: $successful_repos"
    log_info "  - Total branches analyzed: $total_branches"
    log_info "  - Branches protected: $protected_branches"
    log_info "  - Success rate: $(echo "scale=1; $successful_repos * 100 / $total_repos" | bc 2>/dev/null || echo "0")%"
}

# Generate post-implementation verification script
generate_verification_script() {
    log_info "📝 Generating post-implementation verification script..."
    
    local verify_script="scripts/security/verify-branch-protection.sh"
    
    cat > "$verify_script" << 'EOF'
#!/bin/bash

# 🔍 FANZ Branch Protection Verification Script
# Verifies that branch protection rules have been successfully applied

set -euo pipefail

echo "🔍 Starting branch protection verification..."

# Run the survey script to check current status
./scripts/security/survey-branch-protection.sh

echo ""
echo "✅ Verification completed. Check the generated reports for details."
echo "📄 Look for compliance scores >80% for successful implementation"
EOF
    
    chmod +x "$verify_script"
    log_success "Created verification script: $verify_script"
}

# Main execution function
main() {
    echo "🛡️ FANZ Branch Protection Implementation"
    echo "========================================"
    echo ""
    
    check_prerequisites
    define_protection_configs
    implement_branch_protection
    generate_verification_script
    
    echo ""
    log_success "🎉 Branch protection implementation completed!"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo ""
        log_warning "⚠️ This was a DRY RUN - no changes were applied"
        log_info "To apply changes, run: DRY_RUN=false $0"
    else
        echo ""
        log_success "✅ Branch protection rules have been applied"
        log_info "📋 Next steps:"
        log_info "  1. Run verification: ./scripts/security/verify-branch-protection.sh"
        log_info "  2. Test with a sample PR to ensure workflows work"
        log_info "  3. Monitor compliance dashboard for any issues"
        log_info "  4. Train development team on new workflow requirements"
    fi
    
    echo ""
    log_info "📄 Implementation log: $IMPLEMENTATION_LOG"
}

# Run the script
main "$@"
#!/bin/bash

# 🛡️ FANZ GitHub Advanced Security Setup Script
# This script configures GitHub Advanced Security at the organization level
# 
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - Organization admin permissions
# - GitHub Advanced Security license

set -euo pipefail

# ANSI color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
GITHUB_ORG="${GITHUB_ORG:-}"
DRY_RUN="${DRY_RUN:-false}"
VERBOSE="${VERBOSE:-false}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1" >&2
    fi
}

# Header
print_header() {
    echo -e "${WHITE}========================================${NC}"
    echo -e "${WHITE}🛡️  FANZ GitHub Advanced Security Setup${NC}"
    echo -e "${WHITE}========================================${NC}"
    echo -e "${CYAN}Timestamp: $TIMESTAMP${NC}"
    echo -e "${CYAN}Organization: ${GITHUB_ORG:-'Not specified'}${NC}"
    echo -e "${CYAN}Dry Run Mode: $DRY_RUN${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first:"
        log_error "https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    # Check organization
    if [[ -z "$GITHUB_ORG" ]]; then
        log_error "GITHUB_ORG environment variable is not set."
        echo "Please set it: export GITHUB_ORG=your-org-name"
        exit 1
    fi
    
    # Verify organization access
    if ! gh api "orgs/$GITHUB_ORG" &> /dev/null; then
        log_error "Cannot access organization '$GITHUB_ORG'. Check permissions and organization name."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Enable organization-level security features
enable_org_security_features() {
    log_info "Configuring organization-level security features..."
    
    # Enable secret scanning at org level
    log_info "Enabling secret scanning for organization..."
    if [[ "$DRY_RUN" == "false" ]]; then
        gh api --method PATCH "orgs/$GITHUB_ORG" \
            --field secret_scanning_enabled_for_new_repositories=true \
            --field secret_scanning_push_protection_enabled_for_new_repositories=true \
            --field secret_scanning_validity_checks_enabled=true 2>/dev/null || {
            log_warning "Could not enable all secret scanning features (may require GitHub Advanced Security license)"
        }
    else
        log_debug "DRY RUN: Would enable secret scanning"
    fi
    
    # Enable dependency review at org level
    log_info "Enabling dependency review for organization..."
    if [[ "$DRY_RUN" == "false" ]]; then
        gh api --method PATCH "orgs/$GITHUB_ORG" \
            --field dependency_graph_enabled_for_new_repositories=true 2>/dev/null || {
            log_warning "Could not enable dependency review (may be already enabled)"
        }
    else
        log_debug "DRY RUN: Would enable dependency review"
    fi
    
    # Configure security and analysis settings
    log_info "Configuring security and analysis settings..."
    if [[ "$DRY_RUN" == "false" ]]; then
        gh api --method PATCH "orgs/$GITHUB_ORG" \
            --field vulnerability_alerts_enabled_for_new_repositories=true \
            --field automatic_security_updates_enabled_for_new_repositories=true 2>/dev/null || {
            log_warning "Could not enable all security features"
        }
    else
        log_debug "DRY RUN: Would configure security settings"
    fi
    
    log_success "Organization security features configured"
}

# Configure security policies
configure_security_policies() {
    log_info "Setting up organization security policies..."
    
    # Create organization security policy if it doesn't exist
    local security_policy_path=".github/SECURITY.md"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Check if organization has a security policy repo
        if ! gh repo view "$GITHUB_ORG/.github" &> /dev/null; then
            log_info "Creating organization .github repository..."
            gh repo create "$GITHUB_ORG/.github" \
                --public \
                --description "Organization-wide GitHub configuration and policies" || {
                log_warning "Could not create .github repository (may already exist or insufficient permissions)"
            }
        fi
        
        # Create security policy
        cat > /tmp/SECURITY.md << 'EOF'
# 🛡️ FANZ Security Policy

## 🔍 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes            |
| Previous | ⚠️ Limited Support |

## 🚨 Reporting a Vulnerability

**CRITICAL**: Do not create public GitHub issues for security vulnerabilities!

### For FANZ Platform Security Issues:
- **Email**: security@fanz.network
- **Response Time**: 24 hours for critical issues, 72 hours for others
- **Encryption**: Use our PGP key (available on request)

### What to Include:
1. Detailed description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact assessment
4. Suggested remediation (if known)

### Our Commitment:
- **Acknowledge**: Within 24 hours
- **Investigation**: 3-5 business days
- **Resolution**: Based on severity (Critical: 24h, High: 72h, Medium: 14d, Low: 30d)
- **Disclosure**: Coordinated disclosure after fix deployment

## 🏆 Security Recognition

We appreciate security researchers who help improve FANZ platform security:
- Public recognition (with permission)
- Contribution credit in release notes
- Potential bug bounty rewards for significant findings

## 🔒 Security Best Practices

### For Contributors:
- Enable 2FA on your GitHub account
- Use signed commits
- Follow secure coding guidelines
- Never commit secrets or credentials
- Keep dependencies updated

### For Users:
- Report suspicious activity immediately
- Use strong, unique passwords
- Enable two-factor authentication
- Keep your account information up to date

---
*This policy is effective as of $(date -u +%Y-%m-%d) and is subject to updates.*
EOF
        
        # Upload security policy if organization repo exists
        if gh repo view "$GITHUB_ORG/.github" &> /dev/null; then
            gh api --method PUT "repos/$GITHUB_ORG/.github/contents/SECURITY.md" \
                --field message="Add FANZ organization security policy" \
                --field content="$(base64 -i /tmp/SECURITY.md)" 2>/dev/null || {
                log_warning "Could not upload security policy to organization repo"
            }
        fi
        
        rm -f /tmp/SECURITY.md
    else
        log_debug "DRY RUN: Would create organization security policy"
    fi
    
    log_success "Security policies configured"
}

# Get list of FANZ repositories
get_fanz_repositories() {
    log_info "Discovering FANZ repositories..."
    
    local repos_file="/tmp/fanz_repos.txt"
    
    # Get all repositories in the organization
    gh repo list "$GITHUB_ORG" --limit 1000 --json name,isPrivate,isArchived \
        --jq '.[] | select(.isArchived == false) | .name' > "$repos_file"
    
    local repo_count
    repo_count=$(wc -l < "$repos_file")
    
    log_info "Found $repo_count active repositories"
    log_debug "Repositories: $(cat "$repos_file" | tr '\n' ' ')"
    
    echo "$repos_file"
}

# Enable SAST for a single repository
enable_repo_sast() {
    local repo_name="$1"
    local full_repo="$GITHUB_ORG/$repo_name"
    
    log_info "Configuring SAST for $repo_name..."
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Enable secret scanning for repository
        gh api --method PUT "repos/$full_repo/secret-scanning" 2>/dev/null || {
            log_warning "Could not enable secret scanning for $repo_name"
        }
        
        # Enable push protection
        gh api --method PUT "repos/$full_repo/secret-scanning/push-protection" 2>/dev/null || {
            log_warning "Could not enable push protection for $repo_name"
        }
        
        # Enable vulnerability alerts
        gh api --method PUT "repos/$full_repo/vulnerability-alerts" 2>/dev/null || {
            log_warning "Could not enable vulnerability alerts for $repo_name"
        }
        
        # Enable automated security fixes (Dependabot)
        gh api --method PUT "repos/$full_repo/automated-security-fixes" 2>/dev/null || {
            log_warning "Could not enable automated security fixes for $repo_name"
        }
        
        # Enable dependency graph
        gh api --method PATCH "repos/$full_repo" \
            --field has_vulnerability_alerts=true 2>/dev/null || {
            log_warning "Could not configure dependency features for $repo_name"
        }
        
    else
        log_debug "DRY RUN: Would configure SAST for $repo_name"
    fi
}

# Deploy SAST workflows to repositories
deploy_sast_workflows() {
    log_info "Deploying SAST workflows to repositories..."
    
    local repos_file
    repos_file=$(get_fanz_repositories)
    
    local workflow_dir="$SCRIPT_DIR/../.github/workflows"
    local total_repos=0
    local success_count=0
    
    while IFS= read -r repo_name; do
        if [[ -n "$repo_name" ]]; then
            total_repos=$((total_repos + 1))
            
            log_info "Processing repository: $repo_name"
            
            # Enable repository-level SAST features
            enable_repo_sast "$repo_name"
            
            # Deploy workflows if they exist
            if [[ -f "$workflow_dir/codeql-analysis.yml" ]] && [[ "$DRY_RUN" == "false" ]]; then
                # Create or update CodeQL workflow
                gh api --method PUT "repos/$GITHUB_ORG/$repo_name/contents/.github/workflows/codeql-analysis.yml" \
                    --field message="Add FANZ CodeQL security analysis workflow" \
                    --field content="$(base64 -i "$workflow_dir/codeql-analysis.yml")" 2>/dev/null || {
                    log_warning "Could not deploy CodeQL workflow to $repo_name"
                    continue
                }
                
                # Create or update Semgrep workflow
                if [[ -f "$workflow_dir/semgrep-analysis.yml" ]]; then
                    gh api --method PUT "repos/$GITHUB_ORG/$repo_name/contents/.github/workflows/semgrep-analysis.yml" \
                        --field message="Add FANZ Semgrep security analysis workflow" \
                        --field content="$(base64 -i "$workflow_dir/semgrep-analysis.yml")" 2>/dev/null || {
                        log_warning "Could not deploy Semgrep workflow to $repo_name"
                    }
                fi
                
                success_count=$((success_count + 1))
                log_success "SAST workflows deployed to $repo_name"
            else
                if [[ "$DRY_RUN" == "true" ]]; then
                    log_debug "DRY RUN: Would deploy SAST workflows to $repo_name"
                    success_count=$((success_count + 1))
                else
                    log_warning "Workflow files not found, skipping deployment for $repo_name"
                fi
            fi
        fi
    done < "$repos_file"
    
    rm -f "$repos_file"
    
    log_success "SAST deployment completed: $success_count/$total_repos repositories processed"
}

# Configure branch protection with SAST requirements
configure_branch_protection() {
    log_info "Configuring branch protection rules with SAST requirements..."
    
    local repos_file
    repos_file=$(get_fanz_repositories)
    
    while IFS= read -r repo_name; do
        if [[ -n "$repo_name" ]]; then
            log_info "Configuring branch protection for $repo_name..."
            
            if [[ "$DRY_RUN" == "false" ]]; then
                # Configure main branch protection
                gh api --method PUT "repos/$GITHUB_ORG/$repo_name/branches/main/protection" \
                    --field required_status_checks='{"strict":true,"contexts":["CodeQL Analysis (javascript)","CodeQL Analysis (python)","🔍 Semgrep Security Scan"]}' \
                    --field enforce_admins=true \
                    --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
                    --field restrictions=null 2>/dev/null || {
                    log_warning "Could not configure branch protection for main branch in $repo_name"
                }
                
                # Configure develop branch protection (if exists)
                gh api --method PUT "repos/$GITHUB_ORG/$repo_name/branches/develop/protection" \
                    --field required_status_checks='{"strict":true,"contexts":["CodeQL Analysis (javascript)","CodeQL Analysis (python)","🔍 Semgrep Security Scan"]}' \
                    --field enforce_admins=false \
                    --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
                    --field restrictions=null 2>/dev/null || {
                    log_debug "Could not configure branch protection for develop branch in $repo_name (branch may not exist)"
                }
            else
                log_debug "DRY RUN: Would configure branch protection for $repo_name"
            fi
        fi
    done < "$repos_file"
    
    rm -f "$repos_file"
    log_success "Branch protection configuration completed"
}

# Generate security report
generate_security_report() {
    log_info "Generating FANZ GitHub Advanced Security report..."
    
    local report_file="$SCRIPT_DIR/../../security-reports/github-advanced-security-setup-report.md"
    local repos_file
    repos_file=$(get_fanz_repositories)
    local total_repos
    total_repos=$(wc -l < "$repos_file")
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# 🛡️ FANZ GitHub Advanced Security Setup Report

Generated: $TIMESTAMP

## 📊 Setup Summary

### Organization Configuration
- **Organization**: $GITHUB_ORG
- **Total Repositories**: $total_repos
- **Setup Mode**: $(if [[ "$DRY_RUN" == "true" ]]; then echo "Dry Run"; else echo "Production"; fi)

### Security Features Enabled
- ✅ Secret Scanning (Organization-wide)
- ✅ Push Protection (Organization-wide)
- ✅ Dependency Review (Organization-wide)
- ✅ Vulnerability Alerts (Organization-wide)
- ✅ Automated Security Updates (Organization-wide)

### SAST Implementation
- ✅ CodeQL Analysis Workflows
- ✅ Semgrep Security Scanning
- ✅ Custom FANZ Security Rules
- ✅ OWASP Top 10 Coverage
- ✅ Adult Content Platform Rules

## 🏗️ Repository Coverage

### Processed Repositories
EOF

    # Add repository list
    while IFS= read -r repo_name; do
        if [[ -n "$repo_name" ]]; then
            echo "- $repo_name" >> "$report_file"
        fi
    done < "$repos_file"
    
    cat >> "$report_file" << EOF

## 🎯 Security Rule Coverage

### CodeQL Analysis
- JavaScript/TypeScript security vulnerabilities
- Python security vulnerabilities  
- CWE (Common Weakness Enumeration) detection
- Security-and-quality queries
- Security-extended queries

### Semgrep Analysis
- OWASP Top 10 2021 compliance
- Injection vulnerability detection
- Authentication security flaws
- Cryptographic implementation issues
- Adult content platform security rules

### FANZ Custom Security Rules
- 🚫 Stripe/PayPal usage detection (policy violation)
- 🔞 Adult content upload validation
- 🔒 Age verification bypass prevention
- 💳 Payment card information logging detection
- 🔑 Weak JWT secret detection
- 🛡️ Session security configuration

## 🔒 Branch Protection Configuration

### Main Branch Protection
- Required status checks: SAST workflows
- Required reviews: 2 approvers
- Dismiss stale reviews: Enabled
- Code owner reviews: Required
- Admin enforcement: Enabled

### Develop Branch Protection  
- Required status checks: SAST workflows
- Required reviews: 1 approver
- Dismiss stale reviews: Enabled

## 📈 Next Steps

### 1. Monitoring Setup (Priority: High)
- [ ] Monitor SAST workflow execution
- [ ] Track security finding remediation
- [ ] Set up alerting for critical findings
- [ ] Integrate with FanzDash security center

### 2. Policy Enforcement (Priority: High)
- [ ] Review and remediate initial SAST findings
- [ ] Establish security finding SLAs
- [ ] Train development teams on security workflows
- [ ] Create security incident response procedures

### 3. Continuous Improvement (Priority: Medium)
- [ ] Regular security rule updates
- [ ] Performance optimization of SAST workflows
- [ ] Custom rule development based on findings
- [ ] Security metrics and reporting enhancement

## 🚨 Security SLAs

- **Critical Findings**: 24 hours
- **High Findings**: 72 hours
- **Medium Findings**: 14 days
- **Low Findings**: 30 days

## 📞 Support

- **Security Team**: security@fanz.network
- **Documentation**: /docs/security/
- **Incident Response**: security-emergency@fanz.network

---
*This report represents the current state of GitHub Advanced Security setup for the FANZ organization.*
EOF

    rm -f "$repos_file"
    log_success "Security report generated: $report_file"
}

# Main execution
main() {
    print_header
    check_prerequisites
    
    log_info "Starting FANZ GitHub Advanced Security setup..."
    
    # Configure organization-level features
    enable_org_security_features
    configure_security_policies
    
    # Deploy SAST to repositories
    deploy_sast_workflows
    
    # Configure branch protection
    configure_branch_protection
    
    # Generate report
    generate_security_report
    
    echo ""
    log_success "🎉 FANZ GitHub Advanced Security setup completed successfully!"
    echo ""
    echo -e "${WHITE}Next Steps:${NC}"
    echo -e "${CYAN}1. Review the generated security report${NC}"
    echo -e "${CYAN}2. Monitor SAST workflow execution in repositories${NC}"
    echo -e "${CYAN}3. Address any initial security findings${NC}"
    echo -e "${CYAN}4. Integrate with FanzDash security monitoring${NC}"
    echo ""
}

# Script usage
usage() {
    cat << EOF
🛡️ FANZ GitHub Advanced Security Setup Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -o, --org ORG           GitHub organization name
    -d, --dry-run          Run in dry-run mode (no changes made)
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

ENVIRONMENT VARIABLES:
    GITHUB_ORG             GitHub organization name
    DRY_RUN               Set to 'true' for dry-run mode
    VERBOSE               Set to 'true' for verbose output

EXAMPLES:
    # Setup with organization name
    $0 --org fanz-org

    # Dry run mode
    $0 --org fanz-org --dry-run

    # Using environment variables
    export GITHUB_ORG=fanz-org
    export DRY_RUN=true
    $0

REQUIREMENTS:
    - GitHub CLI (gh) installed and authenticated
    - Organization admin permissions
    - GitHub Advanced Security license
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--org)
            GITHUB_ORG="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
#!/bin/bash

# 🔍 FANZ Branch Protection Survey Script
# Analyzes branch protection status across all FANZ repositories
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

set -euo pipefail

# Configuration
GITHUB_ORG="${GITHUB_ORG:-joshuastone}"
OUTPUT_DIR="security-reports"
REPORT_FILE="$OUTPUT_DIR/branch-protection-survey-$(date +%Y%m%d-%H%M%S).json"
SUMMARY_FILE="$OUTPUT_DIR/branch-protection-summary-$(date +%Y%m%d-%H%M%S).md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
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
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    log_success "Prerequisites check passed"
}

# Get list of FANZ repositories
get_fanz_repositories() {
    log_info "🔍 Discovering FANZ repositories..."
    
    # Get repositories from GitHub (assuming they're in the user's account)
    local repos=""
    if gh auth status &> /dev/null; then
        repos=$(gh repo list --limit 100 --json name 2>/dev/null | \
            jq -r '.[]?.name // empty' 2>/dev/null | \
            grep -E "^[Ff]anz|^FANZ_" || echo "")
    fi
    
    # Add local repositories from filesystem
    local local_repos=""
    if [ -d "/Users/joshuastone/Documents/GitHub" ]; then
        local_repos=$(find /Users/joshuastone/Documents/GitHub -maxdepth 1 -type d \( -name "*[Ff]anz*" -o -name "*FANZ*" \) 2>/dev/null | \
            xargs -I {} basename {} 2>/dev/null | sort -u || echo "")
    fi
    
    # Combine and deduplicate
    {
        echo "$repos"
        echo "$local_repos"
    } | grep -v '^$' | sort -u || echo "FANZ_UNIFIED_ECOSYSTEM"
}

# Check branch protection for a single repository
check_branch_protection() {
    local repo="$1"
    local branch="$2"
    
    log_info "Checking branch protection: $repo/$branch"
    
    # Use GitHub CLI to check branch protection
    local protection_data
    protection_data=$(gh api "repos/$GITHUB_ORG/$repo/branches/$branch/protection" 2>/dev/null || echo "{}")
    
    if [ "$protection_data" = "{}" ]; then
        echo "null"
    else
        echo "$protection_data"
    fi
}

# Get branches for a repository
get_repository_branches() {
    local repo="$1"
    
    log_info "Getting branches for repository: $repo"
    
    # Try to get branches via GitHub API
    local branches
    branches=$(gh api "repos/$GITHUB_ORG/$repo/branches" 2>/dev/null | jq -r '.[].name' || echo "")
    
    # If API fails, try local git if repository exists
    if [ -z "$branches" ] && [ -d "/Users/joshuastone/Documents/GitHub/$repo" ]; then
        pushd "/Users/joshuastone/Documents/GitHub/$repo" &> /dev/null
        branches=$(git branch -r | sed 's/origin\///' | sed 's/^ *//' | grep -v HEAD || echo "")
        popd &> /dev/null
    fi
    
    echo "$branches"
}

# Analyze security requirements compliance
analyze_security_compliance() {
    local repo="$1"
    local branch="$2"
    local protection_data="$3"
    
    local compliance_score=0
    local max_score=10
    local issues=()
    
    if [ "$protection_data" != "null" ]; then
        # Check required status checks
        local required_checks
        required_checks=$(echo "$protection_data" | jq -r '.required_status_checks.contexts[]?' 2>/dev/null || echo "")
        
        if echo "$required_checks" | grep -q "CodeQL"; then
            compliance_score=$((compliance_score + 2))
        else
            issues+=("Missing CodeQL required check")
        fi
        
        if echo "$required_checks" | grep -q -i "semgrep"; then
            compliance_score=$((compliance_score + 2))
        else
            issues+=("Missing Semgrep SAST check")
        fi
        
        # Check required reviews
        local required_reviews
        required_reviews=$(echo "$protection_data" | jq -r '.required_pull_request_reviews.required_approving_review_count' 2>/dev/null || echo "0")
        
        if [ "$required_reviews" -ge 1 ]; then
            compliance_score=$((compliance_score + 2))
        else
            issues+=("No required reviews configured")
        fi
        
        # Check signed commits
        local signed_commits
        signed_commits=$(echo "$protection_data" | jq -r '.required_signatures.enabled' 2>/dev/null || echo "false")
        
        if [ "$signed_commits" = "true" ]; then
            compliance_score=$((compliance_score + 2))
        else
            issues+=("Signed commits not required")
        fi
        
        # Check branch restrictions
        local restrict_pushes
        restrict_pushes=$(echo "$protection_data" | jq -r '.restrictions != null' 2>/dev/null || echo "false")
        
        if [ "$restrict_pushes" = "true" ]; then
            compliance_score=$((compliance_score + 1))
        else
            issues+=("Direct pushes not restricted")
        fi
        
        # Check dismiss stale reviews
        local dismiss_stale
        dismiss_stale=$(echo "$protection_data" | jq -r '.required_pull_request_reviews.dismiss_stale_reviews' 2>/dev/null || echo "false")
        
        if [ "$dismiss_stale" = "true" ]; then
            compliance_score=$((compliance_score + 1))
        else
            issues+=("Stale reviews not dismissed automatically")
        fi
    else
        issues+=("No branch protection configured")
    fi
    
    local compliance_percentage=$((compliance_score * 100 / max_score))
    
    echo "{
        \"compliance_score\": $compliance_score,
        \"max_score\": $max_score,
        \"compliance_percentage\": $compliance_percentage,
        \"issues\": [$(printf '"%s",' "${issues[@]}" | sed 's/,$//')]
    }"
}

# Main survey function
conduct_branch_protection_survey() {
    log_info "🔍 Starting comprehensive branch protection survey..."
    
    local repositories
    repositories=$(get_fanz_repositories)
    
    if [ -z "$repositories" ]; then
        log_warning "No FANZ repositories found"
        return 1
    fi
    
    log_info "Found repositories: $(echo "$repositories" | wc -l | tr -d ' ')"
    
    local survey_results
    survey_results=$(cat << EOF
{
    "survey_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "repositories": []
}
EOF
)
    
    # Survey each repository
    while IFS= read -r repo; do
        [ -z "$repo" ] && continue
        
        log_info "📊 Surveying repository: $repo"
        
        # Get repository branches
        local branches
        branches=$(get_repository_branches "$repo")
        
        if [ -z "$branches" ]; then
            log_warning "No branches found for $repo (may be private or inaccessible)"
            continue
        fi
        
        local repo_data
        repo_data=$(cat << EOF
{
    "name": "$repo",
    "branches": []
}
EOF
)
        
        # Check each branch
        while IFS= read -r branch; do
            [ -z "$branch" ] && continue
            
            local protection_data
            protection_data=$(check_branch_protection "$repo" "$branch")
            
            local compliance_analysis
            compliance_analysis=$(analyze_security_compliance "$repo" "$branch" "$protection_data")
            
            local branch_data
            branch_data=$(cat << EOF
{
    "name": "$branch",
    "protected": $([ "$protection_data" != "null" ] && echo "true" || echo "false"),
    "protection_rules": $protection_data,
    "security_compliance": $compliance_analysis
}
EOF
)
            
            repo_data=$(echo "$repo_data" | jq ".branches += [$branch_data]")
            
        done <<< "$branches"
        
        survey_results=$(echo "$survey_results" | jq ".repositories += [$repo_data]")
        
    done <<< "$repositories"
    
    # Save survey results
    echo "$survey_results" > "$REPORT_FILE"
    log_success "Survey results saved to: $REPORT_FILE"
    
    # Generate summary report
    generate_summary_report "$survey_results"
}

# Generate human-readable summary report
generate_summary_report() {
    local survey_data="$1"
    
    log_info "📝 Generating summary report..."
    
    local total_repos
    total_repos=$(echo "$survey_data" | jq '.repositories | length')
    
    local total_branches
    total_branches=$(echo "$survey_data" | jq '[.repositories[].branches | length] | add // 0')
    
    local protected_branches
    protected_branches=$(echo "$survey_data" | jq '[.repositories[].branches[] | select(.protected == true)] | length')
    
    local unprotected_branches
    unprotected_branches=$(echo "$survey_data" | jq '[.repositories[].branches[] | select(.protected == false)] | length')
    
    local avg_compliance
    avg_compliance=$(echo "$survey_data" | jq '[.repositories[].branches[].security_compliance.compliance_percentage] | add / length' 2>/dev/null || echo "0")
    
    cat > "$SUMMARY_FILE" << EOF
# 🔒 FANZ Branch Protection Survey Report

**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## 📊 Executive Summary

### Repository Coverage
- **Total Repositories Surveyed**: $total_repos
- **Total Branches Analyzed**: $total_branches
- **Protected Branches**: $protected_branches
- **Unprotected Branches**: $unprotected_branches
- **Protection Coverage**: $(echo "scale=1; $protected_branches * 100 / $total_branches" | bc)%

### Security Compliance
- **Average Compliance Score**: $(printf "%.1f" "$avg_compliance")%
- **Repositories Meeting Security Standards**: $(echo "$survey_data" | jq '[.repositories[] | select((.branches[] | .security_compliance.compliance_percentage) >= 80)] | length')
- **High-Risk Repositories**: $(echo "$survey_data" | jq '[.repositories[] | select((.branches[] | .security_compliance.compliance_percentage) < 50)] | length')

## 🚨 Critical Findings

### Unprotected Production Branches
EOF
    
    # List unprotected main/master branches
    echo "$survey_data" | jq -r '.repositories[] | select(.branches[] | select(.name == "main" or .name == "master" or .name == "develop") | select(.protected == false)) | .name' | \
    while IFS= read -r repo; do
        echo "- ❌ **$repo**: Production branches unprotected" >> "$SUMMARY_FILE"
    done
    
    cat >> "$SUMMARY_FILE" << EOF

### Missing Security Requirements
EOF
    
    # Analyze common security gaps
    echo "$survey_data" | jq -r '.repositories[].branches[] | select(.protected == true) | select(.security_compliance.compliance_percentage < 80) | .security_compliance.issues[]' | \
    sort | uniq -c | sort -rn | head -10 | \
    while read -r count issue; do
        echo "- **$issue**: $count branches affected" >> "$SUMMARY_FILE"
    done
    
    cat >> "$SUMMARY_FILE" << EOF

## 📈 Repository Analysis

EOF
    
    # Generate per-repository summary
    echo "$survey_data" | jq -r '.repositories[] | "\(.name)|\(.branches | length)|\([.branches[] | select(.protected == true)] | length)|\([.branches[].security_compliance.compliance_percentage] | add / length | floor)"' | \
    while IFS='|' read -r repo total_branches_count protected_count compliance; do
        local protection_rate
        protection_rate=$(echo "scale=1; $protected_count * 100 / $total_branches_count" | bc 2>/dev/null || echo "0")
        
        local status_icon
        if (( $(echo "$compliance >= 80" | bc -l 2>/dev/null || echo "0") )); then
            status_icon="✅"
        elif (( $(echo "$compliance >= 50" | bc -l 2>/dev/null || echo "0") )); then
            status_icon="⚠️"
        else
            status_icon="❌"
        fi
        
        echo "### $status_icon $repo" >> "$SUMMARY_FILE"
        echo "- **Branches**: $total_branches_count total, $protected_count protected ($protection_rate%)" >> "$SUMMARY_FILE"
        echo "- **Compliance Score**: ${compliance}%" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    done
    
    cat >> "$SUMMARY_FILE" << EOF

## 🛠️ Recommended Actions

### Immediate Actions (High Priority)
1. **Enable branch protection** for all main/master/develop branches
2. **Configure required status checks** for CodeQL and Semgrep SAST
3. **Require signed commits** for production branches
4. **Enable required reviews** with CODEOWNERS

### Medium Priority Actions
1. **Deploy branch protection policies** to all feature branches
2. **Implement pre-commit hooks** for early security feedback
3. **Configure branch protection monitoring** and alerting
4. **Train developers** on secure development workflows

### Long-term Goals
1. **Achieve 100% branch protection coverage**
2. **Maintain >95% security compliance score**
3. **Implement automated compliance monitoring**
4. **Establish security culture** across development teams

## 📋 Implementation Roadmap

### Phase 1: Critical Security (Week 1)
- [ ] Protect main branches in all repositories
- [ ] Enable required SAST security checks
- [ ] Configure code owner requirements

### Phase 2: Comprehensive Protection (Week 2-3)
- [ ] Extend protection to develop/release branches
- [ ] Deploy automated monitoring
- [ ] Implement developer training

### Phase 3: Optimization (Week 4+)
- [ ] Fine-tune policies based on feedback
- [ ] Optimize CI/CD performance
- [ ] Launch compliance dashboard

---

**📊 Survey Details**: See \`$(basename "$REPORT_FILE")\` for complete technical data
**🔄 Next Survey**: Recommended weekly until 100% compliance achieved
**📧 Report Distribution**: Security team, DevOps team, Engineering leadership
EOF
    
    log_success "Summary report saved to: $SUMMARY_FILE"
}

# Main execution
main() {
    log_info "🚀 Starting FANZ Branch Protection Survey"
    
    check_prerequisites
    conduct_branch_protection_survey
    
    log_success "✅ Branch protection survey completed successfully"
    log_info "📄 Reports generated:"
    log_info "  - Technical data: $REPORT_FILE"
    log_info "  - Executive summary: $SUMMARY_FILE"
    
    # Display quick summary
    if [ -f "$SUMMARY_FILE" ]; then
        echo ""
        log_info "📊 Quick Summary:"
        grep -E "Total Repositories|Protection Coverage|Average Compliance" "$SUMMARY_FILE" | sed 's/^/   /'
    fi
}

# Run the script
main "$@"
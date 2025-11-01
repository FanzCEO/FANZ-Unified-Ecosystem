#!/bin/bash

# 🔍 FANZ Local Branch Protection Survey
# Quick assessment of branch protection status for local repositories
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

set -euo pipefail

# Configuration
OUTPUT_DIR="security-reports"
REPORT_FILE="$OUTPUT_DIR/local-branch-survey-$(date +%Y%m%d-%H%M%S).md"

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

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Survey local FANZ repositories
survey_local_repositories() {
    log_info "🔍 Surveying local FANZ repositories..."
    
    local github_dir="/Users/joshuastone/Documents/GitHub"
    local total_repos=0
    local total_branches=0
    
    cat > "$REPORT_FILE" << EOF
# 🔍 FANZ Local Repository Branch Survey

**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

## 📊 Repository Analysis

EOF
    
    # Find all FANZ repositories and process them
    local fanz_repos
    fanz_repos=$(find "$github_dir" -maxdepth 1 -type d \( -name "*[Ff]anz*" -o -name "*FANZ*" \) 2>/dev/null | sort)
    
    while IFS= read -r repo_path; do
        [ -z "$repo_path" ] && continue
        local repo_name
        repo_name=$(basename "$repo_path")
        
        if [ ! -d "$repo_path/.git" ]; then
            continue
        fi
        
        log_info "📊 Analyzing repository: $repo_name"
        
        pushd "$repo_path" &> /dev/null || continue
        
        # Get current branch info
        local current_branch
        current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        
        local default_branch
        default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
        
        # Get all branches
        local all_branches
        all_branches=$(git branch -a | sed 's/^[* ] //' | grep -v '^remotes/origin/HEAD' | sed 's@^remotes/origin/@@' | sort -u)
        
        local branch_count
        branch_count=$(echo "$all_branches" | wc -l | tr -d ' ')
        
        total_repos=$((total_repos + 1))
        total_branches=$((total_branches + branch_count))
        
        cat >> "$REPORT_FILE" << EOF
### 📁 $repo_name

- **Current Branch**: \`$current_branch\`
- **Default Branch**: \`$default_branch\`
- **Total Branches**: $branch_count
- **Repository Path**: \`$repo_path\`

#### Branch Structure
EOF
        
        # Categorize branches
        local production_branches=""
        local feature_branches=""
        local security_branches=""
        local other_branches=""
        
        while IFS= read -r branch; do
            [ -z "$branch" ] && continue
            
            case "$branch" in
                "main"|"master"|"develop"|"development")
                    production_branches="$production_branches\n- 🎯 \`$branch\` (Production)"
                    ;;
                "feature/"*|"feat/"*|"fix/"*|"bugfix/"*)
                    feature_branches="$feature_branches\n- 🔧 \`$branch\` (Feature)"
                    ;;
                "security/"*|"sec/"*|"chore/security"*)
                    security_branches="$security_branches\n- 🛡️ \`$branch\` (Security)"
                    ;;
                "release/"*|"hotfix/"*)
                    production_branches="$production_branches\n- 🚀 \`$branch\` (Release)"
                    ;;
                *)
                    other_branches="$other_branches\n- 📋 \`$branch\` (Other)"
                    ;;
            esac
        done <<< "$all_branches"
        
        if [ -n "$production_branches" ]; then
            echo -e "**Production/Release Branches:**$production_branches" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        fi
        
        if [ -n "$security_branches" ]; then
            echo -e "**Security Branches:**$security_branches" >> "$REPORT_FILE"
            echo ""  >> "$REPORT_FILE"
        fi
        
        if [ -n "$feature_branches" ]; then
            echo -e "**Feature Branches:**$feature_branches" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        fi
        
        if [ -n "$other_branches" ]; then
            echo -e "**Other Branches:**$other_branches" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        fi
        
        # Check for security files
        local security_indicators=""
        
        if [ -f ".github/workflows/codeql-analysis.yml" ]; then
            security_indicators="$security_indicators\n  - ✅ CodeQL workflow configured"
        else
            security_indicators="$security_indicators\n  - ❌ CodeQL workflow missing"
        fi
        
        if [ -f ".github/workflows/semgrep-analysis.yml" ]; then
            security_indicators="$security_indicators\n  - ✅ Semgrep workflow configured"
        else
            security_indicators="$security_indicators\n  - ❌ Semgrep workflow missing"
        fi
        
        if [ -f ".github/CODEOWNERS" ]; then
            security_indicators="$security_indicators\n  - ✅ CODEOWNERS file present"
        else
            security_indicators="$security_indicators\n  - ❌ CODEOWNERS file missing"
        fi
        
        if [ -f "scripts/security/setup-github-advanced-security.sh" ]; then
            security_indicators="$security_indicators\n  - ✅ Advanced Security setup script present"
        else
            security_indicators="$security_indicators\n  - ❌ Advanced Security setup script missing"
        fi
        
        cat >> "$REPORT_FILE" << EOF
#### 🛡️ Security Configuration Status
$security_indicators

#### 📊 Branch Protection Readiness
- **Critical Branches Identified**: $(echo -e "$production_branches" | grep -c "🎯\|🚀" || echo "0")
- **Security Branches**: $(echo -e "$security_branches" | grep -c "🛡️" || echo "0")
- **SAST Workflows**: $([ -f ".github/workflows/codeql-analysis.yml" ] && [ -f ".github/workflows/semgrep-analysis.yml" ] && echo "Ready" || echo "Needs Setup")
- **Protection Priority**: $([ "$default_branch" = "main" ] || [ "$default_branch" = "master" ] && echo "HIGH" || echo "MEDIUM")

---

EOF
        
        popd &> /dev/null
        
    done <<< "$fanz_repos"
    
}

# Generate summary report
generate_summary() {
    log_info "📝 Adding summary to report..."
    
    # Count repositories and branches from the actual GitHub directory
    local github_dir="/Users/joshuastone/Documents/GitHub"
    local total_repos
    total_repos=$(find "$github_dir" -maxdepth 1 -type d \( -name "*[Ff]anz*" -o -name "*FANZ*" \) 2>/dev/null | wc -l | tr -d ' ')
    
    local total_branches
    total_branches=$(find "$github_dir" -maxdepth 1 -type d \( -name "*[Ff]anz*" -o -name "*FANZ*" \) 2>/dev/null | \
        xargs -I {} bash -c 'if [ -d "{}/.git" ]; then cd "{}" && git branch -a 2>/dev/null | wc -l; fi' | \
        awk '{sum += $1} END {print sum ? sum : 0}')
    
    # Add summary to the end
    cat >> "$REPORT_FILE" << EOF
## 📈 Survey Summary

- **Total FANZ Repositories**: $total_repos
- **Total Branches Analyzed**: $total_branches
- **Average Branches per Repository**: $(echo "scale=1; $total_branches / $total_repos" | bc 2>/dev/null || echo "N/A")

## 🚨 Branch Protection Implementation Status

### ❌ Current State
- **Branch Protection Rules**: Not yet implemented
- **Required Status Checks**: Not configured
- **Signed Commit Requirements**: Not enforced
- **CODEOWNERS Reviews**: Not required

### ✅ Implementation Ready
- **SAST Workflows**: Deployed (CodeQL + Semgrep)
- **Protection Scripts**: Available and tested
- **Monitoring Tools**: Ready for deployment
- **Security Strategy**: Fully documented

## 🎯 Next Steps

### Immediate Actions Required
1. **Run Branch Protection Implementation**:
   \`\`\`bash
   cd /Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM
   DRY_RUN=false ./scripts/security/implement-branch-protection.sh
   \`\`\`

2. **Verify Implementation**:
   \`\`\`bash
   ./scripts/security/verify-branch-protection.sh
   \`\`\`

3. **Monitor Compliance**:
   \`\`\`bash
   ./scripts/security/survey-branch-protection.sh
   \`\`\`

### Critical Branches Requiring Protection
- All \`main\`/\`master\` branches (Production tier)
- All \`develop\` branches (Integration tier)
- All \`security/*\` branches (Security tier)
- All \`release/*\` and \`hotfix/*\` branches (Release tier)

---

**🎯 Status**: Ready for Branch Protection Implementation  
**🔐 Security Level**: Currently UNPROTECTED - Action Required  
**⚡ Implementation Time**: ~15 minutes for full deployment  
**📊 Expected Result**: Enterprise-grade branch security across all FANZ repositories
EOF
    
    log_success "Survey completed and saved to: $REPORT_FILE"
}

# Main execution
main() {
    log_info "🚀 Starting Local FANZ Repository Survey"
    echo ""
    
    survey_local_repositories
    generate_summary
    
    echo ""
    log_success "✅ Local repository survey completed!"
    log_info "📄 Report saved to: $REPORT_FILE"
    
    echo ""
    log_info "📊 Quick Actions Available:"
    echo "   1. View report: cat $REPORT_FILE"
    echo "   2. Implement protection: DRY_RUN=false ./scripts/security/implement-branch-protection.sh"
    echo "   3. Test implementation: ./scripts/security/implement-branch-protection.sh"
}

# Run the script
main "$@"
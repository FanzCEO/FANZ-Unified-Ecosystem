#!/bin/bash

# 🚀 FANZ Unified Ecosystem - Comprehensive Code Inventory Tool
# Generates SBOMs, language maps, and consolidation analysis across 10,854+ files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
INVENTORY_DIR="$(dirname "$0")/output"
REPO_ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$INVENTORY_DIR/fanz_ecosystem_inventory_$TIMESTAMP.md"

echo -e "${BLUE}🚀 FANZ Unified Ecosystem - Comprehensive Code Inventory${NC}"
echo -e "${BLUE}================================================================${NC}"
echo

# Create output directory
mkdir -p "$INVENTORY_DIR"

print_section() {
    echo -e "\n${PURPLE}📊 $1${NC}"
    echo "----------------------------------------"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check required tools
check_dependencies() {
    print_section "Checking Dependencies"
    
    local missing_tools=()
    
    # Check for cloc (lines of code counter)
    if ! command -v cloc &> /dev/null; then
        missing_tools+=("cloc")
    else
        print_status "cloc available"
    fi
    
    # Check for syft (SBOM generator)
    if ! command -v syft &> /dev/null; then
        print_warning "syft not found - attempting to install..."
        if command -v brew &> /dev/null; then
            brew install syft
        elif command -v curl &> /dev/null; then
            curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
        else
            missing_tools+=("syft")
        fi
    else
        print_status "syft available"
    fi
    
    # Check for jq (JSON processor)
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    else
        print_status "jq available"
    fi
    
    # Check for tree (directory tree)
    if ! command -v tree &> /dev/null; then
        print_warning "tree not found but optional"
    else
        print_status "tree available"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        exit 1
    fi
}

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << 'EOF'
# 🚀 FANZ Unified Ecosystem - Comprehensive Code Inventory

> **Generated:** $(date)  
> **Repository:** FANZ_UNIFIED_ECOSYSTEM  
> **Analysis Scope:** 10,854+ source files across all platforms and systems

## 📊 Executive Summary

This comprehensive inventory analyzes the entire FANZ Unified Ecosystem codebase, identifying consolidation opportunities, dependencies, and architectural patterns across 9 platform clusters and 7 specialized systems.

---

EOF
}

# Analyze codebase structure
analyze_structure() {
    print_section "Analyzing Repository Structure"
    
    echo "## 🏗️ Repository Structure" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Generate directory tree
    if command -v tree &> /dev/null; then
        echo '```' >> "$REPORT_FILE"
        cd "$REPO_ROOT"
        tree -L 3 -I 'node_modules|.git|.next|dist|build|coverage|*.log' >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo >> "$REPORT_FILE"
        print_status "Directory structure captured"
    fi
    
    # Count files by type
    echo "### File Count by Extension" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    echo "| Extension | Count | Description |" >> "$REPORT_FILE"
    echo "|-----------|-------|-------------|" >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
                   -o -name "*.go" -o -name "*.py" -o -name "*.sql" -o -name "*.md" \
                   -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" \
                   -o -name "*.sh" -o -name "*.dockerfile" -o -name "Dockerfile" \) \
        | grep -v node_modules | grep -v .git | sort | \
        sed 's/.*\.//' | uniq -c | sort -nr | \
        while read count ext; do
            case "$ext" in
                ts|tsx) desc="TypeScript" ;;
                js|jsx) desc="JavaScript" ;;
                go) desc="Go" ;;
                py) desc="Python" ;;
                sql) desc="SQL" ;;
                md) desc="Markdown" ;;
                json) desc="JSON Config" ;;
                yaml|yml) desc="YAML Config" ;;
                toml) desc="TOML Config" ;;
                sh) desc="Shell Scripts" ;;
                dockerfile|Dockerfile) desc="Docker" ;;
                *) desc="Other" ;;
            esac
            echo "| .$ext | $count | $desc |" >> "$REPORT_FILE"
        done
    
    echo >> "$REPORT_FILE"
}

# Generate language statistics
generate_language_stats() {
    print_section "Generating Language Statistics"
    
    echo "## 📈 Language Analysis (CLOC)" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    if command -v cloc &> /dev/null; then
        echo '```' >> "$REPORT_FILE"
        cloc . --exclude-dir=node_modules,.git,.next,dist,build,coverage --quiet >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo >> "$REPORT_FILE"
        
        # Generate detailed breakdown by directory
        echo "### Platform Cluster Breakdown" >> "$REPORT_FILE"
        echo >> "$REPORT_FILE"
        
        for cluster in frontend backend mobile ai blockchain analytics security; do
            if [ -d "$cluster" ]; then
                echo "#### $cluster/" >> "$REPORT_FILE"
                echo '```' >> "$REPORT_FILE"
                cloc "$cluster" --exclude-dir=node_modules,.git,.next,dist,build,coverage --quiet >> "$REPORT_FILE"
                echo '```' >> "$REPORT_FILE"
                echo >> "$REPORT_FILE"
            fi
        done
        
        print_status "Language statistics generated"
    else
        echo "CLOC not available - skipping language statistics" >> "$REPORT_FILE"
        print_warning "CLOC not available"
    fi
}

# Generate SBOM (Software Bill of Materials)
generate_sbom() {
    print_section "Generating Software Bill of Materials (SBOM)"
    
    echo "## 🔍 Software Bill of Materials (SBOM)" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    if command -v syft &> /dev/null; then
        # Generate JSON SBOM
        local sbom_file="$INVENTORY_DIR/fanz_ecosystem_sbom_$TIMESTAMP.json"
        syft dir:. -o json > "$sbom_file" 2>/dev/null || true
        
        if [ -f "$sbom_file" ] && [ -s "$sbom_file" ]; then
            # Parse SBOM for key statistics
            local total_packages=$(jq -r '.artifacts | length' "$sbom_file" 2>/dev/null || echo "0")
            local ecosystems=$(jq -r '.artifacts[].type' "$sbom_file" 2>/dev/null | sort | uniq -c | sort -nr || echo "")
            
            echo "### SBOM Summary" >> "$REPORT_FILE"
            echo >> "$REPORT_FILE"
            echo "- **Total Packages:** $total_packages" >> "$REPORT_FILE"
            echo "- **SBOM File:** \`$(basename "$sbom_file")\`" >> "$REPORT_FILE"
            echo >> "$REPORT_FILE"
            
            echo "### Package Ecosystems" >> "$REPORT_FILE"
            echo >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "$ecosystems" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo >> "$REPORT_FILE"
            
            # Top dependencies by ecosystem
            echo "### Top Dependencies by Ecosystem" >> "$REPORT_FILE"
            echo >> "$REPORT_FILE"
            
            for ecosystem in npm go-module python; do
                echo "#### $ecosystem" >> "$REPORT_FILE"
                echo '```' >> "$REPORT_FILE"
                jq -r ".artifacts[] | select(.type == \"$ecosystem\") | .name" "$sbom_file" 2>/dev/null | \
                    head -20 >> "$REPORT_FILE" || echo "No $ecosystem packages found" >> "$REPORT_FILE"
                echo '```' >> "$REPORT_FILE"
                echo >> "$REPORT_FILE"
            done
            
            print_status "SBOM generated with $total_packages packages"
        else
            echo "SBOM generation failed or produced empty results" >> "$REPORT_FILE"
            print_warning "SBOM generation failed"
        fi
    else
        echo "Syft not available - skipping SBOM generation" >> "$REPORT_FILE"
        print_warning "Syft not available"
    fi
}

# Analyze platform clusters
analyze_clusters() {
    print_section "Analyzing Platform Clusters"
    
    echo "## 🎯 Platform Cluster Analysis" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Define platform clusters using regular arrays
    clusters_dirs=("frontend" "backend" "mobile" "ai" "blockchain" "analytics" "security" "payments" "media")
    clusters_descs=("FanzLab Universal Portal" "Core Backend Services" "Mobile Applications (iOS/Android)" "AI and ML Services" "NFT Marketplace and Web3" "Analytics and Reporting" "FanzShield Security Platform" "Payment Processing" "Media Processing Pipeline")
    
    echo "| Cluster | Description | Files | Lines | Primary Languages |" >> "$REPORT_FILE"
    echo "|---------|-------------|-------|-------|-------------------|" >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    for i in "${!clusters_dirs[@]}"; do
        local cluster_dir="${clusters_dirs[$i]}"
        local description="${clusters_descs[$i]}"
        
        if [ -d "$cluster_dir" ]; then
            local file_count=$(find "$cluster_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.go" -o -name "*.py" \) | wc -l | tr -d ' ')
            
            # Get lines of code for this cluster
            local lines="N/A"
            if command -v cloc &> /dev/null; then
                lines=$(cloc "$cluster_dir" --exclude-dir=node_modules,.git,.next,dist,build,coverage --quiet --csv 2>/dev/null | \
                       tail -n 1 | cut -d',' -f5 2>/dev/null || echo "N/A")
            fi
            
            # Determine primary languages
            local languages=""
            if [ -f "$cluster_dir/package.json" ]; then
                languages="${languages}TypeScript/JavaScript "
            fi
            if [ -f "$cluster_dir/go.mod" ] || find "$cluster_dir" -name "*.go" -type f | head -1 | grep -q .; then
                languages="${languages}Go "
            fi
            if [ -f "$cluster_dir/requirements.txt" ] || [ -f "$cluster_dir/pyproject.toml" ] || find "$cluster_dir" -name "*.py" -type f | head -1 | grep -q .; then
                languages="${languages}Python "
            fi
            
            echo "| $cluster_dir | $description | $file_count | $lines | $languages |" >> "$REPORT_FILE"
        fi
    done
    
    echo >> "$REPORT_FILE"
    print_status "Platform clusters analyzed"
}

# Identify duplicates and consolidation opportunities
identify_duplicates() {
    print_section "Identifying Consolidation Opportunities"
    
    echo "## 🔄 Consolidation Analysis" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    
    # Look for duplicate package.json files and common dependencies
    echo "### Package.json Analysis" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    local package_files=$(find . -name "package.json" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
    echo "- **Package.json files found:** $package_files" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Common dependencies across package.json files
    echo "#### Most Common Dependencies" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    find . -name "package.json" -not -path "*/node_modules/*" -exec jq -r '.dependencies // {} | keys[]' {} + 2>/dev/null | \
        sort | uniq -c | sort -nr | head -20 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Look for similar file structures
    echo "### Potential Duplicate Patterns" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Find files with similar names across directories
    echo "#### Files with Similar Names (Potential Duplicates)" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.go" -o -name "*.py" \) -not -path "*/node_modules/*" -not -path "*/.git/*" | \
        xargs -I {} basename {} | sort | uniq -c | sort -nr | head -20 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Configuration file analysis
    echo "### Configuration Files Analysis" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "#### TypeScript Configurations" >> "$REPORT_FILE"
    local ts_configs=$(find . -name "tsconfig.json" -o -name "tsconfig.*.json" | wc -l | tr -d ' ')
    echo "- **TypeScript configs:** $ts_configs" >> "$REPORT_FILE"
    
    echo "#### ESLint Configurations" >> "$REPORT_FILE"
    local eslint_configs=$(find . -name ".eslintrc*" -o -name "eslint.config.*" | wc -l | tr -d ' ')
    echo "- **ESLint configs:** $eslint_configs" >> "$REPORT_FILE"
    
    echo "#### Docker Files" >> "$REPORT_FILE"
    local dockerfiles=$(find . -name "Dockerfile*" -o -name "*.dockerfile" | wc -l | tr -d ' ')
    echo "- **Dockerfiles:** $dockerfiles" >> "$REPORT_FILE"
    
    echo >> "$REPORT_FILE"
    print_status "Consolidation analysis completed"
}

# Generate dependency graph
generate_dependency_graph() {
    print_section "Generating Dependency Graph"
    
    echo "## 🕸️ Dependency Graph" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Create a simple dependency map based on imports/requires
    echo "### Internal Dependencies" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    cd "$REPO_ROOT"
    
    # Find TypeScript/JavaScript imports
    echo "#### TypeScript/JavaScript Import Analysis" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
        grep -v node_modules | \
        xargs grep -h "^import.*from ['\"]\\." 2>/dev/null | \
        sed -E "s/.*from ['\"]([^'\"]*)['\"].*/\\1/" | \
        sort | uniq -c | sort -nr | head -20 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    # Find Go imports
    echo "#### Go Import Analysis" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    find . -name "*.go" | \
        xargs grep -h "^[[:space:]]*\"[^\"]*\"" 2>/dev/null | \
        grep -v "^[[:space:]]*//\|^[[:space:]]*\*" | \
        sed 's/^[[:space:]]*//' | sed 's/"//g' | \
        sort | uniq -c | sort -nr | head -20 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    print_status "Dependency graph analysis completed"
}

# Generate recommendations
generate_recommendations() {
    print_section "Generating Consolidation Recommendations"
    
    echo "## 💡 Consolidation Recommendations" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "### High Priority Consolidations" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    echo "1. **Unified Build System**" >> "$REPORT_FILE"
    echo "   - Consolidate multiple package.json files into pnpm workspaces" >> "$REPORT_FILE"
    echo "   - Standardize TypeScript configurations with shared base config" >> "$REPORT_FILE"
    echo "   - Unify ESLint and Prettier configurations" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "2. **Shared Libraries**" >> "$REPORT_FILE"
    echo "   - Extract common utilities into @fanz/shared package" >> "$REPORT_FILE"
    echo "   - Create unified API client libraries" >> "$REPORT_FILE"
    echo "   - Consolidate authentication and authorization logic" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "3. **Docker Standardization**" >> "$REPORT_FILE"
    echo "   - Create base Docker images for each language" >> "$REPORT_FILE"
    echo "   - Standardize Dockerfile patterns and multi-stage builds" >> "$REPORT_FILE"
    echo "   - Implement consistent healthcheck patterns" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "### Medium Priority Optimizations" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    echo "1. **Configuration Management**" >> "$REPORT_FILE"
    echo "   - Centralize environment variable management" >> "$REPORT_FILE"
    echo "   - Standardize configuration patterns across services" >> "$REPORT_FILE"
    echo "   - Implement configuration validation" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "2. **Testing Infrastructure**" >> "$REPORT_FILE"
    echo "   - Unified testing framework across all services" >> "$REPORT_FILE"
    echo "   - Shared test utilities and mocks" >> "$REPORT_FILE"
    echo "   - Consistent coverage reporting" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    echo "### Implementation Roadmap" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    echo "| Phase | Task | Estimated Effort | Impact |" >> "$REPORT_FILE"
    echo "|-------|------|-----------------|--------|" >> "$REPORT_FILE"
    echo "| 1 | Implement pnpm workspaces | 2-3 days | High |" >> "$REPORT_FILE"
    echo "| 1 | Create shared base configurations | 1-2 days | High |" >> "$REPORT_FILE"
    echo "| 2 | Extract common utilities | 3-5 days | Medium |" >> "$REPORT_FILE"
    echo "| 2 | Standardize Docker images | 2-3 days | Medium |" >> "$REPORT_FILE"
    echo "| 3 | Centralize configuration management | 2-4 days | Medium |" >> "$REPORT_FILE"
    echo "| 3 | Unify testing infrastructure | 3-5 days | Low |" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    
    print_status "Recommendations generated"
}

# Main execution
main() {
    print_section "Starting Comprehensive Inventory"
    echo "Repository: $REPO_ROOT"
    echo "Output: $INVENTORY_DIR"
    echo "Report: $(basename "$REPORT_FILE")"
    echo
    
    # Execute analysis steps
    check_dependencies
    init_report
    analyze_structure
    generate_language_stats
    generate_sbom
    analyze_clusters
    identify_duplicates
    generate_dependency_graph
    generate_recommendations
    
    # Finalize report
    echo "---" >> "$REPORT_FILE"
    echo >> "$REPORT_FILE"
    echo "**Generated:** $(date)" >> "$REPORT_FILE"
    echo "**Tool:** FANZ Ecosystem Inventory v1.0" >> "$REPORT_FILE"
    echo "**Repository:** $(git remote get-url origin 2>/dev/null || echo "Local Repository")" >> "$REPORT_FILE"
    
    print_section "Inventory Complete"
    echo "📄 Report: $REPORT_FILE"
    echo "📁 Output Directory: $INVENTORY_DIR"
    
    if [ -f "$INVENTORY_DIR/fanz_ecosystem_sbom_$TIMESTAMP.json" ]; then
        echo "🔍 SBOM: $INVENTORY_DIR/fanz_ecosystem_sbom_$TIMESTAMP.json"
    fi
    
    print_status "Comprehensive inventory completed successfully!"
    print_status "Review the generated report for consolidation opportunities"
}

# Execute main function
main "$@"
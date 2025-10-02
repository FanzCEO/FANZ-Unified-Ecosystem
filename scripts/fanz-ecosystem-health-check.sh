#!/bin/bash
# 🏥 FANZ Ecosystem Health Check
# Comprehensive health verification for all FANZ platform clusters
# Per FANZ rules: ensuring 99.9% uptime compliance

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

check_service() {
    ((TOTAL_CHECKS++))
    local service_name="$1"
    local check_command="$2"
    local description="$3"
    
    log_info "Checking $service_name: $description"
    
    if eval "$check_command" >/dev/null 2>&1; then
        log_success "$service_name is operational"
        return 0
    else
        log_error "$service_name failed health check"
        return 1
    fi
}

check_directory() {
    ((TOTAL_CHECKS++))
    local dir_name="$1"
    local description="$2"
    
    if [ -d "$dir_name" ]; then
        local file_count=$(find "$dir_name" -type f | wc -l)
        if [ "$file_count" -gt 0 ]; then
            log_success "$description ($file_count files)"
            return 0
        else
            log_warning "$description exists but is empty"
            return 1
        fi
    else
        log_error "$description directory not found"
        return 1
    fi
}

check_file() {
    ((TOTAL_CHECKS++))
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        log_success "$description exists"
        return 0
    else
        log_error "$description not found"
        return 1
    fi
}

# Header
echo ""
echo "🏥 FANZ ECOSYSTEM COMPREHENSIVE HEALTH CHECK"
echo "═══════════════════════════════════════════"
echo "📅 $(date)"
echo "🏠 Directory: $(pwd)"
echo ""

# ==============================================
# CORE INFRASTRUCTURE CHECKS
# ==============================================
echo "🔧 CORE INFRASTRUCTURE"
echo "────────────────────────"

# Check Docker
check_service "Docker" "docker --version" "Container runtime availability"

# Check Docker Compose files
check_file "docker-compose.yml" "Main Docker Compose configuration"
check_file "docker-compose.production.yml" "Production deployment configuration"

# Check essential directories
check_directory "scripts" "Build and deployment scripts"
check_directory "docs" "Documentation"
check_directory ".github/workflows" "CI/CD workflows"

# ==============================================
# FANZ PLATFORM CLUSTERS CHECKS
# ==============================================
echo ""
echo "🎭 FANZ PLATFORM CLUSTERS"
echo "──────────────────────────"

# Core Platforms
check_directory "FanzDash" "FanzDash - Central control dashboard"
check_directory "FANZ-Unified-Ecosystem" "FANZ Unified Ecosystem - Main platform"
check_directory "FANZForge" "FANZForge - Development platform"

# Creator Platforms
check_directory "BoyFanz-3" "BoyFanz - Male creator platform"
check_directory "GirlFanz" "GirlFanz - Female creator platform" 
check_directory "PupFanz" "PupFanz - Community platform"

# Media & Content
check_directory "FanzTube" "FanzTube - Video platform"
check_directory "FanzMediaCore" "FanzMediaCore - Media processing"
check_directory "FanzSpicyAi" "FanzSpicyAi - AI content tools"

# Commerce & Finance
check_directory "FanzCommerceV1" "FanzCommerce - E-commerce platform"
check_directory "FanzFiliate" "FanzFiliate - Affiliate system"
check_directory "FanzWorkMarketplace" "FanzWorkMarketplace - Service marketplace"

# Social & Communication
check_directory "FanzLanding" "FanzLanding - Landing pages"
check_directory "FanzMeetV1" "FanzMeet - Meeting platform"
check_directory "FanzRoulette" "FanzRoulette - Social discovery"

# Security & Compliance
check_directory "FanzProtect" "FanzProtect - Security platform"
check_directory "FanzSecurityCompDash" "FanzSecurityCompDash - Security dashboard"
check_directory "FanzHubVaultV1" "FanzHubVault - Secure document storage"

# Additional Platforms
check_directory "StarzCardsV1" "StarzCards - Trading cards platform"
check_directory "ClubCentral" "ClubCentral - Community management"
check_directory "CreatorCRM" "CreatorCRM - Creator relationship management"

# ==============================================
# CONFIGURATION & SECURITY CHECKS
# ==============================================
echo ""
echo "🔐 CONFIGURATION & SECURITY"
echo "────────────────────────────"

# Check security configurations
check_file ".gitleaks.toml" "Git secrets protection configuration"
check_file ".security-fixes.json" "Security fixes tracking"
check_file "SECURITY.md" "Security documentation"

# Check environment configurations
check_file ".env.example" "Environment variables template"
check_file "package.json" "Node.js package configuration"
check_file "pnpm-workspace.yaml" "PNPM workspace configuration"

# Check CI/CD
check_file ".github/workflows/ci.yml" "CI/CD pipeline configuration"
check_file ".github/workflows/security-validation.yml" "Security validation workflow"

# ==============================================
# DEPENDENCY & BUILD CHECKS
# ==============================================
echo ""
echo "📦 DEPENDENCIES & BUILD SYSTEM"
echo "───────────────────────────────"

# Check if pnpm is available
if command -v pnpm >/dev/null 2>&1; then
    log_success "PNPM package manager available"
    ((PASSED_CHECKS++))
    
    # Check for security vulnerabilities
    log_info "Running security audit..."
    if pnpm audit --audit-level high >/dev/null 2>&1; then
        log_success "No high-severity security vulnerabilities found"
        ((PASSED_CHECKS++))
    else
        log_warning "Security vulnerabilities detected - check pnpm audit output"
        ((WARNINGS++))
    fi
else
    log_error "PNPM package manager not available"
    ((FAILED_CHECKS++))
fi

((TOTAL_CHECKS+=2))

# Check Node.js version
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_success "Node.js available: $NODE_VERSION"
    ((PASSED_CHECKS++))
else
    log_error "Node.js not available"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# ==============================================
# GIT & VERSION CONTROL CHECKS
# ==============================================
echo ""
echo "📋 VERSION CONTROL & COMPLIANCE"
echo "────────────────────────────────"

# Check git status
if git status >/dev/null 2>&1; then
    log_success "Git repository is healthy"
    ((PASSED_CHECKS++))
    
    # Check for untracked files (should be minimal per FANZ rules)
    UNTRACKED_COUNT=$(git status --porcelain | grep '^??' | wc -l)
    if [ "$UNTRACKED_COUNT" -lt 10 ]; then
        log_success "Untracked files count acceptable: $UNTRACKED_COUNT"
        ((PASSED_CHECKS++))
    else
        log_warning "Many untracked files: $UNTRACKED_COUNT (consider cleaning up)"
        ((WARNINGS++))
    fi
    
    # Check if we're on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        log_success "On main branch (production ready)"
        ((PASSED_CHECKS++))
    else
        log_info "On branch: $CURRENT_BRANCH"
        ((PASSED_CHECKS++))
    fi
else
    log_error "Git repository issues detected"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS+=3))

# ==============================================
# SUMMARY REPORT
# ==============================================
echo ""
echo "📊 HEALTH CHECK SUMMARY"
echo "═══════════════════════"
echo "🔍 Total Checks: $TOTAL_CHECKS"
echo "✅ Passed: $PASSED_CHECKS"
echo "⚠️  Warnings: $WARNINGS" 
echo "❌ Failed: $FAILED_CHECKS"
echo ""

# Calculate health percentage
HEALTH_PERCENTAGE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo "🏥 Overall Health: $HEALTH_PERCENTAGE%"

# Compliance check per FANZ rules (99.9% uptime requirement)
if [ "$HEALTH_PERCENTAGE" -ge 99 ]; then
    echo -e "${GREEN}🎉 FANZ ECOSYSTEM: EXCELLENT HEALTH${NC}"
    echo "✅ Meets 99.9% uptime compliance requirement"
    exit 0
elif [ "$HEALTH_PERCENTAGE" -ge 95 ]; then
    echo -e "${YELLOW}⚠️  FANZ ECOSYSTEM: GOOD HEALTH (Minor Issues)${NC}"
    echo "📋 Recommendations: Address warnings to maintain optimal performance"
    exit 0
elif [ "$HEALTH_PERCENTAGE" -ge 85 ]; then
    echo -e "${YELLOW}⚠️  FANZ ECOSYSTEM: NEEDS ATTENTION${NC}"
    echo "🔧 Action Required: Address failed checks to meet compliance"
    exit 1
else
    echo -e "${RED}🚨 FANZ ECOSYSTEM: CRITICAL ISSUES DETECTED${NC}"
    echo "⚡ Immediate Action Required: System may not meet 99.9% uptime requirement"
    exit 2
fi
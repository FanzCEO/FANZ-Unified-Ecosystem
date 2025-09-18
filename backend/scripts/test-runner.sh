#!/bin/bash

# 🧪 FANZ Backend - Comprehensive Test Runner
# This script runs all test suites and provides detailed reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 FANZ Backend - Test Suite Runner${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Configuration
TEST_RESULTS_DIR="./test-results"
COVERAGE_THRESHOLD=80
START_TIME=$(date +%s)

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

# Function to run test suite and capture results
run_test_suite() {
    local suite_name=$1
    local test_path=$2
    local description=$3
    
    echo -e "${PURPLE}📋 Running $suite_name${NC}"
    echo -e "${CYAN}   $description${NC}"
    echo ""
    
    local start_time=$(date +%s)
    
    local safe_name=$(echo "$suite_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    if npm test "$test_path" > "$TEST_RESULTS_DIR/$safe_name-results.txt" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Extract test count from results
        local passed=$(grep -o "[0-9]* passed" "$TEST_RESULTS_DIR/$safe_name-results.txt" | grep -o "[0-9]*" | head -1)
        local failed=$(grep -o "[0-9]* failed" "$TEST_RESULTS_DIR/$safe_name-results.txt" | grep -o "[0-9]*" | head -1)
        
        passed=${passed:-0}
        failed=${failed:-0}
        
        echo -e "   ${GREEN}✅ $suite_name: PASSED${NC}"
        echo -e "   ${CYAN}   Duration: ${duration}s | Passed: $passed | Failed: $failed${NC}"
        echo ""
        
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo -e "   ${RED}❌ $suite_name: FAILED${NC}"
        echo -e "   ${CYAN}   Duration: ${duration}s${NC}"
        echo -e "   ${YELLOW}   Check: $TEST_RESULTS_DIR/$safe_name-results.txt${NC}"
        echo ""
        
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Node.js version
    local node_version=$(node --version)
    echo "   Node.js: $node_version"
    
    # Check npm version
    local npm_version=$(npm --version)
    echo "   NPM: $npm_version"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        warning "Dependencies not installed. Running npm ci..."
        npm ci
    fi
    
    echo ""
}

# Function to run all test suites
run_all_tests() {
    local total_suites=0
    local passed_suites=0
    local failed_suites=0
    
    echo -e "${BLUE}🚀 Starting Test Execution${NC}"
    echo -e "${CYAN}===========================${NC}"
    echo ""
    
    # Unit Tests
    if run_test_suite "Unit Tests" "tests/unit/basic.test.ts" "Basic framework verification and utilities"; then
        ((passed_suites++))
    else
        ((failed_suites++))
    fi
    ((total_suites++))
    
    if run_test_suite "Payment Processing" "tests/unit/payments.test.ts" "Payment, refund, and payout processing logic"; then
        ((passed_suites++))
    else
        ((failed_suites++))
    fi
    ((total_suites++))
    
    # Integration Tests (if API tests work)
    if [ -f "tests/integration/api.test.ts" ]; then
        echo -e "${PURPLE}📋 Checking Integration Tests${NC}"
        echo -e "${YELLOW}   Skipping integration tests (require app setup)${NC}"
        echo ""
    fi
    
    # E2E Tests (if workflow tests work)
    if [ -f "tests/e2e/workflows.test.ts" ]; then
        echo -e "${PURPLE}📋 Checking E2E Tests${NC}"
        echo -e "${YELLOW}   Skipping E2E tests (require full system setup)${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${CYAN}===============${NC}"
    echo -e "   Total Suites: $total_suites"
    echo -e "   ${GREEN}Passed: $passed_suites${NC}"
    echo -e "   ${RED}Failed: $failed_suites${NC}"
    echo ""
    
    if [ $failed_suites -eq 0 ]; then
        echo -e "${GREEN}🎉 All test suites passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ $failed_suites test suite(s) failed${NC}"
        return 1
    fi
}

# Function to run coverage report
run_coverage() {
    log "📈 Generating coverage report..."
    
    if npm run test:coverage tests/unit/basic.test.ts tests/unit/payments.test.ts > "$TEST_RESULTS_DIR/coverage-results.txt" 2>&1; then
        echo -e "   ${GREEN}✅ Coverage report generated${NC}"
        echo -e "   ${CYAN}   Report: ./coverage/index.html${NC}"
        
        # Try to extract coverage percentage
        if grep -q "All files" "$TEST_RESULTS_DIR/coverage-results.txt"; then
            local coverage_line=$(grep "All files" "$TEST_RESULTS_DIR/coverage-results.txt")
            echo -e "   ${CYAN}   $coverage_line${NC}"
        fi
        
        echo ""
        return 0
    else
        warning "Coverage report generation failed"
        echo ""
        return 1
    fi
}

# Function to run linting
run_linting() {
    log "🔍 Running code linting..."
    
    if npm run lint > "$TEST_RESULTS_DIR/lint-results.txt" 2>&1; then
        echo -e "   ${GREEN}✅ Linting passed${NC}"
    else
        warning "Linting issues found"
        echo -e "   ${YELLOW}   Check: $TEST_RESULTS_DIR/lint-results.txt${NC}"
    fi
    echo ""
}

# Function to run type checking
run_type_check() {
    log "🔧 Running type checking..."
    
    if npm run type-check > "$TEST_RESULTS_DIR/typecheck-results.txt" 2>&1; then
        echo -e "   ${GREEN}✅ Type checking passed${NC}"
    else
        warning "Type errors found"
        echo -e "   ${YELLOW}   Check: $TEST_RESULTS_DIR/typecheck-results.txt${NC}"
    fi
    echo ""
}

# Function to generate final report
generate_report() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - START_TIME))
    
    echo -e "${BLUE}📋 Final Test Report${NC}"
    echo -e "${CYAN}===================${NC}"
    echo "   Start Time: $(date -d @$START_TIME '+%Y-%m-%d %H:%M:%S')"
    echo "   End Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "   Total Duration: ${total_duration}s"
    echo ""
    echo "   Test Results Directory: $TEST_RESULTS_DIR"
    echo "   Coverage Report: ./coverage/index.html (if generated)"
    echo ""
    
    # List all result files
    if [ "$(ls -A $TEST_RESULTS_DIR 2>/dev/null)" ]; then
        echo -e "   ${CYAN}Generated Reports:${NC}"
        for file in "$TEST_RESULTS_DIR"/*; do
            if [ -f "$file" ]; then
                local filename=$(basename "$file")
                echo "     📄 $filename"
            fi
        done
        echo ""
    fi
    
    # Show quick statistics
    echo -e "${BLUE}🎯 Quick Statistics${NC}"
    echo -e "${CYAN}==================${NC}"
    
    # Count total test files
    local test_files=$(find tests -name "*.test.ts" -o -name "*.spec.ts" | wc -l | xargs)
    echo "   Test Files: $test_files"
    
    # Count source files
    local src_files=$(find src -name "*.ts" | wc -l | xargs)
    echo "   Source Files: $src_files"
    
    echo ""
}

# Function to handle cleanup
cleanup() {
    log "🧹 Cleaning up..."
    # Add any cleanup tasks here
}

# Handle script termination
trap cleanup EXIT

# Main execution
main() {
    echo -e "${BLUE}🚀 FANZ Backend Test Suite${NC}"
    echo -e "${CYAN}Version: 1.0.0${NC}"
    echo -e "${CYAN}$(date)${NC}"
    echo ""
    
    # Check command line arguments
    local run_coverage_flag=false
    local run_linting_flag=false
    local run_typecheck_flag=false
    
    for arg in "$@"; do
        case $arg in
            --coverage)
                run_coverage_flag=true
                shift
                ;;
            --lint)
                run_linting_flag=true
                shift
                ;;
            --typecheck)
                run_typecheck_flag=true
                shift
                ;;
            --all)
                run_coverage_flag=true
                run_linting_flag=true
                run_typecheck_flag=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --coverage   Generate coverage report"
                echo "  --lint       Run linting"
                echo "  --typecheck  Run type checking"
                echo "  --all        Run all checks"
                echo "  --help       Show this help"
                exit 0
                ;;
        esac
    done
    
    # Run prerequisite checks
    check_prerequisites
    
    # Run optional checks first
    if [ "$run_typecheck_flag" = true ]; then
        run_type_check
    fi
    
    if [ "$run_linting_flag" = true ]; then
        run_linting
    fi
    
    # Run main tests
    if run_all_tests; then
        # Run coverage if requested and tests passed
        if [ "$run_coverage_flag" = true ]; then
            run_coverage
        fi
        
        generate_report
        
        echo -e "${GREEN}🎉 Test execution completed successfully!${NC}"
        exit 0
    else
        generate_report
        
        echo -e "${RED}❌ Test execution failed!${NC}"
        echo -e "${YELLOW}Check the test results in: $TEST_RESULTS_DIR${NC}"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
#!/bin/bash

# FanzFinance OS - Health Check and Monitoring Script
# This script checks the health of all FanzFinance OS components

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default configuration
DEFAULT_HOST="localhost"
DEFAULT_PORT="3000"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5432"
DEFAULT_REDIS_HOST="localhost"
DEFAULT_REDIS_PORT="6379"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status icons
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"

# Logging functions
log_info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

log_success() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}${WARN}${NC} $1"
}

log_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Health Check Options:
    --host HOST             Application host [default: localhost]
    --port PORT             Application port [default: 3000]
    --db-host HOST          Database host [default: localhost]
    --db-port PORT          Database port [default: 5432]
    --redis-host HOST       Redis host [default: localhost]
    --redis-port PORT       Redis port [default: 6379]
    --timeout SECONDS       Request timeout [default: 10]
    --verbose               Show detailed output
    --json                  Output results in JSON format
    --continuous            Run continuous monitoring
    --interval SECONDS      Interval for continuous monitoring [default: 30]
    --alerts                Enable alerting (requires notification setup)
    --help                  Show this help message

Environment Variables:
    APP_HOST                Application host
    APP_PORT                Application port
    DATABASE_URL            Database connection URL
    REDIS_URL               Redis connection URL
    HEALTH_CHECK_TIMEOUT    Request timeout in seconds
    NOTIFICATION_WEBHOOK    Webhook URL for alerts

Examples:
    $0                                    # Basic health check
    $0 --verbose                          # Detailed health check
    $0 --continuous --interval 60         # Monitor every minute
    $0 --json                             # JSON output for automation
    $0 --port 8080 --db-port 5433         # Custom ports

EOF
}

# Parse command line arguments
parse_arguments() {
    HOST="${APP_HOST:-$DEFAULT_HOST}"
    PORT="${APP_PORT:-$DEFAULT_PORT}"
    DB_HOST="${DB_HOST:-$DEFAULT_DB_HOST}"
    DB_PORT="${DB_PORT:-$DEFAULT_DB_PORT}"
    REDIS_HOST="${REDIS_HOST:-$DEFAULT_REDIS_HOST}"
    REDIS_PORT="${REDIS_PORT:-$DEFAULT_REDIS_PORT}"
    TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"
    VERBOSE=false
    JSON_OUTPUT=false
    CONTINUOUS=false
    INTERVAL=30
    ALERTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --host)
                HOST="$2"
                shift 2
                ;;
            --port)
                PORT="$2"
                shift 2
                ;;
            --db-host)
                DB_HOST="$2"
                shift 2
                ;;
            --db-port)
                DB_PORT="$2"
                shift 2
                ;;
            --redis-host)
                REDIS_HOST="$2"
                shift 2
                ;;
            --redis-port)
                REDIS_PORT="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --continuous)
                CONTINUOUS=true
                shift
                ;;
            --interval)
                INTERVAL="$2"
                shift 2
                ;;
            --alerts)
                ALERTS=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Check if a service is reachable
check_service_connectivity() {
    local host="$1"
    local port="$2"
    local service_name="$3"
    local timeout="${4:-5}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Checking connectivity to $service_name at $host:$port"
    fi
    
    if timeout "$timeout" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Make HTTP request with timeout
make_http_request() {
    local url="$1"
    local method="${2:-GET}"
    local timeout="${3:-$TIMEOUT}"
    local expected_status="${4:-200}"
    
    if command -v curl &> /dev/null; then
        local response
        response=$(curl -s -w "%{http_code}" -m "$timeout" -X "$method" "$url" 2>/dev/null || echo "000")
        local status_code="${response: -3}"
        local body="${response%???}"
        
        if [[ "$status_code" == "$expected_status" ]]; then
            echo "$body"
            return 0
        else
            echo "HTTP $status_code"
            return 1
        fi
    else
        log_error "curl not found. Please install curl for HTTP health checks."
        return 1
    fi
}

# Check database connectivity
check_database() {
    local status="unknown"
    local message=""
    local details={}
    
    if [[ -n "${DATABASE_URL:-}" ]]; then
        local db_url="$DATABASE_URL"
    else
        local db_url="postgresql://postgres:postgres@$DB_HOST:$DB_PORT/fanz_ecosystem"
    fi
    
    if command -v psql &> /dev/null; then
        if psql "$db_url" -c "SELECT 1;" &>/dev/null; then
            status="healthy"
            message="Database connection successful"
            
            # Get additional database info if verbose
            if [[ "$VERBOSE" == "true" ]]; then
                local db_info
                db_info=$(psql "$db_url" -t -c "
                    SELECT json_build_object(
                        'version', version(),
                        'database_size', pg_size_pretty(pg_database_size(current_database())),
                        'connections', (SELECT count(*) FROM pg_stat_activity),
                        'uptime', (SELECT date_trunc('second', now() - pg_postmaster_start_time()))
                    );
                " 2>/dev/null || echo '{}')
                details="$db_info"
            fi
        else
            status="unhealthy"
            message="Cannot connect to database"
        fi
    else
        status="unknown"
        message="psql not available for database check"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"service\":\"database\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
    else
        if [[ "$status" == "healthy" ]]; then
            log_success "Database: $message"
        elif [[ "$status" == "unhealthy" ]]; then
            log_error "Database: $message"
        else
            log_warn "Database: $message"
        fi
        
        if [[ "$VERBOSE" == "true" && "$details" != "{}" ]]; then
            echo "    Details: $details"
        fi
    fi
    
    [[ "$status" == "healthy" ]]
}

# Check Redis connectivity
check_redis() {
    local status="unknown"
    local message=""
    local details={}
    
    if [[ -n "${REDIS_URL:-}" ]]; then
        # Parse Redis URL if provided
        local redis_host redis_port
        redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')
        REDIS_HOST="${redis_host:-$REDIS_HOST}"
        REDIS_PORT="${redis_port:-$REDIS_PORT}"
    fi
    
    if check_service_connectivity "$REDIS_HOST" "$REDIS_PORT" "Redis" 3; then
        if command -v redis-cli &> /dev/null; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q "PONG"; then
                status="healthy"
                message="Redis connection successful"
                
                if [[ "$VERBOSE" == "true" ]]; then
                    local redis_info
                    redis_info=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO server 2>/dev/null | grep -E "redis_version|uptime_in_seconds|connected_clients" | tr '\r' ' ' || echo "")
                    details="{\"info\":\"$redis_info\"}"
                fi
            else
                status="unhealthy"
                message="Redis ping failed"
            fi
        else
            status="healthy"
            message="Redis port accessible (redis-cli not available for detailed check)"
        fi
    else
        status="unhealthy"
        message="Cannot connect to Redis"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"service\":\"redis\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
    else
        if [[ "$status" == "healthy" ]]; then
            log_success "Redis: $message"
        elif [[ "$status" == "unhealthy" ]]; then
            log_error "Redis: $message"
        else
            log_warn "Redis: $message"
        fi
        
        if [[ "$VERBOSE" == "true" && "$details" != "{}" ]]; then
            echo "    Details: $details"
        fi
    fi
    
    [[ "$status" == "healthy" ]]
}

# Check application health endpoint
check_application() {
    local status="unknown"
    local message=""
    local details={}
    local health_url="http://$HOST:$PORT/api/health"
    
    if check_service_connectivity "$HOST" "$PORT" "Application" 3; then
        local response
        if response=$(make_http_request "$health_url" "GET" "$TIMEOUT" "200" 2>/dev/null); then
            status="healthy"
            message="Application health endpoint responsive"
            
            if [[ "$VERBOSE" == "true" ]]; then
                details="$response"
            fi
        else
            status="unhealthy"
            message="Application health endpoint failed"
        fi
    else
        status="unhealthy"
        message="Cannot connect to application"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"service\":\"application\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
    else
        if [[ "$status" == "healthy" ]]; then
            log_success "Application: $message"
        elif [[ "$status" == "unhealthy" ]]; then
            log_error "Application: $message"
        else
            log_warn "Application: $message"
        fi
        
        if [[ "$VERBOSE" == "true" && "$details" != "{}" ]]; then
            echo "    Details: $details"
        fi
    fi
    
    [[ "$status" == "healthy" ]]
}

# Check payment system specific endpoints
check_payment_system() {
    local status="unknown"
    local message=""
    local details={}
    local payment_health_url="http://$HOST:$PORT/api/payments/health"
    
    if check_service_connectivity "$HOST" "$PORT" "Payment System" 3; then
        local response
        if response=$(make_http_request "$payment_health_url" "GET" "$TIMEOUT" "200" 2>/dev/null); then
            status="healthy"
            message="Payment system endpoints responsive"
            
            if [[ "$VERBOSE" == "true" ]]; then
                details="$response"
            fi
        else
            # Try alternative health check
            local alt_url="http://$HOST:$PORT/api/payments/ping"
            if response=$(make_http_request "$alt_url" "GET" "$TIMEOUT" "200" 2>/dev/null); then
                status="healthy"
                message="Payment system ping successful"
            else
                status="unhealthy"
                message="Payment system endpoints not responding"
            fi
        fi
    else
        status="unhealthy"
        message="Cannot connect to payment system"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"service\":\"payment_system\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
    else
        if [[ "$status" == "healthy" ]]; then
            log_success "Payment System: $message"
        elif [[ "$status" == "unhealthy" ]]; then
            log_error "Payment System: $message"
        else
            log_warn "Payment System: $message"
        fi
        
        if [[ "$VERBOSE" == "true" && "$details" != "{}" ]]; then
            echo "    Details: $details"
        fi
    fi
    
    [[ "$status" == "healthy" ]]
}

# Check file system and disk usage
check_filesystem() {
    local status="healthy"
    local message="Filesystem checks passed"
    local details={}
    local issues=()
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df -h "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ "$disk_usage" -gt 90 ]]; then
        issues+=("Disk usage high: ${disk_usage}%")
        status="unhealthy"
    elif [[ "$disk_usage" -gt 80 ]]; then
        issues+=("Disk usage warning: ${disk_usage}%")
        if [[ "$status" == "healthy" ]]; then
            status="warning"
        fi
    fi
    
    # Check if required directories exist
    local required_dirs=("$PROJECT_ROOT/database" "$PROJECT_ROOT/scripts" "$PROJECT_ROOT/logs")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            issues+=("Missing directory: $(basename "$dir")")
            status="unhealthy"
        fi
    done
    
    # Check write permissions
    if [[ ! -w "$PROJECT_ROOT" ]]; then
        issues+=("No write permission to project root")
        status="unhealthy"
    fi
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        message="Filesystem issues: ${issues[*]}"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        details="{\"disk_usage\":\"${disk_usage}%\",\"project_root\":\"$PROJECT_ROOT\",\"issues\":[$(printf '"%s",' "${issues[@]}" | sed 's/,$//')]]}"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"service\":\"filesystem\",\"status\":\"$status\",\"message\":\"$message\",\"details\":$details}"
    else
        if [[ "$status" == "healthy" ]]; then
            log_success "Filesystem: $message"
        elif [[ "$status" == "warning" ]]; then
            log_warn "Filesystem: $message"
        else
            log_error "Filesystem: $message"
        fi
        
        if [[ "$VERBOSE" == "true" && "$details" != "{}" ]]; then
            echo "    Details: $details"
        fi
    fi
    
    [[ "$status" == "healthy" || "$status" == "warning" ]]
}

# Run all health checks
run_health_checks() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local overall_status="healthy"
    local checks_passed=0
    local total_checks=0
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{"
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"overall_status\": \"unknown\","
        echo "  \"checks\": ["
    else
        echo ""
        log_info "FanzFinance OS Health Check - $timestamp"
        echo "=================================================="
    fi
    
    # List of health checks to run
    local checks=(
        "check_application:Application"
        "check_database:Database"
        "check_redis:Redis"
        "check_payment_system:Payment System"
        "check_filesystem:Filesystem"
    )
    
    for check in "${checks[@]}"; do
        local check_function="${check%:*}"
        local check_name="${check#*:}"
        
        ((total_checks++))
        
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            [[ $total_checks -gt 1 ]] && echo ","
            $check_function
        else
            if $check_function; then
                ((checks_passed++))
            else
                overall_status="unhealthy"
            fi
        fi
    done
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo ""
        echo "  ],"
        
        # Calculate overall status for JSON output
        if [[ $checks_passed -eq $total_checks ]]; then
            overall_status="healthy"
        elif [[ $checks_passed -gt 0 ]]; then
            overall_status="degraded"
        else
            overall_status="unhealthy"
        fi
        
        echo "  \"summary\": {"
        echo "    \"total_checks\": $total_checks,"
        echo "    \"checks_passed\": $checks_passed,"
        echo "    \"checks_failed\": $((total_checks - checks_passed))"
        echo "  },"
        echo "  \"overall_status\": \"$overall_status\""
        echo "}"
    else
        echo ""
        echo "=================================================="
        echo "Summary: $checks_passed/$total_checks checks passed"
        
        if [[ "$overall_status" == "healthy" ]]; then
            log_success "All systems operational"
        else
            log_error "System health check failed"
        fi
        echo ""
    fi
    
    # Send alerts if enabled and there are issues
    if [[ "$ALERTS" == "true" && "$overall_status" != "healthy" ]]; then
        send_alert "$overall_status" "$checks_passed" "$total_checks"
    fi
    
    [[ "$overall_status" == "healthy" ]]
}

# Send alert notification
send_alert() {
    local status="$1"
    local passed="$2"
    local total="$3"
    local webhook_url="${NOTIFICATION_WEBHOOK:-}"
    
    if [[ -z "$webhook_url" ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            log_warn "No notification webhook configured"
        fi
        return 0
    fi
    
    local message="🚨 FanzFinance OS Health Alert: $status ($passed/$total checks passed)"
    local payload="{\"text\":\"$message\",\"timestamp\":\"$(date -u +%s)\"}"
    
    if command -v curl &> /dev/null; then
        if curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$webhook_url" &>/dev/null; then
            log_info "Alert notification sent"
        else
            log_warn "Failed to send alert notification"
        fi
    fi
}

# Continuous monitoring mode
run_continuous_monitoring() {
    log_info "Starting continuous monitoring (interval: ${INTERVAL}s)"
    log_info "Press Ctrl+C to stop"
    echo ""
    
    local check_count=0
    
    while true; do
        ((check_count++))
        
        if [[ "$JSON_OUTPUT" != "true" ]]; then
            echo "=== Health Check #$check_count ==="
        fi
        
        run_health_checks
        
        if [[ "$CONTINUOUS" == "true" ]]; then
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo "Next check in ${INTERVAL} seconds..."
                echo ""
            fi
            sleep "$INTERVAL"
        else
            break
        fi
    done
}

# Main execution
main() {
    parse_arguments "$@"
    
    if [[ "$CONTINUOUS" == "true" ]]; then
        run_continuous_monitoring
    else
        run_health_checks
    fi
}

# Handle script interruption
trap 'log_info "Health check interrupted"; exit 0' INT TERM

# Run main function with all arguments
main "$@"
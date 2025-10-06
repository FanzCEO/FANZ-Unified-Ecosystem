#!/bin/bash
set -euo pipefail

# FANZ AI Ecosystem Health Check Script
# Comprehensive health monitoring and alerting

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-fanz-ai-ecosystem}"
TIMEOUT="${TIMEOUT:-30}"
RETRY_COUNT="${RETRY_COUNT:-3}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_RECIPIENT="${EMAIL_RECIPIENT:-}"
SERVICES=(
    "ai-intelligence-hub"
    "ai-creator-assistant"
    "content-curation-engine"
    "content-distribution-network"
    "security-privacy-framework"
    "compliance-accessibility-excellence"
)
INFRASTRUCTURE=(
    "postgresql"
    "redis"
    "monitoring-prometheus"
    "monitoring-grafana"
)

# Health check results
HEALTH_RESULTS=()
FAILED_CHECKS=()
WARNINGS=()

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
    WARNINGS+=("$1")
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    FAILED_CHECKS+=("$1")
}

check_kubectl() {
    if ! command -v kubectl >/dev/null 2>&1; then
        error "kubectl is required but not installed"
        return 1
    fi
    
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        error "Namespace $NAMESPACE does not exist"
        return 1
    fi
    
    success "Kubernetes connection verified"
    return 0
}

check_pod_health() {
    local service=$1
    local pod_status
    
    log "Checking pod health for $service..."
    
    # Get pod status
    if ! pod_status=$(kubectl get pods -l "app=$service" -n "$NAMESPACE" --no-headers 2>/dev/null); then
        error "$service: No pods found"
        return 1
    fi
    
    # Check if pods are running
    local running_pods=0
    local total_pods=0
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            total_pods=$((total_pods + 1))
            local status=$(echo "$line" | awk '{print $3}')
            local ready=$(echo "$line" | awk '{print $2}')
            
            if [[ "$status" == "Running" ]] && [[ "$ready" =~ ^[1-9]/[1-9] ]]; then
                running_pods=$((running_pods + 1))
            else
                error "$service: Pod not ready - Status: $status, Ready: $ready"
            fi
        fi
    done <<< "$pod_status"
    
    if [[ $running_pods -eq 0 ]]; then
        error "$service: No running pods"
        return 1
    elif [[ $running_pods -lt $total_pods ]]; then
        warning "$service: Only $running_pods/$total_pods pods are running"
        return 2
    else
        success "$service: All $total_pods pods are running and ready"
        return 0
    fi
}

check_service_health() {
    local service=$1
    local port=${2:-80}
    
    log "Checking service health for $service..."
    
    # Check if service exists
    if ! kubectl get service "$service" -n "$NAMESPACE" >/dev/null 2>&1; then
        error "$service: Service not found"
        return 1
    fi
    
    # Port forward and health check
    local health_check_result=1
    local retry=0
    
    while [[ $retry -lt $RETRY_COUNT ]]; do
        # Start port forwarding in background
        kubectl port-forward service/"$service" 8080:$port -n "$NAMESPACE" &
        local pf_pid=$!
        
        # Wait for port forward to be ready
        sleep 3
        
        # Perform health check
        if curl -f --max-time "$TIMEOUT" http://localhost:8080/health >/dev/null 2>&1; then
            success "$service: Health check passed"
            health_check_result=0
            kill $pf_pid 2>/dev/null || true
            break
        else
            warning "$service: Health check failed (attempt $((retry + 1))/$RETRY_COUNT)"
            retry=$((retry + 1))
            kill $pf_pid 2>/dev/null || true
            sleep 2
        fi
    done
    
    if [[ $health_check_result -ne 0 ]]; then
        error "$service: Health check failed after $RETRY_COUNT attempts"
    fi
    
    return $health_check_result
}

check_resource_usage() {
    local service=$1
    
    log "Checking resource usage for $service..."
    
    # Get pod resource usage
    local metrics=$(kubectl top pods -l "app=$service" -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$metrics" ]]; then
        warning "$service: Unable to get resource metrics"
        return 1
    fi
    
    local high_cpu=false
    local high_memory=false
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            local cpu=$(echo "$line" | awk '{print $2}' | sed 's/m//')
            local memory=$(echo "$line" | awk '{print $3}' | sed 's/Mi//')
            
            # Check for high CPU usage (>80% of 1000m)
            if [[ $cpu -gt 800 ]]; then
                high_cpu=true
            fi
            
            # Check for high memory usage (>80% of 512Mi)
            if [[ $memory -gt 410 ]]; then
                high_memory=true
            fi
        fi
    done <<< "$metrics"
    
    if [[ $high_cpu == true ]]; then
        warning "$service: High CPU usage detected"
    fi
    
    if [[ $high_memory == true ]]; then
        warning "$service: High memory usage detected"
    fi
    
    if [[ $high_cpu == false ]] && [[ $high_memory == false ]]; then
        success "$service: Resource usage is normal"
        return 0
    fi
    
    return 1
}

check_database_connectivity() {
    log "Checking database connectivity..."
    
    # Check PostgreSQL
    if kubectl exec -n "$NAMESPACE" deployment/postgresql -- psql -U postgres -c "SELECT 1" >/dev/null 2>&1; then
        success "PostgreSQL: Connection successful"
    else
        error "PostgreSQL: Connection failed"
        return 1
    fi
    
    # Check Redis
    if kubectl exec -n "$NAMESPACE" deployment/redis-master -- redis-cli ping >/dev/null 2>&1; then
        success "Redis: Connection successful"
    else
        error "Redis: Connection failed"
        return 1
    fi
    
    return 0
}

check_monitoring_stack() {
    log "Checking monitoring stack..."
    
    # Check Prometheus
    if check_service_health "monitoring-prometheus" 9090; then
        success "Prometheus: Health check passed"
    else
        error "Prometheus: Health check failed"
        return 1
    fi
    
    # Check Grafana
    if check_service_health "monitoring-grafana" 3000; then
        success "Grafana: Health check passed"
    else
        error "Grafana: Health check failed"
        return 1
    fi
    
    return 0
}

check_ingress_connectivity() {
    log "Checking ingress connectivity..."
    
    local ingress_list=$(kubectl get ingress -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$ingress_list" ]]; then
        warning "No ingress resources found"
        return 1
    fi
    
    local failed_ingress=0
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            local ingress_name=$(echo "$line" | awk '{print $1}')
            local hosts=$(echo "$line" | awk '{print $3}')
            
            for host in $hosts; do
                if [[ "$host" != "*" ]] && [[ -n "$host" ]]; then
                    if curl -f --max-time "$TIMEOUT" "http://$host/health" >/dev/null 2>&1; then
                        success "$ingress_name: External access via $host is working"
                    else
                        warning "$ingress_name: External access via $host failed"
                        failed_ingress=$((failed_ingress + 1))
                    fi
                fi
            done
        fi
    done <<< "$ingress_list"
    
    return $failed_ingress
}

check_ssl_certificates() {
    log "Checking SSL certificates..."
    
    local cert_list=$(kubectl get certificates -n "$NAMESPACE" --no-headers 2>/dev/null || echo "")
    
    if [[ -z "$cert_list" ]]; then
        warning "No SSL certificates found"
        return 0
    fi
    
    local expired_certs=0
    
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            local cert_name=$(echo "$line" | awk '{print $1}')
            local ready=$(echo "$line" | awk '{print $2}')
            
            if [[ "$ready" == "True" ]]; then
                success "$cert_name: SSL certificate is valid"
            else
                error "$cert_name: SSL certificate is not ready"
                expired_certs=$((expired_certs + 1))
            fi
        fi
    done <<< "$cert_list"
    
    return $expired_certs
}

send_slack_notification() {
    local message=$1
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK" >/dev/null 2>&1
    fi
}

send_email_notification() {
    local subject=$1
    local body=$2
    
    if [[ -n "$EMAIL_RECIPIENT" ]] && command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "$EMAIL_RECIPIENT"
    fi
}

generate_report() {
    local total_checks=$((${#SERVICES[@]} + ${#INFRASTRUCTURE[@]} + 4))  # +4 for additional checks
    local failed_count=${#FAILED_CHECKS[@]}
    local warning_count=${#WARNINGS[@]}
    local success_count=$((total_checks - failed_count - warning_count))
    
    log "Generating health check report..."
    
    echo ""
    echo "🏥 FANZ AI Ecosystem Health Report"
    echo "=================================="
    echo "Timestamp: $(date)"
    echo "Namespace: $NAMESPACE"
    echo ""
    echo "📊 Summary:"
    echo "  ✅ Successful checks: $success_count"
    echo "  ⚠️  Warnings: $warning_count"
    echo "  ❌ Failed checks: $failed_count"
    echo ""
    
    if [[ $failed_count -gt 0 ]]; then
        echo "❌ Failed Checks:"
        for check in "${FAILED_CHECKS[@]}"; do
            echo "  - $check"
        done
        echo ""
    fi
    
    if [[ $warning_count -gt 0 ]]; then
        echo "⚠️  Warnings:"
        for warning in "${WARNINGS[@]}"; do
            echo "  - $warning"
        done
        echo ""
    fi
    
    # Overall health status
    local health_status="HEALTHY"
    local status_emoji="✅"
    
    if [[ $failed_count -gt 0 ]]; then
        health_status="CRITICAL"
        status_emoji="❌"
    elif [[ $warning_count -gt 0 ]]; then
        health_status="WARNING"
        status_emoji="⚠️"
    fi
    
    echo "$status_emoji Overall Status: $health_status"
    echo ""
    
    # Send notifications if needed
    if [[ $failed_count -gt 0 ]] || [[ $warning_count -gt 3 ]]; then
        local notification_message="FANZ AI Ecosystem Health Alert: $health_status - $failed_count failures, $warning_count warnings"
        send_slack_notification "$notification_message"
        send_email_notification "FANZ AI Health Alert" "$notification_message"
    fi
    
    return $failed_count
}

main() {
    log "🚀 Starting FANZ AI Ecosystem health check..."
    
    # Check prerequisites
    if ! check_kubectl; then
        exit 1
    fi
    
    # Check infrastructure
    log "Checking infrastructure components..."
    check_database_connectivity || true
    check_monitoring_stack || true
    
    # Check each service
    log "Checking FANZ AI services..."
    for service in "${SERVICES[@]}"; do
        check_pod_health "$service" || true
        check_service_health "$service" || true
        check_resource_usage "$service" || true
    done
    
    # Check external connectivity
    check_ingress_connectivity || true
    check_ssl_certificates || true
    
    # Generate and display report
    if generate_report; then
        success "🎉 All health checks completed successfully!"
        exit 0
    else
        error "🚨 Health check completed with failures"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --email)
            EMAIL_RECIPIENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --namespace NS        Kubernetes namespace (default: fanz-ai-ecosystem)"
            echo "  --timeout SECONDS     Health check timeout (default: 30)"
            echo "  --slack-webhook URL   Slack webhook for notifications"
            echo "  --email ADDRESS       Email address for notifications"
            echo "  --help                Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Handle script interruption
trap 'error "Health check interrupted"' INT TERM

# Run main function
main
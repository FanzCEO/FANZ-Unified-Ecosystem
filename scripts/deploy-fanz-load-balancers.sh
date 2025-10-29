#!/bin/bash

# FANZ DigitalOcean Load Balancer Deployment Script
# This script deploys all load balancers for the FANZ ecosystem
# Author: FANZ DevOps Team
# Version: 1.0
# Last Updated: $(date)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"
NAMESPACE_TIMEOUT="300s"

# Default values
DRY_RUN=${DRY_RUN:-false}
ENVIRONMENT=${ENVIRONMENT:-production}
REGION=${REGION:-nyc3}
SKIP_VALIDATION=${SKIP_VALIDATION:-false}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

usage() {
    cat << EOF
FANZ DigitalOcean Load Balancer Deployment Script

Usage: $0 [OPTIONS] [COMMANDS]

OPTIONS:
    --dry-run               Show what would be deployed without applying
    --environment ENV       Set environment (production|staging|development) [default: production]
    --region REGION         Set DigitalOcean region [default: nyc3]
    --skip-validation       Skip pre-deployment validation
    --help                  Show this help message

COMMANDS:
    deploy-all              Deploy all load balancers and ingresses
    deploy-public           Deploy only public load balancers
    deploy-private          Deploy only private load balancers
    deploy-media            Deploy only media services load balancers
    deploy-ingress          Deploy only ingress definitions
    validate                Validate configurations without deploying
    cleanup                 Remove all FANZ load balancers (DANGEROUS)
    status                  Show status of all load balancers

EXAMPLES:
    $0 deploy-all
    $0 --dry-run --environment staging deploy-public
    $0 --region fra1 deploy-media
    $0 validate
    $0 status

ENVIRONMENT VARIABLES:
    KUBECONFIG             Path to kubectl config file
    DO_TOKEN              DigitalOcean API token
    DRY_RUN               Set to 'true' for dry run mode
    ENVIRONMENT           Environment name
    REGION                DigitalOcean region

EOF
}

# Validate prerequisites
validate_prerequisites() {
    log "Validating prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl context
    local context
    context=$(kubectl config current-context 2>/dev/null || echo "none")
    if [[ "$context" == "none" ]]; then
        error "No kubectl context set. Please set up your kubeconfig."
        exit 1
    fi
    log "Using kubectl context: $context"
    
    # Check DigitalOcean token if deploying
    if [[ "$DRY_RUN" != "true" ]] && [[ -z "${DO_TOKEN:-}" ]]; then
        warning "DO_TOKEN environment variable not set. Some validations may fail."
    fi
    
    # Validate k8s directory structure
    if [[ ! -d "$K8S_DIR" ]]; then
        error "Kubernetes manifests directory not found: $K8S_DIR"
        exit 1
    fi
    
    success "Prerequisites validated"
}

# Create namespaces
create_namespaces() {
    log "Creating FANZ namespaces..."
    
    local namespaces=(
        "ingress-nginx"
        "boyfanz"
        "girlfanz" 
        "pupfanz"
        "transfanz"
        "taboofanz"
        "daddiesfanz"
        "fanz-core"
        "apigw"
        "auth"
        "vault"
        "fanzdash"
        "media"
        "database"
        "ads"
        "observability"
    )
    
    for ns in "${namespaces[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log "[DRY RUN] Would create namespace: $ns"
        else
            if kubectl get namespace "$ns" &> /dev/null; then
                log "Namespace $ns already exists"
            else
                kubectl create namespace "$ns"
                kubectl label namespace "$ns" system=fanz environment="$ENVIRONMENT" region="$REGION"
                success "Created namespace: $ns"
            fi
        fi
    done
}

# Apply security headers ConfigMap
apply_security_headers() {
    log "Creating security headers ConfigMap..."
    
    local config_yaml=$(cat << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-headers
  namespace: fanz-core
  labels:
    system: fanz
data:
  X-Content-Type-Options: "nosniff"
  X-Frame-Options: "SAMEORIGIN"
  X-XSS-Protection: "1; mode=block"
  Strict-Transport-Security: "max-age=31536000; includeSubDomains"
  Referrer-Policy: "strict-origin-when-cross-origin"
  Content-Security-Policy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.fanz.media; style-src 'self' 'unsafe-inline' https://cdn.fanz.media; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https: wss: ws:; font-src 'self' https://cdn.fanz.media;"
EOF
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would create security headers ConfigMap"
    else
        echo "$config_yaml" | kubectl apply -f -
        success "Applied security headers ConfigMap"
    fi
}

# Deploy public load balancers
deploy_public_load_balancers() {
    log "Deploying public load balancers..."
    
    local lb_files=(
        "$K8S_DIR/load-balancers/public/boyfanz-public-lb.yaml"
        "$K8S_DIR/load-balancers/public/api-gateway-public-lb.yaml"
    )
    
    for file in "${lb_files[@]}"; do
        if [[ -f "$file" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log "[DRY RUN] Would apply: $(basename "$file")"
                kubectl apply -f "$file" --dry-run=client
            else
                log "Applying: $(basename "$file")"
                kubectl apply -f "$file"
                success "Applied: $(basename "$file")"
            fi
        else
            warning "File not found: $file"
        fi
    done
}

# Deploy private load balancers
deploy_private_load_balancers() {
    log "Deploying private load balancers..."
    
    local lb_files=(
        "$K8S_DIR/load-balancers/private/core-private-lb.yaml"
    )
    
    for file in "${lb_files[@]}"; do
        if [[ -f "$file" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log "[DRY RUN] Would apply: $(basename "$file")"
                kubectl apply -f "$file" --dry-run=client
            else
                log "Applying: $(basename "$file")"
                kubectl apply -f "$file"
                success "Applied: $(basename "$file")"
            fi
        else
            warning "File not found: $file"
        fi
    done
}

# Deploy media services load balancers
deploy_media_load_balancers() {
    log "Deploying media services load balancers..."
    
    local lb_files=(
        "$K8S_DIR/load-balancers/media/media-services-lb.yaml"
    )
    
    for file in "${lb_files[@]}"; do
        if [[ -f "$file" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log "[DRY RUN] Would apply: $(basename "$file")"
                kubectl apply -f "$file" --dry-run=client
            else
                log "Applying: $(basename "$file")"
                kubectl apply -f "$file"
                success "Applied: $(basename "$file")"
            fi
        else
            warning "File not found: $file"
        fi
    done
}

# Deploy ingress definitions
deploy_ingress() {
    log "Deploying ingress definitions..."
    
    local ingress_files=(
        "$K8S_DIR/ingress/brands/fanz-brands-ingress.yaml"
        "$K8S_DIR/ingress/core/fanz-core-ingress.yaml"
    )
    
    for file in "${ingress_files[@]}"; do
        if [[ -f "$file" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log "[DRY RUN] Would apply: $(basename "$file")"
                kubectl apply -f "$file" --dry-run=client
            else
                log "Applying: $(basename "$file")"
                kubectl apply -f "$file"
                success "Applied: $(basename "$file")"
            fi
        else
            warning "File not found: $file"
        fi
    done
}

# Wait for load balancers to be ready
wait_for_load_balancers() {
    log "Waiting for load balancers to be assigned external IPs..."
    
    local lb_services=(
        "ingress-nginx/boyfanz-public-lb"
        "apigw/fanz-api-gateway-public"
        "media/fanz-rtmp-ingest"
        "media/fanz-webrtc-turn"
        "auth/fanz-auth-sso-private"
        "vault/fanz-vault-private"
        "fanzdash/fanzdash-private"
    )
    
    for service in "${lb_services[@]}"; do
        local namespace="${service%/*}"
        local service_name="${service#*/}"
        
        if kubectl get namespace "$namespace" &> /dev/null && kubectl get service -n "$namespace" "$service_name" &> /dev/null; then
            log "Waiting for $service to get external IP..."
            if [[ "$DRY_RUN" != "true" ]]; then
                kubectl wait --for=condition=LoadBalancer -n "$namespace" service/"$service_name" --timeout=300s || {
                    warning "Timeout waiting for $service to get external IP"
                }
            fi
        else
            log "Service $service not found, skipping..."
        fi
    done
}

# Validate certificates
validate_certificates() {
    log "Validating TLS certificates..."
    
    local domains=(
        "boyfanz.com"
        "girlfanz.com"
        "pupfanz.com"
        "transfanz.com"
        "taboofanz.com"
        "daddiesfanz.com"
        "fanzunlimited.com"
        "api.fanzunlimited.com"
        "dash.fanzunlimited.com"
        "media.fanz.media"
        "vault.fanz.foundation"
        "ads.fanz.fans"
    )
    
    for domain in "${domains[@]}"; do
        if command -v dig &> /dev/null; then
            local ip
            ip=$(dig +short "$domain" | tail -n1)
            if [[ -n "$ip" && "$ip" != *"NXDOMAIN"* ]]; then
                success "DNS resolution for $domain: $ip"
            else
                warning "DNS resolution failed for $domain"
            fi
        fi
        
        if command -v openssl &> /dev/null && [[ "$domain" != *.foundation ]] && [[ "$domain" != dash.* ]]; then
            local cert_check
            cert_check=$(timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo "")
            if [[ -n "$cert_check" ]]; then
                success "TLS certificate found for $domain"
            else
                warning "TLS certificate validation failed for $domain"
            fi
        fi
    done
}

# Show status of load balancers
show_status() {
    log "FANZ Load Balancer Status Report"
    echo "================================="
    
    # Get all services with LoadBalancer type
    local services
    services=$(kubectl get services --all-namespaces -o json | jq -r '.items[] | select(.spec.type == "LoadBalancer") | "\(.metadata.namespace)/\(.metadata.name)"')
    
    if [[ -z "$services" ]]; then
        warning "No LoadBalancer services found"
        return
    fi
    
    printf "%-30s %-20s %-15s %-20s\n" "SERVICE" "NAMESPACE" "EXTERNAL-IP" "STATUS"
    echo "---------------------------------------------------------------------------------"
    
    while IFS= read -r service; do
        if [[ -n "$service" ]]; then
            local namespace="${service%/*}"
            local service_name="${service#*/}"
            local external_ip
            local status
            
            external_ip=$(kubectl get service -n "$namespace" "$service_name" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
            
            if [[ "$external_ip" == "pending" || -z "$external_ip" ]]; then
                status="⏳ Pending"
                external_ip="<pending>"
            else
                status="✅ Ready"
            fi
            
            printf "%-30s %-20s %-15s %-20s\n" "$service_name" "$namespace" "$external_ip" "$status"
        fi
    done <<< "$services"
    
    echo ""
    log "Ingress Status:"
    kubectl get ingress --all-namespaces -o wide 2>/dev/null || warning "No ingresses found"
}

# Cleanup function (DANGEROUS)
cleanup_load_balancers() {
    log "⚠️  WARNING: This will delete ALL FANZ load balancers!"
    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would delete all FANZ load balancers and ingresses"
        return
    fi
    
    read -p "Are you sure you want to delete all FANZ load balancers? Type 'DELETE' to confirm: " -r
    if [[ $REPLY != "DELETE" ]]; then
        log "Cleanup cancelled"
        return
    fi
    
    log "Deleting ingresses..."
    kubectl delete ingress --all-namespaces -l system=fanz || true
    
    log "Deleting services..."
    kubectl delete service --all-namespaces -l system=fanz,type=LoadBalancer || true
    
    warning "Load balancers deleted. DNS entries and certificates may need manual cleanup."
}

# Main deployment function
deploy_all() {
    log "🚀 Starting FANZ Load Balancer Deployment"
    log "Environment: $ENVIRONMENT"
    log "Region: $REGION"
    log "Dry Run: $DRY_RUN"
    
    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        validate_prerequisites
    fi
    
    create_namespaces
    apply_security_headers
    
    deploy_public_load_balancers
    deploy_private_load_balancers
    deploy_media_load_balancers
    deploy_ingress
    
    if [[ "$DRY_RUN" != "true" ]]; then
        wait_for_load_balancers
        validate_certificates
    fi
    
    show_status
    
    success "🎉 FANZ Load Balancer deployment completed!"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        log ""
        log "Next Steps:"
        log "1. Update DNS records to point to the new load balancer IPs"
        log "2. Upload SSL certificates to DigitalOcean"
        log "3. Configure FanzDash to manage the load balancers"
        log "4. Set up monitoring and alerting"
        log "5. Test all endpoints and health checks"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --region)
            REGION="$2" 
            shift 2
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        deploy-all)
            COMMAND="deploy-all"
            shift
            ;;
        deploy-public)
            COMMAND="deploy-public"
            shift
            ;;
        deploy-private)
            COMMAND="deploy-private"
            shift
            ;;
        deploy-media)
            COMMAND="deploy-media"
            shift
            ;;
        deploy-ingress)
            COMMAND="deploy-ingress"
            shift
            ;;
        validate)
            COMMAND="validate"
            shift
            ;;
        cleanup)
            COMMAND="cleanup"
            shift
            ;;
        status)
            COMMAND="status"
            shift
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Set default command if none specified
COMMAND=${COMMAND:-deploy-all}

# Execute command
case $COMMAND in
    deploy-all)
        deploy_all
        ;;
    deploy-public)
        validate_prerequisites
        create_namespaces
        deploy_public_load_balancers
        ;;
    deploy-private)
        validate_prerequisites
        create_namespaces
        deploy_private_load_balancers
        ;;
    deploy-media)
        validate_prerequisites
        create_namespaces
        deploy_media_load_balancers
        ;;
    deploy-ingress)
        validate_prerequisites
        create_namespaces
        deploy_ingress
        ;;
    validate)
        validate_prerequisites
        validate_certificates
        ;;
    cleanup)
        cleanup_load_balancers
        ;;
    status)
        show_status
        ;;
    *)
        error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
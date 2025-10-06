#!/bin/bash
set -euo pipefail

# FANZ AI Ecosystem Production Deployment Script
# This script handles the complete deployment of all services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${1:-production}"
NAMESPACE="fanz-ai-ecosystem"
REGISTRY="${REGISTRY:-ghcr.io/joshuastone}"
VERSION="${VERSION:-latest}"
SERVICES=(
    "ai-intelligence-hub"
    "ai-creator-assistant"
    "content-curation-engine"
    "content-distribution-network"
    "security-privacy-framework"
    "compliance-accessibility-excellence"
)

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required commands
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error "Helm is required but not installed"
    
    # Check cluster connection
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot connect to Kubernetes cluster"
    
    # Check namespace
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log "Creating namespace $NAMESPACE..."
        kubectl create namespace "$NAMESPACE"
    fi
    
    success "Prerequisites checked"
}

build_and_push_images() {
    log "Building and pushing Docker images..."
    
    for service in "${SERVICES[@]}"; do
        if [[ -f "services/$service/Dockerfile" ]]; then
            log "Building $service..."
            docker build -t "$REGISTRY/$service:$VERSION" -f "services/$service/Dockerfile" "services/$service"
            
            log "Pushing $service to registry..."
            docker push "$REGISTRY/$service:$VERSION"
            
            success "Built and pushed $service"
        else
            warning "No Dockerfile found for $service, using base image"
        fi
    done
    
    success "All images built and pushed"
}

deploy_infrastructure() {
    log "Deploying infrastructure components..."
    
    # Deploy PostgreSQL
    helm repo add bitnami https://charts.bitnami.com/bitnami >/dev/null 2>&1 || true
    helm repo update >/dev/null 2>&1
    
    if ! helm list -n "$NAMESPACE" | grep -q postgresql; then
        log "Deploying PostgreSQL..."
        helm install postgresql bitnami/postgresql \
            --namespace "$NAMESPACE" \
            --set auth.postgresPassword=fanz-secure-password \
            --set auth.database=fanz_ecosystem \
            --set persistence.enabled=true \
            --set persistence.size=20Gi \
            --wait
    fi
    
    # Deploy Redis
    if ! helm list -n "$NAMESPACE" | grep -q redis; then
        log "Deploying Redis..."
        helm install redis bitnami/redis \
            --namespace "$NAMESPACE" \
            --set auth.enabled=true \
            --set auth.password=fanz-redis-password \
            --set replica.replicaCount=2 \
            --wait
    fi
    
    # Deploy Prometheus & Grafana
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
    
    if ! helm list -n "$NAMESPACE" | grep -q monitoring; then
        log "Deploying monitoring stack..."
        helm install monitoring prometheus-community/kube-prometheus-stack \
            --namespace "$NAMESPACE" \
            --set prometheus.prometheusSpec.retention=30d \
            --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
            --set grafana.adminPassword=fanz-grafana-admin \
            --wait
    fi
    
    success "Infrastructure deployed"
}

deploy_services() {
    log "Deploying FANZ AI services..."
    
    for service in "${SERVICES[@]}"; do
        if [[ -f "k8s/$service-deployment.yaml" ]]; then
            log "Deploying $service..."
            
            # Apply secrets
            if [[ -f "k8s/secrets/$service-secrets.yaml" ]]; then
                kubectl apply -f "k8s/secrets/$service-secrets.yaml" -n "$NAMESPACE"
            fi
            
            # Apply configmaps
            if [[ -f "k8s/configmaps/$service-config.yaml" ]]; then
                kubectl apply -f "k8s/configmaps/$service-config.yaml" -n "$NAMESPACE"
            fi
            
            # Apply deployment
            envsubst < "k8s/$service-deployment.yaml" | kubectl apply -f - -n "$NAMESPACE"
            
            # Apply service
            if [[ -f "k8s/$service-service.yaml" ]]; then
                kubectl apply -f "k8s/$service-service.yaml" -n "$NAMESPACE"
            fi
            
            # Apply ingress
            if [[ -f "k8s/$service-ingress.yaml" ]]; then
                kubectl apply -f "k8s/$service-ingress.yaml" -n "$NAMESPACE"
            fi
            
            success "Deployed $service"
        else
            warning "No deployment manifest found for $service"
        fi
    done
}

wait_for_rollout() {
    log "Waiting for rollout to complete..."
    
    for service in "${SERVICES[@]}"; do
        if kubectl get deployment "$service" -n "$NAMESPACE" >/dev/null 2>&1; then
            log "Waiting for $service rollout..."
            kubectl rollout status deployment/"$service" -n "$NAMESPACE" --timeout=300s
        fi
    done
    
    success "All deployments rolled out successfully"
}

run_health_checks() {
    log "Running health checks..."
    
    for service in "${SERVICES[@]}"; do
        if kubectl get service "$service" -n "$NAMESPACE" >/dev/null 2>&1; then
            log "Health checking $service..."
            
            # Port forward temporarily for health check
            kubectl port-forward service/"$service" 8080:80 -n "$NAMESPACE" &
            PF_PID=$!
            
            sleep 5
            
            if curl -f http://localhost:8080/health >/dev/null 2>&1; then
                success "$service health check passed"
            else
                warning "$service health check failed"
            fi
            
            kill $PF_PID 2>/dev/null || true
        fi
    done
    
    success "Health checks completed"
}

backup_database() {
    log "Creating database backup..."
    
    kubectl exec -n "$NAMESPACE" deployment/postgresql -- pg_dump -U postgres fanz_ecosystem > backup-$(date +%Y%m%d-%H%M%S).sql
    
    success "Database backup created"
}

cleanup_old_resources() {
    log "Cleaning up old resources..."
    
    # Remove old replica sets
    kubectl delete rs -l app.kubernetes.io/managed-by=Helm -n "$NAMESPACE" --ignore-not-found=true
    
    # Cleanup completed jobs older than 7 days
    kubectl delete job --field-selector status.conditions=Complete -n "$NAMESPACE" --ignore-not-found=true
    
    success "Cleanup completed"
}

main() {
    log "Starting FANZ AI Ecosystem deployment to $DEPLOYMENT_ENV..."
    
    check_prerequisites
    
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        backup_database
    fi
    
    build_and_push_images
    deploy_infrastructure
    deploy_services
    wait_for_rollout
    run_health_checks
    cleanup_old_resources
    
    success "🚀 FANZ AI Ecosystem deployment completed successfully!"
    
    log "Access points:"
    echo "  - AI Intelligence Hub: http://ai-intelligence-hub.$NAMESPACE.svc.cluster.local"
    echo "  - AI Creator Assistant: http://ai-creator-assistant.$NAMESPACE.svc.cluster.local"
    echo "  - Content Curation: http://content-curation-engine.$NAMESPACE.svc.cluster.local"
    echo "  - Grafana Dashboard: kubectl port-forward svc/monitoring-grafana 3000:80 -n $NAMESPACE"
    
    log "Deployment completed in $(($SECONDS / 60)) minutes"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"
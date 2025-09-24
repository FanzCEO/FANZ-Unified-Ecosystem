#!/usr/bin/env bash
set -euo pipefail

echo "🎯 FANZ Warp Directive - Bootstrap Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prereqs() {
    log_info "Checking prerequisites..."
    
    command -v terraform >/dev/null 2>&1 || { log_error "terraform is required but not installed"; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed"; exit 1; }
    command -v helm >/dev/null 2>&1 || { log_error "helm is required but not installed"; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "aws cli is required but not installed"; exit 1; }
    
    log_success "All prerequisites found"
}

# Get environment variables
setup_env() {
    export AWS_REGION=${AWS_REGION:-us-east-1}
    export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
    export CLUSTER_NAME=${CLUSTER_NAME:-fz-prod-60a56503}
    export DOMAIN=${DOMAIN:-myfanz.network}
    
    log_info "Environment setup:"
    log_info "  AWS Region: ${AWS_REGION}"
    log_info "  Account ID: ${ACCOUNT_ID}"
    log_info "  Cluster: ${CLUSTER_NAME}"
    log_info "  Domain: ${DOMAIN}"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    cd "$(git rev-parse --show-toplevel)/terraform"
    
    terraform init -upgrade
    terraform workspace select production || terraform workspace new production
    
    # Skip apply if cluster already exists
    if terraform output cluster_name >/dev/null 2>&1; then
        log_success "Infrastructure already deployed"
        return 0
    fi
    
    terraform apply -var-file="environments/production.tfvars" -auto-approve
    log_success "Infrastructure deployed"
}

# Setup Kubernetes access
setup_kube_access() {
    log_info "Setting up Kubernetes access..."
    aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"
    
    # Wait for cluster to be ready
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
    log_success "Kubernetes access configured"
}

# Create namespaces
create_namespaces() {
    log_info "Creating namespaces..."
    
    namespaces=("argocd" "kyverno" "cert-manager" "observability")
    for ns in "${namespaces[@]}"; do
        kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
        log_success "Namespace $ns ready"
    done
}

# Deploy core platform components
deploy_core_components() {
    log_info "Deploying core platform components..."
    cd "$(git rev-parse --show-toplevel)"
    
    # Add Helm repositories
    log_info "Adding Helm repositories..."
    helm repo add argo https://argoproj.github.io/argo-helm
    helm repo add kyverno https://kyverno.github.io/kyverno/
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Deploy ArgoCD
    log_info "Deploying ArgoCD..."
    helm upgrade --install argocd argo/argo-cd \
        --namespace argocd \
        --values k8s/argocd/values-argocd.yaml \
        --wait --timeout=10m
    log_success "ArgoCD deployed"
    
    # Deploy Kyverno
    log_info "Deploying Kyverno..."
    helm upgrade --install kyverno kyverno/kyverno \
        --namespace kyverno \
        --values k8s/kyverno/values-kyverno.yaml \
        --wait --timeout=10m
    log_success "Kyverno deployed"
    
    # Apply Kyverno policies
    kubectl apply -f k8s/kyverno/policies/fun-autofix-safe.yaml
    log_success "Auto-fix policies applied"
    
    # Deploy Argo Rollouts
    log_info "Deploying Argo Rollouts..."
    helm upgrade --install argo-rollouts argo/argo-rollouts \
        --namespace argocd \
        --values k8s/rollouts/values-rollouts.yaml \
        --wait --timeout=5m
    log_success "Argo Rollouts deployed"
    
    # Apply analysis template
    kubectl apply -f k8s/rollouts/analysis-template-amp.yaml
    log_success "Rollout analysis template applied"
}

# Deploy golden API
deploy_golden_api() {
    log_info "Deploying Golden API template..."
    cd "$(git rev-parse --show-toplevel)/services/golden-api"
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names golden-api >/dev/null 2>&1 || \
        aws ecr create-repository --repository-name golden-api >/dev/null
    
    # Build and push image
    log_info "Building Golden API Docker image..."
    cd app
    docker build -t golden-api:latest .
    
    # Tag and push to ECR
    docker tag golden-api:latest "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/golden-api:v0.1.0"
    
    aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    docker push "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/golden-api:v0.1.0"
    
    # Deploy with Helm
    cd ../helm
    helm upgrade --install golden-api ./golden-api \
        --namespace default \
        --set image.repository="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/golden-api" \
        --set image.tag="v0.1.0" \
        --set ingress.host="api.${DOMAIN}" \
        --wait --timeout=5m
    
    log_success "Golden API deployed"
}

# Show status
show_status() {
    log_info "🎯 FANZ Warp Directive Status:"
    echo
    
    log_info "Infrastructure:"
    kubectl get nodes -o wide
    echo
    
    log_info "Core Components:"
    kubectl get pods -n argocd | grep -E "(NAME|Running)"
    kubectl get pods -n kyverno | grep -E "(NAME|Running)"
    echo
    
    log_info "Policies:"
    kubectl get clusterpolicy
    echo
    
    log_info "Golden API:"
    kubectl get rollout -n default
    kubectl get svc -n default | grep golden-api
    echo
    
    log_success "🚀 FANZ Warp Directive is now live!"
    echo
    log_info "Next steps:"
    echo "  1. Access ArgoCD: kubectl port-forward svc/argocd-server -n argocd 8080:443"
    echo "  2. Get ArgoCD password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
    echo "  3. Test Golden API: curl http://api.${DOMAIN}/healthz"
    echo "  4. Set up Slack webhook: Add SLACK_WEBHOOK_URL secret to GitHub repo"
    echo
}

# Main execution
main() {
    check_prereqs
    setup_env
    deploy_infrastructure
    setup_kube_access
    create_namespaces
    deploy_core_components
    
    # Skip golden API if Docker is not available
    if command -v docker >/dev/null 2>&1; then
        deploy_golden_api
    else
        log_warning "Docker not found - skipping Golden API deployment"
    fi
    
    show_status
}

# Error handling
trap 'log_error "Script failed at line $LINENO"' ERR

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
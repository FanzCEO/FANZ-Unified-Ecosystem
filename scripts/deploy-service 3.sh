#!/usr/bin/env bash
set -euo pipefail

# Deploy new microservice to FANZ Warp Directive platform
SERVICE_NAME="${1:-}"
SERVICE_VERSION="${2:-v0.1.0}"
NAMESPACE="${3:-default}"

if [[ -z "$SERVICE_NAME" ]]; then
    echo "Usage: $0 <service-name> [version] [namespace]"
    echo "Example: $0 user-api v1.2.3 fanz-apis"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Environment setup
export AWS_REGION=${AWS_REGION:-us-east-1}
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

log_info "Deploying service: $SERVICE_NAME ($SERVICE_VERSION) to namespace: $NAMESPACE"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Create ECR repository if needed
log_info "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names "$SERVICE_NAME" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$SERVICE_NAME" >/dev/null

# Build and push if Dockerfile exists
if [[ -f "services/$SERVICE_NAME/app/Dockerfile" ]]; then
    log_info "Building and pushing Docker image..."
    cd "services/$SERVICE_NAME/app"
    
    docker build -t "$SERVICE_NAME:latest" .
    docker tag "$SERVICE_NAME:latest" "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$SERVICE_VERSION"
    
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    docker push "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME:$SERVICE_VERSION"
    
    cd - >/dev/null
fi

# Deploy with Helm if chart exists
if [[ -d "services/$SERVICE_NAME/helm/$SERVICE_NAME" ]]; then
    log_info "Deploying with Helm chart..."
    helm upgrade --install "$SERVICE_NAME" "services/$SERVICE_NAME/helm/$SERVICE_NAME" \
        --namespace "$NAMESPACE" \
        --set image.repository="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SERVICE_NAME" \
        --set image.tag="$SERVICE_VERSION" \
        --wait --timeout=5m
fi

# Show status
log_success "Service $SERVICE_NAME deployed successfully!"
kubectl get rollout,svc,ingress -n "$NAMESPACE" -l app="$SERVICE_NAME" 2>/dev/null || true
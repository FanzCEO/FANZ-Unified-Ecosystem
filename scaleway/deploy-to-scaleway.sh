#!/bin/bash

# FANZ Unified Ecosystem - Scaleway Deployment Script
# This script deploys the entire FANZ ecosystem to Scaleway infrastructure
# 
# Prerequisites:
# - Scaleway CLI installed and configured
# - Docker installed
# - Terraform installed
# - kubectl installed
# - Helm installed

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="fanz-ecosystem"
ENVIRONMENT="${ENVIRONMENT:-production}"
REGION="${REGION:-fr-par}"
ZONE="${ZONE:-fr-par-1}"
NAMESPACE="fanz-${ENVIRONMENT}"

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform"
K8S_DIR="${SCRIPT_DIR}/k8s"
DOCKER_DIR="${SCRIPT_DIR}/docker"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v scw &> /dev/null; then
        missing_tools+=("scaleway-cli")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v terraform &> /dev/null; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
    fi
    
    # Check Scaleway CLI configuration
    if ! scw config get access-key &> /dev/null; then
        error "Scaleway CLI not configured. Run 'scw init' first."
    fi
    
    success "All prerequisites met"
}

# Create secrets file
create_secrets() {
    log "Creating secrets file..."
    
    local secrets_file="${SCRIPT_DIR}/secrets.tfvars"
    
    if [ ! -f "${secrets_file}" ]; then
        cat > "${secrets_file}" << EOF
# FANZ Secrets Configuration
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

postgres_password = "$(openssl rand -base64 32)"
redis_password = "$(openssl rand -base64 32)"
jwt_secret = "$(openssl rand -base64 64)"
openai_api_key = "${OPENAI_API_KEY:-placeholder-key}"
EOF
        
        chmod 600 "${secrets_file}"
        success "Secrets file created at ${secrets_file}"
        warning "Please update the secrets file with your actual API keys"
    else
        success "Secrets file already exists"
    fi
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log "Deploying infrastructure with Terraform..."
    
    cd "${TERRAFORM_DIR}"
    
    # Initialize Terraform
    terraform init -upgrade
    
    # Plan deployment
    terraform plan \
        -var-file="terraform.tfvars" \
        -var-file="secrets.tfvars" \
        -out="tfplan"
    
    # Apply deployment
    terraform apply -auto-approve "tfplan"
    
    # Save outputs
    terraform output -json > "${SCRIPT_DIR}/terraform-outputs.json"
    
    success "Infrastructure deployed successfully"
    
    cd "${ROOT_DIR}"
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Get registry endpoint from Terraform output
    local registry_endpoint
    registry_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw registry_endpoint)
    
    # Build main application image
    log "Building FANZ main application image..."
    docker build \
        -f "${DOCKER_DIR}/Dockerfile" \
        -t "${registry_endpoint}/fanz-app:latest" \
        -t "${registry_endpoint}/fanz-app:v$(date +%Y%m%d-%H%M%S)" \
        "${ROOT_DIR}"
    
    # Login to Scaleway registry
    scw registry login
    
    # Push images
    log "Pushing images to registry..."
    docker push "${registry_endpoint}/fanz-app:latest"
    docker push "${registry_endpoint}/fanz-app:v$(date +%Y%m%d-%H%M%S)"
    
    success "Docker images built and pushed successfully"
}

# Configure kubectl
configure_kubectl() {
    log "Configuring kubectl..."
    
    # Get kubeconfig from Terraform output
    local kubeconfig_path="${HOME}/.kube/config-fanz-${ENVIRONMENT}"
    terraform -chdir="${TERRAFORM_DIR}" output -raw cluster_kubeconfig > "${kubeconfig_path}"
    
    # Set KUBECONFIG
    export KUBECONFIG="${kubeconfig_path}"
    
    # Test connection
    kubectl cluster-info
    
    success "kubectl configured successfully"
}

# Create Kubernetes namespace and secrets
setup_kubernetes_resources() {
    log "Setting up Kubernetes resources..."
    
    # Create namespace
    kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    log "Creating Kubernetes secrets..."
    
    local database_url postgres_endpoint redis_endpoint
    database_url=$(terraform -chdir="${TERRAFORM_DIR}" output -raw postgres_endpoint)
    postgres_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw postgres_endpoint)
    redis_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw redis_endpoint)
    
    # Read secrets from Terraform variables
    local postgres_password redis_password jwt_secret
    postgres_password=$(grep 'postgres_password' "${TERRAFORM_DIR}/secrets.tfvars" | cut -d'"' -f2)
    redis_password=$(grep 'redis_password' "${TERRAFORM_DIR}/secrets.tfvars" | cut -d'"' -f2)
    jwt_secret=$(grep 'jwt_secret' "${TERRAFORM_DIR}/secrets.tfvars" | cut -d'"' -f2)
    openai_api_key=$(grep 'openai_api_key' "${TERRAFORM_DIR}/secrets.tfvars" | cut -d'"' -f2)
    
    # Get Scaleway credentials
    local scaleway_access_key scaleway_secret_key
    scaleway_access_key=$(scw config get access-key)
    scaleway_secret_key=$(scw config get secret-key)
    
    kubectl create secret generic fanz-secrets \
        --namespace="${NAMESPACE}" \
        --from-literal="database-url=postgresql://fanz_production_admin:${postgres_password}@${postgres_endpoint}:5432/fanz" \
        --from-literal="redis-url=redis://fanz_redis_prod:${redis_password}@${redis_endpoint}:6379" \
        --from-literal="jwt-secret=${jwt_secret}" \
        --from-literal="openai-api-key=${openai_api_key}" \
        --from-literal="scaleway-access-key=${scaleway_access_key}" \
        --from-literal="scaleway-secret-key=${scaleway_secret_key}" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    success "Kubernetes resources created successfully"
}

# Deploy application to Kubernetes
deploy_application() {
    log "Deploying FANZ application to Kubernetes..."
    
    # Update deployment manifest with correct namespace
    sed "s/namespace: fanz-production/namespace: ${NAMESPACE}/g" "${K8S_DIR}/fanz-app-deployment.yaml" > "/tmp/fanz-app-deployment.yaml"
    
    # Update image reference
    local registry_endpoint
    registry_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw registry_endpoint)
    sed -i.bak "s|rg\.fr-par\.scw\.cloud/fanz-ecosystem-registry|${registry_endpoint}|g" "/tmp/fanz-app-deployment.yaml"
    
    # Apply deployment
    kubectl apply -f "/tmp/fanz-app-deployment.yaml"
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/fanz-app -n "${NAMESPACE}"
    
    success "Application deployed successfully"
}

# Install and configure ingress controller
setup_ingress_controller() {
    log "Setting up ingress controller..."
    
    # Add NGINX ingress controller Helm repo
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Install NGINX ingress controller
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.service.externalTrafficPolicy=Local \
        --set controller.config.proxy-body-size="50m" \
        --set controller.config.proxy-read-timeout="300" \
        --set controller.config.proxy-send-timeout="300"
    
    # Wait for ingress controller to be ready
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    success "Ingress controller setup complete"
}

# Setup SSL certificates with cert-manager
setup_ssl_certificates() {
    log "Setting up SSL certificates with cert-manager..."
    
    # Add cert-manager Helm repo
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.2 \
        --set installCRDs=true
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s
    
    # Create ClusterIssuer for Let's Encrypt
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@fanz.network
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    
    success "SSL certificates setup complete"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring stack..."
    
    # Add Prometheus community Helm repo
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Install kube-prometheus-stack
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set grafana.adminPassword="$(openssl rand -base64 12)" \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
    
    success "Monitoring stack deployed"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check if pods are running
    kubectl get pods -n "${NAMESPACE}"
    
    # Check if services are accessible
    local service_ip
    service_ip=$(kubectl get service fanz-app-service -n "${NAMESPACE}" -o jsonpath='{.spec.clusterIP}')
    
    # Port forward for health check
    kubectl port-forward service/fanz-app-service 8080:80 -n "${NAMESPACE}" &
    local port_forward_pid=$!
    
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:8080/api/health; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
    
    # Clean up port forward
    kill $port_forward_pid
}

# Get deployment information
show_deployment_info() {
    log "Deployment Information"
    echo -e "${CYAN}================================${NC}"
    
    # Get load balancer IP
    local lb_ip
    lb_ip=$(terraform -chdir="${TERRAFORM_DIR}" output -raw load_balancer_ip)
    echo -e "${GREEN}Load Balancer IP:${NC} ${lb_ip}"
    
    # Get ingress IP
    local ingress_ip
    ingress_ip=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
    echo -e "${GREEN}Ingress IP:${NC} ${ingress_ip}"
    
    # Show domains
    echo -e "${GREEN}Domains:${NC}"
    echo "  - https://fanz.network"
    echo "  - https://boyfanz.com"
    echo "  - https://girlfanz.com"
    echo "  - https://pupfanz.com"
    echo "  - https://taboofanz.com"
    echo "  - https://api.fanz.network"
    
    # Database info
    local postgres_endpoint
    postgres_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw postgres_endpoint)
    echo -e "${GREEN}Database:${NC} ${postgres_endpoint}"
    
    # Registry info
    local registry_endpoint
    registry_endpoint=$(terraform -chdir="${TERRAFORM_DIR}" output -raw registry_endpoint)
    echo -e "${GREEN}Registry:${NC} ${registry_endpoint}"
    
    echo -e "${CYAN}================================${NC}"
    
    success "FANZ Ecosystem deployed successfully on Scaleway!"
}

# Cleanup function
cleanup() {
    if [ -f "/tmp/fanz-app-deployment.yaml" ]; then
        rm -f "/tmp/fanz-app-deployment.yaml"
        rm -f "/tmp/fanz-app-deployment.yaml.bak"
    fi
}

trap cleanup EXIT

# Main deployment function
main() {
    echo -e "${PURPLE}"
    cat << "EOF"
🌟 ====================================
   FANZ UNIFIED ECOSYSTEM DEPLOYMENT
   Scaleway Infrastructure
🌟 ====================================
EOF
    echo -e "${NC}"
    
    log "Starting FANZ ecosystem deployment on Scaleway..."
    log "Environment: ${ENVIRONMENT}"
    log "Region: ${REGION}"
    log "Zone: ${ZONE}"
    
    check_prerequisites
    create_secrets
    deploy_infrastructure
    build_and_push_images
    configure_kubectl
    setup_kubernetes_resources
    setup_ingress_controller
    setup_ssl_certificates
    deploy_application
    setup_monitoring
    run_health_checks
    show_deployment_info
    
    echo -e "${GREEN}"
    cat << "EOF"
🚀 ====================================
   DEPLOYMENT COMPLETED SUCCESSFULLY!
🚀 ====================================
EOF
    echo -e "${NC}"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy"|"")
        main
        ;;
    "destroy")
        log "Destroying FANZ infrastructure..."
        terraform -chdir="${TERRAFORM_DIR}" destroy -auto-approve
        success "Infrastructure destroyed"
        ;;
    "status")
        kubectl get all -n "${NAMESPACE}"
        ;;
    "logs")
        kubectl logs -f -l app=fanz-app -n "${NAMESPACE}"
        ;;
    *)
        echo "Usage: $0 [deploy|destroy|status|logs]"
        exit 1
        ;;
esac
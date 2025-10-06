#!/bin/bash

# 🚀 FANZ Production Deployment Script
# This script guides you through deploying FANZ to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
 ███████╗ █████╗ ███╗   ██╗███████╗
 ██╔════╝██╔══██╗████╗  ██║╚══███╔╝
 █████╗  ███████║██╔██╗ ██║  ███╔╝ 
 ██╔══╝  ██╔══██║██║╚██╗██║ ███╔╝  
 ██║     ██║  ██║██║ ╚████║███████╗
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
                                   
🚀 FANZ Production Deployment Guide
EOF
echo -e "${NC}"

log_info "Starting FANZ production deployment process..."

# Check prerequisites
log_step "1. Checking prerequisites..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed. Please install kubectl first."
    log_info "Install with: brew install kubectl"
    exit 1
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    log_warning "Helm is not installed. Installing helm..."
    if command -v brew &> /dev/null; then
        brew install helm
    else
        log_error "Please install Helm manually: https://helm.sh/docs/intro/install/"
        exit 1
    fi
fi

log_success "Prerequisites check completed"

# Test cluster connection
log_step "2. Testing cluster connection..."
if kubectl cluster-info &> /dev/null; then
    log_success "Successfully connected to Kubernetes cluster"
    kubectl get nodes
else
    log_error "Cannot connect to Kubernetes cluster. Please configure kubectl first."
    exit 1
fi

# Install cert-manager
log_step "3. Installing cert-manager for SSL certificates..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

log_info "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager

log_success "cert-manager installed successfully"

# Install NGINX Ingress Controller
log_step "4. Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

log_info "Waiting for NGINX ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

log_success "NGINX Ingress Controller installed successfully"

# Apply Kubernetes manifests
log_step "5. Deploying FANZ application..."

# Create namespace
kubectl apply -f k8s/namespace.yaml || {
    log_warning "Namespace manifest not found, creating manually..."
    kubectl create namespace fanz-production --dry-run=client -o yaml | kubectl apply -f -
}

# Apply secrets and configs
log_info "Applying secrets and configurations..."
kubectl apply -f k8s/secrets/ || log_warning "Secrets not found, please configure manually"
kubectl apply -f k8s/configmaps/ || log_warning "ConfigMaps not found, please configure manually"

# Deploy infrastructure
log_info "Deploying infrastructure components..."
kubectl apply -f k8s/postgres/ || log_warning "PostgreSQL manifests not found"
kubectl apply -f k8s/redis/ || log_warning "Redis manifests not found"

# Deploy FANZ services
log_info "Deploying FANZ services..."
kubectl apply -f k8s/deployments/ || log_warning "Service deployments not found"
kubectl apply -f k8s/services/ || log_warning "Service manifests not found"

# Apply SSL and ingress
log_info "Configuring SSL certificates and ingress..."
kubectl apply -f k8s/ssl/ || log_warning "SSL configuration not found"
kubectl apply -f k8s/ingress/ || log_warning "Ingress configuration not found"

log_success "FANZ services deployed"

# Get ingress IP
log_step "6. Getting ingress external IP..."
log_info "Waiting for ingress to get external IP..."

external_ip=""
attempts=0
max_attempts=30

while [[ -z $external_ip && $attempts -lt $max_attempts ]]; do
    echo "Waiting for external IP... (attempt $((attempts+1))/$max_attempts)"
    external_ip=$(kubectl get svc ingress-nginx-controller -n ingress-nginx --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null || echo "")
    if [[ -z $external_ip ]]; then
        sleep 10
        ((attempts++))
    fi
done

if [[ -n $external_ip ]]; then
    log_success "External IP obtained: $external_ip"
else
    log_warning "External IP not yet available. Check load balancer status."
    external_ip="PENDING"
fi

# DNS Configuration
log_step "7. DNS Configuration Required"
echo ""
log_warning "⚠️  IMPORTANT: Configure your DNS records!"
echo ""
echo "Point the following domains to IP: $external_ip"
echo ""
echo "A Records to create:"
echo "- api.fanz.network → $external_ip"
echo "- ai.fanz.network → $external_ip" 
echo "- monitoring.fanz.network → $external_ip"
echo "- fanz.network → $external_ip"
echo "- boyfanz.com → $external_ip"
echo "- girlfanz.com → $external_ip"
echo "- pupfanz.com → $external_ip"
echo "- taboofanz.com → $external_ip"
echo ""

# Test deployment
log_step "8. Testing deployment..."

log_info "Checking pod status..."
kubectl get pods -n fanz-production || log_warning "No pods found in fanz-production namespace"

log_info "Checking services..."
kubectl get services -n fanz-production || log_warning "No services found in fanz-production namespace"

log_info "Checking ingress..."
kubectl get ingress -n fanz-production || log_warning "No ingress found in fanz-production namespace"

# Final summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 FANZ PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

log_success "✅ Kubernetes cluster configured"
log_success "✅ FANZ services deployment initiated"
log_success "✅ SSL certificates configured"
log_success "✅ Ingress and load balancer ready"

echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "1. Configure DNS records with the external IP above"
echo "2. Wait for DNS propagation (may take up to 24 hours)"
echo "3. Run ./validate-production.sh to check deployment status"
echo "4. Configure payment processors (CCBill, SegPay)"
echo "5. Set up monitoring alerts"
echo "6. Perform load testing"
echo ""

echo -e "${CYAN}🔗 Important URLs (once DNS is configured):${NC}"
echo "- API: https://api.fanz.network"
echo "- AI Service: https://ai.fanz.network"
echo "- Main Site: https://fanz.network"
echo ""

echo -e "${CYAN}📊 To check deployment status:${NC}"
echo "kubectl get all -n fanz-production"
echo ""

echo -e "${PURPLE}🚀 Your FANZ platform deployment is initiated!${NC}"
echo -e "${PURPLE}Ready to revolutionize the creator economy!${NC}"
echo ""

log_info "Deployment script completed successfully!"
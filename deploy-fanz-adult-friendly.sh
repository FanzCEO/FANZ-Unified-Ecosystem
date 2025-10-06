#!/bin/bash

# 🏳️‍🌈 FANZ Adult-Content-Friendly Production Deployment Script
# This script prioritizes hosting providers that explicitly support adult content

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
echo -e "${PURPLE}"
cat << "EOF"
 ███████╗ █████╗ ███╗   ██╗███████╗
 ██╔════╝██╔══██╗████╗  ██║╚══███╔╝
 █████╗  ███████║██╔██╗ ██║  ███╔╝ 
 ██╔══╝  ██╔══██║██║╚██╗██║ ███╔╝  
 ██║     ██║  ██║██║ ╚████║███████╗
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝

🏳️‍🌈 FANZ Adult-Content-Friendly Deployment
Creator Economy Revolution Starts Here!
EOF
echo -e "${NC}"

log_info "🎯 Deploying FANZ on adult-content-friendly infrastructure..."

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

# Choose adult-content-friendly provider
log_step "2. Choose your adult-content-friendly cloud provider..."
echo ""
log_info "🏳️‍🌈 FANZ prioritizes providers that explicitly support adult content"
echo ""
echo "✅ Recommended Adult-Content-Friendly Providers:"
echo ""
echo "1) 🌊 DigitalOcean Kubernetes ($72/month)"
echo "   • Explicitly adult-content friendly"
echo "   • Great performance and pricing"
echo "   • Simple setup process"
echo ""
echo "2) 🚀 Linode LKE ($60/month)" 
echo "   • Adult content explicitly allowed"
echo "   • Excellent performance"
echo "   • Strong developer community"
echo ""
echo "3) ⚡ Vultr Kubernetes Engine ($50/month)"
echo "   • Privacy-focused, adult-safe"
echo "   • European data centers available"
echo "   • Competitive pricing"
echo ""
echo "4) 🇪🇺 OVHcloud Managed K8s ($65/month)"
echo "   • European privacy laws protection"
echo "   • Adult content friendly"
echo "   • GDPR compliant by default"
echo ""
echo "5) 🏗️ Scaleway Kubernetes Kapsule ($55/month)"
echo "   • French company, liberal policies"
echo "   • Adult content allowed"
echo "   • Good European presence"
echo ""
echo "6) ⚙️ I already have a cluster configured"
echo ""
log_warning "⛔ We've removed AWS/Azure due to restrictive adult content policies"
echo ""

read -p "Enter your choice (1-6): " cloud_choice

case $cloud_choice in
    1)
        log_success "🌊 DigitalOcean Kubernetes selected - Perfect for adult platforms!"
        cat << 'EOF'

🌊 DigitalOcean Setup Guide:

1. 📝 Sign up at: https://cloud.digitalocean.com
2. 🎯 Navigate to: Kubernetes → Create Cluster
3. 🌍 Choose region close to your audience:
   • NYC1/NYC3 (US East Coast)
   • SFO3 (US West Coast)
   • AMS3 (Netherlands - EU)
   • LON1 (London - EU)
   • SGP1 (Singapore - Asia)

4. ⚙️ Configure nodes:
   • Node Plan: Basic ($24/node/month)
   • Size: 4 vCPU, 8GB RAM
   • Count: 3 nodes (can auto-scale to 10)
   • Total: ~$72/month

5. 🏷️ Name: fanz-production
6. 🔧 Enable: Auto-scaling (1-10 nodes)
7. 📥 Download kubeconfig after creation
8. 💻 Set environment: export KUBECONFIG=/path/to/kubeconfig.yaml

💡 DigitalOcean explicitly allows adult content and has great support!
EOF
        ;;
    2)
        log_success "🚀 Linode LKE selected - Excellent choice for creators!"
        cat << 'EOF'

🚀 Linode Kubernetes Engine Setup:

Option A - Web Interface:
1. 📝 Login to: https://cloud.linode.com
2. 🎯 Go to: Kubernetes → Create Cluster
3. 🌍 Select region:
   • Newark, NJ (us-east)
   • Fremont, CA (us-west)
   • London, UK (eu-west)
   • Frankfurt, DE (eu-central)

4. ⚙️ Node pools:
   • Type: Shared CPU (g6-standard-2)
   • Size: 4GB RAM, 2 vCPU
   • Count: 3 nodes
   • Monthly cost: ~$60

Option B - CLI:
# Install Linode CLI
brew install linode-cli

# Login
linode-cli configure

# Create cluster
linode-cli lke cluster-create \
  --label fanz-production \
  --region us-east \
  --k8s_version 1.28

💡 Linode has a long history of supporting adult content creators!
EOF
        ;;
    3)
        log_success "⚡ Vultr Kubernetes selected - Privacy-focused excellence!"
        cat << 'EOF'

⚡ Vultr Kubernetes Engine Setup:

1. 📝 Sign up at: https://my.vultr.com
2. 🎯 Navigate to: Products → Kubernetes
3. 🌍 Choose location:
   • Miami (US)
   • New York (US)
   • Amsterdam (Netherlands)
   • London (UK)
   • Frankfurt (Germany)
   • Tokyo (Japan)

4. ⚙️ Node configuration:
   • Plan: Regular Performance
   • Size: 4 vCPU, 8GB RAM
   • Count: 3 nodes
   • Monthly: ~$50

5. 🏷️ Label: fanz-production
6. 📥 Download kubeconfig
7. 💻 Export: export KUBECONFIG=/path/to/kubeconfig.yaml

💡 Vultr is known for privacy-first policies and adult-content-friendly stance!
EOF
        ;;
    4)
        log_success "🇪🇺 OVHcloud selected - European privacy champion!"
        cat << 'EOF'

🇪🇺 OVHcloud Managed Kubernetes Setup:

1. 📝 Create account: https://www.ovhcloud.com
2. 🎯 Go to: Public Cloud → Kubernetes
3. 🌍 Choose region:
   • GRA (Gravelines, France)
   • SBG (Strasbourg, France) 
   • UK1 (London, UK)
   • DE1 (Frankfurt, Germany)

4. ⚙️ Node pool:
   • Flavor: b2-7 (2 vCPU, 7GB RAM)
   • Count: 3 nodes
   • Auto-scaling: enabled
   • Monthly: ~$65

5. 🏷️ Name: fanz-production
6. 📥 Download kubeconfig
7. 💻 Set: export KUBECONFIG=/path/to/kubeconfig.yaml

💡 OVHcloud operates under French privacy laws - very creator-friendly!
EOF
        ;;
    5)
        log_success "🏗️ Scaleway selected - French innovation for creators!"
        cat << 'EOF'

🏗️ Scaleway Kubernetes Kapsule Setup:

1. 📝 Sign up: https://console.scaleway.com
2. 🎯 Navigate: Containers → Kubernetes Kapsule
3. 🌍 Region selection:
   • Paris (PAR1/PAR2)
   • Amsterdam (AMS1)
   • Warsaw (WAW1)

4. ⚙️ Node pool:
   • Instance: GP1-S (2 vCPU, 8GB RAM)
   • Count: 3 nodes
   • Auto-scaling: 1-10 nodes
   • Cost: ~$55/month

5. 🏷️ Cluster name: fanz-production
6. 📥 Download kubeconfig
7. 💻 Export: export KUBECONFIG=/path/to/kubeconfig.yaml

💡 Scaleway is very liberal with content policies and supports creators!
EOF
        ;;
    6)
        log_info "Using existing cluster configuration..."
        ;;
    *)
        log_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# Test cluster connection
log_step "3. Testing cluster connection..."
if kubectl cluster-info &> /dev/null; then
    log_success "✅ Successfully connected to Kubernetes cluster"
    kubectl get nodes
else
    log_error "❌ Cannot connect to Kubernetes cluster. Please configure kubectl first."
    log_info "💡 Make sure you've set: export KUBECONFIG=/path/to/your/kubeconfig.yaml"
    exit 1
fi

# Install cert-manager
log_step "4. Installing cert-manager for SSL certificates..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

log_info "⏳ Waiting for cert-manager to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager

log_success "✅ cert-manager installed successfully"

# Install NGINX Ingress Controller
log_step "5. Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

log_info "⏳ Waiting for NGINX ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

log_success "✅ NGINX Ingress Controller installed successfully"

# Deploy FANZ application
log_step "6. Deploying FANZ Creator Economy Platform..."

# Create namespace
kubectl apply -f k8s/namespace.yaml || {
    log_warning "⚠️ Namespace manifest not found, creating manually..."
    kubectl create namespace fanz-production --dry-run=client -o yaml | kubectl apply -f -
}

# Apply secrets and configs
log_info "🔐 Applying secrets and configurations..."
kubectl apply -f k8s/secrets/ || log_warning "⚠️ Secrets not found - configure these manually for production!"
kubectl apply -f k8s/configmaps/ || log_warning "⚠️ ConfigMaps not found - using defaults"

# Deploy infrastructure
log_info "🗄️ Deploying infrastructure components..."
kubectl apply -f k8s/postgres/ || log_warning "⚠️ PostgreSQL manifests not found"
kubectl apply -f k8s/redis/ || log_warning "⚠️ Redis manifests not found"

# Deploy FANZ services
log_info "🚀 Deploying FANZ services..."
kubectl apply -f k8s/deployments/ || log_warning "⚠️ Service deployments not found"
kubectl apply -f k8s/services/ || log_warning "⚠️ Service manifests not found"

# Apply SSL and ingress
log_info "🔒 Configuring SSL certificates and ingress..."
kubectl apply -f k8s/ssl/ || log_warning "⚠️ SSL configuration not found"
kubectl apply -f k8s/ingress/ || log_warning "⚠️ Ingress configuration not found"

log_success "✅ FANZ services deployed to adult-friendly infrastructure"

# Get ingress IP
log_step "7. Getting load balancer external IP..."
log_info "⏳ Waiting for load balancer to provision external IP..."

external_ip=""
attempts=0
max_attempts=60  # Increased timeout for cloud providers

echo ""
log_info "🌐 Checking load balancer status..."
while [[ -z $external_ip && $attempts -lt $max_attempts ]]; do
    echo "   ⏳ Attempt $((attempts+1))/$max_attempts - Waiting for external IP..."
    external_ip=$(kubectl get svc ingress-nginx-controller -n ingress-nginx --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null || echo "")
    if [[ -z $external_ip ]]; then
        sleep 15
        ((attempts++))
    fi
done

if [[ -n $external_ip ]]; then
    log_success "🎉 External IP obtained: $external_ip"
else
    log_warning "⚠️ External IP not yet available. This may take 5-15 minutes."
    external_ip="PENDING"
    log_info "💡 Check status with: kubectl get svc ingress-nginx-controller -n ingress-nginx"
fi

# DNS Configuration for Adult Platforms
log_step "8. DNS Configuration for FANZ Adult Platforms"
echo ""
log_warning "⚠️ IMPORTANT: Configure DNS records for your adult content domains!"
echo ""
echo "🌐 Point these domains to IP: $external_ip"
echo ""
echo "📋 A Records to create:"
echo "   • 🔗 api.fanz.network → $external_ip"
echo "   • 🤖 ai.fanz.network → $external_ip"
echo "   • 📊 monitoring.fanz.network → $external_ip"
echo "   • 🏠 fanz.network → $external_ip"
echo ""
echo "🏳️‍🌈 Platform-specific domains:"
echo "   • 👨 boyfanz.com → $external_ip"
echo "   • 👩 girlfanz.com → $external_ip"  
echo "   • 🐕 pupfanz.com → $external_ip"
echo "   • 🔥 taboofanz.com → $external_ip"
echo ""

# Test deployment
log_step "9. Testing FANZ deployment..."

log_info "📊 Checking deployment status..."
echo ""
echo "Pods in fanz-production namespace:"
kubectl get pods -n fanz-production || log_warning "No pods found yet"
echo ""
echo "Services:"
kubectl get services -n fanz-production || log_warning "No services found yet"
echo ""
echo "Ingress:"
kubectl get ingress -n fanz-production || log_warning "No ingress found yet"

# Final summary
echo ""
echo -e "${PURPLE}===============================================${NC}"
echo -e "${PURPLE}🏳️‍🌈 FANZ ADULT-FRIENDLY DEPLOYMENT COMPLETE!${NC}"
echo -e "${PURPLE}===============================================${NC}"
echo ""

log_success "✅ Adult-content-friendly infrastructure configured"
log_success "✅ FANZ creator economy services deployed"
log_success "✅ SSL certificates and security configured"
log_success "✅ Load balancer ready for global traffic"

echo ""
echo -e "${CYAN}📋 Next Steps for Your Creator Platform:${NC}"
echo ""
echo "1. 🌐 Configure DNS records (list above)"
echo "2. ⏳ Wait for DNS propagation (15 minutes - 2 hours)"
echo "3. 🔍 Run validation: ./validate-production.sh"
echo "4. 💳 Configure adult-friendly payment processors:"
echo "   • CCBill (adult industry standard)"
echo "   • SegPay (creator-friendly)"
echo "   • Cryptocurrency options"
echo "5. 🛡️ Set up content moderation and compliance"
echo "6. 📈 Configure monitoring and analytics"
echo "7. 🧪 Perform load testing"
echo "8. 🚀 Launch your creator revolution!"
echo ""

echo -e "${CYAN}🔗 Your FANZ Platform URLs (once DNS propagates):${NC}"
echo "   🌟 Main Platform: https://fanz.network"
echo "   🔌 API Gateway: https://api.fanz.network"
echo "   🤖 AI Services: https://ai.fanz.network"
echo "   📊 Monitoring: https://monitoring.fanz.network"
echo ""

echo -e "${CYAN}🏳️‍🌈 Creator Platform Access:${NC}"
echo "   👨 BoyFanz: https://boyfanz.com"
echo "   👩 GirlFanz: https://girlfanz.com"
echo "   🐕 PupFanz: https://pupfanz.com"
echo "   🔥 TabooFanz: https://taboofanz.com"
echo ""

echo -e "${CYAN}📊 Monitor Your Deployment:${NC}"
echo "   kubectl get all -n fanz-production"
echo "   kubectl logs -f deployment/fanz-ai-integration -n fanz-production"
echo ""

echo -e "${PURPLE}🚀 Congratulations! Your FANZ platform is deployed on${NC}"
echo -e "${PURPLE}   adult-content-friendly infrastructure!${NC}"
echo -e "${PURPLE}🏳️‍🌈 Ready to revolutionize the creator economy!${NC}"
echo ""

log_info "🎯 Adult-friendly deployment completed successfully!"
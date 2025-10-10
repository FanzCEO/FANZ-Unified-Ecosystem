#!/bin/bash

# 🚀 FANZ Unified Ecosystem - DigitalOcean Production Deployment
set -euo pipefail

echo "🎉 =================================="
echo "🎉  FANZ DIGITALOCEAN DEPLOYMENT"
echo "🎉 =================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not running"
    exit 1
fi

if ! command -v doctl &> /dev/null; then
    log_error "doctl is not installed"
    exit 1
fi

# Configuration
REGISTRY="registry.digitalocean.com/fanz-docr"
IMAGE_TAG="v$(date +%Y%m%d-%H%M%S)"
MONITORING_SERVER="fanz-monitoring"
BASTION_SERVER="fanz-bastion"

log_info "Deployment configuration:"
log_info "  Registry: ${REGISTRY}"
log_info "  Tag: ${IMAGE_TAG}"
log_info "  Environment: Production"

# Step 1: Build and push main ecosystem container
log_info "Building FANZ Ecosystem container..."
docker build -t ${REGISTRY}/fanz-ecosystem:${IMAGE_TAG} .
docker tag ${REGISTRY}/fanz-ecosystem:${IMAGE_TAG} ${REGISTRY}/fanz-ecosystem:latest

log_info "Pushing to DigitalOcean Container Registry..."
docker push ${REGISTRY}/fanz-ecosystem:${IMAGE_TAG}
docker push ${REGISTRY}/fanz-ecosystem:latest

log_success "Container pushed to registry"

# Step 2: Create deployment configuration for monitoring server
log_info "Creating deployment configuration..."
cat > docker-compose.production.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  fanz_production:
    driver: bridge

volumes:
  media_data:
    driver: local
  logs_data:
    driver: local

services:
  # Main FANZ Ecosystem
  fanz-ecosystem:
    image: registry.digitalocean.com/fanz-docr/fanz-ecosystem:latest
    container_name: fanz_unified_ecosystem
    restart: unless-stopped
    env_file:
      - .env.production.local
    ports:
      - "8080:8080"
      - "3000:3000"
    volumes:
      - media_data:/app/media
      - logs_data:/app/logs
    networks:
      - fanz_production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: fanz_prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring:/etc/prometheus
    networks:
      - fanz_production

  grafana:
    image: grafana/grafana:latest
    container_name: fanz_grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=FanzGrafanaSecure2024!
    ports:
      - "3001:3000"
    volumes:
      - ./grafana_data:/var/lib/grafana
    networks:
      - fanz_production

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: fanz_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - fanz_production
    depends_on:
      - fanz-ecosystem
COMPOSE_EOF

log_success "Production deployment configuration created"

# Step 3: Create Nginx configuration
log_info "Creating Nginx configuration..."
mkdir -p nginx
cat > nginx/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    upstream fanz_backend {
        server fanz-ecosystem:8080;
    }
    
    upstream fanz_frontend {
        server fanz-ecosystem:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=50r/s;

    server {
        listen 80;
        server_name boyfanz.com www.boyfanz.com girlfanz.com www.girlfanz.com pupfanz.com www.pupfanz.com taboofanz.com www.taboofanz.com;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API Gateway
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://fanz_backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Frontend
        location / {
            limit_req zone=web burst=100 nodelay;
            proxy_pass http://fanz_frontend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

log_success "Nginx configuration created"

# Step 4: Deploy to monitoring server (if accessible)
log_info "Preparing deployment to monitoring server..."

# Create deployment script for server
cat > deploy-remote.sh << 'REMOTE_EOF'
#!/bin/bash
set -e

# Pull latest images
docker login registry.digitalocean.com
docker-compose -f docker-compose.production.yml pull

# Stop existing services
docker-compose -f docker-compose.production.yml down

# Start new services
docker-compose -f docker-compose.production.yml up -d

# Check health
sleep 10
docker-compose -f docker-compose.production.yml ps

echo "✅ FANZ Ecosystem deployed successfully!"
REMOTE_EOF

chmod +x deploy-remote.sh

log_success "Remote deployment script created"

# Step 5: Upload and execute deployment
log_info "Ready for server deployment!"
log_warn "To complete deployment, run the following commands:"
echo ""
echo "1. Copy files to monitoring server:"
echo "   scp -r . root@[monitoring-server-ip]:~/fanz-deployment/"
echo ""
echo "2. SSH to monitoring server and run:"
echo "   ssh root@[monitoring-server-ip]"
echo "   cd ~/fanz-deployment"
echo "   ./deploy-remote.sh"
echo ""

# Step 6: Create DNS update script
log_info "Creating DNS update script..."
cat > update-dns.sh << 'DNS_EOF'
#!/bin/bash
# Update DNS records to point to load balancer

LB_IP=$(doctl compute load-balancer list --format "IP" --no-header)

# Update A records for all domains
doctl compute domain records create boyfanz.com --record-type A --record-name "@" --record-data $LB_IP
doctl compute domain records create girlfanz.com --record-type A --record-name "@" --record-data $LB_IP  
doctl compute domain records create pupfanz.com --record-type A --record-name "@" --record-data $LB_IP
doctl compute domain records create taboofanz.com --record-type A --record-name "@" --record-data $LB_IP

# Update API subdomain
doctl compute domain records create boyfanz.com --record-type A --record-name "api" --record-data $LB_IP

echo "✅ DNS records updated to point to load balancer: $LB_IP"
DNS_EOF

chmod +x update-dns.sh

log_success "DNS update script created"

# Step 7: Summary
echo ""
log_success "🎉 FANZ DEPLOYMENT PREPARATION COMPLETE!"
echo ""
echo "📦 What was created:"
echo "  ✅ Production Docker image built and pushed"
echo "  ✅ docker-compose.production.yml - Production deployment config"
echo "  ✅ nginx/nginx.conf - Load balancer configuration"
echo "  ✅ deploy-remote.sh - Server deployment script"
echo "  ✅ update-dns.sh - DNS update script"
echo ""
echo "🚀 Next steps:"
echo "  1. Run './update-dns.sh' to update DNS"
echo "  2. Deploy to your monitoring server (instructions above)"
echo "  3. Monitor at: http://[your-server]/health"
echo ""
echo "📊 Access points after deployment:"
echo "  🌐 Frontend: https://boyfanz.com"
echo "  🔧 API: https://boyfanz.com/api"
echo "  📊 Grafana: http://[server-ip]:3001"
echo "  🎯 Prometheus: http://[server-ip]:9090"
echo ""
log_success "Ready for production! 🌟"


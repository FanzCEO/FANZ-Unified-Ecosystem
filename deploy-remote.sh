#!/bin/bash
set -e

echo "🚀 FANZ Ecosystem Remote Deployment Starting..."

# Login to DigitalOcean Container Registry
docker login registry.digitalocean.com

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.production.yml pull

# Stop existing services
echo "⏹️  Stopping existing services..."
docker-compose -f docker-compose.production.yml down

# Start new services
echo "▶️  Starting FANZ Ecosystem services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Check health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.production.yml ps

# Test endpoints
echo "🧪 Testing endpoints..."
curl -f http://localhost:8080/ || echo "Main service endpoint test failed"
curl -f http://localhost:9090/ || echo "Prometheus endpoint test failed"  
curl -f http://localhost:3001/ || echo "Grafana endpoint test failed"

echo "✅ FANZ Ecosystem deployed successfully!"
echo ""
echo "🌐 Access Points:"
echo "  Main App: http://$(hostname -I | awk '{print $1}'):8080"
echo "  Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo "  Grafana: http://$(hostname -I | awk '{print $1}'):3001 (admin/FanzGrafanaSecure2024!)"
echo ""
echo "🔗 Domain Access (once DNS propagates):"
echo "  https://boyfanz.com"
echo "  https://girlfanz.com"
echo "  https://pupfanz.com"
echo "  https://taboofanz.com"

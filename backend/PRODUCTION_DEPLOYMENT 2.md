# 🚀 FANZ Backend - Production Deployment Guide

## Overview

The FANZ Unified Ecosystem backend is now production-ready with comprehensive deployment automation, monitoring, and security hardening. This guide covers all deployment options and production best practices.

## 🎯 Quick Start

### Local Development
```bash
# Install dependencies
npm ci

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Build and start
npm run build
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# With monitoring stack
docker-compose --profile monitoring up -d

# Production with proxy
docker-compose --profile production --profile proxy up -d
```

### Production Deployment
```bash
# Using deployment script
chmod +x deploy.sh
./deploy.sh

# Manual deployment commands
./deploy.sh health    # Check health
./deploy.sh rollback  # Emergency rollback
./deploy.sh logs      # View logs
./deploy.sh status    # Check status
```

## 📁 Deployment Artifacts

### Core Files
- **`deploy.sh`** - Production deployment script with rollback
- **`Dockerfile`** - Hardened container image
- **`docker-compose.yml`** - Multi-service orchestration
- **`k8s-deployment.yaml`** - Kubernetes production manifests
- **`.github/workflows/deploy.yml`** - CI/CD automation

### Configuration Files
- **`.env.example`** - Environment variables template
- **`PRODUCTION_READY.md`** - Complete production checklist
- **`monitoring/prometheus.yml`** - Metrics collection config

## 🛠️ Deployment Options

### 1. 🐳 Docker Deployment

**Development:**
```bash
docker-compose up -d
```

**Production with SSL:**
```bash
docker-compose --profile production up -d
```

**With full monitoring:**
```bash
docker-compose --profile monitoring --profile production up -d
```

### 2. ☸️ Kubernetes Deployment

**Apply manifests:**
```bash
kubectl apply -f k8s-deployment.yaml
```

**Monitor deployment:**
```bash
kubectl rollout status deployment/fanz-backend -n fanz-backend
kubectl get pods -n fanz-backend
```

**Check health:**
```bash
kubectl port-forward svc/fanz-backend-service 3000:80 -n fanz-backend
curl http://localhost:3000/health
```

### 3. 🔄 CI/CD Deployment

The GitHub Actions workflow provides:
- ✅ Automated testing and quality checks
- 🔍 Security vulnerability scanning  
- 🏗️ Multi-architecture container builds
- 🚀 Staged deployments (staging → production)
- 📊 Health checks and rollback on failure

**Trigger deployment:**
```bash
# Push to main branch (auto-deploys to staging)
git push origin main

# Push to production branch (deploys to production)
git push origin production

# Manual deployment via GitHub UI
# Go to Actions → Deploy → Run workflow
```

## 🔧 Configuration

### Environment Variables
```bash
# Required Production Variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET=your-jwt-secret-256-bits
ENCRYPTION_KEY=your-encryption-key-256-bits

# Optional Security Headers
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Payment Processor Configuration
DEFAULT_PROCESSOR=mock
GEO_ROUTING_ENABLED=true
```

### Security Configuration
The deployment includes comprehensive security hardening:

- **Container Security**: Non-root user, read-only filesystem, dropped capabilities
- **Network Security**: Network policies, ingress filtering, rate limiting  
- **Runtime Security**: Security contexts, resource limits, health checks
- **Supply Chain Security**: Base image verification, dependency scanning

## 📊 Monitoring & Observability

### Health Checks
```bash
# Application health
curl https://api.fanz.network/health

# Detailed status
curl https://api.fanz.network/status

# Metrics (Prometheus format)
curl https://api.fanz.network/metrics
```

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards  
- **AlertManager**: Alert routing and notification
- **Jaeger**: Distributed tracing (optional)

Access monitoring:
- **Grafana**: `http://localhost:3001` (admin/admin_password_2024!)
- **Prometheus**: `http://localhost:9090`

### Log Management
```bash
# Application logs
docker-compose logs fanz-api -f

# System logs
./deploy.sh logs

# Kubernetes logs
kubectl logs -f deployment/fanz-backend -n fanz-backend
```

## 🔒 Security Features

### Container Hardening
- Distroless base image for minimal attack surface
- Non-root user execution (UID 65532)
- Read-only root filesystem
- Dropped Linux capabilities
- Security context constraints

### Network Security  
- HTTPS enforcement with SSL termination
- Rate limiting and DDoS protection
- CORS policy enforcement
- Security headers (HSTS, CSP, etc.)
- Network policies for pod isolation

### Application Security
- JWT token authentication
- Input validation and sanitization  
- SQL injection protection
- XSS prevention headers
- Secure session management
- Environment-based configuration

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Automatic rollback (if health checks fail)
./deploy.sh

# Manual rollback
./deploy.sh rollback

# Kubernetes rollback
kubectl rollout undo deployment/fanz-backend -n fanz-backend
```

### Scale Application
```bash
# Docker Compose
docker-compose up -d --scale fanz-api=3

# Kubernetes
kubectl scale deployment fanz-backend --replicas=5 -n fanz-backend
```

### Emergency Stop
```bash
# Docker
docker-compose stop fanz-api

# Kubernetes  
kubectl scale deployment fanz-backend --replicas=0 -n fanz-backend
```

## 📈 Performance Optimization

### Horizontal Scaling
- Kubernetes HPA: Automatically scales 3-10 replicas based on CPU/memory
- Docker Compose: Manual scaling with load balancer
- PM2 Clustering: Process-level scaling on single host

### Resource Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "1Gi" 
    cpu: "1000m"
```

### Database Optimization
- Connection pooling with configurable limits
- Query optimization and indexing
- Read replicas for scaling reads
- Redis caching for frequently accessed data

## 🔍 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
./deploy.sh logs
# or
kubectl logs deployment/fanz-backend -n fanz-backend

# Verify configuration
./deploy.sh status
```

**Database connection issues:**
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15-alpine -- psql $DATABASE_URL
```

**Memory/Performance issues:**
```bash
# Check resource usage
kubectl top pods -n fanz-backend

# Scale if needed
kubectl scale deployment fanz-backend --replicas=5 -n fanz-backend
```

### Health Check Endpoints
- `/health` - Basic application health
- `/status` - Detailed system status
- `/metrics` - Prometheus metrics
- `/ready` - Readiness probe endpoint

## 📚 Additional Resources

- **[Production Checklist](./PRODUCTION_READY.md)** - Complete deployment checklist
- **[Environment Configuration](./.env.example)** - Configuration template
- **[API Documentation](./docs/api.md)** - API reference (auto-generated)
- **[Architecture Overview](./docs/architecture.md)** - System design docs

## 🆘 Support

For production support and issues:
1. Check health endpoints and logs
2. Review monitoring dashboards
3. Consult troubleshooting guide above
4. Contact FANZ DevOps team
5. Create incident ticket with logs and metrics

---

**🎉 Your FANZ Backend is production-ready!** 

The deployment includes enterprise-grade features:
- ✅ Zero-downtime deployments
- ✅ Automatic scaling and health monitoring  
- ✅ Comprehensive security hardening
- ✅ Full observability stack
- ✅ Disaster recovery procedures

**Production URLs:**
- **API**: https://api.fanz.network
- **Health**: https://api.fanz.network/health
- **Monitoring**: https://grafana.fanz.network
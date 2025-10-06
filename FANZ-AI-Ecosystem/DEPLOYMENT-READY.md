# 🚀 FANZ AI Ecosystem - Production Deployment Guide

## Overview

The FANZ AI Ecosystem is now fully production-ready with comprehensive Docker containerization, Kubernetes orchestration, and monitoring infrastructure.

## 📋 Prerequisites

- **Kubernetes cluster** (local or cloud)
- **kubectl** configured and connected to your cluster  
- **Docker** with buildx support for multi-platform builds
- **Helm** (optional, for easier monitoring setup)
- **Container registry access** (GitHub Container Registry by default)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   External      │    │   API Gateway    │    │   AI Services       │
│   Traffic       │◄──►│   (Port 3000)    │◄──►│                     │
│                 │    │                  │    │  • Intelligence Hub │
└─────────────────┘    └──────────────────┘    │  • Creator Assistant│
                              │                │  • Content Curation │
┌─────────────────┐           │                │  • CDN & Security   │
│   Monitoring    │◄──────────┼────────────────│  • Compliance       │
│                 │           │                │                     │
│  • Prometheus   │           │                └─────────────────────┘
│  • Grafana      │           │                
│  • AlertManager │           │                ┌─────────────────────┐
│                 │           └───────────────►│   Infrastructure    │
└─────────────────┘                            │                     │
                                               │  • PostgreSQL       │
                                               │  • Redis            │
                                               │  • Storage          │
                                               └─────────────────────┘
```

## 🛠️ Service Configuration

### Core Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| `api-gateway` | 3000 | Main API gateway and load balancer |
| `ai-intelligence-hub` | 3001 | Analytics and content moderation |
| `ai-creator-assistant` | 3002 | Creator tools and recommendations |
| `content-curation-engine` | 3003 | Content discovery and personalization |
| `content-distribution-network` | 3004 | CDN and media processing |
| `compliance-accessibility-excellence` | 3005 | Legal compliance and accessibility |
| `security-privacy-framework` | 3006 | Security monitoring and privacy tools |

## 🚀 Quick Start Deployment

### 1. Build All Services

```bash
# Set your registry (default: ghcr.io/joshuastone)
export REGISTRY="your-registry.com/username"
export VERSION="v1.0.0"

# Build and push all service images
./scripts/build.sh --version $VERSION --registry $REGISTRY

# Or build without pushing (for local testing)
./scripts/build.sh --no-push
```

### 2. Configure Secrets

```bash
# Copy secrets template and fill with real values
cp k8s/secrets.template.yaml k8s/secrets.yaml

# Edit secrets.yaml with your actual API keys, passwords, etc.
vim k8s/secrets.yaml

# Important: Do not commit secrets.yaml to version control!
```

### 3. Deploy Infrastructure

```bash
# Create namespace and apply base configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets-configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy all services
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/ai-intelligence-hub-deployment.yaml
kubectl apply -f k8s/ai-creator-assistant-deployment.yaml
# ... (apply other service deployments)

# Create API Gateway ingress
kubectl apply -f k8s/api-gateway-ingress.yaml
```

### 4. Deploy Monitoring Stack

```bash
# Deploy complete monitoring infrastructure
kubectl apply -f k8s/monitoring.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s
```

### 5. Verify Deployment

```bash
# Check all services are running
kubectl get pods -n fanz-ai-ecosystem
kubectl get services -n fanz-ai-ecosystem

# Check monitoring
kubectl get pods -n monitoring

# Run health checks
./scripts/health-check.sh
```

## 📊 Accessing Services

### API Gateway
- **URL**: `https://api.fanz.network` (or your configured domain)
- **Health Check**: `https://api.fanz.network/health`
- **Service Discovery**: `https://api.fanz.network/api/services`

### Monitoring Dashboard
- **Grafana**: `https://monitoring.fanz.network/grafana`
  - Username: `admin`
  - Password: (from your secrets configuration)
- **Prometheus**: `https://monitoring.fanz.network/prometheus`
- **AlertManager**: `https://monitoring.fanz.network/alertmanager`

### Local Port Forwarding (for testing)
```bash
# API Gateway
kubectl port-forward -n fanz-ai-ecosystem svc/api-gateway 3000:80

# Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

## 🔧 Configuration Management

### Environment Variables

Key configuration options in `k8s/secrets-configmap.yaml`:

```yaml
# Application Configuration
NODE_ENV: "production"
LOG_LEVEL: "info" 
CORS_ORIGINS: "https://fanz.network,https://boyfanz.com,https://girlfanz.com"

# AI Configuration  
AI_MODEL_PROVIDER: "openai"
AI_MODEL_VERSION: "gpt-4-turbo-preview"
AI_MAX_TOKENS: "4000"

# Security Settings
SECURITY_SCAN_ENABLED: "true"
CONTENT_MODERATION_ENABLED: "true"
THREAT_DETECTION_ENABLED: "true"

# Compliance
GDPR_COMPLIANCE_ENABLED: "true"
CCPA_COMPLIANCE_ENABLED: "true"
ADA_COMPLIANCE_ENABLED: "true"
```

### Scaling Services

```bash
# Scale API Gateway for high traffic
kubectl scale deployment api-gateway --replicas=5 -n fanz-ai-ecosystem

# Scale AI services based on load
kubectl scale deployment ai-intelligence-hub --replicas=3 -n fanz-ai-ecosystem
kubectl scale deployment ai-creator-assistant --replicas=3 -n fanz-ai-ecosystem
```

## 📈 Monitoring & Alerting

### Default Alerts

The system includes pre-configured alerts for:

- **Service Downtime** (>2 minutes)
- **High Error Rates** (>10% for 5 minutes)  
- **High Response Times** (>1 second 95th percentile)
- **High CPU Usage** (>80% for 5 minutes)
- **High Memory Usage** (>90% for 5 minutes)
- **Pod Crash Looping** (restarts in 5 minutes)

### Custom Dashboards

Grafana includes dashboards for:

- **FANZ AI Ecosystem Overview**: Service health and performance
- **Individual Service Metrics**: Detailed per-service monitoring
- **Infrastructure Monitoring**: Kubernetes cluster health
- **Business Metrics**: AI processing rates, user engagement

### Log Aggregation

- **Centralized Logging**: All services log to structured JSON
- **Correlation IDs**: End-to-end request tracing
- **Log Retention**: 7 days (configurable)
- **Real-time Streaming**: Available in Grafana

## 🔐 Security Features

### Container Security
- **Non-root containers**: All services run as user `fanzai:1001`
- **Read-only filesystems**: Immutable container environments
- **Security contexts**: Dropped capabilities and privilege escalation prevention
- **Health checks**: Liveness and readiness probes for all services

### Network Security
- **Network policies**: Service-to-service communication restrictions
- **RBAC**: Least-privilege access for service accounts
- **Secrets management**: Kubernetes secrets with proper access controls
- **TLS encryption**: All external traffic encrypted

### Compliance
- **Audit logging**: Complete audit trail for compliance requirements
- **Data protection**: GDPR/CCPA compliance built-in
- **Accessibility**: ADA AAA compliance monitoring
- **Content moderation**: Automated AI-powered content screening

## 🚨 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check pod status and logs
kubectl get pods -n fanz-ai-ecosystem
kubectl logs -f deployment/ai-intelligence-hub -n fanz-ai-ecosystem

# Check events
kubectl get events -n fanz-ai-ecosystem --sort-by=.metadata.creationTimestamp
```

**Networking issues:**
```bash
# Check services and endpoints
kubectl get svc,endpoints -n fanz-ai-ecosystem

# Test internal connectivity
kubectl run debug --image=busybox --rm -it --restart=Never -- sh
```

**Monitoring not working:**
```bash
# Check monitoring pods
kubectl get pods -n monitoring

# Check prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Navigate to: http://localhost:9090/targets
```

### Health Check Script

```bash
# Run comprehensive health checks
./scripts/health-check.sh

# Sample output:
# ✅ API Gateway: healthy (response time: 45ms)
# ✅ AI Intelligence Hub: healthy (response time: 67ms)  
# ✅ AI Creator Assistant: healthy (response time: 52ms)
# ✅ All services operational
```

## 🔄 Updates & Rollbacks

### Rolling Updates

```bash
# Update a service to new version
kubectl set image deployment/ai-intelligence-hub ai-intelligence-hub=ghcr.io/joshuastone/ai-intelligence-hub:v1.1.0 -n fanz-ai-ecosystem

# Monitor rollout status
kubectl rollout status deployment/ai-intelligence-hub -n fanz-ai-ecosystem
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/ai-intelligence-hub -n fanz-ai-ecosystem

# Rollback to specific revision
kubectl rollout undo deployment/ai-intelligence-hub --to-revision=2 -n fanz-ai-ecosystem
```

## 📝 Development Workflow

### Local Development

```bash
# Start services locally with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Or run individual service
cd services/ai-intelligence-hub
npm install
npm run dev
```

### CI/CD Integration

The build script supports CI/CD pipelines:

```bash
# CI build (no push)
./scripts/build.sh --no-push --version ${GITHUB_SHA}

# Production build
./scripts/build.sh --version ${VERSION} --registry ${REGISTRY}
```

## 🎯 Performance Optimization

### Resource Allocation

Default resource settings per service:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi" 
    cpu: "1000m"
```

Adjust based on your workload requirements.

### Database Optimization

- **Connection Pooling**: Configured for optimal database performance
- **Caching**: Redis caching layer for frequently accessed data
- **Indexing**: Proper database indexes for AI workloads

## 🌐 Multi-Environment Setup

### Environment-Specific Configurations

```bash
# Development
kubectl apply -f k8s/ -l environment=development

# Staging  
kubectl apply -f k8s/ -l environment=staging

# Production
kubectl apply -f k8s/ -l environment=production
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Monitor resource usage** and scale services as needed
2. **Update container images** regularly for security patches
3. **Review and rotate secrets** quarterly
4. **Backup configurations** and persistent data
5. **Test disaster recovery** procedures

### Getting Help

- **Documentation**: Check `/docs` directory for detailed guides
- **Logs**: Use `kubectl logs` for service-specific issues  
- **Monitoring**: Check Grafana dashboards for performance insights
- **Health Checks**: Use provided scripts for system validation

---

## 🎉 Success!

Your FANZ AI Ecosystem is now running in production with:

✅ **Complete Service Architecture** - All 7 AI services deployed  
✅ **Production Security** - Hardened containers and network policies  
✅ **Comprehensive Monitoring** - Prometheus, Grafana, and AlertManager  
✅ **Auto-scaling Ready** - Resource limits and horizontal scaling support  
✅ **Compliance Built-in** - GDPR, ADA, and security compliance  

**The future of AI-powered creator platforms is now live! 🚀**
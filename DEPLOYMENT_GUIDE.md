# 🚀 FANZ Production Deployment Guide

Complete guide for deploying the FANZ Unified Ecosystem to production with enterprise-grade infrastructure.

## 📋 Prerequisites

### Infrastructure Requirements
- **Kubernetes Cluster** v1.28+
- **PostgreSQL** v14+ (Primary database)
- **Redis** v7+ (Caching and sessions)
- **MinIO/S3** (Media storage)
- **Load Balancer** with SSL termination
- **CDN** (Bunny.net or CloudFlare)
- **Monitoring** (Prometheus + Grafana)
- **Logging** (ELK Stack or Loki)

### External Services
- **OpenAI API Key** (GPT-4o-mini for AI features)
- **Anthropic API Key** (Claude for advanced analysis)
- **CCBill/SegPay** (Payment processing)
- **Age Verification Provider** (VerifyMy or similar)
- **Email Service** (SendGrid, AWS SES)
- **SMS Service** (Twilio)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFlare    │    │  Load Balancer  │    │   Kubernetes    │
│      CDN        │─── │     (NGINX)     │─── │    Cluster      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                    ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
                    │   Frontend Apps   │    │  Backend APIs     │    │   AI Services     │
                    │ • BoyFanz         │    │ • fanz-auth       │    │ • fanz-ai-integ   │
                    │ • GirlFanz        │    │ • fanz-social     │    │ • deepfake-detect │
                    │ • PupFanz         │    │ • api-gateway     │    │ • sentiment       │
                    │ • TabooFanz       │    │ • fanz-media-core │    │ • content-opt     │
                    └───────────────────┘    └───────────────────┘    └───────────────────┘
                              │                        │                        │
                    ┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
                    │   PostgreSQL      │    │      Redis        │    │     MinIO         │
                    │   Cluster         │    │     Cluster       │    │   (S3 Storage)    │
                    └───────────────────┘    └───────────────────┘    └───────────────────┘
```

## 🔧 Step-by-Step Deployment

### 1. Environment Setup

Create production environment files:

```bash
# Copy all .env.template files to .env
find . -name ".env.template" -execdir cp {} .env \;

# Update with production values
vim services/fanz-ai-integration/.env
vim services/fanz-auth/.env
vim services/api-gateway/.env
# ... continue for all services
```

### 2. Build Docker Images

```bash
# Build all service images
docker build -t registry.fanz.network/fanz-ai-integration:v1.0.0 services/fanz-ai-integration/
docker build -t registry.fanz.network/fanz-auth:v1.0.0 services/fanz-auth/
docker build -t registry.fanz.network/api-gateway:v1.0.0 services/api-gateway/
docker build -t registry.fanz.network/frontend:v1.0.0 frontend/

# Push to registry
docker push registry.fanz.network/fanz-ai-integration:v1.0.0
docker push registry.fanz.network/fanz-auth:v1.0.0
docker push registry.fanz.network/api-gateway:v1.0.0
docker push registry.fanz.network/frontend:v1.0.0
```

### 3. Database Setup

```sql
-- Create databases
CREATE DATABASE fanz_production;
CREATE DATABASE fanz_ai_production;
CREATE DATABASE fanz_analytics;

-- Create users with proper permissions
CREATE USER fanz_api WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE fanz_production TO fanz_api;

-- Run migrations
kubectl exec -it postgres-0 -- psql -d fanz_production -f /migrations/schema.sql
```

### 4. Kubernetes Deployment

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets and config maps
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/

# Deploy infrastructure
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/minio/

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Deploy services
kubectl apply -f k8s/services/
kubectl apply -f k8s/deployments/

# Deploy ingress and load balancer
kubectl apply -f k8s/ingress/
```

### 5. SSL Certificate Setup

```bash
# Using cert-manager for automatic SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Apply ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/ssl/cluster-issuer.yaml

# Certificates will be automatically generated
```

### 6. CDN Configuration

Configure CDN settings in your provider (Bunny.net/CloudFlare):

```yaml
# CDN Cache Rules
# Static assets: 1 year
- /assets/*: max-age=31536000
- /images/*: max-age=31536000
- /videos/*: max-age=86400

# API responses: 5 minutes
- /api/content/*: max-age=300
- /api/health: max-age=60

# Dynamic content: No cache
- /api/auth/*: no-cache
- /api/user/*: no-cache
```

### 7. Monitoring Setup

```bash
# Deploy Prometheus monitoring
kubectl apply -f k8s/monitoring/prometheus/
kubectl apply -f k8s/monitoring/grafana/

# Deploy logging stack
kubectl apply -f k8s/logging/elasticsearch/
kubectl apply -f k8s/logging/kibana/
kubectl apply -f k8s/logging/filebeat/

# Access dashboards
kubectl port-forward svc/grafana 3000:3000
kubectl port-forward svc/kibana 5601:5601
```

## 🔐 Security Configuration

### 1. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: fanz-network-policy
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
```

### 2. Security Context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
```

### 3. Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fanz-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## 📊 Performance Optimization

### 1. Resource Allocation

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 2. Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fanz-ai-integration-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fanz-ai-integration
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3. Database Connection Pooling

```yaml
env:
- name: DATABASE_POOL_SIZE
  value: "20"
- name: DATABASE_MAX_CONNECTIONS
  value: "100"
- name: REDIS_POOL_SIZE
  value: "10"
```

## 🌍 Global Deployment

### Multi-Region Setup

1. **Primary Region**: US-East (Virginia)
   - Full application stack
   - Primary database (PostgreSQL)
   - All AI services

2. **Secondary Region**: EU-West (Ireland)
   - Read replicas
   - CDN edge locations
   - GDPR compliant data handling

3. **Tertiary Region**: Asia-Pacific (Singapore)
   - CDN edge locations
   - Regional API gateways

### Geographic Load Balancing

```yaml
# GeoDNS Configuration
- subdomain: api-us.fanz.network
  region: us-east-1
  primary: true

- subdomain: api-eu.fanz.network
  region: eu-west-1
  primary: false

- subdomain: api-ap.fanz.network
  region: ap-southeast-1
  primary: false
```

## 📈 Scaling Strategy

### Auto-scaling Triggers

| Metric | Scale Up | Scale Down |
|--------|----------|------------|
| CPU Usage | > 70% | < 30% |
| Memory Usage | > 80% | < 40% |
| Request Rate | > 1000 RPS | < 100 RPS |
| Queue Depth | > 100 | < 10 |

### Capacity Planning

- **Normal Load**: 10,000 concurrent users
- **Peak Load**: 100,000 concurrent users
- **Burst Capacity**: 500,000 concurrent users

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: FANZ Production Deploy
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build and Push Images
      run: |
        docker build -t ${{ secrets.REGISTRY }}/app:${{ github.sha }} .
        docker push ${{ secrets.REGISTRY }}/app:${{ github.sha }}
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/app app=${{ secrets.REGISTRY }}/app:${{ github.sha }}
        kubectl rollout status deployment/app
```

## 🧪 Testing in Production

### Blue-Green Deployment

```bash
# Deploy to green environment
kubectl apply -f k8s/green/

# Run smoke tests
curl -f https://green.api.fanz.network/health

# Switch traffic
kubectl patch service api-gateway -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor metrics for 30 minutes
# If successful, tear down blue environment
```

### Canary Deployment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: fanz-api-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 100
  selector:
    matchLabels:
      app: fanz-api
```

## 📋 Go-Live Checklist

### Pre-Launch
- [ ] All services deployed and healthy
- [ ] SSL certificates configured
- [ ] CDN configured and tested
- [ ] Database migrations completed
- [ ] External API integrations tested
- [ ] Monitoring and alerting configured
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

### Launch Day
- [ ] Final smoke tests passed
- [ ] Traffic routing configured
- [ ] Monitoring dashboards active
- [ ] Support team briefed
- [ ] Rollback plan ready
- [ ] Communication plan executed

### Post-Launch
- [ ] Monitor key metrics for 24 hours
- [ ] Validate all integrations working
- [ ] Check error rates and performance
- [ ] Review security logs
- [ ] User feedback collection
- [ ] Performance optimization if needed

## 🆘 Incident Response

### Alert Escalation

1. **Level 1**: Service degradation
   - Auto-scaling kicks in
   - Monitoring alerts sent

2. **Level 2**: Service outage
   - On-call engineer paged
   - Incident response team activated

3. **Level 3**: Data breach or security incident
   - Security team activated
   - Executive team notified
   - External communication plan executed

### Recovery Procedures

```bash
# Quick rollback
kubectl rollout undo deployment/api-gateway

# Database failover
kubectl exec postgres-primary -- pg_promote

# Service restart
kubectl rollout restart deployment/fanz-ai-integration
```

## 📞 Support Contacts

- **Platform Team**: platform@fanz.network
- **Security Team**: security@fanz.network  
- **DevOps Team**: devops@fanz.network
- **On-Call**: +1-XXX-XXX-XXXX

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [FANZ Architecture Guide](./docs/ARCHITECTURE.md)
- [Security Hardening Guide](./security/README.md)
- [Monitoring Runbooks](./monitoring/runbooks/)
- [Disaster Recovery Plan](./docs/DISASTER_RECOVERY.md)

---

**🎯 Ready to revolutionize the adult creator economy!**
*Deploy with confidence - The future is FANZ.*
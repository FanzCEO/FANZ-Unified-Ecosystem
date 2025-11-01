# 🚀 FANZ UNIFIED ECOSYSTEM - DEPLOYMENT & OPERATIONS GUIDE
*Revolutionary Creator Economy Platform - Production Ready*

## 🏗️ **INFRASTRUCTURE ARCHITECTURE**

### **Cloud-Native Architecture**
```yaml
# High-level infrastructure overview
infrastructure:
  cloud_provider: "Multi-cloud (AWS Primary, GCP Secondary)"
  orchestration: "Kubernetes (EKS/GKE)"
  service_mesh: "Istio"
  database: "PostgreSQL (RDS Multi-AZ) + Redis Cluster"
  storage: "S3 + CloudFront CDN"
  monitoring: "Prometheus + Grafana + Datadog"
  logging: "ELK Stack (Elasticsearch, Logstash, Kibana)"
  secrets: "HashiCorp Vault + AWS Secrets Manager"
  ci_cd: "GitHub Actions + ArgoCD"
```

### **Environment Strategy**
```mermaid
graph TD
    A[Development] --> B[Testing]
    B --> C[Staging] 
    C --> D[Production]
    
    A1[Local Dev] --> A
    A2[Feature Branches] --> A
    
    B1[Unit Tests] --> B
    B2[Integration Tests] --> B
    B3[Security Tests] --> B
    
    C1[Load Tests] --> C
    C2[User Acceptance] --> C
    C3[Pre-production] --> C
    
    D1[Blue Environment] --> D
    D2[Green Environment] --> D
```

---

## 🐳 **CONTAINERIZATION & ORCHESTRATION**

### **Docker Configuration**

#### **Backend API Dockerfile**
```dockerfile path=null start=null
# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies (production only in final stage)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Add security enhancements
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /usr/src/app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

#### **Frontend Dockerfile**
```dockerfile path=null start=null
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built static files
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Add security headers
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Kubernetes Manifests**

#### **Namespace Configuration**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fanz-ecosystem
  labels:
    name: fanz-ecosystem
    environment: production
---
# Resource quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: fanz-resource-quota
  namespace: fanz-ecosystem
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40" 
    limits.memory: "80Gi"
    persistentvolumeclaims: "10"
    services: "20"
    secrets: "50"
    configmaps: "50"
```

#### **Backend API Deployment**
```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fanz-api
  namespace: fanz-ecosystem
  labels:
    app: fanz-api
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: fanz-api
  template:
    metadata:
      labels:
        app: fanz-api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3001"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: fanz-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: api
        image: fanz/api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 3001
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: fanz-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: fanz-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: fanz-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: temp-dir
          mountPath: /tmp
      volumes:
      - name: temp-dir
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - fanz-api
              topologyKey: kubernetes.io/hostname
```

#### **Database Configuration**
```yaml
# postgres-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: fanz-ecosystem
spec:
  instances: 3
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_preload_libraries: "pg_stat_statements"
      pg_stat_statements.max: "10000"
      pg_stat_statements.track: "all"
      
  bootstrap:
    initdb:
      database: fanz_ecosystem
      owner: fanz_user
      secret:
        name: postgres-credentials
        
  storage:
    size: 100Gi
    storageClass: fast-ssd
    
  monitoring:
    enabled: true
    
  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://fanz-backups/postgres"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-credentials
          key: SECRET_ACCESS_KEY
```

---

## ⚙️ **INFRASTRUCTURE AS CODE**

### **Terraform Configuration**

#### **Main Infrastructure**
```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket = "fanz-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
    
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Provider configurations
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "FANZ Ecosystem"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  cidr_block  = var.vpc_cidr
  
  availability_zones = var.availability_zones
  
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  
  node_groups = {
    main = {
      desired_size = 3
      max_size     = 10
      min_size     = 1
      
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
      
      k8s_labels = {
        role = "main"
      }
    }
    
    spot = {
      desired_size = 2
      max_size     = 20
      min_size     = 0
      
      instance_types = ["t3.medium", "t3.large", "t3.xlarge"]
      capacity_type  = "SPOT"
      
      k8s_labels = {
        role = "spot"
      }
      
      taints = [{
        key    = "spot-instance"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
  
  tags = local.common_tags
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"
  
  identifier = "${var.project_name}-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  multi_az = true
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnet_ids
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  cluster_id = "${var.project_name}-${var.environment}"
  
  node_type = "cache.r6g.large"
  num_cache_nodes = 1
  
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name = module.vpc.cache_subnet_group_name
  security_group_ids = [module.vpc.cache_security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  backup_retention_limit = 7
  backup_window         = "03:00-05:00"
  
  tags = local.common_tags
}
```

#### **Variables and Outputs**
```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "fanz-ecosystem"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# outputs.tf
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.cache_nodes[0].address
  sensitive   = true
}
```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy FANZ Ecosystem

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-west-2
  EKS_CLUSTER_NAME: fanz-ecosystem-prod
  ECR_REPOSITORY: fanz/api
  
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fanz_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'yarn'
        
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Run linting
      run: yarn lint
      
    - name: Run type checking
      run: yarn type-check
      
    - name: Run unit tests
      run: yarn test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_test
        REDIS_URL: redis://localhost:6379
        
    - name: Run integration tests
      run: yarn test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_test
        REDIS_URL: redis://localhost:6379
        
    - name: Generate test coverage
      run: yarn test:coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        
  security:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
        
    - name: Run Semgrep security scan
      uses: returntocorp/semgrep-action@v1
      with:
        config: auto
        
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
      
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
        
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
      
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
          
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
        
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name ${{ env.EKS_CLUSTER_NAME }}
        
    - name: Deploy to Kubernetes
      run: |
        # Update deployment with new image
        kubectl set image deployment/fanz-api api=${{ needs.build.outputs.image-tag }} -n fanz-ecosystem
        
        # Wait for rollout to complete
        kubectl rollout status deployment/fanz-api -n fanz-ecosystem --timeout=600s
        
    - name: Run smoke tests
      run: |
        # Wait for pods to be ready
        kubectl wait --for=condition=ready pod -l app=fanz-api -n fanz-ecosystem --timeout=300s
        
        # Run smoke tests
        kubectl run smoke-test --image=fanz/smoke-tests:latest --rm -i --restart=Never -n fanz-ecosystem
        
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **Prometheus Configuration**
```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'fanz-ecosystem-prod'
    environment: 'production'

rule_files:
  - "alert-rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Kubernetes API Server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

  # Node Exporter
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
    - role: node
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)
    - target_label: __address__
      replacement: kubernetes.default.svc:443
    - source_labels: [__meta_kubernetes_node_name]
      regex: (.+)
      target_label: __metrics_path__
      replacement: /api/v1/nodes/${1}/proxy/metrics

  # Kubelet cAdvisor
  - job_name: 'kubernetes-cadvisor'
    kubernetes_sd_configs:
    - role: node
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)
    - target_label: __address__
      replacement: kubernetes.default.svc:443
    - source_labels: [__meta_kubernetes_node_name]
      regex: (.+)
      target_label: __metrics_path__
      replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor

  # Application Metrics
  - job_name: 'fanz-api'
    kubernetes_sd_configs:
    - role: endpoints
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
    - action: labelmap
      regex: __meta_kubernetes_service_label_(.+)
    - source_labels: [__meta_kubernetes_namespace]
      action: replace
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_service_name]
      action: replace
      target_label: kubernetes_name
```

### **Alert Rules**
```yaml
# alerts/api-alerts.yml
groups:
  - name: fanz-api-alerts
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{job="fanz-api", status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "API error rate is {{ $value }} errors per second"
        
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="fanz-api"}[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}s"
        
    - alert: DatabaseConnectionsHigh
      expr: pg_stat_activity_count{job="postgres-exporter"} > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Database connections are high"
        description: "Current connections: {{ $value }}"
        
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total{namespace="fanz-ecosystem"}[15m]) > 0
      for: 0m
      labels:
        severity: critical
      annotations:
        summary: "Pod is crash looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"
```

---

## 🛠️ **DEPLOYMENT PROCEDURES**

### **Production Deployment Checklist**

#### **Pre-deployment**
- [ ] **Code Review**
  - [ ] All code changes peer reviewed
  - [ ] Security review completed
  - [ ] Performance impact assessed
  - [ ] Database migrations reviewed

- [ ] **Testing**
  - [ ] All unit tests passing
  - [ ] Integration tests passing
  - [ ] Load tests completed
  - [ ] Security scans clean

- [ ] **Infrastructure**
  - [ ] Infrastructure changes applied
  - [ ] DNS records updated if needed
  - [ ] SSL certificates valid
  - [ ] Monitoring alerts configured

#### **Deployment Process**
```bash
#!/bin/bash
# Production deployment script

set -euo pipefail

# Configuration
ENVIRONMENT="production"
NAMESPACE="fanz-ecosystem"
IMAGE_TAG="${1:-latest}"

echo "🚀 Starting production deployment..."
echo "Environment: $ENVIRONMENT"
echo "Image tag: $IMAGE_TAG"

# Pre-flight checks
echo "🔍 Running pre-flight checks..."

# Check cluster connectivity
kubectl cluster-info >/dev/null || {
  echo "❌ Cannot connect to Kubernetes cluster"
  exit 1
}

# Check if namespace exists
kubectl get namespace $NAMESPACE >/dev/null || {
  echo "❌ Namespace $NAMESPACE does not exist"
  exit 1
}

# Check database connectivity
echo "🗄️ Checking database connectivity..."
kubectl run db-test --image=postgres:15-alpine --rm -i --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret fanz-secrets -o jsonpath='{.data.database-url}' | base64 -d)" \
  -- psql "${DATABASE_URL}" -c "SELECT 1" >/dev/null || {
  echo "❌ Cannot connect to database"
  exit 1
}

# Run database migrations
echo "🗄️ Running database migrations..."
kubectl run migration --image=fanz/api:$IMAGE_TAG --rm -i --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret fanz-secrets -o jsonpath='{.data.database-url}' | base64 -d)" \
  -- yarn migrate:prod

# Blue-Green Deployment
echo "🔄 Starting blue-green deployment..."

# Get current deployment
CURRENT_DEPLOYMENT=$(kubectl get deployment fanz-api -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "Current deployment: $CURRENT_DEPLOYMENT"

# Update deployment with new image
kubectl set image deployment/fanz-api api=fanz/api:$IMAGE_TAG -n $NAMESPACE

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/fanz-api -n $NAMESPACE --timeout=600s

# Health check
echo "🏥 Running health checks..."
kubectl wait --for=condition=ready pod -l app=fanz-api -n $NAMESPACE --timeout=300s

# Smoke tests
echo "💨 Running smoke tests..."
kubectl run smoke-test --image=fanz/smoke-tests:latest --rm -i --restart=Never -n $NAMESPACE

# Update Ingress to new deployment (if using blue-green)
# kubectl patch ingress fanz-ingress -p '{"spec":{"rules":[{"http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"fanz-api-green","port":{"number":80}}}}]}}]}}'

echo "✅ Deployment completed successfully!"
echo "📊 Monitoring dashboard: https://grafana.fanz.eco/d/api-dashboard"
echo "🔍 Logs: https://kibana.fanz.eco"
```

#### **Post-deployment**
- [ ] **Verification**
  - [ ] Health checks passing
  - [ ] Smoke tests successful
  - [ ] API endpoints responding
  - [ ] Database connections healthy

- [ ] **Monitoring**
  - [ ] Metrics collecting properly
  - [ ] Alerts configured
  - [ ] Log aggregation working
  - [ ] Performance baselines established

- [ ] **Rollback Plan**
  - [ ] Previous version image available
  - [ ] Database rollback script ready
  - [ ] Quick rollback procedure documented
  - [ ] Incident response team notified

### **Rollback Procedure**
```bash
#!/bin/bash
# Emergency rollback script

set -euo pipefail

PREVIOUS_IMAGE="${1:-}"
NAMESPACE="fanz-ecosystem"

if [ -z "$PREVIOUS_IMAGE" ]; then
  echo "❌ Previous image tag required"
  echo "Usage: $0 <previous-image-tag>"
  exit 1
fi

echo "🔄 Starting emergency rollback..."
echo "Rolling back to: $PREVIOUS_IMAGE"

# Rollback deployment
kubectl set image deployment/fanz-api api=fanz/api:$PREVIOUS_IMAGE -n $NAMESPACE

# Wait for rollback
kubectl rollout status deployment/fanz-api -n $NAMESPACE --timeout=300s

# Verify health
kubectl wait --for=condition=ready pod -l app=fanz-api -n $NAMESPACE --timeout=180s

echo "✅ Rollback completed!"
```

---

## 📚 **OPERATIONAL PROCEDURES**

### **Daily Operations**
```bash
#!/bin/bash
# Daily health check script

echo "📊 Daily FANZ Ecosystem Health Report - $(date)"
echo "================================================"

# Check cluster status
echo "🔍 Kubernetes Cluster Status:"
kubectl get nodes -o wide
echo ""

# Check application health
echo "🚀 Application Status:"
kubectl get pods -n fanz-ecosystem
echo ""

# Check resource usage
echo "💾 Resource Usage:"
kubectl top nodes
kubectl top pods -n fanz-ecosystem
echo ""

# Check recent errors
echo "❌ Recent Errors (last 1 hour):"
kubectl logs -n fanz-ecosystem -l app=fanz-api --since=1h | grep -i error | tail -10
echo ""

# Database health
echo "🗄️ Database Status:"
kubectl exec -it deployment/postgres-cluster -- psql -U postgres -c "SELECT version();"
kubectl exec -it deployment/postgres-cluster -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
echo ""

# Redis health
echo "🚀 Redis Status:"
kubectl exec -it deployment/redis -- redis-cli ping
kubectl exec -it deployment/redis -- redis-cli info replication
echo ""

# Certificate expiry check
echo "🔒 SSL Certificate Status:"
echo | openssl s_client -servername api.fanz.eco -connect api.fanz.eco:443 2>/dev/null | openssl x509 -noout -dates
```

### **Backup Procedures**
```bash
#!/bin/bash
# Database backup script

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="s3://fanz-backups"
NAMESPACE="fanz-ecosystem"

echo "📦 Starting database backup..."

# Create database backup
kubectl exec deployment/postgres-cluster -- pg_dump -U postgres -h localhost fanz_ecosystem > "backup_${BACKUP_DATE}.sql"

# Compress backup
gzip "backup_${BACKUP_DATE}.sql"

# Upload to S3
aws s3 cp "backup_${BACKUP_DATE}.sql.gz" "${BACKUP_BUCKET}/database/"

# Upload to S3 with lifecycle
aws s3 cp "backup_${BACKUP_DATE}.sql.gz" "${BACKUP_BUCKET}/database/" \
  --storage-class INTELLIGENT_TIERING

# Cleanup local backup
rm "backup_${BACKUP_DATE}.sql.gz"

echo "✅ Backup completed: backup_${BACKUP_DATE}.sql.gz"

# Verify backup
aws s3 ls "${BACKUP_BUCKET}/database/" | tail -5
```

### **Disaster Recovery**
```bash
#!/bin/bash
# Disaster recovery script

BACKUP_FILE="${1:-}"
NAMESPACE="fanz-ecosystem"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Backup file required"
  echo "Usage: $0 <backup-file-name>"
  exit 1
fi

echo "🆘 Starting disaster recovery..."
echo "Restoring from: $BACKUP_FILE"

# Download backup from S3
aws s3 cp "s3://fanz-backups/database/$BACKUP_FILE" ./

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Stop application
kubectl scale deployment fanz-api --replicas=0 -n $NAMESPACE

# Restore database
kubectl exec -i deployment/postgres-cluster -- psql -U postgres -h localhost fanz_ecosystem < "$BACKUP_FILE"

# Restart application
kubectl scale deployment fanz-api --replicas=3 -n $NAMESPACE

# Wait for healthy state
kubectl rollout status deployment/fanz-api -n $NAMESPACE

echo "✅ Disaster recovery completed!"

# Cleanup
rm "$BACKUP_FILE"
```

---

## 🔧 **TROUBLESHOOTING GUIDE**

### **Common Issues**

#### **Application Won't Start**
```bash
# Check pod logs
kubectl logs -f deployment/fanz-api -n fanz-ecosystem

# Check pod events
kubectl describe pod -l app=fanz-api -n fanz-ecosystem

# Check resource constraints
kubectl get pods -n fanz-ecosystem -o wide
kubectl describe nodes

# Check secrets and config
kubectl get secrets -n fanz-ecosystem
kubectl get configmaps -n fanz-ecosystem
```

#### **Database Connection Issues**
```bash
# Test database connectivity
kubectl run db-test --image=postgres:15-alpine --rm -i --restart=Never \
  -- psql "$DATABASE_URL" -c "SELECT 1"

# Check database pod status
kubectl get pods -l app=postgres-cluster -n fanz-ecosystem
kubectl logs -l app=postgres-cluster -n fanz-ecosystem

# Check network policies
kubectl get networkpolicies -n fanz-ecosystem
```

#### **High Memory/CPU Usage**
```bash
# Check resource usage
kubectl top pods -n fanz-ecosystem --sort-by=memory
kubectl top pods -n fanz-ecosystem --sort-by=cpu

# Check resource limits
kubectl describe deployment fanz-api -n fanz-ecosystem

# Scale deployment
kubectl scale deployment fanz-api --replicas=5 -n fanz-ecosystem
```

### **Performance Debugging**
```bash
# Get application metrics
curl -s http://api.fanz.eco/metrics | grep -E "(http_requests|memory|cpu)"

# Database performance
kubectl exec deployment/postgres-cluster -- psql -U postgres -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"

# Check slow queries
kubectl logs deployment/postgres-cluster | grep "slow query"
```

---

## 📈 **SCALING STRATEGIES**

### **Horizontal Pod Autoscaler**
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fanz-api-hpa
  namespace: fanz-ecosystem
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fanz-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### **Vertical Pod Autoscaler**
```yaml
# vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: fanz-api-vpa
  namespace: fanz-ecosystem
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fanz-api
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 2Gi
      controlledResources: ["cpu", "memory"]
```

---

## 🛡️ **SECURITY OPERATIONS**

### **Security Monitoring**
```bash
# Check for security vulnerabilities
kubectl get vulnerabilityreports -A

# Scan running containers
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.containers[*].image}{"\n"}{end}' | \
while read pod image; do
  echo "Scanning $pod: $image"
  trivy image --exit-code 1 $image
done

# Check RBAC permissions
kubectl auth can-i --list --as=system:serviceaccount:fanz-ecosystem:fanz-api

# Network policy verification
kubectl get networkpolicies -A
```

### **Compliance Checks**
```bash
# CIS Kubernetes Benchmark
kube-bench run --targets node,policies,managedservices

# Pod Security Standards
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: fanz-ecosystem
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
EOF

# Check for privileged containers
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.privileged}{"\n"}{end}' -n fanz-ecosystem
```

---

*🚀 This deployment guide provides enterprise-grade infrastructure automation, monitoring, and operational procedures for the revolutionary FANZ Ecosystem platform. Follow these practices to ensure scalable, secure, and reliable operations.*
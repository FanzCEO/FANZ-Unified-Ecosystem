# 🚀 FANZ Platform - Production Deployment Guide

This comprehensive guide covers deploying the FANZ Unified Ecosystem to production environments with enterprise-grade infrastructure, monitoring, and security.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Security Configuration](#security-configuration)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Load Balancing & CDN](#load-balancing--cdn)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🛠️ Prerequisites

### System Requirements

- **Kubernetes Cluster**: v1.28+ with at least 6 nodes (4 CPU, 16GB RAM each)
- **PostgreSQL**: v15+ with read replicas
- **Redis Cluster**: v7+ with persistence enabled
- **Storage**: 500GB+ SSD for databases, 2TB+ for media storage
- **Network**: Load balancer with SSL termination
- **DNS**: Configured domains with wildcard SSL certificates

### Required Tools

```bash
# Install required CLI tools
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

### Cloud Provider Setup

#### AWS Configuration
```bash
# Configure AWS CLI
aws configure
export AWS_REGION=us-east-1

# Create EKS cluster
eksctl create cluster \
  --name fanz-production \
  --region us-east-1 \
  --nodegroup-name main-nodes \
  --node-type m5.large \
  --nodes 6 \
  --nodes-min 3 \
  --nodes-max 20 \
  --managed
```

#### Google Cloud Setup
```bash
# Configure GCP
gcloud auth login
gcloud config set project your-project-id

# Create GKE cluster
gcloud container clusters create fanz-production \
  --zone us-central1-a \
  --num-nodes 6 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 20
```

## 🏗️ Infrastructure Setup

### 1. Terraform Infrastructure Deployment

```bash
# Navigate to terraform directory
cd terraform/

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="environments/production.tfvars"

# Apply infrastructure
terraform apply -var-file="environments/production.tfvars"
```

#### Production Terraform Variables (`environments/production.tfvars`)

```hcl
# Project Configuration
project_name = "fanz-production"
environment = "production"
region = "us-east-1"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# EKS Configuration
cluster_version = "1.28"
node_groups = {
  general = {
    instance_types = ["m5.large", "m5.xlarge"]
    min_size = 3
    max_size = 10
    desired_size = 6
  }
  ai_ml = {
    instance_types = ["c5.2xlarge", "c5.4xlarge"]
    min_size = 2
    max_size = 8
    desired_size = 4
  }
  database = {
    instance_types = ["r5.large", "r5.xlarge"]
    min_size = 2
    max_size = 6
    desired_size = 3
  }
}

# Database Configuration
db_instance_class = "db.r5.2xlarge"
db_allocated_storage = 500
db_multi_az = true
db_backup_retention_period = 7

# Redis Configuration
redis_node_type = "cache.r5.large"
redis_num_cache_nodes = 3
redis_parameter_group_name = "default.redis7"

# S3 Configuration
s3_bucket_name = "fanz-production-media"
s3_backup_bucket = "fanz-production-backups"

# CloudFront Configuration
cloudfront_price_class = "PriceClass_All"
cloudfront_compress = true

# Monitoring
enable_cloudwatch = true
log_retention_days = 30
```

### 2. Verify Infrastructure Deployment

```bash
# Check AWS resources
aws eks describe-cluster --name fanz-production
aws rds describe-db-instances --db-instance-identifier fanz-production-db
aws elasticache describe-cache-clusters --cache-cluster-id fanz-production-redis

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name fanz-production

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

## 🔐 Security Configuration

### 1. Setup Security Resources

```bash
# Create security namespace
kubectl create namespace security

# Install cert-manager for SSL certificates
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0 \
  --set installCRDs=true
```

### 2. Configure ClusterIssuer for Let's Encrypt

```yaml
# security/cluster-issuer-prod.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@fanz.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
kubectl apply -f security/cluster-issuer-prod.yaml
```

### 3. Deploy Security Services

```bash
# Deploy zero-trust security architecture
kubectl apply -f security/zero-trust/

# Deploy privacy compliance engine
kubectl apply -f security/privacy/

# Verify security deployments
kubectl get pods -n security
```

## ☸️ Kubernetes Deployment

### 1. Setup Namespaces

```bash
# Create application namespaces
kubectl create namespace fanz-platform
kubectl create namespace monitoring
kubectl create namespace ingress-nginx
```

### 2. Deploy Helm Charts

```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Deploy NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true
```

### 3. Deploy Main Application

```bash
# Deploy FANZ Platform
helm install fanz-platform ./helm/fanz-platform \
  --namespace fanz-platform \
  --values helm/fanz-platform/values-production.yaml

# Verify deployment
kubectl get pods -n fanz-platform
kubectl get services -n fanz-platform
kubectl get ingress -n fanz-platform
```

### 4. Production Values Configuration

```yaml
# helm/fanz-platform/values-production.yaml
global:
  environment: production
  imageTag: "v1.0.0"
  
replicaCount: 3

image:
  repository: fanz/platform
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  hosts:
    - host: fanz.com
      paths:
        - path: /
          pathType: Prefix
    - host: api.fanz.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: fanz-tls
      hosts:
        - fanz.com
        - api.fanz.com

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 50
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

nodeSelector:
  node-type: general

tolerations: []

affinity:
  podAntiAffinity:
    REDACTED_AWS_SECRET_KEYecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - fanz-platform
        topologyKey: kubernetes.io/hostname

database:
  host: fanz-production-db.cluster-xyz.us-east-1.rds.amazonaws.com
  port: 5432
  name: fanz_production
  username: fanz_admin

redis:
  host: fanz-production-redis.cache.amazonaws.com
  port: 6379

storage:
  s3:
    bucket: fanz-production-media
    region: us-east-1
  
cdn:
  cloudfront:
    distributionId: E1234567890ABC
    domain: cdn.fanz.com
```

## 📊 Monitoring & Observability

### 1. Deploy Monitoring Stack

```bash
# Deploy Prometheus Stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/apm/prometheus-stack.yaml

# Verify monitoring deployment
kubectl get pods -n monitoring
```

### 2. Configure Grafana Dashboards

```bash
# Port forward to access Grafana
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80

# Default credentials: admin / prom-operator
# Change password and import dashboards from monitoring/dashboards/
```

### 3. Setup Log Aggregation

```bash
# Deploy Loki for log aggregation
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false
```

## 💾 Database Setup

### 1. PostgreSQL Configuration

```bash
# Connect to RDS instance
psql -h fanz-production-db.cluster-xyz.us-east-1.rds.amazonaws.com \
     -U fanz_admin -d fanz_production

# Run migrations
kubectl exec -it deployment/fanz-api -n fanz-platform -- npm run migrate:prod

# Create read replica users
CREATE USER fanz_read_only WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE fanz_production TO fanz_read_only;
GRANT USAGE ON SCHEMA public TO fanz_read_only;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO fanz_read_only;
```

### 2. Redis Configuration

```bash
# Test Redis connection
kubectl exec -it deployment/fanz-api -n fanz-platform -- redis-cli -h fanz-production-redis.cache.amazonaws.com

# Configure Redis persistence
CONFIG SET save "900 1 300 10 60 10000"
CONFIG SET appendonly yes
CONFIG SET appendfsync everysec
```

### 3. Database Backup Strategy

```bash
# Setup automated backups
kubectl apply -f backup/postgres-backup-cronjob.yaml
kubectl apply -f backup/redis-backup-cronjob.yaml
```

## 🔒 SSL/TLS Configuration

### 1. Verify Certificate Issuance

```bash
# Check certificate status
kubectl get certificates -n fanz-platform
kubectl describe certificate fanz-tls -n fanz-platform
```

### 2. Configure SSL Security Headers

```yaml
# Add to ingress annotations
nginx.ingress.kubernetes.io/configuration-snippet: |
  more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
  more_set_headers "X-Content-Type-Options: nosniff";
  more_set_headers "X-Frame-Options: DENY";
  more_set_headers "X-XSS-Protection: 1; mode=block";
  more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
```

## ⚡ Load Balancing & CDN

### 1. Configure Load Balancer

```bash
# Check load balancer status
kubectl get svc -n ingress-nginx
kubectl describe svc ingress-nginx-controller -n ingress-nginx

# Get external IP
export LB_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Load Balancer IP: $LB_IP"
```

### 2. DNS Configuration

```bash
# Create DNS records (example for Route 53)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "fanz.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$LB_IP'"}]
      }
    }]
  }'
```

### 3. CloudFront CDN Setup

```bash
# Verify CloudFront distribution
aws cloudfront get-distribution --id E1234567890ABC

# Update origin settings if needed
aws cloudfront update-distribution \
  --id E1234567890ABC \
  --distribution-config file://cloudfront-config.json
```

## 💾 Backup & Disaster Recovery

### 1. Database Backup

```yaml
# backup/postgres-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: fanz-platform
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            command:
            - /bin/bash
            - -c
            - |
              BACKUP_FILE="fanz-backup-$(date +%Y%m%d-%H%M%S).sql"
              pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > /backup/$BACKUP_FILE
              aws s3 cp /backup/$BACKUP_FILE s3://fanz-production-backups/postgres/
              # Keep only last 30 days of backups
              find /backup -name "fanz-backup-*.sql" -mtime +30 -delete
          restartPolicy: Never
```

### 2. Application State Backup

```bash
# Backup Kubernetes resources
kubectl get all -n fanz-platform -o yaml > backup/k8s-resources-$(date +%Y%m%d).yaml

# Backup secrets and configmaps
kubectl get secrets,configmaps -n fanz-platform -o yaml > backup/k8s-configs-$(date +%Y%m%d).yaml
```

### 3. Disaster Recovery Plan

```bash
# Create disaster recovery namespace
kubectl create namespace fanz-dr

# Deploy DR resources
helm install fanz-platform-dr ./helm/fanz-platform \
  --namespace fanz-dr \
  --values helm/fanz-platform/values-dr.yaml
```

## ⚡ Performance Optimization

### 1. Resource Optimization

```bash
# Check resource usage
kubectl top pods -n fanz-platform
kubectl top nodes

# Update resource requests/limits based on usage
kubectl patch deployment fanz-api -n fanz-platform -p '{"spec":{"template":{"spec":{"containers":[{"name":"fanz-api","resources":{"requests":{"cpu":"500m","memory":"1Gi"},"limits":{"cpu":"2000m","memory":"4Gi"}}}]}}}}'
```

### 2. Database Performance

```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();

-- Create necessary indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_creator_id ON content(creator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, created_at);
```

### 3. CDN Optimization

```bash
# Invalidate CDN cache for deployments
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Check cache hit ratio
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Pod Startup Issues

```bash
# Check pod status
kubectl get pods -n fanz-platform
kubectl describe pod <pod-name> -n fanz-platform
kubectl logs <pod-name> -n fanz-platform --previous

# Common fixes
# - Check resource limits
# - Verify secrets and configmaps
# - Check image pull policy
# - Verify node selector/tolerations
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it deployment/fanz-api -n fanz-platform -- \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# Check connection pool settings
kubectl exec -it deployment/fanz-api -n fanz-platform -- \
  curl http://localhost:3000/health/database
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
kubectl get certificates -n fanz-platform
kubectl describe certificate fanz-tls -n fanz-platform

# Manual certificate renewal
kubectl delete certificate fanz-tls -n fanz-platform
kubectl apply -f security/certificates.yaml
```

#### 4. Performance Issues

```bash
# Check resource usage
kubectl top pods -n fanz-platform
kubectl describe hpa -n fanz-platform

# Analyze slow queries
kubectl exec -it deployment/fanz-api -n fanz-platform -- \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;"
```

#### 5. Ingress Issues

```bash
# Check ingress status
kubectl get ingress -n fanz-platform
kubectl describe ingress fanz-platform -n fanz-platform

# Check nginx controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### Health Checks

```bash
# Application health
curl -f https://fanz.com/health || echo "Health check failed"

# API health
curl -f https://api.fanz.com/health || echo "API health check failed"

# Database health
kubectl exec -it deployment/fanz-api -n fanz-platform -- npm run health:database

# Redis health
kubectl exec -it deployment/fanz-api -n fanz-platform -- npm run health:redis
```

### Monitoring and Alerts

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090

# Check alert status
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")'

# Grafana dashboard access
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80
```

## 📞 Support and Escalation

### Emergency Procedures

1. **Service Down**: Check load balancer → ingress → pods → database
2. **High Load**: Scale pods → check database connections → analyze queries
3. **Security Incident**: Enable maintenance mode → check logs → contact security team
4. **Data Issue**: Stop writes → restore from backup → verify integrity

### Contact Information

- **DevOps Team**: devops@fanz.com
- **Security Team**: security@fanz.com  
- **Database Team**: dba@fanz.com
- **On-call**: +1 (555) 123-FANZ

---

*Last updated: December 2024*
*For questions or issues, please contact the DevOps team.*
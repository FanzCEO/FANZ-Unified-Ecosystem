# FANZ Unified Ecosystem - Scaleway Deployment Guide

🌟 **The Complete Adult Creator Platform Deployment on Scaleway** 🌟

This guide walks you through deploying the entire FANZ Unified Ecosystem on Scaleway infrastructure, leveraging their adult-content-friendly policies and robust infrastructure.

## 🏗️ Architecture Overview

The FANZ ecosystem on Scaleway includes:

- **Kubernetes Cluster**: Managed Kapsule cluster with auto-scaling
- **Databases**: High-availability PostgreSQL and Redis clusters  
- **Storage**: Scaleway Object Storage for media files and backups
- **Load Balancer**: Scaleway Load Balancer for traffic distribution
- **Container Registry**: Private registry for FANZ microservices
- **Monitoring**: Prometheus + Grafana stack
- **SSL/TLS**: Automated Let's Encrypt certificates
- **Compliance**: Built-in GDPR, ADA, and Section 2257 compliance

## 📋 Prerequisites

Before deploying, ensure you have the following tools installed and configured:

### Required Tools

```bash
# Install Scaleway CLI
curl -s https://raw.githubusercontent.com/scaleway/scaleway-cli/master/scripts/get.sh | sh

# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io/downloads

# Install kubectl
brew install kubectl    # macOS

# Install Helm
brew install helm       # macOS

# Install Docker Desktop
# Download from https://docker.com/products/docker-desktop
```

### Scaleway Setup

1. **Create Scaleway Account**
   - Sign up at [console.scaleway.com](https://console.scaleway.com)
   - Verify your email and complete account setup

2. **Configure Scaleway CLI**
   ```bash
   scw init
   ```
   - Follow the prompts to set up your credentials
   - Choose region: `fr-par` (recommended for adult content)
   - Choose zone: `fr-par-1`

3. **Generate API Keys**
   - Go to [IAM section](https://console.scaleway.com/iam/api-keys)
   - Create new API key with full permissions
   - Save the Access Key and Secret Key

### Environment Variables

Create a `.env` file with your API keys:

```bash
# Copy the example file
cp scaleway/.env.example scaleway/.env

# Edit with your actual keys
export SCW_ACCESS_KEY="YOUR_ACCESS_KEY"
export SCW_SECRET_KEY="YOUR_SECRET_KEY" 
export SCW_DEFAULT_REGION="fr-par"
export SCW_DEFAULT_ZONE="fr-par-1"
export OPENAI_API_KEY="your_openai_key"  # For AI features
```

## 🚀 Quick Deployment

For a complete automated deployment:

```bash
# Navigate to the FANZ ecosystem directory
cd /Users/joshuastone/FANZ-Unified-Ecosystem

# Run the deployment script
./scaleway/deploy-to-scaleway.sh
```

This will:
1. ✅ Check all prerequisites
2. 🏗️ Deploy infrastructure with Terraform
3. 🐳 Build and push Docker images
4. ⚓ Deploy to Kubernetes
5. 🔒 Setup SSL certificates
6. 📊 Install monitoring stack
7. ✅ Run health checks

## 📊 Infrastructure Components

### Kubernetes Cluster Configuration

- **General Pool**: 5 GP1-L nodes (8 vCPU, 32GB RAM each)
- **Compute Pool**: 3 GP1-XL nodes (16 vCPU, 64GB RAM each)
- **Auto-scaling**: 3-20 nodes based on demand
- **CNI**: Cilium for network security
- **Auto-upgrades**: Enabled for security patches

### Database Configuration

- **PostgreSQL**: DB-GP-L instance (8 vCPU, 32GB RAM, 500GB storage)
- **High Availability**: Multi-zone replication
- **Backup**: Daily automated backups with 7-year retention
- **Redis**: RED1-L cluster (8GB RAM) with 6 nodes for performance

### Storage Configuration

- **Media Bucket**: Private bucket for content storage
- **Backup Bucket**: Separate bucket for system backups
- **Lifecycle**: Auto-transition to Glacier after 90 days
- **Retention**: 7 years for compliance (Section 2257)
- **CORS**: Configured for FANZ domains

## 🌐 Domain Configuration

The deployment supports multiple FANZ domains:

- `fanz.network` - Main ecosystem
- `boyfanz.com` - Male-focused platform  
- `girlfanz.com` - Female-focused platform
- `pupfanz.com` - Pet/kink-focused platform
- `taboofanz.com` - Alternative content platform
- `api.fanz.network` - API endpoint
- `admin.fanz.network` - Admin dashboard

### DNS Configuration

After deployment, point your domains to the load balancer IP:

```bash
# Get the load balancer IP
terraform -chdir=scaleway/terraform output load_balancer_ip
```

Create A records for all domains pointing to this IP.

## 🔒 Security Features

### Compliance Built-In

- ✅ **GDPR Compliance**: Data protection and user rights
- ✅ **ADA Compliance**: Accessibility standards (WCAG 2.1 AA)
- ✅ **Section 2257 Compliance**: Adult industry record-keeping
- ✅ **Age Verification**: Integrated verification systems
- ✅ **Content Labeling**: Automated content classification

### Security Measures

- 🔒 **TLS 1.3**: End-to-end encryption
- 🛡️ **Web Application Firewall**: DDoS and attack protection
- 🔐 **Network Security**: Private VPC with security groups
- 📝 **Audit Logging**: Comprehensive activity logging
- 🚫 **Zero Trust**: No default network access

## 📈 Monitoring and Observability

### Included Monitoring Stack

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Alert Manager**: Alert routing and management
- **Log Aggregation**: Centralized logging with retention

### Key Metrics Tracked

- Platform uptime and availability
- API response times and error rates
- User engagement and platform usage
- Resource utilization and scaling
- Compliance audit trails
- Security events and threats

## 💰 Cost Optimization

### Scaleway Cost Breakdown (Estimated Monthly)

| Component | Configuration | Est. Cost |
|-----------|---------------|-----------|
| Kubernetes Cluster | 8 nodes (mixed) | €400-600 |
| PostgreSQL HA | DB-GP-L | €150-200 |
| Redis Cluster | RED1-L (6 nodes) | €100-150 |
| Load Balancer | LB-GP-L | €20-30 |
| Object Storage | 1TB + transfer | €25-50 |
| Container Registry | Private | €10-20 |
| **Total** | | **€705-1050** |

### Cost Optimization Features

- 🎯 **Auto-scaling**: Scale down during low traffic
- 📦 **Resource Quotas**: Prevent resource waste
- 🗄️ **Storage Tiering**: Cold storage for old content
- ⚡ **Efficient Images**: Optimized container images

## 🔧 Maintenance Operations

### Common Operations

```bash
# Check deployment status
./scaleway/deploy-to-scaleway.sh status

# View logs
./scaleway/deploy-to-scaleway.sh logs

# Update deployment
./scaleway/deploy-to-scaleway.sh deploy

# Destroy infrastructure (⚠️ CAREFUL!)
./scaleway/deploy-to-scaleway.sh destroy
```

### Database Maintenance

```bash
# Connect to PostgreSQL
kubectl exec -it <postgres-pod> -n fanz-production -- psql

# View Redis status  
kubectl exec -it <redis-pod> -n fanz-production -- redis-cli info
```

### Scaling Operations

```bash
# Scale application pods
kubectl scale deployment fanz-app --replicas=10 -n fanz-production

# Scale node pool
scw k8s pool update <pool-id> size=5
```

## 🆘 Troubleshooting

### Common Issues and Solutions

#### 1. Deployment Fails on Prerequisites
```bash
# Install missing tools
brew install scaleway-cli terraform kubectl helm docker

# Verify Scaleway CLI
scw config get access-key
```

#### 2. Kubernetes Connection Issues
```bash
# Reset kubectl configuration
terraform -chdir=scaleway/terraform output -raw cluster_kubeconfig > ~/.kube/config-fanz-production
export KUBECONFIG=~/.kube/config-fanz-production
```

#### 3. SSL Certificate Issues
```bash
# Check cert-manager
kubectl get certificates -n fanz-production
kubectl describe certificate fanz-tls-secret -n fanz-production

# Force renewal
kubectl delete certificate fanz-tls-secret -n fanz-production
```

#### 4. Application Not Responding
```bash
# Check pod status
kubectl get pods -n fanz-production

# View logs
kubectl logs -f deployment/fanz-app -n fanz-production

# Restart deployment
kubectl rollout restart deployment/fanz-app -n fanz-production
```

### Health Check Endpoints

- `GET /api/health` - Application health
- `GET /api/status` - Platform status
- `GET /api/compliance/status` - Compliance status
- `GET /api/web3/status` - Blockchain features
- `GET /api/ai/features` - AI capabilities

## 🔄 CI/CD Integration

### GitLab CI Integration

The deployment can be integrated with GitLab CI for automated deployments:

```yaml
# .gitlab-ci.yml
deploy_production:
  stage: deploy
  image: scaleway/cli:latest
  script:
    - ./scaleway/deploy-to-scaleway.sh
  only:
    - main
  environment:
    name: production
    url: https://fanz.network
```

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml  
name: Deploy to Scaleway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy FANZ
      run: ./scaleway/deploy-to-scaleway.sh
      env:
        SCW_ACCESS_KEY: ${{ secrets.SCW_ACCESS_KEY }}
        SCW_SECRET_KEY: ${{ secrets.SCW_SECRET_KEY }}
```

## 📚 Additional Resources

### Scaleway Documentation
- [Kubernetes Kapsule](https://www.scaleway.com/en/kubernetes-kapsule/)
- [Managed Databases](https://www.scaleway.com/en/database/)
- [Object Storage](https://www.scaleway.com/en/object-storage/)
- [Container Registry](https://www.scaleway.com/en/container-registry/)

### FANZ Documentation
- [API Documentation](https://api.fanz.network/docs)
- [Admin Guide](https://docs.fanz.network/admin)
- [Compliance Guide](https://docs.fanz.network/compliance)
- [Developer Resources](https://dev.fanz.network)

## 🤝 Support

For deployment issues or questions:

- 📧 **Email**: devops@fanz.network  
- 💬 **Discord**: [FANZ Developer Community](https://discord.gg/fanz-dev)
- 📖 **Documentation**: [docs.fanz.network](https://docs.fanz.network)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/FanzCEO/FANZ-Unified-Ecosystem/issues)

## 📜 License

FANZ Unified Ecosystem is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

🌟 **Built with ❤️ by the FANZ Team** | **Empowering Creators Worldwide** 🌟
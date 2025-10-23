# FANZ Warp Directive 🚀

A self-healing, auto-scaling, progressive delivery platform for the FANZ ecosystem built on AWS EKS with GitOps principles.

## 🎯 Overview

The FANZ Warp Directive is a comprehensive cloud-native platform that provides:

- **Self-Healing**: Automated pod restarts, health monitoring, and failure recovery
- **Progressive Delivery**: Canary deployments with automatic rollbacks
- **GitOps**: Argo CD for declarative configuration management
- **Policy Enforcement**: Kyverno for security and compliance automation
- **Observability**: Integrated metrics, logging, and alerting
- **Auto-scaling**: HPA and VPA for optimal resource utilization
- **Security**: Network policies, RBAC, and admission controls

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FANZ Warp Directive                       │
├─────────────────────────────────────────────────────────────────┤
│  GitOps Control Plane  │  Policy Engine  │  Progressive Delivery│
│     (Argo CD)          │   (Kyverno)      │   (Argo Rollouts)   │
├─────────────────────────────────────────────────────────────────┤
│                    Kubernetes (EKS)                            │
├─────────────────────────────────────────────────────────────────┤
│  Ingress (ALB) │ Service Mesh │ Observability │ Security       │
├─────────────────────────────────────────────────────────────────┤
│                    AWS Infrastructure                          │
│  EKS │ RDS │ ElastiCache │ S3 │ CloudWatch │ IAM               │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- kubectl installed and configured
- Helm 3.x installed
- Terraform 1.5+ installed
- Docker installed (for building images)

### 1. Bootstrap the Platform

```bash
# Clone the repository
git clone https://github.com/your-org/FANZ-Unified-Ecosystem.git
cd FANZ-Unified-Ecosystem

# Make scripts executable
chmod +x scripts/*.sh

# Run the bootstrap script
./scripts/bootstrap.sh
```

### 2. Verify Installation

```bash
# Check cluster status
kubectl get nodes

# Check core components
kubectl get pods -n argocd
kubectl get pods -n kyverno

# Check policies
kubectl get clusterpolicy
```

### 3. Access ArgoCD

```bash
# Port forward to ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d

# Open https://localhost:8080
```

## 🛠️ Creating Microservices

The platform provides golden templates for different technology stacks:

### TypeScript/Fastify Service
```bash
# Uses the existing golden-api template
./scripts/deploy-service.sh user-api v1.0.0 fanz-apis
```

### Go Service
```bash
# Generate a new Go microservice
./scripts/generate-go-service.sh payment-service

# Build and deploy
./scripts/deploy-service.sh payment-service v1.0.0 fanz-apis
```

### Python/FastAPI Service
```bash
# Generate a new Python microservice
./scripts/generate-python-service.sh auth-service

# Build and deploy
./scripts/deploy-service.sh auth-service v1.0.0 fanz-apis
```

## 📦 Service Structure

Each microservice includes:

```
services/my-service/
├── app/
│   ├── main.go/py/ts         # Application code
│   ├── Dockerfile            # Multi-stage container build
│   └── package.json/go.mod/requirements.txt
└── helm/
    └── my-service/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── rollout.yaml   # Argo Rollouts deployment
            └── service.yaml   # Kubernetes services
```

## 🔄 Deployment Process

1. **Build**: Docker images are built and pushed to ECR
2. **Deploy**: Helm charts deploy Argo Rollouts resources
3. **Canary**: Traffic is gradually shifted to new version
4. **Analysis**: Prometheus metrics determine rollout success
5. **Promote/Rollback**: Automatic promotion or rollback based on analysis

## 🛡️ Self-Healing Features

### Pod Auto-Restart
```yaml
# Kyverno policy automatically restarts crashlooping pods
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: fun-autofix-safe
spec:
  rules:
  - name: restart-crashloop-pods
    match:
      any:
      - resources:
          kinds:
          - Pod
```

### Rollback on Failure
```yaml
# Argo Rollouts automatically rollback failed deployments
analysis:
  successCondition: result[0] < 0.05  # 5% error rate threshold
  failureLimit: 3
```

### Health Monitoring
```yaml
# GitHub Actions hourly health checks
- name: Health Check
  run: |
    kubectl get pods --all-namespaces | grep -v Running
    ./scripts/health-check.sh
```

## 📊 Observability

### Metrics Collection
- **Prometheus**: Collects application and infrastructure metrics
- **AWS Managed Prometheus**: Centralized metrics storage
- **Grafana**: Visualization and alerting

### Health Endpoints
All services expose standard endpoints:
- `/healthz` - Health check
- `/readiness` - Readiness probe
- `/metrics` - Prometheus metrics
- `/diagnostics` - Detailed service information

## 🔒 Security

### Network Policies
```yaml
# Microsegmentation with Cilium/Calico
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-default
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### Pod Security Standards
```yaml
# Kyverno enforces security standards
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

## 🔧 Configuration

### Environment Variables
```bash
export AWS_REGION=us-east-1
export CLUSTER_NAME=fz-prod-60a56503
export DOMAIN=myfanz.network
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

### Terraform Variables
```hcl
# terraform/environments/production.tfvars
cluster_name = "fz-prod-60a56503"
region = "us-east-1"
node_instance_types = ["t3.medium", "t3.large"]
min_size = 2
max_size = 10
desired_size = 3
```

## 🚨 Monitoring & Alerts

### Slack Notifications
Set up the `SLACK_WEBHOOK_URL` secret in your GitHub repository for automated alerts.

### Health Check Workflow
```yaml
# .github/workflows/hourly-health.yml
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
```

## 🛠️ Troubleshooting

### Common Issues

1. **Pod CrashLoopBackOff**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name> --previous
   ```

2. **Rollout Stuck**
   ```bash
   kubectl argo rollouts get rollout <rollout-name>
   kubectl argo rollouts abort <rollout-name>
   ```

3. **ArgoCD Sync Issues**
   ```bash
   kubectl get application -n argocd
   argocd app sync <app-name>
   ```

### Debug Commands
```bash
# Check cluster health
./scripts/cluster-health.sh

# View all FANZ resources
kubectl get all -l app.kubernetes.io/part-of=fanz

# Check Kyverno policies
kubectl get cpol,pol -A
```

## 📈 Scaling

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Autoscaler
The EKS cluster automatically scales nodes based on pod scheduling demands.

## 🔄 Updates & Maintenance

### Dependency Updates
Renovate bot automatically creates PRs for dependency updates:
```json
{
  "extends": ["config:base"],
  "schedule": ["after 2am and before 4am on monday"]
}
```

### Platform Updates
```bash
# Update Helm charts
helm repo update
helm upgrade argocd argo/argo-cd -n argocd
helm upgrade kyverno kyverno/kyverno -n kyverno
```

## 📋 Best Practices

1. **Resource Limits**: Always set resource requests and limits
2. **Health Probes**: Implement proper liveness and readiness probes
3. **Graceful Shutdown**: Handle SIGTERM signals properly
4. **Secrets Management**: Use Kubernetes secrets and AWS Secrets Manager
5. **Immutable Images**: Tag images with specific versions, not 'latest'
6. **Network Policies**: Implement least-privilege network access
7. **RBAC**: Use fine-grained permissions
8. **Backup**: Regular backups of persistent data

## 🤝 Contributing

1. Create a feature branch
2. Make changes and test locally
3. Run the test suite: `./scripts/test-all.sh`
4. Submit a pull request
5. ArgoCD will automatically deploy approved changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the FANZ ecosystem

For questions or support, reach out to the platform team or create an issue in this repository.
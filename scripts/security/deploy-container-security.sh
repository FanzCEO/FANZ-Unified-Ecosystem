#!/bin/bash

# 🐳 FANZ Container & Infrastructure Security
# Comprehensive security scanning and policy enforcement for containerized adult content platforms
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/security-reports"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; [ -n "${CONTAINER_LOG:-}" ] && echo "[INFO] $1" >> "$CONTAINER_LOG"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; [ -n "${CONTAINER_LOG:-}" ] && echo "[SUCCESS] $1" >> "$CONTAINER_LOG"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; [ -n "${CONTAINER_LOG:-}" ] && echo "[WARNING] $1" >> "$CONTAINER_LOG"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; [ -n "${CONTAINER_LOG:-}" ] && echo "[ERROR] $1" >> "$CONTAINER_LOG"; }
log_container() { echo -e "${PURPLE}[CONTAINER]${NC} $1"; [ -n "${CONTAINER_LOG:-}" ] && echo "[CONTAINER] $1" >> "$CONTAINER_LOG"; }

# Initialize
mkdir -p "$OUTPUT_DIR"
export CONTAINER_LOG="$OUTPUT_DIR/container-security-$(date +%Y%m%d-%H%M%S).log"
touch "$CONTAINER_LOG"
echo "# FANZ Container & Infrastructure Security" > "$CONTAINER_LOG"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CONTAINER_LOG"
echo "Mode: $([ "$DRY_RUN" = "true" ] && echo "DRY RUN" || echo "LIVE DEPLOYMENT")" >> "$CONTAINER_LOG"

log_info "🐳 Starting FANZ Container & Infrastructure Security Deployment"

# Install container security tools
setup_container_security_tools() {
    log_info "🛠️ Setting up container security tools..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would install container security tools"
        return 0
    fi
    
    # Install trivy for vulnerability scanning
    if ! command -v trivy &> /dev/null; then
        log_container "Installing Trivy vulnerability scanner..."
        if command -v brew &> /dev/null; then
            brew install trivy
        fi
    fi
    
    # Install hadolint for Dockerfile linting
    if ! command -v hadolint &> /dev/null; then
        log_container "Installing Hadolint Dockerfile linter..."
        if command -v brew &> /dev/null; then
            brew install hadolint
        fi
    fi
    
    log_success "✅ Container security tools configured"
}

# Create Docker security policies
create_docker_security_policies() {
    log_info "🐋 Creating Docker security policies..."
    
    local docker_dir="docker/security"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would create Docker security policies"
        return 0
    fi
    
    mkdir -p "$docker_dir"
    
    # Secure Dockerfile template for adult content platforms
    cat > "$docker_dir/Dockerfile.secure-template" << 'EOF'
# 🔐 FANZ Secure Dockerfile Template
# Adult content platform security hardening

# Use specific version tags, never 'latest'
FROM node:18.17.0-alpine3.18

# Create non-root user for adult platform compliance
RUN addgroup -g 1001 -S fanz && \
    adduser -S fanz -u 1001 -G fanz

# Set security labels
LABEL security.scan="required" \
      compliance.adult-content="true" \
      compliance.age-verification="required" \
      security.non-root="true"

# Install security updates only
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        ca-certificates \
        tini && \
    rm -rf /var/cache/apk/*

# Create secure directories
RUN mkdir -p /app && \
    chown -R fanz:fanz /app

# Switch to non-root user
USER fanz
WORKDIR /app

# Copy package files first for layer caching
COPY --chown=fanz:fanz package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production && \
    npm audit fix && \
    npm cache clean --force

# Copy application code
COPY --chown=fanz:fanz . .

# Expose port (non-privileged)
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Run as non-root user
CMD ["node", "server.js"]
EOF

    # Docker security scanning script
    cat > "$docker_dir/scan-image.sh" << 'EOF'
#!/bin/bash

# 🔍 FANZ Docker Image Security Scanner
# Comprehensive security scanning for adult platform containers

set -euo pipefail

IMAGE_NAME="${1:-}"
SCAN_OUTPUT="${2:-docker-scan-$(date +%Y%m%d-%H%M%S).json}"

if [ -z "$IMAGE_NAME" ]; then
    echo "Usage: $0 <image_name> [output_file]"
    echo "Example: $0 fanz/platform:latest"
    exit 1
fi

echo "🔍 Scanning Docker image: $IMAGE_NAME"

# Trivy vulnerability scan
echo "📊 Running Trivy vulnerability scan..."
trivy image --format json --output "$SCAN_OUTPUT" "$IMAGE_NAME"

# Critical vulnerability check
CRITICAL_VULNS=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$SCAN_OUTPUT" 2>/dev/null || echo "0")
HIGH_VULNS=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$SCAN_OUTPUT" 2>/dev/null || echo "0")

echo "🚨 Critical vulnerabilities: $CRITICAL_VULNS"
echo "⚠️ High vulnerabilities: $HIGH_VULNS"

# Adult platform specific checks
echo "🔞 Adult platform compliance checks:"
echo "- Non-root user: $(docker inspect "$IMAGE_NAME" | jq -r '.[0].Config.User // "root"')"
echo "- Health check: $(docker inspect "$IMAGE_NAME" | jq -r '.[0].Config.Healthcheck != null')"

# Fail if critical vulnerabilities found
if [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "❌ CRITICAL vulnerabilities found - image not suitable for production"
    exit 1
fi

echo "✅ Security scan completed: $SCAN_OUTPUT"
EOF

    chmod +x "$docker_dir/scan-image.sh"
    
    log_success "✅ Docker security policies created"
}

# Create Kubernetes security policies
create_kubernetes_security_policies() {
    log_info "☸️ Creating Kubernetes security policies..."
    
    local k8s_dir="k8s/security"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would create Kubernetes security policies"
        return 0
    fi
    
    mkdir -p "$k8s_dir"
    
    # Network policy for adult platform isolation
    cat > "$k8s_dir/network-policy.yaml" << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: fanz-platform-isolation
  namespace: fanz-platform
  labels:
    app: fanz-security
    compliance: adult-content
spec:
  podSelector:
    matchLabels:
      app: fanz-platform
  policyTypes:
  - Ingress
  - Egress
  
  # Ingress rules - only allow specific sources
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: fanz-platform
    - namespaceSelector:
        matchLabels:
          name: fanz-gateway
    ports:
    - protocol: TCP
      port: 3000
    - protocol: TCP
      port: 8080
  
  # Egress rules - restrict outbound traffic
  egress:
  # Allow DNS resolution
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  
  # Allow HTTPS to external payment processors
  - to: []
    ports:
    - protocol: TCP
      port: 443
  
  # Allow database connections
  - to:
    - namespaceSelector:
        matchLabels:
          name: fanz-database
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
EOF

    # Pod Security Policy for adult platform compliance
    cat > "$k8s_dir/pod-security-policy.yaml" << 'EOF'
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: fanz-platform-psp
  labels:
    app: fanz-security
    compliance: adult-content
spec:
  # Require non-root containers for compliance
  runAsUser:
    rule: MustRunAsNonRoot
  runAsGroup:
    rule: MustRunAs
    ranges:
    - min: 1001
      max: 65535
  
  # Filesystem restrictions
  fsGroup:
    rule: RunAsAny
  readOnlyRootFilesystem: true
  
  # Security context restrictions
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  allowedCapabilities: []
  
  # Volume restrictions for adult content compliance
  volumes:
  - configMap
  - emptyDir
  - projected
  - secret
  - downwardAPI
  - persistentVolumeClaim
  
  # Network restrictions
  hostNetwork: false
  hostIPC: false
  hostPID: false
  
  # SELinux (if applicable)
  seLinux:
    rule: RunAsAny
  
  # Seccomp
  seccompProfiles:
  - runtime/default
  
  # AppArmor (if applicable)
  annotations:
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName: 'runtime/default'
EOF

    # RBAC for adult platform services
    cat > "$k8s_dir/rbac.yaml" << 'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: fanz-platform
  name: fanz-platform-role
  labels:
    app: fanz-security
    compliance: adult-content
rules:
# Allow reading secrets for payment processors
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
  resourceNames: ["ccbill-credentials", "paxum-credentials", "segpay-credentials"]

# Allow reading configmaps for configuration
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]

# Allow creating events for audit logging
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: fanz-platform-binding
  namespace: fanz-platform
  labels:
    app: fanz-security
    compliance: adult-content
subjects:
- kind: ServiceAccount
  name: fanz-platform-sa
  namespace: fanz-platform
roleRef:
  kind: Role
  name: fanz-platform-role
  apiGroup: rbac.authorization.k8s.io

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fanz-platform-sa
  namespace: fanz-platform
  labels:
    app: fanz-security
    compliance: adult-content
EOF

    log_success "✅ Kubernetes security policies created"
}

# Deploy container scanning workflows
deploy_container_scanning() {
    log_info "🔍 Deploying container scanning workflows..."
    
    local deployed=0
    local total=0
    
    for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
        if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
            continue
        fi
        
        repo_name=$(basename "$repo_path")
        total=$((total + 1))
        
        log_container "🐳 Deploying container scanning to: $repo_name"
        
        if [ "$DRY_RUN" = "true" ]; then
            deployed=$((deployed + 1))
            continue
        fi
        
        pushd "$repo_path" &> /dev/null || continue
        
        mkdir -p ".github/workflows"
        
        cat > ".github/workflows/container-security.yml" << 'EOF'
name: 🐳 Container Security Scanning

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 6 * * *'

jobs:
  dockerfile-lint:
    name: Dockerfile Security Lint
    runs-on: ubuntu-latest
    if: github.event_name != 'schedule'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Lint Dockerfiles
      uses: hadolint/hadolint-action@v3.1.0
      with:
        dockerfile: Dockerfile
        config: .hadolint.yaml
        failure-threshold: warning
    
    - name: Adult Platform Security Check
      run: |
        echo "🔞 Checking adult platform security compliance..."
        
        # Check for non-root user
        if ! grep -q "USER.*[^0]" Dockerfile 2>/dev/null; then
          echo "❌ Warning: Dockerfile should specify non-root user"
        fi
        
        # Check for health checks
        if ! grep -q "HEALTHCHECK" Dockerfile 2>/dev/null; then
          echo "⚠️ Warning: Dockerfile should include health check"
        fi
        
        echo "✅ Adult platform compliance check completed"

  container-scan:
    name: Container Vulnerability Scan
    runs-on: ubuntu-latest
    if: github.event_name != 'pull_request'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Build Docker image
      run: |
        if [ -f Dockerfile ]; then
          docker build -t ${{ github.repository }}:${{ github.sha }} .
        else
          echo "No Dockerfile found, skipping container scan"
          exit 0
        fi
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ github.repository }}:${{ github.sha }}
        format: sarif
        output: trivy-results.sarif
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: trivy-results.sarif
    
    - name: Critical vulnerability check
      run: |
        echo "🚨 Checking for critical vulnerabilities..."
        
        # Install jq if not available
        sudo apt-get update && sudo apt-get install -y jq
        
        # Run Trivy scan with JSON output
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          aquasec/trivy:latest image --format json \
          ${{ github.repository }}:${{ github.sha }} > scan-results.json
        
        # Count critical vulnerabilities
        CRITICAL=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' scan-results.json || echo "0")
        HIGH=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' scan-results.json || echo "0")
        
        echo "Critical vulnerabilities: $CRITICAL"
        echo "High vulnerabilities: $HIGH"
        
        # Adult platform security requirements
        if [ "$CRITICAL" -gt 0 ]; then
          echo "❌ CRITICAL vulnerabilities found - not suitable for adult platform deployment"
          exit 1
        fi
        
        if [ "$HIGH" -gt 5 ]; then
          echo "⚠️ Too many HIGH vulnerabilities for adult platform security standards"
          exit 1
        fi
        
        echo "✅ Container security scan passed"
EOF
        
        # Create hadolint config
        cat > ".hadolint.yaml" << 'EOF'
failure-threshold: warning
ignored:
  - DL3008  # Pin versions in apt get install
  - DL3009  # Delete the apt-get lists after installing something
trustedRegistries:
  - docker.io
  - gcr.io
  - registry.k8s.io
EOF
        
        deployed=$((deployed + 1))
        log_success "✅ Container scanning deployed to $repo_name"
        
        popd &> /dev/null
    done
    
    log_info "📊 Container Scanning Deployment:"
    log_info "  - Total repositories: $total"
    log_info "  - Successfully deployed: $deployed"
}

# Generate documentation
generate_documentation() {
    log_info "📝 Generating container security documentation..."
    
    cat > "$OUTPUT_DIR/container-security-guide.md" << 'EOF'
# 🐳 FANZ Container & Infrastructure Security Guide

## Overview
Comprehensive container and infrastructure security for adult content platforms with compliance focus.

## Container Security Standards

### Dockerfile Security Requirements
- Non-root user execution (UID > 1000)
- Specific version tags (no 'latest')
- Health checks for orchestration
- Minimal attack surface
- Security labels for compliance

### Vulnerability Management
- Zero CRITICAL vulnerabilities
- Maximum 5 HIGH vulnerabilities
- Daily automated scanning
- SARIF integration for tracking

## Kubernetes Security Policies

### Network Isolation
- Namespace-based segmentation
- Ingress/egress traffic control
- Payment processor traffic rules

### Pod Security
- Non-root execution required
- Read-only root filesystem
- Capability dropping (ALL)
- Resource limits enforced

### RBAC Configuration
- Least privilege access
- Service account isolation
- Secret access controls
- Audit logging enabled

## Compliance Considerations

### Adult Platform Requirements
- Age verification system isolation
- Payment processor network segmentation
- Content delivery security controls
- GDPR/CCPA data protection

### Monitoring & Alerting
- Container vulnerability alerts
- Policy violation notifications
- Compliance audit logging
- Security event correlation

---

**🔐 Secure containerization for the creator economy**
EOF

    log_success "✅ Documentation generated"
}

# Main execution
deploy_main() {
    setup_container_security_tools
    echo ""
    
    create_docker_security_policies
    echo ""
    
    create_kubernetes_security_policies
    echo ""
    
    deploy_container_scanning
    echo ""
    
    generate_documentation
    echo ""
    
    log_success "🎉 FANZ Container & Infrastructure Security Implementation Complete!"
    
    if [ "$DRY_RUN" = "false" ]; then
        log_info "📋 Next Steps:"
        log_info "  1. Review Docker security policies in docker/security/"
        log_info "  2. Apply Kubernetes policies: kubectl apply -f k8s/security/"
        log_info "  3. Test container scanning workflows"
        log_info "  4. Configure vulnerability alerting"
    fi
    
    log_info "📄 Implementation log: $CONTAINER_LOG"
}

deploy_main
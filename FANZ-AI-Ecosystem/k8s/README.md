# Kubernetes Deployment Manifests

This directory contains all Kubernetes deployment manifests for the FANZ AI Ecosystem.

## Directory Structure

```
k8s/
├── README.md                           # This file
├── namespace.yaml                      # Namespace definition
├── configmaps/                         # ConfigMaps for services
├── secrets/                            # Secret manifests (templates)
├── ai-intelligence-hub-deployment.yaml
├── ai-intelligence-hub-service.yaml
├── ai-intelligence-hub-ingress.yaml
├── ai-creator-assistant-deployment.yaml
├── ai-creator-assistant-service.yaml
├── ai-creator-assistant-ingress.yaml
├── content-curation-engine-deployment.yaml
├── content-curation-engine-service.yaml
├── content-curation-engine-ingress.yaml
├── content-distribution-network-deployment.yaml
├── content-distribution-network-service.yaml
├── content-distribution-network-ingress.yaml
├── security-privacy-framework-deployment.yaml
├── security-privacy-framework-service.yaml
├── security-privacy-framework-ingress.yaml
├── compliance-accessibility-excellence-deployment.yaml
├── compliance-accessibility-excellence-service.yaml
└── compliance-accessibility-excellence-ingress.yaml
```

## Deployment Order

1. **Namespace**: `kubectl apply -f namespace.yaml`
2. **Secrets**: `kubectl apply -f secrets/`
3. **ConfigMaps**: `kubectl apply -f configmaps/`
4. **Services**: `kubectl apply -f *-service.yaml`
5. **Deployments**: `kubectl apply -f *-deployment.yaml`
6. **Ingress**: `kubectl apply -f *-ingress.yaml`

## Environment Variables

The following environment variables are used in deployment templates:

- `REGISTRY`: Docker registry URL (default: ghcr.io/joshuastone)
- `VERSION`: Image version tag (default: latest)
- `NAMESPACE`: Kubernetes namespace (default: fanz-ai-ecosystem)

## Quick Deploy

```bash
# Set environment variables
export REGISTRY="ghcr.io/joshuastone"
export VERSION="v1.0.0"
export NAMESPACE="fanz-ai-ecosystem"

# Apply all manifests
envsubst < namespace.yaml | kubectl apply -f -
kubectl apply -f secrets/
kubectl apply -f configmaps/
envsubst < *.yaml | kubectl apply -f -
```

## Health Checks

All services include:
- Readiness probes on `/health` endpoint
- Liveness probes on `/health` endpoint
- Resource limits and requests
- Rolling update strategy

## Monitoring

Services are configured with:
- Prometheus metrics scraping
- Health check endpoints
- Structured logging
- Request tracing
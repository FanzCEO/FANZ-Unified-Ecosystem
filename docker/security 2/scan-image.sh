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

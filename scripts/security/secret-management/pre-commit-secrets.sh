#!/bin/bash

# 🔍 Pre-commit Secret Detection Hook
# Prevents secrets from being committed to FANZ repositories

set -euo pipefail

echo "🔍 Scanning for secrets before commit..."

# Check if gitleaks is available
if ! command -v gitleaks &> /dev/null; then
    echo "⚠️ Gitleaks not found - installing..."
    if command -v brew &> /dev/null; then
        brew install gitleaks
    else
        echo "❌ Please install gitleaks manually: https://github.com/zricethezav/gitleaks"
        exit 1
    fi
fi

# Run gitleaks on staged files
if gitleaks protect --config .gitleaks.toml --staged --verbose; then
    echo "✅ No secrets detected - commit allowed"
    exit 0
else
    echo "🚨 SECRETS DETECTED - Commit blocked!"
    echo ""
    echo "🔧 Remediation steps:"
    echo "1. Remove secrets from staged files"
    echo "2. Use environment variables instead"
    echo "3. Add secrets to .env files (and .gitignore)"
    echo "4. For FANZ platform secrets, use FanzDash secret management"
    echo ""
    echo "💡 Adult content platform reminder:"
    echo "- Payment processor keys (CCBill, Paxum, Segpay) are CRITICAL"
    echo "- Age verification API keys must be secured"
    echo "- Content moderation tokens require special handling"
    exit 1
fi

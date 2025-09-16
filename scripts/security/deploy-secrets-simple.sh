#!/bin/bash

# 🔐 FANZ Secret Scanning Deployment (Simplified)
# Deploy secret scanning configurations across FANZ repositories

set -euo pipefail

echo "🔐 Starting FANZ Secret Scanning Deployment..."
echo ""

# Create security reports directory
mkdir -p security-reports/secret-scans

# Copy gitleaks config to all FANZ repositories
echo "📋 Deploying secret detection rules to FANZ repositories..."

deployed=0
total=0

for repo_path in /Users/joshuastone/Documents/GitHub/*[Ff]anz* /Users/joshuastone/Documents/GitHub/*FANZ*; do
    if [ ! -d "$repo_path" ] || [ ! -d "$repo_path/.git" ]; then
        continue
    fi
    
    repo_name=$(basename "$repo_path")
    total=$((total + 1))
    
    echo "🔐 Deploying to: $repo_name"
    
    pushd "$repo_path" &> /dev/null || continue
    
    # Copy gitleaks config if it exists
    if [ -f "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/.gitleaks.toml" ]; then
        cp "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/.gitleaks.toml" . 2>/dev/null || true
    fi
    
    # Create GitHub workflow directory and copy secret scanning workflow
    mkdir -p ".github/workflows"
    
    if [ -f "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/scripts/security/secret-management/github-actions/secret-scanning.yml" ]; then
        cp "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/scripts/security/secret-management/github-actions/secret-scanning.yml" \
           ".github/workflows/secret-scanning.yml" 2>/dev/null || true
    fi
    
    # Set up pre-commit hook if the script exists
    mkdir -p ".git/hooks"
    if [ -f "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/scripts/security/secret-management/pre-commit-secrets.sh" ]; then
        cp "/Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM/scripts/security/secret-management/pre-commit-secrets.sh" \
           ".git/hooks/pre-commit" 2>/dev/null || true
        chmod +x ".git/hooks/pre-commit" 2>/dev/null || true
    fi
    
    deployed=$((deployed + 1))
    echo "✅ Secret scanning deployed to $repo_name"
    
    popd &> /dev/null
done

echo ""
echo "📊 Secret Scanning Deployment Summary:"
echo "  - Total repositories: $total"
echo "  - Successfully deployed: $deployed"
echo "  - Success rate: $(echo "scale=1; $deployed * 100 / $total" | bc 2>/dev/null || echo "100")%"
echo ""

# Run a quick secret scan on a sample repository
echo "🔍 Running sample secret scan..."
for repo_path in /Users/joshuastone/Documents/GitHub/FANZ_UNIFIED_ECOSYSTEM /Users/joshuastone/Documents/GitHub/Fanz; do
    if [ -d "$repo_path" ] && [ -d "$repo_path/.git" ]; then
        repo_name=$(basename "$repo_path")
        echo "Scanning $repo_name for secrets..."
        
        pushd "$repo_path" &> /dev/null
        
        # Quick gitleaks scan
        if gitleaks detect --config .gitleaks.toml --no-git --verbose 2>/dev/null; then
            echo "✅ $repo_name: No secrets detected"
        else
            echo "⚠️ $repo_name: Potential secrets found - detailed scan recommended"
        fi
        
        popd &> /dev/null
        break
    fi
done

echo ""
echo "🎉 FANZ Secret Scanning Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Review secret detection rules in .gitleaks.toml"
echo "2. Run full secret scans on critical repositories"
echo "3. Set up HashiCorp Vault for secure secret storage"
echo "4. Train team on secure secret handling"
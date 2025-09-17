#!/usr/bin/env bash
set -euo pipefail
ORG="${1:?Usage: $0 <org> <repo>}"
REPO="${2:?Usage: $0 <org> <repo>}"
echo "Setting protections for $ORG/$REPO"
gh api   -X PUT   -H "Accept: application/vnd.github+json"   "/repos/$ORG/$REPO/branches/main/protection"   -f required_status_checks='{"strict":true,"contexts":["CI","CodeQL","Trivy","Gitleaks","Dependency Review"]}'   -f enforce_admins=true   -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}'   -f restrictions='null'

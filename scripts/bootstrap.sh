#!/usr/bin/env bash
set -euo pipefail
ORG="${1:-FanzCEO}"

echo "→ Cloning all repos for org $ORG ..."
gh repo list "$ORG" --limit 200 --json name,sshUrl | jq -r '.[].sshUrl' | while read -r url; do
  git clone "$url" || true
done

echo "→ Enabling security features & protections..."
while read -r name; do
  echo "  • $name"
  # Require PRs to main, dismiss stale reviews, enforce admins
  gh api     -X PUT     -H "Accept: application/vnd.github+json"     "/repos/$ORG/$name/branches/main/protection"     -f required_status_checks='{"strict":true,"contexts":["CI","CodeQL","Trivy","Gitleaks","Dependency Review"]}'     -f enforce_admins=true     -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}'     -f restrictions='null' || true

  # Enable secret scanning & push protection
  gh api -X PUT "/repos/$ORG/$name/secret-scanning" -f state=enabled || true
  gh api -X PUT "/repos/$ORG/$name/secret-scanning/alerts" -f state=enabled || true
  gh api -X PUT "/repos/$ORG/$name/push-protection/enforcement" -f enabled=true || true
done < <(gh repo list "$ORG" --limit 200 --json name | jq -r '.[].name')

echo "→ Done. Open PRs will gate merges via required checks."

# FANZ Bootstrap Pack

This bundle gives you:
- **OpenAPI specs** for the API Gateway and Finance services
- **Event JSON Schemas** for the Event Bus (`fanz_central_command`)
- **CI/CD workflows** (CI, CodeQL, Trivy, Gitleaks, Dependency Review)
- **Monorepo config** (pnpm workspace + Turbo)
- **Docker Compose** for local integration (Postgres, Kafka, MinIO, OpenSearch)
- **Org scripts** using `gh` CLI to clone all repos and enforce branch protection

## Quick start
```bash
unzip FUN_bootstrap.zip -d ./fanz-bootstrap
cd fanz-bootstrap
# optional: preview OpenAPI
npx @redocly/cli preview-docs openapi/gateway.yaml
# local stack
docker compose up -d
```

## Wire into your repo
Copy the `.github/workflows/*.yml`, `events/`, and `openapi/` folders into each service repo or into the monorepo root.
Ensure branch protections require these checks: **CI**, **CodeQL**, **Trivy**, **Gitleaks**, **Dependency Review**.

## Automate org setup
Requires GitHub CLI (`gh`) and org admin permissions.
```bash
bash scripts/bootstrap.sh FanzCEO
# or per-repo
bash scripts/enforce-branch-protection.sh FanzCEO FANZ-Unified-Ecosystem
```

## Contracts
- Update schemas as code. Breaking changes trigger CI failures across dependents.
- Publish an internal npm package (`@fanz/events`) backed by `events/schemas` for runtime validation.

# Branching Strategy

## Overview
This document outlines the branching strategy for the FANZ Unified Ecosystem repository to ensure consistent development practices and maintain code quality.

## Branch Types

### Main Branch
- **Branch**: `main`
- **Purpose**: Production-ready code
- **Protection**: ✅ Protected with required reviews and CI checks
- **Direct commits**: ❌ Not allowed

### Work Branches
Use the following prefixes for feature branches:

- **feat/*** - New features and enhancements
- **fix/*** - Bug fixes and patches  
- **chore/*** - Maintenance tasks, dependency updates
- **docs/*** - Documentation updates
- **refactor/*** - Code refactoring without functionality changes
- **ci/*** - CI/CD configuration changes

### Release Branches
- **release/*** - Only when tagging stabilized versions for production
- Used for final testing and minor fixes before release

## Workflow

1. **Create branch**: `git checkout -b feat/feature-name`
2. **Develop**: Make changes and commit regularly
3. **Push**: `git push origin feat/feature-name`
4. **Pull Request**: Open PR against `main` branch
5. **Review**: Required code review and CI checks
6. **Merge**: Squash and merge after approval
7. **Cleanup**: Branch is automatically deleted after merge

## Branch Protection Rules

### Main Branch Protection
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions
- ❌ Allow force pushes
- ❌ Allow deletions

### Automatic Cleanup
- Merged branches are automatically deleted
- Stale branches (>180 days) are archived and removed
- Regular cleanup maintains repository hygiene

## Best Practices

1. **Descriptive Names**: Use clear, descriptive branch names
2. **Small Changes**: Keep branches focused and small
3. **Regular Updates**: Rebase frequently to stay current with main
4. **Clean History**: Squash commits before merging
5. **Testing**: Ensure all tests pass before creating PR

## Examples

```bash
# Feature development
git checkout -b feat/payment-processor-integration
git checkout -b feat/user-dashboard-redesign

# Bug fixes
git checkout -b fix/login-session-timeout
git checkout -b fix/payment-validation-error

# Documentation
git checkout -b docs/api-reference-update
git checkout -b docs/deployment-guide

# Maintenance
git checkout -b chore/dependency-updates
git checkout -b chore/security-patches
```

## Compliance Notes

This branching strategy supports:
- ✅ FANZ branding compliance (no FANZ prefixes)
- ✅ Adult-friendly payment processor requirements
- ✅ ADA and accessibility standards
- ✅ GDPR compliance workflows
- ✅ Security-first development practices

---

*Last updated: September 27, 2025*
*Applies to: FANZ Unified Ecosystem Repository*
# Container Setup for FanzProtect

## GitHub Container Registry Setup

This repository is configured to automatically build and push Docker images to GitHub Container Registry (ghcr.io).

### Prerequisites
- GitHub Actions is enabled for this repository
- Container registry is enabled in repository settings
- Proper permissions are set for GITHUB_TOKEN

### Automated Builds
- Images are built on every push to main/develop branches  
- Images are tagged with branch names, commit SHAs, and semantic versions
- Security scanning is performed using Trivy
- Multi-platform builds (AMD64/ARM64) are supported

### Manual Build
To build locally:
```bash
docker build -t fanzprotect .
docker run -p 8080:8080 fanzprotect
```

### Registry Access
Images are available at: `ghcr.io/fanzceo/fanzprotect`

### Deployment
The workflow includes automatic deployment to staging on main branch pushes.
Configure your deployment targets in the workflow file.

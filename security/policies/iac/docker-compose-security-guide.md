# 🐳 FANZ Docker Compose Security Guide

## 🛡️ Security Best Practices

### 1. Container Security
```yaml
services:
  app:
    # Use specific image tags with digests
    image: app:1.0@sha256:abc123...
    
    # Run as non-root user
    user: "65532:65532"
    
    # Read-only root filesystem
    read_only: true
    
    # Drop capabilities
    cap_drop:
      - ALL
    
    # No privilege escalation
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined
    
    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 2. Network Security
```yaml
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
  backend:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.21.0.0/24
```

### 3. Secrets Management
```yaml
secrets:
  db_password:
    external: true
    name: fanz_db_password_v1
  
  api_key:
    external: true
    name: fanz_api_key_v1

services:
  app:
    secrets:
      - db_password
      - api_key
```

### 4. Volume Security
```yaml
volumes:
  app_data:
    driver: local
    driver_opts:
      type: none
      device: /secure/app/data
      o: bind,noexec,nosuid,nodev
```

## ⚠️ Common Security Issues to Avoid

1. **Avoid running as root**
   ```yaml
   # DON'T DO THIS
   user: root
   privileged: true
   ```

2. **Don't expose unnecessary ports**
   ```yaml
   # DON'T DO THIS
   ports:
     - "0.0.0.0:3306:3306"  # Exposes DB to internet
   ```

3. **Don't use latest tags**
   ```yaml
   # DON'T DO THIS
   image: nginx:latest
   ```

4. **Don't embed secrets in environment variables**
   ```yaml
   # DON'T DO THIS
   environment:
     - DATABASE_PASSWORD=supersecret123
   ```

## 🔍 Security Validation

```bash
# Scan Docker Compose file
checkov -f docker-compose.yml

# Check for secrets in files
git secrets --scan docker-compose.yml

# Validate container security
docker-compose config | yq eval '.services[].security_opt'

# Test network isolation
docker-compose exec app ping backend_service
```


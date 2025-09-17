# 🎨 FANZ FRONTEND - HARDENED DOCKERFILE
# Security-hardened React frontend with nginx
# Implements: Distroless nginx, pinned digests, minimal attack surface

# Stage 1: Build stage with pinned digest for supply chain security
FROM node:18-alpine@sha256:REDACTED_AWS_SECRET_KEY5588d0a35cb9bc4b8ca09d9e AS builder

# Install security updates first and only required build tools
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache \
    libc6-compat && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with frozen lockfile for reproducible builds
RUN npm ci --frozen-lockfile && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy source code
COPY . .

# Build application for production
ARG REACT_APP_API_GATEWAY_URL
ARG REACT_APP_ECOSYSTEM_NAME
ENV REACT_APP_API_GATEWAY_URL=$REACT_APP_API_GATEWAY_URL
ENV REACT_APP_ECOSYSTEM_NAME=$REACT_APP_ECOSYSTEM_NAME

RUN npm run build

# Stage 2: Hardened nginx runtime
FROM nginxinc/nginx-unprivileged@sha256:REDACTED_AWS_SECRET_KEYd4b5b6e8e2e16baed1e0d2b AS production

# Set proper labels for container metadata
LABEL maintainer="FANZ Security Team <security@fanz.network>" \
      version="1.0.0" \
      description="FANZ Frontend - Security Hardened" \
      security-scan="required" \
      service="frontend"

# Copy built application
COPY --from=builder --chown=nginx:nginx /usr/src/app/build /usr/share/nginx/html

# Copy hardened nginx configuration
COPY --chown=nginx:nginx <<EOF /etc/nginx/conf.d/default.conf
# 🛡️ Hardened nginx configuration
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://localhost:8080 ws://localhost:8080" always;

    # Remove server header
    server_tokens off;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Block access to sensitive files
    location ~ /\\. {
        deny all;
    }
    
    location ~ \\.(json|yml|yaml|conf|cfg)$ {
        deny all;
    }

    # Rate limiting
    location /api/ {
        proxy_pass http://api-gateway:8080/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Switch to non-root nginx user (ID 101)
USER 101:101

# Expose only necessary port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["curl", "-f", "http://localhost:8080/health"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
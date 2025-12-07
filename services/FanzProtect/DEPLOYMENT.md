# 🛡️ FanzProtect Legal Platform - Deployment Guide

Complete guide for deploying and managing the FanzProtect legal protection platform within the FANZ ecosystem.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [FANZ Ecosystem Integration](#fanz-ecosystem-integration)
7. [Monitoring & Observability](#monitoring--observability)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## 🔧 Prerequisites

### System Requirements

- **Node.js**: v18+ (LTS recommended)
- **Docker**: v20+ with Docker Compose
- **PostgreSQL**: v13+ (for local development)
- **Redis**: v6+ (for caching and sessions)
- **Git**: Latest version

### FANZ Ecosystem Services

Ensure the following FANZ services are deployed and accessible:

- **FanzSSO**: Authentication service
- **FanzDash**: Administrative dashboard  
- **FanzFinance OS**: Billing and payment processing
- **FanzMediaCore**: Media storage and CDN
- **FanzSecurityCompDash**: Compliance and audit

## 🏗️ Local Development

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/fanz-ecosystem/fanzprotect.git
cd fanzprotect

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your local configuration:

```bash
# Basic local configuration
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://fanzprotect:password@localhost:5432/fanzprotect
REDIS_URL=redis://localhost:6379

# FANZ Ecosystem (point to staging/dev endpoints)
FANZSSO_API_URL=https://dev-sso.myfanz.network/api
FANZDASH_API_URL=https://dev-dash.myfanz.network/api
# ... other service URLs
```

### 3. Database Setup

```bash
# Start local PostgreSQL (if using Docker)
docker run -d \
  --name fanzprotect-postgres \
  -e POSTGRES_USER=fanzprotect \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fanzprotect \
  -p 5432:5432 \
  postgres:15-alpine

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 4. Start Development Server

```bash
# Start backend server
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend

# Or start both concurrently
npm run dev
```

### 5. Verify Setup

- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:5173
- WebSocket: ws://localhost:5000/ws

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services (app + postgres + redis)
docker-compose --profile development up -d

# View logs
docker-compose logs -f fanzprotect

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production image
docker build -t fanzprotect:latest .

# Run production container
docker run -d \
  --name fanzprotect \
  -p 5000:5000 \
  --env-file .env \
  fanzprotect:latest
```

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

1. **Prepare Production Environment**

```bash
# Create production directory
mkdir -p /opt/fanzprotect
cd /opt/fanzprotect

# Copy deployment files
cp docker-compose.yml ./
cp .env.example .env

# Configure production environment
nano .env
```

2. **Deploy Production Stack**

```bash
# Deploy with production profile
docker-compose --profile production up -d

# Verify deployment
docker-compose ps
docker-compose logs -f fanzprotect
```

### Kubernetes Deployment

For large-scale production deployment:

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/production/

# Check deployment status
kubectl get pods -n fanzprotect-production
kubectl rollout status deployment/fanzprotect-app -n fanzprotect-production
```

### Cloud Provider Deployment

#### AWS ECS/Fargate

```bash
# Create ECS task definition
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json

# Create ECS service
aws ecs create-service --cli-input-json file://aws/ecs-service.json
```

#### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy fanzprotect \
  --image gcr.io/your-project/fanzprotect:latest \
  --port 5000 \
  --env-vars-file .env.production \
  --region us-central1
```

## 🔐 Environment Configuration

### Core Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
API_BASE_URL=https://protect.myfanz.network

# Database (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Security
JWT_SECRET=your-256-bit-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### FANZ Ecosystem Integration

```bash
# FanzSSO Authentication
FANZSSO_API_URL=https://sso.myfanz.network/api
FANZSSO_API_KEY=your-sso-api-key
FANZSSO_CLIENT_ID=fanzprotect-client

# FanzFinance OS Billing
FANZFINANCE_API_URL=https://finance.myfanz.network/api
FANZFINANCE_API_KEY=your-finance-api-key

# FanzMediaCore Storage
FANZMEDIA_API_URL=https://media.myfanz.network/api
FANZMEDIA_API_KEY=your-media-api-key

# FanzDash Dashboard
FANZDASH_API_URL=https://dash.myfanz.network/api
FANZDASH_API_KEY=your-dash-api-key

# FanzSecurityCompDash
FANZSECURITY_API_URL=https://security.myfanz.network/api
FANZSECURITY_API_KEY=your-security-api-key
```

### Platform API Keys

```bash
# YouTube/Google (for DMCA)
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_CLIENT_ID=your-google-client-id

# Meta/Facebook/Instagram
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret

# Twitter/X
TWITTER_API_KEY=your-twitter-api-key
TWITTER_BEARER_TOKEN=your-twitter-bearer-token

# TikTok
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
```

## 🌐 FANZ Ecosystem Integration

### Service Dependencies

1. **FanzSSO (Required)**
   - User authentication and authorization
   - JWT token validation
   - Role-based access control

2. **FanzDash (Required)**
   - Administrative dashboard
   - Real-time monitoring
   - System alerts and notifications

3. **FanzFinance OS (Required)**
   - Legal service billing
   - Payment processing (no Stripe/PayPal)
   - Invoice generation

4. **FanzMediaCore (Required)**
   - Evidence file storage
   - Document management
   - CDN for legal documents

5. **FanzSecurityCompDash (Required)**
   - Security audit logging
   - Compliance monitoring
   - Legal data retention

### Integration Health Checks

```bash
# Test ecosystem service connectivity
curl -H "Authorization: Bearer $FANZSSO_API_KEY" \
  https://sso.myfanz.network/api/health

curl -H "Authorization: Bearer $FANZDASH_API_KEY" \
  https://dash.myfanz.network/api/health

# Check integration status
curl https://protect.myfanz.network/api/health
```

## 📊 Monitoring & Observability

### Health Monitoring

```bash
# Application health
curl https://protect.myfanz.network/api/health

# System information
curl https://protect.myfanz.network/api/system

# WebSocket connection stats
curl https://protect.myfanz.network/api/websocket/stats
```

### Logging

```bash
# View application logs
docker-compose logs -f fanzprotect

# Filter by log level
docker-compose logs fanzprotect | grep ERROR

# Real-time log monitoring
tail -f logs/fanzprotect.log | grep -E "(ERROR|WARN)"
```

### Metrics Collection

The platform exports metrics to:

- **Prometheus**: Application metrics
- **Grafana**: Visualization dashboards  
- **New Relic**: APM monitoring
- **Sentry**: Error tracking
- **FanzDash**: Ecosystem monitoring

### Performance Monitoring

```bash
# Database query performance
curl https://protect.myfanz.network/api/health | jq '.database'

# WebSocket connection metrics
curl https://protect.myfanz.network/api/websocket/stats

# Memory and CPU usage
docker stats fanzprotect-app
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database connectivity
docker-compose exec fanzprotect npm run db:test

# Verify environment variables
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. FANZ Ecosystem Service Errors

```bash
# Check service endpoints
curl -I https://sso.myfanz.network/api/health

# Verify API keys
grep FANZSSO_API_KEY .env

# Test authentication
curl -H "Authorization: Bearer $FANZSSO_API_KEY" \
  https://sso.myfanz.network/api/validate-token
```

#### 3. WebSocket Connection Problems

```bash
# Check WebSocket endpoint
wscat -c ws://localhost:5000/ws

# Verify WebSocket stats
curl https://protect.myfanz.network/api/websocket/stats

# Check client connections
docker-compose logs fanzprotect | grep WebSocket
```

#### 4. File Upload/Evidence Issues

```bash
# Check media service connectivity
curl -H "Authorization: Bearer $FANZMEDIA_API_KEY" \
  https://media.myfanz.network/api/health

# Verify upload directory permissions
ls -la uploads/

# Test file upload endpoint
curl -X POST -F "file=@test.pdf" \
  https://protect.myfanz.network/api/evidence/upload
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG_MODE=true

# Restart application
docker-compose restart fanzprotect

# View debug logs
docker-compose logs -f fanzprotect | grep DEBUG
```

## 🔄 Maintenance

### Regular Maintenance Tasks

#### 1. Database Maintenance

```bash
# Run database vacuum (weekly)
npm run db:vacuum

# Update statistics (daily)
npm run db:analyze

# Check database size
npm run db:size
```

#### 2. Log Rotation

```bash
# Rotate application logs
logrotate /etc/logrotate.d/fanzprotect

# Clean old logs
find logs/ -name "*.log.*" -mtime +30 -delete
```

#### 3. Security Updates

```bash
# Update dependencies
npm audit fix

# Update base Docker image
docker pull node:18-alpine

# Rebuild production image
docker-compose build --no-cache fanzprotect
```

#### 4. Backup Procedures

```bash
# Database backup
npm run backup:database

# Application data backup
npm run backup:data

# Evidence files backup (via FanzMediaCore)
npm run backup:evidence
```

### Monitoring Checklists

#### Daily Checks
- [ ] Application health endpoint responding
- [ ] Database connection healthy
- [ ] WebSocket connections active
- [ ] FANZ ecosystem services responding
- [ ] Error rates within normal range
- [ ] Legal case processing working

#### Weekly Checks
- [ ] Database performance metrics
- [ ] Storage usage (evidence files)
- [ ] Security audit logs review
- [ ] Legal document generation working
- [ ] DMCA submission endpoints functional

#### Monthly Checks
- [ ] Full backup verification
- [ ] Security vulnerability scan
- [ ] Performance optimization review
- [ ] FANZ ecosystem integration tests
- [ ] Legal compliance audit

## 📞 Support

### Emergency Contacts

- **Platform Issues**: legal-platform@myfanz.network
- **Security Issues**: security@myfanz.network  
- **FANZ Ecosystem**: ecosystem-support@myfanz.network

### Escalation Process

1. **Level 1**: Application restart
2. **Level 2**: Database connection check
3. **Level 3**: FANZ ecosystem service verification
4. **Level 4**: Emergency maintenance window
5. **Level 5**: Full platform rollback

### Documentation

- **WARP.md**: Complete platform documentation
- **API Documentation**: https://protect.myfanz.network/docs
- **FANZ Ecosystem**: https://docs.myfanz.network
- **GitHub Issues**: https://github.com/fanz-ecosystem/fanzprotect/issues

---

🛡️ **FanzProtect Legal Platform** - Professional DMCA & Legal Services for Adult Content Creators

*Part of the FANZ Unified Ecosystem* | *Deployed at: https://protect.myfanz.network*
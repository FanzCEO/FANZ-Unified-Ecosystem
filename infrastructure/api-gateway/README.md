# 🚪 FANZ API Gateway

**Enterprise-grade API Gateway for the FANZ Unified Ecosystem with Kong, security, monitoring, and compliance**

## 🌟 Overview

The FANZ API Gateway provides a comprehensive, secure, and scalable entry point for all FANZ platform services. Built with Kong Gateway, it includes advanced security features, rate limiting, monitoring, logging, and specialized configurations for adult content platforms.

### ✨ Key Features

- **🔒 Advanced Security**: OIDC, JWT, WAF, bot protection, IP restrictions
- **⚡ High Performance**: Load balancing, caching, circuit breakers
- **📊 Complete Monitoring**: Prometheus, Grafana, ELK stack, Jaeger tracing
- **🎯 Platform-Specific**: Specialized routing for 9 platform clusters
- **🔞 Adult-Friendly**: Age verification, geographic restrictions, compliance
- **🚀 Production-Ready**: SSL/TLS, health checks, backups, alerts

---

## 🏗️ Architecture

```
                      ┌─────────────────────────────────────────────────────────┐
                      │                 FANZ API GATEWAY                      │
                      │                                                         │
┌──────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────┐
│                      │                    KONG GATEWAY                        │                      │
│   ┌─────────────────┐│┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│┌─────────────────┐   │
│   │   Rate Limiting │││      CORS       │ │       WAF       │ │   Bot Detection │││   SSL/TLS       │   │
│   └─────────────────┘│└─────────────────┘ └─────────────────┘ └─────────────────┘│└─────────────────┘   │
│                      │                                                         │                      │
│   ┌─────────────────┐│┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│┌─────────────────┐   │
│   │   OIDC Auth     │││   JWT Auth      │ │   API Keys      │ │   IP Restrict   │││   Monitoring    │   │
│   └─────────────────┘│└─────────────────┘ └─────────────────┘ └─────────────────┘│└─────────────────┘   │
└──────────────────────┼─────────────────────────────────────────────────────────┼──────────────────────┘
                      │                   LOAD BALANCER                        │
                      └─────────────────────┬───────────────────────────────────┘
                                           │
        ┌──────────────────┬───────────────┼────────────────┬──────────────────┐
        │                  │               │                │                  │
┌───────▼─────────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼─────────┐ ┌──────▼──────┐
│  Platform       │ │   Finance   │ │   Media     │ │   Compliance    │ │   Content   │
│  Clusters       │ │   Services  │ │   Core      │ │   Services      │ │   AI        │
│                 │ │             │ │             │ │                 │ │             │
│ • FanzLab       │ │ • Ledger    │ │ • Upload    │ │ • Age Verify    │ │ • Moderate  │
│ • BoyFanz       │ │ • Payments  │ │ • Transcode │ │ • 2257 Records  │ │ • Classify  │
│ • GirlFanz      │ │ • Reports   │ │ • Storage   │ │ • KYC/AML       │ │ • Generate  │
│ • DaddyFanz     │ │ • Payouts   │ │ • CDN       │ │ • Geo Restrict  │ │ • Enhance   │
│ • PupFanz       │ │             │ │             │ │                 │ │             │
│ • TabooFanz     │ │             │ │             │ │                 │ │             │
│ • TransFanz     │ │             │ │             │ │                 │ │             │
│ • CougarFanz    │ │             │ │             │ │                 │ │             │
│ • FanzCock      │ │             │ │             │ │                 │ │             │
└─────────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘ └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- OpenSSL (for SSL certificate generation)
- 8GB+ RAM recommended
- 50GB+ disk space

### 1-Command Deployment

```bash
# Deploy complete API Gateway stack
./deploy.sh

# Check status
./deploy.sh status

# View logs
./deploy.sh logs kong
```

### Manual Setup

```bash
# 1. Copy environment configuration
cp .env.example .env
# Edit .env with your settings

# 2. Generate SSL certificates
./deploy.sh deploy
```

---

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database & Cache
KONG_DB_PASSWORD=secure_password
REDIS_PASSWORD=secure_password

# Authentication
OIDC_CLIENT_ID=fanz-ecosystem-client
OIDC_CLIENT_SECRET=your_client_secret
JWT_SECRET_ADMIN=your_jwt_secret

# API Keys
FANZ_ADMIN_API_KEY=your_admin_api_key
FANZ_FINANCE_API_KEY=your_finance_api_key
FANZ_MEDIA_API_KEY=your_media_api_key

# Security
ENABLE_ADULT_CONTENT_VERIFICATION=true
ENABLE_GEO_RESTRICTIONS=true
ENABLE_WAF_PROTECTION=true
MINIMUM_AGE=18

# Rate Limiting
RATE_LIMIT_MINUTE=1000
TABOOFANZ_RATE_LIMIT_MINUTE=500
FANZCOCK_RATE_LIMIT_MINUTE=2000
```

### Platform Clusters

Each FANZ platform has specific configurations:

| Platform    | Domain           | Theme          | Special Features                |
|-------------|------------------|----------------|---------------------------------|
| FanzLab     | fanzlab.com      | Neon Universal | Main portal                     |
| BoyFanz     | boyfanz.com      | Neon Red       | Male creators                   |
| GirlFanz    | girlfanz.com     | Neon Pink      | Female creators                 |
| DaddyFanz   | daddyfanz.com    | Neon Gold      | Dom/sub community               |
| PupFanz     | pupfanz.com      | Neon Green     | Pup community                   |
| TabooFanz   | taboofanz.com    | Dark Blue      | Extreme content, strict limits  |
| TransFanz   | transfanz.com    | Turquoise      | Trans creators                  |
| CougarFanz  | cougarfanz.com   | Mature Gold    | Mature creators                 |
| FanzCock    | fanzcock.com     | XXX Red/Black  | Adult TikTok, higher limits     |

---

## 🔒 Security Features

### Authentication & Authorization

- **OIDC Integration**: OpenID Connect with auto-discovery
- **JWT Tokens**: Secure API access with configurable claims
- **API Keys**: Service-to-service authentication
- **Role-based Access**: Admin, Finance, Media, Partner roles

### Adult Content Compliance

```yaml
# Age Verification
age_verification:
  required: true
  minimum_age: 18
  strict_mode: true
  verification_service: https://age-verify.fanz.com

# Geographic Restrictions
geo_restrictions:
  enabled: true
  blocked_countries: ["XX", "YY"]
  restriction_service: https://geo.fanz.com

# 2257 Compliance
usc_2257:
  record_keeping: true
  custodian: "FANZ Legal Compliance Officer"
```

### Web Application Firewall (WAF)

- SQL Injection protection
- XSS attack prevention  
- Malicious user agent blocking
- IP address blocklist
- Request size limiting

### Rate Limiting

```yaml
# Global Limits
global:
  minute: 1000
  hour: 10000
  day: 100000

# Platform-Specific
taboofanz:
  minute: 500    # Lower for extreme content
  
fanzcock:
  minute: 2000   # Higher for video platform
```

---

## 📊 Monitoring & Observability

### Metrics (Prometheus)

- **Kong Metrics**: Request rates, latency, errors
- **Redis Metrics**: Cache hit rates, memory usage
- **Database Metrics**: Connection pools, query performance
- **Custom Metrics**: Business KPIs, user behavior

### Dashboards (Grafana)

Access: `http://localhost:3001` (admin/[generated_password])

Pre-configured dashboards:
- API Gateway Overview
- Platform-Specific Metrics
- Security Events
- Performance Monitoring
- Error Analysis

### Logging (ELK Stack)

- **Elasticsearch**: Log storage and indexing
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization and analysis

Access: `http://localhost:5601`

Log format:
```
fanz_log [IP] - [User] [Timestamp] "Method Path" Status BytesSent "Referrer" "UserAgent" RequestTime UpstreamTime "XForwardedFor" "Cluster" "RequestID"
```

### Distributed Tracing (Jaeger)

Access: `http://localhost:16686`

- Request flow tracking
- Performance bottleneck identification
- Service dependency mapping
- Error propagation analysis

---

## 🔌 API Endpoints

### Core APIs

```bash
# Authentication
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/profile

# Finance
GET  /api/v1/ledger/accounts
POST /api/v1/ledger/transactions
GET  /api/v1/payments/history
POST /api/v1/payouts/create

# Media
POST /api/v1/media/upload
GET  /api/v1/media/{id}
POST /api/v1/transcode/start

# Compliance
POST /api/v1/age-verify
GET  /api/v1/2257/records
POST /api/v1/kyc/verify
```

### Platform-Specific APIs

Each platform cluster has dedicated endpoints accessible via:

- HTTP: `http://localhost:8000` (with Host header)
- HTTPS: `https://localhost:8443` (with Host header)

Example:
```bash
# BoyFanz Platform
curl -H "Host: boyfanz.com" http://localhost:8000/

# TabooFanz with age verification
curl -H "Host: taboofanz.com" \
     -H "Content-Type: application/json" \
     -d '{"age_verified": true}' \
     http://localhost:8000/api/content
```

---

## 🛠️ Management Commands

### Deployment Commands

```bash
./deploy.sh deploy          # Full deployment
./deploy.sh start           # Start all services
./deploy.sh stop            # Stop all services
./deploy.sh restart         # Restart all services
./deploy.sh status          # Show service status
```

### Maintenance Commands

```bash
./deploy.sh logs [service]  # View logs
./deploy.sh health          # Health checks
./deploy.sh backup          # Backup configuration
./deploy.sh cleanup         # Remove everything
```

### Service Management

```bash
# Individual service control
docker-compose up -d kong
docker-compose restart redis
docker-compose logs -f elasticsearch

# Scale services
docker-compose up -d --scale kong=3
```

---

## 📋 Operations

### Health Checks

Built-in health monitoring:
- Kong Admin API health
- Upstream service health
- Database connectivity
- Redis availability
- SSL certificate validity

### Backup Strategy

Automated backups include:
- Kong configuration
- SSL certificates
- Environment settings
- Database snapshots
- Log archives

### Disaster Recovery

1. **Configuration Restore**: `./deploy.sh restore`
2. **Database Recovery**: Automatic failover with replicas
3. **Service Recovery**: Health checks trigger restarts
4. **SSL Renewal**: Automated certificate management

---

## 🔍 Troubleshooting

### Common Issues

**Kong won't start:**
```bash
# Check database connection
docker-compose logs kong-database

# Verify migrations
docker-compose logs kong-migrations

# Reset if needed
docker-compose down -v
./deploy.sh deploy
```

**High latency:**
```bash
# Check upstream health
curl http://localhost:8001/upstreams

# Monitor metrics
curl http://localhost:8001/status

# Scale services
docker-compose up -d --scale kong=3
```

**Authentication failures:**
```bash
# Verify OIDC configuration
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="oidc")'

# Check JWT secrets
grep JWT_SECRET .env

# Test API key
curl -H "X-API-Key: your_api_key" http://localhost:8000/api/v1/health
```

### Debug Mode

Enable debug logging:
```bash
# In .env file
KONG_LOG_LEVEL=debug

# Restart Kong
docker-compose restart kong

# View detailed logs
docker-compose logs -f kong
```

---

## 🚦 Performance Tuning

### Kong Optimization

```yaml
# In docker-compose.yml environment
KONG_NGINX_WORKER_PROCESSES: auto
KONG_NGINX_WORKER_CONNECTIONS: 1024
KONG_MEM_CACHE_SIZE: 128m
```

### Database Optimization

```sql
-- PostgreSQL tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET max_connections = 100;
```

### Redis Optimization

```conf
# Redis configuration
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
```

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale Kong instances
docker-compose up -d --scale kong=3

# Scale Redis for cache
docker-compose up -d --scale redis=2

# Load balance with upstream health checks
# Configured automatically in kong-config.yaml
```

### Vertical Scaling

Update resource limits in `docker-compose.yml`:

```yaml
services:
  kong:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: 2
```

---

## 🔐 Security Best Practices

### SSL/TLS Configuration

- Use valid certificates in production
- Enable HSTS headers
- Configure proper cipher suites
- Implement certificate pinning

### API Security

- Rotate API keys regularly
- Implement request signing
- Use short-lived JWT tokens
- Enable audit logging

### Network Security

- Use private networks
- Implement IP whitelisting
- Enable DDoS protection
- Configure proper firewall rules

---

## 📚 Additional Resources

### Documentation

- [Kong Gateway Documentation](https://docs.konghq.com/)
- [FANZ API Documentation](../docs/api-reference.md)
- [Security Guidelines](../docs/security-guide.md)
- [Deployment Guide](../docs/deployment-guide.md)

### Support

- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Security**: Email security@fanz.com for vulnerabilities
- **Community**: Join our Discord server

---

## 📝 License

This project is part of the FANZ Unified Ecosystem and is licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

---

**🚀 Ready to power the future of creator economy platforms with secure, scalable API infrastructure!**

*Built with ❤️ by the FANZ Engineering Team*
# FANZ Unified Authentication Service

🔐 **Comprehensive rate-limited authentication service for the FANZ ecosystem**

The FANZ Auth Service provides centralized authentication with advanced rate limiting protection against brute force attacks, credential stuffing, and abuse. It supports single sign-on (SSO) across all 13 FANZ platforms with enterprise-grade security features.

## 🚀 Features

### Core Authentication
- **JWT-based authentication** with access and refresh tokens
- **Single Sign-On (SSO)** across all FANZ platforms  
- **Multi-role support** (fan, creator, affiliate, admin, super_admin)
- **Platform-specific permissions** and access control
- **Session management** with Redis-backed storage

### 🛡️ Advanced Rate Limiting
- **Multi-layered protection** against brute force attacks
- **Privacy-preserving** account-based rate limiting (no PII stored)
- **Distributed rate limiting** with Redis backend
- **Configurable thresholds** per environment
- **Internal service bypass** for FanzFinance OS integration
- **Comprehensive logging** and monitoring

### Rate Limiting Categories

#### Sensitive Operations (Login, Registration)
- **IP-based limiting**: 5 attempts/minute, 20 attempts/hour
- **Account-based limiting**: 3 attempts/minute (HMAC-hashed identifiers)
- **Long-term protection**: Extended windows for distributed attack mitigation

#### Token Operations (Refresh, Validation)
- **IP-based limiting**: 30 requests/minute
- **User-based limiting**: 60 requests/minute, 500 requests/15min
- **Intelligent fallback**: Uses IP limiting when user context unavailable

#### Standard Operations (Logout, Profile, Platform Access)
- **IP-based limiting**: 60 requests/minute
- **Generous limits** for normal operations

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance

### Installation

```bash
# Clone and enter the auth service directory
cd auth-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Update environment variables (see configuration section)
nano .env

# Build the service
npm run build

# Start in development mode
npm run dev

# Or start production build
npm start
```

### Health Check
```bash
curl http://localhost:3001/health
```

## ⚙️ Configuration

### Environment Variables

#### Basic Configuration
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/fanz_auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
```

#### Rate Limiting Configuration
```env
# Global settings
RATE_LIMIT_ENABLED=true
RL_LOGGING_ENABLED=true
RL_HMAC_SECRET=your-secure-hmac-secret

# Sensitive operations
RL_SENSITIVE_MAX_IP=5
RL_SENSITIVE_MAX_ACCOUNT=3

# Token operations  
RL_TOKEN_MAX_IP=30
RL_TOKEN_MAX_USER=60

# Standard operations
RL_STANDARD_MAX_IP=60
```

See `.env.example` for complete configuration options and environment-specific recommendations.

### Internal Service Bypass

For **FanzFinance OS** and other internal services:

```env
RL_BYPASS_ENABLED=true
RL_BYPASS_JWT_AUD=fanzfinance-os,fanz-internal
RL_BYPASS_SERVICE_CLAIM=fanzfinance-os
```

Internal services can bypass rate limits using:
- **JWT audience claim**: `"aud": "fanzfinance-os"`
- **Service claim**: `"svc": "fanzfinance-os"`
- **API key header**: `X-API-Key: your-internal-api-key`

## 📋 API Endpoints

### Authentication Endpoints

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "fan",
  "platform": "fanz"
}
```

#### User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "platform": "fanz"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Token Validation (Internal Services)
```http
POST /api/auth/validate
Content-Type: application/json

{
  "token": "{{YOUR_JWT_TOKEN}}"
}
```

### Rate Limit Headers

All responses include rate limiting headers:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1640995200
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1640995260
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "message": "Too many authentication attempts. Please wait before trying again.",
  "category": "sensitive",
  "retryAfterMs": 60000,
  "meta": {
    "route": "login:ip",
    "limit": 5,
    "resetTime": "2021-12-31T12:01:00.000Z"
  },
  "ecosystem": "fanz-unified"
}
```

## 🔒 Security Features

### Privacy-Preserving Rate Limiting
- **No PII storage**: Account identifiers are HMAC-hashed before Redis storage
- **Secure key generation**: Cryptographically secure hashing with configurable secrets
- **Masked logging**: Sensitive data is masked in logs while preserving debugging capability

### Multi-Layer Protection
1. **IP-based limits**: Protect against single-source attacks
2. **Account-based limits**: Prevent targeted account attacks
3. **Long-term windows**: Detect and mitigate distributed attacks
4. **User-based limits**: Fine-grained control for authenticated operations

### Bypass Logic for Internal Services
- **JWT audience validation**: Trusted service identification
- **API key allowlisting**: Pre-approved internal service keys
- **Service claim verification**: Granular service-specific bypass

## 📊 Monitoring and Observability

### Metrics
Rate limiting events are logged with structured data:
```json
{
  "event": "rate_limit_exceeded",
  "category": "sensitive", 
  "route": "login:account",
  "ip": "192.168.1.xxx",
  "userId": "masked-user-id",
  "limit": 3,
  "remaining": 0,
  "resetTime": "2021-12-31T12:01:00.000Z"
}
```

### Health Monitoring
- Service health endpoint: `GET /health`
- Database connectivity checks
- Redis connectivity verification
- Rate limiting store initialization status

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Rate Limiting Tests
The test suite includes comprehensive rate limiting validation:
- Threshold enforcement across all endpoint categories
- Account-based vs IP-based limiting behavior
- Bypass logic for internal services
- Header validation and error responses
- Distributed rate limiting across multiple instances

## 🚀 Deployment

### Environment-Specific Configuration

#### Development
- Generous rate limits for easier development
- Full logging enabled
- Bypass enabled for testing

#### Staging  
- Production-like limits with some tolerance
- Comprehensive monitoring
- Rate limit testing and validation

#### Production
- Strict rate limits optimized for security
- Error-level logging only
- Enhanced monitoring and alerting

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
RL_HMAC_SECRET=${RATE_LIMIT_HMAC_SECRET}  # From secret manager
RL_SENSITIVE_MAX_IP=2                      # Strict production limits
RL_SENSITIVE_MAX_ACCOUNT=1                 # Very conservative
RL_LOGGING_LEVEL=error                     # Reduce noise
```

## 🛠️ Troubleshooting

### Common Issues

#### Rate Limit Lockouts
**Symptom**: Legitimate users receiving 429 errors

**Solutions**:
1. Check rate limit thresholds in environment
2. Verify IP detection (`trust proxy` configuration)
3. Review bypass logic for internal services
4. Temporarily increase limits if needed

#### Redis Connection Issues
**Symptom**: Rate limiting falls back to memory store

**Solutions**:
1. Verify Redis connectivity
2. Check Redis URL configuration
3. Ensure Redis instance has sufficient memory
4. Review Redis connection timeout settings

#### Internal Service Bypass Not Working
**Symptom**: FanzFinance OS getting rate limited

**Solutions**:
1. Verify JWT audience claim: `"aud": "fanzfinance-os"`
2. Check bypass configuration in environment
3. Validate API key headers
4. Review service claim in JWT payload

### Debugging Rate Limits

Enable debug logging:
```env
RL_LOGGING_ENABLED=true
RL_LOGGING_LEVEL=debug
```

Monitor Redis keys:
```bash
redis-cli KEYS "rl:auth:*"
redis-cli TTL "rl:auth:sensitive:ip:192.168.1.1"
```

## 🔄 Integration with FanzFinance OS

The auth service is designed to integrate seamlessly with **FanzFinance OS**:

### Service Account Setup
1. Configure bypass audience: `fanzfinance-os`
2. Set service claim in FanzFinance OS tokens
3. Use dedicated API keys for service-to-service communication

### Rate Limit Coordination
- FanzFinance OS operations bypass standard rate limits
- Financial operations use elevated limit tiers
- Audit trail maintained for all bypass usage

## 📞 Support

For issues related to rate limiting or authentication:

1. Check the logs for `rate_limit_exceeded` events
2. Verify environment configuration matches requirements
3. Test bypass logic with internal service credentials
4. Review Redis connectivity and key expiration

## 📄 License

UNLICENSED - Private use only within the FANZ ecosystem.

---

**Security Note**: This service handles authentication for the entire FANZ ecosystem. Rate limit configurations should be carefully tested and monitored. Always use secure secrets in production and follow the principle of least privilege for service accounts.
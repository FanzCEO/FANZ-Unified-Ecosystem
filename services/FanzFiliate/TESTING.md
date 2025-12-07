# FanzFiliate Testing & Deployment Guide

This guide covers testing procedures, deployment steps, and integration verification for the FanzFiliate platform.

## Quick Testing

### 1. Environment Validation
```bash
# Check required environment variables
node scripts/env-gate.cjs

# Expected output: Lists missing/present environment variables
# ❌ Missing variables are expected in development
```

### 2. TypeScript Compilation
```bash
# Verify all code compiles without errors
npm run check

# Expected output: No TypeScript errors
```

### 3. Build Process
```bash
# Build both frontend and backend
npm run build

# Expected output:
# - Frontend built to dist/public/
# - Backend bundled to dist/index.js
```

### 4. SSO Integration Test
```bash
# Test SSO service logic
node scripts/test-sso-simple.cjs

# Expected output: All 8 tests should pass
```

### 5. Production Readiness Check
```bash
# Comprehensive health and configuration check
node scripts/prep-prod.cjs

# Note: Will show warnings for missing env vars in development
```

## Development Testing

### Start Development Server
```bash
npm run dev
```

### Manual API Testing
Once the dev server is running on port 5000:

```bash
# Test health endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/system
curl http://localhost:5000/api/metrics

# Test authentication (development tokens)
curl -X POST http://localhost:5000/api/auth/sso \
  -H "Content-Type: application/json" \
  -d '{"ssoToken": "sso_testuser", "ssoUserId": "testuser"}'

# Test offers endpoint
curl http://localhost:5000/api/offers

# Test click tracking
curl "http://localhost:5000/api/click?aid=aff-1&oid=offer-1&url=https://example.com"
```

### Expected Development Responses

#### Health Check (`/api/health`)
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "checks": [
    {
      "service": "storage",
      "status": "ok",
      "message": "In-memory storage operational"
    }
  ]
}
```

#### SSO Login (`/api/auth/sso`)
```json
{
  "user": {
    "id": "generated-user-id",
    "email": "testuser@fanzeco.com",
    "username": "testuser",
    "name": "Testuser User",
    "role": "affiliate",
    "kycStatus": "unverified",
    "kycTier": 0
  },
  "accessToken": "jwt-token-here",
  "refreshToken": "jwt-refresh-token-here",
  "expiresIn": "15m"
}
```

## Integration Testing

### FanzSSO Integration

#### Development Mode
- Uses fallback validation for tokens starting with `sso_` or `dev_`
- Mock user creation with predictable data
- No external API calls required

#### Production Mode
Set these environment variables:
```bash
FANZSSO_API_URL=https://sso.fanzeco.com/api
FANZSSO_API_KEY=your_production_api_key
FANZSSO_JWT_SECRET=shared_jwt_secret_with_sso
```

#### Test Production SSO
```bash
# With real SSO token from FanzSSO
curl -X POST http://localhost:5000/api/auth/sso \
  -H "Content-Type: application/json" \
  -d '{"ssoToken": "real_jwt_token", "ssoUserId": "real_user_id"}'
```

### KYC Integration (VerifyMy)

#### Webhook Testing
```bash
# Simulate KYC webhook
curl -X POST http://localhost:5000/api/webhooks/kyc/verifymy \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=webhook_signature" \
  -d '{
    "userId": "test-user",
    "status": "approved",
    "tier": 2,
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

### FanzDash Integration

#### Metrics Endpoint
```bash
# Test metrics in JSON format
curl http://localhost:5000/api/metrics

# Test metrics in Prometheus format
curl -H "Accept: text/plain" http://localhost:5000/api/metrics
```

## Database Testing

### In-Memory Storage (Development)
- Seed data automatically created
- Test users: `john@example.com` (affiliate), `advertiser@example.com` (advertiser)
- Sample offers with CPA/hybrid structures

### PostgreSQL (Production)
```bash
# Test database connection
npm run db:push

# Expected: Schema applied successfully
```

## Security Testing

### JWT Token Validation
```bash
# Test with invalid token
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/auth/me

# Expected: 401 Unauthorized
```

### Rate Limiting
```bash
# Test rate limits (make rapid requests)
for i in {1..15}; do
  curl http://localhost:5000/api/health
done

# Expected: 429 Too Many Requests after limit exceeded
```

### HMAC Webhook Validation
```bash
# Test webhook without signature
curl -X POST http://localhost:5000/api/webhooks/kyc/verifymy \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: 401 Missing webhook signature
```

## Performance Testing

### Click Tracking Performance
```bash
# Test high-throughput click tracking
ab -n 1000 -c 10 "http://localhost:5000/api/click?aid=aff-1&oid=offer-1&url=https://example.com"
```

### API Response Times
```bash
# Test typical API response times
time curl http://localhost:5000/api/offers
time curl http://localhost:5000/api/system
```

## Production Deployment

### Pre-Deployment Checklist

1. **Environment Variables**
   ```bash
   # Verify all required vars are set
   node scripts/env-gate.cjs
   ```

2. **Build Process**
   ```bash
   npm run build
   ```

3. **Production Health Check**
   ```bash
   node scripts/prep-prod.cjs
   ```

4. **Database Migration**
   ```bash
   npm run db:push
   ```

### Production Environment Setup

#### Required Environment Variables
```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=secure-production-secret
JWT_ISS=https://auth.fanzeco.com
JWT_AUD=fanzfiliate

# Integrations
FANZSSO_API_URL=https://sso.fanzeco.com/api
FANZSSO_API_KEY=production_sso_key
FANZDASH_API_URL=https://dash.fanzeco.com/api
FANZDASH_API_KEY=production_dash_key
VERIFYMY_API_URL=https://api.verifymy.com/v1
VERIFYMY_API_KEY=production_kyc_key

# Security
POSTBACK_SECRET=secure-postback-secret
WEBHOOK_SECRET=secure-webhook-secret

# URLs
WEB_APP_URL=https://fanzfiliate.com
API_URL=https://api.fanzfiliate.com
PUBLIC_DOMAIN=trk.fanzfiliate.com
```

#### Production Start
```bash
npm start
```

### Post-Deployment Verification

1. **Health Endpoints**
   ```bash
   curl https://api.fanzfiliate.com/api/health
   curl https://api.fanzfiliate.com/api/system
   ```

2. **SSO Integration**
   - Verify login flow with FanzSSO
   - Test user registration and sync
   - Validate JWT token handling

3. **KYC Webhooks**
   - Test VerifyMy webhook endpoint
   - Verify HMAC signature validation
   - Check user status updates

4. **Metrics Collection**
   - Verify FanzDash metrics reporting
   - Check Prometheus endpoint format
   - Validate periodic reporting

## Troubleshooting

### Common Development Issues

#### Build Failures
```bash
# Check TypeScript errors
npm run check

# Clear build cache
rm -rf dist/
npm run build
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
npm run db:push
```

#### SSO Token Validation Failures
```bash
# Check environment variables
echo $FANZSSO_API_URL
echo $FANZSSO_API_KEY

# Test with development tokens
curl -X POST http://localhost:5000/api/auth/sso \
  -H "Content-Type: application/json" \
  -d '{"ssoToken": "sso_testuser", "ssoUserId": "testuser"}'
```

### Production Issues

#### 503 Service Unavailable
- Check health endpoint for specific service failures
- Verify database connectivity
- Check external service integrations

#### 401 Authentication Errors
- Verify JWT_SECRET consistency
- Check SSO integration configuration
- Validate token expiration settings

#### Webhook Failures
- Verify HMAC signature calculation
- Check webhook secret configuration
- Validate payload format

## Testing Scripts Reference

- `scripts/env-gate.cjs` - Environment variable validation
- `scripts/prep-prod.cjs` - Production readiness check
- `scripts/test-sso-simple.cjs` - SSO integration testing
- `npm run check` - TypeScript compilation check
- `npm run build` - Full application build
- `npm run dev` - Development server
- `npm start` - Production server

## Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Health endpoint: < 100ms
   - Click tracking: < 50ms
   - Authentication: < 200ms

2. **Error Rates**
   - 4xx errors: < 5%
   - 5xx errors: < 1%
   - SSO failures: < 2%

3. **Business Metrics**
   - Click-through rates
   - Conversion rates
   - Payout processing times
   - KYC completion rates

### Log Analysis
```bash
# Monitor application logs
tail -f /var/log/fanzfiliate/app.log

# Check error patterns
grep "ERROR" /var/log/fanzfiliate/app.log | tail -20

# Monitor SSO activity
grep "SSO" /var/log/fanzfiliate/app.log | tail -10
```

---

This testing guide ensures comprehensive validation of the FanzFiliate platform before and after deployment.

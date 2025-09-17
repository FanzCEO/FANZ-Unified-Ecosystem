# 🛡️ FANZ Security Module

Comprehensive security integration for FANZ adult content platforms.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Age Verification**: Compliant age verification for adult content
- **Multi-Factor Authentication**: TOTP and SMS-based MFA
- **Real-time Monitoring**: Advanced threat detection and response
- **API Gateway Security**: Centralized security policy enforcement

## Quick Start

```typescript
import FanzSecurityIntegration from './FanzSecurityIntegration';

// Apply complete security middleware
app.use('/api', FanzSecurityIntegration.getSecurityMiddleware());

// Adult content protection
app.use('/api/adult', FanzSecurityIntegration.getAdultContentMiddleware('boyfanz'));

// Payment security
app.use('/api/payments', FanzSecurityIntegration.getPaymentSecurityMiddleware());
```

## Environment Variables

```bash
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
PII_SALT=your-pii-salt
```

## Security Components

1. **Authentication** (`auth/`)
   - JWT middleware with session management
   - OAuth integration capabilities
   - Multi-factor authentication

2. **Compliance** (`compliance/`)
   - Age verification system
   - 2257 compliance logging
   - Adult content access controls

3. **Monitoring** (`../monitoring/`)
   - Real-time threat detection
   - Security event logging
   - Automated response systems

4. **API Gateway** (`../api/gateway/`)
   - Request validation
   - Rate limiting
   - Security headers

## Testing

```bash
cd security
npm test
npm run security-scan
```

## Documentation

- [Authentication Guide](./docs/authentication.md)
- [Age Verification Guide](./docs/age-verification.md)
- [MFA Setup Guide](./docs/mfa-setup.md)
- [Security Best Practices](./docs/security-practices.md)

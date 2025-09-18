# @fanz/secure

Enterprise-grade security middleware package for the FANZ Unified Ecosystem. This package provides comprehensive security controls, input validation, rate limiting, and monitoring capabilities designed specifically for adult content platforms and financial services.

[![Version](https://img.shields.io/npm/v/@fanz/secure.svg)](https://npmjs.org/package/@fanz/secure)
[![Build Status](https://img.shields.io/github/workflow/status/FanzCEO/FANZ-Unified-Ecosystem/Security-Tests)](https://github.com/FanzCEO/FANZ-Unified-Ecosystem/actions)
[![Coverage](https://img.shields.io/codecov/c/github/FanzCEO/FANZ-Unified-Ecosystem)](https://codecov.io/gh/FanzCEO/FANZ-Unified-Ecosystem)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

## 🔐 Features

### **Core Security**
- ✅ **Tiered Rate Limiting** - Redis-backed with memory fallback, IP and user-aware
- ✅ **Input Validation & Sanitization** - Zod-based schemas with XSS/SQL injection prevention  
- ✅ **Security Headers** - Strict CSP with nonce generation, HSTS, frame protection
- ✅ **CORS Hardening** - Explicit allowlists, credential control, method restrictions
- ✅ **Request Logging** - PII-redacted structured logging with correlation IDs
- ✅ **Error Handling** - Secure error responses with information disclosure prevention

### **Advanced Protection**
- 🚨 **Security Event System** - Real-time monitoring with FanzDash integration
- 🔍 **Injection Prevention** - SQL, XSS, and code injection detection and blocking
- 📊 **Audit Trails** - Immutable security event logging for compliance
- ⚡ **Emergency Controls** - IP blocking, user lockout, system lockdown capabilities
- 🔄 **Health Monitoring** - Security-aware health checks and metrics

### **FANZ Ecosystem Integration**
- 🏛️ **FanzDash Integration** - Centralized security control and monitoring
- 💰 **FanzFinance Protection** - Specialized controls for financial operations
- 🎯 **Adult Content Compliance** - Age verification, content classification controls
- 🌐 **Multi-Platform Support** - Unified security across all 13 FANZ platforms

## 📦 Installation

```bash
npm install @fanz/secure
# or
yarn add @fanz/secure
# or
pnpm add @fanz/secure
```

## 🚀 Quick Start

### Basic Express App Integration

```typescript
import express from 'express';
import { applySecurityMiddleware, createSecurityErrorHandler } from '@fanz/secure';

const app = express();

// Apply comprehensive security middleware
applySecurityMiddleware(app);

// Your routes here
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Security error handler (must be last)
app.use(createSecurityErrorHandler());

app.listen(3000, () => {
  console.log('🔐 Secure FANZ service running on port 3000');
});
```

### Advanced Configuration

```typescript
import { 
  createAuthSecurityMiddleware,
  createPaymentSecurityMiddleware,
  validate,
  CommonSchemas,
  createSecurityLogger 
} from '@fanz/secure';
import { z } from 'zod';

const logger = createSecurityLogger('UserService');

// Authentication routes with strict security
const authRouter = express.Router();
authRouter.use(...createAuthSecurityMiddleware());

authRouter.post('/login', 
  validate({
    body: z.object({
      email: CommonSchemas.email,
      password: z.string().min(8).max(128)
    })
  }),
  async (req, res) => {
    const { validatedBody } = req as any;
    // validatedBody is fully validated and sanitized
    logger.audit('Login attempt', { email: validatedBody.email });
    // ... authentication logic
  }
);

// Payment routes with maximum security
const paymentRouter = express.Router();
paymentRouter.use(...createPaymentSecurityMiddleware());

paymentRouter.post('/transactions',
  validate({
    body: z.object({
      amount: CommonSchemas.currencyAmount,
      currency: z.enum(['USD', 'EUR', 'GBP']),
      description: z.string().min(1).max(500)
    })
  }),
  async (req, res) => {
    const { validatedBody } = req as any;
    // Maximum security validation for financial operations
    // ... payment processing logic
  }
);
```

## 📚 Environment Configuration

Create a `.env` file with the required configuration:

```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# Security Secrets (minimum 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars
CSRF_SECRET=your-super-secure-csrf-secret-key-here-min-32-chars  
ENCRYPTION_KEY=your-super-secure-encryption-key-here-min-32-chars

# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/fanz_db
REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_ORIGINS=https://app.fanz.eco,https://admin.fanz.eco

# Rate Limiting (optional - has sensible defaults)
RATE_LIMIT_AUTH_POINTS=10
RATE_LIMIT_AUTH_DURATION=60
RATE_LIMIT_PAYMENT_POINTS=60
RATE_LIMIT_PAYMENT_DURATION=60
RATE_LIMIT_STANDARD_POINTS=300
RATE_LIMIT_STANDARD_DURATION=300

# FanzDash Integration
FANZDASH_API_URL=https://dash.fanz.eco/api
FANZDASH_SECRET_TOKEN=your-fanzdash-integration-token

# Payment Processors (Non-Stripe/PayPal)
CCBILL_CLIENT_ACCNUM=your-ccbill-account
CCBILL_FLEX_ID=your-ccbill-flex-form
CCBILL_SALT=your-ccbill-security-salt
PAXUM_API_KEY=your-paxum-api-key
PAXUM_API_SECRET=your-paxum-api-secret
SEGPAY_PACKAGE_ID=your-segpay-package-id

# Feature Flags
FEATURE_CSRF_ENABLED=true
FEATURE_RATE_LIMITING_ENABLED=true
FEATURE_AUDIT_LOGGING_ENABLED=true
FEATURE_SECURITY_HEADERS_ENABLED=true
```

## 🛡️ Security Middleware

### Standard Security Chain
```typescript
import { createSecurityMiddleware } from '@fanz/secure';

// Standard security middleware includes:
// 1. Request ID generation
// 2. Correlation ID handling  
// 3. HTTP request logging
// 4. Rate limiting (standard tier)
// 5. CORS protection
// 6. Parameter pollution protection
// 7. Security headers (CSP, HSTS, etc.)

app.use(...createSecurityMiddleware());
```

### Specialized Security Chains

```typescript
import { 
  createAuthSecurityMiddleware,
  createPaymentSecurityMiddleware,
  createWebhookSecurityMiddleware 
} from '@fanz/secure';

// Authentication routes (stricter rate limiting)
authRouter.use(...createAuthSecurityMiddleware());

// Payment routes (strictest security)
paymentsRouter.use(...createPaymentSecurityMiddleware());

// Webhooks (no CORS, different rate limits)
webhooksRouter.use(...createWebhookSecurityMiddleware());
```

## ✅ Input Validation

### Built-in Validators

```typescript
import { 
  validate,
  validatePagination,
  validateUuidParam,
  validateTransaction,
  validateContent,
  CommonSchemas 
} from '@fanz/secure';

// Pagination validation
app.get('/api/posts', validatePagination, (req, res) => {
  const { validatedQuery } = req as any;
  const { page, limit, sortBy, sortOrder } = validatedQuery;
  // All parameters are validated and have defaults
});

// UUID parameter validation  
app.get('/api/users/:id', validateUuidParam('id'), (req, res) => {
  const { validatedParams } = req as any;
  const { id } = validatedParams; // Guaranteed to be a valid UUID
});

// Financial transaction validation
app.post('/api/transactions', validateTransaction, (req, res) => {
  const { validatedBody } = req as any;
  // Amount is in cents, currency is enum, description is sanitized
});
```

### Custom Validation

```typescript
import { validate, createSanitizedString } from '@fanz/secure';
import { z } from 'zod';

const userProfileSchema = z.object({
  displayName: createSanitizedString(2, 50), // Min 2, max 50 chars, auto-sanitized
  bio: createSanitizedString(0, 500, true), // Allow HTML with sanitization
  age: z.number().int().min(18).max(120), // Adult content platform requirement
  location: z.string().max(100).optional(),
  website: CommonSchemas.url.optional(),
  socialMedia: z.object({
    twitter: z.string().max(100).optional(),
    instagram: z.string().max(100).optional()
  }).optional()
});

app.put('/api/profile', 
  validate({ body: userProfileSchema }),
  (req, res) => {
    const { validatedBody } = req as any;
    // All fields are validated, sanitized, and type-safe
  }
);
```

## 📊 Rate Limiting

### Tiered Rate Limiting

The package provides four tiers of rate limiting:

```typescript
import { 
  authRateLimit,      // 10 req/min per IP, 30 req/min per user  
  paymentRateLimit,   // 60 req/min per IP, 120 req/min per user
  standardRateLimit,  // 300 req/5min per IP, 600 req/5min per user
  webhookRateLimit    // 100 req/min per IP
} from '@fanz/secure';

// Apply to specific routes
app.use('/api/auth', authRateLimit);
app.use('/api/payments', paymentRateLimit);
app.use('/api', standardRateLimit);
app.use('/api/webhooks', webhookRateLimit);
```

### Custom Rate Limiting

```typescript
import { createRateLimitMiddleware } from '@fanz/secure';

const customRateLimit = createRateLimitMiddleware({
  points: 100,        // Number of requests
  duration: 300,      // Time window in seconds  
  blockDuration: 900, // Block duration in seconds
  execEvenly: false   // Burst or spread evenly
});

app.use('/api/custom', customRateLimit);
```

### Emergency Controls

```typescript
import { emergencyBlockUser, resetUserRateLimit } from '@fanz/secure';

// Block user/IP immediately (admin function)
await emergencyBlockUser(
  'user-123',           // userId
  '192.168.1.1',       // ipAddress  
  3600,                // duration in seconds
  'Suspicious activity' // reason
);

// Reset rate limits for user
await resetUserRateLimit('user-123', '192.168.1.1');
```

## 📝 Security Logging

### Structured Logging with PII Redaction

```typescript
import { createSecurityLogger, createAuditLogger } from '@fanz/secure';

const logger = createSecurityLogger('UserService');
const auditLogger = createAuditLogger('UserActions');

// Standard logging (PII automatically redacted)
logger.info('User logged in', {
  userId: 'user-123',
  email: 'user@example.com', // Will be redacted in logs
  ip: req.ip
});

// Audit logging for compliance
auditLogger.audit('PASSWORD_CHANGED', {
  userId: 'user-123',
  timestamp: new Date(),
  ip: req.ip
});

// Security event logging  
logger.security({
  type: 'SUSPICIOUS_ACTIVITY',
  severity: 'HIGH',
  context: req.security,
  details: { reason: 'Multiple failed login attempts' }
});
```

### Security Event System

```typescript
import { emitSecurityEvent, onSecurityEvent } from '@fanz/secure';

// Emit security events
await emitSecurityEvent({
  type: 'AUTH_FAILURE',
  severity: 'MEDIUM',
  context: {
    requestId: req.id,
    userId: 'user-123',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    path: req.path,
    method: req.method
  },
  details: { reason: 'Invalid password' },
  timestamp: new Date()
});

// Listen for security events
onSecurityEvent('AUTH_FAILURE', async (event) => {
  // Custom handling for authentication failures
  console.log('Auth failure detected:', event);
  
  // Could trigger additional security measures
  if (event.severity === 'HIGH') {
    await emergencyBlockUser(event.context.userId);
  }
});
```

## 🏥 Health Monitoring

```typescript
import { createSecurityHealthCheck, getSecurityEventStats } from '@fanz/secure';

// Security-aware health check endpoint
app.get('/health', createSecurityHealthCheck());

// Custom health monitoring
app.get('/security/stats', async (req, res) => {
  const stats = await getSecurityEventStats();
  res.json({
    securityEvents: stats,
    timestamp: new Date().toISOString()
  });
});
```

## 🎯 FANZ Ecosystem Features

### FanzFinance Integration

The package includes specialized validation and controls for FanzFinance OS:

```typescript
import { validateTransaction } from '@fanz/secure';

// Automatically validates:
// - Currency amounts in cents (prevents float errors)
// - Supported currencies (USD, EUR, GBP)
// - Transaction descriptions (sanitized)
// - Idempotency requirements

app.post('/api/finance/ledger', 
  validateTransaction,
  async (req, res) => {
    // Transaction data is validated and safe for financial processing
  }
);
```

### Adult Content Compliance

```typescript
import { validate } from '@fanz/secure';
import { z } from 'zod';

const contentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(10000), // Auto-sanitized for XSS
  ageRestricted: z.boolean().default(true), // Default to restricted
  contentWarnings: z.array(z.string()).optional(),
  verificationRequired: z.boolean().default(true)
});

app.post('/api/content', validate({ body: contentSchema }), (req, res) => {
  // Content is validated for adult platform requirements
});
```

## 🧪 Testing

### Unit Testing Security Middleware

```typescript
import request from 'supertest';
import express from 'express';
import { applySecurityMiddleware, validate } from '@fanz/secure';

const app = express();
applySecurityMiddleware(app);

describe('Security Middleware', () => {
  it('should block requests without proper headers', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ data: 'test' });
    
    expect(response.status).toBe(429); // Rate limited
  });

  it('should validate and sanitize input', async () => {
    // Test validation logic
  });

  it('should emit security events on suspicious activity', async () => {
    // Test security event emission
  });
});
```

## ⚙️ Configuration Reference

### Security Configuration Object

```typescript
interface SecurityConfig {
  cors: {
    origins: string[];           // Allowed origins
    credentials: boolean;        // Allow credentials
    methods: string[];          // Allowed HTTP methods
    allowedHeaders: string[];   // Allowed request headers
    exposedHeaders: string[];   // Headers exposed to browser
    maxAge: number;            // Preflight cache duration
  };
  
  rateLimiting: {
    tiers: {
      auth: RateLimitTier;      // Authentication rate limits
      payment: RateLimitTier;   // Payment rate limits  
      standard: RateLimitTier;  // Standard rate limits
      webhook: RateLimitTier;   // Webhook rate limits
    };
    redis?: RedisConfig;        // Optional Redis config
  };
  
  csp: {
    nonce: boolean;             // Enable nonce generation
    directives: Record<string, string[]>; // CSP directives
    reportOnly: boolean;        // Report-only mode
    reportUri?: string;         // CSP violation reporting
  };
  
  validation: {
    stripUnknown: boolean;      // Remove unknown fields
    abortEarly: boolean;        // Stop on first error
    maxDepth: number;           // Max object nesting
    maxArrayLength: number;     // Max array length
    maxStringLength: number;    // Max string length
    sanitization: {
      html: boolean;            // Enable HTML sanitization
      sql: boolean;             // Enable SQL injection prevention  
      xss: boolean;             // Enable XSS prevention
    };
  };
  
  logging: {
    level: LogLevel;            // Log level
    redactedFields: string[];   // Fields to redact
    correlationIdHeader: string; // Correlation ID header name
    auditLog: boolean;          // Enable audit logging
    securityEvents: boolean;    // Enable security event logging
  };
}
```

## 📖 API Reference

### Middleware Functions

| Function | Description | Usage |
|----------|-------------|--------|
| `applySecurityMiddleware(app)` | Apply standard security middleware to Express app | Basic setup |
| `createAuthSecurityMiddleware()` | Create auth-specific security middleware | Authentication routes |
| `createPaymentSecurityMiddleware()` | Create payment-specific security middleware | Payment routes |
| `createWebhookSecurityMiddleware()` | Create webhook-specific security middleware | Webhook endpoints |
| `createSecurityErrorHandler()` | Create security-aware error handler | Error handling |

### Validation Functions

| Function | Description | Usage |
|----------|-------------|--------|
| `validate(schemas)` | General validation middleware | Custom validation |
| `validatePagination` | Validate pagination parameters | List endpoints |
| `validateUuidParam(name)` | Validate UUID parameters | Resource endpoints |
| `validateTransaction` | Validate financial transactions | Payment endpoints |
| `validateContent` | Validate content creation | Content endpoints |

### Rate Limiting

| Function | Description | Usage |
|----------|-------------|--------|
| `authRateLimit` | Authentication rate limiting | Auth routes |
| `paymentRateLimit` | Payment rate limiting | Payment routes |
| `standardRateLimit` | Standard rate limiting | General routes |
| `webhookRateLimit` | Webhook rate limiting | Webhook routes |
| `createRateLimitMiddleware(config)` | Custom rate limiting | Custom requirements |

### Security Events

| Function | Description | Usage |
|----------|-------------|--------|
| `emitSecurityEvent(event)` | Emit security event | Security monitoring |
| `onSecurityEvent(type, handler)` | Listen for security events | Event handling |
| `getSecurityEventStats()` | Get security statistics | Monitoring dashboards |

### Logging

| Function | Description | Usage |
|----------|-------------|--------|
| `createSecurityLogger(name)` | Create security logger | Component logging |
| `createAuditLogger(name)` | Create audit logger | Compliance logging |
| `createHttpLogger()` | Create HTTP request logger | Request logging |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/security-enhancement`
3. Make changes and add tests
4. Run security tests: `npm run test:security`
5. Submit a pull request

### Development Setup

```bash
git clone https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git
cd FANZ-Unified-Ecosystem/security/fanz-secure
npm install
npm run build
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔒 Security

For security issues, please email security@fanz.eco instead of using the issue tracker.

## 📞 Support

- 📖 [Documentation](https://docs.fanz.eco/security)
- 💬 [Discord Community](https://discord.gg/fanz)
- 📧 [Email Support](mailto:support@fanz.eco)
- 🐛 [Issue Tracker](https://github.com/FanzCEO/FANZ-Unified-Ecosystem/issues)

---

Built with ❤️ for the FANZ Unified Ecosystem

**🛡️ Security First • 🚀 Enterprise Ready • 💪 Battle Tested**
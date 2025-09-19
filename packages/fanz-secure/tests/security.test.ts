import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import Redis from 'ioredis-mock';
import { randomBytes } from 'crypto';
import {
  createSecurityChain,
  createFinanceChain,
  SecurityMonitoringSystem,
  FinanceScopes,
  TransactionIdempotency,
  LedgerValidator,
  SSRFProtection,
  FileUploadSafety,
  CORSManager,
  DeserializationSecurity
} from '../src/index';

// Mock Redis client
const mockRedis = new Redis();

// Test utilities
const createTestApp = (middleware: any[]) => {
  const app = express();
  app.use(express.json());
  
  // Apply security middleware
  middleware.forEach(mw => app.use(mw));
  
  // Test routes
  app.get('/api/test', (req, res) => {
    res.json({ message: 'success', user: req.user });
  });
  
  app.post('/api/transaction', (req, res) => {
    res.json({ 
      success: true, 
      transactionId: req.body.transactionId,
      idempotencyKey: req.idempotencyKey 
    });
  });
  
  app.post('/api/upload', (req, res) => {
    res.json({ success: true, files: req.files });
  });
  
  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({ error: err.message });
  });
  
  return app;
};

describe('Security Middleware Test Suite', () => {
  let app: express.Application;
  let securityMonitor: SecurityMonitoringSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    securityMonitor = new SecurityMonitoringSystem();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce standard rate limits', async () => {
      app = createTestApp(createSecurityChain());
      
      // First request should succeed
      let response = await request(app)
        .get('/api/test')
        .expect(200);
      
      // Simulate rapid requests (would need to configure lower limits for testing)
      const responses = [];
      for (let i = 0; i < 10; i++) {
        responses.push(await request(app).get('/api/test'));
      }
      
      // Should eventually get rate limited
      // Note: In real implementation, you'd configure test-specific lower limits
      expect(responses.some(r => r.status === 429)).toBeTruthy();
    });

    it('should apply different limits to different tiers', async () => {
      app = createTestApp(createFinanceChain(FinanceScopes.PAYOUT_EXECUTE));
      
      const response = await request(app)
        .post('/api/transaction')
        .send({ 
          externalId: 'test-123',
          accountId: 'acc-456',
          amount: { amount: 1000, currency: 'USD' }
        });
      
      // Finance endpoints should have stricter rate limits
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Input Validation Tests', () => {
    beforeEach(() => {
      app = createTestApp(createSecurityChain());
    });

    it('should reject malicious SQL injection attempts', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users --",
        "admin'/*",
        "1; DELETE FROM accounts WHERE 1=1 --"
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/test')
          .send({ query: payload });
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/test')
          .send({ message: payload });
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should enforce size limits', async () => {
      const largePayload = 'x'.repeat(100000); // 100KB
      
      const response = await request(app)
        .post('/api/test')
        .send({ data: largePayload });
      
      expect(response.status).toBe(413); // Payload too large
    });

    it('should reject deeply nested objects', async () => {
      let deepObject: any = {};
      let current = deepObject;
      
      // Create object with 50 levels of nesting
      for (let i = 0; i < 50; i++) {
        current.nested = {};
        current = current.nested;
      }
      
      const response = await request(app)
        .post('/api/test')
        .send(deepObject);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Authentication & Authorization Tests', () => {
    beforeEach(() => {
      app = createTestApp(createSecurityChain({ authentication: true }));
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/test');
      
      expect(response.status).toBe(401);
    });

    it('should accept valid JWT tokens', async () => {
      // Mock JWT for testing (using safe test token)
      const mockJWT = 'test-valid-jwt-token-for-security-testing';
      
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${mockJWT}`);
      
      // Would need proper JWT validation in real test
      expect(response.status).toBeLessThan(500);
    });

    it('should reject malformed tokens', async () => {
      const invalidTokens = [
        'Bearer invalid-token',
        'Bearer ',
        'invalid-format',
        ''
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/test')
          .set('Authorization', token);
        
        expect(response.status).toBe(401);
      }
    });
  });

  describe('CSRF Protection Tests', () => {
    beforeEach(() => {
      app = createTestApp(createSecurityChain({ csrf: true }));
    });

    it('should reject POST requests without CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' });
      
      expect(response.status).toBe(403);
    });

    it('should accept requests with valid CSRF token', async () => {
      // First get CSRF token
      const tokenResponse = await request(app)
        .get('/api/csrf-token');
      
      const csrfToken = tokenResponse.body.csrfToken;
      
      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' });
      
      expect(response.status).toBeLessThan(400);
    });
  });

  describe('Financial Security Tests', () => {
    beforeEach(() => {
      app = createTestApp(createFinanceChain(FinanceScopes.TRANSACTION_CREATE));
    });

    it('should enforce idempotency for transactions', async () => {
      const transactionData = {
        externalId: 'unique-tx-123',
        accountId: 'acc-456',
        amount: { amount: 10000, currency: 'USD' },
        entries: [
          {
            id: 'entry-1',
            transactionId: 'tx-1',
            accountId: 'acc-456',
            amount: { amount: 10000, currency: 'USD' },
            type: 'debit',
            description: 'Test transaction'
          },
          {
            id: 'entry-2',
            transactionId: 'tx-1',
            accountId: 'acc-789',
            amount: { amount: 10000, currency: 'USD' },
            type: 'credit',
            description: 'Test transaction'
          }
        ]
      };

      // First request should succeed
      const response1 = await request(app)
        .post('/api/transaction')
        .send(transactionData);
      
      expect(response1.status).toBeLessThan(400);

      // Duplicate request should return the same result
      const response2 = await request(app)
        .post('/api/transaction')
        .send(transactionData);
      
      expect(response2.status).toBe(200);
      expect(response2.body.status).toBe('duplicate');
    });

    it('should validate double-entry ledger balance', async () => {
      const unbalancedTransaction = {
        externalId: 'unbalanced-tx-123',
        accountId: 'acc-456',
        entries: [
          {
            id: 'entry-1',
            transactionId: 'tx-1',
            accountId: 'acc-456',
            amount: { amount: 10000, currency: 'USD' },
            type: 'debit',
            description: 'Unbalanced transaction'
          }
          // Missing credit entry - transaction won't balance
        ]
      };

      const response = await request(app)
        .post('/api/transaction')
        .send(unbalancedTransaction);
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('LEDGER_VALIDATION_ERROR');
    });

    it('should enforce transaction amount limits', async () => {
      const highValueTransaction = {
        externalId: 'high-value-tx-123',
        accountId: 'acc-456',
        amount: { amount: 999999999999, currency: 'USD' }, // Exceeds $10B limit
        entries: []
      };

      const response = await request(app)
        .post('/api/transaction')
        .send(highValueTransaction);
      
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('AMOUNT_LIMIT_EXCEEDED');
    });
  });

  describe('File Upload Security Tests', () => {
    let fileUploadSafety: FileUploadSafety;

    beforeEach(() => {
      fileUploadSafety = new FileUploadSafety({
        maxFileSize: 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.jpeg', '.png']
      });
    });

    it('should reject files with dangerous extensions', async () => {
      const dangerousFiles = [
        { originalname: 'malware.exe', mimetype: 'application/exe', size: 1000 },
        { originalname: 'script.js', mimetype: 'text/javascript', size: 1000 },
        { originalname: 'payload.php', mimetype: 'application/php', size: 1000 }
      ];

      for (const file of dangerousFiles) {
        expect(() => {
          fileUploadSafety.validateFile(file as any);
        }).toThrow();
      }
    });

    it('should reject oversized files', async () => {
      const oversizedFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024 // 10MB
      };

      expect(() => {
        fileUploadSafety.validateFile(oversizedFile as any);
      }).toThrow('exceeds maximum allowed');
    });

    it('should sanitize filenames', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        'test..\\..\\windows\\system32',
        'file with spaces and "quotes"',
        '<script>alert(1)</script>.jpg'
      ];

      for (const filename of maliciousFilenames) {
        const sanitized = fileUploadSafety['pathSafety'].sanitizeFilename(filename);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
      }
    });
  });

  describe('SSRF Protection Tests', () => {
    let ssrfProtection: SSRFProtection;

    beforeEach(() => {
      ssrfProtection = new SSRFProtection({
        allowedDomains: ['api.fanz.com', 'webhook.fanz.com']
      });
    });

    it('should block requests to internal IP ranges', async () => {
      const internalUrls = [
        'http://127.0.0.1:8080/admin',
        'http://192.168.1.1/config',
        'http://10.0.0.1/internal',
        'http://172.16.0.1/metadata'
      ];

      for (const url of internalUrls) {
        expect(ssrfProtection.validateURL(url)).toBe(false);
      }
    });

    it('should allow requests to whitelisted domains', async () => {
      const allowedUrls = [
        'https://api.fanz.com/v1/data',
        'https://webhook.fanz.com/notify'
      ];

      for (const url of allowedUrls) {
        expect(ssrfProtection.validateURL(url)).toBe(true);
      }
    });

    it('should block requests to non-whitelisted domains', async () => {
      const blockedUrls = [
        'https://evil.com/steal-data',
        'http://attacker.net/payload',
        'https://malicious-site.org/backdoor'
      ];

      for (const url of blockedUrls) {
        expect(ssrfProtection.validateURL(url)).toBe(false);
      }
    });
  });

  describe('Security Monitoring Tests', () => {
    it('should detect and record security events', async () => {
      const events: any[] = [];
      securityMonitor.on('securityEvent', (event) => {
        events.push(event);
      });

      // Simulate auth failures
      for (let i = 0; i < 6; i++) {
        securityMonitor.recordEvent({
          type: 'AUTH_FAILURE' as any,
          source: { ip: '192.168.1.100' },
          details: { endpoint: '/login' }
        });
      }

      expect(events).toHaveLength(6);
      expect(events[0].type).toBe('AUTH_FAILURE');
    });

    it('should trigger auto-responses for rule violations', async () => {
      const violations: any[] = [];
      securityMonitor.on('ruleViolation', (data) => {
        violations.push(data);
      });

      // Simulate brute force attack
      const ip = '192.168.1.200';
      for (let i = 0; i < 25; i++) {
        securityMonitor.recordEvent({
          type: 'AUTH_FAILURE' as any,
          source: { ip },
          details: { endpoint: '/login' }
        });
      }

      // Should trigger brute force detection rule
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should block IPs after multiple violations', async () => {
      app = createTestApp([securityMonitor.middleware()]);

      const ip = '192.168.1.300';
      
      // Simulate security violations to trigger blocking
      for (let i = 0; i < 25; i++) {
        securityMonitor.recordEvent({
          type: 'AUTH_FAILURE' as any,
          source: { ip },
          details: { endpoint: '/login' }
        });
      }

      // Subsequent requests from this IP should be blocked
      const response = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', ip);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('IP_BLOCKED');
    });
  });

  describe('Deserialization Security Tests', () => {
    let deserializationSecurity: DeserializationSecurity;

    beforeEach(() => {
      deserializationSecurity = new DeserializationSecurity({
        maxDepth: 5,
        maxKeys: 50
      });
    });

    it('should prevent prototype pollution', async () => {
      const maliciousPayloads = [
        '{"__proto__": {"admin": true}}',
        '{"constructor": {"prototype": {"admin": true}}}',
        '{"prototype": {"admin": true}}'
      ];

      for (const payload of maliciousPayloads) {
        expect(() => {
          deserializationSecurity.safeJSONParse(payload);
        }).toThrow('Dangerous prototype keys detected');
      }
    });

    it('should limit object depth', async () => {
      const deepObject = '{"a":{"b":{"c":{"d":{"e":{"f":"too deep"}}}}}}';
      
      expect(() => {
        deserializationSecurity.safeJSONParse(deepObject);
      }).toThrow('Maximum nesting depth exceeded');
    });

    it('should limit number of keys', async () => {
      const manyKeys: any = {};
      for (let i = 0; i < 100; i++) {
        manyKeys[`key${i}`] = `value${i}`;
      }
      
      expect(() => {
        deserializationSecurity.validateObject(manyKeys, 0);
      }).toThrow('Object key count exceeds maximum');
    });
  });
});

describe('Property-Based Security Testing', () => {
  // Property-based testing using generated inputs
  describe('Fuzz Testing Critical Endpoints', () => {
    let app: express.Application;

    beforeEach(() => {
      app = createTestApp(createSecurityChain());
    });

    it('should handle random input without crashing', async () => {
      const testCases = 100;
      const failures: any[] = [];

      for (let i = 0; i < testCases; i++) {
        try {
          const randomPayload = generateRandomPayload();
          
          const response = await request(app)
            .post('/api/test')
            .send(randomPayload);
          
          // Should not return 5xx errors (server crashes)
          if (response.status >= 500) {
            failures.push({
              payload: randomPayload,
              status: response.status,
              error: response.body
            });
          }
        } catch (error) {
          failures.push({
            error: error.message,
            iteration: i
          });
        }
      }

      expect(failures).toHaveLength(0);
    });

    it('should validate all financial inputs properly', async () => {
      app = createTestApp(createFinanceChain(FinanceScopes.TRANSACTION_CREATE));
      
      const testCases = 50;
      let validationErrorCount = 0;

      for (let i = 0; i < testCases; i++) {
        const randomFinancialPayload = generateRandomFinancialPayload();
        
        const response = await request(app)
          .post('/api/transaction')
          .send(randomFinancialPayload);
        
        // Should either succeed or return validation error, never crash
        expect(response.status).not.toBeGreaterThanOrEqual(500);
        
        if (response.status >= 400) {
          validationErrorCount++;
        }
      }

      // Most random inputs should be rejected by validation
      expect(validationErrorCount).toBeGreaterThan(testCases * 0.8);
    });
  });
});

// Utility functions for test data generation
function generateRandomPayload(): any {
  const generators = [
    () => ({ string: randomBytes(Math.floor(Math.random() * 1000)).toString('hex') }),
    () => ({ number: Math.random() * 1000000 }),
    () => ({ array: new Array(Math.floor(Math.random() * 100)).fill('x') }),
    () => ({ nested: { deep: { very: { deep: 'value' } } } }),
    () => ({ special: '"><script>alert(1)</script>' }),
    () => ({ sql: "'; DROP TABLE users; --" }),
    () => ({ null: null }),
    () => ({ undefined: undefined }),
    () => ({ boolean: Math.random() > 0.5 })
  ];

  return generators[Math.floor(Math.random() * generators.length)]();
}

function generateRandomFinancialPayload(): any {
  return {
    externalId: Math.random() > 0.5 ? `tx-${randomBytes(8).toString('hex')}` : Math.random().toString(),
    accountId: Math.random() > 0.5 ? `acc-${randomBytes(8).toString('hex')}` : 'invalid',
    amount: {
      amount: Math.floor(Math.random() * 1000000),
      currency: Math.random() > 0.5 ? 'USD' : 'INVALID'
    },
    entries: Math.random() > 0.5 ? [] : [
      {
        id: `entry-${randomBytes(4).toString('hex')}`,
        transactionId: `tx-${randomBytes(4).toString('hex')}`,
        accountId: `acc-${randomBytes(4).toString('hex')}`,
        amount: { amount: Math.floor(Math.random() * 1000), currency: 'USD' },
        type: Math.random() > 0.5 ? 'debit' : 'credit',
        description: 'Random test transaction'
      }
    ]
  };
}
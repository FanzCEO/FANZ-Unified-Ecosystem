/**
 * Jest Test Setup for FANZ Money Dash
 * Configures test environment, mocks, and database setup
 */

import { jest } from '@jest/globals';

// ES Module Mock Configurations
// Must be at top level before any imports that use these modules
jest.unstable_mockModule('../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    trace: jest.fn()
  },
  securityLogger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  },
  transactionLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  },
  auditLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  httpLogger: jest.fn((req, res, next) => next()),
  logSecurityEvent: jest.fn(),
  logTransaction: jest.fn(),
  logAudit: jest.fn(),
  logError: jest.fn(),
  logPerformance: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logPayment: jest.fn(),
  logUserAction: jest.fn(),
  logStartup: jest.fn()
}));

// Mock external dependencies
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
    sign: jest.fn(),
    decode: jest.fn()
  },
  verify: jest.fn(),
  sign: jest.fn(),
  decode: jest.fn()
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
    genSalt: jest.fn()
  },
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn()
}));

// Mock mongoose models
jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule('../src/models/Transaction.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

// Mock express-validator
jest.unstable_mockModule('express-validator', () => ({
  body: jest.fn(() => ({
    isEmail: jest.fn(() => ({ withMessage: jest.fn(() => ({ normalizeEmail: jest.fn(() => ({ bail: jest.fn(() => ({})) })) })) })),
    isLength: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    isStrongPassword: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    matches: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    isUUID: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    isObject: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    custom: jest.fn(() => ({}))
  })),
  param: jest.fn(() => ({
    isUUID: jest.fn(() => ({ withMessage: jest.fn(() => ({})) }))
  })),
  query: jest.fn(() => ({
    optional: jest.fn(() => ({
      isInt: jest.fn(() => ({ withMessage: jest.fn(() => ({ toInt: jest.fn(() => ({})) })) }))
    }))
  })),
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => [])
  }))
}));

// Mock express-rate-limit
jest.unstable_mockModule('express-rate-limit', () => ({
  default: jest.fn(() => (req, res, next) => next())
}));

jest.unstable_mockModule('../src/config/database.js', () => ({
  connectDB: jest.fn(() => Promise.resolve()),
  disconnectDB: jest.fn(() => Promise.resolve()),
  getDB: jest.fn(() => ({
    collection: jest.fn(() => ({
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      find: jest.fn(() => ({
        toArray: jest.fn(() => [])
      }))
    }))
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/fanz-money-dash-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.ACCOUNT_LOCK_TIME = '300000'; // 5 minutes

// Mock console methods to reduce test output noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for specific tests if needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock setTimeout and setInterval for consistent tests
jest.useFakeTimers();

// Mock Express request and response objects for testing
global.createMockReq = (overrides = {}) => ({
  get: jest.fn((header) => {
    const headers = {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      authorization: 'Bearer test-token',
      'x-forwarded-for': '127.0.0.1',
      ...overrides.headers
    };
    return headers[header.toLowerCase()];
  }),
  header: jest.fn((header) => {
    const headers = {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      authorization: 'Bearer test-token',
      'x-forwarded-for': '127.0.0.1',
      ...overrides.headers
    };
    return headers[header.toLowerCase()];
  }),
  headers: {
    'content-type': 'application/json',
    'user-agent': 'test-agent',
    authorization: 'Bearer test-token',
    'x-forwarded-for': '127.0.0.1',
    ...overrides.headers
  },
  body: {},
  params: {},
  query: {},
  user: null,
  ip: '127.0.0.1',
  path: '/',
  method: 'GET',
  originalUrl: '/',
  url: '/',
  ...overrides
});

global.createMockRes = (overrides = {}) => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    header: jest.fn(() => res),
    set: jest.fn(() => res),
    cookie: jest.fn(() => res),
    redirect: jest.fn(() => res),
    end: jest.fn(() => res),
    locals: {},
    ...overrides
  };
  return res;
};

// Global test helpers
global.testHelpers = {
  // Mock user data
  createMockUser: (overrides = {}) => ({
    userId: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'creator',
    status: 'active',
    verification: {
      email: { verified: true, verifiedAt: new Date() },
      identity: { verified: true, verifiedAt: new Date() }
    },
    platforms: [{
      platform: 'boyfanz',
      platformUserId: 'platform-123',
      status: 'active'
    }],
    compliance: {
      ageVerified: true,
      ageVerifiedAt: new Date()
    },
    ...overrides
  }),

  // Mock transaction data
  createMockTransaction: (overrides = {}) => ({
    transactionId: 'txn-test-123',
    type: 'subscription',
    category: 'revenue',
    status: 'completed',
    amount: {
      gross: 25.00,
      net: 22.50,
      fees: {
        platform: 2.50,
        payment: 0.00,
        tax: 0.00,
        total: 2.50
      }
    },
    currency: 'USD',
    user: {
      userId: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'creator'
    },
    platform: {
      name: 'boyfanz',
      userId: 'platform-123'
    },
    timestamps: {
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date()
    },
    ...overrides
  }),

  // Wait helper
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Express mocking utilities
  createMockReq: global.createMockReq,
  createMockRes: global.createMockRes,
  
  // Mock Express middleware
  createMockMiddleware: (shouldCallNext = true) => {
    return jest.fn((req, res, next) => {
      if (shouldCallNext && next) {
        next();
      }
    });
  },

  // Database cleanup helper
  cleanDatabase: async () => {
    // This will be implemented when we need database tests
    return Promise.resolve();
  }
};

// Set longer timeout for tests that involve database operations
jest.setTimeout(10000);

// Clean up after each test
afterEach(async () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clean up any test data
  await global.testHelpers.cleanDatabase();
});

// Global error handler for unhandled rejections in tests
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason);
  throw reason;
});
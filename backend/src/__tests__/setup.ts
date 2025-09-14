import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'fanz_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.API_VERSION = '1.0.0';

// Mock database connection
export const mockDb = {
  query: jest.fn(),
  transaction: jest.fn(),
  end: jest.fn()
};

// Mock Redis client
export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn()
};

// Setup Redis ping mock
(mockRedis.ping as any).mockResolvedValue('PONG');

// Mock logger
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock metrics collector
export const mockMetrics = {
  recordBusinessEvent: jest.fn(),
  recordApiCall: jest.fn(),
  recordError: jest.fn()
};

// Mock user objects for testing
export const mockUser = {
  userId: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date(),
  isVerified: true
};

export const mockCreator = {
  userId: 'creator-123',
  username: 'testcreator',
  email: 'creator@example.com',
  role: 'creator',
  createdAt: new Date(),
  isVerified: true
};

export const mockAdmin = {
  userId: 'admin-123',
  username: 'testadmin',
  email: 'admin@example.com',
  role: 'admin',
  createdAt: new Date(),
  isVerified: true
};

// Mock transaction objects
export const mockTransaction = {
  id: 'tx-123',
  transaction_type: 'tip',
  sender_id: 'user-123',
  recipient_id: 'creator-123',
  amount: 10.00,
  currency: 'USD',
  fee_amount: 1.00,
  net_amount: 9.00,
  status: 'completed',
  created_at: new Date(),
  updated_at: new Date()
};

export const mockSubscriptionPlan = {
  id: 'plan-123',
  creator_id: 'creator-123',
  name: 'Premium Plan',
  description: 'Access to premium content',
  price: 9.99,
  currency: 'USD',
  billing_cycle: 'monthly',
  trial_period_days: 7,
  features: ['Premium content', 'Direct messages'],
  is_active: true,
  created_at: new Date()
};

export const mockBalance = {
  user_id: 'user-123',
  balance_type: 'available',
  balance: 100.00,
  currency: 'USD',
  updated_at: new Date()
};

// Mock Express request/response objects
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: mockUser,
  headers: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/',
  originalUrl: '/',
  path: '/',
  get: jest.fn(),
  ...overrides
});

export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
};

export const createMockNext = () => jest.fn();

// Setup global mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset mock implementations
  mockDb.query.mockReset();
  mockDb.transaction.mockReset();
  mockRedis.get.mockReset();
  mockRedis.set.mockReset();
  mockRedis.del.mockReset();
  mockLogger.info.mockReset();
  mockLogger.error.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.debug.mockReset();
  mockMetrics.recordBusinessEvent.mockReset();
  mockMetrics.recordApiCall.mockReset();
  mockMetrics.recordError.mockReset();
});

// Global teardown
afterAll(async () => {
  // Close database connections
  await mockDb.end();
  await mockRedis.quit();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock Date.now for consistent testing
const mockDate = new Date('2023-01-01T00:00:00Z');
global.Date.now = jest.fn(() => mockDate.getTime());
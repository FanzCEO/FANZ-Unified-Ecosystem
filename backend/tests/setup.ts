// 🧪 FANZ Backend - Global Test Setup
import { config } from 'dotenv';
import { performance } from 'perf_hooks';
import axios from 'axios';
// Node.js built-in URL class for robust URL parsing
// No explicit import needed in Node 10+, global 'URL' is available

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(30000);

// Mock axios globally for all HTTP requests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock console methods in test environment
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console.log, console.warn, etc. to reduce noise
  if (process.env.SILENT_TESTS !== 'false') {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  }
  
  // Keep console.error for debugging
  console.error = originalConsole.error;
  
  // Set up default mocks for payment processors using axios mocking
  setupAxiosMocks();
});

beforeEach(() => {
  // Reset axios mocks before each test
  jest.clearAllMocks();
  setupAxiosMocks();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
  
  // Restore axios mocks
  jest.restoreAllMocks();
});

// Global test utilities
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    generateId: () => string;
    getCurrentTimestamp: () => string;
    measurePerformance: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>;
  };
}

global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateId: () => Math.random().toString(36).substring(2, 15),
  
  getCurrentTimestamp: () => new Date().toISOString(),
  
  measurePerformance: async <T>(fn: () => Promise<T>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  }
};

// Enhanced Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidTimestamp(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  },
  
  toHaveValidationError(received: any, field: string) {
    const hasError = received.errors && 
                    Array.isArray(received.errors) &&
                    received.errors.some((error: any) => error.field === field);
    
    if (hasError) {
      return {
        message: () => `expected response not to have validation error for field ${field}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have validation error for field ${field}`,
        pass: false,
      };
    }
  },
  
  toBeOneOf(received: any, items: any[]) {
    const pass = items.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${items.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${items.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidUUID(): R;
      toBeValidTimestamp(): R;
      toHaveValidationError(field: string): R;
      toBeOneOf(items: any[]): R;
    }
  }
}

// Suppress specific warnings in test environment
const originalEmit = process.emit;
(process.emit as any) = function (name: any, data?: any, ...args: any[]) {
  if (
    name === 'warning' && 
    typeof data === 'object' && 
    data && data.name === 'ExperimentalWarning'
  ) {
    return false;
  }
  return originalEmit.apply(process, [name, data, ...args] as any);
};

// Set up default HTTP mocks for payment processors using axios mocking
function setupAxiosMocks() {
  // Allowed payment processor hosts for mocks
  const ccbillHosts = ['ccbill.com', 'www.ccbill.com', 'pay.ccbill.com'];
  const paxumHosts = ['paxum.com', 'www.paxum.com', 'api.paxum.com'];
  const segpayHosts = ['segpay.com', 'www.segpay.com', 'api.segpay.com'];

  // Helper to check hostname against allowed (exact or subdomain)
  function isAllowedHost(url: string, allowedHosts: string[]): boolean {
    try {
      const { hostname } = new URL(url);
      return allowedHosts.some(allowed => (
        hostname === allowed || hostname.endsWith(`.${allowed}`)
      ));
    } catch {
      // Not a valid URL - fallback to 'false'
      return false;
    }
  }

  // Mock axios.post for various payment processor endpoints
  mockedAxios.post.mockImplementation((url: string, data?: any, config?: any) => {
    console.log('🔄 Mocked axios.post called for:', url);
    
    // CCBill API mocks
    if (isAllowedHost(url, ccbillHosts)) {
      if (url.includes('/wap-frontflex/flexforms/ping')) {
        return Promise.resolve({ data: { status: 'ok' }, status: 200 });
      }
      if (url.includes('/wap-frontflex/refund')) {
        return Promise.resolve({
          data: {
            results: [{
              approved: '1',
              refundId: 'mock-refund-123'
            }]
          },
          status: 200
        });
      }
      // Default CCBill response
      return Promise.resolve({ data: { status: 'ok' }, status: 200 });
    }
    
    // Paxum API mocks
    if (isAllowedHost(url, paxumHosts)) {
      if (url.includes('/api/payout')) {
        return Promise.resolve({
          data: {
            success: true,
            status: 'success',
            payoutId: 'mock-payout-123',
            transactionId: 'mock-txn-456'
          },
          status: 200
        });
      }
      // Default Paxum response
      return Promise.resolve({ data: { status: 'healthy' }, status: 200 });
    }
    
    // Segpay API mocks
    if (isAllowedHost(url, segpayHosts)) {
      return Promise.resolve({
        data: {
          success: true,
          transactionId: 'mock-segpay-123'
        },
        status: 200
      });
    }
    
    // Default fallback response
    return Promise.resolve({ data: { status: 'ok' }, status: 200 });
  });
  
  // Mock axios.get for health checks and other GET requests
  mockedAxios.get.mockImplementation((url: string, config?: any) => {
    console.log('🔄 Mocked axios.get called for:', url);
    
    if (isAllowedHost(url, paxumHosts)) {
      return Promise.resolve({ data: { status: 'healthy' }, status: 200 });
    }
    if (isAllowedHost(url, segpayHosts)) {
      return Promise.resolve({ data: { status: 'ok' }, status: 200 });
    }
    if (isAllowedHost(url, ccbillHosts)) {
      return Promise.resolve({ data: { status: 'ok' }, status: 200 });
    }
    
    return Promise.resolve({ data: { status: 'ok' }, status: 200 });
  });
}

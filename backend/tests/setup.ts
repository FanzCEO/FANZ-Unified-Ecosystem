// 🧪 FANZ Backend - Global Test Setup
import { config } from 'dotenv';
import { performance } from 'perf_hooks';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(30000);

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
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
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

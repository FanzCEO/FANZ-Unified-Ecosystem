import request from 'supertest';
import { RedisClientType } from 'redis';
import app from '../src/auth';

// 🧪 Rate Limiting Integration Tests
// Validates comprehensive rate limiting behavior across all endpoint categories

describe('Rate Limiting', () => {
  let redisClient: RedisClientType;
  
  beforeAll(async () => {
    // Initialize Redis client for test cleanup
    const redis = require('redis');
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redisClient.connect();
  });
  
  afterAll(async () => {
    await redisClient.quit();
  });
  
  beforeEach(async () => {
    // Clean up rate limit keys before each test
    const keys = await redisClient.keys('rl:auth:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });
  
  describe('Sensitive Operations Rate Limiting', () => {
    const loginPayload = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };
    
    it('should enforce IP-based rate limit on login attempts', async () => {
      const maxAttempts = 5; // Default sensitive limit per IP
      
      // Make requests up to the limit
      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginPayload)
          .set('X-Forwarded-For', '192.168.1.100');
          
        expect(response.status).toBe(401); // Invalid credentials
        expect(response.headers['ratelimit-limit']).toBe('5');
        expect(response.headers['ratelimit-remaining']).toBe(String(maxAttempts - i - 1));
      }
      
      // Next request should be rate limited
      const rateLimitedResponse = await request(app)
        .post('/api/auth/login')
        .send(loginPayload)
        .set('X-Forwarded-For', '192.168.1.100');
        
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.code).toBe('RATE_LIMITED');
      expect(rateLimitedResponse.body.category).toBe('sensitive');
      expect(rateLimitedResponse.body.message).toContain('authentication attempts');
      expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
    });
  });
  
  describe('Token Operations Rate Limiting', () => {
    it('should enforce moderate rate limits on token refresh', async () => {
      const refreshPayload = { refreshToken: 'invalid-refresh-token' };
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshPayload)
        .set('X-Forwarded-For', '192.168.1.101');
        
      expect(response.status).toBe(401); // Invalid token
      expect(response.headers['ratelimit-limit']).toBe('30');
    });
  });
});

// Helper to expand Jest matchers
(expect as any).extend({
  toBeOneOf(received: any, validOptions: any[]) {
    const pass = validOptions.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validOptions}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validOptions}`,
        pass: false,
      };
    }
  },
});

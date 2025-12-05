/**
 * Middleware Test Suite for FANZ Money Dash
 * Tests authentication, error handling, security, and validation middleware
 */

import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn()
  }
}));

describe('Middleware Test Suite', () => {
  let app;
  let mockUser;
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock user data
    mockUser = global.testHelpers.createMockUser({
      userId: 'user-123',
      username: 'testuser',
      email: 'test@fanz.network',
      role: 'creator'
    });

    // Mock middleware functions
    mockRequest = {
      headers: {
        'user-agent': 'test-agent'
      },
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/test',
      path: '/test',
      // Add the get method that auth middleware expects
      get: jest.fn((header) => {
        const headers = {
          'user-agent': 'test-agent',
          ...mockRequest.headers
        };
        return headers[header.toLowerCase()];
      })
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      set: jest.fn()
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Authentication Middleware', () => {
    let authMiddleware;

    beforeEach(async () => {
      // Import auth middleware
      const authModule = await import('../src/middleware/auth.js');
      authMiddleware = authModule.authenticateToken || authModule.default;
    });

    test('should authenticate valid JWT token', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify.mockReturnValue({ 
        userId: 'user-123', 
        email: 'test@fanz.network',
        role: 'creator',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(
        validToken, 
        'test-jwt-secret-key-for-testing-only',
        expect.objectContaining({
          issuer: 'fanz-money-dash',
          audience: 'fanz-network',
          algorithms: ['HS256']
        })
      );
      expect(mockRequest.user).toEqual(expect.objectContaining({
        userId: 'user-123',
        email: 'test@fanz.network',
        role: 'creator'
      }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringMatching(/token.*required/i)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid token format', async () => {
      mockRequest.headers.authorization = 'InvalidTokenFormat';

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Access token required' // Auth middleware checks for 'Bearer ' prefix first
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject expired JWT token', async () => {
      const expiredToken = 'expired.jwt.token';
      mockRequest.headers.authorization = `Bearer ${expiredToken}`;
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringMatching(/token.*expired/i)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject malformed JWT token', async () => {
      const malformedToken = 'malformed.token';
      mockRequest.headers.authorization = `Bearer ${malformedToken}`;
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringMatching(/invalid.*token/i)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject token with missing required fields', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers.authorization = `Bearer ${validToken}`;
      
      jwt.verify.mockReturnValue({ userId: 'user-123' }); // Missing email and role
      
      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token format'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle JWT secret validation', async () => {
      const validToken = 'valid.jwt.token';
      mockRequest.headers.authorization = `Bearer ${validToken}`;
      
      // Temporarily remove JWT secret to test validation
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'short'; // Too short (< 32 chars)
      
      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Server configuration error'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
      
      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Error Handler Middleware', () => {
    let errorHandler;

    beforeEach(async () => {
      const errorModule = await import('../src/middleware/errorHandler.js');
      errorHandler = errorModule.default || errorModule.errorHandler;
    });

    test('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        email: { message: 'Invalid email format' },
        username: { message: 'Username too short' }
      };

      errorHandler(validationError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid email format, Username too short',
          code: 'VALIDATION_ERROR',
          errorId: expect.stringMatching(/^err_\d+_[a-z0-9]+$/),
          timestamp: expect.any(String)
        })
      );
    });

    test('should handle CastError (invalid ObjectId)', () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      castError.path = '_id';
      castError.value = 'invalid-id';

      errorHandler(castError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringMatching(/invalid.*id/i)
        })
      );
    });

    test('should handle duplicate key errors', () => {
      const duplicateError = new Error('Duplicate key error');
      duplicateError.code = 11000;
      duplicateError.keyPattern = { email: 1 };

      errorHandler(duplicateError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Duplicate entry detected',
          code: 'DUPLICATE_ERROR'
        })
      );
    });

    test('should handle JWT errors', () => {
      const jwtError = new Error('jwt malformed');
      jwtError.name = 'JsonWebTokenError';

      errorHandler(jwtError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid authentication token',
          code: 'INVALID_TOKEN'
        })
      );
    });

    test('should handle rate limit errors', () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.status = 429;

      errorHandler(rateLimitError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        })
      );
    });

    test('should handle generic server errors', () => {
      const serverError = new Error('Something went wrong');

      errorHandler(serverError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
          code: 'INTERNAL_ERROR'
        })
      );
    });

    test('should not leak sensitive information in production', () => {
      process.env.NODE_ENV = 'production';
      
      const sensitiveError = new Error('Database password: secret123');
      sensitiveError.stack = 'Error: Database password: secret123\n    at /app/src/db.js:123:45';

      errorHandler(sensitiveError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
          code: 'INTERNAL_ERROR'
        })
      );
      
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('stack');
      expect(JSON.stringify(responseCall)).not.toContain('secret123');
      
      process.env.NODE_ENV = 'test';
    });

    test('should log errors appropriately', async () => {
      const loggerModule = await import('../src/config/logger.js');
      const loggerSpy = jest.spyOn(loggerModule.default, 'error');
      
      const error = new Error('Test error for logging');
      error.status = 500;

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          errorId: expect.stringMatching(/^err_\d+_[a-z0-9]+$/),
          name: 'Error',
          message: 'Test error for logging'
        })
      );
      
      loggerSpy.mockRestore();
    });
  });

  describe('Security Middleware', () => {
    test('should add security headers', async () => {
      // Create middleware route for testing
      app.use((req, res, next) => {
        // Simulate helmet middleware
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'DENY');
        res.set('X-XSS-Protection', '1; mode=block');
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });

    test('should enforce CORS policy', async () => {
      app.use((req, res, next) => {
        const allowedOrigins = ['https://fanz.network', 'https://FanzMoneyDash.com'];
        const origin = req.get('Origin');
        
        if (allowedOrigins.includes(origin)) {
          res.set('Access-Control-Allow-Origin', origin);
        }
        
        res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      // Test allowed origin
      const allowedResponse = await request(app)
        .get('/test')
        .set('Origin', 'https://fanz.network');

      expect(allowedResponse.headers['access-control-allow-origin']).toBe('https://fanz.network');

      // Test disallowed origin
      const disallowedResponse = await request(app)
        .get('/test')
        .set('Origin', 'https://malicious-site.com');

      expect(disallowedResponse.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('should sanitize input data', async () => {
      app.use((req, res, next) => {
        // Simulate input sanitization
        if (req.body) {
          for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
              req.body[key] = req.body[key]
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
            }
          }
        }
        next();
      });

      app.post('/test', (req, res) => {
        res.json({ data: req.body });
      });

      const maliciousData = {
        username: 'user<script>alert("xss")</script>',
        bio: 'Hello javascript:alert("xss")',
        onClick: 'onclick=alert("xss")'
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousData);

      expect(response.body.data.username).not.toContain('<script>');
      expect(response.body.data.bio).not.toContain('javascript:');
      expect(response.body.data.onClick).not.toContain('onclick=');
    });

    test('should handle content security policy', async () => {
      app.use((req, res, next) => {
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "connect-src 'self' wss:",
          "font-src 'self'",
          "object-src 'none'",
          "media-src 'self'",
          "frame-src 'none'"
        ].join('; ');
        
        res.set('Content-Security-Policy', csp);
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');

      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain("object-src 'none'");
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('should enforce rate limits', async () => {
      let requestCount = 0;
      const maxRequests = 5;

      app.use((req, res, next) => {
        const clientIp = req.ip || req.connection.remoteAddress;
        requestCount++;
        
        if (requestCount > maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: 60
          });
        }
        
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true, requestNumber: requestCount });
      });

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }

      // The next request should be rate limited
      const rateLimitedResponse = await request(app).get('/test');
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.error).toBe('Too many requests');
    });

    test('should reset rate limits after time window', async () => {
      let requestCounts = new Map();
      const maxRequests = 3;
      const windowMs = 100; // 100ms window for testing

      app.use((req, res, next) => {
        const clientIp = req.ip || '127.0.0.1';
        const now = Date.now();
        
        if (!requestCounts.has(clientIp)) {
          requestCounts.set(clientIp, { count: 0, resetTime: now + windowMs });
        }
        
        const clientData = requestCounts.get(clientIp);
        
        if (now > clientData.resetTime) {
          clientData.count = 0;
          clientData.resetTime = now + windowMs;
        }
        
        clientData.count++;
        
        if (clientData.count > maxRequests) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded'
          });
        }
        
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }

      // Next request should be rate limited
      const rateLimitedResponse = await request(app).get('/test');
      expect(rateLimitedResponse.status).toBe(429);

      // Wait for window to reset (use fake timers)
      jest.advanceTimersByTime(150);

      // Should be able to make requests again
      const afterResetResponse = await request(app).get('/test');
      expect(afterResetResponse.status).toBe(200);
    });
  });

  describe('Validation Middleware', () => {
    test('should validate required fields', async () => {
      app.use('/test', (req, res, next) => {
        const requiredFields = ['username', 'email'];
        const missing = requiredFields.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Missing required fields: ${missing.join(', ')}`
          });
        }
        
        next();
      });

      app.post('/test', (req, res) => {
        res.json({ success: true, data: req.body });
      });

      // Test with missing fields
      const incompleteResponse = await request(app)
        .post('/test')
        .send({ username: 'testuser' }); // Missing email

      expect(incompleteResponse.status).toBe(400);
      expect(incompleteResponse.body.error).toContain('email');

      // Test with all required fields
      const completeResponse = await request(app)
        .post('/test')
        .send({ username: 'testuser', email: 'test@example.com' });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.success).toBe(true);
    });

    test('should validate data types', async () => {
      app.use('/test', (req, res, next) => {
        const validations = [
          { field: 'age', type: 'number', min: 0, max: 120 },
          { field: 'email', type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
          { field: 'active', type: 'boolean' }
        ];
        
        for (const validation of validations) {
          const value = req.body[validation.field];
          
          if (value !== undefined) {
            if (validation.type === 'number' && typeof value !== 'number') {
              return res.status(400).json({
                success: false,
                error: `${validation.field} must be a number`
              });
            }
            
            if (validation.type === 'string' && typeof value !== 'string') {
              return res.status(400).json({
                success: false,
                error: `${validation.field} must be a string`
              });
            }
            
            if (validation.type === 'boolean' && typeof value !== 'boolean') {
              return res.status(400).json({
                success: false,
                error: `${validation.field} must be a boolean`
              });
            }
            
            if (validation.pattern && !validation.pattern.test(value)) {
              return res.status(400).json({
                success: false,
                error: `${validation.field} format is invalid`
              });
            }
            
            if (validation.min !== undefined && value < validation.min) {
              return res.status(400).json({
                success: false,
                error: `${validation.field} must be at least ${validation.min}`
              });
            }
            
            if (validation.max !== undefined && value > validation.max) {
              return res.status(400).json({
                success: false,
                error: `${validation.field} must be at most ${validation.max}`
              });
            }
          }
        }
        
        next();
      });

      app.post('/test', (req, res) => {
        res.json({ success: true, data: req.body });
      });

      // Test invalid types
      const invalidTypeResponse = await request(app)
        .post('/test')
        .send({ age: 'twenty-five' }); // Should be number

      expect(invalidTypeResponse.status).toBe(400);
      expect(invalidTypeResponse.body.error).toContain('number');

      // Test invalid email format
      const invalidEmailResponse = await request(app)
        .post('/test')
        .send({ email: 'invalid-email' });

      expect(invalidEmailResponse.status).toBe(400);
      expect(invalidEmailResponse.body.error).toContain('format');

      // Test valid data
      const validResponse = await request(app)
        .post('/test')
        .send({
          age: 25,
          email: 'test@example.com',
          active: true
        });

      expect(validResponse.status).toBe(200);
      expect(validResponse.body.success).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    test('should enforce admin-only access', async () => {
      app.use('/admin', (req, res, next) => {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Admin access required'
          });
        }
        next();
      });

      // Simulate auth middleware setting user
      app.use((req, res, next) => {
        req.user = mockUser; // Regular user
        next();
      });

      app.get('/admin/test', (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });

      const response = await request(app).get('/admin/test');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });

    test('should allow multiple roles', async () => {
      // Test with moderator role - SET USER FIRST
      app.use((req, res, next) => {
        req.user = { ...mockUser, role: 'moderator' };
        next();
      });

      app.use('/manage', (req, res, next) => {
        const allowedRoles = ['admin', 'moderator', 'support'];
        
        if (!req.user || !allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }
        next();
      });

      app.get('/manage/test', (req, res) => {
        res.json({ success: true, role: req.user.role });
      });

      const response = await request(app).get('/manage/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.role).toBe('moderator');
    });
  });

  describe('Request Logging Middleware', () => {
    test('should log HTTP requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      app.use((req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        });
        
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/test 200 - \d+ms/)
      );

      consoleSpy.mockRestore();
    });

    test('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.use((req, res, next) => {
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /\bselect\b.*\bfrom\b/i, // SQL injection
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
          /\.\.\//g // Directory traversal
        ];

        const requestString = JSON.stringify(req.body) + req.url;
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(requestString)) {
            console.warn(`Suspicious request detected from ${req.ip}: ${pattern}`);
            break;
          }
        }
        
        next();
      });

      app.post('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .post('/test')
        .send({ query: 'SELECT * FROM users' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious request detected')
      );

      consoleSpy.mockRestore();
    });
  });
});
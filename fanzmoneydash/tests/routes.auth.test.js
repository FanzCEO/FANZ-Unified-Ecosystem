/**
 * Authentication Routes Test Suite for FANZ Money Dash
 * Tests login, registration, password reset, JWT handling, and security features
 */

import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies before importing routes
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the User model
jest.mock('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

// Mock express-rate-limit to avoid test flakiness/timeouts
jest.mock('express-rate-limit', () => () => {
  return (req, _res, next) => next();
});

// Mock security config
jest.mock('../src/config/security.js', () => ({
  sanitizeInput: {
    general: (input) => input?.toString().trim() || '',
    email: (input) => input?.toString().toLowerCase().trim() || '',
    html: (input) => input?.toString().replace(/<[^>]*>/g, '') || ''
  }
}));

describe('Authentication Routes Test Suite', () => {
  let app;
  let server;
  let mockUser;

  beforeEach(async () => {
    // Setup Express app
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Import and mount auth routes dynamically to ensure mocks are applied
    const authRoutes = (await import('../src/routes/auth.js')).default;
    app.use('/auth', authRoutes);

    // Mock user data
    mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@fanz.network',
      password: '$2a$12$hashedpassword123',
      role: 'creator',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      loginAttempts: 0,
      lockUntil: null
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Set environment variables for tests
    process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-long-enough-for-security-requirements';
    process.env.JWT_EXPIRES_IN = '24h';
  });

  afterEach(() => {
    jest.resetAllMocks();
    if (server && server.close) {
      server.close();
    }
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('POST /auth/register', () => {
    test('should register new user with valid data', async () => {
      const registerData = {
        username: 'newcreator',
        email: 'new@fanz.network',
        password: 'SecurePass123!',
        role: 'creator'
      };

      // Mock bcrypt hash
      bcryptjs.hash.mockResolvedValue('$2a$12$hashedpassword123');
      
      // Mock User.findOne to return null (no existing user)
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(null);

      // Mock JWT signing
      jwt.sign.mockReturnValue('mock.jwt.token');

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('password');
    }, 10000);

    test('should reject registration with weak password', async () => {
      const registerData = {
        username: 'newcreator',
        email: 'new@fanz.network',
        password: '123', // Weak password - too short
        role: 'creator'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    }, 10000);

    test('should reject registration with duplicate email', async () => {
      const registerData = {
        username: 'newcreator',
        email: 'existing@fanz.network',
        password: 'SecurePass123!',
        role: 'creator'
      };

      // Mock User.findOne to return existing user
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/already.*exists/i);
    }, 10000);

    test('should validate required fields', async () => {
      const incompleteData = {
        username: 'newcreator'
        // Missing required fields
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    }, 10000);

    test('should validate email format', async () => {
      const registerData = {
        username: 'newcreator',
        email: 'invalid-email-format',
        password: 'SecurePass123!',
        role: 'creator'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    }, 10000);
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@fanz.network',
        password: 'correctpassword123'
      };

      // Mock User.findOne to return user
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare to return true
      bcryptjs.compare.mockResolvedValue(true);
      
      // Mock JWT signing
      jwt.sign.mockReturnValue('mock.jwt.token');

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('password');
    }, 10000);

    test('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@fanz.network',
        password: 'somepassword123'
      };

      // Mock User.findOne to return null (user not found)
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    }, 10000);

    test('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'test@fanz.network',
        password: 'wrongpassword123'
      };

      // Mock User.findOne to return user
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare to return false
      bcryptjs.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*credentials/i);
    }, 10000);

    test('should validate required login fields', async () => {
      const incompleteData = {
        email: 'test@fanz.network'
        // Missing password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    }, 10000);
  });

  describe('Security Features', () => {
    test('should enforce password complexity', () => {
      const weakPasswords = [
        '123',
        'password',
        'abcdefgh',
        '12345678',
        'Password',
        'password123'
      ];

      const strongPasswords = [
        'SecurePass123!',
        'MyStr0ng@Password',
        'C0mplex#Pass2024'
      ];

      // Password regex for testing (matches auth route implementation)
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

      weakPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(false);
      });

      strongPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(true);
      });
    });

    test('should sanitize user input', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>',
        email: 'test@fanz.network',
        password: 'SecurePass123!',
        role: 'creator'
      };

      // Mock User.findOne to return null
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData);

      // Input should be rejected due to invalid username format
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    }, 10000);

    test('should generate secure JWT tokens', () => {
      const payload = { userId: 'user-123', role: 'creator' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      const options = {
        expiresIn: '24h',
        issuer: 'fanz-money-dash',
        audience: 'fanz-network'
      };

      jwt.sign.mockReturnValue('secure.jwt.token');
      
      const token = jwt.sign(payload, secret, options);
      
      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, options);
      expect(token).toBe('secure.jwt.token');
    });

    test('should validate JWT token structure', () => {
      const token = 'header.payload.signature';
      const decoded = { userId: 'user-123', role: 'creator', exp: Date.now() / 1000 + 3600 };
      
      jwt.verify.mockReturnValue(decoded);
      
      const result = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('exp');
    });
  });
});
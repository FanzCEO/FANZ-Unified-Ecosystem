import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';
import { sanitizeInput } from '../config/security.js';

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// More lenient rate limiting for registration
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: 'Registration limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Track failed login attempts per email
const failedAttempts = new Map();

// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of failedAttempts.entries()) {
    if (now - data.lastAttempt > 30 * 60 * 1000) {
      failedAttempts.delete(email);
    }
  }
}, 30 * 60 * 1000);

const router = express.Router();

// Mock user database (replace with actual database integration)
const users = new Map();

// Manual validation helpers
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 12 || password.length > 128) return false;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 30) return false;
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
};

// Register new user
router.post('/register', registerRateLimit, async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    const errors = [];

    // Validate inputs
    if (!validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email required (max 255 characters)' });
    }

    if (!validatePassword(password)) {
      errors.push({ field: 'password', message: 'Password must be 12-128 characters and contain uppercase, lowercase, number, and special character' });
    }

    if (!validateUsername(username)) {
      errors.push({ field: 'username', message: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' });
    }

    const userRole = role || 'user';
    if (!['creator', 'user'].includes(userRole)) {
      errors.push({ field: 'role', message: 'Invalid role - only creator or user allowed' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Sanitize inputs
    const cleanEmail = sanitizeInput.general(email);
    const cleanUsername = sanitizeInput.general(username);

    // Check if user exists
    if (users.has(cleanEmail)) {
      logger.warn('Registration attempt for existing user', {
        email: cleanEmail.substring(0, 3) + '***',
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: Date.now().toString(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword,
      role: userRole,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.set(cleanEmail, user);

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET is missing or too short during registration');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'fanz-money-dash',
        audience: 'fanz-network'
      }
    );

    // Update last login timestamp
    user.lastLogin = new Date().toISOString();

    // Log successful registration
    logger.info('Successful registration', {
      userId: user.id,
      email: cleanEmail.substring(0, 3) + '***',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    // Validate inputs
    if (!validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email required' });
    }

    if (!password || typeof password !== 'string' || password.length < 1 || password.length > 128) {
      errors.push({ field: 'password', message: 'Password required (max 128 characters)' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Sanitize inputs
    const cleanEmail = sanitizeInput.general(email);

    // Check for account lockout
    const attempts = failedAttempts.get(cleanEmail);
    if (attempts && attempts.count >= 5) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < 30 * 60 * 1000) { // 30 minutes
        logger.warn('Login attempt on locked account', {
          email: cleanEmail.substring(0, 3) + '***',
          ip: req.ip,
          attemptsCount: attempts.count
        });
        return res.status(429).json({
          success: false,
          error: 'Account temporarily locked. Please try again later.',
          retryAfter: Math.ceil((30 * 60 * 1000 - timeSinceLastAttempt) / 60000) + ' minutes'
        });
      } else {
        // Reset attempts if lockout period has passed
        failedAttempts.delete(cleanEmail);
      }
    }

    // Find user
    const user = users.get(cleanEmail);
    if (!user || !user.isActive) {
      // Track failed attempt
      const currentAttempts = failedAttempts.get(cleanEmail) || { count: 0, lastAttempt: 0 };
      currentAttempts.count += 1;
      currentAttempts.lastAttempt = Date.now();
      failedAttempts.set(cleanEmail, currentAttempts);
      
      logger.warn('Login attempt for nonexistent/inactive user', {
        email: cleanEmail.substring(0, 3) + '***',
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Use consistent timing to prevent user enumeration
      await new Promise(resolve => setTimeout(resolve, 200));
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Track failed attempt
      const currentAttempts = failedAttempts.get(cleanEmail) || { count: 0, lastAttempt: 0 };
      currentAttempts.count += 1;
      currentAttempts.lastAttempt = Date.now();
      failedAttempts.set(cleanEmail, currentAttempts);
      
      logger.warn('Failed login attempt', {
        email: cleanEmail.substring(0, 3) + '***',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        failedAttempts: currentAttempts.count
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Clear failed attempts on successful login
    failedAttempts.delete(cleanEmail);

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET is missing or too short', {
        hasSecret: !!process.env.JWT_SECRET,
        secretLength: process.env.JWT_SECRET?.length || 0
      });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'fanz-money-dash',
        audience: 'fanz-network'
      }
    );

    // Update last login timestamp
    user.lastLogin = new Date().toISOString();

    // Log successful login
    logger.info('Successful login', {
      userId: user.id,
      email: cleanEmail.substring(0, 3) + '***',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

export default router;
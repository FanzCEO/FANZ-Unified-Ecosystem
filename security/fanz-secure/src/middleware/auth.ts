/**
 * @fanz/secure - Authentication & Authorization Middleware
 * Comprehensive RBAC/ABAC system with JWT tokens, 2FA, and device binding
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { createClient } from 'redis';
import { config } from '../config.js';
import { createSecurityLogger } from '../utils/logger.js';
import { emitSecurityEvent } from '../utils/securityEvents.js';
import { SecurityError, SecurityContext } from '../types.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  permissions: string[];
  scopes: string[];
  tenantId?: string;
  status: UserStatus;
  mfaEnabled: boolean;
  deviceBindings?: DeviceBinding[];
  lastActivity: Date;
  createdAt: Date;
}

export interface AuthToken {
  userId: string;
  sessionId: string;
  deviceId?: string;
  type: TokenType;
  scopes: string[];
  role: UserRole;
  tenantId?: string;
  issuedAt: number;
  expiresAt: number;
  refreshable: boolean;
}

export interface DeviceBinding {
  deviceId: string;
  deviceName: string;
  fingerprint: string;
  lastSeen: Date;
  trusted: boolean;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  mfaVerified: boolean;
  refreshTokenHash: string;
}

export interface AuthPolicy {
  name: string;
  type: PolicyType;
  rules: AuthRule[];
  priority: number;
  enabled: boolean;
}

export interface AuthRule {
  effect: 'ALLOW' | 'DENY';
  conditions: AuthCondition[];
  resources?: string[];
  actions?: string[];
}

export interface AuthCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: any;
  field?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'finance_admin' | 'creator' | 'user' | 'guest';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';
export type TokenType = 'access' | 'refresh' | 'service' | 'device';
export type PolicyType = 'RBAC' | 'ABAC' | 'HYBRID';
export type ConditionType = 'role' | 'scope' | 'resource' | 'time' | 'ip' | 'mfa' | 'device' | 'tenant';
export type ConditionOperator = 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'lt' | 'contains' | 'matches';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  session: AuthSession;
  token: AuthToken;
  security: SecurityContext;
  authPolicy?: AuthPolicy;
}

// ===============================
// AUTHENTICATION SERVICE
// ===============================

class AuthenticationService {
  private logger = createSecurityLogger('AuthenticationService');
  private redisClient?: any;
  private jwtSecret: string;
  private refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days
  private accessTokenTTL = 15 * 60; // 15 minutes
  private deviceTokenTTL = 30 * 24 * 60 * 60; // 30 days

  constructor() {
    this.jwtSecret = config.jwtSecret;
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (config.redisUrl || config.security.rateLimiting.redis) {
        const redisConfig = config.security.rateLimiting.redis;
        
        this.redisClient = createClient({
          url: config.redisUrl,
          socket: redisConfig ? {
            host: redisConfig.host,
            port: redisConfig.port
          } : undefined,
          password: redisConfig?.password,
          database: redisConfig?.db || 0
        });

        await this.redisClient.connect();
        this.logger.info('Redis connection established for authentication');
      }
    } catch (error) {
      this.logger.warn('Redis connection failed for authentication', {
        error: error.message
      });
      this.redisClient = undefined;
    }
  }

  // ===============================
  // TOKEN MANAGEMENT
  // ===============================

  /**
   * Generate JWT access token
   */
  generateAccessToken(user: AuthUser, session: AuthSession, deviceId?: string): string {
    const payload: AuthToken = {
      userId: user.id,
      sessionId: session.id,
      deviceId,
      type: 'access',
      scopes: this.getUserScopes(user),
      role: user.role,
      tenantId: user.tenantId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (this.accessTokenTTL * 1000),
      refreshable: true
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenTTL,
      issuer: 'fanz-auth',
      audience: 'fanz-api'
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId: string, sessionId: string, deviceId?: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHmac('sha256', this.jwtSecret).update(token).digest('hex');

    if (this.redisClient) {
      const key = `refresh_token:${userId}:${sessionId}`;
      await this.redisClient.setEx(key, this.refreshTokenTTL, JSON.stringify({
        hash: tokenHash,
        userId,
        sessionId,
        deviceId,
        createdAt: Date.now()
      }));
    }

    return token;
  }

  /**
   * Validate JWT token
   */
  validateAccessToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'fanz-auth',
        audience: 'fanz-api'
      }) as AuthToken;

      // Check if token is expired
      if (decoded.expiresAt < Date.now()) {
        this.logger.debug('Access token expired', {
          userId: decoded.userId,
          expiredAt: new Date(decoded.expiresAt)
        });
        return null;
      }

      return decoded;
    } catch (error) {
      this.logger.debug('Access token validation failed', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string, userId: string, sessionId: string): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const key = `refresh_token:${userId}:${sessionId}`;
      const storedData = await this.redisClient.get(key);
      
      if (!storedData) {
        return false;
      }

      const { hash } = JSON.parse(storedData);
      const tokenHash = createHmac('sha256', this.jwtSecret).update(token).digest('hex');

      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(tokenHash, 'hex'));
    } catch (error) {
      this.logger.error('Refresh token validation error', {
        error: error.message,
        userId,
        sessionId
      });
      return false;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(userId: string, sessionId: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `refresh_token:${userId}:${sessionId}`;
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error('Failed to revoke refresh token', {
        error: error.message,
        userId,
        sessionId
      });
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const pattern = `refresh_token:${userId}:*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }

      // Also add to token blacklist
      const blacklistKey = `token_blacklist:${userId}`;
      await this.redisClient.setEx(blacklistKey, this.refreshTokenTTL, Date.now().toString());

      this.logger.info('All user tokens revoked', { userId, tokenCount: keys.length });
    } catch (error) {
      this.logger.error('Failed to revoke all user tokens', {
        error: error.message,
        userId
      });
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(userId: string, issuedAt: number): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    try {
      const blacklistKey = `token_blacklist:${userId}`;
      const blacklistTime = await this.redisClient.get(blacklistKey);
      
      if (!blacklistTime) {
        return false;
      }

      return issuedAt < parseInt(blacklistTime);
    } catch (error) {
      this.logger.error('Failed to check token blacklist', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  // ===============================
  // SESSION MANAGEMENT
  // ===============================

  /**
   * Create authentication session
   */
  async createSession(user: AuthUser, req: Request, deviceId?: string): Promise<AuthSession> {
    const session: AuthSession = {
      id: randomBytes(32).toString('hex'),
      userId: user.id,
      deviceId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      createdAt: new Date(),
      lastActivity: new Date(),
      mfaVerified: !user.mfaEnabled, // If MFA is disabled, consider it verified
      refreshTokenHash: ''
    };

    if (this.redisClient) {
      const sessionKey = `session:${session.id}`;
      await this.redisClient.setEx(
        sessionKey, 
        this.refreshTokenTTL, 
        JSON.stringify(session)
      );
    }

    this.logger.info('Authentication session created', {
      sessionId: session.id,
      userId: user.id,
      deviceId
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AuthSession | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.redisClient.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData);
    } catch (error) {
      this.logger.error('Failed to get session', {
        error: error.message,
        sessionId
      });
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const session = await this.getSession(sessionId);
      if (session) {
        session.lastActivity = new Date();
        
        const sessionKey = `session:${sessionId}`;
        await this.redisClient.setEx(
          sessionKey, 
          this.refreshTokenTTL, 
          JSON.stringify(session)
        );
      }
    } catch (error) {
      this.logger.error('Failed to update session activity', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const sessionKey = `session:${sessionId}`;
      await this.redisClient.del(sessionKey);
    } catch (error) {
      this.logger.error('Failed to revoke session', {
        error: error.message,
        sessionId
      });
    }
  }

  // ===============================
  // USER SCOPES AND PERMISSIONS
  // ===============================

  /**
   * Get user scopes based on role and permissions
   */
  private getUserScopes(user: AuthUser): string[] {
    const roleScopes = this.getRoleScopes(user.role);
    const customScopes = user.scopes || [];
    
    // Combine and deduplicate scopes
    return [...new Set([...roleScopes, ...customScopes])];
  }

  /**
   * Get default scopes for role
   */
  private getRoleScopes(role: UserRole): string[] {
    const roleScopeMap: Record<UserRole, string[]> = {
      super_admin: [
        'admin:*',
        'user:*',
        'content:*',
        'finance:*',
        'system:*'
      ],
      admin: [
        'admin:read',
        'user:read',
        'user:write',
        'content:read',
        'content:moderate',
        'system:read'
      ],
      finance_admin: [
        'finance:read',
        'finance:write',
        'finance:approve',
        'user:read',
        'system:read'
      ],
      creator: [
        'content:create',
        'content:read',
        'content:update',
        'profile:write',
        'finance:read'
      ],
      user: [
        'content:read',
        'profile:read',
        'profile:write'
      ],
      guest: [
        'content:read:public'
      ]
    };

    return roleScopeMap[role] || [];
  }
}

// ===============================
// AUTHORIZATION SERVICE
// ===============================

class AuthorizationService {
  private logger = createSecurityLogger('AuthorizationService');
  private policies: Map<string, AuthPolicy> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default authorization policies
   */
  private initializeDefaultPolicies() {
    // Finance endpoints require 2FA
    this.addPolicy({
      name: 'finance_2fa_required',
      type: 'HYBRID',
      priority: 100,
      enabled: true,
      rules: [{
        effect: 'DENY',
        conditions: [
          { type: 'resource', operator: 'contains', value: '/api/finance' },
          { type: 'mfa', operator: 'eq', value: false }
        ]
      }]
    });

    // Admin endpoints require admin role
    this.addPolicy({
      name: 'admin_required',
      type: 'RBAC',
      priority: 90,
      enabled: true,
      rules: [{
        effect: 'ALLOW',
        conditions: [
          { type: 'resource', operator: 'contains', value: '/api/admin' },
          { type: 'role', operator: 'in', value: ['admin', 'super_admin'] }
        ]
      }]
    });

    // Content ownership checks
    this.addPolicy({
      name: 'content_ownership',
      type: 'ABAC',
      priority: 80,
      enabled: true,
      rules: [{
        effect: 'ALLOW',
        conditions: [
          { type: 'resource', operator: 'matches', value: '/api/content/\\w+' },
          { type: 'resource', operator: 'eq', value: 'owner', field: 'userId' }
        ]
      }]
    });
  }

  /**
   * Add authorization policy
   */
  addPolicy(policy: AuthPolicy) {
    this.policies.set(policy.name, policy);
    this.logger.debug('Authorization policy added', {
      name: policy.name,
      type: policy.type,
      priority: policy.priority
    });
  }

  /**
   * Check authorization
   */
  async authorize(
    user: AuthUser, 
    session: AuthSession, 
    resource: string, 
    action: string, 
    context: Record<string, any> = {}
  ): Promise<{ allowed: boolean; reason?: string; policy?: string }> {
    
    // Get applicable policies sorted by priority
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of applicablePolicies) {
      for (const rule of policy.rules) {
        const matches = await this.evaluateRule(rule, user, session, resource, action, context);
        
        if (matches) {
          const allowed = rule.effect === 'ALLOW';
          
          this.logger.debug('Authorization decision', {
            userId: user.id,
            resource,
            action,
            policy: policy.name,
            rule: rule.effect,
            allowed
          });

          return {
            allowed,
            reason: allowed ? undefined : `Denied by policy: ${policy.name}`,
            policy: policy.name
          };
        }
      }
    }

    // Default deny
    this.logger.warn('Authorization denied - no matching policy', {
      userId: user.id,
      resource,
      action
    });

    return {
      allowed: false,
      reason: 'No matching authorization policy',
      policy: 'default_deny'
    };
  }

  /**
   * Evaluate authorization rule
   */
  private async evaluateRule(
    rule: AuthRule,
    user: AuthUser,
    session: AuthSession,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    
    for (const condition of rule.conditions) {
      const conditionMet = await this.evaluateCondition(
        condition, user, session, resource, action, context
      );
      
      if (!conditionMet) {
        return false;
      }
    }

    // Check resource and action filters
    if (rule.resources && !rule.resources.some(r => this.matchesPattern(resource, r))) {
      return false;
    }

    if (rule.actions && !rule.actions.includes(action)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate individual condition
   */
  private async evaluateCondition(
    condition: AuthCondition,
    user: AuthUser,
    session: AuthSession,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    
    let actualValue: any;

    switch (condition.type) {
      case 'role':
        actualValue = user.role;
        break;
      case 'scope':
        actualValue = user.scopes || [];
        break;
      case 'resource':
        actualValue = condition.field ? context[condition.field] : resource;
        break;
      case 'mfa':
        actualValue = session.mfaVerified;
        break;
      case 'device':
        actualValue = session.deviceId;
        break;
      case 'tenant':
        actualValue = user.tenantId;
        break;
      case 'time':
        actualValue = new Date().getHours();
        break;
      case 'ip':
        actualValue = session.ipAddress;
        break;
      default:
        return false;
    }

    return this.evaluateOperator(condition.operator, actualValue, condition.value);
  }

  /**
   * Evaluate condition operator
   */
  private evaluateOperator(operator: ConditionOperator, actual: any, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'nin':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(expected).test(String(actual));
      default:
        return false;
    }
  }

  /**
   * Check if string matches pattern
   */
  private matchesPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(str);
  }
}

// ===============================
// MIDDLEWARE FACTORY
// ===============================

const authService = new AuthenticationService();
const authzService = new AuthorizationService();

/**
 * Authentication middleware
 */
export function authenticate(options: { optional?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = createSecurityLogger('AuthMiddleware');
    
    try {
      const token = extractToken(req);
      
      if (!token) {
        if (options.optional) {
          return next();
        }
        
        await handleAuthFailure(req, 'No authentication token provided');
        return sendAuthError(res, 'Authentication required', 401);
      }

      // Validate access token
      const authToken = authService.validateAccessToken(token);
      if (!authToken) {
        await handleAuthFailure(req, 'Invalid or expired token');
        return sendAuthError(res, 'Invalid token', 401);
      }

      // Check token blacklist
      const isBlacklisted = await authService.isTokenBlacklisted(
        authToken.userId, 
        authToken.issuedAt
      );
      
      if (isBlacklisted) {
        await handleAuthFailure(req, 'Token has been revoked');
        return sendAuthError(res, 'Token revoked', 401);
      }

      // Get session
      const session = await authService.getSession(authToken.sessionId);
      if (!session) {
        await handleAuthFailure(req, 'Session not found');
        return sendAuthError(res, 'Invalid session', 401);
      }

      // Update session activity
      await authService.updateSessionActivity(authToken.sessionId);

      // Mock user data (in real implementation, fetch from database)
      const user: AuthUser = {
        id: authToken.userId,
        email: 'user@example.com', // Would be fetched from DB
        role: authToken.role,
        permissions: [],
        scopes: authToken.scopes,
        tenantId: authToken.tenantId,
        status: 'active',
        mfaEnabled: false, // Would be fetched from DB
        lastActivity: new Date(),
        createdAt: new Date()
      };

      // Attach auth data to request
      const authReq = req as AuthenticatedRequest;
      authReq.user = user;
      authReq.session = session;
      authReq.token = authToken;
      authReq.security = {
        requestId: (req as any).id || 'unknown',
        userId: user.id,
        sessionId: session.id,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        path: req.path,
        method: req.method
      };

      logger.debug('Authentication successful', {
        userId: user.id,
        sessionId: session.id,
        role: user.role
      });

      next();
    } catch (error) {
      logger.error('Authentication error', {
        error: error.message,
        path: req.path
      });
      
      await handleAuthFailure(req, `Authentication error: ${error.message}`);
      sendAuthError(res, 'Authentication failed', 500);
    }
  };
}

/**
 * Authorization middleware
 */
export function authorize(resource?: string, action: string = 'read') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const logger = createSecurityLogger('AuthzMiddleware');
    
    try {
      if (!req.user || !req.session) {
        return sendAuthError(res, 'Authentication required', 401);
      }

      const resourcePath = resource || req.path;
      const context = {
        params: req.params,
        query: req.query,
        body: req.body
      };

      const result = await authzService.authorize(
        req.user,
        req.session,
        resourcePath,
        action,
        context
      );

      if (!result.allowed) {
        await handleAuthzFailure(req, result.reason || 'Access denied', result.policy);
        return sendAuthError(res, result.reason || 'Access denied', 403);
      }

      logger.debug('Authorization successful', {
        userId: req.user.id,
        resource: resourcePath,
        action,
        policy: result.policy
      });

      next();
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        userId: req.user?.id,
        resource,
        action
      });
      
      sendAuthError(res, 'Authorization failed', 500);
    }
  };
}

/**
 * Require specific role
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendAuthError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendAuthError(res, 'Insufficient privileges', 403);
    }

    next();
  };
}

/**
 * Require specific scopes
 */
export function requireScope(...scopes: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendAuthError(res, 'Authentication required', 401);
    }

    const userScopes = req.user.scopes || [];
    const hasRequiredScope = scopes.some(scope => 
      userScopes.some(userScope => 
        userScope === scope || userScope.endsWith(':*')
      )
    );

    if (!hasRequiredScope) {
      return sendAuthError(res, 'Insufficient scope', 403);
    }

    next();
  };
}

/**
 * Require 2FA verification
 */
export function require2FA() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.session) {
      return sendAuthError(res, 'Authentication required', 401);
    }

    if (req.user.mfaEnabled && !req.session.mfaVerified) {
      return sendAuthError(res, '2FA verification required', 403);
    }

    next();
  };
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Extract token from request
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check query parameter for websocket connections
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  
  return null;
}

/**
 * Handle authentication failure
 */
async function handleAuthFailure(req: Request, reason: string) {
  await emitSecurityEvent({
    type: 'AUTH_FAILURE',
    severity: 'MEDIUM',
    context: {
      requestId: (req as any).id || 'unknown',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      path: req.path,
      method: req.method
    },
    details: { reason },
    timestamp: new Date()
  });
}

/**
 * Handle authorization failure
 */
async function handleAuthzFailure(req: AuthenticatedRequest, reason: string, policy?: string) {
  await emitSecurityEvent({
    type: 'UNAUTHORIZED_ACCESS',
    severity: 'HIGH',
    context: {
      requestId: req.security.requestId,
      userId: req.user.id,
      sessionId: req.session.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      path: req.path,
      method: req.method
    },
    details: { reason, policy },
    timestamp: new Date()
  });
}

/**
 * Send authentication/authorization error
 */
function sendAuthError(res: Response, message: string, statusCode: number) {
  res.status(statusCode).json({
    error: statusCode === 401 ? 'Unauthorized' : 'Forbidden',
    message,
    timestamp: new Date().toISOString()
  });
}

// ===============================
// EXPORTS
// ===============================

export {
  authService as AuthenticationService,
  authzService as AuthorizationService,
  type AuthenticatedRequest,
  type AuthUser,
  type AuthToken,
  type AuthSession,
  type AuthPolicy,
  type UserRole,
  type UserStatus
};

export default authenticate;
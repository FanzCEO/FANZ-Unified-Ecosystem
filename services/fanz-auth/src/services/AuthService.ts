import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { databaseService, User, Session } from './DatabaseService';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { OIDCService } from './OIDCService';

export interface AuthRequest extends Request {
  user?: User;
  session?: Session;
  clientIp?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  cluster?: string;
  rememberMe?: boolean;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  primaryCluster?: string;
  isCreator?: boolean;
  acceptedTerms: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  requiresMFA?: boolean;
  mfaToken?: string;
}

export interface TokenPayload {
  sub: string; // User ID
  username: string;
  email: string;
  cluster: string;
  role: string;
  isCreator: boolean;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID
}

/**
 * Authentication service for FanzAuth
 * Handles user authentication, session management, and security features
 */
export class AuthService {
  private oidcService: OIDCService;
  
  // Rate limiting configurations
  private loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 login attempts per IP per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  private registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 registrations per IP per hour
    message: 'Too many registration attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  constructor(oidcService: OIDCService) {
    this.oidcService = oidcService;
    
    // Start cleanup tasks
    this.startCleanupTasks();
  }

  /**
   * Start background cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean expired sessions every hour
    setInterval(async () => {
      try {
        await databaseService.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Session cleanup failed:', error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Register a new user
   */
  async register(registrationData: RegistrationData): Promise<AuthResult> {
    try {
      // Validate registration data
      const validationError = this.validateRegistration(registrationData);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Check if user already exists
      const existingUser = await databaseService.findUserByEmail(registrationData.email);
      if (existingUser) {
        return { success: false, error: 'User already exists with this email' };
      }

      const existingUsername = await databaseService.findUserByUsername(registrationData.username);
      if (existingUsername) {
        return { success: false, error: 'Username is already taken' };
      }

      // Create user
      const user = await databaseService.createUser({
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        displayName: registrationData.displayName,
        primaryCluster: registrationData.primaryCluster || 'fanzlab',
        isCreator: registrationData.isCreator || false,
      });

      logger.info(`User registered: ${user.email} (${user.username})`);

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn: config.auth.accessTokenExpiry,
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Verify password
      const user = await databaseService.verifyPassword(credentials.email, credentials.password);
      if (!user) {
        logger.warn(`Failed login attempt for ${credentials.email} from ${ipAddress}`);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check user status
      if (user.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      // Update last login
      await databaseService.updateLastLogin(user.id);

      // Generate tokens and session
      const { accessToken, refreshToken } = await this.generateTokens(user);
      const session = await this.createSession(user, credentials.cluster || user.primary_cluster, {
        accessToken,
        refreshToken,
        ipAddress,
        userAgent,
        rememberMe: credentials.rememberMe,
      });

      logger.info(`User logged in: ${user.email} from ${ipAddress || 'unknown IP'}`);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn: config.auth.accessTokenExpiry,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<boolean> {
    try {
      const session = await databaseService.findSessionByToken(token);
      if (session) {
        await databaseService.deleteSession(token);
        logger.info(`User logged out: session ${session.id}`);
      }
      return true;
    } catch (error) {
      logger.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenString: string): Promise<AuthResult> {
    try {
      // Find session by refresh token
      const session = await databaseService.findSessionByToken(refreshTokenString);
      if (!session) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Get user
      const user = await databaseService.findUserById(session.user_id);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user);

      // Update session with new refresh token
      await databaseService.deleteSession(session.session_token);
      await this.createSession(user, session.cluster, {
        accessToken,
        refreshToken: newRefreshToken,
      });

      return {
        success: true,
        user,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: config.auth.accessTokenExpiry,
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: User; payload?: TokenPayload }> {
    try {
      const payload = jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
      
      // Get user from database
      const user = await databaseService.findUserById(payload.sub);
      if (!user || user.status !== 'active') {
        return { valid: false };
      }

      return { valid: true, user, payload };
    } catch (error) {
      logger.debug('Token verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = randomBytes(16).toString('hex');
    const roles = await this.getUserRoles(user);
    const permissions = await this.getUserPermissions(user, roles);

    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      username: user.username,
      email: user.email,
      cluster: user.primary_cluster,
      role: roles.length > 0 ? roles[0] : 'user',
      isCreator: user.is_creator,
      permissions,
      jti,
    };

    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.accessTokenExpiry,
      issuer: config.auth.issuer,
      audience: config.auth.audience,
    });

    const refreshToken = jwt.sign(
      { sub: user.id, jti, type: 'refresh' },
      config.auth.refreshTokenSecret,
      {
        expiresIn: config.auth.refreshTokenExpiry,
        issuer: config.auth.issuer,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Create user session
   */
  private async createSession(
    user: User,
    cluster: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      ipAddress?: string;
      userAgent?: string;
      rememberMe?: boolean;
    }
  ): Promise<Session> {
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (tokens.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    return await databaseService.createSession({
      userId: user.id,
      sessionToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
      ipAddress: tokens.ipAddress,
      userAgent: tokens.userAgent,
      cluster,
    });
  }

  /**
   * Get user roles
   */
  private async getUserRoles(user: User): Promise<string[]> {
    // Basic role assignment based on user properties
    const roles: string[] = ['user'];
    
    if (user.is_creator) {
      roles.push('creator');
    }

    if (user.is_verified) {
      roles.push('verified');
    }

    // Add admin role for specific users (this could be from database)
    if (user.email.includes('@fanz.app')) {
      roles.push('admin');
    }

    return roles;
  }

  /**
   * Get user permissions based on roles
   */
  private async getUserPermissions(user: User, roles: string[]): Promise<string[]> {
    const permissions: Set<string> = new Set();

    // Base user permissions
    permissions.add('profile:read');
    permissions.add('profile:update');
    permissions.add('content:view');

    // Creator permissions
    if (roles.includes('creator')) {
      permissions.add('content:create');
      permissions.add('content:update');
      permissions.add('content:delete');
      permissions.add('subscribers:read');
      permissions.add('earnings:read');
    }

    // Admin permissions
    if (roles.includes('admin')) {
      permissions.add('users:read');
      permissions.add('users:update');
      permissions.add('content:moderate');
      permissions.add('reports:read');
      permissions.add('system:admin');
    }

    return Array.from(permissions);
  }

  /**
   * Validate registration data
   */
  private validateRegistration(data: RegistrationData): string | null {
    // Username validation
    if (!data.username || data.username.length < 3 || data.username.length > 50) {
      return 'Username must be between 3 and 50 characters';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return 'Valid email address is required';
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Terms acceptance
    if (!data.acceptedTerms) {
      return 'You must accept the terms and conditions';
    }

    return null;
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await databaseService.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return { success: true };
      }

      const resetToken = randomBytes(32).toString('hex');
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');
      
      // Store reset token in user metadata (in production, use separate table)
      // This would be done through a dedicated method in DatabaseService
      logger.info(`Password reset requested for ${email}`);
      
      // TODO: In production, implement proper password reset token storage
      // and email sending functionality

      // In production, send email with reset link
      logger.info(`Password reset token created for user ${email}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Password reset token creation failed:', error);
      return { success: false, error: 'Failed to create password reset token' };
    }
  }

  /**
   * Middleware to authenticate requests
   */
  authenticateToken = async (req: AuthRequest, res: Response, next: Function) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const verification = await this.verifyToken(token);
      if (!verification.valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = verification.user;
      req.clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      next();
    } catch (error) {
      logger.error('Token authentication failed:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };

  /**
   * Middleware to check user permissions
   */
  requirePermission = (permission: string) => {
    return async (req: AuthRequest, res: Response, next: Function) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const roles = await this.getUserRoles(req.user);
      const permissions = await this.getUserPermissions(req.user, roles);

      if (!permissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  };

  /**
   * Get rate limiter for login attempts
   */
  getLoginRateLimit() {
    return this.loginRateLimit;
  }

  /**
   * Get rate limiter for registration attempts
   */
  getRegisterRateLimit() {
    return this.registerRateLimit;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Test token generation
      const testPayload = { sub: 'test', username: 'test', email: 'test@test.com' };
      const testToken = jwt.sign(testPayload, config.auth.jwtSecret, { expiresIn: '1s' });
      
      // Test token verification
      jwt.verify(testToken, config.auth.jwtSecret);

      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Auth service health check failed:', error);
      throw error;
    }
  }
}
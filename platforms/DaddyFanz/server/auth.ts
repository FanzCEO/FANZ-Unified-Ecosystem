import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import crypto from "crypto";
import { logger } from "./logger";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000; // 1 hour in milliseconds
const RECOVERY_TOKEN_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to hash tokens using SHA-256
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET not set in production. Using auto-generated secret (sessions will not persist across restarts).');
}

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(8).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotEmailSchema = z.object({
  username: z.string().min(3),
});

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }

  async register(userData: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userInfo } = userData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userInfo.email!);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userInfo.password!);

    // Create user
    const user = await storage.createUser({
      ...userInfo,
      password: hashedPassword,
      authProvider: "local",
    });

    // Create profile
    await storage.createProfile({
      userId: user.id,
      displayName: userInfo.username || userInfo.email!.split('@')[0],
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email!,
      role: user.role!,
    });

    return { user, token };
  }

  async login(credentials: z.infer<typeof loginSchema>) {
    const user = await storage.getUserByEmail(credentials.email);
    if (!user || !user.password) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await this.verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== "active") {
      throw new Error("Account is suspended or banned");
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email!,
      role: user.role!,
    });

    return { user, token };
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user || user.status !== "active") {
      throw new Error("Invalid user");
    }

    return this.generateToken({
      userId: user.id,
      email: user.email!,
      role: user.role!,
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const user = await storage.getUserByEmail(email);
    
    // For security, always return success even if user doesn't exist
    // This prevents account enumeration attacks
    if (!user) {
      logger.info(`Password reset requested for non-existent email`);
      return { message: "If an account with that email exists, a password reset link has been sent." };
    }

    // Generate secure random token (raw token)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN);

    // Invalidate all previous outstanding tokens for this user
    await storage.invalidatePreviousPasswordResetTokens(user.id);

    // Store hashed token in database
    await storage.createPasswordResetToken({
      userId: user.id,
      token: tokenHash,
      expiresAt,
    });

    logger.info(`Password reset token generated for user ${user.id}`);
    
    // TODO: Send email with reset link containing rawToken
    
    // In development with TEST_MODE enabled, return raw token for testing
    // NEVER enable this in production
    if (process.env.NODE_ENV !== 'production' && process.env.TEST_MODE === 'true') {
      return { 
        message: "If an account with that email exists, a password reset link has been sent.",
        token: rawToken // Only for explicit testing
      };
    }
    
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the incoming token to match stored hash
    const tokenHash = hashToken(token);
    
    // Atomically redeem the token (checks validity, expiry, and marks as used in one operation)
    const redemptionResult = await storage.redeemPasswordResetToken(tokenHash);
    
    if (!redemptionResult) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await storage.updateUserPassword(redemptionResult.userId, hashedPassword);

    logger.info(`Password reset successful for user ${redemptionResult.userId}`);
  }

  async requestEmailRecovery(username: string): Promise<{ message: string; email?: string }> {
    const user = await storage.getUserByUsername(username);
    
    // For security, always return success
    if (!user || !user.email) {
      logger.info(`Email recovery requested for non-existent username`);
      return { message: "If an account with that username exists, recovery information has been sent." };
    }

    // Generate secure random token (raw token)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RECOVERY_TOKEN_EXPIRES_IN);

    // Invalidate all previous outstanding tokens for this user
    await storage.invalidatePreviousEmailRecoveryTokens(user.id);

    // Store hashed token in database
    await storage.createEmailRecoveryToken({
      userId: user.id,
      token: tokenHash,
      expiresAt,
    });

    // Mask email for security (show first 2 chars and domain)
    const maskedEmail = this.maskEmail(user.email);
    
    logger.info(`Email recovery initiated for user ${user.id}`);
    
    // In development with TEST_MODE enabled, return actual email for testing
    // NEVER enable this in production
    if (process.env.NODE_ENV !== 'production' && process.env.TEST_MODE === 'true') {
      return { 
        message: `A recovery code has been generated. Your email is: ${maskedEmail}`,
        email: user.email // Only for explicit testing
      };
    }
    
    return { message: `A recovery code has been generated. Your email is: ${maskedEmail}` };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
  }
}

export const authService = new AuthService();

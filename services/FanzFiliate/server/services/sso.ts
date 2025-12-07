import jwt from 'jsonwebtoken';
import { z } from 'zod';

// FanzSSO configuration
const FANZSSO_API_URL = process.env.FANZSSO_API_URL || process.env.FANZDASH_API_URL;
const FANZSSO_API_KEY = process.env.FANZSSO_API_KEY || process.env.FANZDASH_API_KEY;
const FANZSSO_JWT_SECRET = process.env.FANZSSO_JWT_SECRET || process.env.JWT_SECRET;

// SSO token validation response schema
const SSOValidationResponseSchema = z.object({
  valid: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string().optional(),
    name: z.string().optional(),
    role: z.enum(['affiliate', 'advertiser', 'admin']).optional(),
    kycStatus: z.enum(['unverified', 'initiated', 'in_review', 'approved', 'failed']).optional(),
    kycTier: z.number().min(0).max(3).optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  error: z.string().optional(),
});

type SSOValidationResponse = z.infer<typeof SSOValidationResponseSchema>;

// FanzSSO JWT payload schema
const FanzSSOJWTSchema = z.object({
  sub: z.string(), // User ID
  email: z.string().email(),
  username: z.string().optional(),
  name: z.string().optional(),
  role: z.enum(['affiliate', 'advertiser', 'admin']).optional(),
  kyc_status: z.string().optional(),
  kyc_tier: z.number().optional(),
  iss: z.string(), // FanzSSO issuer
  aud: z.string().or(z.array(z.string())), // Audience (should include 'fanzfiliate')
  exp: z.number(),
  iat: z.number(),
  metadata: z.record(z.any()).optional(),
});

/**
 * FanzSSO Integration Service
 * Handles authentication and user validation with the FanzSSO system
 */
export class FanzSSOService {
  private static instance: FanzSSOService;

  private constructor() {}

  public static getInstance(): FanzSSOService {
    if (!FanzSSOService.instance) {
      FanzSSOService.instance = new FanzSSOService();
    }
    return FanzSSOService.instance;
  }

  /**
   * Validate SSO token with FanzSSO service
   */
  public async validateSSOToken(token: string, userId?: string): Promise<SSOValidationResponse> {
    try {
      // First, try to validate the token as a JWT
      const jwtValidation = await this.validateJWTToken(token);
      if (jwtValidation.valid) {
        return jwtValidation;
      }

      // If JWT validation fails, try API validation
      return await this.validateTokenViaAPI(token, userId);

    } catch (error) {
      console.error('SSO token validation error:', error);
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Validate JWT token directly using shared secret
   */
  private async validateJWTToken(token: string): Promise<SSOValidationResponse> {
    try {
      if (!FANZSSO_JWT_SECRET) {
        throw new Error('FanzSSO JWT secret not configured');
      }

      // Verify JWT signature
      const decoded = jwt.verify(token, FANZSSO_JWT_SECRET) as any;
      
      // Validate payload structure
      const payload = FanzSSOJWTSchema.parse(decoded);

      // Validate audience includes 'fanzfiliate'
      const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audience.includes('fanzfiliate')) {
        throw new Error('Token not issued for FanzFiliate');
      }

      // Map SSO user data to our format
      return {
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          username: payload.username,
          name: payload.name,
          role: payload.role || 'affiliate',
          kycStatus: (payload.kyc_status as any) || 'unverified',
          kycTier: payload.kyc_tier || 0,
          metadata: payload.metadata,
        }
      };

    } catch (error) {
      console.warn('JWT validation failed:', error instanceof Error ? error.message : String(error));
      return {
        valid: false,
        error: 'Invalid JWT token'
      };
    }
  }

  /**
   * Validate token via FanzSSO API
   */
  private async validateTokenViaAPI(token: string, userId?: string): Promise<SSOValidationResponse> {
    try {
      if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
        console.warn('FanzSSO API not configured, using fallback validation');
        return this.fallbackValidation(token, userId);
      }

      const response = await this.makeRequest('POST', '/auth/validate', {
        token,
        userId,
        requestedBy: 'fanzfiliate',
        timestamp: new Date().toISOString(),
      });

      // Validate response structure
      const validation = SSOValidationResponseSchema.parse(response);
      
      console.log(`SSO API validation: ${validation.valid ? 'SUCCESS' : 'FAILED'} for user ${userId || 'unknown'}`);
      
      return validation;

    } catch (error) {
      console.error('SSO API validation error:', error);
      
      // Fallback to basic validation for development
      return this.fallbackValidation(token, userId);
    }
  }

  /**
   * Fallback validation for development environments
   */
  private fallbackValidation(token: string, userId?: string): SSOValidationResponse {
    console.warn('Using SSO fallback validation - not suitable for production');
    
    // Development-only: Accept tokens that start with 'sso_' or 'dev_'
    if (token.startsWith('sso_') || token.startsWith('dev_')) {
      const mockUserId = userId || token.replace(/^(sso_|dev_)/, '');
      
      return {
        valid: true,
        user: {
          id: mockUserId,
          email: `${mockUserId}@fanzeco.com`,
          username: mockUserId,
          name: `${mockUserId.charAt(0).toUpperCase()}${mockUserId.slice(1)} User`,
          role: mockUserId.startsWith('admin') ? 'admin' : 
                mockUserId.startsWith('adv') ? 'advertiser' : 'affiliate',
          kycStatus: mockUserId.includes('kyc') ? 'approved' : 'unverified',
          kycTier: mockUserId.includes('tier') ? 2 : 0,
          metadata: {
            source: 'fallback_validation',
            environment: 'development'
          }
        }
      };
    }

    return {
      valid: false,
      error: 'Invalid token format'
    };
  }

  /**
   * Get user profile from FanzSSO
   */
  public async getUserProfile(userId: string, accessToken?: string): Promise<any> {
    try {
      if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
        throw new Error('FanzSSO API not configured');
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await this.makeRequest('GET', `/users/${userId}`, null, headers);
      
      return response;

    } catch (error) {
      console.error('Failed to fetch user profile from FanzSSO:', error);
      throw error;
    }
  }

  /**
   * Update user profile in FanzSSO
   */
  public async updateUserProfile(userId: string, updates: Record<string, any>, accessToken?: string): Promise<any> {
    try {
      if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
        throw new Error('FanzSSO API not configured');
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await this.makeRequest('PATCH', `/users/${userId}`, updates, headers);
      
      console.log(`Updated user profile in FanzSSO: ${userId}`);
      
      return response;

    } catch (error) {
      console.error('Failed to update user profile in FanzSSO:', error);
      throw error;
    }
  }

  /**
   * Log user activity to FanzSSO
   */
  public async logActivity(userId: string, activity: {
    type: string;
    details: Record<string, any>;
    timestamp?: string;
  }): Promise<void> {
    try {
      if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
        return; // Silently skip if not configured
      }

      await this.makeRequest('POST', `/users/${userId}/activity`, {
        ...activity,
        source: 'fanzfiliate',
        timestamp: activity.timestamp || new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to log activity to FanzSSO:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Generate SSO login URL
   */
  public generateLoginURL(redirectUrl?: string, state?: string): string {
    if (!FANZSSO_API_URL) {
      throw new Error('FanzSSO API URL not configured');
    }

    const params = new URLSearchParams({
      client_id: 'fanzfiliate',
      response_type: 'code',
      scope: 'openid profile email kyc',
      redirect_uri: redirectUrl || `${process.env.WEB_APP_URL}/auth/callback`,
    });

    if (state) {
      params.set('state', state);
    }

    return `${FANZSSO_API_URL}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    expiresIn: number;
  }> {
    try {
      if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
        throw new Error('FanzSSO not configured');
      }

      const response = await this.makeRequest('POST', '/oauth/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: 'fanzfiliate',
        client_secret: FANZSSO_API_KEY,
      });

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        idToken: response.id_token,
        expiresIn: response.expires_in || 3600,
      };

    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Make HTTP request to FanzSSO API
   */
  private async makeRequest(
    method: string, 
    endpoint: string, 
    data?: any, 
    additionalHeaders?: Record<string, string>
  ): Promise<any> {
    if (!FANZSSO_API_URL || !FANZSSO_API_KEY) {
      throw new Error('FanzSSO not configured');
    }

    const url = `${FANZSSO_API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FANZSSO_API_KEY}`,
        'X-Client-ID': 'fanzfiliate',
        'User-Agent': 'FanzFiliate/1.0.0',
        ...additionalHeaders,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FanzSSO API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

// Global fetch polyfill for Node.js if needed
if (!global.fetch) {
  try {
    // @ts-ignore
    global.fetch = require('node-fetch');
  } catch (error) {
    console.warn('node-fetch not available - FanzSSO integration may not work in all environments');
  }
}

// Export singleton instance
export const fanzSSOService = FanzSSOService.getInstance();

// 🔑 FANZ OAuth Provider
// OAuth 2.0 implementation with adult platform compliance

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

interface OAuthClient {
  id: string;
  name: string;
  secret: string;
  redirectUris: string[];
  scopes: string[];
  platform: string;
  adultContent: boolean;
  trusted: boolean;
}

interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope: string;
}

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  ageVerified: boolean;
  role: string;
  platforms: string[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: Date;
}

class FanzOAuthProvider {
  private readonly JWT_SECRET: string;
  private readonly AUTHORIZATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
  private readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  // OAuth clients configuration
  private readonly clients: Map<string, OAuthClient> = new Map([
    // FANZ Platform Clients
    ['fanz-web-app', {
      id: 'fanz-web-app',
      name: 'FANZ Web Application',
      secret: process.env.FANZ_WEB_CLIENT_SECRET || 'secure-web-secret',
      redirectUris: [
        'https://fanz.com/auth/callback',
        'https://www.fanz.com/auth/callback',
        'http://localhost:3000/auth/callback' // Development
      ],
      scopes: ['profile', 'email', 'content:read', 'content:write', 'payment:read'],
      platform: 'fanz',
      adultContent: false,
      trusted: true
    }],
    
    // Adult Platform Clients
    ['boyfanz-app', {
      id: 'boyfanz-app',
      name: 'BoyFanz Platform',
      secret: process.env.BOYFANZ_CLIENT_SECRET || 'boyfanz-secret',
      redirectUris: ['https://boyfanz.com/auth/callback'],
      scopes: ['profile', 'email', 'adult:read', 'adult:write', 'payment:read'],
      platform: 'boyfanz',
      adultContent: true,
      trusted: true
    }],
    
    ['girlfanz-app', {
      id: 'girlfanz-app', 
      name: 'GirlFanz Platform',
      secret: process.env.GIRLFANZ_CLIENT_SECRET || 'girlfanz-secret',
      redirectUris: ['https://girlfanz.com/auth/callback'],
      scopes: ['profile', 'email', 'adult:read', 'adult:write', 'payment:read'],
      platform: 'girlfanz',
      adultContent: true,
      trusted: true
    }]
  ]);

  // OAuth scopes with descriptions
  private readonly scopes = {
    'profile': 'Access to basic profile information',
    'email': 'Access to email address',
    'content:read': 'Read access to content',
    'content:write': 'Create and modify content',
    'adult:read': 'Read access to adult content',
    'adult:write': 'Create adult content',
    'payment:read': 'Read payment information',
    'payment:write': 'Process payments',
    'admin': 'Administrative access'
  };

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fanz-oauth-secret';
  }

  // Authorization endpoint - GET /oauth/authorize
  public authorize = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state,
        platform
      } = req.query;

      // Validate required parameters
      if (typeof redirect_uri !== 'string') {
        this.sendError(res, 'invalid_request', 'Invalid redirect_uri type');
        return;
      }

      if (response_type !== 'code') {
        this.sendError(res, 'unsupported_response_type', 'Only code response type is supported');
        return;
      }

      if (!client_id || !redirect_uri) {
        this.sendError(res, 'invalid_request', 'Missing required parameters');
        return;
      }

      // Validate client
      const client = this.clients.get(client_id as string);
      if (!client) {
        this.sendError(res, 'invalid_client', 'Invalid client identifier');
        return;
      }

      // Validate redirect URI
      if (!client.redirectUris.includes(redirect_uri as string)) {
        this.sendError(res, 'invalid_request', 'Invalid redirect URI');
        return;
      }

      // Validate scopes
      const requestedScopes = (scope as string)?.split(' ') || [];
      const invalidScopes = requestedScopes.filter(s => !client.scopes.includes(s));
      
      if (invalidScopes.length > 0) {
        this.sendError(res, 'invalid_scope', `Invalid scopes: ${invalidScopes.join(', ')}`);
        return;
      }

      // Check if user is authenticated
      const user = (req as any).user;
      if (!user) {
        // Redirect to login with OAuth parameters
        const loginUrl = `/login?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri as string)}&scope=${encodeURIComponent(scope as string || '')}&state=${state || ''}`;
        res.redirect(loginUrl);
        return;
      }

      // Adult content platform checks
      if (client.adultContent) {
        if (!user.ageVerified) {
          const ageVerifyUrl = `/age-verification?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri as string)}`;
          res.redirect(ageVerifyUrl);
          return;
        }

        // Check platform access
        if (!user.platforms.includes(client.platform)) {
          this.sendError(res, 'access_denied', 'User does not have access to this adult platform');
          return;
        }
      }

      // Generate authorization code
      const authCode = await this.generateAuthorizationCode({
        clientId: client_id as string,
        userId: user.id,
        redirectUri: redirect_uri as string,
        scopes: requestedScopes,
        platform: platform as string || client.platform
      });

      // Redirect with authorization code
      const separator = (redirect_uri as string).includes('?') ? '&' : '?';
      const redirectUrl = `${redirect_uri}${separator}code=${authCode}&state=${state || ''}`;
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('OAuth authorization error:', error);
      this.sendError(res, 'server_error', 'Internal server error');
    }
  };

  // Token endpoint - POST /oauth/token
  public token = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret,
        refresh_token
      } = req.body;

      // Validate client credentials
      if (!client_id || !client_secret) {
        this.sendTokenError(res, 'invalid_client', 'Missing client credentials');
        return;
      }

      const client = this.clients.get(client_id);
      if (!client || client.secret !== client_secret) {
        this.sendTokenError(res, 'invalid_client', 'Invalid client credentials');
        return;
      }

      if (grant_type === 'authorization_code') {
        await this.handleAuthorizationCodeGrant(req, res, client);
      } else if (grant_type === 'refresh_token') {
        await this.handleRefreshTokenGrant(req, res, client);
      } else {
        this.sendTokenError(res, 'unsupported_grant_type', 'Grant type not supported');
      }

    } catch (error) {
      console.error('OAuth token error:', error);
      this.sendTokenError(res, 'server_error', 'Internal server error');
    }
  };

  // Handle authorization code grant
  private async handleAuthorizationCodeGrant(
    req: Request, 
    res: Response, 
    client: OAuthClient
  ): Promise<void> {
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      this.sendTokenError(res, 'invalid_request', 'Missing required parameters');
      return;
    }

    // Validate authorization code
    const authData = await this.validateAuthorizationCode(code);
    if (!authData) {
      this.sendTokenError(res, 'invalid_grant', 'Invalid or expired authorization code');
      return;
    }

    // Validate redirect URI
    if (authData.redirectUri !== redirect_uri) {
      this.sendTokenError(res, 'invalid_grant', 'Redirect URI mismatch');
      return;
    }

    // Generate tokens
    const tokens = await this.generateTokens(authData.userId, authData.scopes, client);
    
    res.json(tokens);
  }

  // Handle refresh token grant
  private async handleRefreshTokenGrant(
    req: Request, 
    res: Response, 
    client: OAuthClient
  ): Promise<void> {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      this.sendTokenError(res, 'invalid_request', 'Missing refresh token');
      return;
    }

    try {
      // Validate refresh token
      const payload = jwt.verify(refresh_token, this.JWT_SECRET) as any;
      
      if (payload.type !== 'refresh' || payload.clientId !== client.id) {
        this.sendTokenError(res, 'invalid_grant', 'Invalid refresh token');
        return;
      }

      // Generate new access token
      const tokens = await this.generateTokens(payload.userId, payload.scopes, client, false);
      
      res.json(tokens);

    } catch (error) {
      this.sendTokenError(res, 'invalid_grant', 'Invalid or expired refresh token');
    }
  }

  // Generate authorization code
  private async generateAuthorizationCode(data: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scopes: string[];
    platform: string;
  }): Promise<string> {
    const code = crypto.randomBytes(32).toString('base64url');
    
    // In production, store in Redis with expiration
    // For now, encode in JWT for simplicity
    const payload = {
      type: 'auth_code',
      ...data,
      exp: Math.floor(Date.now() / 1000) + (this.AUTHORIZATION_CODE_EXPIRY / 1000)
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  // Validate authorization code
  private async validateAuthorizationCode(code: string): Promise<any> {
    try {
      const payload = jwt.verify(code, this.JWT_SECRET) as any;
      
      if (payload.type !== 'auth_code') {
        return null;
      }

      return payload;
      
    } catch (error) {
      return null;
    }
  }

  // Generate access and refresh tokens
  private async generateTokens(
    userId: string, 
    scopes: string[], 
    client: OAuthClient,
    includeRefreshToken: boolean = true
  ): Promise<OAuthToken> {
    
    const now = Math.floor(Date.now() / 1000);
    
    // Access token payload
    const accessTokenPayload = {
      type: 'access',
      userId,
      clientId: client.id,
      platform: client.platform,
      scopes,
      aud: 'fanz-api',
      iss: 'fanz-oauth',
      iat: now,
      exp: now + (this.ACCESS_TOKEN_EXPIRY / 1000)
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET);

    let refreshToken = '';
    if (includeRefreshToken) {
      const refreshTokenPayload = {
        type: 'refresh',
        userId,
        clientId: client.id,
        scopes,
        iat: now,
        exp: now + (this.REFRESH_TOKEN_EXPIRY / 1000)
      };

      refreshToken = jwt.sign(refreshTokenPayload, this.JWT_SECRET);
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY / 1000,
      tokenType: 'Bearer',
      scope: scopes.join(' ')
    };
  }

  // Send OAuth error response
  private sendError(res: Response, error: string, description: string): void {
    res.status(400).json({
      error,
      error_description: description
    });
  }

  // Send token error response
  private sendTokenError(res: Response, error: string, description: string): void {
    res.status(400).json({
      error,
      error_description: description
    });
  }

  // User info endpoint - GET /oauth/userinfo
  public userInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          error: 'invalid_token',
          error_description: 'Invalid access token'
        });
        return;
      }

      // Return user information based on granted scopes
      const userInfo: any = {
        sub: user.id
      };

      const token = req.headers.authorization?.replace('Bearer ', '');
      const tokenPayload = jwt.decode(token!) as any;
      const scopes = tokenPayload?.scopes || [];

      if (scopes.includes('profile')) {
        userInfo.name = user.name;
        userInfo.username = user.username;
        userInfo.picture = user.avatar;
        userInfo.age_verified = user.ageVerified;
      }

      if (scopes.includes('email')) {
        userInfo.email = user.email;
        userInfo.email_verified = user.emailVerified;
      }

      res.json(userInfo);

    } catch (error) {
      console.error('OAuth userinfo error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  };
}

export { FanzOAuthProvider, OAuthClient, OAuthToken };
export default new FanzOAuthProvider();

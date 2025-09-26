/**
 * 🔑 OIDC Service - OpenID Connect Provider Implementation
 * 
 * Provides OIDC/OAuth2 functionality for cross-cluster SSO
 * JWT token generation, validation, and federation
 */

import jwt from 'jsonwebtoken';
import { randomBytes, generateKeyPairSync, KeyObject } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './AuthService';
import { logger } from '../utils/logger';

export interface OIDCConfig {
  issuer: string;
  privateKey?: string;
  publicKey?: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  idTokenExpiry: string;
  supportedScopes: string[];
  supportedClaims: string[];
  supportedResponseTypes: string[];
  supportedGrantTypes: string[];
}

export interface JWKSKey {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  n: string;
  e: string;
}

export interface OpenIDConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  claims_supported: string[];
  token_endpoint_auth_methods_supported: string[];
}

export interface TokenClaims {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  cluster?: string;
  role?: string;
  permissions?: string[];
  email?: string;
  username?: string;
  is_creator?: boolean;
  is_verified?: boolean;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  cluster: string;
  scopes: string[];
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
}

export class OIDCService {
  private config: OIDCConfig;
  private authService: AuthService;
  private privateKey: string;
  private publicKey: string;
  private keyId: string;
  private authorizationCodes: Map<string, AuthorizationCode> = new Map();
  private refreshTokens: Map<string, any> = new Map();

  constructor(config: OIDCConfig, authService: AuthService) {
    this.config = config;
    this.authService = authService;
    this.keyId = uuidv4();
  }

  public async initialize(): Promise<void> {
    logger.info('🔑 Initializing OIDC service...');

    // Generate or load RSA key pair
    if (this.config.privateKey && this.config.publicKey) {
      this.privateKey = this.config.privateKey;
      this.publicKey = this.config.publicKey;
      logger.info('✅ Using provided RSA keys');
    } else {
      this.generateRSAKeyPair();
      logger.info('✅ Generated new RSA key pair');
    }

    logger.info('🔑 OIDC service initialized');
  }

  private generateRSAKeyPair(): void {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  public getOpenIDConfiguration(): OpenIDConfiguration {
    const baseUrl = this.config.issuer;
    
    return {
      issuer: this.config.issuer,
      authorization_endpoint: `${baseUrl}/api/oidc/authorize`,
      token_endpoint: `${baseUrl}/api/oidc/token`,
      userinfo_endpoint: `${baseUrl}/api/oidc/userinfo`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      scopes_supported: this.config.supportedScopes,
      response_types_supported: this.config.supportedResponseTypes,
      grant_types_supported: this.config.supportedGrantTypes,
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      claims_supported: this.config.supportedClaims,
      token_endpoint_auth_methods_supported: [
        'client_secret_post',
        'client_secret_basic',
        'none',
      ],
    };
  }

  public getJWKS(): { keys: JWKSKey[] } {
    // Convert public key to JWK format
    const publicKeyObject = this.publicKeyToJWK();
    
    return {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          kid: this.keyId,
          alg: 'RS256',
          ...publicKeyObject,
        },
      ],
    };
  }

  private publicKeyToJWK(): { n: string; e: string } {
    // This is a simplified implementation
    // In production, use a proper library like node-jose
    return {
      n: Buffer.from(this.publicKey).toString('base64url'),
      e: 'AQAB', // Standard RSA exponent
    };
  }

  public async createAuthorizationCode(
    clientId: string,
    userId: string,
    cluster: string,
    scopes: string[],
    redirectUri: string,
    codeChallenge?: string,
    codeChallengeMethod?: string
  ): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const authCode: AuthorizationCode = {
      code,
      clientId,
      userId,
      cluster,
      scopes,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      expiresAt,
    };

    this.authorizationCodes.set(code, authCode);

    // Clean up expired codes
    setTimeout(() => {
      this.authorizationCodes.delete(code);
    }, 10 * 60 * 1000);

    logger.info(`🔑 Created authorization code for user ${userId} in cluster ${cluster}`);
    return code;
  }

  public async exchangeAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const authCode = this.authorizationCodes.get(code);
    
    if (!authCode || authCode.expiresAt < new Date()) {
      throw new Error('Invalid or expired authorization code');
    }

    if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
      throw new Error('Client ID or redirect URI mismatch');
    }

    // Verify PKCE if used
    if (authCode.codeChallenge && authCode.codeChallengeMethod) {
      if (!codeVerifier) {
        throw new Error('Code verifier required for PKCE');
      }
      
      const challenge = this.generateCodeChallenge(codeVerifier, authCode.codeChallengeMethod);
      if (challenge !== authCode.codeChallenge) {
        throw new Error('Invalid code verifier');
      }
    }

    // Get user information
    const user = await this.authService.getUserById(authCode.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user, authCode.cluster, authCode.scopes);
    const refreshToken = this.generateRefreshToken(user, authCode.cluster, authCode.scopes);
    const idToken = this.generateIDToken(user, clientId, authCode.cluster);

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      cluster: authCode.cluster,
      scopes: authCode.scopes,
      clientId,
      createdAt: new Date(),
    });

    // Clean up authorization code
    this.authorizationCodes.delete(code);

    logger.info(`🔑 Exchanged authorization code for tokens for user ${user.id}`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
    };
  }

  public async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const refreshData = this.refreshTokens.get(refreshToken);
    
    if (!refreshData) {
      throw new Error('Invalid refresh token');
    }

    // Get user information
    const user = await this.authService.getUserById(refreshData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user, refreshData.cluster, refreshData.scopes);
    const newRefreshToken = this.generateRefreshToken(user, refreshData.cluster, refreshData.scopes);

    // Update refresh token in storage
    this.refreshTokens.delete(refreshToken);
    this.refreshTokens.set(newRefreshToken, {
      ...refreshData,
      createdAt: new Date(),
    });

    logger.info(`🔄 Refreshed tokens for user ${user.id}`);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  public async getUserInfo(accessToken: string): Promise<any> {
    try {
      const claims = this.verifyAccessToken(accessToken);
      const user = await this.authService.getUserById(claims.sub);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        sub: user.id,
        email: user.email,
        username: user.username,
        name: user.display_name,
        picture: user.avatar_url,
        email_verified: !!user.email_verified_at,
        cluster: claims.cluster,
        role: claims.role,
        is_creator: user.is_creator,
        is_verified: user.is_verified,
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  public generateAccessToken(user: any, cluster: string, scopes: string[]): string {
    const now = Math.floor(Date.now() / 1000);
    
    const claims: TokenClaims = {
      sub: user.id,
      iss: this.config.issuer,
      aud: cluster,
      exp: now + 3600, // 1 hour
      iat: now,
      jti: uuidv4(),
      cluster,
      role: user.role || 'user',
      permissions: this.getPermissionsForUser(user, scopes),
      email: user.email,
      username: user.username,
      is_creator: user.is_creator,
      is_verified: user.is_verified,
    };

    return jwt.sign(claims, this.privateKey, {
      algorithm: 'RS256',
      keyid: this.keyId,
    });
  }

  public generateRefreshToken(user: any, cluster: string, scopes: string[]): string {
    return randomBytes(32).toString('base64url');
  }

  public generateIDToken(user: any, audience: string, cluster: string): string {
    const now = Math.floor(Date.now() / 1000);
    
    const claims = {
      sub: user.id,
      iss: this.config.issuer,
      aud: audience,
      exp: now + 3600,
      iat: now,
      jti: uuidv4(),
      email: user.email,
      email_verified: !!user.email_verified_at,
      name: user.display_name,
      username: user.username,
      picture: user.avatar_url,
      cluster,
      is_creator: user.is_creator,
      is_verified: user.is_verified,
    };

    return jwt.sign(claims, this.privateKey, {
      algorithm: 'RS256',
      keyid: this.keyId,
    });
  }

  public verifyAccessToken(token: string): TokenClaims {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.config.issuer,
      }) as TokenClaims;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  private getPermissionsForUser(user: any, scopes: string[]): string[] {
    const permissions: string[] = [];
    
    // Base permissions for all users
    permissions.push('read:profile');
    
    // Creator permissions
    if (user.is_creator) {
      permissions.push('create:content', 'manage:subscribers', 'view:analytics');
    }
    
    // Admin permissions
    if (user.role === 'admin') {
      permissions.push('admin:users', 'admin:content', 'admin:system');
    }
    
    // Moderator permissions
    if (user.role === 'moderator') {
      permissions.push('moderate:content', 'moderate:users');
    }
    
    // Filter by requested scopes
    return permissions.filter(permission => {
      return scopes.some(scope => permission.startsWith(scope.replace(':', '_')));
    });
  }

  private generateCodeChallenge(verifier: string, method: string): string {
    if (method === 'S256') {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(verifier).digest('base64url');
    }
    
    // Plain method
    return verifier;
  }

  public async introspectToken(token: string): Promise<{
    active: boolean;
    client_id?: string;
    username?: string;
    scope?: string;
    exp?: number;
    iat?: number;
    sub?: string;
    aud?: string;
    iss?: string;
  }> {
    try {
      const claims = this.verifyAccessToken(token);
      
      return {
        active: true,
        client_id: claims.aud,
        username: claims.username,
        scope: 'openid profile email',
        exp: claims.exp,
        iat: claims.iat,
        sub: claims.sub,
        aud: claims.aud,
        iss: claims.iss,
      };
    } catch (error) {
      return {
        active: false,
      };
    }
  }

  public async revokeToken(token: string): Promise<void> {
    // Remove refresh token if it exists
    this.refreshTokens.delete(token);
    
    // For access tokens, we rely on expiration since they're stateless JWTs
    // In a production system, you might maintain a blacklist
    
    logger.info('🔑 Token revoked');
  }
}

export default OIDCService;
import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  primary_cluster: string;
  is_creator: boolean;
  is_verified: boolean;
  status: 'active' | 'suspended' | 'pending' | 'disabled';
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  metadata: Record<string, any>;
}

export interface Creator {
  id: string;
  user_id: string;
  creator_name: string;
  description?: string;
  category: string;
  subscription_price_monthly: number;
  tips_enabled: boolean;
  ppv_enabled: boolean;
  social_links: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token: string;
  expires_at: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
  cluster: string;
}

export interface OAuthClient {
  client_id: string;
  client_secret: string;
  name: string;
  redirect_uris: string[];
  scopes: string[];
  grant_types: string[];
  created_at: Date;
  is_active: boolean;
}

export interface AuthorizationCode {
  code: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: string;
  expires_at: Date;
  created_at: Date;
  used: boolean;
}

export interface AccessToken {
  token: string;
  client_id: string;
  user_id: string;
  scope: string;
  expires_at: Date;
  created_at: Date;
  refresh_token?: string;
}

/**
 * Database service for PostgreSQL operations
 * Handles all database interactions for FanzAuth
 */
export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    this.initializeDatabase();
  }

  /**
   * Initialize database tables and indexes
   */
  private async initializeDatabase(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(100),
          bio TEXT,
          avatar_url TEXT,
          primary_cluster VARCHAR(50) NOT NULL DEFAULT 'fanzlab',
          is_creator BOOLEAN DEFAULT false,
          is_verified BOOLEAN DEFAULT false,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'disabled')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          last_login_at TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Creators table
      await client.query(`
        CREATE TABLE IF NOT EXISTS creators (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          creator_name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          subscription_price_monthly DECIMAL(10,2) DEFAULT 0.00,
          tips_enabled BOOLEAN DEFAULT true,
          ppv_enabled BOOLEAN DEFAULT true,
          social_links JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        )
      `);

      // Sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          refresh_token VARCHAR(255) UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT,
          cluster VARCHAR(50) NOT NULL
        )
      `);

      // OAuth clients table
      await client.query(`
        CREATE TABLE IF NOT EXISTS oauth_clients (
          client_id VARCHAR(255) PRIMARY KEY,
          client_secret VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          redirect_uris TEXT[] NOT NULL,
          scopes TEXT[] NOT NULL,
          grant_types TEXT[] NOT NULL DEFAULT ARRAY['authorization_code', 'refresh_token'],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        )
      `);

      // Authorization codes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS authorization_codes (
          code VARCHAR(255) PRIMARY KEY,
          client_id VARCHAR(255) NOT NULL REFERENCES oauth_clients(client_id),
          user_id UUID NOT NULL REFERENCES users(id),
          redirect_uri TEXT NOT NULL,
          scope TEXT NOT NULL,
          code_challenge VARCHAR(255),
          code_challenge_method VARCHAR(10),
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          used BOOLEAN DEFAULT false
        )
      `);

      // Access tokens table
      await client.query(`
        CREATE TABLE IF NOT EXISTS access_tokens (
          token VARCHAR(255) PRIMARY KEY,
          client_id VARCHAR(255) NOT NULL REFERENCES oauth_clients(client_id),
          user_id UUID NOT NULL REFERENCES users(id),
          scope TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          refresh_token VARCHAR(255)
        )
      `);

      // User roles table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL,
          cluster VARCHAR(50) NOT NULL,
          granted_by UUID REFERENCES users(id),
          granted_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          UNIQUE(user_id, role, cluster)
        )
      `);

      // Two-factor auth table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_2fa (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          method VARCHAR(20) NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'webauthn')),
          secret VARCHAR(255),
          phone_number VARCHAR(20),
          is_verified BOOLEAN DEFAULT false,
          backup_codes TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_used_at TIMESTAMPTZ,
          UNIQUE(user_id, method)
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_cluster ON users(primary_cluster)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_auth_codes_client_user ON authorization_codes(client_id, user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id ON access_tokens(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id)');

      // Create default OAuth clients for platform clusters
      await this.createDefaultClients(client);

      await client.query('COMMIT');
      logger.info('Database initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to initialize database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create default OAuth clients for platform clusters
   */
  private async createDefaultClients(client: PoolClient): Promise<void> {
    const clusters = [
      { id: 'fanzlab', name: 'FanzLab Universal', domain: 'fanzlab.fanz.app' },
      { id: 'boyfanz', name: 'BoyFanz', domain: 'boyfanz.fanz.app' },
      { id: 'girlfanz', name: 'GirlFanz', domain: 'girlfanz.fanz.app' },
      { id: 'daddyfanz', name: 'DaddyFanz', domain: 'daddyfanz.fanz.app' },
      { id: 'pupfanz', name: 'PupFanz', domain: 'pupfanz.fanz.app' },
      { id: 'taboofanz', name: 'TabooFanz', domain: 'taboofanz.fanz.app' },
      { id: 'transfanz', name: 'TransFanz', domain: 'transfanz.fanz.app' },
      { id: 'cougarfanz', name: 'CougarFanz', domain: 'cougarfanz.fanz.app' },
      { id: 'fanzcock', name: 'FanzCock', domain: 'fanzcock.fanz.app' },
    ];

    for (const cluster of clusters) {
      try {
        const clientSecret = await bcrypt.hash(`${cluster.id}_secret_${Date.now()}`, 12);
        
        await client.query(`
          INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, scopes, grant_types)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (client_id) DO UPDATE SET
            name = EXCLUDED.name,
            redirect_uris = EXCLUDED.redirect_uris
        `, [
          cluster.id,
          clientSecret,
          cluster.name,
          [
            `https://${cluster.domain}/auth/callback`,
            `https://${cluster.domain}/api/auth/callback`,
            `http://localhost:3000/auth/callback`, // Development
          ],
          ['openid', 'profile', 'email', 'creator'],
          ['authorization_code', 'refresh_token', 'client_credentials']
        ]);
        
        logger.debug(`Created/updated OAuth client for ${cluster.name}`);
      } catch (error) {
        logger.warn(`Failed to create OAuth client for ${cluster.name}:`, error);
      }
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    primaryCluster?: string;
    isCreator?: boolean;
  }): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      const passwordHash = await bcrypt.hash(userData.password, 12);
      const userId = randomUUID();
      
      const result = await client.query(`
        INSERT INTO users (id, username, email, password_hash, display_name, primary_cluster, is_creator)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        userId,
        userData.username,
        userData.email.toLowerCase(),
        passwordHash,
        userData.displayName || userData.username,
        userData.primaryCluster || 'fanzlab',
        userData.isCreator || false
      ]);

      logger.info(`Created user ${userData.username} (${userData.email})`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email.toLowerCase(), 'active']
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username, 'active']
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1 AND status = $2',
      [id, 'active']
    );
    
    return result.rows[0] || null;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  /**
   * Create session
   */
  async createSession(sessionData: {
    userId: string;
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    cluster: string;
  }): Promise<Session> {
    const result = await this.pool.query(`
      INSERT INTO sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent, cluster)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      sessionData.userId,
      sessionData.sessionToken,
      sessionData.refreshToken,
      sessionData.expiresAt,
      sessionData.ipAddress,
      sessionData.userAgent,
      sessionData.cluster
    ]);

    return result.rows[0];
  }

  /**
   * Find session by token
   */
  async findSessionByToken(token: string): Promise<Session | null> {
    const result = await this.pool.query(
      'SELECT * FROM sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Delete session
   */
  async deleteSession(token: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE session_token = $1', [token]);
  }

  /**
   * Delete expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    
    if (result.rowCount > 0) {
      logger.info(`Cleaned up ${result.rowCount} expired sessions`);
    }
  }

  /**
   * Create OAuth authorization code
   */
  async createAuthorizationCode(codeData: {
    code: string;
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    expiresAt: Date;
  }): Promise<AuthorizationCode> {
    const result = await this.pool.query(`
      INSERT INTO authorization_codes (code, client_id, user_id, redirect_uri, scope, 
                                      code_challenge, code_challenge_method, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      codeData.code,
      codeData.clientId,
      codeData.userId,
      codeData.redirectUri,
      codeData.scope,
      codeData.codeChallenge,
      codeData.codeChallengeMethod,
      codeData.expiresAt
    ]);

    return result.rows[0];
  }

  /**
   * Find and consume authorization code
   */
  async findAndConsumeAuthCode(code: string, clientId: string): Promise<AuthorizationCode | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'SELECT * FROM authorization_codes WHERE code = $1 AND client_id = $2 AND used = false AND expires_at > NOW()',
        [code, clientId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query(
        'UPDATE authorization_codes SET used = true WHERE code = $1',
        [code]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create access token
   */
  async createAccessToken(tokenData: {
    token: string;
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: Date;
    refreshToken?: string;
  }): Promise<AccessToken> {
    const result = await this.pool.query(`
      INSERT INTO access_tokens (token, client_id, user_id, scope, expires_at, refresh_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      tokenData.token,
      tokenData.clientId,
      tokenData.userId,
      tokenData.scope,
      tokenData.expiresAt,
      tokenData.refreshToken
    ]);

    return result.rows[0];
  }

  /**
   * Find access token
   */
  async findAccessToken(token: string): Promise<AccessToken | null> {
    const result = await this.pool.query(
      'SELECT * FROM access_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Get OAuth client by ID
   */
  async getOAuthClient(clientId: string): Promise<OAuthClient | null> {
    const result = await this.pool.query(
      'SELECT * FROM oauth_clients WHERE client_id = $1 AND is_active = true',
      [clientId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Verify OAuth client credentials
   */
  async verifyOAuthClient(clientId: string, clientSecret: string): Promise<boolean> {
    const client = await this.getOAuthClient(clientId);
    
    if (!client) {
      return false;
    }

    return await bcrypt.compare(clientSecret, client.client_secret);
  }

  /**
   * Get creator profile for user
   */
  async getCreatorProfile(userId: string): Promise<Creator | null> {
    const result = await this.pool.query(
      'SELECT * FROM creators WHERE user_id = $1',
      [userId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Create creator profile
   */
  async createCreatorProfile(creatorData: {
    userId: string;
    creatorName: string;
    description?: string;
    category: string;
    subscriptionPrice?: number;
  }): Promise<Creator> {
    const result = await this.pool.query(`
      INSERT INTO creators (user_id, creator_name, description, category, subscription_price_monthly)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      creatorData.userId,
      creatorData.creatorName,
      creatorData.description,
      creatorData.category,
      creatorData.subscriptionPrice || 0.00
    ]);

    // Update user as creator
    await this.pool.query(
      'UPDATE users SET is_creator = true, updated_at = NOW() WHERE id = $1',
      [creatorData.userId]
    );

    return result.rows[0];
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const result = await this.pool.query('SELECT NOW() as timestamp');
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
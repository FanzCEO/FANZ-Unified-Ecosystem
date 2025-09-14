import { Pool, Client, PoolClient } from 'pg';
import { config } from './index';
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

class DatabaseManager {
  private pool: Pool;
  private static instance: DatabaseManager;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      min: config.DATABASE_POOL_MIN,
      max: config.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      logger.debug('New database connection established', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('acquire', (client: PoolClient) => {
      logger.debug('Database connection acquired from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('remove', (client: PoolClient) => {
      logger.debug('Database connection removed from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      logger.error('Database connection error', {
        error: err.message,
        stack: err.stack,
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount
      });
    });
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        error: error.message,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params?.slice(0, 5), // Only log first 5 params for security
        duration
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Failed to get database client', { error: error.message });
      throw error;
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      logger.debug('Database transaction started');

      const result = await callback(client);
      
      await client.query('COMMIT');
      logger.debug('Database transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database transaction rolled back', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows[0].health_check === 1;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }

  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database connection pool', { error: error.message });
    }
  }
}

// Database initialization function
export async function setupDatabase(): Promise<void> {
  try {
    const db = DatabaseManager.getInstance();
    
    // Test connection
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    // Setup database extensions and functions if needed
    await setupDatabaseExtensions(db);

    logger.info('Database setup completed successfully', {
      poolStats: db.getPoolStats()
    });
  } catch (error) {
    logger.error('Database setup failed', { error: error.message });
    throw error;
  }
}

async function setupDatabaseExtensions(db: DatabaseManager): Promise<void> {
  try {
    // Enable necessary PostgreSQL extensions
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await db.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    await db.query('CREATE EXTENSION IF NOT EXISTS "btree_gin"');
    await db.query('CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"');

    logger.info('Database extensions enabled successfully');
  } catch (error) {
    logger.error('Failed to setup database extensions', { error: error.message });
    throw error;
  }
}

// Repository base class with common database operations
export abstract class BaseRepository {
  protected db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  protected async findById<T>(table: string, id: string): Promise<T | null> {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  protected async findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    
    const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  protected async findMany<T>(
    table: string, 
    conditions?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const values: any[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${values.length + 1}`;
      values.push(options.offset);
    }

    const result = await this.db.query(query, values);
    return result.rows;
  }

  protected async create<T>(table: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  protected async update<T>(
    table: string, 
    id: string, 
    data: Partial<T>
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    const query = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, [...values, id]);
    return result.rows[0] || null;
  }

  protected async delete(table: string, id: string): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  protected async softDelete(table: string, id: string): Promise<boolean> {
    const query = `
      UPDATE ${table} 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  protected async count(table: string, conditions?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const values: any[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();
export default DatabaseManager;
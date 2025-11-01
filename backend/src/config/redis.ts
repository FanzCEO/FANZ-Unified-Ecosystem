import Redis from 'ioredis';
import { config } from './index';
import { Logger } from '../utils/logger';

const logger = new Logger('Redis');

class RedisManager {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private static instance: RedisManager;

  private constructor() {
    const redisConfig = {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      keyPrefix: 'fanz:',
    };

    // Main Redis client
    this.client = new Redis(config.REDIS_URL, {
      ...redisConfig,
      db: 0
    });

    // Dedicated subscriber client for pub/sub
    this.subscriber = new Redis(config.REDIS_URL, {
      ...redisConfig,
      db: 0
    });

    // Dedicated publisher client for pub/sub
    this.publisher = new Redis(config.REDIS_URL, {
      ...redisConfig,
      db: 0
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private setupEventHandlers(): void {
    // Main client events
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error: (error instanceof Error ? error.message : String(error)) });
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', (time) => {
      logger.info('Redis client reconnecting', { delay: time });
    });

    // Subscriber events
    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', { error: (error instanceof Error ? error.message : String(error)) });
    });

    // Publisher events
    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error', { error: (error instanceof Error ? error.message : String(error)) });
    });
  }

  public async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);
      logger.info('All Redis clients connected successfully');
    } catch (error) {
      logger.error('Failed to connect Redis clients', { error: (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  // Cache operations
  public async get(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key);
      logger.debug('Cache get', { key, hit: result !== null });
      return result;
    } catch (error) {
      logger.error('Cache get failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return null;
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache getJson failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const result = ttl 
        ? await this.client.setex(key, ttl, value)
        : await this.client.set(key, value);
      
      logger.debug('Cache set', { key, ttl, success: result === 'OK' });
      return result === 'OK';
    } catch (error) {
      logger.error('Cache set failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  public async setJson<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttl);
    } catch (error) {
      logger.error('Cache setJson failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire failed', { key, ttl, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  public async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.client.incrby(key, amount);
      logger.debug('Cache increment', { key, amount, result });
      return result;
    } catch (error) {
      logger.error('Cache increment failed', { key, amount, error: (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  public async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.client.decrby(key, amount);
      logger.debug('Cache decrement', { key, amount, result });
      return result;
    } catch (error) {
      logger.error('Cache decrement failed', { key, amount, error: (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      const result = await this.client.lpush(key, ...values);
      return result;
    } catch (error) {
      logger.error('Redis lpush failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      const result = await this.client.rpop(key);
      return result;
    } catch (error) {
      logger.error('Redis rpop failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return null;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const result = await this.client.lrange(key, start, stop);
      return result;
    } catch (error) {
      logger.error('Redis lrange failed', { key, start, stop, error: (error instanceof Error ? error.message : String(error)) });
      return [];
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const result = await this.client.sadd(key, ...members);
      return result;
    } catch (error) {
      logger.error('Redis sadd failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const result = await this.client.srem(key, ...members);
      return result;
    } catch (error) {
      logger.error('Redis srem failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      const result = await this.client.smembers(key);
      return result;
    } catch (error) {
      logger.error('Redis smembers failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return [];
    }
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Redis sismember failed', { key, member, error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: string): Promise<number> {
    try {
      const result = await this.client.hset(key, field, value);
      return result;
    } catch (error) {
      logger.error('Redis hset failed', { key, field, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  public async hget(key: string, field: string): Promise<string | null> {
    try {
      const result = await this.client.hget(key, field);
      return result;
    } catch (error) {
      logger.error('Redis hget failed', { key, field, error: (error instanceof Error ? error.message : String(error)) });
      return null;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const result = await this.client.hgetall(key);
      return result;
    } catch (error) {
      logger.error('Redis hgetall failed', { key, error: (error instanceof Error ? error.message : String(error)) });
      return {};
    }
  }

  public async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      const result = await this.client.hdel(key, ...fields);
      return result;
    } catch (error) {
      logger.error('Redis hdel failed', { key, fields, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  // Pub/Sub operations
  public async publish(channel: string, message: string): Promise<number> {
    try {
      const result = await this.publisher.publish(channel, message);
      logger.debug('Published message', { channel, subscribers: result });
      return result;
    } catch (error) {
      logger.error('Redis publish failed', { channel, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  public async publishJson<T>(channel: string, data: T): Promise<number> {
    try {
      const message = JSON.stringify(data);
      return await this.publish(channel, message);
    } catch (error) {
      logger.error('Redis publishJson failed', { channel, error: (error instanceof Error ? error.message : String(error)) });
      return 0;
    }
  }

  public async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
      logger.info('Subscribed to channel', { channel });
    } catch (error) {
      logger.error('Redis subscribe failed', { channel, error: (error instanceof Error ? error.message : String(error)) });
    }
  }

  public async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info('Unsubscribed from channel', { channel });
    } catch (error) {
      logger.error('Redis unsubscribe failed', { channel, error: (error instanceof Error ? error.message : String(error)) });
    }
  }

  // Pattern matching
  public async keys(pattern: string): Promise<string[]> {
    try {
      const result = await this.client.keys(pattern);
      return result;
    } catch (error) {
      logger.error('Redis keys failed', { pattern, error: (error instanceof Error ? error.message : String(error)) });
      return [];
    }
  }

  // Pipeline operations for better performance
  public pipeline() {
    return this.client.pipeline();
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', { error: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }

  // Get connection stats
  public getConnectionStats() {
    return {
      status: this.client.status,
      db: this.client.options.db,
      keyPrefix: this.client.options.keyPrefix
    };
  }

  // Close connections
  public async close(): Promise<void> {
    try {
      await Promise.all([
        this.client.quit(),
        this.subscriber.quit(),
        this.publisher.quit()
      ]);
      logger.info('All Redis connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections', { error: (error instanceof Error ? error.message : String(error)) });
    }
  }
}

// Cache helper functions for common patterns
export class CacheHelper {
  private redis: RedisManager;
  private defaultTTL: number;

  constructor(redis: RedisManager, defaultTTL: number = config.REDIS_TTL) {
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  // Cache with automatic JSON serialization
  async cacheData<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    return await this.redis.setJson(key, data, ttl || this.defaultTTL);
  }

  // Get cached data with automatic JSON deserialization
  async getCachedData<T>(key: string): Promise<T | null> {
    return await this.redis.getJson<T>(key);
  }

  // Cache function result with automatic key generation
  async cacheFunction<T>(
    func: () => Promise<T>,
    keyPrefix: string,
    keyParams: any[],
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(keyPrefix, keyParams);
    
    // Try to get from cache first
    let cached = await this.getCachedData<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await func();
    await this.cacheData(key, result, ttl);
    
    return result;
  }

  // Generate consistent cache keys
  private generateKey(prefix: string, params: any[]): string {
    const paramString = params
      .map(param => typeof param === 'object' ? JSON.stringify(param) : String(param))
      .join(':');
    
    return `${prefix}:${paramString}`;
  }

  // Invalidate cache by pattern
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    keys.forEach(key => pipeline.del(key));
    
    const results = await pipeline.exec();
    return results ? results.length : 0;
  }
}

// Redis setup function
export async function setupRedis(): Promise<void> {
  try {
    const redis = RedisManager.getInstance();
    await redis.connect();
    
    const isHealthy = await redis.healthCheck();
    if (!isHealthy) {
      throw new Error('Redis health check failed');
    }

    logger.info('Redis setup completed successfully', {
      stats: redis.getConnectionStats()
    });
  } catch (error) {
    logger.error('Redis setup failed', { error: (error instanceof Error ? error.message : String(error)) });
    throw error;
  }
}

// Export singleton instance
export const redis = RedisManager.getInstance();
export const cacheHelper = new CacheHelper(redis);
export default RedisManager;
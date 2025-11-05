/**
 * FANZ SSO Storage Adapter
 * Redis-based storage for OIDC tokens and sessions
 */

const Redis = require('redis');

let client;

const grantKeyFor = (id) => `grant:${id}`;
const sessionKeyFor = (id) => `session:${id}`;
const userCodeKeyFor = (userCode) => `user_code:${userCode}`;
const uidKeyFor = (uid) => `uid:${uid}`;

class RedisAdapter {
  constructor(name) {
    this.name = name;
    this.client = client;
  }

  static async connect() {
    if (!client) {
      client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection failed');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis retry attempts exhausted');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      client.on('connect', () => {
        console.log('✅ Redis connected for SSO storage');
      });

      await client.connect();
    }
    return client;
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);
    const store = consumable.has(this.name)
      ? { payload: JSON.stringify(payload) } : JSON.stringify(payload);

    const multi = this.client.multi();
    if (consumable.has(this.name)) {
      multi.hmset(key, store);
    } else {
      multi.set(key, store);
    }

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      multi.rpush(grantKey, key);
      const ttl = await this.client.ttl(grantKey);
      if (ttl === -1) {
        multi.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode);
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();
  }

  async find(id) {
    const key = this.key(id);
    const data = consumable.has(this.name)
      ? await this.client.hgetall(key)
      : await this.client.get(key);

    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return undefined;
    }

    if (typeof data === 'string') {
      return JSON.parse(data);
    }

    const { payload, ...rest } = data;
    return {
      ...rest,
      ...JSON.parse(payload),
    };
  }

  async findByUserCode(userCode) {
    const id = await this.client.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  async findByUid(uid) {
    const id = await this.client.get(uidKeyFor(uid));
    return this.find(id);
  }

  async destroy(id) {
    const key = this.key(id);
    const multi = this.client.multi();
    multi.del(key);
    
    if (grantable.has(this.name)) {
      const grantId = await this.client.hget(key, 'grantId') || 
                     JSON.parse(await this.client.get(key) || '{}').grantId;
      if (grantId) {
        const grantKey = grantKeyFor(grantId);
        multi.lrem(grantKey, 0, key);
      }
    }

    await multi.exec();
  }

  async revokeByGrantId(grantId) {
    const grantKey = grantKeyFor(grantId);
    const tokens = await this.client.lrange(grantKey, 0, -1);
    const multi = this.client.multi();
    
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKey);
    
    await multi.exec();
  }

  async consume(id) {
    await this.client.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000));
  }

  key(id) {
    return `${this.name}:${id}`;
  }
}

// Define consumable and grantable token types
const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
]);

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
]);

module.exports = RedisAdapter;
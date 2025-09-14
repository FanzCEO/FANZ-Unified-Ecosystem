// 🔧 Rate Limiting Configuration for FANZ Auth Service
// Environment-based configuration with secure defaults

export interface RateLimitConfig {
  // Redis configuration
  redisPrefix: string;
  hmacSecret: string;
  
  // Sensitive operations (login, registration)
  sensitive: {
    windowMs: number;
    maxPerIP: number;
    maxPerAccount: number;
    longWindowMs: number;
    longMaxPerIP: number;
  };
  
  // Token operations (refresh, validation)  
  token: {
    windowMs: number;
    maxPerIP: number;
    maxPerUser: number;
    longWindowMs: number;
    longMaxPerUser: number;
  };
  
  // Standard operations (logout, profile, platform-access)
  standard: {
    windowMs: number;
    maxPerIP: number;
  };
  
  // Bypass configuration for internal services
  bypass: {
    enabled: boolean;
    trustedAudiences: string[];
    serviceClaimValue?: string;
    apiKeyAllowlist: string[];
  };
  
  // Feature flags
  enabled: boolean;
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

const parseIntEnv = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const parseStringArrayEnv = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value || value.trim() === '') return defaultValue;
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

export const rateLimitConfig: RateLimitConfig = {
  // Redis configuration
  redisPrefix: process.env.RATE_LIMIT_REDIS_PREFIX || 'rl:auth:',
  hmacSecret: process.env.RL_HMAC_SECRET || 'fanz-auth-rate-limit-secret-change-in-production',
  
  // Sensitive operations - strict limits
  sensitive: {
    windowMs: parseIntEnv(process.env.RL_SENSITIVE_WINDOW_MS, 60000), // 1 minute
    maxPerIP: parseIntEnv(process.env.RL_SENSITIVE_MAX_IP, 5),
    maxPerAccount: parseIntEnv(process.env.RL_SENSITIVE_MAX_ACCOUNT, 3),
    longWindowMs: parseIntEnv(process.env.RL_SENSITIVE_LONG_WINDOW_MS, 3600000), // 1 hour
    longMaxPerIP: parseIntEnv(process.env.RL_SENSITIVE_LONG_MAX_IP, 20)
  },
  
  // Token operations - moderate limits
  token: {
    windowMs: parseIntEnv(process.env.RL_TOKEN_WINDOW_MS, 60000), // 1 minute
    maxPerIP: parseIntEnv(process.env.RL_TOKEN_MAX_IP, 30),
    maxPerUser: parseIntEnv(process.env.RL_TOKEN_MAX_USER, 60),
    longWindowMs: parseIntEnv(process.env.RL_TOKEN_LONG_WINDOW_MS, 900000), // 15 minutes
    longMaxPerUser: parseIntEnv(process.env.RL_TOKEN_LONG_MAX_USER, 500)
  },
  
  // Standard operations - generous limits
  standard: {
    windowMs: parseIntEnv(process.env.RL_STANDARD_WINDOW_MS, 60000), // 1 minute
    maxPerIP: parseIntEnv(process.env.RL_STANDARD_MAX_IP, 60)
  },
  
  // Bypass configuration for FanzFinance OS and internal services
  bypass: {
    enabled: parseBooleanEnv(process.env.RL_BYPASS_ENABLED, true),
    trustedAudiences: parseStringArrayEnv(process.env.RL_BYPASS_JWT_AUD, ['fanzfinance-os', 'fanz-internal']),
    serviceClaimValue: process.env.RL_BYPASS_SERVICE_CLAIM || 'fanzfinance-os',
    apiKeyAllowlist: parseStringArrayEnv(process.env.RL_BYPASS_API_KEYS, [])
  },
  
  // Feature flags
  enabled: parseBooleanEnv(process.env.RATE_LIMIT_ENABLED, true),
  logging: {
    enabled: parseBooleanEnv(process.env.RL_LOGGING_ENABLED, true),
    level: (process.env.RL_LOGGING_LEVEL as any) || 'warn'
  }
};

// Validation warnings for production
if (process.env.NODE_ENV === 'production') {
  if (rateLimitConfig.hmacSecret === 'fanz-auth-rate-limit-secret-change-in-production') {
    console.warn('⚠️  PRODUCTION WARNING: Using default HMAC secret for rate limiting. Please set RL_HMAC_SECRET environment variable.');
  }
  
  if (rateLimitConfig.bypass.apiKeyAllowlist.length === 0 && rateLimitConfig.bypass.enabled) {
    console.warn('⚠️  PRODUCTION WARNING: Rate limit bypass is enabled but no API keys are allowlisted.');
  }
}

export default rateLimitConfig;
/**
 * 🔧 Environment Configuration for FanzAuth Service
 * 
 * Loads and validates environment variables for all authentication components
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

export interface Config {
  server: {
    port: number;
    host: string;
    environment: string;
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    url: string;
    prefix: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    refreshTokenExpiry: string;
    bcryptRounds: number;
    allowedOrigins: string[];
  };
  oidc: {
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
  };
  webauthn: {
    rpName: string;
    rpId: string;
    origin: string;
  };
  federation: {
    trustedIssuers: string[];
    keyRefreshInterval: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };
  sms: {
    twilio: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
  };
}

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'OIDC_ISSUER',
  'WEBAUTHN_RP_NAME',
  'WEBAUTHN_RP_ID',
  'WEBAUTHN_ORIGIN'
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },
  redis: {
    url: process.env.REDIS_URL!,
    prefix: process.env.REDIS_PREFIX || 'fanz:auth:',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiry: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003').split(','),
  },
  oidc: {
    issuer: process.env.OIDC_ISSUER!,
    privateKey: process.env.OIDC_PRIVATE_KEY,
    publicKey: process.env.OIDC_PUBLIC_KEY,
    accessTokenExpiry: process.env.OIDC_ACCESS_TOKEN_EXPIRY || '1h',
    refreshTokenExpiry: process.env.OIDC_REFRESH_TOKEN_EXPIRY || '7d',
    idTokenExpiry: process.env.OIDC_ID_TOKEN_EXPIRY || '1h',
    supportedScopes: [
      'openid',
      'profile',
      'email',
      'read:profile',
      'create:content',
      'manage:subscribers',
      'view:analytics',
      'admin:users',
      'admin:content',
      'admin:system',
      'moderate:content',
      'moderate:users'
    ],
    supportedClaims: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'jti',
      'email',
      'email_verified',
      'name',
      'username',
      'picture',
      'cluster',
      'role',
      'permissions',
      'is_creator',
      'is_verified'
    ],
    supportedResponseTypes: ['code', 'code id_token', 'id_token', 'token id_token'],
    supportedGrantTypes: ['authorization_code', 'refresh_token', 'client_credentials'],
  },
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME!,
    rpId: process.env.WEBAUTHN_RP_ID!,
    origin: process.env.WEBAUTHN_ORIGIN!,
  },
  federation: {
    trustedIssuers: (process.env.TRUSTED_ISSUERS || '').split(',').filter(Boolean),
    keyRefreshInterval: parseInt(process.env.KEY_REFRESH_INTERVAL || '3600', 10) * 1000, // Convert to ms
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@fanz.app',
  },
  sms: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    },
  },
};

// Log configuration (exclude sensitive data)
logger.info('🔧 FanzAuth configuration loaded:', {
  server: config.server,
  redis: { url: config.redis.url, prefix: config.redis.prefix },
  oidc: {
    issuer: config.oidc.issuer,
    supportedScopes: config.oidc.supportedScopes,
    supportedClaims: config.oidc.supportedClaims,
  },
  webauthn: {
    rpName: config.webauthn.rpName,
    rpId: config.webauthn.rpId,
  },
  rateLimit: config.rateLimit,
});

export default config;
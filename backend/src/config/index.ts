import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  // Environment
  NODE_ENV: string;
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  DATABASE_POOL_MIN: number;
  DATABASE_POOL_MAX: number;
  
  // Redis
  REDIS_URL: string;
  REDIS_TTL: number;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  
  // CORS
  CORS_ORIGIN: string | string[];
  
  // OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  
  // Payment Processing
  PAYMENT_PROCESSOR_API_KEY: string;
  PAYMENT_WEBHOOK_SECRET: string;
  PAYMENT_PUBLIC_KEY: string;
  
  // Blockchain
  WEB3_PROVIDER_URL: string;
  BLOCKCHAIN_NETWORK: string;
  PRIVATE_KEY: string;
  CONTRACT_DEPLOYER_ADDRESS: string;
  
  // Cloud Storage
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  S3_BUCKET_NAME: string;
  CLOUDFRONT_DOMAIN: string;
  
  // External Services
  OPENAI_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  SENDGRID_API_KEY: string;

  // Email
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  FRONTEND_URL: string;
  
  // Security
  BCRYPT_ROUNDS: number;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_MAX: number;
  
  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string[];
  
  // Monitoring
  SENTRY_DSN?: string;
  METRICS_PORT: number;
  LOG_LEVEL: string;
  
  // Feature Flags
  ENABLE_PLAYGROUND: boolean;
  ENABLE_WEBSOCKETS: boolean;
  ENABLE_BLOCKCHAIN: boolean;
  ENABLE_AI_FEATURES: boolean;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value || defaultValue!;
}

function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

function getEnvVarAsBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getEnvVarAsArray(name: string, defaultValue: string[] = []): string[] {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim());
}

export const config: Config = {
  // Environment
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvVarAsNumber('PORT', 3000),
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  DATABASE_POOL_MIN: getEnvVarAsNumber('DATABASE_POOL_MIN', 5),
  DATABASE_POOL_MAX: getEnvVarAsNumber('DATABASE_POOL_MAX', 20),
  
  // Redis
  REDIS_URL: getEnvVar('REDIS_URL'),
  REDIS_TTL: getEnvVarAsNumber('REDIS_TTL', 3600), // 1 hour
  
  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '15m'),
  REFRESH_TOKEN_SECRET: getEnvVar('REFRESH_TOKEN_SECRET'),
  REFRESH_TOKEN_EXPIRES_IN: getEnvVar('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  
  // CORS
  CORS_ORIGIN: (() => {
    const origins = getEnvVar('CORS_ORIGIN', 'http://localhost:3000');
    return origins.includes(',') ? origins.split(',').map(o => o.trim()) : origins;
  })(),
  
  // OAuth
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET', ''),
  TWITTER_API_KEY: getEnvVar('TWITTER_API_KEY', ''),
  TWITTER_API_SECRET: getEnvVar('TWITTER_API_SECRET', ''),
  DISCORD_CLIENT_ID: getEnvVar('DISCORD_CLIENT_ID', ''),
  DISCORD_CLIENT_SECRET: getEnvVar('DISCORD_CLIENT_SECRET', ''),
  
  // Payment Processing
  PAYMENT_PROCESSOR_API_KEY: getEnvVar('PAYMENT_PROCESSOR_API_KEY', ''),
  PAYMENT_WEBHOOK_SECRET: getEnvVar('PAYMENT_WEBHOOK_SECRET', ''),
  PAYMENT_PUBLIC_KEY: getEnvVar('PAYMENT_PUBLIC_KEY', ''),
  
  // Blockchain
  WEB3_PROVIDER_URL: getEnvVar('WEB3_PROVIDER_URL', ''),
  BLOCKCHAIN_NETWORK: getEnvVar('BLOCKCHAIN_NETWORK', 'ethereum'),
  PRIVATE_KEY: getEnvVar('PRIVATE_KEY', ''),
  CONTRACT_DEPLOYER_ADDRESS: getEnvVar('CONTRACT_DEPLOYER_ADDRESS', ''),
  
  // Cloud Storage
  AWS_ACCESS_KEY_ID: getEnvVar('AWS_ACCESS_KEY_ID', ''),
  AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY', ''),
  AWS_REGION: getEnvVar('AWS_REGION', 'us-west-2'),
  S3_BUCKET_NAME: getEnvVar('S3_BUCKET_NAME', ''),
  CLOUDFRONT_DOMAIN: getEnvVar('CLOUDFRONT_DOMAIN', ''),
  
  // External Services
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY', ''),
  TWILIO_ACCOUNT_SID: getEnvVar('TWILIO_ACCOUNT_SID', ''),
  TWILIO_AUTH_TOKEN: getEnvVar('TWILIO_AUTH_TOKEN', ''),
  SENDGRID_API_KEY: getEnvVar('SENDGRID_API_KEY', ''),

  // Email
  EMAIL_FROM: getEnvVar('EMAIL_FROM', 'noreply@fanz.com'),
  EMAIL_FROM_NAME: getEnvVar('EMAIL_FROM_NAME', 'FANZ Platform'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // Security
  BCRYPT_ROUNDS: getEnvVarAsNumber('BCRYPT_ROUNDS', 12),
  SESSION_SECRET: getEnvVar('SESSION_SECRET'), // No default - must be provided
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY'), // No default - must be provided
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 1000),
  AUTH_RATE_LIMIT_MAX: getEnvVarAsNumber('AUTH_RATE_LIMIT_MAX', 10),
  
  // File Upload
  MAX_FILE_SIZE: getEnvVarAsNumber('MAX_FILE_SIZE', 50 * 1024 * 1024), // 50MB
  ALLOWED_FILE_TYPES: getEnvVarAsArray('ALLOWED_FILE_TYPES', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ]),
  
  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  METRICS_PORT: getEnvVarAsNumber('METRICS_PORT', 3001),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  
  // Feature Flags
  ENABLE_PLAYGROUND: getEnvVarAsBoolean('ENABLE_PLAYGROUND', false),
  ENABLE_WEBSOCKETS: getEnvVarAsBoolean('ENABLE_WEBSOCKETS', true),
  ENABLE_BLOCKCHAIN: getEnvVarAsBoolean('ENABLE_BLOCKCHAIN', true),
  ENABLE_AI_FEATURES: getEnvVarAsBoolean('ENABLE_AI_FEATURES', true)
};

// Validate critical configuration
function validateConfig() {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];
  
  if (config.NODE_ENV === 'production') {
    requiredVars.push(
      'REDIS_URL',
      'PAYMENT_PROCESSOR_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    );
  }

  for (const varName of requiredVars) {
    if (!config[varName as keyof Config]) {
      console.error(`Missing required configuration: ${varName}`);
      process.exit(1);
    }
  }

  // Validate JWT secret strength
  if (config.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  // Validate database URL format
  if (!config.DATABASE_URL.startsWith('postgresql://')) {
    console.error('DATABASE_URL must be a valid PostgreSQL connection string');
    process.exit(1);
  }

  console.log('Configuration validated successfully', {
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    enabledFeatures: {
      playground: config.ENABLE_PLAYGROUND,
      websockets: config.ENABLE_WEBSOCKETS,
      blockchain: config.ENABLE_BLOCKCHAIN,
      aiFeatures: config.ENABLE_AI_FEATURES
    }
  });
}

// Run validation
validateConfig();

export default config;
// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during testing

// Security test configuration
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-32char';

// Redis configuration for testing
process.env.REDIS_URL = 'redis://localhost:6379/15'; // Use separate DB for tests
process.env.REDIS_PASSWORD = 'test-redis-password';

// Rate limiting test configuration (lower limits for faster testing)
process.env.RATE_LIMIT_STANDARD_MAX = '10';
process.env.RATE_LIMIT_AUTH_MAX = '3';
process.env.RATE_LIMIT_PAYMENT_MAX = '2';
process.env.RATE_LIMIT_WINDOW_MS = '10000'; // 10 seconds for testing

// CORS test configuration
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000,https://test.fanz.com';

// File upload test limits
process.env.MAX_FILE_SIZE = '1048576'; // 1MB for testing
process.env.MAX_TOTAL_SIZE = '5242880'; // 5MB for testing

// Database configuration for testing
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.DATABASE_LOGGING = 'false';

// Webhook test configuration
process.env.WEBHOOK_SECRET = 'test-webhook-secret-key';

// CSRF test configuration
process.env.CSRF_SECRET = 'test-csrf-secret-key';

// Financial security test configuration
process.env.MAX_TRANSACTION_AMOUNT = '1000000'; // $10k for testing
process.env.IDEMPOTENCY_TTL = '3600'; // 1 hour for testing
process.env.BALANCE_LOCK_TTL = '300'; // 5 minutes for testing

// Monitoring test configuration
process.env.ENABLE_SECURITY_MONITORING = 'true';
process.env.ENABLE_AUTO_RESPONSE = 'true';
process.env.METRICS_COLLECTION_INTERVAL = '10'; // 10 seconds for testing

// Disable external services in tests
process.env.DISABLE_EXTERNAL_CALLS = 'true';
process.env.MOCK_EXTERNAL_SERVICES = 'true';
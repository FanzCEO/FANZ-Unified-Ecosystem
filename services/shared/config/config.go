package config

import (
    "os"
    "strconv"
)

type Config struct {
    DatabaseURL    string
    RedisURL       string
    JWTSecret      string
    Environment    string
    Port           string
    
    // Payment processor configs
    CCBillClientAccnum    string
    CCBillClientSubacc    string
    CCBillUsername        string
    CCBillPassword        string
    
    StripeSecretKey       string
    StripePublishableKey  string
    StripeWebhookSecret   string
    
    NowPaymentsAPIKey     string
    NowPaymentsIPNSecret  string
    
    // External services
    VerifyMyAPIKey        string
    CloudflareAPIKey      string
    CloudflareZoneID      string
    
    // Media storage
    S3Bucket             string
    S3Region             string
    S3AccessKey          string
    S3SecretKey          string
    CDNDomain            string
    
    // AI services
    OpenAIAPIKey         string
    ModerationAPIKey     string
    
    // Email service
    SendGridAPIKey       string
    
    // Social auth
    GoogleClientID       string
    GoogleClientSecret   string
    FacebookAppID        string
    FacebookAppSecret    string
    TwitterAPIKey        string
    TwitterAPISecret     string
    
    // Rate limiting
    RateLimitPerMinute   int
    RateLimitBurst       int
    
    // Security
    EncryptionKey        string
    HMACSecret          string
}

func Load() *Config {
    return &Config{
        DatabaseURL:           getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/fanzos?sslmode=disable"),
        RedisURL:             getEnv("REDIS_URL", "redis://localhost:6379"),
        JWTSecret:            getEnv("JWT_SECRET", "your-jwt-secret-key-change-in-production"),
        Environment:          getEnv("ENVIRONMENT", "development"),
        Port:                 getEnv("PORT", "8080"),
        
        // Payment processors
        CCBillClientAccnum:   getEnv("CCBILL_CLIENT_ACCNUM", ""),
        CCBillClientSubacc:   getEnv("CCBILL_CLIENT_SUBACC", ""),
        CCBillUsername:       getEnv("CCBILL_USERNAME", ""),
        CCBillPassword:       getEnv("CCBILL_PASSWORD", ""),
        
        StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
        StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
        StripeWebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
        
        NowPaymentsAPIKey:    getEnv("NOWPAYMENTS_API_KEY", ""),
        NowPaymentsIPNSecret: getEnv("NOWPAYMENTS_IPN_SECRET", ""),
        
        // External services
        VerifyMyAPIKey:       getEnv("VERIFYMY_API_KEY", ""),
        CloudflareAPIKey:     getEnv("CLOUDFLARE_API_KEY", ""),
        CloudflareZoneID:     getEnv("CLOUDFLARE_ZONE_ID", ""),
        
        // Media storage
        S3Bucket:            getEnv("S3_BUCKET", "fanzos-media"),
        S3Region:            getEnv("S3_REGION", "us-east-1"),
        S3AccessKey:         getEnv("S3_ACCESS_KEY", ""),
        S3SecretKey:         getEnv("S3_SECRET_KEY", ""),
        CDNDomain:           getEnv("CDN_DOMAIN", "cdn.fanzos.com"),
        
        // AI services
        OpenAIAPIKey:        getEnv("OPENAI_API_KEY", ""),
        ModerationAPIKey:    getEnv("MODERATION_API_KEY", ""),
        
        // Email
        SendGridAPIKey:      getEnv("SENDGRID_API_KEY", ""),
        
        // Social auth
        GoogleClientID:      getEnv("GOOGLE_CLIENT_ID", ""),
        GoogleClientSecret:  getEnv("GOOGLE_CLIENT_SECRET", ""),
        FacebookAppID:       getEnv("FACEBOOK_APP_ID", ""),
        FacebookAppSecret:   getEnv("FACEBOOK_APP_SECRET", ""),
        TwitterAPIKey:       getEnv("TWITTER_API_KEY", ""),
        TwitterAPISecret:    getEnv("TWITTER_API_SECRET", ""),
        
        // Rate limiting
        RateLimitPerMinute:  getEnvInt("RATE_LIMIT_PER_MINUTE", 60),
        RateLimitBurst:      getEnvInt("RATE_LIMIT_BURST", 10),
        
        // Security
        EncryptionKey:       getEnv("ENCRYPTION_KEY", "your-32-byte-encryption-key-here"),
        HMACSecret:          getEnv("HMAC_SECRET", "your-hmac-secret-key"),
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}

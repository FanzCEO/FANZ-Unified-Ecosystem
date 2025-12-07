package middleware

import (
    "fmt"
    "net/http"
    "strconv"
    "time"
    "context"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
    "github.com/redis/go-redis/v9"
    "github.com/fanzos/shared/database"
)

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    rate     rate.Limit
    burst    int
}

type RateLimitConfig struct {
    Rate    rate.Limit
    Burst   int
    KeyFunc func(*gin.Context) string
}

// Default rate limit configurations
var (
    DefaultRateLimit = RateLimitConfig{
        Rate:  rate.Every(time.Minute),
        Burst: 60,
        KeyFunc: func(c *gin.Context) string {
            return c.ClientIP()
        },
    }

    AuthRateLimit = RateLimitConfig{
        Rate:  rate.Every(5 * time.Minute),
        Burst: 5,
        KeyFunc: func(c *gin.Context) string {
            return "auth:" + c.ClientIP()
        },
    }

    UploadRateLimit = RateLimitConfig{
        Rate:  rate.Every(time.Minute),
        Burst: 10,
        KeyFunc: func(c *gin.Context) string {
            if userID, exists := GetCurrentUserID(c); exists {
                return "upload:" + userID
            }
            return "upload:" + c.ClientIP()
        },
    }

    PaymentRateLimit = RateLimitConfig{
        Rate:  rate.Every(time.Minute),
        Burst: 3,
        KeyFunc: func(c *gin.Context) string {
            if userID, exists := GetCurrentUserID(c); exists {
                return "payment:" + userID
            }
            return "payment:" + c.ClientIP()
        },
    }

    MessagingRateLimit = RateLimitConfig{
        Rate:  rate.Every(time.Second),
        Burst: 5,
        KeyFunc: func(c *gin.Context) string {
            if userID, exists := GetCurrentUserID(c); exists {
                return "message:" + userID
            }
            return "message:" + c.ClientIP()
        },
    }
)

// In-memory rate limiter
func NewMemoryRateLimiter(config RateLimitConfig) gin.HandlerFunc {
    limiters := make(map[string]*rate.Limiter)

    return func(c *gin.Context) {
        key := config.KeyFunc(c)
        
        limiter, exists := limiters[key]
        if !exists {
            limiter = rate.NewLimiter(config.Rate, config.Burst)
            limiters[key] = limiter
        }

        if !limiter.Allow() {
            c.Header("X-Rate-Limit-Remaining", "0")
            c.Header("X-Rate-Limit-Reset", strconv.FormatInt(time.Now().Add(time.Minute).Unix(), 10))
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "code":  "RATE_LIMIT_EXCEEDED",
                "retry_after": 60,
            })
            c.Abort()
            return
        }

        c.Header("X-Rate-Limit-Remaining", strconv.Itoa(config.Burst-1))
        c.Next()
    }
}

// Redis-based distributed rate limiter
func NewRedisRateLimiter(config RateLimitConfig) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := "rate_limit:" + config.KeyFunc(c)
        ctx := context.Background()
        
        // Check if Redis is available
        if database.Redis == nil {
            // If Redis is not available, fall back to memory rate limiter
            c.Next()
            return
        }

        windowStart := time.Now().Truncate(time.Minute).Unix()
        windowKey := fmt.Sprintf("%s:%d", key, windowStart)

        // Increment counter
        pipe := database.Redis.Pipeline()
        incr := pipe.Incr(ctx, windowKey)
        pipe.Expire(ctx, windowKey, time.Minute)
        _, err := pipe.Exec(ctx)

        if err != nil {
            // If Redis operation fails, allow the request
            c.Next()
            return
        }

        requestCount := int(incr.Val())
        remaining := config.Burst - requestCount

        if requestCount > config.Burst {
            c.Header("X-Rate-Limit-Remaining", "0")
            c.Header("X-Rate-Limit-Reset", strconv.FormatInt(windowStart+60, 10))
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "code":  "RATE_LIMIT_EXCEEDED",
                "retry_after": 60,
            })
            c.Abort()
            return
        }

        c.Header("X-Rate-Limit-Remaining", strconv.Itoa(remaining))
        c.Header("X-Rate-Limit-Reset", strconv.FormatInt(windowStart+60, 10))
        
        c.Next()
    }
}

// Sliding window rate limiter using Redis
func NewSlidingWindowRateLimiter(config RateLimitConfig, window time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := "sliding_rate_limit:" + config.KeyFunc(c)
        ctx := context.Background()
        now := time.Now()
        windowStart := now.Add(-window)

        // Check if Redis is available
        if database.Redis == nil {
            // If Redis is not available, fall back to allowing the request
            c.Next()
            return
        }

        // Remove old entries and count current requests
        pipe := database.Redis.Pipeline()
        pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart.UnixNano(), 10))
        countCmd := pipe.ZCard(ctx, key)
        pipe.ZAdd(ctx, key, redis.Z{
            Score:  float64(now.UnixNano()),
            Member: fmt.Sprintf("%d", now.UnixNano()),
        })
        pipe.Expire(ctx, key, window)
        _, err := pipe.Exec(ctx)

        if err != nil {
            // If Redis operation fails, allow the request
            c.Next()
            return
        }

        requestCount := int(countCmd.Val())
        remaining := config.Burst - requestCount

        if requestCount >= config.Burst {
            c.Header("X-Rate-Limit-Remaining", "0")
            c.Header("X-Rate-Limit-Reset", strconv.FormatInt(now.Add(window).Unix(), 10))
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "code":  "RATE_LIMIT_EXCEEDED",
                "retry_after": int(window.Seconds()),
            })
            c.Abort()
            return
        }

        c.Header("X-Rate-Limit-Remaining", strconv.Itoa(remaining))
        c.Next()
    }
}

// User-specific rate limiter with different limits based on user tier
func NewUserTierRateLimiter() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, exists := GetCurrentUser(c)
        if !exists {
            // Apply IP-based rate limiting for anonymous users
            NewRedisRateLimiter(DefaultRateLimit)(c)
            return
        }

        // Determine rate limit based on user role and verification status
        var config RateLimitConfig
        
        switch {
        case claims.IsAdmin():
            // Admins get higher limits
            config = RateLimitConfig{
                Rate:  rate.Every(time.Second),
                Burst: 100,
                KeyFunc: func(c *gin.Context) string {
                    return "admin:" + claims.UserID.String()
                },
            }
        case claims.IsCreator() && claims.IsVerified:
            // Verified creators get higher limits
            config = RateLimitConfig{
                Rate:  rate.Every(time.Second),
                Burst: 50,
                KeyFunc: func(c *gin.Context) string {
                    return "creator:" + claims.UserID.String()
                },
            }
        case claims.IsCreator():
            // Unverified creators get moderate limits
            config = RateLimitConfig{
                Rate:  rate.Every(2 * time.Second),
                Burst: 30,
                KeyFunc: func(c *gin.Context) string {
                    return "creator_unverified:" + claims.UserID.String()
                },
            }
        default:
            // Regular fans get standard limits
            config = RateLimitConfig{
                Rate:  rate.Every(time.Minute),
                Burst: 60,
                KeyFunc: func(c *gin.Context) string {
                    return "fan:" + claims.UserID.String()
                },
            }
        }

        NewRedisRateLimiter(config)(c)
    }
}

// Endpoint-specific rate limiters
func AuthRateLimiter() gin.HandlerFunc {
    return NewRedisRateLimiter(AuthRateLimit)
}

func UploadRateLimiter() gin.HandlerFunc {
    return NewRedisRateLimiter(UploadRateLimit)
}

func PaymentRateLimiter() gin.HandlerFunc {
    return NewRedisRateLimiter(PaymentRateLimit)
}

func MessagingRateLimiter() gin.HandlerFunc {
    return NewRedisRateLimiter(MessagingRateLimit)
}

// Global rate limiter with IP-based tracking
func GlobalRateLimiter() gin.HandlerFunc {
    return NewRedisRateLimiter(DefaultRateLimit)
}

// DDoS protection with aggressive rate limiting
func DDoSProtection() gin.HandlerFunc {
    config := RateLimitConfig{
        Rate:  rate.Every(time.Second),
        Burst: 10,
        KeyFunc: func(c *gin.Context) string {
            return "ddos:" + c.ClientIP()
        },
    }
    return NewRedisRateLimiter(config)
}

// API rate limiter for external API access
func APIRateLimiter() gin.HandlerFunc {
    config := RateLimitConfig{
        Rate:  rate.Every(time.Minute),
        Burst: 1000, // Higher limit for API access
        KeyFunc: func(c *gin.Context) string {
            apiKey := c.GetHeader("X-API-Key")
            if apiKey != "" {
                return "api:" + apiKey
            }
            return "api:" + c.ClientIP()
        },
    }
    return NewRedisRateLimiter(config)
}

// Adaptive rate limiter that adjusts based on server load
func AdaptiveRateLimiter() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Simple adaptive logic - in production, use more sophisticated metrics
        serverLoad := getServerLoad() // Implementation needed
        
        var config RateLimitConfig
        if serverLoad > 0.8 {
            // High load - reduce limits
            config = RateLimitConfig{
                Rate:  rate.Every(2 * time.Second),
                Burst: 30,
                KeyFunc: func(c *gin.Context) string {
                    return "adaptive_high:" + c.ClientIP()
                },
            }
        } else if serverLoad > 0.6 {
            // Medium load - moderate limits
            config = RateLimitConfig{
                Rate:  rate.Every(time.Second),
                Burst: 45,
                KeyFunc: func(c *gin.Context) string {
                    return "adaptive_medium:" + c.ClientIP()
                },
            }
        } else {
            // Low load - normal limits
            config = DefaultRateLimit
        }

        NewRedisRateLimiter(config)(c)
    }
}

// Placeholder for server load calculation
func getServerLoad() float64 {
    // Implementation would check CPU, memory, etc.
    return 0.5
}

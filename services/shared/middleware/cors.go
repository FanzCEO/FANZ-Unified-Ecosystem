package middleware

import (
    "crypto/rand"
    "encoding/hex"
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
)

type CORSConfig struct {
    AllowOrigins     []string
    AllowMethods     []string
    AllowHeaders     []string
    ExposeHeaders    []string
    AllowCredentials bool
    MaxAge           int
}

func DefaultCORSConfig() *CORSConfig {
    return &CORSConfig{
        AllowOrigins: []string{
            "http://localhost:3000",
            "http://localhost:5000",
            "https://fanzos.com",
            "https://*.fanzos.com",
        },
        AllowMethods: []string{
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "HEAD",
            "OPTIONS",
        },
        AllowHeaders: []string{
            "Origin",
            "Content-Length",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-API-Key",
            "X-CSRF-Token",
            "X-User-Agent",
            "Accept",
            "Cache-Control",
        },
        ExposeHeaders: []string{
            "Content-Length",
            "X-Request-ID",
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset",
        },
        AllowCredentials: true,
        MaxAge:           12 * 60 * 60, // 12 hours
    }
}

func CORS(config *CORSConfig) gin.HandlerFunc {
    if config == nil {
        config = DefaultCORSConfig()
    }

    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        
        // Check if origin is allowed
        if origin != "" && isOriginAllowed(origin, config.AllowOrigins) {
            c.Header("Access-Control-Allow-Origin", origin)
        }

        // Set other CORS headers
        c.Header("Access-Control-Allow-Methods", strings.Join(config.AllowMethods, ", "))
        c.Header("Access-Control-Allow-Headers", strings.Join(config.AllowHeaders, ", "))
        
        if len(config.ExposeHeaders) > 0 {
            c.Header("Access-Control-Expose-Headers", strings.Join(config.ExposeHeaders, ", "))
        }

        if config.AllowCredentials {
            c.Header("Access-Control-Allow-Credentials", "true")
        }

        if config.MaxAge > 0 {
            c.Header("Access-Control-Max-Age", string(rune(config.MaxAge)))
        }

        // Handle preflight requests
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}

func isOriginAllowed(origin string, allowedOrigins []string) bool {
    for _, allowed := range allowedOrigins {
        if allowed == "*" {
            return true
        }
        
        if allowed == origin {
            return true
        }
        
        // Handle wildcard subdomains
        if strings.HasPrefix(allowed, "*.") {
            domain := allowed[2:]
            if strings.HasSuffix(origin, "."+domain) || origin == domain {
                return true
            }
        }
    }
    return false
}

// Strict CORS for production
func StrictCORS() gin.HandlerFunc {
    config := &CORSConfig{
        AllowOrigins: []string{
            "https://fanzos.com",
            "https://www.fanzos.com",
            "https://app.fanzos.com",
            "https://admin.fanzos.com",
        },
        AllowMethods: []string{
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        },
        AllowHeaders: []string{
            "Origin",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-CSRF-Token",
        },
        ExposeHeaders: []string{
            "Content-Length",
            "X-Request-ID",
        },
        AllowCredentials: true,
        MaxAge:           24 * 60 * 60, // 24 hours
    }
    return CORS(config)
}

// Development CORS with relaxed settings
func DevelopmentCORS() gin.HandlerFunc {
    config := &CORSConfig{
        AllowOrigins: []string{
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:8080",
        },
        AllowMethods: []string{
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "HEAD",
            "OPTIONS",
        },
        AllowHeaders: []string{
            "*",
        },
        ExposeHeaders: []string{
            "*",
        },
        AllowCredentials: true,
        MaxAge:           1 * 60 * 60, // 1 hour
    }
    return CORS(config)
}

// Security headers middleware
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Prevent XSS attacks
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-XSS-Protection", "1; mode=block")
        
        // HSTS for HTTPS
        if c.Request.TLS != nil {
            c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        }
        
        // CSP for additional XSS protection
        csp := "default-src 'self'; " +
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com; " +
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
               "font-src 'self' https://fonts.gstatic.com; " +
               "img-src 'self' data: https:; " +
               "media-src 'self' https:; " +
               "connect-src 'self' https://api.stripe.com https://*.fanzos.com wss://*.fanzos.com; " +
               "frame-src https://js.stripe.com https://hooks.stripe.com"
        
        c.Header("Content-Security-Policy", csp)
        
        // Referrer policy
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        
        // Feature policy
        c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        
        c.Next()
    }
}

// Request ID middleware
func RequestID() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        if requestID == "" {
            requestID = generateRequestID()
        }
        
        c.Header("X-Request-ID", requestID)
        c.Set("request_id", requestID)
        
        c.Next()
    }
}

func generateRequestID() string {
    // Simple request ID generation - in production use a more robust method
    bytes := make([]byte, 16)
    rand.Read(bytes)
    return hex.EncodeToString(bytes)
}

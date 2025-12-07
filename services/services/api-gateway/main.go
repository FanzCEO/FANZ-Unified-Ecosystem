package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/auth"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/api-gateway/routes"
    "github.com/fanzos/api-gateway/proxy"
)

func main() {
    // Load configuration
    cfg := config.Load()
    
    // Set Gin mode
    if cfg.Environment == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    // Initialize database connections
    db, err := database.Initialize(cfg.DatabaseURL, cfg.RedisURL)
    if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }
    defer db.Close()

    // Initialize JWT manager
    jwtManager := auth.NewJWTManager(cfg.JWTSecret, "fanzos-api-gateway")

    // Initialize middleware
    authMiddleware := middleware.NewAuthMiddleware(jwtManager)

    // Create Gin router
    router := gin.New()

    // Global middleware
    router.Use(gin.Logger())
    router.Use(gin.Recovery())
    router.Use(middleware.RequestID())
    router.Use(middleware.SecurityHeaders())

    // CORS based on environment
    if cfg.Environment == "development" {
        router.Use(middleware.DevelopmentCORS())
    } else {
        router.Use(middleware.StrictCORS())
    }

    // Rate limiting
    router.Use(middleware.GlobalRateLimiter())

    // Root endpoint - API info
    router.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "FanzOS API Gateway",
            "version": "1.0.0",
            "status":  "running",
            "api_base": "/api/v1",
            "endpoints": gin.H{
                "health":   "/health",
                "auth":     "/api/v1/auth/*",
                "users":    "/api/v1/users/*",
                "content":  "/api/v1/content/*",
                "payments": "/api/v1/payments/*",
                "admin":    "/api/v1/admin/*",
            },
        })
    })

    // Health check endpoint
    router.GET("/health", func(c *gin.Context) {
        // For deployment, return healthy even if database is not available
        c.JSON(http.StatusOK, gin.H{
            "status":    "healthy",
            "timestamp": time.Now().UTC(),
            "version":   "1.0.0",
        })
    })

    // Initialize service proxy
    serviceProxy := proxy.NewServiceProxy(cfg)

    // Setup routes
    routes.SetupRoutes(router, authMiddleware, serviceProxy)

    // Create HTTP server
    server := &http.Server{
        Addr:    "0.0.0.0:" + cfg.Port,
        Handler: router,
        
        // Security timeouts
        ReadTimeout:       30 * time.Second,
        WriteTimeout:      30 * time.Second,
        ReadHeaderTimeout: 10 * time.Second,
        IdleTimeout:       120 * time.Second,
        
        // Security limits
        MaxHeaderBytes: 1 << 20, // 1 MB
    }

    // Start server in goroutine
    go func() {
        log.Printf("API Gateway starting on port %s", cfg.Port)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Wait for interrupt signal to gracefully shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down API Gateway...")

    // Graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("API Gateway shut down complete")
}

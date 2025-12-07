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
    "github.com/fanzos/user-service/handlers"
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
    jwtManager := auth.NewJWTManager(cfg.JWTSecret, "fanzos-user-service")

    // Initialize handlers
    authHandler := handlers.NewAuthHandler(db, jwtManager, cfg)
    profileHandler := handlers.NewProfileHandler(db, cfg)
    verificationHandler := handlers.NewVerificationHandler(db, cfg)

    // Initialize middleware
    authMiddleware := middleware.NewAuthMiddleware(jwtManager)

    // Create Gin router
    router := gin.New()
    router.Use(gin.Logger())
    router.Use(gin.Recovery())
    router.Use(middleware.RequestID())
    router.Use(middleware.SecurityHeaders())

    // Health check
    router.GET("/health", func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        
        if err := db.HealthCheck(ctx); err != nil {
            c.JSON(http.StatusServiceUnavailable, gin.H{
                "status": "unhealthy",
                "service": "user-service",
                "error": err.Error(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
            "service": "user-service",
            "timestamp": time.Now().UTC(),
        })
    })

    // Authentication routes (public)
    auth := router.Group("/auth")
    {
        auth.POST("/register", authHandler.Register)
        auth.POST("/login", authHandler.Login)
        auth.POST("/logout", authHandler.Logout)
        auth.POST("/refresh-token", authHandler.RefreshToken)
        auth.POST("/forgot-password", authHandler.ForgotPassword)
        auth.POST("/reset-password", authHandler.ResetPassword)
        auth.POST("/verify-email", authHandler.VerifyEmail)
        auth.POST("/verify-phone", authHandler.VerifyPhone)
        auth.POST("/resend-verification", authHandler.ResendVerification)
        
        // Social authentication
        social := auth.Group("/social")
        {
            social.GET("/google", authHandler.GoogleAuth)
            social.GET("/google/callback", authHandler.GoogleCallback)
            social.GET("/facebook", authHandler.FacebookAuth)
            social.GET("/facebook/callback", authHandler.FacebookCallback)
            social.GET("/twitter", authHandler.TwitterAuth)
            social.GET("/twitter/callback", authHandler.TwitterCallback)
        }
    }

    // User management routes (protected)
    users := router.Group("/users")
    users.Use(authMiddleware.RequireAuth())
    {
        users.GET("/me", profileHandler.GetProfile)
        users.PUT("/me", profileHandler.UpdateProfile)
        users.DELETE("/me", profileHandler.DeleteAccount)
        users.POST("/change-password", authHandler.ChangePassword)
        
        // Profile management
        users.PUT("/profile", profileHandler.UpdateProfile)
        users.POST("/avatar", profileHandler.UploadAvatar)
        users.POST("/cover", profileHandler.UploadCover)
        
        // Following system
        users.POST("/follow/:userId", profileHandler.FollowUser)
        users.DELETE("/unfollow/:userId", profileHandler.UnfollowUser)
        users.GET("/followers", profileHandler.GetFollowers)
        users.GET("/following", profileHandler.GetFollowing)
        users.GET("/followers/:userId", profileHandler.GetUserFollowers)
        users.GET("/following/:userId", profileHandler.GetUserFollowing)
        
        // User search and discovery
        users.GET("/search", profileHandler.SearchUsers)
        users.GET("/suggestions", profileHandler.GetSuggestions)
        users.GET("/:userId", profileHandler.GetPublicProfile)
    }

    // Verification routes (protected)
    verification := router.Group("/verification")
    verification.Use(authMiddleware.RequireAuth())
    {
        verification.POST("/request", verificationHandler.RequestVerification)
        verification.GET("/status", verificationHandler.GetVerificationStatus)
        verification.POST("/upload-document", verificationHandler.UploadDocument)
        verification.POST("/age-verification", verificationHandler.SubmitAgeVerification)
        verification.GET("/requirements", verificationHandler.GetVerificationRequirements)
    }

    // Creator-specific routes
    creators := router.Group("/creators")
    creators.Use(authMiddleware.RequireAuth())
    creators.Use(authMiddleware.RequireCreator())
    {
        creators.GET("/dashboard", profileHandler.GetCreatorDashboard)
        creators.GET("/analytics", profileHandler.GetCreatorAnalytics)
        creators.GET("/subscribers", profileHandler.GetSubscribers)
        creators.GET("/earnings", profileHandler.GetEarnings)
        creators.POST("/promote", profileHandler.PromoteToCreator)
        creators.PUT("/status", profileHandler.UpdateCreatorStatus)
    }

    // Create HTTP server
    server := &http.Server{
        Addr:    "0.0.0.0:8001",
        Handler: router,
        
        ReadTimeout:       30 * time.Second,
        WriteTimeout:      30 * time.Second,
        ReadHeaderTimeout: 10 * time.Second,
        IdleTimeout:       120 * time.Second,
        MaxHeaderBytes:    1 << 20,
    }

    // Start server
    go func() {
        log.Printf("User Service starting on port 8001")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down User Service...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("User Service shut down complete")
}

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
    "github.com/fanzos/content-service/handlers"
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
    jwtManager := auth.NewJWTManager(cfg.JWTSecret, "fanzos-content-service")

    // Initialize handlers
    postsHandler := handlers.NewPostsHandler(db, cfg)
    mediaHandler := handlers.NewMediaHandler(db, cfg)
    shortVideoHandler := handlers.NewShortVideoHandler(db, cfg)

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
                "service": "content-service",
                "error": err.Error(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
            "service": "content-service",
            "timestamp": time.Now().UTC(),
        })
    })

    // Posts routes
    posts := router.Group("/posts")
    {
        // Public posts (no auth required)
        posts.GET("/public", authMiddleware.OptionalAuth(), postsHandler.GetPublicPosts)
        posts.GET("/:id", authMiddleware.OptionalAuth(), postsHandler.GetPost)
        
        // Authenticated routes
        authenticated := posts.Group("")
        authenticated.Use(authMiddleware.RequireAuth())
        {
            authenticated.GET("", postsHandler.GetUserFeed)
            authenticated.POST("", postsHandler.CreatePost)
            authenticated.PUT("/:id", postsHandler.UpdatePost)
            authenticated.DELETE("/:id", postsHandler.DeletePost)
            
            // Post interactions
            authenticated.POST("/:id/like", postsHandler.LikePost)
            authenticated.DELETE("/:id/like", postsHandler.UnlikePost)
            authenticated.POST("/:id/comment", postsHandler.CommentOnPost)
            authenticated.GET("/:id/comments", postsHandler.GetPostComments)
            authenticated.POST("/:id/share", postsHandler.SharePost)
            authenticated.POST("/:id/report", postsHandler.ReportPost)
        }
    }

    // Media routes
    media := router.Group("/media")
    media.Use(authMiddleware.RequireAuth())
    {
        media.POST("/upload", mediaHandler.UploadMedia)
        media.POST("/upload/chunk", mediaHandler.ChunkedUpload)
        media.POST("/upload/complete", mediaHandler.CompleteChunkedUpload)
        media.DELETE("/:id", mediaHandler.DeleteMedia)
        media.GET("/:id/presigned-url", mediaHandler.GetPresignedURL)
    }

    // Short videos (FanzFlixxx)
    shortVideo := router.Group("/shortvideo")
    {
        // Public short videos
        shortVideo.GET("/trending", authMiddleware.OptionalAuth(), shortVideoHandler.GetTrendingVideos)
        shortVideo.GET("/:id", authMiddleware.OptionalAuth(), shortVideoHandler.GetShortVideo)
        
        // Authenticated routes
        authenticated := shortVideo.Group("")
        authenticated.Use(authMiddleware.RequireAuth())
        {
            authenticated.GET("", shortVideoHandler.GetShortVideoFeed)
            authenticated.POST("", shortVideoHandler.CreateShortVideo)
            authenticated.PUT("/:id", shortVideoHandler.UpdateShortVideo)
            authenticated.DELETE("/:id", shortVideoHandler.DeleteShortVideo)
            
            // Short video interactions
            authenticated.POST("/:id/react", shortVideoHandler.ReactToVideo)
            authenticated.POST("/:id/comment", shortVideoHandler.CommentOnVideo)
            authenticated.GET("/:id/comments", shortVideoHandler.GetVideoComments)
            authenticated.POST("/:id/share", shortVideoHandler.ShareVideo)
            authenticated.POST("/:id/duet", shortVideoHandler.CreateDuet)
            authenticated.POST("/:id/report", shortVideoHandler.ReportVideo)
        }
    }

    // Hashtags
    hashtags := router.Group("/hashtags")
    {
        hashtags.GET("", shortVideoHandler.GetHashtags)
        hashtags.GET("/trending", shortVideoHandler.GetTrendingHashtags)
        hashtags.GET("/:tag", shortVideoHandler.GetHashtagContent)
        hashtags.GET("/:tag/posts", shortVideoHandler.GetHashtagPosts)
        hashtags.GET("/:tag/videos", shortVideoHandler.GetHashtagVideos)
    }

    // Creator content management
    creators := router.Group("/creators")
    creators.Use(authMiddleware.RequireAuth())
    creators.Use(authMiddleware.RequireCreator())
    {
        // Content management
        creators.GET("/content", postsHandler.GetCreatorContent)
        creators.GET("/content/scheduled", postsHandler.GetScheduledContent)
        creators.POST("/content/schedule", postsHandler.ScheduleContent)
        creators.PUT("/content/:id/publish", postsHandler.PublishContent)
        
        // Vault (private content storage)
        vault := creators.Group("/vault")
        {
            vault.GET("", postsHandler.GetVaultContent)
            vault.POST("", postsHandler.CreateVaultContent)
            vault.GET("/:id", postsHandler.GetVaultItem)
            vault.PUT("/:id", postsHandler.UpdateVaultContent)
            vault.DELETE("/:id", postsHandler.DeleteVaultContent)
        }

        // Highlights (featured content collections)
        highlights := creators.Group("/highlights")
        {
            highlights.GET("", postsHandler.GetHighlights)
            highlights.POST("", postsHandler.CreateHighlight)
            highlights.GET("/:id", postsHandler.GetHighlight)
            highlights.PUT("/:id", postsHandler.UpdateHighlight)
            highlights.DELETE("/:id", postsHandler.DeleteHighlight)
            highlights.POST("/:id/posts", postsHandler.AddPostToHighlight)
            highlights.DELETE("/:id/posts/:postId", postsHandler.RemovePostFromHighlight)
        }

        // Watermarks
        watermarks := creators.Group("/watermarks")
        {
            watermarks.GET("", postsHandler.GetWatermarks)
            watermarks.POST("", postsHandler.CreateWatermark)
            watermarks.GET("/:id", postsHandler.GetWatermark)
            watermarks.PUT("/:id", postsHandler.UpdateWatermark)
            watermarks.DELETE("/:id", postsHandler.DeleteWatermark)
        }
    }

    // User profiles and content discovery
    profiles := router.Group("/creators")
    {
        profiles.GET("/:username", authMiddleware.OptionalAuth(), postsHandler.GetCreatorProfile)
        profiles.GET("/:username/posts", authMiddleware.OptionalAuth(), postsHandler.GetCreatorPosts)
        profiles.GET("/:username/highlights", authMiddleware.OptionalAuth(), postsHandler.GetCreatorHighlights)
    }

    // Create HTTP server
    server := &http.Server{
        Addr:    "0.0.0.0:8002",
        Handler: router,
        
        ReadTimeout:       30 * time.Second,
        WriteTimeout:      30 * time.Second,
        ReadHeaderTimeout: 10 * time.Second,
        IdleTimeout:       120 * time.Second,
        MaxHeaderBytes:    1 << 20,
    }

    // Start server
    go func() {
        log.Printf("Content Service starting on port 8002")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down Content Service...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Content Service shut down complete")
}

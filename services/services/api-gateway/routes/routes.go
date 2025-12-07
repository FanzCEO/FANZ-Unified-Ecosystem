package routes

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/api-gateway/proxy"
)

func SetupRoutes(router *gin.Engine, authMiddleware *middleware.AuthMiddleware, serviceProxy *proxy.ServiceProxy) {
    // API version 1
    v1 := router.Group("/api/v1")
    
    // Public endpoints (no authentication required)
    public := v1.Group("")
    {
        // User service - Authentication endpoints
        auth := public.Group("/auth")
        {
            auth.Use(middleware.AuthRateLimiter())
            auth.POST("/register", serviceProxy.ProxyToUserService)
            auth.POST("/login", serviceProxy.ProxyToUserService)
            auth.POST("/forgot-password", serviceProxy.ProxyToUserService)
            auth.POST("/reset-password", serviceProxy.ProxyToUserService)
            auth.POST("/verify-email", serviceProxy.ProxyToUserService)
            auth.POST("/verify-phone", serviceProxy.ProxyToUserService)
            auth.POST("/refresh-token", serviceProxy.ProxyToUserService)
            
            // Social authentication
            auth.GET("/google", serviceProxy.ProxyToUserService)
            auth.GET("/google/callback", serviceProxy.ProxyToUserService)
            auth.GET("/facebook", serviceProxy.ProxyToUserService)
            auth.GET("/facebook/callback", serviceProxy.ProxyToUserService)
            auth.GET("/twitter", serviceProxy.ProxyToUserService)
            auth.GET("/twitter/callback", serviceProxy.ProxyToUserService)
        }

        // Public content endpoints
        content := public.Group("/content")
        {
            content.Use(authMiddleware.OptionalAuth())
            content.GET("/posts/public", serviceProxy.ProxyToContentService)
            content.GET("/posts/:id", serviceProxy.ProxyToContentService)
            content.GET("/creators/:username", serviceProxy.ProxyToContentService)
            content.GET("/creators/:username/posts", serviceProxy.ProxyToContentService)
            content.GET("/hashtags/trending", serviceProxy.ProxyToContentService)
            content.GET("/shortvideo/trending", serviceProxy.ProxyToContentService)
            content.GET("/shortvideo/:id", serviceProxy.ProxyToContentService)
        }

        // Public explore endpoints
        explore := public.Group("/explore")
        {
            explore.Use(authMiddleware.OptionalAuth())
            explore.GET("/creators", serviceProxy.ProxyToExploreService)
            explore.GET("/creators/featured", serviceProxy.ProxyToExploreService)
            explore.GET("/creators/trending", serviceProxy.ProxyToExploreService)
            explore.GET("/creators/new", serviceProxy.ProxyToExploreService)
            explore.GET("/creators/online", serviceProxy.ProxyToExploreService)
            explore.GET("/creators/nearby", serviceProxy.ProxyToExploreService)
            explore.GET("/categories", serviceProxy.ProxyToExploreService)
            explore.GET("/categories/:id", serviceProxy.ProxyToExploreService)
            explore.GET("/categories/:id/creators", serviceProxy.ProxyToExploreService)
            explore.GET("/filters", serviceProxy.ProxyToExploreService)
            explore.POST("/search/creators", serviceProxy.ProxyToExploreService)
            explore.GET("/search/suggestions", serviceProxy.ProxyToExploreService)
            explore.GET("/stats/popular-categories", serviceProxy.ProxyToExploreService)
            explore.GET("/stats/search-trends", serviceProxy.ProxyToExploreService)
        }

        // Public streaming endpoints
        streaming := public.Group("/streaming")
        {
            streaming.GET("/live/:streamId", serviceProxy.ProxyToStreamingService)
            streaming.GET("/live/:streamId/viewer-count", serviceProxy.ProxyToStreamingService)
        }
    }

    // Protected endpoints (authentication required)
    protected := v1.Group("")
    protected.Use(authMiddleware.RequireAuth())
    {
        // User management
        users := protected.Group("/users")
        {
            users.GET("/me", serviceProxy.ProxyToUserService)
            users.PUT("/me", serviceProxy.ProxyToUserService)
            users.DELETE("/me", serviceProxy.ProxyToUserService)
            users.POST("/logout", serviceProxy.ProxyToUserService)
            users.POST("/change-password", serviceProxy.ProxyToUserService)
            
            // Profile management
            users.PUT("/profile", serviceProxy.ProxyToUserService)
            users.POST("/avatar", middleware.UploadRateLimiter(), serviceProxy.ProxyToUserService)
            users.POST("/cover", middleware.UploadRateLimiter(), serviceProxy.ProxyToUserService)
            
            // Verification
            users.POST("/verification/request", serviceProxy.ProxyToUserService)
            users.GET("/verification/status", serviceProxy.ProxyToUserService)
            
            // Following/Followers
            users.POST("/follow/:userId", serviceProxy.ProxyToUserService)
            users.DELETE("/unfollow/:userId", serviceProxy.ProxyToUserService)
            users.GET("/followers", serviceProxy.ProxyToUserService)
            users.GET("/following", serviceProxy.ProxyToUserService)
        }

        // Content management
        content := protected.Group("/content")
        {
            // Posts
            posts := content.Group("/posts")
            {
                posts.GET("", serviceProxy.ProxyToContentService)
                posts.POST("", serviceProxy.ProxyToContentService)
                posts.PUT("/:id", serviceProxy.ProxyToContentService)
                posts.DELETE("/:id", serviceProxy.ProxyToContentService)
                
                // Post interactions
                posts.POST("/:id/like", serviceProxy.ProxyToContentService)
                posts.DELETE("/:id/like", serviceProxy.ProxyToContentService)
                posts.POST("/:id/comment", serviceProxy.ProxyToContentService)
                posts.GET("/:id/comments", serviceProxy.ProxyToContentService)
                posts.POST("/:id/share", serviceProxy.ProxyToContentService)
                
                // PPV content
                posts.POST("/:id/unlock", middleware.PaymentRateLimiter(), serviceProxy.ProxyToPaymentService)
            }

            // Media uploads
            media := content.Group("/media")
            {
                media.Use(middleware.UploadRateLimiter())
                media.POST("/upload", serviceProxy.ProxyToContentService)
                media.POST("/upload/chunk", serviceProxy.ProxyToContentService)
                media.POST("/upload/complete", serviceProxy.ProxyToContentService)
                media.DELETE("/:id", serviceProxy.ProxyToContentService)
            }

            // Short videos (FanzFlixxx)
            shortVideo := content.Group("/shortvideo")
            {
                shortVideo.GET("", serviceProxy.ProxyToContentService)
                shortVideo.POST("", serviceProxy.ProxyToContentService)
                shortVideo.PUT("/:id", serviceProxy.ProxyToContentService)
                shortVideo.DELETE("/:id", serviceProxy.ProxyToContentService)
                
                // Short video interactions
                shortVideo.POST("/:id/react", serviceProxy.ProxyToContentService)
                shortVideo.POST("/:id/comment", serviceProxy.ProxyToContentService)
                shortVideo.POST("/:id/duet", serviceProxy.ProxyToContentService)
                shortVideo.POST("/:id/share", serviceProxy.ProxyToContentService)
            }

            // Hashtags
            hashtags := content.Group("/hashtags")
            {
                hashtags.GET("", serviceProxy.ProxyToContentService)
                hashtags.GET("/:tag", serviceProxy.ProxyToContentService)
                hashtags.GET("/:tag/posts", serviceProxy.ProxyToContentService)
                hashtags.GET("/:tag/videos", serviceProxy.ProxyToContentService)
            }
        }

        // Payment and subscription management
        payments := protected.Group("/payments")
        {
            payments.Use(middleware.PaymentRateLimiter())
            
            // Payment methods
            paymentMethods := payments.Group("/methods")
            {
                paymentMethods.GET("", serviceProxy.ProxyToPaymentService)
                paymentMethods.POST("", serviceProxy.ProxyToPaymentService)
                paymentMethods.PUT("/:id", serviceProxy.ProxyToPaymentService)
                paymentMethods.DELETE("/:id", serviceProxy.ProxyToPaymentService)
                paymentMethods.POST("/:id/verify", serviceProxy.ProxyToPaymentService)
            }

            // Subscriptions
            subscriptions := payments.Group("/subscriptions")
            {
                subscriptions.GET("", serviceProxy.ProxyToPaymentService)
                subscriptions.POST("/:creatorId", serviceProxy.ProxyToPaymentService)
                subscriptions.PUT("/:id", serviceProxy.ProxyToPaymentService)
                subscriptions.DELETE("/:id", serviceProxy.ProxyToPaymentService)
                subscriptions.GET("/:id/status", serviceProxy.ProxyToPaymentService)
            }

            // Transactions
            transactions := payments.Group("/transactions")
            {
                transactions.GET("", serviceProxy.ProxyToPaymentService)
                transactions.GET("/:id", serviceProxy.ProxyToPaymentService)
                transactions.POST("/tip", serviceProxy.ProxyToPaymentService)
                transactions.POST("/purchase", serviceProxy.ProxyToPaymentService)
            }

            // Withdrawals (creators only)
            withdrawals := payments.Group("/withdrawals")
            withdrawals.Use(authMiddleware.RequireCreator())
            {
                withdrawals.GET("", serviceProxy.ProxyToPaymentService)
                withdrawals.POST("", serviceProxy.ProxyToPaymentService)
                withdrawals.GET("/:id", serviceProxy.ProxyToPaymentService)
            }

            // Webhooks
            webhooks := payments.Group("/webhooks")
            {
                webhooks.POST("/stripe", serviceProxy.ProxyToPaymentService)
                webhooks.POST("/ccbill", serviceProxy.ProxyToPaymentService)
                webhooks.POST("/nowpayments", serviceProxy.ProxyToPaymentService)
            }
        }

        // Messaging
        messaging := protected.Group("/messaging")
        {
            messaging.Use(middleware.MessagingRateLimiter())
            
            // Conversations
            conversations := messaging.Group("/conversations")
            {
                conversations.GET("", serviceProxy.ProxyToMessagingService)
                conversations.POST("", serviceProxy.ProxyToMessagingService)
                conversations.GET("/:id", serviceProxy.ProxyToMessagingService)
                conversations.PUT("/:id", serviceProxy.ProxyToMessagingService)
                conversations.DELETE("/:id", serviceProxy.ProxyToMessagingService)
                
                // Messages
                conversations.GET("/:id/messages", serviceProxy.ProxyToMessagingService)
                conversations.POST("/:id/messages", serviceProxy.ProxyToMessagingService)
                conversations.PUT("/:id/messages/:messageId", serviceProxy.ProxyToMessagingService)
                conversations.DELETE("/:id/messages/:messageId", serviceProxy.ProxyToMessagingService)
                
                // Message actions
                conversations.POST("/:id/messages/:messageId/read", serviceProxy.ProxyToMessagingService)
                conversations.POST("/:id/messages/:messageId/react", serviceProxy.ProxyToMessagingService)
            }

            // WebSocket connection
            messaging.GET("/ws", serviceProxy.ProxyToMessagingService)
            
            // Notifications
            notifications := messaging.Group("/notifications")
            {
                notifications.GET("", serviceProxy.ProxyToMessagingService)
                notifications.PUT("/:id/read", serviceProxy.ProxyToMessagingService)
                notifications.POST("/mark-all-read", serviceProxy.ProxyToMessagingService)
                notifications.DELETE("/:id", serviceProxy.ProxyToMessagingService)
            }

            // Push tokens
            messaging.POST("/push-tokens", serviceProxy.ProxyToMessagingService)
            messaging.DELETE("/push-tokens/:token", serviceProxy.ProxyToMessagingService)
        }

        // Live streaming
        streaming := protected.Group("/streaming")
        {
            // Stream management
            streams := streaming.Group("/streams")
            {
                streams.Use(authMiddleware.RequireCreator())
                streams.GET("", serviceProxy.ProxyToStreamingService)
                streams.POST("", serviceProxy.ProxyToStreamingService)
                streams.GET("/:id", serviceProxy.ProxyToStreamingService)
                streams.PUT("/:id", serviceProxy.ProxyToStreamingService)
                streams.DELETE("/:id", serviceProxy.ProxyToStreamingService)
                
                // Stream control
                streams.POST("/:id/start", serviceProxy.ProxyToStreamingService)
                streams.POST("/:id/stop", serviceProxy.ProxyToStreamingService)
                streams.POST("/:id/record", serviceProxy.ProxyToStreamingService)
            }

            // Stream viewing
            streaming.GET("/live/:streamId/join", serviceProxy.ProxyToStreamingService)
            streaming.POST("/live/:streamId/leave", serviceProxy.ProxyToStreamingService)
            streaming.POST("/live/:streamId/gift", middleware.PaymentRateLimiter(), serviceProxy.ProxyToStreamingService)
            streaming.GET("/live/:streamId/chat", serviceProxy.ProxyToStreamingService)
            streaming.POST("/live/:streamId/chat", serviceProxy.ProxyToStreamingService)

            // WebRTC signaling
            streaming.GET("/webrtc/ws", serviceProxy.ProxyToStreamingService)
        }

        // AI-powered features
        ai := protected.Group("/ai")
        {
            // Content recommendations
            ai.GET("/recommendations", serviceProxy.ProxyToAIService)
            ai.GET("/recommendations/posts", serviceProxy.ProxyToAIService)
            ai.GET("/recommendations/creators", serviceProxy.ProxyToAIService)
            ai.GET("/recommendations/videos", serviceProxy.ProxyToAIService)
            
            // Content analysis
            ai.POST("/analyze/content", serviceProxy.ProxyToAIService)
            ai.POST("/analyze/image", serviceProxy.ProxyToAIService)
            ai.POST("/analyze/video", serviceProxy.ProxyToAIService)
            
            // User preferences
            ai.GET("/preferences", serviceProxy.ProxyToAIService)
            ai.PUT("/preferences", serviceProxy.ProxyToAIService)
        }

        // FanzFluence - MLM/Affiliate marketing
        fanzfluence := protected.Group("/fanzfluence")
        {
            fanzfluence.Any("/*path", serviceProxy.ProxyToFanzFluenceService)
        }

        // FanzVersity - Creator education
        fanzversity := protected.Group("/fanzversity")
        {
            fanzversity.Any("/*path", serviceProxy.ProxyToFanzVersityService)
        }

        // FanzMetaVerse - VR/AR experiences
        fanzmetaverse := protected.Group("/fanzmetaverse")
        {
            fanzmetaverse.Any("/*path", serviceProxy.ProxyToFanzMetaVerseService)
        }

        // Gamification service
        gamification := protected.Group("/gamification")
        {
            gamification.Any("/*path", serviceProxy.ProxyToGamificationService)
        }

        // Merchandise service
        merchandise := protected.Group("/merchandise")
        {
            merchandise.Any("/*path", serviceProxy.ProxyToMerchandiseService)
        }
    }

    // Creator-only endpoints
    creators := v1.Group("/creators")
    creators.Use(authMiddleware.RequireAuth())
    creators.Use(authMiddleware.RequireCreator())
    {
        // Creator dashboard
        creators.GET("/dashboard", serviceProxy.ProxyToUserService)
        creators.GET("/analytics", serviceProxy.ProxyToUserService)
        creators.GET("/earnings", serviceProxy.ProxyToPaymentService)
        
        // Content management
        creators.GET("/content", serviceProxy.ProxyToContentService)
        creators.GET("/content/scheduled", serviceProxy.ProxyToContentService)
        creators.POST("/content/schedule", serviceProxy.ProxyToContentService)
        
        // Subscriber management
        creators.GET("/subscribers", serviceProxy.ProxyToUserService)
        creators.GET("/subscribers/analytics", serviceProxy.ProxyToUserService)
        
        // Vault (private content)
        vault := creators.Group("/vault")
        {
            vault.GET("", serviceProxy.ProxyToContentService)
            vault.POST("", serviceProxy.ProxyToContentService)
            vault.GET("/:id", serviceProxy.ProxyToContentService)
            vault.PUT("/:id", serviceProxy.ProxyToContentService)
            vault.DELETE("/:id", serviceProxy.ProxyToContentService)
        }

        // Highlights
        highlights := creators.Group("/highlights")
        {
            highlights.GET("", serviceProxy.ProxyToContentService)
            highlights.POST("", serviceProxy.ProxyToContentService)
            highlights.PUT("/:id", serviceProxy.ProxyToContentService)
            highlights.DELETE("/:id", serviceProxy.ProxyToContentService)
        }

        // Watermarks
        watermarks := creators.Group("/watermarks")
        {
            watermarks.GET("", serviceProxy.ProxyToContentService)
            watermarks.POST("", serviceProxy.ProxyToContentService)
            watermarks.PUT("/:id", serviceProxy.ProxyToContentService)
            watermarks.DELETE("/:id", serviceProxy.ProxyToContentService)
        }
    }

    // Admin-only endpoints
    admin := v1.Group("/admin")
    admin.Use(authMiddleware.RequireAuth())
    admin.Use(authMiddleware.RequireAdmin())
    {
        // User management
        adminUsers := admin.Group("/users")
        {
            adminUsers.GET("", serviceProxy.ProxyToAdminService)
            adminUsers.GET("/:id", serviceProxy.ProxyToAdminService)
            adminUsers.PUT("/:id", serviceProxy.ProxyToAdminService)
            adminUsers.POST("/:id/ban", serviceProxy.ProxyToAdminService)
            adminUsers.POST("/:id/unban", serviceProxy.ProxyToAdminService)
            adminUsers.POST("/:id/verify", serviceProxy.ProxyToAdminService)
            adminUsers.POST("/:id/suspend", serviceProxy.ProxyToAdminService)
        }

        // Content moderation
        moderation := admin.Group("/moderation")
        {
            moderation.GET("/queue", serviceProxy.ProxyToAdminService)
            moderation.GET("/reports", serviceProxy.ProxyToAdminService)
            moderation.POST("/approve/:contentId", serviceProxy.ProxyToAdminService)
            moderation.POST("/reject/:contentId", serviceProxy.ProxyToAdminService)
            moderation.POST("/flag/:contentId", serviceProxy.ProxyToAdminService)
            moderation.GET("/flagged", serviceProxy.ProxyToAdminService)
        }

        // Analytics
        analytics := admin.Group("/analytics")
        {
            analytics.GET("/overview", serviceProxy.ProxyToAdminService)
            analytics.GET("/users", serviceProxy.ProxyToAdminService)
            analytics.GET("/content", serviceProxy.ProxyToAdminService)
            analytics.GET("/revenue", serviceProxy.ProxyToAdminService)
            analytics.GET("/traffic", serviceProxy.ProxyToAdminService)
        }

        // Compliance
        compliance := admin.Group("/compliance")
        {
            compliance.GET("/records", serviceProxy.ProxyToAdminService)
            compliance.GET("/verifications", serviceProxy.ProxyToAdminService)
            compliance.GET("/age-verification", serviceProxy.ProxyToAdminService)
            compliance.GET("/2257-records", serviceProxy.ProxyToAdminService)
            compliance.POST("/export", serviceProxy.ProxyToAdminService)
        }

        // System management
        system := admin.Group("/system")
        {
            system.GET("/health", serviceProxy.ProxyToAdminService)
            system.GET("/metrics", serviceProxy.ProxyToAdminService)
            system.POST("/maintenance", serviceProxy.ProxyToAdminService)
            system.GET("/audit-log", serviceProxy.ProxyToAdminService)
        }

        // Explore management
        adminExplore := admin.Group("/explore")
        {
            adminExplore.GET("/categories", serviceProxy.ProxyToExploreService)
            adminExplore.POST("/categories", serviceProxy.ProxyToExploreService)
            adminExplore.PUT("/categories/:id", serviceProxy.ProxyToExploreService)
            adminExplore.DELETE("/categories/:id", serviceProxy.ProxyToExploreService)
            adminExplore.POST("/categories/:id/activate", serviceProxy.ProxyToExploreService)
            adminExplore.POST("/categories/:id/deactivate", serviceProxy.ProxyToExploreService)
            adminExplore.PUT("/categories/reorder", serviceProxy.ProxyToExploreService)
            
            // Featured creator management
            adminExplore.POST("/featured/add/:creatorId", serviceProxy.ProxyToExploreService)
            adminExplore.DELETE("/featured/remove/:creatorId", serviceProxy.ProxyToExploreService)
            adminExplore.GET("/featured/list", serviceProxy.ProxyToExploreService)
            adminExplore.PUT("/featured/reorder", serviceProxy.ProxyToExploreService)
        }

        // TODO management
        admin.GET("/todos", serviceProxy.ProxyToExploreService)
        admin.POST("/todos/:id/toggle", serviceProxy.ProxyToExploreService)
    }

    // Catch-all for unmatched routes
    router.NoRoute(func(c *gin.Context) {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Endpoint not found",
            "code":  "ENDPOINT_NOT_FOUND",
            "path":  c.Request.URL.Path,
        })
    })
}

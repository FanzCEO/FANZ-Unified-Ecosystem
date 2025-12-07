package main

import (
    "log"
    "os"
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/shared/auth"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    db := database.InitDB()
    jwtManager := auth.NewJWTManager(os.Getenv("JWT_SECRET"), "fanzos")
    authMiddleware := middleware.NewAuthMiddleware(jwtManager, db)
    
    router := gin.Default()
    router.Use(middleware.CORS())
    router.Use(middleware.ErrorHandler())
    router.Use(middleware.RateLimiter())
    
    // Health check
    router.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy", "service": "gamification"})
    })
    
    // Contests endpoints
    contests := router.Group("/contests")
    contests.Use(authMiddleware.OptionalAuth())
    {
        contests.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"contests": []interface{}{}})
        })
        contests.GET("/active", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"active": []interface{}{}})
        })
        contests.GET("/upcoming", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"upcoming": []interface{}{}})
        })
        contests.GET("/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"contest": gin.H{"id": c.Param("id")}})
        })
        contests.GET("/:id/leaderboard", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"leaderboard": []interface{}{}})
        })
        contests.GET("/:id/prizes", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"prizes": []interface{}{}})
        })
        
        protected := contests.Group("")
        protected.Use(authMiddleware.RequireAuth())
        {
            protected.POST("/", func(c *gin.Context) {
                c.JSON(http.StatusCreated, gin.H{"contest_id": "contest_123"})
            })
            protected.POST("/:id/enter", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{"entered": true})
            })
            protected.POST("/:id/submit", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{"submission_id": "sub_123"})
            })
            protected.POST("/:id/vote", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{"voted": true})
            })
        }
    }
    
    // Challenges endpoints
    challenges := router.Group("/challenges")
    challenges.Use(authMiddleware.RequireAuth())
    {
        challenges.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"challenges": []interface{}{}})
        })
        challenges.GET("/daily", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"daily": []interface{}{}})
        })
        challenges.GET("/weekly", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"weekly": []interface{}{}})
        })
        challenges.GET("/monthly", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"monthly": []interface{}{}})
        })
        challenges.GET("/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"challenge": gin.H{"id": c.Param("id")}})
        })
        challenges.POST("/:id/accept", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"accepted": true})
        })
        challenges.POST("/:id/complete", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"completed": true, "reward": gin.H{"points": 100}})
        })
        challenges.GET("/progress", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"progress": []interface{}{}})
        })
    }
    
    // Points & Rewards endpoints
    rewards := router.Group("/rewards")
    rewards.Use(authMiddleware.RequireAuth())
    {
        rewards.GET("/points", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"total_points": 1500, "available_points": 1200})
        })
        rewards.GET("/points/history", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"history": []interface{}{}})
        })
        rewards.GET("/catalog", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"rewards": []interface{}{}})
        })
        rewards.POST("/redeem", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"redeemed": true, "confirmation": "REDEEM123"})
        })
        rewards.GET("/redeemed", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"redeemed_rewards": []interface{}{}})
        })
        rewards.GET("/tiers", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"tiers": []interface{}{}})
        })
        rewards.GET("/my-tier", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"tier": "Gold", "benefits": []interface{}{}})
        })
    }
    
    // Achievements endpoints
    achievements := router.Group("/achievements")
    achievements.Use(authMiddleware.RequireAuth())
    {
        achievements.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"achievements": []interface{}{}})
        })
        achievements.GET("/unlocked", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"unlocked": []interface{}{}})
        })
        achievements.GET("/locked", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"locked": []interface{}{}})
        })
        achievements.GET("/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"achievement": gin.H{"id": c.Param("id")}})
        })
        achievements.POST("/:id/claim", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"claimed": true, "reward": gin.H{"badge": "badge_url"}})
        })
        achievements.GET("/progress", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"progress": gin.H{"total": 100, "unlocked": 45}})
        })
    }
    
    // Leaderboards endpoints
    leaderboards := router.Group("/leaderboards")
    leaderboards.Use(authMiddleware.RequireAuth())
    {
        leaderboards.GET("/global", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"leaderboard": []interface{}{}})
        })
        leaderboards.GET("/creators", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"creators": []interface{}{}})
        })
        leaderboards.GET("/fans", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"fans": []interface{}{}})
        })
        leaderboards.GET("/weekly", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"weekly": []interface{}{}})
        })
        leaderboards.GET("/monthly", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"monthly": []interface{}{}})
        })
        leaderboards.GET("/all-time", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"all_time": []interface{}{}})
        })
        leaderboards.GET("/my-rank", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"rank": 42, "percentile": 85})
        })
    }
    
    // Badges endpoints
    badges := router.Group("/badges")
    badges.Use(authMiddleware.RequireAuth())
    {
        badges.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"badges": []interface{}{}})
        })
        badges.GET("/earned", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"earned": []interface{}{}})
        })
        badges.GET("/available", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"available": []interface{}{}})
        })
        badges.GET("/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"badge": gin.H{"id": c.Param("id")}})
        })
        badges.POST("/:id/showcase", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"showcased": true})
        })
    }
    
    // Tournaments endpoints
    tournaments := router.Group("/tournaments")
    tournaments.Use(authMiddleware.RequireAuth())
    {
        tournaments.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"tournaments": []interface{}{}})
        })
        tournaments.GET("/live", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"live": []interface{}{}})
        })
        tournaments.GET("/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"tournament": gin.H{"id": c.Param("id")}})
        })
        tournaments.POST("/:id/join", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"joined": true})
        })
        tournaments.GET("/:id/bracket", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"bracket": []interface{}{}})
        })
        tournaments.GET("/:id/matches", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"matches": []interface{}{}})
        })
    }
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8007"
    }
    
    log.Printf("Gamification Service starting on port %s", port)
    if err := router.Run(":" + port); err != nil {
        log.Fatal(err)
    }
}
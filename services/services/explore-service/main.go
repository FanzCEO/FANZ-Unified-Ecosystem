package main

import (
        "log"
        "net/http"
        "os"
        "time"

        "github.com/gin-gonic/gin"
        "github.com/fanzos/shared/config"
        "github.com/fanzos/shared/database"
        "github.com/fanzos/shared/middleware"
        "github.com/fanzos/explore-service/handlers"
)

func main() {
        cfg := config.Load()
        
        // Initialize database
        db, err := database.Initialize(cfg.DatabaseURL, cfg.RedisURL)
        if err != nil {
                log.Fatalf("Failed to initialize database: %v", err)
        }
        defer db.Close()

        // Create router
        router := gin.New()
        router.Use(gin.Logger())
        router.Use(gin.Recovery())
        router.Use(middleware.CORS(&middleware.CORSConfig{
                AllowOrigins:     []string{"*"},
                AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
                AllowHeaders:     []string{"*"},
                AllowCredentials: true,
        }))
        
        // Initialize handlers
        exploreHandler := handlers.NewExploreHandler(db)
        categoryHandler := handlers.NewCategoryHandler(db)
        todoHandler := handlers.NewTodoHandler()
        
        // Public routes - Creator exploration
        router.GET("/health", healthCheck)
        router.GET("/explore/creators", exploreHandler.ExploreCreators)
        router.GET("/explore/creators/featured", exploreHandler.GetFeaturedCreators)
        router.GET("/explore/creators/trending", exploreHandler.GetTrendingCreators)
        router.GET("/explore/creators/new", exploreHandler.GetNewCreators)
        router.GET("/explore/creators/online", exploreHandler.GetOnlineCreators)
        router.GET("/explore/creators/nearby", exploreHandler.GetNearbyCreators)
        
        // Categories
        router.GET("/categories", categoryHandler.GetCategories)
        router.GET("/categories/:id", categoryHandler.GetCategory)
        router.GET("/categories/:id/creators", categoryHandler.GetCategoryCreators)
        
        // Filters and search
        router.GET("/filters", exploreHandler.GetAvailableFilters)
        router.POST("/search/creators", exploreHandler.SearchCreators)
        router.GET("/search/suggestions", exploreHandler.GetSearchSuggestions)
        
        // Admin routes - Category management
        admin := router.Group("/admin")
        // Simple admin auth middleware for now
        admin.Use(func(c *gin.Context) {
                token := c.GetHeader("Authorization")
                if token == "" {
                        c.JSON(401, gin.H{"error": "Unauthorized"})
                        c.Abort()
                        return
                }
                c.Next()
        })
        {
                admin.POST("/categories", categoryHandler.CreateCategory)
                admin.PUT("/categories/:id", categoryHandler.UpdateCategory)
                admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)
                admin.POST("/categories/:id/activate", categoryHandler.ActivateCategory)
                admin.POST("/categories/:id/deactivate", categoryHandler.DeactivateCategory)
                admin.PUT("/categories/reorder", categoryHandler.ReorderCategories)
                
                // Featured creator management
                admin.POST("/featured/add/:creatorId", exploreHandler.AddFeaturedCreator)
                admin.DELETE("/featured/remove/:creatorId", exploreHandler.RemoveFeaturedCreator)
                admin.GET("/featured/list", exploreHandler.ListFeaturedCreators)
                admin.PUT("/featured/reorder", exploreHandler.ReorderFeaturedCreators)
                
                // TODO management
                admin.GET("/todos", todoHandler.ScanTodos)
                admin.POST("/todos/:id/toggle", todoHandler.ToggleTodo)
        }
        
        // Statistics
        router.GET("/stats/popular-categories", categoryHandler.GetPopularCategories)
        router.GET("/stats/search-trends", exploreHandler.GetSearchTrends)
        
        port := os.Getenv("PORT")
        if port == "" {
                port = "8013"
        }
        
        log.Printf("Explore Service starting on port %s", port)
        if err := router.Run("0.0.0.0:" + port); err != nil {
                log.Fatalf("Failed to start server: %v", err)
        }
}

func healthCheck(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
                "status": "healthy",
                "service": "explore-service",
                "timestamp": time.Now().UTC(),
        })
}
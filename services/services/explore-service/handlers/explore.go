package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/fanzos/shared/database"
	"github.com/fanzos/explore-service/models"
)

type ExploreHandler struct {
	db *database.Database
}

func NewExploreHandler(db *database.Database) *ExploreHandler {
	return &ExploreHandler{db: db}
}

// ExploreCreators with advanced filters
func (h *ExploreHandler) ExploreCreators(c *gin.Context) {
	// Parse filters from query params
	filters := models.ExploreFilters{
		Category:       c.Query("category"),
		Gender:         c.Query("gender"),
		Age:            c.Query("age"),
		Location:       c.Query("location"),
		Language:       c.Query("language"),
		PriceMin:       parseFloat(c.Query("price_min")),
		PriceMax:       parseFloat(c.Query("price_max")),
		BodyType:       c.Query("body_type"),
		Ethnicity:      c.Query("ethnicity"),
		HairColor:      c.Query("hair_color"),
		ContentType:    c.Query("content_type"),
		Orientation:    c.Query("orientation"),
		Verified:       c.Query("verified") == "true",
		HasLiveStream:  c.Query("has_live") == "true",
		HasVideos:      c.Query("has_videos") == "true",
		HasPhotos:      c.Query("has_photos") == "true",
		FreeAccount:    c.Query("free_account") == "true",
		SortBy:         c.DefaultQuery("sort", "popular"),
		Page:           parseInt(c.DefaultQuery("page", "1")),
		Limit:          parseInt(c.DefaultQuery("limit", "24")),
	}
	
	// Build query based on filters
	creators, total, err := h.getFilteredCreators(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"creators": creators,
		"total": total,
		"page": filters.Page,
		"limit": filters.Limit,
		"filters_applied": filters,
	})
}

// GetFeaturedCreators returns admin-selected featured creators
func (h *ExploreHandler) GetFeaturedCreators(c *gin.Context) {
	var featured []models.FeaturedCreator
	
	err := h.db.DB.Table("featured_creators").
		Joins("JOIN users ON users.id = featured_creators.creator_id").
		Where("featured_creators.active = ?", true).
		Order("featured_creators.position ASC").
		Select(`
			featured_creators.*,
			users.username,
			users.display_name,
			users.avatar_url,
			users.cover_url,
			users.bio,
			users.subscription_price,
			users.subscriber_count,
			users.is_verified,
			users.is_online
		`).
		Scan(&featured).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch featured creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"featured": featured})
}

// GetTrendingCreators based on recent activity
func (h *ExploreHandler) GetTrendingCreators(c *gin.Context) {
	limit := parseInt(c.DefaultQuery("limit", "12"))
	
	var trending []models.CreatorProfile
	
	// Get creators with most activity in last 7 days
	err := h.db.DB.Table("users").
		Where("role = ?", "creator").
		Where("is_active = ?", true).
		Where("last_active > ?", time.Now().AddDate(0, 0, -7)).
		Order("trending_score DESC, subscriber_count DESC").
		Limit(limit).
		Find(&trending).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch trending creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"trending": trending})
}

// GetNewCreators who recently joined
func (h *ExploreHandler) GetNewCreators(c *gin.Context) {
	limit := parseInt(c.DefaultQuery("limit", "12"))
	
	var newCreators []models.CreatorProfile
	
	err := h.db.DB.Table("users").
		Where("role = ?", "creator").
		Where("is_active = ?", true).
		Where("created_at > ?", time.Now().AddDate(0, 0, -30)).
		Order("created_at DESC").
		Limit(limit).
		Find(&newCreators).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch new creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"new_creators": newCreators})
}

// GetOnlineCreators currently online
func (h *ExploreHandler) GetOnlineCreators(c *gin.Context) {
	limit := parseInt(c.DefaultQuery("limit", "24"))
	
	var online []models.CreatorProfile
	
	err := h.db.DB.Table("users").
		Where("role = ?", "creator").
		Where("is_online = ?", true).
		Order("last_active DESC").
		Limit(limit).
		Find(&online).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch online creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"online": online})
}

// GetNearbyCreators based on location
func (h *ExploreHandler) GetNearbyCreators(c *gin.Context) {
	lat := parseFloat(c.Query("lat"))
	lng := parseFloat(c.Query("lng"))
	radius := parseFloat(c.DefaultQuery("radius", "50")) // km
	
	if lat == 0 || lng == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location required"})
		return
	}
	
	var nearby []models.CreatorProfile
	
	// Using Haversine formula for distance calculation
	err := h.db.DB.Table("users").
		Where("role = ?", "creator").
		Where("is_active = ?", true).
		Where("show_location = ?", true).
		Where(`
			(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
			cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
			sin(radians(latitude)))) < ?
		`, lat, lng, lat, radius).
		Order("distance ASC").
		Find(&nearby).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"nearby": nearby})
}

// GetAvailableFilters returns all available filter options
func (h *ExploreHandler) GetAvailableFilters(c *gin.Context) {
	filters := gin.H{
		"categories": h.getActiveCategories(),
		"genders": []string{"Male", "Female", "Trans", "Couple", "Other"},
		"age_ranges": []string{"18-21", "22-25", "26-30", "31-35", "36-40", "40+"},
		"body_types": []string{"Slim", "Athletic", "Average", "Curvy", "BBW", "Muscular"},
		"ethnicities": []string{"Asian", "Black", "Caucasian", "Hispanic", "Middle Eastern", "Mixed", "Other"},
		"hair_colors": []string{"Black", "Brown", "Blonde", "Red", "Other"},
		"content_types": []string{"Photos", "Videos", "Live Streams", "Custom", "Messages"},
		"orientations": []string{"Straight", "Gay", "Lesbian", "Bisexual", "Other"},
		"languages": h.getAvailableLanguages(),
		"price_ranges": []gin.H{
			{"label": "Free", "min": 0, "max": 0},
			{"label": "$5-15", "min": 5, "max": 15},
			{"label": "$15-30", "min": 15, "max": 30},
			{"label": "$30-50", "min": 30, "max": 50},
			{"label": "$50+", "min": 50, "max": 999},
		},
		"sort_options": []gin.H{
			{"value": "popular", "label": "Most Popular"},
			{"value": "newest", "label": "Newest"},
			{"value": "price_low", "label": "Price: Low to High"},
			{"value": "price_high", "label": "Price: High to Low"},
			{"value": "most_liked", "label": "Most Liked"},
			{"value": "most_active", "label": "Most Active"},
		},
	}
	
	c.JSON(http.StatusOK, filters)
}

// SearchCreators with advanced search
func (h *ExploreHandler) SearchCreators(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	// Log search for trending analysis
	h.logSearch(req.Query, c.ClientIP())
	
	// Perform search
	results, err := h.performSearch(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"query": req.Query,
		"total": len(results),
	})
}

// GetSearchSuggestions for autocomplete
func (h *ExploreHandler) GetSearchSuggestions(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query required"})
		return
	}
	
	var suggestions []string
	
	// Get creator usernames and display names matching query
	h.db.DB.Table("users").
		Where("role = ? AND is_active = ?", "creator", true).
		Where("username LIKE ? OR display_name LIKE ?", query+"%", query+"%").
		Limit(10).
		Pluck("username", &suggestions)
	
	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

// Admin functions

// AddFeaturedCreator adds a creator to featured list
func (h *ExploreHandler) AddFeaturedCreator(c *gin.Context) {
	creatorId := c.Param("creatorId")
	
	featured := models.FeaturedCreator{
		CreatorID: creatorId,
		Active: true,
		AddedAt: time.Now(),
		Position: h.getNextFeaturedPosition(),
	}
	
	if err := h.db.DB.Create(&featured).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add featured creator"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Creator featured successfully"})
}

// RemoveFeaturedCreator removes from featured list
func (h *ExploreHandler) RemoveFeaturedCreator(c *gin.Context) {
	creatorId := c.Param("creatorId")
	
	if err := h.db.DB.Where("creator_id = ?", creatorId).Delete(&models.FeaturedCreator{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove featured creator"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Creator removed from featured"})
}

// ListFeaturedCreators for admin panel
func (h *ExploreHandler) ListFeaturedCreators(c *gin.Context) {
	var featured []models.FeaturedCreator
	
	err := h.db.DB.Order("position ASC").Find(&featured).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list featured creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"featured": featured})
}

// ReorderFeaturedCreators updates display order
func (h *ExploreHandler) ReorderFeaturedCreators(c *gin.Context) {
	var req struct {
		Order []struct {
			CreatorID string `json:"creator_id"`
			Position  int    `json:"position"`
		} `json:"order"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	// Update positions
	for _, item := range req.Order {
		h.db.DB.Model(&models.FeaturedCreator{}).
			Where("creator_id = ?", item.CreatorID).
			Update("position", item.Position)
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Order updated successfully"})
}

// GetSearchTrends returns popular search terms
func (h *ExploreHandler) GetSearchTrends(c *gin.Context) {
	var trends []models.SearchTrend
	
	err := h.db.DB.Table("search_logs").
		Select("query, COUNT(*) as count").
		Where("created_at > ?", time.Now().AddDate(0, 0, -7)).
		Group("query").
		Order("count DESC").
		Limit(20).
		Scan(&trends).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get search trends"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"trends": trends})
}

// Helper functions

func (h *ExploreHandler) getFilteredCreators(filters models.ExploreFilters) ([]models.CreatorProfile, int64, error) {
	query := h.db.DB.Table("users").Where("role = ? AND is_active = ?", "creator", true)
	
	// Apply filters
	if filters.Category != "" {
		query = query.Joins("JOIN user_categories ON users.id = user_categories.user_id").
			Where("user_categories.category_id = ?", filters.Category)
	}
	
	if filters.Gender != "" {
		query = query.Where("gender = ?", filters.Gender)
	}
	
	if filters.Location != "" {
		query = query.Where("location LIKE ?", "%"+filters.Location+"%")
	}
	
	if filters.Verified {
		query = query.Where("is_verified = ?", true)
	}
	
	if filters.PriceMin > 0 {
		query = query.Where("subscription_price >= ?", filters.PriceMin)
	}
	
	if filters.PriceMax > 0 {
		query = query.Where("subscription_price <= ?", filters.PriceMax)
	}
	
	// Apply sorting
	switch filters.SortBy {
	case "newest":
		query = query.Order("created_at DESC")
	case "price_low":
		query = query.Order("subscription_price ASC")
	case "price_high":
		query = query.Order("subscription_price DESC")
	case "most_liked":
		query = query.Order("total_likes DESC")
	case "most_active":
		query = query.Order("last_active DESC")
	default:
		query = query.Order("subscriber_count DESC")
	}
	
	// Get total count
	var total int64
	query.Count(&total)
	
	// Apply pagination
	offset := (filters.Page - 1) * filters.Limit
	query = query.Offset(offset).Limit(filters.Limit)
	
	var creators []models.CreatorProfile
	err := query.Find(&creators).Error
	
	return creators, total, err
}

func (h *ExploreHandler) getActiveCategories() []models.Category {
	var categories []models.Category
	h.db.DB.Where("is_active = ?", true).Order("position ASC").Find(&categories)
	return categories
}

func (h *ExploreHandler) getAvailableLanguages() []string {
	var languages []string
	h.db.DB.Table("users").
		Where("role = ?", "creator").
		Where("languages IS NOT NULL").
		Distinct("languages").
		Pluck("languages", &languages)
	return languages
}

func (h *ExploreHandler) logSearch(query, ip string) {
	log := models.SearchLog{
		Query:     query,
		IP:        ip,
		CreatedAt: time.Now(),
	}
	h.db.DB.Create(&log)
}

func (h *ExploreHandler) performSearch(req models.SearchRequest) ([]models.CreatorProfile, error) {
	var creators []models.CreatorProfile
	
	query := h.db.DB.Table("users").
		Where("role = ? AND is_active = ?", "creator", true).
		Where("username LIKE ? OR display_name LIKE ? OR bio LIKE ?", 
			"%"+req.Query+"%", "%"+req.Query+"%", "%"+req.Query+"%")
	
	// Apply additional filters if provided
	if req.Filters != nil {
		// Apply filters similar to ExploreCreators
	}
	
	err := query.Find(&creators).Error
	return creators, err
}

func (h *ExploreHandler) getNextFeaturedPosition() int {
	var maxPos int
	h.db.DB.Table("featured_creators").Select("MAX(position)").Scan(&maxPos)
	return maxPos + 1
}

func parseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func parseInt(s string) int {
	i, _ := strconv.Atoi(s)
	if i <= 0 {
		return 1
	}
	return i
}
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/fanzos/shared/database"
	"github.com/fanzos/explore-service/models"
)

type CategoryHandler struct {
	db *database.Database
}

func NewCategoryHandler(db *database.Database) *CategoryHandler {
	return &CategoryHandler{db: db}
}

// GetCategories returns all active categories
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	var categories []models.Category
	
	err := h.db.DB.Where("is_active = ?", true).
		Order("position ASC, name ASC").
		Find(&categories).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	
	// Get creator count for each category
	for i := range categories {
		var count int64
		h.db.DB.Table("user_categories").
			Where("category_id = ?", categories[i].ID).
			Count(&count)
		categories[i].CreatorCount = int(count)
	}
	
	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// GetCategory returns a specific category
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")
	
	var category models.Category
	err := h.db.DB.Where("id = ? AND is_active = ?", id, true).
		First(&category).Error
		
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	
	// Get creator count
	var count int64
	h.db.DB.Table("user_categories").
		Where("category_id = ?", category.ID).
		Count(&count)
	category.CreatorCount = int(count)
	
	c.JSON(http.StatusOK, gin.H{"category": category})
}

// GetCategoryCreators returns creators in a category
func (h *CategoryHandler) GetCategoryCreators(c *gin.Context) {
	categoryId := c.Param("id")
	page := parseInt(c.DefaultQuery("page", "1"))
	limit := parseInt(c.DefaultQuery("limit", "24"))
	sortBy := c.DefaultQuery("sort", "popular")
	
	var creators []models.CreatorProfile
	
	query := h.db.DB.Table("users").
		Joins("JOIN user_categories ON users.id = user_categories.user_id").
		Where("user_categories.category_id = ?", categoryId).
		Where("users.role = ? AND users.is_active = ?", "creator", true)
	
	// Apply sorting
	switch sortBy {
	case "newest":
		query = query.Order("users.created_at DESC")
	case "price_low":
		query = query.Order("users.subscription_price ASC")
	case "price_high":
		query = query.Order("users.subscription_price DESC")
	default:
		query = query.Order("users.subscriber_count DESC")
	}
	
	// Get total count
	var total int64
	query.Count(&total)
	
	// Apply pagination
	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Find(&creators).Error
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch creators"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"creators": creators,
		"total": total,
		"page": page,
		"limit": limit,
	})
}

// Admin functions

// CreateCategory creates a new category
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	category := models.Category{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Icon:        req.Icon,
		Color:       req.Color,
		IsActive:    true,
		Position:    h.getNextPosition(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	if err := h.db.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Category created successfully",
		"category": category,
	})
}

// UpdateCategory updates an existing category
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	
	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	var category models.Category
	if err := h.db.DB.Where("id = ?", id).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	
	// Update fields
	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Icon != "" {
		updates["icon"] = req.Icon
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	
	if err := h.db.DB.Model(&category).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Category updated successfully",
		"category": category,
	})
}

// DeleteCategory deletes a category
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	
	// Check if category has creators
	var count int64
	h.db.DB.Table("user_categories").Where("category_id = ?", id).Count(&count)
	
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete category with assigned creators",
			"creator_count": count,
		})
		return
	}
	
	if err := h.db.DB.Where("id = ?", id).Delete(&models.Category{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// ActivateCategory activates a category
func (h *CategoryHandler) ActivateCategory(c *gin.Context) {
	id := c.Param("id")
	
	if err := h.db.DB.Model(&models.Category{}).
		Where("id = ?", id).
		Update("is_active", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate category"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Category activated successfully"})
}

// DeactivateCategory deactivates a category
func (h *CategoryHandler) DeactivateCategory(c *gin.Context) {
	id := c.Param("id")
	
	if err := h.db.DB.Model(&models.Category{}).
		Where("id = ?", id).
		Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate category"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Category deactivated successfully"})
}

// ReorderCategories updates the display order
func (h *CategoryHandler) ReorderCategories(c *gin.Context) {
	var req struct {
		Order []struct {
			ID       string `json:"id"`
			Position int    `json:"position"`
		} `json:"order"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	// Update positions
	for _, item := range req.Order {
		h.db.DB.Model(&models.Category{}).
			Where("id = ?", item.ID).
			Update("position", item.Position)
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Category order updated successfully"})
}

// GetPopularCategories returns most popular categories
func (h *CategoryHandler) GetPopularCategories(c *gin.Context) {
	limit := parseInt(c.DefaultQuery("limit", "10"))
	
	var popular []struct {
		models.Category
		CreatorCount int `json:"creator_count"`
		ViewCount    int `json:"view_count"`
	}
	
	err := h.db.DB.Table("categories").
		Select(`categories.*, 
			COUNT(DISTINCT user_categories.user_id) as creator_count,
			COALESCE(SUM(category_views.views), 0) as view_count`).
		Joins("LEFT JOIN user_categories ON categories.id = user_categories.category_id").
		Joins("LEFT JOIN category_views ON categories.id = category_views.category_id").
		Where("categories.is_active = ?", true).
		Group("categories.id").
		Order("creator_count DESC, view_count DESC").
		Limit(limit).
		Scan(&popular).Error
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch popular categories"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"popular": popular})
}

// Helper functions

func (h *CategoryHandler) getNextPosition() int {
	var maxPos int
	h.db.DB.Table("categories").Select("COALESCE(MAX(position), 0)").Scan(&maxPos)
	return maxPos + 1
}
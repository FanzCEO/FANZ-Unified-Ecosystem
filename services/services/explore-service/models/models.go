package models

import (
	"time"
)

// Category represents a content category
type Category struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug" gorm:"uniqueIndex"`
	Description  string    `json:"description"`
	Icon         string    `json:"icon"`
	Color        string    `json:"color"`
	Position     int       `json:"position"`
	IsActive     bool      `json:"is_active"`
	CreatorCount int       `json:"creator_count" gorm:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreatorProfile represents a creator's public profile
type CreatorProfile struct {
	ID                string    `json:"id" gorm:"primaryKey"`
	Username          string    `json:"username"`
	DisplayName       string    `json:"display_name"`
	Bio               string    `json:"bio"`
	AvatarURL         string    `json:"avatar_url"`
	CoverURL          string    `json:"cover_url"`
	SubscriptionPrice float64   `json:"subscription_price"`
	SubscriberCount   int       `json:"subscriber_count"`
	PostCount         int       `json:"post_count"`
	VideoCount        int       `json:"video_count"`
	PhotoCount        int       `json:"photo_count"`
	IsVerified        bool      `json:"is_verified"`
	IsOnline          bool      `json:"is_online"`
	IsFree            bool      `json:"is_free"`
	Gender            string    `json:"gender"`
	Age               int       `json:"age"`
	Location          string    `json:"location"`
	ShowLocation      bool      `json:"show_location"`
	Languages         []string  `json:"languages" gorm:"type:jsonb"`
	BodyType          string    `json:"body_type"`
	Ethnicity         string    `json:"ethnicity"`
	HairColor         string    `json:"hair_color"`
	Orientation       string    `json:"orientation"`
	ContentTypes      []string  `json:"content_types" gorm:"type:jsonb"`
	Categories        []string  `json:"categories" gorm:"type:jsonb"`
	TrendingScore     int       `json:"trending_score"`
	TotalLikes        int       `json:"total_likes"`
	LastActive        time.Time `json:"last_active"`
	CreatedAt         time.Time `json:"created_at"`
	Latitude          float64   `json:"latitude" gorm:"column:latitude"`
	Longitude         float64   `json:"longitude" gorm:"column:longitude"`
}

// FeaturedCreator represents a featured creator
type FeaturedCreator struct {
	ID                string    `json:"id" gorm:"primaryKey"`
	CreatorID         string    `json:"creator_id"`
	Position          int       `json:"position"`
	Active            bool      `json:"active"`
	AddedAt           time.Time `json:"added_at"`
	Username          string    `json:"username" gorm:"-"`
	DisplayName       string    `json:"display_name" gorm:"-"`
	AvatarURL         string    `json:"avatar_url" gorm:"-"`
	CoverURL          string    `json:"cover_url" gorm:"-"`
	Bio               string    `json:"bio" gorm:"-"`
	SubscriptionPrice float64   `json:"subscription_price" gorm:"-"`
	SubscriberCount   int       `json:"subscriber_count" gorm:"-"`
	IsVerified        bool      `json:"is_verified" gorm:"-"`
	IsOnline          bool      `json:"is_online" gorm:"-"`
}

// ExploreFilters represents filtering options for exploration
type ExploreFilters struct {
	Category      string  `json:"category"`
	Gender        string  `json:"gender"`
	Age           string  `json:"age"`
	Location      string  `json:"location"`
	Language      string  `json:"language"`
	PriceMin      float64 `json:"price_min"`
	PriceMax      float64 `json:"price_max"`
	BodyType      string  `json:"body_type"`
	Ethnicity     string  `json:"ethnicity"`
	HairColor     string  `json:"hair_color"`
	ContentType   string  `json:"content_type"`
	Orientation   string  `json:"orientation"`
	Verified      bool    `json:"verified"`
	HasLiveStream bool    `json:"has_live_stream"`
	HasVideos     bool    `json:"has_videos"`
	HasPhotos     bool    `json:"has_photos"`
	FreeAccount   bool    `json:"free_account"`
	SortBy        string  `json:"sort_by"`
	Page          int     `json:"page"`
	Limit         int     `json:"limit"`
}

// SearchRequest represents a search request
type SearchRequest struct {
	Query   string          `json:"query"`
	Filters *ExploreFilters `json:"filters,omitempty"`
}

// SearchLog tracks search queries
type SearchLog struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Query     string    `json:"query"`
	IP        string    `json:"ip"`
	UserID    string    `json:"user_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// SearchTrend represents trending search terms
type SearchTrend struct {
	Query string `json:"query"`
	Count int    `json:"count"`
}

// UserCategory links users to categories
type UserCategory struct {
	UserID     string `json:"user_id"`
	CategoryID string `json:"category_id"`
}

// CategoryView tracks category page views
type CategoryView struct {
	CategoryID string `json:"category_id"`
	Views      int    `json:"views"`
	Date       string `json:"date"`
}

// Request models for admin operations

// CreateCategoryRequest for creating a new category
type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

// UpdateCategoryRequest for updating a category
type UpdateCategoryRequest struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}
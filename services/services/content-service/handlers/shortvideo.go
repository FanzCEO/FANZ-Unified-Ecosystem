package handlers

import (
    "net/http"
    "strconv"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/utils"
    "github.com/fanzos/shared/middleware"
)

type ShortVideoHandler struct {
    db     *database.Database
    config *config.Config
}

func NewShortVideoHandler(db *database.Database, cfg *config.Config) *ShortVideoHandler {
    return &ShortVideoHandler{
        db:     db,
        config: cfg,
    }
}

type CreateShortVideoRequest struct {
    Title       string   `json:"title,omitempty" binding:"omitempty,max=255"`
    Description string   `json:"description,omitempty" binding:"omitempty,max=1000"`
    VideoURL    string   `json:"video_url" binding:"required,url"`
    Duration    int      `json:"duration,omitempty"`
    Type        string   `json:"type" binding:"required,oneof=free ppv"`
    Price       *float64 `json:"price,omitempty"`
    Hashtags    []string `json:"hashtags,omitempty"`
    Effects     []VideoEffectRequest `json:"effects,omitempty"`
}

type VideoEffectRequest struct {
    EffectType string                 `json:"effect_type" binding:"required"`
    EffectName string                 `json:"effect_name,omitempty"`
    EffectData map[string]interface{} `json:"effect_data,omitempty"`
    StartTime  *float64               `json:"start_time,omitempty"`
    EndTime    *float64               `json:"end_time,omitempty"`
}

type ReactToVideoRequest struct {
    ReactionType string `json:"reaction_type" binding:"required,oneof=like love fire wow laugh heart_eyes tongue wink"`
}

func (h *ShortVideoHandler) GetTrendingVideos(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    category := c.DefaultQuery("category", "")
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 50 {
        limit = 20
    }

    offset := (page - 1) * limit

    var videos []models.ShortVideo
    query := h.db.DB.Model(&models.ShortVideo{}).
        Where("moderation_status = ?", models.ModerationApproved).
        Where("created_at >= ?", time.Now().AddDate(0, 0, -7)). // Last 7 days
        Preload("User").
        Preload("Hashtags").
        Order("trending_score DESC, created_at DESC")

    // Filter by category if specified
    if category != "" {
        query = query.Joins("JOIN short_video_hashtags svh ON svh.short_video_id = short_videos.id").
            Joins("JOIN hashtags h ON h.id = svh.hashtag_id").
            Where("h.category = ?", category)
    }

    // Get total count
    var total int64
    query.Count(&total)

    // Get videos with pagination
    if err := query.Offset(offset).Limit(limit).Find(&videos).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch trending videos",
            "code":  "TRENDING_VIDEOS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "videos": h.formatShortVideosResponse(videos),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ShortVideoHandler) GetShortVideo(c *gin.Context) {
    videoID := c.Param("id")
    
    var video models.ShortVideo
    if err := h.db.DB.Where("id = ?", videoID).
        Preload("User").
        Preload("Hashtags").
        Preload("Effects").
        Preload("OriginalVideo").
        First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Check access permissions
    var userID *uuid.UUID
    if claims, exists := middleware.GetCurrentUser(c); exists {
        userID = &claims.UserID
    }

    if !h.canAccessVideo(&video, userID) {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Access denied",
            "code":  "ACCESS_DENIED",
            "requires_purchase": video.Type == models.PostPPV,
            "price": video.Price,
        })
        return
    }

    // Record view
    if userID != nil {
        h.recordVideoView(&video, userID, c.ClientIP(), c.Request.UserAgent())
    }

    // Increment view count
    video.IncrementViews()
    h.db.DB.Save(&video)

    c.JSON(http.StatusOK, gin.H{
        "video": h.formatShortVideoResponse(&video),
    })
}

func (h *ShortVideoHandler) GetShortVideoFeed(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 50 {
        limit = 20
    }

    offset := (page - 1) * limit

    // Get personalized feed based on user preferences and following
    var videos []models.ShortVideo
    
    // For now, use a simple algorithm combining trending and following
    query := h.db.DB.Model(&models.ShortVideo{}).
        Where("moderation_status = ?", models.ModerationApproved).
        Where(`(user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) 
                OR trending_score > 10)`, claims.UserID).
        Preload("User").
        Preload("Hashtags").
        Order("(CASE WHEN user_id IN (SELECT following_id FROM follows WHERE follower_id = ?) THEN trending_score * 2 ELSE trending_score END) DESC, created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get videos with pagination
    if err := query.Offset(offset).Limit(limit).Find(&videos).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch video feed",
            "code":  "VIDEO_FEED_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "videos": h.formatShortVideosResponse(videos),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ShortVideoHandler) CreateShortVideo(c *gin.Context) {
    var req CreateShortVideoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        validationErrors := utils.ValidateStruct(req)
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Validation failed",
            "code":    "VALIDATION_ERROR",
            "details": validationErrors,
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)

    // Validate user can create content
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    if !user.CanPost() {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Not authorized to create videos",
            "code":  "NOT_AUTHORIZED",
        })
        return
    }

    // Validate PPV price
    if req.Type == "ppv" && (req.Price == nil || *req.Price <= 0) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "PPV videos require a price",
            "code":  "PRICE_REQUIRED",
        })
        return
    }

    // Create short video
    video := models.ShortVideo{
        UserID:      claims.UserID,
        Title:       &req.Title,
        Description: &req.Description,
        VideoURL:    req.VideoURL,
        Duration:    &req.Duration,
        Type:        models.PostType(req.Type),
        Price:       req.Price,
    }

    // Set moderation status
    if user.IsVerified {
        video.ModerationStatus = models.ModerationApproved
    } else {
        video.ModerationStatus = models.ModerationPending
    }

    if err := h.db.DB.Create(&video).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create video",
            "code":  "VIDEO_CREATION_ERROR",
        })
        return
    }

    // Add hashtags
    if len(req.Hashtags) > 0 {
        h.addHashtagsToVideo(&video, req.Hashtags)
    }

    // Add effects
    if len(req.Effects) > 0 {
        h.addEffectsToVideo(&video, req.Effects)
    }

    // Calculate initial scores
    video.CalculateEngagementScore()
    video.CalculateTrendingScore()
    h.db.DB.Save(&video)

    // Load the created video with relationships
    h.db.DB.Preload("User").Preload("Hashtags").Preload("Effects").First(&video, video.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Short video created successfully",
        "video":   h.formatShortVideoResponse(&video),
    })
}

func (h *ShortVideoHandler) UpdateShortVideo(c *gin.Context) {
    type UpdateRequest struct {
        Title       string   `json:"title,omitempty"`
        Description string   `json:"description,omitempty"`
        Hashtags    []string `json:"hashtags,omitempty"`
    }

    var req UpdateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)
    videoID := c.Param("id")

    var video models.ShortVideo
    if err := h.db.DB.Where("id = ? AND user_id = ?", videoID, claims.UserID).
        First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Update fields
    if req.Title != "" {
        video.Title = &req.Title
    }
    if req.Description != "" {
        video.Description = &req.Description
    }

    video.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&video).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update video",
            "code":  "VIDEO_UPDATE_ERROR",
        })
        return
    }

    // Update hashtags if provided
    if len(req.Hashtags) > 0 {
        // Remove existing hashtag associations
        // Remove existing hashtag associations  
        h.db.DB.Exec("DELETE FROM short_video_hashtags WHERE short_video_id = ?", video.ID)
        // Add new hashtags
        h.addHashtagsToVideo(&video, req.Hashtags)
    }

    // Load updated video with relationships
    h.db.DB.Preload("User").Preload("Hashtags").First(&video, video.ID)

    c.JSON(http.StatusOK, gin.H{
        "message": "Video updated successfully",
        "video":   h.formatShortVideoResponse(&video),
    })
}

func (h *ShortVideoHandler) DeleteShortVideo(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    videoID := c.Param("id")

    var video models.ShortVideo
    if err := h.db.DB.Where("id = ? AND user_id = ?", videoID, claims.UserID).
        First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Soft delete by updating moderation status
    video.ModerationStatus = models.ModerationRejected
    if err := h.db.DB.Save(&video).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to delete video",
            "code":  "VIDEO_DELETE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Video deleted successfully",
    })
}

func (h *ShortVideoHandler) ReactToVideo(c *gin.Context) {
    var req ReactToVideoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid reaction type",
            "code":  "INVALID_REACTION",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)
    videoID := c.Param("id")

    videoUUID, err := uuid.Parse(videoID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid video ID",
            "code":  "INVALID_VIDEO_ID",
        })
        return
    }

    // Check if video exists
    var video models.ShortVideo
    if err := h.db.DB.Where("id = ?", videoUUID).First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Check if user already reacted
    var existingReaction models.ShortVideoReaction
    err = h.db.DB.Where("user_id = ? AND short_video_id = ?", claims.UserID, videoUUID).
        First(&existingReaction).Error

    if err == nil {
        // Update existing reaction
        existingReaction.ReactionType = models.ReactionType(req.ReactionType)
        h.db.DB.Save(&existingReaction)
    } else {
        // Create new reaction
        reaction := models.ShortVideoReaction{
            UserID:       claims.UserID,
            ShortVideoID: videoUUID,
            ReactionType: models.ReactionType(req.ReactionType),
        }

        if err := h.db.DB.Create(&reaction).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Failed to add reaction",
                "code":  "REACTION_ERROR",
            })
            return
        }

        // Update video like count (treating all reactions as likes for now)
        video.IncrementLikes()
        h.db.DB.Save(&video)
    }

    c.JSON(http.StatusOK, gin.H{
        "message":    "Reaction added successfully",
        "like_count": video.LikeCount,
    })
}

func (h *ShortVideoHandler) CommentOnVideo(c *gin.Context) {
    type CommentRequest struct {
        Content  string     `json:"content" binding:"required,min=1,max=500"`
        ParentID *uuid.UUID `json:"parent_id,omitempty"`
    }

    var req CommentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)
    videoID := c.Param("id")

    videoUUID, err := uuid.Parse(videoID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid video ID",
            "code":  "INVALID_VIDEO_ID",
        })
        return
    }

    // Check if video exists
    var video models.ShortVideo
    if err := h.db.DB.Where("id = ?", videoUUID).First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Create comment
    comment := models.Comment{
        UserID:           claims.UserID,
        ShortVideoID:     &videoUUID,
        ParentID:         req.ParentID,
        Content:          req.Content,
        ModerationStatus: models.ModerationApproved,
    }

    if err := h.db.DB.Create(&comment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create comment",
            "code":  "COMMENT_CREATION_ERROR",
        })
        return
    }

    // Update video comment count
    video.IncrementComments()
    h.db.DB.Save(&video)

    // Load comment with user
    h.db.DB.Preload("User").First(&comment, comment.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Comment created successfully",
        "comment": h.formatCommentResponse(&comment),
    })
}

func (h *ShortVideoHandler) GetVideoComments(c *gin.Context) {
    videoID := c.Param("id")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    videoUUID, err := uuid.Parse(videoID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid video ID",
            "code":  "INVALID_VIDEO_ID",
        })
        return
    }

    var comments []models.Comment
    query := h.db.DB.Model(&models.Comment{}).
        Where("short_video_id = ? AND parent_id IS NULL", videoUUID).
        Where("moderation_status = ?", models.ModerationApproved).
        Preload("User").
        Order("created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get comments with pagination
    if err := query.Offset(offset).Limit(limit).Find(&comments).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch comments",
            "code":  "COMMENTS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "comments": h.formatCommentsResponse(comments),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ShortVideoHandler) ShareVideo(c *gin.Context) {
    videoID := c.Param("id")

    videoUUID, err := uuid.Parse(videoID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid video ID",
            "code":  "INVALID_VIDEO_ID",
        })
        return
    }

    // Check if video exists
    var video models.ShortVideo
    if err := h.db.DB.Where("id = ?", videoUUID).First(&video).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Video not found",
            "code":  "VIDEO_NOT_FOUND",
        })
        return
    }

    // Update share count
    video.IncrementShares()
    h.db.DB.Save(&video)

    c.JSON(http.StatusOK, gin.H{
        "message":     "Video shared successfully",
        "share_count": video.ShareCount,
    })
}

func (h *ShortVideoHandler) CreateDuet(c *gin.Context) {
    type DuetRequest struct {
        VideoURL    string `json:"video_url" binding:"required,url"`
        Title       string `json:"title,omitempty"`
        Description string `json:"description,omitempty"`
    }

    var req DuetRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)
    originalVideoID := c.Param("id")

    originalUUID, err := uuid.Parse(originalVideoID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid video ID",
            "code":  "INVALID_VIDEO_ID",
        })
        return
    }

    // Check if original video exists
    var originalVideo models.ShortVideo
    if err := h.db.DB.Where("id = ?", originalUUID).First(&originalVideo).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Original video not found",
            "code":  "ORIGINAL_VIDEO_NOT_FOUND",
        })
        return
    }

    // Create duet video
    duetVideo := models.ShortVideo{
        UserID:          claims.UserID,
        Title:           &req.Title,
        Description:     &req.Description,
        VideoURL:        req.VideoURL,
        Type:            models.PostFree, // Duets are always free
        IsDuet:          true,
        OriginalVideoID: &originalUUID,
        ModerationStatus: models.ModerationPending,
    }

    if err := h.db.DB.Create(&duetVideo).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create duet",
            "code":  "DUET_CREATION_ERROR",
        })
        return
    }

    // Update original video duet count
    originalVideo.IncrementDuets()
    h.db.DB.Save(&originalVideo)

    // Load duet with relationships
    h.db.DB.Preload("User").Preload("OriginalVideo").First(&duetVideo, duetVideo.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Duet created successfully",
        "video":   h.formatShortVideoResponse(&duetVideo),
    })
}

func (h *ShortVideoHandler) ReportVideo(c *gin.Context) {
    type ReportRequest struct {
        Reason      string `json:"reason" binding:"required"`
        Description string `json:"description,omitempty"`
    }

    var req ReportRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    // TODO: Create content report record
    // For now, just acknowledge the report

    c.JSON(http.StatusOK, gin.H{
        "message": "Video reported successfully. Thank you for helping keep our community safe.",
    })
}

// Hashtag handlers

func (h *ShortVideoHandler) GetHashtags(c *gin.Context) {
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
    category := c.DefaultQuery("category", "")
    
    if limit < 1 || limit > 100 {
        limit = 50
    }

    var hashtags []models.Hashtag
    query := h.db.DB.Model(&models.Hashtag{}).
        Where("is_banned = false").
        Order("usage_count DESC")

    if category != "" {
        query = query.Where("category = ?", category)
    }

    if err := query.Limit(limit).Find(&hashtags).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch hashtags",
            "code":  "HASHTAGS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "hashtags": h.formatHashtagsResponse(hashtags),
    })
}

func (h *ShortVideoHandler) GetTrendingHashtags(c *gin.Context) {
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if limit < 1 || limit > 50 {
        limit = 20
    }

    var hashtags []models.Hashtag
    if err := h.db.DB.Where("is_trending = true AND is_banned = false").
        Order("usage_count DESC").
        Limit(limit).
        Find(&hashtags).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch trending hashtags",
            "code":  "TRENDING_HASHTAGS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "hashtags": h.formatHashtagsResponse(hashtags),
    })
}

func (h *ShortVideoHandler) GetHashtagContent(c *gin.Context) {
    tag := c.Param("tag")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 50 {
        limit = 20
    }

    offset := (page - 1) * limit

    // Clean hashtag (remove # if present)
    if strings.HasPrefix(tag, "#") {
        tag = tag[1:]
    }

    // Get hashtag
    var hashtag models.Hashtag
    if err := h.db.DB.Where("tag = ?", tag).First(&hashtag).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Hashtag not found",
            "code":  "HASHTAG_NOT_FOUND",
        })
        return
    }

    // Get videos with this hashtag
    var videos []models.ShortVideo
    query := h.db.DB.Model(&models.ShortVideo{}).
        Joins("JOIN short_video_hashtags svh ON svh.short_video_id = short_videos.id").
        Where("svh.hashtag_id = ?", hashtag.ID).
        Where("short_videos.moderation_status = ?", models.ModerationApproved).
        Preload("User").
        Preload("Hashtags").
        Order("short_videos.created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get videos with pagination
    if err := query.Offset(offset).Limit(limit).Find(&videos).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch hashtag content",
            "code":  "HASHTAG_CONTENT_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "hashtag": h.formatHashtagResponse(&hashtag),
        "videos":  h.formatShortVideosResponse(videos),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ShortVideoHandler) GetHashtagPosts(c *gin.Context) {
    // Implementation for getting posts with hashtag
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Hashtag posts not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *ShortVideoHandler) GetHashtagVideos(c *gin.Context) {
    // Redirect to GetHashtagContent
    h.GetHashtagContent(c)
}

// Helper functions

func (h *ShortVideoHandler) canAccessVideo(video *models.ShortVideo, userID *uuid.UUID) bool {
    // Free videos are always accessible
    if video.Type == models.PostFree {
        return true
    }

    // Must be authenticated for paid content
    if userID == nil {
        return false
    }

    // Owner can always access their own content
    if video.UserID == *userID {
        return true
    }

    // For PPV content, check if user has purchased
    if video.Type == models.PostPPV {
        var unlock models.PPVUnlock
        err := h.db.DB.Where("user_id = ? AND short_video_id = ?", userID, video.ID).
            First(&unlock).Error
        return err == nil
    }

    return false
}

func (h *ShortVideoHandler) recordVideoView(video *models.ShortVideo, userID *uuid.UUID, ipAddress, userAgent string) {
    view := models.ShortVideoView{
        UserID:       userID,
        ShortVideoID: video.ID,
        IPAddress:    &ipAddress,
        UserAgent:    &userAgent,
    }

    h.db.DB.Create(&view)
}

func (h *ShortVideoHandler) addHashtagsToVideo(video *models.ShortVideo, hashtagStrings []string) {
    for _, tagStr := range hashtagStrings {
        // Clean hashtag
        if strings.HasPrefix(tagStr, "#") {
            tagStr = tagStr[1:]
        }

        if !utils.IsValidHashtag(tagStr) {
            continue
        }

        // Get or create hashtag
        var hashtag models.Hashtag
        err := h.db.DB.Where("tag = ?", tagStr).First(&hashtag).Error
        if err != nil {
            // Create new hashtag
            hashtag = models.Hashtag{
                Tag:        tagStr,
                UsageCount: 1,
            }
            h.db.DB.Create(&hashtag)
        } else {
            // Increment usage count
            hashtag.IncrementUsage()
            h.db.DB.Save(&hashtag)
        }

        // Create association
        association := struct {
            ShortVideoID uuid.UUID `json:"short_video_id"`
            HashtagID    uuid.UUID `json:"hashtag_id"`
        }{
            ShortVideoID: video.ID,
            HashtagID:    hashtag.ID,
        }

        h.db.DB.Table("short_video_hashtags").Create(&association)
    }
}

func (h *ShortVideoHandler) addEffectsToVideo(video *models.ShortVideo, effects []VideoEffectRequest) {
    for _, effectReq := range effects {
        effect := models.VideoEffect{
            ShortVideoID: video.ID,
            EffectType:   models.VideoEffectType(effectReq.EffectType),
            EffectName:   &effectReq.EffectName,
            EffectData:   effectReq.EffectData,
            StartTime:    effectReq.StartTime,
            EndTime:      effectReq.EndTime,
        }

        h.db.DB.Create(&effect)
    }
}

func (h *ShortVideoHandler) formatShortVideoResponse(video *models.ShortVideo) gin.H {
    response := gin.H{
        "id":              video.ID,
        "title":           video.Title,
        "description":     video.Description,
        "video_url":       video.VideoURL,
        "thumbnail_url":   video.ThumbnailURL,
        "duration":        video.Duration,
        "type":            video.Type,
        "price":           video.Price,
        "view_count":      video.ViewCount,
        "like_count":      video.LikeCount,
        "comment_count":   video.CommentCount,
        "share_count":     video.ShareCount,
        "duet_count":      video.DuetCount,
        "is_duet":         video.IsDuet,
        "is_featured":     video.IsFeatured,
        "trending_score":  video.TrendingScore,
        "engagement_score": video.EngagementScore,
        "created_at":      video.CreatedAt,
        "updated_at":      video.UpdatedAt,
        "user": gin.H{
            "id":           video.User.ID,
            "username":     video.User.Username,
            "display_name": video.User.DisplayName,
            "avatar_url":   video.User.AvatarURL,
            "is_verified":  video.User.IsVerified,
        },
        "hashtags": h.formatHashtagsResponse(video.Hashtags),
        "effects":  h.formatEffectsResponse(video.Effects),
    }

    if video.OriginalVideo != nil {
        response["original_video"] = gin.H{
            "id":         video.OriginalVideo.ID,
            "title":      video.OriginalVideo.Title,
            "video_url":  video.OriginalVideo.VideoURL,
            "user": gin.H{
                "username":     video.OriginalVideo.User.Username,
                "display_name": video.OriginalVideo.User.DisplayName,
            },
        }
    }

    return response
}

func (h *ShortVideoHandler) formatShortVideosResponse(videos []models.ShortVideo) []gin.H {
    result := make([]gin.H, len(videos))
    for i, video := range videos {
        result[i] = h.formatShortVideoResponse(&video)
    }
    return result
}

func (h *ShortVideoHandler) formatHashtagResponse(hashtag *models.Hashtag) gin.H {
    return gin.H{
        "id":           hashtag.ID,
        "tag":          hashtag.Tag,
        "usage_count":  hashtag.UsageCount,
        "category":     hashtag.Category,
        "is_trending":  hashtag.IsTrending,
        "created_at":   hashtag.CreatedAt,
    }
}

func (h *ShortVideoHandler) formatHashtagsResponse(hashtags []models.Hashtag) []gin.H {
    result := make([]gin.H, len(hashtags))
    for i, hashtag := range hashtags {
        result[i] = h.formatHashtagResponse(&hashtag)
    }
    return result
}

func (h *ShortVideoHandler) formatEffectsResponse(effects []models.VideoEffect) []gin.H {
    result := make([]gin.H, len(effects))
    for i, effect := range effects {
        result[i] = gin.H{
            "id":          effect.ID,
            "effect_type": effect.EffectType,
            "effect_name": effect.EffectName,
            "effect_data": effect.EffectData,
            "start_time":  effect.StartTime,
            "end_time":    effect.EndTime,
            "created_at":  effect.CreatedAt,
        }
    }
    return result
}

func (h *ShortVideoHandler) formatCommentResponse(comment *models.Comment) gin.H {
    return gin.H{
        "id":         comment.ID,
        "content":    comment.Content,
        "like_count": comment.LikeCount,
        "reply_count": comment.ReplyCount,
        "is_pinned":  comment.IsPinned,
        "parent_id":  comment.ParentID,
        "created_at": comment.CreatedAt,
        "user": gin.H{
            "id":           comment.User.ID,
            "username":     comment.User.Username,
            "display_name": comment.User.DisplayName,
            "avatar_url":   comment.User.AvatarURL,
            "is_verified":  comment.User.IsVerified,
        },
    }
}

func (h *ShortVideoHandler) formatCommentsResponse(comments []models.Comment) []gin.H {
    result := make([]gin.H, len(comments))
    for i, comment := range comments {
        result[i] = h.formatCommentResponse(&comment)
    }
    return result
}

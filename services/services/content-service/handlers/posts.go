package handlers

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/lib/pq"
    "gorm.io/gorm"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/utils"
    "github.com/fanzos/shared/middleware"
)

type PostsHandler struct {
    db     *database.Database
    config *config.Config
}

func NewPostsHandler(db *database.Database, cfg *config.Config) *PostsHandler {
    return &PostsHandler{
        db:     db,
        config: cfg,
    }
}

type CreatePostRequest struct {
    Title       string         `json:"title,omitempty" binding:"omitempty,max=255"`
    Content     string         `json:"content,omitempty" binding:"omitempty,max=10000"`
    Type        string         `json:"type" binding:"required,oneof=free ppv subscription_only"`
    Price       *float64       `json:"price,omitempty" binding:"omitempty,price"`
    MediaURLs   []string       `json:"media_urls,omitempty"`
    Tags        []string       `json:"tags,omitempty"`
    ScheduledAt *time.Time     `json:"scheduled_at,omitempty"`
}

type UpdatePostRequest struct {
    Title   string   `json:"title,omitempty" binding:"omitempty,max=255"`
    Content string   `json:"content,omitempty" binding:"omitempty,max=10000"`
    Tags    []string `json:"tags,omitempty"`
}

type CommentRequest struct {
    Content  string    `json:"content" binding:"required,min=1,max=2000"`
    ParentID *uuid.UUID `json:"parent_id,omitempty"`
}

func (h *PostsHandler) GetPublicPosts(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var posts []models.Post
    query := h.db.DB.Model(&models.Post{}).
        Where("type = ? AND is_active = true AND moderation_status = ?", 
            models.PostFree, models.ModerationApproved).
        Where("published_at IS NOT NULL AND published_at <= ?", time.Now()).
        Preload("User").
        Order("published_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get posts with pagination
    if err := query.Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch posts",
            "code":  "POSTS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "posts": h.formatPostsResponse(posts),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PostsHandler) GetPost(c *gin.Context) {
    postID := c.Param("id")
    
    var post models.Post
    if err := h.db.DB.Where("id = ? AND is_active = true", postID).
        Preload("User").
        Preload("Comments", func(db *gorm.DB) *gorm.DB {
            return db.Where("parent_id IS NULL").Order("created_at DESC").Limit(10)
        }).
        Preload("Comments.User").
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Check access permissions
    var userID *uuid.UUID
    if claims, exists := middleware.GetCurrentUser(c); exists {
        userID = &claims.UserID
    }

    if !h.canAccessPost(&post, userID) {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Access denied",
            "code":  "ACCESS_DENIED",
            "requires_subscription": post.Type == models.PostSubscriptionOnly,
            "requires_purchase": post.Type == models.PostPPV,
            "price": post.Price,
        })
        return
    }

    // Increment view count
    post.IncrementViews()
    h.db.DB.Save(&post)

    c.JSON(http.StatusOK, gin.H{
        "post": h.formatPostResponse(&post),
    })
}

func (h *PostsHandler) GetUserFeed(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    // Get posts from followed creators and own posts
    var posts []models.Post
    query := h.db.DB.Model(&models.Post{}).
        Joins("JOIN users ON posts.user_id = users.id").
        Where("posts.is_active = true AND posts.moderation_status = ?", models.ModerationApproved).
        Where("posts.published_at IS NOT NULL AND posts.published_at <= ?", time.Now()).
        Where(`(posts.user_id = ? OR posts.user_id IN 
            (SELECT following_id FROM follows WHERE follower_id = ?))`, 
            claims.UserID, claims.UserID).
        Preload("User").
        Order("posts.published_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get posts with pagination
    if err := query.Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch feed",
            "code":  "FEED_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "posts": h.formatPostsResponse(posts),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PostsHandler) CreatePost(c *gin.Context) {
    var req CreatePostRequest
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
            "error": "Not authorized to create posts",
            "code":  "NOT_AUTHORIZED",
        })
        return
    }

    // Validate PPV price
    if req.Type == "ppv" && (req.Price == nil || *req.Price <= 0) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "PPV posts require a price",
            "code":  "PRICE_REQUIRED",
        })
        return
    }

    // Create post
    post := models.Post{
        UserID:    claims.UserID,
        Title:     &req.Title,
        Content:   &req.Content,
        Type:      models.PostType(req.Type),
        Price:     req.Price,
        MediaURLs: pq.StringArray(req.MediaURLs),
        Tags:      pq.StringArray(req.Tags),
        IsActive:  true,
    }

    // Set moderation status based on user verification
    if user.IsVerified {
        post.ModerationStatus = models.ModerationApproved
    } else {
        post.ModerationStatus = models.ModerationPending
    }

    // Handle scheduling
    if req.ScheduledAt != nil {
        if req.ScheduledAt.Before(time.Now()) {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "Scheduled time must be in the future",
                "code":  "INVALID_SCHEDULE_TIME",
            })
            return
        }
        post.ScheduledAt = req.ScheduledAt
    } else {
        // Publish immediately if approved
        if post.ModerationStatus == models.ModerationApproved {
            now := time.Now()
            post.PublishedAt = &now
        }
    }

    if err := h.db.DB.Create(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create post",
            "code":  "POST_CREATION_ERROR",
        })
        return
    }

    // Update user post count
    user.IncrementPosts()
    h.db.DB.Save(&user)

    // Load the created post with relationships
    h.db.DB.Preload("User").First(&post, post.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Post created successfully",
        "post":    h.formatPostResponse(&post),
    })
}

func (h *PostsHandler) UpdatePost(c *gin.Context) {
    var req UpdatePostRequest
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
    postID := c.Param("id")

    var post models.Post
    if err := h.db.DB.Where("id = ? AND user_id = ?", postID, claims.UserID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Update fields
    if req.Title != "" {
        post.Title = &req.Title
    }
    if req.Content != "" {
        post.Content = &req.Content
    }
    if len(req.Tags) > 0 {
        post.Tags = pq.StringArray(req.Tags)
    }

    post.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update post",
            "code":  "POST_UPDATE_ERROR",
        })
        return
    }

    // Load updated post with relationships
    h.db.DB.Preload("User").First(&post, post.ID)

    c.JSON(http.StatusOK, gin.H{
        "message": "Post updated successfully",
        "post":    h.formatPostResponse(&post),
    })
}

func (h *PostsHandler) DeletePost(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    postID := c.Param("id")

    var post models.Post
    if err := h.db.DB.Where("id = ? AND user_id = ?", postID, claims.UserID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Soft delete
    post.IsActive = false
    if err := h.db.DB.Save(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to delete post",
            "code":  "POST_DELETE_ERROR",
        })
        return
    }

    // Update user post count
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err == nil {
        user.DecrementPosts()
        h.db.DB.Save(&user)
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Post deleted successfully",
    })
}

func (h *PostsHandler) LikePost(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    postID := c.Param("id")

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    // Check if post exists
    var post models.Post
    if err := h.db.DB.Where("id = ? AND is_active = true", postUUID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Check if already liked
    var existingLike models.Like
    err = h.db.DB.Where("user_id = ? AND post_id = ?", claims.UserID, postUUID).
        First(&existingLike).Error
    
    if err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Post already liked",
            "code":  "ALREADY_LIKED",
        })
        return
    }

    // Create like
    like := models.Like{
        UserID: claims.UserID,
        PostID: &postUUID,
    }

    if err := h.db.DB.Create(&like).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to like post",
            "code":  "LIKE_ERROR",
        })
        return
    }

    // Update post like count
    post.IncrementLikes()
    h.db.DB.Save(&post)

    c.JSON(http.StatusOK, gin.H{
        "message":    "Post liked successfully",
        "like_count": post.LikeCount,
    })
}

func (h *PostsHandler) UnlikePost(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    postID := c.Param("id")

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    // Delete like
    result := h.db.DB.Where("user_id = ? AND post_id = ?", claims.UserID, postUUID).
        Delete(&models.Like{})

    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to unlike post",
            "code":  "UNLIKE_ERROR",
        })
        return
    }

    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Like not found",
            "code":  "LIKE_NOT_FOUND",
        })
        return
    }

    // Update post like count
    var post models.Post
    if err := h.db.DB.First(&post, postUUID).Error; err == nil {
        post.DecrementLikes()
        h.db.DB.Save(&post)
    }

    c.JSON(http.StatusOK, gin.H{
        "message":    "Post unliked successfully",
        "like_count": post.LikeCount,
    })
}

func (h *PostsHandler) CommentOnPost(c *gin.Context) {
    var req CommentRequest
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
    postID := c.Param("id")

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    // Check if post exists
    var post models.Post
    if err := h.db.DB.Where("id = ? AND is_active = true", postUUID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Validate parent comment if specified
    if req.ParentID != nil {
        var parentComment models.Comment
        if err := h.db.DB.Where("id = ? AND post_id = ?", req.ParentID, postUUID).
            First(&parentComment).Error; err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "Parent comment not found",
                "code":  "PARENT_COMMENT_NOT_FOUND",
            })
            return
        }
    }

    // Create comment
    comment := models.Comment{
        UserID:  claims.UserID,
        PostID:  &postUUID,
        ParentID: req.ParentID,
        Content: req.Content,
        ModerationStatus: models.ModerationApproved, // Comments auto-approved for now
    }

    if err := h.db.DB.Create(&comment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create comment",
            "code":  "COMMENT_CREATION_ERROR",
        })
        return
    }

    // Update post comment count
    post.IncrementComments()
    h.db.DB.Save(&post)

    // Update parent comment reply count if applicable
    if req.ParentID != nil {
        h.db.DB.Model(&models.Comment{}).Where("id = ?", req.ParentID).
            Update("reply_count", gorm.Expr("reply_count + 1"))
    }

    // Load comment with user
    h.db.DB.Preload("User").First(&comment, comment.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Comment created successfully",
        "comment": h.formatCommentResponse(&comment),
    })
}

func (h *PostsHandler) GetPostComments(c *gin.Context) {
    postID := c.Param("id")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    var comments []models.Comment
    query := h.db.DB.Model(&models.Comment{}).
        Where("post_id = ? AND parent_id IS NULL", postUUID).
        Where("moderation_status = ?", models.ModerationApproved).
        Preload("User").
        Preload("Replies", func(db *gorm.DB) *gorm.DB {
            return db.Preload("User").Order("created_at ASC").Limit(3)
        }).
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

func (h *PostsHandler) SharePost(c *gin.Context) {
    postID := c.Param("id")

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    // Check if post exists
    var post models.Post
    if err := h.db.DB.Where("id = ? AND is_active = true", postUUID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // Update share count
    post.IncrementShares()
    h.db.DB.Save(&post)

    // TODO: Create share activity/notification

    c.JSON(http.StatusOK, gin.H{
        "message":     "Post shared successfully",
        "share_count": post.ShareCount,
    })
}

func (h *PostsHandler) ReportPost(c *gin.Context) {
    type ReportRequest struct {
        Reason      string `json:"reason" binding:"required,max=255"`
        Description string `json:"description,omitempty" binding:"max=1000"`
    }

    var req ReportRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    postID := c.Param("id")

    postUUID, err := uuid.Parse(postID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid post ID",
            "code":  "INVALID_POST_ID",
        })
        return
    }

    // Check if post exists
    var post models.Post
    if err := h.db.DB.Where("id = ? AND is_active = true", postUUID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    // TODO: Create content report record
    // For now, just acknowledge the report

    c.JSON(http.StatusOK, gin.H{
        "message": "Post reported successfully. Thank you for helping keep our community safe.",
    })
}

// Creator-specific handlers

func (h *PostsHandler) GetCreatorContent(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    status := c.DefaultQuery("status", "all") // all, published, draft, scheduled
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var posts []models.Post
    query := h.db.DB.Model(&models.Post{}).
        Where("user_id = ?", claims.UserID).
        Preload("User")

    // Filter by status
    switch status {
    case "published":
        query = query.Where("published_at IS NOT NULL AND published_at <= ?", time.Now())
    case "draft":
        query = query.Where("published_at IS NULL AND scheduled_at IS NULL")
    case "scheduled":
        query = query.Where("scheduled_at IS NOT NULL AND scheduled_at > ?", time.Now())
    }

    query = query.Order("created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get posts with pagination
    if err := query.Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch creator content",
            "code":  "CONTENT_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "posts": h.formatPostsResponse(posts),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PostsHandler) GetScheduledContent(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var posts []models.Post
    if err := h.db.DB.Where("user_id = ? AND scheduled_at IS NOT NULL AND scheduled_at > ?", 
        claims.UserID, time.Now()).
        Preload("User").
        Order("scheduled_at ASC").
        Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch scheduled content",
            "code":  "SCHEDULED_CONTENT_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "posts": h.formatPostsResponse(posts),
    })
}

func (h *PostsHandler) ScheduleContent(c *gin.Context) {
    type ScheduleRequest struct {
        PostID      string    `json:"post_id" binding:"required"`
        ScheduledAt time.Time `json:"scheduled_at" binding:"required"`
    }

    var req ScheduleRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    if req.ScheduledAt.Before(time.Now()) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Scheduled time must be in the future",
            "code":  "INVALID_SCHEDULE_TIME",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)

    var post models.Post
    if err := h.db.DB.Where("id = ? AND user_id = ?", req.PostID, claims.UserID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    post.ScheduledAt = &req.ScheduledAt
    post.PublishedAt = nil // Clear published_at if set

    if err := h.db.DB.Save(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to schedule post",
            "code":  "SCHEDULE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Post scheduled successfully",
        "post":    h.formatPostResponse(&post),
    })
}

func (h *PostsHandler) PublishContent(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    postID := c.Param("id")

    var post models.Post
    if err := h.db.DB.Where("id = ? AND user_id = ?", postID, claims.UserID).
        First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Post not found",
            "code":  "POST_NOT_FOUND",
        })
        return
    }

    if post.PublishedAt != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Post is already published",
            "code":  "ALREADY_PUBLISHED",
        })
        return
    }

    // Publish the post
    now := time.Now()
    post.PublishedAt = &now
    post.ScheduledAt = nil // Clear scheduled time

    if err := h.db.DB.Save(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to publish post",
            "code":  "PUBLISH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Post published successfully",
        "post":    h.formatPostResponse(&post),
    })
}

// Vault handlers (placeholder implementations)
func (h *PostsHandler) GetVaultContent(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Vault feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) CreateVaultContent(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Vault feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) GetVaultItem(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Vault feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) UpdateVaultContent(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Vault feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) DeleteVaultContent(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Vault feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Highlights handlers (placeholder implementations)
func (h *PostsHandler) GetHighlights(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) CreateHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) GetHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) UpdateHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) DeleteHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) AddPostToHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) RemovePostFromHighlight(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Highlights feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Watermarks handlers (placeholder implementations)
func (h *PostsHandler) GetWatermarks(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Watermarks feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) CreateWatermark(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Watermarks feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) GetWatermark(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Watermarks feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) UpdateWatermark(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Watermarks feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PostsHandler) DeleteWatermark(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Watermarks feature not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Creator profile handlers
func (h *PostsHandler) GetCreatorProfile(c *gin.Context) {
    username := c.Param("username")
    
    var user models.User
    if err := h.db.DB.Where("username = ? AND is_active = true AND is_banned = false", username).
        First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Creator not found",
            "code":  "CREATOR_NOT_FOUND",
        })
        return
    }

    // Get post count
    var postCount int64
    h.db.DB.Model(&models.Post{}).
        Where("user_id = ? AND is_active = true AND published_at IS NOT NULL", user.ID).
        Count(&postCount)

    profile := gin.H{
        "id":             user.ID,
        "username":       user.Username,
        "display_name":   user.DisplayName,
        "bio":           user.Bio,
        "avatar_url":     user.AvatarURL,
        "cover_url":      user.CoverURL,
        "is_verified":    user.IsVerified,
        "followers_count": user.FollowersCount,
        "posts_count":    postCount,
        "created_at":     user.CreatedAt,
    }

    if user.Role == models.RoleCreator {
        profile["creator_status"] = user.CreatorStatus
    }

    c.JSON(http.StatusOK, gin.H{
        "creator": profile,
    })
}

func (h *PostsHandler) GetCreatorPosts(c *gin.Context) {
    username := c.Param("username")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var user models.User
    if err := h.db.DB.Where("username = ?", username).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Creator not found",
            "code":  "CREATOR_NOT_FOUND",
        })
        return
    }

    var posts []models.Post
    query := h.db.DB.Model(&models.Post{}).
        Where("user_id = ? AND is_active = true AND moderation_status = ?", 
            user.ID, models.ModerationApproved).
        Where("published_at IS NOT NULL AND published_at <= ?", time.Now()).
        Preload("User").
        Order("published_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get posts with pagination
    if err := query.Offset(offset).Limit(limit).Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch creator posts",
            "code":  "CREATOR_POSTS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "posts": h.formatPostsResponse(posts),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PostsHandler) GetCreatorHighlights(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Creator highlights not implemented",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Helper functions

func (h *PostsHandler) canAccessPost(post *models.Post, userID *uuid.UUID) bool {
    // Free posts are always accessible
    if post.Type == models.PostFree {
        return true
    }

    // Must be authenticated for paid content
    if userID == nil {
        return false
    }

    // Owner can always access their own content
    if post.UserID == *userID {
        return true
    }

    // For subscription-only content, check if user is subscribed
    if post.Type == models.PostSubscriptionOnly {
        var subscription models.Subscription
        err := h.db.DB.Where("fan_id = ? AND creator_id = ? AND status = 'active'", 
            userID, post.UserID).First(&subscription).Error
        return err == nil
    }

    // For PPV content, check if user has purchased
    if post.Type == models.PostPPV {
        var unlock models.PPVUnlock
        err := h.db.DB.Where("user_id = ? AND post_id = ?", userID, post.ID).
            First(&unlock).Error
        return err == nil
    }

    return false
}

func (h *PostsHandler) formatPostResponse(post *models.Post) gin.H {
    return gin.H{
        "id":           post.ID,
        "title":        post.Title,
        "content":      post.Content,
        "type":         post.Type,
        "price":        post.Price,
        "media_urls":   post.MediaURLs,
        "tags":         post.Tags,
        "view_count":   post.ViewCount,
        "like_count":   post.LikeCount,
        "comment_count": post.CommentCount,
        "share_count":  post.ShareCount,
        "is_pinned":    post.IsPinned,
        "is_featured":  post.IsFeatured,
        "published_at": post.PublishedAt,
        "scheduled_at": post.ScheduledAt,
        "created_at":   post.CreatedAt,
        "updated_at":   post.UpdatedAt,
        "user": gin.H{
            "id":           post.User.ID,
            "username":     post.User.Username,
            "display_name": post.User.DisplayName,
            "avatar_url":   post.User.AvatarURL,
            "is_verified":  post.User.IsVerified,
        },
    }
}

func (h *PostsHandler) formatPostsResponse(posts []models.Post) []gin.H {
    result := make([]gin.H, len(posts))
    for i, post := range posts {
        result[i] = h.formatPostResponse(&post)
    }
    return result
}

func (h *PostsHandler) formatCommentResponse(comment *models.Comment) gin.H {
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
        "replies": h.formatCommentsResponse(comment.Replies),
    }
}

func (h *PostsHandler) formatCommentsResponse(comments []models.Comment) []gin.H {
    result := make([]gin.H, len(comments))
    for i, comment := range comments {
        result[i] = h.formatCommentResponse(&comment)
    }
    return result
}

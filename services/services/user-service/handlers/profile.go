package handlers

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/utils"
    "github.com/fanzos/shared/middleware"
)

type ProfileHandler struct {
    db     *database.Database
    config *config.Config
}

func NewProfileHandler(db *database.Database, cfg *config.Config) *ProfileHandler {
    return &ProfileHandler{
        db:     db,
        config: cfg,
    }
}

type UpdateProfileRequest struct {
    DisplayName string `json:"display_name,omitempty" binding:"omitempty,min=1,max=100"`
    Bio         string `json:"bio,omitempty" binding:"omitempty,max=500"`
    Location    string `json:"location,omitempty" binding:"omitempty,max=100"`
    Language    string `json:"language,omitempty" binding:"omitempty,len=2"`
    Timezone    string `json:"timezone,omitempty" binding:"omitempty,max=50"`
}

type FollowResponse struct {
    ID          uuid.UUID `json:"id"`
    Username    string    `json:"username"`
    DisplayName *string   `json:"display_name"`
    AvatarURL   *string   `json:"avatar_url"`
    IsVerified  bool      `json:"is_verified"`
    Role        string    `json:"role"`
    FollowedAt  time.Time `json:"followed_at,omitempty"`
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "user": h.formatUserProfile(&user, true),
    })
}

func (h *ProfileHandler) GetPublicProfile(c *gin.Context) {
    userID := c.Param("userId")
    
    var user models.User
    query := h.db.DB
    
    // Check if userId is UUID or username
    if _, err := uuid.Parse(userID); err != nil {
        // It's a username
        query = query.Where("username = ?", userID)
    } else {
        // It's a UUID
        query = query.Where("id = ?", userID)
    }
    
    if err := query.First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Check if user is active
    if !user.IsActive || user.IsBanned {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Get following status if user is authenticated
    var isFollowing bool
    if claims, exists := middleware.GetCurrentUser(c); exists {
        var followRecord struct{}
        err := h.db.DB.Table("follows").
            Select("1").
            Where("follower_id = ? AND following_id = ?", claims.UserID, user.ID).
            Scan(&followRecord).Error
        isFollowing = err == nil
    }

    profile := h.formatUserProfile(&user, false)
    profile["is_following"] = isFollowing

    c.JSON(http.StatusOK, gin.H{
        "user": profile,
    })
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
    var req UpdateProfileRequest
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
    
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Update fields
    if req.DisplayName != "" {
        user.DisplayName = &req.DisplayName
    }
    if req.Bio != "" {
        user.Bio = &req.Bio
    }
    if req.Location != "" {
        user.Location = &req.Location
    }
    if req.Language != "" {
        user.Language = req.Language
    }
    if req.Timezone != "" {
        user.Timezone = &req.Timezone
    }

    user.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update profile",
            "code":  "PROFILE_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Profile updated successfully",
        "user":    h.formatUserProfile(&user, true),
    })
}

func (h *ProfileHandler) DeleteAccount(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    // For GDPR compliance, we should soft delete and anonymize data
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Anonymize user data
    anonymousName := "Deleted User"
    user.DisplayName = &anonymousName
    user.Bio = nil
    user.AvatarURL = nil
    user.CoverURL = nil
    user.Location = nil
    user.IsActive = false
    user.Email = nil
    user.Phone = nil
    
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to delete account",
            "code":  "ACCOUNT_DELETION_ERROR",
        })
        return
    }

    // Delete sessions
    h.db.DB.Where("user_id = ?", user.ID).Delete(&models.Session{})

    c.JSON(http.StatusOK, gin.H{
        "message": "Account deleted successfully",
    })
}

func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    file, header, err := c.Request.FormFile("avatar")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "No file uploaded",
            "code":  "NO_FILE_UPLOADED",
        })
        return
    }
    defer file.Close()

    // Validate file
    if err := utils.ValidateImageFile(header.Filename); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "INVALID_FILE_TYPE",
        })
        return
    }

    if err := utils.ValidateFileSize(header.Size, 5*1024*1024); err != nil { // 5MB limit
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "FILE_TOO_LARGE",
        })
        return
    }

    // TODO: Upload to S3 or similar storage service
    // For now, just return a placeholder URL
    avatarURL := "https://cdn.fanzos.com/avatars/" + claims.UserID.String() + ".jpg"

    // Update user avatar
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    user.UpdateAvatar(avatarURL)
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update avatar",
            "code":  "AVATAR_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":    "Avatar uploaded successfully",
        "avatar_url": avatarURL,
    })
}

func (h *ProfileHandler) UploadCover(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    file, header, err := c.Request.FormFile("cover")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "No file uploaded",
            "code":  "NO_FILE_UPLOADED",
        })
        return
    }
    defer file.Close()

    // Validate file
    if err := utils.ValidateImageFile(header.Filename); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "INVALID_FILE_TYPE",
        })
        return
    }

    if err := utils.ValidateFileSize(header.Size, 10*1024*1024); err != nil { // 10MB limit
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "FILE_TOO_LARGE",
        })
        return
    }

    // TODO: Upload to S3 or similar storage service
    coverURL := "https://cdn.fanzos.com/covers/" + claims.UserID.String() + ".jpg"

    // Update user cover
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    user.UpdateCover(coverURL)
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update cover",
            "code":  "COVER_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":   "Cover uploaded successfully",
        "cover_url": coverURL,
    })
}

func (h *ProfileHandler) FollowUser(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    targetUserID := c.Param("userId")

    // Parse target user ID
    targetUUID, err := uuid.Parse(targetUserID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid user ID",
            "code":  "INVALID_USER_ID",
        })
        return
    }

    // Check if trying to follow themselves
    if claims.UserID == targetUUID {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Cannot follow yourself",
            "code":  "CANNOT_FOLLOW_SELF",
        })
        return
    }

    // Check if target user exists and is active
    var targetUser models.User
    if err := h.db.DB.Where("id = ? AND is_active = true AND is_banned = false", targetUUID).First(&targetUser).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Check if already following
    var existingFollow struct{}
    err = h.db.DB.Table("follows").
        Select("1").
        Where("follower_id = ? AND following_id = ?", claims.UserID, targetUUID).
        Scan(&existingFollow).Error
    
    if err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Already following this user",
            "code":  "ALREADY_FOLLOWING",
        })
        return
    }

    // Create follow relationship
    follow := map[string]interface{}{
        "id":           uuid.New(),
        "follower_id":  claims.UserID,
        "following_id": targetUUID,
        "created_at":   time.Now(),
    }

    if err := h.db.DB.Table("follows").Create(&follow).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to follow user",
            "code":  "FOLLOW_ERROR",
        })
        return
    }

    // Update follower/following counts
    h.db.DB.Model(&models.User{}).Where("id = ?", claims.UserID).Update("following_count", gorm.Expr("following_count + 1"))
    h.db.DB.Model(&models.User{}).Where("id = ?", targetUUID).Update("followers_count", gorm.Expr("followers_count + 1"))

    // TODO: Send notification to target user

    c.JSON(http.StatusOK, gin.H{
        "message": "Successfully followed user",
        "user": gin.H{
            "id":           targetUser.ID,
            "username":     targetUser.Username,
            "display_name": targetUser.DisplayName,
            "avatar_url":   targetUser.AvatarURL,
        },
    })
}

func (h *ProfileHandler) UnfollowUser(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    targetUserID := c.Param("userId")

    targetUUID, err := uuid.Parse(targetUserID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid user ID",
            "code":  "INVALID_USER_ID",
        })
        return
    }

    // Delete follow relationship
    result := h.db.DB.Table("follows").
        Where("follower_id = ? AND following_id = ?", claims.UserID, targetUUID).
        Delete(&map[string]interface{}{})

    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to unfollow user",
            "code":  "UNFOLLOW_ERROR",
        })
        return
    }

    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Not following this user",
            "code":  "NOT_FOLLOWING",
        })
        return
    }

    // Update follower/following counts
    h.db.DB.Model(&models.User{}).Where("id = ?", claims.UserID).Update("following_count", gorm.Expr("following_count - 1"))
    h.db.DB.Model(&models.User{}).Where("id = ?", targetUUID).Update("followers_count", gorm.Expr("followers_count - 1"))

    c.JSON(http.StatusOK, gin.H{
        "message": "Successfully unfollowed user",
    })
}

func (h *ProfileHandler) GetFollowers(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    h.getFollowList(c, claims.UserID.String(), "followers")
}

func (h *ProfileHandler) GetFollowing(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    h.getFollowList(c, claims.UserID.String(), "following")
}

func (h *ProfileHandler) GetUserFollowers(c *gin.Context) {
    userID := c.Param("userId")
    h.getFollowList(c, userID, "followers")
}

func (h *ProfileHandler) GetUserFollowing(c *gin.Context) {
    userID := c.Param("userId")
    h.getFollowList(c, userID, "following")
}

func (h *ProfileHandler) getFollowList(c *gin.Context, userID, listType string) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var users []models.User
    var total int64

    query := h.db.DB.Model(&models.User{}).
        Where("is_active = true AND is_banned = false")

    if listType == "followers" {
        query = query.
            Joins("JOIN follows ON follows.follower_id = users.id").
            Where("follows.following_id = ?", userID)
    } else {
        query = query.
            Joins("JOIN follows ON follows.following_id = users.id").
            Where("follows.follower_id = ?", userID)
    }

    // Get total count
    query.Count(&total)

    // Get users with pagination
    if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get follow list",
            "code":  "FOLLOW_LIST_ERROR",
        })
        return
    }

    followList := make([]FollowResponse, len(users))
    for i, user := range users {
        followList[i] = FollowResponse{
            ID:          user.ID,
            Username:    user.Username,
            DisplayName: user.DisplayName,
            AvatarURL:   user.AvatarURL,
            IsVerified:  user.IsVerified,
            Role:        string(user.Role),
        }
    }

    c.JSON(http.StatusOK, gin.H{
        listType: followList,
        "pagination": gin.H{
            "page":       page,
            "limit":      limit,
            "total":      total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ProfileHandler) SearchUsers(c *gin.Context) {
    query := c.Query("q")
    if query == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Search query is required",
            "code":  "SEARCH_QUERY_REQUIRED",
        })
        return
    }

    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var users []models.User
    var total int64

    searchQuery := "%" + query + "%"
    dbQuery := h.db.DB.Model(&models.User{}).
        Where("is_active = true AND is_banned = false").
        Where("username ILIKE ? OR display_name ILIKE ?", searchQuery, searchQuery)

    // Get total count
    dbQuery.Count(&total)

    // Get users with pagination
    if err := dbQuery.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Search failed",
            "code":  "SEARCH_ERROR",
        })
        return
    }

    results := make([]gin.H, len(users))
    for i, user := range users {
        results[i] = h.formatUserProfile(&user, false)
    }

    c.JSON(http.StatusOK, gin.H{
        "users": results,
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ProfileHandler) GetSuggestions(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    
    if limit < 1 || limit > 50 {
        limit = 10
    }

    var users []models.User
    
    // Simple suggestion algorithm: users not followed, active, with followers
    if err := h.db.DB.
        Where("is_active = true AND is_banned = false AND id != ?", claims.UserID).
        Where("id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)", claims.UserID).
        Order("followers_count DESC, created_at DESC").
        Limit(limit).
        Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get suggestions",
            "code":  "SUGGESTIONS_ERROR",
        })
        return
    }

    suggestions := make([]gin.H, len(users))
    for i, user := range users {
        suggestions[i] = h.formatUserProfile(&user, false)
    }

    c.JSON(http.StatusOK, gin.H{
        "suggestions": suggestions,
    })
}

// Creator-specific handlers

func (h *ProfileHandler) GetCreatorDashboard(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Get subscriber count
    var subscriberCount int64
    h.db.DB.Model(&models.Subscription{}).
        Where("creator_id = ? AND status = 'active'", claims.UserID).
        Count(&subscriberCount)

    // Get total earnings this month
    var monthlyEarnings float64
    h.db.DB.Model(&models.Transaction{}).
        Where("user_id = ? AND type IN ('subscription', 'tip', 'ppv_unlock') AND status = 'completed'", claims.UserID).
        Where("created_at >= ?", time.Now().AddDate(0, -1, 0)).
        Select("COALESCE(SUM(net_amount), 0)").
        Scan(&monthlyEarnings)

    // Get post count
    var postCount int64
    h.db.DB.Model(&models.Post{}).
        Where("user_id = ? AND is_active = true", claims.UserID).
        Count(&postCount)

    c.JSON(http.StatusOK, gin.H{
        "dashboard": gin.H{
            "subscriber_count":   subscriberCount,
            "monthly_earnings":   monthlyEarnings,
            "total_earnings":     user.EarningsTotal,
            "wallet_balance":     user.WalletBalance,
            "post_count":        postCount,
            "followers_count":   user.FollowersCount,
            "verification_status": user.IsVerified,
            "creator_status":    user.CreatorStatus,
        },
    })
}

func (h *ProfileHandler) GetCreatorAnalytics(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    // Get analytics for the last 30 days
    var analytics []models.CreatorAnalytics
    if err := h.db.DB.
        Where("creator_id = ? AND date >= ?", claims.UserID, time.Now().AddDate(0, 0, -30)).
        Order("date DESC").
        Find(&analytics).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get analytics",
            "code":  "ANALYTICS_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "analytics": analytics,
    })
}

func (h *ProfileHandler) GetSubscribers(c *gin.Context) {
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

    var subscriptions []models.Subscription
    var total int64

    query := h.db.DB.Model(&models.Subscription{}).
        Where("creator_id = ? AND status = 'active'", claims.UserID).
        Preload("Fan")

    // Get total count
    query.Count(&total)

    // Get subscriptions with pagination
    if err := query.Offset(offset).Limit(limit).Find(&subscriptions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get subscribers",
            "code":  "SUBSCRIBERS_ERROR",
        })
        return
    }

    subscribers := make([]gin.H, len(subscriptions))
    for i, sub := range subscriptions {
        subscribers[i] = gin.H{
            "id":             sub.Fan.ID,
            "username":       sub.Fan.Username,
            "display_name":   sub.Fan.DisplayName,
            "avatar_url":     sub.Fan.AvatarURL,
            "subscribed_at":  sub.CreatedAt,
            "subscription_price": sub.Price,
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "subscribers": subscribers,
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *ProfileHandler) GetEarnings(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    // Get earnings breakdown
    type EarningsBreakdown struct {
        Type   string  `json:"type"`
        Amount float64 `json:"amount"`
    }

    var earnings []EarningsBreakdown
    h.db.DB.Model(&models.Transaction{}).
        Select("type, COALESCE(SUM(net_amount), 0) as amount").
        Where("user_id = ? AND status = 'completed'", claims.UserID).
        Where("type IN ('subscription', 'tip', 'ppv_unlock')").
        Group("type").
        Scan(&earnings)

    // Get recent transactions
    var transactions []models.Transaction
    h.db.DB.Where("user_id = ?", claims.UserID).
        Where("type IN ('subscription', 'tip', 'ppv_unlock')").
        Order("created_at DESC").
        Limit(20).
        Find(&transactions)

    var user models.User
    h.db.DB.First(&user, claims.UserID)

    c.JSON(http.StatusOK, gin.H{
        "earnings_breakdown": earnings,
        "recent_transactions": transactions,
        "total_earnings": user.EarningsTotal,
        "wallet_balance": user.WalletBalance,
    })
}

func (h *ProfileHandler) PromoteToCreator(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    if user.Role == models.RoleCreator {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User is already a creator",
            "code":  "ALREADY_CREATOR",
        })
        return
    }

    // Age verification required
    if !user.IsAgeVerified {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Age verification required to become a creator",
            "code":  "AGE_VERIFICATION_REQUIRED",
        })
        return
    }

    user.PromoteToCreator()
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to promote to creator",
            "code":  "PROMOTION_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Successfully promoted to creator",
        "user": h.formatUserProfile(&user, true),
    })
}

func (h *ProfileHandler) UpdateCreatorStatus(c *gin.Context) {
    // This would typically be an admin-only function
    // Implementation depends on business requirements
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Creator status updates are handled by admin",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Helper functions

func (h *ProfileHandler) formatUserProfile(user *models.User, includePrivate bool) gin.H {
    profile := gin.H{
        "id":             user.ID,
        "username":       user.Username,
        "display_name":   user.DisplayName,
        "bio":           user.Bio,
        "avatar_url":     user.AvatarURL,
        "cover_url":      user.CoverURL,
        "role":          user.Role,
        "is_verified":    user.IsVerified,
        "location":       user.Location,
        "followers_count": user.FollowersCount,
        "following_count": user.FollowingCount,
        "posts_count":    user.PostsCount,
        "created_at":     user.CreatedAt,
    }

    if user.Role == models.RoleCreator {
        profile["creator_status"] = user.CreatorStatus
    }

    if includePrivate {
        profile["email"] = user.Email
        profile["phone"] = user.Phone
        profile["language"] = user.Language
        profile["timezone"] = user.Timezone
        profile["wallet_balance"] = user.WalletBalance
        profile["earnings_total"] = user.EarningsTotal
        profile["is_email_verified"] = user.IsEmailVerified
        profile["is_phone_verified"] = user.IsPhoneVerified
        profile["is_age_verified"] = user.IsAgeVerified
        profile["last_active_at"] = user.LastActiveAt
    }

    return profile
}

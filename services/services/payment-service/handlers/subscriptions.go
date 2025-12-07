package handlers

import (
    "fmt"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/utils"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/payment-service/processors"
)

type SubscriptionsHandler struct {
    db              *database.Database
    config          *config.Config
    stripeProcessor *processors.StripeProcessor
    ccbillProcessor *processors.CCBillProcessor
}

func NewSubscriptionsHandler(db *database.Database, cfg *config.Config, stripe *processors.StripeProcessor, ccbill *processors.CCBillProcessor) *SubscriptionsHandler {
    return &SubscriptionsHandler{
        db:              db,
        config:          cfg,
        stripeProcessor: stripe,
        ccbillProcessor: ccbill,
    }
}

type CreateSubscriptionRequest struct {
    Price        float64 `json:"price" binding:"required,min=1,max=10000"`
    BillingCycle string  `json:"billing_cycle" binding:"required,oneof=monthly yearly"`
    TrialDays    int     `json:"trial_days,omitempty" binding:"omitempty,min=0,max=90"`
    Processor    string  `json:"processor" binding:"required,oneof=stripe ccbill"`
    PaymentMethodID *uuid.UUID `json:"payment_method_id,omitempty"`
}

type UpdateSubscriptionRequest struct {
    Price        *float64 `json:"price,omitempty" binding:"omitempty,min=1,max=10000"`
    BillingCycle *string  `json:"billing_cycle,omitempty" binding:"omitempty,oneof=monthly yearly"`
    AutoRenew    *bool    `json:"auto_renew,omitempty"`
}

func (h *SubscriptionsHandler) GetSubscriptions(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    status := c.DefaultQuery("status", "")
    subscriptionType := c.DefaultQuery("type", "") // "subscriber" or "creator"
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var subscriptions []models.Subscription
    query := h.db.DB.Model(&models.Subscription{})

    // Filter by user role
    if subscriptionType == "subscriber" {
        // Get subscriptions where user is the fan
        query = query.Where("fan_id = ?", claims.UserID).Preload("Creator")
    } else if subscriptionType == "creator" {
        // Get subscriptions where user is the creator
        query = query.Where("creator_id = ?", claims.UserID).Preload("Fan")
    } else {
        // Get all subscriptions for the user (both as fan and creator)
        query = query.Where("fan_id = ? OR creator_id = ?", claims.UserID, claims.UserID).
            Preload("Fan").Preload("Creator")
    }

    // Filter by status
    if status != "" {
        query = query.Where("status = ?", status)
    }

    query = query.Order("created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get subscriptions with pagination
    if err := query.Offset(offset).Limit(limit).Find(&subscriptions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch subscriptions",
            "code":  "SUBSCRIPTIONS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "subscriptions": h.formatSubscriptionsResponse(subscriptions, claims.UserID),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *SubscriptionsHandler) CreateSubscription(c *gin.Context) {
    var req CreateSubscriptionRequest
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
    creatorID := c.Param("creatorId")

    creatorUUID, err := uuid.Parse(creatorID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid creator ID",
            "code":  "INVALID_CREATOR_ID",
        })
        return
    }

    // Validate creator exists and is active
    var creator models.User
    if err := h.db.DB.Where("id = ? AND role = ? AND is_active = true", 
        creatorUUID, models.RoleCreator).First(&creator).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Creator not found",
            "code":  "CREATOR_NOT_FOUND",
        })
        return
    }

    // Check if user is trying to subscribe to themselves
    if claims.UserID == creatorUUID {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Cannot subscribe to yourself",
            "code":  "SELF_SUBSCRIPTION_NOT_ALLOWED",
        })
        return
    }

    // Check if subscription already exists
    var existingSubscription models.Subscription
    err = h.db.DB.Where("fan_id = ? AND creator_id = ?", claims.UserID, creatorUUID).
        First(&existingSubscription).Error
    
    if err == nil {
        if existingSubscription.Status == "active" {
            c.JSON(http.StatusConflict, gin.H{
                "error": "Already subscribed to this creator",
                "code":  "ALREADY_SUBSCRIBED",
                "subscription_id": existingSubscription.ID,
            })
            return
        } else if existingSubscription.Status == "cancelled" {
            // Reactivate cancelled subscription
            h.reactivateSubscription(c, &existingSubscription, &req)
            return
        }
    }

    // Get payment method
    var paymentMethod *models.PaymentMethod
    if req.PaymentMethodID != nil {
        var pm models.PaymentMethod
        if err := h.db.DB.Where("id = ? AND user_id = ?", req.PaymentMethodID, claims.UserID).
            First(&pm).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Payment method not found",
                "code":  "PAYMENT_METHOD_NOT_FOUND",
            })
            return
        }
        paymentMethod = &pm
    } else {
        // Use default payment method
        var pm models.PaymentMethod
        if err := h.db.DB.Where("user_id = ? AND is_default = true", claims.UserID).
            First(&pm).Error; err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": "No default payment method found",
                "code":  "NO_DEFAULT_PAYMENT_METHOD",
            })
            return
        }
        paymentMethod = &pm
    }

    // Calculate subscription period
    currentTime := time.Now()
    var periodEnd time.Time
    
    switch req.BillingCycle {
    case "monthly":
        periodEnd = currentTime.AddDate(0, 1, 0)
    case "yearly":
        periodEnd = currentTime.AddDate(1, 0, 0)
    }

    // Handle trial period
    var trialEnd *time.Time
    if req.TrialDays > 0 {
        trial := currentTime.AddDate(0, 0, req.TrialDays)
        trialEnd = &trial
        // Extend period end by trial days
        periodEnd = periodEnd.AddDate(0, 0, req.TrialDays)
    }

    // Create subscription record
    subscription := models.Subscription{
        FanID:              claims.UserID,
        CreatorID:          creatorUUID,
        Status:             "active",
        Price:              req.Price,
        BillingCycle:       req.BillingCycle,
        CurrentPeriodStart: &currentTime,
        CurrentPeriodEnd:   &periodEnd,
        TrialEnd:           trialEnd,
        AutoRenew:          true,
    }

    // Create subscription with payment processor
    switch req.Processor {
    case "stripe":
        stripeSubID, err := h.stripeProcessor.CreateSubscription(claims.UserID, creatorUUID, req.Price, req.BillingCycle, paymentMethod)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "STRIPE_SUBSCRIPTION_ERROR",
            })
            return
        }
        subscription.StripeSubscriptionID = &stripeSubID
        
    case "ccbill":
        ccbillSubID, err := h.ccbillProcessor.CreateSubscription(claims.UserID, creatorUUID, req.Price, req.BillingCycle)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "CCBILL_SUBSCRIPTION_ERROR",
            })
            return
        }
        subscription.CCBillSubscriptionID = &ccbillSubID
    }

    if err := h.db.DB.Create(&subscription).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create subscription",
            "code":  "SUBSCRIPTION_CREATION_ERROR",
        })
        return
    }

    // Create initial transaction if not in trial
    if req.TrialDays == 0 {
        h.createSubscriptionTransaction(&subscription, paymentMethod)
    }

    // Load subscription with relationships
    h.db.DB.Preload("Fan").Preload("Creator").First(&subscription, subscription.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Subscription created successfully",
        "subscription": h.formatSubscriptionResponse(&subscription, claims.UserID),
    })
}

func (h *SubscriptionsHandler) GetSubscription(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    subscriptionID := c.Param("id")

    var subscription models.Subscription
    if err := h.db.DB.Where("id = ? AND (fan_id = ? OR creator_id = ?)", 
        subscriptionID, claims.UserID, claims.UserID).
        Preload("Fan").Preload("Creator").
        First(&subscription).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Subscription not found",
            "code":  "SUBSCRIPTION_NOT_FOUND",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "subscription": h.formatSubscriptionResponse(&subscription, claims.UserID),
    })
}

func (h *SubscriptionsHandler) UpdateSubscription(c *gin.Context) {
    var req UpdateSubscriptionRequest
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
    subscriptionID := c.Param("id")

    var subscription models.Subscription
    if err := h.db.DB.Where("id = ? AND fan_id = ?", subscriptionID, claims.UserID).
        First(&subscription).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Subscription not found",
            "code":  "SUBSCRIPTION_NOT_FOUND",
        })
        return
    }

    // Update fields
    if req.Price != nil {
        subscription.Price = *req.Price
    }
    if req.BillingCycle != nil {
        subscription.BillingCycle = *req.BillingCycle
    }
    if req.AutoRenew != nil {
        subscription.AutoRenew = *req.AutoRenew
    }

    subscription.UpdatedAt = time.Now()

    // Update with payment processor
    if subscription.StripeSubscriptionID != nil {
        if err := h.stripeProcessor.UpdateSubscription(*subscription.StripeSubscriptionID, req.Price, req.BillingCycle); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "STRIPE_UPDATE_ERROR",
            })
            return
        }
    } else if subscription.CCBillSubscriptionID != nil {
        if err := h.ccbillProcessor.UpdateSubscription(*subscription.CCBillSubscriptionID, req.Price, req.BillingCycle); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "CCBILL_UPDATE_ERROR",
            })
            return
        }
    }

    if err := h.db.DB.Save(&subscription).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update subscription",
            "code":  "SUBSCRIPTION_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Subscription updated successfully",
        "subscription": h.formatSubscriptionResponse(&subscription, claims.UserID),
    })
}

func (h *SubscriptionsHandler) CancelSubscription(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    subscriptionID := c.Param("id")

    type CancelRequest struct {
        Reason     string `json:"reason,omitempty" binding:"max=255"`
        CancelNow  bool   `json:"cancel_now,omitempty"`
    }

    var req CancelRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    var subscription models.Subscription
    if err := h.db.DB.Where("id = ? AND fan_id = ?", subscriptionID, claims.UserID).
        First(&subscription).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Subscription not found",
            "code":  "SUBSCRIPTION_NOT_FOUND",
        })
        return
    }

    if subscription.Status != "active" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Subscription is not active",
            "code":  "SUBSCRIPTION_NOT_ACTIVE",
        })
        return
    }

    // Cancel with payment processor
    if subscription.StripeSubscriptionID != nil {
        if err := h.stripeProcessor.CancelSubscription(*subscription.StripeSubscriptionID, req.CancelNow); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "STRIPE_CANCEL_ERROR",
            })
            return
        }
    } else if subscription.CCBillSubscriptionID != nil {
        if err := h.ccbillProcessor.CancelSubscription(*subscription.CCBillSubscriptionID); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "CCBILL_CANCEL_ERROR",
            })
            return
        }
    }

    // Update subscription status
    if req.CancelNow {
        subscription.Status = "cancelled"
        subscription.CurrentPeriodEnd = &time.Time{}
        *subscription.CurrentPeriodEnd = time.Now()
    } else {
        subscription.AutoRenew = false
        // Subscription remains active until current period ends
    }

    subscription.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&subscription).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to cancel subscription",
            "code":  "SUBSCRIPTION_CANCEL_ERROR",
        })
        return
    }

    message := "Subscription cancelled successfully"
    if !req.CancelNow {
        message = "Subscription will be cancelled at the end of the current billing period"
    }

    c.JSON(http.StatusOK, gin.H{
        "message": message,
        "subscription": h.formatSubscriptionResponse(&subscription, claims.UserID),
    })
}

func (h *SubscriptionsHandler) ReactivateSubscription(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    subscriptionID := c.Param("id")

    var subscription models.Subscription
    if err := h.db.DB.Where("id = ? AND fan_id = ?", subscriptionID, claims.UserID).
        First(&subscription).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Subscription not found",
            "code":  "SUBSCRIPTION_NOT_FOUND",
        })
        return
    }

    if subscription.Status == "active" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Subscription is already active",
            "code":  "SUBSCRIPTION_ALREADY_ACTIVE",
        })
        return
    }

    // Reactivate with payment processor
    if subscription.StripeSubscriptionID != nil {
        if err := h.stripeProcessor.ReactivateSubscription(*subscription.StripeSubscriptionID); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "STRIPE_REACTIVATE_ERROR",
            })
            return
        }
    }

    // Update subscription
    subscription.Status = "active"
    subscription.AutoRenew = true
    
    // Extend period
    currentTime := time.Now()
    var periodEnd time.Time
    
    switch subscription.BillingCycle {
    case "monthly":
        periodEnd = currentTime.AddDate(0, 1, 0)
    case "yearly":
        periodEnd = currentTime.AddDate(1, 0, 0)
    }

    subscription.CurrentPeriodStart = &currentTime
    subscription.CurrentPeriodEnd = &periodEnd
    subscription.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&subscription).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to reactivate subscription",
            "code":  "SUBSCRIPTION_REACTIVATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Subscription reactivated successfully",
        "subscription": h.formatSubscriptionResponse(&subscription, claims.UserID),
    })
}

func (h *SubscriptionsHandler) GetSubscriptionStatus(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    subscriptionID := c.Param("id")

    var subscription models.Subscription
    if err := h.db.DB.Where("id = ? AND (fan_id = ? OR creator_id = ?)", 
        subscriptionID, claims.UserID, claims.UserID).
        First(&subscription).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Subscription not found",
            "code":  "SUBSCRIPTION_NOT_FOUND",
        })
        return
    }

    status := gin.H{
        "id":           subscription.ID,
        "status":       subscription.Status,
        "is_active":    subscription.IsActive(),
        "auto_renew":   subscription.AutoRenew,
        "days_remaining": subscription.DaysUntilRenewal(),
    }

    if subscription.TrialEnd != nil {
        status["is_in_trial"] = subscription.IsInTrial()
        status["trial_end"] = subscription.TrialEnd
    }

    if subscription.CurrentPeriodEnd != nil {
        status["current_period_end"] = subscription.CurrentPeriodEnd
    }

    c.JSON(http.StatusOK, gin.H{
        "subscription_status": status,
    })
}

// Helper functions

func (h *SubscriptionsHandler) reactivateSubscription(c *gin.Context, subscription *models.Subscription, req *CreateSubscriptionRequest) {
    // Update existing subscription
    subscription.Status = "active"
    subscription.Price = req.Price
    subscription.BillingCycle = req.BillingCycle
    subscription.AutoRenew = true

    // Update period
    currentTime := time.Now()
    var periodEnd time.Time
    
    switch req.BillingCycle {
    case "monthly":
        periodEnd = currentTime.AddDate(0, 1, 0)
    case "yearly":
        periodEnd = currentTime.AddDate(1, 0, 0)
    }

    subscription.CurrentPeriodStart = &currentTime
    subscription.CurrentPeriodEnd = &periodEnd
    subscription.UpdatedAt = time.Now()

    // Handle trial period
    if req.TrialDays > 0 {
        trial := currentTime.AddDate(0, 0, req.TrialDays)
        subscription.TrialEnd = &trial
        periodEnd = periodEnd.AddDate(0, 0, req.TrialDays)
        subscription.CurrentPeriodEnd = &periodEnd
    }

    if err := h.db.DB.Save(subscription).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to reactivate subscription",
            "code":  "SUBSCRIPTION_REACTIVATE_ERROR",
        })
        return
    }

    // Load subscription with relationships
    h.db.DB.Preload("Fan").Preload("Creator").First(subscription, subscription.ID)

    c.JSON(http.StatusOK, gin.H{
        "message": "Subscription reactivated successfully",
        "subscription": h.formatSubscriptionResponse(subscription, subscription.FanID),
    })
}

func (h *SubscriptionsHandler) createSubscriptionTransaction(subscription *models.Subscription, paymentMethod *models.PaymentMethod) {
    // Calculate fees
    platformFeeRate := 0.10 // 10% platform fee
    paymentProcessorFee := subscription.Price * 0.029 // ~2.9% for credit cards
    platformFee := subscription.Price * platformFeeRate
    netAmount := subscription.Price - platformFee - paymentProcessorFee

    // Create transaction
    transaction := models.Transaction{
        UserID:      subscription.FanID,
        Type:        models.TransactionSubscription,
        Amount:      subscription.Price,
        Currency:    "USD",
        Status:      "completed",
        Description: &[]string{fmt.Sprintf("Subscription payment - %s", subscription.BillingCycle)}[0],
        Processor:   &paymentMethod.Processor,
        FeeAmount:   platformFee + paymentProcessorFee,
        NetAmount:   &netAmount,
        Metadata: map[string]interface{}{
            "subscription_id": subscription.ID,
            "creator_id":      subscription.CreatorID,
            "billing_cycle":   subscription.BillingCycle,
        },
    }

    h.db.DB.Create(&transaction)

    // Update creator earnings
    var creator models.User
    if err := h.db.DB.First(&creator, subscription.CreatorID).Error; err == nil {
        creator.AddToWallet(netAmount)
        creator.AddEarnings(netAmount)
        h.db.DB.Save(&creator)
    }

    // Create revenue share record
    revenueShare := models.RevenueShare{
        CreatorID:           subscription.CreatorID,
        TransactionID:       transaction.ID,
        GrossAmount:         subscription.Price,
        PlatformFeeRate:     platformFeeRate,
        PlatformFeeAmount:   platformFee,
        PaymentProcessorFee: paymentProcessorFee,
        NetAmount:           netAmount,
    }
    h.db.DB.Create(&revenueShare)
}

func (h *SubscriptionsHandler) formatSubscriptionResponse(subscription *models.Subscription, currentUserID uuid.UUID) gin.H {
    response := gin.H{
        "id":                  subscription.ID,
        "status":              subscription.Status,
        "price":               subscription.Price,
        "billing_cycle":       subscription.BillingCycle,
        "current_period_start": subscription.CurrentPeriodStart,
        "current_period_end":   subscription.CurrentPeriodEnd,
        "trial_end":           subscription.TrialEnd,
        "auto_renew":          subscription.AutoRenew,
        "is_active":           subscription.IsActive(),
        "days_until_renewal":  subscription.DaysUntilRenewal(),
        "created_at":          subscription.CreatedAt,
        "updated_at":          subscription.UpdatedAt,
    }

    // Add user info based on perspective
    if subscription.FanID == currentUserID {
        // User is the subscriber, show creator info
        response["creator"] = gin.H{
            "id":           subscription.Creator.ID,
            "username":     subscription.Creator.Username,
            "display_name": subscription.Creator.DisplayName,
            "avatar_url":   subscription.Creator.AvatarURL,
            "is_verified":  subscription.Creator.IsVerified,
        }
    } else if subscription.CreatorID == currentUserID {
        // User is the creator, show fan info
        response["fan"] = gin.H{
            "id":           subscription.Fan.ID,
            "username":     subscription.Fan.Username,
            "display_name": subscription.Fan.DisplayName,
            "avatar_url":   subscription.Fan.AvatarURL,
        }
    }

    if subscription.TrialEnd != nil {
        response["is_in_trial"] = subscription.IsInTrial()
    }

    return response
}

func (h *SubscriptionsHandler) formatSubscriptionsResponse(subscriptions []models.Subscription, currentUserID uuid.UUID) []gin.H {
    result := make([]gin.H, len(subscriptions))
    for i, subscription := range subscriptions {
        result[i] = h.formatSubscriptionResponse(&subscription, currentUserID)
    }
    return result
}

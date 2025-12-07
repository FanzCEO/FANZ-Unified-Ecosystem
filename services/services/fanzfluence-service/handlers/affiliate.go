package handlers

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/fanzos/shared/auth"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/middleware"
    "github.com/fanzos/shared/models"
    "gorm.io/gorm"
)

type AffiliateHandler struct {
    db         *database.Database
    jwtManager *auth.JWTManager
}

func NewAffiliateHandler(db *database.Database, jwtManager *auth.JWTManager) *AffiliateHandler {
    return &AffiliateHandler{
        db:         db,
        jwtManager: jwtManager,
    }
}

func (h *AffiliateHandler) RegisterAffiliate(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var req struct {
        MarketingChannel string `json:"marketing_channel" binding:"required"`
        PromoStrategy    string `json:"promo_strategy"`
        TargetAudience   string `json:"target_audience"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    affiliate := models.Affiliate{
        ID:               uuid.New(),
        UserID:           claims.UserID,
        AffiliateCode:    generateAffiliateCode(),
        MarketingChannel: req.MarketingChannel,
        PromoStrategy:    &req.PromoStrategy,
        TargetAudience:   &req.TargetAudience,
        Status:           "active",
        CreatedAt:        time.Now(),
    }
    
    if err := h.db.DB.Create(&affiliate).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register affiliate"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "message": "Successfully registered as affiliate",
        "affiliate": affiliate,
    })
}

func (h *AffiliateHandler) GetDashboard(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    var stats struct {
        TotalClicks      int64   `json:"total_clicks"`
        TotalConversions int64   `json:"total_conversions"`
        TotalEarnings    float64 `json:"total_earnings"`
        PendingPayout    float64 `json:"pending_payout"`
        ConversionRate   float64 `json:"conversion_rate"`
    }
    
    h.db.DB.Model(&models.AffiliateClick{}).Where("affiliate_id = ?", affiliate.ID).Count(&stats.TotalClicks)
    h.db.DB.Model(&models.AffiliateConversion{}).Where("affiliate_id = ?", affiliate.ID).Count(&stats.TotalConversions)
    
    if stats.TotalClicks > 0 {
        stats.ConversionRate = float64(stats.TotalConversions) / float64(stats.TotalClicks) * 100
    }
    
    c.JSON(http.StatusOK, gin.H{
        "affiliate": affiliate,
        "stats":     stats,
    })
}

func (h *AffiliateHandler) GetAffiliateLinks(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    var links []models.AffiliateLink
    if err := h.db.DB.Where("affiliate_id = ?", affiliate.ID).Find(&links).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch links"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"links": links})
}

func (h *AffiliateHandler) CreateAffiliateLink(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var req struct {
        TargetURL   string `json:"target_url" binding:"required,url"`
        Campaign    string `json:"campaign"`
        Description string `json:"description"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    link := models.AffiliateLink{
        ID:          uuid.New(),
        AffiliateID: affiliate.ID,
        LinkCode:    generateLinkCode(),
        TargetURL:   req.TargetURL,
        Campaign:    &req.Campaign,
        Description: &req.Description,
        CreatedAt:   time.Now(),
    }
    
    if err := h.db.DB.Create(&link).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "link": link,
        "tracking_url": "/track/" + link.LinkCode,
    })
}

func (h *AffiliateHandler) GetLinkStats(c *gin.Context) {
    code := c.Param("code")
    claims, _ := middleware.GetCurrentUser(c)
    
    var link models.AffiliateLink
    if err := h.db.DB.Joins("JOIN affiliates ON affiliates.id = affiliate_links.affiliate_id").
        Where("affiliate_links.link_code = ? AND affiliates.user_id = ?", code, claims.UserID).
        First(&link).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
        return
    }
    
    var stats struct {
        Clicks      int64 `json:"clicks"`
        Conversions int64 `json:"conversions"`
    }
    
    h.db.DB.Model(&models.AffiliateClick{}).Where("link_id = ?", link.ID).Count(&stats.Clicks)
    h.db.DB.Model(&models.AffiliateConversion{}).Where("link_id = ?", link.ID).Count(&stats.Conversions)
    
    c.JSON(http.StatusOK, gin.H{
        "link":  link,
        "stats": stats,
    })
}

func (h *AffiliateHandler) DeleteLink(c *gin.Context) {
    code := c.Param("code")
    claims, _ := middleware.GetCurrentUser(c)
    
    result := h.db.DB.
        Where("link_code = ?", code).
        Where("affiliate_id IN (SELECT id FROM affiliates WHERE user_id = ?)", claims.UserID).
        Delete(&models.AffiliateLink{})
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
        return
    }
    
    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Link deleted successfully"})
}

func (h *AffiliateHandler) GetReferrals(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    var referrals []models.AffiliateReferral
    if err := h.db.DB.Where("affiliate_id = ?", affiliate.ID).
        Preload("ReferredUser").
        Order("created_at DESC").
        Find(&referrals).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch referrals"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"referrals": referrals})
}

func (h *AffiliateHandler) GetCommissions(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    var commissions []models.AffiliateCommission
    if err := h.db.DB.Where("affiliate_id = ?", affiliate.ID).
        Order("created_at DESC").
        Find(&commissions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch commissions"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"commissions": commissions})
}

func (h *AffiliateHandler) RequestPayout(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var req struct {
        Amount        float64 `json:"amount" binding:"required,min=10"`
        PayoutMethod  string  `json:"payout_method" binding:"required"`
        AccountInfo   string  `json:"account_info" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    payout := models.AffiliatePayout{
        ID:           uuid.New(),
        AffiliateID:  affiliate.ID,
        Amount:       req.Amount,
        PayoutMethod: req.PayoutMethod,
        AccountInfo:  req.AccountInfo,
        Status:       "pending",
        RequestedAt:  time.Now(),
    }
    
    if err := h.db.DB.Create(&payout).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request payout"})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "message": "Payout requested successfully",
        "payout":  payout,
    })
}

func (h *AffiliateHandler) GetPayoutHistory(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    var payouts []models.AffiliatePayout
    if err := h.db.DB.Where("affiliate_id = ?", affiliate.ID).
        Order("requested_at DESC").
        Find(&payouts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payout history"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"payouts": payouts})
}

func (h *AffiliateHandler) GetAnalytics(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    period := c.DefaultQuery("period", "30d")
    
    var affiliate models.Affiliate
    if err := h.db.DB.Where("user_id = ?", claims.UserID).First(&affiliate).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate account not found"})
        return
    }
    
    analytics := gin.H{
        "period": period,
        "performance": gin.H{
            "clicks":      0,
            "conversions": 0,
            "earnings":    0.0,
        },
    }
    
    c.JSON(http.StatusOK, analytics)
}

func (h *AffiliateHandler) UpdateAffiliateSettings(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var req struct {
        MarketingChannel string `json:"marketing_channel"`
        PromoStrategy    string `json:"promo_strategy"`
        TargetAudience   string `json:"target_audience"`
        PayoutPreference string `json:"payout_preference"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    result := h.db.DB.Model(&models.Affiliate{}).
        Where("user_id = ?", claims.UserID).
        Updates(map[string]interface{}{
            "marketing_channel": req.MarketingChannel,
            "promo_strategy":    req.PromoStrategy,
            "target_audience":   req.TargetAudience,
            "updated_at":        time.Now(),
        })
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
}

func (h *AffiliateHandler) TrackClick(c *gin.Context) {
    code := c.Param("code")
    
    var link models.AffiliateLink
    if err := h.db.DB.Where("link_code = ?", code).First(&link).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Invalid tracking code"})
        return
    }
    
    click := models.AffiliateClick{
        ID:          uuid.New(),
        AffiliateID: link.AffiliateID,
        LinkID:      &link.ID,
        IPAddress:   c.ClientIP(),
        UserAgent:   c.GetHeader("User-Agent"),
        Referer:     c.GetHeader("Referer"),
        ClickedAt:   time.Now(),
    }
    
    h.db.DB.Create(&click)
    h.db.DB.Model(&link).Update("clicks", gorm.Expr("clicks + ?", 1))
    
    c.Redirect(http.StatusTemporaryRedirect, link.TargetURL)
}

func (h *AffiliateHandler) TrackConversion(c *gin.Context) {
    code := c.Param("code")
    
    var req struct {
        UserID    uuid.UUID `json:"user_id" binding:"required"`
        OrderID   uuid.UUID `json:"order_id"`
        Amount    float64   `json:"amount" binding:"required"`
        Type      string    `json:"type" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var link models.AffiliateLink
    if err := h.db.DB.Where("link_code = ?", code).First(&link).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Invalid tracking code"})
        return
    }
    
    conversion := models.AffiliateConversion{
        ID:           uuid.New(),
        AffiliateID:  link.AffiliateID,
        LinkID:       &link.ID,
        UserID:       &req.UserID,
        OrderID:      &req.OrderID,
        Amount:       req.Amount,
        Type:         req.Type,
        ConvertedAt:  time.Now(),
    }
    
    if err := h.db.DB.Create(&conversion).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track conversion"})
        return
    }
    
    h.db.DB.Model(&link).Update("conversions", gorm.Expr("conversions + ?", 1))
    
    commissionRate := 0.20
    commission := models.AffiliateCommission{
        ID:           uuid.New(),
        AffiliateID:  link.AffiliateID,
        ConversionID: conversion.ID,
        Amount:       req.Amount * commissionRate,
        Rate:         commissionRate,
        Status:       "pending",
        CreatedAt:    time.Now(),
    }
    
    h.db.DB.Create(&commission)
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Conversion tracked successfully",
        "commission": commission.Amount,
    })
}

func generateAffiliateCode() string {
    return "AFF" + uuid.New().String()[:8]
}

func generateLinkCode() string {
    return "LNK" + uuid.New().String()[:8]
}
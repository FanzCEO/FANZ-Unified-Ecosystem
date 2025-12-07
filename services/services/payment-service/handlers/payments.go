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

type PaymentsHandler struct {
    db                   *database.Database
    config               *config.Config
    stripeProcessor      *processors.StripeProcessor
    ccbillProcessor      *processors.CCBillProcessor
}

func NewPaymentsHandler(db *database.Database, cfg *config.Config, stripe *processors.StripeProcessor, ccbill *processors.CCBillProcessor) *PaymentsHandler {
    return &PaymentsHandler{
        db:                   db,
        config:               cfg,
        stripeProcessor:      stripe,
        ccbillProcessor:      ccbill,
    }
}

type AddPaymentMethodRequest struct {
    Type       string                 `json:"type" binding:"required,oneof=card bank_account crypto_wallet"`
    Processor  string                 `json:"processor" binding:"required,oneof=stripe ccbill nowpayments"`
    Token      string                 `json:"token,omitempty"`
    Details    map[string]interface{} `json:"details,omitempty"`
    SetDefault bool                   `json:"set_default,omitempty"`
}

type TipRequest struct {
    RecipientID uuid.UUID `json:"recipient_id" binding:"required"`
    Amount      float64   `json:"amount" binding:"required,min=1,max=10000"`
    Message     string    `json:"message,omitempty" binding:"max=500"`
    PaymentMethodID *uuid.UUID `json:"payment_method_id,omitempty"`
}

type PurchaseContentRequest struct {
    ContentID   uuid.UUID `json:"content_id" binding:"required"`
    ContentType string    `json:"content_type" binding:"required,oneof=post short_video message"`
    Amount      float64   `json:"amount" binding:"required,min=0.01"`
    PaymentMethodID *uuid.UUID `json:"payment_method_id,omitempty"`
}

type DepositRequest struct {
    Amount    float64    `json:"amount" binding:"required,min=1,max=10000"`
    Currency  string     `json:"currency,omitempty" binding:"omitempty,len=3"`
    Processor string     `json:"processor" binding:"required,oneof=stripe ccbill nowpayments"`
    PaymentMethodID *uuid.UUID `json:"payment_method_id,omitempty"`
}

func (h *PaymentsHandler) GetPaymentMethods(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    
    var paymentMethods []models.PaymentMethod
    if err := h.db.DB.Where("user_id = ?", claims.UserID).
        Order("is_default DESC, created_at DESC").
        Find(&paymentMethods).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch payment methods",
            "code":  "PAYMENT_METHODS_FETCH_ERROR",
        })
        return
    }

    // Format response to hide sensitive data
    response := make([]gin.H, len(paymentMethods))
    for i, pm := range paymentMethods {
        response[i] = gin.H{
            "id":         pm.ID,
            "type":       pm.Type,
            "processor":  pm.Processor,
            "last_four":  pm.LastFour,
            "brand":      pm.Brand,
            "expires_at": pm.ExpiresAt,
            "is_default": pm.IsDefault,
            "is_verified": pm.IsVerified,
            "created_at": pm.CreatedAt,
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "payment_methods": response,
    })
}

func (h *PaymentsHandler) AddPaymentMethod(c *gin.Context) {
    var req AddPaymentMethodRequest
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

    var paymentMethod *models.PaymentMethod
    var err error

    switch req.Processor {
    case "stripe":
        paymentMethod, err = h.stripeProcessor.AddPaymentMethod(claims.UserID, req.Token, req.Type)
    case "ccbill":
        paymentMethod, err = h.ccbillProcessor.AddPaymentMethod(claims.UserID, req.Details)
    case "nowpayments":
        err = fmt.Errorf("nowpayments not implemented yet")
    default:
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Unsupported payment processor",
            "code":  "UNSUPPORTED_PROCESSOR",
        })
        return
    }

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "PAYMENT_METHOD_ADD_ERROR",
        })
        return
    }

    // Set as default if requested or if it's the first payment method
    if req.SetDefault {
        h.setDefaultPaymentMethod(claims.UserID, paymentMethod.ID)
    } else {
        var count int64
        h.db.DB.Model(&models.PaymentMethod{}).Where("user_id = ?", claims.UserID).Count(&count)
        if count == 1 {
            paymentMethod.IsDefault = true
            h.db.DB.Save(paymentMethod)
        }
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "Payment method added successfully",
        "payment_method": gin.H{
            "id":         paymentMethod.ID,
            "type":       paymentMethod.Type,
            "processor":  paymentMethod.Processor,
            "last_four":  paymentMethod.LastFour,
            "brand":      paymentMethod.Brand,
            "is_default": paymentMethod.IsDefault,
            "is_verified": paymentMethod.IsVerified,
        },
    })
}

func (h *PaymentsHandler) UpdatePaymentMethod(c *gin.Context) {
    type UpdateRequest struct {
        ExpiresAt *time.Time             `json:"expires_at,omitempty"`
        BillingAddress map[string]interface{} `json:"billing_address,omitempty"`
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
    paymentMethodID := c.Param("id")

    var paymentMethod models.PaymentMethod
    if err := h.db.DB.Where("id = ? AND user_id = ?", paymentMethodID, claims.UserID).
        First(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Payment method not found",
            "code":  "PAYMENT_METHOD_NOT_FOUND",
        })
        return
    }

    // Update fields
    if req.ExpiresAt != nil {
        paymentMethod.ExpiresAt = req.ExpiresAt
    }
    if req.BillingAddress != nil {
        paymentMethod.BillingAddress = req.BillingAddress
    }

    paymentMethod.UpdatedAt = time.Now()

    if err := h.db.DB.Save(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update payment method",
            "code":  "PAYMENT_METHOD_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Payment method updated successfully",
    })
}

func (h *PaymentsHandler) DeletePaymentMethod(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    paymentMethodID := c.Param("id")

    var paymentMethod models.PaymentMethod
    if err := h.db.DB.Where("id = ? AND user_id = ?", paymentMethodID, claims.UserID).
        First(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Payment method not found",
            "code":  "PAYMENT_METHOD_NOT_FOUND",
        })
        return
    }

    // Delete from processor first
    switch paymentMethod.Processor {
    case "stripe":
        if err := h.stripeProcessor.DeletePaymentMethod(paymentMethod.ProcessorID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Failed to delete payment method from processor",
                "code":  "PROCESSOR_DELETE_ERROR",
            })
            return
        }
    }

    // Delete from database
    if err := h.db.DB.Delete(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to delete payment method",
            "code":  "PAYMENT_METHOD_DELETE_ERROR",
        })
        return
    }

    // If this was the default, set another as default
    if paymentMethod.IsDefault {
        var nextPaymentMethod models.PaymentMethod
        if err := h.db.DB.Where("user_id = ?", claims.UserID).
            First(&nextPaymentMethod).Error; err == nil {
            nextPaymentMethod.IsDefault = true
            h.db.DB.Save(&nextPaymentMethod)
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Payment method deleted successfully",
    })
}

func (h *PaymentsHandler) VerifyPaymentMethod(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    paymentMethodID := c.Param("id")

    var paymentMethod models.PaymentMethod
    if err := h.db.DB.Where("id = ? AND user_id = ?", paymentMethodID, claims.UserID).
        First(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Payment method not found",
            "code":  "PAYMENT_METHOD_NOT_FOUND",
        })
        return
    }

    // Verify with processor
    switch paymentMethod.Processor {
    case "stripe":
        if err := h.stripeProcessor.VerifyPaymentMethod(paymentMethod.ProcessorID); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
                "code":  "VERIFICATION_FAILED",
            })
            return
        }
    }

    paymentMethod.IsVerified = true
    paymentMethod.UpdatedAt = time.Now()
    h.db.DB.Save(&paymentMethod)

    c.JSON(http.StatusOK, gin.H{
        "message": "Payment method verified successfully",
    })
}

func (h *PaymentsHandler) SetDefaultPaymentMethod(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    paymentMethodID := c.Param("id")

    paymentMethodUUID, err := uuid.Parse(paymentMethodID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid payment method ID",
            "code":  "INVALID_PAYMENT_METHOD_ID",
        })
        return
    }

    if err := h.setDefaultPaymentMethod(claims.UserID, paymentMethodUUID); err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Payment method not found",
            "code":  "PAYMENT_METHOD_NOT_FOUND",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Default payment method updated successfully",
    })
}

func (h *PaymentsHandler) GetTransactions(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    transactionType := c.DefaultQuery("type", "")
    
    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 20
    }

    offset := (page - 1) * limit

    var transactions []models.Transaction
    query := h.db.DB.Model(&models.Transaction{}).
        Where("user_id = ?", claims.UserID)

    if transactionType != "" {
        query = query.Where("type = ?", transactionType)
    }

    query = query.Order("created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get transactions with pagination
    if err := query.Offset(offset).Limit(limit).Find(&transactions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch transactions",
            "code":  "TRANSACTIONS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "transactions": h.formatTransactionsResponse(transactions),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PaymentsHandler) GetTransaction(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    transactionID := c.Param("id")

    var transaction models.Transaction
    if err := h.db.DB.Where("id = ? AND user_id = ?", transactionID, claims.UserID).
        First(&transaction).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Transaction not found",
            "code":  "TRANSACTION_NOT_FOUND",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "transaction": h.formatTransactionResponse(&transaction),
    })
}

func (h *PaymentsHandler) SendTip(c *gin.Context) {
    var req TipRequest
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

    // Check if recipient exists and is a creator
    var recipient models.User
    if err := h.db.DB.Where("id = ? AND role = ?", req.RecipientID, models.RoleCreator).
        First(&recipient).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Recipient not found or not a creator",
            "code":  "INVALID_RECIPIENT",
        })
        return
    }

    // Prevent self-tipping
    if claims.UserID == req.RecipientID {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Cannot tip yourself",
            "code":  "SELF_TIP_NOT_ALLOWED",
        })
        return
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

    // Process payment
    transaction, err := h.processPayment(claims.UserID, req.RecipientID, req.Amount, models.TransactionTip, paymentMethod, map[string]interface{}{
        "message": req.Message,
    })

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "PAYMENT_PROCESSING_ERROR",
        })
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "Tip sent successfully",
        "transaction": h.formatTransactionResponse(transaction),
    })
}

func (h *PaymentsHandler) PurchaseContent(c *gin.Context) {
    var req PurchaseContentRequest
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

    // Verify content exists and is PPV
    var contentOwnerID uuid.UUID
    var contentPrice float64

    switch req.ContentType {
    case "post":
        var post models.Post
        if err := h.db.DB.Where("id = ? AND type = ?", req.ContentID, models.PostPPV).
            First(&post).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Content not found or not for sale",
                "code":  "CONTENT_NOT_FOUND",
            })
            return
        }
        contentOwnerID = post.UserID
        contentPrice = *post.Price
    case "short_video":
        var video models.ShortVideo
        if err := h.db.DB.Where("id = ? AND type = ?", req.ContentID, models.PostPPV).
            First(&video).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Content not found or not for sale",
                "code":  "CONTENT_NOT_FOUND",
            })
            return
        }
        contentOwnerID = video.UserID
        contentPrice = *video.Price
    case "message":
        var message models.Message
        if err := h.db.DB.Where("id = ? AND is_ppv = true", req.ContentID).
            First(&message).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "Message not found or not for sale",
                "code":  "MESSAGE_NOT_FOUND",
            })
            return
        }
        contentOwnerID = message.SenderID
        contentPrice = *message.Price
    default:
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid content type",
            "code":  "INVALID_CONTENT_TYPE",
        })
        return
    }

    // Verify amount matches content price
    if req.Amount != contentPrice {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Amount does not match content price",
            "code":  "PRICE_MISMATCH",
            "expected_amount": contentPrice,
        })
        return
    }

    // Check if already purchased
    var existingUnlock models.PPVUnlock
    unlockQuery := h.db.DB.Where("user_id = ?", claims.UserID)
    
    switch req.ContentType {
    case "post":
        unlockQuery = unlockQuery.Where("post_id = ?", req.ContentID)
    case "message":
        unlockQuery = unlockQuery.Where("message_id = ?", req.ContentID)
    }

    if err := unlockQuery.First(&existingUnlock).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Content already purchased",
            "code":  "ALREADY_PURCHASED",
        })
        return
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

    // Process payment
    transaction, err := h.processPayment(claims.UserID, contentOwnerID, req.Amount, models.TransactionPPVUnlock, paymentMethod, map[string]interface{}{
        "content_id":   req.ContentID,
        "content_type": req.ContentType,
    })

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "PAYMENT_PROCESSING_ERROR",
        })
        return
    }

    // Create PPV unlock record
    unlock := models.PPVUnlock{
        UserID:        claims.UserID,
        Amount:        req.Amount,
        TransactionID: &transaction.ID,
    }

    switch req.ContentType {
    case "post":
        unlock.PostID = &req.ContentID
    case "message":
        unlock.MessageID = &req.ContentID
    }

    if err := h.db.DB.Create(&unlock).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create unlock record",
            "code":  "UNLOCK_CREATION_ERROR",
        })
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "Content purchased successfully",
        "transaction": h.formatTransactionResponse(transaction),
        "unlock_id": unlock.ID,
    })
}

func (h *PaymentsHandler) DepositToWallet(c *gin.Context) {
    var req DepositRequest
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

    if req.Currency == "" {
        req.Currency = "USD"
    }

    // Get payment method if specified
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
    }

    // Process deposit based on processor
    var transaction *models.Transaction
    var err error

    switch req.Processor {
    case "stripe":
        transaction, err = h.stripeProcessor.ProcessDeposit(claims.UserID, req.Amount, req.Currency, paymentMethod)
    case "ccbill":
        transaction, err = h.ccbillProcessor.ProcessDeposit(claims.UserID, req.Amount, req.Currency)
    case "nowpayments":
        err = fmt.Errorf("nowpayments not implemented yet")
    default:
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Unsupported payment processor",
            "code":  "UNSUPPORTED_PROCESSOR",
        })
        return
    }

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "DEPOSIT_PROCESSING_ERROR",
        })
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "message": "Deposit initiated successfully",
        "transaction": h.formatTransactionResponse(transaction),
    })
}

func (h *PaymentsHandler) RefundTransaction(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    transactionID := c.Param("id")

    type RefundRequest struct {
        Reason string `json:"reason,omitempty" binding:"max=255"`
    }

    var req RefundRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    var transaction models.Transaction
    if err := h.db.DB.Where("id = ? AND user_id = ?", transactionID, claims.UserID).
        First(&transaction).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Transaction not found",
            "code":  "TRANSACTION_NOT_FOUND",
        })
        return
    }

    // Check if transaction is refundable
    if transaction.Status != "completed" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Transaction is not refundable",
            "code":  "NOT_REFUNDABLE",
        })
        return
    }

    // Check refund window (e.g., 30 days)
    if time.Since(transaction.CreatedAt) > 30*24*time.Hour {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Refund window has expired",
            "code":  "REFUND_WINDOW_EXPIRED",
        })
        return
    }

    // Process refund with payment processor
    var err error
    switch *transaction.Processor {
    case "stripe":
        err = h.stripeProcessor.ProcessRefund(&transaction, req.Reason)
    case "ccbill":
        err = h.ccbillProcessor.ProcessRefund(&transaction, req.Reason)
    default:
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Refunds not supported for this processor",
            "code":  "REFUNDS_NOT_SUPPORTED",
        })
        return
    }

    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "REFUND_PROCESSING_ERROR",
        })
        return
    }

    // Create refund record
    refund := models.Refund{
        OriginalTransactionID: transaction.ID,
        Amount:               transaction.Amount,
        Reason:               &req.Reason,
        Status:               "pending",
    }

    if err := h.db.DB.Create(&refund).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create refund record",
            "code":  "REFUND_RECORD_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Refund initiated successfully",
        "refund_id": refund.ID,
    })
}

// Withdrawal handlers

func (h *PaymentsHandler) GetWithdrawals(c *gin.Context) {
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

    var withdrawals []models.Withdrawal
    query := h.db.DB.Model(&models.Withdrawal{}).
        Where("creator_id = ?", claims.UserID).
        Preload("PaymentMethod").
        Order("created_at DESC")

    // Get total count
    var total int64
    query.Count(&total)

    // Get withdrawals with pagination
    if err := query.Offset(offset).Limit(limit).Find(&withdrawals).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch withdrawals",
            "code":  "WITHDRAWALS_FETCH_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "withdrawals": h.formatWithdrawalsResponse(withdrawals),
        "pagination": gin.H{
            "page":        page,
            "limit":       limit,
            "total":       total,
            "total_pages": (total + int64(limit) - 1) / int64(limit),
        },
    })
}

func (h *PaymentsHandler) RequestWithdrawal(c *gin.Context) {
    type WithdrawalRequest struct {
        Amount           float64    `json:"amount" binding:"required,min=10,max=10000"`
        PaymentMethodID  uuid.UUID  `json:"payment_method_id" binding:"required"`
    }

    var req WithdrawalRequest
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

    // Get user and check wallet balance
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    if user.WalletBalance < req.Amount {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Insufficient wallet balance",
            "code":  "INSUFFICIENT_BALANCE",
            "available_balance": user.WalletBalance,
        })
        return
    }

    // Verify payment method belongs to user
    var paymentMethod models.CreatorPaymentMethod
    if err := h.db.DB.Where("id = ? AND creator_id = ? AND is_verified = true", 
        req.PaymentMethodID, claims.UserID).First(&paymentMethod).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Payment method not found or not verified",
            "code":  "PAYMENT_METHOD_NOT_FOUND",
        })
        return
    }

    // Calculate fees
    feeAmount := req.Amount * 0.02 // 2% withdrawal fee
    netAmount := req.Amount - feeAmount

    // Create withdrawal record
    withdrawal := models.Withdrawal{
        CreatorID:       claims.UserID,
        Amount:         req.Amount,
        FeeAmount:      feeAmount,
        NetAmount:      &netAmount,
        Status:         "pending",
        PaymentMethodID: &req.PaymentMethodID,
    }

    if err := h.db.DB.Create(&withdrawal).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create withdrawal request",
            "code":  "WITHDRAWAL_CREATION_ERROR",
        })
        return
    }

    // Deduct from wallet balance
    user.WalletBalance -= req.Amount
    h.db.DB.Save(&user)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Withdrawal request created successfully",
        "withdrawal": gin.H{
            "id":         withdrawal.ID,
            "amount":     withdrawal.Amount,
            "fee_amount": withdrawal.FeeAmount,
            "net_amount": withdrawal.NetAmount,
            "status":     withdrawal.Status,
            "created_at": withdrawal.CreatedAt,
        },
    })
}

func (h *PaymentsHandler) GetWithdrawal(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    withdrawalID := c.Param("id")

    var withdrawal models.Withdrawal
    if err := h.db.DB.Where("id = ? AND creator_id = ?", withdrawalID, claims.UserID).
        Preload("PaymentMethod").
        First(&withdrawal).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Withdrawal not found",
            "code":  "WITHDRAWAL_NOT_FOUND",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "withdrawal": h.formatWithdrawalResponse(&withdrawal),
    })
}

func (h *PaymentsHandler) CancelWithdrawal(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    withdrawalID := c.Param("id")

    var withdrawal models.Withdrawal
    if err := h.db.DB.Where("id = ? AND creator_id = ?", withdrawalID, claims.UserID).
        First(&withdrawal).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Withdrawal not found",
            "code":  "WITHDRAWAL_NOT_FOUND",
        })
        return
    }

    if withdrawal.Status != "pending" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Withdrawal cannot be cancelled",
            "code":  "WITHDRAWAL_NOT_CANCELLABLE",
        })
        return
    }

    // Update withdrawal status
    withdrawal.Status = "cancelled"
    h.db.DB.Save(&withdrawal)

    // Refund to wallet
    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err == nil {
        user.WalletBalance += withdrawal.Amount
        h.db.DB.Save(&user)
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Withdrawal cancelled successfully",
    })
}

// Earnings handlers

func (h *PaymentsHandler) GetEarnings(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    // Get monthly earnings
    var monthlyEarnings float64
    h.db.DB.Model(&models.Transaction{}).
        Where("user_id = ? AND type IN ? AND status = 'completed'", 
            claims.UserID, []string{"subscription", "tip", "ppv_unlock"}).
        Where("created_at >= ?", time.Now().AddDate(0, -1, 0)).
        Select("COALESCE(SUM(net_amount), 0)").
        Scan(&monthlyEarnings)

    // Get pending earnings
    var pendingEarnings float64
    h.db.DB.Model(&models.Transaction{}).
        Where("user_id = ? AND type IN ? AND status = 'pending'", 
            claims.UserID, []string{"subscription", "tip", "ppv_unlock"}).
        Select("COALESCE(SUM(amount), 0)").
        Scan(&pendingEarnings)

    c.JSON(http.StatusOK, gin.H{
        "earnings": gin.H{
            "total_earnings":    user.EarningsTotal,
            "monthly_earnings":  monthlyEarnings,
            "pending_earnings":  pendingEarnings,
            "wallet_balance":    user.WalletBalance,
        },
    })
}

func (h *PaymentsHandler) GetEarningsBreakdown(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    type EarningsBreakdown struct {
        Type   string  `json:"type"`
        Amount float64 `json:"amount"`
        Count  int64   `json:"count"`
    }

    var breakdown []EarningsBreakdown
    h.db.DB.Model(&models.Transaction{}).
        Select("type, COALESCE(SUM(net_amount), 0) as amount, COUNT(*) as count").
        Where("user_id = ? AND status = 'completed'", claims.UserID).
        Where("type IN ?", []string{"subscription", "tip", "ppv_unlock"}).
        Group("type").
        Scan(&breakdown)

    c.JSON(http.StatusOK, gin.H{
        "breakdown": breakdown,
    })
}

func (h *PaymentsHandler) GetEarningsAnalytics(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
    
    if days < 1 || days > 365 {
        days = 30
    }

    startDate := time.Now().AddDate(0, 0, -days)

    type DailyEarnings struct {
        Date     time.Time `json:"date"`
        Earnings float64   `json:"earnings"`
        Count    int64     `json:"transaction_count"`
    }

    var analytics []DailyEarnings
    h.db.DB.Model(&models.Transaction{}).
        Select("DATE(created_at) as date, COALESCE(SUM(net_amount), 0) as earnings, COUNT(*) as count").
        Where("user_id = ? AND status = 'completed' AND created_at >= ?", 
            claims.UserID, startDate).
        Where("type IN ?", []string{"subscription", "tip", "ppv_unlock"}).
        Group("DATE(created_at)").
        Order("date ASC").
        Scan(&analytics)

    c.JSON(http.StatusOK, gin.H{
        "analytics": analytics,
        "period": gin.H{
            "days": days,
            "start_date": startDate,
            "end_date": time.Now(),
        },
    })
}

// Webhook handlers

func (h *PaymentsHandler) StripeWebhook(c *gin.Context) {
    h.stripeProcessor.HandleWebhook(c)
}

func (h *PaymentsHandler) CCBillWebhook(c *gin.Context) {
    h.ccbillProcessor.HandleWebhook(c)
}

func (h *PaymentsHandler) NowPaymentsWebhook(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{"error": "nowpayments not implemented yet"})
}

// Processor-specific endpoints

func (h *PaymentsHandler) GetStripeClientSecret(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    amount, _ := strconv.ParseFloat(c.Query("amount"), 64)
    currency := c.DefaultQuery("currency", "USD")

    if amount <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid amount",
            "code":  "INVALID_AMOUNT",
        })
        return
    }

    clientSecret, err := h.stripeProcessor.CreatePaymentIntent(claims.UserID, amount, currency)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": err.Error(),
            "code":  "PAYMENT_INTENT_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "client_secret": clientSecret,
        "amount": amount,
        "currency": currency,
    })
}

func (h *PaymentsHandler) ConfirmStripePayment(c *gin.Context) {
    type ConfirmRequest struct {
        PaymentIntentID string `json:"payment_intent_id" binding:"required"`
    }

    var req ConfirmRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code":  "INVALID_REQUEST",
        })
        return
    }

    claims, _ := middleware.GetCurrentUser(c)

    if err := h.stripeProcessor.ConfirmPayment(claims.UserID, req.PaymentIntentID); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "PAYMENT_CONFIRMATION_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Payment confirmed successfully",
    })
}

func (h *PaymentsHandler) GetCCBillFormURL(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)
    amount, _ := strconv.ParseFloat(c.Query("amount"), 64)
    productType := c.DefaultQuery("product_type", "subscription")

    if amount <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid amount",
            "code":  "INVALID_AMOUNT",
        })
        return
    }

    formURL, err := h.ccbillProcessor.GenerateFormURL(claims.UserID, amount, productType)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": err.Error(),
            "code":  "FORM_URL_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "form_url": formURL,
        "amount": amount,
        "product_type": productType,
    })
}

func (h *PaymentsHandler) GetCryptoCurrencies(c *gin.Context) {
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "nowpayments not implemented yet",
        "code":  "NOT_IMPLEMENTED",
    })
}

func (h *PaymentsHandler) CreateCryptoInvoice(c *gin.Context) {
    type InvoiceRequest struct {
        Amount   float64 `json:"amount" binding:"required,min=1"`
        Currency string  `json:"currency" binding:"required"`
        PayCurrency string `json:"pay_currency" binding:"required"`
    }

    var req InvoiceRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        validationErrors := utils.ValidateStruct(req)
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Validation failed",
            "code":    "VALIDATION_ERROR",
            "details": validationErrors,
        })
        return
    }

    _, _ = middleware.GetCurrentUser(c)

    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "nowpayments not implemented yet",
        "code":  "NOT_IMPLEMENTED",
    })
}

// Helper functions

func (h *PaymentsHandler) setDefaultPaymentMethod(userID, paymentMethodID uuid.UUID) error {
    // First, unset all default payment methods for the user
    h.db.DB.Model(&models.PaymentMethod{}).
        Where("user_id = ?", userID).
        Update("is_default", false)

    // Set the specified payment method as default
    result := h.db.DB.Model(&models.PaymentMethod{}).
        Where("id = ? AND user_id = ?", paymentMethodID, userID).
        Update("is_default", true)

    if result.RowsAffected == 0 {
        return fmt.Errorf("payment method not found")
    }

    return nil
}

func (h *PaymentsHandler) processPayment(payerID, recipientID uuid.UUID, amount float64, transactionType models.TransactionType, paymentMethod *models.PaymentMethod, metadata map[string]interface{}) (*models.Transaction, error) {
    // Calculate fees
    platformFeeRate := 0.10 // 10% platform fee
    paymentProcessorFee := amount * 0.029 // ~2.9% for credit cards
    platformFee := amount * platformFeeRate
    netAmount := amount - platformFee - paymentProcessorFee

    // Create transaction record
    transaction := models.Transaction{
        UserID:      payerID,
        Type:        transactionType,
        Amount:      amount,
        Currency:    "USD",
        Status:      "pending",
        Description: &[]string{fmt.Sprintf("%s payment", string(transactionType))}[0],
        Processor:   &paymentMethod.Processor,
        FeeAmount:   platformFee + paymentProcessorFee,
        NetAmount:   &netAmount,
        Metadata:    metadata,
    }

    if err := h.db.DB.Create(&transaction).Error; err != nil {
        return nil, fmt.Errorf("failed to create transaction: %v", err)
    }

    // Process payment with payment processor
    var err error
    switch paymentMethod.Processor {
    case "stripe":
        err = h.stripeProcessor.ProcessPayment(&transaction, paymentMethod)
    case "ccbill":
        err = h.ccbillProcessor.ProcessPayment(&transaction, paymentMethod)
    default:
        err = fmt.Errorf("unsupported payment processor: %s", paymentMethod.Processor)
    }

    if err != nil {
        transaction.Status = "failed"
        transaction.Metadata["error"] = err.Error()
        h.db.DB.Save(&transaction)
        return nil, err
    }

    // Update transaction status
    transaction.Status = "completed"
    transaction.MarkAsProcessed()
    h.db.DB.Save(&transaction)

    // Update recipient balance
    var recipient models.User
    if err := h.db.DB.First(&recipient, recipientID).Error; err == nil {
        recipient.AddToWallet(netAmount)
        recipient.AddEarnings(netAmount)
        h.db.DB.Save(&recipient)
    }

    // Create revenue share record
    revenueShare := models.RevenueShare{
        CreatorID:           recipientID,
        TransactionID:       transaction.ID,
        GrossAmount:         amount,
        PlatformFeeRate:     platformFeeRate,
        PlatformFeeAmount:   platformFee,
        PaymentProcessorFee: paymentProcessorFee,
        NetAmount:           netAmount,
    }
    h.db.DB.Create(&revenueShare)

    return &transaction, nil
}

func (h *PaymentsHandler) formatTransactionResponse(transaction *models.Transaction) gin.H {
    return gin.H{
        "id":          transaction.ID,
        "type":        transaction.Type,
        "amount":      transaction.Amount,
        "currency":    transaction.Currency,
        "status":      transaction.Status,
        "description": transaction.Description,
        "fee_amount":  transaction.FeeAmount,
        "net_amount":  transaction.NetAmount,
        "processor":   transaction.Processor,
        "metadata":    transaction.Metadata,
        "created_at":  transaction.CreatedAt,
        "processed_at": transaction.ProcessedAt,
    }
}

func (h *PaymentsHandler) formatTransactionsResponse(transactions []models.Transaction) []gin.H {
    result := make([]gin.H, len(transactions))
    for i, transaction := range transactions {
        result[i] = h.formatTransactionResponse(&transaction)
    }
    return result
}

func (h *PaymentsHandler) formatWithdrawalResponse(withdrawal *models.Withdrawal) gin.H {
    return gin.H{
        "id":          withdrawal.ID,
        "amount":      withdrawal.Amount,
        "fee_amount":  withdrawal.FeeAmount,
        "net_amount":  withdrawal.NetAmount,
        "status":      withdrawal.Status,
        "processor":   withdrawal.Processor,
        "created_at":  withdrawal.CreatedAt,
        "processed_at": withdrawal.ProcessedAt,
    }
}

func (h *PaymentsHandler) formatWithdrawalsResponse(withdrawals []models.Withdrawal) []gin.H {
    result := make([]gin.H, len(withdrawals))
    for i, withdrawal := range withdrawals {
        result[i] = h.formatWithdrawalResponse(&withdrawal)
    }
    return result
}

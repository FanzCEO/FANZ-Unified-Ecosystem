package handlers

import (
    "fmt"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/utils"
    "github.com/fanzos/shared/middleware"
)

type VerificationHandler struct {
    db     *database.Database
    config *config.Config
}

func NewVerificationHandler(db *database.Database, cfg *config.Config) *VerificationHandler {
    return &VerificationHandler{
        db:     db,
        config: cfg,
    }
}

type VerificationRequest struct {
    DocumentType string `json:"document_type" binding:"required"` // "government_id", "passport", "driver_license"
    FirstName    string `json:"first_name" binding:"required,min=1,max=50"`
    LastName     string `json:"last_name" binding:"required,min=1,max=50"`
    DateOfBirth  string `json:"date_of_birth" binding:"required"` // YYYY-MM-DD format
    Address      string `json:"address" binding:"required,max=200"`
    City         string `json:"city" binding:"required,max=50"`
    State        string `json:"state" binding:"required,max=50"`
    PostalCode   string `json:"postal_code" binding:"required,max=20"`
    Country      string `json:"country" binding:"required,len=2"` // ISO country code
}

type AgeVerificationRequest struct {
    DocumentFrontURL string `json:"document_front_url" binding:"required,url"`
    DocumentBackURL  string `json:"document_back_url,omitempty" binding:"omitempty,url"`
    SelfieURL       string `json:"selfie_url" binding:"required,url"`
    DocumentNumber  string `json:"document_number" binding:"required,min=5,max=50"`
}

type DocumentUploadResponse struct {
    DocumentID  uuid.UUID `json:"document_id"`
    UploadURL   string    `json:"upload_url"`
    DocumentURL string    `json:"document_url"`
    Status      string    `json:"status"`
}

func (h *VerificationHandler) RequestVerification(c *gin.Context) {
    var req VerificationRequest
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

    // Check if user already has a pending verification
    var existingRecord models.ComplianceRecord
    err := h.db.DB.Where("user_id = ? AND record_type = ? AND status IN ?", 
        claims.UserID, "verification", []string{"pending", "under_review"}).
        First(&existingRecord).Error
    
    if err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Verification request already pending",
            "code":  "VERIFICATION_PENDING",
            "verification_id": existingRecord.ID,
        })
        return
    }

    // Parse date of birth
    dob, err := time.Parse("2006-01-02", req.DateOfBirth)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid date format. Use YYYY-MM-DD",
            "code":  "INVALID_DATE_FORMAT",
        })
        return
    }

    // Verify age requirement (18+)
    if !utils.IsAdultAge(dob) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Must be at least 18 years old",
            "code":  "UNDERAGE",
        })
        return
    }

    // Create verification record
    _ = map[string]interface{}{
        "document_type":  req.DocumentType,
        "first_name":     req.FirstName,
        "last_name":      req.LastName,
        "date_of_birth":  req.DateOfBirth,
        "address":        req.Address,
        "city":          req.City,
        "state":         req.State,
        "postal_code":   req.PostalCode,
        "country":       req.Country,
        "submitted_at":  time.Now().UTC(),
    }

    record := models.ComplianceRecord{
        UserID:             claims.UserID,
        RecordType:         "verification",
        Status:             models.CompliancePending,
        VerificationMethod: "manual_review",
        Notes:              fmt.Sprintf("Verification request for %s %s", req.FirstName, req.LastName),
    }

    // Store encrypted verification data
    // TODO: Implement proper encryption for sensitive data
    // record.VerificationData = verificationData

    if err := h.db.DB.Create(&record).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create verification request",
            "code":  "VERIFICATION_REQUEST_ERROR",
        })
        return
    }

    // Create audit log entry
    h.createAuditLog(claims.UserID, "verification_requested", "compliance_record", &record.ID, map[string]interface{}{
        "document_type": req.DocumentType,
        "country": req.Country,
    })

    c.JSON(http.StatusCreated, gin.H{
        "message":         "Verification request submitted successfully",
        "verification_id": record.ID,
        "status":          record.Status,
        "estimated_processing_time": "2-5 business days",
    })
}

func (h *VerificationHandler) GetVerificationStatus(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    var records []models.ComplianceRecord
    if err := h.db.DB.Where("user_id = ? AND record_type = ?", claims.UserID, "verification").
        Order("created_at DESC").
        Find(&records).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get verification status",
            "code":  "VERIFICATION_STATUS_ERROR",
        })
        return
    }

    var currentVerification *models.ComplianceRecord
    var verificationHistory []models.ComplianceRecord

    for i, record := range records {
        if i == 0 {
            currentVerification = &records[i]
        } else {
            verificationHistory = append(verificationHistory, record)
        }
    }

    response := gin.H{
        "is_verified": claims.IsVerified,
        "history":     verificationHistory,
    }

    if currentVerification != nil {
        response["current_verification"] = gin.H{
            "id":          currentVerification.ID,
            "status":      currentVerification.Status,
            "submitted_at": currentVerification.CreatedAt,
            "updated_at":   currentVerification.UpdatedAt,
            "notes":       currentVerification.Notes,
        }

        if currentVerification.ExpiresAt != nil {
            response["expires_at"] = currentVerification.ExpiresAt
        }
    }

    c.JSON(http.StatusOK, response)
}

func (h *VerificationHandler) UploadDocument(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    file, header, err := c.Request.FormFile("document")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "No file uploaded",
            "code":  "NO_FILE_UPLOADED",
        })
        return
    }
    defer file.Close()

    documentType := c.PostForm("document_type")
    if documentType == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Document type is required",
            "code":  "DOCUMENT_TYPE_REQUIRED",
        })
        return
    }

    // Validate file
    allowedTypes := []string{".jpg", ".jpeg", ".png", ".pdf"}
    if err := utils.ValidateFileType(header.Filename, allowedTypes); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "INVALID_FILE_TYPE",
        })
        return
    }

    // Check file size (10MB limit)
    if err := utils.ValidateFileSize(header.Size, 10*1024*1024); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
            "code":  "FILE_TOO_LARGE",
        })
        return
    }

    // TODO: Upload to secure storage (S3 with encryption)
    documentURL := fmt.Sprintf("https://secure.fanzos.com/documents/%s/%s", 
        claims.UserID.String(), header.Filename)

    // Create document record
    document := models.UploadedDocument{
        UserID:       claims.UserID,
        DocumentType: documentType,
        FileURL:      documentURL,
        FileSize:     header.Size,
        MimeType:     header.Header.Get("Content-Type"),
        // TODO: Generate encryption key for the document
        // EncryptionKey: encryptionKey,
    }

    if err := h.db.DB.Create(&document).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to save document record",
            "code":  "DOCUMENT_SAVE_ERROR",
        })
        return
    }

    // Create audit log entry
    h.createAuditLog(claims.UserID, "document_uploaded", "uploaded_document", &document.ID, map[string]interface{}{
        "document_type": documentType,
        "file_size": header.Size,
        "mime_type": header.Header.Get("Content-Type"),
    })

    response := DocumentUploadResponse{
        DocumentID:  document.ID,
        DocumentURL: documentURL,
        Status:      "uploaded",
    }

    c.JSON(http.StatusCreated, gin.H{
        "message":  "Document uploaded successfully",
        "document": response,
    })
}

func (h *VerificationHandler) SubmitAgeVerification(c *gin.Context) {
    var req AgeVerificationRequest
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

    // Check if user already has pending age verification
    var existingRecord models.ComplianceRecord
    err := h.db.DB.Where("user_id = ? AND record_type = ? AND status IN ?", 
        claims.UserID, "age_verification", []string{"pending", "under_review"}).
        First(&existingRecord).Error
    
    if err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Age verification already pending",
            "code":  "AGE_VERIFICATION_PENDING",
            "verification_id": existingRecord.ID,
        })
        return
    }

    // Create age verification record
    record := models.ComplianceRecord{
        UserID:             claims.UserID,
        RecordType:         "age_verification",
        Status:             models.CompliancePending,
        VerificationMethod: "document_review",
        Notes:              "Age verification submission with ID document and selfie",
    }

    if err := h.db.DB.Create(&record).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to submit age verification",
            "code":  "AGE_VERIFICATION_ERROR",
        })
        return
    }

    // TODO: Send to third-party age verification service (VerifyMy)
    // This would integrate with the actual verification API
    h.submitToVerificationService(claims.UserID, req)

    // Create audit log entry
    h.createAuditLog(claims.UserID, "age_verification_submitted", "compliance_record", &record.ID, map[string]interface{}{
        "document_number": req.DocumentNumber,
        "has_document_back": req.DocumentBackURL != "",
    })

    c.JSON(http.StatusCreated, gin.H{
        "message":         "Age verification submitted successfully",
        "verification_id": record.ID,
        "status":          record.Status,
        "estimated_processing_time": "1-3 business days",
    })
}

func (h *VerificationHandler) GetVerificationRequirements(c *gin.Context) {
    claims, _ := middleware.GetCurrentUser(c)

    var user models.User
    if err := h.db.DB.First(&user, claims.UserID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "User not found",
            "code":  "USER_NOT_FOUND",
        })
        return
    }

    requirements := gin.H{
        "email_verification": gin.H{
            "required": true,
            "completed": user.IsEmailVerified,
            "description": "Verify your email address to secure your account",
        },
        "age_verification": gin.H{
            "required": user.Role == models.RoleCreator,
            "completed": user.IsAgeVerified,
            "description": "Verify you are 18+ years old (required for creators)",
            "documents_required": []string{
                "Government-issued photo ID",
                "Clear selfie photo",
            },
        },
        "identity_verification": gin.H{
            "required": user.Role == models.RoleCreator,
            "completed": user.IsVerified,
            "description": "Complete identity verification for creator features",
            "documents_required": []string{
                "Government-issued photo ID (front and back)",
                "Proof of address",
                "Clear selfie photo",
            },
        },
    }

    if user.Role == models.RoleCreator {
        requirements["tax_information"] = gin.H{
            "required": true,
            "completed": h.hasTaxInformation(claims.UserID),
            "description": "Provide tax information for earnings reporting",
        }

        requirements["payment_method"] = gin.H{
            "required": true,
            "completed": h.hasPaymentMethod(claims.UserID),
            "description": "Add a valid payment method for withdrawals",
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "requirements": requirements,
        "overall_completion": h.calculateCompletionPercentage(requirements),
    })
}

// Helper functions

func (h *VerificationHandler) createAuditLog(userID uuid.UUID, action, resourceType string, resourceID *uuid.UUID, metadata map[string]interface{}) {
    log := models.AuditLog{
        UserID:       userID,
        Action:       action,
        ResourceType: resourceType,
        Metadata:     metadata,
    }

    if resourceID != nil {
        log.ResourceID = resourceID
    }

    h.db.DB.Create(&log)
}

func (h *VerificationHandler) submitToVerificationService(userID uuid.UUID, req AgeVerificationRequest) {
    // TODO: Implement actual integration with VerifyMy or similar service
    // This is a placeholder for the actual API call

    // Create VerifyMy verification record
    verifyMyRecord := models.VerifyMyVerification{
        UserID:           userID,
        VerificationID:   uuid.New().String(), // Would come from VerifyMy API
        Status:          "pending",
        VerificationType: "age_verification",
        DocumentType:     "government_id",
        VerifiedData: map[string]interface{}{
            "document_front_url": req.DocumentFrontURL,
            "document_back_url":  req.DocumentBackURL,
            "selfie_url":        req.SelfieURL,
            "document_number":   req.DocumentNumber,
            "submitted_at":      time.Now().UTC(),
        },
    }

    h.db.DB.Create(&verifyMyRecord)

    // TODO: Make actual API call to VerifyMy
    // response, err := verifyMyClient.SubmitVerification(...)
}

func (h *VerificationHandler) hasTaxInformation(userID uuid.UUID) bool {
    var count int64
    h.db.DB.Model(&models.CreatorTaxInfo{}).Where("creator_id = ?", userID).Count(&count)
    return count > 0
}

func (h *VerificationHandler) hasPaymentMethod(userID uuid.UUID) bool {
    var count int64
    h.db.DB.Model(&models.CreatorPaymentMethod{}).Where("creator_id = ? AND is_verified = true", userID).Count(&count)
    return count > 0
}

func (h *VerificationHandler) calculateCompletionPercentage(requirements gin.H) int {
    total := len(requirements)
    completed := 0

    for _, req := range requirements {
        if reqMap, ok := req.(gin.H); ok {
            if isCompleted, ok := reqMap["completed"].(bool); ok && isCompleted {
                completed++
            }
        }
    }

    if total == 0 {
        return 100
    }

    return (completed * 100) / total
}

// Webhook handlers for external verification services

func (h *VerificationHandler) HandleVerifyMyWebhook(c *gin.Context) {
    // TODO: Implement VerifyMy webhook handler
    // This would process verification results from the external service

    type VerifyMyWebhook struct {
        VerificationID string `json:"verification_id"`
        Status         string `json:"status"`
        Result         struct {
            Verified  bool   `json:"verified"`
            Reason    string `json:"reason,omitempty"`
            Confidence float64 `json:"confidence"`
        } `json:"result"`
    }

    var webhook VerifyMyWebhook
    if err := c.ShouldBindJSON(&webhook); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid webhook payload",
            "code":  "INVALID_WEBHOOK",
        })
        return
    }

    // Find the verification record
    var verifyMyRecord models.VerifyMyVerification
    if err := h.db.DB.Where("verification_id = ?", webhook.VerificationID).
        First(&verifyMyRecord).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "Verification not found",
            "code":  "VERIFICATION_NOT_FOUND",
        })
        return
    }

    // Update verification status
    verifyMyRecord.Status = webhook.Status
    verifyMyRecord.WebhookData = map[string]interface{}{
        "verified":    webhook.Result.Verified,
        "reason":      webhook.Result.Reason,
        "confidence":  webhook.Result.Confidence,
        "updated_at":  time.Now().UTC(),
    }

    if err := h.db.DB.Save(&verifyMyRecord).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update verification",
            "code":  "VERIFICATION_UPDATE_ERROR",
        })
        return
    }

    // Update user verification status if approved
    if webhook.Status == "completed" && webhook.Result.Verified {
        var user models.User
        if err := h.db.DB.First(&user, verifyMyRecord.UserID).Error; err == nil {
            if verifyMyRecord.VerificationType == "age_verification" {
                user.VerifyAge()
            } else {
                user.GrantVerification()
            }
            h.db.DB.Save(&user)

            // Create audit log entry
            h.createAuditLog(user.ID, "verification_approved", "user", &user.ID, map[string]interface{}{
                "verification_type": verifyMyRecord.VerificationType,
                "verification_id":   webhook.VerificationID,
                "confidence":        webhook.Result.Confidence,
            })
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Webhook processed successfully",
    })
}

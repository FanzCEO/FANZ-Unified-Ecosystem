package handlers

import (
    "context"
    "fmt"
    "net/http"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"

    "github.com/fanzos/shared/config"
    "github.com/fanzos/shared/database"
    "github.com/fanzos/shared/models"
    "github.com/fanzos/shared/auth"
    "github.com/fanzos/shared/utils"
)

type AuthHandler struct {
    db         *database.Database
    jwtManager *auth.JWTManager
    config     *config.Config
}

func NewAuthHandler(db *database.Database, jwtManager *auth.JWTManager, cfg *config.Config) *AuthHandler {
    return &AuthHandler{
        db:         db,
        jwtManager: jwtManager,
        config:     cfg,
    }
}

type RegisterRequest struct {
    Username    string    `json:"username" binding:"required,username"`
    Email       string    `json:"email" binding:"required,email"`
    Password    string    `json:"password" binding:"required,password"`
    DisplayName string    `json:"display_name" binding:"required,min=1,max=100"`
    BirthDate   time.Time `json:"birth_date" binding:"required,adult_age"`
    AcceptTerms bool      `json:"accept_terms" binding:"required"`
    Role        string    `json:"role,omitempty"`
}

type LoginRequest struct {
    Login    string `json:"login" binding:"required"` // email or username
    Password string `json:"password" binding:"required"`
}

type ForgotPasswordRequest struct {
    Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
    Token       string `json:"token" binding:"required"`
    NewPassword string `json:"new_password" binding:"required,password"`
}

type VerifyEmailRequest struct {
    Token string `json:"token" binding:"required"`
}

type ChangePasswordRequest struct {
    CurrentPassword string `json:"current_password" binding:"required"`
    NewPassword     string `json:"new_password" binding:"required,password"`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        validationErrors := utils.ValidateStruct(req)
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Validation failed",
            "code": "VALIDATION_ERROR",
            "details": validationErrors,
        })
        return
    }

    // Check if user already exists
    var existingUser models.User
    if err := h.db.DB.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "User already exists",
            "code": "USER_EXISTS",
        })
        return
    }

    // Hash password
    hashedPassword, err := utils.HashPassword(req.Password)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to process password",
            "code": "PASSWORD_HASH_ERROR",
        })
        return
    }

    // Determine role
    role := models.RoleFanz
    if req.Role == "creator" {
        role = models.RoleCreator
    }

    // Create user
    user := models.User{
        Username:     req.Username,
        Email:        &req.Email,
        PasswordHash: &hashedPassword,
        DisplayName:  &req.DisplayName,
        BirthDate:    &req.BirthDate,
        Role:         role,
        IsActive:     true,
    }

    if role == models.RoleCreator {
        status := models.CreatorInactive
        user.CreatorStatus = &status
    }

    if err := h.db.DB.Create(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to create user",
            "code": "USER_CREATION_ERROR",
        })
        return
    }

    // Send verification email
    h.sendVerificationEmail(&user)

    // Generate tokens
    tokenPair, err := h.jwtManager.GenerateTokenPair(&user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to generate tokens",
            "code": "TOKEN_GENERATION_ERROR",
        })
        return
    }

    // Create session
    h.createSession(&user, c, tokenPair.RefreshToken)

    c.JSON(http.StatusCreated, gin.H{
        "message": "User registered successfully",
        "user": gin.H{
            "id": user.ID,
            "username": user.Username,
            "display_name": user.DisplayName,
            "role": user.Role,
            "is_verified": user.IsVerified,
        },
        "tokens": tokenPair,
        "verification_required": !user.IsEmailVerified,
    })
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    // Find user by email or username
    var user models.User
    query := h.db.DB.Where("username = ?", req.Login)
    if strings.Contains(req.Login, "@") {
        query = h.db.DB.Where("email = ?", req.Login)
    }

    if err := query.First(&user).Error; err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Invalid credentials",
            "code": "INVALID_CREDENTIALS",
        })
        return
    }

    // Check if user is active
    if !user.IsActive || user.IsBanned {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Account is disabled",
            "code": "ACCOUNT_DISABLED",
        })
        return
    }

    // Verify password
    if user.PasswordHash == nil || !utils.CheckPassword(req.Password, *user.PasswordHash) {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Invalid credentials",
            "code": "INVALID_CREDENTIALS",
        })
        return
    }

    // Update last login
    user.UpdateLastLogin()
    h.db.DB.Save(&user)

    // Generate tokens
    tokenPair, err := h.jwtManager.GenerateTokenPair(&user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to generate tokens",
            "code": "TOKEN_GENERATION_ERROR",
        })
        return
    }

    // Create session
    h.createSession(&user, c, tokenPair.RefreshToken)

    c.JSON(http.StatusOK, gin.H{
        "message": "Login successful",
        "user": gin.H{
            "id": user.ID,
            "username": user.Username,
            "display_name": user.DisplayName,
            "role": user.Role,
            "is_verified": user.IsVerified,
        },
        "tokens": tokenPair,
    })
}

func (h *AuthHandler) Logout(c *gin.Context) {
    // Get session token from header
    authHeader := c.GetHeader("Authorization")
    if authHeader == "" {
        c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
        return
    }

    token := strings.TrimPrefix(authHeader, "Bearer ")
    
    // Invalidate session in database
    h.db.DB.Where("token_hash = ?", h.hashToken(token)).Delete(&models.Session{})

    // Could add token to blacklist here for extra security
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Logged out successfully",
    })
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
    type RefreshRequest struct {
        RefreshToken string `json:"refresh_token" binding:"required"`
    }

    var req RefreshRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    // Validate refresh token
    userID, err := h.jwtManager.ValidateRefreshToken(req.RefreshToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Invalid refresh token",
            "code": "INVALID_REFRESH_TOKEN",
        })
        return
    }

    // Get user
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    // Check if user is still active
    if !user.IsActive || user.IsBanned {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Account is disabled",
            "code": "ACCOUNT_DISABLED",
        })
        return
    }

    // Generate new token pair
    tokenPair, err := h.jwtManager.GenerateTokenPair(&user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to generate tokens",
            "code": "TOKEN_GENERATION_ERROR",
        })
        return
    }

    // Update session
    h.createSession(&user, c, tokenPair.RefreshToken)

    c.JSON(http.StatusOK, gin.H{
        "tokens": tokenPair,
    })
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
    var req ForgotPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    var user models.User
    if err := h.db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
        // Don't reveal if email exists or not
        c.JSON(http.StatusOK, gin.H{
            "message": "If the email exists, a reset link has been sent",
        })
        return
    }

    // Generate reset token
    resetToken, err := utils.GenerateRandomString(64)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to generate reset token",
            "code": "TOKEN_GENERATION_ERROR",
        })
        return
    }

    // Store reset token in Redis with expiration
    ctx := context.Background()
    key := fmt.Sprintf("password_reset:%s", user.ID.String())
    database.Redis.Set(ctx, key, resetToken, 15*time.Minute)

    // Send reset email
    h.sendPasswordResetEmail(&user, resetToken)

    c.JSON(http.StatusOK, gin.H{
        "message": "If the email exists, a reset link has been sent",
    })
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
    var req ResetPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    // Validate token format
    if len(req.Token) < 32 {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid reset token",
            "code": "INVALID_TOKEN",
        })
        return
    }

    // Find user by scanning Redis for the token
    ctx := context.Background()
    var userID string
    
    // This is a simplified approach - in production, you'd store user ID with the token
    keys, err := database.Redis.Keys(ctx, "password_reset:*").Result()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to validate token",
            "code": "TOKEN_VALIDATION_ERROR",
        })
        return
    }

    for _, key := range keys {
        storedToken, err := database.Redis.Get(ctx, key).Result()
        if err != nil {
            continue
        }
        
        if storedToken == req.Token {
            userID = strings.TrimPrefix(key, "password_reset:")
            break
        }
    }

    if userID == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid or expired reset token",
            "code": "INVALID_TOKEN",
        })
        return
    }

    // Get user
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    // Hash new password
    hashedPassword, err := utils.HashPassword(req.NewPassword)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to process password",
            "code": "PASSWORD_HASH_ERROR",
        })
        return
    }

    // Update password
    user.PasswordHash = &hashedPassword
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update password",
            "code": "PASSWORD_UPDATE_ERROR",
        })
        return
    }

    // Delete reset token
    database.Redis.Del(ctx, fmt.Sprintf("password_reset:%s", userID))

    // Invalidate all existing sessions for security
    h.db.DB.Where("user_id = ?", user.ID).Delete(&models.Session{})

    c.JSON(http.StatusOK, gin.H{
        "message": "Password reset successfully",
    })
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
    var req VerifyEmailRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    // Get user ID from Redis verification token
    ctx := context.Background()
    userID, err := database.Redis.Get(ctx, fmt.Sprintf("email_verification:%s", req.Token)).Result()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid or expired verification token",
            "code": "INVALID_TOKEN",
        })
        return
    }

    // Get user
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    // Verify email
    user.VerifyEmail()
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to verify email",
            "code": "VERIFICATION_ERROR",
        })
        return
    }

    // Delete verification token
    database.Redis.Del(ctx, fmt.Sprintf("email_verification:%s", req.Token))

    c.JSON(http.StatusOK, gin.H{
        "message": "Email verified successfully",
    })
}

func (h *AuthHandler) VerifyPhone(c *gin.Context) {
    type VerifyPhoneRequest struct {
        Phone string `json:"phone" binding:"required,phone"`
        Code  string `json:"code" binding:"required,len=6"`
    }

    var req VerifyPhoneRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    // Get stored verification code
    ctx := context.Background()
    storedCode, err := database.Redis.Get(ctx, fmt.Sprintf("phone_verification:%s", req.Phone)).Result()
    if err != nil || storedCode != req.Code {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid or expired verification code",
            "code": "INVALID_CODE",
        })
        return
    }

    // Get current user
    userID := c.GetString("user_id")
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    // Update phone and verify
    user.Phone = &req.Phone
    user.VerifyPhone()
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to verify phone",
            "code": "VERIFICATION_ERROR",
        })
        return
    }

    // Delete verification code
    database.Redis.Del(ctx, fmt.Sprintf("phone_verification:%s", req.Phone))

    c.JSON(http.StatusOK, gin.H{
        "message": "Phone verified successfully",
    })
}

func (h *AuthHandler) ResendVerification(c *gin.Context) {
    userID := c.GetString("user_id")
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    if user.IsEmailVerified {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Email is already verified",
            "code": "ALREADY_VERIFIED",
        })
        return
    }

    h.sendVerificationEmail(&user)

    c.JSON(http.StatusOK, gin.H{
        "message": "Verification email sent",
    })
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
    var req ChangePasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Invalid request",
            "code": "INVALID_REQUEST",
        })
        return
    }

    userID := c.GetString("user_id")
    var user models.User
    if err := h.db.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "User not found",
            "code": "USER_NOT_FOUND",
        })
        return
    }

    // Check current password
    if user.PasswordHash == nil || !utils.CheckPassword(req.CurrentPassword, *user.PasswordHash) {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Current password is incorrect",
            "code": "INVALID_CURRENT_PASSWORD",
        })
        return
    }

    // Hash new password
    hashedPassword, err := utils.HashPassword(req.NewPassword)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to process password",
            "code": "PASSWORD_HASH_ERROR",
        })
        return
    }

    // Update password
    user.PasswordHash = &hashedPassword
    if err := h.db.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to update password",
            "code": "PASSWORD_UPDATE_ERROR",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Password changed successfully",
    })
}

// Social Authentication Handlers
func (h *AuthHandler) GoogleAuth(c *gin.Context) {
    config := &oauth2.Config{
        ClientID:     h.config.GoogleClientID,
        ClientSecret: h.config.GoogleClientSecret,
        RedirectURL:  "http://localhost:8001/auth/google/callback",
        Scopes: []string{
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        },
        Endpoint: google.Endpoint,
    }

    url := config.AuthCodeURL("state", oauth2.AccessTypeOffline)
    c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
    code := c.Query("code")
    if code == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Authorization code not provided",
            "code": "NO_AUTH_CODE",
        })
        return
    }

    config := &oauth2.Config{
        ClientID:     h.config.GoogleClientID,
        ClientSecret: h.config.GoogleClientSecret,
        RedirectURL:  "http://localhost:8001/auth/google/callback",
        Scopes: []string{
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        },
        Endpoint: google.Endpoint,
    }

    token, err := config.Exchange(context.Background(), code)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "Failed to exchange token",
            "code": "TOKEN_EXCHANGE_ERROR",
        })
        return
    }

    // Get user info from Google
    client := config.Client(context.Background(), token)
    resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to get user info",
            "code": "USER_INFO_ERROR",
        })
        return
    }
    defer resp.Body.Close()

    var userInfo struct {
        ID            string `json:"id"`
        Email         string `json:"email"`
        Name          string `json:"name"`
        Picture       string `json:"picture"`
        VerifiedEmail bool   `json:"verified_email"`
    }

    if err := c.BindJSON(&userInfo); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to parse user info",
            "code": "USER_INFO_PARSE_ERROR",
        })
        return
    }

    // Find or create user
    user, err := h.findOrCreateSocialUser(models.AuthGoogle, userInfo.ID, userInfo.Email, userInfo.Name, userInfo.Picture)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to process social login",
            "code": "SOCIAL_LOGIN_ERROR",
        })
        return
    }

    // Generate tokens
    tokenPair, err := h.jwtManager.GenerateTokenPair(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to generate tokens",
            "code": "TOKEN_GENERATION_ERROR",
        })
        return
    }

    // Create session
    h.createSession(user, c, tokenPair.RefreshToken)

    c.JSON(http.StatusOK, gin.H{
        "message": "Social login successful",
        "user": gin.H{
            "id": user.ID,
            "username": user.Username,
            "display_name": user.DisplayName,
            "role": user.Role,
            "is_verified": user.IsVerified,
        },
        "tokens": tokenPair,
    })
}

func (h *AuthHandler) FacebookAuth(c *gin.Context) {
    // Similar implementation to Google Auth
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Facebook authentication not implemented",
        "code": "NOT_IMPLEMENTED",
    })
}

func (h *AuthHandler) FacebookCallback(c *gin.Context) {
    // Similar implementation to Google Callback
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Facebook authentication not implemented",
        "code": "NOT_IMPLEMENTED",
    })
}

func (h *AuthHandler) TwitterAuth(c *gin.Context) {
    // Twitter OAuth implementation
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Twitter authentication not implemented",
        "code": "NOT_IMPLEMENTED",
    })
}

func (h *AuthHandler) TwitterCallback(c *gin.Context) {
    // Twitter OAuth callback implementation
    c.JSON(http.StatusNotImplemented, gin.H{
        "error": "Twitter authentication not implemented",
        "code": "NOT_IMPLEMENTED",
    })
}

// Helper functions

func (h *AuthHandler) createSession(user *models.User, c *gin.Context, refreshToken string) {
    userAgent := c.Request.UserAgent()
    session := models.Session{
        UserID:           user.ID,
        TokenHash:        h.hashToken(refreshToken),
        RefreshTokenHash: &refreshToken,
        IPAddress:        c.ClientIP(),
        UserAgent:        &userAgent,
        ExpiresAt:        time.Now().Add(30 * 24 * time.Hour), // 30 days
    }

    h.db.DB.Create(&session)
}

func (h *AuthHandler) hashToken(token string) string {
    hash, _ := bcrypt.GenerateFromPassword([]byte(token), bcrypt.MinCost)
    return string(hash)
}

func (h *AuthHandler) sendVerificationEmail(user *models.User) {
    if user.Email == nil {
        return
    }

    token, err := utils.GenerateRandomString(64)
    if err != nil {
        return
    }

    // Store verification token in Redis
    ctx := context.Background()
    key := fmt.Sprintf("email_verification:%s", token)
    database.Redis.Set(ctx, key, user.ID.String(), 24*time.Hour)

    // TODO: Send actual email using SendGrid or similar service
    // For now, just log the verification URL
    fmt.Printf("Email verification URL: http://localhost:5000/verify-email?token=%s\n", token)
}

func (h *AuthHandler) sendPasswordResetEmail(user *models.User, token string) {
    if user.Email == nil {
        return
    }

    // TODO: Send actual email using SendGrid or similar service
    // For now, just log the reset URL
    fmt.Printf("Password reset URL: http://localhost:5000/reset-password?token=%s\n", token)
}

func (h *AuthHandler) findOrCreateSocialUser(provider models.AuthProvider, providerID, email, name, picture string) (*models.User, error) {
    // Check if auth provider record exists
    var authProvider models.AuthProviderRecord
    err := h.db.DB.Where("provider = ? AND provider_id = ?", provider, providerID).First(&authProvider).Error
    
    if err == nil {
        // Auth provider exists, get the user
        var user models.User
        if err := h.db.DB.First(&user, authProvider.UserID).Error; err != nil {
            return nil, err
        }
        return &user, nil
    }

    // Check if user exists with this email
    var user models.User
    err = h.db.DB.Where("email = ?", email).First(&user).Error
    
    if err != nil {
        // Create new user
        username := strings.Split(email, "@")[0] + "_" + string(provider)
        
        user = models.User{
            Username:        username,
            Email:           &email,
            DisplayName:     &name,
            Role:            models.RoleFanz,
            IsActive:        true,
            IsEmailVerified: true, // Social logins are pre-verified
        }

        if picture != "" {
            user.AvatarURL = &picture
        }

        if err := h.db.DB.Create(&user).Error; err != nil {
            return nil, err
        }
    }

    // Create auth provider record
    authProvider = models.AuthProviderRecord{
        UserID:     user.ID,
        Provider:   provider,
        ProviderID: providerID,
        ProviderEmail: &email,
        IsPrimary:  true,
    }

    if err := h.db.DB.Create(&authProvider).Error; err != nil {
        return nil, err
    }

    return &user, nil
}

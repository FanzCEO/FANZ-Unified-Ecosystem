package middleware

import (
    "net/http"
    "context"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/fanzos/shared/auth"
)

type contextKey string

const (
    UserContextKey contextKey = "user"
    ClaimsContextKey contextKey = "claims"
)

type AuthMiddleware struct {
    jwtManager *auth.JWTManager
}

func NewAuthMiddleware(jwtManager *auth.JWTManager) *AuthMiddleware {
    return &AuthMiddleware{
        jwtManager: jwtManager,
    }
}

// RequireAuth ensures the user is authenticated
func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := am.extractToken(c)
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }

        claims, err := am.jwtManager.ValidateToken(token)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Invalid or expired token",
                "code":  "INVALID_TOKEN",
            })
            c.Abort()
            return
        }

        // Add claims to context
        c.Set(string(ClaimsContextKey), claims)
        c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), ClaimsContextKey, claims))
        
        c.Next()
    }
}

// OptionalAuth allows both authenticated and unauthenticated requests
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := am.extractToken(c)
        if token != "" {
            claims, err := am.jwtManager.ValidateToken(token)
            if err == nil {
                c.Set(string(ClaimsContextKey), claims)
                c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), ClaimsContextKey, claims))
            }
        }
        c.Next()
    }
}

// RequireRole ensures the user has a specific role
func (am *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, exists := c.Get(string(ClaimsContextKey))
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }

        userClaims, ok := claims.(*auth.Claims)
        if !ok {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Invalid authentication context",
                "code":  "INVALID_AUTH_CONTEXT",
            })
            c.Abort()
            return
        }

        for _, role := range roles {
            if string(userClaims.Role) == role {
                c.Next()
                return
            }
        }

        c.JSON(http.StatusForbidden, gin.H{
            "error": "Insufficient permissions",
            "code":  "INSUFFICIENT_PERMISSIONS",
            "required_roles": roles,
            "user_role": userClaims.Role,
        })
        c.Abort()
    }
}

// RequireAdmin ensures the user is an admin
func (am *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
    return am.RequireRole("admin")
}

// RequireCreator ensures the user is a creator or admin
func (am *AuthMiddleware) RequireCreator() gin.HandlerFunc {
    return am.RequireRole("creator", "admin")
}

// RequireVerification ensures the user is verified
func (am *AuthMiddleware) RequireVerification() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, exists := c.Get(string(ClaimsContextKey))
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }

        userClaims, ok := claims.(*auth.Claims)
        if !ok {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Invalid authentication context",
                "code":  "INVALID_AUTH_CONTEXT",
            })
            c.Abort()
            return
        }

        if !userClaims.IsVerified {
            c.JSON(http.StatusForbidden, gin.H{
                "error": "Account verification required",
                "code":  "VERIFICATION_REQUIRED",
            })
            c.Abort()
            return
        }

        c.Next()
    }
}

// RequireSensitiveAuth requires a recent authentication for sensitive operations
func (am *AuthMiddleware) RequireSensitiveAuth(maxAge string) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := am.extractToken(c)
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }

        // Parse max age duration
        maxAgeDuration, err := time.ParseDuration(maxAge)
        if err != nil {
            maxAgeDuration = 15 * time.Minute // Default to 15 minutes
        }

        claims, err := am.jwtManager.ValidateForSensitiveOperation(token, maxAgeDuration)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Recent authentication required for this operation",
                "code":  "REAUTHENTICATION_REQUIRED",
            })
            c.Abort()
            return
        }

        c.Set(string(ClaimsContextKey), claims)
        c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), ClaimsContextKey, claims))
        
        c.Next()
    }
}

// RequireOwnership ensures the user can only access their own resources
func (am *AuthMiddleware) RequireOwnership(paramName string) gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, exists := c.Get(string(ClaimsContextKey))
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authentication required",
                "code":  "AUTH_REQUIRED",
            })
            c.Abort()
            return
        }

        userClaims, ok := claims.(*auth.Claims)
        if !ok {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Invalid authentication context",
                "code":  "INVALID_AUTH_CONTEXT",
            })
            c.Abort()
            return
        }

        // Admin can access everything
        if userClaims.IsAdmin() {
            c.Next()
            return
        }

        resourceUserID := c.Param(paramName)
        if resourceUserID != userClaims.UserID.String() {
            c.JSON(http.StatusForbidden, gin.H{
                "error": "Access denied: you can only access your own resources",
                "code":  "ACCESS_DENIED",
            })
            c.Abort()
            return
        }

        c.Next()
    }
}

// extractToken extracts the JWT token from various sources
func (am *AuthMiddleware) extractToken(c *gin.Context) string {
    // Check Authorization header
    authHeader := c.GetHeader("Authorization")
    if authHeader != "" {
        return am.jwtManager.ExtractTokenFromBearer(authHeader)
    }

    // Check query parameter
    token := c.Query("token")
    if token != "" {
        return token
    }

    // Check cookie
    token, err := c.Cookie("auth_token")
    if err == nil && token != "" {
        return token
    }

    return ""
}

// GetCurrentUser extracts the current user claims from context
func GetCurrentUser(c *gin.Context) (*auth.Claims, bool) {
    claims, exists := c.Get(string(ClaimsContextKey))
    if !exists {
        return nil, false
    }

    userClaims, ok := claims.(*auth.Claims)
    return userClaims, ok
}

// GetCurrentUserID extracts the current user ID from context
func GetCurrentUserID(c *gin.Context) (string, bool) {
    claims, exists := GetCurrentUser(c)
    if !exists {
        return "", false
    }
    return claims.UserID.String(), true
}

// IsCurrentUser checks if the given user ID matches the current user
func IsCurrentUser(c *gin.Context, userID string) bool {
    currentUserID, exists := GetCurrentUserID(c)
    if !exists {
        return false
    }
    return currentUserID == userID
}

// IsAdmin checks if the current user is an admin
func IsAdmin(c *gin.Context) bool {
    claims, exists := GetCurrentUser(c)
    if !exists {
        return false
    }
    return claims.IsAdmin()
}

// IsCreator checks if the current user is a creator
func IsCreator(c *gin.Context) bool {
    claims, exists := GetCurrentUser(c)
    if !exists {
        return false
    }
    return claims.IsCreator()
}

// RequireContentAccess middleware for checking content access permissions
func (am *AuthMiddleware) RequireContentAccess() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims, exists := GetCurrentUser(c)
        if !exists {
            // For free content, allow anonymous access
            c.Next()
            return
        }

        // Add user context for access control checks
        c.Set("user_id", claims.UserID.String())
        c.Set("user_role", claims.Role)
        c.Set("is_verified", claims.IsVerified)
        
        c.Next()
    }
}

// API Key middleware for service-to-service communication
func (am *AuthMiddleware) RequireAPIKey(validAPIKeys []string) gin.HandlerFunc {
    return func(c *gin.Context) {
        apiKey := c.GetHeader("X-API-Key")
        if apiKey == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "API key required",
                "code":  "API_KEY_REQUIRED",
            })
            c.Abort()
            return
        }

        for _, validKey := range validAPIKeys {
            if apiKey == validKey {
                c.Next()
                return
            }
        }

        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "Invalid API key",
            "code":  "INVALID_API_KEY",
        })
        c.Abort()
    }
}

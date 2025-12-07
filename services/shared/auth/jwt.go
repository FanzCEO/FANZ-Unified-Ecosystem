package auth

import (
    "errors"
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "github.com/fanzos/shared/models"
)

var (
    ErrInvalidToken = errors.New("invalid token")
    ErrExpiredToken = errors.New("token has expired")
    ErrInvalidClaims = errors.New("invalid token claims")
)

type JWTManager struct {
    secretKey []byte
    issuer    string
}

type Claims struct {
    UserID    uuid.UUID        `json:"user_id"`
    Username  string           `json:"username"`
    Email     string           `json:"email,omitempty"`
    Role      models.UserRole  `json:"role"`
    IsVerified bool            `json:"is_verified"`
    jwt.RegisteredClaims
}

func NewJWTManager(secretKey, issuer string) *JWTManager {
    return &JWTManager{
        secretKey: []byte(secretKey),
        issuer:    issuer,
    }
}

func (j *JWTManager) GenerateToken(user *models.User, duration time.Duration) (string, error) {
    claims := &Claims{
        UserID:     user.ID,
        Username:   user.Username,
        Role:       user.Role,
        IsVerified: user.IsVerified,
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    j.issuer,
            Subject:   user.ID.String(),
            Audience:  []string{"fanzos-api"},
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
            NotBefore: jwt.NewNumericDate(time.Now()),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            ID:        uuid.New().String(),
        },
    }

    if user.Email != nil {
        claims.Email = *user.Email
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(j.secretKey)
}

func (j *JWTManager) GenerateRefreshToken(userID uuid.UUID, duration time.Duration) (string, error) {
    claims := &jwt.RegisteredClaims{
        Issuer:    j.issuer,
        Subject:   userID.String(),
        Audience:  []string{"fanzos-refresh"},
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
        NotBefore: jwt.NewNumericDate(time.Now()),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
        ID:        uuid.New().String(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(j.secretKey)
}

func (j *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidToken
        }
        return j.secretKey, nil
    })

    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return nil, ErrExpiredToken
        }
        return nil, ErrInvalidToken
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, ErrInvalidClaims
    }

    return claims, nil
}

func (j *JWTManager) ValidateRefreshToken(tokenString string) (uuid.UUID, error) {
    token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidToken
        }
        return j.secretKey, nil
    })

    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return uuid.Nil, ErrExpiredToken
        }
        return uuid.Nil, ErrInvalidToken
    }

    claims, ok := token.Claims.(*jwt.RegisteredClaims)
    if !ok || !token.Valid {
        return uuid.Nil, ErrInvalidClaims
    }

    // Validate audience
    validAudience := false
    for _, aud := range claims.Audience {
        if aud == "fanzos-refresh" {
            validAudience = true
            break
        }
    }
    if !validAudience {
        return uuid.Nil, ErrInvalidClaims
    }

    userID, err := uuid.Parse(claims.Subject)
    if err != nil {
        return uuid.Nil, ErrInvalidClaims
    }

    return userID, nil
}

func (j *JWTManager) ExtractTokenFromBearer(bearerToken string) string {
    if len(bearerToken) > 7 && bearerToken[:7] == "Bearer " {
        return bearerToken[7:]
    }
    return bearerToken
}

// TokenPair represents an access/refresh token pair
type TokenPair struct {
    AccessToken  string    `json:"access_token"`
    RefreshToken string    `json:"refresh_token"`
    TokenType    string    `json:"token_type"`
    ExpiresIn    int64     `json:"expires_in"`
    ExpiresAt    time.Time `json:"expires_at"`
}

func (j *JWTManager) GenerateTokenPair(user *models.User) (*TokenPair, error) {
    accessTokenDuration := 24 * time.Hour  // 24 hours
    refreshTokenDuration := 30 * 24 * time.Hour  // 30 days

    accessToken, err := j.GenerateToken(user, accessTokenDuration)
    if err != nil {
        return nil, err
    }

    refreshToken, err := j.GenerateRefreshToken(user.ID, refreshTokenDuration)
    if err != nil {
        return nil, err
    }

    expiresAt := time.Now().Add(accessTokenDuration)

    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        TokenType:    "Bearer",
        ExpiresIn:    int64(accessTokenDuration.Seconds()),
        ExpiresAt:    expiresAt,
    }, nil
}

// SessionInfo represents session information
type SessionInfo struct {
    UserID       uuid.UUID       `json:"user_id"`
    Username     string          `json:"username"`
    Email        string          `json:"email,omitempty"`
    Role         models.UserRole `json:"role"`
    IsVerified   bool            `json:"is_verified"`
    SessionID    string          `json:"session_id"`
    ExpiresAt    time.Time       `json:"expires_at"`
}

func (c *Claims) ToSessionInfo() *SessionInfo {
    return &SessionInfo{
        UserID:     c.UserID,
        Username:   c.Username,
        Email:      c.Email,
        Role:       c.Role,
        IsVerified: c.IsVerified,
        SessionID:  c.ID,
        ExpiresAt:  c.ExpiresAt.Time,
    }
}

// Helper functions for role checking
func (c *Claims) IsAdmin() bool {
    return c.Role == models.RoleAdmin
}

func (c *Claims) IsCreator() bool {
    return c.Role == models.RoleCreator
}

func (c *Claims) IsFan() bool {
    return c.Role == models.RoleFanz
}

func (c *Claims) CanModerate() bool {
    return c.Role == models.RoleAdmin
}

func (c *Claims) CanCreateContent() bool {
    return c.Role == models.RoleCreator || c.Role == models.RoleAdmin
}

func (c *Claims) RequiresVerification() bool {
    return !c.IsVerified && (c.Role == models.RoleCreator || c.Role == models.RoleAdmin)
}

// Custom validator for sensitive operations
func (j *JWTManager) ValidateForSensitiveOperation(tokenString string, maxAge time.Duration) (*Claims, error) {
    claims, err := j.ValidateToken(tokenString)
    if err != nil {
        return nil, err
    }

    // Check if token is too old for sensitive operations
    if time.Since(claims.IssuedAt.Time) > maxAge {
        return nil, errors.New("token too old for sensitive operation")
    }

    return claims, nil
}

// Blacklist manager for token revocation
type TokenBlacklist struct {
    revokedTokens map[string]time.Time
}

func NewTokenBlacklist() *TokenBlacklist {
    return &TokenBlacklist{
        revokedTokens: make(map[string]time.Time),
    }
}

func (tb *TokenBlacklist) RevokeToken(jti string, expiresAt time.Time) {
    tb.revokedTokens[jti] = expiresAt
}

func (tb *TokenBlacklist) IsRevoked(jti string) bool {
    expiresAt, exists := tb.revokedTokens[jti]
    if !exists {
        return false
    }

    // Clean up expired tokens
    if time.Now().After(expiresAt) {
        delete(tb.revokedTokens, jti)
        return false
    }

    return true
}

func (tb *TokenBlacklist) CleanupExpired() {
    now := time.Now()
    for jti, expiresAt := range tb.revokedTokens {
        if now.After(expiresAt) {
            delete(tb.revokedTokens, jti)
        }
    }
}

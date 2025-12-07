package models

import (
    "fmt"
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type UserRole string
type AuthProvider string
type CreatorStatus string

const (
    RoleFanz    UserRole = "fanz"
    RoleCreator UserRole = "creator"
    RoleAdmin   UserRole = "admin"
)

const (
    AuthEmail     AuthProvider = "email"
    AuthPhone     AuthProvider = "phone"
    AuthGoogle    AuthProvider = "google"
    AuthFacebook  AuthProvider = "facebook"
    AuthTwitter   AuthProvider = "twitter"
    AuthInstagram AuthProvider = "instagram"
    AuthReddit    AuthProvider = "reddit"
    AuthTikTok    AuthProvider = "tiktok"
    AuthDiscord   AuthProvider = "discord"
    AuthApple     AuthProvider = "apple"
)

const (
    CreatorActive       CreatorStatus = "active"
    CreatorInactive     CreatorStatus = "inactive"
    CreatorWarning      CreatorStatus = "warning"
    CreatorSuspended    CreatorStatus = "suspended"
    CreatorTopPerformer CreatorStatus = "top_performer"
)

type User struct {
    ID                uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    Username          string         `json:"username" gorm:"uniqueIndex;size:50;not null"`
    Email             *string        `json:"email,omitempty" gorm:"uniqueIndex;size:255"`
    Phone             *string        `json:"phone,omitempty" gorm:"uniqueIndex;size:20"`
    PasswordHash      *string        `json:"-" gorm:"size:255"`
    DisplayName       *string        `json:"display_name" gorm:"size:100"`
    Bio               *string        `json:"bio" gorm:"type:text"`
    AvatarURL         *string        `json:"avatar_url" gorm:"size:500"`
    CoverURL          *string        `json:"cover_url" gorm:"size:500"`
    Role              UserRole       `json:"role" gorm:"type:user_role;not null;default:'fanz'"`
    CreatorStatus     *CreatorStatus `json:"creator_status,omitempty" gorm:"type:creator_status"`
    IsVerified        bool           `json:"is_verified" gorm:"default:false"`
    IsEmailVerified   bool           `json:"is_email_verified" gorm:"default:false"`
    IsPhoneVerified   bool           `json:"is_phone_verified" gorm:"default:false"`
    IsAgeVerified     bool           `json:"is_age_verified" gorm:"default:false"`
    BirthDate         *time.Time     `json:"birth_date,omitempty" gorm:"type:date"`
    Location          *string        `json:"location" gorm:"size:100"`
    Timezone          *string        `json:"timezone" gorm:"size:50"`
    Language          string         `json:"language" gorm:"size:10;default:'en'"`
    WalletBalance     float64        `json:"wallet_balance" gorm:"type:decimal(10,2);default:0.00"`
    EarningsTotal     float64        `json:"earnings_total" gorm:"type:decimal(12,2);default:0.00"`
    FollowersCount    int            `json:"followers_count" gorm:"default:0"`
    FollowingCount    int            `json:"following_count" gorm:"default:0"`
    PostsCount        int            `json:"posts_count" gorm:"default:0"`
    LastLoginAt       *time.Time     `json:"last_login_at"`
    LastActiveAt      *time.Time     `json:"last_active_at"`
    Settings          map[string]interface{} `json:"settings" gorm:"type:jsonb;default:'{}'"`
    Preferences       map[string]interface{} `json:"preferences" gorm:"type:jsonb;default:'{}'"`
    IsActive          bool           `json:"is_active" gorm:"default:true"`
    IsBanned          bool           `json:"is_banned" gorm:"default:false"`
    BanReason         *string        `json:"ban_reason,omitempty" gorm:"type:text"`
    CreatedAt         time.Time      `json:"created_at" gorm:"default:now()"`
    UpdatedAt         time.Time      `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Sessions        []Session        `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    AuthProviders   []AuthProviderRecord `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Posts           []Post           `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    ShortVideos     []ShortVideo     `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Subscriptions   []Subscription   `json:"-" gorm:"foreignKey:FanID;constraint:OnDelete:CASCADE"`
    CreatorSubs     []Subscription   `json:"-" gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE"`
}

type Session struct {
    ID               uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID           uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    TokenHash        string                 `json:"-" gorm:"size:255;not null"`
    RefreshTokenHash *string                `json:"-" gorm:"size:255"`
    DeviceInfo       map[string]interface{} `json:"device_info" gorm:"type:jsonb"`
    IPAddress        string                 `json:"ip_address" gorm:"type:inet"`
    UserAgent        *string                `json:"user_agent" gorm:"type:text"`
    IsActive         bool                   `json:"is_active" gorm:"default:true"`
    ExpiresAt        time.Time              `json:"expires_at" gorm:"not null"`
    CreatedAt        time.Time              `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type AuthProviderRecord struct {
    ID           uuid.UUID                `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID       uuid.UUID                `json:"user_id" gorm:"type:uuid;not null"`
    Provider     AuthProvider             `json:"provider" gorm:"type:auth_provider;not null"`
    ProviderID   string                   `json:"provider_id" gorm:"size:255;not null"`
    ProviderEmail *string                 `json:"provider_email" gorm:"size:255"`
    ProviderData map[string]interface{}   `json:"provider_data" gorm:"type:jsonb"`
    IsPrimary    bool                     `json:"is_primary" gorm:"default:false"`
    CreatedAt    time.Time                `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// User methods
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.ID == uuid.Nil {
        u.ID = uuid.New()
    }
    return nil
}

func (u *User) IsCreator() bool {
    return u.Role == RoleCreator
}

func (u *User) IsAdmin() bool {
    return u.Role == RoleAdmin
}

func (u *User) CanPost() bool {
    return u.IsActive && !u.IsBanned && (u.Role == RoleCreator || u.Role == RoleAdmin)
}

func (u *User) CanModerate() bool {
    return u.Role == RoleAdmin
}

// Validation methods
func (u *User) ValidateUsername() error {
    if len(u.Username) < 3 || len(u.Username) > 50 {
        return fmt.Errorf("username must be between 3 and 50 characters")
    }
    // Add more validation rules as needed
    return nil
}

func (u *User) ValidateEmail() error {
    if u.Email == nil || *u.Email == "" {
        return nil // Email is optional
    }
    // Add email validation logic
    return nil
}

// Profile update methods
func (u *User) UpdateProfile(displayName, bio, location string) {
    if displayName != "" {
        u.DisplayName = &displayName
    }
    if bio != "" {
        u.Bio = &bio
    }
    if location != "" {
        u.Location = &location
    }
    u.UpdatedAt = time.Now()
}

func (u *User) UpdateAvatar(avatarURL string) {
    u.AvatarURL = &avatarURL
    u.UpdatedAt = time.Now()
}

func (u *User) UpdateCover(coverURL string) {
    u.CoverURL = &coverURL
    u.UpdatedAt = time.Now()
}

// Verification methods
func (u *User) VerifyEmail() {
    u.IsEmailVerified = true
    u.UpdatedAt = time.Now()
}

func (u *User) VerifyPhone() {
    u.IsPhoneVerified = true
    u.UpdatedAt = time.Now()
}

func (u *User) VerifyAge() {
    u.IsAgeVerified = true
    u.UpdatedAt = time.Now()
}

func (u *User) GrantVerification() {
    u.IsVerified = true
    u.UpdatedAt = time.Now()
}

// Creator status methods
func (u *User) PromoteToCreator() {
    u.Role = RoleCreator
    status := CreatorActive
    u.CreatorStatus = &status
    u.UpdatedAt = time.Now()
}

func (u *User) SuspendCreator(reason string) {
    status := CreatorSuspended
    u.CreatorStatus = &status
    u.BanReason = &reason
    u.UpdatedAt = time.Now()
}

func (u *User) ReactivateCreator() {
    status := CreatorActive
    u.CreatorStatus = &status
    u.BanReason = nil
    u.UpdatedAt = time.Now()
}

// Wallet methods
func (u *User) AddToWallet(amount float64) {
    u.WalletBalance += amount
    u.UpdatedAt = time.Now()
}

func (u *User) DeductFromWallet(amount float64) error {
    if u.WalletBalance < amount {
        return fmt.Errorf("insufficient wallet balance")
    }
    u.WalletBalance -= amount
    u.UpdatedAt = time.Now()
    return nil
}

func (u *User) AddEarnings(amount float64) {
    u.EarningsTotal += amount
    u.UpdatedAt = time.Now()
}

// Activity tracking
func (u *User) UpdateLastLogin() {
    now := time.Now()
    u.LastLoginAt = &now
    u.LastActiveAt = &now
    u.UpdatedAt = now
}

func (u *User) UpdateLastActive() {
    now := time.Now()
    u.LastActiveAt = &now
    u.UpdatedAt = now
}

// Ban/unban methods
func (u *User) Ban(reason string) {
    u.IsBanned = true
    u.IsActive = false
    u.BanReason = &reason
    u.UpdatedAt = time.Now()
}

func (u *User) Unban() {
    u.IsBanned = false
    u.IsActive = true
    u.BanReason = nil
    u.UpdatedAt = time.Now()
}

// Statistics methods
func (u *User) IncrementFollowers() {
    u.FollowersCount++
    u.UpdatedAt = time.Now()
}

func (u *User) DecrementFollowers() {
    if u.FollowersCount > 0 {
        u.FollowersCount--
    }
    u.UpdatedAt = time.Now()
}

func (u *User) IncrementFollowing() {
    u.FollowingCount++
    u.UpdatedAt = time.Now()
}

func (u *User) DecrementFollowing() {
    if u.FollowingCount > 0 {
        u.FollowingCount--
    }
    u.UpdatedAt = time.Now()
}

func (u *User) IncrementPosts() {
    u.PostsCount++
    u.UpdatedAt = time.Now()
}

func (u *User) DecrementPosts() {
    if u.PostsCount > 0 {
        u.PostsCount--
    }
    u.UpdatedAt = time.Now()
}

// Creator Analytics model
type CreatorAnalytics struct {
    ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatorID uuid.UUID `json:"creator_id" gorm:"type:uuid;not null"`
    Date      time.Time `json:"date" gorm:"not null"`
    Views     int64     `json:"views" gorm:"default:0"`
    Likes     int64     `json:"likes" gorm:"default:0"`
    Comments  int64     `json:"comments" gorm:"default:0"`
    Shares    int64     `json:"shares" gorm:"default:0"`
    Revenue   float64   `json:"revenue" gorm:"default:0"`
    NewFans   int64     `json:"new_fans" gorm:"default:0"`
    CreatedAt time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
    
    Creator User `json:"creator" gorm:"foreignKey:CreatorID"`
}

// Compliance and Verification models
type ComplianceRecord struct {
    ID                 uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID             uuid.UUID        `json:"user_id" gorm:"type:uuid;not null"`
    RecordType         string           `json:"record_type" gorm:"size:50;not null"`
    Status             ComplianceStatus `json:"status" gorm:"type:compliance_status;not null;default:'pending'"`
    VerificationMethod string           `json:"verification_method" gorm:"size:100"`
    VerificationData   *string          `json:"verification_data,omitempty" gorm:"type:text"`
    Notes              string           `json:"notes" gorm:"type:text"`
    ReviewedBy         *uuid.UUID       `json:"reviewed_by" gorm:"type:uuid"`
    ReviewedAt         *time.Time       `json:"reviewed_at"`
    ExpiresAt          *time.Time       `json:"expires_at"`
    CreatedAt          time.Time        `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt          time.Time        `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
    
    User     User  `json:"user" gorm:"foreignKey:UserID"`
    Reviewer *User `json:"reviewer,omitempty" gorm:"foreignKey:ReviewedBy"`
}

type UploadedDocument struct {
    ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
    DocumentType string    `json:"document_type" gorm:"size:100;not null"`
    FileName     string    `json:"file_name" gorm:"size:255;not null"`
    FileURL      string    `json:"file_url" gorm:"size:500;not null"`
    FileSize     int64     `json:"file_size" gorm:"not null"`
    MimeType     string    `json:"mime_type" gorm:"size:100;not null"`
    IsVerified   bool      `json:"is_verified" gorm:"default:false"`
    CreatedAt    time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt    time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
    
    User User `json:"user" gorm:"foreignKey:UserID"`
}

// Audit Log model for tracking user actions
type AuditLog struct {
    ID          uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID      uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    Action      string                 `json:"action" gorm:"size:100;not null"`
    ResourceType string                `json:"resource_type" gorm:"size:100"`
    ResourceID  *uuid.UUID             `json:"resource_id" gorm:"type:uuid"`
    Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
    IPAddress   string                 `json:"ip_address" gorm:"size:45"`
    UserAgent   string                 `json:"user_agent" gorm:"type:text"`
    CreatedAt   time.Time              `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
    
    User User `json:"user" gorm:"foreignKey:UserID"`
}

// VerifyMyVerification model for external verification service
type VerifyMyVerification struct {
    ID               uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID           uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    VerificationID   string                 `json:"verification_id" gorm:"size:255;not null;uniqueIndex"`
    Status           string                 `json:"status" gorm:"size:50;not null;default:'pending'"`
    VerificationType string                 `json:"verification_type" gorm:"size:100"`
    DocumentType     string                 `json:"document_type" gorm:"size:100"`
    VerifiedData     map[string]interface{} `json:"verified_data" gorm:"type:jsonb"`
    WebhookData      map[string]interface{} `json:"webhook_data" gorm:"type:jsonb"`
    CreatedAt        time.Time              `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt        time.Time              `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
    
    User User `json:"user" gorm:"foreignKey:UserID"`
}

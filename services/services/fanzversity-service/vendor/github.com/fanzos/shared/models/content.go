package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
    "github.com/lib/pq"
)

type PostType string
type ModerationStatus string
type ContentClassification string
type VideoEffectType string
type ReactionType string
type HashtagCategory string

const (
    PostFree            PostType = "free"
    PostPPV             PostType = "ppv"
    PostSubscriptionOnly PostType = "subscription_only"
)

const (
    ModerationPending      ModerationStatus = "pending"
    ModerationApproved     ModerationStatus = "approved"
    ModerationRejected     ModerationStatus = "rejected"
    ModerationFlagged      ModerationStatus = "flagged"
    ModerationManualReview ModerationStatus = "manual_review"
)

const (
    ClassificationSafe           ContentClassification = "safe"
    ClassificationAdultContent   ContentClassification = "adult_content"
    ClassificationExplicitNudity ContentClassification = "explicit_nudity"
    ClassificationViolence       ContentClassification = "violence"
    ClassificationHateSpeech     ContentClassification = "hate_speech"
)

const (
    EffectFilter     VideoEffectType = "filter"
    EffectOverlay    VideoEffectType = "overlay"
    EffectTransition VideoEffectType = "transition"
    EffectText       VideoEffectType = "text"
    EffectSticker    VideoEffectType = "sticker"
    EffectMusic      VideoEffectType = "music"
    EffectSpeed      VideoEffectType = "speed"
)

const (
    ReactionLike      ReactionType = "like"
    ReactionLove      ReactionType = "love"
    ReactionFire      ReactionType = "fire"
    ReactionWow       ReactionType = "wow"
    ReactionLaugh     ReactionType = "laugh"
    ReactionHeartEyes ReactionType = "heart_eyes"
    ReactionTongue    ReactionType = "tongue"
    ReactionWink      ReactionType = "wink"
)

const (
    HashtagTrending  HashtagCategory = "trending"
    HashtagAdult     HashtagCategory = "adult"
    HashtagLifestyle HashtagCategory = "lifestyle"
    HashtagFitness   HashtagCategory = "fitness"
    HashtagFashion   HashtagCategory = "fashion"
    HashtagMusic     HashtagCategory = "music"
    HashtagGaming    HashtagCategory = "gaming"
    HashtagArt       HashtagCategory = "art"
)

type Post struct {
    ID                uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID            uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    Title             *string                `json:"title" gorm:"size:255"`
    Content           *string                `json:"content" gorm:"type:text"`
    Type              PostType               `json:"type" gorm:"type:post_type;not null;default:'free'"`
    Price             *float64               `json:"price,omitempty" gorm:"type:decimal(8,2)"`
    MediaURLs         pq.StringArray         `json:"media_urls" gorm:"type:text[]"`
    ThumbnailURL      *string                `json:"thumbnail_url" gorm:"size:500"`
    Tags              pq.StringArray         `json:"tags" gorm:"type:text[]"`
    ViewCount         int                    `json:"view_count" gorm:"default:0"`
    LikeCount         int                    `json:"like_count" gorm:"default:0"`
    CommentCount      int                    `json:"comment_count" gorm:"default:0"`
    ShareCount        int                    `json:"share_count" gorm:"default:0"`
    PPVUnlockCount    int                    `json:"ppv_unlock_count" gorm:"default:0"`
    IsPinned          bool                   `json:"is_pinned" gorm:"default:false"`
    IsFeatured        bool                   `json:"is_featured" gorm:"default:false"`
    ScheduledAt       *time.Time             `json:"scheduled_at"`
    PublishedAt       *time.Time             `json:"published_at"`
    ModerationStatus  ModerationStatus       `json:"moderation_status" gorm:"type:moderation_status;default:'pending'"`
    Classification    ContentClassification  `json:"classification" gorm:"type:content_classification;default:'safe'"`
    IsActive          bool                   `json:"is_active" gorm:"default:true"`
    CreatedAt         time.Time              `json:"created_at" gorm:"default:now()"`
    UpdatedAt         time.Time              `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User      User        `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Likes     []Like      `json:"-" gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE"`
    Comments  []Comment   `json:"-" gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE"`
    PPVUnlocks []PPVUnlock `json:"-" gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE"`
}

type ShortVideo struct {
    ID                uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID            uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    Title             *string                `json:"title" gorm:"size:255"`
    Description       *string                `json:"description" gorm:"type:text"`
    VideoURL          string                 `json:"video_url" gorm:"size:500;not null"`
    ThumbnailURL      *string                `json:"thumbnail_url" gorm:"size:500"`
    Duration          *int                   `json:"duration"` // in seconds
    Type              PostType               `json:"type" gorm:"type:post_type;not null;default:'free'"`
    Price             *float64               `json:"price,omitempty" gorm:"type:decimal(8,2)"`
    ViewCount         int                    `json:"view_count" gorm:"default:0"`
    LikeCount         int                    `json:"like_count" gorm:"default:0"`
    CommentCount      int                    `json:"comment_count" gorm:"default:0"`
    ShareCount        int                    `json:"share_count" gorm:"default:0"`
    DuetCount         int                    `json:"duet_count" gorm:"default:0"`
    IsDuet            bool                   `json:"is_duet" gorm:"default:false"`
    OriginalVideoID   *uuid.UUID             `json:"original_video_id,omitempty" gorm:"type:uuid"`
    IsFeatured        bool                   `json:"is_featured" gorm:"default:false"`
    ModerationStatus  ModerationStatus       `json:"moderation_status" gorm:"type:moderation_status;default:'pending'"`
    Classification    ContentClassification  `json:"classification" gorm:"type:content_classification;default:'safe'"`
    TrendingScore     float64                `json:"trending_score" gorm:"default:0.0"`
    EngagementScore   float64                `json:"engagement_score" gorm:"default:0.0"`
    CreatedAt         time.Time              `json:"created_at" gorm:"default:now()"`
    UpdatedAt         time.Time              `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User          User                    `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    OriginalVideo *ShortVideo             `json:"original_video,omitempty" gorm:"foreignKey:OriginalVideoID"`
    Effects       []VideoEffect           `json:"effects" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
    Hashtags      []Hashtag               `json:"hashtags" gorm:"many2many:short_video_hashtags"`
    Reactions     []ShortVideoReaction    `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
    Views         []ShortVideoView        `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
    Comments      []Comment               `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
}

type VideoEffect struct {
    ID            uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    ShortVideoID  uuid.UUID       `json:"short_video_id" gorm:"type:uuid;not null"`
    EffectType    VideoEffectType `json:"effect_type" gorm:"type:video_effect_type;not null"`
    EffectName    *string         `json:"effect_name" gorm:"size:100"`
    EffectData    map[string]interface{} `json:"effect_data" gorm:"type:jsonb"`
    StartTime     *float64        `json:"start_time"` // in seconds
    EndTime       *float64        `json:"end_time"`
    CreatedAt     time.Time       `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    ShortVideo ShortVideo `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
}

type Hashtag struct {
    ID          uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    Tag         string          `json:"tag" gorm:"uniqueIndex;size:100;not null"`
    UsageCount  int             `json:"usage_count" gorm:"default:0"`
    Category    *HashtagCategory `json:"category,omitempty" gorm:"type:hashtag_category"`
    IsTrending  bool            `json:"is_trending" gorm:"default:false"`
    IsBanned    bool            `json:"is_banned" gorm:"default:false"`
    CreatedAt   time.Time       `json:"created_at" gorm:"default:now()"`
    UpdatedAt   time.Time       `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    ShortVideos []ShortVideo `json:"-" gorm:"many2many:short_video_hashtags"`
}

type ShortVideoReaction struct {
    ID            uuid.UUID    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID        uuid.UUID    `json:"user_id" gorm:"type:uuid;not null"`
    ShortVideoID  uuid.UUID    `json:"short_video_id" gorm:"type:uuid;not null"`
    ReactionType  ReactionType `json:"reaction_type" gorm:"type:reaction_type;not null"`
    CreatedAt     time.Time    `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User       User       `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    ShortVideo ShortVideo `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
}

type ShortVideoView struct {
    ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID       *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
    ShortVideoID uuid.UUID  `json:"short_video_id" gorm:"type:uuid;not null"`
    IPAddress    *string    `json:"ip_address,omitempty" gorm:"type:inet"`
    UserAgent    *string    `json:"user_agent,omitempty" gorm:"type:text"`
    ViewDuration *int       `json:"view_duration,omitempty"` // in seconds
    Completed    bool       `json:"completed" gorm:"default:false"`
    CreatedAt    time.Time  `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User       *User      `json:"user,omitempty" gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL"`
    ShortVideo ShortVideo `json:"-" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
}

type Like struct {
    ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null"`
    PostID       *uuid.UUID `json:"post_id,omitempty" gorm:"type:uuid"`
    ShortVideoID *uuid.UUID `json:"short_video_id,omitempty" gorm:"type:uuid"`
    CreatedAt    time.Time  `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User       User        `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Post       *Post       `json:"post,omitempty" gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE"`
    ShortVideo *ShortVideo `json:"short_video,omitempty" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
}

type Comment struct {
    ID               uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID           uuid.UUID        `json:"user_id" gorm:"type:uuid;not null"`
    PostID           *uuid.UUID       `json:"post_id,omitempty" gorm:"type:uuid"`
    ShortVideoID     *uuid.UUID       `json:"short_video_id,omitempty" gorm:"type:uuid"`
    ParentID         *uuid.UUID       `json:"parent_id,omitempty" gorm:"type:uuid"`
    Content          string           `json:"content" gorm:"type:text;not null"`
    LikeCount        int              `json:"like_count" gorm:"default:0"`
    ReplyCount       int              `json:"reply_count" gorm:"default:0"`
    IsPinned         bool             `json:"is_pinned" gorm:"default:false"`
    ModerationStatus ModerationStatus `json:"moderation_status" gorm:"type:moderation_status;default:'approved'"`
    CreatedAt        time.Time        `json:"created_at" gorm:"default:now()"`
    UpdatedAt        time.Time        `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User       User        `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Post       *Post       `json:"post,omitempty" gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE"`
    ShortVideo *ShortVideo `json:"short_video,omitempty" gorm:"foreignKey:ShortVideoID;constraint:OnDelete:CASCADE"`
    Parent     *Comment    `json:"parent,omitempty" gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE"`
    Replies    []Comment   `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
}

type AlgorithmPreference struct {
    ID                  uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID              uuid.UUID              `json:"user_id" gorm:"type:uuid;not null;uniqueIndex"`
    CategoryWeights     map[string]interface{} `json:"category_weights" gorm:"type:jsonb"`
    InteractionHistory  map[string]interface{} `json:"interaction_history" gorm:"type:jsonb"`
    ContentFilters      map[string]interface{} `json:"content_filters" gorm:"type:jsonb"`
    UpdatedAt           time.Time              `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// Post methods
func (p *Post) BeforeCreate(tx *gorm.DB) error {
    if p.ID == uuid.Nil {
        p.ID = uuid.New()
    }
    return nil
}

func (p *Post) IsPaid() bool {
    return p.Type == PostPPV || p.Type == PostSubscriptionOnly
}

func (p *Post) IsPublished() bool {
    return p.PublishedAt != nil && p.PublishedAt.Before(time.Now())
}

func (p *Post) IsScheduled() bool {
    return p.ScheduledAt != nil && p.ScheduledAt.After(time.Now())
}

func (p *Post) CanView(user *User) bool {
    if !p.IsActive || p.ModerationStatus != ModerationApproved {
        return false
    }
    
    if p.Type == PostFree {
        return true
    }
    
    // Add subscription and PPV unlock checks here
    return false
}

func (p *Post) Publish() {
    now := time.Now()
    p.PublishedAt = &now
    p.UpdatedAt = now
}

func (p *Post) IncrementViews() {
    p.ViewCount++
    p.UpdatedAt = time.Now()
}

func (p *Post) IncrementLikes() {
    p.LikeCount++
    p.UpdatedAt = time.Now()
}

func (p *Post) DecrementLikes() {
    if p.LikeCount > 0 {
        p.LikeCount--
    }
    p.UpdatedAt = time.Now()
}

func (p *Post) IncrementComments() {
    p.CommentCount++
    p.UpdatedAt = time.Now()
}

func (p *Post) DecrementComments() {
    if p.CommentCount > 0 {
        p.CommentCount--
    }
    p.UpdatedAt = time.Now()
}

func (p *Post) IncrementShares() {
    p.ShareCount++
    p.UpdatedAt = time.Now()
}

func (p *Post) IncrementPPVUnlocks() {
    p.PPVUnlockCount++
    p.UpdatedAt = time.Now()
}

// ShortVideo methods
func (sv *ShortVideo) BeforeCreate(tx *gorm.DB) error {
    if sv.ID == uuid.Nil {
        sv.ID = uuid.New()
    }
    return nil
}

func (sv *ShortVideo) CalculateEngagementScore() {
    // Simple engagement score calculation
    totalEngagement := float64(sv.LikeCount + sv.CommentCount + sv.ShareCount + sv.DuetCount)
    views := float64(sv.ViewCount)
    
    if views > 0 {
        sv.EngagementScore = (totalEngagement / views) * 100
    } else {
        sv.EngagementScore = 0
    }
    sv.UpdatedAt = time.Now()
}

func (sv *ShortVideo) CalculateTrendingScore() {
    // Trending score based on recent engagement and views
    now := time.Now()
    hoursAgo := now.Sub(sv.CreatedAt).Hours()
    
    if hoursAgo <= 0 {
        hoursAgo = 1
    }
    
    // Weight recent content higher
    timeDecay := 1.0 / (1.0 + hoursAgo/24.0) // Decay over days
    
    engagementWeight := float64(sv.LikeCount*3 + sv.CommentCount*5 + sv.ShareCount*10 + sv.DuetCount*15)
    viewWeight := float64(sv.ViewCount)
    
    sv.TrendingScore = (engagementWeight + viewWeight*0.1) * timeDecay
    sv.UpdatedAt = time.Now()
}

func (sv *ShortVideo) IncrementViews() {
    sv.ViewCount++
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

func (sv *ShortVideo) IncrementLikes() {
    sv.LikeCount++
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

func (sv *ShortVideo) DecrementLikes() {
    if sv.LikeCount > 0 {
        sv.LikeCount--
    }
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

func (sv *ShortVideo) IncrementComments() {
    sv.CommentCount++
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

func (sv *ShortVideo) IncrementShares() {
    sv.ShareCount++
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

func (sv *ShortVideo) IncrementDuets() {
    sv.DuetCount++
    sv.CalculateEngagementScore()
    sv.CalculateTrendingScore()
}

// Hashtag methods
func (h *Hashtag) BeforeCreate(tx *gorm.DB) error {
    if h.ID == uuid.Nil {
        h.ID = uuid.New()
    }
    return nil
}

func (h *Hashtag) IncrementUsage() {
    h.UsageCount++
    h.UpdatedAt = time.Now()
    
    // Auto-promote to trending if usage is high
    if h.UsageCount >= 100 && !h.IsTrending {
        h.IsTrending = true
    }
}

func (h *Hashtag) SetTrending(trending bool) {
    h.IsTrending = trending
    h.UpdatedAt = time.Now()
}

// Comment methods
func (c *Comment) BeforeCreate(tx *gorm.DB) error {
    if c.ID == uuid.Nil {
        c.ID = uuid.New()
    }
    return nil
}

func (c *Comment) IsReply() bool {
    return c.ParentID != nil
}

func (c *Comment) IncrementLikes() {
    c.LikeCount++
    c.UpdatedAt = time.Now()
}

func (c *Comment) IncrementReplies() {
    c.ReplyCount++
    c.UpdatedAt = time.Now()
}

func (c *Comment) Pin() {
    c.IsPinned = true
    c.UpdatedAt = time.Now()
}

func (c *Comment) Unpin() {
    c.IsPinned = false
    c.UpdatedAt = time.Now()
}

package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
    "github.com/lib/pq"
)

type NotificationType string

const (
    NotificationMessage      NotificationType = "message"
    NotificationLike         NotificationType = "like"
    NotificationComment      NotificationType = "comment"
    NotificationSubscription NotificationType = "subscription"
    NotificationTip          NotificationType = "tip"
    NotificationLiveStream   NotificationType = "live_stream"
    NotificationPostUpload   NotificationType = "post_upload"
    NotificationPPVUnlock    NotificationType = "ppv_unlock"
    NotificationSystem       NotificationType = "system"
    NotificationPromotion    NotificationType = "promotion"
    NotificationVerification NotificationType = "verification"
    NotificationCompliance   NotificationType = "compliance"
    NotificationModeration   NotificationType = "moderation"
    NotificationPayout       NotificationType = "payout"
)

type Message struct {
    ID             uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    ConversationID uuid.UUID      `json:"conversation_id" gorm:"type:uuid;not null"`
    SenderID       uuid.UUID      `json:"sender_id" gorm:"type:uuid;not null"`
    RecipientID    uuid.UUID      `json:"recipient_id" gorm:"type:uuid;not null"`
    Content        *string        `json:"content,omitempty" gorm:"type:text"`
    Type           string         `json:"type" gorm:"size:20;default:'text'"`
    MediaURLs      pq.StringArray `json:"media_urls,omitempty" gorm:"type:text[]"`
    Price          *float64       `json:"price,omitempty" gorm:"type:decimal(8,2)"`
    IsPPV          bool           `json:"is_ppv" gorm:"default:false"`
    IsRead         bool           `json:"is_read" gorm:"default:false"`
    ReadAt         *time.Time     `json:"read_at,omitempty"`
    IsDeleted      bool           `json:"is_deleted" gorm:"default:false"`
    ReplyToID      *uuid.UUID     `json:"reply_to_id,omitempty" gorm:"type:uuid"`
    CreatedAt      time.Time      `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    Sender    User     `json:"sender" gorm:"foreignKey:SenderID"`
    Recipient User     `json:"recipient" gorm:"foreignKey:RecipientID"`
    ReplyTo   *Message `json:"reply_to,omitempty" gorm:"foreignKey:ReplyToID"`
    PPVUnlock *PPVUnlock `json:"ppv_unlock,omitempty" gorm:"foreignKey:MessageID"`
}

type Conversation struct {
    ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    Participant1ID  uuid.UUID `json:"participant1_id" gorm:"type:uuid;not null"`
    Participant2ID  uuid.UUID `json:"participant2_id" gorm:"type:uuid;not null"`
    LastMessageID   *uuid.UUID `json:"last_message_id,omitempty" gorm:"type:uuid"`
    LastMessageAt   *time.Time `json:"last_message_at,omitempty"`
    UnreadCount1    int       `json:"unread_count1" gorm:"default:0"` // unread for participant1
    UnreadCount2    int       `json:"unread_count2" gorm:"default:0"` // unread for participant2
    IsMuted1        bool      `json:"is_muted1" gorm:"default:false"`
    IsMuted2        bool      `json:"is_muted2" gorm:"default:false"`
    IsArchived1     bool      `json:"is_archived1" gorm:"default:false"`
    IsArchived2     bool      `json:"is_archived2" gorm:"default:false"`
    CreatedAt       time.Time `json:"created_at" gorm:"default:now()"`
    UpdatedAt       time.Time `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Participant1  User      `json:"participant1" gorm:"foreignKey:Participant1ID"`
    Participant2  User      `json:"participant2" gorm:"foreignKey:Participant2ID"`
    LastMessage   *Message  `json:"last_message,omitempty" gorm:"foreignKey:LastMessageID"`
    Messages      []Message `json:"-" gorm:"foreignKey:ConversationID;constraint:OnDelete:CASCADE"`
}

type MessageReaction struct {
    ID        uuid.UUID    `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID    uuid.UUID    `json:"user_id" gorm:"type:uuid;not null"`
    MessageID uuid.UUID    `json:"message_id" gorm:"type:uuid;not null"`
    Reaction  ReactionType `json:"reaction" gorm:"type:reaction_type;not null"`
    CreatedAt time.Time    `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User    User    `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Message Message `json:"-" gorm:"foreignKey:MessageID;constraint:OnDelete:CASCADE"`
}

type MessageAttachment struct {
    ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    MessageID uuid.UUID `json:"message_id" gorm:"type:uuid;not null"`
    FileURL   string    `json:"file_url" gorm:"size:500;not null"`
    FileName  string    `json:"file_name" gorm:"size:255;not null"`
    FileSize  int64     `json:"file_size"`
    MimeType  string    `json:"mime_type" gorm:"size:100"`
    Width     *int      `json:"width,omitempty"`
    Height    *int      `json:"height,omitempty"`
    Duration  *int      `json:"duration,omitempty"` // for video/audio files
    CreatedAt time.Time `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    Message Message `json:"-" gorm:"foreignKey:MessageID;constraint:OnDelete:CASCADE"`
}

type AutomatedResponse struct {
    ID        uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID    uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    Trigger   string                 `json:"trigger" gorm:"size:100;not null"` // 'new_subscriber', 'first_message', etc.
    Message   string                 `json:"message" gorm:"type:text;not null"`
    IsActive  bool                   `json:"is_active" gorm:"default:true"`
    Settings  map[string]interface{} `json:"settings,omitempty" gorm:"type:jsonb"`
    CreatedAt time.Time              `json:"created_at" gorm:"default:now()"`
    UpdatedAt time.Time              `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type MessageTemplate struct {
    ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
    Name      string    `json:"name" gorm:"size:100;not null"`
    Content   string    `json:"content" gorm:"type:text;not null"`
    Category  *string   `json:"category,omitempty" gorm:"size:50"`
    UsageCount int      `json:"usage_count" gorm:"default:0"`
    CreatedAt time.Time `json:"created_at" gorm:"default:now()"`
    UpdatedAt time.Time `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type Notification struct {
    ID         uuid.UUID        `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID     uuid.UUID        `json:"user_id" gorm:"type:uuid;not null"`
    Type       NotificationType `json:"type" gorm:"type:notification_type;not null"`
    Title      string           `json:"title" gorm:"size:255;not null"`
    Message    string           `json:"message" gorm:"type:text;not null"`
    Data       map[string]interface{} `json:"data,omitempty" gorm:"type:jsonb"`
    IsRead     bool             `json:"is_read" gorm:"default:false"`
    ReadAt     *time.Time       `json:"read_at,omitempty"`
    ActionURL  *string          `json:"action_url,omitempty" gorm:"size:500"`
    ExpiresAt  *time.Time       `json:"expires_at,omitempty"`
    CreatedAt  time.Time        `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type PushToken struct {
    ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
    Token      string    `json:"token" gorm:"size:500;not null"`
    Platform   string    `json:"platform" gorm:"size:20;not null"` // 'ios', 'android', 'web'
    DeviceInfo map[string]interface{} `json:"device_info,omitempty" gorm:"type:jsonb"`
    IsActive   bool      `json:"is_active" gorm:"default:true"`
    CreatedAt  time.Time `json:"created_at" gorm:"default:now()"`
    UpdatedAt  time.Time `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// Message methods
func (m *Message) BeforeCreate(tx *gorm.DB) error {
    if m.ID == uuid.Nil {
        m.ID = uuid.New()
    }
    return nil
}

func (m *Message) MarkAsRead() {
    m.IsRead = true
    now := time.Now()
    m.ReadAt = &now
}

func (m *Message) IsMediaMessage() bool {
    return len(m.MediaURLs) > 0
}

func (m *Message) IsPaidMessage() bool {
    return m.IsPPV && m.Price != nil && *m.Price > 0
}

func (m *Message) CanView(userID uuid.UUID) bool {
    // Free messages can be viewed by sender or recipient
    if !m.IsPaidMessage() {
        return m.SenderID == userID || m.RecipientID == userID
    }
    
    // Sender can always view their own messages
    if m.SenderID == userID {
        return true
    }
    
    // For PPV messages, check if recipient has unlocked
    // This would require checking PPVUnlock table
    return false
}

func (m *Message) SoftDelete() {
    m.IsDeleted = true
}

// Conversation methods
func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
    if c.ID == uuid.Nil {
        c.ID = uuid.New()
    }
    return nil
}

func (c *Conversation) GetUnreadCount(userID uuid.UUID) int {
    if c.Participant1ID == userID {
        return c.UnreadCount1
    } else if c.Participant2ID == userID {
        return c.UnreadCount2
    }
    return 0
}

func (c *Conversation) IncrementUnreadCount(userID uuid.UUID) {
    if c.Participant1ID == userID {
        c.UnreadCount1++
    } else if c.Participant2ID == userID {
        c.UnreadCount2++
    }
    c.UpdatedAt = time.Now()
}

func (c *Conversation) ResetUnreadCount(userID uuid.UUID) {
    if c.Participant1ID == userID {
        c.UnreadCount1 = 0
    } else if c.Participant2ID == userID {
        c.UnreadCount2 = 0
    }
    c.UpdatedAt = time.Now()
}

func (c *Conversation) IsMuted(userID uuid.UUID) bool {
    if c.Participant1ID == userID {
        return c.IsMuted1
    } else if c.Participant2ID == userID {
        return c.IsMuted2
    }
    return false
}

func (c *Conversation) SetMuted(userID uuid.UUID, muted bool) {
    if c.Participant1ID == userID {
        c.IsMuted1 = muted
    } else if c.Participant2ID == userID {
        c.IsMuted2 = muted
    }
    c.UpdatedAt = time.Now()
}

func (c *Conversation) IsArchived(userID uuid.UUID) bool {
    if c.Participant1ID == userID {
        return c.IsArchived1
    } else if c.Participant2ID == userID {
        return c.IsArchived2
    }
    return false
}

func (c *Conversation) SetArchived(userID uuid.UUID, archived bool) {
    if c.Participant1ID == userID {
        c.IsArchived1 = archived
    } else if c.Participant2ID == userID {
        c.IsArchived2 = archived
    }
    c.UpdatedAt = time.Now()
}

func (c *Conversation) UpdateLastMessage(messageID uuid.UUID) {
    c.LastMessageID = &messageID
    now := time.Now()
    c.LastMessageAt = &now
    c.UpdatedAt = now
}

func (c *Conversation) GetOtherParticipant(userID uuid.UUID) uuid.UUID {
    if c.Participant1ID == userID {
        return c.Participant2ID
    }
    return c.Participant1ID
}

// Notification methods
func (n *Notification) BeforeCreate(tx *gorm.DB) error {
    if n.ID == uuid.Nil {
        n.ID = uuid.New()
    }
    return nil
}

func (n *Notification) MarkAsRead() {
    n.IsRead = true
    now := time.Now()
    n.ReadAt = &now
}

func (n *Notification) IsExpired() bool {
    return n.ExpiresAt != nil && n.ExpiresAt.Before(time.Now())
}

// AutomatedResponse methods
func (ar *AutomatedResponse) BeforeCreate(tx *gorm.DB) error {
    if ar.ID == uuid.Nil {
        ar.ID = uuid.New()
    }
    return nil
}

func (ar *AutomatedResponse) Activate() {
    ar.IsActive = true
    ar.UpdatedAt = time.Now()
}

func (ar *AutomatedResponse) Deactivate() {
    ar.IsActive = false
    ar.UpdatedAt = time.Now()
}

// MessageTemplate methods
func (mt *MessageTemplate) BeforeCreate(tx *gorm.DB) error {
    if mt.ID == uuid.Nil {
        mt.ID = uuid.New()
    }
    return nil
}

func (mt *MessageTemplate) IncrementUsage() {
    mt.UsageCount++
    mt.UpdatedAt = time.Now()
}

// PushToken methods
func (pt *PushToken) BeforeCreate(tx *gorm.DB) error {
    if pt.ID == uuid.Nil {
        pt.ID = uuid.New()
    }
    return nil
}

func (pt *PushToken) Deactivate() {
    pt.IsActive = false
    pt.UpdatedAt = time.Now()
}

func (pt *PushToken) UpdateDevice(deviceInfo map[string]interface{}) {
    pt.DeviceInfo = deviceInfo
    pt.UpdatedAt = time.Now()
}

package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type TransactionType string
type ComplianceStatus string

const (
    TransactionSubscription TransactionType = "subscription"
    TransactionTip         TransactionType = "tip"
    TransactionPPVUnlock   TransactionType = "ppv_unlock"
    TransactionWithdrawal  TransactionType = "withdrawal"
    TransactionDeposit     TransactionType = "deposit"
    TransactionRefund      TransactionType = "refund"
    TransactionChargeback  TransactionType = "chargeback"
)

const (
    CompliancePending     ComplianceStatus = "pending"
    ComplianceApproved    ComplianceStatus = "approved"
    ComplianceRejected    ComplianceStatus = "rejected"
    ComplianceExpired     ComplianceStatus = "expired"
    ComplianceUnderReview ComplianceStatus = "under_review"
)

type Subscription struct {
    ID                   uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    FanID                uuid.UUID  `json:"fan_id" gorm:"type:uuid;not null"`
    CreatorID            uuid.UUID  `json:"creator_id" gorm:"type:uuid;not null"`
    TierID               *uuid.UUID `json:"tier_id,omitempty" gorm:"type:uuid"`
    Status               string     `json:"status" gorm:"size:20;default:'active'"`
    Price                float64    `json:"price" gorm:"type:decimal(8,2);not null"`
    BillingCycle         string     `json:"billing_cycle" gorm:"size:20;default:'monthly'"`
    CurrentPeriodStart   *time.Time `json:"current_period_start"`
    CurrentPeriodEnd     *time.Time `json:"current_period_end"`
    TrialEnd             *time.Time `json:"trial_end,omitempty"`
    AutoRenew            bool       `json:"auto_renew" gorm:"default:true"`
    StripeSubscriptionID *string    `json:"stripe_subscription_id,omitempty" gorm:"size:255"`
    CCBillSubscriptionID *string    `json:"ccbill_subscription_id,omitempty" gorm:"size:255"`
    CreatedAt            time.Time  `json:"created_at" gorm:"default:now()"`
    UpdatedAt            time.Time  `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Fan     User `json:"fan" gorm:"foreignKey:FanID;constraint:OnDelete:CASCADE"`
    Creator User `json:"creator" gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE"`
}

type Transaction struct {
    ID                     uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID                 uuid.UUID       `json:"user_id" gorm:"type:uuid;not null"`
    Type                   TransactionType `json:"type" gorm:"type:transaction_type;not null"`
    Amount                 float64         `json:"amount" gorm:"type:decimal(10,2);not null"`
    Currency               string          `json:"currency" gorm:"size:10;default:'USD'"`
    Status                 string          `json:"status" gorm:"size:20;default:'pending'"`
    Description            *string         `json:"description,omitempty" gorm:"type:text"`
    ReferenceID            *string         `json:"reference_id,omitempty" gorm:"size:255"`
    Processor              *string         `json:"processor,omitempty" gorm:"size:50"`
    ProcessorTransactionID *string         `json:"processor_transaction_id,omitempty" gorm:"size:255"`
    FeeAmount              float64         `json:"fee_amount" gorm:"type:decimal(8,2);default:0.00"`
    NetAmount              *float64        `json:"net_amount,omitempty" gorm:"type:decimal(10,2)"`
    Metadata               map[string]interface{} `json:"metadata,omitempty" gorm:"type:jsonb"`
    CreatedAt              time.Time       `json:"created_at" gorm:"default:now()"`
    ProcessedAt            *time.Time      `json:"processed_at,omitempty"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID"`
}

type PPVUnlock struct {
    ID            uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID        uuid.UUID  `json:"user_id" gorm:"type:uuid;not null"`
    PostID        *uuid.UUID `json:"post_id,omitempty" gorm:"type:uuid"`
    MessageID     *uuid.UUID `json:"message_id,omitempty" gorm:"type:uuid"`
    Amount        float64    `json:"amount" gorm:"type:decimal(8,2);not null"`
    TransactionID *uuid.UUID `json:"transaction_id,omitempty" gorm:"type:uuid"`
    UnlockedAt    time.Time  `json:"unlocked_at" gorm:"default:now()"`
    
    // Relationships
    User        User         `json:"user" gorm:"foreignKey:UserID"`
    Post        *Post        `json:"post,omitempty" gorm:"foreignKey:PostID"`
    Message     *Message     `json:"message,omitempty" gorm:"foreignKey:MessageID"`
    Transaction *Transaction `json:"transaction,omitempty" gorm:"foreignKey:TransactionID"`
}

type PaymentMethod struct {
    ID             uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    UserID         uuid.UUID              `json:"user_id" gorm:"type:uuid;not null"`
    Type           string                 `json:"type" gorm:"size:50"` // 'card', 'bank_account', 'crypto_wallet', 'paypal'
    Processor      string                 `json:"processor" gorm:"size:50"` // 'stripe', 'ccbill', 'nowpayments'
    ProcessorID    *string                `json:"processor_id,omitempty" gorm:"size:255"`
    LastFour       *string                `json:"last_four,omitempty" gorm:"size:10"`
    Brand          *string                `json:"brand,omitempty" gorm:"size:50"`
    ExpiresAt      *time.Time             `json:"expires_at,omitempty" gorm:"type:date"`
    IsDefault      bool                   `json:"is_default" gorm:"default:false"`
    IsVerified     bool                   `json:"is_verified" gorm:"default:false"`
    BillingAddress map[string]interface{} `json:"billing_address,omitempty" gorm:"type:jsonb"`
    Metadata       map[string]interface{} `json:"metadata,omitempty" gorm:"type:jsonb"`
    CreatedAt      time.Time              `json:"created_at" gorm:"default:now()"`
    UpdatedAt      time.Time              `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    User User `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type CreatorPaymentMethod struct {
    ID        uuid.UUID              `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatorID uuid.UUID              `json:"creator_id" gorm:"type:uuid;not null"`
    Type      string                 `json:"type" gorm:"size:50"` // 'bank_account', 'paypal', 'crypto_wallet'
    Details   map[string]interface{} `json:"details" gorm:"type:jsonb"` // encrypted payment details
    IsVerified bool                  `json:"is_verified" gorm:"default:false"`
    IsPrimary  bool                  `json:"is_primary" gorm:"default:false"`
    CreatedAt  time.Time             `json:"created_at" gorm:"default:now()"`
    UpdatedAt  time.Time             `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Creator User `json:"creator" gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE"`
}

type Withdrawal struct {
    ID                     uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatorID              uuid.UUID  `json:"creator_id" gorm:"type:uuid;not null"`
    Amount                 float64    `json:"amount" gorm:"type:decimal(10,2);not null"`
    FeeAmount              float64    `json:"fee_amount" gorm:"type:decimal(8,2);default:0.00"`
    NetAmount              *float64   `json:"net_amount,omitempty" gorm:"type:decimal(10,2)"`
    Status                 string     `json:"status" gorm:"size:20;default:'pending'"`
    PaymentMethodID        *uuid.UUID `json:"payment_method_id,omitempty" gorm:"type:uuid"`
    Processor              *string    `json:"processor,omitempty" gorm:"size:50"`
    ProcessorTransactionID *string    `json:"processor_transaction_id,omitempty" gorm:"size:255"`
    ProcessedAt            *time.Time `json:"processed_at,omitempty"`
    CreatedAt              time.Time  `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    Creator       User                  `json:"creator" gorm:"foreignKey:CreatorID"`
    PaymentMethod *CreatorPaymentMethod `json:"payment_method,omitempty" gorm:"foreignKey:PaymentMethodID"`
}

type Refund struct {
    ID                   uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    OriginalTransactionID uuid.UUID  `json:"original_transaction_id" gorm:"type:uuid;not null"`
    Amount               float64    `json:"amount" gorm:"type:decimal(10,2);not null"`
    Reason               *string    `json:"reason,omitempty" gorm:"size:255"`
    Status               string     `json:"status" gorm:"size:20;default:'pending'"`
    ProcessorRefundID    *string    `json:"processor_refund_id,omitempty" gorm:"size:255"`
    ProcessedAt          *time.Time `json:"processed_at,omitempty"`
    CreatedAt            time.Time  `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    OriginalTransaction Transaction `json:"original_transaction" gorm:"foreignKey:OriginalTransactionID"`
}

type Chargeback struct {
    ID                uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    TransactionID     uuid.UUID  `json:"transaction_id" gorm:"type:uuid;not null"`
    Amount            float64    `json:"amount" gorm:"type:decimal(10,2);not null"`
    ReasonCode        *string    `json:"reason_code,omitempty" gorm:"size:50"`
    ReasonDescription *string    `json:"reason_description,omitempty" gorm:"type:text"`
    Status            string     `json:"status" gorm:"size:20;default:'pending'"`
    DisputeID         *string    `json:"dispute_id,omitempty" gorm:"size:255"`
    EvidenceDueDate   *time.Time `json:"evidence_due_date,omitempty" gorm:"type:date"`
    CreatedAt         time.Time  `json:"created_at" gorm:"default:now()"`
    UpdatedAt         time.Time  `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Transaction Transaction `json:"transaction" gorm:"foreignKey:TransactionID"`
}

type RevenueShare struct {
    ID                      uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatorID               uuid.UUID `json:"creator_id" gorm:"type:uuid;not null"`
    TransactionID           uuid.UUID `json:"transaction_id" gorm:"type:uuid;not null"`
    GrossAmount             float64   `json:"gross_amount" gorm:"type:decimal(10,2);not null"`
    PlatformFeeRate         float64   `json:"platform_fee_rate" gorm:"type:decimal(5,4);not null"`
    PlatformFeeAmount       float64   `json:"platform_fee_amount" gorm:"type:decimal(8,2);not null"`
    PaymentProcessorFee     float64   `json:"payment_processor_fee" gorm:"type:decimal(8,2);default:0.00"`
    NetAmount               float64   `json:"net_amount" gorm:"type:decimal(10,2);not null"`
    CreatedAt               time.Time `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    Creator     User        `json:"creator" gorm:"foreignKey:CreatorID"`
    Transaction Transaction `json:"transaction" gorm:"foreignKey:TransactionID"`
}

type AffiliateCommission struct {
    ID            uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    AffiliateID   uuid.UUID  `json:"affiliate_id" gorm:"type:uuid;not null"`
    ReferralID    uuid.UUID  `json:"referral_id" gorm:"type:uuid;not null"`
    TransactionID uuid.UUID  `json:"transaction_id" gorm:"type:uuid;not null"`
    CommissionRate float64   `json:"commission_rate" gorm:"type:decimal(5,4);not null"`
    CommissionAmount float64 `json:"commission_amount" gorm:"type:decimal(8,2);not null"`
    Level         int        `json:"level" gorm:"default:1"`
    Status        string     `json:"status" gorm:"size:20;default:'pending'"`
    PaidAt        *time.Time `json:"paid_at,omitempty"`
    CreatedAt     time.Time  `json:"created_at" gorm:"default:now()"`
    
    // Relationships
    Affiliate   User        `json:"affiliate" gorm:"foreignKey:AffiliateID"`
    Referral    User        `json:"referral" gorm:"foreignKey:ReferralID"`
    Transaction Transaction `json:"transaction" gorm:"foreignKey:TransactionID"`
}

type CreatorTaxInfo struct {
    ID                uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatorID         uuid.UUID  `json:"creator_id" gorm:"type:uuid;not null"`
    TaxClassification *string    `json:"tax_classification,omitempty" gorm:"size:50"`
    TaxID             *string    `json:"tax_id,omitempty" gorm:"size:100"`
    W9DocumentURL     *string    `json:"w9_document_url,omitempty" gorm:"size:500"`
    BackupWithholding bool       `json:"backup_withholding" gorm:"default:false"`
    CreatedAt         time.Time  `json:"created_at" gorm:"default:now()"`
    UpdatedAt         time.Time  `json:"updated_at" gorm:"default:now()"`
    
    // Relationships
    Creator User `json:"creator" gorm:"foreignKey:CreatorID;constraint:OnDelete:CASCADE"`
}

// Subscription methods
func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
    if s.ID == uuid.Nil {
        s.ID = uuid.New()
    }
    return nil
}

func (s *Subscription) IsActive() bool {
    return s.Status == "active" && s.CurrentPeriodEnd != nil && s.CurrentPeriodEnd.After(time.Now())
}

func (s *Subscription) IsInTrial() bool {
    return s.TrialEnd != nil && s.TrialEnd.After(time.Now())
}

func (s *Subscription) DaysUntilRenewal() int {
    if s.CurrentPeriodEnd == nil {
        return 0
    }
    duration := s.CurrentPeriodEnd.Sub(time.Now())
    return int(duration.Hours() / 24)
}

func (s *Subscription) Cancel() {
    s.Status = "cancelled"
    s.AutoRenew = false
    s.UpdatedAt = time.Now()
}

func (s *Subscription) Reactivate() {
    s.Status = "active"
    s.AutoRenew = true
    s.UpdatedAt = time.Now()
}

func (s *Subscription) Suspend() {
    s.Status = "suspended"
    s.UpdatedAt = time.Now()
}

func (s *Subscription) ExtendTrial(days int) {
    if s.TrialEnd == nil {
        s.TrialEnd = &time.Time{}
        *s.TrialEnd = time.Now().AddDate(0, 0, days)
    } else {
        *s.TrialEnd = s.TrialEnd.AddDate(0, 0, days)
    }
    s.UpdatedAt = time.Now()
}

// Transaction methods
func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
    if t.ID == uuid.Nil {
        t.ID = uuid.New()
    }
    return nil
}

func (t *Transaction) CalculateNetAmount() {
    if t.NetAmount == nil {
        netAmount := t.Amount - t.FeeAmount
        t.NetAmount = &netAmount
    }
}

func (t *Transaction) MarkAsProcessed() {
    t.Status = "completed"
    now := time.Now()
    t.ProcessedAt = &now
}

func (t *Transaction) MarkAsFailed(reason string) {
    t.Status = "failed"
    if t.Metadata == nil {
        t.Metadata = make(map[string]interface{})
    }
    t.Metadata["failure_reason"] = reason
}

func (t *Transaction) MarkAsRefunded() {
    t.Status = "refunded"
}

func (t *Transaction) IsCompleted() bool {
    return t.Status == "completed"
}

func (t *Transaction) IsPending() bool {
    return t.Status == "pending"
}

func (t *Transaction) IsFailed() bool {
    return t.Status == "failed"
}

// PaymentMethod methods
func (pm *PaymentMethod) BeforeCreate(tx *gorm.DB) error {
    if pm.ID == uuid.Nil {
        pm.ID = uuid.New()
    }
    return nil
}

func (pm *PaymentMethod) IsExpired() bool {
    if pm.ExpiresAt == nil {
        return false
    }
    return pm.ExpiresAt.Before(time.Now())
}

func (pm *PaymentMethod) SetAsDefault() {
    pm.IsDefault = true
    pm.UpdatedAt = time.Now()
}

func (pm *PaymentMethod) Verify() {
    pm.IsVerified = true
    pm.UpdatedAt = time.Now()
}

// Withdrawal methods
func (w *Withdrawal) BeforeCreate(tx *gorm.DB) error {
    if w.ID == uuid.Nil {
        w.ID = uuid.New()
    }
    return nil
}

func (w *Withdrawal) CalculateNetAmount() {
    if w.NetAmount == nil {
        netAmount := w.Amount - w.FeeAmount
        w.NetAmount = &netAmount
    }
}

func (w *Withdrawal) Process() {
    w.Status = "processed"
    now := time.Now()
    w.ProcessedAt = &now
}

func (w *Withdrawal) Fail(reason string) {
    w.Status = "failed"
    // Store failure reason in metadata if needed
}

func (w *Withdrawal) IsPending() bool {
    return w.Status == "pending"
}

func (w *Withdrawal) IsProcessed() bool {
    return w.Status == "processed"
}

// RevenueShare methods
func (rs *RevenueShare) BeforeCreate(tx *gorm.DB) error {
    if rs.ID == uuid.Nil {
        rs.ID = uuid.New()
    }
    return nil
}

func (rs *RevenueShare) CalculateFees() {
    rs.PlatformFeeAmount = rs.GrossAmount * rs.PlatformFeeRate
    rs.NetAmount = rs.GrossAmount - rs.PlatformFeeAmount - rs.PaymentProcessorFee
}

// AffiliateCommission methods
func (ac *AffiliateCommission) BeforeCreate(tx *gorm.DB) error {
    if ac.ID == uuid.Nil {
        ac.ID = uuid.New()
    }
    return nil
}

func (ac *AffiliateCommission) MarkAsPaid() {
    ac.Status = "paid"
    now := time.Now()
    ac.PaidAt = &now
}

func (ac *AffiliateCommission) IsPaid() bool {
    return ac.Status == "paid"
}

func (ac *AffiliateCommission) IsPending() bool {
    return ac.Status == "pending"
}

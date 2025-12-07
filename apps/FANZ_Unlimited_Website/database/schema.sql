-- ============================================================================
-- FANZ ECOSYSTEM DATABASE SCHEMA
-- Version: 1.0
-- Database: PostgreSQL 15+
-- Description: Comprehensive schema for 42+ platform ecosystem
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation features

-- ============================================================================
-- CORE IDENTITY & AUTHENTICATION
-- ============================================================================

-- Users table (unified identity across all platforms)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),

    -- Account type
    account_type VARCHAR(20) NOT NULL DEFAULT 'fan', -- fan, creator, admin
    creator_verified BOOLEAN DEFAULT false,
    creator_verified_at TIMESTAMP,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, banned, deleted
    suspension_reason TEXT,
    suspended_until TIMESTAMP,

    -- Privacy
    is_private BOOLEAN DEFAULT false,
    show_location BOOLEAN DEFAULT false,
    show_online_status BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~* '^[A-Za-z0-9_-]{3,50}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status) WHERE status != 'deleted';
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Geolocation
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Expiration
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Two-factor authentication
CREATE TABLE user_2fa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL, -- totp, sms, email
    secret_encrypted BYTEA,
    backup_codes_encrypted BYTEA,
    enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_2fa_user_method ON user_2fa(user_id, method);

-- ============================================================================
-- CREATOR PROFILES & VERIFICATION
-- ============================================================================

CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Business info
    business_name VARCHAR(255),
    business_type VARCHAR(50), -- individual, llc, corporation
    tax_id_encrypted BYTEA, -- EIN or SSN

    -- Payout info
    payout_email VARCHAR(255),
    payout_method VARCHAR(50), -- bank_transfer, paypal, crypto
    bank_account_encrypted BYTEA,
    routing_number_encrypted BYTEA,

    -- Verification status
    identity_verified BOOLEAN DEFAULT false,
    identity_verified_at TIMESTAMP,
    identity_document_url VARCHAR(500), -- Encrypted S3/storage path

    age_verified BOOLEAN DEFAULT false,
    age_verified_at TIMESTAMP,
    date_of_birth_encrypted BYTEA,

    -- 2257 Compliance
    govt_id_type VARCHAR(50), -- drivers_license, passport, state_id
    govt_id_number_encrypted BYTEA,
    govt_id_expiry_date DATE,
    govt_id_document_url VARCHAR(500),

    proof_of_address_url VARCHAR(500),

    -- Subscription pricing
    subscription_price_monthly DECIMAL(10,2) DEFAULT 0.00,
    subscription_price_yearly DECIMAL(10,2) DEFAULT 0.00,

    -- Platform access (JSON array of platform slugs)
    enabled_platforms JSONB DEFAULT '[]'::jsonb,

    -- Stats
    total_subscribers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_user ON creator_profiles(user_id);
CREATE INDEX idx_creator_verified ON creator_profiles(identity_verified, age_verified);

-- ============================================================================
-- PLATFORM ACCESS & SUBSCRIPTIONS
-- ============================================================================

-- Platform definitions
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- fanzos, fanzdash, fanzclub, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- infrastructure, creator, social, ai, commerce
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    requires_subscription BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_platforms_category ON platforms(category);

-- User platform access
CREATE TABLE user_platform_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL DEFAULT 'basic', -- basic, premium, admin
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP,

    UNIQUE(user_id, platform_id)
);

CREATE INDEX idx_platform_access_user ON user_platform_access(user_id);
CREATE INDEX idx_platform_access_platform ON user_platform_access(platform_id);

-- Subscriptions (fan subscribing to creator)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Subscription details
    plan_type VARCHAR(20) NOT NULL, -- monthly, yearly
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended

    -- Billing
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,

    -- Renewal
    auto_renew BOOLEAN DEFAULT true,
    next_billing_date TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(subscriber_id, creator_id)
);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_billing_date ON subscriptions(next_billing_date);

-- ============================================================================
-- CONTENT MANAGEMENT
-- ============================================================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    content_type VARCHAR(20) NOT NULL, -- text, image, video, audio, mixed
    caption TEXT,

    -- Access control
    visibility VARCHAR(20) NOT NULL DEFAULT 'subscribers', -- public, subscribers, ppv, private
    is_ppv BOOLEAN DEFAULT false,
    ppv_price DECIMAL(10,2),

    -- Media storage references (not actual files)
    media_urls JSONB, -- Array of {url, type, thumbnail_url, duration, size}

    -- Engagement
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- draft, published, archived, deleted, under_review
    published_at TIMESTAMP,
    scheduled_publish_at TIMESTAMP,

    -- Moderation
    flagged BOOLEAN DEFAULT false,
    flag_count INTEGER DEFAULT 0,
    moderation_status VARCHAR(20), -- pending, approved, rejected
    moderated_at TIMESTAMP,
    moderated_by UUID REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_posts_creator ON posts(creator_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_scheduled ON posts(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;

-- Media files with FanzForensics signatures
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,

    -- File metadata
    file_type VARCHAR(50) NOT NULL, -- image/jpeg, video/mp4, etc.
    file_size BIGINT NOT NULL,
    duration INTEGER, -- For video/audio in seconds
    width INTEGER,
    height INTEGER,

    -- Storage
    storage_path VARCHAR(500) NOT NULL, -- S3/CDN path
    thumbnail_path VARCHAR(500),
    preview_path VARCHAR(500), -- For video previews

    -- FanzForensics signature
    forensic_signature VARCHAR(255) NOT NULL UNIQUE, -- Binary-level invisible watermark
    signature_algorithm VARCHAR(50) DEFAULT 'fanzforensics_v1',

    -- Encryption
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(100),

    -- Processing
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, complete, failed
    processed_at TIMESTAMP,

    -- DMCA tracking
    dmca_protected BOOLEAN DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_media_uploader ON media_files(uploader_id);
CREATE INDEX idx_media_post ON media_files(post_id);
CREATE INDEX idx_media_forensic_sig ON media_files(forensic_signature);
CREATE INDEX idx_media_processing ON media_files(processing_status) WHERE processing_status != 'complete';

-- ============================================================================
-- SOCIAL INTERACTIONS
-- ============================================================================

CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_post ON likes(post_id);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Moderation
    status VARCHAR(20) NOT NULL DEFAULT 'published', -- published, deleted, hidden
    flagged BOOLEAN DEFAULT false,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL,
    media_url VARCHAR(500),

    -- PPV message
    is_ppv BOOLEAN DEFAULT false,
    ppv_price DECIMAL(10,2),
    ppv_unlocked BOOLEAN DEFAULT false,

    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    deleted_by_sender BOOLEAN DEFAULT false,
    deleted_by_recipient BOOLEAN DEFAULT false,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- FINANCIAL TRANSACTIONS
-- ============================================================================

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Balances (in cents to avoid floating point issues)
    balance_cents BIGINT DEFAULT 0, -- Available balance
    pending_cents BIGINT DEFAULT 0, -- Pending transactions
    lifetime_earnings_cents BIGINT DEFAULT 0,

    currency VARCHAR(3) DEFAULT 'USD',

    -- Payout settings
    minimum_payout_cents BIGINT DEFAULT 5000, -- $50 minimum
    auto_payout BOOLEAN DEFAULT false,
    payout_schedule VARCHAR(20) DEFAULT 'manual', -- manual, weekly, monthly

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parties
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payee_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- subscription, tip, ppv_post, ppv_message, payout, refund, chargeback
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Platform fee
    platform_fee_cents BIGINT DEFAULT 0,
    net_amount_cents BIGINT NOT NULL, -- Amount after platform fee

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded, disputed

    -- Payment method
    payment_method VARCHAR(50), -- card, bank_transfer, crypto
    payment_provider VARCHAR(50), -- stripe, coinbase, etc.
    provider_transaction_id VARCHAR(255),

    -- Related content
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB,

    -- Risk management
    fraud_score DECIMAL(5,2),
    risk_level VARCHAR(20), -- low, medium, high

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    refunded_at TIMESTAMP
);

CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_payee ON transactions(payee_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Amount
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Method
    payout_method VARCHAR(50) NOT NULL, -- bank_transfer, paypal, crypto
    payout_destination_encrypted BYTEA, -- Encrypted account details

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

    -- Processing
    initiated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    -- External reference
    provider VARCHAR(50),
    provider_payout_id VARCHAR(255),

    -- Metadata
    period_start DATE,
    period_end DATE,
    transaction_count INTEGER,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_creator ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_initiated ON payouts(initiated_at DESC);

-- ============================================================================
-- COMPLIANCE & LEGAL
-- ============================================================================

-- Age verification records (2257/2258 compliance)
CREATE TABLE age_verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Personal info (encrypted)
    legal_name_encrypted BYTEA NOT NULL,
    date_of_birth_encrypted BYTEA NOT NULL,

    -- ID verification
    id_type VARCHAR(50) NOT NULL, -- drivers_license, passport, state_id
    id_number_encrypted BYTEA NOT NULL,
    id_issuing_authority VARCHAR(100),
    id_issue_date DATE,
    id_expiry_date DATE,

    -- Document storage (encrypted S3 paths)
    id_front_image_url VARCHAR(500) NOT NULL,
    id_back_image_url VARCHAR(500),
    selfie_image_url VARCHAR(500),

    -- Verification
    verification_method VARCHAR(50), -- manual, automated, third_party
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired
    rejection_reason TEXT,

    -- Re-verification
    expires_at DATE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_age_verification_user ON age_verification_records(user_id);
CREATE INDEX idx_age_verification_status ON age_verification_records(verification_status);
CREATE INDEX idx_age_verification_expires ON age_verification_records(expires_at);

-- Consent records (GDPR/CCPA compliance)
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    consent_type VARCHAR(50) NOT NULL, -- terms, privacy, marketing, data_processing
    version VARCHAR(20) NOT NULL, -- Policy version

    consented BOOLEAN NOT NULL,
    consented_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,

    withdrawn_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);

-- 2257 custodian records (required for adult content)
CREATE TABLE records_custodian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Custodian info
    custodian_name VARCHAR(255) NOT NULL,
    custodian_address TEXT NOT NULL,
    custodian_phone VARCHAR(50),
    custodian_email VARCHAR(255),

    -- Record keeping
    records_location TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Content performer records (2257 compliance)
CREATE TABLE content_performer_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    performer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Performer info (encrypted)
    legal_name_encrypted BYTEA NOT NULL,
    stage_name VARCHAR(100),
    date_of_birth_encrypted BYTEA NOT NULL,

    -- ID verification
    govt_id_type VARCHAR(50) NOT NULL,
    govt_id_number_encrypted BYTEA NOT NULL,
    govt_id_verification_record_id UUID REFERENCES age_verification_records(id),

    -- Consent
    consent_form_url VARCHAR(500) NOT NULL,
    consent_date DATE NOT NULL,

    -- Custodian
    custodian_id UUID REFERENCES records_custodian(id),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performer_records_post ON content_performer_records(post_id);
CREATE INDEX idx_performer_records_user ON content_performer_records(performer_user_id);

-- ============================================================================
-- MODERATION & SAFETY
-- ============================================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Reported entity
    reported_entity_type VARCHAR(50) NOT NULL, -- user, post, comment, message
    reported_entity_id UUID NOT NULL,

    -- Report details
    reason VARCHAR(100) NOT NULL, -- spam, harassment, illegal_content, underage, copyright, etc.
    description TEXT,
    evidence_urls JSONB, -- Screenshots, links, etc.

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, under_review, resolved, dismissed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Resolution
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    resolution TEXT,
    action_taken VARCHAR(100), -- warning, content_removed, user_suspended, etc.

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_entity ON reports(reported_entity_type, reported_entity_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TABLE user_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- minor, moderate, severe
    description TEXT,

    issued_by UUID REFERENCES users(id),
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Related
    report_id UUID REFERENCES reports(id),
    post_id UUID REFERENCES posts(id)
);

CREATE INDEX idx_warnings_user ON user_warnings(user_id);

-- ============================================================================
-- SECURITY & AUDIT
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Action
    action_type VARCHAR(100) NOT NULL, -- login, profile_update, post_create, etc.
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Changes
    old_values JSONB,
    new_values JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    key_name VARCHAR(100),
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20), -- First few chars for identification

    -- Permissions
    scopes JSONB, -- Array of permitted scopes

    -- Usage
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- GEOLOCATION (Near By Me feature)
-- ============================================================================

CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Location (PostGIS geography point)
    location GEOGRAPHY(POINT, 4326),

    -- Address components
    city VARCHAR(100),
    state VARCHAR(100),
    country_code VARCHAR(2),
    postal_code VARCHAR(20),

    -- Privacy
    radius_km INTEGER DEFAULT 10, -- Fuzz location by this radius
    show_exact_location BOOLEAN DEFAULT false,

    -- Metadata
    last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_geography ON user_locations USING GIST(location);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(50) NOT NULL, -- new_subscriber, new_like, new_comment, new_message, etc.
    title VARCHAR(255),
    message TEXT,

    -- Related entities
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Who triggered the notification
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Delivery
    channels JSONB, -- [push, email, sms]
    sent_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- CRM & SUPPORT
-- ============================================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Ticket details
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50), -- billing, technical, account, content, abuse
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, in_progress, waiting_on_customer, resolved, closed

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,

    -- Resolution
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL, -- customer, agent, system

    message TEXT NOT NULL,
    attachments JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================================================
-- ANALYTICS & METRICS
-- ============================================================================

CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Subscriber metrics
    new_subscribers INTEGER DEFAULT 0,
    cancelled_subscribers INTEGER DEFAULT 0,
    total_subscribers INTEGER DEFAULT 0,

    -- Content metrics
    posts_published INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,

    -- Revenue metrics
    subscription_revenue_cents BIGINT DEFAULT 0,
    tip_revenue_cents BIGINT DEFAULT 0,
    ppv_revenue_cents BIGINT DEFAULT 0,
    total_revenue_cents BIGINT DEFAULT 0,

    -- Engagement
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(creator_id, date)
);

CREATE INDEX idx_analytics_creator ON creator_analytics(creator_id);
CREATE INDEX idx_analytics_date ON creator_analytics(date DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment/decrement counters
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_like_count AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION increment_post_like_count();

CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

CREATE TRIGGER decrement_like_count AFTER DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION decrement_post_like_count();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active creators with stats
CREATE VIEW active_creators AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    cp.subscription_price_monthly,
    cp.total_subscribers,
    cp.total_posts,
    cp.total_earnings,
    u.created_at,
    u.last_active_at
FROM users u
JOIN creator_profiles cp ON u.id = cp.user_id
WHERE u.status = 'active' AND u.creator_verified = true;

-- Recent posts with creator info
CREATE VIEW recent_posts_with_creator AS
SELECT
    p.id,
    p.caption,
    p.content_type,
    p.visibility,
    p.published_at,
    p.like_count,
    p.comment_count,
    u.id as creator_id,
    u.username as creator_username,
    u.display_name as creator_display_name,
    u.avatar_url as creator_avatar_url
FROM posts p
JOIN users u ON p.creator_id = u.id
WHERE p.status = 'published' AND p.published_at <= NOW()
ORDER BY p.published_at DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_subscriptions_creator_status ON subscriptions(creator_id, status);
CREATE INDEX idx_posts_creator_status_published ON posts(creator_id, status, published_at DESC);
CREATE INDEX idx_transactions_payee_status_created ON transactions(payee_id, status, created_at DESC);
CREATE INDEX idx_messages_recipient_read ON messages(recipient_id, read, created_at DESC);

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Unified identity across all 42+ FANZ platforms';
COMMENT ON TABLE media_files IS 'All media with FanzForensics invisible signatures for copyright protection';
COMMENT ON TABLE age_verification_records IS '2257/2258 compliance for adult content creators';
COMMENT ON TABLE transactions IS 'All financial transactions with PCI-DSS compliant encrypted payment data';
COMMENT ON TABLE user_locations IS 'Geolocation data for Near By Me feature with privacy controls';
COMMENT ON COLUMN media_files.forensic_signature IS 'Invisible binary-level signature embedded in all content';
COMMENT ON COLUMN creator_profiles.tax_id_encrypted IS 'Encrypted using pgcrypto - EIN or SSN for tax reporting';

-- ============================================================================
-- INITIAL PLATFORM DATA
-- ============================================================================

-- Insert core platforms
INSERT INTO platforms (slug, name, category, description) VALUES
('fanzos', 'FanzOS', 'infrastructure', 'Operating system - orchestrates all apps'),
('fanzdash', 'FanzDash', 'infrastructure', 'Executive command center'),
('fanzsso', 'FanzSSO', 'infrastructure', 'Unified sign-on'),
('tasksparks', 'TaskSparks', 'infrastructure', 'Task queue system'),
('fanzhive', 'FanzHive', 'infrastructure', 'Knowledge base'),
('fanzdb', 'FanzDB', 'infrastructure', 'Database management'),
('fanzapi', 'FanzAPI', 'infrastructure', 'API gateway'),
('fanzcdn', 'FanzCDN', 'infrastructure', 'Content delivery network'),
('fanzcloud', 'FanzCloud', 'infrastructure', 'Cloud storage');

-- Insert creator platforms
INSERT INTO platforms (slug, name, category, description, requires_subscription) VALUES
('fanzclub', 'FanzClub', 'creator', 'Adult content creators', true),
('fitfanz', 'FitFanz', 'creator', 'Fitness & wellness', true),
('muscleheads', 'MuscleHeads', 'creator', 'Bodybuilding content', true),
('gamerheads', 'GamerHeads', 'creator', 'Gaming creators', true),
('chefheads', 'ChefHeads', 'creator', 'Culinary content', true),
('musicfanz', 'MusicFanz', 'creator', 'Musicians & artists', true);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

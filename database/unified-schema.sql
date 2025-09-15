-- 🚀 FANZ Unified Ecosystem - Complete Database Schema
-- Supports 9 platform clusters, 7 specialized systems, 100+ microservices
-- Designed for 20+ million users with enterprise compliance

-- =============================================================================
-- EXTENSIONS AND TYPES
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- Custom types
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'pending_verification', 'deleted');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'banned');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'private', 'scheduled', 'archived', 'deleted');
CREATE TYPE platform_cluster AS ENUM ('fanzlab', 'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock');
CREATE TYPE transaction_type AS ENUM ('tip', 'subscription', 'ppv', 'merchandise', 'nft', 'withdrawal', 'refund', 'chargeback', 'fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed');
CREATE TYPE payment_method AS ENUM ('ccbill', 'segpay', 'epoch', 'verotel', 'paxum', 'crypto_btc', 'crypto_eth', 'crypto_usdt', 'bank_transfer', 'wise', 'dwolla');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'live_stream');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged', 'reviewing');
CREATE TYPE subscription_type AS ENUM ('monthly', 'quarterly', 'yearly', 'lifetime', 'custom');

-- =============================================================================
-- CORE USER MANAGEMENT
-- =============================================================================

-- Unified users table for all platform clusters
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    birth_date DATE,
    status user_status DEFAULT 'active',
    primary_cluster platform_cluster DEFAULT 'fanzlab',
    is_creator BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'unverified',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    phone_number VARCHAR(20),
    phone_verified_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    country_code CHAR(2),
    city VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- User profiles per platform cluster
CREATE TABLE user_cluster_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster platform_cluster NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    theme_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cluster)
);

-- User authentication sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE user_2fa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT[],
    enabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CREATOR MANAGEMENT
-- =============================================================================

-- Creator profiles
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status creator_status DEFAULT 'pending',
    verification_status verification_status DEFAULT 'unverified',
    subscription_price_monthly DECIMAL(10,2) DEFAULT 0,
    subscription_price_quarterly DECIMAL(10,2),
    subscription_price_yearly DECIMAL(10,2),
    subscription_price_lifetime DECIMAL(10,2),
    tips_enabled BOOLEAN DEFAULT TRUE,
    ppv_enabled BOOLEAN DEFAULT TRUE,
    merchandise_enabled BOOLEAN DEFAULT FALSE,
    live_streaming_enabled BOOLEAN DEFAULT FALSE,
    earnings_total DECIMAL(15,2) DEFAULT 0,
    earnings_this_month DECIMAL(15,2) DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    tip_count INTEGER DEFAULT 0,
    social_links JSONB DEFAULT '{}',
    bank_details_encrypted TEXT,
    tax_info_encrypted TEXT,
    payout_method payment_method DEFAULT 'paxum',
    payout_schedule VARCHAR(20) DEFAULT 'weekly',
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator verification documents
CREATE TABLE creator_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'id', 'passport', 'driver_license', 'utility_bill', 'model_release_2257'
    document_url VARCHAR(500) NOT NULL,
    status verification_status DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Creator earnings and analytics
CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    cluster platform_cluster NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    subscriber_churn INTEGER DEFAULT 0,
    tips_received DECIMAL(10,2) DEFAULT 0,
    subscription_revenue DECIMAL(10,2) DEFAULT 0,
    ppv_revenue DECIMAL(10,2) DEFAULT 0,
    merchandise_revenue DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, date, cluster)
);

-- =============================================================================
-- CONTENT MANAGEMENT
-- =============================================================================

-- Content posts across all clusters
CREATE TABLE content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    cluster platform_cluster NOT NULL,
    title VARCHAR(255),
    description TEXT,
    content_type media_type NOT NULL,
    content_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0,
    is_ppv BOOLEAN DEFAULT FALSE,
    is_subscriber_only BOOLEAN DEFAULT FALSE,
    status content_status DEFAULT 'draft',
    moderation_status moderation_status DEFAULT 'pending',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    duration INTEGER, -- in seconds for video/audio
    file_size BIGINT, -- in bytes
    tags TEXT[],
    adult_content BOOLEAN DEFAULT TRUE,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Content media files
CREATE TABLE content_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    media_type media_type NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(255),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
    mime_type VARCHAR(100),
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    cdn_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content interactions
CREATE TABLE content_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL, -- 'like', 'dislike', 'favorite', 'share', 'view'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id, interaction_type)
);

-- Content comments
CREATE TABLE content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES content_comments(id),
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    moderation_status moderation_status DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- FANZFINANCE OS - FINANCIAL SYSTEM (PER USER RULES)
-- =============================================================================

-- Chart of accounts for double-entry bookkeeping
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries for double-entry accounting
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_id UUID, -- Reference to business transactions
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    total_amount DECIMAL(15,2) NOT NULL,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    reversed_entry_id UUID REFERENCES journal_entries(id),
    is_reversed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entry line items
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time account balances
CREATE TABLE account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    balance_date DATE NOT NULL,
    debit_balance DECIMAL(15,2) DEFAULT 0,
    credit_balance DECIMAL(15,2) DEFAULT 0,
    net_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, balance_date)
);

-- Business transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    creator_id UUID REFERENCES creators(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    platform_fee DECIMAL(15,2) DEFAULT 0,
    processor_fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method payment_method NOT NULL,
    processor_transaction_id VARCHAR(100),
    status transaction_status DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User account balances
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_balance DECIMAL(15,2) DEFAULT 0,
    pending_balance DECIMAL(15,2) DEFAULT 0,
    total_earned DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    total_withdrawn DECIMAL(15,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator payouts
CREATE TABLE creator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id),
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    payout_method payment_method NOT NULL,
    processor_payout_id VARCHAR(100),
    status payout_status DEFAULT 'pending',
    processing_fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    payout_details_encrypted TEXT,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SUBSCRIPTIONS & MONETIZATION
-- =============================================================================

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    billing_interval subscription_type NOT NULL,
    trial_days INTEGER DEFAULT 0,
    benefits TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    max_subscribers INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, past_due
    price DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    billing_interval subscription_type NOT NULL,
    next_billing_date DATE,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, creator_id)
);

-- Tips and donations
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    post_id UUID REFERENCES content_posts(id),
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SPECIALIZED SYSTEMS INTEGRATION
-- =============================================================================

-- CreatorCRM - Contact management
CREATE TABLE crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    contact_type VARCHAR(50) DEFAULT 'fan', -- fan, lead, collaborator, business
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    notes TEXT,
    tags TEXT[],
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,
    source VARCHAR(100), -- organic, referral, advertising, etc.
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BioLinkHub - Link management
CREATE TABLE bio_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ChatSphere - Messaging system
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, video, audio, file, tip
    media_url VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0,
    is_ppv BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- MediaCore - Media processing
CREATE TABLE media_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES content_media(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- transcode, thumbnail, watermark, analyze
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    input_url VARCHAR(500) NOT NULL,
    output_url VARCHAR(500),
    parameters JSONB DEFAULT '{}',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LIVE STREAMING
-- =============================================================================

-- Live streams
CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    cluster platform_cluster NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stream_key VARCHAR(255) UNIQUE NOT NULL,
    rtmp_url VARCHAR(500),
    hls_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    is_private BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0,
    max_viewers INTEGER,
    current_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'offline', -- offline, live, ended
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live stream viewers
CREATE TABLE stream_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    watch_duration INTEGER DEFAULT 0, -- in seconds
    ip_address INET
);

-- =============================================================================
-- COMPLIANCE & MODERATION
-- =============================================================================

-- Content moderation
CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_content_type VARCHAR(50) NOT NULL, -- post, comment, user, message
    reported_content_id UUID NOT NULL,
    reporter_id UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    assigned_to UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adult content compliance (2257 records)
CREATE TABLE compliance_2257_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_posts(id),
    performer_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    id_document_type VARCHAR(50) NOT NULL,
    id_document_url VARCHAR(500) NOT NULL,
    custodian_name VARCHAR(200) DEFAULT 'FANZ Platform Inc.',
    custodian_address TEXT,
    record_date DATE NOT NULL,
    verification_status verification_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Age verification
CREATE TABLE age_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_method VARCHAR(50) NOT NULL, -- id_document, credit_card, phone_sms, biometric
    provider VARCHAR(100), -- jumio, veriff, trulioo, etc.
    provider_verification_id VARCHAR(200),
    document_type VARCHAR(50),
    document_url VARCHAR(500),
    verified_age INTEGER,
    confidence_score DECIMAL(5,2),
    status verification_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- =============================================================================

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    new_subscriber BOOLEAN DEFAULT TRUE,
    new_tip BOOLEAN DEFAULT TRUE,
    new_message BOOLEAN DEFAULT TRUE,
    new_comment BOOLEAN DEFAULT TRUE,
    new_content BOOLEAN DEFAULT TRUE,
    payout_updates BOOLEAN DEFAULT TRUE,
    promotional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels VARCHAR(20)[] DEFAULT ARRAY['app'], -- app, email, push, sms
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS & REPORTING
-- =============================================================================

-- Platform analytics
CREATE TABLE platform_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    cluster platform_cluster NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, cluster, metric_name)
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    cluster platform_cluster NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECURITY & AUDIT
-- =============================================================================

-- Audit log for all important actions
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL, -- login_failed, suspicious_activity, password_changed, etc.
    severity VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_cluster ON users(primary_cluster);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Creator indexes
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_verification ON creators(verification_status);

-- Content indexes
CREATE INDEX idx_content_posts_creator_id ON content_posts(creator_id);
CREATE INDEX idx_content_posts_cluster ON content_posts(cluster);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_published_at ON content_posts(published_at);
CREATE INDEX idx_content_posts_tags ON content_posts USING GIN(tags);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Financial indexes
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_account_balances_account_date ON account_balances(account_id, balance_date);

-- Analytics indexes
CREATE INDEX idx_creator_analytics_creator_date ON creator_analytics(creator_id, date);
CREATE INDEX idx_platform_analytics_date_cluster ON platform_analytics(date, cluster);
CREATE INDEX idx_user_activity_user_created ON user_activity(user_id, created_at);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables that have updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_payouts_updated_at BEFORE UPDATE ON creator_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user balance after transaction
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update user balance based on transaction type
        IF NEW.transaction_type IN ('tip', 'subscription', 'ppv', 'merchandise', 'nft') THEN
            -- Credit creator
            INSERT INTO user_balances (user_id, available_balance, total_earned, last_transaction_at)
            VALUES (NEW.creator_id, NEW.net_amount, NEW.net_amount, NEW.processed_at)
            ON CONFLICT (user_id) DO UPDATE SET
                available_balance = user_balances.available_balance + NEW.net_amount,
                total_earned = user_balances.total_earned + NEW.net_amount,
                last_transaction_at = NEW.processed_at,
                updated_at = NOW();
        ELSIF NEW.transaction_type = 'withdrawal' THEN
            -- Debit user
            UPDATE user_balances SET
                available_balance = available_balance - NEW.amount,
                total_withdrawn = total_withdrawn + NEW.amount,
                last_transaction_at = NEW.processed_at,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_balance_update 
    AFTER UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_user_balance_after_transaction();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
-- Assets
('1000', 'Cash and Cash Equivalents', 'asset', 'Operating cash accounts'),
('1100', 'User Balances', 'asset', 'Pending user withdrawals'),
('1200', 'Accounts Receivable', 'asset', 'Money owed by payment processors'),
-- Liabilities
('2000', 'Accounts Payable', 'liability', 'Money owed to creators and vendors'),
('2100', 'Creator Payables', 'liability', 'Pending creator payouts'),
('2200', 'Tax Liabilities', 'liability', 'Taxes owed to authorities'),
-- Equity
('3000', 'Retained Earnings', 'equity', 'Accumulated profits'),
-- Revenue
('4000', 'Platform Fees', 'revenue', 'Commission from transactions'),
('4100', 'Subscription Revenue', 'revenue', 'Platform subscription fees'),
('4200', 'Transaction Fees', 'revenue', 'Payment processing markups'),
-- Expenses
('5000', 'Payment Processing Fees', 'expense', 'Costs paid to payment processors'),
('5100', 'Operational Expenses', 'expense', 'Platform operational costs'),
('5200', 'Marketing Expenses', 'expense', 'User acquisition costs');

-- Insert default notification preferences
INSERT INTO notification_preferences (user_id, email_notifications, push_notifications)
SELECT id, TRUE, TRUE FROM users WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- Creator earnings view
CREATE VIEW creator_earnings_summary AS
SELECT 
    c.id as creator_id,
    c.creator_name,
    c.user_id,
    COALESCE(SUM(CASE WHEN t.transaction_type IN ('tip', 'subscription', 'ppv') AND t.status = 'completed' THEN t.net_amount ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN t.transaction_type IN ('tip', 'subscription', 'ppv') AND t.status = 'completed' AND t.created_at >= date_trunc('month', CURRENT_DATE) THEN t.net_amount ELSE 0 END), 0) as this_month_earnings,
    COUNT(DISTINCT us.user_id) as subscriber_count,
    COUNT(DISTINCT cp.id) as content_count
FROM creators c
LEFT JOIN transactions t ON c.id = t.creator_id
LEFT JOIN user_subscriptions us ON c.id = us.creator_id AND us.status = 'active'
LEFT JOIN content_posts cp ON c.id = cp.creator_id AND cp.status = 'published'
GROUP BY c.id, c.creator_name, c.user_id;

-- Platform revenue view
CREATE VIEW platform_revenue_summary AS
SELECT 
    DATE_TRUNC('day', t.created_at) as date,
    COUNT(*) as transaction_count,
    SUM(t.amount) as gross_revenue,
    SUM(t.platform_fee) as platform_revenue,
    SUM(t.processor_fee) as processor_costs,
    SUM(t.net_amount) as creator_earnings
FROM transactions t
WHERE t.status = 'completed'
GROUP BY DATE_TRUNC('day', t.created_at);

COMMENT ON DATABASE postgres IS 'FANZ Unified Ecosystem Database - Supporting 9 platform clusters, 100+ microservices, and 20+ million users with enterprise compliance and real-time financial management';
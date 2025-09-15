-- 🚀 FANZ Unified Ecosystem - Content and Specialized Systems Migration
-- Version: 002
-- Description: Add content management, specialized systems, and monetization tables
-- Date: December 2024

BEGIN;

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
-- CONTENT INDEXES
-- =============================================================================

-- Content indexes
CREATE INDEX idx_content_posts_creator_id ON content_posts(creator_id);
CREATE INDEX idx_content_posts_cluster ON content_posts(cluster);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_published_at ON content_posts(published_at);
CREATE INDEX idx_content_posts_tags ON content_posts USING GIN(tags);

-- Media indexes
CREATE INDEX idx_content_media_post_id ON content_media(post_id);
CREATE INDEX idx_content_interactions_post_id ON content_interactions(post_id);
CREATE INDEX idx_content_interactions_user_id ON content_interactions(user_id);
CREATE INDEX idx_content_comments_post_id ON content_comments(post_id);

-- Subscription indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_creator_id ON user_subscriptions(creator_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Specialized system indexes
CREATE INDEX idx_crm_contacts_creator_id ON crm_contacts(creator_id);
CREATE INDEX idx_bio_links_creator_id ON bio_links(creator_id);
CREATE INDEX idx_conversations_creator_user ON conversations(creator_id, user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_live_streams_creator_id ON live_streams(creator_id);

-- =============================================================================
-- TRIGGERS FOR CONTENT TABLES
-- =============================================================================

-- Apply updated_at triggers
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE ON content_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bio_links_updated_at BEFORE UPDATE ON bio_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
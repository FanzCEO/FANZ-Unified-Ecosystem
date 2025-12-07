-- =====================================================
-- FANZ SOCIAL DATABASE
-- Posts, threads, rooms, messages, social interactions
-- Used by: All Platforms (social features)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- POSTS SCHEMA - Content feed
-- =====================================================

CREATE SCHEMA posts;

-- =====================================================
-- POSTS
-- =====================================================

CREATE TABLE posts.posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_number VARCHAR(50) UNIQUE NOT NULL,

    -- Creator
    creator_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Content
    content_text TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN (
        'text', 'photo', 'video', 'photoset', 'poll', 'audio', 'mixed'
    )),

    -- Media
    media_asset_ids UUID[], -- References assets from fanz_media
    media_count INTEGER DEFAULT 0,
    has_adult_content BOOLEAN DEFAULT TRUE,

    -- Access control
    access_type VARCHAR(30) NOT NULL CHECK (access_type IN (
        'public', 'subscribers_only', 'tier_exclusive', 'ppv', 'free_preview'
    )),
    tier_id UUID, -- Minimum tier required
    ppv_price BIGINT, -- Price in cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Visibility
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Scheduling
    scheduled_for TIMESTAMP,
    published_at TIMESTAMP,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'published', 'archived', 'deleted'
    )),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Engagement stats (cached)
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    purchases_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_posts_creator ON posts.posts(creator_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_user ON posts.posts(user_id, created_at DESC);
CREATE INDEX idx_posts_platform ON posts.posts(platform_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_status ON posts.posts(status);
CREATE INDEX idx_posts_scheduled ON posts.posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_posts_access_type ON posts.posts(access_type) WHERE status = 'published';
CREATE INDEX idx_posts_media ON posts.posts USING gin(media_asset_ids);

COMMENT ON TABLE posts.posts IS 'Creator posts and content';

-- =====================================================
-- POST LIKES
-- =====================================================

CREATE TABLE posts.likes (
    like_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts.posts(post_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    liked_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post ON posts.likes(post_id, liked_at DESC);
CREATE INDEX idx_likes_user ON posts.likes(user_id, liked_at DESC);

COMMENT ON TABLE posts.likes IS 'Post likes from users';

-- =====================================================
-- POST COMMENTS
-- =====================================================

CREATE TABLE posts.comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts.posts(post_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Comment content
    comment_text TEXT NOT NULL,

    -- Threading
    parent_comment_id UUID REFERENCES posts.comments(comment_id) ON DELETE CASCADE,
    thread_depth INTEGER DEFAULT 0,

    -- Status
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Engagement
    likes_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON posts.comments(post_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_user ON posts.comments(user_id, created_at DESC);
CREATE INDEX idx_comments_parent ON posts.comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

COMMENT ON TABLE posts.comments IS 'Comments on posts';

-- =====================================================
-- THREADS SCHEMA - Discussion threads
-- =====================================================

CREATE SCHEMA threads;

-- =====================================================
-- THREADS
-- =====================================================

CREATE TABLE threads.threads (
    thread_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Thread details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    thread_type VARCHAR(30) NOT NULL CHECK (thread_type IN (
        'announcement', 'discussion', 'qa', 'poll', 'event'
    )),

    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats
    messages_count INTEGER DEFAULT 0,
    participants_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_creator ON threads.threads(creator_id, created_at DESC);
CREATE INDEX idx_threads_platform ON threads.threads(platform_id, is_public);
CREATE INDEX idx_threads_pinned ON threads.threads(is_pinned, last_message_at DESC) WHERE is_pinned = TRUE;

COMMENT ON TABLE threads.threads IS 'Discussion threads';

-- =====================================================
-- THREAD MESSAGES
-- =====================================================

CREATE TABLE threads.messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES threads.threads(thread_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Message content
    message_text TEXT NOT NULL,
    media_urls TEXT[],

    -- Reply
    reply_to_message_id UUID REFERENCES threads.messages(message_id),

    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thread_messages_thread ON threads.messages(thread_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_thread_messages_user ON threads.messages(user_id, created_at DESC);

COMMENT ON TABLE threads.messages IS 'Messages in discussion threads';

-- =====================================================
-- ROOMS SCHEMA - Chat rooms
-- =====================================================

CREATE SCHEMA rooms;

-- =====================================================
-- ROOMS
-- =====================================================

CREATE TABLE rooms.rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Room details
    room_name VARCHAR(255) NOT NULL,
    room_description TEXT,

    -- Room type
    room_type VARCHAR(30) NOT NULL CHECK (room_type IN (
        'public_chat', 'subscriber_chat', 'vip_chat', 'private_group', 'live_stream_chat'
    )),

    -- Access control
    access_level VARCHAR(30) CHECK (access_level IN ('free', 'subscribers', 'tier_exclusive', 'invite_only')),
    required_tier_id UUID,
    entry_price BIGINT, -- One-time price in cents

    -- Limits
    max_members INTEGER,
    current_members_count INTEGER DEFAULT 0,

    -- Settings
    allow_guest_chat BOOLEAN DEFAULT FALSE,
    is_moderated BOOLEAN DEFAULT TRUE,
    slow_mode_seconds INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_creator ON rooms.rooms(creator_id, is_active);
CREATE INDEX idx_rooms_platform ON rooms.rooms(platform_id, room_type, is_active);
CREATE INDEX idx_rooms_active ON rooms.rooms(is_active, last_message_at DESC) WHERE is_active = TRUE;

COMMENT ON TABLE rooms.rooms IS 'Chat rooms and group chats';

-- =====================================================
-- ROOM MEMBERSHIPS
-- =====================================================

CREATE TABLE rooms.memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms.rooms(room_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Role
    role VARCHAR(30) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member', 'guest')),

    -- Permissions
    can_post BOOLEAN DEFAULT TRUE,
    can_invite BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,

    -- Notifications
    notifications_enabled BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP,
    muted_until TIMESTAMP,
    banned_until TIMESTAMP,

    UNIQUE(room_id, user_id)
);

CREATE INDEX idx_memberships_room ON rooms.memberships(room_id, role);
CREATE INDEX idx_memberships_user ON rooms.memberships(user_id, joined_at DESC);
CREATE INDEX idx_memberships_active ON rooms.memberships(room_id, is_banned, is_muted) WHERE is_banned = FALSE AND is_muted = FALSE;

COMMENT ON TABLE rooms.memberships IS 'User memberships in rooms';

-- =====================================================
-- ROOM MESSAGES
-- =====================================================

CREATE TABLE rooms.room_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms.rooms(room_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Message content
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'system')),

    -- Media
    media_url TEXT,
    media_thumbnail_url TEXT,

    -- Reply
    reply_to_message_id UUID REFERENCES rooms.room_messages(message_id),

    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,

    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_messages_room ON rooms.room_messages(room_id, sent_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_room_messages_user ON rooms.room_messages(user_id, sent_at DESC);

COMMENT ON TABLE rooms.room_messages IS 'Messages in chat rooms';

-- =====================================================
-- MESSAGES SCHEMA - Direct messages
-- =====================================================

CREATE SCHEMA messages;

-- =====================================================
-- CONVERSATIONS
-- =====================================================

CREATE TABLE messages.conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Participants (2 users for DM)
    participant_user_ids UUID[] NOT NULL,

    -- Type
    conversation_type VARCHAR(30) NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group', 'support')),

    -- Status
    is_archived BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_by_user_id UUID,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,
    last_message_preview TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON messages.conversations USING gin(participant_user_ids);
CREATE INDEX idx_conversations_updated ON messages.conversations(last_message_at DESC) WHERE is_archived = FALSE;

COMMENT ON TABLE messages.conversations IS 'Direct message conversations';

-- =====================================================
-- DIRECT MESSAGES
-- =====================================================

CREATE TABLE messages.direct_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES messages.conversations(conversation_id) ON DELETE CASCADE,

    -- Sender/receiver
    from_user_id UUID NOT NULL,
    to_user_id UUID NOT NULL,

    -- Message content
    message_text TEXT,
    message_type VARCHAR(30) NOT NULL DEFAULT 'text' CHECK (message_type IN (
        'text', 'image', 'video', 'audio', 'tip', 'ppv_unlock', 'custom_content_offer'
    )),

    -- Media
    media_asset_id UUID,
    media_thumbnail_url TEXT,

    -- PPV (pay-per-view)
    is_ppv BOOLEAN DEFAULT FALSE,
    ppv_price BIGINT,
    ppv_unlocked_by UUID[],

    -- Tip
    tip_amount BIGINT,
    transaction_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dm_conversation ON messages.direct_messages(conversation_id, sent_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_dm_from_user ON messages.direct_messages(from_user_id, sent_at DESC);
CREATE INDEX idx_dm_to_user ON messages.direct_messages(to_user_id, sent_at DESC);
CREATE INDEX idx_dm_unread ON messages.direct_messages(to_user_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE messages.direct_messages IS 'Direct messages between users';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON posts.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads.threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thread_messages_updated_at BEFORE UPDATE ON threads.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON messages.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate post number
CREATE OR REPLACE FUNCTION generate_post_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.post_number = 'POST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.post_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_post_number_trigger BEFORE INSERT ON posts.posts
    FOR EACH ROW EXECUTE FUNCTION generate_post_number();

-- Update post stats on like/unlike
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts.posts SET likes_count = likes_count + 1 WHERE post_id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE post_id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_likes_count_trigger AFTER INSERT OR DELETE ON posts.likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Update post stats on comment
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_deleted = FALSE THEN
        UPDATE posts.posts SET comments_count = comments_count + 1 WHERE post_id = NEW.post_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        UPDATE posts.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE post_id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comments_count_trigger AFTER INSERT OR UPDATE ON posts.comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on private messages
ALTER TABLE messages.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages
CREATE POLICY dm_participants_only ON messages.direct_messages
    FOR SELECT
    USING (
        from_user_id = current_setting('app.current_user_id')::UUID OR
        to_user_id = current_setting('app.current_user_id')::UUID
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- User feed view
CREATE VIEW posts.user_feed AS
SELECT
    p.post_id,
    p.post_number,
    p.creator_id,
    p.content_text,
    p.content_type,
    p.media_count,
    p.access_type,
    p.ppv_price,
    p.likes_count,
    p.comments_count,
    p.views_count,
    p.published_at,
    p.platform_id
FROM posts.posts p
WHERE p.status = 'published'
  AND p.is_deleted = FALSE
ORDER BY p.published_at DESC;

COMMENT ON VIEW posts.user_feed IS 'Published posts for feed display';

-- Unread messages count
CREATE VIEW messages.unread_counts AS
SELECT
    to_user_id as user_id,
    COUNT(*) as unread_count,
    MAX(sent_at) as latest_message_at
FROM messages.direct_messages
WHERE is_read = FALSE AND is_deleted = FALSE
GROUP BY to_user_id;

COMMENT ON VIEW messages.unread_counts IS 'Unread message counts per user';

-- =====================================================
-- GRANTS
-- =====================================================

-- Posts schema access
GRANT SELECT ON ALL TABLES IN SCHEMA posts TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA posts TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA posts TO platform_app_rw;

-- Threads schema access
GRANT SELECT ON ALL TABLES IN SCHEMA threads TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA threads TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA threads TO platform_app_rw;

-- Rooms schema access
GRANT SELECT ON ALL TABLES IN SCHEMA rooms TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rooms TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rooms TO platform_app_rw;

-- Messages schema access
GRANT SELECT ON ALL TABLES IN SCHEMA messages TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA messages TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA messages TO platform_app_rw;

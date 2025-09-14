-- FANZ Unified Ecosystem - Content Management Schema Migration
-- Version: 1.0.0
-- Created: 2024
-- Depends on: 001_initial_users_tables.sql

-- =====================================================
-- Content Categories and Tags
-- =====================================================

CREATE TABLE IF NOT EXISTS content_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    color_code VARCHAR(7), -- Hex color code
    parent_category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON content_categories(slug);
CREATE INDEX IF NOT EXISTS idx_content_categories_parent ON content_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_active ON content_categories(is_active);

-- =====================================================
-- Content Posts Table
-- =====================================================

CREATE TABLE IF NOT EXISTS content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content details
    title VARCHAR(500),
    description TEXT,
    content_type VARCHAR(50) NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'image', 'video', 'audio', 'live_stream', 'story', 'poll', 'article')),
    content_text TEXT, -- For text-based content
    
    -- Categorization
    category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags
    
    -- Visibility and access
    visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only', 'subscribers_only', 'premium', 'private')),
    age_restriction VARCHAR(20) DEFAULT 'all' CHECK (age_restriction IN ('all', '13+', '16+', '18+')),
    
    -- Monetization
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0, -- Pay-per-view price
    tip_enabled BOOLEAN DEFAULT TRUE,
    
    -- Content flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    allows_comments BOOLEAN DEFAULT TRUE,
    allows_likes BOOLEAN DEFAULT TRUE,
    allows_sharing BOOLEAN DEFAULT TRUE,
    
    -- Moderation
    moderation_status VARCHAR(50) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'reported', 'removed')),
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics counters (updated by triggers)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    tip_count INTEGER DEFAULT 0,
    total_tips DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE, -- For scheduled posts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for content_posts
CREATE INDEX IF NOT EXISTS idx_content_posts_creator ON content_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_category ON content_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_type ON content_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_content_posts_visibility ON content_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_content_posts_published ON content_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_created ON content_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_moderation ON content_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_content_posts_featured ON content_posts(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_posts_premium ON content_posts(is_premium);
CREATE INDEX IF NOT EXISTS idx_content_posts_deleted ON content_posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_content_posts_tags ON content_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON content_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- =====================================================
-- Content Media Table (Images, Videos, Audio)
-- =====================================================

CREATE TABLE IF NOT EXISTS content_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    
    -- Media details
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document', 'thumbnail')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT, -- Size in bytes
    file_url VARCHAR(1000) NOT NULL, -- Storage URL
    cdn_url VARCHAR(1000), -- CDN URL for faster delivery
    
    -- Media metadata
    mime_type VARCHAR(100),
    duration INTEGER, -- Duration in seconds (for video/audio)
    width INTEGER, -- Image/video width
    height INTEGER, -- Image/video height
    quality VARCHAR(20), -- original, high, medium, low
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_progress INTEGER DEFAULT 0, -- 0-100%
    processing_error TEXT,
    
    -- Media organization
    sort_order INTEGER DEFAULT 0,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    is_preview BOOLEAN DEFAULT FALSE, -- Preview for premium content
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for content_media
CREATE INDEX IF NOT EXISTS idx_content_media_post ON content_media(post_id);
CREATE INDEX IF NOT EXISTS idx_content_media_type ON content_media(media_type);
CREATE INDEX IF NOT EXISTS idx_content_media_processing ON content_media(processing_status);
CREATE INDEX IF NOT EXISTS idx_content_media_sort ON content_media(post_id, sort_order);

-- =====================================================
-- Content Interactions (Likes, Views, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS content_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interaction type
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('like', 'love', 'wow', 'sad', 'angry', 'view', 'share', 'bookmark', 'report')),
    
    -- Interaction metadata
    interaction_value INTEGER DEFAULT 1, -- For weighted interactions
    metadata JSONB DEFAULT '{}', -- Additional data
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint per interaction type
    UNIQUE(post_id, user_id, interaction_type)
);

-- Indexes for content_interactions
CREATE INDEX IF NOT EXISTS idx_content_interactions_post ON content_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_created ON content_interactions(created_at);

-- =====================================================
-- Content Comments
-- =====================================================

CREATE TABLE IF NOT EXISTS content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE, -- For nested comments
    
    -- Comment content
    comment_text TEXT NOT NULL,
    comment_html TEXT, -- Rendered HTML if markdown/rich text
    
    -- Comment features
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edit_reason TEXT,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    is_reported BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for content_comments
CREATE INDEX IF NOT EXISTS idx_content_comments_post ON content_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent ON content_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_created ON content_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_content_comments_approved ON content_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_content_comments_deleted ON content_comments(deleted_at);

-- =====================================================
-- Comment Interactions (Likes on Comments)
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES content_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interaction type
    interaction_type VARCHAR(50) NOT NULL DEFAULT 'like' CHECK (interaction_type IN ('like', 'dislike', 'report')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint per interaction type
    UNIQUE(comment_id, user_id, interaction_type)
);

-- Indexes for comment_interactions
CREATE INDEX IF NOT EXISTS idx_comment_interactions_comment ON comment_interactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_interactions_user ON comment_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_interactions_type ON comment_interactions(interaction_type);

-- =====================================================
-- Content Collections/Playlists
-- =====================================================

CREATE TABLE IF NOT EXISTS content_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Collection details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500),
    
    -- Collection settings
    visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0,
    
    -- Organization
    sort_order INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collection items (posts in collections)
CREATE TABLE IF NOT EXISTS content_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES content_collections(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(collection_id, post_id)
);

-- Indexes for collections
CREATE INDEX IF NOT EXISTS idx_content_collections_creator ON content_collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_collections_visibility ON content_collections(visibility);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON content_collection_items(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_items_post ON content_collection_items(post_id);

-- =====================================================
-- Content Analytics & Insights
-- =====================================================

CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    
    -- Date dimension
    date_recorded DATE NOT NULL,
    
    -- Metrics
    views_count INTEGER DEFAULT 0,
    unique_views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    tips_count INTEGER DEFAULT 0,
    tips_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Engagement metrics
    avg_watch_time INTEGER DEFAULT 0, -- In seconds
    completion_rate DECIMAL(5,4) DEFAULT 0, -- 0-1 (percentage as decimal)
    click_through_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Revenue metrics
    revenue DECIMAL(15,2) DEFAULT 0,
    subscription_conversions INTEGER DEFAULT 0,
    
    -- Traffic sources
    traffic_sources JSONB DEFAULT '{}', -- {"direct": 100, "social": 50, etc.}
    
    -- Demographics (aggregated)
    demographics JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint per post per day
    UNIQUE(post_id, date_recorded)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_post ON content_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date_recorded);
CREATE INDEX IF NOT EXISTS idx_content_analytics_post_date ON content_analytics(post_id, date_recorded);

-- =====================================================
-- Content Reporting & Moderation
-- =====================================================

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What's being reported
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
    content_id UUID NOT NULL, -- Could be post_id, comment_id, or user_id
    
    -- Report details
    report_reason VARCHAR(100) NOT NULL CHECK (report_reason IN (
        'spam', 'harassment', 'hate_speech', 'violence', 'nudity', 
        'copyright', 'fake_news', 'inappropriate', 'other'
    )),
    report_description TEXT,
    
    -- Report status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolution TEXT,
    
    -- Moderation
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reason ON content_reports(report_reason);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at);

-- =====================================================
-- Content Scheduling & Automation
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Schedule settings
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Automation settings
    auto_promote BOOLEAN DEFAULT FALSE,
    promotion_budget DECIMAL(10,2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for scheduled posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_creator ON scheduled_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- =====================================================
-- Feed Algorithm Tables
-- =====================================================

CREATE TABLE IF NOT EXISTS user_feed_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Algorithm preferences
    algorithm_type VARCHAR(50) DEFAULT 'balanced' CHECK (algorithm_type IN ('chronological', 'engagement', 'personalized', 'balanced')),
    content_types TEXT[] DEFAULT ARRAY['post', 'image', 'video'], -- Preferred content types
    categories TEXT[], -- Preferred categories
    
    -- Filtering preferences
    hide_seen_content BOOLEAN DEFAULT FALSE,
    hide_adult_content BOOLEAN DEFAULT TRUE,
    show_promoted_content BOOLEAN DEFAULT TRUE,
    
    -- Engagement weights
    like_weight DECIMAL(3,2) DEFAULT 1.0,
    comment_weight DECIMAL(3,2) DEFAULT 2.0,
    share_weight DECIMAL(3,2) DEFAULT 3.0,
    follow_weight DECIMAL(3,2) DEFAULT 2.5,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique per user
    UNIQUE(user_id)
);

-- User content interests (learned from behavior)
CREATE TABLE IF NOT EXISTS user_content_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interest details
    interest_type VARCHAR(50) NOT NULL CHECK (interest_type IN ('category', 'tag', 'creator', 'content_type')),
    interest_value VARCHAR(255) NOT NULL, -- The actual category/tag/creator_id/content_type
    
    -- Interest scoring
    interest_score DECIMAL(5,4) DEFAULT 0.0, -- 0-1 score
    interaction_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique per user per interest
    UNIQUE(user_id, interest_type, interest_value)
);

-- Indexes for feed preferences
CREATE INDEX IF NOT EXISTS idx_user_feed_preferences_user ON user_feed_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_interests_user ON user_content_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_interests_type_score ON user_content_interests(interest_type, interest_score DESC);

-- =====================================================
-- Triggers for Updating Counters
-- =====================================================

-- Function to update post counters
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle different trigger scenarios
    IF TG_TABLE_NAME = 'content_interactions' THEN
        IF TG_OP = 'INSERT' THEN
            -- Increment counter based on interaction type
            IF NEW.interaction_type = 'like' THEN
                UPDATE content_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
            ELSIF NEW.interaction_type = 'view' THEN
                UPDATE content_posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
            ELSIF NEW.interaction_type = 'share' THEN
                UPDATE content_posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            -- Decrement counter
            IF OLD.interaction_type = 'like' THEN
                UPDATE content_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
            ELSIF OLD.interaction_type = 'share' THEN
                UPDATE content_posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'content_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE content_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
            -- Update parent comment reply count
            IF NEW.parent_comment_id IS NOT NULL THEN
                UPDATE content_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE content_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
            -- Update parent comment reply count
            IF OLD.parent_comment_id IS NOT NULL THEN
                UPDATE content_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_post_interaction_counters 
    AFTER INSERT OR DELETE ON content_interactions
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

CREATE TRIGGER update_post_comment_counters 
    AFTER INSERT OR DELETE ON content_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- Function to update comment like counters
CREATE OR REPLACE FUNCTION update_comment_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE content_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE content_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply comment counter trigger
CREATE TRIGGER update_comment_interaction_counters 
    AFTER INSERT OR DELETE ON comment_interactions
    FOR EACH ROW EXECUTE FUNCTION update_comment_counters();

-- Update collection post counts
CREATE OR REPLACE FUNCTION update_collection_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content_collections SET post_count = post_count + 1 WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content_collections SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.collection_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_post_counters 
    AFTER INSERT OR DELETE ON content_collection_items
    FOR EACH ROW EXECUTE FUNCTION update_collection_counters();

-- Apply updated_at trigger to content tables
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_media_updated_at BEFORE UPDATE ON content_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at BEFORE UPDATE ON content_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_collections_updated_at BEFORE UPDATE ON content_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Data
-- =====================================================

-- Insert default content categories
INSERT INTO content_categories (name, slug, description, sort_order) VALUES
('General', 'general', 'General content and discussions', 1),
('Art & Design', 'art-design', 'Artistic creations and design work', 2),
('Photography', 'photography', 'Photography and visual arts', 3),
('Music', 'music', 'Musical content and audio', 4),
('Videos', 'videos', 'Video content and entertainment', 5),
('Gaming', 'gaming', 'Gaming content and live streams', 6),
('Fitness', 'fitness', 'Fitness and wellness content', 7),
('Education', 'education', 'Educational and tutorial content', 8),
('Technology', 'technology', 'Tech reviews and discussions', 9),
('Lifestyle', 'lifestyle', 'Lifestyle and personal content', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Views for Content Discovery
-- =====================================================

-- Trending posts view
CREATE OR REPLACE VIEW trending_posts AS
SELECT 
    p.*,
    u.username as creator_username,
    up.display_name as creator_display_name,
    up.avatar_url as creator_avatar_url,
    cc.name as category_name,
    -- Calculate trending score based on recent engagement
    (
        COALESCE(p.like_count, 0) * 1.0 +
        COALESCE(p.comment_count, 0) * 2.0 +
        COALESCE(p.share_count, 0) * 3.0 +
        COALESCE(p.view_count, 0) * 0.1
    ) / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.published_at)) / 3600, 1) as trending_score
FROM content_posts p
JOIN users u ON p.creator_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN content_categories cc ON p.category_id = cc.id
WHERE p.published_at IS NOT NULL 
  AND p.published_at <= NOW()
  AND p.deleted_at IS NULL
  AND p.moderation_status = 'approved'
  AND p.visibility IN ('public', 'followers_only')
  AND p.published_at >= NOW() - INTERVAL '7 days' -- Only recent content
ORDER BY trending_score DESC;

-- Popular creators view
CREATE OR REPLACE VIEW popular_creators AS
SELECT 
    u.id,
    u.username,
    up.display_name,
    up.avatar_url,
    cp.verification_status,
    COUNT(p.id) as post_count,
    SUM(p.like_count) as total_likes,
    SUM(p.view_count) as total_views,
    AVG(p.like_count) as avg_likes_per_post,
    MAX(p.published_at) as last_post_date
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN creator_profiles cp ON u.id = cp.user_id
LEFT JOIN content_posts p ON u.id = p.creator_id 
    AND p.published_at IS NOT NULL 
    AND p.deleted_at IS NULL 
    AND p.moderation_status = 'approved'
    AND p.published_at >= NOW() - INTERVAL '30 days'
WHERE u.role IN ('creator', 'admin')
  AND u.deleted_at IS NULL
  AND u.account_status = 'active'
GROUP BY u.id, u.username, up.display_name, up.avatar_url, cp.verification_status
HAVING COUNT(p.id) > 0
ORDER BY total_likes DESC, total_views DESC;

-- =====================================================
-- Performance Optimization
-- =====================================================

-- Analyze new tables
ANALYZE content_categories, content_posts, content_media, content_interactions, 
        content_comments, comment_interactions, content_collections, content_analytics;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE content_posts IS 'Main content posts including text, images, videos, and other media';
COMMENT ON TABLE content_media IS 'Media files associated with content posts';
COMMENT ON TABLE content_interactions IS 'User interactions with content (likes, views, shares, etc.)';
COMMENT ON TABLE content_comments IS 'Comments on content posts with nested reply support';
COMMENT ON TABLE content_collections IS 'User-created collections/playlists of content';
COMMENT ON TABLE content_analytics IS 'Daily analytics data for content performance tracking';

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'FANZ Unified Ecosystem - Content Management schema migration completed successfully';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Tables created: content_posts, content_media, content_interactions, content_comments, content_collections, content_analytics, and supporting tables';
    RAISE NOTICE 'Default content categories inserted';
    RAISE NOTICE 'Content discovery views created: trending_posts, popular_creators';
    RAISE NOTICE 'Counter update triggers implemented for real-time statistics';
END $$;
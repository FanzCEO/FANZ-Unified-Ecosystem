-- =====================================================
-- FANZ DISCOVERY DATABASE
-- Rankings, recommendations, search, trending
-- Used by: FanzDiscovery, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- RANKINGS SCHEMA - Creator rankings
-- =====================================================

CREATE SCHEMA rankings;

-- =====================================================
-- CREATOR RANKINGS
-- =====================================================

CREATE TABLE rankings.creator_rankings (
    ranking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Category
    category VARCHAR(50),
    subcategory VARCHAR(50),

    -- Ranking metrics
    overall_rank INTEGER NOT NULL,
    category_rank INTEGER,
    trending_rank INTEGER,

    -- Scores (0-100)
    overall_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    engagement_score DECIMAL(10,2) DEFAULT 0,
    content_quality_score DECIMAL(10,2) DEFAULT 0,
    fan_satisfaction_score DECIMAL(10,2) DEFAULT 0,
    consistency_score DECIMAL(10,2) DEFAULT 0,
    growth_score DECIMAL(10,2) DEFAULT 0,

    -- Stats used for ranking
    total_fans INTEGER DEFAULT 0,
    total_subscribers INTEGER DEFAULT 0,
    monthly_earnings BIGINT DEFAULT 0,
    monthly_posts INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    retention_rate DECIMAL(5,2) DEFAULT 0,

    -- Time periods
    ranking_period VARCHAR(20) NOT NULL CHECK (ranking_period IN ('daily', 'weekly', 'monthly', 'all_time')),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Change tracking
    rank_change INTEGER DEFAULT 0, -- +/- from previous period
    score_change DECIMAL(10,2) DEFAULT 0,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(creator_id, platform_id, category, ranking_period, period_start)
);

CREATE INDEX idx_rankings_creator ON rankings.creator_rankings(creator_id, ranking_period);
CREATE INDEX idx_rankings_platform ON rankings.creator_rankings(platform_id, ranking_period, overall_rank);
CREATE INDEX idx_rankings_category ON rankings.creator_rankings(category, ranking_period, category_rank) WHERE category IS NOT NULL;
CREATE INDEX idx_rankings_overall ON rankings.creator_rankings(overall_rank, ranking_period);
CREATE INDEX idx_rankings_trending ON rankings.creator_rankings(trending_rank, calculated_at DESC) WHERE trending_rank IS NOT NULL;
CREATE INDEX idx_rankings_period ON rankings.creator_rankings(ranking_period, period_start, period_end);

COMMENT ON TABLE rankings.creator_rankings IS 'Creator ranking metrics and positions';

-- =====================================================
-- TRENDING CREATORS
-- =====================================================

CREATE TABLE rankings.trending_creators (
    trending_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Trending metrics
    trending_score DECIMAL(10,2) NOT NULL,
    velocity_score DECIMAL(10,2) NOT NULL, -- Rate of growth

    -- Growth metrics
    new_fans_count INTEGER DEFAULT 0,
    new_subscribers_count INTEGER DEFAULT 0,
    fan_growth_percentage DECIMAL(5,2) DEFAULT 0,
    subscriber_growth_percentage DECIMAL(5,2) DEFAULT 0,

    -- Engagement spikes
    posts_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    -- Time window
    time_window VARCHAR(20) NOT NULL CHECK (time_window IN ('1h', '6h', '24h', '7d', '30d')),
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,

    -- Position
    trending_position INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(creator_id, platform_id, time_window, window_start)
);

CREATE INDEX idx_trending_platform ON rankings.trending_creators(platform_id, trending_position, calculated_at DESC);
CREATE INDEX idx_trending_score ON rankings.trending_creators(trending_score DESC, calculated_at DESC);
CREATE INDEX idx_trending_window ON rankings.trending_creators(time_window, calculated_at DESC);

COMMENT ON TABLE rankings.trending_creators IS 'Trending creators based on velocity';

-- =====================================================
-- RECOMMENDATIONS SCHEMA
-- =====================================================

CREATE SCHEMA recommendations;

-- =====================================================
-- CREATOR RECOMMENDATIONS
-- =====================================================

CREATE TABLE recommendations.creator_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    creator_id UUID NOT NULL,

    -- Recommendation source
    recommendation_type VARCHAR(30) NOT NULL CHECK (recommendation_type IN (
        'personalized', 'similar_creators', 'trending', 'new', 'featured',
        'category_based', 'collaborative_filtering', 'content_based'
    )),

    -- Scoring
    relevance_score DECIMAL(10,2) NOT NULL,
    confidence_score DECIMAL(10,2) NOT NULL,

    -- Reasoning
    recommendation_reasons TEXT[], -- ['similar_taste', 'trending_in_category']

    -- Related entities
    based_on_creator_ids UUID[], -- Creators user already follows
    based_on_categories TEXT[],

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Position
    display_position INTEGER,

    -- Interaction tracking
    was_viewed BOOLEAN DEFAULT FALSE,
    was_clicked BOOLEAN DEFAULT FALSE,
    was_subscribed BOOLEAN DEFAULT FALSE,
    interaction_type VARCHAR(30),

    -- Expiration
    expires_at TIMESTAMP NOT NULL,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMP,
    clicked_at TIMESTAMP
);

CREATE INDEX idx_recommendations_user ON recommendations.creator_recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_creator ON recommendations.creator_recommendations(creator_id);
CREATE INDEX idx_recommendations_platform ON recommendations.creator_recommendations(platform_id, user_id) WHERE expires_at > NOW();
CREATE INDEX idx_recommendations_score ON recommendations.creator_recommendations(relevance_score DESC) WHERE expires_at > NOW();
CREATE INDEX idx_recommendations_expires ON recommendations.creator_recommendations(expires_at);

COMMENT ON TABLE recommendations.creator_recommendations IS 'Personalized creator recommendations for users';

-- =====================================================
-- CONTENT RECOMMENDATIONS
-- =====================================================

CREATE TABLE recommendations.content_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL, -- Post, media, etc.

    -- Content type
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'post', 'video', 'photo', 'photoset', 'live_stream', 'story'
    )),

    -- Recommendation source
    recommendation_type VARCHAR(30) NOT NULL CHECK (recommendation_type IN (
        'for_you', 'following', 'trending', 'similar_content', 'category_based'
    )),

    -- Scoring
    relevance_score DECIMAL(10,2) NOT NULL,

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Position in feed
    feed_position INTEGER,

    -- Interaction tracking
    was_viewed BOOLEAN DEFAULT FALSE,
    was_liked BOOLEAN DEFAULT FALSE,
    was_purchased BOOLEAN DEFAULT FALSE,
    view_duration_seconds INTEGER,

    -- Expiration
    expires_at TIMESTAMP NOT NULL,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMP
);

CREATE INDEX idx_content_recommendations_user ON recommendations.content_recommendations(user_id, created_at DESC);
CREATE INDEX idx_content_recommendations_content ON recommendations.content_recommendations(content_id);
CREATE INDEX idx_content_recommendations_platform ON recommendations.content_recommendations(platform_id, user_id) WHERE expires_at > NOW();

COMMENT ON TABLE recommendations.content_recommendations IS 'Personalized content recommendations';

-- =====================================================
-- SEARCH SCHEMA
-- =====================================================

CREATE SCHEMA search;

-- =====================================================
-- SEARCH QUERIES
-- =====================================================

CREATE TABLE search.queries (
    query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,

    -- Query details
    query_text TEXT NOT NULL,
    query_normalized TEXT NOT NULL, -- Lowercased, trimmed
    query_language VARCHAR(10) DEFAULT 'en',

    -- Search context
    search_type VARCHAR(30) NOT NULL CHECK (search_type IN (
        'creators', 'content', 'tags', 'global'
    )),
    platform_id VARCHAR(50) NOT NULL,

    -- Filters applied
    filters JSONB,

    -- Results
    results_count INTEGER NOT NULL,
    results_returned INTEGER NOT NULL,

    -- Interaction
    clicked_result_ids UUID[],
    clicked_result_positions INTEGER[],

    -- Performance
    search_duration_ms INTEGER,

    -- Device info
    user_agent TEXT,
    ip_address INET,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    searched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queries_user ON search.queries(user_id, searched_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_queries_text ON search.queries USING gin(query_normalized gin_trgm_ops);
CREATE INDEX idx_queries_platform ON search.queries(platform_id, searched_at DESC);
CREATE INDEX idx_queries_type ON search.queries(search_type, searched_at DESC);
CREATE INDEX idx_queries_date ON search.queries(searched_at DESC);

COMMENT ON TABLE search.queries IS 'Search query log for analytics';

-- =====================================================
-- POPULAR SEARCHES
-- =====================================================

CREATE TABLE search.popular_searches (
    popular_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Query
    query_text TEXT NOT NULL,
    query_normalized TEXT NOT NULL,

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Category
    category VARCHAR(50),

    -- Metrics
    search_count INTEGER NOT NULL DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,

    -- Time period
    time_window VARCHAR(20) NOT NULL CHECK (time_window IN ('1h', '24h', '7d', '30d')),
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,

    -- Ranking
    popularity_rank INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(query_normalized, platform_id, time_window, window_start)
);

CREATE INDEX idx_popular_platform ON search.popular_searches(platform_id, time_window, popularity_rank);
CREATE INDEX idx_popular_rank ON search.popular_searches(popularity_rank, time_window);

COMMENT ON TABLE search.popular_searches IS 'Trending search queries';

-- =====================================================
-- SEARCH INDEX (Creator catalog for search)
-- =====================================================

CREATE TABLE search.creator_index (
    index_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Searchable fields
    display_name TEXT NOT NULL,
    display_name_normalized TEXT NOT NULL,
    bio TEXT,
    tags TEXT[],
    categories TEXT[],

    -- Search tokens
    search_vector tsvector,

    -- Platform
    platform_id VARCHAR(50) NOT NULL,

    -- Status
    is_searchable BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Stats for ranking
    fan_count INTEGER DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    ranking_score DECIMAL(10,2) DEFAULT 0,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    indexed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_index_creator ON search.creator_index(creator_id);
CREATE INDEX idx_creator_index_platform ON search.creator_index(platform_id, is_searchable) WHERE is_searchable = TRUE;
CREATE INDEX idx_creator_index_name ON search.creator_index USING gin(display_name_normalized gin_trgm_ops);
CREATE INDEX idx_creator_index_tags ON search.creator_index USING gin(tags);
CREATE INDEX idx_creator_index_vector ON search.creator_index USING gin(search_vector);

COMMENT ON TABLE search.creator_index IS 'Optimized creator search index';

-- =====================================================
-- BANNED CREATORS FEED
-- =====================================================

CREATE TABLE search.banned_creators_feed (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,

    -- Ban info
    ban_reason VARCHAR(255) NOT NULL,
    ban_reason_code VARCHAR(50) NOT NULL,
    banned_platforms TEXT[], -- Array of platform_ids

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    show_in_feed BOOLEAN DEFAULT TRUE,

    -- Associated ban record
    ban_record_id UUID,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    banned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banned_feed_creator ON search.banned_creators_feed(creator_id);
CREATE INDEX idx_banned_feed_public ON search.banned_creators_feed(banned_at DESC) WHERE is_public = TRUE AND show_in_feed = TRUE;
CREATE INDEX idx_banned_feed_platforms ON search.banned_creators_feed USING gin(banned_platforms);

COMMENT ON TABLE search.banned_creators_feed IS 'Public feed of banned creators for transparency';

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

CREATE TRIGGER update_creator_index_updated_at BEFORE UPDATE ON search.creator_index
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banned_feed_updated_at BEFORE UPDATE ON search.banned_creators_feed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update search_vector on creator_index
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_creator_search_vector BEFORE INSERT OR UPDATE ON search.creator_index
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- =====================================================
-- MATERIALIZED VIEWS (for performance)
-- =====================================================

-- Top creators by platform
CREATE MATERIALIZED VIEW rankings.top_creators_by_platform AS
SELECT
    platform_id,
    category,
    ranking_period,
    creator_id,
    overall_rank,
    overall_score,
    total_fans,
    total_subscribers,
    calculated_at
FROM rankings.creator_rankings
WHERE ranking_period = 'weekly'
  AND overall_rank <= 100
ORDER BY platform_id, category, overall_rank;

CREATE INDEX idx_top_creators_platform ON rankings.top_creators_by_platform(platform_id, category, overall_rank);

COMMENT ON MATERIALIZED VIEW rankings.top_creators_by_platform IS 'Top 100 creators per platform (weekly refresh)';

-- Trending content
CREATE MATERIALIZED VIEW rankings.trending_content AS
SELECT
    t.creator_id,
    t.platform_id,
    t.trending_score,
    t.new_fans_count,
    t.fan_growth_percentage,
    t.trending_position,
    c.display_name,
    c.categories,
    t.calculated_at
FROM rankings.trending_creators t
JOIN search.creator_index c ON t.creator_id = c.creator_id
WHERE t.time_window = '24h'
  AND t.trending_position <= 50
ORDER BY t.platform_id, t.trending_position;

CREATE INDEX idx_trending_content_platform ON rankings.trending_content(platform_id, trending_position);

COMMENT ON MATERIALIZED VIEW rankings.trending_content IS 'Top 50 trending creators (24h refresh)';

-- =====================================================
-- VIEWS
-- =====================================================

-- Creator discovery feed
CREATE VIEW search.discovery_feed AS
SELECT
    c.creator_id,
    c.display_name,
    c.categories,
    c.tags,
    c.platform_id,
    c.is_verified,
    c.fan_count,
    c.ranking_score,
    r.overall_rank,
    r.trending_rank,
    t.trending_score
FROM search.creator_index c
LEFT JOIN rankings.creator_rankings r ON c.creator_id = r.creator_id AND r.ranking_period = 'weekly'
LEFT JOIN rankings.trending_creators t ON c.creator_id = t.creator_id AND t.time_window = '24h'
WHERE c.is_searchable = TRUE
ORDER BY c.ranking_score DESC;

COMMENT ON VIEW search.discovery_feed IS 'Creator discovery feed with rankings';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION rankings.refresh_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY rankings.top_creators_by_platform;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rankings.trending_content;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rankings.refresh_rankings IS 'Refresh all ranking materialized views';

-- =====================================================
-- GRANTS
-- =====================================================

-- Rankings access
GRANT SELECT ON ALL TABLES IN SCHEMA rankings TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA rankings TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rankings TO platform_app_rw;

-- Recommendations access
GRANT SELECT ON ALL TABLES IN SCHEMA recommendations TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA recommendations TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA recommendations TO platform_app_rw;

-- Search access
GRANT SELECT ON ALL TABLES IN SCHEMA search TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA search TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA search TO platform_app_rw;

-- Materialized view refresh permissions
GRANT EXECUTE ON FUNCTION rankings.refresh_rankings TO platform_app_rw;

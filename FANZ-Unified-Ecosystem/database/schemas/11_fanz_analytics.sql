-- =====================================================
-- FANZ ANALYTICS DATABASE
-- Event warehouse, revenue aggregates, content performance
-- Used by: FanzAnalytics, Data Pipeline, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb"; -- For time-series data (optional)

-- =====================================================
-- EVENTS SCHEMA - Event warehouse
-- =====================================================

CREATE SCHEMA events;

-- =====================================================
-- RAW EVENTS
-- =====================================================

CREATE TABLE events.raw_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

    -- User context
    user_id UUID,
    session_id VARCHAR(100),
    anonymous_id VARCHAR(100), -- For non-logged-in users

    -- Platform context
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Device/browser
    user_agent TEXT,
    device_type VARCHAR(20),
    device_id VARCHAR(255),
    browser VARCHAR(50),
    os VARCHAR(50),

    -- Location
    ip_address INET,
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Event properties (flexible JSONB)
    properties JSONB NOT NULL,

    -- UTM parameters (marketing attribution)
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),

    -- Referrer
    referrer_url TEXT,
    landing_page_url TEXT,

    -- Processing
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,

    -- Timestamps
    received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization (if using TimescaleDB)
-- SELECT create_hypertable('events.raw_events', 'event_timestamp', chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_raw_events_user ON events.raw_events(user_id, event_timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_raw_events_session ON events.raw_events(session_id, event_timestamp DESC) WHERE session_id IS NOT NULL;
CREATE INDEX idx_raw_events_platform ON events.raw_events(platform_id, event_timestamp DESC);
CREATE INDEX idx_raw_events_name ON events.raw_events(event_name, event_timestamp DESC);
CREATE INDEX idx_raw_events_category ON events.raw_events(event_category, event_timestamp DESC);
CREATE INDEX idx_raw_events_timestamp ON events.raw_events(event_timestamp DESC);
CREATE INDEX idx_raw_events_properties ON events.raw_events USING gin(properties);
CREATE INDEX idx_raw_events_unprocessed ON events.raw_events(received_at) WHERE is_processed = FALSE;

COMMENT ON TABLE events.raw_events IS 'Raw event stream from all platforms';

-- =====================================================
-- EVENT DEFINITIONS
-- =====================================================

CREATE TABLE events.event_definitions (
    definition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    event_name VARCHAR(100) NOT NULL UNIQUE,
    event_category VARCHAR(50) NOT NULL,
    description TEXT,

    -- Schema
    required_properties TEXT[], -- Required property keys
    property_schema JSONB, -- JSON schema for validation

    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_pii_sensitive BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_defs_name ON events.event_definitions(event_name);
CREATE INDEX idx_event_defs_category ON events.event_definitions(event_category);

COMMENT ON TABLE events.event_definitions IS 'Event schema definitions';

-- =====================================================
-- REVENUE SCHEMA - Financial aggregates
-- =====================================================

CREATE SCHEMA revenue;

-- =====================================================
-- DAILY REVENUE
-- =====================================================

CREATE TABLE revenue.daily_revenue (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Date
    revenue_date DATE NOT NULL,

    -- Dimensions
    platform_id VARCHAR(50) NOT NULL,
    creator_id UUID,
    revenue_type VARCHAR(30) NOT NULL CHECK (revenue_type IN (
        'subscription', 'tip', 'ppv', 'custom_content', 'product', 'total'
    )),

    -- Metrics (all in cents)
    gross_revenue BIGINT NOT NULL DEFAULT 0,
    platform_fees BIGINT NOT NULL DEFAULT 0,
    processor_fees BIGINT NOT NULL DEFAULT 0,
    net_revenue BIGINT NOT NULL DEFAULT 0,
    refunds BIGINT NOT NULL DEFAULT 0,
    chargebacks BIGINT NOT NULL DEFAULT 0,

    -- Transaction counts
    transaction_count INTEGER DEFAULT 0,
    unique_buyers_count INTEGER DEFAULT 0,

    -- Currency
    currency VARCHAR(3) DEFAULT 'USD',

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(revenue_date, platform_id, creator_id, revenue_type)
);

CREATE INDEX idx_daily_revenue_date ON revenue.daily_revenue(revenue_date DESC);
CREATE INDEX idx_daily_revenue_platform ON revenue.daily_revenue(platform_id, revenue_date DESC);
CREATE INDEX idx_daily_revenue_creator ON revenue.daily_revenue(creator_id, revenue_date DESC) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_daily_revenue_type ON revenue.daily_revenue(revenue_type, revenue_date DESC);

COMMENT ON TABLE revenue.daily_revenue IS 'Daily revenue aggregates by platform and creator';

-- =====================================================
-- MONTHLY REVENUE
-- =====================================================

CREATE TABLE revenue.monthly_revenue (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Month
    revenue_year INTEGER NOT NULL,
    revenue_month INTEGER NOT NULL CHECK (revenue_month BETWEEN 1 AND 12),

    -- Dimensions
    platform_id VARCHAR(50) NOT NULL,
    creator_id UUID,
    revenue_type VARCHAR(30) NOT NULL,

    -- Metrics (all in cents)
    gross_revenue BIGINT NOT NULL DEFAULT 0,
    platform_fees BIGINT NOT NULL DEFAULT 0,
    processor_fees BIGINT NOT NULL DEFAULT 0,
    net_revenue BIGINT NOT NULL DEFAULT 0,
    refunds BIGINT NOT NULL DEFAULT 0,
    chargebacks BIGINT NOT NULL DEFAULT 0,

    -- Transaction counts
    transaction_count INTEGER DEFAULT 0,
    unique_buyers_count INTEGER DEFAULT 0,
    active_days INTEGER DEFAULT 0,

    -- Growth metrics
    growth_percentage DECIMAL(10,2),
    growth_amount BIGINT,

    -- Currency
    currency VARCHAR(3) DEFAULT 'USD',

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(revenue_year, revenue_month, platform_id, creator_id, revenue_type)
);

CREATE INDEX idx_monthly_revenue_date ON revenue.monthly_revenue(revenue_year DESC, revenue_month DESC);
CREATE INDEX idx_monthly_revenue_platform ON revenue.monthly_revenue(platform_id, revenue_year DESC, revenue_month DESC);
CREATE INDEX idx_monthly_revenue_creator ON revenue.monthly_revenue(creator_id, revenue_year DESC, revenue_month DESC) WHERE creator_id IS NOT NULL;

COMMENT ON TABLE revenue.monthly_revenue IS 'Monthly revenue aggregates with growth tracking';

-- =====================================================
-- CONTENT SCHEMA - Content performance
-- =====================================================

CREATE SCHEMA content_analytics;

-- =====================================================
-- CONTENT PERFORMANCE
-- =====================================================

CREATE TABLE content_analytics.performance (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content reference
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'post', 'video', 'photo', 'photoset', 'live_stream', 'story', 'message'
    )),
    content_id UUID NOT NULL,

    -- Creator
    creator_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Time period
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'lifetime')),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Engagement metrics
    views_count INTEGER DEFAULT 0,
    unique_viewers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,

    -- Viewing metrics
    avg_view_duration_seconds INTEGER,
    completion_rate DECIMAL(5,2), -- Percentage who viewed to end
    replay_count INTEGER DEFAULT 0,

    -- Monetization
    purchases_count INTEGER DEFAULT 0,
    revenue_generated BIGINT DEFAULT 0, -- In cents
    tips_received BIGINT DEFAULT 0,

    -- Engagement rate
    engagement_rate DECIMAL(5,2), -- (likes + comments + shares) / views * 100

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(content_type, content_id, period_type, period_start)
);

CREATE INDEX idx_performance_content ON content_analytics.performance(content_type, content_id, period_type);
CREATE INDEX idx_performance_creator ON content_analytics.performance(creator_id, period_start DESC);
CREATE INDEX idx_performance_platform ON content_analytics.performance(platform_id, period_start DESC);
CREATE INDEX idx_performance_period ON content_analytics.performance(period_type, period_start DESC);

COMMENT ON TABLE content_analytics.performance IS 'Content performance metrics over time';

-- =====================================================
-- TRENDING CONTENT
-- =====================================================

CREATE TABLE content_analytics.trending (
    trending_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content reference
    content_type VARCHAR(30) NOT NULL,
    content_id UUID NOT NULL,

    -- Creator
    creator_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Trending metrics
    trending_score DECIMAL(10,2) NOT NULL,
    velocity_score DECIMAL(10,2) NOT NULL, -- Rate of engagement growth

    -- Time window
    time_window VARCHAR(20) NOT NULL CHECK (time_window IN ('1h', '6h', '24h', '7d')),
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,

    -- Engagement spike
    views_spike INTEGER DEFAULT 0,
    likes_spike INTEGER DEFAULT 0,
    shares_spike INTEGER DEFAULT 0,

    -- Ranking
    trending_rank INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(content_type, content_id, time_window, window_start)
);

CREATE INDEX idx_trending_platform ON content_analytics.trending(platform_id, trending_rank, calculated_at DESC);
CREATE INDEX idx_trending_score ON content_analytics.trending(trending_score DESC, calculated_at DESC);
CREATE INDEX idx_trending_window ON content_analytics.trending(time_window, calculated_at DESC);

COMMENT ON TABLE content_analytics.trending IS 'Trending content detection';

-- =====================================================
-- USER SCHEMA - User behavior analytics
-- =====================================================

CREATE SCHEMA user_analytics;

-- =====================================================
-- USER COHORTS
-- =====================================================

CREATE TABLE user_analytics.cohorts (
    cohort_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Cohort definition
    cohort_name VARCHAR(255) NOT NULL,
    cohort_description TEXT,

    -- Cohort type
    cohort_type VARCHAR(30) NOT NULL CHECK (cohort_type IN (
        'acquisition_date', 'behavioral', 'demographic', 'custom'
    )),

    -- Criteria
    criteria JSONB NOT NULL,

    -- Platform
    platform_id VARCHAR(50),

    -- Size
    user_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_name ON user_analytics.cohorts(cohort_name);
CREATE INDEX idx_cohorts_type ON user_analytics.cohorts(cohort_type);
CREATE INDEX idx_cohorts_platform ON user_analytics.cohorts(platform_id) WHERE platform_id IS NOT NULL;

COMMENT ON TABLE user_analytics.cohorts IS 'User cohort definitions';

-- =====================================================
-- COHORT ANALYSIS
-- =====================================================

CREATE TABLE user_analytics.cohort_analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_id UUID NOT NULL REFERENCES user_analytics.cohorts(cohort_id),

    -- Time period
    period_number INTEGER NOT NULL, -- 0 = acquisition period, 1 = first period after, etc.
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Retention
    retained_users_count INTEGER DEFAULT 0,
    retention_rate DECIMAL(5,2),

    -- Engagement
    avg_sessions_per_user DECIMAL(10,2),
    avg_time_spent_seconds INTEGER,
    active_users_count INTEGER DEFAULT 0,

    -- Revenue
    revenue_generated BIGINT DEFAULT 0,
    avg_revenue_per_user BIGINT DEFAULT 0,
    paying_users_count INTEGER DEFAULT 0,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(cohort_id, period_number)
);

CREATE INDEX idx_cohort_analysis_cohort ON user_analytics.cohort_analysis(cohort_id, period_number);

COMMENT ON TABLE user_analytics.cohort_analysis IS 'Cohort retention and behavior analysis';

-- =====================================================
-- FUNNEL SCHEMA - Conversion funnels
-- =====================================================

CREATE SCHEMA funnels;

-- =====================================================
-- FUNNEL DEFINITIONS
-- =====================================================

CREATE TABLE funnels.definitions (
    funnel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Funnel details
    funnel_name VARCHAR(255) NOT NULL,
    funnel_description TEXT,

    -- Steps (ordered)
    steps JSONB NOT NULL, -- Array of {step_name, event_name, properties_filter}

    -- Platform
    platform_id VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funnel_defs_name ON funnels.definitions(funnel_name);
CREATE INDEX idx_funnel_defs_platform ON funnels.definitions(platform_id) WHERE platform_id IS NOT NULL;

COMMENT ON TABLE funnels.definitions IS 'Conversion funnel definitions';

-- =====================================================
-- FUNNEL ANALYSIS
-- =====================================================

CREATE TABLE funnels.analysis (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID NOT NULL REFERENCES funnels.definitions(funnel_id),

    -- Time period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Step metrics
    step_number INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,

    -- Counts
    users_entered INTEGER DEFAULT 0,
    users_completed INTEGER DEFAULT 0,
    users_dropped INTEGER DEFAULT 0,

    -- Rates
    completion_rate DECIMAL(5,2),
    drop_off_rate DECIMAL(5,2),

    -- Time metrics
    avg_time_to_complete_seconds INTEGER,
    median_time_to_complete_seconds INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(funnel_id, period_start, period_end, step_number)
);

CREATE INDEX idx_funnel_analysis_funnel ON funnels.analysis(funnel_id, period_start DESC);
CREATE INDEX idx_funnel_analysis_period ON funnels.analysis(period_start DESC, period_end DESC);

COMMENT ON TABLE funnels.analysis IS 'Funnel conversion analysis';

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

CREATE TRIGGER update_event_defs_updated_at BEFORE UPDATE ON events.event_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_revenue_updated_at BEFORE UPDATE ON revenue.daily_revenue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_revenue_updated_at BEFORE UPDATE ON revenue.monthly_revenue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON user_analytics.cohorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_defs_updated_at BEFORE UPDATE ON funnels.definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Platform revenue summary
CREATE MATERIALIZED VIEW revenue.platform_summary AS
SELECT
    platform_id,
    SUM(gross_revenue) as total_gross_revenue,
    SUM(net_revenue) as total_net_revenue,
    SUM(transaction_count) as total_transactions,
    COUNT(DISTINCT creator_id) as active_creators
FROM revenue.daily_revenue
WHERE revenue_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY platform_id;

CREATE INDEX idx_platform_summary_platform ON revenue.platform_summary(platform_id);

COMMENT ON MATERIALIZED VIEW revenue.platform_summary IS 'Last 30 days platform revenue summary';

-- Top performing content
CREATE MATERIALIZED VIEW content_analytics.top_content AS
SELECT
    p.content_type,
    p.content_id,
    p.creator_id,
    p.platform_id,
    SUM(p.views_count) as total_views,
    SUM(p.likes_count) as total_likes,
    SUM(p.revenue_generated) as total_revenue,
    AVG(p.engagement_rate) as avg_engagement_rate
FROM content_analytics.performance p
WHERE p.period_start >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.content_type, p.content_id, p.creator_id, p.platform_id
ORDER BY total_views DESC
LIMIT 1000;

CREATE INDEX idx_top_content_creator ON content_analytics.top_content(creator_id);
CREATE INDEX idx_top_content_platform ON content_analytics.top_content(platform_id);

COMMENT ON MATERIALIZED VIEW content_analytics.top_content IS 'Top 1000 performing content (7 days)';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to refresh analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY revenue.platform_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY content_analytics.top_content;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_analytics_views IS 'Refresh all analytics materialized views';

-- =====================================================
-- VIEWS
-- =====================================================

-- Recent events summary
CREATE VIEW events.recent_summary AS
SELECT
    event_name,
    event_category,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    MAX(event_timestamp) as last_occurred
FROM events.raw_events
WHERE event_timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY event_name, event_category
ORDER BY event_count DESC;

COMMENT ON VIEW events.recent_summary IS 'Last hour event summary';

-- =====================================================
-- GRANTS
-- =====================================================

-- Events schema access
GRANT SELECT ON ALL TABLES IN SCHEMA events TO platform_app_ro;
GRANT SELECT, INSERT ON events.raw_events TO platform_app_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA events TO analytics_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA events TO analytics_rw;

-- Revenue schema access
GRANT SELECT ON ALL TABLES IN SCHEMA revenue TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA revenue TO analytics_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA revenue TO analytics_rw;

-- Content analytics schema access
GRANT SELECT ON ALL TABLES IN SCHEMA content_analytics TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA content_analytics TO analytics_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA content_analytics TO analytics_rw;

-- User analytics schema access
GRANT SELECT ON ALL TABLES IN SCHEMA user_analytics TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA user_analytics TO analytics_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA user_analytics TO analytics_rw;

-- Funnels schema access
GRANT SELECT ON ALL TABLES IN SCHEMA funnels TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA funnels TO analytics_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA funnels TO analytics_rw;

-- Function execution
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO analytics_rw;

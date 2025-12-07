-- FANZ Cross-Platform Ad System Database Schema
-- PostgreSQL initialization script with adult-content compliance

-- Connect to the fanz_ads_dev database
\c fanz_ads_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone
SET timezone = 'UTC';

-- Create database schema
CREATE SCHEMA IF NOT EXISTS fanz_ads;
SET search_path TO fanz_ads;

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'active', 'paused', 'rejected', 'completed')),
    budget_cents BIGINT NOT NULL CHECK (budget_cents >= 500), -- Minimum $5 budget
    spent_cents BIGINT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    bid_type VARCHAR(10) NOT NULL CHECK (bid_type IN ('CPM', 'CPC', 'CPA')),
    bid_amount_cents INTEGER,
    placements TEXT[] NOT NULL, -- Array of placement types
    targeting JSONB DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    -- Payment processor tracking (adult-friendly only)
    payment_processor VARCHAR(100), -- CCBill, Segpay, Epoch, etc.
    payment_id VARCHAR(255),
    payment_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Creatives table
CREATE TABLE creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creative_type VARCHAR(20) NOT NULL CHECK (creative_type IN ('image', 'video', 'html')),
    creative_url TEXT NOT NULL,
    alt_text TEXT,
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    landing_url TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad impressions and events
CREATE TABLE ad_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creative_id UUID REFERENCES creatives(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('impression', 'viewable', 'click', 'conversion')),
    placement VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('boyfanz', 'girlfanz', 'pupfanz', 'taboofanz', 'daddiesfanz', 'cougarfanz')),
    device VARCHAR(20),
    geo VARCHAR(5), -- Country code
    user_hash VARCHAR(64), -- For frequency capping
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    revenue_cents INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Payment transactions (adult-friendly processors only)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) NOT NULL,
    processor VARCHAR(100) NOT NULL, -- CCBill, Segpay, Epoch, Vendo, BitPay, etc.
    processor_transaction_id VARCHAR(255),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure no prohibited processors
    CONSTRAINT no_prohibited_processors CHECK (
        processor NOT IN ('stripe', 'paypal', 'square', 'braintree')
    )
);

-- Policy violations and moderation
CREATE TABLE policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    automated BOOLEAN DEFAULT false,
    reviewer_id VARCHAR(255),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Analytics aggregation tables
CREATE TABLE daily_campaign_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    placement VARCHAR(50) NOT NULL,
    impressions BIGINT DEFAULT 0,
    viewable_impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    spend_cents BIGINT DEFAULT 0,
    revenue_cents BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, date, platform, placement)
);

-- Frequency capping
CREATE TABLE frequency_caps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    placement VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    impressions_today INTEGER DEFAULT 1,
    last_impression_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_hash, placement, platform, DATE(last_impression_at))
);

-- Blocked users/IPs
CREATE TABLE blocked_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('ip', 'user_hash', 'user_agent')),
    entity_value TEXT NOT NULL,
    reason TEXT,
    blocked_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(entity_type, entity_value)
);

-- Indexes for performance
CREATE INDEX idx_campaigns_buyer_status ON campaigns(buyer_id, status);
CREATE INDEX idx_campaigns_status_created ON campaigns(status, created_at);
CREATE INDEX idx_creatives_campaign_status ON creatives(campaign_id, status);
CREATE INDEX idx_ad_events_campaign_type ON ad_events(campaign_id, event_type);
CREATE INDEX idx_ad_events_timestamp ON ad_events(timestamp);
CREATE INDEX idx_ad_events_platform_placement ON ad_events(platform, placement);
CREATE INDEX idx_payment_transactions_campaign ON payment_transactions(campaign_id);
CREATE INDEX idx_daily_stats_campaign_date ON daily_campaign_stats(campaign_id, date);
CREATE INDEX idx_frequency_caps_user_date ON frequency_caps(user_hash, DATE(last_impression_at));
CREATE INDEX idx_blocked_entities_type_value ON blocked_entities(entity_type, entity_value);

-- Trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON creatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_campaign_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to record ad events with automatic revenue calculation
CREATE OR REPLACE FUNCTION record_ad_event(
    p_campaign_id UUID,
    p_creative_id UUID,
    p_event_type VARCHAR,
    p_placement VARCHAR,
    p_platform VARCHAR,
    p_device VARCHAR DEFAULT NULL,
    p_geo VARCHAR DEFAULT NULL,
    p_user_hash VARCHAR DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
    revenue_cents INTEGER := 0;
    campaign_budget INTEGER;
BEGIN
    -- Get campaign budget for revenue calculation
    SELECT budget_cents INTO campaign_budget FROM campaigns WHERE id = p_campaign_id;
    
    -- Calculate revenue based on event type (simplified model)
    CASE p_event_type
        WHEN 'impression' THEN revenue_cents := 1; -- $0.01 CPM
        WHEN 'click' THEN revenue_cents := 10; -- $0.10 CPC
        WHEN 'conversion' THEN revenue_cents := 100; -- $1.00 CPA
        ELSE revenue_cents := 0;
    END CASE;
    
    -- Insert the event
    INSERT INTO ad_events (
        campaign_id, creative_id, event_type, placement, platform,
        device, geo, user_hash, referrer, user_agent, ip_address,
        revenue_cents, metadata
    ) VALUES (
        p_campaign_id, p_creative_id, p_event_type, p_placement, p_platform,
        p_device, p_geo, p_user_hash, p_referrer, p_user_agent, p_ip_address,
        revenue_cents, p_metadata
    ) RETURNING id INTO event_id;
    
    -- Update campaign spend
    UPDATE campaigns 
    SET spent_cents = spent_cents + revenue_cents
    WHERE id = p_campaign_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check frequency caps
CREATE OR REPLACE FUNCTION check_frequency_cap(
    p_user_hash VARCHAR,
    p_placement VARCHAR,
    p_platform VARCHAR,
    p_max_impressions INTEGER DEFAULT 3
) RETURNS BOOLEAN AS $$
DECLARE
    current_impressions INTEGER;
BEGIN
    -- Get today's impression count for this user/placement/platform combo
    SELECT impressions_today INTO current_impressions
    FROM frequency_caps
    WHERE user_hash = p_user_hash
      AND placement = p_placement  
      AND platform = p_platform
      AND DATE(last_impression_at) = CURRENT_DATE;
    
    -- If no record exists, user hasn't seen ads today
    IF current_impressions IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check if under limit
    RETURN current_impressions < p_max_impressions;
END;
$$ LANGUAGE plpgsql;

-- Function to update frequency caps
CREATE OR REPLACE FUNCTION update_frequency_cap(
    p_user_hash VARCHAR,
    p_placement VARCHAR,
    p_platform VARCHAR
) RETURNS VOID AS $$
BEGIN
    INSERT INTO frequency_caps (user_hash, placement, platform, impressions_today, last_impression_at)
    VALUES (p_user_hash, p_placement, p_platform, 1, NOW())
    ON CONFLICT (user_hash, placement, platform, DATE(last_impression_at))
    DO UPDATE SET 
        impressions_today = frequency_caps.impressions_today + 1,
        last_impression_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- View for campaign performance summary
CREATE VIEW campaign_performance AS
SELECT 
    c.id,
    c.campaign_name,
    c.buyer_id,
    c.status,
    c.budget_cents,
    c.spent_cents,
    c.currency,
    COALESCE(SUM(CASE WHEN ae.event_type = 'impression' THEN 1 ELSE 0 END), 0) as total_impressions,
    COALESCE(SUM(CASE WHEN ae.event_type = 'viewable' THEN 1 ELSE 0 END), 0) as viewable_impressions,
    COALESCE(SUM(CASE WHEN ae.event_type = 'click' THEN 1 ELSE 0 END), 0) as total_clicks,
    COALESCE(SUM(CASE WHEN ae.event_type = 'conversion' THEN 1 ELSE 0 END), 0) as total_conversions,
    CASE 
        WHEN SUM(CASE WHEN ae.event_type = 'impression' THEN 1 ELSE 0 END) > 0 
        THEN (SUM(CASE WHEN ae.event_type = 'click' THEN 1 ELSE 0 END)::FLOAT / 
              SUM(CASE WHEN ae.event_type = 'impression' THEN 1 ELSE 0 END)) * 100
        ELSE 0 
    END as ctr_percentage,
    c.created_at,
    c.activated_at
FROM campaigns c
LEFT JOIN ad_events ae ON c.id = ae.campaign_id
GROUP BY c.id, c.campaign_name, c.buyer_id, c.status, c.budget_cents, c.spent_cents, c.currency, c.created_at, c.activated_at;

-- Insert some sample data for testing
INSERT INTO campaigns (buyer_id, campaign_name, budget_cents, bid_type, placements, targeting) VALUES
('creator_demo', 'Demo Campaign - BoyFanz Header', 5000, 'CPM', ARRAY['HEADER'], '{"platform": ["boyfanz"], "geo": ["US"]}'),
('creator_demo', 'Demo Campaign - Cross Platform', 10000, 'CPC', ARRAY['HEADER', 'FOOTER', 'SIDEPANEL'], '{"platform": ["boyfanz", "girlfanz", "pupfanz"], "geo": ["US", "CA"]}');

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA fanz_ads TO fanz;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA fanz_ads TO fanz;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA fanz_ads TO fanz;

-- Create read-only user for analytics
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fanz_analytics') THEN
        CREATE ROLE fanz_analytics WITH LOGIN PASSWORD 'analytics_password_here';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE fanz_ads TO fanz_analytics;
GRANT USAGE ON SCHEMA fanz_ads TO fanz_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA fanz_ads TO fanz_analytics;

-- Add comments for documentation
COMMENT ON TABLE campaigns IS 'Ad campaigns with adult-friendly payment processors only';
COMMENT ON TABLE creatives IS 'Campaign creatives (images, videos, HTML) with content policy validation';
COMMENT ON TABLE ad_events IS 'All ad events (impressions, clicks, conversions) for analytics';
COMMENT ON TABLE payment_transactions IS 'Payment transactions from adult-friendly processors (NO Stripe/PayPal)';
COMMENT ON TABLE policy_violations IS 'Content policy violations and moderation actions';
COMMENT ON TABLE frequency_caps IS 'User frequency capping to prevent ad fatigue';
COMMENT ON TABLE blocked_entities IS 'Blocked IPs, user hashes, and user agents';

COMMENT ON FUNCTION record_ad_event IS 'Records ad events with automatic revenue calculation and spend tracking';
COMMENT ON FUNCTION check_frequency_cap IS 'Checks if user has exceeded frequency cap for a placement/platform';
COMMENT ON FUNCTION update_frequency_cap IS 'Updates frequency cap counters for a user/placement/platform';

-- Set permissions for application user
ALTER DEFAULT PRIVILEGES IN SCHEMA fanz_ads GRANT ALL ON TABLES TO fanz;
ALTER DEFAULT PRIVILEGES IN SCHEMA fanz_ads GRANT ALL ON SEQUENCES TO fanz;
ALTER DEFAULT PRIVILEGES IN SCHEMA fanz_ads GRANT EXECUTE ON FUNCTIONS TO fanz;

-- Finalize
COMMIT;
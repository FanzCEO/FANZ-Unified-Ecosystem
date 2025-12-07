-- FANZ Cross-Platform Ad System - Database Initialization
-- PostgreSQL schema setup for development environment

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS ads;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS finance;

-- Set default search path
SET search_path TO ads, analytics, compliance, finance, public;

-- Create custom types
CREATE TYPE payment_processor AS ENUM (
  'ccbill', 'segpay', 'epoch', 'vendo', 'verotel', 
  'netbilling', 'commercegate', 'rocketgate', 'centrobill',
  'payze', 'kolektiva', 'bitcoin', 'ethereum', 'usdt'
);

CREATE TYPE ad_placement AS ENUM (
  'HEADER', 'FOOTER', 'SIDEPANEL', 'HOMEPAGE_HERO', 
  'HOMEPAGE_NATIVE', 'DASHBOARD_WIDGET'
);

CREATE TYPE campaign_status AS ENUM (
  'draft', 'pending_payment', 'active', 'paused', 'completed', 'rejected'
);

CREATE TYPE creative_type AS ENUM ('image', 'video', 'html');

CREATE TYPE bid_type AS ENUM ('CPM', 'CPC', 'CPA');

CREATE TYPE platform_type AS ENUM ('boyfanz', 'girlfanz', 'pupfanz');

-- Core tables
CREATE TABLE IF NOT EXISTS ads.advertisers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  is_creator BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  payment_processor payment_processor,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status campaign_status DEFAULT 'draft',
  budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
  spent DECIMAL(10,2) DEFAULT 0 CHECK (spent >= 0),
  bid_type bid_type NOT NULL,
  bid_amount DECIMAL(6,4),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_platforms platform_type[] DEFAULT ARRAY['boyfanz', 'girlfanz', 'pupfanz'],
  target_geos VARCHAR(2)[] DEFAULT ARRAY['US'],
  target_devices VARCHAR(20)[] DEFAULT ARRAY['mobile', 'desktop'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT budget_spent_check CHECK (spent <= budget)
);

CREATE TABLE IF NOT EXISTS ads.creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  type creative_type NOT NULL,
  url TEXT NOT NULL,
  landing_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads.placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  placement ad_placement NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS analytics.ad_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES ads.creatives(id) ON DELETE SET NULL,
  placement ad_placement NOT NULL,
  platform platform_type NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- impression, click, conversion
  user_hash VARCHAR(64), -- For frequency capping
  ip_address INET,
  user_agent TEXT,
  geo_country VARCHAR(2),
  device_type VARCHAR(20),
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revenue DECIMAL(8,4) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics.frequency_caps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_hash VARCHAR(64) NOT NULL,
  campaign_id UUID NOT NULL REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  placement ad_placement NOT NULL,
  impression_count INTEGER DEFAULT 1,
  last_impression TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_hash, campaign_id, placement)
);

-- Compliance tables  
CREATE TABLE IF NOT EXISTS compliance.policy_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES ads.creatives(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Finance tables
CREATE TABLE IF NOT EXISTS finance.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ads.campaigns(id) ON DELETE CASCADE,
  processor payment_processor NOT NULL,
  processor_transaction_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_status ON ads.campaigns(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON ads.campaigns(start_date, end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_creatives_campaign_approved ON ads.creatives(campaign_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_ad_events_campaign_time ON analytics.ad_events(campaign_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ad_events_platform_placement ON analytics.ad_events(platform, placement, occurred_at);
CREATE INDEX IF NOT EXISTS idx_frequency_caps_user_campaign ON analytics.frequency_caps(user_hash, campaign_id);
CREATE INDEX IF NOT EXISTS idx_payments_campaign_status ON finance.payments(campaign_id, status);

-- Create partitioning for ad_events (by month)
CREATE TABLE IF NOT EXISTS analytics.ad_events_template (LIKE analytics.ad_events INCLUDING ALL);

-- Function to create monthly partitions
CREATE OR REPLACE FUNCTION analytics.create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    start_month text;
    end_month text;
BEGIN
    start_month := to_char(start_date, 'YYYY_MM');
    end_month := to_char(start_date + interval '1 month', 'YYYY_MM');
    partition_name := table_name || '_' || start_month;
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS analytics.%I PARTITION OF analytics.%I
                   FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, start_date + interval '1 month');
END;
$$ LANGUAGE plpgsql;

-- Create initial partitions for current and next 3 months
SELECT analytics.create_monthly_partition('ad_events', date_trunc('month', CURRENT_DATE) + (interval '1 month' * generate_series(0, 3)));

-- Insert sample data for development
INSERT INTO ads.advertisers (email, company_name, contact_name, is_creator, is_verified) VALUES
('creator@boyfanz.com', 'BoyFanz Creator', 'Alex Chen', true, true),
('company@adnetwork.com', 'Premium Ad Network', 'Sarah Johnson', false, true),
('solo@girlfanz.com', 'GirlFanz Solo', 'Maria Garcia', true, true);

-- Insert sample campaigns
INSERT INTO ads.campaigns (advertiser_id, name, budget, bid_type, bid_amount, target_platforms) VALUES
((SELECT id FROM ads.advertisers WHERE email = 'creator@boyfanz.com'), 'BoyFanz Promo Campaign', 500.00, 'CPM', 2.50, ARRAY['boyfanz']),
((SELECT id FROM ads.advertisers WHERE email = 'company@adnetwork.com'), 'Cross Platform Brand Campaign', 2000.00, 'CPC', 0.75, ARRAY['boyfanz', 'girlfanz', 'pupfanz']),
((SELECT id FROM ads.advertisers WHERE email = 'solo@girlfanz.com'), 'GirlFanz Solo Promotion', 300.00, 'CPM', 3.00, ARRAY['girlfanz']);

-- Update campaign status to active
UPDATE ads.campaigns SET status = 'active', start_date = CURRENT_TIMESTAMP WHERE status = 'draft';

-- Create stored procedures for common operations
CREATE OR REPLACE FUNCTION ads.record_ad_impression(
  p_campaign_id UUID,
  p_creative_id UUID,
  p_placement ad_placement,
  p_platform platform_type,
  p_user_hash VARCHAR(64) DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_geo_country VARCHAR(2) DEFAULT 'US',
  p_device_type VARCHAR(20) DEFAULT 'desktop'
)
RETURNS UUID AS $$
DECLARE
  impression_id UUID;
  current_count INTEGER := 0;
BEGIN
  -- Check frequency cap if user_hash provided
  IF p_user_hash IS NOT NULL THEN
    SELECT impression_count INTO current_count 
    FROM analytics.frequency_caps 
    WHERE user_hash = p_user_hash 
      AND campaign_id = p_campaign_id 
      AND placement = p_placement
      AND last_impression > CURRENT_DATE;
    
    -- Default frequency cap of 3 per day
    IF current_count >= 3 THEN
      RETURN NULL; -- Frequency cap exceeded
    END IF;
    
    -- Update or insert frequency cap record
    INSERT INTO analytics.frequency_caps (user_hash, campaign_id, placement, impression_count, last_impression)
    VALUES (p_user_hash, p_campaign_id, p_placement, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (user_hash, campaign_id, placement)
    DO UPDATE SET 
      impression_count = CASE 
        WHEN frequency_caps.last_impression > CURRENT_DATE 
        THEN frequency_caps.impression_count + 1 
        ELSE 1 
      END,
      last_impression = CURRENT_TIMESTAMP;
  END IF;
  
  -- Record the impression
  INSERT INTO analytics.ad_events (campaign_id, creative_id, placement, platform, event_type, user_hash, ip_address, geo_country, device_type)
  VALUES (p_campaign_id, p_creative_id, p_placement, p_platform, 'impression', p_user_hash, p_ip_address, p_geo_country, p_device_type)
  RETURNING id INTO impression_id;
  
  RETURN impression_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign performance stats
CREATE OR REPLACE FUNCTION analytics.get_campaign_stats(p_campaign_id UUID, p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days')
RETURNS TABLE (
  impressions BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  ctr DECIMAL(5,4),
  spend DECIMAL(10,2),
  cpm DECIMAL(8,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
    COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0 
      THEN (COUNT(*) FILTER (WHERE event_type = 'click')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'impression')) * 100
      ELSE 0 
    END as ctr,
    COALESCE(SUM(revenue), 0) as spend,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0 
      THEN (COALESCE(SUM(revenue), 0) * 1000) / COUNT(*) FILTER (WHERE event_type = 'impression')
      ELSE 0 
    END as cpm
  FROM analytics.ad_events 
  WHERE campaign_id = p_campaign_id 
    AND occurred_at >= p_start_date;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advertisers_updated_at BEFORE UPDATE ON ads.advertisers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON ads.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON ads.creatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
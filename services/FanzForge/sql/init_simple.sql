-- FANZ Cross-Platform Ad System Database Schema
-- Simplified PostgreSQL initialization script

-- Connect to the fanz_ads_dev database
\c fanz_ads_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create database schema
CREATE SCHEMA IF NOT EXISTS fanz_ads;
SET search_path TO fanz_ads, public;

-- Test table to verify everything works
CREATE TABLE test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a test record
INSERT INTO test_table (name) VALUES ('FANZ Ad System Test');

-- Campaigns table (simplified)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    budget_cents BIGINT NOT NULL CHECK (budget_cents >= 500),
    spent_cents BIGINT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    bid_type VARCHAR(10) NOT NULL CHECK (bid_type IN ('CPM', 'CPC', 'CPA')),
    placements TEXT[] NOT NULL,
    targeting JSONB DEFAULT '{}',
    payment_processor VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creatives table (simplified)
CREATE TABLE creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creative_type VARCHAR(20) NOT NULL CHECK (creative_type IN ('image', 'video', 'html')),
    creative_url TEXT NOT NULL,
    landing_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad events table (simplified)
CREATE TABLE ad_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('impression', 'viewable', 'click', 'conversion')),
    placement VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    revenue_cents INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Sample data
INSERT INTO campaigns (buyer_id, campaign_name, budget_cents, bid_type, placements) VALUES 
('creator_001', 'Test Campaign 1', 5000, 'CPM', ARRAY['HEADER', 'SIDEBAR']);

-- Indexes for performance
CREATE INDEX idx_campaigns_buyer_status ON campaigns(buyer_id, status);
CREATE INDEX idx_ad_events_campaign_type ON ad_events(campaign_id, event_type);
CREATE INDEX idx_ad_events_timestamp ON ad_events(timestamp);

-- Success message
SELECT 'FANZ Ad System Database initialized successfully!' AS message;
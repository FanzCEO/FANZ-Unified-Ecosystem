-- =====================================================
-- FANZ CRM DATABASE
-- Creators, fans, subscriptions, campaigns, events
-- Used by: FanzCRM, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CREATORS SCHEMA
-- =====================================================

CREATE SCHEMA creators;

-- =====================================================
-- CREATOR PROFILES
-- =====================================================

CREATE TABLE creators.profiles (
    creator_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- References users from fanz_identity

    -- Profile
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    tagline VARCHAR(255),
    avatar_url TEXT,
    cover_image_url TEXT,
    banner_url TEXT,

    -- Creator type
    creator_type VARCHAR(30) CHECK (creator_type IN (
        'individual', 'couple', 'group', 'studio', 'agency'
    )),

    -- Categories
    primary_category VARCHAR(50) NOT NULL,
    categories TEXT[],
    tags TEXT[],

    -- Social links
    social_links JSONB, -- {twitter: '', instagram: '', etc}
    website_url TEXT,

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_badge VARCHAR(20) CHECK (verification_badge IN ('basic', 'verified', 'premium', 'celebrity')),
    verified_at TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_break', 'inactive', 'suspended', 'banned')),

    -- Privacy settings
    is_public BOOLEAN DEFAULT TRUE,
    discoverable BOOLEAN DEFAULT TRUE,
    show_fan_count BOOLEAN DEFAULT TRUE,
    show_earnings BOOLEAN DEFAULT FALSE,

    -- Content settings
    adult_content_enabled BOOLEAN DEFAULT TRUE,
    explicit_content_level VARCHAR(20) DEFAULT 'adult' CHECK (explicit_content_level IN ('safe', 'suggestive', 'adult', 'extreme')),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats (cached)
    total_fans INTEGER DEFAULT 0,
    total_subscribers INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_media_files INTEGER DEFAULT 0,

    -- Rankings
    ranking_score DECIMAL(10,2) DEFAULT 0,
    trending_score DECIMAL(10,2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP
);

CREATE INDEX idx_creators_user ON creators.profiles(user_id);
CREATE INDEX idx_creators_platform ON creators.profiles(platform_id, status);
CREATE INDEX idx_creators_status ON creators.profiles(status) WHERE status = 'active';
CREATE INDEX idx_creators_verified ON creators.profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_creators_discoverable ON creators.profiles(discoverable, ranking_score DESC) WHERE discoverable = TRUE;
CREATE INDEX idx_creators_category ON creators.profiles(primary_category);

COMMENT ON TABLE creators.profiles IS 'Creator profile information';

-- =====================================================
-- SUBSCRIPTION TIERS
-- =====================================================

CREATE TABLE creators.subscription_tiers (
    tier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators.profiles(creator_id) ON DELETE CASCADE,

    -- Tier details
    tier_name VARCHAR(100) NOT NULL,
    tier_description TEXT,
    tier_level INTEGER NOT NULL DEFAULT 1, -- 1 = basic, 2 = premium, 3 = elite

    -- Pricing (in cents)
    monthly_price BIGINT NOT NULL,
    quarterly_price BIGINT,
    annual_price BIGINT,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Benefits
    benefits TEXT[],
    features JSONB, -- Custom feature flags

    -- Content access
    post_access_level VARCHAR(20) DEFAULT 'all',
    media_access_level VARCHAR(20) DEFAULT 'all',
    message_access BOOLEAN DEFAULT TRUE,
    live_stream_access BOOLEAN DEFAULT TRUE,

    -- Limits
    max_subscribers INTEGER, -- NULL = unlimited

    -- Discounts
    trial_days INTEGER DEFAULT 0,
    promo_price BIGINT,
    promo_valid_until TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats
    total_subscribers INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT tiers_price_positive CHECK (monthly_price > 0)
);

CREATE INDEX idx_tiers_creator ON creators.subscription_tiers(creator_id, is_active);
CREATE INDEX idx_tiers_active ON creators.subscription_tiers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tiers_featured ON creators.subscription_tiers(is_featured) WHERE is_featured = TRUE;

COMMENT ON TABLE creators.subscription_tiers IS 'Creator subscription pricing tiers';

-- =====================================================
-- FANS SCHEMA
-- =====================================================

CREATE SCHEMA fans;

-- =====================================================
-- FAN PROFILES
-- =====================================================

CREATE TABLE fans.profiles (
    fan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- References users from fanz_identity

    -- Profile
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,

    -- Preferences
    preferred_categories TEXT[],
    notification_preferences JSONB,

    -- Privacy
    is_anonymous BOOLEAN DEFAULT FALSE,
    show_in_fan_lists BOOLEAN DEFAULT TRUE,
    allow_creator_messages BOOLEAN DEFAULT TRUE,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats (cached)
    total_subscriptions INTEGER DEFAULT 0,
    total_spent BIGINT DEFAULT 0,
    total_tips_sent BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP
);

CREATE INDEX idx_fans_user ON fans.profiles(user_id);
CREATE INDEX idx_fans_platform ON fans.profiles(platform_id, status);
CREATE INDEX idx_fans_status ON fans.profiles(status) WHERE status = 'active';

COMMENT ON TABLE fans.profiles IS 'Fan profile information';

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

CREATE TABLE fans.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_number VARCHAR(50) UNIQUE NOT NULL,

    -- Parties
    fan_id UUID NOT NULL REFERENCES fans.profiles(fan_id),
    creator_id UUID NOT NULL REFERENCES creators.profiles(creator_id),
    tier_id UUID REFERENCES creators.subscription_tiers(tier_id),

    -- Billing
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual', 'lifetime')),
    amount BIGINT NOT NULL, -- Amount charged per cycle (in cents)
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'cancelled', 'expired', 'suspended', 'past_due', 'trial'
    )),

    -- Trial
    is_trial BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMP,

    -- Payment
    payment_method_id VARCHAR(255),
    payment_processor VARCHAR(50),
    external_subscription_id VARCHAR(255), -- Processor's subscription ID

    -- Dates
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    next_billing_date TIMESTAMP,

    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason VARCHAR(255),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    -- Renewal
    auto_renew BOOLEAN DEFAULT TRUE,
    renew_count INTEGER DEFAULT 0,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    subscribed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,

    CONSTRAINT subscriptions_amount_positive CHECK (amount > 0),
    CONSTRAINT subscriptions_period_valid CHECK (current_period_end > current_period_start)
);

CREATE INDEX idx_subscriptions_fan ON fans.subscriptions(fan_id, status);
CREATE INDEX idx_subscriptions_creator ON fans.subscriptions(creator_id, status);
CREATE INDEX idx_subscriptions_status ON fans.subscriptions(status);
CREATE INDEX idx_subscriptions_active ON fans.subscriptions(creator_id, subscribed_at DESC) WHERE status = 'active';
CREATE INDEX idx_subscriptions_billing ON fans.subscriptions(next_billing_date) WHERE status = 'active' AND auto_renew = TRUE;
CREATE INDEX idx_subscriptions_trial ON fans.subscriptions(trial_ends_at) WHERE is_trial = TRUE;

COMMENT ON TABLE fans.subscriptions IS 'Fan subscriptions to creators';

-- =====================================================
-- TIPS
-- =====================================================

CREATE TABLE fans.tips (
    tip_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parties
    fan_id UUID NOT NULL REFERENCES fans.profiles(fan_id),
    creator_id UUID NOT NULL REFERENCES creators.profiles(creator_id),

    -- Amount (in cents)
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Message
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,

    -- Related content
    post_id UUID,
    message_id UUID,
    live_stream_id UUID,

    -- Transaction
    transaction_id UUID,
    payment_processor VARCHAR(50),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    tipped_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT tips_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_tips_fan ON fans.tips(fan_id, tipped_at DESC);
CREATE INDEX idx_tips_creator ON fans.tips(creator_id, tipped_at DESC);
CREATE INDEX idx_tips_post ON fans.tips(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_tips_date ON fans.tips(tipped_at DESC);

COMMENT ON TABLE fans.tips IS 'Fan tips to creators';

-- =====================================================
-- CAMPAIGNS SCHEMA - Marketing campaigns
-- =====================================================

CREATE SCHEMA campaigns;

-- =====================================================
-- CAMPAIGNS
-- =====================================================

CREATE TABLE campaigns.campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators.profiles(creator_id),

    -- Campaign details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(30) NOT NULL CHECK (campaign_type IN (
        'promo_discount', 'trial_offer', 'bundle', 'limited_content', 'contest', 'referral'
    )),
    description TEXT,

    -- Discount
    discount_percentage DECIMAL(5,2),
    discount_amount BIGINT,

    -- Target audience
    target_tier_ids UUID[],
    target_new_subscribers BOOLEAN DEFAULT FALSE,
    target_lapsed_subscribers BOOLEAN DEFAULT FALSE,

    -- Limits
    max_redemptions INTEGER,
    redemptions_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),

    -- Schedule
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,

    -- Promo code
    promo_code VARCHAR(50) UNIQUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT campaigns_dates_valid CHECK (ends_at > starts_at)
);

CREATE INDEX idx_campaigns_creator ON campaigns.campaigns(creator_id, status);
CREATE INDEX idx_campaigns_status ON campaigns.campaigns(status);
CREATE INDEX idx_campaigns_active ON campaigns.campaigns(starts_at, ends_at) WHERE status = 'active';
CREATE INDEX idx_campaigns_promo_code ON campaigns.campaigns(promo_code) WHERE promo_code IS NOT NULL;

COMMENT ON TABLE campaigns.campaigns IS 'Creator marketing campaigns';

-- =====================================================
-- CAMPAIGN REDEMPTIONS
-- =====================================================

CREATE TABLE campaigns.redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns.campaigns(campaign_id),

    -- User
    fan_id UUID NOT NULL REFERENCES fans.profiles(fan_id),

    -- Subscription created
    subscription_id UUID REFERENCES fans.subscriptions(subscription_id),

    -- Discount applied
    discount_amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    redeemed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_campaign ON campaigns.redemptions(campaign_id, redeemed_at DESC);
CREATE INDEX idx_redemptions_fan ON campaigns.redemptions(fan_id);

COMMENT ON TABLE campaigns.redemptions IS 'Campaign redemption tracking';

-- =====================================================
-- EVENTS SCHEMA - Activity tracking
-- =====================================================

CREATE SCHEMA events;

-- =====================================================
-- FAN ACTIVITY
-- =====================================================

CREATE TABLE events.fan_activity (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id UUID NOT NULL REFERENCES fans.profiles(fan_id),

    -- Activity type
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
        'subscribed', 'unsubscribed', 'tipped', 'purchased_ppv', 'liked_post',
        'commented', 'shared', 'messaged', 'viewed_content', 'joined_live'
    )),

    -- Related entities
    creator_id UUID,
    post_id UUID,
    message_id UUID,
    content_id UUID,

    -- Metadata
    metadata JSONB,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_fan ON events.fan_activity(fan_id, occurred_at DESC);
CREATE INDEX idx_activity_creator ON events.fan_activity(creator_id, occurred_at DESC) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_activity_type ON events.fan_activity(activity_type, occurred_at DESC);
CREATE INDEX idx_activity_date ON events.fan_activity(occurred_at DESC);

COMMENT ON TABLE events.fan_activity IS 'Fan activity event log';

-- =====================================================
-- CREATOR ACTIVITY
-- =====================================================

CREATE TABLE events.creator_activity (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators.profiles(creator_id),

    -- Activity type
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
        'posted_content', 'went_live', 'messaged_fan', 'created_tier',
        'launched_campaign', 'uploaded_media', 'earned_milestone', 'gained_fans'
    )),

    -- Related entities
    post_id UUID,
    media_id UUID,
    tier_id UUID,
    campaign_id UUID,

    -- Metadata
    metadata JSONB,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creator_activity_creator ON events.creator_activity(creator_id, occurred_at DESC);
CREATE INDEX idx_creator_activity_type ON events.creator_activity(activity_type, occurred_at DESC);
CREATE INDEX idx_creator_activity_date ON events.creator_activity(occurred_at DESC);

COMMENT ON TABLE events.creator_activity IS 'Creator activity event log';

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

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creators.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON creators.subscription_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fan_profiles_updated_at BEFORE UPDATE ON fans.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate subscription number
CREATE OR REPLACE FUNCTION generate_subscription_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subscription_number = 'SUB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.subscription_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_subscription_number_trigger BEFORE INSERT ON fans.subscriptions
    FOR EACH ROW EXECUTE FUNCTION generate_subscription_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on fan data
ALTER TABLE fans.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans.tips ENABLE ROW LEVEL SECURITY;

-- Fans can only see their own data
CREATE POLICY fans_self_select ON fans.profiles
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY subscriptions_self_select ON fans.subscriptions
    FOR SELECT
    USING (fan_id IN (SELECT fan_id FROM fans.profiles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- =====================================================
-- VIEWS
-- =====================================================

-- Creator overview with stats
CREATE VIEW creators.creator_overview AS
SELECT
    p.creator_id,
    p.user_id,
    p.display_name,
    p.primary_category,
    p.is_verified,
    p.verification_badge,
    p.status,
    p.platform_id,
    p.total_fans,
    p.total_subscribers,
    p.total_posts,
    p.ranking_score,
    p.created_at,
    COUNT(DISTINCT t.tier_id) as tier_count,
    COUNT(DISTINCT s.subscription_id) FILTER (WHERE s.status = 'active') as active_subscribers
FROM creators.profiles p
LEFT JOIN creators.subscription_tiers t ON p.creator_id = t.creator_id AND t.is_active = TRUE
LEFT JOIN fans.subscriptions s ON p.creator_id = s.creator_id AND s.status = 'active'
WHERE p.status = 'active'
GROUP BY p.creator_id;

COMMENT ON VIEW creators.creator_overview IS 'Creator profiles with statistics';

-- Active subscriptions view
CREATE VIEW fans.active_subscriptions AS
SELECT
    s.subscription_id,
    s.subscription_number,
    s.fan_id,
    s.creator_id,
    s.tier_id,
    s.billing_cycle,
    s.amount,
    s.currency,
    s.status,
    s.current_period_end,
    s.next_billing_date,
    s.auto_renew,
    c.display_name as creator_name,
    c.avatar_url as creator_avatar,
    t.tier_name
FROM fans.subscriptions s
JOIN creators.profiles c ON s.creator_id = c.creator_id
LEFT JOIN creators.subscription_tiers t ON s.tier_id = t.tier_id
WHERE s.status = 'active';

COMMENT ON VIEW fans.active_subscriptions IS 'Currently active subscriptions with creator info';

-- =====================================================
-- GRANTS
-- =====================================================

-- Creators schema access
GRANT SELECT ON ALL TABLES IN SCHEMA creators TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA creators TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA creators TO platform_app_rw;

-- Fans schema access
GRANT SELECT ON ALL TABLES IN SCHEMA fans TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA fans TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA fans TO platform_app_rw;

-- Campaigns schema access
GRANT SELECT ON ALL TABLES IN SCHEMA campaigns TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA campaigns TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA campaigns TO platform_app_rw;

-- Events schema access
GRANT SELECT ON ALL TABLES IN SCHEMA events TO platform_app_ro;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA events TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA events TO platform_app_rw;

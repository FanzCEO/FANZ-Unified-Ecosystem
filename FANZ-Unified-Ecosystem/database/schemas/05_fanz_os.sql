-- =====================================================
-- FANZ OS DATABASE
-- Platform registry, feature flags, routing, configuration
-- Used by: FanzOS, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- REGISTRY SCHEMA - Platform registry
-- =====================================================

CREATE SCHEMA registry;

-- =====================================================
-- PLATFORMS
-- =====================================================

CREATE TABLE registry.platforms (
    platform_id VARCHAR(50) PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL,
    platform_display_name VARCHAR(100) NOT NULL,

    -- Platform type
    platform_type VARCHAR(30) NOT NULL CHECK (platform_type IN (
        'core', 'niche', 'international', 'specialty', 'infrastructure'
    )),

    -- Domain
    primary_domain VARCHAR(255) NOT NULL UNIQUE,
    alternate_domains TEXT[],
    cdn_domain VARCHAR(255),

    -- Branding
    logo_url TEXT,
    icon_url TEXT,
    brand_color VARCHAR(7), -- Hex color code
    theme_config JSONB,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'beta', 'maintenance', 'deprecated', 'sunset'
    )),

    -- Deployment
    deployment_region VARCHAR(50),
    deployment_environment VARCHAR(20) CHECK (deployment_environment IN ('production', 'staging', 'development')),

    -- API endpoints
    api_base_url TEXT NOT NULL,
    api_version VARCHAR(10) DEFAULT 'v1',
    websocket_url TEXT,
    streaming_url TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Configuration
    config JSONB, -- Platform-specific configuration

    -- Stats (cached)
    total_users INTEGER DEFAULT 0,
    total_creators INTEGER DEFAULT 0,
    total_fans INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Limits
    max_users INTEGER,
    max_creators INTEGER,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    launched_at TIMESTAMP,
    sunset_at TIMESTAMP
);

CREATE INDEX idx_platforms_status ON registry.platforms(status);
CREATE INDEX idx_platforms_type ON registry.platforms(platform_type);
CREATE INDEX idx_platforms_featured ON registry.platforms(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_platforms_domain ON registry.platforms(primary_domain);

COMMENT ON TABLE registry.platforms IS 'Registry of all 94 FANZ platforms';

-- =====================================================
-- TENANTS
-- =====================================================

CREATE TABLE registry.tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(100) NOT NULL UNIQUE,

    -- Tenant type
    tenant_type VARCHAR(30) CHECK (tenant_type IN ('production', 'staging', 'sandbox', 'enterprise')),

    -- Billing
    billing_plan VARCHAR(30),
    billing_cycle VARCHAR(20),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),

    -- Limits
    max_platforms INTEGER DEFAULT 1,
    max_users INTEGER,
    storage_quota_gb INTEGER,

    -- Contact
    admin_email VARCHAR(255),
    support_email VARCHAR(255),

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    trial_ends_at TIMESTAMP
);

CREATE INDEX idx_tenants_status ON registry.tenants(status);
CREATE INDEX idx_tenants_name ON registry.tenants(tenant_name);

COMMENT ON TABLE registry.tenants IS 'Multi-tenant organization registry';

-- =====================================================
-- SERVICES
-- =====================================================

CREATE TABLE registry.services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL UNIQUE,

    -- Service type
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN (
        'identity', 'money', 'media', 'crm', 'os', 'discovery',
        'social', 'commerce', 'legal', 'ai', 'analytics', 'audit'
    )),

    -- Endpoints
    base_url TEXT NOT NULL,
    health_check_url TEXT,
    version VARCHAR(20),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'degraded', 'maintenance', 'offline')),
    last_health_check TIMESTAMP,
    health_status VARCHAR(20),

    -- Load balancing
    load_balancer_url TEXT,
    instance_count INTEGER DEFAULT 1,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_type ON registry.services(service_type);
CREATE INDEX idx_services_status ON registry.services(status);
CREATE INDEX idx_services_name ON registry.services(service_name);

COMMENT ON TABLE registry.services IS 'Core service registry';

-- =====================================================
-- FEATURES SCHEMA - Feature flags
-- =====================================================

CREATE SCHEMA features;

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE features.flags (
    flag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key VARCHAR(100) NOT NULL UNIQUE,

    -- Flag details
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    flag_type VARCHAR(20) NOT NULL CHECK (flag_type IN ('boolean', 'string', 'number', 'json')),

    -- Default value
    default_value TEXT NOT NULL,

    -- Status
    is_enabled BOOLEAN DEFAULT FALSE,
    is_permanent BOOLEAN DEFAULT FALSE, -- Cannot be toggled

    -- Targeting
    targeting_rules JSONB, -- Complex targeting logic

    -- Category
    category VARCHAR(50), -- 'ui', 'payments', 'content', etc.

    -- Tags
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flags_key ON features.flags(flag_key);
CREATE INDEX idx_flags_enabled ON features.flags(is_enabled);
CREATE INDEX idx_flags_category ON features.flags(category);

COMMENT ON TABLE features.flags IS 'Global feature flags';

-- =====================================================
-- PLATFORM FEATURE OVERRIDES
-- =====================================================

CREATE TABLE features.platform_overrides (
    override_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES features.flags(flag_id) ON DELETE CASCADE,
    platform_id VARCHAR(50) NOT NULL REFERENCES registry.platforms(platform_id) ON DELETE CASCADE,

    -- Override value
    is_enabled BOOLEAN NOT NULL,
    override_value TEXT,

    -- Schedule
    enabled_from TIMESTAMP,
    enabled_until TIMESTAMP,

    -- Rollout
    rollout_percentage INTEGER CHECK (rollout_percentage BETWEEN 0 AND 100),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(flag_id, platform_id)
);

CREATE INDEX idx_overrides_platform ON features.platform_overrides(platform_id, is_enabled);
CREATE INDEX idx_overrides_flag ON features.platform_overrides(flag_id);

COMMENT ON TABLE features.platform_overrides IS 'Platform-specific feature flag overrides';

-- =====================================================
-- USER FEATURE OVERRIDES
-- =====================================================

CREATE TABLE features.user_overrides (
    override_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES features.flags(flag_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Override value
    is_enabled BOOLEAN NOT NULL,
    override_value TEXT,

    -- Reason
    reason TEXT,
    granted_by UUID,

    -- Expiration
    expires_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(flag_id, user_id)
);

CREATE INDEX idx_user_overrides_user ON features.user_overrides(user_id);
CREATE INDEX idx_user_overrides_flag ON features.user_overrides(flag_id);
CREATE INDEX idx_user_overrides_expires ON features.user_overrides(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE features.user_overrides IS 'User-specific feature flag overrides';

-- =====================================================
-- ROUTING SCHEMA - Request routing
-- =====================================================

CREATE SCHEMA routing;

-- =====================================================
-- ROUTING RULES
-- =====================================================

CREATE TABLE routing.rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,

    -- Matching
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('domain', 'path', 'header', 'geo', 'user_agent')),
    match_pattern TEXT NOT NULL,

    -- Destination
    target_platform_id VARCHAR(50) REFERENCES registry.platforms(platform_id),
    target_service VARCHAR(100),
    target_url TEXT,

    -- Priority (higher = evaluated first)
    priority INTEGER DEFAULT 100,

    -- Conditions
    conditions JSONB, -- Additional matching conditions

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Cache
    cache_ttl_seconds INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routing_rules_priority ON routing.rules(priority DESC, is_active);
CREATE INDEX idx_routing_rules_platform ON routing.rules(target_platform_id) WHERE is_active = TRUE;
CREATE INDEX idx_routing_rules_active ON routing.rules(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE routing.rules IS 'Request routing rules';

-- =====================================================
-- RATE LIMITS
-- =====================================================

CREATE TABLE routing.rate_limits (
    limit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('global', 'platform', 'user', 'ip')),
    target_id VARCHAR(255),

    -- Platform
    platform_id VARCHAR(50) REFERENCES registry.platforms(platform_id),

    -- Endpoint pattern
    endpoint_pattern TEXT, -- e.g., '/api/posts/*'

    -- Limits
    requests_per_second INTEGER,
    requests_per_minute INTEGER,
    requests_per_hour INTEGER,
    requests_per_day INTEGER,

    -- Burst
    burst_size INTEGER,

    -- Action on limit
    limit_action VARCHAR(20) DEFAULT 'throttle' CHECK (limit_action IN ('throttle', 'block', 'queue')),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_target ON routing.rate_limits(target_type, target_id, is_active);
CREATE INDEX idx_rate_limits_platform ON routing.rate_limits(platform_id) WHERE is_active = TRUE;

COMMENT ON TABLE routing.rate_limits IS 'API rate limiting configuration';

-- =====================================================
-- CONFIG SCHEMA - System configuration
-- =====================================================

CREATE SCHEMA config;

-- =====================================================
-- SYSTEM CONFIG
-- =====================================================

CREATE TABLE config.system_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,

    -- Value
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),

    -- Metadata
    description TEXT,
    category VARCHAR(50),

    -- Validation
    validation_rules JSONB,

    -- Security
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,

    -- Modification tracking
    last_modified_by UUID,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_key ON config.system_config(config_key);
CREATE INDEX idx_config_category ON config.system_config(category);

COMMENT ON TABLE config.system_config IS 'Global system configuration';

-- =====================================================
-- PLATFORM CONFIG
-- =====================================================

CREATE TABLE config.platform_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id VARCHAR(50) NOT NULL REFERENCES registry.platforms(platform_id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,

    -- Value
    config_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),

    -- Metadata
    description TEXT,
    category VARCHAR(50),

    -- Inheritance
    inherits_from_global BOOLEAN DEFAULT TRUE,

    -- Modification tracking
    last_modified_by UUID,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(platform_id, config_key)
);

CREATE INDEX idx_platform_config_platform ON config.platform_config(platform_id);
CREATE INDEX idx_platform_config_key ON config.platform_config(config_key);
CREATE INDEX idx_platform_config_category ON config.platform_config(category);

COMMENT ON TABLE config.platform_config IS 'Platform-specific configuration';

-- =====================================================
-- SECRETS
-- =====================================================

CREATE TABLE config.secrets (
    secret_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secret_key VARCHAR(100) NOT NULL UNIQUE,

    -- Encrypted value
    secret_value_encrypted TEXT NOT NULL,
    encryption_key_id VARCHAR(100) NOT NULL,

    -- Associated platform
    platform_id VARCHAR(50) REFERENCES registry.platforms(platform_id),

    -- Type
    secret_type VARCHAR(50) NOT NULL CHECK (secret_type IN (
        'api_key', 'oauth_secret', 'signing_key', 'encryption_key', 'database_password', 'other'
    )),

    -- Rotation
    expires_at TIMESTAMP,
    last_rotated_at TIMESTAMP,
    rotation_frequency_days INTEGER,

    -- Access control
    allowed_services TEXT[],

    -- Metadata
    description TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_secrets_key ON config.secrets(secret_key);
CREATE INDEX idx_secrets_platform ON config.secrets(platform_id) WHERE platform_id IS NOT NULL;
CREATE INDEX idx_secrets_expires ON config.secrets(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE config.secrets IS 'Encrypted secrets management';

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

CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON registry.platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON registry.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON registry.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flags_updated_at BEFORE UPDATE ON features.flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_overrides_updated_at BEFORE UPDATE ON features.platform_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_rules_updated_at BEFORE UPDATE ON routing.rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON routing.rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON config.system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON config.platform_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at BEFORE UPDATE ON config.secrets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE config.secrets ENABLE ROW LEVEL SECURITY;

-- Only authorized services can access secrets
CREATE POLICY secrets_service_access ON config.secrets
    FOR SELECT
    USING (
        allowed_services IS NULL OR
        current_setting('app.service_name', true) = ANY(allowed_services)
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- Platform overview
CREATE VIEW registry.platform_overview AS
SELECT
    p.platform_id,
    p.platform_name,
    p.platform_display_name,
    p.platform_type,
    p.primary_domain,
    p.status,
    p.api_base_url,
    p.total_users,
    p.total_creators,
    p.is_featured,
    t.tenant_name,
    t.status as tenant_status
FROM registry.platforms p
JOIN registry.tenants t ON p.tenant_id = t.tenant_id;

COMMENT ON VIEW registry.platform_overview IS 'Complete platform information';

-- Active feature flags
CREATE VIEW features.active_flags AS
SELECT
    f.flag_id,
    f.flag_key,
    f.flag_name,
    f.description,
    f.flag_type,
    f.default_value,
    f.is_enabled,
    f.category,
    COUNT(po.override_id) as platform_override_count,
    COUNT(uo.override_id) as user_override_count
FROM features.flags f
LEFT JOIN features.platform_overrides po ON f.flag_id = po.flag_id
LEFT JOIN features.user_overrides uo ON f.flag_id = uo.flag_id
WHERE f.is_enabled = TRUE
GROUP BY f.flag_id;

COMMENT ON VIEW features.active_flags IS 'Active feature flags with override counts';

-- =====================================================
-- GRANTS
-- =====================================================

-- Registry access
GRANT SELECT ON ALL TABLES IN SCHEMA registry TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA registry TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA registry TO platform_app_rw;

-- Features access
GRANT SELECT ON ALL TABLES IN SCHEMA features TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA features TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA features TO platform_app_rw;

-- Routing access
GRANT SELECT ON ALL TABLES IN SCHEMA routing TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA routing TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA routing TO platform_app_rw;

-- Config access (limited)
GRANT SELECT ON ALL TABLES IN SCHEMA config TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON config.system_config, config.platform_config TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA config TO platform_app_rw;

-- Secrets access (very restricted)
GRANT SELECT ON config.secrets TO secrets_reader;

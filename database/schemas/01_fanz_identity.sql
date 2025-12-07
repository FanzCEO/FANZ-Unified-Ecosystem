-- =====================================================
-- FANZ IDENTITY DATABASE
-- Multi-tenant identity, auth, and KYC system
-- Used by: FanzSSO, FanzHubVault
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PUBLIC SCHEMA - General identity data
-- =====================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Profile
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,

    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    user_type VARCHAR(20) DEFAULT 'fan' CHECK (user_type IN ('fan', 'creator', 'admin', 'moderator')),

    -- Security
    password_hash TEXT NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,

    -- Metadata
    locale VARCHAR(10) DEFAULT 'en-US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    last_login_at TIMESTAMP,
    last_login_ip INET,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    -- Indexes
    CONSTRAINT users_handle_check CHECK (handle ~ '^[a-zA-Z0-9_-]+$')
);

CREATE INDEX idx_users_tenant_platform ON users(tenant_id, platform_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_handle ON users(handle) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_type ON users(user_type);

COMMENT ON TABLE users IS 'Core user identity table - multi-tenant across all FANZ platforms';

-- =====================================================
-- SESSIONS
-- =====================================================

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Session data
    token_hash TEXT NOT NULL UNIQUE,
    refresh_token_hash TEXT,

    -- Client info
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_id VARCHAR(255),
    device_type VARCHAR(20),

    -- Location
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Expiration
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT sessions_expires_check CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_device ON sessions(device_id) WHERE device_id IS NOT NULL;

COMMENT ON TABLE sessions IS 'Active user sessions with JWT tokens';

-- =====================================================
-- OAUTH CLIENTS
-- =====================================================

CREATE TABLE oauth_clients (
    client_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_secret_hash TEXT NOT NULL,

    -- Client info
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Configuration
    redirect_uris TEXT[] NOT NULL,
    allowed_scopes TEXT[] NOT NULL,
    grant_types TEXT[] NOT NULL DEFAULT ARRAY['authorization_code', 'refresh_token'],

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_first_party BOOLEAN DEFAULT FALSE,

    -- Owner
    owner_id UUID REFERENCES users(user_id),
    platform_id VARCHAR(50) NOT NULL,

    -- Rate limits
    rate_limit_per_hour INTEGER DEFAULT 1000,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_clients_platform ON oauth_clients(platform_id);
CREATE INDEX idx_oauth_clients_owner ON oauth_clients(owner_id);

COMMENT ON TABLE oauth_clients IS 'OAuth2 client applications';

-- =====================================================
-- OAUTH AUTHORIZATION CODES
-- =====================================================

CREATE TABLE oauth_authorization_codes (
    code_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_hash TEXT NOT NULL UNIQUE,

    client_id UUID NOT NULL REFERENCES oauth_clients(client_id),
    user_id UUID NOT NULL REFERENCES users(user_id),

    redirect_uri TEXT NOT NULL,
    scopes TEXT[] NOT NULL,

    code_challenge TEXT,
    code_challenge_method VARCHAR(10),

    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_codes_expires ON oauth_authorization_codes(expires_at) WHERE used_at IS NULL;

COMMENT ON TABLE oauth_authorization_codes IS 'OAuth2 authorization codes (PKCE supported)';

-- =====================================================
-- CONSENTS
-- =====================================================

CREATE TABLE consents (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),

    -- Policy info
    policy_type VARCHAR(50) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    policy_url TEXT,

    -- Consent details
    granted BOOLEAN NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,

    -- Timestamps
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_consents_user ON consents(user_id);
CREATE INDEX idx_consents_policy ON consents(policy_type, policy_version);
CREATE INDEX idx_consents_active ON consents(user_id, policy_type) WHERE granted = TRUE AND revoked_at IS NULL;

COMMENT ON TABLE consents IS 'User consent records for GDPR/CCPA compliance';

-- =====================================================
-- USER ROLES
-- =====================================================

CREATE TABLE user_roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),

    role_name VARCHAR(50) NOT NULL,
    platform_id VARCHAR(50) NOT NULL,
    tenant_id UUID NOT NULL,

    -- Scope
    scopes TEXT[] NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,

    UNIQUE(user_id, role_name, platform_id, tenant_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_user_roles_platform ON user_roles(platform_id);

COMMENT ON TABLE user_roles IS 'Role-based access control assignments';

-- =====================================================
-- KYC VAULT SCHEMA - Restricted access
-- =====================================================

CREATE SCHEMA kyc_vault;

-- =====================================================
-- KYC PROFILES
-- =====================================================

CREATE TABLE kyc_vault.kyc_profiles (
    kyc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id),

    -- KYC provider
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),

    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),

    -- Personal info (encrypted)
    legal_first_name_encrypted TEXT NOT NULL,
    legal_last_name_encrypted TEXT NOT NULL,
    date_of_birth_encrypted TEXT NOT NULL,

    -- Address (encrypted)
    address_line1_encrypted TEXT,
    address_line2_encrypted TEXT,
    city_encrypted TEXT,
    state_encrypted TEXT,
    postal_code_encrypted TEXT,
    country_code VARCHAR(2) NOT NULL,

    -- Documents
    doc_type VARCHAR(50),
    doc_number_encrypted TEXT,
    doc_fingerprint VARCHAR(64) NOT NULL UNIQUE,
    doc_front_url TEXT,
    doc_back_url TEXT,
    doc_selfie_url TEXT,

    -- Verification
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Risk scoring
    risk_score INTEGER,
    risk_factors JSONB,

    -- Timestamps
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_kyc_status ON kyc_vault.kyc_profiles(status);
CREATE INDEX idx_kyc_provider ON kyc_vault.kyc_profiles(provider);
CREATE INDEX idx_kyc_country ON kyc_vault.kyc_profiles(country_code);

COMMENT ON TABLE kyc_vault.kyc_profiles IS 'KYC verification data - RESTRICTED ACCESS';

-- =====================================================
-- AGE VERIFICATIONS
-- =====================================================

CREATE TABLE kyc_vault.age_verifications (
    age_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),

    -- Verification method
    method VARCHAR(50) NOT NULL CHECK (method IN ('kyc', 'credit_card', 'age_gate', 'third_party')),
    provider VARCHAR(50),

    -- Result
    result VARCHAR(20) NOT NULL CHECK (result IN ('pass', 'fail', 'pending')),
    age_confirmed INTEGER,

    -- Evidence
    evidence_fingerprint VARCHAR(64),

    -- Timestamps
    checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_age_user ON kyc_vault.age_verifications(user_id);
CREATE INDEX idx_age_result ON kyc_vault.age_verifications(result);

COMMENT ON TABLE kyc_vault.age_verifications IS 'Age verification records for adult content access';

-- =====================================================
-- BAN RECORDS
-- =====================================================

CREATE TABLE kyc_vault.ban_records (
    ban_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),

    -- Ban details
    reason VARCHAR(255) NOT NULL,
    reason_code VARCHAR(50) NOT NULL,
    source_platform VARCHAR(50) NOT NULL,

    -- Evidence
    evidence_urls TEXT[],
    moderator_notes TEXT,

    -- Ban type
    ban_type VARCHAR(20) NOT NULL CHECK (ban_type IN ('temporary', 'permanent', 'shadow')),

    -- Duration
    banned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    lifted_at TIMESTAMP,

    -- Appeal
    appeal_id UUID,
    appeal_status VARCHAR(20),

    -- Who banned
    banned_by UUID REFERENCES users(user_id),

    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_ban_user ON kyc_vault.ban_records(user_id);
CREATE INDEX idx_ban_platform ON kyc_vault.ban_records(source_platform);
CREATE INDEX idx_ban_active ON kyc_vault.ban_records(user_id, expires_at) WHERE lifted_at IS NULL;

COMMENT ON TABLE kyc_vault.ban_records IS 'User ban history across platforms';

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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_clients_updated_at BEFORE UPDATE ON oauth_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_profiles_updated_at BEFORE UPDATE ON kyc_vault.kyc_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE kyc_vault.kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_vault.age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_vault.ban_records ENABLE ROW LEVEL SECURITY;

-- Policies will be created based on application roles
-- Example: Only allow users to see their own KYC data
CREATE POLICY kyc_self_select ON kyc_vault.kyc_profiles
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- =====================================================
-- VIEWS
-- =====================================================

-- Safe user view (without sensitive data)
CREATE VIEW users_safe AS
SELECT
    user_id,
    handle,
    display_name,
    avatar_url,
    bio,
    user_type,
    status,
    platform_id,
    created_at,
    last_login_at
FROM users
WHERE deleted_at IS NULL;

COMMENT ON VIEW users_safe IS 'Public-safe user data without PII';

-- =====================================================
-- GRANTS
-- =====================================================

-- Read-only role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO platform_app_ro;

-- Read-write role
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO platform_app_rw;

-- KYC vault access (very restricted)
GRANT SELECT ON ALL TABLES IN SCHEMA kyc_vault TO legal_ops;
GRANT SELECT, INSERT, UPDATE ON kyc_vault.kyc_profiles TO kyc_ops;

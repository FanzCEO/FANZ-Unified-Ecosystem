-- Migration: Complete Blacklist, IP Tracking, Activity Logging & Login History System
-- Date: 2025-11-10
-- Description: Creates comprehensive tables for user blocking, IP tracking, activity monitoring, and login history

-- ========================================
-- BLACKLIST TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('ip', 'email', 'username', 'email_range')),
    value VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    banned_by VARCHAR(255) NOT NULL,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    platform VARCHAR(100) DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast blacklist lookups
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);
CREATE INDEX IF NOT EXISTS idx_blacklist_is_active ON blacklist(is_active);
CREATE INDEX IF NOT EXISTS idx_blacklist_platform ON blacklist(platform);
CREATE INDEX IF NOT EXISTS idx_blacklist_type_value ON blacklist(type, value) WHERE is_active = true;

COMMENT ON TABLE blacklist IS 'Stores banned IPs, emails, usernames, and email ranges';
COMMENT ON COLUMN blacklist.type IS 'Type of ban: ip, email, username, or email_range';
COMMENT ON COLUMN blacklist.value IS 'The actual value being banned (IP, email, username, or @domain.com)';
COMMENT ON COLUMN blacklist.expires_at IS 'When the ban expires (NULL for permanent bans)';

-- ========================================
-- IP LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ip_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip VARCHAR(45) NOT NULL, -- IPv6 support
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    endpoint VARCHAR(500),
    method VARCHAR(10),
    user_agent TEXT,
    country VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    isp VARCHAR(255),
    organization VARCHAR(255),
    is_blocked BOOLEAN DEFAULT false,
    request_count INTEGER DEFAULT 1,
    status_code INTEGER,
    response_time_ms INTEGER,
    platform VARCHAR(100) DEFAULT 'unknown',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for IP tracking
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip ON ip_logs(ip);
CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_timestamp ON ip_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ip_logs_is_blocked ON ip_logs(is_blocked);
CREATE INDEX IF NOT EXISTS idx_ip_logs_platform ON ip_logs(platform);
CREATE INDEX IF NOT EXISTS idx_ip_logs_action ON ip_logs(action);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_timestamp ON ip_logs(ip, timestamp DESC);

COMMENT ON TABLE ip_logs IS 'Logs all IP addresses accessing the platform with geolocation data';
COMMENT ON COLUMN ip_logs.ip IS 'IP address (supports IPv4 and IPv6)';
COMMENT ON COLUMN ip_logs.request_count IS 'Number of requests from this IP in this session';

-- ========================================
-- USER ACTIVITY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    ip VARCHAR(45) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    session_id VARCHAR(255) NOT NULL,
    user_agent TEXT,
    platform VARCHAR(100) DEFAULT 'unknown',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_ip ON user_activity(ip);
CREATE INDEX IF NOT EXISTS idx_user_activity_platform ON user_activity(platform);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_timestamp ON user_activity(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_details ON user_activity USING gin(details);

COMMENT ON TABLE user_activity IS 'Tracks all user actions during their session';
COMMENT ON COLUMN user_activity.action IS 'Type of action performed (e.g., login, logout, upload, purchase)';
COMMENT ON COLUMN user_activity.details IS 'Additional JSON data about the activity';

-- ========================================
-- LOGIN HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    country VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    device VARCHAR(100),
    device_type VARCHAR(50),
    os VARCHAR(100),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    user_agent TEXT,
    is_mobile BOOLEAN DEFAULT false,
    is_tablet BOOLEAN DEFAULT false,
    is_desktop BOOLEAN DEFAULT false,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER, -- in seconds
    session_id VARCHAR(255) NOT NULL,
    is_successful BOOLEAN DEFAULT true,
    failure_reason VARCHAR(255),
    two_factor_used BOOLEAN DEFAULT false,
    platform VARCHAR(100) DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for login history
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip);
CREATE INDEX IF NOT EXISTS idx_login_history_session_id ON login_history(session_id);
CREATE INDEX IF NOT EXISTS idx_login_history_is_successful ON login_history(is_successful);
CREATE INDEX IF NOT EXISTS idx_login_history_platform ON login_history(platform);
CREATE INDEX IF NOT EXISTS idx_login_history_user_login_time ON login_history(user_id, login_time DESC);

COMMENT ON TABLE login_history IS 'Complete login history with device info, location, and session tracking';
COMMENT ON COLUMN login_history.session_duration IS 'Duration of session in seconds';
COMMENT ON COLUMN login_history.is_successful IS 'Whether login was successful or failed';

-- ========================================
-- IP REPUTATION TABLE (Optional Enhancement)
-- ========================================
CREATE TABLE IF NOT EXISTS ip_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip VARCHAR(45) NOT NULL UNIQUE,
    reputation_score INTEGER DEFAULT 100, -- 0-100
    is_vpn BOOLEAN DEFAULT false,
    is_proxy BOOLEAN DEFAULT false,
    is_tor BOOLEAN DEFAULT false,
    is_hosting BOOLEAN DEFAULT false,
    threat_level VARCHAR(20) DEFAULT 'none', -- none, low, medium, high, critical
    total_requests INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    spam_reports INTEGER DEFAULT 0,
    abuse_reports INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_ip ON ip_reputation(ip);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_score ON ip_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_threat_level ON ip_reputation(threat_level);

COMMENT ON TABLE ip_reputation IS 'Tracks reputation and risk scores for IP addresses';
COMMENT ON COLUMN ip_reputation.reputation_score IS 'Reputation score from 0 (worst) to 100 (best)';

-- ========================================
-- SESSION TRACKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    device VARCHAR(100),
    browser VARCHAR(100),
    platform VARCHAR(100) DEFAULT 'unknown',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity DESC);

COMMENT ON TABLE active_sessions IS 'Tracks currently active user sessions';

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check if IP/email/username is blacklisted
CREATE OR REPLACE FUNCTION is_blacklisted(
    check_type VARCHAR,
    check_value VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blacklist
        WHERE type = check_type
        AND value = check_value
        AND is_active = true
        AND (is_permanent = true OR expires_at > CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if email domain is blacklisted
CREATE OR REPLACE FUNCTION is_email_domain_blacklisted(
    email VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    email_domain VARCHAR;
BEGIN
    email_domain := '@' || split_part(email, '@', 2);
    RETURN EXISTS (
        SELECT 1 FROM blacklist
        WHERE type = 'email_range'
        AND value = email_domain
        AND is_active = true
        AND (is_permanent = true OR expires_at > CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update IP reputation based on activity
CREATE OR REPLACE FUNCTION update_ip_reputation(
    check_ip VARCHAR,
    delta_score INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO ip_reputation (ip, reputation_score, total_requests)
    VALUES (check_ip, 100 + delta_score, 1)
    ON CONFLICT (ip) DO UPDATE SET
        reputation_score = GREATEST(0, LEAST(100, ip_reputation.reputation_score + delta_score)),
        total_requests = ip_reputation.total_requests + 1,
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blacklist_updated_at BEFORE UPDATE ON blacklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_reputation_updated_at BEFORE UPDATE ON ip_reputation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUMMARY
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '=== Blacklist & Tracking System Migration Complete ===';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - blacklist (ban management)';
    RAISE NOTICE '  - ip_logs (IP tracking with geolocation)';
    RAISE NOTICE '  - user_activity (activity monitoring)';
    RAISE NOTICE '  - login_history (login tracking)';
    RAISE NOTICE '  - ip_reputation (IP reputation scores)';
    RAISE NOTICE '  - active_sessions (session management)';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions created:';
    RAISE NOTICE '  - is_blacklisted(type, value)';
    RAISE NOTICE '  - is_email_domain_blacklisted(email)';
    RAISE NOTICE '  - update_ip_reputation(ip, score_delta)';
END$$;

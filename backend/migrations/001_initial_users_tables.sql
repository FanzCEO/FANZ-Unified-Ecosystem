-- FANZ Unified Ecosystem - Initial Users Schema Migration
-- Version: 1.0.0
-- Created: 2024

-- =====================================================
-- Extension Setup
-- =====================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostgreSQL crypto extension for secure random values
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Users Table
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'creator', 'moderator', 'admin')),
    
    -- Account verification and status
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification')),
    
    -- Login tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- =====================================================
-- User Profiles Table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile information
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    birth_date DATE,
    location VARCHAR(100),
    website VARCHAR(500),
    
    -- Social links (JSON object)
    social_links JSONB DEFAULT '{}',
    
    -- Privacy settings (JSON object)
    privacy_settings JSONB DEFAULT '{
        "profile_visibility": "public",
        "email_visibility": "private", 
        "show_online_status": true,
        "allow_direct_messages": true
    }',
    
    -- Notification settings (JSON object)
    notification_settings JSONB DEFAULT '{
        "email_notifications": true,
        "push_notifications": true,
        "marketing_emails": false,
        "activity_notifications": true
    }',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_profiles table
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);

-- =====================================================
-- Creator Profiles Table
-- =====================================================

CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Verification status
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents TEXT[], -- Array of document URLs/paths
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Creator settings
    content_categories JSONB DEFAULT '[]', -- Array of categories
    subscription_price DECIMAL(10,2) DEFAULT 0,
    tip_minimum DECIMAL(10,2) DEFAULT 1.00,
    
    -- Financial settings
    commission_rate DECIMAL(5,4) DEFAULT 0.20, -- Platform commission (e.g., 0.20 = 20%)
    payout_method JSONB DEFAULT '{}', -- Payment method configuration
    
    -- Branding and social
    social_links JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}', -- Colors, fonts, etc.
    
    -- Analytics and features
    analytics_enabled BOOLEAN DEFAULT TRUE,
    
    -- Statistics (updated by triggers/jobs)
    total_subscribers INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_content INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for creator_profiles table
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_verification_status ON creator_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_subscription_price ON creator_profiles(subscription_price);

-- =====================================================
-- Follows Table (User Relationships)
-- =====================================================

CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unfollowed_at TIMESTAMP WITH TIME ZONE, -- NULL = currently following
    
    -- Prevent users from following themselves
    CONSTRAINT follows_not_self CHECK (follower_user_id != followed_user_id)
);

-- Unique constraint to prevent duplicate follows
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_user_id, followed_user_id);

-- Indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_active ON follows(follower_user_id, followed_user_id) WHERE unfollowed_at IS NULL;

-- =====================================================
-- Admin Actions Table (Audit Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(100) NOT NULL, -- e.g., 'status_change_suspended', 'content_removed'
    details JSONB DEFAULT '{}', -- Additional action details
    reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_actions table
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- =====================================================
-- Sessions Table (JWT Session Management)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Token information
    refresh_token_hash VARCHAR(255) NOT NULL,
    access_token_jti VARCHAR(255), -- JWT ID for access token blacklisting
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = TRUE;

-- =====================================================
-- Blacklisted Tokens Table (JWT Security)
-- =====================================================

CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    
    -- Token metadata
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(100), -- 'logout', 'security', 'expired', etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for blacklisted_tokens table
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_jti ON blacklisted_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_user_id ON blacklisted_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);

-- =====================================================
-- Password Reset Tokens Table (Future Implementation)
-- =====================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    
    -- Token status
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for password_reset_tokens table
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =====================================================
-- Email Verification Tokens Table (Future Implementation)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL, -- Email being verified (in case of email change)
    
    -- Token status
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for email_verification_tokens table
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- =====================================================
-- Triggers for Updated At Timestamps
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables that need it
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Data (Optional)
-- =====================================================

-- Create a default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt with salt rounds 12
INSERT INTO users (id, email, username, password_hash, role, email_verified, account_status) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@fanz.local',
    'admin',
    '$2b$12$REDACTED_AWS_SECRET_KEYm1Vr2KlMlNPIe', -- admin123
    'admin',
    true,
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO user_profiles (user_id, display_name, bio)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FANZ Administrator',
    'System Administrator Account'
) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.created_at,
    COALESCE(follower_counts.followers, 0) as followers_count,
    COALESCE(following_counts.following, 0) as following_count,
    COALESCE(cp.total_subscribers, 0) as subscribers_count,
    COALESCE(cp.total_revenue, 0) as total_revenue,
    COALESCE(cp.total_content, 0) as content_count
FROM users u
LEFT JOIN (
    SELECT followed_user_id, COUNT(*) as followers
    FROM follows 
    WHERE unfollowed_at IS NULL 
    GROUP BY followed_user_id
) follower_counts ON u.id = follower_counts.followed_user_id
LEFT JOIN (
    SELECT follower_user_id, COUNT(*) as following
    FROM follows 
    WHERE unfollowed_at IS NULL 
    GROUP BY follower_user_id
) following_counts ON u.id = following_counts.follower_user_id
LEFT JOIN creator_profiles cp ON u.id = cp.user_id
WHERE u.deleted_at IS NULL;

-- View for active user sessions
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
    us.*,
    u.username,
    u.email,
    u.role
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE 
  AND us.expires_at > CURRENT_TIMESTAMP
  AND u.deleted_at IS NULL;

-- =====================================================
-- Cleanup Jobs (Run Periodically)
-- =====================================================

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up expired blacklisted tokens
    DELETE FROM blacklisted_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up expired email verification tokens
    DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up expired user sessions
    UPDATE user_sessions SET is_active = FALSE WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Performance Optimization
-- =====================================================

-- Analyze tables for query optimization
ANALYZE users, user_profiles, creator_profiles, follows, user_sessions, admin_actions, blacklisted_tokens;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE users IS 'Core user accounts with authentication and basic profile info';
COMMENT ON TABLE user_profiles IS 'Extended user profile information and settings';
COMMENT ON TABLE creator_profiles IS 'Creator-specific profile data and monetization settings';
COMMENT ON TABLE follows IS 'User follow/unfollow relationships';
COMMENT ON TABLE admin_actions IS 'Audit log for administrative actions';
COMMENT ON TABLE user_sessions IS 'Active user sessions for JWT token management';
COMMENT ON TABLE blacklisted_tokens IS 'Blacklisted JWT tokens for security';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'FANZ Unified Ecosystem - Users schema migration completed successfully';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Tables created: users, user_profiles, creator_profiles, follows, admin_actions, user_sessions, blacklisted_tokens, password_reset_tokens, email_verification_tokens';
    RAISE NOTICE 'Default admin user created: admin@fanz.local (username: admin, password: admin123)';
    RAISE NOTICE 'IMPORTANT: Change the default admin password immediately!';
END $$;
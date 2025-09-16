-- ============================================
-- 🔐 FANZ Vendor Access System Database Schema
-- Migration: 20250916_create_vendor_access_tables.sql
-- ============================================

BEGIN;

-- ============================================
-- 👤 VENDOR PROFILES TABLE
-- ============================================
CREATE TABLE vendor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN (
        'contractor', 'consultant', 'support-staff', 'auditor', 
        'maintenance', 'security-analyst', 'compliance-officer', 'payment-specialist'
    )),
    
    -- Contact Information (JSON)
    contact_info JSONB NOT NULL DEFAULT '{}',
    
    -- Verification Status
    background_check_completed BOOLEAN DEFAULT FALSE,
    background_check_date TIMESTAMP WITH TIME ZONE,
    nda_signed BOOLEAN DEFAULT FALSE,
    nda_signed_date TIMESTAMP WITH TIME ZONE,
    compliance_training_completed BOOLEAN DEFAULT FALSE,
    compliance_training_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'terminated')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendor profiles
CREATE INDEX idx_vendor_profiles_email ON vendor_profiles(email);
CREATE INDEX idx_vendor_profiles_status ON vendor_profiles(status);
CREATE INDEX idx_vendor_profiles_vendor_type ON vendor_profiles(vendor_type);
CREATE INDEX idx_vendor_profiles_created_at ON vendor_profiles(created_at);

-- ============================================
-- 🎟️ ACCESS GRANTS TABLE
-- ============================================
CREATE TABLE access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL, -- Reference to admin user
    
    -- Access Configuration
    categories TEXT[] NOT NULL, -- Array of access categories
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('read-only', 'read-write', 'admin', 'emergency')),
    
    -- Restrictions (JSON)
    restrictions JSONB DEFAULT '{}',
    
    -- Validity Period
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_duration_hours INTEGER NOT NULL,
    extendable BOOLEAN DEFAULT FALSE,
    auto_renew BOOLEAN DEFAULT FALSE,
    
    -- Approval Workflow
    required_approvers UUID[] DEFAULT '{}', -- Array of user IDs
    current_approvals UUID[] DEFAULT '{}',  -- Array of user IDs who approved
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'expired', 'revoked')),
    
    -- Revocation
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revocation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for access grants
CREATE INDEX idx_access_grants_vendor_id ON access_grants(vendor_id);
CREATE INDEX idx_access_grants_status ON access_grants(status);
CREATE INDEX idx_access_grants_granted_by ON access_grants(granted_by);
CREATE INDEX idx_access_grants_end_time ON access_grants(end_time);
CREATE INDEX idx_access_grants_categories ON access_grants USING GIN(categories);
CREATE INDEX idx_access_grants_created_at ON access_grants(created_at);

-- ============================================
-- 🔑 VENDOR ACCESS TOKENS TABLE
-- ============================================
CREATE TABLE vendor_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of token for security
    grant_id UUID NOT NULL REFERENCES access_grants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    
    -- Token Metadata
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Revocation
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revocation_reason TEXT,
    
    -- Security
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendor access tokens
CREATE INDEX idx_vendor_tokens_token_hash ON vendor_access_tokens(token_hash);
CREATE INDEX idx_vendor_tokens_grant_id ON vendor_access_tokens(grant_id);
CREATE INDEX idx_vendor_tokens_vendor_id ON vendor_access_tokens(vendor_id);
CREATE INDEX idx_vendor_tokens_expires_at ON vendor_access_tokens(expires_at);
CREATE INDEX idx_vendor_tokens_revoked ON vendor_access_tokens(revoked);

-- ============================================
-- 📊 VENDOR SESSIONS TABLE
-- ============================================
CREATE TABLE vendor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    token_id UUID REFERENCES vendor_access_tokens(id) ON DELETE SET NULL,
    
    -- Session Information
    ip_address INET NOT NULL,
    user_agent TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Session Metadata
    total_requests INTEGER DEFAULT 0,
    unique_endpoints INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendor sessions
CREATE INDEX idx_vendor_sessions_vendor_id ON vendor_sessions(vendor_id);
CREATE INDEX idx_vendor_sessions_token_id ON vendor_sessions(token_id);
CREATE INDEX idx_vendor_sessions_start_time ON vendor_sessions(start_time);
CREATE INDEX idx_vendor_sessions_end_time ON vendor_sessions(end_time);
CREATE INDEX idx_vendor_sessions_ip_address ON vendor_sessions(ip_address);

-- ============================================
-- 📝 VENDOR ACTIVITIES TABLE
-- ============================================
CREATE TABLE vendor_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES vendor_sessions(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    
    -- Request/Response Data (limited for security)
    request_data JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    
    -- Security Analysis
    risk_score INTEGER DEFAULT 0,
    risk_factors TEXT[],
    
    -- Context
    ip_address INET NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendor activities
CREATE INDEX idx_vendor_activities_session_id ON vendor_activities(session_id);
CREATE INDEX idx_vendor_activities_vendor_id ON vendor_activities(vendor_id);
CREATE INDEX idx_vendor_activities_timestamp ON vendor_activities(timestamp);
CREATE INDEX idx_vendor_activities_endpoint ON vendor_activities(endpoint);
CREATE INDEX idx_vendor_activities_risk_score ON vendor_activities(risk_score);

-- ============================================
-- 📊 VENDOR ACCESS ANALYTICS TABLE
-- ============================================
CREATE TABLE vendor_access_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    date_bucket DATE NOT NULL, -- Daily aggregation
    hour_bucket INTEGER CHECK (hour_bucket >= 0 AND hour_bucket <= 23),
    
    -- Metrics
    total_vendors INTEGER DEFAULT 0,
    active_vendors INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    grants_created INTEGER DEFAULT 0,
    grants_approved INTEGER DEFAULT 0,
    tokens_generated INTEGER DEFAULT 0,
    
    -- Access by Category (JSON aggregation)
    category_usage JSONB DEFAULT '{}',
    
    -- Risk Metrics
    high_risk_activities INTEGER DEFAULT 0,
    security_violations INTEGER DEFAULT 0,
    revocations INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics
CREATE UNIQUE INDEX idx_vendor_analytics_date_hour ON vendor_access_analytics(date_bucket, hour_bucket);
CREATE INDEX idx_vendor_analytics_date ON vendor_access_analytics(date_bucket);

-- ============================================
-- 🛡️ AUDIT LOG TABLE (for vendor access events)
-- ============================================
CREATE TABLE vendor_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Information
    action VARCHAR(100) NOT NULL,
    vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,
    grant_id UUID REFERENCES access_grants(id) ON DELETE SET NULL,
    session_id UUID REFERENCES vendor_sessions(id) ON DELETE SET NULL,
    admin_user_id UUID, -- Reference to admin who performed action
    
    -- Event Context
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(500),
    
    -- Event Data
    metadata JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Additional Context
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit logs
CREATE INDEX idx_vendor_audit_action ON vendor_audit_logs(action);
CREATE INDEX idx_vendor_audit_vendor_id ON vendor_audit_logs(vendor_id);
CREATE INDEX idx_vendor_audit_timestamp ON vendor_audit_logs(timestamp);
CREATE INDEX idx_vendor_audit_severity ON vendor_audit_logs(severity);
CREATE INDEX idx_vendor_audit_admin_user ON vendor_audit_logs(admin_user_id);

-- ============================================
-- 🔄 TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update timestamps on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_grants_updated_at BEFORE UPDATE ON access_grants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 📊 VIEWS FOR COMMON QUERIES
-- ============================================

-- Active vendor grants view
CREATE VIEW active_vendor_grants AS
SELECT 
    vp.id as vendor_id,
    vp.name as vendor_name,
    vp.email as vendor_email,
    vp.company as vendor_company,
    vp.vendor_type,
    ag.id as grant_id,
    ag.categories,
    ag.access_level,
    ag.start_time,
    ag.end_time,
    ag.status,
    CASE 
        WHEN ag.end_time < CURRENT_TIMESTAMP THEN 'expired'
        WHEN ag.status = 'approved' AND ag.start_time <= CURRENT_TIMESTAMP THEN 'active'
        ELSE ag.status
    END as computed_status
FROM vendor_profiles vp
JOIN access_grants ag ON vp.id = ag.vendor_id
WHERE ag.status IN ('approved', 'active') 
    AND ag.revoked_at IS NULL;

-- Vendor session summary view
CREATE VIEW vendor_session_summary AS
SELECT 
    vs.vendor_id,
    COUNT(*) as total_sessions,
    MAX(vs.last_activity) as last_activity,
    SUM(vs.total_requests) as total_requests,
    AVG(vs.risk_score) as avg_risk_score,
    COUNT(CASE WHEN vs.end_time IS NULL THEN 1 END) as active_sessions
FROM vendor_sessions vs
GROUP BY vs.vendor_id;

-- Security metrics view
CREATE VIEW vendor_security_metrics AS
SELECT 
    DATE(val.timestamp) as date,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN val.risk_score > 7 THEN 1 END) as high_risk_activities,
    COUNT(CASE WHEN val.success = false THEN 1 END) as error_responses,
    COUNT(DISTINCT val.vendor_id) as active_vendors,
    AVG(val.risk_score) as avg_risk_score
FROM vendor_audit_logs val
WHERE val.action = 'vendor_activity'
GROUP BY DATE(val.timestamp)
ORDER BY date DESC;

-- ============================================
-- 🔒 ROW LEVEL SECURITY (Optional)
-- ============================================

-- Enable RLS on sensitive tables (uncomment if needed)
-- ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendor_access_tokens ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for vendor profiles (restrict to admins)
-- CREATE POLICY vendor_profiles_admin_only ON vendor_profiles
--     FOR ALL TO fanz_admin_role
--     USING (true);

-- ============================================
-- 📋 INITIAL DATA & CONSTRAINTS
-- ============================================

-- Add constraint to ensure end_time is after start_time
ALTER TABLE access_grants 
ADD CONSTRAINT check_grant_time_validity 
CHECK (end_time > start_time);

-- Add constraint to ensure max_duration_hours is reasonable (max 30 days)
ALTER TABLE access_grants 
ADD CONSTRAINT check_max_duration_reasonable 
CHECK (max_duration_hours > 0 AND max_duration_hours <= 720); -- 30 days

-- Add constraint for token expiry
ALTER TABLE vendor_access_tokens 
ADD CONSTRAINT check_token_expiry 
CHECK (expires_at > issued_at);

-- ============================================
-- 🔧 HELPER FUNCTIONS
-- ============================================

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_vendor_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM vendor_access_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND revoked = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update grant status based on time
CREATE OR REPLACE FUNCTION update_grant_statuses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE access_grants 
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'approved' 
    AND end_time < CURRENT_TIMESTAMP
    AND status != 'expired';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 📝 COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE vendor_profiles IS 'Stores vendor registration information and verification status';
COMMENT ON TABLE access_grants IS 'Time-limited access grants with category-based permissions';
COMMENT ON TABLE vendor_access_tokens IS 'JWT tokens for vendor API access with tracking';
COMMENT ON TABLE vendor_sessions IS 'Active vendor sessions with activity tracking';
COMMENT ON TABLE vendor_activities IS 'Detailed log of all vendor API activities';
COMMENT ON TABLE vendor_access_analytics IS 'Aggregated analytics for vendor access patterns';
COMMENT ON TABLE vendor_audit_logs IS 'Comprehensive audit trail for vendor access events';

COMMENT ON COLUMN access_grants.categories IS 'Array of access categories (e.g., admin-panel-members, payment-processing)';
COMMENT ON COLUMN access_grants.restrictions IS 'JSON object with IP whitelist, endpoint restrictions, etc.';
COMMENT ON COLUMN vendor_access_tokens.token_hash IS 'SHA-256 hash of the actual JWT token for secure storage';
COMMENT ON COLUMN vendor_activities.risk_score IS 'Calculated risk score (0-100) based on activity patterns';

COMMIT;

-- ============================================
-- 🎯 MIGRATION COMPLETE
-- ============================================
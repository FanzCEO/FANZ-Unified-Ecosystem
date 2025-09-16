-- Admin Users table for JWT authentication system
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user (password: 'admin123' - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' with bcrypt rounds=12
INSERT INTO admin_users (email, password_hash, permissions, status)
VALUES (
    'admin@fanz.com',
    '$2a$12$9vYGZNRg0kS8qGr3cJ8.8Op5m9YxI3RN.YZqzBJ5NKg1HCWz7VBjG',
    '["admin:manage", "vendor:manage", "system:admin", "analytics:view", "reports:generate"]',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);

-- Create token blacklist table for logout/security
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID claim
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blacklisted_by UUID REFERENCES admin_users(id),
    reason VARCHAR(100)
);

-- Create index for token blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Create function to clean up expired blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_blacklisted_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Available admin permissions (for reference)
/*
Admin Permission System:

Core Permissions:
- admin:manage         : Create/manage other admin users
- vendor:manage        : Full vendor management (create, edit, delete, tokens)
- vendor:view          : View vendor profiles and stats
- analytics:view       : View system analytics and reports
- reports:generate     : Generate and download reports
- system:admin         : System administration tasks
- audit:view           : View audit logs and security events
- settings:manage      : Manage system settings and configuration

Vendor-specific Permissions:
- vendor:create        : Create new vendor profiles
- vendor:edit          : Edit existing vendor profiles
- vendor:delete        : Delete vendor profiles
- vendor:tokens        : Manage vendor access tokens
- vendor:suspend       : Suspend/unsuspend vendor access

System Permissions:
- logs:view            : View system logs
- metrics:view         : View system metrics
- security:manage      : Manage security settings
- backup:manage        : Manage system backups
- database:admin       : Database administration tasks

The 'admin:manage' permission acts as a super-admin permission that grants access to all features.
*/
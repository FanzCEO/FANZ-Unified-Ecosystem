-- 🚀 FANZ Unified Ecosystem - Compliance, Security & Analytics Migration
-- Version: 003
-- Description: Add compliance, moderation, security, notifications, and analytics tables
-- Date: December 2024

BEGIN;

-- =============================================================================
-- COMPLIANCE & MODERATION
-- =============================================================================

-- Content moderation
CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_content_type VARCHAR(50) NOT NULL, -- post, comment, user, message
    reported_content_id UUID NOT NULL,
    reporter_id UUID REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    assigned_to UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adult content compliance (2257 records)
CREATE TABLE compliance_2257_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_posts(id),
    performer_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    id_document_type VARCHAR(50) NOT NULL,
    id_document_url VARCHAR(500) NOT NULL,
    custodian_name VARCHAR(200) DEFAULT 'FANZ Platform Inc.',
    custodian_address TEXT,
    record_date DATE NOT NULL,
    verification_status verification_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Age verification
CREATE TABLE age_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_method VARCHAR(50) NOT NULL, -- id_document, credit_card, phone_sms, biometric
    provider VARCHAR(100), -- jumio, veriff, trulioo, etc.
    provider_verification_id VARCHAR(200),
    document_type VARCHAR(50),
    document_url VARCHAR(500),
    verified_age INTEGER,
    confidence_score DECIMAL(5,2),
    status verification_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- =============================================================================

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    new_subscriber BOOLEAN DEFAULT TRUE,
    new_tip BOOLEAN DEFAULT TRUE,
    new_message BOOLEAN DEFAULT TRUE,
    new_comment BOOLEAN DEFAULT TRUE,
    new_content BOOLEAN DEFAULT TRUE,
    payout_updates BOOLEAN DEFAULT TRUE,
    promotional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels VARCHAR(20)[] DEFAULT ARRAY['app'], -- app, email, push, sms
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS & REPORTING
-- =============================================================================

-- Platform analytics
CREATE TABLE platform_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    cluster platform_cluster NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, cluster, metric_name)
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    cluster platform_cluster NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECURITY & AUDIT
-- =============================================================================

-- Audit log for all important actions
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL, -- login_failed, suspicious_activity, password_changed, etc.
    severity VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FINANCIAL BALANCE TRIGGERS
-- =============================================================================

-- Function to update user balance after transaction
CREATE OR REPLACE FUNCTION update_user_balance_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update user balance based on transaction type
        IF NEW.transaction_type IN ('tip', 'subscription', 'ppv', 'merchandise', 'nft') THEN
            -- Credit creator
            INSERT INTO user_balances (user_id, available_balance, total_earned, last_transaction_at)
            VALUES (NEW.creator_id, NEW.net_amount, NEW.net_amount, NEW.processed_at)
            ON CONFLICT (user_id) DO UPDATE SET
                available_balance = user_balances.available_balance + NEW.net_amount,
                total_earned = user_balances.total_earned + NEW.net_amount,
                last_transaction_at = NEW.processed_at,
                updated_at = NOW();
        ELSIF NEW.transaction_type = 'withdrawal' THEN
            -- Debit user
            UPDATE user_balances SET
                available_balance = available_balance - NEW.amount,
                total_withdrawn = total_withdrawn + NEW.amount,
                last_transaction_at = NEW.processed_at,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_balance_update 
    AFTER UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_user_balance_after_transaction();

-- =============================================================================
-- INDEXES FOR COMPLIANCE AND ANALYTICS
-- =============================================================================

-- Compliance indexes
CREATE INDEX idx_moderation_reports_content_type_id ON moderation_reports(reported_content_type, reported_content_id);
CREATE INDEX idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX idx_compliance_2257_creator_id ON compliance_2257_records(creator_id);
CREATE INDEX idx_age_verification_user_id ON age_verification(user_id);
CREATE INDEX idx_age_verification_status ON age_verification(status);

-- Analytics indexes
CREATE INDEX idx_creator_analytics_creator_date ON creator_analytics(creator_id, date);
CREATE INDEX idx_platform_analytics_date_cluster ON platform_analytics(date, cluster);
CREATE INDEX idx_user_activity_user_created ON user_activity(user_id, created_at);

-- Security indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =============================================================================
-- TRIGGERS FOR COMPLIANCE TABLES
-- =============================================================================

-- Apply updated_at triggers
CREATE TRIGGER update_moderation_reports_updated_at BEFORE UPDATE ON moderation_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_2257_records_updated_at BEFORE UPDATE ON compliance_2257_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_age_verification_updated_at BEFORE UPDATE ON age_verification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- REPORTING VIEWS
-- =============================================================================

-- Creator earnings view
CREATE VIEW creator_earnings_summary AS
SELECT 
    c.id as creator_id,
    c.creator_name,
    c.user_id,
    COALESCE(SUM(CASE WHEN t.transaction_type IN ('tip', 'subscription', 'ppv') AND t.status = 'completed' THEN t.net_amount ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN t.transaction_type IN ('tip', 'subscription', 'ppv') AND t.status = 'completed' AND t.created_at >= date_trunc('month', CURRENT_DATE) THEN t.net_amount ELSE 0 END), 0) as this_month_earnings,
    COUNT(DISTINCT us.user_id) as subscriber_count,
    COUNT(DISTINCT cp.id) as content_count
FROM creators c
LEFT JOIN transactions t ON c.id = t.creator_id
LEFT JOIN user_subscriptions us ON c.id = us.creator_id AND us.status = 'active'
LEFT JOIN content_posts cp ON c.id = cp.creator_id AND cp.status = 'published'
GROUP BY c.id, c.creator_name, c.user_id;

-- Platform revenue view
CREATE VIEW platform_revenue_summary AS
SELECT 
    DATE_TRUNC('day', t.created_at) as date,
    COUNT(*) as transaction_count,
    SUM(t.amount) as gross_revenue,
    SUM(t.platform_fee) as platform_revenue,
    SUM(t.processor_fee) as processor_costs,
    SUM(t.net_amount) as creator_earnings
FROM transactions t
WHERE t.status = 'completed'
GROUP BY DATE_TRUNC('day', t.created_at);

COMMIT;
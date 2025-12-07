-- =====================================================
-- FANZ AUDIT DATABASE
-- Audit logs, GDPR/CCPA compliance, data subject requests
-- Used by: All Platforms (compliance and security)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- AUDIT SCHEMA - Audit logging (WORM - Write Once Read Many)
-- =====================================================

CREATE SCHEMA audit;

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit.logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_sequence BIGSERIAL UNIQUE NOT NULL, -- Immutable sequence

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL CHECK (event_category IN (
        'authentication', 'authorization', 'data_access', 'data_modification',
        'data_deletion', 'configuration_change', 'security', 'compliance', 'admin_action'
    )),
    event_action VARCHAR(100) NOT NULL, -- e.g., 'user.login', 'post.delete', 'payment.refund'

    -- Actor (who performed the action)
    actor_user_id UUID,
    actor_type VARCHAR(30) NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'api', 'automation')),
    actor_ip INET,
    actor_user_agent TEXT,

    -- Target (what was affected)
    target_type VARCHAR(50) NOT NULL, -- 'user', 'post', 'payment', etc.
    target_id UUID NOT NULL,
    target_identifier VARCHAR(255), -- Human-readable identifier

    -- Resource
    resource_type VARCHAR(50),
    resource_id UUID,

    -- Platform context
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Change details
    old_values JSONB, -- State before change
    new_values JSONB, -- State after change
    changes_summary TEXT,

    -- Request details
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    api_endpoint TEXT,
    http_method VARCHAR(10),

    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'partial', 'denied')),
    failure_reason TEXT,

    -- Security
    security_level VARCHAR(20) DEFAULT 'normal' CHECK (security_level IN ('low', 'normal', 'high', 'critical')),
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),

    -- Retention
    retention_required BOOLEAN DEFAULT TRUE,
    retention_until TIMESTAMP,

    -- Timestamp (immutable)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prevent updates and deletes (WORM)
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit.logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit.logs DO INSTEAD NOTHING;

CREATE INDEX idx_audit_logs_actor ON audit.logs(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_target ON audit.logs(target_type, target_id, created_at DESC);
CREATE INDEX idx_audit_logs_category ON audit.logs(event_category, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit.logs(event_action, created_at DESC);
CREATE INDEX idx_audit_logs_platform ON audit.logs(platform_id, created_at DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit.logs(created_at DESC);
CREATE INDEX idx_audit_logs_suspicious ON audit.logs(is_suspicious, created_at DESC) WHERE is_suspicious = TRUE;
CREATE INDEX idx_audit_logs_security ON audit.logs(security_level, created_at DESC) WHERE security_level IN ('high', 'critical');

COMMENT ON TABLE audit.logs IS 'Immutable audit log (WORM storage)';

-- =====================================================
-- SECURITY EVENTS
-- =====================================================

CREATE TABLE audit.security_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'failed_login', 'suspicious_activity', 'brute_force_attempt', 'unauthorized_access',
        'privilege_escalation', 'data_breach_attempt', 'malware_detected', 'ddos_attempt'
    )),

    -- Severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),

    -- Actor
    actor_user_id UUID,
    actor_ip INET NOT NULL,
    actor_user_agent TEXT,

    -- Details
    event_description TEXT NOT NULL,
    event_details JSONB,

    -- Detection
    detection_method VARCHAR(30) CHECK (detection_method IN ('automated', 'ai_model', 'manual', 'user_report')),
    detection_confidence DECIMAL(5,2),

    -- Response
    response_action VARCHAR(50),
    response_taken_at TIMESTAMP,
    response_taken_by UUID,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),

    -- Platform context
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON audit.security_events(event_type, severity, detected_at DESC);
CREATE INDEX idx_security_events_actor_ip ON audit.security_events(actor_ip, detected_at DESC);
CREATE INDEX idx_security_events_severity ON audit.security_events(severity, detected_at DESC);
CREATE INDEX idx_security_events_status ON audit.security_events(status) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_security_events_platform ON audit.security_events(platform_id, detected_at DESC);

COMMENT ON TABLE audit.security_events IS 'Security incident tracking';

-- =====================================================
-- GDPR SCHEMA - Data privacy compliance
-- =====================================================

CREATE SCHEMA gdpr;

-- =====================================================
-- DATA SUBJECT REQUESTS (DSR)
-- =====================================================

CREATE TABLE gdpr.data_subject_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(50) UNIQUE NOT NULL,

    -- Requester
    requester_user_id UUID,
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255),

    -- Request type
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'restriction', 'portability',
        'objection', 'withdraw_consent', 'do_not_sell' -- CCPA
    )),

    -- Request details
    request_description TEXT,
    specific_data_categories TEXT[], -- e.g., ['posts', 'payments', 'messages']

    -- Verification
    identity_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50),
    verified_at TIMESTAMP,
    verified_by UUID,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (status IN (
        'received', 'verifying_identity', 'processing', 'completed',
        'rejected', 'cancelled', 'extended'
    )),

    -- Processing
    assigned_to UUID,
    processing_started_at TIMESTAMP,
    processing_notes TEXT,

    -- Compliance deadlines
    received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deadline_at TIMESTAMP NOT NULL, -- 30 days for GDPR, 45 days for CCPA
    extended_deadline_at TIMESTAMP,
    extension_reason TEXT,

    -- Completion
    completed_at TIMESTAMP,
    completion_notes TEXT,
    rejection_reason TEXT,

    -- Data package (for access/portability requests)
    data_package_url TEXT,
    data_package_generated_at TIMESTAMP,
    data_package_expires_at TIMESTAMP,

    -- Deletion confirmation (for erasure requests)
    deletion_confirmed BOOLEAN DEFAULT FALSE,
    deletion_confirmed_at TIMESTAMP,
    deletion_log JSONB, -- What was deleted

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsr_user ON gdpr.data_subject_requests(requester_user_id) WHERE requester_user_id IS NOT NULL;
CREATE INDEX idx_dsr_email ON gdpr.data_subject_requests(requester_email);
CREATE INDEX idx_dsr_type ON gdpr.data_subject_requests(request_type, status);
CREATE INDEX idx_dsr_status ON gdpr.data_subject_requests(status, received_at DESC);
CREATE INDEX idx_dsr_deadline ON gdpr.data_subject_requests(deadline_at) WHERE status NOT IN ('completed', 'rejected', 'cancelled');
CREATE INDEX idx_dsr_platform ON gdpr.data_subject_requests(platform_id, received_at DESC);

COMMENT ON TABLE gdpr.data_subject_requests IS 'GDPR/CCPA data subject requests';

-- =====================================================
-- CONSENT RECORDS
-- =====================================================

CREATE TABLE gdpr.consent_records (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Consent type
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'terms_of_service', 'privacy_policy', 'marketing_emails', 'data_processing',
        'third_party_sharing', 'cookies', 'analytics', 'age_verification'
    )),

    -- Consent details
    consent_granted BOOLEAN NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT,
    consent_url TEXT,

    -- Method
    consent_method VARCHAR(30) NOT NULL CHECK (consent_method IN (
        'explicit_opt_in', 'implicit_acceptance', 'granular_choice', 'mandatory'
    )),

    -- Context
    ip_address INET NOT NULL,
    user_agent TEXT,

    -- Withdrawal
    withdrawn BOOLEAN DEFAULT FALSE,
    withdrawn_at TIMESTAMP,
    withdrawal_method VARCHAR(30),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_consent_user ON gdpr.consent_records(user_id, consent_type);
CREATE INDEX idx_consent_active ON gdpr.consent_records(user_id, consent_type) WHERE consent_granted = TRUE AND withdrawn = FALSE;
CREATE INDEX idx_consent_platform ON gdpr.consent_records(platform_id, granted_at DESC);

COMMENT ON TABLE gdpr.consent_records IS 'User consent tracking for compliance';

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

CREATE TABLE gdpr.retention_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Policy details
    policy_name VARCHAR(255) NOT NULL,
    policy_description TEXT,

    -- Data category
    data_category VARCHAR(50) NOT NULL, -- 'user_profiles', 'transactions', 'content', etc.
    data_type VARCHAR(50) NOT NULL,

    -- Retention period
    retention_duration_days INTEGER NOT NULL,
    retention_start_event VARCHAR(50) NOT NULL, -- 'created', 'last_access', 'account_closure'

    -- Action after retention
    post_retention_action VARCHAR(30) NOT NULL CHECK (post_retention_action IN (
        'delete', 'anonymize', 'archive', 'notify'
    )),

    -- Legal basis
    legal_basis TEXT,
    regulation VARCHAR(50), -- 'GDPR', 'CCPA', 'LGPD', etc.

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retention_policies_category ON gdpr.retention_policies(data_category, is_active);
CREATE INDEX idx_retention_policies_active ON gdpr.retention_policies(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE gdpr.retention_policies IS 'Data retention policy definitions';

-- =====================================================
-- DELETION QUEUE
-- =====================================================

CREATE TABLE gdpr.deletion_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User/data to delete
    user_id UUID,
    data_category VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data_identifiers JSONB NOT NULL, -- IDs of specific records to delete

    -- Reason
    deletion_reason VARCHAR(50) NOT NULL CHECK (deletion_reason IN (
        'user_request', 'retention_expired', 'account_closure', 'legal_requirement', 'admin_action'
    )),
    related_dsr_id UUID REFERENCES gdpr.data_subject_requests(request_id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'processing', 'completed', 'failed', 'requires_review'
    )),

    -- Processing
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,

    -- Audit
    deleted_record_count INTEGER DEFAULT 0,
    deletion_log JSONB,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    scheduled_for TIMESTAMP NOT NULL
);

CREATE INDEX idx_deletion_queue_user ON gdpr.deletion_queue(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_deletion_queue_status ON gdpr.deletion_queue(status, scheduled_for);
CREATE INDEX idx_deletion_queue_scheduled ON gdpr.deletion_queue(scheduled_for) WHERE status = 'queued';
CREATE INDEX idx_deletion_queue_platform ON gdpr.deletion_queue(platform_id, queued_at DESC);

COMMENT ON TABLE gdpr.deletion_queue IS 'Scheduled data deletion queue';

-- =====================================================
-- ACCESS LOGS (Who accessed what data)
-- =====================================================

CREATE TABLE gdpr.data_access_logs (
    access_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Accessor
    accessor_user_id UUID NOT NULL,
    accessor_type VARCHAR(30) NOT NULL CHECK (accessor_type IN ('user', 'admin', 'system', 'support', 'legal')),

    -- Accessed data
    data_subject_user_id UUID NOT NULL, -- Whose data was accessed
    data_category VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data_identifiers JSONB,

    -- Purpose
    access_purpose VARCHAR(50) NOT NULL CHECK (access_purpose IN (
        'user_self_access', 'support_ticket', 'legal_request', 'security_investigation',
        'system_maintenance', 'compliance_audit', 'data_correction'
    )),
    purpose_details TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_logs_accessor ON gdpr.data_access_logs(accessor_user_id, accessed_at DESC);
CREATE INDEX idx_access_logs_subject ON gdpr.data_access_logs(data_subject_user_id, accessed_at DESC);
CREATE INDEX idx_access_logs_purpose ON gdpr.data_access_logs(access_purpose, accessed_at DESC);
CREATE INDEX idx_access_logs_date ON gdpr.data_access_logs(accessed_at DESC);

COMMENT ON TABLE gdpr.data_access_logs IS 'Audit trail of data access for privacy compliance';

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

CREATE TRIGGER update_dsr_updated_at BEFORE UPDATE ON gdpr.data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON gdpr.retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate DSR request number
CREATE OR REPLACE FUNCTION generate_dsr_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number = 'DSR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.request_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_dsr_number_trigger BEFORE INSERT ON gdpr.data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION generate_dsr_number();

-- Auto-calculate deadline for DSR
CREATE OR REPLACE FUNCTION set_dsr_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- GDPR: 30 days, CCPA: 45 days (using 30 days as default)
    IF NEW.deadline_at IS NULL THEN
        NEW.deadline_at = NEW.received_at + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_dsr_deadline_trigger BEFORE INSERT ON gdpr.data_subject_requests
    FOR EACH ROW EXECUTE FUNCTION set_dsr_deadline();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE gdpr.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr.data_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own DSRs
CREATE POLICY dsr_self_access ON gdpr.data_subject_requests
    FOR SELECT
    USING (
        requester_user_id = current_setting('app.current_user_id')::UUID OR
        current_setting('app.user_role', true) IN ('legal_ops', 'admin')
    );

-- Only authorized roles can access data access logs
CREATE POLICY data_access_logs_authorized ON gdpr.data_access_logs
    FOR SELECT
    USING (
        current_setting('app.user_role', true) IN ('legal_ops', 'admin', 'compliance')
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- Pending DSRs
CREATE VIEW gdpr.pending_requests AS
SELECT
    dsr.request_id,
    dsr.request_number,
    dsr.request_type,
    dsr.requester_email,
    dsr.status,
    dsr.received_at,
    dsr.deadline_at,
    (dsr.deadline_at - NOW()) as time_remaining,
    dsr.platform_id
FROM gdpr.data_subject_requests dsr
WHERE dsr.status NOT IN ('completed', 'rejected', 'cancelled')
ORDER BY dsr.deadline_at ASC;

COMMENT ON VIEW gdpr.pending_requests IS 'Active data subject requests with deadlines';

-- Audit summary
CREATE VIEW audit.recent_critical_events AS
SELECT
    log_id,
    event_action,
    event_category,
    actor_user_id,
    target_type,
    target_id,
    status,
    security_level,
    is_suspicious,
    platform_id,
    created_at
FROM audit.logs
WHERE security_level IN ('high', 'critical') OR is_suspicious = TRUE
ORDER BY created_at DESC
LIMIT 1000;

COMMENT ON VIEW audit.recent_critical_events IS 'Recent critical or suspicious audit events';

-- =====================================================
-- GRANTS
-- =====================================================

-- Audit schema access (read-only for most, append-only for writers)
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO platform_app_ro;
GRANT SELECT, INSERT ON audit.logs TO platform_app_rw;
GRANT SELECT, INSERT, UPDATE ON audit.security_events TO security_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO platform_app_rw;

-- GDPR schema access (restricted)
GRANT SELECT ON ALL TABLES IN SCHEMA gdpr TO compliance_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA gdpr TO compliance_rw;
GRANT SELECT ON gdpr.data_subject_requests TO legal_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gdpr TO compliance_rw;

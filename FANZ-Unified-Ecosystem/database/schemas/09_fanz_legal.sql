-- =====================================================
-- FANZ LEGAL DATABASE
-- DMCA notices, takedowns, copyright claims, legal compliance
-- Used by: FanzLegal, FanzDefender, FanzProtect
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DMCA SCHEMA - Copyright claims
-- =====================================================

CREATE SCHEMA dmca;

-- =====================================================
-- DMCA NOTICES
-- =====================================================

CREATE TABLE dmca.notices (
    notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_number VARCHAR(50) UNIQUE NOT NULL,

    -- Complainant (person filing DMCA)
    complainant_name VARCHAR(255) NOT NULL,
    complainant_email VARCHAR(255) NOT NULL,
    complainant_phone VARCHAR(50),
    complainant_company VARCHAR(255),
    complainant_address TEXT,

    -- Agent (if filed through agent)
    agent_name VARCHAR(255),
    agent_company VARCHAR(255),
    agent_email VARCHAR(255),

    -- Alleged infringer
    infringer_user_id UUID,
    infringer_creator_id UUID,
    infringer_platform VARCHAR(50),

    -- Notice type
    notice_type VARCHAR(30) NOT NULL CHECK (notice_type IN (
        'takedown', 'counter_notice', 'repeat_infringer'
    )),

    -- Infringing content
    infringing_urls TEXT[] NOT NULL,
    infringing_asset_ids UUID[],
    infringing_post_ids UUID[],

    -- Original work details
    original_work_description TEXT NOT NULL,
    original_work_urls TEXT[],
    copyright_registration_number VARCHAR(100),

    -- Sworn statements
    good_faith_statement TEXT NOT NULL,
    accuracy_statement TEXT NOT NULL,
    penalty_of_perjury_statement TEXT NOT NULL,

    -- Electronic signature
    signature_name VARCHAR(255) NOT NULL,
    signature_date TIMESTAMP NOT NULL,
    signature_ip INET NOT NULL,

    -- Evidence
    evidence_urls TEXT[],
    evidence_files JSONB, -- Encrypted file references

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (status IN (
        'received', 'under_review', 'valid', 'invalid', 'action_taken',
        'counter_filed', 'resolved', 'escalated', 'withdrawn'
    )),

    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_notes TEXT,

    -- Action taken
    action_taken VARCHAR(30) CHECK (action_taken IN (
        'content_removed', 'account_warned', 'account_suspended', 'no_action', 'counter_notice_sent'
    )),
    action_taken_at TIMESTAMP,

    -- Resolution
    resolution_type VARCHAR(30),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    filed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notices_complainant ON dmca.notices(complainant_email);
CREATE INDEX idx_notices_infringer_user ON dmca.notices(infringer_user_id) WHERE infringer_user_id IS NOT NULL;
CREATE INDEX idx_notices_infringer_creator ON dmca.notices(infringer_creator_id) WHERE infringer_creator_id IS NOT NULL;
CREATE INDEX idx_notices_status ON dmca.notices(status, filed_at DESC);
CREATE INDEX idx_notices_platform ON dmca.notices(platform_id, filed_at DESC);
CREATE INDEX idx_notices_date ON dmca.notices(filed_at DESC);
CREATE INDEX idx_notices_assets ON dmca.notices USING gin(infringing_asset_ids);

COMMENT ON TABLE dmca.notices IS 'DMCA takedown notices and copyright claims';

-- =====================================================
-- COUNTER NOTICES
-- =====================================================

CREATE TABLE dmca.counter_notices (
    counter_notice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_notice_id UUID NOT NULL REFERENCES dmca.notices(notice_id),

    -- Counter-claimant (alleged infringer)
    counter_claimant_user_id UUID NOT NULL,
    counter_claimant_name VARCHAR(255) NOT NULL,
    counter_claimant_email VARCHAR(255) NOT NULL,
    counter_claimant_phone VARCHAR(50),
    counter_claimant_address TEXT NOT NULL,

    -- Counter arguments
    counter_statement TEXT NOT NULL,
    good_faith_statement TEXT NOT NULL,
    jurisdiction_consent TEXT NOT NULL,
    penalty_of_perjury_statement TEXT NOT NULL,

    -- Electronic signature
    signature_name VARCHAR(255) NOT NULL,
    signature_date TIMESTAMP NOT NULL,
    signature_ip INET NOT NULL,

    -- Evidence
    evidence_urls TEXT[],
    evidence_description TEXT,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'filed' CHECK (status IN (
        'filed', 'sent_to_complainant', 'waiting_response', 'accepted', 'rejected', 'content_restored'
    )),

    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_notes TEXT,

    -- Wait period (10-14 business days per DMCA)
    waiting_period_ends TIMESTAMP,

    -- Action
    action_taken VARCHAR(30),
    action_taken_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    filed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_counter_notices_original ON dmca.counter_notices(original_notice_id);
CREATE INDEX idx_counter_notices_user ON dmca.counter_notices(counter_claimant_user_id);
CREATE INDEX idx_counter_notices_status ON dmca.counter_notices(status, filed_at DESC);
CREATE INDEX idx_counter_notices_waiting ON dmca.counter_notices(waiting_period_ends) WHERE status = 'waiting_response';

COMMENT ON TABLE dmca.counter_notices IS 'DMCA counter-notices from alleged infringers';

-- =====================================================
-- TAKEDOWNS SCHEMA - Content removal
-- =====================================================

CREATE SCHEMA takedowns;

-- =====================================================
-- TAKEDOWN ACTIONS
-- =====================================================

CREATE TABLE takedowns.actions (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Related notice
    dmca_notice_id UUID REFERENCES dmca.notices(notice_id),

    -- Content removed
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'post', 'media_asset', 'product', 'profile', 'message', 'comment'
    )),
    content_id UUID NOT NULL,
    content_url TEXT,

    -- Reason
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'dmca_takedown', 'copyright_claim', 'trademark_violation', 'terms_violation',
        'illegal_content', 'court_order', 'voluntary_removal'
    )),
    reason_details TEXT,

    -- Action details
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
        'content_hidden', 'content_deleted', 'access_restricted', 'account_suspended'
    )),

    -- Affected user
    affected_user_id UUID NOT NULL,
    affected_creator_id UUID,

    -- Who took action
    actioned_by UUID NOT NULL,
    actioned_by_type VARCHAR(20) CHECK (actioned_by_type IN ('admin', 'automated', 'legal_team')),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reversed', 'expired')),

    -- Restoration
    can_be_restored BOOLEAN DEFAULT TRUE,
    restored_at TIMESTAMP,
    restored_by UUID,
    restoration_reason TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    action_taken_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_takedowns_dmca ON takedowns.actions(dmca_notice_id) WHERE dmca_notice_id IS NOT NULL;
CREATE INDEX idx_takedowns_content ON takedowns.actions(content_type, content_id);
CREATE INDEX idx_takedowns_user ON takedowns.actions(affected_user_id, action_taken_at DESC);
CREATE INDEX idx_takedowns_status ON takedowns.actions(status);
CREATE INDEX idx_takedowns_platform ON takedowns.actions(platform_id, action_taken_at DESC);

COMMENT ON TABLE takedowns.actions IS 'Content takedown actions';

-- =====================================================
-- EVIDENCE SCHEMA - Restricted access
-- =====================================================

CREATE SCHEMA evidence;

-- =====================================================
-- EVIDENCE VAULT
-- =====================================================

CREATE TABLE evidence.vault (
    evidence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Related case
    dmca_notice_id UUID REFERENCES dmca.notices(notice_id),
    takedown_action_id UUID REFERENCES takedowns.actions(action_id),

    -- Evidence type
    evidence_type VARCHAR(30) NOT NULL CHECK (evidence_type IN (
        'screenshot', 'video', 'document', 'correspondence', 'court_filing', 'other'
    )),

    -- Storage (encrypted)
    storage_url TEXT NOT NULL,
    storage_provider VARCHAR(50) NOT NULL,
    storage_key TEXT NOT NULL,
    encryption_key_id VARCHAR(100) NOT NULL,

    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- For integrity verification
    mime_type VARCHAR(100) NOT NULL,

    -- Chain of custody
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accessed_by UUID[],
    access_log JSONB,

    -- Retention
    retention_required BOOLEAN DEFAULT TRUE,
    retention_until TIMESTAMP,

    -- Description
    description TEXT,
    tags TEXT[],

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_dmca ON evidence.vault(dmca_notice_id) WHERE dmca_notice_id IS NOT NULL;
CREATE INDEX idx_evidence_takedown ON evidence.vault(takedown_action_id) WHERE takedown_action_id IS NOT NULL;
CREATE INDEX idx_evidence_type ON evidence.vault(evidence_type);
CREATE INDEX idx_evidence_retention ON evidence.vault(retention_until) WHERE retention_required = TRUE;

COMMENT ON TABLE evidence.vault IS 'Encrypted evidence storage - RESTRICTED ACCESS';

-- =====================================================
-- REPEAT INFRINGERS
-- =====================================================

CREATE TABLE dmca.repeat_infringers (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    creator_id UUID,

    -- Infringement count
    strike_count INTEGER NOT NULL DEFAULT 1,
    dmca_notice_ids UUID[] NOT NULL,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'flagged' CHECK (status IN (
        'flagged', 'warned', 'restricted', 'suspended', 'terminated'
    )),

    -- Actions taken
    warning_sent_at TIMESTAMP,
    restricted_at TIMESTAMP,
    suspended_at TIMESTAMP,
    terminated_at TIMESTAMP,

    -- Appeal
    appeal_filed_at TIMESTAMP,
    appeal_status VARCHAR(20),
    appeal_notes TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    first_strike_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_strike_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repeat_infringers_user ON dmca.repeat_infringers(user_id);
CREATE INDEX idx_repeat_infringers_status ON dmca.repeat_infringers(status);
CREATE INDEX idx_repeat_infringers_strikes ON dmca.repeat_infringers(strike_count DESC);

COMMENT ON TABLE dmca.repeat_infringers IS 'Repeat copyright infringer tracking';

-- =====================================================
-- LEGAL CLAIMS SCHEMA
-- =====================================================

CREATE SCHEMA legal_claims;

-- =====================================================
-- LEGAL CLAIMS
-- =====================================================

CREATE TABLE legal_claims.claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,

    -- Claimant
    claimant_name VARCHAR(255) NOT NULL,
    claimant_email VARCHAR(255) NOT NULL,
    claimant_company VARCHAR(255),
    claimant_attorney VARCHAR(255),

    -- Claim type
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN (
        'copyright', 'trademark', 'defamation', 'privacy', 'harassment',
        'impersonation', 'fraud', 'terms_violation', 'other'
    )),

    -- Details
    claim_description TEXT NOT NULL,
    legal_basis TEXT,

    -- Respondent
    respondent_user_id UUID,
    respondent_creator_id UUID,

    -- Content in question
    content_urls TEXT[],
    content_ids UUID[],

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'filed' CHECK (status IN (
        'filed', 'under_review', 'investigating', 'action_required',
        'resolved', 'closed', 'escalated_to_legal'
    )),

    -- Review
    assigned_to UUID,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,

    -- Resolution
    resolution_type VARCHAR(30),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,

    -- Court involvement
    court_case_number VARCHAR(100),
    court_jurisdiction VARCHAR(100),
    court_order_received BOOLEAN DEFAULT FALSE,
    court_order_url TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    filed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_type ON legal_claims.claims(claim_type, status);
CREATE INDEX idx_claims_respondent_user ON legal_claims.claims(respondent_user_id) WHERE respondent_user_id IS NOT NULL;
CREATE INDEX idx_claims_status ON legal_claims.claims(status, filed_at DESC);
CREATE INDEX idx_claims_platform ON legal_claims.claims(platform_id, filed_at DESC);
CREATE INDEX idx_claims_assigned ON legal_claims.claims(assigned_to) WHERE status IN ('investigating', 'under_review');

COMMENT ON TABLE legal_claims.claims IS 'Legal claims and complaints';

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

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON dmca.notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counter_notices_updated_at BEFORE UPDATE ON dmca.counter_notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repeat_infringers_updated_at BEFORE UPDATE ON dmca.repeat_infringers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON legal_claims.claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate notice number
CREATE OR REPLACE FUNCTION generate_notice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.notice_number = 'DMCA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.notice_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_notice_number_trigger BEFORE INSERT ON dmca.notices
    FOR EACH ROW EXECUTE FUNCTION generate_notice_number();

-- Auto-generate claim number
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.claim_number = 'CLAIM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.claim_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_claim_number_trigger BEFORE INSERT ON legal_claims.claims
    FOR EACH ROW EXECUTE FUNCTION generate_claim_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on evidence vault (highly restricted)
ALTER TABLE evidence.vault ENABLE ROW LEVEL SECURITY;

-- Only legal ops can access evidence
CREATE POLICY evidence_legal_ops_only ON evidence.vault
    FOR SELECT
    USING (
        current_setting('app.user_role', true) = 'legal_ops' OR
        current_setting('app.user_role', true) = 'admin'
    );

-- =====================================================
-- VIEWS
-- =====================================================

-- Active DMCA notices
CREATE VIEW dmca.active_notices AS
SELECT
    n.notice_id,
    n.notice_number,
    n.notice_type,
    n.complainant_name,
    n.complainant_email,
    n.infringer_user_id,
    n.infringing_urls,
    n.status,
    n.platform_id,
    n.filed_at,
    COUNT(t.action_id) as takedown_count,
    COUNT(cn.counter_notice_id) as counter_notice_count
FROM dmca.notices n
LEFT JOIN takedowns.actions t ON n.notice_id = t.dmca_notice_id
LEFT JOIN dmca.counter_notices cn ON n.notice_id = cn.original_notice_id
WHERE n.status NOT IN ('resolved', 'withdrawn')
GROUP BY n.notice_id;

COMMENT ON VIEW dmca.active_notices IS 'Active DMCA notices with related counts';

-- Repeat infringer summary
CREATE VIEW dmca.infringer_summary AS
SELECT
    ri.user_id,
    ri.creator_id,
    ri.strike_count,
    ri.status,
    ri.first_strike_at,
    ri.last_strike_at,
    ri.platform_id,
    COUNT(n.notice_id) as total_notices
FROM dmca.repeat_infringers ri
LEFT JOIN dmca.notices n ON n.notice_id = ANY(ri.dmca_notice_ids)
GROUP BY ri.record_id, ri.user_id, ri.creator_id, ri.strike_count, ri.status, ri.first_strike_at, ri.last_strike_at, ri.platform_id;

COMMENT ON VIEW dmca.infringer_summary IS 'Repeat infringer statistics';

-- =====================================================
-- GRANTS
-- =====================================================

-- DMCA schema access (limited)
GRANT SELECT ON ALL TABLES IN SCHEMA dmca TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA dmca TO legal_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dmca TO legal_ops;

-- Takedowns schema access
GRANT SELECT ON ALL TABLES IN SCHEMA takedowns TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA takedowns TO legal_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA takedowns TO legal_ops;

-- Evidence vault access (very restricted)
GRANT SELECT ON ALL TABLES IN SCHEMA evidence TO legal_ops;
GRANT SELECT, INSERT ON evidence.vault TO legal_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA evidence TO legal_ops;

-- Legal claims access
GRANT SELECT ON ALL TABLES IN SCHEMA legal_claims TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA legal_claims TO legal_ops;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA legal_claims TO legal_ops;

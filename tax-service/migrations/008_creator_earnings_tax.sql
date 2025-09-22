-- Creator Earnings Tax Tables
-- FANZ Unified Ecosystem - Tax Compliance
-- 
-- Tables for creator tax profiles, earnings records, information returns,
-- backup withholding, and 1099 generation

-- Creator tax profiles with W-9/W-8 data
CREATE TABLE creator_tax_profiles (
    creator_id UUID PRIMARY KEY,
    tin_type VARCHAR(10) CHECK (tin_type IN ('ssn', 'ein', 'itin', 'atin')),
    tin_status VARCHAR(20) NOT NULL DEFAULT 'missing' CHECK (tin_status IN ('pending', 'validated', 'invalid', 'missing')),
    encrypted_tin TEXT, -- Encrypted TIN for security
    tin_hash VARCHAR(64), -- SHA-256 hash for duplicate detection without exposing TIN
    business_name VARCHAR(255),
    legal_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(30) NOT NULL CHECK (business_type IN (
        'individual', 'sole_proprietorship', 'partnership', 'corporation', 
        's_corporation', 'llc', 'estate_trust', 'nonprofit'
    )),
    tax_classification VARCHAR(100) NOT NULL,
    foreign_status VARCHAR(20) NOT NULL DEFAULT 'unknown' CHECK (foreign_status IN ('us_person', 'foreign_person', 'unknown')),
    w9_form_data JSONB,
    w8_form_data JSONB,
    backup_withholding_exempt BOOLEAN NOT NULL DEFAULT false,
    backup_withholding_certified BOOLEAN NOT NULL DEFAULT false,
    fatca_exempt BOOLEAN NOT NULL DEFAULT false,
    consent_date DATE,
    consent_source VARCHAR(20) CHECK (consent_source IN ('web_form', 'api', 'email', 'paper')),
    verification_level VARCHAR(20) NOT NULL DEFAULT 'unverified' CHECK (verification_level IN (
        'unverified', 'basic', 'enhanced', 'identity_verified'
    )),
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(tin_hash) -- Prevent duplicate TINs
);

-- Creator earnings records for tax reporting
CREATE TABLE creator_earnings_records (
    id VARCHAR(255) PRIMARY KEY,
    creator_id UUID NOT NULL,
    payout_id VARCHAR(255) NOT NULL,
    tax_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    earnings_type VARCHAR(30) NOT NULL CHECK (earnings_type IN (
        'content_sales', 'subscriptions', 'tips', 'donations', 
        'platform_incentives', 'referral_bonus'
    )),
    gross_earnings DECIMAL(18,2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_earnings DECIMAL(18,2) NOT NULL DEFAULT 0,
    taxable_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    backup_withheld_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    federal_tax_withheld_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    state_tax_withheld_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    jurisdiction VARCHAR(10) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (creator_id) REFERENCES creator_tax_profiles(creator_id)
);

-- Information returns (1099s)
CREATE TABLE information_returns (
    id VARCHAR(255) PRIMARY KEY,
    form_type VARCHAR(10) NOT NULL CHECK (form_type IN ('1099NEC', '1099MISC', '1099K')),
    tax_year INTEGER NOT NULL,
    creator_id UUID NOT NULL,
    payer_info JSONB NOT NULL,
    payee_info JSONB NOT NULL,
    amounts JSONB NOT NULL DEFAULT '{}',
    corrections JSONB NOT NULL DEFAULT '{"isCorrection": false}',
    transmission_info JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'ready', 'transmitted', 'acknowledged', 'rejected'
    )),
    filing_deadline DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (creator_id) REFERENCES creator_tax_profiles(creator_id),
    UNIQUE(creator_id, form_type, tax_year) -- One form per creator per type per year
);

-- Backup withholding calculations and history
CREATE TABLE backup_withholding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    payout_id VARCHAR(255) NOT NULL,
    payout_amount DECIMAL(18,2) NOT NULL,
    withholding_rate DECIMAL(5,4) NOT NULL DEFAULT 0.2400, -- 24%
    withholding_amount DECIMAL(18,2) NOT NULL,
    reason VARCHAR(30) NOT NULL CHECK (reason IN (
        'no_tin', 'incorrect_tin', 'payee_notification', 'reportable_payment'
    )),
    exemption_applied BOOLEAN NOT NULL DEFAULT false,
    exemption_reason TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (creator_id) REFERENCES creator_tax_profiles(creator_id)
);

-- Tax year thresholds configuration
CREATE TABLE tax_year_thresholds (
    tax_year INTEGER PRIMARY KEY,
    form_1099nec_threshold DECIMAL(18,2) NOT NULL DEFAULT 600.00,
    form_1099misc_threshold DECIMAL(18,2) NOT NULL DEFAULT 600.00,
    form_1099k_threshold DECIMAL(18,2) NOT NULL DEFAULT 20000.00,
    form_1099k_transaction_threshold INTEGER NOT NULL DEFAULT 200,
    backup_withholding_rate DECIMAL(5,4) NOT NULL DEFAULT 0.2400,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregated creator earnings for fast reporting
CREATE TABLE creator_earnings_summary (
    creator_id UUID NOT NULL,
    tax_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    total_gross_earnings DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_net_earnings DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_taxable_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_backup_withheld DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_federal_withheld DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_state_withheld DECIMAL(18,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    earnings_breakdown JSONB DEFAULT '{}', -- By earnings type
    jurisdiction_breakdown JSONB DEFAULT '{}', -- By state
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (creator_id, tax_year, quarter),
    FOREIGN KEY (creator_id) REFERENCES creator_tax_profiles(creator_id)
);

-- Creator tax audit logs
CREATE TABLE creator_tax_audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    creator_id UUID NOT NULL,
    actor_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (creator_id) REFERENCES creator_tax_profiles(creator_id)
);

-- Indexes for performance
CREATE INDEX idx_creator_tax_profiles_tin_status ON creator_tax_profiles(tin_status);
CREATE INDEX idx_creator_tax_profiles_business_type ON creator_tax_profiles(business_type);
CREATE INDEX idx_creator_tax_profiles_foreign_status ON creator_tax_profiles(foreign_status);
CREATE INDEX idx_creator_tax_profiles_verification_level ON creator_tax_profiles(verification_level);
CREATE INDEX idx_creator_tax_profiles_risk_score ON creator_tax_profiles(risk_score);
CREATE INDEX idx_creator_tax_profiles_created_at ON creator_tax_profiles(created_at);

CREATE INDEX idx_creator_earnings_creator_year ON creator_earnings_records(creator_id, tax_year);
CREATE INDEX idx_creator_earnings_tax_year_quarter ON creator_earnings_records(tax_year, quarter);
CREATE INDEX idx_creator_earnings_payment_date ON creator_earnings_records(payment_date);
CREATE INDEX idx_creator_earnings_earnings_type ON creator_earnings_records(earnings_type);
CREATE INDEX idx_creator_earnings_payout_id ON creator_earnings_records(payout_id);
CREATE INDEX idx_creator_earnings_taxable_amount ON creator_earnings_records(taxable_amount) WHERE taxable_amount > 0;

CREATE INDEX idx_information_returns_creator_year ON information_returns(creator_id, tax_year);
CREATE INDEX idx_information_returns_form_type ON information_returns(form_type);
CREATE INDEX idx_information_returns_status ON information_returns(status);
CREATE INDEX idx_information_returns_filing_deadline ON information_returns(filing_deadline);
CREATE INDEX idx_information_returns_tax_year ON information_returns(tax_year);

CREATE INDEX idx_backup_withholding_creator ON backup_withholding_records(creator_id);
CREATE INDEX idx_backup_withholding_payout ON backup_withholding_records(payout_id);
CREATE INDEX idx_backup_withholding_calculated_at ON backup_withholding_records(calculated_at);

CREATE INDEX idx_creator_earnings_summary_tax_year ON creator_earnings_summary(tax_year);
CREATE INDEX idx_creator_earnings_summary_taxable ON creator_earnings_summary(total_taxable_amount) WHERE total_taxable_amount > 0;

CREATE INDEX idx_creator_tax_audit_logs_creator ON creator_tax_audit_logs(creator_id);
CREATE INDEX idx_creator_tax_audit_logs_action ON creator_tax_audit_logs(action);
CREATE INDEX idx_creator_tax_audit_logs_created_at ON creator_tax_audit_logs(created_at);

-- Seed current tax year thresholds
INSERT INTO tax_year_thresholds (
    tax_year, 
    form_1099nec_threshold, 
    form_1099misc_threshold, 
    form_1099k_threshold, 
    form_1099k_transaction_threshold, 
    backup_withholding_rate
) VALUES
    (2024, 600.00, 600.00, 20000.00, 200, 0.2400),
    (2025, 600.00, 600.00, 600.00, 0, 0.2400), -- 1099-K threshold changing to $600 with no transaction minimum
    (2026, 600.00, 600.00, 600.00, 0, 0.2400);

-- Add updated_at triggers
CREATE TRIGGER update_creator_tax_profiles_updated_at 
    BEFORE UPDATE ON creator_tax_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_information_returns_updated_at 
    BEFORE UPDATE ON information_returns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_year_thresholds_updated_at 
    BEFORE UPDATE ON tax_year_thresholds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Active creator tax profiles requiring attention
CREATE OR REPLACE VIEW creator_tax_status AS
SELECT 
    ctp.creator_id,
    ctp.legal_name,
    ctp.business_name,
    ctp.tin_type,
    ctp.tin_status,
    ctp.business_type,
    ctp.foreign_status,
    ctp.verification_level,
    ctp.risk_score,
    ctp.backup_withholding_exempt,
    ctp.backup_withholding_certified,
    CASE 
        WHEN ctp.tin_status = 'missing' THEN 'Missing TIN'
        WHEN ctp.tin_status = 'invalid' THEN 'Invalid TIN'
        WHEN ctp.tin_status = 'pending' THEN 'TIN Validation Pending'
        WHEN NOT ctp.backup_withholding_certified THEN 'Backup Withholding Required'
        WHEN ctp.verification_level = 'unverified' THEN 'Identity Verification Required'
        WHEN ctp.risk_score >= 70 THEN 'High Risk Profile'
        ELSE 'Compliant'
    END as compliance_status,
    ctp.created_at,
    ctp.updated_at
FROM creator_tax_profiles ctp
ORDER BY ctp.risk_score DESC, ctp.updated_at DESC;

-- Creator earnings above 1099 thresholds
CREATE OR REPLACE VIEW creators_above_1099_threshold AS
WITH yearly_earnings AS (
    SELECT 
        cer.creator_id,
        cer.tax_year,
        SUM(cer.taxable_amount) as total_taxable,
        SUM(cer.backup_withheld_amount) as total_backup_withheld,
        COUNT(*) as payment_count,
        STRING_AGG(DISTINCT cer.earnings_type, ', ') as earnings_types
    FROM creator_earnings_records cer
    GROUP BY cer.creator_id, cer.tax_year
)
SELECT 
    ye.creator_id,
    ye.tax_year,
    ctp.legal_name,
    ctp.business_name,
    ctp.tin_type,
    ctp.tin_status,
    ye.total_taxable,
    ye.total_backup_withheld,
    ye.payment_count,
    ye.earnings_types,
    tyt.form_1099nec_threshold,
    CASE 
        WHEN ye.total_taxable >= tyt.form_1099nec_threshold THEN '1099NEC'
        WHEN ye.total_taxable >= tyt.form_1099misc_threshold THEN '1099MISC'
        ELSE 'No Form Required'
    END as required_form_type,
    COALESCE(ir.status, 'Not Generated') as form_status
FROM yearly_earnings ye
JOIN creator_tax_profiles ctp ON ye.creator_id = ctp.creator_id
JOIN tax_year_thresholds tyt ON ye.tax_year = tyt.tax_year
LEFT JOIN information_returns ir ON ye.creator_id = ir.creator_id 
    AND ye.tax_year = ir.tax_year
WHERE ye.total_taxable >= tyt.form_1099nec_threshold
ORDER BY ye.tax_year DESC, ye.total_taxable DESC;

-- Backup withholding summary
CREATE OR REPLACE VIEW backup_withholding_summary AS
SELECT 
    bwr.creator_id,
    ctp.legal_name,
    ctp.business_name,
    COUNT(*) as withholding_events,
    SUM(bwr.payout_amount) as total_payouts,
    SUM(bwr.withholding_amount) as total_withheld,
    AVG(bwr.withholding_rate) as avg_withholding_rate,
    STRING_AGG(DISTINCT bwr.reason, ', ') as withholding_reasons,
    MIN(bwr.calculated_at) as first_withholding,
    MAX(bwr.calculated_at) as last_withholding
FROM backup_withholding_records bwr
JOIN creator_tax_profiles ctp ON bwr.creator_id = ctp.creator_id
GROUP BY bwr.creator_id, ctp.legal_name, ctp.business_name
ORDER BY total_withheld DESC;

-- Information returns filing status
CREATE OR REPLACE VIEW information_returns_status AS
SELECT 
    ir.tax_year,
    ir.form_type,
    COUNT(*) as total_returns,
    COUNT(*) FILTER (WHERE ir.status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE ir.status = 'ready') as ready_count,
    COUNT(*) FILTER (WHERE ir.status = 'transmitted') as transmitted_count,
    COUNT(*) FILTER (WHERE ir.status = 'acknowledged') as acknowledged_count,
    COUNT(*) FILTER (WHERE ir.status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE ir.filing_deadline < CURRENT_DATE AND ir.status IN ('draft', 'ready')) as overdue_count,
    ROUND(
        COUNT(*) FILTER (WHERE ir.status = 'acknowledged')::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate
FROM information_returns ir
GROUP BY ir.tax_year, ir.form_type
ORDER BY ir.tax_year DESC, ir.form_type;

-- Creator earnings trends
CREATE OR REPLACE VIEW creator_earnings_trends AS
WITH quarterly_totals AS (
    SELECT 
        tax_year,
        quarter,
        COUNT(DISTINCT creator_id) as active_creators,
        SUM(total_gross_earnings) as total_gross,
        SUM(total_taxable_amount) as total_taxable,
        SUM(total_backup_withheld) as total_withheld,
        AVG(total_taxable_amount) as avg_taxable_per_creator
    FROM creator_earnings_summary
    GROUP BY tax_year, quarter
)
SELECT 
    qt.*,
    LAG(qt.total_taxable) OVER (ORDER BY qt.tax_year, qt.quarter) as previous_quarter_taxable,
    CASE 
        WHEN LAG(qt.total_taxable) OVER (ORDER BY qt.tax_year, qt.quarter) > 0 THEN
            ROUND(((qt.total_taxable - LAG(qt.total_taxable) OVER (ORDER BY qt.tax_year, qt.quarter)) / 
                   LAG(qt.total_taxable) OVER (ORDER BY qt.tax_year, qt.quarter) * 100), 2)
        ELSE NULL
    END as growth_rate_percent
FROM quarterly_totals qt
ORDER BY qt.tax_year DESC, qt.quarter DESC;

-- Comments for documentation
COMMENT ON TABLE creator_tax_profiles IS 'Creator tax profiles with W-9/W-8 data and TIN information';
COMMENT ON TABLE creator_earnings_records IS 'Individual creator earnings records for tax reporting';
COMMENT ON TABLE information_returns IS '1099 forms and other information returns';
COMMENT ON TABLE backup_withholding_records IS 'Backup withholding calculations and history';
COMMENT ON TABLE tax_year_thresholds IS 'IRS thresholds for information reporting by tax year';
COMMENT ON TABLE creator_earnings_summary IS 'Aggregated creator earnings for fast reporting';
COMMENT ON TABLE creator_tax_audit_logs IS 'Audit trail for all creator tax profile changes';

COMMENT ON COLUMN creator_tax_profiles.encrypted_tin IS 'Encrypted TIN using FanzDash KMS encryption';
COMMENT ON COLUMN creator_tax_profiles.tin_hash IS 'SHA-256 hash for duplicate detection without exposing TIN';
COMMENT ON COLUMN creator_tax_profiles.risk_score IS 'Risk score 0-100 based on profile completeness and verification';
COMMENT ON COLUMN creator_earnings_records.taxable_amount IS 'Amount subject to backup withholding and 1099 reporting';
COMMENT ON COLUMN information_returns.amounts IS 'Form box amounts (box1, box2, etc.) in JSON format';
COMMENT ON COLUMN backup_withholding_records.withholding_rate IS 'Backup withholding rate (default 24%)';

-- Performance monitoring query examples (commented out - for reference)
/*
-- Find creators requiring 1099 forms for current tax year
SELECT creator_id, legal_name, total_taxable 
FROM creators_above_1099_threshold 
WHERE tax_year = EXTRACT(YEAR FROM CURRENT_DATE) - 1
  AND required_form_type != 'No Form Required'
  AND form_status = 'Not Generated';

-- High-risk creator profiles needing attention
SELECT creator_id, legal_name, compliance_status, risk_score
FROM creator_tax_status 
WHERE compliance_status != 'Compliant'
ORDER BY risk_score DESC;

-- Backup withholding by quarter
SELECT 
    tax_year, 
    quarter, 
    SUM(total_backup_withheld) as quarterly_withholding,
    COUNT(DISTINCT creator_id) as creators_with_withholding
FROM creator_earnings_summary 
WHERE total_backup_withheld > 0
GROUP BY tax_year, quarter
ORDER BY tax_year DESC, quarter DESC;

-- Information returns filing progress
SELECT * FROM information_returns_status 
WHERE tax_year = EXTRACT(YEAR FROM CURRENT_DATE) - 1;
*/
-- =====================================================
-- FANZ MONEY DATABASE
-- Financial ledger, transactions, payouts, tax compliance
-- Used by: FanzMoney, FanzFinance, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- LEDGER SCHEMA - Core financial records
-- =====================================================

CREATE SCHEMA ledger;

-- =====================================================
-- ACCOUNTS
-- =====================================================

CREATE TABLE ledger.accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users from fanz_identity

    -- Account type
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('fan', 'creator', 'affiliate', 'platform', 'escrow')),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen', 'closed')),

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE INDEX idx_accounts_user ON ledger.accounts(user_id) WHERE status = 'active';
CREATE INDEX idx_accounts_tenant_platform ON ledger.accounts(tenant_id, platform_id);
CREATE INDEX idx_accounts_type ON ledger.accounts(account_type);

COMMENT ON TABLE ledger.accounts IS 'User financial accounts for all transactions';

-- =====================================================
-- BALANCES
-- =====================================================

CREATE TABLE ledger.balances (
    balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES ledger.accounts(account_id),

    -- Balance amounts (in cents/smallest currency unit)
    available_balance BIGINT NOT NULL DEFAULT 0,
    pending_balance BIGINT NOT NULL DEFAULT 0,
    held_balance BIGINT NOT NULL DEFAULT 0, -- Escrow
    total_balance BIGINT GENERATED ALWAYS AS (available_balance + pending_balance + held_balance) STORED,

    -- Lifetime stats
    lifetime_earned BIGINT NOT NULL DEFAULT 0,
    lifetime_spent BIGINT NOT NULL DEFAULT 0,
    lifetime_withdrawn BIGINT NOT NULL DEFAULT 0,

    -- Last transaction
    last_transaction_at TIMESTAMP,
    last_payout_at TIMESTAMP,

    -- Timestamps
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT balances_positive CHECK (available_balance >= 0 AND pending_balance >= 0 AND held_balance >= 0)
);

CREATE UNIQUE INDEX idx_balances_account ON ledger.balances(account_id);
CREATE INDEX idx_balances_available ON ledger.balances(available_balance) WHERE available_balance > 0;

COMMENT ON TABLE ledger.balances IS 'Real-time account balances';

-- =====================================================
-- TRANSACTIONS
-- =====================================================

CREATE TABLE ledger.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,

    -- Accounts involved
    from_account_id UUID REFERENCES ledger.accounts(account_id),
    to_account_id UUID REFERENCES ledger.accounts(account_id),

    -- Amount (in cents/smallest currency unit)
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Transaction type
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'subscription', 'tip', 'ppv', 'custom_content', 'product_purchase',
        'payout', 'refund', 'chargeback', 'fee', 'escrow_hold', 'escrow_release',
        'affiliate_commission', 'revshare', 'adjustment', 'deposit', 'withdrawal'
    )),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'reversed', 'cancelled'
    )),

    -- External references
    external_transaction_id VARCHAR(255), -- Processor transaction ID
    payment_processor VARCHAR(50), -- ccbill, segpay, etc.
    payment_method_id VARCHAR(255),

    -- Related content/subscription
    content_id UUID,
    subscription_id UUID,
    custom_content_request_id UUID,
    product_id UUID,

    -- Escrow
    escrow_id UUID,
    is_escrowed BOOLEAN DEFAULT FALSE,
    escrow_release_date TIMESTAMP,

    -- Fees
    platform_fee_amount BIGINT DEFAULT 0,
    processor_fee_amount BIGINT DEFAULT 0,
    net_amount BIGINT GENERATED ALWAYS AS (amount - platform_fee_amount - processor_fee_amount) STORED,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Description
    description TEXT,

    -- Metadata
    metadata JSONB,

    -- IP and location
    ip_address INET,
    country_code VARCHAR(2),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,

    CONSTRAINT transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_transactions_from_account ON ledger.transactions(from_account_id, created_at DESC);
CREATE INDEX idx_transactions_to_account ON ledger.transactions(to_account_id, created_at DESC);
CREATE INDEX idx_transactions_type ON ledger.transactions(type);
CREATE INDEX idx_transactions_status ON ledger.transactions(status);
CREATE INDEX idx_transactions_platform ON ledger.transactions(platform_id, created_at DESC);
CREATE INDEX idx_transactions_external ON ledger.transactions(external_transaction_id) WHERE external_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_escrow ON ledger.transactions(escrow_id) WHERE is_escrowed = TRUE;
CREATE INDEX idx_transactions_date ON ledger.transactions(created_at DESC);

COMMENT ON TABLE ledger.transactions IS 'All financial transactions across platforms';

-- =====================================================
-- PAYOUTS
-- =====================================================

CREATE TABLE ledger.payouts (
    payout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_number VARCHAR(50) UNIQUE NOT NULL,

    account_id UUID NOT NULL REFERENCES ledger.accounts(account_id),
    user_id UUID NOT NULL,

    -- Amount (in cents/smallest currency unit)
    requested_amount BIGINT NOT NULL,
    fee_amount BIGINT NOT NULL DEFAULT 0,
    net_amount BIGINT GENERATED ALWAYS AS (requested_amount - fee_amount) STORED,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Payout method
    payout_method VARCHAR(30) NOT NULL CHECK (payout_method IN (
        'paxum', 'epayservice', 'cosmo_payment', 'wire', 'ach', 'paypal', 'wise', 'payoneer', 'crypto'
    )),
    payout_provider VARCHAR(50) NOT NULL,

    -- Destination
    destination_account VARCHAR(255) NOT NULL, -- Encrypted
    destination_details JSONB, -- Encrypted recipient info

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'processing', 'completed', 'failed', 'cancelled', 'returned'
    )),

    -- External reference
    external_payout_id VARCHAR(255),

    -- Review
    reviewed_by UUID, -- Admin who approved
    reviewed_at TIMESTAMP,
    review_notes TEXT,

    -- Failure
    failure_reason TEXT,
    failure_code VARCHAR(50),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT payouts_amount_positive CHECK (requested_amount > 0)
);

CREATE INDEX idx_payouts_account ON ledger.payouts(account_id, requested_at DESC);
CREATE INDEX idx_payouts_user ON ledger.payouts(user_id, requested_at DESC);
CREATE INDEX idx_payouts_status ON ledger.payouts(status);
CREATE INDEX idx_payouts_platform ON ledger.payouts(platform_id, requested_at DESC);
CREATE INDEX idx_payouts_pending ON ledger.payouts(requested_at) WHERE status = 'pending';

COMMENT ON TABLE ledger.payouts IS 'Creator payout requests and processing';

-- =====================================================
-- REVENUE SHARE RULES
-- =====================================================

CREATE TABLE ledger.revshare_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Platform and tenant
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Rule name
    name VARCHAR(100) NOT NULL,

    -- Transaction type this applies to
    transaction_type VARCHAR(30) NOT NULL,

    -- Split percentages (must sum to 100)
    creator_percentage DECIMAL(5,2) NOT NULL,
    platform_percentage DECIMAL(5,2) NOT NULL,
    affiliate_percentage DECIMAL(5,2) DEFAULT 0,
    referrer_percentage DECIMAL(5,2) DEFAULT 0,

    -- Minimum amounts
    min_transaction_amount BIGINT DEFAULT 0,
    max_transaction_amount BIGINT,

    -- User type restrictions
    applicable_to_user_types TEXT[], -- ['creator', 'verified_creator', etc.]

    -- Effective dates
    effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Priority (higher = applied first)
    priority INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT revshare_percentages_valid CHECK (
        creator_percentage + platform_percentage + affiliate_percentage + referrer_percentage = 100
    )
);

CREATE INDEX idx_revshare_platform ON ledger.revshare_rules(platform_id, is_active);
CREATE INDEX idx_revshare_type ON ledger.revshare_rules(transaction_type, is_active);
CREATE INDEX idx_revshare_effective ON ledger.revshare_rules(effective_from, effective_until) WHERE is_active = TRUE;

COMMENT ON TABLE ledger.revshare_rules IS 'Platform-specific revenue sharing rules';

-- =====================================================
-- TAX SCHEMA - Restricted access
-- =====================================================

CREATE SCHEMA tax;

-- =====================================================
-- TAX FORMS
-- =====================================================

CREATE TABLE tax.tax_forms (
    form_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Form type
    form_type VARCHAR(20) NOT NULL CHECK (form_type IN ('W9', 'W8BEN', '1099-NEC', '1099-K', 'VAT')),
    tax_year INTEGER NOT NULL,

    -- Tax information (encrypted)
    ssn_encrypted TEXT, -- Social Security Number
    ein_encrypted TEXT, -- Employer Identification Number
    tax_id_encrypted TEXT, -- International tax ID

    -- Personal info (encrypted)
    legal_name_encrypted TEXT NOT NULL,
    business_name_encrypted TEXT,
    address_encrypted TEXT NOT NULL,

    -- Country and classification
    country_code VARCHAR(2) NOT NULL,
    tax_classification VARCHAR(50),

    -- Form status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),

    -- Document
    document_url TEXT, -- Signed form
    document_fingerprint VARCHAR(64) UNIQUE,

    -- Signature
    signature_data TEXT,
    signed_at TIMESTAMP,
    ip_address INET,

    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,

    -- Metadata
    metadata JSONB
);

CREATE INDEX idx_tax_forms_user ON tax.tax_forms(user_id, tax_year DESC);
CREATE INDEX idx_tax_forms_status ON tax.tax_forms(status);
CREATE INDEX idx_tax_forms_year ON tax.tax_forms(tax_year, form_type);
CREATE INDEX idx_tax_forms_pending ON tax.tax_forms(submitted_at) WHERE status = 'pending';

COMMENT ON TABLE tax.tax_forms IS 'Tax forms and compliance documents - RESTRICTED ACCESS';

-- =====================================================
-- TAX WITHHOLDING
-- =====================================================

CREATE TABLE tax.withholding (
    withholding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Withholding rates
    federal_rate DECIMAL(5,2) DEFAULT 0,
    state_rate DECIMAL(5,2) DEFAULT 0,
    foreign_rate DECIMAL(5,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 0,

    -- Country and state
    country_code VARCHAR(2) NOT NULL,
    state_code VARCHAR(10),

    -- Effective dates
    effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withholding_user ON tax.withholding(user_id, is_active);
CREATE INDEX idx_withholding_country ON tax.withholding(country_code, is_active);

COMMENT ON TABLE tax.withholding IS 'Tax withholding rates by user and jurisdiction';

-- =====================================================
-- TAX PAYMENTS
-- =====================================================

CREATE TABLE tax.tax_payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    transaction_id UUID NOT NULL,

    -- Amounts withheld (in cents)
    federal_amount BIGINT DEFAULT 0,
    state_amount BIGINT DEFAULT 0,
    foreign_amount BIGINT DEFAULT 0,
    vat_amount BIGINT DEFAULT 0,
    total_amount BIGINT GENERATED ALWAYS AS (federal_amount + state_amount + foreign_amount + vat_amount) STORED,

    -- Tax period
    tax_year INTEGER NOT NULL,
    tax_quarter INTEGER CHECK (tax_quarter BETWEEN 1 AND 4),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    withheld_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_payments_user ON tax.tax_payments(user_id, tax_year, tax_quarter);
CREATE INDEX idx_tax_payments_transaction ON tax.tax_payments(transaction_id);
CREATE INDEX idx_tax_payments_year ON tax.tax_payments(tax_year, tax_quarter);

COMMENT ON TABLE tax.tax_payments IS 'Detailed tax withholding per transaction';

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

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON ledger.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON ledger.balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revshare_rules_updated_at BEFORE UPDATE ON ledger.revshare_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transaction_number = 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.transaction_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_transaction_number_trigger BEFORE INSERT ON ledger.transactions
    FOR EACH ROW EXECUTE FUNCTION generate_transaction_number();

-- Auto-generate payout number
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payout_number = 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.payout_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_payout_number_trigger BEFORE INSERT ON ledger.payouts
    FOR EACH ROW EXECUTE FUNCTION generate_payout_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE tax.tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax.withholding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax.tax_payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tax forms
CREATE POLICY tax_forms_self_select ON tax.tax_forms
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- =====================================================
-- VIEWS
-- =====================================================

-- Account summary view
CREATE VIEW ledger.account_summary AS
SELECT
    a.account_id,
    a.user_id,
    a.account_type,
    a.platform_id,
    a.currency,
    a.status,
    b.available_balance,
    b.pending_balance,
    b.held_balance,
    b.total_balance,
    b.lifetime_earned,
    b.lifetime_spent,
    b.lifetime_withdrawn,
    b.last_transaction_at,
    b.last_payout_at
FROM ledger.accounts a
LEFT JOIN ledger.balances b ON a.account_id = b.account_id
WHERE a.status = 'active';

COMMENT ON VIEW ledger.account_summary IS 'Complete account information with balances';

-- Transaction summary view
CREATE VIEW ledger.transaction_summary AS
SELECT
    t.transaction_id,
    t.transaction_number,
    t.type,
    t.status,
    t.amount,
    t.currency,
    t.platform_fee_amount,
    t.processor_fee_amount,
    t.net_amount,
    t.payment_processor,
    t.is_escrowed,
    t.platform_id,
    t.created_at,
    t.completed_at,
    fa.user_id as from_user_id,
    ta.user_id as to_user_id
FROM ledger.transactions t
LEFT JOIN ledger.accounts fa ON t.from_account_id = fa.account_id
LEFT JOIN ledger.accounts ta ON t.to_account_id = ta.account_id;

COMMENT ON VIEW ledger.transaction_summary IS 'Transaction details with user information';

-- =====================================================
-- GRANTS
-- =====================================================

-- Ledger access
GRANT SELECT ON ALL TABLES IN SCHEMA ledger TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ledger TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ledger TO platform_app_rw;

-- Tax vault access (very restricted)
GRANT SELECT ON ALL TABLES IN SCHEMA tax TO tax_ops;
GRANT SELECT, INSERT, UPDATE ON tax.tax_forms TO tax_ops;
GRANT SELECT ON ALL TABLES IN SCHEMA tax TO legal_ops;

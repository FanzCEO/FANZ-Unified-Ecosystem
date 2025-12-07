-- =====================================================
-- FANZ DISCRETE: Discreet Payment Privacy System
-- =====================================================
-- Schema for FanzDiscreete - discreet billing and payment privacy
-- Integrates with CCBill under Grp Hldings (FANZ Group Holdings)
-- Provides anonymous prepaid cards with neutral billing descriptors
-- =====================================================

-- =====================================================
-- SCHEMA: discrete
-- Purpose: Discreet payment cards and privacy features
-- =====================================================

CREATE SCHEMA IF NOT EXISTS discrete;
COMMENT ON SCHEMA discrete IS 'FanzDiscreete payment privacy and discreet billing system';

-- =====================================================
-- CCBill Merchant Configuration
-- =====================================================

CREATE TABLE discrete.ccbill_merchants (
    merchant_id VARCHAR(50) PRIMARY KEY,
    merchant_name VARCHAR(100) NOT NULL,
    merchant_descriptor VARCHAR(100) NOT NULL, -- e.g. "GH Commerce", "GH Digital Services"
    merchant_type VARCHAR(50) NOT NULL CHECK (merchant_type IN ('gift_card', 'balance_reload', 'subscription', 'ppv')),
    ccbill_account_number VARCHAR(20) NOT NULL,
    ccbill_sub_account VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    parent_entity VARCHAR(100) DEFAULT 'Grp Hldings LLC',

    -- API credentials (encrypted)
    api_username TEXT,
    api_password TEXT,
    salt TEXT,
    flexforms_id VARCHAR(50),

    -- Regional configuration
    supported_currencies TEXT[] DEFAULT ARRAY['USD'],
    supported_countries TEXT[] DEFAULT ARRAY['US', 'CA', 'UK', 'EU'],

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_ccbill_merchants_type ON discrete.ccbill_merchants(merchant_type) WHERE is_active = TRUE;
CREATE INDEX idx_ccbill_merchants_tenant ON discrete.ccbill_merchants(tenant_id, platform_id);

COMMENT ON TABLE discrete.ccbill_merchants IS 'CCBill merchant accounts under Grp Hldings for discreet billing';
COMMENT ON COLUMN discrete.ccbill_merchants.merchant_descriptor IS 'Neutral billing descriptor shown on credit card statements';

-- =====================================================
-- FanzDiscreete Virtual Cards
-- =====================================================

CREATE TABLE discrete.discrete_cards (
    card_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Card details
    card_number VARCHAR(20) UNIQUE NOT NULL, -- Virtual card number (last 4 digits visible)
    card_display_name VARCHAR(50) DEFAULT 'FanzDiscreete Card',
    card_type VARCHAR(20) DEFAULT 'prepaid' CHECK (card_type IN ('prepaid', 'reloadable', 'gift')),

    -- Balance tracking
    balance_cents BIGINT NOT NULL DEFAULT 0,
    available_balance_cents BIGINT NOT NULL DEFAULT 0,
    pending_balance_cents BIGINT NOT NULL DEFAULT 0,
    held_balance_cents BIGINT NOT NULL DEFAULT 0,

    -- Limits
    max_balance_cents BIGINT DEFAULT 500000, -- $5,000 default limit
    daily_spend_limit_cents BIGINT DEFAULT 100000, -- $1,000 daily
    monthly_spend_limit_cents BIGINT DEFAULT 500000, -- $5,000 monthly

    -- Spending tracking (current period)
    daily_spent_cents BIGINT DEFAULT 0,
    monthly_spent_cents BIGINT DEFAULT 0,
    last_daily_reset DATE DEFAULT CURRENT_DATE,
    last_monthly_reset DATE DEFAULT CURRENT_DATE,

    -- Card status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'frozen', 'expired', 'closed')),
    activation_code VARCHAR(20),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Privacy settings
    vault_mode_enabled BOOLEAN DEFAULT FALSE, -- Hide from normal transaction view
    biometric_required BOOLEAN DEFAULT FALSE,
    pin_hash TEXT,

    -- CCBill integration
    ccbill_subscription_id VARCHAR(50), -- For recurring loads
    ccbill_token VARCHAR(100), -- Stored payment token

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_discrete_cards_user ON discrete.discrete_cards(user_id) WHERE status = 'active';
CREATE INDEX idx_discrete_cards_status ON discrete.discrete_cards(status);
CREATE INDEX idx_discrete_cards_tenant ON discrete.discrete_cards(tenant_id, platform_id);
CREATE INDEX idx_discrete_cards_vault ON discrete.discrete_cards(user_id) WHERE vault_mode_enabled = TRUE;

COMMENT ON TABLE discrete.discrete_cards IS 'FanzDiscreete virtual prepaid cards for anonymous spending';
COMMENT ON COLUMN discrete.discrete_cards.vault_mode_enabled IS 'When TRUE, transactions are hidden from normal view and require biometric/PIN access';

-- =====================================================
-- Card Load Transactions (via CCBill)
-- =====================================================

CREATE TABLE discrete.card_loads (
    load_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES discrete.discrete_cards(card_id),
    user_id UUID NOT NULL,

    -- Transaction details
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- CCBill transaction details
    ccbill_transaction_id VARCHAR(100) UNIQUE,
    ccbill_subscription_id VARCHAR(50),
    merchant_id VARCHAR(50) REFERENCES discrete.ccbill_merchants(merchant_id),
    merchant_descriptor VARCHAR(100), -- What appeared on credit card statement

    -- Payment method
    payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'debit_card', 'crypto', 'bank_transfer')),
    payment_last_four VARCHAR(4),
    payment_brand VARCHAR(20), -- Visa, MasterCard, etc.

    -- Transaction status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'chargebacked')),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,

    -- Fees
    processing_fee_cents BIGINT DEFAULT 0,
    platform_fee_cents BIGINT DEFAULT 0,
    net_amount_cents BIGINT GENERATED ALWAYS AS (amount_cents - processing_fee_cents - platform_fee_cents) STORED,

    -- Privacy audit
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_loads_card ON discrete.card_loads(card_id);
CREATE INDEX idx_card_loads_user ON discrete.card_loads(user_id);
CREATE INDEX idx_card_loads_status ON discrete.card_loads(status);
CREATE INDEX idx_card_loads_ccbill ON discrete.card_loads(ccbill_transaction_id) WHERE ccbill_transaction_id IS NOT NULL;
CREATE INDEX idx_card_loads_created ON discrete.card_loads(created_at DESC);

COMMENT ON TABLE discrete.card_loads IS 'Card funding transactions processed through CCBill';
COMMENT ON COLUMN discrete.card_loads.merchant_descriptor IS 'Actual descriptor that appeared on customer credit card statement';

-- =====================================================
-- Card Spend Transactions
-- =====================================================

CREATE TABLE discrete.card_spends (
    spend_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES discrete.discrete_cards(card_id),
    user_id UUID NOT NULL,

    -- Transaction details
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- What was purchased
    purchase_type VARCHAR(50) NOT NULL CHECK (purchase_type IN (
        'subscription', 'tip', 'ppv_photo', 'ppv_video', 'ppv_message',
        'custom_content', 'gift', 'product', 'live_stream', 'other'
    )),

    -- Related entities
    creator_id UUID,
    subscription_id UUID,
    post_id UUID,
    message_id UUID,
    product_id UUID,

    -- Transaction status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'completed', 'failed', 'refunded')),
    authorized_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Authorization hold
    authorization_code VARCHAR(50),
    hold_expires_at TIMESTAMP,

    -- Ledger integration
    ledger_transaction_id UUID, -- References ledger.transactions

    -- Privacy metadata (all spending is internal, never appears on external billing)
    is_anonymous BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_spends_card ON discrete.card_spends(card_id);
CREATE INDEX idx_card_spends_user ON discrete.card_spends(user_id);
CREATE INDEX idx_card_spends_creator ON discrete.card_spends(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_card_spends_type ON discrete.card_spends(purchase_type);
CREATE INDEX idx_card_spends_status ON discrete.card_spends(status);
CREATE INDEX idx_card_spends_created ON discrete.card_spends(created_at DESC);

COMMENT ON TABLE discrete.card_spends IS 'Internal spending transactions using FanzDiscreete cards - never appear on external billing';

-- =====================================================
-- Discreet Billing Descriptors
-- =====================================================

CREATE TABLE discrete.descriptor_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id VARCHAR(50) REFERENCES discrete.ccbill_merchants(merchant_id),

    -- Descriptor configuration
    descriptor_text VARCHAR(100) NOT NULL, -- e.g. "GH Commerce", "GH Digital Services"
    descriptor_category VARCHAR(50) NOT NULL, -- e.g. "digital_goods", "entertainment", "lifestyle"

    -- Rules
    min_amount_cents BIGINT,
    max_amount_cents BIGINT,
    applicable_transaction_types TEXT[], -- ['gift_card', 'reload']

    -- Regional
    applicable_countries TEXT[],

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,

    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_descriptor_templates_merchant ON discrete.descriptor_templates(merchant_id) WHERE is_active = TRUE;
CREATE INDEX idx_descriptor_templates_category ON discrete.descriptor_templates(descriptor_category);

COMMENT ON TABLE discrete.descriptor_templates IS 'Neutral billing descriptor templates for discreet transactions';

-- =====================================================
-- Gift Cards (FanzDiscreete Gifts)
-- =====================================================

CREATE TABLE discrete.gift_cards (
    gift_card_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Card details
    card_code VARCHAR(20) UNIQUE NOT NULL, -- Redeemable code
    card_pin VARCHAR(6), -- Optional PIN for security

    -- Value
    initial_value_cents BIGINT NOT NULL,
    remaining_value_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Purchaser (can be anonymous)
    purchased_by_user_id UUID,
    purchase_transaction_id UUID REFERENCES discrete.card_loads(load_id),

    -- Recipient
    recipient_email VARCHAR(255),
    recipient_user_id UUID,
    gift_message TEXT,

    -- Redemption
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'redeemed', 'expired', 'cancelled')),
    activated_at TIMESTAMP,
    redeemed_at TIMESTAMP,
    redeemed_by_user_id UUID,
    converted_to_card_id UUID REFERENCES discrete.discrete_cards(card_id),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 year'),

    -- CCBill transaction
    ccbill_transaction_id VARCHAR(100),
    merchant_descriptor VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gift_cards_code ON discrete.gift_cards(card_code) WHERE status NOT IN ('redeemed', 'expired', 'cancelled');
CREATE INDEX idx_gift_cards_purchaser ON discrete.gift_cards(purchased_by_user_id);
CREATE INDEX idx_gift_cards_recipient ON discrete.gift_cards(recipient_user_id);
CREATE INDEX idx_gift_cards_status ON discrete.gift_cards(status);

COMMENT ON TABLE discrete.gift_cards IS 'FanzDiscreete gift cards - prepaid balances that can be sent anonymously';

-- =====================================================
-- Privacy Vault Access Log
-- =====================================================

CREATE TABLE discrete.vault_access_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    card_id UUID REFERENCES discrete.discrete_cards(card_id),

    -- Access details
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'transaction', 'reload', 'settings')),
    access_granted BOOLEAN NOT NULL,

    -- Authentication
    auth_method VARCHAR(20) CHECK (auth_method IN ('pin', 'biometric', 'password', 'failed')),

    -- Device info
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vault_access_user ON discrete.vault_access_log(user_id);
CREATE INDEX idx_vault_access_card ON discrete.vault_access_log(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_vault_access_time ON discrete.vault_access_log(accessed_at DESC);

COMMENT ON TABLE discrete.vault_access_log IS 'Audit log for vault mode access attempts and authentication';

-- =====================================================
-- Crypto Integration (Future)
-- =====================================================

CREATE TABLE discrete.crypto_loads (
    crypto_load_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES discrete.discrete_cards(card_id),
    user_id UUID NOT NULL,

    -- Crypto details
    cryptocurrency VARCHAR(20) NOT NULL CHECK (cryptocurrency IN ('BTC', 'ETH', 'USDT', 'USDC')),
    crypto_amount DECIMAL(20, 8) NOT NULL,
    crypto_address VARCHAR(100) NOT NULL,
    blockchain_tx_hash VARCHAR(100) UNIQUE,

    -- Conversion
    usd_amount_cents BIGINT NOT NULL,
    exchange_rate DECIMAL(20, 8) NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'completed', 'failed')),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 3,

    -- CCBill gateway
    ccbill_crypto_ref VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_crypto_loads_card ON discrete.crypto_loads(card_id);
CREATE INDEX idx_crypto_loads_user ON discrete.crypto_loads(user_id);
CREATE INDEX idx_crypto_loads_status ON discrete.crypto_loads(status);
CREATE INDEX idx_crypto_loads_tx ON discrete.crypto_loads(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;

COMMENT ON TABLE discrete.crypto_loads IS 'Cryptocurrency to FanzDiscreete card loads (future feature)';

-- =====================================================
-- FUNCTIONS: Balance Management
-- =====================================================

CREATE OR REPLACE FUNCTION discrete.update_card_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update available balance when load completes
    IF TG_TABLE_NAME = 'card_loads' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE discrete.discrete_cards
        SET
            balance_cents = balance_cents + NEW.net_amount_cents,
            available_balance_cents = available_balance_cents + NEW.net_amount_cents,
            updated_at = NOW()
        WHERE card_id = NEW.card_id;
    END IF;

    -- Update balance when spend completes
    IF TG_TABLE_NAME = 'card_spends' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE discrete.discrete_cards
        SET
            balance_cents = balance_cents - NEW.amount_cents,
            available_balance_cents = available_balance_cents - NEW.amount_cents,
            daily_spent_cents = daily_spent_cents + NEW.amount_cents,
            monthly_spent_cents = monthly_spent_cents + NEW.amount_cents,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE card_id = NEW.card_id;
    END IF;

    -- Handle authorization holds
    IF TG_TABLE_NAME = 'card_spends' AND NEW.status = 'authorized' AND OLD.status = 'pending' THEN
        UPDATE discrete.discrete_cards
        SET
            available_balance_cents = available_balance_cents - NEW.amount_cents,
            held_balance_cents = held_balance_cents + NEW.amount_cents,
            updated_at = NOW()
        WHERE card_id = NEW.card_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_card_loads_update_balance
    AFTER UPDATE ON discrete.card_loads
    FOR EACH ROW
    EXECUTE FUNCTION discrete.update_card_balance();

CREATE TRIGGER trg_card_spends_update_balance
    AFTER UPDATE ON discrete.card_spends
    FOR EACH ROW
    EXECUTE FUNCTION discrete.update_card_balance();

-- =====================================================
-- FUNCTIONS: Spending Limit Reset
-- =====================================================

CREATE OR REPLACE FUNCTION discrete.reset_spending_limits()
RETURNS void AS $$
BEGIN
    -- Reset daily limits
    UPDATE discrete.discrete_cards
    SET
        daily_spent_cents = 0,
        last_daily_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_daily_reset < CURRENT_DATE;

    -- Reset monthly limits
    UPDATE discrete.discrete_cards
    SET
        monthly_spent_cents = 0,
        last_monthly_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION discrete.reset_spending_limits IS 'Reset daily and monthly spending limits - run daily via cron';

-- =====================================================
-- VIEWS: Card Dashboard
-- =====================================================

CREATE OR REPLACE VIEW discrete.v_user_cards AS
SELECT
    c.card_id,
    c.user_id,
    c.card_display_name,
    c.card_type,
    c.balance_cents,
    c.available_balance_cents,
    c.status,
    c.vault_mode_enabled,
    c.expires_at,
    c.last_used_at,
    c.daily_spend_limit_cents - c.daily_spent_cents AS daily_remaining_cents,
    c.monthly_spend_limit_cents - c.monthly_spent_cents AS monthly_remaining_cents,

    -- Recent activity
    (SELECT COUNT(*) FROM discrete.card_spends WHERE card_id = c.card_id AND created_at > NOW() - INTERVAL '30 days') AS transactions_last_30d,
    (SELECT SUM(amount_cents) FROM discrete.card_spends WHERE card_id = c.card_id AND status = 'completed' AND created_at > NOW() - INTERVAL '30 days') AS spent_last_30d_cents,

    c.created_at,
    c.platform_id
FROM discrete.discrete_cards c
WHERE c.status IN ('active', 'frozen');

COMMENT ON VIEW discrete.v_user_cards IS 'User-friendly card dashboard view';

-- =====================================================
-- GRANTS
-- =====================================================

-- Application access
GRANT USAGE ON SCHEMA discrete TO platform_app_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA discrete TO platform_app_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA discrete TO platform_app_ro;

-- Finance team access
GRANT SELECT ON ALL TABLES IN SCHEMA discrete TO analytics_ro;

-- No delete permissions on any discrete tables (audit trail)
REVOKE DELETE ON ALL TABLES IN SCHEMA discrete FROM platform_app_rw;

-- =====================================================
-- END OF FANZ DISCRETE SCHEMA
-- =====================================================

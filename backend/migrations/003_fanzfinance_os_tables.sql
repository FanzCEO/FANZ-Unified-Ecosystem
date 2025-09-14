-- FANZ Unified Ecosystem - FanzFinance OS Schema Migration
-- Version: 1.0.0
-- Created: 2024
-- Depends on: 001_initial_users_tables.sql, 002_content_management_tables.sql

-- =====================================================
-- FanzFinance OS - Core Ledger System
-- =====================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Account details
    account_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., '1000', '2000', etc.
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
        'asset', 'liability', 'equity', 'revenue', 'expense'
    )),
    account_subtype VARCHAR(100), -- e.g., 'current_asset', 'long_term_liability'
    
    -- Account hierarchy
    parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    account_level INTEGER DEFAULT 1,
    
    -- Account configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_system_account BOOLEAN DEFAULT FALSE, -- System accounts cannot be deleted
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
    
    -- Account metadata
    description TEXT,
    tax_category VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chart of accounts
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_active ON chart_of_accounts(is_active);

-- =====================================================
-- Double-Entry Ledger System
-- =====================================================

-- General Ledger Entries (Journal Entries)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entry identification
    entry_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'JE-2024-001'
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
        'payment', 'subscription', 'tip', 'withdrawal', 'fee', 'adjustment', 
        'refund', 'chargeback', 'commission', 'revenue_share'
    )),
    
    -- Entry details
    description TEXT NOT NULL,
    reference_id UUID, -- Reference to related transaction
    reference_type VARCHAR(50), -- 'transaction', 'subscription', 'withdrawal', etc.
    
    -- Financial details
    total_amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Entry status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'posted', 'reversed', 'adjusted'
    )),
    
    -- Metadata
    posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    posting_date DATE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Audit fields
    reversed_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    reversal_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entry Line Items (Double-Entry Details)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    
    -- Line details
    line_number INTEGER NOT NULL,
    description TEXT,
    
    -- Amounts (one will be null, enforcing single-sided entries)
    debit_amount DECIMAL(15,4) DEFAULT 0,
    credit_amount DECIMAL(15,4) DEFAULT 0,
    
    -- Entity tracking (which user/creator this affects)
    entity_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50), -- 'user', 'creator', 'platform'
    
    -- Additional metadata
    cost_center VARCHAR(100),
    project_id UUID, -- For future project-based accounting
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- Indexes for journal entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entity ON journal_entry_lines(entity_id, entity_type);

-- =====================================================
-- Transaction Management System
-- =====================================================

-- Main Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction identification
    transaction_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'TXN-2024-001'
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'subscription', 'tip', 'content_purchase', 'withdrawal', 'refund', 
        'commission', 'platform_fee', 'chargeback'
    )),
    
    -- Parties involved
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Transaction details
    amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    fee_amount DECIMAL(15,4) DEFAULT 0,
    net_amount DECIMAL(15,4) NOT NULL, -- amount - fee_amount
    
    -- Transaction metadata
    description TEXT,
    reference_id UUID, -- Reference to content, subscription, etc.
    reference_type VARCHAR(50), -- 'content_post', 'subscription', etc.
    
    -- Payment details
    payment_method VARCHAR(50), -- 'bank_transfer', 'crypto', 'credit_balance'
    payment_method_details JSONB DEFAULT '{}',
    external_transaction_id VARCHAR(255), -- From payment processor
    
    -- Transaction status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- Financial tracking
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_number ON transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_type, reference_id);

-- =====================================================
-- User Account Balances
-- =====================================================

-- User Wallets/Balances
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Balance details
    balance_type VARCHAR(50) NOT NULL CHECK (balance_type IN (
        'available', 'pending', 'escrow', 'earnings', 'tips', 'subscriptions'
    )),
    
    -- Amounts
    balance DECIMAL(15,4) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Balance metadata
    last_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(user_id, balance_type, currency)
);

-- Indexes for user balances
CREATE INDEX IF NOT EXISTS idx_user_balances_user ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_type ON user_balances(balance_type);

-- =====================================================
-- Subscription Management
-- =====================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN (
        'monthly', 'quarterly', 'yearly', 'lifetime'
    )),
    
    -- Plan features
    features JSONB DEFAULT '[]', -- Array of feature descriptions
    benefits JSONB DEFAULT '{}', -- Structured benefits
    
    -- Plan settings
    is_active BOOLEAN DEFAULT TRUE,
    max_subscribers INTEGER, -- NULL = unlimited
    trial_period_days INTEGER DEFAULT 0,
    
    -- Creator earnings
    creator_percentage DECIMAL(5,4) DEFAULT 0.8000, -- 80% to creator, 20% to platform
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    
    -- Subscription details
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'pending', 'active', 'cancelled', 'expired', 'suspended', 'trial'
    )),
    
    -- Billing details
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    
    -- Trial information
    trial_start DATE,
    trial_end DATE,
    is_trial BOOLEAN DEFAULT FALSE,
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Financial tracking
    total_paid DECIMAL(15,4) DEFAULT 0,
    last_payment_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(subscriber_id, creator_id, plan_id)
);

-- Subscription Payments
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Billing period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'completed', 'failed', 'refunded'
    )),
    
    -- Payment attempts
    payment_attempts INTEGER DEFAULT 0,
    next_retry_date DATE,
    
    -- Timestamps
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscription_plans_creator ON subscription_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscriber ON user_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creator ON user_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing_date ON user_subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_due_date ON subscription_payments(due_date);

-- =====================================================
-- Payout Management
-- =====================================================

-- Creator Payouts
CREATE TABLE IF NOT EXISTS creator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payout details
    payout_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'PO-2024-001'
    amount DECIMAL(15,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payout method
    payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN (
        'bank_transfer', 'paypal', 'crypto', 'check', 'store_credit'
    )),
    payout_details JSONB NOT NULL, -- Bank details, wallet address, etc.
    
    -- Payout status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    
    -- Period covered
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Financial tracking
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    external_reference VARCHAR(255), -- Reference from payment processor
    
    -- Processing details
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Failure details
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payout Line Items
CREATE TABLE IF NOT EXISTS payout_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id UUID NOT NULL REFERENCES creator_payouts(id) ON DELETE CASCADE,
    
    -- Item details
    description TEXT NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
        'subscription', 'tip', 'content_purchase', 'commission', 'bonus', 'adjustment'
    )),
    
    -- Amounts
    gross_amount DECIMAL(15,4) NOT NULL,
    fee_amount DECIMAL(15,4) DEFAULT 0,
    net_amount DECIMAL(15,4) NOT NULL,
    
    -- References
    reference_id UUID, -- Transaction or subscription ID
    reference_type VARCHAR(50),
    
    -- Timestamps
    earned_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payouts
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON creator_payouts(status);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_period ON creator_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_requested_at ON creator_payouts(requested_at);

CREATE INDEX IF NOT EXISTS idx_payout_line_items_payout ON payout_line_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_line_items_type ON payout_line_items(item_type);

-- =====================================================
-- Financial Reporting Tables
-- =====================================================

-- Platform Financial Summary (Daily Aggregates)
CREATE TABLE IF NOT EXISTS platform_financial_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Date dimension
    summary_date DATE NOT NULL,
    
    -- Revenue metrics
    gross_revenue DECIMAL(15,4) DEFAULT 0,
    net_revenue DECIMAL(15,4) DEFAULT 0, -- After fees and commissions
    platform_fees DECIMAL(15,4) DEFAULT 0,
    processing_fees DECIMAL(15,4) DEFAULT 0,
    
    -- Transaction volumes
    total_transactions INTEGER DEFAULT 0,
    subscription_revenue DECIMAL(15,4) DEFAULT 0,
    tip_revenue DECIMAL(15,4) DEFAULT 0,
    content_purchase_revenue DECIMAL(15,4) DEFAULT 0,
    
    -- Payout metrics
    total_payouts DECIMAL(15,4) DEFAULT 0,
    pending_payouts DECIMAL(15,4) DEFAULT 0,
    
    -- User metrics
    active_subscribers INTEGER DEFAULT 0,
    active_creators INTEGER DEFAULT 0,
    new_subscriptions INTEGER DEFAULT 0,
    cancelled_subscriptions INTEGER DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(summary_date, currency)
);

-- Creator Financial Summary (Daily Aggregates per Creator)
CREATE TABLE IF NOT EXISTS creator_financial_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Date dimension
    summary_date DATE NOT NULL,
    
    -- Earnings
    gross_earnings DECIMAL(15,4) DEFAULT 0,
    net_earnings DECIMAL(15,4) DEFAULT 0, -- After platform fees
    platform_fees DECIMAL(15,4) DEFAULT 0,
    
    -- Revenue breakdown
    subscription_earnings DECIMAL(15,4) DEFAULT 0,
    tip_earnings DECIMAL(15,4) DEFAULT 0,
    content_purchase_earnings DECIMAL(15,4) DEFAULT 0,
    
    -- Subscriber metrics
    total_subscribers INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    cancelled_subscribers INTEGER DEFAULT 0,
    
    -- Content metrics
    tips_received INTEGER DEFAULT 0,
    content_purchases INTEGER DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(creator_id, summary_date, currency)
);

-- Indexes for financial summaries
CREATE INDEX IF NOT EXISTS idx_platform_financial_summary_date ON platform_financial_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_creator_financial_summary_creator_date ON creator_financial_summary(creator_id, summary_date);

-- =====================================================
-- Triggers for Balance Updates
-- =====================================================

-- Function to update user balances
CREATE OR REPLACE FUNCTION update_user_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Update balances when transactions are completed
    IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- Update sender balance (subtract)
        IF NEW.sender_id IS NOT NULL THEN
            INSERT INTO user_balances (user_id, balance_type, balance, last_transaction_id, last_updated_at)
            VALUES (NEW.sender_id, 'available', -NEW.amount, NEW.id, NOW())
            ON CONFLICT (user_id, balance_type, currency)
            DO UPDATE SET 
                balance = user_balances.balance - NEW.amount,
                last_transaction_id = NEW.id,
                last_updated_at = NOW();
        END IF;
        
        -- Update recipient balance (add net amount)
        IF NEW.recipient_id IS NOT NULL THEN
            INSERT INTO user_balances (user_id, balance_type, balance, last_transaction_id, last_updated_at)
            VALUES (NEW.recipient_id, 'available', NEW.net_amount, NEW.id, NOW())
            ON CONFLICT (user_id, balance_type, currency)
            DO UPDATE SET 
                balance = user_balances.balance + NEW.net_amount,
                last_transaction_id = NEW.id,
                last_updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply balance update trigger
CREATE TRIGGER update_user_balances_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_balances();

-- Apply updated_at triggers to financial tables
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Chart of Accounts Setup
-- =====================================================

-- Insert standard chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, is_system_account, description) VALUES
-- Assets
('1000', 'Cash and Bank', 'asset', 'debit', true, 'Platform cash and bank accounts'),
('1100', 'User Balances', 'asset', 'debit', true, 'Total user balances held by platform'),
('1200', 'Accounts Receivable', 'asset', 'debit', true, 'Amounts owed to platform'),
('1300', 'Pending Transactions', 'asset', 'debit', true, 'Transactions in processing'),

-- Liabilities
('2000', 'Accounts Payable', 'liability', 'credit', true, 'Platform obligations'),
('2100', 'User Deposits', 'liability', 'credit', true, 'User funds held by platform'),
('2200', 'Creator Payouts Payable', 'liability', 'credit', true, 'Amounts owed to creators'),
('2300', 'Subscription Liability', 'liability', 'credit', true, 'Prepaid subscription obligations'),

-- Revenue
('4000', 'Platform Fees', 'revenue', 'credit', true, 'Platform commission revenue'),
('4100', 'Processing Fees', 'revenue', 'credit', true, 'Payment processing fee revenue'),
('4200', 'Subscription Revenue', 'revenue', 'credit', true, 'Platform share of subscriptions'),
('4300', 'Transaction Fees', 'revenue', 'credit', true, 'Transaction-based fee revenue'),

-- Expenses
('5000', 'Payment Processing Costs', 'expense', 'debit', true, 'Costs paid to payment processors'),
('5100', 'Creator Payouts', 'expense', 'debit', true, 'Payments made to creators'),
('5200', 'Refunds and Chargebacks', 'expense', 'debit', true, 'Customer refunds and chargebacks'),
('5300', 'Operating Expenses', 'expense', 'debit', true, 'General platform operating expenses')

ON CONFLICT (account_code) DO NOTHING;

-- =====================================================
-- Views for Financial Reporting
-- =====================================================

-- Account Balances View (Trial Balance)
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.normal_balance,
    COALESCE(SUM(jel.debit_amount), 0) as total_debits,
    COALESCE(SUM(jel.credit_amount), 0) as total_credits,
    CASE 
        WHEN coa.normal_balance = 'debit' THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
        ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END as account_balance
FROM chart_of_accounts coa
LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.status = 'posted' AND coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
ORDER BY coa.account_code;

-- Active Subscriptions View
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    us.*,
    u.username as subscriber_username,
    up.display_name as subscriber_name,
    c.username as creator_username,
    cp.display_name as creator_name,
    sp.name as plan_name,
    sp.price as plan_price,
    sp.billing_cycle
FROM user_subscriptions us
JOIN users u ON us.subscriber_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
JOIN users c ON us.creator_id = c.id
LEFT JOIN user_profiles cp ON c.id = cp.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active';

-- =====================================================
-- Performance Optimization
-- =====================================================

-- Analyze financial tables
ANALYZE chart_of_accounts, journal_entries, journal_entry_lines, transactions, 
        user_balances, subscription_plans, user_subscriptions, creator_payouts;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE chart_of_accounts IS 'Chart of accounts for double-entry bookkeeping';
COMMENT ON TABLE journal_entries IS 'Journal entries for all financial transactions';
COMMENT ON TABLE journal_entry_lines IS 'Individual line items for journal entries (double-entry details)';
COMMENT ON TABLE transactions IS 'High-level transaction records for payments, tips, subscriptions';
COMMENT ON TABLE user_balances IS 'Real-time user balance tracking';
COMMENT ON TABLE subscription_plans IS 'Creator subscription plan definitions';
COMMENT ON TABLE user_subscriptions IS 'Active and historical user subscriptions';
COMMENT ON TABLE creator_payouts IS 'Creator payout processing and tracking';

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'FANZ Unified Ecosystem - FanzFinance OS schema migration completed successfully';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Features: Double-entry ledger, transaction processing, subscription management, creator payouts';
    RAISE NOTICE 'Tables created: chart_of_accounts, journal_entries, transactions, user_balances, subscriptions, payouts';
    RAISE NOTICE 'Financial reporting views and triggers implemented';
    RAISE NOTICE 'Standard chart of accounts loaded';
END $$;
-- FanzFinance OS - Database Initialization Script
-- This script sets up the complete database schema for the payment system

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database schema
CREATE SCHEMA IF NOT EXISTS fanzfinance;

-- Set search path
SET search_path = fanzfinance, public;

-- =====================================================
-- Chart of Accounts (Double-Entry Bookkeeping)
-- =====================================================
CREATE TABLE chart_of_accounts (
    account_code VARCHAR(10) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_account VARCHAR(10) REFERENCES chart_of_accounts(account_code),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
-- Assets
('1000', 'Assets', 'asset'),
('1100', 'Cash and Cash Equivalents', 'asset'),
('1101', 'Platform Cash Account', 'asset'),
('1102', 'User Wallet Balances', 'asset'),
('1103', 'Escrow Account', 'asset'),
('1200', 'Accounts Receivable', 'asset'),
('1201', 'Payment Processor Receivables', 'asset'),

-- Liabilities  
('2000', 'Liabilities', 'liability'),
('2100', 'Accounts Payable', 'liability'),
('2200', 'Creator Earnings Payable', 'liability'),
('2201', 'User Credit Balances', 'liability'),
('2202', 'Pending Payouts', 'liability'),

-- Equity
('3000', 'Equity', 'equity'),
('3100', 'Retained Earnings', 'equity'),
('3200', 'Platform Reserves', 'equity'),

-- Revenue
('4000', 'Revenue', 'revenue'),
('4100', 'Platform Fee Revenue', 'revenue'),
('4101', 'Subscription Fee Revenue', 'revenue'),
('4102', 'Tip Fee Revenue', 'revenue'),
('4103', 'Content Purchase Fee Revenue', 'revenue'),

-- Expenses
('5000', 'Expenses', 'expense'),
('5100', 'Processing Fees', 'expense'),
('5200', 'Refunds and Chargebacks', 'expense'),
('5300', 'Operating Expenses', 'expense');

-- =====================================================
-- Journal Entries (Double-Entry Ledger)
-- =====================================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number SERIAL UNIQUE,
    transaction_id UUID REFERENCES transactions(id),
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    total_amount DECIMAL(15,2) NOT NULL,
    created_by UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'reversed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    posted_at TIMESTAMP WITH TIME ZONE,
    reversed_at TIMESTAMP WITH TIME ZONE
);

-- Journal entry line items
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id),
    account_code VARCHAR(10) NOT NULL REFERENCES chart_of_accounts(account_code),
    debit_amount DECIMAL(15,2) DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount DECIMAL(15,2) DEFAULT 0 CHECK (credit_amount >= 0),
    description TEXT,
    entity_id UUID, -- User ID or other entity reference
    entity_type VARCHAR(50), -- 'user', 'creator', 'platform', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0))
);

-- =====================================================
-- User Balances (Multi-currency support)
-- =====================================================
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    balance_type VARCHAR(20) NOT NULL CHECK (balance_type IN ('available', 'pending', 'escrow', 'earnings')),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    last_transaction_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, balance_type, currency)
);

-- Balance change history for audit trail
CREATE TABLE user_balance_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    balance_type VARCHAR(20) NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('credit', 'debit', 'deposit', 'withdrawal', 'transfer')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    previous_balance DECIMAL(15,2) NOT NULL,
    new_balance DECIMAL(15,2) NOT NULL,
    transaction_id UUID,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Transactions
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'subscription', 'tip', 'content_purchase', 'withdrawal', 
        'refund', 'commission', 'platform_fee', 'chargeback'
    )),
    sender_id UUID,
    recipient_id UUID,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    fee_amount DECIMAL(15,2) DEFAULT 0 CHECK (fee_amount >= 0),
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    payment_method VARCHAR(50),
    payment_method_details JSONB,
    processor_transaction_id VARCHAR(255),
    processor_response JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CHECK (
        (transaction_type IN ('tip', 'content_purchase', 'subscription') AND sender_id IS NOT NULL AND recipient_id IS NOT NULL) OR
        (transaction_type IN ('withdrawal', 'refund') AND sender_id IS NOT NULL) OR
        (transaction_type IN ('platform_fee', 'commission'))
    )
);

-- =====================================================
-- Subscription Plans
-- =====================================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    features JSONB,
    benefits JSONB,
    trial_period_days INTEGER DEFAULT 0 CHECK (trial_period_days >= 0),
    max_subscribers INTEGER CHECK (max_subscribers > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- User Subscriptions
-- =====================================================
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'suspended')),
    is_trial BOOLEAN DEFAULT false,
    payment_method VARCHAR(50),
    payment_method_details JSONB,
    
    -- Billing information
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate subscriptions
    UNIQUE(subscriber_id, creator_id, plan_id)
);

-- =====================================================
-- Payouts
-- =====================================================
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal', 'crypto', 'check', 'store_credit')),
    payout_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Period information
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Processing information
    processor_payout_id VARCHAR(255),
    processor_response JSONB,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount - COALESCE(processing_fee, 0)) STORED,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Audit Logs
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID,
    actor_type VARCHAR(50) DEFAULT 'user',
    changes JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Transactions
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_recipient_id ON transactions(recipient_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

-- User Balances
CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX idx_user_balances_type ON user_balances(balance_type);
CREATE INDEX idx_user_balance_changes_user_id ON user_balance_changes(user_id);
CREATE INDEX idx_user_balance_changes_created_at ON user_balance_changes(created_at);

-- Subscriptions
CREATE INDEX idx_subscription_plans_creator_id ON subscription_plans(creator_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_user_subscriptions_subscriber_id ON user_subscriptions(subscriber_id);
CREATE INDEX idx_user_subscriptions_creator_id ON user_subscriptions(creator_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Payouts
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created_at ON payouts(created_at);

-- Journal Entries
CREATE INDEX idx_journal_entries_transaction_id ON journal_entries(transaction_id);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_journal_entry_lines_journal_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_code);

-- Audit Logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- Views for Financial Reporting
-- =====================================================

-- Account Balances View (Trial Balance)
CREATE VIEW account_balances AS
SELECT 
    a.account_code,
    a.account_name,
    a.account_type,
    COALESCE(SUM(jel.debit_amount), 0) as total_debits,
    COALESCE(SUM(jel.credit_amount), 0) as total_credits,
    CASE 
        WHEN a.account_type IN ('asset', 'expense') THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
        ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END as balance
FROM chart_of_accounts a
LEFT JOIN journal_entry_lines jel ON a.account_code = jel.account_code
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE a.is_active = true 
  AND (je.status = 'posted' OR je.status IS NULL)
GROUP BY a.account_code, a.account_name, a.account_type
ORDER BY a.account_code;

-- Transaction Summary View
CREATE VIEW transaction_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as transaction_date,
    transaction_type,
    currency,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    SUM(fee_amount) as total_fees,
    SUM(net_amount) as total_net_amount,
    AVG(amount) as avg_amount
FROM transactions
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at), transaction_type, currency
ORDER BY transaction_date DESC, transaction_type;

-- Creator Earnings View
CREATE VIEW creator_earnings AS
SELECT 
    recipient_id as creator_id,
    currency,
    COUNT(*) as transaction_count,
    SUM(net_amount) as total_earnings,
    SUM(fee_amount) as total_fees_paid,
    SUM(amount) as gross_amount,
    AVG(net_amount) as avg_earning_per_transaction,
    MIN(created_at) as first_earning,
    MAX(created_at) as last_earning
FROM transactions
WHERE recipient_id IS NOT NULL 
  AND status = 'completed'
  AND transaction_type IN ('subscription', 'tip', 'content_purchase')
GROUP BY recipient_id, currency;

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create journal entries for transactions
CREATE OR REPLACE FUNCTION create_transaction_journal_entry(
    p_transaction_id UUID,
    p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    transaction_record RECORD;
    journal_entry_id UUID;
    entry_description TEXT;
BEGIN
    -- Get transaction details
    SELECT * INTO transaction_record FROM transactions WHERE id = p_transaction_id;
    
    IF transaction_record IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;
    
    -- Set description
    entry_description := COALESCE(p_description, transaction_record.description, 
        transaction_record.transaction_type || ' transaction');
    
    -- Create journal entry
    INSERT INTO journal_entries (
        transaction_id, 
        description, 
        total_amount, 
        created_by, 
        status
    ) VALUES (
        p_transaction_id,
        entry_description,
        transaction_record.amount,
        COALESCE(transaction_record.sender_id, transaction_record.recipient_id),
        'posted'
    ) RETURNING id INTO journal_entry_id;
    
    -- Create journal entry lines based on transaction type
    -- This is a simplified version - would be expanded based on business rules
    
    IF transaction_record.transaction_type = 'tip' THEN
        -- Debit: User wallet balance decreases
        INSERT INTO journal_entry_lines (
            journal_entry_id, account_code, debit_amount, description, entity_id, entity_type
        ) VALUES (
            journal_entry_id, '1100', transaction_record.amount, 
            'Tip payment', transaction_record.sender_id, 'user'
        );
        
        -- Credit: Creator earnings increase  
        INSERT INTO journal_entry_lines (
            journal_entry_id, account_code, credit_amount, description, entity_id, entity_type
        ) VALUES (
            journal_entry_id, '2200', transaction_record.net_amount,
            'Tip received', transaction_record.recipient_id, 'creator'
        );
        
        -- Credit: Platform fee revenue
        IF transaction_record.fee_amount > 0 THEN
            INSERT INTO journal_entry_lines (
                journal_entry_id, account_code, credit_amount, description, entity_id, entity_type
            ) VALUES (
                journal_entry_id, '4102', transaction_record.fee_amount,
                'Tip fee revenue', NULL, 'platform'
            );
        END IF;
    END IF;
    
    RETURN journal_entry_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initial Data Setup
-- =====================================================

-- Create default platform balances if needed
INSERT INTO user_balances (user_id, balance_type, balance, currency) 
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    unnest(ARRAY['available', 'pending', 'escrow', 'earnings']) as balance_type,
    0.00 as balance,
    'USD' as currency
ON CONFLICT DO NOTHING;

-- Log successful initialization
INSERT INTO audit_logs (entity_type, entity_id, action, actor_type, metadata)
VALUES (
    'system',
    uuid_generate_v4(),
    'database_initialized',
    'system',
    jsonb_build_object(
        'version', '1.0.0',
        'timestamp', NOW(),
        'components', ARRAY['chart_of_accounts', 'transactions', 'subscriptions', 'payouts', 'journal_entries']
    )
);

-- Grant permissions (adjust as needed for your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA fanzfinance TO fanz_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA fanzfinance TO fanz_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA fanzfinance TO fanz_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'FanzFinance OS database initialized successfully!';
    RAISE NOTICE 'Schema: fanzfinance';
    RAISE NOTICE 'Tables created: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'fanzfinance'
    );
    RAISE NOTICE 'Views created: %', (
        SELECT COUNT(*) 
        FROM information_schema.views 
        WHERE table_schema = 'fanzfinance'
    );
END $$;
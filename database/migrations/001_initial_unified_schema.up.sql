-- 🚀 FANZ Unified Ecosystem - Initial Migration
-- Version: 001
-- Description: Create unified schema for all platform clusters and specialized systems
-- Date: December 2024

BEGIN;

-- =============================================================================
-- EXTENSIONS AND TYPES
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Custom types
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'pending_verification', 'deleted');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'banned');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'private', 'scheduled', 'archived', 'deleted');
CREATE TYPE platform_cluster AS ENUM ('fanzlab', 'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock');
CREATE TYPE transaction_type AS ENUM ('tip', 'subscription', 'ppv', 'merchandise', 'nft', 'withdrawal', 'refund', 'chargeback', 'fee');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed');
CREATE TYPE payment_method AS ENUM ('ccbill', 'segpay', 'epoch', 'verotel', 'paxum', 'crypto_btc', 'crypto_eth', 'crypto_usdt', 'bank_transfer', 'wise', 'dwolla');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document', 'live_stream');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged', 'reviewing');
CREATE TYPE subscription_type AS ENUM ('monthly', 'quarterly', 'yearly', 'lifetime', 'custom');

-- =============================================================================
-- CORE USER MANAGEMENT
-- =============================================================================

-- Unified users table for all platform clusters
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    birth_date DATE,
    status user_status DEFAULT 'active',
    primary_cluster platform_cluster DEFAULT 'fanzlab',
    is_creator BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'unverified',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    phone_number VARCHAR(20),
    phone_verified_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    country_code CHAR(2),
    city VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- User profiles per platform cluster
CREATE TABLE user_cluster_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster platform_cluster NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    theme_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cluster)
);

-- User authentication sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE user_2fa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT[],
    enabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CREATOR MANAGEMENT
-- =============================================================================

-- Creator profiles
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status creator_status DEFAULT 'pending',
    verification_status verification_status DEFAULT 'unverified',
    subscription_price_monthly DECIMAL(10,2) DEFAULT 0,
    subscription_price_quarterly DECIMAL(10,2),
    subscription_price_yearly DECIMAL(10,2),
    subscription_price_lifetime DECIMAL(10,2),
    tips_enabled BOOLEAN DEFAULT TRUE,
    ppv_enabled BOOLEAN DEFAULT TRUE,
    merchandise_enabled BOOLEAN DEFAULT FALSE,
    live_streaming_enabled BOOLEAN DEFAULT FALSE,
    earnings_total DECIMAL(15,2) DEFAULT 0,
    earnings_this_month DECIMAL(15,2) DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    tip_count INTEGER DEFAULT 0,
    social_links JSONB DEFAULT '{}',
    bank_details_encrypted TEXT,
    tax_info_encrypted TEXT,
    payout_method payment_method DEFAULT 'paxum',
    payout_schedule VARCHAR(20) DEFAULT 'weekly',
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator verification documents
CREATE TABLE creator_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    status verification_status DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Creator earnings and analytics
CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    cluster platform_cluster NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    subscriber_churn INTEGER DEFAULT 0,
    tips_received DECIMAL(10,2) DEFAULT 0,
    subscription_revenue DECIMAL(10,2) DEFAULT 0,
    ppv_revenue DECIMAL(10,2) DEFAULT 0,
    merchandise_revenue DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, date, cluster)
);

-- =============================================================================
-- FANZFINANCE OS - FINANCIAL SYSTEM
-- =============================================================================

-- Chart of accounts for double-entry bookkeeping
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries for double-entry accounting
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_id UUID,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    total_amount DECIMAL(15,2) NOT NULL,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    reversed_entry_id UUID REFERENCES journal_entries(id),
    is_reversed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entry line items
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time account balances
CREATE TABLE account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    balance_date DATE NOT NULL,
    debit_balance DECIMAL(15,2) DEFAULT 0,
    credit_balance DECIMAL(15,2) DEFAULT 0,
    net_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, balance_date)
);

-- Business transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    creator_id UUID REFERENCES creators(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    platform_fee DECIMAL(15,2) DEFAULT 0,
    processor_fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method payment_method NOT NULL,
    processor_transaction_id VARCHAR(100),
    status transaction_status DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User account balances
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_balance DECIMAL(15,2) DEFAULT 0,
    pending_balance DECIMAL(15,2) DEFAULT 0,
    total_earned DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    total_withdrawn DECIMAL(15,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator payouts
CREATE TABLE creator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id),
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    payout_method payment_method NOT NULL,
    processor_payout_id VARCHAR(100),
    status payout_status DEFAULT 'pending',
    processing_fee DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    payout_details_encrypted TEXT,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- BASIC INDEXES
-- =============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_cluster ON users(primary_cluster);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Creator indexes
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_verification ON creators(verification_status);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Financial indexes
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_account_balances_account_date ON account_balances(account_id, balance_date);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to core tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_payouts_updated_at BEFORE UPDATE ON creator_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
-- Assets
('1000', 'Cash and Cash Equivalents', 'asset', 'Operating cash accounts'),
('1100', 'User Balances', 'asset', 'Pending user withdrawals'),
('1200', 'Accounts Receivable', 'asset', 'Money owed by payment processors'),
-- Liabilities
('2000', 'Accounts Payable', 'liability', 'Money owed to creators and vendors'),
('2100', 'Creator Payables', 'liability', 'Pending creator payouts'),
('2200', 'Tax Liabilities', 'liability', 'Taxes owed to authorities'),
-- Equity
('3000', 'Retained Earnings', 'equity', 'Accumulated profits'),
-- Revenue
('4000', 'Platform Fees', 'revenue', 'Commission from transactions'),
('4100', 'Subscription Revenue', 'revenue', 'Platform subscription fees'),
('4200', 'Transaction Fees', 'revenue', 'Payment processing markups'),
-- Expenses
('5000', 'Payment Processing Fees', 'expense', 'Costs paid to payment processors'),
('5100', 'Operational Expenses', 'expense', 'Platform operational costs'),
('5200', 'Marketing Expenses', 'expense', 'User acquisition costs');

COMMIT;
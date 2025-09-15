-- 🚀 FANZ Unified Ecosystem - Rollback Initial Schema
-- Version: 001 DOWN
-- Description: Remove unified schema for all platform clusters and specialized systems
-- Date: December 2024

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS update_creator_payouts_updated_at ON creator_payouts;
DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_account_balances_account_date;
DROP INDEX IF EXISTS idx_journal_entry_lines_account;
DROP INDEX IF EXISTS idx_journal_entries_date;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_creator_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_creators_verification;
DROP INDEX IF EXISTS idx_creators_status;
DROP INDEX IF EXISTS idx_creators_user_id;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_cluster;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS creator_payouts;
DROP TABLE IF EXISTS user_balances;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS account_balances;
DROP TABLE IF EXISTS journal_entry_lines;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS chart_of_accounts;
DROP TABLE IF EXISTS creator_analytics;
DROP TABLE IF EXISTS creator_verification;
DROP TABLE IF EXISTS creators;
DROP TABLE IF EXISTS user_2fa;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_cluster_profiles;
DROP TABLE IF EXISTS users;

-- Drop custom types
DROP TYPE IF EXISTS subscription_type;
DROP TYPE IF EXISTS moderation_status;
DROP TYPE IF EXISTS media_type;
DROP TYPE IF EXISTS payout_status;
DROP TYPE IF EXISTS payment_method;
DROP TYPE IF EXISTS transaction_status;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS platform_cluster;
DROP TYPE IF EXISTS content_status;
DROP TYPE IF EXISTS verification_status;
DROP TYPE IF EXISTS creator_status;
DROP TYPE IF EXISTS user_status;

COMMIT;
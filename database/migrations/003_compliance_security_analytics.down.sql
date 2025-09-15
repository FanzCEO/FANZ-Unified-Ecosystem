-- 🚀 FANZ Unified Ecosystem - Rollback Compliance, Security & Analytics
-- Version: 003 DOWN
-- Description: Remove compliance, moderation, security, notifications, and analytics tables
-- Date: December 2024

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS platform_revenue_summary;
DROP VIEW IF EXISTS creator_earnings_summary;

-- Drop triggers
DROP TRIGGER IF EXISTS transaction_balance_update ON transactions;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
DROP TRIGGER IF EXISTS update_age_verification_updated_at ON age_verification;
DROP TRIGGER IF EXISTS update_compliance_2257_records_updated_at ON compliance_2257_records;
DROP TRIGGER IF EXISTS update_moderation_reports_updated_at ON moderation_reports;

-- Drop functions
DROP FUNCTION IF EXISTS update_user_balance_after_transaction();

-- Drop indexes
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_security_events_severity;
DROP INDEX IF EXISTS idx_security_events_created_at;
DROP INDEX IF EXISTS idx_security_events_user_id;
DROP INDEX IF EXISTS idx_audit_log_created_at;
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP INDEX IF EXISTS idx_user_activity_user_created;
DROP INDEX IF EXISTS idx_platform_analytics_date_cluster;
DROP INDEX IF EXISTS idx_creator_analytics_creator_date;
DROP INDEX IF EXISTS idx_age_verification_status;
DROP INDEX IF EXISTS idx_age_verification_user_id;
DROP INDEX IF EXISTS idx_compliance_2257_creator_id;
DROP INDEX IF EXISTS idx_moderation_reports_status;
DROP INDEX IF EXISTS idx_moderation_reports_content_type_id;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS platform_analytics;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS age_verification;
DROP TABLE IF EXISTS compliance_2257_records;
DROP TABLE IF EXISTS moderation_reports;

COMMIT;
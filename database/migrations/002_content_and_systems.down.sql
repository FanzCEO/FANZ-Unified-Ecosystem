-- 🚀 FANZ Unified Ecosystem - Rollback Content and Specialized Systems
-- Version: 002 DOWN
-- Description: Remove content management, specialized systems, and monetization tables
-- Date: December 2024

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS update_live_streams_updated_at ON live_streams;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_bio_links_updated_at ON bio_links;
DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
DROP TRIGGER IF EXISTS update_content_posts_updated_at ON content_posts;

-- Drop indexes
DROP INDEX IF EXISTS idx_live_streams_creator_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_conversations_creator_user;
DROP INDEX IF EXISTS idx_bio_links_creator_id;
DROP INDEX IF EXISTS idx_crm_contacts_creator_id;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_user_subscriptions_creator_id;
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_content_comments_post_id;
DROP INDEX IF EXISTS idx_content_interactions_user_id;
DROP INDEX IF EXISTS idx_content_interactions_post_id;
DROP INDEX IF EXISTS idx_content_media_post_id;
DROP INDEX IF EXISTS idx_content_posts_tags;
DROP INDEX IF EXISTS idx_content_posts_published_at;
DROP INDEX IF EXISTS idx_content_posts_status;
DROP INDEX IF EXISTS idx_content_posts_cluster;
DROP INDEX IF EXISTS idx_content_posts_creator_id;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS stream_viewers;
DROP TABLE IF EXISTS live_streams;
DROP TABLE IF EXISTS media_processing_jobs;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS bio_links;
DROP TABLE IF EXISTS crm_contacts;
DROP TABLE IF EXISTS tips;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS content_comments;
DROP TABLE IF EXISTS content_interactions;
DROP TABLE IF EXISTS content_media;
DROP TABLE IF EXISTS content_posts;

COMMIT;
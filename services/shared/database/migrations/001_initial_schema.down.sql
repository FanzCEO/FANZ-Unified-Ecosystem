-- Drop all tables in reverse order of dependencies

DROP TABLE IF EXISTS affiliate_commissions CASCADE;
DROP TABLE IF EXISTS revenue_shares CASCADE;
DROP TABLE IF EXISTS chargebacks CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

DROP TABLE IF EXISTS creator_schedules CASCADE;
DROP TABLE IF EXISTS creator_analytics CASCADE;
DROP TABLE IF EXISTS creator_tax_info CASCADE;
DROP TABLE IF EXISTS creator_payment_methods CASCADE;
DROP TABLE IF EXISTS creator_watermarks CASCADE;
DROP TABLE IF EXISTS creator_highlights CASCADE;
DROP TABLE IF EXISTS creator_vaults CASCADE;

DROP TABLE IF EXISTS uploaded_documents CASCADE;
DROP TABLE IF EXISTS verify_my_verifications CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS costar_invitations CASCADE;
DROP TABLE IF EXISTS costar_verifications CASCADE;
DROP TABLE IF EXISTS compliance_records CASCADE;

DROP TABLE IF EXISTS algorithm_preferences CASCADE;
DROP TABLE IF EXISTS short_video_views CASCADE;
DROP TABLE IF EXISTS short_video_reactions CASCADE;
DROP TABLE IF EXISTS short_video_hashtags CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;
DROP TABLE IF EXISTS video_effects CASCADE;
DROP TABLE IF EXISTS short_videos CASCADE;

DROP TABLE IF EXISTS ppv_unlocks CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS auth_providers CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums
DROP TYPE IF EXISTS notification_type;
DROP TYPE IF EXISTS hashtag_category;
DROP TYPE IF EXISTS reaction_type;
DROP TYPE IF EXISTS video_effect_type;
DROP TYPE IF EXISTS content_classification;
DROP TYPE IF EXISTS moderation_status;
DROP TYPE IF EXISTS compliance_status;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS post_type;
DROP TYPE IF EXISTS creator_status;
DROP TYPE IF EXISTS auth_provider;
DROP TYPE IF EXISTS user_role;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";

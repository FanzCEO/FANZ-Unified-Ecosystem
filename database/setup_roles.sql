-- =====================================================
-- FANZ Unified Ecosystem - Database Roles Setup
-- =====================================================
-- This script creates all database roles and grants permissions
--
-- Usage:
--   psql fanz_ecosystem -f setup_roles.sql
-- =====================================================

\set ON_ERROR_STOP on

\echo ''
\echo '========================================='
\echo '  FANZ Database Roles Setup'
\echo '========================================='
\echo ''

-- =====================================================
-- Application Roles
-- =====================================================

\echo 'Creating application roles...'

-- Read-only application access
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'platform_app_ro') THEN
        CREATE ROLE platform_app_ro;
        RAISE NOTICE '  ✓ Created role: platform_app_ro';
    ELSE
        RAISE NOTICE '  → Role already exists: platform_app_ro';
    END IF;
END $$;

-- Read-write application access
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'platform_app_rw') THEN
        CREATE ROLE platform_app_rw;
        RAISE NOTICE '  ✓ Created role: platform_app_rw';
    ELSE
        RAISE NOTICE '  → Role already exists: platform_app_rw';
    END IF;
END $$;

\echo ''

-- =====================================================
-- Analytics Roles
-- =====================================================

\echo 'Creating analytics roles...'

-- Analytics read-only
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analytics_ro') THEN
        CREATE ROLE analytics_ro;
        RAISE NOTICE '  ✓ Created role: analytics_ro';
    ELSE
        RAISE NOTICE '  → Role already exists: analytics_ro';
    END IF;
END $$;

-- Analytics read-write
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analytics_rw') THEN
        CREATE ROLE analytics_rw;
        RAISE NOTICE '  ✓ Created role: analytics_rw';
    ELSE
        RAISE NOTICE '  → Role already exists: analytics_rw';
    END IF;
END $$;

\echo ''

-- =====================================================
-- Restricted Access Roles
-- =====================================================

\echo 'Creating restricted access roles...'

-- Legal operations (DMCA, claims)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'legal_ops') THEN
        CREATE ROLE legal_ops;
        RAISE NOTICE '  ✓ Created role: legal_ops';
    ELSE
        RAISE NOTICE '  → Role already exists: legal_ops';
    END IF;
END $$;

-- KYC operations (identity verification)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kyc_ops') THEN
        CREATE ROLE kyc_ops;
        RAISE NOTICE '  ✓ Created role: kyc_ops';
    ELSE
        RAISE NOTICE '  → Role already exists: kyc_ops';
    END IF;
END $$;

-- Tax operations (tax forms)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tax_ops') THEN
        CREATE ROLE tax_ops;
        RAISE NOTICE '  ✓ Created role: tax_ops';
    ELSE
        RAISE NOTICE '  → Role already exists: tax_ops';
    END IF;
END $$;

-- Moderation operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moderator_ro') THEN
        CREATE ROLE moderator_ro;
        RAISE NOTICE '  ✓ Created role: moderator_ro';
    ELSE
        RAISE NOTICE '  → Role already exists: moderator_ro';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moderator_rw') THEN
        CREATE ROLE moderator_rw;
        RAISE NOTICE '  ✓ Created role: moderator_rw';
    ELSE
        RAISE NOTICE '  → Role already exists: moderator_rw';
    END IF;
END $$;

-- Compliance operations (GDPR)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'compliance_ro') THEN
        CREATE ROLE compliance_ro;
        RAISE NOTICE '  ✓ Created role: compliance_ro';
    ELSE
        RAISE NOTICE '  → Role already exists: compliance_ro';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'compliance_rw') THEN
        CREATE ROLE compliance_rw;
        RAISE NOTICE '  ✓ Created role: compliance_rw';
    ELSE
        RAISE NOTICE '  → Role already exists: compliance_rw';
    END IF;
END $$;

-- Security operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'security_ops') THEN
        CREATE ROLE security_ops;
        RAISE NOTICE '  ✓ Created role: security_ops';
    ELSE
        RAISE NOTICE '  → Role already exists: security_ops';
    END IF;
END $$;

-- Secrets reader (encrypted config)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'secrets_reader') THEN
        CREATE ROLE secrets_reader;
        RAISE NOTICE '  ✓ Created role: secrets_reader';
    ELSE
        RAISE NOTICE '  → Role already exists: secrets_reader';
    END IF;
END $$;

\echo ''

-- =====================================================
-- Grant Permissions
-- =====================================================

\echo 'Granting permissions to roles...'

-- Schema usage permissions
GRANT USAGE ON SCHEMA public, ledger, catalog, rights, moderation, creators, fans, campaigns, events,
    registry, features, routing, config, rankings, recommendations, search, posts, threads, rooms, messages,
    products, orders, affiliates, dmca, takedowns, legal_claims, prompts, embeddings, ai_recommendations,
    revenue, content_analytics, user_analytics, funnels, audit, gdpr
TO platform_app_ro, platform_app_rw;

\echo '  ✓ Granted schema usage to application roles'

-- Platform app read-only permissions (already granted in schemas)
-- Platform app read-write permissions (already granted in schemas)

-- Analytics permissions
GRANT USAGE ON SCHEMA events, revenue, content_analytics, user_analytics, funnels TO analytics_ro, analytics_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA events, revenue, content_analytics, user_analytics, funnels TO analytics_ro;

\echo '  ✓ Granted analytics permissions'

-- Future table permissions (automatically grant to new tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public, ledger, catalog, rights, creators, fans, campaigns, events,
    registry, features, routing, config, rankings, recommendations, search, posts, threads, rooms, messages,
    products, orders, affiliates
GRANT SELECT ON TABLES TO platform_app_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA public, ledger, catalog, rights, creators, fans, campaigns, events,
    registry, features, routing, config, rankings, recommendations, search, posts, threads, rooms, messages,
    products, orders, affiliates
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO platform_app_rw;

\echo '  ✓ Set default privileges for future tables'

-- Sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, ledger, catalog, rights, creators, fans, campaigns, events,
    registry, features, routing, config, rankings, recommendations, search, posts, threads, rooms, messages,
    products, orders, affiliates, prompts, embeddings, ai_recommendations, revenue, content_analytics,
    user_analytics, funnels, audit, gdpr
TO platform_app_rw;

\echo '  ✓ Granted sequence permissions'

\echo ''

-- =====================================================
-- Create Service Users
-- =====================================================

\echo 'Creating service users...'

-- FanzSSO service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'svc_fanzsso') THEN
        CREATE USER svc_fanzsso WITH PASSWORD 'CHANGE_ME_FANZSSO';
        GRANT platform_app_rw TO svc_fanzsso;
        RAISE NOTICE '  ✓ Created service user: svc_fanzsso';
    ELSE
        RAISE NOTICE '  → Service user already exists: svc_fanzsso';
    END IF;
END $$;

-- FanzMoney service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'svc_fanzmoney') THEN
        CREATE USER svc_fanzmoney WITH PASSWORD 'CHANGE_ME_FANZMONEY';
        GRANT platform_app_rw TO svc_fanzmoney;
        RAISE NOTICE '  ✓ Created service user: svc_fanzmoney';
    ELSE
        RAISE NOTICE '  → Service user already exists: svc_fanzmoney';
    END IF;
END $$;

-- FanzMedia service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'svc_fanzmedia') THEN
        CREATE USER svc_fanzmedia WITH PASSWORD 'CHANGE_ME_FANZMEDIA';
        GRANT platform_app_rw TO svc_fanzmedia;
        RAISE NOTICE '  ✓ Created service user: svc_fanzmedia';
    ELSE
        RAISE NOTICE '  → Service user already exists: svc_fanzmedia';
    END IF;
END $$;

-- Analytics service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'svc_analytics') THEN
        CREATE USER svc_analytics WITH PASSWORD 'CHANGE_ME_ANALYTICS';
        GRANT analytics_rw TO svc_analytics;
        RAISE NOTICE '  ✓ Created service user: svc_analytics';
    ELSE
        RAISE NOTICE '  → Service user already exists: svc_analytics';
    END IF;
END $$;

-- Platform API service (main application)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'svc_platform_api') THEN
        CREATE USER svc_platform_api WITH PASSWORD 'CHANGE_ME_PLATFORM_API';
        GRANT platform_app_rw TO svc_platform_api;
        RAISE NOTICE '  ✓ Created service user: svc_platform_api';
    ELSE
        RAISE NOTICE '  → Service user already exists: svc_platform_api';
    END IF;
END $$;

\echo ''

-- =====================================================
-- Security Settings
-- =====================================================

\echo 'Configuring security settings...'

-- Revoke public schema access from public role
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE fanz_ecosystem FROM PUBLIC;

\echo '  ✓ Revoked public access'

-- Enable row level security enforcement
ALTER DATABASE fanz_ecosystem SET row_security = on;

\echo '  ✓ Enabled row level security'

\echo ''

-- =====================================================
-- Summary
-- =====================================================

\echo '========================================='
\echo '  Roles Setup Complete!'
\echo '========================================='
\echo ''

\echo 'Roles created:'
SELECT rolname, rolcanlogin, rolsuper
FROM pg_roles
WHERE rolname LIKE 'platform_%'
   OR rolname LIKE 'analytics_%'
   OR rolname LIKE '%_ops'
   OR rolname LIKE 'svc_%'
   OR rolname LIKE 'moderator_%'
   OR rolname LIKE 'compliance_%'
   OR rolname = 'secrets_reader'
ORDER BY rolname;

\echo ''
\echo 'Important Security Notes:'
\echo ''
\echo '  ⚠  CHANGE ALL SERVICE USER PASSWORDS!'
\echo '     ALTER USER svc_fanzsso WITH PASSWORD ''new_secure_password'';'
\echo ''
\echo '  ⚠  Store passwords securely (use secrets management)'
\echo '     - AWS Secrets Manager'
\echo '     - HashiCorp Vault'
\echo '     - Azure Key Vault'
\echo ''
\echo '  ⚠  Enable SSL connections in production'
\echo '     ssl = on'
\echo '     ssl_cert_file = ''/path/to/cert.pem'''
\echo '     ssl_key_file = ''/path/to/key.pem'''
\echo ''
\echo '  ⚠  Configure pg_hba.conf for secure access'
\echo '     # Example:'
\echo '     hostssl  fanz_ecosystem  svc_platform_api  0.0.0.0/0  md5'
\echo ''
\echo 'Next steps:'
\echo '  1. Change all service user passwords'
\echo '  2. Configure connection pooling (PgBouncer)'
\echo '  3. Set up SSL certificates'
\echo '  4. Configure pg_hba.conf'
\echo '  5. Test connection from application'
\echo ''

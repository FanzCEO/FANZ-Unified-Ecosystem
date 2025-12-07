-- =====================================================
-- FANZ Unified Ecosystem - Schema Verification
-- =====================================================
-- This script verifies the database installation
--
-- Usage:
--   psql fanz_ecosystem -f verify_schemas.sql
-- =====================================================

\set ON_ERROR_STOP off

\echo ''
\echo '========================================='
\echo '  FANZ Database Verification'
\echo '========================================='
\echo ''

-- =====================================================
-- 1. Check Extensions
-- =====================================================

\echo '1. Checking PostgreSQL Extensions...'
\echo ''

SELECT
    extname AS "Extension",
    extversion AS "Version",
    CASE
        WHEN extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm') THEN '✓ Required'
        WHEN extname IN ('vector', 'timescaledb') THEN '✓ Optional'
        ELSE '  Installed'
    END AS "Status"
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

\echo ''

-- =====================================================
-- 2. Check Schemas
-- =====================================================

\echo '2. Checking Database Schemas...'
\echo ''

WITH expected_schemas AS (
    SELECT unnest(ARRAY[
        'public', 'ledger', 'tax', 'catalog', 'rights', 'moderation',
        'creators', 'fans', 'campaigns', 'events', 'registry', 'features',
        'routing', 'config', 'rankings', 'recommendations', 'search',
        'posts', 'threads', 'rooms', 'messages', 'products', 'orders',
        'affiliates', 'dmca', 'takedowns', 'evidence', 'legal_claims',
        'prompts', 'embeddings', 'ai_recommendations', 'revenue',
        'content_analytics', 'user_analytics', 'funnels', 'audit', 'gdpr',
        'kyc_vault'
    ]) AS schema_name
)
SELECT
    es.schema_name AS "Schema",
    CASE
        WHEN ns.nspname IS NOT NULL THEN '✓ Installed'
        ELSE '✗ Missing'
    END AS "Status"
FROM expected_schemas es
LEFT JOIN pg_namespace ns ON es.schema_name = ns.nspname
ORDER BY es.schema_name;

\echo ''

-- =====================================================
-- 3. Check Tables per Schema
-- =====================================================

\echo '3. Checking Tables by Schema...'
\echo ''

SELECT
    schemaname AS "Schema",
    COUNT(*) AS "Tables",
    pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS "Total Size"
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;

\echo ''

-- =====================================================
-- 4. Check Critical Tables
-- =====================================================

\echo '4. Checking Critical Tables...'
\echo ''

WITH critical_tables AS (
    SELECT unnest(ARRAY[
        'users',
        'sessions',
        'kyc_vault.kyc_profiles',
        'ledger.accounts',
        'ledger.transactions',
        'catalog.assets',
        'creators.profiles',
        'fans.subscriptions',
        'registry.platforms',
        'posts.posts',
        'products.products',
        'orders.orders',
        'dmca.notices',
        'audit.logs',
        'gdpr.data_subject_requests'
    ]) AS table_path
)
SELECT
    ct.table_path AS "Critical Table",
    CASE
        WHEN c.table_name IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END AS "Status",
    COALESCE(pg_size_pretty(pg_total_relation_size(
        CASE
            WHEN ct.table_path LIKE '%.%' THEN ct.table_path
            ELSE 'public.' || ct.table_path
        END
    )), '-') AS "Size"
FROM critical_tables ct
LEFT JOIN information_schema.tables c ON
    CASE
        WHEN ct.table_path LIKE '%.%' THEN
            SPLIT_PART(ct.table_path, '.', 1) = c.table_schema AND
            SPLIT_PART(ct.table_path, '.', 2) = c.table_name
        ELSE
            c.table_schema = 'public' AND c.table_name = ct.table_path
    END
ORDER BY ct.table_path;

\echo ''

-- =====================================================
-- 5. Check Indexes
-- =====================================================

\echo '5. Checking Index Statistics...'
\echo ''

SELECT
    schemaname AS "Schema",
    COUNT(*) AS "Total Indexes",
    COUNT(*) FILTER (WHERE idx_scan = 0) AS "Unused Indexes",
    COUNT(*) FILTER (WHERE idx_scan > 0) AS "Used Indexes"
FROM pg_stat_user_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;

\echo ''

-- =====================================================
-- 6. Check Roles
-- =====================================================

\echo '6. Checking Database Roles...'
\echo ''

WITH expected_roles AS (
    SELECT unnest(ARRAY[
        'platform_app_ro',
        'platform_app_rw',
        'analytics_ro',
        'analytics_rw',
        'legal_ops',
        'kyc_ops',
        'tax_ops',
        'moderator_ro',
        'moderator_rw',
        'compliance_ro',
        'compliance_rw',
        'security_ops',
        'secrets_reader'
    ]) AS role_name
)
SELECT
    er.role_name AS "Role",
    CASE
        WHEN r.rolname IS NOT NULL THEN '✓ Exists'
        ELSE '✗ Missing'
    END AS "Status",
    CASE
        WHEN r.rolcanlogin THEN 'Yes'
        ELSE 'No'
    END AS "Can Login"
FROM expected_roles er
LEFT JOIN pg_roles r ON er.role_name = r.rolname
ORDER BY er.role_name;

\echo ''

-- =====================================================
-- 7. Check Service Users
-- =====================================================

\echo '7. Checking Service Users...'
\echo ''

SELECT
    rolname AS "Service User",
    CASE
        WHEN rolcanlogin THEN '✓ Can Login'
        ELSE '✗ Cannot Login'
    END AS "Status",
    CASE
        WHEN rolvaliduntil IS NULL THEN 'Never'
        ELSE rolvaliduntil::text
    END AS "Password Expires"
FROM pg_roles
WHERE rolname LIKE 'svc_%'
ORDER BY rolname;

\echo ''

-- =====================================================
-- 8. Check Row Level Security
-- =====================================================

\echo '8. Checking Row Level Security (RLS)...'
\echo ''

SELECT
    schemaname AS "Schema",
    tablename AS "Table",
    CASE
        WHEN rowsecurity THEN '✓ Enabled'
        ELSE '  Disabled'
    END AS "RLS Status"
FROM pg_tables
WHERE schemaname IN ('kyc_vault', 'tax', 'evidence', 'gdpr', 'fans', 'messages')
  AND rowsecurity = true
ORDER BY schemaname, tablename;

\echo ''

-- =====================================================
-- 9. Check Functions
-- =====================================================

\echo '9. Checking Custom Functions...'
\echo ''

SELECT
    n.nspname AS "Schema",
    p.proname AS "Function",
    pg_get_function_arguments(p.oid) AS "Arguments"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;

\echo ''

-- =====================================================
-- 10. Check Triggers
-- =====================================================

\echo '10. Checking Triggers...'
\echo ''

SELECT
    schemaname AS "Schema",
    COUNT(*) AS "Trigger Count"
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND NOT t.tgisinternal
GROUP BY schemaname
ORDER BY schemaname;

\echo ''

-- =====================================================
-- 11. Check Views and Materialized Views
-- =====================================================

\echo '11. Checking Views...'
\echo ''

SELECT
    schemaname AS "Schema",
    COUNT(*) FILTER (WHERE viewname IS NOT NULL) AS "Regular Views",
    COUNT(*) FILTER (WHERE matviewname IS NOT NULL) AS "Materialized Views"
FROM (
    SELECT schemaname, viewname, NULL::text as matviewname
    FROM pg_views
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    UNION ALL
    SELECT schemaname, NULL::text as viewname, matviewname
    FROM pg_matviews
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
) combined
GROUP BY schemaname
ORDER BY schemaname;

\echo ''

-- =====================================================
-- 12. Database Size Summary
-- =====================================================

\echo '12. Database Size Summary...'
\echo ''

SELECT
    pg_size_pretty(pg_database_size(current_database())) AS "Total Database Size";

\echo ''

SELECT
    'Tables' AS "Component",
    pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS "Size"
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
UNION ALL
SELECT
    'Indexes' AS "Component",
    pg_size_pretty(SUM(pg_total_relation_size(indexrelid))) AS "Size"
FROM pg_stat_user_indexes
UNION ALL
SELECT
    'TOAST' AS "Component",
    pg_size_pretty(SUM(pg_total_relation_size(reltoastrelid))) AS "Size"
FROM pg_class
WHERE reltoastrelid != 0;

\echo ''

-- =====================================================
-- 13. Health Checks
-- =====================================================

\echo '13. Database Health Checks...'
\echo ''

-- Check for tables without primary keys
\echo 'Tables without primary keys:'
SELECT
    schemaname AS "Schema",
    tablename AS "Table"
FROM pg_tables t
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = (t.schemaname||'.'||t.tablename)::regclass
      AND c.contype = 'p'
)
LIMIT 10;

\echo ''

-- Check for unused indexes (never scanned)
\echo 'Potentially unused indexes (never scanned):'
SELECT
    schemaname AS "Schema",
    tablename AS "Table",
    indexname AS "Index",
    pg_size_pretty(pg_relation_size(indexrelid)) AS "Size"
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 10;

\echo ''

-- Check cache hit ratio
\echo 'Cache hit ratio (should be >99%):'
SELECT
    ROUND(
        sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
        2
    ) || '%' AS "Cache Hit Ratio"
FROM pg_statio_user_tables;

\echo ''

-- =====================================================
-- Summary
-- =====================================================

\echo '========================================='
\echo '  Verification Complete!'
\echo '========================================='
\echo ''

-- Overall status
DO $$
DECLARE
    schema_count INTEGER;
    table_count INTEGER;
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO schema_count FROM pg_namespace
    WHERE nspname IN ('public', 'ledger', 'tax', 'catalog', 'rights', 'moderation',
        'creators', 'fans', 'campaigns', 'events', 'registry', 'features',
        'routing', 'config', 'rankings', 'recommendations', 'search',
        'posts', 'threads', 'rooms', 'messages', 'products', 'orders',
        'affiliates', 'dmca', 'takedowns', 'evidence', 'legal_claims',
        'prompts', 'embeddings', 'ai_recommendations', 'revenue',
        'content_analytics', 'user_analytics', 'funnels', 'audit', 'gdpr',
        'kyc_vault');

    SELECT COUNT(*) INTO table_count FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

    SELECT COUNT(*) INTO role_count FROM pg_roles
    WHERE rolname LIKE 'platform_%'
       OR rolname LIKE 'analytics_%'
       OR rolname LIKE '%_ops'
       OR rolname LIKE 'moderator_%'
       OR rolname LIKE 'compliance_%'
       OR rolname = 'secrets_reader';

    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  Schemas: % installed', schema_count;
    RAISE NOTICE '  Tables: % created', table_count;
    RAISE NOTICE '  Roles: % configured', role_count;
    RAISE NOTICE '';

    IF schema_count >= 30 AND table_count >= 100 AND role_count >= 10 THEN
        RAISE NOTICE '  ✓ Database installation appears healthy!';
    ELSE
        RAISE WARNING '  ⚠ Some components may be missing. Review output above.';
    END IF;
END $$;

\echo ''
\echo 'For detailed documentation, see: database/README.md'
\echo ''

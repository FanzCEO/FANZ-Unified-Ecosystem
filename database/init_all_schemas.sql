-- =====================================================
-- FANZ Unified Ecosystem - Complete Database Initialization
-- =====================================================
-- This script initializes all 12 database schemas in order
-- Run this on a fresh PostgreSQL database
--
-- Prerequisites:
--   - PostgreSQL 14+ installed
--   - Extensions: uuid-ossp, pgcrypto, pg_trgm, vector (optional)
--   - Database created: CREATE DATABASE fanz_ecosystem;
--
-- Usage:
--   psql fanz_ecosystem -f init_all_schemas.sql
-- =====================================================

\set ON_ERROR_STOP on
\timing on

-- Display initialization banner
\echo ''
\echo '========================================='
\echo '  FANZ Unified Ecosystem'
\echo '  Database Initialization'
\echo '========================================='
\echo ''

-- =====================================================
-- Check PostgreSQL Version
-- =====================================================

\echo 'Checking PostgreSQL version...'
SELECT version();
\echo ''

-- =====================================================
-- Enable Required Extensions
-- =====================================================

\echo 'Installing required PostgreSQL extensions...'

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\echo '  ✓ uuid-ossp installed'

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\echo '  ✓ pgcrypto installed'

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\echo '  ✓ pg_trgm installed (full-text search)'

-- Optional extensions (will skip if not available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "vector";
    RAISE NOTICE '  ✓ pgvector installed (AI embeddings)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ pgvector not available (optional for AI features)';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "timescaledb";
    RAISE NOTICE '  ✓ timescaledb installed (time-series optimization)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ timescaledb not available (optional for analytics)';
END $$;

\echo ''

-- =====================================================
-- Schema 1: FANZ Identity
-- =====================================================

\echo '1/13 Installing fanz_identity schema...'
\i schemas/01_fanz_identity.sql
\echo '  ✓ Identity, auth, and KYC schema installed'
\echo ''

-- =====================================================
-- Schema 2: FANZ Money
-- =====================================================

\echo '2/13 Installing fanz_money schema...'
\i schemas/02_fanz_money.sql
\echo '  ✓ Financial ledger schema installed'
\echo ''

-- =====================================================
-- Schema 3: FANZ Media
-- =====================================================

\echo '3/13 Installing fanz_media schema...'
\i schemas/03_fanz_media.sql
\echo '  ✓ Media asset management schema installed'
\echo ''

-- =====================================================
-- Schema 4: FANZ CRM
-- =====================================================

\echo '4/13 Installing fanz_crm schema...'
\i schemas/04_fanz_crm.sql
\echo '  ✓ CRM schema installed'
\echo ''

-- =====================================================
-- Schema 5: FANZ OS
-- =====================================================

\echo '5/13 Installing fanz_os schema...'
\i schemas/05_fanz_os.sql
\echo '  ✓ Platform OS schema installed'
\echo ''

-- =====================================================
-- Schema 6: FANZ Discovery
-- =====================================================

\echo '6/13 Installing fanz_discovery schema...'
\i schemas/06_fanz_discovery.sql
\echo '  ✓ Discovery and ranking schema installed'
\echo ''

-- =====================================================
-- Schema 7: FANZ Social
-- =====================================================

\echo '7/13 Installing fanz_social schema...'
\i schemas/07_fanz_social.sql
\echo '  ✓ Social features schema installed'
\echo ''

-- =====================================================
-- Schema 8: FANZ Commerce
-- =====================================================

\echo '8/13 Installing fanz_commerce schema...'
\i schemas/08_fanz_commerce.sql
\echo '  ✓ E-commerce schema installed'
\echo ''

-- =====================================================
-- Schema 9: FANZ Legal
-- =====================================================

\echo '9/13 Installing fanz_legal schema...'
\i schemas/09_fanz_legal.sql
\echo '  ✓ Legal compliance schema installed'
\echo ''

-- =====================================================
-- Schema 10: FANZ AI
-- =====================================================

\echo '10/13 Installing fanz_ai schema...'
\i schemas/10_fanz_ai.sql
\echo '  ✓ AI/ML schema installed'
\echo ''

-- =====================================================
-- Schema 11: FANZ Analytics
-- =====================================================

\echo '11/13 Installing fanz_analytics schema...'
\i schemas/11_fanz_analytics.sql
\echo '  ✓ Analytics schema installed'
\echo ''

-- =====================================================
-- Schema 12: FANZ Audit
-- =====================================================

\echo '12/13 Installing fanz_audit schema...'
\i schemas/12_fanz_audit.sql
\echo '  ✓ Audit and GDPR schema installed'
\echo ''

-- =====================================================
-- Schema 13: FANZ Discrete
-- =====================================================

\echo '13/13 Installing fanz_discrete schema...'
\i schemas/13_fanz_discrete.sql
\echo '  ✓ FanzDiscreete payment privacy schema installed'
\echo ''

-- =====================================================
-- Verification
-- =====================================================

\echo '========================================='
\echo '  Verification'
\echo '========================================='
\echo ''

\echo 'Database schemas created:'
SELECT nspname AS schema_name
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND nspname NOT LIKE 'pg_temp%'
  AND nspname NOT LIKE 'pg_toast_temp%'
ORDER BY nspname;

\echo ''
\echo 'Total tables created:'
SELECT
    schemaname,
    COUNT(*) as table_count
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;

\echo ''
\echo 'Extensions installed:'
SELECT extname, extversion FROM pg_extension ORDER BY extname;

\echo ''
\echo '========================================='
\echo '  Installation Complete!'
\echo '========================================='
\echo ''
\echo 'Next steps:'
\echo '  1. Run: psql fanz_ecosystem -f setup_roles.sql'
\echo '  2. Configure connection pooling (PgBouncer)'
\echo '  3. Set up backup strategy'
\echo '  4. Configure monitoring'
\echo '  5. Review security settings'
\echo ''
\echo 'Documentation: database/README.md'
\echo ''

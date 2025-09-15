-- Migration: Create FanzFinance OS Schema
-- Version: 20250915_001
-- Description: Initial schema creation for FanzFinance OS payment system

BEGIN;

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '20250915_001') THEN
        RAISE EXCEPTION 'Migration 20250915_001 has already been applied';
    END IF;
END $$;

-- Apply the migration
\i database/init/01-init-fanzfinance.sql

-- Record migration
INSERT INTO schema_migrations (version, description) 
VALUES ('20250915_001', 'Initial FanzFinance OS schema creation');

-- Success
DO $$
BEGIN
    RAISE NOTICE 'Migration 20250915_001 completed successfully';
END $$;

COMMIT;
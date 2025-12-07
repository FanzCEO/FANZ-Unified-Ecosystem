-- Migration: Add creator_story field to all creator and verification tables
-- Date: 2025-11-10
-- Description: Adds 200-character story field to creator profiles and verification forms across all platforms

-- ========================================
-- CONTENT CREATOR VERIFICATION TABLES
-- ========================================

-- Add story field to content_creator_verification table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'content_creator_verification'
    ) THEN
        ALTER TABLE content_creator_verification
        ADD COLUMN IF NOT EXISTS creator_story VARCHAR(200);

        COMMENT ON COLUMN content_creator_verification.creator_story IS
            'Creator bio/story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- Add story field to co_star_verification table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'co_star_verification'
    ) THEN
        ALTER TABLE co_star_verification
        ADD COLUMN IF NOT EXISTS co_star_story VARCHAR(200);

        COMMENT ON COLUMN co_star_verification.co_star_story IS
            'Co-star bio/story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- ========================================
-- USERS / CREATORS TABLES
-- ========================================

-- Add story field to users table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS story VARCHAR(200);

        COMMENT ON COLUMN users.story IS
            'User/creator story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- Add story field to creators table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'creators'
    ) THEN
        ALTER TABLE creators
        ADD COLUMN IF NOT EXISTS story VARCHAR(200);

        COMMENT ON COLUMN creators.story IS
            'Creator story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- Add story field to profiles table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS story VARCHAR(200);

        COMMENT ON COLUMN profiles.story IS
            'User story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- ========================================
-- PERFORMER / STAR TABLES
-- ========================================

-- Add story field to performers table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'performers'
    ) THEN
        ALTER TABLE performers
        ADD COLUMN IF NOT EXISTS story VARCHAR(200);

        COMMENT ON COLUMN performers.story IS
            'Performer story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- Add story field to stars table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'stars'
    ) THEN
        ALTER TABLE stars
        ADD COLUMN IF NOT EXISTS story VARCHAR(200);

        COMMENT ON COLUMN stars.story IS
            'Star story to appear on their profile (max 200 characters)';
    END IF;
END$$;

-- ========================================
-- VERIFICATION SUMMARY
-- ========================================

-- Display summary of changes
DO $$
DECLARE
    tables_updated TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check each table and add to array if story field was added
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'content_creator_verification' AND column_name = 'creator_story') THEN
        tables_updated := array_append(tables_updated, 'content_creator_verification');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'co_star_verification' AND column_name = 'co_star_story') THEN
        tables_updated := array_append(tables_updated, 'co_star_verification');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'story') THEN
        tables_updated := array_append(tables_updated, 'users');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'creators' AND column_name = 'story') THEN
        tables_updated := array_append(tables_updated, 'creators');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'story') THEN
        tables_updated := array_append(tables_updated, 'profiles');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'performers' AND column_name = 'story') THEN
        tables_updated := array_append(tables_updated, 'performers');
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'stars' AND column_name = 'story') THEN
        tables_updated := array_append(tables_updated, 'stars');
    END IF;

    RAISE NOTICE '=== Story Field Migration Complete ===';
    RAISE NOTICE 'Tables updated: %', array_length(tables_updated, 1);
    RAISE NOTICE 'Updated tables: %', array_to_string(tables_updated, ', ');
END$$;

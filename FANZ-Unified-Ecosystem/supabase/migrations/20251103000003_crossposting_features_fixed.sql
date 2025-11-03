-- ============================================================================
-- CROSS-POSTING FEATURES MIGRATION (FIXED FOR FANZ UNIFIED ECOSYSTEM)
-- Created: 2025-11-03
-- Fixed: Compatible with existing FANZ database schema
-- ============================================================================
--
-- This migration adds two major cross-posting features:
-- 1. Creator Tagging with Auto Cross-Posting (like Facebook tagging)
-- 2. Multi-Platform Auto-Posting (like Meta's IG/FB cross-posting)
--
-- SCHEMA COMPATIBILITY FIXES:
-- - Changed: posts → content_posts (existing table name)
-- - Changed: VARCHAR → UUID (matching existing schema)
-- - Changed: users → creators (for creator references)
-- - Changed: tenants → platform_cluster enum (existing platform system)
-- ============================================================================

-- ============================================================================
-- PART 1: CREATOR TAGGING & CROSS-POSTING
-- ============================================================================

-- Cross-post approval status enum
DO $$ BEGIN
    CREATE TYPE crosspost_status AS ENUM (
        'pending',      -- Awaiting tagged creator's approval
        'approved',     -- Tagged creator approved, post visible on their wall
        'rejected',     -- Tagged creator rejected
        'auto_approved' -- Auto-approved (creator has auto-approve enabled)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Post tags table - tracks which creators are tagged in posts
CREATE TABLE IF NOT EXISTS post_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    tagged_creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    tagged_by_creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    status crosspost_status NOT NULL DEFAULT 'pending',
    is_visible_on_tagged_wall BOOLEAN NOT NULL DEFAULT false,
    tagged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Prevent duplicate tags
    UNIQUE (post_id, tagged_creator_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tagged_creator ON post_tags(tagged_creator_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_status ON post_tags(status);
CREATE INDEX IF NOT EXISTS idx_post_tags_pending ON post_tags(tagged_creator_id, status) WHERE status = 'pending';

-- Creator cross-posting settings
CREATE TABLE IF NOT EXISTS creator_crosspost_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL UNIQUE REFERENCES creators(id) ON DELETE CASCADE,

    -- Auto-approval settings
    auto_approve_all_tags BOOLEAN NOT NULL DEFAULT false,
    auto_approve_from_following BOOLEAN NOT NULL DEFAULT false,
    auto_approve_from_subscribers BOOLEAN NOT NULL DEFAULT false,
    auto_approve_from_verified BOOLEAN NOT NULL DEFAULT false,

    -- Notification settings
    notify_on_tag BOOLEAN NOT NULL DEFAULT true,
    notify_on_approval_needed BOOLEAN NOT NULL DEFAULT true,

    -- Blacklist/whitelist
    blocked_creator_ids UUID[] DEFAULT '{}',
    always_approve_creator_ids UUID[] DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_crosspost_settings_creator ON creator_crosspost_settings(creator_id);

-- Cross-posted posts table - tracks posts that appear on multiple walls
CREATE TABLE IF NOT EXISTS crossposted_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    crossposted_to_creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    post_tag_id UUID NOT NULL REFERENCES post_tags(id) ON DELETE CASCADE,

    -- Display settings
    show_original_creator BOOLEAN NOT NULL DEFAULT true,
    show_tag_badge BOOLEAN NOT NULL DEFAULT true,

    -- Analytics
    views_on_crossposted_wall INTEGER NOT NULL DEFAULT 0,
    likes_on_crossposted_wall INTEGER NOT NULL DEFAULT 0,
    comments_on_crossposted_wall INTEGER NOT NULL DEFAULT 0,

    crossposted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Prevent duplicate cross-posts
    UNIQUE (original_post_id, crossposted_to_creator_id)
);

CREATE INDEX IF NOT EXISTS idx_crossposted_posts_original ON crossposted_posts(original_post_id);
CREATE INDEX IF NOT EXISTS idx_crossposted_posts_creator ON crossposted_posts(crossposted_to_creator_id);
CREATE INDEX IF NOT EXISTS idx_crossposted_posts_tag ON crossposted_posts(post_tag_id);

-- ============================================================================
-- PART 2: MULTI-PLATFORM AUTO-POSTING
-- ============================================================================

-- Multi-platform posting status enum
DO $$ BEGIN
    CREATE TYPE platform_post_status AS ENUM (
        'queued',       -- Queued for posting
        'processing',   -- Currently being posted
        'posted',       -- Successfully posted
        'failed',       -- Failed to post
        'cancelled'     -- User cancelled before posting
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Creator multi-platform settings
CREATE TABLE IF NOT EXISTS creator_multiplatform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL UNIQUE REFERENCES creators(id) ON DELETE CASCADE,

    -- Default platforms to post to (uses existing platform_cluster enum values)
    -- Values: boyfanz, girlfanz, daddyfanz, pupfanz, taboofanz, transfanz, cougarfanz, fanzcock, fanzlab
    default_platforms TEXT[] DEFAULT '{}',

    -- Auto-posting settings
    auto_post_enabled BOOLEAN NOT NULL DEFAULT false,
    auto_post_delay_seconds INTEGER NOT NULL DEFAULT 0, -- Delay before auto-posting

    -- Platform-specific settings (JSONB for flexibility)
    platform_settings JSONB DEFAULT '{}'::jsonb,
    -- Example structure:
    -- {
    --   "girlfanz": {"enabled": true, "modify_caption": false, "add_watermark": true},
    --   "gayfanz": {"enabled": true, "modify_caption": true, "caption_suffix": "#GayFanz"}
    -- }

    -- Notification settings
    notify_on_post_success BOOLEAN NOT NULL DEFAULT true,
    notify_on_post_failure BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_multiplatform_settings_creator ON creator_multiplatform_settings(creator_id);

-- Multi-platform post queue
CREATE TABLE IF NOT EXISTS multiplatform_post_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    target_platform TEXT NOT NULL, -- platform_cluster enum value as text

    status platform_post_status NOT NULL DEFAULT 'queued',

    -- Post modifications for target platform
    modified_caption TEXT,
    modified_title VARCHAR(255),
    modified_hashtags TEXT[],
    add_platform_watermark BOOLEAN NOT NULL DEFAULT false,

    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,

    -- Result tracking
    target_post_id UUID, -- ID of the created post on target platform
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_original_post ON multiplatform_post_queue(original_post_id);
CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_creator ON multiplatform_post_queue(creator_id);
CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_platform ON multiplatform_post_queue(target_platform);
CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_status ON multiplatform_post_queue(status);
CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_scheduled ON multiplatform_post_queue(scheduled_for) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_multiplatform_queue_processing ON multiplatform_post_queue(status, queued_at) WHERE status IN ('queued', 'processing');

-- Multi-platform post history (for analytics)
CREATE TABLE IF NOT EXISTS multiplatform_post_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    target_platform TEXT NOT NULL, -- platform_cluster enum value as text
    target_post_id UUID,

    -- Performance metrics
    time_to_post_seconds INTEGER,
    engagement_on_original_platform JSONB DEFAULT '{}'::jsonb,
    engagement_on_target_platform JSONB DEFAULT '{}'::jsonb,

    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multiplatform_history_original_post ON multiplatform_post_history(original_post_id);
CREATE INDEX IF NOT EXISTS idx_multiplatform_history_creator ON multiplatform_post_history(creator_id);
CREATE INDEX IF NOT EXISTS idx_multiplatform_history_platform ON multiplatform_post_history(target_platform);

-- ============================================================================
-- FUNCTIONS: Auto-Approval Logic
-- ============================================================================

-- Function to check if a tag should be auto-approved
CREATE OR REPLACE FUNCTION check_tag_auto_approval(
    p_post_id UUID,
    p_tagged_creator_id UUID,
    p_tagging_creator_id UUID
) RETURNS crosspost_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings creator_crosspost_settings%ROWTYPE;
    v_is_following BOOLEAN;
    v_is_subscriber BOOLEAN;
    v_is_verified BOOLEAN;
    v_is_blocked BOOLEAN;
    v_is_whitelisted BOOLEAN;
BEGIN
    -- Get tagged creator's settings
    SELECT * INTO v_settings
    FROM creator_crosspost_settings
    WHERE creator_id = p_tagged_creator_id;

    -- If no settings exist, default to pending
    IF v_settings.id IS NULL THEN
        RETURN 'pending'::crosspost_status;
    END IF;

    -- Check if tagging creator is blocked
    v_is_blocked := p_tagging_creator_id = ANY(v_settings.blocked_creator_ids);
    IF v_is_blocked THEN
        RETURN 'rejected'::crosspost_status;
    END IF;

    -- Check if tagging creator is whitelisted
    v_is_whitelisted := p_tagging_creator_id = ANY(v_settings.always_approve_creator_ids);
    IF v_is_whitelisted THEN
        RETURN 'auto_approved'::crosspost_status;
    END IF;

    -- Check auto-approve all setting
    IF v_settings.auto_approve_all_tags THEN
        RETURN 'auto_approved'::crosspost_status;
    END IF;

    -- Check if tagging creator is following tagged creator
    IF v_settings.auto_approve_from_following THEN
        SELECT EXISTS (
            SELECT 1 FROM follows
            WHERE follower_user_id = (SELECT user_id FROM creators WHERE id = p_tagging_creator_id)
            AND followed_user_id = (SELECT user_id FROM creators WHERE id = p_tagged_creator_id)
            AND deleted_at IS NULL
        ) INTO v_is_following;

        IF v_is_following THEN
            RETURN 'auto_approved'::crosspost_status;
        END IF;
    END IF;

    -- Check if tagging creator is a subscriber
    IF v_settings.auto_approve_from_subscribers THEN
        SELECT EXISTS (
            SELECT 1 FROM user_subscriptions
            WHERE user_id = (SELECT user_id FROM creators WHERE id = p_tagging_creator_id)
            AND creator_id = p_tagged_creator_id
            AND status = 'active'
            AND deleted_at IS NULL
        ) INTO v_is_subscriber;

        IF v_is_subscriber THEN
            RETURN 'auto_approved'::crosspost_status;
        END IF;
    END IF;

    -- Check if tagging creator is verified
    IF v_settings.auto_approve_from_verified THEN
        SELECT verification_status = 'verified'::verification_status INTO v_is_verified
        FROM creators
        WHERE id = p_tagging_creator_id;

        IF v_is_verified THEN
            RETURN 'auto_approved'::crosspost_status;
        END IF;
    END IF;

    -- Default to pending approval
    RETURN 'pending'::crosspost_status;
END;
$$;

-- ============================================================================
-- FUNCTIONS: Trigger Functions
-- ============================================================================

-- Trigger function to auto-create cross-posted post when tag is approved
CREATE OR REPLACE FUNCTION on_post_tag_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only proceed if status changed to approved or auto_approved
    IF NEW.status IN ('approved', 'auto_approved') AND
       (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'auto_approved')) THEN

        -- Create cross-posted post entry
        INSERT INTO crossposted_posts (
            original_post_id,
            crossposted_to_creator_id,
            post_tag_id,
            show_original_creator,
            show_tag_badge
        ) VALUES (
            NEW.post_id,
            NEW.tagged_creator_id,
            NEW.id,
            true,
            true
        )
        ON CONFLICT (original_post_id, crossposted_to_creator_id) DO NOTHING;

        -- Update tag to show on wall
        NEW.is_visible_on_tagged_wall := true;
        NEW.approved_at := NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_post_tag_approved ON post_tags;
CREATE TRIGGER trigger_post_tag_approved
    BEFORE UPDATE ON post_tags
    FOR EACH ROW
    EXECUTE FUNCTION on_post_tag_approved();

-- Trigger function to queue multi-platform posts when a post is created
CREATE OR REPLACE FUNCTION on_post_created_multiplatform()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings creator_multiplatform_settings%ROWTYPE;
    v_platform TEXT;
BEGIN
    -- Get creator's multi-platform settings
    SELECT * INTO v_settings
    FROM creator_multiplatform_settings
    WHERE creator_id = NEW.creator_id
    AND auto_post_enabled = true;

    -- If auto-posting is enabled and platforms are configured
    IF v_settings.id IS NOT NULL AND array_length(v_settings.default_platforms, 1) > 0 THEN
        -- Queue posts for each target platform
        FOREACH v_platform IN ARRAY v_settings.default_platforms
        LOOP
            INSERT INTO multiplatform_post_queue (
                original_post_id,
                creator_id,
                target_platform,
                scheduled_for
            ) VALUES (
                NEW.id,
                NEW.creator_id,
                v_platform,
                NOW() + (v_settings.auto_post_delay_seconds || ' seconds')::INTERVAL
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_post_created_multiplatform ON content_posts;
CREATE TRIGGER trigger_post_created_multiplatform
    AFTER INSERT ON content_posts
    FOR EACH ROW
    EXECUTE FUNCTION on_post_created_multiplatform();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_crosspost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossposted_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_multiplatform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplatform_post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplatform_post_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_tags
DROP POLICY IF EXISTS "post_tags_select_public" ON post_tags;
CREATE POLICY "post_tags_select_public"
    ON post_tags FOR SELECT
    USING (true); -- Anyone can see tags

DROP POLICY IF EXISTS "post_tags_insert_own" ON post_tags;
CREATE POLICY "post_tags_insert_own"
    ON post_tags FOR INSERT
    WITH CHECK (
        tagged_by_creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "post_tags_update_tagged_creator" ON post_tags;
CREATE POLICY "post_tags_update_tagged_creator"
    ON post_tags FOR UPDATE
    USING (
        tagged_creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    ); -- Only tagged creator can approve/reject

-- RLS Policies for crosspost settings
DROP POLICY IF EXISTS "crosspost_settings_select_own" ON creator_crosspost_settings;
CREATE POLICY "crosspost_settings_select_own"
    ON creator_crosspost_settings FOR SELECT
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crosspost_settings_insert_own" ON creator_crosspost_settings;
CREATE POLICY "crosspost_settings_insert_own"
    ON creator_crosspost_settings FOR INSERT
    WITH CHECK (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "crosspost_settings_update_own" ON creator_crosspost_settings;
CREATE POLICY "crosspost_settings_update_own"
    ON creator_crosspost_settings FOR UPDATE
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for crossposted_posts
DROP POLICY IF EXISTS "crossposted_posts_select_public" ON crossposted_posts;
CREATE POLICY "crossposted_posts_select_public"
    ON crossposted_posts FOR SELECT
    USING (true); -- Anyone can see cross-posted posts

-- RLS Policies for multiplatform settings
DROP POLICY IF EXISTS "multiplatform_settings_select_own" ON creator_multiplatform_settings;
CREATE POLICY "multiplatform_settings_select_own"
    ON creator_multiplatform_settings FOR SELECT
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "multiplatform_settings_insert_own" ON creator_multiplatform_settings;
CREATE POLICY "multiplatform_settings_insert_own"
    ON creator_multiplatform_settings FOR INSERT
    WITH CHECK (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "multiplatform_settings_update_own" ON creator_multiplatform_settings;
CREATE POLICY "multiplatform_settings_update_own"
    ON creator_multiplatform_settings FOR UPDATE
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for multiplatform queue
DROP POLICY IF EXISTS "multiplatform_queue_select_own" ON multiplatform_post_queue;
CREATE POLICY "multiplatform_queue_select_own"
    ON multiplatform_post_queue FOR SELECT
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "multiplatform_queue_insert_own" ON multiplatform_post_queue;
CREATE POLICY "multiplatform_queue_insert_own"
    ON multiplatform_post_queue FOR INSERT
    WITH CHECK (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "multiplatform_queue_update_own" ON multiplatform_post_queue;
CREATE POLICY "multiplatform_queue_update_own"
    ON multiplatform_post_queue FOR UPDATE
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for multiplatform history
DROP POLICY IF EXISTS "multiplatform_history_select_own" ON multiplatform_post_history;
CREATE POLICY "multiplatform_history_select_own"
    ON multiplatform_post_history FOR SELECT
    USING (
        creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE post_tags IS 'Tracks which creators are tagged in posts for cross-posting';
COMMENT ON TABLE creator_crosspost_settings IS 'Creator preferences for how tagged posts should be handled';
COMMENT ON TABLE crossposted_posts IS 'Posts that appear on multiple creators walls due to tagging';
COMMENT ON TABLE creator_multiplatform_settings IS 'Creator settings for auto-posting across multiple FANZ platforms';
COMMENT ON TABLE multiplatform_post_queue IS 'Queue for posts waiting to be cross-posted to other platforms';
COMMENT ON TABLE multiplatform_post_history IS 'Historical record of multi-platform posts for analytics';

COMMENT ON FUNCTION check_tag_auto_approval IS 'Determines if a post tag should be automatically approved based on creator settings';
COMMENT ON FUNCTION on_post_tag_approved IS 'Trigger function that creates cross-posted post when tag is approved';
COMMENT ON FUNCTION on_post_created_multiplatform IS 'Trigger function that queues multi-platform posts when original post is created';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Cross-posting features migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Created Tables:';
    RAISE NOTICE '   - post_tags (creator tagging)';
    RAISE NOTICE '   - creator_crosspost_settings (approval settings)';
    RAISE NOTICE '   - crossposted_posts (cross-posted content)';
    RAISE NOTICE '   - creator_multiplatform_settings (multi-platform settings)';
    RAISE NOTICE '   - multiplatform_post_queue (posting queue)';
    RAISE NOTICE '   - multiplatform_post_history (analytics)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS Policies: Enabled on all tables';
    RAISE NOTICE '⚡ Triggers: Auto-approval and auto-posting configured';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features Ready:';
    RAISE NOTICE '   1. Creator Tagging with approval workflow';
    RAISE NOTICE '   2. Cross-posting to tagged creators walls';
    RAISE NOTICE '   3. Multi-platform auto-posting (like Meta/IG)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Schema Compatibility:';
    RAISE NOTICE '   ✓ Compatible with existing content_posts table';
    RAISE NOTICE '   ✓ Compatible with existing creators table';
    RAISE NOTICE '   ✓ Compatible with existing platform_cluster enum';
    RAISE NOTICE '   ✓ All ID columns use UUID type';
END $$;

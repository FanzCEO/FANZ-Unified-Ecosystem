-- =====================================================
-- FANZ MEDIA DATABASE
-- Asset catalog, variants, rights, transcoding, moderation
-- Used by: FanzMedia, FanzTube, FanzClips, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CATALOG SCHEMA - Media asset management
-- =====================================================

CREATE SCHEMA catalog;

-- =====================================================
-- ASSETS
-- =====================================================

CREATE TABLE catalog.assets (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(50) UNIQUE NOT NULL,

    -- Owner
    user_id UUID NOT NULL, -- Creator who uploaded
    creator_id UUID NOT NULL,

    -- Asset type
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('photo', 'video', 'audio', 'document', 'gif', 'live_stream')),
    mime_type VARCHAR(100) NOT NULL,

    -- Original file info
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 for deduplication

    -- Storage
    storage_provider VARCHAR(50) NOT NULL, -- 's3', 'cloudflare', 'wasabi', etc.
    storage_bucket VARCHAR(100) NOT NULL,
    storage_key TEXT NOT NULL,
    storage_region VARCHAR(50),

    -- Dimensions (for images/videos)
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- For video/audio
    frame_rate DECIMAL(10,2), -- For video
    bitrate INTEGER, -- kbps

    -- Metadata
    title VARCHAR(255),
    description TEXT,
    alt_text TEXT,
    tags TEXT[],

    -- Encoding info (for video)
    codec VARCHAR(50),
    video_codec VARCHAR(50),
    audio_codec VARCHAR(50),
    container_format VARCHAR(20),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'ready', 'failed', 'archived', 'deleted'
    )),

    -- Processing
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    processing_error TEXT,

    -- Watermarking (FanzForensics™)
    watermark_enabled BOOLEAN DEFAULT TRUE,
    watermark_fingerprint VARCHAR(100), -- Invisible watermark ID

    -- Adult content flags
    is_adult_content BOOLEAN DEFAULT TRUE,
    content_rating VARCHAR(10) CHECK (content_rating IN ('safe', 'adult', 'extreme')),

    -- AI moderation
    moderation_status VARCHAR(20) CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderation_score DECIMAL(5,2), -- 0-100
    moderation_labels JSONB,
    moderation_reviewed_at TIMESTAMP,
    moderation_reviewed_by UUID,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT assets_dimensions_positive CHECK (width > 0 AND height > 0)
);

CREATE INDEX idx_assets_user ON catalog.assets(user_id, uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_creator ON catalog.assets(creator_id, uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_type ON catalog.assets(asset_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON catalog.assets(status);
CREATE INDEX idx_assets_hash ON catalog.assets(file_hash);
CREATE INDEX idx_assets_platform ON catalog.assets(platform_id, uploaded_at DESC);
CREATE INDEX idx_assets_moderation ON catalog.assets(moderation_status) WHERE moderation_status IN ('pending', 'flagged');
CREATE INDEX idx_assets_watermark ON catalog.assets(watermark_fingerprint) WHERE watermark_fingerprint IS NOT NULL;

COMMENT ON TABLE catalog.assets IS 'Master catalog of all media assets';

-- =====================================================
-- ASSET VARIANTS
-- =====================================================

CREATE TABLE catalog.asset_variants (
    variant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id) ON DELETE CASCADE,

    -- Variant type
    variant_type VARCHAR(30) NOT NULL CHECK (variant_type IN (
        'original', 'thumbnail', 'preview', 'low', 'medium', 'high', '4k', 'hls', 'dash', 'gif_preview'
    )),

    -- File info
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Storage
    storage_provider VARCHAR(50) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL,
    storage_key TEXT NOT NULL,
    storage_url TEXT NOT NULL,

    -- Dimensions
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    bitrate INTEGER,

    -- Encoding
    codec VARCHAR(50),
    quality VARCHAR(20),

    -- CDN
    cdn_url TEXT,
    cdn_provider VARCHAR(50),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_asset ON catalog.asset_variants(asset_id, variant_type);
CREATE INDEX idx_variants_type ON catalog.asset_variants(variant_type);
CREATE INDEX idx_variants_status ON catalog.asset_variants(status);

COMMENT ON TABLE catalog.asset_variants IS 'Different encodings/sizes of assets';

-- =====================================================
-- TRANSCODE JOBS
-- =====================================================

CREATE TABLE catalog.transcode_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id) ON DELETE CASCADE,

    -- Job configuration
    job_type VARCHAR(30) NOT NULL CHECK (job_type IN ('thumbnail', 'preview', 'encode', 'watermark', 'gif')),
    target_variant_type VARCHAR(30) NOT NULL,

    -- Transcoding parameters
    target_width INTEGER,
    target_height INTEGER,
    target_bitrate INTEGER,
    target_codec VARCHAR(50),
    target_format VARCHAR(20),

    -- Watermark config
    watermark_config JSONB,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'processing', 'completed', 'failed', 'cancelled'
    )),

    -- Progress
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

    -- Worker
    worker_id VARCHAR(100),
    worker_started_at TIMESTAMP,

    -- Result
    output_variant_id UUID REFERENCES catalog.asset_variants(variant_id),
    error_message TEXT,
    error_code VARCHAR(50),

    -- Performance
    processing_duration_seconds INTEGER,

    -- Priority
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_transcode_asset ON catalog.transcode_jobs(asset_id, queued_at DESC);
CREATE INDEX idx_transcode_status ON catalog.transcode_jobs(status, priority);
CREATE INDEX idx_transcode_queued ON catalog.transcode_jobs(queued_at) WHERE status = 'queued';
CREATE INDEX idx_transcode_worker ON catalog.transcode_jobs(worker_id) WHERE status = 'processing';

COMMENT ON TABLE catalog.transcode_jobs IS 'Video/audio transcoding job queue';

-- =====================================================
-- RIGHTS SCHEMA - Content access control
-- =====================================================

CREATE SCHEMA rights;

-- =====================================================
-- CONTENT RIGHTS
-- =====================================================

CREATE TABLE rights.content_rights (
    right_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id) ON DELETE CASCADE,

    -- Access type
    access_type VARCHAR(30) NOT NULL CHECK (access_type IN (
        'public', 'subscribers_only', 'ppv', 'custom_request', 'private', 'bundle', 'tier_exclusive'
    )),

    -- Pricing (in cents)
    price_amount BIGINT,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Tier restrictions
    minimum_tier_id UUID,
    allowed_tier_ids UUID[],

    -- Time restrictions
    available_from TIMESTAMP,
    available_until TIMESTAMP,

    -- Geographic restrictions
    allowed_countries VARCHAR(2)[],
    blocked_countries VARCHAR(2)[],

    -- Age verification
    age_verification_required BOOLEAN DEFAULT TRUE,
    minimum_age INTEGER DEFAULT 18,

    -- Download permissions
    download_enabled BOOLEAN DEFAULT FALSE,
    max_downloads_per_user INTEGER,

    -- Streaming permissions
    streaming_enabled BOOLEAN DEFAULT TRUE,
    max_concurrent_streams INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rights_asset ON rights.content_rights(asset_id, is_active);
CREATE INDEX idx_rights_access_type ON rights.content_rights(access_type, is_active);
CREATE INDEX idx_rights_platform ON rights.content_rights(platform_id, is_active);

COMMENT ON TABLE rights.content_rights IS 'Access control and pricing for content';

-- =====================================================
-- ACCESS GRANTS
-- =====================================================

CREATE TABLE rights.access_grants (
    grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Grant type
    grant_type VARCHAR(30) NOT NULL CHECK (grant_type IN (
        'purchased', 'subscription', 'custom_content', 'gifted', 'preview', 'admin'
    )),

    -- Related records
    transaction_id UUID,
    subscription_id UUID,
    custom_content_request_id UUID,

    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,

    -- Validity
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,

    -- Revocation
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT access_grants_download_limit CHECK (max_downloads IS NULL OR download_count <= max_downloads)
);

CREATE INDEX idx_grants_asset_user ON rights.access_grants(asset_id, user_id, is_revoked);
CREATE INDEX idx_grants_user ON rights.access_grants(user_id, granted_at DESC) WHERE is_revoked = FALSE;
CREATE INDEX idx_grants_type ON rights.access_grants(grant_type);
CREATE INDEX idx_grants_expires ON rights.access_grants(valid_until) WHERE is_revoked = FALSE;

COMMENT ON TABLE rights.access_grants IS 'Individual user access permissions';

-- =====================================================
-- VIEW LOGS
-- =====================================================

CREATE TABLE rights.view_logs (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id),
    user_id UUID NOT NULL,

    -- View details
    variant_type VARCHAR(30),
    view_duration_seconds INTEGER,
    completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),

    -- Device info
    device_type VARCHAR(20),
    device_id VARCHAR(255),
    user_agent TEXT,

    -- Location
    ip_address INET,
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Quality
    quality_level VARCHAR(20),
    bandwidth_kbps INTEGER,

    -- Streaming session
    session_id VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_views_asset ON rights.view_logs(asset_id, viewed_at DESC);
CREATE INDEX idx_views_user ON rights.view_logs(user_id, viewed_at DESC);
CREATE INDEX idx_views_platform ON rights.view_logs(platform_id, viewed_at DESC);
CREATE INDEX idx_views_date ON rights.view_logs(viewed_at DESC);
CREATE INDEX idx_views_session ON rights.view_logs(session_id) WHERE session_id IS NOT NULL;

COMMENT ON TABLE rights.view_logs IS 'Content view tracking for analytics';

-- =====================================================
-- MODERATION SCHEMA - Content safety
-- =====================================================

CREATE SCHEMA moderation;

-- =====================================================
-- MODERATION QUEUE
-- =====================================================

CREATE TABLE moderation.moderation_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id),

    -- Queue priority
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Reason for moderation
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'new_upload', 'user_report', 'ai_flagged', 'dmca_claim', 'manual_review', 'appeal'
    )),

    -- AI predictions
    ai_predictions JSONB, -- Labels, scores, categories
    ai_confidence DECIMAL(5,2),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_review', 'approved', 'rejected', 'escalated'
    )),

    -- Assignment
    assigned_to UUID,
    assigned_at TIMESTAMP,

    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_decision VARCHAR(20),
    review_notes TEXT,

    -- Actions taken
    actions_taken TEXT[], -- ['content_removed', 'user_warned', 'user_banned']

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_moderation_status ON moderation.moderation_queue(status, priority, queued_at);
CREATE INDEX idx_moderation_asset ON moderation.moderation_queue(asset_id);
CREATE INDEX idx_moderation_assigned ON moderation.moderation_queue(assigned_to) WHERE status = 'in_review';
CREATE INDEX idx_moderation_pending ON moderation.moderation_queue(queued_at) WHERE status = 'pending';

COMMENT ON TABLE moderation.moderation_queue IS 'Content moderation workflow queue';

-- =====================================================
-- USER REPORTS
-- =====================================================

CREATE TABLE moderation.user_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES catalog.assets(asset_id),

    -- Reporter
    reported_by_user_id UUID NOT NULL,

    -- Report details
    report_reason VARCHAR(50) NOT NULL CHECK (report_reason IN (
        'illegal_content', 'copyright', 'underage', 'violence', 'harassment',
        'spam', 'impersonation', 'other'
    )),
    report_description TEXT NOT NULL,

    -- Evidence
    evidence_urls TEXT[],
    evidence_screenshots TEXT[],

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'investigating', 'action_taken', 'dismissed', 'duplicate'
    )),

    -- Resolution
    resolved_by UUID,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    action_taken VARCHAR(100),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    reported_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_asset ON moderation.user_reports(asset_id, reported_at DESC);
CREATE INDEX idx_reports_user ON moderation.user_reports(reported_by_user_id);
CREATE INDEX idx_reports_status ON moderation.user_reports(status);
CREATE INDEX idx_reports_reason ON moderation.user_reports(report_reason);
CREATE INDEX idx_reports_pending ON moderation.user_reports(reported_at) WHERE status = 'pending';

COMMENT ON TABLE moderation.user_reports IS 'User-submitted content reports';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON catalog.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON catalog.asset_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rights_updated_at BEFORE UPDATE ON rights.content_rights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate asset number
CREATE OR REPLACE FUNCTION generate_asset_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.asset_number = 'AST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.asset_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_asset_number_trigger BEFORE INSERT ON catalog.assets
    FOR EACH ROW EXECUTE FUNCTION generate_asset_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE moderation.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation.user_reports ENABLE ROW LEVEL SECURITY;

-- Moderators can see all items in their queue
CREATE POLICY moderation_queue_moderator ON moderation.moderation_queue
    FOR SELECT
    USING (assigned_to = current_setting('app.current_user_id')::UUID OR status = 'pending');

-- =====================================================
-- VIEWS
-- =====================================================

-- Asset overview with variants
CREATE VIEW catalog.asset_overview AS
SELECT
    a.asset_id,
    a.asset_number,
    a.user_id,
    a.asset_type,
    a.mime_type,
    a.original_filename,
    a.file_size,
    a.width,
    a.height,
    a.duration_seconds,
    a.status,
    a.watermark_enabled,
    a.moderation_status,
    a.platform_id,
    a.uploaded_at,
    COUNT(v.variant_id) as variant_count,
    ARRAY_AGG(v.variant_type) FILTER (WHERE v.variant_type IS NOT NULL) as available_variants
FROM catalog.assets a
LEFT JOIN catalog.asset_variants v ON a.asset_id = v.asset_id AND v.status = 'ready'
WHERE a.deleted_at IS NULL
GROUP BY a.asset_id;

COMMENT ON VIEW catalog.asset_overview IS 'Asset summary with variant information';

-- Content access view
CREATE VIEW rights.content_access AS
SELECT
    a.asset_id,
    a.asset_number,
    a.asset_type,
    cr.access_type,
    cr.price_amount,
    cr.currency,
    cr.download_enabled,
    cr.streaming_enabled,
    cr.available_from,
    cr.available_until,
    cr.is_active
FROM catalog.assets a
JOIN rights.content_rights cr ON a.asset_id = cr.asset_id
WHERE a.deleted_at IS NULL AND a.status = 'ready';

COMMENT ON VIEW rights.content_access IS 'Content pricing and access information';

-- =====================================================
-- GRANTS
-- =====================================================

-- Catalog access
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA catalog TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA catalog TO platform_app_rw;

-- Rights access
GRANT SELECT ON ALL TABLES IN SCHEMA rights TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rights TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rights TO platform_app_rw;

-- Moderation access (restricted)
GRANT SELECT ON ALL TABLES IN SCHEMA moderation TO moderator_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA moderation TO moderator_rw;

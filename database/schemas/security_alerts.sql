-- =============================================================================
-- FANZ Unified Ecosystem - Security Alerts Schema
-- =============================================================================
-- This schema stores security alerts from all platforms in the ecosystem
-- Provides centralized monitoring and threat intelligence
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS security;

-- =============================================================================
-- Security Alerts Table
-- Stores all security alerts from file scanning across all platforms
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id VARCHAR(255) UNIQUE NOT NULL,

    -- Alert metadata
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    platform VARCHAR(100) NOT NULL,
    threat_type VARCHAR(100) NOT NULL,

    -- File information
    file_name VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256
    file_size BIGINT,
    file_mime_type VARCHAR(100),
    file_type VARCHAR(50),

    -- User information
    uploaded_by VARCHAR(255),
    ip_address INET,

    -- Threat details
    threats JSONB NOT NULL DEFAULT '[]'::jsonb,
    scan_engines JSONB DEFAULT '[]'::jsonb,
    scan_details JSONB DEFAULT '{}'::jsonb,

    -- Quarantine information
    quarantined BOOLEAN DEFAULT FALSE,
    quarantine_path TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Alert handling
    acknowledged_by VARCHAR(255),
    resolution_notes TEXT,
    false_positive BOOLEAN DEFAULT FALSE,

    -- Notification tracking
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    dashboard_notified BOOLEAN DEFAULT FALSE,

    -- Indexes
    CONSTRAINT alerts_platform_check CHECK (platform ~ '^[a-zA-Z0-9_-]+$')
);

-- Indexes for performance
CREATE INDEX idx_alerts_severity ON security.alerts(severity);
CREATE INDEX idx_alerts_platform ON security.alerts(platform);
CREATE INDEX idx_alerts_created_at ON security.alerts(created_at DESC);
CREATE INDEX idx_alerts_file_hash ON security.alerts(file_hash);
CREATE INDEX idx_alerts_uploaded_by ON security.alerts(uploaded_by);
CREATE INDEX idx_alerts_ip_address ON security.alerts(ip_address);
CREATE INDEX idx_alerts_threat_type ON security.alerts(threat_type);
CREATE INDEX idx_alerts_quarantined ON security.alerts(quarantined) WHERE quarantined = TRUE;
CREATE INDEX idx_alerts_unresolved ON security.alerts(resolved_at) WHERE resolved_at IS NULL;

-- GIN index for JSONB threat search
CREATE INDEX idx_alerts_threats_gin ON security.alerts USING GIN (threats);

-- =============================================================================
-- Quarantined Files Table
-- Tracks all files in quarantine across all platforms
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.quarantine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES security.alerts(id) ON DELETE CASCADE,

    file_hash VARCHAR(64) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,

    platform VARCHAR(100) NOT NULL,
    original_path TEXT,

    quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    released_by VARCHAR(255),
    released_to_path TEXT,
    release_reason TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    CONSTRAINT unique_quarantine_file UNIQUE (platform, file_hash, file_name)
);

CREATE INDEX idx_quarantine_file_hash ON security.quarantine(file_hash);
CREATE INDEX idx_quarantine_platform ON security.quarantine(platform);
CREATE INDEX idx_quarantine_active ON security.quarantine(released_at, deleted_at)
    WHERE released_at IS NULL AND deleted_at IS NULL;

-- =============================================================================
-- Scan Statistics Table
-- Aggregated statistics for monitoring and reporting
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.scan_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    total_scans INTEGER DEFAULT 0,
    clean_files INTEGER DEFAULT 0,
    infected_files INTEGER DEFAULT 0,
    suspicious_files INTEGER DEFAULT 0,
    quarantined_files INTEGER DEFAULT 0,
    error_scans INTEGER DEFAULT 0,

    total_bytes_scanned BIGINT DEFAULT 0,
    avg_scan_time_ms INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_platform_date UNIQUE (platform, date)
);

CREATE INDEX idx_scan_stats_platform_date ON security.scan_statistics(platform, date DESC);

-- =============================================================================
-- Threat Intelligence Table
-- Tracks known threat patterns and signatures
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    threat_name VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100) NOT NULL,
    signature_pattern TEXT,

    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INTEGER DEFAULT 1,

    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),

    platforms JSONB DEFAULT '[]'::jsonb, -- Which platforms have seen this threat
    file_hashes JSONB DEFAULT '[]'::jsonb, -- Associated file hashes

    mitre_attack_ids JSONB DEFAULT '[]'::jsonb, -- MITRE ATT&CK framework IDs
    cve_ids JSONB DEFAULT '[]'::jsonb, -- CVE identifiers if applicable

    description TEXT,
    remediation TEXT,

    active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_threat_name UNIQUE (threat_name)
);

CREATE INDEX idx_threat_intel_type ON security.threat_intelligence(threat_type);
CREATE INDEX idx_threat_intel_severity ON security.threat_intelligence(severity);
CREATE INDEX idx_threat_intel_last_seen ON security.threat_intelligence(last_seen DESC);
CREATE INDEX idx_threat_intel_active ON security.threat_intelligence(active) WHERE active = TRUE;

-- =============================================================================
-- Alert Notifications Table
-- Tracks all notifications sent for alerts
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES security.alerts(id) ON DELETE CASCADE,

    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('email', 'push', 'sms', 'dashboard', 'slack', 'webhook')),
    recipient VARCHAR(255) NOT NULL,

    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_alert_notifications_alert_id ON security.alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_type ON security.alert_notifications(notification_type);
CREATE INDEX idx_alert_notifications_sent_at ON security.alert_notifications(sent_at DESC);

-- =============================================================================
-- Security Events Table
-- Audit log for all security-related events
-- =============================================================================
CREATE TABLE IF NOT EXISTS security.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('scan', 'quarantine', 'alert', 'release', 'delete', 'configuration')),

    platform VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    ip_address INET,

    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_type ON security.events(event_type);
CREATE INDEX idx_security_events_category ON security.events(event_category);
CREATE INDEX idx_security_events_platform ON security.events(platform);
CREATE INDEX idx_security_events_created_at ON security.events(created_at DESC);
CREATE INDEX idx_security_events_user ON security.events(user_id) WHERE user_id IS NOT NULL;

-- =============================================================================
-- Views for easier querying
-- =============================================================================

-- Active threats view
CREATE OR REPLACE VIEW security.active_threats AS
SELECT
    a.id,
    a.alert_id,
    a.severity,
    a.platform,
    a.threat_type,
    a.file_name,
    a.file_hash,
    a.threats,
    a.uploaded_by,
    a.ip_address,
    a.created_at,
    a.quarantined,
    q.file_path as quarantine_path
FROM security.alerts a
LEFT JOIN security.quarantine q ON a.id = q.alert_id
WHERE a.resolved_at IS NULL
ORDER BY a.created_at DESC;

-- Platform statistics view
CREATE OR REPLACE VIEW security.platform_stats AS
SELECT
    platform,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'warning') as warning_alerts,
    COUNT(*) FILTER (WHERE quarantined = TRUE) as quarantined_files,
    COUNT(DISTINCT uploaded_by) as affected_users,
    MAX(created_at) as last_alert,
    MIN(created_at) as first_alert
FROM security.alerts
GROUP BY platform;

-- Recent threats by platform
CREATE OR REPLACE VIEW security.recent_threats_24h AS
SELECT
    platform,
    threat_type,
    COUNT(*) as count,
    array_agg(DISTINCT file_name) as affected_files,
    MAX(created_at) as latest_occurrence
FROM security.alerts
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY platform, threat_type
ORDER BY count DESC, latest_occurrence DESC;

-- =============================================================================
-- Functions for automated updates
-- =============================================================================

-- Update scan statistics automatically
CREATE OR REPLACE FUNCTION security.update_scan_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called from the application layer
    -- to update daily statistics
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update threat intelligence on new alerts
CREATE OR REPLACE FUNCTION security.update_threat_intelligence()
RETURNS TRIGGER AS $$
DECLARE
    threat_record RECORD;
    threat_name TEXT;
BEGIN
    -- Extract threat names from the threats array
    FOR threat_name IN
        SELECT jsonb_array_elements_text(NEW.threats)
    LOOP
        -- Update or insert threat intelligence
        INSERT INTO security.threat_intelligence (
            threat_name,
            threat_type,
            severity,
            last_seen,
            occurrence_count
        ) VALUES (
            threat_name,
            NEW.threat_type,
            CASE
                WHEN NEW.severity = 'critical' THEN 'high'
                WHEN NEW.severity = 'warning' THEN 'medium'
                ELSE 'low'
            END,
            NOW(),
            1
        )
        ON CONFLICT (threat_name) DO UPDATE
        SET
            last_seen = NOW(),
            occurrence_count = security.threat_intelligence.occurrence_count + 1,
            platforms = CASE
                WHEN NOT (security.threat_intelligence.platforms ? NEW.platform)
                THEN security.threat_intelligence.platforms || jsonb_build_array(NEW.platform)
                ELSE security.threat_intelligence.platforms
            END,
            file_hashes = CASE
                WHEN NOT (security.threat_intelligence.file_hashes ? NEW.file_hash)
                THEN security.threat_intelligence.file_hashes || jsonb_build_array(NEW.file_hash)
                ELSE security.threat_intelligence.file_hashes
            END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for threat intelligence updates
CREATE TRIGGER update_threat_intelligence_trigger
AFTER INSERT ON security.alerts
FOR EACH ROW
WHEN (array_length(NEW.threats, 1) > 0)
EXECUTE FUNCTION security.update_threat_intelligence();

-- =============================================================================
-- Grant permissions
-- =============================================================================

-- Grant read access to security analysts
-- GRANT SELECT ON ALL TABLES IN SCHEMA security TO security_analyst_role;

-- Grant write access to security automation
-- GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA security TO security_automation_role;

-- =============================================================================
-- Sample queries for monitoring
-- =============================================================================

-- Top 10 threats across all platforms
COMMENT ON VIEW security.active_threats IS '
SELECT threat_type, COUNT(*) as count
FROM security.active_threats
GROUP BY threat_type
ORDER BY count DESC
LIMIT 10;
';

-- Files uploaded by user with multiple threats
COMMENT ON TABLE security.alerts IS '
SELECT uploaded_by, COUNT(*) as threat_count
FROM security.alerts
WHERE created_at >= NOW() - INTERVAL ''7 days''
GROUP BY uploaded_by
HAVING COUNT(*) > 3
ORDER BY threat_count DESC;
';

-- Platform with most infections
COMMENT ON VIEW security.platform_stats IS '
SELECT * FROM security.platform_stats
ORDER BY critical_alerts DESC;
';

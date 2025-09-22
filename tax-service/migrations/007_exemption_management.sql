-- Tax Exemption Management Tables
-- FANZ Unified Ecosystem - Tax Compliance
-- 
-- Tables for exemption certificates, rules, alerts, and audit trails

-- Exemption certificates uploaded by customers
CREATE TABLE exemption_certificates (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    exemption_type VARCHAR(50) NOT NULL CHECK (exemption_type IN (
        'resale', 'nonprofit', 'government', 'manufacturing', 
        'agriculture', 'education', 'medical', 'other'
    )),
    organization_name VARCHAR(255),
    jurisdiction_id VARCHAR(50) NOT NULL,
    jurisdiction_code VARCHAR(10) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'expired', 'suspended'
    )),
    file_url TEXT,
    file_hash VARCHAR(64), -- SHA-256 hash for integrity verification
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id),
    UNIQUE(user_id, certificate_number, jurisdiction_code)
);

-- Exemption rules per jurisdiction and product category
CREATE TABLE exemption_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id VARCHAR(50) NOT NULL,
    exemption_type VARCHAR(50) NOT NULL,
    product_categories TEXT[] DEFAULT '{}', -- Empty array means applies to all categories
    conditions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id)
);

-- User tax profiles with exemption status
CREATE TABLE user_tax_profiles (
    user_id UUID NOT NULL,
    jurisdiction_id VARCHAR(50) NOT NULL,
    exempt BOOLEAN NOT NULL DEFAULT false,
    exemption_reason TEXT,
    primary_address_id UUID,
    last_validated_at TIMESTAMP WITH TIME ZONE,
    validation_confidence NUMERIC(4,3) DEFAULT 1.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (user_id, jurisdiction_id),
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id)
);

-- Exemption alerts (expiry warnings, validation failures, etc.)
CREATE TABLE exemption_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'expiry_warning', 'expired', 'renewal_required', 
        'validation_failed', 'suspicious_usage'
    )),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    certificate_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    
    FOREIGN KEY (certificate_id) REFERENCES exemption_certificates(id)
);

-- Exemption audit logs for compliance tracking
CREATE TABLE exemption_audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    certificate_id VARCHAR(255),
    user_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (certificate_id) REFERENCES exemption_certificates(id)
);

-- Indexes for performance
CREATE INDEX idx_exemption_certificates_user_id ON exemption_certificates(user_id);
CREATE INDEX idx_exemption_certificates_jurisdiction ON exemption_certificates(jurisdiction_id, jurisdiction_code);
CREATE INDEX idx_exemption_certificates_status ON exemption_certificates(status);
CREATE INDEX idx_exemption_certificates_expiry ON exemption_certificates(valid_to) WHERE valid_to IS NOT NULL;
CREATE INDEX idx_exemption_certificates_uploaded_at ON exemption_certificates(uploaded_at);
CREATE INDEX idx_exemption_certificates_pending_review ON exemption_certificates(status, uploaded_at) WHERE status = 'pending';

CREATE INDEX idx_exemption_rules_jurisdiction ON exemption_rules(jurisdiction_id);
CREATE INDEX idx_exemption_rules_active ON exemption_rules(is_active, effective_from, effective_to);
CREATE INDEX idx_exemption_rules_type ON exemption_rules(exemption_type);

CREATE INDEX idx_user_tax_profiles_user_id ON user_tax_profiles(user_id);
CREATE INDEX idx_user_tax_profiles_jurisdiction ON user_tax_profiles(jurisdiction_id);
CREATE INDEX idx_user_tax_profiles_exempt ON user_tax_profiles(exempt) WHERE exempt = true;

CREATE INDEX idx_exemption_alerts_certificate ON exemption_alerts(certificate_id);
CREATE INDEX idx_exemption_alerts_user ON exemption_alerts(user_id);
CREATE INDEX idx_exemption_alerts_unacknowledged ON exemption_alerts(acknowledged, created_at) WHERE acknowledged = false;
CREATE INDEX idx_exemption_alerts_type_severity ON exemption_alerts(type, severity);

CREATE INDEX idx_exemption_audit_logs_certificate ON exemption_audit_logs(certificate_id);
CREATE INDEX idx_exemption_audit_logs_user ON exemption_audit_logs(user_id);
CREATE INDEX idx_exemption_audit_logs_created_at ON exemption_audit_logs(created_at);
CREATE INDEX idx_exemption_audit_logs_action ON exemption_audit_logs(action);

-- Seed exemption rules for common scenarios

-- Resale exemptions (most common)
INSERT INTO exemption_rules (
    jurisdiction_id, exemption_type, product_categories, conditions, effective_from
) VALUES
-- California resale exemption
('state_ca', 'resale', ARRAY['DIGITAL_DOWNLOAD', 'DIGITAL_SUBSCRIPTION', 'PHYSICAL_GOODS'], 
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 60,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": false,
        "applicableToShipping": true
    }', '2024-01-01'),

-- New York resale exemption
('state_ny', 'resale', ARRAY['DIGITAL_DOWNLOAD', 'DIGITAL_SUBSCRIPTION', 'PHYSICAL_GOODS'], 
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 36,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": false,
        "applicableToShipping": true
    }', '2024-01-01'),

-- Texas resale exemption
('state_tx', 'resale', ARRAY['DIGITAL_DOWNLOAD', 'DIGITAL_SUBSCRIPTION', 'PHYSICAL_GOODS'], 
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 48,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": false,
        "applicableToShipping": true
    }', '2024-01-01'),

-- Florida resale exemption
('state_fl', 'resale', ARRAY['DIGITAL_DOWNLOAD', 'DIGITAL_SUBSCRIPTION', 'PHYSICAL_GOODS'], 
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 60,
        "requiresRenewal": true,
        "applicableToDigitalGoods": false,
        "applicableToServices": false,
        "applicableToShipping": true
    }', '2024-01-01');

-- Nonprofit exemptions
INSERT INTO exemption_rules (
    jurisdiction_id, exemption_type, product_categories, conditions, effective_from
) VALUES
-- California nonprofit exemption
('state_ca', 'nonprofit', '{}', 
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 120,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

-- New York nonprofit exemption  
('state_ny', 'nonprofit', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 120,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

-- Texas nonprofit exemption
('state_tx', 'nonprofit', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 120,
        "requiresRenewal": true,
        "applicableToDigitalGoods": false,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

-- Florida nonprofit exemption
('state_fl', 'nonprofit', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 120,
        "requiresRenewal": true,
        "applicableToDigitalGoods": false,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01');

-- Government exemptions
INSERT INTO exemption_rules (
    jurisdiction_id, exemption_type, product_categories, conditions, effective_from
) VALUES
-- Universal government exemption (most states)
('state_ca', 'government', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": null,
        "requiresRenewal": false,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

('state_ny', 'government', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": null,
        "requiresRenewal": false,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

('state_tx', 'government', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": null,
        "requiresRenewal": false,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01'),

('state_fl', 'government', '{}',
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": null,
        "requiresRenewal": false,
        "applicableToDigitalGoods": true,
        "applicableToServices": true,
        "applicableToShipping": true
    }', '2024-01-01');

-- Educational exemptions
INSERT INTO exemption_rules (
    jurisdiction_id, exemption_type, product_categories, conditions, effective_from
) VALUES
-- California educational exemption
('state_ca', 'education', ARRAY['DIGITAL_SUBSCRIPTION', 'DIGITAL_DOWNLOAD'],
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 60,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": false,
        "applicableToShipping": false
    }', '2024-01-01'),

-- New York educational exemption
('state_ny', 'education', ARRAY['DIGITAL_SUBSCRIPTION', 'DIGITAL_DOWNLOAD'],
    '{
        "requiresCertificate": true,
        "allowsPartialExemption": false,
        "validityPeriodMonths": 36,
        "requiresRenewal": true,
        "applicableToDigitalGoods": true,
        "applicableToServices": false,
        "applicableToShipping": false
    }', '2024-01-01');

-- Add triggers for updated_at
CREATE TRIGGER update_exemption_certificates_updated_at 
    BEFORE UPDATE ON exemption_certificates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exemption_rules_updated_at 
    BEFORE UPDATE ON exemption_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tax_profiles_updated_at 
    BEFORE UPDATE ON user_tax_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Active exemptions view
CREATE OR REPLACE VIEW active_exemptions AS
SELECT 
    ec.id,
    ec.user_id,
    ec.certificate_number,
    ec.exemption_type,
    ec.organization_name,
    ec.jurisdiction_id,
    ec.jurisdiction_code,
    ec.valid_from,
    ec.valid_to,
    ec.uploaded_at,
    ec.reviewed_at,
    CASE 
        WHEN ec.valid_to IS NOT NULL AND ec.valid_to < CURRENT_DATE THEN true
        ELSE false
    END as is_expired,
    CASE 
        WHEN ec.valid_to IS NOT NULL THEN 
            EXTRACT(days FROM ec.valid_to - CURRENT_DATE)::integer
        ELSE NULL
    END as days_until_expiry
FROM exemption_certificates ec
WHERE ec.status = 'approved'
ORDER BY ec.jurisdiction_code, ec.user_id;

-- Exemption review queue view
CREATE OR REPLACE VIEW exemption_review_queue AS
SELECT 
    ec.id,
    ec.user_id,
    ec.certificate_number,
    ec.exemption_type,
    ec.organization_name,
    ec.jurisdiction_code,
    ec.uploaded_at,
    ec.file_url,
    ec.metadata,
    EXTRACT(days FROM NOW() - ec.uploaded_at)::integer as days_pending
FROM exemption_certificates ec
WHERE ec.status = 'pending'
ORDER BY ec.uploaded_at;

-- Expiring certificates view
CREATE OR REPLACE VIEW expiring_certificates AS
SELECT 
    ec.id,
    ec.user_id,
    ec.certificate_number,
    ec.exemption_type,
    ec.organization_name,
    ec.jurisdiction_code,
    ec.valid_to,
    EXTRACT(days FROM ec.valid_to - CURRENT_DATE)::integer as days_until_expiry
FROM exemption_certificates ec
WHERE ec.status = 'approved'
  AND ec.valid_to IS NOT NULL
  AND ec.valid_to >= CURRENT_DATE
  AND ec.valid_to <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY ec.valid_to;

-- Exemption usage analytics view
CREATE OR REPLACE VIEW exemption_usage_analytics AS
WITH exemption_usage AS (
    SELECT 
        ec.jurisdiction_code,
        ec.exemption_type,
        COUNT(*) as certificate_count,
        COUNT(*) FILTER (WHERE ec.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE ec.status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE ec.status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE ec.status = 'expired') as expired_count,
        AVG(EXTRACT(days FROM ec.reviewed_at - ec.uploaded_at)) FILTER (WHERE ec.reviewed_at IS NOT NULL) as avg_review_days
    FROM exemption_certificates ec
    GROUP BY ec.jurisdiction_code, ec.exemption_type
)
SELECT 
    eu.*,
    ROUND((eu.approved_count::numeric / NULLIF(eu.certificate_count, 0)) * 100, 2) as approval_rate,
    ROUND((eu.rejected_count::numeric / NULLIF(eu.certificate_count, 0)) * 100, 2) as rejection_rate
FROM exemption_usage eu
ORDER BY eu.jurisdiction_code, eu.exemption_type;

-- Comments for documentation
COMMENT ON TABLE exemption_certificates IS 'Stores uploaded tax exemption certificates with approval workflow';
COMMENT ON TABLE exemption_rules IS 'Defines exemption rules per jurisdiction and product category';
COMMENT ON TABLE user_tax_profiles IS 'User-specific tax profiles including exemption status per jurisdiction';
COMMENT ON TABLE exemption_alerts IS 'Alerts for certificate expiry, validation failures, and other events';
COMMENT ON TABLE exemption_audit_logs IS 'Complete audit trail of exemption management actions';

COMMENT ON COLUMN exemption_certificates.file_hash IS 'SHA-256 hash of uploaded file for integrity verification';
COMMENT ON COLUMN exemption_certificates.metadata IS 'Upload context: source, IP, user agent, business info, notes';
COMMENT ON COLUMN exemption_rules.conditions IS 'JSON conditions: certificate requirements, validity, digital goods applicability';
COMMENT ON COLUMN user_tax_profiles.validation_confidence IS 'Confidence score (0.000-1.000) for address validation';

-- Performance monitoring query examples (commented out - for reference)
/*
-- Find certificates pending review longer than 5 days
SELECT * FROM exemption_review_queue WHERE days_pending > 5;

-- Find certificates expiring in next 30 days
SELECT * FROM expiring_certificates WHERE days_until_expiry <= 30;

-- Exemption approval rates by jurisdiction
SELECT jurisdiction_code, approval_rate, rejection_rate 
FROM exemption_usage_analytics 
WHERE certificate_count >= 10
ORDER BY approval_rate DESC;

-- Recent exemption activity
SELECT action, COUNT(*) as count
FROM exemption_audit_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;
*/
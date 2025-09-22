-- Economic Nexus Monitoring Tables
-- FANZ Unified Ecosystem - Tax Compliance
-- 
-- Tables for tracking nexus thresholds, metrics, alerts, and registrations

-- Nexus thresholds configuration
CREATE TABLE nexus_thresholds (
    jurisdiction_id VARCHAR(50) PRIMARY KEY,
    jurisdiction_name VARCHAR(255) NOT NULL,
    jurisdiction_code VARCHAR(10) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL CHECK (threshold_type IN ('revenue', 'transactions', 'both')),
    revenue_threshold DECIMAL(15,2), -- e.g., $100,000
    transaction_threshold INTEGER, -- e.g., 200 transactions
    lookback_period VARCHAR(20) NOT NULL DEFAULT 'rolling_12_months' 
        CHECK (lookback_period IN ('current_year', 'rolling_12_months', 'calendar_year')),
    effective_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nexus metrics aggregation (daily/period rollups)
CREATE TABLE nexus_metrics (
    id SERIAL PRIMARY KEY,
    jurisdiction_id VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    total_tax_collected DECIMAL(15,2) NOT NULL DEFAULT 0,
    unique_customers INTEGER NOT NULL DEFAULT 0,
    platform_breakdown JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id),
    UNIQUE(jurisdiction_id, period_start, period_end)
);

-- Nexus alerts (threshold warnings, registrations required, etc.)
CREATE TABLE nexus_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'threshold_warning', 
        'threshold_exceeded', 
        'registration_required', 
        'deadline_approaching'
    )),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    jurisdiction_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id)
);

-- Nexus registrations (track registration status per jurisdiction)
CREATE TABLE nexus_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id VARCHAR(50) UNIQUE NOT NULL,
    jurisdiction_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    registration_date DATE,
    expiration_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_required' CHECK (status IN (
        'not_required', 
        'required', 
        'pending', 
        'registered', 
        'expired',
        'cancelled'
    )),
    filing_frequency VARCHAR(20) CHECK (filing_frequency IN ('monthly', 'quarterly', 'annually')),
    next_filing_due DATE,
    contact_info JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (jurisdiction_id) REFERENCES nexus_thresholds(jurisdiction_id)
);

-- Add transaction link table for nexus tracking
CREATE TABLE tax_transaction_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_calculation_id UUID NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    customer_id VARCHAR(255),
    platform VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (tax_calculation_id) REFERENCES tax_calculations(id),
    UNIQUE(tax_calculation_id, transaction_id)
);

-- Indexes for performance
CREATE INDEX idx_nexus_thresholds_active ON nexus_thresholds(is_active) WHERE is_active = true;
CREATE INDEX idx_nexus_thresholds_jurisdiction_code ON nexus_thresholds(jurisdiction_code);

CREATE INDEX idx_nexus_metrics_jurisdiction_period ON nexus_metrics(jurisdiction_id, period_start, period_end);
CREATE INDEX idx_nexus_metrics_last_updated ON nexus_metrics(last_updated);

CREATE INDEX idx_nexus_alerts_jurisdiction ON nexus_alerts(jurisdiction_id);
CREATE INDEX idx_nexus_alerts_unacknowledged ON nexus_alerts(acknowledged, created_at) WHERE acknowledged = false;
CREATE INDEX idx_nexus_alerts_type_severity ON nexus_alerts(type, severity);

CREATE INDEX idx_nexus_registrations_jurisdiction ON nexus_registrations(jurisdiction_id);
CREATE INDEX idx_nexus_registrations_status ON nexus_registrations(status);
CREATE INDEX idx_nexus_registrations_filing_due ON nexus_registrations(next_filing_due) WHERE next_filing_due IS NOT NULL;

CREATE INDEX idx_tax_transaction_links_calc_id ON tax_transaction_links(tax_calculation_id);
CREATE INDEX idx_tax_transaction_links_transaction_id ON tax_transaction_links(transaction_id);
CREATE INDEX idx_tax_transaction_links_platform ON tax_transaction_links(platform);
CREATE INDEX idx_tax_transaction_links_customer ON tax_transaction_links(customer_id);
CREATE INDEX idx_tax_transaction_links_created_at ON tax_transaction_links(created_at);

-- Seed data for common US state nexus thresholds
INSERT INTO nexus_thresholds (
    jurisdiction_id, jurisdiction_name, jurisdiction_code, 
    threshold_type, revenue_threshold, transaction_threshold, 
    lookback_period, effective_date, metadata
) VALUES
-- Major states with economic nexus laws
('state_ca', 'California', 'CA', 'revenue', 500000.00, NULL, 'rolling_12_months', '2019-04-01', 
    '{"remoteSellerLaw": "CA Rev & Tax Code §6203", "source": "CDTFA", "lastUpdated": "2024-01-01"}'),
    
('state_ny', 'New York', 'NY', 'both', 500000.00, 100, 'rolling_12_months', '2019-06-21',
    '{"remoteSellerLaw": "NY Tax Law §1131", "source": "NYDTF", "lastUpdated": "2024-01-01"}'),
    
('state_tx', 'Texas', 'TX', 'revenue', 500000.00, NULL, 'rolling_12_months', '2019-10-01',
    '{"remoteSellerLaw": "TX Tax Code §151.107", "source": "Texas Comptroller", "lastUpdated": "2024-01-01"}'),
    
('state_fl', 'Florida', 'FL', 'revenue', 100000.00, NULL, 'rolling_12_months', '2021-07-01',
    '{"remoteSellerLaw": "FL Stat §212.05", "source": "FL DOR", "lastUpdated": "2024-01-01"}'),
    
('state_il', 'Illinois', 'IL', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "IL Rev Stat §86-757.1", "source": "IDOR", "lastUpdated": "2024-01-01"}'),
    
('state_pa', 'Pennsylvania', 'PA', 'revenue', 100000.00, NULL, 'rolling_12_months', '2018-07-01',
    '{"remoteSellerLaw": "PA Code §58.1", "source": "PA DOR", "lastUpdated": "2024-01-01"}'),
    
('state_oh', 'Ohio', 'OH', 'both', 100000.00, 200, 'rolling_12_months', '2018-08-01',
    '{"remoteSellerLaw": "OH Rev Code §5741.17", "source": "OH DTC", "lastUpdated": "2024-01-01"}'),
    
('state_mi', 'Michigan', 'MI', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "MI Comp Laws §205.52d", "source": "MI Treasury", "lastUpdated": "2024-01-01"}'),
    
('state_ga', 'Georgia', 'GA', 'both', 100000.00, 200, 'rolling_12_months', '2019-01-01',
    '{"remoteSellerLaw": "GA Code §48-8-2", "source": "GA DOR", "lastUpdated": "2024-01-01"}'),
    
('state_nc', 'North Carolina', 'NC', 'both', 100000.00, 200, 'rolling_12_months', '2018-11-01',
    '{"remoteSellerLaw": "NC Gen Stat §105-164.8", "source": "NCDOR", "lastUpdated": "2024-01-01"}'),
    
('state_nj', 'New Jersey', 'NJ', 'both', 100000.00, 200, 'rolling_12_months', '2018-11-01',
    '{"remoteSellerLaw": "NJ Rev Stat §54:32B-2", "source": "NJ Treasury", "lastUpdated": "2024-01-01"}'),
    
('state_va', 'Virginia', 'VA', 'both', 100000.00, 200, 'rolling_12_months', '2019-07-01',
    '{"remoteSellerLaw": "VA Code §58.1-612", "source": "VA TAX", "lastUpdated": "2024-01-01"}'),
    
('state_wa', 'Washington', 'WA', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "WA Rev Code §82.60.070", "source": "WA DOR", "lastUpdated": "2024-01-01"}'),
    
('state_ma', 'Massachusetts', 'MA', 'both', 100000.00, 100, 'rolling_12_months', '2019-10-01',
    '{"remoteSellerLaw": "MA Gen Laws ch. 64H §1", "source": "MA DOR", "lastUpdated": "2024-01-01"}'),
    
('state_in', 'Indiana', 'IN', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "IN Code §6-2.5-2-1", "source": "IN DOR", "lastUpdated": "2024-01-01"}'),
    
('state_tn', 'Tennessee', 'TN', 'revenue', 500000.00, NULL, 'rolling_12_months', '2019-10-01',
    '{"remoteSellerLaw": "TN Code §67-6-102", "source": "TN DOR", "lastUpdated": "2024-01-01"}'),
    
('state_mo', 'Missouri', 'MO', 'revenue', 100000.00, NULL, 'rolling_12_months', '2021-01-01',
    '{"remoteSellerLaw": "MO Rev Stat §144.605", "source": "MO DOR", "lastUpdated": "2024-01-01"}'),
    
('state_md', 'Maryland', 'MD', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "MD Code §11-701", "source": "Comptroller MD", "lastUpdated": "2024-01-01"}'),
    
('state_wi', 'Wisconsin', 'WI', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "WI Stat §77.51", "source": "WI DOR", "lastUpdated": "2024-01-01"}'),
    
('state_mn', 'Minnesota', 'MN', 'both', 100000.00, 100, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "MN Stat §297A.66", "source": "MN DOR", "lastUpdated": "2024-01-01"}'),
    
('state_co', 'Colorado', 'CO', 'both', 100000.00, 200, 'rolling_12_months', '2018-12-01',
    '{"remoteSellerLaw": "CO Rev Stat §39-26-102", "source": "CO DOR", "lastUpdated": "2024-01-01"}'),
    
('state_al', 'Alabama', 'AL', 'revenue', 250000.00, NULL, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "AL Code §40-23-190", "source": "AL DOR", "lastUpdated": "2024-01-01"}'),
    
('state_sc', 'South Carolina', 'SC', 'both', 100000.00, 200, 'rolling_12_months', '2018-11-01',
    '{"remoteSellerLaw": "SC Code §12-36-2691", "source": "SC DOR", "lastUpdated": "2024-01-01"}'),
    
('state_la', 'Louisiana', 'LA', 'both', 100000.00, 200, 'rolling_12_months', '2018-07-01',
    '{"remoteSellerLaw": "LA Rev Stat §47:301", "source": "LA DOR", "lastUpdated": "2024-01-01"}'),
    
('state_ky', 'Kentucky', 'KY', 'both', 100000.00, 200, 'rolling_12_months', '2018-10-01',
    '{"remoteSellerLaw": "KY Rev Stat §139.200", "source": "KY DOR", "lastUpdated": "2024-01-01"}'),
    
('state_or', 'Oregon', 'OR', 'revenue', 0, NULL, 'rolling_12_months', '2018-01-01',
    '{"remoteSellerLaw": "No sales tax", "source": "OR DOR", "lastUpdated": "2024-01-01", "notes": "No sales tax"}'),
    
('state_mt', 'Montana', 'MT', 'revenue', 0, NULL, 'rolling_12_months', '2018-01-01',
    '{"remoteSellerLaw": "No sales tax", "source": "MT DOR", "lastUpdated": "2024-01-01", "notes": "No sales tax"}'),
    
('state_nh', 'New Hampshire', 'NH', 'revenue', 0, NULL, 'rolling_12_months', '2018-01-01',
    '{"remoteSellerLaw": "No sales tax", "source": "NH DRA", "lastUpdated": "2024-01-01", "notes": "No sales tax"}'),
    
('state_de', 'Delaware', 'DE', 'revenue', 0, NULL, 'rolling_12_months', '2018-01-01',
    '{"remoteSellerLaw": "No sales tax", "source": "DE DOR", "lastUpdated": "2024-01-01", "notes": "No sales tax"}'),
    
-- District of Columbia
('state_dc', 'District of Columbia', 'DC', 'both', 100000.00, 200, 'rolling_12_months', '2019-01-01',
    '{"remoteSellerLaw": "DC Code §47-2001", "source": "DC OTR", "lastUpdated": "2024-01-01"}')
;

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_nexus_thresholds_updated_at 
    BEFORE UPDATE ON nexus_thresholds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nexus_registrations_updated_at 
    BEFORE UPDATE ON nexus_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- Current nexus status view
CREATE OR REPLACE VIEW nexus_status_summary AS
WITH current_metrics AS (
    SELECT 
        nm.jurisdiction_id,
        nm.total_revenue,
        nm.total_transactions,
        nm.last_updated,
        ROW_NUMBER() OVER (PARTITION BY nm.jurisdiction_id ORDER BY nm.last_updated DESC) as rn
    FROM nexus_metrics nm
),
alert_counts AS (
    SELECT 
        jurisdiction_id,
        COUNT(*) as unacknowledged_alerts,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts
    FROM nexus_alerts 
    WHERE acknowledged = false 
    GROUP BY jurisdiction_id
)
SELECT 
    nt.jurisdiction_id,
    nt.jurisdiction_name,
    nt.jurisdiction_code,
    nt.threshold_type,
    nt.revenue_threshold,
    nt.transaction_threshold,
    COALESCE(cm.total_revenue, 0) as current_revenue,
    COALESCE(cm.total_transactions, 0) as current_transactions,
    CASE 
        WHEN nt.revenue_threshold IS NOT NULL THEN 
            ROUND((COALESCE(cm.total_revenue, 0) / nt.revenue_threshold * 100), 2)
        ELSE NULL
    END as revenue_progress_pct,
    CASE 
        WHEN nt.transaction_threshold IS NOT NULL THEN 
            ROUND((COALESCE(cm.total_transactions, 0)::NUMERIC / nt.transaction_threshold * 100), 2)
        ELSE NULL
    END as transaction_progress_pct,
    CASE 
        WHEN nt.threshold_type = 'revenue' AND nt.revenue_threshold IS NOT NULL THEN
            COALESCE(cm.total_revenue, 0) >= nt.revenue_threshold
        WHEN nt.threshold_type = 'transactions' AND nt.transaction_threshold IS NOT NULL THEN
            COALESCE(cm.total_transactions, 0) >= nt.transaction_threshold
        WHEN nt.threshold_type = 'both' THEN
            (nt.revenue_threshold IS NOT NULL AND COALESCE(cm.total_revenue, 0) >= nt.revenue_threshold) OR
            (nt.transaction_threshold IS NOT NULL AND COALESCE(cm.total_transactions, 0) >= nt.transaction_threshold)
        ELSE false
    END as threshold_met,
    COALESCE(nr.status, 'not_required') as registration_status,
    COALESCE(ac.unacknowledged_alerts, 0) as unacknowledged_alerts,
    COALESCE(ac.critical_alerts, 0) as critical_alerts,
    cm.last_updated as metrics_last_updated
FROM nexus_thresholds nt
LEFT JOIN current_metrics cm ON nt.jurisdiction_id = cm.jurisdiction_id AND cm.rn = 1
LEFT JOIN nexus_registrations nr ON nt.jurisdiction_id = nr.jurisdiction_id
LEFT JOIN alert_counts ac ON nt.jurisdiction_id = ac.jurisdiction_id
WHERE nt.is_active = true
ORDER BY nt.jurisdiction_code;
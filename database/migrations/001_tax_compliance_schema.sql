-- Tax Compliance Database Schema Extension
-- FANZ Unified Ecosystem - Complete Tax Management System
-- Migration: 001_tax_compliance_schema.sql

BEGIN;

-- ============================================
-- TAX JURISDICTION MANAGEMENT
-- ============================================

-- Tax jurisdictions (state, county, city, special districts)
CREATE TABLE IF NOT EXISTS tax_jurisdiction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL DEFAULT 'US',
  state_code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('state','county','city','special')),
  name TEXT NOT NULL,
  code TEXT,
  parent_id UUID REFERENCES tax_jurisdiction(id),
  fips TEXT,
  gnis TEXT,
  geocode POINT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax product categories
CREATE TABLE IF NOT EXISTS tax_product_category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tax_classification TEXT NOT NULL,
  provider_codes JSONB DEFAULT '{}'::jsonb,
  default_taxability TEXT NOT NULL CHECK (default_taxability IN ('taxable','exempt','varies_by_state','usually_taxable','usually_exempt')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform SKU to tax category mapping
CREATE TABLE IF NOT EXISTS tax_product_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  tax_category_id UUID NOT NULL REFERENCES tax_product_category(id),
  description TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform_name, sku, effective_from)
);

-- Tax rates by jurisdiction and product category
CREATE TABLE IF NOT EXISTS tax_rate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdiction(id),
  product_category_id UUID REFERENCES tax_product_category(id),
  rate NUMERIC(7,6) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  taxability TEXT NOT NULL CHECK (taxability IN ('taxable','exempt','reduced')),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  rule_ref TEXT,
  provider_source TEXT,
  last_updated_from_provider TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complex tax rules in JSON format
CREATE TABLE IF NOT EXISTS tax_rule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdiction(id),
  product_category_id UUID REFERENCES tax_product_category(id),
  rule_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1000,
  json_rules JSONB NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- REGISTRATION AND NEXUS MANAGEMENT
-- ============================================

-- State registrations
CREATE TABLE IF NOT EXISTS tax_registration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL,
  registration_number TEXT,
  permit_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_registered','pending','active','suspended','revoked')) DEFAULT 'not_registered',
  registered_at DATE,
  filing_frequency TEXT CHECK (filing_frequency IN ('monthly','quarterly','annual')),
  next_due_date DATE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  registration_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(state_code)
);

-- Economic nexus thresholds by state
CREATE TABLE IF NOT EXISTS tax_nexus_threshold (
  state_code TEXT PRIMARY KEY,
  revenue_threshold NUMERIC(18,2),
  transaction_threshold INTEGER,
  lookback_months INTEGER NOT NULL DEFAULT 12,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily nexus metrics tracking
CREATE TABLE IF NOT EXISTS tax_nexus_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  transactions INTEGER NOT NULL DEFAULT 0,
  threshold_reached BOOLEAN NOT NULL DEFAULT FALSE,
  reached_at TIMESTAMPTZ,
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(state_code, period_start)
);

-- ============================================
-- USER TAX PROFILES AND ADDRESSES
-- ============================================

-- User addresses for tax determination
CREATE TABLE IF NOT EXISTS user_address (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing','shipping','primary')),
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state_code TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  geocode POINT,
  fips_code TEXT,
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validation_confidence NUMERIC(4,3) CHECK (validation_confidence >= 0 AND validation_confidence <= 1),
  validation_service TEXT,
  validated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User tax profiles
CREATE TABLE IF NOT EXISTS user_tax_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  primary_address_id UUID REFERENCES user_address(id),
  billing_address_id UUID REFERENCES user_address(id),
  tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  exemption_reason TEXT,
  exemption_certificate_id UUID,
  last_address_validated_at TIMESTAMPTZ,
  validation_confidence NUMERIC(4,3) CHECK (validation_confidence >= 0 AND validation_confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creator tax profiles for 1099 reporting
CREATE TABLE IF NOT EXISTS creator_tax_profile (
  creator_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  tax_id_type TEXT CHECK (tax_id_type IN ('ssn','ein')),
  tax_id_encrypted TEXT,
  tax_id_last_four TEXT,
  business_type TEXT CHECK (business_type IN ('individual','sole_proprietor','partnership','corporation','llc')),
  w9_status TEXT NOT NULL CHECK (w9_status IN ('not_collected','pending','validated','rejected')) DEFAULT 'not_collected',
  w9_collected_at TIMESTAMPTZ,
  w9_document_url TEXT,
  backup_withholding BOOLEAN NOT NULL DEFAULT FALSE,
  withholding_rate NUMERIC(5,4) DEFAULT 0.24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TAX CALCULATION ENGINE
-- ============================================

-- Tax calculations (quotes and committed)
CREATE TABLE IF NOT EXISTS tax_calculation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id TEXT UNIQUE,
  transaction_id UUID REFERENCES transactions(id),
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('quoted','committed','voided','refunded','adjusted')) DEFAULT 'quoted',
  
  -- Calculation details
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_amount NUMERIC(18,2) NOT NULL,
  taxable_amount NUMERIC(18,2) NOT NULL,
  tax_amount NUMERIC(18,2) NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL,
  
  -- Address and jurisdiction info (snapshot)
  destination_address JSONB NOT NULL,
  jurisdiction_snapshot JSONB NOT NULL,
  
  -- Complete request/response audit trail
  request_payload JSONB NOT NULL,
  result_payload JSONB NOT NULL,
  provider_used TEXT,
  provider_transaction_id TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  committed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Individual line items within tax calculations
CREATE TABLE IF NOT EXISTS tax_calculation_line (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calc_id UUID NOT NULL REFERENCES tax_calculation(id) ON DELETE CASCADE,
  line_ref TEXT NOT NULL,
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdiction(id),
  product_category_id UUID NOT NULL REFERENCES tax_product_category(id),
  
  -- Line item details
  quantity NUMERIC(18,6) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,6) NOT NULL,
  line_amount NUMERIC(18,2) NOT NULL,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  taxable_amount NUMERIC(18,2) NOT NULL,
  
  -- Tax calculation
  rate NUMERIC(7,6) NOT NULL,
  tax_amount NUMERIC(18,2) NOT NULL,
  
  -- Rule references
  rule_id UUID REFERENCES tax_rule(id),
  rate_id UUID REFERENCES tax_rate(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link tax calculations to transactions
CREATE TABLE IF NOT EXISTS tax_transaction_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  tax_calculation_id UUID NOT NULL REFERENCES tax_calculation(id),
  link_type TEXT NOT NULL CHECK (link_type IN ('original','adjustment','refund')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id, tax_calculation_id)
);

-- ============================================
-- EXEMPTION MANAGEMENT
-- ============================================

-- Tax exemption certificates
CREATE TABLE IF NOT EXISTS tax_exemption_certificate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  state_code TEXT NOT NULL,
  certificate_number TEXT,
  exemption_type TEXT NOT NULL,
  entity_name TEXT,
  valid_from DATE,
  valid_to DATE,
  
  -- Document storage
  file_url TEXT,
  file_hash TEXT,
  file_size INTEGER,
  
  -- Review workflow
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','expired')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- REPORTING AND FILING
-- ============================================

-- Tax filing periods
CREATE TABLE IF NOT EXISTS tax_filing_period (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly','quarterly','annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','closed','filed','late')) DEFAULT 'open',
  closed_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(state_code, period_start, period_end)
);

-- Tax liability summaries by period
CREATE TABLE IF NOT EXISTS tax_liability_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_period_id UUID NOT NULL REFERENCES tax_filing_period(id),
  jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdiction(id),
  
  -- Liability amounts
  gross_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  taxable_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  exempt_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_collected NUMERIC(18,2) NOT NULL DEFAULT 0,
  adjustments NUMERIC(18,2) DEFAULT 0,
  net_tax_due NUMERIC(18,2) NOT NULL DEFAULT 0,
  
  -- Transaction counts
  transaction_count INTEGER NOT NULL DEFAULT 0,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(filing_period_id, jurisdiction_id)
);

-- Tax returns
CREATE TABLE IF NOT EXISTS tax_return (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_period_id UUID NOT NULL REFERENCES tax_filing_period(id),
  return_type TEXT NOT NULL,
  
  -- Return data
  return_data JSONB NOT NULL,
  calculated_tax NUMERIC(18,2) NOT NULL,
  
  -- Filing details
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','accepted','rejected')) DEFAULT 'draft',
  filed_at TIMESTAMPTZ,
  filed_by UUID REFERENCES users(id),
  confirmation_number TEXT,
  
  -- Provider integration
  provider_used TEXT,
  provider_return_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax remittances/payments
CREATE TABLE IF NOT EXISTS tax_remittance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_return_id UUID NOT NULL REFERENCES tax_return(id),
  
  -- Payment details
  amount NUMERIC(18,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending','submitted','cleared','failed')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AUDIT AND COMPLIANCE
-- ============================================

-- Comprehensive audit log
CREATE TABLE IF NOT EXISTS tax_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- User context
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Change details
  operation TEXT NOT NULL CHECK (operation IN ('CREATE','READ','UPDATE','DELETE')),
  old_values JSONB,
  new_values JSONB,
  
  -- Business context
  reason_code TEXT,
  business_justification TEXT,
  compliance_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payout tax withholding for creators
CREATE TABLE IF NOT EXISTS payout_tax_withholding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id UUID NOT NULL, -- References payout system
  creator_id UUID NOT NULL REFERENCES users(id),
  
  -- Withholding calculation
  gross_amount NUMERIC(18,2) NOT NULL,
  withholding_rate NUMERIC(5,4) NOT NULL,
  withholding_amount NUMERIC(18,2) NOT NULL,
  net_amount NUMERIC(18,2) NOT NULL,
  
  -- Tax period
  tax_year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter IN (1,2,3,4)),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('calculated','withheld','remitted')) DEFAULT 'calculated',
  remitted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Tax jurisdiction indexes
CREATE INDEX IF NOT EXISTS idx_tax_jurisdiction_state ON tax_jurisdiction(state_code);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdiction_type ON tax_jurisdiction(type);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdiction_parent ON tax_jurisdiction(parent_id);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdiction_fips ON tax_jurisdiction(fips);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdiction_active ON tax_jurisdiction(effective_from, effective_to);

-- Tax rate indexes
CREATE INDEX IF NOT EXISTS idx_tax_rate_jurisdiction ON tax_rate(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_category ON tax_rate(product_category_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_active ON tax_rate(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_tax_rate_provider ON tax_rate(provider_source, last_updated_from_provider);

-- Product mapping indexes
CREATE INDEX IF NOT EXISTS idx_tax_product_mapping_platform ON tax_product_mapping(platform_name);
CREATE INDEX IF NOT EXISTS idx_tax_product_mapping_sku ON tax_product_mapping(sku);
CREATE INDEX IF NOT EXISTS idx_tax_product_mapping_category ON tax_product_mapping(tax_category_id);
CREATE INDEX IF NOT EXISTS idx_tax_product_mapping_active ON tax_product_mapping(effective_from, effective_to);

-- Tax calculation indexes
CREATE INDEX IF NOT EXISTS idx_tax_calculation_transaction ON tax_calculation(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_quote ON tax_calculation(quote_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_status ON tax_calculation(status);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_created ON tax_calculation(created_at);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_idempotency ON tax_calculation(idempotency_key);

-- User address indexes
CREATE INDEX IF NOT EXISTS idx_user_address_user_id ON user_address(user_id);
CREATE INDEX IF NOT EXISTS idx_user_address_type ON user_address(address_type);
CREATE INDEX IF NOT EXISTS idx_user_address_state ON user_address(state_code);
CREATE INDEX IF NOT EXISTS idx_user_address_postal ON user_address(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_address_active ON user_address(is_active);

-- Nexus metrics indexes
CREATE INDEX IF NOT EXISTS idx_tax_nexus_metrics_state ON tax_nexus_metrics(state_code);
CREATE INDEX IF NOT EXISTS idx_tax_nexus_metrics_period ON tax_nexus_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tax_nexus_metrics_threshold ON tax_nexus_metrics(threshold_reached);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_tax_audit_log_table ON tax_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_tax_audit_log_record ON tax_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_tax_audit_log_user ON tax_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_audit_log_created ON tax_audit_log(created_at);

-- ============================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================

-- Function to log tax table changes
CREATE OR REPLACE FUNCTION log_tax_changes()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        operation_type = 'CREATE';
        INSERT INTO tax_audit_log (
            event_type,
            table_name,
            record_id,
            operation,
            new_values
        ) VALUES (
            'tax_data_change',
            TG_TABLE_NAME,
            NEW.id,
            operation_type,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type = 'UPDATE';
        INSERT INTO tax_audit_log (
            event_type,
            table_name,
            record_id,
            operation,
            old_values,
            new_values
        ) VALUES (
            'tax_data_change',
            TG_TABLE_NAME,
            NEW.id,
            operation_type,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        operation_type = 'DELETE';
        INSERT INTO tax_audit_log (
            event_type,
            table_name,
            record_id,
            operation,
            old_values
        ) VALUES (
            'tax_data_change',
            TG_TABLE_NAME,
            OLD.id,
            operation_type,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers on key tables
CREATE TRIGGER trigger_tax_jurisdiction_audit
    AFTER INSERT OR UPDATE OR DELETE ON tax_jurisdiction
    FOR EACH ROW EXECUTE FUNCTION log_tax_changes();

CREATE TRIGGER trigger_tax_rate_audit
    AFTER INSERT OR UPDATE OR DELETE ON tax_rate
    FOR EACH ROW EXECUTE FUNCTION log_tax_changes();

CREATE TRIGGER trigger_tax_calculation_audit
    AFTER INSERT OR UPDATE OR DELETE ON tax_calculation
    FOR EACH ROW EXECUTE FUNCTION log_tax_changes();

CREATE TRIGGER trigger_tax_registration_audit
    AFTER INSERT OR UPDATE OR DELETE ON tax_registration
    FOR EACH ROW EXECUTE FUNCTION log_tax_changes();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE tax_calculation ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tax_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_exemption_certificate ENABLE ROW LEVEL SECURITY;

-- Policies will be defined based on FanzDash roles
-- (Detailed policies to be implemented during deployment)

COMMIT;
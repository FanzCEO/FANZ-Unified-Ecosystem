-- Tax Compliance Seed Data
-- FANZ Unified Ecosystem - Initial Tax System Data
-- Seed: 002_tax_compliance_seed.sql

BEGIN;

-- ============================================
-- TAX PRODUCT CATEGORIES
-- ============================================

INSERT INTO tax_product_category (id, code, name, description, tax_classification, provider_codes, default_taxability) VALUES
  -- Digital content categories
  (uuid_generate_v4(), 'DIGITAL_DOWNLOAD', 'Digital Downloads', 'Downloadable digital content including videos, images, audio files', 'digital_goods', 
   '{"avalara": "DIGITAL_GOODS", "taxjar": "31000"}'::jsonb, 'varies_by_state'),
   
  (uuid_generate_v4(), 'DIGITAL_STREAM', 'Digital Streaming', 'Real-time streaming content including live streams, on-demand video', 'digital_services',
   '{"avalara": "DIGITAL_SERVICES", "taxjar": "81112"}'::jsonb, 'varies_by_state'),
   
  (uuid_generate_v4(), 'DIGITAL_SUBSCRIPTION', 'Digital Subscriptions', 'Recurring access to digital content or services', 'digital_services',
   '{"avalara": "DIGITAL_SERVICES", "taxjar": "81112"}'::jsonb, 'varies_by_state'),
   
  -- Service categories
  (uuid_generate_v4(), 'MEMBERSHIP_FEE', 'Membership Fees', 'Platform membership or access fees', 'services',
   '{"avalara": "MEMBERSHIP_SERVICES", "taxjar": "81394"}'::jsonb, 'varies_by_state'),
   
  (uuid_generate_v4(), 'PLATFORM_FEE', 'Platform Service Fees', 'Transaction fees, processing fees, platform usage fees', 'services',
   '{"avalara": "PLATFORM_SERVICES", "taxjar": "52232"}'::jsonb, 'usually_taxable'),
   
  (uuid_generate_v4(), 'CREATOR_SERVICE', 'Creator Services', 'Services provided by creators (custom content, consultations)', 'professional_services',
   '{"avalara": "PROFESSIONAL_SERVICES", "taxjar": "54169"}'::jsonb, 'varies_by_state'),
   
  -- Non-taxable categories
  (uuid_generate_v4(), 'VOLUNTARY_TIP', 'Voluntary Tips', 'Optional tips given to creators', 'gratuity',
   '{"avalara": "TIPS_GRATUITIES", "taxjar": "99999"}'::jsonb, 'usually_exempt'),
   
  (uuid_generate_v4(), 'DONATION', 'Donations', 'Charitable or voluntary donations', 'donation',
   '{"avalara": "DONATIONS", "taxjar": "99999"}'::jsonb, 'exempt'),
   
  (uuid_generate_v4(), 'GIFT_CARD', 'Gift Cards', 'Prepaid gift cards or credits', 'stored_value',
   '{"avalara": "GIFT_CARDS", "taxjar": "99999"}'::jsonb, 'exempt'),
   
  -- Physical goods
  (uuid_generate_v4(), 'PHYSICAL_GOODS', 'Physical Goods', 'Physical merchandise, collectibles, tangible products', 'tangible_personal_property',
   '{"avalara": "TANGIBLE_PERSONAL_PROPERTY", "taxjar": "00000"}'::jsonb, 'taxable'),
   
  (uuid_generate_v4(), 'SHIPPING', 'Shipping and Handling', 'Shipping, delivery, and handling charges', 'shipping',
   '{"avalara": "SHIPPING", "taxjar": "92000"}'::jsonb, 'varies_by_state');

-- ============================================
-- TAX NEXUS THRESHOLDS (All US States)
-- ============================================

INSERT INTO tax_nexus_threshold (state_code, revenue_threshold, transaction_threshold, lookback_months, effective_date, notes) VALUES
  -- States with revenue thresholds only
  ('AL', 250000, NULL, 12, '2018-10-01', 'Alabama'),
  ('AZ', 200000, NULL, 12, '2019-10-01', 'Arizona'),
  ('CA', 500000, NULL, 12, '2019-04-01', 'California'),
  ('CO', 100000, NULL, 12, '2019-06-01', 'Colorado'),
  ('FL', 100000, NULL, 12, '2021-07-01', 'Florida'),
  ('ID', 100000, NULL, 12, '2019-06-01', 'Idaho'),
  ('IA', 100000, NULL, 12, '2019-01-01', 'Iowa'),
  ('KS', 100000, NULL, 12, '2019-07-01', 'Kansas'),
  ('ME', 100000, NULL, 12, '2018-07-01', 'Maine'),
  ('MA', 100000, NULL, 12, '2019-10-01', 'Massachusetts'),
  ('MS', 250000, NULL, 12, '2019-09-01', 'Mississippi'),
  ('MO', 100000, NULL, 12, '2023-01-01', 'Missouri'),
  ('NM', 100000, NULL, 12, '2019-07-01', 'New Mexico'),
  ('ND', 100000, NULL, 12, '2018-10-01', 'North Dakota'),
  ('OK', 100000, NULL, 12, '2018-07-01', 'Oklahoma'),
  ('PA', 100000, NULL, 12, '2018-07-01', 'Pennsylvania'),
  ('SC', 100000, NULL, 12, '2018-11-01', 'South Carolina'),
  ('TN', 100000, NULL, 12, '2019-10-01', 'Tennessee'),
  ('TX', 500000, NULL, 12, '2019-10-01', 'Texas'),
  ('WA', 100000, NULL, 12, '2018-10-01', 'Washington'),
  ('WI', 100000, NULL, 12, '2018-10-01', 'Wisconsin'),
  
  -- States with both revenue and transaction thresholds
  ('AR', 100000, 200, 12, '2019-07-01', 'Arkansas'),
  ('CT', 100000, 200, 12, '2018-12-01', 'Connecticut'),
  ('GA', 100000, 200, 12, '2019-01-01', 'Georgia'),
  ('HI', 100000, 200, 12, '2020-07-01', 'Hawaii'),
  ('IL', 100000, 200, 12, '2019-10-01', 'Illinois'),
  ('IN', 100000, 200, 12, '2018-10-01', 'Indiana'),
  ('KY', 100000, 200, 12, '2018-10-01', 'Kentucky'),
  ('LA', 100000, 200, 12, '2019-01-01', 'Louisiana'),
  ('MD', 100000, 200, 12, '2019-10-01', 'Maryland'),
  ('MI', 100000, 200, 12, '2018-10-01', 'Michigan'),
  ('MN', 100000, 200, 12, '2018-10-01', 'Minnesota'),
  ('NE', 100000, 200, 12, '2019-01-01', 'Nebraska'),
  ('NV', 100000, 200, 12, '2018-10-01', 'Nevada'),
  ('NJ', 100000, 200, 12, '2018-11-01', 'New Jersey'),
  ('NC', 100000, 200, 12, '2018-11-01', 'North Carolina'),
  ('OH', 100000, 200, 12, '2019-08-01', 'Ohio'),
  ('RI', 100000, 200, 12, '2019-07-01', 'Rhode Island'),
  ('SD', 100000, 200, 12, '2018-11-01', 'South Dakota - Original Wayfair case state'),
  ('UT', 100000, 200, 12, '2019-01-01', 'Utah'),
  ('VT', 100000, 200, 12, '2018-07-01', 'Vermont'),
  ('VA', 100000, 200, 12, '2019-07-01', 'Virginia'),
  ('WV', 100000, 200, 12, '2019-01-01', 'West Virginia'),
  ('DC', 100000, 200, 12, '2019-01-01', 'District of Columbia'),
  
  -- Wyoming (Home State) - already registered
  ('WY', 100000, 200, 12, '2019-02-01', 'Wyoming - Home State'),
  
  -- New York (special threshold)
  ('NY', 500000, 100, 12, '2019-06-21', 'New York');
  
-- Note: States without sales tax (AK, DE, MT, NH, OR) are not included

-- ============================================
-- TAX REGISTRATIONS
-- ============================================

-- Wyoming home state registration (active)
INSERT INTO tax_registration (
  id,
  state_code,
  registration_number,
  permit_number,
  status,
  registered_at,
  filing_frequency,
  next_due_date,
  contact_name,
  contact_email,
  registration_metadata
) VALUES (
  uuid_generate_v4(),
  'WY',
  'WY-0000000',  -- Placeholder - to be updated with actual number
  'WY-PERMIT-0000',
  'active',
  '2025-09-16',
  'quarterly',
  '2025-12-31',
  'FANZ Tax Compliance',
  'tax-compliance@myfanz.network',
  '{"business_address": "Sheridan, WY", "home_state": true}'::jsonb
);

-- Placeholder registrations for future states (not_registered status)
INSERT INTO tax_registration (state_code, status) VALUES
  ('CA', 'not_registered'),
  ('TX', 'not_registered'),
  ('NY', 'not_registered'),
  ('FL', 'not_registered'),
  ('IL', 'not_registered'),
  ('PA', 'not_registered'),
  ('OH', 'not_registered'),
  ('GA', 'not_registered'),
  ('NC', 'not_registered'),
  ('MI', 'not_registered'),
  ('NJ', 'not_registered'),
  ('VA', 'not_registered'),
  ('WA', 'not_registered'),
  ('AZ', 'not_registered'),
  ('MA', 'not_registered'),
  ('TN', 'not_registered'),
  ('IN', 'not_registered'),
  ('MO', 'not_registered'),
  ('MD', 'not_registered'),
  ('WI', 'not_registered'),
  ('CO', 'not_registered'),
  ('MN', 'not_registered'),
  ('SC', 'not_registered'),
  ('AL', 'not_registered'),
  ('LA', 'not_registered'),
  ('KY', 'not_registered'),
  ('UT', 'not_registered'),
  ('IA', 'not_registered'),
  ('NV', 'not_registered'),
  ('AR', 'not_registered'),
  ('MS', 'not_registered'),
  ('KS', 'not_registered'),
  ('NM', 'not_registered'),
  ('NE', 'not_registered'),
  ('WV', 'not_registered'),
  ('ID', 'not_registered'),
  ('HI', 'not_registered'),
  ('ME', 'not_registered'),
  ('RI', 'not_registered'),
  ('CT', 'not_registered'),
  ('ND', 'not_registered'),
  ('SD', 'not_registered'),
  ('OK', 'not_registered'),
  ('VT', 'not_registered'),
  ('DC', 'not_registered');

-- ============================================
-- SAMPLE JURISDICTIONS (Core States)
-- ============================================

-- Wyoming jurisdictions
INSERT INTO tax_jurisdiction (id, country_code, state_code, type, name, code, parent_id, fips, effective_from) VALUES
  (uuid_generate_v4(), 'US', 'WY', 'state', 'Wyoming', 'WY', NULL, '56', '2025-01-01');

-- Get Wyoming state jurisdiction ID for parent reference
DO $$
DECLARE
    wy_state_id UUID;
BEGIN
    SELECT id INTO wy_state_id FROM tax_jurisdiction WHERE state_code = 'WY' AND type = 'state';
    
    -- Wyoming counties
    INSERT INTO tax_jurisdiction (id, country_code, state_code, type, name, code, parent_id, fips, effective_from) VALUES
        (uuid_generate_v4(), 'US', 'WY', 'county', 'Sheridan County', 'SHERIDAN', wy_state_id, '56033', '2025-01-01'),
        (uuid_generate_v4(), 'US', 'WY', 'county', 'Laramie County', 'LARAMIE', wy_state_id, '56021', '2025-01-01');
END $$;

-- California jurisdictions (for testing complex tax scenarios)
INSERT INTO tax_jurisdiction (id, country_code, state_code, type, name, code, parent_id, fips, effective_from) VALUES
  (uuid_generate_v4(), 'US', 'CA', 'state', 'California', 'CA', NULL, '06', '2025-01-01');

DO $$
DECLARE
    ca_state_id UUID;
BEGIN
    SELECT id INTO ca_state_id FROM tax_jurisdiction WHERE state_code = 'CA' AND type = 'state';
    
    -- California major counties
    INSERT INTO tax_jurisdiction (id, country_code, state_code, type, name, code, parent_id, fips, effective_from) VALUES
        (uuid_generate_v4(), 'US', 'CA', 'county', 'Los Angeles County', 'LOS_ANGELES', ca_state_id, '06037', '2025-01-01'),
        (uuid_generate_v4(), 'US', 'CA', 'county', 'San Francisco County', 'SAN_FRANCISCO', ca_state_id, '06075', '2025-01-01'),
        (uuid_generate_v4(), 'US', 'CA', 'county', 'Orange County', 'ORANGE', ca_state_id, '06059', '2025-01-01'),
        (uuid_generate_v4(), 'US', 'CA', 'county', 'Santa Clara County', 'SANTA_CLARA', ca_state_id, '06085', '2025-01-01');
END $$;

-- ============================================
-- SAMPLE TAX RATES
-- ============================================

-- Wyoming tax rates (business-friendly, no digital goods tax)
DO $$
DECLARE
    wy_state_id UUID;
    digital_download_cat UUID;
    digital_stream_cat UUID;
    digital_sub_cat UUID;
    platform_fee_cat UUID;
    physical_goods_cat UUID;
BEGIN
    SELECT id INTO wy_state_id FROM tax_jurisdiction WHERE state_code = 'WY' AND type = 'state';
    SELECT id INTO digital_download_cat FROM tax_product_category WHERE code = 'DIGITAL_DOWNLOAD';
    SELECT id INTO digital_stream_cat FROM tax_product_category WHERE code = 'DIGITAL_STREAM';
    SELECT id INTO digital_sub_cat FROM tax_product_category WHERE code = 'DIGITAL_SUBSCRIPTION';
    SELECT id INTO platform_fee_cat FROM tax_product_category WHERE code = 'PLATFORM_FEE';
    SELECT id INTO physical_goods_cat FROM tax_product_category WHERE code = 'PHYSICAL_GOODS';
    
    -- Wyoming rates - digital goods exempt, physical goods taxable
    INSERT INTO tax_rate (jurisdiction_id, product_category_id, rate, taxability, effective_from, provider_source) VALUES
        (wy_state_id, digital_download_cat, 0.000000, 'exempt', '2025-01-01', 'internal'),
        (wy_state_id, digital_stream_cat, 0.000000, 'exempt', '2025-01-01', 'internal'),
        (wy_state_id, digital_sub_cat, 0.000000, 'exempt', '2025-01-01', 'internal'),
        (wy_state_id, platform_fee_cat, 0.040000, 'taxable', '2025-01-01', 'internal'),
        (wy_state_id, physical_goods_cat, 0.040000, 'taxable', '2025-01-01', 'internal');
END $$;

-- California tax rates (digital goods taxable)
DO $$
DECLARE
    ca_state_id UUID;
    digital_download_cat UUID;
    digital_stream_cat UUID;
    digital_sub_cat UUID;
    platform_fee_cat UUID;
    physical_goods_cat UUID;
BEGIN
    SELECT id INTO ca_state_id FROM tax_jurisdiction WHERE state_code = 'CA' AND type = 'state';
    SELECT id INTO digital_download_cat FROM tax_product_category WHERE code = 'DIGITAL_DOWNLOAD';
    SELECT id INTO digital_stream_cat FROM tax_product_category WHERE code = 'DIGITAL_STREAM';
    SELECT id INTO digital_sub_cat FROM tax_product_category WHERE code = 'DIGITAL_SUBSCRIPTION';
    SELECT id INTO platform_fee_cat FROM tax_product_category WHERE code = 'PLATFORM_FEE';
    SELECT id INTO physical_goods_cat FROM tax_product_category WHERE code = 'PHYSICAL_GOODS';
    
    -- California rates - most digital goods taxable at base rate
    INSERT INTO tax_rate (jurisdiction_id, product_category_id, rate, taxability, effective_from, provider_source) VALUES
        (ca_state_id, digital_download_cat, 0.072500, 'taxable', '2025-01-01', 'internal'),
        (ca_state_id, digital_stream_cat, 0.072500, 'taxable', '2025-01-01', 'internal'),
        (ca_state_id, digital_sub_cat, 0.072500, 'taxable', '2025-01-01', 'internal'),
        (ca_state_id, platform_fee_cat, 0.072500, 'taxable', '2025-01-01', 'internal'),
        (ca_state_id, physical_goods_cat, 0.072500, 'taxable', '2025-01-01', 'internal');
END $$;

-- ============================================
-- PLATFORM SKU MAPPINGS (Sample Data)
-- ============================================

DO $$
DECLARE
    digital_sub_cat UUID;
    voluntary_tip_cat UUID;
    digital_download_cat UUID;
    digital_stream_cat UUID;
    physical_goods_cat UUID;
    platform_fee_cat UUID;
BEGIN
    SELECT id INTO digital_sub_cat FROM tax_product_category WHERE code = 'DIGITAL_SUBSCRIPTION';
    SELECT id INTO voluntary_tip_cat FROM tax_product_category WHERE code = 'VOLUNTARY_TIP';
    SELECT id INTO digital_download_cat FROM tax_product_category WHERE code = 'DIGITAL_DOWNLOAD';
    SELECT id INTO digital_stream_cat FROM tax_product_category WHERE code = 'DIGITAL_STREAM';
    SELECT id INTO physical_goods_cat FROM tax_product_category WHERE code = 'PHYSICAL_GOODS';
    SELECT id INTO platform_fee_cat FROM tax_product_category WHERE code = 'PLATFORM_FEE';
    
    -- Core FANZ platform mappings
    INSERT INTO tax_product_mapping (platform_name, sku, tax_category_id, description, effective_from) VALUES
        ('fanz', 'SUB_MONTHLY_BASIC', digital_sub_cat, 'Monthly basic subscription', '2025-01-01'),
        ('fanz', 'SUB_MONTHLY_PREMIUM', digital_sub_cat, 'Monthly premium subscription', '2025-01-01'),
        ('fanz', 'SUB_ANNUAL_BASIC', digital_sub_cat, 'Annual basic subscription', '2025-01-01'),
        ('fanz', 'TIP_SMALL', voluntary_tip_cat, 'Small tip ($1-10)', '2025-01-01'),
        ('fanz', 'TIP_MEDIUM', voluntary_tip_cat, 'Medium tip ($11-50)', '2025-01-01'),
        ('fanz', 'TIP_LARGE', voluntary_tip_cat, 'Large tip ($51+)', '2025-01-01'),
        ('fanz', 'PPV_VIDEO', digital_download_cat, 'Pay-per-view video content', '2025-01-01'),
        ('fanz', 'PPV_IMAGE_SET', digital_download_cat, 'Pay-per-view image collection', '2025-01-01'),
        
        -- FanzTube platform mappings
        ('fanztube', 'TUBE_MONTHLY', digital_sub_cat, 'FanzTube monthly subscription', '2025-01-01'),
        ('fanztube', 'TUBE_PPV_VIDEO', digital_stream_cat, 'Pay-per-view streaming video', '2025-01-01'),
        ('fanztube', 'TUBE_LIVE_ACCESS', digital_stream_cat, 'Live stream access', '2025-01-01'),
        
        -- FanzCommerce platform mappings
        ('fanzcommerce', 'MERCH_TSHIRT', physical_goods_cat, 'Physical merchandise - t-shirt', '2025-01-01'),
        ('fanzcommerce', 'MERCH_POSTER', physical_goods_cat, 'Physical merchandise - poster', '2025-01-01'),
        ('fanzcommerce', 'DIGITAL_WALLPAPER', digital_download_cat, 'Digital wallpaper downloads', '2025-01-01'),
        
        -- Platform service fees
        ('fanzdash', 'ADMIN_FEE', platform_fee_cat, 'Administrative service fee', '2025-01-01'),
        ('fanzfiliate', 'AFFILIATE_COMMISSION', platform_fee_cat, 'Affiliate commission processing', '2025-01-01');
END $$;

-- ============================================
-- INITIAL FILING PERIODS (Wyoming)
-- ============================================

-- Create quarterly filing periods for Wyoming (2025)
INSERT INTO tax_filing_period (state_code, period_type, period_start, period_end, due_date, status) VALUES
  ('WY', 'quarterly', '2025-01-01', '2025-03-31', '2025-04-30', 'open'),
  ('WY', 'quarterly', '2025-04-01', '2025-06-30', '2025-07-31', 'open'),
  ('WY', 'quarterly', '2025-07-01', '2025-09-30', '2025-10-31', 'open'),
  ('WY', 'quarterly', '2025-10-01', '2025-12-31', '2026-01-31', 'open');

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify seed data installation
SELECT 'Tax Product Categories' as table_name, count(*) as record_count FROM tax_product_category
UNION ALL
SELECT 'Nexus Thresholds', count(*) FROM tax_nexus_threshold
UNION ALL  
SELECT 'Tax Registrations', count(*) FROM tax_registration
UNION ALL
SELECT 'Tax Jurisdictions', count(*) FROM tax_jurisdiction
UNION ALL
SELECT 'Tax Rates', count(*) FROM tax_rate
UNION ALL
SELECT 'Product Mappings', count(*) FROM tax_product_mapping
UNION ALL
SELECT 'Filing Periods', count(*) FROM tax_filing_period;

-- Show Wyoming registration details
SELECT 
  state_code,
  registration_number,
  status,
  filing_frequency,
  next_due_date,
  registration_metadata->>'home_state' as is_home_state
FROM tax_registration 
WHERE state_code = 'WY';

-- Show sample product categories
SELECT 
  code,
  name,
  tax_classification,
  default_taxability
FROM tax_product_category 
ORDER BY code;
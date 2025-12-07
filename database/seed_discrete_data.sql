-- =====================================================
-- FanzDiscreete Seed Data
-- =====================================================
-- Initial data for FanzDiscreete payment privacy system
-- CCBill merchant configuration and descriptor templates
-- =====================================================

\echo 'Seeding FanzDiscreete data...'

-- =====================================================
-- CCBill Merchant Accounts (under Grp Hldings)
-- =====================================================

INSERT INTO discrete.ccbill_merchants (
    merchant_id,
    merchant_name,
    merchant_descriptor,
    merchant_type,
    ccbill_account_number,
    ccbill_sub_account,
    is_active,
    parent_entity,
    flexforms_id,
    supported_currencies,
    supported_countries,
    tenant_id,
    platform_id,
    created_by
) VALUES
-- Gift Card Purchases
(
    'GH_COMMERCE_001',
    'Grp Hldings Commerce',
    'GH Commerce',
    'gift_card',
    '999999', -- Replace with actual CCBill account
    '0001',
    TRUE,
    'Grp Hldings LLC',
    'ghc_001',
    ARRAY['USD', 'EUR', 'GBP', 'CAD'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    '00000000-0000-0000-0000-000000000001',
    'fanzmoneydash',
    NULL
),

-- Balance Reloads
(
    'GH_DIGITAL_001',
    'Grp Hldings Digital Services',
    'GH Digital Services',
    'balance_reload',
    '999999', -- Replace with actual CCBill account
    '0002',
    TRUE,
    'Grp Hldings LLC',
    'ghd_001',
    ARRAY['USD', 'EUR', 'GBP', 'CAD'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    '00000000-0000-0000-0000-000000000001',
    'fanzmoneydash',
    NULL
),

-- Subscription Payments
(
    'GH_GIFT_001',
    'Grp Hldings Gift Purchase',
    'GH Gift Purchase',
    'subscription',
    '999999', -- Replace with actual CCBill account
    '0003',
    TRUE,
    'Grp Hldings LLC',
    'ghg_001',
    ARRAY['USD', 'EUR', 'GBP', 'CAD'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    '00000000-0000-0000-0000-000000000001',
    'fanzmoneydash',
    NULL
),

-- PPV Purchases
(
    'GH_LIFESTYLE_001',
    'Grp Hldings Lifestyle Services',
    'GH Lifestyle Services',
    'ppv',
    '999999', -- Replace with actual CCBill account
    '0004',
    TRUE,
    'Grp Hldings LLC',
    'ghl_001',
    ARRAY['USD', 'EUR', 'GBP', 'CAD'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    '00000000-0000-0000-0000-000000000001',
    'fanzmoneydash',
    NULL
);

\echo '  ✓ Inserted 4 CCBill merchant configurations'

-- =====================================================
-- Billing Descriptor Templates
-- =====================================================

INSERT INTO discrete.descriptor_templates (
    merchant_id,
    descriptor_text,
    descriptor_category,
    min_amount_cents,
    max_amount_cents,
    applicable_transaction_types,
    applicable_countries,
    is_active,
    tenant_id
) VALUES
-- Commerce descriptors
(
    'GH_COMMERCE_001',
    'GH Commerce',
    'digital_goods',
    1000,      -- $10 minimum
    100000,    -- $1,000 maximum
    ARRAY['gift_card'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),
(
    'GH_COMMERCE_001',
    'GH Digital Products',
    'digital_goods',
    100,       -- $1 minimum
    50000,     -- $500 maximum
    ARRAY['gift_card'],
    ARRAY['US', 'CA', 'UK', 'EU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),

-- Digital Services descriptors
(
    'GH_DIGITAL_001',
    'GH Digital Services',
    'digital_goods',
    1000,      -- $10 minimum
    500000,    -- $5,000 maximum
    ARRAY['balance_reload'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),
(
    'GH_DIGITAL_001',
    'GH Online Services',
    'entertainment',
    500,       -- $5 minimum
    100000,    -- $1,000 maximum
    ARRAY['balance_reload'],
    ARRAY['US', 'CA', 'UK', 'EU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),

-- Gift Purchase descriptors
(
    'GH_GIFT_001',
    'GH Gift Purchase',
    'lifestyle',
    500,       -- $5 minimum
    10000,     -- $100 maximum
    ARRAY['subscription'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),
(
    'GH_GIFT_001',
    'GH Membership',
    'digital_goods',
    1000,      -- $10 minimum
    50000,     -- $500 maximum
    ARRAY['subscription'],
    ARRAY['US', 'CA', 'UK', 'EU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),

-- Lifestyle Services descriptors
(
    'GH_LIFESTYLE_001',
    'GH Lifestyle Services',
    'lifestyle',
    100,       -- $1 minimum
    20000,     -- $200 maximum
    ARRAY['ppv'],
    ARRAY['US', 'CA', 'UK', 'EU', 'AU', 'NZ'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
),
(
    'GH_LIFESTYLE_001',
    'GH Premium Content',
    'entertainment',
    500,       -- $5 minimum
    50000,     -- $500 maximum
    ARRAY['ppv'],
    ARRAY['US', 'CA', 'UK', 'EU'],
    TRUE,
    '00000000-0000-0000-0000-000000000001'
);

\echo '  ✓ Inserted 8 billing descriptor templates'

-- =====================================================
-- Feature Flags for FanzDiscreete
-- =====================================================

-- Enable FanzDiscreete globally
INSERT INTO features.flags (
    flag_key,
    flag_name,
    description,
    is_enabled,
    flag_type,
    rollout_percentage,
    tenant_id
) VALUES (
    'fanzdiscrete_enabled',
    'FanzDiscreete Payment Privacy',
    'Enable FanzDiscreete discreet payment cards with neutral billing descriptors via CCBill',
    TRUE,
    'boolean',
    100,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (flag_key, tenant_id) DO NOTHING;

-- Enable gift cards
INSERT INTO features.flags (
    flag_key,
    flag_name,
    description,
    is_enabled,
    flag_type,
    rollout_percentage,
    tenant_id
) VALUES (
    'fanzdiscrete_gift_cards',
    'FanzDiscreete Gift Cards',
    'Enable FanzDiscreete gift cards that can be sent anonymously',
    TRUE,
    'boolean',
    100,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (flag_key, tenant_id) DO NOTHING;

-- Enable vault mode
INSERT INTO features.flags (
    flag_key,
    flag_name,
    description,
    is_enabled,
    flag_type,
    rollout_percentage,
    tenant_id
) VALUES (
    'fanzdiscrete_vault_mode',
    'FanzDiscreete Vault Mode',
    'Enable vault mode for hiding transactions behind biometric/PIN protection',
    TRUE,
    'boolean',
    100,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (flag_key, tenant_id) DO NOTHING;

-- Enable crypto loading (future)
INSERT INTO features.flags (
    flag_key,
    flag_name,
    description,
    is_enabled,
    flag_type,
    rollout_percentage,
    tenant_id
) VALUES (
    'fanzdiscrete_crypto_loading',
    'FanzDiscreete Crypto Loading',
    'Enable loading FanzDiscreete cards with cryptocurrency (BTC, ETH, USDT, USDC)',
    FALSE,  -- Not yet enabled
    'boolean',
    0,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (flag_key, tenant_id) DO NOTHING;

\echo '  ✓ Inserted 4 FanzDiscreete feature flags'

-- =====================================================
-- Sample Configuration Data
-- =====================================================

-- Add FanzDiscreete configuration to platform config
INSERT INTO config.platform_config (
    config_key,
    config_value,
    config_type,
    description,
    is_encrypted,
    platform_id,
    tenant_id
) VALUES
-- Default card limits
(
    'fanzdiscrete.default_max_balance',
    '500000', -- $5,000
    'integer',
    'Default maximum balance for FanzDiscreete cards (in cents)',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.default_daily_limit',
    '100000', -- $1,000
    'integer',
    'Default daily spending limit for FanzDiscreete cards (in cents)',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.default_monthly_limit',
    '500000', -- $5,000
    'integer',
    'Default monthly spending limit for FanzDiscreete cards (in cents)',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),

-- Gift card settings
(
    'fanzdiscrete.gift_card_expiry_days',
    '365', -- 1 year
    'integer',
    'Number of days until gift cards expire',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.min_gift_card_amount',
    '1000', -- $10
    'integer',
    'Minimum gift card purchase amount (in cents)',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.max_gift_card_amount',
    '100000', -- $1,000
    'integer',
    'Maximum gift card purchase amount (in cents)',
    FALSE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),

-- CCBill settings (encrypted)
(
    'fanzdiscrete.ccbill_merchant_account',
    '999999', -- Replace with actual CCBill account
    'string',
    'Primary CCBill merchant account number',
    TRUE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.ccbill_api_username',
    'CHANGE_ME', -- Replace with actual CCBill API username
    'string',
    'CCBill API username for transaction processing',
    TRUE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
),
(
    'fanzdiscrete.ccbill_api_password',
    'CHANGE_ME', -- Replace with actual CCBill API password
    'string',
    'CCBill API password for transaction processing',
    TRUE,
    'fanzmoneydash',
    '00000000-0000-0000-0000-000000000001'
);

\echo '  ✓ Inserted 9 FanzDiscreete configuration settings'

-- =====================================================
-- Verification
-- =====================================================

\echo ''
\echo 'FanzDiscreete data verification:'
\echo ''

SELECT 'CCBill Merchants:' as check_type, COUNT(*)::text as count
FROM discrete.ccbill_merchants
UNION ALL
SELECT 'Descriptor Templates:', COUNT(*)::text
FROM discrete.descriptor_templates
UNION ALL
SELECT 'Feature Flags:', COUNT(*)::text
FROM features.flags
WHERE flag_key LIKE 'fanzdiscrete%'
UNION ALL
SELECT 'Config Settings:', COUNT(*)::text
FROM config.platform_config
WHERE config_key LIKE 'fanzdiscrete%';

\echo ''
\echo '✅ FanzDiscreete seed data loaded successfully'
\echo ''

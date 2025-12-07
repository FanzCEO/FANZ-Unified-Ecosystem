-- =====================================================
-- FANZ Unified Ecosystem - Seed Data
-- =====================================================
-- Initial data for development and testing
-- Run AFTER schema initialization
--
-- Usage:
--   psql fanz_ecosystem -f seed_data.sql
-- =====================================================

\set ON_ERROR_STOP on

\echo ''
\echo '========================================='
\echo '  FANZ Seed Data Installation'
\echo '========================================='
\echo ''

-- =====================================================
-- Create Main Tenant
-- =====================================================

\echo 'Creating main tenant...'

INSERT INTO registry.tenants (
    tenant_id,
    tenant_name,
    tenant_type,
    billing_plan,
    billing_cycle,
    status,
    admin_email,
    support_email,
    max_platforms,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FANZ Unlimited Network',
    'production',
    'enterprise',
    'annual',
    'active',
    'admin@fanzunlimited.com',
    'support@fanzunlimited.com',
    100,
    NOW()
) ON CONFLICT (tenant_id) DO NOTHING;

\echo '  ✓ Main tenant created'
\echo ''

-- =====================================================
-- Register All 94 Platforms
-- =====================================================

\echo 'Registering all 94 platforms...'

-- Core Platforms (13)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('boyfanz', 'boyfanz', 'Boy Fanz', 'core', 'boyfanz.com', 'https://api.boyfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('girlfanz', 'girlfanz', 'Girl Fanz', 'core', 'girlfanz.com', 'https://api.girlfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('pupfanz', 'pupfanz', 'Pup Fanz', 'core', 'pupfanz.com', 'https://api.pupfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('transfanz', 'transfanz', 'Trans Fanz', 'core', 'transfanz.com', 'https://api.transfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('taboofanz', 'taboofanz', 'Taboo Fanz', 'core', 'taboofanz.com', 'https://api.taboofanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('bearfanz', 'bearfanz', 'Bear Fanz', 'core', 'bearfanz.com', 'https://api.bearfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('cougarfanz', 'cougarfanz', 'Cougar Fanz', 'core', 'cougarfanz.com', 'https://api.cougarfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('gayfanz', 'gayfanz', 'Gay Fanz', 'core', 'gayfanz.com', 'https://api.gayfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('femmefanz', 'femmefanz', 'Femme Fanz', 'core', 'femmefanz.com', 'https://api.femmefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('guyz', 'guyz', 'Guyz', 'core', 'guyz.com', 'https://api.guyz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('dlbroz', 'dlbroz', 'DL Broz', 'core', 'dlbroz.com', 'https://api.dlbroz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('southernfanz', 'southernfanz', 'Southern Fanz', 'core', 'southernfanz.com', 'https://api.southernfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzuncut', 'fanzuncut', 'Fanz Uncut', 'core', 'fanzuncut.com', 'https://api.fanzuncut.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- Infrastructure Platforms (7)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('fanzdash', 'fanzdash', 'Fanz Dashboard', 'infrastructure', 'fanzdash.com', 'https://api.fanzdash.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzmoneydash', 'fanzmoneydash', 'Fanz Money Dashboard', 'infrastructure', 'fanzmoneydash.com', 'https://api.fanzmoneydash.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzfinance', 'fanzfinance', 'Fanz Finance', 'infrastructure', 'fanzfinance.com', 'https://api.fanzfinance.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzhub', 'fanzhub', 'Fanz Hub', 'infrastructure', 'fanzhub.com', 'https://api.fanzhub.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzcentral', 'fanzcentral', 'Fanz Central', 'infrastructure', 'fanzcentral.com', 'https://api.fanzcentral.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanztube', 'fanztube', 'Fanz Tube', 'infrastructure', 'fanztube.com', 'https://api.fanztube.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzclips', 'fanzclips', 'Fanz Clips', 'infrastructure', 'fanzclips.com', 'https://api.fanzclips.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- Niche Platforms (20)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('daddyfanz', 'daddyfanz', 'Daddy Fanz', 'niche', 'daddyfanz.com', 'https://api.daddyfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('mommyfanz', 'mommyfanz', 'Mommy Fanz', 'niche', 'mommyfanz.com', 'https://api.mommyfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('milfanz', 'milfanz', 'MILF Fanz', 'niche', 'milfanz.com', 'https://api.milfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('dilfanz', 'dilfanz', 'DILF Fanz', 'niche', 'dilfanz.com', 'https://api.dilfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('twinkfanz', 'twinkfanz', 'Twink Fanz', 'niche', 'twinkfanz.com', 'https://api.twinkfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('otterfanz', 'otterfanz', 'Otter Fanz', 'niche', 'otterfanz.com', 'https://api.otterfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('cubfanz', 'cubfanz', 'Cub Fanz', 'niche', 'cubfanz.com', 'https://api.cubfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('studfanz', 'studfanz', 'Stud Fanz', 'niche', 'studfanz.com', 'https://api.studfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('jockfanz', 'jockfanz', 'Jock Fanz', 'niche', 'jockfanz.com', 'https://api.jockfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('geekfanz', 'geekfanz', 'Geek Fanz', 'niche', 'geekfanz.com', 'https://api.geekfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('gothfanz', 'gothfanz', 'Goth Fanz', 'niche', 'gothfanz.com', 'https://api.gothfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('emofanz', 'emofanz', 'Emo Fanz', 'niche', 'emofanz.com', 'https://api.emofanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('punkfanz', 'punkfanz', 'Punk Fanz', 'niche', 'punkfanz.com', 'https://api.punkfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('metalfanz', 'metalfanz', 'Metal Fanz', 'niche', 'metalfanz.com', 'https://api.metalfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('hipsterfanz', 'hipsterfanz', 'Hipster Fanz', 'niche', 'hipsterfanz.com', 'https://api.hipsterfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('skaterfanz', 'skaterfanz', 'Skater Fanz', 'niche', 'skaterfanz.com', 'https://api.skaterfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('surferfanz', 'surferfanz', 'Surfer Fanz', 'niche', 'surferfanz.com', 'https://api.surferfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('yogafanz', 'yogafanz', 'Yoga Fanz', 'niche', 'yogafanz.com', 'https://api.yogafanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fitfanz', 'fitfanz', 'Fit Fanz', 'niche', 'fitfanz.com', 'https://api.fitfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('musclefanz', 'musclefanz', 'Muscle Fanz', 'niche', 'musclefanz.com', 'https://api.musclefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- International Platforms (20)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('fanzasia', 'fanzasia', 'Fanz Asia', 'international', 'fanzasia.com', 'https://api.fanzasia.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzeurope', 'fanzeurope', 'Fanz Europe', 'international', 'fanzeurope.com', 'https://api.fanzeurope.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzlatam', 'fanzlatam', 'Fanz Latin America', 'international', 'fanzlatam.com', 'https://api.fanzlatam.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzafrica', 'fanzafrica', 'Fanz Africa', 'international', 'fanzafrica.com', 'https://api.fanzafrica.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzaustralia', 'fanzaustralia', 'Fanz Australia', 'international', 'fanzaustralia.com', 'https://api.fanzaustralia.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzcanada', 'fanzcanada', 'Fanz Canada', 'international', 'fanzcanada.com', 'https://api.fanzcanada.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzuk', 'fanzuk', 'Fanz UK', 'international', 'fanzuk.com', 'https://api.fanzuk.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzfrance', 'fanzfrance', 'Fanz France', 'international', 'fanzfrance.com', 'https://api.fanzfrance.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzgermany', 'fanzgermany', 'Fanz Germany', 'international', 'fanzgermany.com', 'https://api.fanzgermany.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzspain', 'fanzspain', 'Fanz Spain', 'international', 'fanzspain.com', 'https://api.fanzspain.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzitaly', 'fanzitaly', 'Fanz Italy', 'international', 'fanzitaly.com', 'https://api.fanzitaly.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzbrazil', 'fanzbrazil', 'Fanz Brazil', 'international', 'fanzbrazil.com', 'https://api.fanzbrazil.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzmexico', 'fanzmexico', 'Fanz Mexico', 'international', 'fanzmexico.com', 'https://api.fanzmexico.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzjapan', 'fanzjapan', 'Fanz Japan', 'international', 'fanzjapan.com', 'https://api.fanzjapan.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzkorea', 'fanzkorea', 'Fanz Korea', 'international', 'fanzkorea.com', 'https://api.fanzkorea.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzchina', 'fanzchina', 'Fanz China', 'international', 'fanzchina.com', 'https://api.fanzchina.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzindia', 'fanzindia', 'Fanz India', 'international', 'fanzindia.com', 'https://api.fanzindia.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzrussia', 'fanzrussia', 'Fanz Russia', 'international', 'fanzrussia.com', 'https://api.fanzrussia.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzpoland', 'fanzpoland', 'Fanz Poland', 'international', 'fanzpoland.com', 'https://api.fanzpoland.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzturkey', 'fanzturkey', 'Fanz Turkey', 'international', 'fanzturkey.com', 'https://api.fanzturkey.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- Specialty Platforms (15)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('cosplayfanz', 'cosplayfanz', 'Cosplay Fanz', 'specialty', 'cosplayfanz.com', 'https://api.cosplayfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('gamerfanz', 'gamerfanz', 'Gamer Fanz', 'specialty', 'gamerfanz.com', 'https://api.gamerfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('techfanz', 'techfanz', 'Tech Fanz', 'specialty', 'techfanz.com', 'https://api.techfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('artfanz', 'artfanz', 'Art Fanz', 'specialty', 'artfanz.com', 'https://api.artfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('musicfanz', 'musicfanz', 'Music Fanz', 'specialty', 'musicfanz.com', 'https://api.musicfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('dancefanz', 'dancefanz', 'Dance Fanz', 'specialty', 'dancefanz.com', 'https://api.dancefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('actorfanz', 'actorfanz', 'Actor Fanz', 'specialty', 'actorfanz.com', 'https://api.actorfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('modelfanz', 'modelfanz', 'Model Fanz', 'specialty', 'modelfanz.com', 'https://api.modelfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('athletefanz', 'athletefanz', 'Athlete Fanz', 'specialty', 'athletefanz.com', 'https://api.athletefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('cheffanz', 'cheffanz', 'Chef Fanz', 'specialty', 'cheffanz.com', 'https://api.cheffanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('teacherfanz', 'teacherfanz', 'Teacher Fanz', 'specialty', 'teacherfanz.com', 'https://api.teacherfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('nursefanz', 'nursefanz', 'Nurse Fanz', 'specialty', 'nursefanz.com', 'https://api.nursefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('firefighterfanz', 'firefighterfanz', 'Firefighter Fanz', 'specialty', 'firefighterfanz.com', 'https://api.firefighterfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('policefanz', 'policefanz', 'Police Fanz', 'specialty', 'policefanz.com', 'https://api.policefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('militaryfanz', 'militaryfanz', 'Military Fanz', 'specialty', 'militaryfanz.com', 'https://api.militaryfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- Body Positive Platforms (6)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('plusfanz', 'plusfanz', 'Plus Fanz', 'specialty', 'plusfanz.com', 'https://api.plusfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('curvyfanz', 'curvyfanz', 'Curvy Fanz', 'specialty', 'curvyfanz.com', 'https://api.curvyfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('thickfanz', 'thickfanz', 'Thick Fanz', 'specialty', 'thickfanz.com', 'https://api.thickfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('bbwfanz', 'bbwfanz', 'BBW Fanz', 'specialty', 'bbwfanz.com', 'https://api.bbwfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('bhfanz', 'bhfanz', 'BH Fanz', 'specialty', 'bhfanz.com', 'https://api.bhfanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('maturefanz', 'maturefanz', 'Mature Fanz', 'specialty', 'maturefanz.com', 'https://api.maturefanz.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

-- Remaining platforms (13 to reach 94 total)
INSERT INTO registry.platforms (platform_id, platform_name, platform_display_name, platform_type, primary_domain, api_base_url, tenant_id, status, created_at) VALUES
('fanzlive', 'fanzlive', 'Fanz Live', 'infrastructure', 'fanzlive.com', 'https://api.fanzlive.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzstream', 'fanzstream', 'Fanz Stream', 'infrastructure', 'fanzstream.com', 'https://api.fanzstream.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzcam', 'fanzcam', 'Fanz Cam', 'infrastructure', 'fanzcam.com', 'https://api.fanzcam.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzpay', 'fanzpay', 'Fanz Pay', 'infrastructure', 'fanzpay.com', 'https://api.fanzpay.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzcoin', 'fanzcoin', 'Fanz Coin', 'infrastructure', 'fanzcoin.com', 'https://api.fanzcoin.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzvault', 'fanzvault', 'Fanz Vault', 'infrastructure', 'fanzvault.com', 'https://api.fanzvault.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzsecure', 'fanzsecure', 'Fanz Secure', 'infrastructure', 'fanzsecure.com', 'https://api.fanzsecure.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzshield', 'fanzshield', 'Fanz Shield', 'infrastructure', 'fanzshield.com', 'https://api.fanzshield.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzprotect', 'fanzprotect', 'Fanz Protect', 'infrastructure', 'fanzprotect.com', 'https://api.fanzprotect.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzdefender', 'fanzdefender', 'Fanz Defender', 'infrastructure', 'fanzdefender.com', 'https://api.fanzdefender.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzguard', 'fanzguard', 'Fanz Guard', 'infrastructure', 'fanzguard.com', 'https://api.fanzguard.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzlock', 'fanzlock', 'Fanz Lock', 'infrastructure', 'fanzlock.com', 'https://api.fanzlock.com', '00000000-0000-0000-0000-000000000001', 'active', NOW()),
('fanzsafe', 'fanzsafe', 'Fanz Safe', 'infrastructure', 'fanzsafe.com', 'https://api.fanzsafe.com', '00000000-0000-0000-0000-000000000001', 'active', NOW())
ON CONFLICT (platform_id) DO NOTHING;

\echo '  ✓ All 94 platforms registered'
\echo ''

-- =====================================================
-- Create Essential Feature Flags
-- =====================================================

\echo 'Creating essential feature flags...'

INSERT INTO features.flags (flag_key, flag_name, description, flag_type, default_value, is_enabled, category, created_at) VALUES
('enable_custom_content', 'Enable Custom Content Requests', 'Allow fans to request custom content from creators', 'boolean', 'true', true, 'content', NOW()),
('enable_escrow', 'Enable Escrow System', 'Use escrow for custom content payments', 'boolean', 'true', true, 'payments', NOW()),
('enable_live_streaming', 'Enable Live Streaming', 'Allow creators to go live', 'boolean', 'true', true, 'content', NOW()),
('enable_ppv_posts', 'Enable Pay-Per-View Posts', 'Allow creators to create PPV posts', 'boolean', 'true', true, 'content', NOW()),
('enable_bundles', 'Enable Product Bundles', 'Allow creators to create product bundles', 'boolean', 'true', true, 'commerce', NOW()),
('enable_affiliate_program', 'Enable Affiliate Program', 'Allow users to become affiliates', 'boolean', 'true', true, 'commerce', NOW()),
('enable_ai_moderation', 'Enable AI Content Moderation', 'Use AI to moderate content', 'boolean', 'true', true, 'moderation', NOW()),
('enable_recommendations', 'Enable Recommendations', 'Show personalized recommendations', 'boolean', 'true', true, 'discovery', NOW()),
('maintenance_mode', 'Maintenance Mode', 'Put platform in maintenance mode', 'boolean', 'false', false, 'system', NOW()),
('enable_analytics', 'Enable Analytics Tracking', 'Track user analytics events', 'boolean', 'true', true, 'analytics', NOW())
ON CONFLICT (flag_key) DO NOTHING;

\echo '  ✓ Feature flags created'
\echo ''

-- =====================================================
-- Verification
-- =====================================================

\echo '========================================='
\echo '  Seed Data Summary'
\echo '========================================='
\echo ''

\echo 'Tenants created:'
SELECT COUNT(*) as tenant_count FROM registry.tenants;

\echo ''
\echo 'Platforms registered:'
SELECT
    platform_type,
    COUNT(*) as platform_count
FROM registry.platforms
GROUP BY platform_type
ORDER BY platform_type;

\echo ''
\echo 'Total platforms:'
SELECT COUNT(*) as total_platforms FROM registry.platforms;

\echo ''
\echo 'Feature flags created:'
SELECT COUNT(*) as flag_count FROM features.flags;

\echo ''
\echo '========================================='
\echo '  Seed Data Installation Complete!'
\echo '========================================='
\echo ''
\echo 'Next steps:'
\echo '  1. Verify platforms: SELECT * FROM registry.platforms;'
\echo '  2. Check feature flags: SELECT * FROM features.flags;'
\echo '  3. Start connecting platforms to database'
\echo ''

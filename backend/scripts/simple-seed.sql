-- 🌱 Simple FANZ Vendor Access Seed Data
-- Just vendor profiles for testing

BEGIN;

-- Insert sample vendor profiles
INSERT INTO vendor_profiles (
    id, email, name, company, vendor_type, contact_info,
    background_check_completed, background_check_date,
    nda_signed, nda_signed_date,
    compliance_training_completed, compliance_training_date,
    status, created_at, updated_at
) VALUES 
(
    gen_random_uuid(), 'support@ccbill.com', 'CCBill Support Team', 'CCBill LLC', 'payment-specialist',
    '{"phone": "+1-888-596-6873", "address": "2353 E Kemper Rd, Cincinnati, OH 45241", "website": "https://ccbill.com"}',
    true, CURRENT_TIMESTAMP - INTERVAL '30 days',
    true, CURRENT_TIMESTAMP - INTERVAL '25 days',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'tech@paxum.com', 'Paxum Technical Support', 'Paxum Inc.', 'payment-specialist',
    '{"phone": "+1-866-729-8601", "address": "Suite 2500, 700 W Georgia St, Vancouver, BC V7Y 1B3, Canada"}',
    true, CURRENT_TIMESTAMP - INTERVAL '28 days',
    true, CURRENT_TIMESTAMP - INTERVAL '23 days',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '33 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'moderation@moderationai.com', 'Content Moderation AI Team', 'ModerationAI Solutions', 'contractor',
    '{"phone": "+1-555-0199", "address": "123 Tech Boulevard, San Francisco, CA 94107"}',
    true, CURRENT_TIMESTAMP - INTERVAL '25 days',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    true, CURRENT_TIMESTAMP - INTERVAL '15 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'support@dataanalytics.co', 'Data Analytics Pro', 'Analytics Corporation', 'consultant',
    '{"phone": "+1-555-0167", "address": "456 Analytics Ave, Austin, TX 73301"}',
    true, CURRENT_TIMESTAMP - INTERVAL '22 days',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    true, CURRENT_TIMESTAMP - INTERVAL '12 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '27 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'help@customersupport.io', 'Customer Success Team', 'Support Solutions LLC', 'support-staff',
    '{"phone": "+1-555-0134", "address": "789 Support Street, Denver, CO 80202"}',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    true, CURRENT_TIMESTAMP - INTERVAL '15 days',
    true, CURRENT_TIMESTAMP - INTERVAL '10 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'compliance@legaltech.com', 'Compliance & Legal Tech', 'LegalTech Solutions', 'compliance-officer',
    '{"phone": "+1-555-0188", "address": "321 Legal Lane, Washington, DC 20001"}',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    true, CURRENT_TIMESTAMP - INTERVAL '12 days',
    true, CURRENT_TIMESTAMP - INTERVAL '8 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '23 days', CURRENT_TIMESTAMP
);

COMMIT;

-- Display summary
\echo ''
\echo '🎉 FANZ Vendor Access Seed Data Created Successfully!'
\echo '=================================================='
\echo ''

-- Show vendor count
SELECT 
    'Total Vendor Profiles' as metric,
    COUNT(*) as count
FROM vendor_profiles;

\echo ''
\echo 'Vendor Types Created:'
SELECT 
    vendor_type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as vendors
FROM vendor_profiles 
GROUP BY vendor_type
ORDER BY vendor_type;

\echo ''
\echo '✅ Sample vendors ready for testing!'
\echo 'Next steps:'
\echo '  1. Start backend server: cd backend && npm run dev'
\echo '  2. Test health: curl http://localhost:3000/api/v1/vendor-access/health'
\echo '  3. List vendors: curl http://localhost:3000/api/v1/vendor-access/vendors'
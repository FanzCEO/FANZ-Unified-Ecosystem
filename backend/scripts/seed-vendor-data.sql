-- 🌱 FANZ Vendor Access Seed Data
-- Sample vendor profiles and access grants for testing

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
    '{"phone": "+1-888-596-6873", "address": "2353 E Kemper Rd, Cincinnati, OH 45241", "website": "https://ccbill.com", "primaryContact": "Sarah Johnson", "emergencyContact": "+1-888-596-6873"}',
    true, CURRENT_TIMESTAMP - INTERVAL '30 days',
    true, CURRENT_TIMESTAMP - INTERVAL '25 days',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'tech@paxum.com', 'Paxum Technical Support', 'Paxum Inc.', 'payment-specialist',
    '{"phone": "+1-866-729-8601", "address": "Suite 2500, 700 W Georgia St, Vancouver, BC V7Y 1B3, Canada", "website": "https://paxum.com", "primaryContact": "Michael Chen", "emergencyContact": "+1-866-729-8601"}',
    true, CURRENT_TIMESTAMP - INTERVAL '28 days',
    true, CURRENT_TIMESTAMP - INTERVAL '23 days',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '33 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'moderation@moderationai.com', 'Content Moderation AI Team', 'ModerationAI Solutions', 'contractor',
    '{"phone": "+1-555-0199", "address": "123 Tech Boulevard, San Francisco, CA 94107", "website": "https://moderationai.com", "primaryContact": "Emma Rodriguez", "emergencyContact": "+1-555-0199"}',
    true, CURRENT_TIMESTAMP - INTERVAL '25 days',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    true, CURRENT_TIMESTAMP - INTERVAL '15 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'support@dataanalytics.co', 'Data Analytics Pro', 'Analytics Corporation', 'consultant',
    '{"phone": "+1-555-0167", "address": "456 Analytics Ave, Austin, TX 73301", "website": "https://dataanalytics.co", "primaryContact": "James Wilson", "emergencyContact": "+1-555-0167"}',
    true, CURRENT_TIMESTAMP - INTERVAL '22 days',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    true, CURRENT_TIMESTAMP - INTERVAL '12 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '27 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'help@customersupport.io', 'Customer Success Team', 'Support Solutions LLC', 'support-staff',
    '{"phone": "+1-555-0134", "address": "789 Support Street, Denver, CO 80202", "website": "https://customersupport.io", "primaryContact": "Lisa Anderson", "emergencyContact": "+1-555-0134"}',
    true, CURRENT_TIMESTAMP - INTERVAL '20 days',
    true, CURRENT_TIMESTAMP - INTERVAL '15 days',
    true, CURRENT_TIMESTAMP - INTERVAL '10 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP
),
(
    gen_random_uuid(), 'compliance@legaltech.com', 'Compliance & Legal Tech', 'LegalTech Solutions', 'compliance-officer',
    '{"phone": "+1-555-0188", "address": "321 Legal Lane, Washington, DC 20001", "website": "https://legaltech.com", "primaryContact": "Robert Kim", "emergencyContact": "+1-555-0188"}',
    true, CURRENT_TIMESTAMP - INTERVAL '18 days',
    true, CURRENT_TIMESTAMP - INTERVAL '12 days',
    true, CURRENT_TIMESTAMP - INTERVAL '8 days',
    'approved', CURRENT_TIMESTAMP - INTERVAL '23 days', CURRENT_TIMESTAMP
);

-- Create access grants for the vendors
WITH vendor_data AS (
    SELECT 
        id as vendor_id,
        vendor_type,
        name
    FROM vendor_profiles 
    WHERE email IN ('support@ccbill.com', 'tech@paxum.com', 'moderation@moderationai.com', 'support@dataanalytics.co', 'help@customersupport.io', 'compliance@legaltech.com')
)
INSERT INTO access_grants (
    id, vendor_id, granted_by, categories, access_level, restrictions,
    start_time, end_time, max_duration_hours, extendable, auto_renew,
    required_approvers, current_approvals, approved, approved_at, approved_by,
    status, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    vd.vendor_id,
    gen_random_uuid(),
    CASE 
        WHEN vd.vendor_type = 'payment-specialist' THEN ARRAY['payment-processing']
        WHEN vd.vendor_type = 'contractor' THEN ARRAY['content-moderation']
        WHEN vd.vendor_type = 'consultant' THEN ARRAY['analytics-readonly']
        WHEN vd.vendor_type = 'support-staff' THEN ARRAY['customer-support']
        WHEN vd.vendor_type = 'compliance-officer' THEN ARRAY['admin-panel-staff']
        ELSE ARRAY['customer-support']
    END,
    CASE 
        WHEN vd.vendor_type = 'payment-specialist' THEN 'full'
        WHEN vd.vendor_type = 'compliance-officer' THEN 'write'
        ELSE 'read'
    END,
    CASE 
        WHEN vd.vendor_type = 'payment-specialist' THEN '{"ipWhitelist": ["*"], "maxConcurrentSessions": 3, "allowedEndpoints": ["/api/payments/*", "/api/transactions/*"]}'
        WHEN vd.vendor_type = 'contractor' THEN '{"maxConcurrentSessions": 2, "allowedEndpoints": ["/api/content/moderate", "/api/content/review"]}'
        WHEN vd.vendor_type = 'consultant' THEN '{"maxConcurrentSessions": 1, "allowedEndpoints": ["/api/analytics/*"]}'
        WHEN vd.vendor_type = 'support-staff' THEN '{"maxConcurrentSessions": 5, "allowedEndpoints": ["/api/users/support", "/api/tickets/*"]}'
        WHEN vd.vendor_type = 'compliance-officer' THEN '{"maxConcurrentSessions": 1, "allowedEndpoints": ["/api/admin/*"]}'
        ELSE '{"maxConcurrentSessions": 1}'
    END::jsonb,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + CASE 
        WHEN vd.vendor_type = 'payment-specialist' THEN INTERVAL '7 days'  -- 1 week
        WHEN vd.vendor_type = 'contractor' THEN INTERVAL '3 days'  -- 3 days
        WHEN vd.vendor_type = 'consultant' THEN INTERVAL '1 day'  -- 1 day
        WHEN vd.vendor_type = 'support-staff' THEN INTERVAL '2 days'  -- 2 days
        WHEN vd.vendor_type = 'compliance-officer' THEN INTERVAL '12 hours'  -- 12 hours
        ELSE INTERVAL '1 day'
    END,
    CASE 
        WHEN vd.vendor_type = 'payment-specialist' THEN 168  -- 7 days
        WHEN vd.vendor_type = 'contractor' THEN 72   -- 3 days
        WHEN vd.vendor_type = 'consultant' THEN 24  -- 1 day
        WHEN vd.vendor_type = 'support-staff' THEN 48   -- 2 days
        WHEN vd.vendor_type = 'compliance-officer' THEN 12  -- 12 hours
        ELSE 24
    END,
    true,  -- extendable
    false, -- auto_renew
    ARRAY['admin-joshua-stone'],  -- required_approvers
    ARRAY['admin-joshua-stone'],  -- current_approvals
    true,  -- approved
    CURRENT_TIMESTAMP - INTERVAL '1 day',  -- approved_at
    'admin-joshua-stone',  -- approved_by
    'active',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM vendor_data vd;

-- Create some sample audit logs
WITH vendor_data AS (
    SELECT id as vendor_id, name, vendor_type FROM vendor_profiles LIMIT 3
)
INSERT INTO vendor_audit_logs (
    action, vendor_id, ip_address, user_agent, endpoint, metadata, risk_score, severity, success, timestamp
)
SELECT 
    'vendor_registered',
    vd.vendor_id,
    '192.168.1.100',
    'FANZ-Admin/1.0',
    '/api/v1/vendor-access/vendors',
    ('{"vendorName": "' || vd.name || '", "vendorType": "' || vd.vendor_type || '"}')::jsonb,
    1,
    'INFO',
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM vendor_data vd;

-- Create some sample analytics data
INSERT INTO vendor_access_analytics (
    date_bucket, hour_bucket, total_vendors, active_vendors, new_registrations,
    grants_created, grants_approved, tokens_generated, high_risk_activities,
    security_violations, revocations
) VALUES 
(CURRENT_DATE - INTERVAL '1 day', NULL, 6, 4, 3, 5, 5, 3, 0, 0, 0),
(CURRENT_DATE, NULL, 6, 5, 0, 1, 1, 2, 0, 0, 0);

COMMIT;

-- Display summary
\echo ''
\echo '🎉 FANZ Vendor Access Seed Data Created Successfully!'
\echo '=================================================='
\echo ''
\echo '📊 Summary:'
SELECT 
    'Vendor Profiles' as table_name,
    COUNT(*) as record_count
FROM vendor_profiles
WHERE email LIKE '%@%'

UNION ALL

SELECT 
    'Access Grants' as table_name,
    COUNT(*) as record_count
FROM access_grants

UNION ALL

SELECT 
    'Audit Logs' as table_name,
    COUNT(*) as record_count
FROM vendor_audit_logs

UNION ALL

SELECT 
    'Analytics Records' as table_name,
    COUNT(*) as record_count
FROM vendor_access_analytics;

\echo ''
\echo 'Vendor Types Created:'
SELECT 
    vendor_type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as vendors
FROM vendor_profiles 
WHERE email LIKE '%@%'
GROUP BY vendor_type
ORDER BY vendor_type;

\echo ''
\echo 'Active Access Grants:'
SELECT 
    vp.name as vendor_name,
    ag.categories,
    ag.access_level,
    ag.status,
    ag.end_time
FROM access_grants ag
JOIN vendor_profiles vp ON ag.vendor_id = vp.id
WHERE ag.status = 'active'
ORDER BY vp.name;

\echo ''
\echo '✅ Sample data ready for testing!'
\echo 'Next steps:'
\echo '  1. Start the backend server: npm run dev'
\echo '  2. Test the API: npm run vendor-access:demo'
\echo '  3. Check health: curl http://localhost:3000/api/v1/vendor-access/health'
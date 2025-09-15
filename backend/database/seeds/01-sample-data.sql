-- FanzFinance OS - Sample Data Seeding Script
-- This script populates the database with sample data for development and testing

BEGIN;

-- Set search path
SET search_path = fanzfinance, public;

-- =====================================================
-- Sample Users (normally this would be in user management)
-- =====================================================

-- Sample Creator IDs (these would normally come from the user management system)
DO $$
DECLARE
    creator1_id UUID := 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    creator2_id UUID := 'b2c3d4e5-f6g7-8901-2345-6789abcdef01';
    creator3_id UUID := 'c3d4e5f6-g7h8-9012-3456-789abcdef012';
    subscriber1_id UUID := 'd4e5f6g7-h8i9-0123-4567-89abcdef0123';
    subscriber2_id UUID := 'e5f6g7h8-i9j0-1234-5678-9abcdef01234';
    subscriber3_id UUID := 'f6g7h8i9-j0k1-2345-6789-abcdef012345';
BEGIN

-- =====================================================
-- Sample Subscription Plans
-- =====================================================

INSERT INTO subscription_plans (id, creator_id, name, description, price, currency, billing_cycle, features, benefits, trial_period_days, is_active) VALUES
-- Creator 1 Plans
(uuid_generate_v4(), creator1_id, 'Basic Access', 'Access to basic content and community', 9.99, 'USD', 'monthly', 
 '["basic_content", "community_access", "monthly_livestream"]'::jsonb,
 '["Ad-free experience", "Basic content library", "Community chat"]'::jsonb, 7, true),

(uuid_generate_v4(), creator1_id, 'Premium Tier', 'Premium content with exclusive perks', 19.99, 'USD', 'monthly',
 '["premium_content", "exclusive_photos", "priority_support", "custom_requests"]'::jsonb,
 '["All basic benefits", "Exclusive photo sets", "Priority DMs", "Custom content requests"]'::jsonb, 3, true),

(uuid_generate_v4(), creator1_id, 'VIP Experience', 'Ultimate fan experience', 49.99, 'USD', 'monthly',
 '["vip_content", "1on1_chats", "phone_calls", "custom_videos", "physical_rewards"]'::jsonb,
 '["All premium benefits", "1-on-1 video calls", "Custom videos", "Physical merchandise"]'::jsonb, 0, true),

-- Creator 2 Plans
(uuid_generate_v4(), creator2_id, 'Supporter', 'Support my content creation', 4.99, 'USD', 'monthly',
 '["behind_scenes", "early_access"]'::jsonb,
 '["Behind the scenes content", "Early access to posts"]'::jsonb, 14, true),

(uuid_generate_v4(), creator2_id, 'Super Fan', 'For the biggest supporters', 14.99, 'USD', 'monthly',
 '["exclusive_content", "monthly_video_call", "personalized_messages"]'::jsonb,
 '["All supporter benefits", "Monthly group video call", "Personalized thank you messages"]'::jsonb, 7, true),

-- Creator 3 Plans  
(uuid_generate_v4(), creator3_id, 'Fitness Journey', 'Join my fitness transformation', 12.99, 'USD', 'monthly',
 '["workout_plans", "nutrition_guides", "progress_tracking"]'::jsonb,
 '["Custom workout plans", "Meal prep guides", "Progress check-ins"]'::jsonb, 10, true);

-- =====================================================
-- Sample User Balances
-- =====================================================

-- Creator balances
INSERT INTO user_balances (user_id, balance_type, balance, currency) VALUES
-- Creator 1
(creator1_id, 'available', 2547.83, 'USD'),
(creator1_id, 'pending', 158.92, 'USD'),
(creator1_id, 'earnings', 2706.75, 'USD'),

-- Creator 2  
(creator2_id, 'available', 892.45, 'USD'),
(creator2_id, 'pending', 67.33, 'USD'),
(creator2_id, 'earnings', 959.78, 'USD'),

-- Creator 3
(creator3_id, 'available', 1234.56, 'USD'),
(creator3_id, 'pending', 89.44, 'USD'),
(creator3_id, 'earnings', 1324.00, 'USD'),

-- Subscriber balances
(subscriber1_id, 'available', 150.00, 'USD'),
(subscriber2_id, 'available', 75.50, 'USD'),
(subscriber3_id, 'available', 200.25, 'USD');

-- =====================================================
-- Sample Subscriptions
-- =====================================================

-- Get subscription plan IDs for reference
DO $subscription_block$
DECLARE
    plan_basic_id UUID;
    plan_premium_id UUID;
    plan_supporter_id UUID;
    plan_fitness_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO plan_basic_id FROM subscription_plans WHERE creator_id = creator1_id AND name = 'Basic Access';
    SELECT id INTO plan_premium_id FROM subscription_plans WHERE creator_id = creator1_id AND name = 'Premium Tier';
    SELECT id INTO plan_supporter_id FROM subscription_plans WHERE creator_id = creator2_id AND name = 'Supporter';
    SELECT id INTO plan_fitness_id FROM subscription_plans WHERE creator_id = creator3_id AND name = 'Fitness Journey';

    -- Create sample subscriptions
    INSERT INTO user_subscriptions (
        id, subscriber_id, creator_id, plan_id, status, is_trial, 
        current_period_start, current_period_end, payment_method, payment_method_details
    ) VALUES
    -- Active subscriptions
    (uuid_generate_v4(), subscriber1_id, creator1_id, plan_basic_id, 'active', false,
     NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 'credit_card',
     '{"last4": "1234", "brand": "visa", "exp_month": 12, "exp_year": 2026}'::jsonb),
     
    (uuid_generate_v4(), subscriber2_id, creator1_id, plan_premium_id, 'active', false,
     NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days', 'bank_account',
     '{"bank_name": "Chase Bank", "last4": "5678", "account_type": "checking"}'::jsonb),
     
    (uuid_generate_v4(), subscriber3_id, creator2_id, plan_supporter_id, 'trial', true,
     NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days', 'credit_card',
     '{"last4": "9876", "brand": "mastercard", "exp_month": 8, "exp_year": 2025}'::jsonb),
     
    -- Recently expired subscription
    (uuid_generate_v4(), subscriber1_id, creator3_id, plan_fitness_id, 'expired', false,
     NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'credit_card',
     '{"last4": "4321", "brand": "amex", "exp_month": 3, "exp_year": 2027}'::jsonb);
END $subscription_block$;

-- =====================================================
-- Sample Transactions
-- =====================================================

-- Create sample transactions
INSERT INTO transactions (
    id, transaction_type, sender_id, recipient_id, amount, currency, fee_amount,
    status, description, payment_method, payment_method_details, metadata
) VALUES
-- Subscription payments
(uuid_generate_v4(), 'subscription', subscriber1_id, creator1_id, 9.99, 'USD', 0.50,
 'completed', 'Basic Access subscription payment', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "sub_txn_001"}'::jsonb,
 '{"subscription_period": "2024-12", "plan_name": "Basic Access"}'::jsonb),

(uuid_generate_v4(), 'subscription', subscriber2_id, creator1_id, 19.99, 'USD', 1.00,
 'completed', 'Premium Tier subscription payment', 'bank_account',
 '{"processor": "mock_processor", "transaction_id": "sub_txn_002"}'::jsonb,
 '{"subscription_period": "2024-12", "plan_name": "Premium Tier"}'::jsonb),

(uuid_generate_v4(), 'subscription', subscriber1_id, creator3_id, 12.99, 'USD', 0.65,
 'completed', 'Fitness Journey subscription payment', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "sub_txn_003"}'::jsonb,
 '{"subscription_period": "2024-11", "plan_name": "Fitness Journey"}'::jsonb),

-- Tips
(uuid_generate_v4(), 'tip', subscriber1_id, creator1_id, 25.00, 'USD', 1.25,
 'completed', 'Great content! Keep it up!', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "tip_txn_001"}'::jsonb,
 '{"tip_message": "Love your work!", "content_id": "post_123"}'::jsonb),

(uuid_generate_v4(), 'tip', subscriber2_id, creator2_id, 10.00, 'USD', 0.50,
 'completed', 'Thanks for the workout tips', 'bank_account',
 '{"processor": "mock_processor", "transaction_id": "tip_txn_002"}'::jsonb,
 '{"tip_message": "This helped me so much!", "content_id": "video_456"}'::jsonb),

(uuid_generate_v4(), 'tip', subscriber3_id, creator1_id, 50.00, 'USD', 2.50,
 'completed', 'Amazing content as always', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "tip_txn_003"}'::jsonb,
 '{"tip_message": "You are incredible!", "content_id": "livestream_789"}'::jsonb),

-- Content purchases
(uuid_generate_v4(), 'content_purchase', subscriber1_id, creator2_id, 7.99, 'USD', 0.40,
 'completed', 'Premium photo set purchase', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "content_txn_001"}'::jsonb,
 '{"content_type": "photo_set", "content_id": "photoset_001", "content_title": "Beach Vacation 2024"}'::jsonb),

-- Pending transactions
(uuid_generate_v4(), 'tip', subscriber3_id, creator3_id, 15.00, 'USD', 0.75,
 'pending', 'Processing tip payment', 'credit_card',
 '{"processor": "mock_processor", "transaction_id": "tip_txn_pending_001"}'::jsonb,
 '{"tip_message": "Great motivation!", "content_id": "workout_001"}'::jsonb),

-- Withdrawals
(uuid_generate_v4(), 'withdrawal', creator1_id, NULL, 500.00, 'USD', 2.50,
 'completed', 'Weekly payout to bank account', 'bank_transfer',
 '{"processor": "mock_processor", "transaction_id": "withdraw_txn_001"}'::jsonb,
 '{"payout_period": "2024-12-01_to_2024-12-07", "bank_account": "****1234"}'::jsonb);

-- =====================================================
-- Sample Payouts
-- =====================================================

INSERT INTO payouts (
    id, creator_id, amount, currency, payout_method, payout_details, status,
    period_start, period_end, processing_fee, processor_payout_id, processor_response
) VALUES
-- Completed payout
(uuid_generate_v4(), creator1_id, 500.00, 'USD', 'bank_transfer',
 '{"bank_name": "Bank of America", "account_type": "checking", "last4": "1234", "routing": "****5678"}'::jsonb,
 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days', 2.50,
 'payout_mock_001', '{"status": "completed", "processed_at": "2024-12-01T10:00:00Z"}'::jsonb),

-- Processing payout
(uuid_generate_v4(), creator2_id, 200.00, 'USD', 'paypal',
 '{"email": "creator2@example.com", "paypal_id": "mock_paypal_123"}'::jsonb,
 'processing', NOW() - INTERVAL '7 days', NOW(), 1.50,
 'payout_mock_002', '{"status": "processing", "initiated_at": "2024-12-08T14:30:00Z"}'::jsonb),

-- Pending payout
(uuid_generate_v4(), creator3_id, 300.00, 'USD', 'bank_transfer',
 '{"bank_name": "Wells Fargo", "account_type": "savings", "last4": "9876", "routing": "****4321"}'::jsonb,
 'pending', NOW() - INTERVAL '7 days', NOW(), 2.00,
 NULL, NULL);

-- =====================================================
-- Sample Balance Changes (Audit Trail)
-- =====================================================

-- Create balance change entries for the transactions above
INSERT INTO user_balance_changes (
    user_id, balance_type, change_type, amount, currency, 
    previous_balance, new_balance, description, transaction_id
) VALUES
-- Creator earnings from tips and subscriptions
(creator1_id, 'earnings', 'credit', 74.24, 'USD', 2632.51, 2706.75, 'Subscription and tip earnings', 
 (SELECT id FROM transactions WHERE recipient_id = creator1_id AND amount = 25.00 LIMIT 1)),

(creator2_id, 'earnings', 'credit', 17.49, 'USD', 942.29, 959.78, 'Tips and content sales',
 (SELECT id FROM transactions WHERE recipient_id = creator2_id AND amount = 10.00 LIMIT 1)),

-- Withdrawals
(creator1_id, 'available', 'debit', 500.00, 'USD', 3047.83, 2547.83, 'Payout to bank account',
 (SELECT id FROM transactions WHERE sender_id = creator1_id AND transaction_type = 'withdrawal' LIMIT 1));

END;

-- Log seeding completion
INSERT INTO audit_logs (entity_type, entity_id, action, actor_type, metadata)
VALUES (
    'system',
    uuid_generate_v4(),
    'database_seeded',
    'system',
    jsonb_build_object(
        'version', '1.0.0',
        'timestamp', NOW(),
        'records_created', jsonb_build_object(
            'subscription_plans', (SELECT COUNT(*) FROM subscription_plans),
            'user_subscriptions', (SELECT COUNT(*) FROM user_subscriptions),
            'transactions', (SELECT COUNT(*) FROM transactions),
            'payouts', (SELECT COUNT(*) FROM payouts),
            'user_balances', (SELECT COUNT(*) FROM user_balances)
        )
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data seeded successfully!';
    RAISE NOTICE 'Subscription plans: %', (SELECT COUNT(*) FROM subscription_plans);
    RAISE NOTICE 'User subscriptions: %', (SELECT COUNT(*) FROM user_subscriptions);
    RAISE NOTICE 'Transactions: %', (SELECT COUNT(*) FROM transactions);
    RAISE NOTICE 'Payouts: %', (SELECT COUNT(*) FROM payouts);
    RAISE NOTICE 'User balances: %', (SELECT COUNT(*) FROM user_balances);
END $$;
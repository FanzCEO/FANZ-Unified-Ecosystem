-- 🌱 FANZ UNIFIED ECOSYSTEM - SAMPLE SEED DATA
-- Initial data for development and testing

-- Sample users (passwords are hashed version of 'password123')
INSERT INTO users (id, username, email, password_hash, role, display_name, bio, avatar_url, is_active, is_verified, is_premium) VALUES
-- Admin user
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@fanz.eco', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'FANZ Admin', 'Platform Administrator', 'https://i.pravatar.cc/300?u=admin', TRUE, TRUE, TRUE),

-- Creators
('550e8400-e29b-41d4-a716-446655440002', 'luna_star', 'luna@fanz.eco', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creator', 'Luna Starlight', 'Your favorite cosmic creator ✨ Premium content, custom videos, and exclusive live shows!', 'https://i.pravatar.cc/300?u=luna', TRUE, TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440003', 'jade_phoenix', 'jade@fanz.eco', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creator', 'Jade Phoenix', 'Fitness model and lifestyle creator 🔥 Join me for workouts, wellness tips, and behind-the-scenes content!', 'https://i.pravatar.cc/300?u=jade', TRUE, TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440004', 'scarlett_rose', 'scarlett@fanz.eco', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creator', 'Scarlett Rose', 'Art model and creative soul 🌹 Exclusive photoshoots, artistic content, and personal vlogs!', 'https://i.pravatar.cc/300?u=scarlett', TRUE, TRUE, TRUE),

('550e8400-e29b-41d4-a716-446655440005', 'diamond_doll', 'diamond@fanz.eco', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'creator', 'Diamond Doll', 'Luxury lifestyle creator 💎 High-end fashion, travel content, and VIP experiences!', 'https://i.pravatar.cc/300?u=diamond', TRUE, TRUE, TRUE),

-- Fans
('550e8400-e29b-41d4-a716-446655440006', 'fan_mike', 'mike@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fan', 'Mike Johnson', 'Longtime supporter of amazing creators!', 'https://i.pravatar.cc/300?u=mike', TRUE, FALSE, TRUE),

('550e8400-e29b-41d4-a716-446655440007', 'fan_alex', 'alex@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fan', 'Alex Smith', 'Love supporting creative content!', 'https://i.pravatar.cc/300?u=alex', TRUE, FALSE, FALSE),

('550e8400-e29b-41d4-a716-446655440008', 'fan_sarah', 'sarah@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fan', 'Sarah Wilson', 'Fitness enthusiast and supporter!', 'https://i.pravatar.cc/300?u=sarah', TRUE, FALSE, TRUE),

('550e8400-e29b-41d4-a716-446655440009', 'fan_david', 'david@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fan', 'David Brown', 'Art lover and collector!', 'https://i.pravatar.cc/300?u=david', TRUE, FALSE, FALSE),

('550e8400-e29b-41d4-a716-446655440010', 'fan_emma', 'emma@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fan', 'Emma Davis', 'Luxury lifestyle enthusiast!', 'https://i.pravatar.cc/300?u=emma', TRUE, FALSE, TRUE);

-- Creator profiles
INSERT INTO creator_profiles (id, user_id, stage_name, category, tags, description, verified_at, subscription_price, tip_minimum, total_earnings, total_tips, subscriber_count, content_count, view_count, social_links, wallet_address, allow_tips, allow_messages) VALUES
-- Luna Starlight
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Luna Starlight', 'Lifestyle', '{"cosmic", "premium", "exclusive", "live shows"}', 'Your favorite cosmic creator bringing you premium content, custom videos, and exclusive live shows from across the galaxy!', NOW() - INTERVAL '30 days', 29.99, 5.00, 15750.50, 8200.25, 1250, 85, 125000, '{"instagram": "@luna_starlight", "twitter": "@lunastar_official", "tiktok": "@lunastarlight"}', '0x742d35Cc6435C0532925a3b8D6Ac0532925a3b8D', TRUE, TRUE),

-- Jade Phoenix  
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Jade Phoenix', 'Fitness', '{"fitness", "wellness", "lifestyle", "workouts"}', 'Fitness model and lifestyle creator helping you achieve your best self through workouts, wellness tips, and motivational content!', NOW() - INTERVAL '45 days', 19.99, 3.00, 12200.75, 6500.50, 950, 120, 98000, '{"instagram": "@jade_phoenix_fit", "youtube": "@jadephoenixfitness", "tiktok": "@jadephoenix"}', '0x8D6Ac532925a3b8D6Ac532925a3b8D6Ac532925', TRUE, TRUE),

-- Scarlett Rose
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Scarlett Rose', 'Art', '{"art", "modeling", "photography", "creative"}', 'Art model and creative soul sharing exclusive photoshoots, artistic content, and personal insights into the creative process!', NOW() - INTERVAL '60 days', 24.99, 4.00, 18900.25, 9200.75, 800, 95, 76000, '{"instagram": "@scarlett_rose_art", "twitter": "@scarlettrose", "deviantart": "@scarlettroseart"}', '0x3b8D6Ac532925a3b8D6Ac532925a3b8D6Ac5329', TRUE, TRUE),

-- Diamond Doll
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Diamond Doll', 'Luxury', '{"luxury", "fashion", "travel", "lifestyle"}', 'Luxury lifestyle creator showcasing high-end fashion, exclusive travel experiences, and VIP lifestyle content!', NOW() - INTERVAL '20 days', 49.99, 10.00, 25500.00, 12750.50, 650, 75, 95000, '{"instagram": "@diamond_doll_official", "twitter": "@diamonddoll", "pinterest": "@diamonddollstyle"}', '0x925a3b8D6Ac532925a3b8D6Ac532925a3b8D6Ac', TRUE, TRUE);

-- Sample content for each creator
INSERT INTO content (id, creator_id, title, description, content_type, status, media_urls, thumbnail_url, is_premium, price, required_tokens, view_count, like_count, comment_count, tags, published_at) VALUES
-- Luna Starlight content
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Cosmic Goddess Photoshoot', 'Exclusive behind-the-scenes from my latest cosmic-themed photoshoot ✨', 'photo', 'published', '["https://example.com/luna/cosmic1.jpg", "https://example.com/luna/cosmic2.jpg"]', 'https://example.com/luna/cosmic_thumb.jpg', TRUE, 15.99, 50, 2500, 185, 42, '{"cosmic", "photoshoot", "exclusive", "premium"}', NOW() - INTERVAL '2 days'),

('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Morning Routine Vlog', 'Join me for my daily morning routine and cosmic meditation!', 'video', 'published', '["https://example.com/luna/morning_routine.mp4"]', 'https://example.com/luna/morning_thumb.jpg', FALSE, 0.00, 0, 8500, 420, 89, '{"vlog", "morning", "routine", "free"}', NOW() - INTERVAL '5 days'),

-- Jade Phoenix content
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'HIIT Workout Session', 'Intense 30-minute HIIT workout to get your heart pumping! 🔥', 'video', 'published', '["https://example.com/jade/hiit_workout.mp4"]', 'https://example.com/jade/hiit_thumb.jpg', TRUE, 12.99, 30, 3200, 280, 67, '{"fitness", "hiit", "workout", "training"}', NOW() - INTERVAL '1 day'),

('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Healthy Recipe Tutorial', 'Learn to make my favorite post-workout smoothie bowl!', 'video', 'published', '["https://example.com/jade/recipe.mp4"]', 'https://example.com/jade/recipe_thumb.jpg', FALSE, 0.00, 0, 5600, 340, 92, '{"recipe", "healthy", "nutrition", "free"}', NOW() - INTERVAL '4 days'),

-- Scarlett Rose content  
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 'Renaissance Art Series', 'My latest artistic photoshoot inspired by Renaissance masters 🎨', 'photo', 'published', '["https://example.com/scarlett/renaissance1.jpg", "https://example.com/scarlett/renaissance2.jpg"]', 'https://example.com/scarlett/renaissance_thumb.jpg', TRUE, 18.99, 40, 1800, 165, 28, '{"art", "renaissance", "photography", "artistic"}', NOW() - INTERVAL '3 days'),

-- Diamond Doll content
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', 'Paris Fashion Week VIP', 'Exclusive access to my Paris Fashion Week experience! 💎', 'video', 'published', '["https://example.com/diamond/paris_fw.mp4"]', 'https://example.com/diamond/paris_thumb.jpg', TRUE, 24.99, 80, 4200, 320, 55, '{"fashion", "paris", "luxury", "exclusive"}', NOW() - INTERVAL '6 days');

-- Sample subscriptions
INSERT INTO subscriptions (id, subscriber_id, creator_id, status, price, billing_cycle, next_billing_date, started_at) VALUES
-- Mike's subscriptions
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', 'active', 29.99, 'monthly', NOW() + INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'active', 19.99, 'monthly', NOW() + INTERVAL '10 days', NOW() - INTERVAL '20 days'),

-- Sarah's subscriptions  
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', 'active', 19.99, 'monthly', NOW() + INTERVAL '8 days', NOW() - INTERVAL '22 days'),

-- Emma's subscriptions
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440004', 'active', 49.99, 'monthly', NOW() + INTERVAL '20 days', NOW() - INTERVAL '10 days');

-- Sample transactions (tips and purchases)
INSERT INTO transactions (id, from_user_id, to_user_id, creator_id, type, status, amount, platform_fee, creator_earnings, content_id, payment_method, description, completed_at) VALUES
-- Tips
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'tip', 'completed', 25.00, 1.25, 23.75, NULL, 'credit_card', 'Great content Luna! Keep it up! 💫', NOW() - INTERVAL '2 hours'),

('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'tip', 'completed', 15.00, 0.75, 14.25, NULL, 'credit_card', 'Amazing workout! Thanks Jade! 🔥', NOW() - INTERVAL '5 hours'),

-- Content purchases
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'purchase', 'completed', 15.99, 0.80, 15.19, '770e8400-e29b-41d4-a716-446655440001', 'credit_card', 'Purchase: Cosmic Goddess Photoshoot', NOW() - INTERVAL '1 day'),

('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'purchase', 'completed', 18.99, 0.95, 18.04, '770e8400-e29b-41d4-a716-446655440005', 'credit_card', 'Purchase: Renaissance Art Series', NOW() - INTERVAL '3 days'),

-- Subscription payments
('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'subscription', 'completed', 29.99, 1.50, 28.49, NULL, 'credit_card', 'Monthly subscription to Luna Starlight', NOW() - INTERVAL '15 days');

-- Sample creator tokens
INSERT INTO creator_tokens (id, creator_id, token_name, token_symbol, contract_address, total_supply, current_supply, current_price, market_cap, total_volume, holder_count, description, is_active, deployed_at) VALUES
-- Luna's token
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Luna Starlight Token', 'LUNA', '0x1234567890123456789012345678901234567890', 1000000, 250000, 0.05000000, 12500.00, 45000.00, 185, 'Official token for Luna Starlight - unlock exclusive content and participate in governance!', TRUE, NOW() - INTERVAL '30 days'),

-- Jade's token
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Jade Phoenix Token', 'JADE', '0x2345678901234567890123456789012345678901', 800000, 180000, 0.03500000, 6300.00, 32000.00, 142, 'Official token for Jade Phoenix - join the fitness community and earn rewards!', TRUE, NOW() - INTERVAL '45 days'),

-- Scarlett's token  
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Scarlett Rose Token', 'ROSE', '0x3456789012345678901234567890123456789012', 600000, 120000, 0.07500000, 9000.00, 28000.00, 98, 'Official token for Scarlett Rose - collect artistic NFTs and support creative projects!', TRUE, NOW() - INTERVAL '60 days'),

-- Diamond's token
('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Diamond Doll Token', 'DIAMOND', '0x4567890123456789012345678901234567890123', 500000, 150000, 0.12000000, 18000.00, 65000.00, 75, 'Official token for Diamond Doll - access luxury experiences and VIP content!', TRUE, NOW() - INTERVAL '20 days');

-- Sample token holdings
INSERT INTO token_holdings (id, user_id, token_id, balance, total_purchased, total_spent, total_dividends_earned, first_purchase_at) VALUES
-- Mike's holdings
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'aa0e8400-e29b-41d4-a716-446655440001', 2500, 2500, 125.00, 15.50, NOW() - INTERVAL '25 days'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'aa0e8400-e29b-41d4-a716-446655440002', 1800, 1800, 63.00, 8.20, NOW() - INTERVAL '15 days'),

-- Sarah's holdings
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'aa0e8400-e29b-41d4-a716-446655440002', 3200, 3200, 112.00, 12.80, NOW() - INTERVAL '20 days'),

-- Emma's holdings  
('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 'aa0e8400-e29b-41d4-a716-446655440004', 1500, 1500, 180.00, 22.50, NOW() - INTERVAL '8 days'),

-- David's holdings
('bb0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 'aa0e8400-e29b-41d4-a716-446655440003', 800, 800, 60.00, 9.20, NOW() - INTERVAL '12 days');

-- Sample virtual spaces
INSERT INTO virtual_spaces (id, creator_id, name, description, space_type, capacity, is_public, entry_price, required_tokens, environment_config, total_visits, current_users, is_active) VALUES
-- Luna's cosmic lounge
('cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Cosmic Starlight Lounge', 'Intimate space for premium fans to chat and enjoy exclusive content', 'intimate_lounge', 25, FALSE, 19.99, 100, '{"theme": "cosmic", "lighting": "ambient", "music": "ambient_space"}', 450, 8, TRUE),

-- Jade's fitness studio
('cc0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Phoenix Fitness Studio', 'Join live workout sessions and fitness challenges!', 'workshop_studio', 50, TRUE, 0.00, 0, '{"theme": "fitness", "lighting": "bright", "equipment": "gym_setup"}', 820, 12, TRUE),

-- Scarlett's gallery
('cc0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Rose Art Gallery', 'Exclusive gallery showcasing my latest artistic works', 'gallery_space', 30, FALSE, 15.99, 50, '{"theme": "artistic", "lighting": "gallery", "displays": "art_walls"}', 280, 5, TRUE),

-- Diamond's penthouse
('cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Diamond Penthouse Suite', 'Ultra-exclusive luxury space for VIP members only', 'penthouse', 15, FALSE, 99.99, 500, '{"theme": "luxury", "lighting": "golden", "furniture": "premium"}', 125, 3, TRUE);

-- Sample messages
INSERT INTO messages (id, from_user_id, to_user_id, content, message_type, is_read, price, is_paid, created_at) VALUES
-- Fan messages to creators
('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Hey Luna! Love your cosmic content, keep being amazing! ✨', 'text', TRUE, 0.00, FALSE, NOW() - INTERVAL '3 hours'),

('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'That HIIT workout was incredible! Could you do more core-focused sessions?', 'text', TRUE, 0.00, FALSE, NOW() - INTERVAL '1 day'),

-- Creator replies
('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'Thank you so much Mike! More cosmic content coming soon! 💫', 'text', FALSE, 0.00, FALSE, NOW() - INTERVAL '2 hours'),

('dd0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'So glad you enjoyed it Sarah! Core workout series coming next week! 💪', 'text', FALSE, 0.00, FALSE, NOW() - INTERVAL '18 hours');

-- Sample analytics events
INSERT INTO analytics_events (id, event_type, event_category, event_data, user_id, creator_id, content_id, created_at) VALUES
-- Content views
('ee0e8400-e29b-41d4-a716-446655440001', 'content_view', 'engagement', '{"view_duration": 180, "source": "profile"}', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '4 hours'),

('ee0e8400-e29b-41d4-a716-446655440002', 'content_view', 'engagement', '{"view_duration": 1200, "source": "feed"}', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 days'),

-- User interactions
('ee0e8400-e29b-41d4-a716-446655440003', 'user_login', 'authentication', '{"device": "mobile", "location": "US"}', '550e8400-e29b-41d4-a716-446655440006', NULL, NULL, NOW() - INTERVAL '1 hour'),

('ee0e8400-e29b-41d4-a716-446655440004', 'tip_sent', 'monetization', '{"amount": 25.00, "method": "credit_card"}', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', NULL, NOW() - INTERVAL '2 hours');

-- Update creator stats based on sample data
UPDATE creator_profiles SET 
    total_earnings = COALESCE((
        SELECT SUM(creator_earnings) 
        FROM transactions 
        WHERE creator_id = creator_profiles.id AND status = 'completed'
    ), 0),
    total_tips = COALESCE((
        SELECT SUM(creator_earnings) 
        FROM transactions 
        WHERE creator_id = creator_profiles.id AND type = 'tip' AND status = 'completed'
    ), 0),
    subscriber_count = COALESCE((
        SELECT COUNT(*) 
        FROM subscriptions 
        WHERE creator_id = creator_profiles.id AND status = 'active'
    ), 0),
    content_count = COALESCE((
        SELECT COUNT(*) 
        FROM content 
        WHERE creator_id = creator_profiles.id AND status = 'published'
    ), 0);

-- 🌟 SAMPLE DATA SUMMARY:
-- ✅ 10 users (1 admin, 4 creators, 5 fans)
-- ✅ 4 creator profiles with realistic stats
-- ✅ 6 pieces of content across different creators
-- ✅ 4 active subscriptions
-- ✅ 5 completed transactions (tips, purchases, subscriptions)  
-- ✅ 4 creator tokens with market data
-- ✅ 5 token holdings across different users
-- ✅ 4 virtual spaces (different types)
-- ✅ 4 sample messages between users
-- ✅ 4 analytics events for testing
-- ✅ Updated creator statistics
-- 💾 FANZ Unified Database Schema
-- Consolidated database architecture for all 13 platforms
-- Zero feature loss, enhanced cross-platform capabilities

-- 🔧 Database Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 🎭 Enums and Custom Types
CREATE TYPE user_role AS ENUM ('fan', 'creator', 'affiliate', 'admin', 'super_admin');
CREATE TYPE content_type AS ENUM ('video', 'image', 'audio', 'text', 'live_stream', 'nft', 'product');
CREATE TYPE platform_name AS ENUM (
  'fanz', 'fanztube', 'fanzcommerce', 'fanzspicyai', 'fanzmedia',
  'fanzdash', 'fanzlanding', 'fanzfiliate', 'fanzhub', 'starzcards',
  'clubcentral', 'migrationhq', 'fanzos'
);
CREATE TYPE transaction_type AS ENUM (
  'subscription', 'tip', 'purchase', 'commission', 'refund', 'payout'
);
CREATE TYPE notification_type AS ENUM (
  'like', 'comment', 'follow', 'message', 'payment', 'system', 'achievement'
);

-- 👥 CORE USER MANAGEMENT
-- Unified users table for all platforms
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'fan',
  
  -- Profile Information
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  location VARCHAR(100),
  website_url TEXT,
  birth_date DATE,
  
  -- Platform Registration
  platform_registered platform_name DEFAULT 'fanz',
  
  -- Account Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  
  -- Cross-Platform Metrics
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  total_content INTEGER DEFAULT 0,
  cross_platform_score INTEGER DEFAULT 0,
  
  -- Timestamps
  email_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Access Control
CREATE TABLE user_platform_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  access_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'premium', 'admin'
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Subscription Info
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Unique constraint
  UNIQUE(user_id, platform)
);

-- User Relationships (follows, blocks, etc.)
CREATE TABLE user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) DEFAULT 'follow', -- 'follow', 'block', 'mute'
  platform platform_name,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent self-follows and duplicates
  UNIQUE(follower_id, following_id, relationship_type, platform),
  CHECK(follower_id != following_id)
);

-- 📱 UNIFIED CONTENT MANAGEMENT
-- Content across all platforms
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  content_type content_type NOT NULL,
  
  -- Content Data
  title VARCHAR(255),
  description TEXT,
  content_text TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  duration INTEGER, -- for videos/audio in seconds
  file_size BIGINT, -- in bytes
  
  -- Content Metadata
  tags JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  custom_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Monetization
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  earnings DECIMAL(12,2) DEFAULT 0.00,
  
  -- Content Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Interactions (likes, views, etc.)
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- 'like', 'view', 'share', 'purchase'
  platform platform_name NOT NULL,
  
  -- Interaction Data
  interaction_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint for certain interactions
  UNIQUE(content_id, user_id, interaction_type, platform)
);

-- Comments System
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  
  -- Comment Data
  comment_text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  
  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 💰 UNIFIED COMMERCE & PAYMENTS
-- Financial Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id),
  platform platform_name NOT NULL,
  transaction_type transaction_type NOT NULL,
  
  -- Transaction Details
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  reference_id VARCHAR(100), -- External payment processor ID
  
  -- Related Content/Product
  content_id UUID REFERENCES content(id),
  product_data JSONB DEFAULT '{}'::jsonb,
  
  -- Transaction Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),
  
  -- Commission & Fees
  commission_rate DECIMAL(5,4) DEFAULT 0.0000,
  commission_amount DECIMAL(12,2) DEFAULT 0.00,
  platform_fee DECIMAL(12,2) DEFAULT 0.00,
  net_amount DECIMAL(12,2) NOT NULL,
  
  -- Timestamps
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Wallets & Balances
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  
  -- Balance Information
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  pending_balance DECIMAL(12,2) DEFAULT 0.00,
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  
  -- Currency
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Wallet Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  last_payout TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, platform, currency)
);

-- Subscription Management
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  
  -- Subscription Details
  tier VARCHAR(50) DEFAULT 'basic',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly', 'lifetime'
  
  -- Subscription Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
  auto_renew BOOLEAN DEFAULT true,
  
  -- Dates
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_billing TIMESTAMP,
  next_billing TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 UNIFIED ANALYTICS & INSIGHTS
-- Analytics Events (cross-platform tracking)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform platform_name NOT NULL,
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Session Information
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Location Data
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Device Information
  device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
  os VARCHAR(50),
  browser VARCHAR(50),
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Metrics Summary
CREATE TABLE platform_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform platform_name NOT NULL,
  metric_date DATE NOT NULL,
  
  -- User Metrics
  daily_active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  
  -- Content Metrics
  content_created INTEGER DEFAULT 0,
  content_views INTEGER DEFAULT 0,
  content_likes INTEGER DEFAULT 0,
  
  -- Revenue Metrics
  revenue DECIMAL(12,2) DEFAULT 0.00,
  transactions INTEGER DEFAULT 0,
  avg_transaction DECIMAL(10,2) DEFAULT 0.00,
  
  -- Engagement Metrics
  session_duration INTEGER DEFAULT 0, -- in seconds
  page_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Calculated at end of day
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(platform, metric_date)
);

-- 🔔 UNIFIED NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  
  -- Notification Details
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Related Data
  related_user_id UUID REFERENCES users(id),
  related_content_id UUID REFERENCES content(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  
  -- Delivery Channels
  sent_push BOOLEAN DEFAULT false,
  sent_email BOOLEAN DEFAULT false,
  sent_sms BOOLEAN DEFAULT false,
  
  -- Timestamps
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 CLUBS & COMMUNITIES
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name DEFAULT 'clubcentral',
  
  -- Club Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  
  -- Club Settings
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  member_limit INTEGER,
  
  -- Membership
  member_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club Memberships
CREATE TABLE club_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Membership Details
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'banned'
  
  -- Timestamps
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  
  UNIQUE(club_id, user_id)
);

-- 🤖 AI & AUTOMATION
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name DEFAULT 'fanzspicyai',
  
  -- AI Interaction Details
  interaction_type VARCHAR(50) NOT NULL, -- 'chat', 'content_generation', 'image_creation'
  model_used VARCHAR(50),
  prompt TEXT,
  response TEXT,
  
  -- Usage Metrics
  tokens_used INTEGER DEFAULT 0,
  processing_time INTEGER DEFAULT 0, -- milliseconds
  cost DECIMAL(10,4) DEFAULT 0.0000,
  
  -- Quality Metrics
  user_rating INTEGER, -- 1-5 stars
  user_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📈 AFFILIATE SYSTEM
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform platform_name DEFAULT 'fanzfiliate',
  
  -- Link Details
  original_url TEXT NOT NULL,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  campaign VARCHAR(100),
  
  -- Tracking
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Conversions
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id),
  
  -- Conversion Details
  conversion_value DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  
  -- Attribution
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  
  -- Timestamps
  clicked_at TIMESTAMP,
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🗂️ INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_platform ON content(platform);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_content_is_published ON content(is_published);

CREATE INDEX idx_content_interactions_content_id ON content_interactions(content_id);
CREATE INDEX idx_content_interactions_user_id ON content_interactions(user_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_platform ON transactions(platform);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_platform ON analytics_events(platform);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- 🔍 FULL-TEXT SEARCH INDEXES
CREATE INDEX idx_content_search ON content USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('english', username || ' ' || display_name || ' ' || bio));

-- 🔄 TRIGGERS FOR AUTOMATIC UPDATES
-- Update user stats when content changes
CREATE OR REPLACE FUNCTION update_user_content_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    UPDATE users SET total_content = total_content + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true THEN
    UPDATE users SET total_content = total_content + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_published = true AND NEW.is_published = false THEN
    UPDATE users SET total_content = total_content - 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_published = true THEN
    UPDATE users SET total_content = total_content - 1 WHERE id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_content_count
  AFTER INSERT OR UPDATE OR DELETE ON content
  FOR EACH ROW EXECUTE FUNCTION update_user_content_count();

-- Update engagement counts
CREATE OR REPLACE FUNCTION update_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' THEN
      UPDATE content SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.interaction_type = 'view' THEN
      UPDATE content SET view_count = view_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.interaction_type = 'share' THEN
      UPDATE content SET share_count = share_count + 1 WHERE id = NEW.content_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' THEN
      UPDATE content SET like_count = like_count - 1 WHERE id = OLD.content_id;
    ELSIF OLD.interaction_type = 'share' THEN
      UPDATE content SET share_count = share_count - 1 WHERE id = OLD.content_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_counts
  AFTER INSERT OR DELETE ON content_interactions
  FOR EACH ROW EXECUTE FUNCTION update_engagement_counts();

-- Update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE content SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE content SET comment_count = comment_count - 1 WHERE id = NEW.content_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = true AND NEW.is_deleted = false THEN
    UPDATE content SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    UPDATE content SET comment_count = comment_count - 1 WHERE id = OLD.content_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_counts
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.relationship_type = 'follow' THEN
    UPDATE users SET total_followers = total_followers + 1 WHERE id = NEW.following_id;
    UPDATE users SET total_following = total_following + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' AND OLD.relationship_type = 'follow' THEN
    UPDATE users SET total_followers = total_followers - 1 WHERE id = OLD.following_id;
    UPDATE users SET total_following = total_following - 1 WHERE id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON user_relationships
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Update wallet balances
CREATE OR REPLACE FUNCTION update_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- Update recipient wallet (earnings)
    IF NEW.recipient_id IS NOT NULL THEN
      INSERT INTO user_wallets (user_id, platform, available_balance, total_earned)
      VALUES (NEW.recipient_id, NEW.platform, NEW.net_amount, NEW.net_amount)
      ON CONFLICT (user_id, platform, currency) 
      DO UPDATE SET 
        available_balance = user_wallets.available_balance + NEW.net_amount,
        total_earned = user_wallets.total_earned + NEW.net_amount,
        updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Update user spending stats
    UPDATE users SET total_spent = total_spent + NEW.amount WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_balances
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_balances();

-- 📊 VIEWS FOR COMMON QUERIES
-- User statistics view
CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.username,
  u.display_name,
  u.role,
  u.total_followers,
  u.total_following,
  u.total_content,
  u.total_earned,
  u.total_spent,
  COUNT(DISTINCT upa.platform) as platforms_count,
  array_agg(DISTINCT upa.platform) as platforms,
  u.created_at
FROM users u
LEFT JOIN user_platform_access upa ON u.id = upa.user_id AND upa.is_active = true
GROUP BY u.id, u.username, u.display_name, u.role, u.total_followers, 
         u.total_following, u.total_content, u.total_earned, u.total_spent, u.created_at;

-- Content performance view
CREATE VIEW content_performance AS
SELECT 
  c.id,
  c.title,
  c.platform,
  u.username as creator_username,
  c.view_count,
  c.like_count,
  c.comment_count,
  c.share_count,
  c.earnings,
  ROUND((c.like_count::decimal / NULLIF(c.view_count, 0)) * 100, 2) as engagement_rate,
  c.created_at,
  c.published_at
FROM content c
JOIN users u ON c.user_id = u.id
WHERE c.is_published = true;

-- Platform analytics view
CREATE VIEW platform_analytics AS
SELECT 
  platform,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN user_id END) as monthly_active_users,
  COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN user_id END) as weekly_active_users,
  SUM(total_earned) as total_platform_earnings,
  AVG(total_earned) as avg_user_earnings
FROM user_platform_access upa
JOIN users u ON upa.user_id = u.id
WHERE upa.is_active = true
GROUP BY platform;

-- 🎯 SAMPLE DATA FUNCTIONS
-- Function to create sample data for development
CREATE OR REPLACE FUNCTION create_sample_data()
RETURNS void AS $$
BEGIN
  -- Insert sample users
  INSERT INTO users (username, email, password_hash, role, display_name, bio) VALUES
  ('fanz_creator', 'creator@fanz.com', '$2a$12$sample_hash', 'creator', 'FANZ Creator', 'Official FANZ creator account'),
  ('test_fan', 'fan@test.com', '$2a$12$sample_hash', 'fan', 'Test Fan', 'Just a fan exploring the platform'),
  ('affiliate_pro', 'affiliate@example.com', '$2a$12$sample_hash', 'affiliate', 'Pro Affiliate', 'Top affiliate marketer');
  
  -- Grant platform access
  INSERT INTO user_platform_access (user_id, platform, permissions) 
  SELECT u.id, 'fanz', '["fanz:read", "fanz:write"]'::jsonb
  FROM users u;
  
  RAISE NOTICE 'Sample data created successfully!';
END;
$$ LANGUAGE plpgsql;

-- 🎉 SCHEMA COMPLETE
-- This unified schema supports all 13 consolidated platforms with:
-- ✅ Zero feature loss from original platforms
-- ✅ Enhanced cross-platform capabilities  
-- ✅ Comprehensive analytics and insights
-- ✅ Unified user management and authentication
-- ✅ Advanced monetization and affiliate systems
-- ✅ Real-time notifications and engagement tracking
-- ✅ Performance-optimized with proper indexing
-- ✅ Automated statistics maintenance with triggers

-- To initialize with sample data, run: SELECT create_sample_data();
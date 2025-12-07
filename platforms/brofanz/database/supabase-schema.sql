-- ============================================================================
-- BROFANZ COMPLETE SUPABASE DATABASE SCHEMA
-- "Where the bros come to run the creator economy"
-- ============================================================================
-- This schema supports the full BroFanz platform including:
-- - User management with roles (fan, creator, admin)
-- - Creator profiles with personas, vibes, and style tags
-- - Content management with subscriptions and PPV
-- - VerifyMy age/identity verification integration
-- - Monetization (subscriptions, tips, PPV)
-- - Messaging system
-- - Safety and privacy controls
-- - Analytics and engagement tracking
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS - BroFanz Specific Types
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('fan', 'creator', 'admin', 'moderator');

-- Verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Content types
CREATE TYPE content_type AS ENUM ('image', 'video', 'audio', 'live_stream', 'story', 'post');

-- Content visibility
CREATE TYPE content_visibility AS ENUM ('public', 'subscribers_only', 'ppv', 'private');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused');

-- Transaction type
CREATE TYPE transaction_type AS ENUM ('subscription', 'tip', 'ppv_unlock', 'payout', 'refund');

-- Transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Message status
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Report status
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- BroFanz Persona Types (from mega-prompt)
CREATE TYPE bro_persona AS ENUM (
  'the_wingman',
  'the_mvp',
  'the_gym_captain',
  'the_skater_boy',
  'the_late_night_gamer',
  'the_outlaw_bro',
  'the_quiet_one',
  'the_alpha_buddy',
  'the_adventurer',
  'the_coach',
  'the_rookie'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role DEFAULT 'fan',
  avatar_url TEXT,
  cover_image_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  website VARCHAR(255),

  -- BroFanz specific fields
  bro_persona bro_persona,
  pronouns VARCHAR(20),

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  age_verified BOOLEAN DEFAULT FALSE,

  -- Creator specific
  is_creator BOOLEAN DEFAULT FALSE,
  creator_approved_at TIMESTAMPTZ,

  -- Privacy settings
  is_private BOOLEAN DEFAULT FALSE,
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_messages_from VARCHAR(20) DEFAULT 'everyone', -- 'everyone', 'subscribers', 'none'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  banned_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION TABLES (VerifyMy Integration)
-- ============================================================================

-- Age verification records
CREATE TABLE public.age_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- VerifyMy integration fields
  verification_provider VARCHAR(50) DEFAULT 'verifymyage',
  external_verification_id VARCHAR(255),
  verification_method VARCHAR(50), -- 'id_scan', 'credit_card', 'database_check'

  -- Verification data (encrypted/hashed)
  date_of_birth_hash VARCHAR(255), -- Hashed for privacy
  verified_age_over_18 BOOLEAN DEFAULT FALSE,
  verified_age_over_21 BOOLEAN DEFAULT FALSE,

  -- Status
  status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Audit
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_verification UNIQUE (user_id, verification_provider)
);

-- Identity verification for creators (2257 compliance)
CREATE TABLE public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- VerifyMy integration
  verification_provider VARCHAR(50) DEFAULT 'verifymyid',
  external_verification_id VARCHAR(255),

  -- Document info (stored securely)
  document_type VARCHAR(50), -- 'passport', 'drivers_license', 'national_id'
  document_country VARCHAR(3), -- ISO country code
  document_number_hash VARCHAR(255), -- Hashed for security

  -- Verified data
  legal_first_name_encrypted BYTEA, -- Encrypted PII
  legal_last_name_encrypted BYTEA,
  date_of_birth_encrypted BYTEA,
  address_encrypted BYTEA,

  -- Selfie/liveness check
  selfie_verified BOOLEAN DEFAULT FALSE,
  liveness_check_passed BOOLEAN DEFAULT FALSE,

  -- 2257 Compliance
  custodian_record_id VARCHAR(255),
  consent_form_signed BOOLEAN DEFAULT FALSE,
  consent_signed_at TIMESTAMPTZ,

  -- Status
  status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Audit
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TAG SYSTEM (BroFanz Specific)
-- ============================================================================

-- Tag categories
CREATE TABLE public.tag_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert BroFanz tag categories
INSERT INTO public.tag_categories (name, display_name, description, sort_order) VALUES
  ('identity', 'Identity', 'Self-chosen identity tags', 1),
  ('vibe', 'Vibes', 'Personality and energy vibes', 2),
  ('style', 'Style', 'Fashion and look tags', 3),
  ('lifestyle', 'Lifestyle', 'Interests and activities', 4),
  ('body', 'Body & Look', 'Physical appearance (non-explicit)', 5),
  ('persona', 'Character/Persona', 'Creator personas and characters', 6);

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.tag_categories(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  color VARCHAR(7), -- Hex color
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_tag_in_category UNIQUE (category_id, name)
);

-- Insert BroFanz Identity Tags
INSERT INTO public.tags (category_id, name, display_name, emoji)
SELECT tc.id, t.name, t.display_name, t.emoji
FROM public.tag_categories tc
CROSS JOIN (VALUES
  ('masc', 'Masc', '💪'),
  ('bro', 'Bro', '🤙'),
  ('jock', 'Jock', '🏈'),
  ('gym_guy', 'Gym Guy', '🏋️'),
  ('blue_collar', 'Blue-Collar Guy', '🔧'),
  ('dl_bro', 'DL Bro', '🤫'),
  ('trade', 'Trade', '🔥'),
  ('skater', 'Skater Guy', '🛹'),
  ('gamer', 'Gamer Guy', '🎮'),
  ('athlete', 'Athlete', '⚽'),
  ('queer_masc', 'Queer Masc', '🏳️‍🌈'),
  ('bi_bro', 'Bi Bro', '💜')
) AS t(name, display_name, emoji)
WHERE tc.name = 'identity';

-- Insert BroFanz Vibe Tags
INSERT INTO public.tags (category_id, name, display_name, emoji)
SELECT tc.id, t.name, t.display_name, t.emoji
FROM public.tag_categories tc
CROSS JOIN (VALUES
  ('chill_bro', 'Chill Bro', '😎'),
  ('locker_room_energy', 'Locker Room Energy', '🚿'),
  ('barbershop_vibes', 'Barbershop Vibes', '💈'),
  ('boyfriend_bro', 'Boyfriend Bro', '❤️'),
  ('rough_edges', 'Rough Around the Edges', '🔥'),
  ('goofy_bro', 'Goofy Bro', '😜'),
  ('alpha_energy', 'Alpha Energy', '👑'),
  ('lowkey_cutie', 'Low-Key Cutie', '🥰'),
  ('college_bro', 'College Bro', '🎓'),
  ('street_king', 'Street King', '👟'),
  ('one_of_guys', 'Just One of the Guys', '🤝'),
  ('playfully_cocky', 'Playfully Cocky', '😏')
) AS t(name, display_name, emoji)
WHERE tc.name = 'vibe';

-- Insert BroFanz Style Tags
INSERT INTO public.tags (category_id, name, display_name, emoji)
SELECT tc.id, t.name, t.display_name, t.emoji
FROM public.tag_categories tc
CROSS JOIN (VALUES
  ('streetwear', 'Streetwear', '👕'),
  ('athleisure', 'Athleisure', '🩳'),
  ('gym_fits', 'Gym Fits', '🏋️'),
  ('denim_boots', 'Denim & Work Boots', '👖'),
  ('snapback', 'Snapback Vibes', '🧢'),
  ('backpack_boy', 'Backpack Boy', '🎒'),
  ('inked', 'Inked/Tattooed', '🖋️'),
  ('beard_bro', 'Beard Bro', '🧔'),
  ('clean_cut', 'Clean-Cut', '✨'),
  ('rugged_clean', 'Rugged Clean', '🪵')
) AS t(name, display_name, emoji)
WHERE tc.name = 'style';

-- Insert BroFanz Lifestyle Tags
INSERT INTO public.tags (category_id, name, display_name, emoji)
SELECT tc.id, t.name, t.display_name, t.emoji
FROM public.tag_categories tc
CROSS JOIN (VALUES
  ('fitness', 'Fitness', '💪'),
  ('gaming', 'Gaming', '🎮'),
  ('cars_trucks', 'Cars & Trucks', '🚗'),
  ('sports', 'Sports', '🏀'),
  ('college_life', 'College Life', '📚'),
  ('bar_nights', 'Bar Nights', '🍺'),
  ('outdoor', 'Outdoor/Woods', '🌲'),
  ('worksite', 'Worksite Energy', '🏗️'),
  ('sneaker_culture', 'Sneaker Culture', '👟'),
  ('chill_streaming', 'Chill Streaming', '📺')
) AS t(name, display_name, emoji)
WHERE tc.name = 'lifestyle';

-- Insert BroFanz Body/Look Tags (non-explicit)
INSERT INTO public.tags (category_id, name, display_name, emoji)
SELECT tc.id, t.name, t.display_name, t.emoji
FROM public.tag_categories tc
CROSS JOIN (VALUES
  ('dad_bod', 'Dad Bod', '🐻'),
  ('lean_fit', 'Lean Fit', '🏃'),
  ('muscular', 'Muscular', '💪'),
  ('tall_guy', 'Tall Guy', '📏'),
  ('beard_energy', 'Beard Energy', '🧔'),
  ('fresh_fade', 'Fresh Fade', '💇'),
  ('rough_scruff', 'Rough Scruff', '🪒')
) AS t(name, display_name, emoji)
WHERE tc.name = 'body';

-- User tags junction table
CREATE TABLE public.user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_tag UNIQUE (user_id, tag_id)
);

-- ============================================================================
-- CREATOR PROFILES
-- ============================================================================

-- Creator profiles (extended info for creators)
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Profile customization
  banner_video_url TEXT,
  intro_video_url TEXT,
  custom_welcome_message TEXT,

  -- Subscription pricing
  subscription_price_monthly DECIMAL(10,2) DEFAULT 9.99,
  subscription_price_quarterly DECIMAL(10,2),
  subscription_price_yearly DECIMAL(10,2),
  free_trial_days INTEGER DEFAULT 0,

  -- Monetization settings
  tips_enabled BOOLEAN DEFAULT TRUE,
  min_tip_amount DECIMAL(10,2) DEFAULT 5.00,
  ppv_enabled BOOLEAN DEFAULT TRUE,
  messages_price DECIMAL(10,2) DEFAULT 0, -- Price per message, 0 = free

  -- Stats (denormalized for performance)
  subscriber_count INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_earnings DECIMAL(15,2) DEFAULT 0,

  -- BroFanz specific metrics
  bro_engagement_score DECIMAL(5,2) DEFAULT 0,
  gym_time_engagement DECIMAL(5,2) DEFAULT 0,

  -- Verification badges
  verified_creator BOOLEAN DEFAULT FALSE,
  top_creator BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,

  -- Schedule
  posting_schedule TEXT, -- JSON array of posting times

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTENT MANAGEMENT
-- ============================================================================

-- Posts/Content
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Content
  content_type content_type NOT NULL,
  caption TEXT,

  -- Media
  media_urls JSONB DEFAULT '[]', -- Array of {url, type, thumbnail, duration}
  thumbnail_url TEXT,

  -- Visibility and pricing
  visibility content_visibility DEFAULT 'public',
  ppv_price DECIMAL(10,2),

  -- Scheduling
  is_scheduled BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Stats
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  unlock_count INTEGER DEFAULT 0, -- For PPV content

  -- Moderation
  is_approved BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,

  -- Metadata
  hashtags TEXT[], -- Array of hashtags
  mentions UUID[], -- Array of mentioned user IDs

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Post tags junction
CREATE TABLE public.post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_post_tag UNIQUE (post_id, tag_id)
);

-- ============================================================================
-- SUBSCRIPTIONS & MONETIZATION
-- ============================================================================

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Subscription details
  status subscription_status DEFAULT 'active',
  price DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'

  -- Trial
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Payment
  payment_provider VARCHAR(50), -- 'ccbill', 'segpay', 'epoch', 'crypto'
  external_subscription_id VARCHAR(255),

  -- Auto-renew
  auto_renew BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_subscription UNIQUE (subscriber_id, creator_id)
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Parties
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Transaction details
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',

  -- Amounts
  gross_amount DECIMAL(15,2) NOT NULL,
  platform_fee DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Related entities
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  message_id UUID,

  -- Payment details
  payment_provider VARCHAR(50),
  external_transaction_id VARCHAR(255),
  payment_method VARCHAR(50),

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PPV Unlocks
CREATE TABLE public.ppv_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_ppv_unlock UNIQUE (user_id, post_id)
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL, -- Array of 2 user IDs

  -- Last message preview
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Status per participant (stored as JSONB)
  read_status JSONB DEFAULT '{}', -- {user_id: last_read_message_id}
  muted_by UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Content
  content TEXT,
  media_urls JSONB DEFAULT '[]',

  -- PPV message
  is_ppv BOOLEAN DEFAULT FALSE,
  ppv_price DECIMAL(10,2),
  ppv_unlocked_by UUID[] DEFAULT '{}',

  -- Status
  status message_status DEFAULT 'sent',
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ENGAGEMENT & SOCIAL
-- ============================================================================

-- Likes
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_like UNIQUE (user_id, post_id)
);

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,

  is_pinned BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Follows (for non-subscription follows)
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  collection_name VARCHAR(100) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_bookmark UNIQUE (user_id, post_id)
);

-- ============================================================================
-- SAFETY & MODERATION
-- ============================================================================

-- Blocks
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Region blocks (for DL/privacy)
CREATE TABLE public.region_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_country VARCHAR(3), -- ISO country code
  blocked_region VARCHAR(100), -- State/province
  blocked_city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- What's being reported
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,

  -- Report details
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  evidence_urls TEXT[],

  -- Status
  status report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'subscription', 'message', 'tip', etc.
  title VARCHAR(255),
  body TEXT,

  -- Related entities
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Action URL
  action_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Profile views
CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Anonymous tracking
  session_id VARCHAR(255),
  ip_hash VARCHAR(64), -- Hashed IP for privacy

  -- Context
  referrer TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post views
CREATE TABLE public.post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- View details
  view_duration INTEGER, -- Seconds watched for video
  completed BOOLEAN DEFAULT FALSE, -- For video completion

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator analytics (daily aggregates)
CREATE TABLE public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Engagement metrics
  profile_views INTEGER DEFAULT 0,
  post_views INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  churned_subscribers INTEGER DEFAULT 0,

  -- Revenue metrics
  subscription_revenue DECIMAL(15,2) DEFAULT 0,
  tip_revenue DECIMAL(15,2) DEFAULT 0,
  ppv_revenue DECIMAL(15,2) DEFAULT 0,
  message_revenue DECIMAL(15,2) DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_creator_date UNIQUE (creator_id, date)
);

-- ============================================================================
-- PAYOUT SYSTEM
-- ============================================================================

-- Creator payout accounts
CREATE TABLE public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Payout method
  payout_method VARCHAR(50) NOT NULL, -- 'paxum', 'ach', 'wire', 'crypto', 'payoneer', 'wise'

  -- Account details (encrypted)
  account_details_encrypted BYTEA,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Settings
  min_payout_amount DECIMAL(10,2) DEFAULT 50.00,
  auto_payout_enabled BOOLEAN DEFAULT TRUE,
  payout_schedule VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payout_account_id UUID NOT NULL REFERENCES public.payout_accounts(id),

  -- Amount
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  -- External reference
  external_payout_id VARCHAR(255),

  -- Processing
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Period covered
  period_start DATE,
  period_end DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LIVE STREAMING
-- ============================================================================

CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Stream info
  title VARCHAR(255),
  description TEXT,
  thumbnail_url TEXT,

  -- Stream settings
  is_private BOOLEAN DEFAULT FALSE, -- Subscribers only

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended'
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Stats
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_tips DECIMAL(15,2) DEFAULT 0,

  -- Recording
  recording_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (is_active = true AND is_banned = false);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT USING (
    visibility = 'public'
    AND is_approved = true
    AND deleted_at IS NULL
  );

CREATE POLICY "Subscribers can view subscriber-only posts" ON public.posts
  FOR SELECT USING (
    visibility = 'subscribers_only'
    AND is_approved = true
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriber_id = auth.uid()
      AND creator_id = posts.creator_id
      AND status = 'active'
    )
  );

CREATE POLICY "Creators can manage own posts" ON public.posts
  FOR ALL USING (creator_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
      AND auth.uid() = ANY(participant_ids)
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_creator ON public.users(is_creator) WHERE is_creator = true;
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- Posts indexes
CREATE INDEX idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX idx_posts_visibility ON public.posts(visibility);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_subscriber ON public.subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator ON public.subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Conversations indexes
CREATE INDEX idx_conversations_participants ON public.conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Tags indexes
CREATE INDEX idx_user_tags_user ON public.user_tags(user_id);
CREATE INDEX idx_user_tags_tag ON public.user_tags(tag_id);
CREATE INDEX idx_post_tags_post ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON public.post_tags(tag_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Analytics indexes
CREATE INDEX idx_creator_analytics_creator_date ON public.creator_analytics(creator_id, date DESC);
CREATE INDEX idx_profile_views_profile ON public.profile_views(profile_id);
CREATE INDEX idx_post_views_post ON public.post_views(post_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update post stats on like
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update subscriber count
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.creator_profiles
    SET subscriber_count = subscriber_count + 1
    WHERE user_id = NEW.creator_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.creator_profiles
      SET subscriber_count = subscriber_count + 1
      WHERE user_id = NEW.creator_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.creator_profiles
      SET subscriber_count = subscriber_count - 1
      WHERE user_id = NEW.creator_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.creator_profiles
    SET subscriber_count = subscriber_count - 1
    WHERE user_id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriber_count
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_tag_count
  AFTER INSERT OR DELETE ON public.user_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER trigger_update_post_tag_count
  AFTER INSERT OR DELETE ON public.post_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- This schema is ready to use with Supabase
-- Run migrations: npx supabase db push
-- Or execute this SQL directly in Supabase SQL Editor

-- ============================================================================
-- END OF BROFANZ SUPABASE SCHEMA
-- ============================================================================

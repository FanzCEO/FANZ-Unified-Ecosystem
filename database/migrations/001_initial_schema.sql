-- 🗄️ FANZ UNIFIED ECOSYSTEM - INITIAL DATABASE SCHEMA
-- Revolutionary creator economy platform database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE user_role AS ENUM ('fan', 'creator', 'admin', 'moderator');
CREATE TYPE content_type AS ENUM ('photo', 'video', 'live_stream', 'audio', 'text', 'nft');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'deleted');
CREATE TYPE transaction_type AS ENUM ('tip', 'subscription', 'purchase', 'withdrawal', 'token_purchase', 'revenue_share');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'paused');
CREATE TYPE space_type AS ENUM ('intimate_lounge', 'concert_venue', 'gallery_space', 'private_suite', 'meet_and_greet', 'workshop_studio', 'gaming_arena', 'nightclub', 'beach_resort', 'penthouse', 'fantasy_realm', 'space_station');

-- 👤 Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'fan',
    
    -- Profile information
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    birth_date DATE,
    location VARCHAR(100),
    website VARCHAR(255),
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 🎭 Creator profiles table
CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Creator-specific info
    stage_name VARCHAR(100),
    category VARCHAR(50),
    tags TEXT[],
    description TEXT,
    
    -- Verification
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_documents JSONB DEFAULT '[]',
    
    -- Pricing
    subscription_price DECIMAL(10,2) DEFAULT 0.00,
    tip_minimum DECIMAL(10,2) DEFAULT 1.00,
    
    -- Stats
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    total_tips DECIMAL(15,2) DEFAULT 0.00,
    subscriber_count INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    
    -- Social media
    social_links JSONB DEFAULT '{}',
    
    -- Blockchain
    wallet_address VARCHAR(42),
    token_contract_address VARCHAR(42),
    token_symbol VARCHAR(10),
    
    -- Settings
    allow_tips BOOLEAN DEFAULT TRUE,
    allow_messages BOOLEAN DEFAULT TRUE,
    auto_follow_back BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📱 Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    
    -- Content metadata
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    status content_status DEFAULT 'draft',
    
    -- Content files
    media_urls JSONB DEFAULT '[]',
    thumbnail_url VARCHAR(500),
    duration INTEGER, -- for video/audio in seconds
    file_size BIGINT, -- in bytes
    
    -- Access control
    is_premium BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    required_tokens INTEGER DEFAULT 0,
    
    -- Engagement
    view_count BIGINT DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- SEO and discovery
    tags TEXT[],
    search_vector TSVECTOR,
    
    -- Scheduling
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 💰 Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    creator_id UUID REFERENCES creator_profiles(id),
    
    -- Transaction details
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Platform fees
    platform_fee DECIMAL(15,2) DEFAULT 0.00,
    creator_earnings DECIMAL(15,2) DEFAULT 0.00,
    
    -- References
    content_id UUID REFERENCES content(id),
    subscription_id UUID,
    
    -- Payment processing
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    processor_transaction_id VARCHAR(100),
    processor_fee DECIMAL(15,2) DEFAULT 0.00,
    
    -- Blockchain
    blockchain_tx_hash VARCHAR(66),
    block_number BIGINT,
    gas_used BIGINT,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- 🔔 Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    
    -- Subscription details
    status subscription_status DEFAULT 'active',
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Billing
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    next_billing_date TIMESTAMP WITH TIME ZONE,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique active subscription per user-creator pair
    CONSTRAINT unique_active_subscription UNIQUE (subscriber_id, creator_id)
);

-- 💬 Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    media_urls JSONB DEFAULT '[]',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
    
    -- Pricing (for paid messages)
    price DECIMAL(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ⛓️ Blockchain tokens table
CREATE TABLE creator_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID UNIQUE NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    
    -- Token details
    token_name VARCHAR(100) NOT NULL,
    token_symbol VARCHAR(10) NOT NULL,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    
    -- Token economics
    total_supply BIGINT NOT NULL,
    current_supply BIGINT DEFAULT 0,
    current_price DECIMAL(18,8) NOT NULL,
    market_cap DECIMAL(20,2) DEFAULT 0.00,
    
    -- Trading
    total_volume DECIMAL(20,2) DEFAULT 0.00,
    holder_count INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    image_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🪙 Token holdings table
CREATE TABLE token_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES creator_tokens(id) ON DELETE CASCADE,
    
    -- Holdings
    balance BIGINT NOT NULL DEFAULT 0,
    total_purchased BIGINT DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0.00,
    
    -- Rewards
    total_dividends_earned DECIMAL(15,2) DEFAULT 0.00,
    last_dividend_claim TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    first_purchase_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_user_token_holding UNIQUE (user_id, token_id)
);

-- 🌐 Virtual spaces table
CREATE TABLE virtual_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    
    -- Space details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    space_type space_type NOT NULL,
    capacity INTEGER DEFAULT 50,
    
    -- Access control
    is_public BOOLEAN DEFAULT TRUE,
    entry_price DECIMAL(10,2) DEFAULT 0.00,
    required_tokens INTEGER DEFAULT 0,
    
    -- Environment settings
    environment_config JSONB DEFAULT '{}',
    interactables JSONB DEFAULT '[]',
    
    -- Stats
    total_visits INTEGER DEFAULT 0,
    current_users INTEGER DEFAULT 0,
    max_concurrent_users INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🌐 Virtual space sessions table
CREATE TABLE space_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES virtual_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    avatar_config JSONB DEFAULT '{}',
    position JSONB DEFAULT '{}',
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER
);

-- 🔬 Quantum AI jobs table
CREATE TABLE quantum_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job details
    job_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    
    -- Resources
    qubits_used INTEGER,
    execution_time_ms INTEGER,
    quantum_advantage DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 📊 Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Context
    user_id UUID REFERENCES users(id),
    creator_id UUID REFERENCES creator_profiles(id),
    content_id UUID REFERENCES content(id),
    session_id VARCHAR(100),
    
    -- Technical details
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔐 User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session details
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    
    -- Security
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 📝 Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    
    -- User context
    user_id UUID REFERENCES users(id),
    user_role user_role,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔍 Create indexes for performance
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Creator profiles indexes
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_category ON creator_profiles(category);
CREATE INDEX idx_creator_profiles_verified_at ON creator_profiles(verified_at);
CREATE INDEX idx_creator_profiles_subscriber_count ON creator_profiles(subscriber_count DESC);
CREATE INDEX idx_creator_profiles_total_earnings ON creator_profiles(total_earnings DESC);

-- Content indexes
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published_at ON content(published_at DESC);
CREATE INDEX idx_content_view_count ON content(view_count DESC);
CREATE INDEX idx_content_tags ON content USING GIN(tags);
CREATE INDEX idx_content_search ON content USING GIN(search_vector);

-- Transactions indexes
CREATE INDEX idx_transactions_from_user_id ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user_id ON transactions(to_user_id);
CREATE INDEX idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_blockchain_tx_hash ON transactions(blockchain_tx_hash);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- Messages indexes
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Token holdings indexes
CREATE INDEX idx_token_holdings_user_id ON token_holdings(user_id);
CREATE INDEX idx_token_holdings_token_id ON token_holdings(token_id);
CREATE INDEX idx_token_holdings_balance ON token_holdings(balance DESC);

-- Virtual spaces indexes
CREATE INDEX idx_virtual_spaces_creator_id ON virtual_spaces(creator_id);
CREATE INDEX idx_virtual_spaces_space_type ON virtual_spaces(space_type);
CREATE INDEX idx_virtual_spaces_is_public ON virtual_spaces(is_public);
CREATE INDEX idx_virtual_spaces_current_users ON virtual_spaces(current_users DESC);

-- Analytics indexes
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_creator_id ON analytics_events(creator_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- 🔄 Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_tokens_updated_at BEFORE UPDATE ON creator_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_token_holdings_updated_at BEFORE UPDATE ON token_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_virtual_spaces_updated_at BEFORE UPDATE ON virtual_spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🔍 Create search trigger for content
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON content 
    FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- 📊 Create views for common queries
CREATE VIEW creator_stats AS
SELECT 
    cp.id as creator_id,
    cp.user_id,
    u.username,
    u.display_name,
    cp.stage_name,
    cp.category,
    cp.subscriber_count,
    cp.total_earnings,
    cp.total_tips,
    cp.content_count,
    cp.view_count,
    COALESCE(ct.current_price, 0) as token_price,
    COALESCE(ct.market_cap, 0) as market_cap,
    COALESCE(ct.holder_count, 0) as token_holders,
    cp.created_at,
    cp.verified_at IS NOT NULL as is_verified
FROM creator_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN creator_tokens ct ON cp.id = ct.creator_id
WHERE u.is_active = TRUE;

CREATE VIEW user_portfolio AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(th.id) as tokens_owned,
    SUM(th.balance) as total_token_balance,
    SUM(th.total_spent) as total_invested,
    SUM(th.total_dividends_earned) as total_dividends,
    SUM(th.balance * ct.current_price) as portfolio_value
FROM users u
LEFT JOIN token_holdings th ON u.id = th.user_id
LEFT JOIN creator_tokens ct ON th.token_id = ct.id
GROUP BY u.id, u.username;

-- 🚀 REVOLUTIONARY DATABASE FEATURES:
-- ✅ Complete user and creator management
-- ✅ Content management with media support
-- ✅ Comprehensive transaction tracking
-- ✅ Subscription and billing system
-- ✅ Real-time messaging system
-- ✅ Blockchain token integration
-- ✅ Virtual metaverse spaces
-- ✅ Quantum AI job tracking
-- ✅ Advanced analytics events
-- ✅ Security and audit logging
-- ✅ Performance-optimized indexes
-- ✅ Full-text search capabilities
-- ✅ Automated timestamp management
-- ✅ Business intelligence views
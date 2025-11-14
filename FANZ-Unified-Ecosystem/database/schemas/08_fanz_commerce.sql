-- =====================================================
-- FANZ COMMERCE DATABASE
-- Products, bundles, orders, affiliates, revenue tracking
-- Used by: FanzCommerce, All Platforms
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PRODUCTS SCHEMA - Digital products
-- =====================================================

CREATE SCHEMA products;

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products.products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_number VARCHAR(50) UNIQUE NOT NULL,

    -- Creator
    creator_id UUID NOT NULL,

    -- Product details
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),

    -- Product type
    product_type VARCHAR(30) NOT NULL CHECK (product_type IN (
        'digital_content', 'photo_set', 'video', 'audio', 'ebook', 'bundle', 'custom_content', 'physical'
    )),

    -- Pricing (in cents)
    price BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Discounts
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_price BIGINT,
    discount_valid_until TIMESTAMP,

    -- Content
    content_asset_ids UUID[], -- References assets from fanz_media
    preview_asset_ids UUID[],
    thumbnail_url TEXT,

    -- Digital delivery
    download_url TEXT,
    download_expires_hours INTEGER DEFAULT 48,
    download_limit INTEGER DEFAULT 3,

    -- Physical product (if applicable)
    requires_shipping BOOLEAN DEFAULT FALSE,
    shipping_weight_grams INTEGER,

    -- Inventory
    is_limited BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER,
    sold_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'sold_out', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,

    -- SEO
    slug VARCHAR(255) UNIQUE,
    tags TEXT[],

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats (cached)
    views_count INTEGER DEFAULT 0,
    purchases_count INTEGER DEFAULT 0,
    revenue_total BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,

    CONSTRAINT products_price_positive CHECK (price > 0)
);

CREATE INDEX idx_products_creator ON products.products(creator_id, status);
CREATE INDEX idx_products_platform ON products.products(platform_id, status);
CREATE INDEX idx_products_status ON products.products(status) WHERE status = 'active';
CREATE INDEX idx_products_featured ON products.products(is_featured, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_products_slug ON products.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_products_tags ON products.products USING gin(tags);

COMMENT ON TABLE products.products IS 'Digital and physical products for sale';

-- =====================================================
-- PRODUCT BUNDLES
-- =====================================================

CREATE TABLE products.bundles (
    bundle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_number VARCHAR(50) UNIQUE NOT NULL,

    -- Creator
    creator_id UUID NOT NULL,

    -- Bundle details
    bundle_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Products included
    product_ids UUID[] NOT NULL,

    -- Pricing (in cents)
    individual_price_total BIGINT NOT NULL, -- Sum of individual prices
    bundle_price BIGINT NOT NULL, -- Discounted bundle price
    savings_amount BIGINT GENERATED ALWAYS AS (individual_price_total - bundle_price) STORED,
    savings_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN individual_price_total > 0
        THEN ((individual_price_total - bundle_price)::DECIMAL / individual_price_total * 100)
        ELSE 0 END
    ) STORED,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats
    purchases_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT bundles_savings CHECK (bundle_price < individual_price_total)
);

CREATE INDEX idx_bundles_creator ON products.bundles(creator_id, status);
CREATE INDEX idx_bundles_status ON products.bundles(status) WHERE status = 'active';
CREATE INDEX idx_bundles_products ON products.bundles USING gin(product_ids);

COMMENT ON TABLE products.bundles IS 'Product bundles with discounted pricing';

-- =====================================================
-- ORDERS SCHEMA
-- =====================================================

CREATE SCHEMA orders;

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders.orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,

    -- Buyer
    buyer_user_id UUID NOT NULL,

    -- Seller
    seller_creator_id UUID NOT NULL,

    -- Order type
    order_type VARCHAR(30) NOT NULL CHECK (order_type IN (
        'product_purchase', 'bundle_purchase', 'ppv_unlock', 'tip', 'custom_content'
    )),

    -- Items
    product_ids UUID[],
    bundle_id UUID,

    -- Pricing (in cents)
    subtotal BIGINT NOT NULL,
    discount_amount BIGINT DEFAULT 0,
    tax_amount BIGINT DEFAULT 0,
    shipping_cost BIGINT DEFAULT 0,
    total_amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment
    transaction_id UUID,
    payment_processor VARCHAR(50),
    payment_method VARCHAR(30),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
    )),

    -- Delivery
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending', 'processing', 'delivered', 'failed', 'refunded'
    )),
    delivery_method VARCHAR(30) CHECK (delivery_method IN ('download', 'email', 'shipping', 'unlock')),
    delivered_at TIMESTAMP,

    -- Shipping (if applicable)
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),

    -- Download tracking
    download_count INTEGER DEFAULT 0,
    last_download_at TIMESTAMP,

    -- Refund
    refund_amount BIGINT,
    refund_reason TEXT,
    refunded_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_orders_buyer ON orders.orders(buyer_user_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders.orders(seller_creator_id, created_at DESC);
CREATE INDEX idx_orders_platform ON orders.orders(platform_id, created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders.orders(payment_status);
CREATE INDEX idx_orders_delivery_status ON orders.orders(delivery_status);
CREATE INDEX idx_orders_date ON orders.orders(created_at DESC);

COMMENT ON TABLE orders.orders IS 'Product and content orders';

-- =====================================================
-- ORDER ITEMS
-- =====================================================

CREATE TABLE orders.order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders.orders(order_id) ON DELETE CASCADE,

    -- Item details
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('product', 'bundle', 'content')),
    product_id UUID,
    bundle_id UUID,

    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,

    -- Pricing (in cents)
    unit_price BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    discount_amount BIGINT DEFAULT 0,
    total_price BIGINT NOT NULL,

    -- Digital assets
    content_asset_ids UUID[],

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON orders.order_items(order_id);
CREATE INDEX idx_order_items_product ON orders.order_items(product_id) WHERE product_id IS NOT NULL;

COMMENT ON TABLE orders.order_items IS 'Individual items within an order';

-- =====================================================
-- AFFILIATES SCHEMA
-- =====================================================

CREATE SCHEMA affiliates;

-- =====================================================
-- AFFILIATES
-- =====================================================

CREATE TABLE affiliates.affiliates (
    affiliate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,

    -- Affiliate details
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    affiliate_name VARCHAR(255) NOT NULL,

    -- Commission rates
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    fixed_commission_amount BIGINT,

    -- Payout settings
    payout_threshold BIGINT DEFAULT 5000, -- Minimum to request payout (cents)
    payout_method VARCHAR(30),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Stats (cached)
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    total_commissions_earned BIGINT DEFAULT 0,
    total_commissions_paid BIGINT DEFAULT 0,
    pending_commissions BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliates_user ON affiliates.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates.affiliates(status);
CREATE INDEX idx_affiliates_platform ON affiliates.affiliates(platform_id, status);

COMMENT ON TABLE affiliates.affiliates IS 'Affiliate program participants';

-- =====================================================
-- AFFILIATE CLICKS
-- =====================================================

CREATE TABLE affiliates.clicks (
    click_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates.affiliates(affiliate_id),

    -- Click details
    clicked_url TEXT NOT NULL,
    referrer_url TEXT,

    -- Visitor info
    visitor_user_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(20),

    -- Location
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Conversion
    converted BOOLEAN DEFAULT FALSE,
    conversion_order_id UUID,
    converted_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamp
    clicked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_affiliate ON affiliates.clicks(affiliate_id, clicked_at DESC);
CREATE INDEX idx_clicks_visitor ON affiliates.clicks(visitor_user_id) WHERE visitor_user_id IS NOT NULL;
CREATE INDEX idx_clicks_converted ON affiliates.clicks(affiliate_id, converted) WHERE converted = TRUE;
CREATE INDEX idx_clicks_date ON affiliates.clicks(clicked_at DESC);

COMMENT ON TABLE affiliates.clicks IS 'Affiliate link clicks tracking';

-- =====================================================
-- AFFILIATE COMMISSIONS
-- =====================================================

CREATE TABLE affiliates.commissions (
    commission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates.affiliates(affiliate_id),

    -- Order reference
    order_id UUID NOT NULL,
    click_id UUID REFERENCES affiliates.clicks(click_id),

    -- Commission calculation
    order_amount BIGINT NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'paid', 'cancelled', 'reversed'
    )),

    -- Payout
    payout_id UUID,
    paid_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Timestamps
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP
);

CREATE INDEX idx_commissions_affiliate ON affiliates.commissions(affiliate_id, status, earned_at DESC);
CREATE INDEX idx_commissions_order ON affiliates.commissions(order_id);
CREATE INDEX idx_commissions_status ON affiliates.commissions(status);
CREATE INDEX idx_commissions_pending ON affiliates.commissions(affiliate_id, earned_at DESC) WHERE status = 'pending';

COMMENT ON TABLE affiliates.commissions IS 'Affiliate commission tracking';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON products.bundles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates.affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate product number
CREATE OR REPLACE FUNCTION generate_product_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.product_number = 'PROD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.product_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_product_number_trigger BEFORE INSERT ON products.products
    FOR EACH ROW EXECUTE FUNCTION generate_product_number();

-- Auto-generate bundle number
CREATE OR REPLACE FUNCTION generate_bundle_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.bundle_number = 'BUN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.bundle_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_bundle_number_trigger BEFORE INSERT ON products.bundles
    FOR EACH ROW EXECUTE FUNCTION generate_bundle_number();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(NEW.order_id::TEXT, 1, 8));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Update product sold count
CREATE OR REPLACE FUNCTION update_product_sold_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        UPDATE products.products
        SET sold_count = sold_count + 1,
            purchases_count = purchases_count + 1,
            revenue_total = revenue_total + NEW.total_amount
        WHERE product_id = ANY(NEW.product_ids);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_stats_trigger AFTER INSERT OR UPDATE ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION update_product_sold_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on orders
ALTER TABLE orders.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own orders
CREATE POLICY orders_buyer_access ON orders.orders
    FOR SELECT
    USING (buyer_user_id = current_setting('app.current_user_id')::UUID);

-- Sellers can see orders for their products
CREATE POLICY orders_seller_access ON orders.orders
    FOR SELECT
    USING (seller_creator_id IN (
        SELECT creator_id FROM creators.profiles WHERE user_id = current_setting('app.current_user_id')::UUID
    ));

-- =====================================================
-- VIEWS
-- =====================================================

-- Active products view
CREATE VIEW products.active_products AS
SELECT
    p.product_id,
    p.product_number,
    p.creator_id,
    p.product_name,
    p.description,
    p.product_type,
    p.price,
    p.currency,
    p.discount_price,
    p.thumbnail_url,
    p.sold_count,
    p.views_count,
    p.is_featured,
    p.platform_id,
    p.created_at
FROM products.products p
WHERE p.status = 'active';

COMMENT ON VIEW products.active_products IS 'Active products available for purchase';

-- Order summary view
CREATE VIEW orders.order_summary AS
SELECT
    o.order_id,
    o.order_number,
    o.buyer_user_id,
    o.seller_creator_id,
    o.order_type,
    o.total_amount,
    o.currency,
    o.payment_status,
    o.delivery_status,
    o.platform_id,
    o.created_at,
    o.completed_at,
    COUNT(oi.item_id) as item_count
FROM orders.orders o
LEFT JOIN orders.order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;

COMMENT ON VIEW orders.order_summary IS 'Order overview with item counts';

-- Affiliate performance view
CREATE VIEW affiliates.affiliate_performance AS
SELECT
    a.affiliate_id,
    a.affiliate_code,
    a.affiliate_name,
    a.commission_percentage,
    a.status,
    a.total_clicks,
    a.total_conversions,
    a.total_revenue,
    a.total_commissions_earned,
    a.pending_commissions,
    CASE WHEN a.total_clicks > 0
        THEN (a.total_conversions::DECIMAL / a.total_clicks * 100)
        ELSE 0
    END as conversion_rate
FROM affiliates.affiliates a;

COMMENT ON VIEW affiliates.affiliate_performance IS 'Affiliate performance metrics';

-- =====================================================
-- GRANTS
-- =====================================================

-- Products schema access
GRANT SELECT ON ALL TABLES IN SCHEMA products TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA products TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA products TO platform_app_rw;

-- Orders schema access
GRANT SELECT ON ALL TABLES IN SCHEMA orders TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA orders TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA orders TO platform_app_rw;

-- Affiliates schema access
GRANT SELECT ON ALL TABLES IN SCHEMA affiliates TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA affiliates TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA affiliates TO platform_app_rw;

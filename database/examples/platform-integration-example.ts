/**
 * FANZ Platform Integration Example
 *
 * This file demonstrates how to integrate a platform with the
 * FANZ database infrastructure using the database client library.
 *
 * Copy this pattern to each of the 94 platforms.
 */

import { FanzDatabaseClient, FanzDatabaseHelpers, createDatabaseClient } from '../lib/database-client';

// =====================================================
// 1. Initialize Database Client
// =====================================================

const db = createDatabaseClient({
  platformId: 'boyfanz',  // Change for each platform
  tenantId: process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001',

  // Connection settings (from environment)
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fanz_ecosystem',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool settings
  poolMax: 10,
  poolMin: 2,

  // SSL in production
  ssl: process.env.NODE_ENV === 'production',

  // Logging
  logSlowQueries: true,
  slowQueryThresholdMs: 1000
});

// Helper for common operations
const helpers = new FanzDatabaseHelpers(db);

// =====================================================
// 2. User Management Examples
// =====================================================

/**
 * Create a new user
 */
async function createUser(email: string, handle: string, password: string) {
  const hashedPassword = await hashPassword(password); // Your password hashing function

  const user = await helpers.insert('users', {
    handle,
    email,
    password_hash: hashedPassword,
    tenant_id: process.env.TENANT_ID,
    platform_id: 'boyfanz',
    status: 'active',
    user_type: 'fan'
  });

  console.log('User created:', user.user_id);
  return user;
}

/**
 * Get user by email
 */
async function getUserByEmail(email: string) {
  const user = await db.queryOne(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );

  return user;
}

/**
 * Update user profile
 */
async function updateUserProfile(userId: string, data: { display_name?: string; bio?: string; avatar_url?: string }) {
  const user = await helpers.update('users', userId, {
    ...data,
    updated_at: new Date()
  }, {
    userId, // Sets app.current_user_id for RLS
    userRole: 'user'
  });

  return user;
}

// =====================================================
// 3. Creator Profile Examples
// =====================================================

/**
 * Create creator profile
 */
async function createCreatorProfile(userId: string, displayName: string) {
  const creator = await helpers.insert('creators.profiles', {
    user_id: userId,
    display_name: displayName,
    tenant_id: process.env.TENANT_ID,
    platform_id: 'boyfanz',
    creator_type: 'individual',
    primary_category: 'fitness',
    status: 'active'
  }, {
    userId,
    userRole: 'creator'
  });

  console.log('Creator profile created:', creator.creator_id);
  return creator;
}

/**
 * Create subscription tier
 */
async function createSubscriptionTier(creatorId: string, tierData: {
  name: string;
  description: string;
  monthlyPrice: number;
}) {
  const tier = await helpers.insert('creators.subscription_tiers', {
    creator_id: creatorId,
    tier_name: tierData.name,
    tier_description: tierData.description,
    tier_level: 1,
    monthly_price: tierData.monthlyPrice, // In cents
    currency: 'USD',
    tenant_id: process.env.TENANT_ID,
    platform_id: 'boyfanz',
    is_active: true
  });

  return tier;
}

// =====================================================
// 4. Subscription Examples
// =====================================================

/**
 * Create subscription
 */
async function createSubscription(fanId: string, creatorId: string, tierId: string, amount: number) {
  return await db.transaction(async (client) => {
    // Create subscription
    const subscription = await client.query(`
      INSERT INTO fans.subscriptions (
        fan_id, creator_id, tier_id, billing_cycle, amount, currency,
        status, current_period_start, current_period_end, next_billing_date,
        tenant_id, platform_id
      ) VALUES ($1, $2, $3, 'monthly', $4, 'USD', 'active', NOW(), NOW() + INTERVAL '1 month', NOW() + INTERVAL '1 month', $5, $6)
      RETURNING *
    `, [fanId, creatorId, tierId, amount, process.env.TENANT_ID, 'boyfanz']);

    // Create transaction in ledger
    await client.query(`
      INSERT INTO ledger.transactions (
        from_account_id, to_account_id, amount, currency, type, status,
        subscription_id, tenant_id, platform_id
      )
      SELECT
        (SELECT account_id FROM ledger.accounts WHERE user_id = $1 AND account_type = 'fan'),
        (SELECT account_id FROM ledger.accounts WHERE user_id = $2 AND account_type = 'creator'),
        $3, 'USD', 'subscription', 'completed',
        $4, $5, $6
    `, [fanId, creatorId, amount, subscription.rows[0].subscription_id, process.env.TENANT_ID, 'boyfanz']);

    return subscription.rows[0];
  });
}

/**
 * Get user's active subscriptions
 */
async function getUserSubscriptions(userId: string) {
  const subscriptions = await db.queryMany(`
    SELECT
      s.*,
      c.display_name as creator_name,
      c.avatar_url as creator_avatar,
      t.tier_name
    FROM fans.subscriptions s
    JOIN creators.profiles c ON s.creator_id = c.creator_id
    LEFT JOIN creators.subscription_tiers t ON s.tier_id = t.tier_id
    WHERE s.fan_id = (SELECT fan_id FROM fans.profiles WHERE user_id = $1)
      AND s.status = 'active'
    ORDER BY s.subscribed_at DESC
  `, [userId], {
    userId,
    userRole: 'user'
  });

  return subscriptions;
}

// =====================================================
// 5. Post/Content Examples
// =====================================================

/**
 * Create a post
 */
async function createPost(creatorId: string, userId: string, content: {
  text: string;
  mediaAssetIds?: string[];
  accessType: 'public' | 'subscribers_only' | 'ppv';
  ppvPrice?: number;
}) {
  const post = await helpers.insert('posts.posts', {
    creator_id: creatorId,
    user_id: userId,
    content_text: content.text,
    content_type: content.mediaAssetIds?.length ? 'photo' : 'text',
    media_asset_ids: content.mediaAssetIds || [],
    media_count: content.mediaAssetIds?.length || 0,
    access_type: content.accessType,
    ppv_price: content.ppvPrice,
    status: 'published',
    published_at: new Date(),
    tenant_id: process.env.TENANT_ID,
    platform_id: 'boyfanz'
  }, {
    userId,
    userRole: 'creator'
  });

  return post;
}

/**
 * Get user feed
 */
async function getUserFeed(userId: string, limit = 20, offset = 0) {
  const posts = await db.queryMany(`
    SELECT
      p.*,
      c.display_name as creator_name,
      c.avatar_url as creator_avatar,
      c.is_verified as creator_verified,
      EXISTS(
        SELECT 1 FROM posts.likes
        WHERE post_id = p.post_id AND user_id = $1
      ) as user_has_liked
    FROM posts.posts p
    JOIN creators.profiles c ON p.creator_id = c.creator_id
    WHERE p.status = 'published'
      AND p.is_deleted = FALSE
      AND (
        p.access_type = 'public'
        OR (
          p.access_type = 'subscribers_only'
          AND EXISTS(
            SELECT 1 FROM fans.subscriptions s
            WHERE s.creator_id = p.creator_id
              AND s.fan_id = (SELECT fan_id FROM fans.profiles WHERE user_id = $1)
              AND s.status = 'active'
          )
        )
      )
    ORDER BY p.published_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset], {
    userId,
    userRole: 'user'
  });

  return posts;
}

// =====================================================
// 6. Payment/Transaction Examples
// =====================================================

/**
 * Process tip
 */
async function processTip(fanId: string, creatorId: string, amount: number, message?: string) {
  return await db.transaction(async (client) => {
    // Get accounts
    const fanAccount = await client.query(
      'SELECT account_id FROM ledger.accounts WHERE user_id = $1 AND account_type = $2',
      [fanId, 'fan']
    );

    const creatorAccount = await client.query(
      'SELECT account_id FROM ledger.accounts WHERE user_id = $1 AND account_type = $2',
      [creatorId, 'creator']
    );

    // Create transaction
    const transaction = await client.query(`
      INSERT INTO ledger.transactions (
        from_account_id, to_account_id, amount, currency, type,
        status, platform_id, tenant_id
      ) VALUES ($1, $2, $3, 'USD', 'tip', 'completed', $4, $5)
      RETURNING *
    `, [
      fanAccount.rows[0].account_id,
      creatorAccount.rows[0].account_id,
      amount,
      'boyfanz',
      process.env.TENANT_ID
    ]);

    // Create tip record
    const tip = await client.query(`
      INSERT INTO fans.tips (
        fan_id, creator_id, amount, currency, message, is_anonymous,
        transaction_id, platform_id, tenant_id
      ) VALUES (
        (SELECT fan_id FROM fans.profiles WHERE user_id = $1),
        (SELECT creator_id FROM creators.profiles WHERE user_id = $2),
        $3, 'USD', $4, FALSE,
        $5, $6, $7
      )
      RETURNING *
    `, [fanId, creatorId, amount, message, transaction.rows[0].transaction_id, 'boyfanz', process.env.TENANT_ID]);

    // Update balances
    await client.query(`
      UPDATE ledger.balances
      SET available_balance = available_balance + $1
      WHERE account_id = $2
    `, [amount, creatorAccount.rows[0].account_id]);

    return tip.rows[0];
  });
}

// =====================================================
// 7. Custom Content Request Examples
// =====================================================

/**
 * Create custom content request
 */
async function createCustomContentRequest(fanUserId: string, creatorUserId: string, request: {
  contentType: string;
  description: string;
  proposedAmount: number;
  dueDate: Date;
}) {
  // This would use the CustomContentRequestService from your payment implementation
  // Here's a simplified version:

  const contentRequest = await helpers.insert('custom_content_requests', {
    fan_user_id: fanUserId,
    creator_user_id: creatorUserId,
    content_type: request.contentType,
    description: request.description,
    proposed_amount: request.proposedAmount,
    currency: 'USD',
    due_date: request.dueDate,
    status: 'pending_creator_review',
    platform_id: 'boyfanz',
    tenant_id: process.env.TENANT_ID
  });

  return contentRequest;
}

// =====================================================
// 8. Analytics Event Tracking
// =====================================================

/**
 * Track analytics event
 */
async function trackEvent(eventName: string, userId: string | null, properties: Record<string, any>) {
  await helpers.insert('events.raw_events', {
    event_name: eventName,
    event_category: 'user_interaction',
    user_id: userId,
    platform_id: 'boyfanz',
    tenant_id: process.env.TENANT_ID,
    properties: properties,
    device_type: properties.device_type,
    ip_address: properties.ip_address,
    event_timestamp: new Date()
  });
}

// =====================================================
// 9. Search Examples
// =====================================================

/**
 * Search creators
 */
async function searchCreators(query: string, limit = 20) {
  const creators = await db.queryMany(`
    SELECT
      ci.creator_id,
      ci.display_name,
      ci.bio,
      ci.tags,
      ci.categories,
      ci.fan_count,
      ci.is_verified,
      cp.avatar_url
    FROM search.creator_index ci
    JOIN creators.profiles cp ON ci.creator_id = cp.creator_id
    WHERE ci.is_searchable = TRUE
      AND ci.platform_id = $1
      AND (
        ci.display_name_normalized ILIKE $2
        OR ci.search_vector @@ plainto_tsquery('english', $3)
      )
    ORDER BY ci.ranking_score DESC
    LIMIT $4
  `, ['boyfanz', `%${query}%`, query, limit]);

  return creators;
}

// =====================================================
// 10. Health Check & Monitoring
// =====================================================

/**
 * Health check endpoint
 */
async function healthCheck() {
  const isHealthy = await db.healthCheck();
  const poolStats = db.getPoolStats();

  return {
    database: {
      healthy: isHealthy,
      pool: poolStats
    }
  };
}

// =====================================================
// 11. Cleanup
// =====================================================

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('Closing database connections...');
  await db.close();
  console.log('Database connections closed');
}

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// =====================================================
// Export functions for use in your application
// =====================================================

export {
  db,
  helpers,
  createUser,
  getUserByEmail,
  updateUserProfile,
  createCreatorProfile,
  createSubscriptionTier,
  createSubscription,
  getUserSubscriptions,
  createPost,
  getUserFeed,
  processTip,
  createCustomContentRequest,
  trackEvent,
  searchCreators,
  healthCheck,
  shutdown
};

// =====================================================
// Usage in Express.js Application
// =====================================================

/*
import express from 'express';
import {
  db,
  getUserByEmail,
  getUserSubscriptions,
  healthCheck
} from './platform-integration-example';

const app = express();

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  res.json(health);
});

// Get user subscriptions
app.get('/api/subscriptions', async (req, res) => {
  try {
    const userId = req.user.id; // From your auth middleware
    const subscriptions = await getUserSubscriptions(userId);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/

// Placeholder for password hashing (implement with bcrypt)
async function hashPassword(password: string): Promise<string> {
  // Use bcrypt in production
  return `hashed_${password}`;
}

/**
 * FanzDiscreete Integration Examples
 *
 * Complete examples for integrating FanzDiscreete discreet payment system
 * with CCBill under Grp Hldings branding
 */

import { createDatabaseClient, FanzDatabaseHelpers } from '../lib/database-client';

// =====================================================
// Initialize Database Client
// =====================================================

const db = createDatabaseClient({
  platformId: 'fanzmoneydash',  // FanzDiscreete is managed via FanzMoneyDash
  tenantId: process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001'
});

const helpers = new FanzDatabaseHelpers(db);

// =====================================================
// 1. FanzDiscreete Card Management
// =====================================================

/**
 * Create a new FanzDiscreete card for a user
 */
async function createDiscreteCard(userId: string, cardType: 'prepaid' | 'reloadable' | 'gift' = 'reloadable') {
  // Generate virtual card number (last 4 digits will be visible)
  const cardNumber = `FANZ${generateRandomDigits(12)}${generateRandomDigits(4)}`;

  const card = await helpers.insert('discrete.discrete_cards', {
    user_id: userId,
    card_number: cardNumber,
    card_display_name: 'FanzDiscreete Card',
    card_type: cardType,
    balance_cents: 0,
    available_balance_cents: 0,
    pending_balance_cents: 0,
    held_balance_cents: 0,
    max_balance_cents: 500000, // $5,000 default limit
    daily_spend_limit_cents: 100000, // $1,000 daily
    monthly_spend_limit_cents: 500000, // $5,000 monthly
    status: 'active',
    vault_mode_enabled: false,
    biometric_required: false,
    tenant_id: process.env.TENANT_ID,
    platform_id: 'fanzmoneydash'
  });

  console.log('FanzDiscreete card created:', {
    card_id: card.card_id,
    card_number_last_4: cardNumber.slice(-4),
    card_type: cardType
  });

  return card;
}

/**
 * Enable vault mode on a card (requires biometric auth to access)
 */
async function enableVaultMode(cardId: string, pinHash?: string) {
  const card = await helpers.update('discrete.discrete_cards', cardId, {
    vault_mode_enabled: true,
    biometric_required: true,
    pin_hash: pinHash,
    updated_at: new Date()
  });

  console.log('Vault mode enabled for card:', cardId);
  return card;
}

/**
 * Get user's FanzDiscreete cards
 */
async function getUserDiscreteCards(userId: string) {
  const cards = await db.queryMany(`
    SELECT * FROM discrete.v_user_cards
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);

  return cards;
}

// =====================================================
// 2. Loading Cards via CCBill
// =====================================================

/**
 * Load a FanzDiscreete card using CCBill
 * This creates a transaction with a neutral billing descriptor
 */
async function loadCardViaCCBill(
  cardId: string,
  amountCents: number,
  ccbillToken: string,
  paymentMethod: {
    type: 'credit_card' | 'debit_card';
    last_four: string;
    brand: string;
  }
) {
  return await db.transaction(async (client) => {
    // 1. Get merchant configuration for balance reload
    const merchant = await client.query(`
      SELECT * FROM discrete.ccbill_merchants
      WHERE merchant_type = 'balance_reload'
        AND is_active = TRUE
      LIMIT 1
    `);

    if (merchant.rows.length === 0) {
      throw new Error('No active CCBill merchant configured for balance reload');
    }

    const merchantConfig = merchant.rows[0];

    // 2. Create card load transaction
    const load = await client.query(`
      INSERT INTO discrete.card_loads (
        card_id,
        user_id,
        amount_cents,
        currency,
        ccbill_transaction_id,
        merchant_id,
        merchant_descriptor,
        payment_method,
        payment_last_four,
        payment_brand,
        status,
        processing_fee_cents,
        platform_fee_cents,
        ip_address,
        tenant_id,
        platform_id
      )
      SELECT
        $1,
        c.user_id,
        $2,
        'USD',
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'processing',
        $9,
        $10,
        $11,
        c.tenant_id,
        c.platform_id
      FROM discrete.discrete_cards c
      WHERE c.card_id = $1
      RETURNING *
    `, [
      cardId,
      amountCents,
      ccbillToken,
      merchantConfig.merchant_id,
      merchantConfig.merchant_descriptor, // e.g., "GH Digital Services"
      paymentMethod.type,
      paymentMethod.last_four,
      paymentMethod.brand,
      Math.floor(amountCents * 0.029), // 2.9% processing fee
      Math.floor(amountCents * 0.01),  // 1% platform fee
      null // IP address (get from request)
    ]);

    console.log('Card load transaction created:', {
      load_id: load.rows[0].load_id,
      amount: `$${amountCents / 100}`,
      descriptor: merchantConfig.merchant_descriptor,
      status: 'processing'
    });

    // 3. In production: Call CCBill API to process payment
    // const ccbillResult = await processCCBillPayment(...)

    // 4. For this example, simulate immediate success
    await client.query(`
      UPDATE discrete.card_loads
      SET
        status = 'completed',
        completed_at = NOW()
      WHERE load_id = $1
    `, [load.rows[0].load_id]);

    // Balance automatically updated by database trigger

    return load.rows[0];
  });
}

/**
 * Set up recurring auto-reload for a card via CCBill subscription
 */
async function setupAutoReload(
  cardId: string,
  reloadAmountCents: number,
  reloadFrequency: 'weekly' | 'monthly',
  ccbillSubscriptionId: string
) {
  const card = await helpers.update('discrete.discrete_cards', cardId, {
    ccbill_subscription_id: ccbillSubscriptionId,
    updated_at: new Date()
  });

  console.log('Auto-reload configured:', {
    card_id: cardId,
    amount: `$${reloadAmountCents / 100}`,
    frequency: reloadFrequency,
    subscription_id: ccbillSubscriptionId
  });

  return card;
}

// =====================================================
// 3. Spending with FanzDiscreete Cards
// =====================================================

/**
 * Purchase a subscription using FanzDiscreete card
 */
async function purchaseSubscriptionWithDiscreete(
  cardId: string,
  creatorId: string,
  tierId: string,
  amountCents: number
) {
  return await db.transaction(async (client) => {
    // 1. Check card balance
    const card = await client.query(
      'SELECT available_balance_cents, user_id FROM discrete.discrete_cards WHERE card_id = $1',
      [cardId]
    );

    if (card.rows[0].available_balance_cents < amountCents) {
      throw new Error('Insufficient FanzDiscreete balance');
    }

    const userId = card.rows[0].user_id;

    // 2. Create spend transaction
    const spend = await client.query(`
      INSERT INTO discrete.card_spends (
        card_id,
        user_id,
        amount_cents,
        currency,
        purchase_type,
        creator_id,
        status,
        tenant_id,
        platform_id
      ) VALUES ($1, $2, $3, 'USD', 'subscription', $4, 'authorized', $5, $6)
      RETURNING *
    `, [cardId, userId, amountCents, creatorId, process.env.TENANT_ID, 'fanzmoneydash']);

    // 3. Create main ledger transaction
    const ledgerTx = await client.query(`
      INSERT INTO ledger.transactions (
        from_account_id,
        to_account_id,
        amount,
        currency,
        type,
        status,
        platform_id,
        tenant_id
      )
      SELECT
        (SELECT account_id FROM ledger.accounts WHERE user_id = $1 AND account_type = 'fan'),
        (SELECT account_id FROM ledger.accounts WHERE user_id = $2 AND account_type = 'creator'),
        $3,
        'USD',
        'subscription',
        'completed',
        $4,
        $5
      RETURNING transaction_id
    `, [userId, creatorId, amountCents, 'fanzmoneydash', process.env.TENANT_ID]);

    // 4. Link spend to ledger and complete
    await client.query(`
      UPDATE discrete.card_spends
      SET
        ledger_transaction_id = $1,
        status = 'completed',
        completed_at = NOW()
      WHERE spend_id = $2
    `, [ledgerTx.rows[0].transaction_id, spend.rows[0].spend_id]);

    // 5. Create subscription record
    const subscription = await client.query(`
      INSERT INTO fans.subscriptions (
        fan_id,
        creator_id,
        tier_id,
        billing_cycle,
        amount,
        currency,
        status,
        current_period_start,
        current_period_end,
        next_billing_date,
        tenant_id,
        platform_id
      )
      SELECT
        (SELECT fan_id FROM fans.profiles WHERE user_id = $1),
        $2,
        $3,
        'monthly',
        $4,
        'USD',
        'active',
        NOW(),
        NOW() + INTERVAL '1 month',
        NOW() + INTERVAL '1 month',
        $5,
        $6
      RETURNING *
    `, [userId, creatorId, tierId, amountCents, process.env.TENANT_ID, 'fanzmoneydash']);

    console.log('Subscription purchased with FanzDiscreete:', {
      subscription_id: subscription.rows[0].subscription_id,
      amount: `$${amountCents / 100}`,
      creator_id: creatorId,
      payment_method: 'FanzDiscreete (discreet)'
    });

    return {
      spend: spend.rows[0],
      subscription: subscription.rows[0]
    };
  });
}

/**
 * Send a tip using FanzDiscreete card
 */
async function sendTipWithDiscreete(
  cardId: string,
  creatorId: string,
  amountCents: number,
  message?: string,
  isAnonymous: boolean = false
) {
  return await db.transaction(async (client) => {
    // Check balance
    const card = await client.query(
      'SELECT available_balance_cents, user_id FROM discrete.discrete_cards WHERE card_id = $1',
      [cardId]
    );

    if (card.rows[0].available_balance_cents < amountCents) {
      throw new Error('Insufficient FanzDiscreete balance');
    }

    const userId = card.rows[0].user_id;

    // Create spend transaction
    const spend = await client.query(`
      INSERT INTO discrete.card_spends (
        card_id, user_id, amount_cents, purchase_type, creator_id,
        is_anonymous, status, tenant_id, platform_id
      ) VALUES ($1, $2, $3, 'tip', $4, $5, 'completed', $6, $7)
      RETURNING *
    `, [cardId, userId, amountCents, creatorId, isAnonymous, process.env.TENANT_ID, 'fanzmoneydash']);

    // Create tip record
    const tip = await client.query(`
      INSERT INTO fans.tips (
        fan_id, creator_id, amount, currency, message,
        is_anonymous, platform_id, tenant_id
      )
      SELECT
        (SELECT fan_id FROM fans.profiles WHERE user_id = $1),
        (SELECT creator_id FROM creators.profiles WHERE user_id = $2),
        $3, 'USD', $4, $5, $6, $7
      RETURNING *
    `, [userId, creatorId, amountCents, message, isAnonymous, 'fanzmoneydash', process.env.TENANT_ID]);

    console.log('Tip sent with FanzDiscreete:', {
      tip_id: tip.rows[0].tip_id,
      amount: `$${amountCents / 100}`,
      anonymous: isAnonymous
    });

    return { spend: spend.rows[0], tip: tip.rows[0] };
  });
}

// =====================================================
// 4. Gift Cards
// =====================================================

/**
 * Purchase a FanzDiscreete gift card
 */
async function purchaseGiftCard(
  purchaserUserId: string,
  amountCents: number,
  recipientEmail: string,
  giftMessage: string,
  ccbillTransactionId: string
) {
  // Generate unique codes
  const cardCode = generateGiftCardCode(); // e.g., "FANZ-1A2B-3C4D-5E6F"
  const cardPin = generateRandomPin(6);

  const giftCard = await helpers.insert('discrete.gift_cards', {
    card_code: cardCode,
    card_pin: cardPin,
    initial_value_cents: amountCents,
    remaining_value_cents: amountCents,
    currency: 'USD',
    purchased_by_user_id: purchaserUserId,
    recipient_email: recipientEmail,
    gift_message: giftMessage,
    status: 'pending',
    ccbill_transaction_id: ccbillTransactionId,
    merchant_descriptor: 'GH Commerce', // What appeared on purchaser's credit card
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    tenant_id: process.env.TENANT_ID,
    platform_id: 'fanzmoneydash'
  });

  console.log('Gift card purchased:', {
    gift_card_id: giftCard.gift_card_id,
    code: cardCode,
    value: `$${amountCents / 100}`,
    recipient: recipientEmail
  });

  // Send email to recipient
  await sendGiftCardEmail(recipientEmail, cardCode, cardPin, giftMessage, amountCents);

  return giftCard;
}

/**
 * Redeem a FanzDiscreete gift card
 */
async function redeemGiftCard(
  cardCode: string,
  cardPin: string,
  redeemerUserId: string
) {
  return await db.transaction(async (client) => {
    // 1. Verify gift card
    const giftCard = await client.query(`
      SELECT * FROM discrete.gift_cards
      WHERE card_code = $1
        AND card_pin = $2
        AND status IN ('pending', 'sent', 'delivered')
        AND expires_at > NOW()
      FOR UPDATE
    `, [cardCode, cardPin]);

    if (giftCard.rows.length === 0) {
      throw new Error('Invalid or expired gift card code');
    }

    const gift = giftCard.rows[0];

    // 2. Create FanzDiscreete card for redeemer
    const newCard = await createDiscreteCard(redeemerUserId, 'prepaid');

    // 3. Load gift card value onto new card
    await client.query(`
      UPDATE discrete.discrete_cards
      SET
        balance_cents = balance_cents + $1,
        available_balance_cents = available_balance_cents + $1,
        updated_at = NOW()
      WHERE card_id = $2
    `, [gift.remaining_value_cents, newCard.card_id]);

    // 4. Mark gift card as redeemed
    await client.query(`
      UPDATE discrete.gift_cards
      SET
        status = 'redeemed',
        redeemed_at = NOW(),
        redeemed_by_user_id = $1,
        converted_to_card_id = $2
      WHERE gift_card_id = $3
    `, [redeemerUserId, newCard.card_id, gift.gift_card_id]);

    console.log('Gift card redeemed:', {
      gift_card_id: gift.gift_card_id,
      value: `$${gift.remaining_value_cents / 100}`,
      new_card_id: newCard.card_id
    });

    return {
      giftCard: gift,
      newCard: newCard
    };
  });
}

// =====================================================
// 5. Vault Mode Access
// =====================================================

/**
 * Log vault access attempt
 */
async function logVaultAccess(
  userId: string,
  cardId: string,
  accessType: 'view' | 'transaction' | 'reload' | 'settings',
  authMethod: 'pin' | 'biometric' | 'password' | 'failed',
  accessGranted: boolean,
  ipAddress?: string,
  userAgent?: string
) {
  const log = await helpers.insert('discrete.vault_access_log', {
    user_id: userId,
    card_id: cardId,
    access_type: accessType,
    access_granted: accessGranted,
    auth_method: authMethod,
    ip_address: ipAddress,
    user_agent: userAgent,
    tenant_id: process.env.TENANT_ID,
    platform_id: 'fanzmoneydash',
    accessed_at: new Date()
  });

  return log;
}

/**
 * Get vault transactions (requires authentication)
 */
async function getVaultTransactions(userId: string, cardId: string) {
  // Verify card is in vault mode
  const card = await db.queryOne(
    'SELECT vault_mode_enabled FROM discrete.discrete_cards WHERE card_id = $1 AND user_id = $2',
    [cardId, userId]
  );

  if (!card || !card.vault_mode_enabled) {
    throw new Error('Card is not in vault mode');
  }

  // Get spend transactions
  const transactions = await db.queryMany(`
    SELECT
      spend_id,
      amount_cents,
      purchase_type,
      creator_id,
      status,
      is_anonymous,
      created_at
    FROM discrete.card_spends
    WHERE card_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [cardId]);

  return transactions;
}

// =====================================================
// 6. Analytics & Reporting
// =====================================================

/**
 * Get user's FanzDiscreete spending summary
 */
async function getUserSpendingSummary(userId: string, days: number = 30) {
  const summary = await db.queryOne(`
    SELECT
      COUNT(*) as transaction_count,
      SUM(amount_cents) / 100 as total_spent_usd,
      AVG(amount_cents) / 100 as avg_transaction_usd,
      COUNT(DISTINCT creator_id) as unique_creators
    FROM discrete.card_spends
    WHERE user_id = $1
      AND created_at >= NOW() - INTERVAL '${days} days'
      AND status = 'completed'
  `, [userId]);

  return summary;
}

/**
 * Get platform FanzDiscreete metrics
 */
async function getPlatformDiscreteMetrics() {
  const metrics = await db.queryOne(`
    SELECT
      -- Cards
      (SELECT COUNT(*) FROM discrete.discrete_cards WHERE status = 'active') as active_cards,
      (SELECT SUM(balance_cents) / 100 FROM discrete.discrete_cards) as total_balance_usd,

      -- Loads (last 30 days)
      (SELECT COUNT(*) FROM discrete.card_loads WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed') as loads_30d,
      (SELECT SUM(amount_cents) / 100 FROM discrete.card_loads WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed') as load_volume_30d_usd,

      -- Spends (last 30 days)
      (SELECT COUNT(*) FROM discrete.card_spends WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed') as spends_30d,
      (SELECT SUM(amount_cents) / 100 FROM discrete.card_spends WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed') as spend_volume_30d_usd,

      -- Gift cards
      (SELECT COUNT(*) FROM discrete.gift_cards WHERE status IN ('pending', 'sent', 'delivered')) as active_gift_cards,
      (SELECT COUNT(*) FROM discrete.gift_cards WHERE status = 'redeemed') as redeemed_gift_cards
  `);

  return metrics;
}

// =====================================================
// Utility Functions
// =====================================================

function generateRandomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function generateGiftCardCode(): string {
  const segments = 4;
  const segmentLength = 4;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }).join('-');

  return `FANZ-${code}`;
}

function generateRandomPin(length: number = 6): string {
  return generateRandomDigits(length);
}

async function sendGiftCardEmail(
  recipientEmail: string,
  cardCode: string,
  cardPin: string,
  giftMessage: string,
  amountCents: number
) {
  // In production: Use your email service (SendGrid, AWS SES, etc.)
  console.log('Sending gift card email:', {
    to: recipientEmail,
    code: cardCode,
    pin: cardPin,
    amount: `$${amountCents / 100}`,
    message: giftMessage
  });

  // Email template would include:
  // - Gift message from sender
  // - Card code and PIN
  // - Instructions to redeem at FanzMoneyDash
  // - Expiration date
}

// =====================================================
// Express.js API Integration Example
// =====================================================

/*
import express from 'express';
import {
  createDiscreteCard,
  loadCardViaCCBill,
  purchaseSubscriptionWithDiscreete,
  sendTipWithDiscreete,
  purchaseGiftCard,
  redeemGiftCard,
  getUserDiscreteCards,
  getUserSpendingSummary
} from './discrete-integration-example';

const app = express();

// Create FanzDiscreete card
app.post('/api/discrete/cards', async (req, res) => {
  try {
    const { userId, cardType } = req.body;
    const card = await createDiscreteCard(userId, cardType);
    res.json({ success: true, card });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Load card via CCBill
app.post('/api/discrete/cards/:cardId/load', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { amountCents, ccbillToken, paymentMethod } = req.body;

    const load = await loadCardViaCCBill(cardId, amountCents, ccbillToken, paymentMethod);
    res.json({ success: true, load });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase subscription with FanzDiscreete
app.post('/api/discrete/purchase/subscription', async (req, res) => {
  try {
    const { cardId, creatorId, tierId, amountCents } = req.body;
    const result = await purchaseSubscriptionWithDiscreete(cardId, creatorId, tierId, amountCents);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send tip with FanzDiscreete
app.post('/api/discrete/purchase/tip', async (req, res) => {
  try {
    const { cardId, creatorId, amountCents, message, isAnonymous } = req.body;
    const result = await sendTipWithDiscreete(cardId, creatorId, amountCents, message, isAnonymous);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase gift card
app.post('/api/discrete/gift-cards', async (req, res) => {
  try {
    const { purchaserUserId, amountCents, recipientEmail, giftMessage, ccbillTransactionId } = req.body;
    const giftCard = await purchaseGiftCard(purchaserUserId, amountCents, recipientEmail, giftMessage, ccbillTransactionId);
    res.json({ success: true, giftCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem gift card
app.post('/api/discrete/gift-cards/redeem', async (req, res) => {
  try {
    const { cardCode, cardPin, redeemerUserId } = req.body;
    const result = await redeemGiftCard(cardCode, cardPin, redeemerUserId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's cards
app.get('/api/discrete/cards/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cards = await getUserDiscreteCards(userId);
    res.json({ success: true, cards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get spending summary
app.get('/api/discrete/spending/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;
    const summary = await getUserSpendingSummary(userId, days ? parseInt(days) : 30);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// =====================================================
// Export Functions
// =====================================================

export {
  createDiscreteCard,
  enableVaultMode,
  getUserDiscreteCards,
  loadCardViaCCBill,
  setupAutoReload,
  purchaseSubscriptionWithDiscreete,
  sendTipWithDiscreete,
  purchaseGiftCard,
  redeemGiftCard,
  logVaultAccess,
  getVaultTransactions,
  getUserSpendingSummary,
  getPlatformDiscreteMetrics
};

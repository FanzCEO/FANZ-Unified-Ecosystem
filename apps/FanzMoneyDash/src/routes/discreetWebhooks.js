/**
 * FanzDiscreet CCBill Webhook Handler
 * Processes real-time payment notifications from CCBill
 */

import express from 'express';
import crypto from 'crypto';
import DiscreetCard from '../models/DiscreetCard.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

// CCBill webhook configuration
const CCBILL_WEBHOOK_SECRET = process.env.CCBILL_WEBHOOK_SECRET || '';

/**
 * Verify CCBill webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!CCBILL_WEBHOOK_SECRET) {
    logger.warn('CCBill webhook secret not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CCBILL_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * POST /api/discreet/webhooks/ccbill
 * Handle CCBill webhook notifications
 */
router.post('/ccbill', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-ccbill-signature'];
    const payload = JSON.parse(req.body.toString());

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      logger.error('Invalid CCBill webhook signature', { payload });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { eventType, data } = payload;

    logger.info('CCBill webhook received', {
      eventType,
      transactionId: data.transactionId,
      subscriptionId: data.subscriptionId
    });

    // Process webhook based on event type
    switch (eventType) {
      case 'NewSaleSuccess':
        await handleNewSale(data);
        break;

      case 'NewSaleFailure':
        await handleNewSaleFailure(data);
        break;

      case 'Renewal':
        await handleRenewal(data);
        break;

      case 'Cancellation':
        await handleCancellation(data);
        break;

      case 'Chargeback':
        await handleChargeback(data);
        break;

      case 'Refund':
        await handleRefund(data);
        break;

      case 'Expiration':
        await handleExpiration(data);
        break;

      default:
        logger.warn('Unknown CCBill webhook event type', { eventType });
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('CCBill webhook processing error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful new sale
 */
async function handleNewSale(data) {
  const { transactionId, subscriptionId, customField3: cardId, amount } = data;

  if (!cardId) {
    logger.error('Missing cardId in webhook data', { data });
    return;
  }

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for webhook', { cardId, transactionId });
    return;
  }

  // Update card with CCBill transaction details
  card.purchase.ccbill.transactionId = transactionId;
  card.purchase.ccbill.subscriptionId = subscriptionId;
  card.timestamps.activatedAt = new Date();

  await card.save();

  logger.info('Card activated via webhook', {
    cardId,
    transactionId,
    amount
  });

  // TODO: Send email notification to user
  await sendCardActivationEmail(card);
}

/**
 * Handle failed sale
 */
async function handleNewSaleFailure(data) {
  const { transactionId, customField3: cardId, declineReason } = data;

  logger.error('Card purchase failed', {
    cardId,
    transactionId,
    declineReason
  });

  // TODO: Update transaction status to failed
  // TODO: Send failure notification to user
}

/**
 * Handle card renewal/reload
 */
async function handleRenewal(data) {
  const { transactionId, subscriptionId, customField3: cardId, amount } = data;

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for renewal', { cardId, transactionId });
    return;
  }

  // Add reload to history
  card.reloadable.reloadHistory.push({
    amount: parseFloat(amount),
    transactionId,
    reloadedAt: new Date()
  });

  card.balance.current += parseFloat(amount);
  card.reloadable.reloadCount += 1;

  if (card.status === 'depleted') {
    card.status = 'active';
  }

  await card.save();

  logger.info('Card reloaded via webhook', {
    cardId,
    amount,
    newBalance: card.balance.current
  });

  // TODO: Send reload confirmation email
  await sendCardReloadEmail(card, amount);
}

/**
 * Handle card cancellation
 */
async function handleCancellation(data) {
  const { subscriptionId, customField3: cardId } = data;

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for cancellation', { cardId, subscriptionId });
    return;
  }

  card.status = 'cancelled';
  card.timestamps.cancelledAt = new Date();
  card.metadata.notes = (card.metadata.notes || '') +
    `\nCancelled via CCBill webhook at ${new Date().toISOString()}`;

  await card.save();

  logger.info('Card cancelled via webhook', { cardId, subscriptionId });

  // TODO: Send cancellation confirmation email
  await sendCardCancellationEmail(card);
}

/**
 * Handle chargeback
 */
async function handleChargeback(data) {
  const { transactionId, customField3: cardId, amount } = data;

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for chargeback', { cardId, transactionId });
    return;
  }

  // Freeze card due to chargeback
  card.status = 'frozen';
  card.compliance.riskScore = Math.min(100, card.compliance.riskScore + 50);
  card.metadata.notes = (card.metadata.notes || '') +
    `\nChargeback received: $${amount} at ${new Date().toISOString()}`;

  await card.save();

  logger.error('Chargeback received', {
    cardId,
    transactionId,
    amount,
    newRiskScore: card.compliance.riskScore
  });

  // TODO: Alert admin and user
  await sendChargebackAlert(card, amount);
}

/**
 * Handle refund
 */
async function handleRefund(data) {
  const { transactionId, customField3: cardId, amount } = data;

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for refund', { cardId, transactionId });
    return;
  }

  // Deduct refunded amount from balance
  card.balance.current = Math.max(0, card.balance.current - parseFloat(amount));

  if (card.balance.current === 0 && card.status === 'active') {
    card.status = 'depleted';
    card.timestamps.depletedAt = new Date();
  }

  card.metadata.notes = (card.metadata.notes || '') +
    `\nRefund processed: $${amount} at ${new Date().toISOString()}`;

  await card.save();

  logger.info('Refund processed', {
    cardId,
    transactionId,
    amount,
    newBalance: card.balance.current
  });

  // TODO: Send refund confirmation email
  await sendRefundConfirmationEmail(card, amount);
}

/**
 * Handle card expiration
 */
async function handleExpiration(data) {
  const { subscriptionId, customField3: cardId } = data;

  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    logger.error('Card not found for expiration', { cardId, subscriptionId });
    return;
  }

  card.status = 'expired';
  card.timestamps.expiredAt = new Date();

  await card.save();

  logger.info('Card expired via webhook', { cardId, subscriptionId });

  // TODO: Send expiration notification
  await sendCardExpirationEmail(card);
}

/**
 * Email notification functions (stubs - implement with actual email service)
 */
async function sendCardActivationEmail(card) {
  // TODO: Implement with nodemailer or email service
  logger.info('Would send card activation email', { cardId: card.cardId });
}

async function sendCardReloadEmail(card, amount) {
  logger.info('Would send card reload email', { cardId: card.cardId, amount });
}

async function sendCardCancellationEmail(card) {
  logger.info('Would send card cancellation email', { cardId: card.cardId });
}

async function sendChargebackAlert(card, amount) {
  logger.error('Would send chargeback alert', { cardId: card.cardId, amount });
}

async function sendRefundConfirmationEmail(card, amount) {
  logger.info('Would send refund confirmation email', { cardId: card.cardId, amount });
}

async function sendCardExpirationEmail(card) {
  logger.info('Would send card expiration email', { cardId: card.cardId });
}

/**
 * GET /api/discreet/webhooks/test
 * Test webhook endpoint (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test', async (req, res) => {
    res.json({
      webhookUrl: '/api/discreet/webhooks/ccbill',
      secretConfigured: !!CCBILL_WEBHOOK_SECRET,
      supportedEvents: [
        'NewSaleSuccess',
        'NewSaleFailure',
        'Renewal',
        'Cancellation',
        'Chargeback',
        'Refund',
        'Expiration'
      ]
    });
  });
}

export default router;

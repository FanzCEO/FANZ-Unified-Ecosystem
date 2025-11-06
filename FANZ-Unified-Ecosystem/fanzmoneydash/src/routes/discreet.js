/**
 * FANZ Discreet Privacy Card Routes
 * API endpoints for purchasing and managing privacy-focused prepaid cards
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import authMiddleware from '../middleware/auth.js';
import DiscreetCard from '../models/DiscreetCard.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { rateLimitConfig } from '../config/security.js';
import { calculateRiskScore, shouldBlockTransaction } from '../services/fraudDetection.js';
import { canCreateCard, canReloadCard, getSpendingSummary, checkLimitWarnings } from '../services/spendingLimits.js';

const router = express.Router();

// Apply authentication middleware to all discreet routes
router.use(authMiddleware);

// Apply rate limiting
router.use('/purchase', rateLimitConfig.payment); // Strict limit for purchases
router.use('/cards/:cardId/reload', rateLimitConfig.payment); // Strict limit for reloads

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * CCBill Configuration (Grp Hldings LLC)
 */
const CCBILL_CONFIG = {
  baseUrl: process.env.CCBILL_API_URL || 'https://api.ccbill.com',
  clientAccnum: process.env.CCBILL_ACCOUNT || '951492',
  apiKey: process.env.CCBILL_API_KEY || '',
  subAccounts: {
    'gift_card': '01',      // GH COMMERCE
    'reload': '02',          // GH DIGITAL SVC
    'subscription': '03',    // GH MEDIA SERVICES
    'one_time': '04'         // GH GIFT PURCHASE
  },
  descriptors: {
    '01': 'GH COMMERCE',
    '02': 'GH DIGITAL SVC',
    '03': 'GH MEDIA SERVICES',
    '04': 'GH GIFT PURCHASE'
  }
};

/**
 * Calculate processing and service fees (CCBill rates)
 */
const calculateFees = (amount) => {
  const processingFee = amount * 0.115 + 0.10; // CCBill fee: 11.5% + $0.10
  const serviceFee = amount * 0.02; // FANZ service fee: 2%
  const total = processingFee + serviceFee;

  return {
    processing: Math.round(processingFee * 100) / 100,
    service: Math.round(serviceFee * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

/**
 * Generate secure card token
 */
const generateCardToken = () => {
  const prefix = 'fzdc'; // FanZ Discreet Card
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate card ID
 */
const generateCardId = () => {
  const prefix = 'card';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Verify user access to card
 */
const verifyCardAccess = async (cardId, userId, userRole) => {
  const card = await DiscreetCard.findOne({ cardId });

  if (!card) {
    throw new Error('Card not found');
  }

  // Admins can access all cards
  if (userRole === 'admin') {
    return card;
  }

  // Users can only access their own cards
  if (card.userId !== userId) {
    throw new Error('Access denied: insufficient permissions');
  }

  return card;
};

/**
 * Process CCBill payment
 * Handles card purchases and reloads via CCBill Payment API
 */
const processCCBillPayment = async (amount, paymentToken, transactionType = 'gift_card', userId, cardId) => {
  try {
    // Determine sub-account and descriptor based on transaction type
    const subAccNum = CCBILL_CONFIG.subAccounts[transactionType];
    const descriptor = CCBILL_CONFIG.descriptors[subAccNum];

    // Mock CCBill API call - in production, use actual CCBill Payment API
    // const axios = require('axios');
    // const response = await axios.post(
    //   `${CCBILL_CONFIG.baseUrl}/transactions/payment_api`,
    //   {
    //     clientAccnum: CCBILL_CONFIG.clientAccnum,
    //     clientSubacc: subAccNum,
    //     amount: amount.toFixed(2),
    //     currencyCode: '840', // USD
    //     descriptor: descriptor,
    //     customField1: 'discreet_card',
    //     customField2: userId,
    //     customField3: cardId,
    //     paymentToken: paymentToken
    //   },
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${CCBILL_CONFIG.apiKey}`,
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // );

    // Mock successful CCBill charge
    return {
      success: true,
      transactionId: 'ccb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10),
      subscriptionId: 'sub_' + Date.now(),
      subAccount: `${CCBILL_CONFIG.clientAccnum}-${subAccNum}`,
      descriptor: descriptor,
      approvalCode: 'APP' + Math.floor(100000 + Math.random() * 900000),
      amount: Math.round(amount * 100),
      status: 'approved',
      receiptUrl: `https://fanz.network/receipts/ccbill_${Date.now()}`
    };
  } catch (error) {
    logger.error('CCBill payment processing error', {
      error: error.message,
      amount,
      transactionType
    });
    throw new Error('Payment processing failed');
  }
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/discreet/purchase
 * Purchase a new privacy card
 */
router.post('/purchase', [
  body('amount')
    .isFloat({ min: 10, max: 500 })
    .withMessage('Amount must be between $10 and $500')
    .toFloat(),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'CAD'])
    .withMessage('Invalid currency code')
    .toUpperCase(),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'paypal'])
    .withMessage('Invalid payment method'),
  body('paymentToken')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Payment token is required'),
  body('platform')
    .isIn(['boyfanz', 'girlfanz', 'pupfanz', 'daddiesfanz', 'cougarfanz', 'taboofanz', 'femmefanz', 'transfanz', 'fanzuncut', 'southernfanz', 'bearfanz', 'dlbroz', 'guyz'])
    .withMessage('Invalid platform'),
  body('reloadable')
    .optional()
    .isBoolean()
    .withMessage('Reloadable must be boolean'),
  body('merchantDescriptor')
    .optional()
    .isIn(['GH COMMERCE', 'GH DIGITAL SVC', 'GH MEDIA SERVICES', 'GH GIFT PURCHASE', 'GH ENTERTAINMENT'])
    .withMessage('Invalid merchant descriptor')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      amount,
      currency = 'USD',
      paymentMethod,
      paymentToken,
      platform,
      reloadable = true,
      merchantDescriptor = 'GH COMMERCE'
    } = req.body;

    // Get user
    const user = await User.findByUserId(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check spending limits
    const limitCheck = await canCreateCard(req.user.userId, amount);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.reason,
        limitExceeded: limitCheck.exceeded,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Check KYC tier requirements
    const kycTier = user.compliance?.kycTier || (user.compliance?.kycVerified ? 2 : 1);

    if (amount > 100 && kycTier < 2) {
      return res.status(403).json({
        success: false,
        error: 'KYC verification required for amounts over $100',
        kycRequired: true
      });
    }

    if (amount > 500 && kycTier < 3) {
      return res.status(403).json({
        success: false,
        error: 'Enhanced KYC verification required for amounts over $500',
        kycRequired: true,
        kycLevel: 3
      });
    }

    // Calculate fees
    const fees = calculateFees(amount);
    const totalCharge = amount + fees.total;

    // Generate card details (needed before payment processing)
    const cardId = generateCardId();
    const cardToken = generateCardToken();

    // Fraud detection and risk assessment
    const riskAssessment = await calculateRiskScore(
      req.user.userId,
      totalCharge,
      req.ip,
      req.headers['user-agent'],
      'purchase'
    );

    logger.info('Risk assessment completed', {
      userId: req.user.userId,
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      amount: totalCharge
    });

    // Block high-risk transactions
    if (riskAssessment.shouldBlock) {
      logger.error('Transaction blocked due to high risk', {
        userId: req.user.userId,
        riskScore: riskAssessment.riskScore,
        reasons: riskAssessment.reasons
      });

      return res.status(403).json({
        success: false,
        error: 'Transaction blocked for security reasons. Please contact support.',
        riskLevel: riskAssessment.riskLevel,
        requiresReview: true
      });
    }

    // Require additional verification for medium-high risk
    if (riskAssessment.requiresMFA && !req.body.mfaToken) {
      return res.status(403).json({
        success: false,
        error: 'Additional verification required',
        requiresMFA: true,
        riskLevel: riskAssessment.riskLevel
      });
    }

    // Process payment via CCBill
    logger.info('Processing CCBill payment for discreet card', {
      userId: req.user.userId,
      amount,
      totalCharge,
      merchantDescriptor,
      cardId
    });

    const ccbillCharge = await processCCBillPayment(totalCharge, paymentToken, 'gift_card', req.user.userId, cardId);

    if (ccbillCharge.status !== 'approved') {
      logger.error('CCBill payment failed', {
        userId: req.user.userId,
        amount,
        transactionId: ccbillCharge.transactionId
      });

      return res.status(402).json({
        success: false,
        error: 'Payment failed. Please check your payment method and try again.'
      });
    }

    // Calculate expiry date (2 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    // Create discreet card
    const discreetCard = new DiscreetCard({
      cardId,
      userId: req.user.userId,
      card: {
        type: 'virtual_prepaid',
        token: cardToken,
        last4: Math.floor(1000 + Math.random() * 9000).toString(), // Mock last 4
        expiryMonth: expiryDate.getMonth() + 1,
        expiryYear: expiryDate.getFullYear()
      },
      balance: {
        initial: amount,
        current: amount,
        currency
      },
      status: 'active',
      privacy: {
        merchantDescriptor,
        hideFromStatements: true,
        useGenericReceipts: true
      },
      platform: {
        name: platform,
        platformUserId: user.platforms?.find(p => p.platform === platform)?.platformUserId
      },
      purchase: {
        method: paymentMethod,
        amount,
        fees,
        ccbill: {
          transactionId: ccbillCharge.transactionId,
          subscriptionId: ccbillCharge.subscriptionId,
          subAccount: ccbillCharge.subAccount,
          descriptor: ccbillCharge.descriptor,
          approvalCode: ccbillCharge.approvalCode
        },
        receiptUrl: ccbillCharge.receiptUrl
      },
      reloadable: {
        enabled: reloadable,
        reloadCount: 0,
        maxReloads: 10
      },
      compliance: {
        kycVerified: user.compliance?.kycVerified || false,
        kycTier,
        amlStatus: 'clear',
        riskScore: riskAssessment.riskScore
      },
      timestamps: {
        createdAt: new Date(),
        activatedAt: new Date()
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceId: req.headers['x-device-id']
      }
    });

    await discreetCard.save();

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `txn_discreet_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      type: 'deposit',
      category: 'transfer',
      status: 'completed',
      amount: {
        gross: amount,
        net: amount,
        fees
      },
      currency,
      user: {
        userId: req.user.userId,
        username: user.username,
        email: user.email,
        role: user.role
      },
      platform: {
        name: platform,
        userId: user.platforms?.find(p => p.platform === platform)?.platformUserId
      },
      payment: {
        method: paymentMethod,
        processor: 'ccbill',
        processorTransactionId: ccbillCharge.transactionId
      },
      description: 'FanzDiscreet Privacy Card Purchase',
      timestamps: {
        createdAt: new Date(),
        completedAt: new Date()
      },
      metadata: {
        discreetCardId: cardId,
        merchantDescriptor,
        privacyMode: true,
        ipAddress: req.ip
      }
    });

    await transaction.save();

    logger.info('Discreet card created successfully', {
      cardId,
      userId: req.user.userId,
      amount,
      platform,
      transactionId: transaction.transactionId
    });

    res.status(201).json({
      success: true,
      data: {
        card: {
          cardId: discreetCard.cardId,
          token: discreetCard.card.token,
          last4: discreetCard.card.last4,
          type: discreetCard.card.type,
          balance: {
            current: discreetCard.balance.current,
            currency: discreetCard.balance.currency
          },
          status: discreetCard.status,
          expiryMonth: discreetCard.card.expiryMonth,
          expiryYear: discreetCard.card.expiryYear,
          reloadable: discreetCard.reloadable.enabled,
          merchantDescriptor: discreetCard.privacy.merchantDescriptor
        },
        transaction: {
          transactionId: transaction.transactionId,
          amount: transaction.amount.gross,
          fees: fees.total,
          total: totalCharge,
          status: transaction.status,
          receiptUrl: discreetCard.purchase.receiptUrl
        }
      },
      message: `Privacy card created successfully. Your bank statement will show: ${merchantDescriptor}`,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Discreet card purchase error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to purchase privacy card. Please try again.'
    });
  }
});

/**
 * GET /api/discreet/cards
 * Get all cards for authenticated user
 */
router.get('/cards', [
  query('status')
    .optional()
    .isIn(['active', 'depleted', 'expired', 'frozen', 'cancelled', 'all'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status = 'active', page = 1, limit = 20 } = req.query;

    // Build query
    const query = { userId: req.user.userId };

    if (status !== 'all') {
      query.status = status;
    }

    // Get cards with pagination
    const cards = await DiscreetCard.find(query)
      .sort({ 'timestamps.createdAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-card.cardNumber -card.cvv'); // Exclude sensitive data

    const totalCount = await DiscreetCard.countDocuments(query);

    logger.info('Discreet cards retrieved', {
      userId: req.user.userId,
      status,
      count: cards.length
    });

    res.json({
      success: true,
      data: {
        cards: cards.map(card => ({
          cardId: card.cardId,
          token: card.card.token,
          last4: card.card.last4,
          type: card.card.type,
          balance: card.balance,
          status: card.status,
          platform: card.platform.name,
          createdAt: card.timestamps.createdAt,
          lastUsedAt: card.usage.lastUsedAt
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get discreet cards error', {
      error: error.message,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cards'
    });
  }
});

/**
 * GET /api/discreet/cards/:cardId
 * Get specific card details
 */
router.get('/cards/:cardId', [
  param('cardId')
    .matches(/^card_[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid card ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cardId } = req.params;

    const card = await verifyCardAccess(cardId, req.user.userId, req.user.role);

    res.json({
      success: true,
      data: {
        card: {
          cardId: card.cardId,
          token: card.card.token,
          last4: card.card.last4,
          type: card.card.type,
          balance: card.balance,
          status: card.status,
          expiryMonth: card.card.expiryMonth,
          expiryYear: card.card.expiryYear,
          platform: card.platform.name,
          reloadable: {
            enabled: card.reloadable.enabled,
            reloadCount: card.reloadable.reloadCount,
            maxReloads: card.reloadable.maxReloads,
            remainingReloads: card.remainingReloads
          },
          usage: {
            totalSpent: card.usage.totalSpent,
            transactionCount: card.usage.transactionCount,
            lastUsedAt: card.usage.lastUsedAt
          },
          privacy: card.privacy,
          createdAt: card.timestamps.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Get discreet card error', {
      error: error.message,
      cardId: req.params.cardId,
      userId: req.user?.userId
    });

    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve card details'
    });
  }
});

/**
 * POST /api/discreet/cards/:cardId/reload
 * Reload a card with additional funds
 */
router.post('/cards/:cardId/reload', [
  param('cardId')
    .matches(/^card_[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid card ID format'),
  body('amount')
    .isFloat({ min: 10, max: 500 })
    .withMessage('Reload amount must be between $10 and $500')
    .toFloat(),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'paypal'])
    .withMessage('Invalid payment method'),
  body('paymentToken')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Payment token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cardId } = req.params;
    const { amount, paymentMethod, paymentToken } = req.body;

    const card = await verifyCardAccess(cardId, req.user.userId, req.user.role);

    // Check reload limits
    const limitCheck = await canReloadCard(req.user.userId, cardId, amount);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.reason,
        limitExceeded: limitCheck.exceeded,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Check if card is reloadable
    if (!card.reloadable.enabled) {
      return res.status(400).json({
        success: false,
        error: 'This card is not reloadable'
      });
    }

    // Check reload limit
    if (card.reloadable.reloadCount >= card.reloadable.maxReloads) {
      return res.status(400).json({
        success: false,
        error: `Maximum reload limit (${card.reloadable.maxReloads}) reached for this card`
      });
    }

    // Check card status
    if (card.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reload cancelled card'
      });
    }

    // Calculate fees
    const fees = calculateFees(amount);
    const totalCharge = amount + fees.total;

    // Process payment via CCBill
    const ccbillCharge = await processCCBillPayment(
      totalCharge,
      paymentToken,
      'reload',
      req.user.userId,
      cardId
    );

    if (ccbillCharge.status !== 'approved') {
      return res.status(402).json({
        success: false,
        error: 'Payment failed. Please check your payment method and try again.'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: `txn_reload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      type: 'deposit',
      category: 'transfer',
      status: 'completed',
      amount: {
        gross: amount,
        net: amount,
        fees
      },
      currency: card.balance.currency,
      user: {
        userId: req.user.userId
      },
      platform: {
        name: card.platform.name
      },
      payment: {
        method: paymentMethod,
        processor: 'ccbill',
        processorTransactionId: ccbillCharge.transactionId
      },
      description: `FanzDiscreet Card Reload - ${cardId}`,
      timestamps: {
        createdAt: new Date(),
        completedAt: new Date()
      },
      metadata: {
        discreetCardId: cardId,
        reloadNumber: card.reloadable.reloadCount + 1,
        merchantDescriptor: card.privacy.merchantDescriptor,
        privacyMode: true
      }
    });

    await transaction.save();

    // Reload card
    await card.reloadBalance(amount, transaction.transactionId);

    logger.info('Discreet card reloaded successfully', {
      cardId,
      userId: req.user.userId,
      amount,
      newBalance: card.balance.current,
      reloadCount: card.reloadable.reloadCount
    });

    res.json({
      success: true,
      data: {
        card: {
          cardId: card.cardId,
          balance: {
            current: card.balance.current,
            currency: card.balance.currency
          },
          reloadCount: card.reloadable.reloadCount,
          remainingReloads: card.remainingReloads
        },
        transaction: {
          transactionId: transaction.transactionId,
          amount: transaction.amount.gross,
          fees: fees.total,
          total: totalCharge,
          status: transaction.status
        }
      },
      message: 'Card reloaded successfully',
      reloadedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Discreet card reload error', {
      error: error.message,
      cardId: req.params.cardId,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reload card'
    });
  }
});

/**
 * DELETE /api/discreet/cards/:cardId
 * Cancel a card
 */
router.delete('/cards/:cardId', [
  param('cardId')
    .matches(/^card_[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid card ID format'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be 500 characters or less'),
  body('refundBalance')
    .optional()
    .isBoolean()
    .withMessage('RefundBalance must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cardId } = req.params;
    const { reason = 'User requested cancellation', refundBalance = false } = req.body;

    const card = await verifyCardAccess(cardId, req.user.userId, req.user.role);

    if (card.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Card is already cancelled'
      });
    }

    // Cancel card
    await card.cancel(reason);

    const responseData = {
      cardId: card.cardId,
      status: card.status,
      cancelledAt: card.timestamps.cancelledAt
    };

    // Handle refund if requested and balance > 0
    if (refundBalance && card.balance.current > 0) {
      // TODO: Process refund via Stripe
      // In production, create a refund transaction

      responseData.refund = {
        amount: card.balance.current,
        status: 'processing',
        estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
      };
    }

    logger.info('Discreet card cancelled', {
      cardId,
      userId: req.user.userId,
      reason,
      refundBalance,
      remainingBalance: card.balance.current
    });

    res.json({
      success: true,
      data: responseData,
      message: refundBalance ? 'Card cancelled. Refund is being processed.' : 'Card cancelled successfully.'
    });

  } catch (error) {
    logger.error('Discreet card cancellation error', {
      error: error.message,
      cardId: req.params.cardId,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cancel card'
    });
  }
});

/**
 * GET /api/discreet/cards/:cardId/usage
 * Get card usage history
 */
router.get('/cards/:cardId/usage', [
  param('cardId')
    .matches(/^card_[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid card ID format'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be ISO 8601 format'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be ISO 8601 format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cardId } = req.params;
    const { fromDate, toDate, limit = 50 } = req.query;

    const card = await verifyCardAccess(cardId, req.user.userId, req.user.role);

    let usageHistory = card.usage.usageHistory || [];

    // Filter by date range if provided
    if (fromDate || toDate) {
      usageHistory = usageHistory.filter(usage => {
        const usageDate = new Date(usage.timestamp);

        if (fromDate && usageDate < new Date(fromDate)) return false;
        if (toDate && usageDate > new Date(toDate)) return false;

        return true;
      });
    }

    // Sort by most recent first and limit
    usageHistory = usageHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // Calculate summary
    const summary = {
      totalSpent: card.usage.totalSpent,
      transactionCount: card.usage.transactionCount,
      averageTransaction: card.usage.transactionCount > 0 ?
        Math.round((card.usage.totalSpent / card.usage.transactionCount) * 100) / 100 : 0
    };

    res.json({
      success: true,
      data: {
        cardId: card.cardId,
        usage: usageHistory,
        summary
      }
    });

  } catch (error) {
    logger.error('Get card usage error', {
      error: error.message,
      cardId: req.params.cardId,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage history'
    });
  }
});

export default router;

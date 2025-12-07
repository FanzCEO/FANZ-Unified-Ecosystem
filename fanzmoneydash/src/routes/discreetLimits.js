/**
 * FanzDiscreet Spending Limits API
 * Endpoints for viewing and managing spending limits
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getSpendingSummary, checkLimitWarnings, DEFAULT_LIMITS } from '../services/spendingLimits.js';
import logger from '../config/logger.js';

const router = express.Router();

// Apply authentication
router.use(authMiddleware);

/**
 * GET /api/discreet/limits/summary
 * Get current spending summary and limits for user
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await getSpendingSummary(req.user.userId);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Get spending summary error', {
      error: error.message,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve spending summary'
    });
  }
});

/**
 * GET /api/discreet/limits/warnings
 * Get warnings for approaching limits
 */
router.get('/warnings', async (req, res) => {
  try {
    const warnings = await checkLimitWarnings(req.user.userId);

    res.json({
      success: true,
      data: {
        warnings,
        count: warnings.length,
        hasWarnings: warnings.length > 0,
        criticalWarnings: warnings.filter(w => w.level === 'critical').length
      }
    });

  } catch (error) {
    logger.error('Get limit warnings error', {
      error: error.message,
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve limit warnings'
    });
  }
});

/**
 * GET /api/discreet/limits/tiers
 * Get information about KYC tiers and their limits
 */
router.get('/tiers', (req, res) => {
  res.json({
    success: true,
    data: {
      tiers: {
        tier1: {
          level: 1,
          name: 'Basic',
          requirements: ['Email verification'],
          limits: DEFAULT_LIMITS.TIER_1
        },
        tier2: {
          level: 2,
          name: 'Verified',
          requirements: ['Email verification', 'Identity verification', 'Address verification'],
          limits: DEFAULT_LIMITS.TIER_2
        },
        tier3: {
          level: 3,
          name: 'Enhanced',
          requirements: ['Email verification', 'Identity verification', 'Address verification', 'Income verification'],
          limits: DEFAULT_LIMITS.TIER_3
        }
      }
    }
  });
});

export default router;

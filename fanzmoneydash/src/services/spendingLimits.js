/**
 * FanzDiscreet Spending Limits & Budget Controls
 * Advanced spending management and limit enforcement
 */

import DiscreetCard from '../models/DiscreetCard.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Default spending limits by KYC tier
 */
export const DEFAULT_LIMITS = {
  TIER_1: {
    dailyLimit: 100,
    weeklyLimit: 300,
    monthlyLimit: 1000,
    perCardLimit: 100,
    maxActiveCards: 3
  },
  TIER_2: {
    dailyLimit: 500,
    weeklyLimit: 1500,
    monthlyLimit: 5000,
    perCardLimit: 500,
    maxActiveCards: 10
  },
  TIER_3: {
    dailyLimit: 2000,
    weeklyLimit: 7000,
    monthlyLimit: 20000,
    perCardLimit: 500,
    maxActiveCards: 25
  }
};

/**
 * Check if user can create a new card
 */
export async function canCreateCard(userId, amount) {
  try {
    const user = await User.findByUserId(userId);
    if (!user) {
      return {
        allowed: false,
        reason: 'User not found'
      };
    }

    const kycTier = user.compliance?.kycTier || 1;
    const limits = getLimitsForTier(kycTier);

    // Check per-card limit
    if (amount > limits.perCardLimit) {
      return {
        allowed: false,
        reason: `Amount exceeds per-card limit of $${limits.perCardLimit} for KYC Tier ${kycTier}`,
        limit: limits.perCardLimit,
        exceeded: 'perCard'
      };
    }

    // Check maximum active cards
    const activeCards = await DiscreetCard.countDocuments({
      userId,
      status: 'active'
    });

    if (activeCards >= limits.maxActiveCards) {
      return {
        allowed: false,
        reason: `Maximum active cards limit reached (${limits.maxActiveCards})`,
        limit: limits.maxActiveCards,
        current: activeCards,
        exceeded: 'maxCards'
      };
    }

    // Check daily limit
    const dailySpent = await getDailySpending(userId);
    if (dailySpent + amount > limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily spending limit exceeded ($${dailySpent + amount}/$${limits.dailyLimit})`,
        limit: limits.dailyLimit,
        current: dailySpent,
        exceeded: 'daily'
      };
    }

    // Check weekly limit
    const weeklySpent = await getWeeklySpending(userId);
    if (weeklySpent + amount > limits.weeklyLimit) {
      return {
        allowed: false,
        reason: `Weekly spending limit exceeded ($${weeklySpent + amount}/$${limits.weeklyLimit})`,
        limit: limits.weeklyLimit,
        current: weeklySpent,
        exceeded: 'weekly'
      };
    }

    // Check monthly limit
    const monthlySpent = await getMonthlySpending(userId);
    if (monthlySpent + amount > limits.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly spending limit exceeded ($${monthlySpent + amount}/$${limits.monthlyLimit})`,
        limit: limits.monthlyLimit,
        current: monthlySpent,
        exceeded: 'monthly'
      };
    }

    return {
      allowed: true,
      limits,
      spending: {
        daily: dailySpent,
        weekly: weeklySpent,
        monthly: monthlySpent,
        activeCards
      }
    };

  } catch (error) {
    logger.error('Error checking card creation limits', {
      error: error.message,
      userId,
      amount
    });

    return {
      allowed: false,
      reason: 'Error checking limits. Please try again.'
    };
  }
}

/**
 * Check if user can reload a card
 */
export async function canReloadCard(userId, cardId, amount) {
  try {
    const card = await DiscreetCard.findOne({ cardId, userId });
    if (!card) {
      return {
        allowed: false,
        reason: 'Card not found'
      };
    }

    // Check if card is in valid state for reload
    if (!card.reloadable.enabled) {
      return {
        allowed: false,
        reason: 'Card is not reloadable'
      };
    }

    if (card.status === 'cancelled' || card.status === 'frozen') {
      return {
        allowed: false,
        reason: `Card is ${card.status}`
      };
    }

    // Check reload count limit
    if (card.reloadable.reloadCount >= card.reloadable.maxReloads) {
      return {
        allowed: false,
        reason: `Maximum reload limit reached (${card.reloadable.maxReloads})`,
        limit: card.reloadable.maxReloads,
        current: card.reloadable.reloadCount
      };
    }

    // Check balance after reload would exceed card maximum
    if (card.balance.current + amount > 500) {
      return {
        allowed: false,
        reason: 'Reload would exceed maximum card balance of $500',
        currentBalance: card.balance.current,
        maxBalance: 500
      };
    }

    // Apply same spending limits as new card purchase
    return await canCreateCard(userId, amount);

  } catch (error) {
    logger.error('Error checking reload limits', {
      error: error.message,
      userId,
      cardId,
      amount
    });

    return {
      allowed: false,
      reason: 'Error checking limits. Please try again.'
    };
  }
}

/**
 * Get daily spending for user
 */
export async function getDailySpending(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: today }
  });

  return cards.reduce((sum, card) => sum + card.balance.initial, 0);
}

/**
 * Get weekly spending for user
 */
export async function getWeeklySpending(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const cards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: weekAgo }
  });

  return cards.reduce((sum, card) => sum + card.balance.initial, 0);
}

/**
 * Get monthly spending for user
 */
export async function getMonthlySpending(userId) {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  monthAgo.setHours(0, 0, 0, 0);

  const cards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: monthAgo }
  });

  return cards.reduce((sum, card) => sum + card.balance.initial, 0);
}

/**
 * Get spending limits for KYC tier
 */
export function getLimitsForTier(tier) {
  switch (tier) {
    case 3:
      return DEFAULT_LIMITS.TIER_3;
    case 2:
      return DEFAULT_LIMITS.TIER_2;
    case 1:
    default:
      return DEFAULT_LIMITS.TIER_1;
  }
}

/**
 * Get current spending summary for user
 */
export async function getSpendingSummary(userId) {
  try {
    const user = await User.findByUserId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const kycTier = user.compliance?.kycTier || 1;
    const limits = getLimitsForTier(kycTier);

    const [daily, weekly, monthly, activeCards] = await Promise.all([
      getDailySpending(userId),
      getWeeklySpending(userId),
      getMonthlySpending(userId),
      DiscreetCard.countDocuments({ userId, status: 'active' })
    ]);

    return {
      kycTier,
      limits,
      current: {
        daily,
        weekly,
        monthly,
        activeCards
      },
      remaining: {
        daily: Math.max(0, limits.dailyLimit - daily),
        weekly: Math.max(0, limits.weeklyLimit - weekly),
        monthly: Math.max(0, limits.monthlyLimit - monthly),
        activeCards: Math.max(0, limits.maxActiveCards - activeCards)
      },
      percentUsed: {
        daily: Math.min(100, (daily / limits.dailyLimit) * 100),
        weekly: Math.min(100, (weekly / limits.weeklyLimit) * 100),
        monthly: Math.min(100, (monthly / limits.monthlyLimit) * 100),
        activeCards: Math.min(100, (activeCards / limits.maxActiveCards) * 100)
      }
    };

  } catch (error) {
    logger.error('Error getting spending summary', {
      error: error.message,
      userId
    });
    throw error;
  }
}

/**
 * Check if user is approaching any limits (for warnings)
 */
export async function checkLimitWarnings(userId) {
  const summary = await getSpendingSummary(userId);
  const warnings = [];

  if (summary.percentUsed.daily >= 80) {
    warnings.push({
      type: 'daily',
      level: summary.percentUsed.daily >= 95 ? 'critical' : 'warning',
      message: `You've used ${summary.percentUsed.daily.toFixed(1)}% of your daily limit`,
      current: summary.current.daily,
      limit: summary.limits.dailyLimit
    });
  }

  if (summary.percentUsed.weekly >= 80) {
    warnings.push({
      type: 'weekly',
      level: summary.percentUsed.weekly >= 95 ? 'critical' : 'warning',
      message: `You've used ${summary.percentUsed.weekly.toFixed(1)}% of your weekly limit`,
      current: summary.current.weekly,
      limit: summary.limits.weeklyLimit
    });
  }

  if (summary.percentUsed.monthly >= 80) {
    warnings.push({
      type: 'monthly',
      level: summary.percentUsed.monthly >= 95 ? 'critical' : 'warning',
      message: `You've used ${summary.percentUsed.monthly.toFixed(1)}% of your monthly limit`,
      current: summary.current.monthly,
      limit: summary.limits.monthlyLimit
    });
  }

  if (summary.percentUsed.activeCards >= 80) {
    warnings.push({
      type: 'activeCards',
      level: summary.percentUsed.activeCards >= 95 ? 'critical' : 'warning',
      message: `You have ${summary.current.activeCards} of ${summary.limits.maxActiveCards} active cards`,
      current: summary.current.activeCards,
      limit: summary.limits.maxActiveCards
    });
  }

  return warnings;
}

export default {
  canCreateCard,
  canReloadCard,
  getDailySpending,
  getWeeklySpending,
  getMonthlySpending,
  getSpendingSummary,
  getLimitsForTier,
  checkLimitWarnings,
  DEFAULT_LIMITS
};

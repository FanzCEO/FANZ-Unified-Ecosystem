/**
 * FanzDiscreet Fraud Detection & Risk Scoring System
 * Advanced fraud prevention for privacy card transactions
 */

import DiscreetCard from '../models/DiscreetCard.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Risk scoring thresholds
 */
const RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90
};

/**
 * Fraud detection rules
 */
const FRAUD_RULES = {
  // Velocity checks
  MAX_CARDS_PER_DAY: 3,
  MAX_CARDS_PER_WEEK: 10,
  MAX_RELOAD_PER_HOUR: 5,
  MAX_AMOUNT_PER_DAY: 1000,

  // Pattern detection
  SUSPICIOUS_AMOUNT_PATTERN: [100, 200, 300], // Sequential amounts
  RAPID_RELOAD_MINUTES: 5,

  // Geographic
  MULTIPLE_IPS_THRESHOLD: 3,
  VPN_RISK_INCREASE: 20,

  // Behavioral
  NEW_USER_HIGH_AMOUNT: 500,
  UNUSUAL_HOURS: { start: 2, end: 6 } // 2 AM - 6 AM
};

/**
 * Calculate risk score for a card purchase or reload
 */
export async function calculateRiskScore(userId, amount, ipAddress, userAgent, transactionType = 'purchase') {
  let riskScore = 0;
  const reasons = [];

  try {
    const user = await User.findByUserId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 1. Velocity checks
    const velocityRisk = await checkVelocity(userId, amount, transactionType);
    riskScore += velocityRisk.score;
    reasons.push(...velocityRisk.reasons);

    // 2. Amount pattern analysis
    const amountRisk = await analyzeAmountPatterns(userId, amount);
    riskScore += amountRisk.score;
    reasons.push(...amountRisk.reasons);

    // 3. Time-based analysis
    const timeRisk = analyzeTransactionTime();
    riskScore += timeRisk.score;
    reasons.push(...timeRisk.reasons);

    // 4. IP and geolocation checks
    const ipRisk = await analyzeIPAddress(userId, ipAddress);
    riskScore += ipRisk.score;
    reasons.push(...ipRisk.reasons);

    // 5. User behavior analysis
    const behaviorRisk = await analyzeBehavior(user, amount);
    riskScore += behaviorRisk.score;
    reasons.push(...behaviorRisk.reasons);

    // 6. Device fingerprinting
    const deviceRisk = await analyzeDevice(userId, userAgent);
    riskScore += deviceRisk.score;
    reasons.push(...deviceRisk.reasons);

    // 7. Historical chargeback analysis
    const chargebackRisk = await analyzeChargebackHistory(userId);
    riskScore += chargebackRisk.score;
    reasons.push(...chargebackRisk.reasons);

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    const riskLevel = getRiskLevel(riskScore);

    logger.info('Risk score calculated', {
      userId,
      amount,
      riskScore,
      riskLevel,
      reasons: reasons.slice(0, 5) // Log top 5 reasons
    });

    return {
      riskScore,
      riskLevel,
      reasons,
      shouldBlock: riskScore >= RISK_THRESHOLDS.CRITICAL,
      requiresReview: riskScore >= RISK_THRESHOLDS.HIGH,
      requiresMFA: riskScore >= RISK_THRESHOLDS.MEDIUM
    };

  } catch (error) {
    logger.error('Risk score calculation error', {
      error: error.message,
      userId,
      amount
    });

    // Fail secure - assign high risk on error
    return {
      riskScore: 75,
      riskLevel: 'HIGH',
      reasons: ['Error during risk assessment - manual review required'],
      shouldBlock: false,
      requiresReview: true,
      requiresMFA: true
    };
  }
}

/**
 * Check transaction velocity (rate limiting)
 */
async function checkVelocity(userId, amount, transactionType) {
  let score = 0;
  const reasons = [];

  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  // Cards created in last 24 hours
  const cardsToday = await DiscreetCard.countDocuments({
    userId,
    'timestamps.createdAt': { $gte: oneDayAgo }
  });

  if (cardsToday >= FRAUD_RULES.MAX_CARDS_PER_DAY) {
    score += 30;
    reasons.push(`Exceeded daily card limit (${cardsToday}/${FRAUD_RULES.MAX_CARDS_PER_DAY})`);
  }

  // Cards created in last 7 days
  const cardsThisWeek = await DiscreetCard.countDocuments({
    userId,
    'timestamps.createdAt': { $gte: oneWeekAgo }
  });

  if (cardsThisWeek >= FRAUD_RULES.MAX_CARDS_PER_WEEK) {
    score += 20;
    reasons.push(`Exceeded weekly card limit (${cardsThisWeek}/${FRAUD_RULES.MAX_CARDS_PER_WEEK})`);
  }

  // Total amount spent today
  const userCards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: oneDayAgo }
  });

  const totalSpentToday = userCards.reduce((sum, card) => sum + card.balance.initial, 0);

  if (totalSpentToday + amount > FRAUD_RULES.MAX_AMOUNT_PER_DAY) {
    score += 25;
    reasons.push(`High daily spending ($${totalSpentToday + amount})`);
  }

  // Reload velocity (if reload)
  if (transactionType === 'reload') {
    const recentReloads = await DiscreetCard.countDocuments({
      userId,
      'reloadable.reloadHistory.reloadedAt': { $gte: oneHourAgo }
    });

    if (recentReloads >= FRAUD_RULES.MAX_RELOAD_PER_HOUR) {
      score += 35;
      reasons.push(`Excessive reload frequency (${recentReloads}/${FRAUD_RULES.MAX_RELOAD_PER_HOUR} per hour)`);
    }
  }

  return { score, reasons };
}

/**
 * Analyze amount patterns for suspicious behavior
 */
async function analyzeAmountPatterns(userId, amount) {
  let score = 0;
  const reasons = [];

  // Get recent card amounts
  const recentCards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  })
  .sort({ 'timestamps.createdAt': -1 })
  .limit(5);

  const amounts = recentCards.map(card => card.balance.initial);

  // Check for round numbers (common in testing/fraud)
  if (amount % 100 === 0) {
    score += 5;
    reasons.push('Round number amount');
  }

  // Check for sequential pattern
  amounts.push(amount);
  if (isSequential(amounts)) {
    score += 15;
    reasons.push('Sequential amount pattern detected');
  }

  // Check for identical amounts
  const identicalCount = amounts.filter(a => a === amount).length;
  if (identicalCount >= 3) {
    score += 10;
    reasons.push(`Repeated identical amounts (${identicalCount}x $${amount})`);
  }

  // Maximum single transaction amount check
  if (amount === 500) {
    score += 10;
    reasons.push('Maximum amount card purchase');
  }

  return { score, reasons };
}

/**
 * Check if amounts follow a sequential pattern
 */
function isSequential(amounts) {
  if (amounts.length < 3) return false;

  const diffs = [];
  for (let i = 1; i < amounts.length; i++) {
    diffs.push(amounts[i] - amounts[i - 1]);
  }

  // Check if all differences are the same (arithmetic sequence)
  const firstDiff = diffs[0];
  return diffs.every(diff => diff === firstDiff && diff !== 0);
}

/**
 * Analyze transaction time for suspicious patterns
 */
function analyzeTransactionTime() {
  let score = 0;
  const reasons = [];

  const now = new Date();
  const hour = now.getHours();

  // Transactions in unusual hours (2 AM - 6 AM)
  if (hour >= FRAUD_RULES.UNUSUAL_HOURS.start && hour < FRAUD_RULES.UNUSUAL_HOURS.end) {
    score += 10;
    reasons.push(`Transaction at unusual hour (${hour}:00)`);
  }

  return { score, reasons };
}

/**
 * Analyze IP address for suspicious activity
 */
async function analyzeIPAddress(userId, ipAddress) {
  let score = 0;
  const reasons = [];

  // Get recent cards with different IPs
  const recentCards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  const uniqueIPs = new Set(recentCards.map(card => card.metadata.ipAddress));

  if (uniqueIPs.size >= FRAUD_RULES.MULTIPLE_IPS_THRESHOLD) {
    score += 20;
    reasons.push(`Multiple IP addresses used (${uniqueIPs.size})`);
  }

  // TODO: Add VPN detection via third-party service
  // if (isVPN(ipAddress)) {
  //   score += FRAUD_RULES.VPN_RISK_INCREASE;
  //   reasons.push('VPN detected');
  // }

  // TODO: Add geolocation checks
  // const location = await getIPLocation(ipAddress);
  // if (location.country !== expectedCountry) {
  //   score += 15;
  //   reasons.push(`Unusual location: ${location.country}`);
  // }

  return { score, reasons };
}

/**
 * Analyze user behavior and account age
 */
async function analyzeBehavior(user, amount) {
  let score = 0;
  const reasons = [];

  // New user with high amount
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

  if (accountAgeDays < 7 && amount >= FRAUD_RULES.NEW_USER_HIGH_AMOUNT) {
    score += 25;
    reasons.push(`New account (<7 days) with high amount ($${amount})`);
  }

  // Check if user has verified KYC
  if (!user.compliance?.kycVerified && amount > 100) {
    score += 15;
    reasons.push('Unverified user with amount >$100');
  }

  // Check user's historical compliance status
  const userCards = await DiscreetCard.find({ userId: user.userId });
  const frozenCards = userCards.filter(card => card.status === 'frozen').length;

  if (frozenCards > 0) {
    score += 20;
    reasons.push(`User has ${frozenCards} frozen card(s)`);
  }

  return { score, reasons };
}

/**
 * Analyze device fingerprint
 */
async function analyzeDevice(userId, userAgent) {
  let score = 0;
  const reasons = [];

  // Get recent cards
  const recentCards = await DiscreetCard.find({
    userId,
    'timestamps.createdAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const uniqueDevices = new Set(recentCards.map(card => card.metadata.userAgent));

  if (uniqueDevices.size >= 3) {
    score += 15;
    reasons.push(`Multiple devices used (${uniqueDevices.size})`);
  }

  // Check for suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    score += 10;
    reasons.push('Suspicious or missing user agent');
  }

  return { score, reasons };
}

/**
 * Analyze chargeback history
 */
async function analyzeChargebackHistory(userId) {
  let score = 0;
  const reasons = [];

  // Check for cards with chargeback notes
  const cardsWithChargebacks = await DiscreetCard.find({
    userId,
    'metadata.notes': /chargeback/i
  });

  if (cardsWithChargebacks.length > 0) {
    score += 40;
    reasons.push(`User has ${cardsWithChargebacks.length} chargeback(s) on record`);
  }

  return { score, reasons };
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (score >= RISK_THRESHOLDS.LOW) return 'LOW';
  return 'MINIMAL';
}

/**
 * Block or flag transaction based on risk score
 */
export async function shouldBlockTransaction(riskScore) {
  return riskScore >= RISK_THRESHOLDS.CRITICAL;
}

/**
 * Export fraud detection utilities
 */
export default {
  calculateRiskScore,
  shouldBlockTransaction,
  RISK_THRESHOLDS,
  FRAUD_RULES
};

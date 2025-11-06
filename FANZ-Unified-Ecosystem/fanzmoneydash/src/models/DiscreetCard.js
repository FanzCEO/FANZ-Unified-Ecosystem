/**
 * FANZ Discreet Card Model
 * Privacy-focused prepaid card system with non-adult merchant descriptors
 */

import mongoose from 'mongoose';
import { logSecurityEvent } from '../config/logger.js';

const { Schema } = mongoose;

const discreetCardSchema = new Schema({
  // Unique card identifier
  cardId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  // User ownership
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },

  // Card details
  card: {
    type: {
      type: String,
      enum: ['virtual_prepaid', 'gift_code', 'reload_code'],
      required: true,
      default: 'virtual_prepaid'
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    // Stored encrypted, last 4 only in plaintext
    cardNumber: {
      type: String,
      select: false
    },
    last4: String,
    cvv: {
      type: String,
      select: false // Never returned in API responses
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      min: 2025,
      max: 2040
    }
  },

  // Balance tracking
  balance: {
    initial: {
      type: Number,
      required: true,
      min: 10,
      max: 500
    },
    current: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3
    }
  },

  // Status and lifecycle
  status: {
    type: String,
    enum: ['active', 'depleted', 'expired', 'frozen', 'cancelled'],
    default: 'active',
    required: true,
    index: true
  },

  // Privacy settings (Grp Hldings LLC branding via CCBill)
  privacy: {
    merchantDescriptor: {
      type: String,
      default: 'GH COMMERCE',
      maxlength: 25,
      enum: [
        'GH COMMERCE',
        'GH DIGITAL SVC',
        'GH MEDIA SERVICES',
        'GH GIFT PURCHASE',
        'GH ENTERTAINMENT'
      ]
    },
    hideFromStatements: {
      type: Boolean,
      default: true
    },
    useGenericReceipts: {
      type: Boolean,
      default: true
    }
  },

  // Platform association
  platform: {
    name: {
      type: String,
      enum: [
        'boyfanz', 'girlfanz', 'pupfanz', 'daddiesfanz', 'cougarfanz',
        'taboofanz', 'femmefanz', 'transfanz', 'fanzuncut', 'southernfanz',
        'bearfanz', 'dlbroz', 'guyz'
      ],
      required: true
    },
    platformUserId: String
  },

  // Purchase information (CCBill integration)
  purchase: {
    transactionId: {
      type: String,
      ref: 'Transaction'
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal']
    },
    amount: Number,
    fees: {
      processing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    ccbill: {
      transactionId: String,
      subscriptionId: String,
      subAccount: String,
      descriptor: String,
      approvalCode: String
    },
    receiptUrl: String
  },

  // Usage tracking
  usage: {
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUsedAt: Date,
    usageHistory: [{
      amount: Number,
      description: String,
      merchant: String,
      transactionId: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },

  // Reload capability
  reloadable: {
    enabled: {
      type: Boolean,
      default: true
    },
    reloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxReloads: {
      type: Number,
      default: 10
    },
    reloadHistory: [{
      amount: Number,
      transactionId: String,
      reloadedAt: { type: Date, default: Date.now }
    }]
  },

  // Compliance and security
  compliance: {
    kycVerified: {
      type: Boolean,
      default: false
    },
    kycTier: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    amlStatus: {
      type: String,
      enum: ['clear', 'flagged', 'review', 'blocked'],
      default: 'clear'
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Timestamps
  timestamps: {
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    activatedAt: Date,
    depletedAt: Date,
    expiredAt: Date,
    cancelledAt: Date
  },

  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    notes: String
  }
}, {
  timestamps: false, // Using custom timestamps
  collection: 'discreetCards',
  strict: true
});

// Indexes for performance
discreetCardSchema.index({ userId: 1, status: 1 });
discreetCardSchema.index({ 'card.token': 1 });
discreetCardSchema.index({ 'timestamps.createdAt': -1 });
discreetCardSchema.index({ 'platform.name': 1 });
discreetCardSchema.index({ status: 1, 'balance.current': 1 });

// Virtual properties
discreetCardSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.balance.current > 0;
});

discreetCardSchema.virtual('remainingReloads').get(function() {
  return this.reloadable.maxReloads - this.reloadable.reloadCount;
});

discreetCardSchema.virtual('usagePercentage').get(function() {
  if (this.balance.initial === 0) return 0;
  return ((this.balance.initial - this.balance.current) / this.balance.initial) * 100;
});

// Pre-save middleware
discreetCardSchema.pre('save', function(next) {
  // Calculate total fees
  if (this.purchase && this.purchase.fees) {
    this.purchase.fees.total =
      (this.purchase.fees.processing || 0) +
      (this.purchase.fees.service || 0);
  }

  // Check if card should be marked as depleted
  if (this.balance.current === 0 && this.status === 'active') {
    this.status = 'depleted';
    this.timestamps.depletedAt = new Date();
  }

  // Check if card has expired
  if (this.card.expiryYear && this.card.expiryMonth) {
    const now = new Date();
    const expiryDate = new Date(this.card.expiryYear, this.card.expiryMonth, 0);

    if (now > expiryDate && this.status === 'active') {
      this.status = 'expired';
      this.timestamps.expiredAt = new Date();
    }
  }

  next();
});

// Instance methods
discreetCardSchema.methods.deductBalance = function(amount, description, merchant) {
  if (amount > this.balance.current) {
    throw new Error('Insufficient balance');
  }

  if (this.status !== 'active') {
    throw new Error('Card is not active');
  }

  this.balance.current -= amount;
  this.usage.totalSpent += amount;
  this.usage.transactionCount += 1;
  this.usage.lastUsedAt = new Date();

  // Add to usage history
  this.usage.usageHistory.push({
    amount,
    description: description || 'Purchase',
    merchant: merchant || this.privacy.merchantDescriptor,
    timestamp: new Date()
  });

  if (this.balance.current === 0) {
    this.status = 'depleted';
    this.timestamps.depletedAt = new Date();
  }

  logSecurityEvent('discreet_card_used', {
    cardId: this.cardId,
    userId: this.userId,
    amount,
    remainingBalance: this.balance.current
  });

  return this.save();
};

discreetCardSchema.methods.reloadBalance = function(amount, transactionId) {
  if (!this.reloadable.enabled) {
    throw new Error('Card is not reloadable');
  }

  if (this.reloadable.reloadCount >= this.reloadable.maxReloads) {
    throw new Error('Maximum reload count reached');
  }

  if (this.status === 'cancelled') {
    throw new Error('Cannot reload cancelled card');
  }

  this.balance.current += amount;
  this.reloadable.reloadCount += 1;
  this.reloadable.reloadHistory.push({
    amount,
    transactionId,
    reloadedAt: new Date()
  });

  if (this.status === 'depleted') {
    this.status = 'active';
  }

  logSecurityEvent('discreet_card_reloaded', {
    cardId: this.cardId,
    userId: this.userId,
    amount,
    newBalance: this.balance.current,
    reloadCount: this.reloadable.reloadCount
  });

  return this.save();
};

discreetCardSchema.methods.freeze = function(reason) {
  this.status = 'frozen';
  this.metadata.notes = (this.metadata.notes || '') + `\nFrozen: ${reason} at ${new Date().toISOString()}`;

  logSecurityEvent('discreet_card_frozen', {
    cardId: this.cardId,
    userId: this.userId,
    reason
  });

  return this.save();
};

discreetCardSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.timestamps.cancelledAt = new Date();
  this.metadata.notes = (this.metadata.notes || '') + `\nCancelled: ${reason} at ${new Date().toISOString()}`;

  logSecurityEvent('discreet_card_cancelled', {
    cardId: this.cardId,
    userId: this.userId,
    reason,
    remainingBalance: this.balance.current
  });

  return this.save();
};

discreetCardSchema.methods.checkKYCTier = function(requestedAmount) {
  // Tier 1: Up to $100/month
  // Tier 2: Up to $500/month
  // Tier 3: $500+/month

  if (requestedAmount <= 100 && this.compliance.kycTier >= 1) {
    return true;
  }

  if (requestedAmount <= 500 && this.compliance.kycTier >= 2) {
    return true;
  }

  if (requestedAmount > 500 && this.compliance.kycTier >= 3) {
    return true;
  }

  return false;
};

// Static methods
discreetCardSchema.statics.findByUserId = function(userId, statusFilter = ['active', 'depleted']) {
  return this.find({ userId, status: { $in: statusFilter } })
    .sort({ 'timestamps.createdAt': -1 });
};

discreetCardSchema.statics.findActiveCards = function(userId) {
  return this.find({
    userId,
    status: 'active',
    'balance.current': { $gt: 0 }
  })
  .sort({ 'timestamps.createdAt': -1 });
};

discreetCardSchema.statics.findByToken = function(token) {
  return this.findOne({ 'card.token': token });
};

discreetCardSchema.statics.getUserTotalBalance = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: '$balance.current' },
        cardCount: { $sum: 1 }
      }
    }
  ]);
};

discreetCardSchema.statics.getUserMonthlySpending = function(userId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.aggregate([
    {
      $match: {
        userId,
        'usage.usageHistory.timestamp': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $unwind: '$usage.usageHistory'
    },
    {
      $match: {
        'usage.usageHistory.timestamp': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$usage.usageHistory.amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

// Create and export the model
const DiscreetCard = mongoose.model('DiscreetCard', discreetCardSchema);

export default DiscreetCard;

/**
 * FANZ Money Dash Transaction Model
 * Comprehensive transaction model for financial tracking and compliance
 */

import mongoose from 'mongoose';
import { logSecurityEvent, logError } from '../config/logger.js';

const { Schema } = mongoose;

// Transaction schema definition
const transactionSchema = new Schema({
  // Unique transaction identifier
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  
  // External reference IDs
  externalId: {
    type: String,
    index: true,
    trim: true,
    maxlength: 100
  },
  
  platformTransactionId: {
    type: String,
    index: true,
    trim: true,
    maxlength: 100
  },
  
  // Transaction type and category
  type: {
    type: String,
    enum: [
      'subscription', 'tip', 'content_purchase', 'live_stream_gift',
      'payout', 'refund', 'chargeback', 'fee', 'bonus',
      'withdrawal', 'deposit', 'transfer', 'adjustment'
    ],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    enum: [
      'revenue', 'expense', 'fee', 'tax', 'payout',
      'refund', 'chargeback', 'adjustment', 'transfer'
    ],
    required: true,
    index: true
  },
  
  // Transaction status
  status: {
    type: String,
    enum: [
      'pending', 'processing', 'completed', 'failed',
      'cancelled', 'refunded', 'disputed', 'settled'
    ],
    default: 'pending',
    required: true,
    index: true
  },
  
  // Financial details
  amount: {
    gross: {
      type: Number,
      required: true,
      min: 0,
      get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
      set: v => Math.round(v * 100) / 100
    },
    net: {
      type: Number,
      required: true,
      min: 0,
      get: v => Math.round(v * 100) / 100,
      set: v => Math.round(v * 100) / 100
    },
    fees: {
      platform: {
        type: Number,
        default: 0,
        min: 0,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
      },
      payment: {
        type: Number,
        default: 0,
        min: 0,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
        get: v => Math.round(v * 100) / 100,
        set: v => Math.round(v * 100) / 100
      }
    }
  },
  
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: 3,
    uppercase: true
  },
  
  exchangeRate: {
    rate: Number,
    baseCurrency: String,
    timestamp: Date
  },
  
  // User information
  user: {
    userId: {
      type: String,
      required: true,
      maxlength: 100
    },
    username: {
      type: String,
      maxlength: 30
    },
    email: {
      type: String,
      maxlength: 255
    },
    role: {
      type: String,
      enum: ['creator', 'fan', 'admin', 'moderator', 'support']
    }
  },
  
  // Platform information
  platform: {
    name: {
      type: String,
      enum: ['boyfanz', 'girlfanz', 'pupfanz', 'daddiesfanz', 'cougarfanz', 'taboofanz'],
      required: true,
      index: true
    },
    userId: String,
    metadata: Schema.Types.Mixed
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: [
        'credit_card', 'debit_card', 'bank_transfer', 'paypal',
        'cryptocurrency', 'gift_card', 'wallet', 'check'
      ]
    },
    processor: {
      type: String,
      enum: [
        'stripe', 'paypal', 'square', 'coinbase',
        'bank', 'crypto', 'manual', 'internal'
      ]
    },
    processorTransactionId: String,
    last4: String,
    cardBrand: String,
    bankAccount: String,
    cryptoAddress: String,
    cryptoTxHash: String
  },
  
  // Related entities
  related: {
    contentId: String,
    subscriptionId: String,
    creatorId: String,
    fanId: String,
    parentTransactionId: String,
    batchId: String
  },
  
  // Description and notes
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  internalNotes: {
    type: String,
    maxlength: 1000,
    trim: true,
    select: false // Only visible to admins
  },
  
  // Timestamps
  timestamps: {
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    refundedAt: Date
  },
  
  // Tax information
  tax: {
    country: String,
    state: String,
    taxable: {
      type: Boolean,
      default: true
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 1, // Percentage as decimal (0.10 = 10%)
      get: v => Math.round(v * 10000) / 10000, // 4 decimal precision
      set: v => Math.round(v * 10000) / 10000
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
      get: v => Math.round(v * 100) / 100,
      set: v => Math.round(v * 100) / 100
    },
    taxYear: {
      type: Number,
      min: 2020,
      max: 2100
    },
    reportingRequired: {
      type: Boolean,
      default: false
    }
  },
  
  // Compliance and risk
  compliance: {
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
    },
    fraudCheck: {
      status: {
        type: String,
        enum: ['passed', 'flagged', 'failed', 'pending'],
        default: 'pending'
      },
      score: Number,
      provider: String,
      checkedAt: Date
    },
    kycRequired: {
      type: Boolean,
      default: false
    },
    sanctionCheck: {
      status: {
        type: String,
        enum: ['passed', 'flagged', 'failed', 'pending'],
        default: 'pending'
      },
      checkedAt: Date
    }
  },
  
  // Dispute and chargeback information
  dispute: {
    status: {
      type: String,
      enum: ['none', 'inquiry', 'chargeback', 'retrieval', 'pre_arbitration', 'arbitration'],
      default: 'none'
    },
    reason: String,
    amount: Number,
    evidence: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    deadlines: {
      response: Date,
      evidence: Date
    },
    outcome: {
      type: String,
      enum: ['won', 'lost', 'accepted', 'pending']
    },
    resolvedAt: Date
  },
  
  // Refund information
  refund: {
    reason: String,
    amount: {
      type: Number,
      min: 0,
      get: v => v ? Math.round(v * 100) / 100 : v,
      set: v => v ? Math.round(v * 100) / 100 : v
    },
    refundedAt: Date,
    refundTransactionId: String,
    partial: {
      type: Boolean,
      default: false
    }
  },
  
  // Metadata and tracking
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    sessionId: String,
    apiKey: String,
    webhook: {
      received: Boolean,
      processedAt: Date,
      retryCount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    tags: [String]
  }
}, {
  timestamps: false, // Using custom timestamps
  collection: 'transactions',
  strict: true,
  toJSON: { 
    getters: true, 
    transform: function(doc, ret) {
      // Don't return internal notes in JSON
      delete ret.internalNotes;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Indexes for performance and queries
// Note: transactionId already has unique index from schema definition
transactionSchema.index({ 'user.userId': 1, 'timestamps.createdAt': -1 });
transactionSchema.index({ 'platform.name': 1, 'timestamps.createdAt': -1 });
transactionSchema.index({ status: 1, 'timestamps.createdAt': -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ 'payment.processorTransactionId': 1 });
transactionSchema.index({ 'related.contentId': 1 });
transactionSchema.index({ 'related.subscriptionId': 1 });
transactionSchema.index({ 'related.creatorId': 1 });
transactionSchema.index({ 'related.fanId': 1 });
transactionSchema.index({ 'timestamps.createdAt': -1 });
transactionSchema.index({ 'tax.taxYear': 1, 'user.userId': 1 });
transactionSchema.index({ 'compliance.amlStatus': 1 });
transactionSchema.index({ 'dispute.status': 1 });

// Virtual properties
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount.gross;
});

transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

transactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || this.status === 'processing';
});

transactionSchema.virtual('hasDispute').get(function() {
  return this.dispute.status !== 'none';
});

transactionSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded' || !!this.refund.refundedAt;
});

transactionSchema.virtual('taxableAmount').get(function() {
  return this.tax.taxable ? this.amount.net : 0;
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Update timestamp
  this.timestamps.updatedAt = new Date();
  
  // Calculate total fees
  if (this.amount.fees) {
    this.amount.fees.total = 
      (this.amount.fees.platform || 0) + 
      (this.amount.fees.payment || 0) + 
      (this.amount.fees.tax || 0);
  }
  
  // Calculate net amount if not set
  if (!this.amount.net && this.amount.gross && this.amount.fees.total) {
    this.amount.net = this.amount.gross - this.amount.fees.total;
  }
  
  // Set tax year based on creation date
  if (!this.tax.taxYear && this.timestamps.createdAt) {
    this.tax.taxYear = this.timestamps.createdAt.getFullYear();
  }
  
  // Validate amount consistency
  if (this.amount.net > this.amount.gross) {
    return next(new Error('Net amount cannot be greater than gross amount'));
  }
  
  next();
});

// Instance methods
transactionSchema.methods.complete = function() {
  this.status = 'completed';
  this.timestamps.completedAt = new Date();
  return this.save();
};

transactionSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.timestamps.failedAt = new Date();
  if (reason) {
    this.internalNotes = (this.internalNotes || '') + `\nFailed: ${reason}`;
  }
  
  logSecurityEvent('transaction_failed', {
    transactionId: this.transactionId,
    userId: this.user.userId,
    reason: reason,
    amount: this.amount.gross
  });
  
  return this.save();
};

transactionSchema.methods.processRefund = function(amount, reason) {
  const refundAmount = amount || this.amount.gross;
  
  if (refundAmount > this.amount.gross) {
    throw new Error('Refund amount cannot be greater than transaction amount');
  }
  
  this.status = 'refunded';
  this.refund = {
    reason: reason || 'User requested',
    amount: refundAmount,
    refundedAt: new Date(),
    partial: refundAmount < this.amount.gross
  };
  this.timestamps.refundedAt = new Date();
  
  logSecurityEvent('transaction_refunded', {
    transactionId: this.transactionId,
    userId: this.user.userId,
    refundAmount: refundAmount,
    reason: reason
  });
  
  return this.save();
};

transactionSchema.methods.processDispute = function(reason, amount) {
  this.dispute.status = 'chargeback';
  this.dispute.reason = reason;
  this.dispute.amount = amount || this.amount.gross;
  
  logSecurityEvent('transaction_disputed', {
    transactionId: this.transactionId,
    userId: this.user.userId,
    disputeAmount: this.dispute.amount,
    reason: reason
  });
  
  return this.save();
};

transactionSchema.methods.addNote = function(note, isInternal = true) {
  const timestamp = new Date().toISOString();
  const noteWithTimestamp = `[${timestamp}] ${note}`;
  
  if (isInternal) {
    this.internalNotes = (this.internalNotes || '') + '\n' + noteWithTimestamp;
  } else {
    this.description = noteWithTimestamp;
  }
  
  return this.save();
};

transactionSchema.methods.updateCompliance = function(amlStatus, riskScore, fraudStatus) {
  this.compliance.amlStatus = amlStatus || this.compliance.amlStatus;
  this.compliance.riskScore = riskScore || this.compliance.riskScore;
  
  if (fraudStatus) {
    this.compliance.fraudCheck.status = fraudStatus;
    this.compliance.fraudCheck.checkedAt = new Date();
  }
  
  return this.save();
};

// Static methods
transactionSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transactionId });
};

transactionSchema.statics.findByUserId = function(userId, limit = 50) {
  return this.find({ 'user.userId': userId })
    .sort({ 'timestamps.createdAt': -1 })
    .limit(limit);
};

transactionSchema.statics.findByPlatform = function(platform, limit = 100) {
  return this.find({ 'platform.name': platform })
    .sort({ 'timestamps.createdAt': -1 })
    .limit(limit);
};

transactionSchema.statics.findPending = function() {
  return this.find({ status: { $in: ['pending', 'processing'] } })
    .sort({ 'timestamps.createdAt': 1 });
};

transactionSchema.statics.findByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    'timestamps.createdAt': {
      $gte: startDate,
      $lte: endDate
    },
    ...filters
  };
  
  return this.find(query).sort({ 'timestamps.createdAt': -1 });
};

transactionSchema.statics.getTotalsByUser = function(userId, taxYear) {
  const matchStage = {
    'user.userId': userId,
    status: 'completed'
  };
  
  if (taxYear) {
    matchStage['tax.taxYear'] = taxYear;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEarnings: {
          $sum: {
            $cond: [
              { $in: ['$type', ['subscription', 'tip', 'content_purchase', 'live_stream_gift']] },
              '$amount.net',
              0
            ]
          }
        },
        totalFees: { $sum: '$amount.fees.total' },
        totalTax: { $sum: '$amount.fees.tax' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

transactionSchema.statics.getTaxSummary = function(userId, taxYear) {
  return this.aggregate([
    {
      $match: {
        'user.userId': userId,
        'tax.taxYear': taxYear,
        'tax.taxable': true,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$tax.country',
        totalTaxable: { $sum: '$amount.net' },
        totalTax: { $sum: '$tax.taxAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

// Create and export the model
const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
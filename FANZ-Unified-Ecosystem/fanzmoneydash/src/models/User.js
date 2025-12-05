/**
 * FANZ Money Dash User Model
 * Comprehensive user model with security features and FANZ ecosystem integration
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from '../config/logger.js';

const { Schema } = mongoose;

// User schema definition
const userSchema = new Schema({
  // Core user identification
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // Authentication
  passwordHash: {
    type: String,
    select: false // Don't include in queries by default
  },
  
  // User profile information
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    avatar: {
      type: String,
      maxlength: 500
    },
    bio: {
      type: String,
      maxlength: 1000
    },
    dateOfBirth: Date,
    phoneNumber: {
      type: String,
      maxlength: 20
    },
    location: {
      country: String,
      state: String,
      city: String,
      timezone: String
    }
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: ['creator', 'fan', 'admin', 'moderator', 'support'],
    default: 'fan',
    required: true
  },
  
  permissions: [{
    type: String,
    enum: [
      'read_own_data',
      'write_own_data',
      'read_all_users',
      'write_all_users',
      'manage_transactions',
      'manage_compliance',
      'manage_system',
      'view_analytics',
      'manage_webhooks'
    ]
  }],
  
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
    default: 'pending_verification',
    required: true
  },
  
  // Verification status
  verification: {
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      token: String
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      token: String
    },
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      method: String,
      documentType: String
    },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: String,
      backupCodes: [String]
    }
  },
  
  // FANZ platform integration
  platforms: [{
    platform: {
      type: String,
      enum: ['FanzMoneyDash', 'girlfanz', 'pupfanz', 'daddiesfanz', 'cougarfanz', 'taboofanz'],
      required: true
    },
    platformUserId: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    metadata: Schema.Types.Mixed
  }],
  
  // Financial information
  financial: {
    // Tax information
    tax: {
      country: String,
      taxId: String,
      taxStatus: {
        type: String,
        enum: ['individual', 'business', 'nonprofit', 'exempt']
      },
      w9Submitted: { type: Boolean, default: false },
      w9SubmittedAt: Date
    },
    
    // Payout preferences
    payout: {
      method: {
        type: String,
        enum: ['bank_transfer', 'paypal', 'cryptocurrency', 'check'],
        default: 'bank_transfer'
      },
      currency: {
        type: String,
        default: 'USD',
        maxlength: 3
      },
      minimumThreshold: {
        type: Number,
        default: 50,
        min: 1
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      details: Schema.Types.Mixed // Encrypted payout details
    },
    
    // Earnings tracking
    earnings: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      lifetime: { type: Number, default: 0, min: 0 },
      lastPayoutAt: Date,
      lastUpdatedAt: { type: Date, default: Date.now }
    }
  },
  
  // Security tracking
  security: {
    loginAttempts: { type: Number, default: 0, min: 0 },
    lastFailedLogin: Date,
    lockedUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    sessionTokens: [{
      token: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
      ipAddress: String,
      userAgent: String,
      isActive: { type: Boolean, default: true }
    }],
    suspiciousActivity: [{
      type: String,
      description: String,
      ipAddress: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      }
    }]
  },
  
  // Compliance and legal
  compliance: {
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: Date,
    privacyAccepted: { type: Boolean, default: false },
    privacyAcceptedAt: Date,
    ageVerified: { type: Boolean, default: false },
    ageVerifiedAt: Date,
    gdprConsent: { type: Boolean, default: false },
    gdprConsentAt: Date,
    dataRetentionConsent: { type: Boolean, default: false }
  },
  
  // Preferences and settings
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      showOnlineStatus: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' }
  },
  
  // Activity tracking
  activity: {
    lastActive: { type: Date, default: Date.now },
    lastLoginAt: Date,
    totalLogins: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'users',
  strict: true
});

// Indexes for performance
// Note: userId, username, email already have unique indexes from schema definition
userSchema.index({ 'platforms.platform': 1, 'platforms.platformUserId': 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'activity.lastActive': -1 });
userSchema.index({ 'verification.email.verified': 1 });
userSchema.index({ 'compliance.ageVerified': 1 });

// Virtual properties
userSchema.virtual('fullName').get(function() {
  const { firstName, lastName } = this.profile || {};
  return firstName && lastName ? `${firstName} ${lastName}` : this.username;
});

userSchema.virtual('isVerified').get(function() {
  return this.verification?.email?.verified && this.verification?.identity?.verified;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.security?.lockedUntil && this.security.lockedUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Update the updatedAt timestamp
  this.activity.updatedAt = new Date();
  
  // Hash password if modified
  if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2')) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    logSecurityEvent('password_comparison_error', {
      userId: this.userId,
      error: error.message
    });
    return false;
  }
};

userSchema.methods.lockAccount = function() {
  const lockTime = parseInt(process.env.ACCOUNT_LOCK_TIME) || 30 * 60 * 1000; // 30 minutes
  this.security.lockedUntil = Date.now() + lockTime;
  this.security.loginAttempts = 0;
  
  logSecurityEvent('account_locked', {
    userId: this.userId,
    lockedUntil: this.security.lockedUntil
  });
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        'security.lockedUntil': 1,
        'security.lastFailedLogin': 1
      },
      $set: {
        'security.loginAttempts': 1
      }
    });
  }
  
  const updates = {
    $inc: { 'security.loginAttempts': 1 },
    $set: { 'security.lastFailedLogin': Date.now() }
  };
  
  // Lock account after too many attempts
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  if (this.security.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    const lockTime = parseInt(process.env.ACCOUNT_LOCK_TIME) || 30 * 60 * 1000;
    updates.$set['security.lockedUntil'] = Date.now() + lockTime;
    
    logSecurityEvent('max_login_attempts_reached', {
      userId: this.userId,
      attempts: this.security.loginAttempts + 1
    });
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lastFailedLogin': 1,
      'security.lockedUntil': 1
    },
    $set: {
      'activity.lastLoginAt': Date.now(),
      'activity.lastActive': Date.now(),
      $inc: { 'activity.totalLogins': 1 }
    }
  });
};

userSchema.methods.addPlatform = function(platform, platformUserId, metadata = {}) {
  const existingPlatform = this.platforms.find(p => p.platform === platform);
  
  if (existingPlatform) {
    existingPlatform.platformUserId = platformUserId;
    existingPlatform.metadata = metadata;
    existingPlatform.status = 'active';
  } else {
    this.platforms.push({
      platform,
      platformUserId,
      metadata,
      status: 'active',
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

userSchema.methods.updateLastActive = function() {
  this.activity.lastActive = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findCreators = function() {
  return this.find({ role: 'creator', status: 'active' });
};

// Create and export the model
const User = mongoose.model('User', userSchema);

export default User;
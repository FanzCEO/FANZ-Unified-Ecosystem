# FanzDiscreet Privacy Feature - Technical Specification

**Document Version**: 1.0
**Date**: 2025-11-06
**Status**: Design Phase
**Platform**: FanzMoney / FanzMoneyDash

---

## Executive Summary

FanzDiscreet is a privacy-focused financial feature that allows FANZ users to purchase prepaid cards and gift cards with non-adult receipt descriptors. This ensures financial privacy for users who need discreet transactions on their bank statements and credit card bills.

### Key Features
- Privacy-focused prepaid card purchases
- Non-adult merchant descriptors on all receipts
- Seamless integration with existing FanzMoney infrastructure
- Instant card provisioning
- Balance management and reload functionality
- Multi-platform support across all FANZ brands

### Privacy Guarantee
All FanzDiscreet transactions will appear on bank statements as **"FANZ MEDIA SERVICES"** or other generic descriptors, never containing adult-related terminology.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FanzMoneyDash Frontend                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Card Purchase   │  │ Balance Mgmt │  │ Transaction    │ │
│  │ Interface       │  │ Dashboard    │  │ History        │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FanzMoney Backend API                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ /api/discreet/  │  │ /api/cards/  │  │ /api/balance/  │ │
│  │ purchase        │  │ reload       │  │ check          │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Collections                      │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ discreetCards   │  │ transactions │  │ users          │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Stripe Payment Processor                       │
│  (with custom merchant descriptors)                         │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow: Card Purchase

```
User → FanzMoneyDash UI → API: POST /api/discreet/purchase
                           ↓
                    Validate Request
                           ↓
                    Create Stripe Payment
                    (descriptor: "FANZ MEDIA SERVICES")
                           ↓
                    Generate Card Token
                           ↓
                    Store in discreetCards collection
                           ↓
                    Create Transaction Record
                           ↓
                    Return Card Details ← User receives virtual card
```

---

## 2. Database Schema

### 2.1 DiscreetCard Model (NEW)

**File**: `/fanzmoneydash/src/models/DiscreetCard.js`

```javascript
import mongoose from 'mongoose';
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
    cardNumber: {
      type: String,
      // Stored encrypted, last 4 only in plaintext
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

  // Privacy settings
  privacy: {
    merchantDescriptor: {
      type: String,
      default: 'FANZ MEDIA SERVICES',
      maxlength: 25
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
      enum: ['SouthernFanz', 'girlfanz', 'pupfanz', 'daddiesfanz', 'cougarfanz', 'taboofanz'],
      required: true
    },
    platformUserId: String
  },

  // Purchase information
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
    stripeChargeId: String,
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
  collection: 'discreetCards'
});

// Indexes
discreetCardSchema.index({ userId: 1, status: 1 });
discreetCardSchema.index({ 'card.token': 1 });
discreetCardSchema.index({ 'timestamps.createdAt': -1 });
discreetCardSchema.index({ 'platform.name': 1 });

// Virtual properties
discreetCardSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.balance.current > 0;
});

discreetCardSchema.virtual('remainingReloads').get(function() {
  return this.reloadable.maxReloads - this.reloadable.reloadCount;
});

// Instance methods
discreetCardSchema.methods.deductBalance = function(amount) {
  if (amount > this.balance.current) {
    throw new Error('Insufficient balance');
  }

  this.balance.current -= amount;
  this.usage.totalSpent += amount;
  this.usage.transactionCount += 1;
  this.usage.lastUsedAt = new Date();

  if (this.balance.current === 0) {
    this.status = 'depleted';
    this.timestamps.depletedAt = new Date();
  }

  return this.save();
};

discreetCardSchema.methods.reloadBalance = function(amount, transactionId) {
  if (!this.reloadable.enabled) {
    throw new Error('Card is not reloadable');
  }

  if (this.reloadable.reloadCount >= this.reloadable.maxReloads) {
    throw new Error('Maximum reload count reached');
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

  return this.save();
};

discreetCardSchema.methods.freeze = function(reason) {
  this.status = 'frozen';
  this.metadata.notes = (this.metadata.notes || '') + `\nFrozen: ${reason} at ${new Date().toISOString()}`;
  return this.save();
};

discreetCardSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.timestamps.cancelledAt = new Date();
  this.metadata.notes = (this.metadata.notes || '') + `\nCancelled: ${reason} at ${new Date().toISOString()}`;
  return this.save();
};

// Static methods
discreetCardSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, status: { $in: ['active', 'depleted'] } })
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

const DiscreetCard = mongoose.model('DiscreetCard', discreetCardSchema);
export default DiscreetCard;
```

### 2.2 Transaction Model Updates (EXISTING)

**No changes required** - The existing Transaction model already supports:
- `type: 'deposit'` for card purchases
- `payment.method: 'gift_card'` for card-based payments
- Custom metadata for FanzDiscreet tracking

**Example Transaction for FanzDiscreet Purchase:**
```javascript
{
  transactionId: "txn_discreet_1699564800_abc123",
  type: "deposit",
  category: "transfer",
  status: "completed",
  amount: {
    gross: 50.00,
    net: 47.50,
    fees: {
      platform: 1.50,
      payment: 1.00,
      total: 2.50
    }
  },
  currency: "USD",
  payment: {
    method: "credit_card",
    processor: "stripe",
    processorTransactionId: "ch_3abc123stripe"
  },
  description: "FanzDiscreet Privacy Card Purchase",
  metadata: {
    discreetCardId: "card_abc123xyz",
    merchantDescriptor: "FANZ MEDIA SERVICES",
    privacyMode: true
  }
}
```

---

## 3. API Endpoints

### 3.1 Card Purchase

**Endpoint**: `POST /api/discreet/purchase`
**Authentication**: Required
**Rate Limit**: 10 requests/hour per user

**Request Body:**
```json
{
  "amount": 50,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "paymentToken": "pm_1234567890",
  "platform": "SouthernFanz",
  "reloadable": true
}
```

**Validation:**
- `amount`: Required, min: $10, max: $500
- `currency`: Required, enum: ['USD', 'EUR', 'GBP', 'CAD']
- `paymentMethod`: Required, enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal']
- `paymentToken`: Required, Stripe payment method token
- `platform`: Required, must match user's registered platform
- `reloadable`: Optional, boolean, default: true

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "card": {
      "cardId": "card_1699564800_abc123",
      "token": "fzdc_abc123xyz789",
      "last4": "4242",
      "type": "virtual_prepaid",
      "balance": {
        "current": 50.00,
        "currency": "USD"
      },
      "status": "active",
      "expiryMonth": 12,
      "expiryYear": 2027,
      "reloadable": true,
      "merchantDescriptor": "FANZ MEDIA SERVICES"
    },
    "transaction": {
      "transactionId": "txn_discreet_1699564800_abc123",
      "amount": 50.00,
      "fees": 2.50,
      "total": 52.50,
      "status": "completed",
      "receiptUrl": "https://fanz.network/receipts/txn_abc123"
    }
  },
  "message": "Privacy card created successfully. Your bank statement will show: FANZ MEDIA SERVICES",
  "createdAt": "2025-11-06T12:34:56Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid amount, payment method, or validation errors
- `402 Payment Required`: Payment failed or declined
- `403 Forbidden`: User not verified or suspended
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### 3.2 Get User's Cards

**Endpoint**: `GET /api/discreet/cards`
**Authentication**: Required
**Rate Limit**: 60 requests/minute

**Query Parameters:**
- `status`: Optional, enum: ['active', 'depleted', 'expired', 'all'], default: 'active'
- `page`: Optional, int, min: 1, default: 1
- `limit`: Optional, int, min: 1, max: 50, default: 20

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "cardId": "card_1699564800_abc123",
        "token": "fzdc_abc123xyz789",
        "last4": "4242",
        "type": "virtual_prepaid",
        "balance": {
          "current": 35.50,
          "initial": 50.00,
          "currency": "USD"
        },
        "status": "active",
        "platform": "SouthernFanz",
        "createdAt": "2025-11-06T12:34:56Z",
        "lastUsedAt": "2025-11-06T14:22:10Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1
    }
  }
}
```

---

### 3.3 Get Card Details

**Endpoint**: `GET /api/discreet/cards/:cardId`
**Authentication**: Required
**Rate Limit**: 60 requests/minute

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "card": {
      "cardId": "card_1699564800_abc123",
      "token": "fzdc_abc123xyz789",
      "last4": "4242",
      "type": "virtual_prepaid",
      "balance": {
        "current": 35.50,
        "initial": 50.00,
        "currency": "USD"
      },
      "status": "active",
      "expiryMonth": 12,
      "expiryYear": 2027,
      "platform": "SouthernFanz",
      "reloadable": {
        "enabled": true,
        "reloadCount": 2,
        "maxReloads": 10,
        "remainingReloads": 8
      },
      "usage": {
        "totalSpent": 14.50,
        "transactionCount": 3,
        "lastUsedAt": "2025-11-06T14:22:10Z"
      },
      "privacy": {
        "merchantDescriptor": "FANZ MEDIA SERVICES"
      },
      "createdAt": "2025-11-06T12:34:56Z"
    }
  }
}
```

---

### 3.4 Reload Card

**Endpoint**: `POST /api/discreet/cards/:cardId/reload`
**Authentication**: Required
**Rate Limit**: 10 requests/hour per card

**Request Body:**
```json
{
  "amount": 25,
  "paymentMethod": "credit_card",
  "paymentToken": "pm_9876543210"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "card": {
      "cardId": "card_1699564800_abc123",
      "balance": {
        "current": 60.50,
        "currency": "USD"
      },
      "reloadCount": 3,
      "remainingReloads": 7
    },
    "transaction": {
      "transactionId": "txn_reload_1699568400_xyz789",
      "amount": 25.00,
      "fees": 1.25,
      "total": 26.25,
      "status": "completed"
    }
  },
  "message": "Card reloaded successfully",
  "reloadedAt": "2025-11-06T15:45:30Z"
}
```

---

### 3.5 Cancel Card

**Endpoint**: `DELETE /api/discreet/cards/:cardId`
**Authentication**: Required
**Rate Limit**: 10 requests/hour

**Request Body:**
```json
{
  "reason": "No longer needed",
  "refundBalance": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cardId": "card_1699564800_abc123",
    "status": "cancelled",
    "refund": {
      "amount": 35.50,
      "transactionId": "txn_refund_1699572000_def456",
      "status": "processing",
      "estimatedArrival": "2025-11-10T12:00:00Z"
    }
  },
  "message": "Card cancelled. Refund is being processed.",
  "cancelledAt": "2025-11-06T16:30:00Z"
}
```

---

### 3.6 Get Card Usage History

**Endpoint**: `GET /api/discreet/cards/:cardId/usage`
**Authentication**: Required
**Rate Limit**: 60 requests/minute

**Query Parameters:**
- `fromDate`: Optional, ISO 8601 date
- `toDate`: Optional, ISO 8601 date
- `limit`: Optional, int, default: 50

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cardId": "card_1699564800_abc123",
    "usage": [
      {
        "amount": 9.99,
        "description": "Creator subscription - SouthernFanz",
        "merchant": "FANZ MEDIA SERVICES",
        "timestamp": "2025-11-06T14:22:10Z"
      },
      {
        "amount": 4.51,
        "description": "Creator tip",
        "merchant": "FANZ MEDIA SERVICES",
        "timestamp": "2025-11-06T13:15:45Z"
      }
    ],
    "summary": {
      "totalSpent": 14.50,
      "transactionCount": 2,
      "averageTransaction": 7.25
    }
  }
}
```

---

## 4. Merchant Descriptor Configuration

### 4.1 Stripe Merchant Descriptor

FanzDiscreet uses Stripe's `statement_descriptor` feature to customize how transactions appear on bank statements.

**Configuration:**
```javascript
// In Stripe charge creation
const charge = await stripe.charges.create({
  amount: 5000, // $50.00
  currency: 'usd',
  source: paymentToken,
  description: 'FanzDiscreet Privacy Card Purchase',
  statement_descriptor: 'FANZ MEDIA SVC', // Max 22 characters
  statement_descriptor_suffix: 'PREPAID', // Optional, max 10 characters
  metadata: {
    discreetCardId: cardId,
    userId: userId,
    privacyMode: true
  }
});
```

**Result on Bank Statement:**
```
FANZ MEDIA SVC*PREPAID     $52.50
```

### 4.2 Allowed Merchant Descriptors

Users can choose from approved descriptors:

1. **FANZ MEDIA SERVICES** (default) - Generic media service
2. **FANZ DIGITAL CONTENT** - Digital content purchase
3. **FANZ ENTERTAINMENT** - Entertainment services
4. **FANZ SUBSCRIPTION** - Subscription service
5. **FANZ MEDIA TECH** - Technology service

**NOT ALLOWED:**
- Any descriptor containing: "adult", "XXX", "dating", "escort", or FANZ platform names

### 4.3 Receipt Privacy

All email receipts sent to users will:
- Use generic branding ("FANZ Media Services")
- Omit specific platform names
- Use discrete product descriptions
- Include generic support contact (support@fanz.network)

---

## 5. Security & Compliance

### 5.1 Card Data Security

1. **Encryption at Rest**: All card data encrypted using AES-256
2. **PCI Compliance**: Leverage Stripe's PCI DSS Level 1 compliance
3. **No Plain Text Storage**: Full card numbers and CVV never stored in plain text
4. **Tokenization**: Use Stripe tokens instead of raw card data

### 5.2 KYC/AML Requirements

**Tier 1** (Up to $100/month):
- Email verification only
- No KYC required

**Tier 2** ($100-$500/month):
- Email + phone verification
- Basic identity verification (name, DOB, address)

**Tier 3** ($500+/month):
- Full KYC verification
- Government ID upload
- Enhanced due diligence

### 5.3 Fraud Detection

Implement fraud checks on:
- Unusual purchase patterns
- High-value transactions
- Multiple card purchases in short time
- Geographic anomalies (IP vs billing address)
- Velocity checks (transactions per hour/day)

**Risk Scoring:**
- 0-30: Low risk (auto-approve)
- 31-60: Medium risk (manual review)
- 61-80: High risk (require additional verification)
- 81-100: Critical risk (block transaction)

### 5.4 Compliance Monitoring

- Transaction monitoring for suspicious activity
- AML screening against OFAC/sanctions lists
- SAR filing procedures for transactions over $10,000
- Quarterly compliance audits
- Data retention: 7 years for financial records

---

## 6. UI/UX Components

### 6.1 Purchase Flow

**Component**: `DiscreetCardPurchase.jsx`

```jsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const DiscreetCardPurchase = () => {
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handlePurchase = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create payment method
    const { paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    // Call FanzDiscreet API
    const response = await fetch('/api/discreet/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentToken: paymentMethod.id,
        platform: 'SouthernFanz',
        reloadable: true
      })
    });

    const data = await response.json();

    if (data.success) {
      // Show success message with card details
      showSuccessModal(data.data.card);
    }

    setLoading(false);
  };

  return (
    <div className="discreet-card-purchase">
      <h2>Purchase Privacy Card</h2>
      <p className="privacy-notice">
        Your bank statement will show: <strong>FANZ MEDIA SERVICES</strong>
      </p>

      <form onSubmit={handlePurchase}>
        <div className="amount-selector">
          <label>Card Amount</label>
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))}>
            <option value={10}>$10</option>
            <option value={25}>$25</option>
            <option value={50}>$50 (Popular)</option>
            <option value={100}>$100</option>
            <option value={200}>$200</option>
            <option value={500}>$500</option>
          </select>
        </div>

        <div className="payment-details">
          <label>Payment Method</label>
          <CardElement />
        </div>

        <div className="fees-breakdown">
          <div>Card amount: ${amount.toFixed(2)}</div>
          <div>Processing fee: ${(amount * 0.029 + 0.30).toFixed(2)}</div>
          <div>Service fee: ${(amount * 0.02).toFixed(2)}</div>
          <div className="total">Total: ${(amount * 1.049 + 0.30).toFixed(2)}</div>
        </div>

        <button type="submit" disabled={!stripe || loading}>
          {loading ? 'Processing...' : 'Purchase Privacy Card'}
        </button>
      </form>

      <div className="privacy-benefits">
        <h3>Why use FanzDiscreet?</h3>
        <ul>
          <li>No adult-related terms on bank statements</li>
          <li>Generic merchant descriptors</li>
          <li>Discrete email receipts</li>
          <li>Reloadable cards available</li>
          <li>Instant activation</li>
        </ul>
      </div>
    </div>
  );
};

export default DiscreetCardPurchase;
```

### 6.2 Card Management Dashboard

**Component**: `DiscreetCardDashboard.jsx`

Key features:
- List all active and depleted cards
- Show balance and usage for each card
- Reload card functionality
- Cancel card option
- Transaction history view
- Export statements (with privacy mode)

### 6.3 Privacy Settings

**Component**: `PrivacySettings.jsx`

Allow users to customize:
- Preferred merchant descriptor
- Email receipt preferences
- Statement visibility
- Transaction notifications

---

## 7. Integration Points

### 7.1 FanzSSO Integration

FanzDiscreet will authenticate users via FanzSSO (single sign-on):

```javascript
// Verify user session via FanzSSO
const authenticateDiscreetRequest = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Validate token with FanzSSO
  const ssoValidation = await axios.post('https://sso.fanz.network/validate', {
    token,
    platform: 'fanzmoney',
    scope: 'discreet:manage'
  });

  if (!ssoValidation.data.valid) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = ssoValidation.data.user;
  next();
};
```

### 7.2 Cross-Platform Usage

FanzDiscreet cards work across all FANZ platforms:
- SouthernFanz
- girlfanz
- pupfanz
- cougarfanz
- taboofanz
- daddiesfanz
- femmefanz
- transfanz
- fanzuncut
- southernfanz

**Platform Identifier**: Each transaction records `platform.name` to track usage across brands.

### 7.3 FanzCRM Integration

Notify FanzCRM when:
- User purchases first FanzDiscreet card (lifecycle: privacy_conscious)
- Card balance runs low (trigger: reload_reminder)
- Card expires (trigger: renewal_offer)

---

## 8. Testing Strategy

### 8.1 Unit Tests

**File**: `/fanzmoneydash/src/tests/discreet.test.js`

Test cases:
- Card creation with valid/invalid amounts
- Balance deduction and overflow protection
- Reload functionality and limits
- Card cancellation and refund calculation
- Merchant descriptor validation
- KYC tier enforcement

### 8.2 Integration Tests

- Stripe payment flow (test mode)
- Transaction record creation
- User card list retrieval
- Cross-platform card usage
- FanzSSO authentication

### 8.3 Security Tests

- SQL injection attempts
- XSS in card metadata
- Rate limiting enforcement
- Permission boundary testing
- Encrypted data storage verification

---

## 9. Rollout Plan

### Phase 1: MVP (Weeks 1-2)
- Implement DiscreetCard model
- Create purchase endpoint
- Basic card management (list, view)
- Stripe integration with merchant descriptors
- Simple UI for card purchase

### Phase 2: Core Features (Weeks 3-4)
- Reload functionality
- Usage history tracking
- Card cancellation with refunds
- KYC tier system
- Enhanced UI dashboard

### Phase 3: Advanced Features (Weeks 5-6)
- Multi-currency support
- Custom merchant descriptor selection
- Fraud detection system
- Analytics dashboard for admins
- Mobile app integration

### Phase 4: Optimization (Week 7+)
- Performance tuning
- Security audit
- Compliance review
- User feedback iteration
- Marketing launch

---

## 10. Success Metrics

### User Adoption
- Target: 15% of active users purchase FanzDiscreet card within 3 months
- Average card balance: $50-100
- Reload rate: 40% of users reload within 30 days

### Revenue
- Processing fee: 2.9% + $0.30 per transaction
- Service fee: 2% of card value
- Reload fee: 1.9% + $0.30

**Projected Monthly Revenue** (assuming 10,000 active users):
- 1,500 users purchase cards (15% adoption)
- Average card value: $75
- Total transaction volume: $112,500
- Revenue from fees: ~$5,625

### Privacy Impact
- 90%+ user satisfaction with privacy features
- <1% complaints about merchant descriptors
- Zero data breaches or PCI compliance issues

---

## 11. Support & Documentation

### User Documentation
- "How to Purchase a Privacy Card"
- "Understanding Merchant Descriptors"
- "Reloading Your Card"
- "Privacy Card FAQs"

### Developer Documentation
- API reference for FanzDiscreet endpoints
- Stripe integration guide
- Security best practices
- Troubleshooting common issues

### Support Channels
- Email: support@fanz.network
- Live chat (in FanzMoneyDash)
- Help center: help.fanz.network/discreet
- Phone: 1-800-FANZ-HELP

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment processor rejects adult industry | High | Maintain relationships with multiple processors; emphasize "media services" positioning |
| Fraud/chargebacks | High | Implement robust KYC/AML; fraud detection system; velocity limits |
| Regulatory compliance changes | Medium | Quarterly compliance audits; legal counsel review; flexible architecture |
| User confusion about privacy feature | Low | Clear onboarding; educational content; customer support |
| Data breach | Critical | Encryption at rest/transit; PCI compliance; security audits; incident response plan |

---

## 13. Future Enhancements

### V2.0 Features
- Physical prepaid cards (shipped to user)
- ACH/bank account funding options
- Cryptocurrency purchases (Bitcoin, ETH)
- International currency support (50+ currencies)
- Gift card marketplace (buy/sell/trade)
- Privacy card gifting to other users
- Recurring reload automation
- Spending limits and budgeting tools

### Integration Opportunities
- Apple Pay / Google Pay support
- Third-party merchant integration (non-FANZ)
- White-label privacy card for other adult platforms
- API for external developers

---

## 14. Appendix

### A. Glossary

- **Merchant Descriptor**: Text that appears on bank/credit card statements identifying the merchant
- **KYC**: Know Your Customer - identity verification process
- **AML**: Anti-Money Laundering - compliance regulations
- **PCI DSS**: Payment Card Industry Data Security Standard
- **Tokenization**: Replacing sensitive data with unique identifiers (tokens)
- **Virtual Prepaid Card**: Digital payment card with pre-loaded balance

### B. Reference Links

- Stripe Merchant Descriptors: https://stripe.com/docs/statement-descriptors
- PCI DSS Compliance: https://www.pcisecuritystandards.org/
- AML Compliance Guide: https://www.fincen.gov/
- OFAC Sanctions List: https://sanctionssearch.ofac.treas.gov/

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-06 | FANZ Engineering | Initial specification |

---

**Document Status**: ✅ **Ready for Implementation**

**Next Steps**:
1. Review with Product, Engineering, and Legal teams
2. Security audit and compliance review
3. Begin Phase 1 development
4. Set up Stripe test environment
5. Create UI mockups and prototypes

---

**Contact**:
- **Product Lead**: product@fanz.network
- **Engineering Lead**: engineering@fanz.network
- **Compliance Officer**: compliance@fanz.network

---

*This document is confidential and proprietary to FANZ Network. Do not distribute without authorization.*

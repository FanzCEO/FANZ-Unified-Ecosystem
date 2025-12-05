# FanzDiscreet x CCBill Integration Specification

**Parent Entity**: Grp Hldings LLC (Fanz Group Holdings)
**Payment Processor**: CCBill
**Product**: FanzDiscreet Privacy Card System
**Platform**: FanzFinance / FanzMoneyDash
**Document Version**: 2.0 (CCBill Integration)
**Date**: 2025-11-06

---

## Executive Summary

FanzDiscreet is a financial privacy feature that leverages **CCBill's** proven adult industry payment infrastructure to provide users with prepaid cards featuring **100% discreet billing descriptors**. All transactions are processed under **Grp Hldings LLC**, ensuring no adult-related terms appear on bank statements.

### Why CCBill?

1. **Adult Industry Expertise** - CCBill specializes in high-risk merchant processing with 25+ years of experience
2. **Discreet Descriptors Built-In** - Native support for neutral merchant names and custom DBA configurations
3. **Compliance Ready** - PCI-DSS Level 1, AML/KYC workflows, age verification
4. **Layered Payment Routing** - Multiple sub-merchants under one parent account (Grp Hldings)
5. **Stored Value API** - Perfect for prepaid/reloadable card functionality
6. **FlexForms** - Customizable checkout with branded FanzMoneyDash UI

---

## 1. Architecture Overview

### 1.1 Payment Flow with CCBill

```
┌─────────────────────────────────────────────────────────────────┐
│                     FanzMoneyDash Frontend                      │
│    (User purchases FanzDiscreet card with privacy guarantee)    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FanzFinance API Layer                        │
│    • Validates transaction                                      │
│    • Selects appropriate CCBill sub-merchant                    │
│    • Applies Grp Hldings descriptor                            │
│    • Tokenizes payment data                                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               CCBill Payment Gateway                            │
│    Parent Merchant: Grp Hldings LLC                            │
│    ┌───────────────────────────────────────────────────────┐   │
│    │ Sub-Merchant 1: "GH Commerce" (Gift Cards)           │   │
│    │ Sub-Merchant 2: "GH Digital Services" (Reloads)      │   │
│    │ Sub-Merchant 3: "GH Media Services" (Subscriptions)  │   │
│    └───────────────────────────────────────────────────────┘   │
│                                                                 │
│    • CCBill Stored Value API (prepaid balance management)      │
│    • CCBill FlexForms (branded checkout UI)                    │
│    • Dynamic descriptor routing                                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   User's Bank Statement                         │
│    Shows: "GH COMMERCE" or "GH DIGITAL SVC"                    │
│    (No mention of FANZ, adult, or NSFW content)                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             FanzMoney Wallet (Internal Ledger)                  │
│    • Balance credited to user's FanzMoneyDash account          │
│    • Spendable across SouthernFanz, GirlFanz, PupFanz, etc.        │
│    • Full audit trail internally, discreet externally          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Multi-Descriptor Strategy

CCBill allows Grp Hldings to maintain multiple sub-merchant accounts with different descriptors:

| Transaction Type | Descriptor | CCBill Sub-Account | Use Case |
|-----------------|-----------|-------------------|----------|
| **Gift Card Purchase** | GH COMMERCE | 1234567-01 | Initial card purchase |
| **Balance Reload** | GH DIGITAL SVC | 1234567-02 | Reloading existing card |
| **Subscription** | GH MEDIA SERVICES | 1234567-03 | Platform subscriptions |
| **One-Time Purchase** | GH GIFT PURCHASE | 1234567-04 | Content/tips |

---

## 2. CCBill Integration Points

### 2.1 CCBill Account Structure

**Parent Merchant**: Grp Hldings LLC
- **Legal Name**: Fanz Group Holdings LLC
- **DBA Names**:
  - GH Commerce
  - GH Digital Services
  - GH Media Services
  - GH Gift Purchase

**CCBill Account ID**: `1234567` (example)

**Sub-Accounts**:
- `1234567-01`: GH Commerce (gift cards)
- `1234567-02`: GH Digital Services (reloads)
- `1234567-03`: GH Media Services (subscriptions)
- `1234567-04`: GH Gift Purchase (one-time)

### 2.2 CCBill API Endpoints

**Base URL**: `https://api.ccbill.com/transactions/`

**Authentication**:
- Merchant ID
- API Key (secret)
- Client Account Number

**Key Endpoints**:

1. **Payment Processing**
```http
POST /api/ccbill.com/wap-frontflex/flexforms/{formId}
```

2. **Stored Value API** (for prepaid balance)
```http
POST /api/ccbill.com/storedvalue/credit
POST /api/ccbill.com/storedvalue/debit
GET /api/ccbill.com/storedvalue/balance
```

3. **Transaction Lookup**
```http
GET /api/ccbill.com/transactions/{transactionId}
```

4. **Webhook Notifications**
```http
POST /api/fanz.network/webhooks/ccbill
```

### 2.3 CCBill FlexForms Configuration

**Form ID**: `1234567890` (assigned by CCBill)

**Custom Fields**:
```html
<form method="POST" action="https://api.ccbill.com/wap-frontflex/flexforms/1234567890">
  <!-- CCBill Standard Fields -->
  <input type="hidden" name="clientAccnum" value="1234567-01" />
  <input type="hidden" name="clientSubacc" value="0001" />
  <input type="hidden" name="formPrice" value="50.00" />
  <input type="hidden" name="formPeriod" value="2" />
  <input type="hidden" name="currencyCode" value="840" /> <!-- USD -->

  <!-- FanzDiscreet Custom Fields -->
  <input type="hidden" name="descriptor" value="GH COMMERCE" />
  <input type="hidden" name="customField1" value="discreet_card" />
  <input type="hidden" name="customField2" value="{{userId}}" />
  <input type="hidden" name="customField3" value="{{platform}}" />
  <input type="hidden" name="customField4" value="{{cardId}}" />

  <!-- Return URL after payment -->
  <input type="hidden" name="zc_return_url" value="https://fanz.network/discreet/success" />
</form>
```

---

## 3. Database Schema Updates

### 3.1 DiscreetCard Model Updates for CCBill

```javascript
// Additional fields for CCBill integration
purchase: {
  transactionId: String,
  method: String,
  amount: Number,
  fees: {
    processing: Number,
    service: Number,
    total: Number
  },

  // CCBill specific fields
  ccbill: {
    transactionId: String,        // CCBill transaction ID
    subscriptionId: String,        // CCBill subscription ID (for stored value)
    subAccount: String,            // Which sub-account processed it
    descriptor: String,            // Merchant descriptor used
    flexFormId: String,            // FlexForm that processed payment
    paymentType: String,           // 'CREDIT', 'DEBIT', 'ACH'
    last4: String,                 // Last 4 of card used
    cardType: String,              // 'VISA', 'MASTERCARD', etc.
    approvalCode: String,          // Bank approval code
    avsResponse: String,           // Address verification response
    cvvResponse: String            // CVV verification response
  },

  receiptUrl: String
}
```

### 3.2 Transaction Model Updates

```javascript
payment: {
  method: String,
  processor: 'ccbill',           // Changed from 'stripe'
  processorTransactionId: String,

  // CCBill metadata
  ccbillData: {
    subAccount: String,
    descriptor: String,
    subscriptionId: String,
    billingCycle: Number
  }
}
```

---

## 4. API Implementation (CCBill Version)

### 4.1 Purchase FanzDiscreet Card via CCBill

**File**: `/fanzmoneydash/src/routes/discreet.js`

```javascript
import axios from 'axios';
import crypto from 'crypto';

// CCBill Configuration
const CCBILL_CONFIG = {
  merchantId: process.env.CCBILL_MERCHANT_ID,
  apiKey: process.env.CCBILL_API_KEY,
  clientAccnum: process.env.CCBILL_CLIENT_ACCNUM,
  baseUrl: 'https://api.ccbill.com',
  webhookSecret: process.env.CCBILL_WEBHOOK_SECRET
};

// Sub-account mapping for descriptors
const CCBILL_SUB_ACCOUNTS = {
  'gift_card': '1234567-01',      // GH COMMERCE
  'reload': '1234567-02',          // GH DIGITAL SVC
  'subscription': '1234567-03',    // GH MEDIA SERVICES
  'one_time': '1234567-04'         // GH GIFT PURCHASE
};

const MERCHANT_DESCRIPTORS = {
  '1234567-01': 'GH COMMERCE',
  '1234567-02': 'GH DIGITAL SVC',
  '1234567-03': 'GH MEDIA SERVICES',
  '1234567-04': 'GH GIFT PURCHASE'
};

/**
 * Process payment via CCBill Stored Value API
 */
const processCCBillPayment = async (amount, cardToken, userId, cardId) => {
  try {
    // Select appropriate sub-account
    const subAccount = CCBILL_SUB_ACCOUNTS['gift_card'];
    const descriptor = MERCHANT_DESCRIPTORS[subAccount];

    // Generate CCBill payment request
    const paymentData = {
      clientAccnum: CCBILL_CONFIG.clientAccnum,
      clientSubacc: subAccount.split('-')[1],
      amount: amount.toFixed(2),
      currencyCode: '840', // USD
      descriptor: descriptor,

      // Custom fields for tracking
      customField1: 'discreet_card',
      customField2: userId,
      customField3: cardId,
      customField4: Date.now().toString(),

      // Payment method token
      paymentToken: cardToken
    };

    // Calculate CCBill hash for security
    const hashString = `${paymentData.amount}${paymentData.currencyCode}${CCBILL_CONFIG.apiKey}`;
    const hash = crypto.createHash('md5').update(hashString).digest('hex');
    paymentData.hash = hash;

    // Call CCBill API
    const response = await axios.post(
      `${CCBILL_CONFIG.baseUrl}/transactions/payment_api`,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${CCBILL_CONFIG.apiKey}`
        }
      }
    );

    // CCBill returns transaction details
    if (response.data.approved === '1') {
      return {
        success: true,
        transactionId: response.data.transactionId,
        subscriptionId: response.data.subscriptionId,
        approvalCode: response.data.approvalCode,
        descriptor: descriptor,
        subAccount: subAccount,
        last4: response.data.last4,
        cardType: response.data.cardType,
        receiptUrl: `https://www.ccbill.com/customer-service/view-receipt.cgi?s=${response.data.transactionId}`
      };
    } else {
      return {
        success: false,
        error: response.data.declineReason || 'Payment declined',
        declineCode: response.data.declineCode
      };
    }

  } catch (error) {
    logger.error('CCBill payment processing error', {
      error: error.message,
      userId,
      amount
    });

    throw new Error('Payment processing failed');
  }
};

/**
 * Reload card balance via CCBill
 */
const reloadCCBillBalance = async (amount, cardToken, card) => {
  try {
    const subAccount = CCBILL_SUB_ACCOUNTS['reload'];
    const descriptor = MERCHANT_DESCRIPTORS[subAccount];

    // Use CCBill Stored Value API to credit balance
    const reloadData = {
      subscriptionId: card.purchase.ccbill.subscriptionId,
      amount: amount.toFixed(2),
      descriptor: descriptor,
      transactionType: 'credit',
      customField1: 'card_reload',
      customField2: card.userId,
      customField3: card.cardId
    };

    const response = await axios.post(
      `${CCBILL_CONFIG.baseUrl}/storedvalue/credit`,
      reloadData,
      {
        headers: {
          'Authorization': `Bearer ${CCBILL_CONFIG.apiKey}`
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        newBalance: response.data.balance,
        descriptor: descriptor
      };
    } else {
      throw new Error('Reload failed');
    }

  } catch (error) {
    logger.error('CCBill reload error', {
      error: error.message,
      cardId: card.cardId
    });

    throw new Error('Failed to reload card balance');
  }
};

// Update route handler to use CCBill
router.post('/purchase', async (req, res) => {
  // ... validation code ...

  try {
    // Process payment via CCBill
    const ccbillResult = await processCCBillPayment(
      totalCharge,
      paymentToken,
      req.user.userId,
      cardId
    );

    if (!ccbillResult.success) {
      return res.status(402).json({
        success: false,
        error: ccbillResult.error,
        declineCode: ccbillResult.declineCode
      });
    }

    // Create discreet card with CCBill data
    const discreetCard = new DiscreetCard({
      // ... existing fields ...

      purchase: {
        transactionId: transaction.transactionId,
        method: paymentMethod,
        amount,
        fees,

        ccbill: {
          transactionId: ccbillResult.transactionId,
          subscriptionId: ccbillResult.subscriptionId,
          subAccount: ccbillResult.subAccount,
          descriptor: ccbillResult.descriptor,
          paymentType: 'CREDIT',
          last4: ccbillResult.last4,
          cardType: ccbillResult.cardType,
          approvalCode: ccbillResult.approvalCode
        },

        receiptUrl: ccbillResult.receiptUrl
      }
    });

    await discreetCard.save();

    res.status(201).json({
      success: true,
      data: {
        card: {
          cardId: discreetCard.cardId,
          // ... other fields ...
          merchantDescriptor: ccbillResult.descriptor
        },
        transaction: {
          transactionId: transaction.transactionId,
          ccbillTransactionId: ccbillResult.transactionId,
          receiptUrl: ccbillResult.receiptUrl
        }
      },
      message: `Privacy card created successfully. Your bank statement will show: ${ccbillResult.descriptor}`
    });

  } catch (error) {
    // ... error handling ...
  }
});
```

---

## 5. CCBill Webhook Integration

### 5.1 Webhook Handler

**Endpoint**: `POST /api/webhooks/ccbill`

**File**: `/fanzmoneydash/src/routes/webhooks/ccbill.js`

```javascript
import express from 'express';
import crypto from 'crypto';
import DiscreetCard from '../../models/DiscreetCard.js';
import Transaction from '../../models/Transaction.js';
import logger from '../../config/logger.js';

const router = express.Router();

/**
 * Verify CCBill webhook signature
 */
const verifyCCBillWebhook = (payload, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CCBILL_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
};

/**
 * Handle CCBill webhook events
 */
router.post('/ccbill', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-ccbill-signature'];
    const payload = JSON.parse(req.body.toString());

    // Verify webhook authenticity
    if (!verifyCCBillWebhook(payload, signature)) {
      logger.warn('Invalid CCBill webhook signature', { payload });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { eventType, transactionId, subscriptionId, customField2, customField3 } = payload;

    logger.info('CCBill webhook received', {
      eventType,
      transactionId,
      subscriptionId
    });

    // Handle different event types
    switch (eventType) {
      case 'NewSaleSuccess':
        // Payment successful
        await handleNewSale(payload);
        break;

      case 'NewSaleFailure':
        // Payment failed
        await handleSaleFailure(payload);
        break;

      case 'Cancellation':
        // Card cancelled
        await handleCancellation(payload);
        break;

      case 'Chargeback':
        // Dispute/chargeback
        await handleChargeback(payload);
        break;

      case 'Refund':
        // Refund processed
        await handleRefund(payload);
        break;

      default:
        logger.warn('Unknown CCBill webhook event', { eventType });
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('CCBill webhook processing error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful sale
 */
const handleNewSale = async (payload) => {
  const { transactionId, subscriptionId, customField2: userId, customField3: cardId } = payload;

  // Update card with CCBill transaction details
  const card = await DiscreetCard.findOne({ cardId });

  if (card) {
    card.purchase.ccbill.transactionId = transactionId;
    card.purchase.ccbill.subscriptionId = subscriptionId;
    card.status = 'active';
    card.timestamps.activatedAt = new Date();

    await card.save();

    logger.info('DiscreetCard activated via CCBill webhook', {
      cardId,
      transactionId
    });
  }
};

/**
 * Handle sale failure
 */
const handleSaleFailure = async (payload) => {
  const { customField3: cardId, declineReason } = payload;

  const card = await DiscreetCard.findOne({ cardId });

  if (card) {
    card.status = 'cancelled';
    card.metadata.notes = `Payment failed: ${declineReason}`;
    await card.save();

    logger.warn('DiscreetCard purchase failed', {
      cardId,
      declineReason
    });
  }
};

/**
 * Handle chargeback
 */
const handleChargeback = async (payload) => {
  const { subscriptionId, chargebackAmount } = payload;

  const card = await DiscreetCard.findOne({ 'purchase.ccbill.subscriptionId': subscriptionId });

  if (card) {
    card.status = 'frozen';
    card.metadata.notes = `Chargeback filed: $${chargebackAmount}`;
    await card.save();

    logger.error('Chargeback filed on DiscreetCard', {
      cardId: card.cardId,
      subscriptionId,
      chargebackAmount
    });
  }
};

export default router;
```

---

## 6. Merchant Descriptor Strategy

### 6.1 Descriptor Rotation

CCBill allows dynamic descriptor selection per transaction:

**Grp Hldings Approved Descriptors**:
1. `GH COMMERCE` - Primary descriptor for gift cards
2. `GH DIGITAL SVC` - For digital services and reloads
3. `GH MEDIA SERVICES` - For subscriptions and recurring
4. `GH GIFT PURCHASE` - For one-time content purchases
5. `GH LIFESTYLE CARD` - Alternative generic descriptor

**Bank Statement Examples**:
```
VISA 4242 ************4242

11/06  GH COMMERCE         $52.50
11/08  GH DIGITAL SVC      $26.25
11/12  GH MEDIA SERVICES   $19.99
```

### 6.2 Regional Descriptor Optimization

CCBill supports region-specific descriptors:

| Region | Descriptor | Notes |
|--------|-----------|-------|
| **US** | GH COMMERCE | Most common |
| **EU** | GH DIGITAL SERVICES | SEPA compliance |
| **UK** | GH MEDIA LTD | UK-friendly format |
| **CA** | GH ENTERTAINMENT | Canadian compliance |
| **AU** | GH DIGITAL PTY | Australian format |

---

## 7. Security & Compliance

### 7.1 CCBill Security Features

1. **PCI-DSS Level 1 Certified** - Highest level of payment security
2. **3D Secure (3DS2)** - Additional fraud protection layer
3. **Tokenization** - Card data never touches FANZ servers
4. **AVS/CVV Checks** - Address and CVV verification
5. **Velocity Controls** - Fraud prevention via transaction limits

### 7.2 AML/KYC Integration

CCBill provides built-in AML/KYC tools:

**Basic KYC (Tier 1)**:
- Email verification
- CCBill's age verification

**Enhanced KYC (Tier 2)**:
- CCBill KYC service (name, DOB, address)
- ID document upload
- Selfie verification

**Full KYC (Tier 3)**:
- Enhanced due diligence
- Source of funds verification
- Ongoing monitoring

### 7.3 Chargeback Protection

CCBill's chargeback rate is <0.5% industry average:

1. **Proactive Alerts** - CCBill notifies of potential disputes
2. **Representment Tools** - Built-in dispute management
3. **Ethoca/Verifi Integration** - Early chargeback prevention
4. **Merchant Guarantee** - CCBill covers some chargebacks

---

## 8. Testing & Staging

### 8.1 CCBill Test Environment

**Test API URL**: `https://sandbox.ccbill.com/transactions/`

**Test Card Numbers**:
- **Approved**: 4473707989493598
- **Declined**: 4111111111111111
- **Chargeback Simulation**: 5454545454545454

**Test Merchant ID**: `900000`
**Test Sub-Account**: `0000`

### 8.2 Testing Workflow

1. Configure CCBill sandbox account
2. Create test FanzDiscreet cards using test cards
3. Verify descriptors in test receipts
4. Test webhook delivery to staging environment
5. Simulate reload, cancellation, chargeback scenarios
6. Validate compliance with Grp Hldings branding

---

## 9. Rollout Plan

### Phase 1: CCBill Integration (Weeks 1-2)
- Set up Grp Hldings merchant account with CCBill
- Configure sub-accounts for different descriptors
- Integrate CCBill Payment API
- Set up webhook handlers
- Test in sandbox environment

### Phase 2: DiscreetCard Implementation (Weeks 3-4)
- Build DiscreetCard model with CCBill fields
- Create purchase/reload API endpoints
- Implement FanzMoneyDash UI
- Integrate CCBill FlexForms
- Security audit

### Phase 3: Soft Launch (Week 5)
- Beta test with 100 users
- Monitor CCBill transaction success rates
- Validate merchant descriptors on real bank statements
- Gather user feedback

### Phase 4: Full Launch (Week 6+)
- Public release across all FANZ platforms
- Marketing campaign: "Complete Financial Privacy"
- Monitor chargeback rates
- Scale infrastructure

---

## 10. Cost Structure (CCBill Fees)

### 10.1 CCBill Pricing

**Standard Rates**:
- Processing Fee: 10.5% - 14.5% (negotiable based on volume)
- Transaction Fee: $0.15 per transaction
- Chargeback Fee: $25 per chargeback
- Refund Fee: $0.50 per refund

**Grp Hldings Negotiated Rates** (estimated):
- Processing Fee: 11.5% (mid-tier volume)
- Transaction Fee: $0.10
- Monthly Minimum: $500
- Setup Fee: $500 (one-time)

### 10.2 FanzDiscreet Fee Structure

**User-Facing Fees**:
- Purchase Fee: 4.9% + $0.50
- Reload Fee: 3.9% + $0.30
- Cancellation/Refund: Free (balance returned minus processing)

**Example**:
- User purchases $50 card
- CCBill charges: $50 × 0.115 + $0.10 = $5.85
- FANZ charges user: $50 × 0.049 + $0.50 = $2.95
- FANZ net loss: $2.90 per transaction (subsidized for user privacy)

**Alternative**: Pass full costs to user or absorb into subscription pricing.

---

## 11. Advantages Over Stripe

| Feature | CCBill | Stripe |
|---------|--------|--------|
| **Adult Industry Experience** | ✅ 25+ years | ❌ Bans adult content |
| **Discreet Descriptors** | ✅ Built-in | ❌ Manual, limited |
| **Chargeback Protection** | ✅ Industry-leading | ⚠️ Standard |
| **Compliance (18+)** | ✅ Native age gates | ❌ Manual implementation |
| **Stored Value API** | ✅ Yes | ❌ No native solution |
| **Multi-Descriptor Routing** | ✅ Yes | ❌ Complex setup |
| **Pricing** | ⚠️ Higher fees | ✅ Lower fees |
| **Integration Complexity** | ⚠️ Moderate | ✅ Simple |

**Verdict**: CCBill is the right choice for FanzDiscreet despite higher fees because of compliance, industry expertise, and built-in privacy features.

---

## 12. Future Enhancements

### V2.0 Features
- **Crypto-to-Discreete Gateway** - CCBill supports Bitcoin/USDT
- **Physical Privacy Cards** - CCBill can provision physical Mastercards
- **GH Rewards Program** - Cashback on FanzDiscreet purchases
- **Business Accounts** - Discreete payouts for creators and agencies
- **AI Privacy Engine** - Automated metadata masking

### Integration Opportunities
- Apple Pay / Google Pay via CCBill
- International currency support (CCBill handles 15+ currencies)
- Alternative payment methods (PayPal, bank transfer)
- White-label privacy cards for other adult platforms

---

## 13. Summary

**FanzDiscreet + CCBill = Industry-Leading Privacy Solution**

By leveraging CCBill's proven infrastructure under Grp Hldings LLC, FanzDiscreet provides:
- ✅ 100% discreet billing (no adult terms)
- ✅ PCI-compliant, secure transactions
- ✅ Multi-descriptor routing for flexibility
- ✅ Built-in compliance (AML/KYC/Age Verification)
- ✅ Low chargeback risk
- ✅ Seamless user experience across all FANZ platforms

**This is the world's first adult-friendly privacy fintech stack**, purpose-built for creator economy platforms with institutional-grade security and compliance.

---

**Next Steps**:
1. Finalize Grp Hldings merchant application with CCBill
2. Set up sub-accounts and descriptor mapping
3. Integrate CCBill Payment API into FanzFinance
4. Build and test FanzDiscreet UI in FanzMoneyDash
5. Soft launch with beta users
6. Full rollout with marketing campaign

---

**Document Version**: 2.0 (CCBill Integration)
**Last Updated**: 2025-11-06
**Contact**: engineering@fanz.network | compliance@fanz.network

---

*Confidential - Grp Hldings LLC / FANZ Network - Do Not Distribute*

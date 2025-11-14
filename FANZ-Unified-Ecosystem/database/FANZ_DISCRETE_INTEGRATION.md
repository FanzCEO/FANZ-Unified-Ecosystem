# FanzDiscreete - Discreet Payment Privacy Integration

Complete database schema and integration guide for FanzDiscreete, the privacy-focused payment system powered by CCBill under Grp Hldings (FANZ Group Holdings).

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Key Features](#key-features)
4. [CCBill Integration](#ccbill-integration)
5. [API Integration](#api-integration)
6. [Privacy & Security](#privacy--security)
7. [Usage Examples](#usage-examples)
8. [Admin Dashboard](#admin-dashboard)

---

## Overview

**FanzDiscreete** is a financial privacy feature that allows users to purchase prepaid balances with neutral billing descriptors, keeping all adult or creator-related transactions 100% discreet.

### Core Objectives

- ✅ **Privacy First**: No mention of Fanz, adult, or NSFW content on any billing record
- ✅ **CCBill Powered**: Leverages CCBill's robust payment infrastructure
- ✅ **Grp Hldings Branded**: All descriptors appear under "Grp Hldings" umbrella
- ✅ **Multi-Platform**: Works across all 94 FANZ platforms
- ✅ **Vault Mode**: Optional biometric-protected transaction hiding

### System Flow

```
User → FanzMoneyDash → CCBill (Grp Hldings Descriptor) → FanzDiscreete Card → Internal Spending
```

1. User purchases FanzDiscreete card via FanzMoneyDash
2. Payment processed by CCBill using neutral descriptor (e.g., "GH Commerce")
3. Balance loaded into user's FanzDiscreete virtual card
4. User spends privately across BoyFanz / GirlFanz / PupFanz
5. All spending is internal - never appears on external billing

---

## Database Schema

### Schema: `discrete`

The FanzDiscreete system is implemented in a dedicated PostgreSQL schema with 9 core tables:

#### 1. CCBill Merchant Configuration

```sql
discrete.ccbill_merchants
```

**Purpose**: Configure CCBill merchant accounts with neutral billing descriptors

**Key Columns**:
- `merchant_id` - Unique merchant identifier
- `merchant_descriptor` - Neutral descriptor (e.g., "GH Commerce", "GH Digital Services")
- `merchant_type` - Transaction type (gift_card, balance_reload, subscription, ppv)
- `ccbill_account_number` - CCBill account number
- `parent_entity` - Always "Grp Hldings LLC"
- `flexforms_id` - CCBill FlexForms integration ID

**Descriptor Examples**:
| Transaction Type | Descriptor | CCBill Merchant ID |
|-----------------|------------|-------------------|
| Gift Card Load | "GH Commerce" | 1234567 |
| Balance Reload | "GH Digital Services" | 1234568 |
| Subscription | "GH Gift Purchase" | 1234569 |

#### 2. FanzDiscreete Virtual Cards

```sql
discrete.discrete_cards
```

**Purpose**: Virtual prepaid cards for discreet spending

**Key Columns**:
- `card_id` - Unique card identifier
- `user_id` - Card owner
- `card_number` - Virtual card number (last 4 digits visible)
- `balance_cents` - Total balance in cents
- `available_balance_cents` - Spendable balance
- `daily_spend_limit_cents` - Daily spending limit ($1,000 default)
- `monthly_spend_limit_cents` - Monthly limit ($5,000 default)
- `vault_mode_enabled` - Hide from normal view (requires biometric/PIN)
- `biometric_required` - Require biometric auth for access
- `ccbill_subscription_id` - For recurring auto-reload

**Card Types**:
- `prepaid` - One-time load
- `reloadable` - Can be refilled
- `gift` - Gift card that can be sent to others

#### 3. Card Load Transactions

```sql
discrete.card_loads
```

**Purpose**: Track all card funding transactions via CCBill

**Key Columns**:
- `load_id` - Transaction identifier
- `card_id` - Card being loaded
- `amount_cents` - Load amount
- `ccbill_transaction_id` - CCBill reference
- `merchant_descriptor` - Actual descriptor on credit card statement
- `payment_method` - credit_card, debit_card, crypto, bank_transfer
- `payment_last_four` - Last 4 digits of payment method
- `status` - pending, processing, completed, failed, refunded, chargebacked

**Status Flow**:
```
pending → processing → completed
                    ↓
                  failed
```

#### 4. Card Spend Transactions

```sql
discrete.card_spends
```

**Purpose**: Track internal spending using FanzDiscreete cards

**Key Columns**:
- `spend_id` - Transaction identifier
- `card_id` - Card used for payment
- `amount_cents` - Spend amount
- `purchase_type` - subscription, tip, ppv_photo, ppv_video, custom_content, etc.
- `creator_id` - Creator being paid (if applicable)
- `ledger_transaction_id` - Links to main ledger system
- `is_anonymous` - Whether purchase is anonymous

**Important**: All spending is internal and NEVER appears on external billing statements.

#### 5. Discreet Billing Descriptors

```sql
discrete.descriptor_templates
```

**Purpose**: Manage neutral billing descriptor templates

**Key Columns**:
- `descriptor_text` - The actual text (e.g., "GH Commerce")
- `descriptor_category` - digital_goods, entertainment, lifestyle
- `applicable_transaction_types` - Which transactions can use this
- `min_amount_cents` / `max_amount_cents` - Amount-based rules
- `applicable_countries` - Regional restrictions

**Descriptor Categories**:
- `digital_goods` - Generic digital purchase
- `entertainment` - Entertainment services
- `lifestyle` - Lifestyle products

#### 6. Gift Cards

```sql
discrete.gift_cards
```

**Purpose**: FanzDiscreete gift cards that can be sent anonymously

**Key Columns**:
- `gift_card_id` - Unique gift card ID
- `card_code` - Redeemable code
- `card_pin` - Optional security PIN
- `initial_value_cents` - Starting value
- `remaining_value_cents` - Current value
- `purchased_by_user_id` - Purchaser (can be NULL for anonymous)
- `recipient_email` - Recipient email address
- `gift_message` - Personal message
- `converted_to_card_id` - Card created after redemption

**Gift Card Flow**:
```
Purchase → Send (email/code) → Redeem → Convert to FanzDiscreete Card
```

#### 7. Vault Access Log

```sql
discrete.vault_access_log
```

**Purpose**: Audit log for vault mode access and authentication

**Key Columns**:
- `access_type` - view, transaction, reload, settings
- `access_granted` - TRUE if auth succeeded
- `auth_method` - pin, biometric, password, failed
- `ip_address` - Access IP
- `device_id` - Device fingerprint

**Security**: Immutable audit trail for vault mode access.

#### 8. Crypto Integration (Future)

```sql
discrete.crypto_loads
```

**Purpose**: Load FanzDiscreete cards via cryptocurrency

**Key Columns**:
- `cryptocurrency` - BTC, ETH, USDT, USDC
- `crypto_amount` - Amount in crypto
- `crypto_address` - Wallet address
- `blockchain_tx_hash` - Blockchain transaction hash
- `usd_amount_cents` - Converted USD amount
- `exchange_rate` - Conversion rate used
- `confirmations` - Blockchain confirmations received

**Status Flow**:
```
pending → confirming → confirmed → completed
```

---

## Key Features

### 1. Privacy-First Design

- **No Adult References**: Zero mention of Fanz, adult, NSFW anywhere on billing
- **Neutral Descriptors**: All charges appear as "GH Commerce" or similar
- **Anonymous Spending**: Internal transactions never create external billing records
- **Vault Mode**: Hide transactions behind biometric/PIN lock

### 2. Flexible Card Types

- **Prepaid Cards**: One-time use balances
- **Reloadable Cards**: Auto-reload subscriptions
- **Gift Cards**: Send FanzDiscreete cards to others anonymously

### 3. Spending Controls

- **Balance Limits**: Default $5,000 max balance
- **Daily Limits**: $1,000 daily spending limit
- **Monthly Limits**: $5,000 monthly limit
- **Automatic Resets**: Limits reset daily/monthly via cron

### 4. Multi-Platform Support

- Works across all 94 FANZ platforms
- Unified balance across BoyFanz, GirlFanz, PupFanz, etc.
- Platform-specific spending tracking

### 5. Vault Mode

- **Biometric Lock**: Require Face ID / Touch ID to access
- **PIN Protection**: Optional PIN code
- **Hidden Transactions**: Don't appear in normal transaction history
- **Access Logging**: Complete audit trail of vault access attempts

---

## CCBill Integration

### Merchant Account Setup

1. **Parent Entity**: Grp Hldings LLC
2. **Sub-Accounts**: Multiple CCBill merchant IDs for different transaction types
3. **FlexForms**: Custom checkout experience branded for FanzMoneyDash

### Descriptor Mapping

CCBill supports dynamic descriptor switching based on transaction type:

```typescript
const descriptorMap = {
  gift_card_load: "GH Commerce",
  balance_reload: "GH Digital Services",
  subscription: "GH Gift Purchase",
  ppv: "GH Lifestyle Services"
};
```

### FlexForms Integration

CCBill FlexForms provide:
- Custom branded checkout
- PCI-DSS compliance
- Tokenized payment storage
- Subscription management
- Chargeback protection

### API Endpoints

**Load Card via CCBill**:
```http
POST /api/discrete/load
Content-Type: application/json

{
  "card_id": "uuid",
  "amount_cents": 10000,
  "payment_method": {
    "type": "credit_card",
    "ccbill_token": "token_abc123"
  },
  "merchant_id": "1234567"
}
```

**Response**:
```json
{
  "load_id": "uuid",
  "ccbill_transaction_id": "tx_xyz789",
  "merchant_descriptor": "GH Commerce",
  "status": "processing",
  "amount_cents": 10000,
  "net_amount_cents": 9700
}
```

---

## API Integration

### 1. Create FanzDiscreete Card

```typescript
import { db, dbHelpers } from './lib/db';

async function createDiscreteCard(userId: string) {
  // Generate virtual card number
  const cardNumber = `FANZ${generateRandomDigits(16)}`;

  const card = await dbHelpers.insert('discrete.discrete_cards', {
    user_id: userId,
    card_number: cardNumber,
    card_display_name: 'FanzDiscreete Card',
    card_type: 'reloadable',
    balance_cents: 0,
    available_balance_cents: 0,
    status: 'active',
    max_balance_cents: 500000, // $5,000
    daily_spend_limit_cents: 100000, // $1,000
    monthly_spend_limit_cents: 500000, // $5,000
    vault_mode_enabled: false,
    tenant_id: process.env.TENANT_ID,
    platform_id: process.env.PLATFORM_ID
  });

  return card;
}
```

### 2. Load Card via CCBill

```typescript
async function loadCardViaCCBill(
  cardId: string,
  amountCents: number,
  ccbillToken: string
) {
  return await db.transaction(async (client) => {
    // 1. Create load transaction
    const load = await client.query(`
      INSERT INTO discrete.card_loads (
        card_id, user_id, amount_cents, currency,
        payment_method, ccbill_transaction_id,
        merchant_id, merchant_descriptor,
        status, tenant_id, platform_id
      )
      SELECT
        $1, c.user_id, $2, 'USD',
        'credit_card', $3,
        'GH_COMMERCE_001', 'GH Commerce',
        'processing', c.tenant_id, c.platform_id
      FROM discrete.discrete_cards c
      WHERE c.card_id = $1
      RETURNING *
    `, [cardId, amountCents, ccbillToken]);

    // 2. Process CCBill payment (external API call)
    const ccbillResult = await processCCBillPayment({
      amount: amountCents,
      token: ccbillToken,
      descriptor: 'GH Commerce'
    });

    // 3. Update load status
    await client.query(`
      UPDATE discrete.card_loads
      SET
        status = $1,
        ccbill_transaction_id = $2,
        completed_at = NOW()
      WHERE load_id = $3
    `, [ccbillResult.status, ccbillResult.transactionId, load.rows[0].load_id]);

    // 4. Balance automatically updated by trigger

    return load.rows[0];
  });
}
```

### 3. Spend with FanzDiscreete Card

```typescript
async function spendWithDiscreteCard(
  cardId: string,
  amountCents: number,
  purchaseType: string,
  creatorId?: string
) {
  return await db.transaction(async (client) => {
    // 1. Check available balance
    const card = await client.query(
      'SELECT available_balance_cents FROM discrete.discrete_cards WHERE card_id = $1',
      [cardId]
    );

    if (card.rows[0].available_balance_cents < amountCents) {
      throw new Error('Insufficient balance');
    }

    // 2. Create spend transaction
    const spend = await client.query(`
      INSERT INTO discrete.card_spends (
        card_id, user_id, amount_cents, purchase_type,
        creator_id, status, tenant_id, platform_id
      )
      SELECT
        $1, c.user_id, $2, $3, $4,
        'authorized', c.tenant_id, c.platform_id
      FROM discrete.discrete_cards c
      WHERE c.card_id = $1
      RETURNING *
    `, [cardId, amountCents, purchaseType, creatorId]);

    // 3. Create ledger transaction
    const ledgerTx = await client.query(`
      INSERT INTO ledger.transactions (
        from_account_id, to_account_id, amount,
        type, status, platform_id, tenant_id
      )
      SELECT
        (SELECT account_id FROM ledger.accounts WHERE user_id = $1),
        (SELECT account_id FROM ledger.accounts WHERE user_id = $2),
        $3, $4, 'completed', $5, $6
      RETURNING transaction_id
    `, [spend.rows[0].user_id, creatorId, amountCents, purchaseType, process.env.PLATFORM_ID, process.env.TENANT_ID]);

    // 4. Link to ledger
    await client.query(`
      UPDATE discrete.card_spends
      SET
        ledger_transaction_id = $1,
        status = 'completed',
        completed_at = NOW()
      WHERE spend_id = $2
    `, [ledgerTx.rows[0].transaction_id, spend.rows[0].spend_id]);

    return spend.rows[0];
  });
}
```

### 4. Create Gift Card

```typescript
async function createGiftCard(
  purchaserUserId: string,
  amountCents: number,
  recipientEmail: string,
  giftMessage: string
) {
  // Generate unique code
  const cardCode = generateGiftCardCode(); // e.g., "FANZ-1234-5678-9ABC"
  const cardPin = generateRandomPin(); // 6-digit PIN

  const giftCard = await dbHelpers.insert('discrete.gift_cards', {
    card_code: cardCode,
    card_pin: cardPin,
    initial_value_cents: amountCents,
    remaining_value_cents: amountCents,
    currency: 'USD',
    purchased_by_user_id: purchaserUserId,
    recipient_email: recipientEmail,
    gift_message: giftMessage,
    status: 'pending',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    tenant_id: process.env.TENANT_ID,
    platform_id: process.env.PLATFORM_ID
  });

  // Send email to recipient
  await sendGiftCardEmail(recipientEmail, cardCode, cardPin, giftMessage);

  return giftCard;
}
```

---

## Privacy & Security

### PCI-DSS Compliance

- All payment processing handled by CCBill (PCI Level 1 compliant)
- Card data never stored in FANZ database
- Tokenized payment storage only
- Encrypted sensitive fields (pgcrypto)

### Descriptor Privacy

- **External Billing**: Only neutral descriptors ("GH Commerce")
- **Internal Ledger**: Full transaction details tracked internally
- **Audit Trail**: Complete history for compliance
- **User View**: Users see discreet descriptors only

### Vault Mode Security

- **Biometric Auth**: Face ID / Touch ID required
- **PIN Protection**: Secondary PIN code option
- **Access Logging**: Every vault access attempt logged
- **Hidden Transactions**: Not visible in normal history

### Data Protection

- **Encryption**: Sensitive fields encrypted with pgcrypto
- **Multi-Tenancy**: Tenant isolation via RLS policies
- **Audit Logs**: Immutable WORM audit trail
- **GDPR Ready**: Data deletion and export support

---

## Usage Examples

### User Flow: Buy FanzDiscreete Card

1. **User clicks "Buy FanzDiscreete Card" in FanzMoneyDash**
2. **Select amount**: $50, $100, $200, $500, Custom
3. **CCBill checkout**: FlexForms branded checkout
4. **Descriptor shown**: "GH Commerce" or "GH Digital Services"
5. **Payment processed**: CCBill handles payment
6. **Balance loaded**: FanzDiscreete card credited
7. **Ready to spend**: Use across all FANZ platforms

### User Flow: Enable Vault Mode

1. **Go to card settings**
2. **Toggle "Vault Mode"**
3. **Set up biometric** or PIN
4. **All transactions hidden** from normal view
5. **Access via biometric** to see vault transactions

### User Flow: Send Gift Card

1. **Select "Send FanzDiscreete Gift"**
2. **Choose amount and add message**
3. **Enter recipient email**
4. **Purchase via CCBill** ("GH Commerce")
5. **Recipient receives email** with code and PIN
6. **Redeems to FanzDiscreete card**

---

## Admin Dashboard

### Merchant Management

```sql
-- View all CCBill merchants
SELECT
  merchant_id,
  merchant_name,
  merchant_descriptor,
  merchant_type,
  ccbill_account_number,
  is_active
FROM discrete.ccbill_merchants
WHERE tenant_id = $1
ORDER BY merchant_type;
```

### Card Analytics

```sql
-- Active cards summary
SELECT
  status,
  COUNT(*) as card_count,
  SUM(balance_cents) / 100 as total_balance_usd,
  SUM(available_balance_cents) / 100 as available_balance_usd
FROM discrete.discrete_cards
WHERE tenant_id = $1
GROUP BY status;
```

### Transaction Volume

```sql
-- Load transaction volume
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount_cents) / 100 as total_volume_usd,
  SUM(net_amount_cents) / 100 as net_volume_usd
FROM discrete.card_loads
WHERE
  tenant_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Spending Analytics

```sql
-- Spending by purchase type
SELECT
  purchase_type,
  COUNT(*) as transaction_count,
  SUM(amount_cents) / 100 as total_spent_usd
FROM discrete.card_spends
WHERE
  tenant_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY purchase_type
ORDER BY total_spent_usd DESC;
```

---

## Maintenance & Monitoring

### Daily Cron Jobs

```sql
-- Reset daily spending limits (run daily at midnight)
SELECT discrete.reset_spending_limits();

-- Expire old gift cards
UPDATE discrete.gift_cards
SET status = 'expired'
WHERE
  expires_at < NOW()
  AND status NOT IN ('redeemed', 'expired', 'cancelled');
```

### Health Checks

```typescript
async function checkDiscreteSystemHealth() {
  const checks = {
    activeCards: await db.queryOne('SELECT COUNT(*) FROM discrete.discrete_cards WHERE status = $1', ['active']),
    pendingLoads: await db.queryOne('SELECT COUNT(*) FROM discrete.card_loads WHERE status = $1', ['processing']),
    vaultCards: await db.queryOne('SELECT COUNT(*) FROM discrete.discrete_cards WHERE vault_mode_enabled = TRUE'),
  };

  return {
    healthy: checks.pendingLoads.count < 100,
    metrics: checks
  };
}
```

---

## Future Enhancements

### Phase 2: Crypto Integration

- Load FanzDiscreete cards with BTC, ETH, USDT, USDC
- Integrate CCBill crypto gateway
- Real-time exchange rate conversion
- Blockchain confirmation tracking

### Phase 3: Business Accounts

- FanzDiscreete for creators to pay assistants, editors
- Multi-user business accounts
- Expense categorization
- Tax reporting integration

### Phase 4: Rewards Program

- GH Rewards Card for loyalty
- Cashback on FanzDiscreete spending
- Referral bonuses
- Creator partner cards

---

## Support & Documentation

- **Database Schema**: `database/schemas/13_fanz_discrete.sql`
- **API Examples**: `database/examples/discrete-integration-example.ts`
- **CCBill Docs**: https://ccbill.com/doc/ccbill-restful-transaction-api
- **Environment Vars**: See `.env.database` template in each platform

---

**FanzDiscreete**: The world's first adult-friendly privacy fintech stack. Stable, compliant, and bulletproof.

**Powered by**: CCBill + Grp Hldings + FANZ Unlimited Network

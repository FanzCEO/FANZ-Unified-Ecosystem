# FANZ Unified Ecosystem - Complete Payment Systems Audit

**Generated:** 2025-11-08
**Scope:** All 94 platforms, dashboards, services, and payment infrastructure
**Total Payment Touchpoints:** 200+ across the ecosystem

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Payment Processors Inventory](#payment-processors-inventory)
3. [Payment Routes & API Endpoints](#payment-routes--api-endpoints)
4. [Database Schema](#database-schema)
5. [Configuration Files](#configuration-files)
6. [Payment Flows](#payment-flows)
7. [Platform Distribution](#platform-distribution)
8. [Security & Compliance](#security--compliance)

---

## Executive Summary

### Payment Ecosystem Scale
- **Total Payment Processors:** 20+
- **Card Processors (Adult-Friendly):** 10
- **Cryptocurrency Processors:** 4
- **Payout Providers:** 5+
- **Digital Wallets:** 3
- **API Endpoints:** 70+
- **Database Tables:** 27
- **Supported Currencies:** 20+ (Fiat + Crypto)
- **Platforms Configured:** 94

### Key Features
- ✅ Full escrow system with dispute resolution
- ✅ Custom content request payments with protection
- ✅ Automated creator payouts
- ✅ Discreet billing (zero brand mentions)
- ✅ Multi-currency support
- ✅ Cryptocurrency payments
- ✅ Real-time webhook processing
- ✅ Fraud detection & chargeback protection
- ✅ PCI DSS compliant infrastructure
- ✅ Tax compliance (W9, 1099-K, VAT)

---

## Payment Processors Inventory

### 1. Adult-Friendly Card Processors

| # | Processor | Priority | Fee | Min-Max | Settlement | File Location | Status |
|---|-----------|----------|-----|---------|------------|---------------|--------|
| 1 | **CCBill** | 1 | 10.9% + $0 | $2.95-$10k | 7-14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:52` | ✅ Active |
| 2 | **Segpay** | 2 | 11.5% + $0 | $5-$15k | 14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:92` | ✅ Active |
| 3 | **Epoch** | 3 | 12% + $0 | $5-$5k | 7-21 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:132` | ✅ Active |
| 4 | **Vendo** | 4 | 9.9% + $0 | $3-$20k | 7 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:172` | ✅ Active |
| 5 | **Verotel** | 5 | 11% + $0 | $5-$10k | 14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:212` | ✅ Active |
| 6 | **RocketGate** | 6 | 10% + $0 | $5-$15k | 7-14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:252` | ✅ Active |
| 7 | **NetBilling** | 7 | 12% + $0 | $5-$10k | 14-21 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:292` | ✅ Active |
| 8 | **CommerceGate** | 8 | 11.5% + $0 | $5-$8k | 14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:332` | ✅ Active |
| 9 | **CentroBill** | 9 | 10.5% + $0 | $5-$10k | 7-14 days | `fanzdash/server/payments/AdultPaymentProcessors.ts:372` | ✅ Active |
| 10 | **Payze** | 10 | 3.5% + €0.30 | €1-€50k | Instant | `fanzdash/server/payments/AdultPaymentProcessors.ts:412` | ✅ Active |

**Supported Regions:** US, CA, EU, UK, AU, LATAM, ASIA, CIS, GLOBAL

**Features:**
- Recurring billing support
- 3D Secure authentication
- Chargeback protection
- Multi-currency processing
- Escrow compatibility
- Discreet billing descriptors

### 2. Cryptocurrency Processors

| # | Processor | Priority | Fee | Coins Supported | Settlement | File Location | Status |
|---|-----------|----------|-----|-----------------|------------|---------------|--------|
| 11 | **Coinbase Commerce** | 11 | 1% | BTC, ETH, USDC, USDT, DAI, LTC, BCH | 10-60 min | `fanzdash/server/payments/AdultPaymentProcessors.ts:454` | ✅ Active |
| 12 | **NOWPayments** | 12 | 0.5% | 50+ cryptocurrencies | 10-30 min | `fanzdash/server/payments/AdultPaymentProcessors.ts:492` | ✅ Active |
| 13 | **CoinPayments** | 13 | 0.5% | BTC, ETH, LTC, DASH, DOGE, BCH, XMR, ZEC | 10-60 min | `fanzdash/server/payments/AdultPaymentProcessors.ts:530` | ✅ Active |
| 14 | **BTCPay Server** | 14 | 0% | BTC, LTC, DASH, BCH, XMR | 10-60 min | `fanzdash/server/payments/AdultPaymentProcessors.ts:568` | ✅ Active |

**Supported Cryptocurrencies (Total: 50+):**
- **Major:** BTC, ETH, USDC, USDT, DAI, LTC, BCH
- **Privacy:** XMR (Monero), ZEC (Zcash), DASH
- **Altcoins:** BNB, SOL, ADA, XRP, DOGE, TRX, DOT, MATIC, AVAX

**Features:**
- No chargebacks
- Global acceptance
- No KYC requirements (most)
- Instant settlement options
- Anonymous payment capability

### 3. Payout Providers (Creator Withdrawals)

| # | Provider | Type | Fee | Min-Max | Settlement | KYC | File Location | Status |
|---|----------|------|-----|---------|------------|-----|---------------|--------|
| 15 | **Paxum** | Wallet | 2% + $1 | $50-$100k | 1-2 days | ✅ Yes | `fanzdash/server/payments/AdultPaymentProcessors.ts:608` | ✅ Active |
| 16 | **ePayService** | Wallet | 1.5% + $0.50 | $10-$50k | 24 hours | ✅ Yes | `fanzdash/server/payments/AdultPaymentProcessors.ts:646` | ✅ Active |
| 17 | **Cosmo Payment** | Wallet | 2.5% + $1 | $50-$50k | 1-3 days | ✅ Yes | `fanzdash/server/payments/AdultPaymentProcessors.ts:684` | ✅ Active |
| 18 | **Wise (TransferWise)** | Bank | 0.5% + $0.50 | $1-$1M | 1-2 days | ✅ Yes | `fanzdash/server/payments/AdultPaymentProcessors.ts:722` | ⚠️ Testing |
| 19 | **Payoneer** | Wallet | 3% | $50-$100k | 2-3 days | ✅ Yes | `fanzdash/server/payments/AdultPaymentProcessors.ts:760` | ⚠️ Testing |

**Additional Payout Methods:**
- Direct cryptocurrency (0% fee)
- ACH (US bank transfers)
- SEPA (EU bank transfers)
- Wire transfers
- Paper checks

### 4. Digital Wallets (Adult-Friendly)

| # | Processor | Fee | Regions | File Location | Status |
|---|-----------|-----|---------|---------------|--------|
| 20 | **Skrill** | 1.9% | Global | `fanzmoneydash/src/services/paymentProcessors.ts:393` | ✅ Active |
| 21 | **NETELLER** | 2.5% | Global | `fanzmoneydash/src/services/paymentProcessors.ts:424` | ✅ Active |
| 22 | **Cash App** | 2.75% | US only | `fanzmoneydash/src/services/paymentProcessors.ts:581` | ✅ Active |

### 5. Mainstream Processors (BANNED for Adult Content)

| Processor | Status | Reason | File Location |
|-----------|--------|--------|---------------|
| **Stripe** | ❌ Disabled | Adult content policy violation | `fanzmoneydash/src/services/paymentProcessors.ts:234` |
| **PayPal** | ❌ Disabled | Adult content restrictions | `fanzmoneydash/src/services/paymentProcessors.ts:265` |
| **Square** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:296` |
| **Apple Pay** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:488` |
| **Google Pay** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:519` |
| **Venmo** | ❌ Disabled | Adult content restrictions | `fanzmoneydash/src/services/paymentProcessors.ts:550` |
| **Amazon Pay** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:676` |
| **Alipay** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:614` |
| **WeChat Pay** | ❌ Disabled | Adult content policy | `fanzmoneydash/src/services/paymentProcessors.ts:645` |

---

## Payment Routes & API Endpoints

### 1. Core Payment Processing API
**File:** `fanzdash/server/routes/payments.ts`

| Method | Endpoint | Purpose | Authentication |
|--------|----------|---------|----------------|
| POST | `/api/payment/process` | Process payment via selected gateway | API Key |
| GET | `/api/payment/gateways` | List available payment processors | API Key |
| GET | `/api/payment/payout-methods` | Get creator payout options | API Key |
| POST | `/api/payment/payout` | Execute creator payout | API Key |
| GET | `/api/payment/transaction/:id` | Check transaction status | API Key |
| PUT | `/api/payment/routing/:ruleId` | Manage payment routing rules | Admin Key |
| POST | `/api/payment/mid/:midId/:action` | Control Merchant IDs | Admin Key |
| GET | `/api/payment/health` | Payment system health check | Public |
| POST | `/api/payment/webhook/:gatewayId` | Receive processor webhooks | Signature |
| GET | `/api/payment/events` | Real-time SSE payment events | API Key |

### 2. Payment Administration & Configuration API
**File:** `fanzdash/server/routes/paymentAdmin.ts`

#### Processor Management (9 endpoints)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/payment-admin/processors` | List all payment processors |
| GET | `/api/payment-admin/processors/:id` | Get specific processor details |
| GET | `/api/payment-admin/processors/type/:type` | Filter by type (card/crypto/wallet/bank) |
| GET | `/api/payment-admin/processors/region/:region` | Filter by region |
| GET | `/api/payment-admin/crypto-processors` | Get crypto processors only |
| GET | `/api/payment-admin/payout-providers` | Get payout providers only |
| GET | `/api/payment-admin/currencies` | List supported currencies |
| POST | `/api/payment-admin/best-processor` | Find optimal processor for transaction |
| GET | `/api/payment-admin/overview` | Complete system overview |

#### Escrow Management (10 endpoints)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/payment-admin/escrow/stats` | Escrow system statistics |
| GET | `/api/payment-admin/escrow/account/:userId` | User escrow balance |
| GET | `/api/payment-admin/escrow/pending/:userId` | Pending escrow transactions |
| GET | `/api/payment-admin/escrow/history/:userId` | Escrow transaction history |
| POST | `/api/payment-admin/escrow/hold` | Hold funds in escrow |
| POST | `/api/payment-admin/escrow/release/:transactionId` | Release escrowed funds |
| POST | `/api/payment-admin/escrow/refund/:transactionId` | Refund escrowed amount |
| POST | `/api/payment-admin/escrow/dispute` | Create dispute |
| POST | `/api/payment-admin/escrow/resolve-dispute/:disputeId` | Resolve dispute |
| GET | `/api/payment-admin/escrow/processors` | Escrow-capable processors |

### 3. Custom Content Request Payments API
**File:** `fanzdash/server/routes/customContentRequests.ts`

| Method | Endpoint | Purpose | Escrow |
|--------|----------|---------|--------|
| POST | `/api/custom-content/request` | Create custom content request with payment | ✅ Yes |
| POST | `/api/custom-content/creator-respond/:requestId` | Creator accept/counter/reject | ✅ Held |
| POST | `/api/custom-content/fan-respond/:requestId` | Fan counter-offer response | ✅ Update |
| POST | `/api/custom-content/sign-agreement/:requestId` | Sign no-chargeback agreement | ✅ Required |
| POST | `/api/custom-content/accept-terms/:requestId` | Accept payment terms | ✅ Lock |
| POST | `/api/custom-content/process-payment/:requestId` | Process payment to escrow | ✅ Hold |
| POST | `/api/custom-content/deliver/:requestId` | Deliver content | ✅ Pending |
| POST | `/api/custom-content/review/:requestId` | Review/approve (triggers release) | ✅ Release |
| GET | `/api/custom-content/request/:requestId` | Get request details | - |
| GET | `/api/custom-content/user/:userId/:role` | Get user requests | - |

### 4. Creator Payout System API
**File:** `fanzdash/server/routes/payouts.ts`

#### Creator Management (12 endpoints)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/payouts/creators/register` | Register new creator |
| GET | `/api/payouts/creators/:creatorId` | Creator profile |
| GET | `/api/payouts/creators/user/:userId` | Get by user ID |
| POST | `/api/payouts/creators/:creatorId/payout-methods` | Add payout method |
| POST | `/api/payouts/revenue/record` | Record revenue |
| GET | `/api/payouts/creators/:creatorId/earnings` | Creator earnings |
| POST | `/api/payouts/request` | Request payout |
| GET | `/api/payouts/request/:payoutId` | Payout status |
| GET | `/api/payouts/creators/:creatorId/history` | Payout history |
| GET | `/api/payouts/methods` | Supported payout methods |
| GET | `/api/payouts/admin/stats` | System statistics |
| POST | `/api/payouts/admin/batch` | Batch payouts |

#### Payout Automation (8 endpoints)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/payouts/automation/stats` | Automation statistics |
| POST | `/api/payouts/automation/revenue` | Record revenue with auto-evaluation |
| POST | `/api/payouts/automation/payout-methods` | Add automated payout method |
| POST | `/api/payouts/automation/payout-request` | Create automated payout |
| GET | `/api/payouts/automation/ledger/:creatorId` | Creator ledger |
| GET | `/api/payouts/automation/payout-requests/:creatorId` | Payout requests |
| GET | `/api/payouts/automation/batches` | Payout batches |
| POST | `/api/payouts/automation/control/:action` | Start/stop automation |

### 5. FanzDiscreet Privacy Card API
**File:** `fanzmoneydash/src/routes/discreet.js`

| Method | Endpoint | Purpose | CCBill |
|--------|----------|---------|--------|
| POST | `/api/discreet/purchase` | Purchase privacy card ($10-$500) | ✅ Yes |
| GET | `/api/discreet/cards` | List user's cards | - |
| GET | `/api/discreet/cards/:cardId` | Card details | - |
| POST | `/api/discreet/cards/:cardId/reload` | Reload card | ✅ Yes |
| DELETE | `/api/discreet/cards/:cardId` | Deactivate card | - |
| GET | `/api/discreet/cards/:cardId/usage` | Usage summary | - |

**Features:**
- Discreet billing (GH Holdings LLC)
- No Fanz branding on statements
- Fraud detection with risk scoring
- KYC verification for $100+
- Multi-currency support

### 6. Webhook Handlers

#### FanzDiscreet CCBill Webhooks
**File:** `fanzmoneydash/src/routes/discreetWebhooks.js`
- `POST /api/discreet/webhooks/ccbill` - Handles: NewSaleSuccess, NewSaleFailure, Renewal, Cancellation, Chargeback, Refund, Expiration

#### FanzCard Platform Webhooks
**Files:** Deployed across all 13 platforms
**Example:** `bearfanz/server/routes/fanzCardWebhooks.ts`
- `POST /api/fanz-card-webhooks/authorize` - Authorize transactions
- `POST /api/fanz-card-webhooks/settle` - Settle transactions

---

## Database Schema

### Payment-Related Database Tables (27 Total)

#### 1. Ledger Schema (6 tables)

**`ledger.transactions`**
- Purpose: All financial transactions
- Key Fields: `transaction_id`, `user_id`, `platform_id`, `type` (subscription, tip, ppv, custom_content, product_purchase, payout, refund, chargeback), `amount`, `currency`, `processor`, `status`, `escrow_status`
- Location: `database/schemas/ledger_schema.sql`

**`ledger.accounts`**
- Purpose: User financial accounts
- Key Fields: `account_id`, `user_id`, `account_type` (fan, creator, affiliate, platform, escrow), `balance`, `currency`
- Features: Multi-currency support, escrow separation

**`ledger.balances`**
- Purpose: Real-time balance tracking
- Key Fields: `balance_id`, `account_id`, `available`, `pending`, `held`, `currency`
- Features: Atomic balance updates

**`ledger.payouts`**
- Purpose: Creator payout requests
- Key Fields: `payout_id`, `creator_id`, `amount`, `method` (paxum, epayservice, wise, crypto, ach, sepa), `status`, `processor_transaction_id`
- Features: Automated payout processing

**`ledger.revshare_rules`**
- Purpose: Revenue sharing configuration
- Key Fields: `rule_id`, `platform_id`, `creator_percentage`, `platform_percentage`, `affiliate_percentage`
- Features: Per-platform customization

**`tax.*` (3 tables)**
- `tax.tax_forms` - W9, 1099-K, VAT forms
- `tax.withholding` - Tax withholding records
- `tax.tax_payments` - Tax payment history

#### 2. CRM Schema (7 tables)

**`fans.subscriptions`**
- Purpose: Recurring subscription billing
- Key Fields: `subscription_id`, `fan_id`, `creator_id`, `tier_id`, `billing_cycle` (monthly, quarterly, annual), `next_billing_date`, `status`, `processor`
- Features: Automatic renewal, grace periods

**`fans.tips`**
- Purpose: One-time fan tips
- Key Fields: `tip_id`, `fan_id`, `creator_id`, `amount`, `processor`, `transaction_id`

**`creators.subscription_tiers`**
- Purpose: Creator pricing tiers
- Key Fields: `tier_id`, `creator_id`, `tier_name` (basic, premium, elite), `price`, `currency`, `billing_cycle`

#### 3. Commerce Schema (6 tables)

**`orders.orders`**
- Purpose: Product and bundle purchases
- Key Fields: `order_id`, `user_id`, `total_amount`, `processor`, `payment_status`, `escrow_status`
- Features: Multi-item orders, tax calculation

**`orders.order_items`**
- Purpose: Line items in orders
- Key Fields: `item_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`

**`products.products`**
- Purpose: Digital and physical products
- Key Fields: `product_id`, `creator_id`, `price`, `type` (digital, physical, bundle)

**`products.bundles`**
- Purpose: Product bundles with discounts
- Key Fields: `bundle_id`, `name`, `price`, `discount_percentage`

**`affiliates.affiliates`**
- Purpose: Affiliate members
- Key Fields: `affiliate_id`, `user_id`, `commission_rate`, `payout_method`

**`affiliates.commissions`**
- Purpose: Commission calculations
- Key Fields: `commission_id`, `affiliate_id`, `order_id`, `commission_amount`, `status`

#### 4. Discrete Schema (8 tables)

**`discrete.discrete_cards`**
- Purpose: FanzDiscreet virtual prepaid cards
- Key Fields: `card_id`, `user_id`, `card_number`, `balance`, `billing_descriptor` (GH Holdings LLC), `status`
- Features: Virtual card generation, discreet billing

**`discrete.card_loads`**
- Purpose: Card funding via CCBill
- Key Fields: `load_id`, `card_id`, `amount`, `processor` (ccbill), `transaction_id`

**`discrete.card_spends`**
- Purpose: Internal spending transactions
- Key Fields: `spend_id`, `card_id`, `amount`, `platform_id`, `description`

**`discrete.gift_cards`**
- Purpose: Prepaid gift cards
- Key Fields: `gift_card_id`, `code`, `balance`, `purchaser_id`, `recipient_id`

**`discrete.ccbill_merchants`**
- Purpose: CCBill merchant configuration
- Key Fields: `merchant_id`, `client_accnum`, `client_subacc`, `form_name`, `salt`, `enabled`

**`discrete.descriptor_templates`**
- Purpose: Neutral billing descriptors
- Key Fields: `template_id`, `descriptor_text`, `processor`, `usage_count`
- Examples: "GH Holdings LLC", "GH Digital Services", "GH Commerce"

**`discrete.vault_access_log`**
- Purpose: Privacy audit trail
- Key Fields: `log_id`, `user_id`, `action`, `ip_address`, `timestamp`

**`discrete.crypto_loads`** (Future)
- Purpose: Cryptocurrency card loads
- Key Fields: `load_id`, `card_id`, `crypto_currency`, `amount`, `wallet_address`

---

## Configuration Files

### 1. Environment Variable Files

#### Main Configuration
**File:** `fanzdash/.env.example`

```bash
# Card Processors
CCBILL_CLIENT_ACCNUM=your_ccbill_account
CCBILL_CLIENT_SUBACC=your_ccbill_subaccount
CCBILL_FORM_NAME=your_form_name
CCBILL_SALT=your_ccbill_salt
CCBILL_API_KEY=your_api_key
CCBILL_DATALINK_USERNAME=your_datalink_username
CCBILL_DATALINK_PASSWORD=your_datalink_password

SEGPAY_PACKAGE_ID=your_segpay_package
SEGPAY_MERCHANT_ID=your_segpay_merchant
SEGPAY_ACCESS_KEY=your_access_key
SEGPAY_API_KEY=your_api_key

EPOCH_MERCHANT_ID=your_epoch_merchant
EPOCH_SECRET_KEY=your_secret_key

VENDO_MERCHANT_ID=your_vendo_merchant
VENDO_SHARED_SECRET=your_shared_secret

VEROTEL_SHOP_ID=your_verotel_shop
VEROTEL_SHARED_SECRET=your_shared_secret

# Cryptocurrency Processors
COINBASE_COMMERCE_API_KEY=your_coinbase_key
NOWPAYMENTS_API_KEY=your_nowpayments_key
COINPAYMENTS_PUBLIC_KEY=your_coinpayments_public
COINPAYMENTS_PRIVATE_KEY=your_coinpayments_private
BTCPAY_SERVER_URL=https://your-btcpay-server.com
BTCPAY_API_KEY=your_btcpay_key

# Payout Providers
PAXUM_API_KEY=your_paxum_key
PAXUM_API_SECRET=your_paxum_secret
EPAYSERVICE_API_KEY=your_epayservice_key
COSMO_PAYMENT_API_KEY=your_cosmo_key
WISE_API_TOKEN=your_wise_token
PAYONEER_PARTNER_ID=your_payoneer_id

# Escrow Configuration
ESCROW_ENABLED=true
ESCROW_DEFAULT_HOLD_DAYS=7
ESCROW_AUTO_RELEASE=true
ESCROW_DISPUTE_WINDOW_DAYS=14

# Payment Gateway Routing
PAYMENT_GATEWAYS_ENABLED=ccbill,segpay,epoch,vendo,verotel,rocketgate,netbilling,commercegate,centrobill,payze,coinbase,nowpayments,coinpayments,btcpay

# Payout Methods
PAYOUT_PROVIDERS=paxum,epayservice,cosmo,wise,payoneer,crypto,ach,sepa
```

#### Platform-Specific Configs (13 platforms)
- `boyfanz/.env.example`
- `girlfanz/.env.example`
- `pupfanz/.env.example`
- `transfanz/.env.example`
- `bearfanz/.env.example`
- `cougarfanz/.env.example`
- `gayfanz/.env.example`
- `femmefanz/.env.example`
- `guyz/.env.example`
- `dlbroz/.env.example`
- `southernfanz/.env.example`
- `taboofanz/.env.example`
- `fanzuncut/.env.example`

### 2. Payment Service Configuration Files

**Primary Config:**
- `fanzdash/server/payments/AdultPaymentProcessors.ts` (889 lines) - Complete processor library
- `fanzdash/server/payments/PaymentOrchestrator.ts` (150+ lines) - Payment routing engine
- `fanzdash/server/payments/EscrowService.ts` (200+ lines) - Escrow system
- `fanzdash/server/services/PlatformPaymentConfig.ts` (321 lines) - Per-platform configuration

**Secondary Config:**
- `fanzmoneydash/src/services/paymentProcessors.ts` (818 lines) - Processor selection UI
- `boyfanz/server/services/adultPaymentProviders.ts` (+ 12 platform copies)

### 3. Admin UI Configuration Components

**Payment Settings Panels (1,089 lines each, 13 platforms):**
- `bearfanz/client/src/pages/Admin/PaymentSettings.tsx`
- `boyfanz/client/src/pages/Admin/PaymentSettings.tsx`
- (Similar for all platforms)

**Features Configured:**
- Payment gateway CRUD
- Fee structure (flat + percentage)
- Transaction limits (min, max, daily)
- Supported currencies & methods
- Webhook management
- Payout schedules
- Fraud detection settings
- 3D Secure configuration
- PCI DSS compliance
- Encryption management
- Audit logging

**FanzDash Management Pages:**
- `fanzdash/client/src/pages/payment-gateway-setup.tsx`
- `fanzdash/client/src/pages/payment-processor-management.tsx`
- `fanzdash/client/src/pages/payment-management.tsx`

---

## Payment Flows

### Flow 1: Standard Payment Processing

```
1. Fan initiates payment (subscription/tip/content purchase)
   ↓
2. PaymentOrchestrator selects optimal processor
   - Checks region, currency, amount
   - Evaluates fees & success rates
   - Selects from: CCBill, Segpay, Epoch, Vendo, etc.
   ↓
3. Payment processed via selected gateway
   ↓
4. Webhook received from processor
   ↓
5. Transaction recorded in ledger.transactions
   ↓
6. Funds held in escrow (if applicable)
   ↓
7. After hold period (1-14 days), auto-release to creator
   ↓
8. Creator balance updated in ledger.accounts
```

### Flow 2: Custom Content Request with Escrow

```
1. Fan creates custom content request
   - Specifies requirements & budget
   ↓
2. Creator reviews & negotiates
   - Accept, counter-offer, or reject
   ↓
3. Terms agreed & fan signs no-chargeback agreement
   ↓
4. Payment processed to escrow
   - Full amount held in discrete.escrow_accounts
   ↓
5. Creator delivers custom content
   ↓
6. Fan reviews & approves content
   ↓
7. Escrow automatically releases funds to creator
   - Platform fee deducted (15% default)
   - Net amount to creator account
   ↓
8. Both parties can review/rate
```

### Flow 3: Creator Payout

```
1. Creator earns revenue
   - Subscriptions, tips, content sales
   - Recorded in ledger.transactions
   ↓
2. Revenue accumulates in creator account
   - Available balance calculated (minus escrow holds)
   ↓
3. Creator requests payout
   - Selects method: Paxum, ePayService, Crypto, etc.
   - Minimum: $50-$100 (varies by method)
   ↓
4. Payout request created
   - Status: pending
   ↓
5. Automated payout system processes batch
   - Daily at 2 AM UTC
   - Calls provider API
   ↓
6. Payout executed
   - Transaction ID recorded
   - Status: completed
   ↓
7. Creator receives funds
   - 1-3 business days (varies by method)
   - Instant for crypto
```

### Flow 4: FanzDiscreet Privacy Card

```
1. User purchases FanzDiscreet card
   - Amount: $10-$500
   - Payment via CCBill
   ↓
2. Virtual card generated
   - Card number, CVV, expiry
   - Billing descriptor: "GH Holdings LLC"
   ↓
3. Card loaded with balance
   - Recorded in discrete.card_loads
   ↓
4. User spends on platforms
   - Discreet billing (no Fanz branding)
   - Recorded in discrete.card_spends
   ↓
5. Balance depleted
   ↓
6. User reloads card
   - Via CCBill or crypto
```

### Flow 5: Subscription Renewal

```
1. Subscription created
   - Fan subscribes to creator tier
   - Billing cycle: monthly/quarterly/annual
   - Next billing date calculated
   ↓
2. Automated renewal worker runs daily
   - Checks fans.subscriptions for due renewals
   ↓
3. Renewal payment processed
   - Same processor as original subscription
   ↓
4. Success: Subscription extended
   ↓
5. Failure: Grace period (3 days)
   - Retry 3 times
   ↓
6. After grace period: Subscription cancelled
```

### Flow 6: Chargeback Handling

```
1. Chargeback notification received
   - Webhook from processor (CCBill, Segpay, etc.)
   ↓
2. Transaction flagged in ledger.transactions
   - Status: chargeback_pending
   ↓
3. Escrow system checks if funds held
   - If yes: Refund from escrow
   - If no: Deduct from creator balance
   ↓
4. Creator notified
   - Opportunity to dispute with evidence
   ↓
5. Chargeback resolved
   - Won: Funds returned to creator
   - Lost: Creator balance debited
   ↓
6. High chargeback rate triggers review
   - Creator may be suspended
```

---

## Platform Distribution

### Payment Processor Assignment by Platform

**All 94 Platforms:** Shared processor pool with platform-specific configurations

#### Core Platforms (13) - Full Payment Integration
1. **boyfanz** - Gay male content
2. **girlfanz** - Lesbian content
3. **pupfanz** - Pup play content
4. **transfanz** - Transgender content
5. **bearfanz** - Bear community
6. **cougarfanz** - Older women
7. **gayfanz** - General gay content
8. **femmefanz** - Femme content
9. **guyz** - Male-focused content
10. **dlbroz** - DL/Discreet content
11. **southernfanz** - Southern culture
12. **taboofanz** - Taboo content
13. **fanzuncut** - Uncensored content

#### Dashboards (3)
- **fanzdash** - Master payment orchestration
- **fanzmoneydash** - Payment processor selection & discreet billing
- **fanzsso** - Authentication (no payments)

#### Extended Platforms (78+)
All use centralized payment routing via fanzdash orchestration layer

### Processor Distribution Strategy

| Platform Type | Primary Processor | Secondary | Tertiary | Crypto |
|---------------|-------------------|-----------|----------|--------|
| US/CA Platforms | CCBill | Segpay | Epoch | Coinbase Commerce |
| EU Platforms | Verotel | CommerceGate | Epoch | NOWPayments |
| Global Platforms | Vendo | CCBill | Segpay | CoinPayments |
| High-Risk Content | CCBill | RocketGate | NetBilling | BTCPay |
| Privacy-Focused | Crypto | Paxum | Skrill | NOWPayments |

---

## Security & Compliance

### 1. PCI DSS Compliance
- ✅ No card data stored (tokenization only)
- ✅ Encrypted transmission (TLS 1.3)
- ✅ Secure API keys (environment variables)
- ✅ Audit logging on all transactions
- ✅ Access control (RBAC)
- ✅ Regular security audits

### 2. Fraud Detection
- Real-time risk scoring
- 3D Secure for high-risk transactions
- IP geolocation validation
- Velocity checking (transaction frequency)
- Blacklist/whitelist management
- Chargeback monitoring

### 3. Discreet Billing
All processors configured with neutral descriptors:
- "GH Holdings LLC"
- "GH Digital Services"
- "GH Commerce"
- "SP Digital Media"
- "EP Online Services"
- **Zero mention of "Fanz" or adult content**

### 4. Tax Compliance
- W9 collection for US creators
- 1099-K generation (annual)
- VAT handling for EU transactions
- Automated tax withholding
- Tax form management in database

### 5. KYC/AML Compliance
- Identity verification for $100+ transactions
- Age verification (18+)
- Creator identity verification
- Payout recipient verification
- Suspicious activity monitoring

### 6. Data Privacy
- GDPR compliant
- CCPA compliant
- Data encryption at rest
- PII anonymization in logs
- Right to deletion support

---

## Summary Statistics

### Ecosystem Scale
- **Total Payment Files:** 200+
- **Total API Endpoints:** 70+
- **Total Database Tables:** 27
- **Platforms Configured:** 94
- **Payment Processors:** 20+
- **Payout Methods:** 10+

### Configuration Coverage
- **Environment Variables:** 50+
- **Admin UI Components:** 13 platforms
- **Service Files:** 30+
- **Route Files:** 20+

### Transaction Capabilities
- **Supported Currencies:** 20+ (USD, EUR, GBP, CAD, AUD, + 15 cryptocurrencies)
- **Payment Methods:** Card, Bank, Crypto, Wallet
- **Min Transaction:** $1
- **Max Transaction:** $1,000,000
- **Fee Range:** 0% (BTCPay) to 12% (Epoch)

### Geographic Coverage
- **Regions:** Global (US, CA, EU, UK, AU, LATAM, ASIA, CIS)
- **Countries:** 150+
- **Currencies:** 20+ fiat + 15 crypto

---

## File Reference Index

### Payment Processor Configs
- `fanzdash/server/payments/AdultPaymentProcessors.ts` (889 lines)
- `fanzdash/server/payments/PaymentOrchestrator.ts` (150+ lines)
- `fanzmoneydash/src/services/paymentProcessors.ts` (818 lines)

### API Routes
- `fanzdash/server/routes/payments.ts`
- `fanzdash/server/routes/paymentAdmin.ts`
- `fanzdash/server/routes/customContentRequests.ts`
- `fanzdash/server/routes/payouts.ts`
- `fanzmoneydash/src/routes/discreet.js`
- `fanzmoneydash/src/routes/discreetWebhooks.js`

### Database Schemas
- `database/schemas/ledger_schema.sql`
- `database/schemas/crm_schema.sql`
- `database/schemas/commerce_schema.sql`
- `database/schemas/discrete_schema.sql`

### Admin UI Components
- `bearfanz/client/src/pages/Admin/PaymentSettings.tsx` (1,089 lines)
- (+ 12 platform copies)
- `fanzdash/client/src/pages/payment-gateway-setup.tsx`

### Environment Configs
- `fanzdash/.env.example`
- `fanzmoneydash/.env.example`
- (+ 13 platform `.env.example` files)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Maintained By:** FANZ Infrastructure Team

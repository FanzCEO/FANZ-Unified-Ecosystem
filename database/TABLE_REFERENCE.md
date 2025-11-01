# 📋 FANZ Unified Ecosystem - Complete Table Reference

> **Quick reference guide for all 157 database tables**

---

## 📊 Summary Statistics

- **Total Tables:** 157
- **Tables with RLS:** 144 (92%)
- **Custom Types:** 12
- **Database Functions:** 122
- **Reporting Views:** 6
- **Total Indexes:** 500+

---

## 🗂️ Tables by Category

### 01. Tax Compliance (32 tables)

**Sales Tax Management**
- `tax_jurisdiction` - State, county, city, special districts
- `tax_rate` - Tax rates by jurisdiction and product
- `tax_rule` - Complex tax calculation rules
- `tax_calculation` - Tax calculations for transactions
- `tax_calculation_line` - Line-item tax details
- `tax_transaction_link` - Link calculations to transactions
- `tax_transaction_links` - Transaction links with metadata

**Tax Registration & Filing**
- `tax_registration` - State registrations
- `tax_filing_period` - Monthly/quarterly/annual periods
- `tax_liability_summary` - Liability by period
- `tax_return` - Tax return filings
- `tax_remittance` - Tax payment tracking
- `tax_audit_log` - Tax compliance audit trail

**Product & Mapping**
- `tax_product_category` - Product tax categories
- `tax_product_mapping` - SKU to tax category mapping

**Nexus Monitoring**
- `tax_nexus_threshold` - State nexus thresholds
- `tax_nexus_metrics` - Nexus tracking metrics
- `nexus_thresholds` - Economic nexus config
- `nexus_metrics` - Aggregated nexus data
- `nexus_alerts` - Threshold warnings
- `nexus_registrations` - Registration status

**Exemptions**
- `tax_exemption_certificate` - Exemption certificates
- `exemption_certificates` - Detailed certificate data
- `exemption_rules` - Exemption rules by jurisdiction
- `exemption_alerts` - Expiry warnings
- `exemption_audit_logs` - Exemption audit trail

**Creator Tax**
- `creator_tax_profile` - W-9/W-8 information
- `payout_tax_withholding` - Withholding calculations
- `creator_earnings_records` - Earnings for tax reporting
- `creator_tax_audit_logs` - Creator tax audit
- `tax_year_thresholds` - 1099 thresholds

**User Tax**
- `user_address` - User addresses
- `user_tax_profile` - User tax info (singular)
- `user_tax_profiles` - Per-jurisdiction tax info (plural)

**Other Tax Tables**
- `backup_withholding_records` - IRS backup withholding
- `information_returns` - 1099-NEC, 1099-MISC, 1099-K

---

### 02. User & Creator Management (27 tables)

**Core Users**
- `users` - User authentication and profiles
- `user_profiles` - Extended profile information
- `user_cluster_profiles` - Platform-specific profiles
- `user_security_profiles` - Security and MFA settings
- `user_feed_preferences` - Content feed preferences
- `user_content_interests` - AI-learned interests
- `user_points` - Loyalty points
- `user_badges` - Earned badges
- `user_achievements` - Completed achievements
- `user_wallets` - Platform-specific wallets
- `user_balances` - Unified balances
- `user_subscriptions` - Active subscriptions
- `user_feedback` - User feedback

**Creators**
- `creators` - Creator accounts
- `creator_profiles` - Extended creator profiles
- `creator_verification` - KYC/identity docs
- `creator_analytics` - Performance metrics
- `creator_payouts` - Withdrawal records
- `creator_financial_summary` - Daily earnings
- `creator_earnings_records` - Tax reporting

**Authentication**
- `fanz_user_sessions` - Active sessions
- `fanz_user_2fa` - Two-factor auth
- `fanz_user_activity` - Activity tracking
- `fanz_age_verification` - Age verification

**Social**
- `follows` - Follow relationships

**Admin**
- `admin_users` - Admin accounts

---

### 03. Content Management (9 tables)

- `content_posts` - Posts across all clusters
- `content_media` - Media files and metadata
- `content_interactions` - Likes, views, shares
- `content_comments` - Comments with replies
- `content_categories` - Content categorization
- `content_collections` - Playlists/collections
- `content_collection_items` - Collection contents
- `content_analytics` - Performance tracking
- `content_reports` - Moderation reports

---

### 04. Financial System (9 tables)

**Double-Entry Accounting**
- `chart_of_accounts` - 19 accounts for bookkeeping
- `journal_entries` - Financial journal entries
- `journal_entry_lines` - Debit/credit lines
- `account_balances` - Real-time balances

**Transactions**
- `fanz_transactions` - All platform transactions
- `payout_line_items` - Payout details
- `payout_tax_withholding` - Tax withholding
- `point_transactions` - Points history

**NFT Finance**
- `nft_transactions` - NFT trading

---

### 05. E-commerce (7 tables)

**Products**
- `products` - Product catalog
- `product_variants` - Product variations

**Shopping**
- `shopping_carts` - Shopping carts
- `cart_items` - Cart contents

**Orders**
- `orders` - Order management
- `order_items` - Order line items

**Shipping**
- `shipping_carriers` - Carrier info
- `shipments` - Shipment tracking

---

### 06. NFT & Blockchain (4 tables)

- `nft_collections` - NFT collections
- `nfts` - Individual NFTs
- `marketplace_listings` - NFT listings
- `marketplace_orders` - NFT purchases

---

### 07. Vendor Access (7 tables)

- `vendor_profiles` - Vendor registration
- `access_grants` - Time-limited permissions
- `vendor_access_tokens` - API tokens
- `vendor_sessions` - Session tracking
- `vendor_activities` - Activity logs
- `vendor_access_analytics` - Usage analytics
- `vendor_audit_logs` - Security audit

---

### 08. API & Integrations (7 tables)

**API Management**
- `api_keys` - API key management
- `api_usage_logs` - Usage tracking

**Webhooks**
- `webhook_endpoints` - Webhook configs
- `webhook_deliveries` - Delivery logs

**OAuth 2.0**
- `oauth_applications` - OAuth apps
- `oauth_authorization_codes` - Auth codes
- `oauth_access_tokens` - Access tokens

---

### 09. Monetization (6 tables)

- `subscription_plans` - Subscription tiers
- `subscription_payments` - Payment history
- `promo_codes` - Discount codes
- `promo_code_usages` - Redemptions
- `referral_programs` - Referral configs
- `referrals` - Referral tracking

---

### 10. Analytics & Compliance (7 tables)

- `analytics_events` - Event tracking
- `platform_metrics` - Platform KPIs
- `campaign_analytics` - Campaign performance
- `fanz_platform_analytics` - Platform analytics
- `compliance_2257_records` - Adult content compliance
- `compliance_audit` - Compliance audit
- `processor_performance_metrics` - Processor metrics

---

### 11. Communication (5 tables)

- `conversations` - Creator-fan chats
- `fanz_messages` - Direct messages
- `fanz_notifications` - Notifications
- `notification_preferences` - User preferences
- `ticket_messages` - Support ticket messages

---

### 12. Security & Moderation (4 tables)

- `fanz_security_events` - Security events
- `security_alerts` - Security alerts
- `blocked_ips` - IP blocking
- `moderation_reports` - Content reports

---

### 13. Specialized Systems (9 tables)

- `crm_contacts` - Creator CRM
- `bio_links` - BioLinkHub
- `fanz_live_streams` - Live streaming
- `fanz_stream_viewers` - Stream viewers
- `clubs` - Communities
- `club_memberships` - Club members
- `ai_interactions` - AI chatbot
- `affiliate_links` - Affiliate system
- `affiliate_conversions` - Conversions

---

### 14. Support & Feedback (4 tables)

- `support_tickets` - Ticket system
- `feature_requests` - Feature voting
- `feature_request_votes` - Vote tracking
- `user_feedback` (see User Management)

---

### 15. Gamification (4 tables)

- `badges` - Badge definitions
- `achievements` - Achievement definitions
- `leaderboards` - Leaderboard configs
- `leaderboard_entries` - Rankings

---

### 16. Administration (4 tables)

- `admin_actions` - Admin action log
- `admin_audit_log` - Admin audit trail
- `token_blacklist` - Revoked tokens

---

### 17. Payment Processing (3 tables)

- `processor_configurations` - Processor configs (CCBill, Segpay, Paxum, etc.)
- `processor_health_logs` - Health monitoring
- `processor_performance_metrics` - Performance metrics

---

### 18. Other/Utility (8 tables)

- `blacklisted_tokens` - Revoked JWT tokens
- `password_reset_tokens` - Password reset
- `email_verification_tokens` - Email verification
- `comment_interactions` - Comment reactions
- `media_processing_jobs` - Background processing
- `scheduled_posts` - Post scheduling
- `marketing_campaigns` - Marketing automation
- `platform_financial_summary` - Daily financials

---

## 🎨 Custom Enum Types (12)

1. **`platform_cluster`** - 9 platforms (fanzlab, boyfanz, girlfanz, daddyfanz, pupfanz, taboofanz, transfanz, cougarfanz, fanzcock)
2. **`user_status`** - active, suspended, banned, pending_verification, deleted
3. **`creator_status`** - pending, approved, rejected, suspended, banned
4. **`verification_status`** - unverified, pending, verified, rejected, expired
5. **`content_status`** - draft, published, private, scheduled, archived, deleted
6. **`fanz_media_type`** - image, video, audio, document, live_stream
7. **`fanz_subscription_type`** - monthly, quarterly, yearly, lifetime, custom
8. **`fanz_transaction_type`** - tip, subscription, ppv, merchandise, nft, withdrawal, refund, chargeback, fee
9. **`moderation_status`** - pending, approved, rejected, escalated
10. **`payment_method`** - ccbill, segpay, epoch, verotel, paxum, crypto_btc, crypto_eth, crypto_usdt, bank_transfer, wise, dwolla
11. **`payout_status`** - pending, processing, completed, failed
12. **`transaction_status`** - pending, processing, completed, failed, cancelled, disputed

---

## 📊 Reporting Views (6)

1. **`active_subscriptions_summary`** - Active subscription metrics
2. **`content_performance`** - Top performing content
3. **`creator_earnings_summary`** - Creator revenue analytics
4. **`platform_health_dashboard`** - System health overview
5. **`platform_revenue_summary`** - Daily revenue breakdown
6. **`user_engagement_metrics`** - User engagement trends

---

## 🔍 Quick Search Guide

**Looking for user data?** → Users & Creator Management (27 tables)  
**Need financial reports?** → Financial System (9 tables)  
**Want to add products?** → E-commerce (7 tables)  
**Setting up webhooks?** → API & Integrations (7 tables)  
**Tax compliance?** → Tax Compliance (32 tables)  
**NFT support?** → NFT & Blockchain (4 tables)  
**Content moderation?** → Security & Moderation (4 tables)  

---

## 💾 Database Connection

```typescript
// For full type definitions, see: database/supabase-types.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database/supabase-types'

const supabase = createClient<Database>(
  'https://mcayxybcgxhfttvwmhgm.supabase.co',
  process.env.SUPABASE_ANON_KEY
)
```

---

**Last Updated:** November 1, 2025  
**Total Tables:** 157  
**Status:** ✅ Production Ready


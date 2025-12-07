# FANZ Unified Ecosystem - Database Architecture

## Overview

Complete database schemas for the FANZ Unified Ecosystem core infrastructure. All 94 platforms connect to these shared databases for centralized identity, payments, media, and more.

## Architecture

### Multi-Tenant Design

- **Logical Isolation**: Every table includes `tenant_id` and `platform_id` columns
- **Shared Infrastructure**: Single database cluster serves all 94 platforms
- **Row Level Security**: PostgreSQL RLS policies enforce data isolation
- **Horizontal Scaling**: Sharding-ready design for future growth

### Database Structure

```
fanz_identity    → Authentication, users, KYC
fanz_money       → Ledger, transactions, payouts
fanz_media       → Asset catalog, rights, moderation
fanz_crm         → Creators, fans, subscriptions
fanz_os          → Platform registry, config, features
fanz_discovery   → Rankings, search, recommendations
fanz_social      → Posts, messages, rooms
fanz_commerce    → Products, orders, affiliates
fanz_legal       → DMCA, takedowns, compliance
fanz_ai          → Prompts, embeddings, predictions
fanz_analytics   → Events, revenue, performance
fanz_audit       → Audit logs, GDPR, security
```

---

## Database Schemas

### 1. fanz_identity - Identity & Authentication

**Purpose**: Centralized identity, SSO, and KYC for all platforms

**Schemas**:
- `public`: Users, sessions, OAuth clients, roles
- `kyc_vault`: Encrypted KYC data, age verification, ban records

**Key Tables**:
- `users` - Multi-tenant user accounts
- `sessions` - JWT session management
- `oauth_clients` - OAuth2 application registry
- `kyc_vault.kyc_profiles` - Encrypted identity documents
- `kyc_vault.age_verifications` - Adult content access verification

**Security**: RLS enabled on KYC vault, encrypted PII fields

**Used By**: FanzSSO, FanzHubVault, All Platforms

---

### 2. fanz_money - Financial Ledger

**Purpose**: Financial transactions, payouts, escrow, tax compliance

**Schemas**:
- `ledger`: Accounts, balances, transactions
- `tax`: Tax forms, withholding (restricted)

**Key Tables**:
- `ledger.accounts` - User financial accounts
- `ledger.balances` - Real-time balance tracking
- `ledger.transactions` - All financial transactions
- `ledger.payouts` - Creator payout requests
- `ledger.revshare_rules` - Platform-specific commission rates
- `tax.tax_forms` - W9/1099 forms (encrypted)

**Features**:
- Escrow support (7-30 day holds)
- Automatic transaction numbering
- Multi-currency support
- Revenue share calculation

**Used By**: FanzMoney, FanzFinance, All Platforms

---

### 3. fanz_media - Media Asset Management

**Purpose**: Content storage, transcoding, rights management

**Schemas**:
- `catalog`: Assets, variants, transcode jobs
- `rights`: Content access, grants, view logs
- `moderation`: AI predictions, user reports

**Key Tables**:
- `catalog.assets` - Master asset catalog
- `catalog.asset_variants` - Different encodings/sizes
- `catalog.transcode_jobs` - Video processing queue
- `rights.content_rights` - Pricing and access control
- `rights.access_grants` - User permissions
- `moderation.moderation_queue` - Content review workflow

**Features**:
- Watermarking (FanzForensics™)
- AI content moderation
- PPV and tier-based access
- Download tracking

**Used By**: FanzMedia, FanzTube, FanzClips, All Platforms

---

### 4. fanz_crm - Customer Relationship Management

**Purpose**: Creator and fan profiles, subscriptions, campaigns

**Schemas**:
- `creators`: Profiles, tiers
- `fans`: Profiles, subscriptions, tips
- `campaigns`: Marketing campaigns
- `events`: Activity tracking

**Key Tables**:
- `creators.profiles` - Creator profiles
- `creators.subscription_tiers` - Pricing tiers
- `fans.subscriptions` - Active subscriptions
- `fans.tips` - Tip transactions
- `campaigns.campaigns` - Promotional campaigns

**Features**:
- Verification badges
- Trial periods
- Subscription auto-renewal
- Campaign tracking

**Used By**: FanzCRM, All Platforms

---

### 5. fanz_os - Operating System

**Purpose**: Platform registry, configuration, feature flags

**Schemas**:
- `registry`: Platforms, tenants, services
- `features`: Feature flags, overrides
- `routing`: Request routing, rate limits
- `config`: System and platform configuration

**Key Tables**:
- `registry.platforms` - All 94 platforms
- `registry.tenants` - Multi-tenant orgs
- `features.flags` - Global feature toggles
- `features.platform_overrides` - Platform-specific features
- `routing.rules` - Request routing logic
- `config.secrets` - Encrypted credentials

**Features**:
- Feature flag system
- A/B testing support
- Dynamic routing
- Secrets management

**Used By**: FanzOS, All Platforms

---

### 6. fanz_discovery - Search & Discovery

**Purpose**: Rankings, search, recommendations, trending

**Schemas**:
- `rankings`: Creator rankings, trending
- `recommendations`: Personalized recommendations
- `search`: Search index, queries, popular searches

**Key Tables**:
- `rankings.creator_rankings` - Creator leaderboards
- `rankings.trending_creators` - Velocity-based trending
- `recommendations.creator_recommendations` - AI recommendations
- `search.creator_index` - Full-text search index
- `search.banned_creators_feed` - Public transparency feed

**Features**:
- Multi-metric ranking algorithm
- Trending detection
- Full-text search (pg_trgm)
- Popular search tracking

**Used By**: FanzDiscovery, All Platforms

---

### 7. fanz_social - Social Features

**Purpose**: Posts, messaging, communities

**Schemas**:
- `posts`: Posts, likes, comments
- `threads`: Discussion threads
- `rooms`: Chat rooms
- `messages`: Direct messages

**Key Tables**:
- `posts.posts` - Creator content posts
- `posts.likes` - Post engagement
- `posts.comments` - Threaded comments
- `rooms.rooms` - Chat rooms
- `messages.direct_messages` - Private messages with PPV

**Features**:
- PPV posts and messages
- Chat rooms with moderation
- Auto-updating counters
- Threaded discussions

**Used By**: All Platforms

---

### 8. fanz_commerce - E-Commerce

**Purpose**: Digital products, orders, affiliate program

**Schemas**:
- `products`: Products, bundles
- `orders`: Orders, items
- `affiliates`: Affiliates, clicks, commissions

**Key Tables**:
- `products.products` - Digital product catalog
- `products.bundles` - Product bundles
- `orders.orders` - Purchase orders
- `affiliates.affiliates` - Affiliate partners
- `affiliates.commissions` - Commission tracking

**Features**:
- Digital delivery
- Bundle savings calculation
- Affiliate link tracking
- Commission automation

**Used By**: FanzCommerce, All Platforms

---

### 9. fanz_legal - Legal Compliance

**Purpose**: DMCA, copyright, takedowns

**Schemas**:
- `dmca`: DMCA notices, counter-notices
- `takedowns`: Content removal actions
- `evidence`: Encrypted evidence vault (restricted)
- `legal_claims`: General legal claims

**Key Tables**:
- `dmca.notices` - DMCA takedown requests
- `dmca.counter_notices` - Counter-claims
- `takedowns.actions` - Content removal log
- `evidence.vault` - Encrypted evidence storage
- `dmca.repeat_infringers` - Strike tracking

**Features**:
- DMCA compliance workflow
- Evidence chain of custody
- Repeat infringer policy
- 10-14 day waiting periods

**Used By**: FanzLegal, FanzDefender, FanzProtect

---

### 10. fanz_ai - Artificial Intelligence

**Purpose**: AI prompts, moderation, embeddings

**Schemas**:
- `prompts`: Prompt templates, executions
- `moderation`: AI predictions, feedback
- `embeddings`: Vector embeddings (pgvector)
- `ai_recommendations`: ML models, predictions

**Key Tables**:
- `prompts.templates` - Reusable AI prompts
- `moderation.predictions` - AI content moderation
- `embeddings.content_embeddings` - 1536-dim vectors
- `ai_recommendations.models` - ML model metadata

**Features**:
- Semantic search (cosine similarity)
- AI moderation pipeline
- Prompt versioning
- Model performance tracking

**Used By**: FanzAI, All Platforms

---

### 11. fanz_analytics - Analytics

**Purpose**: Event tracking, revenue analytics, performance

**Schemas**:
- `events`: Event warehouse
- `revenue`: Revenue aggregates
- `content_analytics`: Content performance
- `user_analytics`: Cohorts, retention
- `funnels`: Conversion tracking

**Key Tables**:
- `events.raw_events` - Event stream (time-series)
- `revenue.daily_revenue` - Daily financial aggregates
- `content_analytics.performance` - Content metrics
- `user_analytics.cohorts` - User segmentation
- `funnels.analysis` - Funnel conversion data

**Features**:
- TimescaleDB support
- Materialized views
- Cohort analysis
- Funnel tracking

**Used By**: FanzAnalytics, Data Pipeline

---

### 12. fanz_audit - Audit & GDPR

**Purpose**: Audit logging, GDPR/CCPA compliance

**Schemas**:
- `audit`: Immutable audit logs (WORM)
- `gdpr`: Data subject requests, consent

**Key Tables**:
- `audit.logs` - Immutable audit log
- `audit.security_events` - Security incidents
- `gdpr.data_subject_requests` - Access/erasure requests
- `gdpr.consent_records` - Consent tracking
- `gdpr.deletion_queue` - Scheduled deletions

**Features**:
- WORM storage (write-once-read-many)
- 30-day GDPR deadline tracking
- Data portability
- Right to erasure

**Used By**: All Platforms (compliance)

---

## Database Roles & Permissions

### Application Roles

```sql
-- Read-only application access
CREATE ROLE platform_app_ro;

-- Read-write application access
CREATE ROLE platform_app_rw;

-- Analytics read access
CREATE ROLE analytics_ro;

-- Analytics read-write
CREATE ROLE analytics_rw;
```

### Restricted Roles

```sql
-- Legal operations (DMCA, claims)
CREATE ROLE legal_ops;

-- KYC operations (identity verification)
CREATE ROLE kyc_ops;

-- Tax operations (tax forms)
CREATE ROLE tax_ops;

-- Moderation operations
CREATE ROLE moderator_ro;
CREATE ROLE moderator_rw;

-- Compliance operations (GDPR)
CREATE ROLE compliance_ro;
CREATE ROLE compliance_rw;

-- Security operations
CREATE ROLE security_ops;

-- Secrets reader (encrypted config)
CREATE ROLE secrets_reader;
```

---

## Required PostgreSQL Extensions

```sql
-- Core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search

-- Optional but recommended
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "timescaledb";    -- Time-series optimization
```

---

## Installation

### Prerequisites

- PostgreSQL 14+ (recommended 15 or 16)
- pgvector extension installed
- Sufficient storage for multi-tenant data
- Read replicas for analytics queries

### Quick Start

```bash
# 1. Create database
createdb fanz_ecosystem

# 2. Run schema initialization
cd database
psql fanz_ecosystem -f init_all_schemas.sql

# 3. Create roles
psql fanz_ecosystem -f setup_roles.sql

# 4. Verify installation
psql fanz_ecosystem -f verify_schemas.sql
```

### Individual Schema Installation

```bash
# Install schemas one at a time
psql fanz_ecosystem -f schemas/01_fanz_identity.sql
psql fanz_ecosystem -f schemas/02_fanz_money.sql
# ... etc
```

---

## Configuration

### Connection Strings

```bash
# Application connection (read-write)
postgresql://platform_app_rw:password@host:5432/fanz_ecosystem

# Analytics connection (read-only)
postgresql://analytics_ro:password@host:5432/fanz_ecosystem

# Admin connection
postgresql://admin:password@host:5432/fanz_ecosystem
```

### Connection Pooling

Recommended: Use PgBouncer or pgpool-II

```ini
# PgBouncer config
[databases]
fanz_ecosystem = host=localhost port=5432 dbname=fanz_ecosystem

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

---

## Performance Tuning

### Recommended PostgreSQL Settings

```ini
# Memory
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
work_mem = 64MB

# Parallelism
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# WAL
wal_buffers = 16MB
min_wal_size = 2GB
max_wal_size = 8GB

# Checkpoints
checkpoint_completion_target = 0.9
```

### Index Maintenance

```sql
-- Reindex regularly on high-write tables
REINDEX TABLE CONCURRENTLY events.raw_events;
REINDEX TABLE CONCURRENTLY audit.logs;

-- Update statistics
ANALYZE VERBOSE;
```

### Materialized View Refresh

```sql
-- Refresh analytics views (run daily)
SELECT refresh_analytics_views();

-- Refresh ranking views (run hourly)
SELECT rankings.refresh_rankings();
```

---

## Backup & Recovery

### Backup Strategy

```bash
# Full backup (daily)
pg_dump -Fc -f fanz_ecosystem_$(date +%Y%m%d).dump fanz_ecosystem

# Schema-only backup
pg_dump -s -f schema_backup.sql fanz_ecosystem

# Data-only backup
pg_dump -a -f data_backup.sql fanz_ecosystem
```

### Point-in-Time Recovery (PITR)

```bash
# Enable WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'

# Create base backup
pg_basebackup -D /backup/base -Ft -z -P

# Restore to point in time
recovery_target_time = '2025-01-15 12:00:00'
```

---

## Monitoring

### Key Metrics to Monitor

- **Connection pool utilization**: Keep below 80%
- **Cache hit ratio**: Should be > 99%
- **Index usage**: Unused indexes waste space
- **Bloat**: Regular VACUUM needed
- **Replication lag**: For read replicas
- **Query performance**: Slow query log

### Monitoring Queries

```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Cache hit ratio
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey';
```

---

## Security Best Practices

### Data Protection

1. **Encryption at Rest**: Use PostgreSQL TDE or disk encryption
2. **Encryption in Transit**: Enforce SSL connections
3. **Encrypted Fields**: PII fields use pgcrypto
4. **Row Level Security**: Enabled on sensitive tables
5. **Audit Logging**: All data access logged

### Access Control

1. **Principle of Least Privilege**: Grant minimum permissions
2. **Role-Based Access**: Use PostgreSQL roles
3. **Service Accounts**: One per service
4. **Rotate Credentials**: Regular password rotation
5. **MFA for Admins**: Require 2FA for admin access

### Compliance

1. **GDPR**: Data subject request workflow implemented
2. **CCPA**: Do-not-sell tracking
3. **Audit Trail**: Immutable audit logs
4. **Data Retention**: Automated deletion policies
5. **Consent Management**: Granular consent tracking

---

## Migration Strategy

### Version Control

Use migration tools:
- **Flyway**: Java-based, popular
- **Liquibase**: XML/YAML/SQL formats
- **migrate**: Go-based, simple
- **Alembic**: Python-based

### Migration Example (Flyway)

```
db/migration/
├── V1__fanz_identity.sql
├── V2__fanz_money.sql
├── V3__fanz_media.sql
├── V4__fanz_crm.sql
├── V5__fanz_os.sql
└── ...
```

---

## Troubleshooting

### Common Issues

**Connection Pool Exhaustion**
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';
```

**Slow Queries**
```sql
-- Enable slow query log
log_min_duration_statement = 1000  -- Log queries > 1 second

-- Find slow queries
SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

**Disk Space**
```sql
-- Check database size
SELECT pg_database_size('fanz_ecosystem');

-- Vacuum to reclaim space
VACUUM FULL;
```

---

## Support

### Documentation

- Full schema reference: See individual schema files
- API documentation: Generated from schemas
- Architecture diagrams: `/docs/architecture/`

### Contact

- Technical Issues: tech@fanzunlimited.com
- Security Issues: security@fanzunlimited.com
- Compliance Questions: legal@fanzunlimited.com

---

## License

Copyright © 2025 FANZ Unlimited Network. All rights reserved.

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Total Tables**: 110+
**Total Lines**: 6,157
**Platforms Supported**: 94

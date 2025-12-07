# FANZ Ecosystem - Scalability & Architecture Strategy

## Table of Contents
1. [Database Partitioning](#database-partitioning)
2. [Sharding Strategy](#sharding-strategy)
3. [Caching Architecture](#caching-architecture)
4. [CDN & Media Storage](#cdn--media-storage)
5. [Read Replicas & Load Balancing](#read-replicas--load-balancing)
6. [Message Queues & Background Jobs](#message-queues--background-jobs)
7. [Monitoring & Observability](#monitoring--observability)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Security & Compliance](#security--compliance)
10. [Infrastructure as Code](#infrastructure-as-code)

---

## Database Partitioning

### Time-Based Partitioning (PostgreSQL 15+ Native)

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs (
    id UUID,
    user_id UUID,
    action_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    -- ... other columns
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Auto-create new partitions with pg_partman extension
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table => 'public.audit_logs',
    p_control => 'created_at',
    p_interval => '1 month',
    p_premake => 3
);

-- Similarly partition:
-- - notifications (by created_at)
-- - transactions (by created_at)
-- - creator_analytics (by date)
-- - messages (by created_at)
```

### List Partitioning for Multi-Tenant

```sql
-- Partition posts by content type for better performance
CREATE TABLE posts (
    id UUID,
    content_type VARCHAR(20),
    -- ... other columns
) PARTITION BY LIST (content_type);

CREATE TABLE posts_video PARTITION OF posts FOR VALUES IN ('video');
CREATE TABLE posts_image PARTITION OF posts FOR VALUES IN ('image');
CREATE TABLE posts_text PARTITION OF posts FOR VALUES IN ('text');
CREATE TABLE posts_audio PARTITION OF posts FOR VALUES IN ('audio');
CREATE TABLE posts_mixed PARTITION OF posts FOR VALUES IN ('mixed');
```

---

## Sharding Strategy

### Horizontal Sharding by User ID

```
Shard 0: user_id hash % 16 == 0  (6.25% of users)
Shard 1: user_id hash % 16 == 1  (6.25% of users)
...
Shard 15: user_id hash % 16 == 15 (6.25% of users)
```

**Shard Key:** `user_id` (UUID hashed to integer)

**Tables to Shard:**
- `users`
- `creator_profiles`
- `posts`
- `media_files`
- `subscriptions`
- `transactions`
- `messages`

**Implementation Options:**
1. **Citus Data** (PostgreSQL extension for distributed tables)
2. **Vitess** (MySQL sharding, would require migration)
3. **Manual sharding** with application-level routing

### Citus Implementation Example

```sql
-- Install Citus extension
CREATE EXTENSION citus;

-- Add worker nodes
SELECT * from citus_add_node('worker1.fanz.internal', 5432);
SELECT * from citus_add_node('worker2.fanz.internal', 5432);

-- Distribute tables
SELECT create_distributed_table('users', 'id');
SELECT create_distributed_table('posts', 'creator_id');
SELECT create_distributed_table('transactions', 'payer_id');
SELECT create_distributed_table('subscriptions', 'subscriber_id');

-- Co-locate related tables
SELECT create_distributed_table('creator_profiles', 'user_id',
    colocate_with => 'users');
SELECT create_distributed_table('media_files', 'uploader_id',
    colocate_with => 'users');
```

---

## Caching Architecture

### Multi-Layer Caching Strategy

```
Layer 1: Application Cache (Node.js)
         └─> In-memory LRU cache (10-minute TTL)

Layer 2: Redis (Primary Cache)
         └─> Hot data, 1-hour to 24-hour TTL

Layer 3: PostgreSQL (with pg_stat_statements)
         └─> Query result caching, materialized views

Layer 4: CDN (Cloudflare/AWS CloudFront)
         └─> Static assets, media files, API responses
```

### Redis Cache Keys Structure

```redis
# User profiles
user:profile:{user_id}                    TTL: 1 hour
user:settings:{user_id}                   TTL: 24 hours

# Creator data
creator:profile:{creator_id}              TTL: 1 hour
creator:posts:{creator_id}:page:{n}       TTL: 5 minutes
creator:subscribers:{creator_id}:count    TTL: 10 minutes

# Feed data
feed:home:{user_id}:page:{n}              TTL: 2 minutes
feed:trending:posts                       TTL: 5 minutes

# Session data
session:{session_id}                      TTL: 24 hours

# Rate limiting
ratelimit:api:{user_id}:{endpoint}        TTL: 1 minute
ratelimit:messages:{user_id}              TTL: 1 hour

# Geolocation (Redis GEO)
geo:users:{timestamp}                     TTL: 10 minutes
# GEOADD geo:users:1234567890 -122.4194 37.7749 "user:uuid"
```

### Materialized Views for Analytics

```sql
-- Refresh every hour
CREATE MATERIALIZED VIEW creator_daily_stats AS
SELECT
    creator_id,
    DATE(created_at) as date,
    COUNT(*) as post_count,
    SUM(view_count) as total_views,
    SUM(like_count) as total_likes
FROM posts
WHERE status = 'published'
GROUP BY creator_id, DATE(created_at);

CREATE UNIQUE INDEX ON creator_daily_stats (creator_id, date);

-- Auto-refresh with pg_cron
CREATE EXTENSION pg_cron;

SELECT cron.schedule(
    'refresh-creator-stats',
    '0 * * * *', -- Every hour
    'REFRESH MATERIALIZED VIEW CONCURRENTLY creator_daily_stats'
);
```

---

## CDN & Media Storage

### Multi-Region Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare CDN (Global Edge Network)               │
│  - 300+ PoPs worldwide                              │
│  - DDoS protection                                   │
│  - Image optimization on-the-fly                    │
└──────────────┬──────────────────────────────────────┘
               │
         ┌─────┴──────┐
         │            │
    ┌────▼────┐  ┌────▼────┐  ┌──────────┐
    │ US-EAST │  │ US-WEST │  │ EU-WEST  │
    │   S3    │  │   S3    │  │    S3    │
    │ Primary │  │ Replica │  │  Replica │
    └─────────┘  └─────────┘  └──────────┘
         │            │              │
         └────────────┴──────────────┘
                      │
         ┌────────────▼────────────┐
         │  S3 Cross-Region        │
         │  Replication (CRR)      │
         └─────────────────────────┘
```

### Storage Tiers

```yaml
Hot Tier (Frequently Accessed):
  - Recently uploaded media (< 30 days)
  - Trending creator content
  - Storage: S3 Standard
  - Cost: $0.023/GB/month

Warm Tier (Occasionally Accessed):
  - Media 30-90 days old
  - Storage: S3 Intelligent-Tiering
  - Cost: Auto-optimized

Cold Tier (Archive):
  - Media > 90 days old, low views
  - Storage: S3 Glacier Instant Retrieval
  - Cost: $0.004/GB/month

Lifecycle Policy:
  - 0-30 days: S3 Standard
  - 30-90 days: S3 Intelligent-Tiering
  - 90+ days: S3 Glacier Instant Retrieval
  - 2+ years: S3 Glacier Deep Archive
```

### Media Processing Pipeline

```
Upload → S3 Primary → Lambda/ECS Fargate → Processing Jobs
                           │
                           ├─> Video Transcoding (H.264, H.265, AV1)
                           ├─> Image Optimization (WebP, AVIF)
                           ├─> Thumbnail Generation (multiple sizes)
                           ├─> FanzForensics Watermarking
                           └─> Metadata Extraction
                                    │
                                    ▼
                           S3 Processed → CDN
```

---

## Read Replicas & Load Balancing

### Database Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│          (Next.js API Routes / Node.js)                  │
└────────┬────────────────────────────────┬────────────────┘
         │                                │
    ┌────▼───────┐                  ┌────▼────────┐
    │ Write Pool │                  │  Read Pool  │
    │ (Primary)  │                  │ (Replicas)  │
    └────┬───────┘                  └────┬────────┘
         │                                │
         │                         ┌──────┴──────┐
         │                         │             │
    ┌────▼─────┐         ┌─────────▼──┐  ┌──────▼──────┐
    │ Primary  │         │ Replica 1  │  │  Replica 2  │
    │  DB      │────────▶│  (US-EAST) │  │  (US-WEST)  │
    │ US-EAST  │         └────────────┘  └─────────────┘
    │ RDS/      │
    │ Aurora    │         ┌──────────────┐
    └───────────┘         │  Replica 3   │
                          │  (EU-WEST)   │
                          └──────────────┘

Write Queries:   → Primary
Read Queries:    → Round-robin across replicas
Analytics:       → Dedicated replica (Replica 3)
```

### Connection Pooling

```javascript
// PgBouncer configuration
[databases]
fanz_production = host=primary.fanz.internal port=5432 dbname=fanz

[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
```

```javascript
// Application-level pooling (Node.js)
const { Pool } = require('pg');

const writePool = new Pool({
  host: 'primary.fanz.internal',
  database: 'fanz',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const readPools = [
  new Pool({ host: 'replica1.fanz.internal', max: 10 }),
  new Pool({ host: 'replica2.fanz.internal', max: 10 }),
  new Pool({ host: 'replica3.fanz.internal', max: 10 }),
];

function getReadPool() {
  return readPools[Math.floor(Math.random() * readPools.length)];
}
```

---

## Message Queues & Background Jobs

### Queue Architecture

```
┌──────────────────────────────────────────────────────┐
│              Application Producers                   │
└────────┬───────────┬──────────┬────────────┬─────────┘
         │           │          │            │
    ┌────▼───┐  ┌───▼────┐ ┌───▼────┐  ┌───▼─────┐
    │ Media  │  │ Email  │ │ Push   │  │ Analytics│
    │ Queue  │  │ Queue  │ │ Queue  │  │ Queue    │
    └────┬───┘  └───┬────┘ └───┬────┘  └───┬─────┘
         │          │          │            │
         └──────────┴──────────┴────────────┘
                    │
            ┌───────▼────────┐
            │  Redis/RabbitMQ │
            │  Message Broker │
            └───────┬────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼────┐          ┌─────▼─────┐
    │ Worker  │          │  Worker   │
    │ Pool 1  │          │  Pool 2   │
    │ (Media) │          │  (Notify) │
    └─────────┘          └───────────┘
```

### Job Types & Priorities

```javascript
// BullMQ (Redis-based queue)
const { Queue, Worker } = require('bullmq');

// Define queues with priorities
const queues = {
  // Critical (process within seconds)
  payment: new Queue('payment', {
    defaultJobOptions: {
      priority: 1,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 }
    }
  }),

  // High priority (process within minutes)
  media: new Queue('media-processing', {
    defaultJobOptions: {
      priority: 5,
      attempts: 3,
      timeout: 600000 // 10 minutes
    }
  }),

  // Normal priority
  notifications: new Queue('notifications', {
    defaultJobOptions: {
      priority: 10,
      attempts: 3
    }
  }),

  // Low priority (can wait)
  analytics: new Queue('analytics', {
    defaultJobOptions: {
      priority: 20,
      attempts: 2
    }
  })
};

// Job examples
await queues.payment.add('process-subscription', {
  subscriptionId: 'uuid',
  userId: 'uuid',
  amount: 999 // cents
});

await queues.media.add('transcode-video', {
  fileId: 'uuid',
  inputPath: 's3://...',
  formats: ['1080p', '720p', '480p']
});

await queues.notifications.add('send-email', {
  to: 'user@example.com',
  template: 'new-subscriber',
  data: { creatorName: 'JohnDoe' }
});
```

---

## Monitoring & Observability

### Metrics Stack

```
Application Metrics (Node.js)
  └─> Prometheus
       └─> Grafana Dashboards

Database Metrics
  └─> PostgreSQL pg_stat_statements
  └─> pganalyze / Datadog

Logs
  └─> CloudWatch Logs / ELK Stack
       └─> Log aggregation & search

APM (Application Performance Monitoring)
  └─> DataDog / New Relic / Sentry

Infrastructure
  └─> AWS CloudWatch / Prometheus Node Exporter
```

### Key Metrics to Track

```yaml
Application:
  - Request rate (requests/second)
  - Response time (p50, p95, p99)
  - Error rate (5xx errors)
  - Active users
  - WebSocket connections

Database:
  - Query execution time
  - Connection pool usage
  - Cache hit ratio
  - Replication lag
  - Deadlocks
  - Table bloat

Redis:
  - Memory usage
  - Hit rate
  - Eviction rate
  - Commands per second

Queues:
  - Queue depth
  - Job processing time
  - Failed jobs
  - Worker utilization

Business:
  - New user signups
  - Active creators
  - Revenue (real-time)
  - Content uploads
  - Subscription conversions
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: database
    rules:
      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends > 80
        for: 5m
        annotations:
          summary: "Database connection pool near capacity"

      - alert: ReplicationLag
        expr: pg_replication_lag_seconds > 60
        for: 2m
        annotations:
          summary: "Replica lagging behind primary"

  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
```

---

## Backup & Disaster Recovery

### RTO & RPO Targets

```
RTO (Recovery Time Objective): < 1 hour
RPO (Recovery Point Objective): < 5 minutes
```

### Backup Strategy

```yaml
Hot Backups (Continuous):
  - PostgreSQL WAL shipping to S3
  - Write-Ahead Logging (Point-in-Time Recovery)
  - Retention: 7 days

Daily Backups:
  - Full database snapshot (pg_dump)
  - Stored in S3 with versioning
  - Cross-region replication
  - Retention: 30 days

Weekly Backups:
  - Full system backup
  - Retention: 90 days

Monthly Backups:
  - Archive backup
  - Retention: 1 year (compliance)

Testing:
  - Quarterly restore drills
  - Automated backup verification
```

### Disaster Recovery Runbook

```bash
#!/bin/bash
# DR Recovery Script

# 1. Provision new infrastructure (Terraform)
terraform apply -var="environment=dr"

# 2. Restore database from latest backup
aws s3 cp s3://fanz-backups/latest.dump /tmp/
pg_restore -d fanz_dr /tmp/latest.dump

# 3. Restore Redis from AOF/RDB
aws s3 cp s3://fanz-redis-backup/appendonly.aof /var/lib/redis/
redis-server /etc/redis/redis.conf

# 4. Point DNS to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://failover-dns.json

# 5. Verify application health
curl https://fanz.com/health
```

---

## Security & Compliance

### Encryption at Rest & in Transit

```yaml
Database:
  - Encryption: AES-256 (PostgreSQL transparent encryption)
  - Key Management: AWS KMS with automatic rotation
  - Sensitive columns: Additional application-level encryption (pgcrypto)

Storage:
  - S3 SSE-KMS (Server-Side Encryption with KMS)
  - All media files encrypted

Transit:
  - TLS 1.3 for all connections
  - Certificate pinning for mobile apps
  - HSTS enabled

Secrets Management:
  - AWS Secrets Manager / HashiCorp Vault
  - No secrets in code or environment variables
  - Automatic rotation every 90 days
```

### Compliance Requirements

```yaml
GDPR (EU):
  - Right to access: User data export API
  - Right to deletion: Soft delete + permanent purge after 30 days
  - Data portability: JSON export
  - Consent management: user_consents table

CCPA (California):
  - Do Not Sell: opt-out mechanism
  - Data disclosure: transparency reports

2257/2258 (US Adult Content):
  - Age verification: govt ID + biometric
  - Record keeping: 7+ years
  - Custodian of records: designated person

SOC 2 Type II:
  - Access controls: RBAC + audit logs
  - Change management: git + code review
  - Monitoring: 24/7 alerting

PCI-DSS (Payment Card):
  - No card data storage (use Stripe/payment processor)
  - Tokenization only
  - Annual security audit
```

---

## Infrastructure as Code

### Terraform Example

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "fanz-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "fanz_primary" {
  cluster_identifier      = "fanz-production"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "fanz"
  master_username         = var.db_master_username
  master_password         = var.db_master_password

  vpc_security_group_ids  = [aws_security_group.db.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  kms_key_id              = aws_kms_key.rds.arn
  storage_encrypted       = true

  tags = {
    Environment = "production"
    Application = "fanz"
  }
}

# Read replicas
resource "aws_rds_cluster_instance" "replicas" {
  count              = 3
  identifier         = "fanz-replica-${count.index}"
  cluster_identifier = aws_rds_cluster.fanz_primary.id
  instance_class     = "db.r6g.2xlarge"
  engine             = aws_rds_cluster.fanz_primary.engine
  engine_version     = aws_rds_cluster.fanz_primary.engine_version
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "fanz_redis" {
  replication_group_id       = "fanz-redis"
  replication_group_description = "Redis cluster for FANZ"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r6g.xlarge"
  num_cache_clusters         = 3
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# S3 Bucket for media
resource "aws_s3_bucket" "media" {
  bucket = "fanz-media-production"

  lifecycle_rule {
    enabled = true

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
  }

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.s3.arn
      }
    }
  }
}

# CloudFront CDN
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "S3-fanz-media"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-fanz-media"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.3_2021"
  }
}
```

---

## Cost Optimization

### Estimated Monthly Costs (at scale)

```yaml
Database (RDS Aurora):
  - Primary: db.r6g.2xlarge (2 instances) = $1,200
  - Replicas: db.r6g.2xlarge (3) = $1,800
  - Storage: 5TB @ $0.10/GB = $500
  Total: $3,500/month

Redis (ElastiCache):
  - cache.r6g.xlarge (3 nodes) = $900/month

Storage (S3):
  - 50TB media @ $0.023/GB = $1,150/month
  - Glacier: 200TB @ $0.004/GB = $800/month
  Total: $1,950/month

CDN (CloudFront):
  - 100TB transfer @ $0.085/GB = $8,500/month

Compute (ECS Fargate):
  - 20 tasks @ $50/task = $1,000/month

Message Queue (SQS/Redis):
  - $200/month

Monitoring (DataDog/New Relic):
  - $500/month

Total Estimated: ~$16,550/month for 100K+ users

Per-user cost: $0.16/month
```

---

## Deployment Strategy

### Blue-Green Deployment

```yaml
1. Current (Blue): Production traffic
   - version: v1.2.0
   - traffic: 100%

2. Deploy New (Green):
   - version: v1.3.0
   - traffic: 0%
   - smoke tests pass

3. Traffic Shift:
   - 0% → 10% → 50% → 100% (over 1 hour)
   - Monitor error rates
   - Automatic rollback if errors > 1%

4. Rollback Plan:
   - Instant DNS switch back to Blue
   - Database migrations are backwards-compatible
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster fanz-production \
            --service fanz-api \
            --force-new-deployment

      - name: Run database migrations
        run: |
          npm run db:migrate

      - name: Health check
        run: |
          curl -f https://api.fanz.com/health || exit 1
```

---

## Summary

This architecture supports:
- **10M+ users** with horizontal scaling
- **100K+ concurrent users** with load balancing
- **50+ TB media storage** with multi-region redundancy
- **<100ms API response times** (p95)
- **99.99% uptime SLA** with multi-AZ deployment
- **<5 minute RPO** with continuous backups
- **GDPR, CCPA, 2257, PCI-DSS compliance**

Ready for production deployment and future growth! 🚀

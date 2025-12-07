# FANZ Database Quick Start Guide

## 🚀 Quick Start (Local Development)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f postgres
```

**Services Available:**
- **PostgreSQL**: `localhost:5432` (pgAdmin UI at `localhost:5050`)
- **Redis**: `localhost:6379` (Redis Commander at `localhost:8081`)
- **MinIO (S3)**: `localhost:9000` (Console at `localhost:9001`)
- **Mailhog**: SMTP `localhost:1025`, Web UI `localhost:8025`
- **Prometheus**: `localhost:9090`
- **Grafana**: `localhost:3001` (admin/admin)

### Option 2: Manual Installation

```bash
# Install PostgreSQL 15+
brew install postgresql@15  # macOS
# or
sudo apt install postgresql-15 postgis  # Ubuntu

# Install Redis
brew install redis  # macOS
# or
sudo apt install redis-server  # Ubuntu

# Start services
brew services start postgresql@15
brew services start redis

# Create database
createdb fanz_development

# Deploy schema
cd database
psql fanz_development < schema.sql
```

---

## 📊 Database Schema Overview

### Core Tables (Identity)
- `users` - Unified identity across all platforms
- `creator_profiles` - Creator-specific data & verification
- `user_sessions` - Authentication sessions
- `user_2fa` - Two-factor authentication

### Content
- `posts` - All content posts
- `media_files` - Media with **FanzForensics™** signatures
- `comments` - Post comments
- `likes` - Post likes

### Financial
- `wallets` - Creator/fan wallets
- `transactions` - All financial transactions
- `subscriptions` - Fan subscriptions to creators
- `payouts` - Creator payouts

### Compliance
- `age_verification_records` - 2257/2258 compliance
- `content_performer_records` - Performer verification
- `user_consents` - GDPR/CCPA consent tracking

### Moderation
- `reports` - Content/user reports
- `user_warnings` - Violation warnings

### Platform Access
- `platforms` - All 42+ FANZ platforms
- `user_platform_access` - User access to platforms

---

## 🔧 Common Tasks

### Deploy to Production

```bash
# Set environment variables
export DB_HOST=production.fanz.internal
export DB_USER=fanz_admin
export DB_PASSWORD=your_secure_password
export DB_NAME=fanz_production

# Run deployment script
chmod +x deploy.sh
./deploy.sh production
```

### Create a Backup

```bash
# Full backup
pg_dump -h localhost -U fanz_admin fanz_development -F c -f backup.dump

# Schema only
pg_dump -h localhost -U fanz_admin fanz_development --schema-only > schema_backup.sql

# Data only
pg_dump -h localhost -U fanz_admin fanz_development --data-only > data_backup.sql
```

### Restore from Backup

```bash
# Restore full backup
pg_restore -h localhost -U fanz_admin -d fanz_development backup.dump

# Restore schema
psql -h localhost -U fanz_admin fanz_development < schema_backup.sql
```

### Run Migrations

```bash
# Install node-pg-migrate
npm install -g node-pg-migrate

# Create migration
migrate create add-streaming-features

# Run migrations
migrate up

# Rollback
migrate down
```

### Add Initial Platforms

```sql
-- Connect to database
psql fanz_development

-- Insert core platforms (already in schema.sql)
-- Or add custom platform:
INSERT INTO platforms (slug, name, category, description) VALUES
('myplatform', 'MyPlatform', 'creator', 'My custom platform');
```

### Check Database Health

```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'fanz_development';

-- Database size
SELECT pg_size_pretty(pg_database_size('fanz_development'));

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Slow queries
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🧪 Seeding Test Data

```bash
# Create seed file (optional - for development only)
cat > seed.sql << 'EOF'
-- Insert test user
INSERT INTO users (id, email, username, display_name, account_type, password_hash)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@fanz.local',
    'testcreator',
    'Test Creator',
    'creator',
    '$2b$10$test_hash_here'  -- Replace with actual bcrypt hash
);

-- Insert creator profile
INSERT INTO creator_profiles (user_id, subscription_price_monthly)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    9.99
);

-- Insert platforms
-- (Already in schema.sql)
EOF

# Apply seed data
psql fanz_development < seed.sql
```

---

## 🔐 Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.dump" >> .gitignore
echo "backup_*.sql" >> .gitignore
```

### 2. Use Encrypted Columns

```sql
-- Encrypt sensitive data
UPDATE users
SET date_of_birth_encrypted = pgp_sym_encrypt('1990-01-01', 'encryption_key')
WHERE id = 'user_uuid';

-- Decrypt when needed
SELECT pgp_sym_decrypt(date_of_birth_encrypted, 'encryption_key')
FROM users
WHERE id = 'user_uuid';
```

### 3. Use Connection Pooling

```javascript
// PgBouncer for connection pooling
const pool = new Pool({
  host: 'localhost',
  port: 6432,  // PgBouncer port
  database: 'fanz_development',
  max: 20
});
```

### 4. Enable SSL/TLS

```bash
# In production, always use SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

---

## 📈 Monitoring

### Enable Query Logging

```sql
-- Enable slow query logging
ALTER DATABASE fanz_development SET log_min_duration_statement = 1000;  -- 1 second

-- View logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Monitor Replication Lag

```sql
-- On primary
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    sync_state
FROM pg_stat_replication;

-- On replica
SELECT
    now() - pg_last_xact_replay_timestamp() AS replication_lag;
```

---

## 🆘 Troubleshooting

### Can't Connect to Database

```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Check if port is open
lsof -i :5432

# Test connection
psql -h localhost -U fanz_admin -d fanz_development -c "SELECT 1"
```

### Out of Connections

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '1 hour';
```

### Slow Queries

```sql
-- Find missing indexes
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;

-- Analyze table
ANALYZE your_table_name;
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Redis Documentation](https://redis.io/documentation)
- [FANZ Architecture Guide](./scalability-architecture.md)
- [Migration Guide](./migrations/README.md)

---

## 🎯 Next Steps

1. ✅ Deploy database schema
2. ✅ Configure environment variables
3. ✅ Set up monitoring
4. [ ] Deploy application
5. [ ] Configure CDN
6. [ ] Set up payment processing
7. [ ] Configure email service
8. [ ] Deploy to production

---

**Need Help?** Open an issue or contact the development team!

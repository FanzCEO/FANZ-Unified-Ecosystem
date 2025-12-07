# Database Migrations

## Migration Strategy

We use **Flyway** or **node-pg-migrate** for database migrations with the following principles:

1. **Never break backwards compatibility** during deployment
2. **All migrations are reversible**
3. **Test migrations on staging first**
4. **Zero-downtime deployments**

## Migration Naming Convention

```
V{version}__{description}.sql

Examples:
V001__initial_schema.sql
V002__add_user_2fa.sql
V003__partition_audit_logs.sql
```

## Running Migrations

```bash
# Install node-pg-migrate
npm install -g node-pg-migrate

# Create new migration
npm run migrate create add-streaming-features

# Run migrations
npm run migrate up

# Rollback last migration
npm run migrate down

# Check migration status
npm run migrate ls
```

## Zero-Downtime Migration Patterns

### Adding a Column (Safe)

```sql
-- V010__add_user_timezone.sql
ALTER TABLE users ADD COLUMN timezone VARCHAR(50);

-- Set default for existing rows in background
UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL;
```

### Removing a Column (Multi-Step)

```sql
-- Step 1: V011__deprecate_old_column.sql
-- Deploy code that stops writing to old_column

-- Step 2 (next deployment): V012__remove_old_column.sql
ALTER TABLE users DROP COLUMN old_column;
```

### Renaming a Column (Multi-Step)

```sql
-- Step 1: V013__add_new_column.sql
ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
UPDATE users SET display_name = old_name;

-- Step 2 (deploy code that uses both columns)

-- Step 3 (next deployment): V014__remove_old_name_column.sql
ALTER TABLE users DROP COLUMN old_name;
```

### Changing Column Type (Safe Pattern)

```sql
-- V015__migrate_user_id_to_uuid.sql

-- 1. Add new column
ALTER TABLE users ADD COLUMN id_new UUID;

-- 2. Backfill data
UPDATE users SET id_new = uuid_generate_v4() WHERE id_new IS NULL;

-- 3. In next deployment, update application to use id_new
-- 4. Drop old column in subsequent migration
```

## Migration Testing Checklist

- [ ] Run migration on local database
- [ ] Run migration on staging database
- [ ] Verify application still works with old schema (backwards compatibility)
- [ ] Verify application works with new schema
- [ ] Test rollback procedure
- [ ] Check query performance hasn't degraded
- [ ] Verify indexes are created with CONCURRENTLY option
- [ ] Check migration completes within timeout (10 minutes max)

## Performance Considerations

### Adding Indexes Without Locking

```sql
-- BAD: Locks table
CREATE INDEX idx_posts_creator ON posts(creator_id);

-- GOOD: No lock, can run on production
CREATE INDEX CONCURRENTLY idx_posts_creator ON posts(creator_id);
```

### Large Table Migrations

For tables with > 10M rows:

```sql
-- Instead of:
ALTER TABLE posts ADD COLUMN new_field VARCHAR(100) DEFAULT 'value';

-- Do:
ALTER TABLE posts ADD COLUMN new_field VARCHAR(100);
-- Backfill in batches asynchronously
UPDATE posts SET new_field = 'value' WHERE new_field IS NULL LIMIT 10000;
```

## Common Migration Recipes

### Add ENUM Type

```sql
-- Create type
CREATE TYPE account_type AS ENUM ('fan', 'creator', 'admin');

-- Add column using type
ALTER TABLE users ADD COLUMN account_type_new account_type DEFAULT 'fan';
```

### Add Constraints Safely

```sql
-- Add NOT VALID constraint first (no table scan)
ALTER TABLE users
  ADD CONSTRAINT users_email_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  NOT VALID;

-- Validate in background (can be killed and restarted)
ALTER TABLE users VALIDATE CONSTRAINT users_email_check;
```

## Emergency Rollback

If a migration causes issues:

```bash
# 1. Identify problematic migration
npm run migrate ls

# 2. Rollback
npm run migrate down

# 3. Deploy previous application version

# 4. Investigate and fix migration

# 5. Test thoroughly on staging

# 6. Re-deploy with fixed migration
```

## Migration Lock System

To prevent concurrent migrations:

```sql
-- Use advisory locks
SELECT pg_advisory_lock(123456);

-- Run migration

SELECT pg_advisory_unlock(123456);
```

## Monitoring Migrations

```sql
-- Check long-running migrations
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND query LIKE 'ALTER%'
ORDER BY duration DESC;

-- Kill stuck migration
SELECT pg_terminate_backend(pid);
```

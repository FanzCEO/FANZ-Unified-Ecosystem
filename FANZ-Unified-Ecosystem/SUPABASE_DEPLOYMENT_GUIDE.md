# FANZ Supabase Deployment Guide

## Overview
Your database schema is ready to deploy to Supabase! The master schema has been converted into a Supabase migration file.

## File Location
- **Migration File**: `supabase/migrations/20251103000000_initial_schema.sql`
- **Original Schema**: `database/FANZ_MASTER_SCHEMA.sql`

## Deployment Options

### Option 1: Deploy to Existing Supabase Project (Recommended)

1. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   Get your project ref from: https://app.supabase.com/project/_/settings/general

3. **Push the database schema**:
   ```bash
   supabase db push
   ```

### Option 2: Start Local Supabase for Testing

1. **Start local Supabase instance**:
   ```bash
   supabase start
   ```

   This will:
   - Start a local PostgreSQL database
   - Apply all migrations automatically
   - Provide local API endpoints

2. **Access local Supabase Studio**:
   - URL: http://localhost:54323
   - View your database schema visually

3. **Stop when done**:
   ```bash
   supabase stop
   ```

### Option 3: Manual Deployment via Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)
4. Click "New query"
5. Copy and paste contents from: `supabase/migrations/20251103000000_initial_schema.sql`
6. Click "Run" to execute the migration

## What's Included in the Schema

### Tables (60+)
- **Core Infrastructure**: users, roles, sessions, audit_logs
- **Content & Media**: media_assets, content_posts, collections, transcoding_jobs
- **Monetization**: transactions, subscriptions, payment_methods
- **Social Features**: (coming in Part 2)
- **Compliance**: (coming in Part 2)
- **Analytics**: (coming in Part 2)

### Extensions Enabled
- `uuid-ossp` - UUID generation
- `pgcrypto` - Encryption functions
- `pg_trgm` - Full-text search
- `btree_gin` & `btree_gist` - Advanced indexing
- `postgis` - Geographic data
- `timescaledb` - Time-series optimization (if available)

### Special Features
- **TimescaleDB Hypertables**: transactions, audit_logs (auto-partitioning)
- **Row Level Security (RLS)**: Multi-tenant data isolation
- **Soft Deletes**: `deleted_at` columns for data retention
- **Audit Trails**: Comprehensive logging in audit_logs table

## Post-Deployment Steps

### 1. Verify Deployment
```bash
# Check migration status
supabase db diff

# List all tables
supabase db list
```

### 2. Set Up Row Level Security (RLS)
The schema creates tables without RLS enabled by default. You'll need to add policies:

```sql
-- Example: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Example: Allow users to read their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

### 3. Configure Environment Variables
Update your `.env` file with Supabase credentials:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT.supabase.co:5432/postgres
```

## Important Notes

### Extension Availability
- **PostGIS**: Available on all Supabase plans
- **TimescaleDB**: Only on Pro plan and above
  - If on Free tier, the schema will still work but without time-series optimizations
  - The `create_hypertable` calls will fail gracefully

### Connection Limits
- **Free tier**: 60 direct connections, 200 pooled
- **Pro tier**: 200 direct connections, 500 pooled
- **Enterprise**: Custom

For 48+ FANZ platforms, you'll need:
- Pro tier minimum (Day 1)
- Enterprise tier for scale (100K+ users)

### Database Size Limits
- **Free tier**: 500 MB
- **Pro tier**: 8 GB
- **Enterprise**: Unlimited

### Next Steps (Coming Soon)
The current schema is **Part 1 of 3**. Still to be added:
- Part 2: Social features (follows, messages, comments)
- Part 3: Compliance & Analytics (KYC, 2257, ML features)

## Troubleshooting

### Error: "extension timescaledb is not available"
**Solution**: Remove or comment out TimescaleDB-specific code:
```sql
-- Comment out these lines:
-- SELECT create_hypertable('transactions', 'created_at', if_not_exists => TRUE);
-- SELECT create_hypertable('audit_logs', 'created_at', if_not_exists => TRUE);
```

### Error: "permission denied to create extension"
**Solution**: Extensions must be enabled via Supabase Dashboard:
1. Go to Database > Extensions
2. Enable required extensions (uuid-ossp, pgcrypto, etc.)

### Error: "relation already exists"
**Solution**: Schema already deployed. To reset:
```bash
# Reset local database
supabase db reset

# For remote: Use Supabase Dashboard > Database > Reset
```

## Monitoring & Maintenance

### Check Database Health
```bash
# View table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Connections
```bash
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE datname = current_database();
```

## Support

For issues:
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/FanzCEO/FANZ-Unified-Ecosystem/issues

---

Generated: 2025-11-03
Schema Version: 1.0.0 (Part 1 of 3)

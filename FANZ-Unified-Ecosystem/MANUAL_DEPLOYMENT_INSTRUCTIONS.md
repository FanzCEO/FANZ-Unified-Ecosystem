# Manual Supabase Deployment Instructions for BoyFanz

The automated `supabase db push` is failing due to existing tables in the remote database. Here's how to manually deploy the schema via the Supabase Dashboard.

## Current Status

- **Project**: ysjondxpwvfjofbneqki (BoyFanz)
- **Issue**: Remote database has existing tables from a previous migration that need to be completely removed
- **Solution**: Manual deployment via Supabase Dashboard SQL Editor

---

## Step 1: Reset the Database (via Supabase Dashboard)

1. Go to https://app.supabase.com/project/ysjondxpwvfjofbneqki
2. Navigate to **Database** > **Database Settings**
3. Scroll down to **Danger Zone**
4. Click **"Reset database"** to completely wipe all data and schema
   - This will delete everything and start fresh
   - **WARNING**: This is irreversible - all existing data will be lost

---

## Step 2: Deploy the Initial Schema

1. After reset completes, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file: `supabase/migrations/20251103000000_initial_schema.sql`
   - **Location**: `/Users/joshuastone/FANZ-Unified-Ecosystem/supabase/migrations/20251103000000_initial_schema.sql`
   - **Size**: 4,974 lines
   - **Contains**: 205 tables (201 from Drizzle + 4 Outlawz tables)
4. Copy and paste the ENTIRE contents into the SQL Editor
5. Click **RUN** (or press Cmd+Enter)
6. Wait for execution to complete (~30-60 seconds)
7. Check for errors in the output panel

---

## Step 3: Deploy RLS Policies

1. In SQL Editor, click **"New query"** again
2. Open the file: `supabase/migrations/20251103000001_rls_policies.sql`
   - **Location**: `/Users/joshuastone/FANZ-Unified-Ecosystem/supabase/migrations/20251103000001_rls_policies.sql`
   - **Size**: 317 lines
   - **Contains**: Row Level Security policies for multi-tenant isolation
3. Copy and paste the entire contents into the SQL Editor
4. Click **RUN** (or press Cmd+Enter)
5. Wait for execution to complete (~5-10 seconds)
6. Verify the success message: "Multi-tenant RLS policies applied successfully!"

---

## Step 4: Verify Deployment

### Check Tables

Run this query in SQL Editor:

```sql
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result**: ~205 tables should be listed

###Check RLS Policies

Run this query:

```sql
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result**: 50+ policies across various tables

### Check ENUMs

Run this query:

```sql
SELECT
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
GROUP BY typname
ORDER BY typname;
```

**Expected Result**: 150+ ENUM types

---

## Step 5: Update Migration History (Optional)

After manual deployment, sync the migration history:

```bash
supabase db remote commit
```

This will create a migration file based on the current remote schema.

---

## Alternative: Use Supabase Dashboard Reset UI

If you prefer a GUI approach:

1. Go to https://app.supabase.com/project/ysjondxpwvfjofbneqki/settings/general
2. Scroll to **"Danger Zone"**
3. Click **"Reset database"**
4. Confirm the reset
5. Wait for completion (~1-2 minutes)
6. Follow Steps 2-4 above to deploy the schema

---

## Troubleshooting

### Error: "relation already exists"
**Solution**: The database wasn't fully reset. Try the reset process again or run this cleanup query first:

```sql
-- Drop all tables with CASCADE
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

### Error: "extension not available"
**Solution**: Enable required extensions via Dashboard:
1. Go to **Database** > **Extensions**
2. Enable: `uuid-ossp`, `pgcrypto`, `pg_trgm`, `postgis`

### Error: "TimescaleDB not available"
**Expected on Free tier**. Comment out these lines in `20251103000000_initial_schema.sql`:

```sql
-- Line ~4970
-- SELECT create_hypertable('transactions', 'created_at', if_not_exists => TRUE);
-- SELECT create_hypertable('audit_logs', 'created_at', if_not_exists => TRUE);
```

---

## Post-Deployment Tasks

### 1. Create Initial Tenants

```sql
INSERT INTO tenants (slug, name, domain, is_active) VALUES
  ('boyfanz', 'BoyFanz', 'boyfanz.com', TRUE),
  ('girlfanz', 'GirlFanz', 'girlfanz.com', TRUE),
  ('pupfanz', 'PupFanz', 'pupfanz.com', TRUE),
  ('gayfanz', 'GayFanz', 'gayfanz.com', TRUE);
-- Add remaining 44 platforms...
```

### 2. Create Admin User

After signing up via Supabase Auth:

```sql
-- Get your user ID from Supabase Auth
-- Then grant admin role:
INSERT INTO account_role (account_id, role_id)
SELECT
  'YOUR_USER_ID_HERE',
  id
FROM roles
WHERE role_type = 'super_admin';
```

### 3. Test RLS Policies

```sql
-- Test as authenticated user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT * FROM content LIMIT 10;
```

---

## Schema Statistics

| Metric | Count |
|--------|-------|
| **Total Tables** | 205 |
| **Core Tables** | 201 (from Drizzle) |
| **Outlawz Tables** | 4 |
| **ENUMs** | 150+ |
| **RLS Policies** | 50+ |
| **Indexes** | 400+ |
| **Foreign Keys** | 300+ |
| **Lines of SQL** | 5,291 |

---

## Files Reference

- **Main Schema**: `supabase/migrations/20251103000000_initial_schema.sql`
- **RLS Policies**: `supabase/migrations/20251103000001_rls_policies.sql`
- **Environment**: `boyfanz/.env`
- **MCP Config**: `boyfanz/.mcp.json`
- **Full Documentation**: `SUPABASE_MIGRATION_COMPLETE.md`

---

## Support

- **Supabase Dashboard**: https://app.supabase.com/project/ysjondxpwvfjofbneqki
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com

---

**Last Updated**: November 2, 2025
**Status**: Ready for manual deployment

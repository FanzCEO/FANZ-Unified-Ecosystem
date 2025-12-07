# BoyFanz Database - Quick Deploy Guide

## 🎯 Current Status
- ✅ Schema ready (205 tables, 5,291 lines SQL)
- ✅ RLS policies ready (50+ policies)
- ✅ Environment configured (.env updated)
- ⚠️ Awaiting manual database reset

---

## 🚀 Deploy in 3 Steps (5 minutes)

### Step 1: Reset Database
1. Go to https://app.supabase.com/project/ysjondxpwvfjofbneqki/settings/general
2. Scroll to **Danger Zone** → Click **"Reset database"**
3. Confirm and wait ~2 minutes

### Step 2: Deploy Schema
1. Go to https://app.supabase.com/project/ysjondxpwvfjofbneqki/sql/new
2. Open: `/Users/joshuastone/FANZ-Unified-Ecosystem/supabase/migrations/20251103000000_initial_schema.sql`
3. Copy all → Paste → Click **RUN**
4. Wait ~60 seconds

### Step 3: Deploy RLS
1. Click **"New query"** in SQL Editor
2. Open: `/Users/joshuastone/FANZ-Unified-Ecosystem/supabase/migrations/20251103000001_rls_policies.sql`
3. Copy all → Paste → Click **RUN**
4. Wait ~10 seconds

---

## ✅ Verify Deployment

Run in SQL Editor:

```sql
-- Should return 205
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Should return 50+
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

---

## 📁 Key Files

| File | Location | Purpose |
|------|----------|---------|
| Schema | `supabase/migrations/20251103000000_initial_schema.sql` | 205 tables |
| RLS | `supabase/migrations/20251103000001_rls_policies.sql` | Security policies |
| Config | `boyfanz/.env` | Database credentials |
| Status | `DEPLOYMENT_STATUS.md` | Full details |
| Manual | `MANUAL_DEPLOYMENT_INSTRUCTIONS.md` | Step-by-step guide |

---

## 🔗 Quick Links

- **Dashboard**: https://app.supabase.com/project/ysjondxpwvfjofbneqki
- **SQL Editor**: https://app.supabase.com/project/ysjondxpwvfjofbneqki/sql/new
- **Settings**: https://app.supabase.com/project/ysjondxpwvfjofbneqki/settings/general

---

## 📊 What You're Deploying

- **205 tables** (201 BoyFanz + 4 Outlawz)
- **150+ ENUM types** for type safety
- **400+ indexes** for performance
- **300+ foreign keys** for data integrity
- **50+ RLS policies** for multi-tenant security
- **2 helper functions** for auth checks

---

## 🎉 After Deployment

Create initial tenants:

```sql
INSERT INTO tenants (slug, name, domain, is_active) VALUES
  ('boyfanz', 'BoyFanz', 'boyfanz.com', TRUE),
  ('girlfanz', 'GirlFanz', 'girlfanz.com', TRUE),
  ('pupfanz', 'PupFanz', 'pupfanz.com', TRUE),
  ('gayfanz', 'GayFanz', 'gayfanz.com', TRUE);
```

---

**Ready?** Start with Step 1 above! 🚀

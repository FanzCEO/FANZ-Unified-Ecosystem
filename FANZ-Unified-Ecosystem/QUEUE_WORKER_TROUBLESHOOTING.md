# Queue Worker Deployment Troubleshooting

**Service ID:** srv-d44bsj6uk2gs73a5e3r0
**Service Name:** fanz-multiplatform-worker
**Current Status:** ❌ DEPLOYMENT FAILED - Missing environment variables
**Last Error:** 2025-11-03 17:52:12 UTC

---

## Problem

The Queue Worker is crashing immediately on startup with this error:

```
Error: supabaseUrl is required.
    at validateSupabaseUrl (.../node_modules/@supabase/supabase-js/dist/main/lib/helpers.js:50:15)
    at new SupabaseClient (.../node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js:34:59)
    at createClient (.../node_modules/@supabase/supabase-js/dist/main/index.js:38:12)
    at Object.<anonymous> (.../backend/workers/index.js:5:18)
```

**Root Cause:** The `SUPABASE_URL` environment variable is `undefined` (not set).

---

## Why This Is Happening

The environment variables defined in `render.yaml` **DO NOT** automatically get applied to existing services. They only apply when creating NEW services via Infrastructure as Code (IaC).

For existing services, environment variables **MUST be configured directly in the Render dashboard UI**.

---

## Solution: Add Environment Variables in Render Dashboard

### Step 1: Open Environment Variables Page

Go to: https://dashboard.render.com/web/srv-d44bsj6uk2gs73a5e3r0/env

### Step 2: Add Required Environment Variables

Click the **"Add Environment Variable"** button and add these THREE variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Standard production flag |
| `SUPABASE_URL` | `https://mcayxybcgxhfttvwmhgm.supabase.co` | FANZ Ecosystem Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | *(see below)* | Secret key from Supabase dashboard |

### Step 3: Get the SUPABASE_SERVICE_ROLE_KEY

1. Go to: https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm/settings/api
2. Scroll to **"Project API keys"** section
3. Find the **"service_role"** key (marked as "secret")
4. Click the eye icon to reveal the key
5. Copy the entire key value
6. Paste it into Render as the value for `SUPABASE_SERVICE_ROLE_KEY`

**WARNING:** This is a SECRET key with admin access to your database. Never commit it to git or share it publicly.

### Step 4: Save Changes

1. After adding all THREE variables, scroll to the bottom of the page
2. Click the **"Save Changes"** button
3. Render will automatically trigger a new deployment

### Step 5: Monitor Deployment

Go to the **Logs** tab: https://dashboard.render.com/web/srv-d44bsj6uk2gs73a5e3r0/logs

Watch for these success indicators:

```
========================================
FANZ Multi-Platform Queue Worker
========================================
Environment: production
Supabase URL: https://mcayxybcgxhfttvwmhgm.supabase.co
Started: [timestamp]
========================================

[WORKER] Connected to Supabase
[WORKER] Polling queue every 10 seconds...
[WORKER] Polling crossposting_queue...
[WORKER] Found 0 pending jobs
```

---

## Verification

Once the deployment succeeds, verify the worker is running:

### Check Service Status

The service should show as **"Live"** in the Render dashboard.

### Check Logs

Logs should show:
- ✅ No "supabaseUrl is required" errors
- ✅ "Connected to Supabase" message
- ✅ Continuous polling every 10 seconds

### Test with a Sample Job

Create a test job in the database to verify the worker processes it:

```sql
-- Run this in Supabase SQL editor
INSERT INTO crossposting_queue (
  source_platform,
  target_platforms,
  post_data,
  status
) VALUES (
  'boyfanz',
  ARRAY['girlfanz', 'pupfanz'],
  '{"title": "Test Post", "content": "This is a test"}'::jsonb,
  'pending'
);
```

The worker should:
1. Pick up the job within 10 seconds
2. Process it (create posts on target platforms)
3. Update status to 'completed'
4. Create history records

---

## Common Issues

### Issue 1: Variables Not Taking Effect

**Symptoms:** After adding variables, deployment still fails with same error

**Solution:**
1. Double-check the variable names are EXACTLY:
   - `SUPABASE_URL` (all uppercase)
   - `SUPABASE_SERVICE_ROLE_KEY` (all uppercase, with underscores)
2. Verify you clicked "Save Changes"
3. Check the **Environment** tab to confirm variables are listed
4. Try manually triggering a redeploy from the dashboard

### Issue 2: Wrong Service

**Symptoms:** Variables added but still not working

**Solution:**
- Confirm you're on the correct service: **srv-d44bsj6uk2gs73a5e3r0**
- This is a **Background Worker** (not a Web Service)
- The correct URL is: https://dashboard.render.com/web/srv-d44bsj6uk2gs73a5e3r0

### Issue 3: Wrong Supabase Project

**Symptoms:** Worker starts but fails to query database

**Solution:**
- Ensure you're using the FANZ Ecosystem Supabase project: **mcayxybcgxhfttvwmhgm**
- NOT the BoyFanz project: **ysjondxpwvfjofbneqki**
- Different services use different databases

### Issue 4: Invalid Service Role Key

**Symptoms:** "Invalid API key" or authentication errors

**Solution:**
1. Go to Supabase dashboard
2. Regenerate the service_role key if needed
3. Copy the NEW key to Render
4. Save and redeploy

---

## Why render.yaml Doesn't Work for Existing Services

The `render.yaml` file in the repository has these environment variables:

```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: SUPABASE_URL
    value: https://mcayxybcgxhfttvwmhgm.supabase.co
  - key: SUPABASE_SERVICE_ROLE_KEY
    sync: false  # Must be set manually
```

However, Render's behavior is:

- **New Services:** render.yaml is used to create the service with these variables
- **Existing Services:** render.yaml is IGNORED for environment variables
- **Dashboard Settings:** Always take precedence over render.yaml

This is why you MUST configure environment variables in the dashboard UI for existing services.

---

## Success Criteria

The Queue Worker deployment is successful when:

- ✅ Service status shows **"Live"** (not "Failed" or "Deploying")
- ✅ No "supabaseUrl is required" errors in logs
- ✅ Logs show "Connected to Supabase"
- ✅ Worker polls queue every 10 seconds
- ✅ Test job gets processed successfully
- ✅ History records are created

---

## Related Documentation

- **Render Environment Variables:** https://render.com/docs/environment-variables
- **Render Dashboard:** https://dashboard.render.com/web/srv-d44bsj6uk2gs73a5e3r0
- **Supabase Project:** https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm
- **Deployment Status:** DEPLOYMENT_STATUS.md
- **Master Plan:** MASTER_DEPLOYMENT_PLAN.md

---

## Next Steps After Successful Deployment

Once the Queue Worker is running:

1. ✅ Mark "Verify Queue Worker deployment succeeds" as complete
2. ✅ Test cross-posting with a sample post
3. ✅ Verify posts created on target platforms
4. ✅ Check history records in database
5. 🚀 Move to Phase 2: Deploy REST API
6. 🚀 Move to Phase 3: Deploy Platform Frontends

---

**Last Updated:** 2025-11-03 17:56 UTC

# Supabase Project Setup Guide for FANZ Ecosystem

## 🎯 Quick Setup (5 minutes)

Follow these steps to create your Supabase project, then I'll handle the rest of the deployment!

---

## Step 1: Create Supabase Account (2 minutes)

1. **Go to Supabase:**
   - Visit: https://supabase.com
   - Click "Start your project" or "Sign In"

2. **Sign up:**
   - Use GitHub sign-in (recommended) OR
   - Sign up with email

---

## Step 2: Create New Project (2 minutes)

1. **Click "New Project"**
   - Select your organization (or create one)

2. **Fill in Project Details:**
   - **Name:** `FANZ-Ecosystem` (or any name you prefer)
   - **Database Password:** Choose a strong password (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., `US East` for US)
   - **Pricing Plan:** Free tier is fine to start

3. **Click "Create new project"**
   - Wait ~2 minutes for project to initialize

---

## Step 3: Get Your Credentials (1 minute)

Once your project is created:

1. **Go to Project Settings:**
   - Click the gear icon (⚙️) in the left sidebar
   - Click "API" in the settings menu

2. **Copy These Values:**
   You'll see several values on this page. Copy them:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Project API Keys:**
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (even longer string)

3. **Go to Project Settings → General:**
   - Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

---

## Step 4: Save Your Credentials

Create a file at `~/FANZ-Unified-Ecosystem/.env` with these values:

```bash
# Supabase Configuration
SUPABASE_PROJECT_REF=your_reference_id_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Render Configuration
RENDER_API_KEY=your_render_api_key_here

# Application Configuration
NODE_ENV=production
```

**Replace:**
- `your_reference_id_here` → Your Reference ID (from Step 3)
- `https://your-project.supabase.co` → Your Project URL (from Step 3)
- `your_anon_public_key_here` → Your anon/public key (from Step 3)
- `your_service_role_key_here` → Your service_role key (from Step 3)
- `your_render_api_key_here` → Your Render API key (get from Render dashboard → Account Settings → API Keys)

---

## Step 5: Let Me Know When Ready!

Once you've:
1. ✅ Created your Supabase project
2. ✅ Copied all credentials
3. ✅ Created the `.env` file with your credentials

**Just say "I'm ready" and I'll automatically:**
- Deploy all database tables to Supabase
- Set up the cross-posting features
- Create the backend worker
- Deploy everything to Render
- Give you the final deployed URLs

---

## 🔒 Security Notes

- **NEVER** commit the `.env` file to Git
- The `.gitignore` already excludes it
- Keep your `service_role` key secret - it has full database access
- The `anon` key is safe to use in frontend code

---

## 📍 Quick Reference

**Supabase Dashboard:** https://app.supabase.com

**Your Project URL:** (you'll get this in Step 3)

**Things I'll Deploy Automatically:**
- ✅ 6 database tables for cross-posting
- ✅ 14 RLS (security) policies
- ✅ 3 automated trigger functions
- ✅ Backend worker for processing posts
- ✅ Frontend components for all platforms

---

## Need Help?

**Can't find something?**
- Reference ID: Settings → General → Reference ID
- API Keys: Settings → API → Project API keys
- Project URL: Settings → API → Project URL

**Supabase taking too long?**
- Project initialization takes ~2 minutes
- If it's been >5 minutes, refresh the page

**Lost your password?**
- You can reset it from the dashboard
- The database password is separate from your Supabase account password

---

## Ready to Continue?

Once you have your `.env` file set up with all the credentials, just let me know and I'll take care of the rest! 🚀

# BoyFanz Deployment Fix

**Service ID:** srv-d43icaemcj7s73b4c750
**URL:** https://boyfanzv1.onrender.com
**Current Status:** 502 Bad Gateway (FAILING)
**Last Updated:** 2025-11-03 15:45 UTC

---

## Problem

BoyFanz is returning **502 Bad Gateway** because the service is misconfigured to use **Docker** when it should use **Node.js**.

### Current Configuration (WRONG)
```
Runtime: Docker
Repository: https://github.com/FanzCEO/BoyFanzV1
Dockerfile Path: ./Dockerfile
Docker Command: (empty)
```

### Expected Configuration (CORRECT)
```
Runtime: Node
Repository: https://github.com/FanzCEO/BoyFanzV1
Build Command: npm install && npm run build
Start Command: npm start
```

---

## How to Fix

### Step 1: Open Service Settings

Go to: https://dashboard.render.com/web/srv-d43icaemcj7s73b4c750/settings

### Step 2: Change Runtime

1. Scroll to **Environment** section
2. Change **Runtime** from `Docker` to `Node`
3. This will reveal Node-specific settings

### Step 3: Configure Build & Start Commands

Based on typical Next.js/React applications, use these commands:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | 18.x or higher (auto-detected from package.json) |

**Alternative build commands to try if the above doesn't work:**
- `npm install --production=false && npm run build`
- `pnpm install && pnpm run build`
- `yarn install && yarn build`

### Step 4: Add Environment Variables

BoyFanz likely needs these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Standard for production |
| `SUPABASE_URL` | `https://mcayxybcgxhfttvwmhgm.supabase.co` | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase dashboard)* | Get from Supabase > Settings > API |
| `SUPABASE_ANON_KEY` | *(from Supabase dashboard)* | Public anonymous key |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mcayxybcgxhfttvwmhgm.supabase.co` | If using Next.js |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(from Supabase dashboard)* | If using Next.js |

**Where to get Supabase keys:**
1. Go to https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm
2. Click **Settings** > **API**
3. Copy the values:
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` key (public) → `SUPABASE_ANON_KEY`

### Step 5: Save and Deploy

1. Click **Save Changes** at the bottom
2. Render will automatically trigger a new deployment
3. Watch the **Logs** tab for build progress

---

## Verification Steps

Once the service is redeployed, verify it's working:

### 1. Check HTTP Status
```bash
curl -I https://boyfanzv1.onrender.com
```

**Expected:** `HTTP/2 200 OK` (or 301/302 redirect)
**NOT:** `HTTP/2 502` (bad gateway)

### 2. Check Service Logs

Go to: https://dashboard.render.com/web/srv-d43icaemcj7s73b4c750/logs

**Look for:**
- ✅ `Build successful`
- ✅ `Server listening on port 10000` (or similar)
- ✅ No error messages about missing modules or database connections

### 3. Visit the Website

Open: https://boyfanzv1.onrender.com

**Expected:** The BoyFanz homepage loads (even if there's a login screen or "under construction" page)
**NOT:** Render error page with 502

---

## Common Issues & Solutions

### Issue 1: "Module not found" errors during build

**Solution:** Check if using the correct package manager
- If `package-lock.json` exists → use `npm`
- If `pnpm-lock.yaml` exists → use `pnpm`
- If `yarn.lock` exists → use `yarn`

### Issue 2: Build succeeds but app crashes on start

**Problem:** Missing environment variables

**Solution:** Check the start logs for error messages like:
- "SUPABASE_URL is required"
- "Database connection failed"
- "Invalid API key"

Add the missing environment variables and redeploy.

### Issue 3: Port binding errors

**Problem:** App is trying to listen on wrong port

**Solution:** Render uses port 10000. Ensure the app uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

If the codebase doesn't respect `PORT` env var, you may need to update the start command:
```
PORT=10000 npm start
```

---

## If You Don't Know the Build/Start Commands

If you're unsure what commands BoyFanz uses, check the repository:

1. **Look for package.json scripts:**
   ```bash
   cat package.json | grep -A 5 "scripts"
   ```

2. **Common patterns:**
   - **Next.js:** `next build` / `next start`
   - **React (CRA):** `react-scripts build` / `serve -s build`
   - **Vite:** `vite build` / `vite preview`
   - **Express:** `npm start` (usually no build step)

3. **Check for README.md** with deployment instructions

---

## Related Services

Other FANZ services using Node.js (correctly configured):

- **FanzDash** (srv-d426qg3ipnbc73c3fea0): Node.js ✅
- **FanzDash-v2** (srv-d4273qjuibrs73coc1k0): Node.js ✅
- **Queue Worker** (srv-d44bsj6uk2gs73a5e3r0): Node.js ✅

BoyFanz should follow the same pattern as these services.

---

## Quick Reference Links

- **BoyFanz Service Dashboard:** https://dashboard.render.com/web/srv-d43icaemcj7s73b4c750
- **BoyFanz Settings:** https://dashboard.render.com/web/srv-d43icaemcj7s73b4c750/settings
- **BoyFanz Logs:** https://dashboard.render.com/web/srv-d43icaemcj7s73b4c750/logs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm
- **GitHub Repository:** https://github.com/FanzCEO/BoyFanzV1

---

## Success Criteria

BoyFanz deployment is successful when:

- ✅ Service uses **Node.js runtime** (not Docker)
- ✅ Build completes without errors
- ✅ App starts and listens on port 10000
- ✅ Website returns HTTP 200 (not 502)
- ✅ Homepage loads in browser
- ✅ Database connection works (if applicable)

---

**Next Step:** Update the Render service configuration following the steps above, then check back for verification.

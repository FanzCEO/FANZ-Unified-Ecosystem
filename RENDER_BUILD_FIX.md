# 🔧 Render Build Fix - FANZ Unified Ecosystem

> **Quick fix for the initial build failure**

---

## ⚠️ Issue

The initial deployment failed because the build/start commands need to be adjusted for the repository structure.

**Error:** Build failed - TypeScript files not compiled or incorrect start path

---

## 🛠️ Solution

Update the build and start commands in Render dashboard:

### Step 1: Go to Service Settings
```
https://dashboard.render.com/web/srv-d4389oali9vc73cn5un0/settings
```

### Step 2: Update Build Command

**Current (Incorrect):**
```bash
pnpm install && pnpm build
```

**New (Correct) Options:**

#### Option A: If backend has its own package.json
```bash
cd backend && pnpm install && pnpm build
```

#### Option B: If using root-level build
```bash
pnpm install && pnpm run build
```

#### Option C: If no TypeScript compilation needed
```bash
pnpm install
```

### Step 3: Update Start Command

**Current (Incorrect):**
```bash
cd backend && node dist/index.js
```

**New (Correct) Options:**

#### Option A: If using compiled TypeScript
```bash
cd backend && node dist/server.js
```

#### Option B: If using ts-node (development)
```bash
cd backend && pnpm start
```

#### Option C: If backend/server.js exists
```bash
node backend/server.js
```

#### Option D: If src/index.ts exists
```bash
node dist/src/index.js
```

---

## 🎯 Quick Fix Steps

### Recommended Approach:

1. **Check your repository structure:**
   - Does `backend/` have its own `package.json`?
   - Where is the main entry point? (`server.js`, `index.js`, `app.js`?)
   - Is TypeScript compiled to `dist/` or `build/`?

2. **Update Render settings:**
   - Go to https://dashboard.render.com/web/srv-d4389oali9vc73cn5un0/settings
   - Scroll to "Build & Deploy"
   - Update **Build Command**
   - Update **Start Command**
   - Click "Save Changes"

3. **Trigger manual deploy:**
   - Go to https://dashboard.render.com/web/srv-d4389oali9vc73cn5un0
   - Click "Manual Deploy" → "Deploy latest commit"

---

## 📋 Alternative: Use render.yaml

Create a `render.yaml` file in your repository root:

```yaml
services:
  - type: web
    name: fanz-unified-ecosystem
    runtime: node
    region: oregon
    plan: starter
    branch: main
    buildCommand: pnpm install && pnpm run build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false  # Set in dashboard
      - key: SUPABASE_URL
        sync: false
      # ... other env vars
```

---

## 🔍 Debugging Build Failures

### View Build Logs
```
https://dashboard.render.com/web/srv-d4389oali9vc73cn5un0/logs
```

### Common Issues:

#### 1. Missing Dependencies
```
Error: Cannot find module 'express'
```
**Fix:** Add missing packages to `package.json`

#### 2. TypeScript Not Compiling
```
Error: TS2304: Cannot find name 'type'
```
**Fix:** Check `tsconfig.json` configuration

#### 3. Wrong Entry Point
```
Error: Cannot find module './dist/index.js'
```
**Fix:** Verify the compiled output location

#### 4. pnpm Not Installed
```
Error: pnpm: command not found
```
**Fix:** Use `npm` instead or ensure pnpm is in package.json

---

## ✅ Recommended Configuration

### For TypeScript Project:

**package.json** (root):
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  }
}
```

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm start
```

### For JavaScript Project:

**package.json**:
```json
{
  "scripts": {
    "start": "node src/index.js"
  },
  "main": "src/index.js"
}
```

**Build Command:**
```bash
pnpm install
```

**Start Command:**
```bash
pnpm start
```

---

## 🚀 After Fixing

Once you update the build/start commands:

1. Save changes in Render dashboard
2. Trigger a new deployment
3. Monitor build logs
4. Test the endpoint:
   ```bash
   curl https://fanz-unified-ecosystem.onrender.com/healthz
   ```

---

## 📞 Need Help?

1. Check the **build logs** in Render dashboard
2. Verify the **repository structure** on GitHub
3. Test the build **locally**:
   ```bash
   cd /path/to/FANZ-Unified-Ecosystem
   pnpm install
   pnpm run build
   pnpm start
   ```

---

## 🎯 Expected Result

After fixing, you should see:

```
Build: Success ✅
Deploy: Success ✅
Service: Running ✅
Health Check: Passing ✅
```

Visit: https://fanz-unified-ecosystem.onrender.com/healthz

---

**Service:** fanz-unified-ecosystem  
**Dashboard:** https://dashboard.render.com/web/srv-d4389oali9vc73cn5un0  
**Status:** Waiting for build command fix


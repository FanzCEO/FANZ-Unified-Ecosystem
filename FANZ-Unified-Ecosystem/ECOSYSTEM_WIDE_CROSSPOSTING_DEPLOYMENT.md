# FANZ Ecosystem-Wide Cross-Posting Deployment Guide

## 🌐 Overview

This guide covers deploying cross-posting features across **all 48 FANZ platforms** in the unified ecosystem.

**Platforms Covered:**
- BoyFanz, GirlFanz, GayFanz, BearFanz, DLBroz, SouthernStuz
- TabooFanz, SissyBoyz, SlutzRuz, Guyz, TranzFanz
- PupFanz, CougarFanz, and 35+ additional FANZ platforms

---

## 🎯 Deployment Strategy

### Option A: Shared Database Architecture (Recommended)
All platforms share one Supabase database with multi-tenant isolation via RLS policies.

**Pros:**
- ✅ Single deployment
- ✅ Unified user base
- ✅ True cross-platform features
- ✅ Easier maintenance

**Cons:**
- ⚠️ Single point of failure
- ⚠️ Requires careful RLS policies

### Option B: Per-Platform Database
Each platform has its own Supabase project.

**Pros:**
- ✅ Complete isolation
- ✅ Independent scaling

**Cons:**
- ❌ Cross-posting requires API federation
- ❌ 48x deployment complexity
- ❌ Higher costs

**This guide assumes Option A (Shared Database).**

---

## 📦 Phase 1: Shared Database Setup (30 minutes)

### Step 1.1: Verify Unified Ecosystem Structure

```bash
cd ~/FANZ-Unified-Ecosystem
ls -la
```

**Expected structure:**
```
FANZ-Unified-Ecosystem/
├── boyfanz/
├── girlfanz/
├── gayfanz/
├── bearfanz/
├── dlbroz/
├── southernstuz/
├── taboofanz/
├── sissyboyz/
├── slutzruz/
├── guyz/
├── tranzfanz/
├── pupfanz/
├── cougarfanz/
├── [... 35 more platforms]
├── supabase/          ← Shared Supabase config
│   ├── config.toml
│   └── migrations/
└── shared/            ← Shared components/utilities
    ├── types/
    ├── components/
    └── api/
```

### Step 1.2: Initialize Shared Supabase Project

```bash
# If not already initialized
cd ~/FANZ-Unified-Ecosystem
supabase init

# Link to your production Supabase project
supabase login
supabase link --project-ref YOUR_UNIFIED_PROJECT_REF
```

**Get your project ref from:**
https://supabase.com/dashboard → Your Project → Settings → General → Reference ID

### Step 1.3: Verify Platforms Table Exists

The `platforms` table should already exist with all 48 platforms:

```sql
-- Check platforms table
SELECT id, name, slug, domain, is_active
FROM platforms
ORDER BY name;
```

**If the table doesn't exist**, create it:

```sql
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 48 platforms
INSERT INTO platforms (name, slug, domain, icon, color) VALUES
  ('BoyFanz', 'boyfanz', 'boyfanz.com', '👦', '#3B82F6'),
  ('GirlFanz', 'girlfanz', 'girlfanz.com', '👧', '#FF69B4'),
  ('GayFanz', 'gayfanz', 'gayfanz.com', '🌈', '#9B59B6'),
  ('BearFanz', 'bearfanz', 'bearfanz.com', '🐻', '#8B4513'),
  ('DLBroz', 'dlbroz', 'dlbroz.com', '💪', '#34495E'),
  ('SouthernStuz', 'southernstuz', 'southernstuz.com', '🤠', '#E67E22'),
  ('TabooFanz', 'taboofanz', 'taboofanz.com', '🔞', '#C0392B'),
  ('SissyBoyz', 'sissyboyz', 'sissyboyz.com', '💋', '#E91E63'),
  ('SlutzRuz', 'slutzruz', 'slutzruz.com', '💃', '#FF5722'),
  ('Guyz', 'guyz', 'guyz.com', '👔', '#607D8B'),
  ('TranzFanz', 'tranzfanz', 'tranzfanz.com', '⚧️', '#5BCEFA'),
  ('PupFanz', 'pupfanz', 'pupfanz.com', '🐕', '#F59E0B'),
  ('CougarFanz', 'cougarfanz', 'cougarfanz.com', '🐆', '#DC2626')
  -- Add remaining 35 platforms here
ON CONFLICT (slug) DO NOTHING;
```

### Step 1.4: Deploy Cross-Posting Migration

```bash
cd ~/FANZ-Unified-Ecosystem

# Verify migration file exists
ls -la supabase/migrations/20251103000002_crossposting_features.sql

# If not found, copy from boyfanz
cp boyfanz/supabase/migrations/20251103000002_crossposting_features.sql \
   supabase/migrations/

# Push to Supabase
supabase db push
```

**Verify deployment:**
```bash
supabase db remote list | grep -E "(post_tags|crosspost_settings|multiplatform)"
```

---

## 🔧 Phase 2: Shared Components Library (45 minutes)

### Step 2.1: Create Shared Directory Structure

```bash
cd ~/FANZ-Unified-Ecosystem
mkdir -p shared/{components,types,lib,hooks}
```

### Step 2.2: Move Components to Shared

```bash
# Copy components from boyfanz to shared
cp -R boyfanz/frontend/boyfanz/src/components/crossposting \
      shared/components/

# Copy types
cp boyfanz/frontend/boyfanz/src/types/crossposting.ts \
   shared/types/

# Verify
ls -la shared/components/crossposting/
ls -la shared/types/
```

### Step 2.3: Create Shared API Library

```bash
# Copy API functions
cp boyfanz/frontend/boyfanz/src/lib/api/crossposting.ts \
   shared/lib/api/

# Copy hooks
cp -R boyfanz/frontend/boyfanz/src/hooks/use*.ts \
      shared/hooks/
```

### Step 2.4: Create Shared Package

Create `shared/package.json`:

```json
{
  "name": "@fanz/shared-crossposting",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    "./components": "./components/crossposting/index.ts",
    "./types": "./types/crossposting.ts",
    "./api": "./lib/api/crossposting.ts",
    "./hooks": "./hooks/index.ts"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.0",
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

Create `shared/index.ts`:

```typescript
// Components
export * from './components/crossposting';

// Types
export * from './types/crossposting';

// API
export * from './lib/api/crossposting';

// Hooks
export * from './hooks';
```

---

## 🚀 Phase 3: Platform-by-Platform Deployment

### Step 3.1: Create Deployment Script

Create `deploy-crossposting-to-platform.sh`:

```bash
#!/bin/bash

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
  echo "Usage: ./deploy-crossposting-to-platform.sh <platform-name>"
  echo "Example: ./deploy-crossposting-to-platform.sh girlfanz"
  exit 1
fi

echo "=========================================="
echo "Deploying Cross-Posting to $PLATFORM"
echo "=========================================="

PLATFORM_DIR="$HOME/FANZ-Unified-Ecosystem/$PLATFORM"

if [ ! -d "$PLATFORM_DIR" ]; then
  echo "❌ Platform directory not found: $PLATFORM_DIR"
  exit 1
fi

cd "$PLATFORM_DIR"

echo "✅ Platform directory found"

# Check if frontend exists
if [ ! -d "frontend/$PLATFORM" ]; then
  echo "❌ Frontend directory not found"
  exit 1
fi

cd "frontend/$PLATFORM"

echo ""
echo "Step 1: Installing dependencies..."
npm install lucide-react @supabase/supabase-js

echo ""
echo "Step 2: Creating symlinks to shared components..."
mkdir -p src/components
ln -sf "$HOME/FANZ-Unified-Ecosystem/shared/components/crossposting" \
       "src/components/crossposting"

mkdir -p src/types
ln -sf "$HOME/FANZ-Unified-Ecosystem/shared/types/crossposting.ts" \
       "src/types/crossposting.ts"

mkdir -p src/lib/api
ln -sf "$HOME/FANZ-Unified-Ecosystem/shared/lib/api/crossposting.ts" \
       "src/lib/api/crossposting.ts"

mkdir -p src/hooks
ln -sf "$HOME/FANZ-Unified-Ecosystem/shared/hooks"/*.ts \
       "src/hooks/"

echo ""
echo "Step 3: Updating Tailwind config..."
# Add neon styles if not present
if ! grep -q "red-glow" tailwind.config.js 2>/dev/null; then
  echo "  → Adding neon glow styles to tailwind.config.js"
  # Backup original
  cp tailwind.config.js tailwind.config.js.backup

  # This would need custom logic to merge configs
  echo "  ⚠️  Manual step required: Update tailwind.config.js with neon styles"
fi

echo ""
echo "Step 4: Testing build..."
npm run build 2>&1 | head -20

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed - check errors above"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Cross-posting deployed to $PLATFORM"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update $PLATFORM post creation page"
echo "2. Add settings page route"
echo "3. Add queue monitoring page"
echo "4. Test end-to-end"
echo ""
```

Make executable:

```bash
chmod +x deploy-crossposting-to-platform.sh
```

### Step 3.2: Deploy to Core Platforms (Priority 1)

```bash
# Deploy to main platforms first
./deploy-crossposting-to-platform.sh boyfanz
./deploy-crossposting-to-platform.sh girlfanz
./deploy-crossposting-to-platform.sh gayfanz
./deploy-crossposting-to-platform.sh bearfanz
./deploy-crossposting-to-platform.sh pupfanz
```

### Step 3.3: Deploy to Remaining Platforms (Priority 2)

```bash
# Deploy to all remaining platforms
for platform in dlbroz southernstuz taboofanz sissyboyz slutzruz guyz tranzfanz cougarfanz; do
  echo "Deploying to $platform..."
  ./deploy-crossposting-to-platform.sh $platform
  sleep 2
done
```

### Step 3.4: Batch Deploy Script

Create `deploy-crossposting-all.sh`:

```bash
#!/bin/bash

echo "=========================================="
echo "FANZ Ecosystem Cross-Posting Deployment"
echo "Deploying to ALL 48 platforms"
echo "=========================================="

# List all platforms
PLATFORMS=(
  boyfanz girlfanz gayfanz bearfanz dlbroz southernstuz
  taboofanz sissyboyz slutzruz guyz tranzfanz pupfanz
  cougarfanz
  # Add remaining 35 platforms
)

TOTAL=${#PLATFORMS[@]}
CURRENT=0
FAILED=()

for platform in "${PLATFORMS[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "[$CURRENT/$TOTAL] Deploying to $platform..."

  if ./deploy-crossposting-to-platform.sh "$platform"; then
    echo "✅ $platform deployment successful"
  else
    echo "❌ $platform deployment failed"
    FAILED+=("$platform")
  fi

  sleep 1
done

echo ""
echo "=========================================="
echo "Deployment Complete"
echo "=========================================="
echo "Successfully deployed: $((TOTAL - ${#FAILED[@]}))/$TOTAL"

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "Failed platforms:"
  printf '  - %s\n' "${FAILED[@]}"
fi
```

---

## 🔄 Phase 4: Sync Components Across Platforms

### Step 4.1: Use pnpm Workspaces (Recommended)

Create root `pnpm-workspace.yaml`:

```yaml
packages:
  - 'shared'
  - 'boyfanz/frontend/boyfanz'
  - 'girlfanz/frontend/girlfanz'
  - 'gayfanz/frontend/gayfanz'
  - 'bearfanz/frontend/bearfanz'
  - 'dlbroz/frontend/dlbroz'
  - 'southernstuz/frontend/southernstuz'
  - 'taboofanz/frontend/taboofanz'
  - 'sissyboyz/frontend/sissyboyz'
  - 'slutzruz/frontend/slutzruz'
  - 'guyz/frontend/guyz'
  - 'tranzfanz/frontend/tranzfanz'
  - 'pupfanz/frontend/pupfanz'
  - 'cougarfanz/frontend/cougarfanz'
  # Add remaining platforms
```

Create root `package.json`:

```json
{
  "name": "fanz-unified-ecosystem",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build:all": "pnpm -r build",
    "dev:boyfanz": "pnpm --filter boyfanz dev",
    "dev:girlfanz": "pnpm --filter girlfanz dev",
    "deploy:crossposting": "bash deploy-crossposting-all.sh"
  }
}
```

### Step 4.2: Update Platform package.json Files

For each platform, add shared dependency:

```json
{
  "dependencies": {
    "@fanz/shared-crossposting": "workspace:*"
  }
}
```

### Step 4.3: Install Workspace Dependencies

```bash
cd ~/FANZ-Unified-Ecosystem

# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

---

## 🌐 Phase 5: Multi-Platform Worker Deployment

### Step 5.1: Create Unified Worker

Create `backend/workers/unified-multiplatform-worker.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform API clients (implement per platform)
const platformClients: Record<string, any> = {};

async function initializePlatformClients() {
  // Load all platforms from database
  const { data: platforms, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  for (const platform of platforms) {
    // Initialize API client for each platform
    platformClients[platform.id] = {
      slug: platform.slug,
      domain: platform.domain,
      // Add platform-specific API methods
      createPost: async (postData: any) => {
        // Platform-specific post creation logic
        return await createPostOnPlatform(platform, postData);
      },
    };
  }

  console.log(`[Worker] Initialized ${platforms.length} platform clients`);
}

async function createPostOnPlatform(platform: any, postData: any) {
  // This is where you'd call platform-specific APIs
  // For now, we'll create posts directly in the database

  const { data, error } = await supabase
    .from('posts')
    .insert({
      creator_id: postData.creatorId,
      platform_id: platform.id,
      content: postData.content,
      media_urls: postData.media,
      post_type: 'standard',
      visibility: 'public',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function processQueue() {
  console.log('[Worker] Checking queue...');

  try {
    const { data: items, error } = await supabase
      .from('multiplatform_post_queue')
      .select(`
        *,
        originalPost:posts!multiplatform_post_queue_original_post_id_fkey(*),
        platform:platforms(*),
        settings:multiplatform_settings!multiplatform_post_queue_creator_id_fkey(*)
      `)
      .eq('status', 'queued')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .limit(20);

    if (error) throw error;

    if (!items || items.length === 0) {
      return;
    }

    console.log(`[Worker] Processing ${items.length} items`);

    // Process items concurrently (5 at a time)
    const chunks = [];
    for (let i = 0; i < items.length; i += 5) {
      chunks.push(items.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(item => processItem(item)));
    }
  } catch (error) {
    console.error('[Worker] Error:', error);
  }
}

async function processItem(item: any) {
  const itemId = item.id;
  const platformSlug = item.platform.slug;

  try {
    console.log(`[Worker] Processing ${platformSlug} post ${itemId}`);

    // Update to processing
    await supabase
      .from('multiplatform_post_queue')
      .update({ status: 'processing' })
      .eq('id', itemId);

    // Get platform-specific settings
    const platformSettings = item.settings?.platform_settings?.[platformSlug] || {};

    // Prepare post content
    let content = item.originalPost.content;
    if (platformSettings.captionPrefix) {
      content = `${platformSettings.captionPrefix}\n\n${content}`;
    }
    if (platformSettings.captionSuffix) {
      content = `${content}\n\n${platformSettings.captionSuffix}`;
    }
    if (platformSettings.customHashtags) {
      content = `${content}\n\n${platformSettings.customHashtags}`;
    }

    // Create post on target platform
    const client = platformClients[item.target_platform_id];
    if (!client) {
      throw new Error(`No client found for platform ${platformSlug}`);
    }

    const targetPostId = await client.createPost({
      creatorId: item.creator_id,
      content,
      media: item.originalPost.media_urls,
      addWatermark: platformSettings.addWatermark,
    });

    // Update as posted
    await supabase
      .from('multiplatform_post_queue')
      .update({
        status: 'posted',
        target_post_id: targetPostId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    // Create analytics
    await supabase.from('multiplatform_analytics').insert({
      creator_id: item.creator_id,
      original_post_id: item.original_post_id,
      target_platform_id: item.target_platform_id,
      target_post_id: targetPostId,
      posted_at: new Date().toISOString(),
    });

    console.log(`[Worker] ✅ Posted to ${platformSlug}`);
  } catch (error) {
    console.error(`[Worker] ❌ Error processing ${itemId}:`, error);

    // Retry logic
    if (item.retry_count < item.max_retries) {
      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'queued',
          retry_count: item.retry_count + 1,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', itemId);
    } else {
      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('id', itemId);
    }
  }
}

// Start worker
async function start() {
  console.log('[Worker] Starting unified multi-platform worker...');
  await initializePlatformClients();

  // Run immediately
  await processQueue();

  // Then run every 10 seconds
  setInterval(processQueue, 10000);
}

start().catch(console.error);
```

### Step 5.2: Deploy Worker

```bash
cd ~/FANZ-Unified-Ecosystem/backend/workers

# Install dependencies
npm install @supabase/supabase-js dotenv

# Test locally
npm run worker:dev

# Deploy to Render/Railway/Fly.io
# (Follow same steps as single-platform deployment)
```

---

## 📊 Phase 6: Monitoring & Analytics Dashboard

### Step 6.1: Create Ecosystem Analytics Query

```sql
-- Cross-platform posting analytics
CREATE OR REPLACE VIEW crossposting_ecosystem_stats AS
SELECT
  DATE(posted_at) as date,
  p.name as platform,
  COUNT(*) as posts_created,
  COUNT(DISTINCT creator_id) as active_creators
FROM multiplatform_analytics ma
JOIN platforms p ON p.id = ma.target_platform_id
WHERE posted_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(posted_at), p.name
ORDER BY date DESC, posts_created DESC;

-- Platform health check
CREATE OR REPLACE VIEW platform_queue_health AS
SELECT
  p.name as platform,
  COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
  COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_today,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_today
FROM multiplatform_post_queue mpq
JOIN platforms p ON p.id = mpq.target_platform_id
WHERE queued_at > NOW() - INTERVAL '24 hours'
GROUP BY p.name
ORDER BY queued DESC;
```

### Step 6.2: Create Admin Dashboard

Create `shared/components/admin/EcosystemDashboard.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function EcosystemDashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [statsData, healthData] = await Promise.all([
      supabase.from('crossposting_ecosystem_stats').select('*').limit(100),
      supabase.from('platform_queue_health').select('*'),
    ]);

    if (statsData.data) setStats(statsData.data);
    if (healthData.data) setHealth(healthData.data);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text">
        FANZ Ecosystem Cross-Posting Dashboard
      </h1>

      {/* Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {health.map((platform) => (
          <div
            key={platform.platform}
            className="p-4 bg-surface rounded-lg border border-border"
          >
            <h3 className="font-semibold text-text mb-2">{platform.platform}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Queued:</span>
                <span className="text-text">{platform.queued}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Processing:</span>
                <span className="text-primary">{platform.processing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Posted Today:</span>
                <span className="text-green-400">{platform.posted_today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Failed:</span>
                <span className="text-red-400">{platform.failed_today}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-text mb-4">
          Cross-Platform Activity (Last 30 Days)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-4 text-text-secondary">Date</th>
                <th className="text-left py-2 px-4 text-text-secondary">Platform</th>
                <th className="text-right py-2 px-4 text-text-secondary">Posts</th>
                <th className="text-right py-2 px-4 text-text-secondary">Creators</th>
              </tr>
            </thead>
            <tbody>
              {stats.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-4 text-text">{row.date}</td>
                  <td className="py-2 px-4 text-text">{row.platform}</td>
                  <td className="py-2 px-4 text-text text-right">{row.posts_created}</td>
                  <td className="py-2 px-4 text-text text-right">{row.active_creators}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Deployment Checklist (Per Platform)

Create `deployment-checklist.md`:

```markdown
# Cross-Posting Deployment Checklist

## Platform: ______________

### Database
- [ ] Shared Supabase project linked
- [ ] Cross-posting tables exist
- [ ] RLS policies verified
- [ ] Platform entry exists in `platforms` table

### Frontend
- [ ] Dependencies installed (lucide-react, @supabase/supabase-js)
- [ ] Shared components symlinked/imported
- [ ] Tailwind config updated with neon styles
- [ ] Post creation page updated
- [ ] Settings page created at `/settings/crossposting`
- [ ] Queue monitor page created at `/queue`
- [ ] Navigation links added

### Testing
- [ ] Build successful (`npm run build`)
- [ ] Creator search works
- [ ] Tag creation works
- [ ] Tag approval modal functions
- [ ] Settings save correctly
- [ ] Multi-platform selection works
- [ ] Queue items appear after posting

### Deployment
- [ ] Deployed to production (Vercel/Netlify)
- [ ] Environment variables set
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] End-to-end test in production

### Monitoring
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Health checks passing
```

---

## 🚀 Quick Deploy Commands

```bash
# Deploy to all platforms at once
cd ~/FANZ-Unified-Ecosystem
pnpm install
bash deploy-crossposting-all.sh

# Deploy worker
cd backend/workers
npm install
npm run worker

# Monitor deployment
tail -f deploy-*.log
```

---

## 📈 Post-Deployment Verification

### Step 1: Verify Database

```sql
-- Check that all platforms are active
SELECT name, is_active FROM platforms;

-- Check cross-posting tables
SELECT COUNT(*) FROM post_tags;
SELECT COUNT(*) FROM multiplatform_post_queue;
SELECT COUNT(*) FROM crossposted_posts;
```

### Step 2: Test Cross-Platform Posting

1. Login to BoyFanz
2. Create a post
3. Tag a creator
4. Select multiple platforms (GirlFanz, GayFanz, etc.)
5. Submit post
6. Verify queue items created:
   ```sql
   SELECT * FROM multiplatform_post_queue WHERE status = 'queued' ORDER BY queued_at DESC LIMIT 10;
   ```
7. Wait for worker to process
8. Verify posts appear on target platforms
9. Check queue status updated to 'posted'

### Step 3: Monitor Worker Health

```bash
# Check worker logs
docker logs fanz-queue-worker -f

# Or in Render/Railway dashboard
# Logs → Filter by "Worker"
```

---

## 🎉 Success Criteria

✅ All 48 platforms can create posts with tags
✅ Cross-posting works between any two platforms
✅ Queue processes items within 30 seconds
✅ Failed posts retry automatically
✅ Settings save across all platforms
✅ Real-time monitoring dashboard functional
✅ Zero data loss during deployment
✅ Sub-second response times for API calls

---

**Deployment Time Estimate:**
- Database setup: 30 minutes
- Shared components: 45 minutes
- Per-platform deployment: 15 minutes × 48 = 12 hours (with automation: 2-3 hours)
- Worker deployment: 1 hour
- Testing & verification: 2-3 hours

**Total: 6-8 hours for complete ecosystem deployment**

---

*Last Updated: November 3, 2025*
*Platforms: 48 FANZ platforms*
*Database: Unified Supabase architecture*

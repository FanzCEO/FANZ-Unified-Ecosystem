# Cross-Posting Features - Step-by-Step Deployment Guide

## 🎯 Overview

This guide will walk you through deploying the complete cross-posting features to production. Follow each step carefully in order.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or pnpm package manager
- [ ] Git access to BoyFanzV1 repository
- [ ] Supabase account and project created
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Access to production environment variables
- [ ] Code editor (VS Code, Cursor, etc.)

---

## 🗄️ Phase 1: Database Deployment (15-20 minutes)

### Step 1.1: Connect to Supabase Project

```bash
# Navigate to your project directory
cd ~/FANZ-Unified-Ecosystem/boyfanz

# Login to Supabase (if not already logged in)
supabase login

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project ref:**
1. Go to https://supabase.com/dashboard
2. Select your BoyFanz project
3. Go to Settings → General
4. Copy the "Reference ID"

### Step 1.2: Verify Migration File Exists

```bash
# Check that the migration file exists
ls -la supabase/migrations/20251103000002_crossposting_features.sql
```

**Expected output:**
```
-rw-r--r--  1 user  staff  26845 Nov  3 12:00 20251103000002_crossposting_features.sql
```

### Step 1.3: Review Migration (Optional but Recommended)

```bash
# View the migration file to understand what will be deployed
cat supabase/migrations/20251103000002_crossposting_features.sql | head -50
```

This creates:
- 6 new tables
- 14 RLS policies
- 3 trigger functions

### Step 1.4: Push Migration to Supabase

```bash
# Push the migration to your Supabase database
supabase db push
```

**Expected output:**
```
Applying migration 20251103000002_crossposting_features.sql...
Migration applied successfully.
```

### Step 1.5: Verify Database Tables

```bash
# Check that tables were created
supabase db remote list
```

**Or check in Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Table Editor
4. Verify these tables exist:
   - `post_tags`
   - `creator_crosspost_settings`
   - `crossposted_posts`
   - `multiplatform_settings`
   - `multiplatform_post_queue`
   - `multiplatform_analytics`

### Step 1.6: Verify RLS Policies

1. In Supabase Dashboard → Authentication → Policies
2. Check that each new table has policies (should see ~2-3 per table)
3. Verify policies reference `auth.uid()` for user isolation

---

## 📦 Phase 2: Frontend Dependencies (5 minutes)

### Step 2.1: Navigate to Frontend Directory

```bash
cd ~/FANZ-Unified-Ecosystem/boyfanz/frontend/boyfanz
```

### Step 2.2: Install Required Dependencies

```bash
# Install lucide-react for icons (if not already installed)
npm install lucide-react

# Or if using pnpm
pnpm install lucide-react
```

### Step 2.3: Verify Components Exist

```bash
# Check that all component files are present
ls -la src/components/crossposting/
```

**Expected files:**
- CreatorTagInput.tsx
- TagApprovalModal.tsx
- CrosspostSettingsPanel.tsx
- MultiplatformSettingsPanel.tsx
- PlatformSelector.tsx
- QueueStatusMonitor.tsx
- index.ts

### Step 2.4: Verify Type Definitions

```bash
# Check that type definitions exist
ls -la src/types/crossposting.ts
```

---

## 🔧 Phase 3: API Layer Implementation (30-45 minutes)

### Step 3.1: Create API Service File

```bash
# Create the API directory if it doesn't exist
mkdir -p src/lib/api

# Create the crossposting API file
touch src/lib/api/crossposting.ts
```

### Step 3.2: Implement API Functions

Create/edit `src/lib/api/crossposting.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import type {
  Creator,
  PostTag,
  CreatorCrosspostSettings,
  MultiplatformSettings,
  MultiplatformQueueItemWithDetails,
} from '@/types/crossposting';

// ============================================
// CREATOR SEARCH
// ============================================

export async function searchCreators(query: string): Promise<Creator[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_verified')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;

  return data.map((profile) => ({
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    isVerified: profile.is_verified,
  }));
}

// ============================================
// POST TAGGING
// ============================================

export async function createPostTag(
  postId: string,
  creatorIds: string[]
): Promise<void> {
  const { error } = await supabase.from('post_tags').insert(
    creatorIds.map((creatorId) => ({
      post_id: postId,
      tagged_creator_id: creatorId,
    }))
  );

  if (error) throw error;
}

// ============================================
// PENDING TAGS
// ============================================

export async function getPendingTags(): Promise<PostTag[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('post_tags')
    .select(`
      *,
      post:posts(*),
      taggedByCreator:profiles!post_tags_tagged_by_creator_id_fkey(*)
    `)
    .eq('tagged_creator_id', user.user.id)
    .eq('status', 'pending')
    .order('tagged_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// TAG APPROVAL/REJECTION
// ============================================

export async function approveRejectTag(
  tagId: string,
  payload: { action: 'approve' | 'reject'; rejectionReason?: string }
): Promise<void> {
  const updates: any = {
    status: payload.action === 'approve' ? 'approved' : 'rejected',
  };

  if (payload.action === 'approve') {
    updates.approved_at = new Date().toISOString();
    updates.is_visible_on_tagged_wall = true;
  } else {
    updates.rejected_at = new Date().toISOString();
    updates.rejection_reason = payload.rejectionReason;
  }

  const { error } = await supabase
    .from('post_tags')
    .update(updates)
    .eq('id', tagId);

  if (error) throw error;
}

// ============================================
// CROSSPOST SETTINGS
// ============================================

export async function getCrosspostSettings(): Promise<CreatorCrosspostSettings> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('creator_crosspost_settings')
    .select('*')
    .eq('creator_id', user.user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Return default settings if none exist
  if (!data) {
    return {
      id: '',
      creatorId: user.user.id,
      autoApproveAllTags: false,
      autoApproveFromFollowing: false,
      autoApproveFromSubscribers: false,
      autoApproveFromVerified: false,
      notifyOnTag: true,
      notifyOnApprovalNeeded: true,
      blockedCreatorIds: [],
      alwaysApproveCreatorIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    autoApproveAllTags: data.auto_approve_all_tags,
    autoApproveFromFollowing: data.auto_approve_from_following,
    autoApproveFromSubscribers: data.auto_approve_from_subscribers,
    autoApproveFromVerified: data.auto_approve_from_verified,
    notifyOnTag: data.notify_on_tag,
    notifyOnApprovalNeeded: data.notify_on_approval_needed,
    blockedCreatorIds: data.blocked_creator_ids || [],
    alwaysApproveCreatorIds: data.always_approve_creator_ids || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateCrosspostSettings(
  settings: Partial<CreatorCrosspostSettings>
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const payload: any = {
    creator_id: user.user.id,
  };

  if (settings.autoApproveAllTags !== undefined)
    payload.auto_approve_all_tags = settings.autoApproveAllTags;
  if (settings.autoApproveFromFollowing !== undefined)
    payload.auto_approve_from_following = settings.autoApproveFromFollowing;
  if (settings.autoApproveFromSubscribers !== undefined)
    payload.auto_approve_from_subscribers = settings.autoApproveFromSubscribers;
  if (settings.autoApproveFromVerified !== undefined)
    payload.auto_approve_from_verified = settings.autoApproveFromVerified;
  if (settings.notifyOnTag !== undefined)
    payload.notify_on_tag = settings.notifyOnTag;
  if (settings.notifyOnApprovalNeeded !== undefined)
    payload.notify_on_approval_needed = settings.notifyOnApprovalNeeded;
  if (settings.blockedCreatorIds !== undefined)
    payload.blocked_creator_ids = settings.blockedCreatorIds;
  if (settings.alwaysApproveCreatorIds !== undefined)
    payload.always_approve_creator_ids = settings.alwaysApproveCreatorIds;

  const { error } = await supabase
    .from('creator_crosspost_settings')
    .upsert(payload);

  if (error) throw error;
}

// ============================================
// MULTIPLATFORM SETTINGS
// ============================================

export async function getMultiplatformSettings(): Promise<MultiplatformSettings> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('multiplatform_settings')
    .select('*')
    .eq('creator_id', user.user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Return default settings if none exist
  if (!data) {
    return {
      id: '',
      creatorId: user.user.id,
      defaultPlatforms: [],
      autoPostEnabled: false,
      autoPostDelaySeconds: 0,
      platformSettings: {},
      notifyOnPostSuccess: true,
      notifyOnPostFailure: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    defaultPlatforms: data.default_platforms || [],
    autoPostEnabled: data.auto_post_enabled,
    autoPostDelaySeconds: data.auto_post_delay_seconds,
    platformSettings: data.platform_settings || {},
    notifyOnPostSuccess: data.notify_on_post_success,
    notifyOnPostFailure: data.notify_on_post_failure,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateMultiplatformSettings(
  settings: Partial<MultiplatformSettings>
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const payload: any = {
    creator_id: user.user.id,
  };

  if (settings.defaultPlatforms !== undefined)
    payload.default_platforms = settings.defaultPlatforms;
  if (settings.autoPostEnabled !== undefined)
    payload.auto_post_enabled = settings.autoPostEnabled;
  if (settings.autoPostDelaySeconds !== undefined)
    payload.auto_post_delay_seconds = settings.autoPostDelaySeconds;
  if (settings.platformSettings !== undefined)
    payload.platform_settings = settings.platformSettings;
  if (settings.notifyOnPostSuccess !== undefined)
    payload.notify_on_post_success = settings.notifyOnPostSuccess;
  if (settings.notifyOnPostFailure !== undefined)
    payload.notify_on_post_failure = settings.notifyOnPostFailure;

  const { error } = await supabase
    .from('multiplatform_settings')
    .upsert(payload);

  if (error) throw error;
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

export async function getMultiplatformQueue(): Promise<
  MultiplatformQueueItemWithDetails[]
> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('multiplatform_post_queue')
    .select(`
      *,
      originalPost:posts!multiplatform_post_queue_original_post_id_fkey(*),
      platform:platforms(*)
    `)
    .eq('creator_id', user.user.id)
    .order('queued_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return data.map((item) => ({
    id: item.id,
    creatorId: item.creator_id,
    originalPostId: item.original_post_id,
    targetPlatformId: item.target_platform_id,
    targetPostId: item.target_post_id,
    status: item.status,
    queuedAt: item.queued_at,
    scheduledFor: item.scheduled_for,
    processedAt: item.processed_at,
    retryCount: item.retry_count,
    maxRetries: item.max_retries,
    errorMessage: item.error_message,
    originalPost: item.originalPost,
    platform: item.platform,
  }));
}

export async function cancelQueuedPost(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('multiplatform_post_queue')
    .update({
      status: 'cancelled',
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('status', 'queued');

  if (error) throw error;
}

// ============================================
// ANALYTICS (Optional)
// ============================================

export async function getMultiplatformAnalytics() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('multiplatform_analytics')
    .select('*')
    .eq('creator_id', user.user.id)
    .order('posted_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}
```

### Step 3.3: Create Custom Hooks

Create `src/hooks/useCrosspostSettings.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  getCrosspostSettings,
  updateCrosspostSettings,
} from '@/lib/api/crossposting';
import type { CreatorCrosspostSettings } from '@/types/crossposting';

export function useCrosspostSettings() {
  const [settings, setSettings] = useState<CreatorCrosspostSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCrosspostSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const update = async (newSettings: Partial<CreatorCrosspostSettings>) => {
    await updateCrosspostSettings(newSettings);
    await loadSettings();
  };

  return { settings, loading, error, update, reload: loadSettings };
}
```

Create `src/hooks/useMultiplatformSettings.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  getMultiplatformSettings,
  updateMultiplatformSettings,
} from '@/lib/api/crossposting';
import type { MultiplatformSettings } from '@/types/crossposting';

export function useMultiplatformSettings() {
  const [settings, setSettings] = useState<MultiplatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMultiplatformSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const update = async (newSettings: Partial<MultiplatformSettings>) => {
    await updateMultiplatformSettings(newSettings);
    await loadSettings();
  };

  return { settings, loading, error, update, reload: loadSettings };
}
```

Create `src/hooks/usePendingTags.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getPendingTags } from '@/lib/api/crossposting';
import type { PostTag } from '@/types/crossposting';

export function usePendingTags() {
  const [pendingTags, setPendingTags] = useState<PostTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingTags();
      setPendingTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  return { pendingTags, loading, error, reload: loadTags };
}
```

---

## 🎨 Phase 4: Tailwind CSS Configuration (10 minutes)

### Step 4.1: Add Custom Neon Styles

Edit `tailwind.config.js` or `tailwind.config.ts`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF0000',
        accent: '#FFFFFF',
        background: '#0F0F0F',
        surface: '#1A1A1A',
        border: '#333333',
        text: {
          DEFAULT: '#FFFFFF',
          secondary: '#999999',
        },
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(255, 0, 0, 0.5)',
        'neon-border': '0 0 10px rgba(255, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
```

### Step 4.2: Add Custom CSS Classes

Create/edit `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .neon-border {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
  }

  .neon-border-subtle {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.15);
  }

  .hover\:shadow-red-glow:hover {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
  }
}
```

---

## 🔗 Phase 5: Integration into Existing Pages (20-30 minutes)

### Step 5.1: Add to Post Creation Page

Edit your post creation page (e.g., `src/app/create-post/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import {
  CreatorTagInput,
  PlatformSelector,
} from '@/components/crossposting';
import type { Creator, Platform } from '@/types/crossposting';

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  const handleSubmit = async () => {
    // Create post with tags and multi-platform
    const postData = {
      content,
      taggedCreatorIds: selectedCreators.map((c) => c.id),
      multiplatform: {
        enabled: selectedPlatforms.length > 0,
        platforms: selectedPlatforms.map((p) => p.id),
      },
    };

    // Submit to your existing post creation API
    // await createPost(postData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text">Create Post</h1>

      {/* Post content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text"
        placeholder="What's on your mind?"
        rows={4}
      />

      {/* Tag creators */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Tag Creators
        </label>
        <CreatorTagInput
          selectedCreators={selectedCreators}
          onCreatorsChange={setSelectedCreators}
          maxTags={5}
        />
      </div>

      {/* Select platforms */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Cross-post to Platforms
        </label>
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformsChange={setSelectedPlatforms}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 rounded-lg bg-primary text-accent font-semibold hover:shadow-red-glow transform hover:scale-105 transition-all duration-200"
      >
        Create Post
      </button>
    </div>
  );
}
```

### Step 5.2: Create Settings Page

Create `src/app/settings/crossposting/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  CrosspostSettingsPanel,
  MultiplatformSettingsPanel,
} from '@/components/crossposting';

export default function CrosspostingSettingsPage() {
  const [activeTab, setActiveTab] = useState<'tags' | 'platforms'>('tags');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text">Cross-Posting Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tags'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Creator Tags
        </button>
        <button
          onClick={() => setActiveTab('platforms')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'platforms'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Multi-Platform
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tags' && <CrosspostSettingsPanel />}
      {activeTab === 'platforms' && <MultiplatformSettingsPanel />}
    </div>
  );
}
```

### Step 5.3: Create Queue Monitoring Page

Create `src/app/queue/page.tsx`:

```typescript
'use client';

import { QueueStatusMonitor } from '@/components/crossposting';

export default function QueueMonitoringPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <QueueStatusMonitor autoRefresh={true} refreshInterval={10000} />
    </div>
  );
}
```

### Step 5.4: Add Navigation Links

Update your navigation component to include:

```typescript
<Link href="/settings/crossposting">Cross-Posting Settings</Link>
<Link href="/queue">Post Queue</Link>
```

---

## ⚙️ Phase 6: Environment Variables (5 minutes)

### Step 6.1: Update .env.local

Add/verify these environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs (for linking between platforms)
NEXT_PUBLIC_GIRLFANZ_URL=https://girlfanz.com
NEXT_PUBLIC_GAYFANZ_URL=https://gayfanz.com
NEXT_PUBLIC_BEARFANZ_URL=https://bearfanz.com
NEXT_PUBLIC_DLBROZ_URL=https://dlbroz.com
NEXT_PUBLIC_SOUTHERNSTUZ_URL=https://southernstuz.com
NEXT_PUBLIC_TABOOFANZ_URL=https://taboofanz.com
NEXT_PUBLIC_SISSYBOYZ_URL=https://sissyboyz.com
NEXT_PUBLIC_SLUTZRUZ_URL=https://slutzruz.com
NEXT_PUBLIC_GUYZ_URL=https://guyz.com
NEXT_PUBLIC_TRANZFANZ_URL=https://tranzfanz.com
```

---

## 🧪 Phase 7: Local Testing (20-30 minutes)

### Step 7.1: Build the Project

```bash
cd ~/FANZ-Unified-Ecosystem/boyfanz/frontend/boyfanz

# Install dependencies
npm install

# Build the project
npm run build
```

**Fix any TypeScript errors that appear.**

### Step 7.2: Start Development Server

```bash
npm run dev
```

### Step 7.3: Test Creator Tagging

1. Navigate to `/create-post` (or your post creation page)
2. Type in the creator tag input
3. Verify search results appear
4. Select a creator
5. Verify creator badge appears
6. Create a post

### Step 7.4: Test Tag Approval

1. Have another test user tag you in a post
2. Navigate to your notifications or pending tags
3. Open the tag approval modal
4. Test both approve and reject actions
5. Verify post appears on your wall after approval

### Step 7.5: Test Settings Pages

1. Navigate to `/settings/crossposting`
2. Toggle auto-approval settings
3. Add creators to whitelist/blacklist
4. Save settings
5. Verify settings persist after page refresh

### Step 7.6: Test Multi-Platform Settings

1. Go to Multi-Platform tab
2. Select default platforms
3. Configure platform-specific settings
4. Save and verify

### Step 7.7: Test Queue Monitor

1. Create a post with multiple platforms selected
2. Navigate to `/queue`
3. Verify post appears in queue
4. Watch status change from "queued" to "processing" to "posted"
5. Test cancel functionality

---

## 🔧 Phase 8: Background Worker Setup (45-60 minutes)

### Step 8.1: Create Worker Directory

```bash
mkdir -p ~/FANZ-Unified-Ecosystem/boyfanz/backend/workers
cd ~/FANZ-Unified-Ecosystem/boyfanz/backend/workers
```

### Step 8.2: Initialize Worker Project

```bash
npm init -y
npm install @supabase/supabase-js dotenv
npm install -D @types/node typescript tsx
```

### Step 8.3: Create Worker Script

Create `multiplatform-queue-worker.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QueueItem {
  id: string;
  creator_id: string;
  original_post_id: string;
  target_platform_id: string;
  scheduled_for: string | null;
  retry_count: number;
  max_retries: number;
}

// Process queued posts
async function processQueue() {
  console.log('[Queue Worker] Checking for queued posts...');

  try {
    // Get queued items that are ready to process
    const { data: items, error } = await supabase
      .from('multiplatform_post_queue')
      .select('*')
      .eq('status', 'queued')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .limit(10);

    if (error) throw error;

    if (!items || items.length === 0) {
      console.log('[Queue Worker] No items to process');
      return;
    }

    console.log(`[Queue Worker] Processing ${items.length} items`);

    for (const item of items) {
      await processItem(item as QueueItem);
    }
  } catch (error) {
    console.error('[Queue Worker] Error:', error);
  }
}

async function processItem(item: QueueItem) {
  console.log(`[Queue Worker] Processing item ${item.id}`);

  try {
    // Update status to processing
    await supabase
      .from('multiplatform_post_queue')
      .update({ status: 'processing' })
      .eq('id', item.id);

    // Get original post data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', item.original_post_id)
      .single();

    if (postError) throw postError;

    // Get target platform data
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', item.target_platform_id)
      .single();

    if (platformError) throw platformError;

    // Get creator's multiplatform settings
    const { data: settings, error: settingsError } = await supabase
      .from('multiplatform_settings')
      .select('*')
      .eq('creator_id', item.creator_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

    // Get platform-specific settings
    const platformSettings = settings?.platform_settings?.[platform.slug] || {};

    // Modify content based on platform settings
    let content = post.content;
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
    // NOTE: This requires platform-specific API implementation
    const targetPostId = await createPostOnPlatform(
      platform,
      item.creator_id,
      {
        content,
        media: post.media_urls,
        addWatermark: platformSettings.addWatermark,
      }
    );

    // Update queue item as posted
    await supabase
      .from('multiplatform_post_queue')
      .update({
        status: 'posted',
        target_post_id: targetPostId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    // Create analytics entry
    await supabase.from('multiplatform_analytics').insert({
      creator_id: item.creator_id,
      original_post_id: item.original_post_id,
      target_platform_id: item.target_platform_id,
      target_post_id: targetPostId,
      posted_at: new Date().toISOString(),
    });

    console.log(`[Queue Worker] Successfully posted to ${platform.name}`);
  } catch (error) {
    console.error(`[Queue Worker] Error processing item ${item.id}:`, error);

    // Retry logic
    if (item.retry_count < item.max_retries) {
      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'queued',
          retry_count: item.retry_count + 1,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', item.id);

      console.log(`[Queue Worker] Item ${item.id} queued for retry`);
    } else {
      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      console.log(`[Queue Worker] Item ${item.id} failed after max retries`);
    }
  }
}

// Platform-specific post creation
async function createPostOnPlatform(
  platform: any,
  creatorId: string,
  postData: any
): Promise<string> {
  // TODO: Implement platform-specific API calls
  // For now, we'll create a post directly in the database
  // In production, this should call the platform's API

  const { data, error } = await supabase
    .from('posts')
    .insert({
      creator_id: creatorId,
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

// Run worker every 10 seconds
console.log('[Queue Worker] Starting...');
setInterval(processQueue, 10000);

// Run immediately on start
processQueue();
```

### Step 8.4: Create Worker Environment File

Create `.env` in the worker directory:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 8.5: Add Worker Scripts to package.json

```json
{
  "scripts": {
    "worker": "tsx multiplatform-queue-worker.ts",
    "worker:dev": "tsx watch multiplatform-queue-worker.ts"
  }
}
```

### Step 8.6: Test Worker Locally

```bash
npm run worker:dev
```

**Expected output:**
```
[Queue Worker] Starting...
[Queue Worker] Checking for queued posts...
[Queue Worker] Processing 2 items
[Queue Worker] Processing item abc123...
[Queue Worker] Successfully posted to GayFanz
...
```

---

## 🚀 Phase 9: Production Deployment (30-45 minutes)

### Step 9.1: Deploy Frontend to Vercel

```bash
cd ~/FANZ-Unified-Ecosystem/boyfanz/frontend/boyfanz

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com
2. Import project from GitHub
3. Select `FanzCEO/BoyFanzV1` repository
4. Configure build settings:
   - Framework Preset: Next.js
   - Root Directory: `frontend/boyfanz`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables from Step 6.1
6. Deploy

### Step 9.2: Deploy Worker to Render

1. Go to https://render.com
2. Create New → Background Worker
3. Connect GitHub repository `FanzCEO/BoyFanzV1`
4. Configure:
   - Name: `boyfanz-queue-worker`
   - Environment: Node
   - Region: Choose closest to your Supabase region
   - Branch: `main`
   - Root Directory: `backend/workers`
   - Build Command: `npm install`
   - Start Command: `npm run worker`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Create Worker

### Step 9.3: Alternative - Deploy Worker to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd ~/FANZ-Unified-Ecosystem/boyfanz/backend/workers
railway init

# Deploy
railway up
```

### Step 9.4: Verify Production Deployment

1. Visit your production URL
2. Test all features:
   - [ ] Creator tagging works
   - [ ] Tag approval modal functions
   - [ ] Settings save correctly
   - [ ] Multi-platform posting queues items
   - [ ] Queue monitor shows real-time updates
   - [ ] Worker processes queue items

---

## 📊 Phase 10: Monitoring & Maintenance (Ongoing)

### Step 10.1: Set Up Database Monitoring

1. Go to Supabase Dashboard → Database → Replication
2. Enable real-time for these tables:
   - `post_tags`
   - `multiplatform_post_queue`

### Step 10.2: Set Up Error Alerts

In Render/Railway dashboard:
1. Enable email notifications for worker failures
2. Set up health checks
3. Configure auto-restart on failure

### Step 10.3: Monitor Queue Performance

Create a monitoring query in Supabase:

```sql
-- Check queue health
SELECT
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM multiplatform_post_queue
WHERE queued_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Step 10.4: Regular Maintenance Tasks

**Daily:**
- Check for failed queue items
- Monitor error logs

**Weekly:**
- Review retry patterns
- Check analytics data
- Verify RLS policies

**Monthly:**
- Archive old queue items (>30 days)
- Review and optimize database indexes

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All dependencies installed
- [ ] Database migration deployed to Supabase
- [ ] Tables and RLS policies verified
- [ ] API functions implemented
- [ ] Custom hooks created
- [ ] Tailwind config updated
- [ ] Components integrated into pages
- [ ] Environment variables configured

### Testing
- [ ] Local build successful
- [ ] Creator tagging tested
- [ ] Tag approval tested
- [ ] Settings save/load tested
- [ ] Multi-platform posting tested
- [ ] Queue monitoring tested
- [ ] Worker processing tested

### Production
- [ ] Frontend deployed to Vercel/hosting
- [ ] Worker deployed to Render/Railway
- [ ] Production environment variables set
- [ ] DNS configured (if needed)
- [ ] SSL certificates active
- [ ] Monitoring enabled
- [ ] Error alerts configured

### Post-Deployment
- [ ] End-to-end testing in production
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Support tickets ready

---

## 🆘 Troubleshooting

### Issue: "Table does not exist"
**Solution:** Run `supabase db push` again or check migration was applied

### Issue: "RLS policy violation"
**Solution:** Verify user is authenticated and policies are correct in Supabase Dashboard

### Issue: Components not rendering
**Solution:** Check that all imports use correct paths and components are exported from index.ts

### Issue: Worker not processing queue
**Solution:**
- Check worker logs for errors
- Verify environment variables are set
- Ensure worker has network access to Supabase

### Issue: TypeScript errors
**Solution:** Run `npm run build` and fix reported type errors

### Issue: Tailwind styles not applying
**Solution:**
- Verify tailwind.config.js has custom colors
- Check globals.css is imported in layout
- Clear Next.js cache: `rm -rf .next`

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hooks Documentation](https://react.dev/reference/react)

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ Full cross-posting functionality deployed
✅ Creator tagging with approval workflow
✅ Multi-platform auto-posting
✅ Real-time queue monitoring
✅ Background worker processing posts
✅ Production-ready deployment

**Welcome to the next level of FANZ platform capabilities!**

---

*Last Updated: November 3, 2025*
*Version: 1.0.0*

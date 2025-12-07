# FANZ Cross-Posting Features Guide

**Created**: November 3, 2025
**Status**: ✅ Deployed to Supabase
**Database**: ysjondxpwvfjofbneqki (BoyFanz)

---

## Overview

This guide covers two major cross-posting features that have been added to the FANZ platform:

1. **Creator Tagging & Cross-Posting**: Tag other creators in posts, with posts appearing on tagged creators' walls (like Facebook tagging)
2. **Multi-Platform Auto-Posting**: Automatically post content across multiple FANZ platforms (like Meta's Instagram/Facebook cross-posting)

---

## Feature 1: Creator Tagging & Cross-Posting

### How It Works

When a creator tags another creator in a post:
1. Tagged creator receives a notification
2. Tagged creator can approve or reject the tag
3. If approved, the post appears on BOTH creators' walls
4. Auto-approval rules can be configured

### Database Tables

#### `post_tags`
Tracks which creators are tagged in posts.

```sql
CREATE TABLE post_tags (
    id VARCHAR PRIMARY KEY,
    post_id VARCHAR NOT NULL,              -- The original post
    tagged_creator_id VARCHAR NOT NULL,     -- Who was tagged
    tagged_by_creator_id VARCHAR NOT NULL,  -- Who did the tagging
    status crosspost_status NOT NULL,       -- pending, approved, rejected, auto_approved
    is_visible_on_tagged_wall BOOLEAN,      -- Whether it shows on tagged creator's wall
    tagged_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT
);
```

#### `creator_crosspost_settings`
Creator preferences for handling tags.

```sql
CREATE TABLE creator_crosspost_settings (
    id VARCHAR PRIMARY KEY,
    creator_id VARCHAR NOT NULL UNIQUE,

    -- Auto-approval rules
    auto_approve_all_tags BOOLEAN DEFAULT false,
    auto_approve_from_following BOOLEAN DEFAULT false,
    auto_approve_from_subscribers BOOLEAN DEFAULT false,
    auto_approve_from_verified BOOLEAN DEFAULT false,

    -- Blacklist/whitelist
    blocked_creator_ids VARCHAR[],          -- Never auto-approve these creators
    always_approve_creator_ids VARCHAR[]    -- Always auto-approve these creators
);
```

#### `crossposted_posts`
Tracks posts appearing on multiple walls.

```sql
CREATE TABLE crossposted_posts (
    id VARCHAR PRIMARY KEY,
    original_post_id VARCHAR NOT NULL,
    crossposted_to_creator_id VARCHAR NOT NULL,
    post_tag_id VARCHAR NOT NULL,

    -- Display options
    show_original_creator BOOLEAN DEFAULT true,
    show_tag_badge BOOLEAN DEFAULT true,

    -- Separate analytics for cross-posted wall
    views_on_crossposted_wall INTEGER DEFAULT 0,
    likes_on_crossposted_wall INTEGER DEFAULT 0,
    comments_on_crossposted_wall INTEGER DEFAULT 0
);
```

### API Endpoints (To Implement)

#### Tag Creators in a Post

```typescript
POST /api/posts/:postId/tags

Body:
{
  "taggedCreatorIds": ["creator-uuid-1", "creator-uuid-2"]
}

Response:
{
  "success": true,
  "tags": [
    {
      "id": "tag-uuid-1",
      "postId": "post-uuid",
      "taggedCreatorId": "creator-uuid-1",
      "status": "pending"  // or "auto_approved"
    }
  ]
}
```

#### Approve/Reject a Tag

```typescript
PATCH /api/posts/tags/:tagId

Body:
{
  "action": "approve" | "reject",
  "rejectionReason": "Optional reason for rejection"
}

Response:
{
  "success": true,
  "tag": {
    "id": "tag-uuid",
    "status": "approved",
    "approvedAt": "2025-11-03T12:00:00Z"
  },
  "crosspostedPost": {
    "id": "crosspost-uuid",
    "originalPostId": "post-uuid",
    "crosspostedToCreatorId": "creator-uuid"
  }
}
```

#### Get Pending Tags (for approval)

```typescript
GET /api/creators/me/pending-tags

Response:
{
  "pendingTags": [
    {
      "id": "tag-uuid",
      "post": {
        "id": "post-uuid",
        "title": "Check out this collaboration!",
        "creator": {
          "id": "creator-uuid",
          "username": "creator123",
          "displayName": "Creator Name"
        }
      },
      "taggedAt": "2025-11-03T12:00:00Z"
    }
  ]
}
```

#### Update Cross-Posting Settings

```typescript
PUT /api/creators/me/crosspost-settings

Body:
{
  "autoApproveAllTags": false,
  "autoApproveFromFollowing": true,
  "autoApproveFromSubscribers": true,
  "autoApproveFromVerified": false,
  "blockedCreatorIds": ["blocked-creator-uuid"],
  "alwaysApproveCreatorIds": ["trusted-creator-uuid"]
}

Response:
{
  "success": true,
  "settings": { ...updated settings... }
}
```

### Frontend Components Needed

#### 1. Creator Tagging Input
```jsx
// In post creation form
<CreatorTagInput
  onCreatorsSelected={(creators) => setTaggedCreators(creators)}
  placeholder="Tag other creators..."
/>
```

#### 2. Pending Tags Notification
```jsx
<PendingTagsNotification
  count={pendingTagsCount}
  onClick={() => navigate('/settings/tags/pending')}
/>
```

#### 3. Tag Approval Modal
```jsx
<TagApprovalModal
  tag={pendingTag}
  onApprove={() => handleApprove(pendingTag.id)}
  onReject={(reason) => handleReject(pendingTag.id, reason)}
/>
```

#### 4. Cross-Post Settings Panel
```jsx
<CrossPostSettingsPanel
  settings={currentSettings}
  onUpdate={(newSettings) => updateSettings(newSettings)}
/>
```

---

## Feature 2: Multi-Platform Auto-Posting

### How It Works

When a creator publishes a post on one platform (e.g., BoyFanz):
1. System checks their multi-platform settings
2. Automatically queues posts for configured platforms (e.g., GirlFanz, GayFanz)
3. Posts are created on target platforms with optional modifications
4. Creator receives notifications about success/failure

### Database Tables

#### `creator_multiplatform_settings`
Creator preferences for which platforms to auto-post to.

```sql
CREATE TABLE creator_multiplatform_settings (
    id VARCHAR PRIMARY KEY,
    creator_id VARCHAR NOT NULL UNIQUE,

    -- Which platforms to post to by default
    default_platforms VARCHAR[],  -- ['girlfanz', 'gayfanz', 'pupfanz']

    -- Auto-posting configuration
    auto_post_enabled BOOLEAN DEFAULT false,
    auto_post_delay_seconds INTEGER DEFAULT 0,

    -- Platform-specific settings (JSONB for flexibility)
    platform_settings JSONB DEFAULT '{}'
    -- Example:
    -- {
    --   "girlfanz": {
    --     "enabled": true,
    --     "modifyCaption": false,
    --     "addWatermark": true
    --   },
    --   "gayfanz": {
    --     "enabled": true,
    --     "modifyCaption": true,
    --     "captionSuffix": "#GayFanz"
    --   }
    -- }
);
```

#### `multiplatform_post_queue`
Queue of posts waiting to be cross-posted.

```sql
CREATE TABLE multiplatform_post_queue (
    id VARCHAR PRIMARY KEY,
    original_post_id VARCHAR NOT NULL,
    creator_id VARCHAR NOT NULL,
    target_platform VARCHAR NOT NULL,  -- tenant slug

    status platform_post_status NOT NULL,  -- queued, processing, posted, failed, cancelled

    -- Optional modifications for target platform
    modified_caption TEXT,
    modified_title VARCHAR,
    modified_hashtags TEXT[],
    add_platform_watermark BOOLEAN DEFAULT false,

    -- Scheduling
    scheduled_for TIMESTAMP,

    -- Result tracking
    target_post_id VARCHAR,        -- ID of created post on target platform
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    queued_at TIMESTAMP DEFAULT NOW()
);
```

#### `multiplatform_post_history`
Historical record for analytics.

```sql
CREATE TABLE multiplatform_post_history (
    id VARCHAR PRIMARY KEY,
    original_post_id VARCHAR NOT NULL,
    creator_id VARCHAR NOT NULL,
    target_platform VARCHAR NOT NULL,
    target_post_id VARCHAR,

    -- Performance metrics
    time_to_post_seconds INTEGER,
    engagement_on_original_platform JSONB,
    engagement_on_target_platform JSONB,

    posted_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints (To Implement)

#### Get Multi-Platform Settings

```typescript
GET /api/creators/me/multiplatform-settings

Response:
{
  "settings": {
    "defaultPlatforms": ["girlfanz", "gayfanz"],
    "autoPostEnabled": true,
    "autoPostDelaySeconds": 60,
    "platformSettings": {
      "girlfanz": {
        "enabled": true,
        "modifyCaption": false,
        "addWatermark": true
      },
      "gayfanz": {
        "enabled": true,
        "modifyCaption": true,
        "captionSuffix": "#GayFanz"
      }
    }
  }
}
```

#### Update Multi-Platform Settings

```typescript
PUT /api/creators/me/multiplatform-settings

Body:
{
  "defaultPlatforms": ["girlfanz", "gayfanz", "pupfanz"],
  "autoPostEnabled": true,
  "autoPostDelaySeconds": 0,
  "platformSettings": {
    "girlfanz": {
      "enabled": true,
      "modifyCaption": false,
      "addWatermark": true
    }
  }
}

Response:
{
  "success": true,
  "settings": { ...updated settings... }
}
```

#### Create Post with Platform Selection

```typescript
POST /api/posts

Body:
{
  "title": "New post title",
  "content": "Post content...",
  "type": "image",
  "visibility": "subscribers",

  // Multi-platform options
  "multiplatform": {
    "enabled": true,
    "platforms": ["girlfanz", "gayfanz"],  // Override default
    "platformModifications": {
      "gayfanz": {
        "caption": "Modified caption for GayFanz",
        "hashtags": ["#GayFanz", "#Exclusive"]
      }
    }
  }
}

Response:
{
  "success": true,
  "post": {
    "id": "post-uuid",
    // ... post data ...
  },
  "queuedPosts": [
    {
      "id": "queue-uuid-1",
      "targetPlatform": "girlfanz",
      "status": "queued",
      "scheduledFor": "2025-11-03T12:01:00Z"
    },
    {
      "id": "queue-uuid-2",
      "targetPlatform": "gayfanz",
      "status": "queued",
      "scheduledFor": "2025-11-03T12:01:00Z"
    }
  ]
}
```

#### Get Multi-Platform Post Queue

```typescript
GET /api/creators/me/multiplatform-queue?status=queued

Response:
{
  "queue": [
    {
      "id": "queue-uuid",
      "originalPost": {
        "id": "post-uuid",
        "title": "Post title"
      },
      "targetPlatform": "girlfanz",
      "status": "queued",
      "scheduledFor": "2025-11-03T12:01:00Z",
      "retryCount": 0
    }
  ]
}
```

#### Cancel Queued Post

```typescript
DELETE /api/multiplatform-queue/:queueId

Response:
{
  "success": true,
  "message": "Post removed from queue"
}
```

#### Get Multi-Platform Analytics

```typescript
GET /api/creators/me/multiplatform-analytics?period=7d

Response:
{
  "totalCrossPosts": 45,
  "successRate": 0.956,  // 95.6%
  "platformBreakdown": {
    "girlfanz": {
      "totalPosts": 20,
      "successfulPosts": 19,
      "failedPosts": 1,
      "avgEngagement": {
        "views": 1250,
        "likes": 85,
        "comments": 12
      }
    },
    "gayfanz": {
      "totalPosts": 25,
      "successfulPosts": 24,
      "failedPosts": 1,
      "avgEngagement": {
        "views": 1800,
        "likes": 120,
        "comments": 18
      }
    }
  }
}
```

### Frontend Components Needed

#### 1. Platform Selector (Post Creation)
```jsx
<PlatformSelector
  availablePlatforms={['boyfanz', 'girlfanz', 'gayfanz', 'pupfanz']}
  selectedPlatforms={selectedPlatforms}
  onChange={(platforms) => setSelectedPlatforms(platforms)}
  settings={multiplatformSettings}
/>
```

#### 2. Platform-Specific Modifications
```jsx
<PlatformModifications
  platform="gayfanz"
  originalCaption={caption}
  onModify={(modifications) => setPlatformMods(modifications)}
/>
```

#### 3. Multi-Platform Settings Panel
```jsx
<MultiPlatformSettings
  currentSettings={settings}
  availablePlatforms={allPlatforms}
  onUpdate={(newSettings) => updateSettings(newSettings)}
/>
```

#### 4. Queue Status Monitor
```jsx
<QueueStatusMonitor
  queue={queuedPosts}
  onCancel={(queueId) => cancelQueuedPost(queueId)}
  onRetry={(queueId) => retryFailedPost(queueId)}
/>
```

---

## Background Worker (To Implement)

### Multi-Platform Post Processor

A background worker should process the `multiplatform_post_queue` table:

```typescript
// pseudocode
async function processMultiplatformQueue() {
  while (true) {
    // Get queued posts ready to be posted
    const queuedPosts = await db.query(`
      SELECT * FROM multiplatform_post_queue
      WHERE status = 'queued'
      AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT 10
    `);

    for (const queueItem of queuedPosts) {
      try {
        // Mark as processing
        await updateQueueStatus(queueItem.id, 'processing');

        // Get original post data
        const originalPost = await getPost(queueItem.original_post_id);

        // Get platform-specific modifications
        const modifications = await getPlatformModifications(
          queueItem.id,
          queueItem.target_platform
        );

        // Create post on target platform
        const targetPost = await createPostOnPlatform(
          queueItem.target_platform,
          {
            ...originalPost,
            ...modifications,
            creator_id: queueItem.creator_id
          }
        );

        // Mark as posted
        await updateQueueStatus(queueItem.id, 'posted', {
          target_post_id: targetPost.id,
          completed_at: new Date()
        });

        // Log to history
        await logToHistory(queueItem, targetPost);

        // Send success notification
        await notifyCreator(queueItem.creator_id, 'success', {
          platform: queueItem.target_platform,
          postId: targetPost.id
        });

      } catch (error) {
        // Handle failure
        const retryCount = queueItem.retry_count + 1;

        if (retryCount >= queueItem.max_retries) {
          // Max retries reached, mark as failed
          await updateQueueStatus(queueItem.id, 'failed', {
            error_message: error.message,
            failed_at: new Date()
          });

          // Send failure notification
          await notifyCreator(queueItem.creator_id, 'failure', {
            platform: queueItem.target_platform,
            error: error.message
          });
        } else {
          // Retry with exponential backoff
          const nextRetryDelay = Math.pow(2, retryCount) * 60; // seconds
          await updateQueueForRetry(queueItem.id, retryCount, nextRetryDelay);
        }
      }
    }

    // Wait before next batch
    await sleep(5000); // 5 seconds
  }
}
```

---

## Testing the Features

### Test Creator Tagging

```sql
-- 1. Create a post
INSERT INTO posts (id, creator_id, type, visibility, title, content)
VALUES ('post-123', 'creator-1', 'image', 'free', 'Collaboration Post', 'Check this out!');

-- 2. Tag another creator
INSERT INTO post_tags (id, post_id, tagged_creator_id, tagged_by_creator_id)
VALUES ('tag-123', 'post-123', 'creator-2', 'creator-1');

-- 3. Check auto-approval logic
SELECT check_tag_auto_approval('post-123', 'creator-2', 'creator-1');

-- 4. Approve the tag (manually)
UPDATE post_tags
SET status = 'approved'
WHERE id = 'tag-123';

-- 5. Verify cross-posted post was created
SELECT * FROM crossposted_posts WHERE original_post_id = 'post-123';
```

### Test Multi-Platform Posting

```sql
-- 1. Set up creator's multi-platform settings
INSERT INTO creator_multiplatform_settings (
  id, creator_id, default_platforms, auto_post_enabled
) VALUES (
  'settings-123', 'creator-1', ARRAY['girlfanz', 'gayfanz'], true
);

-- 2. Create a post (trigger will auto-queue)
INSERT INTO posts (id, creator_id, type, visibility, title, content)
VALUES ('post-456', 'creator-1', 'image', 'free', 'Multi-Platform Post', 'Content here');

-- 3. Check queue was populated
SELECT * FROM multiplatform_post_queue WHERE original_post_id = 'post-456';

-- 4. Simulate processing
UPDATE multiplatform_post_queue
SET status = 'processing'
WHERE original_post_id = 'post-456';

-- 5. Mark as posted
UPDATE multiplatform_post_queue
SET status = 'posted', target_post_id = 'new-post-789', completed_at = NOW()
WHERE original_post_id = 'post-456';
```

---

## Next Steps

1. **Implement API Endpoints**: Create REST/GraphQL endpoints for all operations
2. **Build Frontend Components**: Create React/Vue components for UI
3. **Background Worker**: Implement queue processor for multi-platform posting
4. **Notifications**: Integrate with existing notification system
5. **Analytics Dashboard**: Create analytics views for cross-posting performance
6. **Mobile Support**: Ensure features work on mobile apps
7. **Testing**: Comprehensive unit and integration tests

---

## Summary

Both cross-posting features are now live in the database with:

- ✅ 6 new database tables
- ✅ 14 RLS policies for security
- ✅ 3 trigger functions for automation
- ✅ Auto-approval logic for creator tagging
- ✅ Auto-queuing for multi-platform posting

The backend infrastructure is complete. Frontend implementation and background workers are the next priorities.

---

**Questions?** Contact the development team or check the migration file:
`/Users/joshuastone/FANZ-Unified-Ecosystem/supabase/migrations/20251103000002_crossposting_features.sql`

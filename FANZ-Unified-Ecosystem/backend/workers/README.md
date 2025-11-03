# FANZ Multi-Platform Queue Worker

Production-ready background worker service for processing cross-platform post queue in the FANZ Unified Ecosystem.

## Overview

This worker service continuously polls the `multiplatform_post_queue` table and processes queued posts by creating them on target platforms. It's designed to run 24/7 as a background service on Render.com.

## Features

- **Queue Processing**: Polls every 10 seconds for new posts to process
- **Retry Logic**: Automatic retry with exponential backoff (2min, 4min, 8min)
- **Error Handling**: Comprehensive error handling with detailed logging
- **Graceful Shutdown**: Waits for current batch to complete before exiting
- **Health Monitoring**: Logs health status every 5 minutes
- **Multi-Platform Support**: Works across all 48+ FANZ platforms

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FANZ Content Creator                      │
│         Creates post with multi-platform settings            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              multiplatform_post_queue (Supabase)             │
│    Stores queued posts with target platform and settings    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Queue Worker (This Service)                 │
│         Polls queue → Creates posts → Updates status         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              content_posts (Target Platforms)                │
│         Post appears on target platform's feed               │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NODE_ENV=production
```

**Security Note**: Never commit `.env` to version control. The service role key has admin privileges.

## Installation

```bash
cd backend/workers
npm install
```

## Running Locally

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Testing Locally

1. **Start the worker**:
   ```bash
   npm start
   ```

2. **Add a test post to the queue** (via Supabase SQL Editor):
   ```sql
   INSERT INTO multiplatform_post_queue (
     creator_id,
     original_post_id,
     target_platform,
     status
   )
   SELECT
     creator_id,
     id as original_post_id,
     'girlfanz' as target_platform,
     'queued' as status
   FROM content_posts
   WHERE cluster = 'boyfanz'
   LIMIT 1;
   ```

3. **Watch the logs**: You should see the worker process the queued item within 10 seconds.

## Queue Processing Flow

### 1. Fetch Queued Items
```javascript
SELECT * FROM multiplatform_post_queue
WHERE status = 'queued'
AND (scheduled_for IS NULL OR scheduled_for <= NOW())
ORDER BY queued_at ASC
LIMIT 10;
```

### 2. Process Each Item
- Update status to `processing`
- Create post on target platform
- Update status to `posted` with target_post_id
- Record in `multiplatform_post_history`

### 3. Error Handling
- **Retry**: If retry_count < max_retries (default 3)
  - Reschedule with exponential backoff
  - 1st retry: 2 minutes
  - 2nd retry: 4 minutes
  - 3rd retry: 8 minutes
- **Failed**: If max retries exceeded
  - Mark as `failed` with error_message

## Monitoring

### Log Output
```
========================================
FANZ Multi-Platform Queue Worker
========================================
Environment: production
Supabase URL: https://mcayxybcgxhfttvwmhgm.supabase.co
Started: 2025-11-03T10:30:00.000Z
========================================

[WORKER] Starting queue processor...
[WORKER] Initial queue check complete
[WORKER] Polling queue every 10 seconds

[2025-11-03T10:30:15.000Z] Processing 3 queue items...
[a1b2c3d4] Processing: Hot New Content → girlfanz
[a1b2c3d4] ✅ SUCCESS - Posted to girlfanz (f9e8d7c6-...)
[e5f6g7h8] Processing: Exclusive Behind the Scenes → pupfanz
[e5f6g7h8] ✅ SUCCESS - Posted to pupfanz (i9j0k1l2-...)
[m3n4o5p6] Processing: Limited Time Offer → gayfanz
[m3n4o5p6] ✅ SUCCESS - Posted to gayfanz (q7r8s9t0-...)
[2025-11-03T10:30:18.000Z] Batch complete

[HEALTH] healthy - Uptime: 300s
```

### Health Checks
- Health status logged every 5 minutes
- Monitor uptime and service status
- Check Render logs for errors

### Queue Metrics
Query Supabase to monitor queue performance:

```sql
-- Current queue status
SELECT
  status,
  COUNT(*) as count
FROM multiplatform_post_queue
GROUP BY status;

-- Failed posts
SELECT
  id,
  target_platform,
  error_message,
  failed_at
FROM multiplatform_post_queue
WHERE status = 'failed'
ORDER BY failed_at DESC
LIMIT 10;

-- Average processing time
SELECT
  target_platform,
  AVG(time_to_post_seconds) as avg_seconds,
  COUNT(*) as posts_count
FROM multiplatform_post_history
GROUP BY target_platform
ORDER BY avg_seconds DESC;
```

## Deployment to Render

### Prerequisites
1. Render account (https://render.com)
2. GitHub repository connected to Render
3. Supabase service role key

### Deploy Steps

#### Option 1: Using render.yaml (Recommended)

1. **Ensure render.yaml is in repo root**
   ```bash
   # render.yaml defines the worker service
   cat render.yaml
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add multi-platform queue worker"
   git push origin main
   ```

3. **Create New Service on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Background Worker"
   - Connect your GitHub repository
   - Select branch: `main`
   - Render will auto-detect render.yaml
   - Click "Create Background Worker"

4. **Configure Environment Variables**
   - In Render dashboard, go to service → Environment
   - Add variables:
     - `SUPABASE_URL`: `https://mcayxybcgxhfttvwmhgm.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: (paste your key)
     - `NODE_ENV`: `production`
   - Click "Save Changes"

#### Option 2: Manual Setup

1. **Create New Background Worker**
   - Dashboard → New + → Background Worker
   - Connect GitHub repository

2. **Configure Build Settings**
   - **Name**: `fanz-multiplatform-worker`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend/workers`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Add Environment Variables** (same as above)

4. **Deploy**
   - Click "Create Background Worker"
   - Monitor logs for successful startup

### Verify Deployment

1. **Check Logs**
   ```
   ========================================
   FANZ Multi-Platform Queue Worker
   ========================================
   Environment: production
   Supabase URL: https://mcayxybcgxhfttvwmhgm.supabase.co
   Started: 2025-11-03T...
   ========================================

   [WORKER] Starting queue processor...
   ```

2. **Test Queue Processing**
   - Add test item to queue (see "Testing Locally" section)
   - Watch Render logs for processing confirmation

3. **Monitor Performance**
   - Check Render metrics dashboard
   - Monitor CPU/Memory usage
   - Set up alerts for failures

## Troubleshooting

### Worker Not Processing Queue

**Check 1**: Verify worker is running
```bash
# In Render logs, look for:
[WORKER] Polling queue every 10 seconds
```

**Check 2**: Verify database connection
```bash
# Look for Supabase URL in startup logs
Supabase URL: https://mcayxybcgxhfttvwmhgm.supabase.co
```

**Check 3**: Check queue for items
```sql
SELECT * FROM multiplatform_post_queue WHERE status = 'queued';
```

### Posts Stuck in "processing" Status

**Cause**: Worker crashed during processing

**Fix**: Reset stuck items
```sql
UPDATE multiplatform_post_queue
SET status = 'queued', processing_started_at = NULL
WHERE status = 'processing'
AND processing_started_at < NOW() - INTERVAL '5 minutes';
```

### High Retry Rates

**Check Error Messages**:
```sql
SELECT
  error_message,
  COUNT(*) as occurrences
FROM multiplatform_post_queue
WHERE retry_count > 0
GROUP BY error_message
ORDER BY occurrences DESC;
```

**Common Issues**:
- Invalid creator_id
- Missing content_url
- Platform permissions
- Network timeouts

### Memory Issues

**Render Free Tier**: 512MB RAM
- Current worker is lightweight (~50MB)
- Processes 10 items per batch
- If issues occur, reduce batch size in index.js line 35

## Configuration

### Polling Interval
Default: 10 seconds (line 274 in index.js)
```javascript
const POLL_INTERVAL = 10000; // 10 seconds
```

### Batch Size
Default: 10 posts per batch (line 35 in index.js)
```javascript
.limit(10);
```

### Retry Configuration
Default: 3 retries with exponential backoff (line 113 in index.js)
```javascript
if (newRetryCount < (item.max_retries || 3)) {
  const delaySeconds = Math.pow(2, newRetryCount) * 60;
}
```

### Health Check Interval
Default: 5 minutes (line 284 in index.js)
```javascript
setInterval(() => {
  const health = getHealthStatus();
  console.log(`[HEALTH] ${health.status} - Uptime: ${Math.round(health.uptime)}s`);
}, 300000); // 5 minutes
```

## Performance

### Expected Throughput
- **Polling**: Every 10 seconds
- **Batch Size**: 10 posts
- **Max Throughput**: 3,600 posts/hour (60 posts/minute)
- **Typical**: ~100-500 posts/hour depending on queue volume

### Resource Usage
- **CPU**: <5% (mostly idle, spikes during processing)
- **Memory**: ~50MB baseline, ~100MB peak
- **Network**: Minimal (Supabase queries only)
- **Storage**: None (stateless service)

## Security

### Service Role Key
- Has admin privileges on Supabase
- Required for background worker operations
- **NEVER** expose in client-side code
- Stored securely in Render environment variables

### RLS Policies
- Worker uses service role (bypasses RLS)
- Creates posts on behalf of creators
- Maintains proper creator_id relationships

### Network Security
- Worker runs in Render's secure infrastructure
- All connections to Supabase over HTTPS
- No public endpoints exposed

## Maintenance

### Updating the Worker
1. Make changes to code
2. Push to GitHub
3. Render auto-deploys (if enabled)
4. Monitor logs for successful deployment

### Database Migrations
If database schema changes:
1. Update migration in `supabase/migrations/`
2. Deploy migration with `supabase db push`
3. Update worker code if needed
4. Deploy worker updates

### Monitoring Checklist
- [ ] Worker is running (check Render dashboard)
- [ ] No errors in logs
- [ ] Queue processing regularly
- [ ] Failed posts < 1%
- [ ] Average processing time < 5 seconds
- [ ] Memory usage stable

## Support

**Repository**: https://github.com/FanzCEO/BoyFanzV1
**Supabase Project**: https://app.supabase.com/project/mcayxybcgxhfttvwmhgm
**Deployment Guide**: `CROSSPOSTING_DEPLOYMENT_GUIDE.md`

## License

UNLICENSED - Private - FANZ Group Holdings

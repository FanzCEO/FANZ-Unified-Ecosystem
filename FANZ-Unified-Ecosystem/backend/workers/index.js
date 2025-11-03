const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('========================================');
console.log('FANZ Multi-Platform Queue Worker');
console.log('========================================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
console.log(`Started: ${new Date().toISOString()}`);
console.log('========================================\n');

/**
 * Process the multiplatform_post_queue table
 * Picks up queued posts and creates them on target platforms
 */
async function processQueue() {
  try {
    // Fetch queued items that are ready to be processed
    const { data: items, error } = await supabase
      .from('multiplatform_post_queue')
      .select(`
        *,
        creator:creators(id, creator_name, user_id),
        original_post:content_posts(id, title, description, content_url, cluster)
      `)
      .eq('status', 'queued')
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .order('queued_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('[ERROR] Failed to fetch queue items:', error.message);
      return;
    }

    if (!items || items.length === 0) {
      return; // No items to process
    }

    console.log(`\n[${new Date().toISOString()}] Processing ${items.length} queue items...`);

    for (const item of items) {
      await processItem(item);
    }

    console.log(`[${new Date().toISOString()}] Batch complete\n`);
  } catch (error) {
    console.error('[ERROR] Queue processing failed:', error.message);
    console.error(error.stack);
  }
}

/**
 * Process a single queue item
 * @param {Object} item - Queue item from multiplatform_post_queue
 */
async function processItem(item) {
  const itemId = item.id.substring(0, 8);
  console.log(`[${itemId}] Processing: ${item.original_post?.title || 'Untitled'} → ${item.target_platform}`);

  try {
    // Update status to processing
    await supabase
      .from('multiplatform_post_queue')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', item.id);

    // ============================================================================
    // CORE LOGIC: Create post on target platform
    // ============================================================================
    //
    // In a production environment, this is where you would:
    // 1. Call the target platform's API to create the post
    // 2. Use the original post data from item.original_post
    // 3. Apply modifications from item.modified_caption, item.modified_title, etc.
    // 4. Handle platform-specific requirements
    //
    // For now, we'll simulate this with a basic implementation:
    // ============================================================================

    const targetPostId = await createPostOnPlatform(item);

    // Update queue item as successfully posted
    await supabase
      .from('multiplatform_post_queue')
      .update({
        status: 'posted',
        target_post_id: targetPostId,
        completed_at: new Date().toISOString()
      })
      .eq('id', item.id);

    // Record in analytics/history
    await recordPostHistory(item, targetPostId);

    console.log(`[${itemId}] ✅ SUCCESS - Posted to ${item.target_platform} (${targetPostId})`);

  } catch (error) {
    console.error(`[${itemId}] ❌ FAILED:`, error.message);

    // Retry logic
    const newRetryCount = (item.retry_count || 0) + 1;

    if (newRetryCount < (item.max_retries || 3)) {
      // Retry with exponential backoff
      const delaySeconds = Math.pow(2, newRetryCount) * 60; // 2min, 4min, 8min
      const scheduledFor = new Date(Date.now() + delaySeconds * 1000).toISOString();

      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'queued',
          retry_count: newRetryCount,
          error_message: error.message,
          scheduled_for: scheduledFor
        })
        .eq('id', item.id);

      console.log(`[${itemId}] 🔄 Retry ${newRetryCount}/${item.max_retries} scheduled for ${scheduledFor}`);
    } else {
      // Max retries exceeded, mark as failed
      await supabase
        .from('multiplatform_post_queue')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      console.log(`[${itemId}] 💀 Max retries exceeded - marked as failed`);
    }
  }
}

/**
 * Create a post on the target platform
 * @param {Object} item - Queue item
 * @returns {Promise<string>} - Target post ID
 */
async function createPostOnPlatform(item) {
  // ============================================================================
  // PLACEHOLDER IMPLEMENTATION
  // ============================================================================
  // Replace this with actual platform API calls
  //
  // Example integration points:
  // - Internal FANZ API: POST /api/platforms/${item.target_platform}/posts
  // - Direct database insert: Insert into content_posts with cluster = target_platform
  // - Message queue: Publish to platform-specific queue for async processing
  // ============================================================================

  const originalPost = item.original_post;

  // Prepare post data with modifications
  const postData = {
    creator_id: item.creator_id,
    cluster: item.target_platform,
    title: item.modified_title || originalPost.title,
    description: item.modified_caption || originalPost.description,
    content_url: originalPost.content_url,
    content_type: originalPost.content_type,
    // Add watermark flag if specified
    ...(item.add_platform_watermark && { watermark_enabled: true }),
    // Merge modified hashtags
    tags: item.modified_hashtags || originalPost.tags || [],
    // Mark as cross-posted
    is_crosspost: true,
    original_post_id: item.original_post_id,
    status: 'published',
    published_at: new Date().toISOString()
  };

  // Create the post in the target platform's content_posts table
  const { data: newPost, error } = await supabase
    .from('content_posts')
    .insert(postData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create post on ${item.target_platform}: ${error.message}`);
  }

  return newPost.id;
}

/**
 * Record post history for analytics
 * @param {Object} item - Queue item
 * @param {string} targetPostId - Created post ID
 */
async function recordPostHistory(item, targetPostId) {
  try {
    const startTime = new Date(item.queued_at).getTime();
    const endTime = Date.now();
    const timeToPostSeconds = Math.round((endTime - startTime) / 1000);

    await supabase
      .from('multiplatform_post_history')
      .insert({
        original_post_id: item.original_post_id,
        creator_id: item.creator_id,
        target_platform: item.target_platform,
        target_post_id: targetPostId,
        time_to_post_seconds: timeToPostSeconds,
        engagement_on_original_platform: {},
        engagement_on_target_platform: {},
        posted_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to record post history:', error.message);
    // Don't fail the whole operation if history recording fails
  }
}

/**
 * Health check endpoint data
 */
function getHealthStatus() {
  return {
    status: 'healthy',
    service: 'fanz-multiplatform-worker',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] Received SIGTERM signal');
  console.log('[SHUTDOWN] Waiting for current batch to complete...');
  setTimeout(() => {
    console.log('[SHUTDOWN] Exiting gracefully');
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Received SIGINT signal');
  console.log('[SHUTDOWN] Exiting gracefully');
  process.exit(0);
});

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error);
  process.exit(1);
});

// Start the worker
console.log('[WORKER] Starting queue processor...\n');

// Run immediately on startup
processQueue().then(() => {
  console.log('[WORKER] Initial queue check complete');
});

// Then run every 10 seconds
const POLL_INTERVAL = 10000; // 10 seconds
setInterval(processQueue, POLL_INTERVAL);

console.log(`[WORKER] Polling queue every ${POLL_INTERVAL / 1000} seconds\n`);
console.log('Worker is running. Press Ctrl+C to stop.\n');

// Log health status every 5 minutes
setInterval(() => {
  const health = getHealthStatus();
  console.log(`[HEALTH] ${health.status} - Uptime: ${Math.round(health.uptime)}s`);
}, 300000);

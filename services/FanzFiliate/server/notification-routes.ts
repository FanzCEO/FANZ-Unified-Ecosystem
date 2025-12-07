import type { Express } from 'express';
import { z } from 'zod';
import { notificationService } from './services/notifications';
import { authenticateJWT, requireRole, rateLimit } from './middleware/auth';
import type { NotificationType, NotificationPriority, NotificationChannel } from './services/notifications';

// Validation schemas
const CreateNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    'security_alert',
    'login_notification',
    'payout_processed',
    'payout_failed',
    'conversion_approved',
    'conversion_rejected',
    'offer_approved',
    'offer_rejected',
    'kyc_status_update',
    'account_update',
    'system_maintenance',
    'promotional',
    'fraud_alert',
    'balance_update',
    'new_offer_available',
    'performance_milestone',
  ] as const),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  channels: z.array(z.enum(['websocket', 'email', 'sms', 'push', 'in_app'])).default(['websocket']),
  data: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
});

const BroadcastNotificationSchema = z.object({
  channel: z.string(),
  type: z.enum([
    'security_alert',
    'login_notification',
    'payout_processed',
    'payout_failed',
    'conversion_approved',
    'conversion_rejected',
    'offer_approved',
    'offer_rejected',
    'kyc_status_update',
    'account_update',
    'system_maintenance',
    'promotional',
    'fraud_alert',
    'balance_update',
    'new_offer_available',
    'performance_milestone',
  ] as const),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  data: z.record(z.any()).optional(),
});

const UpdateChannelSchema = z.object({
  channelType: z.enum(['websocket', 'email', 'sms', 'push', 'in_app']),
  enabled: z.boolean(),
  configuration: z.record(z.any()).optional(),
});

const GetNotificationsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, {
    message: 'Limit must be between 1 and 100',
  }).optional().default('50'),
  offset: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 0, {
    message: 'Offset must be non-negative',
  }).optional().default('0'),
  unreadOnly: z.string().transform(val => val === 'true').optional().default('false'),
  types: z.string().transform(val => val.split(',') as NotificationType[]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
});

/**
 * Register notification API routes
 */
export function registerNotificationRoutes(app: Express) {
  console.log('📡 Registering notification API routes');

  // Apply rate limiting to notification routes
  const notificationRateLimit = rateLimit(100, 60000); // 100 requests per minute

  /**
   * Get user's notifications
   * GET /api/notifications
   */
  app.get('/api/notifications', authenticateJWT, notificationRateLimit, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Not authenticated', 
          code: 'NOT_AUTHENTICATED' 
        });
      }

      const queryParams = GetNotificationsQuerySchema.parse(req.query);
      
      const result = await notificationService.getUserNotifications(req.user.id, {
        limit: queryParams.limit,
        offset: queryParams.offset,
        unreadOnly: queryParams.unreadOnly,
        types: queryParams.types,
        priority: queryParams.priority,
      });

      res.json({
        success: true,
        ...result,
        pagination: {
          limit: queryParams.limit,
          offset: queryParams.offset,
          hasMore: result.total > (queryParams.offset + queryParams.limit),
        },
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch notifications', 
        code: 'FETCH_ERROR' 
      });
    }
  });

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  app.put('/api/notifications/:id/read', authenticateJWT, notificationRateLimit, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Not authenticated', 
          code: 'NOT_AUTHENTICATED' 
        });
      }

      const notificationId = req.params.id;
      
      if (!notificationId) {
        return res.status(400).json({
          error: 'Notification ID is required',
          code: 'MISSING_NOTIFICATION_ID',
        });
      }

      await notificationService.markNotificationAsRead(notificationId, req.user.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ 
        error: 'Failed to mark notification as read', 
        code: 'MARK_READ_ERROR' 
      });
    }
  });

  /**
   * Get user's notification channel preferences
   * GET /api/notifications/channels
   */
  app.get('/api/notifications/channels', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Not authenticated', 
          code: 'NOT_AUTHENTICATED' 
        });
      }

      const channels = await notificationService.getUserNotificationChannels(req.user.id);

      res.json({
        success: true,
        channels,
      });
    } catch (error) {
      console.error('Get notification channels error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notification channels', 
        code: 'FETCH_CHANNELS_ERROR' 
      });
    }
  });

  /**
   * Update notification channel preferences
   * PUT /api/notifications/channels
   */
  app.put('/api/notifications/channels', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Not authenticated', 
          code: 'NOT_AUTHENTICATED' 
        });
      }

      const { channelType, enabled, configuration } = UpdateChannelSchema.parse(req.body);

      await notificationService.updateNotificationChannel(
        req.user.id,
        channelType,
        enabled,
        configuration
      );

      res.json({
        success: true,
        message: `${channelType} channel updated successfully`,
      });
    } catch (error) {
      console.error('Update notification channel error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid channel data',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update notification channel', 
        code: 'UPDATE_CHANNEL_ERROR' 
      });
    }
  });

  /**
   * Create notification (admin only)
   * POST /api/notifications
   */
  app.post('/api/notifications', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const notificationData = CreateNotificationSchema.parse(req.body);
      
      // Convert scheduledFor string to Date if provided
      const scheduledFor = notificationData.scheduledFor 
        ? new Date(notificationData.scheduledFor) 
        : undefined;

      const notification = await notificationService.createNotification({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority,
        channels: notificationData.channels,
        data: notificationData.data,
        scheduledFor,
        maxRetries: notificationData.maxRetries,
      });

      res.status(201).json({
        success: true,
        notification,
        message: 'Notification created successfully',
      });
    } catch (error) {
      console.error('Create notification error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid notification data',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to create notification', 
        code: 'CREATE_NOTIFICATION_ERROR' 
      });
    }
  });

  /**
   * Broadcast notification to channel (admin only)
   * POST /api/notifications/broadcast
   */
  app.post('/api/notifications/broadcast', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const broadcastData = BroadcastNotificationSchema.parse(req.body);

      await notificationService.broadcastToChannel(broadcastData.channel, {
        type: broadcastData.type,
        title: broadcastData.title,
        message: broadcastData.message,
        priority: broadcastData.priority,
        data: broadcastData.data,
      });

      res.json({
        success: true,
        message: `Broadcast sent to channel: ${broadcastData.channel}`,
      });
    } catch (error) {
      console.error('Broadcast notification error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid broadcast data',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to broadcast notification', 
        code: 'BROADCAST_ERROR' 
      });
    }
  });

  /**
   * Send real-time notification to user (admin only)
   * POST /api/notifications/realtime
   */
  app.post('/api/notifications/realtime', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const schema = z.object({
        userId: z.string(),
        title: z.string().min(1).max(200),
        message: z.string().min(1).max(1000),
        priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
        type: z.enum([
          'security_alert',
          'login_notification',
          'payout_processed',
          'payout_failed',
          'conversion_approved',
          'conversion_rejected',
          'offer_approved',
          'offer_rejected',
          'kyc_status_update',
          'account_update',
          'system_maintenance',
          'promotional',
          'fraud_alert',
          'balance_update',
          'new_offer_available',
          'performance_milestone',
        ] as const),
        data: z.record(z.any()).optional(),
      });

      const notificationData = schema.parse(req.body);

      await notificationService.sendRealTimeNotification(notificationData.userId, {
        id: `realtime_${Date.now()}_${Math.random()}`,
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority,
        type: notificationData.type,
        data: notificationData.data,
      });

      res.json({
        success: true,
        message: `Real-time notification sent to user: ${notificationData.userId}`,
      });
    } catch (error) {
      console.error('Send real-time notification error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid notification data',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to send real-time notification', 
        code: 'REALTIME_SEND_ERROR' 
      });
    }
  });

  /**
   * Get notification statistics (admin only)
   * GET /api/notifications/stats
   */
  app.get('/api/notifications/stats', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const stats = notificationService.getNotificationStats();

      res.json({
        success: true,
        stats: {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notification statistics', 
        code: 'STATS_ERROR' 
      });
    }
  });

  /**
   * Test notification delivery (admin only, development)
   * POST /api/notifications/test
   */
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/notifications/test', authenticateJWT, requireRole('admin'), async (req, res) => {
      try {
        const schema = z.object({
          userId: z.string(),
          testType: z.enum(['websocket', 'email', 'sms', 'all']).default('websocket'),
        });

        const { userId, testType } = schema.parse(req.body);

        const testNotification = {
          id: `test_${Date.now()}`,
          userId,
          type: 'system_maintenance' as const,
          title: `Test Notification - ${testType}`,
          message: `This is a test notification sent via ${testType}`,
          priority: 'normal' as const,
          data: {
            testType,
            timestamp: new Date().toISOString(),
          },
        };

        if (testType === 'websocket' || testType === 'all') {
          await notificationService.sendRealTimeNotification(userId, testNotification);
        }

        if (testType === 'all') {
          await notificationService.createNotification({
            ...testNotification,
            channels: ['email', 'sms'],
            maxRetries: 1,
          });
        }

        res.json({
          success: true,
          message: `Test notification sent to user ${userId} via ${testType}`,
          testNotification,
        });
      } catch (error) {
        console.error('Test notification error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Invalid test data',
            details: error.errors,
            code: 'VALIDATION_ERROR',
          });
        }
        
        res.status(500).json({ 
          error: 'Failed to send test notification', 
          code: 'TEST_ERROR' 
        });
      }
    });
  }

  console.log('✅ Notification API routes registered');
}

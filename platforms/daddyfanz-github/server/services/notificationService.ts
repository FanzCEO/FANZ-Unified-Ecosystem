import { logger } from "../logger";
import { storage } from "../storage";

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  clickAction?: string;
}

interface NotificationTarget {
  userId: string;
  deviceTokens: string[];
  preferences: NotificationPreferences;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newMessages: boolean;
  newSubscribers: boolean;
  paymentUpdates: boolean;
  contentApproved: boolean;
  contentRejected: boolean;
  payoutProcessed: boolean;
}

interface NotificationTemplate {
  type: "new_message" | "new_subscriber" | "payment_received" | "content_approved" | "content_rejected" | "payout_processed";
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private templates: Record<string, NotificationTemplate> = {
    new_message: {
      type: "new_message",
      title: "New Message",
      body: "You have a new message from {{senderName}}",
      data: { action: "open_messages" },
    },
    new_subscriber: {
      type: "new_subscriber",
      title: "New Subscriber! 🎉",
      body: "{{fanName}} just subscribed to your content",
      data: { action: "open_dashboard" },
    },
    payment_received: {
      type: "payment_received",
      title: "Payment Received 💰",
      body: "You received {{amount}} from {{fanName}}",
      data: { action: "open_earnings" },
    },
    content_approved: {
      type: "content_approved",
      title: "Content Approved ✅",
      body: "Your content '{{contentTitle}}' has been approved",
      data: { action: "open_content" },
    },
    content_rejected: {
      type: "content_rejected",
      title: "Content Needs Review ⚠️",
      body: "Your content '{{contentTitle}}' needs revision",
      data: { action: "open_content" },
    },
    payout_processed: {
      type: "payout_processed",
      title: "Payout Processed 🏦",
      body: "Your payout of {{amount}} has been processed",
      data: { action: "open_earnings" },
    },
  };

  constructor() {
    this.validateConfiguration();
  }

  private validateConfiguration() {
    // Check if push notification services are configured
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    const apnsCertPath = process.env.APNS_CERT_PATH;
    
    if (!fcmServerKey && !apnsCertPath) {
      logger.debug("Push notification services not configured (optional feature)");
    }

    logger.info("Notification service initialized", {
      fcmConfigured: !!fcmServerKey,
      apnsConfigured: !!apnsCertPath,
    });
  }

  async sendNotification(
    target: NotificationTarget,
    templateType: keyof typeof this.templates,
    variables: Record<string, string> = {}
  ): Promise<void> {
    try {
      const template = this.templates[templateType];
      if (!template) {
        throw new Error(`Unknown notification template: ${templateType}`);
      }

      // Check user preferences
      if (!this.shouldSendNotification(target.preferences, template.type)) {
        logger.debug("Notification skipped due to user preferences", {
          userId: target.userId,
          type: template.type,
        });
        return;
      }

      // Render template with variables
      const notification = this.renderTemplate(template, variables);

      // Send push notifications
      if (target.preferences.pushEnabled && target.deviceTokens.length > 0) {
        await this.sendPushNotification(target.deviceTokens, notification);
      }

      // Send email notifications (if enabled)
      if (target.preferences.emailEnabled) {
        await this.sendEmailNotification(target.userId, notification);
      }

      logger.info("Notification sent successfully", {
        userId: target.userId,
        type: template.type,
        pushSent: target.preferences.pushEnabled && target.deviceTokens.length > 0,
        emailSent: target.preferences.emailEnabled,
      });
    } catch (error) {
      logger.error("Failed to send notification", {
        error,
        userId: target.userId,
        templateType,
      });
    }
  }

  private shouldSendNotification(preferences: NotificationPreferences, type: string): boolean {
    if (!preferences.pushEnabled && !preferences.emailEnabled) {
      return false;
    }

    switch (type) {
      case "new_message":
        return preferences.newMessages;
      case "new_subscriber":
        return preferences.newSubscribers;
      case "payment_received":
        return preferences.paymentUpdates;
      case "content_approved":
        return preferences.contentApproved;
      case "content_rejected":
        return preferences.contentRejected;
      case "payout_processed":
        return preferences.payoutProcessed;
      default:
        return true;
    }
  }

  private renderTemplate(template: NotificationTemplate, variables: Record<string, string>): PushNotification {
    let title = template.title;
    let body = template.body;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return {
      title,
      body,
      data: template.data,
      badge: 1,
      sound: "default",
    };
  }

  private async sendPushNotification(deviceTokens: string[], notification: PushNotification): Promise<void> {
    try {
      // Firebase Cloud Messaging (FCM)
      await this.sendFCMNotification(deviceTokens, notification);
      
      // Apple Push Notification Service (APNS) - if iOS tokens detected
      const iosTokens = deviceTokens.filter(token => this.isIOSToken(token));
      if (iosTokens.length > 0) {
        await this.sendAPNSNotification(iosTokens, notification);
      }
    } catch (error) {
      logger.error("Push notification failed", { error, deviceTokens: deviceTokens.length });
      throw error;
    }
  }

  private async sendFCMNotification(deviceTokens: string[], notification: PushNotification): Promise<void> {
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (!fcmServerKey) {
      logger.debug("FCM not configured, skipping push notification");
      return;
    }

    // Filter out iOS tokens for FCM (FCM handles Android)
    const androidTokens = deviceTokens.filter(token => !this.isIOSToken(token));
    if (androidTokens.length === 0) return;

    const payload = {
      registration_ids: androidTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        sound: notification.sound,
        badge: notification.badge,
        click_action: notification.clickAction,
      },
      data: notification.data || {},
    };

    try {
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Authorization": `key=${fcmServerKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`FCM request failed: ${response.status}`);
      }

      const result = await response.json();
      logger.debug("FCM notification sent", { 
        success: result.success, 
        failure: result.failure,
        tokens: androidTokens.length,
      });
    } catch (error) {
      logger.error("FCM notification failed", { error });
      throw error;
    }
  }

  private async sendAPNSNotification(deviceTokens: string[], notification: PushNotification): Promise<void> {
    const apnsCertPath = process.env.APNS_CERT_PATH;
    if (!apnsCertPath) {
      logger.debug("APNS not configured, skipping iOS push notification");
      return;
    }

    // TODO: Implement APNS using node-apn or similar library
    logger.debug("APNS notification would be sent", { tokens: deviceTokens.length });
  }

  private async sendEmailNotification(userId: string, notification: PushNotification): Promise<void> {
    // TODO: Implement email notifications using SendGrid, AWS SES, or similar
    logger.debug("Email notification would be sent", { userId, title: notification.title });
  }

  private isIOSToken(token: string): boolean {
    // iOS tokens are typically 64 characters of hexadecimal
    return /^[a-f0-9]{64}$/i.test(token);
  }

  async registerDeviceToken(userId: string, token: string, platform: "ios" | "android"): Promise<void> {
    try {
      // TODO: Store device tokens in database
      // This would require adding a device_tokens table to the schema
      logger.info("Device token registered", { userId, platform, tokenLength: token.length });
    } catch (error) {
      logger.error("Failed to register device token", { error, userId });
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      // TODO: Store preferences in user profile or separate table
      logger.info("Notification preferences updated", { userId, preferences });
    } catch (error) {
      logger.error("Failed to update notification preferences", { error, userId });
      throw error;
    }
  }

  async sendBulkNotification(
    userIds: string[],
    templateType: keyof typeof this.templates,
    variables: Record<string, string> = {}
  ): Promise<void> {
    logger.info("Sending bulk notification", {
      recipientCount: userIds.length,
      templateType,
    });

    const promises = userIds.map(async (userId) => {
      try {
        // TODO: Get user's device tokens and preferences from database
        const target: NotificationTarget = {
          userId,
          deviceTokens: [], // Would fetch from database
          preferences: {
            pushEnabled: true,
            emailEnabled: true,
            newMessages: true,
            newSubscribers: true,
            paymentUpdates: true,
            contentApproved: true,
            contentRejected: true,
            payoutProcessed: true,
          },
        };

        await this.sendNotification(target, templateType, variables);
      } catch (error) {
        logger.error("Failed to send notification to user", { error, userId });
      }
    });

    await Promise.all(promises);
    logger.info("Bulk notification completed", { userIds: userIds.length });
  }

  // Helper methods for common notification scenarios
  async notifyNewMessage(recipientId: string, senderName: string): Promise<void> {
    // TODO: Get recipient's notification target from database
    const target: NotificationTarget = {
      userId: recipientId,
      deviceTokens: [],
      preferences: { pushEnabled: true, emailEnabled: true, newMessages: true } as NotificationPreferences,
    };

    await this.sendNotification(target, "new_message", { senderName });
  }

  async notifyNewSubscriber(creatorId: string, fanName: string): Promise<void> {
    const target: NotificationTarget = {
      userId: creatorId,
      deviceTokens: [],
      preferences: { pushEnabled: true, emailEnabled: true, newSubscribers: true } as NotificationPreferences,
    };

    await this.sendNotification(target, "new_subscriber", { fanName });
  }

  async notifyPaymentReceived(creatorId: string, amount: string, fanName: string): Promise<void> {
    const target: NotificationTarget = {
      userId: creatorId,
      deviceTokens: [],
      preferences: { pushEnabled: true, emailEnabled: true, paymentUpdates: true } as NotificationPreferences,
    };

    await this.sendNotification(target, "payment_received", { amount, fanName });
  }
}

export const notificationService = new NotificationService();

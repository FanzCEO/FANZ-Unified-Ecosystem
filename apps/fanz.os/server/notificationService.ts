import twilio from "twilio";
import sgMail from "@sendgrid/mail";
import webpush from "web-push";
import { db } from "./db";
import { 
  notifications, 
  pushSubscriptions, 
  users,
  creatorPerformance 
} from "@shared/schema";
import { eq, and, gte, lte, lt } from "drizzle-orm";
import { RealTimeManager } from "./realtime";

// Initialize services
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@fanslab.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Send email notification
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured, skipping email");
    return;
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@fanslab.com",
      subject,
      text,
      html: html || text,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

// Send SMS notification
export async function sendSMS(to: string, body: string): Promise<void> {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn("Twilio not configured, skipping SMS");
    return;
  }

  try {
    await twilioClient.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
  }
}

// Send push notification
export async function sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("Web Push not configured, skipping push notification");
    return;
  }

  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      ));

    for (const subscription of subscriptions) {
      const pushData = {
        endpoint: subscription.endpoint,
        keys: subscription.keys as any,
      };

      try {
        await webpush.sendNotification(
          pushData,
          JSON.stringify({
            title,
            body,
            data,
            timestamp: Date.now(),
          })
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription expired, mark as inactive
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}

// Create and send notification
export async function createNotification(
  userId: string,
  type: any,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  try {
    // Create notification record
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        data,
      })
      .returning();

    // Get user preferences
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return;

    const prefs = user.notificationPreferences as any || {};

    // Send real-time notification via SSE
    RealTimeManager.getInstance().broadcast({
      type: "notification",
      data: notification,
    });

    // Send push notification if enabled
    if (prefs.push !== false) {
      await sendPushNotification(userId, title, message, data);
      await db
        .update(notifications)
        .set({ isPushSent: true })
        .where(eq(notifications.id, notification.id));
    }

    // Send email notification if enabled
    if (prefs.email !== false && user.email) {
      await sendEmail(user.email, title, message);
      await db
        .update(notifications)
        .set({ isEmailSent: true })
        .where(eq(notifications.id, notification.id));
    }

    // Send SMS notification if enabled
    if (prefs.sms !== false && user.phoneNumber) {
      await sendSMS(user.phoneNumber, `${title}: ${message}`);
      await db
        .update(notifications)
        .set({ isSmsSent: true })
        .where(eq(notifications.id, notification.id));
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Check creator posting activity and send reminders
export async function checkCreatorActivity(): Promise<void> {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Get all creators
    const creators = await db
      .select()
      .from(users)
      .where(eq(users.role, "creator"));

    for (const creator of creators) {
      // Check last post date
      if (!creator.lastPostDate) continue;

      const daysSinceLastPost = Math.floor(
        (now.getTime() - new Date(creator.lastPostDate).getTime()) / (24 * 60 * 60 * 1000)
      );

      // Send reminder if haven't posted in 3+ days
      if (daysSinceLastPost >= 3 && daysSinceLastPost < 7) {
        await createNotification(
          creator.id,
          "reminder_to_post",
          "Time to Create Content! 📸",
          `Hey ${creator.displayName || creator.firstName}! Your fans miss you! It's been ${daysSinceLastPost} days since your last post. Keep your audience engaged with fresh content!`,
          { daysSinceLastPost }
        );
      }

      // Send warning if haven't posted in 1+ week
      if (daysSinceLastPost >= 7 && daysSinceLastPost < 28) {
        await createNotification(
          creator.id,
          "account_warning",
          "⚠️ Account Activity Warning",
          `Your account has been inactive for ${Math.floor(daysSinceLastPost / 7)} week(s). Regular posting keeps your fans engaged and your earnings growing. Post at least once a week to avoid suspension.`,
          { weeksSinceLastPost: Math.floor(daysSinceLastPost / 7) }
        );

        // Update creator status to warning
        await db
          .update(users)
          .set({ creatorStatus: "warning" })
          .where(eq(users.id, creator.id));
      }

      // Suspend account if haven't posted in 4+ weeks
      if (daysSinceLastPost >= 28) {
        await createNotification(
          creator.id,
          "account_warning",
          "🚫 Account Suspended - Inactivity",
          "Your creator account has been suspended due to 4+ weeks of inactivity. Contact support to reactivate your account.",
          { suspended: true }
        );

        // Update creator status to suspended
        await db
          .update(users)
          .set({ creatorStatus: "suspended" })
          .where(eq(users.id, creator.id));
      }
    }

    // Check for top performers (5+ posts this week)
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    weekStart.setHours(0, 0, 0, 0);

    const topPerformers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "creator"),
        gte(users.weeklyPostCount, 5)
      ));

    for (const performer of topPerformers) {
      // Check if already marked as top performer this week
      const [existingRecord] = await db
        .select()
        .from(creatorPerformance)
        .where(and(
          eq(creatorPerformance.creatorId, performer.id),
          gte(creatorPerformance.weekStartDate, weekStart)
        ))
        .limit(1);

      if (!existingRecord?.isTopPerformer) {
        // Create performance record
        await db
          .insert(creatorPerformance)
          .values({
            creatorId: performer.id,
            weekStartDate: weekStart,
            weekEndDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
            postsCount: performer.weeklyPostCount,
            isTopPerformer: true,
          });

        // Update creator status
        await db
          .update(users)
          .set({ creatorStatus: "top_performer" })
          .where(eq(users.id, performer.id));

        // Send achievement notification
        await createNotification(
          performer.id,
          "achievement_unlocked",
          "🏆 Top Performer Achievement!",
          `Congratulations! You've posted ${performer.weeklyPostCount} times this week! You're now featured on our Top Performers board. Keep up the amazing work!`,
          { achievement: "top_performer", postsCount: performer.weeklyPostCount }
        );
      }
    }
  } catch (error) {
    console.error("Failed to check creator activity:", error);
  }
}

// Schedule creator activity checks (run every hour)
export function startCreatorActivityMonitoring(): void {
  // Run immediately
  checkCreatorActivity();
  
  // Schedule to run every hour
  setInterval(() => {
    checkCreatorActivity();
  }, 60 * 60 * 1000); // 1 hour
}

// Subscribe to push notifications
export async function subscribeToPush(
  userId: string,
  subscription: any,
  deviceType?: string
): Promise<void> {
  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          keys: subscription.keys,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      // Create new subscription
      await db
        .insert(pushSubscriptions)
        .values({
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          deviceType,
          isActive: true,
        });
    }
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(
  userId: string,
  endpoint: string
): Promise<void> {
  try {
    await db
      .update(pushSubscriptions)
      .set({ isActive: false })
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      ));
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
  }
}

// Mark notification as read
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

// Get user notifications
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0
): Promise<any[]> {
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get user notifications:", error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    return 0;
  }
}
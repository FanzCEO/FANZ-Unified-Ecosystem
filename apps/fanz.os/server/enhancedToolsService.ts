import { storage } from "./storage";
import { realTimeNotifications } from "./realTimeNotificationService";
import { externalStorage } from "./externalStorageService";
import cron from "node-cron";
import { createNotification } from "./notificationService";

// Content Analytics and Insights
export class AnalyticsService {
  async getCreatorAnalytics(creatorId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const startDate = this.getStartDate(period);
    
    const [
      totalEarnings,
      newSubscribers,
      contentViews,
      engagement,
      topContent
    ] = await Promise.all([
      this.getTotalEarnings(creatorId, startDate),
      this.getNewSubscribers(creatorId, startDate),
      this.getContentViews(creatorId, startDate),
      this.getEngagementStats(creatorId, startDate),
      this.getTopPerformingContent(creatorId, startDate)
    ]);

    return {
      period,
      earnings: totalEarnings,
      subscribers: newSubscribers,
      views: contentViews,
      engagement,
      topContent,
      generatedAt: new Date()
    };
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private async getTotalEarnings(creatorId: string, startDate: Date) {
    return await storage.getCreatorEarnings(creatorId, startDate);
  }

  private async getNewSubscribers(creatorId: string, startDate: Date) {
    return await storage.getNewSubscribersCount(creatorId, startDate);
  }

  private async getContentViews(creatorId: string, startDate: Date) {
    return await storage.getContentViews(creatorId, startDate);
  }

  private async getEngagementStats(creatorId: string, startDate: Date) {
    return await storage.getEngagementStats(creatorId, startDate);
  }

  private async getTopPerformingContent(creatorId: string, startDate: Date) {
    return await storage.getTopPerformingContent(creatorId, startDate, 10);
  }
}

// Content Moderation and Safety
export class ModerationService {
  private bannedWords = [
    // Add content moderation keywords here
    'illegal', 'underage', 'minor', 'child', 'rape', 'violence',
    // Add more as needed based on platform policies
  ];

  async moderateContent(content: string, mediaUrls?: string[]): Promise<{
    approved: boolean;
    flags: string[];
    confidence: number;
    requiresReview: boolean;
  }> {
    const flags: string[] = [];
    let confidence = 1.0;

    // Text moderation
    const textFlags = this.moderateText(content);
    flags.push(...textFlags);

    // Media moderation (if URLs provided)
    if (mediaUrls && mediaUrls.length > 0) {
      const mediaFlags = await this.moderateMedia(mediaUrls);
      flags.push(...mediaFlags);
    }

    const approved = flags.length === 0;
    const requiresReview = flags.some(flag => 
      ['explicit_content', 'potential_violation', 'spam'].includes(flag)
    );

    if (flags.length > 0) {
      confidence = Math.max(0.3, 1.0 - (flags.length * 0.2));
    }

    return { approved, flags, confidence, requiresReview };
  }

  private moderateText(content: string): string[] {
    const flags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for banned words
    for (const word of this.bannedWords) {
      if (lowerContent.includes(word)) {
        flags.push('banned_content');
        break;
      }
    }

    // Check for excessive caps (potential spam)
    if (content.length > 20 && content.match(/[A-Z]/g)?.length! / content.length > 0.7) {
      flags.push('excessive_caps');
    }

    // Check for potential spam patterns
    if (this.isSpamPattern(content)) {
      flags.push('spam');
    }

    return flags;
  }

  private async moderateMedia(mediaUrls: string[]): Promise<string[]> {
    const flags: string[] = [];
    
    // This would integrate with external AI moderation services
    // For now, we'll do basic checks
    for (const url of mediaUrls) {
      if (await this.isExplicitMedia(url)) {
        flags.push('explicit_content');
      }
    }

    return flags;
  }

  private isSpamPattern(content: string): boolean {
    // Basic spam detection patterns
    const patterns = [
      /(.)\1{4,}/, // Repeated characters
      /\b(https?:\/\/[^\s]+.*){3,}\b/, // Multiple URLs
      /\b(buy|click|free|money|earn|cash)\b.*\b(now|here|today)\b/i,
    ];

    return patterns.some(pattern => pattern.test(content));
  }

  private async isExplicitMedia(url: string): Promise<boolean> {
    // This would integrate with image recognition services
    // For now, return false (assume safe)
    return false;
  }
}

// Creator Performance Tracking
export class PerformanceTracker {
  async trackCreatorActivity(creatorId: string, activityType: string, metadata?: any) {
    await storage.recordCreatorActivity(creatorId, activityType, metadata);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(creatorId);
  }

  private async updatePerformanceMetrics(creatorId: string) {
    const activities = await storage.getCreatorActivities(creatorId, 7); // Last 7 days
    const metrics = this.calculatePerformanceMetrics(activities);
    
    await storage.updateCreatorPerformanceMetrics(creatorId, metrics);
  }

  private calculatePerformanceMetrics(activities: any[]): any {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    
    return {
      postsLast7Days: activities.filter(a => 
        a.activityType === 'post_created' && 
        (now.getTime() - new Date(a.createdAt).getTime()) <= 7 * dayMs
      ).length,
      
      averageEngagement: activities
        .filter(a => a.activityType === 'engagement')
        .reduce((sum, a) => sum + (a.metadata?.engagementRate || 0), 0) / activities.length || 0,
      
      responseRate: activities
        .filter(a => a.activityType === 'message_response')
        .reduce((sum, a) => sum + (a.metadata?.responseTime || 0), 0) / activities.length || 0,
      
      lastActiveDate: activities.length > 0 ? 
        new Date(Math.max(...activities.map(a => new Date(a.createdAt).getTime()))) : 
        null
    };
  }
}

// Automated Content Scheduling
export class ContentScheduler {
  private scheduledJobs = new Map<string, any>();

  async schedulePost(creatorId: string, postData: any, scheduledDate: Date): Promise<string> {
    const jobId = `post_${creatorId}_${Date.now()}`;
    
    // Store scheduled post
    await storage.createScheduledPost({
      id: jobId,
      creatorId,
      postData,
      scheduledDate,
      status: 'pending'
    });

    // Schedule the job
    const cronExpression = this.dateToCronExpression(scheduledDate);
    const job = cron.schedule(cronExpression, async () => {
      await this.executeScheduledPost(jobId);
    });

    this.scheduledJobs.set(jobId, job);
    job.start();

    return jobId;
  }

  async cancelScheduledPost(jobId: string) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.destroy();
      this.scheduledJobs.delete(jobId);
    }
    
    await storage.updateScheduledPost(jobId, { status: 'cancelled' });
  }

  private async executeScheduledPost(jobId: string) {
    try {
      const scheduledPost = await storage.getScheduledPost(jobId);
      if (!scheduledPost || scheduledPost.status !== 'pending') {
        return;
      }

      // Create the actual post
      const post = await storage.createPost(scheduledPost.creatorId, scheduledPost.postData);
      
      // Update scheduled post status
      await storage.updateScheduledPost(jobId, { 
        status: 'completed',
        actualPostId: post.id 
      });

      // Notify creator
      await realTimeNotifications.sendToUser(scheduledPost.creatorId, {
        type: 'scheduled_post_published',
        data: { postId: post.id, originalScheduleId: jobId }
      });

      // Clean up
      this.scheduledJobs.delete(jobId);
      
    } catch (error) {
      console.error('Error executing scheduled post:', error);
      await storage.updateScheduledPost(jobId, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private dateToCronExpression(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }
}

// Fan Engagement Tools
export class EngagementService {
  async createPoll(creatorId: string, pollData: {
    question: string;
    options: string[];
    duration: number; // hours
    accessLevel: 'free' | 'subscribers' | 'premium';
  }) {
    const poll = await storage.createPoll({
      ...pollData,
      creatorId,
      expiresAt: new Date(Date.now() + pollData.duration * 60 * 60 * 1000)
    });

    // Notify eligible fans
    await this.notifyEligibleFans(creatorId, pollData.accessLevel, {
      type: 'new_poll',
      data: { pollId: poll.id, question: pollData.question }
    });

    return poll;
  }

  async createContest(creatorId: string, contestData: {
    title: string;
    description: string;
    prize: string;
    endDate: Date;
    entryRequirements: string[];
  }) {
    const contest = await storage.createContest({
      ...contestData,
      creatorId,
      status: 'active'
    });

    // Notify all fans
    await this.notifyEligibleFans(creatorId, 'free', {
      type: 'new_contest',
      data: { contestId: contest.id, title: contestData.title, prize: contestData.prize }
    });

    return contest;
  }

  private async notifyEligibleFans(
    creatorId: string, 
    accessLevel: string, 
    notification: any
  ) {
    const fans = await storage.getCreatorFans(creatorId, accessLevel);
    
    for (const fan of fans) {
      await realTimeNotifications.sendToUser(fan.id, notification);
      await createNotification(
        fan.id,
        notification.type,
        notification.data.title || 'New Activity',
        notification.data.description || 'Check out the latest from your creator'
      );
    }
  }
}

// Revenue Optimization
export class RevenueOptimizer {
  async analyzeOptimalPricing(creatorId: string): Promise<{
    subscriptionPrice: number;
    averagePPVPrice: number;
    tipRecommendations: number[];
    reasoning: string;
  }> {
    const [
      historicalData,
      marketData,
      fanBehavior
    ] = await Promise.all([
      this.getHistoricalPricingData(creatorId),
      this.getMarketAverages(),
      this.getFanSpendingPatterns(creatorId)
    ]);

    return this.calculateOptimalPricing(historicalData, marketData, fanBehavior);
  }

  private async getHistoricalPricingData(creatorId: string) {
    return await storage.getCreatorPricingHistory(creatorId);
  }

  private async getMarketAverages() {
    return await storage.getMarketPricingAverages();
  }

  private async getFanSpendingPatterns(creatorId: string) {
    return await storage.getFanSpendingPatterns(creatorId);
  }

  private calculateOptimalPricing(historical: any, market: any, fanBehavior: any) {
    // AI-driven pricing optimization logic would go here
    // For now, return reasonable defaults
    return {
      subscriptionPrice: Math.max(9.99, Math.min(49.99, market.averageSubscription * 0.9)),
      averagePPVPrice: Math.max(4.99, Math.min(24.99, market.averagePPV * 0.85)),
      tipRecommendations: [5, 10, 25, 50, 100],
      reasoning: "Based on market analysis and fan spending patterns"
    };
  }
}

// Export all services
export const analyticsService = new AnalyticsService();
export const moderationService = new ModerationService();
export const performanceTracker = new PerformanceTracker();
export const contentScheduler = new ContentScheduler();
export const engagementService = new EngagementService();
export const revenueOptimizer = new RevenueOptimizer();

// Initialize cron jobs for automated tasks
export function initializeAutomatedTasks() {
  // Daily analytics update
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily analytics update...');
    // Update analytics for all active creators
  });

  // Weekly performance review
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly performance review...');
    // Generate performance reports for creators
  });

  // Monthly revenue optimization
  cron.schedule('0 10 1 * *', async () => {
    console.log('Running monthly revenue optimization...');
    // Analyze and suggest pricing optimizations
  });
}
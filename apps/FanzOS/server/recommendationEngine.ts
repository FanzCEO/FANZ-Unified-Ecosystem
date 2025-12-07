import { db } from "./db";
import { 
  users, 
  posts, 
  subscriptions, 
  likes, 
  comments, 
  shortVideos,
  shortVideoViews,
  shortVideoReactions,
  ppvUnlocks,
  transactions
} from "@shared/schema";
import { eq, and, desc, sql, inArray, gt, lt, ne } from "drizzle-orm";

export interface RecommendationScore {
  contentId: string;
  contentType: 'post' | 'short_video';
  score: number;
  reasons: string[];
  creatorId: string;
  creatorName?: string;
  title?: string;
  thumbnail?: string;
  tags?: string[];
}

export interface UserProfile {
  userId: string;
  preferences: {
    categories: string[];
    creators: string[];
    contentTypes: string[];
    priceRange?: { min: number; max: number };
  };
  behavior: {
    avgSessionTime: number;
    preferredTimes: string[];
    engagementRate: number;
    spendingPattern: number;
  };
}

export class IntelligentRecommendationEngine {
  private readonly WEIGHTS = {
    CREATOR_AFFINITY: 0.3,      // How much user likes specific creators
    CONTENT_SIMILARITY: 0.25,   // Similar content to what they've engaged with
    SOCIAL_PROOF: 0.2,          // Popular content (likes, views)
    RECENCY: 0.1,              // Newer content gets slight boost
    DIVERSITY: 0.1,            // Prevent echo chamber
    PRICE_PREFERENCE: 0.05      // Match user's spending patterns
  };

  constructor() {}

  /**
   * Get personalized content recommendations for a user
   */
  async getRecommendations(
    userId: string, 
    limit: number = 20,
    excludeTypes: string[] = []
  ): Promise<RecommendationScore[]> {
    const userProfile = await this.buildUserProfile(userId);
    const candidateContent = await this.getCandidateContent(userId, excludeTypes);
    
    const scoredContent = await Promise.all(
      candidateContent.map(content => this.scoreContent(content, userProfile))
    );

    // Sort by score and apply diversity filter
    const recommendations = scoredContent
      .filter(item => item.score > 0.1) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2); // Get more for diversity filtering

    return this.applyDiversityFilter(recommendations, limit);
  }

  /**
   * Build comprehensive user profile from behavior data
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user's subscription patterns
    const userSubscriptions = await db
      .select({
        creatorId: subscriptions.creatorId,
        createdAt: subscriptions.createdAt
      })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.fanId, userId),
        eq(subscriptions.isActive, true)
      ));

    // Get engagement history
    const likedPosts = await db
      .select({
        postId: likes.postId,
        createdAt: likes.createdAt,
        post: {
          creatorId: posts.creatorId,
          content: posts.content,
          postType: posts.postType
        }
      })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt))
      .limit(100);

    // Get short video engagement
    const videoEngagement = await db
      .select({
        shortVideoId: shortVideoViews.shortVideoId,
        watchTime: shortVideoViews.watchTime,
        completed: shortVideoViews.completed,
        video: {
          creatorId: shortVideos.creatorId,
          title: shortVideos.title
        }
      })
      .from(shortVideoViews)
      .innerJoin(shortVideos, eq(shortVideoViews.shortVideoId, shortVideos.id))
      .where(eq(shortVideoViews.userId, userId))
      .orderBy(desc(shortVideoViews.createdAt))
      .limit(100);

    // Get spending patterns
    const transactions = await db
      .select({
        amount: transactions.amount,
        type: transactions.type,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    // Analyze preferences from engagement data
    const preferredCreators = [
      ...subscriptions.map(s => s.creatorId),
      ...likedPosts.map(p => p.post.creatorId),
      ...videoEngagement.map(v => v.video.creatorId)
    ];

    const preferredTags = [
      ...likedPosts.flatMap(p => p.post.tags || []),
      ...videoEngagement.flatMap(v => v.video.tags || [])
    ];

    // Calculate engagement metrics
    const totalViews = videoEngagement.length;
    const completedViews = videoEngagement.filter(v => v.completed).length;
    const engagementRate = totalViews > 0 ? completedViews / totalViews : 0;

    // Calculate spending patterns
    const avgSpending = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length 
      : 0;

    return {
      userId,
      preferences: {
        categories: this.getTopItems(preferredTags, 5),
        creators: this.getTopItems(preferredCreators, 10),
        contentTypes: likedPosts.map(p => p.post.contentType || 'image'),
        priceRange: avgSpending > 0 ? { 
          min: Math.max(0, avgSpending * 0.5), 
          max: avgSpending * 2 
        } : undefined
      },
      behavior: {
        avgSessionTime: videoEngagement.reduce((sum, v) => sum + (v.watchTime || 0), 0) / Math.max(1, videoEngagement.length),
        preferredTimes: this.analyzeActiveHours(likedPosts.map(p => p.createdAt)),
        engagementRate,
        spendingPattern: avgSpending
      }
    };
  }

  /**
   * Get candidate content for recommendation
   */
  private async getCandidateContent(userId: string, excludeTypes: string[] = []) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get recent posts from creators user hasn't seen
    const recentPosts = await db
      .select({
        id: posts.id,
        creatorId: posts.creatorId,
        title: posts.title,
        contentType: posts.contentType,
        tags: posts.tags,
        price: posts.price,
        visibility: posts.visibility,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        type: sql<'post'>`'post'`
      })
      .from(posts)
      .where(and(
        ne(posts.creatorId, userId), // Not user's own content
        gt(posts.createdAt, oneWeekAgo),
        inArray(posts.visibility, ['public', 'subscribers', 'ppv'])
      ))
      .orderBy(desc(posts.createdAt))
      .limit(200);

    // Get recent short videos
    const recentVideos = await db
      .select({
        id: shortVideos.id,
        creatorId: shortVideos.creatorId,
        title: shortVideos.title,
        contentType: sql<string>`'video'`,
        tags: shortVideos.tags,
        price: sql<number>`0`, // Short videos are typically free
        visibility: sql<string>`'public'`,
        likesCount: shortVideos.likesCount,
        commentsCount: shortVideos.commentsCount,
        createdAt: shortVideos.createdAt,
        viewsCount: shortVideos.viewsCount,
        type: sql<'short_video'>`'short_video'`
      })
      .from(shortVideos)
      .where(and(
        ne(shortVideos.creatorId, userId),
        gt(shortVideos.createdAt, oneWeekAgo)
      ))
      .orderBy(desc(shortVideos.createdAt))
      .limit(200);

    return [...recentPosts, ...recentVideos].filter(content => 
      !excludeTypes.includes(content.type)
    );
  }

  /**
   * Score individual content item for user
   */
  private async scoreContent(content: any, userProfile: UserProfile): Promise<RecommendationScore> {
    let score = 0;
    const reasons: string[] = [];

    // Creator Affinity Score
    const creatorAffinity = userProfile.preferences.creators.includes(content.creatorId) ? 1 : 0;
    if (creatorAffinity > 0) {
      reasons.push("From creator you follow");
    }
    score += creatorAffinity * this.WEIGHTS.CREATOR_AFFINITY;

    // Content Similarity Score
    const contentTags = content.tags || [];
    const tagOverlap = contentTags.filter(tag => 
      userProfile.preferences.categories.includes(tag)
    ).length;
    const similarityScore = tagOverlap / Math.max(1, contentTags.length);
    if (similarityScore > 0) {
      reasons.push(`Matches your interests: ${contentTags.slice(0, 2).join(', ')}`);
    }
    score += similarityScore * this.WEIGHTS.CONTENT_SIMILARITY;

    // Social Proof Score
    const totalEngagement = (content.likesCount || 0) + (content.commentsCount || 0) + (content.viewsCount || 0);
    const socialScore = Math.min(1, totalEngagement / 100); // Normalize to 0-1
    if (socialScore > 0.5) {
      reasons.push("Popular with other users");
    }
    score += socialScore * this.WEIGHTS.SOCIAL_PROOF;

    // Recency Score
    const hoursSinceCreated = (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - hoursSinceCreated / 168); // 1 week decay
    score += recencyScore * this.WEIGHTS.RECENCY;

    // Price Preference Score
    let priceScore = 1; // Default for free content
    if (content.price > 0 && userProfile.preferences.priceRange) {
      const { min, max } = userProfile.preferences.priceRange;
      if (content.price >= min && content.price <= max) {
        priceScore = 1;
        reasons.push("Within your price range");
      } else if (content.price < min) {
        priceScore = 0.8; // Good deal
        reasons.push("Great value");
      } else {
        priceScore = 0.3; // Expensive
      }
    }
    score += priceScore * this.WEIGHTS.PRICE_PREFERENCE;

    // Get creator name for display
    const creator = await db
      .select({ username: users.username, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, content.creatorId))
      .limit(1);

    return {
      contentId: content.id,
      contentType: content.type,
      score,
      reasons,
      creatorId: content.creatorId,
      creatorName: creator[0]?.displayName || creator[0]?.username,
      title: content.title,
      thumbnail: content.thumbnail,
      tags: content.tags
    };
  }

  /**
   * Apply diversity filter to prevent echo chamber
   */
  private applyDiversityFilter(recommendations: RecommendationScore[], limit: number): RecommendationScore[] {
    const result: RecommendationScore[] = [];
    const creatorCounts: { [key: string]: number } = {};
    const tagCounts: { [key: string]: number } = {};

    for (const rec of recommendations) {
      if (result.length >= limit) break;

      // Check diversity constraints
      const creatorCount = creatorCounts[rec.creatorId] || 0;
      const maxPerCreator = Math.max(2, Math.floor(limit / 5)); // Max 20% from same creator
      
      if (creatorCount >= maxPerCreator) continue;

      // Add to results
      result.push(rec);
      creatorCounts[rec.creatorId] = creatorCount + 1;
      
      // Track tag diversity
      rec.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }

    return result;
  }

  /**
   * Get trending content across the platform
   */
  async getTrendingContent(limit: number = 20): Promise<RecommendationScore[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get trending posts
    const trendingPosts = await db
      .select({
        id: posts.id,
        creatorId: posts.creatorId,
        title: posts.title,
        contentType: posts.contentType,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        score: sql<number>`(${posts.likesCount} * 2 + ${posts.commentsCount} * 3) / EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) * 3600`
      })
      .from(posts)
      .where(and(
        gt(posts.createdAt, oneDayAgo),
        eq(posts.visibility, 'public')
      ))
      .orderBy(desc(sql`(${posts.likesCount} * 2 + ${posts.commentsCount} * 3) / EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) * 3600`))
      .limit(limit);

    return trendingPosts.map(post => ({
      contentId: post.id,
      contentType: 'post' as const,
      score: Number(post.score) || 0,
      reasons: ['Trending now'],
      creatorId: post.creatorId,
      title: post.title,
      tags: post.tags
    }));
  }

  /**
   * Get recommendations for new users with no history
   */
  async getNewUserRecommendations(limit: number = 20): Promise<RecommendationScore[]> {
    // Get most popular content from top creators
    const popularContent = await db
      .select({
        id: posts.id,
        creatorId: posts.creatorId,
        title: posts.title,
        contentType: posts.contentType,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(eq(posts.visibility, 'public'))
      .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount}`))
      .limit(limit);

    return popularContent.map(post => ({
      contentId: post.id,
      contentType: 'post' as const,
      score: (post.likesCount + post.commentsCount) / 100,
      reasons: ['Popular content'],
      creatorId: post.creatorId,
      title: post.title,
      tags: post.tags
    }));
  }

  /**
   * Utility: Get top occurring items in array
   */
  private getTopItems<T>(items: T[], limit: number): T[] {
    const counts = items.reduce((acc, item) => {
      acc[String(item)] = (acc[String(item)] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item as T);
  }

  /**
   * Utility: Analyze user's active hours
   */
  private analyzeActiveHours(timestamps: string[]): string[] {
    const hourCounts = timestamps.reduce((acc, timestamp) => {
      const hour = new Date(timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  /**
   * Update user preferences based on new interaction
   */
  async updateUserPreferences(userId: string, contentId: string, action: 'like' | 'view' | 'purchase'): Promise<void> {
    // This would update user preference weights based on their actions
    // Implementation would involve machine learning models for more sophisticated preference learning
    console.log(`Updating preferences for user ${userId} based on ${action} on content ${contentId}`);
  }
}

export const recommendationEngine = new IntelligentRecommendationEngine();
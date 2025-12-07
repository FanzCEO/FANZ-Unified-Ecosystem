import { db } from "../db";
import { users, posts, subscriptions, likes } from "@shared/schema";
import { eq, desc, and, sql, ne, gt } from "drizzle-orm";

export interface SimpleRecommendation {
  contentId: string;
  contentType: 'post';
  score: number;
  creatorId: string;
  creatorName?: string;
}

export class RecommendationService {
  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<SimpleRecommendation[]> {
    try {
      // Get user's liked posts to understand preferences
      const userLikes = await db
        .select({ postId: likes.postId })
        .from(likes)
        .where(eq(likes.userId, userId))
        .limit(50);

      const likedPostIds = userLikes.map(l => l.postId);

      // Get popular posts from creators user follows
      const recommendations = await db
        .select({
          id: posts.id,
          creatorId: posts.creatorId,
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount,
          createdAt: posts.createdAt
        })
        .from(posts)
        .where(and(
          ne(posts.creatorId, userId),
          gt(posts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        ))
        .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount}`))
        .limit(limit);

      return recommendations.map(post => ({
        contentId: post.id,
        contentType: 'post' as const,
        score: (post.likesCount || 0) + (post.commentsCount || 0),
        creatorId: post.creatorId
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getTrendingContent(limit: number = 20): Promise<SimpleRecommendation[]> {
    try {
      const trending = await db
        .select({
          id: posts.id,
          creatorId: posts.creatorId,
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount
        })
        .from(posts)
        .where(gt(posts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
        .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount}`))
        .limit(limit);

      return trending.map(post => ({
        contentId: post.id,
        contentType: 'post' as const,
        score: (post.likesCount || 0) + (post.commentsCount || 0),
        creatorId: post.creatorId
      }));
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }
}

export const recommendationService = new RecommendationService();
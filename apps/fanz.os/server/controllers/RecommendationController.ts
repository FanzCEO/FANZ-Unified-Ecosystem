import { Request, Response } from 'express';
import { recommendationEngine } from '../recommendationEngine';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class RecommendationController {
  /**
   * Get personalized recommendations for authenticated user
   */
  async getPersonalizedRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { 
        limit = 20, 
        excludeTypes = [],
        includeReasoning = false 
      } = req.query;

      const recommendations = await recommendationEngine.getRecommendations(
        userId,
        Number(limit),
        Array.isArray(excludeTypes) ? excludeTypes : excludeTypes ? [excludeTypes] : []
      );

      // Format response based on includeReasoning flag
      const response = recommendations.map(rec => ({
        contentId: rec.contentId,
        contentType: rec.contentType,
        score: rec.score,
        creatorId: rec.creatorId,
        creatorName: rec.creatorName,
        title: rec.title,
        thumbnail: rec.thumbnail,
        tags: rec.tags,
        ...(includeReasoning && { reasons: rec.reasons })
      }));

      res.json({
        recommendations: response,
        total: response.length,
        userId,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to get recommendations',
        details: error.message 
      });
    }
  }

  /**
   * Get trending content across the platform
   */
  async getTrending(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const trending = await recommendationEngine.getTrendingContent(Number(limit));
      
      res.json({
        trending,
        total: trending.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting trending content:', error);
      res.status(500).json({ 
        error: 'Failed to get trending content',
        details: error.message 
      });
    }
  }

  /**
   * Get recommendations for new users
   */
  async getNewUserRecommendations(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const recommendations = await recommendationEngine.getNewUserRecommendations(Number(limit));
      
      res.json({
        recommendations,
        total: recommendations.length,
        type: 'new_user',
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting new user recommendations:', error);
      res.status(500).json({ 
        error: 'Failed to get new user recommendations',
        details: error.message 
      });
    }
  }

  /**
   * Get similar content based on a specific content item
   */
  async getSimilarContent(req: Request, res: Response) {
    try {
      const { contentId, contentType } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.user?.claims?.sub;

      if (!contentId || !contentType) {
        return res.status(400).json({ error: 'contentId and contentType are required' });
      }

      // For now, we'll use the general recommendation engine
      // In a full implementation, this would use content-based similarity
      const recommendations = userId 
        ? await recommendationEngine.getRecommendations(userId, Number(limit) * 2)
        : await recommendationEngine.getNewUserRecommendations(Number(limit) * 2);

      // Filter out the original content and limit results
      const similarContent = recommendations
        .filter(rec => rec.contentId !== contentId)
        .slice(0, Number(limit));

      res.json({
        similarContent,
        originalContentId: contentId,
        originalContentType: contentType,
        total: similarContent.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting similar content:', error);
      res.status(500).json({ 
        error: 'Failed to get similar content',
        details: error.message 
      });
    }
  }

  /**
   * Update user preferences based on interaction
   */
  async trackInteraction(req: Request, res: Response) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { contentId, action, metadata } = req.body;
      
      if (!contentId || !action) {
        return res.status(400).json({ error: 'contentId and action are required' });
      }

      if (!['like', 'view', 'purchase', 'share', 'comment'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action type' });
      }

      // Update preferences (this would be more sophisticated in a full ML implementation)
      await recommendationEngine.updateUserPreferences(userId, contentId, action);

      // Track the interaction for analytics
      console.log(`User ${userId} performed ${action} on content ${contentId}`, metadata);

      res.json({
        success: true,
        message: 'Interaction tracked successfully',
        userId,
        contentId,
        action,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
      res.status(500).json({ 
        error: 'Failed to track interaction',
        details: error.message 
      });
    }
  }

  /**
   * Get user's recommendation preferences and profile
   */
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user basic info
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build user profile for recommendations
      const profileBuilder = new (await import('../recommendationEngine')).IntelligentRecommendationEngine();
      // Access the private method through a public wrapper (in a real implementation, we'd make this public)
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          memberSince: user.createdAt
        },
        message: 'User profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ 
        error: 'Failed to get user profile',
        details: error.message 
      });
    }
  }

  /**
   * Get recommendation statistics and insights
   */
  async getRecommendationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.claims?.sub;
      
      // This would include analytics about recommendation performance
      const stats = {
        totalRecommendations: 0,
        clickThroughRate: 0,
        topCategories: [],
        topCreators: [],
        engagementScore: 0,
        lastUpdated: new Date().toISOString()
      };

      res.json({
        stats,
        userId,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      res.status(500).json({ 
        error: 'Failed to get recommendation statistics',
        details: error.message 
      });
    }
  }
}
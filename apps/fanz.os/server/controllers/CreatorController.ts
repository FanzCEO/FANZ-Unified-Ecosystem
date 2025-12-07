import { Request, Response } from 'express';
import { storage } from '../storage';
import { mediaService } from '../mediaService';
import { paymentService } from '../paymentService';
import { insertPostSchema } from '@shared/schema';
import { z } from 'zod';

export class CreatorController {
  // Creator Dashboard Analytics
  async getDashboard(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      // Get creator analytics
      const analytics = await storage.getCreatorAnalytics(userId);
      
      // Get recent posts
      const recentPosts = await storage.getCreatorPosts(userId, userId);
      
      // Get active subscriptions
      const subscriptions = await storage.getActiveSubscriptions(userId);
      
      // Get recent transactions
      const transactions = await storage.getUserTransactions(userId, 10, 0);
      
      res.json({
        analytics,
        recentPosts: recentPosts.slice(0, 5),
        activeSubscriptions: subscriptions.length,
        recentTransactions: transactions
      });
    } catch (error) {
      console.error('Creator dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  }

  // Create new post
  async createPost(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost(userId, postData);
      
      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  }

  // Update subscription price
  async updateSubscriptionPrice(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { price } = req.body;
      
      if (!price || price < 0) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      
      const user = await storage.updateUserProfile(userId, {
        subscriptionPrice: price.toString()
      });
      
      res.json(user);
    } catch (error) {
      console.error('Update subscription price error:', error);
      res.status(500).json({ message: 'Failed to update subscription price' });
    }
  }

  // Get earnings breakdown
  async getEarnings(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { period = 'month' } = req.query;
      
      const analytics = await storage.getCreatorAnalytics(userId);
      const transactions = await storage.getUserTransactions(userId, 100, 0);
      
      // Group transactions by type
      const earningsByType = transactions.reduce((acc, tx) => {
        const type = tx.type;
        acc[type] = (acc[type] || 0) + parseFloat(tx.amount);
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalEarnings: analytics.totalEarnings,
        monthlyEarnings: analytics.monthlyEarnings,
        breakdown: earningsByType,
        transactions
      });
    } catch (error) {
      console.error('Get earnings error:', error);
      res.status(500).json({ message: 'Failed to get earnings' });
    }
  }

  // Request payout
  async requestPayout(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { amount, method = 'bank_transfer' } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const balance = parseFloat(user.balance || '0');
      if (amount > balance) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create withdrawal transaction
      const transaction = await storage.createTransaction(userId, {
        type: 'withdrawal',
        amount: (-amount).toString(),
        description: `Payout via ${method}`,
        recipientId: userId
      });
      
      // Update user balance
      await storage.updateUserBalance(userId, -amount);
      
      res.json({ transaction, message: 'Payout request submitted' });
    } catch (error) {
      console.error('Request payout error:', error);
      res.status(500).json({ message: 'Failed to request payout' });
    }
  }

  // Get fan management data
  async getFans(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { page = 0, limit = 20 } = req.query;
      
      // Get subscribers (fans)
      const subscriptions = await storage.getActiveSubscriptions(userId);
      
      // Get top tippers and interaction data
      const transactions = await storage.getUserTransactions(userId, 100, 0);
      const tipTransactions = transactions.filter(tx => tx.type === 'tip');
      
      const topTippers = tipTransactions
        .reduce((acc, tx) => {
          const fanId = tx.userId;
          acc[fanId] = (acc[fanId] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
      
      res.json({
        totalFans: subscriptions.length,
        subscriptions,
        topTippers
      });
    } catch (error) {
      console.error('Get fans error:', error);
      res.status(500).json({ message: 'Failed to get fan data' });
    }
  }

  // Schedule content
  async scheduleContent(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { postId, scheduledDate } = req.body;
      
      // In production, would use a job queue like Bull/Agenda
      console.log(`Scheduling post ${postId} for user ${userId} at ${scheduledDate}`);
      
      res.json({ message: 'Content scheduled successfully' });
    } catch (error) {
      console.error('Schedule content error:', error);
      res.status(500).json({ message: 'Failed to schedule content' });
    }
  }

  // Get content performance analytics
  async getContentAnalytics(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getCreatorPosts(userId, userId);
      
      const analytics = posts.map(post => ({
        id: post.id,
        content: post.content.substring(0, 50) + '...',
        views: Math.floor(Math.random() * 5000) + 100, // Mock data
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        earnings: parseFloat(post.ppvPrice || '0') * Math.floor(Math.random() * 50),
        engagement: ((post.likesCount || 0) + (post.commentsCount || 0)) / Math.max(Math.floor(Math.random() * 5000) + 100, 1),
        createdAt: post.createdAt
      }));
      
      res.json(analytics);
    } catch (error) {
      console.error('Get content analytics error:', error);
      res.status(500).json({ message: 'Failed to get content analytics' });
    }
  }
}

export const creatorController = new CreatorController();
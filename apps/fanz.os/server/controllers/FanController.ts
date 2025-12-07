import { Request, Response } from 'express';
import { storage } from '../storage';
import { paymentService, PaymentProcessor, PaymentType } from '../paymentService';
import { insertSubscriptionSchema, insertTransactionSchema } from '@shared/schema';
import { realTimeManager } from '../realtime';

export class FanController {
  // Get personalized feed
  async getFeed(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { page = 0, limit = 20 } = req.query;
      
      const posts = await storage.getFeedPosts(userId, parseInt(limit), parseInt(page) * parseInt(limit));
      
      // Add additional data for each post
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        const creator = await storage.getUser(post.creatorId);
        const hasLiked = await storage.hasLikedPost(userId, post.id);
        const isSubscribed = await storage.isSubscribed(userId, post.creatorId);
        const hasPpvUnlock = post.ppvPrice ? await storage.hasPpvUnlock(userId, post.id) : true;
        
        return {
          ...post,
          creator: {
            id: creator?.id,
            username: creator?.username,
            displayName: creator?.displayName,
            profileImageUrl: creator?.profileImageUrl,
            isVerified: creator?.isVerified
          },
          hasLiked,
          isSubscribed,
          hasPpvUnlock
        };
      }));
      
      res.json(enrichedPosts);
    } catch (error) {
      console.error('Get feed error:', error);
      res.status(500).json({ message: 'Failed to get feed' });
    }
  }

  // Subscribe to creator
  async subscribeToCreator(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;
      const { paymentProcessor = PaymentProcessor.CCBILL } = req.body;
      
      const creator = await storage.getUser(creatorId);
      if (!creator) {
        return res.status(404).json({ message: 'Creator not found' });
      }
      
      const subscriptionPrice = parseFloat(creator.subscriptionPrice || '0');
      if (subscriptionPrice <= 0) {
        return res.status(400).json({ message: 'Creator subscription not available' });
      }
      
      // Check if already subscribed
      const existingSubscription = await storage.getSubscription(userId, creatorId);
      if (existingSubscription) {
        return res.status(400).json({ message: 'Already subscribed' });
      }
      
      // Process payment
      const paymentResult = await paymentService.processPayment({
        processor: paymentProcessor,
        type: PaymentType.SUBSCRIPTION,
        amount: subscriptionPrice,
        currency: 'USD',
        userId,
        creatorId,
        description: `Subscription to ${creator.displayName || creator.username}`
      });
      
      if (!paymentResult.success) {
        return res.status(400).json({ message: 'Payment failed', error: paymentResult.error });
      }
      
      // Create subscription
      const subscription = await storage.createSubscription({
        fanId: userId,
        creatorId,
        price: subscriptionPrice.toString(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      // Create transaction record
      await storage.createTransaction(userId, {
        type: 'subscription',
        amount: subscriptionPrice.toString(),
        description: `Subscription to ${creator.displayName || creator.username}`,
        recipientId: creatorId,
        subscriptionId: subscription.id
      });
      
      // Send real-time notification to creator
      const fan = await storage.getUser(userId);
      await realTimeManager.notifySubscription(creatorId, {
        fanId: userId,
        fanName: fan?.displayName || fan?.username,
        amount: subscriptionPrice,
        duration: '30 days'
      });
      
      res.json({ subscription, paymentUrl: paymentResult.paymentUrl });
    } catch (error) {
      console.error('Subscribe error:', error);
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  }

  // Send tip to creator
  async sendTip(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, amount, message = '', paymentProcessor = PaymentProcessor.CCBILL } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid tip amount' });
      }
      
      const creator = await storage.getUser(creatorId);
      if (!creator) {
        return res.status(404).json({ message: 'Creator not found' });
      }
      
      // Process payment
      const paymentResult = await paymentService.processPayment({
        processor: paymentProcessor,
        type: PaymentType.TIP,
        amount,
        currency: 'USD',
        userId,
        creatorId,
        description: `Tip to ${creator.displayName || creator.username}`,
        metadata: { message }
      });
      
      if (!paymentResult.success) {
        return res.status(400).json({ message: 'Payment failed', error: paymentResult.error });
      }
      
      // Create transaction
      const transaction = await storage.createTransaction(userId, {
        type: 'tip',
        amount: amount.toString(),
        description: `Tip: ${message}`,
        recipientId: creatorId
      });
      
      // Update creator balance
      await storage.updateUserBalance(creatorId, amount * 0.8); // 80% to creator, 20% platform fee
      
      // Send real-time notification to creator
      const fan = await storage.getUser(userId);
      await realTimeManager.notifyTip(creatorId, {
        fanId: userId,
        fanName: fan?.displayName || fan?.username,
        amount,
        message: message || 'Sent you a tip!',
        timestamp: new Date().toISOString()
      });
      
      res.json({ transaction, message: 'Tip sent successfully' });
    } catch (error) {
      console.error('Send tip error:', error);
      res.status(500).json({ message: 'Failed to send tip' });
    }
  }

  // Purchase PPV content
  async purchasePPV(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const price = parseFloat(post.ppvPrice || '0');
      if (price <= 0) {
        return res.status(400).json({ message: 'Post is not PPV content' });
      }
      
      // Check if already unlocked
      const hasUnlock = await storage.hasPpvUnlock(userId, postId);
      if (hasUnlock) {
        return res.status(400).json({ message: 'Content already unlocked' });
      }
      
      // Create PPV unlock
      const unlock = await storage.unlockPpvContent(userId, postId, price);
      
      // Notify creator of PPV purchase
      const fan = await storage.getUser(userId);
      await realTimeManager.broadcastEvent({
        type: 'tip',
        creatorId: post.userId,
        data: {
          action: 'ppv_purchase',
          fanName: fan?.displayName || fan?.username,
          contentTitle: post.title || 'PPV Content',
          amount: price,
          postId
        },
        priority: 'high'
      });
      
      res.json({ unlock, message: 'Content unlocked successfully' });
    } catch (error) {
      console.error('Purchase PPV error:', error);
      res.status(500).json({ message: 'Failed to purchase content' });
    }
  }

  // Get user's subscriptions
  async getSubscriptions(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      const subscriptions = await storage.getActiveSubscriptions(userId);
      
      // Enrich with creator data
      const enrichedSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
        const creator = await storage.getUser(sub.creatorId);
        return {
          ...sub,
          creator: {
            id: creator?.id,
            username: creator?.username,
            displayName: creator?.displayName,
            profileImageUrl: creator?.profileImageUrl,
            isVerified: creator?.isVerified
          }
        };
      }));
      
      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({ message: 'Failed to get subscriptions' });
    }
  }

  // Cancel subscription
  async cancelSubscription(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { subscriptionId } = req.params;
      
      const subscription = await storage.getSubscription(userId, subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      await storage.cancelSubscription(subscriptionId);
      
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  }

  // Like/unlike post
  async toggleLike(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      const hasLiked = await storage.hasLikedPost(userId, postId);
      
      if (hasLiked) {
        await storage.unlikePost(userId, postId);
        res.json({ liked: false, message: 'Post unliked' });
      } else {
        await storage.likePost(userId, postId);
        res.json({ liked: true, message: 'Post liked' });
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  }

  // Get purchase history
  async getPurchaseHistory(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { page = 0, limit = 20 } = req.query;
      
      const transactions = await storage.getUserTransactions(userId, parseInt(limit), parseInt(page) * parseInt(limit));
      
      res.json(transactions);
    } catch (error) {
      console.error('Get purchase history error:', error);
      res.status(500).json({ message: 'Failed to get purchase history' });
    }
  }

  // Discover creators
  async discoverCreators(req: any, res: Response) {
    try {
      const { limit = 20 } = req.query;
      
      const topCreators = await storage.getTopCreators(parseInt(limit));
      
      res.json(topCreators);
    } catch (error) {
      console.error('Discover creators error:', error);
      res.status(500).json({ message: 'Failed to discover creators' });
    }
  }
}

export const fanController = new FanController();
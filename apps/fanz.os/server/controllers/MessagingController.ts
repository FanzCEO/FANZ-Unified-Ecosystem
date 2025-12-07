import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMessageSchema } from '@shared/schema';
import { smsService, SMSMessageType } from '../smsService';
import { realTimeManager } from '../realtime';

export class MessagingController {
  // Send message
  async sendMessage(req: any, res: Response) {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse(req.body);
      
      // Check if sender is subscribed to receiver (if receiver is creator)
      const receiver = await storage.getUser(messageData.receiverId);
      if (receiver?.role === 'creator') {
        const isSubscribed = await storage.isSubscribed(senderId, messageData.receiverId);
        if (!isSubscribed) {
          return res.status(403).json({ message: 'Must be subscribed to message this creator' });
        }
      }
      
      const message = await storage.sendMessage(senderId, messageData);
      
      // Send real-time notification
      const sender = await storage.getUser(senderId);
      await realTimeManager.notifyNewMessage(messageData.receiverId, {
        messageId: message.id,
        senderId,
        senderName: sender?.displayName || sender?.username,
        senderAvatar: sender?.profileImageUrl,
        preview: messageData.content.substring(0, 100),
        conversationId: `${senderId}-${messageData.receiverId}`,
        timestamp: new Date().toISOString()
      });
      
      // Send push notification (in production)
      try {
        if (receiver) {
          await smsService.sendSMS({
            to: '+1234567890', // Would get from receiver profile
            type: SMSMessageType.NEW_MESSAGE,
            variables: {
              senderName: sender?.displayName || sender?.firstName || 'Someone'
            }
          });
        }
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }

  // Get conversation
  async getConversation(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      
      const messages = await storage.getConversation(userId, otherUserId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(userId, otherUserId);
      
      res.json(messages);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  }

  // Get conversations list
  async getConversations(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      // In production, would implement proper conversation listing
      // For now, returning empty array
      res.json([]);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  }

  // Get unread count
  async getUnreadCount(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      const count = await storage.getUnreadMessageCount(userId);
      
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  }

  // Mark conversation as read
  async markAsRead(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      
      await storage.markMessagesAsRead(userId, otherUserId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ message: 'Failed to mark as read' });
    }
  }

  // Send mass message (creators only)
  async sendMassMessage(req: any, res: Response) {
    try {
      const senderId = req.user.claims.sub;
      const { content, mediaUrl, isPpv = false, ppvPrice } = req.body;
      
      const sender = await storage.getUser(senderId);
      if (sender?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can send mass messages' });
      }
      
      // Get all subscribers
      const subscriptions = await storage.getActiveSubscriptions(senderId);
      
      // Send message to each subscriber
      const promises = subscriptions.map(async (sub) => {
        return storage.sendMessage(senderId, {
          receiverId: sub.fanId,
          content,
          mediaUrl: mediaUrl || null,
          isPpv,
          ppvPrice: ppvPrice ? ppvPrice.toString() : null
        });
      });
      
      await Promise.all(promises);
      
      res.json({ 
        message: 'Mass message sent successfully',
        sentTo: subscriptions.length
      });
    } catch (error) {
      console.error('Send mass message error:', error);
      res.status(500).json({ message: 'Failed to send mass message' });
    }
  }
}

export const messagingController = new MessagingController();
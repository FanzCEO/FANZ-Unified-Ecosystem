import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "./storage";
import { createNotification } from "./notificationService";

export interface NotificationEvent {
  type: 'new_message' | 'new_like' | 'new_comment' | 'new_subscription' | 'new_tip' | 'live_stream_start' | 'ppv_unlock' | 'system_alert';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface ConnectedUser {
  userId: string;
  socket: WebSocket;
  lastSeen: Date;
  subscriptions: string[]; // Topics they're subscribed to
}

class RealTimeNotificationService {
  private wss: WebSocketServer | null = null;
  private connectedUsers = new Map<string, ConnectedUser>();
  private userSockets = new Map<string, Set<WebSocket>>(); // Multiple connections per user
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/notifications',
      verifyClient: (info: any) => {
        // Add authentication verification here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, request: any) => {
      this.handleConnection(ws, request);
    });

    // Start heartbeat to keep connections alive
    this.startHeartbeat();

    console.log('Real-time notification service initialized');
  }

  private handleConnection(ws: WebSocket, request: any) {
    let userId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            userId = message.userId;
            if (userId) {
              await this.authenticateUser(ws, userId);
            }
            break;
          case 'subscribe':
            if (userId) {
              this.subscribeToTopics(userId, message.topics);
            }
            break;
          case 'unsubscribe':
            if (userId) {
              this.unsubscribeFromTopics(userId, message.topics);
            }
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        this.removeUserConnection(userId, ws);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userId) {
        this.removeUserConnection(userId, ws);
      }
    });
  }

  private async authenticateUser(ws: WebSocket, userId: string) {
    try {
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid user' }));
        ws.close();
        return;
      }

      // Add user connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(ws);

      const connectedUser: ConnectedUser = {
        userId,
        socket: ws,
        lastSeen: new Date(),
        subscriptions: [`user:${userId}`, `role:${user.role}`] // Default subscriptions
      };

      this.connectedUsers.set(ws.toString(), connectedUser);

      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        message: 'Connected to real-time notifications',
        subscriptions: connectedUser.subscriptions
      }));

      // Send any pending notifications
      await this.sendPendingNotifications(userId);

    } catch (error) {
      console.error('Error authenticating user:', error);
      ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication failed' }));
      ws.close();
    }
  }

  private subscribeToTopics(userId: string, topics: string[]) {
    const userConnections = this.userSockets.get(userId);
    if (!userConnections) return;

    Array.from(userConnections).forEach(ws => {
      const connectedUser = this.connectedUsers.get(ws.toString());
      if (connectedUser) {
        connectedUser.subscriptions = Array.from(new Set([...connectedUser.subscriptions, ...topics]));
        ws.send(JSON.stringify({ 
          type: 'subscription_updated', 
          subscriptions: connectedUser.subscriptions 
        }));
      }
    });
  }

  private unsubscribeFromTopics(userId: string, topics: string[]) {
    const userConnections = this.userSockets.get(userId);
    if (!userConnections) return;

    Array.from(userConnections).forEach(ws => {
      const connectedUser = this.connectedUsers.get(ws.toString());
      if (connectedUser) {
        connectedUser.subscriptions = connectedUser.subscriptions.filter(
          sub => !topics.includes(sub)
        );
        ws.send(JSON.stringify({ 
          type: 'subscription_updated', 
          subscriptions: connectedUser.subscriptions 
        }));
      }
    });
  }

  private removeUserConnection(userId: string, ws: WebSocket) {
    const userConnections = this.userSockets.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.connectedUsers.delete(ws.toString());
  }

  private async sendPendingNotifications(userId: string) {
    try {
      // Get unread notifications from the last 24 hours
      const notifications = await storage.getUserNotifications(userId, 50, 0);
      const recentNotifications = notifications.filter(
        notif => !notif.read && new Date(notif.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      if (recentNotifications.length > 0) {
        this.sendToUser(userId, {
          type: 'pending_notifications',
          notifications: recentNotifications,
          count: recentNotifications.length
        });
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.connectedUsers.forEach((user, socketKey) => {
        if (user.socket.readyState === WebSocket.OPEN) {
          user.socket.send(JSON.stringify({ type: 'heartbeat' }));
          user.lastSeen = new Date();
        } else {
          this.connectedUsers.delete(socketKey);
        }
      });
    }, 30000); // Every 30 seconds
  }

  // Public methods for sending notifications
  async sendToUser(userId: string, data: any) {
    const userConnections = this.userSockets.get(userId);
    if (!userConnections) return;

    const message = JSON.stringify({
      ...data,
      timestamp: new Date(),
      userId
    });

    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  async sendToTopic(topic: string, data: any) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date(),
      topic
    });

    this.connectedUsers.forEach(user => {
      if (user.subscriptions.includes(topic) && user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    });
  }

  async broadcastToRole(role: string, data: any) {
    await this.sendToTopic(`role:${role}`, data);
  }

  async broadcastToAll(data: any) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date(),
      broadcast: true
    });

    this.connectedUsers.forEach(user => {
      if (user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(message);
      }
    });
  }

  // Event handlers for different types of notifications
  async handleNewMessage(senderId: string, recipientId: string, messageData: any) {
    // Send real-time notification
    await this.sendToUser(recipientId, {
      type: 'new_message',
      data: {
        senderId,
        senderName: messageData.senderName,
        preview: messageData.content?.substring(0, 100),
        conversationId: messageData.conversationId
      }
    });

    // Create persistent notification
    await createNotification(
      recipientId,
      'message',
      'New Message',
      `You have a new message from ${messageData.senderName}`
    );
  }

  async handleNewLike(postId: string, likerId: string, postOwnerId: string) {
    if (likerId === postOwnerId) return; // Don't notify self-likes

    const liker = await storage.getUser(likerId);
    
    await this.sendToUser(postOwnerId, {
      type: 'new_like',
      data: {
        postId,
        likerId,
        likerName: liker?.firstName || 'Someone'
      }
    });

    await createNotification(
      postOwnerId,
      'like',
      'New Like',
      `${liker?.firstName || 'Someone'} liked your post`
    );
  }

  async handleNewComment(postId: string, commenterId: string, postOwnerId: string, comment: string) {
    if (commenterId === postOwnerId) return; // Don't notify self-comments

    const commenter = await storage.getUser(commenterId);
    
    await this.sendToUser(postOwnerId, {
      type: 'new_comment',
      data: {
        postId,
        commenterId,
        commenterName: commenter?.firstName || 'Someone',
        commentPreview: comment.substring(0, 100)
      }
    });

    await createNotification(
      postOwnerId,
      'comment',
      'New Comment',
      `${commenter?.firstName || 'Someone'} commented on your post`
    );
  }

  async handleNewSubscription(fanId: string, creatorId: string, subscriptionData: any) {
    const fan = await storage.getUser(fanId);
    
    await this.sendToUser(creatorId, {
      type: 'new_subscription',
      data: {
        fanId,
        fanName: fan?.firstName || 'Someone',
        subscriptionType: subscriptionData.tier,
        amount: subscriptionData.amount
      }
    });

    await createNotification(
      creatorId,
      'subscription',
      'New Subscriber!',
      `${fan?.firstName || 'Someone'} subscribed to your content`
    );
  }

  async handleNewTip(senderId: string, recipientId: string, tipData: any) {
    const sender = await storage.getUser(senderId);
    
    await this.sendToUser(recipientId, {
      type: 'new_tip',
      data: {
        senderId,
        senderName: sender?.firstName || 'Someone',
        amount: tipData.amount,
        message: tipData.message
      }
    });

    await createNotification(
      recipientId,
      'tip',
      'New Tip Received!',
      `${sender?.firstName || 'Someone'} sent you a tip of $${tipData.amount}`
    );
  }

  async handleLiveStreamStart(creatorId: string, streamData: any) {
    // Notify all subscribers
    const creator = await storage.getUser(creatorId);
    
    await this.sendToTopic(`creator:${creatorId}`, {
      type: 'live_stream_start',
      data: {
        creatorId,
        creatorName: creator?.firstName || 'Creator',
        streamTitle: streamData.title,
        streamId: streamData.id
      }
    });

    // Create notifications for subscribers
    const subscribers = await storage.getCreatorSubscribers(creatorId);
    for (const subscriber of subscribers) {
      await createNotification(
        subscriber.fanId,
        'live_stream',
        'Live Stream Started!',
        `${creator?.firstName || 'Creator'} just went live: ${streamData.title}`
      );
    }
  }

  async handlePPVUnlock(buyerId: string, creatorId: string, contentData: any) {
    const buyer = await storage.getUser(buyerId);
    
    await this.sendToUser(creatorId, {
      type: 'ppv_unlock',
      data: {
        buyerId,
        buyerName: buyer?.firstName || 'Someone',
        contentTitle: contentData.title,
        amount: contentData.price
      }
    });

    await createNotification(
      creatorId,
      'ppv_purchase',
      'PPV Content Purchased!',
      `${buyer?.firstName || 'Someone'} purchased your PPV content for $${contentData.price}`
    );
  }

  async handleSystemAlert(userIds: string[], alertData: any) {
    const message = {
      type: 'system_alert',
      data: alertData
    };

    for (const userId of userIds) {
      await this.sendToUser(userId, message);
      await createNotification(
        userId,
        'system',
        alertData.title,
        alertData.message
      );
    }
  }

  // Analytics and monitoring
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  getConnectionStats() {
    const stats = {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSockets.size,
      connectionsByRole: {} as Record<string, number>
    };

    this.connectedUsers.forEach(user => {
      const roleSubscription = user.subscriptions.find(sub => sub.startsWith('role:'));
      if (roleSubscription) {
        const role = roleSubscription.split(':')[1];
        stats.connectionsByRole[role] = (stats.connectionsByRole[role] || 0) + 1;
      }
    });

    return stats;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    this.connectedUsers.clear();
    this.userSockets.clear();
  }
}

export const realTimeNotifications = new RealTimeNotificationService();
export default realTimeNotifications;
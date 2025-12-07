import { EventEmitter } from 'events';
import WebSocket, { WebSocketServer } from 'ws';
import { storage } from '../storage';
import { fanzDashService } from './fanzdash';

export interface NotificationChannel {
  id: string;
  type: 'websocket' | 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  configuration: Record<string, any>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel['type'];
  title: string;
  message: string;
  htmlContent?: string;
  variables: string[]; // Variables that can be substituted in the template
  priority: NotificationPriority;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel['type'][];
  readAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryResult {
  id: string;
  channel: NotificationChannel['type'];
  success: boolean;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'security_alert'
  | 'login_notification' 
  | 'payout_processed'
  | 'payout_failed'
  | 'conversion_approved'
  | 'conversion_rejected'
  | 'offer_approved'
  | 'offer_rejected'
  | 'kyc_status_update'
  | 'account_update'
  | 'system_maintenance'
  | 'promotional'
  | 'fraud_alert'
  | 'balance_update'
  | 'new_offer_available'
  | 'performance_milestone';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';

export interface WebSocketConnection {
  userId: string;
  socket: WebSocket;
  lastActivity: Date;
  subscriptions: Set<string>;
}

export interface EmailProvider {
  name: string;
  send(to: string, subject: string, html: string, text?: string): Promise<boolean>;
}

export interface SMSProvider {
  name: string;
  send(to: string, message: string): Promise<boolean>;
}

/**
 * Comprehensive Real-Time Notification System
 * Supports multiple delivery channels with fallback and retry mechanisms
 */
class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private wsServer?: WebSocketServer;
  private connections = new Map<string, WebSocketConnection>();
  private emailProviders = new Map<string, EmailProvider>();
  private smsProviders = new Map<string, SMSProvider>();
  private templates = new Map<string, NotificationTemplate>();
  private deliveryQueue: Notification[] = [];
  private processingQueue = false;
  
  // Configuration
  private readonly MAX_CONNECTIONS_PER_USER = 5;
  private readonly CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly DELIVERY_RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly NOTIFICATION_EXPIRY_HOURS = 24;

  private constructor() {
    super();
    this.initializeTemplates();
    this.startDeliveryProcessor();
    this.startConnectionCleanup();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize WebSocket server for real-time notifications
   */
  public initializeWebSocket(server: any): void {
    console.log('🔔 Initializing WebSocket notification server');
    
    this.wsServer = new WebSocketServer({ server });
    
    this.wsServer.on('connection', (socket: WebSocket, request) => {
      this.handleWebSocketConnection(socket, request);
    });

    console.log('✅ WebSocket notification server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleWebSocketConnection(socket: WebSocket, request: any): void {
    // Extract user ID from query parameters or JWT token
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');

    if (!userId || !token) {
      socket.close(1008, 'Authentication required');
      return;
    }

    // TODO: Validate JWT token here
    // For now, we'll trust the userId parameter

    const connectionId = `${userId}_${Date.now()}_${Math.random()}`;
    
    // Limit connections per user
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);
    
    if (userConnections.length >= this.MAX_CONNECTIONS_PER_USER) {
      // Close oldest connection
      const oldestConnection = userConnections
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())[0];
      oldestConnection.socket.close(1008, 'Connection limit exceeded');
      this.connections.delete(this.getConnectionId(oldestConnection));
    }

    const connection: WebSocketConnection = {
      userId,
      socket,
      lastActivity: new Date(),
      subscriptions: new Set(['general', `user_${userId}`]),
    };

    this.connections.set(connectionId, connection);

    socket.on('message', (data) => {
      this.handleWebSocketMessage(connectionId, data);
    });

    socket.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`WebSocket connection closed for user ${userId}`);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.connections.delete(connectionId);
    });

    // Send connection confirmation
    this.sendWebSocketMessage(connectionId, {
      type: 'connection_established',
      userId,
      connectionId,
      subscriptions: Array.from(connection.subscriptions),
      timestamp: new Date().toISOString(),
    });

    console.log(`WebSocket connection established for user ${userId}`);
  }

  /**
   * Handle WebSocket messages from clients
   */
  private handleWebSocketMessage(connectionId: string, data: WebSocket.Data): void {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      connection.lastActivity = new Date();
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          this.sendWebSocketMessage(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'subscribe':
          if (message.channel) {
            connection.subscriptions.add(message.channel);
            this.sendWebSocketMessage(connectionId, {
              type: 'subscribed',
              channel: message.channel,
              timestamp: new Date().toISOString(),
            });
          }
          break;
          
        case 'unsubscribe':
          if (message.channel) {
            connection.subscriptions.delete(message.channel);
            this.sendWebSocketMessage(connectionId, {
              type: 'unsubscribed',
              channel: message.channel,
              timestamp: new Date().toISOString(),
            });
          }
          break;

        case 'mark_read':
          if (message.notificationId) {
            this.markNotificationAsRead(message.notificationId, connection.userId);
          }
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Send message to specific WebSocket connection
   */
  private sendWebSocketMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Create and send notification
   */
  public async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'retryCount'>): Promise<Notification> {
    const newNotification: Notification = {
      id: `notification_${Date.now()}_${Math.random()}`,
      status: 'pending',
      retryCount: 0,
      expiresAt: new Date(Date.now() + this.NOTIFICATION_EXPIRY_HOURS * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...notification,
      maxRetries: notification.maxRetries || 3, // Put this after spread to override
    };

    // Store in database (mock for now)
    console.log('Creating notification:', {
      id: newNotification.id,
      userId: newNotification.userId,
      type: newNotification.type,
      priority: newNotification.priority,
    });

    // Add to delivery queue
    this.deliveryQueue.push(newNotification);

    // Emit event for real-time processing
    this.emit('notification_created', newNotification);

    return newNotification;
  }

  /**
   * Send notification immediately via WebSocket
   */
  public async sendRealTimeNotification(userId: string, notification: Partial<Notification>): Promise<void> {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);

    if (userConnections.length === 0) {
      console.log(`No WebSocket connections for user ${userId}`);
      return;
    }

    const message = {
      type: 'notification',
      id: notification.id,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      notificationType: notification.type,
      timestamp: new Date().toISOString(),
    };

    userConnections.forEach(connection => {
      const connectionId = this.getConnectionId(connection);
      this.sendWebSocketMessage(connectionId, message);
    });

    console.log(`Real-time notification sent to ${userConnections.length} connections for user ${userId}`);
  }

  /**
   * Send notification to all users in a channel
   */
  public async broadcastToChannel(channel: string, notification: Partial<Notification>): Promise<void> {
    const relevantConnections = Array.from(this.connections.values())
      .filter(conn => conn.subscriptions.has(channel));

    if (relevantConnections.length === 0) {
      console.log(`No connections subscribed to channel ${channel}`);
      return;
    }

    const message = {
      type: 'broadcast',
      channel,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      timestamp: new Date().toISOString(),
    };

    relevantConnections.forEach(connection => {
      const connectionId = this.getConnectionId(connection);
      this.sendWebSocketMessage(connectionId, message);
    });

    console.log(`Broadcast sent to ${relevantConnections.length} connections on channel ${channel}`);
  }

  /**
   * Get user's notification preferences
   */
  public async getUserNotificationChannels(userId: string): Promise<NotificationChannel[]> {
    // In production, this would query the database
    return [
      {
        id: `ws_${userId}`,
        type: 'websocket',
        enabled: true,
        configuration: {},
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `email_${userId}`,
        type: 'email',
        enabled: true,
        configuration: {
          address: 'user@example.com', // Would be fetched from user profile
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Update notification channel preferences
   */
  public async updateNotificationChannel(userId: string, channelType: NotificationChannel['type'], enabled: boolean, configuration?: Record<string, any>): Promise<void> {
    console.log(`Updating notification channel for user ${userId}:`, {
      channelType,
      enabled,
      configuration,
    });
    
    // In production, this would update the database
    this.emit('channel_updated', { userId, channelType, enabled, configuration });
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    // In production, this would update the database
    this.emit('notification_read', { notificationId, userId, readAt: new Date() });

    // Send real-time update to user's connections
    await this.sendRealTimeNotification(userId, {
      id: `read_confirmation_${Date.now()}`,
      type: 'system_maintenance',
      title: 'Notification Read',
      message: `Notification ${notificationId} marked as read`,
      priority: 'low',
      data: { action: 'mark_read', notificationId },
    });
  }

  /**
   * Get user's notifications with pagination
   */
  public async getUserNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    types?: NotificationType[];
    priority?: NotificationPriority;
  } = {}): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const { limit = 50, offset = 0, unreadOnly = false, types, priority } = options;

    // Mock data - in production this would query the database
    const mockNotifications: Notification[] = [
      {
        id: 'notification_1',
        userId,
        type: 'security_alert',
        title: 'New Device Login',
        message: 'A login was detected from a new device',
        priority: 'high',
        status: 'delivered',
        channels: ['websocket', 'email'],
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 'notification_2',
        userId,
        type: 'payout_processed',
        title: 'Payout Processed',
        message: 'Your payout of $150.00 has been processed',
        priority: 'normal',
        status: 'read',
        channels: ['websocket', 'email'],
        retryCount: 0,
        maxRetries: 3,
        readAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    let filteredNotifications = mockNotifications;

    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.readAt);
    }

    if (types && types.length > 0) {
      filteredNotifications = filteredNotifications.filter(n => types.includes(n.type));
    }

    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }

    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);
    const unreadCount = mockNotifications.filter(n => !n.readAt).length;

    return {
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount,
    };
  }

  /**
   * Register email provider
   */
  public registerEmailProvider(name: string, provider: EmailProvider): void {
    this.emailProviders.set(name, provider);
    console.log(`Email provider '${name}' registered`);
  }

  /**
   * Register SMS provider
   */
  public registerSMSProvider(name: string, provider: SMSProvider): void {
    this.smsProviders.set(name, provider);
    console.log(`SMS provider '${name}' registered`);
  }

  /**
   * Process delivery queue
   */
  private async startDeliveryProcessor(): Promise<void> {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    
    const processQueue = async () => {
      if (this.deliveryQueue.length === 0) {
        setTimeout(processQueue, 5000); // Check again in 5 seconds
        return;
      }

      const notification = this.deliveryQueue.shift()!;
      
      try {
        await this.processNotificationDelivery(notification);
      } catch (error) {
        console.error('Error processing notification delivery:', error);
        
        if (notification.retryCount < notification.maxRetries) {
          notification.retryCount++;
          notification.status = 'pending';
          
          // Add back to queue with delay
          setTimeout(() => {
            this.deliveryQueue.push(notification);
          }, this.DELIVERY_RETRY_DELAY_MS);
        } else {
          notification.status = 'failed';
          notification.failedAt = new Date();
        }
      }

      // Process next item
      setTimeout(processQueue, 100); // Small delay between items
    };

    processQueue();
  }

  /**
   * Process individual notification delivery
   */
  private async processNotificationDelivery(notification: Notification): Promise<void> {
    const userChannels = await this.getUserNotificationChannels(notification.userId);
    const deliveryResults: NotificationDeliveryResult[] = [];

    for (const channelType of notification.channels) {
      const channel = userChannels.find(c => c.type === channelType && c.enabled);
      
      if (!channel) {
        console.warn(`Channel ${channelType} not available for user ${notification.userId}`);
        continue;
      }

      let result: NotificationDeliveryResult;

      try {
        switch (channelType) {
          case 'websocket':
            await this.sendRealTimeNotification(notification.userId, notification);
            result = {
              id: `delivery_${Date.now()}`,
              channel: channelType,
              success: true,
              deliveredAt: new Date(),
            };
            break;

          case 'email':
            const emailSuccess = await this.sendEmailNotification(notification, channel);
            result = {
              id: `delivery_${Date.now()}`,
              channel: channelType,
              success: emailSuccess,
              deliveredAt: emailSuccess ? new Date() : undefined,
              error: emailSuccess ? undefined : 'Email delivery failed',
            };
            break;

          case 'sms':
            const smsSuccess = await this.sendSMSNotification(notification, channel);
            result = {
              id: `delivery_${Date.now()}`,
              channel: channelType,
              success: smsSuccess,
              deliveredAt: smsSuccess ? new Date() : undefined,
              error: smsSuccess ? undefined : 'SMS delivery failed',
            };
            break;

          default:
            result = {
              id: `delivery_${Date.now()}`,
              channel: channelType,
              success: false,
              error: `Unsupported channel type: ${channelType}`,
            };
        }
      } catch (error) {
        result = {
          id: `delivery_${Date.now()}`,
          channel: channelType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      deliveryResults.push(result);
    }

    // Update notification status
    const successfulDeliveries = deliveryResults.filter(r => r.success);
    if (successfulDeliveries.length > 0) {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
    } else if (notification.retryCount >= notification.maxRetries) {
      notification.status = 'failed';
      notification.failedAt = new Date();
    }

    notification.updatedAt = new Date();

    console.log(`Notification ${notification.id} delivery results:`, {
      successful: successfulDeliveries.length,
      total: deliveryResults.length,
      status: notification.status,
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification, channel: NotificationChannel): Promise<boolean> {
    if (this.emailProviders.size === 0) {
      console.warn('No email providers registered');
      return false;
    }

    const provider = this.emailProviders.values().next().value;
    const emailAddress = channel.configuration.address;

    if (!provider) {
      console.warn('No email provider available');
      return false;
    }

    if (!emailAddress) {
      console.warn('No email address configured for channel');
      return false;
    }

    try {
      return await provider.send(
        emailAddress,
        notification.title,
        this.generateEmailHTML(notification),
        notification.message
      );
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification, channel: NotificationChannel): Promise<boolean> {
    if (this.smsProviders.size === 0) {
      console.warn('No SMS providers registered');
      return false;
    }

    const provider = this.smsProviders.values().next().value;
    const phoneNumber = channel.configuration.phoneNumber;

    if (!provider) {
      console.warn('No SMS provider available');
      return false;
    }

    if (!phoneNumber) {
      console.warn('No phone number configured for channel');
      return false;
    }

    try {
      const message = `${notification.title}: ${notification.message}`;
      return await provider.send(phoneNumber, message);
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  /**
   * Generate HTML content for email notifications
   */
  private generateEmailHTML(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f8f9fa; padding: 30px; }
            .priority-high { border-left: 4px solid #ef4444; }
            .priority-critical { border-left: 4px solid #dc2626; background-color: #fef2f2; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FanzFiliate Notification</h1>
            </div>
            <div class="content priority-${notification.priority}">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ''}
              <p><small>Priority: ${notification.priority.toUpperCase()} | Type: ${notification.type}</small></p>
            </div>
            <div class="footer">
              <p>This is an automated message from FanzFiliate. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const templates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        type: 'security_alert',
        channel: 'email',
        title: 'Security Alert - {{action}}',
        message: 'A security event has been detected on your account: {{details}}',
        variables: ['action', 'details'],
        priority: 'high',
        retryPolicy: { maxRetries: 3, backoffMs: 300000 },
      },
      {
        type: 'payout_processed',
        channel: 'websocket',
        title: 'Payout Processed',
        message: 'Your payout of {{amount}} {{currency}} has been processed successfully',
        variables: ['amount', 'currency'],
        priority: 'normal',
        retryPolicy: { maxRetries: 2, backoffMs: 60000 },
      },
    ];

    templates.forEach(template => {
      const fullTemplate: NotificationTemplate = {
        id: `template_${template.type}_${template.channel}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...template,
      };
      
      this.templates.set(fullTemplate.id, fullTemplate);
    });

    console.log(`Initialized ${this.templates.size} notification templates`);
  }

  /**
   * Clean up inactive connections
   */
  private startConnectionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const connectionsToRemove: string[] = [];

      this.connections.forEach((connection, id) => {
        const inactiveMs = now - connection.lastActivity.getTime();
        if (inactiveMs > this.CONNECTION_TIMEOUT_MS) {
          connectionsToRemove.push(id);
          connection.socket.close(1000, 'Connection timeout');
        }
      });

      connectionsToRemove.forEach(id => {
        this.connections.delete(id);
      });

      if (connectionsToRemove.length > 0) {
        console.log(`Cleaned up ${connectionsToRemove.length} inactive WebSocket connections`);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Helper method to get connection ID from connection object
   */
  private getConnectionId(connection: WebSocketConnection): string {
    for (const [id, conn] of Array.from(this.connections.entries())) {
      if (conn === connection) {
        return id;
      }
    }
    return '';
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats(): {
    activeConnections: number;
    totalNotifications: number;
    pendingDeliveries: number;
    providers: {
      email: number;
      sms: number;
    };
  } {
    return {
      activeConnections: this.connections.size,
      totalNotifications: 0, // Would be fetched from database
      pendingDeliveries: this.deliveryQueue.length,
      providers: {
        email: this.emailProviders.size,
        sms: this.smsProviders.size,
      },
    };
  }
}

export const notificationService = NotificationService.getInstance();

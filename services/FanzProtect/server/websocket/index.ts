// Real-time WebSocket Notification System for FanzProtect
// Handles case updates, deadline alerts, and ecosystem integration

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { ecosystemServices } from '../services/ecosystem/index.js';

interface WebSocketClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  caseIds: Set<string>;
  lastPing: number;
}

interface NotificationEvent {
  type: 'case_created' | 'case_updated' | 'dmca_submitted' | 'platform_response' | 
        'deadline_approaching' | 'payment_required' | 'counsel_assigned' | 
        'evidence_uploaded' | 'document_generated' | 'case_resolved';
  caseId: string;
  userId?: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private caseSubscriptions: Map<string, Set<string>> = new Map(); // caseId -> clientIds
  private pingInterval: NodeJS.Timeout;

  constructor(private wss: WebSocketServer) {
    this.setupHeartbeat();
    this.setupConnection();
  }

  private setupConnection() {
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      
      logger.info('WebSocket client connected', { 
        clientId,
        origin: request.headers.origin,
        userAgent: request.headers['user-agent']
      });

      const client: WebSocketClient = {
        ws,
        caseIds: new Set(),
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        message: 'Connected to FanzProtect real-time notifications',
        clientId,
        timestamp: new Date().toISOString()
      });

      // Handle messages from client
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(clientId, message);
        } catch (error) {
          logger.error('Invalid WebSocket message', { clientId, error });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket client error', { clientId, error });
        this.handleDisconnect(clientId);
      });
    });
  }

  private async handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        await this.handleAuth(clientId, message.token);
        break;

      case 'subscribe':
        this.handleSubscribe(clientId, message.caseId);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.caseId);
        break;

      case 'ping':
        client.lastPing = Date.now();
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        logger.warn('Unknown WebSocket message type', { clientId, type: message.type });
    }
  }

  private async handleAuth(clientId: string, token: string) {
    const client = this.clients.get(clientId);
    if (!client || !token) return;

    try {
      // Validate token with FanzSSO
      const authResult = await ecosystemServices.sso.validateToken(token);
      
      if (authResult.valid && authResult.user) {
        client.userId = authResult.user.id;
        client.role = authResult.user.role;

        this.sendToClient(clientId, {
          type: 'auth_success',
          userId: authResult.user.id,
          role: authResult.user.role,
          scopes: authResult.scopes,
          timestamp: new Date().toISOString()
        });

        logger.info('WebSocket client authenticated', { 
          clientId, 
          userId: authResult.user.id,
          role: authResult.user.role
        });

        // Log authentication event for security
        await ecosystemServices.security.logAuditEvent({
          action: 'websocket_auth',
          resource: 'websocket_connection',
          resourceId: clientId,
          userId: authResult.user.id,
          metadata: { role: authResult.user.role }
        });

      } else {
        this.sendToClient(clientId, {
          type: 'auth_failed',
          error: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        });

        logger.warn('WebSocket authentication failed', { clientId });
      }

    } catch (error) {
      logger.error('WebSocket authentication error', { clientId, error });
      this.sendToClient(clientId, {
        type: 'auth_error',
        error: 'Authentication service unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleSubscribe(clientId: string, caseId: string) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId || !caseId) return;

    // Add case to client's subscriptions
    client.caseIds.add(caseId);

    // Add client to case subscriptions
    if (!this.caseSubscriptions.has(caseId)) {
      this.caseSubscriptions.set(caseId, new Set());
    }
    this.caseSubscriptions.get(caseId)!.add(clientId);

    this.sendToClient(clientId, {
      type: 'subscribed',
      caseId,
      timestamp: new Date().toISOString()
    });

    logger.debug('Client subscribed to case', { clientId, caseId, userId: client.userId });
  }

  private handleUnsubscribe(clientId: string, caseId: string) {
    const client = this.clients.get(clientId);
    if (!client || !caseId) return;

    // Remove case from client's subscriptions
    client.caseIds.delete(caseId);

    // Remove client from case subscriptions
    const caseClients = this.caseSubscriptions.get(caseId);
    if (caseClients) {
      caseClients.delete(clientId);
      if (caseClients.size === 0) {
        this.caseSubscriptions.delete(caseId);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      caseId,
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all case subscriptions
    client.caseIds.forEach(caseId => {
      const caseClients = this.caseSubscriptions.get(caseId);
      if (caseClients) {
        caseClients.delete(clientId);
        if (caseClients.size === 0) {
          this.caseSubscriptions.delete(caseId);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);

    logger.info('WebSocket client disconnected', { 
      clientId, 
      userId: client.userId,
      subscribedCases: client.caseIds.size
    });
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to send WebSocket message', { clientId, error });
      this.handleDisconnect(clientId);
    }
  }

  private setupHeartbeat() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 1 minute

      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > staleThreshold) {
          logger.debug('Removing stale WebSocket client', { clientId });
          this.handleDisconnect(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  // Public methods for sending notifications

  public broadcastCaseEvent(event: NotificationEvent) {
    const subscribedClients = this.caseSubscriptions.get(event.caseId) || new Set();
    
    subscribedClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (!client) return;

      // Check if user has permission to receive this event
      if (this.canReceiveEvent(client, event)) {
        this.sendToClient(clientId, {
          type: 'case_event',
          ...event,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Also send to FanzDash if high priority
    if (event.priority === 'high' || event.priority === 'urgent') {
      this.notifyFanzDash(event);
    }

    logger.info('Case event broadcasted', { 
      eventType: event.type,
      caseId: event.caseId,
      priority: event.priority,
      recipientCount: subscribedClients.size
    });
  }

  public notifyUser(userId: string, notification: any) {
    // Find all clients for this user
    const userClients = Array.from(this.clients.entries())
      .filter(([_, client]) => client.userId === userId)
      .map(([clientId]) => clientId);

    userClients.forEach(clientId => {
      this.sendToClient(clientId, {
        type: 'user_notification',
        ...notification,
        timestamp: new Date().toISOString()
      });
    });
  }

  public broadcastSystemAlert(alert: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    metadata?: any;
  }) {
    const systemMessage = {
      type: 'system_alert',
      ...alert,
      timestamp: new Date().toISOString()
    };

    // Send to all authenticated clients
    this.clients.forEach((client, clientId) => {
      if (client.userId) {
        this.sendToClient(clientId, systemMessage);
      }
    });

    // Send to FanzDash
    ecosystemServices.dashboard.sendAlert(alert);

    logger.warn('System alert broadcasted', alert);
  }

  private canReceiveEvent(client: WebSocketClient, event: NotificationEvent): boolean {
    // Basic permission check - can be expanded based on roles
    if (!client.userId) return false;

    // Creators can only see their own cases
    if (client.role === 'creator' && event.userId !== client.userId) {
      return false;
    }

    // Legal counsel and admins can see all cases
    if (client.role === 'legal_counsel' || client.role === 'admin' || client.role === 'support_agent') {
      return true;
    }

    return event.userId === client.userId;
  }

  private async notifyFanzDash(event: NotificationEvent) {
    try {
      await ecosystemServices.dashboard.sendAlert({
        level: event.priority === 'urgent' ? 'critical' : 'warning',
        title: `Legal Case Event: ${event.type}`,
        message: `Case ${event.caseId} - ${event.type}`,
        metadata: {
          caseId: event.caseId,
          eventType: event.type,
          platform: 'fanzprotect',
          ...event.data
        }
      });
    } catch (error) {
      logger.error('Failed to notify FanzDash', { error });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.clients.forEach((client, clientId) => {
      client.ws.close(1000, 'Server shutdown');
    });
    
    this.clients.clear();
    this.caseSubscriptions.clear();
  }

  // Statistics
  public getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.userId).length,
      totalCaseSubscriptions: this.caseSubscriptions.size,
      activeConnections: Array.from(this.clients.values()).filter(c => 
        c.ws.readyState === WebSocket.OPEN
      ).length
    };
  }
}

// Global WebSocket manager instance
let wsManager: WebSocketManager;

export function setupWebSocket(wss: WebSocketServer) {
  wsManager = new WebSocketManager(wss);
  
  logger.info('WebSocket notification system initialized', {
    path: '/ws',
    features: [
      'Real-time case updates',
      'FanzSSO authentication',
      'Case-specific subscriptions',
      'FanzDash integration',
      'Security audit logging'
    ]
  });
  
  return wsManager;
}

// Export notification functions
export const notifications = {
  broadcastCaseEvent: (event: NotificationEvent) => wsManager?.broadcastCaseEvent(event),
  notifyUser: (userId: string, notification: any) => wsManager?.notifyUser(userId, notification),
  broadcastSystemAlert: (alert: any) => wsManager?.broadcastSystemAlert(alert),
  getStats: () => wsManager?.getStats() || { totalClients: 0, authenticatedClients: 0, totalCaseSubscriptions: 0, activeConnections: 0 }
};

// Helper functions for common notification types
export const notificationHelpers = {
  // Case lifecycle notifications
  caseCreated: (caseId: string, userId: string, caseData: any) => {
    notifications.broadcastCaseEvent({
      type: 'case_created',
      caseId,
      userId,
      data: caseData,
      timestamp: new Date().toISOString(),
      priority: 'medium'
    });
  },

  caseUpdated: (caseId: string, userId: string, changes: any) => {
    notifications.broadcastCaseEvent({
      type: 'case_updated',
      caseId,
      userId,
      data: { changes },
      timestamp: new Date().toISOString(),
      priority: 'low'
    });
  },

  dmcaSubmitted: (caseId: string, userId: string, platform: string) => {
    notifications.broadcastCaseEvent({
      type: 'dmca_submitted',
      caseId,
      userId,
      data: { platform },
      timestamp: new Date().toISOString(),
      priority: 'high'
    });
  },

  platformResponse: (caseId: string, userId: string, responseType: string, platform: string) => {
    notifications.broadcastCaseEvent({
      type: 'platform_response',
      caseId,
      userId,
      data: { responseType, platform },
      timestamp: new Date().toISOString(),
      priority: 'high'
    });
  },

  deadlineApproaching: (caseId: string, userId: string, deadline: string, hoursRemaining: number) => {
    notifications.broadcastCaseEvent({
      type: 'deadline_approaching',
      caseId,
      userId,
      data: { deadline, hoursRemaining },
      timestamp: new Date().toISOString(),
      priority: hoursRemaining <= 24 ? 'urgent' : 'high'
    });
  },

  paymentRequired: (caseId: string, userId: string, amount: number, serviceType: string) => {
    notifications.broadcastCaseEvent({
      type: 'payment_required',
      caseId,
      userId,
      data: { amount, serviceType },
      timestamp: new Date().toISOString(),
      priority: 'medium'
    });
  },

  evidenceUploaded: (caseId: string, userId: string, evidenceType: string, fileName: string) => {
    notifications.broadcastCaseEvent({
      type: 'evidence_uploaded',
      caseId,
      userId,
      data: { evidenceType, fileName },
      timestamp: new Date().toISOString(),
      priority: 'low'
    });
  },

  documentGenerated: (caseId: string, userId: string, documentType: string, fileName: string) => {
    notifications.broadcastCaseEvent({
      type: 'document_generated',
      caseId,
      userId,
      data: { documentType, fileName },
      timestamp: new Date().toISOString(),
      priority: 'medium'
    });
  },

  caseResolved: (caseId: string, userId: string, resolution: string, successful: boolean) => {
    notifications.broadcastCaseEvent({
      type: 'case_resolved',
      caseId,
      userId,
      data: { resolution, successful },
      timestamp: new Date().toISOString(),
      priority: 'high'
    });
  }
};
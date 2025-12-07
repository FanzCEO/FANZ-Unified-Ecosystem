import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { monitoringService } from './monitoringService';
import { aiModerationService } from './aiModerationService';
import crypto from 'crypto';

// WebSocket message types
export enum WSMessageType {
  // Authentication
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILED = 'auth_failed',
  
  // Live streaming
  JOIN_STREAM = 'join_stream',
  LEAVE_STREAM = 'leave_stream',
  STREAM_MESSAGE = 'stream_message',
  STREAM_REACTION = 'stream_reaction',
  STREAM_TIP = 'stream_tip',
  STREAM_POLL = 'stream_poll',
  STREAM_POLL_VOTE = 'stream_poll_vote',
  
  // General chat
  CHAT_MESSAGE = 'chat_message',
  CHAT_TYPING = 'chat_typing',
  
  // Notifications
  NOTIFICATION = 'notification',
  SYSTEM_ALERT = 'system_alert',
  
  // Stream management
  STREAM_STATUS = 'stream_status',
  VIEWER_COUNT = 'viewer_count',
  STREAM_STATS = 'stream_stats'
}

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: Date;
  messageId?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  role?: string;
  streamId?: string;
  lastActivity?: Date;
}

export interface StreamRoom {
  streamId: string;
  creatorId: string;
  viewers: Set<AuthenticatedWebSocket>;
  moderators: Set<string>;
  blockedUsers: Set<string>;
  chatHistory: ChatMessage[];
  polls: StreamPoll[];
  settings: StreamRoomSettings;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerated?: boolean;
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds[]
}

export interface StreamPoll {
  id: string;
  question: string;
  options: string[];
  votes: { [option: string]: string[] }; // option -> userIds[]
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StreamRoomSettings {
  chatEnabled: boolean;
  moderationEnabled: boolean;
  subscribersOnly: boolean;
  minimumTipAmount?: number;
  pollsEnabled: boolean;
  reactionsEnabled: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private streamRooms: Map<string, StreamRoom> = new Map();
  private userConnections: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval!: NodeJS.Timeout;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: true
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('New WebSocket connection');
      
      ws.lastActivity = new Date();
      
      // Send welcome message
      this.sendMessage(ws, {
        type: WSMessageType.SYSTEM_ALERT,
        payload: { message: 'Connected to FanzLab real-time service' },
        timestamp: new Date()
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
          ws.lastActivity = new Date();
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        monitoringService.trackError(error, { type: 'websocket_error' });
      });
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WSMessage) {
    monitoringService.trackUserActivity(
      ws.userId || 'anonymous', 
      `ws_${message.type}`, 
      { messageType: message.type }
    );

    switch (message.type) {
      case WSMessageType.AUTH:
        await this.handleAuth(ws, message.payload);
        break;
        
      case WSMessageType.JOIN_STREAM:
        await this.handleJoinStream(ws, message.payload);
        break;
        
      case WSMessageType.LEAVE_STREAM:
        await this.handleLeaveStream(ws, message.payload);
        break;
        
      case WSMessageType.STREAM_MESSAGE:
        await this.handleStreamMessage(ws, message.payload);
        break;
        
      case WSMessageType.STREAM_REACTION:
        await this.handleStreamReaction(ws, message.payload);
        break;
        
      case WSMessageType.STREAM_TIP:
        await this.handleStreamTip(ws, message.payload);
        break;
        
      case WSMessageType.STREAM_POLL_VOTE:
        await this.handlePollVote(ws, message.payload);
        break;
        
      case WSMessageType.CHAT_MESSAGE:
        await this.handleChatMessage(ws, message.payload);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private async handleAuth(ws: AuthenticatedWebSocket, payload: any) {
    try {
      // In a real implementation, validate the auth token
      const { userId, username, role } = payload;
      
      ws.userId = userId;
      ws.username = username;
      ws.role = role;

      // Track user connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(ws);

      this.sendMessage(ws, {
        type: WSMessageType.AUTH_SUCCESS,
        payload: { userId, username, role },
        timestamp: new Date()
      });

      console.log(`User ${username} (${userId}) authenticated via WebSocket`);
      
    } catch (error) {
      this.sendMessage(ws, {
        type: WSMessageType.AUTH_FAILED,
        payload: { error: 'Authentication failed' },
        timestamp: new Date()
      });
    }
  }

  private async handleJoinStream(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { streamId } = payload;
    
    if (!this.streamRooms.has(streamId)) {
      this.createStreamRoom(streamId, payload.creatorId);
    }

    const room = this.streamRooms.get(streamId)!;
    
    // Check if user is blocked
    if (room.blockedUsers.has(ws.userId)) {
      this.sendError(ws, 'You are blocked from this stream');
      return;
    }

    // Add viewer to stream
    room.viewers.add(ws);
    ws.streamId = streamId;

    // Send stream info to new viewer
    this.sendMessage(ws, {
      type: WSMessageType.STREAM_STATUS,
      payload: {
        streamId,
        viewerCount: room.viewers.size,
        chatHistory: room.chatHistory.slice(-50), // Last 50 messages
        polls: room.polls.filter(p => !p.expiresAt || p.expiresAt > new Date()),
        settings: room.settings
      },
      timestamp: new Date()
    });

    // Broadcast updated viewer count
    this.broadcastToStream(streamId, {
      type: WSMessageType.VIEWER_COUNT,
      payload: { count: room.viewers.size },
      timestamp: new Date()
    });

    console.log(`User ${ws.username} joined stream ${streamId}`);
  }

  private async handleLeaveStream(ws: AuthenticatedWebSocket, payload: any) {
    if (ws.streamId) {
      const room = this.streamRooms.get(ws.streamId);
      if (room) {
        room.viewers.delete(ws);
        
        // Broadcast updated viewer count
        this.broadcastToStream(ws.streamId, {
          type: WSMessageType.VIEWER_COUNT,
          payload: { count: room.viewers.size },
          timestamp: new Date()
        });
      }
      
      ws.streamId = undefined;
    }
  }

  private async handleStreamMessage(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.streamId) {
      this.sendError(ws, 'Authentication and stream join required');
      return;
    }

    const room = this.streamRooms.get(ws.streamId);
    if (!room || !room.settings.chatEnabled) {
      this.sendError(ws, 'Chat is disabled for this stream');
      return;
    }

    const { message } = payload;

    // Moderate content
    const moderationResult = await aiModerationService.moderateContent(message);
    
    if (!moderationResult.isApproved) {
      this.sendError(ws, 'Message blocked by content moderation');
      return;
    }

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: ws.userId,
      username: ws.username!,
      message,
      timestamp: new Date(),
      isModerated: moderationResult.category === 'review',
      reactions: {}
    };

    // Add to chat history
    room.chatHistory.push(chatMessage);
    
    // Keep only last 200 messages
    if (room.chatHistory.length > 200) {
      room.chatHistory = room.chatHistory.slice(-200);
    }

    // Broadcast message to all viewers
    this.broadcastToStream(ws.streamId, {
      type: WSMessageType.STREAM_MESSAGE,
      payload: chatMessage,
      timestamp: new Date()
    });
  }

  private async handleStreamReaction(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.streamId) return;

    const { emoji, messageId } = payload;
    const room = this.streamRooms.get(ws.streamId);
    
    if (!room || !room.settings.reactionsEnabled) return;

    // Find message and add reaction
    const message = room.chatHistory.find(m => m.id === messageId);
    if (message) {
      if (!message.reactions![emoji]) {
        message.reactions![emoji] = [];
      }
      
      // Toggle reaction
      const userIndex = message.reactions![emoji].indexOf(ws.userId);
      if (userIndex > -1) {
        message.reactions![emoji].splice(userIndex, 1);
      } else {
        message.reactions![emoji].push(ws.userId);
      }

      // Broadcast reaction update
      this.broadcastToStream(ws.streamId, {
        type: WSMessageType.STREAM_REACTION,
        payload: { messageId, emoji, reactions: message.reactions },
        timestamp: new Date()
      });
    }
  }

  private async handleStreamTip(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.streamId) return;

    const { amount, message } = payload;
    const room = this.streamRooms.get(ws.streamId);
    
    if (!room) return;

    // Validate tip amount
    if (room.settings.minimumTipAmount && amount < room.settings.minimumTipAmount) {
      this.sendError(ws, `Minimum tip amount is $${room.settings.minimumTipAmount}`);
      return;
    }

    // Process tip (would integrate with payment system)
    console.log(`Tip received: $${amount} from ${ws.username} to stream ${ws.streamId}`);

    // Broadcast tip notification
    this.broadcastToStream(ws.streamId, {
      type: WSMessageType.STREAM_TIP,
      payload: {
        username: ws.username,
        amount,
        message,
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    // Track business metric
    monitoringService.trackBusinessMetric('stream_tip', amount, {
      streamId: ws.streamId,
      userId: ws.userId
    });
  }

  private async handlePollVote(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.streamId) return;

    const { pollId, option } = payload;
    const room = this.streamRooms.get(ws.streamId);
    
    if (!room || !room.settings.pollsEnabled) return;

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll || (poll.expiresAt && poll.expiresAt < new Date())) {
      return;
    }

    // Remove previous vote
    Object.values(poll.votes).forEach(voters => {
      const index = voters.indexOf(ws.userId!);
      if (index > -1) voters.splice(index, 1);
    });

    // Add new vote
    if (!poll.votes[option]) {
      poll.votes[option] = [];
    }
    poll.votes[option].push(ws.userId);

    // Broadcast poll update
    this.broadcastToStream(ws.streamId, {
      type: WSMessageType.STREAM_POLL,
      payload: poll,
      timestamp: new Date()
    });
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, payload: any) {
    // Handle direct messages between users
    if (!ws.userId) return;

    const { recipientId, message } = payload;

    // Moderate content
    const moderationResult = await aiModerationService.moderateContent(message);
    
    if (!moderationResult.isApproved) {
      this.sendError(ws, 'Message blocked by content moderation');
      return;
    }

    // Send to recipient if online
    const recipientConnections = this.userConnections.get(recipientId);
    if (recipientConnections) {
      const chatMessage = {
        id: crypto.randomUUID(),
        senderId: ws.userId,
        senderUsername: ws.username,
        message,
        timestamp: new Date()
      };

      recipientConnections.forEach(connection => {
        this.sendMessage(connection, {
          type: WSMessageType.CHAT_MESSAGE,
          payload: chatMessage,
          timestamp: new Date()
        });
      });
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    console.log('WebSocket disconnected');
    
    // Remove from stream room
    if (ws.streamId) {
      const room = this.streamRooms.get(ws.streamId);
      if (room) {
        room.viewers.delete(ws);
        
        // Broadcast updated viewer count
        this.broadcastToStream(ws.streamId, {
          type: WSMessageType.VIEWER_COUNT,
          payload: { count: room.viewers.size },
          timestamp: new Date()
        });
      }
    }

    // Remove from user connections
    if (ws.userId) {
      const connections = this.userConnections.get(ws.userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.userConnections.delete(ws.userId);
        }
      }
    }
  }

  private createStreamRoom(streamId: string, creatorId: string) {
    const room: StreamRoom = {
      streamId,
      creatorId,
      viewers: new Set(),
      moderators: new Set([creatorId]),
      blockedUsers: new Set(),
      chatHistory: [],
      polls: [],
      settings: {
        chatEnabled: true,
        moderationEnabled: true,
        subscribersOnly: false,
        pollsEnabled: true,
        reactionsEnabled: true
      }
    };

    this.streamRooms.set(streamId, room);
    console.log(`Created stream room: ${streamId}`);
  }

  public createPoll(streamId: string, creatorId: string, question: string, options: string[], expiresIn?: number) {
    const room = this.streamRooms.get(streamId);
    if (!room || !room.moderators.has(creatorId)) return;

    const poll: StreamPoll = {
      id: crypto.randomUUID(),
      question,
      options,
      votes: {},
      createdBy: creatorId,
      createdAt: new Date(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined
    };

    room.polls.push(poll);

    // Broadcast new poll
    this.broadcastToStream(streamId, {
      type: WSMessageType.STREAM_POLL,
      payload: poll,
      timestamp: new Date()
    });

    return poll;
  }

  public updateStreamSettings(streamId: string, creatorId: string, settings: Partial<StreamRoomSettings>) {
    const room = this.streamRooms.get(streamId);
    if (!room || room.creatorId !== creatorId) return;

    room.settings = { ...room.settings, ...settings };

    // Broadcast settings update
    this.broadcastToStream(streamId, {
      type: WSMessageType.STREAM_STATUS,
      payload: { settings: room.settings },
      timestamp: new Date()
    });
  }

  public blockUser(streamId: string, moderatorId: string, userId: string) {
    const room = this.streamRooms.get(streamId);
    if (!room || !room.moderators.has(moderatorId)) return;

    room.blockedUsers.add(userId);

    // Remove from viewers if currently connected
    room.viewers.forEach(viewer => {
      if (viewer.userId === userId) {
        viewer.close();
      }
    });
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: WSMessageType.SYSTEM_ALERT,
      payload: { error, level: 'error' },
      timestamp: new Date()
    });
  }

  private broadcastToStream(streamId: string, message: WSMessage) {
    const room = this.streamRooms.get(streamId);
    if (!room) return;

    room.viewers.forEach(viewer => {
      this.sendMessage(viewer, message);
    });
  }

  public sendNotification(userId: string, notification: any) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.forEach(connection => {
        this.sendMessage(connection, {
          type: WSMessageType.NOTIFICATION,
          payload: notification,
          timestamp: new Date()
        });
      });
    }
  }

  public getStreamStats(streamId: string) {
    const room = this.streamRooms.get(streamId);
    if (!room) return null;

    return {
      viewerCount: room.viewers.size,
      chatMessageCount: room.chatHistory.length,
      activePollsCount: room.polls.filter(p => !p.expiresAt || p.expiresAt > new Date()).length,
      settings: room.settings
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Check for inactive connections
          const now = new Date();
          if (ws.lastActivity && (now.getTime() - ws.lastActivity.getTime()) > 300000) { // 5 minutes
            ws.terminate();
          } else {
            ws.ping();
          }
        }
      });
    }, 30000); // Every 30 seconds
  }

  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}
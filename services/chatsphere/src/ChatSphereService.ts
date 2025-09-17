/**
 * 💬 ChatSphere - Real-Time Communication Service
 * 
 * Comprehensive real-time messaging system for the FANZ ecosystem.
 * Supports text messaging, video/audio calls, private rooms, group chats,
 * and adult content moderation across all platform clusters.
 * 
 * Features:
 * - WebSocket-based real-time messaging
 * - Video/audio calling with WebRTC
 * - Private and group chat rooms
 * - Adult content moderation and filtering
 * - Cross-platform messaging between clusters
 * - Message encryption and privacy controls
 * - Media sharing and file attachments
 * - Presence and activity indicators
 * - Custom reactions and emoji support
 * - Message translation and accessibility
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import { WebSocket, WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';

// ===== TYPES & INTERFACES =====

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  recipientId?: string;
  type: MessageType;
  content: MessageContent;
  metadata: MessageMetadata;
  reactions: MessageReaction[];
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  STICKER = 'sticker',
  GIFT = 'gift',
  TIP = 'tip',
  SYSTEM = 'system',
  CALL_INVITE = 'call_invite',
  CALL_ACCEPT = 'call_accept',
  CALL_REJECT = 'call_reject',
  CALL_END = 'call_end'
}

export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  thumbnailUrl?: string;
  fileName?: string;
  giftId?: string;
  tipAmount?: number;
  callData?: CallData;
  systemData?: SystemMessageData;
}

export interface MessageMetadata {
  clusterId: string;
  contentLevel: ContentLevel;
  encrypted: boolean;
  mentions: string[];
  hashtags: string[];
  location?: GeoLocation;
  replyToId?: string;
  forwardedFrom?: string;
  editedAt?: Date;
  readBy: ReadReceipt[];
}

export enum ContentLevel {
  GENERAL = 'general',
  MATURE = 'mature',
  ADULT = 'adult',
  EXTREME = 'extreme'
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
  MODERATED = 'moderated'
}

export interface ChatRoom {
  id: string;
  type: RoomType;
  name?: string;
  description?: string;
  clusterId: string;
  contentLevel: ContentLevel;
  participants: RoomParticipant[];
  settings: RoomSettings;
  metadata: RoomMetadata;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export enum RoomType {
  PRIVATE = 'private',           // 1-on-1 chat
  GROUP = 'group',              // Group chat
  BROADCAST = 'broadcast',      // Creator to fans
  LIVE_STREAM = 'live_stream',  // Live streaming chat
  SUPPORT = 'support',          // Customer support
  COMMUNITY = 'community'       // Community/forum style
}

export interface RoomParticipant {
  userId: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  joinedAt: Date;
  lastSeenAt: Date;
  mutedUntil?: Date;
  bannedUntil?: Date;
}

export enum ParticipantRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  CREATOR = 'creator',
  VIP = 'vip',
  SUBSCRIBER = 'subscriber'
}

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canReact: boolean;
  canInvite: boolean;
  canKick: boolean;
  canMute: boolean;
  canManageRoom: boolean;
  canStartCall: boolean;
  canScreenShare: boolean;
}

export interface RoomSettings {
  isPublic: boolean;
  allowInvites: boolean;
  requireApproval: boolean;
  maxParticipants: number;
  messageRetention: number; // days
  allowedContentLevels: ContentLevel[];
  moderationLevel: ModerationLevel;
  allowFileSharing: boolean;
  allowGifts: boolean;
  allowTips: boolean;
  allowCalls: boolean;
}

export enum ModerationLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  STRICT = 'strict'
}

export interface RoomMetadata {
  totalMessages: number;
  totalParticipants: number;
  activeParticipants: number;
  lastActivity: Date;
  tags: string[];
  category?: string;
  language?: string;
  timezone?: string;
}

export interface CallData {
  callId: string;
  type: CallType;
  participants: string[];
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  quality?: CallQuality;
  recordingUrl?: string;
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  GROUP_VOICE = 'group_voice',
  GROUP_VIDEO = 'group_video'
}

export interface CallQuality {
  audioQuality: number;
  videoQuality: number;
  connectionQuality: number;
  packetLoss: number;
  jitter: number;
  latency: number;
}

export interface SystemMessageData {
  action: SystemAction;
  actorId?: string;
  targetId?: string;
  data?: any;
}

export enum SystemAction {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_KICKED = 'user_kicked',
  USER_BANNED = 'user_banned',
  USER_PROMOTED = 'user_promoted',
  USER_DEMOTED = 'user_demoted',
  ROOM_CREATED = 'room_created',
  ROOM_UPDATED = 'room_updated',
  ROOM_ARCHIVED = 'room_archived',
  MESSAGE_DELETED = 'message_deleted',
  CALL_STARTED = 'call_started',
  CALL_ENDED = 'call_ended'
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  activity?: string;
  customStatus?: string;
  platform: string;
  clusterId: string;
  lastSeen: Date;
  isStreaming?: boolean;
  currentRoom?: string;
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  userId: string;
  clusterId: string;
  rooms: Set<string>;
  presence: UserPresence;
  permissions: UserPermissions;
  lastHeartbeat: Date;
  connectionInfo: ConnectionInfo;
}

export interface UserPermissions {
  canCreateRooms: boolean;
  canJoinRooms: boolean;
  canSendDMs: boolean;
  canSendMedia: boolean;
  canStartCalls: boolean;
  canBroadcast: boolean;
  maxRooms: number;
  maxFileSize: number;
  contentLevels: ContentLevel[];
}

export interface ConnectionInfo {
  ip: string;
  userAgent: string;
  platform: string;
  version: string;
  connectedAt: Date;
  country?: string;
  region?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  city: string;
}

export interface ModerationAction {
  id: string;
  roomId: string;
  messageId?: string;
  userId: string;
  moderatorId: string;
  action: ModerationType;
  reason: string;
  evidence?: ModerationEvidence;
  severity: ModerationSeverity;
  duration?: number; // minutes
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  status: ModerationStatus;
}

export enum ModerationType {
  WARN = 'warn',
  MUTE = 'mute',
  KICK = 'kick',
  BAN = 'ban',
  DELETE_MESSAGE = 'delete_message',
  RESTRICT_MEDIA = 'restrict_media',
  RESTRICT_CALLS = 'restrict_calls',
  SHADOW_BAN = 'shadow_ban'
}

export interface ModerationEvidence {
  screenshots?: string[];
  logs?: string[];
  reports?: UserReport[];
  aiAnalysis?: AIAnalysisResult;
}

export interface UserReport {
  reporterId: string;
  reason: ReportReason;
  description: string;
  evidence?: string[];
  createdAt: Date;
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  ADULT_CONTENT = 'adult_content',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  COPYRIGHT = 'copyright',
  IMPERSONATION = 'impersonation',
  SCAM = 'scam',
  OTHER = 'other'
}

export interface AIAnalysisResult {
  contentSafety: number;
  adultContent: number;
  toxicity: number;
  sentiment: string;
  language: string;
  topics: string[];
  confidence: number;
}

export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  APPEALED = 'appealed'
}

// ===== MAIN SERVICE CLASS =====

export class ChatSphereService extends EventEmitter {
  private wss: WebSocketServer;
  private redis: Redis;
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, ChatRoom> = new Map();
  private config: ChatSphereConfig;
  private moderationQueue: ModerationAction[] = [];

  constructor(server: HTTPServer, config: ChatSphereConfig) {
    super();
    this.config = config;

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ server, path: '/chatsphere' });
    
    // Initialize Redis for pub/sub and caching
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.database || 8
    });

    // Setup WebSocket handlers
    this.setupWebSocketHandlers();
    
    // Setup Redis pub/sub
    this.setupRedisPubSub();
    
    // Start background workers
    this.startHeartbeatMonitor();
    this.startModerationWorker();
    this.startPresenceUpdater();
    this.startMessageArchiver();
  }

  // ===== WEBSOCKET HANDLERS =====

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (socket: WebSocket, request) => {
      this.handleConnection(socket, request);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server Error:', error);
      this.emit('error', error);
    });
  }

  private handleConnection(socket: WebSocket, request: any): void {
    const clientId = uuidv4();
    
    // Extract user info from headers/auth
    const userId = this.extractUserId(request);
    const clusterId = this.extractClusterId(request);
    
    if (!userId || !clusterId) {
      socket.close(4001, 'Authentication required');
      return;
    }

    // Create client object
    const client: WebSocketClient = {
      id: clientId,
      socket,
      userId,
      clusterId,
      rooms: new Set(),
      presence: {
        userId,
        status: PresenceStatus.ONLINE,
        platform: this.extractPlatform(request),
        clusterId,
        lastSeen: new Date()
      },
      permissions: this.getUserPermissions(userId, clusterId),
      lastHeartbeat: new Date(),
      connectionInfo: {
        ip: this.extractIP(request),
        userAgent: request.headers['user-agent'] || '',
        platform: this.extractPlatform(request),
        version: request.headers['x-client-version'] || '1.0.0',
        connectedAt: new Date()
      }
    };

    this.clients.set(clientId, client);

    // Setup message handlers
    socket.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    socket.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    socket.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
      this.handleClientError(clientId, error);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection_established',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        capabilities: this.getServerCapabilities()
      }
    });

    // Update presence
    this.updateUserPresence(userId, PresenceStatus.ONLINE);
    
    this.emit('client_connected', client);
  }

  private handleMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());
      client.lastHeartbeat = new Date();

      switch (message.type) {
        case 'send_message':
          this.handleSendMessage(client, message.data);
          break;
        
        case 'join_room':
          this.handleJoinRoom(client, message.data);
          break;
        
        case 'leave_room':
          this.handleLeaveRoom(client, message.data);
          break;
        
        case 'create_room':
          this.handleCreateRoom(client, message.data);
          break;
        
        case 'update_presence':
          this.handleUpdatePresence(client, message.data);
          break;
        
        case 'start_call':
          this.handleStartCall(client, message.data);
          break;
        
        case 'end_call':
          this.handleEndCall(client, message.data);
          break;
        
        case 'react_message':
          this.handleReactMessage(client, message.data);
          break;
        
        case 'delete_message':
          this.handleDeleteMessage(client, message.data);
          break;
        
        case 'report_user':
          this.handleReportUser(client, message.data);
          break;
        
        case 'heartbeat':
          this.handleHeartbeat(client);
          break;
        
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }

    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  // ===== MESSAGE HANDLING =====

  private async handleSendMessage(client: WebSocketClient, data: any): Promise<void> {
    const { roomId, content, type = MessageType.TEXT, replyToId } = data;

    // Validate permissions
    if (!this.canUserSendMessage(client, roomId, type)) {
      this.sendError(client.id, 'Insufficient permissions');
      return;
    }

    // Get room
    const room = await this.getRoom(roomId);
    if (!room) {
      this.sendError(client.id, 'Room not found');
      return;
    }

    // Check if user is in room
    if (!this.isUserInRoom(client.userId, room)) {
      this.sendError(client.id, 'User not in room');
      return;
    }

    // Create message
    const message: ChatMessage = {
      id: uuidv4(),
      roomId,
      senderId: client.userId,
      type: type as MessageType,
      content: await this.processMessageContent(content, type),
      metadata: {
        clusterId: client.clusterId,
        contentLevel: room.contentLevel,
        encrypted: this.shouldEncryptMessage(room),
        mentions: this.extractMentions(content.text || ''),
        hashtags: this.extractHashtags(content.text || ''),
        replyToId,
        readBy: []
      },
      reactions: [],
      status: MessageStatus.SENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Apply content moderation
    const moderationResult = await this.moderateMessage(message);
    if (!moderationResult.approved) {
      this.sendError(client.id, moderationResult.reason || 'Message blocked by moderation');
      return;
    }

    // Save message
    await this.saveMessage(message);
    message.status = MessageStatus.SENT;

    // Broadcast to room participants
    await this.broadcastToRoom(roomId, {
      type: 'new_message',
      data: message
    }, client.userId);

    // Update room activity
    await this.updateRoomActivity(roomId);

    // Send confirmation to sender
    this.sendToClient(client.id, {
      type: 'message_sent',
      data: { messageId: message.id, tempId: data.tempId }
    });

    this.emit('message_sent', message);
  }

  private async handleJoinRoom(client: WebSocketClient, data: any): Promise<void> {
    const { roomId } = data;
    
    const room = await this.getRoom(roomId);
    if (!room) {
      this.sendError(client.id, 'Room not found');
      return;
    }

    // Check permissions
    if (!this.canUserJoinRoom(client, room)) {
      this.sendError(client.id, 'Cannot join room');
      return;
    }

    // Add user to room
    await this.addUserToRoom(client.userId, roomId);
    client.rooms.add(roomId);

    // Send room info
    const roomInfo = await this.getRoomInfo(roomId, client.userId);
    this.sendToClient(client.id, {
      type: 'room_joined',
      data: roomInfo
    });

    // Notify other participants
    await this.broadcastToRoom(roomId, {
      type: 'user_joined_room',
      data: {
        userId: client.userId,
        clusterId: client.clusterId,
        timestamp: new Date()
      }
    }, client.userId);

    this.emit('user_joined_room', { userId: client.userId, roomId });
  }

  private async handleLeaveRoom(client: WebSocketClient, data: any): Promise<void> {
    const { roomId } = data;

    if (!client.rooms.has(roomId)) {
      this.sendError(client.id, 'Not in room');
      return;
    }

    // Remove user from room
    await this.removeUserFromRoom(client.userId, roomId);
    client.rooms.delete(roomId);

    // Send confirmation
    this.sendToClient(client.id, {
      type: 'room_left',
      data: { roomId }
    });

    // Notify other participants
    await this.broadcastToRoom(roomId, {
      type: 'user_left_room',
      data: {
        userId: client.userId,
        timestamp: new Date()
      }
    });

    this.emit('user_left_room', { userId: client.userId, roomId });
  }

  private async handleCreateRoom(client: WebSocketClient, data: any): Promise<void> {
    const { type, name, description, settings = {}, participants = [] } = data;

    // Check permissions
    if (!client.permissions.canCreateRooms) {
      this.sendError(client.id, 'Cannot create rooms');
      return;
    }

    // Create room
    const room: ChatRoom = {
      id: uuidv4(),
      type: type as RoomType,
      name,
      description,
      clusterId: client.clusterId,
      contentLevel: settings.contentLevel || ContentLevel.GENERAL,
      participants: [
        {
          userId: client.userId,
          role: ParticipantRole.CREATOR,
          permissions: this.getCreatorPermissions(),
          joinedAt: new Date(),
          lastSeenAt: new Date()
        }
      ],
      settings: {
        isPublic: false,
        allowInvites: true,
        requireApproval: false,
        maxParticipants: 100,
        messageRetention: 30,
        allowedContentLevels: [ContentLevel.GENERAL, ContentLevel.MATURE],
        moderationLevel: ModerationLevel.MEDIUM,
        allowFileSharing: true,
        allowGifts: true,
        allowTips: true,
        allowCalls: true,
        ...settings
      },
      metadata: {
        totalMessages: 0,
        totalParticipants: 1,
        activeParticipants: 1,
        lastActivity: new Date(),
        tags: [],
        language: 'en'
      },
      createdBy: client.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save room
    await this.saveRoom(room);
    this.rooms.set(room.id, room);

    // Add creator to room
    client.rooms.add(room.id);

    // Invite participants if specified
    if (participants.length > 0) {
      await this.inviteUsersToRoom(room.id, participants, client.userId);
    }

    // Send confirmation
    this.sendToClient(client.id, {
      type: 'room_created',
      data: await this.getRoomInfo(room.id, client.userId)
    });

    this.emit('room_created', room);
  }

  // ===== CALL HANDLING =====

  private async handleStartCall(client: WebSocketClient, data: any): Promise<void> {
    const { roomId, type = CallType.VIDEO, participants = [] } = data;

    // Check permissions
    if (!client.permissions.canStartCalls) {
      this.sendError(client.id, 'Cannot start calls');
      return;
    }

    const room = await this.getRoom(roomId);
    if (!room || !room.settings.allowCalls) {
      this.sendError(client.id, 'Calls not allowed in this room');
      return;
    }

    // Create call
    const callData: CallData = {
      callId: uuidv4(),
      type: type as CallType,
      participants: [client.userId, ...participants],
      startedAt: new Date(),
      quality: {
        audioQuality: 0,
        videoQuality: 0,
        connectionQuality: 0,
        packetLoss: 0,
        jitter: 0,
        latency: 0
      }
    };

    // Save call info
    await this.saveCallData(callData);

    // Send call invites
    const callInviteMessage: ChatMessage = {
      id: uuidv4(),
      roomId,
      senderId: client.userId,
      type: MessageType.CALL_INVITE,
      content: { callData },
      metadata: {
        clusterId: client.clusterId,
        contentLevel: room.contentLevel,
        encrypted: false,
        mentions: participants,
        hashtags: [],
        readBy: []
      },
      reactions: [],
      status: MessageStatus.SENT,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.broadcastToRoom(roomId, {
      type: 'call_invite',
      data: callInviteMessage
    });

    this.emit('call_started', callData);
  }

  private async handleEndCall(client: WebSocketClient, data: any): Promise<void> {
    const { callId } = data;

    // Get call data
    const callData = await this.getCallData(callId);
    if (!callData) {
      this.sendError(client.id, 'Call not found');
      return;
    }

    // Check if user can end call
    if (!callData.participants.includes(client.userId)) {
      this.sendError(client.id, 'Not in call');
      return;
    }

    // End call
    callData.endedAt = new Date();
    callData.duration = callData.endedAt.getTime() - callData.startedAt.getTime();

    await this.saveCallData(callData);

    // Notify participants
    for (const participantId of callData.participants) {
      const participantClient = this.findClientByUserId(participantId);
      if (participantClient) {
        this.sendToClient(participantClient.id, {
          type: 'call_ended',
          data: { callId, endedBy: client.userId }
        });
      }
    }

    this.emit('call_ended', callData);
  }

  // ===== MODERATION =====

  private async moderateMessage(message: ChatMessage): Promise<{ approved: boolean; reason?: string }> {
    // Skip moderation for system messages
    if (message.type === MessageType.SYSTEM) {
      return { approved: true };
    }

    // Get room settings
    const room = await this.getRoom(message.roomId);
    if (!room) {
      return { approved: false, reason: 'Room not found' };
    }

    // Check content level restrictions
    if (!room.settings.allowedContentLevels.includes(message.metadata.contentLevel)) {
      return { approved: false, reason: 'Content level not allowed' };
    }

    // Apply moderation based on level
    switch (room.settings.moderationLevel) {
      case ModerationLevel.NONE:
        return { approved: true };

      case ModerationLevel.LOW:
        return await this.basicContentFilter(message);

      case ModerationLevel.MEDIUM:
        return await this.advancedContentFilter(message);

      case ModerationLevel.HIGH:
        return await this.strictContentFilter(message);

      case ModerationLevel.STRICT:
        return await this.aiContentModeration(message);

      default:
        return await this.basicContentFilter(message);
    }
  }

  private async basicContentFilter(message: ChatMessage): Promise<{ approved: boolean; reason?: string }> {
    const content = message.content.text || '';
    
    // Basic spam detection
    if (content.length > 5000) {
      return { approved: false, reason: 'Message too long' };
    }

    // Basic profanity filter (simplified)
    const profanityWords = ['spam', 'scam', 'fake'];
    const hasProfanity = profanityWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (hasProfanity) {
      return { approved: false, reason: 'Content filtered' };
    }

    return { approved: true };
  }

  private async advancedContentFilter(message: ChatMessage): Promise<{ approved: boolean; reason?: string }> {
    // Include basic filtering
    const basicResult = await this.basicContentFilter(message);
    if (!basicResult.approved) {
      return basicResult;
    }

    // Add advanced patterns
    const content = message.content.text || '';
    
    // URL spam detection
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches && urlMatches.length > 3) {
      return { approved: false, reason: 'Too many links' };
    }

    // Repeated character detection
    if (/(.)\1{10,}/.test(content)) {
      return { approved: false, reason: 'Spam pattern detected' };
    }

    return { approved: true };
  }

  private async strictContentFilter(message: ChatMessage): Promise<{ approved: boolean; reason?: string }> {
    // Include advanced filtering
    const advancedResult = await this.advancedContentFilter(message);
    if (!advancedResult.approved) {
      return advancedResult;
    }

    // Add strict patterns
    const content = message.content.text || '';
    
    // All caps detection
    if (content.length > 20 && content === content.toUpperCase()) {
      return { approved: false, reason: 'Excessive caps' };
    }

    return { approved: true };
  }

  private async aiContentModeration(message: ChatMessage): Promise<{ approved: boolean; reason?: string }> {
    // Include strict filtering
    const strictResult = await this.strictContentFilter(message);
    if (!strictResult.approved) {
      return strictResult;
    }

    // Add AI analysis (mock implementation)
    const aiAnalysis: AIAnalysisResult = {
      contentSafety: 0.9,
      adultContent: 0.1,
      toxicity: 0.1,
      sentiment: 'positive',
      language: 'en',
      topics: ['general'],
      confidence: 0.8
    };

    // Check safety thresholds
    if (aiAnalysis.toxicity > 0.7) {
      return { approved: false, reason: 'High toxicity detected' };
    }

    if (message.metadata.contentLevel === ContentLevel.GENERAL && aiAnalysis.adultContent > 0.5) {
      return { approved: false, reason: 'Adult content in general room' };
    }

    return { approved: true };
  }

  // ===== UTILITY METHODS =====

  private async processMessageContent(content: any, type: MessageType): Promise<MessageContent> {
    const processed: MessageContent = { ...content };

    switch (type) {
      case MessageType.IMAGE:
      case MessageType.VIDEO:
      case MessageType.AUDIO:
        // Generate thumbnails, compress media, etc.
        if (content.mediaUrl) {
          processed.thumbnailUrl = await this.generateThumbnail(content.mediaUrl, type);
        }
        break;

      case MessageType.FILE:
        // Virus scan, size validation, etc.
        if (content.mediaUrl) {
          const isClean = await this.scanFile(content.mediaUrl);
          if (!isClean) {
            throw new Error('File failed security scan');
          }
        }
        break;

      case MessageType.TIP:
        // Validate tip amount and process payment
        if (content.tipAmount) {
          processed.tipAmount = Math.max(0, Math.floor(content.tipAmount * 100) / 100);
        }
        break;
    }

    return processed;
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }

    return hashtags;
  }

  private shouldEncryptMessage(room: ChatRoom): boolean {
    return room.type === RoomType.PRIVATE && 
           room.settings.moderationLevel === ModerationLevel.STRICT;
  }

  private canUserSendMessage(client: WebSocketClient, roomId: string, type: MessageType): boolean {
    // Check basic permissions
    if (!client.permissions.canSendDMs && type !== MessageType.SYSTEM) {
      return false;
    }

    // Check media permissions
    if ([MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.FILE].includes(type)) {
      return client.permissions.canSendMedia;
    }

    // Check room-specific permissions
    const room = this.rooms.get(roomId);
    if (room) {
      const participant = room.participants.find(p => p.userId === client.userId);
      if (participant && participant.mutedUntil && participant.mutedUntil > new Date()) {
        return false;
      }
    }

    return true;
  }

  private canUserJoinRoom(client: WebSocketClient, room: ChatRoom): boolean {
    // Check if room allows the user's content level
    if (!room.settings.allowedContentLevels.includes(client.presence.clusterId as any)) {
      return false;
    }

    // Check if room is full
    if (room.participants.length >= room.settings.maxParticipants) {
      return false;
    }

    // Check if user is banned
    const participant = room.participants.find(p => p.userId === client.userId);
    if (participant && participant.bannedUntil && participant.bannedUntil > new Date()) {
      return false;
    }

    return true;
  }

  private isUserInRoom(userId: string, room: ChatRoom): boolean {
    return room.participants.some(p => p.userId === userId);
  }

  private getUserPermissions(userId: string, clusterId: string): UserPermissions {
    // This would normally fetch from database
    return {
      canCreateRooms: true,
      canJoinRooms: true,
      canSendDMs: true,
      canSendMedia: true,
      canStartCalls: true,
      canBroadcast: clusterId === 'fanzlab', // Only universal portal can broadcast
      maxRooms: 50,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      contentLevels: [ContentLevel.GENERAL, ContentLevel.MATURE, ContentLevel.ADULT]
    };
  }

  private getCreatorPermissions(): ParticipantPermissions {
    return {
      canSendMessages: true,
      canSendMedia: true,
      canReact: true,
      canInvite: true,
      canKick: true,
      canMute: true,
      canManageRoom: true,
      canStartCall: true,
      canScreenShare: true
    };
  }

  // ===== DATABASE OPERATIONS =====

  private async saveMessage(message: ChatMessage): Promise<void> {
    const messageData = JSON.stringify(message);
    await this.redis.setex(`message:${message.id}`, 86400 * 30, messageData); // 30 days
    await this.redis.lpush(`room:${message.roomId}:messages`, message.id);
  }

  private async saveRoom(room: ChatRoom): Promise<void> {
    const roomData = JSON.stringify(room);
    await this.redis.setex(`room:${room.id}`, 86400 * 365, roomData); // 1 year
  }

  private async getRoom(roomId: string): Promise<ChatRoom | null> {
    const cached = this.rooms.get(roomId);
    if (cached) return cached;

    const roomData = await this.redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      this.rooms.set(roomId, room);
      return room;
    }

    return null;
  }

  private async saveCallData(callData: CallData): Promise<void> {
    const data = JSON.stringify(callData);
    await this.redis.setex(`call:${callData.callId}`, 86400 * 7, data); // 7 days
  }

  private async getCallData(callId: string): Promise<CallData | null> {
    const data = await this.redis.get(`call:${callId}`);
    return data ? JSON.parse(data) : null;
  }

  // ===== BROADCASTING & MESSAGING =====

  private async broadcastToRoom(roomId: string, message: any, excludeUserId?: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;

    for (const participant of room.participants) {
      if (excludeUserId && participant.userId === excludeUserId) continue;

      const client = this.findClientByUserId(participant.userId);
      if (client) {
        this.sendToClient(client.id, message);
      }
    }

    // Also broadcast via Redis pub/sub for horizontal scaling
    await this.redis.publish(`room:${roomId}`, JSON.stringify(message));
  }

  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendToClient(clientId, {
      type: 'error',
      data: { message: error, timestamp: new Date().toISOString() }
    });
  }

  private findClientByUserId(userId: string): WebSocketClient | undefined {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        return client;
      }
    }
    return undefined;
  }

  // ===== BACKGROUND WORKERS =====

  private startHeartbeatMonitor(): void {
    setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients) {
        const timeSinceHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > timeout) {
          console.log(`Client ${clientId} timed out`);
          client.socket.terminate();
          this.clients.delete(clientId);
          this.updateUserPresence(client.userId, PresenceStatus.OFFLINE);
        }
      }
    }, 15000); // Check every 15 seconds
  }

  private startModerationWorker(): void {
    setInterval(async () => {
      // Process moderation queue
      while (this.moderationQueue.length > 0) {
        const action = this.moderationQueue.shift();
        if (action) {
          await this.processModerationAction(action);
        }
      }
    }, 5000); // Process every 5 seconds
  }

  private startPresenceUpdater(): void {
    setInterval(async () => {
      // Update presence for all connected clients
      for (const client of this.clients.values()) {
        await this.updateUserPresence(client.userId, client.presence.status);
      }
    }, 60000); // Update every minute
  }

  private startMessageArchiver(): void {
    setInterval(async () => {
      // Archive old messages based on retention policies
      // This would implement the actual archiving logic
      console.log('Message archiving job running...');
    }, 24 * 60 * 60 * 1000); // Daily
  }

  // ===== HELPER METHODS =====

  private extractUserId(request: any): string | null {
    // Extract from JWT token, session, or headers
    return request.headers['x-user-id'] || null;
  }

  private extractClusterId(request: any): string | null {
    return request.headers['x-cluster-id'] || 'fanzlab';
  }

  private extractPlatform(request: any): string {
    const userAgent = request.headers['user-agent'] || '';
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Desktop')) return 'desktop';
    return 'web';
  }

  private extractIP(request: any): string {
    return request.headers['x-forwarded-for'] || 
           request.headers['x-real-ip'] || 
           request.connection.remoteAddress || 
           '127.0.0.1';
  }

  private getServerCapabilities(): any {
    return {
      maxMessageSize: 10000,
      maxFileSize: 100 * 1024 * 1024,
      supportedMessageTypes: Object.values(MessageType),
      supportedCallTypes: Object.values(CallType),
      features: [
        'encryption',
        'moderation',
        'reactions',
        'mentions',
        'file_sharing',
        'voice_calls',
        'video_calls',
        'screen_sharing',
        'presence'
      ]
    };
  }

  private async updateUserPresence(userId: string, status: PresenceStatus): Promise<void> {
    const presence = {
      userId,
      status,
      lastSeen: new Date(),
      timestamp: Date.now()
    };

    await this.redis.setex(`presence:${userId}`, 300, JSON.stringify(presence)); // 5 minutes
    await this.redis.publish('presence_update', JSON.stringify(presence));
  }

  // ===== PLACEHOLDER METHODS =====

  private async generateThumbnail(mediaUrl: string, type: MessageType): Promise<string> {
    // Would integrate with media processing service
    return `${mediaUrl}_thumb.jpg`;
  }

  private async scanFile(mediaUrl: string): Promise<boolean> {
    // Would integrate with virus scanning service
    return true;
  }

  private async getRoomInfo(roomId: string, userId: string): Promise<any> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    // Get recent messages
    const messageIds = await this.redis.lrange(`room:${roomId}:messages`, -50, -1);
    const messages = [];
    
    for (const messageId of messageIds) {
      const messageData = await this.redis.get(`message:${messageId}`);
      if (messageData) {
        messages.push(JSON.parse(messageData));
      }
    }

    return {
      ...room,
      recentMessages: messages,
      onlineParticipants: await this.getOnlineParticipants(roomId)
    };
  }

  private async getOnlineParticipants(roomId: string): Promise<string[]> {
    const room = await this.getRoom(roomId);
    if (!room) return [];

    const online = [];
    for (const participant of room.participants) {
      const presence = await this.redis.get(`presence:${participant.userId}`);
      if (presence) {
        const data = JSON.parse(presence);
        if (data.status === PresenceStatus.ONLINE) {
          online.push(participant.userId);
        }
      }
    }

    return online;
  }

  private async addUserToRoom(userId: string, roomId: string): Promise<void> {
    // Implementation would add user to room participants
  }

  private async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    // Implementation would remove user from room participants
  }

  private async updateRoomActivity(roomId: string): Promise<void> {
    // Implementation would update room's last activity timestamp
  }

  private async inviteUsersToRoom(roomId: string, userIds: string[], invitedBy: string): Promise<void> {
    // Implementation would send room invitations
  }

  private async processModerationAction(action: ModerationAction): Promise<void> {
    // Implementation would process moderation actions
  }

  private setupRedisPubSub(): void {
    // Setup Redis pub/sub for cross-instance communication
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe('presence_update', 'room_broadcast', 'moderation_action');
    
    subscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'presence_update':
            this.handlePresenceUpdate(data);
            break;
          case 'room_broadcast':
            this.handleRoomBroadcast(data);
            break;
          case 'moderation_action':
            this.handleModerationAction(data);
            break;
        }
      } catch (error) {
        console.error(`Error processing ${channel} message:`, error);
      }
    });
  }

  private handlePresenceUpdate(data: any): void {
    // Handle presence updates from other instances
    this.emit('presence_updated', data);
  }

  private handleRoomBroadcast(data: any): void {
    // Handle room broadcasts from other instances
    this.emit('room_broadcast', data);
  }

  private handleModerationAction(data: any): void {
    // Handle moderation actions from other instances
    this.moderationQueue.push(data);
  }

  private handleDisconnection(clientId: string, code: number, reason: any): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Update presence to offline
      this.updateUserPresence(client.userId, PresenceStatus.OFFLINE);
      
      // Remove from rooms
      for (const roomId of client.rooms) {
        this.removeUserFromRoom(client.userId, roomId);
      }
      
      // Clean up client
      this.clients.delete(clientId);
      
      this.emit('client_disconnected', client, code, reason);
    }
  }

  private handleClientError(clientId: string, error: Error): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.emit('client_error', client, error);
    }
  }

  private handleHeartbeat(client: WebSocketClient): void {
    client.lastHeartbeat = new Date();
    this.sendToClient(client.id, { type: 'heartbeat_ack', data: { timestamp: Date.now() } });
  }

  private handleUpdatePresence(client: WebSocketClient, data: any): void {
    const { status, activity, customStatus } = data;
    
    client.presence.status = status || client.presence.status;
    client.presence.activity = activity;
    client.presence.customStatus = customStatus;
    client.presence.lastSeen = new Date();

    this.updateUserPresence(client.userId, client.presence.status);
  }

  private handleReactMessage(client: WebSocketClient, data: any): void {
    // Implementation for message reactions
  }

  private handleDeleteMessage(client: WebSocketClient, data: any): void {
    // Implementation for message deletion
  }

  private handleReportUser(client: WebSocketClient, data: any): void {
    // Implementation for user reporting
  }
}

// ===== CONFIGURATION INTERFACE =====

export interface ChatSphereConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  security: {
    enableEncryption: boolean;
    enableModeration: boolean;
    maxMessageLength: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  features: {
    enableVoiceCalls: boolean;
    enableVideoCalls: boolean;
    enableScreenShare: boolean;
    enableFileSharing: boolean;
    enableGifts: boolean;
    enableTips: boolean;
  };
  moderation: {
    enableAIModeration: boolean;
    defaultModerationLevel: ModerationLevel;
    maxReportsPerUser: number;
    autoModerationThreshold: number;
  };
  performance: {
    maxClientsPerInstance: number;
    heartbeatInterval: number;
    presenceUpdateInterval: number;
    messageArchiveInterval: number;
  };
}

export default ChatSphereService;
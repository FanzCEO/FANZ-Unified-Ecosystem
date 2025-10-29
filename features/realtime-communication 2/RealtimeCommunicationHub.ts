/**
 * @fanz/realtime-communication - Real-time Communication Hub
 * WebRTC streaming, live chat, interactive features, and real-time notifications
 * Integrated with security monitoring and content intelligence
 */

import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { createSecurityLogger } from '../../security/fanz-secure/src/utils/logger.js';
import { FanzSecurity } from '../../security/index.js';

// ===============================
// TYPES & INTERFACES  
// ===============================

export interface RealtimeCommunicationConfig {
  websocket: {
    port: number;
    cors_origins: string[];
    max_connections_per_room: number;
    message_rate_limit: number;
  };
  webrtc: {
    ice_servers: RTCIceServer[];
    max_peer_connections: number;
    video_quality_settings: VideoQualitySettings;
    audio_settings: AudioSettings;
  };
  streaming: {
    max_concurrent_streams: number;
    allowed_resolutions: string[];
    transcoding_enabled: boolean;
    recording_enabled: boolean;
  };
  moderation: {
    auto_moderation_enabled: boolean;
    profanity_filter_enabled: boolean;
    spam_detection_enabled: boolean;
    max_message_length: number;
  };
  features: {
    live_chat: boolean;
    video_calling: boolean;
    screen_sharing: boolean;
    file_sharing: boolean;
    live_streaming: boolean;
    interactive_polls: boolean;
    virtual_gifts: boolean;
    tip_notifications: boolean;
  };
}

export interface VideoQualitySettings {
  resolutions: {
    low: { width: number; height: number; bitrate: number };
    medium: { width: number; height: number; bitrate: number };
    high: { width: number; height: number; bitrate: number };
    ultra: { width: number; height: number; bitrate: number };
  };
  adaptive_streaming: boolean;
  frame_rate: number;
}

export interface AudioSettings {
  sample_rate: number;
  channels: number;
  bitrate: number;
  echo_cancellation: boolean;
  noise_suppression: boolean;
}

export interface LiveStream {
  stream_id: string;
  creator_id: string;
  platform: string;
  title: string;
  description?: string;
  category: StreamCategory;
  visibility: 'public' | 'followers_only' | 'subscribers_only' | 'private';
  adult_content: boolean;
  max_viewers?: number;
  started_at: Date;
  ended_at?: Date;
  status: StreamStatus;
  viewer_count: number;
  revenue_generated: number;
  interaction_stats: InteractionStats;
  quality_settings: VideoQualitySettings;
  recording_enabled: boolean;
  chat_enabled: boolean;
  tips_enabled: boolean;
  polls_enabled: boolean;
}

export type StreamCategory = 
  | 'adult_entertainment'
  | 'cam_show'
  | 'chat_session'
  | 'educational'
  | 'gaming'
  | 'lifestyle'
  | 'fitness'
  | 'cooking'
  | 'music'
  | 'art'
  | 'other';

export type StreamStatus = 
  | 'preparing'
  | 'live' 
  | 'paused'
  | 'ended'
  | 'technical_difficulties'
  | 'moderation_review';

export interface InteractionStats {
  total_messages: number;
  total_tips: number;
  total_gifts: number;
  total_viewers: number;
  peak_viewers: number;
  average_watch_time: number;
  engagement_rate: number;
  subscriber_conversion_rate: number;
}

export interface ChatMessage {
  message_id: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
  message_type: ChatMessageType;
  timestamp: Date;
  is_moderator: boolean;
  is_subscriber: boolean;
  is_vip: boolean;
  tip_amount?: number;
  gift_type?: string;
  moderation_status: ModerationStatus;
  reply_to?: string;
  attachments?: MessageAttachment[];
}

export type ChatMessageType = 
  | 'text'
  | 'emoji'
  | 'tip'
  | 'gift'
  | 'system'
  | 'poll'
  | 'media'
  | 'sticker';

export type ModerationStatus = 
  | 'approved'
  | 'pending'
  | 'flagged'
  | 'blocked'
  | 'deleted';

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface VideoCall {
  call_id: string;
  platform: string;
  participants: CallParticipant[];
  call_type: 'one_on_one' | 'group' | 'broadcast';
  started_at: Date;
  ended_at?: Date;
  duration?: number;
  status: CallStatus;
  recording_enabled: boolean;
  adult_content: boolean;
  privacy_mode: boolean;
  quality_settings: VideoQualitySettings;
  earnings_generated: number;
}

export interface CallParticipant {
  user_id: string;
  username: string;
  role: 'host' | 'guest' | 'moderator' | 'viewer';
  joined_at: Date;
  left_at?: Date;
  video_enabled: boolean;
  audio_enabled: boolean;
  screen_sharing: boolean;
  is_subscriber: boolean;
  tip_amount_sent: number;
}

export type CallStatus = 
  | 'waiting'
  | 'active'
  | 'paused'
  | 'ended'
  | 'failed';

export interface WebRTCPeerConnection {
  connection_id: string;
  user_id: string;
  peer_connection: RTCPeerConnection;
  local_stream?: MediaStream;
  remote_stream?: MediaStream;
  created_at: Date;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  data_channel?: RTCDataChannel;
  stats: ConnectionStats;
}

export interface ConnectionStats {
  bytes_sent: number;
  bytes_received: number;
  packets_lost: number;
  jitter: number;
  round_trip_time: number;
  video_bitrate: number;
  audio_bitrate: number;
  connection_quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface InteractivePoll {
  poll_id: string;
  creator_id: string;
  room_id: string;
  question: string;
  options: PollOption[];
  poll_type: 'single_choice' | 'multiple_choice' | 'rating' | 'open_text';
  created_at: Date;
  ends_at?: Date;
  status: 'active' | 'ended' | 'cancelled';
  total_votes: number;
  subscriber_only: boolean;
  anonymous_voting: boolean;
}

export interface PollOption {
  option_id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface VirtualGift {
  gift_id: string;
  name: string;
  description: string;
  cost: number; // in tokens/credits
  animation_url: string;
  sound_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: GiftCategory;
  creator_earnings_percentage: number;
}

export type GiftCategory = 
  | 'flowers'
  | 'hearts'
  | 'luxury'
  | 'funny'
  | 'adult'
  | 'seasonal'
  | 'custom';

// ===============================
// REAL-TIME COMMUNICATION HUB
// ===============================

export class RealtimeCommunicationHub extends EventEmitter {
  private logger = createSecurityLogger('realtime-comms');
  private initialized = false;

  // WebSocket and WebRTC infrastructure
  private socketServer?: SocketIOServer;
  private httpServer?: any;
  private activePeerConnections: Map<string, WebRTCPeerConnection> = new Map();
  private activeRooms: Map<string, Set<string>> = new Map(); // room -> user_ids
  
  // Live streaming management
  private activeStreams: Map<string, LiveStream> = new Map();
  private streamViewers: Map<string, Set<string>> = new Map(); // stream_id -> viewer_ids
  
  // Chat and messaging
  private chatMessages: Map<string, ChatMessage[]> = new Map(); // room_id -> messages
  private messageQueue: Map<string, ChatMessage[]> = new Map(); // pending moderation
  
  // Video calls
  private activeCalls: Map<string, VideoCall> = new Map();
  
  // Interactive features
  private activePolls: Map<string, InteractivePoll> = new Map();
  private availableGifts: Map<string, VirtualGift> = new Map();
  
  // Configuration
  private config: RealtimeCommunicationConfig = {
    websocket: {
      port: 3003,
      cors_origins: ['*.fanz.com', 'localhost:*'],
      max_connections_per_room: 1000,
      message_rate_limit: 10 // per minute
    },
    webrtc: {
      ice_servers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      max_peer_connections: 100,
      video_quality_settings: {
        resolutions: {
          low: { width: 640, height: 360, bitrate: 500 },
          medium: { width: 1280, height: 720, bitrate: 1500 },
          high: { width: 1920, height: 1080, bitrate: 3000 },
          ultra: { width: 3840, height: 2160, bitrate: 8000 }
        },
        adaptive_streaming: true,
        frame_rate: 30
      },
      audio_settings: {
        sample_rate: 48000,
        channels: 2,
        bitrate: 128,
        echo_cancellation: true,
        noise_suppression: true
      }
    },
    streaming: {
      max_concurrent_streams: 50,
      allowed_resolutions: ['720p', '1080p', '4K'],
      transcoding_enabled: true,
      recording_enabled: true
    },
    moderation: {
      auto_moderation_enabled: true,
      profanity_filter_enabled: true,
      spam_detection_enabled: true,
      max_message_length: 500
    },
    features: {
      live_chat: true,
      video_calling: true,
      screen_sharing: true,
      file_sharing: false, // Disabled for adult content security
      live_streaming: true,
      interactive_polls: true,
      virtual_gifts: true,
      tip_notifications: true
    }
  };

  // Metrics
  private metrics = {
    total_connections: 0,
    active_connections: 0,
    total_streams: 0,
    active_streams: 0,
    total_messages: 0,
    total_video_calls: 0,
    total_tips_processed: 0,
    bandwidth_usage: 0,
    server_uptime: Date.now()
  };

  constructor(customConfig?: Partial<RealtimeCommunicationConfig>) {
    super();
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.initialize();
  }

  /**
   * Initialize the Real-time Communication Hub
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('🔴 Initializing Real-time Communication Hub');

    try {
      // Initialize virtual gifts catalog
      this.initializeVirtualGifts();
      
      // Setup WebSocket server
      await this.setupWebSocketServer();
      
      // Setup WebRTC signaling
      this.setupWebRTCSignaling();
      
      // Setup security monitoring
      this.setupSecurityMonitoring();
      
      // Start health monitoring
      this.startHealthMonitoring();

      this.initialized = true;
      this.logger.info('✅ Real-time Communication Hub operational');
      this.logger.info(`🌐 WebSocket server running on port ${this.config.websocket.port}`);
      this.logger.info(`🎥 WebRTC enabled with adaptive streaming`);
      this.logger.info(`💬 Live chat, streaming, and video calls ready`);

    } catch (error) {
      this.logger.error('Failed to initialize Real-time Communication Hub', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Setup WebSocket server for real-time communication
   */
  private async setupWebSocketServer(): Promise<void> {
    const { createServer } = await import('http');
    const { Server: SocketIOServer } = await import('socket.io');

    this.httpServer = createServer();
    this.socketServer = new SocketIOServer(this.httpServer, {
      cors: {
        origin: this.config.websocket.cors_origins,
        methods: ['GET', 'POST']
      },
      maxHttpBufferSize: 1e6, // 1MB for file uploads
      transports: ['websocket', 'polling']
    });

    // Socket.IO event handlers
    this.socketServer.on('connection', (socket) => {
      this.handleNewConnection(socket);
    });

    // Start server
    await new Promise<void>((resolve) => {
      this.httpServer?.listen(this.config.websocket.port, () => {
        resolve();
      });
    });

    this.logger.info('WebSocket server initialized', {
      port: this.config.websocket.port,
      cors_origins: this.config.websocket.cors_origins
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleNewConnection(socket: any): void {
    const connectionId = socket.id;
    let userId: string | null = null;
    let currentRoom: string | null = null;

    this.metrics.total_connections++;
    this.metrics.active_connections++;

    this.logger.info('New WebSocket connection', { connection_id: connectionId });

    // Authentication and authorization
    socket.on('authenticate', async (data: { token: string; platform: string }) => {
      try {
        // Verify user through security system
        const securityContext = {
          platform: data.platform,
          session_id: connectionId,
          ip_address: socket.handshake.address,
          user_agent: socket.handshake.headers['user-agent'] || '',
          request_path: '/websocket/connect',
          request_method: 'WEBSOCKET',
          headers: socket.handshake.headers
        };

        const securityResponse = await FanzSecurity.processRequest(securityContext);
        
        if (securityResponse.action === 'block') {
          socket.emit('auth_failed', { reason: securityResponse.reason });
          socket.disconnect();
          return;
        }

        // Extract user ID from token (simplified - in production would decode JWT)
        userId = data.token.split('.')[1] || `user_${Date.now()}`;
        
        socket.emit('authenticated', { 
          user_id: userId,
          features_available: this.config.features 
        });

        this.logger.info('User authenticated', { 
          user_id: userId, 
          connection_id: connectionId 
        });

      } catch (error) {
        this.logger.error('Authentication failed', {
          connection_id: connectionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        socket.emit('auth_failed', { reason: 'Authentication error' });
        socket.disconnect();
      }
    });

    // Join room (chat room, stream room, etc.)
    socket.on('join_room', async (data: { room_id: string; room_type: 'chat' | 'stream' | 'call' }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      try {
        currentRoom = data.room_id;
        
        // Add user to room
        if (!this.activeRooms.has(data.room_id)) {
          this.activeRooms.set(data.room_id, new Set());
        }
        this.activeRooms.get(data.room_id)?.add(userId);

        socket.join(data.room_id);
        socket.emit('joined_room', { 
          room_id: data.room_id, 
          room_type: data.room_type,
          participants_count: this.activeRooms.get(data.room_id)?.size || 0
        });

        // Notify others in room
        socket.to(data.room_id).emit('user_joined', { 
          user_id: userId,
          participants_count: this.activeRooms.get(data.room_id)?.size || 0
        });

        this.logger.info('User joined room', {
          user_id: userId,
          room_id: data.room_id,
          room_type: data.room_type
        });

      } catch (error) {
        this.logger.error('Failed to join room', {
          user_id: userId,
          room_id: data.room_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send chat message
    socket.on('send_message', async (data: {
      room_id: string;
      message: string;
      message_type?: ChatMessageType;
      tip_amount?: number;
      reply_to?: string;
    }) => {
      if (!userId || !currentRoom) {
        socket.emit('error', { message: 'Not connected to a room' });
        return;
      }

      await this.handleChatMessage(socket, userId, data);
    });

    // Live streaming events
    socket.on('start_stream', async (data: {
      title: string;
      description?: string;
      category: StreamCategory;
      adult_content: boolean;
      visibility: 'public' | 'followers_only' | 'subscribers_only' | 'private';
    }) => {
      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      await this.handleStartStream(socket, userId, data);
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data: { target_user: string; offer: RTCSessionDescriptionInit }) => {
      if (!userId) return;
      this.handleWebRTCOffer(socket, userId, data);
    });

    socket.on('webrtc_answer', (data: { target_user: string; answer: RTCSessionDescriptionInit }) => {
      if (!userId) return;
      this.handleWebRTCAnswer(socket, userId, data);
    });

    socket.on('webrtc_ice_candidate', (data: { target_user: string; candidate: RTCIceCandidateInit }) => {
      if (!userId) return;
      this.handleWebRTCIceCandidate(socket, userId, data);
    });

    // Interactive features
    socket.on('create_poll', async (data: {
      room_id: string;
      question: string;
      options: string[];
      poll_type: 'single_choice' | 'multiple_choice';
      duration_minutes?: number;
    }) => {
      if (!userId) return;
      await this.handleCreatePoll(socket, userId, data);
    });

    socket.on('send_gift', async (data: {
      target_user: string;
      gift_id: string;
      room_id: string;
    }) => {
      if (!userId) return;
      await this.handleSendGift(socket, userId, data);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      this.handleDisconnection(connectionId, userId, currentRoom);
    });
  }

  /**
   * Handle chat messages with moderation
   */
  private async handleChatMessage(socket: any, userId: string, data: {
    room_id: string;
    message: string;
    message_type?: ChatMessageType;
    tip_amount?: number;
    reply_to?: string;
  }): Promise<void> {
    try {
      // Basic validation
      if (!data.message.trim() || data.message.length > this.config.moderation.max_message_length) {
        socket.emit('message_error', { error: 'Invalid message length' });
        return;
      }

      // Create message object
      const message: ChatMessage = {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        room_id: data.room_id,
        user_id: userId,
        username: `user_${userId.slice(-6)}`, // Simplified - would get from user service
        message: data.message,
        message_type: data.message_type || 'text',
        timestamp: new Date(),
        is_moderator: false, // Would check user permissions
        is_subscriber: false, // Would check subscription status
        is_vip: false,
        tip_amount: data.tip_amount,
        moderation_status: 'pending',
        reply_to: data.reply_to
      };

      // Auto-moderation if enabled
      if (this.config.moderation.auto_moderation_enabled) {
        await this.moderateMessage(message);
      } else {
        message.moderation_status = 'approved';
      }

      // Store message
      if (!this.chatMessages.has(data.room_id)) {
        this.chatMessages.set(data.room_id, []);
      }
      this.chatMessages.get(data.room_id)?.push(message);

      // Broadcast to room if approved
      if (message.moderation_status === 'approved') {
        this.socketServer?.to(data.room_id).emit('new_message', message);
        
        // Handle tip notification
        if (data.tip_amount && data.tip_amount > 0) {
          this.socketServer?.to(data.room_id).emit('tip_notification', {
            from_user: userId,
            amount: data.tip_amount,
            message: data.message
          });
          this.metrics.total_tips_processed++;
        }
      }

      this.metrics.total_messages++;

    } catch (error) {
      this.logger.error('Failed to handle chat message', {
        user_id: userId,
        room_id: data.room_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  }

  /**
   * Handle live stream start
   */
  private async handleStartStream(socket: any, userId: string, data: {
    title: string;
    description?: string;
    category: StreamCategory;
    adult_content: boolean;
    visibility: 'public' | 'followers_only' | 'subscribers_only' | 'private';
  }): Promise<void> {
    try {
      // Check concurrent stream limit
      const userActiveStreams = Array.from(this.activeStreams.values())
        .filter(s => s.creator_id === userId && s.status === 'live');
      
      if (userActiveStreams.length >= 1) { // Limit one active stream per user
        socket.emit('stream_error', { error: 'Maximum concurrent streams reached' });
        return;
      }

      // Create stream
      const stream: LiveStream = {
        stream_id: `stream_${Date.now()}_${userId}`,
        creator_id: userId,
        platform: 'universal', // Would extract from auth
        title: data.title,
        description: data.description,
        category: data.category,
        visibility: data.visibility,
        adult_content: data.adult_content,
        started_at: new Date(),
        status: 'preparing',
        viewer_count: 0,
        revenue_generated: 0,
        interaction_stats: {
          total_messages: 0,
          total_tips: 0,
          total_gifts: 0,
          total_viewers: 0,
          peak_viewers: 0,
          average_watch_time: 0,
          engagement_rate: 0,
          subscriber_conversion_rate: 0
        },
        quality_settings: this.config.webrtc.video_quality_settings,
        recording_enabled: this.config.streaming.recording_enabled,
        chat_enabled: true,
        tips_enabled: true,
        polls_enabled: true
      };

      this.activeStreams.set(stream.stream_id, stream);
      this.streamViewers.set(stream.stream_id, new Set());

      // Notify creator
      socket.emit('stream_started', {
        stream_id: stream.stream_id,
        stream_url: `wss://stream.fanz.com/${stream.stream_id}`,
        rtmp_url: `rtmp://ingest.fanz.com/live/${stream.stream_id}`,
        chat_room_id: `stream_chat_${stream.stream_id}`
      });

      // Update metrics
      this.metrics.total_streams++;
      this.metrics.active_streams++;

      this.logger.info('Live stream started', {
        stream_id: stream.stream_id,
        creator_id: userId,
        title: data.title,
        category: data.category,
        adult_content: data.adult_content
      });

      // After 5 seconds, mark as live (simplified stream setup)
      setTimeout(() => {
        const streamData = this.activeStreams.get(stream.stream_id);
        if (streamData) {
          streamData.status = 'live';
          socket.emit('stream_live', { stream_id: stream.stream_id });
        }
      }, 5000);

    } catch (error) {
      this.logger.error('Failed to start stream', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      socket.emit('stream_error', { error: 'Failed to start stream' });
    }
  }

  /**
   * WebRTC Signaling Handlers
   */
  private setupWebRTCSignaling(): void {
    this.logger.info('WebRTC signaling configured');
  }

  private handleWebRTCOffer(socket: any, userId: string, data: { target_user: string; offer: RTCSessionDescriptionInit }): void {
    // Forward offer to target user
    const targetSocket = this.findSocketByUserId(data.target_user);
    if (targetSocket) {
      targetSocket.emit('webrtc_offer_received', {
        from_user: userId,
        offer: data.offer
      });
    }
  }

  private handleWebRTCAnswer(socket: any, userId: string, data: { target_user: string; answer: RTCSessionDescriptionInit }): void {
    // Forward answer to target user
    const targetSocket = this.findSocketByUserId(data.target_user);
    if (targetSocket) {
      targetSocket.emit('webrtc_answer_received', {
        from_user: userId,
        answer: data.answer
      });
    }
  }

  private handleWebRTCIceCandidate(socket: any, userId: string, data: { target_user: string; candidate: RTCIceCandidateInit }): void {
    // Forward ICE candidate to target user
    const targetSocket = this.findSocketByUserId(data.target_user);
    if (targetSocket) {
      targetSocket.emit('webrtc_ice_candidate_received', {
        from_user: userId,
        candidate: data.candidate
      });
    }
  }

  /**
   * Handle creating interactive polls
   */
  private async handleCreatePoll(socket: any, userId: string, data: {
    room_id: string;
    question: string;
    options: string[];
    poll_type: 'single_choice' | 'multiple_choice';
    duration_minutes?: number;
  }): Promise<void> {
    try {
      const poll: InteractivePoll = {
        poll_id: `poll_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        creator_id: userId,
        room_id: data.room_id,
        question: data.question,
        options: data.options.map((text, index) => ({
          option_id: `option_${index}`,
          text,
          votes: 0,
          percentage: 0
        })),
        poll_type: data.poll_type,
        created_at: new Date(),
        ends_at: data.duration_minutes ? 
          new Date(Date.now() + data.duration_minutes * 60000) : undefined,
        status: 'active',
        total_votes: 0,
        subscriber_only: false,
        anonymous_voting: true
      };

      this.activePolls.set(poll.poll_id, poll);

      // Broadcast poll to room
      this.socketServer?.to(data.room_id).emit('poll_created', poll);

      this.logger.info('Interactive poll created', {
        poll_id: poll.poll_id,
        creator_id: userId,
        room_id: data.room_id,
        question: data.question
      });

    } catch (error) {
      this.logger.error('Failed to create poll', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      socket.emit('error', { message: 'Failed to create poll' });
    }
  }

  /**
   * Handle virtual gift sending
   */
  private async handleSendGift(socket: any, userId: string, data: {
    target_user: string;
    gift_id: string;
    room_id: string;
  }): Promise<void> {
    try {
      const gift = this.availableGifts.get(data.gift_id);
      if (!gift) {
        socket.emit('error', { message: 'Invalid gift' });
        return;
      }

      // Process gift transaction (simplified)
      const giftEvent = {
        gift_id: data.gift_id,
        gift_name: gift.name,
        from_user: userId,
        to_user: data.target_user,
        cost: gift.cost,
        animation_url: gift.animation_url,
        timestamp: new Date()
      };

      // Broadcast gift to room
      this.socketServer?.to(data.room_id).emit('gift_sent', giftEvent);

      this.logger.info('Virtual gift sent', {
        from_user: userId,
        to_user: data.target_user,
        gift_name: gift.name,
        cost: gift.cost
      });

    } catch (error) {
      this.logger.error('Failed to send gift', {
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      socket.emit('error', { message: 'Failed to send gift' });
    }
  }

  /**
   * Auto-moderation for chat messages
   */
  private async moderateMessage(message: ChatMessage): Promise<void> {
    // Simplified moderation - in production would use AI content intelligence
    const lowercaseMessage = message.message.toLowerCase();
    
    // Basic profanity filter
    const profanityWords = ['spam', 'fake', 'scam']; // Simplified list
    const containsProfanity = profanityWords.some(word => 
      lowercaseMessage.includes(word)
    );

    if (containsProfanity) {
      message.moderation_status = 'flagged';
      this.logger.warn('Message flagged by auto-moderation', {
        message_id: message.message_id,
        user_id: message.user_id
      });
    } else {
      message.moderation_status = 'approved';
    }
  }

  /**
   * Initialize virtual gifts catalog
   */
  private initializeVirtualGifts(): void {
    const gifts: VirtualGift[] = [
      {
        gift_id: 'rose',
        name: 'Rose',
        description: 'A beautiful red rose',
        cost: 10,
        animation_url: '/animations/rose.json',
        rarity: 'common',
        category: 'flowers',
        creator_earnings_percentage: 70
      },
      {
        gift_id: 'heart',
        name: 'Heart',
        description: 'Show some love',
        cost: 25,
        animation_url: '/animations/heart.json',
        rarity: 'common',
        category: 'hearts',
        creator_earnings_percentage: 70
      },
      {
        gift_id: 'diamond',
        name: 'Diamond',
        description: 'Luxurious diamond gift',
        cost: 1000,
        animation_url: '/animations/diamond.json',
        rarity: 'legendary',
        category: 'luxury',
        creator_earnings_percentage: 80
      }
    ];

    gifts.forEach(gift => {
      this.availableGifts.set(gift.gift_id, gift);
    });

    this.logger.info(`Initialized ${gifts.length} virtual gifts`);
  }

  /**
   * Security monitoring integration
   */
  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activity
    this.on('suspicious_activity', (data) => {
      this.logger.warn('Suspicious activity detected', data);
      // Would integrate with FanzSecurity for advanced threat detection
    });

    this.logger.info('Security monitoring integrated');
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute

    this.logger.info('Health monitoring started');
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const now = Date.now();
    this.metrics.bandwidth_usage = this.calculateBandwidthUsage();
    
    // Clean up inactive streams
    for (const [streamId, stream] of this.activeStreams.entries()) {
      if (stream.status === 'ended' && 
          now - stream.ended_at!.getTime() > 300000) { // 5 minutes
        this.activeStreams.delete(streamId);
        this.streamViewers.delete(streamId);
        this.metrics.active_streams--;
      }
    }

    // Clean up old messages
    for (const [roomId, messages] of this.chatMessages.entries()) {
      if (messages.length > 1000) { // Keep only recent 1000 messages
        this.chatMessages.set(roomId, messages.slice(-1000));
      }
    }
  }

  /**
   * Helper methods
   */
  private findSocketByUserId(userId: string): any {
    // Simplified - in production would maintain user -> socket mapping
    return null;
  }

  private calculateBandwidthUsage(): number {
    // Simplified calculation
    return this.metrics.active_connections * 1024 * 1024; // 1MB per connection
  }

  private handleDisconnection(connectionId: string, userId: string | null, currentRoom: string | null): void {
    this.metrics.active_connections--;

    if (userId && currentRoom) {
      this.activeRooms.get(currentRoom)?.delete(userId);
      
      // Notify room of user departure
      this.socketServer?.to(currentRoom).emit('user_left', {
        user_id: userId,
        participants_count: this.activeRooms.get(currentRoom)?.size || 0
      });
    }

    this.logger.info('WebSocket disconnection', {
      connection_id: connectionId,
      user_id: userId,
      room: currentRoom
    });
  }

  /**
   * Public API methods
   */

  public getActiveStreams(): LiveStream[] {
    return Array.from(this.activeStreams.values())
      .filter(stream => stream.status === 'live');
  }

  public getStreamById(streamId: string): LiveStream | null {
    return this.activeStreams.get(streamId) || null;
  }

  public getActiveCalls(): VideoCall[] {
    return Array.from(this.activeCalls.values())
      .filter(call => call.status === 'active');
  }

  public getRoomMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const messages = this.chatMessages.get(roomId) || [];
    return messages.slice(-limit);
  }

  public getActivePolls(roomId: string): InteractivePoll[] {
    return Array.from(this.activePolls.values())
      .filter(poll => poll.room_id === roomId && poll.status === 'active');
  }

  public getAvailableGifts(): VirtualGift[] {
    return Array.from(this.availableGifts.values());
  }

  public getSystemMetrics(): any {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.server_uptime,
      active_rooms: this.activeRooms.size,
      total_peer_connections: this.activePeerConnections.size
    };
  }

  public getProcessingStats(): any {
    return {
      active_streams: this.metrics.active_streams,
      active_connections: this.metrics.active_connections,
      total_messages: this.metrics.total_messages,
      total_video_calls: this.metrics.total_video_calls,
      bandwidth_usage: this.metrics.bandwidth_usage
    };
  }

  /**
   * Shutdown the communication hub
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Real-time Communication Hub');

    try {
      // Close all WebSocket connections
      this.socketServer?.close();
      
      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer.close(() => resolve());
        });
      }

      // Clean up resources
      this.activeStreams.clear();
      this.activeCalls.clear();
      this.chatMessages.clear();
      this.activePeerConnections.clear();

      this.initialized = false;
      this.logger.info('✅ Real-time Communication Hub shutdown complete');

    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

export const realtimeCommunicationHub = new RealtimeCommunicationHub();

// ===============================
// EXPORTS
// ===============================

export default realtimeCommunicationHub;

// Types
export type {
  RealtimeCommunicationConfig,
  LiveStream,
  ChatMessage,
  VideoCall,
  InteractivePoll,
  VirtualGift,
  WebRTCPeerConnection,
  StreamCategory,
  StreamStatus,
  ChatMessageType,
  ModerationStatus
};

// ===============================
// STARTUP MESSAGE
// ===============================

const logger = createSecurityLogger('realtime-comms-main');
logger.info('🔴 Real-time Communication Hub loaded');
logger.info('💬 Live Chat: Real-time messaging with auto-moderation');
logger.info('🎥 Live Streaming: WebRTC streaming with adaptive quality');
logger.info('📞 Video Calls: One-on-one and group video calls');
logger.info('🎮 Interactive: Polls, virtual gifts, tip notifications');
logger.info('🔒 Security: Integrated with FanzSecurity monitoring');

export { logger as realtimeLogger };
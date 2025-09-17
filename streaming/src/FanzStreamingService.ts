import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// 🎥 FANZ Real-time Streaming Service
// Enterprise-grade live streaming infrastructure for creators

export interface StreamConfig {
  enableRecording: boolean;
  enableTranscoding: boolean;
  maxViewers: number;
  qualityLevels: ('240p' | '480p' | '720p' | '1080p' | '4K')[];
  enableChat: boolean;
  enableTipping: boolean;
  enablePrivateShows: boolean;
  contentModeration: {
    enabled: boolean;
    autoModerationLevel: 'low' | 'medium' | 'high';
  };
  geoRestrictions: {
    enabled: boolean;
    allowedCountries?: string[];
    blockedCountries?: string[];
  };
}

export interface StreamSession {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  category: string;
  platform: string;
  status: 'preparing' | 'live' | 'ended' | 'paused';
  startedAt?: Date;
  endedAt?: Date;
  viewerCount: number;
  maxViewers: number;
  totalViewTime: number; // in seconds
  settings: {
    isPrivate: boolean;
    requiresSubscription: boolean;
    pricePerMinute?: number;
    allowRecording: boolean;
    allowChat: boolean;
    qualityLevel: string;
  };
  rtcConfiguration: RTCConfiguration;
  streamKey: string;
  ingestUrl: string;
  playbackUrls: {
    hls: string;
    dash: string;
    webrtc: string;
  };
  metadata: {
    bitrate?: number;
    resolution?: string;
    fps?: number;
    codec?: string;
    bandwidth?: number;
  };
  analytics: {
    totalViews: number;
    averageViewDuration: number;
    peakViewers: number;
    chatMessages: number;
    tips: number;
    revenue: number;
  };
}

export interface Viewer {
  id: string;
  userId?: string;
  isAnonymous: boolean;
  joinedAt: Date;
  location?: string;
  device?: string;
  connection: {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    bandwidth: number;
    latency: number;
  };
  permissions: {
    canChat: boolean;
    canTip: boolean;
    isVip: boolean;
    isModerator: boolean;
  };
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId?: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'tip' | 'system' | 'moderation';
  metadata?: {
    tipAmount?: number;
    currency?: string;
    isHighlighted?: boolean;
    moderationAction?: string;
  };
}

export interface StreamingStats {
  totalStreams: number;
  activeStreams: number;
  totalViewers: number;
  averageViewDuration: number;
  totalRevenue: number;
  topPerformers: Array<{
    creatorId: string;
    viewerCount: number;
    revenue: number;
  }>;
}

export class FanzStreamingService extends EventEmitter {
  private sessions: Map<string, StreamSession> = new Map();
  private viewers: Map<string, Map<string, Viewer>> = new Map(); // streamId -> viewerId -> Viewer
  private chatMessages: Map<string, ChatMessage[]> = new Map(); // streamId -> messages
  private config: StreamConfig;

  constructor(config: Partial<StreamConfig> = {}) {
    super();
    
    this.config = {
      enableRecording: true,
      enableTranscoding: true,
      maxViewers: 10000,
      qualityLevels: ['240p', '480p', '720p', '1080p'],
      enableChat: true,
      enableTipping: true,
      enablePrivateShows: true,
      contentModeration: {
        enabled: true,
        autoModerationLevel: 'medium'
      },
      geoRestrictions: {
        enabled: true,
        blockedCountries: ['CN', 'IR', 'KP'] // Example restrictions
      },
      ...config
    };

    console.log('🎥 FANZ Streaming Service initialized');
    this.setupCleanupInterval();
  }

  /**
   * Create a new streaming session
   */
  async createStream(params: {
    creatorId: string;
    title: string;
    description?: string;
    category: string;
    platform: string;
    settings?: Partial<StreamSession['settings']>;
  }): Promise<StreamSession> {
    const { creatorId, title, description, category, platform, settings } = params;

    const streamId = this.generateStreamId();
    const streamKey = this.generateStreamKey(creatorId, streamId);

    const session: StreamSession = {
      id: streamId,
      creatorId,
      title,
      description,
      category,
      platform,
      status: 'preparing',
      viewerCount: 0,
      maxViewers: 0,
      totalViewTime: 0,
      settings: {
        isPrivate: false,
        requiresSubscription: false,
        allowRecording: this.config.enableRecording,
        allowChat: this.config.enableChat,
        qualityLevel: '720p',
        ...settings
      },
      rtcConfiguration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:turn.fanz.com:3478',
            username: 'fanzuser',
            credential: process.env.TURN_SERVER_SECRET || 'defaultsecret'
          }
        ],
        iceCandidatePoolSize: 10
      },
      streamKey,
      ingestUrl: `rtmp://ingest.fanz.com/live/${streamKey}`,
      playbackUrls: {
        hls: `https://cdn.fanz.com/hls/${streamId}/index.m3u8`,
        dash: `https://cdn.fanz.com/dash/${streamId}/manifest.mpd`,
        webrtc: `wss://streaming.fanz.com/webrtc/${streamId}`
      },
      metadata: {},
      analytics: {
        totalViews: 0,
        averageViewDuration: 0,
        peakViewers: 0,
        chatMessages: 0,
        tips: 0,
        revenue: 0
      }
    };

    this.sessions.set(streamId, session);
    this.viewers.set(streamId, new Map());
    this.chatMessages.set(streamId, []);

    console.log('🎬 Stream created:', { streamId, creatorId, title, platform });
    this.emit('streamCreated', session);

    return session;
  }

  /**
   * Start a streaming session
   */
  async startStream(streamId: string): Promise<boolean> {
    const session = this.sessions.get(streamId);
    if (!session) {
      throw new Error('Stream session not found');
    }

    if (session.status !== 'preparing' && session.status !== 'paused') {
      throw new Error(`Cannot start stream in ${session.status} state`);
    }

    // Validate creator can stream
    const canStream = await this.validateCreatorPermissions(session.creatorId);
    if (!canStream.allowed) {
      throw new Error(`Creator cannot stream: ${canStream.reason}`);
    }

    session.status = 'live';
    session.startedAt = new Date();

    // Initialize transcoding if enabled
    if (this.config.enableTranscoding) {
      await this.initializeTranscoding(session);
    }

    // Start recording if enabled
    if (session.settings.allowRecording && this.config.enableRecording) {
      await this.startRecording(session);
    }

    // Initialize content moderation
    if (this.config.contentModeration.enabled) {
      await this.initializeContentModeration(session);
    }

    this.sessions.set(streamId, session);

    console.log('🔴 Stream started:', { streamId, creatorId: session.creatorId });
    this.emit('streamStarted', session);

    // Send system message to chat
    if (this.config.enableChat) {
      await this.sendSystemMessage(streamId, `${session.title} is now live!`);
    }

    return true;
  }

  /**
   * Join a stream as a viewer
   */
  async joinStream(params: {
    streamId: string;
    userId?: string;
    location?: string;
    device?: string;
  }): Promise<{ success: boolean; viewer?: Viewer; reason?: string }> {
    const { streamId, userId, location, device } = params;

    const session = this.sessions.get(streamId);
    if (!session) {
      return { success: false, reason: 'Stream not found' };
    }

    if (session.status !== 'live') {
      return { success: false, reason: 'Stream is not live' };
    }

    // Check viewer limits
    const currentViewers = this.viewers.get(streamId)!;
    if (currentViewers.size >= this.config.maxViewers) {
      return { success: false, reason: 'Stream is at capacity' };
    }

    // Check geo restrictions
    if (this.config.geoRestrictions.enabled && location) {
      if (this.config.geoRestrictions.blockedCountries?.includes(location)) {
        return { success: false, reason: 'Stream not available in your location' };
      }
      if (this.config.geoRestrictions.allowedCountries?.length && 
          !this.config.geoRestrictions.allowedCountries.includes(location)) {
        return { success: false, reason: 'Stream not available in your location' };
      }
    }

    // Check subscription requirements
    if (session.settings.requiresSubscription && userId) {
      const hasSubscription = await this.checkUserSubscription(userId, session.creatorId);
      if (!hasSubscription) {
        return { success: false, reason: 'Subscription required' };
      }
    }

    const viewerId = userId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const viewer: Viewer = {
      id: viewerId,
      userId,
      isAnonymous: !userId,
      joinedAt: new Date(),
      location,
      device,
      connection: {
        quality: 'good',
        bandwidth: 0,
        latency: 0
      },
      permissions: {
        canChat: this.config.enableChat,
        canTip: this.config.enableTipping && !!userId,
        isVip: false,
        isModerator: false
      }
    };

    // Set VIP/Moderator status
    if (userId) {
      const userStatus = await this.getUserStatus(userId, session.creatorId);
      viewer.permissions.isVip = userStatus.isVip;
      viewer.permissions.isModerator = userStatus.isModerator;
    }

    currentViewers.set(viewerId, viewer);
    
    // Update session stats
    session.viewerCount = currentViewers.size;
    session.maxViewers = Math.max(session.maxViewers, session.viewerCount);
    session.analytics.totalViews++;
    session.analytics.peakViewers = Math.max(session.analytics.peakViewers, session.viewerCount);

    this.sessions.set(streamId, session);

    console.log('👀 Viewer joined stream:', { streamId, viewerId, viewerCount: session.viewerCount });
    this.emit('viewerJoined', { session, viewer });

    // Welcome message for VIP/subscribers
    if (viewer.permissions.isVip && this.config.enableChat) {
      await this.sendSystemMessage(streamId, `Welcome VIP ${viewer.id}! 🌟`);
    }

    return { success: true, viewer };
  }

  /**
   * Leave a stream
   */
  async leaveStream(streamId: string, viewerId: string): Promise<boolean> {
    const session = this.sessions.get(streamId);
    const viewers = this.viewers.get(streamId);
    
    if (!session || !viewers) {
      return false;
    }

    const viewer = viewers.get(viewerId);
    if (!viewer) {
      return false;
    }

    // Calculate view duration
    const viewDuration = Date.now() - viewer.joinedAt.getTime();
    session.totalViewTime += Math.floor(viewDuration / 1000);

    // Update analytics
    const totalViewers = session.analytics.totalViews;
    const currentAvg = session.analytics.averageViewDuration;
    session.analytics.averageViewDuration = 
      ((currentAvg * (totalViewers - 1)) + viewDuration) / totalViewers;

    viewers.delete(viewerId);
    session.viewerCount = viewers.size;

    this.sessions.set(streamId, session);

    console.log('👋 Viewer left stream:', { streamId, viewerId, viewDuration });
    this.emit('viewerLeft', { session, viewer, viewDuration });

    return true;
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(params: {
    streamId: string;
    userId?: string;
    username: string;
    message: string;
    type?: ChatMessage['type'];
    metadata?: ChatMessage['metadata'];
  }): Promise<ChatMessage | null> {
    const { streamId, userId, username, message, type = 'message', metadata } = params;

    const session = this.sessions.get(streamId);
    if (!session) {
      return null;
    }

    if (!this.config.enableChat) {
      return null;
    }

    // Check viewer permissions
    if (userId) {
      const viewers = this.viewers.get(streamId);
      const viewer = viewers?.get(userId);
      if (viewer && !viewer.permissions.canChat) {
        return null;
      }
    }

    // Content moderation
    if (this.config.contentModeration.enabled && type === 'message') {
      const moderationResult = await this.moderateMessage(message);
      if (moderationResult.blocked) {
        console.log('💬 Message blocked by moderation:', { streamId, userId, reason: moderationResult.reason });
        return null;
      }
    }

    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      streamId,
      userId,
      username,
      message,
      timestamp: new Date(),
      type,
      metadata
    };

    const messages = this.chatMessages.get(streamId) || [];
    messages.push(chatMessage);

    // Keep only last 1000 messages
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }

    this.chatMessages.set(streamId, messages);

    // Update analytics
    session.analytics.chatMessages++;
    if (type === 'tip' && metadata?.tipAmount) {
      session.analytics.tips++;
      session.analytics.revenue += metadata.tipAmount;
    }

    this.sessions.set(streamId, session);

    console.log('💬 Chat message sent:', { streamId, type, userId });
    this.emit('chatMessage', chatMessage);

    return chatMessage;
  }

  /**
   * End a streaming session
   */
  async endStream(streamId: string): Promise<boolean> {
    const session = this.sessions.get(streamId);
    if (!session) {
      return false;
    }

    if (session.status !== 'live' && session.status !== 'paused') {
      return false;
    }

    session.status = 'ended';
    session.endedAt = new Date();

    // Notify all viewers
    const viewers = this.viewers.get(streamId);
    if (viewers) {
      for (const [viewerId, viewer] of viewers) {
        await this.leaveStream(streamId, viewerId);
      }
    }

    // Stop recording if active
    if (session.settings.allowRecording) {
      await this.stopRecording(session);
    }

    // Stop transcoding
    if (this.config.enableTranscoding) {
      await this.stopTranscoding(session);
    }

    this.sessions.set(streamId, session);

    console.log('🔴 Stream ended:', { 
      streamId, 
      duration: session.endedAt.getTime() - (session.startedAt?.getTime() || 0),
      totalViews: session.analytics.totalViews,
      revenue: session.analytics.revenue
    });

    this.emit('streamEnded', session);

    // Send final analytics
    await this.sendStreamAnalytics(session);

    return true;
  }

  /**
   * Get stream analytics
   */
  getStreamAnalytics(streamId: string): StreamSession['analytics'] | null {
    const session = this.sessions.get(streamId);
    return session?.analytics || null;
  }

  /**
   * Get overall streaming statistics
   */
  getStreamingStats(): StreamingStats {
    const sessions = Array.from(this.sessions.values());
    const activeStreams = sessions.filter(s => s.status === 'live');
    
    let totalViewers = 0;
    let totalViewTime = 0;
    let totalRevenue = 0;

    for (const session of sessions) {
      if (session.status === 'live') {
        totalViewers += session.viewerCount;
      }
      totalViewTime += session.totalViewTime;
      totalRevenue += session.analytics.revenue;
    }

    const averageViewDuration = sessions.length > 0 
      ? totalViewTime / sessions.reduce((sum, s) => sum + s.analytics.totalViews, 0)
      : 0;

    const topPerformers = activeStreams
      .sort((a, b) => b.viewerCount - a.viewerCount)
      .slice(0, 10)
      .map(session => ({
        creatorId: session.creatorId,
        viewerCount: session.viewerCount,
        revenue: session.analytics.revenue
      }));

    return {
      totalStreams: sessions.length,
      activeStreams: activeStreams.length,
      totalViewers,
      averageViewDuration,
      totalRevenue,
      topPerformers
    };
  }

  /**
   * Get chat messages for a stream
   */
  getChatMessages(streamId: string, limit: number = 100): ChatMessage[] {
    const messages = this.chatMessages.get(streamId) || [];
    return messages.slice(-limit);
  }

  // Private helper methods

  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStreamKey(creatorId: string, streamId: string): string {
    return createHash('sha256')
      .update(`${creatorId}_${streamId}_${Date.now()}`)
      .digest('hex')
      .substring(0, 32);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async validateCreatorPermissions(creatorId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Mock validation - in production would check database
    // Check for active subscriptions, compliance status, etc.
    return { allowed: true };
  }

  private async checkUserSubscription(userId: string, creatorId: string): Promise<boolean> {
    // Mock subscription check - in production would check database
    return true;
  }

  private async getUserStatus(userId: string, creatorId: string): Promise<{ isVip: boolean; isModerator: boolean }> {
    // Mock status check - in production would check database
    return { isVip: false, isModerator: false };
  }

  private async initializeTranscoding(session: StreamSession): Promise<void> {
    // Mock transcoding initialization
    console.log('🎞️ Initializing transcoding for stream:', session.id);
  }

  private async startRecording(session: StreamSession): Promise<void> {
    // Mock recording start
    console.log('🎬 Starting recording for stream:', session.id);
  }

  private async stopRecording(session: StreamSession): Promise<void> {
    // Mock recording stop
    console.log('🎬 Stopping recording for stream:', session.id);
  }

  private async stopTranscoding(session: StreamSession): Promise<void> {
    // Mock transcoding stop
    console.log('🎞️ Stopping transcoding for stream:', session.id);
  }

  private async initializeContentModeration(session: StreamSession): Promise<void> {
    // Mock content moderation initialization
    console.log('🛡️ Initializing content moderation for stream:', session.id);
  }

  private async moderateMessage(message: string): Promise<{ blocked: boolean; reason?: string }> {
    // Simple content moderation - in production would use AI services
    const blockedWords = ['spam', 'scam', 'fake'];
    const hasBlockedWord = blockedWords.some(word => message.toLowerCase().includes(word));
    
    return {
      blocked: hasBlockedWord,
      reason: hasBlockedWord ? 'Contains blocked content' : undefined
    };
  }

  private async sendSystemMessage(streamId: string, message: string): Promise<void> {
    await this.sendChatMessage({
      streamId,
      username: 'System',
      message,
      type: 'system'
    });
  }

  private async sendStreamAnalytics(session: StreamSession): Promise<void> {
    // Mock analytics sending - in production would send to analytics service
    console.log('📊 Sending stream analytics:', {
      streamId: session.id,
      analytics: session.analytics
    });
  }

  private setupCleanupInterval(): void {
    // Clean up ended streams every hour
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      for (const [streamId, session] of this.sessions) {
        if (session.status === 'ended' && 
            session.endedAt && 
            session.endedAt.getTime() < cutoffTime) {
          this.sessions.delete(streamId);
          this.viewers.delete(streamId);
          this.chatMessages.delete(streamId);
          console.log('🧹 Cleaned up old stream:', streamId);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }
}

export default FanzStreamingService;
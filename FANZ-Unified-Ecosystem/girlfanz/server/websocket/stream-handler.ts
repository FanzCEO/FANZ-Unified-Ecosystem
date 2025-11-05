import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { streamingService } from '../services/streaming';
import { storage } from '../storage';
import { verificationService } from '../services/verification';

export interface StreamWebSocketMessage {
  type: string;
  sessionId?: string;
  userId?: string;
  data?: any;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

export class StreamWebSocketHandler {
  private wss: WebSocketServer;
  private connections: Map<string, AuthenticatedWebSocket> = new Map();
  private pingInterval?: NodeJS.Timer;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    streamingService.setWebSocketServer(wss);
    
    // Setup heartbeat to detect disconnected clients
    this.setupHeartbeat();
  }

  // Handle new WebSocket connection
  async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): Promise<void> {
    console.log('New WebSocket connection for streaming');
    
    // Setup connection handlers
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message: string) => {
      try {
        const data: StreamWebSocketMessage = JSON.parse(message.toString());
        await this.handleMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });

    // Send initial connection success
    this.sendMessage(ws, {
      type: 'connection_established',
      data: { message: 'Connected to streaming service' }
    });
  }

  // Handle incoming messages
  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: StreamWebSocketMessage
  ): Promise<void> {
    const { type, sessionId, userId, data } = message;

    // Handle authentication first
    if (type === 'authenticate') {
      return this.handleAuthentication(ws, data);
    }

    // Check if authenticated for other operations
    if (!ws.userId) {
      return this.sendError(ws, 'Authentication required');
    }

    try {
      switch (type) {
        case 'create_stream':
          await this.handleCreateStream(ws, data);
          break;
          
        case 'join_stream':
          await this.handleJoinStream(ws, sessionId!, ws.userId, data);
          break;
          
        case 'leave_stream':
          await this.handleLeaveStream(ws, sessionId!, ws.userId);
          break;
          
        case 'start_stream':
          await this.handleStartStream(ws, sessionId!);
          break;
          
        case 'end_stream':
          await this.handleEndStream(ws, sessionId!);
          break;
          
        case 'invite_costar':
          await this.handleInviteCoStar(ws, sessionId!, data);
          break;
          
        case 'remove_costar':
          await this.handleRemoveCoStar(ws, sessionId!, data.userId);
          break;
          
        case 'send_chat':
          await this.handleChatMessage(ws, sessionId!, data);
          break;
          
        case 'send_gift':
          await this.handleGift(ws, sessionId!, data);
          break;
          
        case 'send_reaction':
          await this.handleReaction(ws, sessionId!, data);
          break;
          
        case 'webrtc_offer':
        case 'webrtc_answer':
        case 'webrtc_ice_candidate':
          await this.handleWebRTCSignaling(ws, sessionId!, type, data);
          break;
          
        case 'update_stream_settings':
          await this.handleUpdateStreamSettings(ws, sessionId!, data);
          break;
          
        case 'toggle_audio':
          await this.handleToggleAudio(ws, sessionId!, data.enabled);
          break;
          
        case 'toggle_video':
          await this.handleToggleVideo(ws, sessionId!, data.enabled);
          break;
          
        case 'apply_filter':
          await this.handleApplyFilter(ws, sessionId!, data);
          break;
          
        case 'set_virtual_background':
          await this.handleSetVirtualBackground(ws, sessionId!, data);
          break;
          
        case 'request_highlight':
          await this.handleRequestHighlight(ws, sessionId!, data);
          break;
          
        case 'get_stream_analytics':
          await this.handleGetAnalytics(ws, sessionId!);
          break;
          
        case 'pin_message':
          await this.handlePinMessage(ws, sessionId!, data.messageId);
          break;
          
        case 'moderate_user':
          await this.handleModerateUser(ws, sessionId!, data);
          break;
          
        default:
          this.sendError(ws, `Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error(`Error handling ${type}:`, error);
      this.sendError(ws, error instanceof Error ? error.message : 'Operation failed');
    }
  }

  // Authentication handler
  private async handleAuthentication(
    ws: AuthenticatedWebSocket,
    data: { userId: string; token?: string }
  ): Promise<void> {
    const { userId, token } = data;
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return this.sendError(ws, 'Invalid user');
    }
    
    // In production, verify JWT token
    // For now, just set the userId
    ws.userId = userId;
    this.connections.set(userId, ws);
    
    this.sendMessage(ws, {
      type: 'authenticated',
      data: {
        userId,
        username: user.username,
        role: user.role
      }
    });
  }

  // Stream creation handler
  private async handleCreateStream(
    ws: AuthenticatedWebSocket,
    data: any
  ): Promise<void> {
    if (!ws.userId) {
      return this.sendError(ws, 'Authentication required');
    }
    
    const session = await streamingService.createStream(ws.userId, data);
    ws.sessionId = session.id;
    
    this.sendMessage(ws, {
      type: 'stream_created',
      data: {
        sessionId: session.id,
        streamId: session.streamId,
        streamKey: session.streamKey,
        rtcConfiguration: session.rtcConfiguration
      }
    });
  }

  // Join stream handler
  private async handleJoinStream(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    userId: string,
    data: { role?: string }
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    ws.sessionId = sessionId;
    
    if (data.role === 'costar' || session.participants.has(userId)) {
      // Joining as participant
      const participant = session.participants.get(userId);
      if (participant) {
        participant.connection = ws;
      }
      
      // Check verification for co-stars
      if (data.role === 'costar') {
        const verification = await verificationService.getUserVerificationStatus(userId);
        if (!verification.verified) {
          return this.sendError(ws, 'Verification required to join as co-star');
        }
        
        await streamingService.addCoStar(sessionId, userId, true);
      }
      
      this.sendMessage(ws, {
        type: 'joined_as_participant',
        data: {
          sessionId,
          streamId: session.streamId,
          participants: Array.from(session.participants.values()).map(p => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            isVerified: p.isVerified
          })),
          rtcConfiguration: session.rtcConfiguration
        }
      });
    } else {
      // Joining as viewer
      await streamingService.addViewer(sessionId, userId, ws);
      
      this.sendMessage(ws, {
        type: 'joined_as_viewer',
        data: {
          sessionId,
          streamId: session.streamId,
          currentViewers: session.analytics.currentViewers,
          streamStatus: session.status
        }
      });
    }
  }

  // Leave stream handler
  private async handleLeaveStream(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) return;
    
    if (session.participants.has(userId)) {
      await streamingService.removeCoStar(sessionId, userId);
    } else {
      await streamingService.removeViewer(sessionId, userId);
    }
    
    ws.sessionId = undefined;
    
    this.sendMessage(ws, {
      type: 'left_stream',
      data: { sessionId }
    });
  }

  // Start stream handler
  private async handleStartStream(
    ws: AuthenticatedWebSocket,
    sessionId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host can start stream
    if (ws.userId !== session.creatorId) {
      return this.sendError(ws, 'Only host can start the stream');
    }
    
    await streamingService.startStream(sessionId);
    
    this.sendMessage(ws, {
      type: 'stream_started',
      data: {
        sessionId,
        startedAt: session.startedAt
      }
    });
  }

  // End stream handler
  private async handleEndStream(
    ws: AuthenticatedWebSocket,
    sessionId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host can end stream
    if (ws.userId !== session.creatorId) {
      return this.sendError(ws, 'Only host can end the stream');
    }
    
    await streamingService.endStream(sessionId);
    
    this.sendMessage(ws, {
      type: 'stream_ended',
      data: {
        sessionId,
        endedAt: session.endedAt,
        recordingAvailable: !!session.recordingUrl
      }
    });
  }

  // Invite co-star handler
  private async handleInviteCoStar(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { userId: string; requireVerification?: boolean }
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host can invite co-stars
    if (ws.userId !== session.creatorId) {
      return this.sendError(ws, 'Only host can invite co-stars');
    }
    
    await streamingService.addCoStar(
      sessionId,
      data.userId,
      data.requireVerification !== false
    );
    
    // Notify invited user if connected
    const invitedWs = this.connections.get(data.userId);
    if (invitedWs) {
      this.sendMessage(invitedWs, {
        type: 'costar_invitation',
        data: {
          sessionId,
          streamId: session.streamId,
          hostId: session.creatorId
        }
      });
    }
    
    this.sendMessage(ws, {
      type: 'costar_invited',
      data: { userId: data.userId }
    });
  }

  // Remove co-star handler
  private async handleRemoveCoStar(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    coStarId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host can remove co-stars
    if (ws.userId !== session.creatorId) {
      return this.sendError(ws, 'Only host can remove co-stars');
    }
    
    await streamingService.removeCoStar(sessionId, coStarId);
    
    // Notify removed user
    const removedWs = this.connections.get(coStarId);
    if (removedWs) {
      this.sendMessage(removedWs, {
        type: 'removed_from_stream',
        data: { sessionId }
      });
    }
    
    this.sendMessage(ws, {
      type: 'costar_removed',
      data: { userId: coStarId }
    });
  }

  // Chat message handler
  private async handleChatMessage(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { message: string; messageType?: string }
  ): Promise<void> {
    if (!ws.userId) return;
    
    await streamingService.sendChatMessage(
      sessionId,
      ws.userId,
      data.message,
      (data.messageType as any) || 'text'
    );
  }

  // Gift handler
  private async handleGift(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: {
      receiverId: string;
      giftType: string;
      giftValue: number;
      quantity?: number;
      message?: string;
    }
  ): Promise<void> {
    if (!ws.userId) return;
    
    await streamingService.sendGift(
      sessionId,
      ws.userId,
      data.receiverId,
      data.giftType,
      data.giftValue,
      data.quantity || 1,
      data.message
    );
  }

  // Reaction handler
  private async handleReaction(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { reactionType: string; intensity?: number }
  ): Promise<void> {
    if (!ws.userId) return;
    
    await streamingService.sendReaction(
      sessionId,
      ws.userId,
      data.reactionType,
      data.intensity || 1
    );
  }

  // WebRTC signaling handler
  private async handleWebRTCSignaling(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    signalType: string,
    data: any
  ): Promise<void> {
    if (!ws.userId) return;
    
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only participants can send WebRTC signals
    if (!session.participants.has(ws.userId)) {
      return this.sendError(ws, 'Not a participant in this stream');
    }
    
    await streamingService.handleSignaling(sessionId, ws.userId, {
      type: signalType,
      ...data
    });
  }

  // Update stream settings handler
  private async handleUpdateStreamSettings(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: any
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host can update settings
    if (ws.userId !== session.creatorId) {
      return this.sendError(ws, 'Only host can update settings');
    }
    
    // Update settings in database
    await storage.updateLiveStream(session.streamId, data);
    
    this.sendMessage(ws, {
      type: 'settings_updated',
      data
    });
  }

  // Toggle audio handler
  private async handleToggleAudio(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    enabled: boolean
  ): Promise<void> {
    if (!ws.userId) return;
    
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    const participant = session.participants.get(ws.userId);
    if (!participant) {
      return this.sendError(ws, 'Not a participant');
    }
    
    participant.audioEnabled = enabled;
    
    // Broadcast to all participants
    this.broadcastToParticipants(session, {
      type: 'audio_toggled',
      data: {
        userId: ws.userId,
        enabled
      }
    });
  }

  // Toggle video handler
  private async handleToggleVideo(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    enabled: boolean
  ): Promise<void> {
    if (!ws.userId) return;
    
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    const participant = session.participants.get(ws.userId);
    if (!participant) {
      return this.sendError(ws, 'Not a participant');
    }
    
    participant.videoEnabled = enabled;
    
    // Broadcast to all participants
    this.broadcastToParticipants(session, {
      type: 'video_toggled',
      data: {
        userId: ws.userId,
        enabled
      }
    });
  }

  // Apply filter handler
  private async handleApplyFilter(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { filterType: string; settings?: any }
  ): Promise<void> {
    this.sendMessage(ws, {
      type: 'filter_applied',
      data: {
        filterType: data.filterType,
        settings: data.settings
      }
    });
  }

  // Set virtual background handler
  private async handleSetVirtualBackground(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { backgroundUrl?: string; blurLevel?: number }
  ): Promise<void> {
    this.sendMessage(ws, {
      type: 'virtual_background_set',
      data
    });
  }

  // Request highlight handler
  private async handleRequestHighlight(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { title?: string; duration?: number }
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session || session.status !== 'live') {
      return this.sendError(ws, 'Stream not active');
    }
    
    // Mark current moment as highlight
    const timestamp = Math.floor((Date.now() - (session.startedAt?.getTime() || 0)) / 1000);
    
    await storage.createStreamHighlight({
      streamId: session.streamId,
      title: data.title,
      startTime: Math.max(0, timestamp - (data.duration || 30)),
      endTime: timestamp + 30,
      highlightType: 'manual',
      score: 75
    });
    
    this.sendMessage(ws, {
      type: 'highlight_created',
      data: { timestamp }
    });
  }

  // Get analytics handler
  private async handleGetAnalytics(
    ws: AuthenticatedWebSocket,
    sessionId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    this.sendMessage(ws, {
      type: 'analytics',
      data: session.analytics
    });
  }

  // Pin message handler
  private async handlePinMessage(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    messageId: string
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host/moderators can pin messages
    const participant = session.participants.get(ws.userId!);
    if (!participant || (participant.role !== 'host' && participant.role !== 'moderator')) {
      return this.sendError(ws, 'Insufficient permissions');
    }
    
    const message = session.chatMessages.find(m => m.id === messageId);
    if (message) {
      message.isPinned = true;
      
      // Broadcast pinned message
      this.broadcastToSession(session, {
        type: 'message_pinned',
        data: { messageId }
      });
    }
  }

  // Moderate user handler
  private async handleModerateUser(
    ws: AuthenticatedWebSocket,
    sessionId: string,
    data: { userId: string; action: 'timeout' | 'ban' | 'unban'; duration?: number }
  ): Promise<void> {
    const session = streamingService.getSession(sessionId);
    if (!session) {
      return this.sendError(ws, 'Stream not found');
    }
    
    // Only host/moderators can moderate
    const participant = session.participants.get(ws.userId!);
    if (!participant || (participant.role !== 'host' && participant.role !== 'moderator')) {
      return this.sendError(ws, 'Insufficient permissions');
    }
    
    // Apply moderation action
    if (data.action === 'ban' || data.action === 'timeout') {
      await streamingService.removeViewer(sessionId, data.userId);
      
      // Notify banned user
      const bannedWs = this.connections.get(data.userId);
      if (bannedWs) {
        this.sendMessage(bannedWs, {
          type: 'moderated',
          data: {
            action: data.action,
            duration: data.duration
          }
        });
        bannedWs.close();
      }
    }
    
    this.sendMessage(ws, {
      type: 'user_moderated',
      data
    });
  }

  // Disconnection handler
  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    if (ws.userId && ws.sessionId) {
      const session = streamingService.getSession(ws.sessionId);
      if (session) {
        if (session.participants.has(ws.userId)) {
          // Participant disconnected
          const participant = session.participants.get(ws.userId);
          if (participant) {
            participant.connection = undefined;
          }
        } else {
          // Viewer disconnected
          streamingService.removeViewer(ws.sessionId, ws.userId);
        }
      }
      
      this.connections.delete(ws.userId);
    }
  }

  // Helper methods
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error }
    });
  }

  private broadcastToSession(session: any, message: any): void {
    const messageStr = JSON.stringify(message);
    
    session.participants.forEach((participant: any) => {
      if (participant.connection?.readyState === WebSocket.OPEN) {
        participant.connection.send(messageStr);
      }
    });
    
    session.viewers.forEach((viewer: any) => {
      if (viewer.connection?.readyState === WebSocket.OPEN) {
        viewer.connection.send(messageStr);
      }
    });
  }

  private broadcastToParticipants(session: any, message: any): void {
    const messageStr = JSON.stringify(message);
    
    session.participants.forEach((participant: any) => {
      if (participant.connection?.readyState === WebSocket.OPEN) {
        participant.connection.send(messageStr);
      }
    });
  }

  private setupHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000) as NodeJS.Timeout; // Ping every 30 seconds
  }

  // Cleanup
  cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval as NodeJS.Timeout);
    }
    
    this.connections.clear();
  }
}

// Export singleton instance
export let streamWebSocketHandler: StreamWebSocketHandler;

export function initStreamWebSocketHandler(wss: WebSocketServer): StreamWebSocketHandler {
  streamWebSocketHandler = new StreamWebSocketHandler(wss);
  return streamWebSocketHandler;
}
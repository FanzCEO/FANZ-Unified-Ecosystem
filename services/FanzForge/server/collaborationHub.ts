import { WebSocket } from "ws";
import { EventEmitter } from "events";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface Room {
  id: string;
  projectId: string;
  users: Map<string, User>;
  operations: Operation[];
  lastActivity: Date;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format' | 'cursor' | 'selection';
  position?: number;
  length?: number;
  content?: any;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
}

export interface CollaborationMessage {
  type: 'operation' | 'cursor' | 'presence' | 'sync' | 'chat' | 'notification';
  data: any;
  userId: string;
  roomId: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'code' | 'system';
  metadata?: Record<string, any>;
}

export class CollaborationHub extends EventEmitter {
  private rooms: Map<string, Room> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> roomId
  
  constructor() {
    super();
    // Clean up inactive rooms every 5 minutes
    setInterval(() => this.cleanupInactiveRooms(), 5 * 60 * 1000);
  }

  /**
   * Join a collaboration room
   */
  joinRoom(roomId: string, projectId: string, user: User, ws: WebSocket): void {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      room = {
        id: roomId,
        projectId,
        users: new Map(),
        operations: [],
        lastActivity: new Date()
      };
      this.rooms.set(roomId, room);
    }

    // Add user to room
    room.users.set(user.id, user);
    this.connections.set(user.id, ws);
    this.userSessions.set(user.id, roomId);
    room.lastActivity = new Date();

    // Setup WebSocket handlers
    this.setupWebSocketHandlers(user.id, ws, room);

    // Notify other users
    this.broadcastToRoom(roomId, {
      type: 'presence',
      data: { 
        type: 'user_joined', 
        user,
        activeUsers: Array.from(room.users.values())
      },
      userId: user.id,
      roomId,
      timestamp: new Date()
    }, user.id);

    // Send current state to new user
    this.sendToUser(user.id, {
      type: 'sync',
      data: {
        operations: room.operations,
        activeUsers: Array.from(room.users.values())
      },
      userId: 'system',
      roomId,
      timestamp: new Date()
    });

    this.emit('userJoined', { roomId, projectId, user });
  }

  /**
   * Leave a collaboration room
   */
  leaveRoom(userId: string): void {
    const roomId = this.userSessions.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    room.users.delete(userId);
    this.connections.delete(userId);
    this.userSessions.delete(userId);

    // Notify other users
    if (user) {
      this.broadcastToRoom(roomId, {
        type: 'presence',
        data: { 
          type: 'user_left', 
          user,
          activeUsers: Array.from(room.users.values())
        },
        userId,
        roomId,
        timestamp: new Date()
      });
    }

    // Remove empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }

    this.emit('userLeft', { roomId, userId, user });
  }

  /**
   * Apply operational transformation
   */
  applyOperation(roomId: string, operation: Operation): Operation[] {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    // Transform operation against existing operations
    const transformedOps = this.transformOperation(operation, room.operations);
    
    // Add to operation history
    room.operations.push(...transformedOps);
    room.lastActivity = new Date();

    // Keep only recent operations (last 1000)
    if (room.operations.length > 1000) {
      room.operations = room.operations.slice(-1000);
    }

    // Broadcast to all users in room
    this.broadcastToRoom(roomId, {
      type: 'operation',
      data: transformedOps,
      userId: operation.userId,
      roomId,
      timestamp: new Date()
    }, operation.userId);

    this.emit('operationApplied', { roomId, operation: transformedOps });
    return transformedOps;
  }

  /**
   * Update user cursor position
   */
  updateCursor(userId: string, cursor: { x: number; y: number }): void {
    const roomId = this.userSessions.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user) {
      user.cursor = cursor;
      
      // Broadcast cursor update
      this.broadcastToRoom(roomId, {
        type: 'cursor',
        data: { userId, cursor },
        userId,
        roomId,
        timestamp: new Date()
      }, userId);
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage(userId: string, content: string, type: 'text' | 'file' | 'code' = 'text'): void {
    const roomId = this.userSessions.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(userId);
    if (!user) return;

    const message: ChatMessage = {
      id: this.generateId(),
      userId,
      userName: user.name,
      content,
      type,
      timestamp: new Date()
    };

    // Broadcast chat message
    this.broadcastToRoom(roomId, {
      type: 'chat',
      data: message,
      userId,
      roomId,
      timestamp: new Date()
    });

    this.emit('chatMessage', { roomId, message });
  }

  /**
   * Get room statistics
   */
  getRoomStats(roomId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: roomId,
      projectId: room.projectId,
      userCount: room.users.size,
      operationCount: room.operations.length,
      lastActivity: room.lastActivity,
      users: Array.from(room.users.values()).map(user => ({
        id: user.id,
        name: user.name,
        color: user.color,
        hasActiveCursor: !!user.cursor
      }))
    };
  }

  /**
   * Get all active rooms
   */
  getAllRooms(): any[] {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      projectId: room.projectId,
      userCount: room.users.size,
      lastActivity: room.lastActivity
    }));
  }

  /**
   * Force sync for a user
   */
  forceSync(userId: string): void {
    const roomId = this.userSessions.get(userId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    this.sendToUser(userId, {
      type: 'sync',
      data: {
        operations: room.operations,
        activeUsers: Array.from(room.users.values())
      },
      userId: 'system',
      roomId,
      timestamp: new Date()
    });
  }

  // Private methods

  private setupWebSocketHandlers(userId: string, ws: WebSocket, room: Room): void {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as CollaborationMessage;
        this.handleWebSocketMessage(userId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.leaveRoom(userId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error for user', userId, error);
      this.leaveRoom(userId);
    });
  }

  private handleWebSocketMessage(userId: string, message: CollaborationMessage): void {
    switch (message.type) {
      case 'operation':
        if (message.data && message.data.length > 0) {
          message.data.forEach((op: Operation) => {
            op.userId = userId;
            op.timestamp = new Date();
            this.applyOperation(message.roomId, op);
          });
        }
        break;

      case 'cursor':
        if (message.data?.cursor) {
          this.updateCursor(userId, message.data.cursor);
        }
        break;

      case 'chat':
        if (message.data?.content) {
          this.sendChatMessage(userId, message.data.content, message.data.type);
        }
        break;

      case 'sync':
        this.forceSync(userId);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private transformOperation(operation: Operation, existingOps: Operation[]): Operation[] {
    // Implement Operational Transformation (OT) algorithm
    // This is a simplified version - real OT is more complex
    
    let transformedOps = [{ ...operation }];
    
    // Transform against each existing operation
    for (const existingOp of existingOps.slice(-50)) { // Only transform against recent ops
      if (existingOp.timestamp > operation.timestamp) continue;
      
      transformedOps = transformedOps.map(op => this.transformSingleOp(op, existingOp));
    }
    
    return transformedOps;
  }

  private transformSingleOp(op1: Operation, op2: Operation): Operation {
    // Simplified transformation logic
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position !== undefined && op2.position !== undefined) {
        if (op2.position <= op1.position) {
          return { ...op1, position: op1.position + (op2.length || 1) };
        }
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position !== undefined && op2.position !== undefined) {
        if (op2.position <= op1.position) {
          return { ...op1, position: op1.position + (op2.length || 1) };
        }
      }
    }
    
    return op1;
  }

  private broadcastToRoom(roomId: string, message: CollaborationMessage, excludeUserId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.users.forEach((user) => {
      if (excludeUserId && user.id === excludeUserId) return;
      this.sendToUser(user.id, message);
    });
  }

  private sendToUser(userId: string, message: CollaborationMessage): void {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to user', userId, error);
        this.leaveRoom(userId);
      }
    }
  }

  private cleanupInactiveRooms(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [roomId, room] of this.rooms.entries()) {
      if (now.getTime() - room.lastActivity.getTime() > inactiveThreshold) {
        // Notify remaining users and clean up
        room.users.forEach(user => {
          this.sendToUser(user.id, {
            type: 'notification',
            data: { type: 'room_closed', message: 'Room closed due to inactivity' },
            userId: 'system',
            roomId,
            timestamp: now
          });
          this.connections.delete(user.id);
          this.userSessions.delete(user.id);
        });
        
        this.rooms.delete(roomId);
        this.emit('roomClosed', { roomId, reason: 'inactivity' });
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
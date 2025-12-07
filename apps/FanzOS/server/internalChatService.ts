import { storage } from './storage';
import { WebSocketService, WSMessageType } from './websocketService';
import { monitoringService } from './monitoringService';
import crypto from 'crypto';

export enum InternalChatRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MODERATOR = 'moderator',
  EXTERNAL_PARTNER = 'external_partner', // For MojoHost, vendors, etc.
  DEVELOPER = 'developer',
  SUPPORT = 'support',
  MANAGER = 'manager'
}

export enum ChannelType {
  GENERAL = 'general',
  PRIVATE = 'private',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  SUPPORT = 'support',
  EXTERNAL = 'external', // For communication with external partners
  ALERTS = 'alerts'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
  ALERT = 'alert',
  CODE_SNIPPET = 'code_snippet',
  TASK = 'task'
}

export interface InternalUser {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  role: InternalChatRole;
  department: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  timezone: string;
  isExternal: boolean; // For external partners like MojoHost
  company?: string; // For external users
}

export interface InternalChannel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  department?: string;
  isPrivate: boolean;
  members: string[]; // User IDs
  admins: string[]; // User IDs who can manage the channel
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  isArchived: boolean;
  settings: {
    allowFileUploads: boolean;
    allowExternalUsers: boolean;
    requireApprovalForJoin: boolean;
    retentionDays?: number; // Auto-delete messages after X days
  };
}

export interface InternalMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  threadId?: string; // For threaded replies
  mentions: string[]; // User IDs mentioned in message
  reactions: { emoji: string; users: string[]; count: number }[];
  attachments: MessageAttachment[];
  isEdited: boolean;
  editedAt?: Date;
  timestamp: Date;
  metadata?: any; // For system messages, alerts, etc.
}

export interface MessageAttachment {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}

export interface InternalThread {
  id: string;
  channelId: string;
  parentMessageId: string;
  participants: string[];
  messageCount: number;
  lastReply: Date;
}

export interface InternalNotification {
  id: string;
  userId: string;
  type: 'mention' | 'dm' | 'channel_invite' | 'system_alert' | 'task_assigned';
  title: string;
  message: string;
  channelId?: string;
  messageId?: string;
  isRead: boolean;
  timestamp: Date;
  actionUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string; // User ID of department head
  members: string[];
  channels: string[];
  color: string; // For UI theming
}

export class InternalChatService {
  private users: Map<string, InternalUser> = new Map();
  private channels: Map<string, InternalChannel> = new Map();
  private messages: Map<string, InternalMessage[]> = new Map();
  private threads: Map<string, InternalThread> = new Map();
  private notifications: Map<string, InternalNotification[]> = new Map();
  private departments: Map<string, Department> = new Map();
  private onlineUsers: Set<string> = new Set();

  constructor(private wsService?: WebSocketService) {
    this.initializeDefaultChannels();
    this.initializeDepartments();
    this.initializeExternalPartners();
  }

  private initializeDefaultChannels(): void {
    const defaultChannels = [
      {
        name: 'general',
        description: 'General company-wide discussion',
        type: ChannelType.GENERAL,
        isPrivate: false
      },
      {
        name: 'announcements',
        description: 'Official company announcements',
        type: ChannelType.GENERAL,
        isPrivate: false
      },
      {
        name: 'tech-support',
        description: 'Technical support and troubleshooting',
        type: ChannelType.SUPPORT,
        isPrivate: false
      },
      {
        name: 'development',
        description: 'Development team discussion',
        type: ChannelType.DEPARTMENT,
        department: 'Engineering',
        isPrivate: false
      },
      {
        name: 'content-moderation',
        description: 'Content moderation team',
        type: ChannelType.DEPARTMENT,
        department: 'Moderation',
        isPrivate: true
      },
      {
        name: 'mojohost-support',
        description: 'Communication with MojoHost team',
        type: ChannelType.EXTERNAL,
        isPrivate: true
      },
      {
        name: 'security-alerts',
        description: 'Security and system alerts',
        type: ChannelType.ALERTS,
        isPrivate: true
      },
      {
        name: 'billing-support',
        description: 'Billing and finance discussions',
        type: ChannelType.DEPARTMENT,
        department: 'Finance',
        isPrivate: true
      }
    ];

    defaultChannels.forEach(channelData => {
      const channel = this.createDefaultChannel(channelData);
      this.channels.set(channel.id, channel);
      this.messages.set(channel.id, []);
    });
  }

  private initializeDepartments(): void {
    const departments = [
      {
        name: 'Engineering',
        description: 'Software development and platform engineering',
        color: '#3B82F6'
      },
      {
        name: 'Moderation',
        description: 'Content moderation and community management',
        color: '#EF4444'
      },
      {
        name: 'Finance',
        description: 'Financial operations and billing',
        color: '#10B981'
      },
      {
        name: 'Support',
        description: 'Customer and technical support',
        color: '#F59E0B'
      },
      {
        name: 'Marketing',
        description: 'Marketing and business development',
        color: '#8B5CF6'
      },
      {
        name: 'Legal',
        description: 'Legal compliance and policy',
        color: '#6B7280'
      }
    ];

    departments.forEach(deptData => {
      const dept: Department = {
        id: crypto.randomUUID(),
        name: deptData.name,
        description: deptData.description,
        head: '',
        members: [],
        channels: [],
        color: deptData.color
      };
      this.departments.set(dept.id, dept);
    });
  }

  private initializeExternalPartners(): void {
    // Add MojoHost as external partner
    const mojoHostUser: InternalUser = {
      userId: 'mojohost-support',
      username: 'mojohost',
      displayName: 'MojoHost Support',
      email: 'support@mojohost.com',
      role: InternalChatRole.EXTERNAL_PARTNER,
      department: 'External',
      status: 'offline',
      lastSeen: new Date(),
      timezone: 'America/Detroit',
      isExternal: true,
      company: 'MojoHost'
    };

    this.users.set(mojoHostUser.userId, mojoHostUser);
  }

  async addInternalUser(userData: Omit<InternalUser, 'userId' | 'lastSeen'>): Promise<InternalUser> {
    const userId = crypto.randomUUID();

    const user: InternalUser = {
      userId,
      ...userData,
      lastSeen: new Date()
    };

    this.users.set(userId, user);
    this.notifications.set(userId, []);

    // Add to appropriate department channels
    await this.addUserToDepartmentChannels(userId, userData.department);

    console.log(`Added internal user: ${user.displayName} (${user.role})`);
    monitoringService.trackBusinessMetric('internal_user_added', 1, {
      role: user.role,
      department: user.department,
      isExternal: user.isExternal
    });

    return user;
  }

  async createChannel(
    creatorId: string,
    name: string,
    description: string,
    type: ChannelType,
    options: {
      isPrivate?: boolean;
      department?: string;
      members?: string[];
      allowExternalUsers?: boolean;
    } = {}
  ): Promise<InternalChannel> {
    const channelId = crypto.randomUUID();

    const channel: InternalChannel = {
      id: channelId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      type,
      department: options.department,
      isPrivate: options.isPrivate || false,
      members: options.members || [creatorId],
      admins: [creatorId],
      createdBy: creatorId,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      isArchived: false,
      settings: {
        allowFileUploads: true,
        allowExternalUsers: options.allowExternalUsers || false,
        requireApprovalForJoin: options.isPrivate || false
      }
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);

    // Send system message
    await this.sendSystemMessage(channelId, `Channel created by ${this.users.get(creatorId)?.displayName}`);

    console.log(`Created internal channel: ${name}`);
    monitoringService.trackBusinessMetric('internal_channel_created', 1, {
      type,
      department: options.department,
      isPrivate: options.isPrivate
    });

    return channel;
  }

  async sendMessage(
    senderId: string,
    channelId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    options: {
      threadId?: string;
      attachments?: MessageAttachment[];
      mentions?: string[];
    } = {}
  ): Promise<InternalMessage> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (!channel.members.includes(senderId)) {
      throw new Error('User is not a member of this channel');
    }

    const sender = this.users.get(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    const messageId = crypto.randomUUID();
    const mentions = this.extractMentions(content, options.mentions);

    const message: InternalMessage = {
      id: messageId,
      channelId,
      senderId,
      senderName: sender.displayName,
      type,
      content,
      threadId: options.threadId,
      mentions,
      reactions: [],
      attachments: options.attachments || [],
      isEdited: false,
      timestamp: new Date()
    };

    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    this.messages.set(channelId, channelMessages);

    // Update channel
    channel.messageCount++;
    channel.lastActivity = new Date();

    // Handle thread
    if (options.threadId) {
      await this.updateThread(options.threadId, senderId);
    }

    // Send notifications for mentions
    await this.sendMentionNotifications(message);

    // Send real-time update
    if (this.wsService) {
      channel.members.forEach(memberId => {
        this.wsService?.sendToUser(memberId, {
          type: 'internal_chat_message',
          data: message
        });
      });
    }

    console.log(`Internal message sent in ${channel.name}: ${sender.displayName}`);
    monitoringService.trackBusinessMetric('internal_message_sent', 1, {
      channelType: channel.type,
      messageType: type,
      hasMentions: mentions.length > 0
    });

    return message;
  }

  async addReaction(
    userId: string,
    messageId: string,
    channelId: string,
    emoji: string
  ): Promise<void> {
    const messages = this.messages.get(channelId);
    if (!messages) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    let reaction = message.reactions.find(r => r.emoji === emoji);
    
    if (reaction) {
      if (reaction.users.includes(userId)) {
        // Remove reaction
        reaction.users = reaction.users.filter(id => id !== userId);
        reaction.count = reaction.users.length;
        
        if (reaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        reaction.users.push(userId);
        reaction.count++;
      }
    } else {
      // New reaction
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }

    // Send real-time update
    if (this.wsService) {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.members.forEach(memberId => {
          this.wsService?.sendToUser(memberId, {
            type: 'internal_chat_reaction',
            data: { messageId, emoji, userId, action: 'toggle' }
          });
        });
      }
    }
  }

  async joinChannel(userId: string, channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    const user = this.users.get(userId);
    
    if (!channel || !user) {
      throw new Error('Channel or user not found');
    }

    if (channel.members.includes(userId)) {
      return; // Already a member
    }

    // Check permissions
    if (channel.isPrivate && channel.settings.requireApprovalForJoin) {
      throw new Error('This channel requires approval to join');
    }

    if (!channel.settings.allowExternalUsers && user.isExternal) {
      throw new Error('External users are not allowed in this channel');
    }

    channel.members.push(userId);

    // Send system message
    await this.sendSystemMessage(channelId, `${user.displayName} joined the channel`);

    console.log(`${user.displayName} joined channel: ${channel.name}`);
  }

  async setUserStatus(userId: string, status: InternalUser['status']): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.status = status;
    user.lastSeen = new Date();

    if (status === 'online') {
      this.onlineUsers.add(userId);
    } else {
      this.onlineUsers.delete(userId);
    }

    // Broadcast status update
    if (this.wsService) {
      // Send to all users who share channels with this user
      const sharedUsers = this.getUsersInSharedChannels(userId);
      sharedUsers.forEach(sharedUserId => {
        this.wsService?.sendToUser(sharedUserId, {
          type: 'internal_user_status',
          data: { userId, status, lastSeen: user.lastSeen }
        });
      });
    }
  }

  async sendAlert(
    type: 'security' | 'system' | 'billing' | 'performance',
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    recipients?: string[]
  ): Promise<void> {
    const alertChannel = Array.from(this.channels.values()).find(c => c.name === 'security-alerts');
    if (!alertChannel) return;

    const alertMessage = `🚨 **${severity.toUpperCase()} ALERT**: ${title}\n\n${message}`;

    await this.sendMessage('system', alertChannel.id, alertMessage, MessageType.ALERT);

    // Send direct notifications to specific recipients if provided
    if (recipients) {
      for (const userId of recipients) {
        await this.createNotification(userId, {
          type: 'system_alert',
          title: `${severity.toUpperCase()} Alert: ${title}`,
          message,
          channelId: alertChannel.id
        });
      }
    }

    console.log(`System alert sent: ${title} (${severity})`);
    monitoringService.trackBusinessMetric('internal_alert_sent', 1, {
      type,
      severity,
      recipientCount: recipients?.length || alertChannel.members.length
    });
  }

  // Helper methods
  private createDefaultChannel(data: any): InternalChannel {
    return {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      type: data.type,
      department: data.department,
      isPrivate: data.isPrivate,
      members: [],
      admins: [],
      createdBy: 'system',
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      isArchived: false,
      settings: {
        allowFileUploads: true,
        allowExternalUsers: data.type === ChannelType.EXTERNAL,
        requireApprovalForJoin: data.isPrivate
      }
    };
  }

  private async addUserToDepartmentChannels(userId: string, department: string): Promise<void> {
    const departmentChannels = Array.from(this.channels.values()).filter(c => 
      c.department === department || c.type === ChannelType.GENERAL
    );

    for (const channel of departmentChannels) {
      if (!channel.isPrivate) {
        channel.members.push(userId);
      }
    }
  }

  private extractMentions(content: string, additionalMentions?: string[]): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const user = Array.from(this.users.values()).find(u => u.username === username);
      if (user) {
        mentions.push(user.userId);
      }
    }

    if (additionalMentions) {
      mentions.push(...additionalMentions);
    }

    return Array.from(new Set(mentions));
  }

  private async sendMentionNotifications(message: InternalMessage): Promise<void> {
    for (const mentionedUserId of message.mentions) {
      await this.createNotification(mentionedUserId, {
        type: 'mention',
        title: `Mentioned by ${message.senderName}`,
        message: message.content,
        channelId: message.channelId,
        messageId: message.id
      });
    }
  }

  private async createNotification(
    userId: string,
    notificationData: Omit<InternalNotification, 'id' | 'userId' | 'isRead' | 'timestamp'>
  ): Promise<void> {
    const notification: InternalNotification = {
      id: crypto.randomUUID(),
      userId,
      isRead: false,
      timestamp: new Date(),
      ...notificationData
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }
    
    this.notifications.set(userId, userNotifications);

    // Send real-time notification
    if (this.wsService) {
      this.wsService.sendToUser(userId, {
        type: 'internal_notification',
        data: notification
      });
    }
  }

  private async sendSystemMessage(channelId: string, content: string): Promise<void> {
    const message: InternalMessage = {
      id: crypto.randomUUID(),
      channelId,
      senderId: 'system',
      senderName: 'System',
      type: MessageType.SYSTEM,
      content,
      mentions: [],
      reactions: [],
      attachments: [],
      isEdited: false,
      timestamp: new Date()
    };

    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    this.messages.set(channelId, channelMessages);
  }

  private async updateThread(threadId: string, participantId: string): Promise<void> {
    const thread = this.threads.get(threadId);
    if (thread) {
      if (!thread.participants.includes(participantId)) {
        thread.participants.push(participantId);
      }
      thread.messageCount++;
      thread.lastReply = new Date();
    }
  }

  private getUsersInSharedChannels(userId: string): string[] {
    const sharedUsers = new Set<string>();
    
    for (const channel of this.channels.values()) {
      if (channel.members.includes(userId)) {
        channel.members.forEach(memberId => {
          if (memberId !== userId) {
            sharedUsers.add(memberId);
          }
        });
      }
    }

    return Array.from(sharedUsers);
  }

  // Getters
  getUser(userId: string): InternalUser | undefined {
    return this.users.get(userId);
  }

  getChannel(channelId: string): InternalChannel | undefined {
    return this.channels.get(channelId);
  }

  getChannelMessages(channelId: string, limit: number = 50, offset: number = 0): InternalMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit - offset, -offset || undefined).reverse();
  }

  getUserChannels(userId: string): InternalChannel[] {
    return Array.from(this.channels.values()).filter(c => c.members.includes(userId));
  }

  getUserNotifications(userId: string): InternalNotification[] {
    return this.notifications.get(userId) || [];
  }

  getOnlineUsers(): InternalUser[] {
    return Array.from(this.onlineUsers).map(id => this.users.get(id)).filter(Boolean) as InternalUser[];
  }

  getDepartments(): Department[] {
    return Array.from(this.departments.values());
  }
}

export const internalChatService = new InternalChatService();
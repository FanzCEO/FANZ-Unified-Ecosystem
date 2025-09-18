#!/usr/bin/env tsx

/**
 * 🚀 ChatSphere Demo Script
 * 
 * Comprehensive demonstration of ChatSphere real-time communication features:
 * - Real-time messaging and chat rooms
 * - Video/audio calling capabilities  
 * - Live streaming with viewer interaction
 * - Content moderation and spam detection
 * - Typing indicators and presence tracking
 * - Message reactions and replies
 * - Adult content filtering and compliance
 * - Analytics and engagement metrics
 * 
 * Usage: npm run demo
 * 
 * @author FANZ Engineering Team
 */

import ChatSphereService, { 
  ChatSphereConfig, 
  ChatRoomType, 
  MessageType,
  ParticipantStatus,
  StreamStatus,
  CallType,
  CallStatus,
  ContentFilteringLevel,
  ModerationSeverity
} from '../src/ChatSphereService';
import { v4 as uuidv4 } from 'uuid';

// Demo configuration
const demoConfig: ChatSphereConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    database: 13
  },
  websocket: {
    enabled: true,
    port: parseInt(process.env.WS_PORT || '8080'),
    maxPayload: 1024 * 1024, // 1MB
    heartbeatInterval: 30000,
    maxConnections: 10000
  },
  moderation: {
    enabled: true,
    aiProvider: 'openai',
    autoModeration: true,
    imageModeration: true,
    spamDetection: true,
    profanityFilter: true
  },
  streaming: {
    enabled: true,
    maxConcurrentStreams: 100,
    recordingEnabled: true,
    maxViewers: 10000
  },
  calls: {
    enabled: true,
    maxDuration: 3600000, // 1 hour
    recordingEnabled: false,
    p2pEnabled: true
  },
  notifications: {
    pushProvider: 'firebase',
    emailProvider: 'sendgrid',
    smsProvider: 'twilio'
  },
  analytics: {
    enabled: true,
    retentionDays: 90,
    aggregationInterval: 60000
  }
};

class ChatSphereDemo {
  private service: ChatSphereService;
  private demoUsers: string[] = [];
  private demoRooms: string[] = [];
  private demoMessages: string[] = [];

  constructor() {
    this.service = new ChatSphereService(demoConfig);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('chat_room_created', (room) => {
      console.log(`✅ Chat room created: ${room.name} (${room.id})`);
    });

    this.service.on('user_joined_room', ({ roomId, userId }) => {
      console.log(`👋 User ${userId} joined room ${roomId}`);
    });

    this.service.on('message_sent', (message) => {
      console.log(`💬 Message sent in ${message.chatRoomId}: "${message.content.text?.substring(0, 50)}..."`);
    });

    this.service.on('stream_started', (stream) => {
      console.log(`📺 Live stream started: "${stream.title}" by ${stream.streamerId}`);
    });

    this.service.on('call_initiated', (call) => {
      console.log(`📞 ${call.type} call initiated by ${call.initiatorId} with ${call.participants.length - 1} participants`);
    });

    this.service.on('presence_updated', ({ userId, status }) => {
      console.log(`👤 User ${userId} status: ${status}`);
    });
  }

  async runDemo(): Promise<void> {
    console.log('\n🚀 Starting ChatSphere Demo...\n');

    try {
      // Generate demo users
      await this.createDemoUsers();
      
      // Demo 1: Basic Chat Rooms
      await this.demoChatRooms();
      
      // Demo 2: Real-time Messaging
      await this.demoMessaging();
      
      // Demo 3: Content Moderation
      await this.demoModeration();
      
      // Demo 4: Live Streaming
      await this.demoLiveStreaming();
      
      // Demo 5: Video Calls
      await this.demoVideoCalls();
      
      // Demo 6: Presence & Typing
      await this.demoPresenceAndTyping();
      
      // Demo 7: Message Reactions
      await this.demoMessageReactions();
      
      // Demo 8: Analytics Overview
      await this.demoAnalytics();

      console.log('\n✨ ChatSphere Demo completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async createDemoUsers(): Promise<void> {
    console.log('👥 Creating demo users...');
    
    const userNames = [
      'creator_alice', 'fan_bob', 'moderator_charlie', 
      'subscriber_diana', 'vip_eve', 'guest_frank'
    ];

    for (const userName of userNames) {
      const userId = `demo_${userName}_${uuidv4().slice(0, 8)}`;
      this.demoUsers.push(userId);
      
      // Set initial presence
      await this.service.updatePresence(userId, ParticipantStatus.ONLINE);
    }
    
    console.log(`✅ Created ${this.demoUsers.length} demo users\n`);
  }

  private async demoChatRooms(): Promise<void> {
    console.log('🏠 Demo 1: Creating Chat Rooms...');
    
    // Create different types of chat rooms
    const roomTypes = [
      { type: ChatRoomType.PUBLIC_ROOM, name: 'General Chat' },
      { type: ChatRoomType.CREATOR_ROOM, name: 'Alice\'s VIP Room' },
      { type: ChatRoomType.FAN_CLUB, name: 'Elite Fans Club' },
      { type: ChatRoomType.SUPPORT_CHAT, name: 'Support Help' }
    ];

    for (const roomConfig of roomTypes) {
      const room = await this.service.createChatRoom({
        name: roomConfig.name,
        type: roomConfig.type,
        clusterId: 'demo_cluster',
        settings: {
          isPrivate: roomConfig.type === ChatRoomType.CREATOR_ROOM,
          requireApproval: roomConfig.type === ChatRoomType.FAN_CLUB,
          allowInvites: true,
          maxParticipants: roomConfig.type === ChatRoomType.CREATOR_ROOM ? 50 : undefined,
          contentFiltering: ContentFilteringLevel.MEDIUM,
          allowVoiceCalls: true,
          allowVideoCalls: true,
          allowLiveStreaming: roomConfig.type === ChatRoomType.CREATOR_ROOM,
          allowScreenSharing: false,
          allowFileSharing: true,
          maxFileSize: 10 * 1024 * 1024,
          messageRetention: 'one_year' as any
        }
      }, this.demoUsers[0]);
      
      this.demoRooms.push(room.id);
      
      // Add some users to each room
      for (let i = 1; i < Math.min(4, this.demoUsers.length); i++) {
        await this.service.joinChatRoom(room.id, this.demoUsers[i]);
        await this.sleep(100);
      }
    }
    
    console.log('✅ Chat rooms created and populated\n');
  }

  private async demoMessaging(): Promise<void> {
    console.log('💬 Demo 2: Real-time Messaging...');
    
    const roomId = this.demoRooms[0];
    const messages = [
      { sender: 0, text: 'Hello everyone! Welcome to the general chat! 🎉' },
      { sender: 1, text: 'Hey Alice! Thanks for creating this space!' },
      { sender: 2, text: 'Great to be here! Looking forward to chatting with everyone.' },
      { sender: 3, text: 'This is awesome! The real-time features are so smooth! ⚡' },
      { sender: 1, text: 'Can we share some media files here?' },
      { sender: 0, text: 'Absolutely! Feel free to share images, videos, and more!' }
    ];

    for (const msg of messages) {
      const message = await this.service.sendMessage(
        roomId, 
        this.demoUsers[msg.sender], 
        { text: msg.text }
      );
      
      this.demoMessages.push(message.id);
      await this.sleep(500);
    }
    
    console.log('✅ Demo messages sent\n');
  }

  private async demoModeration(): Promise<void> {
    console.log('🛡️ Demo 3: Content Moderation...');
    
    const roomId = this.demoRooms[0];
    
    // Test various moderation scenarios
    const moderationTests = [
      { text: 'This is a perfectly normal message', shouldPass: true },
      { text: 'SPAM SPAM SPAM SPAM SPAM!!!', shouldPass: false },
      { text: 'Check out this link: http://example.com http://another.com http://third.com', shouldPass: false },
      { text: 'HELLO THIS IS WRITTEN IN ALL CAPS FOR NO REASON!!!', shouldPass: false },
      { text: 'This message has repeated characters: aaaaaaaaaa', shouldPass: false }
    ];

    for (const test of moderationTests) {
      try {
        console.log(`Testing: "${test.text.substring(0, 30)}..."`);
        
        const message = await this.service.sendMessage(
          roomId,
          this.demoUsers[1],
          { text: test.text }
        );
        
        if (test.shouldPass) {
          console.log(`  ✅ Message passed moderation (Score: ${message.moderation?.score})`);
        } else {
          console.log(`  ⚠️  Message flagged but not blocked (Score: ${message.moderation?.score})`);
        }
        
      } catch (error) {
        if (!test.shouldPass) {
          console.log(`  🚫 Message correctly blocked by moderation`);
        } else {
          console.log(`  ❌ Message incorrectly blocked: ${error.message}`);
        }
      }
      
      await this.sleep(300);
    }
    
    console.log('✅ Moderation demo completed\n');
  }

  private async demoLiveStreaming(): Promise<void> {
    console.log('📺 Demo 4: Live Streaming...');
    
    const roomId = this.demoRooms[1]; // Creator room
    const streamerId = this.demoUsers[0]; // Alice
    
    // Start a live stream
    const stream = await this.service.startLiveStream(streamerId, roomId, {
      title: 'Alice\'s Live Show - Special Performance! 🎭',
      description: 'Join me for an exclusive live performance with interactive chat!',
      category: 'Entertainment',
      tags: ['live', 'exclusive', 'interactive'],
      settings: {
        isPrivate: false,
        requireSubscription: true,
        maxViewers: 100,
        allowComments: true,
        allowReactions: true,
        allowTips: true,
        moderationEnabled: true,
        recordingEnabled: true,
        quality: 'high' as any,
        latencyMode: 'low' as any
      }
    });

    console.log(`📡 Stream started: "${stream.title}"`);
    
    // Simulate viewers joining
    const viewerIds = this.demoUsers.slice(1, 4);
    for (const viewerId of viewerIds) {
      await this.service.joinStream(stream.id, viewerId);
      console.log(`👀 Viewer ${viewerId.split('_')[1]} joined the stream`);
      await this.sleep(500);
    }

    // Simulate stream interaction
    await this.sleep(2000);
    console.log('💰 Simulating tips and interactions...');
    
    // Stream analytics would show engagement
    console.log(`📊 Current viewers: ${stream.viewers.length}`);
    console.log(`🔥 Peak viewers: ${stream.analytics.peakViewers}`);
    
    // End the stream
    await this.service.endStream(stream.id, streamerId);
    console.log('✅ Live stream demo completed\n');
  }

  private async demoVideoCalls(): Promise<void> {
    console.log('📞 Demo 5: Video Calls...');
    
    const initiatorId = this.demoUsers[0];
    const targetIds = this.demoUsers.slice(1, 3);
    
    // Initiate a group video call
    const call = await this.service.initiateCall(
      initiatorId,
      targetIds,
      CallType.GROUP_VIDEO,
      this.demoRooms[0]
    );

    console.log(`📹 Group video call initiated with ${call.participants.length} participants`);
    
    // Simulate participants joining
    for (const targetId of targetIds) {
      await this.sleep(1000);
      await this.service.joinCall(call.id, targetId);
      console.log(`✅ ${targetId.split('_')[1]} joined the call`);
    }

    console.log('🎥 Call is now active with all participants');
    
    // Simulate call duration
    await this.sleep(3000);
    
    // End the call
    await this.service.endCall(call.id, initiatorId);
    console.log('✅ Video call demo completed\n');
  }

  private async demoPresenceAndTyping(): Promise<void> {
    console.log('👤 Demo 6: Presence & Typing Indicators...');
    
    const userId = this.demoUsers[1];
    const roomId = this.demoRooms[0];
    
    // Update presence statuses
    const statuses = [ParticipantStatus.ONLINE, ParticipantStatus.BUSY, ParticipantStatus.AWAY];
    
    for (const status of statuses) {
      await this.service.updatePresence(userId, status, `I'm currently ${status}`);
      await this.sleep(500);
    }

    // Demonstrate typing indicators
    console.log('⌨️  Simulating typing indicators...');
    
    await this.service.setTyping(userId, roomId, true);
    console.log('💭 User is typing...');
    
    await this.sleep(2000);
    
    await this.service.setTyping(userId, roomId, false);
    console.log('⏸️  User stopped typing');
    
    // Send the message they were typing
    await this.service.sendMessage(roomId, userId, {
      text: 'Sorry for the typing delay - was thinking of the perfect message! 😄'
    });
    
    console.log('✅ Presence and typing demo completed\n');
  }

  private async demoMessageReactions(): Promise<void> {
    console.log('😍 Demo 7: Message Reactions...');
    
    if (this.demoMessages.length === 0) {
      console.log('⏭️  Skipping reactions demo - no messages available');
      return;
    }

    const messageId = this.demoMessages[0];
    const emojis = ['👍', '❤️', '😂', '🔥', '👏'];
    
    // Add reactions from different users
    for (let i = 0; i < Math.min(emojis.length, this.demoUsers.length); i++) {
      const emoji = emojis[i];
      const userId = this.demoUsers[i];
      
      await this.service.addReaction(messageId, userId, emoji);
      console.log(`${emoji} Reaction added by ${userId.split('_')[1]}`);
      await this.sleep(300);
    }
    
    console.log('✅ Message reactions demo completed\n');
  }

  private async demoAnalytics(): Promise<void> {
    console.log('📊 Demo 8: Analytics Overview...');
    
    // Get analytics for the first room
    if (this.demoRooms.length > 0) {
      const roomId = this.demoRooms[0];
      const room = await this.service.getChatRoom(roomId);
      
      if (room) {
        console.log('📈 Room Analytics:');
        console.log(`  💬 Total Messages: ${room.analytics.totalMessages}`);
        console.log(`  👥 Total Participants: ${room.analytics.totalParticipants}`);
        console.log(`  🟢 Active Participants: ${room.analytics.activeParticipants}`);
        console.log(`  📊 Peak Concurrent Users: ${room.analytics.peakConcurrentUsers}`);
        console.log(`  ❤️  Total Reactions: ${room.analytics.engagementMetrics.reactionCount}`);
        
        // Message type breakdown
        console.log('  📝 Messages by Type:');
        Object.entries(room.analytics.messagesByType).forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });
      }
    }
    
    console.log('✅ Analytics demo completed\n');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up demo data...');
    
    // In a real implementation, we would:
    // - Archive demo messages
    // - Clean up temporary data
    // - Close WebSocket connections
    // - Update final analytics
    
    console.log('✅ Cleanup completed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  const demo = new ChatSphereDemo();
  
  demo.runDemo().catch((error) => {
    console.error('💥 Demo crashed:', error);
    process.exit(1);
  });
}

export default ChatSphereDemo;
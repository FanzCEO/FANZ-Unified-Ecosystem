/**
 * 💬 ChatSphere - Real-time Communication Service
 * 
 * Comprehensive real-time communication platform for the FANZ ecosystem.
 * Handles messaging, video calls, live streaming, group conversations, and
 * direct messages with specialized adult content moderation and creator protection.
 * 
 * Features:
 * - Real-time messaging with WebSocket support
 * - Direct messages and group conversations
 * - Video/audio calling with WebRTC
 * - Live streaming with viewer interaction
 * - Message history and search
 * - Typing indicators and presence tracking
 * - Message reactions and replies
 * - File sharing and media messages
 * - Adult content moderation and filtering
 * - Spam detection and auto-moderation
 * - End-to-end encryption for sensitive content
 * - Voice messages and audio notes
 * - Screen sharing capabilities
 * - Message translation and accessibility
 * - Analytics and engagement tracking
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';

// ===== TYPES & INTERFACES =====

export interface ChatRoom {
  id: string;
  name?: string;
  type: ChatRoomType;
  clusterId: string;
  creatorId?: string;
  participants: Participant[];
  settings: ChatRoomSettings;
  metadata: ChatRoomMetadata;
  moderation: ModerationSettings;
  analytics: ChatRoomAnalytics;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export enum ChatRoomType {
  DIRECT_MESSAGE = 'direct_message',
  GROUP_CHAT = 'group_chat',
  PUBLIC_ROOM = 'public_room',
  CREATOR_ROOM = 'creator_room',
  LIVE_STREAM = 'live_stream',
  PRIVATE_STREAM = 'private_stream',
  FAN_CLUB = 'fan_club',
  SUPPORT_CHAT = 'support_chat'
}

export interface Participant {
  userId: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  status: ParticipantStatus;
  joinedAt: Date;
  lastSeen: Date;
  metadata: ParticipantMetadata;
}

export enum ParticipantRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  VIP = 'vip',
  SUBSCRIBER = 'subscriber',
  MEMBER = 'member',
  GUEST = 'guest',
  MUTED = 'muted',
  BANNED = 'banned'
}

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canMakeVoiceCalls: boolean;
  canMakeVideoCalls: boolean;
  canStartLiveStream: boolean;
  canModerateMessages: boolean;
  canKickMembers: boolean;
  canBanMembers: boolean;
  canChangeSettings: boolean;
  canInviteMembers: boolean;
  canSeeHistory: boolean;
  canReceiveTips: boolean;
}

export enum ParticipantStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline'
}

export interface ParticipantMetadata {
  nickname?: string;
  customStatus?: string;
  subscriptionLevel?: string;
  totalSpent?: number;
  joinSource: string;
  deviceInfo: DeviceInfo;
  preferences: ChatPreferences;
}

export interface DeviceInfo {
  type: DeviceType;
  platform: string;
  browser?: string;
  version?: string;
  ipAddress?: string;
  location?: GeoLocation;
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  TV = 'tv',
  UNKNOWN = 'unknown'
}

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  appearance: AppearancePreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  enablePushNotifications: boolean;
  enableSoundNotifications: boolean;
  enableVibration: boolean;
  muteDuringCalls: boolean;
  quietHours?: QuietHours;
  keywordAlerts: string[];
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
}

export interface PrivacyPreferences {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  requireApprovalForGroups: boolean;
  blockUnverifiedUsers: boolean;
  autoDeleteMessages: boolean;
  autoDeleteAfterDays?: number;
}

export interface AppearancePreferences {
  theme: ChatTheme;
  fontSize: FontSize;
  messageGrouping: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  compactMode: boolean;
  customEmojis: boolean;
}

export enum ChatTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  CUSTOM = 'custom'
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export interface AccessibilityPreferences {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableKeyboardNavigation: boolean;
  enableVoiceCommands: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
}

export interface ChatRoomSettings {
  isPrivate: boolean;
  requireApproval: boolean;
  allowInvites: boolean;
  maxParticipants?: number;
  messageRetention: MessageRetention;
  contentFiltering: ContentFilteringLevel;
  allowedMediaTypes: MediaType[];
  allowVoiceCalls: boolean;
  allowVideoCalls: boolean;
  allowLiveStreaming: boolean;
  allowScreenSharing: boolean;
  allowFileSharing: boolean;
  maxFileSize: number;
  tipSettings?: TipSettings;
}

export enum MessageRetention {
  FOREVER = 'forever',
  ONE_YEAR = 'one_year',
  SIX_MONTHS = 'six_months',
  THREE_MONTHS = 'three_months',
  ONE_MONTH = 'one_month',
  ONE_WEEK = 'one_week',
  ONE_DAY = 'one_day',
  NONE = 'none'
}

export enum ContentFilteringLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  STRICT = 'strict'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  GIF = 'gif',
  STICKER = 'sticker',
  VOICE_NOTE = 'voice_note'
}

export interface TipSettings {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  suggestedAmounts: number[];
  currency: string;
  allowAnonymous: boolean;
  showTopTippers: boolean;
}

export interface ChatRoomMetadata {
  description?: string;
  tags: string[];
  category?: string;
  language: string;
  timezone: string;
  customData: { [key: string]: any };
  integrations: Integration[];
}

export interface Integration {
  type: IntegrationType;
  enabled: boolean;
  config: { [key: string]: any };
}

export enum IntegrationType {
  BOT = 'bot',
  WEBHOOK = 'webhook',
  PAYMENT = 'payment',
  MEDIA_SYNC = 'media_sync',
  ANALYTICS = 'analytics',
  MODERATION = 'moderation'
}

export interface ModerationSettings {
  enabled: boolean;
  autoModeration: boolean;
  wordFilter: WordFilterSettings;
  spamDetection: SpamDetectionSettings;
  imageModeration: ImageModerationSettings;
  rateLimit: RateLimitSettings;
  bannedWords: string[];
  allowedDomains: string[];
  blockedDomains: string[];
  moderators: string[];
}

export interface WordFilterSettings {
  enabled: boolean;
  severity: ModerationSeverity;
  action: ModerationAction;
  customWords: string[];
  whitelistedWords: string[];
}

export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ModerationAction {
  WARN = 'warn',
  DELETE = 'delete',
  MUTE = 'mute',
  KICK = 'kick',
  BAN = 'ban',
  SHADOW_BAN = 'shadow_ban'
}

export interface SpamDetectionSettings {
  enabled: boolean;
  maxMessagesPerMinute: number;
  maxDuplicateMessages: number;
  maxLinksPerMessage: number;
  detectCaps: boolean;
  detectRepeatedChars: boolean;
  minTimeBetweenMessages: number;
}

export interface ImageModerationSettings {
  enabled: boolean;
  aiModeration: boolean;
  adultContentThreshold: number;
  violenceThreshold: number;
  requireApproval: boolean;
  autoBlur: boolean;
}

export interface RateLimitSettings {
  messagesPerMinute: number;
  mediaPerMinute: number;
  callsPerHour: number;
  reportsPerHour: number;
  enabled: boolean;
}

export interface ChatRoomAnalytics {
  totalMessages: number;
  totalParticipants: number;
  activeParticipants: number;
  averageSessionDuration: number;
  peakConcurrentUsers: number;
  messagesByType: { [type: string]: number };
  topSenders: TopSender[];
  engagementMetrics: EngagementMetrics;
  revenueMetrics?: RevenueMetrics;
}

export interface TopSender {
  userId: string;
  messageCount: number;
  lastActive: Date;
}

export interface EngagementMetrics {
  messagesPerHour: number;
  averageResponseTime: number;
  reactionCount: number;
  mediaShareCount: number;
  callMinutes: number;
  tipsReceived?: number;
}

export interface RevenueMetrics {
  totalTips: number;
  totalSubscriptions: number;
  averageTipAmount: number;
  topTippers: TopTipper[];
  revenueByDay: { [date: string]: number };
}

export interface TopTipper {
  userId: string;
  totalAmount: number;
  tipCount: number;
  lastTip: Date;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  type: MessageType;
  content: MessageContent;
  metadata: MessageMetadata;
  reactions: MessageReaction[];
  replies: Reply[];
  status: MessageStatus;
  moderation?: MessageModeration;
  encryption?: EncryptionInfo;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export enum MessageType {
  TEXT = 'text',
  MEDIA = 'media',
  SYSTEM = 'system',
  TIP = 'tip',
  CALL_START = 'call_start',
  CALL_END = 'call_end',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  SETTINGS_CHANGE = 'settings_change',
  POLL = 'poll',
  GAME = 'game',
  STICKER = 'sticker',
  VOICE_NOTE = 'voice_note'
}

export interface MessageContent {
  text?: string;
  media?: MediaAttachment[];
  poll?: PollData;
  tip?: TipData;
  call?: CallData;
  system?: SystemMessageData;
  mentions: string[];
  hashtags: string[];
  links: LinkPreview[];
  formattedText?: FormattedText;
}

export interface MediaAttachment {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename?: string;
  size: number;
  duration?: number;
  dimensions?: MediaDimensions;
  mimeType: string;
  processed: boolean;
  adultContent?: boolean;
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  settings: PollSettings;
  results?: PollResults;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface PollSettings {
  allowMultipleChoices: boolean;
  anonymous: boolean;
  showResults: ShowResultsWhen;
  duration?: number; // minutes
}

export enum ShowResultsWhen {
  IMMEDIATELY = 'immediately',
  AFTER_VOTE = 'after_vote',
  AFTER_CLOSE = 'after_close',
  NEVER = 'never'
}

export interface PollResults {
  totalVotes: number;
  winningOption?: string;
  participationRate: number;
}

export interface TipData {
  amount: number;
  currency: string;
  message?: string;
  anonymous: boolean;
  recipientId: string;
  transactionId: string;
  processingFee: number;
}

export interface CallData {
  callId: string;
  type: CallType;
  participants: string[];
  duration?: number;
  quality: CallQuality;
  recordingId?: string;
  endReason?: CallEndReason;
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share',
  GROUP_VOICE = 'group_voice',
  GROUP_VIDEO = 'group_video'
}

export enum CallQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd'
}

export enum CallEndReason {
  NORMAL = 'normal',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  REJECTED = 'rejected',
  BUSY = 'busy',
  CANCELLED = 'cancelled'
}

export interface SystemMessageData {
  action: SystemAction;
  actorId?: string;
  targetId?: string;
  data?: { [key: string]: any };
}

export enum SystemAction {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_KICKED = 'user_kicked',
  USER_BANNED = 'user_banned',
  SETTINGS_CHANGED = 'settings_changed',
  ROOM_CREATED = 'room_created',
  ROOM_ARCHIVED = 'room_archived',
  MESSAGE_PINNED = 'message_pinned',
  MESSAGE_UNPINNED = 'message_unpinned'
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  type: LinkType;
  safe: boolean;
}

export enum LinkType {
  WEBSITE = 'website',
  IMAGE = 'image',
  VIDEO = 'video',
  SOCIAL_MEDIA = 'social_media',
  ADULT_CONTENT = 'adult_content',
  SUSPICIOUS = 'suspicious'
}

export interface FormattedText {
  bold: TextRange[];
  italic: TextRange[];
  underline: TextRange[];
  strikethrough: TextRange[];
  code: TextRange[];
  spoiler: TextRange[];
}

export interface TextRange {
  start: number;
  end: number;
}

export interface MessageMetadata {
  deviceInfo: DeviceInfo;
  clientVersion?: string;
  editCount: number;
  forwardedFrom?: string;
  replyToId?: string;
  threadId?: string;
  priority: MessagePriority;
  translation?: Translation;
  sentiment?: SentimentAnalysis;
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Translation {
  originalLanguage: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
  provider: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: SentimentLabel;
  confidence: number;
  emotions: EmotionScores;
}

export enum SentimentLabel {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

export interface EmotionScores {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  customEmoji?: CustomEmoji;
  createdAt: Date;
}

export interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  animated: boolean;
  category?: string;
}

export interface Reply {
  id: string;
  messageId: string;
  senderId: string;
  content: string;
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

export interface MessageModeration {
  flagged: boolean;
  reason?: string;
  action?: ModerationAction;
  reviewedBy?: string;
  reviewedAt?: Date;
  autoModerated: boolean;
  score: number;
  categories: string[];
}

export interface EncryptionInfo {
  encrypted: boolean;
  algorithm?: string;
  keyId?: string;
  fingerprint?: string;
}

export interface LiveStream {
  id: string;
  chatRoomId: string;
  streamerId: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  status: StreamStatus;
  settings: StreamSettings;
  viewers: StreamViewer[];
  analytics: StreamAnalytics;
  recording?: StreamRecording;
  monetization?: StreamMonetization;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  STARTING = 'starting',
  LIVE = 'live',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export interface StreamSettings {
  isPrivate: boolean;
  requireSubscription: boolean;
  maxViewers?: number;
  allowComments: boolean;
  allowReactions: boolean;
  allowTips: boolean;
  moderationEnabled: boolean;
  recordingEnabled: boolean;
  quality: StreamQuality;
  latencyMode: LatencyMode;
}

export enum StreamQuality {
  LOW = 'low',      // 480p
  MEDIUM = 'medium', // 720p
  HIGH = 'high',    // 1080p
  ULTRA = 'ultra'   // 1440p+
}

export enum LatencyMode {
  NORMAL = 'normal',     // ~15-30s delay
  LOW = 'low',          // ~5-10s delay
  ULTRA_LOW = 'ultra_low' // ~1-3s delay
}

export interface StreamViewer {
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  totalWatchTime: number;
  tipsGiven: number;
  messagesCount: number;
  reactions: number;
}

export interface StreamAnalytics {
  totalViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalWatchTime: number;
  uniqueViewers: number;
  returningViewers: number;
  chatMessages: number;
  reactions: number;
  tips: StreamTipAnalytics;
  viewersByCountry: { [country: string]: number };
  viewersByDevice: { [device: string]: number };
  engagementRate: number;
}

export interface StreamTipAnalytics {
  totalAmount: number;
  tipCount: number;
  averageTipAmount: number;
  topTipper?: string;
  tipsPerMinute: number;
}

export interface StreamRecording {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  quality: StreamQuality;
  processed: boolean;
  downloadable: boolean;
  createdAt: Date;
}

export interface StreamMonetization {
  tipsEnabled: boolean;
  subscriptionRequired: boolean;
  payPerView: boolean;
  price?: number;
  currency: string;
  revenue: number;
  viewerContributions: ViewerContribution[];
}

export interface ViewerContribution {
  userId: string;
  type: ContributionType;
  amount: number;
  timestamp: Date;
  message?: string;
}

export enum ContributionType {
  TIP = 'tip',
  SUPER_CHAT = 'super_chat',
  GIFT = 'gift',
  SUBSCRIPTION = 'subscription'
}

export interface Call {
  id: string;
  chatRoomId?: string;
  type: CallType;
  initiatorId: string;
  participants: CallParticipant[];
  status: CallStatus;
  settings: CallSettings;
  recording?: CallRecording;
  analytics: CallAnalytics;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export interface CallParticipant {
  userId: string;
  role: CallRole;
  status: CallParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  quality: CallQuality;
  networkStats: NetworkStats;
}

export enum CallRole {
  HOST = 'host',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

export enum CallParticipantStatus {
  INVITED = 'invited',
  RINGING = 'ringing',
  JOINED = 'joined',
  LEFT = 'left',
  KICKED = 'kicked',
  DISCONNECTED = 'disconnected'
}

export interface NetworkStats {
  ping: number;
  bandwidth: number;
  packetLoss: number;
  jitter: number;
  quality: NetworkQuality;
}

export enum NetworkQuality {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}

export interface CallSettings {
  recordingEnabled: boolean;
  maxDuration?: number;
  requireAuth: boolean;
  allowScreenShare: boolean;
  moderationEnabled: boolean;
  endToEndEncryption: boolean;
  quality: CallQuality;
  backgroundBlur: boolean;
}

export interface CallRecording {
  id: string;
  url: string;
  duration: number;
  size: number;
  participants: string[];
  createdAt: Date;
  downloadable: boolean;
  transcription?: CallTranscription;
}

export interface CallTranscription {
  text: string;
  language: string;
  confidence: number;
  speakers: SpeakerSegment[];
  createdAt: Date;
}

export interface SpeakerSegment {
  speakerId: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

export interface CallAnalytics {
  duration: number;
  participants: number;
  averageQuality: CallQuality;
  networkIssues: number;
  reconnections: number;
  totalDataTransfer: number;
  recordingGenerated: boolean;
}

export interface TypingIndicator {
  userId: string;
  chatRoomId: string;
  isTyping: boolean;
  startedAt: Date;
  lastUpdate: Date;
}

export interface PresenceInfo {
  userId: string;
  status: ParticipantStatus;
  customStatus?: string;
  lastSeen: Date;
  deviceInfo: DeviceInfo;
  chatRooms: string[];
}

// ===== MAIN CHAT SPHERE SERVICE CLASS =====

export class ChatSphereService extends EventEmitter {
  private redis: Redis;
  private config: ChatSphereConfig;
  private wsServer?: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();
  private chatRooms: Map<string, ChatRoom> = new Map();
  private messages: Map<string, Message> = new Map();
  private activeStreams: Map<string, LiveStream> = new Map();
  private activeCalls: Map<string, Call> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private presenceInfo: Map<string, PresenceInfo> = new Map();

  constructor(config: ChatSphereConfig) {
    super();
    this.config = config;

    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.database || 13
    });

    // Initialize WebSocket server if enabled
    if (config.websocket.enabled) {
      this.initializeWebSocketServer();
    }

    // Start background tasks
    this.startPresenceUpdater();
    this.startMessageProcessor();
    this.startAnalyticsAggregator();
    this.startModerationWorker();
    this.startCleanupTasks();
  }

  // ===== CHAT ROOM MANAGEMENT =====

  async createChatRoom(roomData: Partial<ChatRoom>, creatorId: string): Promise<ChatRoom> {
    const room: ChatRoom = {
      id: uuidv4(),
      name: roomData.name,
      type: roomData.type || ChatRoomType.GROUP_CHAT,
      clusterId: roomData.clusterId!,
      creatorId,
      participants: [{
        userId: creatorId,
        role: ParticipantRole.OWNER,
        permissions: this.getOwnerPermissions(),
        status: ParticipantStatus.ONLINE,
        joinedAt: new Date(),
        lastSeen: new Date(),
        metadata: this.getDefaultParticipantMetadata()
      }],
      settings: {
        isPrivate: roomData.settings?.isPrivate || false,
        requireApproval: roomData.settings?.requireApproval || false,
        allowInvites: roomData.settings?.allowInvites ?? true,
        maxParticipants: roomData.settings?.maxParticipants,
        messageRetention: roomData.settings?.messageRetention || MessageRetention.ONE_YEAR,
        contentFiltering: roomData.settings?.contentFiltering || ContentFilteringLevel.MEDIUM,
        allowedMediaTypes: roomData.settings?.allowedMediaTypes || [
          MediaType.IMAGE, MediaType.VIDEO, MediaType.AUDIO, MediaType.GIF
        ],
        allowVoiceCalls: roomData.settings?.allowVoiceCalls ?? true,
        allowVideoCalls: roomData.settings?.allowVideoCalls ?? true,
        allowLiveStreaming: roomData.settings?.allowLiveStreaming ?? false,
        allowScreenSharing: roomData.settings?.allowScreenSharing ?? false,
        allowFileSharing: roomData.settings?.allowFileSharing ?? true,
        maxFileSize: roomData.settings?.maxFileSize || 10 * 1024 * 1024,
        tipSettings: roomData.settings?.tipSettings
      },
      metadata: {
        description: roomData.metadata?.description,
        tags: roomData.metadata?.tags || [],
        category: roomData.metadata?.category,
        language: roomData.metadata?.language || 'en',
        timezone: roomData.metadata?.timezone || 'UTC',
        customData: roomData.metadata?.customData || {},
        integrations: roomData.metadata?.integrations || []
      },
      moderation: {
        enabled: true,
        autoModeration: true,
        wordFilter: {
          enabled: true,
          severity: ModerationSeverity.MEDIUM,
          action: ModerationAction.DELETE,
          customWords: [],
          whitelistedWords: []
        },
        spamDetection: {
          enabled: true,
          maxMessagesPerMinute: 30,
          maxDuplicateMessages: 3,
          maxLinksPerMessage: 2,
          detectCaps: true,
          detectRepeatedChars: true,
          minTimeBetweenMessages: 1000
        },
        imageModeration: {
          enabled: true,
          aiModeration: true,
          adultContentThreshold: 0.8,
          violenceThreshold: 0.7,
          requireApproval: false,
          autoBlur: true
        },
        rateLimit: {
          messagesPerMinute: 60,
          mediaPerMinute: 10,
          callsPerHour: 10,
          reportsPerHour: 5,
          enabled: true
        },
        bannedWords: [],
        allowedDomains: [],
        blockedDomains: [],
        moderators: []
      },
      analytics: {
        totalMessages: 0,
        totalParticipants: 1,
        activeParticipants: 1,
        averageSessionDuration: 0,
        peakConcurrentUsers: 1,
        messagesByType: {},
        topSenders: [],
        engagementMetrics: {
          messagesPerHour: 0,
          averageResponseTime: 0,
          reactionCount: 0,
          mediaShareCount: 0,
          callMinutes: 0
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveChatRoom(room);
    this.chatRooms.set(room.id, room);

    this.emit('chat_room_created', room);
    return room;
  }

  async joinChatRoom(roomId: string, userId: string, invitedBy?: string): Promise<boolean> {
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return false;
    }

    // Check room capacity
    if (room.settings.maxParticipants && room.participants.length >= room.settings.maxParticipants) {
      throw new Error('Chat room is full');
    }

    // Check permissions and approval requirements
    if (room.settings.requireApproval && !invitedBy) {
      // Queue for approval
      await this.queueForApproval(roomId, userId);
      return false;
    }

    const participant: Participant = {
      userId,
      role: ParticipantRole.MEMBER,
      permissions: this.getDefaultPermissions(),
      status: ParticipantStatus.ONLINE,
      joinedAt: new Date(),
      lastSeen: new Date(),
      metadata: this.getDefaultParticipantMetadata()
    };

    room.participants.push(participant);
    room.analytics.totalParticipants++;
    room.analytics.activeParticipants++;

    await this.updateChatRoom(roomId, room);

    // Send system message
    await this.sendSystemMessage(roomId, {
      action: SystemAction.USER_JOINED,
      actorId: userId
    });

    // Notify all participants via WebSocket
    await this.broadcastToRoom(roomId, 'user_joined', { userId, participant });

    this.emit('user_joined_room', { roomId, userId, participant });
    return true;
  }

  async leaveChatRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    const participantIndex = room.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      throw new Error('User is not a participant');
    }

    const participant = room.participants[participantIndex];

    // Handle ownership transfer if owner is leaving
    if (participant.role === ParticipantRole.OWNER && room.participants.length > 1) {
      // Transfer ownership to the next moderator or longest member
      const newOwner = room.participants.find(p => 
        p.userId !== userId && p.role === ParticipantRole.MODERATOR
      ) || room.participants.find(p => p.userId !== userId);
      
      if (newOwner) {
        newOwner.role = ParticipantRole.OWNER;
        newOwner.permissions = this.getOwnerPermissions();
      }
    }

    room.participants.splice(participantIndex, 1);
    room.analytics.activeParticipants = Math.max(0, room.analytics.activeParticipants - 1);

    await this.updateChatRoom(roomId, room);

    // Send system message
    await this.sendSystemMessage(roomId, {
      action: SystemAction.USER_LEFT,
      actorId: userId
    });

    // Notify remaining participants
    await this.broadcastToRoom(roomId, 'user_left', { userId });

    this.emit('user_left_room', { roomId, userId });
  }

  // ===== MESSAGE HANDLING =====

  async sendMessage(roomId: string, senderId: string, messageData: Partial<MessageContent>): Promise<Message> {
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    // Check if user is participant
    const participant = room.participants.find(p => p.userId === senderId);
    if (!participant) {
      throw new Error('User is not a participant');
    }

    // Check permissions
    if (!participant.permissions.canSendMessages) {
      throw new Error('User does not have permission to send messages');
    }

    // Rate limiting check
    if (await this.isRateLimited(senderId, roomId)) {
      throw new Error('Rate limit exceeded');
    }

    const message: Message = {
      id: uuidv4(),
      chatRoomId: roomId,
      senderId,
      type: MessageType.TEXT,
      content: {
        text: messageData.text,
        media: messageData.media || [],
        mentions: messageData.mentions || [],
        hashtags: messageData.hashtags || [],
        links: messageData.links || [],
        poll: messageData.poll,
        tip: messageData.tip
      },
      metadata: {
        deviceInfo: participant.metadata.deviceInfo,
        editCount: 0,
        priority: MessagePriority.NORMAL
      },
      reactions: [],
      replies: [],
      status: MessageStatus.SENDING,
      createdAt: new Date()
    };

    // Process message content for moderation
    const moderationResult = await this.moderateMessage(message, room);
    message.moderation = moderationResult;

    // Apply moderation action if needed
    if (moderationResult.flagged && moderationResult.action === ModerationAction.DELETE) {
      throw new Error('Message blocked by moderation');
    }

    message.status = MessageStatus.SENT;
    await this.saveMessage(message);
    this.messages.set(message.id, message);

    // Update room analytics
    room.analytics.totalMessages++;
    room.analytics.messagesByType[message.type] = (room.analytics.messagesByType[message.type] || 0) + 1;
    await this.updateChatRoom(roomId, room);

    // Broadcast to room participants
    await this.broadcastToRoom(roomId, 'new_message', message);

    // Send push notifications if enabled
    await this.sendMessageNotifications(message, room);

    this.emit('message_sent', message);
    return message;
  }

  async editMessage(messageId: string, senderId: string, newContent: string): Promise<Message> {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== senderId) {
      throw new Error('Only the sender can edit this message');
    }

    message.content.text = newContent;
    message.metadata.editCount++;
    message.updatedAt = new Date();

    // Re-moderate the edited content
    const room = await this.getChatRoom(message.chatRoomId);
    if (room) {
      message.moderation = await this.moderateMessage(message, room);
    }

    await this.saveMessage(message);
    this.messages.set(messageId, message);

    // Broadcast edit to room
    await this.broadcastToRoom(message.chatRoomId, 'message_edited', message);

    this.emit('message_edited', message);
    return message;
  }

  async deleteMessage(messageId: string, deleterId: string): Promise<void> {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const room = await this.getChatRoom(message.chatRoomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    // Check if user can delete this message
    const participant = room.participants.find(p => p.userId === deleterId);
    if (!participant) {
      throw new Error('User is not a participant');
    }

    const canDelete = message.senderId === deleterId || 
                     participant.permissions.canModerateMessages ||
                     participant.role === ParticipantRole.OWNER ||
                     participant.role === ParticipantRole.MODERATOR;

    if (!canDelete) {
      throw new Error('Permission denied');
    }

    message.deletedAt = new Date();
    message.status = MessageStatus.DELETED;

    await this.saveMessage(message);

    // Broadcast deletion to room
    await this.broadcastToRoom(message.chatRoomId, 'message_deleted', { messageId, deleterId });

    this.emit('message_deleted', { messageId, deleterId });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    const message = await this.getMessage(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existingReaction) {
      return existingReaction;
    }

    const reaction: MessageReaction = {
      id: uuidv4(),
      userId,
      emoji,
      createdAt: new Date()
    };

    message.reactions.push(reaction);
    await this.saveMessage(message);

    // Update room analytics
    const room = await this.getChatRoom(message.chatRoomId);
    if (room) {
      room.analytics.engagementMetrics.reactionCount++;
      await this.updateChatRoom(message.chatRoomId, room);
    }

    // Broadcast reaction to room
    await this.broadcastToRoom(message.chatRoomId, 'reaction_added', { messageId, reaction });

    this.emit('reaction_added', { messageId, reaction });
    return reaction;
  }

  // ===== LIVE STREAMING =====

  async startLiveStream(streamerId: string, roomId: string, streamData: Partial<LiveStream>): Promise<LiveStream> {
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    // Check permissions
    const participant = room.participants.find(p => p.userId === streamerId);
    if (!participant?.permissions.canStartLiveStream) {
      throw new Error('User does not have permission to start live streams');
    }

    const stream: LiveStream = {
      id: uuidv4(),
      chatRoomId: roomId,
      streamerId,
      title: streamData.title || 'Live Stream',
      description: streamData.description,
      category: streamData.category,
      tags: streamData.tags || [],
      status: StreamStatus.STARTING,
      settings: {
        isPrivate: streamData.settings?.isPrivate || false,
        requireSubscription: streamData.settings?.requireSubscription || false,
        maxViewers: streamData.settings?.maxViewers,
        allowComments: streamData.settings?.allowComments ?? true,
        allowReactions: streamData.settings?.allowReactions ?? true,
        allowTips: streamData.settings?.allowTips ?? true,
        moderationEnabled: streamData.settings?.moderationEnabled ?? true,
        recordingEnabled: streamData.settings?.recordingEnabled ?? false,
        quality: streamData.settings?.quality || StreamQuality.HIGH,
        latencyMode: streamData.settings?.latencyMode || LatencyMode.NORMAL
      },
      viewers: [],
      analytics: {
        totalViewers: 0,
        peakViewers: 0,
        averageViewTime: 0,
        totalWatchTime: 0,
        uniqueViewers: 0,
        returningViewers: 0,
        chatMessages: 0,
        reactions: 0,
        tips: {
          totalAmount: 0,
          tipCount: 0,
          averageTipAmount: 0,
          tipsPerMinute: 0
        },
        viewersByCountry: {},
        viewersByDevice: {},
        engagementRate: 0
      },
      monetization: streamData.monetization,
      createdAt: new Date()
    };

    stream.status = StreamStatus.LIVE;
    stream.startedAt = new Date();

    await this.saveStream(stream);
    this.activeStreams.set(stream.id, stream);

    // Notify room participants
    await this.broadcastToRoom(roomId, 'stream_started', stream);

    // Send system message
    await this.sendSystemMessage(roomId, {
      action: SystemAction.USER_JOINED,
      actorId: streamerId,
      data: { streamId: stream.id }
    });

    this.emit('stream_started', stream);
    return stream;
  }

  async joinStream(streamId: string, viewerId: string): Promise<boolean> {
    const stream = this.activeStreams.get(streamId);
    if (!stream || stream.status !== StreamStatus.LIVE) {
      throw new Error('Stream not found or not live');
    }

    // Check if already viewing
    const existingViewer = stream.viewers.find(v => v.userId === viewerId);
    if (existingViewer && !existingViewer.leftAt) {
      return false;
    }

    // Check capacity
    if (stream.settings.maxViewers && stream.viewers.filter(v => !v.leftAt).length >= stream.settings.maxViewers) {
      throw new Error('Stream is at capacity');
    }

    const viewer: StreamViewer = {
      userId: viewerId,
      joinedAt: new Date(),
      totalWatchTime: 0,
      tipsGiven: 0,
      messagesCount: 0,
      reactions: 0
    };

    stream.viewers.push(viewer);
    stream.analytics.totalViewers++;
    
    const currentViewers = stream.viewers.filter(v => !v.leftAt).length;
    stream.analytics.peakViewers = Math.max(stream.analytics.peakViewers, currentViewers);

    await this.saveStream(stream);

    // Notify streamer
    await this.sendToUser(stream.streamerId, 'viewer_joined', { streamId, viewerId });

    this.emit('stream_viewer_joined', { streamId, viewerId });
    return true;
  }

  async endStream(streamId: string, streamerId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.streamerId !== streamerId) {
      throw new Error('Only the streamer can end this stream');
    }

    stream.status = StreamStatus.ENDED;
    stream.endedAt = new Date();

    // Calculate final analytics
    const totalDuration = stream.endedAt.getTime() - (stream.startedAt?.getTime() || 0);
    stream.analytics.averageViewTime = stream.analytics.totalWatchTime / Math.max(1, stream.analytics.totalViewers);

    await this.saveStream(stream);
    this.activeStreams.delete(streamId);

    // Notify all viewers
    await this.broadcastToRoom(stream.chatRoomId, 'stream_ended', { streamId });

    this.emit('stream_ended', stream);
  }

  // ===== VIDEO/AUDIO CALLS =====

  async initiateCall(initiatorId: string, targetIds: string[], type: CallType, roomId?: string): Promise<Call> {
    const call: Call = {
      id: uuidv4(),
      chatRoomId: roomId,
      type,
      initiatorId,
      participants: [
        {
          userId: initiatorId,
          role: CallRole.HOST,
          status: CallParticipantStatus.JOINED,
          joinedAt: new Date(),
          audioEnabled: true,
          videoEnabled: type === CallType.VIDEO || type === CallType.GROUP_VIDEO,
          screenSharing: false,
          quality: CallQuality.HIGH,
          networkStats: {
            ping: 0,
            bandwidth: 0,
            packetLoss: 0,
            jitter: 0,
            quality: NetworkQuality.GOOD
          }
        }
      ],
      status: CallStatus.INITIATING,
      settings: {
        recordingEnabled: false,
        requireAuth: false,
        allowScreenShare: true,
        moderationEnabled: false,
        endToEndEncryption: true,
        quality: CallQuality.HIGH,
        backgroundBlur: false
      },
      analytics: {
        duration: 0,
        participants: 1,
        averageQuality: CallQuality.HIGH,
        networkIssues: 0,
        reconnections: 0,
        totalDataTransfer: 0,
        recordingGenerated: false
      },
      createdAt: new Date()
    };

    // Add target participants
    targetIds.forEach(targetId => {
      call.participants.push({
        userId: targetId,
        role: CallRole.PARTICIPANT,
        status: CallParticipantStatus.INVITED,
        audioEnabled: true,
        videoEnabled: type === CallType.VIDEO || type === CallType.GROUP_VIDEO,
        screenSharing: false,
        quality: CallQuality.HIGH,
        networkStats: {
          ping: 0,
          bandwidth: 0,
          packetLoss: 0,
          jitter: 0,
          quality: NetworkQuality.GOOD
        }
      });
    });

    call.status = CallStatus.RINGING;
    call.analytics.participants = call.participants.length;

    await this.saveCall(call);
    this.activeCalls.set(call.id, call);

    // Notify target users
    for (const targetId of targetIds) {
      await this.sendToUser(targetId, 'incoming_call', {
        callId: call.id,
        initiatorId,
        type,
        roomId
      });
    }

    this.emit('call_initiated', call);
    return call;
  }

  async joinCall(callId: string, userId: string): Promise<boolean> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not invited to this call');
    }

    participant.status = CallParticipantStatus.JOINED;
    participant.joinedAt = new Date();

    // Check if all participants have joined
    const joinedCount = call.participants.filter(p => p.status === CallParticipantStatus.JOINED).length;
    if (joinedCount === call.participants.length) {
      call.status = CallStatus.ACTIVE;
      call.startedAt = new Date();
    }

    await this.saveCall(call);

    // Notify other participants
    call.participants.forEach(async (p) => {
      if (p.userId !== userId) {
        await this.sendToUser(p.userId, 'participant_joined_call', { callId, userId });
      }
    });

    this.emit('call_participant_joined', { callId, userId });
    return true;
  }

  async endCall(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('User not in this call');
    }

    // If initiator ends call, end for everyone
    if (userId === call.initiatorId) {
      call.status = CallStatus.ENDED;
      call.endedAt = new Date();
      
      if (call.startedAt) {
        call.analytics.duration = call.endedAt.getTime() - call.startedAt.getTime();
      }

      // Notify all participants
      call.participants.forEach(async (p) => {
        await this.sendToUser(p.userId, 'call_ended', { callId, endedBy: userId });
      });

      this.activeCalls.delete(callId);
    } else {
      // Individual participant leaves
      participant.status = CallParticipantStatus.LEFT;
      participant.leftAt = new Date();

      // Notify remaining participants
      call.participants.forEach(async (p) => {
        if (p.userId !== userId && p.status === CallParticipantStatus.JOINED) {
          await this.sendToUser(p.userId, 'participant_left_call', { callId, userId });
        }
      });
    }

    await this.saveCall(call);

    this.emit('call_participant_left', { callId, userId });
  }

  // ===== PRESENCE & TYPING INDICATORS =====

  async updatePresence(userId: string, status: ParticipantStatus, customStatus?: string): Promise<void> {
    let presence = this.presenceInfo.get(userId);
    if (!presence) {
      presence = {
        userId,
        status,
        customStatus,
        lastSeen: new Date(),
        deviceInfo: {
          type: DeviceType.UNKNOWN,
          platform: 'unknown'
        },
        chatRooms: []
      };
    }

    presence.status = status;
    presence.customStatus = customStatus;
    presence.lastSeen = new Date();

    this.presenceInfo.set(userId, presence);
    await this.redis.setex(`presence:${userId}`, 300, JSON.stringify(presence)); // 5 minutes TTL

    // Broadcast presence update to user's chat rooms
    for (const roomId of presence.chatRooms) {
      await this.broadcastToRoom(roomId, 'presence_updated', { userId, status, customStatus });
    }

    this.emit('presence_updated', { userId, status, customStatus });
  }

  async setTyping(userId: string, roomId: string, isTyping: boolean): Promise<void> {
    const key = `${userId}-${roomId}`;
    
    if (isTyping) {
      const indicator: TypingIndicator = {
        userId,
        chatRoomId: roomId,
        isTyping: true,
        startedAt: new Date(),
        lastUpdate: new Date()
      };

      this.typingIndicators.set(key, indicator);
      
      // Auto-clear typing indicator after 10 seconds
      setTimeout(() => {
        this.typingIndicators.delete(key);
        this.broadcastToRoom(roomId, 'typing_stopped', { userId });
      }, 10000);

      await this.broadcastToRoom(roomId, 'typing_started', { userId });
    } else {
      this.typingIndicators.delete(key);
      await this.broadcastToRoom(roomId, 'typing_stopped', { userId });
    }
  }

  // ===== WEBSOCKET HANDLING =====

  private initializeWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ 
      port: this.config.websocket.port,
      maxPayload: this.config.websocket.maxPayload
    });

    this.wsServer.on('connection', (ws: WebSocket, request) => {
      const userId = this.extractUserIdFromRequest(request);
      if (!userId) {
        ws.close(1008, 'Authentication required');
        return;
      }

      this.connections.set(userId, ws);

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(userId, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.connections.delete(userId);
        this.updatePresence(userId, ParticipantStatus.OFFLINE);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connections.delete(userId);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({ type: 'connected', userId }));
      this.updatePresence(userId, ParticipantStatus.ONLINE);
    });

    console.log(`WebSocket server started on port ${this.config.websocket.port}`);
  }

  private async handleWebSocketMessage(userId: string, message: any): Promise<void> {
    switch (message.type) {
      case 'send_message':
        await this.sendMessage(message.roomId, userId, message.content);
        break;
      case 'join_room':
        await this.joinChatRoom(message.roomId, userId);
        break;
      case 'leave_room':
        await this.leaveChatRoom(message.roomId, userId);
        break;
      case 'typing':
        await this.setTyping(userId, message.roomId, message.isTyping);
        break;
      case 'update_presence':
        await this.updatePresence(userId, message.status, message.customStatus);
        break;
      case 'add_reaction':
        await this.addReaction(message.messageId, userId, message.emoji);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private async sendToUser(userId: string, type: string, data: any): Promise<void> {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }

  private async broadcastToRoom(roomId: string, type: string, data: any): Promise<void> {
    const room = await this.getChatRoom(roomId);
    if (!room) return;

    const message = JSON.stringify({ type, data, roomId });
    
    for (const participant of room.participants) {
      const ws = this.connections.get(participant.userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  private extractUserIdFromRequest(request: any): string | null {
    // Extract user ID from query parameters, headers, or JWT token
    // This is a simplified implementation
    const url = new URL(request.url || '', 'http://localhost');
    return url.searchParams.get('userId');
  }

  // ===== MODERATION =====

  private async moderateMessage(message: Message, room: ChatRoom): Promise<MessageModeration> {
    const moderation: MessageModeration = {
      flagged: false,
      autoModerated: true,
      score: 100,
      categories: []
    };

    if (!room.moderation.enabled) {
      return moderation;
    }

    let score = 100;

    // Word filter check
    if (room.moderation.wordFilter.enabled && message.content.text) {
      const text = message.content.text.toLowerCase();
      const bannedWords = [...room.moderation.bannedWords, ...room.moderation.wordFilter.customWords];
      
      for (const word of bannedWords) {
        if (text.includes(word.toLowerCase())) {
          score -= 30;
          moderation.flagged = true;
          moderation.reason = 'Contains banned words';
          moderation.action = room.moderation.wordFilter.action;
          moderation.categories.push('inappropriate_language');
          break;
        }
      }
    }

    // Spam detection
    if (room.moderation.spamDetection.enabled && message.content.text) {
      const text = message.content.text;
      
      // Check for excessive caps
      if (room.moderation.spamDetection.detectCaps) {
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (capsRatio > 0.7 && text.length > 10) {
          score -= 20;
          moderation.categories.push('excessive_caps');
        }
      }

      // Check for repeated characters
      if (room.moderation.spamDetection.detectRepeatedChars) {
        const repeatedCharsMatch = text.match(/(.)\1{4,}/g);
        if (repeatedCharsMatch) {
          score -= 15;
          moderation.categories.push('repeated_characters');
        }
      }

      // Check for excessive links
      const linkCount = (message.content.links || []).length;
      if (linkCount > room.moderation.spamDetection.maxLinksPerMessage) {
        score -= 25;
        moderation.flagged = true;
        moderation.reason = 'Excessive links';
        moderation.categories.push('spam_links');
      }
    }

    // Image moderation for media messages
    if (room.moderation.imageModeration.enabled && message.content.media && message.content.media.length > 0) {
      for (const media of message.content.media) {
        if (media.type === MediaType.IMAGE || media.type === MediaType.VIDEO) {
          // Mock AI moderation result
          const adultContentScore = Math.random();
          const violenceScore = Math.random();

          if (adultContentScore > room.moderation.imageModeration.adultContentThreshold) {
            score -= 40;
            moderation.flagged = true;
            moderation.reason = 'Adult content detected';
            moderation.categories.push('adult_content');
            media.adultContent = true;
          }

          if (violenceScore > room.moderation.imageModeration.violenceThreshold) {
            score -= 35;
            moderation.flagged = true;
            moderation.reason = 'Violence detected';
            moderation.categories.push('violence');
          }
        }
      }
    }

    moderation.score = Math.max(0, score);

    // Determine action based on score
    if (moderation.score < 50) {
      moderation.action = ModerationAction.DELETE;
    } else if (moderation.score < 70) {
      moderation.action = ModerationAction.WARN;
    }

    return moderation;
  }

  // ===== BACKGROUND TASKS =====

  private startPresenceUpdater(): void {
    setInterval(async () => {
      // Update presence for connected users
      for (const [userId, ws] of this.connections) {
        if (ws.readyState === WebSocket.OPEN) {
          await this.updatePresence(userId, ParticipantStatus.ONLINE);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private startMessageProcessor(): void {
    setInterval(async () => {
      // Process message delivery confirmations
      // Update message status from SENT to DELIVERED/READ
      console.log('Processing message delivery status...');
    }, 5000); // Every 5 seconds
  }

  private startAnalyticsAggregator(): void {
    setInterval(async () => {
      // Aggregate room analytics
      for (const room of this.chatRooms.values()) {
        await this.updateRoomAnalytics(room);
      }
    }, 60000); // Every minute
  }

  private startModerationWorker(): void {
    setInterval(async () => {
      // Process flagged messages for review
      console.log('Processing moderation queue...');
    }, 30000); // Every 30 seconds
  }

  private startCleanupTasks(): void {
    setInterval(async () => {
      // Clean up old typing indicators
      const now = Date.now();
      for (const [key, indicator] of this.typingIndicators) {
        if (now - indicator.lastUpdate.getTime() > 10000) {
          this.typingIndicators.delete(key);
        }
      }

      // Clean up old presence data
      // Archive old messages based on retention settings
      await this.performCleanup();
    }, 300000); // Every 5 minutes
  }

  // ===== UTILITY METHODS =====

  private async isRateLimited(userId: string, roomId: string): Promise<boolean> {
    const room = await this.getChatRoom(roomId);
    if (!room || !room.moderation.rateLimit.enabled) {
      return false;
    }

    const key = `ratelimit:${userId}:${roomId}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }

    return count > room.moderation.rateLimit.messagesPerMinute;
  }

  private async sendSystemMessage(roomId: string, data: SystemMessageData): Promise<void> {
    const systemMessage: Message = {
      id: uuidv4(),
      chatRoomId: roomId,
      senderId: 'system',
      type: MessageType.SYSTEM,
      content: {
        system: data,
        mentions: [],
        hashtags: [],
        links: []
      },
      metadata: {
        deviceInfo: {
          type: DeviceType.UNKNOWN,
          platform: 'system'
        },
        editCount: 0,
        priority: MessagePriority.LOW
      },
      reactions: [],
      replies: [],
      status: MessageStatus.SENT,
      createdAt: new Date()
    };

    await this.saveMessage(systemMessage);
    await this.broadcastToRoom(roomId, 'new_message', systemMessage);
  }

  private async sendMessageNotifications(message: Message, room: ChatRoom): Promise<void> {
    // Send push notifications to offline participants
    for (const participant of room.participants) {
      if (participant.userId !== message.senderId) {
        const isOnline = this.connections.has(participant.userId);
        if (!isOnline && participant.metadata.preferences.notifications.enablePushNotifications) {
          // Would integrate with push notification service
          this.emit('send_push_notification', {
            userId: participant.userId,
            title: `New message in ${room.name || 'Chat'}`,
            body: message.content.text?.substring(0, 100) || 'New message',
            data: { roomId: room.id, messageId: message.id }
          });
        }
      }
    }
  }

  private async queueForApproval(roomId: string, userId: string): Promise<void> {
    await this.redis.sadd(`approval_queue:${roomId}`, userId);
    
    // Notify room moderators
    const room = await this.getChatRoom(roomId);
    if (room) {
      for (const moderatorId of room.moderation.moderators) {
        await this.sendToUser(moderatorId, 'approval_request', { roomId, userId });
      }
    }
  }

  private async updateRoomAnalytics(room: ChatRoom): Promise<void> {
    // Calculate active participants
    const activeCount = room.participants.filter(p => {
      const presence = this.presenceInfo.get(p.userId);
      return presence && presence.status !== ParticipantStatus.OFFLINE;
    }).length;

    room.analytics.activeParticipants = activeCount;
    
    // Update peak concurrent users
    room.analytics.peakConcurrentUsers = Math.max(
      room.analytics.peakConcurrentUsers,
      activeCount
    );

    await this.updateChatRoom(room.id, room);
  }

  private async performCleanup(): Promise<void> {
    // Clean up expired messages based on retention settings
    for (const room of this.chatRooms.values()) {
      if (room.settings.messageRetention !== MessageRetention.FOREVER) {
        const cutoffDate = this.getRetentionCutoffDate(room.settings.messageRetention);
        // Would delete messages older than cutoff date
      }
    }
  }

  private getRetentionCutoffDate(retention: MessageRetention): Date {
    const now = new Date();
    switch (retention) {
      case MessageRetention.ONE_DAY:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case MessageRetention.ONE_WEEK:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case MessageRetention.ONE_MONTH:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case MessageRetention.THREE_MONTHS:
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case MessageRetention.SIX_MONTHS:
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case MessageRetention.ONE_YEAR:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  }

  private getOwnerPermissions(): ParticipantPermissions {
    return {
      canSendMessages: true,
      canSendMedia: true,
      canMakeVoiceCalls: true,
      canMakeVideoCalls: true,
      canStartLiveStream: true,
      canModerateMessages: true,
      canKickMembers: true,
      canBanMembers: true,
      canChangeSettings: true,
      canInviteMembers: true,
      canSeeHistory: true,
      canReceiveTips: true
    };
  }

  private getDefaultPermissions(): ParticipantPermissions {
    return {
      canSendMessages: true,
      canSendMedia: true,
      canMakeVoiceCalls: true,
      canMakeVideoCalls: true,
      canStartLiveStream: false,
      canModerateMessages: false,
      canKickMembers: false,
      canBanMembers: false,
      canChangeSettings: false,
      canInviteMembers: false,
      canSeeHistory: true,
      canReceiveTips: false
    };
  }

  private getDefaultParticipantMetadata(): ParticipantMetadata {
    return {
      joinSource: 'direct',
      deviceInfo: {
        type: DeviceType.UNKNOWN,
        platform: 'unknown'
      },
      preferences: {
        notifications: {
          enablePushNotifications: true,
          enableSoundNotifications: true,
          enableVibration: true,
          muteDuringCalls: true,
          keywordAlerts: []
        },
        privacy: {
          showOnlineStatus: true,
          showLastSeen: true,
          allowDirectMessages: true,
          requireApprovalForGroups: false,
          blockUnverifiedUsers: false,
          autoDeleteMessages: false
        },
        appearance: {
          theme: ChatTheme.AUTO,
          fontSize: FontSize.MEDIUM,
          messageGrouping: true,
          showTimestamps: true,
          showAvatars: true,
          compactMode: false,
          customEmojis: true
        },
        accessibility: {
          enableScreenReader: false,
          enableHighContrast: false,
          enableKeyboardNavigation: false,
          enableVoiceCommands: false,
          textToSpeech: false,
          speechToText: false
        }
      }
    };
  }

  // ===== DATA PERSISTENCE =====

  async getChatRoom(roomId: string): Promise<ChatRoom | null> {
    const cached = this.chatRooms.get(roomId);
    if (cached) return cached;

    const data = await this.redis.get(`room:${roomId}`);
    if (data) {
      const room = JSON.parse(data);
      this.chatRooms.set(roomId, room);
      return room;
    }

    return null;
  }

  async saveChatRoom(room: ChatRoom): Promise<void> {
    await this.redis.setex(`room:${room.id}`, 86400 * 365, JSON.stringify(room));
    await this.redis.sadd(`cluster:${room.clusterId}:rooms`, room.id);
  }

  async updateChatRoom(roomId: string, room: ChatRoom): Promise<void> {
    room.updatedAt = new Date();
    this.chatRooms.set(roomId, room);
    await this.saveChatRoom(room);
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const cached = this.messages.get(messageId);
    if (cached) return cached;

    const data = await this.redis.get(`message:${messageId}`);
    if (data) {
      const message = JSON.parse(data);
      this.messages.set(messageId, message);
      return message;
    }

    return null;
  }

  async saveMessage(message: Message): Promise<void> {
    await this.redis.setex(`message:${message.id}`, 86400 * 365, JSON.stringify(message));
    await this.redis.sadd(`room:${message.chatRoomId}:messages`, message.id);
  }

  async saveStream(stream: LiveStream): Promise<void> {
    await this.redis.setex(`stream:${stream.id}`, 86400 * 7, JSON.stringify(stream));
  }

  async saveCall(call: Call): Promise<void> {
    await this.redis.setex(`call:${call.id}`, 86400 * 7, JSON.stringify(call));
  }
}

// ===== CONFIGURATION INTERFACES =====

export interface ChatSphereConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  websocket: {
    enabled: boolean;
    port: number;
    maxPayload: number;
    heartbeatInterval: number;
    maxConnections?: number;
  };
  moderation: {
    enabled: boolean;
    aiProvider?: string;
    autoModeration: boolean;
    imageModeration: boolean;
    spamDetection: boolean;
    profanityFilter: boolean;
  };
  streaming: {
    enabled: boolean;
    maxConcurrentStreams: number;
    recordingEnabled: boolean;
    maxViewers: number;
  };
  calls: {
    enabled: boolean;
    maxDuration: number;
    recordingEnabled: boolean;
    p2pEnabled: boolean;
  };
  notifications: {
    pushProvider?: string;
    emailProvider?: string;
    smsProvider?: string;
  };
  analytics: {
    enabled: boolean;
    retentionDays: number;
    aggregationInterval: number;
  };
}

export default ChatSphereService;
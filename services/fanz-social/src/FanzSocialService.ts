/**
 * 🌐 FanzSocial - Social Networking Core Service
 * 
 * Comprehensive social networking platform for the FANZ ecosystem.
 * Provides user profiles, feeds, connections, content sharing, reactions,
 * and discovery mechanisms with adult-content awareness and privacy controls.
 * 
 * Features:
 * - User profiles with customizable privacy settings
 * - Real-time activity feeds and timeline management
 * - Social connections (follows, friends, subscribers)
 * - Content sharing with rich media support
 * - Reactions, likes, comments, and engagement system
 * - Discovery algorithms and recommendation engine
 * - Adult content filtering and age verification
 * - Privacy controls and content gating
 * - Cross-platform integration with all FANZ clusters
 * - Creator-fan relationship management
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

// ===== TYPES & INTERFACES =====

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: Date;
  gender?: string;
  orientation?: string;
  profile: UserProfile;
  settings: UserSettings;
  verification: VerificationStatus;
  stats: UserStats;
  clusterId: string;
  accountType: AccountType;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  suspendedUntil?: Date;
}

export enum AccountType {
  FAN = 'fan',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  PREMIUM = 'premium',
  VIP = 'vip'
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
  ELITE = 'elite'
}

export interface UserProfile {
  interests: string[];
  languages: string[];
  contentPreferences: ContentPreference[];
  relationshipStatus?: RelationshipStatus;
  lookingFor: string[];
  kinks?: string[];
  limits?: string[];
  experience?: ExperienceLevel;
  bodyType?: string;
  height?: number;
  weight?: number;
  measurements?: string;
  tattoos?: boolean;
  piercings?: boolean;
  customFields: { [key: string]: any };
}

export enum RelationshipStatus {
  SINGLE = 'single',
  TAKEN = 'taken',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  COMPLICATED = 'complicated',
  OPEN = 'open',
  POLYAMOROUS = 'polyamorous'
}

export enum ExperienceLevel {
  NEWBIE = 'newbie',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  EXPERIENCED = 'experienced',
  EXPERT = 'expert'
}

export interface ContentPreference {
  category: ContentCategory;
  level: ContentLevel;
  enabled: boolean;
}

export enum ContentCategory {
  PHOTOS = 'photos',
  VIDEOS = 'videos',
  LIVE_STREAMS = 'live_streams',
  STORIES = 'stories',
  POSTS = 'posts',
  POLLS = 'polls',
  CUSTOM = 'custom'
}

export enum ContentLevel {
  GENERAL = 'general',
  SUGGESTIVE = 'suggestive',
  MATURE = 'mature',
  ADULT = 'adult',
  EXPLICIT = 'explicit',
  EXTREME = 'extreme'
}

export interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  content: ContentSettings;
  discovery: DiscoverySettings;
  blocking: BlockingSettings;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  messagePermissions: MessagePermissions;
  followPermissions: FollowPermissions;
  contentVisibility: ContentVisibility;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showActivity: boolean;
  allowTagging: boolean;
  allowMentions: boolean;
  showInSearch: boolean;
  showInRecommendations: boolean;
  shareAnalytics: boolean;
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FOLLOWERS_ONLY = 'followers_only',
  SUBSCRIBERS_ONLY = 'subscribers_only',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private'
}

export enum MessagePermissions {
  EVERYONE = 'everyone',
  FOLLOWERS = 'followers',
  SUBSCRIBERS = 'subscribers',
  FRIENDS = 'friends',
  VERIFIED_ONLY = 'verified_only',
  NONE = 'none'
}

export enum FollowPermissions {
  EVERYONE = 'everyone',
  REQUIRES_APPROVAL = 'requires_approval',
  SUBSCRIBERS_ONLY = 'subscribers_only',
  VERIFIED_ONLY = 'verified_only',
  NONE = 'none'
}

export enum ContentVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  SUBSCRIBERS = 'subscribers',
  FRIENDS = 'friends',
  SUBSCRIBERS_ONLY = 'subscribers_only',
  CUSTOM = 'custom'
}

export interface NotificationSettings {
  newFollower: boolean;
  newSubscriber: boolean;
  newMessage: boolean;
  newComment: boolean;
  newLike: boolean;
  newShare: boolean;
  newMention: boolean;
  liveStream: boolean;
  contentUpdate: boolean;
  promotions: boolean;
  recommendations: boolean;
  digest: DigestFrequency;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export enum DigestFrequency {
  NEVER = 'never',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface ContentSettings {
  defaultVisibility: ContentVisibility;
  allowComments: boolean;
  allowSharing: boolean;
  allowDownload: boolean;
  watermark: boolean;
  ageGating: boolean;
  contentWarnings: boolean;
  autoModeration: boolean;
  requireSubscription: boolean;
  pricingEnabled: boolean;
}

export interface DiscoverySettings {
  showInRecommendations: boolean;
  allowLocationBasedDiscovery: boolean;
  showSimilarUsers: boolean;
  showTrendingContent: boolean;
  allowCrossClusterDiscovery: boolean;
  ageRangeFilter: AgeRangeFilter;
  locationFilter: LocationFilter;
  contentLevelFilter: ContentLevel[];
}

export interface AgeRangeFilter {
  minAge: number;
  maxAge: number;
  enabled: boolean;
}

export interface LocationFilter {
  countries: string[];
  radius?: number;
  enabled: boolean;
}

export interface BlockingSettings {
  blockedUsers: string[];
  blockedKeywords: string[];
  blockedCountries: string[];
  autoBlock: AutoBlockSettings;
}

export interface AutoBlockSettings {
  spamAccounts: boolean;
  newAccounts: boolean;
  unverifiedAccounts: boolean;
  suspiciousActivity: boolean;
}

export interface VerificationStatus {
  email: boolean;
  phone: boolean;
  identity: boolean;
  age: boolean;
  address: boolean;
  government: boolean;
  social: boolean;
  creator: boolean;
  level: VerificationLevel;
  badge?: string;
  verifiedAt?: Date;
}

export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  PHONE = 'phone',
  BASIC = 'basic',
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  ELITE = 'elite'
}

export interface UserStats {
  followers: number;
  following: number;
  subscribers: number;
  subscriptions: number;
  friends: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  revenue?: number;
  engagement: EngagementStats;
}

export interface EngagementStats {
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  averageViews: number;
  engagementRate: number;
  reachRate: number;
  impressions: number;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  type: ConnectionType;
  status: ConnectionStatus;
  clusterId: string;
  metadata: ConnectionMetadata;
  createdAt: Date;
  updatedAt: Date;
  mutedUntil?: Date;
}

export enum ConnectionType {
  FOLLOW = 'follow',
  FRIEND = 'friend',
  SUBSCRIBER = 'subscriber',
  BLOCK = 'block',
  MUTE = 'mute',
  FAVORITE = 'favorite',
  CLOSE_FRIEND = 'close_friend'
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface ConnectionMetadata {
  subscriptionLevel?: string;
  subscriptionPrice?: number;
  subscriptionDuration?: number;
  notes?: string;
  tags: string[];
  notificationLevel: NotificationLevel;
  customSettings: { [key: string]: any };
}

export enum NotificationLevel {
  ALL = 'all',
  IMPORTANT = 'important',
  MENTIONS_ONLY = 'mentions_only',
  NONE = 'none'
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content: PostContent;
  metadata: PostMetadata;
  engagement: PostEngagement;
  moderation: ModerationStatus;
  visibility: ContentVisibility;
  clusterId: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  deletedAt?: Date;
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  POLL = 'poll',
  STORY = 'story',
  LIVE = 'live',
  SHARE = 'share',
  ANNOUNCEMENT = 'announcement'
}

export interface PostContent {
  text?: string;
  media?: MediaItem[];
  poll?: PollData;
  location?: LocationData;
  tags: string[];
  mentions: string[];
  hashtags: string[];
  links: LinkPreview[];
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  dimensions?: MediaDimensions;
  size: number;
  format: string;
  quality: MediaQuality;
  watermark?: boolean;
  ageRestricted?: boolean;
  price?: number;
  previewUrl?: string;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  GIF = 'gif',
  DOCUMENT = 'document'
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export enum MediaQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd',
  UHD = 'uhd'
}

export interface PollData {
  question: string;
  options: PollOption[];
  settings: PollSettings;
  results: PollResults;
}

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
  votes: number;
}

export interface PollSettings {
  allowMultiple: boolean;
  anonymousVoting: boolean;
  showResults: ShowResultsWhen;
  expiresAt?: Date;
  subscribersOnly: boolean;
}

export enum ShowResultsWhen {
  IMMEDIATELY = 'immediately',
  AFTER_VOTE = 'after_vote',
  AFTER_EXPIRY = 'after_expiry',
  NEVER = 'never'
}

export interface PollResults {
  totalVotes: number;
  voterIds: string[];
  breakdown: { [optionId: string]: number };
}

export interface LocationData {
  name: string;
  coordinates?: GeographicCoordinates;
  address?: string;
  placeId?: string;
}

export interface GeographicCoordinates {
  latitude: number;
  longitude: number;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}

export interface PostMetadata {
  contentLevel: ContentLevel;
  ageRestricted: boolean;
  requiresSubscription: boolean;
  price?: number;
  duration?: number;
  featured: boolean;
  pinned: boolean;
  sponsored: boolean;
  crossPosted: string[];
  originalPostId?: string;
  editHistory: EditHistoryItem[];
}

export interface EditHistoryItem {
  editedAt: Date;
  editedBy: string;
  changes: string[];
  reason?: string;
}

export interface PostEngagement {
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  saves: number;
  reports: number;
  reactions: ReactionSummary;
  reach: number;
  impressions: number;
}

export interface ReactionSummary {
  [emoji: string]: number;
}

export interface ModerationStatus {
  status: ModerationState;
  reviewedBy?: string;
  reviewedAt?: Date;
  flags: ModerationFlag[];
  score: number;
  aiAnalysis?: AIAnalysis;
  warnings: ModerationWarning[];
}

export enum ModerationState {
  APPROVED = 'approved',
  PENDING = 'pending',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
  REMOVED = 'removed',
  APPEALED = 'appealed'
}

export interface ModerationFlag {
  id: string;
  type: FlagType;
  reason: string;
  reportedBy: string;
  reportedAt: Date;
  severity: FlagSeverity;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export enum FlagType {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  NUDITY = 'nudity',
  COPYRIGHT = 'copyright',
  MISINFORMATION = 'misinformation',
  IMPERSONATION = 'impersonation',
  SELF_HARM = 'self_harm',
  ILLEGAL_CONTENT = 'illegal_content',
  AGE_INAPPROPRIATE = 'age_inappropriate',
  OTHER = 'other'
}

export enum FlagSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AIAnalysis {
  contentSafety: number;
  toxicity: number;
  adultContent: number;
  violence: number;
  hate: number;
  selfHarm: number;
  categories: string[];
  confidence: number;
  language: string;
  sentiment: SentimentAnalysis;
}

export interface SentimentAnalysis {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  emotions: EmotionScores;
}

export interface EmotionScores {
  joy: number;
  anger: number;
  fear: number;
  sadness: number;
  surprise: number;
  disgust: number;
}

export interface ModerationWarning {
  id: string;
  type: string;
  message: string;
  severity: FlagSeverity;
  createdAt: Date;
  acknowledged: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  replies: Comment[];
  engagement: CommentEngagement;
  moderation: ModerationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CommentEngagement {
  likes: number;
  dislikes: number;
  reports: number;
  replies: number;
}

export interface ActivityFeed {
  id: string;
  userId: string;
  type: FeedType;
  algorithm: FeedAlgorithm;
  posts: FeedPost[];
  metadata: FeedMetadata;
  lastUpdated: Date;
}

export enum FeedType {
  HOME = 'home',
  FOLLOWING = 'following',
  DISCOVER = 'discover',
  TRENDING = 'trending',
  LOCAL = 'local',
  CLUSTER = 'cluster',
  PERSONALIZED = 'personalized'
}

export enum FeedAlgorithm {
  CHRONOLOGICAL = 'chronological',
  ALGORITHMIC = 'algorithmic',
  ENGAGEMENT_BASED = 'engagement_based',
  INTEREST_BASED = 'interest_based',
  HYBRID = 'hybrid'
}

export interface FeedPost {
  postId: string;
  score: number;
  reason: string[];
  boosted: boolean;
  sponsored: boolean;
  clusterId: string;
  addedAt: Date;
}

export interface FeedMetadata {
  totalPosts: number;
  lastRefresh: Date;
  refreshFrequency: number;
  qualityScore: number;
  diversityScore: number;
  relevanceScore: number;
}

export interface Story {
  id: string;
  authorId: string;
  type: StoryType;
  content: StoryContent;
  visibility: ContentVisibility;
  viewers: StoryViewer[];
  highlightId?: string;
  clusterId: string;
  createdAt: Date;
  expiresAt: Date;
  deletedAt?: Date;
}

export enum StoryType {
  PHOTO = 'photo',
  VIDEO = 'video',
  TEXT = 'text',
  LIVE = 'live',
  BOOMERANG = 'boomerang',
  POLL = 'poll',
  QUIZ = 'quiz'
}

export interface StoryContent {
  media?: MediaItem;
  text?: string;
  backgroundColor?: string;
  stickers: StorySticker[];
  music?: MusicTrack;
  effects: StoryEffect[];
}

export interface StorySticker {
  id: string;
  type: StickerType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  data: any;
}

export enum StickerType {
  LOCATION = 'location',
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  TIME = 'time',
  POLL = 'poll',
  QUIZ = 'quiz',
  MUSIC = 'music',
  EMOJI = 'emoji',
  GIF = 'gif'
}

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number;
  startTime: number;
  endTime: number;
  previewUrl: string;
}

export interface StoryEffect {
  id: string;
  type: EffectType;
  intensity: number;
  parameters: { [key: string]: any };
}

export enum EffectType {
  FILTER = 'filter',
  AR = 'ar',
  BEAUTY = 'beauty',
  BACKGROUND = 'background',
  FACE_EFFECT = 'face_effect'
}

export interface StoryViewer {
  userId: string;
  viewedAt: Date;
  viewDuration: number;
  interacted: boolean;
}

export interface LiveStream {
  id: string;
  streamerId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  status: StreamStatus;
  visibility: ContentVisibility;
  settings: StreamSettings;
  stats: StreamStats;
  clusterId: string;
  scheduledAt?: Date;
  startedAt: Date;
  endedAt?: Date;
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  STARTING = 'starting',
  LIVE = 'live',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface StreamSettings {
  allowComments: boolean;
  allowReactions: boolean;
  allowGifts: boolean;
  allowGuests: boolean;
  maxViewers?: number;
  ageRestricted: boolean;
  subscribersOnly: boolean;
  moderationLevel: ModerationLevel;
}

export enum ModerationLevel {
  OFF = 'off',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  STRICT = 'strict'
}

export interface StreamStats {
  viewers: number;
  maxViewers: number;
  totalViewers: number;
  likes: number;
  comments: number;
  gifts: number;
  duration: number;
  revenue?: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  status: NotificationStatus;
  priority: NotificationPriority;
  clusterId: string;
  createdAt: Date;
  readAt?: Date;
  clickedAt?: Date;
}

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MENTION = 'mention',
  SHARE = 'share',
  MESSAGE = 'message',
  LIVE_STREAM = 'live_stream',
  POST_UPDATE = 'post_update',
  SUBSCRIPTION = 'subscription',
  GIFT = 'gift',
  MILESTONE = 'milestone',
  SYSTEM = 'system'
}

export interface NotificationData {
  actorId?: string;
  postId?: string;
  commentId?: string;
  streamId?: string;
  actionUrl?: string;
  imageUrl?: string;
  customData: { [key: string]: any };
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Trend {
  id: string;
  type: TrendType;
  content: string;
  clusterId: string;
  category?: string;
  stats: TrendStats;
  location?: string;
  language: string;
  createdAt: Date;
  expiresAt?: Date;
}

export enum TrendType {
  HASHTAG = 'hashtag',
  KEYWORD = 'keyword',
  TOPIC = 'topic',
  USER = 'user',
  LOCATION = 'location'
}

export interface TrendStats {
  mentions: number;
  posts: number;
  engagement: number;
  growth: number;
  rank: number;
  score: number;
}

// ===== MAIN SOCIAL SERVICE CLASS =====

export class FanzSocialService extends EventEmitter {
  private redis: Redis;
  private config: SocialConfig;
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();
  private connections: Map<string, Connection> = new Map();

  constructor(config: SocialConfig) {
    super();
    this.config = config;

    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.database || 10
    });

    // Start background workers
    this.startFeedGenerator();
    this.startTrendingAnalyzer();
    this.startRecommendationEngine();
    this.startModerationWorker();
    this.startAnalyticsWorker();
  }

  // ===== USER MANAGEMENT =====

  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      username: userData.username!,
      displayName: userData.displayName || userData.username!,
      email: userData.email!,
      avatar: userData.avatar,
      banner: userData.banner,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      birthDate: userData.birthDate,
      gender: userData.gender,
      orientation: userData.orientation,
      profile: this.getDefaultProfile(),
      settings: this.getDefaultSettings(),
      verification: this.getDefaultVerification(),
      stats: this.getDefaultStats(),
      clusterId: userData.clusterId!,
      accountType: userData.accountType || AccountType.FAN,
      subscriptionTier: userData.subscriptionTier || SubscriptionTier.FREE,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
      ...userData
    };

    await this.saveUser(user);
    this.users.set(user.id, user);

    // Initialize user feed
    await this.initializeUserFeed(user.id);

    this.emit('user_created', user);
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveUser(updatedUser);
    this.users.set(userId, updatedUser);

    this.emit('user_updated', updatedUser);
    return updatedUser;
  }

  async getUser(userId: string): Promise<User | null> {
    // Check cache first
    const cached = this.users.get(userId);
    if (cached) return cached;

    // Load from Redis
    const data = await this.redis.get(`user:${userId}`);
    if (data) {
      const user = JSON.parse(data);
      this.users.set(userId, user);
      return user;
    }

    return null;
  }

  async searchUsers(query: UserSearchQuery): Promise<User[]> {
    // This would implement comprehensive user search
    const allUsers = Array.from(this.users.values());
    
    return allUsers.filter(user => {
      if (query.username && !user.username.toLowerCase().includes(query.username.toLowerCase())) return false;
      if (query.displayName && !user.displayName.toLowerCase().includes(query.displayName.toLowerCase())) return false;
      if (query.clusterId && user.clusterId !== query.clusterId) return false;
      if (query.accountType && user.accountType !== query.accountType) return false;
      if (query.verified !== undefined && (user.verification.level !== VerificationLevel.VERIFIED) !== !query.verified) return false;
      if (query.location && user.location && !user.location.toLowerCase().includes(query.location.toLowerCase())) return false;
      if (query.minAge && user.birthDate && this.calculateAge(user.birthDate) < query.minAge) return false;
      if (query.maxAge && user.birthDate && this.calculateAge(user.birthDate) > query.maxAge) return false;
      
      return true;
    }).slice(0, query.limit || 50);
  }

  async updateUserActivity(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastActiveAt = new Date();
      await this.saveUser(user);
      this.users.set(userId, user);
    }
  }

  // ===== CONNECTION MANAGEMENT =====

  async createConnection(fromUserId: string, toUserId: string, type: ConnectionType, metadata: Partial<ConnectionMetadata> = {}): Promise<Connection> {
    // Check if connection already exists
    const existingConnection = await this.getConnection(fromUserId, toUserId, type);
    if (existingConnection) {
      throw new Error('Connection already exists');
    }

    const connection: Connection = {
      id: uuidv4(),
      userId: fromUserId,
      connectedUserId: toUserId,
      type,
      status: this.getInitialConnectionStatus(type),
      clusterId: (await this.getUser(fromUserId))?.clusterId || '',
      metadata: {
        tags: [],
        notificationLevel: NotificationLevel.ALL,
        customSettings: {},
        ...metadata
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveConnection(connection);
    this.connections.set(connection.id, connection);

    // Update user stats
    await this.updateUserConnectionStats(fromUserId, toUserId, type, 'add');

    // Create reverse connection for mutual relationships
    if (this.isMutualConnectionType(type) && connection.status === ConnectionStatus.ACTIVE) {
      await this.createReverseConnection(connection);
    }

    // Send notification
    await this.sendConnectionNotification(connection);

    this.emit('connection_created', connection);
    return connection;
  }

  async updateConnectionStatus(connectionId: string, status: ConnectionStatus): Promise<Connection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.status = status;
    connection.updatedAt = new Date();

    await this.saveConnection(connection);

    // Handle status-specific logic
    if (status === ConnectionStatus.ACTIVE) {
      if (this.isMutualConnectionType(connection.type)) {
        await this.createReverseConnection(connection);
      }
      await this.updateUserConnectionStats(connection.userId, connection.connectedUserId, connection.type, 'add');
    } else if (status === ConnectionStatus.REJECTED || status === ConnectionStatus.INACTIVE) {
      await this.updateUserConnectionStats(connection.userId, connection.connectedUserId, connection.type, 'remove');
    }

    this.emit('connection_updated', connection);
    return connection;
  }

  async removeConnection(fromUserId: string, toUserId: string, type: ConnectionType): Promise<void> {
    const connection = await this.getConnection(fromUserId, toUserId, type);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Remove from storage
    await this.redis.del(`connection:${connection.id}`);
    this.connections.delete(connection.id);

    // Update stats
    await this.updateUserConnectionStats(fromUserId, toUserId, type, 'remove');

    // Remove reverse connection if it exists
    const reverseConnection = await this.getConnection(toUserId, fromUserId, type);
    if (reverseConnection) {
      await this.redis.del(`connection:${reverseConnection.id}`);
      this.connections.delete(reverseConnection.id);
    }

    this.emit('connection_removed', { fromUserId, toUserId, type });
  }

  async getConnections(userId: string, type?: ConnectionType, status?: ConnectionStatus): Promise<Connection[]> {
    const connections = Array.from(this.connections.values()).filter(conn => {
      if (conn.userId !== userId) return false;
      if (type && conn.type !== type) return false;
      if (status && conn.status !== status) return false;
      return true;
    });

    return connections;
  }

  async getConnection(fromUserId: string, toUserId: string, type: ConnectionType): Promise<Connection | null> {
    const connections = Array.from(this.connections.values()).find(conn =>
      conn.userId === fromUserId &&
      conn.connectedUserId === toUserId &&
      conn.type === type
    );

    return connections || null;
  }

  // ===== POST MANAGEMENT =====

  async createPost(authorId: string, postData: Partial<Post>): Promise<Post> {
    const author = await this.getUser(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    const post: Post = {
      id: uuidv4(),
      authorId,
      type: postData.type || PostType.TEXT,
      content: {
        tags: [],
        mentions: [],
        hashtags: [],
        links: [],
        ...postData.content
      },
      metadata: {
        contentLevel: postData.metadata?.contentLevel || ContentLevel.GENERAL,
        ageRestricted: postData.metadata?.ageRestricted || false,
        requiresSubscription: postData.metadata?.requiresSubscription || false,
        featured: false,
        pinned: false,
        sponsored: false,
        crossPosted: [],
        editHistory: [],
        ...postData.metadata
      },
      engagement: {
        views: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reports: 0,
        reactions: {},
        reach: 0,
        impressions: 0
      },
      moderation: {
        status: ModerationState.PENDING,
        flags: [],
        score: 0,
        warnings: []
      },
      visibility: postData.visibility || ContentVisibility.PUBLIC,
      clusterId: author.clusterId,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: postData.scheduledAt
    };

    // Process content for moderation
    await this.processContentModeration(post);

    await this.savePost(post);
    this.posts.set(post.id, post);

    // Update user stats
    author.stats.posts++;
    await this.updateUser(authorId, { stats: author.stats });

    // Add to feeds if approved
    if (post.moderation.status === ModerationState.APPROVED) {
      await this.distributeToFeeds(post);
    }

    this.emit('post_created', post);
    return post;
  }

  async updatePost(postId: string, updates: Partial<Post>, editorId: string): Promise<Post> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Add to edit history
    const editHistoryItem: EditHistoryItem = {
      editedAt: new Date(),
      editedBy: editorId,
      changes: Object.keys(updates),
      reason: 'User edit'
    };

    post.metadata.editHistory.push(editHistoryItem);

    const updatedPost = {
      ...post,
      ...updates,
      updatedAt: new Date()
    };

    await this.savePost(updatedPost);
    this.posts.set(postId, updatedPost);

    this.emit('post_updated', updatedPost);
    return updatedPost;
  }

  async deletePost(postId: string, deleterId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Soft delete
    post.deletedAt = new Date();
    await this.savePost(post);

    // Remove from feeds
    await this.removeFromFeeds(postId);

    // Update user stats
    const author = await this.getUser(post.authorId);
    if (author) {
      author.stats.posts = Math.max(0, author.stats.posts - 1);
      await this.updateUser(post.authorId, { stats: author.stats });
    }

    this.emit('post_deleted', { postId, deleterId });
  }

  async getPost(postId: string): Promise<Post | null> {
    const cached = this.posts.get(postId);
    if (cached) return cached;

    const data = await this.redis.get(`post:${postId}`);
    if (data) {
      const post = JSON.parse(data);
      this.posts.set(postId, post);
      return post;
    }

    return null;
  }

  async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const allPosts = Array.from(this.posts.values())
      .filter(post => post.authorId === userId && !post.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return allPosts;
  }

  // ===== ENGAGEMENT MANAGEMENT =====

  async likePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if already liked
    const likeKey = `like:${postId}:${userId}`;
    const alreadyLiked = await this.redis.get(likeKey);
    
    if (!alreadyLiked) {
      // Add like
      await this.redis.setex(likeKey, 86400 * 30, '1'); // 30 days
      post.engagement.likes++;
      
      // Update post
      await this.savePost(post);

      // Send notification
      if (post.authorId !== userId) {
        await this.sendNotification({
          recipientId: post.authorId,
          type: NotificationType.LIKE,
          title: 'New Like',
          message: `Someone liked your post`,
          data: { actorId: userId, postId }
        });
      }

      this.emit('post_liked', { postId, userId });
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const likeKey = `like:${postId}:${userId}`;
    const wasLiked = await this.redis.get(likeKey);
    
    if (wasLiked) {
      await this.redis.del(likeKey);
      post.engagement.likes = Math.max(0, post.engagement.likes - 1);
      await this.savePost(post);

      this.emit('post_unliked', { postId, userId });
    }
  }

  async addComment(postId: string, authorId: string, content: string, parentCommentId?: string): Promise<Comment> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const comment: Comment = {
      id: uuidv4(),
      postId,
      authorId,
      content,
      parentCommentId,
      replies: [],
      engagement: {
        likes: 0,
        dislikes: 0,
        reports: 0,
        replies: 0
      },
      moderation: {
        status: ModerationState.PENDING,
        flags: [],
        score: 0,
        warnings: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Process moderation
    await this.processCommentModeration(comment);

    // Save comment
    await this.redis.setex(`comment:${comment.id}`, 86400 * 365, JSON.stringify(comment));

    // Update post engagement
    post.engagement.comments++;
    await this.savePost(post);

    // Send notification
    if (post.authorId !== authorId) {
      await this.sendNotification({
        recipientId: post.authorId,
        type: NotificationType.COMMENT,
        title: 'New Comment',
        message: `Someone commented on your post`,
        data: { actorId: authorId, postId, commentId: comment.id }
      });
    }

    this.emit('comment_added', comment);
    return comment;
  }

  async sharePost(postId: string, userId: string, message?: string): Promise<Post> {
    const originalPost = this.posts.get(postId);
    if (!originalPost) {
      throw new Error('Post not found');
    }

    // Create share post
    const sharePost = await this.createPost(userId, {
      type: PostType.SHARE,
      content: {
        text: message,
        tags: [],
        mentions: [],
        hashtags: [],
        links: []
      },
      metadata: {
        contentLevel: originalPost.metadata.contentLevel,
        originalPostId: postId,
        ageRestricted: originalPost.metadata.ageRestricted,
        requiresSubscription: false,
        featured: false,
        pinned: false,
        sponsored: false,
        crossPosted: [],
        editHistory: []
      }
    });

    // Update original post engagement
    originalPost.engagement.shares++;
    await this.savePost(originalPost);

    // Send notification
    if (originalPost.authorId !== userId) {
      await this.sendNotification({
        recipientId: originalPost.authorId,
        type: NotificationType.SHARE,
        title: 'Post Shared',
        message: `Someone shared your post`,
        data: { actorId: userId, postId }
      });
    }

    this.emit('post_shared', { originalPostId: postId, sharePostId: sharePost.id, userId });
    return sharePost;
  }

  // ===== FEED MANAGEMENT =====

  async getUserFeed(userId: string, feedType: FeedType = FeedType.HOME, limit: number = 20): Promise<Post[]> {
    const feedKey = `feed:${userId}:${feedType}`;
    const feedData = await this.redis.get(feedKey);
    
    if (feedData) {
      const feed: ActivityFeed = JSON.parse(feedData);
      const postIds = feed.posts.slice(0, limit).map(fp => fp.postId);
      
      const posts: Post[] = [];
      for (const postId of postIds) {
        const post = await this.getPost(postId);
        if (post && !post.deletedAt && this.canUserViewPost(userId, post)) {
          posts.push(post);
        }
      }
      
      return posts;
    }

    // Generate initial feed
    return await this.generateUserFeed(userId, feedType, limit);
  }

  private async generateUserFeed(userId: string, feedType: FeedType, limit: number): Promise<Post[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    let posts: Post[] = [];

    switch (feedType) {
      case FeedType.HOME:
        posts = await this.generateHomeFeed(user, limit);
        break;
      case FeedType.FOLLOWING:
        posts = await this.generateFollowingFeed(user, limit);
        break;
      case FeedType.DISCOVER:
        posts = await this.generateDiscoverFeed(user, limit);
        break;
      case FeedType.TRENDING:
        posts = await this.generateTrendingFeed(user, limit);
        break;
      default:
        posts = await this.generateHomeFeed(user, limit);
    }

    // Cache the feed
    const feed: ActivityFeed = {
      id: uuidv4(),
      userId,
      type: feedType,
      algorithm: FeedAlgorithm.HYBRID,
      posts: posts.map(p => ({
        postId: p.id,
        score: Math.random(),
        reason: ['algorithm'],
        boosted: false,
        sponsored: p.metadata.sponsored,
        clusterId: p.clusterId,
        addedAt: new Date()
      })),
      metadata: {
        totalPosts: posts.length,
        lastRefresh: new Date(),
        refreshFrequency: 3600,
        qualityScore: 0.8,
        diversityScore: 0.7,
        relevanceScore: 0.9
      },
      lastUpdated: new Date()
    };

    await this.redis.setex(`feed:${userId}:${feedType}`, 3600, JSON.stringify(feed));

    return posts;
  }

  private async generateHomeFeed(user: User, limit: number): Promise<Post[]> {
    // Get posts from followed users
    const followingConnections = await this.getConnections(user.id, ConnectionType.FOLLOW, ConnectionStatus.ACTIVE);
    const followingIds = followingConnections.map(c => c.connectedUserId);
    
    // Add user's own posts
    followingIds.push(user.id);

    const allPosts = Array.from(this.posts.values())
      .filter(post => 
        followingIds.includes(post.authorId) &&
        !post.deletedAt &&
        post.moderation.status === ModerationState.APPROVED &&
        this.canUserViewPost(user.id, post)
      )
      .sort((a, b) => this.calculateFeedScore(b, user) - this.calculateFeedScore(a, user))
      .slice(0, limit);

    return allPosts;
  }

  private async generateFollowingFeed(user: User, limit: number): Promise<Post[]> {
    const followingConnections = await this.getConnections(user.id, ConnectionType.FOLLOW, ConnectionStatus.ACTIVE);
    const followingIds = followingConnections.map(c => c.connectedUserId);

    const posts = Array.from(this.posts.values())
      .filter(post => 
        followingIds.includes(post.authorId) &&
        !post.deletedAt &&
        post.moderation.status === ModerationState.APPROVED
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return posts;
  }

  private async generateDiscoverFeed(user: User, limit: number): Promise<Post[]> {
    // Get posts from users not followed
    const followingConnections = await this.getConnections(user.id, ConnectionType.FOLLOW, ConnectionStatus.ACTIVE);
    const followingIds = new Set(followingConnections.map(c => c.connectedUserId));

    const posts = Array.from(this.posts.values())
      .filter(post => 
        !followingIds.has(post.authorId) &&
        post.authorId !== user.id &&
        !post.deletedAt &&
        post.moderation.status === ModerationState.APPROVED &&
        this.canUserViewPost(user.id, post) &&
        this.matchesUserInterests(post, user)
      )
      .sort((a, b) => this.calculateDiscoveryScore(b, user) - this.calculateDiscoveryScore(a, user))
      .slice(0, limit);

    return posts;
  }

  private async generateTrendingFeed(user: User, limit: number): Promise<Post[]> {
    const posts = Array.from(this.posts.values())
      .filter(post => 
        !post.deletedAt &&
        post.moderation.status === ModerationState.APPROVED &&
        this.canUserViewPost(user.id, post)
      )
      .sort((a, b) => this.calculateTrendingScore(b) - this.calculateTrendingScore(a))
      .slice(0, limit);

    return posts;
  }

  // ===== STORY MANAGEMENT =====

  async createStory(authorId: string, storyData: Partial<Story>): Promise<Story> {
    const author = await this.getUser(authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    const story: Story = {
      id: uuidv4(),
      authorId,
      type: storyData.type || StoryType.PHOTO,
      content: {
        stickers: [],
        effects: [],
        ...storyData.content
      },
      visibility: storyData.visibility || ContentVisibility.FOLLOWERS,
      viewers: [],
      clusterId: author.clusterId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ...storyData
    };

    await this.redis.setex(`story:${story.id}`, 86400, JSON.stringify(story)); // 24 hours

    // Add to user's active stories
    await this.redis.sadd(`user:${authorId}:stories`, story.id);

    this.emit('story_created', story);
    return story;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    const storyData = await this.redis.get(`story:${storyId}`);
    if (!storyData) return;

    const story: Story = JSON.parse(storyData);
    
    // Check if already viewed
    const alreadyViewed = story.viewers.find(v => v.userId === viewerId);
    if (alreadyViewed) return;

    // Add viewer
    const viewer: StoryViewer = {
      userId: viewerId,
      viewedAt: new Date(),
      viewDuration: 0,
      interacted: false
    };

    story.viewers.push(viewer);
    await this.redis.setex(`story:${storyId}`, 86400, JSON.stringify(story));

    this.emit('story_viewed', { storyId, viewerId });
  }

  async getUserStories(userId: string): Promise<Story[]> {
    const storyIds = await this.redis.smembers(`user:${userId}:stories`);
    const stories: Story[] = [];

    for (const storyId of storyIds) {
      const storyData = await this.redis.get(`story:${storyId}`);
      if (storyData) {
        const story: Story = JSON.parse(storyData);
        if (story.expiresAt > new Date()) {
          stories.push(story);
        } else {
          // Remove expired story
          await this.redis.srem(`user:${userId}:stories`, storyId);
          await this.redis.del(`story:${storyId}`);
        }
      }
    }

    return stories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ===== NOTIFICATION MANAGEMENT =====

  async sendNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      recipientId: notificationData.recipientId!,
      type: notificationData.type!,
      title: notificationData.title!,
      message: notificationData.message!,
      data: {
        customData: {},
        ...notificationData.data
      },
      status: NotificationStatus.UNREAD,
      priority: notificationData.priority || NotificationPriority.NORMAL,
      clusterId: notificationData.clusterId || '',
      createdAt: new Date()
    };

    // Save notification
    await this.redis.setex(`notification:${notification.id}`, 86400 * 30, JSON.stringify(notification));
    await this.redis.lpush(`user:${notification.recipientId}:notifications`, notification.id);

    // Send real-time notification if user is online
    this.emit('notification_sent', notification);

    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const notificationIds = await this.redis.lrange(`user:${userId}:notifications`, offset, offset + limit - 1);
    const notifications: Notification[] = [];

    for (const notificationId of notificationIds) {
      const notificationData = await this.redis.get(`notification:${notificationId}`);
      if (notificationData) {
        notifications.push(JSON.parse(notificationData));
      }
    }

    return notifications;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationData = await this.redis.get(`notification:${notificationId}`);
    if (!notificationData) return;

    const notification: Notification = JSON.parse(notificationData);
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    await this.redis.setex(`notification:${notificationId}`, 86400 * 30, JSON.stringify(notification));

    this.emit('notification_read', notification);
  }

  // ===== TRENDING & DISCOVERY =====

  async getTrendingHashtags(clusterId?: string, limit: number = 10): Promise<Trend[]> {
    const trendKey = clusterId ? `trends:hashtags:${clusterId}` : 'trends:hashtags:global';
    const trends = await this.redis.zrevrange(trendKey, 0, limit - 1, 'WITHSCORES');
    
    const trendObjects: Trend[] = [];
    for (let i = 0; i < trends.length; i += 2) {
      const hashtag = trends[i];
      const score = parseFloat(trends[i + 1]);
      
      trendObjects.push({
        id: uuidv4(),
        type: TrendType.HASHTAG,
        content: hashtag,
        clusterId: clusterId || 'global',
        stats: {
          mentions: Math.floor(score),
          posts: Math.floor(score * 0.8),
          engagement: Math.floor(score * 1.2),
          growth: Math.random() * 100,
          rank: Math.floor(i / 2) + 1,
          score
        },
        language: 'en',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    return trendObjects;
  }

  async getRecommendedUsers(userId: string, limit: number = 10): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    // Get users with similar interests
    const allUsers = Array.from(this.users.values())
      .filter(u => 
        u.id !== userId &&
        u.clusterId === user.clusterId &&
        u.verification.level !== VerificationLevel.NONE
      )
      .map(u => ({
        user: u,
        score: this.calculateUserSimilarity(user, u)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.user);

    return allUsers;
  }

  // ===== MODERATION =====

  private async processContentModeration(post: Post): Promise<void> {
    // Basic moderation checks
    let score = 100;
    const flags: ModerationFlag[] = [];

    // Check for explicit keywords
    const content = post.content.text?.toLowerCase() || '';
    const explicitKeywords = ['spam', 'fake', 'scam']; // Simplified list
    
    for (const keyword of explicitKeywords) {
      if (content.includes(keyword)) {
        score -= 20;
        flags.push({
          id: uuidv4(),
          type: FlagType.SPAM,
          reason: `Contains keyword: ${keyword}`,
          reportedBy: 'system',
          reportedAt: new Date(),
          severity: FlagSeverity.MEDIUM,
          resolved: false
        });
      }
    }

    // AI Analysis (mock)
    const aiAnalysis: AIAnalysis = {
      contentSafety: 0.9,
      toxicity: 0.1,
      adultContent: post.metadata.contentLevel === ContentLevel.ADULT ? 0.8 : 0.1,
      violence: 0.1,
      hate: 0.1,
      selfHarm: 0.1,
      categories: [post.metadata.contentLevel],
      confidence: 0.85,
      language: 'en',
      sentiment: {
        overall: 0.1,
        positive: 0.7,
        negative: 0.2,
        neutral: 0.1,
        emotions: {
          joy: 0.6,
          anger: 0.1,
          fear: 0.1,
          sadness: 0.1,
          surprise: 0.1,
          disgust: 0.1
        }
      }
    };

    post.moderation = {
      status: score >= 80 ? ModerationState.APPROVED : ModerationState.FLAGGED,
      flags,
      score,
      aiAnalysis,
      warnings: []
    };
  }

  private async processCommentModeration(comment: Comment): Promise<void> {
    // Similar to post moderation but simplified
    comment.moderation = {
      status: ModerationState.APPROVED,
      flags: [],
      score: 90,
      warnings: []
    };
  }

  // ===== BACKGROUND WORKERS =====

  private startFeedGenerator(): void {
    setInterval(async () => {
      console.log('Refreshing user feeds...');
      
      // Refresh feeds for active users
      const activeUsers = Array.from(this.users.values())
        .filter(user => {
          const lastActive = user.lastActiveAt.getTime();
          const now = Date.now();
          return (now - lastActive) < 24 * 60 * 60 * 1000; // Active in last 24 hours
        });

      for (const user of activeUsers.slice(0, 100)) { // Process in batches
        try {
          await this.generateUserFeed(user.id, FeedType.HOME, 50);
        } catch (error) {
          console.error(`Error refreshing feed for user ${user.id}:`, error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private startTrendingAnalyzer(): void {
    setInterval(async () => {
      console.log('Analyzing trending content...');
      
      // Analyze hashtags from recent posts
      const recentPosts = Array.from(this.posts.values())
        .filter(post => {
          const age = Date.now() - post.createdAt.getTime();
          return age < 24 * 60 * 60 * 1000 && !post.deletedAt; // Last 24 hours
        });

      const hashtagCounts = new Map<string, number>();
      
      for (const post of recentPosts) {
        for (const hashtag of post.content.hashtags) {
          const count = hashtagCounts.get(hashtag) || 0;
          hashtagCounts.set(hashtag, count + 1);
        }
      }

      // Update trending hashtags in Redis
      for (const [hashtag, count] of hashtagCounts) {
        await this.redis.zadd('trends:hashtags:global', count, hashtag);
        await this.redis.expire('trends:hashtags:global', 24 * 60 * 60); // 24 hours
      }
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private startRecommendationEngine(): void {
    setInterval(async () => {
      console.log('Updating user recommendations...');
      
      // Update recommendations for active users
      const activeUsers = Array.from(this.users.values())
        .filter(user => {
          const lastActive = user.lastActiveAt.getTime();
          const now = Date.now();
          return (now - lastActive) < 7 * 24 * 60 * 60 * 1000; // Active in last week
        });

      for (const user of activeUsers.slice(0, 50)) {
        try {
          const recommendations = await this.getRecommendedUsers(user.id, 20);
          await this.redis.setex(
            `recommendations:${user.id}`,
            24 * 60 * 60, // 24 hours
            JSON.stringify(recommendations.map(u => u.id))
          );
        } catch (error) {
          console.error(`Error updating recommendations for user ${user.id}:`, error);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private startModerationWorker(): void {
    setInterval(async () => {
      console.log('Processing moderation queue...');
      
      // Find posts needing moderation review
      const flaggedPosts = Array.from(this.posts.values())
        .filter(post => 
          post.moderation.status === ModerationState.FLAGGED ||
          post.moderation.status === ModerationState.PENDING
        );

      for (const post of flaggedPosts.slice(0, 10)) {
        try {
          await this.processContentModeration(post);
          await this.savePost(post);
        } catch (error) {
          console.error(`Error processing moderation for post ${post.id}:`, error);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  private startAnalyticsWorker(): void {
    setInterval(async () => {
      console.log('Updating user analytics...');
      
      // Update engagement stats for users
      for (const user of this.users.values()) {
        try {
          await this.updateUserEngagementStats(user.id);
        } catch (error) {
          console.error(`Error updating analytics for user ${user.id}:`, error);
        }
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // ===== UTILITY METHODS =====

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private canUserViewPost(userId: string, post: Post): boolean {
    // Check age restrictions
    if (post.metadata.ageRestricted) {
      // Would check user's age verification
    }

    // Check subscription requirements
    if (post.metadata.requiresSubscription) {
      // Would check if user is subscribed to author
    }

    // Check content level restrictions
    const user = this.users.get(userId);
    if (user) {
      const allowedLevels = user.profile.contentPreferences
        .filter(pref => pref.enabled)
        .map(pref => pref.level);
      
      if (!allowedLevels.includes(post.metadata.contentLevel)) {
        return false;
      }
    }

    return true;
  }

  private calculateFeedScore(post: Post, user: User): number {
    let score = 0;
    
    // Recency score
    const age = Date.now() - post.createdAt.getTime();
    const ageHours = age / (1000 * 60 * 60);
    score += Math.max(0, 100 - ageHours);

    // Engagement score
    score += post.engagement.likes * 2;
    score += post.engagement.comments * 3;
    score += post.engagement.shares * 5;

    // Content preference match
    const userPreferences = user.profile.contentPreferences
      .filter(pref => pref.enabled)
      .map(pref => pref.level);
    
    if (userPreferences.includes(post.metadata.contentLevel)) {
      score += 20;
    }

    return score;
  }

  private calculateDiscoveryScore(post: Post, user: User): number {
    let score = this.calculateFeedScore(post, user);
    
    // Boost posts from users with similar interests
    const author = this.users.get(post.authorId);
    if (author) {
      score += this.calculateUserSimilarity(user, author) * 50;
    }

    return score;
  }

  private calculateTrendingScore(post: Post): number {
    const age = Date.now() - post.createdAt.getTime();
    const ageHours = age / (1000 * 60 * 60);
    
    // Trending score based on engagement velocity
    const engagementScore = post.engagement.likes + post.engagement.comments * 2 + post.engagement.shares * 3;
    const velocityScore = engagementScore / Math.max(1, ageHours);
    
    return velocityScore;
  }

  private calculateUserSimilarity(user1: User, user2: User): number {
    let similarity = 0;
    
    // Interest overlap
    const interests1 = new Set(user1.profile.interests);
    const interests2 = new Set(user2.profile.interests);
    const intersection = new Set([...interests1].filter(x => interests2.has(x)));
    const union = new Set([...interests1, ...interests2]);
    
    if (union.size > 0) {
      similarity += (intersection.size / union.size) * 100;
    }

    // Same cluster bonus
    if (user1.clusterId === user2.clusterId) {
      similarity += 20;
    }

    // Similar verification level
    if (user1.verification.level === user2.verification.level) {
      similarity += 10;
    }

    return similarity;
  }

  private matchesUserInterests(post: Post, user: User): boolean {
    // Check if post content matches user interests
    const userInterests = user.profile.interests.map(i => i.toLowerCase());
    const postTags = post.content.tags.map(t => t.toLowerCase());
    const postHashtags = post.content.hashtags.map(h => h.toLowerCase());
    
    const allPostTags = [...postTags, ...postHashtags];
    
    return userInterests.some(interest => 
      allPostTags.some(tag => tag.includes(interest) || interest.includes(tag))
    );
  }

  private getInitialConnectionStatus(type: ConnectionType): ConnectionStatus {
    switch (type) {
      case ConnectionType.FOLLOW:
        return ConnectionStatus.ACTIVE;
      case ConnectionType.FRIEND:
        return ConnectionStatus.PENDING;
      case ConnectionType.SUBSCRIBER:
        return ConnectionStatus.ACTIVE;
      default:
        return ConnectionStatus.ACTIVE;
    }
  }

  private isMutualConnectionType(type: ConnectionType): boolean {
    return type === ConnectionType.FRIEND;
  }

  private async createReverseConnection(connection: Connection): Promise<void> {
    const reverseConnection: Connection = {
      ...connection,
      id: uuidv4(),
      userId: connection.connectedUserId,
      connectedUserId: connection.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveConnection(reverseConnection);
    this.connections.set(reverseConnection.id, reverseConnection);
  }

  private async updateUserConnectionStats(fromUserId: string, toUserId: string, type: ConnectionType, action: 'add' | 'remove'): Promise<void> {
    const fromUser = await this.getUser(fromUserId);
    const toUser = await this.getUser(toUserId);
    
    if (!fromUser || !toUser) return;

    const delta = action === 'add' ? 1 : -1;

    switch (type) {
      case ConnectionType.FOLLOW:
        fromUser.stats.following += delta;
        toUser.stats.followers += delta;
        break;
      case ConnectionType.FRIEND:
        fromUser.stats.friends += delta;
        toUser.stats.friends += delta;
        break;
      case ConnectionType.SUBSCRIBER:
        fromUser.stats.subscriptions += delta;
        toUser.stats.subscribers += delta;
        break;
    }

    // Ensure stats don't go negative
    fromUser.stats.following = Math.max(0, fromUser.stats.following);
    fromUser.stats.friends = Math.max(0, fromUser.stats.friends);
    fromUser.stats.subscriptions = Math.max(0, fromUser.stats.subscriptions);

    toUser.stats.followers = Math.max(0, toUser.stats.followers);
    toUser.stats.friends = Math.max(0, toUser.stats.friends);
    toUser.stats.subscribers = Math.max(0, toUser.stats.subscribers);

    await this.updateUser(fromUserId, { stats: fromUser.stats });
    await this.updateUser(toUserId, { stats: toUser.stats });
  }

  private async updateUserEngagementStats(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const userPosts = Array.from(this.posts.values())
      .filter(post => post.authorId === userId && !post.deletedAt);

    if (userPosts.length === 0) return;

    const totalLikes = userPosts.reduce((sum, post) => sum + post.engagement.likes, 0);
    const totalComments = userPosts.reduce((sum, post) => sum + post.engagement.comments, 0);
    const totalShares = userPosts.reduce((sum, post) => sum + post.engagement.shares, 0);
    const totalViews = userPosts.reduce((sum, post) => sum + post.engagement.views, 0);

    user.stats.engagement = {
      averageLikes: totalLikes / userPosts.length,
      averageComments: totalComments / userPosts.length,
      averageShares: totalShares / userPosts.length,
      averageViews: totalViews / userPosts.length,
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0,
      reachRate: 0, // Would calculate based on unique viewers
      impressions: totalViews
    };

    await this.updateUser(userId, { stats: user.stats });
  }

  private async sendConnectionNotification(connection: Connection): Promise<void> {
    let notificationType: NotificationType;
    let title: string;
    let message: string;

    switch (connection.type) {
      case ConnectionType.FOLLOW:
        notificationType = NotificationType.FOLLOW;
        title = 'New Follower';
        message = 'Someone started following you';
        break;
      case ConnectionType.FRIEND:
        notificationType = NotificationType.FOLLOW;
        title = 'Friend Request';
        message = 'Someone sent you a friend request';
        break;
      case ConnectionType.SUBSCRIBER:
        notificationType = NotificationType.SUBSCRIPTION;
        title = 'New Subscriber';
        message = 'Someone subscribed to your content';
        break;
      default:
        return; // Don't send notification for other types
    }

    await this.sendNotification({
      recipientId: connection.connectedUserId,
      type: notificationType,
      title,
      message,
      data: {
        actorId: connection.userId,
        customData: { connectionType: connection.type }
      },
      clusterId: connection.clusterId
    });
  }

  private async initializeUserFeed(userId: string): Promise<void> {
    // Create initial empty feed
    const feed: ActivityFeed = {
      id: uuidv4(),
      userId,
      type: FeedType.HOME,
      algorithm: FeedAlgorithm.HYBRID,
      posts: [],
      metadata: {
        totalPosts: 0,
        lastRefresh: new Date(),
        refreshFrequency: 3600,
        qualityScore: 0,
        diversityScore: 0,
        relevanceScore: 0
      },
      lastUpdated: new Date()
    };

    await this.redis.setex(`feed:${userId}:${FeedType.HOME}`, 3600, JSON.stringify(feed));
  }

  private async distributeToFeeds(post: Post): Promise<void> {
    // Get author's followers
    const followerConnections = await this.getConnections(post.authorId, ConnectionType.FOLLOW, ConnectionStatus.ACTIVE);
    
    // Add post to followers' feeds (simplified)
    for (const connection of followerConnections) {
      try {
        const feedKey = `feed:${connection.userId}:${FeedType.HOME}`;
        const feedData = await this.redis.get(feedKey);
        
        if (feedData) {
          const feed: ActivityFeed = JSON.parse(feedData);
          feed.posts.unshift({
            postId: post.id,
            score: 100,
            reason: ['following'],
            boosted: false,
            sponsored: post.metadata.sponsored,
            clusterId: post.clusterId,
            addedAt: new Date()
          });
          
          // Keep feed size manageable
          feed.posts = feed.posts.slice(0, 100);
          feed.lastUpdated = new Date();
          
          await this.redis.setex(feedKey, 3600, JSON.stringify(feed));
        }
      } catch (error) {
        console.error(`Error adding post to feed for user ${connection.userId}:`, error);
      }
    }
  }

  private async removeFromFeeds(postId: string): Promise<void> {
    // This would remove the post from all feeds where it appears
    // Implementation would scan feeds and remove the post
    console.log(`Removing post ${postId} from feeds`);
  }

  // ===== DATA PERSISTENCE =====

  private async saveUser(user: User): Promise<void> {
    await this.redis.setex(`user:${user.id}`, 86400 * 7, JSON.stringify(user));
    await this.redis.sadd('users:all', user.id);
    await this.redis.sadd(`users:cluster:${user.clusterId}`, user.id);
    await this.redis.sadd(`users:type:${user.accountType}`, user.id);
  }

  private async savePost(post: Post): Promise<void> {
    await this.redis.setex(`post:${post.id}`, 86400 * 365, JSON.stringify(post));
    await this.redis.sadd(`user:${post.authorId}:posts`, post.id);
    await this.redis.sadd(`cluster:${post.clusterId}:posts`, post.id);
  }

  private async saveConnection(connection: Connection): Promise<void> {
    await this.redis.setex(`connection:${connection.id}`, 86400 * 365, JSON.stringify(connection));
    await this.redis.sadd(`user:${connection.userId}:connections:${connection.type}`, connection.id);
  }

  // ===== DEFAULT DATA GENERATORS =====

  private getDefaultProfile(): UserProfile {
    return {
      interests: [],
      languages: ['en'],
      contentPreferences: [
        { category: ContentCategory.PHOTOS, level: ContentLevel.GENERAL, enabled: true },
        { category: ContentCategory.VIDEOS, level: ContentLevel.GENERAL, enabled: true },
        { category: ContentCategory.POSTS, level: ContentLevel.GENERAL, enabled: true }
      ],
      lookingFor: [],
      customFields: {}
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      privacy: {
        profileVisibility: ProfileVisibility.PUBLIC,
        messagePermissions: MessagePermissions.FOLLOWERS,
        followPermissions: FollowPermissions.EVERYONE,
        contentVisibility: ContentVisibility.PUBLIC,
        showOnlineStatus: true,
        showLastSeen: true,
        showActivity: true,
        allowTagging: true,
        allowMentions: true,
        showInSearch: true,
        showInRecommendations: true,
        shareAnalytics: false
      },
      notifications: {
        newFollower: true,
        newSubscriber: true,
        newMessage: true,
        newComment: true,
        newLike: true,
        newShare: true,
        newMention: true,
        liveStream: true,
        contentUpdate: true,
        promotions: false,
        recommendations: true,
        digest: DigestFrequency.WEEKLY,
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false
      },
      content: {
        defaultVisibility: ContentVisibility.PUBLIC,
        allowComments: true,
        allowSharing: true,
        allowDownload: false,
        watermark: false,
        ageGating: false,
        contentWarnings: false,
        autoModeration: true,
        requireSubscription: false,
        pricingEnabled: false
      },
      discovery: {
        showInRecommendations: true,
        allowLocationBasedDiscovery: false,
        showSimilarUsers: true,
        showTrendingContent: true,
        allowCrossClusterDiscovery: true,
        ageRangeFilter: { minAge: 18, maxAge: 65, enabled: false },
        locationFilter: { countries: [], enabled: false },
        contentLevelFilter: [ContentLevel.GENERAL, ContentLevel.MATURE]
      },
      blocking: {
        blockedUsers: [],
        blockedKeywords: [],
        blockedCountries: [],
        autoBlock: {
          spamAccounts: true,
          newAccounts: false,
          unverifiedAccounts: false,
          suspiciousActivity: true
        }
      }
    };
  }

  private getDefaultVerification(): VerificationStatus {
    return {
      email: false,
      phone: false,
      identity: false,
      age: false,
      address: false,
      government: false,
      social: false,
      creator: false,
      level: VerificationLevel.NONE
    };
  }

  private getDefaultStats(): UserStats {
    return {
      followers: 0,
      following: 0,
      subscribers: 0,
      subscriptions: 0,
      friends: 0,
      posts: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      engagement: {
        averageLikes: 0,
        averageComments: 0,
        averageShares: 0,
        averageViews: 0,
        engagementRate: 0,
        reachRate: 0,
        impressions: 0
      }
    };
  }
}

// ===== CONFIGURATION INTERFACES =====

export interface SocialConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  moderation: {
    enableAI: boolean;
    autoApprove: boolean;
    strictMode: boolean;
  };
  feeds: {
    algorithm: FeedAlgorithm;
    refreshInterval: number;
    maxFeedSize: number;
  };
  content: {
    maxImageSize: number;
    maxVideoSize: number;
    allowedFormats: string[];
  };
  features: {
    enableStories: boolean;
    enableLiveStreaming: boolean;
    enablePolls: boolean;
    enableGifts: boolean;
  };
}

export interface UserSearchQuery {
  username?: string;
  displayName?: string;
  clusterId?: string;
  accountType?: AccountType;
  verified?: boolean;
  location?: string;
  minAge?: number;
  maxAge?: number;
  interests?: string[];
  limit?: number;
  offset?: number;
}

export default FanzSocialService;
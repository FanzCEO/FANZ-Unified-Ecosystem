/**
 * 🌐 FanzSocial Service - Main Entry Point
 * 
 * Export all the public interfaces, types, and the main service class
 * for easy consumption by other parts of the FANZ ecosystem.
 */

// Main service class
export { default as FanzSocialService } from './FanzSocialService';

// Export all types and interfaces
export type {
  // User types
  User,
  UserProfile,
  UserSettings,
  PrivacySettings,
  NotificationSettings,
  ContentSettings,
  DiscoverySettings,
  BlockingSettings,
  AutoBlockSettings,
  VerificationStatus,
  UserStats,
  EngagementStats,
  UserSearchQuery,
  
  // Connection types
  Connection,
  ConnectionMetadata,
  
  // Content types
  Post,
  PostContent,
  PostMetadata,
  PostEngagement,
  Comment,
  CommentEngagement,
  
  // Media types
  MediaItem,
  MediaDimensions,
  PollData,
  PollOption,
  PollSettings,
  PollResults,
  LocationData,
  GeographicCoordinates,
  LinkPreview,
  EditHistoryItem,
  
  // Story types
  Story,
  StoryContent,
  StorySticker,
  StoryEffect,
  StoryViewer,
  MusicTrack,
  
  // Live streaming types
  LiveStream,
  StreamSettings,
  StreamStats,
  
  // Feed types
  ActivityFeed,
  FeedPost,
  FeedMetadata,
  
  // Notification types
  Notification,
  NotificationData,
  
  // Moderation types
  ModerationStatus,
  ModerationFlag,
  ModerationWarning,
  AIAnalysis,
  SentimentAnalysis,
  EmotionScores,
  
  // Trending types
  Trend,
  TrendStats,
  
  // Configuration types
  SocialConfig,
  AgeRangeFilter,
  LocationFilter,
  ContentPreference,
  ReactionSummary
} from './FanzSocialService';

// Export all enums
export {
  // User enums
  AccountType,
  SubscriptionTier,
  RelationshipStatus,
  ExperienceLevel,
  ProfileVisibility,
  MessagePermissions,
  FollowPermissions,
  ContentVisibility,
  DigestFrequency,
  VerificationLevel,
  
  // Connection enums
  ConnectionType,
  ConnectionStatus,
  NotificationLevel,
  
  // Content enums
  ContentCategory,
  ContentLevel,
  PostType,
  MediaType,
  MediaQuality,
  ShowResultsWhen,
  
  // Story enums
  StoryType,
  StickerType,
  EffectType,
  
  // Live streaming enums
  StreamStatus,
  ModerationLevel,
  
  // Feed enums
  FeedType,
  FeedAlgorithm,
  
  // Notification enums
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  
  // Moderation enums
  ModerationState,
  FlagType,
  FlagSeverity,
  
  // Trending enums
  TrendType
} from './FanzSocialService';
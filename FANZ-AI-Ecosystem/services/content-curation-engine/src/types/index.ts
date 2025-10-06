// Content Curation Engine Types
// Comprehensive type definitions for the Intelligent Content Curation Engine

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  contentType: ContentType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  fileSize?: number; // in bytes
  dimensions?: {
    width: number;
    height: number;
  };
  metadata: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  isActive: boolean;
  isPremium: boolean;
  isExclusive: boolean;
  platforms: Platform[];
  qualityScore: QualityScore;
  engagementMetrics: EngagementMetrics;
  performancePredictions: PerformancePredictions;
  targetAudience: TargetAudience;
}

export interface ContentMetadata {
  originalFormat: string;
  encoding?: string;
  bitrate?: number;
  resolution?: string;
  aspectRatio?: string;
  colorSpace?: string;
  hasAudio: boolean;
  hasVideo: boolean;
  isAnimated: boolean;
  extractedText?: string;
  detectedObjects?: string[];
  faces?: FaceDetection[];
  emotions?: EmotionAnalysis[];
  nsfw: NSFWClassification;
  technicalQuality: TechnicalQualityMetrics;
}

export interface FaceDetection {
  boundingBox: BoundingBox;
  confidence: number;
  landmarks?: FaceLandmark[];
  attributes?: FaceAttributes;
}

export interface FaceLandmark {
  type: string;
  coordinates: { x: number; y: number };
}

export interface FaceAttributes {
  age?: number;
  gender?: string;
  emotion?: string;
  ethnicity?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  intensity: number;
}

export interface NSFWClassification {
  isNSFW: boolean;
  confidence: number;
  categories: NSFWCategory[];
}

export interface NSFWCategory {
  category: string;
  confidence: number;
}

export interface TechnicalQualityMetrics {
  overallScore: number;
  sharpness: number;
  contrast: number;
  brightness: number;
  colorBalance: number;
  audioQuality?: number;
  stability?: number;
  composition?: number;
}

export enum ContentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  LIVE_STREAM = 'live_stream',
  STORY = 'story',
  POST = 'post'
}

export enum Platform {
  BOYFANZ = 'boyfanz',
  GIRLFANZ = 'girlfanz',
  PUPFANZ = 'pupfanz',
  DADDYFANZ = 'daddyfanz',
  TRANSFANZ = 'transfanz',
  COUGARFANZ = 'cougarfanz',
  TABOOFANZ = 'taboofanz',
  FANZCOCK = 'fanzcock',
  FANZLAB = 'fanzlab'
}

export interface QualityScore {
  overall: number;
  technical: number;
  content: number;
  originality: number;
  relevance: number;
  engagement: number;
  creatorConsistency: number;
  audienceMatch: number;
  breakdown: QualityBreakdown;
  timestamp: Date;
}

export interface QualityBreakdown {
  visualQuality: number;
  audioQuality: number;
  contentRelevance: number;
  titleQuality: number;
  descriptionQuality: number;
  tagsRelevance: number;
  thumbnailQuality: number;
  brandConsistency: number;
}

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughRate: number;
  watchTime: number; // in seconds
  completionRate: number; // percentage
  interactionRate: number;
  retentionCurve?: RetentionPoint[];
  sentiment: SentimentAnalysis;
  reach: ReachMetrics;
  demographics: DemographicBreakdown;
}

export interface RetentionPoint {
  timeStamp: number; // in seconds
  retentionRate: number; // percentage
}

export interface SentimentAnalysis {
  overall: number; // -1 to 1
  positive: number;
  negative: number;
  neutral: number;
  keywords: SentimentKeyword[];
}

export interface SentimentKeyword {
  word: string;
  sentiment: number;
  frequency: number;
}

export interface ReachMetrics {
  organic: number;
  viral: number;
  crossPlatform: number;
  recommended: number;
  searched: number;
}

export interface DemographicBreakdown {
  ageGroups: { [ageGroup: string]: number };
  genders: { [gender: string]: number };
  locations: { [location: string]: number };
  platforms: { [platform: string]: number };
}

export interface PerformancePredictions {
  expectedViews: PredictionRange;
  expectedLikes: PredictionRange;
  expectedComments: PredictionRange;
  expectedShares: PredictionRange;
  viralProbability: number;
  peakTime: Date;
  sustainedPerformance: number;
  crossPlatformPotential: { [platform: string]: number };
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionRange {
  min: number;
  max: number;
  expected: number;
}

export interface PredictionFactor {
  factor: string;
  weight: number;
  impact: number;
}

export interface TargetAudience {
  primaryDemographics: AudienceDemographics;
  interests: string[];
  behaviors: BehaviorProfile[];
  platforms: Platform[];
  optimalTiming: OptimalTiming;
  contentPreferences: ContentPreferences;
}

export interface AudienceDemographics {
  ageRange: { min: number; max: number };
  genders: string[];
  locations: string[];
  languages: string[];
  incomeLevel?: string;
  educationLevel?: string;
}

export interface BehaviorProfile {
  behavior: string;
  frequency: number;
  intensity: number;
  context: string[];
}

export interface OptimalTiming {
  daysOfWeek: string[];
  hoursOfDay: number[];
  timezone: string;
  seasonality?: string[];
}

export interface ContentPreferences {
  types: ContentType[];
  durations: { min: number; max: number };
  styles: string[];
  themes: string[];
  nsfw: boolean;
  interactivity: string[];
}

// User Profile and Preferences Types
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  demographics: UserDemographics;
  preferences: UserPreferences;
  behaviorData: UserBehaviorData;
  engagementHistory: EngagementHistory;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  subscriptions: Subscription[];
  followedCreators: string[];
  blockedCreators: string[];
  interests: Interest[];
  personalityProfile?: PersonalityProfile;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: string;
  language: string;
  timezone: string;
  deviceTypes: string[];
  connectionSpeed?: string;
}

export interface UserPreferences {
  contentTypes: ContentType[];
  categories: string[];
  creators: string[];
  platforms: Platform[];
  maxDuration?: number;
  minQualityScore?: number;
  nsfwFilter: boolean;
  explicitConsent: boolean;
  autoplay: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  newContent: boolean;
  trending: boolean;
  recommendations: boolean;
  creatorUpdates: boolean;
  engagement: boolean;
  frequency: NotificationFrequency;
}

export enum NotificationFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

export interface PrivacyPreferences {
  shareData: boolean;
  personalizedAds: boolean;
  behaviorTracking: boolean;
  crossPlatformTracking: boolean;
  dataRetention: DataRetentionPolicy;
}

export enum DataRetentionPolicy {
  DELETE_AFTER_30_DAYS = '30_days',
  DELETE_AFTER_90_DAYS = '90_days',
  DELETE_AFTER_1_YEAR = '1_year',
  KEEP_INDEFINITELY = 'indefinitely'
}

export interface UserBehaviorData {
  sessionData: SessionData[];
  contentInteractions: ContentInteraction[];
  searchHistory: SearchQuery[];
  discoveryPatterns: DiscoveryPattern[];
  engagementPatterns: EngagementPattern[];
  consumptionHabits: ConsumptionHabits;
  socialBehavior: SocialBehavior;
}

export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  platform: Platform;
  deviceType: string;
  totalInteractions: number;
  contentViewed: string[];
  searchQueries: string[];
  timeSpentByCategory: { [category: string]: number };
}

export interface ContentInteraction {
  contentId: string;
  interactionType: InteractionType;
  timestamp: Date;
  duration?: number;
  context?: string;
  sentiment?: number;
  shareDetails?: ShareDetails;
}

export enum InteractionType {
  VIEW = 'view',
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  SAVE = 'save',
  SKIP = 'skip',
  REPORT = 'report',
  BLOCK = 'block',
  SUBSCRIBE = 'subscribe',
  PURCHASE = 'purchase'
}

export interface ShareDetails {
  platform: string;
  audience: string;
  customMessage?: string;
}

export interface SearchQuery {
  query: string;
  timestamp: Date;
  resultsViewed: number;
  resultsClicked: string[];
  refinements: string[];
  context: SearchContext;
}

export interface SearchContext {
  platform: Platform;
  category?: string;
  previousQuery?: string;
  sessionContext: string[];
}

export interface DiscoveryPattern {
  discoveryMethod: DiscoveryMethod;
  frequency: number;
  successRate: number;
  preferredTimes: number[];
  contextFactors: string[];
}

export enum DiscoveryMethod {
  RECOMMENDATIONS = 'recommendations',
  TRENDING = 'trending',
  SEARCH = 'search',
  CREATOR_FOLLOW = 'creator_follow',
  CATEGORY_BROWSE = 'category_browse',
  SOCIAL_SHARE = 'social_share',
  EXTERNAL_LINK = 'external_link'
}

export interface EngagementPattern {
  contentType: ContentType;
  engagementRate: number;
  averageWatchTime: number;
  completionRate: number;
  interactionFrequency: number;
  preferredLengths: number[];
  seasonality?: SeasonalPattern[];
}

export interface SeasonalPattern {
  period: string;
  multiplier: number;
  confidence: number;
}

export interface ConsumptionHabits {
  dailyUsage: { [day: string]: number };
  hourlyUsage: { [hour: string]: number };
  bingeWatching: boolean;
  multiPlatformUsage: boolean;
  deviceSwitching: boolean;
  contentHopping: number; // percentage
  averageSessionLength: number;
}

export interface SocialBehavior {
  shareProbability: number;
  commentProbability: number;
  likeProbability: number;
  followProbability: number;
  influenceScore: number;
  networkSize: number;
  viralityFactor: number;
}

export interface EngagementHistory {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  creatorsFollowed: number;
  subscriptionsPurchased: number;
  averageRating: number;
  favoriteCategories: string[];
  topCreators: string[];
  milestones: EngagementMilestone[];
}

export interface EngagementMilestone {
  type: string;
  achievedAt: Date;
  value: number;
  badge?: string;
}

export interface Subscription {
  creatorId: string;
  tier: string;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  price: number;
  currency: string;
  benefits: string[];
  isActive: boolean;
}

export interface Interest {
  category: string;
  weight: number;
  confidence: number;
  lastUpdated: Date;
  decay: number;
  sources: string[];
}

export interface PersonalityProfile {
  traits: { [trait: string]: number };
  preferences: { [preference: string]: number };
  riskTolerance: number;
  openness: number;
  curiosity: number;
  loyalty: number;
  socialness: number;
}

// Recommendation Types
export interface Recommendation {
  id: string;
  userId: string;
  contentId: string;
  score: number;
  confidence: number;
  reasons: RecommendationReason[];
  algorithm: RecommendationAlgorithm;
  context: RecommendationContext;
  timestamp: Date;
  expiresAt: Date;
  served: boolean;
  servedAt?: Date;
  clicked: boolean;
  clickedAt?: Date;
  feedback?: RecommendationFeedback;
}

export interface RecommendationReason {
  type: ReasonType;
  weight: number;
  description: string;
  evidence: any[];
}

export enum ReasonType {
  SIMILAR_USERS = 'similar_users',
  CONTENT_SIMILARITY = 'content_similarity',
  CREATOR_FOLLOW = 'creator_follow',
  CATEGORY_PREFERENCE = 'category_preference',
  TRENDING = 'trending',
  SEASONAL = 'seasonal',
  BEHAVIORAL = 'behavioral',
  SOCIAL = 'social'
}

export enum RecommendationAlgorithm {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  CONTENT_BASED = 'content_based',
  HYBRID = 'hybrid',
  DEEP_LEARNING = 'deep_learning',
  TRENDING_BASED = 'trending_based',
  SOCIAL_BASED = 'social_based'
}

export interface RecommendationContext {
  platform: Platform;
  deviceType: string;
  timeOfDay: number;
  dayOfWeek: string;
  userState: UserState;
  sessionContext: string[];
  locationContext?: string;
}

export enum UserState {
  BROWSING = 'browsing',
  SEARCHING = 'searching',
  BINGE_WATCHING = 'binge_watching',
  DISCOVERING = 'discovering',
  SOCIAL = 'social'
}

export interface RecommendationFeedback {
  rating?: number;
  helpful: boolean;
  reason?: string;
  timestamp: Date;
}

// Trend Detection Types
export interface TrendData {
  id: string;
  topic: string;
  hashtags: string[];
  keywords: string[];
  category: string;
  platforms: Platform[];
  startTime: Date;
  peakTime?: Date;
  currentStatus: TrendStatus;
  momentum: number;
  reach: number;
  engagement: number;
  growth: TrendGrowth;
  demographics: TrendDemographics;
  relatedContent: string[];
  sentiment: SentimentAnalysis;
  predictions: TrendPredictions;
  metadata: TrendMetadata;
}

export enum TrendStatus {
  EMERGING = 'emerging',
  GROWING = 'growing',
  PEAK = 'peak',
  DECLINING = 'declining',
  STABLE = 'stable',
  DEAD = 'dead'
}

export interface TrendGrowth {
  hourly: number;
  daily: number;
  weekly: number;
  acceleration: number;
  velocity: number;
  projected: number;
}

export interface TrendDemographics {
  ageGroups: { [ageGroup: string]: number };
  genders: { [gender: string]: number };
  locations: { [location: string]: number };
  platforms: { [platform: string]: number };
}

export interface TrendPredictions {
  peakPrediction: Date;
  durationPrediction: number; // in hours
  maxReachPrediction: number;
  viralProbability: number;
  longevityScore: number;
  crossPlatformSpread: { [platform: string]: number };
}

export interface TrendMetadata {
  originPlatform?: Platform;
  seedContent?: string[];
  influencers?: string[];
  catalysts?: string[];
  relatedTrends?: string[];
}

// ML Model Types
export interface MLModel {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  status: ModelStatus;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  lastEvaluated: Date;
  trainingData: TrainingDataInfo;
  hyperparameters: { [key: string]: any };
  performance: ModelPerformance;
  deployment: ModelDeployment;
}

export enum ModelType {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  CONTENT_BASED_FILTERING = 'content_based_filtering',
  DEEP_NEURAL_NETWORK = 'deep_neural_network',
  TRANSFORMER = 'transformer',
  CNN = 'cnn',
  RNN = 'rnn',
  LSTM = 'lstm',
  GAN = 'gan',
  REINFORCEMENT_LEARNING = 'reinforcement_learning'
}

export enum ModelStatus {
  TRAINING = 'training',
  EVALUATING = 'evaluating',
  DEPLOYED = 'deployed',
  DEPRECATED = 'deprecated',
  FAILED = 'failed'
}

export interface TrainingDataInfo {
  samples: number;
  features: number;
  lastUpdated: Date;
  quality: number;
  coverage: number;
  bias: BiasMetrics;
}

export interface BiasMetrics {
  overall: number;
  demographic: { [demographic: string]: number };
  content: { [contentType: string]: number };
  temporal: number;
}

export interface ModelPerformance {
  latency: number; // in milliseconds
  throughput: number; // requests per second
  memoryUsage: number; // in MB
  cpuUsage: number; // percentage
  gpuUsage?: number; // percentage
  errorRate: number;
  availability: number;
}

export interface ModelDeployment {
  environment: DeploymentEnvironment;
  instances: number;
  autoScaling: boolean;
  loadBalancer: boolean;
  canaryDeployment: boolean;
  rollbackEnabled: boolean;
  healthChecks: HealthCheck[];
}

export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  CANARY = 'canary'
}

export interface HealthCheck {
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  expectedStatus: number;
}

// Analytics Types
export interface AnalyticsData {
  timestamp: Date;
  platform: Platform;
  metrics: AnalyticsMetrics;
  dimensions: AnalyticsDimensions;
  segments: AnalyticsSegment[];
}

export interface AnalyticsMetrics {
  users: number;
  sessions: number;
  pageViews: number;
  contentViews: number;
  uniqueContentViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  retentionRate: number;
  conversionRate: number;
  revenue?: number;
}

export interface AnalyticsDimensions {
  timeOfDay: number;
  dayOfWeek: string;
  month: string;
  deviceType: string;
  operatingSystem: string;
  browser?: string;
  country: string;
  referrer: string;
}

export interface AnalyticsSegment {
  name: string;
  criteria: SegmentCriteria;
  size: number;
  metrics: AnalyticsMetrics;
}

export interface SegmentCriteria {
  demographics?: Partial<UserDemographics>;
  behaviors?: string[];
  preferences?: string[];
  engagement?: string[];
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  cacheHit: boolean;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

// Service Configuration Types
export interface ServiceConfig {
  port: number;
  host: string;
  environment: Environment;
  database: DatabaseConfig;
  redis: RedisConfig;
  elasticsearch: ElasticsearchConfig;
  ml: MLConfig;
  apis: ExternalAPIConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionPool: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number;
}

export interface ElasticsearchConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  index: string;
  apiVersion: string;
}

export interface MLConfig {
  tensorflowServing: string;
  pytorchServe: string;
  huggingFaceToken: string;
  modelStorage: string;
  batchSize: number;
  maxConcurrentInferences: number;
}

export interface ExternalAPIConfig {
  analyticsAPI: string;
  contentAPI: string;
  userAPI: string;
  notificationAPI: string;
  timeout: number;
  retries: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsPort: number;
  healthCheckInterval: number;
  logLevel: string;
  tracing: {
    enabled: boolean;
    serviceName: string;
    endpoint: string;
  };
}

// Export all types
export * from './models';
export * from './services';
export * from './algorithms';
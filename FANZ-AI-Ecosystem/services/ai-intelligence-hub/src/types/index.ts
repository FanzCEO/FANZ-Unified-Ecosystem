/**
 * 🧠 AI Intelligence Hub - Type Definitions
 * 
 * Comprehensive TypeScript types for the core AI processing engine
 * that powers intelligent content analysis, predictive analytics,
 * automated moderation, and creator insights.
 */

// ===== CORE AI TYPES =====

export interface AIProcessingJob {
  id: string;
  type: AIJobType;
  status: JobStatus;
  priority: JobPriority;
  input: AIJobInput;
  output?: AIJobOutput;
  metadata: JobMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: ProcessingError;
}

export enum AIJobType {
  CONTENT_ANALYSIS = 'content_analysis',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  IMAGE_ANALYSIS = 'image_analysis',
  VIDEO_ANALYSIS = 'video_analysis',
  AUDIO_ANALYSIS = 'audio_analysis',
  TEXT_GENERATION = 'text_generation',
  MODERATION = 'moderation',
  TREND_DETECTION = 'trend_detection',
  REVENUE_PREDICTION = 'revenue_prediction',
  ENGAGEMENT_PREDICTION = 'engagement_prediction',
  RECOMMENDATION_GENERATION = 'recommendation_generation'
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ===== CONTENT ANALYSIS TYPES =====

export interface ContentAnalysisRequest {
  contentId: string;
  contentType: ContentType;
  content: ContentInput;
  analysisTypes: AnalysisType[];
  options?: AnalysisOptions;
}

export interface ContentAnalysisResult {
  contentId: string;
  overallScore: number;
  qualityMetrics: QualityMetrics;
  sentimentAnalysis: SentimentAnalysis;
  topicAnalysis: TopicAnalysis;
  nsfw: NSFWAnalysis;
  moderation: ModerationResult;
  recommendations: string[];
  processingTime: number;
  confidence: number;
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MIXED_MEDIA = 'mixed_media'
}

export enum AnalysisType {
  QUALITY = 'quality',
  SENTIMENT = 'sentiment',
  TOPICS = 'topics',
  NSFW = 'nsfw',
  MODERATION = 'moderation',
  ENGAGEMENT = 'engagement',
  OPTIMIZATION = 'optimization'
}

export interface AnalysisOptions {
  detailedAnalysis?: boolean;
  includeExplanations?: boolean;
  generateRecommendations?: boolean;
  customModels?: string[];
  threshold?: number;
}

export interface QualityMetrics {
  overall: number;
  technical: TechnicalQuality;
  content: ContentQuality;
  engagement: EngagementPotential;
}

export interface TechnicalQuality {
  resolution?: number;
  audioQuality?: number;
  compression?: number;
  stability?: number;
  clarity: number;
}

export interface ContentQuality {
  originality: number;
  relevance: number;
  informativeness: number;
  entertainment: number;
  professionalism: number;
}

export interface EngagementPotential {
  predicted: number;
  factors: EngagementFactor[];
  recommendations: string[];
}

export interface EngagementFactor {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

// ===== NLP & SENTIMENT ANALYSIS =====

export interface SentimentAnalysis {
  overall: SentimentScore;
  emotions: EmotionAnalysis;
  toxicity: ToxicityAnalysis;
  language: LanguageDetection;
  entities: EntityExtraction[];
  keywords: KeywordAnalysis[];
}

export interface SentimentScore {
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  confidence: number;
  label: 'positive' | 'negative' | 'neutral';
}

export interface EmotionAnalysis {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  love: number;
  optimism: number;
  pessimism: number;
}

export interface ToxicityAnalysis {
  overall: number;
  categories: {
    harassment: number;
    hate_speech: number;
    sexually_explicit: number;
    dangerous: number;
    profanity: number;
  };
  flagged: boolean;
  confidence: number;
}

export interface LanguageDetection {
  primary: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface EntityExtraction {
  text: string;
  type: EntityType;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  EVENT = 'event',
  PRODUCT = 'product',
  MONEY = 'money',
  DATE = 'date',
  HASHTAG = 'hashtag',
  MENTION = 'mention'
}

export interface KeywordAnalysis {
  keyword: string;
  relevance: number;
  frequency: number;
  category?: string;
}

// ===== TOPIC ANALYSIS =====

export interface TopicAnalysis {
  primaryTopics: Topic[];
  categories: ContentCategory[];
  tags: string[];
  themes: Theme[];
  complexity: ComplexityAnalysis;
}

export interface Topic {
  topic: string;
  confidence: number;
  relevance: number;
  keywords: string[];
}

export interface ContentCategory {
  category: string;
  subcategory?: string;
  confidence: number;
  adultContent: boolean;
}

export interface Theme {
  theme: string;
  sentiment: number;
  prevalence: number;
  examples: string[];
}

export interface ComplexityAnalysis {
  readabilityScore: number;
  vocabularyLevel: string;
  sentenceComplexity: number;
  conceptualComplexity: number;
}

// ===== COMPUTER VISION TYPES =====

export interface ImageAnalysisResult {
  objects: DetectedObject[];
  faces: FaceAnalysis[];
  text: OCRResult[];
  scene: SceneAnalysis;
  quality: ImageQuality;
  nsfw: NSFWAnalysis;
  aesthetics: AestheticAnalysis;
  composition: CompositionAnalysis;
}

export interface DetectedObject {
  object: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: Record<string, any>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceAnalysis {
  confidence: number;
  boundingBox: BoundingBox;
  age?: AgeEstimate;
  gender?: GenderEstimate;
  emotions?: EmotionDetection;
  landmarks?: FacialLandmark[];
  quality: FaceQuality;
}

export interface AgeEstimate {
  age: number;
  range: {
    min: number;
    max: number;
  };
  confidence: number;
}

export interface GenderEstimate {
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
}

export interface EmotionDetection {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  disgusted: number;
  fearful: number;
  neutral: number;
}

export interface FacialLandmark {
  type: string;
  x: number;
  y: number;
}

export interface FaceQuality {
  sharpness: number;
  brightness: number;
  frontal: boolean;
  eyesOpen: boolean;
  mouthOpen: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface SceneAnalysis {
  scene: string;
  confidence: number;
  attributes: string[];
  indoor: boolean;
  lighting: LightingAnalysis;
}

export interface LightingAnalysis {
  brightness: number;
  contrast: number;
  naturalLight: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ImageQuality {
  overall: number;
  technical: {
    resolution: number;
    sharpness: number;
    noise: number;
    blur: number;
    exposure: number;
  };
  aesthetic: {
    composition: number;
    colorHarmony: number;
    contrast: number;
    balance: number;
  };
}

export interface AestheticAnalysis {
  overallScore: number;
  colorPalette: ColorAnalysis[];
  composition: CompositionScore;
  style: StyleAnalysis;
  mood: MoodAnalysis;
}

export interface ColorAnalysis {
  color: string;
  hex: string;
  percentage: number;
  dominance: number;
}

export interface CompositionScore {
  ruleOfThirds: number;
  symmetry: number;
  balance: number;
  leadingLines: number;
  depth: number;
}

export interface CompositionAnalysis {
  score: CompositionScore;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

export interface StyleAnalysis {
  style: string;
  confidence: number;
  characteristics: string[];
  similar: string[];
}

export interface MoodAnalysis {
  mood: string;
  intensity: number;
  emotions: string[];
  atmosphere: string;
}

// ===== VIDEO ANALYSIS TYPES =====

export interface VideoAnalysisResult {
  duration: number;
  frameRate: number;
  resolution: VideoResolution;
  scenes: SceneDetection[];
  actions: ActionRecognition[];
  highlights: VideoHighlight[];
  quality: VideoQuality;
  audio: AudioAnalysisResult;
  thumbnails: ThumbnailAnalysis[];
}

export interface VideoResolution {
  width: number;
  height: number;
  quality: 'SD' | 'HD' | '2K' | '4K' | '8K';
}

export interface SceneDetection {
  startTime: number;
  endTime: number;
  scene: string;
  confidence: number;
  keyFrames: string[];
  description: string;
}

export interface ActionRecognition {
  action: string;
  startTime: number;
  endTime: number;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface VideoHighlight {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  thumbnail: string;
  tags: string[];
}

export interface VideoQuality {
  overall: number;
  technical: {
    bitrate: number;
    encoding: string;
    compression: number;
    stability: number;
  };
  visual: {
    clarity: number;
    colorAccuracy: number;
    brightness: number;
    contrast: number;
  };
}

export interface ThumbnailAnalysis {
  timestamp: number;
  image: string;
  score: number;
  features: string[];
  recommended: boolean;
}

// ===== AUDIO ANALYSIS TYPES =====

export interface AudioAnalysisResult {
  duration: number;
  quality: AudioQuality;
  transcription?: TranscriptionResult;
  music?: MusicAnalysis;
  speech?: SpeechAnalysis;
  sound: SoundAnalysis;
  mood: AudioMood;
}

export interface AudioQuality {
  overall: number;
  technical: {
    bitrate: number;
    sampleRate: number;
    channels: number;
    compression: number;
  };
  perceptual: {
    clarity: number;
    noisiness: number;
    distortion: number;
    balance: number;
  };
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments: TranscriptionSegment[];
  language: string;
  speakers?: SpeakerDiarization[];
}

export interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
}

export interface SpeakerDiarization {
  speaker: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface MusicAnalysis {
  genre: string[];
  tempo: number;
  key: string;
  mood: string;
  energy: number;
  danceability: number;
  valence: number;
  instrumentalness: number;
}

export interface SpeechAnalysis {
  speakingRate: number;
  volume: number;
  pitch: PitchAnalysis;
  clarity: number;
  emotion: EmotionDetection;
  accent?: string;
}

export interface PitchAnalysis {
  average: number;
  range: {
    min: number;
    max: number;
  };
  variation: number;
}

export interface SoundAnalysis {
  type: 'speech' | 'music' | 'noise' | 'mixed';
  loudness: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
}

export interface AudioMood {
  valence: number;
  arousal: number;
  dominance: number;
  mood: string;
  confidence: number;
}

// ===== MODERATION TYPES =====

export interface ModerationResult {
  approved: boolean;
  violations: Violation[];
  riskScore: number;
  categories: ModerationCategory[];
  recommendations: ModerationRecommendation[];
  humanReviewRequired: boolean;
}

export interface Violation {
  type: ViolationType;
  severity: ViolationSeverity;
  confidence: number;
  description: string;
  evidence: ViolationEvidence[];
  autoAction: ModerationAction;
}

export enum ViolationType {
  ADULT_CONTENT = 'adult_content',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  COPYRIGHT = 'copyright',
  PRIVACY = 'privacy',
  MISINFORMATION = 'misinformation',
  DANGEROUS_CONTENT = 'dangerous_content'
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ViolationEvidence {
  type: 'text' | 'image' | 'audio' | 'metadata';
  location: string;
  timestamp?: number;
  confidence: number;
  description: string;
}

export enum ModerationAction {
  APPROVE = 'approve',
  WARN = 'warn',
  BLUR = 'blur',
  RESTRICT = 'restrict',
  REMOVE = 'remove',
  BAN = 'ban',
  HUMAN_REVIEW = 'human_review'
}

export interface ModerationCategory {
  category: string;
  score: number;
  threshold: number;
  passed: boolean;
}

export interface ModerationRecommendation {
  action: ModerationAction;
  reason: string;
  confidence: number;
  automated: boolean;
}

// ===== NSFW ANALYSIS =====

export interface NSFWAnalysis {
  overall: NSFWScore;
  categories: NSFWCategories;
  adultContent: boolean;
  minorSafety: MinorSafetyCheck;
  ageAppropriate: AgeAppropriateness;
}

export interface NSFWScore {
  score: number; // 0-1
  classification: 'safe' | 'questionable' | 'unsafe' | 'explicit';
  confidence: number;
}

export interface NSFWCategories {
  nudity: number;
  sexual: number;
  violence: number;
  drugs: number;
  profanity: number;
  disturbing: number;
}

export interface MinorSafetyCheck {
  safe: boolean;
  riskFactors: string[];
  protectiveActions: string[];
}

export interface AgeAppropriateness {
  rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  minimumAge: number;
  reasons: string[];
}

// ===== PREDICTIVE ANALYTICS TYPES =====

export interface RevenuePrediction {
  creatorId: string;
  contentId?: string;
  prediction: PredictionResult;
  factors: RevenueFactor[];
  recommendations: RevenueRecommendation[];
  confidence: number;
  timeframe: string;
}

export interface PredictionResult {
  amount: number;
  range: {
    min: number;
    max: number;
  };
  currency: string;
  confidence: number;
  probability: number;
}

export interface RevenueFactor {
  factor: string;
  impact: number;
  weight: number;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface RevenueRecommendation {
  action: string;
  impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToEffect: string;
  description: string;
}

export interface EngagementPrediction {
  contentId: string;
  prediction: EngagementMetrics;
  factors: EngagementFactor[];
  recommendations: EngagementRecommendation[];
  optimalTiming: OptimalTiming;
}

export interface EngagementMetrics {
  likes: PredictionResult;
  comments: PredictionResult;
  shares: PredictionResult;
  views: PredictionResult;
  engagement_rate: PredictionResult;
}

export interface EngagementRecommendation {
  category: 'content' | 'timing' | 'targeting' | 'format';
  suggestion: string;
  impact: number;
  effort: number;
}

export interface OptimalTiming {
  bestDays: string[];
  bestHours: number[];
  timezone: string;
  audience: string;
  confidence: number;
}

export interface TrendPrediction {
  trends: TrendItem[];
  emerging: EmergingTrend[];
  declining: DecliningTrend[];
  recommendations: TrendRecommendation[];
  timeframe: string;
}

export interface TrendItem {
  keyword: string;
  category: string;
  growth: number;
  volume: number;
  competition: number;
  opportunity: number;
}

export interface EmergingTrend {
  trend: string;
  growth_rate: number;
  predicted_peak: Date;
  opportunity_score: number;
  related_keywords: string[];
}

export interface DecliningTrend {
  trend: string;
  decline_rate: number;
  predicted_bottom: Date;
  alternatives: string[];
}

export interface TrendRecommendation {
  type: 'adopt' | 'avoid' | 'monitor' | 'pivot';
  trend: string;
  reason: string;
  timing: string;
  effort: number;
}

// ===== CREATOR INSIGHTS TYPES =====

export interface CreatorInsights {
  creatorId: string;
  period: AnalysisPeriod;
  performance: PerformanceInsights;
  audience: AudienceInsights;
  content: ContentInsights;
  revenue: RevenueInsights;
  recommendations: InsightRecommendation[];
  benchmarks: BenchmarkComparison;
}

export interface AnalysisPeriod {
  start: Date;
  end: Date;
  duration: string;
  comparison?: AnalysisPeriod;
}

export interface PerformanceInsights {
  overall_score: number;
  growth: GrowthMetrics;
  engagement: EngagementInsights;
  reach: ReachInsights;
  consistency: ConsistencyMetrics;
}

export interface GrowthMetrics {
  followers: TrendMetric;
  subscribers: TrendMetric;
  revenue: TrendMetric;
  engagement: TrendMetric;
}

export interface TrendMetric {
  current: number;
  previous: number;
  change: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface EngagementInsights {
  rate: number;
  quality: number;
  types: EngagementTypes;
  peak_times: TimeSlot[];
  top_content: ContentPerformance[];
}

export interface EngagementTypes {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
}

export interface TimeSlot {
  day: string;
  hour: number;
  engagement_rate: number;
  sample_size: number;
}

export interface ContentPerformance {
  contentId: string;
  type: ContentType;
  engagement_rate: number;
  reach: number;
  revenue?: number;
  performance_score: number;
}

export interface ReachInsights {
  total: number;
  unique: number;
  organic: number;
  paid?: number;
  viral_coefficient: number;
  demographics: DemographicBreakdown;
}

export interface DemographicBreakdown {
  age: AgeDistribution[];
  gender: GenderDistribution[];
  location: LocationDistribution[];
  interests: InterestDistribution[];
}

export interface AgeDistribution {
  range: string;
  percentage: number;
  engagement_rate: number;
}

export interface GenderDistribution {
  gender: string;
  percentage: number;
  engagement_rate: number;
}

export interface LocationDistribution {
  country: string;
  percentage: number;
  engagement_rate: number;
}

export interface InterestDistribution {
  interest: string;
  percentage: number;
  affinity_score: number;
}

export interface ConsistencyMetrics {
  posting_frequency: number;
  quality_consistency: number;
  engagement_stability: number;
  brand_consistency: number;
}

export interface AudienceInsights {
  demographics: DemographicBreakdown;
  behavior: BehaviorPatterns;
  preferences: ContentPreferences;
  loyalty: LoyaltyMetrics;
  growth: AudienceGrowth;
}

export interface BehaviorPatterns {
  active_times: TimeSlot[];
  session_duration: number;
  pages_per_session: number;
  bounce_rate: number;
  return_rate: number;
}

export interface ContentPreferences {
  types: ContentTypePreference[];
  topics: TopicPreference[];
  formats: FormatPreference[];
  length: LengthPreference;
}

export interface ContentTypePreference {
  type: ContentType;
  preference_score: number;
  engagement_rate: number;
}

export interface TopicPreference {
  topic: string;
  interest_score: number;
  engagement_rate: number;
}

export interface FormatPreference {
  format: string;
  preference_score: number;
  conversion_rate: number;
}

export interface LengthPreference {
  optimal_length: number;
  range: {
    min: number;
    max: number;
  };
  engagement_by_length: Array<{
    length: number;
    engagement: number;
  }>;
}

export interface LoyaltyMetrics {
  retention_rate: number;
  subscriber_lifetime: number;
  repeat_purchases: number;
  advocacy_score: number;
  churn_risk: ChurnRisk[];
}

export interface ChurnRisk {
  segment: string;
  risk_score: number;
  factors: string[];
  interventions: string[];
}

export interface AudienceGrowth {
  acquisition_rate: number;
  sources: AcquisitionSource[];
  conversion_funnel: ConversionStep[];
  seasonal_patterns: SeasonalPattern[];
}

export interface AcquisitionSource {
  source: string;
  percentage: number;
  quality_score: number;
  cost_per_acquisition?: number;
}

export interface ConversionStep {
  step: string;
  conversion_rate: number;
  drop_off_rate: number;
}

export interface SeasonalPattern {
  period: string;
  growth_multiplier: number;
  confidence: number;
}

export interface ContentInsights {
  performance: ContentPerformanceAnalysis;
  optimization: ContentOptimization;
  gaps: ContentGaps;
  themes: ThemeAnalysis;
}

export interface ContentPerformanceAnalysis {
  top_performers: ContentPerformance[];
  underperformers: ContentPerformance[];
  content_mix: ContentMixAnalysis;
  quality_trends: QualityTrend[];
}

export interface ContentMixAnalysis {
  types: Array<{
    type: ContentType;
    percentage: number;
    performance: number;
  }>;
  optimal_mix: Array<{
    type: ContentType;
    recommended_percentage: number;
  }>;
}

export interface QualityTrend {
  metric: string;
  trend: number;
  current_score: number;
  benchmark: number;
}

export interface ContentOptimization {
  opportunities: OptimizationOpportunity[];
  quick_wins: QuickWin[];
  long_term: LongTermStrategy[];
}

export interface OptimizationOpportunity {
  area: string;
  impact: number;
  effort: number;
  description: string;
  examples: string[];
}

export interface QuickWin {
  action: string;
  expected_impact: number;
  time_to_implement: string;
  difficulty: number;
}

export interface LongTermStrategy {
  strategy: string;
  impact: number;
  timeline: string;
  resources_needed: string[];
}

export interface ContentGaps {
  missing_topics: string[];
  underserved_audiences: AudienceSegment[];
  format_opportunities: string[];
  seasonal_gaps: SeasonalGap[];
}

export interface AudienceSegment {
  segment: string;
  size: number;
  engagement_potential: number;
  content_preferences: string[];
}

export interface SeasonalGap {
  period: string;
  opportunity: string;
  potential_impact: number;
}

export interface ThemeAnalysis {
  recurring_themes: Theme[];
  successful_themes: Theme[];
  trending_themes: Theme[];
  theme_evolution: ThemeEvolution[];
}

export interface ThemeEvolution {
  theme: string;
  timeline: Array<{
    period: string;
    popularity: number;
    performance: number;
  }>;
}

export interface RevenueInsights {
  total_revenue: TrendMetric;
  revenue_streams: RevenueStream[];
  pricing_analysis: PricingAnalysis;
  monetization_opportunities: MonetizationOpportunity[];
}

export interface RevenueStream {
  stream: string;
  revenue: number;
  percentage: number;
  growth: number;
  potential: number;
}

export interface PricingAnalysis {
  current_strategy: PricingStrategy;
  optimization: PricingOptimization;
  competitor_analysis: CompetitorPricing[];
}

export interface PricingStrategy {
  model: string;
  average_price: number;
  price_sensitivity: number;
  conversion_rate: number;
}

export interface PricingOptimization {
  recommended_changes: PriceChange[];
  dynamic_pricing: DynamicPricingRecommendation;
  bundling_opportunities: BundlingOpportunity[];
}

export interface PriceChange {
  item: string;
  current_price: number;
  recommended_price: number;
  expected_impact: number;
}

export interface DynamicPricingRecommendation {
  enabled: boolean;
  factors: string[];
  price_range: {
    min: number;
    max: number;
  };
  expected_lift: number;
}

export interface BundlingOpportunity {
  items: string[];
  individual_price: number;
  bundle_price: number;
  expected_conversion_lift: number;
}

export interface CompetitorPricing {
  competitor: string;
  similar_content: string;
  price: number;
  positioning: string;
}

export interface MonetizationOpportunity {
  opportunity: string;
  revenue_potential: number;
  implementation_difficulty: number;
  time_to_revenue: string;
  requirements: string[];
}

export interface InsightRecommendation {
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  expected_impact: number;
  effort_required: number;
  implementation_steps: string[];
  timeline: string;
  success_metrics: string[];
}

export enum RecommendationCategory {
  CONTENT = 'content',
  AUDIENCE = 'audience',
  MONETIZATION = 'monetization',
  ENGAGEMENT = 'engagement',
  GROWTH = 'growth',
  OPTIMIZATION = 'optimization'
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface BenchmarkComparison {
  industry: IndustryBenchmark[];
  peer_group: PeerBenchmark[];
  percentile: number;
  top_performer_gap: PerformanceGap[];
}

export interface IndustryBenchmark {
  metric: string;
  creator_value: number;
  industry_average: number;
  industry_top_10: number;
  performance: 'below' | 'at' | 'above';
}

export interface PeerBenchmark {
  metric: string;
  creator_value: number;
  peer_average: number;
  peer_best: number;
  ranking: number;
}

export interface PerformanceGap {
  metric: string;
  gap: number;
  actions_needed: string[];
  potential_impact: number;
}

// ===== SHARED UTILITY TYPES =====

export interface AIJobInput {
  contentId?: string;
  creatorId?: string;
  content?: any;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AIJobOutput {
  result: any;
  metadata: ProcessingMetadata;
  quality: QualityAssessment;
  recommendations?: string[];
}

export interface JobMetadata {
  userId: string;
  priority: JobPriority;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  dependencies?: string[];
  tags?: string[];
}

export interface ProcessingMetadata {
  processingTime: number;
  modelVersions: Record<string, string>;
  computeResources: ComputeResources;
  confidence: number;
  qualityScore: number;
}

export interface ComputeResources {
  cpu: number;
  memory: number;
  gpu?: number;
  storage: number;
}

export interface QualityAssessment {
  score: number;
  factors: QualityFactor[];
  reliability: number;
  completeness: number;
}

export interface QualityFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  stack?: string;
}

// ===== API TYPES =====

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===== CONFIG TYPES =====

export interface AIConfig {
  models: ModelConfig[];
  processing: ProcessingConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
}

export interface ModelConfig {
  name: string;
  version: string;
  provider: 'openai' | 'anthropic' | 'huggingface' | 'google' | 'aws' | 'custom';
  endpoint: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
}

export interface ProcessingConfig {
  maxConcurrentJobs: number;
  maxRetries: number;
  defaultTimeout: number;
  queueOptions: QueueConfig;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency: number;
  removeOnComplete: number;
  removeOnFail: number;
}

export interface PerformanceConfig {
  caching: CachingConfig;
  optimization: OptimizationConfig;
  monitoring: MonitoringConfig;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  compression: boolean;
}

export interface OptimizationConfig {
  batchProcessing: boolean;
  parallelProcessing: boolean;
  resourcePooling: boolean;
  loadBalancing: boolean;
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  thresholds: {
    errorRate: number;
    responseTime: number;
    queueDepth: number;
  };
  channels: string[];
}

export interface SecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthConfig;
  rateLimit: RateLimitConfig;
  audit: AuditConfig;
}

export interface EncryptionConfig {
  algorithm: string;
  keyRotation: boolean;
  atRest: boolean;
  inTransit: boolean;
}

export interface AuthConfig {
  required: boolean;
  methods: string[];
  tokenExpiry: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  requests: number;
  window: number;
  skipSuccessfulRequests: boolean;
}

export interface AuditConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  retention: number;
}
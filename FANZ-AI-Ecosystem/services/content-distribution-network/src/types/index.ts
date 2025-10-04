// Core Content Distribution Network Types for FANZ

export interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'image' | 'audio' | 'text' | 'live-stream' | 'interactive';
  format: string;
  duration?: number; // in seconds
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  tags: string[];
  category: string;
  ageRating: 'general' | 'mature' | 'adult';
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    username: string;
    platform: FanzPlatform;
    verified: boolean;
  };
  originalUrl: string;
  thumbnails: {
    small: string;
    medium: string;
    large: string;
    preview?: string; // animated preview
  };
  hasWatermark: boolean;
  encryptionLevel: 'none' | 'standard' | 'premium';
}

export type FanzPlatform = 
  | 'boyfanz' 
  | 'girlfanz' 
  | 'pupfanz' 
  | 'daddyfanz'
  | 'cougarfanz' 
  | 'transfanz'
  | 'taboofanz'
  | 'fanzcock'
  | 'fanzlab';

export interface DistributionTarget {
  platform: FanzPlatform;
  endpoint: string;
  apiKey: string;
  customization: {
    watermark?: boolean;
    branding?: string;
    aspectRatio?: string;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    format?: string;
  };
  scheduling?: {
    publishAt?: Date;
    timezone?: string;
  };
  monetization?: {
    pricing?: number;
    subscriptionTier?: string;
    payPerView?: boolean;
  };
}

export interface ContentDistributionJob {
  id: string;
  contentId: string;
  targets: DistributionTarget[];
  status: 'pending' | 'processing' | 'distributing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  errors: Array<{
    target: FanzPlatform;
    error: string;
    timestamp: Date;
  }>;
  optimizations: {
    compressionApplied: boolean;
    formatConversions: string[];
    cdnDeployment: boolean;
    edgeLocations: string[];
  };
}

export interface EdgeLocation {
  id: string;
  region: string;
  country: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number; // in GB
  usage: number; // current usage in GB
  status: 'active' | 'maintenance' | 'offline';
  performance: {
    averageLatency: number; // in ms
    bandwidth: number; // in Mbps
    uptime: number; // percentage
  };
}

export interface CDNConfiguration {
  enableGlobalDistribution: boolean;
  enableAdaptiveStreaming: boolean;
  enableEdgeComputing: boolean;
  enableRealTimeOptimization: boolean;
  maxFileSize: number; // in MB
  supportedFormats: string[];
  qualityPresets: {
    [key: string]: {
      width: number;
      height: number;
      bitrate: number;
      fps?: number;
    };
  };
  cachingRules: {
    static: number; // cache duration in seconds
    dynamic: number;
    streaming: number;
  };
  securityRules: {
    enableHotlinkProtection: boolean;
    enableTokenAuthentication: boolean;
    enableGeoBlocking: boolean;
    allowedDomains: string[];
    blockedCountries: string[];
  };
}

export interface AnalyticsMetrics {
  contentId: string;
  platform: FanzPlatform;
  totalViews: number;
  totalBandwidth: number; // in GB
  averageLoadTime: number; // in ms
  viewerLocations: Array<{
    country: string;
    views: number;
    bandwidth: number;
  }>;
  deviceTypes: {
    mobile: number;
    desktop: number;
    tablet: number;
    smartTv: number;
  };
  qualityMetrics: {
    averageBitrate: number;
    bufferingEvents: number;
    errorRate: number; // percentage
  };
  engagement: {
    averageWatchTime: number; // in seconds
    completionRate: number; // percentage
    likes: number;
    shares: number;
    comments: number;
  };
  revenue: {
    totalEarnings: number;
    viewRevenue: number;
    subscriptionRevenue: number;
    tipRevenue: number;
  };
  timestamp: Date;
}

export interface LiveStreamConfig {
  id: string;
  title: string;
  creator: string;
  platform: FanzPlatform;
  quality: 'auto' | '720p' | '1080p' | '4k';
  enableRecording: boolean;
  enableChat: boolean;
  enableDonations: boolean;
  maxViewers?: number;
  privateMode: boolean;
  scheduledStart?: Date;
  estimatedDuration?: number; // in minutes
  rtmpUrl: string;
  streamKey: string;
  playbackUrls: {
    hls: string;
    dash: string;
    webrtc: string;
  };
}

export interface ContentOptimization {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  formats: Array<{
    format: string;
    size: number;
    quality: string;
    url: string;
  }>;
  thumbnails: Array<{
    size: string;
    url: string;
    width: number;
    height: number;
  }>;
  processedAt: Date;
  processingTime: number; // in seconds
}

export interface SyndicationRule {
  id: string;
  name: string;
  description: string;
  creator: string;
  enabled: boolean;
  triggers: {
    contentType?: string[];
    tags?: string[];
    category?: string[];
    minimumQuality?: string;
    scheduleBased?: {
      frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
      time?: string; // HH:MM format
      days?: string[]; // day names
    };
  };
  targets: DistributionTarget[];
  transformations: {
    resize?: boolean;
    watermark?: boolean;
    qualityAdjustment?: string;
    formatConversion?: string;
  };
  createdAt: Date;
  lastUsed?: Date;
}
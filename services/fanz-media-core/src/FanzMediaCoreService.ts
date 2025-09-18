/**
 * 🎬 FanzMediaCore - Media Processing & CDN Service
 * 
 * Comprehensive media processing platform for the FANZ ecosystem.
 * Handles upload, processing, transcoding, watermarking, storage, and CDN delivery
 * with specialized support for adult content and creator protection.
 * 
 * Features:
 * - Multi-format media upload and validation
 * - Image processing (resize, compress, watermark, filters)
 * - Video transcoding with multiple quality levels
 * - Audio processing and optimization
 * - Thumbnail generation and preview creation
 * - Watermarking and creator protection
 * - CDN integration with global distribution
 * - Adult content classification and tagging
 * - DMCA protection and takedown automation
 * - Analytics and performance monitoring
 * - Adaptive streaming and bandwidth optimization
 * - Secure media delivery with access control
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import * as path from 'path';

// ===== TYPES & INTERFACES =====

export interface MediaFile {
  id: string;
  originalFilename: string;
  filename: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  bitrate?: number;
  format: string;
  quality: MediaQuality;
  type: MediaType;
  category: MediaCategory;
  contentLevel: ContentLevel;
  uploadedBy: string;
  clusterId: string;
  metadata: MediaMetadata;
  processing: ProcessingStatus;
  storage: StorageInfo;
  delivery: DeliveryInfo;
  protection: ProtectionInfo;
  analytics: MediaAnalytics;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive'
}

export enum MediaCategory {
  PROFILE_PICTURE = 'profile_picture',
  BANNER = 'banner',
  POST_MEDIA = 'post_media',
  STORY_MEDIA = 'story_media',
  LIVE_THUMBNAIL = 'live_thumbnail',
  CUSTOM_CONTENT = 'custom_content',
  PROMOTIONAL = 'promotional',
  VERIFICATION = 'verification'
}

export enum MediaQuality {
  THUMBNAIL = 'thumbnail',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd',
  FHD = 'fhd',
  UHD = 'uhd',
  ORIGINAL = 'original'
}

export enum ContentLevel {
  GENERAL = 'general',
  SUGGESTIVE = 'suggestive',
  MATURE = 'mature',
  ADULT = 'adult',
  EXPLICIT = 'explicit',
  EXTREME = 'extreme'
}

export interface MediaMetadata {
  originalDimensions?: MediaDimensions;
  colorSpace?: string;
  hasAudio?: boolean;
  audioChannels?: number;
  audioSampleRate?: number;
  videoCodec?: string;
  audioCodec?: string;
  orientation?: number;
  location?: GeographicLocation;
  camera?: CameraInfo;
  tags: string[];
  description?: string;
  altText?: string;
  customData: { [key: string]: any };
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface GeographicLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface CameraInfo {
  make?: string;
  model?: string;
  software?: string;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  focalLength?: number;
}

export interface ProcessingStatus {
  status: ProcessingState;
  progress: number;
  currentStep: string;
  totalSteps: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  processingTime?: number;
  variants: ProcessingVariant[];
  queue: ProcessingQueue;
}

export enum ProcessingState {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  PROCESSING = 'processing',
  TRANSCODING = 'transcoding',
  WATERMARKING = 'watermarking',
  OPTIMIZING = 'optimizing',
  UPLOADING_CDN = 'uploading_cdn',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProcessingVariant {
  id: string;
  quality: MediaQuality;
  format: string;
  dimensions?: MediaDimensions;
  size: number;
  bitrate?: number;
  fps?: number;
  url: string;
  cdnUrl: string;
  status: ProcessingState;
  processingTime: number;
  createdAt: Date;
}

export interface ProcessingQueue {
  priority: ProcessingPriority;
  estimatedTime: number;
  queuePosition: number;
  retryCount: number;
  maxRetries: number;
}

export enum ProcessingPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  REALTIME = 'realtime'
}

export interface StorageInfo {
  provider: StorageProvider;
  bucket: string;
  key: string;
  region: string;
  url: string;
  encryption: EncryptionInfo;
  backup: BackupInfo;
  lifecycle: LifecycleInfo;
}

export enum StorageProvider {
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE_BLOB = 'azure_blob',
  CLOUDFLARE_R2 = 'cloudflare_r2',
  BACKBLAZE_B2 = 'backblaze_b2',
  LOCAL = 'local'
}

export interface EncryptionInfo {
  encrypted: boolean;
  algorithm?: string;
  keyId?: string;
  iv?: string;
}

export interface BackupInfo {
  enabled: boolean;
  provider?: StorageProvider;
  lastBackup?: Date;
  retentionDays: number;
}

export interface LifecycleInfo {
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  lastAccessed: Date;
  accessCount: number;
}

export interface DeliveryInfo {
  cdnProvider: CDNProvider;
  cdnUrl: string;
  edgeLocations: string[];
  cacheSettings: CacheSettings;
  bandwidth: BandwidthInfo;
  geolocation: GeolocationSettings;
  accessControl: AccessControlSettings;
}

export enum CDNProvider {
  CLOUDFLARE = 'cloudflare',
  AMAZON_CLOUDFRONT = 'amazon_cloudfront',
  GOOGLE_CDN = 'google_cdn',
  AZURE_CDN = 'azure_cdn',
  FASTLY = 'fastly',
  KEYCDN = 'keycdn'
}

export interface CacheSettings {
  ttl: number;
  browserCache: number;
  edgeCache: number;
  customHeaders: { [key: string]: string };
}

export interface BandwidthInfo {
  totalBytes: number;
  monthlyBytes: number;
  peakBandwidth: number;
  averageBandwidth: number;
  costPerGB: number;
}

export interface GeolocationSettings {
  allowedCountries: string[];
  blockedCountries: string[];
  regionPricing: { [region: string]: number };
}

export interface AccessControlSettings {
  requireAuth: boolean;
  allowedOrigins: string[];
  hotlinkProtection: boolean;
  tokenExpiry: number;
  maxDownloads?: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
}

export interface ProtectionInfo {
  watermark: WatermarkInfo;
  dmca: DMCAInfo;
  fingerprint: FingerprintInfo;
  drm: DRMInfo;
}

export interface WatermarkInfo {
  enabled: boolean;
  type: WatermarkType;
  text?: string;
  logoUrl?: string;
  position: WatermarkPosition;
  opacity: number;
  size: number;
  color?: string;
  font?: string;
}

export enum WatermarkType {
  TEXT = 'text',
  LOGO = 'logo',
  COMBINED = 'combined',
  INVISIBLE = 'invisible'
}

export enum WatermarkPosition {
  TOP_LEFT = 'top_left',
  TOP_RIGHT = 'top_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_RIGHT = 'bottom_right',
  CENTER = 'center',
  CUSTOM = 'custom'
}

export interface DMCAInfo {
  protected: boolean;
  registrationId?: string;
  takedownRequests: TakedownRequest[];
  automaticTakedown: boolean;
  monitoringEnabled: boolean;
}

export interface TakedownRequest {
  id: string;
  requestedBy: string;
  reason: string;
  status: TakedownStatus;
  requestedAt: Date;
  processedAt?: Date;
  evidence: string[];
}

export enum TakedownStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLIED = 'complied',
  APPEALED = 'appealed'
}

export interface FingerprintInfo {
  hash: string;
  algorithm: string;
  perceptualHash?: string;
  contentId: string;
  duplicates: string[];
}

export interface DRMInfo {
  enabled: boolean;
  provider?: string;
  licenseUrl?: string;
  keyId?: string;
  contentId?: string;
}

export interface MediaAnalytics {
  views: number;
  downloads: number;
  bandwidth: number;
  geographicData: { [country: string]: number };
  deviceData: { [device: string]: number };
  referrerData: { [referrer: string]: number };
  peakConcurrent: number;
  averageViewDuration?: number;
  completionRate?: number;
  engagement: EngagementMetrics;
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  reports: number;
}

export interface ProcessingJob {
  id: string;
  mediaId: string;
  type: ProcessingJobType;
  priority: ProcessingPriority;
  parameters: ProcessingParameters;
  status: ProcessingState;
  progress: number;
  worker?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export enum ProcessingJobType {
  UPLOAD = 'upload',
  ANALYZE = 'analyze',
  THUMBNAIL = 'thumbnail',
  TRANSCODE = 'transcode',
  WATERMARK = 'watermark',
  OPTIMIZE = 'optimize',
  CDN_UPLOAD = 'cdn_upload',
  BACKUP = 'backup'
}

export interface ProcessingParameters {
  inputFormat: string;
  outputFormats: string[];
  qualities: MediaQuality[];
  watermarkSettings?: WatermarkInfo;
  compressionSettings?: CompressionSettings;
  customSettings?: { [key: string]: any };
}

export interface CompressionSettings {
  quality: number;
  method: CompressionMethod;
  lossless: boolean;
  progressive: boolean;
  stripMetadata: boolean;
}

export enum CompressionMethod {
  STANDARD = 'standard',
  OPTIMIZED = 'optimized',
  AGGRESSIVE = 'aggressive',
  LOSSLESS = 'lossless'
}

export interface StreamingManifest {
  id: string;
  mediaId: string;
  type: StreamingType;
  playlist: string;
  variants: StreamingVariant[];
  adaptiveBitrate: boolean;
  encryptionKeys?: EncryptionKey[];
  createdAt: Date;
}

export enum StreamingType {
  HLS = 'hls',
  DASH = 'dash',
  SMOOTH = 'smooth',
  WEBRTC = 'webrtc'
}

export interface StreamingVariant {
  quality: MediaQuality;
  bitrate: number;
  resolution: string;
  fps: number;
  codec: string;
  url: string;
  bandwidth: number;
}

export interface EncryptionKey {
  id: string;
  key: string;
  iv: string;
  method: string;
  uri: string;
}

export interface CDNStats {
  provider: CDNProvider;
  totalRequests: number;
  totalBandwidth: number;
  hitRatio: number;
  averageResponseTime: number;
  errorRate: number;
  topCountries: { [country: string]: number };
  topFiles: { [fileId: string]: number };
  costs: CDNCosts;
}

export interface CDNCosts {
  bandwidth: number;
  requests: number;
  storage: number;
  total: number;
  currency: string;
}

export interface ContentModerationResult {
  mediaId: string;
  safe: boolean;
  adultContent: number;
  violence: number;
  suggestive: number;
  medical: number;
  racy: number;
  spoof: number;
  categories: string[];
  flags: ModerationFlag[];
  confidence: number;
  reviewRequired: boolean;
  aiProvider: string;
  analyzedAt: Date;
}

export interface ModerationFlag {
  type: string;
  severity: number;
  reason: string;
  confidence: number;
}

// ===== MAIN MEDIA CORE SERVICE CLASS =====

export class FanzMediaCoreService extends EventEmitter {
  private redis: Redis;
  private config: MediaCoreConfig;
  private mediaFiles: Map<string, MediaFile> = new Map();
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private processingWorkers: Map<string, ProcessingWorker> = new Map();

  constructor(config: MediaCoreConfig) {
    super();
    this.config = config;

    // Initialize Redis connection
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.database || 12
    });

    // Start processing workers
    this.initializeProcessingWorkers();
    
    // Start background tasks
    this.startJobProcessor();
    this.startAnalyticsAggregator();
    this.startMaintenanceTasks();
    this.startHealthMonitoring();
  }

  // ===== MEDIA UPLOAD & MANAGEMENT =====

  async uploadMedia(uploadData: MediaUploadRequest): Promise<MediaFile> {
    const mediaId = uuidv4();
    
    // Validate upload
    await this.validateUpload(uploadData);

    const mediaFile: MediaFile = {
      id: mediaId,
      originalFilename: uploadData.originalFilename,
      filename: this.generateFilename(uploadData.originalFilename),
      mimetype: uploadData.mimetype,
      size: uploadData.size,
      format: path.extname(uploadData.originalFilename).toLowerCase().slice(1),
      quality: MediaQuality.ORIGINAL,
      type: this.detectMediaType(uploadData.mimetype),
      category: uploadData.category || MediaCategory.POST_MEDIA,
      contentLevel: uploadData.contentLevel || ContentLevel.GENERAL,
      uploadedBy: uploadData.uploadedBy,
      clusterId: uploadData.clusterId,
      metadata: {
        tags: uploadData.tags || [],
        description: uploadData.description,
        altText: uploadData.altText,
        customData: uploadData.customData || {}
      },
      processing: {
        status: ProcessingState.PENDING,
        progress: 0,
        currentStep: 'Initializing',
        totalSteps: this.calculateProcessingSteps(uploadData),
        variants: [],
        queue: {
          priority: uploadData.priority || ProcessingPriority.NORMAL,
          estimatedTime: 0,
          queuePosition: 0,
          retryCount: 0,
          maxRetries: 3
        }
      },
      storage: {
        provider: this.config.storage.provider,
        bucket: this.config.storage.bucket,
        key: this.generateStorageKey(mediaId, uploadData.originalFilename),
        region: this.config.storage.region,
        url: '',
        encryption: {
          encrypted: this.config.storage.encryption.enabled,
          algorithm: this.config.storage.encryption.algorithm
        },
        backup: {
          enabled: this.config.storage.backup.enabled,
          retentionDays: this.config.storage.backup.retentionDays
        },
        lifecycle: {
          deleteAfterDays: this.config.storage.lifecycle.deleteAfterDays,
          lastAccessed: new Date(),
          accessCount: 0
        }
      },
      delivery: {
        cdnProvider: this.config.cdn.provider,
        cdnUrl: '',
        edgeLocations: [],
        cacheSettings: {
          ttl: this.config.cdn.cacheSettings.ttl,
          browserCache: this.config.cdn.cacheSettings.browserCache,
          edgeCache: this.config.cdn.cacheSettings.edgeCache,
          customHeaders: {}
        },
        bandwidth: {
          totalBytes: 0,
          monthlyBytes: 0,
          peakBandwidth: 0,
          averageBandwidth: 0,
          costPerGB: this.config.cdn.costPerGB
        },
        geolocation: {
          allowedCountries: this.config.cdn.geolocation.allowedCountries,
          blockedCountries: this.config.cdn.geolocation.blockedCountries,
          regionPricing: {}
        },
        accessControl: {
          requireAuth: uploadData.requireAuth || false,
          allowedOrigins: this.config.cdn.allowedOrigins,
          hotlinkProtection: this.config.cdn.hotlinkProtection,
          tokenExpiry: 3600,
          ipWhitelist: [],
          ipBlacklist: []
        }
      },
      protection: {
        watermark: {
          enabled: uploadData.watermark?.enabled || false,
          type: uploadData.watermark?.type || WatermarkType.TEXT,
          text: uploadData.watermark?.text,
          position: uploadData.watermark?.position || WatermarkPosition.BOTTOM_RIGHT,
          opacity: uploadData.watermark?.opacity || 0.7,
          size: uploadData.watermark?.size || 24
        },
        dmca: {
          protected: uploadData.dmcaProtection || false,
          takedownRequests: [],
          automaticTakedown: this.config.protection.dmca.automaticTakedown,
          monitoringEnabled: this.config.protection.dmca.monitoringEnabled
        },
        fingerprint: {
          hash: '',
          algorithm: 'sha256',
          contentId: mediaId,
          duplicates: []
        },
        drm: {
          enabled: uploadData.drm?.enabled || false,
          provider: uploadData.drm?.provider,
          contentId: mediaId
        }
      },
      analytics: {
        views: 0,
        downloads: 0,
        bandwidth: 0,
        geographicData: {},
        deviceData: {},
        referrerData: {},
        peakConcurrent: 0,
        engagement: {
          likes: 0,
          shares: 0,
          comments: 0,
          saves: 0,
          reports: 0
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save media file record
    await this.saveMediaFile(mediaFile);
    this.mediaFiles.set(mediaId, mediaFile);

    // Create processing job
    const processingJob = await this.createProcessingJob(mediaFile, uploadData);

    this.emit('media_uploaded', mediaFile);

    return mediaFile;
  }

  async getMediaFile(mediaId: string): Promise<MediaFile | null> {
    // Check cache first
    const cached = this.mediaFiles.get(mediaId);
    if (cached) return cached;

    // Load from Redis
    const data = await this.redis.get(`media:${mediaId}`);
    if (data) {
      const mediaFile = JSON.parse(data);
      this.mediaFiles.set(mediaId, mediaFile);
      return mediaFile;
    }

    return null;
  }

  async updateMediaFile(mediaId: string, updates: Partial<MediaFile>): Promise<MediaFile> {
    const mediaFile = await this.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    const updatedFile = {
      ...mediaFile,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveMediaFile(updatedFile);
    this.mediaFiles.set(mediaId, updatedFile);

    this.emit('media_updated', updatedFile);
    return updatedFile;
  }

  async deleteMediaFile(mediaId: string, hard: boolean = false): Promise<void> {
    const mediaFile = await this.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    if (hard) {
      // Hard delete - remove from all storage
      await this.deleteFromStorage(mediaFile);
      await this.deleteFromCDN(mediaFile);
      await this.redis.del(`media:${mediaId}`);
      this.mediaFiles.delete(mediaId);
    } else {
      // Soft delete - mark as deleted
      mediaFile.deletedAt = new Date();
      await this.saveMediaFile(mediaFile);
    }

    this.emit('media_deleted', { mediaId, hard });
  }

  // ===== MEDIA PROCESSING =====

  async processMedia(mediaFile: MediaFile, parameters: ProcessingParameters): Promise<ProcessingJob> {
    const job: ProcessingJob = {
      id: uuidv4(),
      mediaId: mediaFile.id,
      type: ProcessingJobType.TRANSCODE,
      priority: mediaFile.processing.queue.priority,
      parameters,
      status: ProcessingState.PENDING,
      progress: 0,
      retryCount: 0,
      createdAt: new Date()
    };

    await this.saveProcessingJob(job);
    this.processingJobs.set(job.id, job);

    // Add to processing queue
    await this.addToProcessingQueue(job);

    this.emit('processing_job_created', job);
    return job;
  }

  async generateThumbnails(mediaFile: MediaFile, sizes: MediaDimensions[]): Promise<ProcessingVariant[]> {
    const variants: ProcessingVariant[] = [];

    for (const size of sizes) {
      const variant: ProcessingVariant = {
        id: uuidv4(),
        quality: this.getQualityFromSize(size),
        format: 'jpg',
        dimensions: size,
        size: 0, // Will be calculated after processing
        url: '',
        cdnUrl: '',
        status: ProcessingState.PENDING,
        processingTime: 0,
        createdAt: new Date()
      };

      variants.push(variant);
    }

    // Create thumbnail generation job
    const job = await this.processMedia(mediaFile, {
      inputFormat: mediaFile.format,
      outputFormats: ['jpg'],
      qualities: variants.map(v => v.quality),
      customSettings: { thumbnailSizes: sizes }
    });

    return variants;
  }

  async transcodeVideo(mediaFile: MediaFile, targetQualities: MediaQuality[]): Promise<ProcessingVariant[]> {
    if (mediaFile.type !== MediaType.VIDEO) {
      throw new Error('Media file is not a video');
    }

    const variants: ProcessingVariant[] = [];

    for (const quality of targetQualities) {
      const variant: ProcessingVariant = {
        id: uuidv4(),
        quality,
        format: this.config.processing.video.outputFormat,
        dimensions: this.getTargetDimensions(quality, mediaFile.width, mediaFile.height),
        bitrate: this.getTargetBitrate(quality),
        fps: this.getTargetFPS(quality),
        size: 0,
        url: '',
        cdnUrl: '',
        status: ProcessingState.PENDING,
        processingTime: 0,
        createdAt: new Date()
      };

      variants.push(variant);
    }

    // Create transcoding job
    const job = await this.processMedia(mediaFile, {
      inputFormat: mediaFile.format,
      outputFormats: [this.config.processing.video.outputFormat],
      qualities: targetQualities,
      customSettings: { variants }
    });

    return variants;
  }

  async optimizeImage(mediaFile: MediaFile, settings: CompressionSettings): Promise<ProcessingVariant> {
    if (mediaFile.type !== MediaType.IMAGE) {
      throw new Error('Media file is not an image');
    }

    const variant: ProcessingVariant = {
      id: uuidv4(),
      quality: MediaQuality.OPTIMIZED as any,
      format: this.config.processing.image.outputFormat,
      dimensions: { width: mediaFile.width!, height: mediaFile.height! },
      size: 0,
      url: '',
      cdnUrl: '',
      status: ProcessingState.PENDING,
      processingTime: 0,
      createdAt: new Date()
    };

    // Create optimization job
    const job = await this.processMedia(mediaFile, {
      inputFormat: mediaFile.format,
      outputFormats: [this.config.processing.image.outputFormat],
      qualities: [MediaQuality.HIGH],
      compressionSettings: settings
    });

    return variant;
  }

  async applyWatermark(mediaFile: MediaFile, watermarkSettings: WatermarkInfo): Promise<ProcessingVariant> {
    const variant: ProcessingVariant = {
      id: uuidv4(),
      quality: MediaQuality.HIGH,
      format: mediaFile.format,
      dimensions: { width: mediaFile.width!, height: mediaFile.height! },
      size: 0,
      url: '',
      cdnUrl: '',
      status: ProcessingState.PENDING,
      processingTime: 0,
      createdAt: new Date()
    };

    // Create watermarking job
    const job = await this.processMedia(mediaFile, {
      inputFormat: mediaFile.format,
      outputFormats: [mediaFile.format],
      qualities: [MediaQuality.HIGH],
      watermarkSettings
    });

    return variant;
  }

  // ===== STREAMING & ADAPTIVE DELIVERY =====

  async createStreamingManifest(mediaFile: MediaFile, type: StreamingType): Promise<StreamingManifest> {
    if (mediaFile.type !== MediaType.VIDEO) {
      throw new Error('Streaming manifests are only supported for videos');
    }

    const variants = await this.getStreamingVariants(mediaFile);

    const manifest: StreamingManifest = {
      id: uuidv4(),
      mediaId: mediaFile.id,
      type,
      playlist: this.generatePlaylist(type, variants),
      variants,
      adaptiveBitrate: true,
      encryptionKeys: this.config.streaming.encryption ? await this.generateEncryptionKeys() : undefined,
      createdAt: new Date()
    };

    await this.saveStreamingManifest(manifest);

    this.emit('streaming_manifest_created', manifest);
    return manifest;
  }

  async getStreamingUrl(mediaId: string, quality?: MediaQuality): Promise<string> {
    const mediaFile = await this.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    // Check access permissions
    await this.validateAccess(mediaFile);

    // Get appropriate variant
    const variant = quality 
      ? mediaFile.processing.variants.find(v => v.quality === quality)
      : mediaFile.processing.variants[0];

    if (!variant) {
      throw new Error('No suitable variant found');
    }

    // Generate secure URL with token
    const token = this.generateAccessToken(mediaFile, variant);
    const streamingUrl = `${variant.cdnUrl}?token=${token}`;

    // Track access
    await this.trackMediaAccess(mediaFile, 'stream');

    return streamingUrl;
  }

  // ===== CDN & DELIVERY =====

  async uploadToCDN(mediaFile: MediaFile, variant: ProcessingVariant): Promise<string> {
    const cdnUrl = await this.performCDNUpload(mediaFile, variant);
    
    // Update variant with CDN URL
    variant.cdnUrl = cdnUrl;
    variant.status = ProcessingState.COMPLETED;
    
    await this.updateMediaFile(mediaFile.id, {
      processing: mediaFile.processing
    });

    this.emit('cdn_upload_completed', { mediaFile, variant, cdnUrl });
    return cdnUrl;
  }

  async invalidateCDNCache(mediaId: string): Promise<void> {
    const mediaFile = await this.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    // Invalidate all variants in CDN
    const urls = [
      mediaFile.storage.url,
      ...mediaFile.processing.variants.map(v => v.cdnUrl)
    ].filter(Boolean);

    await this.performCDNInvalidation(urls);

    this.emit('cdn_cache_invalidated', { mediaId, urls });
  }

  async getCDNStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<CDNStats> {
    return await this.fetchCDNAnalytics(timeRange);
  }

  // ===== CONTENT MODERATION =====

  async moderateContent(mediaFile: MediaFile): Promise<ContentModerationResult> {
    const result: ContentModerationResult = {
      mediaId: mediaFile.id,
      safe: true,
      adultContent: 0,
      violence: 0,
      suggestive: 0,
      medical: 0,
      racy: 0,
      spoof: 0,
      categories: [],
      flags: [],
      confidence: 0,
      reviewRequired: false,
      aiProvider: this.config.moderation.aiProvider,
      analyzedAt: new Date()
    };

    // Perform AI content analysis
    const analysis = await this.performContentAnalysis(mediaFile);
    
    // Merge results
    Object.assign(result, analysis);

    // Determine if manual review is required
    result.reviewRequired = this.requiresManualReview(result);

    // Save moderation result
    await this.saveModerationResult(result);

    this.emit('content_moderated', result);
    return result;
  }

  // ===== ANALYTICS & MONITORING =====

  async getMediaAnalytics(mediaId: string, timeRange: string = '30d'): Promise<MediaAnalytics> {
    const mediaFile = await this.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    const analytics = await this.aggregateMediaAnalytics(mediaId, timeRange);
    return analytics;
  }

  async getUsageStats(userId: string): Promise<UsageStats> {
    const stats = await this.calculateUsageStats(userId);
    return stats;
  }

  async trackMediaAccess(mediaFile: MediaFile, accessType: string, metadata?: any): Promise<void> {
    const access = {
      mediaId: mediaFile.id,
      type: accessType,
      timestamp: new Date(),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      referrer: metadata?.referrer,
      country: metadata?.country,
      device: metadata?.device
    };

    await this.redis.lpush(`analytics:${mediaFile.id}:access`, JSON.stringify(access));
    
    // Update real-time stats
    mediaFile.analytics.views++;
    mediaFile.storage.lifecycle.lastAccessed = new Date();
    mediaFile.storage.lifecycle.accessCount++;
    
    await this.updateMediaFile(mediaFile.id, {
      analytics: mediaFile.analytics,
      storage: mediaFile.storage
    });

    this.emit('media_accessed', access);
  }

  // ===== PROTECTION & SECURITY =====

  async generateFingerprint(mediaFile: MediaFile): Promise<FingerprintInfo> {
    const hash = await this.calculateFileHash(mediaFile);
    const perceptualHash = await this.calculatePerceptualHash(mediaFile);
    
    const fingerprint: FingerprintInfo = {
      hash,
      algorithm: 'sha256',
      perceptualHash,
      contentId: mediaFile.id,
      duplicates: []
    };

    // Check for duplicates
    fingerprint.duplicates = await this.findDuplicates(fingerprint);

    // Update media file
    mediaFile.protection.fingerprint = fingerprint;
    await this.updateMediaFile(mediaFile.id, { protection: mediaFile.protection });

    return fingerprint;
  }

  async processDMCATakedown(takedownRequest: TakedownRequest): Promise<void> {
    // Validate request
    await this.validateTakedownRequest(takedownRequest);

    // Process automatically if configured
    if (this.config.protection.dmca.automaticTakedown) {
      await this.executeTakedown(takedownRequest);
    } else {
      // Queue for manual review
      await this.queueForReview(takedownRequest);
    }

    this.emit('dmca_takedown_requested', takedownRequest);
  }

  // ===== BACKGROUND WORKERS & PROCESSING =====

  private async initializeProcessingWorkers(): Promise<void> {
    const workerCount = this.config.processing.workers.count;
    
    for (let i = 0; i < workerCount; i++) {
      const worker: ProcessingWorker = {
        id: `worker-${i}`,
        type: 'general',
        status: 'idle',
        currentJob: null,
        processedJobs: 0,
        errorCount: 0,
        startedAt: new Date()
      };

      this.processingWorkers.set(worker.id, worker);
    }

    console.log(`Initialized ${workerCount} processing workers`);
  }

  private startJobProcessor(): void {
    setInterval(async () => {
      await this.processJobQueue();
    }, 5000); // Check every 5 seconds
  }

  private async processJobQueue(): Promise<void> {
    const idleWorkers = Array.from(this.processingWorkers.values())
      .filter(w => w.status === 'idle');

    if (idleWorkers.length === 0) return;

    // Get pending jobs ordered by priority
    const pendingJobs = await this.getPendingJobs(idleWorkers.length);

    for (let i = 0; i < Math.min(idleWorkers.length, pendingJobs.length); i++) {
      const worker = idleWorkers[i];
      const job = pendingJobs[i];

      await this.assignJobToWorker(worker, job);
    }
  }

  private async assignJobToWorker(worker: ProcessingWorker, job: ProcessingJob): Promise<void> {
    worker.status = 'busy';
    worker.currentJob = job.id;
    job.worker = worker.id;
    job.status = ProcessingState.PROCESSING;
    job.startedAt = new Date();

    try {
      await this.executeProcessingJob(job);
      
      job.status = ProcessingState.COMPLETED;
      job.completedAt = new Date();
      worker.processedJobs++;
      
      this.emit('processing_job_completed', job);
    } catch (error) {
      job.status = ProcessingState.FAILED;
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.retryCount++;
      worker.errorCount++;

      // Retry if under limit
      if (job.retryCount < job.parameters.customSettings?.maxRetries || 3) {
        job.status = ProcessingState.PENDING;
        await this.addToProcessingQueue(job);
      }

      this.emit('processing_job_failed', job);
    } finally {
      worker.status = 'idle';
      worker.currentJob = null;
      await this.saveProcessingJob(job);
    }
  }

  private async executeProcessingJob(job: ProcessingJob): Promise<void> {
    const mediaFile = await this.getMediaFile(job.mediaId);
    if (!mediaFile) {
      throw new Error('Media file not found');
    }

    switch (job.type) {
      case ProcessingJobType.ANALYZE:
        await this.analyzeMedia(mediaFile);
        break;
      case ProcessingJobType.THUMBNAIL:
        await this.generateThumbnailsJob(mediaFile, job);
        break;
      case ProcessingJobType.TRANSCODE:
        await this.transcodeVideoJob(mediaFile, job);
        break;
      case ProcessingJobType.WATERMARK:
        await this.applyWatermarkJob(mediaFile, job);
        break;
      case ProcessingJobType.OPTIMIZE:
        await this.optimizeMediaJob(mediaFile, job);
        break;
      case ProcessingJobType.CDN_UPLOAD:
        await this.uploadToCDNJob(mediaFile, job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private startAnalyticsAggregator(): void {
    setInterval(async () => {
      await this.aggregateAnalytics();
    }, 60000); // Every minute
  }

  private async aggregateAnalytics(): Promise<void> {
    // Aggregate media access data
    const mediaIds = Array.from(this.mediaFiles.keys());
    
    for (const mediaId of mediaIds.slice(0, 100)) { // Process in batches
      try {
        await this.aggregateMediaAnalytics(mediaId, '1h');
      } catch (error) {
        console.error(`Error aggregating analytics for media ${mediaId}:`, error);
      }
    }
  }

  private startMaintenanceTasks(): void {
    // Run daily maintenance
    setInterval(async () => {
      await this.performMaintenance();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  private async performMaintenance(): Promise<void> {
    console.log('Starting maintenance tasks...');

    // Clean up old analytics data
    await this.cleanupOldAnalytics();

    // Archive old files
    await this.archiveOldFiles();

    // Update CDN cache settings
    await this.updateCDNCache();

    // Generate usage reports
    await this.generateUsageReports();

    console.log('Maintenance tasks completed');
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.monitorHealth();
    }, 30000); // Every 30 seconds
  }

  private async monitorHealth(): Promise<void> {
    const health = {
      timestamp: new Date(),
      workers: {
        total: this.processingWorkers.size,
        idle: Array.from(this.processingWorkers.values()).filter(w => w.status === 'idle').length,
        busy: Array.from(this.processingWorkers.values()).filter(w => w.status === 'busy').length
      },
      queue: {
        pending: await this.getPendingJobCount(),
        processing: await this.getProcessingJobCount(),
        failed: await this.getFailedJobCount()
      },
      storage: {
        totalFiles: this.mediaFiles.size,
        totalSize: await this.calculateTotalStorageUsage()
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };

    await this.redis.setex('mediacore:health', 60, JSON.stringify(health));
    this.emit('health_update', health);
  }

  // ===== UTILITY METHODS =====

  private async validateUpload(uploadData: MediaUploadRequest): Promise<void> {
    // Check file size
    if (uploadData.size > this.config.upload.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed: ${this.config.upload.maxFileSize} bytes`);
    }

    // Check file type
    if (!this.config.upload.allowedTypes.includes(uploadData.mimetype)) {
      throw new Error(`File type not allowed: ${uploadData.mimetype}`);
    }

    // Check user quota
    const userUsage = await this.getUserStorageUsage(uploadData.uploadedBy);
    if (userUsage.totalSize + uploadData.size > userUsage.quota) {
      throw new Error('Storage quota exceeded');
    }
  }

  private detectMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) return MediaType.IMAGE;
    if (mimetype.startsWith('video/')) return MediaType.VIDEO;
    if (mimetype.startsWith('audio/')) return MediaType.AUDIO;
    if (mimetype.includes('pdf') || mimetype.includes('document')) return MediaType.DOCUMENT;
    return MediaType.ARCHIVE;
  }

  private generateFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}${ext}`;
  }

  private generateStorageKey(mediaId: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `media/${year}/${month}/${day}/${mediaId}/${filename}`;
  }

  private calculateProcessingSteps(uploadData: MediaUploadRequest): number {
    let steps = 2; // Upload + Analysis
    
    if (uploadData.generateThumbnails) steps += 1;
    if (uploadData.transcode) steps += 1;
    if (uploadData.watermark?.enabled) steps += 1;
    if (uploadData.optimize) steps += 1;
    
    return steps;
  }

  private getQualityFromSize(dimensions: MediaDimensions): MediaQuality {
    const pixels = dimensions.width * dimensions.height;
    
    if (pixels <= 90000) return MediaQuality.THUMBNAIL; // ~300x300
    if (pixels <= 640000) return MediaQuality.LOW; // ~800x600
    if (pixels <= 2073600) return MediaQuality.MEDIUM; // ~1440x1080
    if (pixels <= 8294400) return MediaQuality.HIGH; // ~2880x2160
    
    return MediaQuality.HD;
  }

  private getTargetDimensions(quality: MediaQuality, originalWidth?: number, originalHeight?: number): MediaDimensions {
    const aspectRatio = originalWidth && originalHeight ? originalWidth / originalHeight : 16/9;
    
    const qualityMap = {
      [MediaQuality.THUMBNAIL]: { width: 300, height: Math.round(300 / aspectRatio) },
      [MediaQuality.LOW]: { width: 720, height: Math.round(720 / aspectRatio) },
      [MediaQuality.MEDIUM]: { width: 1280, height: Math.round(1280 / aspectRatio) },
      [MediaQuality.HIGH]: { width: 1920, height: Math.round(1920 / aspectRatio) },
      [MediaQuality.HD]: { width: 2560, height: Math.round(2560 / aspectRatio) },
      [MediaQuality.FHD]: { width: 3840, height: Math.round(3840 / aspectRatio) },
      [MediaQuality.UHD]: { width: 7680, height: Math.round(7680 / aspectRatio) },
      [MediaQuality.ORIGINAL]: { width: originalWidth || 1920, height: originalHeight || 1080 }
    };
    
    return qualityMap[quality] || qualityMap[MediaQuality.HIGH];
  }

  private getTargetBitrate(quality: MediaQuality): number {
    const bitrateMap = {
      [MediaQuality.THUMBNAIL]: 500,
      [MediaQuality.LOW]: 1500,
      [MediaQuality.MEDIUM]: 3000,
      [MediaQuality.HIGH]: 6000,
      [MediaQuality.HD]: 12000,
      [MediaQuality.FHD]: 25000,
      [MediaQuality.UHD]: 50000,
      [MediaQuality.ORIGINAL]: 0
    };
    
    return bitrateMap[quality] || 6000;
  }

  private getTargetFPS(quality: MediaQuality): number {
    const fpsMap = {
      [MediaQuality.THUMBNAIL]: 15,
      [MediaQuality.LOW]: 24,
      [MediaQuality.MEDIUM]: 30,
      [MediaQuality.HIGH]: 30,
      [MediaQuality.HD]: 60,
      [MediaQuality.FHD]: 60,
      [MediaQuality.UHD]: 60,
      [MediaQuality.ORIGINAL]: 0
    };
    
    return fpsMap[quality] || 30;
  }

  private generateAccessToken(mediaFile: MediaFile, variant?: ProcessingVariant): string {
    const payload = {
      mediaId: mediaFile.id,
      variantId: variant?.id,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000)
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private generatePlaylist(type: StreamingType, variants: StreamingVariant[]): string {
    // Generate HLS/DASH playlist content
    return `#EXTM3U\n#EXT-X-VERSION:3\n${variants.map(v => 
      `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${v.resolution}\n${v.url}`
    ).join('\n')}`;
  }

  // ===== DATA PERSISTENCE =====

  private async saveMediaFile(mediaFile: MediaFile): Promise<void> {
    await this.redis.setex(`media:${mediaFile.id}`, 86400 * 365, JSON.stringify(mediaFile));
    await this.redis.sadd(`user:${mediaFile.uploadedBy}:media`, mediaFile.id);
    await this.redis.sadd(`cluster:${mediaFile.clusterId}:media`, mediaFile.id);
    await this.redis.sadd(`media:type:${mediaFile.type}`, mediaFile.id);
  }

  private async saveProcessingJob(job: ProcessingJob): Promise<void> {
    await this.redis.setex(`job:${job.id}`, 86400 * 7, JSON.stringify(job));
    await this.redis.sadd(`media:${job.mediaId}:jobs`, job.id);
  }

  private async saveStreamingManifest(manifest: StreamingManifest): Promise<void> {
    await this.redis.setex(`manifest:${manifest.id}`, 86400 * 30, JSON.stringify(manifest));
    await this.redis.set(`media:${manifest.mediaId}:manifest:${manifest.type}`, manifest.id);
  }

  private async saveModerationResult(result: ContentModerationResult): Promise<void> {
    await this.redis.setex(`moderation:${result.mediaId}`, 86400 * 90, JSON.stringify(result));
  }

  // ===== PLACEHOLDER IMPLEMENTATIONS =====
  // These would be implemented with actual cloud services, FFmpeg, etc.

  private async createProcessingJob(mediaFile: MediaFile, uploadData: MediaUploadRequest): Promise<ProcessingJob> {
    // Implementation would create actual processing pipeline
    return {} as ProcessingJob;
  }

  private async addToProcessingQueue(job: ProcessingJob): Promise<void> {
    await this.redis.lpush(`queue:${job.priority}`, job.id);
  }

  private async getPendingJobs(limit: number): Promise<ProcessingJob[]> {
    // Implementation would fetch from Redis queues
    return [];
  }

  private async performCDNUpload(mediaFile: MediaFile, variant: ProcessingVariant): Promise<string> {
    // Implementation would upload to actual CDN
    return `https://cdn.fanz.com/${mediaFile.id}/${variant.id}`;
  }

  private async performCDNInvalidation(urls: string[]): Promise<void> {
    // Implementation would invalidate CDN cache
  }

  private async fetchCDNAnalytics(timeRange: string): Promise<CDNStats> {
    // Implementation would fetch from CDN provider API
    return {} as CDNStats;
  }

  private async performContentAnalysis(mediaFile: MediaFile): Promise<Partial<ContentModerationResult>> {
    // Implementation would use AI services like Google Vision API, Amazon Rekognition
    return {
      safe: true,
      adultContent: 0.1,
      confidence: 0.95
    };
  }

  private async analyzeMedia(mediaFile: MediaFile): Promise<void> {
    // Implementation would extract metadata, generate previews
  }

  private async generateThumbnailsJob(mediaFile: MediaFile, job: ProcessingJob): Promise<void> {
    // Implementation would use FFmpeg or similar
  }

  private async transcodeVideoJob(mediaFile: MediaFile, job: ProcessingJob): Promise<void> {
    // Implementation would use FFmpeg for video transcoding
  }

  private async applyWatermarkJob(mediaFile: MediaFile, job: ProcessingJob): Promise<void> {
    // Implementation would apply watermarks using image/video processing
  }

  private async optimizeMediaJob(mediaFile: MediaFile, job: ProcessingJob): Promise<void> {
    // Implementation would optimize file size and quality
  }

  private async uploadToCDNJob(mediaFile: MediaFile, job: ProcessingJob): Promise<void> {
    // Implementation would handle CDN upload
  }

  private async calculateFileHash(mediaFile: MediaFile): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  private async calculatePerceptualHash(mediaFile: MediaFile): Promise<string> {
    return crypto.randomBytes(16).toString('hex');
  }

  private async findDuplicates(fingerprint: FingerprintInfo): Promise<string[]> {
    return [];
  }

  private async validateTakedownRequest(request: TakedownRequest): Promise<void> {
    // Implementation would validate DMCA takedown request
  }

  private async executeTakedown(request: TakedownRequest): Promise<void> {
    // Implementation would remove content
  }

  private async queueForReview(request: TakedownRequest): Promise<void> {
    // Implementation would queue for manual review
  }

  private async validateAccess(mediaFile: MediaFile): Promise<void> {
    // Implementation would check user permissions
  }

  private async getStreamingVariants(mediaFile: MediaFile): Promise<StreamingVariant[]> {
    return [];
  }

  private async generateEncryptionKeys(): Promise<EncryptionKey[]> {
    return [];
  }

  private async aggregateMediaAnalytics(mediaId: string, timeRange: string): Promise<MediaAnalytics> {
    return {} as MediaAnalytics;
  }

  private async calculateUsageStats(userId: string): Promise<UsageStats> {
    return {} as UsageStats;
  }

  private async getUserStorageUsage(userId: string): Promise<{ totalSize: number; quota: number }> {
    return { totalSize: 0, quota: 10 * 1024 * 1024 * 1024 }; // 10GB default
  }

  private async deleteFromStorage(mediaFile: MediaFile): Promise<void> {
    // Implementation would delete from cloud storage
  }

  private async deleteFromCDN(mediaFile: MediaFile): Promise<void> {
    // Implementation would delete from CDN
  }

  private requiresManualReview(result: ContentModerationResult): boolean {
    return result.adultContent > 0.8 || result.violence > 0.7 || result.flags.length > 0;
  }

  private async getPendingJobCount(): Promise<number> {
    return 0;
  }

  private async getProcessingJobCount(): Promise<number> {
    return 0;
  }

  private async getFailedJobCount(): Promise<number> {
    return 0;
  }

  private async calculateTotalStorageUsage(): Promise<number> {
    return 0;
  }

  private async cleanupOldAnalytics(): Promise<void> {
    // Implementation would clean up old analytics data
  }

  private async archiveOldFiles(): Promise<void> {
    // Implementation would archive old files
  }

  private async updateCDNCache(): Promise<void> {
    // Implementation would update CDN cache settings
  }

  private async generateUsageReports(): Promise<void> {
    // Implementation would generate usage reports
  }
}

// ===== CONFIGURATION INTERFACES =====

export interface MediaCoreConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    tempDir: string;
  };
  storage: {
    provider: StorageProvider;
    bucket: string;
    region: string;
    encryption: {
      enabled: boolean;
      algorithm: string;
    };
    backup: {
      enabled: boolean;
      retentionDays: number;
    };
    lifecycle: {
      archiveAfterDays?: number;
      deleteAfterDays?: number;
    };
  };
  cdn: {
    provider: CDNProvider;
    endpoint: string;
    cacheSettings: {
      ttl: number;
      browserCache: number;
      edgeCache: number;
    };
    geolocation: {
      allowedCountries: string[];
      blockedCountries: string[];
    };
    allowedOrigins: string[];
    hotlinkProtection: boolean;
    costPerGB: number;
  };
  processing: {
    workers: {
      count: number;
      maxConcurrent: number;
    };
    image: {
      outputFormat: string;
      quality: number;
      enableOptimization: boolean;
    };
    video: {
      outputFormat: string;
      qualities: MediaQuality[];
      enableHardwareAcceleration: boolean;
    };
    audio: {
      outputFormat: string;
      bitrates: number[];
    };
  };
  streaming: {
    enabled: boolean;
    formats: StreamingType[];
    encryption: boolean;
    adaptiveBitrate: boolean;
  };
  protection: {
    watermark: {
      defaultEnabled: boolean;
      defaultPosition: WatermarkPosition;
      defaultOpacity: number;
    };
    dmca: {
      enabled: boolean;
      automaticTakedown: boolean;
      monitoringEnabled: boolean;
    };
    drm: {
      enabled: boolean;
      provider: string;
    };
  };
  moderation: {
    enabled: boolean;
    aiProvider: string;
    autoReject: boolean;
    confidenceThreshold: number;
  };
  analytics: {
    enabled: boolean;
    retentionDays: number;
    aggregationInterval: number;
  };
}

export interface MediaUploadRequest {
  originalFilename: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  clusterId: string;
  category?: MediaCategory;
  contentLevel?: ContentLevel;
  tags?: string[];
  description?: string;
  altText?: string;
  customData?: { [key: string]: any };
  priority?: ProcessingPriority;
  generateThumbnails?: boolean;
  transcode?: boolean;
  optimize?: boolean;
  watermark?: Partial<WatermarkInfo>;
  requireAuth?: boolean;
  drm?: {
    enabled: boolean;
    provider?: string;
  };
  dmcaProtection?: boolean;
}

export interface ProcessingWorker {
  id: string;
  type: string;
  status: 'idle' | 'busy' | 'error';
  currentJob: string | null;
  processedJobs: number;
  errorCount: number;
  startedAt: Date;
}

export interface UsageStats {
  totalFiles: number;
  totalSize: number;
  bandwidth: number;
  requests: number;
  costs: {
    storage: number;
    bandwidth: number;
    processing: number;
    total: number;
  };
  byType: {
    [type: string]: {
      count: number;
      size: number;
    };
  };
}

export default FanzMediaCoreService;
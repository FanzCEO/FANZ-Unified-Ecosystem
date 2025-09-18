/**
 * 🎬 FanzMediaCore Service - Main Entry Point
 * 
 * Export all the public interfaces, types, and the main service class
 * for easy consumption by other parts of the FANZ ecosystem.
 */

// Main service class
export { default as FanzMediaCoreService } from './FanzMediaCoreService';

// Export all types and interfaces
export type {
  // Core media types
  MediaFile,
  MediaMetadata,
  MediaDimensions,
  GeographicLocation,
  CameraInfo,
  MediaAnalytics,
  EngagementMetrics,
  MediaUploadRequest,
  UsageStats,

  // Processing types
  ProcessingStatus,
  ProcessingVariant,
  ProcessingQueue,
  ProcessingJob,
  ProcessingParameters,
  ProcessingWorker,
  CompressionSettings,

  // Storage types
  StorageInfo,
  EncryptionInfo,
  BackupInfo,
  LifecycleInfo,

  // Delivery types
  DeliveryInfo,
  CacheSettings,
  BandwidthInfo,
  GeolocationSettings,
  AccessControlSettings,

  // Protection types
  ProtectionInfo,
  WatermarkInfo,
  DMCAInfo,
  TakedownRequest,
  FingerprintInfo,
  DRMInfo,

  // Streaming types
  StreamingManifest,
  StreamingVariant,
  EncryptionKey,

  // CDN types
  CDNStats,
  CDNCosts,

  // Moderation types
  ContentModerationResult,
  ModerationFlag,

  // Configuration types
  MediaCoreConfig
} from './FanzMediaCoreService';

// Export all enums
export {
  // Media enums
  MediaType,
  MediaCategory,
  MediaQuality,
  ContentLevel,

  // Processing enums
  ProcessingState,
  ProcessingPriority,
  ProcessingJobType,
  CompressionMethod,

  // Storage enums
  StorageProvider,

  // CDN enums
  CDNProvider,

  // Watermark enums
  WatermarkType,
  WatermarkPosition,

  // DMCA enums
  TakedownStatus,

  // Streaming enums
  StreamingType
} from './FanzMediaCoreService';
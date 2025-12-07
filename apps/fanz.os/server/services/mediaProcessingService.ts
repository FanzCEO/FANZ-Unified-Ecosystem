import { Request, Response } from 'express';
import { ObjectStorageService } from '../objectStorage';
import { db } from '../db';
import { posts, mediaAssets } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface MediaProcessingJob {
  id: string;
  userId: string;
  originalFile: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  processedFiles: ProcessedMediaFile[];
  metadata: MediaMetadata;
  uploadSpeed?: number;
  processingTime?: number;
}

export interface ProcessedMediaFile {
  quality: 'thumbnail' | 'low' | 'medium' | 'high' | 'original';
  format: string;
  size: number;
  dimensions: { width: number; height: number };
  url: string;
  bitrate?: number;
  duration?: number;
}

export interface MediaMetadata {
  originalSize: number;
  originalFormat: string;
  mediaType: 'image' | 'video' | 'audio';
  duration?: number;
  dimensions?: { width: number; height: number };
  framerate?: number;
  bitrate?: number;
  codec?: string;
  compressionRatio?: number;
  qualityScore?: number;
}

export interface UploadOptimization {
  chunkSize: number;
  parallelUploads: number;
  compressionLevel: number;
  qualityTarget: number;
  adaptiveBitrate: boolean;
}

export class MediaProcessingService {
  private processingQueue: Map<string, MediaProcessingJob> = new Map();
  private objectStorage: ObjectStorageService;

  constructor() {
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Initiate media processing with upload optimization
   */
  async processMedia(
    file: Express.Multer.File, 
    userId: string, 
    options: Partial<UploadOptimization> = {}
  ): Promise<MediaProcessingJob> {
    const jobId = randomUUID();
    const startTime = Date.now();
    
    // Analyze file to determine optimal processing strategy
    const metadata = await this.analyzeMediaFile(file);
    const optimization = this.getOptimalSettings(metadata, options);
    
    const job: MediaProcessingJob = {
      id: jobId,
      userId,
      originalFile: file.filename,
      status: 'queued',
      progress: 0,
      processedFiles: [],
      metadata,
      uploadSpeed: 0,
      processingTime: 0
    };

    this.processingQueue.set(jobId, job);
    
    // Start processing asynchronously
    this.processMediaAsync(job, file, optimization);
    
    return job;
  }

  /**
   * Analyze media file to extract metadata and determine processing needs
   */
  private async analyzeMediaFile(file: Express.Multer.File): Promise<MediaMetadata> {
    const metadata: MediaMetadata = {
      originalSize: file.size,
      originalFormat: file.mimetype,
      mediaType: this.getMediaType(file.mimetype)
    };

    // In production, this would use FFmpeg or similar tool for detailed analysis
    if (metadata.mediaType === 'video') {
      // Mock video analysis - in production use FFprobe
      metadata.duration = 120; // seconds
      metadata.dimensions = { width: 1920, height: 1080 };
      metadata.framerate = 30;
      metadata.bitrate = 5000; // kbps
      metadata.codec = 'h264';
    } else if (metadata.mediaType === 'image') {
      // Mock image analysis
      metadata.dimensions = { width: 1920, height: 1080 };
    } else if (metadata.mediaType === 'audio') {
      // Mock audio analysis
      metadata.duration = 180;
      metadata.bitrate = 320; // kbps
    }

    // Calculate quality score based on resolution, bitrate, and file size
    metadata.qualityScore = this.calculateQualityScore(metadata);
    
    return metadata;
  }

  /**
   * Determine optimal processing settings based on file analysis
   */
  private getOptimalSettings(
    metadata: MediaMetadata, 
    userOptions: Partial<UploadOptimization>
  ): UploadOptimization {
    const defaults: UploadOptimization = {
      chunkSize: 1024 * 1024, // 1MB chunks
      parallelUploads: 3,
      compressionLevel: 7,
      qualityTarget: 85,
      adaptiveBitrate: true
    };

    // Adjust based on file size and type
    if (metadata.originalSize > 100 * 1024 * 1024) { // >100MB
      defaults.chunkSize = 5 * 1024 * 1024; // 5MB chunks
      defaults.parallelUploads = 5;
    }

    if (metadata.mediaType === 'video' && metadata.duration && metadata.duration > 300) {
      defaults.compressionLevel = 8; // Higher compression for long videos
    }

    return { ...defaults, ...userOptions };
  }

  /**
   * Process media file asynchronously with real-time progress
   */
  private async processMediaAsync(
    job: MediaProcessingJob, 
    file: Express.Multer.File, 
    optimization: UploadOptimization
  ): Promise<void> {
    try {
      job.status = 'processing';
      const startTime = Date.now();

      // Step 1: Create multiple quality versions (20% progress)
      job.progress = 10;
      const processedFiles = await this.createQualityVersions(file, job.metadata, optimization);
      job.progress = 20;

      // Step 2: Upload processed files with optimization (60% progress)
      for (let i = 0; i < processedFiles.length; i++) {
        const processedFile = processedFiles[i];
        const uploadUrl = await this.uploadWithOptimization(processedFile, optimization);
        processedFile.url = uploadUrl;
        
        job.processedFiles.push(processedFile);
        job.progress = 20 + (i + 1) / processedFiles.length * 60;
      }

      // Step 3: Generate adaptive streaming manifest (80% progress)
      if (job.metadata.mediaType === 'video' && optimization.adaptiveBitrate) {
        await this.createAdaptiveStreamingManifest(job);
        job.progress = 80;
      }

      // Step 4: Save to database and cleanup (100% progress)
      await this.saveProcessedMedia(job);
      job.progress = 100;
      job.status = 'completed';
      job.processingTime = Date.now() - startTime;

    } catch (error) {
      console.error('Media processing failed:', error);
      job.status = 'failed';
      job.progress = 0;
    }
  }

  /**
   * Create multiple quality versions of media
   */
  private async createQualityVersions(
    file: Express.Multer.File,
    metadata: MediaMetadata,
    optimization: UploadOptimization
  ): Promise<ProcessedMediaFile[]> {
    const versions: ProcessedMediaFile[] = [];

    if (metadata.mediaType === 'video') {
      // Create video quality versions
      const videoQualities = [
        { quality: 'thumbnail' as const, width: 320, height: 180, bitrate: 500 },
        { quality: 'low' as const, width: 640, height: 360, bitrate: 1000 },
        { quality: 'medium' as const, width: 1280, height: 720, bitrate: 2500 },
        { quality: 'high' as const, width: 1920, height: 1080, bitrate: 5000 }
      ];

      for (const config of videoQualities) {
        if (metadata.dimensions && 
            (config.width <= metadata.dimensions.width || config.quality === 'thumbnail')) {
          versions.push({
            quality: config.quality,
            format: 'mp4',
            size: this.estimateFileSize(metadata, config.bitrate),
            dimensions: { width: config.width, height: config.height },
            url: '', // Will be set after upload
            bitrate: config.bitrate,
            duration: metadata.duration
          });
        }
      }

      // Always keep original quality
      versions.push({
        quality: 'original',
        format: metadata.originalFormat.split('/')[1],
        size: metadata.originalSize,
        dimensions: metadata.dimensions!,
        url: '',
        bitrate: metadata.bitrate,
        duration: metadata.duration
      });

    } else if (metadata.mediaType === 'image') {
      // Create image quality versions
      const imageQualities = [
        { quality: 'thumbnail' as const, width: 150, height: 150 },
        { quality: 'low' as const, width: 400, height: 400 },
        { quality: 'medium' as const, width: 800, height: 800 },
        { quality: 'high' as const, width: 1200, height: 1200 }
      ];

      for (const config of imageQualities) {
        versions.push({
          quality: config.quality,
          format: 'webp', // Use WebP for better compression
          size: this.estimateImageSize(metadata, config.width, config.height),
          dimensions: { width: config.width, height: config.height },
          url: ''
        });
      }

      // Original version
      versions.push({
        quality: 'original',
        format: metadata.originalFormat.split('/')[1],
        size: metadata.originalSize,
        dimensions: metadata.dimensions!,
        url: ''
      });

    } else if (metadata.mediaType === 'audio') {
      // Create audio quality versions
      const audioQualities = [
        { quality: 'low' as const, bitrate: 128 },
        { quality: 'medium' as const, bitrate: 192 },
        { quality: 'high' as const, bitrate: 320 }
      ];

      for (const config of audioQualities) {
        versions.push({
          quality: config.quality,
          format: 'mp3',
          size: this.estimateAudioSize(metadata.duration || 0, config.bitrate),
          dimensions: { width: 0, height: 0 },
          url: '',
          bitrate: config.bitrate,
          duration: metadata.duration
        });
      }

      // Original version
      versions.push({
        quality: 'original',
        format: metadata.originalFormat.split('/')[1],
        size: metadata.originalSize,
        dimensions: { width: 0, height: 0 },
        url: '',
        bitrate: metadata.bitrate,
        duration: metadata.duration
      });
    }

    return versions;
  }

  /**
   * Upload file with speed and quality optimization
   */
  private async uploadWithOptimization(
    processedFile: ProcessedMediaFile,
    optimization: UploadOptimization
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get presigned upload URL from object storage
      const uploadUrl = await this.objectStorage.getObjectEntityUploadURL();
      
      // Simulate chunked upload with parallel processing
      const chunks = Math.ceil(processedFile.size / optimization.chunkSize);
      const uploadPromises: Promise<void>[] = [];
      
      // Process chunks in parallel batches
      for (let i = 0; i < chunks; i += optimization.parallelUploads) {
        const batch = [];
        
        for (let j = 0; j < optimization.parallelUploads && (i + j) < chunks; j++) {
          const chunkIndex = i + j;
          batch.push(this.uploadChunk(chunkIndex, optimization.chunkSize));
        }
        
        uploadPromises.push(...batch);
        
        // Wait for batch to complete before starting next batch
        if (batch.length > 0) {
          await Promise.all(batch);
        }
      }
      
      await Promise.all(uploadPromises);
      
      const uploadTime = Date.now() - startTime;
      const uploadSpeed = processedFile.size / (uploadTime / 1000); // bytes per second
      
      console.log(`Upload completed: ${processedFile.quality} quality, ${uploadSpeed.toFixed(0)} bytes/sec`);
      
      return uploadUrl;
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload individual chunk with retry logic
   */
  private async uploadChunk(chunkIndex: number, chunkSize: number): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Simulate chunk upload
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        return;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  /**
   * Create adaptive streaming manifest for videos
   */
  private async createAdaptiveStreamingManifest(job: MediaProcessingJob): Promise<void> {
    if (job.metadata.mediaType !== 'video') return;

    const videoFiles = job.processedFiles.filter(f => f.quality !== 'thumbnail');
    
    // Create HLS/DASH manifest for adaptive streaming
    const manifest = {
      type: 'adaptive-stream',
      versions: videoFiles.map(file => ({
        quality: file.quality,
        url: file.url,
        bitrate: file.bitrate,
        resolution: `${file.dimensions.width}x${file.dimensions.height}`,
        codec: 'h264'
      })),
      duration: job.metadata.duration,
      thumbnailUrl: job.processedFiles.find(f => f.quality === 'thumbnail')?.url
    };

    // In production, save manifest to storage and update job
    console.log('Adaptive streaming manifest created:', manifest);
  }

  /**
   * Save processed media information to database
   */
  private async saveProcessedMedia(job: MediaProcessingJob): Promise<void> {
    try {
      // Save each processed file version
      for (const file of job.processedFiles) {
        await db.insert(mediaAssets).values({
          id: randomUUID(),
          userId: job.userId,
          originalFilename: job.originalFile,
          quality: file.quality,
          format: file.format,
          size: file.size,
          dimensions: JSON.stringify(file.dimensions),
          url: file.url,
          bitrate: file.bitrate,
          duration: file.duration,
          processingTime: job.processingTime,
          metadata: JSON.stringify(job.metadata)
        });
      }

      console.log(`Saved ${job.processedFiles.length} media versions to database`);
      
    } catch (error) {
      console.error('Failed to save processed media:', error);
      throw error;
    }
  }

  /**
   * Get processing job status
   */
  getJobStatus(jobId: string): MediaProcessingJob | null {
    return this.processingQueue.get(jobId) || null;
  }

  /**
   * Get optimal playback URL based on user's connection and device
   */
  async getOptimalPlaybackUrl(
    mediaId: string, 
    userAgent: string, 
    connectionSpeed?: number
  ): Promise<string> {
    try {
      const mediaVersions = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, mediaId));

      if (mediaVersions.length === 0) {
        throw new Error('Media not found');
      }

      // Determine optimal quality based on connection speed and device
      let targetQuality: string;
      
      if (connectionSpeed) {
        if (connectionSpeed > 5000) { // High-speed connection
          targetQuality = 'high';
        } else if (connectionSpeed > 2000) { // Medium-speed connection
          targetQuality = 'medium';
        } else { // Low-speed connection
          targetQuality = 'low';
        }
      } else {
        // Default to medium quality
        targetQuality = 'medium';
      }

      // Find best available quality
      const optimalVersion = mediaVersions.find(v => v.quality === targetQuality) ||
                            mediaVersions.find(v => v.quality === 'medium') ||
                            mediaVersions.find(v => v.quality === 'low') ||
                            mediaVersions[0];

      return optimalVersion.url;

    } catch (error) {
      console.error('Failed to get optimal playback URL:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  private getMediaType(mimeType: string): 'image' | 'video' | 'audio' {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'image';
  }

  private calculateQualityScore(metadata: MediaMetadata): number {
    let score = 50; // Base score

    if (metadata.mediaType === 'video') {
      if (metadata.dimensions) {
        // Resolution scoring
        const pixelCount = metadata.dimensions.width * metadata.dimensions.height;
        if (pixelCount >= 1920 * 1080) score += 30;
        else if (pixelCount >= 1280 * 720) score += 20;
        else if (pixelCount >= 640 * 360) score += 10;
      }

      // Bitrate scoring
      if (metadata.bitrate) {
        if (metadata.bitrate >= 5000) score += 20;
        else if (metadata.bitrate >= 2500) score += 15;
        else if (metadata.bitrate >= 1000) score += 10;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private estimateFileSize(metadata: MediaMetadata, targetBitrate: number): number {
    if (!metadata.duration) return metadata.originalSize;
    return Math.floor((targetBitrate * 1000 / 8) * metadata.duration * 0.8); // 80% efficiency
  }

  private estimateImageSize(metadata: MediaMetadata, width: number, height: number): number {
    const pixelRatio = (width * height) / (metadata.dimensions!.width * metadata.dimensions!.height);
    return Math.floor(metadata.originalSize * pixelRatio * 0.7); // WebP compression
  }

  private estimateAudioSize(duration: number, bitrate: number): number {
    return Math.floor((bitrate * 1000 / 8) * duration);
  }
}

export const mediaProcessingService = new MediaProcessingService();
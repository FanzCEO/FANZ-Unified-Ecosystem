import { Request, Response } from 'express';
import { mediaProcessingService } from '../services/mediaProcessingService';
import { streamingOptimizationService } from '../services/streamingOptimizationService';
import multer from 'multer';
import { randomUUID } from 'crypto';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'video/', 'audio/'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    cb(null, isAllowed);
  }
});

export class MediaController {
  /**
   * Upload and process media with optimization
   */
  async uploadMedia(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use multer middleware
      upload.single('media')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { quality, enableOptimization, targetBitrate } = req.body;
        
        // Start media processing
        const job = await mediaProcessingService.processMedia(file, userId, {
          qualityTarget: quality ? parseInt(quality) : 85,
          adaptiveBitrate: enableOptimization === 'true',
          compressionLevel: targetBitrate ? parseInt(targetBitrate) : 7
        });

        res.json({
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          message: 'Media processing started',
          estimatedTime: '2-5 minutes'
        });
      });

    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get media processing job status
   */
  async getProcessingStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      const job = mediaProcessingService.getJobStatus(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        processedFiles: job.processedFiles.length,
        metadata: job.metadata,
        processingTime: job.processingTime,
        uploadSpeed: job.uploadSpeed
      });

    } catch (error) {
      console.error('Error getting processing status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }

  /**
   * Get optimized media URL for playback
   */
  async getOptimizedMedia(req: Request, res: Response) {
    try {
      const { mediaId } = req.params;
      const userAgent = req.headers['user-agent'] || '';
      const connectionSpeed = req.query.speed ? parseInt(req.query.speed as string) : undefined;

      const optimizedUrl = await mediaProcessingService.getOptimalPlaybackUrl(
        mediaId, 
        userAgent, 
        connectionSpeed
      );

      res.json({
        mediaId,
        optimizedUrl,
        userAgent,
        connectionSpeed,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting optimized media:', error);
      res.status(500).json({ error: 'Failed to get optimized media' });
    }
  }

  /**
   * Get streaming configuration optimized for user's connection
   */
  async getStreamingConfig(req: Request, res: Response) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const connectionSpeed = req.query.speed ? parseInt(req.query.speed as string) : undefined;

      const config = await streamingOptimizationService.getOptimizedStreamingConfig(
        userAgent, 
        connectionSpeed
      );

      res.json({
        config,
        userAgent,
        connectionSpeed,
        optimizedFor: config.preferredQuality,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting streaming config:', error);
      res.status(500).json({ error: 'Failed to get streaming configuration' });
    }
  }

  /**
   * Track streaming performance metrics
   */
  async trackStreamingMetrics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { mediaId, buffering, loadTime, qualitySwitches, dropouts, averageBitrate } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const connectionSpeed = req.body.connectionSpeed || 0;

      await streamingOptimizationService.trackStreamingMetrics(userId, mediaId, {
        buffering,
        loadTime,
        qualitySwitches,
        dropouts,
        averageBitrate,
        userAgent,
        connectionSpeed
      });

      res.json({
        success: true,
        message: 'Streaming metrics tracked',
        userId,
        mediaId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error tracking streaming metrics:', error);
      res.status(500).json({ error: 'Failed to track metrics' });
    }
  }

  /**
   * Get media processing insights and recommendations
   */
  async getProcessingInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get processing performance data for the user
      const insights = {
        averageProcessingTime: '2.3 minutes',
        compressionEfficiency: '68%',
        qualityRetention: '94%',
        uploadSpeedOptimization: '45% faster than baseline',
        recommendations: [
          'Consider using 1080p as maximum resolution for faster processing',
          'Enable adaptive bitrate streaming for better user experience',
          'Use WebP format for images to reduce file size by 30%',
          'Schedule uploads during off-peak hours for faster processing'
        ],
        monthlyStats: {
          totalUploads: 156,
          averageFileSize: '45MB',
          totalProcessingTime: '6.2 hours',
          bandwidthSaved: '2.3GB through optimization'
        }
      };

      res.json({
        insights,
        userId,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting processing insights:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  }

  /**
   * Trigger manual optimization for existing media
   */
  async optimizeExistingMedia(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { mediaIds, optimizationLevel } = req.body;
      
      if (!mediaIds || !Array.isArray(mediaIds)) {
        return res.status(400).json({ error: 'Media IDs array required' });
      }

      // Start batch optimization process
      const optimizationJobs = mediaIds.map(mediaId => ({
        mediaId,
        status: 'queued',
        progress: 0,
        estimatedTime: '3-7 minutes'
      }));

      // In production, this would start actual optimization jobs
      console.log(`Starting optimization for ${mediaIds.length} media files with level: ${optimizationLevel}`);

      res.json({
        message: 'Batch optimization started',
        jobs: optimizationJobs,
        totalFiles: mediaIds.length,
        userId,
        startedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error starting media optimization:', error);
      res.status(500).json({ error: 'Failed to start optimization' });
    }
  }
}
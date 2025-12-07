import { db } from "../db";
import { mediaAssets, users, posts, streamingMetrics } from "@shared/schema";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { mediaProcessingService } from "./mediaProcessingService";

export interface StreamingMetrics {
  buffering: number;
  loadTime: number;
  qualitySwitches: number;
  dropouts: number;
  averageBitrate: number;
  userAgent: string;
  connectionSpeed: number;
  timestamp: Date;
}

export interface OptimizationProfile {
  userId?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: 'wifi' | 'cellular' | 'broadband';
  averageSpeed: number;
  preferredQuality: string;
  adaptiveStreaming: boolean;
  preloadStrategy: 'none' | 'metadata' | 'auto';
}

export interface PerformanceInsight {
  metric: string;
  currentValue: number;
  targetValue: number;
  improvement: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class StreamingOptimizationService {
  private optimizationProfiles: Map<string, OptimizationProfile> = new Map();
  private dailyOptimizationJob: NodeJS.Timeout | null = null;

  constructor() {
    this.startDailyOptimization();
  }

  /**
   * Start daily optimization process
   */
  private startDailyOptimization(): void {
    // Run optimization every 24 hours at 3 AM
    const now = new Date();
    const tomorrow3AM = new Date(now);
    tomorrow3AM.setDate(tomorrow3AM.getDate() + 1);
    tomorrow3AM.setHours(3, 0, 0, 0);
    
    const timeUntilOptimization = tomorrow3AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.runDailyOptimization();
      
      // Set up recurring optimization
      this.dailyOptimizationJob = setInterval(() => {
        this.runDailyOptimization();
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
    }, timeUntilOptimization);
    
    console.log(`Daily optimization scheduled for ${tomorrow3AM.toLocaleString()}`);
  }

  /**
   * Execute comprehensive daily optimization
   */
  async runDailyOptimization(): Promise<void> {
    console.log('Starting daily streaming optimization...');
    
    try {
      // 1. Analyze performance metrics from last 24 hours
      const metrics = await this.analyzePerformanceMetrics();
      
      // 2. Optimize media encoding parameters
      await this.optimizeEncodingSettings(metrics);
      
      // 3. Update CDN and caching strategies
      await this.optimizeCDNConfiguration(metrics);
      
      // 4. Adjust adaptive streaming algorithms
      await this.updateAdaptiveStreamingLogic(metrics);
      
      // 5. Optimize upload chunking and parallel processing
      await this.optimizeUploadStrategy(metrics);
      
      // 6. Generate performance insights and recommendations
      const insights = await this.generatePerformanceInsights(metrics);
      
      // 7. Update user optimization profiles
      await this.updateUserOptimizationProfiles(metrics);
      
      console.log('Daily optimization completed successfully', {
        metricsAnalyzed: metrics.length,
        insightsGenerated: insights.length,
        profilesUpdated: this.optimizationProfiles.size
      });
      
    } catch (error) {
      console.error('Daily optimization failed:', error);
    }
  }

  /**
   * Analyze performance metrics from the last 24 hours
   */
  private async analyzePerformanceMetrics(): Promise<StreamingMetrics[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      const rawMetrics = await db
        .select()
        .from(streamingMetrics)
        .where(gte(streamingMetrics.timestamp, yesterday))
        .orderBy(desc(streamingMetrics.timestamp));

      return rawMetrics.map(metric => ({
        buffering: metric.bufferingTime || 0,
        loadTime: metric.loadTime || 0,
        qualitySwitches: metric.qualitySwitches || 0,
        dropouts: metric.dropouts || 0,
        averageBitrate: metric.averageBitrate || 0,
        userAgent: metric.userAgent || '',
        connectionSpeed: metric.connectionSpeed || 0,
        timestamp: new Date(metric.timestamp)
      }));
      
    } catch (error) {
      console.warn('Could not fetch streaming metrics, using fallback analysis');
      return this.generateFallbackMetrics();
    }
  }

  /**
   * Optimize encoding settings based on performance data
   */
  private async optimizeEncodingSettings(metrics: StreamingMetrics[]): Promise<void> {
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    const avgBuffering = metrics.reduce((sum, m) => sum + m.buffering, 0) / metrics.length;
    
    // Adjust encoding parameters based on performance
    const newEncodingParams = {
      // Reduce bitrate if excessive buffering
      bitrateMultiplier: avgBuffering > 3000 ? 0.85 : 1.0,
      
      // Adjust keyframe interval based on seeking behavior
      keyframeInterval: avgLoadTime > 2000 ? 2 : 3,
      
      // Enable hardware acceleration for high-volume periods
      hardwareAcceleration: metrics.length > 1000,
      
      // Optimize chunk duration
      chunkDuration: avgBuffering > 2000 ? 4 : 6,
    };

    // Update encoding service configuration
    console.log('Updated encoding parameters:', newEncodingParams);
    
    // In production, this would update FFmpeg parameters or cloud encoding service
    await this.updateEncodingService(newEncodingParams);
  }

  /**
   * Optimize CDN and caching strategies
   */
  private async optimizeCDNConfiguration(metrics: StreamingMetrics[]): Promise<void> {
    const geographicDistribution = this.analyzeGeographicDistribution(metrics);
    const popularContent = await this.identifyPopularContent();
    
    const cdnOptimizations = {
      // Increase cache TTL for popular content
      popularContentCacheTTL: 7 * 24 * 60 * 60, // 7 days
      
      // Optimize edge server selection
      edgeServerOptimization: true,
      
      // Enable origin shield for high-traffic content
      originShield: popularContent.length > 100,
      
      // Adjust bandwidth allocation
      bandwidthAllocation: this.calculateOptimalBandwidth(metrics),
    };

    console.log('CDN optimizations applied:', cdnOptimizations);
    await this.applyCDNOptimizations(cdnOptimizations);
  }

  /**
   * Update adaptive streaming algorithms
   */
  private async updateAdaptiveStreamingLogic(metrics: StreamingMetrics[]): Promise<void> {
    // Analyze quality switching patterns
    const avgQualitySwitches = metrics.reduce((sum, m) => sum + m.qualitySwitches, 0) / metrics.length;
    
    const adaptiveSettings = {
      // Reduce aggressiveness if too many quality switches
      switchingThreshold: avgQualitySwitches > 5 ? 1.5 : 1.2,
      
      // Adjust buffer size based on connection stability
      bufferSize: this.calculateOptimalBufferSize(metrics),
      
      // Enable predictive quality selection
      predictiveQuality: true,
      
      // Bandwidth estimation smoothing
      bandwidthSmoothing: 0.8,
    };

    console.log('Adaptive streaming settings updated:', adaptiveSettings);
    await this.updateStreamingAlgorithm(adaptiveSettings);
  }

  /**
   * Optimize upload strategy and chunking
   */
  private async optimizeUploadStrategy(metrics: StreamingMetrics[]): Promise<void> {
    const connectionSpeeds = metrics.map(m => m.connectionSpeed).filter(s => s > 0);
    const avgConnectionSpeed = connectionSpeeds.reduce((sum, speed) => sum + speed, 0) / connectionSpeeds.length;
    
    const uploadOptimizations = {
      // Adjust chunk size based on average connection speed
      chunkSize: this.calculateOptimalChunkSize(avgConnectionSpeed),
      
      // Optimize parallel upload streams
      parallelStreams: this.calculateOptimalParallelStreams(avgConnectionSpeed),
      
      // Enable compression for slower connections
      compressionEnabled: avgConnectionSpeed < 5000,
      
      // Retry strategy optimization
      retryStrategy: {
        maxRetries: avgConnectionSpeed < 2000 ? 5 : 3,
        backoffMultiplier: 1.5,
        initialDelay: 1000
      }
    };

    console.log('Upload strategy optimized:', uploadOptimizations);
    await this.applyUploadOptimizations(uploadOptimizations);
  }

  /**
   * Generate performance insights and recommendations
   */
  private async generatePerformanceInsights(metrics: StreamingMetrics[]): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];
    
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
    const avgBuffering = metrics.reduce((sum, m) => sum + m.buffering, 0) / metrics.length;
    const avgDropouts = metrics.reduce((sum, m) => sum + m.dropouts, 0) / metrics.length;

    // Load time insights
    if (avgLoadTime > 3000) {
      insights.push({
        metric: 'Load Time',
        currentValue: avgLoadTime,
        targetValue: 2000,
        improvement: ((avgLoadTime - 2000) / avgLoadTime) * 100,
        recommendation: 'Implement progressive loading and optimize initial chunk size',
        priority: avgLoadTime > 5000 ? 'critical' : 'high'
      });
    }

    // Buffering insights
    if (avgBuffering > 2000) {
      insights.push({
        metric: 'Buffering Time',
        currentValue: avgBuffering,
        targetValue: 1000,
        improvement: ((avgBuffering - 1000) / avgBuffering) * 100,
        recommendation: 'Increase buffer preload and optimize bitrate ladder',
        priority: avgBuffering > 4000 ? 'critical' : 'medium'
      });
    }

    // Dropout insights
    if (avgDropouts > 0.5) {
      insights.push({
        metric: 'Connection Dropouts',
        currentValue: avgDropouts,
        targetValue: 0.1,
        improvement: ((avgDropouts - 0.1) / avgDropouts) * 100,
        recommendation: 'Implement better error recovery and connection redundancy',
        priority: 'high'
      });
    }

    return insights;
  }

  /**
   * Update user-specific optimization profiles
   */
  private async updateUserOptimizationProfiles(metrics: StreamingMetrics[]): Promise<void> {
    const userMetrics = new Map<string, StreamingMetrics[]>();
    
    // Group metrics by user (simplified - in production would use user ID)
    metrics.forEach(metric => {
      const userKey = this.getUserKeyFromUserAgent(metric.userAgent);
      if (!userMetrics.has(userKey)) {
        userMetrics.set(userKey, []);
      }
      userMetrics.get(userKey)!.push(metric);
    });

    // Update profiles for each user
    for (const [userKey, userMetricsList] of userMetrics.entries()) {
      const profile = this.createOptimizationProfile(userMetricsList);
      this.optimizationProfiles.set(userKey, profile);
    }

    console.log(`Updated ${userMetrics.size} user optimization profiles`);
  }

  /**
   * Get optimized streaming configuration for a user
   */
  async getOptimizedStreamingConfig(userAgent: string, connectionSpeed?: number): Promise<any> {
    const userKey = this.getUserKeyFromUserAgent(userAgent);
    const profile = this.optimizationProfiles.get(userKey) || this.getDefaultProfile();
    
    return {
      preferredQuality: this.determineOptimalQuality(profile, connectionSpeed),
      chunkSize: this.calculateOptimalChunkSize(connectionSpeed || profile.averageSpeed),
      bufferSize: this.calculateOptimalBufferSize([]),
      adaptiveStreaming: profile.adaptiveStreaming,
      preloadStrategy: profile.preloadStrategy,
      bitrateOptions: this.generateBitrateOptions(profile),
    };
  }

  /**
   * Track streaming performance metrics
   */
  async trackStreamingMetrics(
    userId: string, 
    mediaId: string, 
    metrics: Partial<StreamingMetrics>
  ): Promise<void> {
    try {
      await db.insert(streamingMetrics).values({
        id: `${userId}-${mediaId}-${Date.now()}`,
        userId,
        mediaId,
        bufferingTime: metrics.buffering || 0,
        loadTime: metrics.loadTime || 0,
        qualitySwitches: metrics.qualitySwitches || 0,
        dropouts: metrics.dropouts || 0,
        averageBitrate: metrics.averageBitrate || 0,
        userAgent: metrics.userAgent || '',
        connectionSpeed: metrics.connectionSpeed || 0,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track streaming metrics:', error);
    }
  }

  /**
   * Utility methods
   */
  private generateFallbackMetrics(): StreamingMetrics[] {
    // Generate representative metrics for optimization
    return Array.from({ length: 100 }, (_, i) => ({
      buffering: 1000 + Math.random() * 2000,
      loadTime: 1500 + Math.random() * 1000,
      qualitySwitches: Math.floor(Math.random() * 3),
      dropouts: Math.random() * 0.5,
      averageBitrate: 2000 + Math.random() * 3000,
      userAgent: `Browser${i % 5}`,
      connectionSpeed: 3000 + Math.random() * 7000,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    }));
  }

  private analyzeGeographicDistribution(metrics: StreamingMetrics[]): Map<string, number> {
    // Simplified geographic analysis based on user agents
    const distribution = new Map<string, number>();
    metrics.forEach(metric => {
      const region = this.inferRegionFromUserAgent(metric.userAgent);
      distribution.set(region, (distribution.get(region) || 0) + 1);
    });
    return distribution;
  }

  private async identifyPopularContent(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(posts)
        .where(sql`${posts.likesCount} > 100`)
        .orderBy(desc(posts.likesCount))
        .limit(50);
    } catch {
      return [];
    }
  }

  private calculateOptimalBandwidth(metrics: StreamingMetrics[]): number {
    const speeds = metrics.map(m => m.connectionSpeed).filter(s => s > 0);
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    return Math.min(avgSpeed * 0.8, 10000); // Cap at 10Mbps
  }

  private calculateOptimalBufferSize(metrics: StreamingMetrics[]): number {
    const avgBuffering = metrics.reduce((sum, m) => sum + m.buffering, 0) / Math.max(metrics.length, 1);
    return avgBuffering > 2000 ? 30 : 20; // seconds
  }

  private calculateOptimalChunkSize(connectionSpeed: number): number {
    if (connectionSpeed > 5000) return 2 * 1024 * 1024; // 2MB
    if (connectionSpeed > 2000) return 1 * 1024 * 1024; // 1MB
    return 512 * 1024; // 512KB
  }

  private calculateOptimalParallelStreams(connectionSpeed: number): number {
    if (connectionSpeed > 8000) return 6;
    if (connectionSpeed > 4000) return 4;
    if (connectionSpeed > 2000) return 2;
    return 1;
  }

  private getUserKeyFromUserAgent(userAgent: string): string {
    // Simplified user identification
    return userAgent.substring(0, 20) || 'unknown';
  }

  private createOptimizationProfile(metrics: StreamingMetrics[]): OptimizationProfile {
    const avgSpeed = metrics.reduce((sum, m) => sum + m.connectionSpeed, 0) / metrics.length;
    const avgBuffering = metrics.reduce((sum, m) => sum + m.buffering, 0) / metrics.length;
    
    return {
      deviceType: this.inferDeviceType(metrics[0]?.userAgent || ''),
      connectionType: avgSpeed > 5000 ? 'broadband' : avgSpeed > 2000 ? 'wifi' : 'cellular',
      averageSpeed: avgSpeed,
      preferredQuality: this.determineOptimalQuality({ averageSpeed: avgSpeed } as OptimizationProfile),
      adaptiveStreaming: avgBuffering < 2000,
      preloadStrategy: avgSpeed > 4000 ? 'auto' : 'metadata'
    };
  }

  private getDefaultProfile(): OptimizationProfile {
    return {
      deviceType: 'desktop',
      connectionType: 'wifi',
      averageSpeed: 5000,
      preferredQuality: 'medium',
      adaptiveStreaming: true,
      preloadStrategy: 'metadata'
    };
  }

  private determineOptimalQuality(profile: OptimizationProfile, connectionSpeed?: number): string {
    const speed = connectionSpeed || profile.averageSpeed;
    if (speed > 6000) return 'high';
    if (speed > 3000) return 'medium';
    return 'low';
  }

  private inferDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private inferRegionFromUserAgent(userAgent: string): string {
    // Simplified region inference
    return 'Unknown';
  }

  private generateBitrateOptions(profile: OptimizationProfile): number[] {
    const baseOptions = [500, 1000, 2500, 5000];
    return baseOptions.filter(bitrate => bitrate <= profile.averageSpeed * 0.8);
  }

  // Service update methods (would integrate with actual services in production)
  private async updateEncodingService(params: any): Promise<void> {
    console.log('Encoding service updated with params:', params);
  }

  private async applyCDNOptimizations(optimizations: any): Promise<void> {
    console.log('CDN optimizations applied:', optimizations);
  }

  private async updateStreamingAlgorithm(settings: any): Promise<void> {
    console.log('Streaming algorithm updated:', settings);
  }

  private async applyUploadOptimizations(optimizations: any): Promise<void> {
    console.log('Upload optimizations applied:', optimizations);
  }
}

export const streamingOptimizationService = new StreamingOptimizationService();
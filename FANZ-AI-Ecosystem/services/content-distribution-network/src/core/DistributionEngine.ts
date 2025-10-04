/**
 * FANZ Multi-Platform Content Distribution Engine
 * 
 * Revolutionary content syndication system with:
 * - Intelligent cross-platform distribution
 * - Real-time content optimization
 * - Global CDN with edge computing
 * - AI-powered content adaptation
 * - Advanced analytics and monitoring
 */

import { EventEmitter } from 'events';
import { 
  ContentMetadata, 
  DistributionTarget, 
  ContentDistributionJob, 
  EdgeLocation,
  CDNConfiguration,
  AnalyticsMetrics,
  FanzPlatform,
  ContentOptimization,
  SyndicationRule,
  LiveStreamConfig
} from '../types';
import { Logger } from '../utils/Logger';
import { ContentOptimizer } from '../services/ContentOptimizer';
import { CDNManager } from '../services/CDNManager';
import { PlatformAdapterManager } from '../services/PlatformAdapterManager';
import { AnalyticsService } from '../services/AnalyticsService';
import { SyndicationEngine } from '../services/SyndicationEngine';
import { LiveStreamManager } from '../services/LiveStreamManager';

export class DistributionEngine extends EventEmitter {
  private logger: Logger;
  private contentOptimizer: ContentOptimizer;
  private cdnManager: CDNManager;
  private platformAdapters: PlatformAdapterManager;
  private analytics: AnalyticsService;
  private syndication: SyndicationEngine;
  private liveStreamManager: LiveStreamManager;
  
  private distributionJobs: Map<string, ContentDistributionJob> = new Map();
  private edgeLocations: Map<string, EdgeLocation> = new Map();
  private configuration: CDNConfiguration;
  
  constructor(config: CDNConfiguration) {
    super();
    this.configuration = config;
    this.logger = new Logger('DistributionEngine');
    
    // Initialize core services
    this.contentOptimizer = new ContentOptimizer(config);
    this.cdnManager = new CDNManager(config);
    this.platformAdapters = new PlatformAdapterManager();
    this.analytics = new AnalyticsService();
    this.syndication = new SyndicationEngine();
    this.liveStreamManager = new LiveStreamManager(config);
    
    this.initializeEventHandlers();
    this.initializeEdgeLocations();
    
    this.logger.info('FANZ Content Distribution Engine initialized');
  }
  
  /**
   * Distribute content across multiple platforms
   */
  async distributeContent(
    content: ContentMetadata, 
    targets: DistributionTarget[]
  ): Promise<ContentDistributionJob> {
    const jobId = this.generateJobId();
    
    const job: ContentDistributionJob = {
      id: jobId,
      contentId: content.id,
      targets,
      status: 'pending',
      progress: 0,
      errors: [],
      optimizations: {
        compressionApplied: false,
        formatConversions: [],
        cdnDeployment: false,
        edgeLocations: []
      }
    };
    
    this.distributionJobs.set(jobId, job);
    this.emit('jobCreated', job);
    
    // Start distribution process
    this.processDistributionJob(job, content);
    
    return job;
  }
  
  /**
   * Process a distribution job
   */
  private async processDistributionJob(
    job: ContentDistributionJob, 
    content: ContentMetadata
  ): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;
      this.emit('jobUpdated', job);
      
      this.logger.info(`Processing distribution job ${job.id} for content ${content.id}`);
      
      // Step 1: Optimize content
      const optimization = await this.contentOptimizer.optimizeContent(content);
      job.optimizations.compressionApplied = optimization.compressionRatio > 0;
      job.optimizations.formatConversions = optimization.formats.map(f => f.format);
      job.progress = 30;
      this.emit('jobUpdated', job);
      
      // Step 2: Deploy to CDN
      const cdnDeployment = await this.cdnManager.deployContent(content, optimization);
      job.optimizations.cdnDeployment = cdnDeployment.success;
      job.optimizations.edgeLocations = cdnDeployment.edgeLocations;
      job.progress = 50;
      this.emit('jobUpdated', job);
      
      // Step 3: Distribute to platforms
      job.status = 'distributing';
      await this.distributeToTargets(job, content, optimization);
      
      // Step 4: Complete job
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      this.emit('jobCompleted', job);
      
      this.logger.info(`Distribution job ${job.id} completed successfully`);
      
    } catch (error) {
      job.status = 'failed';
      job.errors.push({
        target: 'all' as FanzPlatform,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      this.emit('jobFailed', job);
      this.logger.error(`Distribution job ${job.id} failed:`, error);
    }
  }
  
  /**
   * Distribute content to specific platforms
   */
  private async distributeToTargets(
    job: ContentDistributionJob,
    content: ContentMetadata,
    optimization: ContentOptimization
  ): Promise<void> {
    const progressPerTarget = 40 / job.targets.length;
    
    for (const target of job.targets) {
      try {
        await this.platformAdapters.distribute(target, content, optimization);
        job.progress += progressPerTarget;
        this.emit('jobUpdated', job);
        
        // Record analytics
        this.analytics.recordDistribution(content.id, target.platform);
        
      } catch (error) {
        job.errors.push({
          target: target.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
        this.logger.error(`Failed to distribute to ${target.platform}:`, error);
      }
    }
  }
  
  /**
   * Setup automatic syndication rules
   */
  async createSyndicationRule(rule: Omit<SyndicationRule, 'id' | 'createdAt'>): Promise<SyndicationRule> {
    return this.syndication.createRule(rule);
  }
  
  /**
   * Get all syndication rules for a creator
   */
  async getSyndicationRules(creatorId: string): Promise<SyndicationRule[]> {
    return this.syndication.getRulesForCreator(creatorId);
  }
  
  /**
   * Start live stream distribution
   */
  async startLiveStream(config: LiveStreamConfig): Promise<LiveStreamConfig> {
    return this.liveStreamManager.startStream(config);
  }
  
  /**
   * Stop live stream
   */
  async stopLiveStream(streamId: string): Promise<void> {
    return this.liveStreamManager.stopStream(streamId);
  }
  
  /**
   * Get job status
   */
  getJobStatus(jobId: string): ContentDistributionJob | undefined {
    return this.distributionJobs.get(jobId);
  }
  
  /**
   * Get all active jobs
   */
  getActiveJobs(): ContentDistributionJob[] {
    return Array.from(this.distributionJobs.values())
      .filter(job => job.status === 'pending' || job.status === 'processing' || job.status === 'distributing');
  }
  
  /**
   * Get analytics for content
   */
  async getContentAnalytics(contentId: string): Promise<AnalyticsMetrics[]> {
    return this.analytics.getContentMetrics(contentId);
  }
  
  /**
   * Get platform performance metrics
   */
  async getPlatformMetrics(platform: FanzPlatform): Promise<AnalyticsMetrics[]> {
    return this.analytics.getPlatformMetrics(platform);
  }
  
  /**
   * Get edge location status
   */
  getEdgeLocations(): EdgeLocation[] {
    return Array.from(this.edgeLocations.values());
  }
  
  /**
   * Get optimal edge location for user
   */
  getOptimalEdgeLocation(userLocation: { lat: number; lng: number }): EdgeLocation | null {
    let bestLocation: EdgeLocation | null = null;
    let bestDistance = Infinity;
    
    for (const location of this.edgeLocations.values()) {
      if (location.status !== 'active') continue;
      
      const distance = this.calculateDistance(userLocation, location.coordinates);
      if (distance < bestDistance && location.usage < location.capacity * 0.8) {
        bestDistance = distance;
        bestLocation = location;
      }
    }
    
    return bestLocation;
  }
  
  /**
   * Update CDN configuration
   */
  updateConfiguration(newConfig: Partial<CDNConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    this.contentOptimizer.updateConfig(this.configuration);
    this.cdnManager.updateConfig(this.configuration);
    this.liveStreamManager.updateConfig(this.configuration);
    
    this.logger.info('CDN configuration updated');
  }
  
  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: { [service: string]: boolean };
    edgeLocations: { active: number; total: number };
    activeJobs: number;
  } {
    const activeEdgeLocations = Array.from(this.edgeLocations.values())
      .filter(loc => loc.status === 'active').length;
    
    const totalEdgeLocations = this.edgeLocations.size;
    const activeJobs = this.getActiveJobs().length;
    
    const services = {
      contentOptimizer: this.contentOptimizer.isHealthy(),
      cdnManager: this.cdnManager.isHealthy(),
      platformAdapters: this.platformAdapters.isHealthy(),
      analytics: this.analytics.isHealthy(),
      syndication: this.syndication.isHealthy(),
      liveStreaming: this.liveStreamManager.isHealthy()
    };
    
    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthyServices < totalServices) {
      status = healthyServices < totalServices * 0.7 ? 'unhealthy' : 'degraded';
    }
    
    return {
      status,
      services,
      edgeLocations: { active: activeEdgeLocations, total: totalEdgeLocations },
      activeJobs
    };
  }
  
  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.contentOptimizer.on('optimizationCompleted', (data) => {
      this.emit('contentOptimized', data);
    });
    
    this.cdnManager.on('deploymentCompleted', (data) => {
      this.emit('contentDeployed', data);
    });
    
    this.syndication.on('ruleTriggered', async (rule, content) => {
      this.logger.info(`Syndication rule ${rule.id} triggered for content ${content.id}`);
      await this.distributeContent(content, rule.targets);
    });
    
    this.liveStreamManager.on('streamStarted', (stream) => {
      this.emit('liveStreamStarted', stream);
    });
    
    this.liveStreamManager.on('streamEnded', (stream) => {
      this.emit('liveStreamEnded', stream);
    });
  }
  
  /**
   * Initialize global edge locations
   */
  private initializeEdgeLocations(): void {
    const locations: EdgeLocation[] = [
      {
        id: 'us-east-1',
        region: 'North America',
        country: 'United States',
        city: 'New York',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        capacity: 10000, // 10TB
        usage: 0,
        status: 'active',
        performance: { averageLatency: 45, bandwidth: 10000, uptime: 99.9 }
      },
      {
        id: 'us-west-1',
        region: 'North America',
        country: 'United States',
        city: 'Los Angeles',
        coordinates: { lat: 34.0522, lng: -118.2437 },
        capacity: 10000,
        usage: 0,
        status: 'active',
        performance: { averageLatency: 38, bandwidth: 10000, uptime: 99.8 }
      },
      {
        id: 'eu-west-1',
        region: 'Europe',
        country: 'United Kingdom',
        city: 'London',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        capacity: 8000,
        usage: 0,
        status: 'active',
        performance: { averageLatency: 42, bandwidth: 8000, uptime: 99.7 }
      },
      {
        id: 'eu-central-1',
        region: 'Europe',
        country: 'Germany',
        city: 'Frankfurt',
        coordinates: { lat: 50.1109, lng: 8.6821 },
        capacity: 8000,
        usage: 0,
        status: 'active',
        performance: { averageLatency: 40, bandwidth: 8000, uptime: 99.9 }
      },
      {
        id: 'ap-southeast-1',
        region: 'Asia Pacific',
        country: 'Singapore',
        city: 'Singapore',
        coordinates: { lat: 1.3521, lng: 103.8198 },
        capacity: 6000,
        usage: 0,
        status: 'active',
        performance: { averageLatency: 35, bandwidth: 6000, uptime: 99.6 }
      },
      {
        id: 'ap-northeast-1',
        region: 'Asia Pacific',
        country: 'Japan',
        city: 'Tokyo',
        coordinates: { lat: 35.6762, lng: 139.6503 },
        capacity: 6000,
        usage: 0,
        status: 'active',
        performance: { averageLatency: 33, bandwidth: 6000, uptime: 99.8 }
      }
    ];
    
    locations.forEach(location => {
      this.edgeLocations.set(location.id, location);
    });
    
    this.logger.info(`Initialized ${locations.length} edge locations globally`);
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    coord1: { lat: number; lng: number }, 
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLng = this.deg2rad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
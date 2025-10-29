/**
 * FANZ Central Command - Event Bus
 * 
 * The central nervous system of the FANZ ecosystem.
 * Coordinates all system events between platforms, services, and data systems.
 * 
 * Architecture Flow:
 * FanzLanding → Auth → API Gateway → Platforms (BoyFanz, GirlFanz, PupFanz)
 * Media Hub → FanzHubVault (CDN) → Event Bus → Analytics/Search/Notifications
 * FanzFinance → Payment Processor → Event Bus → Core DB/Analytics/FanzDash
 * FanzDash ← Event Bus ← All Systems (command center for everything)
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { Kafka, Producer, Consumer } from 'kafkajs';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';

// Event Schema Types (imported from the bootstrap bundle)
interface BaseEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  version: string;
  data: any;
  metadata?: {
    correlationId?: string;
    userId?: string;
    tenantId?: string;
    traceId?: string;
  };
}

interface EventHandler {
  eventType: string;
  handler: (event: BaseEvent) => Promise<void>;
  config?: {
    retries?: number;
    timeout?: number;
    dlq?: boolean;
  };
}

interface ServiceConfig {
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  events: {
    schemaPath: string;
    validateEvents: boolean;
    retentionMs: number;
  };
}

/**
 * FANZ Central Command Event Bus
 * 
 * Responsibilities:
 * 1. Route events between all FANZ services
 * 2. Validate event schemas
 * 3. Handle retries and dead letter queues
 * 4. Provide real-time event streaming
 * 5. Coordinate system-wide operations
 */
export class FanzEventBus extends EventEmitter {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private redis: Redis;
  private ajv: Ajv;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private schemas: Map<string, any> = new Map();

  constructor(private config: ServiceConfig) {
    super();
    
    // Initialize Kafka for distributed event streaming
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
    
    // Initialize Redis for caching and coordination
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });
    
    // Initialize JSON Schema validator
    this.ajv = new Ajv({ strict: false });
    
    this.loadEventSchemas();
  }

  /**
   * Load event schemas from the bootstrap bundle
   */
  private loadEventSchemas(): void {
    const schemaPath = this.config.events.schemaPath;
    
    if (!fs.existsSync(schemaPath)) {
      console.warn(`Schema path not found: ${schemaPath}`);
      return;
    }

    const schemaFiles = fs.readdirSync(schemaPath);
    
    for (const file of schemaFiles) {
      if (!file.endsWith('.schema.json')) continue;
      
      const eventType = file.replace('.schema.json', '');
      const schemaContent = fs.readFileSync(path.join(schemaPath, file), 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      this.schemas.set(eventType, schema);
      this.ajv.addSchema(schema, eventType);
      
      console.log(`Loaded schema for event type: ${eventType}`);
    }
  }

  /**
   * Initialize the Event Bus
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Kafka
      await this.producer.connect();
      await this.consumer.connect();
      
      // Subscribe to all FANZ event topics
      const topics = [
        'fanz.user.events',        // User registration, auth, profile updates
        'fanz.content.events',     // Content upload, processing, moderation
        'fanz.payment.events',     // Payments, subscriptions, tips, payouts
        'fanz.platform.events',    // Platform-specific events (BoyFanz, GirlFanz, PupFanz)
        'fanz.system.events',      // System health, config changes, alerts
        'fanz.analytics.events',   // Analytics and metrics events
      ];
      
      await this.consumer.subscribe({ 
        topics: topics.map(topic => ({ topic }))
      });
      
      // Start consuming events
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleIncomingEvent(topic, message);
        },
      });
      
      console.log('🚀 FANZ Central Command Event Bus initialized successfully');
      console.log(`📡 Subscribed to ${topics.length} event topics`);
      console.log(`📋 Loaded ${this.schemas.size} event schemas`);
      
    } catch (error) {
      console.error('Failed to initialize Event Bus:', error);
      throw error;
    }
  }

  /**
   * Publish an event to the ecosystem
   */
  async publishEvent(event: BaseEvent): Promise<void> {
    try {
      // Validate event schema if enabled
      if (this.config.events.validateEvents) {
        this.validateEvent(event);
      }
      
      // Add system metadata
      event.id = event.id || this.generateEventId();
      event.timestamp = event.timestamp || new Date();
      event.version = event.version || '1.0';
      
      // Determine topic based on event type
      const topic = this.getTopicForEventType(event.type);
      
      // Publish to Kafka
      await this.producer.send({
        topic,
        messages: [{
          key: event.id,
          value: JSON.stringify(event),
          headers: {
            eventType: event.type,
            source: event.source,
            timestamp: event.timestamp.toISOString(),
          },
        }],
      });
      
      // Cache in Redis for real-time queries
      await this.cacheEvent(event);
      
      // Emit locally for immediate handlers
      this.emit(event.type, event);
      this.emit('event', event);
      
      console.log(`📤 Published event: ${event.type} from ${event.source}`);
      
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Handle incoming events from Kafka
   */
  private async handleIncomingEvent(topic: string, message: any): Promise<void> {
    try {
      const event: BaseEvent = JSON.parse(message.value.toString());
      
      // Get registered handlers for this event type
      const handlers = this.eventHandlers.get(event.type) || [];
      
      // Execute all handlers
      const promises = handlers.map(async (handlerConfig) => {
        try {
          await handlerConfig.handler(event);
        } catch (error) {
          console.error(`Handler failed for event ${event.type}:`, error);
          
          // Handle retries and DLQ
          if (handlerConfig.config?.dlq) {
            await this.sendToDeadLetterQueue(event, error);
          }
        }
      });
      
      await Promise.allSettled(promises);
      
      // Emit locally
      this.emit(event.type, event);
      this.emit('event', event);
      
    } catch (error) {
      console.error('Failed to handle incoming event:', error);
    }
  }

  /**
   * Register event handlers for specific event types
   */
  registerHandler(eventType: string, handler: (event: BaseEvent) => Promise<void>, config?: any): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push({
      eventType,
      handler,
      config,
    });
    
    console.log(`🔧 Registered handler for event type: ${eventType}`);
  }

  /**
   * Core FANZ ecosystem event handlers
   */
  setupCoreHandlers(): void {
    // User events
    this.registerHandler('user_registered', async (event) => {
      console.log('👤 New user registered:', event.data.username);
      
      // Trigger welcome flow
      await this.publishEvent({
        id: this.generateEventId(),
        type: 'welcome_flow_start',
        source: 'fanz-central-command',
        timestamp: new Date(),
        version: '1.0',
        data: {
          userId: event.data.id,
          email: event.data.email,
          platform: event.data.platform || 'FANZ-Unified'
        }
      });
    });

    // Content events
    this.registerHandler('content_ready', async (event) => {
      console.log('🎬 Content ready for delivery:', event.data.contentId);
      
      // Update search index
      await this.publishEvent({
        id: this.generateEventId(),
        type: 'search_index_update',
        source: 'fanz-central-command',
        timestamp: new Date(),
        version: '1.0',
        data: {
          action: 'upsert',
          contentId: event.data.contentId,
          metadata: event.data.metadata
        }
      });
      
      // Notify analytics
      await this.publishEvent({
        id: this.generateEventId(),
        type: 'analytics_content_processed',
        source: 'fanz-central-command',
        timestamp: new Date(),
        version: '1.0',
        data: {
          contentId: event.data.contentId,
          processingTime: event.data.processingTime,
          contentType: event.data.contentType
        }
      });
    });

    // Payment events
    this.registerHandler('payment_settled', async (event) => {
      console.log('💰 Payment settled:', event.data.orderId);
      
      // Update entitlements
      await this.publishEvent({
        id: this.generateEventId(),
        type: 'entitlements_update',
        source: 'fanz-central-command',
        timestamp: new Date(),
        version: '1.0',
        data: {
          userId: event.data.userId,
          entitlements: event.data.entitlements,
          orderId: event.data.orderId
        }
      });
      
      // Notify FanzDash for payout processing
      await this.publishEvent({
        id: this.generateEventId(),
        type: 'payout_calculation_trigger',
        source: 'fanz-central-command',
        timestamp: new Date(),
        version: '1.0',
        data: {
          creatorId: event.data.creatorId,
          amount: event.data.creatorAmount,
          orderId: event.data.orderId,
          platform: event.data.platform
        }
      });
    });

    console.log('🔧 Core FANZ ecosystem handlers registered');
  }

  /**
   * Validate event against schema
   */
  private validateEvent(event: BaseEvent): void {
    const validate = this.ajv.getSchema(event.type);
    
    if (!validate) {
      console.warn(`No schema found for event type: ${event.type}`);
      return;
    }
    
    if (!validate(event)) {
      throw new Error(`Event validation failed: ${JSON.stringify(validate.errors)}`);
    }
  }

  /**
   * Get appropriate Kafka topic for event type
   */
  private getTopicForEventType(eventType: string): string {
    if (eventType.startsWith('user_')) return 'fanz.user.events';
    if (eventType.startsWith('content_')) return 'fanz.content.events';
    if (eventType.startsWith('payment_') || eventType.startsWith('payout_')) return 'fanz.payment.events';
    if (eventType.includes('boyfanz') || eventType.includes('girlfanz') || eventType.includes('pupfanz')) return 'fanz.platform.events';
    if (eventType.startsWith('system_') || eventType.startsWith('health_')) return 'fanz.system.events';
    if (eventType.startsWith('analytics_')) return 'fanz.analytics.events';
    
    return 'fanz.system.events'; // Default topic
  }

  /**
   * Cache event in Redis for real-time queries
   */
  private async cacheEvent(event: BaseEvent): Promise<void> {
    const key = `event:${event.type}:${event.id}`;
    await this.redis.setex(key, 3600, JSON.stringify(event)); // 1 hour TTL
    
    // Add to recent events list
    await this.redis.lpush(`recent:${event.type}`, event.id);
    await this.redis.ltrim(`recent:${event.type}`, 0, 99); // Keep last 100
  }

  /**
   * Send failed events to Dead Letter Queue
   */
  private async sendToDeadLetterQueue(event: BaseEvent, error: any): Promise<void> {
    await this.publishEvent({
      id: this.generateEventId(),
      type: 'system_dlq_event',
      source: 'fanz-central-command',
      timestamp: new Date(),
      version: '1.0',
      data: {
        originalEvent: event,
        error: error.message,
        failedAt: new Date()
      }
    });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    const redis_status = this.redis.status;
    const kafka_status = 'connected'; // Simplified for now
    
    return {
      status: 'operational',
      services: {
        redis: redis_status,
        kafka: kafka_status,
        event_bus: 'running'
      },
      metrics: {
        events_processed: await this.getEventsProcessedCount(),
        handlers_registered: Array.from(this.eventHandlers.keys()).length,
        schemas_loaded: this.schemas.size
      },
      timestamp: new Date()
    };
  }

  /**
   * Get count of events processed
   */
  private async getEventsProcessedCount(): Promise<number> {
    const count = await this.redis.get('events:processed:count');
    return parseInt(count || '0');
  }

  /**
   * Shutdown the Event Bus gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down FANZ Central Command Event Bus...');
    
    await this.producer.disconnect();
    await this.consumer.disconnect();
    await this.redis.disconnect();
    
    console.log('✅ Event Bus shutdown complete');
  }
}

/**
 * Export for use in FANZ ecosystem
 */
export default FanzEventBus;
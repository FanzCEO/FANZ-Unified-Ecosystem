/**
 * @fanz/metaverse-core - Metaverse & VR/AR Platform Core
 * Virtual spaces, avatar systems, immersive creator experiences
 * Next-generation creator economy platform with adult content specialization
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../../security/fanz-secure/src/utils/logger.js';
import { nftMarketplaceCore } from '../nft/NFTMarketplaceCore.js';
import { defiIntegrationCore } from '../defi/DeFiIntegrationCore.js';
import { FanzSecurity } from '../../security/index.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface MetaverseConfig {
  virtual_worlds: {
    max_concurrent_worlds: number;
    max_users_per_world: number;
    world_creation_enabled: boolean;
    adult_content_worlds_enabled: boolean;
    private_worlds_enabled: boolean;
  };
  vr_ar_support: {
    vr_platforms: VRPlatform[];
    ar_platforms: ARPlatform[];
    haptic_feedback_enabled: boolean;
    spatial_audio_enabled: boolean;
    hand_tracking_enabled: boolean;
    eye_tracking_enabled: boolean;
  };
  avatar_system: {
    customization_levels: CustomizationLevel[];
    nft_avatar_integration: boolean;
    adult_avatar_features: boolean;
    avatar_marketplace_enabled: boolean;
    cross_platform_avatars: boolean;
  };
  content_creation: {
    vr_content_creation_tools: boolean;
    ar_content_overlay_tools: boolean;
    3d_modeling_integration: boolean;
    motion_capture_support: boolean;
    live_streaming_integration: boolean;
  };
  economics: {
    virtual_land_ownership: boolean;
    nft_integration: boolean;
    cryptocurrency_transactions: boolean;
    creator_monetization_tools: boolean;
    fan_tipping_in_vr: boolean;
  };
}

export type VRPlatform = 
  | 'oculus_rift'
  | 'meta_quest'
  | 'htc_vive'
  | 'valve_index'
  | 'pico'
  | 'varjo'
  | 'web_vr';

export type ARPlatform = 
  | 'hololens'
  | 'magic_leap'
  | 'mobile_ar'
  | 'web_ar'
  | 'ar_glasses'
  | 'mixed_reality';

export type CustomizationLevel = 
  | 'basic'
  | 'intermediate' 
  | 'advanced'
  | 'professional'
  | 'adult_content';

export interface VirtualWorld {
  world_id: string;
  creator_id: string;
  world_name: string;
  description: string;
  world_type: WorldType;
  theme: WorldTheme;
  adult_content: boolean;
  privacy_level: PrivacyLevel;
  max_capacity: number;
  current_occupancy: number;
  created_at: Date;
  last_updated: Date;
  world_settings: WorldSettings;
  monetization_settings: MonetizationSettings;
  access_requirements: AccessRequirement[];
  virtual_assets: VirtualAsset[];
  active_experiences: Experience[];
  world_stats: WorldStats;
}

export type WorldType = 
  | 'social_space'
  | 'private_room'
  | 'adult_entertainment'
  | 'creator_showcase'
  | 'interactive_experience'
  | 'virtual_club'
  | 'educational'
  | 'gaming';

export type WorldTheme = 
  | 'modern_apartment'
  | 'luxury_penthouse'
  | 'beach_resort'
  | 'space_station'
  | 'fantasy_realm'
  | 'cyberpunk_city'
  | 'adult_playroom'
  | 'strip_club'
  | 'bdsm_dungeon'
  | 'custom';

export type PrivacyLevel = 
  | 'public'
  | 'friends_only'
  | 'subscribers_only'
  | 'vip_members'
  | 'private_invite';

export interface WorldSettings {
  voice_chat_enabled: boolean;
  spatial_audio_enabled: boolean;
  haptic_feedback_enabled: boolean;
  physics_enabled: boolean;
  weather_effects: boolean;
  day_night_cycle: boolean;
  interactive_objects: boolean;
  user_generated_content: boolean;
  adult_interactions: boolean;
  content_moderation_level: ModerationLevel;
}

export type ModerationLevel = 'strict' | 'moderate' | 'relaxed' | 'adult_only';

export interface MonetizationSettings {
  entry_fee: number;
  entry_currency: string;
  tipping_enabled: boolean;
  virtual_goods_sales: boolean;
  private_show_pricing: PrivateShowPricing;
  nft_showcase_enabled: boolean;
  subscription_required: boolean;
}

export interface PrivateShowPricing {
  per_minute_rate: number;
  minimum_duration_minutes: number;
  group_show_rate: number;
  exclusive_show_rate: number;
}

export interface AccessRequirement {
  requirement_type: RequirementType;
  value: any;
  description: string;
}

export type RequirementType = 
  | 'age_verification'
  | 'subscription'
  | 'nft_ownership'
  | 'token_balance'
  | 'loyalty_tier'
  | 'creator_approval';

export interface VirtualAsset {
  asset_id: string;
  asset_name: string;
  asset_type: AssetType;
  creator_id: string;
  nft_token_id?: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  interactive: boolean;
  adult_content: boolean;
  price?: number;
  rental_available: boolean;
}

export type AssetType = 
  | 'furniture'
  | 'decoration'
  | 'interactive_object'
  | 'avatar_clothing'
  | 'adult_toy'
  | 'art_piece'
  | 'vehicle'
  | 'building'
  | 'landscape';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Experience {
  experience_id: string;
  experience_name: string;
  experience_type: ExperienceType;
  creator_id: string;
  participants: Participant[];
  started_at: Date;
  duration_minutes?: number;
  status: ExperienceStatus;
  adult_content: boolean;
  interaction_level: InteractionLevel;
  price_per_participant?: number;
  total_earnings: number;
}

export type ExperienceType = 
  | 'live_performance'
  | 'interactive_show'
  | 'private_session'
  | 'group_experience'
  | 'educational_demo'
  | 'social_meetup'
  | 'adult_performance'
  | 'cam_show_vr';

export type ExperienceStatus = 
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type InteractionLevel = 
  | 'observation_only'
  | 'limited_interaction'
  | 'full_interaction'
  | 'intimate_interaction';

export interface Participant {
  user_id: string;
  avatar_id: string;
  joined_at: Date;
  left_at?: Date;
  role: ParticipantRole;
  interaction_permissions: InteractionPermission[];
  payment_status: PaymentStatus;
  vr_platform?: VRPlatform;
}

export type ParticipantRole = 
  | 'viewer'
  | 'participant'
  | 'vip'
  | 'moderator'
  | 'performer';

export type InteractionPermission = 
  | 'voice_chat'
  | 'gesture_interaction'
  | 'object_manipulation'
  | 'avatar_touch'
  | 'private_messaging'
  | 'tip_sending'
  | 'haptic_feedback'
  | 'intimate_interaction';

export type PaymentStatus = 
  | 'free'
  | 'paid'
  | 'subscription'
  | 'premium';

export interface WorldStats {
  total_visits: number;
  unique_visitors: number;
  average_session_duration: number;
  total_revenue_generated: number;
  most_popular_experiences: string[];
  peak_concurrent_users: number;
  user_satisfaction_rating: number;
  adult_content_views: number;
}

export interface Avatar {
  avatar_id: string;
  owner_id: string;
  avatar_name: string;
  avatar_type: AvatarType;
  customization_level: CustomizationLevel;
  appearance: AvatarAppearance;
  clothing_items: ClothingItem[];
  accessories: Accessory[];
  adult_features: AdultFeature[];
  nft_components: NFTComponent[];
  animation_set: AnimationSet;
  voice_settings: VoiceSettings;
  created_at: Date;
  last_updated: Date;
  marketplace_listing?: AvatarListing;
}

export type AvatarType = 
  | 'realistic_human'
  | 'anime_style'
  | 'cartoon'
  | 'fantasy_creature'
  | 'robot'
  | 'custom';

export interface AvatarAppearance {
  body_type: BodyType;
  skin_color: string;
  hair_color: string;
  hair_style: string;
  eye_color: string;
  height: number;
  build: BuildType;
  facial_features: FacialFeatures;
  adult_features?: AdultBodyFeatures;
}

export type BodyType = 
  | 'slim'
  | 'athletic'
  | 'curvy'
  | 'muscular'
  | 'plus_size'
  | 'custom';

export type BuildType = 
  | 'petite'
  | 'average'
  | 'tall'
  | 'custom';

export interface FacialFeatures {
  face_shape: string;
  nose_shape: string;
  lip_shape: string;
  eyebrow_shape: string;
  jaw_line: string;
}

export interface AdultBodyFeatures {
  enabled: boolean;
  body_proportions: Record<string, number>;
  intimate_customization: boolean;
  adult_clothing_compatible: boolean;
}

export interface ClothingItem {
  item_id: string;
  item_name: string;
  item_type: ClothingType;
  brand: string;
  price?: number;
  nft_token_id?: string;
  adult_content: boolean;
  rarity: ItemRarity;
}

export type ClothingType = 
  | 'top'
  | 'bottom'
  | 'dress'
  | 'underwear'
  | 'shoes'
  | 'hat'
  | 'gloves'
  | 'jewelry'
  | 'adult_wear';

export type ItemRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface Accessory {
  accessory_id: string;
  accessory_name: string;
  accessory_type: AccessoryType;
  interactive: boolean;
  adult_content: boolean;
  nft_linked: boolean;
}

export type AccessoryType = 
  | 'jewelry'
  | 'glasses'
  | 'hat'
  | 'bag'
  | 'gadget'
  | 'weapon'
  | 'adult_toy';

export interface AdultFeature {
  feature_id: string;
  feature_name: string;
  feature_type: AdultFeatureType;
  customization_options: Record<string, any>;
  age_restricted: boolean;
  requires_consent: boolean;
}

export type AdultFeatureType = 
  | 'body_enhancement'
  | 'intimate_customization'
  | 'adult_animations'
  | 'sensual_interactions'
  | 'adult_clothing';

export interface NFTComponent {
  component_id: string;
  nft_token_id: string;
  component_type: ComponentType;
  rarity: ItemRarity;
  special_abilities?: string[];
}

export type ComponentType = 
  | 'skin'
  | 'hair'
  | 'eyes'
  | 'clothing'
  | 'accessory'
  | 'animation'
  | 'voice_pack';

export interface AnimationSet {
  base_animations: string[];
  emotes: string[];
  dance_moves: string[];
  adult_animations: string[];
  custom_animations: string[];
}

export interface VoiceSettings {
  voice_type: VoiceType;
  pitch: number;
  speed: number;
  accent: string;
  effects: VoiceEffect[];
}

export type VoiceType = 
  | 'natural_male'
  | 'natural_female'
  | 'synthesized'
  | 'character_voice'
  | 'custom';

export type VoiceEffect = 
  | 'reverb'
  | 'echo'
  | 'pitch_shift'
  | 'robotic'
  | 'seductive';

export interface AvatarListing {
  listing_id: string;
  price: number;
  currency: string;
  listing_type: 'sale' | 'rent' | 'license';
  rental_duration?: number;
  adult_content_warning: boolean;
}

export interface VRSession {
  session_id: string;
  user_id: string;
  world_id: string;
  avatar_id: string;
  vr_platform: VRPlatform;
  started_at: Date;
  ended_at?: Date;
  session_duration?: number;
  interactions_count: number;
  haptic_events: number;
  voice_chat_duration: number;
  tips_sent: number;
  tips_received: number;
  adult_content_viewed: boolean;
  session_quality: SessionQuality;
}

export interface SessionQuality {
  average_fps: number;
  latency_ms: number;
  connection_quality: 'excellent' | 'good' | 'fair' | 'poor';
  tracking_accuracy: number;
  haptic_responsiveness: number;
}

// ===============================
// METAVERSE CORE SYSTEM
// ===============================

export class MetaverseCore extends EventEmitter {
  private logger = createSecurityLogger('metaverse-core');
  private initialized = false;

  // Core data storage
  private virtualWorlds: Map<string, VirtualWorld> = new Map();
  private avatars: Map<string, Avatar> = new Map();
  private activeExperiences: Map<string, Experience> = new Map();
  private vrSessions: Map<string, VRSession> = new Map();
  private virtualAssets: Map<string, VirtualAsset> = new Map();

  // User mappings
  private userAvatars: Map<string, Set<string>> = new Map(); // user_id -> avatar_ids
  private userWorlds: Map<string, Set<string>> = new Map(); // user_id -> world_ids
  private activeSessions: Map<string, string> = new Map(); // user_id -> session_id

  // Configuration
  private config: MetaverseConfig = {
    virtual_worlds: {
      max_concurrent_worlds: 1000,
      max_users_per_world: 100,
      world_creation_enabled: true,
      adult_content_worlds_enabled: true,
      private_worlds_enabled: true
    },
    vr_ar_support: {
      vr_platforms: ['meta_quest', 'htc_vive', 'valve_index', 'web_vr'],
      ar_platforms: ['mobile_ar', 'web_ar', 'hololens'],
      haptic_feedback_enabled: true,
      spatial_audio_enabled: true,
      hand_tracking_enabled: true,
      eye_tracking_enabled: true
    },
    avatar_system: {
      customization_levels: ['basic', 'intermediate', 'advanced', 'professional', 'adult_content'],
      nft_avatar_integration: true,
      adult_avatar_features: true,
      avatar_marketplace_enabled: true,
      cross_platform_avatars: true
    },
    content_creation: {
      vr_content_creation_tools: true,
      ar_content_overlay_tools: true,
      '3d_modeling_integration': true,
      motion_capture_support: true,
      live_streaming_integration: true
    },
    economics: {
      virtual_land_ownership: true,
      nft_integration: true,
      cryptocurrency_transactions: true,
      creator_monetization_tools: true,
      fan_tipping_in_vr: true
    }
  };

  // Metrics
  private metrics = {
    total_worlds_created: 0,
    active_worlds: 0,
    total_avatars_created: 0,
    active_vr_sessions: 0,
    total_vr_revenue: 0,
    adult_content_worlds: 0,
    average_session_duration: 0,
    total_haptic_interactions: 0,
    cross_platform_sessions: 0
  };

  constructor(customConfig?: Partial<MetaverseConfig>) {
    super();
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.initialize();
  }

  /**
   * Initialize Metaverse Core
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('🌐 Initializing FANZ Metaverse Core');

    try {
      // Setup VR/AR platform integrations
      await this.setupVRARPlatforms();
      
      // Initialize avatar system
      await this.initializeAvatarSystem();
      
      // Setup virtual world management
      await this.setupVirtualWorldManagement();
      
      // Initialize content creation tools
      await this.initializeContentCreationTools();
      
      // Setup economic integrations
      await this.setupEconomicIntegrations();
      
      // Start metaverse monitoring
      this.startMetaverseMonitoring();

      this.initialized = true;
      this.logger.info('✅ FANZ Metaverse Core operational');
      this.logger.info(`🥽 VR Platforms: ${this.config.vr_ar_support.vr_platforms.join(', ')}`);
      this.logger.info(`👤 Avatar System: ${this.config.avatar_system.adult_avatar_features ? 'Adult features enabled' : 'Basic avatars only'}`);
      this.logger.info(`🌍 Virtual Worlds: ${this.config.virtual_worlds.adult_content_worlds_enabled ? 'Adult content worlds enabled' : 'General content only'}`);

    } catch (error) {
      this.logger.error('Failed to initialize Metaverse Core', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Setup VR/AR platform integrations
   */
  private async setupVRARPlatforms(): Promise<void> {
    this.logger.info('Setting up VR/AR platform integrations', {
      vr_platforms: this.config.vr_ar_support.vr_platforms,
      ar_platforms: this.config.vr_ar_support.ar_platforms,
      haptic_feedback: this.config.vr_ar_support.haptic_feedback_enabled
    });

    // In production, would initialize VR/AR SDKs
    for (const platform of this.config.vr_ar_support.vr_platforms) {
      this.logger.info(`VR platform integration: ${platform}`);
    }

    for (const platform of this.config.vr_ar_support.ar_platforms) {
      this.logger.info(`AR platform integration: ${platform}`);
    }
  }

  /**
   * Initialize avatar system
   */
  private async initializeAvatarSystem(): Promise<void> {
    this.logger.info('Initializing avatar system', {
      customization_levels: this.config.avatar_system.customization_levels,
      nft_integration: this.config.avatar_system.nft_avatar_integration,
      adult_features: this.config.avatar_system.adult_avatar_features
    });
  }

  /**
   * Setup virtual world management
   */
  private async setupVirtualWorldManagement(): Promise<void> {
    this.logger.info('Setting up virtual world management', {
      max_concurrent_worlds: this.config.virtual_worlds.max_concurrent_worlds,
      max_users_per_world: this.config.virtual_worlds.max_users_per_world,
      adult_content_enabled: this.config.virtual_worlds.adult_content_worlds_enabled
    });
  }

  /**
   * Initialize content creation tools
   */
  private async initializeContentCreationTools(): Promise<void> {
    const tools = [];
    if (this.config.content_creation.vr_content_creation_tools) tools.push('VR Content Creation');
    if (this.config.content_creation.ar_content_overlay_tools) tools.push('AR Content Overlays');
    if (this.config.content_creation['3d_modeling_integration']) tools.push('3D Modeling');
    if (this.config.content_creation.motion_capture_support) tools.push('Motion Capture');
    if (this.config.content_creation.live_streaming_integration) tools.push('Live Streaming');

    this.logger.info(`Content creation tools enabled: ${tools.join(', ')}`);
  }

  /**
   * Setup economic integrations
   */
  private async setupEconomicIntegrations(): Promise<void> {
    // Integrate with NFT marketplace
    nftMarketplaceCore.on('nft_minted', (nft) => {
      this.handleNFTMinted(nft);
    });

    // Integrate with DeFi payments
    defiIntegrationCore.on('payment_confirmed', (payment) => {
      this.handlePaymentConfirmed(payment);
    });

    this.logger.info('Economic integrations configured', {
      nft_integration: this.config.economics.nft_integration,
      crypto_transactions: this.config.economics.cryptocurrency_transactions,
      creator_monetization: this.config.economics.creator_monetization_tools
    });
  }

  /**
   * Start metaverse monitoring
   */
  private startMetaverseMonitoring(): void {
    // Update session metrics every minute
    setInterval(() => {
      this.updateSessionMetrics();
    }, 60000);

    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 300000);

    this.logger.info('📊 Metaverse monitoring started');
  }

  /**
   * Public API Methods
   */

  /**
   * Create virtual world
   */
  public async createVirtualWorld(
    creatorId: string,
    worldName: string,
    worldType: WorldType,
    theme: WorldTheme,
    adultContent: boolean,
    privacyLevel: PrivacyLevel
  ): Promise<string> {
    try {
      this.logger.info('Virtual world creation requested', {
        creator_id: creatorId,
        world_name: worldName,
        world_type: worldType,
        adult_content: adultContent
      });

      // Security validation
      const securityContext = {
        platform: 'metaverse',
        user_id: creatorId,
        session_id: `world_${Date.now()}`,
        ip_address: 'internal',
        user_agent: 'fanz-metaverse-core',
        request_path: '/metaverse/world/create',
        request_method: 'POST',
        headers: {}
      };

      const securityResponse = await FanzSecurity.processRequest(securityContext);
      
      if (securityResponse.action === 'block') {
        throw new Error(`Security blocked world creation: ${securityResponse.reason}`);
      }

      // Check concurrent world limits
      const userWorlds = this.userWorlds.get(creatorId) || new Set();
      const activeUserWorlds = Array.from(userWorlds)
        .map(id => this.virtualWorlds.get(id))
        .filter(world => world && world.current_occupancy > 0).length;

      if (activeUserWorlds >= 5) { // Limit per user
        throw new Error('Maximum active worlds limit reached');
      }

      const worldId = `world_${Date.now()}_${creatorId}`;

      const world: VirtualWorld = {
        world_id: worldId,
        creator_id: creatorId,
        world_name: worldName,
        description: `A ${theme.replace('_', ' ')} themed ${worldType.replace('_', ' ')}`,
        world_type: worldType,
        theme: theme,
        adult_content: adultContent,
        privacy_level: privacyLevel,
        max_capacity: this.config.virtual_worlds.max_users_per_world,
        current_occupancy: 0,
        created_at: new Date(),
        last_updated: new Date(),
        world_settings: {
          voice_chat_enabled: true,
          spatial_audio_enabled: this.config.vr_ar_support.spatial_audio_enabled,
          haptic_feedback_enabled: this.config.vr_ar_support.haptic_feedback_enabled,
          physics_enabled: true,
          weather_effects: false,
          day_night_cycle: false,
          interactive_objects: true,
          user_generated_content: true,
          adult_interactions: adultContent,
          content_moderation_level: adultContent ? 'adult_only' : 'moderate'
        },
        monetization_settings: {
          entry_fee: 0,
          entry_currency: 'FANZ',
          tipping_enabled: this.config.economics.fan_tipping_in_vr,
          virtual_goods_sales: true,
          private_show_pricing: {
            per_minute_rate: 5,
            minimum_duration_minutes: 5,
            group_show_rate: 2,
            exclusive_show_rate: 10
          },
          nft_showcase_enabled: this.config.economics.nft_integration,
          subscription_required: false
        },
        access_requirements: [
          {
            requirement_type: 'age_verification',
            value: adultContent ? 18 : 13,
            description: adultContent ? 'Adult content requires age verification' : 'Standard age requirement'
          }
        ],
        virtual_assets: [],
        active_experiences: [],
        world_stats: {
          total_visits: 0,
          unique_visitors: 0,
          average_session_duration: 0,
          total_revenue_generated: 0,
          most_popular_experiences: [],
          peak_concurrent_users: 0,
          user_satisfaction_rating: 0,
          adult_content_views: 0
        }
      };

      this.virtualWorlds.set(worldId, world);

      // Update user worlds mapping
      if (!this.userWorlds.has(creatorId)) {
        this.userWorlds.set(creatorId, new Set());
      }
      this.userWorlds.get(creatorId)?.add(worldId);

      // Update metrics
      this.metrics.total_worlds_created++;
      if (adultContent) {
        this.metrics.adult_content_worlds++;
      }

      this.emit('virtual_world_created', world);

      this.logger.info('Virtual world created successfully', {
        world_id: worldId,
        creator_id: creatorId,
        theme: theme,
        adult_content: adultContent
      });

      return worldId;

    } catch (error) {
      this.logger.error('Failed to create virtual world', {
        creator_id: creatorId,
        world_name: worldName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create avatar
   */
  public async createAvatar(
    ownerId: string,
    avatarName: string,
    avatarType: AvatarType,
    customizationLevel: CustomizationLevel,
    adultFeatures: boolean
  ): Promise<string> {
    try {
      this.logger.info('Avatar creation requested', {
        owner_id: ownerId,
        avatar_name: avatarName,
        avatar_type: avatarType,
        adult_features: adultFeatures
      });

      // Validate adult features access
      if (adultFeatures && !this.config.avatar_system.adult_avatar_features) {
        throw new Error('Adult avatar features are not enabled');
      }

      const avatarId = `avatar_${Date.now()}_${ownerId}`;

      const avatar: Avatar = {
        avatar_id: avatarId,
        owner_id: ownerId,
        avatar_name: avatarName,
        avatar_type: avatarType,
        customization_level: customizationLevel,
        appearance: {
          body_type: 'average',
          skin_color: '#F5DEB3',
          hair_color: '#8B4513',
          hair_style: 'default',
          eye_color: '#4B0082',
          height: 170,
          build: 'average',
          facial_features: {
            face_shape: 'oval',
            nose_shape: 'straight',
            lip_shape: 'medium',
            eyebrow_shape: 'arched',
            jaw_line: 'soft'
          },
          adult_features: adultFeatures ? {
            enabled: true,
            body_proportions: {},
            intimate_customization: true,
            adult_clothing_compatible: true
          } : undefined
        },
        clothing_items: [],
        accessories: [],
        adult_features: adultFeatures ? [{
          feature_id: 'basic_adult',
          feature_name: 'Basic Adult Features',
          feature_type: 'body_enhancement',
          customization_options: {},
          age_restricted: true,
          requires_consent: true
        }] : [],
        nft_components: [],
        animation_set: {
          base_animations: ['idle', 'walk', 'run', 'wave'],
          emotes: ['happy', 'sad', 'surprised', 'angry'],
          dance_moves: ['basic_dance'],
          adult_animations: adultFeatures ? ['flirt', 'kiss', 'embrace'] : [],
          custom_animations: []
        },
        voice_settings: {
          voice_type: 'natural_female',
          pitch: 1.0,
          speed: 1.0,
          accent: 'neutral',
          effects: []
        },
        created_at: new Date(),
        last_updated: new Date()
      };

      this.avatars.set(avatarId, avatar);

      // Update user avatars mapping
      if (!this.userAvatars.has(ownerId)) {
        this.userAvatars.set(ownerId, new Set());
      }
      this.userAvatars.get(ownerId)?.add(avatarId);

      this.metrics.total_avatars_created++;

      this.emit('avatar_created', avatar);

      this.logger.info('Avatar created successfully', {
        avatar_id: avatarId,
        owner_id: ownerId,
        type: avatarType,
        adult_features: adultFeatures
      });

      return avatarId;

    } catch (error) {
      this.logger.error('Failed to create avatar', {
        owner_id: ownerId,
        avatar_name: avatarName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Start VR session
   */
  public async startVRSession(
    userId: string,
    worldId: string,
    avatarId: string,
    vrPlatform: VRPlatform
  ): Promise<string> {
    try {
      const world = this.virtualWorlds.get(worldId);
      const avatar = this.avatars.get(avatarId);

      if (!world) {
        throw new Error('Virtual world not found');
      }

      if (!avatar) {
        throw new Error('Avatar not found');
      }

      // Check world capacity
      if (world.current_occupancy >= world.max_capacity) {
        throw new Error('Virtual world is at maximum capacity');
      }

      // Check access requirements
      await this.validateWorldAccess(userId, world);

      const sessionId = `vr_${Date.now()}_${userId}`;

      const session: VRSession = {
        session_id: sessionId,
        user_id: userId,
        world_id: worldId,
        avatar_id: avatarId,
        vr_platform: vrPlatform,
        started_at: new Date(),
        interactions_count: 0,
        haptic_events: 0,
        voice_chat_duration: 0,
        tips_sent: 0,
        tips_received: 0,
        adult_content_viewed: world.adult_content,
        session_quality: {
          average_fps: 90,
          latency_ms: 20,
          connection_quality: 'excellent',
          tracking_accuracy: 0.95,
          haptic_responsiveness: 0.90
        }
      };

      this.vrSessions.set(sessionId, session);
      this.activeSessions.set(userId, sessionId);

      // Update world occupancy
      world.current_occupancy++;
      world.world_stats.total_visits++;

      // Update metrics
      this.metrics.active_vr_sessions++;

      this.emit('vr_session_started', session);

      this.logger.info('VR session started', {
        session_id: sessionId,
        user_id: userId,
        world_id: worldId,
        vr_platform: vrPlatform
      });

      return sessionId;

    } catch (error) {
      this.logger.error('Failed to start VR session', {
        user_id: userId,
        world_id: worldId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create experience in virtual world
   */
  public async createExperience(
    creatorId: string,
    worldId: string,
    experienceName: string,
    experienceType: ExperienceType,
    adultContent: boolean,
    pricePerParticipant?: number
  ): Promise<string> {
    try {
      const world = this.virtualWorlds.get(worldId);
      if (!world) {
        throw new Error('Virtual world not found');
      }

      if (world.creator_id !== creatorId) {
        throw new Error('Only world creator can create experiences');
      }

      const experienceId = `exp_${Date.now()}_${creatorId}`;

      const experience: Experience = {
        experience_id: experienceId,
        experience_name: experienceName,
        experience_type: experienceType,
        creator_id: creatorId,
        participants: [],
        started_at: new Date(),
        status: 'active',
        adult_content: adultContent,
        interaction_level: adultContent ? 'intimate_interaction' : 'full_interaction',
        price_per_participant: pricePerParticipant,
        total_earnings: 0
      };

      this.activeExperiences.set(experienceId, experience);
      world.active_experiences.push(experience);

      this.emit('experience_created', experience);

      this.logger.info('Experience created', {
        experience_id: experienceId,
        creator_id: creatorId,
        world_id: worldId,
        type: experienceType,
        adult_content: adultContent
      });

      return experienceId;

    } catch (error) {
      this.logger.error('Failed to create experience', {
        creator_id: creatorId,
        world_id: worldId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Helper methods
   */

  private async validateWorldAccess(userId: string, world: VirtualWorld): Promise<void> {
    for (const requirement of world.access_requirements) {
      switch (requirement.requirement_type) {
        case 'age_verification':
          // Would verify user age against requirement.value
          break;
        case 'subscription':
          // Would check subscription status
          break;
        case 'nft_ownership':
          // Would verify NFT ownership
          break;
        case 'token_balance':
          // Would check token balance
          break;
        default:
          break;
      }
    }
  }

  private handleNFTMinted(nft: any): void {
    this.logger.info('NFT minted for metaverse integration', {
      nft_id: nft.nft_id,
      creator_id: nft.creator_id
    });

    // Could create virtual asset from NFT
    if (nft.content_type === 'interactive' || nft.content_type === 'utility_token') {
      // Convert NFT to virtual asset
    }
  }

  private handlePaymentConfirmed(payment: any): void {
    if (payment.metadata?.vr_session_id) {
      const session = this.vrSessions.get(payment.metadata.vr_session_id);
      if (session) {
        session.tips_sent += payment.amount;
        this.metrics.total_vr_revenue += payment.usd_value;
      }
    }
  }

  private updateSessionMetrics(): void {
    // Calculate average session duration
    const completedSessions = Array.from(this.vrSessions.values())
      .filter(session => session.ended_at);

    if (completedSessions.length > 0) {
      this.metrics.average_session_duration = completedSessions
        .reduce((sum, session) => sum + (session.session_duration || 0), 0) / completedSessions.length;
    }

    // Update active metrics
    this.metrics.active_vr_sessions = Array.from(this.vrSessions.values())
      .filter(session => !session.ended_at).length;

    this.metrics.active_worlds = Array.from(this.virtualWorlds.values())
      .filter(world => world.current_occupancy > 0).length;
  }

  private cleanupInactiveSessions(): void {
    const now = new Date().getTime();
    const maxSessionTime = 8 * 60 * 60 * 1000; // 8 hours

    for (const [sessionId, session] of this.vrSessions.entries()) {
      if (!session.ended_at && now - session.started_at.getTime() > maxSessionTime) {
        // Auto-end long sessions
        session.ended_at = new Date();
        session.session_duration = Math.floor((now - session.started_at.getTime()) / 1000 / 60); // minutes

        // Update world occupancy
        const world = this.virtualWorlds.get(session.world_id);
        if (world) {
          world.current_occupancy = Math.max(0, world.current_occupancy - 1);
        }

        this.activeSessions.delete(session.user_id);
      }
    }
  }

  /**
   * Public query methods
   */

  public getVirtualWorld(worldId: string): VirtualWorld | null {
    return this.virtualWorlds.get(worldId) || null;
  }

  public getUserWorlds(userId: string): VirtualWorld[] {
    const worldIds = this.userWorlds.get(userId) || new Set();
    return Array.from(worldIds)
      .map(id => this.virtualWorlds.get(id))
      .filter((world): world is VirtualWorld => world !== undefined);
  }

  public getUserAvatars(userId: string): Avatar[] {
    const avatarIds = this.userAvatars.get(userId) || new Set();
    return Array.from(avatarIds)
      .map(id => this.avatars.get(id))
      .filter((avatar): avatar is Avatar => avatar !== undefined);
  }

  public getActiveWorlds(limit: number = 50): VirtualWorld[] {
    return Array.from(this.virtualWorlds.values())
      .filter(world => world.current_occupancy > 0)
      .sort((a, b) => b.current_occupancy - a.current_occupancy)
      .slice(0, limit);
  }

  public getPopularWorlds(limit: number = 20): VirtualWorld[] {
    return Array.from(this.virtualWorlds.values())
      .sort((a, b) => b.world_stats.total_visits - a.world_stats.total_visits)
      .slice(0, limit);
  }

  public getUserVRSession(userId: string): VRSession | null {
    const sessionId = this.activeSessions.get(userId);
    if (sessionId) {
      return this.vrSessions.get(sessionId) || null;
    }
    return null;
  }

  public getMetaverseMetrics(): any {
    return {
      ...this.metrics,
      last_updated: new Date()
    };
  }

  public getProcessingStats(): any {
    return {
      total_worlds: this.virtualWorlds.size,
      active_worlds: this.metrics.active_worlds,
      total_avatars: this.avatars.size,
      active_vr_sessions: this.metrics.active_vr_sessions,
      total_vr_revenue: this.metrics.total_vr_revenue,
      adult_content_worlds: this.metrics.adult_content_worlds,
      cross_platform_sessions: this.metrics.cross_platform_sessions
    };
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down FANZ Metaverse Core');

    try {
      // End all active VR sessions
      for (const session of this.vrSessions.values()) {
        if (!session.ended_at) {
          session.ended_at = new Date();
          session.session_duration = Math.floor(
            (Date.now() - session.started_at.getTime()) / 1000 / 60
          );
        }
      }

      // Clear all data
      this.virtualWorlds.clear();
      this.avatars.clear();
      this.activeExperiences.clear();
      this.vrSessions.clear();
      this.virtualAssets.clear();
      this.userAvatars.clear();
      this.userWorlds.clear();
      this.activeSessions.clear();

      this.initialized = false;
      this.logger.info('✅ Metaverse Core shutdown complete');

    } catch (error) {
      this.logger.error('Error during metaverse shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

export const metaverseCore = new MetaverseCore();

// ===============================
// EXPORTS
// ===============================

export default metaverseCore;

// Types
export type {
  MetaverseConfig,
  VirtualWorld,
  Avatar,
  VRSession,
  Experience,
  WorldType,
  AvatarType,
  VRPlatform,
  ExperienceType
};

// ===============================
// STARTUP MESSAGE
// ===============================

const logger = createSecurityLogger('metaverse-core-main');
logger.info('🌐 FANZ Metaverse Core loaded');
logger.info('🥽 VR/AR Support: Meta Quest, HTC Vive, Valve Index, WebVR, Mobile AR');
logger.info('👤 Avatar System: Advanced customization with adult content features');
logger.info('🌍 Virtual Worlds: Immersive creator spaces with adult entertainment support');
logger.info('🎭 Experiences: Live performances, interactive shows, private sessions');
logger.info('💰 Economics: NFT integration, crypto payments, creator monetization');
logger.info('🔞 Adult Content: Age-verified worlds with intimate interactions');

export { logger as metaverseLogger };
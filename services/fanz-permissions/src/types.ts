/**
 * 🔐 FanzPermissions - Type Definitions
 * 
 * Comprehensive type definitions for the RBAC/ABAC authorization system
 */

// ===== CORE AUTHORIZATION TYPES =====

export interface AuthorizationRequest {
  user: {
    id: string;
    authenticated: boolean;
    roles: string[];
    attributes: UserAttributes;
  };
  
  resource: {
    type: string;
    id?: string;
    cluster: string;
    attributes: ResourceAttributes;
  };
  
  action: {
    operation: string;
    method?: string;
  };
  
  context: {
    ip_address: string;
    user_agent: string;
    timestamp: number;
    cluster: string;
    service: string;
    feature_flags: string[];
  };
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  obligations?: Obligation[];
  advice?: Advice[];
  decision_id: string;
  cached: boolean;
}

export interface Obligation {
  type: string;
  value: any;
  description?: string;
}

export interface Advice {
  type: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

// ===== USER & ROLE TYPES =====

export interface UserRole {
  id: string;
  name: string;
  cluster?: string;
  assignedAt: Date;
  expiresAt?: Date;
  assignedBy: string;
  permissions: string[];
  inheritance: string[];
  restrictions?: RoleRestrictions;
}

export interface RoleRestrictions {
  content_types?: string[];
  age_verification?: string;
  identity_verification?: string;
  content_warnings?: boolean;
  geographic_restrictions?: string[];
  temporal_restrictions?: TemporalRestriction[];
}

export interface TemporalRestriction {
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  timezone?: string;
}

// ===== ATTRIBUTE TYPES =====

export interface UserAttributes {
  // Identity attributes
  user_id?: string;
  username?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
  age_verified?: boolean;
  enhanced_verification?: boolean;
  
  // Demographics
  age?: number;
  gender?: string;
  country?: string;
  state_province?: string;
  timezone?: string;
  preferred_language?: string;
  
  // Account attributes
  account_type?: 'free' | 'premium' | 'creator' | 'admin';
  subscription_tier?: string;
  account_status?: 'active' | 'suspended' | 'pending' | 'disabled';
  join_date?: Date;
  last_login?: Date;
  
  // Verification attributes
  kyc_status?: 'none' | 'pending' | 'approved' | 'failed';
  document_verification?: 'none' | 'partial' | 'complete';
  biometric_verification?: boolean;
  tax_information?: 'none' | 'pending' | 'complete';
  
  // Behavioral attributes
  trust_score?: number;
  violation_count?: number;
  content_quality_score?: number;
  community_standing?: 'new' | 'regular' | 'trusted' | 'vip';
  
  // Subscription and payment attributes
  subscriptions?: UserSubscription[];
  purchases?: UserPurchase[];
  
  // USC 2257 compliance
  usc2257_records?: USC2257Record[];
}

export interface ResourceAttributes {
  // Basic content attributes
  content_id?: string;
  content_type?: 'photo' | 'video' | 'live' | 'message' | 'post';
  creator_id?: string;
  creation_date?: Date;
  publication_date?: Date;
  duration?: number;
  
  // Classification attributes
  content_rating?: 'safe' | 'mature' | 'adult' | 'extreme';
  content_categories?: string[];
  content_tags?: string[];
  ai_classification_confidence?: number;
  content_warnings?: boolean;
  
  // Access attributes
  visibility?: 'public' | 'subscribers' | 'ppv' | 'private';
  price_tier?: string;
  geographic_restrictions?: string[];
  age_restrictions?: number;
  
  // Moderation attributes
  moderation_status?: 'pending' | 'approved' | 'flagged' | 'removed';
  flagged_reasons?: string[];
  moderator_notes?: string;
  appeal_status?: string;
}

export interface UserSubscription {
  creator_id: string;
  status: 'active' | 'expired' | 'cancelled';
  tier: string;
  price: number;
  started_at: Date;
  expires_at: Date;
}

export interface UserPurchase {
  content_id: string;
  price: number;
  purchased_at: Date;
  access_expires?: Date;
}

export interface USC2257Record {
  performer_id: string;
  status: 'compliant' | 'pending' | 'non_compliant';
  last_verified: Date;
}

// ===== CLUSTER & PLATFORM TYPES =====

export type ClusterType = 
  | 'fanzlab'
  | 'boyfanz'
  | 'girlfanz' 
  | 'daddyfanz'
  | 'pupfanz'
  | 'taboofanz'
  | 'transfanz'
  | 'cougarfanz'
  | 'fanzcock';

export interface ClusterConfiguration {
  name: string;
  theme: string;
  content_categories: string[];
  special_permissions: string[];
  verification_requirements: VerificationRequirement[];
  restrictions: ClusterRestrictions;
}

export interface VerificationRequirement {
  type: 'age' | 'identity' | 'enhanced' | 'background';
  required: boolean;
  level?: 'basic' | 'enhanced' | 'premium';
}

export interface ClusterRestrictions {
  min_age?: number;
  content_types?: string[];
  geographic_blocks?: string[];
  content_duration_limits?: ContentDurationLimit;
  enhanced_verification_required?: boolean;
}

export interface ContentDurationLimit {
  max_seconds?: number;
  min_seconds?: number;
  formats?: string[];
}

// ===== POLICY ENGINE TYPES =====

export interface PolicyDocument {
  id: string;
  version: string;
  name: string;
  description: string;
  cluster?: string;
  rules: PolicyRule[];
  metadata: PolicyMetadata;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: PolicyCondition;
  effect: 'allow' | 'deny';
  obligations?: Obligation[];
  advice?: Advice[];
}

export interface PolicyCondition {
  type: 'and' | 'or' | 'not' | 'comparison' | 'membership';
  operands?: PolicyCondition[];
  attribute?: string;
  operator?: ComparisonOperator;
  value?: any;
  values?: any[];
}

export type ComparisonOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_or_equal' 
  | 'less_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex_match';

export interface PolicyMetadata {
  author: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  priority: number;
  enabled: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  suggestion?: string;
}

// ===== AUDIT & MONITORING TYPES =====

export interface AuditLog {
  id: string;
  timestamp: Date;
  decision_id: string;
  user_id: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  cluster: string;
  result: 'ALLOW' | 'DENY';
  reason?: string;
  policy_version?: string;
  evaluation_time_ms: number;
  cached: boolean;
  ip_address: string;
  user_agent: string;
  session_id?: string;
}

export interface PermissionAnalytics {
  total_decisions: number;
  allowed_decisions: number;
  denied_decisions: number;
  average_evaluation_time: number;
  cache_hit_rate: number;
  top_resources: ResourceUsage[];
  top_users: UserUsage[];
  cluster_distribution: ClusterDistribution[];
  error_rate: number;
}

export interface ResourceUsage {
  resource_type: string;
  request_count: number;
  allow_rate: number;
  average_evaluation_time: number;
}

export interface UserUsage {
  user_id: string;
  request_count: number;
  allow_rate: number;
  violations: number;
}

export interface ClusterDistribution {
  cluster: string;
  request_count: number;
  allow_rate: number;
  unique_users: number;
}

// ===== CACHE TYPES =====

export interface CacheEntry<T = any> {
  value: T;
  ttl: number;
  created_at: number;
}

export interface CacheMetrics {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  average_lookup_time: number;
  total_entries: number;
  memory_usage: number;
}

// ===== ERROR TYPES =====

export class FanzPermissionsError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'FanzPermissionsError';
    this.code = code;
    this.details = details;
  }
}

export class AuthorizationError extends FanzPermissionsError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

export class PolicyError extends FanzPermissionsError {
  constructor(message: string, details?: any) {
    super(message, 'POLICY_ERROR', details);
    this.name = 'PolicyError';
  }
}

export class RoleError extends FanzPermissionsError {
  constructor(message: string, details?: any) {
    super(message, 'ROLE_ERROR', details);
    this.name = 'RoleError';
  }
}

export class CacheError extends FanzPermissionsError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}

// ===== SERVICE CONFIGURATION TYPES =====

export interface FanzPermissionsConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  
  policy_engine: {
    provider: 'opa' | 'custom';
    endpoint?: string;
    policies_path: string;
  };
  
  database: {
    url: string;
    ssl?: boolean;
    pool_size?: number;
  };
  
  cache: {
    default_ttl: number;
    max_memory: number;
    cleanup_interval: number;
  };
  
  audit: {
    enabled: boolean;
    retention_days: number;
    storage_type: 'database' | 'file' | 'external';
    external_endpoint?: string;
  };
  
  security: {
    allowed_origins: string[];
    rate_limit: {
      window_ms: number;
      max_requests: number;
    };
    encryption_key: string;
  };
}

// ===== MIDDLEWARE TYPES =====

export interface PermissionMiddlewareOptions {
  resource: string;
  action: string;
  cluster?: string;
  required_attributes?: string[];
  cache_ttl?: number;
  on_deny?: (req: any, res: any, reason: string) => void;
}

export interface AuthorizationMiddleware {
  (options: PermissionMiddlewareOptions): (req: any, res: any, next: any) => Promise<void>;
}

// ===== INTEGRATION TYPES =====

export interface ServiceIntegration {
  service_name: string;
  endpoint: string;
  authentication: {
    type: 'bearer' | 'basic' | 'api_key';
    credentials: string;
  };
  timeout: number;
  retry_attempts: number;
}

export interface WebhookConfiguration {
  url: string;
  events: string[];
  secret: string;
  headers?: Record<string, string>;
}

// ===== EXPORT ALL TYPES =====

export * from './rbac/types';
export * from './abac/types';
export * from './policy/types';
export * from './cache/types';
export * from './audit/types';
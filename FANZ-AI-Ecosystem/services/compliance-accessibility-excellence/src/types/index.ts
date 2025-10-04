// FANZ Global Compliance & Accessibility Excellence - Type Definitions
// Revolutionary compliance automation with GDPR/CCPA, ADA AAA accessibility, AI translation

export * from './compliance';
export * from './accessibility';
export * from './translation';
export * from './jurisdiction';
export * from './privacy';
export * from './audit';
export * from './rights';
export * from './monitoring';

// Core System Types
export interface FanzComplianceSystem {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'maintenance' | 'offline';
  capabilities: SystemCapability[];
  supportedJurisdictions: string[];
  supportedLanguages: string[];
  complianceLevel: ComplianceLevel;
  accessibilityScore: AccessibilityScore;
  lastAudit: Date;
  nextAudit: Date;
  healthStatus: HealthStatus;
}

export interface SystemCapability {
  id: string;
  name: string;
  category: 'compliance' | 'accessibility' | 'translation' | 'privacy' | 'audit';
  enabled: boolean;
  accuracy: number; // 0-100
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  supportedRegions: string[];
  lastUpdated: Date;
}

export interface ComplianceLevel {
  overall: number; // 0-100
  gdpr: number;
  ccpa: number;
  ada: number;
  wcag: 'A' | 'AA' | 'AAA';
  customCompliance: Record<string, number>;
}

export interface AccessibilityScore {
  overall: number; // 0-100
  visual: number;
  auditory: number;
  motor: number;
  cognitive: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: number;
  improvements: number;
}

export interface HealthStatus {
  uptime: number; // percentage
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  throughput: number; // requests per second
  lastHealthCheck: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  affectedServices: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  autoResolvable: boolean;
}

// API Response Types
export interface ComplianceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ComplianceError;
  metadata: ResponseMetadata;
  timestamp: Date;
}

export interface ComplianceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  jurisdiction?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  autoFixAvailable: boolean;
  recommendations: string[];
}

export interface ResponseMetadata {
  requestId: string;
  processingTime: number;
  version: string;
  jurisdiction: string;
  language: string;
  complianceChecked: boolean;
  accessibilityValidated: boolean;
}

// Configuration Types
export interface ComplianceConfig {
  gdpr: GDPRConfig;
  ccpa: CCPAConfig;
  accessibility: AccessibilityConfig;
  translation: TranslationConfig;
  monitoring: MonitoringConfig;
  automation: AutomationConfig;
}

export interface GDPRConfig {
  enabled: boolean;
  strictMode: boolean;
  consentRequired: boolean;
  dataRetentionDays: number;
  rightToErasure: boolean;
  dataPortability: boolean;
  automaticCompliance: boolean;
  notificationThresholdHours: number;
}

export interface CCPAConfig {
  enabled: boolean;
  optOutRequired: boolean;
  doNotSellRequired: boolean;
  personalInfoCategories: string[];
  businessPurposes: string[];
  automaticDeletion: boolean;
  privacyPolicyRequired: boolean;
}

export interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  colorContrastRatio: number;
  textScaling: boolean;
  audioDescriptions: boolean;
  videoSubtitles: boolean;
  alternativeText: boolean;
  focusManagement: boolean;
  semanticMarkup: boolean;
}

export interface TranslationConfig {
  provider: 'google' | 'azure' | 'aws' | 'openai';
  supportedLanguages: string[];
  culturalAdaptation: boolean;
  contextAware: boolean;
  qualityThreshold: number; // 0-100
  humanReview: boolean;
  cacheTranslations: boolean;
  realTimeTranslation: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  realTimeAlerts: boolean;
  complianceThreshold: number; // 0-100
  accessibilityThreshold: number; // 0-100
  responseTimeThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  alertChannels: string[];
  reportFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface AutomationConfig {
  autoFix: boolean;
  autoUpdate: boolean;
  autoTranslate: boolean;
  autoNotify: boolean;
  autoReport: boolean;
  humanConfirmation: boolean;
  confidenceThreshold: number; // 0-100
}

// User and Permission Types
export interface ComplianceUser {
  id: string;
  email: string;
  role: 'admin' | 'compliance_officer' | 'accessibility_specialist' | 'translator' | 'auditor';
  permissions: Permission[];
  jurisdictions: string[];
  languages: string[];
  lastLogin: Date;
  settings: UserSettings;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  scope: 'global' | 'jurisdiction' | 'project';
  conditions?: Record<string, any>;
}

export interface UserSettings {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  accessibility: UserAccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  complianceAlerts: boolean;
  accessibilityIssues: boolean;
  translationUpdates: boolean;
  systemMaintenance: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface DashboardSettings {
  defaultView: 'overview' | 'compliance' | 'accessibility' | 'translation';
  widgets: string[];
  refreshInterval: number; // seconds
  showMetrics: boolean;
  showAlerts: boolean;
  showRecommendations: boolean;
}

export interface UserAccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardOnly: boolean;
  voiceControl: boolean;
}

// Event and Logging Types
export interface ComplianceEvent {
  id: string;
  type: 'compliance_check' | 'accessibility_audit' | 'translation_request' | 'violation_detected' | 'auto_fix_applied';
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  target: string;
  jurisdiction: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processingResult?: ProcessingResult;
}

export interface ProcessingResult {
  success: boolean;
  duration: number; // milliseconds
  actions: string[];
  recommendations: string[];
  autoFixApplied: boolean;
  humanReviewRequired: boolean;
  nextCheck?: Date;
}
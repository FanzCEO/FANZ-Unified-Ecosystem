/**
 * FANZ Advanced Security & Privacy Framework Types
 * 
 * Comprehensive type definitions for:
 * - Zero-trust architecture
 * - Biometric authentication
 * - End-to-end encryption
 * - AI fraud detection
 * - Decentralized identity verification
 * - Privacy-preserving analytics
 */

// Security Levels
export type SecurityLevel = 'public' | 'authenticated' | 'verified' | 'premium' | 'ultra' | 'military';
export type EncryptionLevel = 'none' | 'basic' | 'standard' | 'premium' | 'military' | 'quantum-resistant';
export type AuthenticationMethod = 'password' | 'biometric' | 'mfa' | 'hardware-key' | 'blockchain';

// Core Identity & Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  securityLevel: SecurityLevel;
  accountStatus: AccountStatus;
  profile: UserProfile;
  security: SecurityProfile;
  privacy: PrivacyProfile;
  verification: VerificationStatus;
  metadata: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin' | 'security_admin';
export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'pending_verification' | 'security_review';

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: {
    country: string;
    region?: string;
    timezone: string;
  };
  preferences: {
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationPreferences;
  };
  demographics?: {
    ageRange?: string;
    interests: string[];
    contentPreferences: string[];
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  security: boolean;
  marketing: boolean;
  updates: boolean;
}

// Security Profile
export interface SecurityProfile {
  passwordHash: string;
  passwordSalt: string;
  passwordStrength: number; // 1-100
  lastPasswordChange: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  biometricData?: BiometricData;
  sessionSecurity: SessionSecurity;
  loginHistory: LoginAttempt[];
  securityQuestions?: SecurityQuestion[];
  hardwareKeys: HardwareKey[];
  trustedDevices: TrustedDevice[];
  riskScore: number; // 0-100
  securityFlags: SecurityFlag[];
}

export interface BiometricData {
  fingerprintHashes?: string[];
  faceVectorHash?: string;
  voicePrintHash?: string;
  keystrokeDynamics?: string;
  behavioralBiometrics?: string;
  enrolledAt: Date;
  lastUsed?: Date;
}

export interface SessionSecurity {
  currentSessions: ActiveSession[];
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutes
  ipWhitelist?: string[];
  geoRestrictions?: string[];
  deviceRestrictions?: string[];
}

export interface ActiveSession {
  sessionId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
  securityFlags: string[];
}

export interface LoginAttempt {
  id: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  method: AuthenticationMethod;
  success: boolean;
  failureReason?: string;
  location: {
    country: string;
    city?: string;
  };
  deviceFingerprint: string;
  riskScore: number;
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answerHash: string;
  createdAt: Date;
  isActive: boolean;
}

export interface HardwareKey {
  id: string;
  keyId: string;
  publicKey: string;
  name: string;
  addedAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface TrustedDevice {
  id: string;
  deviceFingerprint: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  addedAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  trustLevel: number; // 1-100
}

export interface SecurityFlag {
  type: SecurityFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: any;
}

export type SecurityFlagType = 
  | 'suspicious_login'
  | 'unusual_location'
  | 'multiple_failed_attempts'
  | 'account_compromise_suspected'
  | 'phishing_attempt'
  | 'malware_detected'
  | 'data_breach_detected'
  | 'social_engineering_detected';

// Privacy Profile
export interface PrivacyProfile {
  dataRetentionDays: number;
  analyticsOptIn: boolean;
  marketingOptIn: boolean;
  dataSharingOptIn: boolean;
  personalizedAdsOptIn: boolean;
  locationTrackingOptIn: boolean;
  biometricDataOptIn: boolean;
  rightsRequests: PrivacyRightsRequest[];
  consentHistory: ConsentRecord[];
  dataPortabilityRequests: DataPortabilityRequest[];
  privacySettings: PrivacySettings;
  encryptionPreferences: EncryptionPreferences;
}

export interface PrivacyRightsRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  reason?: string;
  documents: string[];
}

export interface ConsentRecord {
  id: string;
  consentType: string;
  version: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  method: 'explicit' | 'implicit' | 'opt_in' | 'pre_checked';
}

export interface DataPortabilityRequest {
  id: string;
  dataTypes: string[];
  format: 'json' | 'csv' | 'xml';
  status: 'pending' | 'processing' | 'ready' | 'downloaded' | 'expired';
  requestedAt: Date;
  availableAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends_only';
  searchable: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  allowLocationSharing: boolean;
  dataMinimization: boolean;
  automaticDeletion: boolean;
  encryptionRequired: boolean;
}

export interface EncryptionPreferences {
  level: EncryptionLevel;
  algorithm: 'AES-256' | 'RSA-4096' | 'ECC-P521' | 'X25519' | 'quantum-resistant';
  keyRotationDays: number;
  endToEndEncryption: boolean;
  localEncryption: boolean;
  backupEncryption: boolean;
}

// Verification & Identity
export interface VerificationStatus {
  email: EmailVerification;
  phone: PhoneVerification;
  identity: IdentityVerification;
  address: AddressVerification;
  payment: PaymentVerification;
  biometric: BiometricVerification;
  decentralizedId?: DecentralizedIdentity;
}

export interface EmailVerification {
  verified: boolean;
  verifiedAt?: Date;
  verificationToken?: string;
  attempts: number;
  lastAttempt?: Date;
}

export interface PhoneVerification {
  verified: boolean;
  verifiedAt?: Date;
  verificationCode?: string;
  attempts: number;
  lastAttempt?: Date;
  method: 'sms' | 'call' | 'whatsapp';
}

export interface IdentityVerification {
  status: 'not_started' | 'in_progress' | 'verified' | 'rejected' | 'expired';
  level: 'basic' | 'enhanced' | 'premium';
  documents: VerificationDocument[];
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
  provider: 'internal' | 'jumio' | 'onfido' | 'trulioo';
}

export interface VerificationDocument {
  id: string;
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
  status: 'uploaded' | 'processing' | 'verified' | 'rejected';
  uploadedAt: Date;
  processedAt?: Date;
  extractedData?: {
    name: string;
    dateOfBirth: string;
    address: string;
    documentNumber: string;
    expiryDate: string;
    issuingCountry: string;
  };
  confidenceScore?: number; // 0-100
}

export interface AddressVerification {
  verified: boolean;
  verifiedAt?: Date;
  method: 'document' | 'utility_bill' | 'bank_statement' | 'postal_code';
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
}

export interface PaymentVerification {
  verified: boolean;
  verifiedAt?: Date;
  methods: PaymentMethodVerification[];
}

export interface PaymentMethodVerification {
  id: string;
  type: 'card' | 'bank_account' | 'crypto_wallet' | 'digital_wallet';
  verified: boolean;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  verificationAmount?: number;
}

export interface BiometricVerification {
  verified: boolean;
  verifiedAt?: Date;
  types: ('fingerprint' | 'face' | 'voice' | 'iris')[];
  qualityScore: number; // 0-100
  livenessScore: number; // 0-100
}

export interface DecentralizedIdentity {
  did: string; // Decentralized Identifier
  publicKey: string;
  proofOfControl: string;
  credentialHash: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
  verifiableCredentials: VerifiableCredential[];
}

export interface VerifiableCredential {
  id: string;
  type: string;
  issuer: string;
  issuanceDate: Date;
  expirationDate?: Date;
  credentialSubject: any;
  proof: {
    type: string;
    created: Date;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

// Fraud Detection & AI Security
export interface FraudDetectionResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  recommendations: SecurityRecommendation[];
  timestamp: Date;
  model: {
    name: string;
    version: string;
    confidence: number;
  };
}

export interface RiskFactor {
  type: string;
  weight: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: any;
}

export interface SecurityRecommendation {
  action: SecurityAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reasoning: string;
  automated: boolean;
}

export type SecurityAction = 
  | 'allow'
  | 'challenge_mfa'
  | 'challenge_biometric'
  | 'require_verification'
  | 'flag_for_review'
  | 'temporary_block'
  | 'permanent_block'
  | 'escalate_security';

// Encryption & Cryptography
export interface EncryptionContext {
  algorithm: string;
  keySize: number;
  mode: string;
  padding?: string;
  iv: string;
  authTag?: string;
  timestamp: Date;
}

export interface CryptographicKey {
  id: string;
  type: 'symmetric' | 'asymmetric';
  algorithm: string;
  keySize: number;
  purpose: 'encryption' | 'signing' | 'key_exchange';
  publicKey?: string;
  privateKeyHash: string;
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  isActive: boolean;
  accessCount: number;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  context: EncryptionContext;
  keyId: string;
  checksum: string;
}

// Audit & Compliance
export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'blocked';
  ipAddress: string;
  userAgent: string;
  location: {
    country: string;
    city?: string;
  };
  riskScore: number;
  metadata: any;
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'secret';
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'pci_dss' | 'iso27001';
  period: {
    startDate: Date;
    endDate: Date;
  };
  status: 'compliant' | 'non_compliant' | 'partially_compliant';
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ComplianceFinding {
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable';
  evidence: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation?: string;
  dueDate?: Date;
}

// System Configuration
export interface SecurityConfiguration {
  global: GlobalSecuritySettings;
  authentication: AuthenticationSettings;
  encryption: EncryptionSettings;
  privacy: PrivacySettings;
  compliance: ComplianceSettings;
  monitoring: MonitoringSettings;
  incident: IncidentResponseSettings;
}

export interface GlobalSecuritySettings {
  securityLevel: SecurityLevel;
  zeroTrustMode: boolean;
  defaultEncryption: EncryptionLevel;
  sessionTimeout: number;
  maxLoginAttempts: number;
  accountLockoutDuration: number;
  passwordPolicy: PasswordPolicy;
  dataRetentionDays: number;
  auditLogRetentionDays: number;
}

export interface AuthenticationSettings {
  requireMFA: boolean;
  allowBiometric: boolean;
  allowHardwareKeys: boolean;
  allowSocialLogin: boolean;
  sessionConcurrencyLimit: number;
  deviceTrustDuration: number;
  locationBasedSecurity: boolean;
  behavioralAnalysis: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number; // days
  complexityScore: number; // 0-100
}

export interface ComplianceSettings {
  enableGDPR: boolean;
  enableCCPA: boolean;
  enableHIPAA: boolean;
  dataProcessingBasis: string[];
  consentManagement: boolean;
  dataPortability: boolean;
  rightToErasure: boolean;
  auditTrail: boolean;
}

export interface MonitoringSettings {
  enableRealTimeMonitoring: boolean;
  enableAnomalyDetection: boolean;
  enableThreatIntelligence: boolean;
  alertThresholds: {
    failedLogins: number;
    unusualLocations: number;
    dataAccess: number;
    privilegedActions: number;
  };
  retentionPeriod: number; // days
}

export interface IncidentResponseSettings {
  autoResponse: boolean;
  escalationRules: EscalationRule[];
  notificationChannels: string[];
  quarantineThreshold: number;
  forensicsEnabled: boolean;
}

export interface EscalationRule {
  condition: string;
  threshold: number;
  action: string;
  assignee: string;
  timeoutMinutes: number;
}

// User Metadata
export interface UserMetadata {
  deviceFingerprints: string[];
  ipHistory: string[];
  locationHistory: LocationHistory[];
  behaviorProfile: BehaviorProfile;
  riskProfile: RiskProfile;
  preferences: any;
  tags: string[];
  notes: string;
}

export interface LocationHistory {
  timestamp: Date;
  ipAddress: string;
  location: {
    country: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  accuracy: number;
  source: 'ip' | 'gps' | 'cell_tower' | 'wifi';
}

export interface BehaviorProfile {
  typingPatterns: TypingPattern[];
  mouseMovements: MouseMovement[];
  navigationPatterns: NavigationPattern[];
  timezoneBehavior: TimezoneBehavior;
  deviceUsage: DeviceUsage[];
  lastUpdated: Date;
}

export interface TypingPattern {
  key: string;
  dwellTime: number; // milliseconds
  flightTime: number; // milliseconds between keys
  pressure?: number;
  timestamp: Date;
}

export interface MouseMovement {
  x: number;
  y: number;
  velocity: number;
  acceleration: number;
  timestamp: Date;
}

export interface NavigationPattern {
  path: string;
  duration: number;
  clickCoordinates: { x: number; y: number }[];
  scrollBehavior: ScrollBehavior[];
  timestamp: Date;
}

export interface ScrollBehavior {
  direction: 'up' | 'down';
  velocity: number;
  distance: number;
  timestamp: Date;
}

export interface TimezoneBehavior {
  timezone: string;
  activeHours: number[];
  weekdayPatterns: number[];
  weekendPatterns: number[];
}

export interface DeviceUsage {
  deviceType: string;
  os: string;
  browser: string;
  usage: {
    sessionsPerDay: number;
    avgSessionDuration: number;
    preferredTimes: number[];
  };
}

export interface RiskProfile {
  baselineRisk: number; // 0-100
  currentRisk: number; // 0-100
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  riskFactors: {
    location: number;
    device: number;
    behavior: number;
    network: number;
    temporal: number;
  };
  mitigationStrategies: string[];
  lastAssessment: Date;
}
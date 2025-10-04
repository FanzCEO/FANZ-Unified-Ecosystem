// FANZ Compliance Types - GDPR, CCPA, Multi-Jurisdiction Support
// Revolutionary automated compliance for creator economy platforms

// Core Compliance Types
export interface ComplianceResult {
  jurisdiction: string;
  complianceLevel: 'full' | 'partial' | 'non_compliant';
  requirements: ComplianceRequirement[];
  violations: ComplianceViolation[];
  riskScore: number; // 0-100
  recommendations: ComplianceRecommendation[];
  autoFixAvailable: boolean;
  estimatedCost: ComplianceCost;
  timeline: ComplianceTimeline;
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface ComplianceRequirement {
  id: string;
  regulation: string;
  article: string;
  description: string;
  mandatory: boolean;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  evidence: ComplianceEvidence[];
  implementationGuide: string;
  autoImplementable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  dependencies: string[];
}

export interface ComplianceViolation {
  id: string;
  regulation: string;
  article: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  impact: string;
  potentialFine: number;
  currency: string;
  detectedAt: Date;
  location: ViolationLocation;
  autoFixable: boolean;
  fixEstimatedTime: number; // hours
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
}

export interface ComplianceRecommendation {
  id: string;
  type: 'fix' | 'enhancement' | 'prevention';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: number; // hours
  impact: string;
  riskReduction: number; // percentage
  autoImplementable: boolean;
  resources: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'configuration' | 'code' | 'certificate';
  name: string;
  url: string;
  description: string;
  validFrom: Date;
  validUntil?: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ComplianceCost {
  implementation: number;
  maintenance: number;
  legal: number;
  training: number;
  monitoring: number;
  total: number;
  currency: string;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  description: string;
  oneTime: boolean;
  recurring: 'monthly' | 'yearly' | 'quarterly';
}

export interface ComplianceTimeline {
  totalEstimatedTime: number; // days
  phases: CompliancePhase[];
  milestones: ComplianceMilestone[];
  criticalPath: string[];
}

export interface CompliancePhase {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  dependencies: string[];
  deliverables: string[];
  resources: string[];
}

export interface ComplianceMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  achieved: boolean;
  achievedDate?: Date;
  blockers: string[];
}

export interface ViolationLocation {
  system: string;
  component: string;
  url?: string;
  codeReference?: string;
  dataFlow?: string;
  userJourney?: string;
}

// GDPR Specific Types
export interface GDPRCompliance {
  overallScore: number; // 0-100
  articles: GDPRArticleCompliance[];
  dataProcessing: DataProcessingCompliance;
  rightsManagement: DataRightsCompliance;
  securityMeasures: SecurityMeasuresCompliance;
  documentation: DocumentationCompliance;
  dpo: DPOCompliance;
  notifications: BreachNotificationCompliance;
}

export interface GDPRArticleCompliance {
  article: string;
  title: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  score: number; // 0-100
  requirements: string[];
  evidence: ComplianceEvidence[];
  gaps: string[];
  actions: string[];
}

export interface DataProcessingCompliance {
  lawfulBasis: LawfulBasisCompliance[];
  consentManagement: ConsentCompliance;
  dataMinimization: boolean;
  purposeLimitation: boolean;
  accuracyMaintenance: boolean;
  storageLimitation: StorageLimitationCompliance;
  integrityConfidentiality: boolean;
  accountability: AccountabilityCompliance;
}

export interface LawfulBasisCompliance {
  basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  documented: boolean;
  valid: boolean;
  reviewDate: Date;
  evidence: ComplianceEvidence[];
}

export interface ConsentCompliance {
  explicit: boolean;
  informed: boolean;
  specific: boolean;
  withdrawable: boolean;
  granular: boolean;
  recordsKept: boolean;
  childConsent: boolean;
  consentRate: number; // percentage
  withdrawalRate: number; // percentage
}

export interface StorageLimitationCompliance {
  retentionPolicies: RetentionPolicy[];
  automaticDeletion: boolean;
  archivalProcess: boolean;
  userDataDeletion: boolean;
  averageRetentionDays: number;
}

export interface RetentionPolicy {
  dataType: string;
  purpose: string;
  retentionPeriod: number; // days
  deletionMethod: 'automatic' | 'manual' | 'archive';
  legalBasis: string;
  reviewed: boolean;
  lastReview: Date;
  nextReview: Date;
}

export interface AccountabilityCompliance {
  dpia: boolean; // Data Protection Impact Assessment
  recordsOfProcessing: boolean;
  policies: boolean;
  training: boolean;
  audits: boolean;
  compliance: number; // 0-100
}

export interface DataRightsCompliance {
  rightOfAccess: RightCompliance;
  rightOfRectification: RightCompliance;
  rightOfErasure: RightCompliance;
  rightOfRestriction: RightCompliance;
  rightOfPortability: RightCompliance;
  rightToObject: RightCompliance;
  automatedDecisionMaking: RightCompliance;
}

export interface RightCompliance {
  implemented: boolean;
  automated: boolean;
  responseTimeCompliance: number; // percentage within 30 days
  averageResponseTime: number; // days
  requestVolume: number;
  fulfillmentRate: number; // percentage
  appealRate: number; // percentage
}

export interface SecurityMeasuresCompliance {
  encryption: EncryptionCompliance;
  accessControl: AccessControlCompliance;
  monitoring: MonitoringCompliance;
  backups: BackupCompliance;
  incidentResponse: IncidentResponseCompliance;
  vendorManagement: VendorManagementCompliance;
}

export interface EncryptionCompliance {
  atRest: boolean;
  inTransit: boolean;
  keyManagement: boolean;
  algorithms: string[];
  strength: string;
  compliant: boolean;
}

export interface AccessControlCompliance {
  authentication: boolean;
  authorization: boolean;
  roleBasedAccess: boolean;
  leastPrivilege: boolean;
  regularReviews: boolean;
  complianceScore: number; // 0-100
}

export interface MonitoringCompliance {
  auditLogs: boolean;
  realTimeMonitoring: boolean;
  anomalyDetection: boolean;
  alerting: boolean;
  reportGeneration: boolean;
  retentionCompliance: boolean;
}

export interface BackupCompliance {
  regularBackups: boolean;
  encryptedBackups: boolean;
  offlineBackups: boolean;
  testRecovery: boolean;
  retentionCompliance: boolean;
  geographicRestrictions: boolean;
}

export interface IncidentResponseCompliance {
  responseTeam: boolean;
  procedures: boolean;
  communication: boolean;
  documentation: boolean;
  lessons: boolean;
  regulatoryNotification: boolean;
  timelines: IncidentTimelines;
}

export interface IncidentTimelines {
  detection: number; // hours
  containment: number; // hours
  eradication: number; // hours
  recovery: number; // hours
  notification: number; // hours (72 for GDPR)
}

export interface VendorManagementCompliance {
  dueD diligence: boolean;
  dataProcessingAgreements: boolean;
  regularAudits: boolean;
  riskAssessments: boolean;
  terminationProcedures: boolean;
  complianceMonitoring: boolean;
}

export interface DocumentationCompliance {
  privacyPolicy: DocumentStatus;
  cookiePolicy: DocumentStatus;
  termsOfService: DocumentStatus;
  dataProcessingRecords: DocumentStatus;
  dpia: DocumentStatus;
  trainingMaterials: DocumentStatus;
  procedures: DocumentStatus;
}

export interface DocumentStatus {
  exists: boolean;
  current: boolean;
  accessible: boolean;
  translated: boolean;
  lastReview: Date;
  nextReview: Date;
  languages: string[];
}

export interface DPOCompliance {
  appointed: boolean;
  qualified: boolean;
  independent: boolean;
  accessible: boolean;
  resources: boolean;
  training: boolean;
  reports: boolean;
}

export interface BreachNotificationCompliance {
  procedures: boolean;
  timeline: boolean; // 72 hours
  documentation: boolean;
  regulatoryNotification: boolean;
  dataSubjectNotification: boolean;
  averageNotificationTime: number; // hours
}

// CCPA Specific Types
export interface CCPACompliance {
  overallScore: number; // 0-100
  disclosure: CCPADisclosure;
  rights: CCPARights;
  optOut: CCPAOptOut;
  nonDiscrimination: CCPANonDiscrimination;
  verification: CCPAVerification;
  thirdPartySharing: CCPAThirdPartySharing;
}

export interface CCPADisclosure {
  collectionNotice: boolean;
  privacyPolicy: boolean;
  categoriesCollected: boolean;
  purposesDisclosed: boolean;
  categoriesSold: boolean;
  categoriesShared: boolean;
  rightsDisclosed: boolean;
  contactInfo: boolean;
}

export interface CCPARights {
  rightToKnow: RightCompliance;
  rightToDelete: RightCompliance;
  rightToOptOut: RightCompliance;
  rightToNonDiscrimination: RightCompliance;
}

export interface CCPAOptOut {
  mechanism: boolean;
  prominent: boolean;
  easy: boolean;
  honored: boolean;
  timeline: number; // days
  verification: boolean;
}

export interface CCPANonDiscrimination {
  policy: boolean;
  implemented: boolean;
  monitored: boolean;
  complaints: number;
  resolved: number;
}

export interface CCPAVerification {
  identityVerification: boolean;
  requestVerification: boolean;
  methods: string[];
  averageTime: number; // days
  successRate: number; // percentage
}

export interface CCPAThirdPartySharing {
  disclosed: boolean;
  contracts: boolean;
  monitoring: boolean;
  optOutHonored: boolean;
  salesTracking: boolean;
}

// Multi-Jurisdiction Types
export interface JurisdictionCompliance {
  [jurisdiction: string]: {
    regulations: RegulationCompliance[];
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastAssessment: Date;
    nextAssessment: Date;
    localRequirements: LocalRequirement[];
    culturalConsiderations: CulturalConsideration[];
  };
}

export interface RegulationCompliance {
  regulation: string;
  version: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  score: number; // 0-100
  requirements: ComplianceRequirement[];
  violations: ComplianceViolation[];
  lastAudit: Date;
  nextAudit: Date;
}

export interface LocalRequirement {
  id: string;
  category: string;
  requirement: string;
  mandatory: boolean;
  implemented: boolean;
  evidence: ComplianceEvidence[];
  localPartner?: string;
}

export interface CulturalConsideration {
  aspect: string;
  requirement: string;
  implemented: boolean;
  notes: string;
  impact: 'low' | 'medium' | 'high';
}

// Automation Types
export interface ComplianceAutomation {
  rules: AutomationRule[];
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  monitoring: AutomationMonitoring;
  reporting: AutomationReporting;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  regulation: string;
  condition: string;
  action: string;
  enabled: boolean;
  confidence: number; // 0-100
  lastTriggered?: Date;
  successRate: number; // percentage
}

export interface AutomationTrigger {
  id: string;
  type: 'schedule' | 'event' | 'threshold' | 'manual';
  condition: Record<string, any>;
  frequency?: string;
  enabled: boolean;
}

export interface AutomationAction {
  id: string;
  type: 'fix' | 'notify' | 'report' | 'escalate';
  implementation: string;
  autoExecute: boolean;
  requiresApproval: boolean;
  rollbackable: boolean;
}

export interface AutomationMonitoring {
  rulesExecuted: number;
  successRate: number; // percentage
  averageExecutionTime: number; // milliseconds
  errors: AutomationError[];
  performance: PerformanceMetrics;
}

export interface AutomationError {
  id: string;
  ruleId: string;
  error: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface PerformanceMetrics {
  throughput: number; // rules per hour
  latency: number; // average milliseconds
  errorRate: number; // percentage
  availability: number; // percentage
}

export interface AutomationReporting {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'html' | 'json';
  includeMetrics: boolean;
  includeRecommendations: boolean;
  customMetrics: string[];
}
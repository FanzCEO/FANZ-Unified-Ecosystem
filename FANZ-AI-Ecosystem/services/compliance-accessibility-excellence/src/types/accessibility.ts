// FANZ Accessibility Types - WCAG AAA, ADA Compliance, Universal Design
// Revolutionary accessibility automation for inclusive creator platforms

// Core Accessibility Types
export interface AccessibilityAudit {
  id: string;
  url: string;
  timestamp: Date;
  wcagLevel: 'A' | 'AA' | 'AAA';
  overallScore: number; // 0-100
  passedTests: number;
  failedTests: number;
  totalTests: number;
  violations: AccessibilityViolation[];
  improvements: AccessibilityImprovement[];
  aiEnhancements: AIAccessibilityFeature[];
  compliance: AccessibilityCompliance;
  userImpact: UserImpactAssessment;
}

export interface AccessibilityViolation {
  id: string;
  rule: string;
  wcagGuideline: string;
  level: 'A' | 'AA' | 'AAA';
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  impact: 'low' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
  autoFixable: boolean;
  estimatedFixTime: number; // minutes
  affectedUsers: DisabilityType[];
  priority: number; // 1-10
}

export interface ViolationNode {
  html: string;
  selector: string;
  xpath: string;
  target: string[];
  failureSummary: string;
  any: ViolationCheck[];
  all: ViolationCheck[];
  none: ViolationCheck[];
}

export interface ViolationCheck {
  id: string;
  impact: string;
  message: string;
  data: Record<string, any>;
  relatedNodes: ViolationRelatedNode[];
}

export interface ViolationRelatedNode {
  html: string;
  selector: string;
  xpath: string;
}

export interface AccessibilityImprovement {
  id: string;
  type: 'enhancement' | 'optimization' | 'innovation';
  category: 'visual' | 'auditory' | 'motor' | 'cognitive' | 'universal';
  title: string;
  description: string;
  implementation: string;
  impact: string;
  beneficiaryGroups: DisabilityType[];
  estimatedEffort: number; // hours
  wcagBenefit: WCAGBenefit;
  businessValue: BusinessValue;
  aiAssisted: boolean;
}

export interface AIAccessibilityFeature {
  id: string;
  name: string;
  category: 'visual' | 'auditory' | 'cognitive' | 'motor' | 'multi-modal';
  description: string;
  technology: string;
  implementation: string;
  accuracy: number; // 0-100
  supportedLanguages: string[];
  deviceSupport: DeviceSupport[];
  userFeedback: UserFeedback[];
  enabled: boolean;
}

export interface AccessibilityCompliance {
  wcag21: WCAGCompliance;
  wcag22: WCAGCompliance;
  ada: ADACompliance;
  section508: Section508Compliance;
  en301549: EN301549Compliance;
  customStandards: CustomStandard[];
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA';
  version: '2.1' | '2.2' | '2.3';
  overallScore: number; // 0-100
  principles: WCAGPrincipleCompliance[];
  guidelines: WCAGGuidelineCompliance[];
  successCriteria: WCAGSuccessCriteriaCompliance[];
  conformanceLevel: ConformanceLevel;
}

export interface WCAGPrincipleCompliance {
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
  score: number; // 0-100
  guidelines: string[];
  status: 'pass' | 'fail' | 'partial';
  issues: number;
}

export interface WCAGGuidelineCompliance {
  guideline: string;
  title: string;
  principle: string;
  score: number; // 0-100
  successCriteria: string[];
  status: 'pass' | 'fail' | 'partial';
  issues: AccessibilityIssue[];
}

export interface WCAGSuccessCriteriaCompliance {
  criteria: string;
  title: string;
  level: 'A' | 'AA' | 'AAA';
  guideline: string;
  status: 'pass' | 'fail' | 'not_applicable';
  techniques: TechniqueCompliance[];
  failures: FailureCompliance[];
  notes: string;
}

export interface AccessibilityIssue {
  id: string;
  type: 'violation' | 'incomplete' | 'review_needed';
  severity: 'low' | 'moderate' | 'serious' | 'critical';
  description: string;
  element: string;
  recommendation: string;
  resources: string[];
}

export interface TechniqueCompliance {
  id: string;
  title: string;
  type: 'general' | 'html' | 'css' | 'javascript' | 'aria' | 'multimedia';
  implemented: boolean;
  tested: boolean;
  notes: string;
}

export interface FailureCompliance {
  id: string;
  title: string;
  description: string;
  present: boolean;
  remediated: boolean;
  notes: string;
}

export interface ConformanceLevel {
  claimed: 'A' | 'AA' | 'AAA';
  tested: 'A' | 'AA' | 'AAA';
  verified: 'A' | 'AA' | 'AAA';
  scope: string[];
  exceptions: string[];
  additionalRequirements: string[];
}

export interface ADACompliance {
  overallScore: number; // 0-100
  title1: boolean;
  title2: boolean;
  title3: boolean;
  section504: boolean;
  websiteCompliance: boolean;
  mobileCompliance: boolean;
  physicalCompliance: boolean;
  communicationCompliance: boolean;
  reasonableAccommodations: ReasonableAccommodation[];
}

export interface ReasonableAccommodation {
  type: string;
  description: string;
  implemented: boolean;
  cost: number;
  timeline: number; // days
  documentation: string[];
}

export interface Section508Compliance {
  overallScore: number; // 0-100
  functionalPerformance: FunctionalPerformanceCriteria[];
  technicalRequirements: TechnicalRequirement[];
  documentation: DocumentationRequirement[];
  testing: TestingRequirement[];
}

export interface FunctionalPerformanceCriteria {
  id: string;
  description: string;
  met: boolean;
  evidence: string[];
  gaps: string[];
}

export interface TechnicalRequirement {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  implementation: string;
  testing: string;
}

export interface DocumentationRequirement {
  type: string;
  required: boolean;
  present: boolean;
  current: boolean;
  location: string;
}

export interface TestingRequirement {
  type: 'automated' | 'manual' | 'user_testing';
  frequency: string;
  lastTested: Date;
  nextTest: Date;
  results: TestResult[];
}

export interface TestResult {
  date: Date;
  method: string;
  score: number;
  issues: number;
  improvements: number;
  notes: string;
}

export interface EN301549Compliance {
  overallScore: number; // 0-100
  webContent: boolean;
  nonWebDocuments: boolean;
  nonWebSoftware: boolean;
  mobileApplications: boolean;
  authoring: boolean;
  userAgents: boolean;
  assistiveTechnology: boolean;
}

export interface CustomStandard {
  name: string;
  version: string;
  authority: string;
  scope: string[];
  requirements: CustomRequirement[];
  compliance: number; // 0-100
}

export interface CustomRequirement {
  id: string;
  category: string;
  description: string;
  mandatory: boolean;
  met: boolean;
  evidence: string[];
}

export interface UserImpactAssessment {
  affectedUsers: AffectedUserGroup[];
  severityDistribution: SeverityDistribution;
  priorityMatrix: PriorityMatrix;
  usabilityImpact: UsabilityImpact;
  businessImpact: BusinessImpact;
}

export interface AffectedUserGroup {
  disability: DisabilityType;
  percentage: number; // of total user base
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  workarounds: string[];
  assistiveTech: string[];
}

export interface DisabilityType {
  category: 'visual' | 'auditory' | 'motor' | 'cognitive' | 'neurological' | 'multiple';
  specific: string[];
  assistiveTechnology: AssistiveTechnology[];
  prevalence: number; // percentage of population
}

export interface AssistiveTechnology {
  type: 'screen_reader' | 'magnifier' | 'voice_control' | 'switch' | 'eye_tracking' | 'other';
  name: string;
  compatibility: 'full' | 'partial' | 'none' | 'unknown';
  version: string;
  marketShare: number; // percentage
}

export interface SeverityDistribution {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface PriorityMatrix {
  highImpactEasyFix: AccessibilityIssue[];
  highImpactHardFix: AccessibilityIssue[];
  lowImpactEasyFix: AccessibilityIssue[];
  lowImpactHardFix: AccessibilityIssue[];
}

export interface UsabilityImpact {
  taskCompletionRate: number; // percentage
  taskCompletionTime: number; // seconds
  errorRate: number; // percentage
  userSatisfaction: number; // 0-10
  cognitiveLoad: number; // 0-10
  accessibility: number; // 0-10
}

export interface BusinessImpact {
  legalRisk: 'low' | 'medium' | 'high' | 'critical';
  reputationRisk: 'low' | 'medium' | 'high' | 'critical';
  marketOpportunity: number; // estimated additional users
  costOfInaction: number; // estimated cost
  competitiveAdvantage: string[];
  brandBenefit: string[];
}

export interface WCAGBenefit {
  guidelines: string[];
  principlesBenefited: string[];
  levelImprovement: 'A' | 'AA' | 'AAA';
  criteriaImpacted: string[];
}

export interface BusinessValue {
  userExperienceImprovement: number; // 0-100
  marketExpansion: number; // estimated percentage
  legalRiskReduction: number; // percentage
  brandValueIncrease: number; // 0-100
  competitiveAdvantage: string[];
}

export interface DeviceSupport {
  type: 'desktop' | 'mobile' | 'tablet' | 'watch' | 'tv' | 'ar_vr';
  os: string[];
  browsers: string[];
  assistiveTech: string[];
  limitations: string[];
}

export interface UserFeedback {
  userId: string;
  disability: string;
  assistiveTech: string;
  rating: number; // 1-5
  comments: string;
  suggestions: string[];
  timestamp: Date;
}

// Accessibility Testing Types
export interface AccessibilityTestSuite {
  id: string;
  name: string;
  version: string;
  tools: AccessibilityTool[];
  testCases: AccessibilityTestCase[];
  configuration: TestConfiguration;
  schedule: TestSchedule;
  reporting: TestReporting;
}

export interface AccessibilityTool {
  name: string;
  type: 'automated' | 'manual' | 'user_testing';
  version: string;
  capabilities: string[];
  languages: string[];
  platforms: string[];
  accuracy: number; // 0-100
  coverage: TestCoverage;
}

export interface TestCoverage {
  wcagGuidelines: number; // percentage
  techniques: number; // percentage
  failureModes: number; // percentage
  userScenarios: number; // percentage
}

export interface AccessibilityTestCase {
  id: string;
  name: string;
  description: string;
  wcagCriteria: string[];
  userGroup: string[];
  testSteps: TestStep[];
  expectedResults: string[];
  actualResults?: string[];
  status: 'pass' | 'fail' | 'skip' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  automation: boolean;
}

export interface TestStep {
  step: number;
  description: string;
  userAction: string;
  assistiveTech?: string;
  expectedOutcome: string;
  notes?: string;
}

export interface TestConfiguration {
  browsers: BrowserConfig[];
  devices: DeviceConfig[];
  assistiveTechnology: AssistiveTechConfig[];
  userProfiles: UserProfile[];
  environments: string[];
}

export interface BrowserConfig {
  name: string;
  version: string;
  platform: string;
  accessibility: boolean;
  extensions: string[];
}

export interface DeviceConfig {
  type: string;
  model: string;
  os: string;
  version: string;
  accessibility: boolean;
}

export interface AssistiveTechConfig {
  name: string;
  type: string;
  version: string;
  compatibility: string[];
  settings: Record<string, any>;
}

export interface UserProfile {
  id: string;
  disability: DisabilityType;
  assistiveTech: string[];
  experience: 'beginner' | 'intermediate' | 'expert';
  preferences: UserPreferences;
}

export interface UserPreferences {
  navigation: string;
  feedback: string[];
  speed: 'slow' | 'normal' | 'fast';
  verbosity: 'minimal' | 'standard' | 'verbose';
  customizations: Record<string, any>;
}

export interface TestSchedule {
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  triggers: string[];
  automated: boolean;
  notifications: string[];
  rollback: boolean;
}

export interface TestReporting {
  format: string[];
  recipients: string[];
  frequency: string;
  metrics: ReportingMetrics;
  visualizations: string[];
  export: string[];
}

export interface ReportingMetrics {
  accessibility: string[];
  performance: string[];
  usability: string[];
  business: string[];
  trends: string[];
}

// AI-Enhanced Accessibility Types
export interface AIAccessibilityEngine {
  id: string;
  name: string;
  capabilities: AICapability[];
  models: AIModel[];
  languages: string[];
  accuracy: AccuracyMetrics;
  performance: PerformanceMetrics;
  integration: IntegrationConfig;
}

export interface AICapability {
  type: 'alt_text' | 'audio_description' | 'caption_generation' | 'content_simplification' | 'navigation_assistance' | 'color_contrast' | 'focus_management';
  description: string;
  accuracy: number; // 0-100
  languages: string[];
  realTime: boolean;
  customizable: boolean;
}

export interface AIModel {
  name: string;
  type: 'vision' | 'language' | 'multimodal' | 'specialist';
  provider: string;
  version: string;
  capabilities: string[];
  trainingData: string;
  performance: ModelPerformance;
}

export interface ModelPerformance {
  accuracy: number; // 0-100
  precision: number; // 0-100
  recall: number; // 0-100
  f1Score: number; // 0-100
  latency: number; // milliseconds
  throughput: number; // requests per second
}

export interface AccuracyMetrics {
  overall: number; // 0-100
  byDisability: Record<string, number>;
  byContent: Record<string, number>;
  byLanguage: Record<string, number>;
  falsePositives: number; // percentage
  falseNegatives: number; // percentage
}

export interface IntegrationConfig {
  apis: string[];
  webhooks: string[];
  realTime: boolean;
  batchProcessing: boolean;
  cdn: boolean;
  caching: CachingConfig;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number; // seconds
  invalidation: string[];
  storage: string;
  compression: boolean;
}
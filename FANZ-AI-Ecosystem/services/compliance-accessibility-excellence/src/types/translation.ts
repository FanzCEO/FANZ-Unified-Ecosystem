// FANZ Translation Types - AI-Powered Multi-Language Support with Cultural Adaptation
// Revolutionary global localization for creator economy platforms

// Core Translation Types
export interface TranslationContext {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  culturalAdaptation: boolean;
  contentType: 'legal' | 'marketing' | 'educational' | 'creative' | 'technical' | 'social' | 'adult';
  compliancePreservation: boolean;
  qualityScore: number; // 0-100
  confidence: number; // 0-100
  regionalization: RegionalizationSettings;
  audienceProfile: AudienceProfile;
  brandConsistency: BrandConsistency;
}

export interface TranslationRequest {
  id: string;
  content: TranslatableContent;
  context: TranslationContext;
  options: TranslationOptions;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  budget?: TranslationBudget;
  qualityRequirements: QualityRequirements;
  workflow: TranslationWorkflow;
}

export interface TranslatableContent {
  id: string;
  type: 'text' | 'html' | 'markdown' | 'json' | 'xml' | 'document' | 'image' | 'video' | 'audio';
  content: string | Buffer | TranslationSegment[];
  metadata: ContentMetadata;
  structure: ContentStructure;
  placeholders: ContentPlaceholder[];
  formatting: FormattingRules;
  terminology: TerminologyDatabase;
}

export interface TranslationSegment {
  id: string;
  source: string;
  target?: string;
  status: 'new' | 'translated' | 'reviewed' | 'approved' | 'rejected';
  type: 'text' | 'heading' | 'button' | 'label' | 'error' | 'legal' | 'marketing';
  priority: number; // 1-10
  context: string;
  notes: string[];
  tags: string[];
  wordCount: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  keywords: string[];
  category: string;
  audience: 'general' | 'technical' | 'legal' | 'marketing' | 'creators' | 'fans';
  tone: 'formal' | 'informal' | 'friendly' | 'professional' | 'playful' | 'seductive';
  purpose: string;
  brandVoice: string;
  complianceLevel: 'standard' | 'legal' | 'medical' | 'financial' | 'adult';
}

export interface ContentStructure {
  sections: ContentSection[];
  hierarchy: HierarchyLevel[];
  relationships: ContentRelationship[];
  dependencies: ContentDependency[];
  reusableElements: ReusableElement[];
}

export interface ContentSection {
  id: string;
  name: string;
  type: string;
  translatable: boolean;
  priority: number;
  segments: string[]; // segment IDs
  rules: TranslationRule[];
}

export interface HierarchyLevel {
  level: number;
  type: string;
  elements: string[];
  preserveStructure: boolean;
}

export interface ContentRelationship {
  sourceId: string;
  targetId: string;
  type: 'reference' | 'dependency' | 'variation' | 'alternative';
  description: string;
}

export interface ContentDependency {
  id: string;
  dependsOn: string[];
  reason: string;
  severity: 'critical' | 'important' | 'minor';
}

export interface ReusableElement {
  id: string;
  content: string;
  contexts: string[];
  translations: Record<string, string>;
  lastUpdated: Date;
}

export interface ContentPlaceholder {
  id: string;
  type: 'variable' | 'date' | 'number' | 'currency' | 'name' | 'url' | 'custom';
  format?: string;
  localization: boolean;
  examples: string[];
  constraints?: PlaceholderConstraint[];
}

export interface PlaceholderConstraint {
  type: 'length' | 'format' | 'value' | 'pattern';
  rule: string;
  message: string;
}

export interface FormattingRules {
  preserveHtml: boolean;
  preserveMarkdown: boolean;
  preserveWhitespace: boolean;
  lineBreaks: 'preserve' | 'adapt' | 'normalize';
  capitalization: 'preserve' | 'adapt' | 'sentence' | 'title';
  punctuation: 'preserve' | 'adapt' | 'localize';
  numberFormat: NumberFormatRules;
  dateFormat: DateFormatRules;
  currencyFormat: CurrencyFormatRules;
}

export interface NumberFormatRules {
  decimalSeparator: string;
  thousandsSeparator: string;
  grouping: number[];
  precision: number;
  localize: boolean;
}

export interface DateFormatRules {
  format: string;
  timezone: boolean;
  calendar: 'gregorian' | 'local';
  era: boolean;
  localize: boolean;
}

export interface CurrencyFormatRules {
  symbol: boolean;
  code: boolean;
  position: 'before' | 'after';
  localize: boolean;
  conversion: boolean;
}

export interface TerminologyDatabase {
  id: string;
  name: string;
  version: string;
  terms: TermEntry[];
  domains: string[];
  languages: string[];
  consistency: TerminologyConsistency;
}

export interface TermEntry {
  id: string;
  source: string;
  targets: Record<string, TermTarget>;
  domain: string;
  definition: string;
  usage: string[];
  examples: TermExample[];
  notes: string[];
  status: 'approved' | 'tentative' | 'deprecated' | 'forbidden';
  lastUpdated: Date;
}

export interface TermTarget {
  term: string;
  gender?: 'masculine' | 'feminine' | 'neuter';
  number?: 'singular' | 'plural';
  register?: 'formal' | 'informal' | 'technical' | 'colloquial';
  region?: string[];
  confidence: number; // 0-100
  verified: boolean;
}

export interface TermExample {
  source: string;
  target: string;
  context: string;
  domain: string;
}

export interface TerminologyConsistency {
  enforced: boolean;
  warnings: boolean;
  autoCorrect: boolean;
  exceptions: string[];
  customRules: ConsistencyRule[];
}

export interface ConsistencyRule {
  id: string;
  pattern: string;
  replacement: string;
  languages: string[];
  domains: string[];
  severity: 'error' | 'warning' | 'suggestion';
}

export interface TranslationOptions {
  provider: 'google' | 'azure' | 'aws' | 'openai' | 'anthropic' | 'hybrid';
  model: string;
  quality: 'draft' | 'standard' | 'premium' | 'professional';
  speed: 'fast' | 'balanced' | 'quality';
  humanReview: boolean;
  iterativeImprovement: boolean;
  customization: TranslationCustomization;
  postProcessing: PostProcessingOptions;
}

export interface TranslationCustomization {
  styleGuide?: string;
  glossary?: string[];
  examples?: TranslationExample[];
  constraints?: TranslationConstraint[];
  brandVoice?: BrandVoiceSettings;
}

export interface TranslationExample {
  source: string;
  target: string;
  context: string;
  explanation?: string;
}

export interface TranslationConstraint {
  type: 'length' | 'tone' | 'terminology' | 'format' | 'cultural';
  rule: string;
  severity: 'error' | 'warning' | 'suggestion';
}

export interface BrandVoiceSettings {
  personality: string[];
  values: string[];
  avoidances: string[];
  examples: string[];
  consistency: number; // 0-100
}

export interface PostProcessingOptions {
  spellCheck: boolean;
  grammarCheck: boolean;
  styleCheck: boolean;
  consistencyCheck: boolean;
  culturalAdaptation: boolean;
  formatting: boolean;
  qualityScoring: boolean;
}

export interface TranslationBudget {
  maxCost: number;
  currency: string;
  costPerWord?: number;
  costPerCharacter?: number;
  costPerHour?: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  service: string;
  amount: number;
  unit: 'word' | 'character' | 'hour' | 'page' | 'project';
  provider: string;
}

export interface QualityRequirements {
  minimumScore: number; // 0-100
  humanReview: boolean;
  proofReading: boolean;
  linguisticTesting: boolean;
  culturalValidation: boolean;
  complianceCheck: boolean;
  brandConsistency: boolean;
  accuracy: AccuracyRequirements;
}

export interface AccuracyRequirements {
  terminology: number; // 0-100
  grammar: number; // 0-100
  style: number; // 0-100
  cultural: number; // 0-100
  technical: number; // 0-100
  legal: number; // 0-100
}

export interface TranslationWorkflow {
  stages: WorkflowStage[];
  approvals: ApprovalStep[];
  automation: WorkflowAutomation;
  tracking: WorkflowTracking;
  escalation: EscalationRules;
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: 'translation' | 'review' | 'approval' | 'testing' | 'deployment';
  assignee?: string;
  deadline?: Date;
  dependencies: string[];
  automation: boolean;
  qualityGates: QualityGate[];
}

export interface QualityGate {
  metric: string;
  threshold: number;
  required: boolean;
  autoFix: boolean;
}

export interface ApprovalStep {
  id: string;
  stage: string;
  approver: string;
  criteria: string[];
  deadline?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
}

export interface WorkflowAutomation {
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  notifications: NotificationRule[];
}

export interface WorkflowTrigger {
  event: string;
  condition: string;
  action: string;
  delay?: number;
}

export interface WorkflowAction {
  id: string;
  type: 'assign' | 'notify' | 'validate' | 'deploy' | 'escalate';
  parameters: Record<string, any>;
  retries: number;
  timeout: number;
}

export interface WorkflowCondition {
  id: string;
  expression: string;
  description: string;
  priority: number;
}

export interface NotificationRule {
  event: string;
  recipients: string[];
  channels: string[];
  template: string;
  conditions: string[];
}

export interface WorkflowTracking {
  milestones: WorkflowMilestone[];
  metrics: WorkflowMetrics;
  alerts: WorkflowAlert[];
  reporting: WorkflowReporting;
}

export interface WorkflowMilestone {
  id: string;
  name: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'completed' | 'delayed' | 'blocked';
  blockers: string[];
}

export interface WorkflowMetrics {
  duration: number; // minutes
  cost: number;
  quality: number; // 0-100
  efficiency: number; // 0-100
  bottlenecks: string[];
  improvements: string[];
}

export interface WorkflowAlert {
  type: 'deadline' | 'quality' | 'cost' | 'blocker';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  actions: string[];
}

export interface WorkflowReporting {
  frequency: 'real_time' | 'daily' | 'weekly' | 'milestone';
  recipients: string[];
  format: 'summary' | 'detailed' | 'dashboard';
  metrics: string[];
}

export interface EscalationRules {
  deadlineWarning: number; // hours before deadline
  qualityThreshold: number; // 0-100
  costOverrun: number; // percentage
  blockerDuration: number; // hours
  escalationPath: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  role: string;
  conditions: string[];
  actions: string[];
  timeout: number; // hours
}

export interface RegionalizationSettings {
  region: string;
  locale: string;
  cultural: CulturalSettings;
  legal: LegalSettings;
  business: BusinessSettings;
  technical: TechnicalSettings;
}

export interface CulturalSettings {
  colorSymbolism: Record<string, string>;
  imagery: ImageryGuidelines;
  taboos: string[];
  preferences: string[];
  communication: CommunicationStyle;
  holidays: Holiday[];
  values: CulturalValue[];
}

export interface ImageryGuidelines {
  preferred: string[];
  avoid: string[];
  cultural: string[];
  religious: string[];
  political: string[];
  demographic: DemographicGuidelines;
}

export interface DemographicGuidelines {
  ageGroups: string[];
  genderRepresentation: string[];
  ethnicityConsiderations: string[];
  inclusivity: InclusivitySettings;
}

export interface InclusivitySettings {
  required: boolean;
  guidelines: string[];
  representation: RepresentationRequirements;
  sensitivity: SensitivityGuidelines;
}

export interface RepresentationRequirements {
  diversity: boolean;
  accessibility: boolean;
  bodyPositivity: boolean;
  genderInclusion: boolean;
  ageInclusion: boolean;
}

export interface SensitivityGuidelines {
  topics: string[];
  language: string[];
  imagery: string[];
  context: string[];
}

export interface CommunicationStyle {
  directness: 'high' | 'medium' | 'low';
  formality: 'formal' | 'neutral' | 'informal';
  hierarchy: 'flat' | 'moderate' | 'hierarchical';
  emotion: 'expressive' | 'moderate' | 'reserved';
  time: 'monochronic' | 'polychronic';
  context: 'high' | 'low';
}

export interface Holiday {
  name: string;
  date: string;
  type: 'religious' | 'national' | 'cultural' | 'commercial';
  importance: 'high' | 'medium' | 'low';
  considerations: string[];
}

export interface CulturalValue {
  name: string;
  importance: number; // 0-100
  description: string;
  implications: string[];
  applications: string[];
}

export interface LegalSettings {
  jurisdiction: string;
  dataProtection: string[];
  contentRestrictions: ContentRestriction[];
  languageRequirements: LanguageRequirement[];
  compliance: ComplianceRequirement[];
  disclaimers: Disclaimer[];
}

export interface ContentRestriction {
  type: string;
  severity: 'prohibited' | 'restricted' | 'regulated' | 'warned';
  description: string;
  alternatives: string[];
  penalties: string[];
}

export interface LanguageRequirement {
  context: string;
  required: boolean;
  alternatives: string[];
  officialTranslation: boolean;
  certification: boolean;
}

export interface ComplianceRequirement {
  regulation: string;
  applicable: boolean;
  requirements: string[];
  verification: string[];
  documentation: string[];
}

export interface Disclaimer {
  type: string;
  text: string;
  languages: string[];
  placement: string[];
  format: string[];
}

export interface BusinessSettings {
  market: MarketSettings;
  competition: CompetitionAnalysis;
  pricing: PricingStrategy;
  distribution: DistributionStrategy;
  partnerships: PartnershipStrategy;
}

export interface MarketSettings {
  size: number;
  growth: number; // percentage
  segments: MarketSegment[];
  trends: MarketTrend[];
  opportunities: string[];
  challenges: string[];
}

export interface MarketSegment {
  name: string;
  size: number; // percentage
  characteristics: string[];
  needs: string[];
  preferences: string[];
  accessibility: string[];
}

export interface MarketTrend {
  name: string;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  implications: string[];
  opportunities: string[];
}

export interface CompetitionAnalysis {
  competitors: Competitor[];
  positioning: string[];
  advantages: string[];
  weaknesses: string[];
  strategies: string[];
}

export interface Competitor {
  name: string;
  marketShare: number; // percentage
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  languages: string[];
}

export interface PricingStrategy {
  model: string;
  tiers: PricingTier[];
  localization: boolean;
  currency: string[];
  discounts: DiscountStrategy[];
}

export interface PricingTier {
  name: string;
  price: number;
  currency: string;
  features: string[];
  target: string;
}

export interface DiscountStrategy {
  type: string;
  amount: number;
  conditions: string[];
  regions: string[];
  duration: string;
}

export interface DistributionStrategy {
  channels: DistributionChannel[];
  partners: string[];
  restrictions: string[];
  requirements: string[];
}

export interface DistributionChannel {
  name: string;
  type: string;
  coverage: string[];
  requirements: string[];
  costs: number;
}

export interface PartnershipStrategy {
  types: string[];
  criteria: string[];
  benefits: string[];
  requirements: string[];
  evaluation: string[];
}

export interface TechnicalSettings {
  encoding: string;
  fonts: FontSettings;
  layout: LayoutSettings;
  input: InputSettings;
  display: DisplaySettings;
  accessibility: AccessibilitySettings;
}

export interface FontSettings {
  primary: string[];
  fallback: string[];
  size: FontSizeSettings;
  weight: string[];
  style: string[];
  support: LanguageSupport[];
}

export interface FontSizeSettings {
  base: number;
  scaling: number[];
  responsive: boolean;
  accessibility: boolean;
}

export interface LanguageSupport {
  language: string;
  script: string;
  direction: 'ltr' | 'rtl' | 'ttb';
  fonts: string[];
  fallbacks: string[];
}

export interface LayoutSettings {
  direction: 'ltr' | 'rtl';
  alignment: string;
  spacing: SpacingSettings;
  grid: GridSettings;
  responsive: ResponsiveSettings;
}

export interface SpacingSettings {
  base: number;
  scale: number[];
  responsive: boolean;
  density: 'compact' | 'normal' | 'comfortable';
}

export interface GridSettings {
  columns: number;
  gutters: number;
  breakpoints: Breakpoint[];
  fluid: boolean;
}

export interface Breakpoint {
  name: string;
  width: number;
  columns: number;
  gutters: number;
}

export interface ResponsiveSettings {
  enabled: boolean;
  breakpoints: string[];
  strategy: 'mobile_first' | 'desktop_first';
  optimization: string[];
}

export interface InputSettings {
  methods: string[];
  keyboards: string[];
  ime: boolean;
  validation: InputValidation;
  accessibility: boolean;
}

export interface InputValidation {
  patterns: Record<string, string>;
  messages: Record<string, string>;
  localization: boolean;
  realTime: boolean;
}

export interface DisplaySettings {
  colorSpace: string;
  contrast: number;
  brightness: number;
  gamut: string;
  hdr: boolean;
  accessibility: DisplayAccessibility;
}

export interface DisplayAccessibility {
  highContrast: boolean;
  colorBlind: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  focusIndicators: boolean;
}

export interface AccessibilitySettings {
  screenReaders: string[];
  magnifiers: string[];
  voiceControl: boolean;
  switchNavigation: boolean;
  eyeTracking: boolean;
  compliance: string[];
}

export interface AudienceProfile {
  demographics: Demographics;
  psychographics: Psychographics;
  technographics: Technographics;
  linguisticProfile: LinguisticProfile;
  culturalProfile: CulturalProfile;
  accessibilityNeeds: AccessibilityNeeds;
}

export interface Demographics {
  ageRange: string;
  gender: string[];
  education: string[];
  income: string;
  location: string[];
  occupation: string[];
  lifestyle: string[];
}

export interface Psychographics {
  values: string[];
  interests: string[];
  attitudes: string[];
  motivations: string[];
  personality: string[];
  lifestyle: string[];
}

export interface Technographics {
  devices: string[];
  platforms: string[];
  proficiency: 'low' | 'medium' | 'high';
  preferences: string[];
  usage: TechUsagePattern[];
}

export interface TechUsagePattern {
  activity: string;
  frequency: string;
  duration: string;
  devices: string[];
  context: string[];
}

export interface LinguisticProfile {
  nativeLanguage: string;
  secondaryLanguages: string[];
  proficiency: LanguageProficiency[];
  preferences: LanguagePreference[];
  dialects: string[];
  registerPreferences: string[];
}

export interface LanguageProficiency {
  language: string;
  reading: 'basic' | 'intermediate' | 'advanced' | 'native';
  writing: 'basic' | 'intermediate' | 'advanced' | 'native';
  speaking: 'basic' | 'intermediate' | 'advanced' | 'native';
  listening: 'basic' | 'intermediate' | 'advanced' | 'native';
}

export interface LanguagePreference {
  language: string;
  contexts: string[];
  formality: string;
  dialect: string;
  script: string;
}

export interface CulturalProfile {
  background: string[];
  values: string[];
  traditions: string[];
  taboos: string[];
  preferences: string[];
  adaptability: 'low' | 'medium' | 'high';
}

export interface AccessibilityNeeds {
  visual: VisualNeeds;
  auditory: AuditoryNeeds;
  motor: MotorNeeds;
  cognitive: CognitiveNeeds;
  assistiveTechnology: string[];
}

export interface VisualNeeds {
  impairment: string[];
  severity: string;
  assistiveTech: string[];
  preferences: string[];
  accommodations: string[];
}

export interface AuditoryNeeds {
  impairment: string[];
  severity: string;
  assistiveTech: string[];
  preferences: string[];
  accommodations: string[];
}

export interface MotorNeeds {
  impairment: string[];
  severity: string;
  assistiveTech: string[];
  preferences: string[];
  accommodations: string[];
}

export interface CognitiveNeeds {
  impairment: string[];
  severity: string;
  assistiveTech: string[];
  preferences: string[];
  accommodations: string[];
}

export interface BrandConsistency {
  voice: BrandVoice;
  terminology: BrandTerminology;
  style: BrandStyle;
  values: BrandValues;
  guidelines: BrandGuidelines;
  adaptation: BrandAdaptation;
}

export interface BrandVoice {
  personality: string[];
  tone: string[];
  style: string[];
  vocabulary: string[];
  grammar: string[];
  examples: VoiceExample[];
}

export interface VoiceExample {
  context: string;
  original: string;
  adapted: string;
  explanation: string;
}

export interface BrandTerminology {
  preferred: Term[];
  avoid: Term[];
  alternatives: TermAlternative[];
  consistency: TermConsistency;
}

export interface Term {
  term: string;
  definition: string;
  context: string[];
  languages: TermTranslation[];
  status: 'approved' | 'pending' | 'deprecated';
}

export interface TermTranslation {
  language: string;
  translation: string;
  verified: boolean;
  alternatives: string[];
  notes: string;
}

export interface TermAlternative {
  original: string;
  alternative: string;
  context: string;
  reason: string;
}

export interface TermConsistency {
  enforce: boolean;
  tolerance: number; // 0-100
  exceptions: string[];
  validation: boolean;
}

export interface BrandStyle {
  writing: WritingStyle;
  visual: VisualStyle;
  formatting: FormattingStyle;
  interaction: InteractionStyle;
}

export interface WritingStyle {
  formality: string;
  complexity: string;
  length: LengthGuidelines;
  structure: StructureGuidelines;
  punctuation: PunctuationGuidelines;
}

export interface LengthGuidelines {
  sentences: LengthRange;
  paragraphs: LengthRange;
  headings: LengthRange;
  buttons: LengthRange;
  descriptions: LengthRange;
}

export interface LengthRange {
  min: number;
  max: number;
  target: number;
  unit: 'characters' | 'words' | 'lines';
}

export interface StructureGuidelines {
  headings: string[];
  lists: string[];
  emphasis: string[];
  links: string[];
  callouts: string[];
}

export interface PunctuationGuidelines {
  style: string;
  quotations: string;
  apostrophes: string;
  hyphens: string;
  ellipses: string;
}

export interface VisualStyle {
  colors: ColorGuidelines;
  typography: TypographyGuidelines;
  imagery: ImageGuidelines;
  layout: LayoutGuidelines;
}

export interface ColorGuidelines {
  primary: string[];
  secondary: string[];
  accent: string[];
  semantic: SemanticColors;
  accessibility: ColorAccessibility;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
}

export interface ColorAccessibility {
  contrast: number;
  colorBlind: boolean;
  alternatives: string[];
  testing: boolean;
}

export interface TypographyGuidelines {
  fonts: string[];
  sizes: number[];
  weights: string[];
  lineHeight: number[];
  letterSpacing: number[];
}

export interface ImageGuidelines {
  style: string[];
  subjects: string[];
  composition: string[];
  colors: string[];
  avoid: string[];
}

export interface LayoutGuidelines {
  grid: string;
  spacing: number[];
  alignment: string[];
  hierarchy: string[];
  balance: string;
}

export interface FormattingStyle {
  capitalization: CapitalizationGuidelines;
  numbers: NumberGuidelines;
  dates: DateGuidelines;
  addresses: AddressGuidelines;
  phone: PhoneGuidelines;
}

export interface CapitalizationGuidelines {
  headings: string;
  sentences: string;
  proper: string[];
  acronyms: string;
  brand: string[];
}

export interface NumberGuidelines {
  format: string;
  currency: string;
  percentages: string;
  ranges: string;
  ordinals: string;
}

export interface DateGuidelines {
  format: string;
  timezone: boolean;
  relative: boolean;
  calendar: string;
  era: boolean;
}

export interface AddressGuidelines {
  format: string;
  order: string[];
  abbreviations: boolean;
  postal: string;
  country: boolean;
}

export interface PhoneGuidelines {
  format: string;
  international: boolean;
  extension: boolean;
  mobile: boolean;
  validation: boolean;
}

export interface InteractionStyle {
  navigation: NavigationStyle;
  feedback: FeedbackStyle;
  errors: ErrorStyle;
  confirmations: ConfirmationStyle;
  progress: ProgressStyle;
}

export interface NavigationStyle {
  structure: string;
  labels: string[];
  breadcrumbs: boolean;
  search: boolean;
  filters: string[];
}

export interface FeedbackStyle {
  success: string[];
  warnings: string[];
  information: string[];
  loading: string[];
  empty: string[];
}

export interface ErrorStyle {
  tone: string;
  detail: string;
  recovery: boolean;
  contact: boolean;
  codes: boolean;
}

export interface ConfirmationStyle {
  actions: string[];
  consequences: boolean;
  alternatives: boolean;
  cancellation: boolean;
  persistence: string;
}

export interface ProgressStyle {
  indicators: string[];
  estimates: boolean;
  stages: boolean;
  cancellation: boolean;
  recovery: boolean;
}

export interface BrandValues {
  core: CoreValue[];
  messaging: MessagePillar[];
  positioning: PositioningStatement;
  differentiation: Differentiator[];
  promise: BrandPromise;
}

export interface CoreValue {
  name: string;
  description: string;
  expression: string[];
  examples: string[];
  measurement: string[];
}

export interface MessagePillar {
  theme: string;
  messages: string[];
  audience: string[];
  channels: string[];
  proof: string[];
}

export interface PositioningStatement {
  target: string;
  category: string;
  benefit: string;
  reason: string;
  differentiator: string;
}

export interface Differentiator {
  attribute: string;
  competitors: string[];
  evidence: string[];
  communication: string[];
  sustainability: string;
}

export interface BrandPromise {
  functional: string[];
  emotional: string[];
  social: string[];
  aspirational: string[];
  delivery: string[];
}

export interface BrandGuidelines {
  usage: UsageGuidelines;
  adaptation: AdaptationGuidelines;
  approval: ApprovalGuidelines;
  monitoring: MonitoringGuidelines;
  enforcement: EnforcementGuidelines;
}

export interface UsageGuidelines {
  contexts: string[];
  restrictions: string[];
  requirements: string[];
  examples: string[];
  alternatives: string[];
}

export interface AdaptationGuidelines {
  allowed: string[];
  prohibited: string[];
  approval: string[];
  documentation: string[];
  rollback: string[];
}

export interface ApprovalGuidelines {
  levels: ApprovalLevel[];
  criteria: string[];
  process: string[];
  timelines: Record<string, number>;
  escalation: string[];
}

export interface ApprovalLevel {
  level: string;
  authority: string[];
  scope: string[];
  requirements: string[];
  delegation: boolean;
}

export interface MonitoringGuidelines {
  metrics: string[];
  frequency: string;
  channels: string[];
  reporting: string[];
  alerts: string[];
}

export interface EnforcementGuidelines {
  violations: ViolationType[];
  consequences: string[];
  remediation: string[];
  prevention: string[];
  education: string[];
}

export interface ViolationType {
  type: string;
  severity: string;
  examples: string[];
  detection: string[];
  response: string[];
}

export interface BrandAdaptation {
  cultural: CulturalAdaptation;
  linguistic: LinguisticAdaptation;
  legal: LegalAdaptation;
  technical: TechnicalAdaptation;
  market: MarketAdaptation;
}

export interface CulturalAdaptation {
  allowed: string[];
  required: string[];
  prohibited: string[];
  guidelines: string[];
  validation: string[];
}

export interface LinguisticAdaptation {
  translation: TranslationAdaptation;
  localization: LocalizationAdaptation;
  transcreation: TranscreationAdaptation;
  copywriting: CopywritingAdaptation;
}

export interface TranslationAdaptation {
  fidelity: number; // 0-100
  creativity: number; // 0-100
  cultural: number; // 0-100
  brand: number; // 0-100
  approval: boolean;
}

export interface LocalizationAdaptation {
  depth: 'surface' | 'moderate' | 'deep';
  elements: string[];
  validation: string[];
  testing: string[];
  approval: string[];
}

export interface TranscreationAdaptation {
  scope: string[];
  creativity: number; // 0-100
  brand: number; // 0-100
  approval: string[];
  validation: string[];
}

export interface CopywritingAdaptation {
  style: string[];
  tone: string[];
  structure: string[];
  length: string[];
  approval: string[];
}

export interface LegalAdaptation {
  requirements: string[];
  restrictions: string[];
  approval: string[];
  documentation: string[];
  compliance: string[];
}

export interface TechnicalAdaptation {
  platforms: string[];
  formats: string[];
  constraints: string[];
  optimization: string[];
  testing: string[];
}

export interface MarketAdaptation {
  positioning: string[];
  messaging: string[];
  channels: string[];
  pricing: string[];
  competition: string[];
}

// Translation Result Types
export interface TranslationResult {
  id: string;
  request: TranslationRequest;
  output: TranslationOutput;
  quality: QualityAssessment;
  performance: PerformanceMetrics;
  costs: CostAnalysis;
  feedback: TranslationFeedback;
  status: TranslationStatus;
}

export interface TranslationOutput {
  content: TranslatedContent;
  metadata: TranslationMetadata;
  alternatives: TranslationAlternative[];
  suggestions: TranslationSuggestion[];
  warnings: TranslationWarning[];
  statistics: TranslationStatistics;
}

export interface TranslatedContent {
  id: string;
  segments: TranslatedSegment[];
  structure: TranslatedStructure;
  formatting: AppliedFormatting;
  terminology: AppliedTerminology;
  cultural: CulturalAdaptations;
}

export interface TranslatedSegment {
  id: string;
  source: string;
  target: string;
  confidence: number; // 0-100
  alternatives: string[];
  notes: string[];
  quality: SegmentQuality;
  edits: SegmentEdit[];
  status: 'final' | 'draft' | 'needs_review' | 'approved';
}

export interface SegmentQuality {
  accuracy: number; // 0-100
  fluency: number; // 0-100
  terminology: number; // 0-100
  style: number; // 0-100
  cultural: number; // 0-100
  overall: number; // 0-100
}

export interface SegmentEdit {
  type: 'manual' | 'automated' | 'ai_suggestion';
  original: string;
  edited: string;
  reason: string;
  editor: string;
  timestamp: Date;
}

export interface TranslatedStructure {
  preserved: boolean;
  adaptations: StructuralAdaptation[];
  hierarchy: TranslatedHierarchy;
  relationships: TranslatedRelationship[];
}

export interface StructuralAdaptation {
  element: string;
  original: string;
  adapted: string;
  reason: string;
  cultural: boolean;
}

export interface TranslatedHierarchy {
  levels: TranslatedLevel[];
  consistency: boolean;
  adaptations: string[];
}

export interface TranslatedLevel {
  level: number;
  elements: TranslatedElement[];
  preserved: boolean;
  adapted: string[];
}

export interface TranslatedElement {
  id: string;
  type: string;
  original: string;
  translated: string;
  formatted: boolean;
}

export interface TranslatedRelationship {
  type: string;
  maintained: boolean;
  adaptations: string[];
  impact: string;
}

export interface AppliedFormatting {
  rules: AppliedRule[];
  exceptions: FormattingException[];
  adaptations: FormattingAdaptation[];
  validation: FormatValidation;
}

export interface AppliedRule {
  rule: string;
  applied: boolean;
  adaptations: string[];
  exceptions: string[];
}

export interface FormattingException {
  rule: string;
  reason: string;
  alternative: string;
  approved: boolean;
}

export interface FormattingAdaptation {
  aspect: string;
  original: string;
  adapted: string;
  cultural: boolean;
  technical: boolean;
}

export interface FormatValidation {
  passed: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  fixes: ValidationFix[];
}

export interface ValidationIssue {
  type: string;
  severity: string;
  description: string;
  location: string;
  suggestion: string;
}

export interface ValidationWarning {
  type: string;
  description: string;
  location: string;
  impact: string;
}

export interface ValidationFix {
  issue: string;
  fix: string;
  automatic: boolean;
  applied: boolean;
}

export interface AppliedTerminology {
  database: string;
  terms: AppliedTerm[];
  consistency: TerminologyConsistency;
  violations: TerminologyViolation[];
  adaptations: TerminologyAdaptation[];
}

export interface AppliedTerm {
  source: string;
  target: string;
  domain: string;
  confidence: number; // 0-100
  context: string;
  verified: boolean;
}

export interface TerminologyViolation {
  term: string;
  expected: string;
  found: string;
  location: string;
  severity: string;
}

export interface TerminologyAdaptation {
  term: string;
  reason: string;
  adaptation: string;
  approved: boolean;
  cultural: boolean;
}

export interface CulturalAdaptations {
  adaptations: CulturalAdaptation[];
  validations: CulturalValidation[];
  considerations: CulturalConsideration[];
  feedback: CulturalFeedback[];
}

export interface CulturalValidation {
  aspect: string;
  valid: boolean;
  issues: string[];
  suggestions: string[];
  expert: string;
}

export interface CulturalConsideration {
  aspect: string;
  consideration: string;
  impact: string;
  addressed: boolean;
  notes: string;
}

export interface CulturalFeedback {
  aspect: string;
  feedback: string;
  rating: number; // 1-5
  source: string;
  actionable: boolean;
}

export interface TranslationMetadata {
  provider: string;
  model: string;
  version: string;
  timestamp: Date;
  duration: number; // milliseconds
  wordCount: WordCount;
  characterCount: CharacterCount;
  complexity: ComplexityAnalysis;
  resources: ResourceUsage;
}

export interface WordCount {
  source: number;
  target: number;
  expansion: number; // percentage
  density: number; // words per sentence
}

export interface CharacterCount {
  source: number;
  target: number;
  expansion: number; // percentage
  encoding: string;
}

export interface ComplexityAnalysis {
  lexical: number; // 0-100
  syntactic: number; // 0-100
  semantic: number; // 0-100
  cultural: number; // 0-100
  overall: number; // 0-100
}

export interface ResourceUsage {
  cpu: number; // seconds
  memory: number; // MB
  api: number; // calls
  cost: number; // currency units
  cache: CacheUsage;
}

export interface CacheUsage {
  hits: number;
  misses: number;
  ratio: number; // percentage
  saved: number; // currency units
}

export interface TranslationAlternative {
  id: string;
  content: string;
  confidence: number; // 0-100
  provider: string;
  model: string;
  rationale: string;
  quality: QualityScores;
  cultural: CulturalFit;
}

export interface QualityScores {
  accuracy: number; // 0-100
  fluency: number; // 0-100
  adequacy: number; // 0-100
  terminology: number; // 0-100
  style: number; // 0-100
  cultural: number; // 0-100
}

export interface CulturalFit {
  appropriateness: number; // 0-100
  sensitivity: number; // 0-100
  authenticity: number; // 0-100
  acceptance: number; // 0-100
  effectiveness: number; // 0-100
}

export interface TranslationSuggestion {
  type: 'improvement' | 'alternative' | 'cultural' | 'terminology' | 'style';
  segment: string;
  original: string;
  suggestion: string;
  rationale: string;
  confidence: number; // 0-100
  impact: ImpactAssessment;
}

export interface ImpactAssessment {
  quality: number; // -100 to 100
  cultural: number; // -100 to 100
  brand: number; // -100 to 100
  user: number; // -100 to 100
  business: number; // -100 to 100
}

export interface TranslationWarning {
  type: 'quality' | 'cultural' | 'terminology' | 'formatting' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface TranslationStatistics {
  segments: SegmentStatistics;
  quality: QualityStatistics;
  performance: PerformanceStatistics;
  cultural: CulturalStatistics;
  terminology: TerminologyStatistics;
}

export interface SegmentStatistics {
  total: number;
  translated: number;
  reviewed: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface QualityStatistics {
  average: number; // 0-100
  distribution: QualityDistribution;
  improvements: number;
  issues: number;
  resolved: number;
}

export interface QualityDistribution {
  excellent: number; // 90-100
  good: number; // 70-89
  fair: number; // 50-69
  poor: number; // 0-49
}

export interface PerformanceStatistics {
  throughput: number; // segments per minute
  latency: number; // milliseconds per segment
  efficiency: number; // 0-100
  bottlenecks: string[];
}

export interface CulturalStatistics {
  adaptations: number;
  validations: number;
  issues: number;
  resolved: number;
  feedback: number;
}

export interface TerminologyStatistics {
  terms: number;
  consistent: number;
  violations: number;
  resolved: number;
  coverage: number; // percentage
}

export interface QualityAssessment {
  overall: number; // 0-100
  dimensions: QualityDimension[];
  criteria: QualityCriteria[];
  benchmarks: QualityBenchmark[];
  improvements: QualityImprovement[];
  validation: QualityValidation;
}

export interface QualityDimension {
  name: string;
  score: number; // 0-100
  weight: number; // 0-100
  details: QualityDetail[];
  threshold: number; // 0-100
  passed: boolean;
}

export interface QualityDetail {
  aspect: string;
  score: number; // 0-100
  evidence: string[];
  issues: string[];
  suggestions: string[];
}

export interface QualityCriteria {
  name: string;
  type: 'automatic' | 'manual' | 'hybrid';
  score: number; // 0-100
  passed: boolean;
  threshold: number; // 0-100
  details: CriteriaDetail[];
}

export interface CriteriaDetail {
  test: string;
  result: boolean;
  score: number; // 0-100
  evidence: string;
  recommendation: string;
}

export interface QualityBenchmark {
  type: 'industry' | 'internal' | 'competitor' | 'historical';
  score: number; // 0-100
  comparison: number; // -100 to 100
  ranking: string;
  insights: string[];
}

export interface QualityImprovement {
  area: string;
  current: number; // 0-100
  potential: number; // 0-100
  effort: string;
  impact: string;
  recommendations: string[];
}

export interface QualityValidation {
  automated: AutomatedValidation;
  manual: ManualValidation;
  user: UserValidation;
  expert: ExpertValidation;
  integrated: IntegratedValidation;
}

export interface AutomatedValidation {
  tools: string[];
  coverage: number; // percentage
  accuracy: number; // percentage
  results: ValidationResult[];
}

export interface ValidationResult {
  tool: string;
  score: number; // 0-100
  issues: number;
  warnings: number;
  passed: boolean;
}

export interface ManualValidation {
  reviewers: string[];
  coverage: number; // percentage
  consistency: number; // percentage
  results: ReviewResult[];
}

export interface ReviewResult {
  reviewer: string;
  score: number; // 0-100
  comments: string[];
  changes: number;
  approved: boolean;
}

export interface UserValidation {
  testers: number;
  coverage: TestCoverage;
  satisfaction: number; // 0-100
  results: UserTestResult[];
}

export interface TestCoverage {
  scenarios: number;
  users: number;
  tasks: number;
  completion: number; // percentage
}

export interface UserTestResult {
  user: string;
  scenario: string;
  completed: boolean;
  satisfaction: number; // 1-5
  feedback: string[];
  issues: string[];
}

export interface ExpertValidation {
  experts: ExpertReviewer[];
  areas: string[];
  consensus: number; // percentage
  results: ExpertResult[];
}

export interface ExpertReviewer {
  name: string;
  expertise: string[];
  languages: string[];
  experience: number; // years
  credentials: string[];
}

export interface ExpertResult {
  expert: string;
  area: string;
  score: number; // 0-100
  confidence: number; // 0-100
  recommendations: string[];
}

export interface IntegratedValidation {
  sources: string[];
  weights: Record<string, number>;
  algorithm: string;
  confidence: number; // 0-100
  final: number; // 0-100
}

export interface PerformanceMetrics {
  timing: TimingMetrics;
  throughput: ThroughputMetrics;
  resource: ResourceMetrics;
  scalability: ScalabilityMetrics;
  reliability: ReliabilityMetrics;
}

export interface TimingMetrics {
  total: number; // milliseconds
  processing: number; // milliseconds
  validation: number; // milliseconds
  formatting: number; // milliseconds
  cultural: number; // milliseconds
  overhead: number; // milliseconds
}

export interface ThroughputMetrics {
  wordsPerSecond: number;
  segmentsPerSecond: number;
  charactersPerSecond: number;
  requestsPerSecond: number;
  concurrency: number;
}

export interface ResourceMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  storage: StorageMetrics;
  api: APIMetrics;
}

export interface CPUMetrics {
  usage: number; // percentage
  cores: number;
  frequency: number; // GHz
  efficiency: number; // 0-100
}

export interface MemoryMetrics {
  used: number; // MB
  peak: number; // MB
  efficiency: number; // 0-100
  leaks: boolean;
}

export interface NetworkMetrics {
  requests: number;
  bandwidth: number; // Mbps
  latency: number; // milliseconds
  errors: number;
}

export interface StorageMetrics {
  reads: number;
  writes: number;
  cache: CacheMetrics;
  temporary: number; // MB
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  ratio: number; // percentage
  size: number; // MB
}

export interface APIMetrics {
  calls: number;
  latency: number; // milliseconds
  errors: number;
  rate: number; // calls per minute
}

export interface ScalabilityMetrics {
  concurrent: number;
  maximum: number;
  degradation: DegradationMetrics;
  bottlenecks: string[];
  limits: ScalabilityLimits;
}

export interface DegradationMetrics {
  quality: number; // percentage drop
  performance: number; // percentage drop
  threshold: number; // concurrent requests
  recovery: number; // seconds
}

export interface ScalabilityLimits {
  requests: number;
  memory: number; // MB
  cpu: number; // percentage
  storage: number; // MB
  network: number; // Mbps
}

export interface ReliabilityMetrics {
  availability: number; // percentage
  errors: ErrorMetrics;
  recovery: RecoveryMetrics;
  consistency: ConsistencyMetrics;
  durability: DurabilityMetrics;
}

export interface ErrorMetrics {
  total: number;
  rate: number; // percentage
  types: Record<string, number>;
  severity: Record<string, number>;
  resolution: number; // average minutes
}

export interface RecoveryMetrics {
  time: number; // seconds
  success: number; // percentage
  manual: number; // percentage
  automatic: number; // percentage
}

export interface ConsistencyMetrics {
  terminology: number; // percentage
  style: number; // percentage
  quality: number; // percentage
  format: number; // percentage
}

export interface DurabilityMetrics {
  persistence: number; // percentage
  corruption: number; // incidents
  backup: BackupMetrics;
  versioning: VersioningMetrics;
}

export interface BackupMetrics {
  frequency: string;
  success: number; // percentage
  recovery: number; // percentage
  integrity: number; // percentage
}

export interface VersioningMetrics {
  versions: number;
  branches: number;
  conflicts: number;
  merges: number;
}

export interface CostAnalysis {
  breakdown: CostBreakdown[];
  comparison: CostComparison;
  optimization: CostOptimization;
  forecast: CostForecast;
  roi: ROIAnalysis;
}

export interface CostComparison {
  baseline: number;
  actual: number;
  variance: number; // percentage
  reasons: string[];
  savings: number;
}

export interface CostOptimization {
  opportunities: OptimizationOpportunity[];
  implemented: ImplementedOptimization[];
  potential: number; // savings amount
  recommendations: string[];
}

export interface OptimizationOpportunity {
  area: string;
  current: number;
  optimized: number;
  savings: number;
  effort: string;
  impact: string;
}

export interface ImplementedOptimization {
  area: string;
  original: number;
  optimized: number;
  actual: number;
  savings: number;
  date: Date;
}

export interface CostForecast {
  period: string;
  projected: number;
  confidence: number; // percentage
  factors: ForecastFactor[];
  scenarios: CostScenario[];
}

export interface ForecastFactor {
  factor: string;
  impact: number; // percentage
  probability: number; // percentage
  description: string;
}

export interface CostScenario {
  name: string;
  probability: number; // percentage
  cost: number;
  drivers: string[];
  mitigations: string[];
}

export interface ROIAnalysis {
  investment: number;
  returns: number;
  roi: number; // percentage
  payback: number; // months
  npv: number;
  benefits: ROIBenefit[];
}

export interface ROIBenefit {
  category: string;
  quantified: number;
  qualitative: string[];
  confidence: number; // percentage
  timeline: string;
}

export interface TranslationFeedback {
  user: UserFeedback[];
  expert: ExpertFeedback[];
  automated: AutomatedFeedback[];
  integrated: IntegratedFeedback;
  actionable: ActionableFeedback[];
}

export interface ExpertFeedback {
  expert: string;
  area: string;
  rating: number; // 1-5
  comments: string[];
  suggestions: string[];
  confidence: number; // 0-100
}

export interface AutomatedFeedback {
  tool: string;
  category: string;
  score: number; // 0-100
  issues: FeedbackIssue[];
  suggestions: FeedbackSuggestion[];
}

export interface FeedbackIssue {
  type: string;
  severity: string;
  description: string;
  location: string;
  impact: string;
}

export interface FeedbackSuggestion {
  type: string;
  description: string;
  implementation: string;
  effort: string;
  impact: string;
}

export interface IntegratedFeedback {
  overall: number; // 0-100
  consensus: number; // percentage
  conflicts: FeedbackConflict[];
  resolution: ConflictResolution[];
  confidence: number; // 0-100
}

export interface FeedbackConflict {
  sources: string[];
  issue: string;
  positions: string[];
  impact: string;
  resolution: string;
}

export interface ConflictResolution {
  conflict: string;
  method: string;
  decision: string;
  rationale: string;
  confidence: number; // 0-100
}

export interface ActionableFeedback {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  implementation: string;
  effort: string;
  impact: string;
  deadline: Date;
  owner: string;
}

export interface TranslationStatus {
  stage: 'requested' | 'processing' | 'translating' | 'reviewing' | 'approving' | 'completed' | 'failed';
  progress: number; // 0-100
  milestones: StatusMilestone[];
  blockers: StatusBlocker[];
  estimates: StatusEstimate;
  history: StatusHistory[];
}

export interface StatusMilestone {
  name: string;
  target: Date;
  actual?: Date;
  status: 'pending' | 'completed' | 'delayed' | 'blocked';
  completion: number; // percentage
}

export interface StatusBlocker {
  type: string;
  severity: string;
  description: string;
  impact: string;
  resolution: string;
  eta: Date;
}

export interface StatusEstimate {
  completion: Date;
  confidence: number; // percentage
  remaining: EstimateBreakdown;
  factors: EstimateFactor[];
}

export interface EstimateBreakdown {
  translation: number; // hours
  review: number; // hours
  approval: number; // hours
  testing: number; // hours
  deployment: number; // hours
}

export interface EstimateFactor {
  factor: string;
  impact: number; // percentage
  description: string;
  mitigation: string;
}

export interface StatusHistory {
  timestamp: Date;
  stage: string;
  progress: number; // percentage
  notes: string;
  user: string;
  duration: number; // milliseconds
}
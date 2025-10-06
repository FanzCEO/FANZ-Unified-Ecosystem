import { EventEmitter } from 'events';
import {
  ModerationResult,
  ModerationRule,
  ContentFlags,
  ModerationAction,
  AIModel
} from '../types';

export class ModerationEngine extends EventEmitter {
  private moderationRules: ModerationRule[] = [];
  private aiModels: Map<string, AIModel> = new Map();
  private actionQueue: ModerationAction[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeModerationModels();
    this.startProcessingQueue();
  }

  private initializeDefaultRules(): void {
    this.moderationRules = [
      {
        id: 'spam-detection',
        name: 'Spam Detection',
        type: 'automated',
        severity: 'medium',
        threshold: 0.7,
        action: 'flag',
        isActive: true,
        description: 'Detects spam content patterns'
      },
      {
        id: 'adult-content',
        name: 'Adult Content Verification',
        type: 'automated',
        severity: 'high',
        threshold: 0.9,
        action: 'review',
        isActive: true,
        description: 'Ensures adult content compliance'
      },
      {
        id: 'harassment-detection',
        name: 'Harassment Detection',
        type: 'automated',
        severity: 'high',
        threshold: 0.8,
        action: 'block',
        isActive: true,
        description: 'Detects harassment and bullying'
      },
      {
        id: 'copyright-violation',
        name: 'Copyright Violation',
        type: 'automated',
        severity: 'critical',
        threshold: 0.85,
        action: 'block',
        isActive: true,
        description: 'Detects potential copyright violations'
      }
    ];
  }

  private async initializeModerationModels(): Promise<void> {
    const models = [
      { id: 'nsfw-detector', name: 'NSFW Content Detector', type: 'vision' },
      { id: 'text-toxicity', name: 'Text Toxicity Analyzer', type: 'nlp' },
      { id: 'fake-detection', name: 'Deepfake Detection', type: 'vision' },
      { id: 'spam-classifier', name: 'Spam Classifier', type: 'ml' }
    ];

    models.forEach(model => {
      this.aiModels.set(model.id, {
        id: model.id,
        name: model.name,
        type: model.type as any,
        accuracy: 0.88 + Math.random() * 0.1,
        lastTrained: new Date(),
        isActive: true,
        config: {
          threshold: 0.75,
          batchSize: 32,
          maxProcessingTime: 5000
        }
      });
    });

    this.emit('moderation-models-ready', Array.from(this.aiModels.values()));
  }

  async moderateContent(
    contentId: string,
    content: any,
    userId: string
  ): Promise<ModerationResult> {
    const startTime = Date.now();

    try {
      const flags = await this.analyzeContent(content);
      const ruleViolations = await this.checkRuleViolations(flags);
      const action = this.determineAction(ruleViolations);
      const confidence = this.calculateOverallConfidence(flags);

      const result: ModerationResult = {
        contentId,
        userId,
        timestamp: new Date(),
        status: this.getStatusFromAction(action),
        flags,
        violations: ruleViolations,
        action,
        confidence,
        processingTimeMs: Date.now() - startTime,
        reviewRequired: ruleViolations.some(v => v.severity === 'critical'),
        metadata: {
          contentType: content.type,
          contentLength: content.length || content.duration || 0,
          platform: content.platform
        }
      };

      // Queue action if needed
      if (action.type !== 'allow') {
        this.queueAction({
          ...action,
          contentId,
          userId,
          timestamp: new Date()
        });
      }

      this.emit('content-moderated', result);
      return result;

    } catch (error) {
      this.emit('moderation-error', { contentId, userId, error });
      throw error;
    }
  }

  async batchModerateContent(
    contents: Array<{ id: string; content: any; userId: string }>
  ): Promise<ModerationResult[]> {
    const results = await Promise.allSettled(
      contents.map(({ id, content, userId }) => 
        this.moderateContent(id, content, userId)
      )
    );

    const moderationResults = results
      .filter((result): result is PromiseFulfilledResult<ModerationResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    this.emit('batch-moderation-complete', {
      total: contents.length,
      successful: moderationResults.length,
      failed: contents.length - moderationResults.length
    });

    return moderationResults;
  }

  async updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): Promise<void> {
    const ruleIndex = this.moderationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Moderation rule ${ruleId} not found`);
    }

    this.moderationRules[ruleIndex] = {
      ...this.moderationRules[ruleIndex],
      ...updates
    };

    this.emit('rule-updated', this.moderationRules[ruleIndex]);
  }

  async addModerationRule(rule: ModerationRule): Promise<void> {
    if (this.moderationRules.some(r => r.id === rule.id)) {
      throw new Error(`Moderation rule ${rule.id} already exists`);
    }

    this.moderationRules.push(rule);
    this.emit('rule-added', rule);
  }

  async removeModerationRule(ruleId: string): Promise<void> {
    const ruleIndex = this.moderationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Moderation rule ${ruleId} not found`);
    }

    const removedRule = this.moderationRules.splice(ruleIndex, 1)[0];
    this.emit('rule-removed', removedRule);
  }

  getModerationStats(): {
    totalRules: number;
    activeRules: number;
    modelsActive: number;
    queuedActions: number;
  } {
    return {
      totalRules: this.moderationRules.length,
      activeRules: this.moderationRules.filter(r => r.isActive).length,
      modelsActive: Array.from(this.aiModels.values()).filter(m => m.isActive).length,
      queuedActions: this.actionQueue.length
    };
  }

  private async analyzeContent(content: any): Promise<ContentFlags> {
    const flags: ContentFlags = {
      isSpam: false,
      isNSFW: false,
      hasToxicLanguage: false,
      hasViolentContent: false,
      hasCopyrightViolation: false,
      isDeepfake: false,
      scores: {
        spam: 0,
        nsfw: 0,
        toxicity: 0,
        violence: 0,
        copyright: 0,
        authenticity: 1
      }
    };

    // Simulate AI analysis
    if (content.text) {
      flags.scores.toxicity = Math.random() * 0.3;
      flags.scores.spam = Math.random() * 0.4;
      flags.hasToxicLanguage = flags.scores.toxicity > 0.7;
      flags.isSpam = flags.scores.spam > 0.7;
    }

    if (content.type === 'image' || content.type === 'video') {
      flags.scores.nsfw = Math.random() * 0.8 + 0.1;
      flags.scores.violence = Math.random() * 0.2;
      flags.scores.authenticity = 0.8 + Math.random() * 0.2;
      flags.isNSFW = flags.scores.nsfw > 0.8;
      flags.hasViolentContent = flags.scores.violence > 0.6;
      flags.isDeepfake = flags.scores.authenticity < 0.7;
    }

    flags.scores.copyright = Math.random() * 0.3;
    flags.hasCopyrightViolation = flags.scores.copyright > 0.8;

    return flags;
  }

  private async checkRuleViolations(flags: ContentFlags): Promise<Array<{
    rule: ModerationRule;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>> {
    const violations = [];

    for (const rule of this.moderationRules.filter(r => r.isActive)) {
      let isViolated = false;
      let confidence = 0;

      switch (rule.id) {
        case 'spam-detection':
          isViolated = flags.isSpam;
          confidence = flags.scores.spam;
          break;
        case 'adult-content':
          isViolated = flags.isNSFW && flags.scores.nsfw > rule.threshold;
          confidence = flags.scores.nsfw;
          break;
        case 'harassment-detection':
          isViolated = flags.hasToxicLanguage;
          confidence = flags.scores.toxicity;
          break;
        case 'copyright-violation':
          isViolated = flags.hasCopyrightViolation;
          confidence = flags.scores.copyright;
          break;
      }

      if (isViolated && confidence >= rule.threshold) {
        violations.push({
          rule,
          severity: rule.severity,
          confidence
        });
      }
    }

    return violations;
  }

  private determineAction(violations: Array<{
    rule: ModerationRule;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>): { type: 'allow' | 'flag' | 'review' | 'block'; reason?: string } {
    if (violations.length === 0) {
      return { type: 'allow' };
    }

    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    const mediumViolations = violations.filter(v => v.severity === 'medium');

    if (criticalViolations.length > 0) {
      return {
        type: 'block',
        reason: `Critical violation: ${criticalViolations[0].rule.name}`
      };
    }

    if (highViolations.length > 1 || (highViolations.length === 1 && highViolations[0].confidence > 0.9)) {
      return {
        type: 'block',
        reason: `High severity violations detected`
      };
    }

    if (highViolations.length === 1 || mediumViolations.length > 2) {
      return {
        type: 'review',
        reason: 'Manual review required for potential violations'
      };
    }

    return {
      type: 'flag',
      reason: 'Potential policy violations detected'
    };
  }

  private calculateOverallConfidence(flags: ContentFlags): number {
    const scores = Object.values(flags.scores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private getStatusFromAction(action: { type: string }): 'approved' | 'flagged' | 'pending' | 'rejected' {
    switch (action.type) {
      case 'allow': return 'approved';
      case 'flag': return 'flagged';
      case 'review': return 'pending';
      case 'block': return 'rejected';
      default: return 'pending';
    }
  }

  private queueAction(action: ModerationAction): void {
    this.actionQueue.push(action);
    this.emit('action-queued', action);
  }

  private startProcessingQueue(): void {
    setInterval(async () => {
      if (this.isProcessing || this.actionQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const action = this.actionQueue.shift()!;

      try {
        await this.executeAction(action);
        this.emit('action-executed', action);
      } catch (error) {
        this.emit('action-failed', { action, error });
      } finally {
        this.isProcessing = false;
      }
    }, 1000);
  }

  private async executeAction(action: ModerationAction): Promise<void> {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    // In real implementation, this would interface with content management systems
  }
}
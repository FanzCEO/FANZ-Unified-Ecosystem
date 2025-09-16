/**
 * 🎯 Policy Engine - Open Policy Agent Integration
 * 
 * High-performance policy evaluation engine using OPA/Rego
 * Supports real-time authorization decisions with cluster-specific policies
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { metrics } from '../monitoring/metrics';
import { 
  AuthorizationRequest, 
  PolicyDocument, 
  ValidationResult,
  PolicyError,
  ClusterType
} from '../types';

export class PolicyEngine extends EventEmitter {
  private policies: Map<string, PolicyDocument> = new Map();
  private clusterPolicies: Map<ClusterType, PolicyDocument[]> = new Map();
  private policyCache: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  
  constructor() {
    super();
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      await this.loadDefaultPolicies();
      await this.loadClusterPolicies();
      this.isInitialized = true;
      logger.info('Policy Engine initialized successfully');
      this.emit('ready');
    } catch (error) {
      logger.error('Failed to initialize Policy Engine:', error);
      throw new PolicyError('Policy Engine initialization failed', error);
    }
  }

  /**
   * Load default system-wide policies
   */
  private async loadDefaultPolicies(): Promise<void> {
    const defaultPolicies = [
      this.createBaseAuthenticationPolicy(),
      this.createContentAccessPolicy(),
      this.createAdminAccessPolicy(),
      this.createCreatorContentPolicy(),
      this.createCompliancePolicy()
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
      logger.debug(`Loaded default policy: ${policy.name}`);
    }
  }

  /**
   * Load cluster-specific policies for each platform
   */
  private async loadClusterPolicies(): Promise<void> {
    const clusters: ClusterType[] = [
      'fanzlab', 'boyfanz', 'girlfanz', 'daddyfanz', 
      'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
    ];

    for (const cluster of clusters) {
      const clusterPolicies = this.createClusterPolicies(cluster);
      this.clusterPolicies.set(cluster, clusterPolicies);
      
      for (const policy of clusterPolicies) {
        this.policies.set(policy.id, policy);
      }
      
      logger.debug(`Loaded ${clusterPolicies.length} policies for cluster: ${cluster}`);
    }
  }

  /**
   * Core policy evaluation method
   */
  public async evaluate(request: AuthorizationRequest): Promise<any> {
    if (!this.isInitialized) {
      throw new PolicyError('Policy Engine not initialized');
    }

    const startTime = Date.now();
    const evaluationId = this.generateEvaluationId(request);

    try {
      // Step 1: Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(request);
      
      if (applicablePolicies.length === 0) {
        logger.warn('No applicable policies found for request', {
          userId: request.user.id,
          resource: request.resource.type,
          cluster: request.context.cluster
        });
        return {
          allowed: false,
          reason: 'No applicable policies found'
        };
      }

      // Step 2: Evaluate policies in priority order
      const evaluationResults = await Promise.all(
        applicablePolicies.map(policy => this.evaluatePolicy(policy, request))
      );

      // Step 3: Combine results using policy combining algorithm
      const finalResult = this.combineResults(evaluationResults, request);

      // Step 4: Record metrics
      const evaluationTime = Date.now() - startTime;
      metrics.recordPolicyEvaluation(evaluationTime, applicablePolicies.length, finalResult.allowed);

      logger.debug(`Policy evaluation completed`, {
        evaluationId,
        allowed: finalResult.allowed,
        evaluationTime,
        policiesEvaluated: applicablePolicies.length
      });

      return finalResult;

    } catch (error) {
      logger.error(`Policy evaluation failed for ${evaluationId}:`, error);
      metrics.recordPolicyError('evaluation_failed');
      
      return {
        allowed: false,
        reason: 'Policy evaluation error',
        error: error.message
      };
    }
  }

  /**
   * Get policies applicable to the current request
   */
  private getApplicablePolicies(request: AuthorizationRequest): PolicyDocument[] {
    const policies: PolicyDocument[] = [];

    // Add universal policies
    const universalPolicies = Array.from(this.policies.values()).filter(
      policy => !policy.cluster || policy.cluster === 'universal'
    );
    policies.push(...universalPolicies);

    // Add cluster-specific policies
    const clusterPolicies = this.clusterPolicies.get(request.context.cluster as ClusterType);
    if (clusterPolicies) {
      policies.push(...clusterPolicies);
    }

    // Sort by priority (higher priority first)
    return policies.sort((a, b) => b.metadata.priority - a.metadata.priority);
  }

  /**
   * Evaluate a single policy against the request
   */
  private async evaluatePolicy(policy: PolicyDocument, request: AuthorizationRequest): Promise<any> {
    try {
      const results = [];

      for (const rule of policy.rules) {
        if (!rule.condition) continue;

        const ruleResult = await this.evaluateCondition(rule.condition, request);
        
        if (ruleResult) {
          results.push({
            ruleId: rule.id,
            effect: rule.effect,
            obligations: rule.obligations || [],
            advice: rule.advice || []
          });
        }
      }

      return {
        policyId: policy.id,
        policyName: policy.name,
        results
      };

    } catch (error) {
      logger.error(`Failed to evaluate policy ${policy.id}:`, error);
      return {
        policyId: policy.id,
        policyName: policy.name,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Evaluate a policy condition
   */
  private async evaluateCondition(condition: any, request: AuthorizationRequest): Promise<boolean> {
    switch (condition.type) {
      case 'and':
        return condition.operands.every((op: any) => this.evaluateCondition(op, request));
      
      case 'or':
        return condition.operands.some((op: any) => this.evaluateCondition(op, request));
      
      case 'not':
        return !this.evaluateCondition(condition.operands[0], request);
      
      case 'comparison':
        return this.evaluateComparison(condition, request);
      
      case 'membership':
        return this.evaluateMembership(condition, request);
      
      default:
        logger.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Evaluate comparison conditions
   */
  private evaluateComparison(condition: any, request: AuthorizationRequest): boolean {
    const attributeValue = this.getAttributeValue(condition.attribute, request);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return attributeValue === expectedValue;
      
      case 'not_equals':
        return attributeValue !== expectedValue;
      
      case 'greater_than':
        return Number(attributeValue) > Number(expectedValue);
      
      case 'less_than':
        return Number(attributeValue) < Number(expectedValue);
      
      case 'greater_than_or_equal':
        return Number(attributeValue) >= Number(expectedValue);
      
      case 'less_than_or_equal':
        return Number(attributeValue) <= Number(expectedValue);
      
      case 'contains':
        return String(attributeValue).includes(String(expectedValue));
      
      case 'starts_with':
        return String(attributeValue).startsWith(String(expectedValue));
      
      case 'ends_with':
        return String(attributeValue).endsWith(String(expectedValue));
      
      case 'regex_match':
        return new RegExp(expectedValue).test(String(attributeValue));
      
      default:
        logger.warn(`Unknown comparison operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Evaluate membership conditions
   */
  private evaluateMembership(condition: any, request: AuthorizationRequest): boolean {
    const attributeValue = this.getAttributeValue(condition.attribute, request);
    const values = condition.values || [];
    
    return values.includes(attributeValue);
  }

  /**
   * Get attribute value from request context
   */
  private getAttributeValue(attribute: string, request: AuthorizationRequest): any {
    const parts = attribute.split('.');
    let current: any = request;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Combine multiple policy evaluation results
   */
  private combineResults(results: any[], request: AuthorizationRequest): any {
    let allowed = false;
    let denyReasons: string[] = [];
    let allowReasons: string[] = [];
    const obligations: any[] = [];
    const advice: any[] = [];

    for (const policyResult of results) {
      for (const result of policyResult.results) {
        if (result.effect === 'allow') {
          allowed = true;
          allowReasons.push(`Policy ${policyResult.policyName}: ${result.ruleId}`);
        } else if (result.effect === 'deny') {
          allowed = false;
          denyReasons.push(`Policy ${policyResult.policyName}: ${result.ruleId}`);
        }

        obligations.push(...result.obligations);
        advice.push(...result.advice);
      }
    }

    return {
      allowed,
      reason: allowed 
        ? allowReasons.join('; ') 
        : denyReasons.length > 0 
          ? denyReasons.join('; ') 
          : 'Access denied by policy',
      obligations,
      advice
    };
  }

  /**
   * Get cluster-specific policies
   */
  public async getClusterPolicies(cluster: string): Promise<PolicyDocument[]> {
    return this.clusterPolicies.get(cluster as ClusterType) || [];
  }

  /**
   * Deploy a new policy
   */
  public async deployPolicy(policy: PolicyDocument): Promise<void> {
    try {
      const validation = await this.validatePolicy(policy);
      if (!validation.valid) {
        throw new PolicyError('Invalid policy document', validation.errors);
      }

      this.policies.set(policy.id, policy);
      
      if (policy.cluster) {
        const clusterPolicies = this.clusterPolicies.get(policy.cluster as ClusterType) || [];
        clusterPolicies.push(policy);
        this.clusterPolicies.set(policy.cluster as ClusterType, clusterPolicies);
      }

      // Clear policy cache
      this.policyCache.clear();

      logger.info(`Policy deployed successfully: ${policy.name} (${policy.id})`);
      this.emit('policyDeployed', policy);

    } catch (error) {
      logger.error(`Failed to deploy policy ${policy.id}:`, error);
      throw new PolicyError('Policy deployment failed', error);
    }
  }

  /**
   * Validate policy document
   */
  public async validatePolicy(policy: PolicyDocument): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic structure validation
    if (!policy.id) errors.push({ code: 'MISSING_ID', message: 'Policy ID is required' });
    if (!policy.name) errors.push({ code: 'MISSING_NAME', message: 'Policy name is required' });
    if (!policy.rules || policy.rules.length === 0) {
      errors.push({ code: 'NO_RULES', message: 'Policy must have at least one rule' });
    }

    // Rule validation
    for (let i = 0; i < (policy.rules || []).length; i++) {
      const rule = policy.rules[i];
      if (!rule.id) errors.push({ code: 'MISSING_RULE_ID', message: `Rule ${i} missing ID` });
      if (!rule.condition) errors.push({ code: 'MISSING_CONDITION', message: `Rule ${i} missing condition` });
      if (!['allow', 'deny'].includes(rule.effect)) {
        errors.push({ code: 'INVALID_EFFECT', message: `Rule ${i} has invalid effect` });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Rollback policy to previous version
   */
  public async rollbackPolicy(policyId: string, version: string): Promise<void> {
    // Implementation would load policy from version control system
    logger.info(`Rolling back policy ${policyId} to version ${version}`);
    throw new Error('Policy rollback not implemented yet');
  }

  /**
   * Generate evaluation ID for tracking
   */
  private generateEvaluationId(request: AuthorizationRequest): string {
    const data = `${request.user.id}-${request.resource.type}-${request.action.operation}-${Date.now()}`;
    return createHash('md5').update(data).digest('hex').substring(0, 8);
  }

  // ===== DEFAULT POLICY DEFINITIONS =====

  private createBaseAuthenticationPolicy(): PolicyDocument {
    return {
      id: 'base-authentication',
      version: '1.0.0',
      name: 'Base Authentication Policy',
      description: 'Ensures users are authenticated before accessing resources',
      rules: [
        {
          id: 'require-authentication',
          name: 'Require Authentication',
          description: 'User must be authenticated',
          condition: {
            type: 'comparison',
            attribute: 'user.authenticated',
            operator: 'equals',
            value: true
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['authentication', 'base'],
        priority: 100,
        enabled: true
      }
    };
  }

  private createContentAccessPolicy(): PolicyDocument {
    return {
      id: 'content-access',
      version: '1.0.0',
      name: 'Content Access Policy',
      description: 'Controls access to content based on ratings and subscriptions',
      rules: [
        {
          id: 'age-verification-adult',
          name: 'Age Verification for Adult Content',
          description: 'Adult content requires age verification',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'membership',
                attribute: 'resource.attributes.content_rating',
                values: ['adult', 'extreme']
              },
              {
                type: 'comparison',
                attribute: 'user.attributes.age_verified',
                operator: 'equals',
                value: true
              }
            ]
          },
          effect: 'allow'
        },
        {
          id: 'subscription-access',
          name: 'Subscription Access',
          description: 'Subscription content requires active subscription',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'resource.attributes.visibility',
                operator: 'equals',
                value: 'subscribers'
              },
              {
                type: 'comparison',
                attribute: 'user.attributes.subscriptions.length',
                operator: 'greater_than',
                value: 0
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['content', 'access', 'subscription'],
        priority: 80,
        enabled: true
      }
    };
  }

  private createAdminAccessPolicy(): PolicyDocument {
    return {
      id: 'admin-access',
      version: '1.0.0',
      name: 'Administrative Access Policy',
      description: 'Controls administrative access to system resources',
      rules: [
        {
          id: 'system-admin-full',
          name: 'System Admin Full Access',
          description: 'System admins have full access',
          condition: {
            type: 'membership',
            attribute: 'user.roles',
            values: ['SystemAdmin']
          },
          effect: 'allow'
        },
        {
          id: 'platform-admin-cluster',
          name: 'Platform Admin Cluster Access',
          description: 'Platform admins have access to their assigned cluster',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'membership',
                attribute: 'user.roles',
                values: ['PlatformAdmin']
              },
              {
                type: 'comparison',
                attribute: 'context.cluster',
                operator: 'equals',
                value: 'user.assigned_cluster'
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['admin', 'access', 'cluster'],
        priority: 90,
        enabled: true
      }
    };
  }

  private createCreatorContentPolicy(): PolicyDocument {
    return {
      id: 'creator-content',
      version: '1.0.0',
      name: 'Creator Content Management Policy',
      description: 'Controls creator content management permissions',
      rules: [
        {
          id: 'creator-own-content',
          name: 'Creator Own Content',
          description: 'Creators can manage their own content',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'user.attributes.account_type',
                operator: 'equals',
                value: 'creator'
              },
              {
                type: 'comparison',
                attribute: 'resource.attributes.creator_id',
                operator: 'equals',
                value: 'user.id'
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['creator', 'content', 'management'],
        priority: 70,
        enabled: true
      }
    };
  }

  private createCompliancePolicy(): PolicyDocument {
    return {
      id: 'compliance',
      version: '1.0.0',
      name: 'Legal Compliance Policy',
      description: 'Ensures legal compliance for adult content platforms',
      rules: [
        {
          id: 'usc2257-compliance',
          name: 'USC 2257 Compliance',
          description: 'Adult content requires USC 2257 compliance',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'membership',
                attribute: 'resource.attributes.content_rating',
                values: ['adult', 'extreme']
              },
              {
                type: 'comparison',
                attribute: 'user.attributes.usc2257_records.length',
                operator: 'greater_than',
                value: 0
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['compliance', 'legal', 'usc2257'],
        priority: 95,
        enabled: true
      }
    };
  }

  /**
   * Create cluster-specific policies
   */
  private createClusterPolicies(cluster: ClusterType): PolicyDocument[] {
    switch (cluster) {
      case 'taboofanz':
        return [this.createTabooFanzPolicy()];
      case 'boyfanz':
        return [this.createBoyFanzPolicy()];
      case 'girlfanz':
        return [this.createGirlFanzPolicy()];
      case 'daddyfanz':
        return [this.createDaddyFanzPolicy()];
      case 'fanzcock':
        return [this.createFanzCockPolicy()];
      default:
        return [];
    }
  }

  private createTabooFanzPolicy(): PolicyDocument {
    return {
      id: 'taboofanz-policy',
      version: '1.0.0',
      name: 'TabooFanz Platform Policy',
      description: 'Enhanced restrictions for extreme content platform',
      cluster: 'taboofanz',
      rules: [
        {
          id: 'enhanced-verification',
          name: 'Enhanced Verification Required',
          description: 'TabooFanz requires enhanced verification',
          condition: {
            type: 'comparison',
            attribute: 'user.attributes.enhanced_verification',
            operator: 'equals',
            value: true
          },
          effect: 'allow'
        },
        {
          id: 'content-warnings-required',
          name: 'Content Warnings Required',
          description: 'All content must have warnings',
          condition: {
            type: 'comparison',
            attribute: 'resource.attributes.content_warnings',
            operator: 'equals',
            value: true
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['taboofanz', 'extreme', 'verification'],
        priority: 85,
        enabled: true
      }
    };
  }

  private createBoyFanzPolicy(): PolicyDocument {
    return {
      id: 'boyfanz-policy',
      version: '1.0.0',
      name: 'BoyFanz Platform Policy',
      description: 'Male creator platform specific policies',
      cluster: 'boyfanz',
      rules: [
        {
          id: 'male-content-preference',
          name: 'Male Content Preference',
          description: 'Advice for content targeting',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'user.attributes.gender',
                operator: 'not_equals',
                value: 'male'
              },
              {
                type: 'comparison',
                attribute: 'action.operation',
                operator: 'equals',
                value: 'create'
              }
            ]
          },
          effect: 'allow',
          advice: [
            {
              type: 'cluster_mismatch',
              message: 'Consider using GirlFanz for optimal audience targeting',
              severity: 'info'
            }
          ]
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['boyfanz', 'male', 'targeting'],
        priority: 60,
        enabled: true
      }
    };
  }

  private createGirlFanzPolicy(): PolicyDocument {
    return {
      id: 'girlfanz-policy',
      version: '1.0.0',
      name: 'GirlFanz Platform Policy',
      description: 'Female creator platform specific policies',
      cluster: 'girlfanz',
      rules: [
        {
          id: 'female-content-preference',
          name: 'Female Content Preference',
          description: 'Advice for content targeting',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'user.attributes.gender',
                operator: 'not_equals',
                value: 'female'
              },
              {
                type: 'comparison',
                attribute: 'action.operation',
                operator: 'equals',
                value: 'create'
              }
            ]
          },
          effect: 'allow',
          advice: [
            {
              type: 'cluster_mismatch',
              message: 'Consider using BoyFanz for optimal audience targeting',
              severity: 'info'
            }
          ]
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['girlfanz', 'female', 'targeting'],
        priority: 60,
        enabled: true
      }
    };
  }

  private createDaddyFanzPolicy(): PolicyDocument {
    return {
      id: 'daddyfanz-policy',
      version: '1.0.0',
      name: 'DaddyFanz Platform Policy',
      description: 'BDSM/Dom-Sub community platform policies',
      cluster: 'daddyfanz',
      rules: [
        {
          id: 'community-leadership',
          name: 'Community Leadership Permission',
          description: 'Community leadership requires special role',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'action.operation',
                operator: 'equals',
                value: 'community:lead'
              },
              {
                type: 'membership',
                attribute: 'user.roles',
                values: ['DaddyFanzDom', 'CommunityLeader']
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['daddyfanz', 'community', 'leadership'],
        priority: 75,
        enabled: true
      }
    };
  }

  private createFanzCockPolicy(): PolicyDocument {
    return {
      id: 'fanzcock-policy',
      version: '1.0.0',
      name: 'FanzCock Platform Policy',
      description: 'Short-form video platform restrictions',
      cluster: 'fanzcock',
      rules: [
        {
          id: 'video-duration-limit',
          name: 'Video Duration Limit',
          description: 'Videos must be 60 seconds or less',
          condition: {
            type: 'and',
            operands: [
              {
                type: 'comparison',
                attribute: 'resource.type',
                operator: 'equals',
                value: 'video'
              },
              {
                type: 'comparison',
                attribute: 'resource.attributes.duration',
                operator: 'less_than_or_equal',
                value: 60
              }
            ]
          },
          effect: 'allow'
        }
      ],
      metadata: {
        author: 'system',
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['fanzcock', 'video', 'duration'],
        priority: 75,
        enabled: true
      }
    };
  }
}
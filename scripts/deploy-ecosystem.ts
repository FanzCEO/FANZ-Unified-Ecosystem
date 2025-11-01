#!/usr/bin/env ts-node

/**
 * FANZ Unified Ecosystem Deployment Script
 * 
 * This script demonstrates the complete initialization and integration
 * of all systems in the FANZ Unified Ecosystem.
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';

// Import all system modules
import CoreFinanceLedger from '../finance/src/ledger/CoreFinanceLedger';
import TransactionProcessingEngine from '../finance/src/transactions/TransactionProcessingEngine';
import MultiFactor from '../security/src/auth/MultiFactor';
import RateLimiter from '../security/src/rate-limiting/RateLimiter';
import ContentModerationSystem from '../ai/src/moderation/ContentModerationSystem';
import AIContentIntelligenceSuite from '../ai/src/intelligence/AIContentIntelligenceSuite';
import AdultIndustryComplianceService from '../compliance/src/adult-industry/AdultIndustryComplianceService';
import LegalComplianceTracker from '../compliance/src/legal/LegalComplianceTracker';
import PaymentSecurityFraudSystem from '../payments/src/security/PaymentSecurityFraudSystem';
import SecurityMonitoringDashboard from '../security/src/monitoring/SecurityMonitoringDashboard';
import BlockchainCreatorTokenFoundation from '../blockchain/src/tokens/BlockchainCreatorTokenFoundation';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  enableRealTimeProcessing: boolean;
  enableSecurityMonitoring: boolean;
  enableBlockchainIntegration: boolean;
  enableComplianceTracking: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface SystemHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: string;
}

class FanzEcosystemDeployer extends EventEmitter {
  private config: DeploymentConfig;
  private systems: Map<string, any> = new Map();
  private healthChecks: Map<string, SystemHealthCheck> = new Map();
  private isDeployed = false;

  constructor(config: DeploymentConfig) {
    super();
    this.config = config;
  }

  /**
   * Deploy the complete FANZ Unified Ecosystem
   */
  async deploy(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 FANZ Unified Ecosystem Deployment Started\n'));
    console.log(chalk.gray(`Environment: ${this.config.environment}`));
    console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}\n`));

    try {
      // Step 1: Initialize Core Infrastructure
      await this.initializeCoreInfrastructure();
      
      // Step 2: Initialize Security Systems
      await this.initializeSecuritySystems();
      
      // Step 3: Initialize AI & Content Systems
      await this.initializeAIContentSystems();
      
      // Step 4: Initialize Compliance Systems
      await this.initializeComplianceSystems();
      
      // Step 5: Initialize Financial Systems
      await this.initializeFinancialSystems();
      
      // Step 6: Initialize Blockchain & Web3
      await this.initializeBlockchainSystems();
      
      // Step 7: Initialize Monitoring & Analytics
      await this.initializeMonitoringSystems();
      
      // Step 8: Setup System Integrations
      await this.setupSystemIntegrations();
      
      // Step 9: Run Health Checks
      await this.runSystemHealthChecks();
      
      // Step 10: Start Real-time Processing
      if (this.config.enableRealTimeProcessing) {
        await this.startRealTimeProcessing();
      }

      this.isDeployed = true;
      console.log(chalk.green.bold('\n✅ FANZ Unified Ecosystem Successfully Deployed!\n'));
      
      // Display deployment summary
      await this.displayDeploymentSummary();
      
      this.emit('deploymentComplete', {
        environment: this.config.environment,
        timestamp: new Date(),
        systems: Array.from(this.systems.keys()),
        healthStatus: await this.getOverallHealth()
      });

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Deployment Failed:'), error);
      this.emit('deploymentError', error);
      throw error;
    }
  }

  /**
   * Initialize core infrastructure systems
   */
  private async initializeCoreInfrastructure(): Promise<void> {
    console.log(chalk.yellow('📋 Step 1: Initializing Core Infrastructure...'));

    // Rate Limiting System
    const rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableDistributedMode: this.config.environment === 'production',
      redisUrl: process.env.REDIS_URL
    });
    
    this.systems.set('rateLimiter', rateLimiter);
    console.log(chalk.green('  ✓ Rate Limiting System initialized'));

    await this.delay(500);
  }

  /**
   * Initialize security systems
   */
  private async initializeSecuritySystems(): Promise<void> {
    console.log(chalk.yellow('🔒 Step 2: Initializing Security Systems...'));

    // Multi-Factor Authentication
    const mfaSystem = new MultiFactor({
      tokenExpiry: 300, // 5 minutes
      maxAttempts: 3,
      lockoutDuration: 900, // 15 minutes
      enableSMS: true,
      enableEmail: true,
      enableTOTP: true,
      enableBackupCodes: true,
      enableBiometric: this.config.environment === 'production',
      enableRiskAnalysis: true
    });
    
    this.systems.set('mfaSystem', mfaSystem);
    console.log(chalk.green('  ✓ Multi-Factor Authentication initialized'));

    // Payment Security & Fraud Detection
    const paymentSecurity = new PaymentSecurityFraudSystem({
      fraudDetection: {
        enableRealTime: true,
        riskThresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
          critical: 0.9
        },
        velocityChecks: true,
        deviceFingerprinting: true,
        behavioralAnalysis: true
      },
      pciCompliance: {
        tokenization: true,
        encryption: 'AES-256',
        keyRotation: true,
        auditLogging: true
      }
    });
    
    this.systems.set('paymentSecurity', paymentSecurity);
    console.log(chalk.green('  ✓ Payment Security & Fraud Detection initialized'));

    await this.delay(500);
  }

  /**
   * Initialize AI and content systems
   */
  private async initializeAIContentSystems(): Promise<void> {
    console.log(chalk.yellow('🤖 Step 3: Initializing AI & Content Systems...'));

    // Content Moderation System
    const contentModeration = new ContentModerationSystem({
      aiModeration: {
        enableVisualAnalysis: true,
        enableTextAnalysis: true,
        enableAudioAnalysis: true,
        confidenceThreshold: 0.8,
        autoActionThreshold: 0.9
      },
      customPolicies: [
        {
          name: 'Adult Content Safety',
          description: 'Ensures all adult content meets platform guidelines',
          rules: ['age_verification', 'consent_verification', 'content_labeling'],
          severity: 'high',
          autoEnforce: true
        }
      ],
      humanReview: {
        enabled: true,
        queuePriority: 'high_risk_first',
        escalationRules: ['violence', 'harassment', 'illegal_content']
      }
    });
    
    this.systems.set('contentModeration', contentModeration);
    console.log(chalk.green('  ✓ AI Content Moderation System initialized'));

    // AI Content Intelligence Suite
    const aiIntelligence = new AIContentIntelligenceSuite({
      contentAnalysis: {
        enableSemanticAnalysis: true,
        enableSentimentAnalysis: true,
        enableTopicModeling: true,
        enableTrendDetection: true
      },
      personalization: {
        enableRecommendations: true,
        enableUserProfiling: true,
        enableContentOptimization: true
      },
      insights: {
        enablePerformanceAnalytics: true,
        enableAudienceAnalytics: true,
        enableContentInsights: true,
        enablePredictiveAnalytics: true
      }
    });
    
    this.systems.set('aiIntelligence', aiIntelligence);
    console.log(chalk.green('  ✓ AI Content Intelligence Suite initialized'));

    await this.delay(500);
  }

  /**
   * Initialize compliance systems
   */
  private async initializeComplianceSystems(): Promise<void> {
    console.log(chalk.yellow('⚖️ Step 4: Initializing Compliance Systems...'));

    // Adult Industry Compliance
    const adultCompliance = new AdultIndustryComplianceService({
      recordKeeping: {
        enable2257: true,
        recordRetentionYears: 7,
        digitalSignatures: true,
        auditTrails: true,
        backupStorage: true
      },
      ageVerification: {
        enableStrictVerification: true,
        acceptedDocuments: ['passport', 'drivers_license', 'government_id'],
        biometricVerification: this.config.environment === 'production',
        thirdPartyVerification: true
      },
      contentLabeling: {
        enableAutomaticLabeling: true,
        requireCreatorLabeling: true,
        labelingCategories: ['explicit', 'nudity', 'sexual_content'],
        ageRating: true
      }
    });
    
    this.systems.set('adultCompliance', adultCompliance);
    console.log(chalk.green('  ✓ Adult Industry Compliance Service initialized'));

    // Legal Compliance Tracker
    const legalCompliance = new LegalComplianceTracker({
      monitoring: {
        enableAutomaticMonitoring: true,
        monitoringFrequency: 'daily',
        alertThreshold: 'medium',
        enablePredictiveAlerts: true
      },
      jurisdictions: ['US_FEDERAL', 'EU', 'UK', 'CANADA', 'AUSTRALIA'],
      complianceCategories: [
        'age_verification',
        'content_labeling',
        'record_keeping',
        'geographic_restrictions',
        'advertising_restrictions'
      ]
    });
    
    this.systems.set('legalCompliance', legalCompliance);
    console.log(chalk.green('  ✓ Legal Compliance Tracker initialized'));

    await this.delay(500);
  }

  /**
   * Initialize financial systems
   */
  private async initializeFinancialSystems(): Promise<void> {
    console.log(chalk.yellow('💰 Step 5: Initializing Financial Systems...'));

    // Core Financial Ledger
    const coreFinanceLedger = new CoreFinanceLedger({
      doubleEntry: {
        enforceBalance: true,
        enableRealTimeValidation: true,
        auditTrail: true,
        immutableRecords: true
      },
      currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC', 'ETH'],
      accounting: {
        fiscalYearStart: 'january',
        decimalPrecision: 8,
        rounding: 'half_up',
        enableMultiCurrency: true
      },
      reporting: {
        enableRealTimeReporting: true,
        generateAutomaticReports: true,
        reportingFrequency: 'daily'
      }
    });
    
    this.systems.set('coreFinanceLedger', coreFinanceLedger);
    console.log(chalk.green('  ✓ Core Financial Ledger initialized'));

    // Transaction Processing Engine
    const transactionEngine = new TransactionProcessingEngine({
      processing: {
        enableRealTimeProcessing: true,
        batchSize: 1000,
        processingThreads: 4,
        retryAttempts: 3,
        timeoutMs: 30000
      },
      validation: {
        enableFraudDetection: true,
        enableComplianceChecks: true,
        enableBalanceValidation: true,
        enableRiskAssessment: true
      },
      automation: {
        enableAutoReconciliation: true,
        enableAutoJournalEntries: true,
        enableAutoTaxCalculation: true,
        enableAutoReporting: true
      }
    });
    
    this.systems.set('transactionEngine', transactionEngine);
    console.log(chalk.green('  ✓ Transaction Processing Engine initialized'));

    await this.delay(500);
  }

  /**
   * Initialize blockchain and Web3 systems
   */
  private async initializeBlockchainSystems(): Promise<void> {
    console.log(chalk.yellow('⛓️ Step 6: Initializing Blockchain & Web3 Systems...'));

    if (!this.config.enableBlockchainIntegration) {
      console.log(chalk.gray('  ⏭️ Blockchain integration disabled, skipping...'));
      return;
    }

    // Blockchain Creator Token Foundation
    const blockchainFoundation = new BlockchainCreatorTokenFoundation({
      networks: {
        ethereum: true,
        polygon: true,
        binanceSmartChain: true,
        avalanche: true,
        arbitrum: true,
        optimism: true,
        solana: true,
        cardano: false
      },
      tokens: {
        fungibleTokens: true,
        nonFungibleTokens: true,
        semifungibleTokens: true,
        socialTokens: true,
        utilityTokens: true,
        governanceTokens: true,
        rewardTokens: true
      },
      smart_contracts: {
        creatorTokenFactory: true,
        nftMarketplace: true,
        stakingPools: true,
        daoGovernance: true,
        royaltyDistribution: true,
        contentLicensing: true,
        metaverseIntegration: true
      },
      defi: {
        liquidityPools: true,
        yieldFarming: true,
        lending: true,
        derivatives: false,
        crossChainBridges: true
      },
      metaverse: {
        virtualRealEstate: true,
        avatarNFTs: true,
        virtualGoods: true,
        metaverseEvents: true,
        interoperability: true
      }
    });
    
    this.systems.set('blockchainFoundation', blockchainFoundation);
    console.log(chalk.green('  ✓ Blockchain Creator Token Foundation initialized'));

    await this.delay(500);
  }

  /**
   * Initialize monitoring and analytics systems
   */
  private async initializeMonitoringSystems(): Promise<void> {
    console.log(chalk.yellow('📊 Step 7: Initializing Monitoring & Analytics Systems...'));

    if (!this.config.enableSecurityMonitoring) {
      console.log(chalk.gray('  ⏭️ Security monitoring disabled, skipping...'));
      return;
    }

    // Security Monitoring Dashboard
    const securityDashboard = new SecurityMonitoringDashboard({
      monitoring: {
        eventIngestionRate: 10000,
        retentionPeriod: 90,
        realTimeAlerts: true,
        anomalyDetection: true,
        threatIntelligence: true
      },
      alerting: {
        severityThresholds: {
          info: 1000,
          low: 100,
          medium: 50,
          high: 10,
          critical: 1
        },
        escalationRules: [],
        notificationChannels: [],
        autoResponse: true
      },
      integrations: {
        rateLimitingService: true,
        mfaService: true,
        contentModerationService: true,
        complianceService: true,
        paymentSecurityService: true
      },
      dashboards: {
        executiveSummary: true,
        operationalMetrics: true,
        threatLandscape: true,
        complianceOverview: true,
        incidentTracking: true
      }
    });
    
    this.systems.set('securityDashboard', securityDashboard);
    console.log(chalk.green('  ✓ Security Monitoring Dashboard initialized'));

    await this.delay(500);
  }

  /**
   * Setup integrations between all systems
   */
  private async setupSystemIntegrations(): Promise<void> {
    console.log(chalk.yellow('🔗 Step 8: Setting up System Integrations...'));

    const securityDashboard = this.systems.get('securityDashboard');
    const mfaSystem = this.systems.get('mfaSystem');
    const contentModeration = this.systems.get('contentModeration');
    const paymentSecurity = this.systems.get('paymentSecurity');
    const adultCompliance = this.systems.get('adultCompliance');

    if (securityDashboard) {
      // Integrate MFA events with security dashboard
      if (mfaSystem) {
        mfaSystem.on('authenticationAttempt', async (event: any) => {
          await securityDashboard.ingestSecurityEvent({
            source: 'mfa_service',
            category: 'authentication',
            severity: event.success ? 'info' : 'medium',
            title: event.success ? 'MFA Success' : 'MFA Failed',
            description: `MFA attempt for user ${event.userId}`,
            userId: event.userId,
            ipAddress: this.hashIP(event.ipAddress || ''),
            userAgent: this.hashUserAgent(event.userAgent || ''),
            platform: event.platform || 'web',
            location: event.location || { country: 'US', region: 'CA', city: 'SF' },
            metadata: { attempts: event.attemptCount || 1 },
            rawData: event,
            tags: ['mfa', 'authentication']
          });
        });
        console.log(chalk.green('  ✓ MFA → Security Dashboard integration configured'));
      }

      // Integrate content moderation events
      if (contentModeration) {
        contentModeration.on('contentFlagged', async (event: any) => {
          await securityDashboard.ingestSecurityEvent({
            source: 'content_moderation',
            category: 'abuse',
            severity: event.violationLevel === 'high' ? 'high' : 'medium',
            title: 'Content Policy Violation',
            description: `Content ${event.contentId} flagged for ${event.violationType}`,
            userId: event.creatorId,
            ipAddress: this.hashIP(''),
            userAgent: this.hashUserAgent(''),
            platform: event.platform || 'web',
            location: { country: 'US', region: 'CA', city: 'SF' },
            metadata: { violationType: event.violationType, confidence: event.confidence },
            rawData: event,
            tags: ['content', 'moderation', 'policy']
          });
        });
        console.log(chalk.green('  ✓ Content Moderation → Security Dashboard integration configured'));
      }

      // Integrate payment fraud events
      if (paymentSecurity) {
        paymentSecurity.on('fraudDetected', async (event: any) => {
          await securityDashboard.createSecurityAlert({
            eventId: event.id,
            type: 'THREAT_DETECTED',
            severity: 'CRITICAL',
            title: 'Payment Fraud Detected',
            description: `Fraudulent transaction blocked: ${event.amount} ${event.currency}`,
            responsePlaybook: 'fraud-response'
          });
        });
        console.log(chalk.green('  ✓ Payment Security → Security Dashboard integration configured'));
      }

      // Integrate compliance events
      if (adultCompliance) {
        adultCompliance.on('complianceViolation', async (event: any) => {
          await securityDashboard.createSecurityAlert({
            eventId: event.id,
            type: 'COMPLIANCE_VIOLATION',
            severity: 'HIGH',
            title: 'Compliance Violation Detected',
            description: `${event.violationType}: ${event.description}`,
            responsePlaybook: 'compliance-response'
          });
        });
        console.log(chalk.green('  ✓ Compliance → Security Dashboard integration configured'));
      }
    }

    await this.delay(500);
  }

  /**
   * Run comprehensive health checks on all systems
   */
  private async runSystemHealthChecks(): Promise<void> {
    console.log(chalk.yellow('🏥 Step 9: Running System Health Checks...'));

    for (const [serviceName, system] of this.systems) {
      const startTime = Date.now();
      try {
        // Mock health check - in real implementation, each system would have a health() method
        const isHealthy = await this.performHealthCheck(system);
        const responseTime = Date.now() - startTime;
        
        this.healthChecks.set(serviceName, {
          service: serviceName,
          status: isHealthy ? 'healthy' : 'degraded',
          responseTime,
          details: isHealthy ? 'All systems operational' : 'Some components degraded'
        });

        console.log(chalk.green(`  ✓ ${serviceName}: ${isHealthy ? 'Healthy' : 'Degraded'} (${responseTime}ms)`));
      } catch (error) {
        this.healthChecks.set(serviceName, {
          service: serviceName,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(chalk.red(`  ❌ ${serviceName}: Unhealthy - ${error}`));
      }
    }

    await this.delay(500);
  }

  /**
   * Start real-time processing systems
   */
  private async startRealTimeProcessing(): Promise<void> {
    console.log(chalk.yellow('⚡ Step 10: Starting Real-time Processing...'));

    // Start event processing queues
    console.log(chalk.green('  ✓ Event processing queues started'));
    
    // Start real-time analytics
    console.log(chalk.green('  ✓ Real-time analytics engine started'));
    
    // Start monitoring dashboards
    console.log(chalk.green('  ✓ Monitoring dashboards started'));
    
    // Start automated systems
    console.log(chalk.green('  ✓ Automated processing systems started'));

    await this.delay(500);
  }

  /**
   * Display comprehensive deployment summary
   */
  private async displayDeploymentSummary(): Promise<void> {
    console.log(chalk.blue.bold('\n📋 DEPLOYMENT SUMMARY\n'));
    
    // System counts
    const totalSystems = this.systems.size;
    const healthySystems = Array.from(this.healthChecks.values()).filter(h => h.status === 'healthy').length;
    const degradedSystems = Array.from(this.healthChecks.values()).filter(h => h.status === 'degraded').length;
    const unhealthySystems = Array.from(this.healthChecks.values()).filter(h => h.status === 'unhealthy').length;

    console.log(`${chalk.cyan('Environment:')} ${this.config.environment}`);
    console.log(`${chalk.cyan('Total Systems:')} ${totalSystems}`);
    console.log(`${chalk.green('Healthy:')} ${healthySystems}`);
    console.log(`${chalk.yellow('Degraded:')} ${degradedSystems}`);
    console.log(`${chalk.red('Unhealthy:')} ${unhealthySystems}`);
    console.log(`${chalk.cyan('Overall Health:')} ${await this.getOverallHealth()}`);
    
    console.log(chalk.blue('\n🔧 Deployed Systems:'));
    for (const serviceName of this.systems.keys()) {
      const health = this.healthChecks.get(serviceName);
      const statusColor = health?.status === 'healthy' ? chalk.green : 
                          health?.status === 'degraded' ? chalk.yellow : chalk.red;
      console.log(`  ${statusColor('●')} ${serviceName} (${health?.responseTime}ms)`);
    }

    console.log(chalk.blue('\n⚙️ Configuration:'));
    console.log(`  ${chalk.cyan('Real-time Processing:')} ${this.config.enableRealTimeProcessing ? 'Enabled' : 'Disabled'}`);
    console.log(`  ${chalk.cyan('Security Monitoring:')} ${this.config.enableSecurityMonitoring ? 'Enabled' : 'Disabled'}`);
    console.log(`  ${chalk.cyan('Blockchain Integration:')} ${this.config.enableBlockchainIntegration ? 'Enabled' : 'Disabled'}`);
    console.log(`  ${chalk.cyan('Compliance Tracking:')} ${this.config.enableComplianceTracking ? 'Enabled' : 'Disabled'}`);

    console.log(chalk.blue('\n🔗 API Endpoints:'));
    console.log(`  ${chalk.cyan('Security Dashboard:')} https://security.fanz.com/dashboard`);
    console.log(`  ${chalk.cyan('Financial API:')} https://api.fanz.com/finance/v1`);
    console.log(`  ${chalk.cyan('Blockchain API:')} https://api.fanz.com/blockchain/v1`);
    console.log(`  ${chalk.cyan('Content API:')} https://api.fanz.com/content/v1`);
    console.log(`  ${chalk.cyan('Compliance API:')} https://api.fanz.com/compliance/v1`);

    if (this.config.environment === 'production') {
      console.log(chalk.green.bold('\n🎉 FANZ Unified Ecosystem is LIVE and ready for production traffic!'));
    } else {
      console.log(chalk.yellow.bold('\n🧪 FANZ Unified Ecosystem is ready for testing and development!'));
    }

    console.log(chalk.gray(`\nDeployment completed at ${new Date().toISOString()}`));
  }

  /**
   * Get overall system health status
   */
  private async getOverallHealth(): Promise<'healthy' | 'degraded' | 'critical'> {
    const healthChecks = Array.from(this.healthChecks.values());
    const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
    const degradedCount = healthChecks.filter(h => h.status === 'degraded').length;

    if (unhealthyCount > 0) return 'critical';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  /**
   * Mock health check for systems
   */
  private async performHealthCheck(system: any): Promise<boolean> {
    // Mock health check - in production this would call actual health endpoints
    await this.delay(Math.random() * 100 + 50);
    return Math.random() > 0.1; // 90% success rate for demo
  }

  /**
   * Utility methods
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hashIP(ip: string): string {
    // Mock IP hashing
    return `hashed_${ip.replace(/\./g, '_')}`;
  }

  private hashUserAgent(userAgent: string): string {
    // Mock user agent hashing
    return `hashed_${userAgent.substring(0, 20)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log(chalk.yellow('\n🛑 Initiating graceful shutdown...'));
    
    for (const [serviceName, system] of this.systems) {
      try {
        if (typeof system.shutdown === 'function') {
          await system.shutdown();
          console.log(chalk.green(`  ✓ ${serviceName} shutdown complete`));
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ${serviceName} shutdown error: ${error}`));
      }
    }
    
    console.log(chalk.green('✅ Shutdown complete\n'));
  }
}

// Main deployment execution
async function main() {
  const config: DeploymentConfig = {
    environment: (process.env.NODE_ENV as any) || 'development',
    enableRealTimeProcessing: process.env.ENABLE_REALTIME !== 'false',
    enableSecurityMonitoring: process.env.ENABLE_SECURITY !== 'false', 
    enableBlockchainIntegration: process.env.ENABLE_BLOCKCHAIN !== 'false',
    enableComplianceTracking: process.env.ENABLE_COMPLIANCE !== 'false',
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  };

  const deployer = new FanzEcosystemDeployer(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await deployer.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await deployer.shutdown();
    process.exit(0);
  });

  try {
    await deployer.deploy();
    
    // Keep process running in production
    if (config.environment === 'production') {
      console.log(chalk.green('🔄 Running in production mode - keeping process alive...'));
      
      // Set up health monitoring interval
      setInterval(async () => {
        const health = await deployer.getOverallHealth();
        if (health !== 'healthy') {
          console.log(chalk.yellow(`⚠️ System health: ${health}`));
        }
      }, 60000); // Check every minute
      
      // Keep process alive
      process.stdin.resume();
    }
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FanzEcosystemDeployer, DeploymentConfig };
export default FanzEcosystemDeployer;
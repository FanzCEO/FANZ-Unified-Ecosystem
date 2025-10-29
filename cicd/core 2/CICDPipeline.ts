/**
 * 🔄 CI/CD Pipeline Automation
 * Automated build, test, deployment with feature flags and phased rollouts
 */

import { EventEmitter } from 'events';

interface Pipeline {
  id: string;
  name: string;
  repository: string;
  branch: string;
  trigger: 'push' | 'pull_request' | 'scheduled' | 'manual';
  stages: PipelineStage[];
  environment_promotions: EnvironmentPromotion[];
  feature_flags: FeatureFlag[];
  rollout_strategy: RolloutStrategy;
  notifications: NotificationConfig[];
}

interface PipelineStage {
  id: string;
  name: string;
  type: 'build' | 'test' | 'security_scan' | 'deploy' | 'validate';
  dependencies: string[];
  timeout_minutes: number;
  retry_attempts: number;
  parallel_execution: boolean;
  conditions: StageCondition[];
  actions: PipelineAction[];
  success_criteria: SuccessCriteria;
}

interface PipelineAction {
  id: string;
  type: 'command' | 'docker_build' | 'kubernetes_deploy' | 'test_run' | 'security_scan';
  configuration: { [key: string]: any };
  environment_variables: { [key: string]: string };
  secrets: string[];
  artifacts: {
    inputs: string[];
    outputs: string[];
  };
}

interface EnvironmentPromotion {
  from_environment: string;
  to_environment: string;
  approval_required: boolean;
  approvers: string[];
  automatic_conditions: AutoPromotionCondition[];
  rollback_enabled: boolean;
  max_rollback_hours: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: string[];
  rollout_percentage: number;
  target_users: string[];
  conditions: { [key: string]: any };
  created_by: string;
  expires_at?: Date;
}

interface RolloutStrategy {
  type: 'blue_green' | 'canary' | 'rolling' | 'feature_flag';
  configuration: {
    canary_percentage?: number;
    canary_duration_minutes?: number;
    success_threshold?: number;
    rollback_threshold?: number;
    monitoring_metrics?: string[];
  };
}

interface PipelineRun {
  id: string;
  pipeline_id: string;
  trigger_event: {
    type: string;
    source: string;
    commit_sha: string;
    author: string;
    timestamp: Date;
  };
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'skipped';
  current_stage: string;
  stages_status: { [stage_id: string]: StageStatus };
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  artifacts: PipelineArtifact[];
  logs: PipelineLog[];
}

interface StageStatus {
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  exit_code?: number;
  error_message?: string;
  artifacts_generated: string[];
}

interface PipelineArtifact {
  id: string;
  name: string;
  type: 'container_image' | 'build_output' | 'test_results' | 'security_report';
  path: string;
  size_bytes: number;
  checksum: string;
  created_at: Date;
  retention_days: number;
}

export class CICDPipeline extends EventEmitter {
  private pipelines: Map<string, Pipeline> = new Map();
  private pipelineRuns: Map<string, PipelineRun> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private activeDeployments: Map<string, any> = new Map();
  
  constructor() {
    super();
    this.initializeCICDPipeline();
  }

  private async initializeCICDPipeline(): Promise<void> {
    console.log('🔄 Initializing CI/CD Pipeline...');
    
    await this.setupPipelines();
    await this.initializeFeatureFlags();
    await this.startPipelineMonitoring();
    
    console.log('✅ CI/CD Pipeline initialized successfully');
  }

  private async setupPipelines(): Promise<void> {
    const pipelines: Pipeline[] = [
      {
        id: 'fanz_main_pipeline',
        name: 'FANZ Enterprise Main Pipeline',
        repository: 'FANZ_UNIFIED_ECOSYSTEM',
        branch: 'main',
        trigger: 'push',
        stages: [
          {
            id: 'checkout',
            name: 'Checkout Code',
            type: 'build',
            dependencies: [],
            timeout_minutes: 5,
            retry_attempts: 2,
            parallel_execution: false,
            conditions: [],
            actions: [{
              id: 'git_checkout',
              type: 'command',
              configuration: { command: 'git checkout $BRANCH' },
              environment_variables: {},
              secrets: [],
              artifacts: { inputs: [], outputs: ['source_code'] }
            }],
            success_criteria: { exit_code: 0, artifacts_present: ['source_code'] }
          },
          {
            id: 'install_dependencies',
            name: 'Install Dependencies',
            type: 'build',
            dependencies: ['checkout'],
            timeout_minutes: 10,
            retry_attempts: 3,
            parallel_execution: false,
            conditions: [],
            actions: [{
              id: 'npm_install',
              type: 'command',
              configuration: { command: 'pnpm install --frozen-lockfile' },
              environment_variables: { NODE_ENV: 'development' },
              secrets: [],
              artifacts: { inputs: ['source_code'], outputs: ['node_modules'] }
            }],
            success_criteria: { exit_code: 0, artifacts_present: ['node_modules'] }
          },
          {
            id: 'parallel_validation',
            name: 'Parallel Validation',
            type: 'test',
            dependencies: ['install_dependencies'],
            timeout_minutes: 20,
            retry_attempts: 1,
            parallel_execution: true,
            conditions: [],
            actions: [
              {
                id: 'lint',
                type: 'command',
                configuration: { command: 'pnpm -r run lint' },
                environment_variables: {},
                secrets: [],
                artifacts: { inputs: ['source_code', 'node_modules'], outputs: ['lint_results'] }
              },
              {
                id: 'typecheck',
                type: 'command',
                configuration: { command: 'pnpm -r run typecheck' },
                environment_variables: {},
                secrets: [],
                artifacts: { inputs: ['source_code', 'node_modules'], outputs: ['type_results'] }
              },
              {
                id: 'unit_tests',
                type: 'test_run',
                configuration: { command: 'pnpm -r run test:unit', coverage_threshold: 80 },
                environment_variables: { NODE_ENV: 'test' },
                secrets: [],
                artifacts: { inputs: ['source_code', 'node_modules'], outputs: ['test_results', 'coverage_report'] }
              }
            ],
            success_criteria: { exit_code: 0, coverage_threshold: 80 }
          },
          {
            id: 'security_scans',
            name: 'Security Scanning',
            type: 'security_scan',
            dependencies: ['install_dependencies'],
            timeout_minutes: 15,
            retry_attempts: 1,
            parallel_execution: true,
            conditions: [],
            actions: [
              {
                id: 'dependency_scan',
                type: 'security_scan',
                configuration: { scanner: 'npm_audit', severity_threshold: 'high' },
                environment_variables: {},
                secrets: [],
                artifacts: { inputs: ['node_modules'], outputs: ['dependency_scan_report'] }
              },
              {
                id: 'code_scan',
                type: 'security_scan',
                configuration: { scanner: 'semgrep', ruleset: 'p/security-audit' },
                environment_variables: {},
                secrets: [],
                artifacts: { inputs: ['source_code'], outputs: ['code_scan_report'] }
              }
            ],
            success_criteria: { exit_code: 0, security_threshold: 'no_critical' }
          },
          {
            id: 'build_services',
            name: 'Build All Services',
            type: 'build',
            dependencies: ['parallel_validation', 'security_scans'],
            timeout_minutes: 30,
            retry_attempts: 2,
            parallel_execution: true,
            conditions: [],
            actions: [
              {
                id: 'build_api_gateway',
                type: 'docker_build',
                configuration: {
                  dockerfile: 'api-gateway/Dockerfile',
                  image_name: 'fanz/api-gateway',
                  build_args: { NODE_ENV: 'production' }
                },
                environment_variables: {},
                secrets: ['DOCKER_REGISTRY_TOKEN'],
                artifacts: { inputs: ['source_code'], outputs: ['api_gateway_image'] }
              },
              {
                id: 'build_finance_service',
                type: 'docker_build',
                configuration: {
                  dockerfile: 'finance/Dockerfile',
                  image_name: 'fanz/finance-service',
                  build_args: { NODE_ENV: 'production' }
                },
                environment_variables: {},
                secrets: ['DOCKER_REGISTRY_TOKEN'],
                artifacts: { inputs: ['source_code'], outputs: ['finance_service_image'] }
              }
            ],
            success_criteria: { exit_code: 0, artifacts_present: ['api_gateway_image', 'finance_service_image'] }
          },
          {
            id: 'integration_tests',
            name: 'Integration Testing',
            type: 'test',
            dependencies: ['build_services'],
            timeout_minutes: 45,
            retry_attempts: 2,
            parallel_execution: false,
            conditions: [],
            actions: [{
              id: 'run_integration_tests',
              type: 'test_run',
              configuration: {
                command: 'pnpm run test:integration',
                test_environment: 'staging_isolated',
                services_required: ['api_gateway', 'finance_service']
              },
              environment_variables: { NODE_ENV: 'test' },
              secrets: ['TEST_DB_CONNECTION', 'TEST_API_KEYS'],
              artifacts: { inputs: ['api_gateway_image', 'finance_service_image'], outputs: ['integration_test_results'] }
            }],
            success_criteria: { exit_code: 0, test_pass_rate: 95 }
          },
          {
            id: 'deploy_staging',
            name: 'Deploy to Staging',
            type: 'deploy',
            dependencies: ['integration_tests'],
            timeout_minutes: 20,
            retry_attempts: 1,
            parallel_execution: false,
            conditions: [{ type: 'branch', value: 'main' }],
            actions: [{
              id: 'k8s_deploy_staging',
              type: 'kubernetes_deploy',
              configuration: {
                namespace: 'fanz-staging',
                deployment_strategy: 'rolling',
                health_check_timeout: 600
              },
              environment_variables: { ENVIRONMENT: 'staging' },
              secrets: ['K8S_STAGING_TOKEN', 'STAGING_SECRETS'],
              artifacts: { inputs: ['api_gateway_image', 'finance_service_image'], outputs: ['staging_deployment'] }
            }],
            success_criteria: { exit_code: 0, health_check_passed: true }
          }
        ],
        environment_promotions: [
          {
            from_environment: 'staging',
            to_environment: 'production',
            approval_required: true,
            approvers: ['tech_lead', 'platform_owner'],
            automatic_conditions: [
              { type: 'staging_uptime', threshold: '99.9%', duration_hours: 24 },
              { type: 'error_rate', threshold: '< 0.1%', duration_hours: 12 }
            ],
            rollback_enabled: true,
            max_rollback_hours: 2
          }
        ],
        feature_flags: [],
        rollout_strategy: {
          type: 'canary',
          configuration: {
            canary_percentage: 10,
            canary_duration_minutes: 30,
            success_threshold: 99.5,
            rollback_threshold: 95.0,
            monitoring_metrics: ['error_rate', 'response_time', 'cpu_usage']
          }
        },
        notifications: [
          {
            type: 'slack',
            webhook_url: 'https://hooks.slack.com/services/...',
            channels: ['#deployments', '#alerts'],
            events: ['pipeline_started', 'pipeline_failed', 'deployment_completed']
          },
          {
            type: 'email',
            recipients: ['team@fanz.com'],
            events: ['pipeline_failed', 'production_deployed']
          }
        ]
      }
    ];

    for (const pipeline of pipelines) {
      this.pipelines.set(pipeline.id, pipeline);
    }

    console.log(`🔧 Setup ${pipelines.length} CI/CD pipelines`);
  }

  private async initializeFeatureFlags(): Promise<void> {
    const flags: FeatureFlag[] = [
      {
        id: 'new_payment_gateway',
        name: 'New Payment Gateway Integration',
        description: 'Enable new payment gateway for select users',
        enabled: true,
        environments: ['staging', 'production'],
        rollout_percentage: 25,
        target_users: ['beta_users'],
        conditions: { user_tier: 'premium' },
        created_by: 'platform_team',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        id: 'enhanced_security_monitoring',
        name: 'Enhanced Security Monitoring',
        description: 'Advanced threat detection and monitoring',
        enabled: false,
        environments: ['staging'],
        rollout_percentage: 0,
        target_users: [],
        conditions: {},
        created_by: 'security_team'
      },
      {
        id: 'ai_content_recommendations',
        name: 'AI Content Recommendations',
        description: 'AI-powered content recommendation engine',
        enabled: true,
        environments: ['staging', 'production'],
        rollout_percentage: 50,
        target_users: [],
        conditions: { region: ['US', 'CA', 'EU'] },
        created_by: 'ml_team'
      }
    ];

    for (const flag of flags) {
      this.featureFlags.set(flag.id, flag);
    }

    console.log(`🚩 Initialized ${flags.length} feature flags`);
  }

  private async startPipelineMonitoring(): Promise<void> {
    // Monitor pipeline runs and deployments
    setInterval(async () => {
      await this.monitorActivePipelines();
      await this.monitorDeploymentHealth();
    }, 30000); // Every 30 seconds

    console.log('📊 Pipeline monitoring started');
  }

  public async triggerPipeline(pipelineId: string, trigger: {
    type: string;
    source: string;
    commit_sha: string;
    author: string;
    branch?: string;
  }): Promise<{ success: boolean; run_id?: string; error?: string }> {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline) {
        return { success: false, error: 'Pipeline not found' };
      }

      const runId = `run_${pipelineId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const pipelineRun: PipelineRun = {
        id: runId,
        pipeline_id: pipelineId,
        trigger_event: {
          type: trigger.type,
          source: trigger.source,
          commit_sha: trigger.commit_sha,
          author: trigger.author,
          timestamp: new Date()
        },
        status: 'queued',
        current_stage: pipeline.stages[0].id,
        stages_status: {},
        artifacts: [],
        logs: []
      };

      // Initialize stage statuses
      for (const stage of pipeline.stages) {
        pipelineRun.stages_status[stage.id] = {
          status: 'pending',
          artifacts_generated: []
        };
      }

      this.pipelineRuns.set(runId, pipelineRun);

      // Start pipeline execution
      setTimeout(() => {
        this.executePipeline(runId);
      }, 1000);

      this.emit('pipeline:triggered', {
        run_id: runId,
        pipeline: pipeline.name,
        trigger: trigger.type,
        author: trigger.author
      });

      return { success: true, run_id: runId };

    } catch (error) {
      console.error('❌ Failed to trigger pipeline:', error);
      return { success: false, error: 'Pipeline trigger failed' };
    }
  }

  private async executePipeline(runId: string): Promise<void> {
    const run = this.pipelineRuns.get(runId);
    if (!run) return;

    const pipeline = this.pipelines.get(run.pipeline_id);
    if (!pipeline) return;

    console.log(`🚀 Starting pipeline execution: ${runId}`);

    run.status = 'running';
    run.started_at = new Date();

    this.emit('pipeline:started', run);

    try {
      // Execute stages in dependency order
      for (const stage of pipeline.stages) {
        // Check if dependencies are satisfied
        const dependenciesMet = stage.dependencies.every(depId => {
          const depStatus = run.stages_status[depId];
          return depStatus && depStatus.status === 'success';
        });

        if (!dependenciesMet && stage.dependencies.length > 0) {
          run.stages_status[stage.id].status = 'skipped';
          continue;
        }

        // Execute stage
        const stageResult = await this.executeStage(run, stage);
        
        if (!stageResult.success) {
          run.status = 'failed';
          run.completed_at = new Date();
          run.duration_seconds = Math.floor((run.completed_at.getTime() - run.started_at!.getTime()) / 1000);
          
          this.emit('pipeline:failed', { run, stage: stage.id, error: stageResult.error });
          return;
        }
      }

      // Pipeline completed successfully
      run.status = 'success';
      run.completed_at = new Date();
      run.duration_seconds = Math.floor((run.completed_at.getTime() - run.started_at!.getTime()) / 1000);

      this.emit('pipeline:completed', run);

      // Check for automatic promotions
      await this.checkAutomaticPromotions(pipeline, run);

    } catch (error) {
      run.status = 'failed';
      run.completed_at = new Date();
      if (run.started_at) {
        run.duration_seconds = Math.floor((run.completed_at.getTime() - run.started_at.getTime()) / 1000);
      }
      
      console.error(`❌ Pipeline ${runId} failed:`, error);
      this.emit('pipeline:failed', { run, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async executeStage(run: PipelineRun, stage: PipelineStage): Promise<{ success: boolean; error?: string }> {
    const stageStatus = run.stages_status[stage.id];
    stageStatus.status = 'running';
    stageStatus.started_at = new Date();

    console.log(`📋 Executing stage: ${stage.name} (${stage.id})`);

    this.emit('stage:started', { run_id: run.id, stage: stage.name });

    try {
      // Check stage conditions
      for (const condition of stage.conditions) {
        if (!this.evaluateCondition(condition, run)) {
          stageStatus.status = 'skipped';
          return { success: true };
        }
      }

      // Execute actions (parallel or sequential based on configuration)
      if (stage.parallel_execution && stage.actions.length > 1) {
        const actionPromises = stage.actions.map(action => this.executeAction(action, run));
        const results = await Promise.all(actionPromises);
        
        const failed = results.find(result => !result.success);
        if (failed) {
          stageStatus.status = 'failed';
          stageStatus.error_message = failed.error;
          return { success: false, error: failed.error };
        }
      } else {
        for (const action of stage.actions) {
          const result = await this.executeAction(action, run);
          if (!result.success) {
            stageStatus.status = 'failed';
            stageStatus.error_message = result.error;
            return { success: false, error: result.error };
          }
        }
      }

      stageStatus.status = 'success';
      stageStatus.completed_at = new Date();
      stageStatus.duration_seconds = Math.floor((stageStatus.completed_at.getTime() - stageStatus.started_at!.getTime()) / 1000);

      this.emit('stage:completed', { run_id: run.id, stage: stage.name, duration: stageStatus.duration_seconds });

      return { success: true };

    } catch (error) {
      stageStatus.status = 'failed';
      stageStatus.completed_at = new Date();
      stageStatus.error_message = error instanceof Error ? error.message : 'Unknown error';
      if (stageStatus.started_at) {
        stageStatus.duration_seconds = Math.floor((stageStatus.completed_at.getTime() - stageStatus.started_at.getTime()) / 1000);
      }

      return { success: false, error: stageStatus.error_message };
    }
  }

  private async executeAction(action: PipelineAction, run: PipelineRun): Promise<{ success: boolean; error?: string }> {
    console.log(`⚡ Executing action: ${action.id} (${action.type})`);

    try {
      // Simulate action execution based on type
      switch (action.type) {
        case 'command':
          return await this.executeCommand(action);
        case 'docker_build':
          return await this.executeDockerBuild(action);
        case 'kubernetes_deploy':
          return await this.executeKubernetesDeploy(action);
        case 'test_run':
          return await this.executeTests(action);
        case 'security_scan':
          return await this.executeSecurityScan(action);
        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Action execution failed' };
    }
  }

  private async executeCommand(action: PipelineAction): Promise<{ success: boolean; error?: string }> {
    // Simulate command execution
    const executionTime = 1000 + Math.random() * 5000; // 1-6 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // 95% success rate
    if (Math.random() < 0.95) {
      return { success: true };
    } else {
      return { success: false, error: `Command failed: ${action.configuration.command}` };
    }
  }

  private async executeDockerBuild(action: PipelineAction): Promise<{ success: boolean; error?: string }> {
    // Simulate Docker build
    const buildTime = 10000 + Math.random() * 30000; // 10-40 seconds
    await new Promise(resolve => setTimeout(resolve, buildTime));
    
    if (Math.random() < 0.90) {
      console.log(`🐳 Built Docker image: ${action.configuration.image_name}`);
      return { success: true };
    } else {
      return { success: false, error: 'Docker build failed' };
    }
  }

  private async executeKubernetesDeploy(action: PipelineAction): Promise<{ success: boolean; error?: string }> {
    // Simulate Kubernetes deployment
    const deployTime = 15000 + Math.random() * 45000; // 15-60 seconds
    await new Promise(resolve => setTimeout(resolve, deployTime));
    
    if (Math.random() < 0.92) {
      console.log(`☸️ Deployed to Kubernetes: ${action.configuration.namespace}`);
      return { success: true };
    } else {
      return { success: false, error: 'Kubernetes deployment failed' };
    }
  }

  private async executeTests(action: PipelineAction): Promise<{ success: boolean; error?: string }> {
    // Simulate test execution
    const testTime = 5000 + Math.random() * 20000; // 5-25 seconds
    await new Promise(resolve => setTimeout(resolve, testTime));
    
    if (Math.random() < 0.88) {
      console.log(`✅ Tests passed: ${action.configuration.command}`);
      return { success: true };
    } else {
      return { success: false, error: 'Tests failed' };
    }
  }

  private async executeSecurityScan(action: PipelineAction): Promise<{ success: boolean; error?: string }> {
    // Simulate security scan
    const scanTime = 8000 + Math.random() * 15000; // 8-23 seconds
    await new Promise(resolve => setTimeout(resolve, scanTime));
    
    if (Math.random() < 0.85) {
      console.log(`🔒 Security scan passed: ${action.configuration.scanner}`);
      return { success: true };
    } else {
      return { success: false, error: 'Security vulnerabilities found' };
    }
  }

  private evaluateCondition(condition: StageCondition, run: PipelineRun): boolean {
    // Mock condition evaluation
    return true;
  }

  private async checkAutomaticPromotions(pipeline: Pipeline, run: PipelineRun): Promise<void> {
    // Check if any environment promotions can be automatically triggered
    for (const promotion of pipeline.environment_promotions) {
      if (!promotion.approval_required) {
        console.log(`🔄 Auto-promoting from ${promotion.from_environment} to ${promotion.to_environment}`);
        // Trigger promotion logic here
      }
    }
  }

  private async monitorActivePipelines(): Promise<void> {
    const activePipelines = Array.from(this.pipelineRuns.values())
      .filter(run => run.status === 'running' || run.status === 'queued');

    for (const run of activePipelines) {
      // Check for timeouts, health issues, etc.
      if (run.started_at) {
        const runningTime = Date.now() - run.started_at.getTime();
        const maxRunTime = 120 * 60 * 1000; // 2 hours
        
        if (runningTime > maxRunTime) {
          run.status = 'failed';
          run.completed_at = new Date();
          console.log(`⏰ Pipeline ${run.id} timed out`);
          this.emit('pipeline:timeout', run);
        }
      }
    }
  }

  private async monitorDeploymentHealth(): Promise<void> {
    // Monitor health of active deployments
    for (const [deploymentId, deployment] of this.activeDeployments.entries()) {
      // Check deployment health metrics
      // This would integrate with Kubernetes API and monitoring systems
    }
  }

  public async enableFeatureFlag(flagId: string, environments: string[] = [], percentage: number = 100): Promise<{ success: boolean; error?: string }> {
    const flag = this.featureFlags.get(flagId);
    if (!flag) {
      return { success: false, error: 'Feature flag not found' };
    }

    flag.enabled = true;
    if (environments.length > 0) {
      flag.environments = environments;
    }
    flag.rollout_percentage = Math.min(100, Math.max(0, percentage));

    console.log(`🚩 Enabled feature flag: ${flag.name} (${percentage}% rollout)`);
    this.emit('feature_flag:enabled', flag);

    return { success: true };
  }

  public async disableFeatureFlag(flagId: string): Promise<{ success: boolean; error?: string }> {
    const flag = this.featureFlags.get(flagId);
    if (!flag) {
      return { success: false, error: 'Feature flag not found' };
    }

    flag.enabled = false;
    flag.rollout_percentage = 0;

    console.log(`🚫 Disabled feature flag: ${flag.name}`);
    this.emit('feature_flag:disabled', flag);

    return { success: true };
  }

  public getPipelineStatus(): {
    pipelines: { [key: string]: any };
    active_runs: number;
    success_rate_24h: number;
    avg_pipeline_duration: number;
    feature_flags: { [key: string]: any };
  } {
    const pipelineStats: { [key: string]: any } = {};
    
    for (const [id, pipeline] of this.pipelines.entries()) {
      const runs = Array.from(this.pipelineRuns.values())
        .filter(run => run.pipeline_id === id);

      const recent = runs.filter(run => 
        run.completed_at && run.completed_at > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      pipelineStats[id] = {
        name: pipeline.name,
        total_runs: runs.length,
        recent_runs: recent.length,
        success_rate: recent.length > 0 ? recent.filter(r => r.status === 'success').length / recent.length : 0,
        avg_duration: recent.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / Math.max(recent.length, 1)
      };
    }

    const activeRuns = Array.from(this.pipelineRuns.values())
      .filter(run => run.status === 'running' || run.status === 'queued').length;

    const allRecent = Array.from(this.pipelineRuns.values())
      .filter(run => run.completed_at && run.completed_at > new Date(Date.now() - 24 * 60 * 60 * 1000));

    const overallSuccessRate = allRecent.length > 0 ? 
      allRecent.filter(r => r.status === 'success').length / allRecent.length : 0;

    const avgDuration = allRecent.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / Math.max(allRecent.length, 1);

    const flagStats: { [key: string]: any } = {};
    for (const [id, flag] of this.featureFlags.entries()) {
      flagStats[id] = {
        name: flag.name,
        enabled: flag.enabled,
        rollout_percentage: flag.rollout_percentage,
        environments: flag.environments
      };
    }

    return {
      pipelines: pipelineStats,
      active_runs: activeRuns,
      success_rate_24h: Number(overallSuccessRate.toFixed(3)),
      avg_pipeline_duration: Math.round(avgDuration),
      feature_flags: flagStats
    };
  }
}

// Types for better TypeScript support
interface StageCondition {
  type: string;
  value: any;
}

interface SuccessCriteria {
  exit_code?: number;
  coverage_threshold?: number;
  test_pass_rate?: number;
  artifacts_present?: string[];
  health_check_passed?: boolean;
  security_threshold?: string;
}

interface AutoPromotionCondition {
  type: string;
  threshold: string;
  duration_hours: number;
}

interface NotificationConfig {
  type: 'slack' | 'email' | 'webhook';
  webhook_url?: string;
  channels?: string[];
  recipients?: string[];
  events: string[];
}

interface PipelineLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  stage_id?: string;
  action_id?: string;
}

export const cicdPipeline = new CICDPipeline();
export default cicdPipeline;
import * as yaml from 'js-yaml';
import { z } from 'zod';

// VibeSpec schema validation
const VibeSpecSchema = z.object({
  app: z.object({
    name: z.string(),
    stack: z.enum(['nextjs-node', 'fastapi-python']).default('nextjs-node'),
    auth: z.enum(['oidc', 'none']).default('oidc'),
    database: z.enum(['postgres', 'none']).default('postgres'),
    storage: z.enum(['s3', 'none']).default('s3'),
  }),
  features: z.array(z.any()).default([]),
  ui: z.object({
    pages: z.array(z.object({
      path: z.string(),
      components: z.array(z.string()),
    })).default([]),
  }).default({ pages: [] }),
  ops: z.object({
    deploy: z.enum(['preview', 'prod']).default('preview'),
    domain: z.string().optional(),
  }).default({ deploy: 'preview' }),
  observability: z.object({
    errors: z.boolean().default(true),
    traces: z.boolean().default(true),
    logs: z.boolean().default(true),
  }).default({ errors: true, traces: true, logs: true }),
  security: z.object({
    cors: z.array(z.string()).default(['*.fanz.app']),
    rate_limit: z.string().default('120r/m'),
  }).default({ cors: ['*.fanz.app'], rate_limit: '120r/m' }),
});

export type VibeSpec = z.infer<typeof VibeSpecSchema>;

// Feature parsers for specific FANZ blocks
const FeatureSchemas = {
  membership: z.object({
    tiers: z.array(z.string()).default(['Free', 'Bronze', 'Silver', 'Gold']),
    gating: z.enum(['per-page', 'component']).default('component'),
  }),
  dm: z.object({
    ppv_messages: z.boolean().default(true),
    tip_to_unlock: z.boolean().default(true),
    receipts: z.boolean().default(true),
  }),
  media: z.object({
    upload_policy: z.enum(['2257_ready', 'basic']).default('2257_ready'),
    cosign_required: z.boolean().default(true),
    watermark: z.string().optional(),
  }),
  payments: z.object({
    providers: z.array(z.enum(['ccbill', 'nmi', 'stripe'])).default(['stripe']),
    currency: z.string().default('USD'),
  }),
  analytics: z.object({
    dashboard: z.enum(['basic', 'advanced']).default('basic'),
  }),
  coupons: z.object({
    timebomb_links: z.boolean().default(false),
    max_claims: z.number().default(1),
    expires_in: z.string().default('24h'),
  }),
};

class VibeSpecParser {
  /**
   * Parse YAML VibeSpec into validated structure
   */
  parse(yamlContent: string): VibeSpec {
    try {
      // Parse YAML
      const rawSpec = yaml.load(yamlContent) as any;
      
      if (!rawSpec || typeof rawSpec !== 'object') {
        throw new Error('Invalid YAML format');
      }

      // Validate and transform the spec
      const validatedSpec = VibeSpecSchema.parse(rawSpec);
      
      // Process features
      validatedSpec.features = this.parseFeatures(rawSpec.features || []);
      
      return validatedSpec;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`VibeSpec validation error: ${errorMessages}`);
      }
      
      throw new Error(`Failed to parse VibeSpec: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate default VibeSpec for Creator Paywall + DM template
   */
  generateCreatorTemplate(): VibeSpec {
    return {
      app: {
        name: 'creator-paywall-dm',
        stack: 'nextjs-node',
        auth: 'oidc',
        database: 'postgres',
        storage: 's3',
      },
      features: [
        {
          type: 'membership',
          config: { tiers: ['Free', 'Bronze', 'Silver', 'Gold'], gating: 'component' }
        },
        {
          type: 'dm',
          config: { ppv_messages: true, tip_to_unlock: true, receipts: true }
        },
        {
          type: 'media',
          config: { upload_policy: '2257_ready', cosign_required: true, watermark: 'FANZ' }
        },
        {
          type: 'payments',
          config: { providers: ['ccbill', 'nmi', 'stripe'], currency: 'USD' }
        },
        {
          type: 'analytics',
          config: { dashboard: 'basic' }
        },
        {
          type: 'coupons',
          config: { timebomb_links: true, max_claims: 1, expires_in: '24h' }
        }
      ],
      ui: {
        pages: [
          { path: '/', components: ['hero', 'feed.cards(gated)', 'subscribe.drawer'] },
          { path: '/inbox', components: ['auth.required', 'dm.threadlist', 'dm.composer(ppv=true,tips=true)'] },
          { path: '/admin', components: ['auth.required', 'table(Member)', 'table(Transactions)', 'table(Media)', 'settings(2257)'] }
        ]
      },
      ops: {
        deploy: 'prod',
        domain: 'paywall.fanz.app'
      },
      observability: { errors: true, traces: true, logs: true },
      security: {
        cors: ['*.fanz.app'],
        rate_limit: '120r/m'
      }
    };
  }

  /**
   * Generate CRUD Admin template
   */
  generateAdminTemplate(): VibeSpec {
    return {
      app: {
        name: 'crud-admin-panel',
        stack: 'fastapi-python',
        auth: 'oidc',
        database: 'postgres',
        storage: 's3',
      },
      features: [
        {
          type: 'analytics',
          config: { dashboard: 'advanced' }
        },
        {
          type: 'media',
          config: { upload_policy: '2257_ready', cosign_required: true }
        }
      ],
      ui: {
        pages: [
          { path: '/', components: ['auth.required', 'dashboard', 'metrics'] },
          { path: '/users', components: ['auth.required', 'table(User)', 'crud.actions'] },
          { path: '/content', components: ['auth.required', 'table(Content)', 'moderation.tools'] },
          { path: '/compliance', components: ['auth.required', 'table(2257Records)', 'audit.logs'] }
        ]
      },
      ops: {
        deploy: 'prod'
      },
      observability: { errors: true, traces: true, logs: true },
      security: {
        cors: ['*.fanz.app'],
        rate_limit: '200r/m'
      }
    };
  }

  /**
   * Convert VibeSpec back to YAML
   */
  toYaml(spec: VibeSpec): string {
    return yaml.dump(spec, {
      indent: 2,
      lineWidth: 100,
      noRefs: true,
    });
  }

  /**
   * Validate if a VibeSpec is 2257 compliant
   */
  validate2257Compliance(spec: VibeSpec): { isCompliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for media upload features
    const mediaFeature = spec.features.find(f => f.type === 'media');
    if (mediaFeature) {
      if (mediaFeature.config?.upload_policy !== '2257_ready') {
        issues.push('Media upload must use 2257_ready policy');
      }
      if (!mediaFeature.config?.cosign_required) {
        issues.push('Co-signer requirements must be enabled for media uploads');
      }
    }

    // Check for age verification in pages
    const hasAgeVerification = spec.ui.pages.some(page => 
      page.components.some(comp => comp.includes('age-verify') || comp.includes('2257'))
    );
    
    if (!hasAgeVerification) {
      issues.push('Age verification component must be included');
    }

    // Check for audit logging
    if (!spec.observability.logs) {
      issues.push('Audit logging must be enabled for compliance');
    }

    return {
      isCompliant: issues.length === 0,
      issues
    };
  }

  /**
   * Parse and validate feature configurations
   */
  private parseFeatures(features: any[]): any[] {
    return features.map(feature => {
      if (typeof feature === 'object' && feature.type) {
        const featureType = feature.type as keyof typeof FeatureSchemas;
        const schema = FeatureSchemas[featureType];
        
        if (schema) {
          try {
            const validatedConfig = schema.parse(feature.config || {});
            return {
              type: featureType,
              config: validatedConfig
            };
          } catch (error) {
            console.warn(`Invalid config for feature ${featureType}:`, error);
            return {
              type: featureType,
              config: schema.parse({}) // Use defaults
            };
          }
        }
      }
      
      return feature;
    });
  }

  /**
   * Generate template suggestions based on prompt
   */
  generateFromPrompt(prompt: string): VibeSpec {
    const lowerPrompt = prompt.toLowerCase();
    
    // Creator-focused keywords
    if (lowerPrompt.includes('creator') || lowerPrompt.includes('paywall') || lowerPrompt.includes('dm')) {
      return this.generateCreatorTemplate();
    }
    
    // Admin-focused keywords
    if (lowerPrompt.includes('admin') || lowerPrompt.includes('crud') || lowerPrompt.includes('management')) {
      return this.generateAdminTemplate();
    }
    
    // Default to creator template
    return this.generateCreatorTemplate();
  }
}

export const vibeSpecParser = new VibeSpecParser();

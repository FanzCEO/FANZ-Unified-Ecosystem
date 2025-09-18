import { Request, Response, NextFunction } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import { generateNonce } from '../utils/security.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { securityEvents } from '../events/securityEvents.js';

/**
 * Security Headers Middleware
 * 
 * Provides comprehensive HTTP security headers using Helmet with:
 * - Strict Content Security Policy with nonce support
 * - HSTS with preload support
 * - X-Frame-Options, X-Content-Type-Options, etc.
 * - Custom security headers for FANZ ecosystem
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface SecurityHeadersConfig {
  // CSP Configuration
  csp: {
    enabled: boolean;
    useNonces: boolean;
    directives: Record<string, string[]>;
    reportUri?: string;
    reportOnly: boolean;
    upgradeInsecureRequests: boolean;
  };
  
  // HSTS Configuration
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // Frame Options
  frameOptions: {
    enabled: boolean;
    action: 'DENY' | 'SAMEORIGIN' | string;
  };
  
  // Content Type Options
  contentTypeOptions: {
    enabled: boolean;
    noSniff: boolean;
  };
  
  // Referrer Policy
  referrerPolicy: {
    enabled: boolean;
    policy: string | string[];
  };
  
  // Permissions Policy
  permissionsPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  
  // Additional Headers
  additionalHeaders: Record<string, string>;
  
  // Environment-specific overrides
  development?: Partial<SecurityHeadersConfig>;
  production?: Partial<SecurityHeadersConfig>;
}

export interface RequestWithNonce extends Request {
  nonce: string;
  cspNonce: string;
}

// =============================================================================
// DEFAULT SECURITY CONFIGURATION
// =============================================================================

const defaultSecurityHeaders: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    useNonces: true,
    reportOnly: config.NODE_ENV === 'development',
    upgradeInsecureRequests: config.NODE_ENV === 'production',
    directives: {
      'default-src': ["'none'"],
      'base-uri': ["'none'"],
      'frame-ancestors': ["'none'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'connect-src': ["'self'", 'api.fanz.*', 'wss:', 'https:'],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'worker-src': ["'none'"],
      'manifest-src': ["'self'"],
      'form-action': ["'self'"]
    },
    reportUri: '/api/security/csp-report'
  },
  
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  frameOptions: {
    enabled: true,
    action: 'DENY'
  },
  
  contentTypeOptions: {
    enabled: true,
    noSniff: true
  },
  
  referrerPolicy: {
    enabled: true,
    policy: 'no-referrer'
  },
  
  permissionsPolicy: {
    enabled: true,
    directives: {
      'accelerometer': [],
      'ambient-light-sensor': [],
      'autoplay': [],
      'battery': [],
      'camera': [],
      'cross-origin-isolated': [],
      'display-capture': [],
      'document-domain': [],
      'encrypted-media': [],
      'execution-while-not-rendered': [],
      'execution-while-out-of-viewport': [],
      'fullscreen': ['self'],
      'geolocation': [],
      'gyroscope': [],
      'keyboard-map': [],
      'magnetometer': [],
      'microphone': [],
      'midi': [],
      'navigation-override': [],
      'payment': ['self'],
      'picture-in-picture': [],
      'publickey-credentials-get': [],
      'screen-wake-lock': [],
      'sync-xhr': [],
      'usb': [],
      'web-share': [],
      'xr-spatial-tracking': []
    }
  },
  
  additionalHeaders: {
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-XSS-Protection': '0', // Disabled as recommended by OWASP
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Development overrides
  development: {
    csp: {
      reportOnly: true,
      directives: {
        'script-src': ["'self'", "'unsafe-eval'"], // Allow for dev tools
        'connect-src': ["'self'", 'localhost:*', 'ws://localhost:*', 'wss://localhost:*']
      }
    },
    additionalHeaders: {
      'Cache-Control': 'no-cache'
    }
  },
  
  // Production overrides
  production: {
    csp: {
      reportOnly: false,
      upgradeInsecureRequests: true
    },
    hsts: {
      preload: true
    }
  }
};

// =============================================================================
// SECURITY HEADERS CLASS
// =============================================================================

export class SecurityHeaders {
  private config: SecurityHeadersConfig;
  
  constructor(userConfig: Partial<SecurityHeadersConfig> = {}) {
    // Merge default config with user config and environment overrides
    this.config = this.mergeConfig(defaultSecurityHeaders, userConfig);
  }
  
  private mergeConfig(
    defaultConfig: SecurityHeadersConfig,
    userConfig: Partial<SecurityHeadersConfig>
  ): SecurityHeadersConfig {
    const envOverrides = config.NODE_ENV === 'production' 
      ? defaultConfig.production || {}
      : defaultConfig.development || {};
    
    // Deep merge configuration
    return {
      ...defaultConfig,
      ...userConfig,
      ...envOverrides,
      csp: {
        ...defaultConfig.csp,
        ...userConfig.csp,
        ...envOverrides.csp,
        directives: {
          ...defaultConfig.csp.directives,
          ...userConfig.csp?.directives,
          ...envOverrides.csp?.directives
        }
      },
      additionalHeaders: {
        ...defaultConfig.additionalHeaders,
        ...userConfig.additionalHeaders,
        ...envOverrides.additionalHeaders
      }
    };
  }
  
  /**
   * Generate CSP nonce and add to request
   */
  private generateCSPNonce(req: Request & Partial<RequestWithNonce>): string {
    if (!req.nonce) {
      req.nonce = generateNonce(32);
      req.cspNonce = req.nonce;
    }
    return req.nonce;
  }
  
  /**
   * Build Content Security Policy directives
   */
  private buildCSPDirectives(req: Request & Partial<RequestWithNonce>): Record<string, string[]> {
    const directives = { ...this.config.csp.directives };
    
    if (this.config.csp.useNonces) {
      const nonce = this.generateCSPNonce(req);
      
      // Add nonce to script-src
      if (directives['script-src']) {
        directives['script-src'] = [...directives['script-src'], `'nonce-${nonce}'`];
      }
      
      // Add nonce to style-src if needed
      if (directives['style-src']) {
        directives['style-src'] = [...directives['style-src'], `'nonce-${nonce}'`];
      }
    }
    
    // Add upgrade-insecure-requests if enabled
    if (this.config.csp.upgradeInsecureRequests) {
      directives['upgrade-insecure-requests'] = [];
    }
    
    return directives;
  }
  
  /**
   * Build Permissions Policy header value
   */
  private buildPermissionsPolicy(): string {
    if (!this.config.permissionsPolicy.enabled) {
      return '';
    }
    
    const policies = Object.entries(this.config.permissionsPolicy.directives)
      .map(([directive, allowlist]) => {
        if (allowlist.length === 0) {
          return `${directive}=()`;
        }
        const origins = allowlist.map(origin => 
          origin === 'self' ? 'self' : `"${origin}"`
        ).join(' ');
        return `${directive}=(${origins})`;
      });
    
    return policies.join(', ');
  }
  
  /**
   * Create Helmet configuration
   */
  private createHelmetConfig(req: Request & Partial<RequestWithNonce>): HelmetOptions {
    const cspDirectives = this.buildCSPDirectives(req);
    const permissionsPolicy = this.buildPermissionsPolicy();
    
    const helmetConfig: HelmetOptions = {
      // Content Security Policy
      contentSecurityPolicy: this.config.csp.enabled ? {
        directives: cspDirectives,
        reportOnly: this.config.csp.reportOnly,
        ...(this.config.csp.reportUri && {
          reportUri: this.config.csp.reportUri
        })
      } : false,
      
      // HTTP Strict Transport Security
      hsts: this.config.hsts.enabled ? {
        maxAge: this.config.hsts.maxAge,
        includeSubDomains: this.config.hsts.includeSubDomains,
        preload: this.config.hsts.preload
      } : false,
      
      // X-Frame-Options
      frameguard: this.config.frameOptions.enabled ? {
        action: this.config.frameOptions.action as any
      } : false,
      
      // X-Content-Type-Options
      noSniff: this.config.contentTypeOptions.enabled,
      
      // Referrer Policy
      referrerPolicy: this.config.referrerPolicy.enabled ? {
        policy: this.config.referrerPolicy.policy as any
      } : false,
      
      // Permissions Policy
      ...(this.config.permissionsPolicy.enabled && permissionsPolicy && {
        permissionsPolicy: {
          features: this.config.permissionsPolicy.directives
        }
      }),
      
      // Disable unwanted headers
      xssFilter: false, // We handle this via CSP
      ieNoOpen: false, // Covered by X-Download-Options
      dnsPrefetchControl: false, // We set this manually
      hidePoweredBy: true
    };
    
    return helmetConfig;
  }
  
  /**
   * Add custom headers
   */
  private addCustomHeaders(res: Response): void {
    Object.entries(this.config.additionalHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
  }
  
  /**
   * Handle CSP violation reports
   */
  static createCSPReportHandler() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const report = req.body;
        
        // Log CSP violation
        logger.warn('CSP violation reported', {
          report,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        });
        
        // Emit security event
        await securityEvents.emit({
          type: 'csp_violation',
          severity: 'medium',
          source: 'security-headers',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            violation: report,
            url: req.url
          }
        });
        
        res.status(204).end();
      } catch (error) {
        logger.error('Error handling CSP report', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
  
  /**
   * Create security headers middleware
   */
  middleware() {
    return (req: Request & Partial<RequestWithNonce>, res: Response, next: NextFunction) => {
      try {
        // Generate nonce if CSP is enabled
        if (this.config.csp.enabled && this.config.csp.useNonces) {
          this.generateCSPNonce(req);
        }
        
        // Create Helmet configuration for this request
        const helmetConfig = this.createHelmetConfig(req);
        
        // Apply Helmet middleware
        const helmetMiddleware = helmet(helmetConfig);
        helmetMiddleware(req, res, (err) => {
          if (err) {
            logger.error('Helmet middleware error', { error: err.message });
            return next(err);
          }
          
          // Add custom headers
          this.addCustomHeaders(res);
          
          // Add FANZ-specific headers
          res.setHeader('X-Security-Framework', 'FANZ-Secure');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          
          // Cache control for sensitive endpoints
          const sensitiveEndpoints = ['/api/auth', '/api/payments', '/api/admin'];
          if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
          }
          
          next();
        });
      } catch (error) {
        logger.error('Security headers middleware error', { error: error.message });
        next(error);
      }
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create security headers middleware with default configuration
 */
export function createSecurityHeaders(config: Partial<SecurityHeadersConfig> = {}) {
  const securityHeaders = new SecurityHeaders(config);
  return securityHeaders.middleware();
}

/**
 * Create strict security headers for financial/admin routes
 */
export function createStrictSecurityHeaders(config: Partial<SecurityHeadersConfig> = {}) {
  const strictConfig: Partial<SecurityHeadersConfig> = {
    csp: {
      enabled: true,
      useNonces: true,
      reportOnly: false,
      directives: {
        'default-src': ["'none'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'connect-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"]
      }
    },
    frameOptions: {
      enabled: true,
      action: 'DENY'
    },
    additionalHeaders: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet'
    },
    ...config
  };
  
  return createSecurityHeaders(strictConfig);
}

/**
 * Create permissive security headers for development
 */
export function createDevelopmentHeaders(config: Partial<SecurityHeadersConfig> = {}) {
  const devConfig: Partial<SecurityHeadersConfig> = {
    csp: {
      enabled: true,
      useNonces: false,
      reportOnly: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'", 'localhost:*', 'ws:', 'wss:']
      }
    },
    hsts: {
      enabled: false
    },
    additionalHeaders: {
      'Cache-Control': 'no-cache'
    },
    ...config
  };
  
  return createSecurityHeaders(devConfig);
}

/**
 * Nonce helper for templates
 */
export function getNonce(req: Request): string {
  return (req as any).nonce || '';
}

/**
 * CSP nonce helper for inline scripts/styles
 */
export function nonceScript(nonce: string, content: string): string {
  return `<script nonce="${nonce}">${content}</script>`;
}

export function nonceStyle(nonce: string, content: string): string {
  return `<style nonce="${nonce}">${content}</style>`;
}

export { SecurityHeaders as default };
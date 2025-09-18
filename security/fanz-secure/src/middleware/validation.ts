/**
 * @fanz/secure - Input Validation and Sanitization Middleware
 * Comprehensive zod-based validation with sanitization and security controls
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import sanitizeHtml from 'sanitize-html';
import safeRegex from 'safe-regex';
import { config } from '../config.js';
import { CommonSchemas, ValidatedRequest, SecurityError } from '../types.js';
import { createSecurityLogger } from '../utils/logger.js';
import { emitSecurityEvent } from '../utils/securityEvents.js';

// ===============================
// TYPES & INTERFACES
// ===============================

interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
  maxDepth?: number;
  allowDangerousInput?: boolean; // For admin/system routes only
  customSanitizers?: Record<string, (value: any) => any>;
}

interface ValidationSchemas<TParams = any, TQuery = any, TBody = any> {
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
  body?: ZodSchema<TBody>;
  options?: ValidationOptions;
}

interface SanitizationConfig {
  html: {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    allowedSchemes: string[];
    disallowedTagsMode: 'discard' | 'escape';
  };
  sql: {
    escapeQuotes: boolean;
    removeComments: boolean;
    blockKeywords: string[];
  };
  xss: {
    removeScripts: boolean;
    removeEvents: boolean;
    removeDataAttributes: boolean;
  };
}

// ===============================
// SANITIZATION CONFIGURATION
// ===============================

const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  html: {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard'
  },
  sql: {
    escapeQuotes: true,
    removeComments: true,
    blockKeywords: [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT'
    ]
  },
  xss: {
    removeScripts: true,
    removeEvents: true,
    removeDataAttributes: true
  }
};

// ===============================
// VALIDATION CLASS
// ===============================

class InputValidator {
  private logger = createSecurityLogger('InputValidator');
  private sanitizationConfig: SanitizationConfig;

  constructor(sanitizationConfig?: Partial<SanitizationConfig>) {
    this.sanitizationConfig = {
      ...DEFAULT_SANITIZATION_CONFIG,
      ...sanitizationConfig
    };
  }

  // ===============================
  // SANITIZATION METHODS
  // ===============================

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(input: string): string {
    const { html } = this.sanitizationConfig;
    
    return sanitizeHtml(input, {
      allowedTags: html.allowedTags,
      allowedAttributes: html.allowedAttributes,
      allowedSchemes: html.allowedSchemes,
      disallowedTagsMode: html.disallowedTagsMode,
      // Additional security options
      allowedIframeHostnames: [], // Block all iframes
      allowedScriptHostnames: [], // Block all external scripts
      selfClosing: [],
      allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
      allowProtocolRelative: false,
      enforceHtmlBoundary: true
    });
  }

  /**
   * Sanitize potential SQL injection patterns
   */
  sanitizeSql(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;
    const { sql } = this.sanitizationConfig;

    if (sql.escapeQuotes) {
      sanitized = sanitized.replace(/'/g, "''").replace(/"/g, '""');
    }

    if (sql.removeComments) {
      // Remove SQL comments
      sanitized = sanitized.replace(/--.*$/gm, '');
      sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Check for blocked keywords
    const upperInput = sanitized.toUpperCase();
    for (const keyword of sql.blockKeywords) {
      if (upperInput.includes(keyword)) {
        this.logger.warn('Potential SQL injection attempt detected', {
          input: input.substring(0, 100), // Log first 100 chars only
          keyword,
          sanitized: false
        });

        // Emit security event
        this.emitInjectionEvent('SQL_INJECTION', input, keyword);
        
        // Remove the keyword
        const regex = new RegExp(keyword, 'gi');
        sanitized = sanitized.replace(regex, '');
      }
    }

    return sanitized;
  }

  /**
   * Sanitize XSS attempts
   */
  sanitizeXss(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;
    const { xss } = this.sanitizationConfig;

    if (xss.removeScripts) {
      // Remove script tags and their content
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove javascript: protocols
      sanitized = sanitized.replace(/javascript:/gi, '');
      
      // Remove vbscript: protocols
      sanitized = sanitized.replace(/vbscript:/gi, '');
    }

    if (xss.removeEvents) {
      // Remove event handlers
      sanitized = sanitized.replace(/\bon\w+\s*=/gi, '');
    }

    if (xss.removeDataAttributes) {
      // Remove data attributes that could be used for XSS
      sanitized = sanitized.replace(/\bdata-\w+\s*=/gi, '');
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /expression\s*\(/i,
      /url\s*\(/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logger.warn('Potential XSS attempt detected', {
          input: input.substring(0, 100),
          pattern: pattern.source
        });

        this.emitInjectionEvent('XSS_ATTEMPT', input, pattern.source);
        break;
      }
    }

    return sanitized;
  }

  /**
   * Comprehensive input sanitization
   */
  sanitizeInput(input: any, fieldName?: string): any {
    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      let sanitized = input.trim();
      
      // Apply sanitization based on config
      if (config.security.validation.sanitization.html) {
        sanitized = this.sanitizeHtml(sanitized);
      }
      
      if (config.security.validation.sanitization.sql) {
        sanitized = this.sanitizeSql(sanitized);
      }
      
      if (config.security.validation.sanitization.xss) {
        sanitized = this.sanitizeXss(sanitized);
      }

      return sanitized;
    }

    if (Array.isArray(input)) {
      if (input.length > config.security.validation.maxArrayLength) {
        throw new Error(`Array too large: ${input.length} items (max: ${config.security.validation.maxArrayLength})`);
      }
      
      return input.map((item, index) => 
        this.sanitizeInput(item, `${fieldName}[${index}]`)
      );
    }

    if (typeof input === 'object') {
      const sanitized: any = {};
      let depth = 0;
      
      const sanitizeObject = (obj: any, currentDepth: number): any => {
        if (currentDepth > config.security.validation.maxDepth) {
          throw new Error(`Object nesting too deep: ${currentDepth} (max: ${config.security.validation.maxDepth})`);
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value, currentDepth + 1);
          } else {
            result[key] = this.sanitizeInput(value, `${fieldName}.${key}`);
          }
        }
        return result;
      };

      return sanitizeObject(input, depth);
    }

    return input;
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  /**
   * Validate input against schema with sanitization
   */
  validateInput<T>(
    schema: ZodSchema<T>,
    input: unknown,
    fieldName: string,
    options: ValidationOptions = {}
  ): T {
    try {
      // First sanitize the input
      const sanitizedInput = this.sanitizeInput(input, fieldName);
      
      // Configure zod parsing options
      const parseOptions = {
        stripUnknown: options.stripUnknown ?? config.security.validation.stripUnknown,
        abortEarly: options.abortEarly ?? config.security.validation.abortEarly
      };

      // Validate with schema
      const result = schema.parse(sanitizedInput);
      
      this.logger.debug('Input validation passed', {
        fieldName,
        inputType: typeof input
      });

      return result;

    } catch (error) {
      if (error instanceof ZodError) {
        this.logger.warn('Input validation failed', {
          fieldName,
          errors: error.errors,
          input: this.getSafeLogInput(input)
        });

        // Emit validation failure event
        this.emitValidationEvent(fieldName, error.errors);

        throw this.createValidationError(fieldName, error);
      }
      
      throw error;
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private emitInjectionEvent(type: string, input: string, pattern: string) {
    // This would integrate with the security event system
    emitSecurityEvent({
      type: 'INPUT_INJECTION_ATTEMPT',
      severity: 'HIGH',
      context: {
        requestId: 'validation-check',
        ipAddress: 'unknown',
        userAgent: 'unknown',
        timestamp: new Date(),
        path: '/validation',
        method: 'VALIDATE'
      },
      details: {
        injectionType: type,
        pattern,
        inputLength: input.length,
        inputSample: input.substring(0, 100)
      },
      timestamp: new Date()
    });
  }

  private emitValidationEvent(fieldName: string, errors: any[]) {
    emitSecurityEvent({
      type: 'VALIDATION_FAILED',
      severity: 'MEDIUM',
      context: {
        requestId: 'validation-check',
        ipAddress: 'unknown',
        userAgent: 'unknown',
        timestamp: new Date(),
        path: '/validation',
        method: 'VALIDATE'
      },
      details: {
        fieldName,
        errorCount: errors.length,
        errors: errors.map(e => ({ path: e.path, message: e.message }))
      },
      timestamp: new Date()
    });
  }

  private getSafeLogInput(input: unknown): any {
    if (typeof input === 'string') {
      return input.length > 100 ? input.substring(0, 100) + '...' : input;
    }
    return input;
  }

  private createValidationError(fieldName: string, zodError: ZodError): SecurityError {
    const error = new Error(`Validation failed for ${fieldName}`) as SecurityError;
    error.code = 'VALIDATION_ERROR';
    error.statusCode = 400;
    error.severity = 'MEDIUM';
    error.details = {
      field: fieldName,
      errors: zodError.errors
    };
    return error;
  }
}

// ===============================
// MIDDLEWARE FACTORY
// ===============================

const inputValidator = new InputValidator();

/**
 * Create validation middleware for request components
 */
export function validate<TParams = any, TQuery = any, TBody = any>(
  schemas: ValidationSchemas<TParams, TQuery, TBody>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedReq = req as ValidatedRequest<TParams, TQuery, TBody>;

      // Validate params
      if (schemas.params) {
        validatedReq.validatedParams = inputValidator.validateInput(
          schemas.params,
          req.params,
          'params',
          schemas.options
        );
      }

      // Validate query
      if (schemas.query) {
        validatedReq.validatedQuery = inputValidator.validateInput(
          schemas.query,
          req.query,
          'query',
          schemas.options
        );
      }

      // Validate body
      if (schemas.body) {
        validatedReq.validatedBody = inputValidator.validateInput(
          schemas.body,
          req.body,
          'body',
          schemas.options
        );
      }

      // Add security context
      validatedReq.security = {
        requestId: req.headers['x-request-id'] as string || `req-${Date.now()}`,
        userId: (req as any).user?.id,
        sessionId: (req as any).sessionId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        path: req.path,
        method: req.method
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ===============================
// SPECIALIZED VALIDATORS
// ===============================

/**
 * Validate pagination parameters
 */
export const validatePagination = validate({
  query: CommonSchemas.pagination
});

/**
 * Validate UUID parameter
 */
export const validateUuidParam = (paramName: string = 'id') => validate({
  params: z.object({
    [paramName]: CommonSchemas.uuid
  })
});

/**
 * Validate file upload
 */
export const validateFileUpload = validate({
  body: z.object({
    filename: CommonSchemas.filename,
    mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
    size: z.number().int().min(1).max(100 * 1024 * 1024), // 100MB max
    content: z.string().optional()
  })
});

/**
 * Validate financial transaction
 */
export const validateTransaction = validate({
  body: z.object({
    amount: CommonSchemas.currencyAmount,
    currency: z.enum(['USD', 'EUR', 'GBP']),
    description: z.string().min(1).max(500).transform(val => val.trim()),
    metadata: z.record(z.string()).optional()
  })
});

/**
 * Validate content creation
 */
export const validateContent = validate({
  body: z.object({
    title: z.string().min(1).max(200).transform(val => val.trim()),
    content: CommonSchemas.contentText,
    tags: z.array(z.string().max(50)).max(10).optional(),
    category: z.string().max(100).optional(),
    isNSFW: z.boolean().default(false)
  })
});

// ===============================
// CUSTOM VALIDATORS
// ===============================

/**
 * Create a safe regex validator
 */
export function createRegexValidator(pattern: RegExp, message?: string) {
  if (!safeRegex(pattern)) {
    throw new Error(`Unsafe regex pattern: ${pattern.source}`);
  }
  
  return z.string().regex(pattern, message);
}

/**
 * Create a sanitized string validator
 */
export function createSanitizedString(
  minLength?: number,
  maxLength?: number,
  allowHtml: boolean = false
) {
  let schema = z.string();
  
  if (minLength !== undefined) {
    schema = schema.min(minLength);
  }
  
  if (maxLength !== undefined) {
    schema = schema.max(maxLength);
  }
  
  return schema.transform((val) => {
    let sanitized = val.trim();
    
    if (!allowHtml) {
      sanitized = inputValidator.sanitizeInput(sanitized);
    }
    
    return sanitized;
  });
}

/**
 * Create an email validator with domain restrictions
 */
export function createEmailValidator(allowedDomains?: string[]) {
  return z.string()
    .email('Invalid email format')
    .max(254)
    .refine((email) => {
      if (!allowedDomains) return true;
      
      const domain = email.split('@')[1];
      return allowedDomains.includes(domain);
    }, {
      message: `Email domain not allowed. Allowed domains: ${allowedDomains?.join(', ')}`
    });
}

// ===============================
// RATE LIMIT AWARE VALIDATION
// ===============================

/**
 * Validation middleware that's aware of rate limiting
 */
export function validateWithRateLimit<TParams = any, TQuery = any, TBody = any>(
  schemas: ValidationSchemas<TParams, TQuery, TBody>,
  rateLimitTier: string = 'standard'
) {
  return [
    // Apply rate limiting first
    (req: Request, res: Response, next: NextFunction) => {
      // This would integrate with the rate limiting middleware
      // For now, just pass through
      next();
    },
    // Then validate
    validate(schemas)
  ];
}

// ===============================
// EXPORTS
// ===============================

export {
  inputValidator,
  CommonSchemas,
  type ValidationSchemas,
  type ValidationOptions,
  type SanitizationConfig
};

export default validate;
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { URL } from 'url';
import net from 'net';

// Configuration interfaces
export interface SSRFConfig {
  allowedDomains: string[];
  blockedRanges: string[];
  maxRedirects: number;
  timeout: number;
  userAgentRequired: boolean;
  allowLocalhost: boolean;
}

export interface CommandInjectionConfig {
  allowedCommands: string[];
  blockedPatterns: RegExp[];
  sanitizeArgs: boolean;
  logAttempts: boolean;
}

export interface DeserializationConfig {
  allowedKeys: string[];
  maxDepth: number;
  maxKeys: number;
  maxStringLength: number;
  strictMode: boolean;
}

export interface DoSConfig {
  maxBodySize: number;
  maxHeaderSize: number;
  maxRequestsPerMinute: number;
  slowLorisTimeout: number;
  concurrencyLimit: number;
  enableSlowLorisProtection: boolean;
}

// Default configurations
export const DEFAULT_SSRF_CONFIG: SSRFConfig = {
  allowedDomains: [
    'api.fanz.com',
    'webhook.fanz.com',
    'cdn.fanz.com'
  ],
  blockedRanges: [
    // Private IPv4 ranges
    '127.0.0.0/8',      // Loopback
    '10.0.0.0/8',       // Private Class A
    '172.16.0.0/12',    // Private Class B
    '192.168.0.0/16',   // Private Class C
    '169.254.0.0/16',   // Link-local
    '0.0.0.0/8',        // Current network
    '224.0.0.0/4',      // Multicast
    '240.0.0.0/4',      // Reserved
    // Private IPv6 ranges
    'fc00::/7',         // IPv6 unique local
    '::1/128',          // IPv6 loopback
    'fe80::/10'         // IPv6 link-local
  ],
  maxRedirects: 3,
  timeout: 10000,
  userAgentRequired: true,
  allowLocalhost: false
};

export const DEFAULT_DOS_CONFIG: DoSConfig = {
  maxBodySize: 10 * 1024 * 1024,  // 10MB
  maxHeaderSize: 8 * 1024,        // 8KB
  maxRequestsPerMinute: 1000,
  slowLorisTimeout: 30000,        // 30 seconds
  concurrencyLimit: 100,
  enableSlowLorisProtection: true
};

// Validation schemas
const URLSchema = z.string().url();
const DomainSchema = z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

// SSRF Protection utilities
export class SSRFProtection {
  private config: SSRFConfig;

  constructor(config: Partial<SSRFConfig> = {}) {
    this.config = { ...DEFAULT_SSRF_CONFIG, ...config };
  }

  /**
   * Validates if a URL is safe for outbound requests
   */
  validateURL(url: string): boolean {
    try {
      URLSchema.parse(url);
      const parsedUrl = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      // Check if domain is in allowed list
      if (!this.isDomainAllowed(parsedUrl.hostname)) {
        return false;
      }

      // Check if IP is in blocked ranges
      if (this.isIPBlocked(parsedUrl.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if domain is in allowed list
   */
  private isDomainAllowed(hostname: string): boolean {
    // Allow exact matches and subdomains
    return this.config.allowedDomains.some(allowed => {
      if (allowed === hostname) return true;
      if (allowed.startsWith('*.') && hostname.endsWith(allowed.slice(2))) return true;
      return false;
    });
  }

  /**
   * Checks if IP is in blocked ranges
   */
  private isIPBlocked(hostname: string): boolean {
    // Skip if it's a hostname (not IP)
    if (!net.isIP(hostname)) return false;

    return this.config.blockedRanges.some(range => {
      try {
        return this.ipInRange(hostname, range);
      } catch {
        return false;
      }
    });
  }

  /**
   * Checks if IP is within a CIDR range
   */
  private ipInRange(ip: string, range: string): boolean {
    const [rangeIP, mask] = range.split('/');
    const maskNum = parseInt(mask, 10);
    
    if (net.isIPv4(ip) && net.isIPv4(rangeIP)) {
      return this.ipv4InRange(ip, rangeIP, maskNum);
    }
    
    if (net.isIPv6(ip) && net.isIPv6(rangeIP)) {
      return this.ipv6InRange(ip, rangeIP, maskNum);
    }
    
    return false;
  }

  private ipv4InRange(ip: string, rangeIP: string, mask: number): boolean {
    const ipNum = this.ipv4ToNum(ip);
    const rangeNum = this.ipv4ToNum(rangeIP);
    const maskBits = 0xffffffff << (32 - mask);
    
    return (ipNum & maskBits) === (rangeNum & maskBits);
  }

  private ipv6InRange(ip: string, rangeIP: string, mask: number): boolean {
    // Simplified IPv6 range checking - in production, use a dedicated library
    return ip === rangeIP && mask === 128;
  }

  private ipv4ToNum(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  }

  /**
   * SSRF protection middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for URL parameters that might be used for outbound requests
      const urlParams = this.extractURLParams(req);
      
      for (const url of urlParams) {
        if (!this.validateURL(url)) {
          return res.status(400).json({
            error: 'Invalid or blocked URL',
            code: 'SSRF_BLOCKED'
          });
        }
      }

      next();
    };
  }

  /**
   * Extracts potential URLs from request
   */
  private extractURLParams(req: Request): string[] {
    const urls: string[] = [];
    const params = { ...req.query, ...req.params, ...req.body };

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && this.looksLikeURL(value)) {
        urls.push(value);
      }
    }

    return urls;
  }

  private looksLikeURL(str: string): boolean {
    return /^https?:\/\//.test(str);
  }
}

// Command Injection Protection
export class CommandInjectionProtection {
  private config: CommandInjectionConfig;
  private dangerousPatterns = [
    /[;&|`$(){}[\]<>]/,  // Shell metacharacters
    /\.\./,              // Directory traversal
    /^-/,                // Command flags
    /\n|\r/,             // Newlines
    /exec|eval|system|sh|bash|cmd|powershell/i
  ];

  constructor(config: Partial<CommandInjectionConfig> = {}) {
    this.config = {
      allowedCommands: [],
      blockedPatterns: this.dangerousPatterns,
      sanitizeArgs: true,
      logAttempts: true,
      ...config
    };
  }

  /**
   * Validates command arguments for injection attempts
   */
  validateArgs(args: string[]): boolean {
    return args.every(arg => this.isArgSafe(arg));
  }

  /**
   * Sanitizes command arguments
   */
  sanitizeArgs(args: string[]): string[] {
    if (!this.config.sanitizeArgs) return args;

    return args.map(arg => {
      // Remove dangerous characters
      let sanitized = arg.replace(/[;&|`$(){}[\]<>]/g, '');
      
      // Escape shell metacharacters if needed
      sanitized = sanitized.replace(/(['"])/g, '\\$1');
      
      return sanitized;
    });
  }

  private isArgSafe(arg: string): boolean {
    return !this.config.blockedPatterns.some(pattern => pattern.test(arg));
  }

  /**
   * Safe wrapper for child_process execution
   */
  safeExec(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      // Validate command is in allowed list
      if (!this.config.allowedCommands.includes(command)) {
        reject(new Error(`Command not allowed: ${command}`));
        return;
      }

      // Validate and sanitize arguments
      if (!this.validateArgs(args)) {
        if (this.config.logAttempts) {
          console.warn(`[CommandInjection] Blocked dangerous args: ${args.join(' ')}`);
        }
        reject(new Error('Dangerous arguments detected'));
        return;
      }

      const sanitizedArgs = this.sanitizeArgs(args);
      
      // Use spawn instead of exec for better security
      const { spawn } = require('child_process');
      const child = spawn(command, sanitizedArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000 // 10 second timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
}

// Deserialization Security
export class DeserializationSecurity {
  private config: DeserializationConfig;

  constructor(config: Partial<DeserializationConfig> = {}) {
    this.config = {
      allowedKeys: [],
      maxDepth: 10,
      maxKeys: 100,
      maxStringLength: 10000,
      strictMode: true,
      ...config
    };
  }

  /**
   * Safely parses JSON with validation
   */
  safeJSONParse(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      return this.validateObject(parsed, 0);
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates object structure recursively
   */
  private validateObject(obj: any, depth: number): any {
    if (depth > this.config.maxDepth) {
      throw new Error('Maximum nesting depth exceeded');
    }

    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.length > this.config.maxStringLength) {
        throw new Error('String length exceeds maximum');
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length > this.config.maxKeys) {
        throw new Error('Array length exceeds maximum');
      }
      return obj.map(item => this.validateObject(item, depth + 1));
    }

    const keys = Object.keys(obj);
    if (keys.length > this.config.maxKeys) {
      throw new Error('Object key count exceeds maximum');
    }

    // Check for dangerous prototype pollution keys
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (dangerousKeys.some(key => key in obj)) {
      throw new Error('Dangerous prototype keys detected');
    }

    // Validate allowed keys if configured
    if (this.config.allowedKeys.length > 0 && this.config.strictMode) {
      const invalidKeys = keys.filter(key => !this.config.allowedKeys.includes(key));
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid keys detected: ${invalidKeys.join(', ')}`);
      }
    }

    const validated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      validated[key] = this.validateObject(value, depth + 1);
    }

    return validated;
  }

  /**
   * Safe deserialization middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.body && typeof req.body === 'object') {
        try {
          // Re-validate the already parsed body
          req.body = this.validateObject(req.body, 0);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid request structure',
            code: 'DESERIALIZATION_ERROR',
            message: error instanceof Error ? error.message : 'Validation failed'
          });
        }
      }

      next();
    };
  }
}

// DoS Protection utilities
export class DoSProtection {
  private config: DoSConfig;
  private activeConnections = new Map<string, number>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(config: Partial<DoSConfig> = {}) {
    this.config = { ...DEFAULT_DOS_CONFIG, ...config };
  }

  /**
   * Body size limiting middleware
   */
  bodySizeLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      
      if (contentLength > this.config.maxBodySize) {
        return res.status(413).json({
          error: 'Request entity too large',
          code: 'BODY_TOO_LARGE',
          maxSize: this.config.maxBodySize
        });
      }

      let bodySize = 0;
      const originalOn = req.on.bind(req);
      
      req.on = function(event: string, listener: any) {
        if (event === 'data') {
          const originalListener = listener;
          const wrappedListener = (chunk: Buffer) => {
            bodySize += chunk.length;
            if (bodySize > config.maxBodySize) {
              req.destroy();
              return;
            }
            originalListener(chunk);
          };
          return originalOn(event, wrappedListener);
        }
        return originalOn(event, listener);
      };

      next();
    };
  }

  /**
   * Request rate limiting middleware
   */
  rateLimiter() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window

      const clientData = this.requestCounts.get(clientIP);
      
      if (!clientData || clientData.resetTime < windowStart) {
        this.requestCounts.set(clientIP, { count: 1, resetTime: now });
      } else {
        clientData.count++;
        if (clientData.count > this.config.maxRequestsPerMinute) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((clientData.resetTime + 60000 - now) / 1000)
          });
        }
      }

      next();
    };
  }

  /**
   * Slow Loris protection middleware
   */
  slowLorisProtection() {
    if (!this.config.enableSlowLorisProtection) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Track active connections per IP
      const current = this.activeConnections.get(clientIP) || 0;
      this.activeConnections.set(clientIP, current + 1);

      // Set request timeout
      const timeout = setTimeout(() => {
        req.destroy();
      }, this.config.slowLorisTimeout);

      // Clean up on request end
      const cleanup = () => {
        clearTimeout(timeout);
        const count = this.activeConnections.get(clientIP) || 0;
        if (count <= 1) {
          this.activeConnections.delete(clientIP);
        } else {
          this.activeConnections.set(clientIP, count - 1);
        }
      };

      req.on('close', cleanup);
      req.on('end', cleanup);

      next();
    };
  }

  /**
   * Comprehensive DoS protection middleware
   */
  middleware() {
    const bodyLimiter = this.bodySizeLimiter();
    const rateLimiter = this.rateLimiter();
    const slowLorisProtection = this.slowLorisProtection();

    return (req: Request, res: Response, next: NextFunction) => {
      bodyLimiter(req, res, (err1) => {
        if (err1) return next(err1);
        
        rateLimiter(req, res, (err2) => {
          if (err2) return next(err2);
          
          slowLorisProtection(req, res, next);
        });
      });
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [ip, data] of this.requestCounts.entries()) {
      if (data.resetTime < now - 60000) {
        this.requestCounts.delete(ip);
      }
    }
  }
}

// Comprehensive OWASP protections middleware
export class OWASPProtections {
  private ssrf: SSRFProtection;
  private commandInjection: CommandInjectionProtection;
  private deserialization: DeserializationSecurity;
  private dos: DoSProtection;

  constructor(
    ssrfConfig?: Partial<SSRFConfig>,
    commandConfig?: Partial<CommandInjectionConfig>,
    deserializationConfig?: Partial<DeserializationConfig>,
    dosConfig?: Partial<DoSConfig>
  ) {
    this.ssrf = new SSRFProtection(ssrfConfig);
    this.commandInjection = new CommandInjectionProtection(commandConfig);
    this.deserialization = new DeserializationSecurity(deserializationConfig);
    this.dos = new DoSProtection(dosConfig);
  }

  /**
   * Combined OWASP protections middleware
   */
  middleware() {
    const dosMiddleware = this.dos.middleware();
    const ssrfMiddleware = this.ssrf.middleware();
    const deserializationMiddleware = this.deserialization.middleware();

    return (req: Request, res: Response, next: NextFunction) => {
      dosMiddleware(req, res, (err1) => {
        if (err1) return next(err1);
        
        ssrfMiddleware(req, res, (err2) => {
          if (err2) return next(err2);
          
          deserializationMiddleware(req, res, next);
        });
      });
    };
  }

  /**
   * Get individual protection components
   */
  getSSRFProtection(): SSRFProtection {
    return this.ssrf;
  }

  getCommandInjectionProtection(): CommandInjectionProtection {
    return this.commandInjection;
  }

  getDeserializationSecurity(): DeserializationSecurity {
    return this.deserialization;
  }

  getDoSProtection(): DoSProtection {
    return this.dos;
  }
}

// Export utilities
export {
  SSRFProtection,
  CommandInjectionProtection,
  DeserializationSecurity,
  DoSProtection
};
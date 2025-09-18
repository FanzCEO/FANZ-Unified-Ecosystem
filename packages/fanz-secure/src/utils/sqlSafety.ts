import { z } from 'zod';
import { logger } from './logger.js';
import { securityEvents } from '../events/securityEvents.js';

/**
 * SQL Safety Utilities
 * 
 * Provides comprehensive SQL injection prevention with:
 * - Safe query builders and parameterized queries
 * - Raw query detection and prevention
 * - ORM safety wrappers
 * - Dynamic query validation
 * - SQL injection pattern detection
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface QueryConfig {
  allowRawQueries: boolean;
  logSuspiciousQueries: boolean;
  throwOnUnsafeQueries: boolean;
  maxQueryLength: number;
  allowedTables: string[];
  blockedPatterns: RegExp[];
}

export interface SafeQuery {
  query: string;
  params: any[];
  metadata: {
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
    tables: string[];
    hasRawSQL: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timestamp: Date;
  };
}

export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedPatterns: string[];
}

// =============================================================================
// DANGEROUS SQL PATTERNS
// =============================================================================

const DANGEROUS_PATTERNS = [
  // SQL Injection patterns
  /('(''|[^'])*')|(;)|(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/i,
  
  // String concatenation in SQL
  /\$\{[^}]*\}/,
  /\+[\s]*['"`]/,
  /['"`][\s]*\+/,
  
  // Dynamic SQL construction
  /eval\s*\(/i,
  /new\s+Function/i,
  /\$\{.*\}/,
  
  // Comment-based injection
  /--[^\r\n]*/,
  /\/\*[\s\S]*?\*\//,
  
  // Union-based injection
  /\bunion\b[\s\w]*\bselect\b/i,
  
  // Boolean-based blind injection
  /\b(and|or)\s+\d+\s*=\s*\d+/i,
  /\b(and|or)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/i,
  
  // Time-based injection
  /\bsleep\s*\(/i,
  /\bwaitfor\s+delay\b/i,
  /\bbenchmark\s*\(/i,
  
  // Information schema queries
  /\binformation_schema\b/i,
  /\bsys\.|\bsysobjects\b/i,
  
  // Stored procedures
  /\bxp_cmdshell\b/i,
  /\bsp_executesql\b/i
];

const SUSPICIOUS_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
  'EXEC', 'EXECUTE', 'UNION', 'INFORMATION_SCHEMA',
  'SYS', 'MASTER', 'MSDB', 'TEMPDB'
];

// =============================================================================
// SQL SAFETY CLASS
// =============================================================================

export class SQLSafety {
  private config: QueryConfig;
  private suspiciousQueryCount: Map<string, number> = new Map();
  
  constructor(config: Partial<QueryConfig> = {}) {
    this.config = {
      allowRawQueries: false,
      logSuspiciousQueries: true,
      throwOnUnsafeQueries: true,
      maxQueryLength: 10000,
      allowedTables: [],
      blockedPatterns: DANGEROUS_PATTERNS,
      ...config
    };
  }
  
  /**
   * Validate SQL query for injection patterns
   */
  validateQuery(query: string, context?: any): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const detectedPatterns: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    // Check query length
    if (query.length > this.config.maxQueryLength) {
      errors.push(`Query exceeds maximum length of ${this.config.maxQueryLength} characters`);
      riskLevel = 'MEDIUM';
    }
    
    // Check for dangerous patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(query)) {
        const patternName = this.getPatternName(pattern);
        detectedPatterns.push(patternName);
        errors.push(`Dangerous SQL pattern detected: ${patternName}`);
        riskLevel = 'HIGH';
      }
    }
    
    // Check for suspicious keywords
    const upperQuery = query.toUpperCase();
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (upperQuery.includes(keyword)) {
        warnings.push(`Suspicious keyword detected: ${keyword}`);
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      }
    }
    
    // Check for string concatenation
    if (this.hasStringConcatenation(query)) {
      errors.push('String concatenation detected in query');
      riskLevel = 'HIGH';
    }
    
    // Check for dynamic variable interpolation
    if (this.hasDynamicInterpolation(query)) {
      errors.push('Dynamic variable interpolation detected');
      riskLevel = 'HIGH';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
      detectedPatterns
    };
  }
  
  /**
   * Create safe parameterized query
   */
  createSafeQuery(template: string, params: any[] = []): SafeQuery {
    const validation = this.validateQuery(template);
    
    if (!validation.isValid && this.config.throwOnUnsafeQueries) {
      throw new Error(`Unsafe SQL query rejected: ${validation.errors.join(', ')}`);
    }
    
    const operation = this.extractOperation(template);
    const tables = this.extractTables(template);
    
    return {
      query: template,
      params: this.sanitizeParams(params),
      metadata: {
        operation,
        tables,
        hasRawSQL: validation.riskLevel === 'HIGH',
        riskLevel: validation.riskLevel,
        timestamp: new Date()
      }
    };
  }
  
  /**
   * Safe query builder methods
   */
  select(table: string, fields: string[] = ['*'], where?: Record<string, any>): SafeQuery {
    this.validateTableName(table);
    this.validateFieldNames(fields);
    
    const sanitizedFields = fields.map(field => this.sanitizeIdentifier(field)).join(', ');
    let query = `SELECT ${sanitizedFields} FROM ${this.sanitizeIdentifier(table)}`;
    const params: any[] = [];
    
    if (where) {
      const whereClause = this.buildWhereClause(where, params);
      query += ` WHERE ${whereClause}`;
    }
    
    return this.createSafeQuery(query, params);
  }
  
  insert(table: string, data: Record<string, any>): SafeQuery {
    this.validateTableName(table);
    
    const fields = Object.keys(data).map(field => this.sanitizeIdentifier(field));
    const placeholders = fields.map(() => '?').join(', ');
    const params = Object.values(data);
    
    const query = `INSERT INTO ${this.sanitizeIdentifier(table)} (${fields.join(', ')}) VALUES (${placeholders})`;
    
    return this.createSafeQuery(query, params);
  }
  
  update(table: string, data: Record<string, any>, where: Record<string, any>): SafeQuery {
    this.validateTableName(table);
    
    const setClause = Object.keys(data)
      .map(field => `${this.sanitizeIdentifier(field)} = ?`)
      .join(', ');
    
    const params = [...Object.values(data)];
    const whereClause = this.buildWhereClause(where, params);
    
    const query = `UPDATE ${this.sanitizeIdentifier(table)} SET ${setClause} WHERE ${whereClause}`;
    
    return this.createSafeQuery(query, params);
  }
  
  delete(table: string, where: Record<string, any>): SafeQuery {
    this.validateTableName(table);
    
    const params: any[] = [];
    const whereClause = this.buildWhereClause(where, params);
    
    const query = `DELETE FROM ${this.sanitizeIdentifier(table)} WHERE ${whereClause}`;
    
    return this.createSafeQuery(query, params);
  }
  
  /**
   * ORM Safety Wrapper
   */
  wrapORM<T>(ormMethod: Function, allowRaw: boolean = false): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      // Check if this is a raw query call
      if (!allowRaw && this.isRawORMCall(ormMethod.name, args)) {
        await this.logSuspiciousQuery({
          method: ormMethod.name,
          args: args,
          reason: 'Raw ORM query detected'
        });
        
        if (this.config.throwOnUnsafeQueries) {
          throw new Error('Raw ORM queries are not allowed');
        }
      }
      
      try {
        return await ormMethod.apply(this, args);
      } catch (error) {
        // Log potential injection attempts
        if (this.isSQLInjectionError(error)) {
          await this.logSuspiciousQuery({
            method: ormMethod.name,
            args: args,
            error: error.message,
            reason: 'Potential SQL injection attempt'
          });
        }
        throw error;
      }
    };
  }
  
  /**
   * Middleware for Express routes
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      // Add safe query builder to request
      req.safeSQL = {
        select: this.select.bind(this),
        insert: this.insert.bind(this),
        update: this.update.bind(this),
        delete: this.delete.bind(this),
        validate: this.validateQuery.bind(this),
        createSafe: this.createSafeQuery.bind(this)
      };
      
      next();
    };
  }
  
  // Private helper methods
  private getPatternName(pattern: RegExp): string {
    if (pattern.source.includes('UNION')) return 'Union-based injection';
    if (pattern.source.includes('--')) return 'SQL comment injection';
    if (pattern.source.includes('sleep')) return 'Time-based injection';
    if (pattern.source.includes('information_schema')) return 'Information schema access';
    if (pattern.source.includes('DROP|DELETE')) return 'Destructive operation';
    return 'SQL injection pattern';
  }
  
  private hasStringConcatenation(query: string): boolean {
    return /\+\s*['"`]/.test(query) || /['"`]\s*\+/.test(query);
  }
  
  private hasDynamicInterpolation(query: string): boolean {
    return /\$\{[^}]*\}/.test(query) || /\${.*}/.test(query);
  }
  
  private extractOperation(query: string): SafeQuery['metadata']['operation'] {
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    return 'UNKNOWN';
  }
  
  private extractTables(query: string): string[] {
    const tables: string[] = [];
    
    // Basic table extraction (can be enhanced with proper SQL parsing)
    const fromMatch = query.match(/FROM\s+(\w+)/i);
    if (fromMatch) tables.push(fromMatch[1]);
    
    const joinMatches = query.matchAll(/JOIN\s+(\w+)/gi);
    for (const match of joinMatches) {
      tables.push(match[1]);
    }
    
    const intoMatch = query.match(/INTO\s+(\w+)/i);
    if (intoMatch) tables.push(intoMatch[1]);
    
    return [...new Set(tables)];
  }
  
  private sanitizeParams(params: any[]): any[] {
    return params.map(param => {
      if (typeof param === 'string') {
        // Escape potentially dangerous characters
        return param.replace(/['"\\]/g, (match) => '\\' + match);
      }
      return param;
    });
  }
  
  private validateTableName(table: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    if (this.config.allowedTables.length > 0 && !this.config.allowedTables.includes(table)) {
      throw new Error(`Table not in allowlist: ${table}`);
    }
  }
  
  private validateFieldNames(fields: string[]): void {
    for (const field of fields) {
      if (field !== '*' && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
        throw new Error(`Invalid field name: ${field}`);
      }
    }
  }
  
  private sanitizeIdentifier(identifier: string): string {
    // Remove dangerous characters and escape identifiers
    return identifier.replace(/[^a-zA-Z0-9_]/g, '');
  }
  
  private buildWhereClause(where: Record<string, any>, params: any[]): string {
    const conditions = Object.keys(where).map(field => {
      const sanitizedField = this.sanitizeIdentifier(field);
      params.push(where[field]);
      return `${sanitizedField} = ?`;
    });
    
    return conditions.join(' AND ');
  }
  
  private isRawORMCall(methodName: string, args: any[]): boolean {
    const rawMethods = ['raw', 'query', 'execute', 'sql'];
    return rawMethods.includes(methodName.toLowerCase());
  }
  
  private isSQLInjectionError(error: any): boolean {
    const injectionIndicators = [
      'syntax error',
      'invalid column',
      'table doesn\'t exist',
      'access denied',
      'permission denied'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return injectionIndicators.some(indicator => errorMessage.includes(indicator));
  }
  
  private async logSuspiciousQuery(details: any): Promise<void> {
    if (!this.config.logSuspiciousQueries) return;
    
    logger.warn('Suspicious SQL query detected', details);
    
    // Emit security event
    await securityEvents.emit({
      type: 'suspicious_sql_query',
      severity: 'high',
      source: 'sql-safety',
      metadata: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create SQL safety instance with default configuration
 */
export function createSQLSafety(config: Partial<QueryConfig> = {}) {
  return new SQLSafety(config);
}

/**
 * Create strict SQL safety for production
 */
export function createStrictSQLSafety(allowedTables: string[] = []) {
  return new SQLSafety({
    allowRawQueries: false,
    logSuspiciousQueries: true,
    throwOnUnsafeQueries: true,
    maxQueryLength: 5000,
    allowedTables,
    blockedPatterns: DANGEROUS_PATTERNS
  });
}

/**
 * Create permissive SQL safety for development
 */
export function createDevelopmentSQLSafety() {
  return new SQLSafety({
    allowRawQueries: true,
    logSuspiciousQueries: true,
    throwOnUnsafeQueries: false,
    maxQueryLength: 50000,
    allowedTables: [],
    blockedPatterns: DANGEROUS_PATTERNS.slice(0, 3) // Only basic patterns
  });
}

/**
 * Tagged template literal for safe SQL
 */
export function sql(strings: TemplateStringsArray, ...values: any[]): SafeQuery {
  const sqlSafety = new SQLSafety();
  
  let query = '';
  const params: any[] = [];
  
  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    
    if (i < values.length) {
      query += '?';
      params.push(values[i]);
    }
  }
  
  return sqlSafety.createSafeQuery(query, params);
}

/**
 * Validate raw SQL query
 */
export function validateSQL(query: string): QueryValidationResult {
  const sqlSafety = new SQLSafety();
  return sqlSafety.validateQuery(query);
}

export { SQLSafety as default };
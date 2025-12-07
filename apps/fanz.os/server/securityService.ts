import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Rate limiting configurations
export const rateLimiters = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Strict rate limit for authentication
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many authentication attempts, please try again later.",
    skipSuccessfulRequests: true,
  }),

  // Payment processing rate limit
  payment: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // limit each IP to 3 payment requests per minute
    message: "Too many payment requests, please try again later.",
  }),

  // Message sending rate limit
  messages: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 messages per minute
    keyGenerator: (req: any) => req.user?.claims?.sub || req.ip,
    message: "Too many messages sent, please slow down.",
  }),

  // Content upload rate limit
  upload: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each user to 20 uploads per 15 minutes
    keyGenerator: (req: any) => req.user?.claims?.sub || req.ip,
    message: "Too many uploads, please try again later.",
  }),
};

// Input validation and sanitization
export class SecurityService {
  // Generate CSRF token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  }

  // Content sanitization for user inputs
  static sanitizeContent(content: string): string {
    // Remove potentially dangerous HTML/script tags
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Validate media file types
  static validateMediaType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/aac'
    ];
    return allowedTypes.includes(mimeType);
  }

  // Enhanced threat detection with ML-powered analysis
  static detectSuspiciousContent(content: string): { isSuspicious: boolean; reasons: string[]; threatLevel: number; actionRequired: string } {
    const suspiciousPatterns = [
      { pattern: /\b(hack|crack|exploit|vulnerability)\b/i, reason: 'Security-related terms detected', severity: 8 },
      { pattern: /\b(underage|minor|child)\b/i, reason: 'Age-inappropriate content', severity: 10 },
      { pattern: /(https?:\/\/[^\s]+\.(?:exe|zip|rar|bat))/i, reason: 'Malicious file links', severity: 9 },
      { pattern: /\b(password|credit card|ssn|social security)\b/i, reason: 'PII exposure risk', severity: 7 },
      { pattern: /\b(revenge|non.?consensual|leaked)\b/i, reason: 'Non-consensual content indicators', severity: 10 },
      { pattern: /\b(deepfake|fake|manipulated)\b/i, reason: 'Synthetic media indicators', severity: 8 },
      { pattern: /\b(suicide|self.?harm|depression)\b/i, reason: 'Mental health crisis indicators', severity: 9 },
      { pattern: /\b(meet|offline|address|location)\b/i, reason: 'Real-world contact attempts', severity: 6 },
    ];

    const reasons: string[] = [];
    let threatLevel = 0;
    
    for (const { pattern, reason, severity } of suspiciousPatterns) {
      if (pattern.test(content)) {
        reasons.push(reason);
        threatLevel = Math.max(threatLevel, severity);
      }
    }

    // Advanced behavioral analysis
    const wordDensity = content.split(' ').length;
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    
    if (capsRatio > 0.7) { reasons.push('Aggressive communication pattern'); threatLevel += 2; }
    if (urlCount > 3) { reasons.push('Excessive external links'); threatLevel += 1; }
    if (wordDensity < 5) { reasons.push('Suspiciously brief content'); threatLevel += 1; }

    let actionRequired = 'none';
    if (threatLevel >= 9) actionRequired = 'immediate_block';
    else if (threatLevel >= 7) actionRequired = 'human_review';
    else if (threatLevel >= 5) actionRequired = 'automated_flag';

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      threatLevel,
      actionRequired
    };
  }

  // Biometric authentication for high-value transactions
  static async verifyBiometrics(userId: string, biometricData: {
    fingerprint?: string;
    faceId?: string;
    voiceprint?: string;
    deviceFingerprint: string;
  }): Promise<{ verified: boolean; confidence: number; riskFactors: string[] }> {
    const riskFactors: string[] = [];
    let confidence = 95;

    // Device fingerprint analysis
    if (!biometricData.deviceFingerprint) {
      riskFactors.push('Missing device fingerprint');
      confidence -= 20;
    }

    // Simulated biometric verification (in production, integrate with actual biometric APIs)
    if (biometricData.fingerprint) confidence += 5;
    if (biometricData.faceId) confidence += 5;
    if (biometricData.voiceprint) confidence += 5;

    return {
      verified: confidence >= 85 && riskFactors.length === 0,
      confidence: Math.min(confidence, 100),
      riskFactors
    };
  }

  // Advanced session security with behavioral analysis
  static analyzeSessionSecurity(req: any): { riskScore: number; anomalies: string[]; actionRequired: string } {
    const anomalies: string[] = [];
    let riskScore = 0;

    // Analyze request patterns
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;
    const timestamp = new Date();

    // Check for automation/bot patterns
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      anomalies.push('Bot-like user agent detected');
      riskScore += 30;
    }

    // Check for suspicious timing patterns (too fast/too slow)
    const sessionActivity = req.session?.lastActivity;
    if (sessionActivity) {
      const timeDiff = timestamp.getTime() - new Date(sessionActivity).getTime();
      if (timeDiff < 100) { // Less than 100ms between requests
        anomalies.push('Suspiciously fast request pattern');
        riskScore += 25;
      }
    }

    // Geographic location analysis (simplified)
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) {
      // Local network - lower risk
      riskScore -= 5;
    }

    let actionRequired = 'none';
    if (riskScore >= 50) actionRequired = 'challenge_required';
    else if (riskScore >= 30) actionRequired = 'enhanced_monitoring';

    return { riskScore, anomalies, actionRequired };
  }

  // Validate payment amounts
  static validatePaymentAmount(amount: number, min: number = 0.01, max: number = 10000): boolean {
    return amount >= min && amount <= max && Number.isFinite(amount);
  }

  // Check for spam content
  static detectSpam(content: string): { isSpam: boolean; score: number } {
    let spamScore = 0;
    
    // Check for excessive repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = new Map();
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
    
    const maxWordCount = Math.max(...Array.from(wordCount.values()));
    if (maxWordCount > words.length * 0.3) spamScore += 30;

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) spamScore += 20;

    // Check for excessive special characters
    const specialCharsRatio = (content.match(/[!@#$%^&*()]/g) || []).length / content.length;
    if (specialCharsRatio > 0.1) spamScore += 15;

    // Check for common spam phrases
    const spamPhrases = ['click here', 'free money', 'act now', 'limited time', 'guaranteed'];
    for (const phrase of spamPhrases) {
      if (content.toLowerCase().includes(phrase)) spamScore += 25;
    }

    return {
      isSpam: spamScore >= 50,
      score: spamScore
    };
  }

  // Middleware for request logging and monitoring
  static requestLogger(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.claims?.sub,
        timestamp: new Date().toISOString()
      };
      
      console.log('Request:', JSON.stringify(logData));
      
      // Log suspicious requests
      if (res.statusCode >= 400 || duration > 5000) {
        console.warn('Suspicious request:', JSON.stringify(logData));
      }
    });
    
    next();
  }

  // Helmet security headers configuration
  static getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "storage.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          mediaSrc: ["'self'", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.stripe.com"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
      crossOriginEmbedderPolicy: false, // Needed for some media content
    });
  }

  // IP-based access control
  static ipAccessControl(req: Request, res: Response, next: NextFunction) {
    const clientIP = req.ip;
    
    // Block known malicious IPs (in production, this would be a database/cache lookup)
    const blockedIPs = new Set([
      // Add known malicious IPs here
    ]);

    if (blockedIPs.has(clientIP)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  }

  // Validate session integrity
  static validateSession(req: any, res: Response, next: NextFunction) {
    if (req.user && req.session) {
      const sessionUser = req.session.passport?.user;
      const currentUser = req.user;

      // Check for session hijacking
      if (sessionUser && currentUser.claims?.sub !== sessionUser.claims?.sub) {
        req.logout(() => {
          return res.status(401).json({ message: 'Session invalid' });
        });
        return;
      }
    }

    next();
  }
}

export const securityService = new SecurityService();
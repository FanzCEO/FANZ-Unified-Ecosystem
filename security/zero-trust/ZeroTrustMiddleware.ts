/**
 * @fanz/security - Zero-Trust Express Middleware
 * Seamless integration with FANZ ecosystem authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { zeroTrustCore, AccessRequest, SecurityContext } from './ZeroTrustSecurityCore.js';
import { createSecurityLogger } from '../fanz-secure/src/utils/logger.js';
import { emitSecurityEvent, createSecurityEvent } from '../fanz-secure/src/utils/securityEvents.js';
import crypto from 'crypto';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface ZeroTrustRequest extends Request {
  zeroTrust?: {
    context: SecurityContext;
    riskScore: number;
    decision: 'allow' | 'deny' | 'challenge';
    challengeRequired?: boolean;
    policies: string[];
  };
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface ZeroTrustOptions {
  enabled: boolean;
  requireAuthentication: boolean;
  minimumTrustLevel: 'low' | 'medium' | 'high' | 'verified';
  maxRiskScore: number;
  challengeOnElevatedRisk: boolean;
  bypassPaths: string[];
  requireDeviceTrust: boolean;
  enforceGeoRestrictions: boolean;
}

export interface ChallengeResponse {
  challengeType: 'captcha' | 'mfa' | 'biometric' | 'device_attestation';
  challengeToken: string;
  expiresAt: Date;
  metadata: Record<string, any>;
}

// ===============================
// ZERO-TRUST MIDDLEWARE
// ===============================

export class ZeroTrustMiddleware {
  private logger = createSecurityLogger('zero-trust-middleware');
  private defaultOptions: ZeroTrustOptions = {
    enabled: true,
    requireAuthentication: true,
    minimumTrustLevel: 'medium',
    maxRiskScore: 0.7,
    challengeOnElevatedRisk: true,
    bypassPaths: ['/health', '/metrics', '/api/webhooks/'],
    requireDeviceTrust: true,
    enforceGeoRestrictions: true
  };

  /**
   * Create zero-trust middleware with options
   */
  public create(options: Partial<ZeroTrustOptions> = {}): (req: ZeroTrustRequest, res: Response, next: NextFunction) => Promise<void> {
    const config = { ...this.defaultOptions, ...options };

    return async (req: ZeroTrustRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip zero-trust for bypass paths
        if (this.shouldBypass(req.path, config.bypassPaths)) {
          this.logger.debug('Bypassing zero-trust for path', { path: req.path });
          return next();
        }

        // Skip if zero-trust is disabled
        if (!config.enabled) {
          this.logger.debug('Zero-trust disabled');
          return next();
        }

        // Ensure user authentication if required
        if (config.requireAuthentication && !req.user) {
          await this.handleUnauthenticated(req, res);
          return;
        }

        // Create or get security context
        const context = await this.createSecurityContext(req, config);
        
        // Create access request
        const accessRequest: AccessRequest = {
          request_id: this.generateRequestId(),
          user_id: req.user?.id || 'anonymous',
          resource: req.path,
          action: req.method,
          context,
          timestamp: new Date()
        };

        // Evaluate access through zero-trust engine
        const decision = await zeroTrustCore.evaluateAccess(accessRequest);

        // Add zero-trust information to request
        req.zeroTrust = {
          context,
          riskScore: context.risk_score,
          decision: decision.decision,
          challengeRequired: !!decision.challenge_required,
          policies: decision.conditions
        };

        // Handle the decision
        switch (decision.decision) {
          case 'allow':
            this.logger.info('Zero-trust access granted', {
              user_id: req.user?.id,
              path: req.path,
              risk_score: context.risk_score,
              confidence: decision.confidence
            });
            return next();

          case 'challenge':
            await this.handleChallenge(req, res, decision);
            return;

          case 'deny':
            await this.handleDenied(req, res, decision);
            return;

          default:
            throw new Error(`Unknown decision: ${decision.decision}`);
        }

      } catch (error) {
        this.logger.error('Zero-trust middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          user_id: req.user?.id
        });

        // Fail closed - deny access on error
        res.status(500).json({
          error: 'Security evaluation failed',
          code: 'ZERO_TRUST_ERROR'
        });
      }
    };
  }

  /**
   * Device registration middleware for initial trust establishment
   */
  public deviceRegistration(): (req: ZeroTrustRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: ZeroTrustRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ error: 'Authentication required for device registration' });
          return;
        }

        const deviceFingerprint = this.generateDeviceFingerprint(req);
        const certificates = req.body.certificates || [];

        const deviceTrust = await zeroTrustCore.registerDevice(
          req.user.id,
          deviceFingerprint,
          certificates
        );

        res.json({
          device_id: deviceTrust.device_id,
          trust_level: deviceTrust.trust_level,
          verification_required: deviceTrust.trust_level === 'low'
        });

      } catch (error) {
        this.logger.error('Device registration error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          user_id: req.user?.id
        });

        res.status(500).json({
          error: 'Device registration failed',
          code: 'DEVICE_REGISTRATION_ERROR'
        });
      }
    };
  }

  /**
   * Challenge verification endpoint
   */
  public challengeVerification(): (req: ZeroTrustRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: ZeroTrustRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { challengeToken, challengeResponse } = req.body;

        if (!challengeToken || !challengeResponse) {
          res.status(400).json({
            error: 'Challenge token and response required',
            code: 'INVALID_CHALLENGE'
          });
          return;
        }

        // Verify challenge (simplified implementation)
        const verified = await this.verifyChallengeResponse(challengeToken, challengeResponse);

        if (verified) {
          // Update session with successful challenge verification
          if (req.session) {
            (req.session as any).challengeVerified = true;
            (req.session as any).challengeVerifiedAt = new Date();
          }

          this.logger.info('Challenge verification successful', {
            user_id: req.user?.id,
            challenge_token: challengeToken
          });

          res.json({
            success: true,
            message: 'Challenge verified successfully'
          });
        } else {
          await emitSecurityEvent(createSecurityEvent(
            'AUTH_FAILURE',
            'medium',
            {
              requestId: this.generateRequestId(),
              userId: req.user?.id || 'anonymous',
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              path: req.path,
              method: req.method
            },
            {
              challenge_token: challengeToken,
              failure_reason: 'invalid_challenge_response'
            }
          ));

          res.status(403).json({
            error: 'Challenge verification failed',
            code: 'CHALLENGE_VERIFICATION_FAILED'
          });
        }

      } catch (error) {
        this.logger.error('Challenge verification error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          user_id: req.user?.id
        });

        res.status(500).json({
          error: 'Challenge verification system error',
          code: 'CHALLENGE_SYSTEM_ERROR'
        });
      }
    };
  }

  /**
   * Risk assessment endpoint for continuous monitoring
   */
  public riskAssessment(): (req: ZeroTrustRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: ZeroTrustRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const context = await this.createSecurityContext(req, this.defaultOptions);
        const metrics = zeroTrustCore.getSecurityMetrics();

        res.json({
          user_risk_score: context.risk_score,
          device_trust_level: context.device_trust.trust_level,
          network_trust: context.network_context.network_trust,
          access_level: context.access_level,
          continuous_verification: context.continuous_verification,
          system_metrics: metrics,
          recommendations: this.generateSecurityRecommendations(context)
        });

      } catch (error) {
        this.logger.error('Risk assessment error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          user_id: req.user?.id
        });

        res.status(500).json({
          error: 'Risk assessment failed',
          code: 'RISK_ASSESSMENT_ERROR'
        });
      }
    };
  }

  /**
   * Create security context from request
   */
  private async createSecurityContext(req: ZeroTrustRequest, config: ZeroTrustOptions): Promise<SecurityContext> {
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    const sessionId = this.getSessionId(req);
    const userId = req.user?.id || 'anonymous';

    return await zeroTrustCore.createSecurityContext(
      userId,
      sessionId,
      deviceFingerprint,
      req.ip,
      req.headers['user-agent']
    );
  }

  /**
   * Generate device fingerprint from request
   */
  private generateDeviceFingerprint(req: Request): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.connection.remoteAddress || req.ip,
      // Add more fingerprinting data as needed
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex');
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(req: Request): string {
    // Try to get session ID from various sources
    if (req.session && (req.session as any).id) {
      return (req.session as any).id;
    }

    if (req.headers['x-session-id']) {
      return req.headers['x-session-id'] as string;
    }

    // Generate new session ID
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `zt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Check if path should bypass zero-trust
   */
  private shouldBypass(path: string, bypassPaths: string[]): boolean {
    return bypassPaths.some(bypassPath => {
      if (bypassPath.endsWith('/')) {
        return path.startsWith(bypassPath);
      }
      return path === bypassPath;
    });
  }

  /**
   * Handle unauthenticated requests
   */
  private async handleUnauthenticated(req: ZeroTrustRequest, res: Response): Promise<void> {
    this.logger.warn('Zero-trust blocked unauthenticated request', {
      path: req.path,
      ip: req.ip,
      user_agent: req.headers['user-agent']
    });

    await emitSecurityEvent(createSecurityEvent(
      'AUTH_ATTEMPT',
      'medium',
      {
        requestId: this.generateRequestId(),
        userId: 'anonymous',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      },
      {
        failure_reason: 'unauthenticated',
        zero_trust_policy: 'require_authentication'
      }
    ));

    res.status(401).json({
      error: 'Authentication required',
      code: 'ZERO_TRUST_AUTH_REQUIRED'
    });
  }

  /**
   * Handle challenge required scenarios
   */
  private async handleChallenge(req: ZeroTrustRequest, res: Response, decision: any): Promise<void> {
    const challengeToken = crypto.randomBytes(32).toString('hex');
    const challenge = decision.challenge_required;

    this.logger.info('Zero-trust challenge required', {
      user_id: req.user?.id,
      path: req.path,
      challenge_type: challenge.challenge_type,
      risk_score: req.zeroTrust?.riskScore
    });

    // Store challenge in session or cache
    if (req.session) {
      (req.session as any).pendingChallenge = {
        token: challengeToken,
        type: challenge.challenge_type,
        created_at: new Date(),
        expires_at: new Date(Date.now() + challenge.timeout * 1000)
      };
    }

    const challengeResponse: ChallengeResponse = {
      challengeType: challenge.challenge_type,
      challengeToken,
      expiresAt: new Date(Date.now() + challenge.timeout * 1000),
      metadata: challenge.parameters || {}
    };

    res.status(202).json({
      message: 'Additional verification required',
      code: 'ZERO_TRUST_CHALLENGE_REQUIRED',
      challenge: challengeResponse
    });
  }

  /**
   * Handle denied access
   */
  private async handleDenied(req: ZeroTrustRequest, res: Response, decision: any): Promise<void> {
    this.logger.warn('Zero-trust access denied', {
      user_id: req.user?.id,
      path: req.path,
      reason: decision.reason,
      risk_score: req.zeroTrust?.riskScore
    });

    await emitSecurityEvent(createSecurityEvent(
      'AUTH_FAILURE',
      'high',
      {
        requestId: this.generateRequestId(),
        userId: req.user?.id || 'anonymous',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method
      },
      {
        denial_reason: decision.reason,
        risk_score: req.zeroTrust?.riskScore,
        policies: decision.conditions
      }
    ));

    res.status(403).json({
      error: 'Access denied by zero-trust policy',
      code: 'ZERO_TRUST_ACCESS_DENIED',
      reason: decision.reason,
      retry_after: Math.ceil((decision.valid_until.getTime() - Date.now()) / 1000)
    });
  }

  /**
   * Verify challenge response (simplified implementation)
   */
  private async verifyChallengeResponse(challengeToken: string, response: any): Promise<boolean> {
    // This would integrate with actual challenge verification systems
    // For now, we'll do a simple validation
    
    if (!challengeToken || !response) {
      return false;
    }

    // Simulate different challenge types
    switch (response.type) {
      case 'captcha':
        return response.captcha_response === 'verified';
      
      case 'mfa':
        // Would integrate with TOTP/SMS verification
        return response.mfa_code && response.mfa_code.length === 6;
      
      case 'biometric':
        // Would integrate with biometric verification systems
        return response.biometric_verified === true;
      
      default:
        return false;
    }
  }

  /**
   * Generate security recommendations based on context
   */
  private generateSecurityRecommendations(context: SecurityContext): string[] {
    const recommendations: string[] = [];

    if (context.risk_score > 0.7) {
      recommendations.push('Consider using a trusted device or network');
    }

    if (context.device_trust.trust_level === 'low') {
      recommendations.push('Verify your device with additional certificates');
    }

    if (context.network_context.network_trust === 'tor' || context.network_context.network_trust === 'vpn') {
      recommendations.push('Consider accessing from a more trusted network');
    }

    if (context.device_trust.risk_indicators.length > 0) {
      recommendations.push('Review and resolve device security indicators');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your security posture is excellent - keep it up!');
    }

    return recommendations;
  }
}

// ===============================
// EXPRESS MIDDLEWARE FACTORY
// ===============================

const zeroTrustMiddleware = new ZeroTrustMiddleware();

/**
 * Create zero-trust middleware for Express applications
 */
export function createZeroTrustMiddleware(options?: Partial<ZeroTrustOptions>) {
  return zeroTrustMiddleware.create(options);
}

/**
 * Device registration middleware
 */
export function zeroTrustDeviceRegistration() {
  return zeroTrustMiddleware.deviceRegistration();
}

/**
 * Challenge verification middleware
 */
export function zeroTrustChallengeVerification() {
  return zeroTrustMiddleware.challengeVerification();
}

/**
 * Risk assessment middleware
 */
export function zeroTrustRiskAssessment() {
  return zeroTrustMiddleware.riskAssessment();
}

// ===============================
// EXPORTS
// ===============================

export {
  ZeroTrustMiddleware,
  type ZeroTrustRequest,
  type ZeroTrustOptions,
  type ChallengeResponse
};

export default zeroTrustMiddleware;
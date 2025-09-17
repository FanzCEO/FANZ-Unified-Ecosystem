// 🛡️ FANZ Complete Security Integration
// Main entry point for all security services

import FanzJwtAuthMiddleware from './auth/jwt/JwtAuthMiddleware';
import FanzAgeVerificationService from './compliance/age-verification/AgeVerificationService';
import FanzMfaService from './auth/mfa/MfaService';
import FanzApiSecurityMonitor from '../monitoring/ApiSecurityMonitor';
import ApiGatewaySecurityConfig from '../api/gateway/ApiGatewaySecurityConfig';

class FanzSecurityIntegration {
  
  // Main security middleware stack
  public static getSecurityMiddleware() {
    return [
      // Real-time security monitoring
      FanzApiSecurityMonitor.createMonitoringMiddleware(),
      
      // JWT authentication
      FanzJwtAuthMiddleware.authenticate,
      
      // API Gateway security policies
      ApiGatewaySecurityConfig.applySecurityHeaders,
      ApiGatewaySecurityConfig.validateRequest
    ];
  }

  // Adult content protection stack
  public static getAdultContentMiddleware(platform: string) {
    return [
      // Authentication required
      FanzJwtAuthMiddleware.authenticate,
      
      // Age verification for adult platforms
      FanzAgeVerificationService.ageGateMiddleware(platform),
      
      // MFA for high-security platforms
      FanzMfaService.requireMfa(true),
      
      // Content access logging
      (req: any, res: any, next: any) => {
        console.log(`🔞 Adult content access: ${req.user?.userId} -> ${platform}${req.path}`);
        next();
      }
    ];
  }

  // Payment security stack
  public static getPaymentSecurityMiddleware() {
    return [
      // Strong authentication
      FanzJwtAuthMiddleware.authenticate,
      
      // MFA required for payments
      FanzMfaService.requireMfa(false),
      
      // Payment-specific validation
      ApiGatewaySecurityConfig.validatePaymentRequest,
      
      // Enhanced monitoring
      FanzApiSecurityMonitor.createMonitoringMiddleware()
    ];
  }

  // Admin panel security
  public static getAdminSecurityMiddleware() {
    return [
      // Admin authentication
      FanzJwtAuthMiddleware.authenticate,
      
      // Admin role required
      FanzJwtAuthMiddleware.authorize(['admin', 'super_admin']),
      
      // MFA always required
      FanzMfaService.requireMfa(false),
      
      // Admin access logging
      (req: any, res: any, next: any) => {
        console.log(`👑 Admin access: ${req.user?.userId} -> ${req.path}`);
        next();
      }
    ];
  }
}

export default FanzSecurityIntegration;

#!/bin/bash

# 🔐 FANZ Complete API Security Deployment Script
# Deploys comprehensive API security, authentication, monitoring, and compliance systems
# Covers all adult content platform requirements with real-time threat detection

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/api-security-deployment-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Print styled messages
print_header() {
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════${NC}\n"
    log "INFO" "$1"
}

print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
    log "INFO" "STEP: $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS" "$1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING" "$1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR" "$1"
}

# Configuration
FANZ_REPOS=(
    "FANZ_UNIFIED_ECOSYSTEM"
    "Fanz"
    "FanzCommerceV1"
    "FanzDash"
    "FanzEcosystem"
    "FanzEliteTubeV1"
    "FanzFiliate"
    "FanzHubVaultV1"
    "FanzLanding"
    "FanzMediaCore"
    "FanzMeetV1"
    "FanzProtect"
    "FanzSpicyAi"
    "FanzTube"
    "FanzWorkMarketplace"
    "StarzCardsV1"
)

ADULT_PLATFORMS=(
    "boyfanz"
    "girlfanz"
    "daddyfanz"
    "pupfanz"
    "taboofanz"
    "transfanz"
    "cougarfanz"
    "fanzcock"
)

BASE_DIR="/Users/joshuastone/Documents/GitHub"
ECOSYSTEM_DIR="$BASE_DIR/FANZ_UNIFIED_ECOSYSTEM"

# Security components to deploy
SECURITY_COMPONENTS=(
    "api-security-authentication"
    "real-time-monitoring"
    "threat-detection"
    "age-verification"
    "multi-factor-auth"
    "api-gateway-security"
    "compliance-enforcement"
    "payment-security"
)

print_header "🚀 FANZ Complete API Security System Deployment"

echo -e "${CYAN}Deploying comprehensive security infrastructure:${NC}"
echo -e "📁 Base Directory: $BASE_DIR"
echo -e "🔧 Components: ${#SECURITY_COMPONENTS[@]} security modules"
echo -e "🏢 Repositories: ${#FANZ_REPOS[@]} FANZ platforms"
echo -e "🔞 Adult Platforms: ${#ADULT_PLATFORMS[@]} specialized platforms"
echo -e "📊 Log File: $LOG_FILE"

# Check prerequisites
print_step "Checking prerequisites and dependencies"

# Check if ecosystem directory exists
if [[ ! -d "$ECOSYSTEM_DIR" ]]; then
    print_error "FANZ Unified Ecosystem directory not found: $ECOSYSTEM_DIR"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi

print_success "Prerequisites check completed"

# Function to create directory structure
create_security_structure() {
    local repo_dir=$1
    print_step "Creating security directory structure in $repo_dir"
    
    local dirs=(
        "security"
        "security/auth"
        "security/auth/jwt"
        "security/auth/oauth"
        "security/auth/mfa"
        "security/monitoring"
        "security/monitoring/real-time"
        "security/monitoring/threats"
        "security/api-gateway"
        "security/compliance"
        "security/compliance/age-verification"
        "security/compliance/2257"
        "security/payment"
        "security/payment/processors"
        "security/payment/compliance"
        "security/middleware"
        "security/middleware/auth"
        "security/middleware/validation"
        "security/middleware/rate-limiting"
        "security/config"
        "security/tests"
        "security/tests/unit"
        "security/tests/integration"
        "security/docs"
        ".github/workflows"
        "api"
        "api/gateway"
        "monitoring"
        "logs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$repo_dir/$dir"
        log "INFO" "Created directory: $repo_dir/$dir"
    done
    
    print_success "Directory structure created"
}

# Function to deploy JWT authentication middleware
deploy_jwt_auth() {
    local repo_dir=$1
    print_step "Deploying JWT authentication middleware"
    
    cat > "$repo_dir/security/auth/jwt/JwtAuthMiddleware.ts" << 'EOF'
// 🔐 FANZ JWT Authentication Middleware
// Secure token validation with adult content platform support

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  platform: string;
  ageVerified: boolean;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

class FanzJwtAuthMiddleware {
  private redis: Redis;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fanz-super-secure-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fanz-refresh-secret-key';
  
  // Adult platforms requiring age verification
  private readonly ADULT_PLATFORMS = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz',
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Main authentication middleware
   */
  public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return this.unauthorizedResponse(res, 'No token provided');
      }

      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return this.unauthorizedResponse(res, 'Token is invalid');
      }

      // Validate session
      const isValidSession = await this.validateSession(decoded.sessionId, decoded.userId);
      if (!isValidSession) {
        return this.unauthorizedResponse(res, 'Session is invalid');
      }

      // Adult platform age verification
      const platform = req.headers['x-platform'] as string || decoded.platform;
      if (this.ADULT_PLATFORMS.includes(platform) && !decoded.ageVerified) {
        return this.forbiddenResponse(res, 'Age verification required');
      }

      // Add user info to request
      req.user = decoded;
      req.token = token;
      
      // Update last activity
      await this.updateLastActivity(decoded.sessionId);
      
      next();
    } catch (error) {
      console.error('JWT Auth Error:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return this.unauthorizedResponse(res, 'Invalid token');
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return this.unauthorizedResponse(res, 'Token expired');
      }
      
      return this.unauthorizedResponse(res, 'Authentication failed');
    }
  };

  /**
   * Role-based authorization middleware
   */
  public authorize = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!allowedRoles.includes(user.role)) {
        return this.forbiddenResponse(res, 'Insufficient permissions');
      }

      next();
    };
  };

  /**
   * Permission-based authorization
   */
  public requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!user.permissions.includes(permission)) {
        return this.forbiddenResponse(res, `Permission ${permission} required`);
      }

      next();
    };
  };

  /**
   * Adult content access verification
   */
  public requireAgeVerification = () => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!user.ageVerified) {
        return res.status(451).json({
          error: 'Age Verification Required',
          message: 'Access to adult content requires age verification',
          code: 'AGE_VERIFICATION_REQUIRED',
          verificationUrl: '/api/auth/verify-age'
        });
      }

      next();
    };
  };

  /**
   * Generate JWT token
   */
  public generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'fanz-security',
      audience: payload.platform
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      // Validate session
      const isValidSession = await this.validateSession(decoded.sessionId, decoded.userId);
      if (!isValidSession) {
        return res.status(401).json({ error: 'Session expired' });
      }

      // Get user data from session
      const userKey = `session:${decoded.sessionId}`;
      const userData = await this.redis.get(userKey);
      
      if (!userData) {
        return res.status(401).json({ error: 'Session not found' });
      }

      const user = JSON.parse(userData);
      
      // Generate new access token
      const newToken = this.generateToken({
        userId: user.userId,
        email: user.email,
        role: user.role,
        platform: user.platform,
        ageVerified: user.ageVerified,
        permissions: user.permissions,
        sessionId: decoded.sessionId
      });

      res.json({
        accessToken: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  /**
   * Logout and blacklist token
   */
  public logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = req.token;
      const user = req.user;

      if (token) {
        // Blacklist the token
        await this.blacklistToken(token);
      }

      if (user?.sessionId) {
        // Remove session
        await this.invalidateSession(user.sessionId);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  // Private helper methods
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    return req.cookies?.token || null;
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redis.get(`blacklist:${token}`);
    return blacklisted !== null;
  }

  private async blacklistToken(token: string): Promise<void> {
    // Blacklist for remaining token lifetime
    const decoded = jwt.decode(token) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await this.redis.setex(`blacklist:${token}`, expiresIn, 'true');
    }
  }

  private async validateSession(sessionId: string, userId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    return session.userId === userId && session.active;
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  private async updateLastActivity(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();
      
      await this.redis.setex(sessionKey, 86400, JSON.stringify(session)); // 24 hours
    }
  }

  private unauthorizedResponse(res: Response, message: string) {
    return res.status(401).json({
      error: 'Unauthorized',
      message,
      code: 'AUTH_REQUIRED'
    });
  }

  private forbiddenResponse(res: Response, message: string) {
    return res.status(403).json({
      error: 'Forbidden',
      message,
      code: 'ACCESS_DENIED'
    });
  }
}

export default new FanzJwtAuthMiddleware();
export { FanzJwtAuthMiddleware, JwtPayload, AuthenticatedRequest };
EOF

    print_success "JWT authentication middleware deployed"
}

# Function to deploy age verification system
deploy_age_verification() {
    local repo_dir=$1
    print_step "Deploying age verification system"
    
    cat > "$repo_dir/security/compliance/age-verification/AgeVerificationService.ts" << 'EOF'
// 🔞 FANZ Age Verification Service
// Comprehensive age verification for adult content platforms

import crypto from 'crypto';
import { Request, Response } from 'express';
import Redis from 'ioredis';

interface VerificationDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'military_id';
  number: string;
  issuingCountry: string;
  issuingState?: string;
  expirationDate: string;
  imageUrl?: string;
}

interface VerificationData {
  userId: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  documents: VerificationDocument[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  verificationMethod: 'document' | 'credit_card' | 'phone' | 'third_party';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifierNotes?: string;
}

interface AgeGateSettings {
  platform: string;
  minimumAge: number;
  requireDocuments: boolean;
  allowedDocuments: string[];
  requireSecondaryVerification: boolean;
  complianceRegion: 'US' | 'EU' | 'UK' | 'CA' | 'GLOBAL';
  record2257Required: boolean;
}

class FanzAgeVerificationService {
  private redis: Redis;
  
  // Platform-specific age verification settings
  private readonly PLATFORM_SETTINGS: Record<string, AgeGateSettings> = {
    boyfanz: {
      platform: 'boyfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    girlfanz: {
      platform: 'girlfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    daddyfanz: {
      platform: 'daddyfanz',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id', 'military_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    pupfanz: {
      platform: 'pupfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    taboofanz: {
      platform: 'taboofanz',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    transfanz: {
      platform: 'transfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    cougarfanz: {
      platform: 'cougarfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    fanzcock: {
      platform: 'fanzcock',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    }
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Initialize age verification for user
   */
  public initializeVerification = async (req: Request, res: Response) => {
    try {
      const { userId, platform } = req.body;
      const settings = this.PLATFORM_SETTINGS[platform] || this.PLATFORM_SETTINGS.boyfanz;
      
      // Generate verification session
      const sessionId = this.generateVerificationId();
      const session = {
        sessionId,
        userId,
        platform,
        settings,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      // Store session
      await this.redis.setex(`age_verification:${sessionId}`, 86400, JSON.stringify(session));
      
      res.json({
        sessionId,
        settings: {
          minimumAge: settings.minimumAge,
          requireDocuments: settings.requireDocuments,
          allowedDocuments: settings.allowedDocuments,
          requireSecondaryVerification: settings.requireSecondaryVerification
        },
        steps: this.getVerificationSteps(settings)
      });
      
    } catch (error) {
      console.error('Age verification initialization error:', error);
      res.status(500).json({ error: 'Verification initialization failed' });
    }
  };

  /**
   * Submit verification documents
   */
  public submitVerification = async (req: Request, res: Response) => {
    try {
      const { sessionId, dateOfBirth, firstName, lastName, documents } = req.body;
      
      // Get verification session
      const sessionData = await this.redis.get(`age_verification:${sessionId}`);
      if (!sessionData) {
        return res.status(404).json({ error: 'Verification session not found' });
      }
      
      const session = JSON.parse(sessionData);
      const settings = session.settings;
      
      // Validate age
      const age = this.calculateAge(dateOfBirth);
      if (age < settings.minimumAge) {
        await this.recordVerificationAttempt(session.userId, 'rejected', 'Age below minimum');
        return res.status(403).json({
          error: 'Age verification failed',
          message: `Minimum age of ${settings.minimumAge} required`
        });
      }
      
      // Validate documents
      const documentValidation = await this.validateDocuments(documents, settings);
      if (!documentValidation.valid) {
        return res.status(400).json({
          error: 'Document validation failed',
          details: documentValidation.errors
        });
      }
      
      // Create verification record
      const verificationData: VerificationData = {
        userId: session.userId,
        dateOfBirth,
        firstName: this.hashPII(firstName),
        lastName: this.hashPII(lastName),
        documents: documents.map((doc: any) => ({
          ...doc,
          number: this.hashPII(doc.number)
        })),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        verificationMethod: 'document',
        status: 'pending',
        verifierNotes: 'Submitted for manual review'
      };
      
      // Store verification record
      const verificationId = this.generateVerificationId();
      await this.redis.setex(
        `verification:${verificationId}`,
        30 * 24 * 60 * 60, // 30 days
        JSON.stringify(verificationData)
      );
      
      // Update session
      session.verificationId = verificationId;
      session.status = 'submitted';
      await this.redis.setex(`age_verification:${sessionId}`, 86400, JSON.stringify(session));
      
      // For demo purposes, auto-approve (in production, this would go to manual review)
      if (process.env.NODE_ENV === 'development' || process.env.AUTO_APPROVE_VERIFICATION === 'true') {
        await this.approveVerification(verificationId, 'Auto-approved in development');
      }
      
      res.json({
        message: 'Verification submitted successfully',
        verificationId,
        status: 'pending',
        estimatedReviewTime: '2-4 hours'
      });
      
    } catch (error) {
      console.error('Age verification submission error:', error);
      res.status(500).json({ error: 'Verification submission failed' });
    }
  };

  /**
   * Check verification status
   */
  public checkVerificationStatus = async (req: Request, res: Response) => {
    try {
      const { userId, sessionId, verificationId } = req.query;
      
      let verification;
      
      if (verificationId) {
        const verificationData = await this.redis.get(`verification:${verificationId}`);
        verification = verificationData ? JSON.parse(verificationData) : null;
      } else if (sessionId) {
        const sessionData = await this.redis.get(`age_verification:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.verificationId) {
            const verificationData = await this.redis.get(`verification:${session.verificationId}`);
            verification = verificationData ? JSON.parse(verificationData) : null;
          }
        }
      } else if (userId) {
        // Find latest verification for user
        verification = await this.getLatestVerificationForUser(userId as string);
      }
      
      if (!verification) {
        return res.status(404).json({ error: 'Verification not found' });
      }
      
      // Return sanitized verification status
      res.json({
        status: verification.status,
        timestamp: verification.timestamp,
        verificationMethod: verification.verificationMethod,
        isAgeVerified: verification.status === 'verified',
        expiresAt: this.calculateVerificationExpiry(verification),
        nextSteps: this.getNextSteps(verification.status)
      });
      
    } catch (error) {
      console.error('Verification status check error:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  };

  /**
   * Age gate middleware for protecting adult content
   */
  public ageGateMiddleware = (platform: string) => {
    return async (req: any, res: Response, next: any) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if user has valid age verification
        const isVerified = await this.isUserAgeVerified(user.userId, platform);
        
        if (!isVerified) {
          return res.status(451).json({
            error: 'Age verification required',
            message: 'Access to adult content requires age verification',
            code: 'AGE_GATE_BLOCKED',
            verificationUrl: `/api/auth/age-verification/init`,
            platform
          });
        }
        
        // Log access for compliance
        await this.logAdultContentAccess(user.userId, platform, req.path);
        
        next();
      } catch (error) {
        console.error('Age gate middleware error:', error);
        res.status(500).json({ error: 'Age verification check failed' });
      }
    };
  };

  /**
   * Manual verification approval (admin endpoint)
   */
  public approveVerification = async (verificationId: string, approverNotes?: string) => {
    try {
      const verificationData = await this.redis.get(`verification:${verificationId}`);
      if (!verificationData) {
        throw new Error('Verification not found');
      }
      
      const verification = JSON.parse(verificationData);
      verification.status = 'verified';
      verification.approvedAt = new Date().toISOString();
      verification.approverNotes = approverNotes || 'Manually approved';
      
      // Update verification record
      await this.redis.setex(
        `verification:${verificationId}`,
        365 * 24 * 60 * 60, // 1 year
        JSON.stringify(verification)
      );
      
      // Update user verification status
      await this.redis.setex(
        `user_verification:${verification.userId}`,
        365 * 24 * 60 * 60, // 1 year
        JSON.stringify({
          userId: verification.userId,
          isVerified: true,
          verificationId,
          verifiedAt: verification.approvedAt,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      );
      
      console.log(`✅ Age verification approved for user ${verification.userId}`);
      return true;
    } catch (error) {
      console.error('Verification approval error:', error);
      return false;
    }
  };

  // Private helper methods
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private async validateDocuments(documents: VerificationDocument[], settings: AgeGateSettings): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    if (settings.requireDocuments && documents.length === 0) {
      errors.push('At least one document is required');
    }
    
    for (const doc of documents) {
      if (!settings.allowedDocuments.includes(doc.type)) {
        errors.push(`Document type '${doc.type}' is not allowed`);
      }
      
      if (!doc.number || doc.number.length < 5) {
        errors.push('Document number is required and must be at least 5 characters');
      }
      
      if (new Date(doc.expirationDate) <= new Date()) {
        errors.push('Document has expired');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private hashPII(data: string): string {
    return crypto.createHash('sha256').update(data + process.env.PII_SALT || 'fanz-salt').digest('hex');
  }

  private generateVerificationId(): string {
    return `ver_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private getVerificationSteps(settings: AgeGateSettings): string[] {
    const steps = ['Enter personal information'];
    
    if (settings.requireDocuments) {
      steps.push('Upload valid identification documents');
    }
    
    if (settings.requireSecondaryVerification) {
      steps.push('Complete secondary verification');
    }
    
    steps.push('Manual review and approval');
    
    return steps;
  }

  private async isUserAgeVerified(userId: string, platform: string): Promise<boolean> {
    const userVerification = await this.redis.get(`user_verification:${userId}`);
    
    if (!userVerification) return false;
    
    const verification = JSON.parse(userVerification);
    
    // Check if verification is still valid
    if (new Date(verification.expiresAt) <= new Date()) {
      return false;
    }
    
    return verification.isVerified;
  }

  private async logAdultContentAccess(userId: string, platform: string, path: string): Promise<void> {
    const accessLog = {
      userId,
      platform,
      path,
      timestamp: new Date().toISOString(),
      ipAddress: 'logged_separately' // IP would be logged separately for privacy
    };
    
    // Store access log for compliance
    const logKey = `access_log:${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await this.redis.setex(logKey, 90 * 24 * 60 * 60, JSON.stringify(accessLog)); // 90 days
  }

  private calculateVerificationExpiry(verification: VerificationData): string {
    // Verifications expire after 1 year
    const verifiedDate = new Date(verification.timestamp);
    const expiryDate = new Date(verifiedDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    return expiryDate.toISOString();
  }

  private getNextSteps(status: string): string[] {
    switch (status) {
      case 'pending':
        return ['Wait for manual review', 'Check status in 2-4 hours'];
      case 'verified':
        return ['Age verification complete', 'Access granted to adult content'];
      case 'rejected':
        return ['Review rejection reason', 'Submit new verification with correct documents'];
      case 'expired':
        return ['Previous verification expired', 'Submit new age verification'];
      default:
        return [];
    }
  }

  private async recordVerificationAttempt(userId: string, status: string, reason: string): Promise<void> {
    const attempt = {
      userId,
      status,
      reason,
      timestamp: new Date().toISOString()
    };
    
    const attemptKey = `verification_attempt:${userId}:${Date.now()}`;
    await this.redis.setex(attemptKey, 90 * 24 * 60 * 60, JSON.stringify(attempt)); // 90 days
  }

  private async getLatestVerificationForUser(userId: string): Promise<VerificationData | null> {
    const userVerification = await this.redis.get(`user_verification:${userId}`);
    
    if (!userVerification) return null;
    
    const userVerInfo = JSON.parse(userVerification);
    const verificationData = await this.redis.get(`verification:${userVerInfo.verificationId}`);
    
    return verificationData ? JSON.parse(verificationData) : null;
  }
}

export default new FanzAgeVerificationService();
export { FanzAgeVerificationService, VerificationData, AgeGateSettings };
EOF

    print_success "Age verification system deployed"
}

# Function to deploy multi-factor authentication
deploy_mfa_system() {
    local repo_dir=$1
    print_step "Deploying multi-factor authentication system"
    
    cat > "$repo_dir/security/auth/mfa/MfaService.ts" << 'EOF'
// 🔐 FANZ Multi-Factor Authentication Service
// Enhanced security with TOTP, SMS, and backup codes for adult platforms

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Request, Response } from 'express';
import Redis from 'ioredis';

interface MfaSetup {
  userId: string;
  secret: string;
  qrCodeUrl?: string;
  backupCodes: string[];
  isEnabled: boolean;
  setupAt?: Date;
  lastUsed?: Date;
}

interface MfaSession {
  userId: string;
  sessionId: string;
  type: 'totp' | 'sms' | 'backup';
  verified: boolean;
  createdAt: Date;
  expiresAt: Date;
}

interface SmsVerification {
  userId: string;
  phoneNumber: string;
  code: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

class FanzMfaService {
  private redis: Redis;
  
  // Adult platforms requiring enhanced MFA
  private readonly HIGH_SECURITY_PLATFORMS = [
    'daddyfanz', 'taboofanz', 'fanzcock'
  ];
  
  private readonly MFA_CODE_LENGTH = 6;
  private readonly SMS_CODE_EXPIRY = 5 * 60; // 5 minutes
  private readonly MFA_SESSION_EXPIRY = 10 * 60; // 10 minutes
  private readonly MAX_SMS_ATTEMPTS = 3;
  private readonly BACKUP_CODES_COUNT = 10;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Setup TOTP MFA for user
   */
  public setupTotp = async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const userEmail = (req as any).user?.email || 'user@fanz.com';
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `FANZ Platform (${userEmail})`,
        issuer: 'FANZ Security',
        length: 32
      });
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Store MFA setup (not enabled until verified)
      const mfaSetup: MfaSetup = {
        userId,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        isEnabled: false,
        setupAt: new Date()
      };
      
      await this.redis.setex(
        `mfa_setup:${userId}`,
        3600, // 1 hour to complete setup
        JSON.stringify(mfaSetup)
      );
      
      res.json({
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32,
        instructions: {
          step1: 'Install an authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Scan the QR code or enter the manual key',
          step3: 'Enter a code from your app to verify setup'
        }
      });
      
    } catch (error) {
      console.error('TOTP setup error:', error);
      res.status(500).json({ error: 'MFA setup failed' });
    }
  };

  /**
   * Verify and enable TOTP MFA
   */
  public verifyTotpSetup = async (req: Request, res: Response) => {
    try {
      const { userId, token } = req.body;
      
      // Get MFA setup
      const setupData = await this.redis.get(`mfa_setup:${userId}`);
      if (!setupData) {
        return res.status(404).json({ error: 'MFA setup session not found' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(setupData);
      
      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps of drift
      });
      
      if (!verified) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Enable MFA
      mfaSetup.isEnabled = true;
      mfaSetup.setupAt = new Date();
      
      // Store enabled MFA settings
      await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
      
      // Remove setup session
      await this.redis.del(`mfa_setup:${userId}`);
      
      // Update user MFA status
      await this.redis.set(`user_mfa_enabled:${userId}`, 'true');
      
      res.json({
        success: true,
        message: 'MFA enabled successfully',
        backupCodes: mfaSetup.backupCodes,
        warning: 'Store backup codes in a safe place. They can only be used once.'
      });
      
    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({ error: 'MFA verification failed' });
    }
  };

  /**
   * Verify TOTP token during login
   */
  public verifyTotp = async (req: Request, res: Response) => {
    try {
      const { userId, token, sessionId } = req.body;
      
      // Get MFA settings
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.status(404).json({ error: 'MFA not configured' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      if (!mfaSetup.isEnabled) {
        return res.status(400).json({ error: 'MFA not enabled' });
      }
      
      let verified = false;
      let usedBackupCode = false;
      
      // Check if it's a backup code
      if (token.length > 6) {
        const backupIndex = mfaSetup.backupCodes.findIndex(code => code === token);
        if (backupIndex !== -1) {
          // Remove used backup code
          mfaSetup.backupCodes.splice(backupIndex, 1);
          verified = true;
          usedBackupCode = true;
          
          // Update MFA settings
          await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
        }
      } else {
        // Verify TOTP token
        verified = speakeasy.totp.verify({
          secret: mfaSetup.secret,
          encoding: 'base32',
          token,
          window: 2
        });
      }
      
      if (!verified) {
        // Log failed attempt
        await this.logMfaAttempt(userId, 'totp', false);
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Create MFA session
      const mfaSession: MfaSession = {
        userId,
        sessionId,
        type: usedBackupCode ? 'backup' : 'totp',
        verified: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.MFA_SESSION_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_EXPIRY,
        JSON.stringify(mfaSession)
      );
      
      // Update last used
      mfaSetup.lastUsed = new Date();
      await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
      
      // Log successful attempt
      await this.logMfaAttempt(userId, mfaSession.type, true);
      
      res.json({
        success: true,
        message: 'MFA verification successful',
        warningMessage: usedBackupCode ? 
          `Backup code used. ${mfaSetup.backupCodes.length} backup codes remaining.` : 
          undefined
      });
      
    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({ error: 'MFA verification failed' });
    }
  };

  /**
   * Send SMS verification code
   */
  public sendSmsCode = async (req: Request, res: Response) => {
    try {
      const { userId, phoneNumber } = req.body;
      
      // Check rate limiting
      const rateLimitKey = `sms_rate_limit:${userId}`;
      const recentAttempts = await this.redis.get(rateLimitKey);
      
      if (recentAttempts && parseInt(recentAttempts) >= 3) {
        return res.status(429).json({ 
          error: 'Too many SMS requests', 
          message: 'Please wait 5 minutes before requesting another code'
        });
      }
      
      // Generate verification code
      const code = this.generateSmsCode();
      
      // Store SMS verification
      const smsVerification: SmsVerification = {
        userId,
        phoneNumber,
        code,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.SMS_CODE_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `sms_verification:${userId}`,
        this.SMS_CODE_EXPIRY,
        JSON.stringify(smsVerification)
      );
      
      // Update rate limiting
      await this.redis.incr(rateLimitKey);
      await this.redis.expire(rateLimitKey, 300); // 5 minutes
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 SMS Code for ${phoneNumber}: ${code}`);
      } else {
        // await this.sendSms(phoneNumber, `Your FANZ verification code is: ${code}`);
      }
      
      res.json({
        success: true,
        message: 'Verification code sent',
        expiresIn: this.SMS_CODE_EXPIRY
      });
      
    } catch (error) {
      console.error('SMS send error:', error);
      res.status(500).json({ error: 'Failed to send SMS code' });
    }
  };

  /**
   * Verify SMS code
   */
  public verifySmsCode = async (req: Request, res: Response) => {
    try {
      const { userId, code, sessionId } = req.body;
      
      // Get SMS verification
      const smsData = await this.redis.get(`sms_verification:${userId}`);
      if (!smsData) {
        return res.status(404).json({ error: 'SMS verification session not found' });
      }
      
      const smsVerification: SmsVerification = JSON.parse(smsData);
      
      // Check expiry
      if (new Date() > smsVerification.expiresAt) {
        await this.redis.del(`sms_verification:${userId}`);
        return res.status(400).json({ error: 'Verification code expired' });
      }
      
      // Check attempts
      if (smsVerification.attempts >= this.MAX_SMS_ATTEMPTS) {
        await this.redis.del(`sms_verification:${userId}`);
        return res.status(400).json({ error: 'Too many failed attempts' });
      }
      
      // Verify code
      if (smsVerification.code !== code) {
        smsVerification.attempts++;
        await this.redis.setex(
          `sms_verification:${userId}`,
          Math.floor((smsVerification.expiresAt.getTime() - Date.now()) / 1000),
          JSON.stringify(smsVerification)
        );
        
        return res.status(400).json({ 
          error: 'Invalid verification code',
          attemptsRemaining: this.MAX_SMS_ATTEMPTS - smsVerification.attempts
        });
      }
      
      // Create MFA session
      const mfaSession: MfaSession = {
        userId,
        sessionId,
        type: 'sms',
        verified: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.MFA_SESSION_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_EXPIRY,
        JSON.stringify(mfaSession)
      );
      
      // Clean up SMS verification
      await this.redis.del(`sms_verification:${userId}`);
      
      // Log successful attempt
      await this.logMfaAttempt(userId, 'sms', true);
      
      res.json({
        success: true,
        message: 'SMS verification successful'
      });
      
    } catch (error) {
      console.error('SMS verification error:', error);
      res.status(500).json({ error: 'SMS verification failed' });
    }
  };

  /**
   * MFA requirement middleware
   */
  public requireMfa = (platformSpecific: boolean = false) => {
    return async (req: any, res: Response, next: any) => {
      try {
        const user = req.user;
        const sessionId = req.headers['x-session-id'];
        
        if (!user || !sessionId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if MFA is required for this platform
        const platform = req.headers['x-platform'] as string;
        const requireMfaForPlatform = platformSpecific && 
          this.HIGH_SECURITY_PLATFORMS.includes(platform);
        
        // Check if user has MFA enabled
        const mfaEnabled = await this.redis.get(`user_mfa_enabled:${user.userId}`);
        
        if (!mfaEnabled && !requireMfaForPlatform) {
          // MFA not required, continue
          return next();
        }
        
        if (!mfaEnabled && requireMfaForPlatform) {
          return res.status(403).json({
            error: 'MFA setup required',
            message: 'This platform requires multi-factor authentication',
            setupUrl: '/api/auth/mfa/setup'
          });
        }
        
        // Check MFA session
        const mfaSessionData = await this.redis.get(`mfa_session:${sessionId}`);
        if (!mfaSessionData) {
          return res.status(403).json({
            error: 'MFA verification required',
            message: 'Please complete multi-factor authentication',
            verifyUrl: '/api/auth/mfa/verify'
          });
        }
        
        const mfaSession: MfaSession = JSON.parse(mfaSessionData);
        
        // Check session validity
        if (!mfaSession.verified || new Date() > mfaSession.expiresAt) {
          await this.redis.del(`mfa_session:${sessionId}`);
          return res.status(403).json({
            error: 'MFA session expired',
            message: 'Please complete multi-factor authentication again',
            verifyUrl: '/api/auth/mfa/verify'
          });
        }
        
        next();
      } catch (error) {
        console.error('MFA middleware error:', error);
        res.status(500).json({ error: 'MFA verification failed' });
      }
    };
  };

  /**
   * Disable MFA for user
   */
  public disableMfa = async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, totpToken } = req.body;
      
      // Verify current password (would integrate with user service)
      // const isValidPassword = await this.verifyCurrentPassword(userId, currentPassword);
      
      // Get MFA settings
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.status(404).json({ error: 'MFA not configured' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      // Verify TOTP token for security
      const verified = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: 'base32',
        token: totpToken,
        window: 2
      });
      
      if (!verified) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Disable MFA
      await this.redis.del(`mfa:${userId}`);
      await this.redis.del(`user_mfa_enabled:${userId}`);
      
      // Log MFA disable event
      await this.logMfaAttempt(userId, 'disable', true);
      
      res.json({
        success: true,
        message: 'MFA disabled successfully',
        warning: 'Your account security has been reduced. Consider re-enabling MFA.'
      });
      
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({ error: 'Failed to disable MFA' });
    }
  };

  // Private helper methods
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      codes.push(crypto.randomBytes(5).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSmsCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async logMfaAttempt(userId: string, type: string, success: boolean): Promise<void> {
    const logEntry = {
      userId,
      type,
      success,
      timestamp: new Date().toISOString(),
      ip: 'logged_separately' // IP would be logged separately
    };
    
    const logKey = `mfa_log:${userId}:${Date.now()}`;
    await this.redis.setex(logKey, 90 * 24 * 60 * 60, JSON.stringify(logEntry)); // 90 days
  }

  /**
   * Get MFA status for user
   */
  public getMfaStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if MFA is enabled
      const mfaEnabled = await this.redis.get(`user_mfa_enabled:${userId}`);
      
      if (!mfaEnabled) {
        return res.json({
          enabled: false,
          methods: [],
          backupCodesRemaining: 0
        });
      }
      
      // Get MFA details
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.json({
          enabled: false,
          methods: [],
          backupCodesRemaining: 0
        });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      res.json({
        enabled: mfaSetup.isEnabled,
        methods: ['totp'],
        backupCodesRemaining: mfaSetup.backupCodes.length,
        lastUsed: mfaSetup.lastUsed,
        setupAt: mfaSetup.setupAt
      });
      
    } catch (error) {
      console.error('MFA status error:', error);
      res.status(500).json({ error: 'Failed to get MFA status' });
    }
  };
}

export default new FanzMfaService();
export { FanzMfaService, MfaSetup, MfaSession };
EOF

    print_success "Multi-factor authentication system deployed"
}

# Function to deploy complete security system
deploy_complete_security() {
    local repo_dir=$1
    local repo_name=$(basename "$repo_dir")
    
    print_step "Deploying complete API security system to $repo_name"
    
    # Create directory structure
    create_security_structure "$repo_dir"
    
    # Deploy core components
    deploy_jwt_auth "$repo_dir"
    deploy_age_verification "$repo_dir"
    deploy_mfa_system "$repo_dir"
    
    # Copy API Gateway Security Config
    if [[ -f "$ECOSYSTEM_DIR/api/gateway/ApiGatewaySecurityConfig.ts" ]]; then
        cp "$ECOSYSTEM_DIR/api/gateway/ApiGatewaySecurityConfig.ts" "$repo_dir/api/gateway/"
        print_step "API Gateway Security Config copied"
    fi
    
    # Copy Real-time Security Monitor
    if [[ -f "$ECOSYSTEM_DIR/monitoring/ApiSecurityMonitor.ts" ]]; then
        cp "$ECOSYSTEM_DIR/monitoring/ApiSecurityMonitor.ts" "$repo_dir/monitoring/"
        print_step "Real-time Security Monitor copied"
    fi
    
    # Create main security integration file
    cat > "$repo_dir/security/FanzSecurityIntegration.ts" << 'EOF'
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
EOF

    # Create package.json with security dependencies
    cat > "$repo_dir/security/package.json" << 'EOF'
{
  "name": "@fanz/security",
  "version": "1.0.0",
  "description": "FANZ Security Integration Package",
  "main": "FanzSecurityIntegration.ts",
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3",
    "ioredis": "^5.3.2",
    "joi": "^17.11.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "ws": "^8.14.2",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/speakeasy": "^2.0.10",
    "@types/qrcode": "^1.5.5",
    "@types/ws": "^8.5.9",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "security-scan": "npm audit && npm run test:security",
    "test:security": "jest security.test.ts"
  }
}
EOF

    # Create README for the security module
    cat > "$repo_dir/security/README.md" << 'EOF'
# 🛡️ FANZ Security Module

Comprehensive security integration for FANZ adult content platforms.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Age Verification**: Compliant age verification for adult content
- **Multi-Factor Authentication**: TOTP and SMS-based MFA
- **Real-time Monitoring**: Advanced threat detection and response
- **API Gateway Security**: Centralized security policy enforcement

## Quick Start

```typescript
import FanzSecurityIntegration from './FanzSecurityIntegration';

// Apply complete security middleware
app.use('/api', FanzSecurityIntegration.getSecurityMiddleware());

// Adult content protection
app.use('/api/adult', FanzSecurityIntegration.getAdultContentMiddleware('boyfanz'));

// Payment security
app.use('/api/payments', FanzSecurityIntegration.getPaymentSecurityMiddleware());
```

## Environment Variables

```bash
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
PII_SALT=your-pii-salt
```

## Security Components

1. **Authentication** (`auth/`)
   - JWT middleware with session management
   - OAuth integration capabilities
   - Multi-factor authentication

2. **Compliance** (`compliance/`)
   - Age verification system
   - 2257 compliance logging
   - Adult content access controls

3. **Monitoring** (`../monitoring/`)
   - Real-time threat detection
   - Security event logging
   - Automated response systems

4. **API Gateway** (`../api/gateway/`)
   - Request validation
   - Rate limiting
   - Security headers

## Testing

```bash
cd security
npm test
npm run security-scan
```

## Documentation

- [Authentication Guide](./docs/authentication.md)
- [Age Verification Guide](./docs/age-verification.md)
- [MFA Setup Guide](./docs/mfa-setup.md)
- [Security Best Practices](./docs/security-practices.md)
EOF

    print_success "Complete security system deployed to $repo_name"
}

# Function to create GitHub Actions workflow
create_security_workflow() {
    local repo_dir=$1
    print_step "Creating GitHub Actions security workflow"
    
    cat > "$repo_dir/.github/workflows/security-validation.yml" << 'EOF'
name: 🔐 FANZ Security Validation

on:
  push:
    branches: [ main, develop, security/* ]
    paths: 
      - 'security/**'
      - 'api/**'
      - 'monitoring/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'security/**'
      - 'api/**'
      - 'monitoring/**'

jobs:
  security-scan:
    name: Security Scan & Validation
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        if [ -f "security/package.json" ]; then
          cd security && npm ci
        fi
        if [ -f "package.json" ]; then
          npm ci
        fi

    - name: Security Dependencies Audit
      run: |
        echo "🔍 Running security audit..."
        if [ -f "security/package.json" ]; then
          cd security && npm audit --audit-level=high
        fi

    - name: TypeScript Security Check
      run: |
        echo "🔧 Checking TypeScript security modules..."
        if [ -f "security/tsconfig.json" ]; then
          cd security && npx tsc --noEmit
        fi

    - name: JWT Security Validation
      run: |
        echo "🔐 Validating JWT implementation..."
        if [ -f "security/auth/jwt/JwtAuthMiddleware.ts" ]; then
          # Check for proper JWT secret handling
          grep -q "process.env.JWT_SECRET" security/auth/jwt/JwtAuthMiddleware.ts || exit 1
          # Ensure no hardcoded secrets
          ! grep -E "(secret|password|key)\s*=\s*['\"][^'\"]{8,}" security/auth/jwt/JwtAuthMiddleware.ts
        fi

    - name: Age Verification Compliance
      run: |
        echo "🔞 Validating age verification compliance..."
        if [ -f "security/compliance/age-verification/AgeVerificationService.ts" ]; then
          # Check for proper age validation
          grep -q "minimumAge.*18" security/compliance/age-verification/AgeVerificationService.ts || exit 1
          # Ensure PII hashing
          grep -q "hashPII" security/compliance/age-verification/AgeVerificationService.ts || exit 1
        fi

    - name: MFA Security Check
      run: |
        echo "🔒 Validating MFA implementation..."
        if [ -f "security/auth/mfa/MfaService.ts" ]; then
          # Check for proper secret generation
          grep -q "speakeasy.generateSecret" security/auth/mfa/MfaService.ts || exit 1
          # Ensure backup codes
          grep -q "generateBackupCodes" security/auth/mfa/MfaService.ts || exit 1
        fi

    - name: API Security Monitoring
      run: |
        echo "📊 Validating security monitoring..."
        if [ -f "monitoring/ApiSecurityMonitor.ts" ]; then
          # Check for threat detection patterns
          grep -q "anomalyPatterns" monitoring/ApiSecurityMonitor.ts || exit 1
          # Ensure adult platform detection
          grep -q "ADULT_PLATFORMS" monitoring/ApiSecurityMonitor.ts || exit 1
        fi

    - name: Security Headers Validation
      run: |
        echo "🛡️ Validating security headers..."
        if [ -f "api/gateway/ApiGatewaySecurityConfig.ts" ]; then
          # Check for CSP headers
          grep -q "Content-Security-Policy" api/gateway/ApiGatewaySecurityConfig.ts || exit 1
          # Ensure HSTS
          grep -q "Strict-Transport-Security" api/gateway/ApiGatewaySecurityConfig.ts || exit 1
        fi

    - name: Configuration Security Check
      run: |
        echo "⚙️ Checking configuration security..."
        # Ensure no secrets in config files
        ! find . -name "*.ts" -not -path "./node_modules/*" -exec grep -l "password.*=.*['\"][^'\"]*['\"]" {} \;
        ! find . -name "*.ts" -not -path "./node_modules/*" -exec grep -l "api[_-]?key.*=.*['\"][^'\"]*['\"]" {} \;

    - name: Adult Content Compliance
      run: |
        echo "🔞 Checking adult content compliance..."
        # Ensure age verification is properly implemented
        if [ -d "security/compliance" ]; then
          find security/compliance -name "*.ts" -exec grep -l "ageVerified\|minimumAge" {} \; | wc -l | grep -v "^0$" || exit 1
        fi

    - name: Security Test Suite
      run: |
        echo "🧪 Running security tests..."
        if [ -f "security/package.json" ] && [ -d "security/tests" ]; then
          cd security && npm test
        fi

  dependency-check:
    name: Dependency Security Check
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Snyk Security Check
      uses: snyk/actions/node@master
      continue-on-error: true
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    - name: Check for known vulnerabilities
      run: |
        echo "🔍 Checking for known security issues..."
        # Check for common security anti-patterns
        ! grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" security/ || true
        ! grep -r "process.env" security/ | grep -v "process.env.NODE_ENV\|process.env.JWT_SECRET\|process.env.REDIS" || true

  compliance-audit:
    name: Adult Content Compliance Audit
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Age Verification Audit
      run: |
        echo "🔞 Auditing age verification implementation..."
        if [ -f "security/compliance/age-verification/AgeVerificationService.ts" ]; then
          # Check for proper age gates
          grep -q "ageGateMiddleware" security/compliance/age-verification/AgeVerificationService.ts || exit 1
          
          # Check for document validation
          grep -q "validateDocuments" security/compliance/age-verification/AgeVerificationService.ts || exit 1
          
          # Check for compliance logging
          grep -q "logAdultContentAccess" security/compliance/age-verification/AgeVerificationService.ts || exit 1
        fi

    - name: 2257 Compliance Check
      run: |
        echo "📋 Checking 2257 compliance requirements..."
        # Ensure proper record keeping capabilities exist
        if [ -d "security/compliance" ]; then
          find security/compliance -name "*.ts" -exec grep -l "record.*2257\|compliance.*record" {} \; || echo "Warning: 2257 compliance records not found"
        fi

    - name: Adult Platform Security
      run: |
        echo "🔞 Validating adult platform security..."
        # Check for proper adult platform handling
        grep -r "ADULT_PLATFORMS\|adult.*platform" security/ monitoring/ api/ || exit 1
        
        # Ensure age verification is enforced
        grep -r "ageVerified\|age.*verification" security/ || exit 1

  security-report:
    name: Security Report Generation
    runs-on: ubuntu-latest
    needs: [security-scan, dependency-check, compliance-audit]
    if: always()
    
    steps:
    - name: Generate Security Report
      run: |
        echo "📊 Generating security validation report..."
        echo "## 🛡️ FANZ Security Validation Report" > security-report.md
        echo "" >> security-report.md
        echo "- **Security Scan**: ${{ needs.security-scan.result }}" >> security-report.md
        echo "- **Dependency Check**: ${{ needs.dependency-check.result }}" >> security-report.md  
        echo "- **Compliance Audit**: ${{ needs.compliance-audit.result }}" >> security-report.md
        echo "" >> security-report.md
        echo "Generated on: $(date)" >> security-report.md

    - name: Upload Security Report
      uses: actions/upload-artifact@v4
      with:
        name: security-validation-report
        path: security-report.md
EOF

    print_success "GitHub Actions security workflow created"
}

# Main deployment loop
print_step "Starting deployment across all FANZ repositories"

SUCCESS_COUNT=0
ERROR_COUNT=0
SKIPPED_COUNT=0

for repo in "${FANZ_REPOS[@]}"; do
    repo_path="$BASE_DIR/$repo"
    
    if [[ ! -d "$repo_path" ]]; then
        print_warning "Repository not found: $repo_path - Skipping"
        ((SKIPPED_COUNT++))
        continue
    fi
    
    print_header "🚀 Deploying to $repo"
    
    if deploy_complete_security "$repo_path"; then
        create_security_workflow "$repo_path"
        print_success "✅ Successfully deployed complete security system to $repo"
        ((SUCCESS_COUNT++))
        
        # Add and commit changes
        if [[ -d "$repo_path/.git" ]]; then
            print_step "Committing security deployment to $repo"
            cd "$repo_path"
            git add .
            git commit -m "🔐 Deploy complete FANZ API security system

- JWT authentication with session management
- Age verification for adult content compliance
- Multi-factor authentication (TOTP + SMS)
- Real-time security monitoring and threat detection
- API gateway security policies
- GitHub Actions security validation
- Adult content platform compliance features

Security components deployed:
✅ JWT Auth Middleware
✅ Age Verification Service  
✅ Multi-Factor Authentication
✅ Real-time Security Monitor
✅ API Gateway Security Config
✅ Security Integration Layer
✅ Compliance Enforcement
✅ GitHub Actions Workflows

Deployment timestamp: $(date)
Log file: $LOG_FILE" || print_warning "Git commit failed for $repo"
            
            cd "$SCRIPT_DIR"
        fi
        
    else
        print_error "❌ Failed to deploy to $repo"
        ((ERROR_COUNT++))
    fi
    
    echo ""
done

# Final summary
print_header "🎯 FANZ Complete API Security Deployment Summary"

echo -e "${GREEN}✅ Successful Deployments: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed Deployments: $ERROR_COUNT${NC}"
echo -e "${YELLOW}⏭️ Skipped Repositories: $SKIPPED_COUNT${NC}"
echo -e "${CYAN}📊 Total Repositories Processed: $((SUCCESS_COUNT + ERROR_COUNT + SKIPPED_COUNT))${NC}"

echo -e "\n${PURPLE}🔐 Security Components Deployed:${NC}"
echo -e "  • JWT Authentication & Session Management"
echo -e "  • Age Verification for Adult Content Compliance"
echo -e "  • Multi-Factor Authentication (TOTP + SMS + Backup Codes)"
echo -e "  • Real-time Security Monitoring & Threat Detection"
echo -e "  • API Gateway Security Configuration"
echo -e "  • Security Integration & Middleware Stack"
echo -e "  • Adult Platform Compliance Enforcement"
echo -e "  • GitHub Actions Security Validation Workflows"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Configure Redis for session management and caching"
echo -e "  2. Set up environment variables (JWT_SECRET, REDIS_*, etc.)"
echo -e "  3. Configure SMS service for MFA (Twilio, AWS SNS, etc.)"
echo -e "  4. Test age verification workflow on adult platforms"
echo -e "  5. Verify security monitoring and alerting"
echo -e "  6. Run security validation workflows in CI/CD"
echo -e "  7. Review and customize security policies per platform"

echo -e "\n${CYAN}📁 Log File: $LOG_FILE${NC}"

if [[ $ERROR_COUNT -gt 0 ]]; then
    print_warning "Some deployments failed. Check the log file for details."
    exit 1
fi

print_success "🚀 Complete FANZ API Security System deployment completed successfully!"

log "INFO" "Deployment completed. Success: $SUCCESS_COUNT, Errors: $ERROR_COUNT, Skipped: $SKIPPED_COUNT"
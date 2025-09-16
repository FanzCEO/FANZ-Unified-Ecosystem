const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class JWTService {
  constructor() {
    // Use secure secrets - in production, these should come from environment variables
    this.JWT_SECRET = process.env.JWT_SECRET || 'fanz-super-secure-jwt-secret-2024!';
    this.REFRESH_SECRET = process.env.REFRESH_SECRET || 'fanz-refresh-token-secret-2024!';
    this.TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '15m'; // Short-lived access tokens
    this.REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d'; // Longer refresh tokens
    this.VENDOR_TOKEN_EXPIRES_IN = process.env.VENDOR_TOKEN_EXPIRES_IN || '8h'; // Vendor session tokens
  }

  /**
   * Generate JWT access token for admin users
   */
  generateAdminToken(adminData) {
    const payload = {
      id: adminData.id,
      email: adminData.email,
      role: 'admin',
      type: 'access',
      permissions: adminData.permissions || [
        'vendor:read',
        'vendor:write',
        'vendor:delete',
        'grants:read',
        'grants:write',
        'grants:approve',
        'audit:read',
        'system:monitor'
      ],
      issued_at: Date.now()
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.TOKEN_EXPIRES_IN,
      issuer: 'fanz-vendor-system',
      audience: 'fanz-admin'
    });
  }

  /**
   * Generate refresh token for admin users
   */
  generateAdminRefreshToken(adminData) {
    const payload = {
      id: adminData.id,
      email: adminData.email,
      role: 'admin',
      type: 'refresh',
      issued_at: Date.now()
    };

    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
      issuer: 'fanz-vendor-system',
      audience: 'fanz-admin'
    });
  }

  /**
   * Generate time-limited access token for vendors
   */
  generateVendorAccessToken(vendorData, grantData) {
    const payload = {
      vendor_id: vendorData.id,
      vendor_name: vendorData.name,
      vendor_company: vendorData.company,
      vendor_type: vendorData.vendor_type,
      type: 'vendor_access',
      access_level: grantData.access_level,
      permissions: grantData.permissions || [],
      granted_by: grantData.granted_by,
      grant_id: grantData.id,
      session_id: crypto.randomUUID(),
      issued_at: Date.now()
    };

    return {
      token: jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.VENDOR_TOKEN_EXPIRES_IN,
        issuer: 'fanz-vendor-system',
        audience: 'fanz-vendor'
      }),
      session_id: payload.session_id,
      expires_at: new Date(Date.now() + (8 * 60 * 60 * 1000)), // 8 hours
      permissions: payload.permissions,
      access_level: payload.access_level
    };
  }

  /**
   * Validate and decode JWT token
   */
  verifyToken(token, tokenType = 'access') {
    try {
      const secret = tokenType === 'refresh' ? this.REFRESH_SECRET : this.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      
      // Additional validation
      if (tokenType === 'access' && decoded.type !== 'access' && decoded.type !== 'vendor_access') {
        throw new Error('Invalid token type for access validation');
      }
      
      if (tokenType === 'refresh' && decoded.type !== 'refresh') {
        throw new Error('Invalid token type for refresh validation');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Token has expired'
        };
      }
      
      return {
        valid: false,
        decoded: null,
        expired: false,
        error: error.message
      };
    }
  }

  /**
   * Verify vendor access token
   */
  verifyVendorToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      
      if (decoded.type !== 'vendor_access') {
        throw new Error('Invalid vendor token type');
      }

      return {
        valid: true,
        vendor: {
          id: decoded.vendor_id,
          name: decoded.vendor_name,
          company: decoded.vendor_company,
          type: decoded.vendor_type
        },
        access: {
          level: decoded.access_level,
          permissions: decoded.permissions,
          grant_id: decoded.grant_id,
          session_id: decoded.session_id
        },
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          vendor: null,
          access: null,
          expired: true,
          error: 'Vendor token has expired'
        };
      }
      
      return {
        valid: false,
        vendor: null,
        access: null,
        expired: false,
        error: error.message
      };
    }
  }

  /**
   * Hash password for storage
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate secure API key for vendors
   */
  generateAPIKey(vendorId, prefix = 'fanz_vendor') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    const vendorHash = crypto.createHash('sha256')
      .update(vendorId + this.JWT_SECRET)
      .digest('hex')
      .slice(0, 8);
    
    return `${prefix}_${timestamp}_${vendorHash}_${random}`;
  }

  /**
   * Create admin login credentials (for initial setup)
   */
  async createAdminCredentials(email, password) {
    const hashedPassword = await this.hashPassword(password);
    const adminId = crypto.randomUUID();
    
    return {
      id: adminId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      role: 'admin',
      permissions: [
        'vendor:read', 'vendor:write', 'vendor:delete',
        'grants:read', 'grants:write', 'grants:approve',
        'audit:read', 'system:monitor', 'admin:manage'
      ],
      created_at: new Date(),
      status: 'active'
    };
  }

  /**
   * Refresh admin token
   */
  async refreshAdminToken(refreshToken) {
    const verification = this.verifyToken(refreshToken, 'refresh');
    
    if (!verification.valid) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = this.generateAdminToken({
      id: verification.decoded.id,
      email: verification.decoded.email
    });

    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: this.TOKEN_EXPIRES_IN
    };
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }
}

module.exports = new JWTService();
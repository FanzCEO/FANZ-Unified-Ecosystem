/**
 * FANZ SSO Authentication Routes
 * Handles login, logout, and platform-specific auth flows
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, platform } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'missing_credentials',
        message: 'Email and password are required'
      });
    }

    // TODO: Replace with actual user database lookup
    // For demo purposes, accepting any email/password
    const user = {
      id: 'demo-user-123',
      email: email,
      name: 'Demo User',
      platforms: ['FanzSSO', 'girlfanz', 'pupfanz', 'taboofanz'],
      creator_status: 'active',
      age_verified: true,
      roles: ['user']
    };

    // In production, verify password:
    // const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = true; // Demo mode

    if (!isValid) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        platform_access: user.platforms,
        creator_status: user.creator_status,
        age_verified: user.age_verified,
        roles: user.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { algorithm: 'HS256' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        platforms: user.platforms,
        creator_status: user.creator_status,
        age_verified: user.age_verified
      },
      platform: platform || 'fanzdash'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'login_failed',
      message: 'Authentication service error'
    });
  }
});

// Platform-specific authentication
router.get('/platforms/:platform/authorize', (req, res) => {
  const { platform } = req.params;
  const validPlatforms = [
    'FanzSSO', 'girlfanz', 'pupfanz', 'taboofanz', 
    'transfanz', 'daddiesfanz', 'cougarfanz'
  ];

  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({
      error: 'invalid_platform',
      message: `Platform ${platform} is not supported`
    });
  }

  // Build authorization URL
  const authUrl = new URL(`/oidc/auth`, req.protocol + '://' + req.get('host'));
  authUrl.searchParams.set('client_id', platform);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email fanz:platform');
  authUrl.searchParams.set('redirect_uri', req.query.redirect_uri || `https://${platform}.com/auth/callback`);
  authUrl.searchParams.set('state', req.query.state || 'random-state');

  res.json({
    authorization_url: authUrl.toString(),
    platform,
    scopes: ['openid', 'profile', 'email', 'fanz:platform']
  });
});

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'missing_refresh_token',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_SECRET || 'dev-jwt-secret');
    } catch (error) {
      return res.status(401).json({
        error: 'invalid_refresh_token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        platform_access: decoded.platform_access,
        creator_status: decoded.creator_status,
        age_verified: decoded.age_verified,
        roles: decoded.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { algorithm: 'HS256' }
    );

    res.json({
      success: true,
      token: newToken,
      expires_in: 3600
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'refresh_failed',
      message: 'Token refresh failed'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // In a real implementation, you would:
  // 1. Invalidate the token in Redis
  // 2. Clear session data
  // 3. Revoke refresh tokens
  
  res.json({
    success: true,
    message: 'Successfully logged out from FANZ SSO'
  });
});

// Validate token endpoint
router.get('/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      valid: false,
      error: 'missing_token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret');
    res.json({
      valid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        platforms: decoded.platform_access,
        creator_status: decoded.creator_status,
        age_verified: decoded.age_verified,
        roles: decoded.roles
      },
      expires_at: decoded.exp
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'invalid_token',
      message: error.message
    });
  }
});

module.exports = router;
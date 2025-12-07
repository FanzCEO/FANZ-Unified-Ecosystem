/**
 * FANZ SSO Configuration
 * OIDC Provider settings for unified authentication
 */

const oidcConfig = {
  // Basic provider configuration
  clients: [
    {
      client_id: 'FanzSSO',
      client_secret: process.env.FanzSSO_CLIENT_SECRET || 'dev-secret-FanzSSO',
      redirect_uris: [
        'https://FanzSSO.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'girlfanz',
      client_secret: process.env.GIRLFANZ_CLIENT_SECRET || 'dev-secret-girlfanz',
      redirect_uris: [
        'https://girlfanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'pupfanz',
      client_secret: process.env.PUPFANZ_CLIENT_SECRET || 'dev-secret-pupfanz',
      redirect_uris: [
        'https://pupfanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'taboofanz',
      client_secret: process.env.TABOOFANZ_CLIENT_SECRET || 'dev-secret-taboofanz',
      redirect_uris: [
        'https://taboofanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'transfanz',
      client_secret: process.env.TRANSFANZ_CLIENT_SECRET || 'dev-secret-transfanz',
      redirect_uris: [
        'https://transfanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'daddiesfanz',
      client_secret: process.env.DADDIESFANZ_CLIENT_SECRET || 'dev-secret-daddiesfanz',
      redirect_uris: [
        'https://daddiesfanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'cougarfanz',
      client_secret: process.env.COUGARFANZ_CLIENT_SECRET || 'dev-secret-cougarfanz',
      redirect_uris: [
        'https://cougarfanz.com/auth/callback',
        'http://localhost:3000/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:platform'
    },
    {
      client_id: 'fanzdash',
      client_secret: process.env.FANZDASH_CLIENT_SECRET || 'dev-secret-fanzdash',
      redirect_uris: [
        'https://dash.fanz.foundation/auth/callback',
        'http://localhost:3100/auth/callback'
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'openid profile email fanz:admin fanz:platform'
    }
  ],

  // Features
  features: {
    devInteractions: { enabled: false }, // Disable in production
    deviceFlow: { enabled: true },
    introspection: { enabled: true },
    revocation: { enabled: true },
    userinfo: { enabled: true }
  },

  // Claims configuration
  claims: {
    openid: ['sub'],
    profile: ['name', 'username', 'preferred_username', 'given_name', 'family_name', 'picture'],
    email: ['email', 'email_verified'],
    fanz: ['platform_roles', 'creator_status', 'verification_status', 'age_verified']
  },

  // Custom scopes for FANZ ecosystem
  scopes: [
    'openid',
    'profile', 
    'email',
    'fanz:platform',  // Access to platform features
    'fanz:creator',   // Creator-specific permissions
    'fanz:admin',     // Admin/moderation permissions
    'fanz:billing'    // Billing and payment access
  ],

  // Token configuration
  ttl: {
    AccessToken: 60 * 60, // 1 hour
    AuthorizationCode: 10 * 60, // 10 minutes
    IdToken: 60 * 60, // 1 hour
    RefreshToken: 14 * 24 * 60 * 60, // 14 days
    Session: 14 * 24 * 60 * 60 // 14 days
  },

  // Cookies configuration
  cookies: {
    long: { signed: true, maxAge: 14 * 24 * 60 * 60 * 1000 }, // 14 days
    short: { signed: true },
    keys: [process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-prod']
  },

  // Skip JWKS for development - will use default

  // Adapter for storage
  adapter: require('./storage-adapter'),

  // Custom user authentication
  findAccount: async (ctx, id) => {
    // This should integrate with your user database
    const account = {
      accountId: id,
      async claims(use, scope) {
        return {
          sub: id,
          name: `User ${id}`,
          email: `user${id}@fanz.local`,
          platform_roles: ['user'],
          creator_status: 'active',
          verification_status: 'verified',
          age_verified: true
        };
      }
    };
    return account;
  }
};

module.exports = {
  oidcConfig
};
// FANZ SSO Configuration
export const SSO_CONFIG = {
  issuer: process.env.FANZ_SSO_URL || 'https://sso.fanz.fans',
  client_id: process.env.FANZ_CLIENT_ID || 'replace-with-actual-client-id',
  client_secret: process.env.FANZ_CLIENT_SECRET || 'replace-with-actual-client-secret',
  redirect_uri: process.env.FANZ_REDIRECT_URI || 'https://localhost:3000/auth/callback',
  scopes: ['openid', 'profile', 'email', 'fanz:creator', 'fanz:fan'],
  
  // Adult content specific scopes
  adult_scopes: ['fanz:age_verified', 'fanz:2257_compliant'],
  
  // Profile API endpoints
  profile_api: process.env.FANZ_PROFILE_API || 'https://profile-api.fanz.fans',
  
  // Cross-platform domains for SSO
  allowed_domains: [
    'boyfanz.com',
    'girlfanz.com', 
    'pupfanz.com',
    'taboofanz.com',
    'transfanz.com',
    'daddiesfanz.com',
    'cougarfanz.com',
    'fanz.tube',
    'fanz.cam',
    'fanz.fans'
  ]
};

export type FanzUser = {
  id: string;
  email: string;
  username: string;
  verified: boolean;
  age_verified: boolean;
  roles: ('fan' | 'creator' | 'moderator' | 'admin')[];
  platforms: string[];
  preferences: {
    pronouns?: string;
    content_preferences?: string[];
    privacy_level: 'public' | 'private' | 'selective';
  };
  compliance: {
    kyc_verified: boolean;
    age_verification_date?: string;
    document_status: '2257_compliant' | 'pending' | 'not_required';
  };
};

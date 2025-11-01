// FANZ SSO Authentication Middleware
import { SSO_CONFIG, type FanzUser } from '../config/sso';

export class FanzAuth {
  private static instance: FanzAuth;
  
  public static getInstance(): FanzAuth {
    if (!FanzAuth.instance) {
      FanzAuth.instance = new FanzAuth();
    }
    return FanzAuth.instance;
  }
  
  async getLoginUrl(state?: string): Promise<string> {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SSO_CONFIG.client_id,
      redirect_uri: SSO_CONFIG.redirect_uri,
      scope: SSO_CONFIG.scopes.join(' '),
      state: state || this.generateState(),
    });
    
    return `${SSO_CONFIG.issuer}/auth?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; id_token: string }> {
    const response = await fetch(`${SSO_CONFIG.issuer}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: SSO_CONFIG.client_id,
        client_secret: SSO_CONFIG.client_secret,
        code,
        redirect_uri: SSO_CONFIG.redirect_uri,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    return response.json();
  }
  
  async getProfile(access_token: string): Promise<FanzUser> {
    const response = await fetch(`${SSO_CONFIG.profile_api}/profile`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  }
  
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${SSO_CONFIG.issuer}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

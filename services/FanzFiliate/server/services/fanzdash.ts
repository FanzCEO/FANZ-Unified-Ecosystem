import { storage } from '../storage';

// FanzDash client configuration
const FANZDASH_API_URL = process.env.FANZDASH_API_URL;
const FANZDASH_API_KEY = process.env.FANZDASH_API_KEY;
const FANZDASH_CLUSTER_ID = process.env.FANZDASH_CLUSTER_ID || 'fanzfiliate';

interface FanzDashMetrics {
  clusterId: string;
  timestamp: string;
  metrics: {
    users: {
      total: number;
      active: number;
      affiliates: number;
      advertisers: number;
      kycApproved: number;
    };
    financial: {
      totalEarnings: number;
      availableBalance: number;
      pendingBalance: number;
      totalPayouts: number;
    };
    activity: {
      totalClicks: number;
      totalConversions: number;
      conversionRate: number;
      offersActive: number;
    };
    compliance: {
      kycCompletionRate: number;
      averageKycTier: number;
    };
  };
}

interface FanzDashEvent {
  clusterId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * FanzDash Integration Service
 * Handles metrics reporting and event publishing to the central FanzDash platform
 */
export class FanzDashService {
  private static instance: FanzDashService;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): FanzDashService {
    if (!FanzDashService.instance) {
      FanzDashService.instance = new FanzDashService();
    }
    return FanzDashService.instance;
  }

  /**
   * Initialize FanzDash integration
   */
  public async initialize(): Promise<void> {
    if (!FANZDASH_API_URL || !FANZDASH_API_KEY) {
      console.warn('FanzDash integration not configured - metrics reporting disabled');
      return;
    }

    console.log(`🔗 Initializing FanzDash integration for cluster: ${FANZDASH_CLUSTER_ID}`);

    // Register cluster with FanzDash
    await this.registerCluster();

    // Start periodic metrics reporting (every 5 minutes)
    this.metricsInterval = setInterval(() => {
      this.reportMetrics().catch(error => {
        console.error('FanzDash metrics reporting error:', error);
      });
    }, 5 * 60 * 1000);

    // Send initial metrics
    await this.reportMetrics();

    console.log('✅ FanzDash integration initialized');
  }

  /**
   * Register cluster with FanzDash
   */
  private async registerCluster(): Promise<void> {
    try {
      const registrationData = {
        clusterId: FANZDASH_CLUSTER_ID,
        name: 'FanzFiliate',
        type: 'affiliate_platform',
        version: '1.0.0',
        capabilities: [
          'affiliate_tracking',
          'offer_management',
          'payout_processing',
          'kyc_compliance',
          'analytics'
        ],
        endpoints: {
          health: '/api/health',
          system: '/api/system',
          metrics: '/api/metrics'
        }
      };

      await this.makeRequest('POST', '/clusters/register', registrationData);
      console.log(`📡 Cluster registered with FanzDash: ${FANZDASH_CLUSTER_ID}`);

    } catch (error) {
      console.error('FanzDash cluster registration failed:', error);
    }
  }

  /**
   * Collect and report platform metrics to FanzDash
   */
  public async reportMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      
      await this.makeRequest('POST', `/clusters/${FANZDASH_CLUSTER_ID}/metrics`, metrics);
      
      console.log(`📊 Metrics reported to FanzDash: ${metrics.metrics.users.total} users, $${metrics.metrics.financial.totalEarnings} earnings`);

    } catch (error) {
      console.error('FanzDash metrics reporting failed:', error);
    }
  }

  /**
   * Collect platform metrics
   */
  public async collectMetrics(): Promise<FanzDashMetrics> {
    // Get all users
    const allUsers = await this.getAllUsers();
    const affiliates = allUsers.filter(u => u.role === 'affiliate');
    const advertisers = allUsers.filter(u => u.role === 'advertiser');
    const kycApproved = allUsers.filter(u => u.kycStatus === 'approved');

    // Get financial data
    const allBalances = await this.getAllBalances();
    const totalEarnings = allBalances.reduce((sum, b) => sum + parseFloat(b.totalEarnings || '0'), 0);
    const availableBalance = allBalances.reduce((sum, b) => sum + parseFloat(b.availableBalance || '0'), 0);
    const pendingBalance = allBalances.reduce((sum, b) => sum + parseFloat(b.pendingBalance || '0'), 0);

    // Get activity data
    const allOffers = await storage.getOffers();
    const activeOffers = allOffers.filter(o => o.isActive && o.status === 'approved');
    
    // Calculate conversion metrics (simplified)
    const totalClicks = await this.getTotalClicks();
    const totalConversions = await this.getTotalConversions();
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Calculate KYC metrics
    const kycCompletionRate = allUsers.length > 0 ? (kycApproved.length / allUsers.length) * 100 : 0;
    const averageKycTier = allUsers.length > 0 ? 
      allUsers.reduce((sum, u) => sum + u.kycTier, 0) / allUsers.length : 0;

    return {
      clusterId: FANZDASH_CLUSTER_ID,
      timestamp: new Date().toISOString(),
      metrics: {
        users: {
          total: allUsers.length,
          active: allUsers.filter(u => u.isActive).length,
          affiliates: affiliates.length,
          advertisers: advertisers.length,
          kycApproved: kycApproved.length,
        },
        financial: {
          totalEarnings,
          availableBalance,
          pendingBalance,
          totalPayouts: 0, // Would need to implement payout tracking
        },
        activity: {
          totalClicks,
          totalConversions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          offersActive: activeOffers.length,
        },
        compliance: {
          kycCompletionRate: Math.round(kycCompletionRate * 100) / 100,
          averageKycTier: Math.round(averageKycTier * 100) / 100,
        },
      },
    };
  }

  /**
   * Publish event to FanzDash
   */
  public async publishEvent(eventType: string, data: Record<string, any>): Promise<void> {
    if (!FANZDASH_API_URL || !FANZDASH_API_KEY) {
      return; // Silently skip if not configured
    }

    try {
      const event: FanzDashEvent = {
        clusterId: FANZDASH_CLUSTER_ID,
        eventType,
        timestamp: new Date().toISOString(),
        data,
      };

      await this.makeRequest('POST', `/clusters/${FANZDASH_CLUSTER_ID}/events`, event);
      
    } catch (error) {
      console.error(`FanzDash event publishing failed (${eventType}):`, error);
    }
  }

  /**
   * Publish user registration event
   */
  public async publishUserRegistration(user: any): Promise<void> {
    await this.publishEvent('user.registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: user.createdAt,
    });
  }

  /**
   * Publish KYC status change event
   */
  public async publishKYCStatusChange(user: any, oldStatus: string, newStatus: string): Promise<void> {
    await this.publishEvent('kyc.status_changed', {
      userId: user.id,
      email: user.email,
      oldStatus,
      newStatus,
      tier: user.kycTier,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish payout request event
   */
  public async publishPayoutRequest(payout: any): Promise<void> {
    await this.publishEvent('payout.requested', {
      payoutId: payout.id,
      userId: payout.affiliateId,
      amount: payout.amount,
      currency: payout.currency,
      provider: payout.provider,
      timestamp: payout.createdAt,
    });
  }

  /**
   * Publish conversion event
   */
  public async publishConversion(conversion: any): Promise<void> {
    await this.publishEvent('conversion.created', {
      conversionId: conversion.id,
      userId: conversion.affiliateId,
      offerId: conversion.offerId,
      amount: conversion.amount,
      commission: conversion.commission,
      status: conversion.status,
      timestamp: conversion.createdAt,
    });
  }

  /**
   * Make HTTP request to FanzDash API
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!FANZDASH_API_URL || !FANZDASH_API_KEY) {
      throw new Error('FanzDash not configured');
    }

    const url = `${FANZDASH_API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FANZDASH_API_KEY}`,
        'X-Cluster-ID': FANZDASH_CLUSTER_ID,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`FanzDash API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Helper methods to get data from storage
   */
  private async getAllUsers(): Promise<any[]> {
    // Since MemStorage doesn't have a getUsers method, we'll simulate it
    // In a real database implementation, this would be a proper query
    const userIds = ['aff-1', 'adv-1']; // Seed user IDs
    const users = [];
    for (const id of userIds) {
      const user = await storage.getUser(id);
      if (user) users.push(user);
    }
    return users;
  }

  private async getAllBalances(): Promise<any[]> {
    // Simulate getting all balances
    const balance = await storage.getUserBalance('aff-1');
    return balance ? [balance] : [];
  }

  private async getTotalClicks(): Promise<number> {
    // Simulate getting total clicks
    const clicks = await storage.getClicksByAffiliate('aff-1', 1000);
    return clicks.length;
  }

  private async getTotalConversions(): Promise<number> {
    // Simulate getting total conversions
    const conversions = await storage.getConversionsByAffiliate('aff-1', 1000);
    return conversions.length;
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('FanzDash integration shutdown');
  }
}

// Global fetch polyfill for Node.js if needed
if (!global.fetch) {
  try {
    // @ts-ignore
    global.fetch = require('node-fetch');
  } catch (error) {
    console.warn('node-fetch not available - FanzDash integration may not work in all environments');
  }
}

// Export singleton instance
export const fanzDashService = FanzDashService.getInstance();

import { 
  type User, 
  type InsertUser, 
  type Offer, 
  type InsertOffer,
  type Click,
  type InsertClick,
  type Conversion,
  type InsertConversion,
  type Payout,
  type InsertPayout,
  type UserBalance,
  type InsertUserBalance,
  type Creative,
  type InsertCreative,
  type TrackingLink,
  type InsertTrackingLink
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySsoId(ssoUserId: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Offer methods
  getOffers(filters?: { status?: string; advertiserId?: string; isActive?: boolean }): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | undefined>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer>;
  
  // Click methods
  createClick(click: InsertClick): Promise<Click>;
  getClicksByAffiliate(affiliateId: string, limit?: number): Promise<Click[]>;
  getClick(id: string): Promise<Click | undefined>;
  
  // Conversion methods
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  updateConversion(id: string, updates: Partial<Conversion>): Promise<Conversion>;
  getConversionsByAffiliate(affiliateId: string, limit?: number): Promise<Conversion[]>;
  getConversionByTxid(txid: string): Promise<Conversion | undefined>;
  
  // Payout methods
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: string, updates: Partial<Payout>): Promise<Payout>;
  getPayoutsByAffiliate(affiliateId: string): Promise<Payout[]>;
  
  // Balance methods
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  createOrUpdateBalance(balance: InsertUserBalance & { userId: string }): Promise<UserBalance>;
  
  // Creative methods
  getCreatives(offerId: string): Promise<Creative[]>;
  createCreative(creative: InsertCreative): Promise<Creative>;
  
  // Tracking Link methods
  getTrackingLinks(affiliateId: string): Promise<TrackingLink[]>;
  getTrackingLinkByCode(code: string): Promise<TrackingLink | undefined>;
  createTrackingLink(link: InsertTrackingLink): Promise<TrackingLink>;
  
  // Balance helper methods
  updateBalance(userId: string, updates: Partial<InsertUserBalance>): Promise<UserBalance>;
  getBalance(userId: string): Promise<UserBalance | undefined>;
  
  // Analytics methods
  getAffiliateStats(affiliateId: string, days?: number): Promise<{
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    epc: number;
  }>;
  getAffiliateAnalytics(affiliateId: string): Promise<{
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    epc: number;
  }>;
  getAffiliateAnalyticsByPeriod(affiliateId: string, period: string): Promise<any>;
  
  // Clicks methods
  getClicks(affiliateId: string): Promise<Click[]>;
  
  // Conversions methods  
  getConversions(affiliateId: string): Promise<Conversion[]>;
  
  // Payouts methods
  getPayouts(affiliateId: string): Promise<Payout[]>;
  createPayoutRequest(payout: InsertPayout): Promise<Payout>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private offers: Map<string, Offer>;
  private clicks: Map<string, Click>;
  private conversions: Map<string, Conversion>;
  private payouts: Map<string, Payout>;
  private balances: Map<string, UserBalance>;
  private creatives: Map<string, Creative>;
  private trackingLinks: Map<string, TrackingLink>;

  constructor() {
    this.users = new Map();
    this.offers = new Map();
    this.clicks = new Map();
    this.conversions = new Map();
    this.payouts = new Map();
    this.balances = new Map();
    this.creatives = new Map();
    this.trackingLinks = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Create sample users
    const affiliateUser: User = {
      id: "aff-1",
      ssoUserId: "sso-aff-1",
      email: "john@example.com",
      username: "johnaffiliate",
      name: "John Affiliate",
      role: "affiliate",
      kycStatus: "approved",
      kycTier: 2,
      kycVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const advertiserUser: User = {
      id: "adv-1",
      ssoUserId: "sso-adv-1",
      email: "advertiser@example.com",
      username: "advertiser1",
      name: "Premium Dating Co",
      role: "advertiser",
      kycStatus: "approved",
      kycTier: 2,
      kycVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(affiliateUser.id, affiliateUser);
    this.users.set(advertiserUser.id, advertiserUser);

    // Create sample offers
    const offer1: Offer = {
      id: "offer-1",
      advertiserId: "adv-1",
      name: "Premium Dating Platform - Adult",
      description: "High-converting adult dating platform with global reach. SOI offers available.",
      status: "approved",
      payoutAmount: "45.00",
      payoutCurrency: "USD",
      conversionType: "CPA",
      isAdultContent: true,
      allowedTrafficTypes: ["adult", "email", "push", "native"],
      allowedGeos: ["US", "CA", "GB", "AU"],
      restrictedGeos: [],
      conversionRate: "3.20",
      landingPageUrl: "https://example-dating.com/signup",
      trackingDomain: "trk.myfanz.network",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const offer2: Offer = {
      id: "offer-2",
      advertiserId: "adv-1",
      name: "Cam Site Membership",
      description: "Leading cam platform with high-value customers. RevShare + CPA hybrid available.",
      status: "approved",
      payoutAmount: "35.00",
      payoutCurrency: "USD",
      conversionType: "Hybrid",
      isAdultContent: true,
      allowedTrafficTypes: ["adult", "tube", "cam", "email"],
      allowedGeos: ["*"],
      restrictedGeos: [],
      conversionRate: "2.80",
      landingPageUrl: "https://example-cams.com/join",
      trackingDomain: "trk.myfanz.network",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.offers.set(offer1.id, offer1);
    this.offers.set(offer2.id, offer2);

    // Create sample balance
    const balance: UserBalance = {
      id: "balance-1",
      userId: "aff-1",
      availableBalance: "2847.50",
      pendingBalance: "450.00",
      totalEarnings: "15420.75",
      currency: "USD",
      updatedAt: new Date(),
    };

    this.balances.set("aff-1", balance);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserBySsoId(ssoUserId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.ssoUserId === ssoUserId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role ?? 'affiliate',
      name: insertUser.name ?? null,
      ssoUserId: insertUser.ssoUserId ?? null,
      kycStatus: insertUser.kycStatus ?? 'unverified',
      kycTier: insertUser.kycTier ?? 0,
      kycVerifiedAt: insertUser.kycVerifiedAt ?? null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getOffers(filters?: { status?: string; advertiserId?: string; isActive?: boolean }): Promise<Offer[]> {
    let offers = Array.from(this.offers.values());
    
    if (filters?.status) {
      offers = offers.filter(offer => offer.status === filters.status);
    }
    if (filters?.advertiserId) {
      offers = offers.filter(offer => offer.advertiserId === filters.advertiserId);
    }
    if (filters?.isActive !== undefined) {
      offers = offers.filter(offer => offer.isActive === filters.isActive);
    }
    
    return offers;
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = randomUUID();
    const offer: Offer = {
      ...insertOffer,
      id,
      status: insertOffer.status ?? 'draft',
      payoutCurrency: insertOffer.payoutCurrency ?? 'USD',
      isAdultContent: insertOffer.isAdultContent ?? false,
      description: insertOffer.description ?? null,
      allowedTrafficTypes: insertOffer.allowedTrafficTypes ?? null,
      allowedGeos: insertOffer.allowedGeos ?? null,
      restrictedGeos: insertOffer.restrictedGeos ?? null,
      conversionRate: insertOffer.conversionRate ?? null,
      trackingDomain: insertOffer.trackingDomain ?? null,
      isActive: insertOffer.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
    const offer = this.offers.get(id);
    if (!offer) throw new Error("Offer not found");
    
    const updatedOffer = { ...offer, ...updates, updatedAt: new Date() };
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }

  async createClick(insertClick: InsertClick): Promise<Click> {
    const id = randomUUID();
    const click: Click = {
      ...insertClick,
      id,
      sub1: insertClick.sub1 ?? null,
      sub2: insertClick.sub2 ?? null,
      sub3: insertClick.sub3 ?? null,
      sub4: insertClick.sub4 ?? null,
      sub5: insertClick.sub5 ?? null,
      referrer: insertClick.referrer ?? null,
      deviceFingerprint: insertClick.deviceFingerprint ?? null,
      geoCountry: insertClick.geoCountry ?? null,
      geoCity: insertClick.geoCity ?? null,
      trafficType: insertClick.trafficType ?? null,
      createdAt: new Date(),
    };
    this.clicks.set(id, click);
    return click;
  }

  async getClicksByAffiliate(affiliateId: string, limit = 50): Promise<Click[]> {
    return Array.from(this.clicks.values())
      .filter(click => click.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getClick(id: string): Promise<Click | undefined> {
    return this.clicks.get(id);
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = randomUUID();
    const conversion: Conversion = {
      ...insertConversion,
      id,
      currency: insertConversion.currency ?? 'USD',
      clickId: insertConversion.clickId ?? null,
      status: insertConversion.status ?? 'pending',
      approvedAt: insertConversion.approvedAt ?? null,
      rejectedAt: insertConversion.rejectedAt ?? null,
      rejectionReason: insertConversion.rejectionReason ?? null,
      metadata: insertConversion.metadata ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversions.set(id, conversion);
    return conversion;
  }

  async updateConversion(id: string, updates: Partial<Conversion>): Promise<Conversion> {
    const conversion = this.conversions.get(id);
    if (!conversion) throw new Error("Conversion not found");
    
    const updatedConversion = { ...conversion, ...updates, updatedAt: new Date() };
    this.conversions.set(id, updatedConversion);
    return updatedConversion;
  }

  async getConversionsByAffiliate(affiliateId: string, limit = 50): Promise<Conversion[]> {
    return Array.from(this.conversions.values())
      .filter(conversion => conversion.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getConversionByTxid(txid: string): Promise<Conversion | undefined> {
    return Array.from(this.conversions.values()).find(conversion => conversion.txid === txid);
  }

  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const id = randomUUID();
    const payout: Payout = {
      ...insertPayout,
      id,
      currency: insertPayout.currency ?? 'USD',
      providerTransactionId: insertPayout.providerTransactionId ?? null,
      status: insertPayout.status ?? 'pending',
      paymentDetails: insertPayout.paymentDetails ?? null,
      processedAt: insertPayout.processedAt ?? null,
      failedAt: insertPayout.failedAt ?? null,
      failureReason: insertPayout.failureReason ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payouts.set(id, payout);
    return payout;
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout> {
    const payout = this.payouts.get(id);
    if (!payout) throw new Error("Payout not found");
    
    const updatedPayout = { ...payout, ...updates, updatedAt: new Date() };
    this.payouts.set(id, updatedPayout);
    return updatedPayout;
  }

  async getPayoutsByAffiliate(affiliateId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values())
      .filter(payout => payout.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    return this.balances.get(userId);
  }

  async createOrUpdateBalance(balance: InsertUserBalance & { userId: string }): Promise<UserBalance> {
    const existing = this.balances.get(balance.userId);
    
    if (existing) {
      const updated = { ...existing, ...balance, updatedAt: new Date() };
      this.balances.set(balance.userId, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newBalance: UserBalance = {
        ...balance,
        id,
        currency: balance.currency ?? 'USD',
        availableBalance: balance.availableBalance ?? '0.00',
        pendingBalance: balance.pendingBalance ?? '0.00',
        totalEarnings: balance.totalEarnings ?? '0.00',
        updatedAt: new Date(),
      };
      this.balances.set(balance.userId, newBalance);
      return newBalance;
    }
  }

  async getAffiliateStats(affiliateId: string, days = 30): Promise<{
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    epc: number;
  }> {
    const balance = await this.getUserBalance(affiliateId);
    const clicks = await this.getClicksByAffiliate(affiliateId, 1000);
    const conversions = await this.getConversionsByAffiliate(affiliateId, 1000);
    
    const totalEarnings = parseFloat(balance?.totalEarnings || "0");
    const totalClicks = clicks.length;
    const totalConversions = conversions.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const epc = totalClicks > 0 ? totalEarnings / totalClicks : 0;

    return {
      totalEarnings,
      totalClicks,
      totalConversions,
      conversionRate,
      epc,
    };
  }

  // Creative methods
  async getCreatives(offerId: string): Promise<Creative[]> {
    return Array.from(this.creatives.values()).filter(creative => creative.offerId === offerId);
  }

  async createCreative(insertCreative: InsertCreative): Promise<Creative> {
    const id = randomUUID();
    const creative: Creative = {
      ...insertCreative,
      id,
      size: insertCreative.size ?? null,
      status: insertCreative.status ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.creatives.set(id, creative);
    return creative;
  }

  // Tracking Link methods
  async getTrackingLinks(affiliateId: string): Promise<TrackingLink[]> {
    return Array.from(this.trackingLinks.values()).filter(link => link.affiliateId === affiliateId);
  }

  async getTrackingLinkByCode(code: string): Promise<TrackingLink | undefined> {
    return Array.from(this.trackingLinks.values()).find(link => link.code === code);
  }

  async createTrackingLink(insertLink: InsertTrackingLink): Promise<TrackingLink> {
    const id = randomUUID();
    const link: TrackingLink = {
      ...insertLink,
      id,
      subId: insertLink.subId ?? null,
      createdAt: new Date(),
    };
    this.trackingLinks.set(id, link);
    return link;
  }

  // Balance helper methods
  async updateBalance(userId: string, updates: Partial<InsertUserBalance>): Promise<UserBalance> {
    const existing = this.balances.get(userId);
    if (!existing) {
      throw new Error("Balance not found");
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.balances.set(userId, updated);
    return updated;
  }

  async getBalance(userId: string): Promise<UserBalance | undefined> {
    return this.balances.get(userId);
  }

  // Analytics methods
  async getAffiliateAnalytics(affiliateId: string): Promise<{
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    epc: number;
  }> {
    return this.getAffiliateStats(affiliateId);
  }

  async getAffiliateAnalyticsByPeriod(affiliateId: string, period: string): Promise<any> {
    // Simple implementation for now
    const stats = await this.getAffiliateStats(affiliateId);
    return { [period]: stats };
  }

  // Convenience methods
  async getClicks(affiliateId: string): Promise<Click[]> {
    return this.getClicksByAffiliate(affiliateId);
  }

  async getConversions(affiliateId: string): Promise<Conversion[]> {
    return this.getConversionsByAffiliate(affiliateId);
  }

  async getPayouts(affiliateId: string): Promise<Payout[]> {
    return this.getPayoutsByAffiliate(affiliateId);
  }

  async createPayoutRequest(insertPayout: InsertPayout): Promise<Payout> {
    return this.createPayout(insertPayout);
  }
}

export const storage = new MemStorage();

import OpenAI from "openai";
import { db } from "./db";

interface VirtualCard {
  id: string;
  userId: string;
  creatorId: string;
  type: 'vip' | 'creator' | 'fan' | 'influencer';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'obsidian' | 'titanium';
  level: number;
  experience: number;
  design: CardDesign;
  benefits: CardBenefit[];
  achievements: Achievement[];
  stats: CardStats;
  blockchain: BlockchainData;
  tradeable: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  value: number;
}

interface CardDesign {
  template: string;
  background: string;
  animation: string;
  holographic: boolean;
  customElements: CustomElement[];
  signatureStyle: string;
  borderEffect: string;
  particleEffects: boolean;
  model3d?: string;
  arEnabled: boolean;
}

interface CustomElement {
  type: 'image' | 'text' | 'video' | 'animation' | 'nft' | '3d_object';
  content: string;
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number; depth?: number };
  effects: string[];
}

interface CardBenefit {
  id: string;
  type: 'discount' | 'early_access' | 'exclusive_content' | 'meet_greet' | 'custom_content' | 'merchandise' | 'event_access' | 'voting_power' | 'revenue_share';
  value: any;
  description: string;
  expirationDate?: Date;
  usageLimit?: number;
  used: number;
  tierRequired: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: string;
}

interface CardStats {
  totalSpent: number;
  subscriptionMonths: number;
  tipsGiven: number;
  contentUnlocked: number;
  messagesExchanged: number;
  loyaltyScore: number;
  engagementRate: number;
  referralsGenerated: number;
  revenueGenerated: number;
}

interface BlockchainData {
  tokenId?: string;
  contractAddress?: string;
  chain: 'ethereum' | 'polygon' | 'solana' | 'binance' | 'none';
  mintDate?: Date;
  transactionHash?: string;
  owner: string;
  previousOwners: string[];
  tradingHistory: Trade[];
}

interface Trade {
  from: string;
  to: string;
  price: number;
  currency: string;
  date: Date;
  transactionHash: string;
}

interface CardCollection {
  id: string;
  userId: string;
  cards: VirtualCard[];
  showcaseCards: string[];
  totalValue: number;
  completedSets: string[];
  rankings: CollectionRanking;
}

interface CollectionRanking {
  global: number;
  regional: number;
  category: number;
  totalPoints: number;
  badges: string[];
}

interface MarketListing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  currency: string;
  listingDate: Date;
  expirationDate?: Date;
  views: number;
  watchers: string[];
}

interface Auction {
  id: string;
  cardId: string;
  sellerId: string;
  startingBid: number;
  currentBid: number;
  highestBidder: string;
  endDate: Date;
  bids: Bid[];
  reservePrice?: number;
  buyNowPrice?: number;
}

interface Bid {
  bidderId: string;
  amount: number;
  timestamp: Date;
  autoBid: boolean;
}

interface CardMarketplace {
  listings: MarketListing[];
  auctions: Auction[];
  trades: TradeOffer[];
  priceHistory: PriceData[];
  trending: TrendingCard[];
}

interface TradeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  offeredCards: string[];
  requestedCards: string[];
  additionalPayment?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  expirationDate: Date;
}

interface PriceData {
  cardTier: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  volume: number;
  date: Date;
}

interface TrendingCard {
  cardId: string;
  creatorName: string;
  tier: string;
  priceChange: number;
  volume: number;
  popularity: number;
}

// Revolutionary Virtual Cards Service
class VirtualCardsService {
  private openai?: OpenAI;
  private virtualCards: Map<string, VirtualCard> = new Map();
  private collections: Map<string, CardCollection> = new Map();
  private marketplace: CardMarketplace = {
    listings: [],
    auctions: [],
    trades: [],
    priceHistory: [],
    trending: []
  };

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.initializeCardTemplates();
  }

  // Create a new virtual card for a fan
  async createVirtualCard(
    userId: string,
    creatorId: string,
    initialTier: VirtualCard['tier'] = 'bronze'
  ): Promise<{
    card: VirtualCard;
    benefits: CardBenefit[];
    unlockAnimation: string;
    shareableUrl: string;
    nftMintOption?: any;
  }> {
    const cardId = `card_${Date.now()}_${userId}`;
    
    const design = await this.generateCardDesign(initialTier, creatorId);
    const benefits = this.getTierBenefits(initialTier, creatorId);
    
    const card: VirtualCard = {
      id: cardId,
      userId,
      creatorId,
      type: 'fan',
      tier: initialTier,
      level: 1,
      experience: 0,
      design,
      benefits,
      achievements: [],
      stats: {
        totalSpent: 0,
        subscriptionMonths: 0,
        tipsGiven: 0,
        contentUnlocked: 0,
        messagesExchanged: 0,
        loyaltyScore: 100,
        engagementRate: 0,
        referralsGenerated: 0,
        revenueGenerated: 0
      },
      blockchain: {
        chain: 'none',
        owner: userId,
        previousOwners: [],
        tradingHistory: []
      },
      tradeable: initialTier !== 'bronze',
      rarity: this.calculateRarity(initialTier),
      value: this.calculateCardValue(initialTier, 1, 0)
    };

    this.virtualCards.set(cardId, card);
    await this.addToCollection(userId, card);

    return {
      card,
      benefits,
      unlockAnimation: this.getUnlockAnimation(initialTier),
      shareableUrl: `https://cards.fanslab.com/${cardId}`,
      nftMintOption: initialTier !== 'bronze' ? {
        available: true,
        estimatedGas: 0.02,
        chains: ['ethereum', 'polygon', 'solana']
      } : undefined
    };
  }

  // Upgrade card to next tier
  async upgradeCard(
    cardId: string,
    userId: string
  ): Promise<{
    success: boolean;
    newTier: string;
    newBenefits: CardBenefit[];
    upgradeAnimation: string;
    achievementsUnlocked: Achievement[];
    nftUpgrade?: any;
  }> {
    const card = this.virtualCards.get(cardId);
    if (!card || card.userId !== userId) {
      throw new Error('Card not found or unauthorized');
    }

    const nextTier = this.getNextTier(card.tier);
    if (!nextTier) {
      throw new Error('Already at maximum tier');
    }

    const requirements = await this.checkUpgradeRequirements(card, nextTier);
    if (!requirements.allMet) {
      return {
        success: false,
        newTier: card.tier,
        newBenefits: card.benefits,
        upgradeAnimation: '',
        achievementsUnlocked: []
      };
    }

    card.tier = nextTier as VirtualCard['tier'];
    card.level++;
    card.design = await this.generateCardDesign(nextTier, card.creatorId);
    card.benefits = this.getTierBenefits(nextTier, card.creatorId);
    card.rarity = this.calculateRarity(nextTier);
    card.value = this.calculateCardValue(nextTier, card.level, card.stats.totalSpent);

    const achievements = this.checkAchievements(card);
    card.achievements.push(...achievements);

    this.virtualCards.set(cardId, card);

    return {
      success: true,
      newTier: nextTier,
      newBenefits: card.benefits,
      upgradeAnimation: this.getUpgradeAnimation(nextTier),
      achievementsUnlocked: achievements,
      nftUpgrade: card.blockchain.tokenId ? {
        required: true,
        upgradeContract: '0x...',
        estimatedGas: 0.03
      } : undefined
    };
  }

  // Creator card management
  async createCreatorCard(
    creatorId: string,
    tier: 'gold' | 'platinum' | 'diamond' | 'obsidian' | 'titanium' = 'gold'
  ): Promise<{
    card: VirtualCard;
    exclusivePerks: string[];
    verificationBadge: string;
    customizationOptions: any;
    marketValue: number;
  }> {
    const cardId = `creator_${Date.now()}_${creatorId}`;
    
    const card: VirtualCard = {
      id: cardId,
      userId: creatorId,
      creatorId: creatorId,
      type: 'creator',
      tier,
      level: 1,
      experience: 0,
      design: await this.generateCreatorCardDesign(tier),
      benefits: this.getCreatorBenefits(tier),
      achievements: [],
      stats: {
        totalSpent: 0,
        subscriptionMonths: 0,
        tipsGiven: 0,
        contentUnlocked: 0,
        messagesExchanged: 0,
        loyaltyScore: 1000,
        engagementRate: 0,
        referralsGenerated: 0,
        revenueGenerated: 0
      },
      blockchain: {
        chain: 'ethereum',
        owner: creatorId,
        previousOwners: [],
        tradingHistory: []
      },
      tradeable: true,
      rarity: this.calculateCreatorRarity(tier),
      value: this.calculateCreatorCardValue(tier)
    };

    this.virtualCards.set(cardId, card);

    const exclusivePerks = [
      'Custom card design tools',
      'Priority support',
      'Advanced analytics dashboard',
      'Exclusive creator events',
      'Revenue boost multiplier',
      'Special badge display'
    ];

    const hasCustomSounds = tier === 'diamond' || tier === 'obsidian' || tier === 'titanium';
    const num3dModels = tier === 'titanium' ? 10 : 0;

    return {
      card,
      exclusivePerks,
      verificationBadge: `verified_${tier}`,
      customizationOptions: {
        backgrounds: 50,
        effects: 30,
        animations: 20,
        models3d: num3dModels,
        customSounds: hasCustomSounds
      },
      marketValue: card.value
    };
  }

  // Card marketplace functionality
  async listCardForSale(
    cardId: string,
    sellerId: string,
    price: number,
    currency: string = 'USD'
  ): Promise<{
    listingId: string;
    marketplaceUrl: string;
    estimatedFees: number;
    visibility: string;
  }> {
    const card = this.virtualCards.get(cardId);
    if (!card || card.userId !== sellerId || !card.tradeable) {
      throw new Error('Card cannot be listed for sale');
    }

    const listing: MarketListing = {
      id: `listing_${Date.now()}`,
      cardId,
      sellerId,
      price,
      currency,
      listingDate: new Date(),
      views: 0,
      watchers: []
    };

    this.marketplace.listings.push(listing);

    return {
      listingId: listing.id,
      marketplaceUrl: `https://marketplace.fanslab.com/card/${cardId}`,
      estimatedFees: price * 0.025,
      visibility: card.rarity === 'legendary' || card.rarity === 'mythic' ? 'featured' : 'standard'
    };
  }

  // Create card auction
  async createCardAuction(
    cardId: string,
    sellerId: string,
    startingBid: number,
    duration: number,
    reservePrice?: number
  ): Promise<{
    auctionId: string;
    auctionUrl: string;
    endDate: Date;
    promotionOptions: string[];
  }> {
    const card = this.virtualCards.get(cardId);
    if (!card || card.userId !== sellerId || !card.tradeable) {
      throw new Error('Card cannot be auctioned');
    }

    const endDate = new Date(Date.now() + duration * 60 * 60 * 1000);

    const auction: Auction = {
      id: `auction_${Date.now()}`,
      cardId,
      sellerId,
      startingBid,
      currentBid: startingBid,
      highestBidder: '',
      endDate,
      bids: [],
      reservePrice
    };

    this.marketplace.auctions.push(auction);

    return {
      auctionId: auction.id,
      auctionUrl: `https://marketplace.fanslab.com/auction/${auction.id}`,
      endDate,
      promotionOptions: [
        'Featured listing',
        'Social media promotion',
        'Email blast to collectors',
        'Homepage spotlight'
      ]
    };
  }

  // Gamification and achievements
  async trackCardActivity(
    cardId: string,
    activity: {
      type: 'purchase' | 'tip' | 'message' | 'content_unlock' | 'referral' | 'engagement';
      value: number;
      metadata?: any;
    }
  ): Promise<{
    experienceGained: number;
    levelUp: boolean;
    newAchievements: Achievement[];
    bonusRewards: any[];
  }> {
    const card = this.virtualCards.get(cardId);
    if (!card) throw new Error('Card not found');

    switch (activity.type) {
      case 'purchase':
        card.stats.totalSpent += activity.value;
        card.experience += Math.floor(activity.value * 10);
        break;
      case 'tip':
        card.stats.tipsGiven += activity.value;
        card.experience += Math.floor(activity.value * 5);
        break;
      case 'content_unlock':
        card.stats.contentUnlocked++;
        card.experience += 50;
        break;
      case 'message':
        card.stats.messagesExchanged++;
        card.experience += 10;
        break;
      case 'referral':
        card.stats.referralsGenerated++;
        card.experience += 500;
        break;
      case 'engagement':
        card.stats.engagementRate = activity.value;
        card.experience += 25;
        break;
    }

    const requiredExp = this.getRequiredExperience(card.level);
    const levelUp = card.experience >= requiredExp;
    if (levelUp) {
      card.level++;
      card.experience -= requiredExp;
    }

    const newAchievements = this.checkAchievements(card);
    card.achievements.push(...newAchievements);

    const bonusRewards = this.calculateBonusRewards(card, activity);

    card.stats.loyaltyScore = this.calculateLoyaltyScore(card.stats);

    this.virtualCards.set(cardId, card);

    return {
      experienceGained: Math.floor(activity.value * this.getExperienceMultiplier(card.tier)),
      levelUp,
      newAchievements,
      bonusRewards
    };
  }

  // AI-powered card recommendations
  async getCardRecommendations(
    userId: string,
    preferences: {
      budget?: number;
      interests?: string[];
      favoriteCreators?: string[];
    }
  ): Promise<{
    recommendedCards: VirtualCard[];
    personalizedOffers: any[];
    collectionGoals: string[];
    estimatedROI: number;
  }> {
    if (!this.openai) {
      return this.generateMockRecommendations(userId, preferences);
    }

    try {
      const userCollection = this.collections.get(userId);
      
      const prompt = `Generate personalized virtual card recommendations for a user with:
      Budget: ${preferences.budget || 'flexible'}
      Interests: ${preferences.interests?.join(', ') || 'varied'}
      Favorite creators: ${preferences.favoriteCreators?.join(', ') || 'exploring'}
      Current collection value: ${userCollection?.totalValue || 0}
      
      Provide recommendations for cards to collect, special offers, and collection strategies.
      Format as JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '{}');

      return {
        recommendedCards: recommendations.cards || [],
        personalizedOffers: recommendations.offers || [],
        collectionGoals: recommendations.goals || [],
        estimatedROI: recommendations.roi || 15
      };
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return this.generateMockRecommendations(userId, preferences);
    }
  }

  // Card collection management
  async getCollectionValue(userId: string): Promise<{
    totalValue: number;
    topCards: VirtualCard[];
    rareCards: VirtualCard[];
    completionPercentage: number;
    rankings: CollectionRanking;
  }> {
    const collection = this.collections.get(userId);
    if (!collection) {
      return {
        totalValue: 0,
        topCards: [],
        rareCards: [],
        completionPercentage: 0,
        rankings: {
          global: 0,
          regional: 0,
          category: 0,
          totalPoints: 0,
          badges: []
        }
      };
    }

    const topCards = collection.cards
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const rareCards = collection.cards
      .filter(card => ['epic', 'legendary', 'mythic'].includes(card.rarity));

    return {
      totalValue: collection.totalValue,
      topCards,
      rareCards,
      completionPercentage: this.calculateCompletionPercentage(collection),
      rankings: collection.rankings
    };
  }

  // NFT integration
  async mintCardAsNFT(
    cardId: string,
    userId: string,
    chain: 'ethereum' | 'polygon' | 'solana'
  ): Promise<{
    success: boolean;
    tokenId: string;
    contractAddress: string;
    transactionHash: string;
    opensea_url: string;
    estimatedValue: number;
  }> {
    const card = this.virtualCards.get(cardId);
    if (!card || card.userId !== userId) {
      throw new Error('Card not found or unauthorized');
    }

    const tokenId = `nft_${Date.now()}`;
    const contractAddress = '0x1234...abcd';
    const transactionHash = `0xtx_${Date.now()}`;

    card.blockchain = {
      tokenId,
      contractAddress,
      chain,
      mintDate: new Date(),
      transactionHash,
      owner: userId,
      previousOwners: [],
      tradingHistory: []
    };

    this.virtualCards.set(cardId, card);

    return {
      success: true,
      tokenId,
      contractAddress,
      transactionHash,
      opensea_url: `https://opensea.io/assets/${contractAddress}/${tokenId}`,
      estimatedValue: card.value * 1.5
    };
  }

  // Helper methods
  private initializeCardTemplates(): void {
    // Initialize default card templates for each tier
  }

  private async generateCardDesign(tier: string, creatorId: string): Promise<CardDesign> {
    const tierDesigns: { [key: string]: CardDesign } = {
      bronze: {
        template: 'basic',
        background: 'linear-gradient(135deg, #CD7F32, #8B4513)',
        animation: 'subtle_glow',
        holographic: false,
        customElements: [],
        signatureStyle: 'basic',
        borderEffect: 'simple',
        particleEffects: false,
        arEnabled: false
      },
      silver: {
        template: 'metallic',
        background: 'linear-gradient(135deg, #C0C0C0, #808080)',
        animation: 'shimmer',
        holographic: false,
        customElements: [],
        signatureStyle: 'elegant',
        borderEffect: 'metallic',
        particleEffects: false,
        arEnabled: false
      },
      gold: {
        template: 'premium',
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        animation: 'golden_shine',
        holographic: true,
        customElements: [],
        signatureStyle: 'premium',
        borderEffect: 'golden_glow',
        particleEffects: true,
        arEnabled: true
      },
      platinum: {
        template: 'luxury',
        background: 'linear-gradient(135deg, #E5E4E2, #BCC6CC)',
        animation: 'prismatic',
        holographic: true,
        customElements: [],
        signatureStyle: 'luxury',
        borderEffect: 'prismatic',
        particleEffects: true,
        arEnabled: true
      },
      diamond: {
        template: 'ultimate',
        background: 'linear-gradient(135deg, #B9F2FF, #69D2FF)',
        animation: 'diamond_sparkle',
        holographic: true,
        customElements: [],
        signatureStyle: 'ultimate',
        borderEffect: 'diamond_refraction',
        particleEffects: true,
        model3d: 'diamond_card.glb',
        arEnabled: true
      }
    };

    return tierDesigns[tier] || tierDesigns.bronze;
  }

  private async generateCreatorCardDesign(tier: string): Promise<CardDesign> {
    const designs: { [key: string]: CardDesign } = {
      gold: {
        template: 'creator_premium',
        background: 'radial-gradient(circle, #FFD700, #FFA500, #FF6347)',
        animation: 'creator_pulse',
        holographic: true,
        customElements: [],
        signatureStyle: 'creator_signature',
        borderEffect: 'creator_glow',
        particleEffects: true,
        arEnabled: true
      },
      platinum: {
        template: 'creator_elite',
        background: 'radial-gradient(circle, #E5E4E2, #BCC6CC, #98AFC7)',
        animation: 'elite_rotation',
        holographic: true,
        customElements: [],
        signatureStyle: 'elite_signature',
        borderEffect: 'elite_shimmer',
        particleEffects: true,
        model3d: 'creator_platinum.glb',
        arEnabled: true
      },
      diamond: {
        template: 'creator_ultimate',
        background: 'radial-gradient(circle, #B9F2FF, #69D2FF, #00BFFF)',
        animation: 'ultimate_transformation',
        holographic: true,
        customElements: [],
        signatureStyle: 'ultimate_signature',
        borderEffect: 'ultimate_prism',
        particleEffects: true,
        model3d: 'creator_diamond.glb',
        arEnabled: true
      }
    };

    return designs[tier] || designs.gold;
  }

  private getTierBenefits(tier: string, creatorId: string): CardBenefit[] {
    const benefits: { [key: string]: CardBenefit[] } = {
      bronze: [
        {
          id: 'b1',
          type: 'discount',
          value: 5,
          description: '5% discount on all purchases',
          tierRequired: 'bronze',
          used: 0
        }
      ],
      silver: [
        {
          id: 's1',
          type: 'discount',
          value: 10,
          description: '10% discount on all purchases',
          tierRequired: 'silver',
          used: 0
        },
        {
          id: 's2',
          type: 'early_access',
          value: '24h',
          description: '24 hour early access to new content',
          tierRequired: 'silver',
          used: 0
        }
      ],
      gold: [
        {
          id: 'g1',
          type: 'discount',
          value: 15,
          description: '15% discount on all purchases',
          tierRequired: 'gold',
          used: 0
        },
        {
          id: 'g2',
          type: 'early_access',
          value: '48h',
          description: '48 hour early access to new content',
          tierRequired: 'gold',
          used: 0
        },
        {
          id: 'g3',
          type: 'exclusive_content',
          value: 'monthly',
          description: 'Monthly exclusive content drop',
          tierRequired: 'gold',
          used: 0
        }
      ],
      platinum: [
        {
          id: 'p1',
          type: 'discount',
          value: 20,
          description: '20% discount on all purchases',
          tierRequired: 'platinum',
          used: 0
        },
        {
          id: 'p2',
          type: 'early_access',
          value: '72h',
          description: '72 hour early access to new content',
          tierRequired: 'platinum',
          used: 0
        },
        {
          id: 'p3',
          type: 'exclusive_content',
          value: 'weekly',
          description: 'Weekly exclusive content',
          tierRequired: 'platinum',
          used: 0
        },
        {
          id: 'p4',
          type: 'custom_content',
          value: 'monthly',
          description: 'Monthly custom content request',
          tierRequired: 'platinum',
          used: 0
        }
      ],
      diamond: [
        {
          id: 'd1',
          type: 'discount',
          value: 30,
          description: '30% discount on all purchases',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'd2',
          type: 'early_access',
          value: 'instant',
          description: 'Instant access to all new content',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'd3',
          type: 'exclusive_content',
          value: 'daily',
          description: 'Daily exclusive content',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'd4',
          type: 'custom_content',
          value: 'weekly',
          description: 'Weekly custom content request',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'd5',
          type: 'meet_greet',
          value: 'quarterly',
          description: 'Quarterly virtual meet & greet',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'd6',
          type: 'revenue_share',
          value: 0.5,
          description: '0.5% revenue share from creator earnings',
          tierRequired: 'diamond',
          used: 0
        }
      ]
    };

    return benefits[tier] || benefits.bronze;
  }

  private getCreatorBenefits(tier: string): CardBenefit[] {
    const benefits: { [key: string]: CardBenefit[] } = {
      gold: [
        {
          id: 'cg1',
          type: 'revenue_share',
          value: 85,
          description: '85% revenue share',
          tierRequired: 'gold',
          used: 0
        },
        {
          id: 'cg2',
          type: 'merchandise',
          value: 'basic',
          description: 'Basic merchandise store',
          tierRequired: 'gold',
          used: 0
        }
      ],
      platinum: [
        {
          id: 'cp1',
          type: 'revenue_share',
          value: 90,
          description: '90% revenue share',
          tierRequired: 'platinum',
          used: 0
        },
        {
          id: 'cp2',
          type: 'merchandise',
          value: 'premium',
          description: 'Premium merchandise store with fulfillment',
          tierRequired: 'platinum',
          used: 0
        },
        {
          id: 'cp3',
          type: 'event_access',
          value: 'creator_summit',
          description: 'Annual creator summit access',
          tierRequired: 'platinum',
          used: 0
        }
      ],
      diamond: [
        {
          id: 'cd1',
          type: 'revenue_share',
          value: 95,
          description: '95% revenue share',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'cd2',
          type: 'merchandise',
          value: 'ultimate',
          description: 'Full merchandise ecosystem with global fulfillment',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'cd3',
          type: 'event_access',
          value: 'all_events',
          description: 'All platform events and exclusive retreats',
          tierRequired: 'diamond',
          used: 0
        },
        {
          id: 'cd4',
          type: 'voting_power',
          value: 10,
          description: '10x voting power in platform decisions',
          tierRequired: 'diamond',
          used: 0
        }
      ]
    };

    return benefits[tier] || benefits.gold;
  }

  private calculateRarity(tier: string): VirtualCard['rarity'] {
    const rarityMap: { [key: string]: VirtualCard['rarity'] } = {
      bronze: 'common',
      silver: 'uncommon',
      gold: 'rare',
      platinum: 'epic',
      diamond: 'legendary',
      obsidian: 'mythic',
      titanium: 'mythic'
    };
    return rarityMap[tier] || 'common';
  }

  private calculateCreatorRarity(tier: string): VirtualCard['rarity'] {
    const rarityMap: { [key: string]: VirtualCard['rarity'] } = {
      gold: 'epic',
      platinum: 'legendary',
      diamond: 'mythic',
      obsidian: 'mythic',
      titanium: 'mythic'
    };
    return rarityMap[tier] || 'epic';
  }

  private calculateCardValue(tier: string, level: number, totalSpent: number): number {
    const baseValues: { [key: string]: number } = {
      bronze: 10,
      silver: 50,
      gold: 250,
      platinum: 1000,
      diamond: 5000,
      obsidian: 10000,
      titanium: 25000
    };

    const baseValue = baseValues[tier] || 10;
    const levelMultiplier = 1 + (level * 0.1);
    const spentBonus = totalSpent * 0.01;

    return Math.floor(baseValue * levelMultiplier + spentBonus);
  }

  private calculateCreatorCardValue(tier: string): number {
    const values: { [key: string]: number } = {
      gold: 5000,
      platinum: 25000,
      diamond: 100000,
      obsidian: 250000,
      titanium: 1000000
    };
    return values[tier] || 5000;
  }

  private getUnlockAnimation(tier: string): string {
    const animations: { [key: string]: string } = {
      bronze: 'card_flip_bronze',
      silver: 'card_shimmer_silver',
      gold: 'card_burst_gold',
      platinum: 'card_prism_platinum',
      diamond: 'card_explosion_diamond'
    };
    return animations[tier] || 'card_flip_bronze';
  }

  private getUpgradeAnimation(tier: string): string {
    const animations: { [key: string]: string } = {
      silver: 'upgrade_shine_silver',
      gold: 'upgrade_burst_gold',
      platinum: 'upgrade_transform_platinum',
      diamond: 'upgrade_ultimate_diamond'
    };
    return animations[tier] || 'upgrade_shine_silver';
  }

  private getNextTier(currentTier: string): string | null {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  }

  private async checkUpgradeRequirements(card: VirtualCard, nextTier: string): Promise<{ allMet: boolean }> {
    const requirements: { [key: string]: { totalSpent: number; subscriptionMonths: number; engagementRate: number } } = {
      silver: { totalSpent: 100, subscriptionMonths: 1, engagementRate: 50 },
      gold: { totalSpent: 500, subscriptionMonths: 3, engagementRate: 70 },
      platinum: { totalSpent: 2500, subscriptionMonths: 6, engagementRate: 85 },
      diamond: { totalSpent: 10000, subscriptionMonths: 12, engagementRate: 95 }
    };

    const tierReqs = requirements[nextTier];
    if (!tierReqs) return { allMet: false };

    return {
      allMet: card.stats.totalSpent >= tierReqs.totalSpent &&
              card.stats.subscriptionMonths >= tierReqs.subscriptionMonths &&
              card.stats.engagementRate >= tierReqs.engagementRate
    };
  }

  private checkAchievements(card: VirtualCard): Achievement[] {
    const achievements: Achievement[] = [];

    if (card.stats.totalSpent >= 1000 && !card.achievements.find(a => a.id === 'big_spender')) {
      achievements.push({
        id: 'big_spender',
        name: 'Big Spender',
        description: 'Spent over $1000',
        icon: '💰',
        unlockedAt: new Date(),
        rarity: 'rare',
        points: 500,
        category: 'spending'
      });
    }

    if (card.stats.referralsGenerated >= 10 && !card.achievements.find(a => a.id === 'influencer')) {
      achievements.push({
        id: 'influencer',
        name: 'Influencer',
        description: 'Generated 10 referrals',
        icon: '📢',
        unlockedAt: new Date(),
        rarity: 'epic',
        points: 1000,
        category: 'social'
      });
    }

    return achievements;
  }

  private getRequiredExperience(level: number): number {
    return level * 1000 + Math.pow(level, 2) * 100;
  }

  private getExperienceMultiplier(tier: string): number {
    const multipliers: { [key: string]: number } = {
      bronze: 1,
      silver: 1.5,
      gold: 2,
      platinum: 3,
      diamond: 5
    };
    return multipliers[tier] || 1;
  }

  private calculateBonusRewards(card: VirtualCard, activity: any): any[] {
    const rewards = [];

    if (card.tier === 'diamond' && activity.type === 'purchase') {
      rewards.push({
        type: 'cashback',
        value: activity.value * 0.05,
        description: 'Diamond tier 5% cashback'
      });
    }

    if (card.stats.totalSpent % 1000 === 0) {
      rewards.push({
        type: 'bonus_content',
        value: 'exclusive_video',
        description: 'Milestone bonus content unlocked'
      });
    }

    return rewards;
  }

  private calculateLoyaltyScore(stats: CardStats): number {
    const factors = {
      spending: Math.min(stats.totalSpent / 100, 100),
      subscription: Math.min(stats.subscriptionMonths * 10, 100),
      engagement: stats.engagementRate,
      referrals: Math.min(stats.referralsGenerated * 20, 100),
      content: Math.min(stats.contentUnlocked * 2, 100)
    };

    return Math.floor(
      (factors.spending + factors.subscription + factors.engagement + factors.referrals + factors.content) / 5
    );
  }

  private async addToCollection(userId: string, card: VirtualCard): Promise<void> {
    let collection = this.collections.get(userId);
    
    if (!collection) {
      collection = {
        id: `collection_${userId}`,
        userId,
        cards: [],
        showcaseCards: [],
        totalValue: 0,
        completedSets: [],
        rankings: {
          global: Math.floor(Math.random() * 10000),
          regional: Math.floor(Math.random() * 1000),
          category: Math.floor(Math.random() * 100),
          totalPoints: 0,
          badges: []
        }
      };
    }

    collection.cards.push(card);
    collection.totalValue += card.value;
    
    this.collections.set(userId, collection);
  }

  private calculateCompletionPercentage(collection: CardCollection): number {
    const tiers = new Set(collection.cards.map(c => c.tier));
    const creators = new Set(collection.cards.map(c => c.creatorId));
    
    const tierCompletion = (tiers.size / 7) * 100;
    const creatorDiversity = Math.min((creators.size / 10) * 100, 100);
    
    return (tierCompletion + creatorDiversity) / 2;
  }

  private generateMockRecommendations(userId: string, preferences: any): any {
    return {
      recommendedCards: [],
      personalizedOffers: [
        {
          type: 'bundle',
          description: '3 Gold Cards Bundle',
          discount: 15,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ],
      collectionGoals: [
        'Collect 5 different creator cards',
        'Upgrade one card to Platinum tier',
        'Complete a themed collection'
      ],
      estimatedROI: 20
    };
  }
}

export const virtualCardsService = new VirtualCardsService();
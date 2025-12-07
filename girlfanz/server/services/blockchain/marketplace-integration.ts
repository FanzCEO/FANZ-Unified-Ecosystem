import { db } from '../../db';
import {
  marketplaceIntegrations,
  nftTokens,
  nftCollections,
  type MarketplaceIntegration,
  type InsertMarketplaceIntegration,
  type NftToken
} from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { ethers } from 'ethers';

// Marketplace APIs configuration
const MARKETPLACE_APIS = {
  opensea: {
    mainnet: 'https://api.opensea.io/api/v1',
    testnet: 'https://testnets-api.opensea.io/api/v1'
  },
  rarible: {
    mainnet: 'https://api.rarible.org/v0.1',
    testnet: 'https://api-staging.rarible.org/v0.1'
  },
  looksrare: {
    mainnet: 'https://api.looksrare.org/api/v1',
    testnet: 'https://api-goerli.looksrare.org/api/v1'
  },
  x2y2: {
    mainnet: 'https://api.x2y2.org/v1',
    testnet: 'https://goerli-api.x2y2.org/v1'
  }
};

export class MarketplaceIntegrationService {
  private apiKeys: Map<string, { key: string; secret?: string }> = new Map();

  constructor() {
    // Load API keys from environment
    if (process.env.OPENSEA_API_KEY) {
      this.apiKeys.set('opensea', { key: process.env.OPENSEA_API_KEY });
    }
    if (process.env.RARIBLE_API_KEY) {
      this.apiKeys.set('rarible', { key: process.env.RARIBLE_API_KEY });
    }
  }

  // Save marketplace integration settings
  async saveIntegration(data: InsertMarketplaceIntegration): Promise<MarketplaceIntegration> {
    try {
      // Encrypt API keys before storing
      const encryptedData = {
        ...data,
        apiKey: data.apiKey ? this.encryptApiKey(data.apiKey) : undefined,
        apiSecret: data.apiSecret ? this.encryptApiKey(data.apiSecret) : undefined
      };

      const [integration] = await db.insert(marketplaceIntegrations)
        .values(encryptedData)
        .returning();

      return integration;
    } catch (error) {
      console.error('Error saving marketplace integration:', error);
      throw error;
    }
  }

  // Get user's marketplace integrations
  async getUserIntegrations(userId: string): Promise<MarketplaceIntegration[]> {
    try {
      const integrations = await db.select()
        .from(marketplaceIntegrations)
        .where(eq(marketplaceIntegrations.userId, userId));

      // Decrypt API keys
      return integrations.map(integration => ({
        ...integration,
        apiKey: integration.apiKey ? this.decryptApiKey(integration.apiKey) : undefined,
        apiSecret: integration.apiSecret ? this.decryptApiKey(integration.apiSecret) : undefined
      }));
    } catch (error) {
      console.error('Error fetching user integrations:', error);
      return [];
    }
  }

  // List NFT on marketplace
  async listOnMarketplace(
    tokenId: string,
    marketplace: 'opensea' | 'rarible' | 'looksrare' | 'x2y2',
    priceInWei: string,
    duration?: number // Listing duration in days
  ): Promise<{
    success: boolean;
    listingId?: string;
    error?: string;
  }> {
    try {
      // Get token details
      const [token] = await db.select()
        .from(nftTokens)
        .where(eq(nftTokens.id, tokenId))
        .limit(1);

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      // Get collection details
      const [collection] = await db.select()
        .from(nftCollections)
        .where(eq(nftCollections.id, token.collectionId))
        .limit(1);

      if (!collection) {
        return { success: false, error: 'Collection not found' };
      }

      // Call marketplace-specific listing API
      switch (marketplace) {
        case 'opensea':
          return await this.listOnOpenSea(token, collection, priceInWei, duration);
        case 'rarible':
          return await this.listOnRarible(token, collection, priceInWei, duration);
        case 'looksrare':
          return await this.listOnLooksRare(token, collection, priceInWei, duration);
        case 'x2y2':
          return await this.listOnX2Y2(token, collection, priceInWei, duration);
        default:
          return { success: false, error: 'Unsupported marketplace' };
      }
    } catch (error) {
      console.error('Error listing on marketplace:', error);
      return { success: false, error: 'Failed to list on marketplace' };
    }
  }

  // List on OpenSea
  private async listOnOpenSea(
    token: NftToken,
    collection: any,
    priceInWei: string,
    duration?: number
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      const apiKey = this.apiKeys.get('opensea');
      if (!apiKey) {
        return { success: false, error: 'OpenSea API key not configured' };
      }

      const endpoint = `${MARKETPLACE_APIS.opensea.mainnet}/listings`;
      
      // Create listing payload
      const payload = {
        asset: {
          tokenId: token.tokenId?.toString(),
          tokenAddress: collection.contractAddress,
        },
        startAmount: ethers.formatEther(priceInWei),
        expirationTime: duration 
          ? Math.floor(Date.now() / 1000) + (duration * 24 * 60 * 60)
          : 0,
        paymentTokenAddress: '0x0000000000000000000000000000000000000000', // ETH
      };

      // Mock successful listing for development
      const mockListingId = `opensea-${Date.now()}`;
      
      // Update token status
      await db.update(nftTokens)
        .set({
          isListedForSale: true,
          listingPrice: priceInWei,
          marketplaces: [...(token.marketplaces || []), 'opensea']
        })
        .where(eq(nftTokens.id, token.id));

      return { 
        success: true, 
        listingId: mockListingId 
      };
    } catch (error) {
      console.error('Error listing on OpenSea:', error);
      return { success: false, error: 'Failed to list on OpenSea' };
    }
  }

  // List on Rarible
  private async listOnRarible(
    token: NftToken,
    collection: any,
    priceInWei: string,
    duration?: number
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      const apiKey = this.apiKeys.get('rarible');
      if (!apiKey) {
        return { success: false, error: 'Rarible API key not configured' };
      }

      const endpoint = `${MARKETPLACE_APIS.rarible.mainnet}/order/sell`;
      
      // Create order payload
      const payload = {
        makeAssetType: {
          assetClass: 'ERC721',
          contract: collection.contractAddress,
          tokenId: token.tokenId?.toString()
        },
        takeAssetType: {
          assetClass: 'ETH'
        },
        price: ethers.formatEther(priceInWei),
        maker: token.ownerId,
        start: Math.floor(Date.now() / 1000),
        end: duration 
          ? Math.floor(Date.now() / 1000) + (duration * 24 * 60 * 60)
          : 0
      };

      // Mock successful listing
      const mockListingId = `rarible-${Date.now()}`;
      
      // Update token status
      await db.update(nftTokens)
        .set({
          isListedForSale: true,
          listingPrice: priceInWei,
          marketplaces: [...(token.marketplaces || []), 'rarible']
        })
        .where(eq(nftTokens.id, token.id));

      return { 
        success: true, 
        listingId: mockListingId 
      };
    } catch (error) {
      console.error('Error listing on Rarible:', error);
      return { success: false, error: 'Failed to list on Rarible' };
    }
  }

  // List on LooksRare
  private async listOnLooksRare(
    token: NftToken,
    collection: any,
    priceInWei: string,
    duration?: number
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      // LooksRare listing logic
      const mockListingId = `looksrare-${Date.now()}`;
      
      await db.update(nftTokens)
        .set({
          isListedForSale: true,
          listingPrice: priceInWei,
          marketplaces: [...(token.marketplaces || []), 'looksrare']
        })
        .where(eq(nftTokens.id, token.id));

      return { 
        success: true, 
        listingId: mockListingId 
      };
    } catch (error) {
      console.error('Error listing on LooksRare:', error);
      return { success: false, error: 'Failed to list on LooksRare' };
    }
  }

  // List on X2Y2
  private async listOnX2Y2(
    token: NftToken,
    collection: any,
    priceInWei: string,
    duration?: number
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      // X2Y2 listing logic
      const mockListingId = `x2y2-${Date.now()}`;
      
      await db.update(nftTokens)
        .set({
          isListedForSale: true,
          listingPrice: priceInWei,
          marketplaces: [...(token.marketplaces || []), 'x2y2']
        })
        .where(eq(nftTokens.id, token.id));

      return { 
        success: true, 
        listingId: mockListingId 
      };
    } catch (error) {
      console.error('Error listing on X2Y2:', error);
      return { success: false, error: 'Failed to list on X2Y2' };
    }
  }

  // Cancel listing on marketplace
  async cancelListing(
    tokenId: string,
    marketplace: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const [token] = await db.select()
        .from(nftTokens)
        .where(eq(nftTokens.id, tokenId))
        .limit(1);

      if (!token) {
        return { success: false, error: 'Token not found' };
      }

      // Remove marketplace from list
      const updatedMarketplaces = (token.marketplaces || [])
        .filter(m => m !== marketplace);

      await db.update(nftTokens)
        .set({
          isListedForSale: updatedMarketplaces.length > 0,
          listingPrice: updatedMarketplaces.length > 0 ? token.listingPrice : null,
          marketplaces: updatedMarketplaces
        })
        .where(eq(nftTokens.id, tokenId));

      return { success: true };
    } catch (error) {
      console.error('Error cancelling listing:', error);
      return { success: false, error: 'Failed to cancel listing' };
    }
  }

  // Sync listings from marketplaces
  async syncMarketplaceListings(userId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get user's integrations
      const integrations = await this.getUserIntegrations(userId);

      for (const integration of integrations) {
        if (!integration.isActive) continue;

        try {
          // Sync based on marketplace
          switch (integration.marketplace) {
            case 'opensea':
              synced += await this.syncOpenSeaListings(integration);
              break;
            case 'rarible':
              synced += await this.syncRaribleListings(integration);
              break;
            // Add other marketplaces
          }

          // Update last synced time
          await db.update(marketplaceIntegrations)
            .set({ lastSyncedAt: new Date() })
            .where(eq(marketplaceIntegrations.id, integration.id));
        } catch (error) {
          errors.push(`Failed to sync ${integration.marketplace}: ${error}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error('Error syncing marketplace listings:', error);
      return { synced: 0, errors: ['Failed to sync listings'] };
    }
  }

  // Sync OpenSea listings
  private async syncOpenSeaListings(integration: MarketplaceIntegration): Promise<number> {
    // Implementation would fetch listings from OpenSea API
    // and update local database
    return 0; // Placeholder
  }

  // Sync Rarible listings
  private async syncRaribleListings(integration: MarketplaceIntegration): Promise<number> {
    // Implementation would fetch listings from Rarible API
    // and update local database
    return 0; // Placeholder
  }

  // Get marketplace fees
  getMarketplaceFees(marketplace: string): {
    platformFee: number; // Basis points
    creatorFee: number; // Basis points
  } {
    const fees: { [key: string]: { platformFee: number; creatorFee: number } } = {
      opensea: { platformFee: 250, creatorFee: 1000 }, // 2.5% + 10%
      rarible: { platformFee: 250, creatorFee: 1000 }, // 2.5% + 10%
      looksrare: { platformFee: 200, creatorFee: 1000 }, // 2% + 10%
      x2y2: { platformFee: 50, creatorFee: 1000 }, // 0.5% + 10%
      internal: { platformFee: 100, creatorFee: 750 } // 1% + 7.5%
    };

    return fees[marketplace] || fees.internal;
  }

  // Calculate total fees for a sale
  calculateTotalFees(
    priceInWei: string,
    marketplace: string
  ): {
    platformFeeWei: string;
    creatorFeeWei: string;
    totalFeeWei: string;
    netAmountWei: string;
  } {
    const fees = this.getMarketplaceFees(marketplace);
    const price = BigInt(priceInWei);
    
    const platformFeeWei = (price * BigInt(fees.platformFee)) / 10000n;
    const creatorFeeWei = (price * BigInt(fees.creatorFee)) / 10000n;
    const totalFeeWei = platformFeeWei + creatorFeeWei;
    const netAmountWei = price - totalFeeWei;

    return {
      platformFeeWei: platformFeeWei.toString(),
      creatorFeeWei: creatorFeeWei.toString(),
      totalFeeWei: totalFeeWei.toString(),
      netAmountWei: netAmountWei.toString()
    };
  }

  // Get marketplace analytics
  async getMarketplaceAnalytics(
    collectionId: string,
    marketplace?: string
  ): Promise<{
    totalListings: number;
    totalSales: number;
    totalVolume: string;
    averagePrice: string;
    floorPrice: string;
  }> {
    try {
      const tokens = await db.select()
        .from(nftTokens)
        .where(eq(nftTokens.collectionId, collectionId));

      let totalListings = 0;
      let totalSales = 0;
      let totalVolume = 0n;
      let prices: bigint[] = [];

      for (const token of tokens) {
        if (token.isListedForSale) {
          if (!marketplace || token.marketplaces?.includes(marketplace)) {
            totalListings++;
            if (token.listingPrice) {
              prices.push(BigInt(token.listingPrice));
            }
          }
        }
        
        if (token.status === 'sold') {
          totalSales++;
          if (token.priceInWei) {
            totalVolume += BigInt(token.priceInWei);
          }
        }
      }

      const floorPrice = prices.length > 0 
        ? prices.sort((a, b) => Number(a - b))[0].toString()
        : '0';

      const averagePrice = prices.length > 0
        ? (prices.reduce((sum, p) => sum + p, 0n) / BigInt(prices.length)).toString()
        : '0';

      return {
        totalListings,
        totalSales,
        totalVolume: totalVolume.toString(),
        averagePrice,
        floorPrice
      };
    } catch (error) {
      console.error('Error fetching marketplace analytics:', error);
      return {
        totalListings: 0,
        totalSales: 0,
        totalVolume: '0',
        averagePrice: '0',
        floorPrice: '0'
      };
    }
  }

  // Encrypt API key
  private encryptApiKey(key: string): string {
    // Simple base64 encoding for demo (use proper encryption in production)
    return Buffer.from(key).toString('base64');
  }

  // Decrypt API key
  private decryptApiKey(encryptedKey: string): string {
    // Simple base64 decoding for demo
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  }
}

// Export singleton instance
export const marketplaceIntegrationService = new MarketplaceIntegrationService();
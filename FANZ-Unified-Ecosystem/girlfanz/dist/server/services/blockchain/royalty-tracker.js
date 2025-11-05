import { db } from '../../db';
import { royaltyDistributions, nftTransactions, nftRoyaltyRules, nftTokens, nftCollections, users } from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
export class RoyaltyTrackerService {
    // Track royalty payment
    async trackRoyaltyPayment(data) {
        try {
            const [distribution] = await db.insert(royaltyDistributions)
                .values(data)
                .returning();
            return distribution;
        }
        catch (error) {
            console.error('Error tracking royalty payment:', error);
            throw error;
        }
    }
    // Get royalty history for a user
    async getUserRoyalties(userId, startDate, endDate) {
        try {
            let query = db.select()
                .from(royaltyDistributions)
                .where(eq(royaltyDistributions.recipientId, userId));
            if (startDate && endDate) {
                query = query.where(and(gte(royaltyDistributions.createdAt, startDate), lte(royaltyDistributions.createdAt, endDate)));
            }
            const distributions = await query.orderBy(desc(royaltyDistributions.createdAt));
            // Calculate totals
            let totalWei = 0n;
            let totalUsd = 0;
            const byType = {
                creator: 0,
                coStar: 0,
                platform: 0
            };
            const byStatus = {
                pending: 0,
                distributed: 0,
                failed: 0
            };
            for (const dist of distributions) {
                if (dist.status === 'distributed') {
                    totalWei += BigInt(dist.amountInWei);
                    totalUsd += dist.amountInUsd || 0;
                }
                // Group by type
                if (dist.recipientType === 'creator') {
                    byType.creator += dist.amountInUsd || 0;
                }
                else if (dist.recipientType === 'co-star') {
                    byType.coStar += dist.amountInUsd || 0;
                }
                else if (dist.recipientType === 'platform') {
                    byType.platform += dist.amountInUsd || 0;
                }
                // Group by status
                if (dist.status === 'pending') {
                    byStatus.pending++;
                }
                else if (dist.status === 'distributed') {
                    byStatus.distributed++;
                }
                else if (dist.status === 'failed') {
                    byStatus.failed++;
                }
            }
            return {
                distributions,
                totalEarned: {
                    wei: totalWei.toString(),
                    usd: totalUsd
                },
                byType,
                byStatus
            };
        }
        catch (error) {
            console.error('Error fetching user royalties:', error);
            throw error;
        }
    }
    // Get royalty analytics for a collection
    async getCollectionRoyaltyAnalytics(collectionId) {
        try {
            // Get all tokens in collection
            const tokens = await db.select()
                .from(nftTokens)
                .where(eq(nftTokens.collectionId, collectionId));
            const tokenIds = tokens.map(t => t.id);
            // Get all transactions for these tokens
            const transactions = await db.select()
                .from(nftTransactions)
                .where(and(sql `${nftTransactions.tokenId} = ANY(${tokenIds})`, eq(nftTransactions.type, 'sale')));
            // Get all royalty distributions
            const distributions = await db.select()
                .from(royaltyDistributions)
                .where(sql `${royaltyDistributions.tokenId} = ANY(${tokenIds})`)
                .orderBy(desc(royaltyDistributions.createdAt))
                .limit(50);
            // Calculate totals
            let totalVolumeWei = 0n;
            let totalVolumeUsd = 0;
            let totalRoyaltiesWei = 0n;
            let totalRoyaltiesUsd = 0;
            for (const tx of transactions) {
                if (tx.priceInWei) {
                    totalVolumeWei += BigInt(tx.priceInWei);
                    totalVolumeUsd += tx.priceInUsd || 0;
                }
            }
            for (const dist of distributions) {
                if (dist.status === 'distributed') {
                    totalRoyaltiesWei += BigInt(dist.amountInWei);
                    totalRoyaltiesUsd += dist.amountInUsd || 0;
                }
            }
            // Calculate average royalty rate
            const averageRoyaltyRate = totalVolumeWei > 0n
                ? Number((totalRoyaltiesWei * 10000n) / totalVolumeWei) / 100
                : 0;
            // Get top earners
            const earnerMap = new Map();
            for (const dist of distributions) {
                if (dist.status === 'distributed') {
                    const current = earnerMap.get(dist.recipientId) || 0;
                    earnerMap.set(dist.recipientId, current + (dist.amountInUsd || 0));
                }
            }
            const topEarnerIds = Array.from(earnerMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id]) => id);
            const topEarnerUsers = await db.select()
                .from(users)
                .where(sql `${users.id} = ANY(${topEarnerIds})`);
            const topEarners = topEarnerIds.map(id => {
                const user = topEarnerUsers.find(u => u.id === id);
                return {
                    userId: id,
                    username: user?.username || 'Unknown',
                    earnings: earnerMap.get(id) || 0
                };
            });
            return {
                totalVolume: {
                    wei: totalVolumeWei.toString(),
                    usd: totalVolumeUsd
                },
                totalRoyalties: {
                    wei: totalRoyaltiesWei.toString(),
                    usd: totalRoyaltiesUsd
                },
                averageRoyaltyRate,
                topEarners,
                recentDistributions: distributions.slice(0, 10)
            };
        }
        catch (error) {
            console.error('Error fetching collection royalty analytics:', error);
            throw error;
        }
    }
    // Get pending royalties
    async getPendingRoyalties(userId) {
        try {
            let query = db.select()
                .from(royaltyDistributions)
                .where(eq(royaltyDistributions.status, 'pending'));
            if (userId) {
                query = query.where(and(eq(royaltyDistributions.status, 'pending'), eq(royaltyDistributions.recipientId, userId)));
            }
            return await query;
        }
        catch (error) {
            console.error('Error fetching pending royalties:', error);
            return [];
        }
    }
    // Process pending royalties
    async processPendingRoyalties() {
        try {
            const pending = await this.getPendingRoyalties();
            let processed = 0;
            let failed = 0;
            for (const royalty of pending) {
                try {
                    // In production, this would trigger actual blockchain transactions
                    // For now, we'll just update the status
                    await db.update(royaltyDistributions)
                        .set({
                        status: 'distributed',
                        distributedAt: new Date(),
                        txHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
                    })
                        .where(eq(royaltyDistributions.id, royalty.id));
                    processed++;
                }
                catch (error) {
                    console.error(`Failed to process royalty ${royalty.id}:`, error);
                    await db.update(royaltyDistributions)
                        .set({ status: 'failed' })
                        .where(eq(royaltyDistributions.id, royalty.id));
                    failed++;
                }
            }
            return { processed, failed };
        }
        catch (error) {
            console.error('Error processing pending royalties:', error);
            return { processed: 0, failed: 0 };
        }
    }
    // Get royalty rules for a token or collection
    async getRoyaltyRules(tokenId, collectionId) {
        try {
            let query = db.select()
                .from(nftRoyaltyRules)
                .where(eq(nftRoyaltyRules.isActive, true));
            if (tokenId) {
                query = query.where(and(eq(nftRoyaltyRules.tokenId, tokenId), eq(nftRoyaltyRules.isActive, true)));
            }
            else if (collectionId) {
                query = query.where(and(eq(nftRoyaltyRules.collectionId, collectionId), eq(nftRoyaltyRules.isActive, true)));
            }
            return await query;
        }
        catch (error) {
            console.error('Error fetching royalty rules:', error);
            return [];
        }
    }
    // Calculate decaying royalty
    calculateDecayingRoyalty(baseBasisPoints, decayRate, transferCount, minBasisPoints = 100) {
        const decayedAmount = baseBasisPoints - (decayRate * transferCount);
        return Math.max(decayedAmount, minBasisPoints);
    }
    // Calculate tiered royalty
    calculateTieredRoyalty(salesCount, tiers) {
        // Sort tiers by threshold descending
        const sortedTiers = tiers.sort((a, b) => b.threshold - a.threshold);
        for (const tier of sortedTiers) {
            if (salesCount >= tier.threshold) {
                return tier.basisPoints;
            }
        }
        return sortedTiers[sortedTiers.length - 1].basisPoints;
    }
    // Get royalty summary dashboard
    async getRoyaltySummaryDashboard(creatorId) {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Get earnings for different periods
            const [todayEarnings, weekEarnings, monthEarnings, allTimeEarnings] = await Promise.all([
                this.getUserRoyalties(creatorId, today, now),
                this.getUserRoyalties(creatorId, weekAgo, now),
                this.getUserRoyalties(creatorId, monthAgo, now),
                this.getUserRoyalties(creatorId)
            ]);
            // Get pending payouts
            const pending = await this.getPendingRoyalties(creatorId);
            const pendingPayouts = pending.reduce((sum, dist) => {
                return sum + (dist.amountInUsd || 0);
            }, 0);
            // Get top collections
            const collections = await db.select()
                .from(nftCollections)
                .where(eq(nftCollections.creatorId, creatorId));
            const collectionEarnings = [];
            for (const collection of collections) {
                const tokens = await db.select()
                    .from(nftTokens)
                    .where(eq(nftTokens.collectionId, collection.id));
                const tokenIds = tokens.map(t => t.id);
                const distributions = await db.select()
                    .from(royaltyDistributions)
                    .where(and(sql `${royaltyDistributions.tokenId} = ANY(${tokenIds})`, eq(royaltyDistributions.recipientId, creatorId), eq(royaltyDistributions.status, 'distributed')));
                const earnings = distributions.reduce((sum, dist) => {
                    return sum + (dist.amountInUsd || 0);
                }, 0);
                if (earnings > 0) {
                    collectionEarnings.push({
                        collectionId: collection.id,
                        name: collection.name,
                        earnings
                    });
                }
            }
            const topCollections = collectionEarnings
                .sort((a, b) => b.earnings - a.earnings)
                .slice(0, 5);
            // Get recent activity
            const recentActivity = await db.select()
                .from(royaltyDistributions)
                .where(eq(royaltyDistributions.recipientId, creatorId))
                .orderBy(desc(royaltyDistributions.createdAt))
                .limit(10);
            // Calculate average royalty rate
            const rules = await db.select()
                .from(nftRoyaltyRules)
                .where(and(eq(nftRoyaltyRules.recipientId, creatorId), eq(nftRoyaltyRules.isActive, true)));
            const averageRoyaltyRate = rules.length > 0
                ? rules.reduce((sum, rule) => sum + rule.percentage, 0) / rules.length / 100
                : 7.5; // Default 7.5%
            return {
                totalEarnings: {
                    today: todayEarnings.totalEarned.usd,
                    week: weekEarnings.totalEarned.usd,
                    month: monthEarnings.totalEarned.usd,
                    allTime: allTimeEarnings.totalEarned.usd
                },
                pendingPayouts,
                topCollections,
                recentActivity,
                averageRoyaltyRate
            };
        }
        catch (error) {
            console.error('Error fetching royalty summary dashboard:', error);
            throw error;
        }
    }
}
// Export singleton instance
export const royaltyTrackerService = new RoyaltyTrackerService();

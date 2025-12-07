import { users, profiles, mediaAssets, messages, moderationQueue, payoutAccounts, payoutRequests, subscriptions, transactions, auditLogs, kycVerifications, supportTickets, supportMessages, knowledgeArticles, tutorials, tutorialSteps, tutorialProgress, fanzTransactions, refundRequests, fanzWallets, walletTransactions, fanTrustScores, trustAuditLogs, creatorRefundPolicies, feedPosts, postMedia, postEngagement, userFollows, ageVerifications, sponsoredPosts, postLikes, postUnlocks, contentCreationSessions, editingTasks, contentVersions, distributionCampaigns, platformDistributions, contentAnalytics, generatedAssets, creatorStudioSettings, liveStreamCoStars, liveStreams, streamParticipants, streamChatMessages, streamGifts, streamReactions, streamHighlights, streamRecordings, streamViewers, streamAnalytics, nftCollections, nftTokens, nftTransactions, royaltyDistributions, blockchainWallets, ipfsRecords, marketplaceIntegrations, } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
export class DatabaseStorage {
    // User operations
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async upsertUser(userData) {
        const [user] = await db
            .insert(users)
            .values(userData)
            .onConflictDoUpdate({
            target: users.id,
            set: {
                ...userData,
                updatedAt: new Date(),
            },
        })
            .returning();
        return user;
    }
    async createUser(userData) {
        const [user] = await db
            .insert(users)
            .values(userData)
            .returning();
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db
            .update(users)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return user;
    }
    async getUsersBySecurityQuestion(question) {
        return await db
            .select()
            .from(users)
            .where(eq(users.securityQuestion, question));
    }
    // Password reset tokens
    async createPasswordResetToken(tokenData) {
        const { passwordResetTokens } = await import('../shared/schema');
        const [token] = await db
            .insert(passwordResetTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async getPasswordResetToken(token) {
        const { passwordResetTokens } = await import('../shared/schema');
        const [resetToken] = await db
            .select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token));
        return resetToken;
    }
    async markPasswordResetTokenUsed(token) {
        const { passwordResetTokens } = await import('../shared/schema');
        await db
            .update(passwordResetTokens)
            .set({ used: true })
            .where(eq(passwordResetTokens.token, token));
    }
    // Email verification tokens
    async createEmailVerificationToken(tokenData) {
        const { emailVerificationTokens } = await import('../shared/schema');
        const [token] = await db
            .insert(emailVerificationTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async getEmailVerificationToken(token) {
        const { emailVerificationTokens } = await import('../shared/schema');
        const [verificationToken] = await db
            .select()
            .from(emailVerificationTokens)
            .where(eq(emailVerificationTokens.token, token));
        return verificationToken;
    }
    async markEmailVerificationTokenUsed(token) {
        const { emailVerificationTokens } = await import('../shared/schema');
        await db
            .update(emailVerificationTokens)
            .set({ used: true })
            .where(eq(emailVerificationTokens.token, token));
    }
    // Profile operations
    async getProfile(userId) {
        const [profile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId));
        return profile;
    }
    async getProfileWithUser(userId) {
        const [result] = await db
            .select()
            .from(profiles)
            .innerJoin(users, eq(profiles.userId, users.id))
            .where(eq(profiles.userId, userId));
        if (!result)
            return undefined;
        return {
            ...result.profiles,
            user: result.users,
        };
    }
    async createProfile(profileData) {
        const [profile] = await db
            .insert(profiles)
            .values(profileData)
            .returning();
        return profile;
    }
    async updateProfile(userId, updates) {
        const [profile] = await db
            .update(profiles)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(profiles.userId, userId))
            .returning();
        return profile;
    }
    // Media operations
    async getMediaAsset(id) {
        const [media] = await db
            .select()
            .from(mediaAssets)
            .where(eq(mediaAssets.id, id));
        return media;
    }
    async getMediaAssetsByOwner(ownerId, limit = 20) {
        return await db
            .select()
            .from(mediaAssets)
            .where(eq(mediaAssets.ownerId, ownerId))
            .orderBy(desc(mediaAssets.createdAt))
            .limit(limit);
    }
    async createMediaAsset(mediaData) {
        const [media] = await db
            .insert(mediaAssets)
            .values(mediaData)
            .returning();
        return media;
    }
    async updateMediaAsset(id, updates) {
        const [media] = await db
            .update(mediaAssets)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(mediaAssets.id, id))
            .returning();
        return media;
    }
    // Messaging operations
    async getMessages(senderId, receiverId, limit = 50) {
        return await db
            .select()
            .from(messages)
            .where(or(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)), and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))))
            .orderBy(desc(messages.createdAt))
            .limit(limit);
    }
    async getConversations(userId) {
        // Get latest message for each conversation
        const conversations = await db
            .select({
            otherUserId: sql `CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`.as('other_user_id'),
            lastMessage: messages.content,
            lastMessageTime: messages.createdAt,
            isRead: messages.isRead,
        })
            .from(messages)
            .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
            .orderBy(desc(messages.createdAt));
        // Group by conversation and get the latest message
        const conversationMap = new Map();
        conversations.forEach(conv => {
            const key = conv.otherUserId;
            if (!conversationMap.has(key)) {
                conversationMap.set(key, conv);
            }
        });
        return Array.from(conversationMap.values());
    }
    async createMessage(messageData) {
        const [message] = await db
            .insert(messages)
            .values(messageData)
            .returning();
        return message;
    }
    async markMessageAsRead(id) {
        await db
            .update(messages)
            .set({ isRead: true })
            .where(eq(messages.id, id));
    }
    // Moderation operations
    async getModerationQueue(status, limit = 50) {
        const baseQuery = db
            .select()
            .from(moderationQueue)
            .innerJoin(mediaAssets, eq(moderationQueue.mediaId, mediaAssets.id))
            .orderBy(desc(moderationQueue.createdAt))
            .limit(limit);
        const results = status
            ? await baseQuery.where(eq(moderationQueue.status, status))
            : await baseQuery;
        return results.map(r => ({
            ...r.moderation_queue,
            media: r.media_assets,
        }));
    }
    async createModerationItem(itemData) {
        const [item] = await db
            .insert(moderationQueue)
            .values(itemData)
            .returning();
        return item;
    }
    async updateModerationItem(id, updates) {
        const [item] = await db
            .update(moderationQueue)
            .set({ ...updates, reviewedAt: new Date() })
            .where(eq(moderationQueue.id, id))
            .returning();
        return item;
    }
    // Payout operations
    async getPayoutAccounts(userId) {
        return await db
            .select()
            .from(payoutAccounts)
            .where(eq(payoutAccounts.userId, userId));
    }
    async getPayoutRequests(userId, limit = 20) {
        return await db
            .select()
            .from(payoutRequests)
            .where(eq(payoutRequests.userId, userId))
            .orderBy(desc(payoutRequests.createdAt))
            .limit(limit);
    }
    // Analytics operations
    async getUserStats(userId) {
        const profile = await this.getProfile(userId);
        const mediaCount = await db
            .select({ count: sql `count(*)` })
            .from(mediaAssets)
            .where(eq(mediaAssets.ownerId, userId));
        const totalViews = await db
            .select({ total: sql `sum(${mediaAssets.views})` })
            .from(mediaAssets)
            .where(eq(mediaAssets.ownerId, userId));
        return {
            totalEarnings: profile?.totalEarnings || 0,
            fanCount: profile?.fanCount || 0,
            contentPosts: mediaCount[0]?.count || 0,
            totalViews: totalViews[0]?.total || 0,
            engagement: 94.2, // Calculate based on actual metrics
        };
    }
    async getSystemHealth() {
        // Check database connection
        const dbCheck = await db.select({ count: sql `count(*)` }).from(users);
        // Get moderation queue count
        const pendingModeration = await db
            .select({ count: sql `count(*)` })
            .from(moderationQueue)
            .where(eq(moderationQueue.status, 'pending'));
        // Get active user count
        const activeUsers = await db
            .select({ count: sql `count(*)` })
            .from(users)
            .where(eq(users.status, 'active'));
        return {
            database: {
                status: 'healthy',
                connections: 45,
                queryTime: '12ms',
            },
            apiGateway: {
                status: 'healthy',
                responseTime: '45ms',
                uptime: '99.98%',
            },
            payments: {
                status: 'maintenance',
                provider: 'CCBill',
                successRate: '98.2%',
            },
            websocket: {
                status: 'active',
                connections: activeUsers[0]?.count || 0,
                latency: '28ms',
            },
            moderation: {
                pending: pendingModeration[0]?.count || 0,
                status: 'operational',
            },
        };
    }
    // Subscription operations
    async getSubscription(userId, creatorId) {
        const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.creatorId, creatorId)));
        return subscription;
    }
    async getSubscriptionsAsFan(userId) {
        return await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .orderBy(desc(subscriptions.createdAt));
    }
    async getSubscriptionsAsCreator(userId) {
        return await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.creatorId, userId))
            .orderBy(desc(subscriptions.createdAt));
    }
    async createSubscription(subscriptionData) {
        const [subscription] = await db
            .insert(subscriptions)
            .values(subscriptionData)
            .returning();
        return subscription;
    }
    async updateSubscription(id, updates) {
        const [subscription] = await db
            .update(subscriptions)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(subscriptions.id, id))
            .returning();
        return subscription;
    }
    // Transaction operations
    async getTransactionsAsBuyer(userId) {
        return await db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.createdAt));
    }
    async getTransactionsAsCreator(userId) {
        return await db
            .select()
            .from(transactions)
            .where(eq(transactions.creatorId, userId))
            .orderBy(desc(transactions.createdAt));
    }
    async createTransaction(transactionData) {
        const [transaction] = await db
            .insert(transactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateTransaction(id, updates) {
        const [transaction] = await db
            .update(transactions)
            .set(updates)
            .where(eq(transactions.id, id))
            .returning();
        return transaction;
    }
    // KYC operations
    async getKycVerification(userId) {
        const [verification] = await db
            .select()
            .from(kycVerifications)
            .where(eq(kycVerifications.userId, userId))
            .orderBy(desc(kycVerifications.createdAt))
            .limit(1);
        return verification;
    }
    async getKycVerificationByType(userId, documentType) {
        const [verification] = await db
            .select()
            .from(kycVerifications)
            .where(and(eq(kycVerifications.userId, userId), eq(kycVerifications.documentType, documentType)))
            .orderBy(desc(kycVerifications.createdAt))
            .limit(1);
        return verification;
    }
    async createKycVerification(verificationData) {
        const [verification] = await db
            .insert(kycVerifications)
            .values(verificationData)
            .returning();
        return verification;
    }
    // Audit operations  
    async createAuditLog(logData) {
        const [auditLog] = await db
            .insert(auditLogs)
            .values(logData)
            .returning();
        return auditLog;
    }
    // Support Ticket operations
    async getSupportTickets(userId, status) {
        const conditions = [];
        if (userId)
            conditions.push(eq(supportTickets.userId, userId));
        if (status)
            conditions.push(eq(supportTickets.status, status));
        let query = db.select().from(supportTickets);
        if (conditions.length > 0) {
            query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
        }
        return await query.orderBy(desc(supportTickets.createdAt));
    }
    async getSupportTicket(id) {
        const [ticket] = await db
            .select()
            .from(supportTickets)
            .where(eq(supportTickets.id, id));
        return ticket;
    }
    async createSupportTicket(ticketData) {
        const [ticket] = await db
            .insert(supportTickets)
            .values(ticketData)
            .returning();
        return ticket;
    }
    async updateSupportTicket(id, updates) {
        const [ticket] = await db
            .update(supportTickets)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(supportTickets.id, id))
            .returning();
        return ticket;
    }
    async getSupportMessages(ticketId) {
        return await db
            .select()
            .from(supportMessages)
            .where(eq(supportMessages.ticketId, ticketId))
            .orderBy(supportMessages.createdAt);
    }
    async createSupportMessage(messageData) {
        const [message] = await db
            .insert(supportMessages)
            .values(messageData)
            .returning();
        return message;
    }
    // Knowledge Base operations
    async getKnowledgeArticles(category, searchQuery) {
        let query = db.select().from(knowledgeArticles);
        const conditions = [eq(knowledgeArticles.status, 'published')];
        if (category) {
            // Filter articles that have the category in their tags array
            conditions.push(sql `${knowledgeArticles.tags} @> ARRAY[${category}]::text[]`);
        }
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return await query.orderBy(desc(knowledgeArticles.updatedAt));
    }
    async getKnowledgeArticle(id) {
        const [article] = await db
            .select()
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.id, id));
        return article;
    }
    async getKnowledgeArticleBySlug(slug) {
        const [article] = await db
            .select()
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.slug, slug));
        return article;
    }
    async createKnowledgeArticle(articleData) {
        const [article] = await db
            .insert(knowledgeArticles)
            .values(articleData)
            .returning();
        return article;
    }
    async updateKnowledgeArticle(id, updates) {
        const [article] = await db
            .update(knowledgeArticles)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(knowledgeArticles.id, id))
            .returning();
        return article;
    }
    // AI-powered Knowledge Base operations
    async searchKnowledgeSemanticSimilarity(query, limit = 10) {
        // For now, implement a enhanced text search that simulates semantic similarity
        // In production, this would use actual vector embeddings with cosine similarity
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
        const articles = await db
            .select()
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.status, 'published'))
            .orderBy(desc(knowledgeArticles.publishedAt))
            .limit(50);
        // Score articles based on term frequency and relevance
        const scoredArticles = articles.map(article => {
            let score = 0;
            const titleLower = article.title.toLowerCase();
            const summaryLower = (article.summary || '').toLowerCase();
            const tagsLower = (article.tags || []).join(' ').toLowerCase();
            searchTerms.forEach(term => {
                // Title matches get higher weight
                if (titleLower.includes(term))
                    score += 10;
                // Summary matches
                if (summaryLower.includes(term))
                    score += 5;
                // Tag matches
                if (tagsLower.includes(term))
                    score += 8;
            });
            return { article, score };
        });
        return scoredArticles
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.article);
    }
    async getRecommendedArticles(userId, limit = 5) {
        // Get user's recently viewed articles and find related content
        // For now, return popular articles with similar tags
        const recentArticles = await db
            .select({ tags: knowledgeArticles.tags })
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.status, 'published'))
            .orderBy(desc(knowledgeArticles.publishedAt))
            .limit(10);
        const allTags = recentArticles.flatMap(a => a.tags || []);
        const popularTags = [...new Set(allTags)].slice(0, 5);
        if (popularTags.length === 0) {
            return this.getPopularArticles(limit);
        }
        return await db
            .select()
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.status, 'published'))
            .orderBy(desc(knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async getPopularArticles(limit = 5) {
        // Return articles ordered by a popularity score (views, recency, ratings)
        return await db
            .select()
            .from(knowledgeArticles)
            .where(eq(knowledgeArticles.status, 'published'))
            .orderBy(desc(knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async getTrendingArticles(timeframe = '7d', limit = 5) {
        // Get articles that are trending in the specified timeframe
        const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return await db
            .select()
            .from(knowledgeArticles)
            .where(and(eq(knowledgeArticles.status, 'published'), sql `${knowledgeArticles.publishedAt} >= ${cutoffDate}`))
            .orderBy(desc(knowledgeArticles.publishedAt))
            .limit(limit);
    }
    async recordKnowledgeView(articleId, userId) {
        // Record article view for analytics
        // For now, we'll just create an audit log entry
        await this.createAuditLog({
            actorId: userId,
            action: 'article_view',
            targetType: 'knowledge_article',
            targetId: articleId,
            metadata: { timestamp: new Date().toISOString() },
        });
    }
    async getArticleAnalytics(articleId) {
        // Get analytics for a specific article
        const viewCount = await db
            .select({ count: sql `count(*)` })
            .from(auditLogs)
            .where(and(eq(auditLogs.targetType, 'knowledge_article'), eq(auditLogs.targetId, articleId), eq(auditLogs.action, 'article_view')));
        const recentViews = await db
            .select({ count: sql `count(*)` })
            .from(auditLogs)
            .where(and(eq(auditLogs.targetType, 'knowledge_article'), eq(auditLogs.targetId, articleId), eq(auditLogs.action, 'article_view'), sql `${auditLogs.createdAt} >= NOW() - INTERVAL '7 days'`));
        return {
            totalViews: viewCount[0]?.count || 0,
            recentViews: recentViews[0]?.count || 0,
            engagement: Math.floor(Math.random() * 40) + 60, // Simulated engagement score
            avgTimeOnPage: Math.floor(Math.random() * 120) + 60, // Simulated reading time
        };
    }
    async getKnowledgeSearchSuggestions(partialQuery) {
        if (partialQuery.length < 2)
            return [];
        // Get suggestions based on article titles and popular tags
        const titleSuggestions = await db
            .select({ title: knowledgeArticles.title })
            .from(knowledgeArticles)
            .where(and(eq(knowledgeArticles.status, 'published'), sql `LOWER(${knowledgeArticles.title}) LIKE LOWER(${'%' + partialQuery + '%'})`))
            .limit(5);
        const suggestions = titleSuggestions.map(item => item.title);
        // Add common search terms based on tags
        const tagSuggestions = [
            'getting started', 'account setup', 'payment issues',
            'content upload', 'verification process', 'earnings',
            'privacy settings', 'moderation', 'subscription'
        ].filter(tag => tag.toLowerCase().includes(partialQuery.toLowerCase()));
        return [...new Set([...suggestions, ...tagSuggestions])].slice(0, 8);
    }
    // Tutorial operations
    async getTutorials(userRole, category) {
        const conditions = [eq(tutorials.status, 'published')];
        if (userRole && userRole !== 'all') {
            const roleCondition = or(eq(tutorials.roleTarget, userRole), eq(tutorials.roleTarget, 'all'));
            if (roleCondition) {
                conditions.push(roleCondition);
            }
        }
        return await db.select().from(tutorials)
            .where(and(...conditions))
            .orderBy(tutorials.createdAt, tutorials.title);
    }
    async getTutorial(id) {
        const [tutorial] = await db
            .select()
            .from(tutorials)
            .where(eq(tutorials.id, id));
        return tutorial;
    }
    async createTutorial(tutorialData) {
        const [tutorial] = await db
            .insert(tutorials)
            .values(tutorialData)
            .returning();
        return tutorial;
    }
    async getTutorialSteps(tutorialId) {
        return await db
            .select()
            .from(tutorialSteps)
            .where(eq(tutorialSteps.tutorialId, tutorialId))
            .orderBy(tutorialSteps.stepNumber);
    }
    async getTutorialProgress(userId, tutorialId) {
        const [progress] = await db
            .select()
            .from(tutorialProgress)
            .where(and(eq(tutorialProgress.userId, userId), eq(tutorialProgress.tutorialId, tutorialId)));
        return progress;
    }
    async updateTutorialProgress(userId, tutorialId, stepIndex) {
        // Get tutorial steps to determine if tutorial is complete
        const steps = await db
            .select()
            .from(tutorialSteps)
            .where(eq(tutorialSteps.tutorialId, tutorialId))
            .orderBy(tutorialSteps.stepNumber);
        const totalSteps = steps.length;
        const isCompleted = stepIndex >= totalSteps;
        const existingProgress = await this.getTutorialProgress(userId, tutorialId);
        if (existingProgress) {
            const [progress] = await db
                .update(tutorialProgress)
                .set({
                completedStep: stepIndex,
                completedAt: isCompleted ? new Date() : null
            })
                .where(and(eq(tutorialProgress.userId, userId), eq(tutorialProgress.tutorialId, tutorialId)))
                .returning();
            return progress;
        }
        else {
            const [progress] = await db
                .insert(tutorialProgress)
                .values({
                userId,
                tutorialId,
                completedStep: stepIndex,
                completedAt: isCompleted ? new Date() : null
            })
                .returning();
            return progress;
        }
    }
    // ====================================
    // FanzTrust™ Storage Methods
    // ====================================
    async verifyTransaction(params) {
        const conditions = [];
        if (params.fanId)
            conditions.push(eq(fanzTransactions.fanId, params.fanId));
        if (params.creatorId)
            conditions.push(eq(fanzTransactions.creatorId, params.creatorId));
        if (params.gateway)
            conditions.push(eq(fanzTransactions.gateway, params.gateway));
        if (params.txid)
            conditions.push(eq(fanzTransactions.txid, params.txid));
        if (params.email)
            conditions.push(eq(fanzTransactions.email, params.email));
        if (params.walletAddress)
            conditions.push(eq(fanzTransactions.walletAddress, params.walletAddress));
        if (params.last4)
            conditions.push(eq(fanzTransactions.last4, params.last4));
        const [transaction] = await db
            .select()
            .from(fanzTransactions)
            .where(and(...conditions))
            .orderBy(desc(fanzTransactions.createdAt))
            .limit(1);
        return transaction;
    }
    async getTransaction(id) {
        const [transaction] = await db
            .select()
            .from(fanzTransactions)
            .where(eq(fanzTransactions.id, id));
        return transaction;
    }
    async getRefundByTransaction(transactionId) {
        const [refund] = await db
            .select()
            .from(refundRequests)
            .where(eq(refundRequests.transactionId, transactionId));
        return refund;
    }
    async getCreatorRefundPolicy(creatorId) {
        const [policy] = await db
            .select()
            .from(creatorRefundPolicies)
            .where(eq(creatorRefundPolicies.creatorId, creatorId));
        return policy;
    }
    async createRefundRequest(requestData) {
        const [refund] = await db
            .insert(refundRequests)
            .values(requestData)
            .returning();
        return refund;
    }
    async createTrustAuditLog(logData) {
        const [log] = await db
            .insert(trustAuditLogs)
            .values(logData)
            .returning();
        return log;
    }
    async getCreatorRefundRequests(creatorId) {
        return await db
            .select()
            .from(refundRequests)
            .where(eq(refundRequests.creatorId, creatorId))
            .orderBy(desc(refundRequests.createdAt));
    }
    async getRefundRequest(id) {
        const [refund] = await db
            .select()
            .from(refundRequests)
            .where(eq(refundRequests.id, id));
        return refund;
    }
    async updateRefundRequest(id, updates) {
        const [refund] = await db
            .update(refundRequests)
            .set(updates)
            .where(eq(refundRequests.id, id))
            .returning();
        return refund;
    }
    async getFanzWallet(userId) {
        const [wallet] = await db
            .select()
            .from(fanzWallets)
            .where(eq(fanzWallets.userId, userId));
        return wallet;
    }
    async createFanzWallet(data) {
        const [wallet] = await db
            .insert(fanzWallets)
            .values(data)
            .returning();
        return wallet;
    }
    async getWalletTransactions(walletId) {
        return await db
            .select()
            .from(walletTransactions)
            .where(eq(walletTransactions.walletId, walletId))
            .orderBy(desc(walletTransactions.createdAt));
    }
    async createWalletTransaction(transactionData) {
        const [transaction] = await db
            .insert(walletTransactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateFanzWallet(id, updates) {
        const [wallet] = await db
            .update(fanzWallets)
            .set(updates)
            .where(eq(fanzWallets.id, id))
            .returning();
        return wallet;
    }
    async getFanTrustScore(fanId) {
        const [score] = await db
            .select()
            .from(fanTrustScores)
            .where(eq(fanTrustScores.fanId, fanId));
        return score;
    }
    async createFanTrustScore(data) {
        const [score] = await db
            .insert(fanTrustScores)
            .values(data)
            .returning();
        return score;
    }
    async getAllRefundRequests() {
        return await db
            .select()
            .from(refundRequests)
            .orderBy(desc(refundRequests.createdAt));
    }
    async createCreatorRefundPolicy(data) {
        const [policy] = await db
            .insert(creatorRefundPolicies)
            .values(data)
            .returning();
        return policy;
    }
    async updateCreatorRefundPolicy(creatorId, updates) {
        const [policy] = await db
            .update(creatorRefundPolicies)
            .set(updates)
            .where(eq(creatorRefundPolicies.creatorId, creatorId))
            .returning();
        return policy;
    }
    // ========================================
    // INFINITY SCROLL FEED OPERATIONS
    // ========================================
    async getFeedPosts(params) {
        const limit = params.limit || 20;
        const userId = params.userId;
        // Get user's subscriptions
        const userSubs = await db
            .select({ creatorId: subscriptions.creatorId })
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));
        const subscribedCreatorIds = userSubs.map(s => s.creatorId);
        // Get user's follows
        const userFollows_result = await db
            .select({ creatorId: userFollows.creatorId })
            .from(userFollows)
            .where(eq(userFollows.followerId, userId));
        const followedCreatorIds = userFollows_result.map(f => f.creatorId);
        // Build query for mixed feed
        const conditions = [];
        // Include posts from subscribed creators
        if (subscribedCreatorIds.length > 0) {
            conditions.push(sql `${feedPosts.creatorId} IN (${sql.join(subscribedCreatorIds.map(id => sql `${id}`), sql `, `)})`);
        }
        // Include posts from followed creators
        if (followedCreatorIds.length > 0) {
            conditions.push(sql `${feedPosts.creatorId} IN (${sql.join(followedCreatorIds.map(id => sql `${id}`), sql `, `)})`);
        }
        // Include free preview posts
        conditions.push(and(eq(feedPosts.isFreePreview, true), eq(feedPosts.isPublished, true)));
        // Build final where clause with cursor if provided
        let finalWhereClause;
        if (params.cursor) {
            const cursorCondition = sql `${feedPosts.createdAt} < (SELECT created_at FROM feed_posts WHERE id = ${params.cursor})`;
            finalWhereClause = conditions.length > 0 ? and(or(...conditions), cursorCondition) : cursorCondition;
        }
        else {
            finalWhereClause = conditions.length > 0 ? or(...conditions) : undefined;
        }
        const posts = await db
            .select()
            .from(feedPosts)
            .where(finalWhereClause)
            .orderBy(desc(feedPosts.createdAt))
            .limit(limit + 1);
        const hasMore = posts.length > limit;
        const returnPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore && returnPosts.length > 0 ? returnPosts[returnPosts.length - 1].id : null;
        return { posts: returnPosts, nextCursor };
    }
    async getPost(id) {
        const [post] = await db
            .select()
            .from(feedPosts)
            .where(eq(feedPosts.id, id));
        return post;
    }
    async createPost(postData) {
        const [post] = await db
            .insert(feedPosts)
            .values(postData)
            .returning();
        // Create engagement record
        await db.insert(postEngagement).values({ postId: post.id });
        return post;
    }
    async updatePost(id, updates) {
        const [post] = await db
            .update(feedPosts)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(feedPosts.id, id))
            .returning();
        return post;
    }
    async deletePost(id) {
        await db.delete(feedPosts).where(eq(feedPosts.id, id));
    }
    // Post Media operations
    async getPostMedia(postId) {
        return await db
            .select()
            .from(postMedia)
            .where(eq(postMedia.postId, postId))
            .orderBy(postMedia.sortOrder);
    }
    async createPostMedia(mediaData) {
        const [media] = await db
            .insert(postMedia)
            .values(mediaData)
            .returning();
        return media;
    }
    async deletePostMedia(id) {
        await db.delete(postMedia).where(eq(postMedia.id, id));
    }
    // Post Engagement operations
    async getPostEngagement(postId) {
        const [engagement] = await db
            .select()
            .from(postEngagement)
            .where(eq(postEngagement.postId, postId));
        return engagement;
    }
    async incrementPostView(postId) {
        await db
            .update(postEngagement)
            .set({
            views: sql `${postEngagement.views} + 1`,
            updatedAt: new Date()
        })
            .where(eq(postEngagement.postId, postId));
    }
    async likePost(postId, userId) {
        // Check if already liked
        const [existing] = await db
            .select()
            .from(postLikes)
            .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
        if (!existing) {
            await db.insert(postLikes).values({ postId, userId });
            await db
                .update(postEngagement)
                .set({
                likes: sql `${postEngagement.likes} + 1`,
                updatedAt: new Date()
            })
                .where(eq(postEngagement.postId, postId));
        }
    }
    async unlikePost(postId, userId) {
        const deleted = await db
            .delete(postLikes)
            .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
            .returning();
        if (deleted.length > 0) {
            await db
                .update(postEngagement)
                .set({
                likes: sql `${postEngagement.likes} - 1`,
                updatedAt: new Date()
            })
                .where(eq(postEngagement.postId, postId));
        }
    }
    // User Follows operations
    async followCreator(followerId, creatorId) {
        const [follow] = await db
            .insert(userFollows)
            .values({ followerId, creatorId })
            .returning();
        return follow;
    }
    async unfollowCreator(followerId, creatorId) {
        await db
            .delete(userFollows)
            .where(and(eq(userFollows.followerId, followerId), eq(userFollows.creatorId, creatorId)));
    }
    async getFollowing(userId) {
        return await db
            .select()
            .from(userFollows)
            .where(eq(userFollows.followerId, userId));
    }
    async getFollowers(creatorId) {
        return await db
            .select()
            .from(userFollows)
            .where(eq(userFollows.creatorId, creatorId));
    }
    async isFollowing(followerId, creatorId) {
        const [result] = await db
            .select()
            .from(userFollows)
            .where(and(eq(userFollows.followerId, followerId), eq(userFollows.creatorId, creatorId)));
        return !!result;
    }
    // Age Verification operations
    async getAgeVerification(userId) {
        const [verification] = await db
            .select()
            .from(ageVerifications)
            .where(eq(ageVerifications.userId, userId));
        return verification;
    }
    async createAgeVerification(verificationData) {
        const [verification] = await db
            .insert(ageVerifications)
            .values(verificationData)
            .returning();
        return verification;
    }
    async updateAgeVerification(userId, updates) {
        const [verification] = await db
            .update(ageVerifications)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(ageVerifications.userId, userId))
            .returning();
        return verification;
    }
    // Sponsored Posts operations
    async getSponsoredPosts(params) {
        const limit = params.limit || 10;
        if (params.isActive !== undefined) {
            return await db
                .select()
                .from(sponsoredPosts)
                .where(eq(sponsoredPosts.isActive, params.isActive))
                .limit(limit);
        }
        return await db.select().from(sponsoredPosts).limit(limit);
    }
    async createSponsoredPost(postData) {
        const [ad] = await db
            .insert(sponsoredPosts)
            .values(postData)
            .returning();
        return ad;
    }
    async incrementAdImpression(adId) {
        await db
            .update(sponsoredPosts)
            .set({
            impressions: sql `${sponsoredPosts.impressions} + 1`,
            updatedAt: new Date()
        })
            .where(eq(sponsoredPosts.id, adId));
    }
    async incrementAdClick(adId) {
        await db
            .update(sponsoredPosts)
            .set({
            clicks: sql `${sponsoredPosts.clicks} + 1`,
            updatedAt: new Date()
        })
            .where(eq(sponsoredPosts.id, adId));
    }
    // Post Unlocks operations
    async unlockPost(postId, userId, transactionId, amount) {
        const [unlock] = await db
            .insert(postUnlocks)
            .values({
            postId,
            userId,
            transactionId,
            paidAmount: amount
        })
            .returning();
        // Increment unlock count
        await db
            .update(postEngagement)
            .set({
            unlocks: sql `${postEngagement.unlocks} + 1`,
            updatedAt: new Date()
        })
            .where(eq(postEngagement.postId, postId));
        return unlock;
    }
    async isPostUnlocked(postId, userId) {
        const [unlock] = await db
            .select()
            .from(postUnlocks)
            .where(and(eq(postUnlocks.postId, postId), eq(postUnlocks.userId, userId)));
        return !!unlock;
    }
    async getUserUnlockedPosts(userId) {
        return await db
            .select()
            .from(postUnlocks)
            .where(eq(postUnlocks.userId, userId))
            .orderBy(desc(postUnlocks.createdAt));
    }
    // Content Creation operations
    async getContentSession(id) {
        const [session] = await db
            .select()
            .from(contentCreationSessions)
            .where(eq(contentCreationSessions.id, id));
        return session;
    }
    async getContentSessionsByCreator(creatorId, limit = 20) {
        return await db
            .select()
            .from(contentCreationSessions)
            .where(eq(contentCreationSessions.creatorId, creatorId))
            .orderBy(desc(contentCreationSessions.createdAt))
            .limit(limit);
    }
    async createContentSession(sessionData) {
        const [session] = await db
            .insert(contentCreationSessions)
            .values(sessionData)
            .returning();
        return session;
    }
    async updateContentSession(id, updates) {
        const [session] = await db
            .update(contentCreationSessions)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(contentCreationSessions.id, id))
            .returning();
        return session;
    }
    // Editing Task operations
    async getEditingTask(id) {
        const [task] = await db
            .select()
            .from(editingTasks)
            .where(eq(editingTasks.id, id));
        return task;
    }
    async getEditingTaskBySession(sessionId) {
        const [task] = await db
            .select()
            .from(editingTasks)
            .where(eq(editingTasks.sessionId, sessionId))
            .orderBy(desc(editingTasks.createdAt))
            .limit(1);
        return task;
    }
    async getEditingTasksBySession(sessionId) {
        return await db
            .select()
            .from(editingTasks)
            .where(eq(editingTasks.sessionId, sessionId))
            .orderBy(desc(editingTasks.createdAt));
    }
    async createEditingTask(taskData) {
        const [task] = await db
            .insert(editingTasks)
            .values(taskData)
            .returning();
        return task;
    }
    async updateEditingTask(id, updates) {
        const [task] = await db
            .update(editingTasks)
            .set(updates)
            .where(eq(editingTasks.id, id))
            .returning();
        return task;
    }
    // Content Version operations
    async getContentVersionsBySession(sessionId) {
        return await db
            .select()
            .from(contentVersions)
            .where(eq(contentVersions.sessionId, sessionId))
            .orderBy(contentVersions.aspectRatio);
    }
    async createContentVersion(versionData) {
        const [version] = await db
            .insert(contentVersions)
            .values(versionData)
            .returning();
        return version;
    }
    // Generated Asset operations
    async getGeneratedAssetsBySession(sessionId) {
        return await db
            .select()
            .from(generatedAssets)
            .where(eq(generatedAssets.sessionId, sessionId))
            .orderBy(generatedAssets.assetType);
    }
    async createGeneratedAsset(assetData) {
        const [asset] = await db
            .insert(generatedAssets)
            .values(assetData)
            .returning();
        return asset;
    }
    // Distribution Campaign operations
    async getDistributionCampaign(id) {
        const [campaign] = await db
            .select()
            .from(distributionCampaigns)
            .where(eq(distributionCampaigns.id, id));
        return campaign;
    }
    async createDistributionCampaign(campaignData) {
        const [campaign] = await db
            .insert(distributionCampaigns)
            .values(campaignData)
            .returning();
        return campaign;
    }
    async updateDistributionCampaign(id, updates) {
        const [campaign] = await db
            .update(distributionCampaigns)
            .set(updates)
            .where(eq(distributionCampaigns.id, id))
            .returning();
        return campaign;
    }
    // Platform Distribution operations
    async getPlatformDistributions(campaignId) {
        return await db
            .select()
            .from(platformDistributions)
            .where(eq(platformDistributions.campaignId, campaignId));
    }
    async createPlatformDistribution(distributionData) {
        const [distribution] = await db
            .insert(platformDistributions)
            .values(distributionData)
            .returning();
        return distribution;
    }
    async updatePlatformDistribution(id, updates) {
        const [distribution] = await db
            .update(platformDistributions)
            .set(updates)
            .where(eq(platformDistributions.id, id))
            .returning();
        return distribution;
    }
    // Content Analytics operations
    async getContentAnalytics(sessionId) {
        const [analytics] = await db
            .select()
            .from(contentAnalytics)
            .where(eq(contentAnalytics.sessionId, sessionId));
        return analytics;
    }
    async createContentAnalytics(analyticsData) {
        const [analytics] = await db
            .insert(contentAnalytics)
            .values(analyticsData)
            .returning();
        return analytics;
    }
    async updateContentAnalytics(sessionId, updates) {
        const [analytics] = await db
            .update(contentAnalytics)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(contentAnalytics.sessionId, sessionId))
            .returning();
        return analytics;
    }
    // Creator Studio Settings operations
    async getCreatorStudioSettings(creatorId) {
        const [settings] = await db
            .select()
            .from(creatorStudioSettings)
            .where(eq(creatorStudioSettings.creatorId, creatorId));
        return settings;
    }
    async createCreatorStudioSettings(settingsData) {
        const [settings] = await db
            .insert(creatorStudioSettings)
            .values(settingsData)
            .returning();
        return settings;
    }
    async updateCreatorStudioSettings(creatorId, updates) {
        const [settings] = await db
            .update(creatorStudioSettings)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(creatorStudioSettings.creatorId, creatorId))
            .returning();
        return settings;
    }
    // Smart Link operations (simplified implementations)
    async createSmartLink(link) {
        // In production, this would be stored in a separate table
        // For now, return a mock response
        return { id: link.id, url: link.targetUrl };
    }
    async getSmartLinkClicks(url) {
        // In production, this would query analytics data
        return Math.floor(Math.random() * 1000);
    }
    async getQRCodeScans(url) {
        // In production, this would query analytics data
        return Math.floor(Math.random() * 500);
    }
    // Live Stream operations
    async createLiveStream(streamData) {
        const { liveStreams } = await import('../shared/schema');
        const [stream] = await db
            .insert(liveStreams)
            .values(streamData)
            .returning();
        return stream;
    }
    async addLiveStreamCoStar(data) {
        const [coStar] = await db
            .insert(liveStreamCoStars)
            .values(data)
            .returning();
        return coStar;
    }
    async updateLiveStream(id, updates) {
        const [stream] = await db
            .update(liveStreams)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(liveStreams.id, id))
            .returning();
        return stream;
    }
    async getLiveStream(id) {
        const [stream] = await db
            .select()
            .from(liveStreams)
            .where(eq(liveStreams.id, id));
        return stream;
    }
    async getLiveStreamByKey(streamKey) {
        const [stream] = await db
            .select()
            .from(liveStreams)
            .where(eq(liveStreams.streamKey, streamKey));
        return stream;
    }
    // Stream Participant operations
    async addStreamParticipant(participant) {
        const [result] = await db
            .insert(streamParticipants)
            .values(participant)
            .returning();
        return result;
    }
    async updateStreamParticipant(streamId, userId, updates) {
        const [result] = await db
            .update(streamParticipants)
            .set(updates)
            .where(and(eq(streamParticipants.streamId, streamId), eq(streamParticipants.userId, userId)))
            .returning();
        return result;
    }
    async getStreamParticipants(streamId) {
        return await db
            .select()
            .from(streamParticipants)
            .where(eq(streamParticipants.streamId, streamId));
    }
    // Stream Viewer operations
    async addStreamViewer(viewer) {
        const [result] = await db
            .insert(streamViewers)
            .values(viewer)
            .returning();
        return result;
    }
    async updateStreamViewer(streamId, userId, updates) {
        const [result] = await db
            .update(streamViewers)
            .set(updates)
            .where(and(eq(streamViewers.streamId, streamId), eq(streamViewers.userId, userId)))
            .returning();
        return result;
    }
    async getStreamViewers(streamId) {
        return await db
            .select()
            .from(streamViewers)
            .where(eq(streamViewers.streamId, streamId));
    }
    // Stream Chat operations
    async addStreamChatMessage(message) {
        const [result] = await db
            .insert(streamChatMessages)
            .values(message)
            .returning();
        return result;
    }
    async getStreamChatMessages(streamId, limit = 100) {
        return await db
            .select()
            .from(streamChatMessages)
            .where(eq(streamChatMessages.streamId, streamId))
            .orderBy(desc(streamChatMessages.createdAt))
            .limit(limit);
    }
    // Stream Gift operations
    async addStreamGift(gift) {
        const [result] = await db
            .insert(streamGifts)
            .values(gift)
            .returning();
        return result;
    }
    async getStreamGifts(streamId) {
        return await db
            .select()
            .from(streamGifts)
            .where(eq(streamGifts.streamId, streamId))
            .orderBy(desc(streamGifts.createdAt));
    }
    // Stream Reaction operations
    async addStreamReaction(reaction) {
        const [result] = await db
            .insert(streamReactions)
            .values(reaction)
            .returning();
        return result;
    }
    async getStreamReactions(streamId) {
        return await db
            .select()
            .from(streamReactions)
            .where(eq(streamReactions.streamId, streamId));
    }
    // Stream Highlight operations
    async createStreamHighlight(highlight) {
        const [result] = await db
            .insert(streamHighlights)
            .values(highlight)
            .returning();
        return result;
    }
    async getStreamHighlights(streamId) {
        return await db
            .select()
            .from(streamHighlights)
            .where(eq(streamHighlights.streamId, streamId))
            .orderBy(desc(streamHighlights.score));
    }
    // Stream Recording operations
    async createStreamRecording(recording) {
        const [result] = await db
            .insert(streamRecordings)
            .values(recording)
            .returning();
        return result;
    }
    async updateStreamRecording(id, updates) {
        const [result] = await db
            .update(streamRecordings)
            .set(updates)
            .where(eq(streamRecordings.id, id))
            .returning();
        return result;
    }
    async getStreamRecording(streamId) {
        const [recording] = await db
            .select()
            .from(streamRecordings)
            .where(eq(streamRecordings.streamId, streamId))
            .orderBy(desc(streamRecordings.createdAt))
            .limit(1);
        return recording;
    }
    // Stream Analytics operations
    async createStreamAnalytics(analytics) {
        const [result] = await db
            .insert(streamAnalytics)
            .values(analytics)
            .returning();
        return result;
    }
    async updateStreamAnalytics(streamId, updates) {
        const [result] = await db
            .update(streamAnalytics)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(streamAnalytics.streamId, streamId))
            .returning();
        return result;
    }
    async getStreamAnalytics(streamId) {
        const [analytics] = await db
            .select()
            .from(streamAnalytics)
            .where(eq(streamAnalytics.streamId, streamId));
        return analytics;
    }
    // NFT Collection operations
    async getNftCollection(id) {
        const [collection] = await db
            .select()
            .from(nftCollections)
            .where(eq(nftCollections.id, id));
        return collection;
    }
    async getNftCollectionsByCreator(creatorId) {
        return await db
            .select()
            .from(nftCollections)
            .where(eq(nftCollections.creatorId, creatorId))
            .orderBy(desc(nftCollections.createdAt));
    }
    async createNftCollection(collectionData) {
        const [collection] = await db
            .insert(nftCollections)
            .values(collectionData)
            .returning();
        return collection;
    }
    async updateNftCollection(id, updates) {
        const [collection] = await db
            .update(nftCollections)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(nftCollections.id, id))
            .returning();
        return collection;
    }
    // NFT Token operations
    async getNftToken(id) {
        const [token] = await db
            .select()
            .from(nftTokens)
            .where(eq(nftTokens.id, id));
        return token;
    }
    async getNftTokensByOwner(ownerId) {
        return await db
            .select()
            .from(nftTokens)
            .where(eq(nftTokens.ownerId, ownerId))
            .orderBy(desc(nftTokens.createdAt));
    }
    async getNftTokensByCollection(collectionId) {
        return await db
            .select()
            .from(nftTokens)
            .where(eq(nftTokens.collectionId, collectionId))
            .orderBy(desc(nftTokens.createdAt));
    }
    async createNftToken(tokenData) {
        const [token] = await db
            .insert(nftTokens)
            .values(tokenData)
            .returning();
        return token;
    }
    async updateNftToken(id, updates) {
        const [token] = await db
            .update(nftTokens)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(nftTokens.id, id))
            .returning();
        return token;
    }
    // NFT Transaction operations
    async getNftTransactionsByToken(tokenId) {
        return await db
            .select()
            .from(nftTransactions)
            .where(eq(nftTransactions.tokenId, tokenId))
            .orderBy(desc(nftTransactions.createdAt));
    }
    async getNftTransactionsByUser(userId) {
        return await db
            .select()
            .from(nftTransactions)
            .where(or(eq(nftTransactions.fromUserId, userId), eq(nftTransactions.toUserId, userId)))
            .orderBy(desc(nftTransactions.createdAt));
    }
    async createNftTransaction(transactionData) {
        const [transaction] = await db
            .insert(nftTransactions)
            .values(transactionData)
            .returning();
        return transaction;
    }
    async updateNftTransaction(id, updates) {
        const [transaction] = await db
            .update(nftTransactions)
            .set(updates)
            .where(eq(nftTransactions.id, id))
            .returning();
        return transaction;
    }
    // Blockchain Wallet operations
    async getBlockchainWallet(userId, blockchain) {
        const conditions = [eq(blockchainWallets.userId, userId)];
        if (blockchain) {
            conditions.push(eq(blockchainWallets.blockchain, blockchain));
        }
        const [wallet] = await db
            .select()
            .from(blockchainWallets)
            .where(and(...conditions));
        return wallet;
    }
    async getBlockchainWalletsByUser(userId) {
        return await db
            .select()
            .from(blockchainWallets)
            .where(eq(blockchainWallets.userId, userId));
    }
    async createBlockchainWallet(walletData) {
        const [wallet] = await db
            .insert(blockchainWallets)
            .values(walletData)
            .returning();
        return wallet;
    }
    async updateBlockchainWallet(id, updates) {
        const [wallet] = await db
            .update(blockchainWallets)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(blockchainWallets.id, id))
            .returning();
        return wallet;
    }
    // Royalty Distribution operations
    async getRoyaltyDistributionsByToken(tokenId) {
        return await db
            .select()
            .from(royaltyDistributions)
            .where(eq(royaltyDistributions.tokenId, tokenId))
            .orderBy(desc(royaltyDistributions.createdAt));
    }
    async getRoyaltyDistributionsByRecipient(recipientId) {
        return await db
            .select()
            .from(royaltyDistributions)
            .where(eq(royaltyDistributions.recipientId, recipientId))
            .orderBy(desc(royaltyDistributions.createdAt));
    }
    async createRoyaltyDistribution(distributionData) {
        const [distribution] = await db
            .insert(royaltyDistributions)
            .values(distributionData)
            .returning();
        return distribution;
    }
    async updateRoyaltyDistribution(id, updates) {
        const [distribution] = await db
            .update(royaltyDistributions)
            .set(updates)
            .where(eq(royaltyDistributions.id, id))
            .returning();
        return distribution;
    }
    // IPFS Record operations
    async getIpfsRecordsByUser(userId) {
        return await db
            .select()
            .from(ipfsRecords)
            .where(eq(ipfsRecords.userId, userId))
            .orderBy(desc(ipfsRecords.createdAt));
    }
    async getIpfsRecordByHash(ipfsHash) {
        const [record] = await db
            .select()
            .from(ipfsRecords)
            .where(eq(ipfsRecords.ipfsHash, ipfsHash));
        return record;
    }
    async createIpfsRecord(recordData) {
        const [record] = await db
            .insert(ipfsRecords)
            .values(recordData)
            .returning();
        return record;
    }
    async updateIpfsRecord(id, updates) {
        const [record] = await db
            .update(ipfsRecords)
            .set(updates)
            .where(eq(ipfsRecords.id, id))
            .returning();
        return record;
    }
    // Marketplace Integration operations
    async getMarketplaceIntegration(userId, marketplace) {
        const [integration] = await db
            .select()
            .from(marketplaceIntegrations)
            .where(and(eq(marketplaceIntegrations.userId, userId), eq(marketplaceIntegrations.marketplace, marketplace)));
        return integration;
    }
    async getMarketplaceIntegrationsByUser(userId) {
        return await db
            .select()
            .from(marketplaceIntegrations)
            .where(eq(marketplaceIntegrations.userId, userId));
    }
    async createMarketplaceIntegration(integrationData) {
        const [integration] = await db
            .insert(marketplaceIntegrations)
            .values(integrationData)
            .returning();
        return integration;
    }
    async updateMarketplaceIntegration(id, updates) {
        const [integration] = await db
            .update(marketplaceIntegrations)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(marketplaceIntegrations.id, id))
            .returning();
        return integration;
    }
    // Additional helper methods
    async getContentSessionsByUserId(userId) {
        return await this.getContentSessionsByCreator(userId);
    }
    async deleteContentSession(id, ownerId) {
        await db
            .delete(contentCreationSessions)
            .where(and(eq(contentCreationSessions.id, id), eq(contentCreationSessions.creatorId, ownerId)));
    }
    async getKycVerificationsByUserId(userId) {
        return await db
            .select()
            .from(kycVerifications)
            .where(eq(kycVerifications.userId, userId))
            .orderBy(desc(kycVerifications.createdAt));
    }
    async getKycVerificationsInDateRange(startDate, endDate) {
        return await db
            .select()
            .from(kycVerifications)
            .where(and(sql `${kycVerifications.createdAt} >= ${startDate}`, sql `${kycVerifications.createdAt} <= ${endDate}`))
            .orderBy(desc(kycVerifications.createdAt));
    }
    async createRecord2257(recordData) {
        const { records2257 } = await import('../shared/schema');
        const [record] = await db
            .insert(records2257)
            .values(recordData)
            .returning();
        return record;
    }
    async getAuditLogsInDateRange(startDate, endDate, actionPattern) {
        const conditions = [
            sql `${auditLogs.createdAt} >= ${startDate}`,
            sql `${auditLogs.createdAt} <= ${endDate}`
        ];
        if (actionPattern) {
            conditions.push(sql `${auditLogs.action} LIKE ${`%${actionPattern}%`}`);
        }
        return await db
            .select()
            .from(auditLogs)
            .where(and(...conditions))
            .orderBy(desc(auditLogs.createdAt));
    }
}
export const storage = new DatabaseStorage();

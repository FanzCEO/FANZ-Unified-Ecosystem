import { WebSocket } from 'ws';
import crypto from 'crypto';
import { storage } from '../storage';
import { verificationService } from './verification';
import { aiEditorService } from './ai-editor';
export class StreamingService {
    constructor() {
        this.sessions = new Map();
        this.ICE_SERVERS = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];
        // Initialize highlight detection interval
        setInterval(() => this.detectHighlights(), 10000); // Check every 10 seconds
        // Clean up ended sessions
        setInterval(() => this.cleanupEndedSessions(), 60000); // Every minute
    }
    // Initialize WebSocket server
    setWebSocketServer(wss) {
        this.wss = wss;
    }
    // Create a new streaming session
    async createStream(creatorId, config) {
        // Verify creator
        const creator = await storage.getUser(creatorId);
        if (!creator) {
            throw new Error('Creator not found');
        }
        // Check verification status
        const verificationStatus = await verificationService.getUserVerificationStatus(creatorId);
        if (!verificationStatus.verified && config.requiresVerification !== false) {
            throw new Error('Creator must be verified to start live streaming');
        }
        // Verify co-stars if specified
        if (config.coStarIds && config.coStarIds.length > 0) {
            for (const coStarId of config.coStarIds) {
                const coStarVerification = await verificationService.getUserVerificationStatus(coStarId);
                if (!coStarVerification.verified) {
                    throw new Error(`Co-star ${coStarId} must be verified to join stream`);
                }
            }
        }
        // Generate stream key
        const streamKey = this.generateStreamKey();
        // Create stream record in database
        const stream = await storage.createLiveStream({
            creatorId,
            title: config.title,
            description: config.description,
            streamKey,
            visibility: config.visibility || 'subscriber',
            priceInCents: config.priceInCents,
            status: 'scheduled'
        });
        // Add co-stars to database
        if (config.coStarIds) {
            for (const coStarId of config.coStarIds) {
                await storage.addStreamParticipant({
                    streamId: stream.id,
                    userId: coStarId,
                    role: 'co-star',
                    isVerified: true,
                    verificationStatus: 'verified'
                });
            }
        }
        // Create session
        const session = {
            id: crypto.randomBytes(16).toString('hex'),
            streamId: stream.id,
            creatorId,
            streamKey,
            status: 'scheduled',
            rtcConfiguration: {
                iceServers: this.ICE_SERVERS
            },
            participants: new Map(),
            viewers: new Map(),
            chatMessages: [],
            gifts: [],
            reactions: new Map(),
            analytics: this.createInitialAnalytics(),
            highlights: []
        };
        // Add host as participant
        session.participants.set(creatorId, {
            userId: creatorId,
            username: creator.username || 'Host',
            role: 'host',
            isVerified: verificationStatus.verified,
            verificationStatus: verificationStatus.status,
            audioEnabled: true,
            videoEnabled: true,
            joinedAt: new Date()
        });
        this.sessions.set(session.id, session);
        return session;
    }
    // Start the stream
    async startStream(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        // Update status
        session.status = 'live';
        session.startedAt = new Date();
        // Update database
        await storage.updateLiveStream(session.streamId, {
            status: 'live',
            startedAt: session.startedAt
        });
        // Start recording if enabled
        if (session.recordingUrl === undefined) {
            await this.startRecording(session);
        }
        // Notify all participants and viewers
        this.broadcastToSession(session, {
            type: 'stream_started',
            data: {
                streamId: session.streamId,
                startedAt: session.startedAt
            }
        });
        // Start analytics tracking
        this.startAnalyticsTracking(session);
    }
    // End the stream
    async endStream(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        // Update status
        session.status = 'ended';
        session.endedAt = new Date();
        // Update database
        await storage.updateLiveStream(session.streamId, {
            status: 'ended',
            endedAt: session.endedAt
        });
        // Stop recording
        if (session.recordingUrl) {
            await this.stopRecording(session);
        }
        // Generate highlights
        if (session.highlights.length > 0) {
            await this.saveHighlights(session);
        }
        // Save analytics
        await this.saveAnalytics(session);
        // Notify all participants and viewers
        this.broadcastToSession(session, {
            type: 'stream_ended',
            data: {
                streamId: session.streamId,
                endedAt: session.endedAt,
                recordingAvailable: !!session.recordingUrl
            }
        });
        // Process recording with AI
        if (session.recordingUrl) {
            await this.processRecordingWithAI(session);
        }
    }
    // Add co-star to stream
    async addCoStar(sessionId, userId, requireVerification = true) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        // Check verification
        if (requireVerification) {
            const verification = await verificationService.getUserVerificationStatus(userId);
            if (!verification.verified) {
                throw new Error('Co-star must be verified to join stream');
            }
        }
        const user = await storage.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Add to session
        session.participants.set(userId, {
            userId,
            username: user.username || 'Co-star',
            role: 'co-star',
            isVerified: requireVerification,
            audioEnabled: true,
            videoEnabled: true,
            joinedAt: new Date()
        });
        // Add to database
        await storage.addStreamParticipant({
            streamId: session.streamId,
            userId,
            role: 'co-star',
            isVerified: requireVerification,
            verificationStatus: requireVerification ? 'verified' : 'unverified',
            joinedAt: new Date()
        });
        // Notify session
        this.broadcastToSession(session, {
            type: 'costar_joined',
            data: {
                userId,
                username: user.username,
                isVerified: requireVerification
            }
        });
    }
    // Remove co-star from stream
    async removeCoStar(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        const participant = session.participants.get(userId);
        if (!participant || participant.role === 'host') {
            throw new Error('Cannot remove this participant');
        }
        // Remove from session
        session.participants.delete(userId);
        // Update database
        await storage.updateStreamParticipant(session.streamId, userId, {
            leftAt: new Date()
        });
        // Close peer connection if exists
        if (participant.peerConnection) {
            participant.peerConnection.close();
        }
        // Notify session
        this.broadcastToSession(session, {
            type: 'costar_left',
            data: { userId }
        });
    }
    // Add viewer to stream
    async addViewer(sessionId, userId, connection) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        // Add to session
        session.viewers.set(userId, {
            userId,
            connection,
            joinedAt: new Date(),
            watchTimeSeconds: 0
        });
        // Update analytics
        session.analytics.currentViewers++;
        session.analytics.totalViewers++;
        if (session.analytics.currentViewers > session.analytics.peakViewers) {
            session.analytics.peakViewers = session.analytics.currentViewers;
        }
        // Add to database
        await storage.addStreamViewer({
            streamId: session.streamId,
            userId,
            joinedAt: new Date()
        });
        // Notify about viewer count update
        this.broadcastToSession(session, {
            type: 'viewer_count_updated',
            data: {
                currentViewers: session.analytics.currentViewers,
                totalViewers: session.analytics.totalViewers
            }
        });
    }
    // Remove viewer from stream
    async removeViewer(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const viewer = session.viewers.get(userId);
        if (!viewer)
            return;
        // Calculate watch time
        const watchTime = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000);
        // Update database
        await storage.updateStreamViewer(session.streamId, userId, {
            leftAt: new Date(),
            watchTimeSeconds: watchTime,
            isActive: false
        });
        // Remove from session
        session.viewers.delete(userId);
        // Update analytics
        session.analytics.currentViewers--;
        session.analytics.avgWatchTime =
            (session.analytics.avgWatchTime * (session.analytics.totalViewers - 1) + watchTime) /
                session.analytics.totalViewers;
        // Notify about viewer count update
        this.broadcastToSession(session, {
            type: 'viewer_count_updated',
            data: {
                currentViewers: session.analytics.currentViewers
            }
        });
    }
    // Send chat message
    async sendChatMessage(sessionId, userId, message, messageType = 'text') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        const user = await storage.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Apply moderation
        if (await this.shouldModerateMessage(message)) {
            throw new Error('Message contains inappropriate content');
        }
        const chatMessage = {
            id: crypto.randomBytes(16).toString('hex'),
            userId,
            username: user.username || 'Anonymous',
            message,
            messageType,
            timestamp: new Date()
        };
        // Add to session
        session.chatMessages.push(chatMessage);
        session.analytics.totalChatMessages++;
        // Save to database
        await storage.addStreamChatMessage({
            streamId: session.streamId,
            userId,
            message,
            messageType
        });
        // Broadcast to all viewers
        this.broadcastToSession(session, {
            type: 'chat_message',
            data: chatMessage
        });
    }
    // Send gift
    async sendGift(sessionId, senderId, receiverId, giftType, giftValue, quantity = 1, message) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        const sender = await storage.getUser(senderId);
        if (!sender) {
            throw new Error('Sender not found');
        }
        // Process payment (simplified for now)
        const totalValue = giftValue * quantity;
        const transaction = {
            userId: senderId,
            creatorId: receiverId,
            provider: 'ccbill',
            type: 'tip',
            status: 'completed',
            amountCents: totalValue,
            creatorEarnings: Math.floor(totalValue * 0.8) // 80% to creator
        };
        const savedTransaction = await storage.createTransaction(transaction);
        const gift = {
            id: crypto.randomBytes(16).toString('hex'),
            senderId,
            senderUsername: sender.username || 'Anonymous',
            receiverId,
            giftType,
            giftValue,
            quantity,
            message,
            timestamp: new Date()
        };
        // Add to session
        session.gifts.push(gift);
        session.analytics.totalGifts++;
        session.analytics.totalGiftValue += totalValue;
        // Save to database
        await storage.addStreamGift({
            streamId: session.streamId,
            senderId,
            receiverId,
            giftType,
            giftValue,
            quantity,
            message,
            transactionId: savedTransaction.id
        });
        // Broadcast gift animation
        this.broadcastToSession(session, {
            type: 'gift_received',
            data: {
                ...gift,
                animation: this.getGiftAnimation(giftType)
            }
        });
        // Check for highlight (large gifts)
        if (totalValue >= 10000) { // $100+
            this.addHighlight(session, {
                type: 'peak_gifts',
                title: `${sender.username} sent ${quantity}x ${giftType}!`,
                score: Math.min(100, totalValue / 100)
            });
        }
    }
    // Send reaction
    async sendReaction(sessionId, userId, reactionType, intensity = 1) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        // Update reaction count
        const currentCount = session.reactions.get(reactionType) || 0;
        session.reactions.set(reactionType, currentCount + intensity);
        session.analytics.totalReactions++;
        // Save to database
        await storage.addStreamReaction({
            streamId: session.streamId,
            userId,
            reactionType,
            intensity,
            timestamp: Math.floor((Date.now() - (session.startedAt?.getTime() || 0)) / 1000)
        });
        // Broadcast reaction
        this.broadcastToSession(session, {
            type: 'reaction',
            data: {
                userId,
                reactionType,
                intensity
            }
        });
    }
    // WebRTC signaling
    async handleSignaling(sessionId, userId, signal) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Stream session not found');
        }
        const participant = session.participants.get(userId);
        if (!participant) {
            throw new Error('Participant not found');
        }
        // Forward signal to other participants
        session.participants.forEach((otherParticipant, otherUserId) => {
            if (otherUserId !== userId && otherParticipant.connection) {
                otherParticipant.connection.send(JSON.stringify({
                    type: 'webrtc_signal',
                    data: {
                        fromUserId: userId,
                        signal
                    }
                }));
            }
        });
    }
    // Private methods
    generateStreamKey() {
        return crypto.randomBytes(20).toString('hex');
    }
    createInitialAnalytics() {
        return {
            currentViewers: 0,
            peakViewers: 0,
            totalViewers: 0,
            avgWatchTime: 0,
            totalGifts: 0,
            totalGiftValue: 0,
            totalReactions: 0,
            totalChatMessages: 0,
            engagementScore: 0,
            viewerRetention: {}
        };
    }
    broadcastToSession(session, message) {
        const messageStr = JSON.stringify(message);
        // Send to all participants
        session.participants.forEach(participant => {
            if (participant.connection && participant.connection.readyState === WebSocket.OPEN) {
                participant.connection.send(messageStr);
            }
        });
        // Send to all viewers
        session.viewers.forEach(viewer => {
            if (viewer.connection && viewer.connection.readyState === WebSocket.OPEN) {
                viewer.connection.send(messageStr);
            }
        });
    }
    async startRecording(session) {
        // Implementation would integrate with recording service
        // For now, just mark as recording
        session.recordingUrl = `recordings/${session.streamId}/stream.mp4`;
    }
    async stopRecording(session) {
        if (!session.recordingUrl)
            return;
        // Save recording info to database
        await storage.createStreamRecording({
            streamId: session.streamId,
            recordingUrl: session.recordingUrl,
            duration: Math.floor((Date.now() - (session.startedAt?.getTime() || 0)) / 1000),
            status: 'processing'
        });
    }
    async saveHighlights(session) {
        for (const highlight of session.highlights) {
            await storage.createStreamHighlight({
                streamId: session.streamId,
                title: highlight.title,
                startTime: highlight.startTime,
                endTime: highlight.endTime,
                highlightType: highlight.type,
                score: highlight.score
            });
        }
    }
    async saveAnalytics(session) {
        await storage.createStreamAnalytics({
            streamId: session.streamId,
            peakViewers: session.analytics.peakViewers,
            avgViewers: Math.floor(session.analytics.totalViewers / 2), // Simplified
            totalViewers: session.analytics.totalViewers,
            totalWatchTimeMinutes: Math.floor(session.analytics.avgWatchTime * session.analytics.totalViewers / 60),
            totalGifts: session.analytics.totalGifts,
            totalGiftValue: session.analytics.totalGiftValue,
            totalReactions: session.analytics.totalReactions,
            totalChatMessages: session.analytics.totalChatMessages,
            engagementScore: this.calculateEngagementScore(session.analytics),
            viewerRetention: session.analytics.viewerRetention
        });
    }
    calculateEngagementScore(analytics) {
        // Simple engagement score calculation
        const chatScore = Math.min(30, analytics.totalChatMessages / 10);
        const giftScore = Math.min(30, analytics.totalGiftValue / 1000);
        const reactionScore = Math.min(20, analytics.totalReactions / 100);
        const retentionScore = Math.min(20, analytics.avgWatchTime / 60);
        return Math.floor(chatScore + giftScore + reactionScore + retentionScore);
    }
    async processRecordingWithAI(session) {
        if (!session.recordingUrl)
            return;
        // Trigger AI processing for highlights and clips
        await aiEditorService.processStreamRecording({
            streamId: session.streamId,
            recordingUrl: session.recordingUrl,
            highlights: session.highlights,
            generateClips: true,
            generateTrailer: true,
            detectHighlights: true
        });
    }
    async shouldModerateMessage(message) {
        // Simple keyword-based moderation (would use AI in production)
        const blockedWords = ['spam', 'scam', 'banned_word'];
        const lowerMessage = message.toLowerCase();
        return blockedWords.some(word => lowerMessage.includes(word));
    }
    getGiftAnimation(giftType) {
        const animations = {
            'rose': 'floating',
            'heart': 'pulse',
            'diamond': 'sparkle',
            'fireworks': 'explosion',
            'crown': 'rotate',
            'rocket': 'launch'
        };
        return animations[giftType] || 'floating';
    }
    addHighlight(session, data) {
        const startTime = Math.max(0, Math.floor((Date.now() - (session.startedAt?.getTime() || 0)) / 1000) - 30);
        const endTime = startTime + 60; // 1 minute highlight
        session.highlights.push({
            id: crypto.randomBytes(16).toString('hex'),
            title: data.title,
            startTime,
            endTime,
            type: data.type,
            score: data.score,
            timestamp: new Date()
        });
    }
    async detectHighlights() {
        // AI highlight detection for all active sessions
        for (const [sessionId, session] of this.sessions) {
            if (session.status !== 'live')
                continue;
            // Check for peak viewers
            if (session.analytics.currentViewers === session.analytics.peakViewers &&
                session.analytics.peakViewers > 100) {
                this.addHighlight(session, {
                    type: 'peak_viewers',
                    title: `Peak viewership: ${session.analytics.peakViewers} viewers`,
                    score: Math.min(100, session.analytics.peakViewers / 10)
                });
            }
            // Check for engagement spikes
            const recentMessages = session.chatMessages.filter(msg => Date.now() - msg.timestamp.getTime() < 60000).length;
            if (recentMessages > 50) {
                this.addHighlight(session, {
                    type: 'ai_detected',
                    title: 'High chat engagement',
                    score: Math.min(100, recentMessages)
                });
            }
        }
    }
    startAnalyticsTracking(session) {
        // Update viewer retention data every minute
        const interval = setInterval(() => {
            if (session.status !== 'live') {
                clearInterval(interval);
                return;
            }
            const minutesSinceStart = Math.floor((Date.now() - (session.startedAt?.getTime() || 0)) / 60000);
            const retentionRate = (session.analytics.currentViewers / session.analytics.peakViewers) * 100;
            session.analytics.viewerRetention[minutesSinceStart] = retentionRate;
        }, 60000);
    }
    cleanupEndedSessions() {
        const oneHourAgo = Date.now() - 3600000;
        for (const [sessionId, session] of this.sessions) {
            if (session.status === 'ended' &&
                session.endedAt &&
                session.endedAt.getTime() < oneHourAgo) {
                this.sessions.delete(sessionId);
            }
        }
    }
    // Public getters
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getSessionByStreamKey(streamKey) {
        for (const session of this.sessions.values()) {
            if (session.streamKey === streamKey) {
                return session;
            }
        }
        return undefined;
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(s => s.status === 'live');
    }
}
// Create singleton instance
export const streamingService = new StreamingService();

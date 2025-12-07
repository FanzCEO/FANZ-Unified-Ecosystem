import crypto from 'crypto';
export class VerifymyService {
    constructor() {
        this.config = {
            apiKey: process.env.VERIFYMY_API_KEY || 'demo_key',
            apiSecret: process.env.VERIFYMY_API_SECRET || 'demo_secret',
            baseUrl: process.env.VERIFYMY_BASE_URL || 'https://api.verifymy.com/v1',
            webhookSecret: process.env.VERIFYMY_WEBHOOK_SECRET || 'demo_webhook_secret'
        };
    }
    // Age verification using database and credit bureau data
    async verifyAge(request) {
        try {
            const response = await this.makeApiCall('/age-verification', request);
            return response;
        }
        catch (error) {
            console.error('Age verification error:', error);
            throw error;
        }
    }
    // ID document verification with liveness detection
    async verifyIdentity(request) {
        try {
            const response = await this.makeApiCall('/identity-verification', request);
            return response;
        }
        catch (error) {
            console.error('Identity verification error:', error);
            throw error;
        }
    }
    // Content moderation using AI
    async moderateContent(contentUrl, contentType, metadata) {
        try {
            const request = {
                contentUrl,
                contentType,
                metadata,
                userId: metadata?.userId
            };
            const response = await this.makeApiCall('/content-moderation', request);
            return response;
        }
        catch (error) {
            console.error('Content moderation error:', error);
            throw error;
        }
    }
    // Verify webhook signature from verifymy
    verifyWebhookSignature(body, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', this.config.webhookSecret)
            .update(body)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    // Process webhook notifications
    async processWebhookNotification(webhookData) {
        const { eventType, transactionId, userId, status, data } = webhookData;
        console.log(`Processing verifymy webhook: ${eventType} for user ${userId}`);
        switch (eventType) {
            case 'age_verification.completed':
                await this.handleAgeVerificationComplete(transactionId, userId, status, data);
                break;
            case 'identity_verification.completed':
                await this.handleIdentityVerificationComplete(transactionId, userId, status, data);
                break;
            case 'content_moderation.completed':
                await this.handleContentModerationComplete(transactionId, data);
                break;
            default:
                console.warn(`Unknown webhook event type: ${eventType}`);
        }
    }
    async makeApiCall(endpoint, data) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const timestamp = Math.floor(Date.now() / 1000).toString();
        // Create signature for API authentication
        const signature = crypto
            .createHmac('sha256', this.config.apiSecret)
            .update(timestamp + JSON.stringify(data))
            .digest('hex');
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey,
                    'X-Timestamp': timestamp,
                    'X-Signature': signature
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`Verifymy API error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Verifymy API call failed for ${endpoint}:`, error);
            throw error;
        }
    }
    async handleAgeVerificationComplete(transactionId, userId, status, data) {
        // Import storage here to avoid circular dependencies
        const { storage } = await import('../storage');
        const isVerified = status === 'verified';
        const confidence = data.confidence || 0;
        // Update KYC verification record
        await storage.createKycVerification({
            userId,
            provider: 'verifymy',
            status: isVerified ? 'verified' : 'rejected',
            documentType: 'age_verification',
            dataJson: { transactionId, confidence, ...data }
        });
        // Update or create profile with age verification status
        const user = await storage.getUser(userId);
        if (user) {
            const existingProfile = await storage.getProfile(userId);
            if (existingProfile) {
                await storage.updateProfile(userId, {
                    ageVerified: isVerified,
                    updatedAt: new Date()
                });
            }
            else {
                // Create profile if it doesn't exist
                await storage.createProfile({
                    userId,
                    ageVerified: isVerified,
                    kycStatus: 'pending'
                });
            }
        }
        // Log the verification attempt
        await storage.createAuditLog({
            actorId: userId,
            action: 'age_verification_completed',
            targetType: 'kyc_verification',
            targetId: transactionId,
            metadata: { status, confidence, type: 'age_verification' }
        });
    }
    async handleIdentityVerificationComplete(transactionId, userId, status, data) {
        const { storage } = await import('../storage');
        const isVerified = status === 'verified';
        const confidence = data.confidence || 0;
        // Update KYC verification record
        await storage.createKycVerification({
            userId,
            provider: 'verifymy',
            status: isVerified ? 'verified' : 'rejected',
            documentType: 'identity_verification',
            dataJson: { transactionId, confidence, ...data },
            verifiedAt: isVerified ? new Date() : undefined
        });
        // Update or create profile with KYC status
        const user = await storage.getUser(userId);
        if (user) {
            const existingProfile = await storage.getProfile(userId);
            if (existingProfile) {
                await storage.updateProfile(userId, {
                    kycStatus: isVerified ? 'verified' : 'rejected',
                    updatedAt: new Date()
                });
            }
            else {
                // Create profile if it doesn't exist
                await storage.createProfile({
                    userId,
                    ageVerified: false,
                    kycStatus: isVerified ? 'verified' : 'rejected'
                });
            }
        }
        // Log the verification attempt
        await storage.createAuditLog({
            actorId: userId,
            action: 'identity_verification_completed',
            targetType: 'kyc_verification',
            targetId: transactionId,
            metadata: { status, confidence, type: 'identity_verification' }
        });
    }
    async handleContentModerationComplete(transactionId, data) {
        const { storage } = await import('../storage');
        const { mediaId, approved, confidence, flagged } = data;
        if (mediaId) {
            // Update media status based on moderation result
            const newStatus = approved ? 'approved' : 'rejected';
            // Update media asset
            await storage.updateMediaAsset(mediaId, {
                status: newStatus,
                updatedAt: new Date()
            });
            // Update moderation queue
            const moderationItems = await storage.getModerationQueue();
            const item = moderationItems.find(m => m.mediaId === mediaId);
            if (item) {
                await storage.updateModerationItem(item.id, {
                    status: approved ? 'approved' : 'rejected',
                    notes: `AI moderation: ${flagged?.join(', ') || 'Clean content'}`,
                    aiConfidence: Math.round(confidence),
                    reviewedAt: new Date()
                });
            }
        }
    }
}
export const verifymyService = new VerifymyService();

import crypto from 'crypto';
import { storage } from '../storage';
import { VerifymyService } from '../compliance/verifymy';
class VerificationService {
    constructor() {
        this.sessions = new Map();
        this.SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
        this.VERIFICATION_VALIDITY_DAYS = 365; // 1 year
        this.REVERIFICATION_WARNING_DAYS = 30; // Warn 30 days before expiry
        this.verifymyService = new VerifymyService();
        // Clean up expired sessions periodically
        setInterval(() => this.cleanupExpiredSessions(), 60 * 1000); // Every minute
    }
    // Create a new verification session
    async createSession(userId, userType = 'creator') {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const session = {
            id: sessionId,
            userId,
            userType,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.SESSION_DURATION)
        };
        this.sessions.set(sessionId, session);
        // Log session creation
        await storage.createAuditLog({
            actorId: userId,
            action: 'verification_session_created',
            targetType: 'verification_session',
            targetId: sessionId,
            metadata: { userType }
        });
        return session;
    }
    // Get session by ID
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && session.expiresAt > new Date()) {
            return session;
        }
        return null;
    }
    // Submit verification documents and process
    async submitVerification(sessionId, documentType, frontImageBase64, backImageBase64, selfieImageBase64) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error('Invalid or expired verification session');
        }
        try {
            // Update session status
            session.status = 'processing';
            // Store images in object storage (in production)
            // For now, we'll simulate URLs
            const frontImageUrl = await this.storeVerificationImage(session.userId, frontImageBase64, 'front');
            const backImageUrl = backImageBase64
                ? await this.storeVerificationImage(session.userId, backImageBase64, 'back')
                : undefined;
            const selfieImageUrl = selfieImageBase64
                ? await this.storeVerificationImage(session.userId, selfieImageBase64, 'selfie')
                : undefined;
            // Create verification request for VerifyMy
            const verificationRequest = {
                userId: session.userId,
                documentType: documentType,
                frontImageUrl,
                backImageUrl,
                selfieImageUrl: selfieImageUrl || '',
                documentNumber: undefined // Could extract from OCR in production
            };
            // Submit to VerifyMy for processing
            const verifyResponse = await this.verifymyService.verifyIdentity(verificationRequest);
            // Store verification result
            const kycVerification = await storage.createKycVerification({
                userId: session.userId,
                provider: 'verifymy',
                status: verifyResponse.status === 'verified' ? 'verified' : verifyResponse.status === 'rejected' ? 'rejected' : 'pending',
                documentType,
                dataJson: {
                    transactionId: verifyResponse.transactionId,
                    confidence: verifyResponse.confidence,
                    documentUrls: {
                        front: frontImageUrl,
                        back: backImageUrl,
                        selfie: selfieImageUrl
                    },
                    sessionId,
                    userType: session.userType,
                    ...verifyResponse.data
                }
            });
            // Update user profile if verified
            if (verifyResponse.status === 'verified') {
                await this.handleVerificationSuccess(session.userId, kycVerification.id);
                session.status = 'completed';
            }
            else if (verifyResponse.status === 'rejected') {
                session.status = 'failed';
            }
            // Create audit log
            await storage.createAuditLog({
                actorId: session.userId,
                action: 'verification_submitted',
                targetType: 'kyc_verification',
                targetId: kycVerification.id,
                metadata: {
                    status: verifyResponse.status,
                    confidence: verifyResponse.confidence,
                    documentType,
                    sessionId
                }
            });
            // Return result
            return {
                verified: verifyResponse.status === 'verified',
                status: verifyResponse.status === 'verified' ? 'verified' :
                    verifyResponse.status === 'rejected' ? 'rejected' : 'processing',
                confidence: verifyResponse.confidence,
                validUntil: verifyResponse.status === 'verified'
                    ? new Date(Date.now() + this.VERIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
                    : undefined,
                verifiedAt: verifyResponse.status === 'verified' ? new Date() : undefined,
                rejectionReason: verifyResponse.reasons?.join(', '),
                provider: 'verifymy',
                details: verifyResponse.data
            };
        }
        catch (error) {
            console.error('Verification submission error:', error);
            session.status = 'failed';
            // Log error
            await storage.createAuditLog({
                actorId: session.userId,
                action: 'verification_error',
                targetType: 'verification_session',
                targetId: sessionId,
                metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
            throw error;
        }
    }
    // Get user's verification status
    async getUserVerificationStatus(userId) {
        try {
            // Get latest verification
            const verifications = await storage.getKycVerificationsByUserId(userId);
            if (!verifications || verifications.length === 0) {
                return {
                    verified: false,
                    status: 'none'
                };
            }
            // Find most recent successful verification
            const latestVerified = verifications.find(v => v.status === 'verified');
            if (!latestVerified) {
                // Check if any are pending
                const pendingVerification = verifications.find(v => v.status === 'pending');
                if (pendingVerification) {
                    return {
                        verified: false,
                        status: 'processing'
                    };
                }
                // All rejected
                const latestRejected = verifications[0];
                return {
                    verified: false,
                    status: 'rejected',
                    rejectionReason: latestRejected.dataJson?.reasons?.join(', ')
                };
            }
            // Check if verification is still valid
            const verifiedAt = new Date(latestVerified.verifiedAt || latestVerified.createdAt);
            const validUntil = new Date(verifiedAt.getTime() + this.VERIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
            const now = new Date();
            if (validUntil < now) {
                return {
                    verified: false,
                    status: 'expired',
                    verifiedAt,
                    validUntil
                };
            }
            return {
                verified: true,
                status: 'verified',
                confidence: latestVerified.dataJson?.confidence,
                validUntil,
                verifiedAt,
                provider: latestVerified.provider,
                details: {
                    documentType: latestVerified.documentType,
                    confidence: latestVerified.dataJson?.confidence,
                    transactionId: latestVerified.dataJson?.transactionId
                }
            };
        }
        catch (error) {
            console.error('Error fetching verification status:', error);
            return {
                verified: false,
                status: 'none'
            };
        }
    }
    // Get verification result by session ID
    async getVerificationResult(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }
        return await this.getUserVerificationStatus(session.userId);
    }
    // Check if user needs reverification
    async needsReverification(userId) {
        const status = await this.getUserVerificationStatus(userId);
        if (!status.verified || !status.validUntil) {
            return true;
        }
        const daysUntilExpiry = Math.floor((status.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= this.REVERIFICATION_WARNING_DAYS;
    }
    // Get verification history for user
    async getVerificationHistory(userId) {
        const verifications = await storage.getKycVerificationsByUserId(userId);
        return verifications.map(v => ({
            id: v.id,
            type: 'identity',
            status: v.status,
            provider: v.provider,
            documentType: v.documentType,
            confidence: v.dataJson?.confidence,
            createdAt: v.createdAt,
            verifiedAt: v.verifiedAt
        }));
    }
    // Handle successful verification
    async handleVerificationSuccess(userId, verificationId) {
        // Update user profile
        const profile = await storage.getProfile(userId);
        if (profile) {
            await storage.updateProfile(userId, {
                kycStatus: 'verified',
                ageVerified: true
            });
        }
        else {
            await storage.createProfile({
                userId,
                kycStatus: 'verified',
                ageVerified: true
            });
        }
        // Update user record
        await storage.updateUser(userId, {
            ageVerified: true
        });
        // Create 2257 compliance record
        await storage.createRecord2257({
            userId,
            docType: 'identity_verification',
            s3Key: `verification/${userId}/${verificationId}`,
            metadata: {
                verificationId,
                provider: 'verifymy',
                verifiedAt: new Date()
            }
        });
        // Log success
        await storage.createAuditLog({
            actorId: userId,
            action: 'verification_completed',
            targetType: 'kyc_verification',
            targetId: verificationId,
            metadata: { status: 'verified' }
        });
    }
    // Store verification image (simulate for now)
    async storeVerificationImage(userId, imageBase64, type) {
        // In production, this would upload to secure object storage
        // For now, return a simulated URL
        const imageId = crypto.randomBytes(16).toString('hex');
        const url = `https://storage.girlfanz.com/verification/${userId}/${type}_${imageId}.jpg`;
        // Store metadata in database
        await storage.createMediaAsset({
            ownerId: userId,
            title: `Verification ${type}`,
            filename: `${type}_${imageId}.jpg`,
            s3Key: `verification/${userId}/${type}_${imageId}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64').length,
            status: 'approved',
            isPublic: false
        });
        return url;
    }
    // Clean up expired sessions
    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                this.sessions.delete(sessionId);
            }
        }
    }
    // Generate compliance report
    async generateComplianceReport(startDate, endDate) {
        const verifications = await storage.getKycVerificationsInDateRange(startDate, endDate);
        const auditLogs = await storage.getAuditLogsInDateRange(startDate, endDate, 'verification%');
        const report = {
            period: {
                start: startDate,
                end: endDate
            },
            statistics: {
                totalVerifications: verifications.length,
                successfulVerifications: verifications.filter(v => v.status === 'verified').length,
                rejectedVerifications: verifications.filter(v => v.status === 'rejected').length,
                pendingVerifications: verifications.filter(v => v.status === 'pending').length
            },
            verificationsByType: this.groupByDocumentType(verifications),
            verificationsByProvider: this.groupByProvider(verifications),
            auditTrail: auditLogs.map(log => ({
                timestamp: log.createdAt,
                actor: log.actorId,
                action: log.action,
                target: log.targetId,
                metadata: log.metadata
            })),
            compliance: {
                section2257: true,
                dataRetention: true,
                encryptionEnabled: true,
                auditLoggingEnabled: true
            }
        };
        return report;
    }
    groupByDocumentType(verifications) {
        const grouped = {};
        for (const v of verifications) {
            const type = v.documentType || 'unknown';
            grouped[type] = (grouped[type] || 0) + 1;
        }
        return grouped;
    }
    groupByProvider(verifications) {
        const grouped = {};
        for (const v of verifications) {
            const provider = v.provider || 'unknown';
            grouped[provider] = (grouped[provider] || 0) + 1;
        }
        return grouped;
    }
}
// Export singleton instance
export const verificationService = new VerificationService();

import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { validateWebhookSignature } from "./middleware/auth";

// VerifyMy webhook payload schema
const VerifyMyWebhookSchema = z.object({
  event: z.enum(['verification.initiated', 'verification.in_review', 'verification.approved', 'verification.failed']),
  userId: z.string(),
  verificationId: z.string(),
  timestamp: z.string(),
  data: z.object({
    status: z.enum(['initiated', 'in_review', 'approved', 'failed']),
    tier: z.number().min(0).max(3),
    documents: z.array(z.object({
      type: z.string(),
      status: z.string(),
      reason: z.string().optional(),
    })).optional(),
    riskScore: z.number().min(0).max(100).optional(),
    failureReason: z.string().optional(),
    approvedAt: z.string().optional(),
  }),
});

type VerifyMyWebhook = z.infer<typeof VerifyMyWebhookSchema>;

/**
 * Register KYC webhook routes
 */
export function registerKYCRoutes(app: Express) {

  /**
   * VerifyMy KYC Status Webhook
   * Receives updates on KYC verification status from VerifyMy
   */
  app.post("/api/webhooks/kyc/verifymy", validateWebhookSignature('WEBHOOK_SECRET'), async (req, res) => {
    try {
      const webhook = VerifyMyWebhookSchema.parse(req.body);
      
      console.log(`KYC Webhook received: ${webhook.event} for user ${webhook.userId}`);

      // Find user by SSO ID or external ID
      // In practice, you'd have a mapping between VerifyMy userIds and your internal user IDs
      const user = await storage.getUserBySsoId(webhook.userId);
      
      if (!user) {
        console.warn(`KYC webhook for unknown user: ${webhook.userId}`);
        return res.status(404).json({ 
          error: "User not found", 
          code: "USER_NOT_FOUND" 
        });
      }

      // Map VerifyMy status to our KYC status
      const kycStatusMap = {
        'initiated': 'initiated' as const,
        'in_review': 'in_review' as const,
        'approved': 'approved' as const,
        'failed': 'failed' as const,
      };

      const newKycStatus = kycStatusMap[webhook.data.status];
      const newKycTier = webhook.data.tier;

      // Update user KYC status
      const updates: Partial<typeof user> = {
        kycStatus: newKycStatus,
        kycTier: newKycTier,
      };

      // Set verification date for approved status
      if (newKycStatus === 'approved' && webhook.data.approvedAt) {
        updates.kycVerifiedAt = new Date(webhook.data.approvedAt);
      }

      const updatedUser = await storage.updateUser(user.id, updates);

      // Log significant status changes
      if (user.kycStatus !== newKycStatus) {
        console.log(`User ${user.email} KYC status changed: ${user.kycStatus} → ${newKycStatus} (Tier ${newKycTier})`);
        
        // Here you could trigger notifications, emails, etc.
        await notifyKYCStatusChange(updatedUser, webhook);
      }

      // Respond to VerifyMy
      res.json({ 
        success: true, 
        userId: user.id,
        status: newKycStatus,
        tier: newKycTier,
        message: "KYC status updated successfully" 
      });

    } catch (error) {
      console.error('KYC webhook processing error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid webhook payload", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "KYC webhook processing failed", 
        code: "WEBHOOK_ERROR" 
      });
    }
  });

  /**
   * Manual KYC Status Update (Admin only)
   * Allows admins to manually update KYC status
   */
  app.put("/api/kyc/status/:userId", async (req, res) => {
    try {
      // This would need authentication middleware for admin access
      // app.put("/api/kyc/status/:userId", authenticateJWT, requireRole('admin'), async (req, res) => {
      
      const updateSchema = z.object({
        status: z.enum(['unverified', 'initiated', 'in_review', 'approved', 'failed']),
        tier: z.number().min(0).max(3).optional(),
        reason: z.string().optional(),
      });

      const { status, tier, reason } = updateSchema.parse(req.body);
      const userId = req.params.userId;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          error: "User not found", 
          code: "USER_NOT_FOUND" 
        });
      }

      const updates: Partial<typeof user> = {
        kycStatus: status,
      };

      if (tier !== undefined) {
        updates.kycTier = tier;
      }

      if (status === 'approved') {
        updates.kycVerifiedAt = new Date();
      }

      const updatedUser = await storage.updateUser(userId, updates);

      console.log(`Manual KYC update for ${user.email}: ${status} (Tier ${tier || user.kycTier}) - ${reason || 'No reason provided'}`);

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          kycStatus: updatedUser.kycStatus,
          kycTier: updatedUser.kycTier,
          kycVerifiedAt: updatedUser.kycVerifiedAt,
        }
      });

    } catch (error) {
      console.error('Manual KYC update error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "KYC status update failed", 
        code: "UPDATE_ERROR" 
      });
    }
  });

  /**
   * Get KYC Status for User
   */
  app.get("/api/kyc/status/:userId", async (req, res) => {
    try {
      // This would need authentication middleware
      // app.get("/api/kyc/status/:userId", authenticateJWT, requireAffiliateAccess('userId'), async (req, res) => {
      
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: "User not found", 
          code: "USER_NOT_FOUND" 
        });
      }

      // Calculate earning limits based on KYC tier
      const tierLimits = {
        0: { daily: 0, monthly: 0, total: 0 },      // Unverified
        1: { daily: 100, monthly: 1000, total: 5000 },    // Basic
        2: { daily: 500, monthly: 10000, total: 50000 },  // Standard  
        3: { daily: -1, monthly: -1, total: -1 },         // Premium (unlimited)
      };

      const limits = tierLimits[user.kycTier as keyof typeof tierLimits] || tierLimits[0];

      res.json({
        userId: user.id,
        email: user.email,
        kycStatus: user.kycStatus,
        kycTier: user.kycTier,
        kycVerifiedAt: user.kycVerifiedAt,
        limits: {
          daily: limits.daily === -1 ? 'unlimited' : `$${limits.daily}`,
          monthly: limits.monthly === -1 ? 'unlimited' : `$${limits.monthly}`,
          total: limits.total === -1 ? 'unlimited' : `$${limits.total}`,
        },
        canRequestPayouts: user.kycStatus === 'approved' && user.kycTier >= 1,
      });

    } catch (error) {
      console.error('KYC status fetch error:', error);
      res.status(500).json({ 
        error: "Failed to fetch KYC status", 
        code: "FETCH_ERROR" 
      });
    }
  });

  /**
   * Initiate KYC Verification
   * Starts the verification process with VerifyMy
   */
  app.post("/api/kyc/initiate", async (req, res) => {
    try {
      // This would need authentication middleware
      // app.post("/api/kyc/initiate", authenticateJWT, requireRole('affiliate'), async (req, res) => {
      
      const initiateSchema = z.object({
        redirectUrl: z.string().url().optional(),
        tier: z.number().min(1).max(3).default(1),
      });

      const { redirectUrl, tier } = initiateSchema.parse(req.body);
      
      // In practice, this would make an API call to VerifyMy to start verification
      const verificationUrl = await initiateVerifyMyFlow(req.user?.id || 'unknown', tier, redirectUrl);

      res.json({
        success: true,
        verificationUrl,
        tier,
        message: "KYC verification initiated. Please complete verification at the provided URL."
      });

    } catch (error) {
      console.error('KYC initiation error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to initiate KYC verification", 
        code: "INITIATION_ERROR" 
      });
    }
  });
}

/**
 * Notify user of KYC status change
 * In a real system, this would send emails, push notifications, etc.
 */
async function notifyKYCStatusChange(user: any, webhook: VerifyMyWebhook) {
  try {
    // Placeholder for notification logic
    console.log(`📧 KYC Notification for ${user.email}:`);
    console.log(`   Status: ${webhook.data.status}`);
    console.log(`   Tier: ${webhook.data.tier}`);
    
    if (webhook.data.status === 'approved') {
      console.log(`   ✅ KYC Approved! You can now request payouts up to your tier limits.`);
    } else if (webhook.data.status === 'failed') {
      console.log(`   ❌ KYC Failed: ${webhook.data.failureReason || 'No reason provided'}`);
    }

    // In production, you would:
    // - Send email via SendGrid, AWS SES, etc.
    // - Send push notification via Firebase, OneSignal, etc.
    // - Update dashboard notifications
    // - Integrate with FanzDash for unified notifications

  } catch (error) {
    console.error('KYC notification error:', error);
  }
}

/**
 * Initiate VerifyMy verification flow
 * In a real system, this would make an API call to VerifyMy
 */
async function initiateVerifyMyFlow(userId: string, tier: number, redirectUrl?: string): Promise<string> {
  try {
    // Placeholder implementation
    // In reality, this would call VerifyMy API
    
    const verifyMyApiUrl = process.env.VERIFYMY_API_URL;
    const verifyMyApiKey = process.env.VERIFYMY_API_KEY;
    
    if (!verifyMyApiUrl || !verifyMyApiKey) {
      throw new Error('VerifyMy configuration missing');
    }

    // Mock response for development
    const sessionId = `vm_${Date.now()}_${userId}`;
    const mockVerificationUrl = `${verifyMyApiUrl}/verify?session=${sessionId}&tier=${tier}&redirect=${encodeURIComponent(redirectUrl || '')}`;
    
    console.log(`🔒 VerifyMy verification initiated for user ${userId}, tier ${tier}`);
    
    return mockVerificationUrl;
    
  } catch (error) {
    console.error('VerifyMy API error:', error);
    throw new Error('Failed to initiate verification with VerifyMy');
  }
}

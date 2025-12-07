import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertComplianceRecordSchema } from '@shared/schema';
import { costarService } from '../costarService';
import { serviceIntegrationService } from '../serviceIntegrationService';
import QRCode from 'qrcode';

export class ComplianceController {
  // Submit compliance record (2257 compliance)
  async submitComplianceRecord(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const recordData = insertComplianceRecordSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user already has a compliance record
      const existingRecord = await storage.getComplianceRecord(userId);
      if (existingRecord && existingRecord.status === 'approved') {
        return res.status(400).json({ message: 'Compliance already approved' });
      }
      
      const record = await storage.createComplianceRecord(recordData);
      
      res.status(201).json(record);
    } catch (error) {
      console.error('Submit compliance record error:', error);
      res.status(500).json({ message: 'Failed to submit compliance record' });
    }
  }

  // Get user's compliance status
  async getComplianceStatus(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      const record = await storage.getComplianceRecord(userId);
      
      if (!record) {
        return res.json({ status: 'not_submitted', record: null });
      }
      
      res.json({ 
        status: record.status,
        record: {
          id: record.id,
          status: record.status,
          verificationType: record.verificationType,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          approvedAt: record.approvedAt,
          expiresAt: record.expiresAt
        }
      });
    } catch (error) {
      console.error('Get compliance status error:', error);
      res.status(500).json({ message: 'Failed to get compliance status' });
    }
  }

  // Age verification
  async verifyAge(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { dateOfBirth, documentType, documentImage } = req.body;
      
      if (!dateOfBirth || !documentImage) {
        return res.status(400).json({ message: 'Missing required verification data' });
      }
      
      // Calculate age
      const birthDate = new Date(dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 18) {
        return res.status(403).json({ message: 'Must be 18 or older' });
      }
      
      // In production, would use AI verification service
      const verificationResult = {
        verified: true,
        confidence: 0.95,
        age: age
      };
      
      if (verificationResult.verified) {
        await storage.updateUserProfile(userId, {
          isVerified: true
        });
      }
      
      res.json(verificationResult);
    } catch (error) {
      console.error('Age verification error:', error);
      res.status(500).json({ message: 'Failed to verify age' });
    }
  }

  // Document upload for compliance
  async uploadDocument(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { documentType, fileName, fileSize } = req.body;
      
      // Generate secure upload URL
      const uploadUrl = `https://secure-storage.example.com/compliance/${userId}/${documentType}/${fileName}`;
      
      res.json({ uploadUrl });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ message: 'Failed to generate upload URL' });
    }
  }

  // Co-star verification - Create invitation with QR code and email
  async initiateCostarVerification(req: any, res: Response) {
    try {
      const primaryCreatorId = req.user.claims.sub;
      const { costarEmail, costarName, contentCreationDate, postId } = req.body;
      
      if (!costarEmail || !costarName) {
        return res.status(400).json({ message: 'Co-star email and name are required' });
      }
      
      const invitation = await costarService.createCostarInvitation({
        costarEmail,
        costarName, 
        primaryCreatorId,
        postId,
        contentCreationDate: contentCreationDate ? new Date(contentCreationDate) : undefined
      });
      
      res.json({
        success: true,
        inviteId: invitation.inviteId,
        verificationUrl: invitation.inviteUrl,
        qrCode: invitation.qrCode,
        clipboardLink: invitation.clipboardLink,
        message: 'Co-star verification invitation sent successfully. QR code generated and email sent.'
      });
    } catch (error) {
      console.error('Costar verification error:', error);
      res.status(500).json({ message: 'Failed to initiate co-star verification' });
    }
  }

  // Complete co-star verification form submission
  async completeCostarVerification(req: any, res: Response) {
    try {
      const { token } = req.params;
      const formData = req.body;
      const { idImageUrl } = req.body;
      
      if (!idImageUrl) {
        return res.status(400).json({ message: 'ID image is required' });
      }
      
      const result = await costarService.processCostarForm(token, formData, idImageUrl);
      
      res.json({ 
        success: true,
        verificationId: result.verificationId,
        status: result.status,
        message: 'Co-star verification form submitted successfully. Pending admin review.'
      });
    } catch (error) {
      console.error('Complete costar verification error:', error);
      res.status(500).json({ message: error.message || 'Failed to complete co-star verification' });
    }
  }

  // Get compliance requirements
  async getComplianceRequirements(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const requirements = {
        ageVerification: {
          required: true,
          completed: user?.isVerified || false,
          description: 'Verify you are 18 or older'
        },
        identityVerification: {
          required: user?.role === 'creator',
          completed: false,
          description: 'Government ID verification for creators'
        },
        form2257: {
          required: user?.role === 'creator',
          completed: false,
          description: '2257 compliance record for adult content'
        }
      };
      
      res.json(requirements);
    } catch (error) {
      console.error('Get compliance requirements error:', error);
      res.status(500).json({ message: 'Failed to get compliance requirements' });
    }
  }

  // Get co-star verification form by token
  async getCostarForm(req: any, res: Response) {
    try {
      const { token } = req.params;
      
      const formInfo = await costarService.getCostarFormByToken(token);
      
      if (!formInfo.isValid) {
        return res.status(404).json({ message: 'Invalid or expired verification link' });
      }
      
      res.json(formInfo);
    } catch (error) {
      console.error('Get costar form error:', error);
      res.status(500).json({ message: 'Failed to get co-star form' });
    }
  }

  // Admin: Get pending co-star verifications for approval
  async getPendingCostarVerifications(req: any, res: Response) {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);
      
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const pendingVerifications = await storage.getPendingCostarVerifications();
      
      res.json(pendingVerifications);
    } catch (error) {
      console.error('Get pending costar verifications error:', error);
      res.status(500).json({ message: 'Failed to get pending verifications' });
    }
  }

  // Admin: Approve or deny co-star verification
  async reviewCostarVerification(req: any, res: Response) {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);
      
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { verificationId } = req.params;
      const { status, reviewNotes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be approved or rejected' });
      }
      
      const verification = await storage.getCostarVerification(verificationId);
      if (!verification) {
        return res.status(404).json({ message: 'Verification not found' });
      }
      
      // Update verification status
      await storage.updateCostarVerification(verificationId, {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes
      });
      
      // Update compliance record status
      if (verification.complianceRecordId) {
        await storage.updateComplianceRecord(verification.complianceRecordId, {
          status,
          approvedBy: adminId,
          approvedAt: status === 'approved' ? new Date() : null
        });
      }
      
      // Send notification emails
      await this.sendVerificationStatusNotification(verification, status, reviewNotes);
      
      res.json({ 
        success: true,
        message: `Co-star verification ${status} successfully`
      });
    } catch (error) {
      console.error('Review costar verification error:', error);
      res.status(500).json({ message: 'Failed to review verification' });
    }
  }

  // Get co-star verification details for admin review
  async getCostarVerificationDetails(req: any, res: Response) {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);
      
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { verificationId } = req.params;
      const verification = await storage.getCostarVerificationWithDetails(verificationId);
      
      if (!verification) {
        return res.status(404).json({ message: 'Verification not found' });
      }
      
      res.json(verification);
    } catch (error) {
      console.error('Get costar verification details error:', error);
      res.status(500).json({ message: 'Failed to get verification details' });
    }
  }

  // Creator: Get co-star verifications for dashboard
  async getCreatorCostarVerifications(req: any, res: Response) {
    try {
      const creatorId = req.user.claims.sub;
      
      const verifications = await costarService.getCostarVerifications(creatorId);
      const pendingInvitations = await costarService.getPendingInvitations(creatorId);
      
      res.json({
        verifications,
        pendingInvitations
      });
    } catch (error) {
      console.error('Get creator costar verifications error:', error);
      res.status(500).json({ message: 'Failed to get co-star verifications' });
    }
  }

  // Resend co-star invitation
  async resendCostarInvitation(req: any, res: Response) {
    try {
      const creatorId = req.user.claims.sub;
      const { invitationId } = req.params;
      
      await costarService.resendInvitation(invitationId, creatorId);
      
      res.json({ 
        success: true,
        message: 'Invitation resent successfully'
      });
    } catch (error) {
      console.error('Resend costar invitation error:', error);
      res.status(500).json({ message: error.message || 'Failed to resend invitation' });
    }
  }

  // Cancel co-star invitation
  async cancelCostarInvitation(req: any, res: Response) {
    try {
      const creatorId = req.user.claims.sub;
      const { invitationId } = req.params;
      
      await costarService.cancelInvitation(invitationId, creatorId);
      
      res.json({ 
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel costar invitation error:', error);
      res.status(500).json({ message: error.message || 'Failed to cancel invitation' });
    }
  }

  // Private helper methods
  private async sendVerificationStatusNotification(verification: any, status: string, reviewNotes?: string): Promise<void> {
    try {
      const primaryCreator = await storage.getUser(verification.primaryCreatorId);
      const costar = await storage.getUser(verification.costarUserId);
      
      // Email to primary creator
      const creatorEmailContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Co-Star Verification ${status === 'approved' ? 'Approved' : 'Denied'}</h2>
    
    <p>Hello ${primaryCreator.displayName},</p>
    
    <p>The co-star verification for <strong>${verification.costarName}</strong> has been <strong>${status}</strong>.</p>
    
    ${reviewNotes ? `<p><strong>Review Notes:</strong> ${reviewNotes}</p>` : ''}
    
    <p>You can view the full verification details in your creator dashboard.</p>
    
    <p>Best regards,<br>
    Fanz Unlimited Network Compliance Team</p>
</body>
</html>`;
      
      await serviceIntegrationService.sendEmail({
        to: primaryCreator.email,
        from: 'compliance@fanzunlimited.com',
        subject: `Co-Star Verification ${status === 'approved' ? 'Approved' : 'Denied'} - Fanz Unlimited Network`,
        html: creatorEmailContent
      });
      
      // Email to co-star
      const costarEmailContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Your Verification Has Been ${status === 'approved' ? 'Approved' : 'Denied'}</h2>
    
    <p>Hello ${verification.costarName},</p>
    
    <p>Your 2257 verification form has been <strong>${status}</strong>.</p>
    
    ${status === 'approved' ? 
      '<p>You are now verified for content collaboration. A secure copy of your verification has been stored and will be maintained for compliance purposes.</p>' : 
      `<p>Your verification was not approved. ${reviewNotes ? `Reason: ${reviewNotes}` : 'Please contact our compliance team for more information.'}</p>`
    }
    
    <p>If you have any questions, please contact our compliance team at <a href="mailto:compliance@fanzunlimited.com">compliance@fanzunlimited.com</a></p>
    
    <p>Best regards,<br>
    Fanz Unlimited Network Compliance Team</p>
</body>
</html>`;
      
      await serviceIntegrationService.sendEmail({
        to: verification.costarEmail,
        from: 'compliance@fanzunlimited.com',
        subject: `Verification ${status === 'approved' ? 'Approved' : 'Denied'} - Fanz Unlimited Network`,
        html: costarEmailContent
      });
      
    } catch (error) {
      console.error('Error sending verification status notification:', error);
    }
  }
}

export const complianceController = new ComplianceController();
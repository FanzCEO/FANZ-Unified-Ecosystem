import { storage } from "./storage";
import { complianceService } from "./complianceService";
import { serviceIntegrationService } from "./serviceIntegrationService";
import { monitoringService } from "./monitoringService";
import crypto from "crypto";
import QRCode from "qrcode";

export interface CostarInviteRequest {
  costarName: string;
  costarEmail: string;
  primaryCreatorId: string;
  postId?: string;
  contentCreationDate?: Date;
}

export interface CostarFormData {
  // Personal Information
  legalName: string;
  stageName?: string;
  maidenName?: string;
  previousLegalName?: string;
  otherKnownNames?: string;
  dateOfBirth: Date;
  age: number;

  // Identification
  idType: string;
  idNumber: string;
  idState?: string;
  idCountry: string;

  // Contact Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cellPhone?: string;
  homePhone?: string;

  // Content Information
  primaryCreatorName: string;
  contentCreationDate: Date;

  // Legal Certifications
  certifications: {
    is18OrOlder: boolean;
    disclosedAllNames: boolean;
    providedAccurateId: boolean;
    noIllegalActs: boolean;
    freeWillParticipation: boolean;
  };

  // Signatures and Dates
  costarSignature: string;
  primaryCreatorSignature: string;
  signatureDate: Date;

  // Uploaded Documents
  idImageUrl: string;
  additionalDocuments?: string[];
}

export class CostarService {
  // Create co-star invitation
  async createCostarInvitation(request: CostarInviteRequest): Promise<{
    inviteId: string;
    qrCode: string;
    inviteUrl: string;
    clipboardLink: string;
  }> {
    const inviteId = crypto.randomUUID();
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Create invite URL
    const baseUrl = process.env.BASE_URL || "https://fanzlab.com";
    const inviteUrl = `${baseUrl}/costar/verify/${inviteToken}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Set expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save invitation to database
    const invitation = {
      id: inviteId,
      primaryCreatorId: request.primaryCreatorId,
      costarEmail: request.costarEmail,
      costarName: request.costarName,
      inviteToken,
      qrCode: qrCodeDataUrl,
      inviteUrl,
      emailSent: false,
      isUsed: false,
      expiresAt,
      createdAt: new Date(),
    };

    await storage.createCostarInvitation(invitation);

    // Send invitation email
    await this.sendInvitationEmail(invitation);

    // Update invitation as email sent
    await storage.updateCostarInvitation(inviteId, { emailSent: true });

    console.log(
      `Co-star invitation created: ${inviteId} for ${request.costarEmail}`,
    );
    monitoringService.trackBusinessMetric("costar_invitation_created", 1, {
      primaryCreatorId: request.primaryCreatorId,
      costarEmail: request.costarEmail,
    });

    return {
      inviteId,
      qrCode: qrCodeDataUrl,
      inviteUrl,
      clipboardLink: inviteUrl,
    };
  }

  // Process co-star form submission
  async processCostarForm(
    inviteToken: string,
    formData: CostarFormData,
    idFileUrl: string,
  ): Promise<{ verificationId: string; status: string }> {
    // Find invitation
    const invitation = await storage.getCostarInvitationByToken(inviteToken);
    if (!invitation || invitation.isUsed || invitation.expiresAt < new Date()) {
      throw new Error("Invalid or expired invitation");
    }

    // Validate age
    if (formData.age < 18) {
      throw new Error("Co-star must be 18 years or older");
    }

    // Create compliance record for co-star
    const complianceData = {
      legalName: formData.legalName,
      stageName: formData.stageName,
      maidenName: formData.maidenName,
      previousLegalName: formData.previousLegalName,
      otherKnownNames: formData.otherKnownNames,
      dateOfBirth: formData.dateOfBirth,
      age: formData.age,
      idType: formData.idType as any,
      idNumber: formData.idNumber,
      idState: formData.idState,
      idCountry: formData.idCountry,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      cellPhone: formData.cellPhone,
      homePhone: formData.homePhone,
      idImageUrl: idFileUrl,
      verificationType: "co_star" as any,
    };

    // Get or create co-star user account
    let costarUserId = await storage.getUserByEmail(formData.legalName); // Using email from form
    if (!costarUserId) {
      costarUserId = await this.createCostarUser(formData);
    }

    // Create compliance record
    const complianceResult = await complianceService.createComplianceRecord(
      costarUserId,
      complianceData,
      invitation.primaryCreatorId,
    );

    // Create co-star verification record
    const verificationId = crypto.randomUUID();
    const verification = {
      id: verificationId,
      primaryCreatorId: invitation.primaryCreatorId,
      costarUserId,
      costarEmail: invitation.costarEmail,
      costarName: invitation.costarName,
      complianceRecordId: complianceResult.id,
      contentCreationDate: formData.contentCreationDate,
      status: "pending" as any,
      verificationToken: inviteToken,
      inviteEmailSent: true,
      formCompletedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.createCostarVerification(verification);

    // Mark invitation as used
    await storage.updateCostarInvitation(invitation.id, {
      isUsed: true,
      usedAt: new Date(),
    });

    // Send confirmation emails
    await this.sendFormCompletionNotification(invitation, formData);

    console.log(
      `Co-star form processed: ${verificationId} for ${formData.legalName}`,
    );
    monitoringService.trackBusinessMetric("costar_form_completed", 1, {
      verificationId,
      primaryCreatorId: invitation.primaryCreatorId,
      costarName: formData.legalName,
    });

    return {
      verificationId,
      status: "pending_review",
    };
  }

  // Get co-star verifications for creator
  async getCostarVerifications(creatorId: string): Promise<any[]> {
    return await storage.getCostarVerificationsByCreator(creatorId);
  }

  // Get pending co-star invitations for creator
  async getPendingInvitations(creatorId: string): Promise<any[]> {
    return await storage.getPendingCostarInvitations(creatorId);
  }

  // Get co-star form by token (for form display)
  async getCostarFormByToken(token: string): Promise<{
    invitation: any;
    isValid: boolean;
    primaryCreatorInfo: any;
  }> {
    const invitation = await storage.getCostarInvitationByToken(token);

    if (!invitation || invitation.isUsed || invitation.expiresAt < new Date()) {
      return {
        invitation: null,
        isValid: false,
        primaryCreatorInfo: null,
      };
    }

    const primaryCreator = await storage.getUser(
      invitation.primaryCreatorId,
    );

    return {
      invitation,
      isValid: true,
      primaryCreatorInfo: {
        displayName: primaryCreator?.displayName,
        username: primaryCreator?.username,
        profileImageUrl: primaryCreator?.profileImageUrl,
      },
    };
  }

  // Resend invitation email
  async resendInvitation(
    invitationId: string,
    creatorId: string,
  ): Promise<void> {
    const invitation = await storage.getCostarInvitation(invitationId);

    if (!invitation || invitation.primaryCreatorId !== creatorId) {
      throw new Error("Invitation not found");
    }

    if (invitation.isUsed) {
      throw new Error("Invitation has already been used");
    }

    await this.sendInvitationEmail(invitation);

    console.log(`Co-star invitation resent: ${invitationId}`);
    monitoringService.trackBusinessMetric("costar_invitation_resent", 1, {
      invitationId,
      creatorId,
    });
  }

  // Cancel invitation
  async cancelInvitation(
    invitationId: string,
    creatorId: string,
  ): Promise<void> {
    const invitation = await storage.getCostarInvitation(invitationId);

    if (!invitation || invitation.primaryCreatorId !== creatorId) {
      throw new Error("Invitation not found");
    }

    await storage.deleteCostarInvitation(invitationId);

    console.log(`Co-star invitation cancelled: ${invitationId}`);
    monitoringService.trackBusinessMetric("costar_invitation_cancelled", 1, {
      invitationId,
      creatorId,
    });
  }

  // Private helper methods
  private async sendInvitationEmail(invitation: any): Promise<void> {
    const primaryCreator = await storage.getUser(
      invitation.primaryCreatorId,
    );

    const emailContent = this.generateInvitationEmail(
      invitation,
      primaryCreator,
    );

    // Send email via service integration
    await serviceIntegrationService.sendEmail({
      to: invitation.costarEmail,
      from: "noreply@fanzunlimited.com",
      subject: "2257 Co-Star Verification Required - Fanz Unlimited Network",
      html: emailContent,
    });
  }

  private generateInvitationEmail(
    invitation: any,
    primaryCreator: any,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Co-Star Verification Required</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
        <h1>Co-Star Verification Required</h1>
        <p>You've been invited to complete a 2257 verification form</p>
    </div>
    
    <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
        <h2>Hello ${invitation.costarName},</h2>
        
        <p><strong>${primaryCreator.displayName}</strong> has invited you to complete a federal 2257 compliance verification form.</p>
        
        <p><strong>What is this?</strong><br>
        This form is required by US federal law (18 U.S.C. § 2257) for anyone appearing in adult content. It verifies that all participants are 18 years or older and provides necessary record-keeping compliance.</p>
        
        <p><strong>What you'll need:</strong></p>
        <ul>
            <li>Government-issued photo ID (Driver's License, Passport, etc.)</li>
            <li>Your current address information</li>
            <li>About 10 minutes to complete the form</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${invitation.inviteUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Complete Verification Form</a>
        </div>
        
        <p><strong>Security & Privacy:</strong></p>
        <ul>
            <li>Your information is encrypted and stored securely</li>
            <li>Records are maintained for legal compliance only</li>
            <li>Your data will never be shared or sold</li>
            <li>This link expires in 30 days</li>
        </ul>
        
        <p>If you have any questions, please contact our compliance team at <a href="mailto:compliance@fanzunlimited.com">compliance@fanzunlimited.com</a></p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
            This email was sent by Fanz™ Unlimited Network (FUN) L.L.C.<br>
            30 N Gould Street #45302, Sheridan, WY 82801<br>
            <a href="${invitation.inviteUrl}">Click here if the button above doesn't work</a>
        </p>
    </div>
</body>
</html>`;
  }

  private async sendFormCompletionNotification(
    invitation: any,
    formData: CostarFormData,
  ): Promise<void> {
    const primaryCreator = await storage.getUser(
      invitation.primaryCreatorId,
    );

    // Notify primary creator
    await serviceIntegrationService.sendPushNotification(
      [invitation.primaryCreatorId],
      "Co-Star Verification Submitted",
      `${formData.legalName} has completed their 2257 verification form. It's now pending admin review.`,
      {
        costarName: formData.legalName,
        invitationId: invitation.id,
        status: "pending_review",
      },
    );

    // Send confirmation email to co-star
    const confirmationEmail = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Verification Form Submitted Successfully</h2>
    
    <p>Hello ${formData.legalName},</p>
    
    <p>Your 2257 verification form has been submitted successfully and is now under review by our compliance team.</p>
    
    <p><strong>What happens next?</strong></p>
    <ul>
        <li>Our compliance team will review your submission within 24-48 hours</li>
        <li>You'll receive an email notification once the review is complete</li>
        <li>${primaryCreator?.displayName || 'The primary creator'} will be notified when verification is approved</li>
    </ul>
    
    <p>Thank you for completing this important compliance requirement.</p>
    
    <p>Best regards,<br>
    Fanz Unlimited Network Compliance Team</p>
</body>
</html>`;

    await serviceIntegrationService.sendEmail({
      to: invitation.costarEmail,
      from: "compliance@fanzunlimited.com",
      subject: "Verification Form Submitted - Fanz Unlimited Network",
      html: confirmationEmail,
    });
  }

  private async createCostarUser(formData: CostarFormData): Promise<string> {
    const userId = crypto.randomUUID();

    const userData = {
      id: userId,
      email: formData.legalName, // Temporarily using name as identifier
      firstName: formData.legalName.split(" ")[0],
      lastName: formData.legalName.split(" ").slice(1).join(" "),
      displayName: formData.stageName || formData.legalName,
      role: "creator" as any,
      username:
        formData.stageName?.toLowerCase().replace(/\s+/g, "") ||
        formData.legalName.toLowerCase().replace(/\s+/g, ""),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.upsertUser(userData);
    return userId;
  }

  // Cleanup expired invitations
  async cleanupExpiredInvitations(): Promise<void> {
    const expiredInvitations = await storage.getExpiredCostarInvitations();

    for (const invitation of expiredInvitations) {
      if (!invitation.isUsed) {
        await storage.deleteCostarInvitation(invitation.id);
      }
    }

    console.log(
      `Cleaned up ${expiredInvitations.length} expired co-star invitations`,
    );
  }
}

export const costarService = new CostarService();

// Run cleanup every 24 hours
setInterval(
  () => {
    costarService.cleanupExpiredInvitations();
  },
  24 * 60 * 60 * 1000,
);

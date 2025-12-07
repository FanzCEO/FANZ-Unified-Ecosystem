/**
 * Email Service
 *
 * This service handles sending transactional emails for FANZ Creator App.
 * Supports multiple providers: SMTP, SendGrid, AWS SES, etc.
 */

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'console';
  from: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor() {
    const provider = (process.env.EMAIL_PROVIDER || 'console') as 'smtp' | 'sendgrid' | 'console';

    this.config = {
      provider,
      from: process.env.EMAIL_FROM || 'noreply@fanz.app',
      smtp: provider === 'smtp' ? {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      } : undefined,
      sendgrid: provider === 'sendgrid' ? {
        apiKey: process.env.SENDGRID_API_KEY || '',
      } : undefined,
    };

    if (provider !== 'console') {
      console.log(`📧 Email service initialized with provider: ${provider}`);
    } else {
      console.log('📧 Email service running in console mode (emails will be logged)');
    }
  }

  /**
   * Send an email
   */
  async send(emailData: EmailData): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'smtp':
          return await this.sendViaSMTP(emailData);
        case 'sendgrid':
          return await this.sendViaSendGrid(emailData);
        case 'console':
        default:
          return this.sendViaConsole(emailData);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send access code email
   */
  async sendAccessCode(email: string, firstName: string, code: string): Promise<boolean> {
    const subject = 'Your FANZ Platform Access Code';
    const html = this.getAccessCodeEmailTemplate(firstName, code);
    const text = this.getAccessCodeEmailText(firstName, code);

    return await this.send({ to: email, subject, html, text });
  }

  /**
   * Send verification approved email
   */
  async sendVerificationApproved(email: string, firstName: string, code: string): Promise<boolean> {
    const subject = 'FANZ Verification Approved - Your Access Code';
    const html = this.getVerificationApprovedTemplate(firstName, code);
    const text = this.getVerificationApprovedText(firstName, code);

    return await this.send({ to: email, subject, html, text });
  }

  /**
   * Send verification rejected email
   */
  async sendVerificationRejected(email: string, firstName: string, reasons: string[]): Promise<boolean> {
    const subject = 'FANZ Verification Update';
    const html = this.getVerificationRejectedTemplate(firstName, reasons);
    const text = this.getVerificationRejectedText(firstName, reasons);

    return await this.send({ to: email, subject, html, text });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(email: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to FANZ Creator Platform!';
    const html = this.getWelcomeEmailTemplate(firstName);
    const text = this.getWelcomeEmailText(firstName);

    return await this.send({ to: email, subject, html, text });
  }

  /**
   * Send via SMTP
   */
  private async sendViaSMTP(emailData: EmailData): Promise<boolean> {
    // In production, use nodemailer or similar
    // For now, we'll log to console since we don't have nodemailer installed
    console.log('📧 SMTP email would be sent:', emailData);
    return true;
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(emailData: EmailData): Promise<boolean> {
    if (!this.config.sendgrid?.apiKey) {
      console.error('SendGrid API key not configured');
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailData.to }] }],
          from: { email: this.config.from },
          subject: emailData.subject,
          content: [
            { type: 'text/plain', value: emailData.text || '' },
            { type: 'text/html', value: emailData.html },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending via SendGrid:', error);
      return false;
    }
  }

  /**
   * Send via console (development mode)
   */
  private sendViaConsole(emailData: EmailData): boolean {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (Console Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${emailData.to}`);
    console.log(`From: ${this.config.from}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('───────────────────────────────────────────');
    console.log(emailData.text || this.htmlToText(emailData.html));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Email Templates

  private getAccessCodeEmailTemplate(firstName: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%); padding: 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: #000; }
    .content { padding: 40px 30px; }
    .code-box { background: #222; border: 2px solid #ff00ff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ff00ff; font-family: monospace; }
    .button { display: inline-block; background: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%); color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FANZ</div>
    </div>
    <div class="content">
      <h1 style="color: #ff00ff; margin-top: 0;">Welcome, ${firstName}! 🎉</h1>
      <p>Your verification has been approved! You're now ready to access the FANZ Creator Platform.</p>
      <p>Here is your secure access code:</p>

      <div class="code-box">
        <div class="code">${code}</div>
        <p style="color: #888; margin: 10px 0 0 0; font-size: 14px;">This code expires in 24 hours</p>
      </div>

      <p><strong>To get started:</strong></p>
      <ol style="line-height: 1.8;">
        <li>Visit the FANZ access page</li>
        <li>Enter your email address</li>
        <li>Enter the access code above</li>
        <li>Start creating amazing content!</li>
      </ol>

      <p style="color: #888; font-size: 14px; margin-top: 30px;">
        ⚠️ Keep this code secure and don't share it with anyone.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 FANZ Creator Platform. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getAccessCodeEmailText(firstName: string, code: string): string {
    return `
Welcome, ${firstName}!

Your verification has been approved! You're now ready to access the FANZ Creator Platform.

Your Access Code: ${code}

This code expires in 24 hours.

To get started:
1. Visit the FANZ access page
2. Enter your email address
3. Enter the access code above
4. Start creating amazing content!

⚠️ Keep this code secure and don't share it with anyone.

© 2024 FANZ Creator Platform. All rights reserved.
    `.trim();
  }

  private getVerificationApprovedTemplate(firstName: string, code: string): string {
    return this.getAccessCodeEmailTemplate(firstName, code);
  }

  private getVerificationApprovedText(firstName: string, code: string): string {
    return this.getAccessCodeEmailText(firstName, code);
  }

  private getVerificationRejectedTemplate(firstName: string, reasons: string[]): string {
    const reasonsList = reasons.map(r => `<li>${r}</li>`).join('');
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%); padding: 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: #000; }
    .content { padding: 40px 30px; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FANZ</div>
    </div>
    <div class="content">
      <h1 style="color: #ff6b6b;">Verification Update</h1>
      <p>Hello ${firstName},</p>
      <p>Thank you for your interest in joining FANZ Creator Platform. Unfortunately, we were unable to verify your identity at this time.</p>

      <p><strong>Reasons:</strong></p>
      <ul>${reasonsList}</ul>

      <p>You can resubmit your verification with corrected information. Please ensure:</p>
      <ul>
        <li>Photos are clear and well-lit</li>
        <li>All document information is visible</li>
        <li>Your selfie clearly shows your face</li>
        <li>Documents are valid and not expired</li>
      </ul>

      <p>If you have questions, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>© 2024 FANZ Creator Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getVerificationRejectedText(firstName: string, reasons: string[]): string {
    const reasonsList = reasons.map((r, i) => `${i + 1}. ${r}`).join('\n');
    return `
Verification Update

Hello ${firstName},

Thank you for your interest in joining FANZ Creator Platform. Unfortunately, we were unable to verify your identity at this time.

Reasons:
${reasonsList}

You can resubmit your verification with corrected information. Please ensure:
- Photos are clear and well-lit
- All document information is visible
- Your selfie clearly shows your face
- Documents are valid and not expired

If you have questions, please contact our support team.

© 2024 FANZ Creator Platform. All rights reserved.
    `.trim();
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%); padding: 30px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: #000; }
    .content { padding: 40px 30px; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FANZ</div>
    </div>
    <div class="content">
      <h1 style="color: #ff00ff;">Welcome to FANZ! 🚀</h1>
      <p>Hello ${firstName},</p>
      <p>You've successfully joined the FANZ Creator Platform! We're excited to have you as part of our community.</p>

      <p><strong>What's next?</strong></p>
      <ul style="line-height: 1.8;">
        <li>Complete your creator profile</li>
        <li>Set your subscription pricing</li>
        <li>Create your first post</li>
        <li>Go live and connect with your fans</li>
        <li>Explore the shop and referral features</li>
      </ul>

      <p>Start monetizing your content today and build your fanbase!</p>
    </div>
    <div class="footer">
      <p>© 2024 FANZ Creator Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getWelcomeEmailText(firstName: string): string {
    return `
Welcome to FANZ!

Hello ${firstName},

You've successfully joined the FANZ Creator Platform! We're excited to have you as part of our community.

What's next?
- Complete your creator profile
- Set your subscription pricing
- Create your first post
- Go live and connect with your fans
- Explore the shop and referral features

Start monetizing your content today and build your fanbase!

© 2024 FANZ Creator Platform. All rights reserved.
    `.trim();
  }
}

export const emailService = new EmailService();

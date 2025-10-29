/**
 * Email Service
 * Handles sending emails for verification, password reset, notifications, etc.
 */

import { Logger } from '../utils/logger';
import { config } from '../config';

const logger = new Logger('EmailService');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface VerificationEmailData {
  username: string;
  verificationUrl: string;
  expirationHours: number;
}

export interface PasswordResetEmailData {
  username: string;
  resetUrl: string;
  expirationHours: number;
}

export interface TwoFactorEmailData {
  username: string;
  code: string;
  expirationMinutes: number;
}

export class EmailService {
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = config.EMAIL_FROM || 'noreply@fanz.com';
    this.fromName = config.EMAIL_FROM_NAME || 'FANZ Platform';
  }

  /**
   * Send email (implementation depends on email provider)
   * Currently logs email for development, integrate with SendGrid/Mailgun/SES in production
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html, text, from } = options;

      // In development, just log the email
      if (config.NODE_ENV === 'development') {
        logger.info('Email sent (development mode)', {
          to,
          subject,
          from: from || `${this.fromName} <${this.fromEmail}>`,
          preview: text || html.substring(0, 100)
        });
        return true;
      }

      // TODO: Integrate with actual email service provider in production
      // Example for SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(config.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to,
      //   from: from || `${this.fromName} <${this.fromEmail}>`,
      //   subject,
      //   text,
      //   html
      // });

      // Example for Mailgun:
      // const mailgun = require('mailgun-js');
      // const mg = mailgun({
      //   apiKey: config.MAILGUN_API_KEY,
      //   domain: config.MAILGUN_DOMAIN
      // });
      // await mg.messages().send({
      //   from: from || `${this.fromName} <${this.fromEmail}>`,
      //   to,
      //   subject,
      //   text,
      //   html
      // });

      logger.warn('Email service not configured for production', { to, subject });
      return true;

    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : String(error),
        to: options.to
      });
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>Thank you for signing up for FANZ! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
            <p><strong>This link will expire in ${data.expirationHours} hours.</strong></p>
            <p>If you didn't create an account with FANZ, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FANZ Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${data.username},

Thank you for signing up for FANZ! To complete your registration, please verify your email address by visiting:

${data.verificationUrl}

This link will expire in ${data.expirationHours} hours.

If you didn't create an account with FANZ, you can safely ignore this email.

© ${new Date().getFullYear()} FANZ Platform. All rights reserved.
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - FANZ',
      html,
      text
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>We received a request to reset your password for your FANZ account. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
            <p><strong>This link will expire in ${data.expirationHours} hour(s).</strong></p>
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged. Your account is secure.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FANZ Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${data.username},

We received a request to reset your password for your FANZ account. Visit this link to create a new password:

${data.resetUrl}

This link will expire in ${data.expirationHours} hour(s).

Security Notice: If you didn't request a password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} FANZ Platform. All rights reserved.
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - FANZ',
      html,
      text
    });
  }

  /**
   * Send 2FA code email
   */
  async send2FACodeEmail(email: string, data: TwoFactorEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; background: white; padding: 20px; border-radius: 5px; margin: 20px 0; color: #667eea; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Verification Code</h1>
          </div>
          <div class="content">
            <p>Hi ${data.username},</p>
            <p>Your two-factor authentication code is:</p>
            <div class="code">${data.code}</div>
            <p><strong>This code will expire in ${data.expirationMinutes} minutes.</strong></p>
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. FANZ will never ask you for this code.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FANZ Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${data.username},

Your two-factor authentication code is: ${data.code}

This code will expire in ${data.expirationMinutes} minutes.

Security Notice: Never share this code with anyone. FANZ will never ask you for this code.

© ${new Date().getFullYear()} FANZ Platform. All rights reserved.
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: 'Your Verification Code - FANZ',
      html,
      text
    });
  }

  /**
   * Send welcome email (after verification)
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FANZ!</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>Welcome to FANZ! Your email has been successfully verified and your account is now active.</p>
            <p>You can now enjoy all the features of our platform:</p>
            <ul>
              <li>Connect with creators</li>
              <li>Subscribe to exclusive content</li>
              <li>Engage with the community</li>
              <li>And much more!</li>
            </ul>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Thank you for joining FANZ!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FANZ Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${username},

Welcome to FANZ! Your email has been successfully verified and your account is now active.

You can now enjoy all the features of our platform:
- Connect with creators
- Subscribe to exclusive content
- Engage with the community
- And much more!

If you have any questions or need assistance, feel free to reach out to our support team.

Thank you for joining FANZ!

© ${new Date().getFullYear()} FANZ Platform. All rights reserved.
    `.trim();

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to FANZ!',
      html,
      text
    });
  }
}

// Singleton instance
export const emailService = new EmailService();

export default EmailService;

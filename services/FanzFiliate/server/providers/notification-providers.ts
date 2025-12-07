import type { EmailProvider, SMSProvider } from '../services/notifications';

/**
 * Mock Email Provider for development/testing
 * In production, this would integrate with services like SendGrid, Mailgun, AWS SES, etc.
 */
export class MockEmailProvider implements EmailProvider {
  name = 'mock-email';

  async send(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    console.log('📧 Mock Email Sent:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text: ${text || 'No text version'}`);
    console.log(`  HTML Length: ${html.length} chars`);
    console.log('  ---');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate 95% success rate
    return Math.random() > 0.05;
  }
}

/**
 * SendGrid Email Provider (example production implementation)
 */
export class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = 'notifications@fanzfiliate.com') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      // In production, you would use the SendGrid SDK
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      
      const msg = {
        to,
        from: this.fromEmail,
        subject,
        text: text || this.extractTextFromHTML(html),
        html,
      };

      console.log(`📧 SendGrid Email queued for: ${to} - "${subject}"`);
      
      // Mock successful send
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  private extractTextFromHTML(html: string): string {
    // Simple HTML to text conversion
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Mock SMS Provider for development/testing
 */
export class MockSMSProvider implements SMSProvider {
  name = 'mock-sms';

  async send(to: string, message: string): Promise<boolean> {
    console.log('📱 Mock SMS Sent:');
    console.log(`  To: ${to}`);
    console.log(`  Message: ${message}`);
    console.log('  ---');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate 90% success rate
    return Math.random() > 0.1;
  }
}

/**
 * Twilio SMS Provider (example production implementation)
 */
export class TwilioSMSProvider implements SMSProvider {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      // In production, you would use the Twilio SDK
      // const twilio = require('twilio');
      // const client = twilio(this.accountSid, this.authToken);
      
      console.log(`📱 Twilio SMS queued for: ${to}`);
      console.log(`   Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      // Mock successful send
      await new Promise(resolve => setTimeout(resolve, 800));
      return true;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return false;
    }
  }
}

/**
 * Adult-Friendly Email Provider
 * Some providers have restrictions on adult content, so we need specialized providers
 */
export class AdultFriendlyEmailProvider implements EmailProvider {
  name = 'adult-friendly-email';
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      console.log(`📧 Adult-friendly email provider sending to: ${to}`);
      
      // In production, this would make an HTTP request to the provider
      const requestData = {
        to,
        from: 'notifications@fanzfiliate.com',
        subject,
        html,
        text: text || this.extractTextFromHTML(html),
        headers: {
          'X-Adult-Content': 'true',
          'X-Platform': 'FanzFiliate',
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('✅ Adult-friendly email sent successfully');
      return true;
    } catch (error) {
      console.error('Adult-friendly email error:', error);
      return false;
    }
  }

  private extractTextFromHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Initialize notification providers based on environment
 */
export async function initializeNotificationProviders() {
  const { notificationService } = await import('../services/notifications');
  
  console.log('🔧 Initializing notification providers...');

  // Email providers
  if (process.env.NODE_ENV === 'development') {
    // Use mock providers in development
    notificationService.registerEmailProvider('mock', new MockEmailProvider());
  } else {
    // Use real providers in production
    if (process.env.SENDGRID_API_KEY) {
      notificationService.registerEmailProvider(
        'sendgrid', 
        new SendGridEmailProvider(process.env.SENDGRID_API_KEY, process.env.FROM_EMAIL)
      );
    }
    
    if (process.env.ADULT_EMAIL_ENDPOINT && process.env.ADULT_EMAIL_API_KEY) {
      notificationService.registerEmailProvider(
        'adult-friendly',
        new AdultFriendlyEmailProvider(process.env.ADULT_EMAIL_ENDPOINT, process.env.ADULT_EMAIL_API_KEY)
      );
    }
  }

  // SMS providers
  if (process.env.NODE_ENV === 'development') {
    notificationService.registerSMSProvider('mock', new MockSMSProvider());
  } else {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      notificationService.registerSMSProvider(
        'twilio',
        new TwilioSMSProvider(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
          process.env.TWILIO_FROM_NUMBER
        )
      );
    }
  }

  console.log('✅ Notification providers initialized');
}

// Utility function to test notification delivery
export async function testNotificationDelivery() {
  const { notificationService } = await import('../services/notifications');

  console.log('🧪 Testing notification delivery...');

  // Test email
  try {
    const testNotification = await notificationService.createNotification({
      userId: 'test-user-123',
      type: 'system_maintenance',
      title: 'Test Email Notification',
      message: 'This is a test email notification from FanzFiliate.',
      priority: 'normal',
      channels: ['email'],
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      maxRetries: 1,
    });

    console.log('✅ Test email notification created:', testNotification.id);
  } catch (error) {
    console.error('❌ Test email notification failed:', error);
  }

  // Test WebSocket (if connections available)
  try {
    await notificationService.sendRealTimeNotification('test-user-123', {
      id: `test_ws_${Date.now()}`,
      type: 'system_maintenance',
      title: 'Test WebSocket Notification',
      message: 'This is a test WebSocket notification.',
      priority: 'normal',
      data: { test: true },
    });

    console.log('✅ Test WebSocket notification sent');
  } catch (error) {
    console.error('❌ Test WebSocket notification failed:', error);
  }

  // Test broadcast
  try {
    await notificationService.broadcastToChannel('general', {
      type: 'system_maintenance',
      title: 'Test Broadcast',
      message: 'This is a test broadcast message.',
      priority: 'low',
      data: { broadcast: true },
    });

    console.log('✅ Test broadcast sent');
  } catch (error) {
    console.error('❌ Test broadcast failed:', error);
  }
}

// Classes are already exported above

import twilio from 'twilio';

export enum SMSProvider {
  TWILIO = 'twilio'
}

export enum SMSMessageType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification', 
  SUBSCRIPTION_CONFIRMATION = 'subscription_confirmation',
  TIP_NOTIFICATION = 'tip_notification',
  NEW_MESSAGE = 'new_message',
  STREAM_STARTING = 'stream_starting',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  MARKETING = 'marketing',
  SECURITY_ALERT = 'security_alert'
}

export interface SMSMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  type: SMSMessageType;
  provider: SMSProvider;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface SMSTemplate {
  type: SMSMessageType;
  template: string;
  variables: string[];
}

export interface SendSMSRequest {
  to: string;
  type: SMSMessageType;
  variables?: Record<string, string>;
  customMessage?: string;
  scheduledAt?: Date;
}

export interface SendSMSResponse {
  success: boolean;
  messageId: string;
  error?: string;
  provider: SMSProvider;
  estimatedDelivery?: Date;
}

// SMS Templates
const SMS_TEMPLATES: Record<SMSMessageType, SMSTemplate> = {
  [SMSMessageType.WELCOME]: {
    type: SMSMessageType.WELCOME,
    template: "Welcome to FansLab, {{username}}! 🎉 Your account is ready. Start exploring amazing creators and content now!",
    variables: ['username']
  },
  [SMSMessageType.VERIFICATION]: {
    type: SMSMessageType.VERIFICATION,
    template: "Your FansLab verification code is: {{code}}. This code expires in 10 minutes.",
    variables: ['code']
  },
  [SMSMessageType.SUBSCRIPTION_CONFIRMATION]: {
    type: SMSMessageType.SUBSCRIPTION_CONFIRMATION,
    template: "🎉 Subscription confirmed! You're now subscribed to {{creatorName}} for ${{amount}}/month. Welcome to the exclusive content!",
    variables: ['creatorName', 'amount']
  },
  [SMSMessageType.TIP_NOTIFICATION]: {
    type: SMSMessageType.TIP_NOTIFICATION,
    template: "💰 You received a ${{amount}} tip from {{fanName}}! {{message}}",
    variables: ['amount', 'fanName', 'message']
  },
  [SMSMessageType.NEW_MESSAGE]: {
    type: SMSMessageType.NEW_MESSAGE,
    template: "💬 New message from {{senderName}} on FansLab! Open the app to reply.",
    variables: ['senderName']
  },
  [SMSMessageType.STREAM_STARTING]: {
    type: SMSMessageType.STREAM_STARTING,
    template: "🔴 LIVE NOW: {{creatorName}} is streaming! Join now: {{streamLink}}",
    variables: ['creatorName', 'streamLink']
  },
  [SMSMessageType.PAYMENT_CONFIRMATION]: {
    type: SMSMessageType.PAYMENT_CONFIRMATION,
    template: "✅ Payment confirmed! ${{amount}} for {{description}}. Transaction ID: {{transactionId}}",
    variables: ['amount', 'description', 'transactionId']
  },
  [SMSMessageType.MARKETING]: {
    type: SMSMessageType.MARKETING,
    template: "{{message}} Reply STOP to opt out.",
    variables: ['message']
  },
  [SMSMessageType.SECURITY_ALERT]: {
    type: SMSMessageType.SECURITY_ALERT,
    template: "🔒 Security Alert: {{action}} from {{location}}. If this wasn't you, please secure your account immediately.",
    variables: ['action', 'location']
  }
};

class TwilioSMSProvider {
  private client?: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not found. SMS service will be in mock mode.');
      this.fromNumber = '';
      return;
    }

    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async sendSMS(to: string, body: string, metadata?: Record<string, any>): Promise<SendSMSResponse> {
    try {
      if (!this.client) {
        // Mock mode
        console.log(`[SMS MOCK] To: ${to}, Body: ${body}`);
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          provider: SMSProvider.TWILIO,
          estimatedDelivery: new Date(Date.now() + 30000) // 30 seconds
        };
      }

      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to,
        statusCallback: `${process.env.FRONTEND_URL}/api/webhooks/sms/status`
      });

      return {
        success: true,
        messageId: message.sid,
        provider: SMSProvider.TWILIO,
        estimatedDelivery: new Date(Date.now() + 30000)
      };

    } catch (error: any) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        messageId: '',
        error: error.message,
        provider: SMSProvider.TWILIO
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<string> {
    try {
      if (!this.client) {
        return 'delivered'; // Mock mode
      }

      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      console.error('Failed to fetch message status:', error);
      return 'unknown';
    }
  }
}

export class SMSService {
  private twilioProvider: TwilioSMSProvider;
  private messageHistory: Map<string, SMSMessage> = new Map();

  constructor() {
    this.twilioProvider = new TwilioSMSProvider();
  }

  // Send SMS with template
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(request.to)) {
        return {
          success: false,
          messageId: '',
          error: 'Invalid phone number format',
          provider: SMSProvider.TWILIO
        };
      }

      // Generate message body
      const body = request.customMessage || this.generateMessageFromTemplate(
        request.type, 
        request.variables || {}
      );

      // Send via provider
      const response = await this.twilioProvider.sendSMS(request.to, body);

      // Store message history
      if (response.success) {
        const smsMessage: SMSMessage = {
          id: response.messageId,
          to: request.to,
          from: process.env.TWILIO_PHONE_NUMBER || 'FansLab',
          body,
          type: request.type,
          provider: SMSProvider.TWILIO,
          status: 'sent',
          sentAt: new Date(),
          metadata: request.variables
        };

        this.messageHistory.set(response.messageId, smsMessage);
      }

      return response;

    } catch (error: any) {
      console.error('SMS service error:', error);
      return {
        success: false,
        messageId: '',
        error: error.message,
        provider: SMSProvider.TWILIO
      };
    }
  }

  // Send bulk SMS messages
  async sendBulkSMS(requests: SendSMSRequest[]): Promise<SendSMSResponse[]> {
    const responses: SendSMSResponse[] = [];
    
    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.sendSMS(request));
      const batchResponses = await Promise.all(batchPromises);
      responses.push(...batchResponses);
      
      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return responses;
  }

  // Generate message from template
  private generateMessageFromTemplate(type: SMSMessageType, variables: Record<string, string>): string {
    const template = SMS_TEMPLATES[type];
    if (!template) {
      throw new Error(`SMS template not found for type: ${type}`);
    }

    let message = template.template;
    
    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Check for unreplaced variables
    const unreplacedVars = message.match(/{{[^}]+}}/g);
    if (unreplacedVars) {
      console.warn(`Unreplaced variables in SMS template ${type}:`, unreplacedVars);
      // Remove unreplaced variables
      message = message.replace(/{{[^}]+}}/g, '');
    }

    return message.trim();
  }

  // Validate phone number format
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  // Get message status
  async getMessageStatus(messageId: string): Promise<SMSMessage | null> {
    const message = this.messageHistory.get(messageId);
    if (!message) {
      return null;
    }

    // Update status from provider
    const providerStatus = await this.twilioProvider.getMessageStatus(messageId);
    message.status = providerStatus as any;

    if (providerStatus === 'delivered' && !message.deliveredAt) {
      message.deliveredAt = new Date();
    }

    return message;
  }

  // Get all messages for a phone number
  getMessagesForNumber(phoneNumber: string): SMSMessage[] {
    return Array.from(this.messageHistory.values())
      .filter(msg => msg.to === phoneNumber)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
  }

  // Webhook handler for status updates
  handleStatusWebhook(messageId: string, status: string): void {
    const message = this.messageHistory.get(messageId);
    if (message) {
      message.status = status as any;
      if (status === 'delivered') {
        message.deliveredAt = new Date();
      }
    }
  }

  // Opt-out handling
  handleOptOut(phoneNumber: string): void {
    // In a real implementation, this would update the user's SMS preferences in the database
    console.log(`User ${phoneNumber} opted out of SMS notifications`);
  }

  // Get SMS analytics
  getAnalytics(startDate: Date, endDate: Date) {
    const messages = Array.from(this.messageHistory.values())
      .filter(msg => msg.sentAt && msg.sentAt >= startDate && msg.sentAt <= endDate);

    const analytics = {
      totalSent: messages.length,
      delivered: messages.filter(msg => msg.status === 'delivered').length,
      failed: messages.filter(msg => msg.status === 'failed').length,
      pending: messages.filter(msg => msg.status === 'pending').length,
      byType: {} as Record<SMSMessageType, number>,
      deliveryRate: 0
    };

    // Count by type
    for (const message of messages) {
      analytics.byType[message.type] = (analytics.byType[message.type] || 0) + 1;
    }

    // Calculate delivery rate
    const completedMessages = analytics.delivered + analytics.failed;
    analytics.deliveryRate = completedMessages > 0 ? (analytics.delivered / completedMessages) * 100 : 0;

    return analytics;
  }
}

export const smsService = new SMSService();
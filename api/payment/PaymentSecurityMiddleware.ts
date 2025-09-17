// 💳 FANZ Payment API Security Middleware
// PCI-DSS compliant payment processing with adult platform support

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

interface SecurePaymentRequest extends Request {
  paymentContext?: {
    processorId: string;
    transactionId: string;
    encrypted: boolean;
    ipAddress: string;
    userAgent: string;
    platform: string;
  };
}

interface PaymentProcessor {
  id: string;
  name: string;
  adultFriendly: boolean;
  encryptionKey: string;
  webhookSecret: string;
  testMode: boolean;
  supportedCurrencies: string[];
  complianceLevel: 'PCI-DSS' | 'SOX' | 'GDPR';
}

class FanzPaymentSecurityMiddleware {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes

  // Adult-friendly payment processors
  private readonly processors: Map<string, PaymentProcessor> = new Map([
    ['ccbill', {
      id: 'ccbill',
      name: 'CCBill',
      adultFriendly: true,
      encryptionKey: process.env.CCBILL_ENCRYPTION_KEY || '',
      webhookSecret: process.env.CCBILL_WEBHOOK_SECRET || '',
      testMode: process.env.NODE_ENV !== 'production',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      complianceLevel: 'PCI-DSS'
    }],
    
    ['paxum', {
      id: 'paxum',
      name: 'Paxum',
      adultFriendly: true,
      encryptionKey: process.env.PAXUM_ENCRYPTION_KEY || '',
      webhookSecret: process.env.PAXUM_WEBHOOK_SECRET || '',
      testMode: process.env.NODE_ENV !== 'production',
      supportedCurrencies: ['USD', 'EUR'],
      complianceLevel: 'PCI-DSS'
    }],
    
    ['segpay', {
      id: 'segpay',
      name: 'Segpay',
      adultFriendly: true,
      encryptionKey: process.env.SEGPAY_ENCRYPTION_KEY || '',
      webhookSecret: process.env.SEGPAY_WEBHOOK_SECRET || '',
      testMode: process.env.NODE_ENV !== 'production',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      complianceLevel: 'PCI-DSS'
    }]
  ]);

  // Strict rate limiting for payment endpoints
  public readonly paymentRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Very conservative limit
    message: {
      error: 'Payment Rate Limit Exceeded',
      message: 'Too many payment requests. Enhanced security measures active.',
      retryAfter: '1 hour',
      support: 'Contact support if you need assistance with payments.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use combination of IP and user ID for rate limiting
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      return `payment:${ip}:${userId}`;
    }
  });

  // Payment data encryption
  public encryptPaymentData = (data: any, processorId: string): string => {
    const processor = this.processors.get(processorId);
    if (!processor || !processor.encryptionKey) {
      throw new Error(`Invalid processor or missing encryption key: ${processorId}`);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, processor.encryptionKey);
    cipher.setAAD(Buffer.from(processorId));

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  };

  // Payment data decryption
  public decryptPaymentData = (encryptedData: string, processorId: string): any => {
    const processor = this.processors.get(processorId);
    if (!processor || !processor.encryptionKey) {
      throw new Error(`Invalid processor or missing encryption key: ${processorId}`);
    }

    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.slice(0, 16);
    const authTag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);

    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, processor.encryptionKey);
    decipher.setAAD(Buffer.from(processorId));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  };

  // Validate payment processor
  public validateProcessor = (
    req: SecurePaymentRequest, 
    res: Response, 
    next: NextFunction
  ): void => {
    const processorId = req.headers['x-payment-processor'] as string || req.body?.processor;
    
    if (!processorId) {
      res.status(400).json({
        error: 'Missing Payment Processor',
        message: 'Payment processor must be specified',
        code: 'PROCESSOR_REQUIRED'
      });
      return;
    }

    const processor = this.processors.get(processorId.toLowerCase());
    if (!processor) {
      res.status(400).json({
        error: 'Invalid Payment Processor',
        message: 'Specified payment processor is not supported',
        code: 'INVALID_PROCESSOR',
        supportedProcessors: Array.from(this.processors.keys())
      });
      return;
    }

    // Adult content platform validation
    const platform = req.headers['x-platform'] as string;
    const adultPlatforms = ['boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'];
    
    if (platform && adultPlatforms.includes(platform.toLowerCase())) {
      if (!processor.adultFriendly) {
        res.status(400).json({
          error: 'Processor Not Adult-Friendly',
          message: 'Selected processor does not support adult content payments',
          code: 'ADULT_CONTENT_NOT_SUPPORTED'
        });
        return;
      }
    }

    // Attach payment context to request
    req.paymentContext = {
      processorId: processor.id,
      transactionId: crypto.randomUUID(),
      encrypted: false,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      platform: platform || 'fanz'
    };

    next();
  };

  // Encrypt payment request data
  public encryptPaymentRequest = (
    req: SecurePaymentRequest, 
    res: Response, 
    next: NextFunction
  ): void => {
    if (!req.paymentContext) {
      res.status(500).json({
        error: 'Payment Context Missing',
        message: 'Payment processor validation must be completed first',
        code: 'MISSING_PAYMENT_CONTEXT'
      });
      return;
    }

    try {
      // Encrypt sensitive payment data
      if (req.body && typeof req.body === 'object') {
        const sensitiveFields = ['cardNumber', 'cvv', 'expiryDate', 'accountNumber', 'routingNumber'];
        const sensitiveData: any = {};
        
        for (const field of sensitiveFields) {
          if (req.body[field]) {
            sensitiveData[field] = req.body[field];
            delete req.body[field]; // Remove from original body
          }
        }

        // Encrypt sensitive data if present
        if (Object.keys(sensitiveData).length > 0) {
          req.body.encryptedPaymentData = this.encryptPaymentData(sensitiveData, req.paymentContext.processorId);
          req.paymentContext.encrypted = true;
        }
      }

      next();

    } catch (error) {
      console.error('Payment encryption error:', error);
      res.status(500).json({
        error: 'Payment Encryption Error',
        message: 'Failed to encrypt payment data',
        code: 'ENCRYPTION_ERROR'
      });
    }
  };

  // Validate webhook signatures
  public validateWebhook = (processorId: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const processor = this.processors.get(processorId);
      if (!processor) {
        res.status(400).json({
          error: 'Invalid Processor',
          message: 'Webhook processor not recognized'
        });
        return;
      }

      const signature = req.headers['x-webhook-signature'] as string;
      const timestamp = req.headers['x-webhook-timestamp'] as string;
      
      if (!signature || !timestamp) {
        res.status(401).json({
          error: 'Missing Webhook Authentication',
          message: 'Webhook signature and timestamp required'
        });
        return;
      }

      // Check timestamp tolerance
      const webhookTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (Math.abs(currentTime - webhookTime) > this.WEBHOOK_TOLERANCE_SECONDS) {
        res.status(401).json({
          error: 'Webhook Timestamp Error',
          message: 'Webhook timestamp is outside acceptable tolerance'
        });
        return;
      }

      // Verify signature
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', processor.webhookSecret)
        .update(timestamp + payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )) {
        res.status(401).json({
          error: 'Invalid Webhook Signature',
          message: 'Webhook signature verification failed'
        });
        return;
      }

      next();
    };
  };

  // PCI-DSS compliance validation
  public validatePCICompliance = (
    req: SecurePaymentRequest, 
    res: Response, 
    next: NextFunction
  ): void => {
    // Check for direct card data in request (PCI-DSS violation)
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    
    // Patterns that indicate PCI data
    const pciPatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
      /\b\d{3,4}\b.*cvv/i, // CVV pattern
      /\btrack[12]\b/i, // Magnetic stripe data
      /\b\d{4}\/\d{2}\b/, // Expiry date pattern
    ];

    for (const pattern of pciPatterns) {
      if (pattern.test(body) || pattern.test(query)) {
        console.error(`PCI Compliance Violation: Direct card data detected in request to ${req.path}`);
        
        res.status(400).json({
          error: 'PCI Compliance Violation',
          message: 'Direct payment card data is not allowed. Use tokenization.',
          code: 'PCI_VIOLATION'
        });
        return;
      }
    }

    // Validate HTTPS
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      res.status(400).json({
        error: 'HTTPS Required',
        message: 'Payment endpoints require HTTPS connection',
        code: 'HTTPS_REQUIRED'
      });
      return;
    }

    next();
  };

  // Payment audit logging
  public auditPaymentRequest = (
    req: SecurePaymentRequest, 
    res: Response, 
    next: NextFunction
  ): void => {
    const auditData = {
      timestamp: new Date().toISOString(),
      transactionId: req.paymentContext?.transactionId,
      processorId: req.paymentContext?.processorId,
      userId: (req as any).user?.id,
      endpoint: req.path,
      method: req.method,
      ipAddress: req.paymentContext?.ipAddress,
      userAgent: req.paymentContext?.userAgent,
      platform: req.paymentContext?.platform,
      encrypted: req.paymentContext?.encrypted,
      amount: req.body?.amount,
      currency: req.body?.currency
    };

    // Log to secure payment audit system
    console.log('Payment Audit:', JSON.stringify(auditData));

    // In production, send to secure logging service
    // await securePaymentLogger.log(auditData);

    next();
  };

  // Get supported processors for platform
  public getSupportedProcessors(platform?: string): PaymentProcessor[] {
    const adultPlatforms = ['boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'];
    
    return Array.from(this.processors.values()).filter(processor => {
      if (platform && adultPlatforms.includes(platform.toLowerCase())) {
        return processor.adultFriendly;
      }
      return true;
    });
  }
}

export { FanzPaymentSecurityMiddleware, SecurePaymentRequest, PaymentProcessor };
export default new FanzPaymentSecurityMiddleware();

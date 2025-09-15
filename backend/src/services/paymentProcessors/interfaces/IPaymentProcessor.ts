export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'crypto' | 'digital_wallet';
  details: Record<string, any>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  idempotencyKey?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  processorTransactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  currency?: string;
  processingFee?: number;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  processorResponse?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  processorTransactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  processorRefundId?: string;
  amount?: number;
  currency?: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: Record<string, any>;
}

export interface PayoutRequest {
  amount: number;
  currency: string;
  destination: {
    type: 'bank_account' | 'paypal' | 'crypto' | 'check';
    details: Record<string, any>;
  };
  description?: string;
  metadata?: Record<string, any>;
}

export interface PayoutResponse {
  success: boolean;
  payoutId?: string;
  processorPayoutId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  currency?: string;
  processingFee?: number;
  estimatedArrival?: Date;
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

export interface IPaymentProcessor {
  // Processor identification
  getName(): string;
  getVersion(): string;
  
  // Payment processing
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  
  // Refunds
  processRefund(request: RefundRequest): Promise<RefundResponse>;
  
  // Payouts (if supported)
  processPayout?(request: PayoutRequest): Promise<PayoutResponse>;
  
  // Transaction status
  getTransactionStatus(processorTransactionId: string): Promise<PaymentResponse>;
  
  // Webhook handling
  verifyWebhookSignature?(payload: string, signature: string): boolean;
  parseWebhookEvent?(payload: string): WebhookEvent;
  
  // Health check
  healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }>;
  
  // Supported features
  getSupportedFeatures(): {
    payouts: boolean;
    refunds: boolean;
    webhooks: boolean;
    recurringPayments: boolean;
    multiCurrency: boolean;
    cryptoPayments: boolean;
  };
  
  // Supported payment methods
  getSupportedPaymentMethods(): string[];
  
  // Fee calculation
  calculateFees?(amount: number, currency: string, paymentMethod: string): {
    processingFee: number;
    platformFee?: number;
  };
}
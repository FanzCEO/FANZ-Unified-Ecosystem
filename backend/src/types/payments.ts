// 💳 FANZ Backend - Payment Types and Interfaces
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentProcessorType {
  MOCK = 'mock',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SEGPAY = 'segpay',
  CCBILL = 'ccbill',
  SQUARE = 'square'
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: ProcessorResponse;
  redirectUrl?: string;
  requiresAction?: boolean;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  status: RefundStatus;
  amount?: number;
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: ProcessorResponse;
}

export interface PayoutRequest {
  amount: number;
  currency: string;
  recipientId: string;
  description?: string;
  metadata?: Record<string, any>;
  payoutMethodId?: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId: string;
  status: PayoutStatus;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: ProcessorResponse;
  estimatedArrival?: string;
}

export interface ProcessorResponse {
  code: string;
  message: string;
  transactionId?: string;
  refundId?: string;
  payoutId?: string;
  amount?: number;
  currency?: string;
  processorTransactionId?: string;
  processorFee?: number;
  exchangeRate?: number;
  metadata?: Record<string, any>;
}

export interface WebhookData {
  type: string;
  id?: string;
  data: Record<string, any>;
  timestamp?: string;
  signature?: string;
}

export interface PaymentProcessor {
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  refundPayment(request: RefundRequest): Promise<RefundResponse>;
  processPayout(request: PayoutRequest): Promise<PayoutResponse>;
  handleWebhook(data: WebhookData): Promise<boolean>;
  validateWebhookSignature?(data: any, signature: string, secret: string): boolean;
  getProcessorType?(): PaymentProcessorType;
  isHealthy?(): Promise<boolean>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wallet' | 'crypto';
  customerId: string;
  isDefault: boolean;
  details: PaymentMethodDetails;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodDetails {
  // Credit/Debit Card
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  
  // Bank Account
  accountType?: 'checking' | 'savings';
  bankName?: string;
  routingNumber?: string;
  
  // Digital Wallet
  walletProvider?: 'paypal' | 'apple_pay' | 'google_pay';
  walletEmail?: string;
  
  // Cryptocurrency
  cryptoType?: 'bitcoin' | 'ethereum' | 'usdc';
  walletAddress?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'adjustment';
  status: PaymentStatus;
  amount: number;
  currency: string;
  customerId?: string;
  recipientId?: string;
  vendorId?: string;
  processorType: PaymentProcessorType;
  processorTransactionId?: string;
  description?: string;
  metadata?: Record<string, any>;
  fees?: TransactionFee[];
  parentTransactionId?: string; // For refunds
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  errorCode?: string;
  processorResponse?: ProcessorResponse;
}

export interface TransactionFee {
  type: 'processing' | 'platform' | 'currency_conversion';
  amount: number;
  currency: string;
  percentage?: number;
  flatFee?: number;
  description?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  clientSecret?: string;
  nextAction?: PaymentIntentNextAction;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentNextAction {
  type: 'redirect_to_url' | 'use_stripe_sdk' | 'display_bank_transfer_instructions';
  redirectToUrl?: {
    url: string;
    returnUrl?: string;
  };
  displayBankTransferInstructions?: {
    amount: number;
    currency: string;
    accountNumber: string;
    routingNumber: string;
    reference: string;
  };
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  customerId: string;
  available: number;
  pending: number;
  reserved: number;
  currency: string;
  lastUpdated: string;
}

export interface PaymentConfiguration {
  processorType: PaymentProcessorType;
  isEnabled: boolean;
  priority: number;
  configuration: Record<string, any>;
  supportedCurrencies: string[];
  supportedCountries: string[];
  minAmount?: number;
  maxAmount?: number;
  processingFees?: {
    percentage: number;
    flatFee: number;
    currency: string;
  };
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  processorType: PaymentProcessorType;
  data: Record<string, any>;
  processed: boolean;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeographicPaymentRouting {
  country: string;
  region?: string;
  preferredProcessors: PaymentProcessorType[];
  fallbackProcessors: PaymentProcessorType[];
  restrictions?: {
    minAmount?: number;
    maxAmount?: number;
    blockedPaymentMethods?: string[];
  };
}

export interface RiskAssessment {
  transactionId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  factors: RiskFactor[];
  action: 'approve' | 'review' | 'decline';
  reviewRequired: boolean;
  createdAt: string;
}

export interface RiskFactor {
  type: 'velocity' | 'amount' | 'location' | 'device' | 'behavioral' | 'external';
  severity: 'low' | 'medium' | 'high';
  description: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface PaymentAnalytics {
  period: {
    start: string;
    end: string;
  };
  totalVolume: number;
  totalTransactions: number;
  averageTransactionAmount: number;
  successRate: number;
  declineRate: number;
  refundRate: number;
  chargebackRate: number;
  processorBreakdown: {
    [processor: string]: {
      volume: number;
      transactions: number;
      successRate: number;
      averageProcessingTime: number;
    };
  };
  currencyBreakdown: {
    [currency: string]: {
      volume: number;
      transactions: number;
    };
  };
  geographicBreakdown: {
    [country: string]: {
      volume: number;
      transactions: number;
    };
  };
}

export interface PaymentError extends Error {
  code: string;
  type: 'validation' | 'processor' | 'network' | 'security' | 'configuration';
  processorError?: any;
  transactionId?: string;
  retryable: boolean;
  metadata?: Record<string, any>;
}

export interface ProcessorHealthCheck {
  processorType: PaymentProcessorType;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: string;
  errorRate: number;
  uptime: number;
  metadata?: Record<string, any>;
}
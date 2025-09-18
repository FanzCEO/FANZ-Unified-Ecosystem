// Re-export all types from the main payment types file for backward compatibility
export * from '../../../types/payments';

// Additional types specific to payment services
export interface ProcessorHealthCheck {
  healthy: boolean;
  message?: string;
  details?: Record<string, any>;
  processor: string;
  responseTime: number;
}

export interface ComplianceResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    requiresManualReview: boolean;
    score: number;
  };
}

export interface RoutingDecision {
  primaryProcessor: string;
  secondaryProcessor?: string;
  confidence: number;
  reason: string;
}

export interface PaymentServiceConfig {
  processors: {
    mock?: boolean;
    ccbill?: {
      clientAccnum: string;
      clientSubacc: string;
      flexId: string;
      salt: string;
      apiUsername: string;
      apiPassword: string;
      environment: 'sandbox' | 'production';
    };
    segpay?: {
      packageId: string;
      billerId: string;
      username: string;
      password: string;
      environment: 'sandbox' | 'production';
    };
    paxum?: {
      apiKey: string;
      apiSecret: string;
      companyId: string;
      environment: 'sandbox' | 'production';
    };
  };
  compliance: {
    enabled: boolean;
    riskThreshold: number;
    manualReviewThreshold: number;
  };
  routing: {
    enabled: boolean;
    fallbackProcessor: string;
    regionBasedRouting: boolean;
  };
}
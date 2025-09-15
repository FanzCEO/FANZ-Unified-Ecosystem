# FANZ Payment Processors Integration Guide

This guide covers the integration of adult-friendly payment processors for the FANZ ecosystem, based on industry best practices and compliance requirements.

## Table of Contents

1. [Overview](#overview)
2. [Adult-Friendly Processors](#adult-friendly-processors)
3. [Primary Recommendations](#primary-recommendations)
4. [Implementation Strategy](#implementation-strategy)
5. [Configuration Guide](#configuration-guide)
6. [Testing and Validation](#testing-and-validation)
7. [Compliance Considerations](#compliance-considerations)
8. [Troubleshooting](#troubleshooting)

## Overview

The FANZ platform requires specialized payment processing solutions that support adult content and creator economy platforms. Traditional processors like Stripe and PayPal explicitly prohibit adult content, making industry-specific processors essential.

### Key Requirements

- **Adult Content Acceptance**: Processors must explicitly support adult/creator content
- **Subscription Billing**: Recurring payment capabilities for creator subscriptions
- **Global Coverage**: Support for international creators and fans
- **Compliance Tools**: Built-in risk management and chargeback protection
- **Creator Payouts**: Efficient payout systems for creator earnings

## Adult-Friendly Processors

### Primary Payment Processors

#### 1. CCBill (Recommended Primary)
- **Best For**: High-volume subscription billing, global adult content
- **Features**: Strong risk management, recurring billing, multi-currency
- **Fees**: ~10.9% + $0.15 (varies by volume)
- **Integration**: FlexForms API, webhook support
- **Compliance**: 2257 compliance tools, age verification

```typescript
// CCBill Integration Example
const ccbill = new CCBillProcessor({
  clientAccnum: process.env.CCBILL_CLIENT_ACCNUM,
  clientSubacc: process.env.CCBILL_CLIENT_SUBACC,
  flexId: process.env.CCBILL_FLEX_ID,
  salt: process.env.CCBILL_SALT,
  environment: 'sandbox'
});
```

#### 2. Segpay (Recommended Secondary)
- **Best For**: Adult/dating specialist, chargeback protection
- **Features**: Global acquiring, specialized risk tools
- **Fees**: ~12-15% (adult content rates)
- **Integration**: REST API, webhook notifications
- **Strengths**: European coverage, adult-focused compliance

#### 3. Epoch
- **Best For**: Long-term subscription billing, IPSP services
- **Features**: Multi-currency, recurring billing optimization
- **Fees**: ~10-12% (volume-dependent)
- **Integration**: API and hosted payment pages
- **Strengths**: Established adult billing platform

### Payout Processors

#### 1. Paxum (Industry Standard)
- **Best For**: Creator payouts, adult industry standard
- **Features**: E-wallet, bank transfers, prepaid cards
- **Fees**: $0.50 - $45 (method-dependent)
- **Coverage**: Global, adult-friendly
- **Awards**: XBIZ "Alternative Payment" winner

```typescript
// Paxum Integration Example
const paxum = new PaxumPayoutProcessor({
  apiKey: process.env.PAXUM_API_KEY,
  apiSecret: process.env.PAXUM_API_SECRET,
  companyId: process.env.PAXUM_COMPANY_ID,
  environment: 'sandbox'
});
```

#### 2. ePayService
- **Best For**: Multi-rail payouts, international creators
- **Features**: Bank transfers, debit cards, local payments
- **Fees**: 1% + fixed fees
- **Coverage**: Global, especially strong in Eastern Europe

### Crypto Payment Processors

#### 1. NOWPayments
- **Best For**: Crypto payments, adult-explicit support
- **Features**: Anonymous options, on/off-ramp support
- **Currencies**: 300+ cryptocurrencies
- **Fees**: 0.5% - 1%

#### 2. CoinsPaid (CryptoProcessing)
- **Best For**: Enterprise crypto acquiring
- **Features**: Adult-compatible programs, settlement options
- **Integration**: REST API, webhook support

## Primary Recommendations

### Recommended Stack for FANZ

```yaml
Payment Processing:
  Primary: CCBill (subscriptions, tips, content)
  Secondary: Segpay (EU routing, backup)
  Crypto: NOWPayments (crypto tips/subs)

Creator Payouts:
  Primary: Paxum (e-wallet, wires)
  Secondary: ePayService (backup, regional)
  
Bank Transfers:
  ACH: NETbilling (via CCBill integration)
  SEPA: Verotel (EU creators)
  Wires: Paxum (international)

High-Risk Support:
  ISO: Corepay (merchant placement)
  Backup: PayKings (alternative programs)
```

### Geographic Routing Strategy

```typescript
// Example routing logic
const getProcessorByRegion = (userCountry: string, amount: number) => {
  switch (userCountry) {
    case 'US':
    case 'CA':
      return amount > 100 ? 'ccbill' : 'segpay';
    
    case 'DE':
    case 'FR':
    case 'UK':
      return 'segpay'; // Strong EU presence
    
    case 'JP':
    case 'AU':
      return 'ccbill'; // Better APAC coverage
    
    default:
      return 'ccbill'; // Default to CCBill
  }
};
```

## Implementation Strategy

### Multi-Processor Architecture

The FanzFinance OS implements a factory pattern supporting multiple processors:

```typescript
// Processor Selection Logic
export class PaymentService {
  async processPayment(request: PaymentRequest) {
    // Route based on transaction type and user location
    const processor = this.selectProcessor(request);
    
    try {
      return await processor.processPayment(request);
    } catch (error) {
      // Fallback to secondary processor
      const fallback = this.getFallbackProcessor(request);
      return await fallback.processPayment(request);
    }
  }

  private selectProcessor(request: PaymentRequest): IPaymentProcessor {
    const { transactionType, amount, userCountry } = request;
    
    if (transactionType === 'subscription' && amount > 50) {
      return PaymentProcessorFactory.getProcessor('ccbill');
    }
    
    if (userCountry && ['DE', 'FR', 'UK'].includes(userCountry)) {
      return PaymentProcessorFactory.getProcessor('segpay');
    }
    
    return PaymentProcessorFactory.getDefaultProcessor();
  }
}
```

### Failover and Redundancy

```typescript
// Cascading processor fallback
const processorPriority = [
  'ccbill',    // Primary
  'segpay',    // Secondary
  'epoch',     // Tertiary
  'mock'       // Testing
];

for (const processorType of processorPriority) {
  try {
    const processor = PaymentProcessorFactory.getProcessor(processorType);
    const result = await processor.processPayment(request);
    
    if (result.success) {
      return result;
    }
  } catch (error) {
    logger.warn(`Processor ${processorType} failed, trying next...`);
    continue;
  }
}
```

## Configuration Guide

### Environment Variables

```bash
# CCBill Configuration
CCBILL_CLIENT_ACCNUM=123456        # Your CCBill account number
CCBILL_CLIENT_SUBACC=0000          # Subaccount for routing
CCBILL_FLEX_ID=your-flex-form-id   # FlexForms identifier
CCBILL_SALT=your-security-salt     # Security hash salt
CCBILL_API_USERNAME=api_user       # API credentials
CCBILL_API_PASSWORD=api_pass       # API credentials
CCBILL_ENVIRONMENT=sandbox         # sandbox | production

# Paxum Configuration
PAXUM_API_KEY=your-api-key         # Paxum API key
PAXUM_API_SECRET=your-api-secret   # API secret for signatures
PAXUM_COMPANY_ID=your-company-id   # Company identifier
PAXUM_ENVIRONMENT=sandbox          # sandbox | production

# Segpay Configuration
SEGPAY_PACKAGE_ID=your-package-id  # Package identifier
SEGPAY_BILLERID=your-biller-id     # Biller account
SEGPAY_USERNAME=your-username      # API username
SEGPAY_PASSWORD=your-password      # API password
SEGPAY_ENVIRONMENT=sandbox         # sandbox | production
```

### Processor-Specific Setup

#### CCBill Setup
1. **Account Setup**
   - Apply for CCBill merchant account
   - Provide business documentation and content samples
   - Complete compliance questionnaire

2. **Technical Integration**
   - Configure FlexForms for payment processing
   - Set up webhooks for transaction notifications
   - Implement security hash verification

3. **Testing**
   - Use sandbox environment for initial testing
   - Test various card types and scenarios
   - Verify webhook handling

#### Paxum Setup
1. **Business Account**
   - Register for Paxum business account
   - Complete verification process
   - Set up API credentials

2. **Integration**
   - Configure payout methods and limits
   - Set up webhook endpoints for status updates
   - Test recipient validation

### Database Configuration

```sql
-- Add processor-specific transaction metadata
ALTER TABLE transactions ADD COLUMN processor_name VARCHAR(50);
ALTER TABLE transactions ADD COLUMN processor_fees JSONB;
ALTER TABLE transactions ADD COLUMN processor_metadata JSONB;

-- Add payout processor tracking
ALTER TABLE payouts ADD COLUMN processor_name VARCHAR(50);
ALTER TABLE payouts ADD COLUMN processor_fees JSONB;

-- Create processor health tracking
CREATE TABLE processor_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processor_name VARCHAR(50) NOT NULL,
  is_healthy BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing and Validation

### Test Scenarios

```typescript
// Comprehensive test suite for adult-friendly processors
describe('Adult-Friendly Payment Processors', () => {
  describe('CCBill Integration', () => {
    it('should process subscription payments', async () => {
      const request: PaymentRequest = {
        amount: 29.99,
        currency: 'USD',
        transactionType: 'subscription',
        paymentMethod: {
          id: 'test-card',
          type: 'credit_card',
          details: { token: 'test_token' }
        }
      };

      const result = await ccbillProcessor.processPayment(request);
      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.metadata?.paymentUrl).toBeDefined();
    });

    it('should handle webhook verification', () => {
      const payload = JSON.stringify({ eventType: 'NewSaleSuccess' });
      const signature = generateTestSignature(payload);
      
      const isValid = ccbillProcessor.verifyWebhookSignature(payload, signature);
      expect(isValid).toBe(true);
    });
  });

  describe('Paxum Payouts', () => {
    it('should process creator payouts', async () => {
      const request: PayoutRequest = {
        amount: 250.00,
        currency: 'USD',
        destination: {
          type: 'paxum_ewallet',
          details: {
            email: 'creator@example.com',
            name: 'Test Creator'
          }
        }
      };

      const result = await paxumProcessor.processPayout(request);
      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
    });
  });
});
```

### Validation Checklist

- [ ] **Payment Processing**
  - [ ] Credit card payments work
  - [ ] Subscription billing cycles correctly
  - [ ] Recurring payments process automatically
  - [ ] Failed payments handled gracefully

- [ ] **Webhook Handling**
  - [ ] Webhook signatures verify correctly
  - [ ] Payment status updates process
  - [ ] Subscription lifecycle events handled
  - [ ] Failed webhook retries work

- [ ] **Payout Processing**
  - [ ] Creator payouts initiate correctly
  - [ ] Payout status tracking works
  - [ ] Fee calculations are accurate
  - [ ] Multiple payout methods supported

- [ ] **Compliance**
  - [ ] Age verification integrated
  - [ ] 2257 compliance tools configured
  - [ ] Risk management rules active
  - [ ] Chargeback protection enabled

## Compliance Considerations

### Adult Content Compliance

1. **Age Verification**
   ```typescript
   // Implement age verification before payment
   const verifyAge = async (user: User, request: PaymentRequest) => {
     if (request.contentType === 'adult') {
       const ageVerified = await ageVerificationService.verify(user);
       if (!ageVerified) {
         throw new Error('Age verification required');
       }
     }
   };
   ```

2. **2257 Compliance**
   - Maintain performer age verification records
   - Implement content labeling systems
   - Provide compliance reporting tools

3. **Risk Management**
   ```typescript
   // Implement chargeback prevention
   const riskAssessment = {
     maxTransactionAmount: 500,
     dailyLimit: 2000,
     velocityChecks: true,
     geoBlocking: ['high-risk-countries'],
     deviceFingerprinting: true
   };
   ```

### Data Protection

- **PCI DSS Compliance**: Never store card data directly
- **GDPR Compliance**: Handle EU user data appropriately
- **Privacy Protection**: Implement data anonymization

### Financial Reporting

```sql
-- Compliance reporting queries
SELECT 
  DATE_TRUNC('month', created_at) as month,
  processor_name,
  COUNT(*) as transaction_count,
  SUM(amount) as total_volume,
  SUM(fee_amount) as total_fees,
  AVG(amount) as avg_transaction
FROM transactions
WHERE transaction_type IN ('subscription', 'tip', 'content_purchase')
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), processor_name
ORDER BY month DESC, processor_name;
```

## Troubleshooting

### Common Issues

#### 1. Payment Processor Rejection
**Symptoms**: Transactions failing with "merchant account not approved"
**Solutions**:
- Verify account setup and approval status
- Check content compliance with processor AUP
- Contact processor support for account review

#### 2. High Chargeback Rates
**Symptoms**: Increased chargebacks, processor warnings
**Solutions**:
- Implement stronger age verification
- Improve customer service response times
- Add clear billing descriptors
- Use 3D Secure authentication

#### 3. Payout Delays
**Symptoms**: Creator payouts taking longer than expected
**Solutions**:
- Verify recipient account information
- Check processor payout schedules
- Implement payout status tracking
- Set up proactive creator communication

### Monitoring and Alerts

```typescript
// Processor health monitoring
const monitorProcessorHealth = async () => {
  const processors = ['ccbill', 'paxum', 'segpay'];
  
  for (const processor of processors) {
    try {
      const processorInstance = PaymentProcessorFactory.getProcessor(processor);
      const health = await processorInstance.healthCheck();
      
      if (!health.healthy) {
        await sendAlert({
          type: 'processor_unhealthy',
          processor,
          message: health.message,
          severity: 'high'
        });
      }
    } catch (error) {
      await sendAlert({
        type: 'processor_error',
        processor,
        error: error.message,
        severity: 'critical'
      });
    }
  }
};
```

### Performance Optimization

```typescript
// Processor response time monitoring
const trackProcessorPerformance = (processor: string, startTime: number) => {
  const responseTime = Date.now() - startTime;
  
  metrics.histogram('processor_response_time', responseTime, {
    processor,
    threshold_exceeded: responseTime > 5000
  });
  
  if (responseTime > 10000) {
    logger.warn(`Slow processor response: ${processor} took ${responseTime}ms`);
  }
};
```

## Support and Resources

### Processor Documentation
- **CCBill**: [CCBill API Documentation](https://ccbill.com/doc)
- **Paxum**: [Paxum Developer Portal](https://developer.paxum.com)
- **Segpay**: [Segpay Integration Guide](https://segpay.com/developers)

### Industry Resources
- **Adult Payment Processing**: Trade publications and forums
- **Compliance**: Legal counsel specializing in adult content
- **Risk Management**: Adult industry merchant advisors

### FANZ Support
- **Technical Issues**: Contact development team
- **Processor Setup**: Business operations team
- **Compliance**: Legal and compliance team

---

This guide provides comprehensive coverage of adult-friendly payment processing for the FANZ ecosystem. Regular updates will be made as new processors become available or requirements change.
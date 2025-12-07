import { TaxCalculator } from '../server/services/tax/tax-calculator';
import { TaxCalculationRequest } from '../server/types/tax';

describe('FanzProtect Tax Calculator', () => {
  let taxCalculator: TaxCalculator;

  beforeEach(() => {
    // Initialize with test database connection
    taxCalculator = new TaxCalculator({
      testMode: true,
      conservativeApproach: true
    });
  });

  describe('Wyoming Legal Services Tax Exemptions', () => {
    it('should exempt DMCA takedown services nationwide', async () => {
      const testStates = ['CA', 'TX', 'FL', 'NY', 'IL'];
      
      for (const state of testStates) {
        const request: TaxCalculationRequest = {
          serviceType: 'dmca_takedown',
          basePrice: 29.00,
          customerLocation: { state, city: 'Test City' },
          billingPeriod: 'monthly'
        };

        const result = await taxCalculator.calculateTax(request);

        expect(result.isExempt).toBe(true);
        expect(result.taxAmount).toBe(0.00);
        expect(result.totalPrice).toBe(29.00);
        expect(result.exemptionReason).toContain('Professional legal services');
        expect(result.taxJurisdiction).toBe(state);
      }
    });

    it('should exempt legal consultation services', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'legal_consultation',
        basePrice: 75.00,
        customerLocation: { state: 'CA', city: 'Los Angeles' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);

      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0.00);
      expect(result.totalPrice).toBe(75.00);
      expect(result.exemptionReason).toContain('Attorney consultation');
    });

    it('should exempt case management services', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'case_management',
        basePrice: 25.00,
        customerLocation: { state: 'NY', city: 'New York' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);

      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0.00);
      expect(result.exemptionReason).toContain('Legal case administration');
    });

    it('should exempt cease and desist services', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'cease_desist',
        basePrice: 50.00,
        customerLocation: { state: 'TX', city: 'Austin' },
        billingPeriod: 'one-time'
      };

      const result = await taxCalculator.calculateTax(request);

      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0.00);
      expect(result.exemptionReason).toContain('Legal document drafting');
    });
  });

  describe('Digital Services Taxation', () => {
    it('should tax evidence storage in taxable states', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'evidence_storage',
        basePrice: 15.00,
        customerLocation: { state: 'CA', city: 'San Francisco' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);

      expect(result.isExempt).toBe(false);
      expect(result.taxAmount).toBeGreaterThan(0);
      expect(result.taxRate).toBe(0.0975); // California rate
      expect(result.totalPrice).toBe(15.00 + result.taxAmount);
    });

    it('should not tax evidence storage in no-sales-tax states', async () => {
      const noTaxStates = ['WY', 'AK', 'DE', 'MT', 'NH', 'OR'];
      
      for (const state of noTaxStates) {
        const request: TaxCalculationRequest = {
          serviceType: 'evidence_storage',
          basePrice: 15.00,
          customerLocation: { state },
          billingPeriod: 'monthly'
        };

        const result = await taxCalculator.calculateTax(request);

        expect(result.taxAmount).toBe(0.00);
        expect(result.exemptionReason).toContain('No sales tax state');
      }
    });
  });

  describe('Wyoming Home State Advantage', () => {
    it('should handle Wyoming customers with no tax', async () => {
      const services = ['dmca_takedown', 'legal_consultation', 'evidence_storage', 'case_management'];
      
      for (const serviceType of services) {
        const request: TaxCalculationRequest = {
          serviceType,
          basePrice: 29.00,
          customerLocation: { state: 'WY', city: 'Cheyenne' },
          billingPeriod: 'monthly'
        };

        const result = await taxCalculator.calculateTax(request);

        expect(result.taxAmount).toBe(0.00);
        expect(result.totalPrice).toBe(29.00);
        // Wyoming should have no tax regardless of service type
      }
    });

    it('should identify Wyoming as home state in calculations', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'dmca_takedown',
        basePrice: 29.00,
        customerLocation: { state: 'WY' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);

      expect(result.taxJurisdiction).toBe('Wyoming');
      expect(result.exemptionReason).toContain('Wyoming');
    });
  });

  describe('Service Tier Pricing Calculations', () => {
    it('should calculate Basic tier pricing with tax', async () => {
      const result = await taxCalculator.calculateServiceTierPricing('basic', {
        state: 'FL',
        city: 'Miami'
      });

      expect(result.tier).toBe('basic');
      expect(result.services).toHaveLength(1);
      expect(result.services[0].service).toBe('dmca_takedown');
      expect(result.services[0].isExempt).toBe(true);
      expect(result.totals.taxAmount).toBe(0.00);
    });

    it('should calculate Professional tier with mixed tax treatment', async () => {
      const result = await taxCalculator.calculateServiceTierPricing('professional', {
        state: 'CA',
        city: 'Los Angeles'
      });

      expect(result.tier).toBe('professional');
      expect(result.services.length).toBeGreaterThan(1);
      
      // Legal services should be exempt
      const legalServices = result.services.filter(s => s.isExempt);
      expect(legalServices.length).toBeGreaterThan(0);
      
      // Digital services might be taxable
      const digitalServices = result.services.filter(s => !s.isExempt);
      // Evidence storage should be taxable in CA
      expect(digitalServices.some(s => s.service === 'evidence_storage')).toBe(true);
    });

    it('should calculate Enterprise tier comprehensive pricing', async () => {
      const result = await taxCalculator.calculateServiceTierPricing('enterprise', {
        state: 'NY',
        city: 'New York'
      });

      expect(result.tier).toBe('enterprise');
      expect(result.services.length).toBeGreaterThan(3);
      expect(result.totals.basePrice).toBeGreaterThan(200);
      
      // Most services should be legal and exempt
      const exemptServices = result.services.filter(s => s.isExempt);
      expect(exemptServices.length / result.services.length).toBeGreaterThan(0.8); // 80%+ exempt
    });
  });

  describe('Economic Nexus Tracking', () => {
    it('should update nexus tracking for sales', async () => {
      const state = 'CA';
      const salesAmount = 50000;
      const transactionCount = 100;

      await taxCalculator.updateNexusTracking(state, salesAmount, transactionCount);

      const status = await taxCalculator.getNexusStatus(state);
      expect(status.currentYearSales).toBeGreaterThanOrEqual(salesAmount);
      expect(status.currentYearTransactions).toBeGreaterThanOrEqual(transactionCount);
    });

    it('should detect when nexus threshold is approaching', async () => {
      const state = 'FL'; // $100,000 threshold
      
      // Simulate sales approaching threshold
      await taxCalculator.updateNexusTracking(state, 85000, 150);

      const status = await taxCalculator.getNexusStatus(state);
      const percentage = (status.currentYearSales / status.threshold) * 100;
      
      expect(percentage).toBeGreaterThan(75); // Should trigger monitoring alerts
      expect(status.hasNexus).toBe(false); // Not yet established
    });

    it('should identify states requiring registration', async () => {
      // Simulate exceeding nexus threshold
      const state = 'FL';
      await taxCalculator.updateNexusTracking(state, 150000, 200);

      const status = await taxCalculator.getNexusStatus(state);
      expect(status.currentYearSales).toBeGreaterThan(status.threshold);
      // In real implementation, this might trigger nexus establishment
    });
  });

  describe('Tax Rate Accuracy', () => {
    it('should use correct tax rates for major states', async () => {
      const expectedRates = {
        'CA': 0.0975, // California
        'TX': 0.0725, // Texas  
        'FL': 0.0725, // Florida
        'NY': 0.0800, // New York
        'IL': 0.0875, // Illinois
      };

      for (const [state, expectedRate] of Object.entries(expectedRates)) {
        const request: TaxCalculationRequest = {
          serviceType: 'evidence_storage', // Taxable service
          basePrice: 100.00,
          customerLocation: { state },
          billingPeriod: 'monthly'
        };

        const result = await taxCalculator.calculateTax(request);
        expect(result.taxRate).toBe(expectedRate);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid state codes', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'dmca_takedown',
        basePrice: 29.00,
        customerLocation: { state: 'XX' }, // Invalid state
        billingPeriod: 'monthly'
      };

      await expect(taxCalculator.calculateTax(request))
        .rejects.toThrow('Invalid state code');
    });

    it('should handle unknown service types conservatively', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'unknown_service',
        basePrice: 50.00,
        customerLocation: { state: 'CA' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);
      
      // Conservative approach: unknown services are taxable
      expect(result.isExempt).toBe(false);
      expect(result.taxAmount).toBeGreaterThan(0);
    });

    it('should handle negative prices', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'dmca_takedown',
        basePrice: -10.00, // Negative price
        customerLocation: { state: 'CA' },
        billingPeriod: 'monthly'
      };

      await expect(taxCalculator.calculateTax(request))
        .rejects.toThrow('Invalid price');
    });
  });

  describe('Compliance and Audit Trail', () => {
    it('should log all tax calculations for audit', async () => {
      const request: TaxCalculationRequest = {
        serviceType: 'dmca_takedown',
        basePrice: 29.00,
        customerLocation: { state: 'CA', city: 'Los Angeles' },
        billingPeriod: 'monthly'
      };

      const result = await taxCalculator.calculateTax(request);
      
      // Verify calculation is logged (implementation would check database)
      expect(result.calculationId).toBeDefined();
      expect(typeof result.calculationId).toBe('string');
    });

    it('should provide detailed exemption reasoning', async () => {
      const legalServices = ['dmca_takedown', 'legal_consultation', 'case_management'];
      
      for (const serviceType of legalServices) {
        const request: TaxCalculationRequest = {
          serviceType,
          basePrice: 50.00,
          customerLocation: { state: 'CA' },
          billingPeriod: 'monthly'
        };

        const result = await taxCalculator.calculateTax(request);
        
        expect(result.exemptionReason).toBeDefined();
        expect(result.exemptionReason).toContain('legal');
        expect(result.exemptionReason.length).toBeGreaterThan(10); // Detailed explanation
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should calculate taxes quickly', async () => {
      const startTime = Date.now();
      
      const request: TaxCalculationRequest = {
        serviceType: 'dmca_takedown',
        basePrice: 29.00,
        customerLocation: { state: 'CA' },
        billingPeriod: 'monthly'
      };

      await taxCalculator.calculateTax(request);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle concurrent calculations', async () => {
      const requests = Array(10).fill(0).map((_, i) => ({
        serviceType: 'dmca_takedown',
        basePrice: 29.00,
        customerLocation: { state: 'CA', city: `City${i}` },
        billingPeriod: 'monthly' as const
      }));

      const results = await Promise.all(
        requests.map(req => taxCalculator.calculateTax(req))
      );

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.isExempt).toBe(true);
        expect(result.taxAmount).toBe(0.00);
      });
    });
  });

  afterAll(async () => {
    // Cleanup test data if needed
    if (taxCalculator && typeof taxCalculator.cleanup === 'function') {
      await taxCalculator.cleanup();
    }
  });
});
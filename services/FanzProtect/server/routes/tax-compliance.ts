// FanzProtect Tax Compliance API Routes
// Handle tax calculations and compliance for Wyoming-based legal services

import { Router } from 'express';
import { z } from 'zod';
import { FanzProtectTaxCalculator, TaxReportingService } from '../services/tax/tax-calculator.js';
import { db } from '../database/connection.js';
import { taxCalculations, stateNexusStatus, taxFilings } from '../../shared/tax-schema.js';
import { logger } from '../utils/logger.js';
import { ecosystemServices } from '../services/ecosystem/index.js';

const router = Router();

// Request validation schemas
const CalculateTaxRequest = z.object({
  serviceType: z.enum(['dmca_takedown', 'legal_consultation', 'court_filing', 'document_generation', 'evidence_storage', 'case_management', 'legal_research', 'cease_desist']),
  basePrice: z.number().min(0),
  customerLocation: z.object({
    state: z.string().length(2),
    city: z.string(),
    zipCode: z.string(),
    country: z.string().default('US')
  }),
  billingPeriod: z.enum(['monthly', 'quarterly', 'annual', 'one_time']),
  customerId: z.string().optional(),
  tier: z.enum(['basic', 'professional', 'enterprise']).optional()
});

const PricingRequest = z.object({
  tier: z.enum(['basic', 'professional', 'enterprise']),
  customerLocation: z.object({
    state: z.string().length(2),
    city: z.string(),
    zipCode: z.string(),
    country: z.string().default('US')
  })
});

// Initialize tax calculator (in production, get annual revenue from database)
const taxCalculator = new FanzProtectTaxCalculator(0); // Start with $0, will update as we grow

/**
 * Calculate tax for a specific service
 * POST /api/tax/calculate
 */
router.post('/calculate', async (req, res) => {
  try {
    const validatedData = CalculateTaxRequest.parse(req.body);
    
    // Calculate tax using our Wyoming-based rules
    const taxCalculation = await taxCalculator.calculateTax({
      serviceType: validatedData.serviceType,
      basePrice: validatedData.basePrice,
      customerLocation: validatedData.customerLocation,
      billingPeriod: validatedData.billingPeriod
    });

    // Store calculation in database for audit trail
    await db.insert(taxCalculations).values({
      customerId: validatedData.customerId || 'anonymous',
      customerState: validatedData.customerLocation.state,
      customerCity: validatedData.customerLocation.city,
      customerZipCode: validatedData.customerLocation.zipCode,
      serviceType: validatedData.serviceType,
      serviceTier: validatedData.tier || null,
      billingPeriod: validatedData.billingPeriod,
      basePrice: taxCalculation.basePrice.toString(),
      taxRate: taxCalculation.taxRate.toString(),
      taxAmount: taxCalculation.taxAmount.toString(),
      totalPrice: taxCalculation.totalPrice.toString(),
      taxJurisdiction: taxCalculation.taxJurisdiction,
      exemptionApplied: taxCalculation.exemptionApplied,
      exemptionReason: taxCalculation.exemptionReason,
      nexusRequired: taxCalculation.nexusRequired,
      complianceNotes: taxCalculation.complianceNotes,
      calculatedBy: 'system'
    });

    logger.info('Tax calculation completed', {
      serviceType: validatedData.serviceType,
      state: validatedData.customerLocation.state,
      basePrice: taxCalculation.basePrice,
      taxAmount: taxCalculation.taxAmount,
      exemption: taxCalculation.exemptionApplied
    });

    res.json({
      success: true,
      data: taxCalculation
    });

  } catch (error) {
    logger.error('Tax calculation failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message || 'Tax calculation failed'
    });
  }
});

/**
 * Get pricing with tax for FanzProtect tiers
 * POST /api/tax/pricing
 */
router.post('/pricing', async (req, res) => {
  try {
    const validatedData = PricingRequest.parse(req.body);
    
    // Get tier pricing with tax calculations
    const pricing = await taxCalculator.getFanzProtectPricing(
      validatedData.tier,
      validatedData.customerLocation
    );

    // Store each service calculation for audit
    for (const service of pricing.services) {
      await db.insert(taxCalculations).values({
        customerId: 'pricing_quote',
        customerState: validatedData.customerLocation.state,
        customerCity: validatedData.customerLocation.city,
        customerZipCode: validatedData.customerLocation.zipCode,
        serviceType: service.service,
        serviceTier: validatedData.tier,
        billingPeriod: 'monthly',
        basePrice: service.pricing.basePrice.toString(),
        taxRate: service.pricing.taxRate.toString(),
        taxAmount: service.pricing.taxAmount.toString(),
        totalPrice: service.pricing.totalPrice.toString(),
        taxJurisdiction: service.pricing.taxJurisdiction,
        exemptionApplied: service.pricing.exemptionApplied,
        exemptionReason: service.pricing.exemptionReason,
        nexusRequired: service.pricing.nexusRequired,
        complianceNotes: service.pricing.complianceNotes,
        calculatedBy: 'pricing_engine'
      });
    }

    logger.info('Tier pricing calculated', {
      tier: validatedData.tier,
      state: validatedData.customerLocation.state,
      totalPrice: pricing.monthlyTotal.totalPrice,
      taxAmount: pricing.monthlyTotal.taxAmount
    });

    res.json({
      success: true,
      data: pricing
    });

  } catch (error) {
    logger.error('Pricing calculation failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message || 'Pricing calculation failed'
    });
  }
});

/**
 * Get state nexus status
 * GET /api/tax/nexus
 */
router.get('/nexus', async (req, res) => {
  try {
    // Get all state nexus status from database
    const nexusStatuses = await db.select().from(stateNexusStatus);
    
    // Convert to object format
    const nexusMap = nexusStatuses.reduce((acc, status) => {
      acc[status.state] = {
        hasNexus: status.hasNexus,
        collectingTax: status.collectingTax,
        currentYearSales: parseFloat(status.currentYearSales),
        currentYearTransactions: status.currentYearTransactions,
        salesThreshold: status.salesThreshold ? parseFloat(status.salesThreshold) : null,
        transactionThreshold: status.transactionThreshold,
        nexusEstablishedDate: status.nexusEstablishedDate,
        nexusReason: status.nexusReason
      };
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: {
        wyomingBased: true,
        noSalesTaxStates: ['WY', 'AK', 'DE', 'MT', 'NH', 'OR'],
        nexusStatus: nexusMap,
        complianceNotes: [
          'FanzProtect is Wyoming-based with no state sales tax',
          'Legal services often exempt from sales tax',
          'Economic nexus monitored for each state',
          'DMCA services classified as legal services'
        ]
      }
    });

  } catch (error) {
    logger.error('Nexus status retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nexus status'
    });
  }
});

/**
 * Update nexus status for a state
 * PUT /api/tax/nexus/:state
 */
router.put('/nexus/:state', async (req, res) => {
  try {
    const state = req.params.state.toUpperCase();
    const updates = req.body;

    // Validate state code
    if (!/^[A-Z]{2}$/.test(state)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state code'
      });
    }

    // Update nexus status
    await db.insert(stateNexusStatus).values({
      state,
      ...updates,
      lastUpdated: new Date(),
      reviewedBy: req.user?.id || 'system'
    }).onConflictDoUpdate({
      target: [stateNexusStatus.state],
      set: {
        ...updates,
        lastUpdated: new Date(),
        reviewedBy: req.user?.id || 'system'
      }
    });

    // Send notification to FanzDash if nexus established
    if (updates.hasNexus && !updates.wasNexusPreviously) {
      await ecosystemServices.dashboard.sendAlert({
        level: 'warning',
        title: 'Tax Nexus Established',
        message: `Economic nexus established in ${state} - tax collection may be required`,
        metadata: {
          state,
          platform: 'fanzprotect',
          category: 'tax_compliance'
        }
      });
    }

    logger.info('Nexus status updated', {
      state,
      hasNexus: updates.hasNexus,
      collectingTax: updates.collectingTax
    });

    res.json({
      success: true,
      message: `Nexus status updated for ${state}`
    });

  } catch (error) {
    logger.error('Nexus status update failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update nexus status'
    });
  }
});

/**
 * Generate tax report for a period
 * GET /api/tax/report
 */
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate, state } = req.query;

    // Build query conditions
    let query = db.select().from(taxCalculations);
    
    if (startDate && endDate) {
      // Add date filtering (would need to implement with proper SQL)
      // This is a simplified version
    }

    if (state) {
      // Add state filtering
    }

    const calculations = await query;

    // Generate report
    const transactions = calculations.map(calc => ({
      state: calc.customerState,
      taxAmount: parseFloat(calc.taxAmount),
      baseAmount: parseFloat(calc.basePrice),
      date: calc.calculatedAt
    }));

    const report = TaxReportingService.generateStateTaxReport(transactions);

    logger.info('Tax report generated', {
      period: `${startDate} to ${endDate}`,
      statesIncluded: Object.keys(report).length,
      totalTransactions: transactions.length
    });

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate
        },
        summary: {
          totalTransactions: transactions.length,
          totalTaxCollected: transactions.reduce((sum, t) => sum + t.taxAmount, 0),
          totalRevenue: transactions.reduce((sum, t) => sum + t.baseAmount, 0),
          statesWithActivity: Object.keys(report).length
        },
        stateBreakdown: report
      }
    });

  } catch (error) {
    logger.error('Tax report generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate tax report'
    });
  }
});

/**
 * Get Wyoming compliance status
 * GET /api/tax/wyoming-compliance
 */
router.get('/wyoming-compliance', async (req, res) => {
  try {
    // In production, this would fetch actual Wyoming business registration data
    const wyomingStatus = {
      businessName: 'FANZ Legal Protection Services LLC',
      registeredState: 'Wyoming',
      businessType: 'Limited Liability Company',
      registrationStatus: 'Active',
      noSalesTax: true,
      businessAdvantages: [
        'No state sales tax on services',
        'Business-friendly regulatory environment',
        'Strong privacy protections',
        'Low annual filing requirements'
      ],
      complianceItems: [
        {
          item: 'Annual Report',
          status: 'Due by first day of anniversary month',
          fee: '$60',
          required: true
        },
        {
          item: 'Registered Agent',
          status: 'Required at all times',
          current: 'Wyoming Corporate Services',
          required: true
        },
        {
          item: 'Business License',
          status: 'Not required for legal services',
          required: false
        }
      ],
      legalServiceAuthorization: {
        required: true,
        status: 'Professional legal services require appropriate authorization',
        barAdmission: 'Required for practicing attorneys',
        complianceNote: 'DMCA services may be provided by authorized legal entities'
      }
    };

    res.json({
      success: true,
      data: wyomingStatus
    });

  } catch (error) {
    logger.error('Wyoming compliance check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Wyoming compliance status'
    });
  }
});

export default router;
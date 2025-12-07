import type { Express } from 'express';
import { z } from 'zod';
import { currencyService } from './services/currency';
import { authenticateJWT, requireRole, rateLimit } from './middleware/auth';

// Validation schemas
const ConvertCurrencySchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3).toUpperCase(),
  toCurrency: z.string().length(3).toUpperCase(),
  applyFees: z.boolean().default(false),
});

const UpdatePreferencesSchema = z.object({
  displayCurrency: z.string().length(3).toUpperCase().optional(),
  payoutCurrency: z.string().length(3).toUpperCase().optional(),
  autoConvert: z.boolean().optional(),
  conversionThreshold: z.number().positive().optional(),
  preferredProviders: z.array(z.string()).optional(),
});

const CalculatePayoutSchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().length(3).toUpperCase(),
  country: z.string().length(2).toUpperCase().optional(),
});

const FormatCurrencySchema = z.object({
  amount: z.number(),
  currency: z.string().length(3).toUpperCase(),
  locale: z.string().optional().default('en-US'),
});

/**
 * Register currency API routes
 */
export function registerCurrencyRoutes(app: Express) {
  console.log('💱 Registering currency API routes');

  // Apply rate limiting to currency routes
  const currencyRateLimit = rateLimit(200, 60000); // 200 requests per minute

  /**
   * Get supported currencies
   * GET /api/currencies
   */
  app.get('/api/currencies', currencyRateLimit, async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const currencies = currencyService.getSupportedCurrencies(includeInactive);

      res.json({
        success: true,
        currencies,
        stats: currencyService.getCurrencyStats(),
      });
    } catch (error) {
      console.error('Get currencies error:', error);
      res.status(500).json({
        error: 'Failed to fetch currencies',
        code: 'FETCH_CURRENCIES_ERROR',
      });
    }
  });

  /**
   * Get specific currency details
   * GET /api/currencies/:code
   */
  app.get('/api/currencies/:code', currencyRateLimit, async (req, res) => {
    try {
      const currency = currencyService.getCurrency(req.params.code);
      
      if (!currency) {
        return res.status(404).json({
          error: 'Currency not found',
          code: 'CURRENCY_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        currency,
      });
    } catch (error) {
      console.error('Get currency error:', error);
      res.status(500).json({
        error: 'Failed to fetch currency',
        code: 'FETCH_CURRENCY_ERROR',
      });
    }
  });

  /**
   * Convert between currencies
   * POST /api/currencies/convert
   */
  app.post('/api/currencies/convert', currencyRateLimit, async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, applyFees } = ConvertCurrencySchema.parse(req.body);
      
      const result = await currencyService.convertCurrency(amount, fromCurrency, toCurrency, applyFees);

      res.json({
        success: true,
        conversion: result,
      });
    } catch (error) {
      console.error('Currency conversion error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid conversion parameters',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
          code: 'CONVERSION_ERROR',
        });
      }
      
      res.status(500).json({
        error: 'Currency conversion failed',
        code: 'CONVERSION_SERVICE_ERROR',
      });
    }
  });

  /**
   * Format currency amount
   * POST /api/currencies/format
   */
  app.post('/api/currencies/format', currencyRateLimit, async (req, res) => {
    try {
      const { amount, currency, locale } = FormatCurrencySchema.parse(req.body);
      
      const formatted = currencyService.formatCurrency(amount, currency, locale);

      res.json({
        success: true,
        formatted,
        original: {
          amount,
          currency,
          locale,
        },
      });
    } catch (error) {
      console.error('Currency formatting error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid formatting parameters',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({
        error: 'Currency formatting failed',
        code: 'FORMATTING_ERROR',
      });
    }
  });

  /**
   * Get exchange rate between currencies
   * GET /api/currencies/exchange-rate/:from/:to
   */
  app.get('/api/currencies/exchange-rate/:from/:to', currencyRateLimit, async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = currencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

      res.json({
        success: true,
        exchangeRate: {
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          rate,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Exchange rate error:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
          code: 'EXCHANGE_RATE_ERROR',
        });
      }
      
      res.status(500).json({
        error: 'Failed to get exchange rate',
        code: 'EXCHANGE_RATE_SERVICE_ERROR',
      });
    }
  });

  /**
   * Get available payment providers
   * GET /api/currencies/providers
   */
  app.get('/api/currencies/providers', currencyRateLimit, async (req, res) => {
    try {
      const currency = req.query.currency as string;
      const country = req.query.country as string;
      const adultFriendlyOnly = req.query.adultFriendlyOnly !== 'false';

      if (!currency) {
        return res.status(400).json({
          error: 'Currency parameter is required',
          code: 'MISSING_CURRENCY',
        });
      }

      const providers = currencyService.getAvailableProviders(
        currency.toUpperCase(),
        country?.toUpperCase(),
        adultFriendlyOnly
      );

      res.json({
        success: true,
        providers,
        filters: {
          currency: currency.toUpperCase(),
          country: country?.toUpperCase(),
          adultFriendlyOnly,
        },
      });
    } catch (error) {
      console.error('Get providers error:', error);
      res.status(500).json({
        error: 'Failed to fetch payment providers',
        code: 'FETCH_PROVIDERS_ERROR',
      });
    }
  });

  /**
   * Get user currency preferences (authenticated)
   * GET /api/currencies/preferences
   */
  app.get('/api/currencies/preferences', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const preferences = await currencyService.getUserPreferences(req.user.id);

      res.json({
        success: true,
        preferences,
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        error: 'Failed to fetch currency preferences',
        code: 'FETCH_PREFERENCES_ERROR',
      });
    }
  });

  /**
   * Update user currency preferences (authenticated)
   * PUT /api/currencies/preferences
   */
  app.put('/api/currencies/preferences', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const updates = UpdatePreferencesSchema.parse(req.body);
      
      // Validate currencies exist
      if (updates.displayCurrency && !currencyService.getCurrency(updates.displayCurrency)) {
        return res.status(400).json({
          error: `Display currency ${updates.displayCurrency} is not supported`,
          code: 'INVALID_DISPLAY_CURRENCY',
        });
      }

      if (updates.payoutCurrency && !currencyService.getCurrency(updates.payoutCurrency)) {
        return res.status(400).json({
          error: `Payout currency ${updates.payoutCurrency} is not supported`,
          code: 'INVALID_PAYOUT_CURRENCY',
        });
      }

      const preferences = await currencyService.updateUserPreferences(req.user.id, updates);

      res.json({
        success: true,
        preferences,
        message: 'Currency preferences updated successfully',
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid preference data',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      res.status(500).json({
        error: 'Failed to update currency preferences',
        code: 'UPDATE_PREFERENCES_ERROR',
      });
    }
  });

  /**
   * Calculate optimal payout (authenticated)
   * POST /api/currencies/calculate-payout
   */
  app.post('/api/currencies/calculate-payout', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const { amount, fromCurrency, country } = CalculatePayoutSchema.parse(req.body);
      
      const calculation = await currencyService.calculateOptimalPayout(
        req.user.id,
        amount,
        fromCurrency,
        country
      );

      res.json({
        success: true,
        calculation,
        recommendation: {
          provider: calculation.provider.name,
          netAmount: calculation.netAmount,
          totalFees: calculation.conversionFee + calculation.withdrawalFee,
          processingTime: calculation.processingTime,
        },
      });
    } catch (error) {
      console.error('Calculate payout error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid calculation parameters',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
          code: 'CALCULATION_ERROR',
        });
      }
      
      res.status(500).json({
        error: 'Payout calculation failed',
        code: 'CALCULATION_SERVICE_ERROR',
      });
    }
  });

  /**
   * Get currency statistics (admin only)
   * GET /api/currencies/stats
   */
  app.get('/api/currencies/stats', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const stats = currencyService.getCurrencyStats();

      res.json({
        success: true,
        stats: {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Get currency stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch currency statistics',
        code: 'STATS_ERROR',
      });
    }
  });

  /**
   * Force exchange rate update (admin only)
   * POST /api/currencies/update-rates
   */
  app.post('/api/currencies/update-rates', authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      // Trigger manual rate update
      currencyService.emit('force_rate_update');

      res.json({
        success: true,
        message: 'Exchange rate update triggered',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Force rate update error:', error);
      res.status(500).json({
        error: 'Failed to trigger rate update',
        code: 'RATE_UPDATE_ERROR',
      });
    }
  });

  /**
   * Test currency conversion (development only)
   * POST /api/currencies/test-conversion
   */
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/currencies/test-conversion', authenticateJWT, requireRole('admin'), async (req, res) => {
      try {
        const testConversions = [
          { amount: 100, from: 'USD', to: 'EUR' },
          { amount: 500, from: 'EUR', to: 'GBP' },
          { amount: 1000, from: 'USD', to: 'USDT' },
          { amount: 0.1, from: 'BTC', to: 'USD' },
        ];

        const results = await Promise.all(
          testConversions.map(async ({ amount, from, to }) => {
            try {
              const conversion = await currencyService.convertCurrency(amount, from, to, true);
              const formatted = currencyService.formatCurrency(conversion.netAmount, to);
              
              return {
                success: true,
                input: { amount, from, to },
                conversion,
                formatted,
              };
            } catch (error) {
              return {
                success: false,
                input: { amount, from, to },
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );

        res.json({
          success: true,
          testResults: results,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Test conversion error:', error);
        res.status(500).json({
          error: 'Test conversion failed',
          code: 'TEST_ERROR',
        });
      }
    });
  }

  console.log('✅ Currency API routes registered');
}

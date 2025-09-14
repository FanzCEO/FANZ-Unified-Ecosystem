import { 
  createMockRequest, 
  createMockResponse, 
  mockUser, 
  mockCreator, 
  mockAdmin, 
  mockDb 
} from '../setup';
import { FinancialReportsController } from '../../controllers/financial-reports.controller';

// Mock dependencies
jest.mock('../../models/payment.model', () => ({
  paymentRepository: {
    db: mockDb
  }
}));

jest.mock('../../utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

jest.mock('../../middleware/metrics', () => ({
  MetricsCollector: {
    recordBusinessEvent: jest.fn()
  }
}));

describe('FinancialReportsController', () => {
  let financialReportsController: FinancialReportsController;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    financialReportsController = new FinancialReportsController();
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe('generateProfitLossStatement', () => {
    const mockRevenueData = {
      subscription_revenue: 5000.00,
      tip_revenue: 1500.00,
      content_revenue: 2000.00,
      total_revenue: 8500.00
    };

    const mockExpensesData = {
      processing_fees: 200.00,
      refunds: 150.00,
      chargebacks: 50.00
    };

    const mockMetricsData = {
      active_users: 100,
      active_creators: 25,
      total_transactions: 500,
      avg_transaction_value: 17.00
    };

    it('should generate P&L statement successfully for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        period_type: 'monthly',
        currency: 'USD' 
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockRevenueData] })
        .mockResolvedValueOnce({ rows: [mockExpensesData] })
        .mockResolvedValueOnce({ rows: [mockMetricsData] });

      await financialReportsController.generateProfitLossStatement(mockRequest, mockResponse);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          profit_loss_statement: expect.objectContaining({
            period: expect.any(Object),
            revenue: expect.objectContaining({
              subscription_revenue: 5000.00,
              tip_revenue: 1500.00,
              content_revenue: 2000.00,
              total_revenue: 8500.00
            }),
            cost_of_revenue: expect.any(Object),
            operating_expenses: expect.any(Object),
            metrics: expect.objectContaining({
              active_users: 100,
              active_creators: 25,
              total_transactions: 500
            })
          })
        })
      });
    });

    it('should fail when user is not admin', async () => {
      mockRequest.user = mockUser; // Regular user

      await expect(
        financialReportsController.generateProfitLossStatement(mockRequest, mockResponse)
      ).rejects.toThrow('Admin access required');
    });

    it('should validate query parameters', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        period_type: 'invalid_period' // Invalid period type
      };

      await expect(
        financialReportsController.generateProfitLossStatement(mockRequest, mockResponse)
      ).rejects.toThrow();
    });

    it('should handle custom date range', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        period_type: 'custom',
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        currency: 'USD' 
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockRevenueData] })
        .mockResolvedValueOnce({ rows: [mockExpensesData] })
        .mockResolvedValueOnce({ rows: [mockMetricsData] });

      await financialReportsController.generateProfitLossStatement(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            profit_loss_statement: expect.objectContaining({
              period: expect.objectContaining({
                period_type: 'custom'
              })
            })
          })
        })
      );
    });
  });

  describe('generateBalanceSheet', () => {
    const mockAssetsData = {
      cash_available: 50000.00,
      cash_pending: 5000.00,
      cash_escrow: 2000.00,
      total_user_balances: 57000.00
    };

    const mockLiabilitiesData = {
      creator_earnings_payable: 30000.00,
      pending_payouts: 5000.00
    };

    const mockReserveData = {
      total_fees_collected: 15000.00,
      realized_fees: 12000.00
    };

    it('should generate balance sheet successfully for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        period_type: 'monthly',
        currency: 'USD' 
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAssetsData] })
        .mockResolvedValueOnce({ rows: [mockLiabilitiesData] })
        .mockResolvedValueOnce({ rows: [mockReserveData] });

      await financialReportsController.generateBalanceSheet(mockRequest, mockResponse);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          balance_sheet: expect.objectContaining({
            currency: 'USD',
            assets: expect.objectContaining({
              current_assets: expect.objectContaining({
                cash_and_cash_equivalents: expect.objectContaining({
                  available_cash: 50000.00,
                  pending_settlements: 5000.00,
                  escrow_funds: 2000.00
                })
              })
            }),
            liabilities: expect.objectContaining({
              current_liabilities: expect.objectContaining({
                creator_payables: 30000.00,
                pending_payouts: 5000.00
              })
            }),
            verification: expect.objectContaining({
              is_balanced: expect.any(Boolean)
            })
          })
        })
      });
    });

    it('should fail when user is not admin', async () => {
      mockRequest.user = mockUser; // Regular user

      await expect(
        financialReportsController.generateBalanceSheet(mockRequest, mockResponse)
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('generateCashFlowStatement', () => {
    const mockOperatingData = {
      cash_from_fees: 8500.00,
      creator_payouts: -25000.00,
      refunds_paid: -500.00,
      chargebacks: -200.00
    };

    const mockUserFlowsData = {
      user_deposits: 45000.00,
      user_withdrawals: -30000.00
    };

    const mockOperationalData = {
      new_users: 50,
      new_creators: 12,
      total_transactions: 250
    };

    it('should generate cash flow statement successfully for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        period_type: 'monthly',
        currency: 'USD' 
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockOperatingData] })
        .mockResolvedValueOnce({ rows: [mockUserFlowsData] })
        .mockResolvedValueOnce({ rows: [mockOperationalData] });

      await financialReportsController.generateCashFlowStatement(mockRequest, mockResponse);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          cash_flow_statement: expect.objectContaining({
            period: expect.any(Object),
            operating_activities: expect.objectContaining({
              cash_receipts: expect.objectContaining({
                platform_fees_collected: 8500.00,
                user_deposits: 45000.00
              }),
              cash_payments: expect.objectContaining({
                creator_payouts: 25000.00, // Should be positive (absolute value)
                user_withdrawals: 30000.00
              }),
              net_operating_cash_flow: expect.any(Number)
            }),
            investing_activities: expect.any(Object),
            financing_activities: expect.any(Object),
            operational_metrics: expect.objectContaining({
              new_users: 50,
              new_creators: 12,
              total_transactions: 250
            })
          })
        })
      });
    });

    it('should fail when user is not admin', async () => {
      mockRequest.user = mockUser; // Regular user

      await expect(
        financialReportsController.generateCashFlowStatement(mockRequest, mockResponse)
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('getFinancialAnalytics', () => {
    it('should return financial analytics for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        metric_type: 'revenue_trend',
        period: '30d',
        granularity: 'daily'
      };

      const mockAnalyticsData = [
        { period: '2023-01-01', revenue: 100.00, transactions: 5 },
        { period: '2023-01-02', revenue: 150.00, transactions: 7 },
        { period: '2023-01-03', revenue: 200.00, transactions: 10 }
      ];

      mockDb.query.mockResolvedValue({ rows: mockAnalyticsData });

      await financialReportsController.getFinancialAnalytics(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { analytics: mockAnalyticsData }
      });
    });

    it('should return creator-specific analytics for creators', async () => {
      mockRequest.user = mockCreator;
      mockRequest.query = { 
        metric_type: 'creator_performance',
        period: '30d',
        granularity: 'daily'
      };

      const mockCreatorAnalytics = [
        {
          username: 'testcreator',
          display_name: 'Test Creator',
          total_earnings: 500.00,
          transaction_count: 25,
          unique_supporters: 15,
          avg_transaction_value: 20.00
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockCreatorAnalytics });

      await financialReportsController.getFinancialAnalytics(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { analytics: mockCreatorAnalytics }
      });
    });

    it('should fail when user does not have access', async () => {
      mockRequest.user = mockUser; // Regular user (not creator or admin)

      await expect(
        financialReportsController.getFinancialAnalytics(mockRequest, mockResponse)
      ).rejects.toThrow('Access denied');
    });

    it('should validate analytics query parameters', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { 
        metric_type: 'invalid_metric' // Invalid metric type
      };

      await expect(
        financialReportsController.getFinancialAnalytics(mockRequest, mockResponse)
      ).rejects.toThrow();
    });
  });

  describe('getExecutiveDashboard', () => {
    const mockKpiData = {
      total_revenue: 10000.00,
      gross_volume: 75000.00,
      total_transactions: 500,
      active_users: 200,
      active_creators: 50,
      avg_transaction_value: 150.00,
      subscription_revenue: 6000.00,
      tip_revenue: 4000.00
    };

    const mockGrowthData = {
      current_revenue: 10000.00,
      previous_revenue: 8500.00,
      current_transactions: 500,
      previous_transactions: 425,
      current_users: 200,
      previous_users: 175
    };

    const mockTopPerformers = [
      {
        username: 'creator1',
        display_name: 'Top Creator 1',
        total_earnings: 1500.00,
        transaction_count: 75,
        avg_earning_per_transaction: 20.00
      },
      {
        username: 'creator2',
        display_name: 'Top Creator 2',
        total_earnings: 1200.00,
        transaction_count: 60,
        avg_earning_per_transaction: 20.00
      }
    ];

    it('should return executive dashboard for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { period: '30d' };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockKpiData] })
        .mockResolvedValueOnce({ rows: [mockGrowthData] })
        .mockResolvedValueOnce({ rows: mockTopPerformers });

      await financialReportsController.getExecutiveDashboard(mockRequest, mockResponse);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          executive_dashboard: expect.objectContaining({
            period: '30 days',
            key_metrics: expect.objectContaining({
              total_revenue: 10000.00,
              gross_volume: 75000.00,
              total_transactions: 500,
              active_users: 200,
              active_creators: 50
            }),
            revenue_breakdown: expect.objectContaining({
              subscription_revenue: 6000.00,
              tip_revenue: 4000.00,
              subscription_percentage: '60.00%',
              tip_percentage: '40.00%'
            }),
            growth_metrics: expect.objectContaining({
              revenue_growth: expect.stringContaining('%'),
              transaction_growth: expect.stringContaining('%'),
              user_growth: expect.stringContaining('%')
            }),
            top_creators: expect.arrayContaining([
              expect.objectContaining({
                username: 'creator1',
                display_name: 'Top Creator 1',
                total_earnings: 1500.00
              })
            ]),
            health_indicators: expect.objectContaining({
              platform_take_rate: expect.stringContaining('%'),
              financial_health: 'Strong'
            })
          })
        })
      });
    });

    it('should calculate growth rates correctly', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { period: '30d' };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockKpiData] })
        .mockResolvedValueOnce({ rows: [mockGrowthData] })
        .mockResolvedValueOnce({ rows: mockTopPerformers });

      await financialReportsController.getExecutiveDashboard(mockRequest, mockResponse);

      const responseCall = mockResponse.json.mock.calls[0][0];
      const dashboard = responseCall.data.executive_dashboard;

      // Revenue growth: (10000 - 8500) / 8500 * 100 = 17.65%
      expect(dashboard.growth_metrics.revenue_growth).toBe('17.65%');
      
      // Transaction growth: (500 - 425) / 425 * 100 = 17.65%
      expect(dashboard.growth_metrics.transaction_growth).toBe('17.65%');
      
      // User growth: (200 - 175) / 175 * 100 = 14.29%
      expect(dashboard.growth_metrics.user_growth).toBe('14.29%');
    });

    it('should handle zero previous period data', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { period: '30d' };

      const mockGrowthDataZero = {
        ...mockGrowthData,
        previous_revenue: 0,
        previous_transactions: 0,
        previous_users: 0
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockKpiData] })
        .mockResolvedValueOnce({ rows: [mockGrowthDataZero] })
        .mockResolvedValueOnce({ rows: mockTopPerformers });

      await financialReportsController.getExecutiveDashboard(mockRequest, mockResponse);

      const responseCall = mockResponse.json.mock.calls[0][0];
      const dashboard = responseCall.data.executive_dashboard;

      expect(dashboard.growth_metrics.revenue_growth).toBe('N/A%');
      expect(dashboard.growth_metrics.transaction_growth).toBe('N/A%');
      expect(dashboard.growth_metrics.user_growth).toBe('N/A%');
    });

    it('should fail when user is not admin', async () => {
      mockRequest.user = mockUser; // Regular user

      await expect(
        financialReportsController.getExecutiveDashboard(mockRequest, mockResponse)
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('Helper methods', () => {
    describe('calculatePeriodDates', () => {
      it('should calculate monthly period correctly', () => {
        const controller = new FinancialReportsController();
        const result = (controller as any).calculatePeriodDates('monthly');
        
        expect(result).toHaveProperty('periodStart');
        expect(result).toHaveProperty('periodEnd');
        expect(result.periodStart).toBeInstanceOf(Date);
        expect(result.periodEnd).toBeInstanceOf(Date);
      });

      it('should handle custom date range', () => {
        const controller = new FinancialReportsController();
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-31');
        
        const result = (controller as any).calculatePeriodDates('custom', startDate, endDate);
        
        expect(result.periodStart).toEqual(startDate);
        expect(result.periodEnd).toEqual(endDate);
      });
    });

    describe('parsePeriodDays', () => {
      it('should parse period strings correctly', () => {
        const controller = new FinancialReportsController();
        
        expect((controller as any).parsePeriodDays('7d')).toBe(7);
        expect((controller as any).parsePeriodDays('30d')).toBe(30);
        expect((controller as any).parsePeriodDays('90d')).toBe(90);
        expect((controller as any).parsePeriodDays('1y')).toBe(365);
        expect((controller as any).parsePeriodDays('invalid')).toBe(30); // Default
      });
    });
  });
});
/**
 * FANZ Unified Ecosystem - FanzDash Tax Administration API
 * 
 * Backend API service supporting the FanzDash tax admin UI with:
 * - Role-based access control (admin, manager, viewer)
 * - Comprehensive tax data endpoints
 * - Approval workflows for filings and remittances
 * - Real-time dashboard data
 * - Secure audit logging
 */

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, query, param, validationResult } from 'express-validator';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
    permissions: string[];
  };
}

interface TaxDashboardData {
  totalLiabilities: number;
  pendingFilings: number;
  activeRegistrations: number;
  nexusStates: number;
  form1099Count: number;
  recentActivity: ActivityItem[];
  upcomingFilings: TaxFiling[];
  nexusStatus: NexusStatusItem[];
  alerts: AlertItem[];
}

interface TaxFiling {
  id: string;
  jurisdiction: string;
  period: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'filed' | 'paid' | 'overdue';
  filingType: 'monthly' | 'quarterly' | 'annual';
  approvedBy?: string;
  approvedAt?: Date;
}

interface NexusStatusItem {
  state: string;
  revenue: number;
  transactions: number;
  threshold: number;
  status: 'safe' | 'approaching' | 'exceeded';
  registrationStatus: 'not_registered' | 'pending' | 'active' | 'suspended';
}

interface ActivityItem {
  id: string;
  type: 'filing' | 'sync' | 'registration' | 'exemption' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  actorId?: string;
  actorName?: string;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  dueDate?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FANZDASH_URL || 'https://dash.fanz.com',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/tax-admin', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Authentication and Authorization Middleware
// ============================================================================

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Mock user lookup - replace with actual database query
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'Invalid user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission required: ${permission}` });
    }
    next();
  };
};

// ============================================================================
// Validation Middleware
// ============================================================================

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================================================
// Dashboard Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/dashboard
 * Get comprehensive dashboard data
 */
app.get('/api/tax-admin/dashboard', 
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = await getDashboardData(req.user!);
      
      // Log access for audit
      await logActivity({
        type: 'dashboard_access',
        actorId: req.user!.id,
        description: 'Accessed tax admin dashboard'
      });

      res.json(dashboardData);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  }
);

/**
 * GET /api/tax-admin/alerts
 * Get active alerts with filtering
 */
app.get('/api/tax-admin/alerts',
  authenticateToken,
  [
    query('severity').optional().isIn(['high', 'medium', 'low']),
    query('acknowledged').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { severity, acknowledged } = req.query;
      const alerts = await getAlerts({
        severity: severity as string,
        acknowledged: acknowledged === 'true',
        userRole: req.user!.role
      });

      res.json({ alerts });
    } catch (error) {
      console.error('Alerts error:', error);
      res.status(500).json({ error: 'Failed to load alerts' });
    }
  }
);

/**
 * POST /api/tax-admin/alerts/:id/acknowledge
 * Acknowledge an alert
 */
app.post('/api/tax-admin/alerts/:id/acknowledge',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      await acknowledgeAlert(id, {
        acknowledgedBy: req.user!.id,
        acknowledgedAt: new Date()
      });

      await logActivity({
        type: 'alert_acknowledged',
        actorId: req.user!.id,
        description: `Acknowledged alert ${id}`
      });

      res.json({ success: true, message: 'Alert acknowledged' });
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  }
);

// ============================================================================
// Jurisdictions & Registrations Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/jurisdictions
 * Get all tax registrations and their status
 */
app.get('/api/tax-admin/jurisdictions',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrations = await getTaxRegistrations();
      res.json({ registrations });
    } catch (error) {
      console.error('Jurisdictions error:', error);
      res.status(500).json({ error: 'Failed to load jurisdictions' });
    }
  }
);

/**
 * POST /api/tax-admin/jurisdictions/register
 * Request new state registration
 */
app.post('/api/tax-admin/jurisdictions/register',
  authenticateToken,
  requireRole(['admin']),
  [
    body('stateCode').isLength({ min: 2, max: 2 }).isAlpha(),
    body('filingFrequency').isIn(['monthly', 'quarterly', 'annual']),
    body('businessReason').isLength({ min: 10, max: 500 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stateCode, filingFrequency, businessReason } = req.body;
      
      const registration = await requestStateRegistration({
        stateCode,
        filingFrequency,
        businessReason,
        requestedBy: req.user!.id
      });

      await logActivity({
        type: 'registration_request',
        actorId: req.user!.id,
        description: `Requested registration for ${stateCode}`
      });

      res.status(201).json({ registration });
    } catch (error) {
      console.error('Registration request error:', error);
      res.status(500).json({ error: 'Failed to submit registration request' });
    }
  }
);

/**
 * PATCH /api/tax-admin/jurisdictions/:id
 * Update registration details (admin only)
 */
app.patch('/api/tax-admin/jurisdictions/:id',
  authenticateToken,
  requireRole(['admin']),
  [
    param('id').isUUID(),
    body('registrationNumber').optional().isLength({ min: 1 }),
    body('filingFrequency').optional().isIn(['monthly', 'quarterly', 'annual']),
    body('status').optional().isIn(['not_registered', 'pending', 'active', 'suspended'])
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const registration = await updateRegistration(id, updates);

      await logActivity({
        type: 'registration_updated',
        actorId: req.user!.id,
        description: `Updated registration ${id}`
      });

      res.json({ registration });
    } catch (error) {
      console.error('Update registration error:', error);
      res.status(500).json({ error: 'Failed to update registration' });
    }
  }
);

// ============================================================================
// Tax Exemptions Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/exemptions
 * Get exemption certificates with filtering
 */
app.get('/api/tax-admin/exemptions',
  authenticateToken,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'expired']),
    query('state').optional().isLength({ min: 2, max: 2 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, state, page = 1, limit = 20 } = req.query;
      
      const result = await getExemptionCertificates({
        status: status as string,
        state: state as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(result);
    } catch (error) {
      console.error('Exemptions error:', error);
      res.status(500).json({ error: 'Failed to load exemptions' });
    }
  }
);

/**
 * POST /api/tax-admin/exemptions/:id/review
 * Review exemption certificate (manager/admin only)
 */
app.post('/api/tax-admin/exemptions/:id/review',
  authenticateToken,
  requireRole(['admin', 'manager']),
  [
    param('id').isUUID(),
    body('decision').isIn(['approve', 'reject']),
    body('notes').optional().isLength({ max: 1000 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      
      const certificate = await reviewExemptionCertificate(id, {
        decision,
        notes,
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      });

      await logActivity({
        type: 'exemption_reviewed',
        actorId: req.user!.id,
        description: `${decision}d exemption certificate ${id}`
      });

      res.json({ certificate });
    } catch (error) {
      console.error('Review exemption error:', error);
      res.status(500).json({ error: 'Failed to review exemption' });
    }
  }
);

// ============================================================================
// Rates & Rules Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/rates
 * Get tax rates with provider comparison
 */
app.get('/api/tax-admin/rates',
  authenticateToken,
  [
    query('jurisdiction').optional().isLength({ min: 1 }),
    query('discrepanciesOnly').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { jurisdiction, discrepanciesOnly } = req.query;
      
      const rates = await getTaxRatesWithProviders({
        jurisdiction: jurisdiction as string,
        discrepanciesOnly: discrepanciesOnly === 'true'
      });

      res.json({ rates });
    } catch (error) {
      console.error('Rates error:', error);
      res.status(500).json({ error: 'Failed to load rates' });
    }
  }
);

/**
 * GET /api/tax-admin/providers/status
 * Get provider health status
 */
app.get('/api/tax-admin/providers/status',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const providerStatus = await getProviderHealthStatus();
      res.json({ providers: providerStatus });
    } catch (error) {
      console.error('Provider status error:', error);
      res.status(500).json({ error: 'Failed to load provider status' });
    }
  }
);

/**
 * POST /api/tax-admin/providers/sync
 * Trigger manual provider sync (admin only)
 */
app.post('/api/tax-admin/providers/sync',
  authenticateToken,
  requireRole(['admin']),
  [
    body('providerName').isLength({ min: 1 }),
    body('jurisdictionId').optional().isUUID()
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { providerName, jurisdictionId } = req.body;
      
      const syncResult = await triggerProviderSync({
        providerName,
        jurisdictionId,
        triggeredBy: req.user!.id
      });

      await logActivity({
        type: 'provider_sync',
        actorId: req.user!.id,
        description: `Triggered manual sync for ${providerName}`
      });

      res.json({ syncResult });
    } catch (error) {
      console.error('Provider sync error:', error);
      res.status(500).json({ error: 'Failed to trigger provider sync' });
    }
  }
);

// ============================================================================
// Reports Endpoints
// ============================================================================

/**
 * POST /api/tax-admin/reports/generate
 * Generate tax compliance reports
 */
app.post('/api/tax-admin/reports/generate',
  authenticateToken,
  requirePermission('generate_reports'),
  [
    body('reportType').isIn([
      'liabilities', 'filings', 'nexus', 'exemptions', 
      'discrepancies', 'gl-tieout', 'creator-1099s'
    ]),
    body('format').isIn(['excel', 'pdf', 'csv']),
    body('dateFrom').isISO8601(),
    body('dateTo').isISO8601(),
    body('filters').optional().isObject()
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reportType, format, dateFrom, dateTo, filters } = req.body;
      
      const report = await generateReport({
        type: reportType,
        format,
        dateRange: { from: new Date(dateFrom), to: new Date(dateTo) },
        filters,
        generatedBy: req.user!.id
      });

      await logActivity({
        type: 'report_generated',
        actorId: req.user!.id,
        description: `Generated ${reportType} report in ${format} format`
      });

      res.json({ report });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

/**
 * GET /api/tax-admin/reports/history
 * Get report generation history
 */
app.get('/api/tax-admin/reports/history',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const history = await getReportHistory({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        userId: req.user!.id
      });

      res.json(history);
    } catch (error) {
      console.error('Report history error:', error);
      res.status(500).json({ error: 'Failed to load report history' });
    }
  }
);

// ============================================================================
// Creator 1099 Management Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/creators/profiles
 * Get creator tax profiles for 1099 management
 */
app.get('/api/tax-admin/creators/profiles',
  authenticateToken,
  requirePermission('view_creator_tax_info'),
  [
    query('taxYear').optional().isInt({ min: 2020, max: 2030 }),
    query('filter').optional().isIn(['all', 'needs_1099', 'missing_tin', 'backup_withholding']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taxYear = new Date().getFullYear(), filter = 'all', page = 1, limit = 20 } = req.query;
      
      const profiles = await getCreatorTaxProfiles({
        taxYear: parseInt(taxYear as string),
        filter: filter as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json(profiles);
    } catch (error) {
      console.error('Creator profiles error:', error);
      res.status(500).json({ error: 'Failed to load creator profiles' });
    }
  }
);

/**
 * POST /api/tax-admin/creators/1099/generate
 * Generate 1099 forms for tax year (admin only)
 */
app.post('/api/tax-admin/creators/1099/generate',
  authenticateToken,
  requireRole(['admin']),
  [
    body('taxYear').isInt({ min: 2020, max: 2030 }),
    body('creatorIds').optional().isArray(),
    body('dryRun').optional().isBoolean()
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taxYear, creatorIds, dryRun = false } = req.body;
      
      const result = await generate1099Forms({
        taxYear,
        creatorIds,
        dryRun,
        generatedBy: req.user!.id
      });

      if (!dryRun) {
        await logActivity({
          type: '1099_generation',
          actorId: req.user!.id,
          description: `Generated ${result.formsGenerated} 1099 forms for ${taxYear}`
        });
      }

      res.json(result);
    } catch (error) {
      console.error('1099 generation error:', error);
      res.status(500).json({ error: 'Failed to generate 1099 forms' });
    }
  }
);

// ============================================================================
// Filing Approval Workflow Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/filings/pending-approval
 * Get filings pending approval
 */
app.get('/api/tax-admin/filings/pending-approval',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filings = await getPendingFilings();
      res.json({ filings });
    } catch (error) {
      console.error('Pending filings error:', error);
      res.status(500).json({ error: 'Failed to load pending filings' });
    }
  }
);

/**
 * POST /api/tax-admin/filings/:id/approve
 * Approve a tax filing
 */
app.post('/api/tax-admin/filings/:id/approve',
  authenticateToken,
  requireRole(['admin']),
  [
    param('id').isUUID(),
    body('notes').optional().isLength({ max: 500 })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const filing = await approveFiling(id, {
        approvedBy: req.user!.id,
        approvedAt: new Date(),
        notes
      });

      await logActivity({
        type: 'filing_approved',
        actorId: req.user!.id,
        description: `Approved filing ${id}`
      });

      res.json({ filing });
    } catch (error) {
      console.error('Filing approval error:', error);
      res.status(500).json({ error: 'Failed to approve filing' });
    }
  }
);

// ============================================================================
// Activity and Audit Log Endpoints
// ============================================================================

/**
 * GET /api/tax-admin/activity
 * Get recent system activity
 */
app.get('/api/tax-admin/activity',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['filing', 'sync', 'registration', 'exemption', 'alert'])
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 20, type } = req.query;
      
      const activity = await getRecentActivity({
        limit: parseInt(limit as string),
        type: type as string,
        userRole: req.user!.role
      });

      res.json({ activity });
    } catch (error) {
      console.error('Activity error:', error);
      res.status(500).json({ error: 'Failed to load activity' });
    }
  }
);

// ============================================================================
// Mock Database Functions
// ============================================================================

async function getUserById(userId: string) {
  // Mock implementation - replace with actual database query
  return {
    id: userId,
    email: 'admin@fanz.com',
    role: 'admin' as const,
    permissions: [
      'view_dashboard',
      'manage_registrations',
      'review_exemptions',
      'generate_reports',
      'view_creator_tax_info',
      'approve_filings',
      'manage_providers'
    ]
  };
}

async function getDashboardData(user: any): Promise<TaxDashboardData> {
  // Mock implementation
  return {
    totalLiabilities: 24150.75,
    pendingFilings: 3,
    activeRegistrations: 12,
    nexusStates: 2,
    form1099Count: 847,
    recentActivity: [
      {
        id: '1',
        type: 'filing',
        title: 'California Q3 return filed',
        description: 'Successfully submitted quarterly return',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ],
    upcomingFilings: [
      {
        id: '1',
        jurisdiction: 'California',
        period: '2024-Q3',
        amount: 15420.50,
        dueDate: new Date('2024-10-20'),
        status: 'pending_approval',
        filingType: 'quarterly'
      }
    ],
    nexusStatus: [
      {
        state: 'Texas',
        revenue: 485000,
        transactions: 2450,
        threshold: 500000,
        status: 'approaching',
        registrationStatus: 'not_registered'
      }
    ],
    alerts: [
      {
        id: '1',
        type: 'warning',
        title: 'Texas Nexus Approaching',
        message: 'Revenue at 97% of threshold',
        severity: 'high',
        acknowledged: false
      }
    ]
  };
}

// Additional mock functions would be implemented here...
async function getAlerts(filters: any) { return []; }
async function acknowledgeAlert(id: string, data: any) { return {}; }
async function getTaxRegistrations() { return []; }
async function requestStateRegistration(data: any) { return {}; }
async function updateRegistration(id: string, updates: any) { return {}; }
async function getExemptionCertificates(filters: any) { return { certificates: [], total: 0 }; }
async function reviewExemptionCertificate(id: string, review: any) { return {}; }
async function getTaxRatesWithProviders(filters: any) { return []; }
async function getProviderHealthStatus() { return []; }
async function triggerProviderSync(params: any) { return {}; }
async function generateReport(params: any) { return {}; }
async function getReportHistory(params: any) { return { reports: [], total: 0 }; }
async function getCreatorTaxProfiles(params: any) { return { profiles: [], total: 0 }; }
async function generate1099Forms(params: any) { return { formsGenerated: 0 }; }
async function getPendingFilings() { return []; }
async function approveFiling(id: string, approval: any) { return {}; }
async function getRecentActivity(params: any) { return []; }
async function logActivity(activity: any) { return {}; }

// ============================================================================
// Error Handling Middleware
// ============================================================================

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

app.get('/api/tax-admin/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Start server
const PORT = process.env.TAX_ADMIN_API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`FanzDash Tax Admin API server running on port ${PORT}`);
});

export default app;
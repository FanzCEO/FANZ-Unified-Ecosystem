import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOfferSchema, insertClickSchema, insertConversionSchema, insertPayoutSchema } from "@shared/schema";
import { z } from "zod";
import { verifyHealth } from "./scripts/verify-health.js";
import { verifyWebhooks } from "./scripts/verify-webhooks.js";
import { registerAuthRoutes } from "./auth-routes";
import { registerKYCRoutes } from "./kyc-routes";
import { registerNotificationRoutes } from "./notification-routes";
import { registerCurrencyRoutes } from "./currency-routes";
import { fanzDashService } from "./services/fanzdash";
import { fraudDetectionService } from "./services/fraud-detection";
import { advancedAnalyticsService } from "./services/analytics";
import { 
  authenticateJWT, 
  requireRole, 
  requireKYCStatus, 
  requireKYCTier, 
  requireAffiliateAccess, 
  optionalAuth, 
  rateLimit, 
  validateWebhookSignature 
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes
  registerAuthRoutes(app);
  
  // Register KYC routes
  registerKYCRoutes(app);
  
  // Register notification routes
  registerNotificationRoutes(app);
  
  // Register currency routes
  registerCurrencyRoutes(app);
  
  // Apply rate limiting to all API routes
  app.use("/api", rateLimit(200, 60000)); // 200 requests per minute for general API
  
  // Health and system endpoints (public)
  app.get("/api/health", async (req, res) => {
    try {
      const checks = await verifyHealth();
      const allHealthy = checks.every(c => c.status === 'ok');
      
      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });

  app.get("/api/system", async (req, res) => {
    try {
      const healthChecks = await verifyHealth();
      const webhookChecks = await verifyWebhooks();
      
      const systemInfo = {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        competitive_advantages: {
          platform_fees: '0%',
          adult_friendly: true,
          fun_ecosystem: true,
          creator_to_creator: true,
          multi_layer_tracking: true,
          full_compliance: true
        },
        health: {
          overall: healthChecks.every(c => c.status === 'ok') ? 'healthy' : 'degraded',
          services: healthChecks
        },
        webhooks: {
          overall: webhookChecks.every(c => c.status === 'ok') ? 'operational' : 'degraded', 
          tests: webhookChecks
        },
        features: {
          clickTracking: !!process.env.CLICK_TTL_SECONDS,
          s2sPostbacks: !!process.env.POSTBACK_SECRET,
          webhookIntegration: !!process.env.WEBHOOK_SECRET,
          kycCompliance: !!process.env.VERIFYMY_API_KEY,
          adultContent: true,
          zeroFees: true,
          funEcosystem: true
        }
      };
      
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'System check failed'
      });
    }
  });

  // Metrics endpoint (public - used by FanzDash for monitoring)
  app.get("/api/metrics", async (req, res) => {
    try {
      // Get platform metrics in Prometheus format for monitoring
      const metrics = await fanzDashService.collectMetrics();
      
      // Return metrics in both JSON and Prometheus format
      const acceptHeader = req.get('Accept');
      
      if (acceptHeader?.includes('application/prometheus') || acceptHeader?.includes('text/plain')) {
        // Prometheus format
        const prometheusMetrics = `
# HELP fanzfiliate_users_total Total number of users
# TYPE fanzfiliate_users_total gauge
fanzfiliate_users_total{role="all"} ${metrics.metrics.users.total}
fanzfiliate_users_total{role="affiliate"} ${metrics.metrics.users.affiliates}
fanzfiliate_users_total{role="advertiser"} ${metrics.metrics.users.advertisers}
fanzfiliate_users_total{role="kyc_approved"} ${metrics.metrics.users.kycApproved}

# HELP fanzfiliate_earnings_total Total earnings in USD
# TYPE fanzfiliate_earnings_total gauge
fanzfiliate_earnings_total ${metrics.metrics.financial.totalEarnings}

# HELP fanzfiliate_balance_available Available balance in USD
# TYPE fanzfiliate_balance_available gauge
fanzfiliate_balance_available ${metrics.metrics.financial.availableBalance}

# HELP fanzfiliate_balance_pending Pending balance in USD
# TYPE fanzfiliate_balance_pending gauge
fanzfiliate_balance_pending ${metrics.metrics.financial.pendingBalance}

# HELP fanzfiliate_clicks_total Total number of clicks
# TYPE fanzfiliate_clicks_total counter
fanzfiliate_clicks_total ${metrics.metrics.activity.totalClicks}

# HELP fanzfiliate_conversions_total Total number of conversions
# TYPE fanzfiliate_conversions_total counter
fanzfiliate_conversions_total ${metrics.metrics.activity.totalConversions}

# HELP fanzfiliate_conversion_rate Conversion rate percentage
# TYPE fanzfiliate_conversion_rate gauge
fanzfiliate_conversion_rate ${metrics.metrics.activity.conversionRate}

# HELP fanzfiliate_offers_active Number of active offers
# TYPE fanzfiliate_offers_active gauge
fanzfiliate_offers_active ${metrics.metrics.activity.offersActive}

# HELP fanzfiliate_kyc_completion_rate KYC completion rate percentage
# TYPE fanzfiliate_kyc_completion_rate gauge
fanzfiliate_kyc_completion_rate ${metrics.metrics.compliance.kycCompletionRate}

# HELP fanzfiliate_kyc_tier_average Average KYC tier
# TYPE fanzfiliate_kyc_tier_average gauge
fanzfiliate_kyc_tier_average ${metrics.metrics.compliance.averageKycTier}
        `.trim();
        
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(prometheusMetrics);
      } else {
        // JSON format
        res.json({
          cluster: metrics.clusterId,
          timestamp: metrics.timestamp,
          ...metrics.metrics
        });
      }
      
    } catch (error) {
      console.error('Metrics collection error:', error);
      res.status(500).json({
        error: 'Failed to collect metrics',
        code: 'METRICS_ERROR'
      });
    }
  });

  // User routes (protected)
  app.get("/api/user/:id", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/user/sso/:ssoUserId", async (req, res) => {
    try {
      const user = await storage.getUserBySsoId(req.params.ssoUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Offer routes
  app.get("/api/offers", async (req, res) => {
    try {
      const { status, advertiserId, isActive } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (advertiserId) filters.advertiserId = advertiserId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const offers = await storage.getOffers(filters);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/offers/:id", async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offer" });
    }
  });

  app.post("/api/offers", async (req, res) => {
    try {
      const offerData = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(offerData);
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid offer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // Tracking routes
  app.get("/api/click", rateLimit(200, 60000), async (req, res) => {
    try {
      const { offer_id, pub_id, sub1, sub2, sub3, sub4, sub5, fp } = req.query;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";
      const referrer = req.get("Referer") || null;
      
      if (!offer_id || !pub_id) {
        return res.status(400).json({ error: "offer_id and pub_id are required" });
      }

      // Perform fraud detection analysis
      const fraudAnalysis = await fraudDetectionService.analyzeClick({
        ip: ipAddress,
        userAgent,
        referrer: referrer || undefined,
        timestamp: new Date(),
        affiliateId: pub_id as string,
        offerId: offer_id as string,
        subIds: {
          sub1: sub1 as string || '',
          sub2: sub2 as string || '',
          sub3: sub3 as string || '',
          sub4: sub4 as string || '',
          sub5: sub5 as string || '',
        },
        geoLocation: {
          country: 'Unknown', // TODO: Implement geo-IP lookup
          region: 'Unknown',
          city: 'Unknown',
          timezone: 'Unknown',
        },
      });

      // Block high-risk clicks
      if (fraudAnalysis.risk === 'critical' || fraudAnalysis.score > 80) {
        console.warn(`🚫 Blocked high-risk click: IP=${ipAddress}, Score=${fraudAnalysis.score}, Reasons=${fraudAnalysis.reasons.join(', ')}`);
        return res.status(403).json({ 
          error: "Click blocked due to suspicious activity",
          code: "FRAUD_DETECTED" 
        });
      }

      const clickData = {
        offerId: offer_id as string,
        affiliateId: pub_id as string,
        sub1: sub1 as string || null,
        sub2: sub2 as string || null,
        sub3: sub3 as string || null,
        sub4: sub4 as string || null,
        sub5: sub5 as string || null,
        ipAddress,
        userAgent,
        referrer,
        deviceFingerprint: fp as string || null,
        geoCountry: null,
        geoCity: null,
        trafficType: null,
        // fraudScore: fraudAnalysis.score, // Remove as this field doesn't exist in schema
        fraudRisk: fraudAnalysis.risk,
        fraudReasons: fraudAnalysis.reasons.join('; '),
      };

      const click = await storage.createClick(clickData);
      
      // Log fraud analysis for high-risk clicks
      if (fraudAnalysis.risk === 'high' || fraudAnalysis.score > 60) {
        console.warn(`⚠️  High-risk click recorded: ID=${click.id}, Score=${fraudAnalysis.score}, IP=${ipAddress}`);
      }
      
      // Redirect to landing page
      const offer = await storage.getOffer(offer_id as string);
      if (offer) {
        // Add tracking query parameter to landing page for conversion attribution
        const landingUrl = new URL(offer.landingPageUrl);
        landingUrl.searchParams.set('click_id', click.id);
        res.redirect(landingUrl.toString());
      } else {
        res.status(404).json({ error: "Offer not found" });
      }
    } catch (error) {
      console.error('Click tracking error:', error);
      res.status(500).json({ error: "Failed to process click" });
    }
  });

  app.get("/api/postback", validateWebhookSignature('POSTBACK_SECRET'), async (req, res) => {
    try {
      const { txid, status, amount, currency, pub_id, click_id, email, phone, delay } = req.query;
      
      if (!txid || !status || !amount || !pub_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Get click data if click_id is provided
      let clickData = null;
      if (click_id) {
        try {
          clickData = await storage.getClick(click_id as string);
        } catch (error) {
          console.warn(`Click not found for conversion: ${click_id}`);
        }
      }

      // Perform fraud detection on conversion
      const conversionDelay = delay ? parseInt(delay as string) : 
        (clickData ? Math.floor((Date.now() - new Date(clickData.createdAt).getTime()) / 1000) : 0);

      const fraudAnalysis = await fraudDetectionService.analyzeConversion({
        transactionId: txid as string,
        clickId: click_id as string || 'unknown',
        value: parseFloat(amount as string),
        currency: (currency as string) || 'USD',
        timestamp: new Date(),
        conversionDelay,
        customerData: {
          email: email as string,
          phone: phone as string,
        },
      });

      // Block high-risk conversions
      if (fraudAnalysis.risk === 'critical' || fraudAnalysis.score > 85) {
        console.warn(`🚫 Blocked high-risk conversion: TxID=${txid}, Score=${fraudAnalysis.score}, Reasons=${fraudAnalysis.reasons.join(', ')}`);
        return res.status(403).json({ 
          error: "Conversion blocked due to suspicious activity",
          code: "FRAUD_DETECTED",
          fraudAnalysis: {
            score: fraudAnalysis.score,
            risk: fraudAnalysis.risk,
            reasons: fraudAnalysis.reasons
          }
        });
      }

      // Check if conversion already exists
      let conversion = await storage.getConversionByTxid(txid as string);
      
      if (conversion) {
        // Update existing conversion with fraud data
        conversion = await storage.updateConversion(conversion.id, {
          status: status as any,
          approvedAt: status === 'approved' ? new Date() : undefined,
          rejectedAt: status === 'rejected' ? new Date() : undefined,
          // Note: Fraud data stored in metadata for now
        });
      } else {
        // Create new conversion with fraud analysis
        const conversionData = {
          clickId: click_id as string || null,
          offerId: clickData?.offerId || "offer-1", // Derive from click or default
          affiliateId: pub_id as string,
          txid: txid as string,
          status: fraudAnalysis.score > 70 ? 'pending' : status as any, // Hold high-risk conversions
          amount: amount as string,
          currency: (currency as string) || "USD",
          commission: amount as string, // Assuming 1:1 for now
          metadata: {
            customerEmail: email as string,
            customerPhone: phone as string,
            conversionDelay,
            fraudAnalysis: {
              score: fraudAnalysis.score,
              risk: fraudAnalysis.risk,
              reasons: fraudAnalysis.reasons,
              confidence: fraudAnalysis.confidence,
            }
          },
          // Note: Fraud data stored in metadata for now
        };

        conversion = await storage.createConversion(conversionData);
        
        // Log fraud analysis for suspicious conversions
        if (fraudAnalysis.risk === 'high' || fraudAnalysis.score > 60) {
          console.warn(`⚠️  High-risk conversion created: ID=${conversion.id}, TxID=${txid}, Score=${fraudAnalysis.score}`);
        }
        
        // Publish conversion event to FanzDash
        await fanzDashService.publishConversion(conversion);
      }

      res.json({ 
        success: true, 
        conversion,
        fraudAnalysis: {
          score: fraudAnalysis.score,
          risk: fraudAnalysis.risk,
          action: fraudAnalysis.score > 70 ? 'held_for_review' : 'approved'
        }
      });
    } catch (error) {
      console.error('Postback processing error:', error);
      res.status(500).json({ error: "Failed to process postback" });
    }
  });

  // Analytics routes (protected - affiliates can only see their own data)
  app.get("/api/analytics/affiliate/:id", authenticateJWT, requireAffiliateAccess('id'), async (req, res) => {
    try {
      const { days } = req.query;
      const stats = await storage.getAffiliateStats(req.params.id, days ? parseInt(days as string) : 30);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Advanced analytics endpoints (admin)
  app.post("/api/analytics/funnel", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const { start, end, granularity, filters } = req.body;
      const funnel = await advancedAnalyticsService.generateConversionFunnel({ start, end, granularity }, filters);
      res.json(funnel);
    } catch (error) {
      console.error('Funnel analytics error:', error);
      res.status(500).json({ error: "Failed to generate funnel analytics" });
    }
  });

  app.post("/api/analytics/cohort", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const { start, end, granularity = 'day', cohortType, filters } = req.body;
      const cohorts = await advancedAnalyticsService.performCohortAnalysis({ start, end, granularity }, cohortType, filters);
      res.json(cohorts);
    } catch (error) {
      console.error('Cohort analytics error:', error);
      res.status(500).json({ error: "Failed to generate cohort analytics" });
    }
  });

  app.post("/api/analytics/forecast", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const { start, end, granularity = 'day', periods, filters } = req.body;
      const forecast = await advancedAnalyticsService.generateRevenueForecasting({ start, end, granularity }, periods, filters);
      res.json(forecast);
    } catch (error) {
      console.error('Forecasting error:', error);
      res.status(500).json({ error: "Failed to generate revenue forecast" });
    }
  });

  app.post("/api/analytics/dashboard", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const { start, end, granularity = 'day', filters } = req.body;
      const summary = await advancedAnalyticsService.getDashboardSummary({ start, end, granularity }, filters);
      res.json(summary);
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(500).json({ error: "Failed to generate dashboard summary" });
    }
  });

  // Balance routes (protected - users can only see their own balance)
  app.get("/api/balance/:userId", authenticateJWT, requireAffiliateAccess('userId'), async (req, res) => {
    try {
      const balance = await storage.getUserBalance(req.params.userId);
      if (!balance) {
        return res.status(404).json({ error: "Balance not found" });
      }
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Payout routes (protected - affiliates only, KYC required for requests)
  app.get("/api/payouts/:affiliateId", authenticateJWT, requireRole('affiliate'), requireAffiliateAccess('affiliateId'), async (req, res) => {
    try {
      const payouts = await storage.getPayoutsByAffiliate(req.params.affiliateId);
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  app.post("/api/payouts", authenticateJWT, requireRole('affiliate'), requireKYCStatus('approved'), requireKYCTier(1), async (req, res) => {
    try {
      const payoutData = insertPayoutSchema.parse(req.body);
      const payout = await storage.createPayout(payoutData);
      
      // Publish payout request event to FanzDash
      await fanzDashService.publishPayoutRequest(payout);
      
      res.status(201).json(payout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payout data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create payout request" });
    }
  });

  // Recent activity route (protected - affiliates can only see their own activity)
  app.get("/api/activity/:affiliateId", authenticateJWT, requireAffiliateAccess('affiliateId'), async (req, res) => {
    try {
      const clicks = await storage.getClicksByAffiliate(req.params.affiliateId, 10);
      const conversions = await storage.getConversionsByAffiliate(req.params.affiliateId, 10);
      
      res.json({
        clicks,
        conversions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Fraud detection routes (admin only)
  app.get("/api/fraud/statistics", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const stats = fraudDetectionService.getFraudStatistics();
      res.json({
        timestamp: new Date().toISOString(),
        statistics: stats,
        thresholds: {
          highRisk: 70,
          mediumRisk: 40,
          blockingThreshold: 80,
          conversionHold: 70,
        }
      });
    } catch (error) {
      console.error('Fraud statistics error:', error);
      res.status(500).json({ error: "Failed to fetch fraud statistics" });
    }
  });

  // Device fingerprinting endpoint (public)
  app.post("/api/fraud/fingerprint", rateLimit(50, 60000), async (req, res) => {
    try {
      const fingerprintData = req.body;
      const fingerprint = fraudDetectionService.generateDeviceFingerprint(fingerprintData);
      
      res.json({ 
        success: true,
        fingerprint,
        note: 'Include this fingerprint in tracking URLs as fp parameter'
      });
    } catch (error) {
      console.error('Fingerprint generation error:', error);
      res.status(500).json({ error: "Failed to generate fingerprint" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

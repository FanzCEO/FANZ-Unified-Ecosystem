#!/usr/bin/env node

/**
 * FANZ Cross-Platform Ad Service
 * Adult-friendly payment processors only (NO Stripe/PayPal)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: resolve(__dirname, '../../../env/.env.local') });

// Load policy rules
const policyRules = JSON.parse(
  readFileSync(resolve(__dirname, '../policy/rules.json'), 'utf8')
);

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(compression());

// CORS configuration for FANZ platforms
app.use(cors({
  origin: [
    'https://boyfanz.com',
    'https://girlfanz.com', 
    'https://pupfanz.com',
    'https://taboofanz.com',
    'https://daddiesfanz.com',
    'https://cougarfanz.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: { error: 'Too many requests, please try again later' }
});

const adsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // ad requests per minute
  keyGenerator: (req) => {
    return req.headers['x-fanz-user'] || req.ip;
  },
  message: { error: 'Frequency cap exceeded' }
});

app.use('/api', generalLimiter);
app.use('/api/ads', adsLimiter);

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Middleware to validate adult-friendly payment processors
const validatePaymentProcessor = (req, res, next) => {
  if (req.body && req.body.paymentProcessor) {
    const processor = req.body.paymentProcessor.toLowerCase();
    
    if (policyRules.billing.prohibitedProcessors.includes(processor)) {
      console.warn(`Blocked prohibited payment processor: ${processor}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        error: 'PROHIBITED_PROCESSOR',
        message: `Payment processor '${processor}' is prohibited. FANZ only supports adult-content-friendly processors.`,
        allowedProcessors: policyRules.billing.allowedProcessors
      });
    }
  }
  next();
};

// Middleware to log ad requests
const logAdRequest = (req, res, next) => {
  console.log('Ad request received', {
    placement: req.query.placement,
    platform: req.query.platform,
    device: req.query.device,
    geo: req.query.geo,
    userHash: req.headers['x-fanz-user'] ? 'present' : 'missing',
    ip: req.ip
  });
  next();
};

/**
 * GET /api/ads - Get ad for placement
 */
app.get('/api/ads', logAdRequest, (req, res) => {
  const { placement, platform, device = 'desktop', geo = 'US' } = req.query;
  const userHash = req.headers['x-fanz-user'];
  
  // Validate required parameters
  if (!placement || !platform) {
    return res.status(400).json({
      error: 'MISSING_PARAMS',
      message: 'placement and platform are required'
    });
  }

  // Mock ad response with adult-friendly content
  const mockAd = {
    creativeUrl: `https://cdn.fanz.network/ads/${platform}/${placement.toLowerCase()}-demo.jpg`,
    clickUrl: `https://${platform}.com/creator/featured?utm_source=fanz-ads&utm_placement=${placement}`,
    alt: `Featured ${platform} creator content`,
    width: 970,
    height: 90,
    tracking: {
      impressionUrl: `https://tracker.fanz.network/impression?id=demo-${Date.now()}`,
      viewableUrl: `https://tracker.fanz.network/viewable?id=demo-${Date.now()}`,
      clickUrl: `https://tracker.fanz.network/click?id=demo-${Date.now()}`
    },
    disclosure: 'Sponsored',
    cacheTtl: 300,
    campaignId: `demo-${platform}-${placement}`,
    creativeId: `creative-${Date.now()}`
  };

  res.json(mockAd);
});

/**
 * POST /api/campaigns/init - Initialize campaign with adult-friendly payment
 */
app.post('/api/campaigns/init', validatePaymentProcessor, (req, res) => {
  const { buyerId, budget, bidType, placements } = req.body;
  
  // Validate required fields
  if (!buyerId || !budget || !bidType || !placements) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'buyerId, budget, bidType, and placements are required'
    });
  }

  // Validate budget
  if (budget < policyRules.targeting.minBudget) {
    return res.status(400).json({
      error: 'BUDGET_TOO_LOW',
      message: `Minimum budget is $${policyRules.targeting.minBudget}`
    });
  }

  // Generate campaign
  const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Select adult-friendly payment processor (rotate for demo)
  const allowedProcessors = policyRules.billing.allowedProcessors;
  const selectedProcessor = allowedProcessors[Math.floor(Math.random() * allowedProcessors.length)];
  
  console.log('Campaign initialized', {
    campaignId,
    buyerId,
    budget,
    selectedProcessor,
    placements
  });

  const response = {
    campaignId,
    checkoutMethod: selectedProcessor,
    checkoutUrl: `https://${selectedProcessor}.com/checkout?campaign=${campaignId}&amount=${budget}`,
    paymentAmount: budget,
    paymentCurrency: 'USD'
  };

  // Add crypto address for crypto processors
  if (['bitpay', 'coinbase_commerce', 'nowpayments'].includes(selectedProcessor)) {
    response.cryptoAddress = `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`; // Demo address
  }

  res.status(201).json(response);
});

/**
 * POST /api/campaigns/:id/creatives - Upload campaign creatives
 */
app.post('/api/campaigns/:id/creatives', (req, res) => {
  const { id: campaignId } = req.params;
  const creatives = req.body;

  if (!Array.isArray(creatives) || creatives.length === 0) {
    return res.status(400).json({
      error: 'INVALID_CREATIVES',
      message: 'Creatives must be a non-empty array'
    });
  }

  // Validate each creative
  for (const creative of creatives) {
    // Check required fields
    for (const field of policyRules.creative.requiredFields) {
      if (!creative[field]) {
        return res.status(400).json({
          error: 'MISSING_CREATIVE_FIELD',
          message: `Creative missing required field: ${field}`
        });
      }
    }

    // Check file size
    const maxSize = policyRules.creative.maxBytes[creative.type];
    if (creative.sizeBytes && creative.sizeBytes > maxSize) {
      return res.status(400).json({
        error: 'CREATIVE_TOO_LARGE',
        message: `${creative.type} creative exceeds ${maxSize} bytes limit`
      });
    }

    // Check category
    if (creative.category && policyRules.categories.blocked.includes(creative.category)) {
      return res.status(400).json({
        error: 'BLOCKED_CATEGORY',
        message: `Category '${creative.category}' is not allowed`
      });
    }
  }

  console.log('Creatives uploaded', { campaignId, count: creatives.length });
  
  res.json({ 
    message: 'Creatives uploaded successfully',
    campaignId,
    creativesCount: creatives.length 
  });
});

/**
 * POST /api/campaigns/:id/activate - Activate campaign
 */
app.post('/api/campaigns/:id/activate', (req, res) => {
  const { id: campaignId } = req.params;
  
  console.log('Campaign activated', { campaignId });
  
  res.json({ 
    message: 'Campaign activated successfully',
    campaignId,
    status: 'active'
  });
});

/**
 * POST /api/policy/validate - Validate creative content
 */
app.post('/api/policy/validate', (req, res) => {
  const creative = req.body;
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of policyRules.creative.requiredFields) {
    if (!creative[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check category
  if (creative.category) {
    if (policyRules.categories.blocked.includes(creative.category)) {
      errors.push(`Category '${creative.category}' is blocked`);
    } else if (policyRules.categories.restricted.includes(creative.category)) {
      warnings.push(`Category '${creative.category}' requires additional review`);
    }
  }

  // Check file size
  if (creative.sizeBytes && creative.type) {
    const maxSize = policyRules.creative.maxBytes[creative.type];
    if (creative.sizeBytes > maxSize) {
      errors.push(`File size ${creative.sizeBytes} exceeds limit of ${maxSize} bytes`);
    }
  }

  res.json({
    isValid: errors.length === 0,
    errors,
    warnings
  });
});

/**
 * GET /api/ads/:id/why - Explain ad targeting
 */
app.get('/api/ads/:id/why', (req, res) => {
  const { id: adId } = req.params;
  
  // Mock transparency response
  res.json({
    factors: [
      { reason: 'Platform targeting matches your preferences', weight: 0.4 },
      { reason: 'Geographic location relevance', weight: 0.3 },
      { reason: 'Creator promotion content', weight: 0.3 }
    ]
  });
});

/**
 * POST /api/webhooks/billing - Handle payment webhooks
 */
app.post('/api/webhooks/billing', (req, res) => {
  const webhook = req.body;
  
  console.log('Billing webhook received', {
    processor: req.headers['x-processor'] || 'unknown',
    event: webhook.event_type || webhook.type,
    amount: webhook.amount
  });

  // In production, validate webhook signature
  // Process payment confirmation
  // Activate campaigns

  res.json({ received: true });
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fanz-ad-service',
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FANZ Ad Service running on port ${PORT}`);
  console.log('🔐 Adult-friendly payment processors only');
  console.log('❌ Stripe/PayPal blocked per FANZ rules');
  console.log(`📊 Policy rules loaded: ${policyRules.categories.allowed.length} allowed categories`);
});
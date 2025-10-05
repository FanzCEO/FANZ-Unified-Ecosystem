// FANZ Security Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many API requests' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' }
});

const securityMiddleware = (app) => {
  // Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        mediaSrc: ["'self'", "blob:", "https:"]
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true }
  }));

  // FANZ-specific headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Rating', 'adult');
    res.setHeader('X-Age-Verification', 'required');
    res.setHeader('X-Powered-By', 'FANZ');
    next();
  });

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
      ['https://app.fanz.network'] : ['http://localhost:3000'],
    credentials: true
  }));

  // Rate limiting
  app.use('/api/', apiLimiter);
  app.use('/auth/', authLimiter);
};

module.exports = { securityMiddleware };

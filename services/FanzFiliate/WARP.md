# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

FanzFiliate is the comprehensive affiliate marketing platform within the **Fanz Ecosystem**—a unified suite of adult-friendly platforms and services designed specifically for content creators and businesses in the adult industry. As a core component of the Fanz Ecosystem, FanzFiliate seamlessly integrates with FanzDash (central management), FanzSSO (unified authentication), FanzMediaCore (content management), FanzFinance OS (financial operations), and VerifyMy KYC (identity verification) to provide a complete, creator-first affiliate marketing solution.

## Architecture

This is a full-stack TypeScript application with:

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui components + Tailwind CSS
- **Backend**: Express.js + TypeScript + RESTful API endpoints  
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: FanzSSO JWT-based integration + Express sessions
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state

### Project Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI components (shadcn/ui + custom)
│   │   ├── pages/         # Main application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── main.tsx       # Application entry point
│   └── index.html         # HTML template
├── server/                # Express.js API server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations layer
│   └── vite.ts           # Vite dev server integration
├── shared/                # Shared TypeScript types and schemas
│   └── schema.ts          # Drizzle database schema definitions
├── scripts/               # Production verification and utility scripts
│   ├── env-gate.cjs       # Environment validation
│   ├── prep-prod.cjs      # Production readiness verification
│   └── print-ready.cjs    # Deployment success banner
└── attached_assets/       # Documentation and specification files
```

## Quickstart

- Prerequisites: Node.js 20.x, npm
- Copy environment template and set values: `cp .env.example .env`
- Install dependencies: `npm install`
- Verify env: `node scripts/env-gate.cjs`
- Start dev (API + client on port 5000): `npm run dev`
- Build for production: `npm run build`
- Start production: `npm start`

## Common Development Commands

**Package Manager**: npm (uses package-lock.json)

### Development Setup
```bash
# Install dependencies
npm install

# Start development server (runs both frontend and API on port 5000)
npm run dev

# Type checking
npm run check

# Database operations
npm run db:push    # Push schema changes to database
```

### Build and Production
```bash
# Build for production (builds both frontend and API)
npm run build

# Start production server
npm start

# Production readiness verification (comprehensive health checks)
node scripts/prep-prod.cjs

# Environment validation only
node scripts/env-gate.cjs
```

### Testing
- Automated tests are not configured in this repository yet (no test script present in package.json).
- Type-checking is available via TypeScript:
```bash
npm run check
```
- To validate key endpoints manually during development:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/system
```

### Replit-Specific
- **Run Command**: `npm run dev` (configured in `.replit`)
- **Port**: 5000 (mapped to external port 80)
- **Environment Variables**: Set in Replit → Tools → Secrets
- **Deployment**: Autoscale deployment target configured

## Key Features & Components

### 1. Affiliate Tracking System
- **Tracking URLs**: Generate unique tracking links with sub-ID support (sub1-sub5)
- **Click Attribution**: Records IP, user agent, referrer, geo data for fraud prevention
- **Conversion Tracking**: S2S postback system with transaction ID deduplication
- **Anti-Fraud**: Device fingerprinting, IP validation, conversion rate monitoring

### 2. Offer Marketplace  
- **Offer Management**: CPA/CPS/CPL/RevShare commission structures
- **Geo Targeting**: Allowed/restricted geographic regions per offer
- **Creative Assets**: Banner, widget, text, and HTML creative management
- **Status Workflow**: Draft → Submitted → In Review → Approved → Live

### 3. Payout Processing (FanzFinance OS Integration)
- **Multi-Provider Support**: Paxum, CosmoPayment, Bitsafe, USDT, Wise, Payoneer
- **Adult-Friendly**: 0% platform fees, no content restrictions
- **KYC-Gated**: 3-tier verification system with earning limits
- **Real-Time Balances**: Available, pending, and total earnings tracking

### 4. KYC Compliance
- **VerifyMy Integration**: Webhook-based verification workflow
- **Tier System**: 0 (unverified) → 3 (fully verified) with progressive earning limits
- **Status Tracking**: unverified → initiated → in_review → approved/failed
- **Endpoints**: Webhook at `/api/webhooks/kyc/verifymy` (HMAC-protected), status fetch/updates

### 5. Analytics & Reporting
- **Performance Metrics**: Click-through rates, conversion rates, earnings
- **Real-Time Dashboard**: Live stats, recent activity, competitive advantages
- **Affiliate Attribution**: Last-touch attribution with configurable TTL

## Database Schema (Drizzle ORM)

**Configuration**: `drizzle.config.ts` (uses `shared/schema.ts`)

### Core Tables
- **users**: Affiliate/advertiser accounts with SSO integration
- **offers**: CPA campaigns with targeting and commission rules
- **clicks**: Tracking pixel data with fraud detection fields  
- **conversions**: Approved transactions with commission calculations
- **payouts**: Multi-provider disbursement records
- **creatives**: Marketing assets linked to offers
- **tracking_links**: Generated affiliate tracking URLs
- **user_balances**: Real-time earnings and payout eligibility

### Database Operations
```bash
# Apply schema changes to database
npm run db:push

# View current schema (if Drizzle Studio configured)  
npx drizzle-kit studio
```

**Note**: The application uses in-memory storage with seed data by default. Sample users, offers, and balances are automatically created when the MemStorage class is instantiated (see `server/storage.ts`). This includes:
- Affiliate user: `john@example.com` (ID: `aff-1`, KYC approved)
- Advertiser user: `advertiser@example.com` (ID: `adv-1`)
- Sample adult-content offers with CPA/Hybrid commission structures

## Environment Configuration

**Critical Variables** (all required for production):

### Database & Core
- `DATABASE_URL`: PostgreSQL connection string (Neon Database)
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 5000)

### Security & Sessions
- `JWT_SECRET`: Token signing key
- `JWT_ISS`, `JWT_AUD`: JWT issuer/audience validation
- `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`: Token expiration times
- `POSTBACK_SECRET`: S2S webhook signature verification
- `WEBHOOK_SECRET`: Inbound webhook validation

### External Integrations
- `VERIFYMY_API_URL`, `VERIFYMY_API_KEY`: KYC provider credentials
- `WEB_APP_URL`, `API_URL`: Application base URLs
- `PUBLIC_DOMAIN`: Click tracking domain
- `CLICK_TTL_SECONDS`: Attribution window duration

### FanzDash Integration
- `FANZDASH_API_URL`: Central dashboard API endpoint
- `FANZDASH_API_KEY`: Authentication key for FanzDash
- `FANZDASH_CLUSTER_ID`: Platform identifier (typically 'fanzfiliate')
- `FANZDASH_METRICS_ENDPOINT`: Metrics reporting endpoint

### FanzSSO Integration
- `FANZSSO_API_URL`: SSO service API endpoint
- `FANZSSO_API_KEY`: Client secret/API key for SSO
- `FANZSSO_JWT_SECRET`: Shared secret to verify SSO-issued JWTs (dev/local)

### Storage (S3-compatible)
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`: Object storage configuration
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: Storage credentials

**Environment Validation**: Run `node scripts/env-gate.cjs` to verify all required variables are set.

## API Endpoints

### Health & System
- `GET /api/health`: Service health checks and status
- `GET /api/system`: Comprehensive system information and competitive advantages
- `GET /api/metrics`: Platform metrics (JSON) or Prometheus format when Accept: text/plain

### Auth & Session
- `POST /api/auth/sso`: Login/register via FanzSSO (returns access/refresh tokens)
- `POST /api/auth/login`: Email/password backup login (dev)
- `POST /api/auth/register`: Email/password backup register (dev)
- `POST /api/auth/refresh`: Refresh tokens
- `GET /api/auth/me`: Current user profile
- `POST /api/auth/logout`: Logout (stateless)
- `PUT /api/auth/profile`: Update current user profile

### User Management  
- `GET /api/user/:id` (admin): User profile by ID
- `GET /api/user/sso/:ssoUserId`: User lookup by SSO ID
- `POST /api/users`: Create new user account

### Offer Management
- `GET /api/offers`: List offers with filtering (status, advertiser, active)
- `GET /api/offers/:id`: Single offer details
- `POST /api/offers`: Create new offer

### Tracking & Conversions
- `GET /api/click`: Click tracking endpoint (redirects to landing page)
- `GET /api/postback`: S2S conversion postback handler (HMAC-protected)
- `GET /api/analytics/affiliate/:id` (auth, self): Performance statistics
- `GET /api/activity/:affiliateId` (auth, self): Recent clicks and conversions

### Financial Operations
- `GET /api/balance/:userId` (auth, self): Current earnings balance
- `GET /api/payouts/:affiliateId` (auth affiliate, self): Payout history
- `POST /api/payouts` (auth affiliate, KYC approved, Tier ≥ 1): Request new payout

## FANZ Ecosystem Integration

### FanzDash Integration
FanzFiliate operates as a **connected platform/cluster** within FanzDash, the central management dashboard for the FANZ ecosystem:

- **Unified Dashboard**: FanzFiliate metrics and controls accessible through FanzDash interface
- **Cross-Platform Analytics**: Affiliate performance data flows into unified FanzDash reporting
- **Centralized User Management**: User accounts and permissions managed through FanzDash
- **Resource Orchestration**: FanzDash coordinates deployments and scaling across all connected platforms

### FanzFinance OS Integration
FanzFiliate is designed to integrate with the planned **FanzFinance OS** module for comprehensive financial management:

#### Integration Points
- **Payout Orchestration**: Commission calculations → payout requests → FanzFinance OS
- **Double-Entry Ledger**: All transactions recorded with audit trail
- **Multi-Provider Disbursement**: Adult-friendly payment processors
- **Compliance Integration**: KYC status gating and risk controls
- **Real-Time Reporting**: Executive dashboards and automated reconciliation

#### Event Flow
1. **FanzFiliate**: Calculates commissions, validates affiliate eligibility
2. **FanzFinance OS**: Validates balances, executes payouts, posts ledger entries  
3. **Payment Stack**: Connects to gateways (Paxum, USDT, etc.) and bank feeds
4. **Audit & Compliance**: Risk scoring, tax reporting, regulatory compliance
5. **FanzDash**: Unified reporting and executive oversight across all platforms

## Production Deployment

### Health Verification
```bash
# Comprehensive production readiness check
node scripts/prep-prod.cjs
```

This script validates:
- Environment variables completeness
- API health endpoint responses  
- Route accessibility testing
- System configuration verification
- Feature availability confirmation

### Build Process
```bash
# Build both frontend and backend
npm run build

# Outputs:
# - dist/public/ (frontend build)  
# - dist/index.js (server bundle)
```

### Health Endpoints
- **Health Check**: `GET /api/health` → Service status and dependency checks
- **System Info**: `GET /api/system` → Full system capabilities and competitive advantages

## Security Considerations

### Secrets Management
- **Never commit secrets** to repository
- Use Replit Secrets or platform-specific secret managers
- Reference `.env.example` for required variable names only

### Data Protection
- **PII/KYC Data**: Encrypted at rest, minimal logging exposure
- **Click Tracking**: IP addresses and user agents stored for fraud prevention
- **HMAC Verification**: All webhooks validated with signature checking

### API Security
- **Input Validation**: Zod schemas for all endpoints
- **Error Handling**: Sanitized error responses
- **Session Management**: PostgreSQL-backed sessions with Express middleware

## Adult Content Compliance

FanzFiliate is specifically designed for adult-friendly affiliate marketing:

### Key Differentiators
- **0% Platform Fees**: Creators keep 100% of earnings
- **No Content Restrictions**: Adult content fully supported
- **Adult-Friendly Payment Processors**: Paxum, crypto, specialized providers
- **FUN Ecosystem Integration**: Native integration with BoyFanz, GirlFanz, etc.

### Competitive Advantages (vs Traditional Networks)
- No arbitrary account suspensions or payment holds
- Direct creator-to-creator promotion capabilities  
- Integrated KYC without content discrimination
- Real-time payouts with adult-industry payment providers

## Development Notes

### Code Organization
- **Type Safety**: Full TypeScript coverage with Drizzle ORM types
- **Component Library**: shadcn/ui components with custom Tailwind theme
- **API Layer**: RESTful endpoints with Zod validation
- **Database Layer**: Drizzle ORM with PostgreSQL for ACID compliance

### Key Files for Editing
- **Database Schema**: `shared/schema.ts` (all table definitions and types)
- **API Routes**: `server/routes.ts` (endpoint implementations)  
- **Storage Layer**: `server/storage.ts` (database operations)
- **Frontend Router**: `client/src/App.tsx` (page routing)
- **Component Tree**: `client/src/components/` (UI components)

### Performance Considerations
- **Database Indexing**: Comprehensive indexes on foreign keys and query fields
- **Click Tracking**: High-throughput endpoint optimized for redirect speed
- **Session Storage**: PostgreSQL session store with connection pooling
- **Asset Loading**: Vite-optimized builds with code splitting

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify `DATABASE_URL` and network connectivity
2. **Missing Environment Variables**: Run `node scripts/env-gate.cjs`  
3. **Build Failures**: Check TypeScript compilation with `npm run check`
4. **Webhook Failures**: Verify signature validation and retry logic

### Debug Commands
```bash
# Verify environment setup
node scripts/env-gate.cjs

# Check API health locally  
curl http://localhost:5000/api/health

# View system configuration
curl http://localhost:5000/api/system
```

---

*This WARP.md is optimized for development productivity in the FanzFiliate affiliate marketing platform within the FANZ ecosystem.*

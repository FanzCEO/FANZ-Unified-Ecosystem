# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

---

# 🛡️ FanzProtect - Unified Legal Protection Platform
## Comprehensive DMCA & Legal Defense System for Adult Content Creators

> **Last Verified:** September 15, 2025  
> **Version:** 1.0.0  
> **Classification:** Tier 3 - Specialized Legal Protection Platform  
> **Security Level:** High - Legal Document & Evidence Management  
> **Stack:** React 18 + TypeScript + Vite + Express + Drizzle + PostgreSQL
> **Domain:** `protect.myfanz.network`

## Table of Contents

- [🎯 TL;DR Quickstart](#-tldr-quickstart)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🛠️ Local Environment Setup](#️-local-environment-setup)
- [⚡ Core Development Commands](#-core-development-commands)
- [🗄️ Database Schema](#️-database-schema)
- [🔧 Backend Services](#-backend-services)
- [⚛️ Frontend Application](#️-frontend-application)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [⚖️ Legal Workflow Engine](#️-legal-workflow-engine)
- [📄 Document & Template System](#-document--template-system)
- [🕵️ Evidence Management](#️-evidence-management)
- [🔔 Real-time Notifications](#-real-time-notifications)
- [💰 FanzFinance OS Integration](#-fanzfinance-os-integration)
- [🌐 FANZ Ecosystem Integration](#-fanz-ecosystem-integration)
- [🔒 Security & Compliance](#-security--compliance)
- [🔑 Environment Variables](#-environment-variables)
- [🧪 Testing Strategy](#-testing-strategy)
- [📈 Observability](#-observability)
- [🚀 Deployment](#-deployment)
- [🆘 Troubleshooting](#-troubleshooting)
- [📝 Maintenance](#-maintenance)

---

## 🎯 TL;DR Quickstart

FanzProtect is the comprehensive legal protection platform within the FANZ ecosystem, providing adult content creators with professional DMCA takedown services, demand letters, legal case management, and evidence handling.

### Quick Setup
```bash
# 1. Clone and install
cd FanzProtect
npm install

# 2. Environment setup
cp .env.example .env
# Edit .env with your DATABASE_URL and FANZ service credentials

# 3. Database setup
npm run db:push

# 4. Start development
npm run dev
```

### Verify Setup
- **Frontend:** http://localhost:5173 (Vite dev server)
- **API:** http://localhost:5000 (Express backend)
- **Health Check:** `curl http://localhost:5000/api/health`

---

## 🏗️ Architecture Overview

FanzProtect serves as the **unified legal protection hub** for the entire FANZ ecosystem, providing creators with professional-grade legal tools and automated protection services.

### Core Capabilities
- **🎯 DMCA Takedown Engine:** Automated notice generation, evidence packaging, submission workflows
- **📝 Demand Letter System:** Professional legal correspondence templates and workflows  
- **⚖️ Case Management:** Complete legal case lifecycle tracking and management
- **🕵️ Evidence Chain-of-Custody:** Secure evidence collection, hashing, and immutable storage
- **🤖 Automated Monitoring:** Cross-platform infringement detection within FANZ ecosystem
- **👨‍💼 Legal Counsel Integration:** Escalation workflows and professional legal support

### FANZ Ecosystem Position
```
┌─────────────────────────────────────────────────────────────────┐
│                        FANZ ECOSYSTEM                          │
│                   Legal Protection Tier                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
     ┌────▼────┐ ┌───▼────┐ ┌────▼────┐
     │FanzDash │ │FanzSSO │ │Finance  │
     │(Legal   │ │(Auth)  │ │OS       │
     │Dashboard)│ └────────┘ │(Billing)│
     └─────────┘             └─────────┘
          │           │           │
          └───────────┼───────────┘
                      │
                 ┌────▼────┐
                 │FanzProt │
                 │ect      │
                 └─────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
     ┌────▼────┐ ┌───▼────┐ ┌────▼────┐
     │MediaCore│ │Security│ │Creator  │
     │(Storage)│ │CompDash│ │Platforms│
     └─────────┘ └────────┘ └─────────┘
```

### Tech Stack
- **Frontend:** React 18.3.1, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js + Express, TypeScript, WebSocket support
- **Database:** PostgreSQL + Drizzle ORM with comprehensive legal schema
- **Authentication:** FanzSSO integration with role-based access control
- **Storage:** FanzMediaCore integration for evidence and document storage
- **Billing:** FanzFinance OS integration (adult-friendly processors only)
- **Real-time:** WebSocket notifications for case updates and deadlines

---

## 🛠️ Local Environment Setup

### Prerequisites
- **Node.js 18+** and **npm**
- **PostgreSQL 14+** (local or Neon/Supabase)
- **FANZ Ecosystem Access** (FanzSSO, FanzFinance OS credentials)

### Directory Structure
```
FanzProtect/
├── src/                        # React frontend
│   ├── components/
│   │   ├── legal/              # Legal-specific components
│   │   ├── templates/          # Document template UI
│   │   ├── evidence/           # Evidence management
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/                  # Route components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities and API client
├── server/                     # Express backend (to be added)
│   ├── index.ts               # Server entry point
│   ├── routes/                # API routes
│   │   ├── cases.ts           # Legal case management
│   │   ├── dmca.ts           # DMCA workflows
│   │   ├── evidence.ts       # Evidence handling
│   │   └── templates.ts      # Document templates
│   ├── services/              # Business logic
│   │   ├── dmca-service.ts   # DMCA automation
│   │   ├── template-engine.ts # Document generation
│   │   └── notification.ts   # Real-time notifications
│   └── db/                    # Database layer
├── shared/                    # Shared types and schemas
│   └── schema.ts             # Drizzle schema definitions
├── migrations/               # Database migrations
├── templates/               # Legal document templates
│   ├── dmca/               # DMCA notice templates
│   ├── demand/             # Demand letter templates
│   └── cease-desist/       # Cease & desist templates
└── docs/                   # Documentation
```

### Environment Configuration
Create `.env` from template:
```env
# Core Database
DATABASE_URL="postgresql://user:pass@host:5432/fanzprotect"
NODE_ENV="development"
PORT=5000

# FANZ Ecosystem Integration
FANZSSO_API_URL="https://sso.myfanz.network"
FANZSSO_CLIENT_ID="fanzprotect"
FANZSSO_CLIENT_SECRET="your-sso-secret"

FANZFINANCE_API_URL="https://finance.myfanz.network/api"
FANZFINANCE_API_KEY="your-finance-key"
FANZFINANCE_WEBHOOK_SECRET="your-webhook-secret"

FANZMEDIA_API_URL="https://media.myfanz.network/api"
FANZMEDIA_API_KEY="your-media-key"

FANZDASH_API_URL="https://dash.myfanz.network/api"
FANZDASH_API_KEY="your-dash-key"

# Security & Encryption
JWT_SECRET="your-jwt-secret-32-chars-minimum"
ENCRYPTION_KEY="your-encryption-key-exactly-32-chars"
DOCUMENT_SIGNING_KEY="your-document-signing-key"

# External Services
EMAIL_API_KEY="your-email-service-key"
SMS_API_KEY="your-sms-service-key" 

# Storage & CDN
S3_BUCKET="fanzprotect-evidence"
S3_REGION="us-east-1"
S3_ACCESS_KEY="your-s3-access-key"
S3_SECRET_KEY="your-s3-secret-key"
```

---

## ⚡ Core Development Commands

### Primary Scripts
```bash
# Development (frontend + backend when implemented)
npm run dev
# → Frontend: http://localhost:5173
# → API: http://localhost:5000 (when backend added)

# Build for production
npm run build
# → Builds frontend to dist/

# Database operations
npm run db:push          # Apply schema to database
npm run db:migrate       # Run pending migrations
npm run db:seed         # Seed with template data

# Type checking
npm run check           # TypeScript compilation check

# Testing
npm run test           # Run test suite
npm run test:e2e       # End-to-end tests
```

### Development Workflow
1. **Install:** `npm install`
2. **Environment:** Configure `.env` file with FANZ service credentials
3. **Database:** `npm run db:push && npm run db:seed`
4. **Start:** `npm run dev`
5. **Verify:** Visit http://localhost:5173

---

## 🗄️ Database Schema

### Core Legal Protection Schema
The database supports comprehensive legal case management with proper audit trails and compliance requirements.

### Primary Tables
```typescript
// Legal Cases & DMCA Management
export const legalCases = pgTable("legal_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  caseType: varchar("case_type").notNull(), // 'dmca', 'demand', 'cease_desist', 'harassment'
  status: varchar("status").notNull().default("draft"), // draft, submitted, in_progress, resolved, closed
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  title: varchar("title").notNull(),
  description: text("description"),
  targetPlatform: varchar("target_platform"), // YouTube, Instagram, etc.
  infringingUrl: text("infringing_url"),
  originalContentUrl: text("original_content_url"),
  submittedAt: timestamp("submitted_at"),
  resolvedAt: timestamp("resolved_at"),
  assignedCounsel: varchar("assigned_counsel"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// DMCA-Specific Cases
export const dmcaCases = pgTable("dmca_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").references(() => legalCases.id),
  noticeType: varchar("notice_type").notNull(), // 'takedown', 'counter_notice'
  platformNotificationMethod: varchar("platform_notification_method"), // email, form, api
  platformContactEmail: varchar("platform_contact_email"),
  noticeSubmittedAt: timestamp("notice_submitted_at"),
  platformResponseAt: timestamp("platform_response_at"),
  platformResponseType: varchar("platform_response_type"), // removed, rejected, counter_claimed
  contentRestored: boolean("content_restored").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Evidence Management
export const evidenceItems = pgTable("evidence_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").references(() => legalCases.id),
  evidenceType: varchar("evidence_type").notNull(), // 'screenshot', 'video', 'url_archive', 'document'
  fileName: varchar("file_name"),
  filePath: varchar("file_path"),
  fileHash: varchar("file_hash"), // SHA-256 hash for integrity
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  capturedAt: timestamp("captured_at"),
  chainOfCustodyLog: jsonb("chain_of_custody_log"), // Audit trail
  createdAt: timestamp("created_at").defaultNow()
});

// Document Templates
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: varchar("template_type").notNull(), // 'dmca_notice', 'demand_letter', 'cease_desist'
  platformSpecific: varchar("platform_specific"), // 'youtube', 'instagram', 'generic'
  jurisdiction: varchar("jurisdiction").default("US"), // Legal jurisdiction
  templateName: varchar("template_name").notNull(),
  templateContent: text("template_content").notNull(), // Template with variables
  variables: jsonb("variables"), // Available template variables
  isActive: boolean("is_active").default(true),
  version: varchar("version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Case Timeline & Activities
export const caseActivities = pgTable("case_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").references(() => legalCases.id),
  activityType: varchar("activity_type").notNull(), // 'created', 'submitted', 'response_received', 'resolved'
  description: text("description"),
  performedBy: varchar("performed_by"), // User ID or system
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow()
});

// Billing Integration with FanzFinance OS
export const caseBilling = pgTable("case_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").references(() => legalCases.id),
  financeTransactionId: varchar("finance_transaction_id"), // FanzFinance OS reference
  serviceType: varchar("service_type").notNull(), // 'dmca_basic', 'legal_consultation', 'expedited'
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default("USD"),
  status: varchar("status").notNull().default("pending"), // pending, paid, refunded
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow()
});
```

### Database Operations
```bash
# Apply schema changes
npm run db:push

# Generate migrations for production
npx drizzle-kit generate

# Seed with legal document templates
npm run db:seed
```

---

## 🔧 Backend Services

### Service Architecture
The backend will be built using Express.js with TypeScript, following FANZ ecosystem patterns:

```typescript
// Planned backend structure
server/
├── index.ts                    # Express app initialization
├── routes/
│   ├── cases.ts               # Legal case CRUD operations
│   ├── dmca.ts               # DMCA-specific workflows
│   ├── evidence.ts           # Evidence upload and management
│   ├── templates.ts          # Document template management
│   └── webhooks.ts           # External platform webhooks
├── services/
│   ├── case-service.ts       # Legal case business logic
│   ├── dmca-service.ts       # DMCA automation
│   ├── template-engine.ts    # Document generation
│   ├── evidence-service.ts   # Evidence chain-of-custody
│   └── notification-service.ts # Real-time notifications
├── middleware/
│   ├── auth.ts              # FanzSSO authentication
│   ├── validation.ts        # Request validation
│   └── audit.ts             # Activity logging
└── db/
    ├── connection.ts        # Drizzle database connection
    └── queries.ts          # Database operations
```

### Key API Endpoints (Planned)
```typescript
// Legal Case Management
GET  /api/v1/cases             # List cases with pagination
POST /api/v1/cases             # Create new legal case
GET  /api/v1/cases/:id         # Get case details
PUT  /api/v1/cases/:id         # Update case
DELETE /api/v1/cases/:id       # Close/archive case

// DMCA Workflows
POST /api/v1/dmca/generate     # Generate DMCA notice
POST /api/v1/dmca/submit       # Submit DMCA notice
GET  /api/v1/dmca/:id/status   # Check DMCA status

// Evidence Management
POST /api/v1/evidence          # Upload evidence
GET  /api/v1/evidence/:id      # Get evidence details
PUT  /api/v1/evidence/:id      # Update evidence metadata

// Template System
GET  /api/v1/templates         # List available templates
POST /api/v1/templates/render  # Render template with data
```

---

## ⚛️ Frontend Application

### Current Frontend Structure
The frontend is currently a React + TypeScript + Vite application with modern UI components:

```
src/
├── components/
│   ├── sections/              # Current marketing sections
│   │   ├── Hero.tsx          # Landing page hero
│   │   ├── FeaturesGrid.tsx  # Feature showcase
│   │   ├── Pricing.tsx       # Subscription tiers
│   │   ├── FAQ.tsx           # Frequently asked questions
│   │   └── HowItWorks.tsx    # Process explanation
│   ├── layout/               # Layout components
│   │   ├── Header.tsx        # Navigation header
│   │   └── Footer.tsx        # Site footer
│   └── ui/                   # shadcn/ui components
└── pages/                    # Route components
    ├── Index.tsx             # Landing page
    └── NotFound.tsx          # 404 page
```

### Planned Application Structure
```
src/
├── components/
│   ├── legal/                # Legal-specific components
│   │   ├── CaseList.tsx      # Case management dashboard
│   │   ├── CaseForm.tsx      # Create/edit case forms
│   │   ├── DMCAWizard.tsx    # DMCA generation wizard
│   │   └── StatusTracker.tsx # Case status tracking
│   ├── evidence/             # Evidence management
│   │   ├── EvidenceUpload.tsx # File upload component
│   │   ├── EvidenceGallery.tsx # Evidence viewer
│   │   └── ChainOfCustody.tsx # Audit trail display
│   ├── templates/            # Document templates
│   │   ├── TemplateEditor.tsx # Template customization
│   │   ├── TemplatePreview.tsx # Document preview
│   │   └── TemplateLibrary.tsx # Template selection
│   └── dashboard/            # Dashboard components
│       ├── CaseMetrics.tsx   # Case statistics
│       ├── ActivityFeed.tsx  # Recent activity
│       └── DeadlineAlerts.tsx # Upcoming deadlines
└── pages/
    ├── Dashboard.tsx         # Main dashboard
    ├── Cases.tsx             # Case management
    ├── Evidence.tsx          # Evidence center
    ├── Templates.tsx         # Template management
    └── Settings.tsx          # User preferences
```

### State Management
- **TanStack Query:** Server state management and caching
- **React Hook Form:** Form handling with validation
- **Zod:** Type-safe validation schemas
- **React Context:** Global application state

---

## 🔐 Authentication & Authorization

### FanzSSO Integration
FanzProtect integrates with FanzSSO for unified authentication across the FANZ ecosystem:

```typescript
// Authentication flow
const authFlow = {
  login: "FanzSSO OIDC redirect flow",
  scopes: [
    "legal.read",      // View legal cases
    "legal.write",     // Create/modify cases  
    "dmca.execute",    // Submit DMCA notices
    "evidence.manage", // Handle evidence
    "billing.view",    // View billing info
    "admin.manage"     // Administrative functions
  ],
  roles: [
    "creator",         // Content creator
    "verified_creator", // KYC-verified creator
    "legal_counsel",   // Legal professional
    "support_agent",   // Customer support
    "admin"           // Platform administrator
  ]
};
```

### Role-Based Access Control
```typescript
// Permission matrix
const permissions = {
  creator: ["legal.read", "legal.write", "evidence.manage", "billing.view"],
  verified_creator: ["legal.read", "legal.write", "dmca.execute", "evidence.manage", "billing.view"],
  legal_counsel: ["legal.read", "legal.write", "dmca.execute", "evidence.manage", "admin.cases"],
  support_agent: ["legal.read", "evidence.view", "billing.view"],
  admin: ["*"] // All permissions
};
```

---

## ⚖️ Legal Workflow Engine

### DMCA Workflow
```typescript
// DMCA Process Flow
const dmcaWorkflow = {
  1: "Evidence Collection", // Screenshots, URLs, timestamps
  2: "Notice Generation",   // Template-based notice creation
  3: "Review & Approval",   // Legal review if required
  4: "Submission",         // Automated platform submission
  5: "Tracking",          // Monitor platform response
  6: "Follow-up",         // Escalation if no response
  7: "Resolution"         // Case closure
};
```

### Legal Case Lifecycle
```typescript
const caseStates = {
  draft: "Case being prepared",
  submitted: "Documents sent to platform/party", 
  in_progress: "Awaiting response",
  escalated: "Referred to legal counsel",
  resolved: "Successful resolution",
  closed: "Case closed (resolved or abandoned)"
};
```

### Automation Rules
- **Auto-DMCA:** Generate DMCA notices for verified infringement patterns
- **Deadline Tracking:** Automated reminders for response deadlines
- **Escalation:** Auto-escalate high-value cases to legal counsel
- **Template Selection:** AI-powered template recommendation

---

## 📄 Document & Template System

### Template Library
```
templates/
├── dmca/
│   ├── youtube-takedown.md      # YouTube-specific DMCA
│   ├── instagram-takedown.md    # Instagram DMCA notice
│   ├── generic-takedown.md      # Generic DMCA template
│   └── counter-notice.md        # DMCA counter-notice
├── demand/
│   ├── cease-piracy.md          # Anti-piracy demand
│   ├── remove-content.md        # Content removal demand
│   └── impersonation.md         # Account impersonation
├── cease-desist/
│   ├── harassment.md            # Harassment cease & desist
│   ├── trademark.md             # Trademark infringement
│   └── privacy.md               # Privacy violation
└── responses/
    ├── platform-responses.md    # Common platform responses
    └── escalation-letters.md    # Escalation templates
```

### Template Variables
```typescript
interface TemplateVariables {
  // Creator Information
  creatorName: string;
  creatorEmail: string;
  creatorAddress: string;
  businessName?: string;
  
  // Case Details
  caseId: string;
  infringementDate: string;
  originalWorkDate: string;
  copyrightRegistration?: string;
  
  // Target Information
  platformName: string;
  infringingUrl: string;
  originalContentUrl: string;
  targetUserHandle?: string;
  
  // Evidence
  evidenceUrls: string[];
  screenshotUrls: string[];
  additionalEvidence: string;
  
  // Legal
  jurisdiction: string;
  applicableLaws: string[];
  requestedAction: string;
  deadline: string;
}
```

### Document Generation
- **Markdown Templates:** Human-readable template format
- **Variable Interpolation:** Dynamic content insertion
- **PDF Generation:** Professional document export
- **Digital Signatures:** Integrated e-signature workflow
- **Version Control:** Template versioning and audit trails

---

## 🕵️ Evidence Management

### Evidence Collection
```typescript
interface EvidenceItem {
  id: string;
  type: 'screenshot' | 'video' | 'url_archive' | 'document';
  fileName: string;
  filePath: string;
  fileHash: string;        // SHA-256 integrity check
  fileSize: number;
  mimeType: string;
  capturedAt: Date;
  chainOfCustody: CustodyEvent[];
  metadata: {
    originalUrl?: string;
    captureMethod?: string;
    deviceInfo?: string;
    geoLocation?: string;
  };
}
```

### Chain of Custody
```typescript
interface CustodyEvent {
  eventType: 'created' | 'accessed' | 'modified' | 'transferred';
  timestamp: Date;
  userId: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  digitalSignature?: string;
}
```

### Storage Integration
- **FanzMediaCore Integration:** Secure evidence storage
- **Immutable Storage:** WORM (Write-Once-Read-Many) for critical evidence
- **Encryption:** AES-256 encryption at rest
- **Backup:** Multi-region backup with integrity verification
- **Access Logging:** Complete audit trail for all evidence access

---

## 🔔 Real-time Notifications

### WebSocket Events
```typescript
// Real-time notification types
interface NotificationEvents {
  case_created: CaseCreatedEvent;
  case_updated: CaseUpdatedEvent;
  dmca_submitted: DMCASubmittedEvent;
  platform_response: PlatformResponseEvent;
  deadline_approaching: DeadlineAlertEvent;
  payment_required: PaymentRequiredEvent;
  counsel_assigned: CounselAssignedEvent;
}
```

### Integration Points
- **FanzDash Integration:** Push notifications to admin dashboard
- **Email Notifications:** Critical case updates via email
- **SMS Alerts:** Urgent deadline reminders
- **In-App Notifications:** Real-time UI updates
- **Slack/Teams:** Integration for legal team collaboration

---

## 💰 FanzFinance OS Integration

### Subscription Tiers
```typescript
const subscriptionPlans = {
  starter: {
    price: 19, // USD per month
    features: [
      "3 DMCA notices per month",
      "Basic templates",
      "PDF export",
      "Email support"
    ]
  },
  pro: {
    price: 49,
    features: [
      "15 DMCA notices per month", 
      "Platform-specific templates",
      "Evidence management",
      "Version history",
      "Priority support"
    ]
  },
  enterprise: {
    price: 149,
    features: [
      "60 DMCA notices per month",
      "Legal counsel review",
      "Multi-user seats",
      "Audit trails",
      "Dedicated support"
    ]
  }
};
```

### Usage-Based Billing
- **Per-DMCA Notice:** $5-15 depending on complexity
- **Legal Consultation:** $150-300 per hour
- **Expedited Processing:** $50-100 per case
- **Document Review:** $25-50 per document

### Payment Flow
```typescript
// FanzFinance OS integration (NO Stripe/PayPal)
const paymentFlow = {
  processors: [
    "Paxum",      // Adult-friendly payment processor
    "CCBill",     // Adult content billing
    "Crypto",     // Cryptocurrency payments
    "Wire"        // Bank transfers
  ],
  billing: {
    cycle: "monthly",
    proration: true,
    refundPolicy: "7-day trial, pro-rated refunds",
    currency: ["USD", "EUR", "GBP"]
  }
};
```

---

## 🌐 FANZ Ecosystem Integration

### Service Dependencies
```typescript
const ecosystemIntegrations = {
  // Authentication & User Management
  FanzSSO: {
    purpose: "Unified authentication and user profiles",
    endpoints: ["/oauth/authorize", "/oauth/token", "/userinfo"],
    scopes: ["legal.read", "legal.write", "dmca.execute"]
  },
  
  // Financial Operations
  FanzFinanceOS: {
    purpose: "Subscription billing and payments",
    endpoints: ["/subscriptions", "/transactions", "/ledger"],
    webhooks: ["/webhooks/payment-success", "/webhooks/payment-failed"]
  },
  
  // Evidence & Document Storage
  FanzMediaCore: {
    purpose: "Secure evidence and document storage",
    endpoints: ["/upload", "/retrieve", "/hash-verify"],
    features: ["immutable-storage", "chain-of-custody"]
  },
  
  // Admin Dashboard Integration
  FanzDash: {
    purpose: "Legal metrics and administrative oversight",
    endpoints: ["/metrics", "/alerts", "/cases-overview"],
    widgets: ["active-cases", "success-rates", "upcoming-deadlines"]
  },
  
  // Security & Compliance
  FanzSecurityCompDash: {
    purpose: "Security monitoring and compliance tracking",
    endpoints: ["/audit-logs", "/compliance-status"],
    monitoring: ["data-access", "document-exports", "user-activities"]
  }
};
```

### Cross-Platform Protection
- **FanzTube:** Monitor for unauthorized video uploads
- **Fanz Social:** Detect impersonation accounts and stolen content
- **FanzCommerceV1:** Protect against counterfeit merchandise
- **External Platforms:** Monitor YouTube, Instagram, TikTok, etc.

---

## 🔒 Security & Compliance

### Data Protection
```typescript
const securityMeasures = {
  encryption: {
    atRest: "AES-256",
    inTransit: "TLS 1.3",
    keys: "HSM-managed encryption keys"
  },
  access: {
    authentication: "FanzSSO + 2FA",
    authorization: "Role-based permissions",
    audit: "Complete access logging"
  },
  evidence: {
    integrity: "SHA-256 hashing",
    immutability: "WORM storage",
    custody: "Cryptographic signatures"
  }
};
```

### Legal Compliance
- **Attorney-Client Privilege:** Secure communication channels
- **Document Retention:** Configurable retention policies
- **Cross-Border:** International legal framework compliance
- **GDPR/CCPA:** Privacy rights and data portability
- **Adult Content:** 18 U.S.C. § 2257 record-keeping compliance

### Security Controls
- **Input Validation:** All user inputs sanitized and validated
- **Rate Limiting:** Prevent abuse of legal document generation
- **IP Whitelisting:** Restrict admin access to known IP ranges
- **Audit Logging:** Comprehensive activity logging
- **Incident Response:** Automated security incident detection

---

## 🔑 Environment Variables

### Required Configuration
```env
# Core Application
DATABASE_URL="postgresql://user:pass@host:5432/fanzprotect"
NODE_ENV="development|staging|production"
PORT=5000

# FANZ Ecosystem Services
FANZSSO_API_URL="https://sso.myfanz.network"
FANZSSO_CLIENT_ID="fanzprotect"
FANZSSO_CLIENT_SECRET="your-sso-client-secret"

FANZFINANCE_API_URL="https://finance.myfanz.network/api"
FANZFINANCE_API_KEY="your-finance-api-key"
FANZFINANCE_WEBHOOK_SECRET="your-finance-webhook-secret"

FANZMEDIA_API_URL="https://media.myfanz.network/api" 
FANZMEDIA_API_KEY="your-media-api-key"

FANZDASH_API_URL="https://dash.myfanz.network/api"
FANZDASH_API_KEY="your-dash-api-key"

FANZSECURITY_API_URL="https://security.myfanz.network/api"
FANZSECURITY_API_KEY="your-security-api-key"

# Security & Encryption
JWT_SECRET="your-jwt-secret-minimum-32-characters"
ENCRYPTION_KEY="your-encryption-key-exactly-32-chars"
DOCUMENT_SIGNING_KEY="your-document-signing-private-key"
WEBHOOK_SECRET="your-webhook-verification-secret"

# External Communication
EMAIL_SERVICE="sendgrid|mailgun|ses"
EMAIL_API_KEY="your-email-service-api-key"
EMAIL_FROM_ADDRESS="legal@myfanz.network"

SMS_SERVICE="twilio|textmagic"
SMS_API_KEY="your-sms-api-key"
SMS_FROM_NUMBER="+1234567890"

# Storage & CDN
S3_BUCKET="fanzprotect-evidence-prod"
S3_REGION="us-east-1" 
S3_ACCESS_KEY_ID="your-s3-access-key"
S3_SECRET_ACCESS_KEY="your-s3-secret-key"

CDN_URL="https://cdn-protect.myfanz.network"

# Redis for Queues & Caching
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"

# External APIs (Optional)
GOOGLE_API_KEY="your-google-api-key" # For URL archiving
ARCHIVE_ORG_API="your-archive-org-credentials" # Web archiving
```

### Environment Validation
```bash
# Verify all required environment variables are set
npm run env:validate

# Check service connectivity
npm run health:check
```

---

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/                      # Unit tests
│   ├── services/             # Business logic tests
│   ├── utils/               # Utility function tests
│   └── templates/           # Template rendering tests
├── integration/             # Integration tests  
│   ├── database/           # Database operation tests
│   ├── api/                # API endpoint tests
│   └── services/           # Service integration tests
├── e2e/                    # End-to-end tests
│   ├── dmca-workflow.test.ts # Complete DMCA process
│   ├── case-management.test.ts # Case lifecycle
│   └── billing.test.ts     # Payment workflows
└── security/               # Security tests
    ├── auth.test.ts        # Authentication tests
    ├── authorization.test.ts # Permission tests
    └── injection.test.ts   # Injection attack tests
```

### Testing Commands
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration  
npm run test:e2e
npm run test:security

# Run tests in watch mode
npm run test:watch
```

### Test Data Management
- **Database Fixtures:** Seed data for consistent testing
- **Mock Services:** Mock FANZ ecosystem services for isolated testing
- **Test Templates:** Sample legal document templates
- **Evidence Samples:** Test files for evidence handling

---

## 📈 Observability

### Metrics & Monitoring
```typescript
const metrics = {
  business: [
    "cases_created_total",
    "dmca_notices_submitted_total", 
    "cases_resolved_total",
    "success_rate_percentage",
    "average_resolution_time_days",
    "revenue_per_case_usd"
  ],
  technical: [
    "api_request_duration_seconds",
    "database_query_duration_seconds", 
    "document_generation_duration_seconds",
    "evidence_upload_duration_seconds",
    "websocket_connections_active"
  ],
  security: [
    "authentication_failures_total",
    "authorization_denials_total",
    "suspicious_access_attempts_total",
    "evidence_integrity_violations_total"
  ]
};
```

### Alerting
- **SLA Breaches:** Case resolution time exceeding SLA
- **Platform Failures:** Failed DMCA submissions or API errors
- **Security Events:** Unauthorized access attempts or data violations
- **Business Critical:** High-value case escalations or payment failures

### Dashboards
- **Executive Dashboard:** Business metrics and KPIs
- **Operations Dashboard:** Case workflows and system health
- **Security Dashboard:** Security events and compliance status
- **Developer Dashboard:** Technical metrics and performance data

---

## 🚀 Deployment

### Development Environment
```bash
# Local development setup
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Staging Environment
```bash
# Staging deployment
npm run build
npm run db:migrate
npm run deploy:staging
```

### Production Environment
```bash
# Production deployment
npm run build:production
npm run db:migrate:production
npm run deploy:production
```

### Infrastructure Requirements
- **Compute:** 2+ CPU cores, 4GB+ RAM for API server
- **Database:** PostgreSQL with backup and replica
- **Storage:** S3-compatible storage for evidence files
- **Redis:** For background jobs and caching
- **CDN:** For document delivery and performance
- **Load Balancer:** SSL termination and traffic distribution

### Scaling Considerations
- **Horizontal Scaling:** Multiple API server instances
- **Database Scaling:** Read replicas for reporting queries
- **File Storage:** Distributed storage for evidence files
- **Background Jobs:** Separate worker processes for document generation
- **Global Distribution:** Multi-region deployment for international users

---

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Problems
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Verify schema is up to date
npm run db:push

# Check for migration conflicts
npx drizzle-kit check
```

#### Authentication Issues
```bash
# Verify FanzSSO configuration
curl -H "Authorization: Bearer $FANZSSO_API_KEY" \
     "$FANZSSO_API_URL/health"

# Check JWT token validation
npm run auth:test
```

#### Document Generation Problems
```bash
# Test template rendering
npm run templates:test

# Verify template variables
npm run templates:validate

# Check document output
npm run documents:generate -- --case-id=test-case
```

#### Evidence Upload Issues
```bash
# Test S3 connectivity
npm run storage:test

# Verify file permissions
npm run storage:permissions

# Check file integrity
npm run evidence:verify -- --file-id=example-id
```

### Debug Commands
```bash
# Enable debug logging
DEBUG=fanzprotect:* npm run dev

# Check service health
curl http://localhost:5000/api/health

# Verify ecosystem service connectivity
npm run services:health

# Run diagnostics
npm run diagnostics
```

### Error Codes
- **4001:** Invalid authentication token
- **4003:** Insufficient permissions for operation
- **4004:** Legal case not found
- **4009:** Rate limit exceeded for document generation
- **5001:** Database connection failure
- **5002:** External service unavailable
- **5003:** Document generation failure
- **5004:** Evidence storage failure

---

## 📝 Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review case resolution metrics
- [ ] Check evidence storage usage
- [ ] Verify external service connectivity
- [ ] Review security alerts

#### Monthly  
- [ ] Update legal document templates
- [ ] Review platform policy changes
- [ ] Audit user permissions
- [ ] Performance optimization review

#### Quarterly
- [ ] Legal compliance audit
- [ ] Security penetration testing
- [ ] Database performance tuning
- [ ] Disaster recovery testing

### Backup & Recovery
- **Database Backups:** Daily automated backups with point-in-time recovery
- **Evidence Backups:** Immutable evidence storage with multi-region replication
- **Configuration Backups:** Version-controlled infrastructure as code
- **Recovery Testing:** Quarterly disaster recovery drills

### Update Procedures
1. **Template Updates:** Legal template modifications with version control
2. **Platform Changes:** External platform policy updates and API changes  
3. **Security Updates:** Critical security patches and dependency updates
4. **Feature Releases:** New feature rollouts with feature flags

---

**This WARP.md serves as the comprehensive guide for developing and maintaining FanzProtect within the FANZ ecosystem. Keep it updated with any architectural changes, new integrations, or operational procedures.**

**Last Updated:** September 15, 2025  
**Next Review:** October 15, 2025
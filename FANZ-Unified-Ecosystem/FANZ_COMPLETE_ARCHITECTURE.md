# FANZ Unified Ecosystem - Complete Architecture

## Overview

The FANZ ecosystem is a unified adult content platform network consisting of a shared core control plane, multiple content engines, and vertical-specific platforms. Each vertical shares the same codebase with unique theming, policies, and community features.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FANZ CORE CONTROL PLANE                       │
├─────────────────────────────────────────────────────────────────┤
│  FanzSSO    │ Single identity, OAuth 2.0 / OIDC for all apps    │
│  FanzMoney  │ Rev share, payouts, tax forms, chargebacks        │
│  MediaCore  │ Upload → transcode → fingerprint → DRM            │
│  HubVault   │ KYC/KYB + 2257 records (single source of truth)   │
│  FanzOS     │ Feature flags, config, experiments                │
│  FanzCRM    │ Leads, creator lifecycle management               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CONTROL & MEDIA PLATFORMS                           │
├─────────────────────────────────────────────────────────────────┤
│  FanzDash      │ Executive mission control (admin/creator dash) │
│  FanzClips     │ TikTok-style short-form (embedded everywhere)  │
│  EliteTube     │ Premium long-form + VR hub                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       ⚔️ OUTLAWZ                                 │
│         Cross-platform showcase for banned creators              │
│         "Banned elsewhere? Be legendary here."                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  VERTICAL CONTENT PLATFORMS                      │
│             (Each shares core + has overlay)                     │
├─────────────────────────────────────────────────────────────────┤
│  BoyFanz      │ Gay male mainstream                             │
│  GirlFanz     │ Female creators                                 │
│  TransFanz    │ Trans community (renamed from TranzFanz)        │
│  BearFanz     │ Bear community                                  │
│  PupFanz      │ Pup/kink                                        │
│  CougarFanz   │ Over-30/40+ femme                               │
│  TabooFanz    │ Edgier/legal-compliant kinks                    │
│  FemmeFanz    │ Feminization (renamed from SissyBoyz)           │
│  FanzUncut    │ Unfiltered (renamed from SlutzRUz)              │
│  FanzDiscreet │ Privacy-focused (renamed from DLBroz concept)   │
│  SouthernFanz │ Regional/southern USA (renamed from SouthernStuz)│
└─────────────────────────────────────────────────────────────────┘
```

## Core Control Plane

### FanzSSO
- **Purpose:** Single identity system for all FANZ platforms
- **Technology:** OAuth 2.0 / OpenID Connect
- **Features:**
  - Unified login across all verticals
  - JWT token issuance with scopes, roles, feature flags
  - Identity federation

### FanzMoney
- **Purpose:** Financial operations hub
- **Features:**
  - Revenue sharing calculations
  - Creator payouts
  - Tax form management (1099, W-9)
  - Chargeback handling
  - Payment processing integration

### MediaCore
- **Purpose:** Media processing pipeline
- **Workflow:** Upload → Transcode → Fingerprint → DRM
- **Features:**
  - Multi-format transcoding
  - Content fingerprinting for piracy protection
  - DRM application
  - CDN integration

### HubVault
- **Purpose:** Compliance and verification single source of truth
- **Features:**
  - KYC (Know Your Customer) verification
  - KYB (Know Your Business) verification
  - 2257 record keeping
  - Document storage
  - Consent hash management

### FanzOS
- **Purpose:** Platform configuration and experimentation
- **Features:**
  - Feature flags per vertical
  - A/B testing framework
  - Configuration management
  - Rollout controls

### FanzCRM
- **Purpose:** Creator lifecycle management
- **Features:**
  - Lead tracking
  - Creator onboarding workflows
  - Retention campaigns
  - Analytics and reporting

### FanzDash
- **Purpose:** Executive mission control
- **Users:** Admins, executives, creator dashboard
- **Features:**
  - Platform analytics
  - Creator management
  - Content moderation
  - Financial reporting
  - System health monitoring

## Content Engines

### FanzClips
- **Purpose:** TikTok-style short-form video platform
- **Distribution:** Embedded in all vertical platforms
- **Features:**
  - Short-form video feed
  - Algorithm-driven discovery
  - Cross-promotion between verticals
  - "Bad Creatorz" showcase integration

### EliteTube
- **Purpose:** Premium long-form content and VR hub
- **Features:**
  - Long-form video hosting
  - VR content support
  - Premium content tiers
  - Deep-linked from FanzClips showcases

## ⚔️ The Outlawz Program

### Mission
Give creators banned elsewhere a home — and the spotlight.

### Concept
Outlawz transforms "banned creators" from stigma into badge of honor. A cross-platform showcase for creators banned from competitor platforms (OnlyFans, JustForFans, etc.), providing them a legendary space within the FANZ ecosystem.

**Tagline:** "Banned elsewhere? Be legendary here."

### Cross-Platform Implementation
Portable across every vertical (BoyFanz, GirlFanz, PupFanz, BearFanz, etc.)

### Data Model

```javascript
OutlawzProfile {
  creator_id: string,
  proof_docs: array,          // Uploaded ban evidence
  banned_from: array,         // Platforms they were banned from
  reason_tag: string,         // Categorized reason
  verified_by: string,        // HubVault staff ID
  status: enum                // pending | approved | rejected
}

OutlawzClip {
  asset_id: string,           // MediaCore reference
  safe_excerpt_start: number, // Timestamp
  safe_excerpt_end: number,   // Timestamp
  consent_hash: string,       // HubVault consent verification
  visibility_rules: object    // Which verticals can show this
}
```

### APIs / Events

```javascript
// Application
POST /outlawz/apply
// Uploads docs into HubVault; queues review in FanzDash
{
  creator_id,
  platform_banned_from,
  proof_documents,
  reason
}

// Clip submission
POST /outlawz/:id/clips
// Curated short clips via MediaCore
{
  asset_id,
  excerpt_timestamps,
  consent_hash
}

// Showcase feed
GET /outlawz/showcase?vertical=boyfanz|girlfanz|bearfanz|...
// Returns feed endpoint
```

**Event Bus Topics:**
- `outlawz.approved` - Fired when creator is verified
- `outlawz.clip.published` - Fired when new clip goes live

### UX
- Each vertical adds an **Explore → "Outlawz"** tab
- Feeds powered by FanzClips engine
- Deep-linking to full profiles (optional EliteTube long-form content)
- Global Outlawz carousel on FanzLanding + FanzWorld

### Monetization
- **"Welcome Back" bundles** for fans
  - Discounted subscriptions
  - Tip bonuses
- **"Second Chance" sponsor badges** for brands that back banned creators

### Trust & Safety
- Full HubVault verification required
- MediaCore fingerprint check (no re-uploads of prohibited content)
- Extra manual review queue in FanzDash
- AI sampling via SpicyAI for content safety

### Implementation Priority
- Database tables for OutlawzProfile and OutlawzClip
- FanzDash reviewer UI for verification workflow
- Explore tab added to each vertical powered by FanzClips
- Landing promo rail with copy: "Banned elsewhere? Be legendary here."
- Deep-link to full profiles in EliteTube
- Event bus integration for real-time updates

## Content Vertical Platforms

Each vertical platform shares the same core codebase with unique:
- **Theming:** Colors, logos, visual identity
- **Policies:** Content guidelines, community rules
- **Community Features:** Forums, chat, unique discovery algorithms

### BoyFanz
**Purpose:** Gay male mainstream content platform
**Repository:** https://github.com/FanzCEO/BoyFanzV1
**Note:** PRIMARY BRAND - NOT changing to GayFanz

### GirlFanz
**Purpose:** Female creators content platform
**Repository:** https://github.com/FanzCEO/GirlFanz

### TransFanz
**Purpose:** Trans community content platform
**Repository:** https://github.com/FanzCEO/TranzFanz
**Status:** NEEDS RENAME from TranzFanz → TransFanz (respectful spelling)

### BearFanz
**Purpose:** Bear community content platform
**Repository:** https://github.com/FanzCEO/BearFanz

### PupFanz
**Purpose:** Pup play and kink community platform
**Repository:** https://github.com/FanzCEO/PupFanz

### CougarFanz
**Purpose:** Over-30/40+ female creators platform
**Repository:** https://github.com/FanzCEO/CougarFanz

### TabooFanz
**Purpose:** Edgier/legal-compliant kink content platform
**Repository:** https://github.com/FanzCEO/TabooFanz

### FemmeFanz
**Purpose:** Feminization and sissy content platform
**Repository:** https://github.com/FanzCEO/SissyBoyz
**Status:** NEEDS RENAME from SissyBoyz → FemmeFanz (respectful, professional)

### FanzUncut
**Purpose:** Unfiltered adult entertainment platform
**Repository:** https://github.com/FanzCEO/SlutzRUz
**Status:** NEEDS RENAME from SlutzRUz → FanzUncut (professional positioning)

### FanzDiscreet
**Purpose:** Privacy-focused content platform
**Status:** Future implementation

### SouthernFanz
**Purpose:** Regional southern USA content platform
**Repository:** https://github.com/FanzCEO/SouthernStuz
**Status:** NEEDS RENAME from SouthernStuz → SouthernFanz
**SEO:** RedneckFanz.com will redirect to SouthernFanz

## Authentication & Authorization

### JWT Token Format

```json
{
  "sub": "creator_123",
  "roles": ["creator"],
  "scopes": ["content:write", "money:read"],
  "org": "fanz",
  "flags": ["beta:clips-v3", "program:bad-creators"],
  "exp": 1738531200
}
```

### OAuth Flow
1. User visits any vertical platform (e.g., BoyFanz)
2. Redirects to FanzSSO for authentication
3. FanzSSO issues JWT with appropriate scopes
4. User redirected back to vertical with token
5. Token valid across all FANZ platforms

## Data Flow

### Content Upload Flow
```
Creator → Vertical Platform → MediaCore → Transcode → Fingerprint → DRM → CDN
                                    ↓
                              HubVault (consent verification)
```

### Revenue Flow
```
Fan Purchase → Vertical Platform → FanzMoney → Revenue Split Calculation
                                            ↓
                                  Creator Payout Queue → Bank Transfer
```

### Identity Flow
```
User Login → FanzSSO → JWT Token → Vertical Platform
                  ↓
            HubVault (KYC check if creator)
```

## Repository & Cluster Map

### Core Infrastructure Repos
- **FanzSSO** - Identity and authentication
- **FanzMoneyDash** → **FanzMoney** (NEEDS RENAME) - Financial operations
- **FanzDash** - Admin/creator dashboard
- **MediaCore** - Media processing (planned)
- **HubVault** - Compliance (planned)
- **FanzOS** - Feature flags (planned)
- **FanzCRM** - Creator management (planned)

### Content Platform Repos (16 total)
1. BoyFanz (PRIMARY - not changing)
2. GirlFanz
3. TranzFanz → TransFanz (rename pending)
4. BearFanz
5. PupFanz
6. CougarFanz
7. TabooFanz
8. SissyBoyz → FemmeFanz (rename pending)
9. SlutzRUz → FanzUncut (rename pending)
10. SouthernStuz → SouthernFanz (rename pending)
11. GayFanz (keeping as-is)
12. Guyz (keeping as-is)

### Content Engine Repos
- **FanzClips** (formerly FanzCock) - Short-form video
- **EliteTube** - Long-form/VR content

### Separate Projects (NOT part of FANZ)
- **DLBroz** - Sniffies.com competitor (location-based hookup app)
  - Own SSO, own money routing, own policies
  - Completely separate infrastructure

## Implementation Priorities

### Phase 1: Rename & Consolidation
1. **Platform Rebranding:**
   - TranzFanz → TransFanz
   - SissyBoyz → FemmeFanz
   - SlutzRUz → FanzUncut
   - SouthernStuz → SouthernFanz

2. **Infrastructure Rename:**
   - FanzMoneyDash → FanzMoney (UI copy + repo)

3. **SEO Setup:**
   - RedneckFanz.com redirect → SouthernFanz

### Phase 2: Outlawz MVP
1. **Database Implementation:**
   - Create OutlawzProfile table
   - Create OutlawzClip table
   - Event bus topics (outlawz.approved, outlawz.clip.published)

2. **FanzDash Integration:**
   - Build reviewer UI for verification workflow
   - Admin approval workflow with HubVault integration
   - AI sampling via SpicyAI for content safety

3. **Vertical Integration:**
   - Add Explore → "Outlawz" tab to each vertical
   - Powered by FanzClips engine
   - Global Outlawz carousel on FanzLanding + FanzWorld

4. **Marketing & Monetization:**
   - Landing promo rail
   - PR copy: "Banned elsewhere? Be legendary here."
   - Deep-link to EliteTube full profiles
   - "Welcome Back" bundles (discounted subs, tip bonuses)
   - "Second Chance" sponsor badges for brands

### Phase 3: Core Infrastructure
1. Build out MediaCore
2. Build out HubVault
3. Build out FanzOS
4. Build out FanzCRM
5. Consolidate FanzSSO architecture

## Minimal API Contracts

### FanzSSO → Vertical Platforms
```
GET /oauth/authorize
POST /oauth/token
GET /userinfo
```

### Vertical Platform → MediaCore
```
POST /media/upload
GET /media/:id/status
POST /media/:id/publish
```

### Vertical Platform → FanzMoney
```
POST /transactions
GET /creator/:id/balance
POST /payouts/request
```

### Vertical Platform → HubVault
```
POST /verification/kyc
GET /creator/:id/compliance-status
POST /documents/2257
```

## Technology Stack

### Frontend
- Next.js / React
- TypeScript
- Tailwind CSS
- Shared component library

### Backend
- Node.js / Express
- PostgreSQL (primary database)
- Redis (caching, sessions)
- JWT for authentication

### Infrastructure
- Docker / Kubernetes
- AWS / GCP (cloud provider)
- CDN for media delivery
- Git LFS for media in repos

### Media Processing
- FFmpeg for transcoding
- Content fingerprinting service
- DRM integration

## Security & Compliance

### Age Verification
- HubVault KYC for all creators
- 2257 record keeping
- Document verification workflows

### Content Protection
- MediaCore fingerprinting
- DRM on premium content
- Watermarking for leaks

### Privacy
- JWT tokens with short expiry
- Scope-based access control
- Audit logging in HubVault

### Payment Security
- PCI DSS compliance in FanzMoney
- Secure payout processing
- Fraud detection

## Deployment Architecture

### Monorepo Structure
```
FANZ-Unified-Ecosystem/
├── core/
│   ├── fanzsso/
│   ├── fanzmoney/
│   ├── fanzdash/
│   ├── mediacore/
│   ├── hubvault/
│   └── fanzos/
├── engines/
│   ├── fanzclips/
│   └── elitetube/
└── verticals/
    ├── boyfanz/
    ├── girlfanz/
    ├── transfanz/
    ├── bearfanz/
    ├── pupfanz/
    ├── cougarfanz/
    ├── taboofanz/
    ├── femmefanz/
    ├── fanzuncut/
    └── southernfanz/
```

### Shared Code Pattern
- Core codebase shared across all verticals
- Vertical-specific overlays for:
  - Theming (colors, logos, fonts)
  - Policies (content guidelines)
  - Community features (forums, unique discovery)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** Active Architecture

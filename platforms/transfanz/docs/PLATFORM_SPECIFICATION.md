# TransFanz Platform Specification

## Complete System Design Document

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRANSFANZ ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Web App   │  │  iOS App    │  │ Android App │                │
│  │  (Next.js)  │  │  (Native)   │  │  (Native)   │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│         └────────────────┼────────────────┘                        │
│                          │                                         │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      API Gateway (Kong/AWS)                   │ │
│  │         Rate Limiting • Auth • Request Routing                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                          │                                         │
│         ┌────────────────┼────────────────┐                        │
│         │                │                │                        │
│         ▼                ▼                ▼                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Auth API   │  │ Content API │  │ Safety API  │                │
│  │  (tRPC)     │  │  (tRPC)     │  │  (tRPC)     │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│         │                │                │                        │
│         ▼                ▼                ▼                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │ Identity │ │ Creator  │ │  Safety  │ │ Discovery│         │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │         │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │ Wallet   │ │Messaging │ │   Live   │ │    AI    │         │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │         │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                          │                                         │
│         ┌────────────────┼────────────────┐                        │
│         ▼                ▼                ▼                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ PostgreSQL  │  │    Redis    │  │ S3/Storage  │                │
│  │  (Primary)  │  │   (Cache)   │  │   (Media)   │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   Background Workers                          │ │
│  │  Media Processing • Notifications • Analytics • AI Tasks      │ │
│  │  Safety Scanning • Recommendation Engine • Payout Processing  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Web | Next.js 14+ (App Router) | SSR, RSC, Web Application |
| Frontend Mobile | React Native / Swift / Kotlin | Native iOS & Android |
| API Layer | tRPC + REST fallback | Type-safe APIs |
| Authentication | NextAuth.js + Custom JWT | Auth, Sessions, MFA |
| Database | PostgreSQL 15+ | Primary data store |
| ORM | Prisma | Database access |
| Cache | Redis Cluster | Sessions, rate limiting, cache |
| Object Storage | AWS S3 / Cloudflare R2 | Media storage |
| CDN | Cloudflare / CloudFront | Media delivery |
| Search | Meilisearch / Elasticsearch | Discovery, content search |
| Real-time | Socket.io / Ably | Live streaming, chat |
| Background Jobs | BullMQ + Redis | Async processing |
| AI/ML | OpenAI API + Custom models | Content assistance, safety |
| Payments | Stripe Connect | Subscriptions, payouts |
| Email | Resend / SendGrid | Transactional email |
| Monitoring | Datadog / Sentry | Observability |

### Multi-Tenant Architecture

TransFanz operates within the FANZ ecosystem using subdomain-based multi-tenancy:

```
transfanz.com           → TransFanz main site
creator.transfanz.com   → Creator dashboard
api.transfanz.com       → API endpoints
live.transfanz.com      → Live streaming
admin.transfanz.com     → Admin/mod dashboard (FanzDash)
```

---

## 2. Core Brand & Identity

### Platform Concept

TransFanz is the gender-diverse heart of the FANZ network:

**A home for:**
- Trans women
- Trans men
- Nonbinary creators
- Genderfluid, agender, and gender nonconforming creators
- Intersex and questioning folks

**A place where:**
- Pronouns are respected and central
- Dysphoria is minimized and not triggered by UX
- Discovery is inclusive and affirming
- Safety is prioritized (no transphobia, no harassment)

**The vibe:**
- Warm
- Futuristic
- Soft AND powerful
- Queer, chosen-family energy
- Proud but not stereotypical

### Tone of Voice
- Affirming and respectful
- Queer-informed, trauma-aware
- Forward-looking and tech-savvy
- No "fetishizing" language — this is about people, not stereotypes

---

## 3. Core Principles for Trans UX

TransFanz UX must:

### Center Pronouns and Chosen Name
- Chosen name is default display
- Legal name (from KYC) is never visible publicly
- Pronouns are visible and editable at any time

### Avoid Gendered Misclassification
- No forced "male/female" toggle
- Multi-select and write-in identity fields are supported
- Tagging system supports all identities

### Minimize Dysphoria Risks
- No deadname exposure once a chosen name is set
- Easy to update past content display name without data loss
- Settings emphasize control over visibility of pre-transition content

### Build Safety by Design
- Strong anti-harassment filters
- Automatic flagging of slurs and transphobic language
- "Block & report in one tap" UX for vulnerable users

---

## 4. User Archetypes & Personas

### Creator Persona Archetypes

Optional "persona styles" that creators can select:

| Persona | Vibe |
|---------|------|
| The Muse | Inspirational, ethereal |
| The Phoenix | Rising, transformative |
| The Icon | Bold, trendsetting |
| The Soft Boy | Gentle, tender |
| The Dream Girl | Glamorous, aspirational |
| The Enby Star | Radiant, boundary-breaking |
| The Shapeshifter | Fluid, ever-changing |
| The Guardian | Protective, nurturing |
| The Cosmic Being | Otherworldly, mystical |
| The Rebel Angel | Defiant, divine |

These are purely aesthetic and vibe-based, feed into recommendation and discovery, and show as badges on the creator profile.

### Fan Types (Optional UI Layer)
- Curious Ally
- Dedicated Supporter
- VIP Patron
- Community Member

---

## 5. Platform Features

### Core FANZ Capabilities
- Auth (email/password, OAuth, MFA)
- Profiles (fan/creator)
- Posts, stories, live streams
- Messaging & DMs
- Subscriptions, tips, PPV
- Wallet and payouts
- Admin/mod FanzDash
- Compliance & KYC
- Content tagging & discovery
- AI-assisted features (non-explicit)

### TransFanz-Specific Features
- Gender identity multi-select
- Pronoun display everywhere
- Persona archetype badges
- Pre-transition content controls
- Trans-specific safety filters
- Deadname protection
- Affirming AI suggestions

---

## 6. Key User Flows

### Fan Flow

1. **Age Gate** - Clear 18+ messaging, region-aware
2. **Sign-up** - Email/OAuth, choose display name, optional pronouns & identity tags
3. **Onboarding** - Select interests, safety options
4. **Feed & Explore** - "For You" feed, curated collections
5. **Subscribe / Support** - Clear pricing, emphasis on supporting trans creators

### Creator Flow

1. **Creator Sign-Up** - Choose "I'm a Creator", set chosen name & pronouns
2. **Verification & KYC** - ID verification (legal name never shown), confirm payout name
3. **Creator Onboarding** - Profile setup, identity tags, persona archetype, pricing
4. **Creator Studio** - KPIs, content performance, AI suggestions
5. **Content Creation** - Upload, tag, set visibility, schedule
6. **Safety & Boundaries** - Harassment filters, word blocks, region blocking

---

## 7. Differentiators

### vs. Generic Adult Platforms

| Aspect | Generic Platforms | TransFanz |
|--------|------------------|-----------|
| Gender Options | Binary M/F | Multi-select identities |
| Pronouns | No support | Displayed everywhere |
| Name Display | Legal name required | Chosen name default |
| Deadnames | Risk of exposure | Built-in protection |
| Safety | Generic harassment rules | Transphobia priority |
| Moderation | Slow | 4-hour SLA for trans hate |
| Slur Detection | None | Auto-detect transphobic slurs |
| Discovery | Fetishizing categories | Respectful identity tags |
| AI | Generic | Pronoun-aware, affirming |

---

## 8. Implementation Phases

### Phase 1: Foundation (MVP)
- Core auth with chosen name/pronouns
- Basic creator profiles with identity tags
- Content upload and subscription
- Essential safety (block, report, slur filter)
- Age gate and basic KYC

### Phase 2: Safety & Discovery
- Advanced moderation queue
- AI harassment detection
- Recommendation engine with diversity
- Collections and explore page
- Message filtering levels

### Phase 3: Creator Tools
- Creator studio dashboard
- Analytics and insights
- AI bio/caption suggestions
- Scheduling and batch tools
- Payout system

### Phase 4: Community & Polish
- Live streaming
- Advanced boundary settings
- Pre-transition content controls
- Mobile apps
- Community features

---

*Made for trans creators, by an ecosystem that actually cares.*

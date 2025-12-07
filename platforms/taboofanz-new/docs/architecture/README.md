# TabooFanz System Architecture

## Overview

TabooFanz is a modern, scalable adult creator platform built on a microservices-inspired architecture using a TypeScript monorepo structure.

## System Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                      CDN (Cloudflare)                    │
                                    │                   Static Assets & Media                  │
                                    └─────────────────────────────────────────────────────────┘
                                                              │
                                    ┌─────────────────────────┴─────────────────────────┐
                                    │                    Load Balancer                   │
                                    └─────────────────────────┬─────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    │                                         │                                         │
        ┌───────────┴───────────┐               ┌─────────────┴─────────────┐           ┌───────────────┴──────────────┐
        │     Web App (Next.js)  │               │     API Server (tRPC)     │           │   Streaming Server (HLS)    │
        │                        │               │                           │           │                              │
        │  - SSR/SSG Pages       │◄─────────────►│  - Auth & Sessions        │           │  - Live Video Ingest        │
        │  - React Components    │    tRPC       │  - Content Management     │           │  - Transcoding              │
        │  - TailwindCSS         │               │  - User Management        │           │  - Playback Delivery        │
        │  - State (Zustand)     │               │  - Payments (Stripe)      │           │                              │
        └────────────────────────┘               │  - Messaging              │           └──────────────────────────────┘
                                                 │  - Live Sessions          │
        ┌────────────────────────┐               │  - AI Services            │
        │   Mobile App (React    │               │  - Admin Functions        │
        │   Native / Expo)       │◄─────────────►│                           │
        │                        │    tRPC       └───────────┬───────────────┘
        │  - iOS & Android       │                           │
        │  - Native Components   │                           │
        │  - Push Notifications  │                           │
        └────────────────────────┘                           │
                                                             │
                    ┌────────────────────────────────────────┼────────────────────────────────────────┐
                    │                                        │                                        │
        ┌───────────┴───────────┐               ┌────────────┴───────────┐            ┌───────────────┴──────────────┐
        │    PostgreSQL         │               │        Redis           │            │     Object Storage           │
        │                       │               │                        │            │     (S3 / R2)                │
        │  - Users & Profiles   │               │  - Session Cache       │            │                              │
        │  - Content Metadata   │               │  - Rate Limiting       │            │  - Media Files               │
        │  - Transactions       │               │  - Real-time Pub/Sub   │            │  - Thumbnails                │
        │  - Tags & Discovery   │               │  - Job Queues          │            │  - User Uploads              │
        │  - Compliance Records │               │                        │            │  - Watermarked Content       │
        └───────────────────────┘               └────────────────────────┘            └──────────────────────────────┘
                                                                                                    │
                                                ┌────────────────────────┐                          │
                                                │   Background Workers   │◄─────────────────────────┘
                                                │                        │
                                                │  - Media Processing    │
                                                │  - Watermarking        │
                                                │  - Email Sending       │
                                                │  - Analytics Agg.      │
                                                │  - AI Processing       │
                                                │  - Payout Processing   │
                                                └────────────────────────┘
```

## Component Details

### 1. Web Application (Next.js 14)

**Technology**: Next.js 14 with App Router, React 18, TailwindCSS

**Responsibilities**:
- Server-side rendering for SEO (landing pages)
- Client-side interactivity for app functionality
- Real-time updates via WebSocket/SSE
- Progressive Web App (PWA) capabilities

**Key Features**:
- Dark theme (neon noir aesthetic)
- Responsive design (mobile-first)
- Optimistic UI updates
- Offline support (PWA)

### 2. Mobile Application (React Native)

**Technology**: React Native with Expo

**Responsibilities**:
- Native iOS and Android apps
- Push notifications
- Deep linking
- Native media handling

**Shared Code**:
- UI components via `@taboofanz/ui`
- Types via `@taboofanz/shared`
- API client via tRPC

### 3. API Server (tRPC + Express)

**Technology**: tRPC 10, Express, Node.js

**Responsibilities**:
- Type-safe API endpoints
- Authentication & authorization
- Business logic
- Database operations
- Third-party integrations

**Routers**:
| Router | Purpose |
|--------|---------|
| `auth` | Login, register, sessions, MFA |
| `user` | Profile management, settings |
| `creator` | Creator profiles, archetypes, analytics |
| `content` | Posts, media, comments, likes |
| `tag` | Tag management, discovery |
| `subscription` | Subscriptions, tiers |
| `wallet` | Transactions, payouts, tips |
| `message` | Direct messages, conversations |
| `live` | Live streaming, chat |
| `admin` | Moderation, compliance, feature flags |

### 4. Database (PostgreSQL + Prisma)

**Technology**: PostgreSQL 15, Prisma ORM

**Schema Highlights**:
- **Users**: Core identity with roles (Fan, Creator, Moderator, Admin)
- **CreatorProfile**: Archetypes, identity protection, boundary profiles
- **ContentItem**: Posts with media, visibility, pricing
- **Subscription**: Fan-creator relationships with tiers
- **Wallet/Transaction**: Payment tracking and history
- **ComplianceRecord**: KYC, age verification, consent records
- **AuditLog**: Security and compliance logging

### 5. Cache Layer (Redis)

**Technology**: Redis 7

**Usage**:
- Session storage
- Rate limiting
- Real-time presence
- Job queues (BullMQ)
- Pub/Sub for real-time features

### 6. Object Storage (S3/R2)

**Technology**: AWS S3 or Cloudflare R2

**Storage**:
- User uploads (images, videos, audio)
- Processed/transcoded media
- Thumbnails and previews
- Watermarked content

**Security**:
- Signed URLs for private content
- Metadata stripping
- Automatic EXIF removal

### 7. CDN (Cloudflare)

**Technology**: Cloudflare

**Features**:
- Global edge caching
- DDoS protection
- WAF rules
- Image optimization
- Video streaming optimization

### 8. Background Workers

**Technology**: BullMQ with Redis

**Jobs**:
- **Media Processing**: Transcoding, thumbnail generation
- **Watermarking**: Adding creator handles to media
- **Email Delivery**: Transactional emails
- **Analytics Aggregation**: Daily/weekly stats
- **AI Processing**: Safety checks, tag suggestions
- **Payout Processing**: Scheduled creator payouts

### 9. Streaming Infrastructure

**Technology**: Mux or Cloudflare Stream

**Features**:
- RTMP/HLS ingest
- Adaptive bitrate streaming
- DVR/VOD recording
- Real-time chat integration
- Viewer count tracking

## Data Flow

### Content Upload Flow

```
Creator → Web/Mobile → API Server → Validation
                                      ↓
                              Object Storage (raw)
                                      ↓
                              Background Worker
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            Transcode Video                     Process Image
                    ↓                                   ↓
            Generate Thumbnails               Apply Watermark
                    ↓                                   ↓
            Safety Check (AI)                 Safety Check (AI)
                    ↓                                   ↓
                    └─────────────────┬─────────────────┘
                                      ↓
                              Object Storage (processed)
                                      ↓
                              Update Database
                                      ↓
                              Notify Creator
                                      ↓
                              CDN Distribution
```

### Authentication Flow

```
User → Login Request → API Server
                          ↓
                    Verify Credentials
                          ↓
                    Check MFA (if enabled)
                          ↓
                    Generate Tokens
                    ├── Access Token (15min, JWT)
                    └── Refresh Token (7d, stored in DB)
                          ↓
                    Create Session
                          ↓
                    Return to Client
```

### Subscription Flow

```
Fan → Subscribe Request → API Server
                              ↓
                    Verify Creator Exists
                              ↓
                    Check Existing Subscription
                              ↓
                    Apply Promo Code (if any)
                              ↓
                    Create Stripe Subscription
                              ↓
                    Update Database
                    ├── Create Subscription Record
                    ├── Update Creator Stats
                    └── Update Fan Stats
                              ↓
                    Create Notification
                              ↓
                    Return Confirmation
```

## Security Architecture

### Authentication

- **JWT Access Tokens**: Short-lived (15 min), stateless
- **Refresh Tokens**: Long-lived (7 days), stored in database
- **Session Management**: Device tracking, revocation support
- **MFA**: TOTP-based with backup codes

### Authorization

- **Role-Based Access Control (RBAC)**: Fan, Creator, Moderator, Admin
- **Resource-Based Permissions**: Content ownership, subscription status
- **tRPC Middleware**: `protectedProcedure`, `creatorProcedure`, `adminProcedure`

### Data Protection

- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS everywhere
- **Password Hashing**: bcrypt with 12 rounds
- **Sensitive Data**: Encrypted storage for KYC documents

### Identity Protection (TabooFanz-Specific)

- **Masked Mode**: Face detection warnings, background blur
- **Region Blocking**: IP-based country/region filtering
- **Metadata Stripping**: EXIF removal from uploads
- **Alias Protection**: Separation of legal identity from persona

## Scalability

### Horizontal Scaling

- **Web/API**: Stateless, horizontally scalable behind load balancer
- **Database**: Read replicas for query distribution
- **Redis**: Cluster mode for high availability
- **Workers**: Multiple instances processing job queues

### Caching Strategy

1. **CDN Level**: Static assets, public media
2. **Redis Level**: Sessions, rate limits, hot data
3. **Application Level**: In-memory LRU for frequent queries
4. **Database Level**: Query plan caching

### Performance Optimizations

- **Lazy Loading**: Images, videos, infinite scroll
- **Edge Functions**: Geographic routing
- **Database Indexing**: Optimized for common queries
- **Connection Pooling**: PgBouncer for PostgreSQL

## Monitoring & Observability

### Metrics

- **Application**: Request latency, error rates, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Business**: Signups, subscriptions, revenue

### Logging

- **Structured Logs**: JSON format for parsing
- **Audit Logs**: Security-sensitive actions
- **Error Tracking**: Sentry integration

### Alerting

- Error rate thresholds
- Latency degradation
- Infrastructure health
- Security events

## Disaster Recovery

### Backup Strategy

- **Database**: Daily snapshots, point-in-time recovery
- **Object Storage**: Cross-region replication
- **Configuration**: Version-controlled in Git

### Recovery Procedures

- Documented runbooks
- Regular DR testing
- Automated failover for critical systems

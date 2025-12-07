# Overview

DaddyFanz is a full-stack adult content creator platform designed for subscription-based monetization, secure adult-friendly payment processing, advanced content moderation, and real-time communication. It provides a comprehensive solution for creators to share content and connect with fans, ensuring compliance with adult industry regulations including age verification and 18 U.S.C. § 2257 record-keeping. Key capabilities include JWT-based authentication, media management, AI-powered content moderation with human review, live streaming with real-time tipping, and a robust payment ecosystem. The platform also features advanced enterprise capabilities like NFT blockchain content ownership, a fan-to-creator microlending system, and enhanced deepfake and AI content detection.

# User Preferences

Preferred communication style: Simple, everyday language.

## Domain Configuration
- **Production Domain**: daddiesFanz.com
- **Testing Domain**: fanz.daddiesfanz.com (for staging/testing)
- CORS configured for both custom domains + Replit dev domain

# System Architecture

## Frontend Architecture

The client-side application is built with React 18 and TypeScript, utilizing Vite for development and optimized production builds. Wouter is used for routing, and React Query manages server state. The UI leverages Radix UI primitives for accessible headless components, styled with Tailwind CSS, following a custom "DaddyFanz" brand identity with neon cyan, metallic gold, and dark industrial themes. The component architecture is modular and reusable.

## Backend Architecture

The server uses Node.js with Express.js, implementing a RESTful API with middleware for security, rate limiting, CSRF protection, and request validation. It employs JWT-based authentication with email/password credentials. Database operations are handled by Drizzle ORM with PostgreSQL. Real-time functionality is provided via WebSockets for messaging, notifications, and content updates. Specialized services manage adult-friendly payment processing, AI-powered content moderation with human review workflows, and notification delivery.

## Security and Compliance

The platform employs multiple layers of security, including CSRF protection, rate limiting, secure JWT token management, and comprehensive audit logging. Content moderation involves automated AI scanning (NSFW level, deepfake, prohibited content detection) with configurable thresholds and mandatory human review. Compliance features include 18 U.S.C. § 2257 record-keeping, age verification, KYC for creators, and forensic content signatures. Authentication architecture includes SHA-256 token hashing for password reset/email recovery, atomic token redemption, and role-based access control.

## Data Storage and Management

Media files are stored using S3-compatible object storage with forensic signatures. The PostgreSQL database schema supports complex relationships between users, content, subscriptions, and financial transactions with proper indexing. JWT tokens are used for API authentication, with secure password reset and email recovery flows. Automated cleanup processes handle expired tokens and sessions. Database schemas include features for NFT content ownership (multi-blockchain support, royalty enforcement), fan-to-creator microlending (escrow protection, revenue-based repayment), and AI content detection (multi-provider scanning, deepfake detection, forensic watermarking).

## Core Features and Implementations

- **Authentication System**: JWT-only authentication with email/password, secure password reset, email recovery, and CSRF protection.
- **Dual Onboarding System**: Distinct onboarding flows for Creators (Stars) and Fanz with role-specific UX, profile setup, interest selection, and progress tracking.
- **AI Content Moderation**: Advanced AI detects NSFW levels, deepfakes, prohibited content, and performs scene/face analysis, with human review workflows.
- **Live Streaming**: Full lifecycle management for live streams, real-time viewer tracking, chat, tipping, and VOD recording.
- **Enterprise Features**: Creator Collaboration, Tiered Subscriptions, Content Bundles, Virtual Gifts, Leaderboards, Referral Program, Content Scheduling, Creator Verification Badges, Geo-blocking Controls, and DMCA Rights Management.
- **NFT Blockchain Content Ownership**: Enables creators to mint content as NFTs with perpetual royalty tracking across secondary sales, multi-blockchain support, and automated smart contract deployment.
- **Fan-to-Creator Microlending System**: Allows fans to support creators through structured microloans with escrow protection, configurable loan programs, and revenue-based repayment.
- **Enhanced Deepfake & AI Content Detection**: Multi-provider scanning for deepfake and prohibited content, forensic watermarking, perceptual hashing, and provenance tracking.
- **FanzTrust™ Payment Ecosystem**: Transaction verification, refund processing, multi-gateway support, trust score system, device fingerprinting, and FanzWallet management.
- **Creator Analytics Dashboard**: Real-time stats, cumulative metrics, and daily activity tracking.

# External Dependencies

## Payment Processing Services
- **CCBill, Segpay, Epoch, Vendo, Verotel**: Primary adult-friendly payment processors.
- **Paxum, ePayService, Wise**: Creator payout solutions.

## Database and Storage
- **PostgreSQL**: Primary database via Neon Database.
- **S3-compatible storage**: Media file storage.
- **Redis**: Optional caching layer.

## Authentication and Security
- **JWT**: Token-based authentication.
- **bcrypt**: Secure password hashing.

## Development and Monitoring
- **Vite**: Frontend build tool.
- **Drizzle ORM**: Database interaction and schema management.
- **Pino**: Structured logging.
- **React Query**: Client-side data fetching.

## UI and Design
- **Radix UI**: Headless component primitives.
- **Tailwind CSS**: Styling framework.
- **Lucide React**: Icon library.
- **Google Fonts**: Typography.

## Communication
- **WebSocket**: Real-time messaging and notifications.
- **Email services**: Transactional emails.
- **Push notifications**: Mobile and web delivery.

## AI Content Moderation
- **OpenAI GPT-5**: Text content analysis for policy violations (implemented)
- **Hive Moderation, Reality Defender, AWS Rekognition**: AI content scanning providers (future integration for visual analysis).

## Recent Implementations (October 2025)

### Completed Features
1. **Audit Logging to Database** - All audit logs now persist to `audit_logs` table for compliance
2. **Scheduled Posts Publishing** - Automated system publishes scheduled posts at specified times
3. **Leaderboards** - Dynamic leaderboard calculation for top earners and creators by period
4. **Referral Rewards** - Automated 5% commission processing for referral program
5. **WebSocket Management** - Full client connection tracking, room subscriptions, real-time messaging, and broadcast support
6. **AI Content Moderation** - OpenAI GPT-5 integration for text content moderation with policy violation detection

### Email Notifications
- **SendGrid Integration**: User dismissed the Replit SendGrid connector. 
- **Note for Future**: To implement email notifications, either:
  1. Set up SendGrid connector via Replit integrations UI
  2. Manually provide SENDGRID_API_KEY as a secret and implement using @sendgrid/mail package
  3. Use alternative email service (AWS SES, Mailgun, etc.)
- Current implementation in `server/services/notificationService.ts` has placeholder methods ready for integration
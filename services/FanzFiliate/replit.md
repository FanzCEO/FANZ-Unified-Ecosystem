# Overview

FanzFiliate is a modern affiliate marketing platform built on top of the AffiLab framework, designed for adult-friendly affiliate and CPA (Cost Per Action) campaigns. The platform provides comprehensive tracking, offer management, payout processing, and analytics capabilities with integration into the FUN (FanzUnlimited) ecosystem including FanzSSO, FanzDash, VerifyMy KYC, and MediaCore.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom neon/dark theme optimized for adult industry aesthetics

## Backend Architecture
- **Server**: Express.js with TypeScript for RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL session store

## Data Storage Solutions
- **Primary Database**: PostgreSQL with comprehensive schema including:
  - User management with role-based access (affiliates, advertisers, admins)
  - Offer management with status tracking and geographic restrictions
  - Click tracking and conversion attribution
  - Payout processing with multiple provider support
  - User balance and KYC status management
- **Schema Design**: Uses Drizzle ORM with TypeScript for type safety and schema validation

## Authentication and Authorization
- **SSO Integration**: FanzSSO JWT-based authentication system
- **KYC Integration**: VerifyMy webhook system for identity verification
- **Role-Based Access**: Three-tier system (affiliate, advertiser, admin)
- **Session Management**: PostgreSQL-backed sessions with Express middleware

## Key Features
- **Offer Marketplace**: Browse and manage CPA/affiliate offers with detailed filtering
- **Tracking System**: Custom tracking URL generation with sub-ID support
- **Analytics Dashboard**: Real-time performance metrics and conversion tracking
- **Payout Management**: Multi-provider payout system supporting adult-friendly payment processors
- **KYC Compliance**: Integrated verification workflow with tier-based earning limits

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migrations and schema management

## Authentication & Identity
- **FanzSSO**: JWT-based single sign-on integration
- **VerifyMy**: KYC verification service with webhook callbacks

## Payment Processing
- **Paxum**: Adult-industry friendly payment processor
- **CosmoPayment**: Alternative payment gateway
- **Bitsafe**: Cryptocurrency payment processing
- **USDT**: Direct cryptocurrency payments
- **Wise**: Traditional banking integration
- **Payoneer**: Global payment platform

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state synchronization
- **Zod**: Runtime type validation and schema parsing

## UI Components
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **Embla Carousel**: Touch-friendly carousel components

## Monitoring & Analytics
- **PostHog**: Product analytics and user behavior tracking
- **Custom Analytics**: Built-in conversion and performance tracking

# Recent Changes

## Production Setup Implementation (September 2025)
- Implemented comprehensive production verification system with health checks and system monitoring
- Added environment variable validation with detailed reporting of missing configurations  
- Created verification scripts for webhooks, HMAC signatures, and tracking security
- Built automated health endpoints at `/api/health` and `/api/system` for monitoring
- Added production readiness command `node scripts/prep-prod.cjs` for complete validation
- Integrated competitive positioning messaging throughout the platform UI
- Enhanced dashboard with FUN ecosystem integration display and 0% fee messaging
- Fixed navbar nesting warnings and improved component structure

## Production Verification Features
- **Environment Validation**: Checks all required environment variables for production deployment
- **Health Monitoring**: Real-time system health checks with service status reporting
- **Webhook Security**: HMAC signature verification for S2S postbacks and KYC webhooks
- **Route Validation**: Automated crawling to verify all frontend routes are accessible
- **Competitive Analysis**: Built-in system reporting highlighting advantages over traditional networks
- **One-Command Deployment**: Single command verification covering all production requirements
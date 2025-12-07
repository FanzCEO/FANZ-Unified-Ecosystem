# Overview

**Fanz Operating System** is a fully portable, production-ready adult content creatorz platform designed as a completely independent full-stack web application. Engineered for 100% platform independence, it facilitates creatorz monetization through subscriptions, pay-per-view content, tips, and messaging. The platform includes specialized modules like Fanz (core social) and FanzFluence (MLM + affiliate), alongside features such as live streaming, contests, and merchandise, with a vision for broad market potential in the creatorz economy.

## Recent Changes (January 2025)
- **Platform Independence**: Removed all hosting provider dependencies to create a truly portable system
- **Docker Deployment**: Added comprehensive Docker and Docker Compose configurations
- **Multi-Deployment Support**: Created deployment scripts for any cloud provider or self-hosted environment
- **Brand Consolidation**: Rebranded as "Fanz Operating System" to reflect platform independence
- **Advanced System Map**: Created sophisticated modular portal interface superior to competitor platforms
- **Interactive Module Navigation**: Implemented "walking through rooms" experience with animated transitions
- **VR Integration**: Added FanzMetaVerse module with virtual reality experiences and 3D content
- **Education Platform**: Implemented FanzVersity for creator courses and certification programs
- **Proper Branding**: Updated all module names to use correct Fanz naming conventions (FanzX, FanzVersity, FanzMetaVerse, etc.)
- **Legal Compliance**: Added comprehensive legal policy pages matching BoyFanz.com structure
- **Brand Consistency**: Ensured all "creator" references use "creatorz" spelling with "z"
- **Professional Footer**: Implemented footer with all required legal links and company information

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite build system, Tailwind CSS for styling (with a purple/pink gradient theme), Radix UI primitives and shadcn/ui components.
- **Routing & State**: Wouter for lightweight client-side routing and TanStack Query for server state management.

## Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **Authentication & Authorization**: Session management with PostgreSQL, role-based access control (fanz, creator, admin), and client-side age gating.
- **API Design**: RESTful endpoints with a modular file structure.

## Database Design
- **Database**: PostgreSQL (using Neon Database).
- **Schema**: Supports user management (with roles), content management (posts with varied visibility), financial systems (subscriptions, transactions, PPV), messaging, and social features (likes, comments, follows).

## Content Management
- **Media**: Integrated upload and processing pipeline with support for various content types (free, PPV, subscription-gated).
- **Features**: AI and human content moderation, automated watermarking.

## Payment & Monetization
- **Systems**: Recurring billing subscriptions, individual pay-per-view unlocks, direct tipping, and an internal wallet system.

## Core Services
- **100% Platform Independence**: Complete removal of hosting provider dependencies, deployable on any infrastructure
- **Authentication System**: Multi-provider authentication supporting social logins (Google, Facebook, Twitter, Instagram, Reddit), email/SMS with verification codes, and external 2FA via Speakeasy TOTP. Session management is PostgreSQL-backed.
- **File Storage**: S3-compatible external storage (MojoHost/Wasabi/DigitalOcean) with CDN support and secure presigned URLs.
- **Notifications**: Web push and mobile notification support with rich notification types and unread tracking.
- **Creator Monitoring**: Automated engagement tracking, including email reminders for inactivity and gamification leaderboards.
- **MVC Architecture**: Implemented a comprehensive Model-View-Controller architecture with specialized controllers (Creator, Fan, Content, Admin, Messaging, Compliance, LiveStream) and over 60 API endpoints.
- **Flexible Deployment**: Docker containerization, cloud-agnostic deployment scripts, and self-hosting capabilities.

# External Dependencies

## Core Infrastructure
- **Neon Database**: PostgreSQL hosting.

## Payment Processing
- **CCBill**: Primary adult content payment processor.
- **NowPayments**: Cryptocurrency payment processing.
- **Triple-A**: Additional crypto payment gateway.
- **Bankful**: Alternative international payment processing.
- **Authorize.net**: Secondary processor for tips and merchandise.

## File Storage & CDN
- **Google Cloud Storage**: Media file storage.
- **Uppy**: File upload interface.

## Development Tools
- **TypeScript**: For type safety across the stack.

## Deployment Configuration
- **Replit Deployment**: Configured with `replit.toml` for proper cloud deployment.
- **Production Server**: Express.js server configured to listen on port 5000 with proper HTTP handling.
- **Build Process**: Vite frontend build + esbuild backend bundling for production deployment.

## Compliance & Security
- **Age Verification**: For adult content compliance.
- **DMCA Protection**: Copyright protection.
- **Geographic Restrictions**: Content and payment gating.
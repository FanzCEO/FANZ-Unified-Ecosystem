# FansLab Platform Architecture Overview

## System Architecture

### Dual-Server Design
**Express.js API Server (Node.js/TypeScript):**
- Business logic and data operations
- User authentication and authorization  
- Real-time features via WebSocket
- Payment processing integration
- Content management and moderation

**Go Static Server:**
- High-performance static file delivery
- Server-Sent Events (SSE) for real-time updates
- SPA routing with proper MIME types
- Event stream management
- Build output serving from ./dist

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite build system for fast development
- Tailwind CSS + shadcn/ui components
- TanStack Query for server state
- Wouter for client-side routing

**Backend:** 
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Multi-provider OAuth authentication
- WebSocket support for real-time features
- Comprehensive API with 60+ endpoints

**Infrastructure:**
- PostgreSQL (Neon Database) for primary data
- S3-compatible object storage for media
- CDN for global content delivery
- Multi-gateway payment processing
- Real-time notification systems

## Key Features

### For Creators
- Content creation and scheduling tools
- Live streaming with monetization
- Comprehensive analytics dashboard
- Subscriber management system
- Multiple revenue streams

### For Fans  
- AI-powered content discovery
- Subscription and payment management
- Interactive engagement features
- Personalized content feeds
- Real-time notifications

### For Administrators
- Platform-wide analytics and reporting
- Content moderation tools
- User management interface
- Financial oversight systems
- Compliance monitoring

## Security & Compliance
- Multi-factor authentication
- End-to-end encryption
- PCI DSS compliant payments
- GDPR/CCPA data protection
- Adult content legal compliance

## Performance Features
- Intelligent content caching
- Database query optimization
- Real-time recommendation engine
- Automated media processing
- Continuous performance monitoring

This architecture supports a scalable, secure, and feature-rich platform for content creator monetization.

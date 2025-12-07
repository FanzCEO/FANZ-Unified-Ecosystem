# Overview

GirlFanz is an adult content creator platform built as a React + Express fullstack application. The platform enables female content creators to connect with fans, monetize their content, and manage their digital presence through a cyber-glam themed interface. The application features real-time messaging, content management, payment processing, moderation tools, and comprehensive creator analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side navigation without the overhead of React Router
- **State Management**: TanStack Query (React Query) for server state management, eliminating the need for complex state management libraries
- **UI Components**: Radix UI primitives providing accessible, unstyled components with custom styling via Tailwind CSS
- **Styling**: Tailwind CSS with a custom GirlFanz brand theme featuring cyber-glam aesthetics (pink, violet, cyan color palette)
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules for modern JavaScript features
- **Framework**: Express.js with comprehensive security middleware (Helmet, rate limiting, CSRF protection)
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **Real-time Communication**: WebSocket server for live messaging and notifications
- **Authentication**: Dual system supporting both Replit OAuth (for development) and local JWT-based authentication
- **Security**: Multiple layers including rate limiting, CORS, content security policies, and request validation

## Database Design
- **Primary Database**: PostgreSQL for relational data with ACID compliance
- **ORM**: Drizzle ORM with type-safe database operations and schema management
- **Schema Structure**: Comprehensive data model including users, profiles, media assets, messages, moderation queue, payout systems, and audit logging
- **Session Management**: Database-backed sessions for secure authentication state

## File Storage
- **Object Storage**: Google Cloud Storage integration for media files and content
- **File Upload**: Uppy dashboard for user-friendly file upload experience with progress tracking
- **Access Control**: Custom ACL (Access Control List) system for content permissions and subscriber-only access
- **Media Processing**: Automated content moderation pipeline with approval workflows

## Development Environment
- **Package Manager**: npm with workspace support for monorepo structure
- **Development Server**: Custom server configuration using server/start.ts as entry point (bypasses vite.config.ts to avoid top-level await issues with tsx/esbuild)
- **Server Entry**: server/index.ts redirects to server/start.ts which contains optimized Vite dev server setup with inline configuration
- **Code Quality**: TypeScript for type safety, ESLint for code standards
- **Build Process**: Separate builds for client (Vite) and server (esbuild) with production optimizations
- **Note**: vite.config.ts is not used due to compatibility issues with tsx; configuration is inline in server/start.ts
- **Performance Optimizations** (October 2025):
  - Vite dependency pre-bundling for faster dev server startup
  - Aggressive cache-busting headers for development to prevent stale code issues
  - Chunk splitting strategy: vendor libraries separated into 5 optimized chunks (react, router, query, forms, ui)
  - Build time improved by ~16% (17.8s vs 21.3s)
  - Main bundle reduced by ~23% through better code splitting (1.53MB vs 1.99MB)
  - Uses @vitejs/plugin-react-swc for faster compilation

# External Dependencies

## Cloud Services
- **Google Cloud Storage**: Object storage for media files, user content, and static assets
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and backup
- **Replit Infrastructure**: Development environment, authentication provider, and deployment platform

## Authentication & Security
- **Replit OAuth**: Primary authentication for development environment with OIDC compliance
- **Passport.js**: Authentication middleware for session management and OAuth flows
- **Express Session**: Session storage with PostgreSQL backend for persistence

## Payment Processing
- **Adult-friendly Payment Processors**: Integration ready for specialized payment providers that support adult content monetization
- **Payout System**: Database schema prepared for creator earnings, tips, and subscription revenue tracking

## UI & Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **Uppy**: File upload library with dashboard interface for media management
- **Tailwind CSS**: Utility-first CSS framework with custom GirlFanz brand configuration

## Development Tools
- **Vite Plugins**: Basic React plugin (Replit-specific plugins removed due to missing dependencies)
- **TypeScript**: Full stack type safety with shared types between client and server
- **Drizzle Kit**: Database schema management and migration tools
- **Workflow**: "Start application" workflow runs via npm which has been configured to load server/start.ts

## Real-time Features
- **WebSocket (ws)**: Native WebSocket implementation for real-time messaging and live features
- **Server-Sent Events**: Prepared for push notifications and real-time updates

## Content Management
- **Content Moderation**: Automated and manual moderation workflows for user-generated content
- **Media Processing**: Image and video handling with watermarking capabilities
- **Analytics**: Creator dashboard with earnings, engagement, and performance metrics
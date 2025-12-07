# Overview

FANZClub is a content creator monetization platform built as a full-stack web application. The platform enables creators to monetize their content through subscriptions, tips, and exclusive content sharing while building communities with their fans. The application features creator profiles, content management, messaging systems, subscriber management, and analytics dashboards.

# Recent Changes

**September 08, 2025**: Successfully integrated PostgreSQL database using Neon
- Migrated from in-memory storage (MemStorage) to persistent database storage (DatabaseStorage)
- All database tables created and schema pushed successfully
- Database connection established using Drizzle ORM with Neon serverless PostgreSQL
- Application verified to be running correctly with database integration

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting dark mode
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **File Uploads**: Uppy file uploader with AWS S3 integration via @uppy/aws-s3

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for server bundling

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Shared schema definitions in TypeScript with Zod validation
- **Migrations**: Drizzle Kit for database migrations and schema management

## Authentication & Authorization
- **Provider**: Replit OIDC authentication system
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Strategy**: Passport.js with OpenID Connect strategy
- **Access Control**: Object-level ACL system for content access control

## Object Storage
- **Provider**: Google Cloud Storage
- **Authentication**: Replit sidecar service for GCS credentials
- **Access Control**: Custom ACL policy system with metadata-based permissions
- **File Management**: Direct browser-to-GCS uploads with presigned URLs

## API Design
- **Architecture**: RESTful API with Express.js routes
- **Data Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware
- **Logging**: Request/response logging with performance metrics

## Data Models
The application manages several core entities:
- **Users**: Authentication and profile data
- **Creators**: Extended profiles for content creators with monetization settings
- **Posts**: Content items with media attachments and visibility controls
- **Messages**: Direct messaging between users and creators
- **Subscriptions**: Paid subscription relationships
- **Tips**: One-time monetary contributions
- **Analytics**: Performance and engagement metrics

## Development Environment
- **Replit Integration**: Configured for Replit development environment with cartographer plugin
- **Hot Reload**: Vite HMR for frontend and tsx watch mode for backend
- **Error Handling**: Runtime error overlay for development debugging

# External Dependencies

## Cloud Services
- **Google Cloud Storage**: Object storage for media files and content
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Services**: Authentication (OIDC), object storage credentials via sidecar

## Authentication
- **Replit OIDC**: Primary authentication provider
- **OpenID Connect**: Standards-based authentication flow

## File Upload & Storage
- **Uppy**: File upload library with dashboard interface
- **AWS S3 Adapter**: For direct-to-cloud uploads (configured for GCS compatibility)
- **Google Cloud Storage**: Backend storage service

## UI & Styling
- **Radix UI**: Headless UI component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **TypeScript**: Type safety across full stack
- **Vite**: Frontend build tool and dev server
- **Drizzle Kit**: Database schema management
- **esbuild**: Backend bundling for production
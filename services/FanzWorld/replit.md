# Overview

This is a modern full-stack social media application called "Fanz World" built with a cyberpunk aesthetic. The application allows users to create posts, interact with content through likes and comments, follow other users, and discover trending content. It features a futuristic UI design with neon colors and cyber-themed styling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with a custom cyberpunk theme featuring neon colors and futuristic design elements
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Server**: Express.js with TypeScript for the REST API
- **Development Setup**: Vite middleware integration for hot module replacement during development
- **Data Layer**: In-memory storage implementation with interface-based design for future database integration
- **API Design**: RESTful endpoints for users, posts, comments, likes, and follows with proper error handling

## Database Schema
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe schema definitions
- **Tables**: Users, posts, comments, likes, and follows with proper foreign key relationships
- **Schema Validation**: Zod schemas for runtime validation matching the database schema

## File Upload Integration
- **Cloud Storage**: Google Cloud Storage integration via @google-cloud/storage
- **File Upload UI**: Uppy file upload components for drag-and-drop functionality and progress tracking
- **AWS S3 Support**: Uppy AWS S3 plugin for alternative cloud storage options

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL via Neon serverless database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Cloud Storage**: Google Cloud Storage for file uploads and media storage

### UI and Styling
- **Component Library**: Radix UI primitives for accessible component foundations
- **Styling Framework**: Tailwind CSS with custom cyberpunk theme and CSS variables
- **File Upload**: Uppy ecosystem for modern file upload experiences

### Development Tools
- **Build Tool**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for production bundling and TypeScript checking
- **Development**: Replit integration with cartographer plugin and runtime error overlay

### Utilities
- **Validation**: Zod for schema validation and type inference
- **Date Handling**: date-fns for date formatting and manipulation
- **Class Management**: clsx and tailwind-merge for conditional CSS classes
- **Icons**: Lucide React for consistent iconography

The application is designed for deployment on Replit with development-specific plugins and optimizations. The architecture supports both development and production environments with proper environment variable configuration for database connections and external service integrations.

## Development Scripts

### Git Repository Maintenance
- **git:cleanup**: Comprehensive Git repository cleanup using `scripts/git-cleanup.js`
- **git:gc**: Performs garbage collection and prunes unreferenced objects (`git gc --prune=now`)
- **git:reflog-expire**: Expires all reflog entries immediately (`git reflog expire --expire=now --all`)

The Git maintenance scripts help keep the repository clean by removing unreferenced objects and expired reflog entries. Use `npm run git:cleanup` for a complete repository cleanup operation.
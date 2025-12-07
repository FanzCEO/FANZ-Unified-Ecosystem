# Fanz Unlimited Network (FUN)

## Overview

FUN is a modern adult content streaming platform built for the Gen Z audience, featuring three distinct networks: BoyFanz, GirlFanz, and PupFanz. The platform emphasizes creator empowerment with the tagline "I burned the rulebook" and follows a creator-first philosophy where "Creators > Platforms — you own your magic."

The application is a full-stack web platform built with React on the frontend and Express.js on the backend, featuring age verification, creator spotlights, video streaming, and social interaction features like direct messaging and community engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Routing**: Client-side routing using Wouter for lightweight navigation
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system featuring vibrant gradients and dark theme
- **Mobile-First Design**: Responsive layout with distinct mobile and desktop experiences

### Backend Architecture

- **Express.js Server**: RESTful API server with middleware for logging and error handling
- **TypeScript**: Full type safety across the entire application
- **In-Memory Storage**: Current implementation uses a memory-based storage system with sample data
- **API Design**: RESTful endpoints for creators, videos, and platform statistics
- **Development Hot Reloading**: Vite integration for seamless development experience

### Database Design

- **Schema Definition**: Drizzle ORM with PostgreSQL schema definitions
- **Tables**: Users, creators, and videos with proper relationships and constraints
- **Type Safety**: Drizzle-Zod integration for runtime validation and type inference
- **Migration System**: Drizzle Kit for database migrations and schema management

### Authentication & Authorization

- **Age Verification**: Client-side age gate component for adult content compliance
- **Planned User System**: Database schema ready for user registration and authentication
- **Creator Verification**: Boolean flags for verified creator status and badges

### Component Architecture

- **Age Gate**: Full-screen overlay for age verification with branded messaging
- **Network Navigation**: Tabbed interface for switching between BoyFanz, GirlFanz, and PupFanz
- **Creator Spotlight**: Carousel display of featured creators with status badges
- **Video Components**: Card-based layout with thumbnails, quality indicators, and interaction buttons
- **Responsive Headers**: Collapsible navigation for mobile with search and notifications
- **Promotional Banners**: Strategic placement for subscription conversion

### Design System

- **Color Palette**: Dark theme with vibrant accent colors (purple, pink, cyan, orange)
- **Typography**: Inter font family with multiple weights and sizes
- **Custom CSS Variables**: Consistent theming across components
- **Gradient Effects**: Animated gradients for branding and call-to-action elements
- **Interactive Elements**: Hover effects, micro-interactions, and smooth transitions

## External Dependencies

### Frontend Dependencies

- **React Ecosystem**: React 18 with TypeScript support
- **UI Components**: Radix UI primitives for accessibility and shadcn/ui for styled components
- **State Management**: TanStack React Query for server state and caching
- **Form Handling**: React Hook Form with Hookform Resolvers for validation
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Utility Libraries**: clsx and class-variance-authority for conditional styling

### Backend Dependencies

- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM configured for PostgreSQL with Neon serverless
- **Validation**: Zod for runtime type checking and validation
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development Tools**: tsx for TypeScript execution and esbuild for production builds

### Build & Development Tools

- **Vite**: Modern build tool with HMR and optimized bundling
- **TypeScript**: Full type safety with strict configuration
- **ESBuild**: Fast bundling for production server builds
- **Drizzle Kit**: Database migration and schema management
- **Replit Integration**: Development environment plugins for seamless cloud development

### Planned Integrations

- **Video Hosting**: External video storage and streaming service integration
- **Payment Processing**: Subscription and micro-transaction payment systems
- **CDN**: Content delivery network for global video streaming
- **Analytics**: User engagement and creator performance tracking
- **Notification System**: Real-time notifications for creators and fans

## Recent Changes

**September 5, 2025**

- Fixed rate limiting configuration for development environment
  - Increased auth endpoint rate limit from 5 to 100 requests per 15 minutes in development
  - Increased general endpoint rate limit from 100 to 1000 requests per 15 minutes in development
- Updated Content Security Policy (CSP) configuration to be more permissive for development
  - Added support for WebSocket connections (ws:, wss:) in connectSrc
  - Added 'unsafe-eval' to scriptSrc for development tooling
  - Added blob: protocol support for images and media
  - Added https: protocol support for external resources
  - Added workerSrc and childSrc directives for web workers and embedded content

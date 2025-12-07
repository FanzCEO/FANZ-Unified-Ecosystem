# FanzMeta

## Overview

FanzMeta is a comprehensive marketing automation platform designed specifically for freelancers and content creators. It leverages artificial intelligence to streamline content creation, social media management, email marketing, and lead generation, enabling individual creators to compete with larger agencies. The application provides a suite of AI-powered tools including content generation, image creation, email template design, social media scheduling, and automated lead sourcing. Built as a full-stack web application, it combines a modern React frontend with an Express.js backend, featuring a clean, professional interface designed for content creators on platforms like Freelancer who want to scale their services with AI automation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture. The application uses Vite as the build tool and development server, providing fast hot module replacement and optimized production builds. State management is handled through React Query for server state and local React state for UI interactions. The routing system is implemented with Wouter, providing a lightweight alternative to React Router.

The UI framework leverages Tailwind CSS for styling with shadcn/ui components providing a consistent design system. The component library includes over 30 pre-built UI components based on Radix UI primitives, ensuring accessibility and consistent behavior. The design system uses CSS custom properties for theming, supporting both light and dark modes with a professional color palette focused on blues and purples.

### Backend Architecture
The server-side utilizes Express.js with TypeScript in ESM format, providing a RESTful API architecture. The application follows a modular route structure with dedicated endpoints for different AI services. The server implements middleware for request logging, JSON parsing, and error handling. Development and production environments are handled differently, with Vite integration for development and static file serving for production.

The storage layer is designed with an interface-based approach, currently implementing an in-memory storage solution for development. The storage interface defines methods for user management, content tracking, and campaign data, making it easy to swap implementations without changing business logic.

### Database Design
The application uses Drizzle ORM with PostgreSQL as the database solution. The schema defines three main entities: users for authentication, generated content for tracking AI-created materials, and campaigns for marketing automation workflows. All tables use UUID primary keys and include proper relationships with foreign key constraints. The schema supports JSON metadata fields for flexible data storage and includes timestamps for audit trails.

### AI Integration
The application integrates with OpenAI's GPT-4o model for content generation and DALL-E for image creation. The AI service layer abstracts these integrations through a clean interface, providing methods for content generation, image creation, email template design, and social media post enhancement. Each AI operation includes proper error handling and configurable parameters for tone, style, and length.

### Authentication & Security
The current implementation includes user schema and storage interfaces prepared for authentication, though the active implementation uses a demo user approach. The application is structured to easily integrate session-based authentication with secure password handling and user management.

### Build & Deployment
The build process uses Vite for frontend compilation and esbuild for backend bundling. The application supports both development and production modes with appropriate optimizations. Static assets are served from a dedicated directory, and the build output is structured for easy deployment to various hosting platforms.

## External Dependencies

### Core Framework Dependencies
- **React 18** - Frontend framework with hooks and modern features
- **Express.js** - Backend web framework for Node.js
- **TypeScript** - Type safety across the entire application
- **Vite** - Frontend build tool and development server

### Database & ORM
- **Drizzle ORM** - Type-safe database toolkit with schema management
- **PostgreSQL** - Primary database (configured via Neon Database)
- **Drizzle Kit** - Database migration and schema management tools

### AI & External Services
- **OpenAI API** - GPT-4o for content generation and DALL-E for images
- **@neondatabase/serverless** - Serverless PostgreSQL connection

### UI Framework & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Pre-built component library based on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Icon library for consistent iconography

### Data Management
- **TanStack React Query** - Server state management and caching
- **Zod** - Runtime type validation and schema definition
- **React Hook Form** - Form state management and validation

### Development Tools
- **Replit Integration** - Development environment support with cartographer and error overlay
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** - CSS processing with Tailwind integration

### Session & Storage
- **connect-pg-simple** - PostgreSQL session store (prepared for authentication)
- **nanoid** - Unique ID generation for various entities

The application is designed to be easily extendable with additional AI services and can be deployed to various cloud platforms with minimal configuration changes.
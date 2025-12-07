# FanzLink - Creator Link Management Platform

## Overview

FanzLink is a comprehensive "link in bio" platform designed specifically for creators to manage and showcase their online presence. The application provides a centralized hub where creators can display their social media links, showcase products through FanzCommerce integration, track analytics, and connect with various Fanz brand platforms. Built with a modern React frontend and Express backend, it offers a seamless experience for both creators and their audiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and gradients for the FanzLink brand
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Next-themes for dark/light mode switching with custom CSS variables

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Storage**: Abstracted storage layer with in-memory implementation (ready for database integration)
- **API Design**: RESTful endpoints for user management, social links, products, analytics, and brand integrations
- **Validation**: Zod schemas for request/response validation
- **Development**: Hot module replacement and error overlay for development experience

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL with Neon serverless driver
- **Schema**: Comprehensive schema covering users, social links, products, analytics, and Fanz brand connections
- **Validation**: Drizzle-zod integration for type-safe database operations

### Core Features
- **User Profiles**: Customizable creator profiles with verification badges, themes, and bio information
- **Social Links Management**: Platform-specific social media link integration with custom styling and ordering
- **FanzCommerce Integration**: Product showcase with images, pricing, and descriptions
- **Analytics Dashboard**: Real-time tracking of clicks, views, conversion rates, and performance metrics
- **Fanz Brands Integration**: Seamless connection with FanzMusic, FanzVideo, and FanzGaming platforms
- **Theme System**: Light/dark mode support with custom brand colors and gradients

### Development Architecture
- **Module Federation**: Shared types and schemas between client and server
- **Build System**: Separate build processes for client (Vite) and server (esbuild)
- **Development Tools**: Runtime error overlay, TypeScript checking, and hot reload
- **Path Mapping**: Configured aliases for clean import statements

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL database for production data storage
- **Drizzle Kit**: Database migrations and schema management

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework with custom FanzLink design system
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Additional social media platform icons

### State Management & API
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod validation

### Development & Build Tools
- **Vite**: Fast development server and build tool with React plugin
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript/TypeScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### Third-Party Integrations
- **Social Media Platforms**: Instagram, YouTube, TikTok, Twitter, LinkedIn, Twitch integration
- **Fanz Brand Ecosystem**: FanzMusic, FanzVideo, FanzGaming platform connections
- **Analytics Providers**: Ready for Google Analytics or other tracking service integration
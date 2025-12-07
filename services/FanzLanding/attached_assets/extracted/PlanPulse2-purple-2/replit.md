# FanzLab 2.0 - Creator Economy Platform

## Overview

FanzLab 2.0 is a comprehensive creator economy platform that serves as the centralized gateway to multiple content clusters. The platform features a dark-themed, neon-styled interface inspired by the "dripping banana" brand aesthetic. It provides single sign-on access across multiple specialized creator communities (clusters) while maintaining strict compliance with adult content regulations, particularly USC 2257 requirements.

The system is designed as a multi-role platform supporting Fans, STARs (creators), Moderators, Admins, and Executives, each with tailored dashboards and functionality. The platform emphasizes compliance, security, and monetization while providing a unified user experience across diverse content communities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: Flask with Jinja2 templating
- **Styling**: Bootstrap 5 with custom neon CSS theme
- **Design Pattern**: Component-based template structure with reusable elements (navbar, footer, loading components)
- **Theme**: Dark mode with neon glow effects, emphasizing pink, cyan, green, and yellow accent colors
- **JavaScript**: Vanilla JavaScript with progressive enhancement for interactive features

### Backend Architecture

- **Framework**: Flask web application with modular route organization
- **Database ORM**: SQLAlchemy with DeclarativeBase pattern
- **Authentication**: Flask-Login for session management
- **File Handling**: Werkzeug for secure file uploads with size limits (16MB)
- **Security**: ProxyFix middleware for proper header handling behind proxies

### Data Storage Solutions

- **Primary Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Connection Pooling**: SQLAlchemy with connection recycling and pre-ping health checks
- **File Storage**: Local filesystem uploads directory with secure filename generation
- **Session Storage**: Flask sessions with secure cookie configuration

### Authentication and Authorization

- **User Roles**: Enum-based role system (Fan, STAR, Moderator, Admin, Executive)
- **Password Security**: Werkzeug password hashing
- **Session Security**: Secure, HTTP-only cookies with SameSite protection
- **Access Control**: Role-based views and functionality restrictions

### Content Management System

- **Multi-Cluster Architecture**: Support for 14 specialized clusters (BoyFanz, GirlFanz, PupFanz, etc.)
- **Scene Management**: Content creation with participant tracking and consent management
- **Document Management**: Secure upload and storage of compliance documents
- **Verification Pipeline**: Multi-step KYC and document verification process

### Compliance and Legal Framework

- **USC 2257 Compliance**: Built-in forms and document collection
- **Age Verification**: Integration with VerifyMy API for identity verification
- **Audit Trail**: Comprehensive event logging with forensic data (IP, device fingerprinting, geolocation)
- **Consent Management**: Scene-level consent forms with e-signature capabilities
- **Document Retention**: 7-year retention policy for compliance documents

### Security Architecture

- **Encryption**: AES-256 at rest, TLS 1.2+ in transit
- **File Security**: SHA-256 hashing for file integrity verification
- **Device Fingerprinting**: Browser-based device identification for fraud prevention
- **Emergency Controls**: Kill switch and emergency lockdown capabilities
- **Quarantine System**: Content moderation with automated and manual review processes

## External Dependencies

### Third-Party APIs

- **VerifyMy**: Identity verification service for KYC compliance
  - Used for government ID verification and liveness detection
  - Integrated into the 2257 compliance workflow

### Payment Processing (Planned)

- **Multiple Gateway Support**: Architecture prepared for Paxum, CCBill, NMI, Host Merchant, and Payoneer
- **Currently Disabled**: All payment gateways configured but not yet active

### Frontend Libraries

- **Bootstrap 5**: UI component framework and responsive grid system
- **Font Awesome 6**: Icon library for consistent iconography
- **Custom Neon Theme**: Proprietary CSS for brand-specific styling

### Development and Deployment

- **Environment Configuration**: Environment variable-based configuration for secrets and API keys
- **File Upload Security**: Werkzeug secure filename handling and type validation
- **Logging**: Python logging module for application monitoring
- **Session Management**: Flask sessions with configurable security parameters

### Database Extensions

- **SQLAlchemy**: ORM with enum support for type-safe role and status management
- **Connection Management**: Automatic connection pooling and health checking
- **Migration Support**: Declarative base pattern for schema evolution

The platform is designed to scale horizontally across multiple clusters while maintaining centralized compliance, security, and user management. The architecture supports future expansion of payment systems, AI moderation tools, and additional verification services.

## Theme Management System (CMS)

### Comprehensive Visual Theme Editor

- **Shopify-Style Theme Marketplace**: Browse, preview, and install professional themes
- **Webflow-Style Visual Editor**: Drag-and-drop components with live preview
- **WordPress-Style Customization**: Extensive widget system and component library
- **Real-time Preview**: See changes instantly across desktop, tablet, and mobile viewports
- **Asset Management**: Upload and manage images, backgrounds, and visual assets

### Features

- **15+ Drag-and-Drop Components**: Headers, navigation, hero sections, text blocks, images, galleries, buttons, forms, footers, social links, videos, card grids, testimonials, pricing tables, and contact info
- **Live Color Customization**: Real-time color picker with instant preview
- **Asset Upload System**: Drag and drop images with automatic optimization
- **Responsive Design Tools**: Test themes across multiple device sizes
- **Theme Marketplace**: Professional and custom themes with rating system
- **Layer Management**: Visual layer system for component organization
- **Custom CSS Support**: Advanced users can add custom styling
- **Theme Export/Import**: Share and backup custom themes
- **Version Control**: Track theme changes and revert when needed

### Database Architecture

- **Theme Model**: Stores theme configuration, colors, layout, and animation settings
- **ThemeAsset Model**: Manages uploaded images and visual assets
- **Component System**: Flexible widget architecture for extensibility
- **Version Tracking**: Complete audit trail of theme modifications

### Access Control

- Available to Admin and Executive users through Admin dropdown in navigation
- Role-based permissions for theme creation, editing, and publishing
- Asset upload restrictions based on user roles and file type validation

This comprehensive theme management system provides the combined power of Shopify's marketplace, WordPress's flexibility, and Webflow's visual design tools, giving administrators complete control over the platform's appearance and user experience.

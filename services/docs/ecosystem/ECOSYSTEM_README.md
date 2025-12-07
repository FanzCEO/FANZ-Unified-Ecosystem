# FanzEcosystem 🎬

Welcome to the FanzEcosystem - a comprehensive, interconnected platform for fan engagement and content creation consisting of four integrated platforms.

## 🌐 Ecosystem Overview

The FanzEcosystem connects four specialized platforms:

1. **🌟 FanzLanding** - Main portal and landing page (https://myfanz.network)
2. **🔧 FanzDash** - Super admin dashboard (https://admin.myfanz.network)  
3. **🛡️ FanzHubVault** - Secure personal information management (https://vault.myfanz.network)
4. **🎬 MediaCore** - Media storage with forensic signature and content protection (https://media.myfanz.network)

## 🚀 Quick Start

### Initialize the Complete Ecosystem
```bash
./init-ecosystem.sh
```

### Setup Warp Terminal (Recommended)
```bash
./warp-setup.sh
```

## 📋 Platform Details

### FanzLanding (Main Portal) 🌟
- **Purpose:** Primary entry point that everyone sees first
- **Features:** User registration, content browsing, creator discovery, subscriptions
- **Technology:** React, Vite, Tailwind CSS, Progressive Web App

### FanzDash (Super Admin Dashboard) 🔧  
- **Purpose:** Centralized administration for the entire ecosystem
- **Features:** User management, system monitoring, content moderation, security dashboard
- **Security:** Multi-factor auth, RBAC, comprehensive audit logging

### FanzHubVault (Secure Vault) 🛡️
- **Purpose:** Highly secured content creators and fans personal information
- **Features:** Encrypted data storage, privacy controls, GDPR/CCPA compliance
- **Security:** AES-256-GCM encryption, HSM key management, zero trust architecture

### MediaCore (Media Platform) 🎬
- **Purpose:** Media storage with forensic signature and content protection
- **Features:** Multi-format processing, forensic watermarking, anti-piracy, CDN delivery
- **Protection:** DRM, content fingerprinting, real-time piracy monitoring

## 🔗 Platform Connections

```
    FanzLanding (Portal)
         │
    ┌────┼────┐
    │    │    │
FanzDash │ MediaCore
    │    │    │
    └────┼────┘
   FanzHubVault (Secure)
```

- **Secure API Gateway:** https://api.myfanz.network
- **Mutual TLS:** All inter-platform communication encrypted
- **Zero Trust:** No implicit trust between platforms
- **Centralized Monitoring:** Real-time health and performance tracking

## 🛠️ Environment Commands

### Basic Commands
```bash
fanz-status      # Show environment details
fanz-platforms   # List all connected platforms  
fanz-health      # Check platform health
fanz-init        # Initialize complete ecosystem
```

### Development Commands
```bash
fanz-build       # Build all platforms
fanz-test        # Run integration tests
fanz-deploy      # Deploy ecosystem
fanz-logs        # View aggregated logs
```

## Warp Terminal Integration

This project comes with optimized Warp terminal configuration for an enhanced development experience.

### Quick Setup

Run the setup script to configure Warp terminal:

```bash
./warp-setup.sh
```

### Manual Setup

1. **Install Warp Terminal** (if not already installed):
   - macOS: `brew install --cask warp`
   - Other platforms: Download from [warp.dev](https://www.warp.dev/)

2. **Copy Configuration Files**:
   ```bash
   cp .warp/settings.yaml ~/.warp/
   cp .warp/themes/FanzDark.yaml ~/.warp/themes/
   ```

3. **Load Environment Variables**:
   ```bash
   source .env
   ```

### Features

- **Custom FanzDark Theme**: Optimized dark theme with FanzEcosystem branding
- **AI-Powered Suggestions**: Enhanced command completion and suggestions
- **Pre-configured Aliases**: Quick commands for common FanzEcosystem operations
- **Environment Setup**: Automated development environment configuration

## 🔒 Security & Compliance

- **FanzHubVault:** Maximum security with HSM, biometric verification, GDPR/CCPA compliance
- **MediaCore:** Advanced content protection, forensic watermarking, anti-piracy measures  
- **FanzDash:** Admin-level security with comprehensive audit trails and MFA
- **FanzLanding:** Standard web security with CSP, XSS protection, and SSL

## 📚 Documentation

- [Platform Architecture](docs/architecture.md) - Detailed technical architecture
- [API Documentation](https://api.myfanz.network/docs) - Complete API reference
- [Security Guide](docs/security.md) - Security best practices
- [Deployment Guide](docs/deployment.md) - Production deployment

## 🏥 Health Monitoring

Each platform provides health endpoints:
- FanzLanding: https://myfanz.network/health
- FanzDash: https://admin.myfanz.network/health  
- FanzHubVault: https://vault.myfanz.network/health
- MediaCore: https://media.myfanz.network/health

## 🌍 Access Points

- **Main Portal:** https://myfanz.network (Public access)
- **Admin Dashboard:** https://admin.myfanz.network (Admin only)
- **API Gateway:** https://api.myfanz.network (Developers)
- **Documentation:** https://docs.myfanz.network (Public)

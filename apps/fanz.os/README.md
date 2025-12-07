# Fanz Operating System

A comprehensive digital creator platform designed for complete portability and independence from hosting providers.

## 🌟 Platform Overview

Fanz Operating System is the core infrastructure powering the Fanz Unlimited Network - a fully portable, production-ready adult content creator platform. Built for complete independence from hosting services, it facilitates creator monetization through subscriptions, pay-per-view content, tips, and messaging.

### Core Modules
- **FANZCore**: Subscription social platform
- **FANZfluence**: MLM + affiliate marketing system  
- **Live Streaming**: Real-time content delivery
- **Contests & Gamification**: Creator engagement tools
- **Merchandise System**: Physical product sales

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Multi-provider OAuth + 2FA
- **File Storage**: S3-compatible cloud storage
- **Payments**: Multiple processor integration

### Key Features
- **100% Portable**: Zero vendor lock-in
- **Multi-Provider Auth**: Google, Facebook, Twitter, Instagram, Reddit
- **Advanced Security**: 2FA, session management, rate limiting
- **Real-time Notifications**: Web push + mobile alerts
- **Content Moderation**: AI + human review pipeline
- **Payment Processing**: CCBill, NowPayments, Triple-A, Bankful
- **Global CDN**: Optimized content delivery

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t fanz-os .
docker run -p 5000:5000 fanz-os
```

### Option 2: Direct Node.js Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Option 3: GO Server Deployment (High Performance)
```bash
# Install dependencies and build all components
npm install
npm run build:render

# Start GO server (optimized for production)
npm run start:go
```

### Option 4: Development Mode
```bash
# Start development server
npm run dev
```

## 🌐 Environment Configuration

Create a `.env` file with your configuration:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/fanz_db

# Payment Processors
CCBILL_CLIENT_ID=your_ccbill_id
NOWPAYMENTS_API_KEY=your_nowpayments_key
TRIPLEA_API_KEY=your_triplea_key

# Storage Configuration
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your_bucket_name

# Authentication
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id
```

## 📊 Performance Features

- **Advanced Caching**: Multi-layer response caching
- **Rate Limiting**: API protection and abuse prevention
- **Memory Monitoring**: Automatic performance tracking
- **Request Optimization**: Header and compression optimization
- **Database Optimization**: Connection pooling and query optimization

## 🔒 Security Features

- **Multi-Factor Authentication**: TOTP-based 2FA
- **Session Management**: PostgreSQL-backed sessions
- **Rate Limiting**: Granular API protection
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet Integration**: Security headers enforcement

## 🎯 Creator Monetization

- **Subscription Tiers**: Flexible recurring billing
- **Pay-Per-View**: Individual content unlocks
- **Direct Tipping**: Fan-to-creator transactions
- **Affiliate Program**: Multi-level marketing system
- **Merchandise Sales**: Physical product integration
- **Live Streaming**: Real-time monetization

## 📱 Platform Independence

The Fanz Operating System is engineered for complete portability:

- **No Vendor Lock-in**: Runs on any cloud provider
- **Standard Technologies**: Uses widely-supported tech stack
- **Flexible Storage**: Works with any S3-compatible storage
- **Database Agnostic**: PostgreSQL-compatible with any provider
- **CDN Independent**: Integrates with multiple CDN providers

## 🛠️ Development

### Database Management
```bash
# Push schema changes
npm run db:push

# Generate migrations
npm run db:generate

# View database
npm run db:studio
```

### Code Quality
```bash
# Type checking
npm run check

# Linting
npm run lint

# Testing
npm run test
```

## 🌍 Global Deployment

Deploy the Fanz Operating System on any cloud provider:

- **AWS**: EC2, ECS, Lambda
- **Google Cloud**: Compute Engine, Cloud Run
- **Azure**: App Service, Container Instances
- **DigitalOcean**: Droplets, App Platform
- **Vercel**: Serverless deployment
- **Netlify**: Static + serverless functions
- **Self-Hosted**: Any VPS or dedicated server

## 📞 Support & Documentation

For technical support and detailed documentation:
- Platform Documentation: `/docs`
- API Reference: `/api/docs`
- Developer Guides: `/docs/technical`
- Admin Panel: `/admin`

## 🚀 Getting Started

### Quick Setup
1. **Clone this repository**
2. **Follow the [Setup Guide](SETUP.md)** for detailed GitHub and deployment instructions
3. **Configure your environment** using `.env.example`
4. **Deploy to your preferred cloud provider**

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

For detailed setup instructions, see [SETUP.md](SETUP.md).

---

**Fanz Operating System** - Empowering creators with complete platform independence.

[![Deploy](https://img.shields.io/badge/Deploy-Multiple%20Platforms-blue)](SETUP.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20+-brightgreen.svg)](package.json)
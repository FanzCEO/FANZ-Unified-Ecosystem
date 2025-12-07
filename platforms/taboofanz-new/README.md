# TabooFanz

<div align="center">
  <img src="docs/assets/logo.png" alt="TabooFanz Logo" width="200" />

  **The Dark, Alt, Underground Adult Creator Platform**

  *A safe, consent-first home for boundary-pushing creators and fans with alternative, fetish-adjacent, and underground aesthetics.*

  [![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)]()
  [![Node](https://img.shields.io/badge/node-20+-brightgreen.svg)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)]()
  [![pnpm](https://img.shields.io/badge/pnpm-8.11-orange.svg)]()
</div>

---

## 🌙 About TabooFanz

TabooFanz is the "shadow network" of the FANZ ecosystem — designed for creators who don't fit mainstream platforms. We serve alt/goth/cyberpunk communities, kink-adjacent lifestyles, queer underground scenes, masked/anonymous personas, and boundary-pushing aesthetics.

### Core Values

- **Consent-Obsessed**: Every interaction is built on clear consent and boundaries
- **Creator-Protective**: 80% earnings, identity protection, and safety-first tools
- **Alt-Friendly**: Tagging and discovery built for underground aesthetics
- **Privacy-First**: Masked mode, region blocking, and alias protection

---

## ✨ Key Features

### For Creators

- **🎭 Masked Creator Mode** - Never show your face. Auto-blur backgrounds, face detection warnings, and complete identity separation.
- **🔮 Taboo Archetypes** - Build your persona: The Siren, The Phantom, The Rebel, The Enigma, and more.
- **🛡️ Boundary Profile** - Set clear boundaries that fans must respect.
- **🌍 Region Blocking** - Block specific countries, states, or regions.
- **💰 80% Earnings** - Keep what you earn with transparent, fast payouts.
- **🤖 AI Assistant** - Non-explicit caption suggestions, safety warnings, and brand building.

### For Fans

- **🔍 Alt-Friendly Discovery** - Find creators by archetype, aesthetic, power energy, and vibe.
- **🌗 Safe Mode** - Lighter content filtering for those who want it.
- **💬 Respectful Messaging** - Clear guidelines on interactions and boundaries.
- **🎬 Live Streams** - Watch live with real-time chat and tipping.

---

## 🏗️ Architecture

TabooFanz is built as a monorepo using Turborepo with the following structure:

```
taboofanz/
├── apps/
│   ├── web/          # Next.js 14 web application
│   ├── mobile/       # React Native mobile app
│   └── api/          # tRPC API server
├── packages/
│   ├── database/     # Prisma schema and database client
│   ├── ui/           # Shared UI component library
│   ├── shared/       # Shared types, constants, validators
│   └── config/       # Shared configurations
├── docs/             # Documentation
└── infrastructure/   # Docker, K8s, Terraform
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, Radix UI |
| **Mobile** | React Native, Expo |
| **API** | tRPC, Express, Node.js |
| **Database** | PostgreSQL, Prisma ORM |
| **Cache** | Redis |
| **Auth** | JWT (jose), bcrypt, OAuth2 |
| **Payments** | Stripe Connect |
| **Storage** | AWS S3 / Cloudflare R2 |
| **Streaming** | Mux / Cloudflare Stream |
| **AI** | OpenAI API (non-explicit assistance) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/fanz-ecosystem/taboofanz.git
cd taboofanz

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:push

# Seed the database
pnpm db:seed

# Start development servers
pnpm dev
```

### Development URLs

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (run `pnpm db:studio`)

---

## 📁 Project Structure

### Apps

#### `apps/web` - Next.js Web Application
```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Auth pages (login, signup)
│   │   ├── explore/      # Discovery & search
│   │   ├── feed/         # User feed
│   │   ├── live/         # Live streaming
│   │   ├── messages/     # Direct messages
│   │   ├── studio/       # Creator studio
│   │   ├── admin/        # Admin dashboard
│   │   └── c/[handle]/   # Creator profiles
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   └── styles/           # Global styles
```

#### `apps/api` - tRPC API Server
```
apps/api/
├── src/
│   ├── routers/          # tRPC routers
│   │   ├── auth.ts       # Authentication
│   │   ├── user.ts       # User management
│   │   ├── creator.ts    # Creator profiles
│   │   ├── content.ts    # Content CRUD
│   │   ├── tag.ts        # Tags & discovery
│   │   ├── subscription.ts
│   │   ├── wallet.ts     # Payments
│   │   ├── message.ts    # Messaging
│   │   ├── live.ts       # Live streaming
│   │   └── admin.ts      # Admin operations
│   ├── lib/              # Utilities
│   └── services/         # Business logic
```

### Packages

#### `packages/database` - Prisma Schema
Contains the complete data model including:
- Users, CreatorProfile, FanProfile
- Content, Media, Stories
- Subscriptions, Transactions, Wallet
- Tags, Archetypes
- Identity Protection, Boundary Profiles
- Compliance Records, Reports

#### `packages/shared` - Shared Code
- TypeScript types
- Constants (fees, limits, archetypes)
- Zod validators

#### `packages/ui` - Component Library
- Themed UI components
- TabooFanz design tokens
- Animation utilities

---

## 🎨 Design System

### Color Palette

| Token | Color | Usage |
|-------|-------|-------|
| `taboo-bg` | Ultra-dark charcoal | Global background |
| `taboo-surface` | Deep violet/plum | Cards, panels |
| `taboo-accent-primary` | Neon magenta | Primary CTAs |
| `taboo-glitch` | Electric cyan | Secondary accent |
| `taboo-danger` | Hot red | Alerts, errors |
| `taboo-success` | Acid green | Success states |

### Typography

- **Display**: Orbitron (angular, futuristic)
- **Body**: Inter (clean, readable)

### Key Components

- Neon buttons with glow effects
- Glitch text animations
- Archetype badges
- Tag pills
- Scanline overlays

---

## 🔐 Security & Compliance

### Age Verification
- ID verification for creators (Jumio/Veriff integration)
- Age verification for fans
- 18 U.S.C. 2257 compliance

### Identity Protection
- Masked Creator Mode
- Face detection warnings
- Background blur tools
- Location detection warnings
- Region/IP blocking

### Content Safety
- File scanning for malware
- Content moderation queue
- Report system
- DMCA takedown workflow

### Data Privacy
- Encrypted sensitive data
- Separation of legal identity from persona
- Right to delete/access data
- Audit logging

---

## 📊 API Reference

### Authentication
```typescript
// Register
auth.register({ email, password, username, role })

// Login
auth.login({ email, password })

// Get current user
auth.me()
```

### Content
```typescript
// Get feed
content.feed({ cursor, limit })

// Create content
content.create({ type, visibility, caption, price, tags, mediaItems })

// Like/unlike
content.like({ id })
content.unlike({ id })
```

### Creator
```typescript
// Discover creators
creator.discover({ archetype, powerEnergy, tags, cursor })

// Update profile
creator.updateProfile({ archetype, tagline, subscriptionPrice })

// Update identity protection
creator.updateIdentityProtection({ maskedModeEnabled, blockedCountries })
```

See [API Documentation](docs/api/README.md) for complete reference.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm test --filter=@taboofanz/api
```

---

## 📦 Deployment

### Docker

```bash
# Build all images
docker compose build

# Start services
docker compose up -d
```

### Kubernetes

Helm charts and manifests available in `infrastructure/k8s/`.

### Environment Variables

See `.env.example` for required configuration.

---

## 🤝 Contributing

TabooFanz is a private project within the FANZ ecosystem. For contribution guidelines, contact the team.

---

## 📄 License

UNLICENSED - All rights reserved.

---

## 🔗 Links

- [Architecture Documentation](docs/architecture/README.md)
- [API Documentation](docs/api/README.md)
- [UX Specifications](docs/ux/README.md)
- [Compliance Guide](docs/compliance/README.md)

---

<div align="center">
  <p><strong>TabooFanz</strong> - Part of the FANZ Ecosystem</p>
  <p><em>Enter the Taboo. Own Your Darkness.</em></p>
</div>

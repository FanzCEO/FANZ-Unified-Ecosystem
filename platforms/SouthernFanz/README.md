# SouthernFanz - FANZ Ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security](https://github.com/FanzCEO/SouthernFanz/workflows/Security/badge.svg)](https://github.com/FanzCEO/SouthernFanz/security)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-green.svg)](https://www.w3.org/WAI/WCAG22/quickref/)

> **RAISE HELL. RIDE FREE.**
> The badass platform for Southern bad boys and girls who don't play by the rules. Outlaw creators. Rebel souls. No limits.

## About

SouthernFanz is where the wild ones roam. Built for the rebels, outlaws, and untamed spirits of the South. This ain't your mama's content platform - it's a honky-tonk, backroad, bonfire-lit revolution:

- **100% Creator Earnings** - Keep every damn dollar you earn. We don't take a cut until you're making bank
- **Rebel Aesthetic** - Whiskey-soaked vibes, leather & chrome, dusty roads, neon-lit honky tonks
- **AI-Powered** - Smart as a fox, works while you play - auto-tagging, dynamic pricing, content moderation
- **Privacy & Compliance** - Locked down tighter than a moonshine still. Full DMCA, 2257, GDPR protection

## Quick Start

### Prerequisites
- **Node.js** 20+ (LTS recommended)
- **pnpm** 9+ (package manager)
- **Docker** 24+ (containerization)

### Installation

```bash
# Clone repository
git clone https://github.com/FanzCEO/SouthernFanz.git
cd SouthernFanz

# Install dependencies
pnpm install

# Set up environment
cp env/.env.example env/.env.local

# Start development
pnpm dev
```

### Docker Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Architecture

This service follows FANZ ecosystem standards:

- **Microservices Architecture** - Scalable, independent services
- **API-First Design** - RESTful APIs with OpenAPI documentation
- **Event-Driven Communication** - Real-time updates via event streams
- **Zero-Trust Security** - Every request authenticated and authorized
- **Creator-First Features** - All functionality serves creator needs

## Content Categories

### Rebel Vibes
Outlaw Biker, Muscle Car Mechanic, Whiskey Bar Baddie, Backroad Drifter, Bonfire Rebel, Honky Tonk Hellraiser, Rodeo Renegade, Southern Gothic, Trailer Park Royalty, Moonshine Runner

### Southern Territories
Texas Outlaws, Georgia Peaches, Florida Wild, Alabama Heat, Louisiana Swamp, Nashville Nights, Carolina Thunder

### Scene/Story Themes
Bar Fight Flirtation, Truckbed Confessions, Rodeo After Dark, Swamp Secrets, Backroad Rendezvous, Bonfire Sins, Garage Grease & Glory

### Hot Tags
Rebel Summer, County Fair Chaos, Rodeo Outlaws, Bonfire Badasses, Tailgate Trouble, Southern Storm

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Quality Assurance
pnpm lint                   # Lint code
pnpm typecheck             # TypeScript checking
pnpm test                  # Run tests
pnpm test:coverage         # Test with coverage

# Database
pnpm db:migrate            # Run migrations
pnpm db:seed               # Seed development data

# Security
pnpm audit:security        # Security audit
pnpm audit:dependencies    # Dependency audit
```

### Code Quality Standards

- **TypeScript** - All new code must be TypeScript
- **85%+ Test Coverage** - Comprehensive test coverage required
- **WCAG 2.2 AA** - Full accessibility compliance
- **Zero Secrets** - No hardcoded secrets or credentials
- **Creator-First** - All changes must benefit creators

## Security

Security is paramount in the FANZ ecosystem:

- **TLS 1.3 Encryption** - All data encrypted in transit
- **AES-256 Encryption** - Data encrypted at rest
- **Zero-Trust Architecture** - No default network trust
- **Regular Security Audits** - Continuous vulnerability assessment

See [SECURITY.md](SECURITY.md) for detailed security information.

## Contributing

We welcome contributions that align with our creator-first mission!

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-creator-tool`
3. **Commit** your changes: `git commit -m 'feat: add creator dashboard'`
4. **Push** to the branch: `git push origin feature/amazing-creator-tool`
5. **Submit** a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## FANZ Ecosystem

This repository is part of the larger FANZ ecosystem:

- **[FANZ Unified Ecosystem](https://github.com/FanzCEO/FANZ-Unified-Ecosystem)** - Main ecosystem repository
- **[SouthernFanz](https://southernfanz.com)** - Southern-themed creator platform
- **[SouthernFanz](https://southernfanz.com)** - Male creator platform
- **[GirlFanz](https://girlfanz.com)** - Female creator platform
- **[PupFanz](https://pupfanz.com)** - Pet/furry creator community
- **[TabooFanz](https://taboofanz.com)** - Adult content platform
- **[FanzDash](https://github.com/FanzCEO/FanzDash)** - Unified admin dashboard

## Support

- **Discord**: [FANZ Creator Community](https://discord.gg/fanz-creators)
- **Email**: support@fanz.network
- **Docs**: [docs.fanz.network](https://docs.fanz.network)
- **Security**: security@fanz.network

---

**Built for rebels. By rebels. Raise Hell. Ride Free.**

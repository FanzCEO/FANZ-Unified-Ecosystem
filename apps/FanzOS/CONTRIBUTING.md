# Contributing to Fanz Operating System

Thank you for your interest in contributing to the Fanz Operating System! This guide will help you get started.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-username/fanz-operating-system.git
cd fanz-operating-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## 🏗️ Architecture

### Project Structure
```
├── client/              # React frontend
├── server/              # Express.js backend
├── shared/              # Shared types and schemas
├── docs/                # Documentation
├── .github/workflows/   # CI/CD pipelines
└── attached_assets/     # Static assets
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Multi-provider OAuth + 2FA
- **File Storage**: S3-compatible storage
- **Deployment**: Docker + Cloud-agnostic

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use Prettier for code formatting
- Write descriptive commit messages

### Database Changes
```bash
# Never edit SQL directly - use Drizzle schema
# 1. Update shared/schema.ts
# 2. Push changes to database
npm run db:push
```

### API Development
- Add new routes to `server/routes.ts`
- Use Zod for request validation
- Implement proper error handling
- Add rate limiting for public endpoints

### Frontend Development
- Use shadcn/ui components
- Implement proper loading states
- Add data-testid attributes for testing
- Use TanStack Query for server state

## 🧪 Testing

### Running Tests
```bash
# Type checking
npm run check

# Build verification
npm run build

# Security audit
npm audit
```

### Creating Tests
- Write unit tests for utilities
- Add integration tests for API endpoints
- Test authentication flows
- Verify payment processing

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 📋 Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation
4. **Test your changes**
   ```bash
   npm run check
   npm run build
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Commit Message Format
```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 🔒 Security

### Reporting Security Issues
- **DO NOT** open public issues for security vulnerabilities
- Email security concerns to: security@fanz.network
- Include detailed reproduction steps

### Security Guidelines
- Never commit sensitive data
- Use environment variables for secrets
- Implement proper input validation
- Follow OWASP security practices

## 🌟 Feature Requests

### Before Submitting
1. Check existing issues
2. Search closed issues
3. Consider if it fits the project scope

### Feature Request Template
```markdown
## Feature Description
Brief description of the feature

## Use Case
Why this feature is needed

## Implementation
Suggested implementation approach

## Alternatives
Alternative solutions considered
```

## 📞 Getting Help

### Documentation
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Overview](./docs/architecture.md)

### Community
- GitHub Discussions for questions
- GitHub Issues for bugs
- Pull Requests for contributions

## 📄 License

By contributing to Fanz Operating System, you agree that your contributions will be licensed under the project's MIT License.

## 🙏 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for helping make the Fanz Operating System better!
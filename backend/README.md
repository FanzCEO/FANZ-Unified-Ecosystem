# 🚀 FANZ Unified Ecosystem - Backend API

Revolutionary Creator Economy Platform - Enterprise-grade TypeScript/Node.js backend API with real-time features, blockchain integration, and quantum AI capabilities.

## 🏗️ Architecture Overview

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis with pub/sub support
- **Real-time**: Socket.IO WebSocket connections
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Security**: JWT authentication, rate limiting, input validation
- **Blockchain**: Ethereum integration with Web3
- **AI/ML**: OpenAI integration for content moderation and recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone and Install**
```bash
cd backend
cp .env.example .env.local
# Edit .env.local with your configuration
npm install
```

2. **Start Dependencies** 
```bash
# Using Docker Compose
docker-compose -f ../docker-compose.dev.yml up -d postgres-dev redis-dev

# Or install locally
# Install PostgreSQL and Redis manually
```

3. **Database Setup**
```bash
# Run initial migration
npm run db:migrate

# Seed with development data
npm run db:seed
```

4. **Start Development Server**
```bash
npm run dev
```

The API will be available at:
- **API**: http://localhost:3000
- **Metrics**: http://localhost:3001/metrics
- **Health**: http://localhost:3000/health

## 📡 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/test` - API test endpoint

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/oauth/:provider` - OAuth login

### Users & Profiles
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile
- `POST /api/v1/users/:id/follow` - Follow user

### Content Management
- `GET /api/v1/content/feed` - Content feed
- `POST /api/v1/content` - Create content
- `PUT /api/v1/content/:id` - Update content
- `DELETE /api/v1/content/:id` - Delete content

### Payments & Subscriptions
- `POST /api/v1/payments/process` - Process payment
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/transactions` - Transaction history

### Blockchain Integration
- `POST /api/v1/blockchain/tokens` - Create creator token
- `POST /api/v1/blockchain/tokens/:id/trade` - Token trading
- `GET /api/v1/blockchain/portfolio` - User portfolio

### Real-time Features
- WebSocket connection at `/socket.io`
- Events: `user:online`, `content:new`, `payment:received`

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode  
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # ESLint checks
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript checks

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
```

## 🏗️ Project Structure

```
backend/
├── src/                    # Source code
│   ├── app.ts             # Express app setup
│   ├── server.ts          # Server entry point
│   ├── config/            # Configuration
│   │   ├── index.ts       # Environment config
│   │   ├── database.ts    # Database connection
│   │   └── redis.ts       # Redis connection
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # Authentication
│   │   ├── errorHandler.ts # Error handling
│   │   ├── logger.ts      # Request logging
│   │   └── metrics.ts     # Prometheus metrics
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript definitions
├── tests/                 # Test files
├── migrations/            # Database migrations
├── docker/                # Docker configurations
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── Dockerfile             # Production Docker image
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables
Key environment variables (see `.env.example` for complete list):

```bash
# Core
NODE_ENV=development
PORT=3000

# Database  
DATABASE_URL=postgresql://user:pass@localhost:5432/fanz_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-32-chars-minimum
REFRESH_TOKEN_SECRET=your-refresh-secret

# External APIs
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
AWS_ACCESS_KEY_ID=AKIA...
```

### Feature Flags
Control features via environment variables:
- `ENABLE_WEBSOCKETS=true` - Real-time features
- `ENABLE_BLOCKCHAIN=true` - Blockchain integration
- `ENABLE_AI_FEATURES=true` - AI/ML features
- `ENABLE_PLAYGROUND=true` - Development playground

## 📊 Monitoring & Observability

### Metrics
Prometheus metrics available at `/metrics`:
- HTTP request metrics (count, duration, status codes)
- Database connection metrics
- Redis operation metrics
- WebSocket connection metrics
- Custom business metrics

### Logging
Structured JSON logging with Winston:
- Request/response logging
- Error tracking with stack traces
- Performance monitoring
- Security event logging

### Health Checks
- `/health` - Basic health check
- `/ready` - Kubernetes readiness probe (checks DB and Redis)

## 🔒 Security

### Authentication & Authorization
- JWT tokens with refresh rotation
- Role-based access control (RBAC)
- Multi-factor authentication support
- OAuth integration (Google, Twitter, Discord)

### Security Middleware
- Helmet.js for security headers
- Rate limiting per IP and user
- Input validation with Joi
- SQL injection prevention
- XSS protection

### Data Protection
- Bcrypt password hashing
- Sensitive data encryption
- PII tokenization
- GDPR compliance helpers

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual functions and classes
- **Integration Tests**: API endpoints with database
- **End-to-End Tests**: Full application workflows

### Running Tests
```bash
# All tests
npm test

# Specific test suites
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=user

# Coverage
npm run test:coverage
```

## 🐳 Docker Deployment

### Development
```bash
# Build development image
docker build -t fanz-api:dev .

# Run with environment
docker run -p 3000:3000 --env-file .env.local fanz-api:dev
```

### Production
```bash
# Multi-stage production build
docker build -t fanz-api:prod --target production .

# Run production container
docker run -p 3000:3000 -p 3001:3001 fanz-api:prod
```

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates in place
- [ ] Monitoring dashboards setup
- [ ] Log aggregation configured
- [ ] Backup procedures tested
- [ ] Security scans completed

### Kubernetes Deployment
See `/infrastructure/kubernetes/` for manifests:
- Deployment configurations
- Service definitions
- Ingress rules
- ConfigMaps and Secrets
- HorizontalPodAutoscaler

## 🤝 Contributing

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commits
- Unit test coverage > 80%

### Pull Request Process
1. Fork repository and create feature branch
2. Write tests for new functionality
3. Update documentation as needed
4. Run all checks: `npm run lint && npm run type-check && npm test`
5. Submit pull request with clear description

## 📚 Additional Resources

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](../docs/deployment-guide.md)
- [Security Framework](../security/security-framework.md)

---

**Built with ❤️ for the creator economy revolution**
# 💻 FANZ UNIFIED ECOSYSTEM - DEVELOPER GUIDE
*Revolutionary Creator Economy Platform - Development Documentation*

## 🚀 **QUICK START GUIDE**

### **Prerequisites**
```bash
# Required versions
node --version    # >= 18.0.0
yarn --version    # >= 1.22.0
docker --version  # >= 24.0.0
git --version     # >= 2.40.0
```

### **Development Environment Setup**
```bash
# Clone the repository
git clone https://github.com/your-org/fanz-unified-ecosystem.git
cd fanz-unified-ecosystem

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development database
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Run database migrations
yarn db:migrate

# Seed development data
yarn db:seed

# Start development server
yarn dev
```

### **Environment Variables**
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fanz_ecosystem_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# Payment Processing
PAYMENT_PROCESSOR_API_KEY=your-processor-api-key
PAYMENT_WEBHOOK_SECRET=your-webhook-secret

# Blockchain Configuration
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
BLOCKCHAIN_NETWORK=ethereum
PRIVATE_KEY=your-wallet-private-key

# Cloud Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=fanz-storage-dev
CLOUDFRONT_DOMAIN=cdn.fanz.dev

# External Services
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
SENDGRID_API_KEY=your-sendgrid-api-key

# Development
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_PLAYGROUND=true
```

---

## 🏗️ **PROJECT STRUCTURE**

```
fanz-unified-ecosystem/
├── backend/                    # Backend API services
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   ├── validators/       # Input validation
│   │   └── types/            # TypeScript definitions
│   ├── tests/                # Backend tests
│   ├── migrations/           # Database migrations
│   └── seeds/               # Database seed data
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service calls
│   │   ├── store/           # State management
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript definitions
│   │   └── assets/          # Static assets
│   ├── public/              # Public assets
│   └── tests/               # Frontend tests
├── shared/                   # Shared code/types
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utilities
│   └── constants/           # Shared constants
├── blockchain/               # Smart contracts & blockchain
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── tests/               # Contract tests
│   └── migrations/          # Contract migrations
├── infrastructure/           # Infrastructure as code
│   ├── terraform/           # Terraform configurations
│   ├── kubernetes/          # Kubernetes manifests
│   ├── docker/              # Docker configurations
│   └── scripts/             # Deployment scripts
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # Architecture docs
│   ├── deployment/          # Deployment guides
│   └── development/         # Development guides
├── monitoring/              # Monitoring configurations
│   ├── grafana/             # Grafana dashboards
│   ├── prometheus/          # Prometheus configs
│   └── alerts/              # Alert rules
└── security/                # Security configurations
    ├── policies/            # Security policies
    ├── compliance/          # Compliance docs
    └── audit/               # Audit logs
```

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **Git Workflow**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request through GitHub UI
# After approval, merge to develop branch
```

### **Commit Convention**
```bash
# Format: <type>(<scope>): <description>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes
refactor: # Code refactoring
perf:     # Performance improvements
test:     # Adding tests
chore:    # Maintenance tasks

# Examples:
feat(auth): add OAuth2 authentication
fix(api): resolve user registration bug
docs(readme): update setup instructions
test(user): add unit tests for user service
```

### **Code Quality**
```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Run type checking
yarn type-check

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Format code
yarn format

# Pre-commit hooks (automated)
# - ESLint
# - Prettier
# - TypeScript check
# - Unit tests
```

---

## 📡 **API DOCUMENTATION**

### **Authentication**

#### **Register User**
```typescript
POST /api/auth/register

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role: 'fan' | 'creator';
  profile: {
    display_name: string;
    bio?: string;
    birth_date: string;
  };
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    profile: UserProfile;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}
```

#### **Login User**
```typescript
POST /api/auth/login

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  session: UserSession;
}
```

#### **OAuth Login**
```typescript
GET /api/auth/oauth/:provider
# Providers: google, twitter, discord

# Redirect to OAuth provider
# Callback: GET /api/auth/oauth/:provider/callback

interface OAuthResponse {
  user: User;
  tokens: AuthTokens;
  is_new_user: boolean;
}
```

### **User Management**

#### **Get User Profile**
```typescript
GET /api/users/:userId

interface UserProfileResponse {
  id: string;
  username: string;
  role: string;
  profile: {
    display_name: string;
    bio: string;
    avatar_url: string;
    cover_image_url: string;
    location: string;
    website: string;
    social_links: {
      twitter?: string;
      instagram?: string;
      tiktok?: string;
    };
  };
  creator_profile?: {
    verification_status: string;
    content_categories: string[];
    pricing: {
      subscription_price: number;
      tip_minimum: number;
    };
    statistics: {
      total_subscribers: number;
      total_content: number;
      total_revenue: number;
    };
  };
  created_at: string;
  updated_at: string;
}
```

#### **Update User Profile**
```typescript
PUT /api/users/:userId

interface UpdateProfileRequest {
  profile?: {
    display_name?: string;
    bio?: string;
    location?: string;
    website?: string;
    social_links?: {
      twitter?: string;
      instagram?: string;
      tiktok?: string;
    };
  };
}
```

### **Content Management**

#### **Create Content**
```typescript
POST /api/content

interface CreateContentRequest {
  title: string;
  description: string;
  content_type: 'image' | 'video' | 'audio' | 'text' | 'live_stream';
  media_urls: string[];
  tags: string[];
  is_premium: boolean;
  premium_price?: number;
  scheduled_publish_at?: string;
}

interface CreateContentResponse {
  id: string;
  title: string;
  description: string;
  content_type: string;
  media_urls: string[];
  tags: string[];
  is_premium: boolean;
  premium_price?: number;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  created_at: string;
  published_at?: string;
}
```

#### **Get Content Feed**
```typescript
GET /api/content/feed?page=1&limit=20&category=all&sort=latest

interface ContentFeedResponse {
  content: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    categories: string[];
    sort_options: string[];
  };
}
```

### **Subscription Management**

#### **Subscribe to Creator**
```typescript
POST /api/subscriptions

interface SubscribeRequest {
  creator_id: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_method_id: string;
}

interface SubscriptionResponse {
  id: string;
  creator_id: string;
  fan_id: string;
  billing_cycle: string;
  price: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}
```

### **Payment Processing**

#### **Process Payment**
```typescript
POST /api/payments/process

interface PaymentRequest {
  type: 'tip' | 'content_purchase' | 'subscription';
  amount: number;
  currency: string;
  payment_method_id: string;
  recipient_id: string;
  content_id?: string;
  message?: string;
}

interface PaymentResponse {
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  fees: {
    platform_fee: number;
    payment_processor_fee: number;
    net_amount: number;
  };
  created_at: string;
}
```

### **Blockchain Integration**

#### **Create Creator Token**
```typescript
POST /api/blockchain/tokens

interface CreateTokenRequest {
  name: string;
  symbol: string;
  total_supply: number;
  description: string;
  initial_price: number;
}

interface TokenResponse {
  token_id: string;
  contract_address: string;
  name: string;
  symbol: string;
  total_supply: number;
  creator_id: string;
  blockchain_network: string;
  transaction_hash: string;
  created_at: string;
}
```

#### **Token Trading**
```typescript
POST /api/blockchain/tokens/:tokenId/trade

interface TokenTradeRequest {
  action: 'buy' | 'sell';
  quantity: number;
  price_per_token?: number; // For limit orders
  order_type: 'market' | 'limit';
}
```

### **Metaverse Integration**

#### **Virtual Spaces**
```typescript
GET /api/metaverse/spaces

interface VirtualSpacesResponse {
  spaces: {
    id: string;
    name: string;
    description: string;
    space_type: string;
    capacity: number;
    owner: {
      id: string;
      username: string;
      display_name: string;
    };
    environment: {
      theme: string;
      assets: string[];
    };
    access_control: {
      type: 'public' | 'private' | 'premium';
      requirements?: any;
    };
    current_occupancy: number;
    created_at: string;
  }[];
}
```

### **Real-time Features**

#### **WebSocket Events**
```typescript
// Connection
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Events
interface SocketEvents {
  // User events
  'user:online': { user_id: string };
  'user:offline': { user_id: string };
  
  // Content events
  'content:new': ContentItem;
  'content:liked': { content_id: string, user_id: string };
  'content:commented': Comment;
  
  // Payment events
  'payment:received': {
    transaction_id: string;
    amount: number;
    from_user: string;
    message?: string;
  };
  
  // Live streaming
  'stream:started': { creator_id: string, stream_id: string };
  'stream:ended': { stream_id: string };
  'stream:viewer_joined': { stream_id: string, viewer_count: number };
  
  // Messaging
  'message:new': Message;
  'message:read': { message_id: string };
  
  // Notifications
  'notification:new': Notification;
}
```

---

## 🧪 **TESTING STRATEGY**

### **Testing Pyramid**
```
    /\
   /  \  E2E Tests (10%)
  /____\
 /      \
/  Unit  \ Integration Tests (20%)
\  Tests / 
 \______/ Unit Tests (70%)
```

### **Unit Testing**

#### **Backend Testing**
```typescript
// Example: User service test
import { UserService } from '../services/user.service';
import { MockRepository } from '../mocks/repository.mock';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = new MockRepository();
    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword',
        username: 'testuser'
      };

      mockRepository.save.mockResolvedValue({ id: '123', ...userData });

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.id).toBe('123');
      expect(result.email).toBe(userData.email);
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const userData = { email: 'existing@example.com' };
      mockRepository.findByEmail.mockResolvedValue({ id: '456' });

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        'User already exists'
      );
    });
  });
});
```

#### **Frontend Testing**
```typescript
// Example: Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
  });

  it('should render login form', () => {
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### **Integration Testing**
```typescript
// Example: API integration test
import request from 'supertest';
import { app } from '../app';
import { setupTestDb, teardownTestDb } from '../test-utils/db';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.tokens.access_token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('Invalid email format');
    });
  });
});
```

### **E2E Testing**
```typescript
// Example: Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete user registration', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="username-input"]', 'testuser');

    // Select user role
    await page.click('[data-testid="role-creator"]');

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Verify successful registration
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });
});
```

---

## 📊 **DATABASE MANAGEMENT**

### **Migrations**
```typescript
// Example: Create migration
yarn db:migration:create add_creator_tokens_table

// Generated migration file
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatorTokensTable implements MigrationInterface {
  name = 'AddCreatorTokensTable20240115000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE creator_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        total_supply BIGINT NOT NULL,
        current_price DECIMAL(18, 8) NOT NULL,
        contract_address VARCHAR(42) UNIQUE,
        blockchain_network VARCHAR(20) NOT NULL DEFAULT 'ethereum',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX idx_creator_tokens_creator_id ON creator_tokens(creator_id);
      CREATE INDEX idx_creator_tokens_symbol ON creator_tokens(symbol);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE creator_tokens;');
  }
}
```

### **Seeds**
```typescript
// Example: Seed data
import { Factory, Seeder } from 'typeorm-seeding';
import { User } from '../entities/User';

export default class CreateUsers implements Seeder {
  public async run(factory: Factory): Promise<any> {
    // Create admin user
    await factory(User)({
      role: 'admin',
      email: 'admin@fanz.eco',
      username: 'admin'
    }).create();

    // Create test creators
    await factory(User)({
      role: 'creator',
      email: 'creator1@example.com',
      username: 'creator1'
    }).createMany(5);

    // Create test fans
    await factory(User)({
      role: 'fan',
      email: 'fan1@example.com',
      username: 'fan1'
    }).createMany(10);
  }
}
```

### **Database Commands**
```bash
# Run migrations
yarn db:migrate

# Revert last migration
yarn db:migrate:revert

# Seed database
yarn db:seed

# Reset database (dev only)
yarn db:reset

# Generate new migration
yarn db:migration:generate migration_name

# Create empty migration
yarn db:migration:create migration_name

# Database status
yarn db:show
```

---

## 🔧 **DEBUGGING & PROFILING**

### **Logging**
```typescript
// Structured logging
import { Logger } from './utils/logger';

const logger = new Logger('UserService');

class UserService {
  async createUser(userData: CreateUserDto) {
    logger.info('Creating new user', {
      email: userData.email,
      role: userData.role,
      correlationId: 'req-123'
    });

    try {
      const user = await this.repository.save(userData);
      
      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        correlationId: 'req-123'
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        error: error.message,
        stack: error.stack,
        userData: { ...userData, password: '[REDACTED]' },
        correlationId: 'req-123'
      });
      
      throw error;
    }
  }
}
```

### **Performance Monitoring**
```typescript
// Performance tracking
import { performance } from 'perf_hooks';
import { metrics } from './utils/metrics';

function performanceDecorator(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await method.apply(this, args);
    const duration = performance.now() - start;

    metrics.histogram('method_duration_ms', duration, {
      class: target.constructor.name,
      method: propertyName
    });

    if (duration > 1000) {
      logger.warn('Slow method execution', {
        class: target.constructor.name,
        method: propertyName,
        duration,
        args: args.length
      });
    }

    return result;
  };
}

class UserService {
  @performanceDecorator
  async getUser(id: string) {
    // Method implementation
  }
}
```

### **Error Tracking**
```typescript
// Centralized error handling
import * as Sentry from '@sentry/node';

interface ErrorContext {
  user?: { id: string; email: string };
  request?: { url: string; method: string; params: any };
  extra?: Record<string, any>;
}

class ErrorTracker {
  static captureException(error: Error, context?: ErrorContext) {
    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }

      if (context?.request) {
        scope.setContext('request', context.request);
      }

      if (context?.extra) {
        Object.keys(context.extra).forEach(key => {
          scope.setExtra(key, context.extra![key]);
        });
      }

      scope.setLevel('error');
      Sentry.captureException(error);
    });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
  }
}

// Usage in middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  ErrorTracker.captureException(error, {
    user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
    request: {
      url: req.url,
      method: req.method,
      params: req.params
    },
    extra: {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
```

---

## 🚀 **DEPLOYMENT & RELEASE**

### **Development Deployment**
```bash
# Build application
yarn build

# Run production build locally
yarn start:prod

# Deploy to development environment
yarn deploy:dev
```

### **Staging Deployment**
```bash
# Deploy to staging
yarn deploy:staging

# Run E2E tests against staging
yarn test:e2e:staging

# Performance tests
yarn test:performance:staging
```

### **Production Deployment**
```bash
# Create release branch
git checkout -b release/v1.2.0

# Update version
yarn version --new-version 1.2.0

# Build and test
yarn build
yarn test:all

# Deploy to production
yarn deploy:prod

# Tag release
git tag v1.2.0
git push origin v1.2.0
```

### **Release Checklist**
- [ ] **Code Quality**
  - [ ] All tests passing
  - [ ] Code review completed
  - [ ] Security scan passed
  - [ ] Performance benchmarks met

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] Changelog updated
  - [ ] Release notes prepared
  - [ ] Migration guide (if needed)

- [ ] **Infrastructure**
  - [ ] Database migrations tested
  - [ ] Environment variables updated
  - [ ] Third-party integrations tested
  - [ ] Monitoring alerts configured

- [ ] **Post-deployment**
  - [ ] Health checks passing
  - [ ] Smoke tests successful
  - [ ] Performance metrics normal
  - [ ] Error rates within limits

---

## 🤝 **CONTRIBUTING GUIDELINES**

### **Code Style**
```typescript
// Use TypeScript strict mode
// Always define interfaces for data structures

interface UserCreateRequest {
  email: string;
  password: string;
  username: string;
  profile: {
    display_name: string;
    bio?: string;
  };
}

// Use descriptive variable names
const isUserVerified = user.verification_status === 'verified';
const hasActiveSubscription = subscription?.status === 'active';

// Error handling patterns
class UserService {
  async createUser(data: UserCreateRequest): Promise<User> {
    try {
      // Validate input
      if (!data.email || !data.password) {
        throw new ValidationError('Email and password are required');
      }

      // Check for existing user
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError('User already exists');
      }

      // Create user
      const user = await this.repository.save(data);
      
      // Log success
      this.logger.info('User created', { userId: user.id });
      
      return user;
    } catch (error) {
      // Log error with context
      this.logger.error('Failed to create user', {
        error: error.message,
        email: data.email
      });
      
      throw error;
    }
  }
}
```

### **Pull Request Process**
1. **Fork the repository** and create feature branch
2. **Write tests** for new functionality
3. **Update documentation** if needed
4. **Run code quality checks** locally
5. **Create pull request** with detailed description
6. **Address review comments** promptly
7. **Merge** after approval and CI passes

### **Issue Reporting**
```markdown
## Bug Report Template

**Description**
Brief description of the issue

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- Browser/Node version:
- Operating System:
- Application version:

**Additional Context**
Screenshots, logs, etc.
```

---

## 📚 **USEFUL RESOURCES**

### **Documentation**
- [API Reference](./api/README.md)
- [Database Schema](./database/schema.md)
- [Architecture Overview](./architecture/README.md)
- [Security Guidelines](./security/README.md)

### **Tools & Libraries**
- **Backend**: Node.js, TypeScript, Express, TypeORM
- **Frontend**: React, TypeScript, React Query, Tailwind CSS
- **Database**: PostgreSQL, Redis
- **Testing**: Jest, Playwright, Testing Library
- **Monitoring**: Prometheus, Grafana, Sentry
- **Deployment**: Docker, Kubernetes, Terraform

### **External APIs**
- [Payment Processor API](https://docs.processor.com)
- [OAuth Providers](https://developers.google.com/identity)
- [Blockchain RPC](https://docs.infura.io/)
- [Cloud Storage](https://docs.aws.amazon.com/s3/)

### **Community**
- [Discord Server](https://discord.gg/fanz-dev)
- [GitHub Discussions](https://github.com/org/fanz/discussions)
- [Developer Forum](https://forum.fanz.dev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fanz)

---

## 🆘 **TROUBLESHOOTING**

### **Common Development Issues**

#### **Database Connection Issues**
```bash
# Check database status
docker ps | grep postgres

# View database logs
docker logs fanz-postgres

# Reset database
yarn db:reset

# Test connection
yarn db:test-connection
```

#### **Authentication Issues**
```bash
# Clear JWT tokens
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

# Check JWT validity
yarn jwt:verify <token>

# Reset user session
yarn auth:reset-session <user-id>
```

#### **Build Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# Clear build cache
yarn build:clean

# Check TypeScript errors
yarn type-check
```

#### **Performance Issues**
```bash
# Profile API endpoints
yarn profile:api

# Analyze bundle size
yarn analyze:bundle

# Check database query performance
yarn db:explain-queries
```

### **Getting Help**
- **Documentation**: Check relevant docs first
- **Search Issues**: Look for existing GitHub issues
- **Community**: Ask in Discord or forums
- **Support**: Create GitHub issue with template

---

*💻 This developer guide provides comprehensive documentation for building, testing, and contributing to the revolutionary FANZ Ecosystem platform. Happy coding!*

<citations>
<document>
<document_type>RULE</document_type>
<document_id>X9LylpzDci5RxgIxhrRw0v</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>d62dNKeS8A9OsBNvd9ZqzN</document_id>
</document>
</citations>
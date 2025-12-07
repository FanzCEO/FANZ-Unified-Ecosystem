# Technical Documentation

Technical architecture, deployment, and development information for the FansLab platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Deployment Guide](#deployment-guide)
5. [Development Setup](#development-setup)
6. [Security Implementation](#security-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Analytics](#monitoring--analytics)

## Architecture Overview

### System Architecture

FansLab uses a dual-server architecture optimized for performance and scalability:

**Express.js API Server (Node.js/TypeScript):**
- Handles business logic and data operations
- User authentication and authorization
- Real-time features (WebSocket connections)
- Payment processing integration
- Content management and moderation

**Go Static Server:**
- Serves static build files from `./dist`
- Server-Sent Events (SSE) for real-time updates
- High-performance static file delivery
- SPA routing support with proper MIME types
- Event stream management with automatic cleanup

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite build system for fast development
- Tailwind CSS + shadcn/ui components
- TanStack Query for server state management
- Wouter for lightweight client-side routing

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- JWT-based authentication
- WebSocket support for real-time features
- Multi-provider OAuth integration

**Infrastructure:**
- PostgreSQL (Neon Database)
- Object Storage (S3-compatible)
- External CDN for media delivery
- Multi-gateway payment processing

### Data Flow

```
Client Request → Express.js API → Database/External Services → Response
                      ↓
              Real-time updates via WebSocket/SSE
                      ↓
              Go Server → Static Files/Event Streams
```

## Database Schema

### Core Tables

**Users Table:**
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  bio TEXT,
  role VARCHAR DEFAULT 'fan' CHECK (role IN ('fan', 'creator', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  password_hash VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Posts Table:**
```sql
CREATE TABLE posts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id VARCHAR REFERENCES users(id),
  content TEXT,
  media_urls TEXT[],
  visibility VARCHAR DEFAULT 'free' CHECK (visibility IN ('free', 'subscription', 'ppv')),
  price DECIMAL(10,2) DEFAULT 0,
  hashtags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Subscriptions Table:**
```sql
CREATE TABLE subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR REFERENCES users(id),
  creator_id VARCHAR REFERENCES users(id),
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_posts_creator_id ON posts(creator_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_subscriptions_fan_id ON subscriptions(fan_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

## API Reference

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword",
  "role": "fan|creator"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**POST /api/auth/logout**
- Invalidates session and tokens

### Content Management Endpoints

**GET /api/posts**
- Query parameters: `page`, `limit`, `creator_id`, `visibility`
- Returns paginated posts with metadata

**POST /api/posts**
```json
{
  "content": "Post content",
  "media_urls": ["url1", "url2"],
  "visibility": "free|subscription|ppv",
  "price": 9.99,
  "hashtags": ["tag1", "tag2"]
}
```

**GET /api/posts/:id**
- Returns single post with engagement metrics

### Subscription Management

**POST /api/subscriptions**
```json
{
  "creator_id": "creator-uuid",
  "payment_method": "card|crypto"
}
```

**GET /api/subscriptions/my**
- Returns user's active subscriptions

### Live Streaming

**POST /api/streams/start**
```json
{
  "title": "Stream title",
  "description": "Stream description",
  "visibility": "public|subscribers|ticketed",
  "ticket_price": 5.99
}
```

**GET /api/streams/active**
- Returns currently active streams

### Analytics Endpoints

**GET /api/analytics/creator**
- Requires creator authentication
- Returns earnings, subscriber metrics, content performance

**GET /api/analytics/engagement/:postId**
- Returns detailed engagement metrics for a post

## Deployment Guide

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=fanslab

# Authentication
SESSION_SECRET=your-session-secret-key
JWT_SECRET=your-jwt-secret-key

# Object Storage
PUBLIC_OBJECT_SEARCH_PATHS=/bucket/public
PRIVATE_OBJECT_DIR=/bucket/.private

# External Services
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=your-paypal-client-id
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Build Process

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build backend
npm run build:server

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Database Migration

```bash
# Push schema changes
npm run db:push

# Generate migration (if using migrations)
npm run db:generate

# Apply migration
npm run db:migrate
```

## Security Implementation

### Authentication Flow

1. **Registration**: User provides credentials, system generates secure hash
2. **Email Verification**: Send verification token, verify on click
3. **Login**: Validate credentials, issue JWT tokens
4. **Session Management**: Refresh token rotation, session invalidation
5. **2FA**: TOTP-based additional security layer

### Data Protection

**Encryption:**
- All data transmitted over HTTPS/TLS
- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest
- JWT tokens with short expiration

**Input Validation:**
- All inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention with content sanitization
- CSRF protection with SameSite cookies

### Payment Security

- PCI DSS compliance through certified processors
- Tokenization of payment methods
- No storage of sensitive payment data
- 3D Secure implementation for card payments

## Performance Optimization

### Database Optimization

**Query Optimization:**
```sql
-- Use appropriate indexes
CREATE INDEX CONCURRENTLY idx_posts_creator_visibility 
ON posts(creator_id, visibility);

-- Optimize N+1 queries with joins
SELECT p.*, u.username, u.profile_image_url
FROM posts p
JOIN users u ON p.creator_id = u.id
WHERE p.visibility = 'free'
ORDER BY p.created_at DESC
LIMIT 20;
```

**Connection Pooling:**
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Caching Strategy

**Redis Caching:**
```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}:profile`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});

await redis.setex(cacheKey, 3600, JSON.stringify(user));
return user;
```

**CDN Configuration:**
- Static assets cached for 1 year
- API responses cached based on content type
- Media files served through CDN with geographic distribution

### Code Splitting

```typescript
// Lazy load components
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

// Route-based code splitting
const routes = [
  {
    path: '/creator',
    component: lazy(() => import('./pages/CreatorPage'))
  }
];
```

## Monitoring & Analytics

### Application Monitoring

**Health Checks:**
```typescript
app.get('/api/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkObjectStorage(),
    external: await checkExternalServices()
  };
  
  const healthy = Object.values(checks).every(check => check.status === 'ok');
  res.status(healthy ? 200 : 503).json(checks);
});
```

**Performance Metrics:**
- Response time monitoring
- Database query performance
- Memory and CPU usage
- Error rate tracking
- User engagement metrics

**Logging Strategy:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Analytics Implementation

**User Behavior Tracking:**
```typescript
const trackEvent = async (userId: string, event: string, properties: any) => {
  await db.insert(analytics_events).values({
    user_id: userId,
    event_name: event,
    properties: JSON.stringify(properties),
    timestamp: new Date()
  });
};
```

**Business Metrics:**
- Daily/Monthly Active Users (DAU/MAU)
- Creator retention rates
- Revenue per user
- Content engagement rates
- Conversion funnel analysis

### Error Handling

**Global Error Handler:**
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });
  
  res.status(500).json({
    message: 'Internal server error',
    requestId: req.headers['x-request-id']
  });
});
```

## Development Setup

### Local Development

```bash
# Clone repository
git clone https://github.com/your-org/fanslab.git
cd fanslab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Development Tools

**Code Quality:**
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

**Git Hooks:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test"
    }
  }
}
```

This technical documentation provides the foundation for understanding, deploying, and maintaining the FansLab platform.
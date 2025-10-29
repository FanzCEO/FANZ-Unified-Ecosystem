# 🚀 FanzAuth - Unified Identity and Authentication Service

> **Enterprise-grade authentication service for the FANZ Ecosystem**  
> Provides OAuth 2.0/OIDC SSO across all 9 platform clusters with unified user management

## 📊 Overview

FanzAuth is the centralized identity provider for the FANZ Unified Ecosystem, supporting:

- **OAuth 2.0 / OpenID Connect (OIDC)** - Standards-based authentication
- **Cross-Cluster SSO** - Single sign-on across all 9 platform clusters
- **Unified User Management** - Centralized user/creator/admin accounts
- **JWT-based Authentication** - Secure, stateless token authentication
- **Role-based Access Control** - Fine-grained permission system
- **Enterprise Security** - Rate limiting, session management, audit logging

## 🏗️ Architecture

### Platform Clusters Supported
- **FanzLab** - Universal portal (Neon theme)
- **BoyFanz** - Male creators (Neon Red #FF0040)
- **GirlFanz** - Female creators (Neon Pink #FF0080)
- **DaddyFanz** - Dom/sub community (Gold #FFD700)
- **PupFanz** - Pup community (Green #00FF40)
- **TabooFanz** - Extreme content (Blue #0040FF)
- **TransFanz** - Trans creators (Turquoise #00FFFF)
- **CougarFanz** - Mature creators (Gold #FFAA00)
- **FanzCock** - Adult TikTok (XXX Red/Black)

### Tech Stack
- **Node.js** + **TypeScript** - Runtime and language
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Session store and caching
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Winston** - Structured logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/joshuastone/FANZ-Unified-Ecosystem.git
   cd FANZ_UNIFIED_ECOSYSTEM/services/fanz-auth
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   # Create database
   createdb fanz_auth
   
   # Database will auto-initialize on first run
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3001/health
   ```

## 🔧 Configuration

### Required Environment Variables

```bash
# Core Configuration
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/fanz_auth
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secure-jwt-secret-key

# OIDC Configuration
OIDC_ISSUER=http://localhost:3001
JWT_ISSUER=https://auth.fanz.app
JWT_AUDIENCE=https://fanz.app

# CORS for platform clusters
CORS_ALLOWED_ORIGINS=https://fanzlab.fanz.app,https://boyfanz.fanz.app,...
```

See `.env.example` for complete configuration options.

## 🎯 API Endpoints

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Current user profile
- `POST /auth/forgot-password` - Password reset

### OIDC Endpoints
- `GET /oidc/.well-known/openid-configuration` - OIDC configuration
- `GET /oidc/jwks` - JSON Web Key Set
- `GET /oidc/authorize` - Authorization endpoint
- `POST /oidc/token` - Token endpoint
- `GET /oidc/userinfo` - User information
- `POST /oidc/introspect` - Token introspection
- `POST /oidc/revoke` - Token revocation

### System Endpoints
- `GET /health` - Health check
- `GET /` - Service information

## 📝 Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "user@example.com",
    "password": "SecurePass123",
    "primaryCluster": "fanzlab",
    "acceptedTerms": true
  }'
```

### User Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "cluster": "boyfanz",
    "rememberMe": true
  }'
```

### OIDC Authorization Code Flow
```bash
# 1. Authorization request
GET /oidc/authorize?response_type=code&client_id=boyfanz&redirect_uri=https://boyfanz.fanz.app/auth/callback&scope=openid profile email&state=random-state

# 2. Token exchange
POST /oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=AUTH_CODE&client_id=boyfanz&redirect_uri=https://boyfanz.fanz.app/auth/callback
```

### Protected Resource Access
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

## 🔐 Security Features

### Rate Limiting
- **Global**: 1000 requests per 15 minutes
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per hour per IP

### Password Security
- **bcrypt** with 12 rounds
- **Minimum 8 characters** with complexity requirements
- **Password reset** with secure token generation

### Session Management
- **JWT-based** with secure signing
- **Refresh tokens** for long-term sessions
- **Session cleanup** for expired tokens
- **Cross-cluster** session federation

### Security Headers
- **Helmet.js** for security headers
- **CORS** configuration for platform clusters
- **CSP** (Content Security Policy)
- **CSRF** protection ready

## 🧪 Development

### Running Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Formatting
npm run format
```

### Database Management
The service automatically initializes the database schema on startup, including:
- User and creator tables
- OAuth client registrations
- Session management tables
- OIDC authorization codes and tokens
- Role and permission system

### Hot Reloading
```bash
npm run dev
# Uses nodemon for automatic restarts
```

## 🐳 Docker Deployment

### Build Image
```bash
npm run docker:build
```

### Run Container
```bash
npm run docker:run
# or
docker run -p 3001:3001 --env-file .env fanz-auth-service
```

### Docker Compose
```yaml
version: '3.8'
services:
  fanz-auth:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/fanz_auth
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: fanz_auth
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7
    
volumes:
  postgres_data:
```

## 🔄 Migration & Integration

### Platform Integration
Each platform cluster integrates with FanzAuth as an OAuth 2.0 client:

1. **Client Registration**: Automatic on startup
2. **OIDC Discovery**: Via `/.well-known/openid-configuration`
3. **Authorization Flow**: Standard OAuth 2.0 code flow
4. **Token Validation**: JWT signature verification
5. **User Info**: Via `/oidc/userinfo` endpoint

### Session Federation
Cross-cluster SSO is achieved through:
- Shared OIDC tokens across domains
- Secure cookie-based session sharing
- Real-time session validation
- Automatic token refresh

### Migration from Legacy Systems
See `docs/migration-plan.md` for detailed migration strategy from existing authentication systems.

## 📊 Monitoring

### Health Checks
```bash
curl http://localhost:3001/health
```

Response includes:
- Service status
- Database connectivity
- OIDC service health
- Timestamp information

### Logging
Structured JSON logging with Winston:
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: Development mode

### Metrics
Ready for integration with:
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Sentry** - Error tracking
- **DataDog** - APM monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check PostgreSQL status
   pg_isready -h localhost -p 5432
   
   # Create database if missing
   createdb fanz_auth
   ```

2. **Redis Connection**
   ```bash
   # Test Redis connectivity
   redis-cli ping
   ```

3. **JWT Errors**
   - Verify `JWT_SECRET` is set and consistent
   - Check token expiration times
   - Validate issuer/audience claims

4. **CORS Issues**
   - Verify `CORS_ALLOWED_ORIGINS` includes all platform domains
   - Check protocol (http vs https) matches

### Debug Mode
```bash
DEBUG=true npm run dev
```

### Logs Analysis
```bash
# View recent errors
tail -f logs/error.log

# Search for specific issues
grep "JWT" logs/combined.log
```

## 🤝 Contributing

1. **Code Style**: Follow existing TypeScript patterns
2. **Testing**: Add tests for new features
3. **Documentation**: Update README and inline docs
4. **Security**: Follow OWASP guidelines
5. **Performance**: Consider scalability implications

## 📄 License

**PROPRIETARY** - FANZ Technical Team

## 🔗 Related Services

- **[CreatorCRM](../creator-crm/)** - Creator relationship management
- **[FanzDash](../fanz-dash/)** - Admin control center
- **[MediaCore](../media-core/)** - Media processing pipeline
- **[FanzShield](../fanz-shield/)** - Security and compliance

---

**🚀 Ready to power authentication for the entire FANZ ecosystem!**

For support: [tech-team@fanz.app](mailto:tech-team@fanz.app)
# 🛡️ FANZ Vendor Access Delegation System

**Comprehensive time-limited access control system for vendors and support staff**

## 📋 Overview

The FANZ Vendor Access Delegation System provides granular, time-limited access control for external vendors, support staff, and partners who need temporary access to specific parts of your FANZ ecosystem. This system ensures security while enabling necessary business operations.

### 🎯 Key Features

- **Time-Limited Access**: All access grants have configurable expiration times
- **Granular Permissions**: Category-based access control (content moderation, payments, analytics, etc.)
- **JWT-Based Authentication**: Secure token-based access with automatic expiration
- **Audit Logging**: Comprehensive tracking of all access activities
- **Emergency Controls**: Instant revocation capabilities
- **Approval Workflows**: Multi-step approval process for sensitive access
- **Session Management**: Real-time session tracking and monitoring
- **Risk Scoring**: Automated risk assessment for activities

## 🏗️ Architecture

### Core Components

1. **VendorAccessDelegationService**: Main business logic service
2. **VendorAccessController**: REST API endpoints
3. **VendorAccessMiddleware**: Request authentication and authorization
4. **VendorAccessDatabaseAdapter**: Database operations
5. **Database Schema**: PostgreSQL tables for persistence

### Permission Categories

- `admin-panel-members`: Full administrative access
- `admin-panel-staff`: Staff-level administrative access
- `content-moderation`: Content review and moderation tools
- `payment-processing`: Payment system access
- `analytics-readonly`: Read-only analytics and reporting
- `customer-support`: Customer service tools
- `user-management`: User account management
- `financial-reports`: Financial data access
- `system-monitoring`: System health and monitoring
- `api-management`: API configuration and monitoring

### Access Levels

- `read`: Read-only access to resources
- `write`: Read and write access (no delete)
- `full`: Complete access including delete operations

## 🚀 Quick Start

### 1. Database Setup

Run the database migration to create required tables:

```bash
# Apply the vendor access migration
psql -d fanz_unified -f backend/database/migrations/20250916_create_vendor_access_tables.sql
```

### 2. Environment Configuration

Add to your `.env` file:

```bash
# Vendor Access Configuration
VENDOR_JWT_SECRET=your-super-secure-vendor-jwt-secret
VENDOR_JWT_EXPIRES_IN=24h
VENDOR_MAX_SESSION_DURATION=168h  # 1 week max

# Database Configuration (if not already set)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fanz_unified
DB_USER=postgres
DB_PASSWORD=your-password
```

### 3. Server Integration

Add to your Express server:

```typescript
import { 
  createVendorAccessContainer, 
  createVendorAccessRoutes,
  createVendorAccessMiddleware 
} from './routes/vendor-access';

// Create container and routes
const vendorAccessContainer = createVendorAccessContainer(databasePool);
const vendorAccessRoutes = createVendorAccessRoutes(vendorAccessContainer);
const vendorAccessMiddleware = createVendorAccessMiddleware(vendorAccessContainer);

// Mount routes
app.use('/api/vendor-access', vendorAccessRoutes);

// Protect specific routes
app.get('/api/payments/dashboard', 
  vendorAccessMiddleware.requirePaymentAccess,
  (req, res) => { /* handler */ }
);
```

### 4. Seed Sample Data

Create sample vendors and grants for testing:

```bash
npx ts-node backend/scripts/seed-vendor-access.ts
```

## 📖 API Documentation

### Vendor Management

#### Register New Vendor
```http
POST /api/vendor-access/vendors
Content-Type: application/json

{
  "email": "vendor@company.com",
  "name": "Vendor Name",
  "company": "Company Inc.",
  "vendorType": "support",
  "contactInfo": {
    "phone": "+1-555-0123",
    "address": "123 Business St"
  }
}
```

#### Verify Vendor
```http
POST /api/vendor-access/vendors/{vendorId}/verify
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "backgroundCheckCompleted": true,
  "ndaSigned": true,
  "complianceTrainingCompleted": true
}
```

### Access Grant Management

#### Create Access Grant
```http
POST /api/vendor-access/grants
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "vendorId": "vendor-uuid",
  "categories": ["content-moderation", "customer-support"],
  "accessLevel": "read",
  "duration": 24,
  "reason": "Content review assistance",
  "restrictions": {
    "ipWhitelist": ["192.168.1.0/24"],
    "maxConcurrentSessions": 2
  }
}
```

#### Approve Access Grant
```http
POST /api/vendor-access/grants/{grantId}/approve
Authorization: Bearer {admin-token}
```

#### Generate Access Token
```http
POST /api/vendor-access/grants/{grantId}/token
Authorization: Bearer {admin-token}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-03-15T18:30:00.000Z",
  "grantId": "grant-uuid"
}
```

### Emergency Controls

#### Emergency Revoke All Access
```http
POST /api/vendor-access/emergency/revoke-all
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "reason": "Security breach detected"
}
```

#### Emergency Revoke Vendor Access
```http
POST /api/vendor-access/emergency/revoke-vendor/{vendorId}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "reason": "Suspicious activity detected"
}
```

### Analytics & Monitoring

#### Get Analytics Dashboard
```http
GET /api/vendor-access/analytics/dashboard
Authorization: Bearer {admin-token}

Response:
{
  "totalVendors": 12,
  "activeVendors": 8,
  "totalGrants": 25,
  "activeGrants": 15,
  "activeSessions": 6
}
```

## 🛡️ Security Features

### Token Security
- JWT tokens with short expiration (default: 24 hours)
- Secure token hashing in database
- Automatic token cleanup on expiration
- Token revocation capabilities

### Access Control
- Category-based permissions
- IP address restrictions
- Session limits per vendor
- Time-based access windows

### Audit Trail
- Complete activity logging
- Risk score calculation
- Failed access attempt tracking
- Administrative action logs

### Emergency Safeguards
- Instant global access revocation
- Per-vendor emergency controls
- Automated suspicious activity detection
- Alert system integration

## 🧪 Testing

### Run Tests
```bash
# Unit and integration tests
npm test vendor-access

# Run specific test suites
npm test vendor-access.test.ts

# Run with coverage
npm run test:coverage
```

### Test Data
```bash
# Create test vendors and grants
npm run seed:vendor-access

# Clean test data
npm run clean:test-data
```

## 📊 Database Schema

### Key Tables

#### `vendor_profiles`
- Vendor registration and verification information
- Contact details and vendor type classification
- Status tracking (pending, approved, suspended, terminated)

#### `access_grants` 
- Time-limited access permissions
- Category and level specifications
- Approval workflow tracking

#### `vendor_access_tokens`
- JWT token storage and management
- Expiration and revocation tracking
- Security metadata

#### `vendor_sessions`
- Active session monitoring
- Activity tracking and risk scoring
- Session lifecycle management

#### `vendor_audit_logs`
- Comprehensive audit trail
- Security event logging
- Administrative actions

## 🔧 Configuration

### Permission Categories Configuration

```typescript
export const PERMISSION_CATEGORIES = {
  'admin-panel-members': {
    description: 'Full administrative panel access',
    riskLevel: 'HIGH',
    maxDuration: 24 // hours
  },
  'content-moderation': {
    description: 'Content review and moderation',
    riskLevel: 'MEDIUM',
    maxDuration: 72
  },
  'analytics-readonly': {
    description: 'Read-only analytics access',
    riskLevel: 'LOW',
    maxDuration: 168
  }
  // ... more categories
};
```

### Security Restrictions

```typescript
const securityConfig = {
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  maxConcurrentSessions: 3,
  tokenRefreshThreshold: 30 * 60 * 1000, // 30 minutes
  suspiciousActivityThreshold: 10,
  autoRevokeOnSuspicion: true
};
```

## 🚨 Monitoring & Alerts

### Health Checks
```http
GET /api/vendor-access/health
GET /api/vendor-access/status
```

### Security Events
The system tracks and can alert on:
- Multiple failed authentication attempts
- Access to restricted resources
- Session anomalies (unusual IP, location)
- Bulk data access patterns
- Administrative action frequency

### Integration Points
- **FanzDash**: Primary admin interface
- **FanzShield**: Security monitoring integration
- **Logging**: Centralized audit logs
- **Metrics**: Prometheus/Grafana integration

## 🔄 Workflows

### Vendor Onboarding
1. Vendor registers via API or admin interface
2. Background check and verification
3. NDA signature and compliance training
4. Admin approval for vendor status
5. Access grant creation for specific needs

### Access Request Process
1. Admin creates access grant for approved vendor
2. Grant goes through approval workflow (if required)
3. Upon approval, access token can be generated
4. Vendor uses token for authenticated requests
5. Automatic expiration and cleanup

### Emergency Response
1. Security incident detected
2. Admin triggers emergency revocation
3. All active sessions terminated
4. Tokens invalidated immediately
5. Vendor access suspended
6. Incident logged for review

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Automatic cleanup of expired tokens
- Partitioning for large audit tables
- Connection pooling for high concurrency

### Caching Strategy
- Redis caching for token validation
- Session state caching
- Permission lookup optimization
- Rate limiting per vendor

### Scaling Considerations
- Horizontal scaling support
- Database read replicas for analytics
- CDN integration for static content
- Load balancer health checks

## 🛠️ Development

### Code Structure
```
backend/src/
├── services/vendor-access/
│   ├── VendorAccessDelegationService.ts    # Core business logic
│   ├── VendorAccessController.ts           # API endpoints
│   └── VendorAccessMiddleware.ts           # Authentication
├── services/database/
│   └── VendorAccessDatabaseAdapter.ts      # Database operations
├── routes/
│   └── vendor-access.ts                    # Route configuration
└── tests/vendor-access/
    └── vendor-access.test.ts               # Test suite
```

### Development Commands
```bash
# Start development server with vendor access
npm run dev

# Run migrations
npm run migrate

# Seed test data
npm run seed:vendor-access

# Run tests
npm test

# Build for production
npm run build
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
VENDOR_JWT_SECRET=production-secret-key-here
NODE_ENV=production
DB_SSL=true
RATE_LIMIT_MAX=50
CORS_ORIGINS=https://admin.fanz.com,https://dashboard.fanz.com
```

### Security Checklist
- [ ] Strong JWT secret configured
- [ ] Database SSL enabled
- [ ] IP whitelisting configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Audit logging enabled
- [ ] Monitoring alerts configured
- [ ] Emergency contacts defined

### Deployment Steps
1. Run database migrations
2. Update environment variables
3. Deploy application code
4. Verify health checks
5. Test emergency procedures
6. Monitor initial activity

## 📞 Support & Troubleshooting

### Common Issues

#### "Vendor access denied"
- Check token expiration
- Verify permissions match route requirements
- Confirm vendor status is approved
- Check IP restrictions

#### "Database connection failed"
- Verify database credentials
- Check network connectivity
- Confirm SSL configuration
- Review connection pool settings

### Debug Endpoints
```http
# Validate token
POST /api/vendor-access/tokens/validate
{
  "token": "your-token-here"
}

# Check system health
GET /api/vendor-access/health
GET /api/vendor-access/status
```

### Logging
```bash
# View vendor access logs
tail -f logs/vendor-access.log

# Check authentication failures
grep "auth_failed" logs/vendor-access.log

# Monitor emergency actions
grep "emergency_revoke" logs/audit.log
```

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to main

### Code Standards
- TypeScript strict mode
- 100% test coverage for critical paths
- Comprehensive error handling
- Security-first approach
- Performance considerations

---

## 📚 Additional Resources

- [FANZ Security Guidelines](./security-guidelines.md)
- [API Reference](./api-reference.md)
- [Database Schema](./database-schema.md)
- [Deployment Guide](./deployment-guide.md)

**🛡️ Built with security, scalability, and developer experience in mind for the FANZ ecosystem.**
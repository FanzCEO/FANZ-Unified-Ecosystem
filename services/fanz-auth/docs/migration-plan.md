# 🚀 FanzAuth User Migration Plan

> **Unified Identity Migration Strategy for FANZ Ecosystem**  
> Migrating existing users across 9 platform clusters to centralized FanzAuth

## 📊 Migration Overview

### Current State
- **33+ Individual Platforms** with separate authentication systems
- **Fragmented User Data** across multiple databases
- **Inconsistent Session Management** causing poor UX
- **No Cross-Platform SSO** requiring multiple logins

### Target State
- **Unified FanzAuth Service** with OIDC/OAuth2 SSO
- **Single Sign-On** across all 9 platform clusters
- **Centralized User Management** with role-based permissions
- **Seamless Session Federation** for optimal user experience

---

## 🏗️ Migration Architecture

### Phase 1: Foundation Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FanzAuth      │    │   PostgreSQL    │    │     Redis       │
│   Service       │◄──►│   Database      │◄──►│   Session       │
│   (Port 3001)   │    │   (Unified)     │    │   Store         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Clusters                            │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   FanzLab   │   BoyFanz   │  GirlFanz   │ DaddyFanz   │ PupFanz │
│ (Universal) │ (Neon Red)  │(Neon Pink)  │(Neon Gold)  │(Neon Grn)│
├─────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│  TabooFanz  │ TransFanz   │ CougarFanz  │  FanzCock   │   ...   │
│(Dark Blue)  │(Turquoise)  │(Mature Gold)│(XXX Theme)  │         │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

### Phase 2: Data Consolidation
```
Legacy Platforms                    FanzAuth Migration
┌─────────────────┐                ┌─────────────────────┐
│ Platform A      │                │                     │
│ - users: 50K    │──────┐        │  📊 User Analysis   │
│ - creators: 5K  │      │        │  🔄 Data Mapping    │
└─────────────────┘      │        │  🧹 Data Cleanup    │
                         ├────────►│  🔗 Consolidation   │
┌─────────────────┐      │        │  ✅ Validation      │
│ Platform B      │      │        │                     │
│ - users: 30K    │──────┤        └─────────────────────┘
│ - creators: 3K  │      │                  │
└─────────────────┘      │                  ▼
                         │        ┌─────────────────────┐
┌─────────────────┐      │        │                     │
│ Platform C      │      │        │  🎯 Unified Users   │
│ - users: 75K    │──────┘        │  👥 155K users      │
│ - creators: 8K  │               │  🎨 16K creators    │
└─────────────────┘               │  🔐 SSO Ready       │
                                  │                     │
                                  └─────────────────────┘
```

---

## 📋 Migration Steps

### Step 1: Data Analysis & Mapping

#### 1.1 User Data Inventory
```sql
-- Analyze existing user data across platforms
SELECT 
    platform_name,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN is_creator = true THEN 1 END) as creators,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails
FROM legacy_users 
GROUP BY platform_name;
```

#### 1.2 Duplicate Detection
```sql
-- Identify potential duplicate users across platforms
SELECT 
    email,
    COUNT(*) as platforms,
    STRING_AGG(platform_name, ', ') as found_in_platforms
FROM legacy_users 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY platforms DESC;
```

#### 1.3 Data Quality Assessment
- **Email Validation**: Check for valid email formats
- **Username Conflicts**: Resolve duplicate usernames
- **Missing Data**: Identify required fields that need defaults
- **Data Inconsistencies**: Address format differences

### Step 2: Schema Mapping

#### 2.1 User Table Mapping
```typescript
interface LegacyUserMapping {
  // Legacy fields → FanzAuth unified fields
  id: string;                    // → users.id (UUID)
  username: string;              // → users.username
  email: string;                 // → users.email
  password_hash: string;         // → users.password_hash
  display_name?: string;         // → users.display_name
  avatar?: string;               // → users.avatar_url
  bio?: string;                  // → users.bio
  created_at: Date;             // → users.created_at
  platform_specific_data: any;  // → users.metadata (JSONB)
  
  // Platform assignment
  source_platform: string;      // → users.primary_cluster
  
  // Creator data
  is_creator: boolean;          // → users.is_creator
  creator_profile?: any;        // → creators table
}
```

#### 2.2 Platform Cluster Mapping
```typescript
const PLATFORM_MAPPING = {
  // Legacy platform names → New cluster identifiers
  'boyfanz-legacy': 'boyfanz',
  'girlfanz-legacy': 'girlfanz',
  'daddyfanz-legacy': 'daddyfanz',
  'pupfanz-legacy': 'pupfanz',
  'taboofanz-legacy': 'taboofanz',
  'transfanz-legacy': 'transfanz',
  'cougarfanz-legacy': 'cougarfanz',
  'fanzcock-legacy': 'fanzcock',
  'universal-legacy': 'fanzlab',
};
```

### Step 3: Migration Execution

#### 3.1 Database Migration Script
```sql
-- Create migration tracking table
CREATE TABLE migration_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_platform VARCHAR(50) NOT NULL,
    migration_type VARCHAR(50) NOT NULL,
    total_records INTEGER NOT NULL,
    migrated_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    error_log TEXT
);

-- Migration procedure
CREATE OR REPLACE FUNCTION migrate_users_from_platform(
    p_platform VARCHAR(50),
    p_batch_size INTEGER DEFAULT 1000
) RETURNS VOID AS $$
DECLARE
    batch_count INTEGER;
    total_users INTEGER;
    current_batch INTEGER := 0;
BEGIN
    -- Get total count
    EXECUTE format('SELECT COUNT(*) FROM %I_users', p_platform) INTO total_users;
    
    -- Insert migration tracking record
    INSERT INTO migration_progress (source_platform, migration_type, total_records)
    VALUES (p_platform, 'users', total_users);
    
    -- Process in batches
    LOOP
        -- Migrate batch of users
        EXECUTE format('
            INSERT INTO users (id, username, email, password_hash, display_name, 
                              bio, avatar_url, primary_cluster, is_creator, 
                              created_at, metadata)
            SELECT 
                id,
                username,
                email,
                password_hash,
                display_name,
                bio,
                avatar_url,
                %L,
                is_creator,
                created_at,
                jsonb_build_object(''source_platform'', %L, ''legacy_data'', row_to_json(t.*))
            FROM %I_users t
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = t.email)
            LIMIT %L OFFSET %L
            ON CONFLICT (email) DO UPDATE SET
                metadata = users.metadata || EXCLUDED.metadata
        ', PLATFORM_MAPPING[p_platform], p_platform, p_platform, p_batch_size, current_batch * p_batch_size);
        
        GET DIAGNOSTICS batch_count = ROW_COUNT;
        current_batch := current_batch + 1;
        
        -- Update progress
        UPDATE migration_progress 
        SET migrated_records = migrated_records + batch_count
        WHERE source_platform = p_platform AND migration_type = 'users';
        
        -- Exit if no more records
        EXIT WHEN batch_count = 0;
        
        -- Commit batch
        COMMIT;
        
        -- Brief pause between batches
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Mark as completed
    UPDATE migration_progress 
    SET status = 'completed', completed_at = NOW()
    WHERE source_platform = p_platform AND migration_type = 'users';
    
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Creator Data Migration
```sql
-- Migrate creator profiles
CREATE OR REPLACE FUNCTION migrate_creators_from_platform(
    p_platform VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        INSERT INTO creators (id, user_id, creator_name, description, category,
                             subscription_price_monthly, tips_enabled, ppv_enabled,
                             social_links, created_at)
        SELECT 
            gen_random_uuid(),
            u.id,
            c.creator_name,
            c.bio,
            c.category,
            c.monthly_price,
            c.tips_enabled,
            c.ppv_enabled,
            jsonb_build_object(
                ''twitter'', c.twitter_handle,
                ''instagram'', c.instagram_handle,
                ''onlyfans'', c.onlyfans_handle
            ),
            c.created_at
        FROM %I_creators c
        JOIN users u ON u.email = c.email AND u.primary_cluster = %L
        ON CONFLICT (user_id) DO UPDATE SET
            description = EXCLUDED.description,
            social_links = creators.social_links || EXCLUDED.social_links
    ', p_platform, PLATFORM_MAPPING[p_platform]);
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Session Federation Setup

#### 4.1 Cross-Cluster Session Sharing
```typescript
// Session federation configuration
export const SESSION_FEDERATION_CONFIG = {
  // Shared session domain for all clusters
  cookieDomain: '.fanz.app',
  
  // Session storage configuration
  redis: {
    keyPrefix: 'fanz:session:',
    ttl: 24 * 60 * 60, // 24 hours
  },
  
  // OIDC token sharing
  tokenSharing: {
    enabled: true,
    sharedCookieName: 'fanz_sso_token',
    secureCookies: true,
    sameSite: 'lax',
  },
  
  // Cross-cluster navigation
  ssoEndpoints: {
    login: '/api/auth/sso/login',
    logout: '/api/auth/sso/logout',
    check: '/api/auth/sso/check',
  },
};
```

#### 4.2 SSO Implementation
```typescript
// Cross-cluster SSO middleware
export class SSOFederationService {
  async checkCrossClusterSession(req: Request): Promise<SessionInfo | null> {
    // Check for shared SSO token
    const ssoToken = req.cookies[SESSION_FEDERATION_CONFIG.tokenSharing.sharedCookieName];
    
    if (!ssoToken) {
      return null;
    }
    
    try {
      // Verify token with FanzAuth
      const tokenInfo = await this.oidcService.introspectToken(ssoToken);
      
      if (!tokenInfo.active) {
        return null;
      }
      
      // Get user info
      const userInfo = await this.oidcService.getUserInfo(ssoToken);
      
      return {
        userId: userInfo.sub,
        username: userInfo.username,
        cluster: userInfo.cluster,
        role: userInfo.role,
        isCreator: userInfo.is_creator,
        permissions: userInfo.permissions,
      };
    } catch (error) {
      logger.error('SSO token verification failed:', error);
      return null;
    }
  }
  
  async createCrossClusterSession(user: User, targetCluster: string): Promise<string> {
    // Generate OIDC authorization code
    const authCode = await this.oidcService.createAuthorizationCode(
      targetCluster,
      user.id,
      targetCluster,
      ['openid', 'profile', 'email']
    );
    
    // Exchange for tokens
    const tokens = await this.oidcService.exchangeAuthorizationCode(
      authCode,
      targetCluster,
      `https://${targetCluster}.fanz.app/auth/callback`
    );
    
    return tokens.access_token;
  }
}
```

---

## 🔄 Migration Timeline

### Phase 1: Preparation (Week 1-2)
- [x] **FanzAuth Service Development** - Complete OIDC/OAuth2 implementation
- [ ] **Database Schema Finalization** - Unified user/creator tables
- [ ] **Migration Scripts Development** - Data transformation and validation
- [ ] **Testing Environment Setup** - Staging environment with sample data

### Phase 2: Data Migration (Week 3-4)
- [ ] **Legacy Data Analysis** - Complete inventory and quality assessment
- [ ] **Pilot Migration** - Migrate small subset (1,000 users) for testing
- [ ] **Migration Validation** - Verify data integrity and functionality
- [ ] **Full Migration Execution** - Migrate all users in batches

### Phase 3: SSO Integration (Week 5-6)
- [ ] **Platform Integration** - Update all 9 clusters for OIDC
- [ ] **Session Federation** - Implement cross-cluster session sharing
- [ ] **UI/UX Updates** - Unified login experience
- [ ] **Testing & QA** - Comprehensive testing across all platforms

### Phase 4: Go-Live (Week 7-8)
- [ ] **Soft Launch** - Enable for beta users
- [ ] **Monitoring & Support** - Watch for issues and user feedback
- [ ] **Full Rollout** - Enable for all users
- [ ] **Legacy System Decommission** - Shut down old auth systems

---

## 🧪 Testing Strategy

### 4.1 Data Migration Testing
```bash
# Test user data integrity
npm run test:migration:users

# Test creator profile migration
npm run test:migration:creators

# Test duplicate resolution
npm run test:migration:duplicates

# Test platform assignment
npm run test:migration:clusters
```

### 4.2 SSO Testing
```bash
# Test OIDC flow
npm run test:oidc:authorization-code

# Test token validation
npm run test:oidc:token-validation

# Test cross-cluster navigation
npm run test:sso:cross-cluster

# Test session federation
npm run test:sso:federation
```

### 4.3 Performance Testing
```bash
# Load test authentication endpoints
k6 run tests/performance/auth-load-test.js

# Test concurrent migrations
npm run test:migration:performance

# Test SSO latency
npm run test:sso:latency
```

---

## 🚨 Risk Mitigation

### Data Loss Prevention
- **Complete Backups** before migration
- **Rollback Procedures** for each migration step
- **Data Validation** at every checkpoint
- **Parallel Systems** during transition period

### User Experience Continuity
- **Gradual Rollout** to minimize impact
- **Clear Communication** about changes
- **24/7 Support** during migration window
- **Fallback Authentication** if SSO fails

### Security Considerations
- **Token Security** with proper rotation
- **Session Hijacking Prevention** with secure cookies
- **Cross-Site Attack Protection** with CSRF tokens
- **Audit Logging** for all authentication events

---

## 📊 Success Metrics

### Migration Success
- **Data Integrity**: 99.9% successful user migration
- **Zero Data Loss**: All user accounts preserved
- **Performance**: <2s authentication response time
- **Availability**: 99.9% uptime during migration

### User Experience
- **SSO Adoption**: >90% users using cross-cluster SSO
- **Support Tickets**: <1% increase during transition
- **User Satisfaction**: >4.5/5 rating post-migration
- **Session Duration**: Improved by 25%+ due to SSO

---

## 🎯 Post-Migration Optimization

### Ongoing Improvements
1. **Token Refresh Optimization** - Implement seamless token renewal
2. **Biometric Authentication** - Add WebAuthn support for mobile
3. **Adaptive Authentication** - Risk-based authentication decisions
4. **Performance Monitoring** - Real-time authentication metrics

### Advanced Features
1. **Social Login Integration** - Google, Twitter, Discord SSO
2. **Enterprise SSO** - SAML support for business customers
3. **Zero-Trust Security** - Continuous authentication validation
4. **Global Session Management** - Worldwide session consistency

---

**🚀 Ready to unify the FANZ ecosystem with enterprise-grade identity management!**

*This migration plan ensures seamless transition to centralized authentication while maintaining security, performance, and user experience across all platform clusters.*
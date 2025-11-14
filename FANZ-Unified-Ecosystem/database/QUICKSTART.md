# FANZ Database - Quick Start Guide

Get your local development environment running in 5 minutes.

---

## 🚀 Quick Start (Docker)

### 1. Start Database

```bash
cd database
docker-compose up -d
```

This automatically:
- ✅ Starts PostgreSQL 15
- ✅ Creates `fanz_ecosystem` database
- ✅ Installs all 12 schemas
- ✅ Sets up roles and permissions
- ✅ Seeds data (94 platforms, feature flags)
- ✅ Starts PgAdmin (database UI)
- ✅ Starts PgBouncer (connection pooling)
- ✅ Starts Redis (optional caching)

### 2. Verify Installation

```bash
# Check all services are running
docker-compose ps

# Should show:
# fanz_postgres   ... Up (healthy)
# fanz_pgadmin    ... Up
# fanz_pgbouncer  ... Up
# fanz_redis      ... Up
# fanz_adminer    ... Up
```

### 3. Connect to Database

**Option A: Command Line**
```bash
docker-compose exec db psql -U postgres -d fanz_ecosystem
```

**Option B: PgAdmin (Web UI)**
- Open: http://localhost:5050
- Login: `admin@fanzunlimited.com` / `admin`
- Server is pre-configured

**Option C: Adminer (Lightweight UI)**
- Open: http://localhost:8080
- Server: `db`
- Username: `postgres`
- Password: `fanz_dev_password_CHANGE_ME`
- Database: `fanz_ecosystem`

### 4. Test Connection

```sql
-- Check platforms
SELECT COUNT(*) FROM registry.platforms;
-- Should return: 94

-- Check schemas
SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema';
-- Should show: 39 schemas

-- View feature flags
SELECT * FROM features.flags;
```

---

## 📦 Using from Platform Application

### Install Dependencies

```bash
# In your platform directory (e.g., boyfanz/)
npm install pg
npm install --save-dev @types/pg
```

### Copy Database Client

```bash
# Copy the database client library
cp database/lib/database-client.ts <your-platform>/src/lib/
```

### Create .env File

```bash
# In your platform directory
cat > .env << EOF
# Platform context
PLATFORM_ID=boyfanz
TENANT_ID=00000000-0000-0000-0000-000000000001

# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fanz_ecosystem
DB_USER=svc_platform_api
DB_PASSWORD=CHANGE_ME_PLATFORM_API

# Connection pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=10000

# SSL (disabled for local dev)
DB_SSL_ENABLED=false

# Logging
DB_LOG_SLOW_QUERIES=true
DB_SLOW_QUERY_THRESHOLD=1000
EOF
```

### Initialize Database Client

```typescript
// src/db.ts
import { createDatabaseClient, FanzDatabaseHelpers } from './lib/database-client';

export const db = createDatabaseClient({
  platformId: process.env.PLATFORM_ID!,
  tenantId: process.env.TENANT_ID!
});

export const dbHelpers = new FanzDatabaseHelpers(db);

// Health check
export async function checkDatabaseHealth() {
  const isHealthy = await db.healthCheck();
  if (!isHealthy) {
    throw new Error('Database health check failed');
  }
}
```

### Example Usage

```typescript
// Get user by email
import { db } from './db';

async function getUserByEmail(email: string) {
  return await db.queryOne(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
}

// Create subscription
import { dbHelpers } from './db';

async function createSubscription(data: any) {
  return await dbHelpers.insert('fans.subscriptions', {
    ...data,
    platform_id: process.env.PLATFORM_ID,
    tenant_id: process.env.TENANT_ID
  });
}
```

See `database/examples/platform-integration-example.ts` for complete examples.

---

## 🛠️ Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Just database
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 db
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart just database
docker-compose restart db
```

### Run SQL Script

```bash
# From host
docker-compose exec db psql -U postgres -d fanz_ecosystem -f /path/to/script.sql

# Or copy file first
docker cp my-script.sql fanz_postgres:/tmp/
docker-compose exec db psql -U postgres -d fanz_ecosystem -f /tmp/my-script.sql
```

### Backup Database

```bash
# Create backup
docker-compose exec db pg_dump -U postgres -Fc fanz_ecosystem > fanz_backup_$(date +%Y%m%d).dump

# Restore backup
docker-compose exec -T db pg_restore -U postgres -d fanz_ecosystem < fanz_backup_20250106.dump
```

### Reset Database

```bash
# WARNING: This deletes all data!
docker-compose down -v  # -v removes volumes
docker-compose up -d    # Fresh start with seed data
```

### Connection URLs

```bash
# Direct PostgreSQL
postgresql://postgres:fanz_dev_password_CHANGE_ME@localhost:5432/fanz_ecosystem

# Via PgBouncer (recommended for applications)
postgresql://postgres:fanz_dev_password_CHANGE_ME@localhost:6432/fanz_ecosystem

# Redis
redis://localhost:6379
```

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5432
lsof -i :5432

# Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

### Out of Memory

```bash
# Reduce PostgreSQL memory in docker/postgresql.conf
shared_buffers = 256MB  # Reduce from 512MB
effective_cache_size = 768MB  # Reduce from 1536MB
```

### Slow Queries

```bash
# View slow queries
docker-compose exec db psql -U postgres -d fanz_ecosystem -c "
  SELECT query, mean_time, calls
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

### Connection Pool Exhausted

```bash
# Check active connections
docker-compose exec db psql -U postgres -d fanz_ecosystem -c "
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;
"

# Increase pool size in docker-compose.yml (pgbouncer section)
DEFAULT_POOL_SIZE: 50  # Increase from 25
```

---

## 📚 Next Steps

1. **Read Full Documentation**: See `database/README.md`
2. **Explore Examples**: See `database/examples/platform-integration-example.ts`
3. **Check Schema Files**: See `database/schemas/*.sql`
4. **Review Connection Config**: See `database/connection_config_example.env`

---

## 🎯 Testing Your Setup

Run this test script to verify everything works:

```typescript
// test-db.ts
import { createDatabaseClient } from './lib/database-client';

async function test() {
  const db = createDatabaseClient({
    platformId: 'boyfanz',
    tenantId: '00000000-0000-0000-0000-000000000001'
  });

  try {
    // Test 1: Health check
    console.log('Test 1: Health check...');
    const healthy = await db.healthCheck();
    console.log('✓ Database is healthy:', healthy);

    // Test 2: Query platforms
    console.log('\nTest 2: Query platforms...');
    const platforms = await db.queryMany('SELECT * FROM registry.platforms LIMIT 5');
    console.log('✓ Found', platforms.length, 'platforms');

    // Test 3: Query feature flags
    console.log('\nTest 3: Query feature flags...');
    const flags = await db.queryMany('SELECT * FROM features.flags LIMIT 5');
    console.log('✓ Found', flags.length, 'feature flags');

    // Test 4: Check pool stats
    console.log('\nTest 4: Pool statistics...');
    const stats = db.getPoolStats();
    console.log('✓ Pool stats:', stats);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

test();
```

Run it:
```bash
npx ts-node test-db.ts
```

---

## 🆘 Getting Help

- **Database Issues**: Check PostgreSQL logs with `docker-compose logs db`
- **Connection Issues**: Verify ports with `docker-compose ps`
- **Query Issues**: Check `pg_stat_statements` for slow queries
- **Schema Issues**: Re-run initialization with `docker-compose down -v && docker-compose up -d`

---

**Ready to build! 🚀**

Your FANZ database infrastructure is now running locally and ready for development.

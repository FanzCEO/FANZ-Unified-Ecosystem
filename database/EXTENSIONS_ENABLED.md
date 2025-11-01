# 🔌 FANZ Unified Ecosystem - PostgreSQL Extensions

> **Comprehensive list of all enabled extensions**

---

## ✅ Currently Enabled Extensions (19)

### 🔐 **Security & Encryption**

1. **pgcrypto** (v1.3) - `extensions` schema
   - Cryptographic functions
   - Used for: Password hashing, data encryption

2. **supabase_vault** (v0.3.1) - `vault` schema
   - Secure key storage
   - Used for: Sensitive data encryption (TINs, bank details)

### 🆔 **Identifiers & Data Types**

3. **uuid-ossp** (v1.1) - `extensions` schema
   - UUID generation
   - Used for: Primary keys across all 157 tables

4. **citext** (v1.6) - `extensions` schema
   - Case-insensitive text
   - Used for: Email addresses, usernames

5. **ltree** (v1.3) - `extensions` schema
   - Hierarchical tree structures
   - Used for: Content categories, account hierarchies

6. **hstore** (v1.8) - `extensions` schema
   - Key-value pairs
   - Used for: Metadata storage

7. **intarray** (v1.5) - `extensions` schema
   - Integer array operations
   - Used for: Array queries and operations

### 🔍 **Search & Text Processing**

8. **pg_trgm** (v1.6) - `public` schema ⚠️
   - Text similarity and trigram search
   - Used for: Full-text search, fuzzy matching
   - **Note:** Should be moved to `extensions` schema

9. **fuzzystrmatch** (v1.2) - `extensions` schema
   - Fuzzy string matching
   - Used for: Name matching, duplicate detection

10. **unaccent** (v1.1) - `extensions` schema
    - Remove accents from text
    - Used for: International name search

### 🗂️ **Indexing**

11. **btree_gin** (v1.3) - `public` schema ⚠️
    - GIN indexes for common datatypes
    - Used for: JSONB and array indexing
    - **Note:** Should be moved to `extensions` schema

12. **hypopg** (v1.4.1) - `extensions` schema
    - Hypothetical indexes
    - Used for: Query optimization testing

13. **index_advisor** (v0.2.0) - `extensions` schema
    - Query index recommendations
    - Used for: Performance optimization

### 🌍 **Geolocation**

14. **postgis** (v3.3.7) - `extensions` schema
    - Geographic objects and functions
    - Used for: Tax jurisdiction geocoding, user location

### 🤖 **AI & Machine Learning**

15. **vector** (v0.8.0) - `extensions` schema
    - Vector embeddings for AI
    - Used for: Content recommendations, similarity search

### 🔗 **API & Integration**

16. **http** (v1.6) - `extensions` schema
    - HTTP client
    - Used for: Webhook deliveries, external API calls

17. **pg_jsonschema** (v0.3.3) - `extensions` schema
    - JSON schema validation
    - Used for: API payload validation

### 📊 **Monitoring & Performance**

18. **pg_stat_statements** (v1.11) - `extensions` schema
    - Query performance tracking
    - Used for: Performance monitoring, slow query detection

### 🔧 **Development & GraphQL**

19. **pg_graphql** (v1.5.11) - `graphql` schema
    - GraphQL support
    - Used for: GraphQL API queries

---

## 🚀 Recommended Extensions to Enable

### High Priority

1. **pg_net** (v0.19.5) - Async HTTP
   - **Use case:** Async webhook deliveries, background API calls
   - **Why needed:** Better performance for webhook system
   ```sql
   CREATE EXTENSION pg_net WITH SCHEMA extensions;
   ```

2. **pg_cron** (v1.6.4) - Job Scheduler
   - **Use case:** Subscription renewals, tax calculations, cleanup jobs
   - **Why needed:** Automated recurring tasks
   ```sql
   CREATE EXTENSION pg_cron WITH SCHEMA extensions;
   ```

3. **pgmq** (v1.5.1) - Message Queue
   - **Use case:** Background job processing, email queue
   - **Why needed:** Reliable async task processing
   ```sql
   CREATE SCHEMA pgmq;
   CREATE EXTENSION pgmq WITH SCHEMA pgmq;
   ```

### Medium Priority

4. **pgtap** (v1.2.0) - Unit Testing
   - **Use case:** Database unit tests
   - **Why needed:** Test RLS policies, triggers, functions

5. **plpgsql_check** (v2.7) - PL/pgSQL Validation
   - **Use case:** Validate functions and triggers
   - **Why needed:** Catch errors in 122 database functions

6. **pg_repack** (v1.5.2) - Table Reorganization
   - **Use case:** Online table maintenance
   - **Why needed:** Reduce bloat without downtime

### Low Priority (Optional)

7. **pgroonga** (v3.2.5) - Full-Text Search
   - **Use case:** Multi-language full-text search
   - **Alternative:** pg_trgm is already enabled

8. **earthdistance** (v1.2) - Distance Calculations
   - **Use case:** Creator/user proximity
   - **Note:** PostGIS already provides this

9. **dblink** (v1.2) - Cross-Database Queries
   - **Use case:** Query multiple databases
   - **Caution:** Use sparingly for security

---

## ⚠️ Extensions to Avoid

- **pgjwt** - Deprecated (use application-level JWT instead)
- **refint** - Obsolete (use native foreign keys)
- **autoinc** - Obsolete (use SERIAL or sequences)
- **intagg** - Obsolete (use modern aggregates)

---

## 🔧 Installation Commands

### Enable Recommended Extensions

```sql
-- Create necessary schemas
CREATE SCHEMA IF NOT EXISTS pgmq;

-- Enable critical extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgmq WITH SCHEMA pgmq;

-- Enable testing extensions
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS plpgsql_check WITH SCHEMA extensions;

-- Enable maintenance extensions
CREATE EXTENSION IF NOT EXISTS pg_repack WITH SCHEMA extensions;
```

### Move Extensions from Public Schema

```sql
-- Move pg_trgm from public to extensions schema
-- Note: This requires recreating indexes that use pg_trgm
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Move btree_gin from public to extensions schema
ALTER EXTENSION btree_gin SET SCHEMA extensions;
```

---

## 📊 Extension Usage by Feature

### Tax Compliance
- **postgis** - Geocoding tax jurisdictions
- **pg_trgm** - Fuzzy address matching
- **pg_cron** - Monthly tax calculations

### Content Management
- **vector** - Content recommendations
- **pg_trgm** - Search functionality
- **http** - CDN callbacks

### Financial System
- **pgcrypto** - Encrypt bank details
- **supabase_vault** - Store encryption keys
- **pg_cron** - Daily balance calculations

### E-commerce
- **postgis** - Shipping distance calculations
- **pg_jsonschema** - Validate order payloads

### NFT & Blockchain
- **http** - Blockchain API calls
- **pg_jsonschema** - Validate metadata

### API & Webhooks
- **http** - Webhook deliveries
- **pg_net** - Async webhook calls
- **pg_jsonschema** - Payload validation

### Communication
- **pgmq** - Message queue for emails
- **pg_net** - Push notification delivery

---

## 🎯 Current Extension Status

| Extension | Status | Schema | Priority | Action Needed |
|-----------|--------|--------|----------|---------------|
| uuid-ossp | ✅ Enabled | extensions | Critical | None |
| pgcrypto | ✅ Enabled | extensions | Critical | None |
| pg_trgm | ✅ Enabled | public | Critical | Move to extensions schema |
| btree_gin | ✅ Enabled | public | Critical | Move to extensions schema |
| vector | ✅ Enabled | extensions | High | None |
| http | ✅ Enabled | extensions | High | None |
| postgis | ✅ Enabled | extensions | High | None |
| citext | ✅ Enabled | extensions | High | None |
| ltree | ✅ Enabled | extensions | Medium | None |
| hstore | ✅ Enabled | extensions | Medium | None |
| unaccent | ✅ Enabled | extensions | Medium | None |
| fuzzystrmatch | ✅ Enabled | extensions | Medium | None |
| intarray | ✅ Enabled | extensions | Medium | None |
| pg_jsonschema | ✅ Enabled | extensions | Medium | None |
| hypopg | ✅ Enabled | extensions | Low | None |
| index_advisor | ✅ Enabled | extensions | Low | None |
| pg_stat_statements | ✅ Enabled | extensions | Low | None |
| pg_graphql | ✅ Enabled | graphql | Low | None |
| supabase_vault | ✅ Enabled | vault | High | None |
| pg_net | ⏸️ Not enabled | - | High | Enable for async webhooks |
| pg_cron | ⏸️ Not enabled | - | High | Enable for scheduled jobs |
| pgmq | ⏸️ Not enabled | - | Medium | Enable for message queue |
| pgtap | ⏸️ Not enabled | - | Low | Enable for testing |
| plpgsql_check | ⏸️ Not enabled | - | Low | Enable for function validation |

---

## 🎉 Summary

✅ **19 Extensions Currently Enabled**  
📍 **2 Extensions Need Schema Migration** (pg_trgm, btree_gin)  
🔜 **5 Recommended Extensions to Enable** (pg_net, pg_cron, pgmq, pgtap, plpgsql_check)  

Your FANZ database has all critical extensions enabled and ready for production use!

---

**Last Updated:** November 1, 2025  
**Database:** mcayxybcgxhfttvwmhgm  
**Status:** ✅ Production Ready


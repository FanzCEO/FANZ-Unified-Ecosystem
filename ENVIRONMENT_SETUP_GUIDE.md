# 🔐 FANZ Unified Ecosystem - Environment Configuration Guide

> **Complete guide for setting up environment variables across all services**

---

## 📋 Quick Start

1. **Never commit `.env` files to version control!**
2. Copy the templates below to create your `.env` files
3. Replace all placeholder values with your actual credentials
4. Use different credentials for development, staging, and production

---

## 🏗️ Core Environment Variables

### Create: `.env` (Root Level)

```bash
# ============================================
# 🌍 ENVIRONMENT
# ============================================
NODE_ENV=development
PORT=3000
METRICS_PORT=3001
LOG_LEVEL=info

# ============================================
# 💾 DATABASE - SUPABASE
# ============================================
DATABASE_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Supabase Project Configuration
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXl4eWJjZ3hoZnR0dndtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc3MjEsImV4cCI6MjA3NzYwMzcyMX0.EBFJ8_9Z_jPrjntg9JBFFbuGuJaN1zKxoXlGk4Jln-s
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY-FROM-SUPABASE-DASHBOARD]

# ============================================
# 📦 REDIS CACHE
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TTL=3600

# ============================================
# 🔑 JWT & AUTHENTICATION
# ============================================
# Generate strong secrets: openssl rand -base64 64
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-minimum-32-characters-long
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long
ENCRYPTION_KEY=your-32-character-encryption-key

# ============================================
# 🌐 CORS
# ============================================
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ============================================
# 💳 PAYMENT PROCESSORS
# ============================================

# CCBill (Primary Adult Payment Processor)
CCBILL_ACCOUNT_NUMBER=
CCBILL_SUB_ACCOUNT_NUMBER=
CCBILL_FLEX_FORM_ID=
CCBILL_SALT_KEY=
CCBILL_API_KEY=
CCBILL_WEBHOOK_SECRET=

# Segpay
SEGPAY_MERCHANT_ID=
SEGPAY_API_KEY=
SEGPAY_WEBHOOK_SECRET=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ============================================
# ☁️ CLOUD STORAGE
# ============================================
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-west-2
S3_BUCKET_NAME=fanz-media-storage

# Supabase Storage
SUPABASE_STORAGE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co/storage/v1

# ============================================
# 🤖 AI SERVICES
# ============================================
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MODERATECONTENT_API_KEY=

# ============================================
# 📧 COMMUNICATIONS
# ============================================
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@fanzlab.com

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ============================================
# 🔒 SECURITY
# ============================================
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=10

RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# ============================================
# 📊 MONITORING
# ============================================
SENTRY_DSN=
DATADOG_API_KEY=

# ============================================
# 🎯 FEATURE FLAGS
# ============================================
ENABLE_PLAYGROUND=false
ENABLE_WEBSOCKETS=true
ENABLE_BLOCKCHAIN=true
ENABLE_AI_FEATURES=true
ENABLE_NFT_MARKETPLACE=true

# ============================================
# 🌐 BLOCKCHAIN
# ============================================
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/[YOUR-PROJECT-ID]
BLOCKCHAIN_NETWORK=ethereum
PRIVATE_KEY=
ETHERSCAN_API_KEY=

# ============================================
# 💼 TAX COMPLIANCE
# ============================================
TAXJAR_API_KEY=
IRS_FILING_ENABLED=false

# ============================================
# 📁 FILE UPLOAD
# ============================================
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/webm,audio/mpeg

# ============================================
# 🔐 OAUTH PROVIDERS
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

---

## 🔧 Backend Service Environment

### Create: `backend/.env`

```bash
NODE_ENV=development
PORT=3000

# Database (Same as root)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Supabase
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXl4eWJjZ3hoZnR0dndtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc3MjEsImV4cCI6MjA3NzYwMzcyMX0.EBFJ8_9Z_jPrjntg9JBFFbuGuJaN1zKxoXlGk4Jln-s
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-min-32-chars
ENCRYPTION_KEY=your-32-char-encryption-key

# CORS
CORS_ORIGIN=http://localhost:3000

# Copy other vars from root .env as needed
```

---

## 🐳 Docker Environment Variables

### For `docker-compose.yml`

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password_here

# Redis
REDIS_PASSWORD=your_secure_redis_password_here

# RabbitMQ
RABBITMQ_PASSWORD=your_secure_rabbitmq_password_here
```

---

## 🔑 How to Generate Secure Secrets

### JWT Secrets (minimum 32 characters)

```bash
# Generate a random JWT secret
openssl rand -base64 64

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Session Secrets

```bash
openssl rand -hex 32
```

### Encryption Keys (exactly 32 characters)

```bash
openssl rand -hex 16
```

---

## 📊 Supabase Configuration

### Where to Find Your Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm
2. **Project Settings** → **Database**
   - Connection String: `DATABASE_URL`
   - Password: Already set during database setup

3. **Project Settings** → **API**
   - Project URL: `SUPABASE_URL`
   - Anon/Public Key: `SUPABASE_ANON_KEY` (already provided above)
   - Service Role Key: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Direct Database Connection

```bash
# Connection String Format
postgresql://postgres:[YOUR-PASSWORD]@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres

# Replace [YOUR-PASSWORD] with your actual Supabase database password
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use different credentials for each environment (dev/staging/prod)
- Rotate secrets every 90 days
- Use a secrets manager in production (AWS Secrets Manager, Vault, HashiCorp Vault)
- Keep `.env` files in `.gitignore`
- Use strong, randomly generated secrets (minimum 32 characters)
- Validate all environment variables on application startup

### ❌ DON'T:
- Never commit `.env` files to version control
- Never share secrets in Slack, email, or chat
- Never use the same password across environments
- Never hardcode secrets in source code
- Never use weak or predictable secrets

---

## 🎯 Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_PLAYGROUND=true
RATE_LIMIT_MAX_REQUESTS=10000
```

### Staging
```bash
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_PLAYGROUND=true
RATE_LIMIT_MAX_REQUESTS=5000
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_PLAYGROUND=false
RATE_LIMIT_MAX_REQUESTS=1000
# ALL PAYMENT PROCESSORS MUST BE CONFIGURED
# SENTRY_DSN MUST BE SET
# AWS_* MUST BE CONFIGURED
```

---

## 🚀 Quick Setup Script

```bash
#!/bin/bash
# setup-env.sh - Quick environment setup

echo "🔐 FANZ Environment Setup"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
REFRESH_TOKEN_SECRET=$(openssl rand -base64 64 | tr -d '\n')
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXl4eWJjZ3hoZnR0dndtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc3MjEsImV4cCI6MjA3NzYwMzcyMX0.EBFJ8_9Z_jPrjntg9JBFFbuGuJaN1zKxoXlGk4Jln-s
SUPABASE_SERVICE_ROLE_KEY=[GET-FROM-SUPABASE-DASHBOARD]

JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000

ENABLE_PLAYGROUND=false
ENABLE_WEBSOCKETS=true
ENABLE_BLOCKCHAIN=true
ENABLE_AI_FEATURES=true
EOF

echo "✅ .env file created!"
echo "⚠️  Please update the following values:"
echo "   - DATABASE_URL (add your Supabase password)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)"
echo "   - Add any additional API keys as needed"
```

---

## 📝 Validation Checklist

Before deploying, ensure:

- [ ] All required environment variables are set
- [ ] Secrets are strong and unique (min 32 chars)
- [ ] Database connection string is correct
- [ ] Supabase URL and keys are from the correct project (`mcayxybcgxhfttvwmhgm`)
- [ ] CORS origins match your frontend domains
- [ ] Payment processor credentials are configured (for production)
- [ ] Email/SMS providers are configured
- [ ] Monitoring (Sentry) is configured (for production)
- [ ] Feature flags are set appropriately for the environment
- [ ] `.env` files are NOT committed to git

---

## 🆘 Troubleshooting

### "Missing required environment variable" Error
- Check that your `.env` file exists in the correct directory
- Ensure the variable name matches exactly (case-sensitive)
- Restart your application after changing `.env`

### Database Connection Fails
- Verify `DATABASE_URL` format is correct
- Check that your Supabase project is active
- Ensure database password is correct
- Test connection with: `psql [DATABASE_URL]`

### JWT Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Check that secrets don't contain special characters that need escaping
- Verify expiration times are valid (e.g., '15m', '7d')

---

## 📚 Additional Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/mcayxybcgxhfttvwmhgm)
- [Database Documentation](./DATABASE_COMPLETE.md)
- [Security Best Practices](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Last Updated:** November 1, 2025  
**Project:** FANZ Unified Ecosystem  
**Database:** mcayxybcgxhfttvwmhgm


# 🚀 FANZ Ecosystem - Developer Quick Start Guide

## ⚡ 5-Minute Setup

Get the entire FANZ ecosystem running in under 5 minutes!

### **Prerequisites Check**
```bash
# Check Node.js (18+)
node --version

# Check PostgreSQL
psql --version

# Check Redis (optional - will use Docker if missing)
redis-cli --version

# Check Docker (optional)
docker --version
```

### **Lightning Setup**
```bash
# 1. Clone and enter
git clone https://github.com/joshuastone/FANZ-Unified-Ecosystem.git
cd FANZ_UNIFIED_ECOSYSTEM

# 2. One-command setup (MacOS)
chmod +x backend/scripts/quick-setup.sh
./backend/scripts/quick-setup.sh

# 3. Start the ecosystem
npm run dev:all
```

### **Verify Installation**
```bash
# Check all services
curl http://localhost:3000/api/health

# Test payment processors
curl -H "Authorization: Bearer demo-token" \
  http://localhost:3000/api/payments/processors

# Run the payment demo
cd backend && ./scripts/demo-payment-processing.sh
```

---

## 🎯 **What You Get Instantly**

### **✅ 13 Unified Platforms**
- **FanzLab**: Universal portal at `http://localhost:3000`
- **BoyFanz**: Male creators at `http://localhost:3001`
- **GirlFanz**: Female creators at `http://localhost:3002`
- **Payment System**: Adult-friendly processing with CCBill, Paxum, Segpay

### **✅ Development Tools**
- **API Documentation**: `http://localhost:3000/api/docs`
- **Database Admin**: PostgreSQL with full schema
- **Monitoring Dashboard**: `http://localhost:3000/api/payments/monitoring/dashboard`
- **Health Checks**: Real-time service status

### **✅ Adult-Friendly Payment Processing**
- **CCBill**: Primary US/Global processor
- **Paxum**: Creator payouts (industry standard)
- **Segpay**: European specialist
- **Compliance Engine**: 2257, age verification, risk assessment

---

## 🔥 **Development Hotspots**

### **💰 Payment Processing** (Most Active)
```bash
cd backend/src/services/payment/
# Key files:
# - processors/CCBillProcessor.ts
# - processors/PaxumPayoutProcessor.ts  
# - processors/SegpayProcessor.ts
# - GeographicRoutingService.ts
# - ComplianceValidationMiddleware.ts
```

### **🤖 AI & Intelligence**
```bash
cd ai-content-intelligence/
# Features:
# - Content moderation
# - Creator assistance
# - Automated tagging
```

### **🎬 Media Processing**
```bash
cd backend/src/services/media/
# Features:
# - Video transcoding
# - Image optimization
# - CDN integration
```

### **🛡️ Security & Compliance**
```bash
cd backend/src/middleware/compliance/
# Features:
# - Age verification
# - 2257 compliance
# - Risk assessment
# - Fraud detection
```

---

## 🧪 **Testing Commands**

```bash
# Run all tests
npm test

# Test payment processors
npm test -- tests/services/payment/processors/

# Test compliance validation
npm test -- --testNamePattern="Compliance"

# Run integration tests
npm run test:integration

# Performance tests
npm run test:performance
```

---

## 🔧 **Essential Environment Variables**

```bash
# Copy to .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fanz_unified
JWT_SECRET=your-super-secure-key-here

# Adult Payment Processors
CCBILL_CLIENT_ACCNUM=your-ccbill-account
CCBILL_FLEX_ID=your-flex-form-id
PAXUM_API_KEY=your-paxum-key
SEGPAY_PACKAGE_ID=your-segpay-package

# AI Services  
OPENAI_API_KEY=your-openai-key

# Media Storage
AWS_ACCESS_KEY_ID=your-aws-key
S3_BUCKET_NAME=fanz-media
```

---

## 📊 **Monitoring & Health**

```bash
# Service health
curl http://localhost:3000/api/health

# Payment processor status
curl http://localhost:3000/api/payments/processors

# Database performance
psql -d fanz_unified -c "SELECT datname, numbackends, xact_commit, xact_rollback FROM pg_stat_database WHERE datname = 'fanz_unified';"

# Memory usage
ps aux | grep node | awk '{sum += $6} END {print "Total Memory: " sum/1024 " MB"}'
```

---

## 🚨 **Common Issues & Quick Fixes**

### **Port Already in Use**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### **Database Connection Failed**
```bash
# Start PostgreSQL
brew services start postgresql

# Create database
createdb fanz_unified

# Run migrations
cd backend && npm run migrate
```

### **Payment Processor Errors**
```bash
# Check processor configuration
cd backend
node -e "console.log('CCBill:', process.env.CCBILL_CLIENT_ACCNUM ? 'Configured' : 'Missing')"

# Test connectivity
npm run test:processors
```

---

## 🎨 **Platform Themes**

Each platform has its own neon color identity:

```scss
$boyfanz: #FF0040;     /* Neon Red */
$girlfanz: #FF0080;    /* Neon Pink */
$daddyfanz: #FFD700;   /* Gold */
$pupfanz: #00FF40;     /* Green */
$taboofanz: #0040FF;   /* Blue */
$transfanz: #00FFFF;   /* Turquoise */
$cougarfanz: #FFAA00;  /* Mature Gold */
$fanzcock: #FF0000;    /* XXX Red */
```

---

## 🚀 **Next Steps**

1. **Explore the Payment Demo**: `./backend/scripts/demo-payment-processing.sh`
2. **Check the Integration Guide**: `backend/docs/payment-processors-guide.md`
3. **Review Platform Architecture**: `WARP.md`
4. **Start Building**: Pick a platform and start developing!

---

## 📞 **Need Help?**

- **Documentation**: Check `/docs/` for detailed guides
- **API Reference**: `http://localhost:3000/api/docs`
- **Payment Guide**: `backend/docs/payment-processors-guide.md`
- **Architecture**: `WARP.md`

**🎉 You're ready to build the future of creator platforms!**
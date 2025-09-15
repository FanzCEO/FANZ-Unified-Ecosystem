# 🧪 Frontend Security Hardening - Staging Smoke Test Plan

## 🎯 **Test Objective**
Validate that the security-hardened frontend functions correctly in staging with:
- Zero Web3 wallet UI exposure
- React-mentions functionality preserved
- Core payment and compliance flows unaffected
- Clean error monitoring

---

## ✅ **Pre-Deployment Security Validation**

### **1. Dependency Security Scan**
```bash
cd frontend
npm audit --production
# ✅ Expected Result: "found 0 vulnerabilities"
```

### **2. Feature Flag Configuration**
```bash
# Verify WEB3_ENABLED defaults to false
grep -r "WEB3_ENABLED" src/config/flags.ts
# ✅ Expected Result: Flag defaults to false/disabled
```

### **3. Security Components Presence**
```bash
# Verify shim components exist
ls -la src/providers/Web3ProviderShim.tsx
ls -la REDACTED_AWS_SECRET_KEY
# ✅ Expected Result: Files present and accessible
```

---

## 🚀 **Staging Deployment Steps**

### **Option A: Docker Staging Deployment**
```bash
# Build staging image with security flags
docker-compose -f docker-compose.yml -f docker-compose.staging.yml build frontend
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d frontend

# Verify container health
docker-compose ps frontend
curl -f http://staging-frontend:3000/health || echo "Health check needed"
```

### **Option B: Direct Staging Build**
```bash
# Set staging environment variables
export NODE_ENV=staging
export REACT_APP_FEATURE_WEB3=false
export REACT_APP_API_URL=https://staging-api.fanz.network

# Build for staging
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

---

## 🧪 **Smoke Test Suite**

### **Test 1: Web3 Wallet UI Disabled**
**Objective:** Confirm no wallet connection UI is presented to users

**Steps:**
1. Navigate to staging frontend: `https://staging.fanz.network`
2. Check header/navigation areas for wallet connect buttons
3. Check user profile areas for wallet integration
4. Open browser dev tools and check console for Web3 warnings

**Expected Results:**
- ❌ No "Connect Wallet" buttons visible
- ❌ No MetaMask/wallet connector prompts
- ❌ No blockchain addresses displayed
- ✅ Console shows: "Web3 features are disabled for security"

### **Test 2: Mention Functionality Preserved**
**Objective:** Validate react-mentions @mention features work correctly

**Steps:**
1. Navigate to post creation or comment areas
2. Type `@` in text inputs
3. Verify mention suggestions appear
4. Select a user mention
5. Submit post/comment with mention

**Expected Results:**
- ✅ `@` trigger shows user suggestions
- ✅ Mention selection works properly
- ✅ Mentions are highlighted in final content
- ✅ No console errors related to mentions

### **Test 3: Payment Flows Unaffected**
**Objective:** Ensure CCBill/Paxum/Segpay payment processing works

**Steps:**
1. Navigate to subscription/purchase flows
2. Attempt to subscribe to a creator
3. Verify payment processor selection (CCBill/Paxum/Segpay)
4. Complete test payment flow (staging mode)

**Expected Results:**
- ✅ Payment processor options display correctly
- ✅ CCBill/Paxum/Segpay integrations functional
- ✅ No Web3/blockchain payment options shown
- ✅ Transaction processing completes successfully

### **Test 4: Core User Flows**
**Objective:** Validate primary platform functionality

**Steps:**
1. User registration/login
2. Profile management
3. Content browsing
4. Creator interaction
5. Dashboard navigation

**Expected Results:**
- ✅ Authentication flows work correctly
- ✅ Content loads and displays properly
- ✅ Navigation between platforms functions
- ✅ No missing UI elements from Web3 removal

### **Test 5: Error Monitoring**
**Objective:** Confirm clean error logs in monitoring systems

**Steps:**
1. Check Sentry/error tracking for staging
2. Review browser console for JavaScript errors
3. Monitor network requests for failed calls
4. Check for any Web3-related error traces

**Expected Results:**
- ✅ No 404s for removed Web3 dependencies
- ✅ No JavaScript errors from missing wallet libraries
- ✅ Clean Sentry error dashboard
- ❌ No MetaMask SDK or wagmi-related errors

---

## 📊 **Success Criteria**

### **Security Criteria**
- [ ] Zero Web3 wallet UI components visible to users
- [ ] No wallet connection prompts or blockchain features
- [ ] Console shows appropriate "Web3 disabled" messaging
- [ ] Zero vulnerabilities in production dependency audit

### **Functionality Criteria**
- [ ] React-mentions functionality works across all input areas
- [ ] Adult-friendly payment processors (CCBill/Paxum/Segpay) functional
- [ ] All core user journeys complete successfully
- [ ] No regressions in creator monetization flows

### **Performance Criteria**
- [ ] Frontend load time improved (smaller bundle without Web3 deps)
- [ ] No additional network requests to wallet/blockchain services
- [ ] Memory usage stable without Web3 libraries

### **Monitoring Criteria**
- [ ] Clean error logs in Sentry and monitoring dashboards
- [ ] No 404/500 errors from removed Web3 dependencies
- [ ] Application performance metrics within normal ranges

---

## 🚨 **Rollback Plan**

If any smoke tests fail:

### **Immediate Rollback Steps**
1. Stop staging deployment:
   ```bash
   docker-compose down frontend
   ```
2. Deploy previous known-good version:
   ```bash
   git checkout main
   docker-compose up -d frontend
   ```
3. Notify stakeholders of rollback via FanzDash

### **Investigation Steps**
1. Capture error logs and screenshots
2. Document specific test failures
3. Create hotfix branch if needed
4. Update PR with fixes before re-deployment

---

## 📈 **Post-Staging Validation**

### **Performance Monitoring (24 Hours)**
- Monitor user engagement metrics
- Track payment conversion rates
- Observe error rates and user support tickets
- Validate search and discovery functions

### **Security Monitoring**
- Verify zero security scan alerts
- Confirm no unauthorized wallet connection attempts
- Monitor for any Web3-related vulnerability reports

---

## ✅ **Sign-off Requirements**

Before production deployment approval:

- [ ] **Security Lead:** Zero vulnerabilities confirmed
- [ ] **Frontend Lead:** All UI/UX functions verified
- [ ] **Payment Team:** CCBill/Paxum/Segpay flows tested
- [ ] **Operations:** Error monitoring clean
- [ ] **Compliance:** Adult content flows unaffected

---

## 📝 **Test Execution Log**

| Test | Status | Notes | Executed By | Date |
|------|--------|-------|-------------|------|
| Web3 UI Disabled | ⏳ Pending | | | |
| Mentions Functionality | ⏳ Pending | | | |
| Payment Flows | ⏳ Pending | | | |
| Core User Flows | ⏳ Pending | | | |
| Error Monitoring | ⏳ Pending | | | |

**Next Action:** Execute smoke tests in staging environment and update status table.
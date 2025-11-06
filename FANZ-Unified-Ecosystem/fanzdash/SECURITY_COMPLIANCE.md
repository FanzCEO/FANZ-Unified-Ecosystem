# Security & Compliance - CSAM Legal Hold

## CRITICAL SECURITY REQUIREMENTS

### Super Admin Access Control

**CSAM evidence and legal hold endpoints MUST use `requireSuperAdmin` middleware.**

#### Protected Endpoints:
```typescript
// Example usage in routes:
import { requireSuperAdmin } from './middleware/auth';

// CSAM Legal Hold - SUPER ADMIN ONLY
router.get('/api/legal/csam-holds', isAuthenticated, requireSuperAdmin, getCsamHolds);
router.get('/api/legal/csam-evidence/:id', isAuthenticated, requireSuperAdmin, getCsamEvidence);
router.post('/api/legal/csam-report', isAuthenticated, requireSuperAdmin, reportCsam);
```

### Access Control Rules

1. **Super Admin Role Required**: Only users with `role="super_admin"` can access CSAM legal hold data
2. **All Access Logged**: Every access attempt (successful or failed) is logged with full audit trail
3. **Failed Attempts Alerted**: Non-authorized access attempts trigger critical security alerts
4. **No Exceptions**: There are NO exceptions to Super Admin-only access for CSAM data

### Storage Security

#### Cloud Storage Configuration:
- **Encryption**: All CSAM evidence MUST be encrypted at rest (AES-256)
- **Access Logging**: Every file access is logged with timestamp, user ID, and IP address
- **Retention Policy**: Evidence is retained per legal requirements (typically 7+ years)
- **Isolation**: CSAM storage buckets are completely isolated from regular content storage

#### Backend Implementation Required:
```typescript
// TODO: Implement these endpoints with Super Admin middleware:
// POST   /api/legal/csam-holds/create      - Create new CSAM legal hold
// GET    /api/legal/csam-holds              - List all CSAM holds (Super Admin only)
// GET    /api/legal/csam-holds/:id          - Get specific hold details
// POST   /api/legal/csam-holds/:id/evidence - Upload evidence to secure storage
// GET    /api/legal/csam-holds/:id/evidence - List evidence (Super Admin only)
// DELETE /api/legal/csam-holds/:id          - Close/release legal hold (with approval workflow)
```

### Compliance Requirements

1. **18 U.S.C. § 2258A**: Mandatory reporting of CSAM to NCMEC
2. **Chain of Custody**: All evidence handling must maintain legal chain of custody
3. **Law Enforcement Cooperation**: Secure portal for law enforcement access (separate auth)
4. **Audit Trail**: Complete audit trail of all actions taken on CSAM evidence

### Environment Variables

```bash
# Required for CSAM legal hold operations
CSAM_STORAGE_BUCKET=your-secure-csam-bucket
CSAM_ENCRYPTION_KEY=your-256-bit-encryption-key
NCMEC_REPORTING_ENDPOINT=https://report.cybertipline.org
LAW_ENFORCEMENT_API_KEY=your-secure-api-key
```

### Security Checklist

- [x] Super Admin middleware implemented (`requireSuperAdmin`)
- [x] All access attempts logged with audit trail
- [x] Failed access attempts trigger alerts
- [ ] Backend API routes with Super Admin protection (TODO: Implement)
- [ ] Encrypted cloud storage for CSAM evidence (TODO: Configure)
- [ ] NCMEC automated reporting integration (TODO: Implement)
- [ ] Law enforcement secure portal (TODO: Implement)

---

**⚠️ CRITICAL: This system handles evidence of child exploitation. Unauthorized access is a federal crime.**

**Developers: DO NOT test with real CSAM content. Use synthetic test data only.**

# TabooFanz Compliance & Safety Systems

## Overview

TabooFanz is designed with compliance and safety as core architectural principles, not afterthoughts. This document outlines the technical systems that enable legal and compliance teams to operate effectively.

---

## Age & Identity Verification

### Creator Verification Flow

```
Creator Signup → ID Verification Provider → Review → Verification Status
                        ↓
                 Jumio / Veriff
                        ↓
              Document Capture
              - Government ID
              - Selfie Match
              - Liveness Check
                        ↓
              Automated Checks
              - Document Validity
              - Face Match Score
              - Age Calculation
                        ↓
              Result Returned
              ├── VERIFIED → Can publish content
              ├── NEEDS_REVIEW → Manual review queue
              └── REJECTED → Cannot proceed
```

### Data Model: ComplianceRecord

```prisma
model ComplianceRecord {
  id                    String             @id
  userId                String             @unique

  // Age verification
  ageVerificationStatus VerificationStatus
  ageVerifiedAt         DateTime?
  dateOfBirth           DateTime?

  // ID verification
  idVerificationStatus  VerificationStatus
  idVerifiedAt          DateTime?

  // Provider reference
  verificationProviderId String?

  // Legal identity (encrypted)
  legalFirstName        String?
  legalLastName         String?
  legalCountry          String?

  // Document references
  idDocumentRef         String?  // Encrypted S3 key

  // Risk flags
  isPoliticallyExposed  Boolean
  requiresEnhancedDD    Boolean
}
```

### Key Security Measures

1. **Separation of Identities**: Legal name stored encrypted, separate from public persona
2. **Encrypted Storage**: All ID documents stored with AES-256 encryption
3. **Access Control**: Only compliance admins can access legal identity data
4. **Audit Trail**: All access to compliance data is logged

---

## Content Compliance

### Upload Processing Pipeline

```
Upload → Malware Scan → AI Safety Check → Human Review (if flagged) → Publish/Reject
           ↓                    ↓
        ClamAV            Azure Content Safety
                                ↓
                         Flag Categories:
                         - Age estimation
                         - Violence detection
                         - Non-consensual indicators
                         - Illegal content markers
```

### Content Flagging System

```prisma
model ContentItem {
  // ...
  isReported   Boolean  @default(false)
  status       ContentStatus
  // ...
}

enum ContentStatus {
  DRAFT
  PROCESSING
  PUBLISHED
  ARCHIVED
  REMOVED
  FLAGGED  // Requires manual review
}
```

### Moderation Queue

Moderators access a queue of flagged content:

```typescript
// Admin router
admin.reports.query({
  status: 'PENDING',
  type: 'CONTENT',
})
```

---

## Consent & Collaboration Records

### Collaboration Consent Flow

```
Creator A → Initiates Collaboration → Invites Creator B
                                              ↓
                                    Creator B Reviews Terms
                                              ↓
                                    Consent Form Displayed
                                    - Content description
                                    - Revenue split
                                    - Usage rights
                                              ↓
                                    Digital Signature
                                    - Terms hash
                                    - Timestamp
                                    - IP address
                                    - Device info
                                              ↓
                                    Consent Record Created
```

### Data Model: ConsentRecord

```prisma
model ConsentRecord {
  id              String   @id
  collaborationId String
  creatorId       String

  hasConsented    Boolean
  consentedAt     DateTime?

  // What they agreed to
  consentedTerms  String?   @db.Text

  // Verification
  signatureHash   String?   // SHA-256 of terms + timestamp
  consentIp       String?
  consentDevice   String?
}
```

### Content-Consent Linking

Every piece of collaborative content links to consent records:

```prisma
model ContentCollaborator {
  contentId       String
  creatorId       String
  revenueSplit    Decimal
  hasApproved     Boolean
  consentRecordId String?  // Links to ConsentRecord
}
```

---

## DMCA & Copyright Management

### DMCA Submission Flow

```
Claimant → DMCA Form → Validation → Queue → Admin Review → Action
             ↓
    Required Information:
    - Claimant identity
    - Original work description
    - URLs of infringing content
    - Good faith statement
    - Authority statement
    - Perjury awareness
    - Signature
```

### Data Model: DMCARequest

```prisma
model DMCARequest {
  id                String     @id

  // Claimant info
  claimantName      String
  claimantEmail     String
  claimantCompany   String?

  // Claims
  contentUrls       String[]
  originalWorkDesc  String     @db.Text
  originalWorkUrls  String[]

  // Legal attestations
  hasGoodFaith      Boolean
  hasAuthority      Boolean
  isPerjuryAware    Boolean

  signature         String
  signedAt          DateTime

  // Processing
  status            DMCAStatus
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?    @db.Text

  // Counter-notice
  counterFiledAt    DateTime?
  counterFilerInfo  Json?
}

enum DMCAStatus {
  RECEIVED
  UNDER_REVIEW
  VALID_TAKEDOWN
  INVALID
  COUNTER_FILED
  RESTORED
}
```

### Admin DMCA Processing

```typescript
admin.processDmca({
  requestId: string,
  status: 'VALID_TAKEDOWN' | 'INVALID',
  notes: string,
})
```

On valid takedown:
1. Content status set to REMOVED
2. Creator notified
3. Content becomes inaccessible
4. Action logged in audit trail

---

## Reporting System

### Report Categories

| Category | Description |
|----------|-------------|
| SPAM | Unwanted promotional content |
| HARASSMENT | Targeted abuse or bullying |
| UNDERAGE | Suspected minor in content |
| NON_CONSENSUAL | Suspected revenge porn or non-consensual sharing |
| IMPERSONATION | Fake accounts pretending to be someone else |
| COPYRIGHT | Unauthorized use of copyrighted material |
| ILLEGAL | Other illegal content |
| OTHER | Catch-all for edge cases |

### Report Flow

```
User → Report Form → Category + Description → Optional Evidence → Submit
                                                                    ↓
                                                            Report Created
                                                                    ↓
                                                            Content Flagged
                                                                    ↓
                                                            Moderation Queue
                                                                    ↓
                                            ┌───────────────────────┼───────────────────────┐
                                            ↓                       ↓                       ↓
                                        Resolved                Dismissed               Escalated
                                            ↓                       ↓                       ↓
                                    Action Taken:               No action             Senior review
                                    - Warning
                                    - Suspension
                                    - Ban
                                    - Content removal
```

### Data Model: Report

```prisma
model Report {
  id              String         @id
  reporterId      String
  reportedUserId  String?

  type            ReportType
  category        ReportCategory
  status          ReportStatus

  // References
  contentId       String?
  messageId       String?
  commentId       String?
  liveSessionId   String?

  // Details
  description     String         @db.Text
  evidence        String[]       // URLs to screenshots

  // Resolution
  resolvedBy      String?
  resolvedAt      DateTime?
  resolution      String?        @db.Text
  actionTaken     String?        // warning, suspension, ban, none
}
```

---

## Data Privacy & Security

### Data Retention Policy

| Data Type | Retention Period | Notes |
|-----------|------------------|-------|
| User accounts | Until deletion requested | Soft delete, 30-day recovery |
| Content | Until deleted by creator | Permanently deleted on request |
| Messages | Until conversation deleted | Both parties must agree |
| Transactions | 7 years | Legal/tax requirements |
| Compliance records | 10 years | Legal requirements |
| Audit logs | 5 years | Security compliance |

### Right to Access / Delete

```typescript
// User can request data export
user.requestDataExport()

// Returns:
// - Profile data
// - Content metadata
// - Transaction history
// - Subscription data
// - Messages (their side only)

// User can request deletion
user.requestAccountDeletion()

// Process:
// 1. 14-day cooling-off period
// 2. Cancel active subscriptions
// 3. Initiate final payout
// 4. Soft delete account
// 5. 30-day recovery window
// 6. Permanent deletion (except legal holds)
```

### Audit Logging

Every sensitive action is logged:

```prisma
model AuditLog {
  id          String   @id
  userId      String?

  action      String   // e.g., "user.suspended", "payout.completed"
  entityType  String   // e.g., "User", "Payout"
  entityId    String?

  oldValues   Json?
  newValues   Json?

  ipAddress   String?
  userAgent   String?

  performedBy String?
  reason      String?

  createdAt   DateTime
}
```

### Logged Actions

- User status changes (suspend, ban, reactivate)
- Creator verification status changes
- Payout approvals/rejections
- Content takedowns
- DMCA processing
- Admin privilege changes
- Feature flag updates
- Compliance record access

---

## Identity Protection (TabooFanz-Specific)

### Masked Creator Mode

Technical implementation:

```prisma
model IdentityProtection {
  creatorProfileId      String   @unique

  // Masked Mode
  maskedModeEnabled     Boolean  @default(false)
  autoBlurBackground    Boolean  @default(false)
  faceDetectionWarnings Boolean  @default(true)
  locationWarnings      Boolean  @default(true)
  tattooWarnings        Boolean  @default(false)

  // Region Blocking
  blockedCountries      String[] @default([])
  blockedRegions        String[] @default([])
  vpnAccessAllowed      Boolean  @default(true)

  // Alias Protection
  realNameHidden        Boolean  @default(true)
  metadataStripping     Boolean  @default(true)
}
```

### Upload Privacy Checks

When a creator with masked mode uploads:

```
Upload → EXIF Stripping → AI Analysis → Warnings
                              ↓
                    Check for:
                    - Face detection (if face masking desired)
                    - Background items (location indicators)
                    - Unique identifiers (tattoos, birthmarks)
                    - Text/logos (addresses, brands)
                              ↓
                    Generate Warnings:
                    - "Face detected at X,Y - apply blur?"
                    - "Window visible - outdoor view may reveal location"
                    - "Unique marking detected - consider covering"
```

### Region Blocking Implementation

On content/profile access:

```typescript
// Middleware checks
function checkRegionAccess(creatorId: string, visitorIp: string) {
  const protection = await getIdentityProtection(creatorId);
  const geoData = await geolocateIP(visitorIp);

  if (protection.blockedCountries.includes(geoData.country)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (protection.blockedRegions.includes(geoData.region)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // VPN detection
  if (!protection.vpnAccessAllowed && geoData.isVpn) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}
```

---

## Compliance Dashboard (Admin)

### Available Views

1. **Pending Verifications**: Creators awaiting ID verification
2. **Report Queue**: Unresolved reports by priority
3. **DMCA Queue**: Pending takedown requests
4. **High-Risk Users**: Flagged by fraud detection
5. **Audit Log Viewer**: Searchable action history
6. **Compliance Records**: Access to KYC data (restricted)

### Access Levels

| Role | Access |
|------|--------|
| Moderator | Reports, content removal |
| Compliance | + KYC records, DMCA, verification |
| Admin | + Audit logs, feature flags, user management |
| Super Admin | + Payment controls, system settings |

---

## 18 U.S.C. 2257 Compliance

### Record-Keeping Requirements

For all visual depictions of actual sexually explicit conduct:

1. **Performer Records**: Creator's legal name, age verification, government ID
2. **Producer Records**: Platform as secondary producer maintains records
3. **Custodian of Records**: Designated individual accessible for inspection
4. **Cross-References**: Content can be linked back to performer identity

### Implementation

- All content linked to verified ComplianceRecord
- 2257-compliant pages accessible at `/legal/2257`
- Records maintained for 7 years post-content creation
- Immediate access to records by authorized inspectors

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | CSAM, imminent harm | Immediate (< 1 hour) |
| High | Non-consensual content, underage | < 4 hours |
| Medium | Harassment, impersonation | < 24 hours |
| Low | Spam, minor violations | < 72 hours |

### Response Actions

1. **Content Removal**: Immediate on critical/high
2. **Account Suspension**: Pending investigation
3. **Law Enforcement Notification**: Required for CSAM
4. **User Notification**: Inform reporter/reported as appropriate
5. **Documentation**: Full incident report in audit log

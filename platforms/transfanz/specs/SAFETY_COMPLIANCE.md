# TransFanz Safety & Compliance

## Trust & Safety Philosophy

TransFanz prioritizes the safety of trans and gender-diverse creators and fans. Our safety systems are designed by and for the trans community, with an understanding of the specific harassment patterns and risks trans people face online.

---

## Identity & Privacy Protection

### Legal Name Handling

| Aspect | Policy |
|--------|--------|
| Storage | AES-256 encrypted |
| Visibility | Compliance/KYC only - never public |
| Access | Logged and audited |
| Retention | 7 years (legal compliance) |

### Chosen Name

| Aspect | Policy |
|--------|--------|
| Default | Always displayed instead of legal name |
| Changeable | Yes, at any time |
| History | Tracked for moderation purposes |
| Past Content | Option to retroactively update |

### Deadname Protection

- Deadname never exposed once chosen name is set
- Hidden from search
- Hidden from public history
- Creator controls all visibility
- Past content can display chosen name

---

## Content Moderation

### Automated Detection

#### Transphobic Slurs
- **Action:** Auto-hide and flag
- **Creator Notified:** Yes
- **Database:** Encrypted, maintained by T&S team
- **Contextual Awareness:** Yes (reclaimed usage vs. harassment)

#### Harassment
- **Action:** Flag for review
- **Model:** Custom harassment-detection-v2
- **Categories:** Direct threats, targeted harassment, brigading

#### Hate Symbols
- **Action:** Block upload
- **Coverage:** Known hate symbols, transphobic imagery

### Human Review

#### Priority Queue Order
1. Transphobia
2. Doxxing
3. Harassment
4. Other

#### SLA by Priority

| Priority | Response Time |
|----------|---------------|
| Urgent | 4 hours |
| High | 12 hours |
| Normal | 24 hours |
| Low | 72 hours |

#### Escalation Path
1. Moderator
2. Senior Moderator
3. Trust & Safety Lead
4. Legal (if required)

---

## User Safety Controls

### Message Filtering

| Level | Description |
|-------|-------------|
| Off | No filtering |
| Low | Block obvious slurs only |
| Medium | Block slurs + common harassment (Default) |
| High | Aggressive filtering |
| Strict | Subscribers only |

**Additional Options:**
- Custom blocked terms (up to 100)
- Auto-block transphobic slurs
- Require message approval

### Blocking

- **One-click block** from any interaction
- **Block & report** combined action
- **Hide from blocker** - blocked user can't see blocker
- **IP block option** for creators

### Region Blocking

Creators can block viewers from:
- Specific countries
- Specific states (US)
- IP ranges (advanced)

### Pre-Transition Content

- **Hide option** - Remove from public view
- **Display name override** - Show chosen name on old content
- **Bulk update** - Batch process historical content

---

## Report Categories

| Category | Priority | Description | Auto-Escalate |
|----------|----------|-------------|---------------|
| Transphobia | Urgent | Slurs, misgendering, denial of identity, hate speech | Yes |
| Doxxing | Urgent | Sharing personal info, deadnaming, outing | Yes |
| Non-consensual | Urgent | Revenge content, stolen content | Yes |
| Underage | Urgent | CSAM or suspected minor | Yes + Law Enforcement |
| Harassment | High | Targeted harassment, threats, intimidation | No |
| Hate Speech | High | Racism, homophobia, ableism, other hate | No |
| Copyright | Normal | DMCA, intellectual property | No |
| Spam | Low | Spam, scams, bots | No |
| Other | Normal | Other violations | No |

---

## Moderation Actions

### Warning
- Formal warning sent to user
- Visible to user
- Expires after 90 days
- Appealable: No

### Content Removal
- Specific content removed
- Visible to user
- Appealable: Yes

### Timeout (Temporary Suspension)
- Duration options: 1, 3, 7, 14, 30 days
- Visible to user
- Appealable: Yes

### Ban (Account Termination)
- Can be permanent or time-limited
- Visible to user
- Appealable: Yes
- Appeal window: 30 days

### Shadow Ban
- Hidden restriction
- Not visible to user
- Use case: Repeat harassment
- Review required every 30 days

---

## KYC & Verification

### Required For
- All creators

### Required Documents
1. **ID Document** (passport, driver's license, national ID)
2. **Selfie with ID** (liveness check enabled)

### Data Handling
- Encryption: AES-256
- Storage: Isolated compliance database
- Access logging: All access recorded
- Retention: 7 years
- GDPR compliant: Yes

### Trans-Specific Handling
- Legal name from ID stored for compliance only
- Chosen name used everywhere else
- Payout name can be separate from display name
- Clear UI separation between legal/chosen names

---

## Age Verification

| Aspect | Policy |
|--------|--------|
| Minimum Age | 18 |
| Methods | ID document, third-party AGV service |
| Re-verification | Not required |
| Region-specific | EU/UK use AGV services |

---

## DMCA Compliance

### Required Fields
- Claimant name
- Claimant email
- Claimant address
- Content URLs
- Original work description
- Good faith statement
- Perjury statement
- Signature

### Process
- Counter-notice supported
- Response time: 3 business days
- Valid claims result in takedown

---

## Data Rights (GDPR/CCPA)

### Data Export
- Formats: JSON, CSV
- Processing time: 30 days
- **Includes:**
  - Profile data
  - Content metadata
  - Messages sent
  - Financial records
  - Subscriber list (anonymized)
- **Excludes:**
  - Other users' data
  - Compliance records

### Account Deletion
- Soft delete period: 30 days (recovery window)
- Hard delete after: 30 days
- **Retained (legal requirement):**
  - Financial records
  - Compliance records
  - Anonymized analytics
- **Deleted:**
  - Profile data
  - Content
  - Messages
  - Subscriptions

---

## Crisis Resources

Displayed in relevant contexts (reports, blocks, safety settings):

### United States & Canada
- **Trans Lifeline:** 877-565-8860
  - Peer support hotline for trans people

- **Trevor Project:** 866-488-7386 (or text START to 678-678)
  - LGBTQ+ crisis intervention

### United Kingdom
- **LGBT Foundation:** 0345 3 30 30 30
  - UK LGBTQ+ support

### Australia
- **QLife:** 1800 184 527
  - Australia LGBTQ+ support

---

## Safety Education Topics

Available in Help Center and during onboarding:

1. Protecting your privacy online
2. Recognizing harassment
3. Safe content sharing
4. Financial safety for creators
5. Dealing with doxxing

---

## Moderation Team Requirements

### Training
- Trans cultural competency
- Trauma-informed moderation
- Understanding of trans-specific harassment patterns
- Regular refresher training

### Composition
- Prioritize trans moderators
- Diverse gender identities represented
- Lived experience valued

### Wellness
- Regular breaks mandated
- Mental health support available
- Exposure limits for graphic content

---

## Incident Response

### Severity Levels

| Level | Description | Response |
|-------|-------------|----------|
| Critical | Mass harassment, credible threats, legal issues | Immediate escalation, all hands |
| High | Organized harassment, viral hate | Same-day response, senior team |
| Medium | Individual harassment patterns | 24-hour response |
| Low | Isolated incidents | Standard queue |

### Communication
- Affected users notified of actions taken
- Transparency reports published quarterly
- Law enforcement coordination when required

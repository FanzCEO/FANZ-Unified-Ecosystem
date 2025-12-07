# TransFanz Data Models

## Prisma Schema

```prisma
// schema.prisma - TransFanz

// ============================================
// ENUMS
// ============================================

enum Platform {
  TRANSFANZ
  BOYFANZ
  GIRLFANZ
  // ... other FANZ platforms
}

enum GenderIdentity {
  TRANS_WOMAN
  TRANS_MAN
  TRANS_FEMME
  TRANS_MASC
  NONBINARY
  GENDERFLUID
  AGENDER
  BIGENDER
  TWO_SPIRIT
  INTERSEX
  QUESTIONING
  GENDERQUEER
  CUSTOM
}

enum PronounSet {
  SHE_HER
  HE_HIM
  THEY_THEM
  SHE_THEY
  HE_THEY
  ANY_PRONOUNS
  NEOPRONOUNS
  CUSTOM
}

enum PersonaArchetype {
  THE_MUSE
  THE_PHOENIX
  THE_ICON
  THE_SOFT_BOY
  THE_DREAM_GIRL
  THE_ENBY_STAR
  THE_SHAPESHIFTER
  THE_GUARDIAN
  THE_COSMIC_BEING
  THE_REBEL_ANGEL
}

enum ExpressionStyle {
  FEMME
  MASC
  ANDROGYNOUS
  SOFT
  PUNK
  GOTH
  E_GIRL
  E_BOY
  E_ENBY
  COTTAGECORE
  STREETWEAR
  GLAM
  ALT
  CYBER
}

enum ContentType {
  IMAGE
  VIDEO
  AUDIO
  TEXT
  LIVE_STREAM
  STORY
}

enum SubscriptionTier {
  FREE
  BASIC
  PREMIUM
  VIP
}

enum ReportCategory {
  TRANSPHOBIA
  HARASSMENT
  HATE_SPEECH
  DOXXING
  SPAM
  UNDERAGE_CONTENT
  NON_CONSENSUAL
  COPYRIGHT
  OTHER
}

enum UserRole {
  FAN
  CREATOR
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum MessageFilterLevel {
  OFF
  LOW
  MEDIUM
  HIGH
  STRICT
}

// ============================================
// USER & IDENTITY
// ============================================

model User {
  id                    String              @id @default(cuid())
  email                 String              @unique
  emailVerified         DateTime?
  passwordHash          String?

  // Identity - TransFanz specific
  chosenName            String              // Display name, always shown
  legalName             String?             // KYC only, never public
  handle                String              @unique // @username

  // Pronouns
  pronouns              PronounSet          @default(THEY_THEM)
  customPronouns        String?             // For neo/custom pronouns
  showPronouns          Boolean             @default(true)

  // Gender Identity
  genderIdentities      GenderIdentity[]    // Multi-select
  customGenderIdentity  String?             // Free-text option
  showGenderIdentity    Boolean             @default(true)

  // Role & Status
  role                  UserRole            @default(FAN)
  platform              Platform            @default(TRANSFANZ)
  verificationStatus    VerificationStatus  @default(UNVERIFIED)

  // Profile
  avatarUrl             String?
  bannerUrl             String?
  bio                   String?             @db.Text
  location              String?
  website               String?

  // Timestamps
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  lastActiveAt          DateTime?

  // Relations
  creatorProfile        CreatorProfile?
  fanProfile            FanProfile?
  sessions              Session[]
  accounts              Account[]
  wallet                Wallet?
  sentMessages          Message[]           @relation("SentMessages")
  receivedMessages      Message[]           @relation("ReceivedMessages")
  subscriptions         Subscription[]      @relation("FanSubscriptions")
  subscribers           Subscription[]      @relation("CreatorSubscriptions")
  reports               Report[]            @relation("ReportedBy")
  reportsAgainst        Report[]            @relation("ReportedUser")
  blocks                Block[]             @relation("BlockingUser")
  blockedBy             Block[]             @relation("BlockedUser")
  notifications         Notification[]
  boundarySettings      BoundarySettings?
  nameHistory           NameHistory[]

  @@index([handle])
  @@index([platform])
  @@index([createdAt])
}

model NameHistory {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  previousName  String
  changedAt     DateTime  @default(now())
  reason        String?

  @@index([userId])
}

model BoundarySettings {
  id                        String              @id @default(cuid())
  userId                    String              @unique
  user                      User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Message filtering
  messageFilterLevel        MessageFilterLevel  @default(MEDIUM)
  blockedTerms              String[]
  autoBlockSlurs            Boolean             @default(true)

  // Content visibility
  showPreTransitionContent  Boolean             @default(true)
  preTransitionDisplayName  String?

  // Privacy
  allowDmsFrom              String              @default("subscribers")
  hideFromSearch            Boolean             @default(false)
  blockedRegions            String[]
  blockedIpRanges           String[]

  // Safety
  requireMessageApproval    Boolean             @default(false)
  autoHideNewComments       Boolean             @default(false)

  createdAt                 DateTime            @default(now())
  updatedAt                 DateTime            @updatedAt
}

// ============================================
// CREATOR PROFILE
// ============================================

model CreatorProfile {
  id                    String              @id @default(cuid())
  userId                String              @unique
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // TransFanz specific
  personaArchetype      PersonaArchetype?
  expressionStyles      ExpressionStyle[]
  transitionJourney     TransitionJourneyTag[]

  // Pricing
  subscriptionPrice     Decimal             @default(0) @db.Decimal(10, 2)
  acceptsTips           Boolean             @default(true)
  minimumTip            Decimal             @default(5) @db.Decimal(10, 2)

  // Stats
  subscriberCount       Int                 @default(0)
  totalEarnings         Decimal             @default(0) @db.Decimal(12, 2)
  contentCount          Int                 @default(0)

  // Verification
  idVerifiedAt          DateTime?
  ageVerifiedAt         DateTime?

  // Status
  isActive              Boolean             @default(true)
  isFeatured            Boolean             @default(false)
  featuredUntil         DateTime?

  // Relations
  content               Content[]
  liveStreams           LiveStream[]
  pricingTiers          PricingTier[]
  tags                  TagOnCreator[]

  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([subscriberCount(sort: Desc)])
  @@index([isActive, isFeatured])
}

enum TransitionJourneyTag {
  ON_HRT
  PRE_HRT
  POST_OP
  NON_MEDICAL_TRANSITION
  OPEN_ABOUT_JOURNEY
  PRIVATE_ABOUT_JOURNEY
}

model FanProfile {
  id                String          @id @default(cuid())
  userId            String          @unique
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  fanType           String?
  preferredIdentities     GenderIdentity[]
  preferredExpressions    ExpressionStyle[]
  preferredVibes          String[]
  preferredContentStyles  String[]
  hideActivity      Boolean         @default(false)

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

// ============================================
// TAGGING SYSTEM
// ============================================

model Tag {
  id            String          @id @default(cuid())
  slug          String          @unique
  name          String
  category      TagCategory
  description   String?
  isActive      Boolean         @default(true)
  usageCount    Int             @default(0)

  creators      TagOnCreator[]
  content       TagOnContent[]

  createdAt     DateTime        @default(now())

  @@index([category])
  @@index([usageCount(sort: Desc)])
}

enum TagCategory {
  GENDER_IDENTITY
  PRONOUNS
  EXPRESSION_STYLE
  BODY_JOURNEY
  VIBE_PERSONALITY
  CONTENT_STYLE
  COMMUNITY_CULTURE
}

model TagOnCreator {
  id              String          @id @default(cuid())
  creatorId       String
  creator         CreatorProfile  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  tagId           String
  tag             Tag             @relation(fields: [tagId], references: [id], onDelete: Cascade)
  isPrimary       Boolean         @default(false)

  @@unique([creatorId, tagId])
  @@index([tagId])
}

model TagOnContent {
  id          String      @id @default(cuid())
  contentId   String
  content     Content     @relation(fields: [contentId], references: [id], onDelete: Cascade)
  tagId       String
  tag         Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([contentId, tagId])
  @@index([tagId])
}

// ============================================
// CONTENT
// ============================================

model Content {
  id              String          @id @default(cuid())
  creatorId       String
  creator         CreatorProfile  @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  type            ContentType
  title           String?
  caption         String?         @db.Text

  mediaUrls       String[]
  thumbnailUrl    String?
  duration        Int?

  visibility      ContentVisibility @default(SUBSCRIBERS_ONLY)
  price           Decimal?        @db.Decimal(10, 2)

  viewCount       Int             @default(0)
  likeCount       Int             @default(0)
  commentCount    Int             @default(0)
  tipTotal        Decimal         @default(0) @db.Decimal(10, 2)

  isApproved      Boolean         @default(true)
  isFlagged       Boolean         @default(false)
  flagReason      String?

  publishedAt     DateTime?
  scheduledFor    DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  tags            TagOnContent[]
  comments        Comment[]
  likes           Like[]
  purchases       ContentPurchase[]

  @@index([creatorId, publishedAt(sort: Desc)])
  @@index([visibility, isApproved])
}

enum ContentVisibility {
  PUBLIC
  SUBSCRIBERS_ONLY
  PPV
  PRIVATE
}

// ============================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================

model Subscription {
  id              String          @id @default(cuid())
  fanId           String
  fan             User            @relation("FanSubscriptions", fields: [fanId], references: [id])
  creatorId       String
  creator         User            @relation("CreatorSubscriptions", fields: [creatorId], references: [id])

  tier            SubscriptionTier @default(BASIC)
  price           Decimal         @db.Decimal(10, 2)

  status          SubscriptionStatus @default(ACTIVE)
  startedAt       DateTime        @default(now())
  expiresAt       DateTime
  cancelledAt     DateTime?

  stripeSubscriptionId  String?   @unique

  @@unique([fanId, creatorId])
  @@index([creatorId, status])
  @@index([expiresAt])
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAUSED
}

model Wallet {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  balance         Decimal         @default(0) @db.Decimal(12, 2)
  pendingBalance  Decimal         @default(0) @db.Decimal(12, 2)
  lifetimeEarnings Decimal        @default(0) @db.Decimal(12, 2)

  stripeAccountId String?
  payoutMethod    String?
  payoutSchedule  String          @default("weekly")
  payoutLegalName String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  transactions    Transaction[]
}

// ============================================
// SAFETY & MODERATION
// ============================================

model Report {
  id              String          @id @default(cuid())

  reporterId      String
  reporter        User            @relation("ReportedBy", fields: [reporterId], references: [id])

  reportedUserId  String?
  reportedUser    User?           @relation("ReportedUser", fields: [reportedUserId], references: [id])
  reportedContentId String?
  reportedMessageId String?

  category        ReportCategory
  description     String          @db.Text
  evidence        String[]

  status          ReportStatus    @default(PENDING)
  priority        ReportPriority  @default(NORMAL)

  resolvedAt      DateTime?
  resolvedById    String?
  resolution      String?         @db.Text
  actionTaken     String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status, priority])
  @@index([reportedUserId])
  @@index([createdAt(sort: Desc)])
}

enum ReportStatus {
  PENDING
  IN_REVIEW
  RESOLVED
  ESCALATED
  DISMISSED
}

enum ReportPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model Block {
  id            String      @id @default(cuid())
  blockerId     String
  blocker       User        @relation("BlockingUser", fields: [blockerId], references: [id])
  blockedId     String
  blocked       User        @relation("BlockedUser", fields: [blockedId], references: [id])

  reason        String?
  createdAt     DateTime    @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockedId])
}

// ============================================
// COMPLIANCE & KYC
// ============================================

model ComplianceRecord {
  id              String          @id @default(cuid())
  userId          String

  legalFirstName  String
  legalLastName   String
  dateOfBirth     DateTime
  nationality     String

  idType          String
  idNumber        String
  idExpiryDate    DateTime?
  idDocumentUrl   String

  verificationStatus  VerificationStatus @default(PENDING)
  verifiedAt      DateTime?
  verifiedBy      String?
  rejectionReason String?

  isOver18        Boolean         @default(false)
  ageVerifiedAt   DateTime?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([userId])
  @@index([verificationStatus])
}
```

---

## Entity Relationship Summary

```
User
├── CreatorProfile (1:1)
│   ├── Content (1:N)
│   ├── LiveStream (1:N)
│   ├── PricingTier (1:N)
│   └── Tags (N:N via TagOnCreator)
├── FanProfile (1:1)
├── Wallet (1:1)
├── BoundarySettings (1:1)
├── Sessions (1:N)
├── Accounts (1:N) - OAuth
├── Subscriptions (N:N with other Users)
├── Messages (1:N sent/received)
├── Reports (1:N as reporter/reported)
├── Blocks (1:N as blocker/blocked)
├── Notifications (1:N)
└── NameHistory (1:N)

Tag
├── TagOnCreator (N:N with CreatorProfile)
└── TagOnContent (N:N with Content)

Content
├── Comments (1:N)
├── Likes (1:N)
├── Purchases (1:N)
└── Tags (N:N via TagOnContent)
```

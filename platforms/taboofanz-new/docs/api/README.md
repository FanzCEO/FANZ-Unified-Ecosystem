# TabooFanz API Documentation

## Overview

TabooFanz uses tRPC for type-safe API communication between clients and the server. All API endpoints are strongly typed and automatically generate client-side types.

## Base URL

```
Production: https://api.taboofanz.com/trpc
Development: http://localhost:3001/trpc
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- Use `auth.refresh` to obtain new tokens

---

## API Routers

### Auth Router (`auth.*`)

#### `auth.register`
Create a new user account.

**Input:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Min 8 chars, uppercase, lowercase, number, special
  username: string;   // 3-30 chars, alphanumeric with _ and -
  displayName?: string;
  role: 'FAN' | 'CREATOR';
}
```

**Output:**
```typescript
{
  user: { id, email, username, displayName, role, status, createdAt };
  accessToken: string;
  refreshToken: string;
}
```

#### `auth.login`
Authenticate an existing user.

**Input:**
```typescript
{
  email: string;
  password: string;
}
```

**Output:**
```typescript
{
  user: { id, email, username, displayName, role, status, avatarUrl };
  accessToken: string;
  refreshToken: string;
}
```

#### `auth.refresh`
Refresh access token.

**Input:**
```typescript
{
  refreshToken: string;
}
```

**Output:**
```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

#### `auth.logout` (Protected)
Invalidate current session.

**Output:** `{ success: true }`

#### `auth.me` (Protected)
Get current user with full profile.

**Output:** Full user object with creatorProfile/fanProfile, wallet, etc.

#### `auth.sessions` (Protected)
List active sessions.

**Output:** Array of session objects with device info.

#### `auth.revokeSession` (Protected)
Revoke a specific session.

**Input:** `{ sessionId: string }`

---

### User Router (`user.*`)

#### `user.getByUsername`
Get public profile by username.

**Input:** `{ username: string }`

**Output:** Public user profile with creator info if applicable.

#### `user.updateProfile` (Protected)
Update current user's profile.

**Input:**
```typescript
{
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  locale?: string;
  timezone?: string;
}
```

#### `user.blockUser` (Protected)
Block another user.

**Input:** `{ userId: string, reason?: string }`

#### `user.unblockUser` (Protected)
Unblock a user.

**Input:** `{ userId: string }`

#### `user.blockedUsers` (Protected)
List blocked users.

#### `user.reportUser` (Protected)
Report a user.

**Input:**
```typescript
{
  userId: string;
  category: 'SPAM' | 'HARASSMENT' | 'UNDERAGE' | 'NON_CONSENSUAL' | 'IMPERSONATION' | 'COPYRIGHT' | 'ILLEGAL' | 'OTHER';
  description: string; // 10-1000 chars
  evidence?: string[]; // URLs
}
```

---

### Creator Router (`creator.*`)

#### `creator.featured`
Get featured creators.

**Input:** `{ limit?: number }` (default: 12, max: 50)

#### `creator.discover`
Discover creators with TabooFanz-specific filters.

**Input:**
```typescript
{
  archetype?: Archetype;
  powerEnergy?: PowerEnergy;
  tags?: string[];      // Tag slugs
  cursor?: string;
  limit?: number;
}
```

**Output:**
```typescript
{
  creators: CreatorProfile[];
  nextCursor?: string;
}
```

#### `creator.updateProfile` (Creator)
Update creator profile.

**Input:**
```typescript
{
  archetype?: Archetype;
  customArchetypeName?: string;
  archetypeDescription?: string;
  powerEnergy?: PowerEnergy | null;
  tagline?: string;
  extendedBio?: string;
  brandColors?: { primary, secondary, accent };
  subscriptionPrice?: number;
  messagePrice?: number | null;
  welcomeMessage?: string;
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
}
```

#### `creator.updateIdentityProtection` (Creator)
Update TabooFanz identity protection settings.

**Input:**
```typescript
{
  maskedModeEnabled?: boolean;
  autoBlurBackground?: boolean;
  faceDetectionWarnings?: boolean;
  locationWarnings?: boolean;
  tattooWarnings?: boolean;
  blockedCountries?: string[];
  blockedRegions?: string[];
  vpnAccessAllowed?: boolean;
  realNameHidden?: boolean;
  metadataStripping?: boolean;
}
```

#### `creator.updateBoundaryProfile` (Creator)
Update consent and boundaries.

**Input:**
```typescript
{
  publicStatement?: string;
  comfortableTags?: string[];
  hardBoundaries?: string[];
  internalNotes?: string;
  dmsOpenTo?: 'all' | 'subscribers' | 'none';
  customRequestsAllowed?: boolean;
}
```

#### `creator.updateTags` (Creator)
Set creator tags.

**Input:**
```typescript
{
  tags: Array<{ slug: string; isPrimary?: boolean }>;
}
```

#### `creator.analytics` (Creator)
Get creator analytics.

**Input:** `{ startDate?: Date, endDate?: Date }`

**Output:** Daily analytics + summary stats.

#### `creator.createTier` (Creator)
Create subscription tier.

**Input:**
```typescript
{
  name: string;
  description?: string;
  price: number;
  intervalDays?: number;
  trialDays?: number;
  benefits?: string[];
  maxSubscribers?: number;
}
```

---

### Content Router (`content.*`)

#### `content.feed` (Protected)
Get personalized feed.

**Input:** `{ cursor?: string, limit?: number }`

**Output:**
```typescript
{
  items: ContentItem[];  // With isLiked flag
  nextCursor?: string;
}
```

#### `content.getById`
Get single content item.

**Input:** `{ id: string }`

**Output:** Content with `hasAccess` flag, blurred if no access.

#### `content.create` (Creator)
Create new content.

**Input:**
```typescript
{
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'GALLERY';
  visibility: 'PUBLIC' | 'SUBSCRIBERS_ONLY' | 'PPV' | 'PRIVATE';
  caption?: string;
  price?: number;        // Required for PPV
  scheduledAt?: Date;
  tags?: string[];
  mediaItems: Array<{
    storageKey: string;
    cdnUrl: string;
    thumbnailUrl?: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    duration?: number;
  }>;
}
```

#### `content.update` (Creator)
Update content.

**Input:**
```typescript
{
  id: string;
  caption?: string;
  visibility?: ContentVisibility;
  price?: number | null;
  isPinned?: boolean;
}
```

#### `content.delete` (Creator)
Delete content.

**Input:** `{ id: string }`

#### `content.like` / `content.unlike` (Protected)
Toggle like on content.

**Input:** `{ id: string }`

#### `content.comment` (Protected)
Add comment.

**Input:**
```typescript
{
  contentId: string;
  text: string;
  parentId?: string;  // For replies
}
```

#### `content.comments`
Get comments for content.

**Input:** `{ contentId: string, cursor?: string, limit?: number }`

#### `content.report` (Protected)
Report content.

**Input:**
```typescript
{
  contentId: string;
  category: ReportCategory;
  description: string;
}
```

---

### Tag Router (`tag.*`)

#### `tag.groups`
Get all tag groups with tags.

#### `tag.byGroup`
Get tags by group slug.

**Input:** `{ groupSlug: string }`

#### `tag.popular`
Get popular tags.

**Input:** `{ limit?: number }`

#### `tag.search`
Search tags.

**Input:** `{ query: string }`

---

### Subscription Router (`subscription.*`)

#### `subscription.subscribe` (Protected)
Subscribe to a creator.

**Input:**
```typescript
{
  creatorId: string;
  tierId?: string;
  promoCode?: string;
}
```

#### `subscription.unsubscribe` (Protected)
Cancel subscription.

**Input:** `{ creatorId: string }`

**Output:** `{ success: true, accessUntil: Date }`

#### `subscription.mySubscriptions` (Protected)
Get fan's subscriptions.

**Input:** `{ status?: SubscriptionStatus, cursor?: string, limit?: number }`

#### `subscription.mySubscribers` (Creator)
Get creator's subscribers.

**Input:** `{ status?: SubscriptionStatus, cursor?: string, limit?: number }`

#### `subscription.checkStatus` (Protected)
Check if subscribed to creator.

**Input:** `{ creatorId: string }`

---

### Wallet Router (`wallet.*`)

#### `wallet.balance` (Protected)
Get wallet balance.

#### `wallet.transactions` (Protected)
Get transaction history.

**Input:** `{ type?: TransactionType, cursor?: string, limit?: number }`

#### `wallet.tip` (Protected)
Send tip to creator.

**Input:**
```typescript
{
  creatorId: string;
  amount: number;      // 1-1000
  message?: string;
  contentId?: string;
}
```

#### `wallet.unlockContent` (Protected)
Unlock PPV content.

**Input:** `{ contentId: string }`

#### `wallet.requestPayout` (Creator)
Request payout.

**Input:**
```typescript
{
  amount: number;       // Min 20
  payoutMethodId?: string;
}
```

#### `wallet.payouts` (Creator)
Get payout history.

**Input:** `{ status?: PayoutStatus, cursor?: string, limit?: number }`

---

### Message Router (`message.*`)

#### `message.conversations` (Protected)
Get conversations.

**Input:** `{ cursor?: string, limit?: number }`

#### `message.messages` (Protected)
Get messages in conversation.

**Input:** `{ conversationId: string, cursor?: string, limit?: number }`

#### `message.send` (Protected)
Send a message.

**Input:**
```typescript
{
  recipientId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  isPaid?: boolean;
  price?: number;
}
```

#### `message.unlock` (Protected)
Unlock paid message.

**Input:** `{ messageId: string }`

#### `message.archive` / `message.mute` (Protected)
Archive or mute conversation.

---

### Live Router (`live.*`)

#### `live.list`
List live/scheduled sessions.

**Input:** `{ status?: LiveSessionStatus, cursor?: string, limit?: number }`

#### `live.getById`
Get live session details.

**Input:** `{ id: string }`

**Output:** Session with `canWatch` and `playbackUrl` (if authorized).

#### `live.schedule` (Creator)
Schedule live session.

**Input:**
```typescript
{
  title: string;
  description?: string;
  scheduledAt: Date;
  isSubscribersOnly?: boolean;
  tipGoal?: number;
}
```

#### `live.start` / `live.end` (Creator)
Start or end a session.

**Input:** `{ sessionId: string }`

#### `live.join` / `live.leave` (Protected)
Join or leave as viewer.

**Input:** `{ sessionId: string }`

#### `live.chat` (Protected)
Send chat message.

**Input:** `{ sessionId: string, text: string }`

#### `live.tip` (Protected)
Send live tip.

**Input:** `{ sessionId: string, amount: number, message?: string }`

---

### Admin Router (`admin.*`)

All admin endpoints require ADMIN or MODERATOR role.

#### `admin.stats`
Dashboard statistics.

#### `admin.users`
List users with filters.

#### `admin.updateUserStatus`
Suspend/ban users.

#### `admin.verifyCreator`
Verify/unverify creators.

#### `admin.reports`
List reports.

#### `admin.resolveReport`
Resolve a report.

#### `admin.dmcaRequests`
List DMCA requests.

#### `admin.processDmca`
Process DMCA request.

#### `admin.featureFlags`
Get feature flags.

#### `admin.updateFeatureFlag`
Toggle feature flags.

#### `admin.auditLogs`
View audit logs.

---

## Error Handling

All errors follow tRPC error format:

```typescript
{
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'BAD_REQUEST' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL_SERVER_ERROR';
  message: string;
  data?: {
    zodError?: ZodError;  // Validation errors
  };
}
```

## Rate Limiting

- 100 requests per minute per IP
- Authenticated users: 200 requests per minute
- Certain endpoints have stricter limits (auth, payments)

## Pagination

All list endpoints support cursor-based pagination:

```typescript
// Request
{ cursor?: string, limit?: number }

// Response
{ items: T[], nextCursor?: string }
```

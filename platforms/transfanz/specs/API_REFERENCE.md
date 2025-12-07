# TransFanz API Reference

## Overview

TransFanz uses tRPC for type-safe APIs with REST fallback. All endpoints require authentication unless marked as public.

---

## Router Structure

```
appRouter
├── auth          # Authentication & sessions
├── user          # User profiles & settings
├── creator       # Creator-specific features
├── content       # Content management
├── tag           # Tag system
├── discovery     # Feed & explore
├── subscription  # Subscriptions & payments
├── wallet        # Earnings & payouts
├── messaging     # Direct messages
├── live          # Live streaming
├── safety        # Reports & blocks
├── admin         # Moderation (admin only)
└── ai            # AI-assisted features
```

---

## Auth Router

### `auth.register`
Create a new account.

**Input:**
```typescript
{
  email: string;           // Valid email
  password: string;        // Min 8 characters
  chosenName: string;      // 2-50 characters
  handle: string;          // 3-30 chars, alphanumeric + underscore
  pronouns?: PronounSet;
  customPronouns?: string;
  isCreator?: boolean;
  acceptedTerms: boolean;
  isOver18: boolean;
}
```

### `auth.login`
Authenticate user.

**Input:**
```typescript
{
  email: string;
  password: string;
  mfaCode?: string;
}
```

### `auth.oauthCallback`
Handle OAuth provider callback.

**Input:**
```typescript
{
  provider: 'google' | 'twitter' | 'discord';
  code: string;
  state: string;
}
```

### `auth.getSession`
Get current session (public).

### `auth.logout`
End current session.

### `auth.setupMFA`
Initialize MFA setup.

### `auth.verifyMFA`
Verify MFA code.

**Input:**
```typescript
{ code: string }
```

### `auth.requestPasswordReset`
Request password reset email.

**Input:**
```typescript
{ email: string }
```

### `auth.resetPassword`
Reset password with token.

**Input:**
```typescript
{
  token: string;
  newPassword: string;
}
```

---

## User Router

### `user.getProfile`
Get user profile by handle (public).

**Input:**
```typescript
{ handle: string }
```

### `user.getMyProfile`
Get authenticated user's profile.

### `user.updateProfile`
Update profile information.

**Input:**
```typescript
{
  chosenName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}
```

### `user.updateIdentity`
Update gender identity and pronouns.

**Input:**
```typescript
{
  pronouns?: PronounSet;
  customPronouns?: string;
  showPronouns?: boolean;
  genderIdentities?: GenderIdentity[];
  customGenderIdentity?: string;
  showGenderIdentity?: boolean;
}
```

### `user.updateChosenName`
Change chosen name with history tracking.

**Input:**
```typescript
{
  newChosenName: string;
  updatePastContent?: boolean;  // Default: true
  reason?: string;
}
```

### `user.getBoundarySettings`
Get safety/boundary settings.

### `user.updateBoundarySettings`
Update safety settings.

**Input:**
```typescript
{
  messageFilterLevel?: MessageFilterLevel;
  blockedTerms?: string[];
  autoBlockSlurs?: boolean;
  showPreTransitionContent?: boolean;
  preTransitionDisplayName?: string;
  allowDmsFrom?: 'everyone' | 'subscribers' | 'none';
  hideFromSearch?: boolean;
  blockedRegions?: string[];
  requireMessageApproval?: boolean;
  autoHideNewComments?: boolean;
}
```

### `user.updateFanPreferences`
Update discovery preferences.

**Input:**
```typescript
{
  preferredIdentities?: GenderIdentity[];
  preferredExpressions?: ExpressionStyle[];
  preferredVibes?: string[];
  preferredContentStyles?: string[];
}
```

### `user.deleteAccount`
Delete account.

**Input:**
```typescript
{
  password: string;
  reason?: string;
  exportData?: boolean;
}
```

### `user.exportData`
Request data export.

---

## Creator Router

### `creator.getCreatorProfile`
Get creator profile (public).

**Input:**
```typescript
{ handle: string }
```

### `creator.updateCreatorProfile`
Update creator-specific settings.

**Input:**
```typescript
{
  personaArchetype?: PersonaArchetype;
  expressionStyles?: ExpressionStyle[];
  transitionJourney?: TransitionJourneyTag[];
  subscriptionPrice?: number;  // 0-100
  acceptsTips?: boolean;
  minimumTip?: number;
}
```

### `creator.completeOnboarding`
Complete onboarding step.

**Input:**
```typescript
{
  step: 'profile' | 'identity' | 'pricing' | 'verification';
  data: Record<string, unknown>;
}
```

### `creator.submitVerification`
Submit KYC documents.

**Input:**
```typescript
{
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: Date;
  nationality: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idDocumentUrl: string;
  selfieUrl: string;
}
```

### `creator.getDashboardStats`
Get creator dashboard statistics.

**Input:**
```typescript
{
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}
```

### `creator.getEarningsBreakdown`
Get detailed earnings.

**Input:**
```typescript
{
  startDate: Date;
  endDate: Date;
}
```

### `creator.getTopFans`
Get top supporters.

**Input:**
```typescript
{
  limit?: number;  // 1-100, default 10
}
```

### `creator.getContentPerformance`
Get content analytics.

**Input:**
```typescript
{
  limit?: number;  // 1-50, default 10
  sortBy: 'views' | 'likes' | 'earnings' | 'recent';
}
```

### `creator.getTagPerformance`
Get tag engagement analytics.

### `creator.getPricingTiers`
Get subscription tiers.

### `creator.upsertPricingTier`
Create or update pricing tier.

**Input:**
```typescript
{
  tier: SubscriptionTier;
  name: string;
  price: number;
  description?: string;
  benefits: string[];
}
```

---

## Content Router

### `content.create`
Create new content.

**Input:**
```typescript
{
  type: ContentType;
  title?: string;
  caption?: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
  visibility: ContentVisibility;
  price?: number;
  tagIds: string[];
  scheduledFor?: Date;
}
```

### `content.getById`
Get content by ID (public, respects visibility).

**Input:**
```typescript
{ id: string }
```

### `content.getByCreator`
Get creator's content.

**Input:**
```typescript
{
  creatorHandle: string;
  cursor?: string;
  limit?: number;
  visibility?: ContentVisibility;
}
```

### `content.update`
Update content.

**Input:**
```typescript
{
  id: string;
  title?: string;
  caption?: string;
  visibility?: ContentVisibility;
  price?: number;
  tagIds?: string[];
}
```

### `content.delete`
Delete content.

**Input:**
```typescript
{ id: string }
```

### `content.like` / `content.unlike`
Like/unlike content.

**Input:**
```typescript
{ contentId: string }
```

### `content.getComments`
Get comments on content.

**Input:**
```typescript
{
  contentId: string;
  cursor?: string;
  limit?: number;
}
```

### `content.addComment`
Add comment.

**Input:**
```typescript
{
  contentId: string;
  text: string;  // 1-500 chars
}
```

### `content.deleteComment`
Delete comment.

**Input:**
```typescript
{ commentId: string }
```

### `content.purchase`
Purchase PPV content.

**Input:**
```typescript
{
  contentId: string;
  paymentMethodId: string;
}
```

### `content.getUploadUrl`
Get presigned upload URL.

**Input:**
```typescript
{
  filename: string;
  contentType: string;
  size: number;
}
```

---

## Tag Router

### `tag.getAll`
Get all tags (public).

**Input:**
```typescript
{
  category?: TagCategory;
}
```

### `tag.getPopular`
Get popular tags (public).

**Input:**
```typescript
{
  category?: TagCategory;
  limit?: number;
}
```

### `tag.search`
Search tags (public).

**Input:**
```typescript
{
  query: string;
  category?: TagCategory;
}
```

### `tag.getMyTags`
Get creator's tags.

### `tag.updateMyTags`
Update creator's tags.

**Input:**
```typescript
{
  tagIds: string[];
  primaryTagId?: string;
}
```

---

## Discovery Router

### `discovery.getFeed`
Get personalized feed.

**Input:**
```typescript
{
  cursor?: string;
  limit?: number;
}
```

### `discovery.explore`
Explore creators (public).

**Input:**
```typescript
{
  filters?: {
    genderIdentities?: GenderIdentity[];
    pronouns?: PronounSet[];
    expressionStyles?: ExpressionStyle[];
    vibes?: string[];
    contentStyles?: string[];
  };
  sortBy?: 'trending' | 'new' | 'popular' | 'recommended';
  cursor?: string;
  limit?: number;
}
```

### `discovery.getCollections`
Get curated collections (public).

### `discovery.getCollectionCreators`
Get creators in collection (public).

**Input:**
```typescript
{
  collectionId: string;
  cursor?: string;
  limit?: number;
}
```

### `discovery.search`
Search creators/content (public).

**Input:**
```typescript
{
  query: string;
  type?: 'creators' | 'content' | 'tags' | 'all';
  cursor?: string;
  limit?: number;
}
```

### `discovery.getRecommendedCreators`
Get personalized recommendations.

**Input:**
```typescript
{
  limit?: number;
}
```

### `discovery.getRecommendationReason`
Get explanation for recommendation.

**Input:**
```typescript
{ creatorId: string }
```

### `discovery.getFeaturedCreators`
Get featured creators (public).

### `discovery.getNewCreators`
Get new creators (public).

---

## Subscription Router

### `subscription.subscribe`
Subscribe to creator.

**Input:**
```typescript
{
  creatorId: string;
  tier?: SubscriptionTier;
  paymentMethodId: string;
}
```

### `subscription.cancel`
Cancel subscription.

**Input:**
```typescript
{
  subscriptionId: string;
  reason?: string;
}
```

### `subscription.getMySubscriptions`
Get user's subscriptions.

### `subscription.getMySubscribers`
Get creator's subscribers.

### `subscription.checkStatus`
Check subscription status.

**Input:**
```typescript
{ creatorId: string }
```

### `subscription.sendTip`
Send tip to creator.

**Input:**
```typescript
{
  creatorId: string;
  amount: number;
  message?: string;
  paymentMethodId: string;
}
```

---

## Wallet Router

### `wallet.getWallet`
Get wallet balance and info.

### `wallet.getTransactions`
Get transaction history.

**Input:**
```typescript
{
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  cursor?: string;
  limit?: number;
}
```

### `wallet.setupPayout`
Configure payout settings.

**Input:**
```typescript
{
  payoutMethod: 'bank_transfer' | 'paypal';
  payoutLegalName: string;
}
```

### `wallet.connectStripe`
Connect Stripe account.

### `wallet.requestPayout`
Request payout.

**Input:**
```typescript
{
  amount: number;  // Min 20
}
```

### `wallet.getPaymentMethods`
Get saved payment methods.

### `wallet.addPaymentMethod`
Add payment method.

### `wallet.removePaymentMethod`
Remove payment method.

---

## Messaging Router

### `messaging.getConversations`
Get conversations list.

### `messaging.getConversation`
Get single conversation.

### `messaging.getMessages`
Get messages in conversation.

### `messaging.sendMessage`
Send message.

**Input:**
```typescript
{
  recipientId: string;
  text?: string;
  mediaUrls?: string[];
  isPPV?: boolean;
  ppvPrice?: number;
}
```

### `messaging.unlockMessage`
Unlock PPV message.

### `messaging.markAsRead`
Mark conversation as read.

### `messaging.getUnreadCount`
Get unread message count.

---

## Live Router

### `live.schedule`
Schedule live stream.

### `live.getStreamKey`
Get stream key.

### `live.start`
Start stream.

### `live.end`
End stream.

### `live.getLive`
Get live streams (public).

### `live.getUpcoming`
Get upcoming streams (public).

### `live.join`
Join stream.

### `live.purchaseTicket`
Purchase stream ticket.

### `live.tipDuringStream`
Tip during stream.

---

## Safety Router

### `safety.submitReport`
Submit report.

**Input:**
```typescript
{
  category: ReportCategory;
  reportedUserId?: string;
  reportedContentId?: string;
  reportedMessageId?: string;
  description: string;
  evidence?: string[];
}
```

### `safety.blockUser`
Block user.

### `safety.unblockUser`
Unblock user.

### `safety.getBlockedUsers`
Get blocked users list.

### `safety.blockAndReport`
Block and report in one action.

**Input:**
```typescript
{
  userId: string;
  category: ReportCategory;
  description?: string;
}
```

### `safety.submitDMCA`
Submit DMCA claim (public).

---

## Admin Router

(Requires admin role)

### `admin.getModerationQueue`
Get moderation queue.

### `admin.resolveReport`
Resolve report.

### `admin.warnUser`
Issue warning.

### `admin.timeoutUser`
Timeout user.

### `admin.banUser`
Ban user.

### `admin.removeContent`
Remove content.

### `admin.reviewVerification`
Review KYC submission.

### `admin.getDashboardStats`
Get admin dashboard stats.

### `admin.getSafetyMetrics`
Get safety metrics.

---

## AI Router

### `ai.suggestBio`
Get bio suggestions.

**Input:**
```typescript
{
  currentBio?: string;
  genderIdentities?: GenderIdentity[];
  expressionStyles?: ExpressionStyle[];
  personaArchetype?: PersonaArchetype;
  tone?: 'confident' | 'soft' | 'playful' | 'professional';
}
```

### `ai.suggestCaption`
Get caption suggestions.

**Input:**
```typescript
{
  contentType: ContentType;
  tags: string[];
  mood?: string;
}
```

### `ai.suggestContentIdeas`
Get content ideas.

### `ai.suggestTags`
Get tag suggestions.

### `ai.checkContent`
Check content safety (internal).

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Not authorized |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `RATE_LIMITED` | Too many requests |
| `PAYMENT_FAILED` | Payment error |
| `CONTENT_BLOCKED` | Content violates policies |

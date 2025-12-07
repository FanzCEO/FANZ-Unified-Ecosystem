// Core types for TabooFanz

export type UserRole = 'FAN' | 'CREATOR' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export type Archetype =
  | 'THE_SIREN'
  | 'THE_PHANTOM'
  | 'THE_REBEL'
  | 'THE_DOLL'
  | 'THE_BEAST'
  | 'THE_ENIGMA'
  | 'THE_ORACLE'
  | 'THE_SWITCH'
  | 'THE_SOVEREIGN'
  | 'CUSTOM';

export type PowerEnergy =
  | 'DOMINANT'
  | 'SUBMISSIVE'
  | 'SWITCH'
  | 'BRAT'
  | 'PRIMAL'
  | 'CARETAKER';

export type ContentType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'GALLERY';
export type ContentVisibility = 'PUBLIC' | 'SUBSCRIBERS_ONLY' | 'PPV' | 'CUSTOM_LIST' | 'PRIVATE';
export type ContentStatus = 'DRAFT' | 'PROCESSING' | 'PUBLISHED' | 'ARCHIVED' | 'REMOVED' | 'FLAGGED';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
export type TransactionType = 'SUBSCRIPTION' | 'TIP' | 'PPV_UNLOCK' | 'MESSAGE_UNLOCK' | 'PAYOUT' | 'REFUND' | 'CHARGEBACK' | 'ADJUSTMENT';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DISPUTED';

export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export type ReportType = 'CONTENT' | 'PROFILE' | 'MESSAGE' | 'COMMENT' | 'LIVE_STREAM';
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
export type ReportCategory = 'SPAM' | 'HARASSMENT' | 'UNDERAGE' | 'NON_CONSENSUAL' | 'IMPERSONATION' | 'COPYRIGHT' | 'ILLEGAL' | 'OTHER';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// User types
export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface CreatorProfilePublic {
  archetype: Archetype;
  customArchetypeName: string | null;
  tagline: string | null;
  subscriberCount: number;
  contentCount: number;
  isVerified: boolean;
  powerEnergy: PowerEnergy | null;
}

// Content types
export interface ContentPreview {
  id: string;
  type: ContentType;
  visibility: ContentVisibility;
  caption: string | null;
  price: number | null;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  publishedAt: Date;
  creator: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    archetype: Archetype;
    isVerified: boolean;
  };
  tags: Array<{
    slug: string;
    name: string;
  }>;
  hasAccess: boolean;
  isLiked: boolean;
}

// Tag types
export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  usageCount: number;
  group: {
    slug: string;
    name: string;
  };
}

export interface TagGroup {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: Tag[];
}

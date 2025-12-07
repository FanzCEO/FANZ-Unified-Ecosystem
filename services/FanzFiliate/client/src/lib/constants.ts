export const USER_ROLES = {
  AFFILIATE: 'affiliate' as const,
  ADVERTISER: 'advertiser' as const,
  ADMIN: 'admin' as const,
} as const;

export const KYC_STATUS = {
  UNVERIFIED: 'unverified' as const,
  INITIATED: 'initiated' as const,
  IN_REVIEW: 'in_review' as const,
  APPROVED: 'approved' as const,
  FAILED: 'failed' as const,
} as const;

export const OFFER_STATUS = {
  DRAFT: 'draft' as const,
  SUBMITTED: 'submitted' as const,
  IN_REVIEW: 'in_review' as const,
  APPROVED: 'approved' as const,
  PAUSED: 'paused' as const,
  ENDED: 'ended' as const,
  BANNED: 'banned' as const,
} as const;

export const CONVERSION_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

export const PAYOUT_PROVIDERS = {
  PAXUM: 'paxum' as const,
  COSMOPAYMENT: 'cosmopayment' as const,
  BITSAFE: 'bitsafe' as const,
  USDT: 'usdt' as const,
  WISE: 'wise' as const,
  PAYONEER: 'payoneer' as const,
} as const;

export const TRAFFIC_TYPES = [
  'email',
  'push',
  'native',
  'search',
  'social',
  'adult',
  'tube',
  'cam',
  'ppv',
  'ugc',
] as const;

export const CONVERSION_TYPES = [
  'CPA',
  'CPS', 
  'CPL',
  'RevShare',
  'Hybrid',
] as const;

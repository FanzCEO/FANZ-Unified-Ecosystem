// TabooFanz Constants

// Platform fees
export const PLATFORM_FEE_RATE = 0.20; // 20% platform fee
export const CREATOR_EARNINGS_RATE = 0.80; // 80% to creators

// Subscription limits
export const MIN_SUBSCRIPTION_PRICE = 0;
export const MAX_SUBSCRIPTION_PRICE = 500;
export const MIN_TIP_AMOUNT = 1;
export const MAX_TIP_AMOUNT = 1000;
export const MIN_PPV_PRICE = 1;
export const MAX_PPV_PRICE = 500;
export const MIN_PAYOUT_AMOUNT = 20;

// Content limits
export const MAX_CAPTION_LENGTH = 2000;
export const MAX_BIO_LENGTH = 500;
export const MAX_TAGLINE_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 1000;

// Media limits
export const MAX_UPLOAD_SIZE_MB = 500;
export const MAX_VIDEO_DURATION_SECONDS = 3600; // 1 hour
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// Session/Auth
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const SESSION_EXPIRY_DAYS = 7;
export const MAX_SESSIONS_PER_USER = 10;

// Rate limits
export const RATE_LIMIT_REQUESTS = 100;
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Archetypes with metadata
export const ARCHETYPES = {
  THE_SIREN: {
    name: 'The Siren',
    description: 'Alluring and enchanting. You draw them in with your voice, your look, your presence.',
    color: 'pink',
    icon: '🧜',
  },
  THE_PHANTOM: {
    name: 'The Phantom',
    description: 'Mysterious and elusive. You reveal only what you choose, when you choose.',
    color: 'slate',
    icon: '👻',
  },
  THE_REBEL: {
    name: 'The Rebel',
    description: 'Defiant and fierce. You break the rules and look good doing it.',
    color: 'red',
    icon: '🔥',
  },
  THE_DOLL: {
    name: 'The Doll',
    description: 'Perfect and pristine. Every detail is intentional, every pose is art.',
    color: 'rose',
    icon: '🎎',
  },
  THE_BEAST: {
    name: 'The Beast',
    description: 'Primal and powerful. You embrace your wild, untamed nature.',
    color: 'amber',
    icon: '🐺',
  },
  THE_ENIGMA: {
    name: 'The Enigma',
    description: 'Complex and fascinating. You cannot be defined or easily understood.',
    color: 'purple',
    icon: '🔮',
  },
  THE_ORACLE: {
    name: 'The Oracle',
    description: 'Wise and knowing. You see what others cannot, you guide with intention.',
    color: 'indigo',
    icon: '👁️',
  },
  THE_SWITCH: {
    name: 'The Switch',
    description: 'Fluid and adaptable. You contain multitudes and move between roles with ease.',
    color: 'cyan',
    icon: '⚡',
  },
  THE_SOVEREIGN: {
    name: 'The Sovereign',
    description: 'Commanding and regal. You rule your domain with authority and grace.',
    color: 'yellow',
    icon: '👑',
  },
  CUSTOM: {
    name: 'Custom',
    description: 'Define your own archetype and write your own story.',
    color: 'gray',
    icon: '✨',
  },
} as const;

// Power energies with metadata
export const POWER_ENERGIES = {
  DOMINANT: {
    name: 'Dominant',
    description: 'You lead, you guide, you take control.',
    icon: '🔱',
  },
  SUBMISSIVE: {
    name: 'Submissive',
    description: 'You follow, you serve, you surrender.',
    icon: '🔗',
  },
  SWITCH: {
    name: 'Switch',
    description: 'You flow between roles as the moment calls.',
    icon: '🔄',
  },
  BRAT: {
    name: 'Brat',
    description: 'You push back, you tease, you challenge.',
    icon: '😜',
  },
  PRIMAL: {
    name: 'Primal',
    description: 'You embrace instinct, raw and unfiltered.',
    icon: '🐾',
  },
  CARETAKER: {
    name: 'Caretaker',
    description: 'You nurture, you protect, you guide with care.',
    icon: '💝',
  },
} as const;

// Tag groups
export const TAG_GROUPS = [
  'identity-subculture',
  'aesthetic-fashion',
  'vibe-archetype',
  'power-energy',
  'setting-backdrop',
  'lifestyle-roleplay',
] as const;

// Verification statuses
export const VERIFICATION_STATUSES = {
  NOT_STARTED: 'Not Started',
  PENDING: 'Pending Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
} as const;

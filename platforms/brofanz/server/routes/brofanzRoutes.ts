/**
 * BroFanz API Routes
 * Main API endpoints for the BroFanz platform
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verificationRouter, verificationWebhookHandler } from '../services/verifyMyService';

export const brofanzRouter = Router();

// ============================================================================
// HEALTH & INFO
// ============================================================================

brofanzRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'BroFanz',
    slogan: 'Where the bros come to run the creator economy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

brofanzRouter.get('/info', (_req: Request, res: Response) => {
  res.json({
    platform: 'BroFanz',
    slogan: 'Where the bros come to run the creator economy',
    tagline: 'The home for gym bros, jocks, gamers, athletes, and everyday dudes',
    features: [
      'Creator subscriptions',
      'Live streaming',
      'Direct messaging',
      'PPV content',
      'Tips & donations',
      'Age verification via VerifyMy'
    ],
    support: {
      email: 'support@brofanz.com',
      discord: 'https://discord.gg/brofanz'
    }
  });
});

// ============================================================================
// TAG SYSTEM
// ============================================================================

// BroFanz Tag Categories - matching the database schema
const TAG_CATEGORIES = {
  identity: {
    name: 'Identity',
    description: 'Self-chosen identity tags',
    tags: [
      { id: 'masc', name: 'Masc', emoji: '💪' },
      { id: 'bro', name: 'Bro', emoji: '🤙' },
      { id: 'jock', name: 'Jock', emoji: '🏈' },
      { id: 'gym_guy', name: 'Gym Guy', emoji: '🏋️' },
      { id: 'blue_collar', name: 'Blue-Collar Guy', emoji: '🔧' },
      { id: 'dl_bro', name: 'DL Bro', emoji: '🤫' },
      { id: 'trade', name: 'Trade', emoji: '🔥' },
      { id: 'skater', name: 'Skater Guy', emoji: '🛹' },
      { id: 'gamer', name: 'Gamer Guy', emoji: '🎮' },
      { id: 'athlete', name: 'Athlete', emoji: '⚽' },
      { id: 'queer_masc', name: 'Queer Masc', emoji: '🏳️‍🌈' },
      { id: 'bi_bro', name: 'Bi Bro', emoji: '💜' }
    ]
  },
  vibe: {
    name: 'Vibes',
    description: 'Personality and energy vibes',
    tags: [
      { id: 'chill_bro', name: 'Chill Bro', emoji: '😎' },
      { id: 'locker_room_energy', name: 'Locker Room Energy', emoji: '🚿' },
      { id: 'barbershop_vibes', name: 'Barbershop Vibes', emoji: '💈' },
      { id: 'boyfriend_bro', name: 'Boyfriend Bro', emoji: '❤️' },
      { id: 'rough_edges', name: 'Rough Around the Edges', emoji: '🔥' },
      { id: 'goofy_bro', name: 'Goofy Bro', emoji: '😜' },
      { id: 'alpha_energy', name: 'Alpha Energy', emoji: '👑' },
      { id: 'lowkey_cutie', name: 'Low-Key Cutie', emoji: '🥰' },
      { id: 'college_bro', name: 'College Bro', emoji: '🎓' },
      { id: 'street_king', name: 'Street King', emoji: '👟' },
      { id: 'one_of_guys', name: 'Just One of the Guys', emoji: '🤝' },
      { id: 'playfully_cocky', name: 'Playfully Cocky', emoji: '😏' }
    ]
  },
  style: {
    name: 'Style',
    description: 'Fashion and look tags',
    tags: [
      { id: 'streetwear', name: 'Streetwear', emoji: '👕' },
      { id: 'athleisure', name: 'Athleisure', emoji: '🩳' },
      { id: 'gym_fits', name: 'Gym Fits', emoji: '🏋️' },
      { id: 'denim_boots', name: 'Denim & Work Boots', emoji: '👖' },
      { id: 'snapback', name: 'Snapback Vibes', emoji: '🧢' },
      { id: 'backpack_boy', name: 'Backpack Boy', emoji: '🎒' },
      { id: 'inked', name: 'Inked/Tattooed', emoji: '🖋️' },
      { id: 'beard_bro', name: 'Beard Bro', emoji: '🧔' },
      { id: 'clean_cut', name: 'Clean-Cut', emoji: '✨' },
      { id: 'rugged_clean', name: 'Rugged Clean', emoji: '🪵' }
    ]
  },
  lifestyle: {
    name: 'Lifestyle',
    description: 'Interests and activities',
    tags: [
      { id: 'fitness', name: 'Fitness', emoji: '💪' },
      { id: 'gaming', name: 'Gaming', emoji: '🎮' },
      { id: 'cars_trucks', name: 'Cars & Trucks', emoji: '🚗' },
      { id: 'sports', name: 'Sports', emoji: '🏀' },
      { id: 'college_life', name: 'College Life', emoji: '📚' },
      { id: 'bar_nights', name: 'Bar Nights', emoji: '🍺' },
      { id: 'outdoor', name: 'Outdoor/Woods', emoji: '🌲' },
      { id: 'worksite', name: 'Worksite Energy', emoji: '🏗️' },
      { id: 'sneaker_culture', name: 'Sneaker Culture', emoji: '👟' },
      { id: 'chill_streaming', name: 'Chill Streaming', emoji: '📺' }
    ]
  },
  body: {
    name: 'Body & Look',
    description: 'Physical appearance (non-explicit)',
    tags: [
      { id: 'dad_bod', name: 'Dad Bod', emoji: '🐻' },
      { id: 'lean_fit', name: 'Lean Fit', emoji: '🏃' },
      { id: 'muscular', name: 'Muscular', emoji: '💪' },
      { id: 'tall_guy', name: 'Tall Guy', emoji: '📏' },
      { id: 'beard_energy', name: 'Beard Energy', emoji: '🧔' },
      { id: 'fresh_fade', name: 'Fresh Fade', emoji: '💇' },
      { id: 'rough_scruff', name: 'Rough Scruff', emoji: '🪒' }
    ]
  },
  persona: {
    name: 'Character/Persona',
    description: 'Creator personas and characters',
    tags: [
      { id: 'the_wingman', name: 'The Wingman', emoji: '🤝' },
      { id: 'the_mvp', name: 'The MVP', emoji: '🏆' },
      { id: 'the_gym_captain', name: 'The Gym Captain', emoji: '🏋️' },
      { id: 'the_skater_boy', name: 'The Skater Boy', emoji: '🛹' },
      { id: 'the_late_night_gamer', name: 'The Late-Night Gamer', emoji: '🎮' },
      { id: 'the_outlaw_bro', name: 'The Outlaw Bro', emoji: '🔥' },
      { id: 'the_quiet_one', name: 'The Quiet One', emoji: '🤫' },
      { id: 'the_alpha_buddy', name: 'The Alpha Buddy', emoji: '👑' },
      { id: 'the_adventurer', name: 'The Adventurer', emoji: '🏔️' }
    ]
  }
};

// Get all tag categories
brofanzRouter.get('/tags', (_req: Request, res: Response) => {
  res.json({
    success: true,
    categories: TAG_CATEGORIES
  });
});

// Get tags by category
brofanzRouter.get('/tags/:category', (req: Request, res: Response) => {
  const { category } = req.params;
  const categoryData = TAG_CATEGORIES[category as keyof typeof TAG_CATEGORIES];

  if (!categoryData) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }

  res.json({
    success: true,
    category: categoryData
  });
});

// ============================================================================
// CREATORS
// ============================================================================

// Get featured creators
brofanzRouter.get('/creators/featured', async (_req: Request, res: Response) => {
  // TODO: Replace with actual database query
  const featuredCreators = [
    {
      id: '1',
      username: 'gym_chad',
      displayName: 'Chad Martinez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      persona: 'the_gym_captain',
      tags: ['gym_guy', 'fitness', 'masc'],
      subscriberCount: 12500,
      isVerified: true,
      isLive: false
    }
  ];

  res.json({
    success: true,
    creators: featuredCreators
  });
});

// Get creator by username
brofanzRouter.get('/creators/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  // TODO: Replace with actual database query
  res.json({
    success: true,
    creator: {
      username,
      displayName: username,
      bio: 'BroFanz creator',
      subscriberCount: 0,
      postCount: 0,
      isVerified: false
    }
  });
});

// Search creators
brofanzRouter.get('/creators/search', async (req: Request, res: Response) => {
  const { q, tags, sort, page = 1, limit = 20 } = req.query;

  // TODO: Implement actual search with filters
  res.json({
    success: true,
    results: [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: 0,
      totalPages: 0
    }
  });
});

// ============================================================================
// COLLECTIONS
// ============================================================================

// Get featured collections
brofanzRouter.get('/collections/featured', (_req: Request, res: Response) => {
  const collections = [
    { id: 'mvps', name: 'MVPs of the Week', icon: 'trophy', count: 24 },
    { id: 'gym_bros', name: 'Gym Bros', icon: 'dumbbell', count: 156 },
    { id: 'gamers', name: 'Gamer Night', icon: 'gamepad', count: 89 },
    { id: 'street_kings', name: 'Street Kings', icon: 'sneaker', count: 67 },
    { id: 'bearded_kings', name: 'Bearded Kings', icon: 'beard', count: 45 },
    { id: 'dl_chill', name: 'DL & Chill', icon: 'lock', count: 32 },
    { id: 'college_bros', name: 'College Bros', icon: 'graduation', count: 78 }
  ];

  res.json({
    success: true,
    collections
  });
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

// Get subscription plans for a creator
brofanzRouter.get('/subscriptions/:creatorId/plans', async (req: Request, res: Response) => {
  const { creatorId } = req.params;

  // TODO: Replace with actual database query
  res.json({
    success: true,
    plans: [
      {
        id: 'monthly',
        name: 'Monthly',
        price: 9.99,
        interval: 'month',
        features: ['Access to all posts', 'Direct messaging', 'Exclusive content']
      },
      {
        id: 'quarterly',
        name: 'Quarterly',
        price: 24.99,
        interval: 'quarter',
        savings: '17%',
        features: ['Access to all posts', 'Direct messaging', 'Exclusive content', 'Priority support']
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: 89.99,
        interval: 'year',
        savings: '25%',
        features: ['Access to all posts', 'Direct messaging', 'Exclusive content', 'Priority support', 'Special badges']
      }
    ]
  });
});

// Create subscription (protected route)
brofanzRouter.post('/subscriptions', async (req: Request, res: Response) => {
  const { creatorId, planId, paymentMethod } = req.body;

  // TODO: Implement subscription creation
  res.json({
    success: true,
    message: 'Subscription created',
    subscriptionId: 'sub_' + Date.now()
  });
});

// ============================================================================
// VERIFICATION (VerifyMy Integration)
// ============================================================================

// Mount verification routes
brofanzRouter.use('/verify', verificationRouter);

// Webhook handlers
brofanzRouter.post('/webhooks/verifymyage', verificationWebhookHandler);
brofanzRouter.post('/webhooks/verifymyid', verificationWebhookHandler);

// ============================================================================
// CREATOR STUDIO
// ============================================================================

// Get creator dashboard stats
brofanzRouter.get('/studio/dashboard', async (req: Request, res: Response) => {
  // TODO: Get stats from database based on authenticated user

  res.json({
    success: true,
    stats: {
      totalEarnings: 1250.00,
      monthlyEarnings: 450.00,
      subscriberCount: 125,
      newSubscribers: 12,
      totalViews: 15600,
      engagementRate: 8.5,
      topPosts: [],
      recentActivity: []
    }
  });
});

// Get creator earnings breakdown
brofanzRouter.get('/studio/earnings', async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;

  res.json({
    success: true,
    earnings: {
      subscriptions: 350.00,
      tips: 75.00,
      ppv: 25.00,
      messages: 0,
      total: 450.00,
      pending: 450.00,
      available: 0
    },
    breakdown: []
  });
});

// Get creator analytics
brofanzRouter.get('/studio/analytics', async (req: Request, res: Response) => {
  const { period = '7d' } = req.query;

  res.json({
    success: true,
    analytics: {
      views: { total: 5600, change: 12 },
      subscribers: { total: 125, change: 8 },
      engagement: { rate: 8.5, change: 2 },
      revenue: { total: 450, change: 15 }
    },
    charts: {
      views: [],
      revenue: [],
      subscribers: []
    }
  });
});

// ============================================================================
// SAFETY & PRIVACY
// ============================================================================

// Get privacy settings
brofanzRouter.get('/settings/privacy', async (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: {
      showOnlineStatus: true,
      allowMessagesFrom: 'everyone', // 'everyone', 'subscribers', 'none'
      showLocation: false,
      regionBlocks: [],
      blockedUsers: [],
      hiddenWords: []
    }
  });
});

// Update privacy settings
brofanzRouter.put('/settings/privacy', async (req: Request, res: Response) => {
  const settings = req.body;

  // TODO: Update settings in database
  res.json({
    success: true,
    message: 'Privacy settings updated'
  });
});

// Block regions (for DL/privacy)
brofanzRouter.post('/settings/privacy/region-block', async (req: Request, res: Response) => {
  const { country, region, city } = req.body;

  res.json({
    success: true,
    message: 'Region blocked'
  });
});

// ============================================================================
// MESSAGING
// ============================================================================

// Get conversations
brofanzRouter.get('/messages/conversations', async (req: Request, res: Response) => {
  res.json({
    success: true,
    conversations: []
  });
});

// Get messages in conversation
brofanzRouter.get('/messages/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  res.json({
    success: true,
    messages: []
  });
});

// Send message
brofanzRouter.post('/messages/:conversationId', async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { content, mediaUrls, isPPV, ppvPrice } = req.body;

  res.json({
    success: true,
    message: {
      id: 'msg_' + Date.now(),
      conversationId,
      content,
      createdAt: new Date().toISOString()
    }
  });
});

export default brofanzRouter;

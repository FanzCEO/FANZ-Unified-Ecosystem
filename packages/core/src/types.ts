import { z } from 'zod';

// Platform configuration schema
export const PlatformConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),

  // Theme - UNIQUE per platform
  theme: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string().optional(),
    background: z.string(),
    foreground: z.string(),
    card: z.string(),
    cardForeground: z.string(),
    muted: z.string().optional(),
    mutedForeground: z.string().optional(),
    border: z.string().optional(),
    // Custom brand colors (like df-cyan, gf-pink, etc.)
    brand: z.record(z.string()).optional(),
  }),

  // Assets - UNIQUE per platform
  assets: z.object({
    logo: z.string(),
    favicon: z.string().optional(),
    ogImage: z.string().optional(),
  }),

  // Features - can be toggled per platform
  features: z.object({
    liveStreaming: z.boolean().default(true),
    messaging: z.boolean().default(true),
    tips: z.boolean().default(true),
    subscriptions: z.boolean().default(true),
    ppv: z.boolean().default(true),
    stories: z.boolean().default(true),
    shop: z.boolean().default(false),
  }).optional(),

  // Server config
  server: z.object({
    port: z.number(),
    apiPrefix: z.string().default('/api'),
  }).optional(),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

// User types (shared across all platforms)
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: 'user' | 'creator' | 'admin';
  platformId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Content types (shared)
export interface Content {
  id: string;
  creatorId: string;
  type: 'post' | 'image' | 'video' | 'story';
  title?: string;
  description?: string;
  mediaUrls: string[];
  isPPV: boolean;
  price?: number;
  platformId: string;
  createdAt: Date;
}

// Subscription types (shared)
export interface Subscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string;
  status: 'active' | 'cancelled' | 'expired';
  platformId: string;
  startedAt: Date;
  expiresAt: Date;
}

// Transaction types (shared)
export interface Transaction {
  id: string;
  type: 'subscription' | 'tip' | 'ppv' | 'shop';
  amount: number;
  currency: string;
  senderId: string;
  recipientId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  platformId: string;
  createdAt: Date;
}

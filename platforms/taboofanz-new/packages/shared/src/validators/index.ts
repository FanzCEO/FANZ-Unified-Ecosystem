import { z } from 'zod';
import {
  MAX_CAPTION_LENGTH,
  MAX_BIO_LENGTH,
  MAX_TAGLINE_LENGTH,
  MAX_MESSAGE_LENGTH,
  MIN_SUBSCRIPTION_PRICE,
  MAX_SUBSCRIPTION_PRICE,
  MIN_TIP_AMOUNT,
  MAX_TIP_AMOUNT,
} from '../constants';

// User validators
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const displayNameSchema = z.string().min(1).max(50);

export const bioSchema = z.string().max(MAX_BIO_LENGTH);

// Content validators
export const captionSchema = z.string().max(MAX_CAPTION_LENGTH);

export const taglineSchema = z.string().max(MAX_TAGLINE_LENGTH);

export const messageSchema = z.string().min(1).max(MAX_MESSAGE_LENGTH);

// Payment validators
export const subscriptionPriceSchema = z
  .number()
  .min(MIN_SUBSCRIPTION_PRICE)
  .max(MAX_SUBSCRIPTION_PRICE);

export const tipAmountSchema = z.number().min(MIN_TIP_AMOUNT).max(MAX_TIP_AMOUNT);

// Archetype validators
export const archetypeSchema = z.enum([
  'THE_SIREN',
  'THE_PHANTOM',
  'THE_REBEL',
  'THE_DOLL',
  'THE_BEAST',
  'THE_ENIGMA',
  'THE_ORACLE',
  'THE_SWITCH',
  'THE_SOVEREIGN',
  'CUSTOM',
]);

export const powerEnergySchema = z.enum([
  'DOMINANT',
  'SUBMISSIVE',
  'SWITCH',
  'BRAT',
  'PRIMAL',
  'CARETAKER',
]);

// Content visibility
export const contentVisibilitySchema = z.enum([
  'PUBLIC',
  'SUBSCRIBERS_ONLY',
  'PPV',
  'CUSTOM_LIST',
  'PRIVATE',
]);

// Report category
export const reportCategorySchema = z.enum([
  'SPAM',
  'HARASSMENT',
  'UNDERAGE',
  'NON_CONSENSUAL',
  'IMPERSONATION',
  'COPYRIGHT',
  'ILLEGAL',
  'OTHER',
]);

// Form schemas
export const registerFormSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: displayNameSchema.optional(),
  role: z.enum(['FAN', 'CREATOR']).default('FAN'),
});

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileFormSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema.optional(),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

export const creatorProfileFormSchema = z.object({
  archetype: archetypeSchema.optional(),
  customArchetypeName: z.string().max(50).optional(),
  archetypeDescription: z.string().max(500).optional(),
  powerEnergy: powerEnergySchema.optional().nullable(),
  tagline: taglineSchema.optional(),
  subscriptionPrice: subscriptionPriceSchema.optional(),
});

export const contentFormSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'GALLERY']),
  visibility: contentVisibilitySchema.default('SUBSCRIBERS_ONLY'),
  caption: captionSchema.optional(),
  price: z.number().min(0).max(500).optional(),
  tags: z.array(z.string()).default([]),
});

export const reportFormSchema = z.object({
  category: reportCategorySchema,
  description: z.string().min(10).max(1000),
  evidence: z.array(z.string().url()).optional(),
});

// Type exports
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileFormSchema>;
export type CreatorProfileFormData = z.infer<typeof creatorProfileFormSchema>;
export type ContentFormData = z.infer<typeof contentFormSchema>;
export type ReportFormData = z.infer<typeof reportFormSchema>;

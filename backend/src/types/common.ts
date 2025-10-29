/**
 * Common type definitions used across the application
 */

import { Request } from 'express';

// ============================================================================
// User Types
// ============================================================================

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'creator' | 'admin' | 'moderator';
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  accountStatus: 'active' | 'suspended' | 'banned' | 'pending_verification';
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  requestId: string;
  startTime: number;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'crypto' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  transactionType: 'subscription' | 'tip' | 'content_purchase' | 'payout';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  processorTransactionId?: string;
  feeAmount: number;
  netAmount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payoutMethod: string;
  processorPayoutId?: string;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Content Types
// ============================================================================

export interface Content {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'livestream';
  mediaUrl: string;
  thumbnailUrl?: string;
  price?: number;
  currency: string;
  isPremium: boolean;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  features: string[];
  isActive: boolean;
  trialPeriodDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'trial' | 'expired' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  changePercentage?: number;
  period: string;
  timestamp: Date;
}

export interface TimeSeriesData {
  period: Date;
  value: number;
  label?: string;
}

// ============================================================================
// Filters and Pagination
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
  type?: string;
  userId?: string;
  creatorId?: string;
  [key: string]: unknown;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// ============================================================================
// Compliance Types
// ============================================================================

export interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Dict<T = unknown> = Record<string, T>;
export type StringDict = Record<string, string>;
export type NumberDict = Record<string, number>;
export type AnyDict = Record<string, any>;

// Type guard functions
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

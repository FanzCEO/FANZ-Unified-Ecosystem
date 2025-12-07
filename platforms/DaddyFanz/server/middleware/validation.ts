import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { logger } from "../logger";

export const validate = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Validation error for ${req.method} ${req.originalUrl}: ${error.errors.map(e => e.message).join(', ')}`);

        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }

      logger.error(`Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred during validation",
      });
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// File upload validation
export const fileUploadSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0).optional(),
  isPremium: z.boolean().default(false),
});

// Profile update validation
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  subscriptionPrice: z.coerce.number().min(0).optional(),
});

// Message validation
export const messageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(1000),
  mediaUrl: z.string().url().optional(),
});

// Payment validation
export const payoutAccountSchema = z.object({
  provider: z.enum(["paxum", "epayservice", "wise", "crypto"]),
  accountRef: z.string().min(1).max(255),
  metadata: z.record(z.any()).optional(),
});

export const payoutRequestSchema = z.object({
  payoutAccountId: z.string().uuid(),
  amountCents: z.number().min(1000), // Minimum $10
  currency: z.string().length(3).default("USD"),
});

// Post validation
export const createPostSchema = z.object({
  text: z.string().max(5000).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video", "audio"]).optional(),
  mediaAssetId: z.string().uuid().optional(),
  isFree: z.boolean().default(false),
  creatorAllowsFree: z.boolean().default(false),
  creatorIsAgeVerified: z.boolean().default(false),
  requiresSubscription: z.boolean().default(true),
  requiresAgeVerification: z.boolean().default(true),
});

export const updatePostSchema = z.object({
  text: z.string().max(5000).optional(),
  isFree: z.boolean().optional(),
  requiresSubscription: z.boolean().optional(),
});

// Follow validation
export const creatorIdParamSchema = z.object({
  creatorId: z.string().min(1, "Creator ID is required"),
});

// Story validation
export const createStorySchema = z.object({
  mediaUrl: z.string().url("Invalid media URL"),
  mediaType: z.enum(["image", "video"]),
  mediaThumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  caption: z.string().max(500).optional(),
  isFree: z.boolean().default(false),
  requiresSubscription: z.boolean().default(true),
});

// Fan Level validation
export const addXPSchema = z.object({
  amount: z.number().min(1, "XP amount must be positive").max(1000, "Maximum 1000 XP per action"),
  reason: z.string().min(1).max(100),
});

// NFT validation schemas
export const deployNftContractSchema = z.object({
  blockchain: z.enum(["ethereum", "polygon", "solana", "binance"]),
  contractAddress: z.string().min(1),
  royaltyPercentage: z.number().min(0).max(50),
  metadata: z.record(z.any()).optional(),
});

export const mintNftSchema = z.object({
  contractId: z.string().uuid(),
  mediaId: z.string().uuid(),
  tokenId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const recordNftRoyaltySchema = z.object({
  contractId: z.string().uuid(),
  mintId: z.string().uuid(),
  royaltyAmount: z.string().min(1),
  buyerAddress: z.string().min(1),
  transactionHash: z.string().min(1),
  salePrice: z.string().min(1),
});

// Loan validation schemas
export const createLoanProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  minAmount: z.number().min(1),
  maxAmount: z.number().min(1),
  minTerm: z.number().min(1),
  maxTerm: z.number().min(1),
  interestRate: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
});

export const createLoanApplicationSchema = z.object({
  programId: z.string().uuid(),
  requestedAmount: z.number().min(1),
  requestedTerm: z.number().min(1),
  purpose: z.string().max(1000),
  revenueData: z.record(z.any()).optional(),
});

export const createLoanOfferSchema = z.object({
  applicationId: z.string().uuid(),
  offeredAmount: z.number().min(1),
  offeredTerm: z.number().min(1),
  interestRate: z.number().min(0).max(100),
  terms: z.string().max(1000).optional(),
});

export const payLoanRepaymentSchema = z.object({
  amount: z.number().min(1),
});

// AI Moderation validation schemas
export const createAiScanJobSchema = z.object({
  mediaId: z.string().uuid(),
  scanType: z.enum(["deepfake", "nsfw", "prohibited", "full"]),
  priority: z.number().min(1).max(10).default(5),
  provider: z.enum(["hive", "reality_defender", "aws_rekognition"]).optional(),
});

export const createContentFingerprintSchema = z.object({
  mediaId: z.string().uuid(),
  fingerprintType: z.enum(["perceptual_hash", "forensic_signature", "watermark"]),
  fingerprintData: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

// Param validation schemas for new endpoints
export const creatorIdPathParamSchema = z.object({
  creatorId: z.string().uuid("Invalid creator ID format"),
});

export const lenderIdPathParamSchema = z.object({
  lenderId: z.string().uuid("Invalid lender ID format"),
});

export const mediaIdPathParamSchema = z.object({
  mediaId: z.string().uuid("Invalid media ID format"),
});

export const contractIdPathParamSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID format"),
});

export const jobIdPathParamSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

export const offerIdPathParamSchema = z.object({
  offerId: z.string().uuid("Invalid offer ID format"),
});

// AI Moderation review/verification schemas
export const reviewAiScanResultSchema = z.object({
  humanReviewStatus: z.enum(["approved", "rejected", "flagged"]),
  reviewNotes: z.string().max(1000).optional(),
  moderatorAction: z.enum(["none", "remove_content", "warn_user", "ban_user"]).default("none"),
});

export const verifyContentFingerprintSchema = z.object({
  isVerified: z.boolean(),
  verificationNotes: z.string().max(1000).optional(),
  matchConfidence: z.number().min(0).max(100).optional(),
});

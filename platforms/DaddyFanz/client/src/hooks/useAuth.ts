import { useQuery } from "@tanstack/react-query";

// Additional API response types for Dashboard and other components
export interface Profile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  kycStatus: "pending" | "verified" | "rejected";
  ageVerified: boolean;
  complianceNotes?: string;
  subscriptionPrice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  ownerId: string;
  title?: string;
  description?: string;
  s3Key: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  status: "uploaded" | "processing" | "approved" | "rejected";
  forensicSignature?: string;
  price?: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutAccount {
  id: string;
  userId: string;
  provider: string;
  accountRef: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "fan" | "creator" | "admin";
  authProvider: "replit" | "local";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
  // Profile information (if available)
  profile?: {
    id: string;
    userId: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    kycStatus: "pending" | "verified" | "rejected";
    ageVerified: boolean;
    complianceNotes?: string;
    subscriptionPrice?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

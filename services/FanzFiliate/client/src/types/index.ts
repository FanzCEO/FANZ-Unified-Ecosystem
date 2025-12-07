export interface DashboardStats {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  epc: number;
}

export interface ActivityData {
  date: string;
  offer: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  earnings: number;
  status: 'approved' | 'pending' | 'rejected';
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export type UserRole = 'affiliate' | 'advertiser' | 'admin';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  kycStatus: 'unverified' | 'initiated' | 'in_review' | 'approved' | 'failed';
  kycTier: number;
}

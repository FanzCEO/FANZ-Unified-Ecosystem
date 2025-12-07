/**
 * FanzDiscreet API Service
 * Complete API client for FanzDiscreet payment privacy system
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface APIError {
  message: string;
  code?: string;
  details?: any;
}

interface DiscreetCard {
  card_id: string;
  user_id: string;
  card_number: string;
  card_display_name: string;
  card_type: 'prepaid' | 'reloadable' | 'gift';
  balance_cents: number;
  available_balance_cents: number;
  vault_mode_enabled: boolean;
  biometric_required: boolean;
  status: string;
  daily_remaining_cents: number;
  monthly_remaining_cents: number;
  transactions_last_30d: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  transaction_id: string;
  card_id: string;
  amount_cents: number;
  transaction_type: 'subscription' | 'tip' | 'ppv' | 'message' | 'unlock' | 'gift' | 'load';
  description: string;
  metadata?: {
    creator_name?: string;
    creator_username?: string;
    platform_name?: string;
    content_title?: string;
    subscription_period?: string;
  };
  status: string;
  created_at: string;
}

interface SpendingSummary {
  total_spent_usd: number;
  transaction_count: number;
  average_transaction_usd: number;
  by_type: {
    [key: string]: {
      total_usd: number;
      count: number;
    };
  };
  top_creators: Array<{
    creator_username: string;
    total_spent_usd: number;
    transaction_count: number;
  }>;
}

interface CCBillConfig {
  clientAccnum: string;
  clientSubacc: string;
  formName: string;
  flexId: string;
  currency: string;
  descriptor: string;
}

interface GiftCard {
  gift_card_id: string;
  card_code: string;
  amount_cents: number;
  recipient_email: string;
  gift_message?: string;
  sender_name?: string;
  status: string;
  redeemed_at?: string;
  created_at: string;
}

class DiscreetAPI {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE}/discreet`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIError>) => {
        const apiError: APIError = {
          message: error.response?.data?.message || error.message || 'An unknown error occurred',
          code: error.response?.data?.code || error.code,
          details: error.response?.data?.details,
        };

        // Handle specific error cases
        if (error.response?.status === 401) {
          // Unauthorized - clear auth token
          this.clearAuthToken();
          // Optionally redirect to login
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fanz_discreet_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fanz_discreet_token');
    }
  }

  /**
   * Load auth token from storage
   */
  loadAuthToken(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fanz_discreet_token');
      if (token) {
        this.authToken = token;
        return true;
      }
    }
    return false;
  }

  // ==================== Card Management ====================

  /**
   * Get all cards for the authenticated user
   */
  async getUserCards(): Promise<{ cards: DiscreetCard[] }> {
    const response = await this.api.get('/cards');
    return response.data;
  }

  /**
   * Get a specific card by ID
   */
  async getCard(cardId: string): Promise<{ card: DiscreetCard }> {
    const response = await this.api.get(`/cards/${cardId}`);
    return response.data;
  }

  /**
   * Create a new discreet card
   */
  async createCard(cardType: 'prepaid' | 'reloadable' | 'gift'): Promise<{ card: DiscreetCard }> {
    const response = await this.api.post('/cards', { cardType });
    return response.data;
  }

  /**
   * Update card display name
   */
  async updateCardName(cardId: string, displayName: string): Promise<{ card: DiscreetCard }> {
    const response = await this.api.patch(`/cards/${cardId}`, {
      card_display_name: displayName
    });
    return response.data;
  }

  /**
   * Deactivate a card
   */
  async deactivateCard(cardId: string): Promise<{ success: boolean }> {
    const response = await this.api.post(`/cards/${cardId}/deactivate`);
    return response.data;
  }

  // ==================== Card Loading ====================

  /**
   * Load funds onto a card via CCBill (legacy method)
   */
  async loadCard(
    cardId: string,
    amountCents: number,
    paymentToken: string
  ): Promise<{ load: any; new_balance_cents: number }> {
    const response = await this.api.post(`/cards/${cardId}/load`, {
      amountCents,
      paymentToken,
    });
    return response.data;
  }

  /**
   * Load funds onto a card via multi-processor gateway
   */
  async loadCardMultiProcessor(
    cardId: string,
    amountCents: number,
    processorId: string,
    paymentData: {
      paymentToken?: string;
      cryptoAddress?: string;
      walletId?: string;
      bankAccountId?: string;
    }
  ): Promise<{ load: any; new_balance_cents: number; transaction_id: string }> {
    const response = await this.api.post(`/cards/${cardId}/load-multi`, {
      amount_cents: amountCents,
      processor_id: processorId,
      payment_data: paymentData,
    });
    return response.data;
  }

  /**
   * Initialize payment session for a specific processor
   */
  async initializePaymentSession(
    cardId: string,
    amountCents: number,
    processorId: string,
    currency: string = 'USD'
  ): Promise<{
    session_id: string;
    processor_id: string;
    redirect_url?: string;
    payment_address?: string;
    qr_code?: string;
    client_secret?: string;
    fees: {
      fees_cents: number;
      net_amount_cents: number;
      total_with_fees_cents: number;
    };
  }> {
    const response = await this.api.post('/payment/initialize', {
      card_id: cardId,
      amount_cents: amountCents,
      processor_id: processorId,
      currency,
    });
    return response.data;
  }

  /**
   * Verify payment session status
   */
  async verifyPaymentSession(sessionId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transaction_id?: string;
    new_balance_cents?: number;
    error?: string;
  }> {
    const response = await this.api.get(`/payment/session/${sessionId}`);
    return response.data;
  }

  /**
   * Get card load history
   */
  async getLoadHistory(
    cardId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ loads: any[] }> {
    const response = await this.api.get(`/cards/${cardId}/loads`, {
      params: { limit, offset },
    });
    return response.data;
  }

  // ==================== Transactions ====================

  /**
   * Get transaction history for a card
   */
  async getTransactions(
    cardId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: Transaction[] }> {
    const response = await this.api.get(`/cards/${cardId}/transactions`, {
      params: { limit, offset },
    });
    return response.data;
  }

  /**
   * Get spending summary
   */
  async getSpendingSummary(days: number = 30): Promise<SpendingSummary> {
    const response = await this.api.get('/spending/summary', {
      params: { days },
    });
    return response.data;
  }

  /**
   * Get spending by creator
   */
  async getSpendingByCreator(
    creatorId: string,
    days: number = 30
  ): Promise<{ total_spent_usd: number; transactions: Transaction[] }> {
    const response = await this.api.get(`/spending/creator/${creatorId}`, {
      params: { days },
    });
    return response.data;
  }

  // ==================== Vault Mode ====================

  /**
   * Enable vault mode on a card
   */
  async enableVaultMode(cardId: string, pinHash?: string): Promise<{ success: boolean }> {
    const response = await this.api.post(`/cards/${cardId}/vault`, {
      enabled: true,
      pinHash,
    });
    return response.data;
  }

  /**
   * Disable vault mode on a card
   */
  async disableVaultMode(cardId: string): Promise<{ success: boolean }> {
    const response = await this.api.post(`/cards/${cardId}/vault`, {
      enabled: false,
    });
    return response.data;
  }

  /**
   * Authenticate vault access
   */
  async authenticateVault(
    cardId: string,
    authData: { pin?: string; biometric_token?: string }
  ): Promise<{ success: boolean; session_token?: string }> {
    const response = await this.api.post(`/cards/${cardId}/vault/authenticate`, authData);
    return response.data;
  }

  /**
   * Get vault access logs
   */
  async getVaultAccessLogs(
    cardId: string,
    limit: number = 50
  ): Promise<{ logs: any[] }> {
    const response = await this.api.get(`/cards/${cardId}/vault/logs`, {
      params: { limit },
    });
    return response.data;
  }

  // ==================== Gift Cards ====================

  /**
   * Purchase a gift card
   */
  async purchaseGiftCard(data: {
    amountCents: number;
    recipientEmail: string;
    giftMessage: string;
    ccbillToken: string;
    senderName?: string;
    anonymous?: boolean;
  }): Promise<{ gift_card: GiftCard }> {
    const response = await this.api.post('/gift-cards', data);
    return response.data;
  }

  /**
   * Redeem a gift card
   */
  async redeemGiftCard(
    cardCode: string,
    cardPin: string
  ): Promise<{ card: DiscreetCard; amount_cents: number }> {
    const response = await this.api.post('/gift-cards/redeem', {
      cardCode,
      cardPin,
    });
    return response.data;
  }

  /**
   * Get gift card status
   */
  async getGiftCardStatus(cardCode: string): Promise<{ gift_card: GiftCard }> {
    const response = await this.api.get(`/gift-cards/${cardCode}`);
    return response.data;
  }

  /**
   * Get sent gift cards
   */
  async getSentGiftCards(limit: number = 50): Promise<{ gift_cards: GiftCard[] }> {
    const response = await this.api.get('/gift-cards/sent', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get received gift cards
   */
  async getReceivedGiftCards(limit: number = 50): Promise<{ gift_cards: GiftCard[] }> {
    const response = await this.api.get('/gift-cards/received', {
      params: { limit },
    });
    return response.data;
  }

  // ==================== CCBill Integration ====================

  /**
   * Get CCBill FlexForms configuration
   */
  async getCCBillConfig(): Promise<CCBillConfig> {
    const response = await this.api.get('/ccbill/config');
    return response.data;
  }

  /**
   * Webhook callback for CCBill transactions (backend only)
   * This method is here for reference but should be called by CCBill directly to backend
   */
  async ccbillWebhook(payload: any): Promise<{ success: boolean }> {
    const response = await this.api.post('/ccbill/webhook', payload);
    return response.data;
  }

  // ==================== Spending Controls ====================

  /**
   * Update spending limits
   */
  async updateSpendingLimits(
    cardId: string,
    limits: {
      daily_limit_cents?: number;
      monthly_limit_cents?: number;
      max_balance_cents?: number;
    }
  ): Promise<{ card: DiscreetCard }> {
    const response = await this.api.patch(`/cards/${cardId}/limits`, limits);
    return response.data;
  }

  /**
   * Enable auto-reload
   */
  async enableAutoReload(
    cardId: string,
    config: {
      threshold_cents: number;
      reload_amount_cents: number;
      max_per_month: number;
    }
  ): Promise<{ success: boolean }> {
    const response = await this.api.post(`/cards/${cardId}/auto-reload`, {
      enabled: true,
      ...config,
    });
    return response.data;
  }

  /**
   * Disable auto-reload
   */
  async disableAutoReload(cardId: string): Promise<{ success: boolean }> {
    const response = await this.api.post(`/cards/${cardId}/auto-reload`, {
      enabled: false,
    });
    return response.data;
  }

  // ==================== Analytics ====================

  /**
   * Get detailed spending analytics
   */
  async getSpendingAnalytics(
    startDate: string,
    endDate: string
  ): Promise<{
    total_spent_usd: number;
    by_day: Array<{ date: string; amount_usd: number }>;
    by_platform: Array<{ platform_name: string; amount_usd: number }>;
    by_type: Array<{ type: string; amount_usd: number }>;
  }> {
    const response = await this.api.get('/analytics/spending', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  /**
   * Export transactions as CSV
   */
  async exportTransactions(
    cardId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const response = await this.api.get(`/cards/${cardId}/export`, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Health Check ====================

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const discreetAPI = new DiscreetAPI();

// Export types for use in components
export type {
  DiscreetCard,
  Transaction,
  SpendingSummary,
  CCBillConfig,
  GiftCard,
  APIError,
};

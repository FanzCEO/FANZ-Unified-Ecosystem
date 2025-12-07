import { EventEmitter } from 'events';
import { notificationService } from './notifications';

export interface Currency {
  code: string; // ISO 4217 code (USD, EUR, GBP, etc.)
  name: string;
  symbol: string;
  decimals: number;
  isActive: boolean;
  isCrypto: boolean;
  exchangeRate: number; // Rate to USD base
  lastUpdated: Date;
  countries: string[]; // ISO country codes
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: Date;
  source: string; // Exchange rate provider
}

export interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  netAmount: number;
  timestamp: Date;
}

export interface CurrencyPreference {
  userId: string;
  displayCurrency: string;
  payoutCurrency: string;
  autoConvert: boolean;
  conversionThreshold: number; // Minimum amount before auto-conversion
  preferredProviders: string[]; // Preferred payment providers for each currency
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentProvider {
  id: string;
  name: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  isAdultFriendly: boolean;
  conversionFee: number; // Percentage
  withdrawalFee: number; // Flat fee in USD equivalent
  minimumPayout: Record<string, number>; // Minimum payout per currency
  maximumPayout: Record<string, number>; // Maximum payout per currency
  processingTime: string; // "instant", "1-3 days", etc.
  isActive: boolean;
}

export interface CurrencyLocalization {
  currency: string;
  locale: string;
  format: {
    symbol: string;
    symbolPosition: 'before' | 'after';
    decimalSeparator: string;
    thousandsSeparator: string;
    decimalPlaces: number;
  };
  pluralRules: {
    singular: string;
    plural: string;
  };
}

/**
 * Comprehensive Multi-Currency Support Service
 * Handles currency conversion, localization, real-time rates, and payment provider integration
 */
class CurrencyService extends EventEmitter {
  private static instance: CurrencyService;
  private currencies = new Map<string, Currency>();
  private exchangeRates = new Map<string, ExchangeRate>();
  private paymentProviders = new Map<string, PaymentProvider>();
  private localization = new Map<string, CurrencyLocalization>();
  private userPreferences = new Map<string, CurrencyPreference>();
  
  // Rate update configuration
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private rateUpdateTimer?: NodeJS.Timeout;

  private constructor() {
    super();
    this.initializeCurrencies();
    this.initializePaymentProviders();
    this.initializeLocalization();
    this.startRateUpdates();
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Initialize supported currencies
   */
  private initializeCurrencies(): void {
    const currencies: Currency[] = [
      // Fiat currencies
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimals: 2,
        isActive: true,
        isCrypto: false,
        exchangeRate: 1.0, // Base currency
        lastUpdated: new Date(),
        countries: ['US'],
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        decimals: 2,
        isActive: true,
        isCrypto: false,
        exchangeRate: 0.85, // Mock rate
        lastUpdated: new Date(),
        countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'GR'],
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        decimals: 2,
        isActive: true,
        isCrypto: false,
        exchangeRate: 0.73, // Mock rate
        lastUpdated: new Date(),
        countries: ['GB'],
      },
      {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        decimals: 2,
        isActive: true,
        isCrypto: false,
        exchangeRate: 1.35, // Mock rate
        lastUpdated: new Date(),
        countries: ['CA'],
      },
      {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        decimals: 2,
        isActive: true,
        isCrypto: false,
        exchangeRate: 1.50, // Mock rate
        lastUpdated: new Date(),
        countries: ['AU'],
      },
      
      // Cryptocurrencies (adult-friendly)
      {
        code: 'USDT',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        isActive: true,
        isCrypto: true,
        exchangeRate: 1.0, // Stable coin
        lastUpdated: new Date(),
        countries: [], // Global
      },
      {
        code: 'BTC',
        name: 'Bitcoin',
        symbol: '₿',
        decimals: 8,
        isActive: true,
        isCrypto: true,
        exchangeRate: 0.000023, // Mock rate (1 USD = 0.000023 BTC)
        lastUpdated: new Date(),
        countries: [], // Global
      },
      {
        code: 'ETH',
        name: 'Ethereum',
        symbol: 'Ξ',
        decimals: 18,
        isActive: true,
        isCrypto: true,
        exchangeRate: 0.00041, // Mock rate
        lastUpdated: new Date(),
        countries: [], // Global
      },
    ];

    currencies.forEach(currency => {
      this.currencies.set(currency.code, currency);
    });

    console.log(`💱 Initialized ${currencies.length} currencies`);
  }

  /**
   * Initialize payment providers with currency support
   */
  private initializePaymentProviders(): void {
    const providers: PaymentProvider[] = [
      {
        id: 'paxum',
        name: 'Paxum',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
        supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU'],
        isAdultFriendly: true,
        conversionFee: 0.5, // 0.5%
        withdrawalFee: 1.50, // $1.50 USD equivalent
        minimumPayout: { USD: 50, EUR: 45, GBP: 40, CAD: 65 },
        maximumPayout: { USD: 25000, EUR: 22000, GBP: 19000, CAD: 33000 },
        processingTime: '1-2 business days',
        isActive: true,
      },
      {
        id: 'cosmo',
        name: 'CosmoPayment',
        supportedCurrencies: ['USD', 'EUR'],
        supportedCountries: ['US', 'GB', 'DE', 'FR', 'NL'],
        isAdultFriendly: true,
        conversionFee: 0.75, // 0.75%
        withdrawalFee: 2.00,
        minimumPayout: { USD: 100, EUR: 90 },
        maximumPayout: { USD: 10000, EUR: 9000 },
        processingTime: '3-5 business days',
        isActive: true,
      },
      {
        id: 'bitsafe',
        name: 'Bitsafe Crypto',
        supportedCurrencies: ['USDT', 'BTC', 'ETH'],
        supportedCountries: [], // Global crypto
        isAdultFriendly: true,
        conversionFee: 1.0, // 1%
        withdrawalFee: 0, // Network fees apply
        minimumPayout: { USDT: 50, BTC: 0.001, ETH: 0.02 },
        maximumPayout: { USDT: 100000, BTC: 10, ETH: 50 },
        processingTime: 'instant',
        isActive: true,
      },
      {
        id: 'wise',
        name: 'Wise (Formerly TransferWise)',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'NL', 'BE'],
        isAdultFriendly: false, // May have restrictions
        conversionFee: 0.35, // 0.35%
        withdrawalFee: 0.50,
        minimumPayout: { USD: 20, EUR: 18, GBP: 15, CAD: 25, AUD: 30 },
        maximumPayout: { USD: 50000, EUR: 45000, GBP: 40000, CAD: 65000, AUD: 75000 },
        processingTime: '1-3 business days',
        isActive: true,
      },
      {
        id: 'payoneer',
        name: 'Payoneer',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU'],
        isAdultFriendly: false, // May have restrictions
        conversionFee: 2.0, // 2%
        withdrawalFee: 1.50,
        minimumPayout: { USD: 50, EUR: 45, GBP: 40 },
        maximumPayout: { USD: 20000, EUR: 18000, GBP: 16000 },
        processingTime: '2-5 business days',
        isActive: true,
      },
    ];

    providers.forEach(provider => {
      this.paymentProviders.set(provider.id, provider);
    });

    console.log(`💳 Initialized ${providers.length} payment providers`);
  }

  /**
   * Initialize currency localization
   */
  private initializeLocalization(): void {
    const localizations: CurrencyLocalization[] = [
      {
        currency: 'USD',
        locale: 'en-US',
        format: {
          symbol: '$',
          symbolPosition: 'before',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2,
        },
        pluralRules: { singular: 'dollar', plural: 'dollars' },
      },
      {
        currency: 'EUR',
        locale: 'de-DE',
        format: {
          symbol: '€',
          symbolPosition: 'after',
          decimalSeparator: ',',
          thousandsSeparator: '.',
          decimalPlaces: 2,
        },
        pluralRules: { singular: 'euro', plural: 'euros' },
      },
      {
        currency: 'GBP',
        locale: 'en-GB',
        format: {
          symbol: '£',
          symbolPosition: 'before',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2,
        },
        pluralRules: { singular: 'pound', plural: 'pounds' },
      },
      {
        currency: 'USDT',
        locale: 'en-US',
        format: {
          symbol: 'USDT',
          symbolPosition: 'after',
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 6,
        },
        pluralRules: { singular: 'USDT', plural: 'USDT' },
      },
    ];

    localizations.forEach(loc => {
      this.localization.set(`${loc.currency}_${loc.locale}`, loc);
    });

    console.log(`🌍 Initialized ${localizations.length} currency localizations`);
  }

  /**
   * Get all supported currencies
   */
  public getSupportedCurrencies(includeInactive: boolean = false): Currency[] {
    const currencies = Array.from(this.currencies.values());
    return includeInactive ? currencies : currencies.filter(c => c.isActive);
  }

  /**
   * Get currency by code
   */
  public getCurrency(code: string): Currency | null {
    return this.currencies.get(code.toUpperCase()) || null;
  }

  /**
   * Convert amount between currencies
   */
  public async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    applyFees: boolean = false
  ): Promise<ConversionResult> {
    const fromCurr = this.getCurrency(fromCurrency);
    const toCurr = this.getCurrency(toCurrency);

    if (!fromCurr || !toCurr) {
      throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
    }

    if (fromCurrency === toCurrency) {
      return {
        fromAmount: amount,
        fromCurrency,
        toAmount: amount,
        toCurrency,
        exchangeRate: 1,
        fee: 0,
        netAmount: amount,
        timestamp: new Date(),
      };
    }

    // Convert through USD base
    const usdAmount = amount / fromCurr.exchangeRate;
    const convertedAmount = usdAmount * toCurr.exchangeRate;
    
    let fee = 0;
    if (applyFees) {
      // Apply a small conversion fee (0.5%)
      fee = convertedAmount * 0.005;
    }

    const result: ConversionResult = {
      fromAmount: amount,
      fromCurrency,
      toAmount: convertedAmount,
      toCurrency,
      exchangeRate: toCurr.exchangeRate / fromCurr.exchangeRate,
      fee,
      netAmount: convertedAmount - fee,
      timestamp: new Date(),
    };

    // Log significant conversions
    if (amount > 1000) {
      console.log(`💱 Large conversion: ${amount} ${fromCurrency} → ${result.netAmount.toFixed(toCurr.decimals)} ${toCurrency}`);
    }

    return result;
  }

  /**
   * Format currency amount for display
   */
  public formatCurrency(
    amount: number,
    currency: string,
    locale: string = 'en-US'
  ): string {
    const curr = this.getCurrency(currency);
    if (!curr) {
      return `${amount} ${currency}`;
    }

    const locKey = `${currency}_${locale}`;
    const localization = this.localization.get(locKey) || this.localization.get(`${currency}_en-US`);
    
    if (!localization) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr.isCrypto ? undefined : currency,
      }).format(amount) + (curr.isCrypto ? ` ${currency}` : '');
    }

    const formatted = this.formatNumber(amount, localization.format);
    const symbol = localization.format.symbol;
    
    return localization.format.symbolPosition === 'before'
      ? `${symbol}${formatted}`
      : `${formatted} ${symbol}`;
  }

  /**
   * Format number according to locale rules
   */
  private formatNumber(amount: number, format: CurrencyLocalization['format']): string {
    const rounded = Math.round(amount * Math.pow(10, format.decimalPlaces)) / Math.pow(10, format.decimalPlaces);
    const parts = rounded.toFixed(format.decimalPlaces).split('.');
    
    // Add thousands separator
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandsSeparator);
    
    return parts.join(format.decimalSeparator);
  }

  /**
   * Get available payment providers for currency and country
   */
  public getAvailableProviders(
    currency: string,
    country?: string,
    adultFriendlyOnly: boolean = true
  ): PaymentProvider[] {
    return Array.from(this.paymentProviders.values()).filter(provider => {
      if (!provider.isActive) return false;
      if (adultFriendlyOnly && !provider.isAdultFriendly) return false;
      if (!provider.supportedCurrencies.includes(currency)) return false;
      if (country && provider.supportedCountries.length > 0 && !provider.supportedCountries.includes(country)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get user currency preferences
   */
  public async getUserPreferences(userId: string): Promise<CurrencyPreference | null> {
    // In production, this would query the database
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Update user currency preferences
   */
  public async updateUserPreferences(
    userId: string,
    preferences: Partial<CurrencyPreference>
  ): Promise<CurrencyPreference> {
    const existing = this.userPreferences.get(userId) || {
      userId,
      displayCurrency: 'USD',
      payoutCurrency: 'USD',
      autoConvert: false,
      conversionThreshold: 100,
      preferredProviders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated: CurrencyPreference = {
      ...existing,
      ...preferences,
      updatedAt: new Date(),
    };

    this.userPreferences.set(userId, updated);

    // Send notification about preference update
    await notificationService.createNotification({
      userId,
      type: 'account_update',
      title: 'Currency Preferences Updated',
      message: `Your currency preferences have been updated. Display: ${updated.displayCurrency}, Payout: ${updated.payoutCurrency}`,
      priority: 'low',
      channels: ['websocket'],
      maxRetries: 1,
    });

    this.emit('preferences_updated', { userId, preferences: updated });
    
    return updated;
  }

  /**
   * Calculate payout with optimal provider selection
   */
  public async calculateOptimalPayout(
    userId: string,
    amount: number,
    fromCurrency: string,
    country?: string
  ): Promise<{
    provider: PaymentProvider;
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    payoutCurrency: string;
    conversionFee: number;
    withdrawalFee: number;
    netAmount: number;
    processingTime: string;
  }> {
    const preferences = await this.getUserPreferences(userId);
    const targetCurrency = preferences?.payoutCurrency || 'USD';
    
    // Get available providers for target currency
    const providers = this.getAvailableProviders(targetCurrency, country);
    
    if (providers.length === 0) {
      throw new Error(`No payment providers available for ${targetCurrency} in ${country || 'your region'}`);
    }

    // Calculate costs for each provider
    const calculations = await Promise.all(
      providers.map(async (provider) => {
        const conversion = await this.convertCurrency(amount, fromCurrency, targetCurrency, true);
        const conversionFee = conversion.fee;
        const withdrawalFee = provider.withdrawalFee;
        const providerFee = conversion.toAmount * (provider.conversionFee / 100);
        const netAmount = conversion.toAmount - conversionFee - withdrawalFee - providerFee;

        return {
          provider,
          originalAmount: amount,
          originalCurrency: fromCurrency,
          convertedAmount: conversion.toAmount,
          payoutCurrency: targetCurrency,
          conversionFee: conversionFee + providerFee,
          withdrawalFee,
          netAmount,
          processingTime: provider.processingTime,
        };
      })
    );

    // Select provider with highest net payout
    const optimal = calculations.reduce((best, current) => 
      current.netAmount > best.netAmount ? current : best
    );

    console.log(`💰 Optimal payout calculated: ${optimal.netAmount.toFixed(2)} ${targetCurrency} via ${optimal.provider.name}`);
    
    return optimal;
  }

  /**
   * Start automatic exchange rate updates
   */
  private startRateUpdates(): void {
    console.log('💱 Starting exchange rate updates');
    
    this.rateUpdateTimer = setInterval(() => {
      this.updateExchangeRates().catch(error => {
        console.error('Exchange rate update failed:', error);
      });
    }, this.UPDATE_INTERVAL);

    // Initial update
    this.updateExchangeRates();
  }

  /**
   * Update exchange rates from external sources
   */
  private async updateExchangeRates(): Promise<void> {
    try {
      // In production, this would call real exchange rate APIs
      // For now, we'll simulate rate updates with small variations
      
      const currencies = this.getSupportedCurrencies();
      const updates: ExchangeRate[] = [];

      for (const currency of currencies) {
        if (currency.code === 'USD') continue; // USD is base currency

        // Simulate rate fluctuation (±2%)
        const variation = (Math.random() - 0.5) * 0.04; // ±2%
        const newRate = currency.exchangeRate * (1 + variation);
        
        currency.exchangeRate = newRate;
        currency.lastUpdated = new Date();

        const rateUpdate: ExchangeRate = {
          fromCurrency: 'USD',
          toCurrency: currency.code,
          rate: newRate,
          timestamp: new Date(),
          source: 'mock-api',
        };

        updates.push(rateUpdate);
        this.exchangeRates.set(`USD_${currency.code}`, rateUpdate);
      }

      console.log(`💱 Updated ${updates.length} exchange rates`);
      this.emit('rates_updated', updates);

    } catch (error) {
      console.error('Failed to update exchange rates:', error);
    }
  }

  /**
   * Get current exchange rate between currencies
   */
  public getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;

    const fromCurr = this.getCurrency(fromCurrency);
    const toCurr = this.getCurrency(toCurrency);

    if (!fromCurr || !toCurr) {
      throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
    }

    return toCurr.exchangeRate / fromCurr.exchangeRate;
  }

  /**
   * Get currency statistics
   */
  public getCurrencyStats(): {
    supportedCurrencies: number;
    activeCurrencies: number;
    fiatCurrencies: number;
    cryptoCurrencies: number;
    paymentProviders: number;
    adultFriendlyProviders: number;
    lastRateUpdate: Date | null;
  } {
    const currencies = this.getSupportedCurrencies(true);
    const activeCurrencies = currencies.filter(c => c.isActive);
    const fiatCurrencies = activeCurrencies.filter(c => !c.isCrypto);
    const cryptoCurrencies = activeCurrencies.filter(c => c.isCrypto);
    const providers = Array.from(this.paymentProviders.values());
    const adultFriendlyProviders = providers.filter(p => p.isAdultFriendly);

    const lastUpdate = currencies.reduce((latest, currency) => {
      return !latest || currency.lastUpdated > latest ? currency.lastUpdated : latest;
    }, null as Date | null);

    return {
      supportedCurrencies: currencies.length,
      activeCurrencies: activeCurrencies.length,
      fiatCurrencies: fiatCurrencies.length,
      cryptoCurrencies: cryptoCurrencies.length,
      paymentProviders: providers.length,
      adultFriendlyProviders: adultFriendlyProviders.length,
      lastRateUpdate: lastUpdate,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.rateUpdateTimer) {
      clearInterval(this.rateUpdateTimer);
      this.rateUpdateTimer = undefined;
    }
  }
}

export const currencyService = CurrencyService.getInstance();

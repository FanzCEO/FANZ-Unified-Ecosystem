/**
 * FANZ Ads Client Library - Targeting Utilities
 */

import { DEVICE_TYPES } from '../constants';

/**
 * Get device type based on screen width
 */
export const getDeviceType = (): string => {
  if (typeof window === 'undefined') {
    return 'desktop'; // SSR default
  }

  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Get user's approximate geographic location
 * This is a simplified implementation - in production you might use:
 * - IP geolocation service
 * - Navigator.geolocation API (with permission)
 * - Server-side geo detection
 */
export const getUserGeo = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Simple timezone to country mapping (very basic)
    const timezoneToCountry: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Toronto': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Asia/Tokyo': 'JP',
      'Australia/Sydney': 'AU'
    };

    if (timezone && timezoneToCountry[timezone]) {
      return timezoneToCountry[timezone];
    }

    // Extract continent/region from timezone
    const parts = timezone.split('/');
    if (parts.length >= 2) {
      const region = parts[0];
      switch (region) {
        case 'America':
          return 'US'; // Default to US for Americas
        case 'Europe':
          return 'EU'; // European region
        case 'Asia':
          return 'AS'; // Asian region
        case 'Australia':
          return 'AU';
        case 'Africa':
          return 'AF';
        default:
          return null;
      }
    }
  } catch (error) {
    console.debug('[FANZ Ads] Failed to determine geo from timezone:', error);
  }

  return null; // Let server handle geo detection
};

/**
 * Get user's preferred language
 */
export const getUserLanguage = (): string => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return navigator.language || navigator.languages?.[0] || 'en';
};

/**
 * Check if user is on a mobile device
 */
export const isMobileDevice = (): boolean => {
  return getDeviceType() === 'mobile';
};

/**
 * Check if user is on a touch device
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get connection type (if available)
 */
export const getConnectionType = (): string | null => {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return null;
  }

  const connection = (navigator as any).connection;
  return connection?.effectiveType || null;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

/**
 * Generate a simple hash for user identification
 * This is NOT for security - just for frequency capping
 */
export const generateUserHash = (identifier?: string): string => {
  if (!identifier && typeof window !== 'undefined') {
    // Create a simple fingerprint based on available data
    const data = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      new Date().getTimezoneOffset()
    ].join('|');
    
    identifier = data;
  }

  if (!identifier) {
    // Generate random hash if no identifier available
    return Math.random().toString(36).substr(2, 9);
  }

  // Simple hash function (NOT cryptographically secure)
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Check if the current time is within business hours
 * This can be used for targeting specific ad content
 */
export const isBusinessHours = (timezone?: string): boolean => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone
  };
  
  const hour = parseInt(now.toLocaleString('en-US', options));
  return hour >= 9 && hour <= 17; // 9 AM to 5 PM
};

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = (): { width: number; height: number } => {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 }; // Default for SSR
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Check if an ad placement would be visible on screen
 */
export const wouldPlacementBeVisible = (placement: string): boolean => {
  const { width, height } = getViewportDimensions();
  
  // Basic visibility checks based on placement
  switch (placement) {
    case 'HEADER':
    case 'FOOTER':
      return width >= 320; // Minimum width for header/footer ads
    
    case 'SIDEPANEL':
      return width >= 1024; // Only show sidepanel on larger screens
    
    case 'HOMEPAGE_HERO':
      return width >= 768 && height >= 400;
    
    case 'HOMEPAGE_NATIVE':
    case 'DASHBOARD_WIDGET':
      return true; // These are responsive
    
    default:
      return true;
  }
};
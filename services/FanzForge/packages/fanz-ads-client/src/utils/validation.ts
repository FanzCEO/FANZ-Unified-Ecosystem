/**
 * FANZ Ads Client Library - Validation Utilities
 */

import { AdResponse } from '../components/FanzAd';
import { AD_ERROR_CODES } from '../constants';

/**
 * Validate ad response from server
 */
export const validateAdResponse = (response: any): { isValid: boolean; error?: string; ad?: AdResponse } => {
  if (!response) {
    return {
      isValid: false,
      error: 'No response received'
    };
  }

  // Check for required fields
  if (!response.creativeUrl && !response.html) {
    return {
      isValid: false,
      error: 'Ad response missing creative content'
    };
  }

  if (!response.clickUrl) {
    return {
      isValid: false,
      error: 'Ad response missing click URL'
    };
  }

  // Validate URLs
  if (response.creativeUrl && !isValidUrl(response.creativeUrl)) {
    return {
      isValid: false,
      error: 'Invalid creative URL'
    };
  }

  if (!isValidUrl(response.clickUrl)) {
    return {
      isValid: false,
      error: 'Invalid click URL'
    };
  }

  // Validate tracking URLs if present
  if (response.tracking) {
    const trackingUrls = [
      response.tracking.impressionUrl,
      response.tracking.viewableUrl,
      response.tracking.clickUrl
    ].filter(Boolean);

    for (const url of trackingUrls) {
      if (!isValidUrl(url)) {
        return {
          isValid: false,
          error: 'Invalid tracking URL'
        };
      }
    }
  }

  // Validate dimensions
  if (response.width && (typeof response.width !== 'number' || response.width <= 0)) {
    return {
      isValid: false,
      error: 'Invalid width dimension'
    };
  }

  if (response.height && (typeof response.height !== 'number' || response.height <= 0)) {
    return {
      isValid: false,
      error: 'Invalid height dimension'
    };
  }

  // Validate cache TTL
  if (response.cacheTtl && (typeof response.cacheTtl !== 'number' || response.cacheTtl < 0)) {
    return {
      isValid: false,
      error: 'Invalid cache TTL'
    };
  }

  // Check for potentially malicious HTML
  if (response.html) {
    const htmlValidation = validateAdHtml(response.html);
    if (!htmlValidation.isValid) {
      return {
        isValid: false,
        error: htmlValidation.error
      };
    }
  }

  return {
    isValid: true,
    ad: response as AdResponse
  };
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

/**
 * Validate ad HTML content for security
 */
export const validateAdHtml = (html: string): { isValid: boolean; error?: string } => {
  // Check length
  if (html.length > 100000) { // 100KB limit
    return {
      isValid: false,
      error: 'HTML content too large'
    };
  }

  // Check for potentially dangerous tags/attributes
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<form\b/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(html)) {
      return {
        isValid: false,
        error: 'HTML contains potentially unsafe content'
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate placement name
 */
export const isValidPlacement = (placement: string): boolean => {
  const validPlacements = [
    'HEADER',
    'FOOTER', 
    'SIDEPANEL',
    'HOMEPAGE_HERO',
    'HOMEPAGE_NATIVE',
    'DASHBOARD_WIDGET'
  ];
  
  return validPlacements.includes(placement);
};

/**
 * Validate platform name
 */
export const isValidPlatform = (platform: string): boolean => {
  const validPlatforms = [
    'boyfanz',
    'girlfanz',
    'pupfanz',
    'taboofanz',
    'daddiesfanz',
    'cougarfanz'
  ];
  
  return validPlatforms.includes(platform);
};

/**
 * Validate device type
 */
export const isValidDevice = (device: string): boolean => {
  const validDevices = ['mobile', 'tablet', 'desktop'];
  return validDevices.includes(device);
};

/**
 * Validate user hash format
 */
export const isValidUserHash = (hash: string): boolean => {
  // Should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9]{6,32}$/.test(hash);
};

/**
 * Sanitize HTML content (basic)
 */
export const sanitizeHtml = (html: string): string => {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
};

/**
 * Validate creative file size
 */
export const isValidFileSize = (sizeBytes: number, type: 'image' | 'video' | 'html'): boolean => {
  const maxSizes = {
    image: 200000,   // 200KB
    video: 1500000,  // 1.5MB
    html: 100000     // 100KB
  };

  return sizeBytes <= maxSizes[type];
};

/**
 * Validate creative dimensions for placement
 */
export const isValidDimensions = (
  width: number, 
  height: number, 
  placement: string
): boolean => {
  const dimensionRules: Record<string, Array<{ width: number; height: number }>> = {
    HEADER: [
      { width: 970, height: 90 },
      { width: 728, height: 90 },
      { width: 320, height: 50 }
    ],
    FOOTER: [
      { width: 728, height: 90 },
      { width: 320, height: 50 }
    ],
    SIDEPANEL: [
      { width: 300, height: 250 },
      { width: 300, height: 600 }
    ],
    HOMEPAGE_HERO: [
      { width: 1200, height: 400 },
      { width: 970, height: 250 }
    ]
  };

  const validDimensions = dimensionRules[placement];
  if (!validDimensions) {
    return true; // No restrictions for this placement
  }

  return validDimensions.some(dim => 
    dim.width === width && dim.height === height
  );
};

/**
 * Create validation error
 */
export const createValidationError = (code: string, message: string, retryable = false) => {
  return {
    code,
    message,
    timestamp: Date.now(),
    retryable
  };
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  if (!error || !error.code) return false;

  const retryableCodes = [
    AD_ERROR_CODES.NETWORK_ERROR,
    AD_ERROR_CODES.TIMEOUT
  ];

  return retryableCodes.includes(error.code);
};

/**
 * Validate campaign budget
 */
export const isValidBudget = (budget: number, minBudget = 5): boolean => {
  return typeof budget === 'number' && budget >= minBudget && budget <= 100000;
};

/**
 * Validate bid type
 */
export const isValidBidType = (bidType: string): boolean => {
  const validTypes = ['CPM', 'CPC', 'CPA'];
  return validTypes.includes(bidType);
};

/**
 * Validate geo targeting
 */
export const isValidGeo = (geo: string): boolean => {
  // Basic ISO country code validation (2 or 3 characters)
  return /^[A-Z]{2,3}$/.test(geo.toUpperCase());
};
/**
 * Feature Flags Configuration
 * 
 * Controls availability of features across different environments.
 * Integrates with FanzDash security control center for centralized management.
 */

// Web3 Feature Flag - Controls blockchain wallet connections
// Disabled by default for security (MetaMask SDK vulnerabilities)
// FANZ payment stack uses adult-friendly processors (CCBill, Paxum, Segpay)
export const WEB3_ENABLED = 
  (process.env.NODE_ENV !== 'undefined' && process.env.REACT_APP_FEATURE_WEB3 === 'true') || false;

// Additional feature flags can be added here following the same pattern
// Example:
// export const METAVERSE_ENABLED = process.env.REACT_APP_FEATURE_METAVERSE === 'true';
// export const AI_FEATURES_ENABLED = process.env.REACT_APP_FEATURE_AI === 'true';

/**
 * Feature flag utilities
 */
export const FeatureFlags = {
  WEB3_ENABLED,
  // Future flags go here
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
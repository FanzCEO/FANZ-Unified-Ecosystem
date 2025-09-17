/**
 * Feature Flags Configuration
 * 
 * Controls availability of features across different environments.
 * Integrates with FanzDash security control center for centralized management.
 */

// Web3 Feature Flag - Controls blockchain wallet connections
// Disabled by default for security (MetaMask SDK vulnerabilities)
// FANZ payment stack uses adult-friendly processors (CCBill, Paxum, Segpay)
/**
 * Utility to get feature flag value from environment variables.
 * Checks Vite (`import.meta.env`) first, then falls back to process.env.
 */
function getFeatureFlag(viteVar: string, nodeVar: string): boolean {
  let value: string | undefined;
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
    value = import.meta.env[viteVar];
  } else if (typeof process !== 'undefined' && process.env) {
    value = process.env[nodeVar];
  }
  return value === 'true';
}

// Web3 Feature Flag - Controls blockchain wallet connections
// Disabled by default for security (MetaMask SDK vulnerabilities)
// FANZ payment stack uses adult-friendly processors (CCBill, Paxum, Segpay)
export const WEB3_ENABLED = getFeatureFlag('VITE_FEATURE_WEB3', 'REACT_APP_FEATURE_WEB3');

// Additional feature flags can be added here using the utility function
// Example:
// export const METAVERSE_ENABLED = getFeatureFlag('VITE_FEATURE_METAVERSE', 'REACT_APP_FEATURE_METAVERSE');
// export const AI_FEATURES_ENABLED = getFeatureFlag('VITE_FEATURE_AI', 'REACT_APP_FEATURE_AI');

/**
 * Feature flag utilities
 */
export const FeatureFlags = {
  WEB3_ENABLED,
  // Future flags go here
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
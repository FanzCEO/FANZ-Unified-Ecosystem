/**
 * Feature Flags Configuration
 * 
 * Controls availability of features across different environments.
 * Integrates with FanzDash security control center for centralized management.
 */

// Web3 Feature Flag - Controls blockchain wallet connections
// Disabled by default for security (MetaMask SDK vulnerabilities)
// FANZ payment stack uses adult-friendly processors (CCBill, Paxum, Segpay)
// Safely get environment variable from import.meta.env or process.env
function getEnvFlag(key: string): string | undefined {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // ignore
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

export const WEB3_ENABLED =
  getEnvFlag('VITE_FEATURE_WEB3') === 'true' ||
  getEnvFlag('REACT_APP_FEATURE_WEB3') === 'true';
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

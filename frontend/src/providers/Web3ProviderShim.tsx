import React, { createContext, useContext, ReactNode } from 'react';
import { WEB3_ENABLED } from '../config/flags';

/**
 * Web3 Provider Shim
 * 
 * Replaces RainbowKitProvider when Web3 features are disabled for security.
 * Provides a no-op context that maintains app composition without wallet connections.
 * 
 * Security: Removes MetaMask SDK vulnerabilities by disabling wallet connectors.
 * Payment: FANZ uses adult-friendly processors (CCBill, Paxum, Segpay) instead.
 */

interface Web3ContextValue {
  isConnected: false;
  address: null;
  chainId: null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  enabled: false;
}

const Web3Context = createContext<Web3ContextValue>({
  isConnected: false,
  address: null,
  chainId: null,
  connect: async () => {
    console.warn('Web3 features are disabled. Enable via WEB3_ENABLED flag.');
  },
  disconnect: async () => {
    console.warn('Web3 features are disabled. Enable via WEB3_ENABLED flag.');
  },
  enabled: false,
});

interface Web3ProviderShimProps {
  children: ReactNode;
}

/**
 * Web3 Provider Shim Component
 * 
 * When WEB3_ENABLED is false: Provides no-op Web3 context
 * When WEB3_ENABLED is true: Can lazy-load actual Web3 provider (future)
 */
export function Web3ProviderShim({ children }: Web3ProviderShimProps) {
  if (WEB3_ENABLED) {
    // Future: Lazy-load actual Web3 provider when security issues are resolved
    console.warn('WEB3_ENABLED is true but secure Web3 provider not yet implemented');
  }

  // Always return shim for now (security-first approach)
  return (
    <Web3Context.Provider value={{
      isConnected: false,
      address: null,
      chainId: null,
      connect: async () => {
        if (WEB3_ENABLED) {
          console.log('Web3 connection requested but secure provider not available');
        } else {
          console.warn('Web3 features are disabled for security. Payment processing uses CCBill/Paxum/Segpay.');
        }
      },
      disconnect: async () => {
        // No-op
      },
      enabled: false,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

/**
 * Hook to use Web3 context (no-op when disabled)
 */
export function useWeb3Shim() {
  return useContext(Web3Context);
}

/**
 * Type definitions for compatibility with wagmi hooks
 */
export type Address = string;
export type Chain = {
  id: number;
  name: string;
};

// Legacy hook compatibility (no-op implementations)
export function useAccount() {
  return {
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  };
}

export function useBalance() {
  return {
    data: undefined,
    isLoading: false,
    error: null,
  };
}

export function useNetwork() {
  return {
    chain: undefined,
    chains: [],
  };
}

export function useConnect() {
  return {
    connect: async () => {
      console.warn('Wallet connection disabled for security. Use FANZ payment processors.');
    },
    connectors: [],
    isLoading: false,
    pendingConnector: undefined,
  };
}

export function useDisconnect() {
  return {
    disconnect: async () => {
      // No-op
    },
    isLoading: false,
  };
}
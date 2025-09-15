import React from 'react';
import { WEB3_ENABLED } from '../../config/flags';

/**
 * Connect Wallet Placeholder
 * 
 * Replaces ConnectButton and other wallet connection UI when Web3 is disabled.
 * Shows payment alternatives aligned with FANZ's adult-friendly payment stack.
 * 
 * Security: Prevents exposure to MetaMask SDK vulnerabilities
 * UX: Guides users to supported payment methods
 */

interface ConnectWalletPlaceholderProps {
  /** Show full payment alternatives or minimal placeholder */
  showAlternatives?: boolean;
  /** Custom styling */
  className?: string;
  /** Button styling variant */
  variant?: 'primary' | 'secondary' | 'minimal';
}

export function ConnectWalletPlaceholder({ 
  showAlternatives = true, 
  className = '',
  variant = 'secondary'
}: ConnectWalletPlaceholderProps) {
  
  // If Web3 is enabled but not yet implemented, show development notice
  if (WEB3_ENABLED) {
    return (
      <div className={`inline-flex items-center px-4 py-2 border border-yellow-400 bg-yellow-50 text-yellow-800 rounded-md ${className}`}>
        <span className="text-sm">🔧 Web3 features in development</span>
      </div>
    );
  }

  // Minimal variant - just hide the button
  if (variant === 'minimal') {
    return null;
  }

  // Show payment alternatives for primary/secondary variants
  if (showAlternatives) {
    return (
      <div className={`inline-flex flex-col items-center space-y-2 ${className}`}>
        <div className={`
          inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${variant === 'primary' 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }
        `}>
          <span>💳 Payment Methods</span>
        </div>
        
        <div className="text-xs text-gray-500 text-center max-w-xs">
          Secure payments via CCBill, Paxum & Segpay
          <br />
          <span className="text-blue-600">Adult-friendly processors</span>
        </div>
      </div>
    );
  }

  // Simple disabled state
  return (
    <div className={`
      inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
      bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200
      ${className}
    `}>
      <span>🔒 Payments Available</span>
    </div>
  );
}

/**
 * Wallet Status Placeholder
 * 
 * Replaces wallet connection status displays
 */
interface WalletStatusPlaceholderProps {
  className?: string;
}

export function WalletStatusPlaceholder({ className = '' }: WalletStatusPlaceholderProps) {
  return (
    <div className={`inline-flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
      <span>Payments Ready</span>
    </div>
  );
}

/**
 * Chain Selector Placeholder
 * 
 * Replaces blockchain network selectors
 */
export function ChainSelectorPlaceholder({ className = '' }: { className?: string }) {
  if (!WEB3_ENABLED) {
    return null; // Hide entirely when Web3 disabled
  }
  
  return (
    <div className={`inline-flex items-center px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600 ${className}`}>
      <span>⛓️ Payment Network</span>
    </div>
  );
}

// Re-export for easy imports
export default ConnectWalletPlaceholder;
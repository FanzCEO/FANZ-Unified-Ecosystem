/**
 * Network Security Guard
 * Implements outbound request allowlisting and SSRF protection
 * Centrally managed via FanzDash control plane
 */

// Types
interface NetworkPolicy {
  allowedHosts: string[];
  blockedIPs: string[];
  maxRedirects: number;
  timeoutMs: number;
  enforceHTTPS: boolean;
}

interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  origin?: string;
}

// Default security policy - restrictive by default
const DEFAULT_POLICY: NetworkPolicy = {
  allowedHosts: [
    // Core API endpoints
    'api.fanzecosystem.com',
    'auth.fanzecosystem.com',
    'payments.fanzecosystem.com',
    
    // Blockchain RPCs (allowlisted)
    'mainnet.infura.io',
    'polygon-rpc.com',
    'bsc-dataseed.binance.org',
    
    // CDN and assets (if needed)
    'cdn.fanzecosystem.com',
    'assets.fanzecosystem.com'
  ],
  
  blockedIPs: [
    // RFC 1918 private networks
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    // Localhost
    '127.0.0.0/8',
    '::1/128',
    // Link-local
    '169.254.0.0/16',
    'fe80::/10',
    // Multicast
    '224.0.0.0/4',
    'ff00::/8'
  ],
  
  maxRedirects: 3,
  timeoutMs: 10000,
  enforceHTTPS: true
};

// Runtime policy loaded from environment and FanzDash
let currentPolicy: NetworkPolicy = { ...DEFAULT_POLICY };

/**
 * Initialize network guard with environment configuration
 */
export function initializeNetworkGuard(): void {
  try {
    // Load allowed hosts from environment (managed by FanzDash)
    const envAllowedHosts = import.meta.env.VITE_ALLOWED_HOSTS;
    if (envAllowedHosts) {
      const additionalHosts = envAllowedHosts.split(',').map(h => h.trim());
      currentPolicy.allowedHosts.push(...additionalHosts);
    }

    // Enforce HTTPS in production
    if (import.meta.env.PROD) {
      currentPolicy.enforceHTTPS = true;
    }

    console.info('[NetworkGuard] Initialized with policy:', {
      allowedHostsCount: currentPolicy.allowedHosts.length,
      enforceHTTPS: currentPolicy.enforceHTTPS
    });

  } catch (error) {
    console.error('[NetworkGuard] Failed to initialize:', error);
  }
}

/**
 * Update policy from FanzDash control plane
 */
export function updateNetworkPolicy(policy: Partial<NetworkPolicy>): void {
  currentPolicy = { ...currentPolicy, ...policy };
  console.info('[NetworkGuard] Policy updated from FanzDash');
}

/**
 * Check if a URL is allowed by current policy
 */
function isUrlAllowed(url: string): { allowed: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);
    
    // Protocol check
    if (currentPolicy.enforceHTTPS && urlObj.protocol !== 'https:') {
      return { allowed: false, reason: 'HTTPS required' };
    }
    
    // Host allowlist check
    const hostname = urlObj.hostname;
    const isHostAllowed = currentPolicy.allowedHosts.some(allowedHost => {
      // Exact match or subdomain match
      return hostname === allowedHost || hostname.endsWith('.' + allowedHost);
    });
    
    if (!isHostAllowed) {
      return { allowed: false, reason: `Host '${hostname}' not in allowlist` };
    }
    
    // IP address blocking (basic check)
    const isPrivateIP = currentPolicy.blockedIPs.some(range => {
      // Simple IP range check - could be enhanced with proper CIDR validation
      return hostname.startsWith(range.split('/')[0].substring(0, 3));
    });
    
    if (isPrivateIP) {
      return { allowed: false, reason: 'Private IP address blocked' };
    }
    
    return { allowed: true };
    
  } catch (error) {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

/**
 * Secure fetch wrapper with allowlist enforcement
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const context: RequestContext = {
    url,
    method: options.method || 'GET',
    headers: (options.headers as Record<string, string>) || {},
    origin: window.location.origin
  };

  // Check URL against policy
  const check = isUrlAllowed(url);
  if (!check.allowed) {
    console.warn('[NetworkGuard] Blocked request:', {
      url,
      reason: check.reason,
      context
    });
    
    throw new Error(`Network request blocked: ${check.reason}`);
  }

  // Add security headers
  const secureHeaders = {
    ...context.headers,
    'X-Requested-With': 'FanzSecureFetch',
    'User-Agent': 'Fanz-Frontend/1.0'
  };

  // Apply timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), currentPolicy.timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: secureHeaders,
      signal: controller.signal,
      redirect: 'manual' // Handle redirects manually for security
    });

    clearTimeout(timeoutId);
    
    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.debug('[NetworkGuard] Allowed request:', {
        url,
        status: response.status,
        method: context.method
      });
    }

    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('[NetworkGuard] Request failed:', {
      url,
      error: error.message,
      context
    });
    
    throw error;
  }
}

/**
 * Secure XMLHttpRequest wrapper
 */
export function createSecureXHR(): XMLHttpRequest {
  const xhr = new XMLHttpRequest();
  const originalOpen = xhr.open;

  xhr.open = function(method: string, url: string, async = true, user?: string, password?: string) {
    const check = isUrlAllowed(url);
    if (!check.allowed) {
      console.warn('[NetworkGuard] Blocked XHR request:', {
        url,
        method,
        reason: check.reason
      });
      
      throw new Error(`XHR request blocked: ${check.reason}`);
    }

    return originalOpen.call(this, method, url, async, user, password);
  };

  return xhr;
}

/**
 * Initialize global network interception (optional)
 */
export function enableGlobalNetworkGuard(): void {
  if (typeof window === 'undefined') return;

  // Override global fetch
  const originalFetch = window.fetch;
  window.fetch = secureFetch as typeof fetch;

  // Override XMLHttpRequest constructor
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    return createSecureXHR();
  } as any;

  console.info('[NetworkGuard] Global network interception enabled');

  // Provide escape hatch for legitimate internal use
  (window as any).__unsecureFetch = originalFetch;
  (window as any).__unsecureXHR = originalXHR;
}

/**
 * Report network policy violations to FanzDash
 */
export function reportPolicyViolation(violation: {
  url: string;
  reason: string;
  timestamp: number;
  userAgent: string;
  origin: string;
}): void {
  // Send violation report to FanzDash monitoring
  try {
    // Use the original fetch to avoid recursion
    const originalFetch = (window as any).__unsecureFetch || fetch;
    
    originalFetch('/api/security/violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Report': 'network-violation'
      },
      body: JSON.stringify(violation)
    }).catch(error => {
      console.warn('[NetworkGuard] Failed to report violation:', error);
    });
    
  } catch (error) {
    console.warn('[NetworkGuard] Failed to report violation:', error);
  }
}

// Export current policy for inspection
export function getCurrentPolicy(): Readonly<NetworkPolicy> {
  return { ...currentPolicy };
}
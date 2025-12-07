/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features
  experimental: {
    serverActions: false, // Not needed for ad demo
    typedRoutes: true,
  },
  
  // Images configuration for ad creatives
  images: {
    domains: [
      'cdn.fanz.network',
      'tracker.fanz.network',
      'localhost',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers for security and ad serving
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // CORS for ad serving
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://*.fanz.network',
          },
        ],
      },
    ];
  },
  
  // Environment variables available to client
  env: {
    NEXT_PUBLIC_ADS_API: process.env.NEXT_PUBLIC_ADS_API || 'http://localhost:4000',
    NEXT_PUBLIC_PLATFORM: process.env.NEXT_PUBLIC_PLATFORM || 'boyfanz',
  },
  
  // Webpack configuration for workspace packages
  webpack: (config, { isServer }) => {
    // Handle workspace packages
    config.externals = config.externals || [];
    
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compress responses
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Redirect configuration
  async redirects() {
    return [
      // Redirect old paths if needed
    ];
  },
  
  // Rewrite configuration for API proxying in development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/ads/:path*',
          destination: 'http://localhost:4000/api/ads/:path*',
        },
        {
          source: '/api/campaigns/:path*', 
          destination: 'http://localhost:4000/api/campaigns/:path*',
        },
        {
          source: '/api/policy/:path*',
          destination: 'http://localhost:4000/api/policy/:path*',
        },
        {
          source: '/api/webhooks/:path*',
          destination: 'http://localhost:4000/api/webhooks/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
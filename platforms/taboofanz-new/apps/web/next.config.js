/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@taboofanz/database', '@taboofanz/shared', '@taboofanz/ui'],
  images: {
    domains: [
      'localhost',
      'taboofanz-media.s3.amazonaws.com',
      'cdn.taboofanz.com',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.15'],
  transpilePackages: [
    '@repo/ui',
    '@repo/contracts',
    '@repo/auth',
    '@repo/config',
    '@repo/logger',
    '@repo/utils',
  ],
};

export default nextConfig;

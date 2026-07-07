import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

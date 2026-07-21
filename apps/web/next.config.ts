import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required in a monorepo so Next.js traces files from the repo root,
  // producing the correct standalone directory layout for Docker.
  outputFileTracingRoot: path.join(__dirname, '../../'),
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

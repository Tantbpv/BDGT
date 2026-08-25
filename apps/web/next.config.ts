import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required in a monorepo so Next.js traces files from the repo root,
  // producing the correct standalone directory layout for Docker.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [],
};

export default nextConfig;

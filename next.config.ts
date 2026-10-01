import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', port: '', pathname: '/t/p/**' },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') config.watchOptions = { ignored: /.*/ };
    return config;
  },
};

export default nextConfig;

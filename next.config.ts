/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add output configuration for standalone mode
  output: 'standalone',
  // Ensure images are properly handled
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

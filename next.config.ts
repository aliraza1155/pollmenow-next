import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'placehold.co'],
  },
  // Optional: add rewrites for sitemap and Cloud Function proxy (if needed)
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
};

export default nextConfig;
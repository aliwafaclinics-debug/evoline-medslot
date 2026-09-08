/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker deployments
  output: 'standalone',

  // API rewrites — proxy to backend in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },

  // Image domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.evolinemedslot.ae' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Strict mode for better dev experience
  reactStrictMode: true,
};

module.exports = nextConfig;

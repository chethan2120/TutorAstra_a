const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  async redirects() {
    return [
      { source: '/about', destination: '/?section=about', permanent: false },
      { source: '/contact', destination: '/?section=consultation', permanent: false },
      { source: '/packages', destination: '/?section=consultation', permanent: false },
      { source: '/free-trial', destination: '/?section=consultation', permanent: false },
      { source: '/courses', destination: '/?section=subjects', permanent: false },
      { source: '/courses/:path*', destination: '/?section=subjects', permanent: false },
      { source: '/curriculum', destination: '/?section=subjects', permanent: false },
      { source: '/curriculum/:path*', destination: '/?section=subjects', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kanban/types'],
  output: 'standalone',
};

module.exports = nextConfig;

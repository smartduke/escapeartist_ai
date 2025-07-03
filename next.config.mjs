/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['pdf-parse'],
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  // Streaming optimizations
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    webpackBuildWorker: true,
  },
  // Disable buffering for better streaming
  compress: false,
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JSONBIN_API_KEY: process.env.NEXT_PUBLIC_JSONBIN_API_KEY,
  },
  // Kein standalone output - wir verwenden einen Custom Server mit Socket.io
  // output: 'standalone',
}

module.exports = nextConfig

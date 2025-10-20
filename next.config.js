/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JSONBIN_API_KEY: process.env.NEXT_PUBLIC_JSONBIN_API_KEY,
  },
  // Für Railway Deployment mit Standalone Output
  output: 'standalone',
}

module.exports = nextConfig

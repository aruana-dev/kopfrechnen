/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_JSONBIN_API_KEY: process.env.NEXT_PUBLIC_JSONBIN_API_KEY,
  },
  // Zurück zu standalone - Custom Server funktioniert nicht mit API Routes
  output: 'standalone',
}

module.exports = nextConfig

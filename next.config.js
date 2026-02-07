/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

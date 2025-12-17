/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingRoot: '/Users/sandiptoroy/Desktop/bankAgent-ey',
  },
}

export default nextConfig

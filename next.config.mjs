/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa'

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['timezone'],
  },
  env: {
    TZ: 'UTC',
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'platform-lookaside.fbsbx.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stllwgszmjhoifabsyfd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

export default withPWAConfig(nextConfig);
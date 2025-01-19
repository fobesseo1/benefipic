// next.config.mjs

/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

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
  // 외부 링크 처리를 위한 추가 설정
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/link\.coupang\.com/,
      handler: 'NetworkOnly',
      options: {
        backgroundSync: {
          name: 'external-links',
          options: {
            maxRetentionTime: 60 * 60 * 24, // 24시간
          },
        },
      },
    },
  ],
});

export default withPWAConfig(nextConfig);

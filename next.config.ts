import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    minimumCacheTTL: 604800,        // cache de imagens por 7 dias
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],  // reduz bundle do lucide
  },
  async headers() {
    return [
      {
        // DNS prefetch em todas as páginas
        source: '/(.*)',
        headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }],
      },
      {
        // Cache CDN para APIs da landing
        source: '/api/landing/(.*)',
        headers: [{ key: 'Cache-Control', value: 's-maxage=30, stale-while-revalidate=120' }],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Não bloqueia o build se o Sentry não estiver configurado
  silent:              true,
  hideSourceMaps:      true,
  disableLogger:       true,
  automaticVercelMonitors: false,
})

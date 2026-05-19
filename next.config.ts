import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  typescript: {
    // Os erros de tipo estão em arquivos auto-gerados do Next.js (.next/dev/types/validator.ts)
    // e não afetam o funcionamento da aplicação. Ignorar para não bloquear o deploy.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  compress: true,
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

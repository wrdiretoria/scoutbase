/**
 * URL base do site.
 *
 * Priority (server-side):
 *   1. NEXT_PUBLIC_BASE_URL — define manualmente quando tiver domínio próprio
 *   2. VERCEL_URL           — Vercel injeta automaticamente em toda implantação
 *   3. Fallback hardcoded
 *
 * Client-side: sempre usa window.location.origin (funciona em qualquer domínio).
 */

function resolveServerUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL)           return `https://${process.env.VERCEL_URL}`
  return 'https://scoutbase-eta.vercel.app'
}

/** Para uso em server components, API routes, e email templates. */
export const SERVER_BASE_URL = resolveServerUrl()

/**
 * Para uso em client components.
 * Retorna window.location.origin no browser, SERVER_BASE_URL no servidor.
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return SERVER_BASE_URL
}

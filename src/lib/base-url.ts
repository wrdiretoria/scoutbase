/**
 * URL base do site.
 *
 * Priority (server-side):
 *   1. NEXT_PUBLIC_BASE_URL — env var configurada no painel Vercel
 *   2. Fallback hardcoded para o domínio de produção
 *
 * Nota: VERCEL_URL NÃO é usado — ele retorna a URL da deployment específica
 * (ex: scoutbase-abc123.vercel.app), nunca o domínio customizado.
 *
 * Client-side: sempre usa window.location.origin (funciona em qualquer domínio).
 */

function resolveServerUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  return 'https://www.meucraque.com'
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

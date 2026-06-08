/**
 * formatNome — exibição visual apenas.
 * Retorna PRIMEIRO NOME + ÚLTIMO SOBRENOME, preservando partículas.
 *
 * João Pedro Silva Santos  → "João Santos"
 * Alan dos Santos          → "Alan dos Santos"
 * Lucas da Conceição       → "Lucas da Conceição"
 *
 * Não altera banco, URLs, SEO ou dados armazenados.
 */

const PARTICULAS = new Set(['dos', 'das', 'da', 'de', 'do'])

export function formatNome(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return nome

  const primeiro  = parts[0]
  const ultimo    = parts[parts.length - 1]
  const penultimo = parts[parts.length - 2]

  if (PARTICULAS.has(penultimo.toLowerCase())) {
    return `${primeiro} ${penultimo} ${ultimo}`
  }
  return `${primeiro} ${ultimo}`
}

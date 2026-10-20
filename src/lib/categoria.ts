/**
 * Categoria única do atleta — fonte da verdade para TODAS as telas.
 * Módulo puro (sem Supabase/Next), pode ser usado em client e server components.
 *
 * Regra do futebol de base: categoria = ano atual − ano de nascimento.
 *   Ex.: nascido em 2010, em 2026 → Sub-16 (o ano todo, independente do mês).
 *   Acima de Sub-20 → 'Adulto'.
 *
 * O ano é lido direto do texto 'YYYY-MM-DD' — new Date('2010-01-01') vira
 * 31/12/2009 no fuso de Brasília e jogaria o atleta para o ano errado.
 */

export const CATEGORIA_MAX = 20

/** Ano de nascimento a partir de 'YYYY-MM-DD' (ou ISO completo); null se inválido. */
export function anoNascimento(dataNasc: string | null | undefined): number | null {
  const m = dataNasc?.match(/^(\d{4})-\d{2}-\d{2}/)
  return m ? Number(m[1]) : null
}

/** 'Sub-N' pela regra do ano de nascimento; 'Adulto' acima de Sub-20; null sem data. */
export function categoriaDoAtleta(
  dataNasc: string | null | undefined,
  hoje: Date = new Date(),
): string | null {
  const ano = anoNascimento(dataNasc)
  if (ano === null) return null
  const n = hoje.getFullYear() - ano
  return n > CATEGORIA_MAX ? 'Adulto' : `Sub-${n}`
}

/**
 * Valida a data de nascimento do cadastro ('YYYY-MM-DD').
 * Retorna a mensagem de erro, ou null se for válida (data real, não futura).
 * Sem ela o atleta fica sem categoria e some dos filtros do ranking.
 */
export function erroDataNascimento(
  dataNasc: string | null | undefined,
  hoje: Date = new Date(),
): string | null {
  if (!dataNasc?.trim()) return 'Informe sua data de nascimento.'
  const m = dataNasc.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return 'Data de nascimento inválida.'
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia || ano < 1900) {
    return 'Data de nascimento inválida.'
  }
  if (d > hoje) return 'A data de nascimento não pode ser no futuro.'
  return null
}

/** Opções de filtro (mesmas da navegação da home e do ranking). */
export const CATEGORIAS_FILTRO: string[] = [
  ...[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => `Sub-${n}`),
  'Adulto',
]

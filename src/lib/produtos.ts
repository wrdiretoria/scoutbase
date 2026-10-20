/**
 * Catálogo dos produtos pagos da página /planos — usado tanto pelo checkout
 * (/api/asaas/checkout) quanto pelo webhook (/api/asaas/webhook), pra não
 * duplicar preço/descrição/regra de quem pode comprar em dois lugares.
 */
import type { EntityType } from './entitlements'

export type ProdutoKey = 'atleta_pro' | 'treinador_pro' | 'clube' | 'boost'

export type ProdutoConfig = {
  valor: number
  descricao: string
  tiposPermitidos: string[] | null // null = qualquer tipo logado
}

export const PRODUTOS: Record<ProdutoKey, ProdutoConfig> = {
  atleta_pro:    { valor: 19.90,  descricao: 'Atleta Pro — Meu Craque (30 dias)', tiposPermitidos: ['atleta'] },
  treinador_pro: { valor: 49.90,  descricao: 'Treinador/Scout Pro — Meu Craque (30 dias)', tiposPermitidos: ['treinador', 'scout', 'escola'] },
  clube:         { valor: 149.90, descricao: 'Clube/Escolinha institucional — Meu Craque (30 dias)', tiposPermitidos: ['treinador', 'escola'] },
  boost:         { valor: 9.90,   descricao: 'Impulsionar perfil — Meu Craque (7 dias em destaque)', tiposPermitidos: ['atleta'] },
}

/**
 * Mapeia o produto pro entity_type gravado em entitlements. 'self' significa
 * "usa o tipo real do comprador" (treinador_pro serve tanto treinador quanto
 * scout, e cada um deve virar Pro no seu próprio entity_type).
 */
export const PRODUTO_ENTITY_TYPE: Record<Exclude<ProdutoKey, 'boost'>, EntityType | 'self'> = {
  atleta_pro:    'atleta',
  treinador_pro: 'self',
  clube:         'clube',
}

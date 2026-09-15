/**
 * Gating helpers contra a tabela `entitlements` (plano 'pro' ativo por
 * entity_type) e o limite gratuito de buscas de scout/treinador
 * (`scout_search_log`, 5 buscas/mês no plano free).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type EntityType = 'atleta' | 'treinador' | 'scout' | 'clube'

const LIMITE_BUSCAS_GRATIS_MES = 5

async function temEntitlementAtivo(admin: SupabaseClient, userId: string, entityType: EntityType): Promise<boolean> {
  const { data } = await admin
    .from('entitlements')
    .select('active_until')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('plan', 'pro')
    .order('active_until', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!data) return false
  if (!data.active_until) return true // sem data de expiração = ativo indefinidamente
  return new Date(data.active_until as string) > new Date()
}

/** Atleta Pro — R$19,90/mês. Desbloqueia "quem visualizou meu perfil". */
export async function canViewProfileViewers(admin: SupabaseClient, userId: string): Promise<boolean> {
  return temEntitlementAtivo(admin, userId, 'atleta')
}

/** Treinador/Scout Pro — R$49,90/mês. Mensagens diretas ilimitadas. */
export async function canMessageUnlimited(admin: SupabaseClient, userId: string): Promise<boolean> {
  const [treinador, scout] = await Promise.all([
    temEntitlementAtivo(admin, userId, 'treinador'),
    temEntitlementAtivo(admin, userId, 'scout'),
  ])
  return treinador || scout
}

/** Treinador/Scout Pro — busca ilimitada com filtros avançados. */
export async function canSearchUnlimited(admin: SupabaseClient, userId: string): Promise<boolean> {
  const [treinador, scout] = await Promise.all([
    temEntitlementAtivo(admin, userId, 'treinador'),
    temEntitlementAtivo(admin, userId, 'scout'),
  ])
  return treinador || scout
}

/**
 * Clube/Escolinha institucional — R$149,90/mês. Peneiras/vagas ilimitadas.
 *
 * Helper pronto, mas ainda NÃO está sendo aplicado em POST /api/opportunities
 * (Fase 2 deixou a criação de vagas livre para qualquer treinador, e este
 * prompt não definiu um limite gratuito de vagas/mês para gatear contra —
 * só o de buscas foi explicitado). Evitei inventar um número.
 */
export async function canPostOpportunity(admin: SupabaseClient, userId: string): Promise<boolean> {
  return temEntitlementAtivo(admin, userId, 'clube')
}

/**
 * Quantas buscas grátis restam no mês corrente para um scout/treinador sem
 * plano Pro. Retorna null quando o plano já é ilimitado (Pro ativo).
 */
export async function buscasRestantesNoMes(admin: SupabaseClient, scoutId: string): Promise<number | null> {
  if (await canSearchUnlimited(admin, scoutId)) return null

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count } = await admin
    .from('scout_search_log')
    .select('*', { count: 'exact', head: true })
    .eq('scout_id', scoutId)
    .gte('created_at', inicioMes.toISOString())

  return Math.max(0, LIMITE_BUSCAS_GRATIS_MES - (count ?? 0))
}

/** Registra uma busca no contador mensal do plano free. */
export async function registrarBusca(admin: SupabaseClient, scoutId: string): Promise<void> {
  await admin.from('scout_search_log').insert({ scout_id: scoutId })
}

/**
 * Upsert manual numa linha de entitlements (user_id + entity_type), sem
 * depender de constraint UNIQUE na tabela — atualiza active_until se já
 * existir uma linha 'pro' para esse par, senão insere uma nova.
 */
export async function upsertEntitlementPro(
  admin: SupabaseClient,
  userId: string,
  entityType: EntityType,
  activeUntil: Date,
): Promise<void> {
  const { data: existente } = await admin
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('plan', 'pro')
    .maybeSingle()

  if (existente) {
    await admin.from('entitlements')
      .update({ active_until: activeUntil.toISOString(), source: 'asaas' })
      .eq('id', existente.id)
  } else {
    await admin.from('entitlements').insert({
      user_id: userId, plan: 'pro', entity_type: entityType,
      active_until: activeUntil.toISOString(), source: 'asaas',
    })
  }
}

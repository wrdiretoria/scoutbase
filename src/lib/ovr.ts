/**
 * OVR real — SÓ a avaliação de treinadores (regra em lib/escala.ts):
 *   • nota de cada avaliação = Técnico 35% · Físico 25% · Tático 25% · Comportamento 15%
 *   • OVR do atleta = média das notas; sem avaliação → sem OVR
 *
 * O perfil preenchido NÃO entra no OVR — vira a barra "Perfil X% completo".
 *
 * Bridge direto: profiles.id (auth UUID) = avaliacoes.aluno_id
 * profiles.athlete_id (MC-XXXXX) é usado para mapear no ranking/busca.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { COLUNAS_NOTA, ovrDasAvaliacoes, type AvaliacaoNota } from './escala'

type AvaliacaoRow = AvaliacaoNota & { aluno_id: string | null }

/** Todas as avaliações com nota, agrupadas por UUID do atleta → OVR. */
async function ovrPorUuid(admin: SupabaseClient): Promise<Map<string, number>> {
  const { data: avs } = await admin
    .from('avaliacoes')
    .select(`aluno_id, ${COLUNAS_NOTA}`)
    .not('scout_score', 'is', null)

  const porAluno = new Map<string, AvaliacaoRow[]>()
  for (const av of (avs ?? []) as AvaliacaoRow[]) {
    if (!av.aluno_id) continue
    if (!porAluno.has(av.aluno_id)) porAluno.set(av.aluno_id, [])
    porAluno.get(av.aluno_id)!.push(av)
  }

  const map = new Map<string, number>()
  for (const [uuid, lista] of porAluno) {
    const ovr = ovrDasAvaliacoes(lista)
    if (ovr !== null) map.set(uuid, ovr)
  }
  return map
}

// ── fetchOvrMap ────────────────────────────────────────────────────────────────

/**
 * Retorna Map<MC-ID, ovr> com todos os atletas avaliados.
 * Use com o admin client (bypass RLS).
 */
export async function fetchOvrMap(admin: SupabaseClient): Promise<Map<string, number>> {
  const [{ data: profiles }, byUuid] = await Promise.all([
    admin.from('profiles').select('id, athlete_id').not('athlete_id', 'is', null),
    ovrPorUuid(admin),
  ])

  const map = new Map<string, number>()
  for (const p of (profiles ?? []) as { id: string; athlete_id: string | null }[]) {
    const ovr = byUuid.get(p.id)
    if (p.athlete_id && ovr !== undefined) map.set(p.athlete_id, ovr)
  }
  return map
}

// ── fetchOvrMapByUuid ──────────────────────────────────────────────────────────

/**
 * Igual a fetchOvrMap, mas keyed por UUID. Cacheado por 60s via unstable_cache.
 */
export async function fetchOvrMapByUuid(admin: SupabaseClient): Promise<Map<string, number>> {
  // Função interna cacheável — retorna objeto serializável (Record) em vez de Map
  const getCached = unstable_cache(
    async (): Promise<Record<string, number>> => Object.fromEntries(await ovrPorUuid(admin)),
    ['ovr-map-by-uuid-v2'],   // v2: OVR só da avaliação (pesos por bloco)
    { revalidate: 60, tags: ['ovr'] }
  )

  const record = await getCached()
  return new Map(Object.entries(record))
}

// ── fetchOvrSingle ─────────────────────────────────────────────────────────────

/**
 * OVR de um único atleta pelo MC-ID.
 * Retorna null se o perfil não existir ou não tiver avaliação.
 */
export async function fetchOvrSingle(
  admin: SupabaseClient,
  mcId: string,
): Promise<number | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', mcId)
    .maybeSingle()

  if (!profile?.id) return null

  const { data: avs } = await admin
    .from('avaliacoes')
    .select(COLUNAS_NOTA)
    .eq('aluno_id', profile.id)
    .not('scout_score', 'is', null)

  return ovrDasAvaliacoes((avs ?? []) as AvaliacaoNota[])
}

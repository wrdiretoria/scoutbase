/**
 * OVR real — média dos scout_score das avaliações por atleta.
 *
 * Bridge direto: profiles.id (auth UUID) = avaliacoes.aluno_id
 * profiles.athlete_id (MC-XXXXX) é usado para mapear no ranking/busca.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Retorna Map<MC-ID, avgOvr> com todos os atletas que têm pelo menos 1 avaliação.
 * Use com o admin client (bypass RLS).
 */
export async function fetchOvrMap(admin: SupabaseClient): Promise<Map<string, number>> {
  const map = new Map<string, number>()

  // 1. Todas as avaliações com score
  const { data: avs } = await admin
    .from('avaliacoes')
    .select('aluno_id, scout_score')
    .not('scout_score', 'is', null)

  if (!avs || avs.length === 0) return map

  // 2. Agrupar scores por aluno_id (auth UUID)
  const scoresByUuid = new Map<string, number[]>()
  for (const av of avs as { aluno_id: string; scout_score: number }[]) {
    if (!av.aluno_id) continue
    if (!scoresByUuid.has(av.aluno_id)) scoresByUuid.set(av.aluno_id, [])
    scoresByUuid.get(av.aluno_id)!.push(av.scout_score)
  }

  if (scoresByUuid.size === 0) return map

  // 3. Buscar MC-IDs dos perfis correspondentes
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, athlete_id')
    .in('id', [...scoresByUuid.keys()])
    .not('athlete_id', 'is', null)

  if (!profiles) return map

  // 4. Calcular média e montar map MC-ID → OVR
  for (const profile of profiles as { id: string; athlete_id: string }[]) {
    const scores = scoresByUuid.get(profile.id) ?? []
    if (!scores.length) continue
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    map.set(profile.athlete_id, avg)
  }

  return map
}

/**
 * OVR de um único atleta pelo MC-ID.
 * Retorna null se sem avaliações.
 */
export async function fetchOvrSingle(
  admin: SupabaseClient,
  mcId: string,
): Promise<number | null> {
  // 1. Achar o UUID do perfil pelo MC-ID
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', mcId)
    .maybeSingle()

  if (!profile?.id) return null

  // 2. Buscar avaliações pelo UUID
  const { data: avs } = await admin
    .from('avaliacoes')
    .select('scout_score')
    .eq('aluno_id', profile.id)
    .not('scout_score', 'is', null)

  if (!avs?.length) return null

  const scores = (avs as { scout_score: number }[]).map(a => a.scout_score)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

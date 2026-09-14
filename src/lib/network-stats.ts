/**
 * Estatísticas de rede de um perfil: conexões aceitas, seguidores e recomendações
 * (públicas), mais visualizações de perfil nos últimos 30 dias — essa última só
 * é preenchida quando quem pede (viewerId) é o próprio dono do perfil.
 *
 * Usa o admin client: contagens agregadas de outros usuários, que a RLS de
 * connections/follows restringe às partes envolvidas.
 *
 * Compartilhado entre /api/network-stats/[id] e a página pública do atleta,
 * para evitar que a página faça um fetch HTTP na própria API (e perderia o
 * contexto de quem está vendo, necessário pra esconder viewsLast30Days).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type NetworkStats = {
  connections: number
  followers: number
  recommendations: number
  viewsLast30Days: number | null
}

export async function getNetworkStats(
  admin: SupabaseClient,
  subjectId: string,
  viewerId: string | null,
): Promise<NetworkStats> {
  const [{ count: connections }, { count: followers }, { count: recommendations }] = await Promise.all([
    admin.from('connections').select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${subjectId},addressee_id.eq.${subjectId}`),
    admin.from('follows').select('*', { count: 'exact', head: true })
      .eq('followee_id', subjectId),
    admin.from('recommendations').select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId),
  ])

  let viewsLast30Days: number | null = null
  if (viewerId === subjectId) {
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId)
      .gte('created_at', trintaDiasAtras)
    viewsLast30Days = count ?? 0
  }

  return {
    connections:     connections     ?? 0,
    followers:       followers       ?? 0,
    recommendations: recommendations ?? 0,
    viewsLast30Days,
  }
}

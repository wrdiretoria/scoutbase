/**
 * GET /api/network-stats/[id]
 * Estatísticas de rede de um perfil: conexões aceitas, seguidores e recomendações
 * recebidas (públicas), mais visualizações de perfil nos últimos 30 dias — essa
 * última só é retornada quando quem pede é o próprio dono do perfil.
 * Resposta: { connections, followers, recommendations, viewsLast30Days }
 *
 * Usa admin client: contagens agregadas de outros usuários, que a RLS de
 * connections/follows restringe às partes envolvidas.
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    const [{ count: connections }, { count: followers }, { count: recommendations }] = await Promise.all([
      admin.from('connections').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${id},addressee_id.eq.${id}`),
      admin.from('follows').select('*', { count: 'exact', head: true })
        .eq('followee_id', id),
      admin.from('recommendations').select('*', { count: 'exact', head: true })
        .eq('subject_id', id),
    ])

    let viewsLast30Days: number | null = null
    if (user?.id === id) {
      const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await admin
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', id)
        .gte('created_at', trintaDiasAtras)
      viewsLast30Days = count ?? 0
    }

    return NextResponse.json({
      connections:     connections     ?? 0,
      followers:       followers       ?? 0,
      recommendations: recommendations ?? 0,
      viewsLast30Days,
    })
  } catch (err) {
    console.error('[network-stats/id] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

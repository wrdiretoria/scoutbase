/**
 * GET /api/network-stats/[id]
 * Estatísticas de rede de um perfil: conexões aceitas, seguidores e recomendações
 * recebidas (públicas), mais visualizações de perfil nos últimos 30 dias — essa
 * última só é retornada quando quem pede é o próprio dono do perfil.
 * Resposta: { connections, followers, recommendations, viewsLast30Days }
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { getNetworkStats } from '@/lib/network-stats'

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
    const stats = await getNetworkStats(admin, id, user?.id ?? null)

    return NextResponse.json(stats)
  } catch (err) {
    console.error('[network-stats/id] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

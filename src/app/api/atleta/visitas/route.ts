/**
 * GET /api/atleta/visitas
 * Retorna estatísticas de visitas do atleta logado.
 * Resposta: { semana, mes, total, mediaSemana }
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const agora      = new Date()
  const semanaAtras = new Date(agora.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const mesAtras    = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Contagens do atleta ──
  const [{ count: semana }, { count: mes }, { count: total }] = await Promise.all([
    admin.from('visitas').select('*', { count: 'exact', head: true })
      .eq('atleta_id', user.id).gte('created_at', semanaAtras),
    admin.from('visitas').select('*', { count: 'exact', head: true })
      .eq('atleta_id', user.id).gte('created_at', mesAtras),
    admin.from('visitas').select('*', { count: 'exact', head: true })
      .eq('atleta_id', user.id),
  ])

  // ── Média da plataforma esta semana (perfis ativos) ──
  // Conta visitas por atleta nesta semana e calcula a média
  const { data: visitasSemana } = await admin
    .from('visitas')
    .select('atleta_id')
    .gte('created_at', semanaAtras)

  let mediaSemana = 0
  if (visitasSemana && visitasSemana.length > 0) {
    const atletasAtivos = new Set(visitasSemana.map(v => v.atleta_id)).size
    mediaSemana = Math.round(visitasSemana.length / atletasAtivos)
  }

  return NextResponse.json({
    semana:      semana      ?? 0,
    mes:         mes         ?? 0,
    total:       total       ?? 0,
    mediaSemana,
  })
}

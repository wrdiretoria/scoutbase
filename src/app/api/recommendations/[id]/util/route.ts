/**
 * POST /api/recommendations/[id]/util
 * Alterna a reação "👍 Útil" do usuário logado numa recomendação e ajusta
 * recommendations.helpful_count. Resposta: { ok, util, helpfulCount }
 *
 * Usa admin client: recommendations não tem policy de UPDATE (só select/insert),
 * então o ajuste do contador precisa bypassar RLS — igual ao padrão de
 * scout/favorito (toggle + contador denormalizado em dois passos).
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = createAdminClient()

    const { data: recomendacao } = await admin
      .from('recommendations')
      .select('id, helpful_count')
      .eq('id', id)
      .maybeSingle()

    if (!recomendacao) return NextResponse.json({ error: 'Recomendação não encontrada.' }, { status: 404 })

    const { data: existente } = await admin
      .from('recommendation_reactions')
      .select('id')
      .eq('recommendation_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    const contadorAtual = (recomendacao.helpful_count as number) ?? 0
    let util: boolean
    let helpfulCount: number

    if (existente) {
      await admin.from('recommendation_reactions').delete().eq('id', existente.id)
      helpfulCount = Math.max(0, contadorAtual - 1)
      util = false
    } else {
      await admin.from('recommendation_reactions').insert({ recommendation_id: id, user_id: user.id })
      helpfulCount = contadorAtual + 1
      util = true
    }

    await admin.from('recommendations').update({ helpful_count: helpfulCount }).eq('id', id)

    return NextResponse.json({ ok: true, util, helpfulCount })
  } catch (err) {
    console.error('[recommendations/id/util] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

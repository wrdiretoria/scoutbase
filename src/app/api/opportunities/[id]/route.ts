/**
 * PATCH /api/opportunities/[id]
 * Fecha ou reabre uma vaga. Body: { status: 'open' | 'closed' }
 * Só o dono (club_id = auth.uid()) pode alterar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { status } = await req.json() as { status?: 'open' | 'closed' }
    if (status !== 'open' && status !== 'closed') {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const { data: vaga, error } = await supabase
      .from('opportunities')
      .update({ status })
      .eq('id', id)
      .eq('club_id', user.id)
      .select('id, club_id, title, position, category, city, description, status, created_at')
      .maybeSingle()

    if (error) {
      console.error('[opportunities/id] PATCH', error)
      return NextResponse.json({ error: 'Erro ao atualizar vaga.' }, { status: 500 })
    }
    if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada ou não é sua.' }, { status: 404 })

    return NextResponse.json({ ok: true, opportunity: vaga })
  } catch (err) {
    console.error('[opportunities/id] PATCH unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

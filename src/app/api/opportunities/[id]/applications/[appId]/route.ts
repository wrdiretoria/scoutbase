/**
 * PATCH /api/opportunities/[id]/applications/[appId]
 * Muda o status de uma candidatura. Body: { status: 'viewed'|'accepted'|'rejected' }
 * Só o dono da vaga pode alterar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

const STATUS_VALIDOS = ['viewed', 'accepted', 'rejected']

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const { id, appId } = await context.params
    if (!id || !appId) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { status } = await req.json() as { status?: string }
    if (!status || !STATUS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: vaga } = await admin.from('opportunities').select('id, club_id').eq('id', id).maybeSingle()
    if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
    if (vaga.club_id !== user.id) return NextResponse.json({ error: 'Apenas o dono da vaga pode alterar candidaturas.' }, { status: 403 })

    const { data: candidatura, error } = await supabase
      .from('opportunity_applications')
      .update({ status })
      .eq('id', appId)
      .eq('opportunity_id', id)
      .select('id, athlete_id, status, created_at')
      .maybeSingle()

    if (error) {
      console.error('[opportunities/id/applications/appId] PATCH', error)
      return NextResponse.json({ error: 'Erro ao atualizar candidatura.' }, { status: 500 })
    }
    if (!candidatura) return NextResponse.json({ error: 'Candidatura não encontrada.' }, { status: 404 })

    return NextResponse.json({ ok: true, application: candidatura })
  } catch (err) {
    console.error('[opportunities/id/applications/appId] PATCH unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

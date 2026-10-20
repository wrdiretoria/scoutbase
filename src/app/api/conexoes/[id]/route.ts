/**
 * PATCH /api/conexoes/[id]
 * O destinatário aceita ou recusa uma solicitação de conexão pendente.
 * Body: { acao: 'aceitar' | 'recusar' }
 *
 * RLS só permite update por quem solicitou (requester_id), então a resposta do
 * destinatário precisa passar pelo admin client, com a autorização validada aqui.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

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

    const { acao } = await req.json() as { acao?: 'aceitar' | 'recusar' }
    if (acao !== 'aceitar' && acao !== 'recusar') {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: conexao } = await admin
      .from('connections')
      .select('id, addressee_id, status')
      .eq('id', id)
      .maybeSingle()

    if (!conexao) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 })
    if (conexao.addressee_id !== user.id) {
      return NextResponse.json({ error: 'Apenas o destinatário pode responder.' }, { status: 403 })
    }
    if (conexao.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitação já foi respondida.' }, { status: 409 })
    }

    const { data: atualizada, error } = await admin
      .from('connections')
      .update({
        status:       acao === 'aceitar' ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, requester_id, addressee_id, status, created_at, responded_at')
      .single()

    if (error) {
      console.error('[conexoes/id] PATCH', error)
      return NextResponse.json({ error: 'Erro ao responder solicitação.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, conexao: atualizada })
  } catch (err) {
    console.error('[conexoes/id] PATCH unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

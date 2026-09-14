/**
 * GET /api/conversations/[id]/messages
 * Lista as mensagens da conversa (mais antigas primeiro) e marca como lidas
 * (read_at) as que não são do usuário logado. Só participantes têm acesso.
 * Resposta: { messages: [{ id, sender_id, body, created_at, read_at }] }
 *
 * POST /api/conversations/[id]/messages
 * Envia uma mensagem. Body: { body }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

async function ehParticipante(admin: ReturnType<typeof createAdminClient>, conversationId: string, userId: string) {
  const { data } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

export async function GET(
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
    if (!await ehParticipante(admin, id, user.id)) {
      return NextResponse.json({ error: 'Você não participa dessa conversa.' }, { status: 403 })
    }

    const { data: mensagens, error } = await admin
      .from('messages')
      .select('id, sender_id, body, created_at, read_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[conversations/id/messages] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar mensagens.' }, { status: 500 })
    }

    // Marca como lidas as mensagens do outro participante
    const naoLidasDoOutro = (mensagens ?? []).filter(m => m.sender_id !== user.id && !m.read_at).map(m => m.id)
    if (naoLidasDoOutro.length > 0) {
      await admin.from('messages').update({ read_at: new Date().toISOString() }).in('id', naoLidasDoOutro)
    }

    return NextResponse.json({ messages: mensagens ?? [] })
  } catch (err) {
    console.error('[conversations/id/messages] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { body } = await req.json() as { body?: string }
    if (!body?.trim()) return NextResponse.json({ error: 'Escreva uma mensagem.' }, { status: 400 })

    const { data: mensagem, error } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, body: body.trim() })
      .select('id, sender_id, body, created_at, read_at')
      .single()

    if (error) {
      console.error('[conversations/id/messages] POST', error)
      return NextResponse.json({ error: 'Erro ao enviar mensagem.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: mensagem })
  } catch (err) {
    console.error('[conversations/id/messages] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

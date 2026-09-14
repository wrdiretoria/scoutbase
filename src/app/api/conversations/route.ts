/**
 * GET /api/conversations
 * Lista as conversas do usuário logado, com o outro participante, a última
 * mensagem e se há mensagens não lidas, ordenadas pela mais recente.
 * Resposta: { conversations: [{ id, other, lastMessage, unread }] }
 *
 * POST /api/conversations
 * Busca ou cria a conversa 1:1 com outro usuário. Body: { otherUserId }
 * Resposta: { conversationId }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { getOrCreateConversation } from '@/lib/conversations'

type Autor = { id: string; nome: string | null; avatarUrl: string | null }

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = createAdminClient()

    const { data: minhasParticipacoes } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    const conversationIds = (minhasParticipacoes ?? []).map(p => p.conversation_id as string)
    if (conversationIds.length === 0) return NextResponse.json({ conversations: [] })

    const [{ data: todosParticipantes }, { data: todasMensagens }] = await Promise.all([
      admin.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', conversationIds),
      admin.from('messages').select('id, conversation_id, sender_id, body, created_at, read_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false }),
    ])

    const outroParticipantePorConversa = new Map<string, string>()
    for (const p of todosParticipantes ?? []) {
      if (p.user_id !== user.id) outroParticipantePorConversa.set(p.conversation_id as string, p.user_id as string)
    }

    const outrosIds = Array.from(new Set(Array.from(outroParticipantePorConversa.values())))
    const { data: perfis } = outrosIds.length > 0
      ? await admin.from('profiles').select('id, nome, avatar_url').in('id', outrosIds)
      : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
    const perfilPorId = new Map<string, Autor>((perfis ?? []).map(p => [p.id, { id: p.id, nome: p.nome, avatarUrl: p.avatar_url }]))

    const ultimaMensagemPorConversa = new Map<string, { body: string; created_at: string; sender_id: string }>()
    const naoLidaPorConversa = new Map<string, boolean>()
    for (const m of todasMensagens ?? []) {
      const convId = m.conversation_id as string
      if (!ultimaMensagemPorConversa.has(convId)) {
        ultimaMensagemPorConversa.set(convId, { body: m.body as string, created_at: m.created_at as string, sender_id: m.sender_id as string })
      }
      if (m.sender_id !== user.id && !m.read_at) naoLidaPorConversa.set(convId, true)
    }

    const conversas = conversationIds.map(id => ({
      id,
      other: perfilPorId.get(outroParticipantePorConversa.get(id) ?? '') ?? null,
      lastMessage: ultimaMensagemPorConversa.get(id) ?? null,
      unread: naoLidaPorConversa.get(id) ?? false,
    }))

    conversas.sort((a, b) => {
      const ta = a.lastMessage?.created_at ?? ''
      const tb = b.lastMessage?.created_at ?? ''
      return tb.localeCompare(ta)
    })

    return NextResponse.json({ conversations: conversas })
  } catch (err) {
    console.error('[conversations] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { otherUserId } = await req.json() as { otherUserId?: string }
    if (!otherUserId?.trim()) return NextResponse.json({ error: 'otherUserId é obrigatório.' }, { status: 400 })
    if (otherUserId === user.id) return NextResponse.json({ error: 'Você não pode conversar consigo mesmo.' }, { status: 400 })

    const admin = createAdminClient()

    const { data: destino } = await admin.from('profiles').select('id').eq('id', otherUserId).maybeSingle()
    if (!destino) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    const conversationId = await getOrCreateConversation(admin, user.id, otherUserId)

    return NextResponse.json({ conversationId })
  } catch (err) {
    console.error('[conversations] POST unexpected', err)
    return NextResponse.json({ error: 'Erro ao iniciar conversa.' }, { status: 500 })
  }
}

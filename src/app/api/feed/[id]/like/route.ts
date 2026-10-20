/**
 * POST /api/feed/[id]/like
 * Alterna a reação do usuário logado num post do feed.
 * Resposta: { ok, liked, reactionCount }
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

    const { data: existente } = await supabase
      .from('feed_reactions')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    let liked: boolean
    if (existente) {
      await supabase.from('feed_reactions').delete().eq('id', existente.id)
      liked = false
    } else {
      const { error } = await supabase.from('feed_reactions').insert({ post_id: id, user_id: user.id })
      if (error) {
        console.error('[feed/id/like] insert', error)
        return NextResponse.json({ error: 'Erro ao reagir.' }, { status: 500 })
      }
      liked = true
    }

    const { count } = await createAdminClient()
      .from('feed_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)

    return NextResponse.json({ ok: true, liked, reactionCount: count ?? 0 })
  } catch (err) {
    console.error('[feed/id/like] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

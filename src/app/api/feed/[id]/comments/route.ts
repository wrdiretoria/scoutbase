/**
 * GET /api/feed/[id]/comments
 * Lista comentários de um post, mais antigos primeiro, com { id, nome, avatarUrl } do autor.
 *
 * POST /api/feed/[id]/comments
 * Cria um comentário. Body: { body }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: comentarios, error } = await admin
      .from('feed_comments')
      .select('id, user_id, body, created_at')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[feed/id/comments] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar comentários.' }, { status: 500 })
    }

    const rows = comentarios ?? []
    const userIds = Array.from(new Set(rows.map(c => c.user_id)))
    const { data: autores } = userIds.length > 0
      ? await admin.from('profiles').select('id, nome, avatar_url').in('id', userIds)
      : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
    const autorPorId = new Map((autores ?? []).map(a => [a.id, { id: a.id, nome: a.nome, avatarUrl: a.avatar_url }]))

    return NextResponse.json({
      comments: rows.map(c => ({ ...c, author: autorPorId.get(c.user_id) ?? null })),
    })
  } catch (err) {
    console.error('[feed/id/comments] GET unexpected', err)
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
    if (!body?.trim()) return NextResponse.json({ error: 'Escreva um comentário.' }, { status: 400 })

    const { data: comentario, error } = await supabase
      .from('feed_comments')
      .insert({ post_id: id, user_id: user.id, body: body.trim() })
      .select('id, user_id, body, created_at')
      .single()

    if (error) {
      console.error('[feed/id/comments] POST', error)
      return NextResponse.json({ error: 'Erro ao comentar.' }, { status: 500 })
    }

    const { data: autor } = await createAdminClient().from('profiles').select('id, nome, avatar_url').eq('id', user.id).maybeSingle()

    return NextResponse.json({
      ok: true,
      comment: { ...comentario, author: autor ? { id: autor.id, nome: autor.nome, avatarUrl: autor.avatar_url } : null },
    })
  } catch (err) {
    console.error('[feed/id/comments] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

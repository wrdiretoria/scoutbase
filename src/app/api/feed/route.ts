/**
 * GET /api/feed?offset=&limit=
 * Lista feed_posts da rede do usuário logado (conexões aceitas + quem ele segue
 * + ele mesmo), mais recentes primeiro, paginado. Resposta: { posts, hasMore }
 *
 * POST /api/feed
 * Cria um post tipo 'update'. Body: { body }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { getNetworkIds } from '@/lib/network'

const AUTHOR_TYPES_VALIDOS = ['atleta', 'treinador', 'scout', 'clube']

type FeedPostRow = {
  id: string
  author_id: string
  author_type: string
  type: string
  body: string
  media_url: string | null
  opportunity_id: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10) || 0, 0)
    const limit  = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10) || 10, 1), 30)

    const admin = createAdminClient()
    const networkIds = await getNetworkIds(admin, user.id)

    const { data: posts, error, count } = await admin
      .from('feed_posts')
      .select('id, author_id, author_type, type, body, media_url, opportunity_id, created_at', { count: 'exact' })
      .in('author_id', networkIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[feed] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar o feed.' }, { status: 500 })
    }

    const rows = (posts ?? []) as FeedPostRow[]

    const autorIds = Array.from(new Set(rows.map(p => p.author_id)))
    const opportunityIds = Array.from(new Set(rows.map(p => p.opportunity_id).filter((v): v is string => !!v)))

    const [{ data: autores }, { data: oportunidades }, { data: reacoes }, { data: comentarios }, { data: minhasReacoes }] = await Promise.all([
      autorIds.length > 0
        ? admin.from('profiles').select('id, nome, avatar_url').in('id', autorIds)
        : Promise.resolve({ data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }),
      opportunityIds.length > 0
        ? admin.from('opportunities').select('id, title, position, category, city').in('id', opportunityIds)
        : Promise.resolve({ data: [] as { id: string; title: string; position: string | null; category: string | null; city: string | null }[] }),
      rows.length > 0
        ? admin.from('feed_reactions').select('post_id').in('post_id', rows.map(p => p.id))
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      rows.length > 0
        ? admin.from('feed_comments').select('post_id').in('post_id', rows.map(p => p.id))
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      rows.length > 0
        ? admin.from('feed_reactions').select('post_id').eq('user_id', user.id).in('post_id', rows.map(p => p.id))
        : Promise.resolve({ data: [] as { post_id: string }[] }),
    ])

    const autorPorId = new Map((autores ?? []).map(a => [a.id, { id: a.id, nome: a.nome, avatarUrl: a.avatar_url }]))
    const oportunidadePorId = new Map((oportunidades ?? []).map(o => [o.id, o]))

    const contarPorPost = (linhas: { post_id: string }[] | null) => {
      const mapa = new Map<string, number>()
      for (const l of linhas ?? []) mapa.set(l.post_id, (mapa.get(l.post_id) ?? 0) + 1)
      return mapa
    }
    const reacoesPorPost    = contarPorPost(reacoes)
    const comentariosPorPost = contarPorPost(comentarios)
    const reagidosPeloUsuario = new Set((minhasReacoes ?? []).map(r => r.post_id))

    return NextResponse.json({
      posts: rows.map(p => ({
        ...p,
        author:          autorPorId.get(p.author_id) ?? null,
        opportunity:     p.opportunity_id ? (oportunidadePorId.get(p.opportunity_id) ?? null) : null,
        reactionCount:   reacoesPorPost.get(p.id) ?? 0,
        commentCount:    comentariosPorPost.get(p.id) ?? 0,
        reactedByMe:     reagidosPeloUsuario.has(p.id),
      })),
      hasMore: offset + limit < (count ?? 0),
    })
  } catch (err) {
    console.error('[feed] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { body } = await req.json() as { body?: string }
    if (!body?.trim()) return NextResponse.json({ error: 'Escreva algo para publicar.' }, { status: 400 })

    const tipo = (user.user_metadata?.tipo as string | undefined) ?? ''
    const authorType = AUTHOR_TYPES_VALIDOS.includes(tipo) ? tipo : null
    if (!authorType) {
      return NextResponse.json({ error: 'Seu tipo de conta ainda não pode publicar no feed.' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('feed_posts')
      .insert({ author_id: user.id, author_type: authorType, type: 'update', body: body.trim() })
      .select('id, author_id, author_type, type, body, media_url, opportunity_id, created_at')
      .single()

    if (error) {
      console.error('[feed] POST', error)
      return NextResponse.json({ error: 'Erro ao publicar.' }, { status: 500 })
    }

    const { data: autor } = await createAdminClient().from('profiles').select('id, nome, avatar_url').eq('id', user.id).maybeSingle()

    return NextResponse.json({
      ok: true,
      post: {
        ...post,
        author: autor ? { id: autor.id, nome: autor.nome, avatarUrl: autor.avatar_url } : null,
        opportunity: null,
        reactionCount: 0,
        commentCount: 0,
        reactedByMe: false,
      },
    })
  } catch (err) {
    console.error('[feed] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

/**
 * GET /api/recommendations?subjectId=...&limit=...
 * Lista recomendações públicas de um perfil, mais recentes primeiro, enriquecidas
 * com { id, nome, avatarUrl } do autor e se o visitante atual já reagiu "útil".
 * Resposta: { recommendations, total }
 *
 * POST /api/recommendations
 * Cria uma recomendação. Body: { subjectId, roleLabel?, body }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

type RecomendacaoRow = {
  id: string
  author_id: string
  subject_id: string
  role_label: string | null
  body: string
  created_at: string
  helpful_count: number
}

export async function GET(req: NextRequest) {
  try {
    const subjectId = req.nextUrl.searchParams.get('subjectId')
    const limitParam = req.nextUrl.searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 100) : 100

    if (!subjectId) return NextResponse.json({ error: 'subjectId é obrigatório.' }, { status: 400 })

    const admin = createAdminClient()

    const { data: recomendacoes, error, count } = await admin
      .from('recommendations')
      .select('id, author_id, subject_id, role_label, body, created_at, helpful_count', { count: 'exact' })
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[recommendations] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar recomendações.' }, { status: 500 })
    }

    const rows = (recomendacoes ?? []) as RecomendacaoRow[]

    const authorIds = Array.from(new Set(rows.map(r => r.author_id)))
    const { data: autores } = authorIds.length > 0
      ? await admin.from('profiles').select('id, nome, avatar_url').in('id', authorIds)
      : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
    const autorPorId = new Map((autores ?? []).map(a => [a.id, { id: a.id, nome: a.nome, avatarUrl: a.avatar_url }]))

    // Reações do visitante atual (se logado), para marcar os cards já curtidos
    let idsReagidosPeloVisitante = new Set<string>()
    const supabase = await createServerClient()
    const { data: { user: visitante } } = await supabase.auth.getUser()
    if (visitante && rows.length > 0) {
      const { data: reacoes } = await admin
        .from('recommendation_reactions')
        .select('recommendation_id')
        .eq('user_id', visitante.id)
        .in('recommendation_id', rows.map(r => r.id))
      idsReagidosPeloVisitante = new Set((reacoes ?? []).map(r => r.recommendation_id as string))
    }

    return NextResponse.json({
      recommendations: rows.map(r => ({
        ...r,
        author: autorPorId.get(r.author_id) ?? null,
        reactedByMe: idsReagidosPeloVisitante.has(r.id),
      })),
      total: count ?? rows.length,
    })
  } catch (err) {
    console.error('[recommendations] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { subjectId, roleLabel, body } = await req.json() as {
      subjectId?: string
      roleLabel?: string
      body?: string
    }

    if (!subjectId?.trim()) return NextResponse.json({ error: 'subjectId é obrigatório.' }, { status: 400 })
    if (!body?.trim())      return NextResponse.json({ error: 'Escreva o texto da recomendação.' }, { status: 400 })
    if (subjectId === user.id) {
      return NextResponse.json({ error: 'Você não pode recomendar a si mesmo.' }, { status: 400 })
    }

    const { data: recomendacao, error } = await supabase
      .from('recommendations')
      .insert({
        author_id:  user.id,
        subject_id: subjectId,
        role_label: roleLabel?.trim() || null,
        body:       body.trim(),
      })
      .select('id, author_id, subject_id, role_label, body, created_at, helpful_count')
      .single()

    if (error) {
      console.error('[recommendations] POST', error)
      return NextResponse.json({ error: 'Erro ao salvar recomendação.' }, { status: 500 })
    }

    const { data: autor } = await createAdminClient().from('profiles').select('id, nome, avatar_url').eq('id', user.id).maybeSingle()

    return NextResponse.json({
      ok: true,
      recomendacao: {
        ...recomendacao,
        author: autor ? { id: autor.id, nome: autor.nome, avatarUrl: autor.avatar_url } : null,
        reactedByMe: false,
      },
    })
  } catch (err) {
    console.error('[recommendations] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

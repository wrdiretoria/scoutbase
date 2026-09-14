/**
 * GET /api/opportunities?clubId=&position=&category=&city=&status=
 * Lista vagas. Sem `status`, mostra só as abertas (marketplace público).
 * `status=closed` filtra só fechadas; `status=all` não filtra (usado pelo
 * dono no dashboard, que precisa ver as próprias vagas fechadas também).
 * `city` faz busca parcial (ilike). Resposta: { opportunities }
 *
 * POST /api/opportunities
 * Cria uma vaga. Body: { title, position?, category?, city?, description? }
 * Só treinador/escola pode criar — club_id = o próprio auth.uid().
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

function ehTreinador(meta: Record<string, unknown>) {
  return meta.tipo === 'treinador' || meta.tipo === 'escola'
    || (!meta.posicao && !meta.athlete_id && (meta.clube_atual || meta.especialidade || meta.anos_exp || meta.certificacoes || meta.clubes_trabalhados))
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const clubId   = params.get('clubId')
    const position = params.get('position')
    const category = params.get('category')
    const city     = params.get('city')
    const status   = params.get('status')

    const admin = createAdminClient()
    let query = admin
      .from('opportunities')
      .select('id, club_id, title, position, category, city, description, status, created_at')
      .order('created_at', { ascending: false })

    if (clubId)   query = query.eq('club_id', clubId)
    if (position) query = query.eq('position', position)
    if (category) query = query.eq('category', category)
    if (city)     query = query.ilike('city', `%${city}%`)

    if (status === 'closed') query = query.eq('status', 'closed')
    else if (status !== 'all') query = query.eq('status', 'open')

    const { data: vagas, error } = await query
    if (error) {
      console.error('[opportunities] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar vagas.' }, { status: 500 })
    }

    const rows = vagas ?? []
    const clubIds = Array.from(new Set(rows.map(v => v.club_id)))
    const { data: clubes } = clubIds.length > 0
      ? await admin.from('profiles').select('id, nome, avatar_url').in('id', clubIds)
      : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
    const clubePorId = new Map((clubes ?? []).map(c => [c.id, { id: c.id, nome: c.nome, avatarUrl: c.avatar_url }]))

    return NextResponse.json({
      opportunities: rows.map(v => ({ ...v, club: clubePorId.get(v.club_id) ?? null })),
    })
  } catch (err) {
    console.error('[opportunities] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    if (!ehTreinador(user.user_metadata ?? {})) {
      return NextResponse.json({ error: 'Apenas treinadores/escolinhas podem publicar vagas.' }, { status: 403 })
    }

    const { title, position, category, city, description } = await req.json() as {
      title?: string; position?: string; category?: string; city?: string; description?: string
    }
    if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })

    const { data: vaga, error } = await supabase
      .from('opportunities')
      .insert({
        club_id:     user.id,
        title:       title.trim(),
        position:    position?.trim() || null,
        category:    category?.trim() || null,
        city:        city?.trim() || null,
        description: description?.trim() || null,
      })
      .select('id, club_id, title, position, category, city, description, status, created_at')
      .single()

    if (error) {
      console.error('[opportunities] POST', error)
      return NextResponse.json({ error: 'Erro ao criar vaga.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, opportunity: vaga })
  } catch (err) {
    console.error('[opportunities] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

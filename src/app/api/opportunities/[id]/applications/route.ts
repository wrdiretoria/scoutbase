/**
 * GET /api/opportunities/[id]/applications
 * Lista candidaturas da vaga, com { id, nome, avatarUrl } do atleta. Só o
 * dono da vaga (club_id = auth.uid()) pode ver.
 * Resposta: { applications }
 *
 * POST /api/opportunities/[id]/applications
 * Candidata o atleta logado à vaga. Bloqueia duplicata (unique constraint).
 */
import { categoriaDoAtleta } from '@/lib/categoria'
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

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

    const { data: vaga } = await admin.from('opportunities').select('id, club_id').eq('id', id).maybeSingle()
    if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
    if (vaga.club_id !== user.id) return NextResponse.json({ error: 'Apenas o dono da vaga pode ver os candidatos.' }, { status: 403 })

    const { data: candidaturas, error } = await admin
      .from('opportunity_applications')
      .select('id, athlete_id, status, created_at')
      .eq('opportunity_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[opportunities/id/applications] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar candidaturas.' }, { status: 500 })
    }

    const rows = candidaturas ?? []
    const athleteIds = [...new Set(rows.map(c => c.athlete_id))]
    const atletaPorId = new Map<string, {
      id: string; nome: string | null; avatarUrl: string | null; athleteId: string | null
      position: string | null; category: string | null
    }>()

    // A posição está no perfil de autenticação. Limita as consultas simultâneas.
    for (let index = 0; index < athleteIds.length; index += 12) {
      const ids = athleteIds.slice(index, index + 12)
      const [profiles, accounts] = await Promise.all([
        admin.from('profiles').select('id, nome, avatar_url, athlete_id, data_nascimento').in('id', ids),
        Promise.all(ids.map(athleteId => admin.auth.admin.getUserById(athleteId))),
      ])
      if (profiles.error) throw profiles.error
      const positions = new Map<string, string>()
      for (const { data, error: accountError } of accounts) {
        if (accountError && accountError.status !== 404) throw accountError
        const athlete = data?.user
        const position = athlete?.user_metadata?.posicao
        if (athlete && typeof position === 'string' && position.trim()) {
          positions.set(athlete.id, position.trim())
        }
      }
      for (const profile of profiles.data ?? []) {
        atletaPorId.set(profile.id, {
          id: profile.id,
          nome: profile.nome,
          avatarUrl: profile.avatar_url,
          athleteId: profile.athlete_id,
          position: positions.get(profile.id) ?? null,
          category: categoriaDoAtleta(profile.data_nascimento),
        })
      }
    }

    return NextResponse.json({
      applications: rows.map(c => ({ ...c, athlete: atletaPorId.get(c.athlete_id) ?? null })),
    })
  } catch (err) {
    console.error('[opportunities/id/applications] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

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

    if (user.user_metadata?.tipo !== 'atleta') {
      return NextResponse.json({ error: 'Apenas atletas podem se candidatar.' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: vaga } = await admin.from('opportunities').select('id, status').eq('id', id).maybeSingle()
    if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
    if (vaga.status !== 'open') return NextResponse.json({ error: 'Esta vaga não está mais aberta.' }, { status: 400 })

    const { data: candidatura, error } = await supabase
      .from('opportunity_applications')
      .insert({ opportunity_id: id, athlete_id: user.id })
      .select('id, athlete_id, status, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Você já se candidatou a esta vaga.' }, { status: 409 })
      }
      console.error('[opportunities/id/applications] POST', error)
      return NextResponse.json({ error: 'Erro ao se candidatar.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, application: candidatura })
  } catch (err) {
    console.error('[opportunities/id/applications] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

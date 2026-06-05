import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 30

export type HeroAtleta = {
  id:         string
  nome:       string
  posicao:    string
  cidade:     string
  ovr:        number | null
  tipo:       'avaliado' | 'novo'
  ts:         string
  fotos:      string[]
  athleteId:  string | null
}

export async function GET() {
  try {
    const admin = createAdminClient()

    // Últimas 20 avaliações com scout_score
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, scout_score, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    // Últimos 15 cadastros de atletas
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nome, athlete_id, created_at, fotos')
      .not('athlete_id', 'is', null)
      .not('nome', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15)

    // Mapa: userId → OVR
    const ovrMap = new Map<string, number>()
    for (const av of avs ?? []) {
      if (!ovrMap.has(av.aluno_id as string)) {
        ovrMap.set(av.aluno_id as string, av.scout_score as number)
      }
    }

    // Posição e cidade via user_metadata — busca apenas os IDs que aparecem no resultado
    const idsNecessarios = [
      ...new Set([
        ...(avs ?? []).map(a => a.aluno_id as string),
        ...(profiles ?? []).map(p => p.id as string),
      ]),
    ]
    const posMap    = new Map<string, string>()
    const cidadeMap = new Map<string, string>()
    await Promise.all(
      idsNecessarios.map(async (id) => {
        const { data: { user } } = await admin.auth.admin.getUserById(id)
        if (!user) return
        const pos    = user.user_metadata?.posicao as string | undefined
        const cidade = user.user_metadata?.cidade  as string | undefined
        if (pos)    posMap.set(id, pos)
        if (cidade) cidadeMap.set(id, cidade)
      })
    )

    const items: HeroAtleta[] = []

    // Atletas avaliados primeiro
    const avsIds = [...new Set((avs ?? []).map(a => a.aluno_id as string))]
    const profileMap = new Map((profiles ?? []).map(p => [p.id as string, p]))

    for (const id of avsIds) {
      const p    = profileMap.get(id)
      const nome = p?.nome as string | undefined
      if (!nome) continue
      const fotosArr = p?.fotos as (string | null)[] | null
      items.push({
        id,
        nome,
        posicao:   posMap.get(id) ?? '',
        cidade:    cidadeMap.get(id) ?? '',
        ovr:       ovrMap.get(id) ?? null,
        tipo:      'avaliado',
        ts:        (avs ?? []).find(a => a.aluno_id === id)?.created_at as string ?? '',
        fotos:     (fotosArr ?? []).filter((f): f is string => !!f),
        athleteId: (p?.athlete_id as string | null) ?? null,
      })
    }

    // Novos cadastros que ainda não apareceram
    for (const p of profiles ?? []) {
      const id = p.id as string
      if (items.find(i => i.id === id)) continue
      const aid = p.athlete_id as string
      if (!aid?.startsWith('MC-')) continue
      const fotosNArr = p.fotos as (string | null)[] | null
      items.push({
        id,
        nome:      p.nome as string,
        posicao:   posMap.get(id) ?? '',
        cidade:    cidadeMap.get(id) ?? '',
        ovr:       null,
        tipo:      'novo',
        ts:        p.created_at as string,
        fotos:     (fotosNArr ?? []).filter((f): f is string => !!f),
        athleteId: aid,
      })
    }

    return NextResponse.json({ items: items.slice(0, 24) }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[landing/atletas]', err)
    return NextResponse.json({ items: [] })
  }
}

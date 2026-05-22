import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 0

export type FeedEvent = {
  id:            string
  tipo:          'join' | 'avaliacao'
  nome:          string
  posicao:       string
  cidade:        string
  ovr:           number | null
  treinadorNome: string | null
  fotos:         string[]      // galeria do atleta para o carrossel
  ts:            string        // ISO 8601
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')          // ISO date — pagina antes deste ts
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '8'), 30)
    const fetch  = limit + 5                           // busca extra para determinar hasMore

    const admin = createAdminClient()

    // ── Queries paralelas ─────────────────────────────────────────────────────
    const profQ = admin
      .from('profiles')
      .select('id, nome, cidade, fotos, athlete_id, created_at')
      .not('athlete_id', 'is', null)
      .not('nome',       'is', null)
      .order('created_at', { ascending: false })
      .limit(fetch)

    const avsQ = admin
      .from('avaliacoes')
      .select('id, aluno_id, professor_id, scout_score, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(fetch)

    if (cursor) {
      profQ.lt('created_at', cursor)
      avsQ.lt( 'created_at', cursor)
    }

    const [{ data: profiles }, { data: avs }] = await Promise.all([profQ, avsQ])

    // ── Resolução de nomes e fotos (para eventos de avaliação) ─────────────
    const userIds = new Set<string>()
    for (const av of avs ?? []) {
      userIds.add(av.aluno_id   as string)
      userIds.add(av.professor_id as string)
    }

    const [profilesExtra, authData] = await Promise.all([
      userIds.size > 0
        ? admin.from('profiles').select('id, nome, cidade, fotos').in('id', [...userIds])
        : Promise.resolve({ data: [] as { id: string; nome: unknown; cidade: unknown; fotos: unknown }[] }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ])

    // posMap: userId → posicao
    const posMap = new Map<string, string>()
    for (const u of authData.data?.users ?? []) {
      if (u.user_metadata?.posicao) posMap.set(u.id, u.user_metadata.posicao as string)
    }

    // extraMap: userId → { nome, cidade, fotos }
    const extraMap = new Map<string, { nome: string; cidade: string; fotos: string[] }>()
    for (const p of profilesExtra.data ?? []) {
      const fotosArr = p.fotos as (string | null)[] | null
      extraMap.set(p.id as string, {
        nome:   (p.nome  as string)  ?? 'Atleta',
        cidade: (p.cidade as string) ?? '',
        fotos:  (fotosArr ?? []).filter((f): f is string => !!f),
      })
    }

    const events: FeedEvent[] = []

    // ── Eventos de cadastro ───────────────────────────────────────────────────
    for (const p of profiles ?? []) {
      if (!(p.athlete_id as string).startsWith('MC-')) continue
      const fotosArr = p.fotos as (string | null)[] | null
      events.push({
        id:            `join-${p.id as string}`,
        tipo:          'join',
        nome:          (p.nome   as string) ?? 'Atleta',
        posicao:       posMap.get(p.id as string) ?? '',
        cidade:        (p.cidade as string) ?? '',
        ovr:           null,
        treinadorNome: null,
        fotos:         (fotosArr ?? []).filter((f): f is string => !!f),
        ts:            p.created_at as string,
      })
    }

    // ── Eventos de avaliação ──────────────────────────────────────────────────
    for (const av of avs ?? []) {
      const atleta   = extraMap.get(av.aluno_id    as string)
      const treinador = extraMap.get(av.professor_id as string)
      events.push({
        id:            `av-${av.id as string}`,
        tipo:          'avaliacao',
        nome:          atleta?.nome   ?? 'Atleta',
        posicao:       posMap.get(av.aluno_id as string) ?? '',
        cidade:        atleta?.cidade ?? '',
        ovr:           av.scout_score as number,
        treinadorNome: treinador?.nome ?? null,
        fotos:         atleta?.fotos ?? [],
        ts:            av.created_at as string,
      })
    }

    // ── Ordena e pagina ───────────────────────────────────────────────────────
    events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    const hasMore = events.length > limit
    const result  = events.slice(0, limit)

    return NextResponse.json({ events: result, hasMore }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ events: [], hasMore: false })
  }
}

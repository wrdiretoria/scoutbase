import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'

export const revalidate = 0

// ── Tipos exportados (usados pelo componente LiveFeed) ─────────────────────────

export type FeedEvent = {
  id:            string
  atletaId:      string        // UUID do atleta → /jogador/:atletaId
  mcId:          string | null // MC-XXXXX para exibição
  tipo:          'join' | 'avaliacao'
  nome:          string
  posicao:       string
  cidade:        string
  ovr:           number | null
  atributos:     { vel: number | null; fin: number | null; tec: number | null; vis: number | null; forca: number | null; pos: number | null } | null
  treinadorNome: string | null
  fotos:         string[]
  ts:            string        // ISO 8601
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), 30)
  const fetchN = limit + 5   // busca extra para calcular hasMore

  const admin  = createAdminClient()
  const events: FeedEvent[] = []

  try {

    // ── 0. OVR composto real (perfil + avaliação) keyed por UUID ────────────
    const ovrByUuid = await fetchOvrMapByUuid(admin)

    // ── 1. Avaliações (fonte principal dos eventos) ───────────────────────────
    let avsQ = admin
      .from('avaliacoes')
      .select('id, aluno_id, professor_id, scout_score, velocidade, forca, finalizacao, visao_jogo, posicionamento, tecnica, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(fetchN)
    if (cursor) avsQ = avsQ.lt('created_at', cursor)

    const { data: avs, error: avsErr } = await avsQ
    if (avsErr) console.error('[livefeed] avaliacoes:', avsErr.message)

    // ── 2. Cadastros recentes (todos os profiles com nome, ordenados por data) ──
    let profQ = admin
      .from('profiles')
      .select('id, nome, fotos, avatar_url, athlete_id, criado_em')
      .not('nome', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(fetchN)
    if (cursor) profQ = profQ.lt('criado_em', cursor)

    const { data: profiles, error: profErr } = await profQ
    if (profErr) console.error('[livefeed] profiles:', profErr.message)

    // ── 3. Nomes e fotos dos atletas / treinadores nas avaliações ────────────
    const userIds = new Set<string>()
    for (const av of avs ?? []) {
      userIds.add(av.aluno_id    as string)
      userIds.add(av.professor_id as string)
    }

    const extraMap = new Map<string, { nome: string; fotos: string[]; mcId: string | null }>()

    if (userIds.size > 0) {
      const { data: extra, error: extraErr } = await admin
        .from('profiles')
        .select('id, nome, fotos, avatar_url, athlete_id')
        .in('id', [...userIds])
      if (extraErr) console.error('[livefeed] extra profiles:', extraErr.message)

      for (const p of extra ?? []) {
        const raw       = (p.fotos      as (string | null)[] | null) ?? []
        const fotosArr  = raw.filter((f): f is string => !!f)
        const avatarUrl = (p.avatar_url as string | null) ?? null
        extraMap.set(p.id as string, {
          nome:  (p.nome       as string | null) ?? 'Atleta',
          fotos: fotosArr.length > 0 ? fotosArr : (avatarUrl ? [avatarUrl] : []),
          mcId:  (p.athlete_id as string | null) ?? null,
        })
      }
    }

    // ── 4. Monta eventos de cadastro (join) ───────────────────────────────────
    for (const p of profiles ?? []) {
      const aid = (p.athlete_id as string | null) ?? null

      const raw       = (p.fotos      as (string | null)[] | null) ?? []
      const fotosArr  = raw.filter((f): f is string => !!f)
      const avatarUrl = (p.avatar_url as string | null) ?? null
      events.push({
        id:            `join-${p.id as string}`,
        atletaId:      p.id as string,
        mcId:          aid?.startsWith('MC-') ? aid : null,
        tipo:          'join',
        nome:          (p.nome as string | null) ?? 'Atleta',
        posicao:       '',
        cidade:        '',
        ovr:           ovrByUuid.get(p.id as string) ?? null,
        atributos:     null,
        treinadorNome: null,
        fotos:         fotosArr.length > 0 ? fotosArr : (avatarUrl ? [avatarUrl] : []),
        // criado_em pode ser null em perfis antigos — usa agora como fallback
        ts: (p.criado_em as string | null) ?? new Date().toISOString(),
      })
    }

    // ── 5. Monta eventos de avaliação ─────────────────────────────────────────
    for (const av of avs ?? []) {
      const atleta    = extraMap.get(av.aluno_id    as string)
      const treinador = extraMap.get(av.professor_id as string)
      events.push({
        id:            `av-${av.id as string}`,
        atletaId:      av.aluno_id as string,
        mcId:          atleta?.mcId ?? null,
        tipo:          'avaliacao',
        nome:          atleta?.nome  ?? 'Atleta',
        posicao:       '',
        cidade:        '',
        ovr:           ovrByUuid.get(av.aluno_id as string) ?? null,
        atributos:     {
          vel:   (av.velocidade     as number | null) ?? null,
          fin:   (av.finalizacao    as number | null) ?? null,
          tec:   (av.tecnica        as number | null) ?? null,
          vis:   (av.visao_jogo     as number | null) ?? null,
          forca: (av.forca          as number | null) ?? null,
          pos:   (av.posicionamento as number | null) ?? null,
        },
        treinadorNome: treinador?.nome ?? null,
        fotos:         atleta?.fotos  ?? [],
        ts:            av.created_at  as string,
      })
    }

  } catch (err) {
    // Loga no Vercel Functions para diagnóstico — não bloqueia resposta
    console.error('[livefeed] unexpected error:', err)
  }

  // ── Ordena, pagina e retorna ──────────────────────────────────────────────
  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  const hasMore = events.length > limit
  const result  = events.slice(0, limit)

  return NextResponse.json({ events: result, hasMore }, {
    headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' },
  })
}

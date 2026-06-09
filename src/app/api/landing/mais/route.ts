import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'

export const dynamic = 'force-dynamic'

export type AtributosCard = { vel: number | null; tec: number | null; dri: number | null; fis: number | null; tat: number | null; pos: number | null } | null

export type MaisCard = {
  id:         string
  nome:       string
  posicao:    string | null
  athlete_id: string | null
  foto:       string | null
  ovr:        number | null
  categoria:  string | null
  atributos:  AtributosCard
}

function calcCategoria(dataNasc: string | null): string | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo   = searchParams.get('tipo') ?? 'destaques'
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const limit  = parseInt(searchParams.get('limit')  ?? '6',  10)

  try {
    const admin = createAdminClient()

    // ── DESTAQUES: top OVR ─────────────────────────────────────────────────────
    if (tipo === 'destaques') {
      const [ovrByUuid, profilesRes] = await Promise.all([
        fetchOvrMapByUuid(admin),
        admin
          .from('profiles')
          .select('id, nome, posicao, athlete_id, avatar_url, fotos, data_nascimento')
          .like('athlete_id', 'MC-%')
          .limit(200),
      ])
      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null; posicao: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; data_nascimento: string | null
      }[]

      const sorted = profiles
        .map(p => ({ ...p, ovr: ovrByUuid.get(p.id) ?? null }))
        .filter(p => p.ovr !== null)
        .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))

      const page = sorted.slice(offset, offset + limit)
      const hasMore = sorted.length > offset + limit

      // Busca atributos da avaliação mais recente para cada atleta
      const pageIds = page.map(p => p.id)
      const { data: avsData } = await admin
        .from('avaliacoes')
        .select('aluno_id, velocidade, tecnica, finalizacao, forca, visao_jogo, posicionamento, created_at')
        .in('aluno_id', pageIds)
        .not('scout_score', 'is', null)
        .order('created_at', { ascending: false })
      const avsRows = (avsData ?? []) as { aluno_id: string; velocidade: number | null; tecnica: number | null; finalizacao: number | null; forca: number | null; visao_jogo: number | null; posicionamento: number | null }[]
      // Pega apenas a mais recente por atleta
      const atributosMap = new Map<string, AtributosCard>()
      for (const av of avsRows) {
        if (!atributosMap.has(av.aluno_id)) {
          atributosMap.set(av.aluno_id, { vel: av.velocidade, tec: av.tecnica, dri: av.finalizacao, fis: av.forca, tat: av.visao_jogo, pos: av.posicionamento })
        }
      }

      const items: MaisCard[] = page.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        return {
          id: p.id,
          nome: p.nome ?? 'Atleta',
          posicao: p.posicao ?? null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr: p.ovr,
          categoria: calcCategoria(p.data_nascimento),
          atributos: atributosMap.get(p.id) ?? null,
        }
      })

      return NextResponse.json({ items, hasMore })
    }

    // ── VISITADOS: mais visitas ────────────────────────────────────────────────
    if (tipo === 'visitados') {
      const { data: visitasData } = await admin.from('visitas').select('atleta_id')
      const countMap = new Map<string, number>()
      for (const row of (visitasData ?? []) as { atleta_id: string }[]) {
        if (!row.atleta_id) continue
        countMap.set(row.atleta_id, (countMap.get(row.atleta_id) ?? 0) + 1)
      }

      const sortedIds = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)

      const pageIds = sortedIds.slice(offset, offset + limit)
      const hasMore = sortedIds.length > offset + limit

      if (pageIds.length === 0) return NextResponse.json({ items: [], hasMore: false })

      const [profilesRes, ovrByUuid] = await Promise.all([
        admin.from('profiles').select('id, nome, posicao, athlete_id, avatar_url, fotos').in('id', pageIds),
        fetchOvrMapByUuid(admin),
      ])

      const profileMap = new Map(
        ((profilesRes.data ?? []) as { id: string; nome: string | null; posicao: string | null; athlete_id: string | null; avatar_url: string | null; fotos: (string | null)[] | null }[])
          .map(p => [p.id, p])
      )

      const items: MaisCard[] = pageIds
        .flatMap(id => {
          const p = profileMap.get(id)
          if (!p) return []
          const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
          const card: MaisCard = {
            id: p.id,
            nome: p.nome ?? 'Atleta',
            posicao: p.posicao ?? null,
            athlete_id: p.athlete_id,
            foto: fotos[0] ?? p.avatar_url ?? null,
            ovr: ovrByUuid.get(p.id) ?? null,
            categoria: null,
            atributos: null,
          }
          return [card]
        })

      return NextResponse.json({ items, hasMore })
    }

    // ── NOVOS: mais recentes ───────────────────────────────────────────────────
    if (tipo === 'novos') {
      const [ovrByUuid, profilesRes] = await Promise.all([
        fetchOvrMapByUuid(admin),
        admin
          .from('profiles')
          .select('id, nome, posicao, athlete_id, avatar_url, fotos, criado_em')
          .like('athlete_id', 'MC-%')
          .order('criado_em', { ascending: false })
          .range(offset, offset + limit - 1),
      ])

      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null; posicao: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; criado_em: string | null
      }[]

      // Verifica se tem mais (busca 1 a mais)
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .like('athlete_id', 'MC-%')

      const hasMore = (count ?? 0) > offset + limit

      const items: MaisCard[] = profiles.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        return {
          id: p.id,
          nome: p.nome ?? 'Atleta',
          posicao: p.posicao ?? null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr: ovrByUuid.get(p.id) ?? null,
          categoria: null,
          atributos: null,
        }
      })

      return NextResponse.json({ items, hasMore })
    }

    return NextResponse.json({ items: [], hasMore: false })
  } catch (err) {
    console.error('[landing/mais]', err)
    return NextResponse.json({ items: [], hasMore: false })
  }
}

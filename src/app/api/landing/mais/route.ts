import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'

export const dynamic = 'force-dynamic'

export type MaisCard = {
  id:         string
  nome:       string
  posicao:    string | null
  athlete_id: string | null
  foto:       string | null
  ovr:        number | null
  categoria:  string | null
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
          .select('id, nome, athlete_id, avatar_url, fotos, data_nascimento')
          .like('athlete_id', 'MC-%')
          .limit(200),
      ])
      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; data_nascimento: string | null
      }[]

      const sorted = profiles
        .map(p => ({ ...p, ovr: ovrByUuid.get(p.id) ?? null }))
        .filter(p => p.ovr !== null)
        .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))

      const page = sorted.slice(offset, offset + limit)
      const hasMore = sorted.length > offset + limit

      const items: MaisCard[] = page.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        return {
          id: p.id,
          nome: p.nome ?? 'Atleta',
          posicao: null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr: p.ovr,
          categoria: calcCategoria(p.data_nascimento),
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
        admin.from('profiles').select('id, nome, athlete_id, avatar_url, fotos').in('id', pageIds),
        fetchOvrMapByUuid(admin),
      ])

      const profileMap = new Map(
        ((profilesRes.data ?? []) as { id: string; nome: string | null; athlete_id: string | null; avatar_url: string | null; fotos: (string | null)[] | null }[])
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
            posicao: null,
            athlete_id: p.athlete_id,
            foto: fotos[0] ?? p.avatar_url ?? null,
            ovr: ovrByUuid.get(p.id) ?? null,
            categoria: null,
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
          .select('id, nome, athlete_id, avatar_url, fotos, criado_em')
          .like('athlete_id', 'MC-%')
          .order('criado_em', { ascending: false })
          .range(offset, offset + limit - 1),
      ])

      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null
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
          posicao: null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr: ovrByUuid.get(p.id) ?? null,
          categoria: null,
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

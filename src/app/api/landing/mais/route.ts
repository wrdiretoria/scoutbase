import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import { categoriaDoAtleta } from '@/lib/categoria'

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


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo   = searchParams.get('tipo') ?? 'destaques'
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const limit  = parseInt(searchParams.get('limit')  ?? '6',  10)

  try {
    const admin = createAdminClient()

    // ── DESTAQUES: top OVR (OVR oficial, cacheado 60s) ───────────────────────────
    if (tipo === 'destaques') {
      const [profilesRes, ovrByUuid] = await Promise.all([
        admin
          .from('profiles')
          .select('id, nome, athlete_id, avatar_url, fotos, data_nascimento')
          .like('athlete_id', 'MC-%')
          .limit(500),
        fetchOvrMapByUuid(admin),
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
          categoria: categoriaDoAtleta(p.data_nascimento),
        }
      })

      return NextResponse.json({ items, hasMore })
    }

    // ── VISITADOS: todos ordenados por visitas desc ───────────────────────────
    if (tipo === 'visitados') {
      const [visitasRes, profilesRes, ovrByUuid] = await Promise.all([
        admin.from('visitas').select('atleta_id'),
        admin.from('profiles').select('id, nome, athlete_id, avatar_url, fotos, criado_em').like('athlete_id', 'MC-%').order('criado_em', { ascending: false }),
        fetchOvrMapByUuid(admin),
      ])

      const countMap = new Map<string, number>()
      for (const row of (visitasRes.data ?? []) as { atleta_id: string }[]) {
        if (!row.atleta_id) continue
        countMap.set(row.atleta_id, (countMap.get(row.atleta_id) ?? 0) + 1)
      }

      const allProfiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null; athlete_id: string | null
        avatar_url: string | null; fotos: (string | null)[] | null
      }[]

      const sorted = [...allProfiles].sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0))
      const page = sorted.slice(offset, offset + limit)
      const hasMore = sorted.length > offset + limit

      const items: MaisCard[] = page.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        const ovr = ovrByUuid.get(p.id) ?? null
        return {
          id: p.id,
          nome: p.nome ?? 'Atleta',
          posicao: null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr,
          categoria: null,
        }
      })

      return NextResponse.json({ items, hasMore })
    }

    // ── NOVOS: mais recentes ───────────────────────────────────────────────────
    if (tipo === 'novos') {
      const [profilesRes, ovrByUuid, countRes] = await Promise.all([
        admin
          .from('profiles')
          .select('id, nome, athlete_id, avatar_url, fotos, criado_em')
          .like('athlete_id', 'MC-%')
          .order('criado_em', { ascending: false })
          .range(offset, offset + limit - 1),
        fetchOvrMapByUuid(admin),
        admin.from('profiles').select('id', { count: 'exact', head: true }).like('athlete_id', 'MC-%'),
      ])

      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; criado_em: string | null
      }[]

      const hasMore = (countRes.count ?? 0) > offset + limit

      const items: MaisCard[] = profiles.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        const ovr = ovrByUuid.get(p.id) ?? null
        return {
          id: p.id,
          nome: p.nome ?? 'Atleta',
          posicao: null,
          athlete_id: p.athlete_id,
          foto: fotos[0] ?? p.avatar_url ?? null,
          ovr,
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

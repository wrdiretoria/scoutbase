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

    // ── DESTAQUES: top OVR (sem getUserById — usa scout_score do banco) ──────────
    if (tipo === 'destaques') {
      const [profilesRes, avsRes] = await Promise.all([
        admin
          .from('profiles')
          .select('id, nome, athlete_id, avatar_url, fotos, data_nascimento')
          .like('athlete_id', 'MC-%')
          .limit(500),
        admin
          .from('avaliacoes')
          .select('aluno_id, scout_score')
          .not('scout_score', 'is', null),
      ])

      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; data_nascimento: string | null
      }[]

      // Média dos scout_scores por atleta (escala 0-100)
      const scoreMap = new Map<string, number[]>()
      for (const av of (avsRes.data ?? []) as { aluno_id: string; scout_score: number }[]) {
        if (!av.aluno_id) continue
        if (!scoreMap.has(av.aluno_id)) scoreMap.set(av.aluno_id, [])
        scoreMap.get(av.aluno_id)!.push(av.scout_score)
      }

      const sorted = profiles
        .map(p => {
          const scores = scoreMap.get(p.id)
          const ovr = scores && scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null
          return { ...p, ovr }
        })
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

    // ── VISITADOS: todos ordenados por visitas desc ───────────────────────────
    if (tipo === 'visitados') {
      const [visitasRes, profilesRes, avsRes] = await Promise.all([
        admin.from('visitas').select('atleta_id'),
        admin.from('profiles').select('id, nome, athlete_id, avatar_url, fotos, criado_em').like('athlete_id', 'MC-%').order('criado_em', { ascending: false }),
        admin.from('avaliacoes').select('aluno_id, scout_score').not('scout_score', 'is', null),
      ])

      const countMap = new Map<string, number>()
      for (const row of (visitasRes.data ?? []) as { atleta_id: string }[]) {
        if (!row.atleta_id) continue
        countMap.set(row.atleta_id, (countMap.get(row.atleta_id) ?? 0) + 1)
      }

      const scoreMap = new Map<string, number[]>()
      for (const av of (avsRes.data ?? []) as { aluno_id: string; scout_score: number }[]) {
        if (!av.aluno_id) continue
        if (!scoreMap.has(av.aluno_id)) scoreMap.set(av.aluno_id, [])
        scoreMap.get(av.aluno_id)!.push(av.scout_score)
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
        const scores = scoreMap.get(p.id)
        const ovr = scores && scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null
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
      const [profilesRes, avsRes, countRes] = await Promise.all([
        admin
          .from('profiles')
          .select('id, nome, athlete_id, avatar_url, fotos, criado_em')
          .like('athlete_id', 'MC-%')
          .order('criado_em', { ascending: false })
          .range(offset, offset + limit - 1),
        admin.from('avaliacoes').select('aluno_id, scout_score').not('scout_score', 'is', null),
        admin.from('profiles').select('id', { count: 'exact', head: true }).like('athlete_id', 'MC-%'),
      ])

      const profiles = (profilesRes.data ?? []) as {
        id: string; nome: string | null
        athlete_id: string | null; avatar_url: string | null
        fotos: (string | null)[] | null; criado_em: string | null
      }[]

      const scoreMap = new Map<string, number[]>()
      for (const av of (avsRes.data ?? []) as { aluno_id: string; scout_score: number }[]) {
        if (!av.aluno_id) continue
        if (!scoreMap.has(av.aluno_id)) scoreMap.set(av.aluno_id, [])
        scoreMap.get(av.aluno_id)!.push(av.scout_score)
      }

      const hasMore = (countRes.count ?? 0) > offset + limit

      const items: MaisCard[] = profiles.map(p => {
        const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
        const scores = scoreMap.get(p.id)
        const ovr = scores && scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null
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

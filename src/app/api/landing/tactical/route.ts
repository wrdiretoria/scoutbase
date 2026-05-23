import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 0

// ── Types (exportados — usados pelo componente client) ─────────────────────────

export type TacticalPlayer = {
  id:      string
  nome:    string
  posicao: string   // canonical: 'GOL' | 'LAT' | 'ZAG' | 'VOL' | 'MEI' | 'ATA'
  ovr:     number
  fotos:   string[]
  cidade:  string
}

export type TacticalCoach = {
  id:              string
  nome:            string
  cidade:          string
  totalAvaliacoes: number
  avaliacoesMes:   number
  reputacao:       number   // 4.5 – 5.0
  ultimaAvaliacao: { atletaNome: string; ovr: number; ts: string } | null
}

export type TacticalData = {
  gol:       TacticalPlayer | null
  def:       (TacticalPlayer | null)[]  // [LAT, ZAG, ZAG, LAT]
  mid:       (TacticalPlayer | null)[]  // [MEI, VOL, MEI]
  atk:       (TacticalPlayer | null)[]  // [ATA, ATA, ATA]
  treinador: TacticalCoach | null
}

const EMPTY: TacticalData = {
  gol: null,
  def: [null, null, null, null],
  mid: [null, null, null],
  atk: [null, null, null],
  treinador: null,
}

// ── Normaliza posição → código canônico ────────────────────────────────────────
function norm(pos: string): string {
  const m: Record<string, string> = {
    // Full names (from real users)
    'Goleiro': 'GOL',
    'Lateral Direito': 'LAT', 'Lateral Esquerdo': 'LAT', 'Lateral': 'LAT',
    'Zagueiro': 'ZAG',
    'Volante': 'VOL',
    'Meia': 'MEI', 'Meia-Atacante': 'MEI',
    'Atacante': 'ATA', 'Centro-Avante': 'ATA',
    'Ponta Direita': 'ATA', 'Ponta Esquerda': 'ATA',
    // Short codes (from seed data)
    'GOL': 'GOL', 'GK': 'GOL',
    'LAT': 'LAT', 'LD': 'LAT', 'LE': 'LAT',
    'ZAG': 'ZAG', 'ZG': 'ZAG',
    'VOL': 'VOL',
    'MEI': 'MEI', 'MAT': 'MEI',
    'ATA': 'ATA', 'CA': 'ATA', 'PD': 'ATA', 'PE': 'ATA',
  }
  return m[pos] ?? 'ATA'
}

export async function GET() {
  try {
    const admin = createAdminClient()

    // ── 1. Todas as avaliações (OVR + dados de treinador) ─────────────────────
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, professor_id, scout_score, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })

    if (!avs || avs.length === 0) {
      return NextResponse.json(EMPTY, { headers: { 'Cache-Control': 'no-store' } })
    }

    const atletaIds = [...new Set(avs.map(a => a.aluno_id as string))]

    // ── 2. Profiles (nome, fotos) + auth users (posicao, cidade) em paralelo ──
    const [profilesRes, authRes] = await Promise.all([
      admin.from('profiles').select('id, nome, fotos').in('id', atletaIds),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ])

    const profileMap = new Map<string, { nome: string; fotos: string[] }>()
    for (const p of profilesRes.data ?? []) {
      const raw = (p.fotos as (string | null)[] | null) ?? []
      profileMap.set(p.id as string, {
        nome:  (p.nome as string) ?? '',
        fotos: raw.filter((f): f is string => !!f),
      })
    }

    const metaMap = new Map<string, { nome: string; posicao: string; cidade: string }>()
    for (const u of authRes.data?.users ?? []) {
      metaMap.set(u.id, {
        nome:    (u.user_metadata?.nome    as string) ?? '',
        posicao: (u.user_metadata?.posicao as string) ?? '',
        cidade:  (u.user_metadata?.cidade  as string) ?? '',
      })
    }

    // ── 3. Melhor OVR por atleta (máximo dos scout_score) ─────────────────────
    const bestOvr = new Map<string, number>()
    for (const av of avs) {
      const id = av.aluno_id as string
      const s  = av.scout_score as number
      if (!bestOvr.has(id) || s > bestOvr.get(id)!) bestOvr.set(id, s)
    }

    // ── 4. Array de jogadores ordenado por OVR desc ────────────────────────────
    const players: TacticalPlayer[] = atletaIds
      .map(id => {
        const p   = profileMap.get(id)
        const m   = metaMap.get(id)
        const ovr = bestOvr.get(id)
        if (!ovr) return null
        return {
          id,
          nome:    p?.nome || m?.nome || 'Atleta',
          posicao: norm(m?.posicao ?? ''),
          ovr,
          fotos:   p?.fotos ?? [],
          cidade:  m?.cidade ?? '',
        }
      })
      .filter((p): p is TacticalPlayer => p !== null)
      .sort((a, b) => b.ovr - a.ovr)

    // ── 5. Monta formação 4-3-3 ────────────────────────────────────────────────
    const used = new Set<string>()

    const pick = (wanted: string): TacticalPlayer | null => {
      const p = players.find(pl => !used.has(pl.id) && pl.posicao === wanted)
      if (p) { used.add(p.id); return p }
      return null
    }
    const pickAny = (): TacticalPlayer | null => {
      const p = players.find(pl => !used.has(pl.id))
      if (p) { used.add(p.id); return p }
      return null
    }

    // Ataque (3 ATAs)
    const atk: (TacticalPlayer | null)[] = [
      pick('ATA') ?? pickAny(),
      pick('ATA') ?? pickAny(),
      pick('ATA') ?? pickAny(),
    ]

    // Meio (MEI, VOL, MEI)
    const mid: (TacticalPlayer | null)[] = [
      pick('MEI') ?? pick('VOL') ?? pickAny(),
      pick('VOL') ?? pick('MEI') ?? pickAny(),
      pick('MEI') ?? pick('VOL') ?? pickAny(),
    ]

    // Defesa (LAT, ZAG, ZAG, LAT)
    const def: (TacticalPlayer | null)[] = [
      pick('LAT') ?? pickAny(),
      pick('ZAG') ?? pickAny(),
      pick('ZAG') ?? pickAny(),
      pick('LAT') ?? pickAny(),
    ]

    // Goleiro
    const gol: TacticalPlayer | null = pick('GOL') ?? pickAny()

    // ── 6. Treinador do mês ────────────────────────────────────────────────────
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: monthAvs } = await admin
      .from('avaliacoes')
      .select('professor_id, aluno_id, scout_score, created_at')
      .gte('created_at', monthStart)
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })

    let treinador: TacticalCoach | null = null

    if (monthAvs && monthAvs.length > 0) {
      // Conta avaliações por treinador este mês
      const counts = new Map<string, number>()
      for (const av of monthAvs) {
        const pid = av.professor_id as string
        counts.set(pid, (counts.get(pid) ?? 0) + 1)
      }
      const [topId, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
      const tm = metaMap.get(topId)

      // Total de avaliações do treinador (all-time)
      const { count: totalCount } = await admin
        .from('avaliacoes')
        .select('*', { count: 'exact', head: true })
        .eq('professor_id', topId)

      // Scores para calcular reputação
      const { data: coachAvs } = await admin
        .from('avaliacoes')
        .select('scout_score, aluno_id, created_at')
        .eq('professor_id', topId)
        .not('scout_score', 'is', null)
        .order('created_at', { ascending: false })

      const scores = (coachAvs ?? []).map(a => a.scout_score as number)
      const avg    = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 75

      // Mapeia avg_score [60-95] → reputação [4.5-5.0]
      const rep = Math.round(
        Math.min(5.0, Math.max(4.5, 4.5 + (avg - 60) / 70 * 0.5)) * 10
      ) / 10

      // Última avaliação
      const lastAv = coachAvs?.[0]
      let ultima: TacticalCoach['ultimaAvaliacao'] = null
      if (lastAv) {
        const ap = profileMap.get(lastAv.aluno_id as string)
        const am = metaMap.get(lastAv.aluno_id as string)
        ultima = {
          atletaNome: ap?.nome || am?.nome || 'Atleta',
          ovr: lastAv.scout_score as number,
          ts:  lastAv.created_at as string,
        }
      }

      treinador = {
        id:              topId,
        nome:            tm?.nome    ?? 'Treinador',
        cidade:          tm?.cidade  ?? '',
        totalAvaliacoes: totalCount  ?? 0,
        avaliacoesMes:   topCount,
        reputacao:       rep,
        ultimaAvaliacao: ultima,
      }
    }

    return NextResponse.json(
      { gol, def, mid, atk, treinador } as TacticalData,
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[tactical]', err)
    return NextResponse.json(EMPTY)
  }
}

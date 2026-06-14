import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { formatNome } from '@/lib/formatNome'
import LoadMoreCardsRow from './LoadMoreCardsRow'
import type { MaisCard } from '@/app/api/landing/mais/route'

export const revalidate = 30

const LIMIT = 12

export default async function RankingNacionalSection() {
  const admin = createAdminClient()

  const [profilesRes, avsRes, countRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome, athlete_id, avatar_url, fotos, criado_em')
      .like('athlete_id', 'MC-%')
      .order('criado_em', { ascending: false })
      .limit(LIMIT),
    admin
      .from('avaliacoes')
      .select('aluno_id, scout_score')
      .not('scout_score', 'is', null),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .like('athlete_id', 'MC-%'),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
    criado_em: string | null
  }[]

  if (profiles.length === 0) return null

  // Calcula OVR por aluno_id a partir de scout_score
  const scoresByAluno = new Map<string, number[]>()
  for (const av of (avsRes.data ?? []) as { aluno_id: string; scout_score: number }[]) {
    const arr = scoresByAluno.get(av.aluno_id) ?? []
    arr.push(av.scout_score)
    scoresByAluno.set(av.aluno_id, arr)
  }
  const ovrByUuid = new Map<string, number>()
  for (const [uid, scores] of scoresByAluno) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    ovrByUuid.set(uid, Math.round(avg))
  }

  const hasMore = (countRes.count ?? 0) > LIMIT

  const initial: MaisCard[] = profiles.map(p => {
    const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
    return {
      id: p.id,
      nome: formatNome(p.nome ?? 'Atleta'),
      posicao: null,
      athlete_id: p.athlete_id,
      foto: fotos[0] ?? p.avatar_url ?? null,
      ovr: ovrByUuid.get(p.id) ?? null,
      categoria: null,
    }
  })

  return (
    <section style={{ background: '#080808', padding: '16px 0' }}>
      <style>{`.ranking-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
              🆕 Recém chegados
            </p>
            <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Novos <span style={{ color: '#00e676' }}>Craques</span>
            </h2>
          </div>
          <Link href="/ranking?ordem=novos" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,255,136,0.70)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Ver todos →
          </Link>
        </div>

        <LoadMoreCardsRow
          tipo="novos"
          initialItems={initial}
          initialOffset={LIMIT}
          limit={LIMIT}
          hasMoreInit={hasMore}
        />

      </div>
    </section>
  )
}

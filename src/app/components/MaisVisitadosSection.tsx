import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import { formatNome } from '@/lib/formatNome'
import LoadMoreCardsRow from './LoadMoreCardsRow'
import type { MaisCard } from '@/app/api/landing/mais/route'
import Link from 'next/link'

export const revalidate = 120

const LIMIT = 8

export default async function MaisVisitadosSection() {
  const admin = createAdminClient()

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

  if (allProfiles.length === 0) return null

  // Ordena: mais visitados primeiro, depois os sem visita por ordem de cadastro
  const sorted = [...allProfiles].sort((a, b) => {
    const va = countMap.get(a.id) ?? 0
    const vb = countMap.get(b.id) ?? 0
    return vb - va
  })

  const topIds = sorted.slice(0, LIMIT).map(p => p.id)
  const hasMore = sorted.length > LIMIT

  const profileMap = new Map(allProfiles.map(p => [p.id, p]))

  const initial: MaisCard[] = topIds.flatMap(id => {
    const p = profileMap.get(id)
    if (!p) return []
    const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
    return [{
      id: p.id,
      nome: formatNome(p.nome ?? 'Atleta'),
      posicao: null,
      athlete_id: p.athlete_id,
      foto: fotos[0] ?? p.avatar_url ?? null,
      ovr: ovrByUuid.get(p.id) ?? null,
      categoria: null,
    }]
  })

  if (initial.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '16px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
            🔥 Mais procurados
          </p>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Mais <span style={{ color: '#00e676' }}>Visitados</span>
          </h2>
        </div>

        <style>{`.mais-visitados-scroll::-webkit-scrollbar { display: none; }`}</style>
        <LoadMoreCardsRow
          tipo="visitados"
          initialItems={initial}
          initialOffset={LIMIT}
          limit={LIMIT}
          hasMoreInit={hasMore}
        />

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/ranking" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 32px', borderRadius: '100px',
            border: '1.5px solid rgba(0,230,118,0.40)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.08em',
          }}>
            Ver ranking completo →
          </Link>
        </div>

      </div>
    </section>
  )
}

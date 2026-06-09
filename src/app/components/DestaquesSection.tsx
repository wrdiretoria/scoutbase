import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import { formatNome } from '@/lib/formatNome'
import LoadMoreCards from './LoadMoreCards'
import type { MaisCard } from '@/app/api/landing/mais/route'

export const revalidate = 60

const LIMIT = 6

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

export default async function DestaquesSection() {
  const admin = createAdminClient()

  const [ovrByUuid, profilesRes] = await Promise.all([
    fetchOvrMapByUuid(admin),
    admin
      .from('profiles')
      .select('id, nome, posicao, athlete_id, avatar_url, fotos, data_nascimento')
      .like('athlete_id', 'MC-%')
      .limit(200),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; posicao: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
    data_nascimento: string | null
  }[]

  const sorted = profiles
    .map(p => ({ ...p, ovr: ovrByUuid.get(p.id) ?? null }))
    .filter(p => p.ovr !== null)
    .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))

  if (sorted.length === 0) return null

  const initial: MaisCard[] = sorted.slice(0, LIMIT).map(p => {
    const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
    return {
      id: p.id,
      nome: formatNome(p.nome ?? 'Atleta'),
      posicao: p.posicao ?? null,
      athlete_id: p.athlete_id,
      foto: fotos[0] ?? p.avatar_url ?? null,
      ovr: p.ovr,
      categoria: calcCategoria(p.data_nascimento),
    }
  })

  const hasMore = sorted.length > LIMIT

  return (
    <section style={{ background: '#080808', padding: '16px 0 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
              ⭐ Melhores OVR
            </p>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: 'white', letterSpacing: '-0.028em', lineHeight: 1.06 }}>
              Atletas em <span style={{ color: '#00e676' }}>Destaque</span>
            </h2>
          </div>
          <Link href="/ranking" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,255,136,0.70)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Ver todos →
          </Link>
        </div>

        <div className="landing-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 180px)',
          gap: '16px',
          alignItems: 'start',
        }}>
          <LoadMoreCards
            tipo="destaques"
            initialItems={initial}
            initialOffset={LIMIT}
            limit={LIMIT}
            hasMoreInit={hasMore}
            showRank={true}
          />
        </div>

      </div>
    </section>
  )
}

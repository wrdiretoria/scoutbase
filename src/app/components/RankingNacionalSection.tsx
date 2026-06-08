import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export const revalidate = 60

export default async function RankingNacionalSection() {
  const admin = createAdminClient()

  const [ovrByUuid, profilesRes] = await Promise.all([
    fetchOvrMapByUuid(admin),
    admin
      .from('profiles')
      .select('id, nome, athlete_id, avatar_url, fotos')
      .like('athlete_id', 'MC-%')
      .limit(50),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
  }[]

  const ranked = profiles
    .map(p => ({ ...p, ovr: ovrByUuid.get(p.id) ?? null }))
    .filter(p => p.ovr !== null)
    .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))
    .slice(0, 10)

  if (ranked.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '28px 0' }}>
      <style>{`.ranking-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
              🏆 Nacional
            </p>
            <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Ranking <span style={{ color: '#00e676' }}>Nacional</span>
            </h2>
          </div>
          <Link href="/ranking" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,255,136,0.70)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Ver ranking →
          </Link>
        </div>

        <div className="ranking-scroll landing-cards" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          {ranked.map((p, i) => {
            const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
            const foto = fotos[0] ?? p.avatar_url ?? null
            return (
              <div key={p.id} style={{ flexShrink: 0, width: '180px' }}>
                <AtletaCardLanding
                  nome={formatNome(p.nome ?? 'Atleta')}
                  ovr={p.ovr}
                  foto={foto}
                  posicao={null}
                  categoria={null}
                  atributos={null}
                  href={`/jogador/${p.id}`}
                  athleteId={p.athlete_id}
                  rank={i + 1}
                  width="180px"
                />
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

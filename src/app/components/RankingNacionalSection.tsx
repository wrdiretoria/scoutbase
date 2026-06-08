import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export const revalidate = 30

export default async function RankingNacionalSection() {
  const admin = createAdminClient()

  const [ovrByUuid, profilesRes] = await Promise.all([
    fetchOvrMapByUuid(admin),
    admin
      .from('profiles')
      .select('id, nome, athlete_id, avatar_url, fotos, criado_em')
      .like('athlete_id', 'MC-%')
      .order('criado_em', { ascending: false })
      .limit(12),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
    criado_em: string | null
  }[]

  if (profiles.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '28px 0' }}>
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
          <Link href="/ranking" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,255,136,0.70)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Ver todos →
          </Link>
        </div>

        <div className="ranking-scroll landing-cards" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          {profiles.map((p) => {
            const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
            const foto = fotos[0] ?? p.avatar_url ?? null
            const ovr = ovrByUuid.get(p.id) ?? null
            return (
              <div key={p.id} style={{ flexShrink: 0, width: '180px' }}>
                <AtletaCardLanding
                  nome={formatNome(p.nome ?? 'Atleta')}
                  ovr={ovr}
                  foto={foto}
                  posicao={null}
                  categoria={null}
                  atributos={null}
                  href={`/jogador/${p.id}`}
                  athleteId={p.athlete_id}
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

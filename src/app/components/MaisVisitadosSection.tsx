import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export const revalidate = 120

export default async function MaisVisitadosSection() {
  const admin = createAdminClient()

  // Conta visitas por atleta_id — usa tabela real `visitas`
  const { data: visitasData, error } = await admin
    .from('visitas')
    .select('atleta_id')

  if (error || !visitasData || visitasData.length === 0) {
    // Métrica não disponível — oculta a seção conforme instrução do prompt
    return null
  }

  // Agrupa contagens
  const countMap = new Map<string, number>()
  for (const row of visitasData as { atleta_id: string }[]) {
    if (!row.atleta_id) continue
    countMap.set(row.atleta_id, (countMap.get(row.atleta_id) ?? 0) + 1)
  }

  if (countMap.size === 0) return null

  // Top 8 por visitas
  const topIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  const [profilesRes, ovrByUuid] = await Promise.all([
    admin.from('profiles').select('id, nome, athlete_id, avatar_url, fotos').in('id', topIds),
    fetchOvrMapByUuid(admin),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
  }[]

  const items = topIds
    .map(id => profiles.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  if (items.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '48px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
            🔥 Mais procurados
          </p>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Mais <span style={{ color: '#00e676' }}>Visitados</span>
          </h2>
        </div>

        {/* Scroll horizontal */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          <style>{`.mais-visitados-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="mais-visitados-scroll landing-cards" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {items.map(p => {
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

      </div>
    </section>
  )
}

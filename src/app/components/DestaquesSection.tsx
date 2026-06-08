import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export const revalidate = 60

type ProfileRow = {
  id: string
  nome: string | null
  athlete_id: string | null
  avatar_url: string | null
  fotos: (string | null)[] | null
  data_nascimento: string | null
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

export default async function DestaquesSection() {
  const admin = createAdminClient()

  const [ovrByUuid, profilesRes] = await Promise.all([
    fetchOvrMapByUuid(admin),
    admin
      .from('profiles')
      .select('id, nome, athlete_id, avatar_url, fotos, data_nascimento')
      .like('athlete_id', 'MC-%')
      .limit(50),
  ])

  const profiles = (profilesRes.data ?? []) as unknown as ProfileRow[]

  // Só atletas com OVR calculado (têm avaliação ou perfil), ordenados por OVR desc
  const top = profiles
    .map(p => ({ ...p, ovr: ovrByUuid.get(p.id) ?? null }))
    .filter(p => p.ovr !== null)
    .sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0))
    .slice(0, 6)

  if (top.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '20px 0 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Header */}
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

        {/* Grid de cards — mesmo visual de "Mais Visitados", alinhamento igual */}
        <div className="landing-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 180px)',
          gap: '16px',
          alignItems: 'start',
        }}>
          {top.map((p, i) => {
            const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
            const foto = fotos[0] ?? p.avatar_url ?? null
            const categoria = calcCategoria(p.data_nascimento)
            return (
              <AtletaCardLanding
                key={p.id}
                nome={formatNome(p.nome ?? 'Atleta')}
                ovr={p.ovr}
                foto={foto}
                posicao={null}
                categoria={categoria}
                atributos={null}
                href={`/jogador/${p.id}`}
                athleteId={p.athlete_id}
                rank={i + 1}
                width="180px"
              />
            )
          })}
        </div>

        {/* Botão Carregar Mais */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/ranking" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 32px', borderRadius: '100px',
            border: '1.5px solid rgba(0,230,118,0.40)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.08em',
            transition: 'background .18s, border-color .18s',
          }}>
            Carregar Mais
          </Link>
        </div>

      </div>
    </section>
  )
}

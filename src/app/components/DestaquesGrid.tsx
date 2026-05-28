// Server Component — grade de atletas em destaque
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'
import CardPhoto from './CardPhoto'

type AtletaCard = {
  id:        string
  nome:      string
  pos:       string
  cidade:    string
  ovr:       number
  foto:      string | null
  initials:  string
  athleteId: string | null
  tier:      'OURO' | 'PRATA' | 'BRONZE'
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string) {
  const m: Record<string, string> = {
    'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE',
    'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
    'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
  }
  return m[pos] ?? pos.slice(0, 3).toUpperCase()
}

async function fetchDestaques(): Promise<AtletaCard[]> {
  try {
    const admin = createAdminClient()

    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, scout_score')
      .not('scout_score', 'is', null)
      .order('scout_score', { ascending: false })
      .limit(40)

    if (!avs || avs.length === 0) return []

    // Deduplicar — melhor nota por atleta, até 12
    const seen = new Set<string>()
    const top: typeof avs = []
    for (const av of avs) {
      if (seen.has(av.aluno_id as string)) continue
      seen.add(av.aluno_id as string)
      top.push(av)
      if (top.length === 12) break
    }

    const ids = top.map(av => av.aluno_id as string)

    const [profilesRes, authRes, ovrMap] = await Promise.all([
      admin.from('profiles').select('id, nome, avatar_url, fotos, athlete_id').in('id', ids),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      fetchOvrMap(admin),
    ])

    const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id as string, p]))
    const posMap     = new Map<string, string>()
    const cidadeMap  = new Map<string, string>()
    for (const u of authRes.data?.users ?? []) {
      if (u.user_metadata?.posicao) posMap.set(u.id, u.user_metadata.posicao as string)
      if (u.user_metadata?.cidade)  cidadeMap.set(u.id, u.user_metadata.cidade  as string)
    }

    return top.map(av => {
      const id      = av.aluno_id as string
      const profile = profileMap.get(id)
      const nome    = (profile?.nome    as string | null) ?? 'Atleta'
      const posicao = posMap.get(id) ?? ''
      const cidade  = cidadeMap.get(id) ?? ''
      const mcId    = (profile?.athlete_id as string | null) ?? null
      const ovr     = (mcId ? ovrMap.get(mcId) : null) ?? Math.round(av.scout_score as number)
      const fotosArr = profile?.fotos as (string | null)[] | null
      const foto    = fotosArr?.[0] ?? (profile?.avatar_url as string | null) ?? null

      return {
        id,
        nome,
        pos:      posAbrev(posicao),
        cidade,
        ovr,
        foto,
        initials: getInitials(nome),
        athleteId: (profile?.athlete_id as string | null) ?? null,
        tier:     ovr >= 85 ? 'OURO' : ovr >= 70 ? 'PRATA' : 'BRONZE',
      } satisfies AtletaCard
    })
  } catch {
    return []
  }
}

const TIER_STYLE = {
  OURO:   { badge: '#f0c040', badgeBg: 'rgba(212,168,67,0.18)', border: 'rgba(212,168,67,0.35)', glow: 'rgba(212,168,67,0.20)', photoBg: 'linear-gradient(160deg,#3d2e05,#1a1400)' },
  PRATA:  { badge: '#c0c0d8', badgeBg: 'rgba(192,192,210,0.14)', border: 'rgba(192,192,210,0.28)', glow: 'rgba(192,192,210,0.12)', photoBg: 'linear-gradient(160deg,#1e2028,#0e0f18)' },
  BRONZE: { badge: '#d4804a', badgeBg: 'rgba(180,100,40,0.16)', border: 'rgba(180,100,40,0.30)', glow: 'rgba(180,100,40,0.14)', photoBg: 'linear-gradient(160deg,#2e1400,#140800)' },
}

export default async function DestaquesGrid() {
  const atletas = await fetchDestaques()
  if (atletas.length === 0) return null

  return (
    <section style={{
      background: '#060d08',
      padding: '48px 20px 64px',
    }}>
      <style>{`
        .dg-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .dg-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (min-width: 600px)  { .dg-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 900px)  { .dg-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1200px) { .dg-grid { grid-template-columns: repeat(6, 1fr); } }

        .dg-card {
          border-radius: 16px;
          overflow: hidden;
          background: #0b1610;
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform .18s, box-shadow .18s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .dg-card:hover {
          transform: translateY(-4px);
        }
        .dg-photo {
          position: relative;
          height: 190px;
          overflow: hidden;
        }
        .dg-photo img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: top center;
          display: block;
        }
        .dg-photo-fade {
          position: absolute; bottom: 0; left: 0; right: 0; height: 55%;
          background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%);
        }
        .dg-initials {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 900;
          user-select: none; pointer-events: none;
        }
        .dg-ovr {
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
          border-radius: 8px; padding: 4px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 0;
        }
        .dg-ovr-label {
          font-size: 7px; font-weight: 800; letter-spacing: 0.14em;
          color: rgba(0,255,136,0.7); text-transform: uppercase;
        }
        .dg-ovr-num {
          font-size: 20px; font-weight: 900; line-height: 1;
        }
        .dg-tier {
          position: absolute; top: 10px; left: 10px;
          font-size: 7px; font-weight: 900; letter-spacing: 0.12em;
          padding: 3px 7px; border-radius: 5px;
        }
        .dg-info {
          padding: 10px 12px 12px;
        }
        .dg-nome {
          font-size: 13px; font-weight: 800; color: white;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-bottom: 2px;
        }
        .dg-sub {
          font-size: 11px; color: rgba(255,255,255,0.38);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin-bottom: 10px;
        }
        .dg-cta {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: #22c55e;
          text-decoration: none;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          width: 100%; justify-content: center;
          transition: background .15s;
        }
        .dg-cta:hover { background: rgba(34,197,94,0.14); }
        .dg-id {
          font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.2);
          letter-spacing: 0.1em; text-align: center;
          margin-top: 8px;
        }
      `}</style>

      {/* Cabeçalho mínimo */}
      <div className="dg-header">
        <p style={{
          margin: '0 0 6px', fontSize: '10px', fontWeight: 800,
          color: '#22c55e', letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          ⭐ Em Destaque
        </p>
        <h2 style={{
          margin: 0, fontSize: 'clamp(22px,3vw,32px)',
          fontWeight: 900, color: 'white', letterSpacing: '-0.02em',
        }}>
          Os melhores do futebol
        </h2>
      </div>

      {/* Grade */}
      <div className="dg-grid">
        {atletas.map(a => {
          const t = TIER_STYLE[a.tier]
          return (
            <Link key={a.id} href={a.athleteId ? `/atleta/${a.athleteId.replace(/^[A-Z]+-/, '')}` : `/atleta/${a.id}`} className="dg-card" style={{
              boxShadow: `0 0 20px ${t.glow}`,
              borderColor: t.border,
            }}>
              {/* Foto */}
              <div className="dg-photo" style={{ background: t.photoBg }}>
                {/* Iniciais: camada base — visível se sem foto ou foto quebrada */}
                <div className="dg-initials" style={{ color: t.badge, opacity: 0.55 }}>
                  {a.initials}
                </div>
                {/* Foto: camada superior — cobre as iniciais quando carrega */}
                {a.foto && <CardPhoto src={a.foto} />}
                <div className="dg-photo-fade" />

                {/* OVR */}
                <div className="dg-ovr">
                  <span className="dg-ovr-label">OVR</span>
                  <span className="dg-ovr-num" style={{ color: t.badge }}>{a.ovr}</span>
                </div>

                {/* Tier */}
                <div className="dg-tier" style={{
                  background: t.badgeBg,
                  border: `1px solid ${t.border}`,
                  color: t.badge,
                }}>
                  {a.tier}
                </div>
              </div>

              {/* Info */}
              <div className="dg-info">
                <div className="dg-nome">{a.nome}</div>
                <div className="dg-sub">
                  {[a.pos, a.cidade].filter(Boolean).join(' · ')}
                </div>

                <div className="dg-cta">
                  Ver perfil →
                </div>

                {a.athleteId && (
                  <div className="dg-id">
                    ID {a.athleteId.replace(/^[A-Z]+-/, '')}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

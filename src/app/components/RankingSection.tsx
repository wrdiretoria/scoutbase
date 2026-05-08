// Server Component — sem 'use client'

const athletes = [
  {
    rank: 1,
    initials: 'PH',
    name: 'Pedro Henrique',
    position: 'Meia Atacante',
    city: 'São Paulo – SP',
    rating: 91,
    trend: '+3',
    sponsored: true,
    color: 'linear-gradient(135deg,#16a34a,#4ade80)',
    bg: 'linear-gradient(160deg,rgba(34,197,94,0.10),rgba(34,197,94,0.03))',
    border: 'rgba(34,197,94,0.25)',
    stats: [
      { label: 'Velocidade', val: 92 },
      { label: 'Finalização', val: 88 },
      { label: 'Drible', val: 90 },
      { label: 'Passe', val: 85 },
      { label: 'Físico', val: 80 },
    ],
  },
  {
    rank: 2,
    initials: 'AS',
    name: 'Arthur Silva',
    position: 'Goleiro',
    city: 'Santos – SP',
    rating: 88,
    trend: null,
    sponsored: true,
    color: 'linear-gradient(135deg,#2563eb,#60a5fa)',
    bg: 'linear-gradient(160deg,rgba(37,99,235,0.08),rgba(37,99,235,0.02))',
    border: 'rgba(37,99,235,0.2)',
    stats: [
      { label: 'Reflexo', val: 91 },
      { label: 'Posicionam.', val: 87 },
      { label: 'Agilidade', val: 85 },
      { label: 'Saída de Bola', val: 82 },
      { label: 'Liderança', val: 88 },
    ],
  },
  {
    rank: 3,
    initials: 'MC',
    name: 'Miguel Costa',
    position: 'Zagueiro',
    city: 'Curitiba – PR',
    rating: 86,
    trend: '+5',
    sponsored: false,
    color: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    stats: [
      { label: 'Marcação', val: 89 },
      { label: 'Físico', val: 87 },
      { label: 'Cabeceio', val: 84 },
      { label: 'Passe', val: 78 },
      { label: 'Posicionam.', val: 85 },
    ],
  },
  {
    rank: 4,
    initials: 'GL',
    name: 'Gabriel Lima',
    position: 'Lateral Direito',
    city: 'Belo Horizonte – MG',
    rating: 85,
    trend: '+1',
    sponsored: false,
    color: 'linear-gradient(135deg,#dc2626,#f87171)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    stats: [
      { label: 'Velocidade', val: 88 },
      { label: 'Cruzamento', val: 84 },
      { label: 'Marcação', val: 82 },
      { label: 'Físico', val: 80 },
      { label: 'Resistência', val: 86 },
    ],
  },
  {
    rank: 5,
    initials: 'KA',
    name: 'Kauã Alves',
    position: 'Atacante',
    city: 'Fortaleza – CE',
    rating: 84,
    trend: '+2',
    sponsored: false,
    color: 'linear-gradient(135deg,#d97706,#fbbf24)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    stats: [
      { label: 'Finalização', val: 86 },
      { label: 'Velocidade', val: 84 },
      { label: 'Drible', val: 82 },
      { label: 'Cabeceio', val: 75 },
      { label: 'Pressão', val: 80 },
    ],
  },
]

const rankColor = (rank: number) => {
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#94a3b8'
  if (rank === 3) return '#b45309'
  return 'rgba(255,255,255,0.25)'
}

export default function RankingSection() {
  return (
    <section style={{ padding: '80px 0 72px', background: '#06100a', overflow: 'hidden' }}>
      <style>{`
        .ranking-scroll::-webkit-scrollbar { display: none; }
        .ranking-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .fifa-card { transition: transform 0.2s, box-shadow 0.2s; }
        .fifa-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.5) !important; }
        @media (max-width: 768px) {
          .ranking-title { font-size: 26px !important; }
          .ranking-scroll { padding: 0 20px 16px !important; }
        }
      `}</style>

      {/* Título */}
      <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
          color: '#22c55e', textTransform: 'uppercase', marginBottom: '10px',
        }}>
          ⚡ Destaques da semana
        </p>
        <h2 className="ranking-title" style={{
          fontSize: '34px', fontWeight: 900, letterSpacing: '-0.03em',
          color: 'white', lineHeight: 1.1,
        }}>
          Os craques em evidência
        </h2>
        <p style={{ marginTop: '10px', fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '420px', margin: '10px auto 0' }}>
          Atletas avaliados e vistos por scouts de todo o Brasil.
        </p>
      </div>

      {/* Cards scroll */}
      <div className="ranking-scroll" style={{
        display: 'flex',
        gap: '16px',
        padding: '0 40px 16px',
        overflowX: 'auto',
        maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
      }}>
        {athletes.map((a) => (
          <div
            key={a.rank}
            className="fifa-card"
            style={{
              flexShrink: 0,
              width: '200px',
              borderRadius: '20px',
              padding: '20px 16px',
              background: a.bg,
              border: `1px solid ${a.border}`,
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              cursor: 'default',
            }}
          >
            {/* Badge patrocinado */}
            {a.sponsored && (
              <div style={{
                position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(90deg,#16a34a,#22c55e)',
                color: 'black', fontSize: '9px', fontWeight: 800,
                padding: '3px 10px', borderRadius: '0 0 10px 10px',
                letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                ⭐ DESTAQUE PATROCINADO
              </div>
            )}

            {/* Rank */}
            <div style={{
              position: 'absolute', top: a.sponsored ? '22px' : '14px', left: '14px',
              fontSize: '12px', fontWeight: 800,
              color: rankColor(a.rank),
            }}>
              #{a.rank}
            </div>

            {/* Trend */}
            {a.trend && (
              <div style={{
                position: 'absolute', top: a.sponsored ? '22px' : '14px', right: '14px',
                fontSize: '10px', fontWeight: 700, color: '#22c55e',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)',
                padding: '2px 7px', borderRadius: '20px',
              }}>
                ↑ +{a.trend}
              </div>
            )}

            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 14px' }}>
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 900, color: 'white',
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {a.initials}
              </div>
            </div>

            {/* Rating */}
            <div style={{
              textAlign: 'center', fontSize: '46px', fontWeight: 900,
              color: '#22c55e', lineHeight: 1, marginBottom: '4px',
            }}>
              {a.rating}
            </div>

            {/* Nome + Posição */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{a.name}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{a.position} · {a.city.split('–')[0].trim()}</p>
            </div>

            {/* Stats */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: '12px',
              display: 'flex', flexDirection: 'column', gap: '7px',
            }}>
              {a.stats.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', width: '72px', flexShrink: 0 }}>{s.label}</span>
                  <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                    <div style={{ width: `${s.val}%`, height: '100%', background: '#22c55e', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', minWidth: '22px', textAlign: 'right' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA ver todos */}
      <div style={{ textAlign: 'center', marginTop: '36px' }}>
        <a href="/cadastro" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: '#22c55e', fontSize: '14px', fontWeight: 700,
          textDecoration: 'none', borderBottom: '1px solid rgba(34,197,94,0.3)',
          paddingBottom: '2px',
        }}>
          Ver todos os destaques →
        </a>
      </div>
    </section>
  )
}

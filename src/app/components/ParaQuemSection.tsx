// Server Component — substitui logos falsos por proposta de valor real

const audiences = [
  {
    emoji: '⚽',
    tag: 'ATLETAS',
    title: 'Para quem sonha grande',
    desc: 'De 13 a 23 anos. Crie seu perfil, mostre sua evolução e seja visto por quem decide.',
    cta: 'Criar meu perfil',
    href: '/atleta/cadastro',
    color: '#00FF88',
  },
  {
    emoji: '🎯',
    tag: 'SCOUTS',
    title: 'Para quem descobre talentos',
    desc: 'Encontre atletas por posição, região e faixa etária. Dados reais, avaliados por treinadores.',
    cta: 'Explorar atletas',
    href: '/scout/busca',
    color: '#a78bfa',
  },
  {
    emoji: '🏟️',
    tag: 'ESCOLINHAS',
    title: 'Para quem forma craques',
    desc: 'Gerencie sua equipe, acompanhe a evolução e coloque seus atletas no mapa do futebol.',
    cta: 'Cadastrar escolinha',
    href: '/treinador/cadastro',
    color: '#38bdf8',
  },
  {
    emoji: '👨‍👦',
    tag: 'FAMÍLIAS',
    title: 'Para quem apoia o sonho',
    desc: 'Acompanhe a jornada do seu filho com transparência, dados e histórico de evolução.',
    cta: 'Acompanhar filho',
    href: '/pais/entrar',
    color: '#fb923c',
  },
]

export default function ParaQuemSection() {
  return (
    <section style={{
      background: '#060d08',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      padding: '80px 0 88px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        .pq-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .pq-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 22px 32px;
          transition: border-color .2s, background .2s, transform .2s;
          cursor: default;
        }
        .pq-card:hover {
          background: rgba(255,255,255,0.04);
          transform: translateY(-4px);
        }
        .pq-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          text-decoration: none; margin-top: 20px;
          transition: opacity .2s;
        }
        .pq-link:hover { opacity: 0.75; }
        @media (max-width: 900px) {
          .pq-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .pq-grid { grid-template-columns: 1fr !important; padding: 0 16px !important; }
        }
      `}</style>

      {/* Bg glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.04) 0%, transparent 60%)',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px', padding: '0 24px', position: 'relative' }}>
        <p style={{
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em',
          color: 'rgba(0,255,136,0.72)', marginBottom: '12px',
        }}>
          🇧🇷 &nbsp;FEITO PARA O FUTEBOL BRASILEIRO
        </p>
        <h2 style={{
          fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900,
          letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0,
        }}>
          Jogue para <span style={{ color: '#00FF88' }}>ser visto.</span>
        </h2>
        <p style={{
          fontSize: '15px', color: 'rgba(255,255,255,0.4)',
          marginTop: '14px', maxWidth: '420px', margin: '14px auto 0',
          lineHeight: 1.65,
        }}>
          O MeuCraque é o ponto de encontro entre quem tem talento
          e quem procura talento no futebol de base do Brasil.
        </p>
      </div>

      <div className="pq-grid">
        {audiences.map(a => (
          <div key={a.tag} className="pq-card" style={{ borderColor: `${a.color}18` }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: `${a.color}12`,
              border: `1px solid ${a.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', marginBottom: '18px',
            }}>{a.emoji}</div>

            <p style={{
              fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em',
              color: a.color, opacity: 0.75, marginBottom: '8px',
            }}>{a.tag}</p>

            <h3 style={{
              fontSize: '16px', fontWeight: 800, color: 'white',
              lineHeight: 1.3, margin: '0 0 10px', letterSpacing: '-0.01em',
            }}>{a.title}</h3>

            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.65, margin: 0,
            }}>{a.desc}</p>

            <a href={a.href} className="pq-link" style={{ color: a.color }}>
              {a.cta} &nbsp;→
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

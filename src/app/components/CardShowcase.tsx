import HeroCard from './HeroCard'

const features = [
  {
    icon: '🏅',
    title: 'Nota OVR oficial',
    desc: 'Calculada por treinadores certificados — não é autoproclamada. Credibilidade real.',
  },
  {
    icon: '📊',
    title: '6 atributos avaliados',
    desc: 'Velocidade, Finalização, Técnica, Visão de jogo, Força e Posicionamento.',
  },
  {
    icon: '🔗',
    title: 'Link único compartilhável',
    desc: 'Um URL e um QR Code para enviar a qualquer treinador ou clube.',
  },
  {
    icon: '🌐',
    title: 'Visível para scouts',
    desc: 'Seu card aparece no ranking em tempo real para scouts cadastrados.',
  },
]

export default function CardShowcase() {
  return (
    <section style={{ background: '#050906', padding: '88px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 16px', borderRadius: '100px',
            border: '1px solid rgba(212,168,67,0.30)', background: 'rgba(212,168,67,0.06)',
            fontSize: '10px', fontWeight: 700, color: 'rgba(212,168,67,0.80)', letterSpacing: '0.18em',
            marginBottom: '20px',
          }}>
            ⭐ SEU CARD PROFISSIONAL
          </div>
          <h2 style={{
            margin: '0 0 14px',
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 900, color: 'white',
            letterSpacing: '-0.03em', lineHeight: 1.06,
          }}>
            Um card que fala por você
          </h2>
          <p style={{
            margin: '0 auto', fontSize: 'clamp(14px,1.2vw,17px)',
            color: 'rgba(255,255,255,0.38)', maxWidth: '460px', lineHeight: 1.65,
          }}>
            Seu perfil de atleta num formato visual profissional, como os maiores do mundo.
          </p>
        </div>

        {/* Two-column: card + features */}
        <div className="showcase-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}>

          {/* Left: the card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroCard />
          </div>

          {/* Right: feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {features.map(f => (
              <div key={f.title} style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '20px 22px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color .2s',
              }}>
                <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1, marginTop: '2px' }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '5px' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.58 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}

            {/* CTA inline */}
            <a href="/login" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '15px 28px', borderRadius: '100px', marginTop: '8px',
              background: 'linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%)',
              color: '#020c05', fontWeight: 800, fontSize: '14px',
              textDecoration: 'none', letterSpacing: '0.10em',
              boxShadow: '0 6px 28px rgba(0,0,0,0.45)',
            }}>
              CRIAR MEU CARD — GRÁTIS
            </a>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .showcase-grid {
            grid-template-columns: 1fr !important;
            gap: 44px !important;
          }
        }
      `}</style>
    </section>
  )
}

export default function ComoFunciona() {
  const steps = [
    {
      number: '01',
      icon: '👤',
      title: 'Crie seu perfil',
      desc: 'Cadastre-se grátis em 2 minutos. Adicione foto, posição e informações básicas do seu jogo.',
      color: '#00FF88',
    },
    {
      number: '02',
      icon: '⭐',
      title: 'Receba avaliações',
      desc: 'Treinadores certificados avaliam seus atributos e você recebe uma nota OVR oficial.',
      color: '#f0c040',
    },
    {
      number: '03',
      icon: '🔍',
      title: 'Ganhe visibilidade',
      desc: 'Scouts e clubes encontram você no ranking. Seu card profissional trabalha por você 24h.',
      color: '#60a5fa',
    },
  ]

  return (
    <section style={{ background: '#040806', padding: '88px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 16px', borderRadius: '100px',
            border: '1px solid rgba(0,255,136,0.22)', background: 'rgba(0,255,136,0.06)',
            fontSize: '10px', fontWeight: 700, color: 'rgba(0,255,136,0.72)', letterSpacing: '0.18em',
            marginBottom: '20px',
          }}>
            SIMPLES ASSIM
          </div>
          <h2 style={{
            margin: '0 0 14px',
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 900, color: 'white',
            letterSpacing: '-0.03em', lineHeight: 1.06,
          }}>
            Como funciona
          </h2>
          <p style={{
            margin: '0 auto', fontSize: 'clamp(14px,1.2vw,17px)',
            color: 'rgba(255,255,255,0.38)', maxWidth: '440px', lineHeight: 1.65,
          }}>
            Três passos para você entrar no radar de quem importa.
          </p>
        </div>

        {/* Steps */}
        <div className="steps-grid" style={{ position: 'relative' }}>
          {/* Connecting line between icons — desktop only */}
          <div className="steps-connector" />

          {steps.map(step => (
            <div key={step.number} className="step-card">
              {/* Icon circle */}
              <div className="step-icon-wrap" style={{
                background: `radial-gradient(circle, ${step.color}18 0%, ${step.color}06 60%, transparent 100%)`,
                border: `1.5px solid ${step.color}30`,
              }}>
                <span style={{ fontSize: '32px', lineHeight: 1 }}>{step.icon}</span>
              </div>

              {/* Step label */}
              <div style={{
                fontSize: '10px', fontWeight: 800, color: step.color,
                letterSpacing: '0.18em', marginBottom: '10px', textTransform: 'uppercase',
              }}>
                PASSO {step.number}
              </div>

              <h3 style={{
                margin: '0 0 12px',
                fontSize: 'clamp(17px,1.6vw,22px)',
                fontWeight: 800, color: 'white', letterSpacing: '-0.02em',
              }}>
                {step.title}
              </h3>

              <p style={{
                margin: 0,
                fontSize: 'clamp(13px,1vw,15px)',
                color: 'rgba(255,255,255,0.38)', lineHeight: 1.65,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <a href="/atleta/cadastro" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '15px 38px', borderRadius: '100px',
            background: 'linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%)',
            color: '#020c05', fontWeight: 800, fontSize: '14px',
            textDecoration: 'none', letterSpacing: '0.10em',
            boxShadow: '0 6px 28px rgba(0,0,0,0.45)',
          }}>
            COMEÇAR AGORA — É GRÁTIS
          </a>
        </div>

      </div>
    </section>
  )
}

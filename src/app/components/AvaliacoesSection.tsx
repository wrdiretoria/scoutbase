const atributos = [
  { label: 'Velocidade',     key: 'VEL', value: 90, color: '#00FF88' },
  { label: 'Finalização',    key: 'FIN', value: 88, color: '#00FF88' },
  { label: 'Técnica',        key: 'TEC', value: 82, color: '#00FF88' },
  { label: 'Visão de jogo',  key: 'VIS', value: 76, color: '#60a5fa' },
  { label: 'Força física',   key: 'FOR', value: 84, color: '#60a5fa' },
  { label: 'Posicionamento', key: 'POS', value: 79, color: '#60a5fa' },
]

const bullets = [
  'Treinadores verificados pela plataforma',
  'Nota OVR calculada automaticamente',
  'Histórico de evolução ao longo do tempo',
]

export default function AvaliacoesSection() {
  return (
    <section style={{ background: '#04080a', padding: '88px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div className="aval-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

          {/* Left: copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 16px', borderRadius: '100px',
              border: '1px solid rgba(96,165,250,0.30)', background: 'rgba(96,165,250,0.06)',
              fontSize: '10px', fontWeight: 700, color: 'rgba(96,165,250,0.80)', letterSpacing: '0.18em',
              marginBottom: '24px',
            }}>
              🛡 AVALIAÇÕES OFICIAIS
            </div>

            <h2 style={{
              margin: '0 0 18px',
              fontSize: 'clamp(26px,3.6vw,46px)',
              fontWeight: 900, color: 'white',
              letterSpacing: '-0.03em', lineHeight: 1.08,
            }}>
              Avaliado por<br />
              <span style={{ color: '#00FF88' }}>treinadores reais</span>
            </h2>

            <p style={{ margin: '0 0 32px', fontSize: 'clamp(13px,1.1vw,16px)', color: 'rgba(255,255,255,0.38)', lineHeight: 1.68 }}>
              Cada atributo é avaliado pessoalmente por um treinador cadastrado.
              Nada de autoproclamação — sua nota tem credibilidade de verdade.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bullets.map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#00FF88',
                  }}>✓</span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mock evaluation card */}
          <div style={{
            background: 'linear-gradient(168deg, #0c1510 0%, #070d09 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
            padding: '28px 32px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            {/* Treinador header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px', paddingBottom: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(0,255,136,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>
                👨‍🏫
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Carlos Mendes</div>
                <div style={{ fontSize: '11px', color: 'rgba(0,255,136,0.65)', marginTop: '3px' }}>
                  ✓ Treinador verificado · 48 avaliações
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: '32px', fontWeight: 900, color: '#f0c040',
                  lineHeight: 1, letterSpacing: '-0.03em',
                  textShadow: '0 0 20px rgba(240,192,64,0.35)',
                }}>91</div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em' }}>OVR</div>
              </div>
            </div>

            {/* Attribute bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {atributos.map(a => (
                <div key={a.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
                      {a.label}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: 'white' }}>{a.value}</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{
                      height: '100%', borderRadius: '100px',
                      width: `${a.value}%`,
                      background: `linear-gradient(90deg, ${a.color}55, ${a.color})`,
                      boxShadow: `0 0 8px ${a.color}44`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .aval-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  )
}

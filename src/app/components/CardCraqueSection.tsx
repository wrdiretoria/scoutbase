// Server Component

const attrs = [
  { label: 'TÉCNICA',       val: 88 },
  { label: 'VELOCIDADE',    val: 90 },
  { label: 'VISÃO DE JOGO', val: 82 },
  { label: 'FINALIZAÇÃO',   val: 85 },
  { label: 'FORÇA',         val: 78 },
  { label: 'MENTALIDADE',   val: 87 },
]

const cardStats = [
  ['RIT','90'], ['FIN','85'], ['PAS','82'],
  ['CON','88'], ['DEF','60'], ['FIS','78'],
]

export default function CardCraqueSection() {
  return (
    <section style={{
      background: 'linear-gradient(180deg, #060d08 0%, #071209 50%, #060d08 100%)',
      padding: '72px 0 80px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes cardFloat {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes barGrow { from { width: 0 } }
        .craque-card-wrap { animation: cardFloat 5s ease-in-out infinite; }
        .attr-bar { animation: barGrow .8s cubic-bezier(.22,1,.36,1) forwards; }
        .ccs-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 40px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 32px;
          align-items: center;
        }
        .ccs-right { display: flex; flex-direction: column; gap: 16px; }
        .ccs-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 24px;
          background: transparent;
          border: 1.5px solid rgba(0,255,136,0.35);
          border-radius: 100px;
          color: rgba(0,255,136,0.88);
          font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
          text-decoration: none;
          transition: background .2s, border-color .2s;
        }
        .ccs-cta-btn:hover {
          background: rgba(0,255,136,0.08);
          border-color: rgba(0,255,136,0.6);
        }
        @media (max-width: 768px) {
          .ccs-grid {
            grid-template-columns: 1fr !important;
            padding: 0 22px !important;
            gap: 32px !important;
            justify-items: center;
            text-align: center;
          }
          .ccs-left { order: 1; }
          .ccs-center { order: 2; }
          .ccs-right { order: 3; width: 100%; max-width: 300px; }
          .ccs-left h2 { font-size: 32px !important; }
        }
      `}</style>

      {/* Atmospheric glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,255,136,0.05) 0%, transparent 65%)',
      }} />

      <div className="ccs-grid">

        {/* ── LEFT: Text ── */}
        <div className="ccs-left">
          <p style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em',
            color: 'rgba(0,255,136,0.75)', marginBottom: '20px',
            textTransform: 'uppercase',
          }}>
            ⚽ &nbsp;SEU PERFIL PROFISSIONAL
          </p>
          <h2 style={{
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.035em',
            margin: '0 0 18px',
          }}>
            SEU TALENTO.<br />
            SUA HISTÓRIA.<br />
            <span style={{ color: '#00FF88' }}>SEU CARD CRAQUE.</span>
          </h2>
          <p style={{
            fontSize: '14px', color: 'rgba(255,255,255,0.52)',
            lineHeight: 1.72, margin: '0 0 32px', maxWidth: '300px',
          }}>
            Mostre quem você é dentro e fora de campo.
            Crie seu card profissional e seja descoberto
            por scouts e clubes de todo o Brasil.
          </p>
          <a href="/atleta/cadastro" className="ccs-cta-btn">
            VER EXEMPLO DE CARD &nbsp;→
          </a>
        </div>

        {/* ── CENTER: The Card ── */}
        <div className="ccs-center craque-card-wrap">
          <div style={{
            width: '210px',
            background: 'linear-gradient(160deg, #173320 0%, #0c1f10 60%, #081508 100%)',
            borderRadius: '22px',
            border: '1.5px solid rgba(0,255,136,0.28)',
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(0,255,136,0.22), 0 30px 70px rgba(0,0,0,0.7)',
            position: 'relative',
          }}>
            {/* Top accent */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #00FF88, transparent)' }} />

            {/* Card header */}
            <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '52px', fontWeight: 900, color: '#00FF88',
                  lineHeight: 1, letterSpacing: '-0.04em',
                  textShadow: '0 0 30px rgba(0,255,136,0.5)',
                }}>87</div>
                <div style={{
                  fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.1em', marginTop: '2px',
                }}>MEI</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '38px', height: '38px',
                  background: 'linear-gradient(135deg, #065f28, #00e87a)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', boxShadow: '0 0 16px rgba(0,255,136,0.45)',
                }}>★</div>
                <span style={{ fontSize: '22px' }}>🇧🇷</span>
              </div>
            </div>

            {/* Player silhouette */}
            <div style={{
              height: '130px', margin: '10px 14px',
              background: 'linear-gradient(180deg, rgba(0,60,24,0.35) 0%, rgba(0,0,0,0.85) 100%)',
              borderRadius: '14px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{ fontSize: '80px', opacity: 0.18, userSelect: 'none', lineHeight: 1 }}>🏃</div>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 40%, rgba(0,255,136,0.1) 0%, transparent 70%)',
              }} />
            </div>

            {/* Name */}
            <div style={{ padding: '0 16px 10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ height: '1px', flex: 1, background: 'rgba(0,255,136,0.18)' }} />
                <span style={{
                  fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.88)',
                  letterSpacing: '0.14em',
                }}>MEU NOME</span>
                <div style={{ height: '1px', flex: 1, background: 'rgba(0,255,136,0.18)' }} />
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'space-around',
              padding: '10px 14px 16px',
              borderTop: '1px solid rgba(0,255,136,0.1)',
              background: 'rgba(0,0,0,0.25)',
            }}>
              {cardStats.map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{v}</div>
                  <div style={{
                    fontSize: '7.5px', color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.06em', marginTop: '2px',
                  }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Attribute bars ── */}
        <div className="ccs-right">
          {attrs.map(a => (
            <div key={a.label}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '6px',
              }}>
                <span style={{
                  fontSize: '10px', color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.12em', fontWeight: 700,
                }}>{a.label}</span>
                <span style={{
                  fontSize: '12px', fontWeight: 800, color: 'white',
                }}>{a.val}</span>
              </div>
              <div style={{
                height: '4px', background: 'rgba(255,255,255,0.07)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div className="attr-bar" style={{
                  height: '100%', width: `${a.val}%`,
                  background: 'linear-gradient(90deg, #00c860, #00FF88)',
                  borderRadius: '3px',
                  boxShadow: '0 0 8px rgba(0,255,136,0.55)',
                }} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

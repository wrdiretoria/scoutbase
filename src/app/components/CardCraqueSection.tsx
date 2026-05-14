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

// OVR 85+ = OURO | 70–84 = PRATA | <70 = BRONZE
const OVR = 87
const tier = OVR >= 85
  ? { label: 'OURO',   card: 'linear-gradient(160deg,#2a1a00 0%,#1e1200 55%,#0e0900 100%)', border: 'rgba(212,168,67,0.55)',  glow: 'rgba(212,168,67,0.30)', ovr: '#f0c040', accent: '#d4a843', badge: 'linear-gradient(135deg,#b8860b,#f0c040)' }
  : OVR >= 70
  ? { label: 'PRATA',  card: 'linear-gradient(160deg,#1a1a1f 0%,#111118 55%,#08080e 100%)', border: 'rgba(192,192,210,0.45)', glow: 'rgba(180,180,200,0.22)', ovr: '#d0d0e8', accent: '#a0a0c0', badge: 'linear-gradient(135deg,#707080,#c0c0d8)' }
  : { label: 'BRONZE', card: 'linear-gradient(160deg,#1f1008 0%,#140b05 55%,#0a0603 100%)', border: 'rgba(180,100,40,0.50)',  glow: 'rgba(180,100,40,0.22)', ovr: '#d4804a', accent: '#c87040', badge: 'linear-gradient(135deg,#7a3a10,#d4804a)' }

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
          0%,100% { transform: translateY(0) rotate(-1.5deg); }
          50%      { transform: translateY(-14px) rotate(-1.5deg); }
        }
        @keyframes cardShimmer {
          0%   { left: -80% }
          100% { left: 160% }
        }
        @keyframes barGrow { from { width: 0 } }
        .craque-card-wrap { animation: cardFloat 5s ease-in-out infinite; }
        .craque-card-wrap:hover { animation-play-state: paused; }
        .attr-bar { animation: barGrow .8s cubic-bezier(.22,1,.36,1) forwards; }
        .card-shimmer {
          position: absolute; top: 0; bottom: 0; width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: skewX(-18deg);
          animation: cardShimmer 4s ease-in-out infinite 2s;
          pointer-events: none;
        }
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
        background: `radial-gradient(ellipse at 50% 50%, ${tier.glow} 0%, transparent 62%)`,
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
            lineHeight: 1.72, margin: '0 0 28px', maxWidth: '300px',
          }}>
            Mostre quem você é dentro e fora de campo.
            Crie seu card profissional e seja descoberto
            por scouts e clubes de todo o Brasil.
          </p>

          {/* Tier legend */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
            {[
              { label: 'OURO',   color: '#f0c040', sub: '85+' },
              { label: 'PRATA',  color: '#c0c0d8', sub: '70–84' },
              { label: 'BRONZE', color: '#d4804a', sub: '<70' },
            ].map(t => (
              <div key={t.label} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: '9px', fontWeight: 700, color: t.color, letterSpacing: '0.1em' }}>{t.label}</span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{t.sub}</span>
              </div>
            ))}
          </div>

          <a href="/atleta/cadastro" className="ccs-cta-btn">
            CRIAR MEU CARD &nbsp;→
          </a>
        </div>

        {/* ── CENTER: The Card ── */}
        <div className="ccs-center craque-card-wrap">
          <div style={{
            width: '220px',
            background: tier.card,
            borderRadius: '22px',
            border: `1.5px solid ${tier.border}`,
            overflow: 'hidden',
            boxShadow: `0 0 90px ${tier.glow}, 0 0 30px ${tier.glow}, 0 32px 72px rgba(0,0,0,0.85)`,
            position: 'relative',
          }}>
            {/* Shimmer sweep */}
            <div className="card-shimmer" />

            {/* Top accent line */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${tier.accent}, transparent)` }} />

            {/* Card header: OVR + position left | tier badge + flag right */}
            <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '56px', fontWeight: 900, color: tier.ovr,
                  lineHeight: 1, letterSpacing: '-0.04em',
                  textShadow: `0 0 28px ${tier.glow}`,
                }}>{OVR}</div>
                <div style={{
                  fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.12em', marginTop: '3px',
                }}>MEI</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                {/* Tier badge */}
                <div style={{
                  padding: '3px 8px', borderRadius: '6px',
                  background: tier.badge,
                  fontSize: '7px', fontWeight: 900,
                  color: 'rgba(0,0,0,0.75)', letterSpacing: '0.12em',
                }}>{tier.label}</div>
                {/* Logo MC */}
                <div style={{
                  width: '32px', height: '32px',
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '8px', border: `1px solid ${tier.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 900, color: tier.ovr, letterSpacing: '0.04em',
                }}>MC</div>
                <span style={{ fontSize: '20px' }}>🇧🇷</span>
              </div>
            </div>

            {/* Player photo */}
            <div style={{
              height: '148px', margin: '8px 14px',
              borderRadius: '14px', overflow: 'hidden',
              position: 'relative',
              border: `1px solid ${tier.border}`,
            }}>
              <img
                src="/images/hero-player.png"
                alt="Atleta"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 12%',
                  display: 'block',
                }}
              />
              {/* Bottom fade so name reads clean */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
              }} />
              {/* Neon edge glow */}
              <div style={{
                position: 'absolute', inset: 0,
                boxShadow: `inset 0 0 22px ${tier.glow}`,
                borderRadius: '14px',
              }} />
            </div>

            {/* Name */}
            <div style={{ padding: '0 16px 10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ height: '1px', flex: 1, background: `${tier.border}` }} />
                <span style={{
                  fontSize: '12px', fontWeight: 900, color: 'white',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>RAFAEL SILVA</span>
                <div style={{ height: '1px', flex: 1, background: `${tier.border}` }} />
              </div>
              {/* Trainer seal */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF88' }} />
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
                  avaliado por <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>Carlos Mendes</span>
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', justifyContent: 'space-around',
              padding: '10px 14px 16px',
              borderTop: `1px solid ${tier.border}`,
              background: 'rgba(0,0,0,0.35)',
            }}>
              {cardStats.map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: tier.ovr, lineHeight: 1 }}>{v}</div>
                  <div style={{
                    fontSize: '7.5px', color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.06em', marginTop: '3px',
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
                  fontSize: '12px', fontWeight: 800, color: tier.ovr,
                }}>{a.val}</span>
              </div>
              <div style={{
                height: '4px', background: 'rgba(255,255,255,0.07)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div className="attr-bar" style={{
                  height: '100%', width: `${a.val}%`,
                  background: `linear-gradient(90deg, ${tier.accent}, ${tier.ovr})`,
                  borderRadius: '3px',
                  boxShadow: `0 0 8px ${tier.glow}`,
                }} />
              </div>
            </div>
          ))}

          {/* Atleta ID */}
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Atleta ID</span>
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${tier.border}`,
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: tier.ovr, letterSpacing: '0.12em' }}>04729</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

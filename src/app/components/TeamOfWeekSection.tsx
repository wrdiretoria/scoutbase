// Server Component — sem 'use client'

type FutCard = {
  initials:      string
  name:          string
  pos:           string
  score:         number
  badge:         string
  badgeBg:       string
  badgeText:     string
  avatarGrad:    string
  cardBg:        string
  topLine:       string
  borderColor:   string
  boxShadow:     string
  hoverShadow:   string
  stats: { lbl: string; val: number }[]
  featured?:     boolean
}

const showcase: FutCard[] = [
  {
    initials:'PL', name:'Pedro L.', pos:'CA', score:90,
    badge:'GOL DA RODADA',
    badgeBg:'rgba(0,255,136,0.10)', badgeText:'#00FF88',
    avatarGrad:'linear-gradient(145deg,#065f28,#00e87a)',
    cardBg:'linear-gradient(168deg,#0b1c10 0%,#06100a 60%,#040c07 100%)',
    topLine:'rgba(0,255,136,0.55)',
    borderColor:'rgba(0,255,136,0.18)',
    boxShadow:'0 0 28px rgba(0,255,136,0.09),0 16px 48px rgba(0,0,0,0.78)',
    hoverShadow:'0 0 52px rgba(0,255,136,0.30),0 24px 60px rgba(0,0,0,0.88)',
    stats:[{lbl:'FIN',val:92},{lbl:'VEL',val:88},{lbl:'DRB',val:87}],
  },
  {
    initials:'JV', name:'João V.', pos:'MC', score:88,
    badge:'CAPITÃO ©',
    badgeBg:'rgba(167,139,250,0.12)', badgeText:'#a78bfa',
    avatarGrad:'linear-gradient(145deg,#3b1b8c,#a78bfa)',
    cardBg:'linear-gradient(168deg,#0f0a1e 0%,#080612 60%,#050410 100%)',
    topLine:'rgba(167,139,250,0.55)',
    borderColor:'rgba(167,139,250,0.18)',
    boxShadow:'0 0 24px rgba(167,139,250,0.08),0 16px 48px rgba(0,0,0,0.78)',
    hoverShadow:'0 0 48px rgba(167,139,250,0.26),0 24px 60px rgba(0,0,0,0.88)',
    stats:[{lbl:'PAS',val:91},{lbl:'VIS',val:89},{lbl:'CAB',val:82}],
  },
  {
    initials:'GS', name:'Gabriel S.', pos:'PD', score:91,
    badge:'⭐ CRAQUE DA SEMANA',
    badgeBg:'rgba(251,191,36,0.14)', badgeText:'#fbbf24',
    avatarGrad:'linear-gradient(145deg,#7c3300,#fbbf24)',
    cardBg:'linear-gradient(168deg,#1e1400 0%,#110c00 60%,#080500 100%)',
    topLine:'rgba(251,191,36,0.80)',
    borderColor:'rgba(251,191,36,0.42)',
    boxShadow:'0 0 48px rgba(251,191,36,0.22),0 0 90px rgba(251,191,36,0.08),0 20px 56px rgba(0,0,0,0.85)',
    hoverShadow:'0 0 72px rgba(251,191,36,0.40),0 0 120px rgba(251,191,36,0.15),0 28px 64px rgba(0,0,0,0.92)',
    stats:[{lbl:'VEL',val:94},{lbl:'DRB',val:92},{lbl:'FIN',val:90}],
    featured:true,
  },
  {
    initials:'RP', name:'Rodrigo P.', pos:'GK', score:87,
    badge:'DEFESA DO MÊS',
    badgeBg:'rgba(251,191,36,0.10)', badgeText:'rgba(251,191,36,0.88)',
    avatarGrad:'linear-gradient(145deg,#854d0e,#fbbf24)',
    cardBg:'linear-gradient(168deg,#120c00 0%,#0a0700 60%,#060500 100%)',
    topLine:'rgba(251,191,36,0.38)',
    borderColor:'rgba(251,191,36,0.14)',
    boxShadow:'0 0 22px rgba(251,191,36,0.07),0 16px 48px rgba(0,0,0,0.78)',
    hoverShadow:'0 0 42px rgba(251,191,36,0.22),0 24px 60px rgba(0,0,0,0.88)',
    stats:[{lbl:'REF',val:90},{lbl:'POS',val:88},{lbl:'SAI',val:85}],
  },
  {
    initials:'CF', name:'Cauã F.', pos:'PE', score:86,
    badge:'REVELAÇÃO',
    badgeBg:'rgba(0,255,136,0.10)', badgeText:'rgba(0,255,136,0.85)',
    avatarGrad:'linear-gradient(145deg,#064d22,#00c865)',
    cardBg:'linear-gradient(168deg,#0b1c10 0%,#06100a 60%,#040c07 100%)',
    topLine:'rgba(0,255,136,0.38)',
    borderColor:'rgba(0,255,136,0.14)',
    boxShadow:'0 0 20px rgba(0,255,136,0.07),0 16px 48px rgba(0,0,0,0.78)',
    hoverShadow:'0 0 38px rgba(0,255,136,0.22),0 24px 60px rgba(0,0,0,0.88)',
    stats:[{lbl:'VEL',val:91},{lbl:'DRB',val:88},{lbl:'FIN',val:83}],
  },
]

export default function TeamOfWeekSection() {
  return (
    <section className="tow-section">
      <style>{`
        /* ── Keyframes ── */
        @keyframes futReveal {
          from { opacity:0; transform:translateY(28px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes futShine {
          0%,10%   { left:-80% }
          55%,100% { left:150% }
        }
        @keyframes futShineFeat {
          0%,10%   { left:-80% }
          50%,100% { left:150% }
        }
        @keyframes futGlowBreathe {
          0%,100% { opacity:0.80 }
          50%      { opacity:1 }
        }
        @keyframes towAtmoPulse {
          0%,100% { opacity:0.5 }
          50%      { opacity:0.85 }
        }

        /* ── Section ── */
        .tow-section {
          position:relative;
          padding:88px 0 96px;
          background:#060d08;
          overflow:hidden;
        }

        /* ── Atmosphere ── */
        .tow-atmo-top {
          position:absolute; inset:0; pointer-events:none; z-index:0;
          background:radial-gradient(ellipse at 50% -5%, rgba(0,60,28,0.38) 0%, transparent 55%);
          animation:towAtmoPulse 6s ease-in-out infinite;
        }
        .tow-atmo-bot {
          position:absolute; inset:0; pointer-events:none; z-index:0;
          background:radial-gradient(ellipse at 50% 108%, rgba(0,255,136,0.04) 0%, transparent 50%);
        }

        /* ── Header ── */
        .tow-header {
          position:relative; z-index:1;
          text-align:center; margin-bottom:52px; padding:0 24px;
        }
        .tow-micro {
          font-size:10px; font-weight:800; letter-spacing:0.22em; color:#00FF88;
          text-transform:uppercase; margin:0 0 14px;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .tow-h2 {
          font-size:clamp(26px,3.8vw,44px); font-weight:900;
          letter-spacing:-0.03em; color:white; line-height:1.08; margin:0;
        }
        .tow-sub {
          margin:12px auto 0; font-size:15px;
          color:rgba(255,255,255,0.35); max-width:380px; line-height:1.6;
        }

        /* ── Track ── */
        .fut-track {
          position:relative; z-index:1;
          display:flex; align-items:flex-end; justify-content:center;
          gap:16px; padding:16px 40px 36px;
        }

        /* ── Card wrapper (staggered reveal) ── */
        .fut-card-wrap {
          opacity:0;
          animation:futReveal 0.75s cubic-bezier(.22,1,.36,1) forwards;
        }
        .fut-card-wrap:nth-child(1) { animation-delay:0.08s; }
        .fut-card-wrap:nth-child(2) { animation-delay:0.22s; }
        .fut-card-wrap:nth-child(3) { animation-delay:0.36s; }
        .fut-card-wrap:nth-child(4) { animation-delay:0.50s; }
        .fut-card-wrap:nth-child(5) { animation-delay:0.64s; }

        /* ── Card ── */
        .fut-card {
          position:relative; overflow:hidden;
          width:162px; border-radius:20px;
          padding:18px 14px 16px;
          cursor:default;
          transition:transform 0.28s cubic-bezier(.22,1,.36,1), box-shadow 0.28s ease;
          -webkit-tap-highlight-color:transparent;
          user-select:none;
        }
        .fut-card:hover,
        .fut-card:focus-visible {
          transform:translateY(-9px) scale(1.045);
          box-shadow:var(--hshadow) !important;
        }
        .fut-card:active { transform:translateY(-4px) scale(1.02) !important; }

        /* Featured (center) */
        .fut-card.featured {
          width:202px;
          padding:22px 18px 20px;
          border-radius:22px;
        }
        .fut-card.featured:hover,
        .fut-card.featured:focus-visible {
          transform:translateY(-12px) scale(1.035);
        }

        /* Shine sweep — ::after */
        .fut-card::after {
          content:''; pointer-events:none;
          position:absolute; top:0; bottom:0; width:42%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.038),transparent);
          transform:skewX(-18deg);
          animation:futShine 9s ease-in-out infinite 1.2s;
        }
        .fut-card.featured::after {
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
          animation:futShineFeat 6.5s ease-in-out infinite 0.5s;
        }

        /* ── Overall score ── */
        .fut-overall {
          display:block;
          font-size:44px; font-weight:900; color:white; line-height:0.88;
          font-variant-numeric:tabular-nums;
          text-shadow:0 2px 14px rgba(0,0,0,0.85);
          margin-bottom:4px;
        }
        .fut-card.featured .fut-overall { font-size:56px; }

        /* ── Position badge (below overall) ── */
        .fut-pos-lbl {
          font-size:10.5px; font-weight:800; letter-spacing:0.10em;
          color:rgba(255,255,255,0.48); text-transform:uppercase;
          margin-bottom:14px; display:block;
        }
        .fut-card.featured .fut-pos-lbl { font-size:12px; margin-bottom:16px; }

        /* ── Avatar ── */
        .fut-avatar-wrap { display:flex; justify-content:center; margin-bottom:14px; }
        .fut-avatar {
          position:relative; overflow:hidden;
          width:74px; height:74px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:19px; font-weight:900; color:white; letter-spacing:-0.02em;
          border:2px solid rgba(255,255,255,0.20);
          box-shadow:0 4px 22px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.18);
          animation:futGlowBreathe 4s ease-in-out infinite;
        }
        .fut-card.featured .fut-avatar {
          width:92px; height:92px; font-size:23px;
          animation-duration:3.2s;
        }
        /* Inner highlight */
        .fut-avatar::after {
          content:''; pointer-events:none;
          position:absolute; top:-35%; left:-30%;
          width:55%; height:55%;
          background:radial-gradient(ellipse, rgba(255,255,255,0.22), transparent 70%);
        }

        /* ── Name ── */
        .fut-name {
          text-align:center; margin:0 0 10px;
          font-size:13px; font-weight:800; color:white;
          letter-spacing:0.05em; text-transform:uppercase;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .fut-card.featured .fut-name { font-size:14.5px; margin-bottom:11px; }

        /* ── Highlight badge ── */
        .fut-badge {
          display:block; text-align:center;
          margin:0 auto 12px;
          font-size:7.5px; font-weight:800; letter-spacing:0.13em;
          text-transform:uppercase;
          padding:4px 10px; border-radius:100px;
          border:1px solid rgba(255,255,255,0.12);
          white-space:nowrap; max-width:100%;
          overflow:hidden; text-overflow:ellipsis;
        }
        .fut-card.featured .fut-badge { font-size:8.5px; padding:5px 12px; margin-bottom:14px; }

        /* ── Stats row ── */
        .fut-stats {
          display:flex; justify-content:center; gap:12px;
          border-top:1px solid rgba(255,255,255,0.07);
          padding-top:10px;
        }
        .fut-stat { display:flex; flex-direction:column; align-items:center; gap:1px; }
        .fut-stat-val {
          font-size:13px; font-weight:900; color:white; line-height:1;
          font-variant-numeric:tabular-nums;
        }
        .fut-stat-lbl {
          font-size:7px; font-weight:700; letter-spacing:0.07em;
          color:rgba(255,255,255,0.32); text-transform:uppercase;
        }
        .fut-card.featured .fut-stat-val { font-size:15px; }
        .fut-card.featured .fut-stat-lbl { font-size:8px; }
        .fut-card.featured .fut-stats { gap:14px; padding-top:12px; }

        /* ── Footer ── */
        .tow-footer {
          position:relative; z-index:1;
          text-align:center; margin-top:44px; padding:0 24px;
        }
        .tow-footer-txt {
          font-size:12px; color:rgba(255,255,255,0.24); margin:0 0 16px;
        }
        .tow-footer-txt strong { color:rgba(255,255,255,0.44); }
        .tow-cta {
          display:inline-flex; align-items:center; gap:8px;
          color:#22c55e; font-size:14px; font-weight:700;
          text-decoration:none;
          border-bottom:1px solid rgba(34,197,94,0.30); padding-bottom:2px;
          transition:color 0.2s, border-color 0.2s;
        }
        .tow-cta:hover { color:#00FF88; border-color:rgba(0,255,136,0.6); }

        /* ── Mobile scroll hint ── */
        .fut-scroll-hint {
          display:none;
          position:relative; z-index:1;
          text-align:center; margin-top:8px;
          font-size:10.5px; letter-spacing:0.10em;
          color:rgba(255,255,255,0.20); font-weight:600;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .tow-section { padding:72px 0 80px; }
          .tow-header { margin-bottom:40px; }
          .tow-sub { font-size:13.5px !important; }

          .fut-track {
            justify-content:flex-start;
            overflow-x:auto;
            scroll-snap-type:x mandatory;
            -webkit-overflow-scrolling:touch;
            scrollbar-width:none;
            padding:16px 20px 32px;
            gap:12px;
          }
          .fut-track::-webkit-scrollbar { display:none; }
          .fut-card-wrap { scroll-snap-align:center; flex-shrink:0; }

          .fut-card { width:148px; border-radius:18px; padding:15px 12px 14px; }
          .fut-card.featured { width:178px; border-radius:20px; padding:18px 14px 16px; }

          .fut-overall { font-size:40px; }
          .fut-card.featured .fut-overall { font-size:50px; }

          .fut-avatar { width:66px; height:66px; font-size:17px; }
          .fut-card.featured .fut-avatar { width:82px; height:82px; font-size:21px; }

          .fut-stat-val { font-size:12px; }
          .fut-card.featured .fut-stat-val { font-size:14px; }

          .fut-scroll-hint { display:block; }
        }

        @media (max-width: 420px) {
          .fut-card { width:136px; }
          .fut-card.featured { width:162px; }
          .fut-overall { font-size:36px; }
          .fut-card.featured .fut-overall { font-size:46px; }
          .tow-h2 { font-size:24px !important; }
        }
      `}</style>

      {/* Stadium atmosphere layers */}
      <div className="tow-atmo-top" aria-hidden />
      <div className="tow-atmo-bot" aria-hidden />

      {/* ── Header ── */}
      <div className="tow-header">
        <p className="tow-micro">⭐ Seleção da Semana</p>
        <h2 className="tow-h2">O melhor do futebol de base</h2>
        <p className="tow-sub">Escalado pelos dados. Exibido para o Brasil.</p>
      </div>

      {/* ── Cards ── */}
      <div className="fut-track">
        {showcase.map((p) => (
          <div key={p.name} className={`fut-card-wrap${p.featured ? ' featured-wrap' : ''}`}>
            <div
              className={`fut-card${p.featured ? ' featured' : ''}`}
              style={{
                background:  p.cardBg,
                border:      `1px solid ${p.borderColor}`,
                boxShadow:   p.boxShadow,
                ['--hshadow' as string]: p.hoverShadow,
              }}
            >
              {/* Top accent line */}
              <div aria-hidden style={{
                position:'absolute', top:0, left:'16%', right:'16%',
                height:'2px', borderRadius:'0 0 4px 4px',
                background:`linear-gradient(90deg,transparent,${p.topLine},transparent)`,
              }} />

              {/* Overall + Position */}
              <span className="fut-overall">{p.score}</span>
              <span className="fut-pos-lbl">{p.pos}</span>

              {/* Avatar */}
              <div className="fut-avatar-wrap">
                <div
                  className="fut-avatar"
                  style={{
                    background: p.avatarGrad,
                    boxShadow: `0 4px 22px rgba(0,0,0,0.65), 0 0 18px ${p.borderColor}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  }}
                >
                  {p.initials}
                </div>
              </div>

              {/* Name */}
              <p className="fut-name">{p.name}</p>

              {/* Badge */}
              <div
                className="fut-badge"
                style={{ color: p.badgeText, background: p.badgeBg, borderColor: `${p.badgeText}38` }}
              >
                {p.badge}
              </div>

              {/* Stats */}
              <div className="fut-stats">
                {p.stats.map(s => (
                  <div key={s.lbl} className="fut-stat">
                    <span className="fut-stat-val">{s.val}</span>
                    <span className="fut-stat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <p className="fut-scroll-hint" aria-hidden>deslize para ver mais →</p>

      {/* ── Footer ── */}
      <div className="tow-footer">
        <p className="tow-footer-txt">
          Baseada em <strong>1.247</strong> avaliações esta semana · Atualizada toda segunda-feira
        </p>
        <a href="/cadastro" className="tow-cta">
          Entrar no próximo ranking e disputar uma vaga →
        </a>
      </div>
    </section>
  )
}

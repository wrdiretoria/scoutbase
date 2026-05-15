import Link from 'next/link'
import NavBar from './components/NavBar'
import ActivityTicker from './components/ActivityTicker'
import TeamOfWeekSection from './components/TeamOfWeekSection'
import ProspectsSection from './components/ProspectsSection'
import RankingSection from './components/RankingSection'
import CardCraqueSection from './components/CardCraqueSection'
import FeaturesSection from './components/FeaturesSection'
import ParaQuemSection from './components/ParaQuemSection'
import StatsBar from './components/StatsBar'

const cards = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
    ),
    title: 'Para treinadores',
    desc: 'Avalie atletas, construa reputação e seja reconhecido no futebol de base.',
    href: '/treinador/cadastro',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: 'Para atletas',
    desc: 'Evolua seu jogo, ganhe destaque e seja visto por quem importa.',
    href: '/atleta/cadastro',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    title: 'Para responsáveis',
    desc: 'Acompanhe cada passo do seu filho com segurança e clareza.',
    href: '/pais/entrar',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    ),
    title: 'Para scouts',
    desc: 'Encontre novos talentos de forma rápida e eficiente.',
    href: '/scout/busca',
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#06100a', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        /* ─── DESKTOP / GLOBAL ─── */
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatBack { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}  }
        @keyframes heroFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse  {
          0%,100%{text-shadow:0 0 30px rgba(0,255,136,0.55),0 0 70px rgba(0,255,136,0.22),0 0 110px rgba(0,255,136,0.08)}
          50%    {text-shadow:0 0 50px rgba(0,255,136,0.75),0 0 110px rgba(0,255,136,0.32),0 0 160px rgba(0,255,136,0.12)}
        }
        @keyframes glowBreathe {
          0%,100% { opacity:0.75; transform:scale(1)    }
          50%     { opacity:1;    transform:scale(1.06) }
        }
        @keyframes particleRise {
          0%   { transform:translateY(0)     scale(1);   opacity:0   }
          15%  { opacity:0.55 }
          75%  { opacity:0.25 }
          100% { transform:translateY(-110px) scale(0.5); opacity:0  }
        }
        @keyframes shimmerFlow {
          0%   { left:-70% }
          100% { left:140% }
        }

        .card-item { transition:background .2s; cursor:default; }
        .card-item:hover { background:rgba(34,197,94,0.06); }

        .h-badge  { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.08s; opacity:0; }
        .h-line-1 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.22s; opacity:0; }
        .h-line-2 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.36s; opacity:0; }
        .h-line-3 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.50s; opacity:0; }
        .h-sub    { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.66s; opacity:0; }
        .h-ctas   { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.80s; opacity:0; }
        .h-social { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.95s; opacity:0; }
        .neon-word { animation:glowPulse 3.5s ease-in-out infinite; }
        .hero-hud  { display:block; }
        .hero-h1-line { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
        .hero-badge   { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }

        /* Mobile-only elements — hidden on desktop */
        .hero-particles, .hero-mob-sub, .hero-social { display:none; }
        .hero-bolt  { display:none; }
        .hero-rule  { display:none; }

        /* ── Desktop CTA hover states ── */
        .hero-cta-primary {
          transition:filter .18s ease, transform .15s ease, box-shadow .18s ease !important;
        }
        .hero-cta-primary:hover {
          filter:brightness(1.10) !important;
          transform:translateY(-1px) !important;
          box-shadow:
            0 0 0 1px rgba(0,255,136,0.48),
            0 0 36px rgba(0,255,136,0.44),
            0 0 72px rgba(0,255,136,0.16),
            0 6px 22px rgba(0,0,0,0.46),
            inset 0 1px 0 rgba(255,255,255,0.28) !important;
        }
        .hero-cta-secondary {
          transition:border-color .2s ease, box-shadow .2s ease, color .2s ease !important;
        }
        .hero-cta-secondary:hover {
          border-color:rgba(0,255,136,0.36) !important;
          box-shadow:0 0 18px rgba(0,255,136,0.14) !important;
          color:rgba(255,255,255,0.94) !important;
        }

        /* Stats panel glass shine — top-edge highlight */
        .hero-stats-panel { position:relative; overflow:hidden; }
        .hero-stats-panel::before {
          content:'';
          position:absolute;
          top:0; left:0; right:0; height:52%;
          background:linear-gradient(180deg,rgba(255,255,255,0.07) 0%,transparent 100%);
          border-radius:18px 18px 0 0;
          pointer-events:none;
          z-index:0;
        }
        .hero-stats-panel > * { position:relative; z-index:1; }

        /* ─── MOBILE HERO — Poster / Nike Football / EA Sports FC ─── */
        @media (max-width: 768px) {

          /* ── Full bleed ── */
          .hero-section { height:100dvh !important; min-height:0 !important; }

          /* ── Player: upper body prominent, slightly right ── */
          .hero-player-img { object-position:55% 12% !important; }

          /* ── OVERLAY RECOMPOSITION ── */

          /* 1 — bottom fog: athlete open in upper 55%, deep dark at base */
          .hero-ov1 {
            background:
              linear-gradient(to top,
                rgba(1,5,2,1.00) 0%,
                rgba(1,5,2,0.97) 22%,
                rgba(1,5,2,0.60) 44%,
                rgba(1,5,2,0.08) 62%,
                transparent      74%
              ),
              linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 50%) !important;
          }

          /* 2 — cinematic vignette: top shade + left depth */
          .hero-ov2 {
            background:
              linear-gradient(to bottom, rgba(1,5,2,0.86) 0%, rgba(1,5,2,0.36) 20%, transparent 40%),
              radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.60) 100%) !important;
          }

          /* 3 — neon green glow, layered, breathing */
          .hero-ov3 {
            background:
              radial-gradient(ellipse at 35% 72%, rgba(0,255,136,0.28) 0%, rgba(0,255,136,0.10) 28%, transparent 52%),
              radial-gradient(ellipse at 14% 92%, rgba(0,255,136,0.12) 0%, transparent 36%),
              radial-gradient(ellipse at 60% 88%, rgba(0,200,100,0.06) 0%, transparent 28%) !important;
            animation:glowBreathe 4s ease-in-out infinite !important;
          }

          /* 4 — stadium light: single warm-white radial from top, subtle */
          .hero-ov4 {
            background:
              radial-gradient(ellipse at 55% -6%, rgba(220,255,240,0.10) 0%, transparent 50%) !important;
          }

          /* 5 — ground fog: deepen the field base with green tint */
          .hero-ov5 {
            background:
              linear-gradient(to top, rgba(0,12,5,0.68) 0%, rgba(0,12,5,0.18) 16%, transparent 36%),
              radial-gradient(ellipse at 50% 104%, rgba(0,255,136,0.10) 0%, transparent 40%) !important;
          }

          /* ── POSTER GRID — full-height flex column ── */
          .hero-grid {
            display:flex !important;
            flex-direction:column !important;
            align-items:stretch !important;
            justify-content:flex-start !important;
            grid-template-columns:none !important;
            padding:0 !important;
            gap:0 !important;
            height:100% !important;
            width:100% !important;
          }
          .hero-phones { display:none !important; }
          .hero-hud    { display:none !important; }

          /* ── LEFT = full-height poster column ── */
          .hero-left {
            display:flex !important;
            flex-direction:column !important;
            gap:0 !important;
            padding-top:calc(11dvh + env(safe-area-inset-top)) !important;
            padding-bottom:calc(32px + env(safe-area-inset-bottom)) !important;
            padding-left:24px !important;
            padding-right:24px !important;
            min-width:0 !important;
            flex:1 !important;
          }

          /* ── TOP CLUSTER: badge → rule → headline ── */

          .hero-badge {
            font-size:8px !important;
            padding:5px 14px !important;
            letter-spacing:0.20em !important;
            margin-bottom:12px !important;
            border-color:rgba(0,255,136,0.40) !important;
            background:rgba(0,255,136,0.07) !important;
            align-self:flex-start !important;
          }

          .hero-rule {
            display:block !important;
            width:32px; height:2px;
            background:linear-gradient(90deg,#00FF88,rgba(0,255,136,0.18));
            border-radius:2px;
            box-shadow:0 0 14px rgba(0,255,136,0.90);
            margin:0 0 16px !important;
          }

          /* H1 with auto margin — creates the "athlete window" below headline */
          .hero-left h1 {
            margin-bottom:auto !important;
          }

          /* ── POSTER HEADLINE — giant, dramatic, poster-grade ── */
          .hero-h1-line {
            font-size:clamp(52px,11vw,78px) !important;
            letter-spacing:-0.058em !important;
            line-height:0.90 !important;
            text-shadow:
              0 4px 44px rgba(0,0,0,0.95),
              0 2px 12px rgba(0,0,0,0.80),
              0 0 80px rgba(0,0,0,0.5) !important;
          }

          /* ── BOTTOM CLUSTER — pushed to base by h1 margin-bottom:auto ── */

          /* Desktop sub hidden */
          .hero-sub { display:none !important; }

          /* Mobile sub */
          .hero-mob-sub {
            display:block !important;
            font-size:13px !important;
            color:rgba(255,255,255,0.64) !important;
            line-height:1.62 !important;
            margin:0 0 16px !important;
            font-weight:400 !important;
            letter-spacing:0.010em !important;
            max-width:290px !important;
          }

          /* CTAs — vertical stack, full width */
          .hero-ctas-wrap {
            flex-direction:column !important;
            align-items:stretch !important;
            gap:10px !important;
            margin-top:0 !important;
            margin-bottom:14px !important;
            width:100% !important;
            align-self:stretch !important;
          }

          /* Primary CTA — pill, full-width, neon gradient */
          .hero-cta-primary {
            position:relative !important;
            overflow:hidden !important;
            width:100% !important;
            font-size:13px !important;
            padding:13px 22px !important;
            border-radius:100px !important;
            letter-spacing:0.09em !important;
            gap:7px !important;
            flex-shrink:0 !important;
            -webkit-tap-highlight-color:transparent !important;
            background:linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%) !important;
            color:#020c05 !important;
            font-weight:800 !important;
            box-shadow:
              0 0 0 1px rgba(0,255,136,0.42),
              0 0 22px rgba(0,255,136,0.36),
              0 0 50px rgba(0,255,136,0.12),
              0 4px 16px rgba(0,0,0,0.55),
              inset 0 1px 0 rgba(255,255,255,0.26) !important;
            transition:transform .15s ease, box-shadow .18s ease, filter .15s ease !important;
          }
          .hero-cta-primary:active {
            transform:scale(0.95) !important;
            filter:brightness(0.92) !important;
            box-shadow:
              0 0 0 1px rgba(0,255,136,0.32),
              0 0 12px rgba(0,255,136,0.22),
              0 2px 8px rgba(0,0,0,0.50) !important;
          }
          .hero-cta-primary::after {
            content:'';
            position:absolute; top:0; bottom:0; width:45%;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
            transform:skewX(-18deg);
            animation:shimmerFlow 3.5s ease-in-out infinite 1.8s;
          }
          .hero-bolt { display:inline-block !important; font-style:normal; font-size:11px !important; }

          /* Secondary CTA — glass pill */
          .hero-cta-secondary {
            width:100% !important;
            font-size:12.5px !important;
            padding:12px 16px !important;
            border-radius:100px !important;
            text-align:center !important;
            background:rgba(255,255,255,0.06) !important;
            border:1px solid rgba(255,255,255,0.18) !important;
            backdrop-filter:blur(12px) !important;
            -webkit-backdrop-filter:blur(12px) !important;
            -webkit-tap-highlight-color:transparent !important;
            white-space:nowrap !important;
            color:rgba(255,255,255,0.80) !important;
            font-weight:600 !important;
            letter-spacing:0.06em !important;
            transition:border-color .2s ease, box-shadow .2s ease !important;
          }
          .hero-cta-secondary:active {
            border-color:rgba(0,255,136,0.42) !important;
            box-shadow:0 0 16px rgba(0,255,136,0.14) !important;
          }

          /* Social proof — premium glassmorphism with green tint */
          .hero-social {
            display:flex !important;
            align-items:center !important;
            gap:10px !important;
            padding:10px 14px !important;
            border-radius:14px !important;
            align-self:flex-start !important;
            background:rgba(4,10,6,0.52) !important;
            border:1px solid rgba(0,255,136,0.13) !important;
            backdrop-filter:blur(22px) !important;
            -webkit-backdrop-filter:blur(22px) !important;
            box-shadow:
              0 0 28px rgba(0,255,136,0.06),
              0 8px 28px rgba(0,0,0,0.50),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 0 0 1px rgba(0,255,136,0.05) !important;
          }
          .hero-avatars {
            display:flex !important;
            flex-direction:row-reverse !important;
            flex-shrink:0 !important;
          }
          .hero-av {
            width:23px !important; height:23px !important;
            border-radius:50% !important;
            border:2px solid rgba(3,8,4,0.92) !important;
            margin-left:-6px !important;
            display:flex !important; align-items:center !important; justify-content:center !important;
            font-size:6.5px !important; font-weight:800 !important; color:white !important;
          }
          .hero-social-txt {
            margin:0 !important;
            font-size:10.5px !important;
            color:rgba(255,255,255,0.52) !important;
            line-height:1.44 !important;
          }
          .hero-social-txt strong { color:rgba(255,255,255,0.92) !important; font-weight:800 !important; }

          /* ── Hero stats panel — premium glassmorphism ── */
          .hero-stats-panel {
            display:flex !important;
            flex-direction:column !important;
            gap:13px !important;
            right:14px !important;
            top:42% !important;
            transform:translateY(-50%) !important;
            padding:14px 16px !important;

            /* Glass: transparent dark green tint */
            background:rgba(2,18,8,0.28) !important;
            backdrop-filter:blur(22px) saturate(170%) !important;
            -webkit-backdrop-filter:blur(22px) saturate(170%) !important;

            /* Border: subtle green, top brighter for glass refraction */
            border:1px solid rgba(0,255,136,0.20) !important;
            border-top:1px solid rgba(0,255,136,0.36) !important;
            border-radius:18px !important;

            /* Shadow: outer glow + depth + inner shine */
            box-shadow:
              0 0 0 1px rgba(0,255,136,0.06),
              0 0 28px rgba(0,255,136,0.18),
              0 0 60px rgba(0,255,136,0.07),
              0 16px 40px rgba(0,0,0,0.50),
              inset 0 0 18px rgba(0,255,136,0.04) !important;

            /* Float */
            animation:float 5s ease-in-out infinite !important;
          }

          /* ── Floating particles ── */
          .hero-particles {
            display:block !important; position:absolute !important;
            inset:0 !important; z-index:1 !important;
            pointer-events:none !important; overflow:hidden !important;
          }
          .hp {
            position:absolute !important; display:block !important;
            border-radius:50% !important; background:#00FF88 !important;
            opacity:0 !important; box-shadow:0 0 4px rgba(0,255,136,0.8) !important;
          }
          .hp1 { width:3px; height:3px; left:11%; bottom:42%; animation:particleRise 6.2s ease-in-out infinite 0.0s; }
          .hp2 { width:2px; height:2px; left:32%; bottom:34%; animation:particleRise 7.4s ease-in-out infinite 1.3s; }
          .hp3 { width:3px; height:3px; left:60%; bottom:48%; animation:particleRise 5.8s ease-in-out infinite 0.8s; }
          .hp4 { width:2px; height:2px; left:74%; bottom:26%; animation:particleRise 8.1s ease-in-out infinite 2.2s; }
          .hp5 { width:2px; height:2px; left:22%; bottom:56%; animation:particleRise 6.7s ease-in-out infinite 3.5s; }
          .hp6 { width:3px; height:3px; left:84%; bottom:40%; animation:particleRise 7.8s ease-in-out infinite 1.9s; }

          /* ── Rest of page ── */
          .cards-grid   { grid-template-columns:1fr 1fr !important; }
          .card-item    { border-right:none !important; border-bottom:1px solid rgba(34,197,94,0.1); }
          .footer-inner { flex-direction:column !important; gap:8px !important; text-align:center !important; }
        }

        @media (max-width: 480px) {
          .cards-grid  { grid-template-columns:1fr !important; }
          .hero-h1-line { font-size:clamp(42px,11vw,62px) !important; }
          .hero-mob-sub { font-size:12px !important; max-width:260px !important; }
        }
      `}</style>

      <NavBar />

      {/* ─── HERO ─── */}
      <section className="hero-section" style={{ position:'relative', height:'100svh', overflow:'hidden' }}>
        {/* BG */}
        <img
          className="hero-player-img"
          src="/images/hero-player.png"
          alt="" aria-hidden
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center center', zIndex:0 }}
        />
        {/* Overlay 1 — cinematic dark: left shadow + bottom base + top edge */}
        <div className="hero-ov1" style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(108deg, rgba(2,7,4,0.97) 0%, rgba(2,7,4,0.82) 36%, rgba(2,7,4,0.10) 70%, transparent 100%), linear-gradient(to top, rgba(1,5,2,0.75) 0%, rgba(1,5,2,0.28) 26%, transparent 50%), linear-gradient(to bottom, rgba(1,5,2,0.62) 0%, transparent 20%)' }} />
        {/* Overlay 2 — radial vignette: frame dark, centre opens */}
        <div className="hero-ov2" style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse at 58% 50%, transparent 26%, rgba(0,0,0,0.46) 60%, rgba(0,0,0,0.82) 100%)' }} />
        {/* Overlay 3 — green neon atmosphere: layered radials + breathing */}
        <div className="hero-ov3" style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse at 8% 78%, rgba(0,255,136,0.22) 0%, rgba(0,255,136,0.08) 28%, transparent 55%), radial-gradient(ellipse at 24% 96%, rgba(0,255,136,0.10) 0%, transparent 34%), radial-gradient(ellipse at 3% 54%, rgba(0,200,100,0.06) 0%, transparent 28%)', animation:'glowBreathe 4.5s ease-in-out infinite' }} />
        {/* Overlay 4 — stadium lights: warm-white radials from top */}
        <div className="hero-ov4" style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:'radial-gradient(ellipse at 62% -8%, rgba(235,255,245,0.13) 0%, rgba(200,240,220,0.05) 32%, transparent 60%), radial-gradient(ellipse at 78% -4%, rgba(255,255,255,0.05) 0%, transparent 40%), radial-gradient(ellipse at 44% -14%, rgba(200,255,225,0.07) 0%, transparent 38%)' }} />
        {/* Overlay 5 — ground fog + depth: bottom haze with green tint */}
        <div className="hero-ov5" style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:'linear-gradient(to top, rgba(0,16,7,0.72) 0%, rgba(0,16,7,0.22) 18%, transparent 40%), radial-gradient(ellipse at 50% 102%, rgba(0,255,136,0.08) 0%, transparent 42%)' }} />

        {/* Floating particles — mobile only, hidden on desktop via CSS */}
        <div className="hero-particles" aria-hidden>
          <span className="hp hp1"/><span className="hp hp2"/><span className="hp hp3"/>
          <span className="hp hp4"/><span className="hp hp5"/><span className="hp hp6"/>
        </div>

        {/* Grid */}
        <div className="hero-grid" style={{
          position:'relative', zIndex:2, height:'100%', width:'100%',
          display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',
          alignItems:'center', padding:'0 80px', gap:'48px', boxSizing:'border-box'
        }}>

          {/* LEFT */}
          <div className="hero-left" style={{ display:'flex', flexDirection:'column', gap:'22px', minWidth:0 }}>
            <span className="h-badge hero-badge" style={{
              display:'inline-flex', alignItems:'center', gap:'8px', width:'fit-content',
              padding:'6px 20px', borderRadius:'100px',
              border:'1px solid rgba(0,255,136,0.38)', background:'rgba(0,255,136,0.07)',
              backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
              boxShadow:'0 0 18px rgba(0,255,136,0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
              fontSize:'9.5px', fontWeight:700, color:'rgba(0,255,136,0.88)', letterSpacing:'0.22em',
            }}>
              É MAIS QUE FUTEBOL.
            </span>

            {/* Accent rule — visible only on mobile, between badge and headline */}
            <div className="hero-rule" />

            <h1 style={{ margin:0, padding:0, lineHeight:0.90, letterSpacing:'-0.050em' }}>
              <span className="h-line-1 hero-h1-line" style={{
                display:'block', fontSize:'clamp(52px,5.5vw,78px)',
                fontWeight:900, color:'white',
              }}>
                É SEU TALENTO
              </span>
              <span className="h-line-2 hero-h1-line" style={{
                display:'block', fontSize:'clamp(52px,5.5vw,78px)',
                fontWeight:900,
              }}>
                <span className="neon-word" style={{ color:'#00FF88' }}>GANHANDO O MUNDO.</span>
              </span>
            </h1>

            <p className="h-sub hero-sub" style={{
              fontSize:'clamp(13.5px,1.05vw,15px)', color:'rgba(255,255,255,0.76)',
              lineHeight:1.70, margin:0, maxWidth:'380px',
              fontWeight:400, letterSpacing:'0.014em',
            }}>
              Crie seu perfil, compartilhe seu talento e conecte-se com treinadores,
              clubes e{' '}
              <span style={{ color:'#00FF88', fontWeight:500 }}>oportunidades reais.</span>
            </p>

            {/* Mobile subtitle — hidden on desktop, shown via CSS */}
            <p className="hero-mob-sub">
              Crie seu perfil, compartilhe seu talento e conecte-se com treinadores,
              clubes e{' '}
              <span style={{ color:'#00FF88', fontWeight:500 }}>oportunidades reais.</span>
            </p>

            <div className="h-ctas hero-ctas-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'14px', marginTop:'4px' }}>
              <Link href="/atleta/cadastro" className="hero-cta-primary" style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                position:'relative', overflow:'hidden',
                gap:'6px', width:'220px',
                background:'linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%)',
                color:'#020c05', fontWeight:800, fontSize:'14px',
                borderRadius:'100px', padding:'13px 0', textDecoration:'none',
                letterSpacing:'0.08em',
                boxShadow:'0 0 0 1px rgba(0,255,136,0.38),0 0 24px rgba(0,255,136,0.32),0 0 52px rgba(0,255,136,0.10),0 4px 18px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,255,255,0.26)',
              }}>
                <span className="hero-bolt" aria-hidden>⚽</span>
                CRIAR MEU CARD
              </Link>
              <Link href="/login" className="hero-cta-secondary" style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:'220px',
                fontSize:'13.5px', fontWeight:600, color:'rgba(255,255,255,0.76)',
                textDecoration:'none', letterSpacing:'0.06em',
                background:'rgba(255,255,255,0.05)',
                backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:'100px', padding:'12px 0',
              }}>
                Entrar →
              </Link>
            </div>

            {/* Social proof card — mobile only, hidden on desktop via CSS */}
            <div className="hero-social h-social">
              <div className="hero-avatars">
                {[
                  { init:'RF', bg:'#1a6b3c' },
                  { init:'MC', bg:'#1e3a5f' },
                  { init:'LS', bg:'#5f1e3a' },
                  { init:'PA', bg:'#3a5f1e' },
                  { init:'GV', bg:'#3a1e5f' },
                ].map(({ init, bg }) => (
                  <div key={init} className="hero-av" style={{ background: bg }}>{init}</div>
                ))}
              </div>
              <p className="hero-social-txt">
                Mais de <strong>25.000</strong> atletas já estão no MeuCraque
              </p>
            </div>
          </div>

          {/* RIGHT — phones */}
          <div className="hero-phones" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', minWidth:0 }}>
            <div style={{ position:'relative', width:'540px', height:'580px', flexShrink:0 }}>

              {/* PHONE FRONT — left, larger, in front */}
              <div style={{
                position:'absolute', left:0, top:'50px', zIndex:2,
                width:'252px', borderRadius:'40px', background:'#111',
                padding:'10px 8px',
                boxShadow:'0 40px 80px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(255,255,255,0.12)',
                animation:'float 5s ease-in-out infinite',
              }}>
                {/* Screen */}
                <div style={{ background:'white', borderRadius:'30px', overflow:'hidden' }}>
                  {/* Status bar */}
                  <div style={{ background:'#fff', padding:'8px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#111' }}>9:41</span>
                    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="#111"><rect x="0" y="3" width="2" height="5" rx="0.5"/><rect x="3" y="2" width="2" height="6" rx="0.5"/><rect x="6" y="1" width="2" height="7" rx="0.5"/><rect x="9" y="0" width="2" height="8" rx="0.5"/></svg>
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><rect x="0.5" y="0.5" width="11" height="7" rx="1.5" stroke="#111"/><rect x="2" y="2" width="7" height="4" rx="0.5" fill="#111"/><path d="M13 2.5v3a1.5 1.5 0 000-3z" fill="#111"/></svg>
                    </div>
                  </div>

                  <div style={{ padding:'10px 14px 14px' }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                      <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#4ade80)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'11px', fontWeight:700, flexShrink:0 }}>RS</div>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:'#111' }}>Olá, Rafael! 👋</p>
                        <p style={{ margin:0, fontSize:'9px', color:'#888' }}>Aqui está o resumo do seu craque</p>
                      </div>
                      <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>

                    {/* Resumo label */}
                    <p style={{ margin:'0 0 6px', fontSize:'10px', fontWeight:700, color:'#111' }}>Resumo</p>

                    {/* Green summary card */}
                    <div style={{ background:'#16a34a', borderRadius:'12px', padding:'10px 12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ margin:0, fontSize:'8px', color:'rgba(255,255,255,0.75)' }}>Presenças</p>
                        <p style={{ margin:'2px 0 0', fontSize:'18px', fontWeight:900, color:'white', lineHeight:1 }}>18/20</p>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'3px' }}>
                          <div style={{ height:'3px', width:'40px', background:'rgba(255,255,255,0.3)', borderRadius:'2px', overflow:'hidden' }}>
                            <div style={{ width:'90%', height:'100%', background:'white', borderRadius:'2px' }}/>
                          </div>
                          <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.9)', fontWeight:700 }}>90%</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ margin:0, fontSize:'8px', color:'rgba(255,255,255,0.75)' }}>Avaliação média</p>
                        <p style={{ margin:'2px 0 0', fontSize:'18px', fontWeight:900, color:'white', lineHeight:1 }}>8,7</p>
                        <p style={{ margin:'2px 0 0', fontSize:'9px', color:'#fbbf24', letterSpacing:'1px' }}>★★★★★</p>
                      </div>
                    </div>

                    {/* Próximo compromisso */}
                    <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:700, color:'#111' }}>Próximo compromisso</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8faf8', borderRadius:'10px', padding:'8px 10px', marginBottom:'10px' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:'9px', fontWeight:700, color:'#111' }}>Treino</p>
                        <p style={{ margin:0, fontSize:'8px', color:'#888' }}>Terça, 21/05 · 18:00 · CT Arena Society</p>
                      </div>
                      <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
                    </div>

                    {/* Desempenho — line chart */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                      <p style={{ margin:0, fontSize:'10px', fontWeight:700, color:'#111' }}>Desempenho</p>
                      <span style={{ fontSize:'8px', color:'#16a34a', fontWeight:600 }}>Ver evolução &gt;</span>
                    </div>
                    <div style={{ background:'#f8faf8', borderRadius:'10px', padding:'8px', marginBottom:'8px' }}>
                      <svg viewBox="0 0 180 60" style={{ width:'100%', height:'48px' }}>
                        <defs>
                          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path d="M10 48 L45 38 L80 32 L115 22 L150 14 L170 8 L170 60 L10 60 Z" fill="url(#lg)"/>
                        <polyline points="10,48 45,38 80,32 115,22 150,14 170,8" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        {[['10','48','6,5'],['45','38','7,0'],['80','32','7,5'],['115','22','8,0'],['150','14','8,7']].map(([x,y,v]) => (
                          <g key={x}>
                            <circle cx={x} cy={y} r="3" fill="#22c55e"/>
                            <text x={x} y={Number(y)+12} textAnchor="middle" fontSize="7" fill="#888">{v}</text>
                          </g>
                        ))}
                        {['20/04','27/04','04/05','11/05','18/05'].map((d,i) => (
                          <text key={d} x={10+i*35} y="60" textAnchor="middle" fontSize="6" fill="#bbb">{d}</text>
                        ))}
                      </svg>
                    </div>

                    {/* Últimos registros */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                      <p style={{ margin:0, fontSize:'10px', fontWeight:700, color:'#111' }}>Últimos registros</p>
                      <span style={{ fontSize:'8px', color:'#16a34a', fontWeight:600 }}>Ver tudo &gt;</span>
                    </div>
                    {[['18/05','8,7'],['11/05','8,0']].map(([d,v]) => (
                      <div key={d} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px solid #f0f0f0' }}>
                        <span style={{ fontSize:'9px', color:'#888' }}>{d}</span>
                        <span style={{ fontSize:'9px', fontWeight:700, color:'#111' }}>{v}</span>
                      </div>
                    ))}

                    {/* Bottom nav */}
                    <div style={{ display:'flex', justifyContent:'space-around', marginTop:'10px', paddingTop:'8px', borderTop:'1px solid #f0f0f0' }}>
                      {[['🏠','Início',true],['📅','Agenda',false],['📈','Desempenho',false],['💬','Mensagens',false],['···','Mais',false]].map(([ic,lb,ac]) => (
                        <div key={String(lb)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                          <span style={{ fontSize:'12px' }}>{String(ic)}</span>
                          <span style={{ fontSize:'7px', color:ac?'#16a34a':'#bbb', fontWeight:ac?700:400 }}>{String(lb)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHONE BACK — right, smaller, behind */}
              <div style={{
                position:'absolute', right:0, top:0, zIndex:1,
                width:'220px', borderRadius:'38px', background:'#111',
                padding:'10px 8px', opacity:0.90,
                boxShadow:'0 28px 56px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,255,255,0.10)',
                animation:'floatBack 5s ease-in-out infinite 0.8s',
              }}>
                <div style={{ background:'white', borderRadius:'28px', overflow:'hidden' }}>
                  {/* Status bar */}
                  <div style={{ background:'#fff', padding:'8px 14px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#111' }}>9:41</span>
                    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="#111"><rect x="0" y="3" width="2" height="5" rx="0.5"/><rect x="3" y="2" width="2" height="6" rx="0.5"/><rect x="6" y="1" width="2" height="7" rx="0.5"/><rect x="9" y="0" width="2" height="8" rx="0.5"/></svg>
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><rect x="0.5" y="0.5" width="11" height="7" rx="1.5" stroke="#111"/><rect x="2" y="2" width="7" height="4" rx="0.5" fill="#111"/><path d="M13 2.5v3a1.5 1.5 0 000-3z" fill="#111"/></svg>
                    </div>
                  </div>

                  <div style={{ padding:'8px 12px 12px' }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <svg width="14" height="14" fill="none" stroke="#333" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#111' }}>Ranking</span>
                      </div>
                      <svg width="15" height="15" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>

                    {/* Tabs */}
                    <div style={{ display:'flex', gap:'3px', marginBottom:'10px', overflowX:'hidden' }}>
                      {['Geral','Meia','Atacante','Zagueiro','Goleiro'].map((t,i) => (
                        <span key={t} style={{ fontSize:'7px', fontWeight:700, padding:'3px 6px', borderRadius:'20px', flexShrink:0, background:i===0?'#16a34a':'#f3f4f6', color:i===0?'white':'#888' }}>{t}</span>
                      ))}
                    </div>

                    {/* Podium */}
                    <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap:'4px', marginBottom:'8px' }}>
                      {/* 2nd */}
                      <div style={{ textAlign:'center' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#d1d5db,#9ca3af)', margin:'0 auto 2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'white', border:'2px solid #e5e7eb' }}>LP</div>
                        <p style={{ margin:0, fontSize:'7px', color:'#555', fontWeight:600 }}>Lucas P.</p>
                        <p style={{ margin:0, fontSize:'10px', fontWeight:900, color:'#111' }}>8,8</p>
                        <div style={{ width:'38px', height:'22px', background:'#d1d5db', borderRadius:'4px 4px 0 0', margin:'2px auto 0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:'9px', fontWeight:700, color:'white' }}>2</span>
                        </div>
                      </div>
                      {/* 1st */}
                      <div style={{ textAlign:'center' }}>
                        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', margin:'0 auto 2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'white', border:'2.5px solid #fbbf24', position:'relative' }}>
                          RS
                          <span style={{ position:'absolute', top:'-8px', fontSize:'12px' }}>👑</span>
                        </div>
                        <p style={{ margin:0, fontSize:'7px', color:'#111', fontWeight:700 }}>Rafael S.</p>
                        <p style={{ margin:0, fontSize:'11px', fontWeight:900, color:'#111' }}>9,1</p>
                        <div style={{ width:'38px', height:'30px', background:'#fbbf24', borderRadius:'4px 4px 0 0', margin:'2px auto 0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, color:'white' }}>1</span>
                        </div>
                      </div>
                      {/* 3rd */}
                      <div style={{ textAlign:'center' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#d97706,#b45309)', margin:'0 auto 2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'white', border:'2px solid #d97706' }}>GM</div>
                        <p style={{ margin:0, fontSize:'7px', color:'#555', fontWeight:600 }}>Gabriel M.</p>
                        <p style={{ margin:0, fontSize:'10px', fontWeight:900, color:'#111' }}>8,6</p>
                        <div style={{ width:'38px', height:'16px', background:'#d97706', borderRadius:'4px 4px 0 0', margin:'2px auto 0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:'8px', fontWeight:700, color:'white' }}>3</span>
                        </div>
                      </div>
                    </div>

                    {/* List */}
                    {[
                      { pos:4, name:'Nicolas L.', score:'8,4', hi:false },
                      { pos:5, name:'Pedro H.',   score:'8,3', hi:false },
                      { pos:12, name:'Rafael Silva', score:'8,0', hi:true },
                      { pos:13, name:'João V.',    score:'7,9', hi:false },
                      { pos:14, name:'Matheus R.', score:'7,8', hi:false },
                    ].map(r => (
                      <div key={r.pos} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 5px', borderRadius:'6px', marginBottom:'2px', background:r.hi?'rgba(34,197,94,0.1)':'transparent' }}>
                        <span style={{ fontSize:'7px', color:'#aaa', width:'14px' }}>#{r.pos}</span>
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:r.hi?'#16a34a':'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:'6px', fontWeight:700, color:r.hi?'white':'#666' }}>{r.name.slice(0,2).toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize:'8px', fontWeight:r.hi?700:500, color:r.hi?'#16a34a':'#333', flex:1 }}>{r.name}</span>
                        <span style={{ fontSize:'8px', fontWeight:700, color:'#111' }}>{r.score}</span>
                      </div>
                    ))}

                    {/* Bottom nav */}
                    <div style={{ display:'flex', justifyContent:'space-around', marginTop:'8px', paddingTop:'6px', borderTop:'1px solid #f0f0f0' }}>
                      {[['🏠',false],['🔍',false],['🏆',true],['💬',false],['···',false]].map(([ic,ac],i) => (
                        <span key={i} style={{ fontSize:String(ic)==='···'?'10px':'12px', opacity:ac?1:0.4, color:ac?'#16a34a':'inherit' }}>{String(ic)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Stats panel — mobile only, absolute right side */}
        <div className="hero-stats-panel" style={{ display:'none', position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', zIndex:3 }}>
          {[
            { icon:'⚽', label:'ATLETAS', value:'GRÁTIS' },
            { icon:'★',  label:'RANKING', value:'AO VIVO' },
            { icon:'🛡', label:'DADOS',   value:'SEGUROS' },
            { icon:'🌎', label:'BRASIL',  value:'26 ESTADOS' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'15px', filter:'drop-shadow(0 0 6px rgba(0,255,136,0.5))' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:'7px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.55)' }}>{s.label}</div>
                <div style={{ fontSize:'12px', fontWeight:900, color:'rgba(255,255,255,0.95)', lineHeight:1.2, letterSpacing:'0.01em' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* HUD sutil — ranking ao vivo, decorativo, oculto no mobile */}
        <div className="hero-hud" style={{
          position:'absolute', right:'72px', top:'50%', transform:'translateY(-50%)',
          zIndex:2, fontFamily:'monospace', textAlign:'right',
          opacity:0.09, pointerEvents:'none', userSelect:'none', lineHeight:1.5,
        }}>
          <p style={{ fontSize:'10px', letterSpacing:'0.18em', color:'white', margin:'0 0 10px', textTransform:'uppercase' }}>Ranking ao vivo</p>
          <p style={{ fontSize:'22px', fontWeight:900, color:'white', margin:'0 0 5px' }}>#1  Pedro H.   91</p>
          <p style={{ fontSize:'17px', color:'white', margin:'0 0 5px' }}>#2  Arthur S.  88</p>
          <p style={{ fontSize:'14px', color:'white', margin:'0 0 5px' }}>#3  Miguel C.  86</p>
          <p style={{ fontSize:'13px', color:'white', margin:'0 0 5px' }}>#4  Gabriel L. 85</p>
          <p style={{ fontSize:'11px', color:'white', margin:0 }}>#5  Kauã A.    84</p>
        </div>
      </section>

      <ActivityTicker />

      <CardCraqueSection />

      <TeamOfWeekSection />

      <FeaturesSection />

      <ParaQuemSection />

      <ProspectsSection />

      <StatsBar />

      <RankingSection />

      {/* ─── CARDS BAR ─── */}
      <div style={{ background:'#080e09', borderTop:'1px solid rgba(34,197,94,0.15)' }}>
        <div className="cards-grid" style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {cards.map((c, i) => (
            <div key={c.title} className="card-item" style={{
              padding:'28px 24px',
              borderRight: i < 3 ? '1px solid rgba(34,197,94,0.1)' : 'none',
            }}>
              <div style={{ marginBottom:'12px' }}>{c.icon}</div>
              <p style={{ margin:'0 0 6px', fontSize:'15px', fontWeight:700, color:'#22c55e' }}>{c.title}</p>
              <p style={{ margin:'0 0 12px', fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{c.desc}</p>
              <a href={c.href} style={{ fontSize:'13px', color:'#22c55e', fontWeight:600, textDecoration:'none' }}>Saiba mais &gt;</a>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background:'#06100a', borderTop:'1px solid rgba(255,255,255,0.05)', padding:'28px 40px' }}>
        <div className="footer-inner" style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'18px', fontWeight:800, letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <span>⚽</span>
            <span style={{ color:'white' }}>MEU </span>
            <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </span>
          <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
            © {new Date().getFullYear()} Meu Craque. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}

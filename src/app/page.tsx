import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

// Cache o Server Component por 60s — evita listUsers() em cada visita
export const revalidate = 60
import NavBar from './components/NavBar'
import RankingSection from './components/RankingSection'
import HeroCard from './components/HeroCard'
import LiveFeed from './components/LiveFeed'


export default async function LandingPage() {
  let atletasNoRadar = 0
  try {
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    atletasNoRadar = users.filter(u => u.user_metadata?.tipo === 'atleta').length
  } catch { /* fallback */ }
  return (
    <div style={{ background: '#06100a', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        /* ─── KEYFRAMES ─── */
        @keyframes float        { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-12px)} }
        @keyframes floatBack    { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-8px)} }
        @keyframes heroFadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse    {
          0%,100%{text-shadow:0 0 30px rgba(0,255,136,0.55),0 0 70px rgba(0,255,136,0.22),0 0 110px rgba(0,255,136,0.08)}
          50%    {text-shadow:0 0 50px rgba(0,255,136,0.75),0 0 110px rgba(0,255,136,0.32),0 0 160px rgba(0,255,136,0.12)}
        }
        @keyframes glowBreathe  {
          0%,100%{opacity:0.75;transform:scale(1)}
          50%    {opacity:1;   transform:scale(1.06)}
        }
        @keyframes particleRise {
          0%   {transform:translateY(0) scale(1);   opacity:0}
          15%  {opacity:0.55}
          75%  {opacity:0.25}
          100% {transform:translateY(-110px) scale(0.5); opacity:0}
        }
        @keyframes shimmerFlow  { 0%{left:-70%} 100%{left:140%} }
        @keyframes pulseDot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(0.7)} }
        @keyframes stepFadeIn   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbFloat     { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.08)} }
        @keyframes lineGrow     { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes depCardIn    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        /* ─── HERO ─── */
        .hero-section  { height:100svh; }
        .card-item     { transition:background .2s; cursor:default; }
        .card-item:hover { background:rgba(34,197,94,0.06); }

        .h-badge  { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.08s; opacity:0; }
        .h-line-1 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.22s; opacity:0; }
        .h-line-2 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.36s; opacity:0; }
        .h-line-3 { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.50s; opacity:0; }
        .h-sub    { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.66s; opacity:0; }
        .h-ctas   { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.80s; opacity:0; }
        .h-social { animation:heroFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards 0.95s; opacity:0; }
        .neon-word    { /* glow removido — headline domina sem efeito */ }
        .live-dot     { display:inline-block; width:6px; height:6px; border-radius:50%; background:#00FF88; animation:pulseDot 2s ease-in-out infinite; box-shadow:0 0 8px rgba(0,255,136,0.8); }
        .hero-hud     { display:block; }
        .hero-h1-line { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
        .hero-badge   { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }

        /* Mobile-only elements hidden on desktop */
        .hero-particles, .hero-mob-sub, .hero-social { display:none; }
        .hero-bolt { display:none; }
        .hero-rule { display:none; }

        /* ── Desktop CTA hover ── */
        .hero-cta-primary {
          transition:filter .18s ease, transform .18s ease, box-shadow .18s ease !important;
        }
        .hero-cta-primary:hover {
          filter:brightness(1.07) !important;
          transform:translateY(-2px) !important;
          box-shadow:0 8px 32px rgba(0,0,0,0.52) !important;
        }
        .hero-cta-secondary {
          transition:color .2s ease !important;
        }
        .hero-cta-secondary:hover {
          color:rgba(255,255,255,0.70) !important;
        }

        /* Stats panel — hidden desktop, shown mobile inside headline row */
        .hero-stats-panel { display:none; position:relative; overflow:hidden; }
        .hero-stats-panel::before {
          content:''; position:absolute; top:0; left:0; right:0; height:52%;
          background:linear-gradient(180deg,rgba(255,255,255,0.07) 0%,transparent 100%);
          border-radius:18px 18px 0 0; pointer-events:none; z-index:0;
        }
        .hero-stats-panel > * { position:relative; z-index:1; }

        /* ─── AO VIVO CARD ─── */
        @keyframes liveIn { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes lncIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pRing  { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }

        .lnc {
          background:rgba(4,10,6,0.80);
          backdrop-filter:blur(22px);
          -webkit-backdrop-filter:blur(22px);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:18px; padding:14px;
          box-shadow:0 24px 60px rgba(0,0,0,0.60);
          animation:lncIn .55s cubic-bezier(.22,1,.36,1) forwards .45s; opacity:0;
        }
        .lnc-it {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:11px;
          transition:background .2s ease; cursor:default; opacity:0;
        }
        .lnc-it:hover { background:rgba(0,255,136,0.07) !important; }
        .li1{animation:liveIn .32s ease forwards .80s}
        .li2{animation:liveIn .32s ease forwards .94s}
        .li3{animation:liveIn .32s ease forwards 1.08s}
        .li4{animation:liveIn .32s ease forwards 1.22s}
        .li5{animation:liveIn .32s ease forwards 1.36s}
        .lnc-ring { position:absolute; inset:0; border-radius:50%; border:1.5px solid #00FF88; animation:pRing 2s ease-out infinite; }
        .lnc-mob  { display:none; }

        /* ─── COMO FUNCIONA ─── */
        .steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; position:relative; }
        .steps-connector { position:absolute; top:44px; left:calc(16.66% + 20px); right:calc(16.66% + 20px); height:1px; background:linear-gradient(90deg,transparent 0%,rgba(0,255,136,0.25) 15%,rgba(0,255,136,0.25) 85%,transparent 100%); pointer-events:none; }
        .step-card { padding:0 36px; text-align:center; }
        .step-icon-wrap { width:88px; height:88px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:34px; margin:0 auto 24px; position:relative; }
        .step-icon-wrap::after { content:''; position:absolute; inset:-1px; border-radius:50%; background:inherit; filter:blur(16px); opacity:0.35; z-index:-1; }

        /* ─── DEPOIMENTOS ─── */
        .dep-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .dep-card {
          background:linear-gradient(168deg,#0c1510 0%,#070d09 100%);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:20px; padding:28px;
          position:relative; overflow:hidden;
          transition:transform .3s ease, box-shadow .3s ease;
        }
        .dep-card:hover {
          transform:translateY(-4px);
          box-shadow:0 20px 48px rgba(0,0,0,0.6),0 0 32px rgba(0,255,136,0.06);
        }

        /* ─── FINAL CTA ─── */
        .fcta-primary {
          display:inline-flex; align-items:center; gap:10px;
          padding:18px 42px; border-radius:100px;
          background:linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%);
          color:#020c05; font-weight:800; font-size:16px;
          text-decoration:none; letter-spacing:0.08em;
          box-shadow:0 6px 28px rgba(0,0,0,0.50);
          transition:filter .2s ease,transform .15s ease;
          position:relative; overflow:hidden;
        }
        .fcta-primary:hover { filter:brightness(1.08); transform:translateY(-2px); }
        .fcta-primary::after {
          content:'';
          position:absolute; top:0; bottom:0; width:45%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);
          transform:skewX(-18deg);
          animation:shimmerFlow 4s ease-in-out infinite 2s;
        }
        .fcta-secondary {
          display:inline-flex; align-items:center;
          padding:18px 36px; border-radius:100px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.14);
          color:rgba(255,255,255,0.65); font-weight:600; font-size:15px;
          text-decoration:none; letter-spacing:0.06em;
          backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          transition:border-color .2s ease, color .2s ease, box-shadow .2s ease;
        }
        .fcta-secondary:hover {
          border-color:rgba(0,255,136,0.32);
          color:rgba(255,255,255,0.88);
          box-shadow:0 0 18px rgba(0,255,136,0.10);
        }

        /* ─── MOBILE HERO ─── */
        @media (max-width: 768px) {
          .hero-section { height:auto !important; min-height:0 !important; }
          .hero-grid    { height:auto !important; }
          .hero-player-img { object-position:74% 8% !important; }

          .hero-ov1 {
            /* Top-to-bottom darkness covers text area + left-to-right darkness separates text from player */
            background:
              linear-gradient(to bottom, rgba(0,2,1,0.98) 0%, rgba(0,2,1,0.82) 18%, rgba(0,2,1,0.28) 44%, transparent 60%),
              linear-gradient(to right,  rgba(0,2,1,0.97) 0%, rgba(0,2,1,0.80) 22%, rgba(0,2,1,0.18) 46%, transparent 58%),
              linear-gradient(to top,    rgba(0,2,1,1.00) 0%, rgba(0,2,1,0.70) 14%, transparent 42%) !important;
          }
          .hero-ov2 {
            /* Deep vignette, bias toward left */
            background: radial-gradient(ellipse at 32% 44%, transparent 18%, rgba(0,0,0,0.38) 100%) !important;
          }
          .hero-ov3 {
            /* Cold stadium arc light — top right, no green glow on text */
            background: radial-gradient(ellipse at 76% 4%, rgba(220,240,232,0.14) 0%, rgba(200,228,216,0.05) 38%, transparent 58%) !important;
            animation: none !important;
          }
          .hero-ov4 {
            /* Rim light tracks with player (now at 74%) */
            background: radial-gradient(ellipse at 90% 26%, rgba(190,218,200,0.08) 0%, transparent 30%) !important;
          }
          .hero-ov5 {
            /* Heavy ground darkness */
            background: linear-gradient(to top, rgba(0,2,1,1.00) 0%, rgba(0,2,1,0.72) 12%, rgba(0,2,1,0.20) 28%, transparent 46%) !important;
          }

          .hero-grid {
            display:flex !important; flex-direction:column !important;
            align-items:stretch !important; justify-content:flex-start !important;
            grid-template-columns:none !important; padding:0 !important;
            gap:0 !important; height:auto !important; width:100% !important;
          }
          .hero-phones { display:none !important; }
          .hero-hud    { display:none !important; }

          /* Badge says "APERTE O PLAY" — same as headline: causes visual duplication */
          .h-badge  { display:none !important; }

          .hero-left {
            display:flex !important; flex-direction:column !important; gap:22px !important;
            padding-top:calc(14dvh + env(safe-area-inset-top)) !important;
            padding-bottom:20px !important;
            padding-left:24px !important; padding-right:24px !important;
            min-width:0 !important; flex:1 !important;
          }

          .hero-badge {
            letter-spacing:0.22em !important; margin-bottom:0 !important;
            align-self:flex-start !important;
          }
          /* Rule was badge-separator — hide without badge */
          .hero-rule { display:none !important; }

          .hero-left h1 { margin-bottom:0 !important; }
          .hero-h1-line {
            font-size:clamp(52px,11vw,78px) !important;
            letter-spacing:-0.058em !important; line-height:0.90 !important;
            text-shadow:
              0 0 1px  rgba(0,0,0,1),
              0 2px 8px  rgba(0,0,0,1),
              0 4px 22px rgba(0,0,0,0.97),
              0 8px 44px rgba(0,0,0,0.88),
              0 16px 72px rgba(0,0,0,0.60) !important;
          }
          .hero-sub { display:none !important; }
          .hero-mob-sub {
            display:block !important; font-size:13px !important;
            color:rgba(255,255,255,0.64) !important; line-height:1.62 !important;
            margin:0 0 16px !important; font-weight:400 !important;
            letter-spacing:0.010em !important; max-width:290px !important;
          }
          .hero-ctas-wrap {
            flex-direction:column !important; align-items:flex-start !important;
            gap:14px !important; margin-top:0 !important; margin-bottom:14px !important;
            width:100% !important; align-self:stretch !important;
          }
          .hero-cta-primary {
            position:relative !important; overflow:hidden !important;
            align-self:stretch !important;
            font-size:13px !important;
            padding:14px 22px !important; border-radius:100px !important;
            letter-spacing:0.09em !important; gap:7px !important; flex-shrink:0 !important;
            -webkit-tap-highlight-color:transparent !important;
            background:linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%) !important;
            color:#020c05 !important; font-weight:800 !important;
            box-shadow:0 4px 20px rgba(0,0,0,0.42) !important;
            transition:transform .15s ease, filter .15s ease !important;
          }
          .hero-cta-primary:active {
            transform:scale(0.96) !important;
            filter:brightness(0.94) !important;
          }
          .hero-bolt { display:inline-block !important; font-style:normal; font-size:11px !important; }
          .hero-cta-secondary {
            font-size:13px !important;
            padding:4px 0 !important;
            background:none !important;
            border:none !important;
            width:auto !important;
            backdrop-filter:none !important; -webkit-backdrop-filter:none !important;
            color:rgba(255,255,255,0.40) !important;
            font-weight:600 !important; letter-spacing:0.06em !important;
          }
          .hero-social {
            display:flex !important; align-items:center !important;
            gap:10px !important; padding:10px 14px !important;
            border-radius:14px !important; align-self:flex-start !important;
            background:rgba(4,10,6,0.45) !important;
            border:1px solid rgba(255,255,255,0.06) !important;
            backdrop-filter:blur(22px) !important; -webkit-backdrop-filter:blur(22px) !important;
            box-shadow:0 8px 28px rgba(0,0,0,0.40) !important;
          }
          .hero-avatars { display:flex !important; flex-direction:row-reverse !important; flex-shrink:0 !important; }
          .hero-av {
            width:23px !important; height:23px !important;
            border-radius:50% !important; border:2px solid rgba(3,8,4,0.92) !important;
            margin-left:-6px !important; display:flex !important;
            align-items:center !important; justify-content:center !important;
            font-size:6.5px !important; font-weight:800 !important; color:white !important;
          }
          .hero-social-txt { margin:0 !important; font-size:10.5px !important; color:rgba(255,255,255,0.52) !important; line-height:1.44 !important; }
          .hero-social-txt strong { color:rgba(255,255,255,0.92) !important; font-weight:800 !important; }
          /* Headline + stats — flex row, stats sits flush next to h1 */
          .hero-headline-row {
            display:flex !important; flex-direction:row !important;
            align-items:flex-start !important; gap:12px !important;
            width:100% !important;
          }
          .hero-headline-row h1 { flex:1 !important; min-width:0 !important; }
          .hero-stats-panel {
            display:flex !important; flex-direction:column !important;
            gap:11px !important;
            transform:none !important;
            padding:11px 12px !important;
            background:rgba(2,10,5,0.82) !important;
            backdrop-filter:blur(24px) saturate(180%) !important;
            -webkit-backdrop-filter:blur(24px) saturate(180%) !important;
            border:1px solid rgba(0,255,136,0.15) !important;
            border-top:1px solid rgba(0,255,136,0.28) !important;
            border-radius:14px !important;
            box-shadow:0 0 16px rgba(0,255,136,0.07),0 10px 28px rgba(0,0,0,0.68) !important;
            flex-shrink:0 !important;
            align-self:flex-start !important;
            animation:none !important;
          }
          .hero-particles { display:block !important; position:absolute !important; inset:0 !important; z-index:1 !important; pointer-events:none !important; overflow:hidden !important; }
          .hp { position:absolute !important; display:block !important; border-radius:50% !important; background:#00FF88 !important; opacity:0 !important; box-shadow:0 0 4px rgba(0,255,136,0.8) !important; }
          .hp1 { width:3px; height:3px; left:11%; bottom:42%; animation:particleRise 6.2s ease-in-out infinite 0.0s; }
          .hp2 { width:2px; height:2px; left:32%; bottom:34%; animation:particleRise 7.4s ease-in-out infinite 1.3s; }
          .hp3 { width:3px; height:3px; left:60%; bottom:48%; animation:particleRise 5.8s ease-in-out infinite 0.8s; }
          .hp4 { width:2px; height:2px; left:74%; bottom:26%; animation:particleRise 8.1s ease-in-out infinite 2.2s; }
          .hp5 { width:2px; height:2px; left:22%; bottom:56%; animation:particleRise 6.7s ease-in-out infinite 3.5s; }
          .hp6 { width:3px; height:3px; left:84%; bottom:40%; animation:particleRise 7.8s ease-in-out infinite 1.9s; }

          /* Mobile: new sections */
          .steps-grid       { grid-template-columns:1fr !important; gap:44px !important; }
          .steps-connector  { display:none !important; }
          .step-card        { padding:0 16px !important; }
          .dep-grid         { grid-template-columns:1fr !important; }
          .fcta-wrap        { flex-direction:column !important; align-items:stretch !important; }
          .fcta-primary, .fcta-secondary { width:100% !important; justify-content:center !important; }
          .cards-grid       { grid-template-columns:1fr 1fr !important; }
          .card-item        { border-right:none !important; border-bottom:1px solid rgba(34,197,94,0.1); }
          .footer-inner     { flex-direction:column !important; gap:8px !important; text-align:center !important; }
          .lnc-mob          { display:block !important; }
        }

        @media (max-width: 768px) {
          .three-cols { grid-template-columns:1fr !important; gap:40px !important; }
          .video-grid { grid-template-columns:repeat(3,1fr) !important; }
        }
        @media (max-width: 480px) {
          .cards-grid   { grid-template-columns:1fr !important; }
          .hero-h1-line { font-size:clamp(42px,11vw,64px) !important; letter-spacing:-0.046em !important; }
          .hero-tagline { font-size:clamp(16px,4.5vw,22px) !important; margin-top:6px !important; }
          .hero-mob-sub { font-size:12px !important; max-width:260px !important; }
          .dep-grid     { grid-template-columns:1fr !important; }
        }

      `}</style>

      <NavBar />

      {/* ══════════════════════════════════════════════ HERO ══ */}
      <section className="hero-section" style={{ position:'relative', overflow:'hidden' }}>
        {/* BG */}
        <img
          className="hero-player-img"
          src="/images/hero-player.png"
          alt="" aria-hidden
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center center', zIndex:0 }}
        />
        {/* Overlay 1 — escuridão cinematográfica esquerda */}
        <div className="hero-ov1" style={{ position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(100deg, rgba(0,1,0,1.00) 0%, rgba(0,1,0,0.97) 24%, rgba(0,1,0,0.64) 46%, rgba(0,1,0,0.18) 63%, transparent 80%), linear-gradient(to top, rgba(0,2,1,0.97) 0%, rgba(0,2,1,0.45) 15%, transparent 38%), linear-gradient(to bottom, rgba(0,2,1,0.82) 0%, transparent 20%)'
        }} />
        {/* Overlay 2 — vinheta de profundidade */}
        <div className="hero-ov2" style={{ position:'absolute', inset:0, zIndex:1,
          background:'radial-gradient(ellipse at 54% 46%, transparent 12%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.68) 100%)'
        }} />
        {/* Overlay 3 — luz de arco do estádio (de cima) */}
        <div className="hero-ov3" style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:'radial-gradient(ellipse at 50% -24%, rgba(248,255,252,0.18) 0%, rgba(220,240,230,0.07) 30%, transparent 56%)'
        }} />
        {/* Overlay 4 — rim light no jogador (direita) */}
        <div className="hero-ov4" style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:'radial-gradient(ellipse at 84% 36%, rgba(190,218,200,0.07) 0%, transparent 30%)'
        }} />
        {/* Overlay 5 — escuridão do chão */}
        <div className="hero-ov5" style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:'linear-gradient(to top, rgba(0,2,1,0.98) 0%, rgba(0,2,1,0.58) 11%, rgba(0,2,1,0.14) 24%, transparent 40%)'
        }} />

        {/* Floating particles — mobile only */}
        <div className="hero-particles" aria-hidden>
          <span className="hp hp1"/><span className="hp hp2"/><span className="hp hp3"/>
          <span className="hp hp4"/><span className="hp hp5"/><span className="hp hp6"/>
        </div>

        {/* Grid */}
        <div className="hero-grid" style={{
          position:'relative', zIndex:2, height:'100%', width:'100%',
          display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',
          alignItems:'center', padding:'0 80px', gap:'48px', boxSizing:'border-box',
        }}>

          {/* LEFT */}
          <div className="hero-left" style={{ display:'flex', flexDirection:'column', gap:'40px', minWidth:0 }}>

            {/* Indicator */}
            <div className="h-badge" style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'10px', color:'#00FF88', fontWeight:700 }}>▶</span>
              <span style={{
                fontSize:'10px', fontWeight:700,
                color:'rgba(255,255,255,0.42)',
                letterSpacing:'0.20em', textTransform:'uppercase',
              }}>
                APERTE O PLAY
              </span>
            </div>

            {/* Accent rule — mobile only */}
            <div className="hero-rule" />

            {/* Headline + stats — row on mobile (stats hidden on desktop) */}
            <div className="hero-headline-row">

              <h1 style={{ margin:0, padding:0 }}>
                <span className="h-line-1 hero-h1-line" style={{
                  display:'block',
                  fontSize:'clamp(54px,6.5vw,100px)',
                  fontWeight:900,
                  color:'white',
                  letterSpacing:'-0.046em',
                  lineHeight:0.84,
                  textTransform:'uppercase',
                  WebkitFontSmoothing:'antialiased',
                  MozOsxFontSmoothing:'grayscale',
                  textShadow:'0 2px 32px rgba(0,0,0,0.75)',
                }}>
                  APERTE
                </span>
                <span className="h-line-2 hero-h1-line" style={{
                  display:'block',
                  fontSize:'clamp(52px,6.2vw,96px)',
                  fontWeight:900,
                  letterSpacing:'-0.046em',
                  lineHeight:0.84,
                  textTransform:'uppercase',
                  WebkitFontSmoothing:'antialiased',
                  MozOsxFontSmoothing:'grayscale',
                  textShadow:'0 2px 32px rgba(0,0,0,0.75)',
                }}>
                  <span style={{ color:'white' }}>O </span><span style={{ color:'#00FF88' }}>PLAY.</span>
                </span>
              </h1>

              {/* Stats pill — mobile only, aligns to top of headline */}
              <div className="hero-stats-panel">
                {[
                  { icon:'⚽', label:'ATLETAS', value:'GRÁTIS'   },
                  { icon:'★',  label:'RANKING', value:'AO VIVO'  },
                  { icon:'🛡', label:'DADOS',   value:'SEGUROS'  },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'13px', flexShrink:0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:'6.5px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.55)', textTransform:'uppercase', marginBottom:'1px' }}>{s.label}</div>
                      <div style={{ fontSize:'11px', fontWeight:900, color:'rgba(255,255,255,0.92)', lineHeight:1.15, letterSpacing:'0.01em' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Subheadline */}
            <p className="h-line-3" style={{
              margin:0, padding:0,
              fontSize:'clamp(14px,1.5vw,20px)',
              fontWeight:400, fontStyle:'italic',
              color:'rgba(255,255,255,0.44)',
              letterSpacing:'0.04em', lineHeight:1,
            }}>
              O jogo começa aqui.
            </p>


            {/* Mobile subtitle */}
            <p className="hero-mob-sub">
              Crie seu perfil, receba avaliações e seja descoberto por scouts reais.
            </p>

            {/* CTAs */}
            <div className="h-ctas hero-ctas-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'16px', marginTop:0 }}>
              <Link href="/atleta/cadastro" className="hero-cta-primary" style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                gap:'8px',
                background:'#00E87A',
                color:'#020c05', fontWeight:800, fontSize:'13px',
                borderRadius:'100px', padding:'15px 38px', textDecoration:'none',
                letterSpacing:'0.13em',
              }}>
                CRIAR MEU CARD — GRÁTIS
              </Link>
              <Link href="/login" className="hero-cta-secondary" style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                fontSize:'13px', fontWeight:600,
                color:'rgba(255,255,255,0.36)',
                textDecoration:'none', letterSpacing:'0.06em',
              }}>
                Já tenho conta →
              </Link>
            </div>

            {/* Social proof — mobile */}
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
                <strong>{atletasNoRadar}</strong> atleta{atletasNoRadar !== 1 ? 's' : ''} no radar
              </p>
            </div>
          </div>

          {/* RIGHT — Card do atleta em destaque */}
          <div className="hero-phones" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', paddingTop:'clamp(48px,7vh,80px)', minWidth:0 }}>
            <HeroCard />
          </div>
        </div>

        {/* HUD decorativo — removido (substituído pelo HeroFeed) */}
      </section>

      {/* ══════════════════════════════════════ LIVE FEED ══ */}
      <LiveFeed />

      {/* ══════════════════════════════════════ RANKING ══ */}
      <RankingSection />

      {/* ══════════════════════════════════════ FINAL CTA ══ */}
      <section style={{ padding:'110px 20px', background:'#030905', position:'relative', overflow:'hidden' }}>
        {/* Background orb */}
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          transform:'translate(-50%,-50%)',
          width:'700px', height:'500px',
          background:'radial-gradient(ellipse at center, rgba(0,255,136,0.10) 0%, rgba(0,255,136,0.03) 40%, transparent 70%)',
          pointerEvents:'none', animation:'orbFloat 6s ease-in-out infinite',
        }} />
        {/* Grid */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(0,255,136,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.018) 1px, transparent 1px)',
          backgroundSize:'80px 80px',
        }} />

        <div style={{ textAlign:'center', position:'relative', maxWidth:'680px', margin:'0 auto' }}>
          {/* Badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            padding:'5px 16px 5px 12px', borderRadius:'100px',
            border:'1px solid rgba(0,255,136,0.25)', background:'rgba(0,255,136,0.06)',
            backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
            fontSize:'10px', fontWeight:700, color:'rgba(0,255,136,0.80)', letterSpacing:'0.18em',
            marginBottom:'28px',
          }}>
            <span className="live-dot" />
            NÃO DEIXE PARA AMANHÃ
          </div>

          <h2 style={{
            margin:'0 0 22px',
            fontSize:'clamp(34px,6vw,62px)',
            fontWeight:900, color:'white',
            letterSpacing:'-0.04em', lineHeight:0.95,
          }}>
            Seu talento merece
            <br/>
            <span style={{
              color:'#00FF88',
              textShadow:'0 0 40px rgba(0,255,136,0.45), 0 0 80px rgba(0,255,136,0.15)',
            }}>
              ser registrado.
            </span>
          </h2>

          <p style={{ margin:'0 0 44px', fontSize:'clamp(15px,1.2vw,18px)', color:'rgba(255,255,255,0.38)', lineHeight:1.68, maxWidth:'520px', marginLeft:'auto', marginRight:'auto' }}>
            Crie seu perfil grátis agora e entre no radar dos scouts e clubes de futebol.
            Seu próximo passo começa aqui.
          </p>

          <div className="fcta-wrap" style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'28px' }}>
            <Link href="/atleta/cadastro" className="fcta-primary">
              CRIAR MEU CARD GRATUITAMENTE
            </Link>
            <Link href="/treinador/cadastro" className="fcta-secondary">
              SOU TREINADOR
            </Link>
          </div>

          <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.18)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Grátis para atletas · Sem cartão · Perfil pronto em 2 minutos
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════ FOOTER ══ */}
      <footer style={{ background:'#06100a', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'32px 40px' }}>
        <div className="footer-inner" style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <span style={{ fontSize:'18px' }}>⚽</span>
            <span style={{ fontSize:'16px', fontWeight:800, letterSpacing:'-0.01em' }}>
              <span style={{ color:'#00ff87' }}>MEUCRAQUE</span><span style={{ color:'white' }}>.com</span>
            </span>
          </Link>
          <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.24)', textAlign:'center' }}>
            © {new Date().getFullYear()} meucraque.com. Todos os direitos reservados.
          </p>
          <div style={{ display:'flex', gap:'20px', flexShrink:0 }}>
            <Link href="/ranking" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Ranking</Link>
            <Link href="/scouts" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Scouts</Link>
            <Link href="/treinador/cadastro" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Treinadores</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

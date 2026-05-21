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
import PhotoBillboard from './components/PhotoBillboard'
import HeroFeed from './components/HeroFeed'

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
          .hero-section { height:100dvh !important; min-height:0 !important; }
          .hero-player-img { object-position:74% 8% !important; }

          .hero-ov1 {
            /* Top-to-bottom darkness covers text area + left-to-right darkness separates text from player */
            background:
              linear-gradient(to bottom, rgba(0,2,1,0.98) 0%, rgba(0,2,1,0.86) 20%, rgba(0,2,1,0.40) 48%, transparent 68%),
              linear-gradient(to right,  rgba(0,2,1,0.97) 0%, rgba(0,2,1,0.84) 28%, rgba(0,2,1,0.34) 54%, transparent 74%),
              linear-gradient(to top,    rgba(0,2,1,1.00) 0%, rgba(0,2,1,0.75) 18%, transparent 48%) !important;
          }
          .hero-ov2 {
            /* Deep vignette, bias toward left */
            background: radial-gradient(ellipse at 38% 44%, transparent 14%, rgba(0,0,0,0.52) 100%) !important;
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
            gap:0 !important; height:100% !important; width:100% !important;
          }
          .hero-phones { display:none !important; }
          .hero-hud    { display:none !important; }

          /* Badge says "APERTE O PLAY" — same as headline: causes visual duplication */
          .h-badge  { display:none !important; }

          .hero-left {
            display:flex !important; flex-direction:column !important; gap:22px !important;
            padding-top:calc(14dvh + env(safe-area-inset-top)) !important;
            padding-bottom:calc(32px + env(safe-area-inset-bottom)) !important;
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

        /* ─── LANCES / REELS ─── */
        @keyframes reelPlay {
          0%,100% { transform:translate(-50%,-50%) scale(1);   opacity:.80 }
          50%      { transform:translate(-50%,-50%) scale(1.07); opacity:1   }
        }
        .reels-track {
          display:flex; gap:14px;
          padding:0 clamp(24px,5vw,80px) 6px;
          overflow-x:auto; scroll-snap-type:x mandatory;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none; -ms-overflow-style:none;
        }
        .reels-track::-webkit-scrollbar { display:none; }
        .reels-card {
          flex:0 0 min(272px,72vw); scroll-snap-align:start;
          border-radius:18px; overflow:hidden; position:relative;
          cursor:pointer; aspect-ratio:9/16; min-height:390px;
          transition:transform .28s cubic-bezier(.22,1,.36,1);
        }
        .reels-card:hover { transform:scale(1.018); }
        .reels-card:hover .reel-play-btn { opacity:1 !important; transform:translate(-50%,-50%) scale(1.12) !important; }
        .reel-play-btn {
          position:absolute; top:50%; left:50%;
          width:54px; height:54px; border-radius:50%;
          background:rgba(255,255,255,0.10);
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          border:1.5px solid rgba(255,255,255,0.22);
          display:flex; align-items:center; justify-content:center;
          animation:reelPlay 3.8s ease-in-out infinite;
          transition:transform .22s ease, opacity .22s ease;
          z-index:2;
        }
        .reel-play-triangle {
          width:0; height:0;
          border-top:10px solid transparent;
          border-bottom:10px solid transparent;
          border-left:17px solid rgba(255,255,255,0.88);
          margin-left:4px;
        }
        @media (min-width:768px) {
          .reels-track {
            display:grid; grid-template-columns:repeat(4,1fr); gap:18px;
            overflow-x:visible; max-width:1280px; margin:0 auto;
            padding:0 clamp(24px,6vw,80px);
          }
          .reels-card { flex:none; width:auto; min-height:460px; }
        }
        @media (max-width:480px) {
          .reels-card { min-height:360px; }
          .reels-header-wrap { flex-direction:column !important; align-items:flex-start !important; gap:14px !important; }
          .reels-see-all { align-self:flex-start !important; padding-bottom:0 !important; }
        }
      `}</style>

      <NavBar />

      {/* ══════════════════════════════════════════════ HERO ══ */}
      <section className="hero-section" style={{ position:'relative', height:'100svh', overflow:'hidden' }}>
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
                  { icon:'🌎', label:'BRASIL',  value:'NACIONAL' },
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
                <strong>+25.000</strong> atletas já estão no radar
              </p>
            </div>
          </div>

          {/* RIGHT — AO VIVO card */}
          <div className="hero-phones" style={{ display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingTop:'clamp(48px,7vh,80px)', minWidth:0 }}>
            <div style={{
              width:'296px', flexShrink:0,
              background:'rgba(4,9,5,0.88)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'18px', padding:'18px',
              boxShadow:'0 32px 80px rgba(0,0,0,0.70)',
            }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span className="live-dot" />
                  <span style={{ fontSize:'11px', fontWeight:800, color:'white', letterSpacing:'0.12em', textTransform:'uppercase' }}>AO VIVO AGORA</span>
                </div>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>12 scouts online</span>
              </div>

              {/* Activity items */}
              {[
                { init:'JS', bg:'#1a5c3a', text:'João Silva recebeu nota', bold:'82', icon:'↑', iconColor:'#00FF88', time:'há 2 min' },
                { init:'PF', bg:'#1e3a5f', text:'Pedro foi avaliado por treinador', bold:'', icon:'👁', iconColor:'rgba(255,255,255,0.4)', time:'há 3 min' },
                { init:'LO', bg:'#5f1e3a', text:'Lucas subiu', bold:'+3', suffix:' no OVR', icon:'↑', iconColor:'#00FF88', time:'há 5 min' },
                { init:'NA', bg:'#2a4a1a', text:'Novo atleta de Recife entrou', bold:'', icon:'+', iconColor:'rgba(255,255,255,0.4)', time:'há 7 min' },
              ].map(({ init, bg, text, bold, suffix, icon, iconColor, time }, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'10px 0',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{
                    width:'30px', height:'30px', borderRadius:'50%', flexShrink:0,
                    background:bg, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'9px', fontWeight:800, color:'white',
                  }}>{init}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.80)', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {text}{bold ? <span style={{ color:'#00FF88', fontWeight:800 }}> {bold}</span> : ''}{suffix ?? ''}
                    </p>
                    <p style={{ margin:0, fontSize:'9.5px', color:'rgba(255,255,255,0.28)', marginTop:'2px' }}>{time}</p>
                  </div>
                  <span style={{ fontSize:'14px', color:iconColor, flexShrink:0, fontWeight:700 }}>{icon}</span>
                </div>
              ))}

              {/* Footer */}
              <div style={{ marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.32)', fontWeight:500, letterSpacing:'0.01em' }}>
                  Ver todas as atividades →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HUD decorativo — removido (substituído pelo HeroFeed) */}
      </section>

      {/* ══════════════════════════════════════ LANCES / REELS ══ */}
      <section style={{ background:'#020604', padding:'80px 0 88px', overflow:'hidden' }}>

        {/* Header */}
        <div className="reels-header-wrap" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'0 clamp(24px,5vw,80px)', marginBottom:'36px', maxWidth:'1280px', margin:'0 auto 36px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <span style={{ display:'inline-block', width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', animation:'pulseDot 2s ease-in-out infinite', flexShrink:0 }} />
              <span style={{ fontSize:'9.5px', fontWeight:700, color:'rgba(0,255,136,0.50)', letterSpacing:'0.24em', textTransform:'uppercase' }}>
                Plataforma viva · atualizado agora
              </span>
            </div>
            <h2 style={{ margin:0, fontSize:'clamp(26px,3.8vw,44px)', fontWeight:900, color:'white', letterSpacing:'-0.032em', lineHeight:1.04, textTransform:'uppercase' }}>
              Lances que estão<br/>
              <span style={{ color:'#00FF88' }}>rodando o Brasil</span>
            </h2>
          </div>
          <a href="#" className="reels-see-all" style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.28)', textDecoration:'none', letterSpacing:'0.07em', paddingBottom:'7px', flexShrink:0, whiteSpace:'nowrap' }}>
            Ver todos →
          </a>
        </div>

        {/* Cards track — horizontal scroll on mobile, 4-col grid on desktop */}
        <div className="reels-track">
          {[
            {
              atleta: 'Kauã Ferreira',
              pos:    'Atacante',
              cidade: 'Recife',
              views:  '23,4K',
              likes:  '1,2K',
              dur:    '0:47',
              tag:    '🔥 Em alta',
              tagColor: '#ff6b35',
              tagBg:    'rgba(255,107,53,0.14)',
              tagBorder:'rgba(255,107,53,0.30)',
              bg:    'linear-gradient(170deg,#090f09 0%,#0d1c0d 40%,#091409 100%)',
              light: 'radial-gradient(ellipse at 40% 15%, rgba(0,230,100,0.20) 0%, rgba(0,160,60,0.07) 40%, transparent 65%)',
            },
            {
              atleta: 'Lucas Silva',
              pos:    'Meia',
              cidade: 'BH',
              views:  '18,7K',
              likes:  '932',
              dur:    '0:31',
              tag:    '👀 Scout assistiu',
              tagColor: '#a78bfa',
              tagBg:    'rgba(167,139,250,0.12)',
              tagBorder:'rgba(167,139,250,0.28)',
              bg:    'linear-gradient(170deg,#06081a 0%,#0a0f2e 40%,#070a20 100%)',
              light: 'radial-gradient(ellipse at 60% 18%, rgba(100,130,255,0.20) 0%, rgba(70,90,200,0.06) 40%, transparent 65%)',
            },
            {
              atleta: 'Gabriel Rocha',
              pos:    'Ponta Direita',
              cidade: 'Salvador',
              views:  '15,2K',
              likes:  '723',
              dur:    '0:22',
              tag:    '⚽ Golaço',
              tagColor: '#fbbf24',
              tagBg:    'rgba(251,191,36,0.12)',
              tagBorder:'rgba(251,191,36,0.28)',
              bg:    'linear-gradient(170deg,#120a00 0%,#201400 40%,#160e00 100%)',
              light: 'radial-gradient(ellipse at 50% 14%, rgba(255,180,0,0.22) 0%, rgba(200,120,0,0.07) 40%, transparent 65%)',
            },
            {
              atleta: 'João Mendes',
              pos:    'Atacante',
              cidade: 'São Paulo',
              views:  '12,8K',
              likes:  '601',
              dur:    '0:38',
              tag:    '⭐ Destaque',
              tagColor: 'rgba(255,255,255,0.72)',
              tagBg:    'rgba(255,255,255,0.08)',
              tagBorder:'rgba(255,255,255,0.18)',
              bg:    'linear-gradient(170deg,#0c070f 0%,#190d24 40%,#100818 100%)',
              light: 'radial-gradient(ellipse at 55% 16%, rgba(180,90,255,0.18) 0%, rgba(130,60,200,0.06) 40%, transparent 65%)',
            },
          ].map((r, i) => (
            <div key={i} className="reels-card" style={{ background:r.bg }}>

              {/* Stadium atmospheric light */}
              <div style={{ position:'absolute', inset:0, background:r.light }} />

              {/* Film grain — cinematic texture */}
              <div style={{
                position:'absolute', inset:0, opacity:0.07,
                backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize:'cover',
              }} />

              {/* Bottom cinematic gradient */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.12) 56%, transparent 100%)' }} />

              {/* ── Top row: tag + duration ── */}
              <div style={{ position:'absolute', top:'14px', left:'14px', right:'14px', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:3 }}>
                <div style={{
                  background:r.tagBg, border:`1px solid ${r.tagBorder}`,
                  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                  borderRadius:'100px', padding:'5px 12px',
                  fontSize:'10px', fontWeight:700, color:r.tagColor,
                  letterSpacing:'0.01em', lineHeight:1.3,
                }}>
                  {r.tag}
                </div>
                <div style={{
                  background:'rgba(0,0,0,0.55)',
                  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                  borderRadius:'100px', padding:'5px 10px',
                  fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.62)',
                  letterSpacing:'0.04em',
                }}>
                  {r.dur}
                </div>
              </div>

              {/* ── Play button ── */}
              <div className="reel-play-btn">
                <div className="reel-play-triangle" />
              </div>

              {/* ── Bottom info ── */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'18px 18px 20px', zIndex:3 }}>
                {/* Stats */}
                <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.50)' }}>
                    <span style={{ opacity:0.6, fontSize:'10px' }}>▷</span>{r.views}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.50)' }}>
                    <span style={{ opacity:0.6, fontSize:'10px' }}>♡</span>{r.likes}
                  </span>
                </div>
                {/* Name */}
                <div style={{ fontSize:'16px', fontWeight:900, color:'white', letterSpacing:'-0.02em', lineHeight:1.15, marginBottom:'4px' }}>
                  {r.atleta}
                </div>
                {/* Position · City */}
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.38)', fontWeight:500, letterSpacing:'0.01em' }}>
                  {r.pos}&nbsp;·&nbsp;{r.cidade}
                </div>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* ══════════════════════════════════════ RANKING | VÍDEOS | MAPA ══ */}
      <section style={{ background:'#050906', padding:'56px 24px 40px' }}>
        <div className="three-cols" style={{ maxWidth:'1200px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr', gap:'32px' }}>

          {/* ── COL 1: Ranking ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
              <span style={{ fontSize:'9.5px', fontWeight:800, color:'rgba(255,255,255,0.38)', letterSpacing:'0.20em', textTransform:'uppercase' }}>Os mais vistos da semana</span>
              <Link href="/ranking" style={{ fontSize:'11px', color:'#00FF88', textDecoration:'none', fontWeight:600, letterSpacing:'0.04em' }}>Ver ranking →</Link>
            </div>
            {[
              { nome:'Kauã Ferreira',  pos:'ATA', ovr:91, delta:'+2' },
              { nome:'Bruno Santos',   pos:'MAT', ovr:77, delta:'+6' },
              { nome:'Thiago Mendes',  pos:'CA',  ovr:83, delta:'+1' },
              { nome:'João Mendes',    pos:'ATA', ovr:85, delta:'+3' },
              { nome:'Pedro Lima',     pos:'GK',  ovr:74, delta:'—'  },
            ].map((a, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'11px 0',
                borderBottom:'1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.22)', width:'14px', flexShrink:0 }}>{i+1}</span>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:['#1a5c3a','#1e3a5f','#5f1e3a','#3a5f1e','#3a1e5f'][i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:800, color:'white', flexShrink:0 }}>
                  {a.nome.split(' ').map(w=>w[0]).slice(0,2).join('')}
                </div>
                <span style={{ flex:1, fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.88)', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome}</span>
                <span style={{ fontSize:'8.5px', fontWeight:800, color:'#00FF88', background:'rgba(0,255,136,0.08)', padding:'2px 6px', borderRadius:'4px', letterSpacing:'0.05em', flexShrink:0 }}>{a.pos}</span>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', flexShrink:0 }}>OVR <strong style={{ color:'rgba(255,255,255,0.88)', fontWeight:900 }}>{a.ovr}</strong></span>
                <span style={{ fontSize:'11px', fontWeight:700, color: a.delta === '—' ? 'rgba(255,255,255,0.25)' : '#00FF88', flexShrink:0 }}>{a.delta !== '—' ? `↑ ${a.delta.replace('+','')}` : '—'}</span>
              </div>
            ))}
          </div>

          {/* ── COL 2: Vídeos ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
              <span style={{ fontSize:'9.5px', fontWeight:800, color:'rgba(255,255,255,0.38)', letterSpacing:'0.20em', textTransform:'uppercase' }}>Lances que estão rodando o Brasil</span>
              <span style={{ fontSize:'11px', color:'#00FF88', fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}>Ver todos →</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {[
                { views:'23.4K', likes:'1.2K', bg:'linear-gradient(180deg,#0a1a0f 0%,#051008 100%)' },
                { views:'18.7K', likes:'932',  bg:'linear-gradient(180deg,#0d1208 0%,#060c04 100%)' },
                { views:'15.2K', likes:'723',  bg:'linear-gradient(180deg,#0a0f15 0%,#050810 100%)' },
              ].map((v, i) => (
                <div key={i} style={{ borderRadius:'10px', overflow:'hidden', background:v.bg, position:'relative', aspectRatio:'9/14', minHeight:'160px' }}>
                  {/* Cinematic overlay */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.65) 100%)' }} />
                  {/* Noise texture overlay */}
                  <div style={{ position:'absolute', inset:0, opacity:0.06, backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize:'cover' }} />
                  {/* Play button */}
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'14px', color:'white', marginLeft:'3px' }}>▶</span>
                  </div>
                  {/* Stats */}
                  <div style={{ position:'absolute', bottom:'8px', left:'8px', right:'8px', display:'flex', gap:'10px' }}>
                    <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.60)', fontWeight:600 }}>▷ {v.views}</span>
                    <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.60)', fontWeight:600 }}>♡ {v.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COL 3: Mapa ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
              <span style={{ fontSize:'9.5px', fontWeight:800, color:'rgba(255,255,255,0.38)', letterSpacing:'0.20em', textTransform:'uppercase' }}>O futebol acontece em todo lugar</span>
              <span style={{ fontSize:'11px', color:'#00FF88', fontWeight:600, letterSpacing:'0.04em', cursor:'pointer' }}>Ver mapa →</span>
            </div>
            {/* Brazil map SVG */}
            <div style={{ position:'relative', width:'100%', height:'180px', marginBottom:'20px' }}>
              <svg viewBox="0 0 340 300" style={{ width:'100%', height:'100%' }} fill="none">
                <path d="M170,18 L205,22 L228,35 L248,42 L265,38 L278,50 L282,65 L275,78 L285,92 L290,108 L282,122 L290,138 L285,155 L272,168 L268,185 L258,198 L248,210 L238,222 L225,232 L215,245 L208,258 L198,268 L188,275 L178,272 L168,265 L158,258 L148,248 L138,235 L128,225 L118,215 L108,205 L98,192 L90,178 L85,165 L78,152 L72,138 L68,124 L62,110 L58,96 L62,82 L70,70 L78,58 L88,48 L100,40 L112,34 L125,28 L140,22 L155,18 L170,18Z" stroke="rgba(0,255,136,0.18)" strokeWidth="1.2" fill="rgba(0,255,136,0.03)" />
                {/* Major city dots */}
                {[
                  [170,80],[145,105],[190,120],[155,148],[178,162],
                  [130,135],[200,148],[162,188],[148,210],[185,205],
                  [220,130],[105,155],[235,165],[170,230],[192,240],
                ].map(([x,y],i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3.5" fill="#00FF88" opacity="0.7" />
                    <circle cx={x} cy={y} r="7" fill="#00FF88" opacity="0.12" />
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display:'flex', gap:'28px' }}>
              <div>
                <div style={{ fontSize:'clamp(24px,3vw,32px)', fontWeight:900, color:'white', lineHeight:1 }}>26</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.32)', marginTop:'4px' }}>estados</div>
              </div>
              <div>
                <div style={{ fontSize:'clamp(24px,3vw,32px)', fontWeight:900, color:'white', lineHeight:1 }}>+480</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.32)', marginTop:'4px' }}>cidades</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════ LOGOS CLUBES ══ */}
      <section style={{ background:'#040806', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'28px 24px 32px' }}>
        <p style={{ textAlign:'center', fontSize:'9px', fontWeight:700, letterSpacing:'0.22em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase', margin:'0 0 24px' }}>
          Confiança de quem faz o futebol acontecer
        </p>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'clamp(20px,4vw,48px)', flexWrap:'wrap', opacity:0.50, filter:'grayscale(1) brightness(1.8)' }}>
          {[
            { abbr:'SPFC', label:'São Paulo FC' },
            { abbr:'FLA',  label:'Flamengo' },
            { abbr:'CAM',  label:'Atlético MG' },
            { abbr:'SCO',  label:'Corinthians' },
            { abbr:'GRE',  label:'Grêmio' },
            { abbr:'INT',  label:'Internacional' },
            { abbr:'RBB',  label:'Red Bull Bragantino' },
            { abbr:'SAN',  label:'Santos FC' },
          ].map(({ abbr, label }) => (
            <div key={abbr} title={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'8px', fontWeight:900, color:'white', letterSpacing:'0.02em' }}>{abbr}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ MOBILE: AO VIVO ══ */}
      <div className="lnc-mob" style={{ padding:'20px 20px 0', background:'#06100a' }}>
        <div className="lnc">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid rgba(0,255,136,0.10)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ position:'relative', width:'22px', height:'22px', flexShrink:0 }}>
                <div style={{ position:'relative', zIndex:1, width:'100%', height:'100%', borderRadius:'50%', background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.38)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px' }}>🔥</div>
                <div className="lnc-ring" />
              </div>
              <span style={{ fontSize:'10px', fontWeight:800, color:'rgba(0,255,136,0.9)', letterSpacing:'0.16em', textTransform:'uppercase' }}>AO VIVO AGORA</span>
            </div>
            <span style={{ fontSize:'9px', fontWeight:700, color:'rgba(0,255,136,0.55)', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.18)', borderRadius:'100px', padding:'2px 8px', letterSpacing:'0.08em' }}>LIVE</span>
          </div>
          {[
            { init:'JS', bg:'#1a5c3a', icon:'⭐', text:'João Silva recebeu nota 82', time:'2 min' },
            { init:'PS', bg:'#1e3a5f', icon:'🎯', text:'Pedro Santos avaliado por treinador', time:'5 min' },
            { init:'LO', bg:'#5f1e3a', icon:'📈', text:'Lucas Oliveira subiu +3 no OVR', time:'8 min' },
            { init:'RK', bg:'#3a1e5f', icon:'🏆', text:'Ranking Sub-17 atualizado', time:'11 min' },
            { init:'👁', bg:'#0d3320', icon:'🟢', text:'12 scouts estão online agora', time:'agora' },
          ].map(({ init, bg, icon, text, time }, i) => (
            <div key={text} className={`lnc-it li${i + 1}`}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:800, color:'white', flexShrink:0, border:'1px solid rgba(255,255,255,0.10)' }}>
                {init}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.82)', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {icon} {text}
                </p>
                <p style={{ margin:0, fontSize:'9px', color:'rgba(0,255,136,0.55)', fontWeight:600, marginTop:'2px' }}>{time === 'agora' ? 'agora' : `${time} atrás`}</p>
              </div>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', flexShrink:0, boxShadow:'0 0 5px rgba(0,255,136,0.9)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════ TOP 3 ══ */}
      <TeamOfWeekSection />

      {/* ══════════════════════════════════════ CARD CRAQUE ══ */}
      <CardCraqueSection />

      {/* ══════════════════════════════════════ BILLBOARD ══ */}
      <PhotoBillboard />

      {/* ══════════════════════════════════════ ACTIVITY TICKER ══ */}
      <ActivityTicker />

      {/* ══════════════════════════════════════ COMO FUNCIONA ══ */}
      <section style={{ padding:'96px 20px 80px', background:'#030905', position:'relative', overflow:'hidden' }}>
        {/* Subtle grid background */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)',
          backgroundSize:'72px 72px',
        }} />
        {/* Corner glow */}
        <div style={{ position:'absolute', top:'-120px', right:'-120px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:'1080px', margin:'0 auto', position:'relative' }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'72px' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(0,255,136,0.55)', letterSpacing:'0.20em', textTransform:'uppercase', marginBottom:'14px' }}>
              Como funciona
            </div>
            <h2 style={{ margin:'0 0 16px', fontSize:'clamp(28px,5vw,46px)', fontWeight:900, color:'white', letterSpacing:'-0.035em', lineHeight:1.05 }}>
              Da escolinha ao contrato
            </h2>
            <p style={{ margin:0, fontSize:'clamp(14px,1.1vw,16px)', color:'rgba(255,255,255,0.38)', maxWidth:'460px', marginLeft:'auto', marginRight:'auto', lineHeight:1.70 }}>
              Três passos simples que transformam um jovem talento em um atleta visível para o Brasil inteiro.
            </p>
          </div>

          {/* Steps */}
          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0, position:'relative' }}>
            {/* Connecting line — desktop */}
            <div className="steps-connector" style={{
              position:'absolute', top:'44px', left:'calc(16.66% + 16px)', right:'calc(16.66% + 16px)',
              height:'1px',
              background:'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.20) 12%, rgba(0,255,136,0.20) 88%, transparent 100%)',
              pointerEvents:'none',
            }}>
              {/* Dots on the line */}
              <div style={{ position:'absolute', left:'50%', top:'-3px', width:'7px', height:'7px', borderRadius:'50%', background:'rgba(0,255,136,0.25)', border:'1px solid rgba(0,255,136,0.45)', transform:'translateX(-50%)' }} />
            </div>

            {[
              {
                num:'01',
                emoji:'⚡',
                title:'Crie seu perfil',
                desc:'Em 2 minutos, de graça. Foto, posição, cidade, dados físicos e histórico completo de escolinhas.',
                accentColor:'#00FF88',
                iconBg:'rgba(0,255,136,0.08)',
                iconBorder:'rgba(0,255,136,0.22)',
                iconGlow:'rgba(0,255,136,0.15)',
              },
              {
                num:'02',
                emoji:'🎯',
                title:'Receba avaliações',
                desc:'Treinadores certificados avaliam seus atributos e geram seu OVR — a nota oficial do Meu Craque.',
                accentColor:'#fbbf24',
                iconBg:'rgba(251,191,36,0.08)',
                iconBorder:'rgba(251,191,36,0.22)',
                iconGlow:'rgba(251,191,36,0.15)',
              },
              {
                num:'03',
                emoji:'🌎',
                title:'Seja descoberto',
                desc:'Scouts e clubes de todo o Brasil buscam ativamente por perfis como o seu. Sua janela está aberta.',
                accentColor:'#a78bfa',
                iconBg:'rgba(167,139,250,0.08)',
                iconBorder:'rgba(167,139,250,0.22)',
                iconGlow:'rgba(167,139,250,0.15)',
              },
            ].map((step) => (
              <div key={step.num} className="step-card" style={{ padding:'0 40px', textAlign:'center' }}>
                {/* Step label */}
                <div style={{
                  fontSize:'10px', fontWeight:900, letterSpacing:'0.22em',
                  color:`${step.accentColor}55`, marginBottom:'18px',
                }}>
                  PASSO {step.num}
                </div>

                {/* Icon */}
                <div style={{
                  width:'88px', height:'88px', borderRadius:'50%',
                  background:step.iconBg, border:`1px solid ${step.iconBorder}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'36px', margin:'0 auto 28px',
                  boxShadow:`0 0 36px ${step.iconGlow}`,
                  position:'relative',
                }}>
                  {step.emoji}
                  {/* Outer ring */}
                  <div style={{
                    position:'absolute', inset:'-8px', borderRadius:'50%',
                    border:`1px solid ${step.accentColor}12`,
                    pointerEvents:'none',
                  }} />
                </div>

                <h3 style={{
                  margin:'0 0 14px', fontSize:'clamp(18px,1.4vw,22px)',
                  fontWeight:800, color:'white', letterSpacing:'-0.025em',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  margin:0, fontSize:'14px', color:'rgba(255,255,255,0.38)',
                  lineHeight:1.72, maxWidth:'240px', marginLeft:'auto', marginRight:'auto',
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign:'center', marginTop:'64px' }}>
            <Link href="/atleta/cadastro" style={{
              display:'inline-flex', alignItems:'center', gap:'10px',
              padding:'15px 36px', borderRadius:'100px',
              background:'linear-gradient(160deg,#00FF99 0%,#00E07A 52%,#00CC66 100%)',
              color:'#020c05', fontWeight:800, fontSize:'14px',
              textDecoration:'none', letterSpacing:'0.09em',
              boxShadow:'0 0 36px rgba(0,255,136,0.30), 0 4px 18px rgba(0,0,0,0.4)',
              transition:'filter .2s, transform .15s',
            }}>
              ⚽ COMEÇAR AGORA — É GRÁTIS
            </Link>
            <p style={{ margin:'16px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.22)', letterSpacing:'0.05em' }}>
              SEM CARTÃO DE CRÉDITO · PERFIL PRONTO EM 2 MINUTOS
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ DEPOIMENTOS ══ */}
      <section style={{ padding:'80px 20px', background:'#040a06', position:'relative', overflow:'hidden' }}>
        {/* Subtle ambient */}
        <div style={{ position:'absolute', bottom:'-80px', left:'50%', transform:'translateX(-50%)', width:'700px', height:'300px', background:'radial-gradient(ellipse at center, rgba(0,255,136,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:'1080px', margin:'0 auto', position:'relative' }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(0,255,136,0.55)', letterSpacing:'0.20em', textTransform:'uppercase', marginBottom:'12px' }}>
              Histórias reais
            </div>
            <h2 style={{ margin:'0 0 12px', fontSize:'clamp(26px,5vw,40px)', fontWeight:900, color:'white', letterSpacing:'-0.03em' }}>
              Quem usa, vira fã
            </h2>
            <p style={{ margin:0, fontSize:'15px', color:'rgba(255,255,255,0.35)' }}>
              Atletas, treinadores e scouts que mudaram de nível com o Meu Craque.
            </p>
          </div>

          <div className="dep-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {[
              {
                quote: '"Três semanas depois de criar meu perfil, recebi uma mensagem de um scout de Belo Horizonte. Nunca imaginei que algo assim fosse real."',
                name: 'Rafael S.',
                role: 'Atacante · 17 anos',
                city: 'Santos, SP',
                init: 'RS',
                avatarBg: 'linear-gradient(135deg,#064e1e,#16a34a)',
                stars: 5,
                accent: '#00FF88',
                topLine: 'rgba(0,255,136,0.35)',
              },
              {
                quote: '"Finalmente tenho um histórico digital de cada atleta que avaliei. Meu trabalho ganhou o reconhecimento que nunca tive com papel e caneta."',
                name: 'Coach André Lima',
                role: 'Treinador certificado',
                city: 'Campinas, SP',
                init: 'AL',
                avatarBg: 'linear-gradient(135deg,#1e3a5f,#3b82f6)',
                stars: 5,
                accent: '#60a5fa',
                topLine: 'rgba(96,165,250,0.35)',
              },
              {
                quote: '"Em uma tarde, avaliei 40 perfis de atacantes de São Paulo e do Rio. Antes disso levaria semanas visitando escolinhas. É uma revolução."',
                name: 'Marcus Veiga',
                role: 'Scout profissional',
                city: 'São Paulo, SP',
                init: 'MV',
                avatarBg: 'linear-gradient(135deg,#3b1b8c,#a78bfa)',
                stars: 5,
                accent: '#a78bfa',
                topLine: 'rgba(167,139,250,0.35)',
              },
            ].map((d) => (
              <div key={d.name} className="dep-card" style={{
                background:'linear-gradient(168deg,#0c1510 0%,#060d09 100%)',
                border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:'20px', padding:'28px',
                position:'relative', overflow:'hidden',
              }}>
                {/* Top accent line */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, transparent, ${d.topLine}, transparent)` }} />

                {/* Stars */}
                <div style={{ marginBottom:'18px', fontSize:'13px', letterSpacing:'2px', color:'#fbbf24' }}>
                  {'★'.repeat(d.stars)}
                </div>

                {/* Quote */}
                <p style={{ margin:'0 0 24px', fontSize:'14px', color:'rgba(255,255,255,0.60)', lineHeight:1.76, fontStyle:'italic', fontWeight:400 }}>
                  {d.quote}
                </p>

                {/* Author */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{
                    width:'40px', height:'40px', borderRadius:'50%',
                    background:d.avatarBg,
                    border:`1px solid ${d.accent}33`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'13px', fontWeight:800, color:'white', flexShrink:0,
                    boxShadow:`0 0 16px ${d.accent}18`,
                  }}>
                    {d.init}
                  </div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'white', marginBottom:'2px' }}>{d.name}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.32)', letterSpacing:'0.02em' }}>{d.role} · {d.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ FEATURES ══ */}
      <FeaturesSection />

      {/* ══════════════════════════════════════ PARA QUEM ══ */}
      <ParaQuemSection />

      {/* ══════════════════════════════════════ PROSPECTS ══ */}
      <ProspectsSection />

      {/* ══════════════════════════════════════ STATS ══ */}
      <StatsBar />

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
            O TALENTO PASSA.
            <br/>
            <span style={{
              color:'#00FF88',
              textShadow:'0 0 40px rgba(0,255,136,0.45), 0 0 80px rgba(0,255,136,0.15)',
            }}>
              A OPORTUNIDADE NÃO ESPERA.
            </span>
          </h2>

          <p style={{ margin:'0 0 44px', fontSize:'clamp(15px,1.2vw,18px)', color:'rgba(255,255,255,0.38)', lineHeight:1.68, maxWidth:'520px', marginLeft:'auto', marginRight:'auto' }}>
            Crie seu perfil grátis agora e entre no radar dos scouts mais ativos do Brasil.
            Seu próximo passo começa aqui.
          </p>

          <div className="fcta-wrap" style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'28px' }}>
            <Link href="/atleta/cadastro" className="fcta-primary">
              ⚽ SOU ATLETA — QUERO MEU CARD
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

      {/* ══════════════════════════════════════ CARDS BAR ══ */}
      <div style={{ background:'#080e09', borderTop:'1px solid rgba(34,197,94,0.12)' }}>
        <div className="cards-grid" style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {cards.map((c, i) => (
            <div key={c.title} className="card-item" style={{
              padding:'28px 24px',
              borderRight: i < 3 ? '1px solid rgba(34,197,94,0.08)' : 'none',
            }}>
              <div style={{ marginBottom:'12px' }}>{c.icon}</div>
              <p style={{ margin:'0 0 6px', fontSize:'15px', fontWeight:700, color:'#22c55e' }}>{c.title}</p>
              <p style={{ margin:'0 0 14px', fontSize:'13px', color:'rgba(255,255,255,0.45)', lineHeight:1.58 }}>{c.desc}</p>
              <a href={c.href} style={{ fontSize:'13px', color:'rgba(0,255,136,0.75)', fontWeight:600, textDecoration:'none', letterSpacing:'0.01em' }}>
                Saiba mais →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════ FOOTER ══ */}
      <footer style={{ background:'#06100a', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'32px 40px' }}>
        <div className="footer-inner" style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'18px', fontWeight:800, letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            <span>⚽</span>
            <span style={{ color:'white' }}>MEU </span>
            <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </span>
          <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.24)', textAlign:'center' }}>
            © {new Date().getFullYear()} Meu Craque. Todos os direitos reservados.
          </p>
          <div style={{ display:'flex', gap:'20px', flexShrink:0 }}>
            <Link href="/ranking" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Ranking</Link>
            <Link href="/scout/busca" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Scouts</Link>
            <Link href="/treinador/cadastro" style={{ fontSize:'12px', color:'rgba(255,255,255,0.30)', textDecoration:'none', letterSpacing:'0.03em' }}>Treinadores</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

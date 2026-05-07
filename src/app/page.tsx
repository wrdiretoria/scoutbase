import Link from 'next/link'

const navLinks = ['Para atletas', 'Para treinadores', 'Para responsáveis', 'Para scouts', 'Recursos', 'Planos']

const cards = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
    ),
    title: 'Para treinadores',
    desc: 'Gestão completa da sua equipe e evolução dos atletas.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: 'Para atletas',
    desc: 'Evolua seu jogo, ganhe destaque e seja visto por quem importa.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    title: 'Para responsáveis',
    desc: 'Acompanhe cada passo do seu filho com segurança e clareza.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    ),
    title: 'Para scouts',
    desc: 'Encontre novos talentos de forma rápida e eficiente.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#06100a', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatBack { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .nav-link { color:rgba(255,255,255,0.65); text-decoration:none; font-size:14px; font-weight:500; transition:color .2s; }
        .nav-link:hover { color:white; }
        .card-item { transition:background .2s; cursor:default; }
        .card-item:hover { background:rgba(34,197,94,0.06); }

        /* ── MOBILE ── */
        @media (max-width: 860px) {
          .nav-links-wrap { display:none !important; }
          .nav-inner { padding: 0 12px !important; gap: 8px !important; }
          .nav-btn-secondary { padding: 7px 12px !important; font-size: 12px !important; }
          .nav-btn-primary { padding: 7px 12px !important; font-size: 12px !important; }
          .nav-logo-text { font-size: 16px !important; }
          .nav-logo-icon { font-size: 18px !important; }
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 0 28px !important;
            align-items: flex-start !important;
            padding-top: 100px !important;
          }
          .hero-phones { display:none !important; }
          .cards-grid { grid-template-columns: 1fr 1fr !important; }
          .card-item { border-right: none !important; border-bottom: 1px solid rgba(34,197,94,0.1); }
          .footer-inner { flex-direction: column !important; gap: 8px !important; text-align: center !important; }
          .hero-section { height: auto !important; min-height: 100vh !important; }
          .hero-left { padding-bottom: 60px !important; }
        }
        @media (max-width: 480px) {
          .cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:'64px', background:'rgba(6,16,10,0.9)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center',
        overflowX:'hidden',
      }}>
        <div className="nav-inner" style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 40px', width:'100%', display:'flex', alignItems:'center', gap:'32px' }}>
          <span className="nav-logo-text" style={{ fontSize:'20px', fontWeight:800, letterSpacing:'0.04em', flexShrink:0, display:'flex', alignItems:'center', gap:'8px' }}>
            <span className="nav-logo-icon" style={{ fontSize:'22px' }}>⚽</span>
            <span style={{ color:'white' }}>MEU </span>
            <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </span>
          <div className="nav-links-wrap" style={{ display:'flex', alignItems:'center', gap:'24px', flex:1, justifyContent:'center' }}>
            {navLinks.map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            <Link href="/login" className="nav-btn-secondary" style={{ padding:'8px 20px', fontSize:'14px', fontWeight:600, color:'white', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'10px', textDecoration:'none' }}>
              Entrar
            </Link>
            <Link href="/cadastro" className="nav-btn-primary" style={{ padding:'8px 20px', fontSize:'14px', fontWeight:700, color:'black', background:'#22c55e', borderRadius:'10px', textDecoration:'none' }}>
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero-section" style={{ position:'relative', height:'100vh', overflow:'hidden' }}>
        {/* BG */}
        <img
          src="https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=90"
          alt="" aria-hidden
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', zIndex:0 }}
        />
        <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.80) 45%, rgba(0,0,0,0.25) 100%)' }} />

        {/* Grid */}
        <div className="hero-grid" style={{
          position:'relative', zIndex:2, height:'100%', width:'100%',
          display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',
          alignItems:'center', padding:'0 80px', gap:'48px', boxSizing:'border-box'
        }}>

          {/* LEFT */}
          <div className="hero-left" style={{ display:'flex', flexDirection:'column', gap:'28px', minWidth:0 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:'8px', width:'fit-content',
              padding:'6px 16px', borderRadius:'100px',
              border:'1.5px solid rgba(34,197,94,0.5)', background:'rgba(34,197,94,0.08)',
              fontSize:'11px', fontWeight:700, color:'#22c55e', letterSpacing:'0.06em',
            }}>
              ⭐ A PLATAFORMA #1 PARA O FUTEBOL DE BASE
            </span>

            <h1 style={{ fontSize:'clamp(52px,5.5vw,76px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.0, color:'white', margin:0 }}>
              <span style={{ display:'block' }}>A jornada completa</span>
              <span style={{ display:'block' }}>de quem vive</span>
              <em style={{ display:'block', color:'#22c55e', fontStyle:'italic' }}>o futebol.</em>
            </h1>

            <p style={{ fontSize:'17px', color:'rgba(255,255,255,0.68)', lineHeight:1.65, margin:0, maxWidth:'420px' }}>
              Gestão, evolução e visibilidade para transformar treino em oportunidades reais.
            </p>

            <Link href="/cadastro" style={{
              display:'inline-flex', alignItems:'center', gap:'14px', width:'fit-content',
              background:'#22c55e', color:'black', fontWeight:800, fontSize:'17px',
              borderRadius:'14px', padding:'16px 32px', textDecoration:'none',
            }}>
              <span style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(0,0,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>↗</span>
              Começar minha jornada
            </Link>
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
      </section>

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
              <a href="#" style={{ fontSize:'13px', color:'#22c55e', fontWeight:600, textDecoration:'none' }}>Saiba mais &gt;</a>
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

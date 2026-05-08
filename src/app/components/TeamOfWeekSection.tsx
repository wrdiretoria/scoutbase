// Server Component — sem 'use client'

type Player = {
  initials: string
  name:     string
  pos:      string
  score:    number
  trend:    string
  grad:     string
  glow:     string
  left:     string
  top:      string
  captain?: boolean
}

// Formação 4-3-3  (campo: ataque no topo, GK na base)
const players: Player[] = [
  // ── ATACANTES ──
  { initials:'CF', name:'Cauã F.',    pos:'PE', score:86, trend:'+7',  grad:'linear-gradient(135deg,#15803d,#4ade80)', glow:'rgba(74,222,128,0.55)',  left:'17%', top:'17%' },
  { initials:'PL', name:'Pedro L.',   pos:'CA', score:90, trend:'+12', grad:'linear-gradient(135deg,#15803d,#4ade80)', glow:'rgba(74,222,128,0.55)',  left:'50%', top:'9%'  },
  { initials:'GS', name:'Gabriel S.', pos:'PD', score:91, trend:'+18', grad:'linear-gradient(135deg,#15803d,#4ade80)', glow:'rgba(74,222,128,0.55)',  left:'83%', top:'17%' },

  // ── MEIAS ──
  { initials:'JV', name:'João V.',    pos:'MC', score:88, trend:'+9',  grad:'linear-gradient(135deg,#6d28d9,#a78bfa)', glow:'rgba(167,139,250,0.5)',  left:'22%', top:'38%', captain:true },
  { initials:'MR', name:'Marcos R.',  pos:'MC', score:83, trend:'+5',  grad:'linear-gradient(135deg,#6d28d9,#a78bfa)', glow:'rgba(167,139,250,0.5)',  left:'50%', top:'38%' },
  { initials:'RC', name:'Rafael C.',  pos:'MC', score:82, trend:'+3',  grad:'linear-gradient(135deg,#6d28d9,#a78bfa)', glow:'rgba(167,139,250,0.5)',  left:'78%', top:'38%' },

  // ── DEFENSORES ──
  { initials:'DO', name:'Davi O.',    pos:'LD', score:81, trend:'+1',  grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)', glow:'rgba(96,165,250,0.45)',  left:'11%', top:'61%' },
  { initials:'CM', name:'Caio M.',    pos:'ZG', score:85, trend:'+6',  grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)', glow:'rgba(96,165,250,0.45)',  left:'34%', top:'61%' },
  { initials:'LP', name:'Lucas P.',   pos:'ZG', score:84, trend:'+3',  grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)', glow:'rgba(96,165,250,0.45)',  left:'66%', top:'61%' },
  { initials:'FS', name:'Felipe S.',  pos:'LE', score:82, trend:'+2',  grad:'linear-gradient(135deg,#1d4ed8,#60a5fa)', glow:'rgba(96,165,250,0.45)',  left:'89%', top:'61%' },

  // ── GOLEIRO ──
  { initials:'RP', name:'Rodrigo P.', pos:'GK', score:87, trend:'+4',  grad:'linear-gradient(135deg,#b45309,#fbbf24)', glow:'rgba(251,191,36,0.55)',  left:'50%', top:'85%' },
]

export default function TeamOfWeekSection() {
  return (
    <section style={{ padding:'80px 0 72px', background:'#06100a' }}>
      <style>{`
        @keyframes live-pulse {
          0%,100% { opacity:1; transform:scale(1) }
          50%      { opacity:0.4; transform:scale(0.8) }
        }
        .live-dot { animation: live-pulse 1.8s ease-in-out infinite; }

        .tow-card { transition: transform 0.2s ease; }
        .tow-card:hover { transform: scale(1.12); z-index: 10; }

        .tow-field {
          position: relative;
          width: 100%;
          max-width: 440px;
          aspect-ratio: 3/4;
          margin: 0 auto;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.06);
        }

        @media (max-width: 500px) {
          .tow-field { max-width: 100%; border-radius: 12px; }
          .tow-wrapper { padding: 0 16px !important; }
          .tow-title { font-size: 26px !important; }
        }
      `}</style>

      {/* Título */}
      <div style={{ textAlign:'center', marginBottom:'44px', padding:'0 24px' }}>
        <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.12em', color:'#22c55e', textTransform:'uppercase', marginBottom:'10px' }}>
          ⚽ Seleção da semana
        </p>
        <h2 className="tow-title" style={{ fontSize:'34px', fontWeight:900, letterSpacing:'-0.03em', color:'white', lineHeight:1.1, margin:0 }}>
          O melhor do futebol de base
        </h2>
        <p style={{ marginTop:'10px', fontSize:'15px', color:'rgba(255,255,255,0.40)', maxWidth:'400px', margin:'10px auto 0' }}>
          Escalado pelos dados. Exibido para o Brasil.
        </p>
      </div>

      {/* Campo */}
      <div className="tow-wrapper" style={{ padding:'0 24px' }}>
        <div className="tow-field">

          {/* Fundo do gramado */}
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse at 50% 35%, #0d2b14 0%, #061209 60%, #040c07 100%)',
          }} />

          {/* Listras do gramado */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              position:'absolute', left:0, right:0,
              top:`${i*12.5}%`, height:'12.5%',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            }} />
          ))}

          {/* Linhas do campo */}
          {/* Borda interior */}
          <div style={{ position:'absolute', inset:'5%', border:'1px solid rgba(255,255,255,0.11)', borderRadius:'4px', pointerEvents:'none' }} />
          {/* Linha do meio */}
          <div style={{ position:'absolute', left:'5%', right:'5%', top:'50%', height:'1px', background:'rgba(255,255,255,0.11)', pointerEvents:'none' }} />
          {/* Círculo central */}
          <div style={{ position:'absolute', left:'50%', top:'50%', width:'14%', height:0, paddingBottom:'18.67%', transform:'translate(-50%,-50%)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'50%', pointerEvents:'none' }} />
          {/* Ponto central */}
          <div style={{ position:'absolute', left:'50%', top:'50%', width:'5px', height:'5px', transform:'translate(-50%,-50%)', borderRadius:'50%', background:'rgba(255,255,255,0.18)', pointerEvents:'none' }} />
          {/* Área defensiva (topo) */}
          <div style={{ position:'absolute', left:'28%', right:'28%', top:'5%', height:'14%', border:'1px solid rgba(255,255,255,0.09)', borderTop:'none', pointerEvents:'none' }} />
          {/* Área defensiva (base) */}
          <div style={{ position:'absolute', left:'28%', right:'28%', bottom:'5%', height:'14%', border:'1px solid rgba(255,255,255,0.09)', borderBottom:'none', pointerEvents:'none' }} />

          {/* Overlay de transmissão — topo */}
          <div style={{
            position:'absolute', top:0, left:0, right:0,
            padding:'10px 14px',
            background:'linear-gradient(180deg,rgba(0,0,0,0.72) 0%,transparent 100%)',
            display:'flex', alignItems:'center', gap:'7px', zIndex:5,
          }}>
            <div className="live-dot" style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#ef4444', flexShrink:0 }} />
            <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              Ao vivo · Sub-15 · Rio de Janeiro
            </span>
          </div>

          {/* Jogadores */}
          {players.map((p) => (
            <div
              key={p.name}
              className="tow-card"
              style={{
                position:'absolute',
                left: p.left,
                top:  p.top,
                transform:'translate(-50%,-50%)',
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:'3px', zIndex:3, cursor:'default',
              }}
            >
              {/* Avatar */}
              <div style={{
                position:'relative',
                width:'42px', height:'42px', borderRadius:'50%',
                background: p.grad,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'12px', fontWeight:900, color:'white',
                border:'2px solid rgba(255,255,255,0.25)',
                boxShadow:`0 0 18px ${p.glow}, 0 4px 12px rgba(0,0,0,0.6)`,
              }}>
                {p.initials}
                {p.captain && (
                  <div style={{
                    position:'absolute', top:'-5px', right:'-5px',
                    width:'14px', height:'14px', borderRadius:'50%',
                    background:'#f59e0b', border:'1.5px solid #0b1610',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'7px', fontWeight:900, color:'#000',
                  }}>C</div>
                )}
              </div>

              {/* Score + seta */}
              <div style={{ display:'flex', alignItems:'center', gap:'2px' }}>
                <span style={{ fontSize:'13px', fontWeight:900, color:'white', lineHeight:1, textShadow:'0 2px 8px rgba(0,0,0,0.8)' }}>{p.score}</span>
                <span style={{ fontSize:'9px', color:'#4ade80', fontWeight:700 }}>↑</span>
              </div>

              {/* Nome */}
              <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.65)', fontWeight:600, whiteSpace:'nowrap', textShadow:'0 1px 4px rgba(0,0,0,0.9)' }}>
                {p.name}
              </span>

              {/* Badge de posição */}
              <div style={{
                background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:'4px', padding:'1px 5px',
                fontSize:'8px', fontWeight:800,
                color:'rgba(255,255,255,0.75)', letterSpacing:'0.06em',
              }}>
                {p.pos}
              </div>
            </div>
          ))}

          {/* Vinheta nas bordas */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(4,12,7,0.7) 100%)', pointerEvents:'none', zIndex:4 }} />
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ textAlign:'center', marginTop:'32px', padding:'0 24px' }}>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', margin:'0 0 14px' }}>
          Baseada em <strong style={{ color:'rgba(255,255,255,0.45)' }}>1.247</strong> avaliações esta semana · Atualizada toda segunda-feira
        </p>
        <a href="/cadastro" style={{
          display:'inline-flex', alignItems:'center', gap:'8px',
          color:'#22c55e', fontSize:'14px', fontWeight:700,
          textDecoration:'none', borderBottom:'1px solid rgba(34,197,94,0.3)',
          paddingBottom:'2px',
        }}>
          Entrar no próximo ranking e disputar uma vaga →
        </a>
      </div>
    </section>
  )
}

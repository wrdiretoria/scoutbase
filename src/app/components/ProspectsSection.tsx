// Server Component — sem 'use client'

const prospects = [
  {
    initials: 'GS',
    name: 'Gabriel Santos',
    age: 17,
    position: 'ATA',
    positionFull: 'Atacante',
    city: 'São Paulo',
    state: 'SP',
    score: 91,
    badge: 'PROMESSA DO ANO',
    badgeColor: '#f59e0b',
    trend: '+18',
    highlight: 'Artilheiro do Sub-17 paulista',
    topColor: 'linear-gradient(160deg,#16a34a 0%,#064e1e 100%)',
    avatarGrad: 'linear-gradient(135deg,#16a34a,#4ade80)',
    glow: 'rgba(34,197,94,0.35)',
    stats: [
      { label: 'Finalização', val: 94 },
      { label: 'Velocidade',  val: 91 },
      { label: 'Drible',      val: 88 },
    ],
  },
  {
    initials: 'YC',
    name: 'Yasmin Costa',
    age: 16,
    position: 'MEI',
    positionFull: 'Meia',
    city: 'Recife',
    state: 'PE',
    score: 88,
    badge: 'MAIS VISTA DA SEMANA',
    badgeColor: '#a78bfa',
    trend: '+11',
    highlight: '3 scouts acompanhando perfil',
    topColor: 'linear-gradient(160deg,#4c1d95 0%,#1e1035 100%)',
    avatarGrad: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    glow: 'rgba(139,92,246,0.35)',
    stats: [
      { label: 'Passe',       val: 91 },
      { label: 'Visão de jogo', val: 89 },
      { label: 'Liderança',   val: 86 },
    ],
  },
  {
    initials: 'BA',
    name: 'Bruno Alves',
    age: 18,
    position: 'GOL',
    positionFull: 'Goleiro',
    city: 'Porto Alegre',
    state: 'RS',
    score: 86,
    badge: 'GOLEIRO REVELAÇÃO',
    badgeColor: '#38bdf8',
    trend: '+9',
    highlight: '89% de aproveitamento no mês',
    topColor: 'linear-gradient(160deg,#0c4a6e 0%,#0a1a2e 100%)',
    avatarGrad: 'linear-gradient(135deg,#0284c7,#38bdf8)',
    glow: 'rgba(56,189,248,0.30)',
    stats: [
      { label: 'Reflexo',     val: 92 },
      { label: 'Posicionam.', val: 88 },
      { label: 'Saída de Bola', val: 83 },
    ],
  },
  {
    initials: 'TM',
    name: 'Thiago Mendes',
    age: 17,
    position: 'ZAG',
    positionFull: 'Zagueiro',
    city: 'Belo Horizonte',
    state: 'MG',
    score: 85,
    badge: 'EM ASCENSÃO',
    badgeColor: '#fb923c',
    trend: '+14',
    highlight: 'Capitão do Sub-17 mineiro',
    topColor: 'linear-gradient(160deg,#7c2d12 0%,#1c0a04 100%)',
    avatarGrad: 'linear-gradient(135deg,#ea580c,#fb923c)',
    glow: 'rgba(251,146,60,0.30)',
    stats: [
      { label: 'Marcação',  val: 90 },
      { label: 'Físico',    val: 88 },
      { label: 'Cabeceio',  val: 85 },
    ],
  },
]

export default function ProspectsSection() {
  return (
    <section style={{ padding:'80px 0 72px', background:'#06100a', overflow:'hidden' }}>
      <style>{`
        .prospect-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: default;
        }
        .prospect-card:hover {
          transform: translateY(-8px) scale(1.015);
        }
        .prospects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 40px;
        }
        @media (max-width: 1024px) {
          .prospects-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .prospects-grid { grid-template-columns: 1fr !important; padding: 0 20px !important; }
          .prospects-title { font-size: 26px !important; }
        }
      `}</style>

      {/* Título */}
      <div style={{ textAlign:'center', marginBottom:'52px', padding:'0 24px' }}>
        <p style={{
          fontSize:'11px', fontWeight:700, letterSpacing:'0.12em',
          color:'#22c55e', textTransform:'uppercase', marginBottom:'10px',
        }}>
          🔥 Perfis em evidência
        </p>
        <h2 className="prospects-title" style={{
          fontSize:'34px', fontWeight:900, letterSpacing:'-0.03em',
          color:'white', lineHeight:1.1, margin:'0 auto',
        }}>
          Promessas em destaque
        </h2>
        <p style={{
          marginTop:'10px', fontSize:'15px',
          color:'rgba(255,255,255,0.40)', maxWidth:'400px', margin:'10px auto 0',
        }}>
          Atletas reais. Perfis verificados. Vistos por scouts agora.
        </p>
      </div>

      {/* Grid de cards */}
      <div className="prospects-grid">
        {prospects.map((p) => (
          <div
            key={p.name}
            className="prospect-card"
            style={{
              borderRadius:'24px',
              overflow:'hidden',
              background:'#0b1610',
              border:'1px solid rgba(255,255,255,0.07)',
              boxShadow:`0 0 40px ${p.glow}, 0 16px 40px rgba(0,0,0,0.5)`,
              position:'relative',
            }}
          >
            {/* TOP — área visual */}
            <div style={{
              background: p.topColor,
              padding:'28px 20px 0',
              position:'relative',
              minHeight:'160px',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
            }}>
              {/* Badge no topo */}
              <div style={{
                position:'absolute', top:'14px', left:'50%', transform:'translateX(-50%)',
                background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)',
                border:`1px solid ${p.badgeColor}44`,
                borderRadius:'20px', padding:'3px 10px',
                fontSize:'8px', fontWeight:800, letterSpacing:'0.1em',
                color: p.badgeColor, whiteSpace:'nowrap',
              }}>
                {p.badge}
              </div>

              {/* Score + Position */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', marginTop:'32px', marginBottom:'16px' }}>
                <span style={{
                  fontSize:'64px', fontWeight:900, lineHeight:1,
                  color:'white', letterSpacing:'-0.04em',
                  textShadow:'0 4px 20px rgba(0,0,0,0.5)',
                }}>
                  {p.score}
                </span>
                <span style={{
                  fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.5)',
                  marginBottom:'10px', letterSpacing:'0.08em',
                }}>
                  {p.position}
                </span>
              </div>
            </div>

            {/* Avatar — fica na divisão entre top e bottom */}
            <div style={{ display:'flex', justifyContent:'center', marginTop:'-36px', position:'relative', zIndex:2 }}>
              <div style={{
                width:'72px', height:'72px', borderRadius:'50%',
                background: p.avatarGrad,
                border:'3px solid #0b1610',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'22px', fontWeight:900, color:'white',
                boxShadow:`0 8px 24px ${p.glow}`,
              }}>
                {p.initials}
              </div>
            </div>

            {/* BOTTOM — dados */}
            <div style={{ padding:'12px 20px 22px' }}>
              {/* Nome + Trend */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                <p style={{ margin:0, fontSize:'15px', fontWeight:800, color:'white' }}>{p.name}</p>
                <div style={{
                  display:'flex', alignItems:'center', gap:'3px',
                  background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)',
                  borderRadius:'20px', padding:'2px 8px',
                }}>
                  <span style={{ fontSize:'10px', color:'#22c55e' }}>↑</span>
                  <span style={{ fontSize:'10px', fontWeight:800, color:'#22c55e' }}>{p.trend}</span>
                </div>
              </div>

              {/* Posição + Cidade */}
              <p style={{ margin:'0 0 12px', fontSize:'11px', color:'rgba(255,255,255,0.38)' }}>
                {p.positionFull} · {p.city}, {p.state} · {p.age} anos
              </p>

              {/* Highlight */}
              <div style={{
                background:'rgba(255,255,255,0.04)',
                borderRadius:'8px', padding:'8px 10px',
                marginBottom:'14px',
                borderLeft:`2px solid ${p.badgeColor}88`,
              }}>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.55)', lineHeight:1.4 }}>
                  {p.highlight}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                {p.stats.map((s) => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.30)', width:'78px', flexShrink:0 }}>{s.label}</span>
                    <div style={{ flex:1, height:'3px', background:'rgba(255,255,255,0.07)', borderRadius:'2px' }}>
                      <div style={{ width:`${s.val}%`, height:'100%', background: p.avatarGrad, borderRadius:'2px' }} />
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:700, color:'white', minWidth:'22px', textAlign:'right' }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign:'center', marginTop:'44px' }}>
        <a href="/cadastro" style={{
          display:'inline-flex', alignItems:'center', gap:'8px',
          color:'#22c55e', fontSize:'14px', fontWeight:700,
          textDecoration:'none', borderBottom:'1px solid rgba(34,197,94,0.3)',
          paddingBottom:'2px',
        }}>
          Criar meu perfil e entrar no ranking →
        </a>
      </div>
    </section>
  )
}

// Server Component — sem 'use client'

type Activity =
  | { type: 'ranking';  name: string; pos: string; city: string; trend: string; score: number }
  | { type: 'scout';    name: string; city: string }
  | { type: 'city';     city: string; count: number }
  | { type: 'verified'; name: string; pos: string; city: string }

const activities: Activity[] = [
  { type: 'ranking',  name: 'João Silva',       pos: 'Meia-Atacante',   city: 'Rio de Janeiro',  trend: '+12', score: 83 },
  { type: 'scout',    name: 'Arthur Neves',      city: 'Santos' },
  { type: 'city',     city: 'São Paulo',         count: 34 },
  { type: 'ranking',  name: 'Rafael Torres',     pos: 'Atacante',        city: 'Belo Horizonte',  trend: '+8',  score: 79 },
  { type: 'verified', name: 'Lucas Mendes',      pos: 'Goleiro',         city: 'Porto Alegre' },
  { type: 'ranking',  name: 'Matheus Lima',      pos: 'Zagueiro',        city: 'Recife',           trend: '+5',  score: 81 },
  { type: 'scout',    name: 'Bernardo Costa',    city: 'Curitiba' },
  { type: 'ranking',  name: 'Guilherme Rocha',   pos: 'Lateral Direito', city: 'Campinas',         trend: '+3',  score: 77 },
  { type: 'city',     city: 'Fortaleza',         count: 19 },
  { type: 'ranking',  name: 'Diego Fernandes',   pos: 'Volante',         city: 'Manaus',           trend: '+7',  score: 80 },
  { type: 'verified', name: 'Carlos Eduardo',    pos: 'Ponta Direita',   city: 'Salvador' },
  { type: 'ranking',  name: 'Anderson Silva',    pos: 'Atacante',        city: 'Natal',            trend: '+15', score: 76 },
  { type: 'city',     city: 'Curitiba',          count: 22 },
  { type: 'ranking',  name: 'Enzo Carvalho',     pos: 'Meia',            city: 'Florianópolis',    trend: '+6',  score: 78 },
  { type: 'scout',    name: 'Pedro Albuquerque', city: 'Belém' },
  { type: 'ranking',  name: 'Kaique Moura',      pos: 'Atacante',        city: 'Goiânia',          trend: '+9',  score: 75 },
]

function RankingPill(a: Extract<Activity, { type: 'ranking' }>) {
  const initials = a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 28px', flexShrink:0 }}>
      {/* Avatar */}
      <div style={{
        position:'relative',
        width:'34px', height:'34px', borderRadius:'50%',
        background:'linear-gradient(135deg,#065f28,#00e87a)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'11px', fontWeight:900, color:'white', flexShrink:0,
        border:'1.5px solid rgba(0,255,136,0.28)',
        boxShadow:'0 0 12px rgba(0,255,136,0.20)',
      }}>
        {initials}
        {/* Online pulse dot */}
        <div style={{
          position:'absolute', bottom:'-1px', right:'-1px',
          width:'9px', height:'9px', borderRadius:'50%',
          background:'#00FF88',
          border:'1.5px solid #060d08',
          boxShadow:'0 0 6px rgba(0,255,136,0.8)',
        }} />
      </div>

      {/* Text */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
        <span style={{ fontSize:'13px', fontWeight:800, color:'white', letterSpacing:'0.01em', lineHeight:1.2 }}>
          {a.name}
        </span>
        <span style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.38)', letterSpacing:'0.02em' }}>
          {a.pos} <span style={{ color:'rgba(255,255,255,0.20)', margin:'0 3px' }}>·</span> {a.city}
        </span>
      </div>

      {/* Trend badge */}
      <div style={{
        display:'flex', alignItems:'center', gap:'3px', flexShrink:0,
        background:'rgba(0,255,136,0.10)',
        border:'1px solid rgba(0,255,136,0.30)',
        borderRadius:'20px', padding:'3px 9px',
        boxShadow:'0 0 8px rgba(0,255,136,0.10)',
      }}>
        <span style={{ fontSize:'10px', color:'#00FF88', lineHeight:1 }}>↑</span>
        <span style={{ fontSize:'11px', fontWeight:800, color:'#00FF88', letterSpacing:'0.02em' }}>{a.trend}</span>
      </div>
    </div>
  )
}

function ScoutPill(a: Extract<Activity, { type: 'scout' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 28px', flexShrink:0 }}>
      {/* Label */}
      <div style={{
        padding:'2px 8px', borderRadius:'6px',
        background:'rgba(139,92,246,0.12)',
        border:'1px solid rgba(139,92,246,0.28)',
      }}>
        <span style={{ fontSize:'8.5px', fontWeight:800, letterSpacing:'0.12em', color:'rgba(167,139,250,0.9)' }}>SCOUT</span>
      </div>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', letterSpacing:'0.01em' }}>
        visualizou perfil de{' '}
        <strong style={{ color:'rgba(255,255,255,0.80)', fontWeight:700 }}>{a.name}</strong>
        <span style={{ color:'rgba(255,255,255,0.22)', margin:'0 5px' }}>·</span>
        <span style={{ color:'rgba(255,255,255,0.35)' }}>{a.city}</span>
      </span>
    </div>
  )
}

function CityPill(a: Extract<Activity, { type: 'city' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 28px', flexShrink:0 }}>
      {/* Green dot */}
      <div style={{
        width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
        background:'#00FF88',
        boxShadow:'0 0 8px rgba(0,255,136,0.7)',
      }} />
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', letterSpacing:'0.01em' }}>
        <strong style={{ fontSize:'14px', fontWeight:800, color:'#00FF88', letterSpacing:'-0.01em' }}>{a.count}</strong>
        {' '}atletas ativos em{' '}
        <span style={{ color:'rgba(255,255,255,0.60)', fontWeight:600 }}>{a.city}</span>
      </span>
    </div>
  )
}

function VerifiedPill(a: Extract<Activity, { type: 'verified' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 28px', flexShrink:0 }}>
      {/* Check badge */}
      <div style={{
        width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
        background:'rgba(34,197,94,0.15)',
        border:'1.5px solid rgba(34,197,94,0.40)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'9px', color:'#22c55e', fontWeight:900,
      }}>✓</div>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.40)', letterSpacing:'0.01em' }}>
        <strong style={{ color:'rgba(255,255,255,0.78)', fontWeight:700 }}>{a.name}</strong>
        <span style={{ color:'rgba(255,255,255,0.20)', margin:'0 5px' }}>·</span>
        <span style={{ color:'rgba(255,255,255,0.38)' }}>{a.pos}</span>
        <span style={{ color:'rgba(255,255,255,0.20)', margin:'0 5px' }}>·</span>
        <span style={{ color:'rgba(255,255,255,0.30)' }}>{a.city}</span>
        <span style={{ marginLeft:'8px', fontSize:'10.5px', fontWeight:700, color:'rgba(34,197,94,0.7)' }}>verificado</span>
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      width:'1px', height:'18px',
      background:'linear-gradient(to bottom, transparent, rgba(0,255,136,0.18), transparent)',
      flexShrink:0, alignSelf:'center',
    }} />
  )
}

function renderActivity(a: Activity, i: number) {
  const pill = (() => {
    if (a.type === 'ranking')  return <RankingPill  key={i} {...a} />
    if (a.type === 'scout')    return <ScoutPill    key={i} {...a} />
    if (a.type === 'city')     return <CityPill     key={i} {...a} />
    if (a.type === 'verified') return <VerifiedPill key={i} {...a} />
  })()
  return (
    <>
      {pill}
      <Divider />
    </>
  )
}

export default function ActivityTicker() {
  return (
    <div style={{
      position:'relative',
      background:'linear-gradient(180deg, rgba(3,9,5,0.92) 0%, #060d08 100%)',
      borderTop:'1px solid rgba(0,255,136,0.12)',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
      boxShadow:'0 -1px 0 rgba(0,255,136,0.06) inset, 0 8px 32px rgba(0,0,0,0.35)',
      overflow:'hidden',
    }}>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: ticker 70s linear infinite;
          padding: 16px 0;
        }
        .ticker-track:hover { animation-play-state: paused; }

        /* Fade edges — wider, with subtle green cast */
        .ticker-wrap::before,
        .ticker-wrap::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 110px;
          z-index: 2;
          pointer-events: none;
        }
        .ticker-wrap::before {
          left: 0;
          background: linear-gradient(to right, #060d08 30%, rgba(6,13,8,0.85) 70%, transparent);
        }
        .ticker-wrap::after {
          right: 0;
          background: linear-gradient(to left, #060d08 30%, rgba(6,13,8,0.85) 70%, transparent);
        }
      `}</style>

      {/* AO VIVO indicator — fixed left, não scroll */}
      <div style={{
        position:'absolute', left:0, top:0, bottom:0,
        display:'flex', alignItems:'center',
        padding:'0 0 0 20px',
        zIndex:3, pointerEvents:'none',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'6px',
          background:'rgba(6,13,8,0.95)',
          padding:'5px 11px', borderRadius:'8px',
          border:'1px solid rgba(0,255,136,0.18)',
          backdropFilter:'blur(8px)',
          boxShadow:'0 0 16px rgba(0,255,136,0.10)',
        }}>
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#00FF88',
            boxShadow:'0 0 6px rgba(0,255,136,0.9)',
            animation:'none',
          }} />
          <span style={{
            fontSize:'8.5px', fontWeight:800, letterSpacing:'0.18em',
            color:'rgba(0,255,136,0.85)', textTransform:'uppercase',
          }}>Ao vivo</span>
        </div>
      </div>

      <div className="ticker-wrap" style={{ position:'relative', overflow:'hidden', paddingLeft:'90px' }}>
        <div className="ticker-track">
          {activities.map((a, i) => renderActivity(a, i))}
          {activities.map((a, i) => renderActivity(a, i + activities.length))}
        </div>
      </div>
    </div>
  )
}

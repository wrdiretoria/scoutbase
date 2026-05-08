// Server Component — sem 'use client'

type Activity =
  | { type: 'ranking'; name: string; pos: string; city: string; trend: string; score: number }
  | { type: 'scout';   name: string; city: string }
  | { type: 'city';    city: string; count: number }
  | { type: 'verified'; name: string; pos: string; city: string }

const activities: Activity[] = [
  { type: 'ranking',  name: 'João Silva',       pos: 'Meia-Atacante',  city: 'Rio de Janeiro',   trend: '+12', score: 83 },
  { type: 'scout',    name: 'Arthur Neves',      city: 'Santos' },
  { type: 'city',     city: 'São Paulo',         count: 34 },
  { type: 'ranking',  name: 'Rafael Torres',     pos: 'Atacante',       city: 'Belo Horizonte',   trend: '+8',  score: 79 },
  { type: 'verified', name: 'Lucas Mendes',      pos: 'Goleiro',        city: 'Porto Alegre' },
  { type: 'ranking',  name: 'Matheus Lima',      pos: 'Zagueiro',       city: 'Recife',            trend: '+5',  score: 81 },
  { type: 'scout',    name: 'Bernardo Costa',    city: 'Curitiba' },
  { type: 'ranking',  name: 'Guilherme Rocha',   pos: 'Lateral Direito',city: 'Campinas',          trend: '+3',  score: 77 },
  { type: 'city',     city: 'Fortaleza',         count: 19 },
  { type: 'ranking',  name: 'Diego Fernandes',   pos: 'Volante',        city: 'Manaus',            trend: '+7',  score: 80 },
  { type: 'verified', name: 'Carlos Eduardo',    pos: 'Ponta Direita',  city: 'Salvador' },
  { type: 'ranking',  name: 'Anderson Silva',    pos: 'Atacante',       city: 'Natal',             trend: '+15', score: 76 },
  { type: 'city',     city: 'Curitiba',          count: 22 },
  { type: 'ranking',  name: 'Enzo Carvalho',     pos: 'Meia',           city: 'Florianópolis',     trend: '+6',  score: 78 },
  { type: 'scout',    name: 'Pedro Albuquerque', city: 'Belém' },
  { type: 'ranking',  name: 'Kaique Moura',      pos: 'Atacante',       city: 'Goiânia',           trend: '+9',  score: 75 },
]

function RankingPill(a: Extract<Activity, { type: 'ranking' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 28px', flexShrink:0 }}>
      {/* Avatar */}
      <div style={{
        width:'30px', height:'30px', borderRadius:'50%',
        background:'linear-gradient(135deg,#16a34a,#4ade80)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'10px', fontWeight:900, color:'white', flexShrink:0,
      }}>
        {a.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div>
        <span style={{ fontSize:'13px', fontWeight:700, color:'white' }}>{a.name}</span>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.38)', margin:'0 6px' }}>·</span>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>{a.pos}</span>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', margin:'0 6px' }}>·</span>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{a.city}</span>
      </div>
      <div style={{
        display:'flex', alignItems:'center', gap:'4px',
        background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)',
        borderRadius:'20px', padding:'2px 8px', flexShrink:0,
      }}>
        <span style={{ fontSize:'11px', color:'#22c55e' }}>↑</span>
        <span style={{ fontSize:'11px', fontWeight:800, color:'#22c55e' }}>{a.trend}</span>
      </div>
    </div>
  )
}

function ScoutPill(a: Extract<Activity, { type: 'scout' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 28px', flexShrink:0 }}>
      <span style={{ fontSize:'13px' }}>🔍</span>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>
        Scout verificou perfil de{' '}
        <strong style={{ color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{a.name}</strong>
        {' '}— {a.city}
      </span>
    </div>
  )
}

function CityPill(a: Extract<Activity, { type: 'city' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 28px', flexShrink:0 }}>
      <span style={{ fontSize:'13px' }}>📍</span>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>
        <strong style={{ color:'#22c55e', fontWeight:700 }}>{a.count}</strong>
        {' '}atletas ativos em {a.city} agora
      </span>
    </div>
  )
}

function VerifiedPill(a: Extract<Activity, { type: 'verified' }>) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'0 28px', flexShrink:0 }}>
      <span style={{ fontSize:'13px' }}>✅</span>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>
        <strong style={{ color:'rgba(255,255,255,0.72)', fontWeight:700 }}>{a.name}</strong>
        {' '}· {a.pos} · {a.city} — perfil verificado
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      width:'1px', height:'16px', background:'rgba(255,255,255,0.10)',
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
      background:'linear-gradient(180deg,rgba(6,16,10,0.0) 0%,#060f0a 18%)',
      borderBottom:'1px solid rgba(34,197,94,0.10)',
      overflow:'hidden',
      position:'relative',
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
          animation: ticker 55s linear infinite;
          padding: 14px 0;
        }
        .ticker-track:hover { animation-play-state: paused; }

        /* fade edges */
        .ticker-wrap::before,
        .ticker-wrap::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }
        .ticker-wrap::before { left: 0;  background: linear-gradient(to right, #060f0a, transparent); }
        .ticker-wrap::after  { right: 0; background: linear-gradient(to left,  #060f0a, transparent); }
      `}</style>

      <div className="ticker-wrap" style={{ position:'relative', overflow:'hidden' }}>
        <div className="ticker-track">
          {/* Render twice for seamless loop */}
          {activities.map((a, i) => renderActivity(a, i))}
          {activities.map((a, i) => renderActivity(a, i + activities.length))}
        </div>
      </div>
    </div>
  )
}

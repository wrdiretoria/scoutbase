'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type JoinItem      = { type: 'join';      name: string; role: 'Atleta' | 'Treinador'; ts: string }
type AvaliacaoItem = { type: 'avaliacao'; atletaNome: string; treinadorNome: string; ovr: number; ts: string }
type ActivityItem  = JoinItem | AvaliacaoItem

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

// ── Pills ──────────────────────────────────────────────────────────────────────

function JoinPill({ name, role }: JoinItem) {
  const isTrainer = role === 'Treinador'
  const color  = isTrainer ? '#fbbf24' : '#00FF88'
  const border = isTrainer ? 'rgba(251,191,36,0.30)' : 'rgba(0,255,136,0.28)'
  const bg     = isTrainer
    ? 'linear-gradient(135deg,#78350f,#d97706)'
    : 'linear-gradient(135deg,#065f28,#00e87a)'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 28px', flexShrink:0 }}>
      <div style={{
        position:'relative', width:'34px', height:'34px', borderRadius:'50%',
        background:bg, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'11px', fontWeight:900, color:'white', flexShrink:0,
        border:`1.5px solid ${border}`, boxShadow:`0 0 12px ${color}33`,
      }}>
        {initials(name)}
        <div style={{
          position:'absolute', bottom:'-1px', right:'-1px',
          width:'9px', height:'9px', borderRadius:'50%',
          background:color, border:'1.5px solid #060d08', boxShadow:`0 0 6px ${color}cc`,
        }} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
        <span style={{ fontSize:'13px', fontWeight:800, color:'white', lineHeight:1.2 }}>{name}</span>
        <span style={{ fontSize:'10.5px', color, fontWeight:700, letterSpacing:'0.04em' }}>
          entrou como {role} ✦
        </span>
      </div>
    </div>
  )
}

function AvaliacaoPill({ atletaNome, treinadorNome, ovr }: AvaliacaoItem) {
  const cor = ovrColor(ovr)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 28px', flexShrink:0 }}>
      <div style={{
        width:'34px', height:'34px', borderRadius:'50%',
        background:'linear-gradient(135deg,#065f28,#00e87a)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'11px', fontWeight:900, color:'white', flexShrink:0,
        border:'1.5px solid rgba(0,255,136,0.28)', boxShadow:'0 0 12px rgba(0,255,136,0.20)',
      }}>
        {initials(atletaNome)}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
        <span style={{ fontSize:'13px', fontWeight:800, color:'white', lineHeight:1.2 }}>
          {atletaNome}
        </span>
        <span style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.40)', letterSpacing:'0.01em' }}>
          avaliado por <span style={{ color:'rgba(255,255,255,0.65)', fontWeight:700 }}>{treinadorNome}</span>
        </span>
      </div>
      <div style={{
        display:'flex', alignItems:'center', gap:'3px', flexShrink:0,
        background:`rgba(${ovr >= 80 ? '0,255,136' : ovr >= 65 ? '251,191,36' : '249,115,22'},0.10)`,
        border:`1px solid ${cor}40`, borderRadius:'20px', padding:'3px 9px',
      }}>
        <span style={{ fontSize:'9px', color:cor, fontWeight:700, letterSpacing:'0.06em' }}>OVR</span>
        <span style={{ fontSize:'12px', fontWeight:900, color:cor }}>{ovr}</span>
      </div>
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

function renderItem(a: ActivityItem, i: number) {
  const pill = a.type === 'join'
    ? <JoinPill      key={i} {...a} />
    : <AvaliacaoPill key={i} {...a} />
  return <>{pill}<Divider /></>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivityTicker() {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/landing/activity', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as { items: ActivityItem[] }
        if (json.items.length > 0) {
          setItems(json.items)
        }
      } catch { /* fica vazio */ }
    }

    fetchActivity()
    const interval = setInterval(fetchActivity, 30_000) // atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  // Sem dados reais → não renderiza o ticker
  if (items.length === 0) return null

  const display = items

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
          display: flex; align-items: center;
          width: max-content;
          animation: ticker 70s linear infinite;
          padding: 16px 0;
        }
        .ticker-track:hover { animation-play-state: paused; }
        .ticker-wrap::before, .ticker-wrap::after {
          content: ''; position: absolute; top: 0; bottom: 0;
          width: 110px; z-index: 2; pointer-events: none;
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

      {/* AO VIVO */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, display:'flex', alignItems:'center', padding:'0 0 0 20px', zIndex:3, pointerEvents:'none' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'6px',
          background:'rgba(6,13,8,0.95)', padding:'5px 11px', borderRadius:'8px',
          border:'1px solid rgba(0,255,136,0.18)', boxShadow:'0 0 16px rgba(0,255,136,0.10)',
        }}>
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#00FF88', boxShadow:'0 0 6px rgba(0,255,136,0.9)',
            animation:'pulseDot 1.8s ease-in-out infinite',
          }} />
          <span style={{ fontSize:'8.5px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.85)', textTransform:'uppercase' }}>
            Ao vivo
          </span>
        </div>
      </div>

      <div className="ticker-wrap" style={{ position:'relative', overflow:'hidden', paddingLeft:'90px' }}>
        <div className="ticker-track">
          {display.map((a, i) => renderItem(a, i))}
          {display.map((a, i) => renderItem(a, i + display.length))}
        </div>
      </div>
    </div>
  )
}

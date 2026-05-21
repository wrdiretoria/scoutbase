'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ReelAtleta = {
  id:      string
  nome:    string
  posicao: string
  cidade:  string
  ovr:     number | null
  tipo:    'avaliado' | 'novo'
  ts:      string
}

// ── Fallback ───────────────────────────────────────────────────────────────────

const FALLBACK: ReelAtleta[] = [
  { id:'f1', nome:'Kauã Ferreira',  posicao:'Atacante',     cidade:'Recife, PE',          ovr:91, tipo:'avaliado', ts:'' },
  { id:'f2', nome:'Lucas Silva',    posicao:'Meia',          cidade:'Belo Horizonte, MG',  ovr:89, tipo:'avaliado', ts:'' },
  { id:'f3', nome:'Gabriel Rocha',  posicao:'Ponta Direita', cidade:'Salvador, BA',        ovr:79, tipo:'avaliado', ts:'' },
  { id:'f4', nome:'João Mendes',    posicao:'Atacante',      cidade:'São Paulo, SP',       ovr:85, tipo:'avaliado', ts:'' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string) {
  const map: Record<string, string> = {
    'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE','Lateral':'LAT',
    'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
    'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function timeAgo(ts: string) {
  if (!ts) return 'agora'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2)  return 'agora'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

// ── Paleta por posição ─────────────────────────────────────────────────────────

type Palette = { bg: string; light: string }

function getPalette(pos: string): Palette {
  const p = pos.toLowerCase()
  if (p.includes('atacante') || p.includes('avante'))
    return {
      bg:    'linear-gradient(170deg,#060f06 0%,#0b1f0b 45%,#071408 100%)',
      light: 'radial-gradient(ellipse at 40% 14%, rgba(0,230,80,0.22) 0%, rgba(0,160,50,0.07) 44%, transparent 68%)',
    }
  if (p.includes('meia'))
    return {
      bg:    'linear-gradient(170deg,#06081a 0%,#0a0f2e 45%,#070a1f 100%)',
      light: 'radial-gradient(ellipse at 60% 16%, rgba(90,120,255,0.22) 0%, rgba(60,90,200,0.07) 44%, transparent 68%)',
    }
  if (p.includes('goleiro'))
    return {
      bg:    'linear-gradient(170deg,#08061a 0%,#10092e 45%,#09061f 100%)',
      light: 'radial-gradient(ellipse at 50% 14%, rgba(160,100,255,0.22) 0%, rgba(120,70,200,0.07) 44%, transparent 68%)',
    }
  if (p.includes('zagueiro'))
    return {
      bg:    'linear-gradient(170deg,#0a0614 0%,#14082a 45%,#0c0618 100%)',
      light: 'radial-gradient(ellipse at 48% 16%, rgba(180,90,255,0.20) 0%, rgba(130,60,200,0.06) 44%, transparent 68%)',
    }
  if (p.includes('ponta'))
    return {
      bg:    'linear-gradient(170deg,#120a00 0%,#201500 45%,#160e00 100%)',
      light: 'radial-gradient(ellipse at 52% 14%, rgba(255,185,0,0.24) 0%, rgba(200,130,0,0.07) 44%, transparent 68%)',
    }
  if (p.includes('lateral'))
    return {
      bg:    'linear-gradient(170deg,#060e14 0%,#0c1824 45%,#070e14 100%)',
      light: 'radial-gradient(ellipse at 44% 16%, rgba(56,189,248,0.20) 0%, rgba(30,140,200,0.06) 44%, transparent 68%)',
    }
  // Volante / default
  return {
    bg:    'linear-gradient(170deg,#0a0a0e 0%,#141418 45%,#0a0a0e 100%)',
    light: 'radial-gradient(ellipse at 50% 14%, rgba(150,160,180,0.14) 0%, transparent 56%)',
  }
}

// ── Tag dinâmica ───────────────────────────────────────────────────────────────

type Tag = { label: string; color: string; bg: string; border: string }

function getTag(tipo: 'avaliado' | 'novo', ovr: number | null): Tag {
  if (tipo === 'novo')
    return { label:'🔥 Entrou agora',  color:'#ff6b35', bg:'rgba(255,107,53,0.14)', border:'rgba(255,107,53,0.30)' }
  if (ovr !== null && ovr >= 85)
    return { label:'⭐ Destaque',       color:'#fbbf24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.28)' }
  if (ovr !== null && ovr >= 75)
    return { label:'🎯 Avaliado',       color:'#00FF88', bg:'rgba(0,255,136,0.10)', border:'rgba(0,255,136,0.22)' }
  return   { label:'📊 Avaliado',       color:'rgba(255,255,255,0.62)', bg:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.15)' }
}

// ── Card ───────────────────────────────────────────────────────────────────────

function ReelCard({ atleta }: { atleta: ReelAtleta }) {
  const palette = getPalette(atleta.posicao)
  const tag     = getTag(atleta.tipo, atleta.ovr)
  const time    = timeAgo(atleta.ts)
  const pos     = posAbrev(atleta.posicao)
  const city    = atleta.cidade.split(',')[0]

  return (
    <div className="lances-card">

      {/* Gradient bg */}
      <div style={{ position:'absolute', inset:0, background:palette.bg }} />

      {/* Stadium atmospheric light */}
      <div style={{ position:'absolute', inset:0, background:palette.light }} />

      {/* Giant initials — background texture */}
      <div style={{
        position:'absolute', inset:0, zIndex:1,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'none', userSelect:'none',
        overflow:'hidden',
      }}>
        <span style={{
          fontSize:'clamp(90px,24vw,140px)', fontWeight:900,
          color:'rgba(255,255,255,0.035)',
          letterSpacing:'-0.04em', lineHeight:1,
          WebkitFontSmoothing:'antialiased',
        }}>
          {initials(atleta.nome)}
        </span>
      </div>

      {/* Film grain */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, opacity:0.07,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:'cover',
      }} />

      {/* Bottom cinematic gradient */}
      <div style={{ position:'absolute', inset:0, zIndex:1, background:'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.60) 30%, rgba(0,0,0,0.10) 58%, transparent 100%)' }} />

      {/* ── Top: tag + tempo ── */}
      <div style={{ position:'absolute', top:'14px', left:'14px', right:'14px', zIndex:3, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{
          background:tag.bg, border:`1px solid ${tag.border}`,
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderRadius:'100px', padding:'5px 12px',
          fontSize:'10px', fontWeight:700, color:tag.color,
          letterSpacing:'0.01em', lineHeight:1.3, flexShrink:1, minWidth:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {tag.label}
        </div>
        <div style={{
          background:'rgba(0,0,0,0.55)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderRadius:'100px', padding:'5px 10px',
          fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.55)',
          letterSpacing:'0.04em', flexShrink:0, marginLeft:'8px',
        }}>
          {time}
        </div>
      </div>

      {/* ── Play button ── */}
      <div className="lances-play" aria-hidden>
        <div style={{
          width:0, height:0,
          borderTop:'10px solid transparent',
          borderBottom:'10px solid transparent',
          borderLeft:'17px solid rgba(255,255,255,0.85)',
          marginLeft:'4px',
        }} />
      </div>

      {/* ── Bottom info ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'18px', zIndex:3 }}>

        {/* OVR ou NOVO badge */}
        <div style={{ marginBottom:'10px' }}>
          {atleta.ovr != null ? (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'5px',
              background:`rgba(${atleta.ovr >= 80 ? '0,255,136' : atleta.ovr >= 65 ? '251,191,36' : '249,115,22'},0.10)`,
              border:`1px solid ${ovrColor(atleta.ovr)}40`,
              borderRadius:'20px', padding:'3px 10px',
            }}>
              <span style={{ fontSize:'9px', fontWeight:700, color:ovrColor(atleta.ovr), letterSpacing:'0.06em' }}>OVR</span>
              <span style={{ fontSize:'15px', fontWeight:900, color:ovrColor(atleta.ovr), lineHeight:1 }}>{atleta.ovr}</span>
            </div>
          ) : (
            <div style={{
              display:'inline-flex', alignItems:'center',
              background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.16)',
              borderRadius:'20px', padding:'3px 10px',
            }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(0,255,136,0.65)', letterSpacing:'0.04em' }}>NOVO</span>
            </div>
          )}
        </div>

        {/* Nome */}
        <div style={{
          fontSize:'16px', fontWeight:900, color:'white',
          letterSpacing:'-0.02em', lineHeight:1.15, marginBottom:'4px',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {atleta.nome}
        </div>

        {/* Posição · Cidade */}
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.38)', fontWeight:500 }}>
          {pos}&nbsp;·&nbsp;{city}
        </div>
      </div>

    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────

export default function LancesSection() {
  const [atletas,   setAtletas]   = useState<ReelAtleta[]>(FALLBACK)
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/landing/atletas', { cache:'no-store' })
        if (!res.ok) return
        const json = await res.json() as { items: ReelAtleta[] }
        if (json.items.length > 0) {
          setAtletas(json.items.slice(0, 8))
          setLiveCount(json.items.length)
        }
      } catch { /* keep fallback */ }
    }
    load()
    const iv = setInterval(load, 30_000)
    return () => clearInterval(iv)
  }, [])

  // Garante mínimo de 4 cards (completa com fallback se precisar)
  const display = atletas.length >= 4
    ? atletas.slice(0, 4)
    : [...atletas, ...FALLBACK].slice(0, 4)

  return (
    <section style={{ background:'#020604', padding:'80px 0 88px', overflow:'hidden' }}>
      <style>{`
        @keyframes lancesPlay {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.78 }
          50%      { transform:translate(-50%,-50%) scale(1.08); opacity:1   }
        }
        .lances-track {
          display:flex; gap:14px;
          padding:0 clamp(24px,5vw,80px) 6px;
          overflow-x:auto; scroll-snap-type:x mandatory;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none; -ms-overflow-style:none;
        }
        .lances-track::-webkit-scrollbar { display:none; }
        .lances-card {
          flex:0 0 min(272px,72vw); scroll-snap-align:start;
          border-radius:18px; overflow:hidden; position:relative;
          cursor:pointer; aspect-ratio:9/16; min-height:390px;
          transition:transform .28s cubic-bezier(.22,1,.36,1);
        }
        .lances-card:hover { transform:scale(1.018); }
        .lances-play {
          position:absolute; top:50%; left:50%;
          width:54px; height:54px; border-radius:50%;
          background:rgba(255,255,255,0.10);
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          border:1.5px solid rgba(255,255,255,0.20);
          display:flex; align-items:center; justify-content:center;
          animation:lancesPlay 3.8s ease-in-out infinite;
          z-index:2;
        }
        @media (min-width:768px) {
          .lances-track {
            display:grid; grid-template-columns:repeat(4,1fr); gap:18px;
            overflow-x:visible; max-width:1280px; margin:0 auto;
            padding:0 clamp(24px,6vw,80px);
          }
          .lances-card { flex:none; width:auto; min-height:460px; }
        }
        @media (max-width:480px) {
          .lances-card { min-height:360px; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'flex-end', justifyContent:'space-between',
        padding:'0 clamp(24px,5vw,80px)', marginBottom:'36px',
        maxWidth:'1280px', margin:'0 auto 36px',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
            <span style={{
              display:'inline-block', width:'5px', height:'5px', borderRadius:'50%',
              background:'#00FF88', flexShrink:0,
              boxShadow:'0 0 6px rgba(0,255,136,0.8)',
              animation:'pulseDot 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize:'9.5px', fontWeight:700, color:'rgba(0,255,136,0.50)', letterSpacing:'0.24em', textTransform:'uppercase' }}>
              {liveCount > 0 ? `${liveCount} atletas · ao vivo` : 'Plataforma viva · ao vivo'}
            </span>
          </div>
          <h2 style={{
            margin:0, fontSize:'clamp(26px,3.8vw,44px)', fontWeight:900,
            color:'white', letterSpacing:'-0.032em', lineHeight:1.04, textTransform:'uppercase',
          }}>
            Lances que estão<br/>
            <span style={{ color:'#00FF88' }}>rodando o Brasil</span>
          </h2>
        </div>
        <a href="/ranking" style={{
          fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.28)',
          textDecoration:'none', letterSpacing:'0.07em',
          paddingBottom:'7px', flexShrink:0, whiteSpace:'nowrap',
        }}>
          Ver todos →
        </a>
      </div>

      {/* Cards */}
      <div className="lances-track">
        {display.map((atleta, i) => (
          <ReelCard key={atleta.id || String(i)} atleta={atleta} />
        ))}
      </div>

    </section>
  )
}

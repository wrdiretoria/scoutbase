'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type HeroAtleta = {
  id:      string
  nome:    string
  posicao: string
  cidade:  string
  ovr:     number | null
  tipo:    'avaliado' | 'novo'
  ts:      string
}

// ── Static fallback ───────────────────────────────────────────────────────────

const STATIC: HeroAtleta[] = [
  { id:'1', nome:'João Mendes',    posicao:'Atacante',      cidade:'São Paulo, SP',      ovr:85, tipo:'avaliado', ts:'' },
  { id:'2', nome:'Pedro Lima',     posicao:'Goleiro',       cidade:'Rio de Janeiro, RJ', ovr:74, tipo:'avaliado', ts:'' },
  { id:'3', nome:'Lucas Silva',    posicao:'Meia',          cidade:'Belo Horizonte, MG', ovr:89, tipo:'avaliado', ts:'' },
  { id:'4', nome:'Rafael Torres',  posicao:'Zagueiro',      cidade:'Curitiba, PR',       ovr:67, tipo:'novo',     ts:'' },
  { id:'5', nome:'Gabriel Rocha',  posicao:'Ponta Direita', cidade:'Salvador, BA',       ovr:79, tipo:'avaliado', ts:'' },
  { id:'6', nome:'Matheus Costa',  posicao:'Volante',       cidade:'Fortaleza, CE',      ovr:82, tipo:'avaliado', ts:'' },
  { id:'7', nome:'Nicolas Alves',  posicao:'Lateral',       cidade:'Manaus, AM',         ovr:null, tipo:'novo',   ts:'' },
  { id:'8', nome:'Kauã Ferreira',  posicao:'Atacante',      cidade:'Recife, PE',         ovr:91, tipo:'avaliado', ts:'' },
  { id:'9', nome:'Bruno Santos',   posicao:'Meia-Atacante', cidade:'Porto Alegre, RS',   ovr:77, tipo:'avaliado', ts:'' },
  { id:'10',nome:'Thiago Mendes',  posicao:'Centro-Avante', cidade:'Campinas, SP',       ovr:83, tipo:'avaliado', ts:'' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

const COLORS = ['#1a6b3c','#1e3a5f','#5f1e3a','#3a5f1e','#3a1e5f','#6b3a1a','#1a5f5f','#5f1a1a']
function avatarBg(name: string) {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % COLORS.length
  return COLORS[i]
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

function posAbrev(pos: string) {
  const map: Record<string, string> = {
    'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE','Lateral':'LAT',
    'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
    'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
  }
  return map[pos] ?? pos.slice(0,3).toUpperCase()
}

function timeAgo(ts: string) {
  if (!ts) return 'agora'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 2)  return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ── Card ──────────────────────────────────────────────────────────────────────

function AtletaCard({ atleta }: { atleta: HeroAtleta }) {
  const cor = atleta.ovr ? ovrColor(atleta.ovr) : 'rgba(255,255,255,0.3)'
  const rgb = atleta.ovr
    ? atleta.ovr >= 80 ? '0,255,136' : atleta.ovr >= 65 ? '251,191,36' : '249,115,22'
    : '255,255,255'

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'12px',
      padding:'12px 16px', marginBottom:'8px', flexShrink:0,
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:'14px',
      backdropFilter:'blur(8px)',
      transition:'border-color .2s',
    }}>
      {/* Avatar */}
      <div style={{
        width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
        background:`linear-gradient(135deg, ${avatarBg(atleta.nome)}, ${avatarBg(atleta.nome)}cc)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'12px', fontWeight:900, color:'white',
        border:'1.5px solid rgba(255,255,255,0.10)',
        boxShadow:'0 0 10px rgba(0,0,0,0.4)',
      }}>
        {initials(atleta.nome)}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
          <span style={{ fontSize:'13px', fontWeight:800, color:'white', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {atleta.nome}
          </span>
          {atleta.posicao && (
            <span style={{
              fontSize:'9px', fontWeight:800, color:'rgba(0,255,136,0.8)',
              background:'rgba(0,255,136,0.10)', border:'1px solid rgba(0,255,136,0.20)',
              borderRadius:'4px', padding:'1px 5px', letterSpacing:'0.06em', flexShrink:0,
            }}>
              {posAbrev(atleta.posicao)}
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          {atleta.cidade && (
            <span style={{ fontSize:'10.5px', color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {atleta.cidade}
            </span>
          )}
          <span style={{
            fontSize:'9px', color:'rgba(255,255,255,0.25)',
            flexShrink:0,
          }}>
            · {atleta.tipo === 'avaliado' ? 'avaliado' : 'entrou'} {timeAgo(atleta.ts)}
          </span>
        </div>
      </div>

      {/* OVR */}
      {atleta.ovr != null ? (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0,
          background:`rgba(${rgb},0.08)`,
          border:`1px solid ${cor}30`,
          borderRadius:'10px', padding:'5px 10px',
          minWidth:'44px',
        }}>
          <span style={{ fontSize:'8px', fontWeight:800, color:cor, letterSpacing:'0.08em' }}>OVR</span>
          <span style={{ fontSize:'16px', fontWeight:900, color:cor, lineHeight:1, textShadow:`0 0 12px ${cor}60` }}>
            {atleta.ovr}
          </span>
        </div>
      ) : (
        <div style={{
          flexShrink:0, width:'44px', height:'44px',
          background:'rgba(0,255,136,0.06)', border:'1px solid rgba(0,255,136,0.12)',
          borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontSize:'18px' }}>⚽</span>
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroFeed() {
  const [items, setItems] = useState<HeroAtleta[]>(STATIC)

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch('/api/landing/atletas', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as { items: HeroAtleta[] }
        if (json.items.length > 0) setItems([...json.items, ...STATIC])
      } catch { /* keep static */ }
    }
    fetch_()
    const iv = setInterval(fetch_, 30_000)
    return () => clearInterval(iv)
  }, [])

  const display = items.length > 0 ? items : STATIC

  return (
    <div style={{
      position:'relative',
      width:'100%', height:'100%',
      overflow:'hidden',
    }}>
      <style>{`
        @keyframes heroScroll {
          from { transform: translateY(0) }
          to   { transform: translateY(-50%) }
        }
        .hero-feed-track {
          display: flex;
          flex-direction: column;
          animation: heroScroll 28s linear infinite;
          will-change: transform;
        }
        .hero-feed-track:hover {
          animation-play-state: paused;
        }
        .hero-feed-top, .hero-feed-bottom {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 80px;
          z-index: 2;
          pointer-events: none;
        }
        .hero-feed-top {
          top: 0;
          background: linear-gradient(to bottom, rgba(2,7,4,0.95) 0%, transparent 100%);
        }
        .hero-feed-bottom {
          bottom: 0;
          background: linear-gradient(to top, rgba(2,7,4,0.95) 0%, transparent 100%);
        }
      `}</style>

      {/* Fade edges */}
      <div className="hero-feed-top" />
      <div className="hero-feed-bottom" />

      {/* Header */}
      <div style={{
        position:'absolute', top:'12px', left:0, right:0, zIndex:3,
        display:'flex', alignItems:'center', gap:'8px',
        padding:'0 4px',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'6px',
          background:'rgba(6,13,8,0.90)', padding:'5px 12px', borderRadius:'8px',
          border:'1px solid rgba(0,255,136,0.20)',
        }}>
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#00FF88', boxShadow:'0 0 6px rgba(0,255,136,0.9)',
            animation:'pulseDot 1.8s ease-in-out infinite',
          }} />
          <span style={{ fontSize:'9px', fontWeight:800, color:'rgba(0,255,136,0.85)', letterSpacing:'0.16em', textTransform:'uppercase' }}>
            Atletas ao vivo
          </span>
        </div>
        <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)' }}>
          {display.length > STATIC.length ? `${display.length - STATIC.length} reais` : `${STATIC.length} atletas`}
        </span>
      </div>

      {/* Scrolling track — cards duplicados para loop infinito */}
      <div className="hero-feed-track" style={{ paddingTop:'48px' }}>
        {display.map((a, i) => <AtletaCard key={`a-${i}`} atleta={a} />)}
        {display.map((a, i) => <AtletaCard key={`b-${i}`} atleta={a} />)}
      </div>
    </div>
  )
}

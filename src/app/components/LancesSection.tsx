'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ReelAtleta = {
  id:         string
  nome:       string
  posicao:    string
  cidade:     string
  ovr:        number | null
  tipo:       'avaliado' | 'novo' | 'patrocinado'
  ts:         string
  fotos:      string[]
  athleteId?: string | null
}

// ── Fallback ───────────────────────────────────────────────────────────────────

const FALLBACK: ReelAtleta[] = [
  { id:'f1', nome:'Kauã Ferreira',  posicao:'Atacante',     cidade:'Recife, PE',          ovr:91, tipo:'avaliado', ts:'', fotos:[] },
  { id:'f2', nome:'Lucas Silva',    posicao:'Meia',          cidade:'Belo Horizonte, MG',  ovr:89, tipo:'avaliado', ts:'', fotos:[] },
  { id:'f3', nome:'Gabriel Rocha',  posicao:'Ponta Direita', cidade:'Salvador, BA',        ovr:79, tipo:'avaliado', ts:'', fotos:[] },
  { id:'f4', nome:'João Mendes',    posicao:'Atacante',      cidade:'São Paulo, SP',       ovr:85, tipo:'avaliado', ts:'', fotos:[] },
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
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

function ovrRgb(ovr: number) {
  if (ovr >= 80) return '0,255,136'
  if (ovr >= 65) return '251,191,36'
  return '249,115,22'
}

// ── Paleta por posição ─────────────────────────────────────────────────────────

type Palette = { bg: string; light: string }

function getPalette(pos: string): Palette {
  const p = pos.toLowerCase()
  if (p.includes('atacante') || p.includes('avante'))
    return {
      bg:    'linear-gradient(160deg,#050e05 0%,#092009 45%,#061206 100%)',
      light: 'radial-gradient(ellipse at 45% 18%, rgba(0,220,80,0.28) 0%, rgba(0,160,50,0.08) 45%, transparent 68%)',
    }
  if (p.includes('meia'))
    return {
      bg:    'linear-gradient(160deg,#060818 0%,#0a0e28 45%,#07091e 100%)',
      light: 'radial-gradient(ellipse at 55% 18%, rgba(80,110,255,0.28) 0%, rgba(50,80,200,0.08) 45%, transparent 68%)',
    }
  if (p.includes('goleiro'))
    return {
      bg:    'linear-gradient(160deg,#080618 0%,#100928 45%,#090618 100%)',
      light: 'radial-gradient(ellipse at 50% 16%, rgba(160,100,255,0.28) 0%, rgba(120,70,200,0.08) 45%, transparent 68%)',
    }
  if (p.includes('zagueiro'))
    return {
      bg:    'linear-gradient(160deg,#090512 0%,#130726 45%,#0b0616 100%)',
      light: 'radial-gradient(ellipse at 48% 18%, rgba(180,80,255,0.26) 0%, rgba(130,55,200,0.08) 45%, transparent 68%)',
    }
  if (p.includes('ponta'))
    return {
      bg:    'linear-gradient(160deg,#100900 0%,#1e1400 45%,#140c00 100%)',
      light: 'radial-gradient(ellipse at 50% 16%, rgba(255,185,0,0.30) 0%, rgba(200,130,0,0.08) 45%, transparent 68%)',
    }
  if (p.includes('lateral'))
    return {
      bg:    'linear-gradient(160deg,#050d12 0%,#0b1622 45%,#060d12 100%)',
      light: 'radial-gradient(ellipse at 45% 18%, rgba(56,189,248,0.26) 0%, rgba(30,140,200,0.08) 45%, transparent 68%)',
    }
  return {
    bg:    'linear-gradient(160deg,#090910 0%,#121218 45%,#090910 100%)',
    light: 'radial-gradient(ellipse at 50% 18%, rgba(150,155,180,0.18) 0%, transparent 56%)',
  }
}

// ── Tag dinâmica ───────────────────────────────────────────────────────────────

type Tag = { label: string; color: string; bg: string; border: string }

function getTag(tipo: 'avaliado' | 'novo' | 'patrocinado', ovr: number | null): Tag {
  if (tipo === 'patrocinado')
    return { label:'💎 Patrocinado',   color:'#a78bfa', bg:'rgba(167,139,250,0.13)', border:'rgba(167,139,250,0.32)' }
  if (tipo === 'novo')
    return { label:'🔥 Entrou agora',  color:'#ff6b35', bg:'rgba(255,107,53,0.15)', border:'rgba(255,107,53,0.35)' }
  if (ovr !== null && ovr >= 85)
    return { label:'⭐ Destaque',       color:'#fbbf24', bg:'rgba(251,191,36,0.13)', border:'rgba(251,191,36,0.32)' }
  if (ovr !== null && ovr >= 75)
    return { label:'🎯 Avaliado',       color:'#00FF88', bg:'rgba(0,255,136,0.10)', border:'rgba(0,255,136,0.24)' }
  return   { label:'📊 Avaliado',       color:'rgba(255,255,255,0.65)', bg:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.16)' }
}

// SVG grain (URL-encoded, cached as constant so it's not re-created each render)
const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

// ── ReelCard ───────────────────────────────────────────────────────────────────

function ReelCard({ atleta, index }: { atleta: ReelAtleta; index: number }) {
  const fotos   = atleta.fotos ?? []
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    if (fotos.length <= 1) return
    const iv = setInterval(() => setPhotoIdx(p => (p + 1) % fotos.length), 2500)
    return () => clearInterval(iv)
  }, [fotos.length])

  const currentFoto = fotos[photoIdx] ?? null

  const palette  = getPalette(atleta.posicao)
  const tag      = getTag(atleta.tipo, atleta.ovr)
  const time     = timeAgo(atleta.ts)
  const pos      = posAbrev(atleta.posicao)
  const city     = atleta.cidade.split(',')[0] ?? atleta.cidade
  const hasOvr   = atleta.ovr != null
  const ovr      = atleta.ovr ?? 0
  const cor      = hasOvr ? ovrColor(ovr) : 'rgba(0,255,136,0.65)'
  const rgb      = hasOvr ? ovrRgb(ovr)   : '0,255,136'
  const isReal   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(atleta.id)

  return (
    // ── Card root — background & size set INLINE (not via CSS class) ──
    <div style={{
      position:    'relative',
      flexShrink:  0,
      width:       'min(252px, 70vw)',
      height:      '420px',
      borderRadius:'18px',
      overflow:    'hidden',
      cursor:      isReal ? 'pointer' : 'default',
      scrollSnapAlign: 'start',
      background:  palette.bg,
      transition:  'transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease',
      boxShadow:   '0 8px 32px rgba(0,0,0,0.55)',
      animation:   `lncCardIn .5s cubic-bezier(.22,1,.36,1) both ${index * 0.08}s`,
    }}>

      {/* Link invisível sobre o card → perfil do atleta */}
      {isReal && (
        <Link
          href={`/jogador/${atleta.id}`}
          style={{ position:'absolute', inset:0, zIndex:50 }}
          aria-label={`Ver perfil de ${atleta.nome}`}
        />
      )}

      {/* Foto real do atleta (ciclando) */}
      {currentFoto && (
        <img
          key={currentFoto}
          src={currentFoto}
          alt={atleta.nome}
          style={{
            position:      'absolute',
            inset:         0,
            zIndex:        0,
            width:         '100%',
            height:        '100%',
            objectFit:     'cover',
            objectPosition:'center top',
            display:       'block',
            transition:    'opacity 0.7s ease',
          }}
        />
      )}

      {/* Atmospheric stadium light (só quando sem foto) */}
      {!currentFoto && (
        <div style={{ position:'absolute', inset:0, background:palette.light, pointerEvents:'none' }} />
      )}

      {/* Giant initials — background texture */}
      <div style={{
        position:'absolute', inset:0, zIndex:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        pointerEvents:'none', userSelect:'none', overflow:'hidden',
      }}>
        <span style={{
          fontSize:'clamp(100px,28vw,148px)', fontWeight:900,
          color:'rgba(255,255,255,0.032)',
          letterSpacing:'-0.04em', lineHeight:1,
          WebkitFontSmoothing:'antialiased',
        }}>
          {initials(atleta.nome)}
        </span>
      </div>

      {/* Film grain */}
      <div style={{
        position:'absolute', inset:0, zIndex:0, opacity:0.065,
        backgroundImage: GRAIN_BG,
        backgroundSize:'cover',
        pointerEvents:'none',
      }} />

      {/* Bottom cinematic gradient */}
      <div style={{
        position:'absolute', inset:0, zIndex:1,
        background:'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.14) 56%, transparent 100%)',
        pointerEvents:'none',
      }} />

      {/* ── Top row: tag + tempo ── */}
      <div style={{
        position:'absolute', top:14, left:14, right:14, zIndex:3,
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:6,
      }}>
        {/* Tag badge */}
        <div style={{
          background:tag.bg, border:`1px solid ${tag.border}`,
          backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
          borderRadius:'100px', padding:'5px 11px',
          fontSize:'10px', fontWeight:700, color:tag.color,
          letterSpacing:'0.01em', lineHeight:1.3,
          flexShrink:1, minWidth:0,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          maxWidth:'140px',
        }}>
          {tag.label}
        </div>

        {/* Time badge */}
        <div style={{
          background:'rgba(0,0,0,0.58)',
          backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
          borderRadius:'100px', padding:'5px 9px',
          fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.52)',
          letterSpacing:'0.04em', flexShrink:0,
          whiteSpace:'nowrap',
        }}>
          {time}
        </div>
      </div>

      {/* ── Avatar central (quando sem foto) ── */}
      {!currentFoto && (
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%, -58%)',
          zIndex:2,
          width:84, height:84, borderRadius:'50%',
          background:`rgba(${rgb},0.10)`,
          backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
          border:`1.5px solid rgba(${rgb},0.28)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:30, fontWeight:900,
          color:`rgba(${rgb},0.75)`,
          letterSpacing:'-0.03em',
          boxShadow:`0 0 32px rgba(${rgb},0.18)`,
        }}>
          {initials(atleta.nome)}
        </div>
      )}

      {/* ── Bottom info ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 16px 18px', zIndex:3 }}>

        {/* OVR ou NOVO badge */}
        {hasOvr ? (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            background:`rgba(${rgb},0.12)`,
            border:`1px solid rgba(${rgb},0.30)`,
            borderRadius:'20px', padding:'3px 10px',
            marginBottom:9,
          }}>
            <span style={{ fontSize:'8.5px', fontWeight:800, color:cor, letterSpacing:'0.08em' }}>OVR</span>
            <span style={{ fontSize:'16px', fontWeight:900, color:cor, lineHeight:1 }}>{atleta.ovr}</span>
          </div>
        ) : (
          <div style={{
            display:'inline-flex', alignItems:'center',
            background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.18)',
            borderRadius:'20px', padding:'3px 10px', marginBottom:9,
          }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(0,255,136,0.65)', letterSpacing:'0.04em' }}>NOVO ⚽</span>
          </div>
        )}

        {/* Nome */}
        <div style={{
          fontSize:16, fontWeight:900, color:'white',
          letterSpacing:'-0.022em', lineHeight:1.18, marginBottom:4,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {atleta.nome}
        </div>

        {/* Posição · Cidade */}
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', fontWeight:500, letterSpacing:'0.01em' }}>
          {pos}&nbsp;·&nbsp;{city}
        </div>

        {/* ID do atleta */}
        {atleta.athleteId && (
          <div style={{
            marginTop: '8px',
            fontSize: '10px', fontWeight: 800,
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.10em',
          }}>
            ID {atleta.athleteId.replace('MC-', '')}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────────────────────────

export default function LancesSection() {
  const [atletas,   setAtletas]   = useState<ReelAtleta[]>(FALLBACK)
  const [liveCount, setLiveCount] = useState(0)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)

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

  // Garante mínimo de 4 cards visíveis
  const display = atletas.length >= 4
    ? atletas.slice(0, 4)
    : [...atletas, ...FALLBACK].slice(0, 4)

  const liveLabel = 'confira'

  return (
    <section style={{
      background: '#020604',
      paddingTop:  72,
      paddingBottom: 84,
      overflow: 'hidden',
    }}>

      {/* Keyframes injetados uma vez */}
      <style>{`
        @keyframes lncCardIn {
          from { opacity:0; transform:translateY(18px) }
          to   { opacity:1; transform:translateY(0)    }
        }
        .lances-card-wrap::-webkit-scrollbar { display:none; }
        .lances-card-hover:hover {
          transform: scale(1.018) !important;
          box-shadow: 0 14px 44px rgba(0,0,0,0.68) !important;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display:         'flex',
        alignItems:      'flex-end',
        justifyContent:  'space-between',
        paddingLeft:     'clamp(20px,5vw,72px)',
        paddingRight:    'clamp(20px,5vw,72px)',
        marginBottom:    32,
        maxWidth:        1280,
        marginLeft:      'auto',
        marginRight:     'auto',
      }}>
        {/* Left: label + título */}
        <div>
          {/* Live label */}
          <div style={{
            display:'flex', alignItems:'center', gap:7, marginBottom:12,
          }}>
            <span style={{
              display:'inline-block', width:5, height:5, borderRadius:'50%',
              background:'#00FF88', flexShrink:0,
              boxShadow:'0 0 7px rgba(0,255,136,0.85)',
              animation:'pulseDot 2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize:'9.5px', fontWeight:700,
              color:'rgba(0,255,136,0.52)',
              letterSpacing:'0.24em', textTransform:'uppercase',
            }}>
              confira
            </span>
          </div>

          {/* Título */}
          <h2 style={{
            margin:0,
            fontSize:'clamp(24px,5.5vw,44px)',
            fontWeight:900,
            color:'white',
            letterSpacing:'-0.032em',
            lineHeight:1.06,
            textTransform:'uppercase',
          }}>
            Atletas em<br/>
            <span style={{ color:'#00FF88' }}>destaque</span>
          </h2>
        </div>

        {/* Right: link */}
        <a href="/ranking" style={{
          fontSize:12, fontWeight:600,
          color:'rgba(255,255,255,0.28)',
          textDecoration:'none', letterSpacing:'0.07em',
          paddingBottom:6, flexShrink:0, whiteSpace:'nowrap',
          marginLeft:16,
        }}>
          Ver todos →
        </a>
      </div>

      {/* ── Cards track ── */}
      <div
        className="lances-card-wrap"
        style={{
          display:         'flex',
          gap:             14,
          paddingLeft:     'clamp(20px,5vw,72px)',
          paddingRight:    'clamp(20px,5vw,72px)',
          paddingBottom:   8,
          overflowX:       'auto',
          overflowY:       'visible',
          scrollSnapType:  'x mandatory',
          scrollbarWidth:  'none',
        } as React.CSSProperties}
      >
        {display.map((atleta, i) => (
          <ReelCard key={atleta.id || String(i)} atleta={atleta} index={i} />
        ))}
      </div>

      {/* ── Mobile scroll hint ── */}
      <div style={{
        textAlign:'center', marginTop:20,
        fontSize:10, color:'rgba(255,255,255,0.18)',
        letterSpacing:'0.12em', textTransform:'uppercase',
      }}>
        ← deslize para ver mais →
      </div>

    </section>
  )
}

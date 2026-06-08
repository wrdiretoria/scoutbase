'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type FotoItem = {
  userId:    string
  nome:      string
  posicao:   string
  cidade:    string
  ovr:       number | null
  fotos:     string[]
  athleteId: string | null
}

type Slide = {
  userId:    string
  nome:      string
  posicao:   string
  cidade:    string
  ovr:       number | null
  url:       string
  athleteId: string | null
}

// ── Static fallback (exibido enquanto sem dados reais) ────────────────────────
// Usa gradientes estilo LED para parecer um painel de anúncios mesmo sem fotos reais

const PLACEHOLDER_SLIDES: Slide[] = [
  { userId:'1', nome:'Seu perfil aqui',    posicao:'Atacante',     cidade:'São Paulo, SP',   ovr:null, url:'', athleteId:null },
  { userId:'2', nome:'João Silva',         posicao:'Meia',         cidade:'Rio de Janeiro',  ovr:82,   url:'', athleteId:null },
  { userId:'3', nome:'Pedro Lima',         posicao:'Goleiro',      cidade:'Belo Horizonte',  ovr:74,   url:'', athleteId:null },
]

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

function posAbrev(pos: string) {
  const map: Record<string, string> = {
    'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE',
    'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
    'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
  }
  return map[pos] ?? pos.slice(0,3).toUpperCase()
}

// ── LED scan-line overlay ─────────────────────────────────────────────────────

function LedOverlay() {
  return (
    <>
      {/* scan lines */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />
      {/* vignette */}
      <div style={{
        position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
      }} />
      {/* green glow border */}
      <div style={{
        position:'absolute', inset:0, zIndex:4, pointerEvents:'none',
        boxShadow:'inset 0 0 60px rgba(0,255,136,0.07), inset 0 0 2px rgba(0,255,136,0.15)',
      }} />
    </>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhotoBillboard() {
  const [slides,  setSlides]  = useState<Slide[]>([])
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)   // fade controller
  const [paused,  setPaused]  = useState(false)

  // Build slide list from API items
  function buildSlides(items: FotoItem[]): Slide[] {
    const out: Slide[] = []
    for (const item of items) {
      for (const url of item.fotos) {
        out.push({ userId: item.userId, nome: item.nome, posicao: item.posicao, cidade: item.cidade, ovr: item.ovr, url, athleteId: item.athleteId })
      }
    }
    return out
  }

  useEffect(() => {
    async function fetchFotos() {
      try {
        const res = await fetch('/api/landing/fotos', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as { items: FotoItem[] }
        const built = buildSlides(json.items)
        if (built.length > 0) setSlides(built)
      } catch { /* keep current */ }
    }
    fetchFotos()
    const iv = setInterval(fetchFotos, 60_000) // refresh list every 60s
    return () => clearInterval(iv)
  }, [])

  const advance = useCallback(() => {
    const list = slides.length > 0 ? slides : PLACEHOLDER_SLIDES
    setVisible(false)
    setTimeout(() => {
      setCurrent(c => (c + 1) % list.length)
      setVisible(true)
    }, 500) // fade out → swap → fade in
  }, [slides])

  useEffect(() => {
    if (paused) return
    const iv = setInterval(advance, 2000)
    return () => clearInterval(iv)
  }, [advance, paused])

  const list    = slides.length > 0 ? slides : PLACEHOLDER_SLIDES
  const slide   = list[current % list.length]
  const hasReal = !!slide.url
  const total   = list.length
  const isRealUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slide.userId)

  return (
    <div
      style={{ position:'relative', width:'100%', overflow:'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes billboardFadeIn {
          from { opacity: 0; transform: scale(1.015); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes billboardFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes scanMove {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes ledPulse {
          0%,100% { opacity: 0.6; }
          50%     { opacity: 1; }
        }
        .bb-tag { animation: ledPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Billboard frame ── */}
      <div style={{
        position:'relative',
        height:'clamp(340px,56vw,620px)',
        background: hasReal
          ? `url(${slide.url}) center / cover no-repeat`
          : 'linear-gradient(135deg, #060d08 0%, #0a1a10 50%, #060d08 100%)',
        transition: visible ? 'none' : 'opacity 0.5s ease',
        opacity: visible ? 1 : 0,
      }}>

        {/* Placeholder pattern when no real photo */}
        {!hasReal && (
          <div style={{
            position:'absolute', inset:0, zIndex:1,
            background:'repeating-linear-gradient(45deg,rgba(0,255,136,0.02) 0px,rgba(0,255,136,0.02) 1px,transparent 1px,transparent 40px)',
          }} />
        )}

        <LedOverlay />

        {/* ── Moving scan line ── */}
        <div style={{
          position:'absolute', left:0, right:0, height:'120px', zIndex:5, pointerEvents:'none',
          background:'linear-gradient(to bottom, transparent, rgba(0,255,136,0.04), transparent)',
          animation:'scanMove 4s linear infinite',
        }} />

        {/* ── Content overlay ── */}
        <Link
          href={isRealUser ? `/jogador/${slide.userId}` : '/ranking'}
          style={{ position:'absolute', inset:0, zIndex:6, textDecoration:'none', cursor: isRealUser ? 'pointer' : 'default',
          background:'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.40) 40%, rgba(0,0,0,0.10) 70%, transparent 100%)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end',
          padding:'clamp(20px,4vw,48px)',
        }}>

          {/* Position badge */}
          {slide.posicao && (
            <div className="bb-tag" style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              marginBottom:'10px', alignSelf:'flex-start',
              background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.35)',
              borderRadius:'6px', padding:'4px 10px',
            }}>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', boxShadow:'0 0 6px #00FF88' }} />
              <span style={{ fontSize:'11px', fontWeight:800, color:'#00FF88', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                {posAbrev(slide.posicao)}
              </span>
            </div>
          )}

          {/* Name */}
          <h2 style={{
            margin:'0 0 4px',
            fontSize:'clamp(26px,5vw,56px)',
            fontWeight:900,
            color:'white',
            letterSpacing:'-0.02em',
            lineHeight:1.05,
            textShadow:'0 2px 20px rgba(0,0,0,0.8)',
            fontFamily:'system-ui,sans-serif',
          }}>
            {slide.nome}
          </h2>

          {/* City + OVR row */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            {slide.cidade && (
              <span style={{ fontSize:'clamp(12px,2vw,15px)', color:'rgba(255,255,255,0.55)', fontWeight:500 }}>
                📍 {slide.cidade}
              </span>
            )}
            {slide.ovr != null && (
              <div style={{
                display:'flex', alignItems:'center', gap:'4px',
                background:`rgba(${slide.ovr >= 80 ? '0,255,136' : slide.ovr >= 65 ? '251,191,36' : '249,115,22'},0.12)`,
                border:`1px solid ${ovrColor(slide.ovr)}40`,
                borderRadius:'20px', padding:'3px 10px',
              }}>
                <span style={{ fontSize:'9px', fontWeight:800, color:ovrColor(slide.ovr), letterSpacing:'0.08em' }}>OVR</span>
                <span style={{ fontSize:'15px', fontWeight:900, color:ovrColor(slide.ovr) }}>{slide.ovr}</span>
              </div>
            )}
            {slide.athleteId && (
              <span style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.30)', letterSpacing:'0.10em' }}>
                ID {slide.athleteId.replace('MC-', '')}
              </span>
            )}
          </div>
        </Link>

        {/* ── Dot indicators ── */}
        {total > 1 && (
          <div style={{
            position:'absolute', bottom:'16px', right:'clamp(16px,4vw,48px)', zIndex:7,
            display:'flex', gap:'6px', alignItems:'center',
          }}>
            {list.slice(0, Math.min(total, 12)).map((_, i) => (
              <button
                key={i}
                onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true) }, 300) }}
                style={{
                  width: i === current ? '20px' : '6px',
                  height:'6px', borderRadius:'3px',
                  background: i === current ? '#00FF88' : 'rgba(255,255,255,0.25)',
                  border:'none', cursor:'pointer', padding:0,
                  transition:'all 0.3s ease',
                  boxShadow: i === current ? '0 0 8px rgba(0,255,136,0.7)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* ── PAINEL AO VIVO chip ── */}
        <div style={{
          position:'absolute', top:'16px', left:'16px', zIndex:7,
          display:'flex', alignItems:'center', gap:'6px',
          background:'rgba(6,13,8,0.85)', padding:'5px 11px', borderRadius:'8px',
          border:'1px solid rgba(0,255,136,0.20)', backdropFilter:'blur(8px)',
        }}>
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#00FF88', boxShadow:'0 0 6px rgba(0,255,136,0.9)',
            animation:'pulseDot 1.8s ease-in-out infinite',
          }} />
          <span style={{ fontSize:'8.5px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.85)', textTransform:'uppercase' }}>
            Atletas reais
          </span>
        </div>

        {/* ── Pause indicator ── */}
        {paused && (
          <div style={{
            position:'absolute', top:'16px', right:'16px', zIndex:7,
            background:'rgba(0,0,0,0.6)', padding:'4px 10px', borderRadius:'6px',
            border:'1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              ⏸ pausado
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom strip — CTA ── */}
      <div style={{
        background:'linear-gradient(90deg, #060d08 0%, #0a1a0c 50%, #060d08 100%)',
        borderBottom:'1px solid rgba(0,255,136,0.08)',
        padding:'14px clamp(16px,4vw,48px)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
        flexWrap:'wrap',
      }}>
        <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.38)', fontWeight:500 }}>
          {total > 0 ? `${total} foto${total > 1 ? 's' : ''} de atletas reais` : 'Crie seu perfil e apareça aqui'}
        </span>
        <a
          href="/login"
          style={{
            display:'inline-flex', alignItems:'center', gap:'6px',
            background:'rgba(0,255,136,0.10)', border:'1px solid rgba(0,255,136,0.30)',
            borderRadius:'8px', padding:'7px 16px',
            fontSize:'12px', fontWeight:700, color:'#00FF88',
            textDecoration:'none', letterSpacing:'0.02em',
          }}
        >
          Criar meu perfil grátis →
        </a>
      </div>
    </div>
  )
}

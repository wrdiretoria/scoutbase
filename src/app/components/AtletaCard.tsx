'use client'

/**
 * AtletaCard — card premium estilo FIFA Ultimate Team.
 * Octagonal (clip-path), cristais CSS, Bebas Neue + Barlow Condensed.
 */

import Link from 'next/link'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AtributosMap = {
  vel?:   number | null
  fin?:   number | null
  tec?:   number | null
  vis?:   number | null
  forca?: number | null
  pos?:   number | null
}

export type AtletaCardProps = {
  nome:         string
  ovr:          number | null
  foto:         string | null
  posicao?:     string | null
  categoria?:   string | null
  atributos?:   AtributosMap | null
  avaliadoPor?: string | null
  href?:        string
  rank?:        number | null
  animate?:     boolean
  isNew?:       boolean
  width?:       string | number
  athleteId?:   string | null
}

// ─── Tier ─────────────────────────────────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 80) return { label:'CARD OURO',   color:'#ffd700', glow:'#ffd70088', shadow:'#ffd70044' }
  if (ovr !== null && ovr >= 50) return { label:'CARD PRATA',  color:'#c0c0c0', glow:'#c0c0c088', shadow:'#c0c0c044' }
  return                               { label:'CARD BRONZE', color:'#cd7f32', glow:'#cd7f3288', shadow:'#cd7f3244' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.trim().split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function toFifa(v: number | null | undefined): string {
  if (v == null) return '—'
  return String(Math.min(99, Math.round(v * 9.9)))
}

function tagline(posicao: string | null | undefined): [string, string] {
  const p = (posicao ?? '').toLowerCase()
  if (p.includes('atacante') || p.includes('avante')) return ['NASCIDO PARA FAZER', 'HISTÓRIA']
  if (p.includes('meia') || p.includes('volante'))    return ['O JOGO PASSA PELOS', 'SEUS PÉS']
  if (p.includes('zagueiro') || p.includes('lateral')) return ['A MURALHA QUE', 'NINGUÉM PASSA']
  if (p.includes('goleiro'))                           return ['A ÚLTIMA', 'BARREIRA']
  return ['SEU TALENTO,', 'SUA IDENTIDADE']
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AtletaCard({
  nome,
  ovr,
  foto,
  posicao,
  categoria,
  atributos,
  href,
  rank,
  animate   = false,
  isNew     = false,
  width     = '200px',
  athleteId,
}: AtletaCardProps) {
  const tier = getTier(ovr)
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = !!foto && !imgErr

  const parts     = nome.trim().split(' ')
  const firstName = parts[0].toUpperCase()
  const lastName  = (parts[1] ?? '').toUpperCase()
  const [tagPart1, tagPart2] = tagline(posicao)

  const GREEN = '#00ff44'

  const fifaStats = [
    { label: 'PAC', val: toFifa(atributos?.vel) },
    { label: 'SHO', val: toFifa(atributos?.fin) },
    { label: 'PAS', val: toFifa(atributos?.vis) },
    { label: 'DRI', val: toFifa(atributos?.tec) },
    { label: 'DEF', val: toFifa(atributos?.pos) },
    { label: 'PHY', val: toFifa(atributos?.forca) },
  ]

  const uid = athleteId ? `ac-${athleteId.replace(/[^a-z0-9]/gi, '')}` : `ac-${Math.random().toString(36).slice(2)}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&display=swap');

        @keyframes acFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes acShimmer { 0%{left:-80%} 100%{left:160%} }
        @keyframes acSparkle { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.3)} }

        .${uid}-root { transition: transform .22s ease, box-shadow .22s ease; }
        .${uid}-root:hover { transform: translateY(-6px) scale(1.02); }

        .${uid}-shimmer {
          position:absolute; top:0; bottom:0; left:-80%; width:45%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);
          transform:skewX(-18deg);
          animation:acShimmer 5s ease-in-out infinite 3s;
          pointer-events:none; z-index:2;
        }

        /* Cristais verdes — esquerda */
        .${uid}-crystal-l {
          position:absolute; top:5%; left:-8px; width:40px; height:88%;
          pointer-events:none; z-index:0; overflow:hidden;
        }
        .${uid}-crystal-l::before,
        .${uid}-crystal-l::after {
          content:''; position:absolute;
          width:6px; border-style:solid;
          border-color:transparent transparent ${GREEN} transparent;
        }
        .${uid}-crystal-l::before { height:0; border-width:0 3px 55px 3px; top:12%; left:18px; transform:rotate(-25deg); filter:drop-shadow(0 0 6px ${GREEN}); opacity:0.85; }
        .${uid}-crystal-l::after  { height:0; border-width:0 2px 38px 2px; top:38%; left:12px; transform:rotate(-15deg); filter:drop-shadow(0 0 5px ${GREEN}); opacity:0.70; }

        /* Cristais verdes — direita */
        .${uid}-crystal-r {
          position:absolute; top:5%; right:-8px; width:40px; height:88%;
          pointer-events:none; z-index:0; overflow:hidden;
        }
        .${uid}-crystal-r::before,
        .${uid}-crystal-r::after {
          content:''; position:absolute;
          width:6px; border-style:solid;
          border-color:transparent transparent ${GREEN} transparent;
        }
        .${uid}-crystal-r::before { height:0; border-width:0 3px 60px 3px; top:8%;  right:18px; transform:rotate(20deg);  filter:drop-shadow(0 0 7px ${GREEN}); opacity:0.90; }
        .${uid}-crystal-r::after  { height:0; border-width:0 2px 40px 2px; top:34%; right:10px; transform:rotate(30deg);  filter:drop-shadow(0 0 5px ${GREEN}); opacity:0.70; }

        /* Partículas douradas */
        .${uid}-spark {
          position:absolute; border-radius:50%;
          background:${tier.color}; pointer-events:none; z-index:1;
          animation:acSparkle 3s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`${uid}-root`}
        style={{
          width,
          position:   'relative',
          flexShrink: 0,
          cursor:     href ? 'pointer' : 'default',
          animation:  animate ? 'acFloat 5s ease-in-out infinite' : 'none',
          filter:     `drop-shadow(0 0 6px ${tier.color}99) drop-shadow(0 0 1px ${tier.color})`,
          overflow:   'hidden',
          contain:    'layout',
        }}
      >
        {href && (
          <Link
            href={href}
            style={{ position:'absolute', inset:0, zIndex:20,
              clipPath:'polygon(6% 0%,94% 0%,100% 6%,100% 94%,94% 100%,6% 100%,0% 94%,0% 6%)' }}
            aria-label={`Ver perfil de ${nome}`}
          />
        )}

        {/* ── Card ── */}
        <div style={{
          background:   '#000',
          clipPath:     'polygon(6% 0%,94% 0%,100% 6%,100% 94%,94% 100%,6% 100%,0% 94%,0% 6%)',
          position:     'relative',
          overflow:     'visible',
          boxShadow:    `0 0 0 2px ${tier.color}, 0 0 24px ${tier.shadow}, 0 20px 48px rgba(0,0,0,0.90)`,
        }}>

          {/* Cristais laterais */}
          <div className={`${uid}-crystal-l`} />
          <div className={`${uid}-crystal-r`} />

          {/* Shimmer */}
          <div className={`${uid}-shimmer`} />

          {/* Partículas douradas */}
          {[
            { top:'8%',  left:'15%',  size:'3px', delay:'0s'   },
            { top:'15%', left:'78%',  size:'2px', delay:'0.8s' },
            { top:'25%', left:'92%',  size:'2.5px', delay:'1.4s' },
            { top:'5%',  left:'55%',  size:'2px', delay:'2.1s' },
          ].map((s, i) => (
            <div key={i} className={`${uid}-spark`} style={{
              top:s.top, left:s.left, width:s.size, height:s.size,
              animationDelay:s.delay,
            }} />
          ))}

          {/* ─── HEADER tier ─── */}
          <div style={{
            padding:     '10px 0 8px',
            textAlign:   'center',
            position:    'relative',
            background:  'linear-gradient(180deg,rgba(0,0,0,0.9) 0%,transparent 100%)',
          }}>
            <div style={{ position:'absolute', top:'50%', left:'10px', right:'10px', height:'1px', background:`linear-gradient(90deg,transparent,${tier.color}80,${tier.color}80,transparent)`, transform:'translateY(-50%)' }} />
            <span style={{
              position:      'relative',
              fontFamily:    "'Bebas Neue', sans-serif",
              fontSize:      '11px',
              color:         tier.color,
              letterSpacing: '0.22em',
              textShadow:    `0 0 14px ${tier.glow}`,
              background:    '#000',
              padding:       '0 8px',
            }}>
              ◇ {tier.label} ◇
            </span>
          </div>

          {/* ─── FOTO + OVR ─── */}
          <div style={{ position:'relative', height:'155px', overflow:'hidden' }}>

            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto!}
                alt={nome}
                onError={() => setImgErr(true)}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 10%' }}
              />
            ) : (
              <div style={{
                position:'absolute', inset:0,
                background:`radial-gradient(ellipse at 60% 40%, ${GREEN}22 0%, transparent 65%)`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'42px', color:`${GREEN}66` }}>
                  {initials(nome)}
                </span>
              </div>
            )}

            {/* Overlay gradientes */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.80) 0%,transparent 32%,transparent 55%,rgba(0,0,0,0.92) 90%,#000 100%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(0,0,0,0.75) 0%,transparent 45%)', pointerEvents:'none' }} />

            {/* Glow verde atrás do atleta */}
            <div style={{ position:'absolute', top:'-10px', right:'-10px', width:'130px', height:'130px', background:`radial-gradient(circle, ${GREEN}28 0%, transparent 65%)`, pointerEvents:'none' }} />

            {/* MC logo + OVR */}
            <div style={{ position:'absolute', top:'8px', left:'8px', zIndex:3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'5px' }}>
                <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:`1.5px solid ${GREEN}90`, background:`${GREEN}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'7px', fontWeight:900, color:GREEN, fontFamily:'system-ui' }}>MC</div>
                <div>
                  <div style={{ fontSize:'6px', fontWeight:700, color:'rgba(255,255,255,0.65)', fontFamily:"'Barlow Condensed',sans-serif" }}>MEU</div>
                  <div style={{ fontSize:'6px', fontWeight:700, color:GREEN, fontFamily:"'Barlow Condensed',sans-serif" }}>CRAQUE</div>
                </div>
              </div>
              <div style={{ fontSize:'7px', fontWeight:700, color:'rgba(255,255,255,0.45)', fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.12em' }}>OVR</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'56px', color:GREEN, lineHeight:0.88, textShadow:`0 0 22px ${GREEN}cc`, letterSpacing:'-0.01em' }}>
                {ovr ?? '—'}
              </div>
            </div>

            {/* Rank / NOVO */}
            <div style={{ position:'absolute', top:'8px', right:'8px', zIndex:3, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
              {rank != null && (
                <div style={{ fontSize:rank<=3?'18px':'9px', fontWeight:900, lineHeight:1, color:rank===1?'#f59e0b':rank===2?'#94a3b8':rank===3?'#cd7c3e':'rgba(255,255,255,0.25)' }}>
                  {rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':`#${rank}`}
                </div>
              )}
              {isNew && (
                <div style={{ padding:'2px 5px', borderRadius:'3px', background:`${GREEN}18`, border:`1px solid ${GREEN}55`, fontSize:'5.5px', fontWeight:900, color:GREEN, letterSpacing:'0.12em', fontFamily:"'Barlow Condensed',sans-serif" }}>NOVO</div>
              )}
            </div>
          </div>

          {/* ─── NOME ─── */}
          <div style={{ padding:'6px 10px 4px', background:'#000' }}>
            {firstName && (
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.88)', letterSpacing:'0.06em', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{firstName}</div>
            )}
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'26px', color:GREEN, lineHeight:0.95, letterSpacing:'0.01em', textShadow:`0 0 16px ${GREEN}77`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {lastName}
            </div>
          </div>

          {/* ─── ID + BANDEIRA ─── */}
          {athleteId && (
            <div style={{ margin:'2px 0', padding:'5px 10px', background:'#0d0d0d', borderTop:`1px solid ${tier.color}30`, borderBottom:`1px solid ${tier.color}30`, display:'flex', alignItems:'center', gap:'6px' }}>
              <div>
                <div style={{ fontSize:'5px', color:'rgba(255,255,255,0.30)', fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.12em' }}>ID ÚNICO</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'13px', color:GREEN, lineHeight:1, letterSpacing:'0.05em' }}>
                  {athleteId.replace(/^MC-/, '')}
                </div>
              </div>
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                <span style={{ fontSize:'10px' }}>🇧🇷</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'7px', fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.08em' }}>BRASIL</span>
              </div>
            </div>
          )}

          {/* ─── STATS FIFA ─── */}
          <div style={{ display:'flex', background:'#0a0a0a', borderTop:`1px solid ${tier.color}20`, borderBottom:`1px solid ${tier.color}20` }}>
            {fifaStats.map((s, i) => (
              <div key={s.label} style={{ flex:1, textAlign:'center', padding:'5px 0', borderLeft:i>0?'1px solid rgba(255,255,255,0.07)':'none' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'14px', color:s.val==='—'?'rgba(255,255,255,0.15)':GREEN, lineHeight:1, textShadow:s.val!=='—'?`0 0 8px ${GREEN}77`:'none' }}>
                  {s.val}
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'5.5px', color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', fontWeight:700, marginTop:'1px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ─── INFO INFERIOR ─── */}
          <div style={{ display:'flex', background:'#060606' }}>
            {[
              { icon:'⚽', label:'POSIÇÃO', val:(posicao??'—').toUpperCase() },
              { icon:'📅', label:'IDADE',   val:(categoria??'—').toUpperCase() },
            ].map((col, i) => (
              <div key={col.label} style={{ flex:1, textAlign:'center', padding:'5px 2px', borderLeft:i>0?'1px solid rgba(255,255,255,0.06)':'none' }}>
                <div style={{ fontSize:'9px', lineHeight:1, marginBottom:'2px' }}>{col.icon}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'5.5px', color:'rgba(255,255,255,0.30)', fontWeight:700, letterSpacing:'0.10em' }}>{col.label}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'8px', fontWeight:700, color:'rgba(255,255,255,0.82)', letterSpacing:'0.03em', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'58px', margin:'1px auto 0' }}>
                  {col.val.length > 10 ? col.val.slice(0,10)+'.' : col.val}
                </div>
              </div>
            ))}
          </div>

          {/* ─── RODAPÉ tagline ─── */}
          <div style={{ padding:'5px 10px 10px', background:'#000', display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ height:'1px', flex:1, background:`linear-gradient(to right,transparent,${tier.color}60)` }} />
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'6px', fontWeight:700, fontStyle:'italic', letterSpacing:'0.10em', whiteSpace:'nowrap' }}>
              <span style={{ color:'rgba(255,255,255,0.40)' }}>{tagPart1} </span>
              <span style={{ color:GREEN, textShadow:`0 0 8px ${GREEN}` }}>{tagPart2}</span>
            </div>
            <div style={{ height:'1px', flex:1, background:`linear-gradient(to left,transparent,${tier.color}60)` }} />
          </div>

        </div>
      </div>
    </>
  )
}

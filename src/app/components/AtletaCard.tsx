'use client'

/**
 * AtletaCard — card premium estilo FIFA Ultimate Team.
 * Tier automático por OVR: Bronze (<50) · Prata (50-79) · Ouro (≥80)
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

// ─── Tier config ──────────────────────────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 80) return {
    label: 'CARD OURO', color: '#d4a017', glow: '#f5c842', bg: '#0a0700',
  }
  if (ovr !== null && ovr >= 50) return {
    label: 'CARD PRATA', color: '#a8a8a5', glow: '#d8d8d4', bg: '#07070a',
  }
  return {
    label: 'CARD BRONZE', color: '#D85A30', glow: '#f07040', bg: '#0a0603',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function tagline(posicao: string | null | undefined) {
  const p = (posicao ?? '').toLowerCase()
  if (p.includes('atacante') || p.includes('avante')) return ['NASCIDO PARA FAZER', 'HISTÓRIA']
  if (p.includes('meia') || p.includes('volante'))    return ['O JOGO PASSA PELOS', 'SEUS PÉS']
  if (p.includes('zagueiro') || p.includes('lateral')) return ['A MURALHA QUE', 'NINGUÉM PASSA']
  if (p.includes('goleiro'))                           return ['A ÚLTIMA', 'BARREIRA']
  return ['SEU TALENTO,', 'SUA IDENTIDADE']
}

// Stats FIFA: PAC SHO PAS DRI DEF PHY
const FIFA_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']
function getFifaStats(a: AtributosMap | null | undefined): (number | null)[] {
  if (!a) return [null, null, null, null, null, null]
  return [
    a.vel   ?? null,  // PAC
    a.fin   ?? null,  // SHO
    a.vis   ?? null,  // PAS
    a.tec   ?? null,  // DRI
    a.pos   ?? null,  // DEF
    a.forca ?? null,  // PHY
  ]
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
  const tier      = getTier(ovr)
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = !!foto && !imgErr
  const stats     = getFifaStats(atributos)
  const hasStats  = stats.some(s => s !== null)
  const [tagPart1, tagPart2] = tagline(posicao)

  const parts    = nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()

  const GREEN = '#00FF88'

  return (
    <>
      <style>{`
        @keyframes acFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes acShimmer { 0%{left:-80%} 100%{left:160%} }
        .ac-root { transition: transform .22s ease; }
        .ac-root:hover { transform: translateY(-5px) scale(1.01); }
        .ac-shimmer {
          position:absolute; top:0; bottom:0; width:45%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);
          transform:skewX(-18deg);
          animation:acShimmer 5s ease-in-out infinite 3s;
          pointer-events:none; z-index:1;
        }
      `}</style>

      <div
        className="ac-root"
        style={{
          width,
          position:   'relative',
          flexShrink: 0,
          cursor:     href ? 'pointer' : 'default',
          animation:  animate ? 'acFloat 5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Link overlay */}
        {href && (
          <Link
            href={href}
            style={{ position:'absolute', inset:0, zIndex:20, borderRadius:'16px' }}
            aria-label={`Ver perfil de ${nome}`}
          />
        )}

        {/* ── Card principal ── */}
        <div style={{
          background:   tier.bg,
          borderRadius: '14px',
          overflow:     'hidden',
          position:     'relative',
          boxShadow:    `0 0 0 1.5px ${tier.color}, 0 0 28px ${tier.glow}44, 0 20px 48px rgba(0,0,0,0.85)`,
        }}>
          <div className="ac-shimmer" />

          {/* ── Header tier ── */}
          <div style={{
            position:   'relative',
            padding:    '7px 0 5px',
            background: `linear-gradient(180deg,${tier.bg} 0%,transparent 100%)`,
            textAlign:  'center',
            zIndex:     2,
          }}>
            {/* Linhas decorativas */}
            <div style={{
              position:'absolute', top:'50%', left:'12px', right:'12px', height:'1px',
              background:`linear-gradient(90deg,transparent,${tier.color}80,${tier.color}80,transparent)`,
              transform:'translateY(-50%)',
            }} />
            <span style={{
              position:       'relative',
              fontSize:       '8px',
              fontWeight:     900,
              color:          tier.color,
              letterSpacing:  '0.18em',
              textShadow:     `0 0 10px ${tier.glow}`,
              background:     tier.bg,
              padding:        '0 8px',
              zIndex:         1,
            }}>
              {tier.label}
            </span>
          </div>

          {/* ── Foto + OVR (bloco superior) ── */}
          <div style={{ position:'relative', height:'155px', overflow:'hidden' }}>

            {/* Foto ou iniciais */}
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto!}
                alt={nome}
                onError={() => setImgErr(true)}
                style={{
                  position:'absolute', inset:0,
                  width:'100%', height:'100%',
                  objectFit:'cover', objectPosition:'center 10%',
                }}
              />
            ) : (
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:`radial-gradient(circle at 60% 40%, ${tier.color}18 0%, transparent 70%)`,
              }}>
                <span style={{
                  fontSize:'36px', fontWeight:900,
                  color:`${tier.color}88`, letterSpacing:'-0.02em',
                }}>
                  {initials(nome)}
                </span>
              </div>
            )}

            {/* Gradientes sobre foto */}
            <div style={{
              position:'absolute', inset:0,
              background:`linear-gradient(to bottom, ${tier.bg}dd 0%, transparent 35%, transparent 55%, ${tier.bg}ee 85%, ${tier.bg} 100%)`,
              pointerEvents:'none',
            }} />
            <div style={{
              position:'absolute', inset:0,
              background:`linear-gradient(to right, ${tier.bg}cc 0%, transparent 50%)`,
              pointerEvents:'none',
            }} />

            {/* Brilho cristal (canto direito) */}
            <div style={{
              position:'absolute', top:'-20px', right:'-20px',
              width:'120px', height:'160px',
              background:`radial-gradient(ellipse at center, ${GREEN}22 0%, transparent 70%)`,
              pointerEvents:'none',
            }} />

            {/* MC Logo + OVR (esquerda, sobre foto) */}
            <div style={{ position:'absolute', top:'6px', left:'8px', zIndex:3 }}>
              {/* MC badge */}
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'6px' }}>
                <div style={{
                  width:'22px', height:'22px', borderRadius:'50%',
                  border:`1.5px solid ${GREEN}90`,
                  background:`${GREEN}18`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'7px', fontWeight:900, color:GREEN,
                }}>MC</div>
                <div style={{ lineHeight:1.1 }}>
                  <div style={{ fontSize:'6px', fontWeight:700, color:'rgba(255,255,255,0.70)' }}>MEU</div>
                  <div style={{ fontSize:'6px', fontWeight:700, color:GREEN }}>CRAQUE</div>
                </div>
              </div>
              {/* OVR */}
              <div style={{ fontSize:'7px', fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em' }}>OVR</div>
              <div style={{
                fontSize:'48px', fontWeight:900, color:GREEN, lineHeight:0.9,
                textShadow:`0 0 20px ${GREEN}99`,
                letterSpacing:'-0.04em',
              }}>
                {ovr ?? '—'}
              </div>
            </div>

            {/* Rank + badge NOVO (direita, sobre foto) */}
            <div style={{ position:'absolute', top:'6px', right:'8px', zIndex:3, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
              {rank != null && (
                <div style={{
                  fontSize: rank <= 3 ? '18px' : '10px',
                  fontWeight: 900, lineHeight: 1,
                  color: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7c3e' : 'rgba(255,255,255,0.30)',
                }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </div>
              )}
              {isNew && (
                <div style={{
                  padding:'2px 5px', borderRadius:'4px',
                  background:`${GREEN}18`, border:`1px solid ${GREEN}50`,
                  fontSize:'6px', fontWeight:900, color:GREEN, letterSpacing:'0.1em',
                }}>NOVO</div>
              )}
            </div>
          </div>

          {/* ── Nome ── */}
          <div style={{ padding:'4px 10px 2px' }}>
            {firstName && (
              <div style={{
                fontSize:'10px', fontWeight:700,
                color:'rgba(255,255,255,0.88)', letterSpacing:'0.06em',
                lineHeight:1,
              }}>{firstName}</div>
            )}
            <div style={{
              fontSize:'20px', fontWeight:900,
              color:GREEN, lineHeight:1,
              letterSpacing:'-0.01em',
              textShadow:`0 0 14px ${GREEN}66`,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{lastName}</div>
          </div>

          {/* ── ID + Bandeira ── */}
          {athleteId && (
            <div style={{
              margin:'4px 8px',
              padding:'4px 8px',
              borderRadius:'6px',
              background:'rgba(0,0,0,0.45)',
              border:`1px solid ${tier.color}30`,
              display:'flex', alignItems:'center', gap:'6px',
            }}>
              <div>
                <div style={{ fontSize:'5.5px', color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.1em' }}>ID ÚNICO</div>
                <div style={{ fontSize:'11px', fontWeight:900, color:GREEN, lineHeight:1.1 }}>
                  {athleteId.replace(/^MC-/, '')}
                </div>
              </div>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:'4px', justifyContent:'center' }}>
                <span style={{ fontSize:'10px' }}>🇧🇷</span>
                <span style={{ fontSize:'7px', fontWeight:700, color:'rgba(255,255,255,0.60)', letterSpacing:'0.05em' }}>BRASIL</span>
              </div>
            </div>
          )}

          {/* ── Stats FIFA ── */}
          <div style={{
            display:'flex',
            margin:'4px 8px',
            borderRadius:'6px',
            background:'rgba(0,0,0,0.45)',
            border:`1px solid ${tier.color}20`,
            overflow:'hidden',
          }}>
            {FIFA_LABELS.map((label, i) => (
              <div key={label} style={{
                flex:1, textAlign:'center',
                padding:'4px 0',
                borderLeft: i > 0 ? `1px solid rgba(255,255,255,0.07)` : 'none',
              }}>
                <div style={{
                  fontSize:'12px', fontWeight:900, lineHeight:1,
                  color: hasStats && stats[i] !== null ? GREEN : 'rgba(255,255,255,0.15)',
                  textShadow: stats[i] !== null ? `0 0 8px ${GREEN}77` : 'none',
                }}>
                  {stats[i] !== null ? String(stats[i]) : '—'}
                </div>
                <div style={{
                  fontSize:'5.5px', color:'rgba(255,255,255,0.35)',
                  letterSpacing:'0.06em', marginTop:'2px', fontWeight:700,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Rodapé info ── */}
          <div style={{
            display:'flex',
            margin:'4px 8px',
            borderRadius:'6px',
            background:'rgba(0,0,0,0.45)',
            border:`1px solid ${tier.color}20`,
            overflow:'hidden',
          }}>
            {[
              { icon:'⚽', label:'POSIÇÃO', val:(posicao ?? '—').toUpperCase() },
              { icon:'📅', label:'IDADE',   val:(categoria ?? '—').toUpperCase() },
            ].map((col, i) => (
              <div key={col.label} style={{
                flex:1, textAlign:'center', padding:'4px 2px',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <div style={{ fontSize:'9px', lineHeight:1, marginBottom:'2px' }}>{col.icon}</div>
                <div style={{ fontSize:'5.5px', color:'rgba(255,255,255,0.32)', fontWeight:700, letterSpacing:'0.08em' }}>{col.label}</div>
                <div style={{
                  fontSize:'7px', fontWeight:800,
                  color:'rgba(255,255,255,0.80)',
                  letterSpacing:'0.02em', lineHeight:1.2, marginTop:'1px',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  maxWidth:'60px', margin:'1px auto 0',
                }}>
                  {col.val.length > 10 ? col.val.slice(0,10) + '.' : col.val}
                </div>
              </div>
            ))}
          </div>

          {/* ── Tagline ── */}
          <div style={{
            textAlign:'center', padding:'4px 8px 8px',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
          }}>
            <div style={{ height:'1px', flex:1, background:`linear-gradient(to right, transparent, ${GREEN}40)` }} />
            <div style={{ fontSize:'6px', fontWeight:700, fontStyle:'italic', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
              <span style={{ color:'rgba(255,255,255,0.42)' }}>{tagPart1} </span>
              <span style={{ color:GREEN }}>{tagPart2}</span>
            </div>
            <div style={{ height:'1px', flex:1, background:`linear-gradient(to left, transparent, ${GREEN}40)` }} />
          </div>

        </div>
      </div>
    </>
  )
}

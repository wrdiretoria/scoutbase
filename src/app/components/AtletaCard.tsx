'use client'

/**
 * AtletaCard — card padrão reutilizável em toda a plataforma.
 * Baseado no HeroCard, proporcional (retrato), borda colorida por tier.
 *
 * Props:
 *   nome       — nome completo do atleta
 *   ovr        — nota OVR (null → mostra "—", tier Bronze)
 *   foto       — URL da foto de perfil (null → iniciais como fallback)
 *   posicao    — posição completa ("Atacante", "Goleiro"…)
 *   categoria  — ex. "Sub-17", "Amador" — aparece se não houver avaliação
 *   atributos  — mapa dos 6 atributos; null → traços nos stats
 *   avaliadoPor— nome do treinador avaliador
 *   href       — link do perfil (overlay invisível cobre o card inteiro)
 *   rank       — posição no ranking (1→🥇, 2→🥈, 3→🥉, >3→#N)
 *   animate    — ativa animação flutuante (default false)
 *   isNew      — badge "NOVO" verde (default false)
 *   width      — largura do card (default "200px")
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
  nome:        string
  ovr:         number | null
  foto:        string | null
  posicao?:    string | null
  categoria?:  string | null
  atributos?:  AtributosMap | null
  avaliadoPor?: string | null
  href?:       string
  rank?:       number | null
  animate?:    boolean
  isNew?:      boolean
  width?:      string | number
}

// ─── Tier ─────────────────────────────────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 85) return {
    label:  'OURO',
    card:   'linear-gradient(160deg,#2a1a00 0%,#1e1200 55%,#0e0900 100%)',
    border: 'rgba(212,168,67,0.55)',
    glow:   'rgba(212,168,67,0.30)',
    ovrClr: '#f0c040',
    accent: '#d4a843',
    badge:  'linear-gradient(135deg,#b8860b,#f0c040)',
    posBg:  'rgba(212,168,67,0.12)',
  }
  if (ovr !== null && ovr >= 70) return {
    label:  'PRATA',
    card:   'linear-gradient(160deg,#1a1a1f 0%,#111118 55%,#08080e 100%)',
    border: 'rgba(192,192,210,0.45)',
    glow:   'rgba(180,180,200,0.22)',
    ovrClr: '#d0d0e8',
    accent: '#a0a0c0',
    badge:  'linear-gradient(135deg,#707080,#c0c0d8)',
    posBg:  'rgba(192,192,210,0.12)',
  }
  return {
    label:  'BRONZE',
    card:   'linear-gradient(160deg,#1f1008 0%,#140b05 55%,#0a0603 100%)',
    border: 'rgba(180,100,40,0.50)',
    glow:   'rgba(180,100,40,0.22)',
    ovrClr: '#d4804a',
    accent: '#c87040',
    badge:  'linear-gradient(135deg,#7a3a10,#d4804a)',
    posBg:  'rgba(180,100,40,0.12)',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

const POS_MAP: Record<string, string> = {
  'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
  'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
  'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
  'Atacante': 'ATA', 'Centro-Avante': 'CA',
}
function posAbrev(pos: string | null | undefined): string {
  if (!pos) return ''
  return POS_MAP[pos] ?? pos.slice(0, 3).toUpperCase()
}

const STAT_KEYS:   (keyof AtributosMap)[] = ['vel', 'fin', 'tec', 'vis', 'forca', 'pos']
const STAT_LABELS: string[]               = ['VEL', 'FIN', 'TEC', 'VIS', 'FOR',   'POS']

// ─── Component ────────────────────────────────────────────────────────────────

export default function AtletaCard({
  nome,
  ovr,
  foto,
  posicao,
  categoria,
  atributos,
  avaliadoPor,
  href,
  rank,
  animate = false,
  isNew   = false,
  width   = '200px',
}: AtletaCardProps) {
  const tier      = getTier(ovr)
  const pos       = posAbrev(posicao)
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = !!foto && !imgErr

  // Monta array de stats: valor ou "—"
  const cardStats = STAT_KEYS.map(k => {
    const v = atributos?.[k]
    return v != null ? String(v) : '—'
  })

  return (
    <>
      {/* Keyframes — injetados uma vez, não duplicam em CSS real */}
      <style>{`
        @keyframes atletaCardFloat {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-10px); }
        }
        @keyframes atletaCardShimmer {
          0%   { left: -80%;  }
          100% { left: 160%;  }
        }
        .ac-shimmer {
          position: absolute; top: 0; bottom: 0; width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transform: skewX(-18deg);
          animation: atletaCardShimmer 4.5s ease-in-out infinite 2.2s;
          pointer-events: none; z-index: 0;
        }
        .ac-root { transition: transform .22s ease; }
        .ac-root:hover { transform: translateY(-5px); }
      `}</style>

      <div
        className="ac-root"
        style={{
          width,
          position:   'relative',
          flexShrink: 0,
          cursor:     href ? 'pointer' : 'default',
          animation:  animate ? 'atletaCardFloat 5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Link invisível cobre o card inteiro — mesma abordagem do LiveFeed */}
        {href && (
          <Link
            href={href}
            style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: '22px' }}
            aria-label={`Ver perfil de ${nome}`}
          />
        )}

        {/* ── Corpo do card ── */}
        <div style={{
          background:   tier.card,
          borderRadius: '22px',
          border:       `1.5px solid ${isNew ? 'rgba(0,255,136,0.50)' : tier.border}`,
          overflow:     'hidden',
          position:     'relative',
          boxShadow:    `0 0 60px ${tier.glow}, 0 24px 56px rgba(0,0,0,0.75)`,
        }}>
          <div className="ac-shimmer" />

          {/* Linha de topo (acento tier) */}
          <div style={{
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${tier.accent}, transparent)`,
          }} />

          {/* OVR + badges */}
          <div style={{ padding: '12px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            {/* Esquerda: OVR grande */}
            <div>
              <div style={{
                fontSize: '52px', fontWeight: 900, color: tier.ovrClr,
                lineHeight: 1, letterSpacing: '-0.04em',
                textShadow: `0 0 24px ${tier.glow}`,
              }}>
                {ovr ?? '—'}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: 800,
                color: 'rgba(255,255,255,0.60)',
                letterSpacing: '0.12em', marginTop: '2px',
              }}>
                OVR
              </div>
            </div>

            {/* Direita: tier badge + rank + MC logo + bola */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              {/* Tier */}
              <div style={{
                padding: '3px 8px', borderRadius: '6px', background: tier.badge,
                fontSize: '7px', fontWeight: 900, color: 'rgba(0,0,0,0.75)', letterSpacing: '0.12em',
              }}>
                {tier.label}
              </div>

              {/* Rank */}
              {rank != null && (
                <div style={{
                  fontSize:   rank <= 3 ? '20px' : '11px',
                  fontWeight: 900, lineHeight: 1,
                  color: rank === 1 ? '#f59e0b'
                       : rank === 2 ? '#94a3b8'
                       : rank === 3 ? '#cd7c3e'
                       : 'rgba(255,255,255,0.30)',
                }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </div>
              )}

              {/* Badge NOVO */}
              {isNew && (
                <div style={{
                  padding: '2px 6px', borderRadius: '100px',
                  background: 'rgba(0,255,136,0.12)',
                  border: '1px solid rgba(0,255,136,0.35)',
                  fontSize: '6.5px', fontWeight: 800,
                  color: '#00FF88', letterSpacing: '0.10em',
                }}>
                  NOVO
                </div>
              )}

              {/* Logo MC */}
              <div style={{
                width: '30px', height: '30px',
                background: 'rgba(255,255,255,0.06)', borderRadius: '7px',
                border: `1px solid ${tier.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 900, color: tier.ovrClr, letterSpacing: '0.04em',
              }}>MC</div>

              <span style={{ fontSize: '18px', lineHeight: 1 }}>⚽</span>
            </div>
          </div>

          {/* Foto / iniciais */}
          <div style={{
            height: '148px', margin: '8px 12px',
            borderRadius: '14px', overflow: 'hidden',
            position: 'relative', border: `1px solid ${tier.border}`,
            background: '#0a140d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto!}
                alt={nome}
                onError={() => setImgErr(true)}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 10%',
                }}
              />
            ) : (
              <span style={{
                fontSize: '32px', fontWeight: 900,
                color: 'rgba(255,255,255,0.50)',
                letterSpacing: '-0.02em', userSelect: 'none',
              }}>
                {initials(nome)}
              </span>
            )}

            {/* Gradiente base da foto */}
            {showPhoto && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
            )}

            {/* Glow interno do tier */}
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: `inset 0 0 20px ${tier.glow}`,
              borderRadius: '14px', pointerEvents: 'none',
            }} />
          </div>

          {/* Nome */}
          <div style={{ padding: '0 14px 10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
              <div style={{ height: '1px', flex: 1, background: tier.border }} />
              <span style={{
                fontSize: '11px', fontWeight: 900, color: 'white',
                letterSpacing: '0.10em', textTransform: 'uppercase',
              }}>
                {nome.split(' ').slice(0, 2).join(' ')}
              </span>
              <div style={{ height: '1px', flex: 1, background: tier.border }} />
            </div>

            {/* Avaliado por OU posição + categoria */}
            {avaliadoPor ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(0,255,136,0.06)',
                border: '1px solid rgba(0,255,136,0.18)',
              }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF88', flexShrink: 0 }} />
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.40)', letterSpacing: '0.04em' }}>
                  avaliado por{' '}
                  <span style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>
                    {avaliadoPor.split(' ')[0]}
                  </span>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                {pos && (
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: tier.accent,
                    background: tier.posBg,
                    border: `1px solid ${tier.border}`,
                    borderRadius: '5px', padding: '1.5px 6px', letterSpacing: '0.06em',
                  }}>
                    {pos}
                  </span>
                )}
                {categoria && (
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)' }}>
                    {categoria}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats footer: VEL FIN TEC VIS FOR POS */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            padding: '10px 10px 14px',
            borderTop: `1px solid ${tier.border}`,
            background: 'rgba(0,0,0,0.35)',
          }}>
            {STAT_LABELS.map((label, i) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '13px', fontWeight: 900, lineHeight: 1,
                  color: cardStats[i] === '—' ? 'rgba(255,255,255,0.18)' : tier.ovrClr,
                }}>
                  {cardStats[i]}
                </div>
                <div style={{
                  fontSize: '7px', color: 'rgba(255,255,255,0.32)',
                  letterSpacing: '0.06em', marginTop: '3px',
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

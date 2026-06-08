'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { AtletaCardProps } from './AtletaCard'

// ── Tier ──────────────────────────────────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 80) return { color: '#F5C518', bg: '#0e0b00', border: '#F5C51828', pill: '#F5C51820' }
  if (ovr !== null && ovr >= 50) return { color: '#bdbdbd', bg: '#0d0d0d', border: '#9e9e9e22', pill: '#9e9e9e18' }
  return                               { color: '#cd7f32', bg: '#0c0800', border: '#cd7f3228', pill: '#cd7f3218' }
}

function initials(nome: string) {
  return nome.trim().split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function posAbrev(posicao: string | null | undefined): string | null {
  if (!posicao) return null
  const p = posicao.toLowerCase()
  if (p.includes('goleiro'))  return 'Goleiro'
  if (p.includes('lateral'))  return 'Lateral'
  if (p.includes('zagueiro')) return 'Zagueiro'
  if (p.includes('volante'))  return 'Volante'
  if (p.includes('meia') || p.includes('armador')) return 'Meia'
  if (p.includes('atacante') || p.includes('avante') || p.includes('ponta')) return 'Atacante'
  return posicao
}

function toFifa(v: number | null | undefined): string {
  if (v == null) return '—'
  return String(Math.min(99, Math.round(v * 9.9)))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AtletaCardRow({
  nome,
  ovr,
  foto,
  posicao,
  categoria,
  atributos,
  href,
  rank,
  athleteId,
}: AtletaCardProps) {
  const tier = getTier(ovr)
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = !!foto && !imgErr

  const parts    = nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : nome).toUpperCase()
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : ''

  const fifaStats = [
    { label: 'PAC', val: toFifa(atributos?.vel) },
    { label: 'SHO', val: toFifa(atributos?.fin) },
    { label: 'PAS', val: toFifa(atributos?.vis) },
    { label: 'DRI', val: toFifa(atributos?.tec) },
    { label: 'DEF', val: toFifa(atributos?.pos) },
    { label: 'PHY', val: toFifa(atributos?.forca) },
  ]
  const hasStats = fifaStats.some(s => s.val !== '—')
  const mcId = athleteId?.replace('MC-', '') ?? null
  const pos  = posAbrev(posicao)

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: tier.bg,
      border: `1px solid ${tier.border}`,
      borderRadius: '14px',
      padding: '14px 18px',
      cursor: href ? 'pointer' : 'default',
      transition: 'border-color .18s, box-shadow .18s',
    }}
      onMouseEnter={e => {
        if (!href) return
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${tier.color}55`
        el.style.boxShadow   = `0 4px 24px ${tier.color}14`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = tier.border
        el.style.boxShadow   = 'none'
      }}
    >
      {href && (
        <Link href={href} style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: '14px' }} aria-label={`Ver perfil de ${nome}`} />
      )}

      {/* ── Rank ── */}
      {rank != null && (
        <div style={{ flexShrink: 0, width: '28px', textAlign: 'center' }}>
          {rank <= 3 ? (
            <span style={{ fontSize: '20px' }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.22)' }}>#{rank}</span>
          )}
        </div>
      )}

      {/* ── Foto ── */}
      <div style={{
        flexShrink: 0,
        width: '72px', height: '72px',
        borderRadius: '10px',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at center, ${tier.color}18 0%, #111 100%)`,
        border: `1px solid ${tier.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto!}
            alt={nome}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
          />
        ) : (
          <span style={{ fontSize: '22px', fontWeight: 900, color: `${tier.color}66` }}>
            {initials(nome)}
          </span>
        )}
      </div>

      {/* ── Info principal ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nome */}
        <div style={{ marginBottom: '4px' }}>
          {firstName && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', fontWeight: 500, marginRight: '6px' }}>
              {firstName}
            </span>
          )}
          <span style={{
            fontSize: '20px', fontWeight: 900, color: tier.color,
            letterSpacing: '-0.01em',
            textShadow: `0 0 16px ${tier.color}33`,
          }}>
            {lastName}
          </span>
        </div>

        {/* Posição + Categoria + ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: hasStats ? '8px' : '0' }}>
          {pos && (
            <span style={{
              fontSize: '10px', fontWeight: 700, color: tier.color,
              background: tier.pill,
              padding: '2px 8px', borderRadius: '20px',
              letterSpacing: '0.06em',
            }}>
              {pos.toUpperCase()}
            </span>
          )}
          {categoria && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {categoria}
            </span>
          )}
          {mcId && (
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', fontWeight: 600, letterSpacing: '0.06em' }}>
              ID {mcId}
            </span>
          )}
        </div>

        {/* Atributos FIFA */}
        {hasStats && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {fifaStats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: s.val === '—' ? 'rgba(255,255,255,0.15)' : tier.color, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', marginTop: '1px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── OVR + Bandeira + Seta ── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        {/* OVR pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', borderRadius: '20px',
          background: tier.pill, border: `1px solid ${tier.border}`,
        }}>
          <span style={{ fontSize: '20px' }}>🇧🇷</span>
          <div>
            <div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.10em', lineHeight: 1 }}>OVR</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: tier.color, lineHeight: 1 }}>{ovr ?? '—'}</div>
          </div>
        </div>
        {/* Seta */}
        <span style={{ fontSize: '14px', color: `${tier.color}60` }}>→</span>
      </div>

    </div>
  )
}

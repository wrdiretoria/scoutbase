'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { AtributosMap, AtletaCardProps } from './AtletaCard'

// ── Tier ──────────────────────────────────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 85) return { color: '#F5C518', bg: '#0e0b00', border: '#F5C51840', medal: '🥇' }
  if (ovr !== null && ovr >= 70) return { color: '#bdbdbd', bg: '#0d0d0d', border: '#9e9e9e30', medal: '🥈' }
  if (ovr !== null && ovr >= 50) return { color: '#cd7f32', bg: '#0c0800', border: '#cd7f3235', medal: '🥉' }
  return                               { color: '#6b7280', bg: '#0a0a0a', border: '#6b728025', medal: null }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.trim().split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function posAbrev(posicao: string | null | undefined): string {
  if (!posicao) return '—'
  const p = posicao.toLowerCase()
  if (p.includes('goleiro'))                              return 'GOL'
  if (p.includes('lateral'))                             return 'LAT'
  if (p.includes('zagueiro'))                            return 'ZAG'
  if (p.includes('volante'))                             return 'VOL'
  if (p.includes('meia') || p.includes('armador'))       return 'MEI'
  if (p.includes('atacante') || p.includes('avante') || p.includes('ponta') || p.includes('centro')) return 'ATA'
  return posicao.slice(0, 3).toUpperCase()
}

function formatViews(v: number | null | undefined): string {
  if (v == null || v === 0) return '0'
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.0', '')}k`
  return String(v)
}

function toFifa(v: number | null | undefined): string {
  if (v == null) return '—'
  return String(Math.min(99, Math.max(0, Math.round(v))))
}

function flagEmoji(nac: string | null | undefined): string {
  const n = (nac ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n.includes('paraguai') || n.includes('paraguay')) return '🇵🇾'
  if (n.includes('argentina')) return '🇦🇷'
  if (n.includes('uruguai') || n.includes('uruguay')) return '🇺🇾'
  if (n.includes('colombia')) return '🇨🇴'
  if (n.includes('chile')) return '🇨🇱'
  if (n.includes('peru')) return '🇵🇪'
  if (n.includes('bolivia')) return '🇧🇴'
  if (n.includes('venezuela')) return '🇻🇪'
  if (n.includes('equador') || n.includes('ecuador')) return '🇪🇨'
  if (n.includes('portugal')) return '🇵🇹'
  if (n.includes('espanha') || n.includes('spain') || n.includes('espana')) return '🇪🇸'
  return '🇧🇷'
}

function tagline(posicao: string | null | undefined): string {
  const p = (posicao ?? '').toLowerCase()
  if (p.includes('atacante') || p.includes('avante')) return 'NASCIDO PARA FAZER HISTÓRIA'
  if (p.includes('meia') || p.includes('volante'))    return 'O JOGO PASSA PELOS SEUS PÉS'
  if (p.includes('zagueiro') || p.includes('lateral')) return 'A MURALHA QUE NINGUÉM PASSA'
  if (p.includes('goleiro'))                           return 'A ÚLTIMA BARREIRA'
  return 'SEU TALENTO, SUA IDENTIDADE'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AtletaCardLanding({
  nome,
  ovr,
  foto,
  posicao,
  categoria,
  atributos,
  href,
  rank,
  width = '200px',
  athleteId,
}: AtletaCardProps) {
  const tier = getTier(ovr)
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = !!foto && !imgErr

  // Busca posição + atributos + categoria do próprio card, sem depender da seção
  const athleteUuid = href ? href.split('/').pop() ?? null : null
  const [extraData, setExtraData] = useState<{
    posicao: string | null
    atributos: AtributosMap | null
    categoria: string | null
    views: number | null
    nacionalidade: string | null
  } | null>(null)

  useEffect(() => {
    if (!athleteUuid) return
    // Só busca se ainda falta posicao ou atributos
    if (posicao !== null && atributos !== null) return
    fetch(`/api/atleta/card-data?id=${athleteUuid}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setExtraData(data) })
      .catch(() => {/* silencioso */})
  }, [athleteUuid, posicao, atributos, categoria])

  const resolvedPosicao   = posicao   ?? extraData?.posicao   ?? null
  const resolvedAtributos = atributos ?? extraData?.atributos ?? null
  const resolvedCategoria = categoria ?? extraData?.categoria ?? null
  const resolvedViews        = extraData?.views ?? null
  const resolvedNacionalidade = extraData?.nacionalidade ?? null

  const parts     = nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : nome).toUpperCase()
  // Só o PRIMEIRO nome (não todo o resto) — evita quebra de linha em nomes longos
  const firstName = (parts.length > 1 ? parts[0] : '').toUpperCase()

  const fifaStats = [
    { label: 'VEL', val: toFifa(resolvedAtributos?.vel) },
    { label: 'TEC', val: toFifa(resolvedAtributos?.tec) },
    { label: 'DRI', val: toFifa(resolvedAtributos?.dri) },
    { label: 'FIS', val: toFifa(resolvedAtributos?.fis) },
    { label: 'TAT', val: toFifa(resolvedAtributos?.tat) },
    { label: 'POS', val: toFifa(resolvedAtributos?.pos) },
  ]
  const hasAttrData = fifaStats.some(s => s.val !== '—')

  const mcIdNum = athleteId ? athleteId.replace(/^MC-/, '') : null

  return (
    <div style={{
      width,
      flexShrink: 0,
      borderRadius: '14px',
      background: tier.bg,
      border: `1px solid ${tier.border}`,
      overflow: 'hidden',
      position: 'relative',
      cursor: href ? 'pointer' : 'default',
      transition: 'transform .2s ease, box-shadow .2s ease',
    }}
      onMouseEnter={e => {
        if (!href) return
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${tier.color}22`
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {href && (
        <Link href={href} style={{ position: 'absolute', inset: 0, zIndex: 10 }} aria-label={`Ver perfil de ${nome}`} />
      )}

      {/* ── TOPO: MC bolinha + posição ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px 6px',
      }}>
        {/* Bolinha MC */}
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          border: `1.5px solid ${tier.color}60`,
          background: `${tier.color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '7px', fontWeight: 900, color: tier.color, letterSpacing: '0.04em',
        }}>
          MC
        </div>
        {/* Medalha por OVR (prioridade) ou rank numérico */}
        {tier.medal ? (
          <span style={{ fontSize: '16px', lineHeight: 1 }}>{tier.medal}</span>
        ) : rank != null && rank > 3 ? (
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.25)' }}>
            #{rank}
          </span>
        ) : null}
        {/* Posição abreviada */}
        <div style={{
          padding: '3px 8px', borderRadius: '6px',
          background: `${tier.color}18`,
          fontSize: '9px', fontWeight: 800, color: tier.color,
          letterSpacing: '0.10em',
        }}>
          {posAbrev(resolvedPosicao)}
        </div>
      </div>

      {/* ── FOTO ── */}
      <div style={{ position: 'relative', height: '130px', margin: '0 12px', borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto!}
            alt={nome}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${tier.color}18 0%, transparent 70%)`,
          }}>
            <span style={{ fontSize: '38px', fontWeight: 900, color: `${tier.color}55`, letterSpacing: '-0.02em' }}>
              {initials(nome)}
            </span>
          </div>
        )}
        {/* Gradiente inferior */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: `linear-gradient(to top, ${tier.bg}, transparent)` }} />
      </div>

      {/* ── NOME — firstName sempre ocupa altura (evita colapso) ── */}
      <div style={{ padding: '8px 12px 6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', lineHeight: 1, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minHeight: '12px' }}>
          {firstName || ' '}
        </div>
        <div style={{
          fontSize: '22px', fontWeight: 900, color: tier.color,
          lineHeight: 0.95, letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: `0 0 20px ${tier.color}44`,
        }}>
          {lastName}
        </div>
      </div>

      {/* ── DIVISOR ── */}
      <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${tier.color}40, transparent)`, margin: '0 12px' }} />

      {/* ── ID + BANDEIRA + OVR pill ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px' }}>
        {/* ID */}
        <div>
          <div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ID ÚNICO</div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: tier.color, letterSpacing: '0.04em', lineHeight: 1 }}>
            {mcIdNum ?? '—'}
          </div>
        </div>
        {/* Bandeira + views + OVR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>{flagEmoji(resolvedNacionalidade)}</span>
          {resolvedViews != null && (
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              👁 {formatViews(resolvedViews)}
            </span>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '20px',
            background: `${tier.color}18`, border: `1px solid ${tier.color}35`,
          }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.10em' }}>OVR</span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: tier.color, lineHeight: 1 }}>
              {ovr ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 6 ATRIBUTOS — sempre presente para altura uniforme ── */}
      <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${tier.color}30, transparent)`, margin: '0 12px' }} />
      <div style={{ display: 'flex', padding: '6px 8px' }}>
        {fifaStats.map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            padding: '3px 0',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1, color: hasAttrData ? tier.color : 'rgba(255,255,255,0.12)' }}>
              {s.val}
            </div>
            <div style={{ fontSize: '5.5px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.06em', marginTop: '2px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── POSIÇÃO + CATEGORIA — sempre presente para altura uniforme ── */}
      <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${tier.color}25, transparent)`, margin: '0 12px' }} />
      <div style={{ display: 'flex', padding: '5px 8px' }}>
        {[
          { icon: '⚽', label: 'POSIÇÃO', val: resolvedPosicao ? resolvedPosicao.toUpperCase().slice(0, 10) : '—' },
          { icon: '🏷️', label: 'CATEG.',  val: resolvedCategoria ? resolvedCategoria.toUpperCase() : '—' },
        ].map((col, i) => (
          <div key={col.label} style={{
            flex: 1, textAlign: 'center',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ fontSize: '9px', marginBottom: '1px' }}>{col.icon}</div>
            <div style={{ fontSize: '5.5px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>{col.label}</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: col.val === '—' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px', margin: '1px auto 0' }}>
              {col.val}
            </div>
          </div>
        ))}
      </div>

      {/* ── TAGLINE ── */}
      <div style={{
        padding: '5px 12px 10px',
        fontSize: '6px', fontWeight: 700, fontStyle: 'italic',
        color: `${tier.color}55`, letterSpacing: '0.08em',
        textAlign: 'center', textTransform: 'uppercase',
      }}>
        {tagline(resolvedPosicao)}
      </div>

    </div>
  )
}

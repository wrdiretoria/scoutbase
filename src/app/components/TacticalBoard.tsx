'use client'

/**
 * TacticalBoard — Formação 4-3-3 com os melhores atletas reais
 * Dados: /api/landing/tactical
 * Retorna null se não houver atletas avaliados.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { TacticalData, TacticalPlayer } from '@/app/api/landing/tactical/route'

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

function avatarBg(nome: string) {
  const COLORS = ['#14532d','#1e3a5f','#5f1e3a','#3a5f1e','#3a1e5f','#6b3a1a','#1a5f5f','#4c1d95']
  const i = (nome.charCodeAt(0) + (nome.charCodeAt(1) ?? 0)) % COLORS.length
  return COLORS[i]
}

// ── PlayerDot ─────────────────────────────────────────────────────────────────

function PlayerDot({ player, label }: { player: TacticalPlayer | null; label: string }) {
  if (!player) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px dashed rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '18px', opacity: 0.3 }}>⚽</span>
        </div>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
    )
  }

  const cor = ovrColor(player.ovr)
  const href = player.mcId ? `/atleta/${player.mcId.replace('MC-', '')}` : '#'
  const foto = player.fotos[0] ?? null

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      {/* Avatar */}
      <div style={{
        position: 'relative',
        width: '44px', height: '44px', borderRadius: '50%',
        background: `linear-gradient(135deg, ${avatarBg(player.nome)}, ${avatarBg(player.nome)}cc)`,
        border: `2px solid ${cor}55`,
        boxShadow: `0 0 14px ${cor}30`,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Iniciais — base */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 900, color: 'white',
        }}>
          {initials(player.nome)}
        </div>
        {/* Foto — se disponível */}
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
        )}
        {/* OVR badge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: `${cor}dd`,
          textAlign: 'center',
          fontSize: '8px', fontWeight: 900, color: '#000',
          lineHeight: '13px',
        }}>
          {player.ovr}
        </div>
      </div>

      {/* Nome */}
      <span style={{
        fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.72)',
        letterSpacing: '0.03em', maxWidth: '56px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>
        {player.nome.split(' ')[0]}
      </span>
      <span style={{
        fontSize: '8px', fontWeight: 800, color: cor,
        background: `${cor}15`, border: `1px solid ${cor}30`,
        borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.06em',
      }}>
        {label}
      </span>
    </Link>
  )
}

// ── Row (linha da formação) ────────────────────────────────────────────────────

function Row({ players, labels }: { players: (TacticalPlayer | null)[]; labels: string[] }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      gap: 'clamp(12px,4vw,36px)',
      padding: '10px 0',
    }}>
      {players.map((p, i) => (
        <PlayerDot key={i} player={p} label={labels[i] ?? ''} />
      ))}
    </div>
  )
}

// ── TacticalBoard ─────────────────────────────────────────────────────────────

export default function TacticalBoard() {
  const [data, setData] = useState<TacticalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/landing/tactical', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((json: TacticalData | null) => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Skeleton
  if (loading) {
    return (
      <section style={{ background: '#050906', padding: '64px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ height: '16px', width: '140px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', margin: '0 auto 32px', animation: 'tbPulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: '280px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
        </div>
        <style>{`@keyframes tbPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
      </section>
    )
  }

  // Sem dados — nada renderiza
  if (!data) return null
  const hasAny = data.gol || data.def.some(Boolean) || data.mid.some(Boolean) || data.atk.some(Boolean)
  if (!hasAny) return null

  return (
    <section style={{
      background: '#050906',
      padding: '64px 20px 72px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      overflow: 'hidden',
    }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <p style={{
          margin: '0 0 8px', fontSize: '10px', fontWeight: 800,
          color: '#22c55e', letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          ⚽ Formação do Momento
        </p>
        <h2 style={{
          margin: 0, fontSize: 'clamp(20px,3vw,28px)',
          fontWeight: 900, color: 'white', letterSpacing: '-0.02em',
        }}>
          Os melhores em campo
        </h2>
        <p style={{ margin: '8px auto 0', fontSize: '13px', color: 'rgba(255,255,255,0.35)', maxWidth: '340px' }}>
          4-3-3 montado com os atletas mais bem avaliados da plataforma.
        </p>
      </div>

      {/* Campo tático */}
      <div style={{
        maxWidth: '480px', margin: '0 auto',
        background: 'linear-gradient(180deg, #0a2010 0%, #061208 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(34,197,94,0.12)',
        boxShadow: '0 0 60px rgba(34,197,94,0.06)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Linhas do campo decorativas */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(ellipse 60% 30% at 50% 50%, rgba(34,197,94,0.04) 0%, transparent 70%)
          `,
        }} />

        {/* Formação: ATA → MEI → DEF → GOL */}
        <Row players={data.atk} labels={['PE', 'CA', 'PD']} />
        <Row players={data.mid} labels={['MEI', 'VOL', 'MEI']} />
        <Row players={data.def} labels={['LE', 'ZAG', 'ZAG', 'LD']} />
        <Row players={[data.gol]} labels={['GOL']} />
      </div>

      {/* Treinador do mês */}
      {data.treinador && (
        <div style={{
          maxWidth: '480px', margin: '20px auto 0',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#1e3a5f,#3a5f1e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 900, color: 'white',
            border: '1.5px solid rgba(251,191,36,0.3)',
          }}>
            {initials(data.treinador.nome)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'white', marginBottom: '2px' }}>
              {data.treinador.nome}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)' }}>
              Treinador do mês · {data.treinador.avaliacoesMes} avaliação{data.treinador.avaliacoesMes !== 1 ? 'ões' : ''}
              {data.treinador.cidade ? ` · ${data.treinador.cidade.split(',')[0]}` : ''}
            </div>
          </div>
          <div style={{
            fontSize: '10px', fontWeight: 800, color: '#fbbf24',
            background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: '8px', padding: '4px 8px', flexShrink: 0, textAlign: 'center',
          }}>
            ⭐ {data.treinador.reputacao.toFixed(1)}
          </div>
        </div>
      )}
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TacticalData, TacticalPlayer } from '@/app/api/landing/tactical/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function ini(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

/** Retorna as cores de borda/fundo por posição */
function posTheme(pos: string): { ring: string; bg: string; text: string } {
  if (pos === 'GOL') return { ring: '#7c3aed', bg: '#2e1065', text: '#c4b5fd' }
  if (pos === 'LAT' || pos === 'ZAG') return { ring: '#d97706', bg: '#431407', text: '#fde68a' }
  if (pos === 'VOL' || pos === 'MEI') return { ring: '#2563eb', bg: '#1e3a8a', text: '#93c5fd' }
  return { ring: '#16a34a', bg: '#14532d', text: '#86efac' }
}

/** Rótulo curto da posição */
function posLabel(pos: string): string {
  const m: Record<string, string> = {
    GOL: 'GK', LAT: 'LAT', ZAG: 'ZAG', VOL: 'VOL', MEI: 'MEI', ATA: 'ATA',
  }
  return m[pos] ?? pos.slice(0, 3)
}

function timeAgo(ts: string): string {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `${d}d atrás`
}

// ── PlayerDot ─────────────────────────────────────────────────────────────────

function PlayerDot({
  p,
  photoIdx,
  size = 50,
}: {
  p:        TacticalPlayer | null
  photoIdx: number
  size?:    number
}) {
  // Slot vazio
  if (!p) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          border: '1.5px dashed rgba(255,255,255,0.08)',
        }} />
        <div style={{ height: '11px' }} />
      </div>
    )
  }

  const c     = posTheme(p.posicao)
  const foto  = p.fotos.length > 0 ? p.fotos[photoIdx % p.fotos.length] : null
  const label = posLabel(p.posicao)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      {/* Círculo principal */}
      <div style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        background:     foto ? '#080f09' : c.bg,
        border:         `2.5px solid ${c.ring}`,
        overflow:       'hidden',
        position:       'relative',
        flexShrink:     0,
        boxShadow:      `0 0 0 3px ${c.ring}20, 0 4px 18px rgba(0,0,0,0.55)`,
      }}>
        {foto ? (
          <img
            src={foto}
            alt={p.nome}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
              transition: 'opacity .6s ease',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(size * 0.27),
            fontWeight: 900, color: c.text,
          }}>
            {ini(p.nome)}
          </div>
        )}

        {/* OVR mini badge (canto inferior direito) */}
        <div style={{
          position: 'absolute', bottom: '1px', right: '1px',
          background: c.ring,
          color: 'white',
          fontSize: '7px', fontWeight: 900, lineHeight: '12px',
          borderRadius: '4px', padding: '0 3px',
          letterSpacing: '-0.01em',
        }}>
          {p.ovr}
        </div>
      </div>

      {/* Posição + nome */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
      }}>
        <span style={{
          fontSize: '7.5px', fontWeight: 800, color: c.ring,
          letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.52)',
          maxWidth: size + 12, textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {p.nome.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}

// ── FormationRow ──────────────────────────────────────────────────────────────

function FormationRow({
  players,
  photoIndices,
  size,
}: {
  players:      (TacticalPlayer | null)[]
  photoIndices: Record<string, number>
  size:         number
}) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-evenly',
      alignItems:     'flex-start',
      padding:        '0 8px',
      position:       'relative',
      zIndex:         2,
    }}>
      {players.map((p, i) => (
        <PlayerDot
          key={p?.id ?? `empty-${i}`}
          p={p}
          photoIdx={p ? (photoIndices[p.id] ?? 0) : 0}
          size={size}
        />
      ))}
    </div>
  )
}

// ── TacticalBoard (main) ──────────────────────────────────────────────────────

export default function TacticalBoard() {
  const [data,         setData]         = useState<TacticalData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({})

  // Fetch data
  useEffect(() => {
    fetch('/api/landing/tactical', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((d: TacticalData | null) => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Photo cycling a cada 2s
  useEffect(() => {
    if (!data) return
    const all = [data.gol, ...data.def, ...data.mid, ...data.atk]
      .filter((p): p is TacticalPlayer => p !== null && p.fotos.length > 1)
    if (all.length === 0) return

    const iv = setInterval(() => {
      setPhotoIndices(prev => {
        const next = { ...prev }
        for (const p of all) next[p.id] = ((prev[p.id] ?? 0) + 1) % p.fotos.length
        return next
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [data])

  // Enquanto carrega → não renderiza nada (evita bloco vazio enorme no mobile)
  if (loading) return null

  // Se a API falhou (data null) ou não há atletas → oculta a seção
  if (!data) return null
  const hasAny = data.gol !== null
    || data.def.some(Boolean)
    || data.mid.some(Boolean)
    || data.atk.some(Boolean)
  if (!hasAny) return null

  // Normaliza arrays (garante tamanho correto mesmo com dados parciais)
  const padRow = (arr: (TacticalPlayer | null)[], n: number): (TacticalPlayer | null)[] =>
    [...(arr ?? []), ...Array(n).fill(null)].slice(0, n)

  const gol = data.gol
  const def = padRow(data.def, 4)
  const mid = padRow(data.mid, 3)
  const atk = padRow(data.atk, 3)
  const treinador = data.treinador ?? null

  return (
    <section className="tactical-section" style={{ background: '#060c09', padding: '64px 24px 56px' }}>
      <style>{`@media(max-width:768px){.tactical-section{padding-top:28px!important}}`}</style>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
            color: 'rgba(0,255,136,0.55)', textTransform: 'uppercase',
            margin: '0 0 10px',
          }}>
            ⚡ Campo Tático
          </p>
          <h2 style={{
            margin: 0, fontSize: 'clamp(22px,5vw,30px)', fontWeight: 900,
            color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1,
          }}>
            Os melhores por posição
          </h2>
          <p style={{
            margin: '9px 0 0', fontSize: '13px',
            color: 'rgba(255,255,255,0.32)', lineHeight: 1.5,
          }}>
            Formação 4-3-3 · maior OVR de cada linha
          </p>
        </div>

        {/* ── Campo ── */}
        <div style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#0c1f13 0%,#071309 55%,#0c1f13 100%)',
          border: '1.5px solid rgba(255,255,255,0.07)',
          padding: '22px 0',
        }}>

          {/* ── Linhas do campo (decorativas) ── */}
          <div style={{ position: 'absolute', inset: '14px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: '1px', background: 'rgba(255,255,255,0.07)', transform: 'translateY(-0.5px)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '64px', height: '64px', marginLeft: '-32px', marginTop: '-32px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '14px', left: '28%', right: '28%', height: '23%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 36px 36px', borderTop: 'none', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', bottom: '14px', left: '28%', right: '28%', height: '23%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '36px 36px 0 0', borderBottom: 'none', pointerEvents: 'none', zIndex: 1 }} />

          {/* ── Formação ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2.5vw,18px)', position: 'relative', zIndex: 2 }}>
            {/* Ataque */}
            <FormationRow players={atk} photoIndices={photoIndices} size={52} />

            {/* Meio-campo */}
            <FormationRow players={mid} photoIndices={photoIndices} size={48} />

            {/* Linha do meio (separador visual) */}
            <div style={{ height: '1px', margin: '0 10%', background: 'rgba(255,255,255,0.06)', position: 'relative', zIndex: 2 }} />

            {/* Defesa */}
            <FormationRow players={def} photoIndices={photoIndices} size={44} />

            {/* Goleiro */}
            <FormationRow players={[gol]} photoIndices={photoIndices} size={44} />
          </div>

          {/* ── Legenda ── */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap',
            marginTop: '20px', padding: '0 12px',
            position: 'relative', zIndex: 2,
          }}>
            {[
              { label: 'Ataque',  color: '#16a34a' },
              { label: 'Meio',    color: '#2563eb' },
              { label: 'Defesa',  color: '#d97706' },
              { label: 'Goleiro', color: '#7c3aed' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.32)', fontWeight: 600 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Treinador do Mês ── */}
        {treinador && (
          <div style={{
            marginTop: '14px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '16px',
          }}>
            {/* Header treinador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {/* Avatar iniciais */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#14532d,#15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900, color: 'white',
                border: '2px solid rgba(22,163,74,0.3)',
              }}>
                {ini(treinador.nome)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 800, color: 'white',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {treinador.nome}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.36)', marginTop: '1px' }}>
                  {treinador.cidade || 'Brasil'} · Treinador
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                  {treinador.reputacao.toFixed(1)}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(34,197,94,0.45)', marginTop: '1px', letterSpacing: '0.04em' }}>
                  ★ reputação
                </div>
              </div>
            </div>

            {/* Stats: total / mês */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '9px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                  {treinador.totalAvaliacoes}
                </div>
                <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>
                  avaliações
                </div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(22,163,74,0.07)',
                border: '1px solid rgba(22,163,74,0.16)',
                borderRadius: '10px', padding: '9px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                  {treinador.avaliacoesMes}
                </div>
                <div style={{ fontSize: '8.5px', color: 'rgba(34,197,94,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>
                  este mês
                </div>
              </div>
            </div>

            {/* Última avaliação */}
            {treinador.ultimaAvaliacao && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px', padding: '10px 12px',
              }}>
                <div>
                  <div style={{
                    fontSize: '9px', color: 'rgba(255,255,255,0.28)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px',
                  }}>
                    Última avaliação · {timeAgo(treinador.ultimaAvaliacao.ts)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>
                    {treinador.ultimaAvaliacao.atletaNome}
                  </div>
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '9px', padding: '5px 11px',
                }}>
                  <span style={{ fontSize: '7px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.10em' }}>OVR</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                    {treinador.ultimaAvaliacao.ovr}
                  </span>
                </div>
              </div>
            )}

            {/* Badge treinador do mês */}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <span style={{
                fontSize: '9px', fontWeight: 700,
                color: 'rgba(251,191,36,0.55)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                🏅 Treinador do mês
              </span>
            </div>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <Link
            href="/atleta/cadastro"
            style={{
              fontSize: '13px', fontWeight: 700,
              color: 'rgba(255,255,255,0.38)',
              textDecoration: 'none', letterSpacing: '0.03em',
            }}
          >
            Seu nome pode estar aqui · <span style={{ color: '#22c55e' }}>criar meu card →</span>
          </Link>
        </div>

      </div>
    </section>
  )
}

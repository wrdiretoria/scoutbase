'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { FeedEvent } from '@/app/api/landing/livefeed/route'
import AtletaCard from './AtletaCard'

// ── NovosTalentos ──────────────────────────────────────────────────────────────

const POLL_MS = 15_000

export default function LiveFeed() {
  const [events,      setEvents]      = useState<FeedEvent[]>([])
  const [newIds,      setNewIds]      = useState<Set<string>>(new Set())
  const [hasMore,     setHasMore]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({})
  const cursorRef = useRef<string | null>(null)
  const knownIds  = useRef<Set<string>>(new Set())

  // ── Load events (initial or pagination) ─────────────────────────────────────
  const loadEvents = useCallback(async (opts: { limit?: number; cursor?: string | null; prepend?: boolean } = {}) => {
    const { limit = 8, cursor = null, prepend = false } = opts
    if (prepend ? false : loading) return
    prepend ? undefined : setLoading(true)

    try {
      const params = new URLSearchParams({ limit: String(limit) })
      if (cursor) params.set('cursor', cursor)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const res   = await fetch(`/api/landing/livefeed?${params}`, { cache: 'no-store', signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) return
      const json = await res.json() as { events: FeedEvent[]; hasMore: boolean }

      if (prepend) {
        const fresh = json.events.filter(e => !knownIds.current.has(e.id))
        if (fresh.length === 0) return
        fresh.forEach(e => knownIds.current.add(e.id))
        setNewIds(prev => new Set([...prev, ...fresh.map(e => e.id)]))
        setEvents(prev => [...fresh, ...prev])
        // Remove badge "novo" após 6s
        setTimeout(() => {
          setNewIds(prev => {
            const next = new Set(prev)
            fresh.forEach(e => next.delete(e.id))
            return next
          })
        }, 6000)
      } else {
        json.events.forEach(e => knownIds.current.add(e.id))
        setEvents(prev => cursor ? [...prev, ...json.events] : json.events)
        setHasMore(json.hasMore)
        if (json.events.length > 0) {
          cursorRef.current = json.events[json.events.length - 1]?.ts ?? null
        }
      }
    } catch { /* silent */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [loading])

  // ── Initial load + polling ───────────────────────────────────────────────────
  useEffect(() => {
    loadEvents({ limit: 16 })
    const iv = setInterval(() => loadEvents({ limit: 3, prepend: true }), POLL_MS)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supabase Realtime ────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = createClient()
    let channel: ReturnType<typeof sb.channel> | null = null
    try {
      channel = sb.channel('livefeed-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avaliacoes' },
          () => { loadEvents({ limit: 3, prepend: true }) })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' },
          () => { loadEvents({ limit: 3, prepend: true }) })
        .subscribe()
    } catch { /* Realtime não disponível — polling continua */ }
    return () => { if (channel) sb.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Photo cycling (2s) ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setPhotoIndices(prev => {
        const next: Record<string, number> = {}
        for (const e of events) {
          if (e.fotos.length > 1) {
            next[e.id] = ((prev[e.id] ?? 0) + 1) % e.fotos.length
          }
        }
        return { ...prev, ...next }
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [events])

  // ── Carregar mais ────────────────────────────────────────────────────────────
  function handleLoadMore() {
    if (!cursorRef.current || loadingMore) return
    setLoadingMore(true)
    loadEvents({ limit: 5, cursor: cursorRef.current })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section style={{ background: '#030905', padding: '0 0 80px' }}>
      <style>{`
        @keyframes feedSlideIn {
          from { opacity:0; transform:translateY(-12px) }
          to   { opacity:1; transform:translateY(0) }
        }

        /* ── SEPARADOR ── */
        .feed-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 clamp(16px,4vw,24px);
          margin: 0 auto 52px;
          max-width: 760px;
        }
        .feed-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(0,255,136,0.28), transparent);
        }
        .feed-divider-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          border: 1px solid rgba(0,255,136,0.18);
          background: rgba(0,255,136,0.05);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(0,255,136,0.65);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .feed-divider-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #00FF88;
          box-shadow: 0 0 6px rgba(0,255,136,0.8);
          animation: pulseFeed 2s ease-in-out infinite;
        }
        @keyframes pulseFeed {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:.45; transform:scale(0.7); }
        }

        /* ── GRID COM LINHAS DOURADAS ── */
        .feed-grid-wrap {
          position: relative;
        }

        .feed-grid {
          columns: 2;
          column-gap: 0;
        }
        .feed-grid > * {
          break-inside: avoid;
          display: inline-block;
          width: 100%;
        }

        /* Cada card tem borda direita e inferior dourada */
        .feed-grid > * {
          position: relative;
          padding: 10px;
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
        }

        .feed-grid > * > * {
          width: 100%;
        }

        /* Linha vertical dourada entre colunas */
        .feed-grid > *:nth-child(odd)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 16px;
          bottom: 16px;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(200,150,10,0.55) 20%,
            rgba(255,215,0,0.65) 50%,
            rgba(200,150,10,0.55) 80%,
            transparent
          );
        }

        /* Linha horizontal dourada entre linhas */
        .feed-grid > *:not(:nth-last-child(-n+2))::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(200,150,10,0.45) 20%,
            rgba(255,215,0,0.60) 50%,
            rgba(200,150,10,0.45) 80%,
            transparent
          );
        }

        .feed-skeleton {
          height: 360px;
          border-radius: 22px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.04);
        }

        /* Mobile: single column on very small screens */
        @media (max-width: 380px) {
          .feed-grid { grid-template-columns: 1fr !important; }
          /* No vertical divider in single column */
          .feed-grid > *:nth-child(odd)::after { display: none !important; }
        }

        /* Mobile: tighter padding */
        @media (max-width: 480px) {
          .feed-header h2 { font-size: 22px !important; }
          .feed-header p  { font-size: 13px !important; }
          .feed-grid > * { padding: 8px !important; }
        }
      `}</style>

      {/* ══ SEPARADOR ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '56px clamp(16px,4vw,24px) 0' }}>
        <div className="feed-divider">
          <div className="feed-divider-line" />
          <div className="feed-divider-label">
            <span className="feed-divider-dot" />
            Novos Talentos
          </div>
          <div className="feed-divider-line" />
        </div>
      </div>

      {/* Container */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* ── Header ── */}
        <div className="feed-header" style={{ marginBottom: '28px' }}>
          <h2 style={{
            margin: '0 0 8px', fontSize: 'clamp(22px,4vw,34px)',
            fontWeight: 900, color: 'white',
            letterSpacing: '-0.028em', lineHeight: 1.06,
          }}>
            Atletas <span style={{ color: '#00FF88' }}>em destaque</span>
          </h2>
          <p style={{
            margin: 0, fontSize: '14px',
            color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
          }}>
            Perfis recentes na plataforma
          </p>
        </div>

        {/* ── Cards ── */}
        {loading && events.length === 0 ? (
          <div className="feed-grid">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="feed-skeleton skel"
                style={{ animation: `feedSlideIn .4s ease both ${i * 0.06}s` }} />
            ))}
          </div>

        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            color: 'rgba(255,255,255,0.25)', fontSize: '14px',
          }}>
            Nenhum atleta cadastrado ainda.
          </div>

        ) : (
          <div className="feed-grid-wrap">
            <div className="feed-grid" style={{
              gridTemplateColumns: events.length <= 2 ? `repeat(${events.length},1fr)` : '1fr 1fr',
            }}>
              {events.map(event => (
                <div key={event.id}>
                  <AtletaCard
                    nome={event.nome}
                    ovr={event.ovr}
                    foto={event.fotos[photoIndices[event.id] ?? 0] ?? null}
                    posicao={event.posicao || null}
                    categoria={event.cidade?.split(',')[0] || null}
                    atributos={event.atributos ?? null}
                    avaliadoPor={event.treinadorNome}
                    href={`/jogador/${event.atletaId}`}
                    athleteId={event.mcId}
                    isNew={false}
                    rank={null}
                    width="100%"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Carregar mais ── */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: '12px 32px', borderRadius: '100px',
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.18)',
                color: loadingMore ? 'rgba(255,255,255,0.28)' : 'rgba(0,255,136,0.70)',
                fontSize: '13px', fontWeight: 700,
                cursor: loadingMore ? 'default' : 'pointer',
                letterSpacing: '0.06em',
                transition: 'all .2s',
              }}
            >
              {loadingMore ? 'Carregando...' : 'Ver mais atletas →'}
            </button>
          </div>
        )}

      </div>
    </section>
  )
}

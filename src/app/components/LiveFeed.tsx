'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { FeedEvent } from '@/app/api/landing/livefeed/route'
import AtletaCard from './AtletaCard'

// ── Helper ─────────────────────────────────────────────────────────────────────

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

// ── LiveFeed ───────────────────────────────────────────────────────────────────

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
    loadEvents({ limit: 8 })
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
    <section style={{
      background:   '#030905',
      padding:      '72px 0 80px',
      borderTop:    '1px solid rgba(0,255,136,0.07)',
      borderBottom: '1px solid rgba(0,255,136,0.05)',
    }}>
      <style>{`
        @keyframes feedSlideIn {
          from { opacity:0; transform:translateY(-12px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>

      {/* Container estreito — 2 colunas de ~206px cada */}
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', marginBottom: '28px',
        }}>
          <div>
            {/* Live dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <span style={{
                display: 'inline-block', width: '5px', height: '5px',
                borderRadius: '50%', background: '#00FF88',
                boxShadow: '0 0 7px rgba(0,255,136,0.85)',
                animation: 'pulseDot 2s ease-in-out infinite', flexShrink: 0,
              }} />
              <span style={{
                fontSize: '9.5px', fontWeight: 700,
                color: 'rgba(0,255,136,0.55)',
                letterSpacing: '0.24em', textTransform: 'uppercase',
              }}>
                Ao vivo agora
              </span>
            </div>

            <h2 style={{
              margin: 0, fontSize: 'clamp(22px,4vw,34px)',
              fontWeight: 900, color: 'white',
              letterSpacing: '-0.028em', lineHeight: 1.06,
            }}>
              O que está acontecendo{' '}<br/>
              <span style={{ color: '#00FF88' }}>agora na plataforma</span>
            </h2>
          </div>

          {events.length > 0 && (
            <span style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.22)',
              fontWeight: 500, paddingBottom: '4px',
              flexShrink: 0, marginLeft: '12px', whiteSpace: 'nowrap',
            }}>
              {events.length} eventos
            </span>
          )}
        </div>

        {/* ── Cards ── */}
        {loading && events.length === 0 ? (
          /* Skeleton — mesma grade, altura do AtletaCard */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                height: '360px',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.04)',
                animation: `feedSlideIn .4s ease both ${i * 0.06}s`,
              }} />
            ))}
          </div>

        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            color: 'rgba(255,255,255,0.25)', fontSize: '14px',
          }}>
            Nenhuma atividade recente ainda.
          </div>

        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {events.map(event => (
              <AtletaCard
                key={event.id}
                nome={event.nome}
                ovr={event.ovr}
                foto={event.fotos[photoIndices[event.id] ?? 0] ?? null}
                posicao={event.posicao || null}
                categoria={event.cidade?.split(',')[0] || timeAgo(event.ts)}
                atributos={event.atributos ?? null}
                avaliadoPor={event.treinadorNome}
                href={`/jogador/${event.atletaId}`}
                isNew={newIds.has(event.id)}
                rank={null}
                width="100%"
              />
            ))}
          </div>
        )}

        {/* ── Carregar mais ── */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: '11px 28px', borderRadius: '100px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: loadingMore ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.58)',
                fontSize: '13px', fontWeight: 600,
                cursor: loadingMore ? 'default' : 'pointer',
                letterSpacing: '0.04em',
                transition: 'border-color .2s, color .2s',
              }}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais →'}
            </button>
          </div>
        )}

      </div>
    </section>
  )
}

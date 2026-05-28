'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { FeedEvent } from '@/app/api/landing/livefeed/route'

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string) {
  const map: Record<string, string> = {
    'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE','Lateral':'LAT',
    'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
    'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
  }
  return map[pos] ?? (pos ? pos.slice(0, 3).toUpperCase() : '')
}

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

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

function avatarBg(name: string) {
  const COLORS = ['#14532d','#1e3a5f','#5f1e3a','#3a5f1e','#3a1e5f','#6b3a1a','#1a5f5f','#4c1d95']
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % COLORS.length
  return COLORS[i]
}

// ── EventCard ──────────────────────────────────────────────────────────────────

function EventCard({
  event,
  photoIdx,
  isNew,
}: {
  event:    FeedEvent
  photoIdx: number
  isNew:    boolean
}) {
  const isAv       = event.tipo === 'avaliacao'
  const hasPhotos  = isAv && event.fotos.length > 0
  const expanded   = hasPhotos && event.ovr !== null && event.ovr >= 70
  const pos        = posAbrev(event.posicao)
  const cor        = event.ovr ? ovrColor(event.ovr) : '#00FF88'
  const currentFoto = hasPhotos ? event.fotos[photoIdx % event.fotos.length] : null

  return (
    <div style={{
      display:       'flex',
      background:    expanded ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.025)',
      border:        `1px solid ${isNew ? 'rgba(0,255,136,0.28)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius:  '14px',
      overflow:      'hidden',
      transition:    'border-color .4s ease',
      animation:     isNew ? 'feedSlideIn .45s cubic-bezier(.22,1,.36,1) both' : 'none',
      position:      'relative',
      cursor:        'pointer',
    }}>
      {/* Link invisível sobre o card → perfil do atleta */}
      {(event.mcId || event.atletaId) && (
        <Link
          href={event.mcId ? `/atleta/${event.mcId.replace('MC-', '')}` : '#'}
          style={{ position:'absolute', inset:0, zIndex:20 }}
          aria-label={`Ver perfil de ${event.nome}`}
        />
      )}
      {/* ── Foto lateral (cards de avaliação expandidos) ── */}
      {expanded && currentFoto && (
        <div style={{
          flexShrink: 0,
          width:      '90px',
          position:   'relative',
          overflow:   'hidden',
          background: '#0a120e',
        }}>
          <img
            src={currentFoto}
            alt={event.nome}
            style={{
              position:   'absolute', inset: 0,
              width:      '100%', height: '100%',
              objectFit:  'cover', objectPosition: 'center top',
              transition: 'opacity .4s ease',
            }}
          />
          <div style={{
            position:   'absolute', inset: 0,
            background: 'linear-gradient(to right, transparent 55%, rgba(3,9,5,0.95) 100%)',
          }} />
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <div style={{
        flex:    1,
        display: 'flex',
        alignItems: 'center',
        gap:     '12px',
        padding: expanded ? '14px 14px 14px 12px' : '13px 14px',
        minWidth: 0,
      }}>
        {/* Avatar — foto real quando disponível, iniciais como fallback */}
        <div style={{
          width:        '40px',
          height:       '40px',
          borderRadius: '50%',
          flexShrink:   0,
          background:   `linear-gradient(135deg, ${avatarBg(event.nome)}, ${avatarBg(event.nome)}cc)`,
          border:       '1.5px solid rgba(255,255,255,0.10)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '12px',
          fontWeight:   900,
          color:        'white',
          boxShadow:    '0 2px 8px rgba(0,0,0,0.4)',
          overflow:     'hidden',
          position:     'relative',
        }}>
          {event.fotos[0] ? (
            <img
              src={event.fotos[0]}
              alt={event.nome}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
              }}
            />
          ) : null}
          {!event.fotos[0] && initials(event.nome)}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nome + badge tipo */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '7px',
            marginBottom: '3px',
            flexWrap:   'wrap',
          }}>
            <span style={{
              fontSize:   '13px',
              fontWeight: 800,
              color:      'white',
              overflow:   'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth:   '160px',
            }}>
              {event.nome}
            </span>

            {/* Badge tipo */}
            {isAv ? (
              <span style={{
                fontSize:        '8.5px',
                fontWeight:      800,
                color:           cor,
                background:      `rgba(${event.ovr && event.ovr >= 80 ? '0,255,136' : event.ovr && event.ovr >= 65 ? '251,191,36' : '249,115,22'},0.10)`,
                border:          `1px solid ${cor}35`,
                borderRadius:    '5px',
                padding:         '1.5px 6px',
                letterSpacing:   '0.06em',
                flexShrink:      0,
                textTransform:   'uppercase',
              }}>
                AVALIADO
              </span>
            ) : (
              <span style={{
                fontSize:      '8.5px',
                fontWeight:    800,
                color:         '#00FF88',
                background:    'rgba(0,255,136,0.08)',
                border:        '1px solid rgba(0,255,136,0.22)',
                borderRadius:  '5px',
                padding:       '1.5px 6px',
                letterSpacing: '0.06em',
                flexShrink:    0,
                textTransform: 'uppercase',
              }}>
                ENTROU
              </span>
            )}
          </div>

          {/* Descrição */}
          <div style={{
            fontSize:  '11.5px',
            color:     'rgba(255,255,255,0.40)',
            lineHeight: 1.4,
            overflow:  'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {isAv
              ? <>avaliado por <span style={{ color: 'rgba(255,255,255,0.62)', fontWeight: 600 }}>{event.treinadorNome ?? 'treinador'}</span>{event.cidade ? ` · ${event.cidade.split(',')[0]}` : ''}</>
              : <>{pos && <>{pos} · </>}{event.cidade ? event.cidade.split(',')[0] : 'atleta novo'}</>
            }
          </div>

          {/* ID do atleta */}
          {event.mcId && (
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.08em', marginTop: '3px' }}>
              ID: {event.mcId.replace('MC-', '')}
            </div>
          )}
        </div>

        {/* OVR ou ícone + timestamp */}
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-end',
          gap:            '5px',
          flexShrink:     0,
        }}>
          {isAv && event.ovr !== null ? (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              background:     `rgba(${event.ovr >= 80 ? '0,255,136' : event.ovr >= 65 ? '251,191,36' : '249,115,22'},0.09)`,
              border:         `1px solid ${cor}35`,
              borderRadius:   '9px',
              padding:        '4px 9px',
              minWidth:       '40px',
            }}>
              <span style={{ fontSize: '7.5px', fontWeight: 800, color: cor, letterSpacing: '0.10em' }}>OVR</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: cor, lineHeight: 1 }}>{event.ovr}</span>
            </div>
          ) : (
            <div style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '50%',
              background:     'rgba(0,255,136,0.06)',
              border:         '1px solid rgba(0,255,136,0.14)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '16px',
            }}>
              ⚽
            </div>
          )}
          <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}>
            {timeAgo(event.ts)}
          </span>
        </div>
      </div>

      {/* Pill "ao vivo" para eventos novos via Realtime */}
      {isNew && (
        <div style={{
          position:      'absolute',
          top:           '8px',
          right:         '8px',
          fontSize:      '8px',
          fontWeight:    800,
          color:         '#00FF88',
          background:    'rgba(0,255,136,0.10)',
          border:        '1px solid rgba(0,255,136,0.25)',
          borderRadius:  '100px',
          padding:       '2px 7px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          novo
        </div>
      )}
    </div>
  )
}

// ── LiveFeed ───────────────────────────────────────────────────────────────────

const POLL_MS = 15_000

export default function LiveFeed() {
  const [events,     setEvents]     = useState<FeedEvent[]>([])
  const [newIds,     setNewIds]     = useState<Set<string>>(new Set())
  const [hasMore,    setHasMore]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({})
  const cursorRef = useRef<string | null>(null)
  const knownIds  = useRef<Set<string>>(new Set())

  // ── Load events (initial or pagination) ────────────────────────────────────
  const loadEvents = useCallback(async (opts: { limit?: number; cursor?: string | null; prepend?: boolean } = {}) => {
    const { limit = 8, cursor = null, prepend = false } = opts
    if (prepend ? false : loading) return
    prepend ? undefined : setLoading(true)

    try {
      const params = new URLSearchParams({ limit: String(limit) })
      if (cursor) params.set('cursor', cursor)

      const res  = await fetch(`/api/landing/livefeed?${params}`, { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json() as { events: FeedEvent[]; hasMore: boolean }

      if (prepend) {
        // Filtra só eventos realmente novos
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
          // cursor = ts do evento mais antigo da lista total
          cursorRef.current = json.events[json.events.length - 1]?.ts ?? null
        }
      }
    } catch { /* silent */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [loading])

  // ── Initial load + polling ──────────────────────────────────────────────────
  useEffect(() => {
    loadEvents({ limit: 8 })
    const iv = setInterval(() => loadEvents({ limit: 3, prepend: true }), POLL_MS)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supabase Realtime ───────────────────────────────────────────────────────
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

  // ── Photo cycling (2s) ─────────────────────────────────────────────────────
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

  // ── Carregar mais ───────────────────────────────────────────────────────────
  function handleLoadMore() {
    if (!cursorRef.current || loadingMore) return
    setLoadingMore(true)
    loadEvents({ limit: 5, cursor: cursorRef.current })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section style={{
      background:    '#030905',
      padding:       '72px 0 80px',
      borderTop:     '1px solid rgba(0,255,136,0.07)',
      borderBottom:  '1px solid rgba(0,255,136,0.05)',
    }}>
      <style>{`
        @keyframes feedSlideIn {
          from { opacity:0; transform:translateY(-12px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>

        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          marginBottom:   '28px',
        }}>
          <div>
            {/* Live label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
              <span style={{
                display:    'inline-block',
                width:      '5px',
                height:     '5px',
                borderRadius: '50%',
                background: '#00FF88',
                boxShadow:  '0 0 7px rgba(0,255,136,0.85)',
                animation:  'pulseDot 2s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize:      '9.5px',
                fontWeight:    700,
                color:         'rgba(0,255,136,0.55)',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
              }}>
                Ao vivo agora
              </span>
            </div>

            <h2 style={{
              margin:        0,
              fontSize:      'clamp(22px,4vw,34px)',
              fontWeight:    900,
              color:         'white',
              letterSpacing: '-0.028em',
              lineHeight:    1.06,
            }}>
              O que está acontecendo<br/>
              <span style={{ color: '#00FF88' }}>agora na plataforma</span>
            </h2>
          </div>

          {events.length > 0 && (
            <span style={{
              fontSize:   '11px',
              color:      'rgba(255,255,255,0.22)',
              fontWeight: 500,
              paddingBottom: '4px',
              flexShrink: 0,
              marginLeft: '12px',
              whiteSpace: 'nowrap',
            }}>
              {events.length} eventos
            </span>
          )}
        </div>

        {/* ── Cards ── */}
        {loading && events.length === 0 ? (
          /* Skeleton */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                height:       '70px',
                borderRadius: '14px',
                background:   'rgba(255,255,255,0.025)',
                border:       '1px solid rgba(255,255,255,0.04)',
                animation:    `feedSlideIn .4s ease both ${i * 0.06}s`,
              }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign:  'center',
            padding:    '48px 0',
            color:      'rgba(255,255,255,0.25)',
            fontSize:   '14px',
          }}>
            Nenhuma atividade recente ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                photoIdx={photoIndices[event.id] ?? 0}
                isNew={newIds.has(event.id)}
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
                padding:       '11px 28px',
                borderRadius:  '100px',
                background:    'rgba(255,255,255,0.04)',
                border:        '1px solid rgba(255,255,255,0.12)',
                color:         loadingMore ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.58)',
                fontSize:      '13px',
                fontWeight:    600,
                cursor:        loadingMore ? 'default' : 'pointer',
                letterSpacing: '0.04em',
                transition:    'border-color .2s, color .2s',
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

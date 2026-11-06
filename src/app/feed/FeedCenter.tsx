'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'

type Autor = { id: string; nome: string | null; avatarUrl: string | null }
type Oportunidade = { id: string; title: string; position: string | null; category: string | null; city: string | null }

type FeedPost = {
  id: string
  author_id: string
  author_type: string
  type: 'update' | 'achievement' | 'opportunity' | 'recommendation_share'
  body: string
  media_url: string | null
  opportunity_id: string | null
  created_at: string
  author: Autor | null
  opportunity: Oportunidade | null
  reactionCount: number
  commentCount: number
  reactedByMe: boolean
}

type Comentario = { id: string; body: string; created_at: string; author: Autor | null }
type PublicEvent = {
  id: string
  atletaId: string
  tipo: 'join' | 'avaliacao'
  nome: string
  posicao: string
  cidade: string
  fotos: string[]
  ts: string
}

const LIMIT = 10

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function dataRelativa(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias <= 0) {
    const horas = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000)
    if (horas < 1) return 'agora'
    return `${horas}h atrás`
  }
  if (dias === 1) return 'Ontem'
  if (dias < 7) return `${dias}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function urlSegura(value: string | null): value is string {
  if (!value) return false
  try {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

const AUTOR_LABEL: Record<string, string> = {
  atleta: 'Atleta', treinador: 'Treinador', scout: 'Scout', clube: 'Clube', pais: 'Responsável',
}

function Avatar({ autor, size = 38 }: { autor: Autor | null; size?: number }) {
  if (autor?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={autor.avatarUrl}
        alt={autor.nome ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#15803d,#4ade80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 900, color: 'white',
    }}>
      {iniciais(autor?.nome ?? null)}
    </div>
  )
}

function Composer({ onPosted, currentUser }: { onPosted: (post: FeedPost) => void; currentUser: Autor | null }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!currentUser) {
    return (
      <div className="feedHomeComposer feedHomeComposerGuest">
        <div className="feedHomeComposerTop">
          <div className="feedHomeGuestAvatar" aria-hidden="true">MC</div>
          <Link href="/login?next=%2Ffeed" className="feedHomeComposerTextarea feedHomeComposerPrompt">
            No que você está pensando?
          </Link>
        </div>
        <div className="feedHomeComposerFooter">
          <span className="feedHomeGuestHint">Entre para participar do feed</span>
          <Link href="/login?next=%2Ffeed" className="feedHomePublishButton">Entrar</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    setErro(null)
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json() as { post?: FeedPost; error?: string }
      if (!res.ok || !data.post) {
        setErro(data.error ?? 'Não foi possível publicar.')
        return
      }
      onPosted(data.post)
      setBody('')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form id="feed-composer" className="feedHomeComposer" onSubmit={handleSubmit}>
      <div className="feedHomeComposerTop">
        <Avatar autor={currentUser} size={42} />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="No que você está pensando?"
          rows={1}
          aria-label="Escreva uma publicação"
          className="feedHomeComposerTextarea"
        />
      </div>
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171', padding: '6px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {erro}
        </p>
      )}
      <div className="feedHomeComposerFooter">
        <div className="feedHomeComposerTools" aria-label="Outras opções de publicação">
          <button type="button" disabled title="Publicação de imagem ainda não disponível" aria-label="Adicionar foto">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Foto</span>
          </button>
          <button type="button" disabled title="Publicação de vídeo ainda não disponível" aria-label="Adicionar vídeo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg><span>Vídeo</span>
          </button>
          <button type="button" disabled title="Publicação de evento ainda não disponível" aria-label="Adicionar evento">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></svg><span>Evento</span>
          </button>
        </div>
        <button className="feedHomePublishButton" type="submit" disabled={sending || !body.trim()}>
          {sending ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}

function CommentsPanel({ postId, onCommentAdded }: { postId: string; onCommentAdded: () => void }) {
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let ativo = true
    fetch(`/api/feed/${postId}/comments`)
      .then(res => res.json())
      .then((data: { comments: Comentario[] }) => { if (ativo) setComentarios(data.comments ?? []) })
      .catch(() => { if (ativo) setComentarios([]) })
    return () => { ativo = false }
  }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: texto }),
      })
      if (res.ok) {
        const data = await res.json() as { comment: Comentario }
        setComentarios(prev => [...(prev ?? []), data.comment])
        setTexto('')
        onCommentAdded()
      }
    } catch { /* silencioso */ } finally { setSending(false) }
  }

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {comentarios === null && (
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Carregando comentários…</p>
      )}
      {comentarios?.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: '8px' }}>
          <Avatar autor={c.author} size={26} />
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '6px 10px', flex: 1 }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'white' }}>{c.author?.nome ?? 'Alguém'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{c.body}</p>
          </div>
        </div>
      ))}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escreva um comentário…"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '12px', outline: 'none',
            fontFamily: 'system-ui, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={sending || !texto.trim()}
          style={{
            padding: '8px 16px', borderRadius: '100px', border: 'none',
            background: 'rgba(34,197,94,0.15)', color: '#b3f737', fontWeight: 700, fontSize: '12px',
            cursor: sending ? 'default' : 'pointer', fontFamily: 'system-ui, sans-serif',
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

function PostCard({ post, onToggleLike, onCommentAdded, cardStyle }: {
  post: FeedPost
  onToggleLike: (id: string, liked: boolean, reactionCount: number) => void
  onCommentAdded: (id: string) => void
  cardStyle: CSSProperties
}) {
  const [sendingLike, setSendingLike] = useState(false)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)

  async function handleLike() {
    if (sendingLike) return
    setSendingLike(true)
    try {
      const res = await fetch(`/api/feed/${post.id}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { liked: boolean; reactionCount: number }
        onToggleLike(post.id, data.liked, data.reactionCount)
      }
    } catch { /* silencioso */ } finally { setSendingLike(false) }
  }

  const mediaUrl = urlSegura(post.media_url) ? post.media_url : null
  const mediaIsImage = !!mediaUrl && /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(mediaUrl)

  return (
    <article className="feedHomePost" style={cardStyle}>
      <div className="feedHomePostHeader">
        <Avatar autor={post.author} size={46} />
        <div className="feedHomePostIdentity">
          <strong>{post.author?.nome ?? 'Alguém'}</strong>
          <span>{AUTOR_LABEL[post.author_type] ?? 'Comunidade'} · {dataRelativa(post.created_at)}</span>
        </div>
        <span className="feedHomePostType" aria-hidden="true">•••</span>
      </div>

      <div className={mediaUrl ? 'feedHomePostContent hasMedia' : 'feedHomePostContent'}>
        <div className="feedHomePostText">
          {post.type === 'opportunity' && post.opportunity ? (
            <div className="feedHomeOpportunity">
              <p className="feedHomeOpportunityTitle"><span aria-hidden="true">📣 </span>{post.opportunity.title}</p>
              <p className="feedHomeOpportunityDetails">
                {[post.opportunity.position, post.opportunity.category, post.opportunity.city].filter(Boolean).join(' · ')}
              </p>
              {post.body && <p className="feedHomePostBody">{post.body}</p>}
            </div>
          ) : (
            <p className="feedHomePostBody">{post.body}</p>
          )}
        </div>

        {mediaUrl && (
          <a className="feedHomeMedia" href={mediaUrl} target="_blank" rel="noreferrer">
            {mediaIsImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="Mídia da publicação" />
            ) : (
              <><span aria-hidden="true">▶</span><span>Abrir mídia da publicação</span><span aria-hidden="true">↗</span></>
            )}
          </a>
        )}
      </div>

      <div className="feedHomePostActions">
        <button
          onClick={handleLike}
          disabled={sendingLike}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
            color: post.reactedByMe ? '#b3f737' : 'rgba(255,255,255,0.45)',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ♡ {post.reactionCount > 0 ? post.reactionCount : ''} Curtir
        </button>
        <button
          onClick={() => setComentariosAbertos(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ◯ {post.commentCount > 0 ? post.commentCount : ''} Comentar
        </button>
      </div>

      {comentariosAbertos && <CommentsPanel postId={post.id} onCommentAdded={() => onCommentAdded(post.id)} />}
    </article>
  )
}

function AuthenticatedFeedCenter({ cardStyle, currentUser }: { cardStyle: CSSProperties; currentUser: Autor }) {
  const [posts, setPosts]       = useState<FeedPost[] | null>(null)
  const [offset, setOffset]     = useState(0)
  const [hasMore, setHasMore]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const carregarMais = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?offset=${offset}&limit=${LIMIT}`)
      const data = await res.json() as { posts: FeedPost[]; hasMore: boolean }
      setPosts(prev => [...(prev ?? []), ...data.posts])
      setOffset(prev => prev + LIMIT)
      setHasMore(data.hasMore)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [offset, hasMore, loading])

  // Primeira página — guardado com ref pra não duplicar em dev (React Strict Mode
  // roda os efeitos de montagem duas vezes, e isso duplicaria o fetch inicial).
  const primeiraCargaRef = useRef(false)
  useEffect(() => {
    if (primeiraCargaRef.current) return
    primeiraCargaRef.current = true
    carregarMais()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll infinito: observa o sentinel no fim da lista
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) carregarMais()
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [carregarMais])

  function handleToggleLike(id: string, liked: boolean, reactionCount: number) {
    setPosts(prev => prev?.map(p => p.id === id ? { ...p, reactedByMe: liked, reactionCount } : p) ?? prev)
  }

  function handleCommentAdded(id: string) {
    setPosts(prev => prev?.map(p => p.id === id ? { ...p, commentCount: p.commentCount + 1 } : p) ?? prev)
  }

  function handlePosted(post: FeedPost) {
    setPosts(prev => [post, ...(prev ?? [])])
  }

  return (
    <div className="feedHomeStream">
      <Composer onPosted={handlePosted} currentUser={currentUser} />

      {posts === null && (
        <p className="feedHomeLoading">
          Carregando feed…
        </p>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="feedHomeEmpty">
          <p>
            Sua rede ainda não publicou nada. Que tal ser o primeiro?
          </p>
        </div>
      )}

      {posts?.map(post => (
        <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} onCommentAdded={handleCommentAdded} cardStyle={cardStyle} />
      ))}

      <div ref={sentinelRef} style={{ height: '1px' }} />

      {loading && posts !== null && posts.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', padding: '12px 0' }}>
          Carregando mais…
        </p>
      )}

      {!hasMore && posts !== null && posts.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.2)', padding: '12px 0' }}>
          Você chegou ao fim do feed.
        </p>
      )}
    </div>
  )
}

function PublicActivityFeed() {
  const [events, setEvents] = useState<PublicEvent[] | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/landing/livefeed?limit=8')
      .then(response => response.ok ? response.json() as Promise<{ events?: PublicEvent[] }> : Promise.reject())
      .then(data => { if (active) setEvents(data.events ?? []) })
      .catch(() => { if (active) setEvents([]) })
    return () => { active = false }
  }, [])

  if (events === null) return <p className="feedHomeLoading">Carregando novidades públicas…</p>
  if (events.length === 0) {
    return (
      <div className="feedHomeEmpty">
        <p>As novidades públicas aparecerão aqui.</p>
        <div className="feedHomeExploreLinks">
          <Link href="/ranking">Explorar atletas</Link>
          <Link href="/treinadores">Conhecer treinadores</Link>
          <Link href="/vagas">Ver oportunidades</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="feedHomeStream">
      {events.map(event => {
        const avatar = event.fotos.find(photo => urlSegura(photo)) ?? null
        const athlete = { id: event.atletaId, nome: event.nome, avatarUrl: avatar }
        const details = [event.posicao, event.cidade].filter(Boolean).join(' · ')
        return (
          <article className="feedHomePost feedHomePublicPost" key={event.id}>
            <div className="feedHomePostHeader">
              <Avatar autor={athlete} size={46} />
              <div className="feedHomePostIdentity">
                <strong>{event.nome}</strong>
                <span>Atleta · {dataRelativa(event.ts)}</span>
              </div>
              <span className="feedHomePostType" aria-hidden="true">•••</span>
            </div>
            <div className="feedHomePostContent hasMedia">
              <div className="feedHomePostText">
                <p className="feedHomePostBody">
                  {event.tipo === 'avaliacao' ? 'Recebeu uma nova avaliação esportiva.' : 'Agora faz parte do MeuCraque.'}
                </p>
                {details && <p className="feedHomeOpportunityDetails">{details}</p>}
              </div>
              {avatar && (
                <Link className="feedHomeMedia" href={`/jogador/${event.atletaId}`} aria-label={`Ver perfil público de ${event.nome}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={`Foto pública de ${event.nome}`} />
                </Link>
              )}
            </div>
            <div className="feedHomePostActions">
              <Link href={`/jogador/${event.atletaId}`}>Ver perfil público <span aria-hidden="true">›</span></Link>
              <Link href="/login?next=%2Ffeed">Entre para se conectar</Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function FeedCenter({ cardStyle, currentUser }: { cardStyle: CSSProperties; currentUser: Autor | null }) {
  if (!currentUser) {
    return (
      <div className="feedHomeStream">
        <Composer onPosted={() => undefined} currentUser={null} />
        <PublicActivityFeed />
      </div>
    )
  }

  return <AuthenticatedFeedCenter cardStyle={cardStyle} currentUser={currentUser} />
}

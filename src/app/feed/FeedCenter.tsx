'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

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

const TIPO_ICON: Record<string, string> = {
  update: '📝', achievement: '🏆', opportunity: '💼', recommendation_share: '💬',
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

function Composer({ onPosted }: { onPosted: (post: FeedPost) => void }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    <form onSubmit={handleSubmit} style={{
      background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '16px', marginBottom: '16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Compartilhe uma novidade com sua rede…"
        rows={3}
        style={{
          padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none',
          resize: 'vertical', fontFamily: 'system-ui, sans-serif',
        }}
      />
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171', padding: '6px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={sending || !body.trim()}
        style={{
          alignSelf: 'flex-end', padding: '10px 22px', borderRadius: '10px', border: 'none',
          background: 'linear-gradient(160deg,#166534 0%,#22c55e 100%)',
          color: 'white', fontWeight: 800, fontSize: '13px',
          cursor: sending ? 'default' : 'pointer', opacity: !body.trim() ? 0.5 : 1,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {sending ? 'Publicando…' : 'Publicar'}
      </button>
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
            background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '12px',
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

  return (
    <div style={{ ...cardStyle, marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <Avatar autor={post.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'white' }}>{post.author?.nome ?? 'Alguém'}</p>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            {TIPO_ICON[post.type] ?? '📝'} {dataRelativa(post.created_at)}
          </p>
        </div>
      </div>

      {post.type === 'opportunity' && post.opportunity ? (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>{post.opportunity.title}</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {[post.opportunity.position, post.opportunity.category, post.opportunity.city].filter(Boolean).join(' · ')}
          </p>
        </div>
      ) : (
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLike}
          disabled={sendingLike}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
            color: post.reactedByMe ? '#22c55e' : 'rgba(255,255,255,0.45)',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          👍 {post.reactionCount > 0 ? post.reactionCount : ''} Curtir
        </button>
        <button
          onClick={() => setComentariosAbertos(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '4px 0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          💬 {post.commentCount > 0 ? post.commentCount : ''} Comentar
        </button>
      </div>

      {comentariosAbertos && <CommentsPanel postId={post.id} onCommentAdded={() => onCommentAdded(post.id)} />}
    </div>
  )
}

export default function FeedCenter({ cardStyle }: { cardStyle: CSSProperties }) {
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
    <div>
      <Composer onPosted={handlePosted} />

      {posts === null && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>
          Carregando feed…
        </p>
      )}

      {posts !== null && posts.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
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

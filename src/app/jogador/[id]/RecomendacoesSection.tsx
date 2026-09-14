'use client'

import { useEffect, useState } from 'react'

type Autor = { id: string; nome: string | null; avatarUrl: string | null }
type Recomendacao = {
  id: string
  author_id: string
  role_label: string | null
  body: string
  created_at: string
  helpful_count: number
  author: Autor | null
  reactedByMe: boolean
}

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function dataRelativa(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7) return `${dias}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function UtilButton({ recomendacao, onToggle }: {
  recomendacao: Recomendacao
  onToggle: (id: string, util: boolean, helpfulCount: number) => void
}) {
  const [sending, setSending] = useState(false)

  async function handleClick() {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/recommendations/${recomendacao.id}/util`, { method: 'POST' })
      if (res.status === 401) return
      if (res.ok) {
        const body = await res.json() as { util: boolean; helpfulCount: number }
        onToggle(recomendacao.id, body.util, body.helpfulCount)
      }
    } catch { /* silencioso */ } finally { setSending(false) }
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 12px', borderRadius: '100px',
        border: recomendacao.reactedByMe ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
        background: recomendacao.reactedByMe ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
        color: recomendacao.reactedByMe ? '#22c55e' : 'rgba(255,255,255,0.45)',
        fontSize: '11px', fontWeight: 700, cursor: sending ? 'default' : 'pointer',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      👍 Útil {recomendacao.helpful_count > 0 ? `(${recomendacao.helpful_count})` : ''}
    </button>
  )
}

function RecomendacaoCard({ recomendacao, onToggle }: {
  recomendacao: Recomendacao
  onToggle: (id: string, util: boolean, helpfulCount: number) => void
}) {
  const nome = recomendacao.author?.nome ?? 'Alguém'
  return (
    <div style={{
      background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', padding: '14px',
    }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
        {recomendacao.author?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recomendacao.author.avatarUrl}
            alt={nome}
            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#15803d,#4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 900, color: 'white',
          }}>
            {iniciais(recomendacao.author?.nome ?? null)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white' }}>{nome}</p>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            {recomendacao.role_label ? `${recomendacao.role_label} · ` : ''}{dataRelativa(recomendacao.created_at)}
          </p>
        </div>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic' }}>
        &ldquo;{recomendacao.body}&rdquo;
      </p>
      <UtilButton recomendacao={recomendacao} onToggle={onToggle} />
    </div>
  )
}

function NovaRecomendacaoForm({ subjectId, onCriada }: {
  subjectId: string
  onCriada: (r: Recomendacao) => void
}) {
  const [aberto, setAberto]   = useState(false)
  const [roleLabel, setRole]  = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    setErro(null)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, roleLabel, body }),
      })
      const data = await res.json() as { recomendacao?: Recomendacao; error?: string }
      if (!res.ok || !data.recomendacao) {
        setErro(data.error ?? 'Não foi possível salvar.')
        return
      }
      onCriada(data.recomendacao)
      setBody('')
      setRole('')
      setAberto(false)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontWeight: 700, fontSize: '12px',
          cursor: 'pointer', fontFamily: 'system-ui, sans-serif', alignSelf: 'flex-start',
        }}
      >
        + Deixar recomendação
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '14px', padding: '14px',
    }}>
      <input
        value={roleLabel}
        onChange={e => setRole(e.target.value)}
        placeholder="Sua relação (ex: Treinador no Clube X)"
        style={{
          padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none',
          fontFamily: 'system-ui, sans-serif',
        }}
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Escreva sua recomendação…"
        required
        rows={3}
        style={{
          padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none',
          resize: 'vertical', fontFamily: 'system-ui, sans-serif',
        }}
      />
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171', padding: '6px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {erro}
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={sending || !body.trim()}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(160deg,#166534 0%,#22c55e 100%)',
            color: 'white', fontWeight: 800, fontSize: '12px',
            cursor: sending ? 'default' : 'pointer', opacity: !body.trim() ? 0.5 : 1,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {sending ? 'Enviando…' : 'Enviar recomendação'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '12px',
            cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function RecomendacoesSection({
  subjectId, isOwner, limit = 3, showViewAllLink = false,
}: {
  subjectId: string
  isOwner: boolean
  limit?: number
  showViewAllLink?: boolean
}) {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[] | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let ativo = true
    fetch(`/api/recommendations?subjectId=${subjectId}&limit=${limit}`)
      .then(res => res.json())
      .then((data: { recommendations: Recomendacao[]; total: number }) => {
        if (!ativo) return
        setRecomendacoes(data.recommendations ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => { if (ativo) setRecomendacoes([]) })
    return () => { ativo = false }
  }, [subjectId, limit])

  function handleToggleReacao(id: string, util: boolean, helpfulCount: number) {
    setRecomendacoes(prev => prev?.map(r => r.id === id ? { ...r, reactedByMe: util, helpful_count: helpfulCount } : r) ?? prev)
  }

  function handleCriada(r: Recomendacao) {
    setRecomendacoes(prev => [r, ...(prev ?? [])].slice(0, limit))
    setTotal(t => t + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          💬 Recomendações
        </p>
        {showViewAllLink && total > limit && (
          <a href={`/jogador/${subjectId}/recomendacoes`} style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Ver todas ({total}) →
          </a>
        )}
      </div>

      {!isOwner && <NovaRecomendacaoForm subjectId={subjectId} onCriada={handleCriada} />}

      {recomendacoes === null && (
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Carregando…</p>
      )}

      {recomendacoes !== null && recomendacoes.length === 0 && (
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)', padding: '10px 0' }}>
          Ainda não há recomendações por aqui.
        </p>
      )}

      {recomendacoes?.map(r => (
        <RecomendacaoCard key={r.id} recomendacao={r} onToggle={handleToggleReacao} />
      ))}
    </div>
  )
}

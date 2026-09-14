'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Autor = { id: string; nome: string | null; avatarUrl: string | null }
type Mensagem = { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function horaCurta(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ThreadView({ conversationId, meId, otherUser }: {
  conversationId: string
  meId: string
  otherUser: Autor | null
}) {
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  function adicionarMensagem(msg: Mensagem) {
    setMensagens(prev => {
      const base = prev ?? []
      if (base.some(m => m.id === msg.id)) return base
      return [...base, msg]
    })
  }

  // Carrega histórico (e marca como lidas as do outro participante)
  useEffect(() => {
    let ativo = true
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(res => res.json())
      .then((data: { messages: Mensagem[] }) => { if (ativo) setMensagens(data.messages ?? []) })
      .catch(() => { if (ativo) setMensagens([]) })
    return () => { ativo = false }
  }, [conversationId])

  // Supabase Realtime — novas mensagens na conversa aberta.
  //
  // O client do @supabase/ssr (createBrowserClient) não propaga sozinho o
  // access_token da sessão pro client de Realtime antes de assinar um canal —
  // sem o setAuth explícito abaixo, a assinatura fica "SUBSCRIBED" mas a RLS
  // de messages nunca deixa nenhum evento passar (o socket conecta como
  // anônimo). Confirmado testando: sem isso, zero eventos chegavam mesmo com
  // a policy correta e a tabela já na publicação supabase_realtime.
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelado = false

    async function assinar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await supabase.realtime.setAuth(session.access_token)
      if (cancelado) return
      channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          payload => adicionarMensagem(payload.new as Mensagem),
        )
        .subscribe()
    }
    assinar().catch(() => { /* Realtime indisponível — mensagens seguem aparecendo ao reenviar/recarregar */ })

    return () => { cancelado = true; if (channel) supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [mensagens?.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    setSending(true)
    const corpo = texto.trim()
    setTexto('')
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: corpo }),
      })
      if (res.ok) {
        const data = await res.json() as { message: Mensagem }
        adicionarMensagem(data.message)
      } else {
        setTexto(corpo) // devolve o texto se falhou
      }
    } catch {
      setTexto(corpo)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {otherUser?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={otherUser.avatarUrl} alt={otherUser.nome ?? ''} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#15803d,#4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 900, color: 'white',
          }}>
            {iniciais(otherUser?.nome ?? null)}
          </div>
        )}
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'white' }}>{otherUser?.nome ?? 'Perfil'}</p>
      </div>

      {/* Mensagens */}
      <div style={{ minHeight: '320px', maxHeight: '480px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mensagens === null && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Carregando…</p>
        )}
        {mensagens !== null && mensagens.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 'auto 0' }}>
            Diga oi 👋 — essa é a primeira mensagem da conversa.
          </p>
        )}
        {mensagens?.map(m => {
          const minha = m.sender_id === meId
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: minha ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '9px 13px', borderRadius: '14px',
                background: minha ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.05)',
                border: minha ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: minha ? '#d1fae5' : 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {m.body}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
                  {horaCurta(m.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={fimRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escreva uma mensagem…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none',
            fontFamily: 'system-ui, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={sending || !texto.trim()}
          style={{
            padding: '10px 20px', borderRadius: '100px', border: 'none',
            background: 'linear-gradient(160deg,#166534 0%,#22c55e 100%)',
            color: 'white', fontWeight: 800, fontSize: '13px',
            cursor: sending ? 'default' : 'pointer', opacity: !texto.trim() ? 0.5 : 1,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

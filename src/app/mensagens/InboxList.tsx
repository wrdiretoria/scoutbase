'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Autor = { id: string; nome: string | null; avatarUrl: string | null }
type Conversa = {
  id: string
  other: Autor | null
  lastMessage: { body: string; created_at: string; sender_id: string } | null
  unread: boolean
}

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function dataRelativa(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias <= 0) {
    const horas = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000)
    if (horas < 1) return 'agora'
    return `${horas}h`
  }
  if (dias === 1) return 'ontem'
  if (dias < 7) return `${dias}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function InboxList() {
  const [conversas, setConversas] = useState<Conversa[] | null>(null)

  useEffect(() => {
    let ativo = true
    fetch('/api/conversations')
      .then(res => res.json())
      .then((data: { conversations: Conversa[] }) => { if (ativo) setConversas(data.conversations ?? []) })
      .catch(() => { if (ativo) setConversas([]) })
    return () => { ativo = false }
  }, [])

  if (conversas === null) {
    return <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)', padding: '30px 0' }}>Carregando…</p>
  }

  if (conversas.length === 0) {
    return (
      <div style={{
        background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '24px', textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          Nenhuma conversa ainda. Mande uma mensagem a partir do perfil de alguém da sua rede.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {conversas.map(c => (
        <Link
          key={c.id}
          href={`/mensagens/${c.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: '#0b1610', border: c.unread ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '12px 14px', textDecoration: 'none',
          }}
        >
          {c.other?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.other.avatarUrl} alt={c.other.nome ?? ''} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#15803d,#4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 900, color: 'white',
            }}>
              {iniciais(c.other?.nome ?? null)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: c.unread ? 800 : 700, color: 'white' }}>
              {c.other?.nome ?? 'Perfil'}
            </p>
            <p style={{
              margin: 0, fontSize: '12px', color: c.unread ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
              fontWeight: c.unread ? 700 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {c.lastMessage?.body ?? 'Diga oi 👋'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
            {c.lastMessage && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{dataRelativa(c.lastMessage.created_at)}</span>
            )}
            {c.unread && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

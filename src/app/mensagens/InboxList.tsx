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

  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [soNaoLidas, setSoNaoLidas] = useState(false)

  useEffect(() => {
    let ativo = true
    fetch('/api/conversations')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar conversas')
        return res.json()
      })
      .then((data: { conversations: Conversa[] }) => { if (ativo) setConversas(data.conversations ?? []) })
      .catch(() => { if (ativo) setFalhou(true) })
    return () => { ativo = false }
  }, [tentativa]

  if (falhou) {
    return <div role="alert" style={{ padding: 20, background: '#121f18', borderRadius: 14, color: '#f0f6f1' }}>
      <p>Não foi possível carregar suas mensagens.</p>
      <button type="button" onClick={() => { setFalhou(false); setTentativa(atual => atual + 1) }} style={{ minHeight: 44, color: '#b3f737' }}>
        Tentar novamente
      </button>
    </div>
  }

  if (conversas === null) {
    return <p style={{ textAlign: 'center', fontSize: '13px', color: '#aebdb4', padding: '30px 0' }}>Carregando…</p>
  }

  if (conversas.length === 0) {
    return (
      <div style={{
        background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '24px', textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#c4d0c9' }}>
          Nenhuma conversa ainda. Abra um perfil para começar uma conversa.
        </p>
        <Link href="/ranking" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#b3f737', fontWeight: 700 }}>Explorar atletas</Link>
      </div>
    )
  }

  const naoLidas = conversas.filter(conversa => conversa.unread)
  const visiveis = soNaoLidas ? naoLidas : conversas

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div role="group" aria-label="Filtrar mensagens" style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {[false, true].map(filtro => (
          <button key={String(filtro)} type="button" aria-pressed={soNaoLidas === filtro}
            onClick={() => setSoNaoLidas(filtro)}
            style={{ minHeight: 44, padding: '0 14px', border: '1px solid #385346', borderRadius: 10, fontWeight: 800, background: soNaoLidas === filtro ? '#b3f737' : '#121f18', color: soNaoLidas === filtro ? '#13200b' : '#f0f6f1' }}>
            {filtro ? `Não lidas (${naoLidas.length})` : 'Todas'}
          </button>
        ))}
      </div>
      {visiveis.length === 0 && <p style={{ color: '#c4d0c9' }}>Você está em dia. Nenhuma conversa não lida.</p>}
      {visiveis.map(c => (
        <Link
          key={c.id}
          href={`/mensagens/${c.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: c.unread ? '#16251a' : '#0b1610', border: c.unread ? '1px solid #627b3d' : '1px solid #304239',
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
              margin: 0, fontSize: '12px', color: c.unread ? '#f0f6f1' : '#aebdb4',
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
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b3f737' }}>Não lida</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MensagemButton({ subjectId }: { subjectId: string }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleClick() {
    if (sending) return
    setSending(true)
    setErro(null)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: subjectId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json() as { conversationId?: string; error?: string }
      if (!res.ok || !data.conversationId) {
        setErro(data.error ?? 'Não foi possível abrir a conversa.')
        return
      }
      router.push(`/mensagens/${data.conversationId}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        onClick={handleClick}
        disabled={sending}
        style={{
          flex: 1, width: '100%', padding: '13px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '13px',
          cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {sending ? 'Abrindo…' : 'Mensagem'}
      </button>
      {erro && (
        <p style={{
          margin: 0, fontSize: '11px', color: '#f87171', padding: '6px 10px',
          borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {erro}
        </p>
      )}
    </div>
  )
}

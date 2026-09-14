'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CandidatarButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [erro, setErro]     = useState<string | null>(null)

  async function handleClick() {
    if (status === 'sending' || status === 'sent') return
    setStatus('sending')
    setErro(null)
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/applications`, { method: 'POST' })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        if (res.status === 409) { setStatus('sent'); return } // já candidatado — trata como sucesso
        setErro(body.error ?? 'Não foi possível se candidatar.')
        setStatus('error')
        return
      }
      setStatus('sent')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setStatus('error')
    }
  }

  const habilitado = status === 'idle' || status === 'error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <button
        onClick={handleClick}
        disabled={!habilitado}
        style={{
          padding: '10px 18px', borderRadius: '10px', border: 'none',
          background: status === 'sent'
            ? 'rgba(34,197,94,0.15)'
            : 'linear-gradient(160deg,#166534 0%,#22c55e 100%)',
          color: status === 'sent' ? '#22c55e' : 'white',
          fontWeight: 800, fontSize: '13px',
          cursor: habilitado ? 'pointer' : 'default',
          fontFamily: 'system-ui, sans-serif',
          opacity: status === 'sending' ? 0.7 : 1,
        }}
      >
        {status === 'sending' ? 'Enviando…' : status === 'sent' ? 'Candidatura enviada ✓' : 'Candidatar-se'}
      </button>
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171' }}>{erro}</p>
      )}
    </div>
  )
}

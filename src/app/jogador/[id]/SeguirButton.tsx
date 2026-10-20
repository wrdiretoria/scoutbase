'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SeguirButton({ subjectId }: { subjectId: string }) {
  const router = useRouter()
  const [seguindo, setSeguindo] = useState(false)
  const [anon, setAnon]         = useState(false)
  const [checking, setChecking] = useState(true)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    let ativo = true
    fetch('/api/seguir')
      .then(async res => {
        if (!ativo) return
        if (res.status === 401) { setAnon(true); return }
        const data = await res.json() as { seguindo: string[] }
        setSeguindo(data.seguindo.includes(subjectId))
      })
      .catch(() => {})
      .finally(() => { if (ativo) setChecking(false) })
    return () => { ativo = false }
  }, [subjectId])

  async function handleClick() {
    if (sending || checking) return
    if (anon) { router.push('/login'); return }

    setSending(true)
    try {
      const res = await fetch('/api/seguir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followeeId: subjectId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (res.ok) {
        const body = await res.json() as { seguindo: boolean }
        setSeguindo(body.seguindo)
      }
    } catch {
      // silencioso — botão volta ao estado anterior
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending || checking}
      style={{
        flex: 1, padding: '13px', borderRadius: '12px',
        border: seguindo ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
        background: seguindo ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
        color: seguindo ? '#22c55e' : 'rgba(255,255,255,0.7)',
        fontWeight: 800, fontSize: '13px',
        cursor: sending || checking ? 'default' : 'pointer',
        opacity: checking ? 0.6 : 1,
        fontFamily: 'system-ui, sans-serif',
        transition: 'all .15s',
      }}
    >
      {seguindo ? 'Seguindo ✓' : 'Seguir'}
    </button>
  )
}

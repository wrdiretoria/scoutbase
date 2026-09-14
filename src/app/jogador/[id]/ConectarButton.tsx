'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'checking' | 'none' | 'pending_out' | 'pending_in' | 'accepted'

type ConexaoResumo = { requester_id: string; addressee_id: string }
type ConexoesResposta = {
  aceitas: ConexaoResumo[]
  pendentesRecebidas: ConexaoResumo[]
  pendentesEnviadas: ConexaoResumo[]
}

function encontrarStatus(data: ConexoesResposta, subjectId: string): Status {
  if (data.aceitas.some(c => c.requester_id === subjectId || c.addressee_id === subjectId)) return 'accepted'
  if (data.pendentesEnviadas.some(c => c.addressee_id === subjectId)) return 'pending_out'
  if (data.pendentesRecebidas.some(c => c.requester_id === subjectId)) return 'pending_in'
  return 'none'
}

const LABEL: Record<Status, string> = {
  checking:     'Conectar',
  none:         'Conectar',
  pending_out:  'Solicitação enviada',
  pending_in:   'Solicitação pendente',
  accepted:     'Conectado ✓',
}

export default function ConectarButton({ subjectId }: { subjectId: string }) {
  const router = useRouter()
  const [status, setStatus]   = useState<Status>('checking')
  const [anon, setAnon]       = useState(false)
  const [sending, setSending] = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    fetch('/api/conexoes')
      .then(async res => {
        if (!ativo) return
        if (res.status === 401) { setAnon(true); setStatus('none'); return }
        const data = await res.json() as ConexoesResposta
        setStatus(encontrarStatus(data, subjectId))
      })
      .catch(() => { if (ativo) setStatus('none') })
    return () => { ativo = false }
  }, [subjectId])

  async function handleClick() {
    if (status !== 'none' || sending) return
    if (anon) { router.push('/login'); return }

    setSending(true)
    setErro(null)
    try {
      const res = await fetch('/api/conexoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: subjectId }),
      })
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setErro(body.error ?? 'Não foi possível enviar a solicitação.')
        // Ressincroniza — pode já existir uma conexão que não víamos ainda
        const check = await fetch('/api/conexoes')
        if (check.ok) setStatus(encontrarStatus(await check.json() as ConexoesResposta, subjectId))
        return
      }
      setStatus('pending_out')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  const habilitado = status === 'none' && !sending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        onClick={handleClick}
        disabled={!habilitado}
        style={{
          flex: 1, width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
          background: habilitado
            ? 'linear-gradient(160deg,#166534 0%,#22c55e 100%)'
            : 'rgba(255,255,255,0.06)',
          color: habilitado ? 'white' : 'rgba(255,255,255,0.4)',
          fontWeight: 800, fontSize: '13px',
          cursor: habilitado ? 'pointer' : 'default',
          fontFamily: 'system-ui, sans-serif',
          boxShadow: habilitado ? '0 4px 18px rgba(34,197,94,0.28)' : 'none',
          transition: 'filter .15s, transform .1s',
        }}
      >
        {sending ? 'Enviando…' : LABEL[status]}
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

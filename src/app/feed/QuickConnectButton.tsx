'use client'

import { useEffect, useState } from 'react'

type Sugestao = { id: string; nome: string | null; avatarUrl: string | null }

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function LinhaSugestao({ pessoa, onConectado }: { pessoa: Sugestao; onConectado: (id: string) => void }) {
  const [sending, setSending] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleClick() {
    if (sending || enviado) return
    setSending(true)
    try {
      const res = await fetch('/api/conexoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: pessoa.id }),
      })
      if (res.ok) {
        setEnviado(true)
        setTimeout(() => onConectado(pessoa.id), 900)
      }
    } catch { /* silencioso */ } finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {pessoa.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pessoa.avatarUrl} alt={pessoa.nome ?? ''} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#15803d,#4ade80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 900, color: 'white',
        }}>
          {iniciais(pessoa.nome)}
        </div>
      )}
      <p style={{ margin: 0, flex: 1, fontSize: '12px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {pessoa.nome ?? 'Perfil'}
      </p>
      <button
        onClick={handleClick}
        disabled={sending || enviado}
        title={enviado ? 'Solicitação enviada' : 'Conectar'}
        style={{
          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
          border: enviado ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.15)',
          background: enviado ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
          color: enviado ? '#22c55e' : 'rgba(255,255,255,0.6)',
          fontSize: '13px', fontWeight: 800, cursor: sending || enviado ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {enviado ? '✓' : '+'}
      </button>
    </div>
  )
}

export default function QuickConnectButton() {
  const [sugestoes, setSugestoes] = useState<Sugestao[] | null>(null)

  useEffect(() => {
    let ativo = true
    fetch('/api/network-suggestions')
      .then(res => res.json())
      .then((data: { suggestions: Sugestao[] }) => { if (ativo) setSugestoes(data.suggestions ?? []) })
      .catch(() => { if (ativo) setSugestoes([]) })
    return () => { ativo = false }
  }, [])

  function remover(id: string) {
    setSugestoes(prev => prev?.filter(p => p.id !== id) ?? prev)
  }

  if (sugestoes === null) {
    return <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Carregando…</p>
  }

  if (sugestoes.length === 0) {
    return <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Sem sugestões no momento.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sugestoes.map(p => (
        <LinhaSugestao key={p.id} pessoa={p} onConectado={remover} />
      ))}
    </div>
  )
}

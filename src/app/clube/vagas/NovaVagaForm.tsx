'use client'

import { useState } from 'react'

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Atacante', 'Centro-Avante',
]
const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none',
  fontFamily: 'system-ui, sans-serif',
}

type Vaga = {
  id: string; title: string; position: string | null; category: string | null
  city: string | null; description: string | null; status: string; created_at: string
}

export default function NovaVagaForm({ onCriada }: { onCriada: (v: Vaga) => void }) {
  const [aberto, setAberto]         = useState(false)
  const [title, setTitle]           = useState('')
  const [position, setPosition]     = useState('')
  const [category, setCategory]     = useState('')
  const [city, setCity]             = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending]       = useState(false)
  const [erro, setErro]             = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || sending) return
    setSending(true)
    setErro(null)
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, position, category, city, description }),
      })
      const data = await res.json() as { opportunity?: Vaga; error?: string }
      if (!res.ok || !data.opportunity) {
        setErro(data.error ?? 'Não foi possível criar a vaga.')
        return
      }
      onCriada(data.opportunity)
      setTitle(''); setPosition(''); setCategory(''); setCity(''); setDescription('')
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
          width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontWeight: 800, fontSize: '14px',
          cursor: 'pointer', fontFamily: 'system-ui, sans-serif', marginBottom: '20px',
        }}
      >
        + Publicar nova vaga
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px',
      background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '16px', padding: '16px',
    }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título da vaga (ex: Lateral direito Sub-15)"
        required
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select value={position} onChange={e => setPosition(e.target.value)} style={{ ...inputStyle, flex: '1 1 140px' }}>
          <option value="">Posição (opcional)</option>
          {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, flex: '1 1 120px' }}>
          <option value="">Categoria (opcional)</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <input
        value={city}
        onChange={e => setCity(e.target.value)}
        placeholder="Cidade (opcional)"
        style={inputStyle}
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171', padding: '6px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {erro}
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={sending || !title.trim()}
          style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(160deg,#166534 0%,#22c55e 100%)',
            color: 'white', fontWeight: 800, fontSize: '13px',
            cursor: sending ? 'default' : 'pointer', opacity: !title.trim() ? 0.5 : 1,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {sending ? 'Publicando…' : 'Publicar vaga'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          style={{
            padding: '11px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

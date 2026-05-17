'use client'

import { useState } from 'react'

export default function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // fallback: selecionar texto
      window.prompt('Copie o link:', url)
    }
  }

  return (
    <button
      onClick={copiar}
      style={{
        flex: 1, padding: '12px', borderRadius: '12px',
        background: copiado ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${copiado ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.2)'}`,
        color: '#22c55e', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        fontFamily: 'system-ui, sans-serif',
        transition: 'background .2s, border-color .2s',
      }}
    >
      {copiado ? '✓ Copiado!' : '🔗 Copiar link'}
    </button>
  )
}

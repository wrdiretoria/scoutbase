'use client'

import { useState } from 'react'

export default function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {
      // fallback: seleciona o texto para o usuário copiar manualmente
    })
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
      {/* URL display */}
      <div style={{
        flex: 1, padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        fontSize: '13px', color: 'rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        fontFamily: 'monospace',
      }}>
        {url}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          padding: '10px 18px', borderRadius: '10px', border: 'none',
          cursor: 'pointer', flexShrink: 0,
          background: copied ? '#16a34a' : '#22c55e',
          color: 'black', fontWeight: 700, fontSize: '13px',
          transition: 'background 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? '✓ Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ url }).catch(() => copyToClipboard(url))
    } else {
      copyToClipboard(url)
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {
      // fallback silencioso
    })
  }

  return (
    <button
      onClick={handleShare}
      style={{
        width: '100%',
        padding: '13px',
        borderRadius: '14px',
        background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#22c55e' : 'rgba(255,255,255,0.45)',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'system-ui, sans-serif',
        letterSpacing: '0.02em',
      }}
    >
      {copied ? '✓ Link copiado!' : '🔗 Compartilhar perfil'}
    </button>
  )
}

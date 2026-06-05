'use client'

import { useEffect, useState } from 'react'

export default function IosPwaPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Detecta iOS Safari (inclui Chrome/Firefox no iOS que também usam WebKit)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    // Detecta se já está instalado como PWA (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (isIos && !isStandalone) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  function dismiss() {
    setShow(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'rgba(10,22,14,0.98)',
      borderTop: '1px solid rgba(0,255,136,0.25)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
      fontFamily: 'system-ui, sans-serif',
      WebkitTapHighlightColor: 'transparent',
    }}>
      {/* Linha única compacta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'white' }}>Instalar Meu Craque</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            Toque em{' '}
            <svg style={{ display: 'inline', verticalAlign: 'middle' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
            {' '}→ <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Adicionar à Tela de Início</strong>
          </p>
        </div>
        <button
          onClick={dismiss}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20,
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, flexShrink: 0,
            WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function IosPwaPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Detecta iOS Safari
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    // Detecta se já está instalado como PWA (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    // Verifica se o usuário já fechou o banner antes
    const dismissed = sessionStorage.getItem('iosPwaDismissed')

    if (isIos && !isStandalone && !dismissed) {
      // Aguarda 3s para não aparecer imediatamente
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  if (!show) return null

  function dismiss() {
    sessionStorage.setItem('iosPwaDismissed', '1')
    setShow(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
      background: 'rgba(10,22,14,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.2)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', gap: '12px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Meu Craque" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'white' }}>Instalar Meu Craque</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Adicione à tela de início</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.4)', fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Instruções */}
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(0,255,136,0.06)',
        border: '1px solid rgba(0,255,136,0.15)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>1️⃣</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            Toque no botão de compartilhar{' '}
            <svg style={{ display: 'inline', verticalAlign: 'middle', marginBottom: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            {' '}na barra do Safari
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>2️⃣</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            Role para baixo e toque em <strong style={{ color: 'white' }}>"Adicionar à Tela de Início"</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

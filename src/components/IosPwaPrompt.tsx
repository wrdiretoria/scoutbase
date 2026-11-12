'use client'

import { useEffect, useState } from 'react'

type InstallPrompt = Event & {
  prompt(): Promise<unknown>
}

const dismissalKey = 'meucraque:install-dismissed'

export default function PwaInstallBanner() {
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)')
    const appleNavigator = navigator as Navigator & { standalone?: boolean }
    if (standalone.matches || appleNavigator.standalone) return

    try {
      if (sessionStorage.getItem(dismissalKey)) return
    } catch { /* O banner continua disponível sem armazenamento. */ }

    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

    function onInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as InstallPrompt)
    }

    function onInstalled() {
      setDismissed(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    try { sessionStorage.setItem(dismissalKey, '1') } catch { /* Oculta na página atual. */ }
  }

  async function install() {
    if (!installPrompt) return
    const prompt = installPrompt
    setInstallPrompt(null)
    try {
      await prompt.prompt()
    } catch {
      setInstallPrompt(prompt)
    }
  }

  if (dismissed || (!isIos && !installPrompt)) return null

  return (
    <aside aria-label="Instalar MeuCraque" style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
      marginTop: 12, padding: '8px 10px', border: '1px solid #385346',
      borderRadius: 14, background: 'var(--mc-surface)', color: '#f0f6f1',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={36} height={36} style={{ borderRadius: 8 }} />
      <div style={{ flex: '1 1 145px' }}>
        <strong style={{ display: 'block', fontSize: 14 }}>Instalar MeuCraque</strong>
        <p style={{ margin: 0, fontSize: 12, color: '#c4d0c9' }}>
          {installPrompt ? 'Adicione o app à sua tela inicial.' : 'No Safari, toque em Compartilhar → Adicionar à Tela de Início.'}
        </p>
      </div>
      {installPrompt && (
        <button type="button" className="mc-primary-action" onClick={() => void install()}
          style={{ minHeight: 44, padding: '0 12px', border: 0, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
          Instalar
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Fechar banner de instalação"
        style={{ width: 44, height: 44, border: 0, background: 'transparent', color: 'inherit', fontSize: 24, cursor: 'pointer' }}>
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  )
}

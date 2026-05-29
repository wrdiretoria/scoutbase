'use client'

import { useEffect } from 'react'

/**
 * Registra o Service Worker (/public/sw.js) no browser.
 * Componente client sem UI — montado uma vez no RootLayout.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] registrado:', reg.scope)
        })
        .catch((err) => {
          console.warn('[SW] falha no registro:', err)
        })
    }
  }, [])

  return null
}

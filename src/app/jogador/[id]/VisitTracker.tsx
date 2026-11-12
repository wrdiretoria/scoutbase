'use client'

import { useEffect } from 'react'

/**
 * Componente invisível — dispara POST /api/atleta/visita
 * logo que a página pública do jogador é renderizada no browser.
 */
export default function VisitTracker({ athleteUserId }: { athleteUserId: string }) {
  useEffect(() => {
    const key  = `visit_${athleteUserId}`
    let last: string | null = null
    try { last = localStorage.getItem(key) } catch { /* armazenamento indisponível */ }
    const now  = Date.now()
    if (last && now - parseInt(last) < 24 * 60 * 60 * 1000) return   // 24h por visitante

    fetch('/api/atleta/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteUserId }),
    }).then(async response => {
      if (response.ok && (await response.json()).ok === true) localStorage.setItem(key, String(now))
    })
      .catch(() => {/* silencioso */})
  }, [athleteUserId])

  return null
}

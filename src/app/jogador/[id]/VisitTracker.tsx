'use client'

import { useEffect } from 'react'

/**
 * Componente invisível — dispara POST /api/atleta/visita
 * logo que a página pública do jogador é renderizada no browser.
 */
export default function VisitTracker({ athleteUserId }: { athleteUserId: string }) {
  useEffect(() => {
    const key  = `visit_${athleteUserId}`
    const last = localStorage.getItem(key)
    const now  = Date.now()
    if (last && now - parseInt(last) < 24 * 60 * 60 * 1000) return   // 24h por visitante

    fetch('/api/atleta/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteUserId }),
    }).then(() => localStorage.setItem(key, String(now)))
      .catch(() => {/* silencioso */})
  }, [athleteUserId])

  return null
}

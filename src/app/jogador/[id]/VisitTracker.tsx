'use client'

import { useEffect } from 'react'

/**
 * Componente invisível — dispara POST /api/atleta/visita
 * logo que a página pública do jogador é renderizada no browser.
 */
export default function VisitTracker({ athleteUserId }: { athleteUserId: string }) {
  useEffect(() => {
    fetch('/api/atleta/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteUserId }),
    }).catch(() => {/* silencioso */})
  }, [athleteUserId])

  return null
}

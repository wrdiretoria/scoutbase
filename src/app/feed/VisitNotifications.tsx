'use client'

import { useState, type ReactNode } from 'react'

type Visits = { semana: number; total: number }

export default function VisitNotifications({ icon }: { icon: ReactNode }) {
  const [visits, setVisits] = useState<Visits | null>(null)
  const [failed, setFailed] = useState(false)

  async function loadVisits() {
    setFailed(false)
    try {
      const response = await fetch('/api/atleta/visitas', { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar visitas')
      setVisits(await response.json())
    } catch {
      setVisits(null)
      setFailed(true)
    }
  }

  return (
    <details style={{ position: 'relative' }} onToggle={event => {
      if (event.currentTarget.open) void loadVisits()
    }}>
      <summary aria-label="Notificações de visitas" style={{ listStyle: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 44, height: 44 }}>
        {icon}
      </summary>
      <div role="status" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, width: 'min(240px, 75vw)', padding: 14, border: '1px solid #425747', borderRadius: 12, background: '#101827', color: '#fff' }}>
        <strong>Visitas ao seu perfil</strong>
        {failed ? <p>Não foi possível carregar as visitas.</p> : visits ? (
          <>
            <p><strong>{visits.semana.toLocaleString('pt-BR')}</strong> nos últimos 7 dias</p>
            <p><strong>{visits.total.toLocaleString('pt-BR')}</strong> no total</p>
          </>
        ) : <p>Carregando visitas…</p>}
      </div>
    </details>
  )
}

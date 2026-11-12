'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Visits = { semana: number; total: number }

export default function VisitNotifications({ icon, ownerId }: { icon: ReactNode; ownerId: string }) {
  const [visits, setVisits] = useState<Visits | null>(null)
  const [seen, setSeen] = useState(0)
  const [failed, setFailed] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const storageKey = `meucraque:visitas-lidas:${ownerId}`
  const unread = Math.max(0, (visits?.total ?? 0) - seen)

  function markRead(total: number) {
    setSeen(total)
    try { localStorage.setItem(storageKey, String(total)) } catch { /* leitura vale nesta página */ }
  }

  useEffect(() => {
    try { setSeen(Number(localStorage.getItem(storageKey)) || 0) } catch { setSeen(0) }

    let request: AbortController | undefined
    async function refresh() {
      request?.abort()
      request = new AbortController()
      const { signal } = request
      try {
        const response = await fetch('/api/atleta/visitas', { cache: 'no-store', signal })
        if (!response.ok) throw new Error('Falha ao carregar visitas')
        const latest = await response.json() as Visits
        if (signal.aborted) return
        setVisits(latest)
        setFailed(false)
        if (detailsRef.current?.open) {
          setSeen(latest.total)
          try { localStorage.setItem(storageKey, String(latest.total)) } catch { /* leitura vale nesta página */ }
        }
      } catch {
        if (!signal.aborted) setFailed(true)
      }
    }

    function syncRead(event: StorageEvent) {
      if (event.key === storageKey) setSeen(Number(event.newValue) || 0)
    }

    void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', syncRead)
    return () => {
      request?.abort()
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', syncRead)
    }
  }, [storageKey])

  return (
    <details ref={detailsRef} style={{ position: 'relative' }} onToggle={event => {
      if (event.currentTarget.open && visits) markRead(visits.total)
    }}>
      <summary aria-label={unread > 0 ? `Notificações de visitas, ${unread} novas` : 'Notificações de visitas'} style={{ position: 'relative', listStyle: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 44, height: 44 }}>
        {icon}
        {unread > 0 && <span aria-hidden="true" style={{ position: 'absolute', right: 2, top: 1, minWidth: 18, padding: '2px 4px', borderRadius: 10, background: '#b3f737', color: '#101827', fontSize: 10, fontWeight: 800, textAlign: 'center' }}>{unread > 99 ? '99+' : unread}</span>}
      </summary>
      <div role="status" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, width: 'min(240px, 75vw)', padding: 14, border: '1px solid #425747', borderRadius: 12, background: '#101827', color: '#fff' }}>
        <strong>Visitas ao seu perfil</strong>
        {visits ? (
          <>
            <p><strong>{visits.semana.toLocaleString('pt-BR')}</strong> nos últimos 7 dias</p>
            <p><strong>{visits.total.toLocaleString('pt-BR')}</strong> no total</p>
          </>
        ) : <p>{failed ? 'Não foi possível carregar as visitas.' : 'Carregando visitas…'}</p>}
      </div>
    </details>
  )
}

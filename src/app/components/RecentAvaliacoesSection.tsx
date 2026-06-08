'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { FeedEvent } from '@/app/api/landing/livefeed/route'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export default function RecentAvaliacoesSection() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/landing/livefeed?limit=8')
      .then(r => r.ok ? r.json() : null)
      .then((json: { events: FeedEvent[] } | null) => {
        if (!json) return
        // Filtra apenas avaliações recentes (tipo='avaliacao')
        const avs = json.events.filter(e => e.tipo === 'avaliacao')
        setEvents(avs)
      })
      .catch(() => {/* silencioso */})
      .finally(() => setLoading(false))
  }, [])

  // Seção oculta se não houver avaliações recentes
  if (!loading && events.length === 0) return null

  return (
    <section style={{ background: '#080808', padding: '16px 0' }}>
      <style>{`.recem-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
            📋 Últimas avaliações
          </p>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Recém <span style={{ color: '#00e676' }}>Avaliados</span>
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '16px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: '180px', height: '300px', flexShrink: 0, borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : (
          <div className="recem-scroll landing-cards" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
            {events.map(e => (
              <div key={e.id} style={{ flexShrink: 0, width: '180px' }}>
                <AtletaCardLanding
                  nome={formatNome(e.nome)}
                  ovr={e.ovr}
                  foto={e.fotos[0] ?? null}
                  posicao={e.posicao || null}
                  categoria={e.cidade?.split(',')[0] || null}
                  atributos={e.atributos}
                  href={`/jogador/${e.atletaId}`}
                  athleteId={e.mcId}
                  width="180px"
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/ranking" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 32px', borderRadius: '100px',
            border: '1.5px solid rgba(0,230,118,0.40)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.08em',
          }}>
            Carregar Mais
          </Link>
        </div>

      </div>
    </section>
  )
}

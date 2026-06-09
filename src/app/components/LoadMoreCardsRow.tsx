'use client'

import { useState } from 'react'
import AtletaCardLanding from './AtletaCardLanding'
import type { MaisCard } from '@/app/api/landing/mais/route'

type Props = {
  tipo:          'destaques' | 'visitados' | 'novos'
  initialItems:  MaisCard[]
  initialOffset: number
  limit:         number
  hasMoreInit:   boolean
}

export default function LoadMoreCardsRow({
  tipo, initialItems, initialOffset, limit, hasMoreInit,
}: Props) {
  const [items, setItems]     = useState<MaisCard[]>(initialItems)
  const [offset, setOffset]   = useState(initialOffset)
  const [hasMore, setHasMore] = useState(hasMoreInit)
  const [loading, setLoading] = useState(false)

  async function carregarMais() {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/landing/mais?tipo=${tipo}&offset=${offset}&limit=${limit}`)
      const data = await res.json() as { items: MaisCard[]; hasMore: boolean }
      setItems(prev => [...prev, ...data.items])
      setOffset(prev => prev + limit)
      setHasMore(data.hasMore)
    } catch {
      // silencia erro de rede
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Scroll horizontal de cards */}
      <div className="mais-visitados-scroll landing-cards" style={{
        display: 'flex', gap: '16px',
        overflowX: 'auto', paddingBottom: '12px',
        scrollbarWidth: 'none',
      }}>
        {items.map(p => (
          <div key={p.id} style={{ flexShrink: 0, width: '180px' }}>
            <AtletaCardLanding
              nome={p.nome}
              ovr={p.ovr}
              foto={p.foto}
              posicao={p.posicao}
              categoria={p.categoria}
              atributos={null}
              href={`/jogador/${p.id}`}
              athleteId={p.athlete_id}
              width="180px"
            />
          </div>
        ))}
      </div>

      {/* Botão Carregar Mais */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={carregarMais}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 32px', borderRadius: '100px',
              border: '1.5px solid rgba(0,230,118,0.40)',
              background: 'transparent',
              color: '#00e676', fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.08em', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </button>
        </div>
      )}
    </>
  )
}
